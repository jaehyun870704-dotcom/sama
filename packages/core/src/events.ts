/**
 * 이벤트 시스템 — 기믹 모듈(M-01~M-23)의 실행 엔진.
 *
 * 스테이지 JSON의 trigger/action 쌍을 해석한다.
 * 개별 스테이지를 위한 특수 코드는 이 파일에 들어오지 않는다.
 */
import type { BattleState } from "./state.ts";
import type { StageEvent, Trigger, Action } from "./stage.ts";
import { makeUnit } from "./units.ts";
import { adjacent, sameCoord, key } from "./grid.ts";
import type { Side, UnitClass } from "./types.ts";

export interface EventPhase {
  kind: "battle_start" | "turn_start" | "turn_end" | "after_action";
  side?: Side;
}

export function runEvents(state: BattleState, phase: EventPhase): void {
  const events = state.stage.events ?? [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]!;
    const id = ev.id ?? `${state.stage.id}#${i}`;
    const once = ev.once ?? true;
    if (once && state.firedEvents.has(id)) continue;
    if (!matches(state, ev.trigger, phase)) continue;

    state.firedEvents.add(id);
    state.push({ t: "event", id });
    for (const action of ev.actions) applyAction(state, action);
  }
}

function matches(state: BattleState, trig: Trigger, phase: EventPhase): boolean {
  switch (trig.type) {
    case "battle_start":
      return phase.kind === "battle_start";

    case "turn_start":
      if (phase.kind !== "turn_start") return false;
      if (trig.side && phase.side !== trig.side) return false;
      if (trig.turn !== undefined) return state.turn === trig.turn;
      if (trig.every !== undefined) return state.turn % trig.every === 0;
      return true;

    case "turn_end":
      if (phase.kind !== "turn_end") return false;
      if (trig.side && phase.side !== trig.side) return false;
      if (trig.turn !== undefined) return state.turn === trig.turn;
      if (trig.every !== undefined) return state.turn % trig.every === 0;
      return true;

    case "unit_reaches": {
      if (!trig.unit || !trig.region) return false;
      const u = state.find(trig.unit);
      if (!u || !u.alive) return false;
      return state.map.regionCoords(trig.region).some((c) => sameCoord(c, u.pos));
    }

    case "unit_retreats": {
      if (!trig.unit) return false;
      const u = state.find(trig.unit);
      return u !== undefined && !u.alive;
    }

    case "enemy_count_below":
      return state.living("enemy").length < (trig.n ?? 0);

    case "region_captured":
      return trig.region !== undefined && state.captured.get(trig.region) === (trig.by ?? "player");

    case "units_adjacent": {
      if (!trig.unitA || !trig.unitB) return false;
      const a = state.find(trig.unitA);
      const b = state.find(trig.unitB);
      if (!a?.alive || !b?.alive) return false;
      return adjacent(a.pos).some((c) => sameCoord(c, b.pos));
    }

    case "hp_below": {
      if (!trig.unit) return false;
      const u = state.find(trig.unit);
      if (!u?.alive) return false;
      return u.hp / u.stats.maxHp < (trig.ratio ?? 0);
    }

    case "survive_turns": {
      const start = state.survivalClocks.get(trig.region ?? "default");
      return start !== undefined && state.turn - start >= (trig.n ?? 0);
    }

    case "dialogue_choice":
      return state.choices.some(
        (c) => c.nodeId === trig.nodeId && (!trig.optionId || c.optionId === trig.optionId),
      );
  }
}

export function applyAction(state: BattleState, action: Action): void {
  switch (action.type) {
    case "spawn_units": {
      const spawned: string[] = [];
      for (const spec of action.units ?? []) {
        const count = spec.count ?? 1;
        const coords = spec.region
          ? state.map.regionCoords(spec.region)
          : spec.at
            ? [spec.at]
            : [];
        const occupied = state.occupancy();
        let placed = 0;
        for (const c of coords) {
          if (placed >= count) break;
          if (occupied.has(key(c))) continue;
          const id = spec.id ? (count > 1 ? `${spec.id}_${placed}` : spec.id) : `${spec.template}_${state.units.size}`;
          const side: Side = action.side ?? "enemy";
          const shift = side === "enemy" ? state.enemyLevelShift : 0;
          const u = makeUnit({
            id,
            name: spec.name ?? spec.template,
            side,
            unitClass: spec.template as UnitClass,
            level: (spec.level ?? 1) + shift,
            pos: c,
            traits: spec.traits ?? [],
            traitParams: spec.traitParams ?? {},
            behavior: (spec.behavior as never) ?? "advance",
          });
          state.add(u);
          occupied.set(key(c), u);
          spawned.push(u.id);
          placed++;
        }
      }
      if (spawned.length > 0) {
        state.push({ t: "spawn", units: spawned, side: action.side ?? "enemy" });
      }
      break;
    }

    case "apply_effect": {
      if (!action.effect) break;
      for (const u of resolveTargets(state, action)) {
        state.applyStatus(u, {
          kind: action.effect,
          turns: action.duration ?? 1,
          magnitude: action.magnitude ?? 1,
        });
      }
      break;
    }

    case "remove_effect": {
      for (const u of resolveTargets(state, action)) {
        u.statuses = u.statuses.filter((s) => s.kind !== action.effect);
      }
      break;
    }

    case "change_victory":
      state.victory = structuredClone(action.conditions ?? []);
      state.push({ t: "objectiveChanged", victory: state.victory });
      break;

    case "change_defeat":
      state.defeat = structuredClone(action.conditions ?? []);
      break;

    case "convert_unit": {
      // M-01 UNIT_CONVERT — 민중을 병사로 전환
      for (const u of resolveTargets(state, action)) {
        if (!action.toClass) continue;
        const previous = u.unitClass;
        u.unitClass = action.toClass;
        if (action.side) u.side = action.side;
        state.push({ t: "convert", unit: u.id, to: `${previous}→${action.toClass}` });
      }
      break;
    }

    case "grant_control": {
      // 우군 AI를 플레이어 조작 가능한 '편입 아군'으로 전환
      for (const u of resolveTargets(state, action)) {
        u.side = "ally";
        u.canUseItems = false;
        delete u.behavior;
      }
      break;
    }

    case "revoke_control": {
      for (const u of resolveTargets(state, action)) {
        u.side = "allyAi";
        u.behavior = "advance";
      }
      break;
    }

    case "terrain_change": {
      // M-19 HAZARD_FIELD / M-08 CONSTRUCT
      if (!action.region) break;
      for (const c of state.map.regionCoords(action.region)) {
        const tile = state.map.tileAt(c);
        if (action.hazard) {
          tile.hazard = action.hazard;
          tile.hazardTurns = action.duration ?? 3;
        }
      }
      break;
    }

    case "telegraph_aoe":
    case "play_dialogue":
    case "start_duel":
    case "move_unit":
      // 연출 계층에서 처리. 코어는 상태만 관리한다.
      break;
  }
}

function resolveTargets(state: BattleState, action: Action) {
  if (action.targets && action.targets.length > 0) {
    return action.targets.map((id) => state.find(id)).filter((u) => u?.alive === true) as NonNullable<
      ReturnType<BattleState["find"]>
    >[];
  }
  if (action.side) return state.living(action.side);
  return [];
}
