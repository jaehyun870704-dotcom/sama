/**
 * 전투 컨트롤러. 턴 루프와 명령 실행을 담당한다.
 */
import { BattleState, PHASE_ORDER, type BattleSnapshot } from "./state.ts";
import type { Command, CommandResult } from "./commands.ts";
import { ok, fail } from "./commands.ts";
import { ccRatioChance, ccRecoverChance } from "./cc-rules.ts";
import type { StatusKind } from "./types.ts";
import { computePhysical, computeStrategy, createDamageContext, doubleAttackChance } from "./formulas.ts";
import { applyTraitHooks, capHit, counterLimitOf, ignoresRough, hasTrait, guardsAdjacent, getTrait, traitParam } from "./traits.ts";
import { troopLifesteal } from "./troop-effects.ts";
import { DialogueScript } from "./dialogue.ts";
import { runEvents } from "./events.ts";
import { advanceVictory, evaluateGroup } from "./conditions.ts";
import { manhattan, key, sameCoord, adjacent, isHostile } from "./grid.ts";
import { inReach, reachLabel, unitReachLabel } from "./reach.ts";
import { CONTROLLABLE } from "./types.ts";
import type { Unit, Coord, StrategyDef } from "./types.ts";
import { decide } from "./ai.ts";
import { ON_HIT_STATUS, BAD_STATUS } from "./treasure-traits.ts";
import { consumable } from "./equipment.ts";
import { nextEvolution } from "./classes.ts";
import { evolveUnit } from "./units.ts";

export interface BattleOptions {
  seed: number;
  strategies?: Map<string, StrategyDef>;
  /** 무르기 스택 최대 깊이. 0이면 무르기 비활성. */
  undoDepth?: number;
  /** 무한 루프 방어. 이 턴을 넘기면 강제 종료한다. */
  maxTurns?: number;
}

const NEGATIVE_STATUS = new Set<StatusKind>(["confusion", "immobile", "bound", "bleed", "burn", "shock", "seal", "weaken", "breach", "slow", "sluggish", "dispirit"]);

/** 한 방에 쓰러지지 않는 대상: 적이 아닌 부대(아군·편입 아군·우군)가 체력이 가득할 때. */
function sparesFullHp(u: Unit): boolean {
  return u.side !== "enemy" && u.hp >= u.stats.maxHp && u.stats.maxHp > 1;
}
/** 한 방 보호 중이면 체력 1을 남긴다. */
function survive(u: Unit, damage: number, full: boolean): number {
  return full ? Math.min(damage, u.hp - 1) : damage;
}

export class Battle {
  readonly state: BattleState;
  readonly dialogue: DialogueScript;
  private readonly undoStack: BattleSnapshot[] = [];
  private readonly undoDepth: number;
  private readonly maxTurns: number;
  /** 턴 내 유닛별 반격 사용 횟수 */
  private counters = new Map<string, number>();

  constructor(state: BattleState, opts: BattleOptions) {
    this.state = state;
    state.strategies = opts.strategies ?? new Map();
    this.dialogue = new DialogueScript(state.stage.dialogues ?? []);
    this.undoDepth = opts.undoDepth ?? 20;
    this.maxTurns = opts.maxTurns ?? 200;
  }

  /** 전투 시작. battle_start 이벤트를 발화시킨다. */
  start(): void {
    // "Hold for N turns" goals count from the first turn unless a scenario started the clock.
    for (const c of [...this.state.victory, ...this.state.defeat]) {
      if (c.type === "survive_turns") {
        const label = c.target ?? "default";
        if (!this.state.survivalClocks.has(label)) this.state.survivalClocks.set(label, this.state.turn);
      }
    }
    this.state.updateRegionHolds();
    runEvents(this.state, { kind: "battle_start" });
    this.beginPhase();
  }

  // ─────────────────────────────────── 명령 실행

  execute(cmd: Command): CommandResult {
    if (this.state.outcome !== "ongoing") return fail("전투가 이미 종료됨");
    if (this.state.activeDialogue && cmd.kind !== 'choose') return fail('먼저 대화를 마쳐 주세요.');
    if ('unit' in cmd) {
      const u = this.state.find(cmd.unit);
      if (!u?.alive || u.side !== this.state.currentSide || u.hasActed) return fail('지금 행동할 수 없는 부대');
      if (this.state.hasStatus(u, 'confusion') && cmd.kind !== 'wait') return fail('혼란 상태');
      if (u.unitClass === 'civilian' && ['attack', 'strategy', 'item'].includes(cmd.kind)) return fail('비전투 인물은 이 명령을 사용할 수 없습니다.');
      if (cmd.kind === 'attack') {
        const target = this.state.find(cmd.target);
        if (!target || !isHostile(u.side, target.side)) return fail('적 부대를 선택해 주세요.');
      }
    }
    if (this.undoDepth > 0 && cmd.kind !== "endPhase") this.pushUndo();

    const result = this.dispatch(cmd);
    if (!result.ok) {
      if (this.undoDepth > 0 && cmd.kind !== "endPhase") this.undoStack.pop();
      return result;
    }

    runEvents(this.state, { kind: "after_action" });
    this.checkOutcome();
    return result;
  }

  private dispatch(cmd: Command): CommandResult {
    switch (cmd.kind) {
      case "move":      return this.doMove(cmd.unit, cmd.to);
      case "attack":    return this.doAttack(cmd.unit, cmd.target);
      case "strategy":  return this.doStrategy(cmd.unit, cmd.strategy, cmd.at);
      case "capture":   return this.doCapture(cmd.unit, cmd.region);
      case "wait":      return this.doWait(cmd.unit);
      case "choose":  return this.doChoose(cmd.nodeId, cmd.optionId);
      case "item":      return this.doItem(cmd.unit, cmd.item, cmd.target);
      case "endPhase":  this.endPhase(); return ok;
    }
  }

  private doMove(unitId: string, to: Coord): CommandResult {
    const u = this.state.find(unitId);
    if (!u?.alive) return fail("유닛 없음");
    if (u.side !== this.state.currentSide) return fail("현재 페이즈의 유닛이 아님");
    if (u.hasMoved) return fail("이미 이동함");

    const reach = this.state.map.reachable(u, this.state.occupancy(), ignoresRough(u));
    if (!reach.has(key(to))) return fail(`도달 불가 좌표 ${key(to)}`);

    const from = { ...u.pos };
    u.pos = { ...to };
    u.hasMoved = true;
    u.movedThisTurn = true;
    u.movedSteps = manhattan(from, to);
    this.state.push({ t: "move", unit: u.id, from, to: u.pos });
    this.applyTileHazard(u);
    return ok;
  }

  private doAttack(attackerId: string, defenderId: string): CommandResult {
    const a = this.state.find(attackerId);
    const d = this.state.find(defenderId);
    if (!a?.alive || !d?.alive) return fail("유닛 없음");
    if (a.side !== this.state.currentSide) return fail("현재 페이즈의 유닛이 아님");
    if (a.hasActed) return fail("이미 행동함");

    const dist = manhattan(a.pos, d.pos);
    if (!inReach(a, a.pos, d.pos)) return fail(`사거리 밖 (거리 ${dist}, 사거리 ${a.range[0]}~${a.range[1]} · ${unitReachLabel(a)})`);

    this.strike(a, d, false);

    a.hasActed = true;
    a.hasMoved = true;

    // 반격: 생존 + 사거리 내 + 무반격 아님 + 반격 횟수 잔여
    let countered = false;
    if (d.alive && a.alive && this.canCounter(d, a)) {
      this.strike(d, a, true);
      this.counters.set(d.id, (this.counters.get(d.id) ?? 0) + 1);
      countered = true;
    }
    // 재반격(자웅일대검·쌍편): 상대가 반격하면 한 번 더 받아친다.
    if (countered && a.alive && d.alive && hasTrait(a, "gear:reCounter") && inReach(a, a.pos, d.pos)) {
      this.strike(a, d, true, traitParam(a, "gear:reCounter", 75) / 100);
    }
    // 인도 공격(방천화극): 상대를 퇴각시켰으면 사거리 안의 다른 적 하나를 한 번 더 친다(반격은 없다).
    if (!d.alive && a.alive && hasTrait(a, "gear:chase")) {
      const next = this.state.living().filter((t) => isHostile(a.side, t.side) && inReach(a, a.pos, t.pos))
        .sort((x, y) => x.hp - y.hp || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))[0];
      if (next) this.strike(a, next, false);
    }
    return ok;
  }

  /** 맞히면 반드시 거는 상태(여포궁·이광궁·유성추·금화관포). */
  private onHitStatus(a: Unit, d: Unit): void {
    if (!d.alive) return;
    for (const [trait, kind] of Object.entries(ON_HIT_STATUS)) if (a.traits.includes(trait)) this.state.applyStatus(d, { kind, turns: 2, magnitude: 1 });
  }

  /** 관통(사모): 맞힌 적 바로 뒤(같은 방향 한 칸)의 적도 한 번 맞는다. */
  private pierce(a: Unit, d: Unit, isCounter: boolean, powerMul?: number): void {
    const dx = d.pos.x - a.pos.x, dy = d.pos.y - a.pos.y;
    const step = dx !== 0 && dy !== 0 && Math.abs(dx) === Math.abs(dy) ? { x: Math.sign(dx), y: Math.sign(dy) }
      : Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    const t = this.state.unitAt({ x: d.pos.x + step.x, y: d.pos.y + step.y });
    if (!t?.alive || !isHostile(a.side, t.side)) return;
    const raw = computePhysical(a, t, this.state.map, this.state.rng, { isCounter, ...(powerMul !== undefined ? { powerMul } : {}) });
    const capped = raw.hit ? survive(t, capHit(t, raw.damage), sparesFullHp(t)) : raw.damage;
    if (isCounter) this.state.push({ t: "counter", attacker: a.id, defender: t.id, damage: capped, hit: raw.hit });
    else this.state.push({ t: "attack", attacker: a.id, defender: t.id, damage: capped, hit: raw.hit, critical: raw.critical });
    if (raw.hit) { this.damage(t, capped, a, true); this.onHitStatus(a, t); }
  }

  /** 한 번의 물리 타격(조조전 규칙이면 순발력 비율로 한 번 더 친다). */
  private strike(a: Unit, d: Unit, isCounter: boolean, powerMul?: number): void {
    // 체력이 가득한 아군은 한 번의 공격(연속 타격 포함)으로 쓰러지지 않는다.
    const full = sparesFullHp(d);
    // 규칙판 9: 한 번의 공격에서 잃는 체력은 연속 공격까지 합쳐 hitCap%를 넘지 않는다.
    let budget = d.hitCap && d.hitCap > 0 ? Math.max(1, Math.ceil(d.stats.maxHp * d.hitCap / 100)) : Infinity;
    const once = (double: boolean): boolean => {
      const raw = computePhysical(a, d, this.state.map, this.state.rng, { isCounter, ...(double ? { double } : {}), ...(powerMul !== undefined ? { powerMul } : {}) });
      let capped = raw.hit ? survive(d, capHit(d, raw.damage), full) : raw.damage;
      if (raw.hit && budget !== Infinity) { capped = Math.min(capped, budget); budget -= capped; }
      const res = capped === raw.damage ? raw : { ...raw, damage: capped, lethal: capped >= d.hp };
      const extra = double ? { double: true } : {};
      if (isCounter) this.state.push({ t: "counter", attacker: a.id, defender: d.id, damage: res.damage, hit: res.hit, ...(res.hit && res.tactic ? { tactic: res.tactic } : {}), ...extra });
      else this.state.push({ t: "attack", attacker: a.id, defender: d.id, damage: res.damage, hit: res.hit, critical: res.critical, ...(res.hit && res.tactic ? { tactic: res.tactic } : {}), ...extra });
      if (res.hit) { this.damage(d, res.damage, a, true); this.onHitStatus(a, d); }
      return res.hit;
    };
    once(false);
    const chance = doubleAttackChance(a, d);
    if (chance > 0 && a.alive && d.alive && this.state.rng.chance(chance)) once(true);
    if (a.alive && a.traits.includes("gear:pierceLine")) this.pierce(a, d, isCounter, powerMul);
  }

  private doStrategy(casterId: string, strategyId: string, at: Coord): CommandResult {
    const c = this.state.find(casterId);
    if (!c?.alive) return fail("유닛 없음");
    if (c.side !== this.state.currentSide) return fail("현재 페이즈의 유닛이 아님");
    if (c.hasActed) return fail("이미 행동함");

    const def = this.state.strategyFor(c, strategyId);
    if (!def) return fail(`정의되지 않은 책략: ${strategyId}`);
    if (!this.state.usableStrategies(c).includes(strategyId)) return fail("보유하지 않은 책략");
    if (c.mp < def.mpCost) return fail(`MP 부족 (필요 ${def.mpCost}, 보유 ${c.mp})`);
    if (this.state.hasStatus(c, "seal")) return fail("책략 봉인 상태");
    const global = def.shape === "global";
    if (!global && manhattan(c.pos, at) > def.range) return fail("시전 사거리 밖");

    c.mp -= def.mpCost;
    if (def.mutate) return this.castMutate(c, strategyId);
    if (def.strikes) return this.castStrikes(c, def, strategyId, at);
    // 전 맵 책략(모래폭풍 등): 지정한 칸과 상관없이 맵 위의 대상 진영 모두를 친다.
    const area = global
      ? this.state.living().filter((t) => def.targetSides.includes(t.side)).map((t) => ({ ...t.pos }))
      : strategyArea(def, at, c.pos);
    const cast = (double: boolean): { targets: string[]; damages: number[] } => {
      const targets: string[] = [];
      const damages: number[] = [];
      for (const coord of area) {
        const t = this.state.unitAt(coord);
        if (!t || (double && !t.alive) || !def.targetSides.includes(t.side)) continue;
        const raw = computeStrategy(c, t, def, this.state.map, this.state.rng);
        const capped = raw.hit ? survive(t, capHit(t, raw.damage), sparesFullHp(t)) : raw.damage;
        const res = capped === raw.damage ? raw : { ...raw, damage: capped, lethal: capped >= t.hp };
        targets.push(t.id);
        damages.push(res.damage);
        if (res.hit) {
          // 흡수: 상대 MP를 빼앗는 책략은 피해 대신 MP를 옮긴다(피해 숫자는 빼앗은 MP).
          if (def.drain === "mp") {
            const took = Math.min(t.mp, Math.max(1, Math.round(def.power / 4)));
            t.mp -= took; c.mp = Math.min(c.stats.maxMp, c.mp + took); damages[damages.length - 1] = took;
          } else {
            this.damage(t, res.damage, c);
            if (def.drain === "hp" && c.alive) c.hp = Math.min(c.stats.maxHp, c.hp + res.damage);
          }
          const pool = def.inflicts ?? [];
          const give = def.randomInflict && pool.length ? [pool[Math.floor(this.state.rng.next() * pool.length)]!] : pool;
          for (const s of give) {
            if (t.alive) this.state.applyStatus(t, { kind: s, turns: def.statusTurns ?? 2, magnitude: 1 });
          }
        }
      }
      return { targets, damages };
    };
    const first = cast(false);

    // 비가 오는 동안에는 불길이 남지 않는다.
    if (def.leavesHazard && !(def.leavesHazard === "fire" && this.state.weather === "rain")) {
      for (const coord of area) {
        if (!this.state.map.inBounds(coord)) continue;
        const tile = this.state.map.tileAt(coord);
        tile.hazard = def.leavesHazard;
        tile.hazardTurns = 3;
      }
    }

    this.state.push({ t: "strategy", caster: c.id, strategy: strategyId, targets: first.targets, damage: first.damages });
    // 규칙판 11 연속 책략: 적을 해친 공격 책략만, 시전자 정신력 ÷ 첫 표적 정신력 비율로(2회 공격과 같은 곡선) 한 번 더 MP 없이.
    const primary = first.damages.findIndex((d) => d > 0);
    if (c.chainCast && c.alive && !global && primary >= 0) {
      const lead = this.state.find(first.targets[primary]!);
      if (lead?.alive && isHostile(c.side, lead.side) && this.state.rng.chance(ccRatioChance(c.stats.spirit, lead.stats.spirit))) {
        const second = cast(true);
        if (second.targets.length) this.state.push({ t: "strategy", caster: c.id, strategy: strategyId, targets: second.targets, damage: second.damages, double: true });
      }
    }
    c.hasActed = true;
    c.hasMoved = true;
    return ok;
  }

  /** 사신 책략 「청룡」: 범위 안의 적 가운데 무작위로 낙뢰가 여러 번 떨어진다. */
  private castStrikes(c: Unit, def: StrategyDef, id: string, at: Coord): CommandResult {
    const area = strategyArea(def, at, c.pos);
    const targets: string[] = [], damages: number[] = [];
    for (let k = 0; k < (def.strikes ?? 0); k++) {
      const pool = area.map((p) => this.state.unitAt(p)).filter((t): t is Unit => !!t?.alive && def.targetSides.includes(t.side));
      if (!pool.length) break;
      const t = pool[Math.floor(this.state.rng.next() * pool.length)]!;
      const raw = computeStrategy(c, t, def, this.state.map, this.state.rng);
      const dmg = raw.hit ? survive(t, capHit(t, raw.damage), sparesFullHp(t)) : 0;
      targets.push(t.id); damages.push(dmg);
      if (raw.hit) {
        this.damage(t, dmg, c);
        for (const s of def.inflicts ?? []) if (t.alive) this.state.applyStatus(t, { kind: s, turns: def.statusTurns ?? 2, magnitude: 1 });
      }
    }
    this.state.push({ t: "strategy", caster: c.id, strategy: id, targets, damage: damages });
    c.hasActed = true;
    c.hasMoved = true;
    return ok;
  }

  /** 사신 책략 「현무」: 맵 위 모든 부대의 능력을 무작위로 바꾼다(시전자 편은 대개 강화, 상대 편은 대개 약화). */
  private castMutate(c: Unit, id: string): CommandResult {
    const GOOD = ["rally", "guard", "swift", "spirited", "haste"] as const, BAD = ["weaken", "breach", "sluggish", "dispirit", "slow"] as const;
    const targets: string[] = [];
    for (const u of this.state.living()) {
      if (/^(gate|tower)_/.test(u.id) || u.unitClass === "civilian") continue;
      const friend = !isHostile(c.side, u.side);
      const good = this.state.rng.chance(friend ? 75 : 25);
      const list = good ? GOOD : BAD;
      this.state.applyStatus(u, { kind: list[Math.floor(this.state.rng.next() * list.length)]!, turns: 3, magnitude: 1 });
      targets.push(u.id);
    }
    this.state.push({ t: "strategy", caster: c.id, strategy: id, targets, damage: targets.map(() => 0) });
    c.hasActed = true;
    c.hasMoved = true;
    return ok;
  }

  /**
   * 소모품(도구): 부대 공용 보관함에서 꺼내 자신 또는 상하좌우로 붙은 아군에게 쓴다. 행동 하나를 쓴다.
   * 각성약은 자신에게 못 쓴다(혼란에 빠지면 스스로 움직이지 못한다). 인수는 병종을 한 단계 올리고 체력·MP를 채운다.
   */
  private doItem(unitId: string, itemId: string, targetId?: string): CommandResult {
    const u = this.state.find(unitId), item = consumable(itemId);
    if (!u?.alive || !item) return fail("지원되지 않는 도구");
    if (!u.canUseItems) return fail("이 부대는 도구를 쓸 수 없습니다.");
    if ((this.state.inventory[item.id] ?? 0) <= 0) return fail(`${item.name}이(가) 보관함에 없습니다.`);
    const t = this.state.find(targetId ?? unitId);
    if (!t?.alive || isHostile(u.side, t.side) || t.unitClass === "civilian") return fail("아군에게만 쓸 수 있습니다.");
    if (t === u ? item.othersOnly : manhattan(u.pos, t.pos) !== 1) return fail(item.othersOnly ? "상하좌우로 붙은 다른 아군에게 쓰세요." : "자신 또는 상하좌우로 붙은 아군에게 쓰세요.");
    const bad = t.statuses.filter((s) => item.cures === "all" ? BAD_STATUS.has(s.kind) : item.cures?.includes(s.kind));
    const next = item.promote ? nextEvolution(t.unitClass) : undefined;
    const hpNeed = item.hp !== undefined && t.hp < t.stats.maxHp, mpNeed = item.mp !== undefined && t.mp < t.stats.maxMp;
    if (!(hpNeed || mpNeed || bad.length || next)) return fail(item.promote ? "더 오를 병종이 없습니다." : "지금은 쓸 필요가 없습니다.");
    const hp0 = t.hp, mp0 = t.mp;
    if (next) { evolveUnit(t, next.to); t.hp = t.stats.maxHp; t.mp = t.stats.maxMp; this.state.push({ t: "convert", unit: t.id, to: next.to }); }
    if (item.hp !== undefined) t.hp = item.hp < 0 ? t.stats.maxHp : Math.min(t.stats.maxHp, t.hp + item.hp);
    if (item.mp !== undefined) t.mp = Math.min(t.stats.maxMp, t.mp + item.mp);
    if (bad.length) t.statuses = t.statuses.filter((s) => !bad.includes(s));
    this.state.inventory[item.id] = (this.state.inventory[item.id] ?? 0) - 1;
    this.state.push({ t: "item", unit: u.id, item: item.id, target: t.id, ...(t.hp !== hp0 ? { hp: t.hp - hp0 } : {}), ...(t.mp !== mp0 ? { mp: t.mp - mp0 } : {}) });
    u.hasActed = true;
    u.hasMoved = true;
    return ok;
  }

  private doCapture(unitId: string, region: string): CommandResult {
    const u = this.state.find(unitId);
    if (!u?.alive) return fail("유닛 없음");
    const coords = this.state.map.regionCoords(region);
    if (!coords.some((c) => sameCoord(c, u.pos))) return fail("점령 지점 위가 아님");
    this.state.captured.set(region, u.side);
    u.hasActed = true;
    u.hasMoved = true;
    return ok;
  }

  /**
   * 선택지 선택 (M-03). 활성 대화의 유효한 선택지만 받는다.
   * 검증 없이 기록만 하면 스테이지 데이터의 오타가 조용히 통과하고,
   * 그 선택을 기다리는 이벤트가 영영 발동하지 않는다.
   */
  private doChoose(nodeId: string, optionId: string): CommandResult {
    if (this.dialogue.size === 0) {
      // 대화 정의가 없는 스테이지는 자유 기록을 허용한다 (테스트·연출용)
      this.state.choices.push({ nodeId, optionId });
      return ok;
    }
    if (this.state.activeDialogue !== nodeId) {
      return fail(`활성 대화가 아님 (현재: ${this.state.activeDialogue ?? "없음"}, 요청: ${nodeId})`);
    }
    if (!this.dialogue.has(nodeId)) return fail(`정의되지 않은 대화 노드: ${nodeId}`);

    const option = this.dialogue.node(nodeId).options.find((o) => o.id === optionId);
    if (!option) return fail(`대화 "${nodeId}"에 선택지 "${optionId}"가 없음`);

    this.state.choices.push({ nodeId, optionId });
    this.state.push(
      option.correct === undefined
        ? { t: "choice", node: nodeId, option: optionId }
        : { t: "choice", node: nodeId, option: optionId, correct: option.correct },
    );
    this.state.activeDialogue = option.next ?? null;
    if (this.state.activeDialogue) {
      this.state.push({ t: "dialogue", node: this.state.activeDialogue });
    }
    return ok;
  }

  private doWait(unitId: string): CommandResult {
    const u = this.state.find(unitId);
    if (!u?.alive) return fail("유닛 없음");
    u.hasActed = true;
    u.hasMoved = true;
    return ok;
  }

  /** Would `defender` strike back if `attacker` hit it from where it stands now? For previews. */
  wouldCounter(defender: Unit, attacker: Unit): boolean {
    return this.canCounter(defender, attacker);
  }

  private canCounter(defender: Unit, attacker: Unit): boolean {
    if (defender.unitClass === 'civilian') return false;
    if (!inReach(defender, defender.pos, attacker.pos)) return false;
    const context=createDamageContext(attacker,defender,"physical");applyTraitHooks(context);
    if (context.suppressCounter) return false;
    const used = this.counters.get(defender.id) ?? 0;
    return used < counterLimitOf(defender);
  }

  private damage(target: Unit, amount: number, source: Unit, physical = false): void {
    const recipient = this.redirectToGuardian(target, source);
    // 용린갑옷(MP 방어): 물리 피해를 체력 대신 MP로 받는다. MP가 모자라도 그 타격은 MP만 0이 된다.
    if (physical && recipient.mp > 0 && recipient.traits.includes("gear:mpShield")) recipient.mp = Math.max(0, recipient.mp - amount);
    else recipient.hp -= amount;
    if (hasTrait(source, "lifesteal")) {
      const pct = source.traitParams["lifesteal"] ?? 0;
      source.hp = Math.min(source.stats.maxHp, source.hp + Math.round(amount * (pct / 100)));
    }
    const plunder = troopLifesteal(source);
    if (plunder > 0 && source.alive) source.hp = Math.min(source.stats.maxHp, source.hp + Math.round(amount * (plunder / 100)));
    if (recipient.hp <= 0) this.state.retreat(recipient);
    else this.autoBean(recipient);
  }

  /** 콩주머니: 피해를 받으면 보관함의 회복의 콩을 저절로 쓴다. */
  private autoBean(u: Unit): void {
    if (!u.alive || u.hp >= u.stats.maxHp || !u.traits.includes("gear:beanBag") || (this.state.inventory.bean ?? 0) <= 0) return;
    const bean = consumable("bean")!, hp0 = u.hp;
    u.hp = Math.min(u.stats.maxHp, u.hp + (bean.hp ?? 0));
    this.state.inventory.bean = (this.state.inventory.bean ?? 0) - 1;
    this.state.push({ t: "item", unit: u.id, item: "bean", target: u.id, hp: u.hp - hp0, auto: true });
  }

  /**
   * M-20 GUARD_LINK — 인접한 호위 아군이 피해를 대신 받는다.
   *
   * 관통 공격(penetrate)은 호위를 무시한다. 이 예외가 없으면 호위 유닛 하나로
   * 전선이 영구히 잠겨 전투가 성립하지 않는다 — 상대에게 반드시 대응 수단이 있어야 한다.
   * 전환은 1단계만 일어난다(호위가 호위를 부르지 않는다).
   */
  private redirectToGuardian(target: Unit, source: Unit): Unit {
    if (guardsAdjacent(target)) return target;
    if (hasTrait(source, "penetrate")) return target;

    for (const c of adjacent(target.pos)) {
      const neighbor = this.state.unitAt(c);
      if (!neighbor?.alive) continue;
      if (neighbor.side !== target.side) continue;
      if (!guardsAdjacent(neighbor)) continue;
      this.state.push({ t: "guard", protector: neighbor.id, protected: target.id });
      return neighbor;
    }
    return target;
  }

  private applyTileHazard(u: Unit): void {
    // 날씨 조건이 붙은 위험 지대(독 샘 등)는 그 날씨일 때만 해를 끼친다.
    const hazard = this.state.activeHazard(u.pos);
    if (hazard === "fire") {
      this.state.applyStatus(u, { kind: "burn", turns: 2, magnitude: 1 });
    } else if (hazard === "trap") {
      const dmg = Math.round(u.stats.maxHp * 0.25);
      u.hp = Math.max(1, u.hp - dmg); // 함정은 퇴각시키지 않는다 (PRD 2-10)
    }
  }

  // ─────────────────────────────────── 턴 루프

  private beginPhase(): void {
    const side = this.state.currentSide;
    this.counters.clear();
    for (const u of this.state.living(side)) {
      u.hasMoved = false;
      u.movedThisTurn = false;
      u.movedSteps = 0;
      u.hasActed = false;
      this.tickStatuses(u);
    }
    // 차례 시작 특성은 모든 부대의 상태 시간이 줄어든 뒤에 건다(장수가 곁의 아군에게 건 효과가 곧바로 닳지 않게).
    for (const u of this.state.living(side)) for(const id of u.traits)getTrait(id).hooks.onTurnStart?.(u,traitParam(u,id));
    this.state.push({ t: "turnStart", turn: this.state.turn, side });
    runEvents(this.state, { kind: "turn_start", side });
    this.checkOutcome();
  }

  endPhase(): void {
    if (this.state.activeDialogue || this.state.outcome !== 'ongoing') return;
    const segment = this.state.scenarioPhase;
    const side = this.state.currentSide;
    runEvents(this.state, { kind: "turn_end", side });
    this.checkOutcome();
    if (this.state.outcome !== "ongoing" || this.state.activeDialogue || this.state.scenarioPhase !== segment) return;

    this.state.phaseIndex++;
    if (this.state.phaseIndex >= PHASE_ORDER.length) {
      this.state.phaseIndex = 0;
      this.state.turn++;
      this.tickHazards();
      this.resolveTelegraphs();
      this.state.updateRegionHolds();
      if (this.state.turn > this.maxTurns) {
        this.state.outcome = "defeat";
        this.state.push({ t: "outcome", outcome: "defeat" });
        return;
      }
    }
    this.beginPhase();
  }

  /** AI 페이즈를 자동 진행한다. 한 번 호출 = 한 유닛 처리 (PF-05 시간 분할). */
  stepAi(): boolean {
    if (this.state.activeDialogue || this.state.outcome !== 'ongoing') return false;
    const side = this.state.currentSide;
    if (CONTROLLABLE.has(side)) return false;
    const next = this.state.living(side).find((u) => !u.hasActed);
    if (!next) {
      this.endPhase();
      return false;
    }
    const segment = this.state.scenarioPhase;
    for (const cmd of decide(this.state, next)) {
      if (this.state.activeDialogue || this.state.outcome !== 'ongoing' || this.state.scenarioPhase !== segment) break;
      this.execute(cmd);
    }
    next.hasActed = true;
    return true;
  }

  /** AI 페이즈를 끝까지 진행한다 (헤드리스 시뮬레이션용). */
  runAiPhase(): void {
    let guard = 0;
    while (CONTROLLABLE.has(this.state.currentSide) === false && this.state.outcome === "ongoing") {
      if (!this.stepAi()) break;
      if (++guard > 500) throw new Error("AI 페이즈 무한 루프 방어 발동");
    }
  }

  private tickStatuses(u: Unit): void {
    for (const s of u.statuses) {
      if (s.kind === "burn") u.hp = Math.max(1, u.hp - Math.round(u.stats.maxHp * 0.08));
      if (s.kind === "bleed") u.hp = Math.max(1, u.hp - Math.round(u.stats.maxHp * 0.05));
      s.turns--;
    }
    // 조조전 규칙: 나쁜 상태는 턴마다 (운 ÷ 2)% 확률로 저절로 풀린다.
    if (u.ccRules) {
      const chance = ccRecoverChance(u);
      for (const s of u.statuses) if (s.turns > 0 && NEGATIVE_STATUS.has(s.kind) && this.state.rng.chance(chance)) s.turns = 0;
    }
    u.statuses = u.statuses.filter((s) => s.turns > 0);
  }

  /** M-18: warned blows land at the start of their turn on whoever still stands there. */
  private resolveTelegraphs(): void {
    const due = this.state.telegraphs.filter((t) => t.at <= this.state.turn);
    if (!due.length) return;
    this.state.telegraphs = this.state.telegraphs.filter((t) => t.at > this.state.turn);
    for (const t of due) {
      // 피해 0의 예고는 "이 길로 적이 온다"는 표식일 뿐이다 — 착탄 없이 사라진다.
      if (t.ratio <= 0) continue;
      const hits: Array<{ unit: string; damage: number }> = [];
      for (const c of t.cells) {
        const u = this.state.unitAt(c);
        if (!u?.alive) continue;
        const damage = Math.min(u.hp - 1, Math.round(u.stats.maxHp * t.ratio / 100));
        u.hp -= Math.max(0, damage);
        if (t.effect) this.state.applyStatus(u, { kind: t.effect, turns: 2, magnitude: 1 });
        hits.push({ unit: u.id, damage: Math.max(0, damage) });
      }
      this.state.push({ t: "strike", id: t.id, cells: t.cells, hits });
    }
  }

  private tickHazards(): void {
    for (let y = 0; y < this.state.map.height; y++) {
      for (let x = 0; x < this.state.map.width; x++) {
        const tile = this.state.map.tileAt({ x, y });
        if (tile.hazardTurns > 0 && --tile.hazardTurns === 0) tile.hazard = "none";
      }
    }
  }

  private checkOutcome(): void {
    if (this.state.outcome !== "ongoing") return;
    // 패배 조건을 먼저 본다 — 동시 충족 시 패배가 우선
    if (evaluateGroup(this.state, this.state.defeat)) {
      this.state.outcome = "defeat";
      this.state.push({ t: "outcome", outcome: "defeat" });
      return;
    }
    if (this.state.stickyGoals ? advanceVictory(this.state) : evaluateGroup(this.state, this.state.victory)) {
      this.state.outcome = "victory";
      this.state.push({ t: "outcome", outcome: "victory" });
    }
  }

  // ─────────────────────────────────── 무르기

  private pushUndo(): void {
    this.undoStack.push(this.state.snapshot());
    while (this.undoStack.length > this.undoDepth) this.undoStack.shift();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** 마지막 명령을 되돌린다. RNG 상태까지 복원되므로 재시도해도 같은 결과가 나온다. */
  undo(): boolean {
    const snap = this.undoStack.pop();
    if (!snap) return false;
    this.state.restore(snap);
    return true;
  }
}

/**
 * 책략이 닿는 칸. single=한 칸, cross=십자(팔 길이 radius, 최소 1), spread=마름모(반경 radius),
 * line=시전자에게서 멀어지는 방향으로 radius+1칸 직선, global=찍은 칸(전 맵은 호출자가 열거).
 */
export function strategyArea(def: Pick<StrategyDef, "shape" | "radius">, at: Coord, from?: Coord): Coord[] {
  switch (def.shape) {
    case "single":
      return [at];
    case "cross": {
      const out: Coord[] = [at], r = Math.max(1, def.radius);
      for (let i = 1; i <= r; i++) out.push({ x: at.x + i, y: at.y }, { x: at.x - i, y: at.y }, { x: at.x, y: at.y + i }, { x: at.x, y: at.y - i });
      return out;
    }
    case "spread": {
      const out: Coord[] = [];
      for (let dy = -def.radius; dy <= def.radius; dy++) {
        for (let dx = -def.radius; dx <= def.radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= def.radius) out.push({ x: at.x + dx, y: at.y + dy });
        }
      }
      return out;
    }
    case "line": {
      const dx = from ? at.x - from.x : 1, dy = from ? at.y - from.y : 0;
      const [sx, sy] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy)];
      const out: Coord[] = [];
      for (let i = 0; i <= def.radius; i++) out.push({ x: at.x + sx * i, y: at.y + sy * i });
      return out;
    }
    case "global":
      return [at]; // 전 맵 책략은 호출자가 대상을 열거한다
  }
}
