import { describe, it, expect } from "vitest";
import { filterTreasures, defaultFilter } from "../src/treasure-codex.ts";
import { formOf, FORMS, relicIcon, treasureIcon } from "../src/treasure-art.ts";
import { treasures } from "../src/progression.ts";
import { RELICS } from "../src/roguelike.ts";

const h = { owned: new Set(["yitian", "rattanShield"]), wearer: new Map<string, string>(), relics: new Set(["drum"]) };

describe("보물 도감 필터", () => {
  it("전체는 장착 보물과 회차 보물을 모두 담는다", () => {
    expect(filterTreasures(defaultFilter(), h)).toHaveLength(treasures.length + RELICS.length);
  });
  it("종류·형태·등급·보유로 거른다", () => {
    const shields = filterTreasures({ kind: "armor", form: "shield", grade: 0, own: "all" }, h).map((e) => e.id);
    expect(shields).toEqual(expect.arrayContaining(["rattanShield", "phoenixHelm", "tigerShield", "lionHelm"]));
    expect(shields).toHaveLength(4);
    const legend = filterTreasures({ kind: "weapon", form: "all", grade: 4, own: "all" }, h);
    expect(legend.length).toBeGreaterThan(0);
    expect(legend.every((e) => e.kind === "weapon" && e.grade === 4)).toBe(true);
    expect(filterTreasures({ kind: "all", form: "all", grade: 0, own: "owned" }, h).map((e) => e.id).sort()).toEqual(["drum", "rattanShield", "yitian"]);
    expect(filterTreasures(defaultFilter("owned"), h)).toHaveLength(3);
  });
  it("모든 보물의 형태는 그 보물 칸(무기·방어구·보조구)에 속한다", () => {
    for (const t of treasures) expect(FORMS.find((f) => f.id === formOf(t.id))!.slot).toBe(t.slot ?? FORMS.find((f) => f.id === formOf(t.id))!.slot);
  });
  it("그림 판 밖의 보물은 준비 중 패, 같은 이름의 회차 보물은 판 그림", () => {
    expect(treasureIcon("lionHelm")).toContain("pending");
    expect(treasureIcon("yitian")).not.toContain("pending");
    expect(relicIcon("drum", "진군고")).not.toContain("pending");
    expect(relicIcon("whetstone", "숫돌")).toContain("pending");
  });
});
