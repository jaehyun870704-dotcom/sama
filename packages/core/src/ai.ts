/**
 * 적/우군 AI.
 *
 * 성능 요구사항 PF-05: 탐색 연산은 프레임 예산을 넘기지 않아야 한다.
 * 그래서 AI는 "유닛 1기 = 결정 1회"의 순수 함수로 작성하고,
 * 호출자가 시간 분할(time-slicing) 하도록 만든다. AI 자신은 루프를 돌지 않는다.
 */
import type { BattleState } from "./state.ts";
import type { Unit, Coord } from "./types.ts";
import type { Command } from "./commands.ts";
import { manhattan, key, sameCoord, isHostile } from "./grid.ts";
import { ignoresRough } from "./traits.ts";

/** 유닛 1기의 다음 행동을 결정한다. 상태를 변경하지 않는다. */
export function decide(state: BattleState, unit: Unit): Command[] {
  if (!unit.alive) return [];
  if (state.hasStatus(unit, "confusion")) return [{ kind: "wait", unit: unit.id }];

  const behavior = unit.behavior ?? "advance";
  if (behavior === "passive") return [{ kind: "wait", unit: unit.id }];

  const reach = state.map.reachable(unit, state.occupancy(), ignoresRough(unit));
  const hostiles = state.enemiesOf(unit.side);

  // 목표 지점 위에 서 있다면 점령이 최우선이다.
  const objective = objectiveRegion(state, unit);
  if (objective && onRegion(state, unit, objective)) {
    return [{ kind: "capture", unit: unit.id, region: objective }];
  }

  if (behavior === "race" || behavior === "flee") {
    const goal = raceGoal(state, unit, objective);
    if (goal) {
      const step = bestStepToward(reach, goal);
      return step ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
                  : [{ kind: "wait", unit: unit.id }];
    }
  }

  // 현재 위치 또는 이동 후 공격 가능한 최적의 대상을 찾는다
  const best = bestAttack(state, unit, reach, hostiles);
  if (best) {
    const cmds: Command[] = [];
    if (!sameCoord(best.from, unit.pos)) cmds.push({ kind: "move", unit: unit.id, to: best.from });
    cmds.push({ kind: "attack", unit: unit.id, target: best.target.id });
    return cmds;
  }

  if (behavior === "hold") return [{ kind: "wait", unit: unit.id }];

  // 교전 불가 → 목표 지점이 있으면 그쪽으로, 없으면 가장 가까운 적 쪽으로 전진
  const goal = objective
    ? closestCoord(unit.pos, state.map.regionCoords(objective))
    : (closest(unit.pos, hostiles)?.pos ?? null);
  if (!goal) return [{ kind: "wait", unit: unit.id }];
  const step = bestStepToward(reach, goal);
  return step
    ? [{ kind: "move", unit: unit.id, to: step }, { kind: "wait", unit: unit.id }]
    : [{ kind: "wait", unit: unit.id }];
}

/**
 * 이 유닛이 노려야 할 점령 목표.
 * 승리 조건(자기 진영이 점령)과 패배 조건(적대 진영이 점령)을 모두 읽는다 —
 * 후자가 곧 상대 진영에게는 승리 목표이기 때문이다. (M-07 RACE_CAPTURE)
 */
function objectiveRegion(state: BattleState, unit: Unit): string | null {
  for (const cond of [...state.victory, ...state.defeat]) {
    if (cond.type !== "capture" || !cond.target) continue;
    const by = cond.by ?? "player";
    if (by === unit.side) return cond.target;
    // 편입 아군은 플레이어 목표를 공유한다
    if (by === "player" && unit.side === "ally") return cond.target;
  }
  return null;
}

function onRegion(state: BattleState, unit: Unit, region: string): boolean {
  return state.map.regionCoords(region).some((c) => sameCoord(c, unit.pos));
}

interface AttackPlan {
  from: Coord;
  target: Unit;
  score: number;
}

function bestAttack(
  state: BattleState,
  unit: Unit,
  reach: Map<string, number>,
  hostiles: Unit[],
): AttackPlan | null {
  const [minR, maxR] = unit.range;
  const positions: Coord[] = [unit.pos, ...decodeAll(reach)];
  let best: AttackPlan | null = null;

  for (const from of positions) {
    for (const target of hostiles) {
      const d = manhattan(from, target.pos);
      if (d < minR || d > maxR) continue;
      // 점수: 처치 가능성 > 낮은 HP > 가까움
      const ratio = target.hp / target.stats.maxHp;
      const score = (1 - ratio) * 100 + (target.hp <= unit.stats.attack ? 500 : 0) - d;
      if (!best || score > best.score) best = { from, target, score };
    }
  }
  return best;
}

function raceGoal(state: BattleState, unit: Unit, objective: string | null): Coord | null {
  const regionName = unit.behavior === "flee" ? "exit" : (objective ?? "objective");
  if (!state.map.regions.has(regionName)) return null;
  return closestCoord(unit.pos, state.map.regionCoords(regionName));
}

function bestStepToward(reach: Map<string, number>, goal: Coord): Coord | null {
  let best: Coord | null = null;
  let bestDist = Infinity;
  for (const c of decodeAll(reach)) {
    const d = manhattan(c, goal);
    if (d < bestDist) {
      bestDist = d;
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
