/**
 * 전투 컨트롤러. 턴 루프와 명령 실행을 담당한다.
 */
import { BattleState, PHASE_ORDER, type BattleSnapshot } from "./state.ts";
import type { Command, CommandResult } from "./commands.ts";
import { ok, fail } from "./commands.ts";
import { computePhysical, computeStrategy } from "./formulas.ts";
import { counterLimitOf, ignoresRough, hasTrait } from "./traits.ts";
import { runEvents } from "./events.ts";
import { evaluateGroup } from "./conditions.ts";
import { manhattan, key, sameCoord, adjacent } from "./grid.ts";
import { CONTROLLABLE } from "./types.ts";
import type { Unit, Coord, StrategyDef } from "./types.ts";
import { decide } from "./ai.ts";

export interface BattleOptions {
  seed: number;
  strategies?: Map<string, StrategyDef>;
  /** 무르기 스택 최대 깊이. 0이면 무르기 비활성. */
  undoDepth?: number;
  /** 무한 루프 방어. 이 턴을 넘기면 강제 종료한다. */
  maxTurns?: number;
}

export class Battle {
  readonly state: BattleState;
  private readonly strategies: Map<string, StrategyDef>;
  private readonly undoStack: BattleSnapshot[] = [];
  private readonly undoDepth: number;
  private readonly maxTurns: number;
  /** 턴 내 유닛별 반격 사용 횟수 */
  private counters = new Map<string, number>();

  constructor(state: BattleState, opts: BattleOptions) {
    this.state = state;
    this.strategies = opts.strategies ?? new Map();
    this.undoDepth = opts.undoDepth ?? 20;
    this.maxTurns = opts.maxTurns ?? 200;
  }

  /** 전투 시작. battle_start 이벤트를 발화시킨다. */
  start(): void {
    runEvents(this.state, { kind: "battle_start" });
    this.beginPhase();
  }

  // ─────────────────────────────────── 명령 실행

  execute(cmd: Command): CommandResult {
    if (this.state.outcome !== "ongoing") return fail("전투가 이미 종료됨");
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
      case "choose":
        this.state.choices.push({ nodeId: cmd.nodeId, optionId: cmd.optionId });
        return ok;
      case "item":      return ok; // 도구 시스템은 M2 마일스톤
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
    const [minR, maxR] = a.range;
    if (dist < minR || dist > maxR) return fail(`사거리 밖 (거리 ${dist}, 사거리 ${minR}~${maxR})`);

    const res = computePhysical(a, d, this.state.map, this.state.rng);
    this.state.push({
      t: "attack", attacker: a.id, defender: d.id,
      damage: res.damage, hit: res.hit, critical: res.critical,
    });
    if (res.hit) this.damage(d, res.damage, a);

    a.hasActed = true;
    a.hasMoved = true;

    // 반격: 생존 + 사거리 내 + 무반격 아님 + 반격 횟수 잔여
    if (d.alive && a.alive && this.canCounter(d, a, dist)) {
      const counter = computePhysical(d, a, this.state.map, this.state.rng, { isCounter: true });
      this.state.push({
        t: "counter", attacker: d.id, defender: a.id,
        damage: counter.damage, hit: counter.hit,
      });
      if (counter.hit) this.damage(a, counter.damage, d);
      this.counters.set(d.id, (this.counters.get(d.id) ?? 0) + 1);
    }
    return ok;
  }

  private doStrategy(casterId: string, strategyId: string, at: Coord): CommandResult {
    const c = this.state.find(casterId);
    if (!c?.alive) return fail("유닛 없음");
    if (c.side !== this.state.currentSide) return fail("현재 페이즈의 유닛이 아님");
    if (c.hasActed) return fail("이미 행동함");

    const def = this.strategies.get(strategyId);
    if (!def) return fail(`정의되지 않은 책략: ${strategyId}`);
    if (!c.strategies.includes(strategyId)) return fail("보유하지 않은 책략");
    if (c.mp < def.mpCost) return fail(`MP 부족 (필요 ${def.mpCost}, 보유 ${c.mp})`);
    if (this.state.hasStatus(c, "seal")) return fail("책략 봉인 상태");
    if (manhattan(c.pos, at) > def.range) return fail("시전 사거리 밖");

    c.mp -= def.mpCost;
    const area = strategyArea(def, at);
    const targets: string[] = [];
    const damages: number[] = [];

    for (const coord of area) {
      const t = this.state.unitAt(coord);
      if (!t || !def.targetSides.includes(t.side)) continue;
      const res = computeStrategy(c, t, def, this.state.map, this.state.rng);
      targets.push(t.id);
      damages.push(res.damage);
      if (res.hit) {
        this.damage(t, res.damage, c);
        for (const s of def.inflicts ?? []) {
          if (t.alive) this.state.applyStatus(t, { kind: s, turns: 2, magnitude: 1 });
        }
      }
    }

    if (def.leavesHazard) {
      for (const coord of area) {
        if (!this.state.map.inBounds(coord)) continue;
        const tile = this.state.map.tileAt(coord);
        tile.hazard = def.leavesHazard;
        tile.hazardTurns = 3;
      }
    }

    this.state.push({ t: "strategy", caster: c.id, strategy: strategyId, targets, damage: damages });
    c.hasActed = true;
    c.hasMoved = true;
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

  private doWait(unitId: string): CommandResult {
    const u = this.state.find(unitId);
    if (!u?.alive) return fail("유닛 없음");
    u.hasActed = true;
    u.hasMoved = true;
    return ok;
  }

  private canCounter(defender: Unit, attacker: Unit, dist: number): boolean {
    const [minR, maxR] = defender.range;
    if (dist < minR || dist > maxR) return false;
    if (hasTrait(attacker, "noCounterAttack")) return false;
    const used = this.counters.get(defender.id) ?? 0;
    return used < counterLimitOf(defender);
  }

  private damage(target: Unit, amount: number, source: Unit): void {
    target.hp -= amount;
    if (hasTrait(source, "lifesteal")) {
      const pct = source.traitParams["lifesteal"] ?? 0;
      source.hp = Math.min(source.stats.maxHp, source.hp + Math.round(amount * (pct / 100)));
    }
    if (target.hp <= 0) this.state.retreat(target);
  }

  private applyTileHazard(u: Unit): void {
    const tile = this.state.map.tileAt(u.pos);
    if (tile.hazard === "fire") {
      this.state.applyStatus(u, { kind: "burn", turns: 2, magnitude: 1 });
    } else if (tile.hazard === "trap") {
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
      u.hasActed = false;
      this.tickStatuses(u);
    }
    this.state.push({ t: "turnStart", turn: this.state.turn, side });
    runEvents(this.state, { kind: "turn_start", side });
    this.checkOutcome();
  }

  endPhase(): void {
    const side = this.state.currentSide;
    runEvents(this.state, { kind: "turn_end", side });
    this.checkOutcome();
    if (this.state.outcome !== "ongoing") return;

    this.state.phaseIndex++;
    if (this.state.phaseIndex >= PHASE_ORDER.length) {
      this.state.phaseIndex = 0;
      this.state.turn++;
      this.tickHazards();
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
    const side = this.state.currentSide;
    if (CONTROLLABLE.has(side)) return false;
    const next = this.state.living(side).find((u) => !u.hasActed);
    if (!next) {
      this.endPhase();
      return false;
    }
    for (const cmd of decide(this.state, next)) this.execute(cmd);
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
    u.statuses = u.statuses.filter((s) => s.turns > 0);
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
    if (evaluateGroup(this.state, this.state.victory)) {
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

function strategyArea(def: StrategyDef, at: Coord): Coord[] {
  switch (def.shape) {
    case "single":
      return [at];
    case "cross":
      return [at, ...adjacent(at)];
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
      const out: Coord[] = [];
      for (let i = 0; i <= def.radius; i++) out.push({ x: at.x + i, y: at.y });
      return out;
    }
    case "global":
      return [at]; // 전 맵 책략은 호출자가 대상을 열거한다
  }
}
