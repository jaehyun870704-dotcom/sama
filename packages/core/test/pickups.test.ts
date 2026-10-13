/**
 * 전장 소모품 줍기: 마을·병영 → 회복의 콩, 성채 → 회복의 쌀, 보물고·관문 → 신비로운 물(시설마다 한 칸),
 * 우두머리 자리에는 드물게 복숭아·술. 직접 움직이는 아군이 그 칸에 멈추면 보관함에 들어가고 한 번만 줍는다.
 */
import { describe, it, expect } from "vitest";
import { Battle } from "../src/battle.ts";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { key } from "../src/grid.ts";
import { placePickups, BOSS_PICKUP_CHANCE } from "../src/pickups.ts";
import { minimalStage, flatMap } from "./fixtures.ts";
import type { Coord } from "../src/types.ts";

function field(seed = 1) {
  const map = flatMap(16, 10);
  // 성채 2×2(한 덩어리) · 관문 한 칸 · 마을 영역 · 병영 영역(출진 칸과 겹침) · 보물고 영역
  for (const c of [{ x: 10, y: 1 }, { x: 11, y: 1 }, { x: 10, y: 2 }, { x: 11, y: 2 }]) map.tileAt(c).terrain = "fort";
  map.tileAt({ x: 14, y: 8 }).terrain = "gate";
  const rect = (x: number, y: number, w: number, h: number): Coord[] => Array.from({ length: w * h }, (_, i) => ({ x: x + (i % w), y: y + Math.floor(i / w) }));
  map.regions.set("village", rect(2, 6, 2, 2));
  map.regions.set("north_camp", rect(0, 0, 2, 1));
  map.regions.set("player_start", rect(0, 0, 3, 2));
  map.regions.set("depot", rect(6, 4, 1, 1));
  map.regions.set("camp_label", rect(8, 8, 1, 1));
  const state = new BattleState(minimalStage(), map, seed);
  state.add(makeUnit({ id: "hero", side: "player", unitClass: "cavalry", level: 20, pos: { x: 1, y: 1 } }));
  state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 20, pos: { x: 15, y: 0 } }));
  const battle = new Battle(state, { seed, undoDepth: 5 });
  battle.start();
  return { state, battle };
}

describe("소모품이 놓이는 곳", () => {
  it("시설마다 한 칸: 마을 콩 · 성채 쌀 · 보물고와 관문 물, 출진 칸과 꼬리표 영역은 빼고", () => {
    const { state } = field();
    placePickups(state, 1);
    const items = [...state.pickups.entries()].filter(([k]) => k !== key({ x: 15, y: 0 }));
    const byItem = (id: string) => items.filter(([, v]) => v === id).map(([k]) => k);
    expect(byItem("bean")).toHaveLength(1);
    expect(["2,6", "3,6", "2,7", "3,7"]).toContain(byItem("bean")[0]);
    expect(byItem("rice")).toHaveLength(1);
    expect(["10,1", "11,1", "10,2", "11,2"]).toContain(byItem("rice")[0]);
    expect(byItem("water").sort()).toEqual(["14,8", "6,4"]);
    // 출진 칸 안의 병영에는 두지 않는다
    for (const [k] of items) expect(["0,0", "1,0"]).not.toContain(k);
    expect(state.pickups.has("8,8")).toBe(false);
  });

  it("같은 전장·같은 씨앗이면 늘 같고, 두 번 불러도 더 놓지 않는다", () => {
    const a = field(3), b = field(3);
    placePickups(a.state, 3); placePickups(b.state, 3);
    expect([...a.state.pickups]).toEqual([...b.state.pickups]);
    const n = a.state.pickups.size;
    placePickups(a.state, 3);
    expect(a.state.pickups.size).toBe(n);
  });

  it("복숭아·술은 우두머리 자리에서만, 드물게", () => {
    let rare = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { state } = field(seed);
      placePickups(state, seed);
      const at = state.pickups.get(key({ x: 15, y: 0 }));
      if (at) { expect(["peach", "wine"]).toContain(at); rare++; }
      for (const [k, v] of state.pickups) if (v === "peach" || v === "wine") expect(k).toBe("15,0");
    }
    expect(rare / 200).toBeGreaterThan(BOSS_PICKUP_CHANCE / 2);
    expect(rare / 200).toBeLessThan(BOSS_PICKUP_CHANCE * 1.6);
  });
});

describe("줍기", () => {
  it("아군이 그 칸에 멈추면 보관함에 들어가고, 기록에 남고, 한 번만 줍는다", () => {
    const { state, battle } = field();
    state.pickups.clear();
    state.pickups.set("4,1", "bean");
    expect(battle.execute({ kind: "move", unit: "hero", to: { x: 4, y: 1 } }).ok).toBe(true);
    expect(state.inventory.bean).toBe(1);
    expect(state.pickups.has("4,1")).toBe(false);
    expect(state.log.some((e) => e.t === "pickup" && e.item === "bean" && e.unit === "hero")).toBe(true);
    // 무르면 줍기도 되돌아간다
    expect(battle.undo()).toBe(true);
    expect(state.inventory.bean ?? 0).toBe(0);
    expect(state.pickups.get("4,1")).toBe("bean");
  });

  it("적은 줍지 않는다", () => {
    const { state, battle } = field();
    state.pickups.clear();
    state.pickups.set("14,0", "rice");
    for (let i = 0; i < 3 && state.currentSide !== "enemy"; i++) battle.execute({ kind: "endPhase" });
    expect(state.currentSide).toBe("enemy");
    expect(battle.execute({ kind: "move", unit: "foe", to: { x: 14, y: 0 } }).ok).toBe(true);
    expect(state.inventory.rice ?? 0).toBe(0);
    expect(state.pickups.get("14,0")).toBe("rice");
  });
});
