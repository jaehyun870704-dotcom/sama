import type { BattleState } from "./state.ts";
import type { VictoryCondition } from "./stage.ts";
import { sameCoord } from "./grid.ts";
import type { Side } from "./types.ts";

/**
 * 조건 평가. 승리 · 패배 · 인장이 모두 같은 술어 집합을 공유한다.
 * 인장을 별도 로직으로 만들면 "승리 조건과 인장이 어긋나는" 버그가 생긴다.
 */
export function evaluate(state: BattleState, cond: VictoryCondition): boolean {
  switch (cond.type) {
    case "annihilate": {
      const side: Side = cond.side ?? "enemy";
      return state.living(side).length === 0;
    }

    case "reach": {
      if (!cond.unit || !cond.target) return false;
      const u = state.find(cond.unit);
      if (!u || !u.alive) return false;
      return state.map
        .regionCoords(cond.target)
        .some((c) => sameCoord(c, u.pos));
    }

    case "capture": {
      if (!cond.target) return false;
      return state.captured.get(cond.target) === (cond.by ?? "player");
    }

    case "retreat": {
      if (!cond.unit) return false;
      const u = state.find(cond.unit);
      return u !== undefined && !u.alive;
    }

    case "enemy_retreat_count":
      return state.losses.enemy >= (cond.n ?? 0);

    case "ally_loss_limit": {
      // "아군 N부대 미만 퇴각" — 편입 아군(ally)을 포함한다. PRD R-5.5
      const lost = state.losses.player + state.losses.ally;
      return lost < (cond.n ?? Infinity);
    }

    case "turn_limit":
      return state.turn <= (cond.n ?? Infinity);

    case "survive_turns": {
      const label = cond.target ?? "default";
      const start = state.survivalClocks.get(label);
      if (start === undefined) return false;
      return state.turn - start >= (cond.n ?? 0);
    }

    case "escort_survive": {
      const side: Side = cond.side ?? "allyAi";
      return state.living(side).length > 0;
    }

    case "dialogue_complete":
      return state.choices.some((c) => c.nodeId === cond.target);
  }
}

/**
 * 순차 조건 평가.
 * order가 없으면 OR, order가 있으면 낮은 단계부터 순차로 모두 충족해야 한다.
 * (예: "상용 도달 → 맹달 처치")
 */
export function evaluateGroup(state: BattleState, conds: VictoryCondition[]): boolean {
  if (conds.length === 0) return false;
  const ordered = conds.filter((c) => c.order !== undefined);
  const unordered = conds.filter((c) => c.order === undefined);

  if (unordered.some((c) => evaluate(state, c))) return true;
  if (ordered.length === 0) return false;

  const steps = [...new Set(ordered.map((c) => c.order!))].sort((a, b) => a - b);
  return steps.every((step) =>
    ordered.filter((c) => c.order === step).some((c) => evaluate(state, c)),
  );
}

/**
 * 인장 문자열을 조건으로 파싱한다. 예: "turn_limit:20" → { type, n: 20 }
 * 인자가 빠지거나 숫자가 아니면 즉시 throw 한다 — 오타난 인장이 조용히
 * "항상 달성"으로 동작하면 QA에서 잡히지 않는다.
 */
export function parseSeal(expr: string): VictoryCondition | null {
  if (expr === "clear") return null;
  const [head, arg] = expr.split(":");

  const num = (): number => {
    const n = Number(arg);
    if (arg === undefined || !Number.isFinite(n)) {
      throw new Error(`인장 표현식에 숫자 인자가 필요함: "${expr}"`);
    }
    return n;
  };
  const str = (): string => {
    if (arg === undefined || arg === "") {
      throw new Error(`인장 표현식에 대상 인자가 필요함: "${expr}"`);
    }
    return arg;
  };

  switch (head) {
    case "turn_limit":
      return { type: "turn_limit", n: num() };
    case "player_losses_lt":
      return { type: "ally_loss_limit", n: num() };
    case "no_player_losses":
      return { type: "ally_loss_limit", n: 1 };
    case "enemy_retreat_count":
      return { type: "enemy_retreat_count", n: num() };
    case "unit_retreat":
      return { type: "retreat", unit: str() };
    case "unit_survives":
      return { type: "escort_survive", side: "allyAi" };
    case "dialogue":
      return { type: "dialogue_complete", target: str() };
    default:
      throw new Error(`알 수 없는 인장 표현식: ${expr}`);
  }
}

/** 전투 종료 후 획득 인장 슬롯을 판정한다. */
export function awardedSeals(
  state: BattleState,
  difficulty: "normal" | "extreme",
): number[] {
  if (state.outcome !== "victory") return [];
  const awarded: number[] = [];
  for (const seal of state.stage.seals) {
    const expr = difficulty === "normal" ? seal.normal : seal.extreme;
    const cond = parseSeal(expr);
    if (cond === null || evaluate(state, cond)) awarded.push(seal.slot);
  }
  return awarded;
}
