import { describe, it, expect } from "vitest";
import { Battle } from "../src/battle.ts";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { defineTrait } from "../src/traits.ts";
import { flatMap, minimalStage } from "./fixtures.ts";
import {
  NAMED_GEAR, SHOP_GEAR, SHOP_KINDS, SHOP_NAMES, GEAR_KINDS, allGearClasses, hasGearGroup, gearGroupOf, GROUP_GEAR, gearAllowed, gearDef,
  gearStats, maxLevelOf, gearLevelFromExp, CONSUMABLES, consumable,
} from "../src/equipment.ts";
import type { Unit, UnitClass, StrategyDef } from "../src/types.ts";

/** 장비 하나의 고유 기능(특성)을 부대에 입힌다(능력치는 웹 계층이 더한다). */
function wear(u: Unit, id: string) {
  const d = gearDef(id)!;
  for (const [t, p] of d.traits ?? []) { if (!u.traits.includes(t)) u.traits.push(t); u.traitParams[t] = p; }
}
function field(units: Array<{ id: string; side: "player" | "enemy" | "ally"; cls: UnitClass; x: number; y: number; level?: number }>, seed = 7, strategies?: Map<string, StrategyDef>) {
  const state = new BattleState(minimalStage(), flatMap(10, 10), seed);
  for (const u of units) state.add(makeUnit({ id: u.id, side: u.side, unitClass: u.cls, level: u.level ?? 20, pos: { x: u.x, y: u.y } }));
  const battle = new Battle(state, { seed, undoDepth: 0, ...(strategies ? { strategies } : {}) });
  battle.start();
  return { state, battle };
}
defineTrait({ id: "test:double", name: "시험용 2회 공격", description: "", hooks: { alwaysDouble: true } });

describe("고유 보물 50 · 상점 장비 · 계통 제한", () => {
  it("고유 보물은 정확히 50점, 번호·이름·종류·등급이 표와 같다", () => {
    expect(NAMED_GEAR.map((d) => d.name)).toEqual([
      "자웅일대검", "청공검", "의천검", "고정도", "청룡언월도", "사모", "방천화극", "여포궁", "이광궁", "유성추",
      "쌍편", "금화관포", "파초선", "오화신염선", "백우선", "칠성검", "성자보검", "거울갑옷", "황금갑옷", "연환갑옷",
      "백은갑옷", "용린갑옷", "비룡도복", "학창", "칠흑도복", "봉황깃옷", "백은방패", "풍신방패", "바람바퀴", "조황비전",
      "절영", "적토마", "적로", "철투구", "제갈건", "몰우전", "손자병법서", "맹덕신서", "청낭서", "태평청령서",
      "태평요술서", "둔갑천서", "육도", "삼략", "콩주머니", "옥새", "청룡보옥", "주작보옥", "현무보옥", "백호보옥",
    ]);
    expect(new Set(NAMED_GEAR.map((d) => d.id)).size).toBe(50);
    expect(NAMED_GEAR.map((d) => d.grade)).toEqual([3, 4, 4, 3, 4, 4, 4, 4, 3, 3, 3, 3, 2, 3, 4, 2, 3, 4, 3, 2, 3, 4, 2, 3, 3, 4, 2, 4, 3, 4, 3, 4, 3, 2, 3, 3, 3, 4, 4, 2, 4, 4, 2, 2, 2, 4, 4, 4, 4, 4]);
    const g = Object.fromEntries(NAMED_GEAR.map((d) => [d.id, d.grade]));
    expect([g.qinggang, g.greenDragon, g.fan, g.dragonArmor, g.seal, g.azureJewel]).toEqual([4, 4, 4, 4, 4, 4]);
    expect([g.plantainFan, g.sevenstar, g.linkedArmor, g.silverShield, g.ironHelm, g.taiping, g.beanBag]).toEqual([2, 2, 2, 2, 2, 2, 2]);
    for (const d of NAMED_GEAR) expect(d.price, d.id).toBe(0);
  });
  it("상점 장비는 14종 × 4등급, 이름은 표대로", () => {
    expect(SHOP_KINDS).toHaveLength(14);
    expect(SHOP_GEAR).toHaveLength(56);
    expect(SHOP_NAMES.sword).toEqual(["단검", "대검", "강검", "백련검"]);
    expect(SHOP_NAMES.barding).toEqual(["가죽기마갑옷", "구리기마갑옷", "철기마갑옷", "강철기마갑옷"]);
    for (const k of SHOP_KINDS) for (const grade of [1, 2, 3, 4] as const) {
      const d = gearDef(`shop:${k}:${grade}`)!;
      expect(d.name).toBe(SHOP_NAMES[k]![grade - 1]);
      expect(d.price).toBeGreaterThan(0);
      if (grade > 1) expect(d.price).toBeGreaterThan(gearDef(`shop:${k}:${grade - 1}`)!.price);
    }
    // 창은 같은 등급 검보다 약간 높고, 활·곤봉은 약간 낮다. 옷은 갑옷보다 낮다.
    const atk = (id: string, l = 1) => gearStats(gearDef(id)!, l).attack ?? 0;
    expect(atk("shop:spear:4")).toBeGreaterThan(atk("shop:sword:4"));
    expect(atk("shop:bow:4")).toBeLessThan(atk("shop:sword:4"));
    expect(gearStats(gearDef("shop:robe:4")!).defense!).toBeLessThan(gearStats(gearDef("shop:armor:4")!).defense!);
  });
  it("장비 레벨: 상점 장비 최고 3, 고유 보물 최고 9, 보조구는 레벨이 없다. 고유 보물 만렙은 같은 등급 상점 만렙보다 조금 높다", () => {
    expect(maxLevelOf(gearDef("shop:sword:2")!)).toBe(3);
    expect(maxLevelOf(gearDef("qinggang")!)).toBe(9);
    expect(maxLevelOf(gearDef("redHare")!)).toBe(1);
    expect(gearLevelFromExp(gearDef("shop:sword:1")!, 0)).toBe(1);
    expect(gearLevelFromExp(gearDef("shop:sword:1")!, 80)).toBe(3);
    expect(gearLevelFromExp(gearDef("yitian")!, 99999)).toBe(9);
    const named = gearDef("yitian")!, shop = gearDef("shop:sword:4")!;
    expect(gearStats(named, 1).attack!).toBeLessThanOrEqual(gearStats(shop, 1).attack!);
    expect(gearStats(named, 9).attack!).toBeGreaterThan(gearStats(shop, 3).attack!);
  });
  it("모든 병종이 계통 표에 있고, 계통마다 무기 하나·방어구 하나", () => {
    for (const c of allGearClasses()) expect(hasGearGroup(c), c).toBe(true);
    for (const [g, gear] of Object.entries(GROUP_GEAR)) {
      expect(GEAR_KINDS[gear.weapon].slot, g).toBe("weapon");
      expect(GEAR_KINDS[gear.armor].slot, g).toBe("armor");
    }
    expect(gearGroupOf("lancer")).toBe("cav");
    expect(gearGroupOf("divineStrategist")).toBe("strategist");
    expect(gearGroupOf("mountedSage")).toBe("mountedStrategist");
  });
  it("계통별 장착 제한과 보조구 예외", () => {
    expect(gearAllowed("shop:spear:1", "cavalry").ok).toBe(true);
    expect(gearAllowed("shop:sword:1", "cavalry")).toEqual({ ok: false, reason: "군주·보병·적병·해적계만" });
    expect(gearAllowed("fan", "strategist").ok).toBe(true);
    expect(gearAllowed("shop:armor:1", "strategist").reason).toBe("갑옷 입는 계통만");
    expect(gearAllowed("shop:robe:1", "strategist").ok).toBe(true);
    expect(gearAllowed("shop:barding:1", "heavyCav").ok).toBe(true);
    expect(gearAllowed("shop:barding:1", "horseArcher").ok).toBe(true);
    expect(gearAllowed("shop:barding:1", "infantry").reason).toBe("기병계·궁기병계만");
    expect(gearAllowed("noFeatherDart", "bandit").ok).toBe(true);
    expect(gearAllowed("noFeatherDart", "infantry").ok).toBe(false);
    expect(gearAllowed("shop:helmet:1", "infantry").ok).toBe(true);
    expect(gearAllowed("shop:helmet:1", "strategist").ok).toBe(false);
    expect(gearAllowed("shop:hood:1", "strategist").ok).toBe(true);
    expect(gearAllowed("shop:hood:1", "infantry").ok).toBe(false);
    expect(gearAllowed("ironHelm", "infantry").ok).toBe(true);
    expect(gearAllowed("ironHelm", "spearman").reason).toBe("보병계만");
    expect(gearAllowed("windWheel", "catapult").ok).toBe(true);
    expect(gearAllowed("windWheel", "cavalry").ok).toBe(false);
    expect(gearAllowed("azureJewel", "mountedStrategist").ok).toBe(true);
    expect(gearAllowed("azureJewel", "strategist").ok).toBe(false);
    expect(gearAllowed("vermilionJewel", "strategist").ok).toBe(true);
    expect(gearAllowed("blackTortoiseJewel", "taoist").ok).toBe(true);
    expect(gearAllowed("whiteTigerJewel", "fengshui").ok).toBe(true);
    expect(gearAllowed("redHare", "strategist").ok).toBe(true);
    expect(gearAllowed("shop:shield:2", "monk").ok).toBe(true);
  });
});

describe("고유 기능 · 엔진", () => {
  it("재반격: 상대가 반격하면 한 번 더 받아친다(자웅일대검·쌍편)", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    for (const u of state.units.values()) { u.stats.maxHp = u.hp = 999; }
    wear(state.get("a"), "doubleSwords");
    expect(battle.execute({ kind: "attack", unit: "a", target: "d" }).ok).toBe(true);
    const counters = state.log.filter((e) => e.t === "counter");
    expect(counters.map((e) => e.t === "counter" && e.attacker)).toEqual(expect.arrayContaining(["d", "a"]));
    expect(counters.findIndex((e) => e.t === "counter" && e.attacker === "a")).toBeGreaterThan(counters.findIndex((e) => e.t === "counter" && e.attacker === "d"));
  });
  it("무반격: 청룡언월도의 공격에는 반격도 재반격도 없다", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "cavalry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    for (const u of state.units.values()) { u.stats.maxHp = u.hp = 999; }
    wear(state.get("a"), "greenDragon"); wear(state.get("a"), "doubleSwords");
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    expect(state.log.some((e) => e.t === "counter")).toBe(false);
  });
  it("관통: 맞힌 적 바로 뒤의 적도 맞는다(사모)", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "spearman", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }, { id: "b", side: "enemy", cls: "infantry", x: 3, y: 1 }]);
    for (const u of state.units.values()) { u.stats.maxHp = u.hp = 999; }
    wear(state.get("a"), "serpentSpear");
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    expect(state.log.some((e) => e.t === "attack" && e.attacker === "a" && e.defender === "b")).toBe(true);
  });
  it("인도 공격: 적을 퇴각시키면 사거리 안 다른 적을 한 번 더 친다(방천화극)", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "cavalry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }, { id: "b", side: "enemy", cls: "infantry", x: 1, y: 2 }]);
    const a = state.get("a"); a.traits.push("alwaysHit"); wear(a, "halberd");
    state.get("d").hp = 1; state.get("b").stats.maxHp = state.get("b").hp = 999;
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    expect(state.get("d").alive).toBe(false);
    expect(state.log.some((e) => e.t === "attack" && e.attacker === "a" && e.defender === "b")).toBe(true);
  });
  it("간접 방어: 거울갑옷은 활·노·투석기의 공격을 반드시 피한다", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { state, battle } = field([{ id: "a", side: "player", cls: "archer", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 3, y: 1 }], seed);
      state.get("a").traits.push("alwaysHit"); wear(state.get("d"), "mirrorArmor");
      battle.execute({ kind: "attack", unit: "a", target: "d" });
      expect(state.log.filter((e) => e.t === "attack").every((e) => e.t === "attack" && !e.hit)).toBe(true);
    }
  });
  it("회심: 옥새는 반드시 회심, 황금갑옷은 회심을 받지 않는다", () => {
    const run = (guard: boolean) => {
      const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
      for (const u of state.units.values()) { u.stats.maxHp = u.hp = 999; }
      state.get("a").traits.push("alwaysHit"); wear(state.get("a"), "seal"); if (guard) wear(state.get("d"), "goldArmor");
      battle.execute({ kind: "attack", unit: "a", target: "d" });
      return state.log.find((e) => e.t === "attack" && e.attacker === "a");
    };
    expect(run(false)).toMatchObject({ critical: true });
    expect(run(true)).toMatchObject({ critical: false });
  });
  it("연격 방어: 연속 공격의 두 번째 타격을 반드시 피한다(연환갑옷)", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    for (const u of state.units.values()) { u.stats.maxHp = u.hp = 999; }
    state.get("a").traits.push("alwaysHit", "test:double"); wear(state.get("d"), "linkedArmor");
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    const hits = state.log.filter((e) => e.t === "attack" && e.attacker === "a");
    expect(hits).toHaveLength(2);
    expect(hits[1]).toMatchObject({ double: true, hit: false });
  });
  it("MP 방어: 용린갑옷은 물리 피해를 MP로 받는다(MP가 모자라면 MP만 0)", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    const d = state.get("d"); d.stats.maxMp = d.mp = 5; d.stats.maxHp = d.hp = 999; wear(d, "dragonArmor");
    state.get("a").traits.push("alwaysHit");
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    expect(d.hp).toBe(999);
    expect(d.mp).toBe(0);
  });
  it("돌격 이동: 적토마는 적이 선 칸을 지나간다(멈추지는 못한다)", () => {
    const { state } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "e", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    const a = state.get("a"); a.stats.movement = 2;
    for (const u of state.units.values()) if (u.id !== "a" && u.id !== "e") u.alive = false;
    // 위·아래를 막아 둔다: 오른쪽 적을 지나야만 (3,1)에 닿는다.
    const walls = [{ x: 1, y: 0 }, { x: 1, y: 2 }, { x: 0, y: 1 }];
    let i = 0; for (const w of walls) state.add(makeUnit({ id: "w" + i++, side: "enemy", unitClass: "infantry", level: 1, pos: w }));
    expect(state.map.reachable(a, state.occupancy()).has("3,1")).toBe(false);
    wear(a, "redHare");
    const reach = state.map.reachable(a, state.occupancy());
    expect(reach.has("3,1")).toBe(true);
    expect(reach.has("2,1")).toBe(false);
  });
  it("맞히면 반드시 상태이상(여포궁 부동 · 이광궁 봉인 · 유성추 혼란 · 금화관포 독)", () => {
    for (const [id, cls, kind] of [["lubuBow", "archer", "immobile"], ["hornBowSmall", "archer", "seal"], ["meteorHammer", "monk", "confusion"], ["goldFireCannon", "catapult", "bleed"]] as const) {
      const { state, battle } = field([{ id: "a", side: "player", cls, x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 3, y: 1 }]);
      const a = state.get("a"); a.traits.push("alwaysHit"); a.range = [1, 2]; wear(a, id);
      state.get("d").stats.maxHp = state.get("d").hp = 999;
      expect(battle.execute({ kind: "attack", unit: "a", target: "d" }).ok, id).toBe(true);
      expect(state.hasStatus(state.get("d"), kind), id).toBe(true);
    }
  });
  it("책략: 백은갑옷 반감 · 백우선 MP 절반 · 둔갑천서 모방", () => {
    const fire: StrategyDef = { id: "fire", name: "화계", element: "fire", shape: "single", range: 4, radius: 0, mpCost: 13, power: 100, targetSides: ["enemy"], sureHit: true };
    const strategies = new Map([["fire", fire]]);
    const dmg = (armored: boolean) => {
      const { state, battle } = field([{ id: "a", side: "player", cls: "strategist", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 3, y: 1 }], 3, strategies);
      state.get("a").strategies = ["fire"]; state.get("d").stats.maxHp = state.get("d").hp = 999; if (armored) wear(state.get("d"), "silverarmor");
      battle.execute({ kind: "strategy", unit: "a", strategy: "fire", at: { x: 3, y: 1 } });
      return 999 - state.get("d").hp;
    };
    expect(dmg(true)).toBeLessThan(dmg(false) * 0.6);
    const { state } = field([{ id: "a", side: "player", cls: "strategist", x: 1, y: 1 }, { id: "f", side: "player", cls: "strategist", x: 1, y: 2 }], 3, strategies);
    const a = state.get("a"); a.strategies = []; state.get("f").strategies = ["fire"];
    wear(a, "fan");
    expect(state.strategyFor(a, "fire")!.mpCost).toBe(6);
    expect(state.usableStrategies(a)).toEqual([]);
    wear(a, "dunjia");
    expect(state.usableStrategies(a)).toEqual(["fire"]);
  });
  it("콩주머니: 피해를 받으면 보관함의 콩을 저절로 쓴다", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "d", side: "enemy", cls: "infantry", x: 2, y: 1 }]);
    state.inventory.bean = 1; wear(state.get("a"), "beanBag");
    state.get("a").stats.maxHp = state.get("a").hp = 500;
    state.get("d").traits.push("alwaysHit");
    battle.execute({ kind: "attack", unit: "a", target: "d" });
    expect(state.inventory.bean).toBe(0);
    expect(state.log.some((e) => e.t === "item" && e.auto)).toBe(true);
  });
});

describe("사신 책략", () => {
  it("청룡: 범위 안의 적에게 낙뢰가 다섯 번 무작위로 떨어진다", () => {
    const azure: StrategyDef = { id: "jewelAzure", name: "청룡", element: "thunder", shape: "spread", range: 4, radius: 2, mpCost: 50, power: 110, strikes: 5, inflicts: ["shock"], targetSides: ["enemy"] };
    const { state, battle } = field([{ id: "a", side: "player", cls: "mountedStrategist", x: 1, y: 1 }, { id: "e1", side: "enemy", cls: "infantry", x: 4, y: 1 }, { id: "e2", side: "enemy", cls: "infantry", x: 4, y: 2 }], 5, new Map([["jewelAzure", azure]]));
    const a = state.get("a"); a.strategies = ["jewelAzure"]; a.stats.maxMp = a.mp = 99;
    for (const id of ["e1", "e2"]) state.get(id).stats.maxHp = state.get(id).hp = 999;
    expect(battle.execute({ kind: "strategy", unit: "a", strategy: "jewelAzure", at: { x: 4, y: 1 } }).ok).toBe(true);
    const e = state.log.find((x) => x.t === "strategy");
    expect(e && e.t === "strategy" && e.targets.length).toBe(5);
    expect(a.mp).toBe(49);
  });
  it("현무: 맵 위 모든 부대의 능력이 무작위로 바뀐다", () => {
    const tortoise: StrategyDef = { id: "jewelTortoise", name: "현무", element: "earth", shape: "global", range: 99, radius: 0, mpCost: 50, power: 0, mutate: true, targetSides: ["enemy", "player", "ally", "allyAi"] };
    const { state, battle } = field([{ id: "a", side: "player", cls: "taoist", x: 1, y: 1 }, { id: "b", side: "player", cls: "infantry", x: 1, y: 2 }, { id: "e", side: "enemy", cls: "infantry", x: 7, y: 7 }], 5, new Map([["jewelTortoise", tortoise]]));
    const a = state.get("a"); a.strategies = ["jewelTortoise"]; a.stats.maxMp = a.mp = 99;
    expect(battle.execute({ kind: "strategy", unit: "a", strategy: "jewelTortoise", at: a.pos }).ok).toBe(true);
    for (const id of ["a", "b", "e"]) expect(state.get(id).statuses.length, id).toBeGreaterThan(0);
  });
});

describe("소모품(도구)", () => {
  it("열한 가지 소모품: 복숭아·술은 팔지 않는다", () => {
    expect(CONSUMABLES.map((c) => c.name)).toEqual(["회복의 콩", "회복의 쌀", "회복의 복숭아", "신비로운 물", "신비로운 술", "해독약", "각성약", "도포약", "양치약", "만능약", "인수"]);
    expect(consumable("peach")!.price).toBe(0);
    expect(consumable("wine")!.price).toBe(0);
  });
  it("자신 또는 붙은 아군에게 쓰고, 행동을 하나 쓴다", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "b", side: "player", cls: "infantry", x: 2, y: 1 }, { id: "far", side: "player", cls: "infantry", x: 5, y: 5 }, { id: "e", side: "enemy", cls: "infantry", x: 8, y: 8 }]);
    state.inventory = { bean: 2, awaken: 1, rice: 1 };
    const a = state.get("a"), b = state.get("b");
    a.hp = 10; b.hp = 10;
    expect(battle.execute({ kind: "item", unit: "a", item: "bean", target: "far" }).ok).toBe(false);
    expect(battle.execute({ kind: "item", unit: "a", item: "bean" }).ok).toBe(true);
    expect(a.hp).toBe(50); expect(state.inventory.bean).toBe(1); expect(a.hasActed).toBe(true);
    // 각성약: 자신에게는 못 쓴다. 혼란에 빠진 곁의 아군에게.
    state.applyStatus(b, { kind: "confusion", turns: 2, magnitude: 1 });
    expect(battle.execute({ kind: "item", unit: "far", item: "awaken" }).ok).toBe(false);
    state.get("far").pos = { x: 3, y: 1 };
    expect(battle.execute({ kind: "item", unit: "far", item: "awaken", target: "b" }).ok).toBe(true);
    expect(state.hasStatus(b, "confusion")).toBe(false);
    expect(state.inventory.awaken).toBe(0);
  });
  it("인수: 병종 한 단계 승급과 체력·MP 회복", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "e", side: "enemy", cls: "infantry", x: 8, y: 8 }]);
    state.inventory = { promotion: 1 };
    const a = state.get("a"); a.hp = 5; a.gearBonus = { attack: 7 };
    expect(battle.execute({ kind: "item", unit: "a", item: "promotion" }).ok).toBe(true);
    expect(a.unitClass).toBe("shieldGuard");
    expect(a.hp).toBe(a.stats.maxHp);
    expect(state.inventory.promotion).toBe(0);
  });
  it("보관함에 없는 것은 쓸 수 없다", () => {
    const { state, battle } = field([{ id: "a", side: "player", cls: "infantry", x: 1, y: 1 }, { id: "e", side: "enemy", cls: "infantry", x: 8, y: 8 }]);
    state.get("a").hp = 3;
    expect(battle.execute({ kind: "item", unit: "a", item: "bean" }).ok).toBe(false);
  });
});
