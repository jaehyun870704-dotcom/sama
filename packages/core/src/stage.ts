/**
 * 스테이지 정의 — docs/data/stage-schema.json 과 1:1 대응하는 타입.
 *
 * 스테이지는 코드가 아니라 데이터다. 새 스테이지를 추가할 때
 * packages/core 안의 파일은 단 한 줄도 바뀌지 않아야 한다. (PRD R7)
 */
import type { Side, UnitClass, StatusKind, HazardKind, TerrainKind, Coord, Weather, WeatherGate } from "./types.ts";
import { WEATHERS } from "./types.ts";
import type { DialogueNode } from "./dialogue.ts";

export type Arc = "upper" | "middle" | "lower";
export type Difficulty = "normal" | "extreme";
export type PerfTier = "A" | "B" | "C";

export const PERF_BUDGET: Record<PerfTier, { maxUnits: number; targetFps: number }> = {
  A: { maxUnits: 20, targetFps: 60 },
  B: { maxUnits: 40, targetFps: 60 },
  C: { maxUnits: 80, targetFps: 30 },
};

export interface VictoryCondition {
  type:
    | "annihilate"
    | "reach"
    | "capture"
    | "retreat"
    | "survive_turns"
    | "enemy_retreat_count"
    | "ally_loss_limit"
    | "dialogue_complete"
    | "turn_limit"
    | "escort_survive"
    /** 지금 날씨가 target인가(예: 인장 "weather:rain"). */
    | "weather";
  unit?: string;
  target?: string;
  by?: Side;
  n?: number;
  /** 순차 조건일 때의 단계. 같은 order끼리는 OR, 다른 order는 AND(순차). */
  order?: number;
  side?: Side;
}

export interface Trigger {
  type:
    | "battle_start"
    | "turn_start"
    | "turn_end"
    | "unit_reaches"
    | "unit_retreats"
    | "enemy_count_below"
    | "region_captured"
    | "dialogue_choice"
    | "units_adjacent"
    | "survive_turns"
    | "hp_below"
    | "unit_surrounded"
    | "region_held"
    | "unit_spotted"
    /** Never fires on its own: the host fires it by id (fireScripted) when its own rule is met. */
    | "scripted";
  turn?: number;
  every?: number;
  unit?: string;
  unitA?: string;
  unitB?: string;
  region?: string;
  n?: number;
  by?: Side;
  nodeId?: string;
  optionId?: string;
  /** dialogue_choice: n회 이상 선택했을 때 발동 (기본 1) */
  ratio?: number;
  side?: Side;
  /** unit_spotted: 발각한 순찰 유닛 (생략 시 아무 순찰 유닛이나) */
  watcher?: string;
  /** turn_start/turn_end + every: (turn − offset)이 every의 배수일 때(기본 0). 날씨를 돌릴 때 쓴다. */
  offset?: number;
  /** 어떤 트리거든 이 날씨 조건일 때만 발동한다. */
  whenWeather?: WeatherGate;
}

export interface Action {
  type:
    | "spawn_units"
    | "set_phase"
    | "recover_units"
    | "dismiss_units"
    | "apply_effect"
    | "remove_effect"
    | "change_victory"
    | "change_defeat"
    | "move_unit"
    | "convert_unit"
    | "terrain_change"
    | "play_dialogue"
    | "start_duel"
    | "grant_control"
    | "revoke_control"
    | "telegraph_aoe"
    /** 날씨를 바꾼다(weather). 비가 오면 불길 칸이 꺼진다. */
    | "set_weather"
    /** 영역(region) 안의 부대(side로 거른다)에 최대 체력 ratio만큼 피해 · effect가 있으면 상태이상(duration). */
    | "damage_region"
    /** 영역의 칸을 연다/닫는다(닫힌 칸은 어느 병종도 지나지 못한다 · 성문). */
    | "open_gate"
    | "close_gate";
  units?: UnitSpawnSpec[];
  phase?: string;
  at?: Coord;
  side?: Side;
  targets?: string[];
  effect?: StatusKind;
  magnitude?: number;
  duration?: number;
  region?: string;
  terrain?: TerrainKind;
  hazard?: HazardKind;
  conditions?: VictoryCondition[];
  dialogueId?: string;
  toClass?: UnitClass;
  /** apply_effect에서 최대 HP 비율만큼 즉시 피해를 준다 (M-03 오답 페널티) */
  hpRatioDamage?: number;
  /** telegraph_aoe: shown name of the coming blow (e.g. "낙뢰"). */
  label?: string;
  /** telegraph_aoe: cells in this region are sheltered and never marked (M-18 cover). */
  exceptRegion?: string;
  /** set_weather: 바꿀 날씨. */
  weather?: Weather;
  /** damage_region: 최대 체력 대비 피해 비율(0~1). */
  ratio?: number;
  /** damage_region: 체력 1을 남기고 퇴각시키지 않는다. */
  nonLethal?: boolean;
  /** terrain_change: 놓은 hazard가 이 날씨 조건일 때만 해를 끼친다. */
  whenWeather?: WeatherGate;
}

export interface UnitSpawnSpec {
  id?: string;
  name?: string;
  template: string;
  level?: number;
  at?: { x: number; y: number };
  region?: string;
  count?: number;
  traits?: string[];
  traitParams?: Record<string, number>;
  behavior?: string;
  goalRegion?: string;
  patrolRoute?: Coord[];
  visionRange?: number;
  /** behavior "follow"의 대상 유닛 id. */
  followUnit?: string;
}

export interface StageEvent {
  id?: string;
  /** Only active in this scenario segment; independent from side turns. */
  phase?: string;
  trigger: Trigger;
  actions: Action[];
  once?: boolean;
}

export interface SealDef {
  slot: 1 | 2 | 3;
  normal: string;
  extreme: string;
  note?: string;
}

export interface DifficultyTier {
  minEnemyLevel: number;
  recommendedLevel: number;
  enemyTraitSet?: string;
  targetClearRate?: number;
}

export interface StageDef {
  id: string;
  /** 아군 자동 전투가 승리 조건의 적장(퇴각 대상)을 먼저 노린다(원정·가상 전장처럼 적장을 물리치면 끝나는 싸움). */
  focusVictoryTargets?: boolean;
  initialPhase?: string;
  /** 전투가 시작할 때의 날씨(생략하면 맑음). 이벤트 set_weather가 바꾼다. */
  weather?: Weather;
  /** true: 이미 이룬 차례 목표(order · stickyGoals 규칙)로 AI가 되돌아가지 않는다(목표 기억). 생략하면 예전처럼. */
  goalMemory?: boolean;
  /** false: 성벽·성문이 있어도 공성대(충차)·성문 방벽·감시탑을 자동으로 붙이지 않는다(성문은 이벤트로 연다). */
  siege?: boolean;
  arc: Arc;
  order: number;
  title: string;
  subtitle?: string;
  synopsis?: string;
  mapId?: string;
  deployment: {
    forced: string[];
    selectable?: string[];
    slots: number;
    grantedUnits?: Array<{
      type: UnitClass;
      count: number;
      level?: number;
      traits?: string[];
      countsTowardAllyLoss?: boolean;
    }>;
    allyAi?: Array<{
      type: UnitClass;
      count: number;
      level?: number;
      traits?: string[];
      behavior?: string;
      goalRegion?: string;
    }>;
  };
  victory: VictoryCondition[];
  defeat: VictoryCondition[];
  seals: SealDef[];
  difficulty: Record<Difficulty, DifficultyTier>;
  gimmicks?: string[];
  events?: StageEvent[];
  dialogues?: DialogueNode[];
  perf: { maxSimultaneousUnits: number; tier: PerfTier };
}

/** 스키마 이후의 의미론적 검증. CI에서 전 스테이지에 대해 실행한다. */
export function validateStage(stage: StageDef): string[] {
  const errors: string[] = [];
  const budget = PERF_BUDGET[stage.perf.tier];

  if (stage.perf.maxSimultaneousUnits > budget.maxUnits) {
    errors.push(
      `[${stage.id}] 성능 예산 초과: Tier ${stage.perf.tier}의 상한은 ${budget.maxUnits}인데 ${stage.perf.maxSimultaneousUnits} 선언됨 (PRD §9.1)`,
    );
  }
  if (stage.seals.length !== 3) {
    errors.push(`[${stage.id}] 인장은 정확히 3개여야 함 (현재 ${stage.seals.length}) (PRD §5.2)`);
  }
  if (stage.seals[0] && stage.seals[0].normal !== "clear") {
    errors.push(`[${stage.id}] 인장 1번 슬롯은 항상 "clear" 여야 함 (PRD §5.2)`);
  }
  // R-5.5: 편입 아군이 있는데 아군 손실 인장에 note가 없으면 경고
  const hasGranted = (stage.deployment.grantedUnits?.length ?? 0) > 0;
  const lossSeal = stage.seals.find((s) => s.normal.startsWith("player_losses_lt"));
  if (hasGranted && lossSeal && !lossSeal.note) {
    errors.push(
      `[${stage.id}] 편입 아군이 존재하고 아군 손실 인장이 있으나 note 미기재 (PRD R-5.5)`,
    );
  }
  if (stage.difficulty.extreme.minEnemyLevel <= stage.difficulty.normal.minEnemyLevel) {
    errors.push(`[${stage.id}] 극한 난이도의 적 레벨이 일반 이하임`);
  }
  if (stage.victory.length === 0) errors.push(`[${stage.id}] 승리 조건 없음`);
  if (stage.defeat.length === 0) errors.push(`[${stage.id}] 패배 조건 없음`);

  // turn_limit은 "N턴 이내"라는 뜻이라 1턴차에 이미 참이다.
  // 승리/패배 조건에 쓰면 전투가 시작하자마자 끝난다 — 인장 전용 술어다.
  for (const [group, conds] of [["승리", stage.victory], ["패배", stage.defeat]] as const) {
    if (conds.some((c) => c.type === "turn_limit")) {
      errors.push(
        `[${stage.id}] ${group} 조건에 turn_limit 사용 — 1턴차에 즉시 충족되어 전투가 바로 끝납니다. 인장에만 사용하세요`,
      );
    }
  }

  errors.push(...validateEngineFields(stage));
  return errors;
}

/** 날씨·영역 피해·성문·따라가기 필드 검사(오타 난 날씨가 조용히 "맑음"으로 동작하지 않게). */
function validateEngineFields(stage: StageDef): string[] {
  const errors: string[] = [];
  const tag = `[${stage.id}]`;
  const known = (w: unknown) => typeof w === "string" && (WEATHERS as readonly string[]).includes(w);
  const gate = (where: string, g: WeatherGate | undefined) => {
    if (g === undefined) return;
    if (typeof g !== "object" || g === null) { errors.push(`${tag} ${where}: 날씨 조건은 {is?,not?} 객체여야 함`); return; }
    for (const w of [...(g.is ?? []), ...(g.not ?? [])]) if (!known(w)) errors.push(`${tag} ${where}: 알 수 없는 날씨 "${String(w)}"`);
    if (!g.is?.length && !g.not?.length) errors.push(`${tag} ${where}: 빈 날씨 조건`);
  };
  if (stage.weather !== undefined && !known(stage.weather)) errors.push(`${tag} 알 수 없는 시작 날씨 "${String(stage.weather)}"`);
  if (stage.siege !== undefined && typeof stage.siege !== "boolean") errors.push(`${tag} siege는 true/false여야 함`);
  if (stage.goalMemory !== undefined) {
    if (typeof stage.goalMemory !== "boolean") errors.push(`${tag} goalMemory는 true/false여야 함`);
    const goalSets = [stage.victory, ...(stage.events ?? []).flatMap((ev) => ev.actions.filter((a) => a.type === "change_victory").map((a) => a.conditions ?? []))];
    if (stage.goalMemory && !goalSets.some((cs) => cs.some((c) => c.order !== undefined))) errors.push(`${tag} goalMemory를 켰지만 차례 목표(order)가 없음`);
  }
  for (const c of [...stage.victory, ...stage.defeat]) if (c.type === "weather" && !known(c.target)) errors.push(`${tag} 날씨 조건의 target이 날씨가 아님: "${String(c.target)}"`);
  (stage.events ?? []).forEach((ev, i) => {
    const where = `이벤트 ${ev.id ?? i}`;
    gate(`${where} 트리거`, ev.trigger.whenWeather);
    if (ev.trigger.offset !== undefined && ev.trigger.every === undefined) errors.push(`${tag} ${where}: offset은 every와 함께 써야 함`);
    for (const a of ev.actions) {
      if (a.type === "set_weather" && !known(a.weather)) errors.push(`${tag} ${where}: set_weather의 날씨가 없거나 잘못됨 "${String(a.weather)}"`);
      if (a.type === "damage_region") {
        if (!a.region) errors.push(`${tag} ${where}: damage_region에 region이 없음`);
        if (a.ratio === undefined && !a.effect) errors.push(`${tag} ${where}: damage_region에 ratio도 effect도 없음`);
        if (a.ratio !== undefined && (!(a.ratio >= 0) || a.ratio > 1)) errors.push(`${tag} ${where}: damage_region의 ratio는 0~1 (현재 ${a.ratio})`);
      }
      if ((a.type === "open_gate" || a.type === "close_gate") && !a.region) errors.push(`${tag} ${where}: ${a.type}에 region이 없음`);
      if (a.whenWeather !== undefined) {
        if (a.type !== "terrain_change" || !a.hazard) errors.push(`${tag} ${where}: whenWeather는 hazard를 놓는 terrain_change에만 씀`);
        gate(`${where} ${a.type}`, a.whenWeather);
      }
      for (const u of a.units ?? []) {
        if (u.behavior === "follow" && !u.followUnit) errors.push(`${tag} ${where}: follow 부대 ${u.id ?? u.template}에 followUnit이 없음`);
        if (u.followUnit !== undefined && u.behavior !== "follow") errors.push(`${tag} ${where}: followUnit은 behavior "follow"와 함께 써야 함 (${u.id ?? u.template})`);
      }
    }
  });
  return errors;
}
