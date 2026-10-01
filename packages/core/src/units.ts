/**
 * 유닛 템플릿 및 생성.
 * 능력치는 레벨 곡선 × 병종 계수로 파생시킨다 — 32스테이지 × 2난이도의
 * 적 배치를 수작업 수치로 관리하면 밸런싱이 불가능하다. (PRD R6)
 */
import type { Unit, UnitClass, UnitStats, Side, AiBehavior, Coord } from "./types.ts";

interface ClassProfile {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  intellect: number;
  spirit: number;
  agility: number;
  movement: number;
  range: readonly [number, number];
  canUseStrategy: boolean;
}

const PROFILES: Record<UnitClass, ClassProfile> = {
  infantry:   { hp: 1.10, mp: 0.4, attack: 1.00, defense: 1.10, intellect: 0.6, spirit: 0.9, agility: 0.9, movement: 5, range: [1, 1], canUseStrategy: false },
  spearman:   { hp: 1.05, mp: 0.4, attack: 1.05, defense: 1.05, intellect: 0.6, spirit: 0.9, agility: 0.9, movement: 5, range: [1, 1], canUseStrategy: false },
  cavalry:    { hp: 1.00, mp: 0.4, attack: 1.15, defense: 0.90, intellect: 0.6, spirit: 0.8, agility: 1.2, movement: 7, range: [1, 1], canUseStrategy: false },
  heavyCav:   { hp: 1.25, mp: 0.4, attack: 1.20, defense: 1.15, intellect: 0.6, spirit: 0.8, agility: 0.9, movement: 6, range: [1, 1], canUseStrategy: false },
  archer:     { hp: 0.85, mp: 0.5, attack: 0.95, defense: 0.80, intellect: 0.8, spirit: 0.9, agility: 1.1, movement: 5, range: [2, 2], canUseStrategy: false },
  crossbow:   { hp: 0.90, mp: 0.5, attack: 1.05, defense: 0.85, intellect: 0.8, spirit: 0.9, agility: 0.9, movement: 4, range: [2, 3], canUseStrategy: false },
  strategist: { hp: 0.75, mp: 1.3, attack: 0.60, defense: 0.70, intellect: 1.3, spirit: 1.2, agility: 1.0, movement: 5, range: [1, 1], canUseStrategy: true },
  fengshui:   { hp: 0.80, mp: 1.4, attack: 0.60, defense: 0.75, intellect: 1.2, spirit: 1.3, agility: 1.0, movement: 5, range: [1, 1], canUseStrategy: true },
  ram: { hp:1.5, mp:0.2, attack:.85, defense:1.4, intellect:.4, spirit:.8, agility:.5, movement:3, range:[1,1], canUseStrategy:false },
  catapult:   { hp: 0.95, mp: 0.3, attack: 1.10, defense: 0.75, intellect: 0.6, spirit: 0.8, agility: 0.6, movement: 3, range: [2, 4], canUseStrategy: false },
  engineer:   { hp: 0.80, mp: 0.3, attack: 0.50, defense: 0.80, intellect: 0.7, spirit: 0.9, agility: 0.8, movement: 5, range: [1, 1], canUseStrategy: false },
  navy:       { hp: 1.00, mp: 0.5, attack: 1.00, defense: 0.95, intellect: 0.8, spirit: 0.9, agility: 1.0, movement: 6, range: [1, 2], canUseStrategy: false },
  civilian:   { hp: 0.40, mp: 0.2, attack: 0.20, defense: 0.40, intellect: 0.4, spirit: 0.5, agility: 0.7, movement: 4, range: [1, 1], canUseStrategy: false },
};

/**
 * 레벨 곡선. 1레벨 기준값에서 99레벨까지 완만하게 상승.
 * base(L) = floor(A + B*L + C*L^1.15)
 */
function curve(level: number, a: number, b: number, c: number): number {
  return Math.floor(a + b * level + c * Math.pow(level, 1.15));
}

export function statsFor(unitClass: UnitClass, level: number): UnitStats {
  const p = PROFILES[unitClass];
  return {
    maxHp: Math.round(curve(level, 60, 4.2, 1.6) * p.hp),
    maxMp: Math.round(curve(level, 20, 0.9, 0.3) * p.mp),
    attack: Math.round(curve(level, 18, 1.5, 0.55) * p.attack),
    defense: Math.round(curve(level, 14, 1.2, 0.45) * p.defense),
    intellect: Math.round(curve(level, 16, 1.4, 0.5) * p.intellect),
    spirit: Math.round(curve(level, 15, 1.2, 0.45) * p.spirit),
    agility: Math.round(curve(level, 20, 1.0, 0.35) * p.agility),
    movement: p.movement,
    morale: 50,
  };
}

export interface MakeUnitOptions {
  id: string;
  name?: string;
  side: Side;
  unitClass: UnitClass;
  level: number;
  pos: { x: number; y: number };
  traits?: string[];
  traitParams?: Record<string, number>;
  strategies?: string[];
  behavior?: AiBehavior;
  /** 편입 아군은 도구를 쓸 수 없다. PRD §3.3 */
  canUseItems?: boolean;
  statOverrides?: Partial<UnitStats>;
  /** race/flee/escortee의 목표 영역 */
  goalRegion?: string;
  /** 순찰 경로 (M-02) */
  patrolRoute?: Coord[];
  /** 시야 범위 (M-02) */
  visionRange?: number;
}

export function makeUnit(o: MakeUnitOptions): Unit {
  const p = PROFILES[o.unitClass];
  const stats = { ...statsFor(o.unitClass, o.level), ...o.statOverrides };
  const unit: Unit = {
    id: o.id,
    name: o.name ?? o.id,
    side: o.side,
    unitClass: o.unitClass,
    level: o.level,
    pos: { ...o.pos },
    hp: stats.maxHp,
    mp: stats.maxMp,
    stats,
    traits: [...(o.traits ?? [])],
    traitParams: { ...(o.traitParams ?? {}) },
    statuses: [],
    strategies: [...(o.strategies ?? [])],
    range: p.range,
    hasMoved: false,
    hasActed: false,
    alive: true,
    canUseItems: o.canUseItems ?? o.side === "player",
  };
  if (o.behavior !== undefined) unit.behavior = o.behavior;
  if (o.goalRegion !== undefined) unit.goalRegion = o.goalRegion;
  if (o.visionRange !== undefined) unit.visionRange = o.visionRange;
  if (o.patrolRoute !== undefined) {
    unit.patrolRoute = o.patrolRoute.map((c) => ({ ...c }));
    unit.patrolIndex = 0;
  }
  return unit;
}

export function classCanUseStrategy(unitClass: UnitClass): boolean {
  return PROFILES[unitClass].canUseStrategy;
}
