/**
 * 스테이지 guardLeaders: 쓰러지면 지는 아군 장수는 자동 전투에서 다음 적 차례에 몰매를 맞을 칸으로 나서지 않는다.
 * (명마로 이동력이 는 제갈량이 기병 무리 앞까지 혼자 달려가 쓰러지던 문제 — Z1-05·Z1-11·Z2-16)
 */
import { describe, it, expect } from "vitest";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { decide } from "../src/ai.ts";
import { manhattan, effectiveMovement } from "../src/grid.ts";
import { unitReachSpec } from "../src/reach.ts";
import { minimalStage, flatMap } from "./fixtures.ts";
import type { Coord, Unit } from "../src/types.ts";
import type { Command } from "../src/commands.ts";

function field(guardLeaders: boolean | undefined, leaderX: number, map = flatMap(24, 5)) {
  const state = new BattleState(minimalStage({ guardLeaders }), map, 1);
  state.add(makeUnit({ id: "hero", side: "player", unitClass: "strategist", level: 5, pos: { x: leaderX, y: 2 } }));
  for (const [i, y] of [1, 2, 3].entries()) {
    state.add(makeUnit({ id: `rider_${i}`, side: "enemy", unitClass: "cavalry", level: 40, pos: { x: 16, y } }));
  }
  return state;
}

/** 이 칸에 다음 적 차례에 닿을 수 있는 적의 수(AI와 같은 넉넉한 거리: 이동력 + 넓은 전장 보정 + 사거리 + 직선 사거리 + 1). */
function threatsAt(state: BattleState, c: Coord): number {
  return state.living("enemy").filter((h: Unit) =>
    manhattan(h.pos, c) <= effectiveMovement(h) + state.map.moveBonus + h.range[1] + unitReachSpec(h).line + 1).length;
}

function destination(cmds: Command[], from: Coord): Coord {
  const move = cmds.find((c) => c.kind === "move");
  return move && move.kind === "move" ? move.to : from;
}

describe("guardLeaders: 쓰러지면 지는 장수는 몰매 자리로 나서지 않는다", () => {
  it("플래그가 없으면 적 쪽으로 다가가 적 기병이 닿는 칸에 선다(비교 기준)", () => {
    const state = field(undefined, 2);
    const to = destination(decide(state, state.get("hero")), state.get("hero").pos);
    expect(to.x).toBeGreaterThan(2);
    expect(threatsAt(state, to)).toBeGreaterThan(0);
  });

  it("guardLeaders면 칠 적이 없을 때 다가가도 적 기병이 닿지 않는 칸에 멈춘다", () => {
    const state = field(true, 2);
    const to = destination(decide(state, state.get("hero")), state.get("hero").pos);
    expect(threatsAt(state, to)).toBe(0);
  });

  it("넓은 전장의 이동력 보정(+2)까지 셈한다", () => {
    const map = flatMap(24, 5);
    map.moveBonus = 2;
    const state = field(true, 2, map);
    const to = destination(decide(state, state.get("hero")), state.get("hero").pos);
    expect(threatsAt(state, to)).toBe(0);
  });

  it("이미 몰매 자리에 서 있으면 맞을 피해가 적은 쪽으로 물러난다", () => {
    const state = field(true, 9);
    const hero = state.get("hero");
    const before = Math.min(...state.living("enemy").map((h) => manhattan(h.pos, hero.pos)));
    const cmds = decide(state, hero);
    const to = destination(cmds, hero.pos);
    expect(cmds.some((c) => c.kind === "attack" || c.kind === "strategy")).toBe(false);
    expect(Math.min(...state.living("enemy").map((h) => manhattan(h.pos, to)))).toBeGreaterThan(before);
  });

  it("쓰러지면 지는 장수가 아닌 아군은 그대로 다가간다", () => {
    const state = field(true, 2);
    state.add(makeUnit({ id: "officer", side: "player", unitClass: "strategist", level: 5, pos: { x: 2, y: 3 } }));
    const officer = state.get("officer");
    const to = destination(decide(state, officer), officer.pos);
    expect(threatsAt(state, to)).toBeGreaterThan(0);
  });
});
