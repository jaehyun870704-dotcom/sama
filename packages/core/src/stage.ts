/**
 * 스테이지 정의 — docs/data/stage-schema.json 과 1:1 대응하는 타입.
 *
 * 스테이지는 코드가 아니라 데이터다. 새 스테이지를 추가할 때
 * packages/core 안의 파일은 단 한 줄도 바뀌지 않아야 한다. (PRD R7)
 */
import type { Side, UnitClass, StatusKind, HazardKind, TerrainKind } from "./types.ts";

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
    | "escort_survive";
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
    | "hp_below";
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
  ratio?: number;
  side?: Side;
}

export interface Action {
  type:
    | "spawn_units"
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
    | "telegraph_aoe";
  units?: UnitSpawnSpec[];
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
}

export interface StageEvent {
  id?: string;
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
    }>;
  };
  victory: VictoryCondition[];
  defeat: VictoryCondition[];
  seals: SealDef[];
  difficulty: Record<Difficulty, DifficultyTier>;
  gimmicks?: string[];
  events?: StageEvent[];
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

  return errors;
}
