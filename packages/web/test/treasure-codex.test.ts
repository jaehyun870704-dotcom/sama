import { describe, it, expect } from "vitest";
import { filterTreasures, defaultFilter, treasureSource } from "../src/treasure-codex.ts";
import { TREASURE_ART, SHOP_ART, ATLAS_CELLS, artKey, formOf, FORMS, relicIcon, treasureIcon } from "../src/treasure-art.ts";
import { treasures } from "../src/progression.ts";
import { RELICS } from "../src/roguelike.ts";
import { SHOP_GEAR } from "../../core/src/index.ts";

const h = { owned: new Set(["yitian", "silverShield"]), wearer: new Map<string, string>(), relics: new Set(["drum"]) };

describe("보물 도감 필터", () => {
  it("전체는 고유 보물 50점과 회차 보물을 모두 담는다", () => {
    expect(treasures).toHaveLength(50);
    expect(filterTreasures(defaultFilter(), h)).toHaveLength(treasures.length + RELICS.length);
  });
  it("칸·종류·등급·보유로 거른다", () => {
    const shields = filterTreasures({ kind: "accessory", form: "shield", grade: 0, own: "all" }, h).map((e) => e.id);
    expect(shields.sort()).toEqual(["silverShield", "windGodShield"]);
    const horses = filterTreasures({ kind: "accessory", form: "horse", grade: 0, own: "all" }, h).map((e) => e.id);
    expect(horses.sort()).toEqual(["dilu", "redHare", "shadowHorse", "yellowHorse"]);
    const legend = filterTreasures({ kind: "weapon", form: "all", grade: 4, own: "all" }, h);
    expect(legend.length).toBeGreaterThan(0);
    expect(legend.every((e) => e.kind === "weapon" && e.grade === 4)).toBe(true);
    expect(filterTreasures({ kind: "all", form: "all", grade: 0, own: "owned" }, h).map((e) => e.id).sort()).toEqual(["drum", "silverShield", "yitian"]);
    expect(filterTreasures(defaultFilter("owned"), h)).toHaveLength(3);
  });
  it("모든 보물의 종류는 그 보물 칸(무기·방어구·보조구)에 속한다", () => {
    for (const t of treasures) expect(FORMS.find((f) => f.id === formOf(t.id))!.slot, t.id).toBe(t.slot);
  });
  it("두 이야기 모두에서 얻는 곳이 글로 보인다", () => {
    for (const t of treasures) {
      expect(treasureSource(t.stage), t.id).not.toBe(t.stage);
      expect(treasureSource(t.zstage), t.id).toContain("제갈량전");
    }
  });
});
describe("장비 그림", () => {
  it("고유 보물 50점은 모두 자기 그림이 있고, 서로 겹치지 않는다", () => {
    const keys = treasures.map((t) => artKey(t.id));
    for (const t of treasures) { expect(TREASURE_ART.has(artKey(t.id)!), t.id).toBe(true); expect(treasureIcon(t.id), t.id).not.toContain("pending"); }
    expect(new Set(keys).size).toBe(50);
    expect(ATLAS_CELLS).toHaveLength(60);
    expect(treasureIcon("lubuBow")).toContain("treasures-legend-01-v1.webp");
    expect(treasureIcon("meteorHammer")).toContain("treasures-extra-01-v1.webp");
    expect(treasureIcon("taipingYaoshu")).toContain("treasures-unique-02-v1.webp");
  });
  it("상점 장비는 지운 보물의 칸을 다시 쓰거나, 종류 글자 패로 그린다(그림 칸은 고유 보물과 겹치지 않는다)", () => {
    const named = new Set(treasures.map((t) => t.id));
    for (const d of SHOP_GEAR) {
      const key = artKey(d.id);
      if (key) { expect(TREASURE_ART.has(key), d.id).toBe(true); expect(named.has(key), d.id).toBe(false); expect(treasureIcon(d.id + "#3")).not.toContain("pending"); }
      else expect(treasureIcon(d.id + "#3")).toContain("pending");
    }
    expect(Object.keys(SHOP_ART).length).toBeGreaterThanOrEqual(8);
    // 상점 그림판(2026-10-13): 투석기·부채·두건 4등급, 장갑 2~4등급, 돌보검, 구리·철 기마갑옷
    for (const id of ["catapult:1", "fan:2", "hood:4", "gloves:3", "sacredSword:1", "barding:2", "barding:3"]) expect(treasureIcon(`shop:${id}`), id).toContain("shop-items/shop-items-0");
    expect(treasureIcon("shop:gloves:1")).toContain("pending");
    for (const r of RELICS) expect(relicIcon(r.id, r.name), r.id).not.toContain("pending");
  });
});
