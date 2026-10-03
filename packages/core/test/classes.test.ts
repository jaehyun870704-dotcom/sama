import { describe, it, expect } from "vitest";
import { makeUnit, evolveUnit, statsFor } from "../src/units.ts";
import { evolvedClass, familyOf, tierOf, nextEvolution, VARIANTS, EVOLUTION } from "../src/classes.ts";
import { matchupMultiplier } from "../src/formulas.ts";
import { flatMap } from "./fixtures.ts";
import type { UnitClass } from "../src/types.ts";

describe("병종 계통과 진화", () => {
  it("evolves at the lineage thresholds, skipping tiers when the level is already past them", () => {
    expect(evolvedClass("infantry", 7)).toBe("infantry");
    expect(evolvedClass("infantry", 8)).toBe("shieldGuard");
    expect(evolvedClass("infantry", 20)).toBe("royalGuard");
    expect(evolvedClass("navy", 30)).toBe("navy");
    expect(nextEvolution("archer")).toEqual({ to: "longbow", level: 8 });
    expect(nextEvolution("royalGuard")).toBeUndefined();
  });
  it("every evolution target is a defined variant one tier up in the same family", () => {
    for (const [from, [to]] of Object.entries(EVOLUTION) as Array<[UnitClass, readonly [UnitClass, number]]>) {
      expect(VARIANTS[to]).toBeDefined();
      expect(familyOf(to)).toBe(familyOf(from));
      expect(tierOf(to)).toBeGreaterThan(tierOf(from));
    }
  });
  it("keeps the HP ratio and swaps in the new class's range and traits on evolution", () => {
    const u = makeUnit({ id: "a", side: "player", unitClass: "archer", level: 16, pos: { x: 0, y: 0 } });
    u.hp = Math.round(u.stats.maxHp / 2);
    expect(evolveUnit(u, "sharpshooter")).toBe("archer");
    expect(u.range).toEqual([2, 4]);
    expect(u.traits).toContain("penetrate");
    expect(u.stats.attack).toBe(statsFor("sharpshooter", 16).attack);
    expect(Math.abs(u.hp / u.stats.maxHp - 0.5)).toBeLessThan(0.02);
    const g = makeUnit({ id: "g", side: "player", unitClass: "shieldGuard", level: 16, pos: { x: 0, y: 0 } });
    evolveUnit(g, "royalGuard");
    expect(g.traits.filter((t) => t === "guardian")).toHaveLength(1);
  });
  it("lets extended classes move and match up like their family", () => {
    const map = flatMap(4, 4, "forest");
    expect(map.moveCost("phantom", { x: 1, y: 1 })).toBe(map.moveCost("bandit", { x: 1, y: 1 }));
    expect(map.moveCost("warElephant", { x: 1, y: 1 })).toBe(map.moveCost("heavyCav", { x: 1, y: 1 }));
    expect(matchupMultiplier("halberdier", "tigerRider")).toBe(matchupMultiplier("spearman", "cavalry"));
  });
  it("gives rattan armour its physical resistance at the cost of a fire weakness", () => {
    const r = makeUnit({ id: "r", side: "enemy", unitClass: "rattan", level: 5, pos: { x: 0, y: 0 } });
    expect(r.traitParams.physicalDamageReduction).toBe(25);
    expect(r.traits).toContain("fireWeakness");
  });
});
