/**
 * 아군 자동 전투의 구출: 구출 대상(쓰러지면 지는 적 진영 유닛 · 닿아야 이기는 적 진영 유닛 · 곁에 가면 아군으로 넘어오는 유닛)은
 * 공격·책략 대상이 아니고, 구출을 맡은 장수는 지키는 적을 먼저 치운 뒤(남은 적 하나 이하 또는 15턴부터) 구하러 간다.
 */
import { describe, it, expect } from "vitest";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { decide, sparedFoes, RESCUE_TURN } from "../src/ai.ts";
import { manhattan } from "../src/grid.ts";
import { minimalStage, flatMap } from "./fixtures.ts";
import type { StageDef } from "../src/stage.ts";

function rescueStage(over: Partial<StageDef> = {}): StageDef {
  return minimalStage({
    victory: [{ type: "reach", unit: "hostage", target: "exit" }],
    defeat: [{ type: "retreat", unit: "hero" }, { type: "retreat", unit: "hostage" }],
    events: [{ id: "free", trigger: { type: "units_adjacent", unitA: "hero", unitB: "hostage" }, actions: [{ type: "grant_control", targets: ["hostage"] }] }],
    ...over,
  });
}

describe("구출 대상은 치지 않는다", () => {
  it("곁에서 칠 수 있어도 인질을 고르지 않고 지키는 적을 친다", () => {
    const state = new BattleState(rescueStage(), flatMap(10, 6), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 20, pos: { x: 4, y: 2 } }));
    state.add(makeUnit({ id: "hostage", side: "enemy", unitClass: "civilian", level: 1, pos: { x: 5, y: 2 }, behavior: "passive" }));
    state.add(makeUnit({ id: "guard_a", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 6, y: 4 } }));
    state.add(makeUnit({ id: "guard_b", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 8, y: 4 } }));
    expect([...sparedFoes(state)]).toEqual(["hostage"]);
    for (const id of ["hero"]) {
      const cmds = decide(state, state.get(id));
      expect(cmds.some((c) => c.kind === "attack" && c.target === "hostage")).toBe(false);
      expect(cmds.some((c) => c.kind === "strategy" && manhattan(c.at, state.get("hostage").pos) <= 1)).toBe(false);
    }
  });

  it("책사도 인질이 범위에 드는 책략을 쓰지 않는다", () => {
    const state = new BattleState(rescueStage({ defeat: [{ type: "retreat", unit: "hostage" }], events: [] }), flatMap(10, 6), 1);
    state.strategies.set("blast", { id: "blast", name: "폭풍", element: "wind", shape: "spread", range: 4, radius: 1, mpCost: 5, power: 200, targetSides: ["enemy"] });
    state.strategies.set("bolt", { id: "bolt", name: "화살", element: "fire", shape: "single", range: 4, radius: 0, mpCost: 5, power: 60, targetSides: ["enemy"] });
    state.add(makeUnit({ id: "sage", side: "player", unitClass: "strategist", level: 30, pos: { x: 2, y: 2 }, strategies: ["blast", "bolt"] }));
    state.add(makeUnit({ id: "hostage", side: "enemy", unitClass: "civilian", level: 1, pos: { x: 5, y: 2 }, behavior: "passive" }));
    state.add(makeUnit({ id: "guard", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 5, y: 3 } }));
    const cmds = decide(state, state.get("sage"));
    for (const c of cmds) {
      if (c.kind === "attack") expect(c.target).not.toBe("hostage");
      if (c.kind === "strategy") {
        const def = state.strategyFor(state.get("sage"), c.strategy)!;
        expect(def.shape === "single" || manhattan(c.at, state.get("hostage").pos) > def.radius).toBe(true);
      }
    }
  });

  it("쓰러지면 지는 적 진영 장수(살려 보낼 장수)도 고르지 않는다", () => {
    const state = new BattleState(minimalStage({ defeat: [{ type: "retreat", unit: "hero" }, { type: "retreat", unit: "spare" }] }), flatMap(8, 4), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 20, pos: { x: 3, y: 1 } }));
    state.add(makeUnit({ id: "spare", side: "enemy", unitClass: "cavalry", level: 5, pos: { x: 4, y: 1 } }));
    expect(sparedFoes(state).has("spare")).toBe(true);
    expect(decide(state, state.get("hero")).some((c) => c.kind === "attack")).toBe(false);
  });

  it("적 AI는 그대로다(아군 쪽만 거른다)", () => {
    const state = new BattleState(rescueStage(), flatMap(8, 4), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 5, pos: { x: 3, y: 1 } }));
    state.add(makeUnit({ id: "hostage", side: "enemy", unitClass: "civilian", level: 1, pos: { x: 7, y: 3 }, behavior: "passive" }));
    state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 20, pos: { x: 4, y: 1 } }));
    expect(decide(state, state.get("foe")).some((c) => c.kind === "attack" && c.target === "hero")).toBe(true);
  });
});

describe("구출 순서: 지키는 적을 먼저 치운 뒤 구한다", () => {
  const setup = (guards: number) => {
    const state = new BattleState(rescueStage(), flatMap(16, 8), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "cavalry", level: 30, pos: { x: 2, y: 3 } }));
    state.add(makeUnit({ id: "hostage", side: "enemy", unitClass: "civilian", level: 1, pos: { x: 6, y: 3 }, behavior: "passive" }));
    for (let i = 0; i < guards; i++) state.add(makeUnit({ id: "guard" + i, side: "enemy", unitClass: "infantry", level: 5, pos: { x: 14, y: 1 + i * 2 }, behavior: "hold" }));
    return state;
  };
  const endCell = (state: BattleState) => {
    const m = decide(state, state.get("hero")).find((c) => c.kind === "move");
    return m?.kind === "move" ? m.to : state.get("hero").pos;
  };

  it("지키는 적이 둘 이상 남았으면 구출 대상 곁에 서지 않는다", () => {
    const state = setup(3);
    expect(manhattan(endCell(state), state.get("hostage").pos)).toBeGreaterThan(1);
  });

  it("남은 적이 하나 이하가 되면 구출 대상 곁으로 간다", () => {
    const state = setup(1);
    expect(manhattan(endCell(state), state.get("hostage").pos)).toBe(1);
  });

  it(`${RESCUE_TURN}턴부터는 적이 남아 있어도 구하러 간다`, () => {
    const state = setup(3);
    state.turn = RESCUE_TURN;
    expect(manhattan(endCell(state), state.get("hostage").pos)).toBe(1);
  });

  it("구출을 맡지 않은 아군은 대상 곁 칸을 비워 둔다", () => {
    const state = setup(1);
    state.add(makeUnit({ id: "other", side: "player", unitClass: "infantry", level: 30, pos: { x: 5, y: 5 } }));
    const m = decide(state, state.get("other")).find((c) => c.kind === "move");
    const to = m?.kind === "move" ? m.to : state.get("other").pos;
    expect(manhattan(to, state.get("hostage").pos)).toBeGreaterThan(1);
  });
});
