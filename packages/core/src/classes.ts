/**
 * 병종 계통 — 확장 병종과 진화.
 *
 * 새 병종은 기존 병종 하나를 '계열(family)'로 물려받는다. 이동 비용·지형 상성·
 * 병종 상성·그림은 계열의 것을 쓰고, 능력치 계수·사거리·고유 특성만 따로 둔다.
 * 그래서 병종을 늘려도 지형표와 상성표를 병종 수만큼 다시 쓰지 않는다.
 *
 * 진화: 레벨이 기준에 닿으면 같은 계통의 다음 단계 병종으로 바뀐다(2단계 → 3단계).
 */
import type { UnitClass } from "./types.ts";

export interface ClassProfile {
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

export interface ClassVariant {
  /** 이동·상성·그림을 물려받는 기존 병종 */
  family: UnitClass;
  /** 1 = 기본, 2 = 정예, 3 = 최정예 */
  tier: 1 | 2 | 3;
  profile: ClassProfile;
  /** 이 병종이 되면 붙는 고유 특성 (id → 매개변수) */
  traits?: Record<string, number>;
}

const p = (
  hp: number, mp: number, attack: number, defense: number, intellect: number, spirit: number,
  agility: number, movement: number, range: readonly [number, number], canUseStrategy = false,
): ClassProfile => ({ hp, mp, attack, defense, intellect, spirit, agility, movement, range, canUseStrategy });

/** 확장 병종. 기존 20병종은 여기에 없다(자기 자신이 계열). */
export const VARIANTS: Partial<Record<UnitClass, ClassVariant>> = {
  // 보병 계통 — 버티는 전열
  shieldGuard: { family: "infantry", tier: 2, profile: p(1.25, 0.4, 1.0, 1.35, 0.6, 1.0, 0.85, 5, [1, 1]), traits: { guardian: 0 } },
  royalGuard: { family: "infantry", tier: 3, profile: p(1.4, 0.4, 1.15, 1.5, 0.6, 1.1, 0.9, 5, [1, 1]), traits: { guardian: 0, lastStand: 0 } },
  // 창병 계통 — 기병 사냥
  pikeman: { family: "spearman", tier: 2, profile: p(1.15, 0.4, 1.2, 1.12, 0.6, 0.95, 0.92, 5, [1, 1]) },
  halberdier: { family: "spearman", tier: 3, profile: p(1.25, 0.4, 1.35, 1.2, 0.6, 1.0, 0.95, 5, [1, 1]), traits: { unlimitedCounter: 0 } },
  // 경기병 계통 — 돌파
  lancer: { family: "cavalry", tier: 2, profile: p(1.1, 0.4, 1.3, 0.95, 0.6, 0.85, 1.25, 7, [1, 1]) },
  tigerRider: { family: "cavalry", tier: 3, profile: p(1.25, 0.4, 1.45, 1.1, 0.6, 0.9, 1.3, 7, [1, 1]), traits: { critical: 15 } },
  // 중기병 계통
  ironCav: { family: "heavyCav", tier: 2, profile: p(1.45, 0.4, 1.35, 1.35, 0.6, 0.85, 0.9, 6, [1, 1]), traits: { physicalDamageReduction: 10 } },
  // 궁병 계통 — 사거리
  longbow: { family: "archer", tier: 2, profile: p(0.9, 0.5, 1.08, 0.85, 0.8, 0.95, 1.15, 5, [2, 3]) },
  sharpshooter: { family: "archer", tier: 3, profile: p(0.95, 0.5, 1.22, 0.9, 0.8, 1.0, 1.25, 5, [2, 4]), traits: { penetrate: 20 } },
  // 노병 계통 — 관통
  repeater: { family: "crossbow", tier: 2, profile: p(0.95, 0.5, 1.18, 0.9, 0.8, 0.95, 0.95, 4, [2, 3]) },
  greatBow: { family: "crossbow", tier: 3, profile: p(1.0, 0.5, 1.32, 0.95, 0.8, 1.0, 1.0, 4, [2, 4]), traits: { penetrate: 30 } },
  // 책사 계통 — 지력
  tactician: { family: "strategist", tier: 2, profile: p(0.8, 1.45, 0.65, 0.75, 1.38, 1.3, 1.05, 5, [1, 1], true) },
  mastermind: { family: "strategist", tier: 3, profile: p(0.85, 1.6, 0.7, 0.8, 1.48, 1.4, 1.1, 5, [1, 1], true), traits: { strategyEvasion: 15 } },
  // 풍수사 계통 — 정신
  sage: { family: "fengshui", tier: 2, profile: p(0.9, 1.6, 0.6, 0.8, 1.3, 1.45, 1.0, 5, [1, 1], true) },
  immortal: { family: "fengshui", tier: 3, profile: p(1.0, 1.85, 0.65, 0.85, 1.4, 1.6, 1.05, 5, [1, 1], true), traits: { strategyDamageReduction: 20 } },
  // 궁기병 계통 — 기동 사격
  nomad: { family: "horseArcher", tier: 2, profile: p(1.08, 0.4, 1.02, 0.95, 0.6, 0.85, 1.3, 7, [2, 3]) },
  whiteHorse: { family: "horseArcher", tier: 3, profile: p(1.18, 0.4, 1.15, 1.0, 0.6, 0.9, 1.4, 7, [2, 3]), traits: { critical: 10 } },
  // 새 기본 병종과 그 정예
  slinger: { family: "archer", tier: 1, profile: p(0.85, 0.4, 0.9, 0.8, 0.6, 0.85, 1.05, 5, [1, 2]) },
  hurler: { family: "archer", tier: 2, profile: p(0.95, 0.4, 1.08, 0.88, 0.6, 0.9, 1.1, 5, [1, 3]) },
  assassin: { family: "bandit", tier: 1, profile: p(0.8, 0.4, 1.25, 0.7, 0.7, 0.8, 1.45, 6, [1, 1]), traits: { critical: 20 } },
  phantom: { family: "bandit", tier: 2, profile: p(0.9, 0.4, 1.42, 0.78, 0.7, 0.85, 1.6, 6, [1, 1]), traits: { critical: 30 } },
  rattan: { family: "infantry", tier: 1, profile: p(1.15, 0.4, 1.0, 1.1, 0.5, 0.8, 0.85, 5, [1, 1]), traits: { physicalDamageReduction: 25, fireWeakness: 60 } },
  rattanElite: { family: "infantry", tier: 2, profile: p(1.3, 0.4, 1.12, 1.25, 0.5, 0.85, 0.88, 5, [1, 1]), traits: { physicalDamageReduction: 35, fireWeakness: 60 } },
  // 특수 병종의 정예
  warlock: { family: "shaman", tier: 2, profile: p(0.85, 1.7, 0.65, 0.68, 1.45, 1.3, 1.05, 5, [1, 1], true), traits: { strategyEvasion: 10 } },
  priestess: { family: "maiden", tier: 2, profile: p(0.9, 1.6, 0.65, 0.85, 1.12, 1.68, 1.05, 5, [1, 1], true), traits: { strategyDamageReduction: 15 } },
  stormSage: { family: "taoist", tier: 2, profile: p(0.85, 1.4, 0.65, 0.78, 1.48, 1.3, 1.35, 5, [1, 1], true) },
  divineDoctor: { family: "physician", tier: 2, profile: p(0.9, 1.85, 0.45, 0.85, 1.32, 1.48, 1.05, 5, [1, 1], true) },
  warriorMonk: { family: "monk", tier: 2, profile: p(1.25, 0.45, 1.3, 1.22, 0.6, 1.0, 1.35, 5, [1, 1], true), traits: { critical: 10 } },
  outlaw: { family: "bandit", tier: 2, profile: p(1.25, 0.4, 1.38, 0.9, 0.6, 0.95, 1.0, 5, [1, 1]), traits: { critical: 15 } },
  elephant: { family: "heavyCav", tier: 1, profile: p(1.7, 0.3, 1.25, 1.2, 0.4, 0.8, 0.6, 4, [1, 1]) },
  warElephant: { family: "heavyCav", tier: 2, profile: p(2.0, 0.3, 1.4, 1.35, 0.4, 0.85, 0.65, 4, [1, 1]), traits: { physicalDamageReduction: 10 } },
};

/** 진화 계통: 병종 → [다음 병종, 진화 레벨] */
export const EVOLUTION: Partial<Record<UnitClass, readonly [UnitClass, number]>> = {
  infantry: ["shieldGuard", 8], shieldGuard: ["royalGuard", 16],
  spearman: ["pikeman", 8], pikeman: ["halberdier", 16],
  cavalry: ["lancer", 8], lancer: ["tigerRider", 16],
  heavyCav: ["ironCav", 12],
  archer: ["longbow", 8], longbow: ["sharpshooter", 16],
  crossbow: ["repeater", 8], repeater: ["greatBow", 16],
  strategist: ["tactician", 8], tactician: ["mastermind", 16],
  fengshui: ["sage", 8], sage: ["immortal", 16],
  horseArcher: ["nomad", 10], nomad: ["whiteHorse", 18],
  slinger: ["hurler", 10],
  assassin: ["phantom", 12],
  rattan: ["rattanElite", 12],
  elephant: ["warElephant", 12],
  shaman: ["warlock", 12], maiden: ["priestess", 12], taoist: ["stormSage", 12], physician: ["divineDoctor", 12],
  monk: ["warriorMonk", 10], bandit: ["outlaw", 10],
};

/** 이동·상성·그림의 기준이 되는 병종. 기존 병종은 자기 자신. */
export function familyOf(unitClass: UnitClass): UnitClass {
  return VARIANTS[unitClass]?.family ?? unitClass;
}

/** 1 = 기본 병종, 2·3 = 진화 단계. */
export function tierOf(unitClass: UnitClass): 1 | 2 | 3 {
  return VARIANTS[unitClass]?.tier ?? 1;
}

/** 이 레벨에서 도달하는 최종 병종(여러 단계를 한 번에 건너뛸 수 있다). */
export function evolvedClass(unitClass: UnitClass, level: number): UnitClass {
  let current = unitClass;
  for (let guard = 0; guard < 4; guard++) {
    const next = EVOLUTION[current];
    if (!next || level < next[1]) break;
    current = next[0];
  }
  return current;
}

/** 다음 진화 병종과 필요 레벨. 마지막 단계면 undefined. */
export function nextEvolution(unitClass: UnitClass): { to: UnitClass; level: number } | undefined {
  const next = EVOLUTION[unitClass];
  return next ? { to: next[0], level: next[1] } : undefined;
}
