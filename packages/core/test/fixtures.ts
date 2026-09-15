import { BattleMap } from "../src/grid.ts";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import type { Tile, TerrainKind, Coord } from "../src/types.ts";
import type { StageDef } from "../src/stage.ts";

export function flatMap(w: number, h: number, terrain: TerrainKind = "plain"): BattleMap {
  const tiles: Tile[] = Array.from({ length: w * h }, () => ({
    terrain,
    height: 0,
    hazard: "none" as const,
    hazardTurns: 0,
  }));
  const regions = new Map<string, Coord[]>([
    ["objective", [{ x: w - 1, y: h - 1 }]],
    ["exit", [{ x: 0, y: 0 }]],
  ]);
  return new BattleMap(w, h, tiles, regions);
}

export function minimalStage(over: Partial<StageDef> = {}): StageDef {
  return {
    id: "S1-99",
    arc: "upper",
    order: 99,
    title: "테스트",
    deployment: { forced: ["hero"], slots: 1 },
    victory: [{ type: "annihilate", side: "enemy" }],
    defeat: [{ type: "retreat", unit: "hero" }],
    seals: [
      { slot: 1, normal: "clear", extreme: "clear" },
      { slot: 2, normal: "turn_limit:10", extreme: "turn_limit:8" },
      { slot: 3, normal: "no_player_losses", extreme: "no_player_losses" },
    ],
    difficulty: {
      normal: { minEnemyLevel: 10, recommendedLevel: 20 },
      extreme: { minEnemyLevel: 50, recommendedLevel: 80 },
    },
    perf: { maxSimultaneousUnits: 10, tier: "A" },
    ...over,
  };
}

export function duelState(seed = 1, heroLevel = 20, foeLevel = 20): BattleState {
  const state = new BattleState(minimalStage(), flatMap(8, 8), seed);
  state.add(makeUnit({ id: "hero", side: "player", unitClass: "strategist", level: heroLevel, pos: { x: 1, y: 1 }, strategies: ["windDragon"] }));
  state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: foeLevel, pos: { x: 2, y: 1 }, behavior: "advance" }));
  return state;
}
