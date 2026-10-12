/**
 * 제갈량전이 쓰는 엔진 기능: 따라가기(follow) · 날씨 · 영역 피해 · 차례 목표 기억 · 닫힌 성문.
 * 모두 스테이지 데이터가 켜야 동작한다(기본값으로는 예전 전투가 그대로다).
 */
import { describe, it, expect } from "vitest";
import { Battle } from "../src/battle.ts";
import { BattleState } from "../src/state.ts";
import { makeUnit } from "../src/units.ts";
import { BattleMap } from "../src/grid.ts";
import { decide } from "../src/ai.ts";
import { applyAction, runEvents } from "../src/events.ts";
import { awardedSeals, evaluate, goalAchieved, rememberedGoal, parseSeal } from "../src/conditions.ts";
import { validateStage, type StageDef } from "../src/stage.ts";
import { minimalStage, flatMap } from "./fixtures.ts";
import type { Coord } from "../src/types.ts";

function withRegions(w: number, h: number, regions: Record<string, Coord[]>): BattleMap {
  const map = flatMap(w, h);
  for (const [k, v] of Object.entries(regions)) map.regions.set(k, v);
  return map;
}
const moveOf = (state: BattleState, id: string) => {
  const m = decide(state, state.get(id)).find((c) => c.kind === "move");
  return m?.kind === "move" ? m.to : state.get(id).pos;
};

describe("follow: 지정한 유닛을 따라간다", () => {
  it("대상 곁의 빈 칸으로 다가가고, 곁에 닿으면 멈춘다(공격하지 않는다)", () => {
    const state = new BattleState(minimalStage(), flatMap(16, 4), 1);
    state.add(makeUnit({ id: "guan", side: "player", unitClass: "infantry", level: 10, pos: { x: 12, y: 1 } }));
    state.add(makeUnit({ id: "cao", side: "enemy", unitClass: "cavalry", level: 10, pos: { x: 1, y: 1 }, behavior: "follow", followUnit: "guan" }));
    const first = moveOf(state, "cao");
    expect(first.x).toBeGreaterThan(1);
    // 바로 곁에 서면 기다린다.
    state.get("cao").pos = { x: 11, y: 1 };
    expect(decide(state, state.get("cao"))).toEqual([{ kind: "wait", unit: "cao" }]);
  });

  it("대상이 움직이면 그 새 자리를 쫓는다", () => {
    const state = new BattleState(minimalStage(), flatMap(20, 12), 1);
    state.add(makeUnit({ id: "lead", side: "allyAi", unitClass: "infantry", level: 10, pos: { x: 18, y: 1 } }));
    state.add(makeUnit({ id: "tail", side: "allyAi", unitClass: "infantry", level: 10, pos: { x: 10, y: 6 }, behavior: "follow", followUnit: "lead" }));
    expect(moveOf(state, "tail").y).toBeLessThan(6);
    state.get("lead").pos = { x: 10, y: 11 };
    expect(moveOf(state, "tail").y).toBeGreaterThan(6);
  });

  it("대상이 쓰러지면 보통 전진처럼 적에게 간다", () => {
    const state = new BattleState(minimalStage(), flatMap(16, 4), 1);
    state.add(makeUnit({ id: "guan", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 12, y: 1 } }));
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 10, pos: { x: 14, y: 1 } }));
    state.add(makeUnit({ id: "cao", side: "enemy", unitClass: "cavalry", level: 10, pos: { x: 1, y: 1 }, behavior: "follow", followUnit: "guan" }));
    state.retreat(state.get("guan"));
    expect(moveOf(state, "cao").x).toBeGreaterThan(1);
  });

  it("spawn_units가 followUnit을 넘긴다", () => {
    const state = new BattleState(minimalStage(), withRegions(8, 8, { gate: [{ x: 0, y: 0 }] }), 1);
    applyAction(state, { type: "spawn_units", side: "enemy", units: [{ id: "cao", template: "cavalry", region: "gate", behavior: "follow", followUnit: "guan" }] });
    expect(state.get("cao").behavior).toBe("follow");
    expect(state.get("cao").followUnit).toBe("guan");
  });
});

describe("날씨", () => {
  it("스테이지가 정한 날씨로 시작하고, 정하지 않으면 맑음", () => {
    expect(new BattleState(minimalStage(), flatMap(4, 4), 1).weather).toBe("clear");
    expect(new BattleState(minimalStage({ weather: "fog" }), flatMap(4, 4), 1).weather).toBe("fog");
  });

  it("set_weather가 날씨를 바꾸고 기록을 남긴다 · 조건 weather와 인장 weather:rain이 읽는다", () => {
    const state = new BattleState(minimalStage(), flatMap(4, 4), 1);
    applyAction(state, { type: "set_weather", weather: "rain" });
    expect(state.weather).toBe("rain");
    expect(state.log.at(-1)).toEqual({ t: "weather", weather: "rain" });
    expect(evaluate(state, { type: "weather", target: "rain" })).toBe(true);
    expect(parseSeal("weather:rain")).toEqual({ type: "weather", target: "rain" });
    expect(() => parseSeal("weather:sunny")).toThrow();
  });

  it("비가 오면 불길 칸이 꺼지고, 비 오는 동안 불이 붙지 않는다", () => {
    const state = new BattleState(minimalStage(), withRegions(4, 4, { valley: [{ x: 1, y: 1 }, { x: 2, y: 1 }] }), 1);
    applyAction(state, { type: "terrain_change", region: "valley", hazard: "fire", duration: 3 });
    expect(state.map.tileAt({ x: 1, y: 1 }).hazard).toBe("fire");
    applyAction(state, { type: "set_weather", weather: "rain" });
    expect(state.map.tileAt({ x: 1, y: 1 }).hazard).toBe("none");
    applyAction(state, { type: "terrain_change", region: "valley", hazard: "fire", duration: 3 });
    expect(state.map.tileAt({ x: 2, y: 1 }).hazard).toBe("none");
  });

  it("날씨 조건이 붙은 위험 지대는 그 날씨일 때만 해를 끼친다(독 샘: 맑은 날이 아니면)", () => {
    const stage = minimalStage({ weather: "fog" });
    const state = new BattleState(stage, withRegions(6, 3, { springs: [{ x: 2, y: 1 }, { x: 4, y: 1 }] }), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 10, pos: { x: 1, y: 1 } }));
    state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 5, y: 2 }, behavior: "hold" }));
    applyAction(state, { type: "terrain_change", region: "springs", hazard: "trap", duration: 99, whenWeather: { not: ["clear"] } });
    expect(state.activeHazard({ x: 2, y: 1 })).toBe("trap");
    const battle = new Battle(state, { seed: 1 });
    battle.start();
    const hero = state.get("hero");
    const full = hero.hp;
    expect(battle.execute({ kind: "move", unit: "hero", to: { x: 2, y: 1 } }).ok).toBe(true);
    expect(hero.hp).toBeLessThan(full);
    // 맑은 날에는 잠잠하다.
    battle.execute({ kind: "wait", unit: "hero" });
    applyAction(state, { type: "set_weather", weather: "clear" });
    expect(state.activeHazard({ x: 4, y: 1 })).toBe("none");
    const before = hero.hp;
    hero.hasMoved = false; hero.hasActed = false;
    expect(battle.execute({ kind: "move", unit: "hero", to: { x: 4, y: 1 } }).ok).toBe(true);
    expect(hero.hp).toBe(before);
  });

  it("트리거의 whenWeather·offset: 날씨가 맞을 때만, (턴−offset)이 every의 배수일 때 발동", () => {
    const stage = minimalStage({
      weather: "fog",
      events: [
        { id: "clear", once: false, trigger: { type: "turn_start", side: "player", every: 3 }, actions: [{ type: "set_weather", weather: "clear" }] },
        { id: "fog", once: false, trigger: { type: "turn_start", side: "player", every: 3, offset: 1 }, actions: [{ type: "set_weather", weather: "fog" }] },
        { id: "miasma", once: false, trigger: { type: "turn_start", side: "player", whenWeather: { not: ["clear"] } }, actions: [{ type: "apply_effect", side: "player", effect: "weaken", duration: 1 }] },
      ],
    });
    const state = new BattleState(stage, flatMap(4, 4), 1);
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 10, pos: { x: 0, y: 0 } }));
    state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 3, y: 3 }, behavior: "hold" }));
    const seen: Array<[number, string, boolean]> = [];
    for (let turn = 1; turn <= 7; turn++) {
      state.turn = turn;
      state.get("hero").statuses = [];
      runEvents(state, { kind: "turn_start", side: "player" });
      seen.push([turn, state.weather, state.hasStatus(state.get("hero"), "weaken")]);
    }
    expect(seen).toEqual([[1, "fog", true], [2, "fog", true], [3, "clear", false], [4, "fog", true], [5, "fog", true], [6, "clear", false], [7, "fog", true]]);
  });

  it("무르기 스냅샷이 날씨를 되돌린다", () => {
    const state = new BattleState(minimalStage(), flatMap(4, 4), 1);
    const snap = state.snapshot();
    applyAction(state, { type: "set_weather", weather: "snow" });
    state.restore(snap);
    expect(state.weather).toBe("clear");
  });
});

describe("damage_region: 영역 안의 부대만 피해", () => {
  function setup() {
    const state = new BattleState(minimalStage(), withRegions(8, 4, { valley: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }] }), 1);
    state.add(makeUnit({ id: "in_a", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 1, y: 1 } }));
    state.add(makeUnit({ id: "in_b", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 3, y: 1 } }));
    state.add(makeUnit({ id: "out", side: "enemy", unitClass: "infantry", level: 10, pos: { x: 6, y: 1 } }));
    state.add(makeUnit({ id: "mine", side: "player", unitClass: "infantry", level: 10, pos: { x: 2, y: 1 } }));
    return state;
  }

  it("진영으로 거르고, 비율 피해와 상태이상을 준다", () => {
    const state = setup();
    applyAction(state, { type: "damage_region", region: "valley", side: "enemy", ratio: 0.4, effect: "burn", duration: 2, label: "골짜기의 불" });
    const a = state.get("in_a");
    expect(a.hp).toBe(a.stats.maxHp - Math.round(a.stats.maxHp * 0.4));
    expect(state.hasStatus(a, "burn")).toBe(true);
    expect(state.get("out").hp).toBe(state.get("out").stats.maxHp);
    expect(state.get("mine").hp).toBe(state.get("mine").stats.maxHp);
    const strike = state.log.find((e) => e.t === "strike");
    expect(strike?.t === "strike" && strike.hits.map((h) => h.unit)).toEqual(["in_a", "in_b"]);
    expect(strike?.t === "strike" && strike.label).toBe("골짜기의 불");
  });

  it("치명 피해는 퇴각시키고, nonLethal이면 체력 1을 남긴다", () => {
    const state = setup();
    applyAction(state, { type: "damage_region", region: "valley", side: "enemy", ratio: 1 });
    expect(state.get("in_a").alive).toBe(false);
    expect(state.losses.enemy).toBe(2);
    const again = setup();
    applyAction(again, { type: "damage_region", region: "valley", ratio: 1, nonLethal: true });
    expect(again.get("in_a").hp).toBe(1);
    expect(again.get("mine").hp).toBe(1);
  });
});

describe("차례 목표 기억: 이룬 단계로 되돌아가지 않는다", () => {
  function setup(sticky: boolean, goalMemory = true) {
    const stage = minimalStage({
      goalMemory,
      victory: [
        { type: "reach", unit: "hero", target: "keep", order: 1 },
        { type: "reach", unit: "hero", target: "west_exit", order: 2 },
      ],
    });
    const state = new BattleState(stage, withRegions(20, 3, { keep: [{ x: 10, y: 1 }], west_exit: [{ x: 0, y: 1 }] }), 1);
    state.stickyGoals = sticky;
    state.add(makeUnit({ id: "hero", side: "player", unitClass: "infantry", level: 10, pos: { x: 10, y: 1 } }));
    state.add(makeUnit({ id: "foe", side: "enemy", unitClass: "infantry", level: 1, pos: { x: 19, y: 0 }, behavior: "hold" }));
    return state;
  }

  it("A에 닿은 뒤 A를 떠나도 B로 간다", () => {
    const state = setup(true);
    const battle = new Battle(state, { seed: 1 });
    battle.start();
    battle.execute({ kind: "wait", unit: "hero" });
    expect(state.goalProgress).toBe(1);
    expect(goalAchieved(state, state.victory[0]!)).toBe(true);
    // 한 걸음 서쪽으로 떠난 뒤에도 서쪽(B)으로 간다 — 예전에는 A로 되돌아갔다.
    state.get("hero").pos = { x: 8, y: 1 };
    expect(moveOf(state, "hero").x).toBeLessThan(8);
  });

  it("goalMemory를 켜지 않은 장은 예전처럼 앞 단계 지점으로 되돌아간다(opt-in)", () => {
    const state = setup(true, false);
    const battle = new Battle(state, { seed: 1 });
    battle.start();
    battle.execute({ kind: "wait", unit: "hero" });
    expect(state.goalProgress).toBe(1);
    expect(rememberedGoal(state, state.victory[0]!)).toBe(false);
    state.get("hero").pos = { x: 8, y: 1 };
    expect(moveOf(state, "hero").x).toBeGreaterThan(8);
  });

  it("붙잡아 두지 않는 규칙에서는 예전처럼 판단한다", () => {
    const state = setup(false);
    state.get("hero").pos = { x: 8, y: 1 };
    expect(goalAchieved(state, state.victory[0]!)).toBe(false);
    expect(moveOf(state, "hero").x).toBeGreaterThan(8);
  });
});

describe("닫힌 성문(close_gate · open_gate)", () => {
  it("닫힌 칸은 어느 병종도 지나지 못하고, 열면 지난다", () => {
    const map = withRegions(5, 1, { door: [{ x: 2, y: 0 }] });
    map.tileAt({ x: 2, y: 0 }).terrain = "gate";
    const state = new BattleState(minimalStage(), map, 1);
    const hero = makeUnit({ id: "hero", side: "player", unitClass: "cavalry", level: 10, pos: { x: 0, y: 0 } });
    state.add(hero);
    applyAction(state, { type: "close_gate", region: "door" });
    expect(state.map.moveCost("infantry", { x: 2, y: 0 })).toBe(Infinity);
    expect(state.map.reachable(hero, state.occupancy()).has("3,0")).toBe(false);
    applyAction(state, { type: "open_gate", region: "door" });
    expect(state.map.moveCost("infantry", { x: 2, y: 0 })).toBe(1);
    expect(state.map.reachable(hero, state.occupancy()).has("3,0")).toBe(true);
    expect(state.log.filter((e) => e.t === "gate").map((e) => e.t === "gate" && e.open)).toEqual([false, true]);
  });
});

describe("스키마 검사", () => {
  const bad = (over: Partial<StageDef>) => validateStage(minimalStage(over));
  it("새 필드의 오타를 잡는다", () => {
    expect(bad({ weather: "sunny" as never }).join()).toMatch(/시작 날씨/);
    expect(bad({ events: [{ trigger: { type: "battle_start" }, actions: [{ type: "set_weather" }] }] }).join()).toMatch(/set_weather/);
    expect(bad({ events: [{ trigger: { type: "battle_start" }, actions: [{ type: "damage_region", ratio: 2 }] }] }).join()).toMatch(/region이 없음.*ratio는 0~1|ratio는 0~1/);
    expect(bad({ events: [{ trigger: { type: "battle_start" }, actions: [{ type: "spawn_units", units: [{ template: "cavalry", behavior: "follow" }] }] }] }).join()).toMatch(/followUnit/);
    expect(bad({ events: [{ trigger: { type: "turn_start", offset: 1 }, actions: [] }] }).join()).toMatch(/offset/);
    expect(bad({ events: [{ trigger: { type: "battle_start", whenWeather: { not: ["sun" as never] } }, actions: [] }] }).join()).toMatch(/알 수 없는 날씨/);
    expect(bad({ goalMemory: true }).join()).toMatch(/goalMemory/);
    expect(bad({ weather: "rain", siege: false })).toEqual([]);
  });

  it("인장 weather는 승리했을 때 지금 날씨로 판정한다", () => {
    const stage = minimalStage({ seals: [{ slot: 1, normal: "clear", extreme: "clear" }, { slot: 2, normal: "weather:rain", extreme: "weather:rain" }, { slot: 3, normal: "turn_limit:10", extreme: "turn_limit:10" }] });
    const state = new BattleState(stage, flatMap(4, 4), 1);
    state.outcome = "victory";
    expect(awardedSeals(state, "normal")).toEqual([1, 3]);
    state.weather = "rain";
    expect(awardedSeals(state, "normal")).toEqual([1, 2, 3]);
  });
});
