/**
 * 적/우군 AI.
 *
 * 성능 요구사항 PF-05: 탐색 연산은 프레임 예산을 넘기지 않아야 한다.
 * 그래서 AI는 "유닛 1기 = 결정 1회"의 순수 함수로 작성하고,
 * 호출자가 시간 분할(time-slicing) 하도록 만든다. AI 자신은 루프를 돌지 않는다.
 */
import type { BattleState } from "./state.ts";
import type { VictoryCondition } from "./stage.ts";
import type { Unit, Coord } from "./types.ts";
import type { Command } from "./commands.ts";
import { manhattan, key, sameCoord, isHostile } from "./grid.ts";
import { inReach, reachSpec, reachOffsets, unitReachSpec } from "./reach.ts";
import { ignoresRough } from "./traits.ts";
import { estimatePhysical, estimateStrategy } from "./formulas.ts";
import { evaluate, rememberedGoal } from "./conditions.ts";

/** 유닛 1기의 다음 행동을 결정한다. 상태를 변경하지 않는다. */
export function decide(state: BattleState, unit: Unit): Command[] {
  if (!unit.alive) return [];
  if (state.hasStatus(unit, "confusion")) return [{ kind: "wait", unit: unit.id }];

  const behavior = unit.behavior ?? "advance";
  // 가만히 있는 호송 대상이라도 "이 유닛이 어디에 닿아라"가 승리 조건이면 움직인다
  // (자동 전투로 호송 임무를 맡기면 호송대가 한 칸도 움직이지 않아 60턴에 끝나던 문제).
  const mustReach = state.victory.some((c) => c.type === "reach" && c.unit === unit.id);
  if (behavior === "passive" && !mustReach) return [{ kind: "wait", unit: unit.id }];

  const reach = state.map.reachable(unit, state.occupancy(), ignoresRough(unit));
  // M-18: the player's side reads the warnings — never end a move on a cell a blow is due to land on.
  // (Enemy and automatic allies keep their own plans; the marks are aimed at the player.)
  if (unit.side === "player" || unit.side === "ally") {
    for (const t of state.telegraphs) {
      if (t.ratio <= 0) continue;
      for (const c of t.cells) if (!sameCoord(c, unit.pos)) reach.delete(key(c));
    }
  }
  const hostiles = state.enemiesOf(unit.side);
  // 스테이지 guardLeaders: 쓰러지면 패배인 장수(필수 생존)는 길목을 지키고 선 적(hold)이 한 번에 달려와 칠 수 있는 칸으로
  // 걸어 들어가지 않는다 — 책략을 쏘러 다가갔다가 버티던 무리를 깨워 둘러싸이던 문제(Z2-02 제갈량).
  // 안전한 칸이 하나도 없으면 그대로 둔다.
  if ((unit.side === "player" || unit.side === "ally") && state.stage.guardLeaders === true &&
      state.defeat.some((c) => c.type === "retreat" && c.unit === unit.id)) {
    const threat = new Set<string>();
    for (const h of hostiles) {
      if (h.behavior !== "hold") continue;
      const offsets = reachOffsets(h);
      for (const c of decodeAll(state.map.reachable(h, state.occupancy(), ignoresRough(h)))) {
        for (const o of offsets) threat.add(key({ x: c.x + o.x, y: c.y + o.y }));
      }
    }
    const unsafe = decodeAll(reach).filter((c) => threat.has(key(c)) && !sameCoord(c, unit.pos));
    if (unsafe.length < reach.size) for (const c of unsafe) reach.delete(key(c));
  }

  // M-05 ESCORT — 보호 대상은 교전하지 않고 목적지로만 전진한다.
  // 공격하게 두면 적진에 스스로 걸어 들어가 호위가 성립하지 않는다.
  if (behavior === "escortee") {
    const goalRegion = unit.goalRegion ?? "escort_goal";
    const goal = goalCoord(state, unit, goalRegion);
    // 규칙판 6: 길목을 지키고 선 적(hold)이 한 번에 달려와 칠 수 있는 칸으로는 걸어 들어가지 않는다 —
    // 호위가 길을 열 때까지 그 밖에서 기다린다. 목적지 칸은 예외다(닿는 순간 끝난다). 안전한 칸이 없으면 그대로 간다.
    if (state.stickyGoals) {
      const threat = new Set<string>();
      for (const h of hostiles) {
        if (h.behavior !== "hold") continue;
        const offsets = reachOffsets(h);
        for (const c of decodeAll(state.map.reachable(h, state.occupancy(), ignoresRough(h)))) {
          for (const o of offsets) threat.add(key({ x: c.x + o.x, y: c.y + o.y }));
        }
      }
      const unsafe = decodeAll(reach).filter((c) => threat.has(key(c)) && !onRegion(state, { ...unit, pos: c }, goalRegion));
      if (unsafe.length < reach.size) for (const c of unsafe) reach.delete(key(c));
    }
    const step = goal ? bestStepToward(state, unit, reach, goal) : null;
    return step
      ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
      : [{ kind: "wait", unit: unit.id }];
  }

  // M-02 PATROL_STEALTH — 순찰 경로를 따라 이동한다.
  // 시야 안에 적이 들어오면 순찰을 멈추고 교전 판단으로 넘어간다.
  if (behavior === "patrol" && !hasSpotted(state, unit)) {
    return patrolStep(state, unit, reach);
  }

  // follow — 지정한 유닛(followUnit) 곁으로 다가간다. 교전하지 않는다(화용도의 조조가 관우를 찾아가듯).
  // 대상이 없거나 쓰러졌으면 보통 전진(advance)처럼 움직인다.
  if (behavior === "follow") {
    const leader = unit.followUnit ? state.find(unit.followUnit) : undefined;
    if (leader?.alive && leader.id !== unit.id) {
      if (manhattan(unit.pos, leader.pos) === 1) return [{ kind: "wait", unit: unit.id }];
      const goal = followGoal(state, unit, leader);
      const step = bestStepToward(state, unit, reach, goal);
      return step && !sameCoord(step, unit.pos)
        ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
        : [{ kind: "wait", unit: unit.id }];
    }
  }

  // 목표 지점 위에 서 있다면 목표 달성이 최우선이다.
  const objective = objectiveRegion(state, unit);
  if (objective && !objective.claims && onRegion(state, unit, objective.region)) {
    // 점령해도 조건을 채우지 못하는 편입 아군은 점령 칸을 비켜 본대가 들어설 자리를 연다.
    const exit = decodeAll(reach).filter((c) => !onRegion(state, { ...unit, pos: c }, objective.region))
      .sort((a, b) => manhattan(a, unit.pos) - manhattan(b, unit.pos) || a.y - b.y || a.x - b.x)[0];
    if (exit) return [{ kind: "move", unit: unit.id, to: exit }, { kind: "wait", unit: unit.id }];
  }
  if (objective && objective.claims && onRegion(state, unit, objective.region)) {
    // reach 목표는 서 있는 것만으로 충족된다 — 점령 명령을 낼 대상이 아니다.
    return objective.kind === "capture"
      ? [{ kind: "capture", unit: unit.id, region: objective.region }]
      : [{ kind: "wait", unit: unit.id }];
  }

  if (behavior === "race" || behavior === "flee") {
    const goal = raceGoal(state, unit, objective?.region ?? null);
    if (goal) {
      const step = bestStepToward(state, unit, reach, goal);
      return step ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
                  : [{ kind: "wait", unit: unit.id }];
    }
  }

  // 점령·도달이 승패를 가르는 전투에서는 목표가 교전보다 우선한다.
  // 전원이 목표로 달리면 전멸하므로, 목표에 가장 가까운 한 명만 담당시킨다.
  if (objective && isObjectiveCarrier(state, unit, objective) && !state.map.regionCoords(objective.region).every(c=>{const occupant=state.unitAt(c);return occupant&&isHostile(unit.side,occupant.side);})) {
    const goal = goalCoord(state, unit, objective.region);
    const step = goal ? bestStepToward(state, unit, reach, goal) : null;
    if (step && !sameCoord(step, unit.pos)) {
      return [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }];
    }
    // 전진할 수 없으면 아래 교전 판단으로 넘어간다 (길이 막힌 경우)
  }

  // 비전투 유닛은 교전하지 않는다 — 목표를 맡지 않았다면 적에게서 멀어진다.
  // hold는 "제자리를 지킨다"는 명시적 지시이므로 회피보다 우선한다.
  if (isNonCombatant(unit) && behavior !== "hold") {
    const away = stepAwayFrom(reach, hostiles);
    return away && !sameCoord(away, unit.pos)
      ? [{ kind: "move", unit: unit.id, to: away }, { kind: "wait", unit: unit.id }]
      : [{ kind: "wait", unit: unit.id }];
  }

  // 현재 위치 또는 이동 후 취할 수 있는 최선의 공격 수단을 찾는다.
  // 책략과 평타를 같은 저울(기대 피해)에 올려 비교한다 — 책사에게 평타를
  // 치게 두면 최소 피해만 넣고 반격으로 녹는다.
  // 승리 조건이 「이 적장을 물리쳐라」인 전장: 아군 쪽은 그 적장을 먼저 노린다
  // (자동 전투가 잔병만 쫓다 60턴을 넘겨 지던 문제 — 관도 결전 등).
  const marked = victoryTargets(state, unit, hostiles);
  const best = bestAction(state, unit, reach, hostiles, marked);
  if (best) {
    const cmds: Command[] = [];
    if (!sameCoord(best.from, unit.pos)) cmds.push({ kind: "move", unit: unit.id, to: best.from });
    cmds.push(
      best.kind === "strategy"
        ? { kind: "strategy", unit: unit.id, strategy: best.strategyId, at: best.target.pos }
        : { kind: "attack", unit: unit.id, target: best.target.id },
    );
    return cmds;
  }

  if (behavior === "hold") return [{ kind: "wait", unit: unit.id }];

  // 교전 불가 → 목표 지점이 있으면 그쪽으로, 없으면 가장 가까운 적 쪽으로 전진.
  // 단 아군 쪽 부상병(체력 45% 미만)은 목표가 없으면 적에게서 물러난다.
  if (!objective && (unit.side === "player" || unit.side === "ally") && unit.hp < unit.stats.maxHp * 0.45) {
    const away = stepAwayFrom(reach, hostiles);
    if (away && !sameCoord(away, unit.pos)) return [{ kind: "move", unit: unit.id, to: away }, { kind: "wait", unit: unit.id }];
  }
  const goal = objective
    ? goalCoord(state, unit, objective.region)
    : (closest(unit.pos, chaseTargets(unit, marked, hostiles))?.pos ?? null);
  if (!goal) return [{ kind: "wait", unit: unit.id }];
  const step = bestStepToward(state, unit, reach, goal);
  return step
    ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
    : [{ kind: "wait", unit: unit.id }];
}

/** 적대 유닛에게서 가장 멀어지는 한 걸음. 비전투 유닛의 회피용. */
function stepAwayFrom(reach: Map<string, number>, hostiles: Unit[]): Coord | null {
  if (hostiles.length === 0) return null;
  let best: Coord | null = null;
  let bestDist = -Infinity;
  for (const c of decodeAll(reach)) {
    const d = hostiles.reduce((min, h) => Math.min(min, manhattan(c, h.pos)), Infinity);
    if (d > bestDist || (d === bestDist && best !== null && key(c) < key(best))) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * 교전 수단이 없는 유닛인가.
 *
 * 민간인은 공격 계수가 최소치여서 피해는 거의 주지 못하고 반격으로 먼저
 * 쓰러진다. 보호 대상이 스스로 적진에 걸어 들어가면 호위가 성립하지 않는다 —
 * M-05 escortee와 같은 이유다. 사거리 0(무장 해제)도 같이 본다.
 */
function isNonCombatant(unit: Unit): boolean {
  return unit.unitClass === "civilian" || unit.range[1] <= 0;
}

interface Objective {
  region: string;
  kind: "capture" | "reach";
  /** 이 유닛의 점령이 조건을 충족시키는가. 편입 아군은 플레이어 점령 목표를 공유하지만
   *  스스로 점령해도 조건이 충족되지 않는다. */
  claims: boolean;
}

/**
 * 이 유닛이 노려야 할 지점 목표.
 *
 * 승리 조건과 패배 조건을 모두 읽는다 — 상대 진영이 점령하면 내가 진다는 것은
 * 곧 상대에게는 그것이 승리 목표라는 뜻이다. (M-07 RACE_CAPTURE)
 * reach는 해당 유닛 본인에게만 목표가 된다.
 */
function objectiveRegion(state: BattleState, unit: Unit): Objective | null {
  // 앞 단계에 "특정 적 격퇴"가 남았으면 다음 단계의 도달 지점으로 먼저 달려가지 않는다 — 혼자 적진에 들어가
  // 쓰러진다(S1-04 넓은 전장: 주유의 환영을 두고 황제의 길목으로). 점령·다른 부대의 도달 단계는 막지 않는다.
  const waitsForKill = (cond: VictoryCondition) =>
    cond.type === "reach" && cond.order !== undefined &&
    state.victory.some((p) => p.type === "retreat" && p.order !== undefined && p.order < cond.order! && !evaluate(state, p));
  for (const cond of [...state.victory, ...state.defeat]) {
    if (!cond.target) continue;
    if (waitsForKill(cond)) continue;
    // 목표 기억(stage.goalMemory): 붙잡아 둔 차례 목표(이미 이룬 앞 단계)로는 되돌아가지 않는다 —
    // "A에 닿고 → B에 닿기"에서 A를 떠나도 된다.
    if (rememberedGoal(state, cond)) continue;
    // 이미 충족된 목표는 건너뛴다. 건너뛰지 않으면 점령을 끝낸 유닛이 같은
    // 영역에 선 채로 매 턴 점령 명령만 되풀이해 순차 목표가 영구히 멈춘다.
    if (evaluate(state, cond)) continue;

    if (cond.type === "capture") {
      const by = cond.by ?? "player";
      // 편입 아군은 플레이어의 목표를 공유한다
      if (by === unit.side || (by === "player" && unit.side === "ally")) {
        return { region: cond.target, kind: "capture", claims: by === unit.side };
      }
    }

    if (cond.type === "reach" && cond.unit === unit.id) {
      return { region: cond.target, kind: "reach", claims: true };
    }
  }
  return null;
}

function onRegion(state: BattleState, unit: Unit, region: string): boolean {
  return state.map.regionCoords(region).some((c) => sameCoord(c, unit.pos));
}

/**
 * 이 유닛이 목표를 책임지는 담당인가.
 *
 * reach 목표는 조건이 그 유닛을 지목하므로 언제나 담당이다.
 * capture 목표는 누구나 점령할 수 있으므로, 같은 목표를 공유하는 유닛 중
 * 가장 가까운 한 명만 담당으로 뽑는다 — 동점은 ID로 갈라 결정론을 지킨다.
 */
function isObjectiveCarrier(state: BattleState, unit: Unit, objective: Objective): boolean {
  if (objective.kind === "reach") return true;
  if (!objective.claims) return false;

  const coords = state.map.regionCoords(objective.region);
  const distanceOf = (u: Unit) =>
    coords.reduce((min, c) => Math.min(min, manhattan(u.pos, c)), Infinity);

  const mine = distanceOf(unit);
  for (const other of state.living()) {
    if (other.id === unit.id) continue;
    const theirs = objectiveRegion(state, other);
    if (theirs?.region !== objective.region || theirs.kind !== "capture" || !theirs.claims) continue;
    const d = distanceOf(other);
    if (d < mine || (d === mine && other.id < unit.id)) return false;
  }
  return true;
}

type ActionPlan =
  | { kind: "attack"; from: Coord; target: Unit; score: number }
  | { kind: "strategy"; from: Coord; target: Unit; strategyId: string; score: number };

/**
 * 최선의 공격 행동을 고른다.
 *
 * 점수 = 기대 피해 + 처치 보너스 − 예상 반격 피해.
 * 반격을 뺀 덕분에 사거리 밖에서 때리는 선택과 무반격 공격이 자연히 선호된다.
 */
/** 아군 쪽(사람이 고를 수 있는 편·NPC 우군)이 노릴 승리 목표 적장: 승리 조건 「퇴각시켜라」의 대상 중 살아 있는 적. */
function victoryTargets(state: BattleState, unit: Unit, hostiles: Unit[]): Unit[] {
  if (unit.side === "enemy" || !state.stage.focusVictoryTargets) return [];
  // 쓰러지면 지는 장수(총대장 등)는 목표를 쫓아 적진에 뛰어들지 않는다.
  if (state.defeat.some((c) => c.type === "retreat" && c.unit === unit.id)) return [];
  const ids = new Set(state.victory.filter((c) => c.type === "retreat" && c.unit).map((c) => c.unit as string));
  return ids.size ? hostiles.filter((h) => h.alive && ids.has(h.id)) : [];
}

/** 다가갈 적: 가까이(한 번 움직여 닿을 거리 + 2) 싸울 적이 있으면 그 적들, 없을 때만 승리 목표 적장 쪽으로 간다(대열을 흩지 않게). */
function chaseTargets(unit: Unit, marked: Unit[], hostiles: Unit[]): Unit[] {
  if (!marked.length) return hostiles;
  const near = unit.stats.movement + unit.range[1] + 2;
  return hostiles.some((h) => !marked.includes(h) && manhattan(h.pos, unit.pos) <= near) ? hostiles : marked;
}

function bestAction(
  state: BattleState,
  unit: Unit,
  reach: Map<string, number>,
  hostiles: Unit[],
  marked: Unit[] = [],
): ActionPlan | null {
  // 승리 목표 적장을 치면 가산점, 쓰러뜨리면 크게(다른 적을 쓰러뜨리는 것보다 우선).
  const markBonus = (target: Unit, dealt: number) => (marked.includes(target) ? 30 + (dealt >= target.hp ? 1000 : 0) : 0);
  const positions: Coord[] = [unit.pos, ...decodeAll(reach)];
  const usable = unit.strategies
    .map((id) => state.strategyFor(unit, id))
    // 봉인된 책사는 책략을 쓸 수 없다: 책략 자리로 걸어가 아무것도 못 하고 턴을 버리지 않게 거른다.
    .filter((d): d is NonNullable<typeof d> => d !== undefined && d.mpCost <= unit.mp && !d.support && !state.hasStatus(unit, "seal"));

  let best: ActionPlan | null = null;
  const consider = (plan: ActionPlan) => {
    if (!best || plan.score > best.score) best = plan;
  };

  const original = { ...unit.pos };
  // 아군 쪽(사람이 고를 수 있는 편)만: 다음 적 차례에 닿을 적들의 기대 피해가 체력을 넘는 자리는 피한다.
  // 대각선까지 치는 기병이 늘어 무턱대고 들어간 장수가 쓰러지는 일을 줄인다. 적 AI는 그대로.
  const careful = unit.side === "player" || unit.side === "ally";
  const exposureCache = new Map<string, number>();
  const exposure = (from: Coord, target: Unit) => {
    if (!careful) return 0;
    const k = key(from) + "|" + target.id;
    const hit = exposureCache.get(k);
    if (hit !== undefined) return hit;
    unit.pos = from;
    let incoming = 0;
    for (const h of hostiles) {
      if (h === target || !h.alive || h.range[1] <= 0) continue;
      if (manhattan(h.pos, from) <= h.stats.movement + h.range[1] + unitReachSpec(h).line + 1) incoming += estimatePhysical(h, unit, state.map);
    }
    unit.pos = original;
    const v = incoming * 1.25 >= unit.hp ? 400 : 0;
    exposureCache.set(k, v);
    return v;
  };
  for (const from of positions) {
    for (const target of hostiles) {
      const dist = manhattan(from, target.pos);

      // 평타 — 사거리 안이면 반격 위험을 감안해 평가한다
      if (inReach(unit, from, target.pos)) {
        unit.pos = from; // 지형/고저 보정을 이동 후 위치로 계산
        const dealt = estimatePhysical(unit, target, state.map);
        const counter =
          inReach(target, target.pos, from) ? estimatePhysical(target, unit, state.map) : 0;
        unit.pos = original;
        // 쓰러뜨리지도 못하면서 반격에 쓰러질 공격은 하지 않는다
        if (counter * 1.3 >= unit.hp && dealt < target.hp) continue;
        consider({
          kind: "attack",
          from,
          target,
          score: dealt + (dealt >= target.hp ? 500 : 0) + markBonus(target, dealt) - counter - exposure(from, target),
        });
      }

      // 책략 — 반격이 없으므로 같은 피해면 언제나 우월하다
      for (const def of usable) {
        if (manhattan(from, target.pos) > def.range) continue;
        if (!def.targetSides.includes(target.side)) continue;
        unit.pos = from;
        const dealt = estimateStrategy(unit, target, def, state.map);
        unit.pos = original;
        consider({
          kind: "strategy",
          from,
          target,
          strategyId: def.id,
          score: dealt + (dealt >= target.hp ? 500 : 0) + markBonus(target, dealt) - exposure(from, target),
        });
      }
    }
  }
  return best;
}

function raceGoal(state: BattleState, unit: Unit, objective: string | null): Coord | null {
  const fallback = unit.behavior === "flee" ? "exit" : (objective ?? "objective");
  return goalCoord(state, unit, unit.goalRegion ?? fallback);
}

/**
 * 지정 영역에서 유닛이 실제로 설 수 있는 가장 가까운 좌표.
 *
 * 다른 유닛이 이미 점유한 칸을 목표로 잡으면 그 칸에 정지할 수 없어
 * 제자리걸음에 빠진다 — 목표 영역이 좁을수록(성문 2칸 등) 확실히 재현된다.
 * 빈 칸이 하나도 없을 때만 점유된 칸으로 되돌아간다.
 */
function goalCoord(state: BattleState, unit: Unit, region: string): Coord | null {
  if (!state.map.regions.has(region)) return null;
  const coords = state.map.regionCoords(region);
  const free = coords.filter((c) => {
    const occupant = state.unitAt(c);
    return !occupant || occupant.id === unit.id;
  });
  return closestCoord(unit.pos, free.length > 0 ? free : coords);
}

/**
 * 따라갈 유닛 곁의 빈 칸 가운데 따르는 유닛이 설 수 있고 가장 가까운 칸. 곁이 모두 막혔으면 대상의 자리
 * (그쪽으로 최대한 다가간다). 동점은 좌표 순으로 갈라 결정론을 지킨다.
 */
function followGoal(state: BattleState, unit: Unit, leader: Unit): Coord {
  const free = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
    .map((d) => ({ x: leader.pos.x + d.x, y: leader.pos.y + d.y }))
    .filter((c) => state.map.inBounds(c) && Number.isFinite(state.map.moveCost(unit.unitClass, c)) && (() => { const o = state.unitAt(c); return !o || o.id === unit.id; })())
    .sort((a, b) => manhattan(a, unit.pos) - manhattan(b, unit.pos) || a.y - b.y || a.x - b.x);
  return free[0] ?? leader.pos;
}

/** 순찰 유닛의 시야에 적대 유닛이 들어왔는가. */
export function hasSpotted(state: BattleState, watcher: Unit): boolean {
  const vision = watcher.visionRange ?? 0;
  if (vision <= 0) return false;
  return state
    .living()
    .some((t) => isHostile(watcher.side, t.side) && manhattan(watcher.pos, t.pos) <= vision);
}

/**
 * 순찰 한 걸음. 경로상의 현재 목표에 도달하면 다음 지점으로 넘어간다.
 * patrolIndex를 여기서 갱신하므로 decide()의 "상태를 바꾸지 않는다" 규칙에서
 * 유일하게 예외다 — 순찰 진행도는 결정이 아니라 유닛 자신의 상태이기 때문.
 */
function patrolStep(state: BattleState, unit: Unit, reach: Map<string, number>): Command[] {
  const route = unit.patrolRoute ?? [];
  if (route.length === 0) return [{ kind: "wait", unit: unit.id }];

  const index = unit.patrolIndex ?? 0;
  const target = route[index % route.length]!;
  if (sameCoord(unit.pos, target)) {
    unit.patrolIndex = (index + 1) % route.length;
    const next = route[unit.patrolIndex]!;
    const step = bestStepToward(state, unit, reach, next);
    return step
      ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
      : [{ kind: "wait", unit: unit.id }];
  }
  const step = bestStepToward(state, unit, reach, target);
  return step
    ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
    : [{ kind: "wait", unit: unit.id }];
}

function bestStepToward(
  state: BattleState,
  unit: Unit,
  reach: Map<string, number>,
  goal: Coord,
): Coord | null {
  let greedy: Coord | null = null;
  let bestDist = Infinity;
  for (const c of decodeAll(reach)) {
    const d = manhattan(c, goal);
    if (d < bestDist) {
      bestDist = d;
      greedy = c;
    }
  }
  if (greedy && !sameCoord(greedy, unit.pos)) {
    // 그리디 한 걸음이 실제 경로상으로는 멀어지는 경우(성벽·절벽 너머의 적)만
    // 지형 거리로 다시 고른다. 그대로 두면 벽 앞에서 매 턴 앞뒤로 흔들린다.
    const field = state.map.travelField(unit.unitClass, [goal], ignoresRough(unit));
    const here = field.get(key(unit.pos)) ?? Infinity, there = field.get(key(greedy)) ?? Infinity;
    if (!(there > here)) return greedy;
    return nearestBy(reach, (c) => field.get(key(c)) ?? Infinity) ?? greedy;
  }

  // 맨해튼 거리로는 더 가까워질 칸이 없다 — 벽을 돌아가야 하는 지형에서는
  // 우회로의 모든 칸이 "더 멀어" 보이기 때문이다. 이때만 지형을 통과하는
  // 실제 이동 거리로 다시 재서 지역 최소값을 벗어난다. 그리디가 전진할 수
  // 있는 상황의 판단은 그대로 둔다 — 전선의 거리감이 바뀌면 안 된다.
  const field = state.map.travelField(unit.unitClass, [goal], ignoresRough(unit));
  const detour = nearestBy(reach, (c) => field.get(key(c)) ?? Infinity);
  return detour ?? greedy;
}

/** 측정값이 가장 작은 도달 가능 칸. 동점은 좌표 순으로 갈라 결정론을 지킨다. */
function nearestBy(reach: Map<string, number>, measure: (c: Coord) => number): Coord | null {
  let best: Coord | null = null;
  let bestValue = Infinity;
  for (const c of decodeAll(reach)) {
    const value = measure(c);
    if (!Number.isFinite(value)) continue;
    if (value < bestValue || (value === bestValue && best !== null && key(c) < key(best))) {
      bestValue = value;
      best = c;
    }
  }
  return best;
}

function closest(from: Coord, units: Unit[]): Unit | null {
  let best: Unit | null = null;
  let bestD = Infinity;
  for (const u of units) {
    const d = manhattan(from, u.pos);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}

function closestCoord(from: Coord, coords: Coord[]): Coord | null {
  let best: Coord | null = null;
  let bestD = Infinity;
  for (const c of coords) {
    const d = manhattan(from, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function decodeAll(reach: Map<string, number>): Coord[] {
  const out: Coord[] = [];
  for (const k of reach.keys()) {
    const [x, y] = k.split(",");
    out.push({ x: Number(x), y: Number(y) });
  }
  return out;
}

export { key };
