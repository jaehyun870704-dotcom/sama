/**
 * 장비 — 칸(무기·방어구·보조구), 종류(검·창·활…), 계통별 장착 제한, 등급(1~4)과 장비 레벨, 소모품.
 *
 * 구조는 조조전의 장비 체계를 따른다.
 *  · 이름 있는 보물(고유 보물) 50점: 종류·등급과 고유 기능(treasure-traits.ts의 `gear:*` 특성). 최대 레벨 9.
 *  · 이름 없는 상점 장비: 14종 × 4등급. 같은 등급 같은 종류라면 고유 보물보다 기본 능력이 조금 높다. 최대 레벨 3.
 *  · 장수마다 계통(병종의 계통 줄기)에 따라 쓸 수 있는 무기 종류 하나·방어구 종류 하나가 정해진다.
 * 수치·문장은 이 게임이 정했다(원작 문구를 옮기지 않는다).
 */
import type { UnitClass, UnitStats } from "./types.ts";
import { FOUR_STAGE_LINES, SINGLE_STAGE_CLASSES, VARIANTS, familyOf } from "./classes.ts";

export type GearSlot = "weapon" | "armor" | "accessory";
export type WeaponKind = "sword" | "spear" | "bow" | "club" | "catapult" | "fan" | "sacredSword";
export type ArmorKind = "armor" | "robe";
export type GearKind =
  | WeaponKind | ArmorKind
  | "shield" | "helmet" | "hood" | "gloves" | "barding"
  | "wheel" | "horse" | "stone" | "book" | "pouch" | "seal" | "jewel";

/** 종류: 이름·칸·상점에서 파는가. */
export const GEAR_KINDS: Readonly<Record<GearKind, { name: string; slot: GearSlot; shop: boolean }>> = {
  sword: { name: "검", slot: "weapon", shop: true },
  spear: { name: "창", slot: "weapon", shop: true },
  bow: { name: "활", slot: "weapon", shop: true },
  club: { name: "곤봉", slot: "weapon", shop: true },
  catapult: { name: "투석기", slot: "weapon", shop: true },
  fan: { name: "부채", slot: "weapon", shop: true },
  sacredSword: { name: "보검", slot: "weapon", shop: true },
  armor: { name: "갑옷", slot: "armor", shop: true },
  robe: { name: "옷", slot: "armor", shop: true },
  shield: { name: "방패", slot: "accessory", shop: true },
  helmet: { name: "투구", slot: "accessory", shop: true },
  hood: { name: "두건", slot: "accessory", shop: true },
  gloves: { name: "장갑", slot: "accessory", shop: true },
  barding: { name: "기마갑옷", slot: "accessory", shop: true },
  wheel: { name: "바퀴", slot: "accessory", shop: false },
  horse: { name: "명마", slot: "accessory", shop: false },
  stone: { name: "돌멩이", slot: "accessory", shop: false },
  book: { name: "서적", slot: "accessory", shop: false },
  pouch: { name: "주머니", slot: "accessory", shop: false },
  seal: { name: "도장", slot: "accessory", shop: false },
  jewel: { name: "사신보옥", slot: "accessory", shop: false },
};
/** 상점에서 파는 14종(표시 순서). */
export const SHOP_KINDS: readonly GearKind[] = ["sword", "spear", "bow", "club", "catapult", "fan", "sacredSword", "armor", "robe", "shield", "helmet", "hood", "gloves", "barding"];

// ─────────────────────────────────────────────────────────── 계통 → 장비 종류

/** 장비를 가르는 계통(병종 줄기를 생김새·무기로 묶은 것). */
export type GearGroup =
  | "lord" | "foot" | "spear" | "cav" | "archer" | "crossbow" | "horseArcher"
  | "monk" | "dancer" | "beast" | "siege" | "strategist" | "mountedStrategist" | "shaman"
  | "taoist" | "fengshui" | "maiden" | "bandit" | "pirate" | "emperor" | "worker" | "civilian";
export const GROUP_NAMES: Readonly<Record<GearGroup, string>> = {
  lord: "군주계", foot: "보병계", spear: "창병계", cav: "기병계", archer: "궁병계", crossbow: "노병계", horseArcher: "궁기병계",
  monk: "무도가계", dancer: "무희계", beast: "맹수류", siege: "포차계", strategist: "책사계", mountedStrategist: "기마책사계",
  shaman: "주술사계", taoist: "도사계", fengshui: "풍수사계", maiden: "무녀계", bandit: "적병계", pirate: "해적계",
  emperor: "황제계", worker: "공병계", civilian: "백성",
};
/** 계통마다 무기 종류 하나·방어구 종류 하나. */
export const GROUP_GEAR: Readonly<Record<GearGroup, { weapon: WeaponKind; armor: ArmorKind }>> = {
  lord: { weapon: "sword", armor: "armor" }, foot: { weapon: "sword", armor: "armor" }, spear: { weapon: "spear", armor: "armor" },
  cav: { weapon: "spear", armor: "armor" }, archer: { weapon: "bow", armor: "armor" }, crossbow: { weapon: "bow", armor: "armor" },
  horseArcher: { weapon: "bow", armor: "armor" }, monk: { weapon: "club", armor: "robe" }, dancer: { weapon: "club", armor: "robe" },
  beast: { weapon: "club", armor: "robe" }, siege: { weapon: "catapult", armor: "robe" }, strategist: { weapon: "fan", armor: "robe" },
  mountedStrategist: { weapon: "fan", armor: "robe" }, shaman: { weapon: "fan", armor: "robe" }, taoist: { weapon: "sacredSword", armor: "robe" },
  fengshui: { weapon: "sacredSword", armor: "robe" }, maiden: { weapon: "sacredSword", armor: "robe" }, bandit: { weapon: "sword", armor: "robe" },
  pirate: { weapon: "sword", armor: "robe" }, emperor: { weapon: "sword", armor: "robe" }, worker: { weapon: "club", armor: "robe" },
  civilian: { weapon: "sword", armor: "robe" },
};
/**
 * 병종 줄기(4단 계통의 첫 병종, 또는 한 단계뿐인 병종) → 장비 계통.
 * 애매한 줄기는 생김새·무기로 정했다: 등갑병·검사는 보병계, 황건적·자객은 적병계, 코끼리는 맹수류, 수군은 해적계.
 */
export const LINE_GROUP: Readonly<Record<string, GearGroup>> = {
  infantry: "foot", rattan: "foot", swordsman: "foot",
  spearman: "spear", javelin: "spear",
  cavalry: "cav", heavyCav: "cav", mountainCav: "cav", valiantCav: "cav", lightChariot: "cav", nanmanRider: "cav", halberdCav: "cav", qiang: "cav", xiliang: "cav", gaemaWarrior: "cav",
  archer: "archer", crossbow: "crossbow", sniper: "crossbow", horseArcher: "horseArcher",
  strategist: "strategist", mountedStrategist: "mountedStrategist", shaman: "shaman", taoist: "taoist", fengshui: "fengshui", maiden: "maiden",
  monk: "monk", dancer: "dancer", elephant: "beast",
  catapult: "siege", ram: "siege", siegeTower: "siege",
  assassin: "bandit", bandit: "bandit", yellowTurban: "bandit",
  pirate: "pirate", navy: "pirate",
  lord: "lord", commander: "lord", crownPrince: "lord", royalPrince: "lord",
  emperor: "emperor", heavenEmperor: "emperor",
  engineer: "worker", transport: "worker", civilian: "civilian",
};
/** 장비 판정에 쓰는 줄기: 4단 계통의 첫 병종(없으면 자기 자신). */
export function lineRootOf(unitClass: UnitClass): UnitClass {
  return FOUR_STAGE_LINES.find((l) => l.includes(unitClass))?.[0] ?? unitClass;
}
/** 모든 병종(4단 계통 + 한 단계 병종 + 병종표에 있는 것). 표 누락 검사에 쓴다. */
export function allGearClasses(): UnitClass[] {
  const out = new Set<UnitClass>();
  for (const l of FOUR_STAGE_LINES) for (const c of l) out.add(c);
  for (const c of SINGLE_STAGE_CLASSES) out.add(c);
  for (const c of Object.keys(VARIANTS) as UnitClass[]) out.add(c);
  return [...out];
}
/** 표에 이 줄기가 있는가(테스트용: 누락이 없어야 한다). */
export function hasGearGroup(unitClass: UnitClass): boolean {
  return LINE_GROUP[lineRootOf(unitClass)] !== undefined;
}
const FAMILY_FALLBACK: Partial<Record<string, GearGroup>> = { infantry: "foot", spearman: "spear", cavalry: "cav", heavyCav: "cav", archer: "archer", crossbow: "crossbow", strategist: "strategist", fengshui: "fengshui", horseArcher: "horseArcher", bandit: "bandit", shaman: "shaman", maiden: "maiden", taoist: "taoist", monk: "monk", catapult: "siege", engineer: "worker", navy: "pirate", ram: "siege" };
export function gearGroupOf(unitClass: UnitClass): GearGroup {
  return LINE_GROUP[lineRootOf(unitClass)] ?? FAMILY_FALLBACK[familyOf(unitClass)] ?? "foot";
}
export const ARMOR_GROUPS: readonly GearGroup[] = (Object.keys(GROUP_GEAR) as GearGroup[]).filter((g) => GROUP_GEAR[g].armor === "armor");
export const ROBE_GROUPS: readonly GearGroup[] = (Object.keys(GROUP_GEAR) as GearGroup[]).filter((g) => GROUP_GEAR[g].armor === "robe");

// ─────────────────────────────────────────────────────────── 장비 정의

export type GearGrade = 1 | 2 | 3 | 4;
export const GRADE_NAMES: Readonly<Record<GearGrade, string>> = { 1: "일반", 2: "희귀", 3: "영웅", 4: "전설" };
export type GearStat = keyof Pick<UnitStats, "attack" | "defense" | "intellect" | "spirit" | "agility" | "maxHp" | "maxMp" | "movement">;
export interface GearDef {
  /** 고유 보물은 저장 id, 상점 장비는 `shop:<종류>:<등급>`(보관함 낱개는 뒤에 `#번호`). */
  readonly id: string;
  readonly name: string;
  readonly kind: GearKind;
  readonly grade: GearGrade;
  readonly named: boolean;
  /** 레벨에 따라 오르는 기본 능력(무기·방어구). */
  readonly main?: { stat: GearStat; base: number; max: number };
  /** 레벨과 무관한 고정 능력(보조 능력·보조구). */
  readonly bonus?: Partial<Record<GearStat, number>>;
  /** 전투 특성(`gear:*`)과 수치. */
  readonly traits?: ReadonlyArray<readonly [string, number]>;
  /** 이 계통만 장착(보조구 예외 · 사신보옥). */
  readonly only?: readonly GearGroup[];
  /** 상점 값(고유 보물은 0 · 팔 수 없다). */
  readonly price: number;
}
export const SHOP_MAX_LEVEL = 3;
export const NAMED_MAX_LEVEL = 9;
export const maxLevelOf = (d: Pick<GearDef, "named" | "kind">) => GEAR_KINDS[d.kind].slot === "accessory" ? 1 : d.named ? NAMED_MAX_LEVEL : SHOP_MAX_LEVEL;

/** 무기·방어구 종류의 주 능력과 기준 배율. */
const MAIN: Partial<Record<GearKind, { stat: GearStat; scale: number }>> = {
  sword: { stat: "attack", scale: 1 }, spear: { stat: "attack", scale: 1.1 }, bow: { stat: "attack", scale: 0.9 }, club: { stat: "attack", scale: 0.9 }, catapult: { stat: "attack", scale: 1 },
  // 조조전의 '정신력'(책략 위력)에 해당하는 이 게임의 능력은 책략력(지력)이다.
  fan: { stat: "intellect", scale: 1 }, sacredSword: { stat: "intellect", scale: 0.9 },
  armor: { stat: "defense", scale: 1 }, robe: { stat: "defense", scale: 0.75 },
};
/** 기준 수치(검·갑옷 1레벨)와 레벨당 상승치. 등급 1~4. */
const WEAPON_BASE = [3, 6, 9, 12], WEAPON_STEP = [2, 3, 4, 5];
const ARMOR_BASE = [2, 4, 7, 10], ARMOR_STEP = [1, 2, 3, 4];
function shopMain(kind: GearKind, grade: GearGrade): { stat: GearStat; base: number; step: number } | undefined {
  const m = MAIN[kind];
  if (!m) return undefined;
  const armor = GEAR_KINDS[kind].slot === "armor", i = grade - 1;
  return { stat: m.stat, base: Math.round((armor ? ARMOR_BASE : WEAPON_BASE)[i]! * m.scale), step: Math.max(1, Math.round((armor ? ARMOR_STEP : WEAPON_STEP)[i]! * m.scale)) };
}
/** 상점 장비의 이름(종류 × 등급). */
export const SHOP_NAMES: Readonly<Record<string, readonly [string, string, string, string]>> = {
  sword: ["단검", "대검", "강검", "백련검"], spear: ["단창", "장창", "강창", "백련창"], bow: ["단궁", "대궁", "철궁", "강궁"],
  club: ["나무곤봉", "구리곤봉", "철곤봉", "강철곤봉"], catapult: ["나무투석기", "구리투석기", "철투석기", "강철투석기"],
  fan: ["죽선", "군선", "철선", "금선"], sacredSword: ["돌보검", "구리보검", "철보검", "강철보검"],
  armor: ["가죽갑옷", "구리갑옷", "철갑옷", "강철갑옷"], robe: ["무명옷", "가죽옷", "전투복", "장수전포"],
  shield: ["가죽방패", "구리방패", "철방패", "강철방패"], helmet: ["가죽투구", "구리투구", "강철투구", "금투구"],
  hood: ["복건", "관건", "윤건", "화양건"], gloves: ["무명장갑", "가죽장갑", "철장갑", "강철장갑"],
  barding: ["가죽기마갑옷", "구리기마갑옷", "철기마갑옷", "강철기마갑옷"],
};
const ACC_VALUES: Partial<Record<GearKind, readonly number[]>> = {
  shield: [10, 15, 18, 20], gloves: [10, 15, 18, 20], barding: [30, 50, 60, 70], helmet: [10, 20, 30, 40], hood: [8, 12, 16, 20],
};
const PRICES = { main: [200, 600, 1500, 3200], acc: [300, 800, 1800, 3600], barding: [400, 1000, 2200, 4200] };
function shopDef(kind: GearKind, grade: GearGrade): GearDef {
  const id = `shop:${kind}:${grade}`, name = SHOP_NAMES[kind]![grade - 1]!, m = shopMain(kind, grade), v = ACC_VALUES[kind]?.[grade - 1] ?? 0;
  const price = (kind === "barding" ? PRICES.barding : m ? PRICES.main : PRICES.acc)[grade - 1]!;
  const base = { id, name, kind, grade, named: false, price };
  if (m) return { ...base, main: { stat: m.stat, base: m.base, max: m.base + m.step * (SHOP_MAX_LEVEL - 1) } };
  if (kind === "shield") return { ...base, traits: [["gear:shield", v]] };
  if (kind === "gloves") return { ...base, traits: [["gear:accuracy", v]] };
  if (kind === "barding") return { ...base, traits: [["gear:barding", v]], only: ["cav", "horseArcher"] };
  if (kind === "helmet") return { ...base, bonus: { maxHp: v } };
  return { ...base, bonus: { maxMp: v } };
}
export const SHOP_GEAR: readonly GearDef[] = SHOP_KINDS.flatMap((k) => ([1, 2, 3, 4] as const).map((g) => shopDef(k, g)));

/** 고유 보물의 기본 능력: 같은 등급 상점 장비 1레벨의 90%에서 시작해, 9레벨에 상점 3레벨의 110%가 된다. */
function namedMain(kind: GearKind, grade: GearGrade): GearDef["main"] {
  const m = shopMain(kind, grade);
  if (!m) return undefined;
  return { stat: m.stat, base: Math.max(1, Math.round(m.base * 0.9)), max: Math.round((m.base + m.step * (SHOP_MAX_LEVEL - 1)) * 1.1) };
}
type NamedRow = readonly [id: string, name: string, kind: GearKind, grade: GearGrade, traits: ReadonlyArray<readonly [string, number]>, bonus?: Partial<Record<GearStat, number>> | undefined, only?: readonly GearGroup[]];
/** 고유 보물 50점(번호 순). id는 예전 저장의 보물 id를 그대로 쓴다. */
const NAMED_ROWS: readonly NamedRow[] = [
  ["doubleSwords", "자웅일대검", "sword", 3, [["gear:reCounter", 75]]],
  ["qinggang", "청공검", "sword", 4, [["gear:cavalryBane", 50]]],
  ["yitian", "의천검", "sword", 4, [["gear:yitian", 15]]],
  ["ancientBlade", "고정도", "sword", 3, [], { agility: 6 }],
  ["greenDragon", "청룡언월도", "spear", 4, [["gear:noCounter", 1]]],
  ["serpentSpear", "사모", "spear", 4, [["gear:pierceLine", 1]]],
  ["halberd", "방천화극", "spear", 4, [["gear:chase", 1]]],
  ["lubuBow", "여포궁", "bow", 4, [["gear:immobilize", 1]]],
  ["hornBowSmall", "이광궁", "bow", 3, [["gear:sealShot", 1]]],
  ["meteorHammer", "유성추", "club", 3, [["gear:confuse", 1]]],
  ["twinWhips", "쌍편", "club", 3, [["gear:reCounter", 75]]],
  ["goldFireCannon", "금화관포", "catapult", 3, [["gear:poison", 1]]],
  ["plantainFan", "파초선", "fan", 2, [["gear:windPower", 20]]],
  ["fiveFireFan", "오화신염선", "fan", 3, [["gear:firePower", 20]]],
  ["fan", "백우선", "fan", 4, [["gear:mpHalf", 1]]],
  ["sevenstar", "칠성검", "sacredSword", 2, [["gear:stratAccuracy", 15]]],
  ["sageSword", "성자보검", "sacredSword", 3, [], { maxMp: 20 }],
  ["mirrorArmor", "거울갑옷", "armor", 4, [["gear:indirectGuard", 1]]],
  ["goldArmor", "황금갑옷", "armor", 3, [["gear:critGuard", 1]]],
  ["linkedArmor", "연환갑옷", "armor", 2, [["gear:chainGuard", 1]]],
  ["silverarmor", "백은갑옷", "armor", 3, [["gear:stratHalf", 50]]],
  ["dragonArmor", "용린갑옷", "armor", 4, [["gear:mpShield", 1]]],
  ["dragonGi", "비룡도복", "robe", 2, [], { agility: 5 }],
  ["craneRobe", "학창", "robe", 3, [], { spirit: 6 }],
  ["darkRobe", "칠흑도복", "robe", 3, [], { maxMp: 15 }],
  ["phoenixRobe", "봉황깃옷", "robe", 4, [["gear:regen20", 20]]],
  ["silverShield", "백은방패", "shield", 2, [["gear:stratEvade", 15]]],
  ["windGodShield", "풍신방패", "shield", 4, [["gear:windGod", 15]]],
  ["windWheel", "바람바퀴", "wheel", 3, [], { movement: 2 }, ["siege"]],
  ["yellowHorse", "조황비전", "horse", 4, [], { movement: 2 }],
  ["shadowHorse", "절영", "horse", 3, [], { movement: 1 }],
  ["redHare", "적토마", "horse", 4, [["gear:passEnemies", 1]]],
  ["dilu", "적로", "horse", 3, [["gear:rough", 1]]],
  ["ironHelm", "철투구", "helmet", 2, [], { maxHp: 45 }, ["foot"]],
  ["zhugeTurban", "제갈건", "hood", 3, [], { maxMp: 25 }],
  ["noFeatherDart", "몰우전", "stone", 3, [["gear:sling", 2]], undefined, ["bandit"]],
  ["sunzi", "손자병법서", "book", 3, [["gear:sunzi", 10]]],
  ["mengde", "맹덕신서", "book", 4, [["gear:mengde", 50]]],
  ["qingshu", "청낭서", "book", 4, [["gear:regen20", 20]]],
  ["taiping", "태평청령서", "book", 2, [["gear:cleanse", 1]]],
  ["taipingYaoshu", "태평요술서", "book", 4, [["gear:manaTen", 10]]],
  ["dunjia", "둔갑천서", "book", 4, [["gear:mimic", 1]]],
  ["sixTeachings", "육도", "book", 2, [["gear:weaponDrill", 3]]],
  ["threeStrategies", "삼략", "book", 2, [["gear:armorDrill", 3]]],
  ["beanBag", "콩주머니", "pouch", 2, [["gear:beanBag", 1]]],
  ["seal", "옥새", "seal", 4, [["gear:sureCrit", 1]]],
  ["azureJewel", "청룡보옥", "jewel", 4, [["gear:jewelAzure", 1]], undefined, ["mountedStrategist"]],
  ["vermilionJewel", "주작보옥", "jewel", 4, [["gear:jewelVermilion", 1]], undefined, ["strategist"]],
  ["blackTortoiseJewel", "현무보옥", "jewel", 4, [["gear:jewelTortoise", 1]], undefined, ["taoist"]],
  ["whiteTigerJewel", "백호보옥", "jewel", 4, [["gear:jewelTiger", 1]], undefined, ["fengshui"]],
];
export const NAMED_GEAR: readonly GearDef[] = NAMED_ROWS.map(([id, name, kind, grade, traits, bonus, only]) => {
  const main = namedMain(kind, grade);
  return { id, name, kind, grade, named: true, price: 0, traits, ...(main ? { main } : {}), ...(bonus ? { bonus } : {}), ...(only ? { only } : {}) };
});
const BY_ID = new Map<string, GearDef>([...NAMED_GEAR, ...SHOP_GEAR].map((d) => [d.id, d]));

/** 보관함의 낱개 id(`shop:sword:2#5`)에서 정의 id를 뗀다. */
export const gearBaseId = (id: string) => id.replace(/#\d+$/, "");
export function gearDef(id: string): GearDef | undefined {
  return BY_ID.get(gearBaseId(id));
}
export const isShopGear = (id: string) => id.startsWith("shop:");
export function gearSlotOf(id: string): GearSlot | undefined {
  const d = gearDef(id);
  return d ? GEAR_KINDS[d.kind].slot : undefined;
}

/**
 * 고유 보물 단련 단계(규칙판 14 · 2026-10-17): 레벨이 오르면 주 능력만 오르던 것을 단계로 나눴다.
 * Lv.4 「단련」 고정 보너스 ×1.5 · Lv.7 「숙련」 고유 기능 수치 ×1.25 · Lv.9 「각성」 주 능력 +20%.
 */
export const GEAR_MILESTONES = [
  { level: 4, name: "단련", text: "고정 보너스 ×1.5" },
  { level: 7, name: "숙련", text: "고유 기능 수치 ×1.25" },
  { level: 9, name: "각성", text: "주 능력 +20%" },
] as const;
export function gearMilestone(def: Pick<GearDef, "named">, level: number) {
  const on = (n: number) => !!def.named && level >= n;
  return { bonusMul: on(4) ? 1.5 : 1, traitMul: on(7) ? 1.25 : 1, mainMul: on(9) ? 1.2 : 1 };
}
/** 레벨에 맞는 능력 보너스(주 능력 + 고정 보너스). structured: 단련 단계(GEAR_MILESTONES)를 더한다. */
export function gearStats(def: GearDef, level = 1, structured = false): Partial<Record<GearStat, number>> {
  const m = structured ? gearMilestone(def, level) : { bonusMul: 1, mainMul: 1 };
  const out: Partial<Record<GearStat, number>> = {};
  for (const [k, v] of Object.entries(def.bonus ?? {}) as Array<[GearStat, number]>) out[k] = Math.round(v * m.bonusMul);
  if (def.main) {
    const top = maxLevelOf(def), l = Math.max(1, Math.min(top, Math.floor(level)));
    const v = top <= 1 ? def.main.base : Math.round(def.main.base + (def.main.max - def.main.base) * (l - 1) / (top - 1));
    out[def.main.stat] = (out[def.main.stat] ?? 0) + Math.round(v * m.mainMul);
  }
  return out;
}

// ─────────────────────────────────────────────────────────── 장비 레벨(단련)

/** 그 레벨이 되는 누적 장비 경험치. 상점 장비는 2·3레벨, 고유 보물은 2~9레벨. */
const SHOP_EXP = [0, 30, 80];
const NAMED_EXP = [0, 20, 50, 90, 140, 200, 270, 350, 440];
export function gearLevelFromExp(def: Pick<GearDef, "named" | "kind">, exp: number): number {
  const top = maxLevelOf(def);
  if (top <= 1) return 1;
  const table = def.named ? NAMED_EXP : SHOP_EXP;
  let level = 1;
  for (let l = 2; l <= top; l++) if (exp >= table[l - 1]!) level = l;
  return level;
}
/** 다음 레벨까지 필요한 누적 경험치(만렙이면 undefined). */
export function gearNextExp(def: Pick<GearDef, "named" | "kind">, exp: number): number | undefined {
  const level = gearLevelFromExp(def, exp), top = maxLevelOf(def);
  if (level >= top) return undefined;
  return (def.named ? NAMED_EXP : SHOP_EXP)[level]!;
}

// ─────────────────────────────────────────────────────────── 장착 제한

const WEAPON_USERS: Readonly<Record<WeaponKind, string>> = {
  sword: "군주·보병·적병·해적계", spear: "기병·창병계", bow: "궁병·노병·궁기병계", club: "무도가·무희계·맹수류",
  catapult: "포차계", fan: "책사·기마책사·주술사계", sacredSword: "도사·풍수사·무녀계",
};
/** 이 병종이 이 장비를 달 수 있는가. 못 달면 이유(「기병계만」 꼴). */
export function gearAllowed(id: string, unitClass: UnitClass): { ok: boolean; reason?: string } {
  const def = gearDef(id);
  if (!def) return { ok: false, reason: "알 수 없는 장비" };
  const group = gearGroupOf(unitClass), slot = GEAR_KINDS[def.kind].slot, gear = GROUP_GEAR[group];
  if (def.only && !def.only.includes(group)) return { ok: false, reason: def.only.map((g) => GROUP_NAMES[g]).join("·") + "만" };
  if (slot === "weapon" && gear.weapon !== def.kind) return { ok: false, reason: WEAPON_USERS[def.kind as WeaponKind] + "만" };
  if (slot === "armor" && gear.armor !== def.kind) return { ok: false, reason: def.kind === "armor" ? "갑옷 입는 계통만" : "옷 입는 계통만" };
  if (def.kind === "helmet" && gear.armor !== "armor") return { ok: false, reason: "갑옷 입는 계통만" };
  if (def.kind === "hood" && gear.armor !== "robe") return { ok: false, reason: "옷 입는 계통만" };
  return { ok: true };
}
/** 이 계통이 쓰는 같은 칸·등급의 상점 장비(옛 보물을 바꿔 줄 때). 보조구는 장갑. */
export function shopEquivalent(slot: GearSlot, grade: GearGrade, unitClass?: UnitClass): string {
  const g = unitClass ? GROUP_GEAR[gearGroupOf(unitClass)] : undefined;
  const kind: GearKind = slot === "weapon" ? g?.weapon ?? "sword" : slot === "armor" ? g?.armor ?? "armor" : "gloves";
  return `shop:${kind}:${grade}`;
}

// ─────────────────────────────────────────────────────────── 소모품

export type ConsumableId = "bean" | "rice" | "peach" | "water" | "wine" | "antidote" | "awaken" | "salve" | "gargle" | "panacea" | "promotion";
export interface ConsumableDef {
  readonly id: ConsumableId;
  readonly name: string;
  /** 체력 회복(-1이면 전부) */
  readonly hp?: number;
  readonly mp?: number;
  /** 풀어 주는 상태(all이면 나쁜 상태 전부) */
  readonly cures?: readonly string[] | "all";
  /** 자신에게는 못 쓴다(각성약: 혼란에 빠진 장수는 스스로 움직이지 못한다) */
  readonly othersOnly?: boolean;
  /** 병종 한 단계 승급 */
  readonly promote?: boolean;
  /** 상점 값(0이면 팔지 않는다 · 줍거나 보상으로만). */
  readonly price: number;
}
export const CONSUMABLES: readonly ConsumableDef[] = [
  { id: "bean", name: "회복의 콩", hp: 40, price: 50 },
  { id: "rice", name: "회복의 쌀", hp: 100, price: 150 },
  { id: "peach", name: "회복의 복숭아", hp: -1, price: 0 },
  { id: "water", name: "신비로운 물", mp: 20, price: 80 },
  { id: "wine", name: "신비로운 술", mp: 50, price: 0 },
  { id: "antidote", name: "해독약", cures: ["bleed"], price: 30 },
  { id: "awaken", name: "각성약", cures: ["confusion"], othersOnly: true, price: 30 },
  { id: "salve", name: "도포약", cures: ["immobile", "bound"], price: 30 },
  { id: "gargle", name: "양치약", cures: ["seal"], price: 30 },
  { id: "panacea", name: "만능약", cures: "all", price: 150 },
  { id: "promotion", name: "인수", promote: true, price: 6000 },
];
export function consumable(id: string): ConsumableDef | undefined {
  return CONSUMABLES.find((c) => c.id === id);
}
