import { describe, it, expect } from "vitest";
import { Battle } from "../src/battle.ts";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { flatMap, minimalStage } from "./fixtures.ts";
import type { StrategyDef } from "../src/types.ts";

const windDragon: StrategyDef = {
  id: "windDragon", name: "풍룡", element: "wind", shape: "spread",
  range: 4, radius: 1, mpCost: 10, power: 130, targetSides: ["enemy"],
};
const strategies = new Map([["windDragon", windDragon]]);

function setup(chain: boolean, casterSpirit: number) {
  const state = new BattleState(minimalStage(), flatMap(8, 8), 1);
  const hero = makeUnit({ id: "hero", side: "player", unitClass: "strategist", level: 30, pos: { x: 1, y: 1 } });
  const foe = makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 30, pos: { x: 3, y: 1 } });
  hero.strategies = ["windDragon"]; hero.mp = 99; hero.stats.spirit = casterSpirit; hero.chainCast = chain;
  foe.stats.spirit = 10; foe.stats.maxHp = 9999; foe.hp = 9999;
  state.add(hero); state.add(foe);
  const battle = new Battle(state, { seed: 1, strategies });
  battle.start();
  return { state, battle };
}

describe("연속 책략(규칙판 11)", () => {
  it("정신력이 표적의 세 배를 넘으면 반드시 한 번 더, MP는 한 번만 든다", () => {
    const { state, battle } = setup(true, 100);
    expect(battle.execute({ kind: "strategy", unit: "hero", strategy: "windDragon", at: { x: 3, y: 1 } }).ok).toBe(true);
    const casts = state.log.filter((e) => e.t === "strategy");
    expect(casts).toHaveLength(2);
    expect(casts[1]).toMatchObject({ double: true, targets: ["foe"] });
    expect(state.get("hero").mp).toBe(89);
  });
  it("규칙판 11이 아니면(chainCast 없음) 한 번만 시전한다", () => {
    const { state, battle } = setup(false, 100);
    battle.execute({ kind: "strategy", unit: "hero", strategy: "windDragon", at: { x: 3, y: 1 } });
    expect(state.log.filter((e) => e.t === "strategy")).toHaveLength(1);
  });
  it("정신력이 같으면 거의 일어나지 않는다(1%)", () => {
    let doubles = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const state = new BattleState(minimalStage(), flatMap(8, 8), seed);
      const hero = makeUnit({ id: "hero", side: "player", unitClass: "strategist", level: 30, pos: { x: 1, y: 1 } });
      const foe = makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 30, pos: { x: 3, y: 1 } });
      hero.strategies = ["windDragon"]; hero.mp = 99; hero.chainCast = true; hero.stats.spirit = 50; foe.stats.spirit = 50; foe.stats.maxHp = 9999; foe.hp = 9999;
      state.add(hero); state.add(foe);
      const battle = new Battle(state, { seed, strategies });
      battle.start();
      battle.execute({ kind: "strategy", unit: "hero", strategy: "windDragon", at: { x: 3, y: 1 } });
      doubles += state.log.filter((e) => e.t === "strategy" && e.double).length;
    }
    expect(doubles).toBeLessThanOrEqual(3);
  });
});
