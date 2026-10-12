/**
 * 장비의 전투 특성(`gear:*`) — 고유 보물 50점의 고유 기능과 상점 보조구(방패·장갑·기마갑옷)의 효과.
 *
 * 피해 파이프라인 훅으로 되는 것은 여기서 정하고, 타격 순서를 바꾸는 기능(재반격·관통·인도 공격·MP 방어·
 * 자동 콩·책략 모방·통과 이동)은 표식만 두고 battle.ts·grid.ts·state.ts가 읽는다. 적 부대도 같은 규칙을 따른다.
 */
import { defineTrait, combine, type DamageContext } from "./traits.ts";
import type { Unit, StatusKind } from "./types.ts";
import { gearDef, gearGroupOf, type GearGroup } from "./equipment.ts";

/** 간접 공격을 하는 계통(활·노·궁기병·투석기). */
const INDIRECT: ReadonlySet<GearGroup> = new Set(["archer", "crossbow", "horseArcher", "siege"]);
export const isIndirectAttack = (ctx: Pick<DamageContext, "attacker" | "distance">) => INDIRECT.has(gearGroupOf(ctx.attacker.unitClass)) || ctx.distance >= 2;
/** 나쁜 상태(태평청령서·만능약이 푼다). */
export const BAD_STATUS: ReadonlySet<StatusKind> = new Set<StatusKind>(["confusion", "immobile", "bound", "bleed", "burn", "shock", "seal", "weaken", "breach", "slow", "sluggish", "dispirit"]);
/** 맞히면 반드시 거는 상태(여포궁·이광궁·유성추·금화관포). */
export const ON_HIT_STATUS: Readonly<Record<string, StatusKind>> = { "gear:immobilize": "immobile", "gear:sealShot": "seal", "gear:confuse": "confusion", "gear:poison": "bleed" };
const has = (u: Unit, id: string) => u.traits.includes(id);
const marker = (id: string, name: string, description: string) => defineTrait({ id, name, description, hooks: {} });

marker("gear:reCounter", "재반격", "내 공격에 상대가 반격하면 한 번 더 반격한다(위력 param%).");
defineTrait({ id: "gear:cavalryBane", name: "기병 특효", description: "기병계 적에게 주는 물리 피해가 param% 늘어난다(군주·궁기병·기마책사 제외).", hooks: {
  onAttack(ctx, _s, p) { if (ctx.kind === "physical" && gearGroupOf(ctx.defender.unitClass) === "cav") ctx.attackMul *= 1 + p / 100; } } });
// 물리 회피: 의천검과 상점 방패는 겹치지 않는다(큰 쪽만). 풍신방패는 따로 더해진다.
defineTrait({ id: "gear:yitian", name: "물리 회피", description: "물리 공격을 param% 더 피한다(방패의 물리 회피와 겹치지 않는다).", hooks: {
  onDefend(ctx, self, p) { if (ctx.kind === "physical" && (self.traitParams["gear:shield"] ?? 0) <= p) ctx.accuracyMod -= p; } } });
defineTrait({ id: "gear:shield", name: "방패", description: "물리 공격을 param% 더 피한다.", hooks: {
  onDefend(ctx, self, p) { if (ctx.kind === "physical" && !(has(self, "gear:yitian") && (self.traitParams["gear:yitian"] ?? 0) >= p)) ctx.accuracyMod -= p; } } });
defineTrait({ id: "gear:windGod", name: "풍신의 막이", description: "물리 공격과 책략을 param% 더 피한다(아군의 지원 책략도 param% 빗나간다).", hooks: {
  onDefend(ctx, _s, p) { if (ctx.kind === "physical" || ctx.kind === "strategy") ctx.accuracyMod -= p; } } });
defineTrait({ id: "gear:stratEvade", name: "책략 회피", description: "책략을 param% 더 피한다(아군의 지원 책략도 param% 빗나간다).", hooks: {
  onDefend(ctx, _s, p) { if (ctx.kind === "strategy") ctx.accuracyMod -= p; } } });
defineTrait({ id: "gear:accuracy", name: "장갑", description: "물리 공격 명중이 param% 오른다.", hooks: {
  onAttack(ctx, _s, p) { if (ctx.kind === "physical") ctx.accuracyMod += p; } } });
defineTrait({ id: "gear:barding", name: "기마갑옷", description: "간접 공격(활·노·투석기, 두 칸 밖의 물리 공격)으로 받는 피해가 param% 줄어든다.", hooks: {
  onDefend(ctx, _s, p) { if (ctx.kind === "physical" && isIndirectAttack(ctx)) ctx.reduction = combine(ctx.reduction, p / 100); } } });
defineTrait({ id: "gear:noCounter", name: "무반격", description: "내 물리 공격에 상대가 반격하지 못한다.", hooks: {
  onAttack(ctx) { if (ctx.kind === "physical") ctx.suppressCounter = true; } } });
marker("gear:pierceLine", "관통", "맞힌 적 바로 뒤(같은 방향 한 칸)의 적도 함께 맞는다. 반격에도 적용된다.");
marker("gear:chase", "인도 공격", "적을 퇴각시키면 사거리 안의 다른 적 하나를 한 번 더 친다.");
marker("gear:immobilize", "부동 일격", "물리 공격이 맞으면 반드시 부동에 빠뜨린다.");
marker("gear:sealShot", "봉인 일격", "물리 공격이 맞으면 반드시 책략을 봉인한다.");
marker("gear:confuse", "혼란 일격", "물리 공격이 맞으면 반드시 혼란에 빠뜨린다.");
marker("gear:poison", "독 일격", "물리 공격이 맞으면 반드시 독(출혈)에 빠뜨린다.");
defineTrait({ id: "gear:windPower", name: "큰바람", description: "바람 책략의 위력이 param% 오른다.", hooks: {
  onAttack(ctx, _s, p) { if (ctx.kind === "strategy" && ctx.element === "wind") ctx.attackMul *= 1 + p / 100; } } });
defineTrait({ id: "gear:firePower", name: "불꽃", description: "불 책략의 위력이 param% 오른다.", hooks: {
  onAttack(ctx, _s, p) { if (ctx.kind === "strategy" && ctx.element === "fire") ctx.attackMul *= 1 + p / 100; } } });
marker("gear:mpHalf", "절반의 술법", "책략에 드는 MP가 절반(내림)이 된다.");
defineTrait({ id: "gear:stratAccuracy", name: "책략 명중", description: "책략 명중이 param% 오른다.", hooks: {
  onAttack(ctx, _s, p) { if (ctx.kind === "strategy") ctx.accuracyMod += p; } } });
defineTrait({ id: "gear:indirectGuard", name: "간접 방어", description: "활·노·궁기병·투석기의 일반 공격을 반드시 피한다(혼란 중에도).", hooks: {
  onDefend(ctx) { if (ctx.kind === "physical" && INDIRECT.has(gearGroupOf(ctx.attacker.unitClass))) ctx.forceMiss = true; } } });
defineTrait({ id: "gear:critGuard", name: "회심 방어", description: "회심의 일격을 받지 않는다.", hooks: {
  onDefend(ctx) { ctx.noCritical = true; } } });
defineTrait({ id: "gear:chainGuard", name: "연격 방어", description: "연속 공격·연속 반격의 두 번째 타격을 반드시 피한다.", hooks: {
  onDefend(ctx) { if (ctx.kind === "physical" && ctx.double) ctx.forceMiss = true; } } });
defineTrait({ id: "gear:stratHalf", name: "책략 반감", description: "책략으로 받는 피해가 param% 줄어든다.", hooks: {
  onDefend(ctx, _s, p) { if (ctx.kind === "strategy") ctx.reduction = combine(ctx.reduction, p / 100); } } });
marker("gear:mpShield", "MP 방어", "물리 피해를 체력 대신 MP로 받는다(MP가 모자라도 그 타격은 MP만 0이 된다). 책략에는 듣지 않는다.");
defineTrait({ id: "gear:regen20", name: "재생", description: "자기 차례 시작에 최대 체력의 param%를 회복한다(여럿 지녀도 한 번).", hooks: {
  onTurnStart(u, p) { if (u.hp < u.stats.maxHp) u.hp = Math.min(u.stats.maxHp, u.hp + Math.max(1, Math.round(u.stats.maxHp * p / 100))); } } });
marker("gear:passEnemies", "돌격 이동", "적이 선 칸을 지나갈 수 있다(멈추지는 못한다). 적의 이동 방해를 받지 않는다.");
defineTrait({ id: "gear:rough", name: "험로 이동", description: "지나갈 수 있는 모든 지형의 이동 소모가 1이 된다.", hooks: { ignoresRoughTerrain: true } });
marker("gear:sling", "돌팔매", "공격 사거리가 상하좌우 두 칸까지 늘어난다.");
marker("gear:sunzi", "병법의 깨달음", "자기 차례마다 경험치를 param 얻는다.");
marker("gear:mengde", "용병의 지혜", "얻는 경험치와 장비 경험치가 param% 늘어난다.");
defineTrait({ id: "gear:cleanse", name: "청령", description: "자기 차례 시작에 나쁜 상태를 모두 푼다.", hooks: {
  onTurnStart(u) { u.statuses = u.statuses.filter((s) => !BAD_STATUS.has(s.kind)); } } });
defineTrait({ id: "gear:manaTen", name: "요술의 샘", description: "자기 차례 시작에 MP를 param 회복한다.", hooks: {
  onTurnStart(u, p) { u.mp = Math.min(u.stats.maxMp, u.mp + p); } } });
marker("gear:mimic", "책략 모방", "상하좌우로 붙은 부대(아군·적군)가 쓰는 책략을 쓸 수 있다(사신 책략은 보옥이 있어야).");
marker("gear:weaponDrill", "무기 단련", "자기 차례마다 무기 경험치를 param 얻는다.");
marker("gear:armorDrill", "방어구 단련", "자기 차례마다 방어구 경험치를 param 얻는다.");
marker("gear:beanBag", "콩주머니", "피해를 받으면 보관함의 회복의 콩을 저절로 써서 체력을 회복한다(콩이 있을 때만).");
defineTrait({ id: "gear:sureCrit", name: "옥새의 위엄", description: "물리 공격이 반드시 회심의 일격이 된다.", hooks: {
  onAttack(ctx) { if (ctx.kind === "physical") ctx.sureCritical = true; } } });
marker("gear:jewelAzure", "청룡의 부름", "책략 「청룡」을 쓸 수 있다(기마책사계).");
marker("gear:jewelVermilion", "주작의 부름", "책략 「주작」을 쓸 수 있다(책사계).");
marker("gear:jewelTortoise", "현무의 부름", "책략 「현무」를 쓸 수 있다(도사계).");
marker("gear:jewelTiger", "백호의 부름", "책략 「백호」를 쓸 수 있다(풍수사계).");

/** 사신 책략 id → 그 책략을 여는 보옥 특성. */
export const JEWEL_STRATEGIES: Readonly<Record<string, string>> = { jewelAzure: "gear:jewelAzure", jewelVermilion: "gear:jewelVermilion", jewelTortoise: "gear:jewelTortoise", jewelTiger: "gear:jewelTiger" };

/** 장비 하나의 고유 기능 설명(능력치 밖). 없으면 빈 글. */
export function gearPowerText(id: string): string {
  const d = gearDef(id);
  if (!d?.traits?.length) return "";
  return d.traits.map(([t, p]) => {
    switch (t) {
      case "gear:reCounter": return `재반격 · 상대가 반격하면 한 번 더 반격(위력 ${p}%)`;
      case "gear:cavalryBane": return `기병 특효 · 기병계에게 피해 +${p}%`;
      case "gear:yitian": return `물리 회피 +${p}% (방패와 겹치지 않음)`;
      case "gear:shield": return `물리 회피 +${p}%`;
      case "gear:windGod": return `물리·책략 회피 +${p}% (아군 지원 책략도 ${p}% 빗나감)`;
      case "gear:stratEvade": return `책략 회피 +${p}% (아군 지원 책략도 ${p}% 빗나감)`;
      case "gear:accuracy": return `물리 명중 +${p}%`;
      case "gear:barding": return `간접 공격 피해 -${p}%`;
      case "gear:noCounter": return "무반격 · 내 공격에 상대가 반격하지 못함";
      case "gear:pierceLine": return "관통 · 맞힌 적 바로 뒤의 적도 함께 맞음(반격 포함)";
      case "gear:chase": return "인도 공격 · 적을 퇴각시키면 사거리 안 다른 적을 한 번 더 공격";
      case "gear:immobilize": return "맞히면 반드시 부동";
      case "gear:sealShot": return "맞히면 반드시 책략 봉인";
      case "gear:confuse": return "맞히면 반드시 혼란";
      case "gear:poison": return "맞힌 대상을 반드시 독(출혈)에 빠뜨림";
      case "gear:windPower": return `바람 책략 위력 +${p}%`;
      case "gear:firePower": return `불 책략 위력 +${p}%`;
      case "gear:mpHalf": return "책략 MP 소모 절반(내림)";
      case "gear:stratAccuracy": return `책략 명중 +${p}%`;
      case "gear:indirectGuard": return "간접 방어 · 활·노·궁기병·투석기 공격을 반드시 회피";
      case "gear:critGuard": return "회심 방어 · 회심의 일격을 받지 않음";
      case "gear:chainGuard": return "연격 방어 · 연속 공격·반격의 두 번째 타격을 반드시 회피";
      case "gear:stratHalf": return `책략 피해 ${p}% 감소`;
      case "gear:mpShield": return "MP 방어 · 물리 피해를 체력 대신 MP로 받음";
      case "gear:regen20": return `자기 차례마다 최대 체력 ${p}% 회복(청낭서·봉황깃옷은 겹치지 않음)`;
      case "gear:passEnemies": return "돌격 이동 · 적이 선 칸을 지나갈 수 있음";
      case "gear:rough": return "험로 이동 · 모든 지형 이동 소모 1";
      case "gear:sling": return `공격 사거리 상하좌우 ${p}칸`;
      case "gear:sunzi": return `자기 차례마다 경험치 +${p}`;
      case "gear:mengde": return `얻는 경험치·장비 경험치 ${1 + p / 100}배`;
      case "gear:cleanse": return "자기 차례마다 나쁜 상태 회복";
      case "gear:manaTen": return `자기 차례마다 MP +${p}`;
      case "gear:mimic": return "책략 모방 · 붙어 있는 부대의 책략을 쓸 수 있음";
      case "gear:weaponDrill": return `자기 차례마다 무기 경험치 +${p}`;
      case "gear:armorDrill": return `자기 차례마다 방어구 경험치 +${p}`;
      case "gear:beanBag": return "피해를 받으면 회복의 콩을 저절로 씀";
      case "gear:sureCrit": return "물리 공격이 반드시 회심";
      case "gear:jewelAzure": return "책략 「청룡」 사용(기마책사계)";
      case "gear:jewelVermilion": return "책략 「주작」 사용(책사계)";
      case "gear:jewelTortoise": return "책략 「현무」 사용(도사계)";
      case "gear:jewelTiger": return "책략 「백호」 사용(풍수사계)";
      default: return "";
    }
  }).filter(Boolean).join(" · ");
}
