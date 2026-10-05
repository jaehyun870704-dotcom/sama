/**
 * 병종 계통 — 확장 병종과 진화.
 *
 * 새 병종은 기존 병종 하나를 '계열(family)'로 물려받는다. 이동 비용·지형 상성·
 * 병종 상성·그림은 계열의 것을 쓰고, 능력치 계수·사거리·고유 특성만 따로 둔다.
 * 그래서 병종을 늘려도 지형표와 상성표를 병종 수만큼 다시 쓰지 않는다.
 *
 * 진화: 레벨이 기준에 닿으면 같은 계통의 다음 단계 병종으로 바뀐다. 기본은 1→2→3단, 차트로 늘린 계통은 4·5단까지 있다.
 */
import type { UnitClass } from "./types.ts";
import { chartClasses } from "./chart-classes.ts";

/** 1 = 기본, 2 = 정예, 3 = 최정예, 4·5 = 차트로 늘린 전설 단계(검성은 5). */
export type ClassTier = 1 | 2 | 3 | 4 | 5;

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
  /** 1 = 기본, 2 = 정예, 3 = 최정예, 4·5 = 전설 */
  tier: ClassTier;
  profile: ClassProfile;
  /** 이 병종이 되면 붙는 고유 특성 (id → 매개변수) */
  traits?: Record<string, number>;
  /** 진화로 개화하는 스킬: 이름과 설명(특성은 traits가 실제로 건다). 3단계는 2단계 스킬을 이어받고 강화한다. */
  bloom?: { name: string; description: string };
}

const p = (
  hp: number, mp: number, attack: number, defense: number, intellect: number, spirit: number,
  agility: number, movement: number, range: readonly [number, number], canUseStrategy = false,
): ClassProfile => ({ hp, mp, attack, defense, intellect, spirit, agility, movement, range, canUseStrategy });

/** 확장 병종. 기존 20병종은 여기에 없다(자기 자신이 계열). */
export const VARIANTS: Partial<Record<UnitClass, ClassVariant>> = {
  // 보병 계통 — 버티는 전열
  shieldGuard: { family: "infantry", tier: 2, profile: p(1.25, 0.43, 1.06, 1.35, 0.64, 1.0, 0.95, 5, [1, 1]), traits: { guardian: 0 },
    bloom: { name: "방패 진형", description: "곁의 아군이 받을 피해를 대신 받는다" } },
  royalGuard: { family: "infantry", tier: 3, profile: p(1.4, 0.46, 1.15, 1.5, 0.68, 1.1, 1.01, 5, [1, 1]), traits: { guardian: 0, lastStand: 25, veteran: 15 },
    bloom: { name: "금위의 맹세", description: "호위에 더해, 체력이 낮을수록 공격력 상승(최대 25%) · 체력 절반 이하에서 받는 피해 15% 감소" } },
  // 창병 계통 — 기병 사냥
  pikeman: { family: "spearman", tier: 2, profile: p(1.15, 0.43, 1.2, 1.12, 0.64, 0.96, 0.96, 5, [1, 1]), traits: { counterBoost: 20 },
    bloom: { name: "장창 거치", description: "반격 위력 20% 증가" } },
  halberdier: { family: "spearman", tier: 3, profile: p(1.25, 0.46, 1.35, 1.2, 0.68, 1.02, 1.02, 5, [1, 1]), traits: { counterBoost: 25, unlimitedCounter: 0 },
    bloom: { name: "극진", description: "반격 위력 25% 증가 · 반격 횟수 제한 없음" } },
  // 경기병 계통 — 돌파
  lancer: { family: "cavalry", tier: 2, profile: p(1.1, 0.43, 1.3, 0.96, 0.64, 0.85, 1.28, 7, [1, 1]), traits: { penetrate: 15 },
    bloom: { name: "돌격 창", description: "적 방어 15% 무시" } },
  tigerRider: { family: "cavalry", tier: 3, profile: p(1.25, 0.46, 1.45, 1.1, 0.68, 0.9, 1.36, 7, [1, 1]), traits: { penetrate: 20, critical: 15 },
    bloom: { name: "호표 돌격", description: "적 방어 20% 무시 · 회심 15%" } },
  // 중기병 계통
  ironCav: { family: "heavyCav", tier: 2, profile: p(1.45, 0.43, 1.35, 1.35, 0.64, 0.85, 0.96, 6, [1, 1]), traits: { physicalDamageReduction: 10, counterBoost: 15 },
    bloom: { name: "철갑 돌진", description: "물리 피해 10% 감소 · 반격 위력 15% 증가" } },
  // 궁병 계통 — 사거리
  longbow: { family: "archer", tier: 2, profile: p(0.9, 0.53, 1.08, 0.85, 0.85, 0.96, 1.17, 5, [2, 3]), traits: { critical: 10 },
    bloom: { name: "정조준", description: "사거리 2~3 · 회심 10%" } },
  sharpshooter: { family: "archer", tier: 3, profile: p(0.96, 0.56, 1.22, 0.9, 0.9, 1.02, 1.25, 5, [2, 4]), traits: { critical: 15, penetrate: 20 },
    bloom: { name: "백보천양", description: "사거리 2~4 · 회심 15% · 적 방어 20% 무시" } },
  // 노병 계통 — 관통
  repeater: { family: "crossbow", tier: 2, profile: p(0.96, 0.53, 1.18, 0.9, 0.85, 0.96, 0.96, 4, [2, 3]), traits: { attackBoost: 4 },
    bloom: { name: "연발", description: "공격력 +4" } },
  greatBow: { family: "crossbow", tier: 3, profile: p(1.02, 0.56, 1.32, 0.96, 0.9, 1.02, 1.02, 4, [2, 4]), traits: { attackBoost: 6, penetrate: 30 },
    bloom: { name: "대황노", description: "사거리 2~4 · 공격력 +6 · 적 방어 30% 무시" } },
  // 책사 계통 — 지력
  tactician: { family: "strategist", tier: 2, profile: p(0.8, 1.45, 0.64, 0.75, 1.38, 1.3, 1.06, 5, [1, 1], true), traits: { strategyPower: 8 },
    bloom: { name: "군략", description: "책략 피해 8% 증가" } },
  mastermind: { family: "strategist", tier: 3, profile: p(0.85, 1.6, 0.68, 0.8, 1.48, 1.4, 1.13, 5, [1, 1], true), traits: { strategyPower: 12, strategyEvasion: 15 },
    bloom: { name: "신산귀모", description: "책략 피해 12% 증가 · 적의 책략을 15% 확률로 흘려 보낸다" } },
  // 풍수사 계통 — 정신
  sage: { family: "fengshui", tier: 2, profile: p(0.9, 1.6, 0.64, 0.8, 1.3, 1.45, 1.06, 5, [1, 1], true), traits: { healPower: 20, strategyDamageReduction: 10 },
    bloom: { name: "선도", description: "회복량 20% 증가 · 책략 피해 10% 감소" } },
  immortal: { family: "fengshui", tier: 3, profile: p(1.0, 1.85, 0.68, 0.85, 1.4, 1.6, 1.13, 5, [1, 1], true), traits: { healPower: 35, strategyDamageReduction: 20 },
    bloom: { name: "선인 강림", description: "회복량 35% 증가 · 책략 피해 20% 감소" } },
  // 궁기병 계통 — 기동 사격
  nomad: { family: "horseArcher", tier: 2, profile: p(1.08, 0.43, 1.02, 0.96, 0.64, 0.85, 1.3, 7, [2, 3]), traits: { critical: 10 },
    bloom: { name: "기사", description: "이동 7 · 회심 10%" } },
  whiteHorse: { family: "horseArcher", tier: 3, profile: p(1.18, 0.46, 1.15, 1.02, 0.68, 0.9, 1.4, 7, [2, 3]), traits: { critical: 15, penetrate: 15 },
    bloom: { name: "백마의종", description: "회심 15% · 적 방어 15% 무시" } },
  // 새 기본 병종과 그 정예
  slinger: { family: "archer", tier: 1, profile: p(0.85, 0.4, 0.9, 0.8, 0.6, 0.85, 1.05, 5, [1, 2]) },
  hurler: { family: "archer", tier: 2, profile: p(0.95, 0.43, 1.08, 0.88, 0.64, 0.9, 1.12, 5, [1, 3]), traits: { penetrate: 15 },
    bloom: { name: "벽력", description: "사거리 1~3 · 적 방어 15% 무시" } },
  assassin: { family: "bandit", tier: 1, profile: p(0.8, 0.4, 1.25, 0.7, 0.7, 0.8, 1.45, 6, [1, 1]), traits: { critical: 20 } },
  phantom: { family: "bandit", tier: 2, profile: p(0.9, 0.43, 1.42, 0.78, 0.75, 0.85, 1.6, 6, [1, 1]), traits: { critical: 30, lifesteal: 15 },
    bloom: { name: "그림자 일격", description: "회심 30% · 입힌 피해의 15%만큼 체력 회복" } },
  rattan: { family: "infantry", tier: 1, profile: p(1.15, 0.4, 1.0, 1.1, 0.5, 0.8, 0.85, 5, [1, 1]), traits: { physicalDamageReduction: 25, fireWeakness: 60 } },
  rattanElite: { family: "infantry", tier: 2, profile: p(1.3, 0.43, 1.12, 1.25, 0.53, 0.85, 0.9, 5, [1, 1]), traits: { physicalDamageReduction: 35, fireWeakness: 60, counterBoost: 10 },
    bloom: { name: "정예 등갑", description: "물리 피해 35% 감소 · 반격 위력 10% 증가 (여전히 화공에 약함)" } },
  elephant: { family: "heavyCav", tier: 1, profile: p(1.7, 0.3, 1.25, 1.2, 0.4, 0.8, 0.6, 4, [1, 1]) },
  warElephant: { family: "heavyCav", tier: 2, profile: p(2.0, 0.32, 1.4, 1.35, 0.43, 0.85, 0.64, 4, [1, 1]), traits: { physicalDamageReduction: 10, counterBoost: 20 },
    bloom: { name: "코끼리 돌진", description: "물리 피해 10% 감소 · 반격 위력 20% 증가" } },
  // 특수 병종의 정예
  warlock: { family: "shaman", tier: 2, profile: p(0.85, 1.7, 0.65, 0.68, 1.45, 1.3, 1.06, 5, [1, 1], true), traits: { strategyEvasion: 10, strategyPower: 8 },
    bloom: { name: "요술", description: "책략 피해 8% 증가 · 적의 책략을 10% 확률로 흘린다" } },
  priestess: { family: "maiden", tier: 2, profile: p(0.9, 1.6, 0.65, 0.85, 1.12, 1.68, 1.06, 5, [1, 1], true), traits: { strategyDamageReduction: 15, healPower: 20 },
    bloom: { name: "신녀의 가호", description: "회복량 20% 증가 · 책략 피해 15% 감소" } },
  stormSage: { family: "taoist", tier: 2, profile: p(0.85, 1.4, 0.65, 0.78, 1.48, 1.3, 1.38, 5, [1, 1], true), traits: { strategyPower: 12 },
    bloom: { name: "뇌공", description: "책략 피해 12% 증가" } },
  divineDoctor: { family: "physician", tier: 2, profile: p(0.9, 1.85, 0.45, 0.85, 1.32, 1.48, 1.06, 5, [1, 1], true), traits: { healPower: 40 },
    bloom: { name: "신의의 손", description: "회복량 40% 증가" } },
  warriorMonk: { family: "monk", tier: 2, profile: p(1.25, 0.45, 1.3, 1.22, 0.64, 1.0, 1.38, 5, [1, 1], true), traits: { critical: 10, veteran: 15 },
    bloom: { name: "금강불괴", description: "회심 10% · 체력 절반 이하에서 받는 피해 15% 감소" } },
  outlaw: { family: "bandit", tier: 2, profile: p(1.25, 0.43, 1.38, 0.9, 0.64, 0.96, 1.0, 5, [1, 1]), traits: { critical: 15, lastStand: 20 },
    bloom: { name: "녹림호걸", description: "회심 15% · 체력이 낮을수록 공격력 상승(최대 20%)" } },
  // 2단계에서 끝나던 계통의 3단계 — 2단계 스킬을 이어받아 강화한다
  ironPagoda: { family: "heavyCav", tier: 3, profile: p(1.6, 0.46, 1.48, 1.5, 0.68, 0.9, 1.02, 6, [1, 1]), traits: { physicalDamageReduction: 15, counterBoost: 20, penetrate: 15 },
    bloom: { name: "철부도", description: "물리 피해 15% 감소 · 반격 위력 20% 증가 · 적 방어 15% 무시" } },
  elephantKing: { family: "heavyCav", tier: 3, profile: p(2.2, 0.34, 1.52, 1.48, 0.46, 0.9, 0.68, 4, [1, 1]), traits: { physicalDamageReduction: 15, counterBoost: 25, physicalReflect: 10 },
    bloom: { name: "상왕의 진격", description: "물리 피해 15% 감소 · 반격 위력 25% 증가 · 받은 물리 피해의 10%를 되돌린다" } },
  boulderCorps: { family: "archer", tier: 3, profile: p(1.02, 0.46, 1.2, 0.94, 0.68, 0.96, 1.2, 5, [1, 3]), traits: { penetrate: 25, critical: 10 },
    bloom: { name: "천균 낙석", description: "사거리 1~3 · 적 방어 25% 무시 · 회심 10%" } },
  wraith: { family: "bandit", tier: 3, profile: p(0.96, 0.46, 1.55, 0.83, 0.8, 0.9, 1.72, 6, [1, 1]), traits: { critical: 35, lifesteal: 20, penetrate: 15 },
    bloom: { name: "귀영 살수", description: "회심 35% · 입힌 피해의 20%만큼 체력 회복 · 적 방어 15% 무시" } },
  wuguoRattan: { family: "infantry", tier: 3, profile: p(1.42, 0.46, 1.2, 1.36, 0.56, 0.9, 0.95, 5, [1, 1]), traits: { physicalDamageReduction: 40, fireWeakness: 50, counterBoost: 15 },
    bloom: { name: "오과국 등갑", description: "물리 피해 40% 감소 · 반격 위력 15% 증가 · 화공 취약이 50%로 줄어든다" } },
  greenwoodKing: { family: "bandit", tier: 3, profile: p(1.36, 0.46, 1.5, 0.96, 0.68, 1.02, 1.06, 5, [1, 1]), traits: { critical: 20, lastStand: 25, lifesteal: 10 },
    bloom: { name: "녹림대왕", description: "회심 20% · 체력이 낮을수록 공격력 상승(최대 25%) · 입힌 피해의 10%만큼 체력 회복" } },
  arhat: { family: "monk", tier: 3, profile: p(1.36, 0.48, 1.4, 1.32, 0.68, 1.08, 1.46, 5, [1, 1], true), traits: { critical: 15, veteran: 20, strategyDamageReduction: 10 },
    bloom: { name: "나한 금신", description: "회심 15% · 체력 절반 이하에서 받는 피해 20% 감소 · 책략 피해 10% 감소" } },
  demonKing: { family: "shaman", tier: 3, profile: p(0.9, 1.85, 0.69, 0.72, 1.55, 1.38, 1.12, 5, [1, 1], true), traits: { strategyEvasion: 15, strategyPower: 12, strategyReflect: 10 },
    bloom: { name: "요왕의 저주", description: "책략 피해 12% 증가 · 적의 책략을 15% 확률로 흘린다 · 받은 책략 피해의 10%를 되돌린다" } },
  celestial: { family: "maiden", tier: 3, profile: p(0.96, 1.75, 0.69, 0.9, 1.2, 1.82, 1.12, 5, [1, 1], true), traits: { strategyDamageReduction: 20, healPower: 30, strategyEvasion: 10 },
    bloom: { name: "선녀의 비호", description: "회복량 30% 증가 · 책략 피해 20% 감소 · 적의 책략을 10% 확률로 흘린다" } },
  thunderGod: { family: "taoist", tier: 3, profile: p(0.9, 1.52, 0.69, 0.83, 1.6, 1.38, 1.46, 5, [1, 1], true), traits: { strategyPower: 18, strategyEvasion: 10 },
    bloom: { name: "뇌신 강림", description: "책략 피해 18% 증가 · 적의 책략을 10% 확률로 흘린다" } },
  medicineSaint: { family: "physician", tier: 3, profile: p(0.96, 2.0, 0.48, 0.9, 1.4, 1.58, 1.12, 5, [1, 1], true), traits: { healPower: 55, strategyDamageReduction: 10 },
    bloom: { name: "의선의 묘수", description: "회복량 55% 증가 · 책략 피해 10% 감소" } },
  // 새 기본 계통: 투창병 — 창병 계열, 붙은 적과 한 칸 건너 적을 모두 찌르는 경보병
  javelin: { family: "spearman", tier: 1, profile: p(1.0, 0.4, 1.0, 0.95, 0.6, 0.85, 0.95, 5, [1, 2]) },
  eliteJavelin: { family: "spearman", tier: 2, profile: p(1.1, 0.43, 1.12, 1.04, 0.64, 0.9, 1.02, 5, [1, 2]), traits: { penetrate: 10, counterBoost: 10 },
    bloom: { name: "표창 투척", description: "사거리 1~2 · 적 방어 10% 무시 · 반격 위력 10% 증가" } },
  flyingSpear: { family: "spearman", tier: 3, profile: p(1.2, 0.46, 1.24, 1.12, 0.68, 0.96, 1.08, 5, [1, 3]), traits: { penetrate: 20, counterBoost: 15, critical: 10 },
    bloom: { name: "비창 폭우", description: "사거리 1~3 · 적 방어 20% 무시 · 반격 위력 15% 증가 · 회심 10%" } },
  // ── 명부대(이름난 부대) 계통: 정사·연의에 이름이 남은 부대를 병종으로 ──
  // 도부수 → 대도병 → 함진영(고순): 방어를 버리고 베는 보병
  axeman: { family: "infantry", tier: 1, profile: p(1.0, 0.4, 1.18, 0.85, 0.55, 0.8, 1.0, 5, [1, 1]), traits: { critical: 10 } },
  greatBlade: { family: "infantry", tier: 2, profile: p(1.1, 0.43, 1.34, 0.92, 0.58, 0.85, 1.05, 5, [1, 1]), traits: { critical: 15, penetrate: 10 },
    bloom: { name: "대도 참격", description: "회심 15% · 적 방어 10% 무시" } },
  xianzhen: { family: "infantry", tier: 3, profile: p(1.22, 0.46, 1.5, 1.0, 0.62, 0.9, 1.11, 5, [1, 1]), traits: { critical: 20, penetrate: 25, lastStand: 15 },
    bloom: { name: "함진영", description: "고순의 칠백 · 회심 20% · 적 방어 25% 무시 · 체력이 낮을수록 공격력 상승(최대 15%)" } },
  // 산악병 → 무당비군(왕평): 산을 평지처럼 달리는 촉의 산병
  mountaineer: { family: "bandit", tier: 1, profile: p(0.95, 0.4, 1.02, 0.88, 0.6, 0.85, 1.2, 5, [1, 2]), traits: { roughTerrainMove: 0 } },
  wudang: { family: "bandit", tier: 2, profile: p(1.08, 0.43, 1.18, 0.95, 0.64, 0.9, 1.32, 6, [1, 2]), traits: { roughTerrainMove: 0, critical: 15, strategyDamageReduction: 10 },
    bloom: { name: "무당비군", description: "왕평의 산병 · 험지 이동 · 회심 15% · 책략 피해 10% 감소" } },
  // 서량기병 → 비웅군(동탁): 거친 서쪽 기병
  xiliang: { family: "cavalry", tier: 1, profile: p(1.05, 0.4, 1.15, 0.9, 0.55, 0.8, 1.2, 7, [1, 1]), traits: { attackBoost: 3 } },
  feixiong: { family: "cavalry", tier: 2, profile: p(1.2, 0.43, 1.35, 1.0, 0.58, 0.85, 1.26, 7, [1, 1]), traits: { attackBoost: 5, lifesteal: 10, lastStand: 15 },
    bloom: { name: "비웅군", description: "동탁의 서량 정예 · 공격력 +5 · 입힌 피해의 10% 회복 · 체력이 낮을수록 공격력 상승" } },
  // 청주병 → 단양병 → 백이병(진도): 버티는 정규 보병
  qingzhou: { family: "infantry", tier: 1, profile: p(1.15, 0.4, 0.98, 1.08, 0.55, 0.85, 0.92, 5, [1, 1]), traits: { veteran: 10 } },
  danyang: { family: "infantry", tier: 2, profile: p(1.28, 0.43, 1.1, 1.22, 0.6, 0.9, 0.98, 5, [1, 1]), traits: { veteran: 15, counterBoost: 15 },
    bloom: { name: "단양 정병", description: "체력 절반 이하에서 받는 피해 15% 감소 · 반격 위력 15% 증가" } },
  baier: { family: "infantry", tier: 3, profile: p(1.4, 0.46, 1.22, 1.38, 0.64, 1.0, 1.04, 5, [1, 1]), traits: { veteran: 20, counterBoost: 20, guardian: 0 },
    bloom: { name: "백이병", description: "진도의 흰 깃털 친위대 · 곁의 아군 피해를 대신 받음 · 반격 위력 20% · 위기 피해 20% 감소" } },
  // 극사 → 대극사(원소): 긴 극으로 두 칸 앞까지 찌른다
  jishi: { family: "spearman", tier: 1, profile: p(1.05, 0.4, 1.08, 1.0, 0.55, 0.85, 0.92, 5, [1, 2]), traits: { counterBoost: 10 } },
  daji: { family: "spearman", tier: 2, profile: p(1.18, 0.43, 1.28, 1.12, 0.6, 0.9, 0.98, 5, [1, 2]), traits: { counterBoost: 20, penetrate: 15 },
    bloom: { name: "대극사", description: "원소의 극 부대 · 사거리 1~2 · 반격 위력 20% · 적 방어 15% 무시" } },
  // 방패노병 → 선등사(국의): 방패 뒤에서 쏘는 노병
  shieldBow: { family: "crossbow", tier: 1, profile: p(1.05, 0.45, 1.0, 1.05, 0.7, 0.9, 0.9, 4, [2, 2]), traits: { physicalDamageReduction: 10 } },
  xiandeng: { family: "crossbow", tier: 2, profile: p(1.15, 0.48, 1.22, 1.15, 0.75, 0.95, 0.95, 4, [1, 3]), traits: { physicalDamageReduction: 15, critical: 10, unlimitedCounter: 0 },
    bloom: { name: "선등사", description: "국의의 결사대 · 사거리 1~3 · 물리 피해 15% 감소 · 회심 10% · 반격 제한 없음" } },
  // 고취수 → 군악대: 북과 피리로 부대를 움직이는 지원 병종
  drummer: { family: "fengshui", tier: 1, profile: p(0.95, 1.2, 0.7, 0.85, 0.9, 1.2, 1.05, 5, [1, 1], true) },
  warDrummer: { family: "fengshui", tier: 2, profile: p(1.05, 1.4, 0.79, 0.9, 1.0, 1.35, 1.11, 5, [1, 1], true), traits: { strategyDamageReduction: 10, defenseBoost: 5 },
    bloom: { name: "군악대", description: "진군의 북 · 받는 피해 5% 감소 · 책략 피해 10% 감소 · 고무·강행·견고를 넓게 건다" } },
  // 기마책사 → 질풍군사: 말 위에서 책략을 쓰는 기동 책사
  riderSage: { family: "cavalry", tier: 1, profile: p(0.9, 1.15, 0.8, 0.8, 1.15, 1.05, 1.2, 6, [1, 1], true) },
  swiftSage: { family: "cavalry", tier: 2, profile: p(0.98, 1.35, 0.86, 0.86, 1.3, 1.15, 1.28, 7, [1, 1], true), traits: { strategyPower: 10, strategyEvasion: 10 },
    bloom: { name: "질풍군사", description: "이동 7의 기마 책사 · 책략 피해 10% 증가 · 적의 책략을 10% 확률로 흘린다" } },
  // ── 초한(楚漢)의 이름난 부대 ──
  // 강동자제 → 패왕친위군: 항우와 함께 강을 건넌 강동의 팔천 자제
  jiangdong: { family: "infantry", tier: 1, profile: p(1.05, 0.4, 1.2, 0.95, 0.55, 0.85, 1.1, 5, [1, 1]), traits: { lastStand: 10 } },
  bawang: { family: "infantry", tier: 2, profile: p(1.2, 0.43, 1.4, 1.05, 0.6, 0.9, 1.16, 5, [1, 1]), traits: { lastStand: 20, critical: 15 },
    bloom: { name: "패왕친위", description: "항우의 친위 · 회심 15% · 체력이 낮을수록 공격력 상승(최대 20%)" } },
  // 낭중기 → 우림기: 한이 초의 기병에 맞서 꾸린 기병대
  langzhong: { family: "cavalry", tier: 1, profile: p(1.0, 0.4, 1.12, 0.92, 0.6, 0.85, 1.25, 7, [1, 1]), traits: { chargePower: 8 } },
  yulin: { family: "cavalry", tier: 2, profile: p(1.12, 0.43, 1.3, 1.0, 0.64, 0.9, 1.32, 7, [1, 1]), traits: { chargePower: 15, penetrate: 10 },
    bloom: { name: "우림기", description: "한의 친위 기병 · 움직인 뒤 물리 공격 +15% · 적 방어 10% 무시" } },
  // ── 2단계에서 끝나던 명부대 계통의 3단계(v41): 모든 계통은 3단 진화
  cliffWalker: { family: "bandit", tier: 3, profile: p(1.18, 0.46, 1.3, 1.02, 0.68, 0.96, 1.4, 6, [1, 2]), traits: { roughTerrainMove: 0, critical: 20, strategyDamageReduction: 15, penetrate: 10 },
    bloom: { name: "잔도귀병", description: "험지 이동 · 회심 20% · 책략 피해 15% 감소 · 적 방어 10% 무시" } },
  liangzhouIron: { family: "cavalry", tier: 3, profile: p(1.32, 0.46, 1.48, 1.1, 0.62, 0.9, 1.33, 7, [1, 1]), traits: { attackBoost: 7, lifesteal: 12, lastStand: 20, physicalDamageReduction: 8 },
    bloom: { name: "서량철기", description: "공격력 +7 · 입힌 피해의 12% 회복 · 체력이 낮을수록 공격력 상승 · 물리 피해 8% 감소" } },
  tianji: { family: "spearman", tier: 3, profile: p(1.3, 0.46, 1.42, 1.22, 0.64, 0.96, 1.04, 5, [1, 2]), traits: { counterBoost: 25, penetrate: 20, unlimitedCounter: 0 },
    bloom: { name: "천극위", description: "사거리 1~2 · 반격 위력 25% · 적 방어 20% 무시 · 반격 제한 없음" } },
  baizhan: { family: "crossbow", tier: 3, profile: p(1.25, 0.51, 1.35, 1.25, 0.8, 1.0, 1.0, 4, [1, 3]), traits: { physicalDamageReduction: 20, critical: 15, unlimitedCounter: 0, penetrate: 15 },
    bloom: { name: "백전선등", description: "사거리 1~3 · 물리 피해 20% 감소 · 회심 15% · 반격 제한 없음 · 적 방어 15% 무시" } },
  grandBand: { family: "fengshui", tier: 3, profile: p(1.12, 1.6, 0.86, 0.96, 1.08, 1.5, 1.17, 5, [1, 1], true), traits: { strategyDamageReduction: 15, defenseBoost: 8, healPower: 15 },
    bloom: { name: "대고취대", description: "천 개의 북 · 받는 피해 8% 감소 · 책략 피해 15% 감소 · 회복 15% 증가 · 고무·강행·견고를 넓게 건다" } },
  divineSage: { family: "cavalry", tier: 3, profile: p(1.05, 1.55, 0.91, 0.92, 1.42, 1.25, 1.35, 7, [1, 1], true), traits: { strategyPower: 15, strategyEvasion: 15 },
    bloom: { name: "신기군사", description: "이동 7의 기마 책사 · 책략 피해 15% 증가 · 적의 책략을 15% 확률로 흘린다" } },
  overlordGuard: { family: "infantry", tier: 3, profile: p(1.32, 0.46, 1.56, 1.14, 0.64, 0.96, 1.22, 5, [1, 1]), traits: { lastStand: 30, critical: 20, penetrate: 10 },
    bloom: { name: "패왕금위", description: "강동 팔천의 끝 · 회심 20% · 체력이 낮을수록 공격력 상승(최대 30%) · 적 방어 10% 무시" } },
  huben: { family: "cavalry", tier: 3, profile: p(1.24, 0.46, 1.44, 1.08, 0.68, 0.96, 1.39, 7, [1, 1]), traits: { chargePower: 22, penetrate: 15, critical: 10 },
    bloom: { name: "호분위", description: "황제의 호위 기병 · 움직인 뒤 물리 공격 +22% · 적 방어 15% 무시 · 회심 10%" } },
  // ── 공성·수군 계통도 3단 진화(v41)
  sapper: { family: "engineer", tier: 2, profile: p(0.92, 0.33, 0.62, 0.95, 0.78, 1.0, 0.86, 5, [1, 1]), traits: { physicalDamageReduction: 10 },
    bloom: { name: "축성병", description: "방책을 세우고 성벽을 고치는 숙련 공병 · 물리 피해 10% 감소" } },
  masterBuilder: { family: "engineer", tier: 3, profile: p(1.05, 0.36, 0.74, 1.08, 0.88, 1.1, 0.92, 5, [1, 1]), traits: { physicalDamageReduction: 15, defenseBoost: 6 },
    bloom: { name: "공성 장인", description: "운제·충차를 다루는 장인 · 물리 피해 15% 감소 · 받는 피해 6% 감소" } },
  thunderCart: { family: "catapult", tier: 2, profile: p(1.05, 0.33, 1.25, 0.82, 0.64, 0.86, 0.64, 3, [2, 4]), traits: { penetrate: 15 },
    bloom: { name: "벽력거", description: "조조가 관도에서 쓴 돌수레 · 적 방어 15% 무시" } },
  greatTrebuchet: { family: "catapult", tier: 3, profile: p(1.15, 0.36, 1.42, 0.9, 0.68, 0.92, 0.68, 3, [2, 5]), traits: { penetrate: 25, critical: 10 },
    bloom: { name: "천균거", description: "천 균의 돌을 던지는 큰 포차 · 사거리 2~5 · 적 방어 25% 무시 · 회심 10%" } },
  ironRam: { family: "ram", tier: 2, profile: p(1.75, 0.22, 0.98, 1.6, 0.42, 0.86, 0.53, 3, [1, 1]), traits: { physicalDamageReduction: 15 },
    bloom: { name: "철충차", description: "쇠를 씌운 충차 · 물리 피해 15% 감소" } },
  cloudRam: { family: "ram", tier: 3, profile: p(2.0, 0.24, 1.12, 1.8, 0.45, 0.92, 0.56, 3, [1, 1]), traits: { physicalDamageReduction: 22, physicalReflect: 10 },
    bloom: { name: "파성충차", description: "성문을 부수는 큰 망치 수레 · 물리 피해 22% 감소 · 받은 물리 피해의 10%를 되돌린다" } },
  mengchong: { family: "navy", tier: 2, profile: p(1.12, 0.53, 1.15, 1.05, 0.84, 0.96, 1.08, 6, [1, 2]), traits: { chargePower: 12 },
    bloom: { name: "몽충", description: "가죽을 씌운 돌격선 · 움직인 뒤 물리 공격 +12%" } },
  louchuan: { family: "navy", tier: 3, profile: p(1.32, 0.56, 1.3, 1.2, 0.9, 1.02, 1.14, 6, [1, 3]), traits: { chargePower: 15, physicalDamageReduction: 12, penetrate: 10 },
    bloom: { name: "누선", description: "여러 층 망루를 올린 큰 배 · 사거리 1~3 · 물리 피해 12% 감소 · 적 방어 10% 무시" } },
};

/** 진화 계통: 병종 → [다음 병종, 진화 레벨] */
export const EVOLUTION: Partial<Record<UnitClass, readonly [UnitClass, number]>> = {
  infantry: ["shieldGuard", 8], shieldGuard: ["royalGuard", 16],
  spearman: ["pikeman", 8], pikeman: ["halberdier", 16],
  cavalry: ["lancer", 8], lancer: ["tigerRider", 16],
  heavyCav: ["ironCav", 12], ironCav: ["ironPagoda", 20],
  archer: ["longbow", 8], longbow: ["sharpshooter", 16],
  crossbow: ["repeater", 8], repeater: ["greatBow", 16],
  strategist: ["tactician", 8], tactician: ["mastermind", 16],
  fengshui: ["sage", 8], sage: ["immortal", 16],
  horseArcher: ["nomad", 10], nomad: ["whiteHorse", 18],
  slinger: ["hurler", 10], hurler: ["boulderCorps", 18],
  assassin: ["phantom", 12], phantom: ["wraith", 20],
  rattan: ["rattanElite", 12], rattanElite: ["wuguoRattan", 20],
  elephant: ["warElephant", 12], warElephant: ["elephantKing", 22],
  shaman: ["warlock", 12], warlock: ["demonKing", 20],
  maiden: ["priestess", 12], priestess: ["celestial", 20],
  taoist: ["stormSage", 12], stormSage: ["thunderGod", 20],
  physician: ["divineDoctor", 12], divineDoctor: ["medicineSaint", 20],
  monk: ["warriorMonk", 10], warriorMonk: ["arhat", 18],
  bandit: ["outlaw", 10], outlaw: ["greenwoodKing", 18],
  javelin: ["eliteJavelin", 10], eliteJavelin: ["flyingSpear", 18],
  axeman: ["greatBlade", 10], greatBlade: ["xianzhen", 18],
  mountaineer: ["wudang", 12], wudang: ["cliffWalker", 20], xiliang: ["feixiong", 12], feixiong: ["liangzhouIron", 20],
  qingzhou: ["danyang", 10], danyang: ["baier", 18],
  jishi: ["daji", 12], daji: ["tianji", 20], shieldBow: ["xiandeng", 12], xiandeng: ["baizhan", 20],
  drummer: ["warDrummer", 12], warDrummer: ["grandBand", 20], riderSage: ["swiftSage", 14], swiftSage: ["divineSage", 22],
  jiangdong: ["bawang", 12], bawang: ["overlordGuard", 20], langzhong: ["yulin", 12], yulin: ["huben", 20],
  engineer: ["sapper", 10], sapper: ["masterBuilder", 18], catapult: ["thunderCart", 10], thunderCart: ["greatTrebuchet", 18],
  ram: ["ironRam", 10], ironRam: ["cloudRam", 18], navy: ["mengchong", 10], mengchong: ["louchuan", 18],
};

// 병종 차트로 늘린 계통·4단계·모병 특수 병과(chart-classes.ts)를 합친다.
{
  const chart = chartClasses(VARIANTS);
  Object.assign(VARIANTS, chart.variants);
  Object.assign(EVOLUTION, chart.evolution);
}

/** 이동·상성·그림의 기준이 되는 병종. 기존 병종은 자기 자신. */
export function familyOf(unitClass: UnitClass): UnitClass {
  return VARIANTS[unitClass]?.family ?? unitClass;
}

/** 1 = 기본 병종, 2·3 = 진화 단계. */
export function tierOf(unitClass: UnitClass): ClassTier {
  return VARIANTS[unitClass]?.tier ?? 1;
}

/** 이 레벨에서 도달하는 최종 병종(여러 단계를 한 번에 건너뛸 수 있다). */
export function evolvedClass(unitClass: UnitClass, level: number): UnitClass {
  let current = unitClass;
  for (let guard = 0; guard < 6; guard++) {
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
