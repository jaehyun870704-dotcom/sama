/**
 * 이름있는 장수 고유특성 묶음 A: 장수마다 셋(첫째는 처음부터 · 둘째는 2차 병종 진화 · 셋째는 3차 병종 진화에서 열린다).
 * 수치는 병종 단계에 따라 커진다(sigMul: ×1 · ×1.3 · ×1.6 · ×2). 조각은 signature-kit.ts에서 가져온다.
 * 사마씨 일가·조씨 종실과 조상 일파·위의 신하들, 북벌 전장, 오의 장수들, 요동·원씨·오환·남만, 초한의 우희·용저·조참·관영.
 */
import type { Unit, StatusKind } from "./types.ts";
import { combine } from "./traits.ts";
import { engageDistance } from "./reach.ts";
import type { Signature } from "./signature-kit.ts";
import { sig2, T, N, P, atk, def, crit, aim, dodge, pierce, turn, both, give, heal, cleanse, once, around, near, onTerrain, fort, byWater, fire, phys, strat, hpRate, turnOf, mounted, ranged, foot, caster, isNamedOfficer } from "./signature-kit.ts";

/** 군주 계통(군주 → 패왕 → 제왕 → 천자) */
const LORDS = new Set<string>(["lord", "hegemon", "sovereign", "sonOfHeaven"]);
const lordish = (u: Unit) => LORDS.has(u.unitClass);
const within = (a: Unit, b: Unit, r: number) => engageDistance(a.pos, b.pos) <= r;
const has = (u: Unit, ...k: StatusKind[]) => u.statuses.some((s) => k.includes(s.kind));
const addMp = (u: Unit, n: number) => { u.mp = Math.min(u.stats.maxMp, u.mp + n); };
const full = (u: Unit) => u.hp >= u.stats.maxHp;
/** 받는 피해를 k배로 늘린다(약점). */
const takeMore = (ctx: { reduction: number }, k: number) => { ctx.reduction = 1 - (1 - ctx.reduction) * k; };

const SET: Record<string, [Signature, Signature, Signature]> = {
  // ── 사마씨 일가
  사마랑: [
    sig2("병사를 돌본 자사", (t) => `자기 차례마다 자신과 2칸 안 아군의 출혈·화상을 풀고, 그중 체력이 가장 낮은 하나를 ${T(t, 6)}% 회복한다.`,
      turn((u, p) => { const xs = [u, ...around(u, 2, "friend")]; for (const a of xs) cleanse(a, ["bleed", "burn"]); const a = xs.filter((x) => x.hp < x.stats.maxHp).sort((x, y) => hpRate(x) - hpRate(y))[0]; if (a) heal(a, P(6, p)); })),
    sig2("단정한 몸가짐", (t) => `받는 책략 피해 ${T(t, 12)}% 감소. 자기 차례마다 자신의 혼란·낙담을 푼다.`,
      both(def(12, (c) => strat(c)), turn((u) => cleanse(u, ["confusion", "dispirit"])))),
    sig2("진중에서 거둔 숨", (t) => `체력이 30% 이하로 떨어지면 자기 차례에 2칸 안 아군 모두의 체력을 ${T(t, 15)}% 회복한다(전투당 한 번).`,
      turn((u, p) => { if (hpRate(u) <= .3 && once(u, "사마랑:숨")) for (const a of around(u, 2, "friend")) heal(a, P(15, p)); })),
  ],
  사마방: [
    sig2("사마씨의 가장", (t) => `2칸 안의 사마씨 아군 장수가 받는 피해 ${T(t, 10)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (ctx.defender.name.startsWith("사마") && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(10, p)); } }),
    sig2("북부위 천거", (t) => `2칸 안 이름있는 아군 장수의 명중 +${T(t, 8)}%p.`,
      { onAllyAttack(ctx, h, p) { if (isNamedOfficer(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.accuracyMod += N(8, p); } }),
    sig2("엄부의 훈도", (t) => `받는 물리 피해 ${T(t, 8)}% 감소. 자기 차례마다 곁에 붙은 아군의 혼란·낙담을 풀고 사기를 북돋운다.`,
      both(def(8, (c) => phys(c)), turn((u) => { for (const a of around(u, 1, "friend")) { cleanse(a, ["confusion", "dispirit"]); give(u, a, "rally", 1); } }))),
  ],
  // ── 조씨 종실과 조상 일파
  조휴: [
    sig2("우리 집안의 천리마", (t) => `전투 첫 턴에 이동력 +2. 이번 차례 3칸 이상 움직였으면 물리 피해 ${T(t, 15)}% 증가.`,
      both(turn((u) => { if (turnOf(u) === 1) give(u, u, "haste", 1, 2); }), atk(15, (c, s) => phys(c) && (s.movedSteps ?? 0) >= 3))),
    sig2("조씨 일족의 기병", (t) => `곁에 붙은 아군 기병이 있으면 주는 피해 ${T(t, 12)}% 증가.`,
      atk(12, (_c, s) => around(s, 1, "friend").some(mounted))),
    sig2("석정의 부끄러움", (t) => `체력 절반 이하에서 물리 공격이 방어 ${T(t, 20)}% 무시.`,
      pierce(20, (c, s) => phys(c) && hpRate(s) <= .5)),
  ],
  조상: [
    sig2("대장군의 위세", (t) => `2칸 안 아군이 셋 이상이면 주는 피해 ${T(t, 15)}% 증가.`,
      atk(15, (_c, s) => around(s, 2, "friend").length >= 3)),
    sig2("흥세에서 물러나다", (t) => `체력 절반 이하에서 받는 피해 ${T(t, 8)}% 감소, 자기 차례마다 이동력 +2.`,
      both(def(8, (_c, s) => hpRate(s) <= .5), turn((u) => { if (hpRate(u) <= .5) give(u, u, "haste", 1, 2); }))),
    sig2("부잣집 늙은이의 꿈", (t) => `곁에 붙은 적이 없으면 자기 차례마다 체력 ${T(t, 6)}% 회복.`,
      turn((u, p) => { if (!around(u, 1, "foe").length) heal(u, P(6, p)); })),
  ],
  환범: [
    sig2("꾀주머니", (t) => `MP가 가득할 때 책략 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c, s) => strat(c) && s.stats.maxMp > 0 && s.mp >= s.stats.maxMp)),
    sig2("대사농의 인장", (t) => `자기 차례마다 3칸 안에서 체력이 가장 낮은 아군 하나의 체력 ${T(t, 8)}%와 MP 2를 채운다.`,
      turn((u, p) => { const a = [u, ...around(u, 3, "friend")].sort((x, y) => hpRate(x) - hpRate(y))[0]; if (a) { heal(a, P(8, p)); addMp(a, 2); } })),
    sig2("허창으로 가자는 진언", () => `전투 첫 두 턴 동안 자기 차례마다 3칸 안 아군 모두 이동력 +1.`,
      turn((u) => { if (turnOf(u) <= 2) for (const a of [u, ...around(u, 3, "friend")]) give(u, a, "haste", 1, 1); })),
  ],
  하안: [
    sig2("분을 바른 듯한 얼굴", (t) => `자신의 체력이 가득할 때 회피 +${T(t, 15)}%p.`,
      dodge(15, (_c, s) => full(s))),
    sig2("정시의 청담", (t) => `자기보다 지력이 낮은 적에게 책략 명중 +${T(t, 15)}%p.`,
      aim(15, (c, s) => strat(c) && c.defender.stats.intellect < s.stats.intellect)),
    sig2("이부상서", (t) => `2칸 안 아군 책사의 책략 피해 ${T(t, 12)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (strat(ctx) && caster(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(12, p); } }),
  ],
  조희: [
    sig2("금군을 거느리다", (t) => `2칸 안 아군 군주가 받는 피해 ${T(t, 15)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (lordish(ctx.defender) && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(15, p)); } }),
    sig2("형에게 지어 올린 글", (t) => `받는 책략 피해 ${T(t, 8)}% 감소. 자기 차례마다 3칸 안 아군 하나의 낙담·쇠약을 풀어 준다.`,
      both(def(8, (c) => strat(c)), turn((u) => { const a = around(u, 3, "friend").find((x) => has(x, "dispirit", "weaken")); if (a) cleanse(a, ["dispirit", "weaken"]); }))),
    sig2("낙수의 부교", (t) => `다리·여울 칸에서 받는 피해 ${T(t, 15)}% 감소, 주는 피해 10% 증가.`,
      both(def(15, (_c, s) => onTerrain(s, "bridge", "ford")), { onAttack(ctx, s) { if (onTerrain(s, "bridge", "ford")) ctx.attackMul *= 1.1; } })),
  ],
  조식: [
    sig2("재주 여덟 말", (t) => `상대보다 지력이 10 이상 높으면 책략 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => strat(c) && s.stats.intellect >= c.defender.stats.intellect + 10)),
    sig2("낙신부", (t) => `자기 차례마다 MP ${T(t, 4)} 회복하고 자신의 낙담·혼란을 푼다.`,
      turn((u, p) => { addMp(u, N(4, p)); cleanse(u, ["dispirit", "confusion"]); })),
    sig2("사마문을 달린 수레", (t) => `책략 피해 ${T(t, 22)}% 증가. 대신 책략 명중 10%p 감소.`,
      { onAttack(ctx, _s, p) { if (strat(ctx)) { ctx.attackMul *= 1 + P(22, p); ctx.accuracyMod -= 10; } } }),
  ],
  조예: [
    sig2("장수를 고루 쓰다", (t) => `2칸 안 이름있는 아군 장수가 받는 피해 ${T(t, 10)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (isNamedOfficer(ctx.defender) && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(10, p)); } }),
    sig2("요동 정벌의 칙명", (t) => `2칸 안 아군이 이름있는 적 장수에게 주는 피해 ${T(t, 10)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (isNamedOfficer(ctx.defender) && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(10, p); } }),
    sig2("궁궐을 높이 쌓다", (t) => `성채·성문 칸에서 받는 피해 ${T(t, 12)}% 감소. 그곳에 있으면 자기 차례마다 자신과 2칸 안 아군을 견고하게 한다.`,
      both(def(12, (_c, s) => fort(s)), turn((u) => { if (fort(u)) for (const a of [u, ...around(u, 2, "friend")]) give(u, a, "guard", 1); }))),
  ],
  // ── 위의 신하들
  왕릉: [
    sig2("사마씨를 근심하다", (t) => `사마씨 적 장수에게 주는 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => c.defender.name.startsWith("사마"))),
    sig2("태위의 군령", (t) => `2칸 안 아군 보병·창병의 물리 피해 ${T(t, 10)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (phys(ctx) && foot(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(10, p); } }),
    sig2("왕윤의 조카", (t) => `체력 30% 이하에서 이름있는 적 장수에게 주는 피해 ${T(t, 25)}% 증가.`,
      atk(25, (c, s) => hpRate(s) <= .3 && isNamedOfficer(c.defender))),
  ],
  대릉: [
    sig2("상규의 정병", (t) => `곁에 붙은 아군이 둘 이상이면 받는 물리 피해 ${T(t, 15)}% 감소.`,
      def(15, (c, s) => phys(c) && around(s, 1, "friend").length >= 2)),
    sig2("상규의 보리", (t) => `평지 칸에 있으면 자기 차례마다 체력 ${T(t, 5)}% 회복.`,
      turn((u, p) => { if (onTerrain(u, "plain")) heal(u, P(5, p)); })),
    sig2("정병 사천", (t) => `자기보다 레벨이 높은 적에게 받는 피해 ${T(t, 15)}% 감소.`,
      def(15, (c, s) => c.attacker.level > s.level)),
  ],
  진태: [
    sig2("적도의 포위를 풀다", () => `자기 차례마다 자신과 3칸 안 아군의 포박·부동·둔화를 풀어 준다.`,
      turn((u) => { for (const a of [u, ...around(u, 3, "friend")]) cleanse(a, ["bound", "immobile", "slow"]); })),
    sig2("높은 곳을 먼저 차지하다", (t) => `산지·구릉 칸에서 회심 확률 +${T(t, 15)}%p.`,
      crit(15, (_c, s) => onTerrain(s, "mountain", "hill"))),
    sig2("가충을 베어 사죄하라", (t) => `자기보다 레벨이 높은 이름있는 적 장수를 치면 방어 ${T(t, 25)}% 무시.`,
      pierce(25, (c, s) => isNamedOfficer(c.defender) && c.defender.level > s.level)),
  ],
  손례: [
    sig2("범을 막아선 칼", (t) => `자기보다 공격력이 높은 적에게 받는 물리 피해 ${T(t, 15)}% 감소.`,
      def(15, (c, s) => phys(c) && c.attacker.stats.attack > s.stats.attack)),
    sig2("맨손의 기백", (t) => `물리 피해 ${T(t, 8)}% 증가. 자기 차례마다 곁에 붙은 적 가운데 공격력이 가장 높은 하나를 쇠약하게 한다.`,
      both(atk(8, (c) => phys(c)), turn((u) => { const e = around(u, 1, "foe").sort((a, b) => b.stats.attack - a.stats.attack)[0]; if (e) give(u, e, "weaken", 2); }))),
    sig2("경계를 바로잡은 지도", (t) => `2칸 안 아군 기병이 받는 피해 ${T(t, 10)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (mounted(ctx.defender) && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(10, p)); } }),
  ],
  왕기: [
    sig2("남돈 선점", (t) => `전투 첫 턴에 이동력 +2. 성채·성문 칸에서 명중 +${T(t, 10)}%p.`,
      both(turn((u) => { if (turnOf(u) === 1) give(u, u, "haste", 1, 2); }), aim(10, (_c, s) => fort(s)))),
    sig2("반군의 발을 묶다", (t) => `둔화된 적에게 주는 피해 ${T(t, 12)}% 증가. 자기 차례마다 3칸 안에서 이동력이 가장 높은 적 하나를 둔화시킨다.`,
      both(atk(12, (c) => has(c.defender, "slow")), turn((u) => { const e = around(u, 3, "foe").sort((a, b) => b.stats.movement - a.stats.movement)[0]; if (e) give(u, e, "slow", 2); }))),
    sig2("수춘 포위", (t) => `두 칸 이상 떨어진 적을 치면 방어 ${T(t, 18)}% 무시.`,
      pierce(18, (c) => c.distance >= 2)),
  ],
  가규: [
    sig2("예주의 운하", (t) => `물가에 있으면 자기 차례마다 자신과 2칸 안 아군의 체력을 ${T(t, 4)}% 회복한다.`,
      turn((u, p) => { if (byWater(u)) for (const a of [u, ...around(u, 2, "friend")]) heal(a, P(4, p)); })),
    sig2("석정으로 달려가다", (t) => `곁에 적이 둘 이상 붙은 2칸 안 아군이 받는 피해 ${T(t, 15)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (within(h, ctx.defender, 2) && around(ctx.defender, 1, "foe").length >= 2) ctx.reduction = combine(ctx.reduction, P(15, p)); } }),
    sig2("말 위의 자사", (t) => `움직인 뒤 쓰는 책략 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => strat(c) && !!s.movedThisTurn)),
  ],
  // ── 촉·위 북벌 전장
  양앙: [
    sig2("양평관의 영채", (t) => `산지·구릉 칸에서 받는 물리 피해 ${T(t, 15)}% 감소.`,
      def(15, (c, s) => phys(c) && onTerrain(s, "mountain", "hill"))),
    sig2("산을 따라 쌓은 진", (t) => `곁에 붙은 아군 하나마다 받는 피해 ${T(t, 5)}% 감소(최대 셋).`,
      { onDefend(ctx, s, p) { const k = Math.min(3, around(s, 1, "friend").length); if (k) ctx.reduction = combine(ctx.reduction, k * P(5, p)); } }),
    sig2("관문을 내려 치다", (t) => `성채·성문 칸에서 곁에 붙은 적을 물리 공격하면 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c, s) => phys(c) && fort(s) && c.distance <= 1)),
  ],
  맹염: [
    sig2("무공수 동쪽의 진", (t) => `물가(물 칸 위나 옆)에서 기병에게 받는 피해 ${T(t, 20)}% 감소.`,
      def(20, (c, s) => mounted(c.attacker) && byWater(s))),
    sig2("승상이 놓은 다리", (t) => `2칸 안에 제갈량이 있으면 자기 차례마다 체력 ${T(t, 6)}% 회복.`,
      turn((u, p) => { if (near(u, "제갈량")) heal(u, P(6, p)); })),
    sig2("다리가 끊긴 진영", (t) => `3칸 안에 아군이 없으면 받는 피해 ${T(t, 15)}% 감소, 회피 +5%p.`,
      { onDefend(ctx, s, p) { if (!around(s, 3, "friend").length) { ctx.reduction = combine(ctx.reduction, P(15, p)); ctx.accuracyMod -= 5; } } }),
  ],
  // ── 오
  여범: [
    sig2("엄정한 출납", (t) => `자기 차례마다 3칸 안에서 MP 비율이 가장 낮은 아군 책사 하나의 MP를 ${T(t, 4)} 채운다.`,
      turn((u, p) => { const a = [u, ...around(u, 3, "friend")].filter(caster).sort((x, y) => x.mp / Math.max(1, x.stats.maxMp) - y.mp / Math.max(1, y.stats.maxMp))[0]; if (a) addMp(a, N(4, p)); })),
    sig2("강동 평정의 종군", (t) => `물 위나 물가에서 두 칸 이상 떨어진 적에게 명중 +${T(t, 12)}%p.`,
      aim(12, (c, s) => byWater(s) && c.distance >= 2)),
    sig2("받지 못한 인수", (t) => `2칸 안 아군 원거리 부대(궁병·노병 등)가 주는 피해 ${T(t, 10)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (ranged(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(10, p); } }),
  ],
  손소: [
    sig2("광릉의 강노", (t) => `이번 차례 움직이지 않았으면 두 칸 이상 떨어진 적에게 주는 피해 ${T(t, 15)}% 증가.`,
      atk(15, (c, s) => !s.movedThisTurn && c.distance >= 2)),
    sig2("적정을 꿰뚫다", (t) => `두 칸 이상 떨어진 적의 공격에 회피 +${T(t, 12)}%p.`,
      dodge(12, (c) => c.distance >= 2)),
    sig2("밤의 결사대", () => `자기 차례마다 3칸 안에서 공격력이 가장 높은 아군 하나에게 강행(이동력 +2)과 사기를 건다.`,
      turn((u) => { const a = around(u, 3, "friend").sort((x, y) => y.stats.attack - x.stats.attack)[0]; if (a) { give(u, a, "haste", 1, 2); give(u, a, "rally", 1); } })),
  ],
  고수: [
    sig2("결사대 오백", (t) => `곁에 붙은 적이 둘 이상이면 회심 확률 +${T(t, 12)}%p.`,
      crit(12, (_c, s) => around(s, 1, "foe").length >= 2)),
    sig2("황제의 깃 덮개", (t) => `군주 병종의 적에게 주는 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => lordish(c.defender))),
    sig2("지름길의 야습", (t) => `이번 차례 4칸 이상 움직였으면 회피 +${T(t, 15)}%p.`,
      dodge(15, (_c, s) => (s.movedSteps ?? 0) >= 4)),
  ],
  장패: [
    sig2("옥에서 아버지를 구하다", (t) => `2칸 안에 체력이 절반 이하인 아군이 있으면 주는 피해 ${T(t, 15)}% 증가.`,
      atk(15, (_c, s) => around(s, 2, "friend").some((a) => hpRate(a) <= .5))),
    sig2("태산의 호족", (t) => `산지·구릉 칸에서 회피 +${T(t, 12)}%p.`,
      dodge(12, (_c, s) => onTerrain(s, "mountain", "hill"))),
    sig2("동방의 진무", (t) => `2칸 안 아군이 받는 물리 피해 ${T(t, 8)}% 감소. 자기 차례마다 그 아군들의 낙담·지체를 푼다.`,
      both({ onAllyDefend(ctx, h, p) { if (phys(ctx) && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(8, p)); } },
        turn((u) => { for (const a of around(u, 2, "friend")) cleanse(a, ["dispirit", "sluggish"]); }))),
  ],
  주연: [
    sig2("여섯 달의 농성", (t) => `전투 넷째 턴부터 받는 피해 ${T(t, 15)}% 감소, 성채·성문 칸에서는 5% 더.`,
      { onDefend(ctx, s, p) { if (turnOf(s) < 4) return; ctx.reduction = combine(ctx.reduction, P(15, p)); if (fort(s)) ctx.reduction = combine(ctx.reduction, .05); } }),
    sig2("임저의 매복", (t) => `곁에 붙은 이름있는 적 장수에게 주는 피해 ${T(t, 10)}% 증가. 자기 차례마다 그 장수를 둔화시킨다.`,
      both(atk(10, (c) => c.distance <= 1 && isNamedOfficer(c.defender)), turn((u) => { for (const e of around(u, 1, "foe")) if (isNamedOfficer(e)) give(u, e, "slow", 1); }))),
    sig2("여몽의 뒤를 잇다", (t) => `체력이 절반 이하인 적에게 회심 확률 +${T(t, 15)}%p.`,
      crit(15, (c) => hpRate(c.defender) <= .5)),
  ],
  제갈각: [
    sig2("나귀에 붙인 두 글자", (t) => `책략 명중 +${T(t, 10)}%p, 자기보다 지력이 낮은 적에게는 5%p 더.`,
      { onAttack(ctx, s, p) { if (strat(ctx)) ctx.accuracyMod += N(10, p) + (ctx.defender.stats.intellect < s.stats.intellect ? 5 : 0); } }),
    sig2("동흥의 눈 속 돌격", (t) => `전투 첫 두 턴 동안 2칸 안 아군의 물리 피해 ${T(t, 12)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (phys(ctx) && turnOf(h) <= 2 && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(12, p); } }),
    sig2("집안을 기울게 할 재주", (t) => `책략 피해 ${T(t, 22)}% 증가. 대신 받는 물리 피해 15% 증가.`,
      both(atk(22, (c) => strat(c)), { onDefend(ctx) { if (phys(ctx)) takeMore(ctx, 1.15); } })),
  ],
  // ── 요동
  공손연: [
    sig2("양평성의 주인", (t) => `성채·성문 칸에 선 2칸 안 아군이 받는 피해 ${T(t, 12)}% 감소.`,
      { onAllyDefend(ctx, h, p) { if (fort(ctx.defender) && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(12, p)); } }),
    sig2("요수의 장마", (t) => `물 위나 물가에 선 적에게 받는 피해 ${T(t, 15)}% 감소.`,
      def(15, (c) => byWater(c.attacker))),
    sig2("오의 사신을 베다", (t) => `책략을 쓰는 적에게 주는 물리 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => phys(c) && caster(c.defender))),
  ],
  비연: [
    sig2("요수의 영채", (t) => `물가(물 칸 위나 옆)에서 받는 물리 피해 ${T(t, 15)}% 감소.`,
      def(15, (c, s) => phys(c) && byWater(s))),
    sig2("양평으로의 추격", (t) => `이번 차례 3칸 이상 움직였으면 회심 확률 +${T(t, 12)}%p.`,
      crit(12, (_c, s) => (s.movedSteps ?? 0) >= 3)),
    sig2("연왕의 대장", (t) => `공손연이 2칸 안에 있으면 주는 피해 ${T(t, 18)}% 증가.`,
      atk(18, (_c, s) => near(s, "공손연"))),
  ],
  // ── 원씨와 하북
  원담: [
    sig2("청주 자사", (t) => `곁에 붙은 아군이 주는 물리 피해 ${T(t, 10)}% 증가.`,
      { onAllyAttack(ctx, h, p) { if (phys(ctx) && within(h, ctx.attacker, 1)) ctx.attackMul *= 1 + P(10, p); } }),
    sig2("업을 둘러싼 형제", (t) => `원씨 적 장수에게 주는 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => c.defender.name.startsWith("원"))),
    sig2("남피의 마지막 싸움", (t) => `체력 30% 이하에서 받는 피해 ${T(t, 15)}% 감소, 주는 피해 10% 증가.`,
      both(def(15, (_c, s) => hpRate(s) <= .3), { onAttack(ctx, s) { if (hpRate(s) <= .3) ctx.attackMul *= 1.1; } })),
  ],
  원상: [
    sig2("빼어난 용모", (t) => `받는 책략 피해 ${T(t, 8)}% 감소. 자기 차례마다 곁에 붙은 아군의 사기를 북돋운다.`,
      both(def(8, (c) => strat(c)), turn((u) => { for (const a of around(u, 1, "friend")) give(u, a, "rally", 1); }))),
    sig2("오환에 의탁하다", (t) => `2칸 안에 아군 기병이 있으면 받는 피해 ${T(t, 12)}% 감소.`,
      def(12, (_c, s) => around(s, 2, "friend").some(mounted))),
    sig2("심배와 봉기의 옹립", (t) => `2칸 안 아군 하나마다 받는 책략 피해 ${T(t, 5)}% 감소(최대 넷).`,
      { onDefend(ctx, s, p) { if (!strat(ctx)) return; const k = Math.min(4, around(s, 2, "friend").length); if (k) ctx.reduction = combine(ctx.reduction, k * P(5, p)); } }),
  ],
  고람: [
    sig2("관도 본영 공격", (t) => `성채·성문 칸의 적에게 주는 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c) => fort(c.defender))),
    sig2("장합과 함께", (t) => `회심 확률 +${T(t, 6)}%p. 장합이 2칸 안에 있으면 ${T(t, 12)}%p 더.`,
      { onAttack(ctx, s, p) { ctx.criticalChance += N(6, p) + (near(s, "장합") ? N(12, p) : 0); } }),
    sig2("하북 기병의 창끝", (t) => `기병을 치면 방어 ${T(t, 20)}% 무시.`,
      pierce(20, (c) => mounted(c.defender))),
  ],
  봉기: [
    sig2("기주 탈취의 계", (t) => `성채·성문 칸의 적에게 책략 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => strat(c) && fort(c.defender))),
    sig2("전풍을 헐뜯다", (t) => `책략 명중 +${T(t, 8)}%p. 자기 차례마다 3칸 안에서 사기가 가장 높은 적 하나를 낙담시킨다.`,
      both(aim(8, (c) => strat(c)), turn((u) => { const e = around(u, 3, "foe").sort((a, b) => b.stats.morale - a.stats.morale)[0]; if (e) give(u, e, "dispirit", 2); }))),
    sig2("셋째 아들을 세우다", (t) => `2칸 안에 아군 군주가 있으면 책략 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => strat(c) && around(s, 2, "friend").some(lordish))),
  ],
  고간: [
    sig2("호관 수비", (t) => `성채·성문 칸에서 받는 물리 피해 ${T(t, 20)}% 감소.`,
      def(20, (c, s) => phys(c) && fort(s))),
    sig2("병주에서 다시 일어나다", (t) => `체력 절반 이하에서 주는 피해 ${T(t, 10)}% 증가, 자기 차례마다 견고(받는 피해 감소)를 얻는다.`,
      both(atk(10, (_c, s) => hpRate(s) <= .5), turn((u) => { if (hpRate(u) <= .5) give(u, u, "guard", 1); }))),
    sig2("선우에게 보낸 사자", (t) => `3칸 안 아군이 둘 이하이면 받는 피해 ${T(t, 15)}% 감소.`,
      def(15, (_c, s) => around(s, 3, "friend").length <= 2)),
  ],
  // ── 오환과 남만
  답돈: [
    sig2("초원의 선우", (t) => `평지 칸에서 주는 물리 피해 ${T(t, 15)}% 증가.`,
      atk(15, (c, s) => phys(c) && onTerrain(s, "plain"))),
    sig2("말 위의 활", (t) => `이번 차례 움직였다면 두 칸 이상 떨어진 적에게 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => !!s.movedThisTurn && c.distance >= 2)),
    sig2("삼군 오환의 우두머리", (t) => `2칸 안 아군 기병·궁기병의 회심 확률 +${T(t, 8)}%p.`,
      { onAllyAttack(ctx, h, p) { if (mounted(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.criticalChance += N(8, p); } }),
  ],
  올돌골: [
    sig2("기름 먹인 등나무 갑옷", (t) => `두 칸 이상 떨어진 적에게 받는 물리 피해 ${T(t, 25)}% 감소. 대신 불 책략에 받는 피해 30% 증가.`,
      both(def(25, (c) => phys(c) && c.distance >= 2), { onDefend(ctx) { if (fire(ctx)) takeMore(ctx, 1.3); } })),
    sig2("물에 뜨는 갑옷", (t) => `물 위나 물가에서 주는 물리 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => phys(c) && byWater(s))),
    sig2("비늘 돋은 몸", (t) => `자기 차례마다 자신의 쇠약·출혈을 풀고 체력 ${T(t, 5)}% 회복.`,
      turn((u, p) => { cleanse(u, ["weaken", "bleed"]); heal(u, P(5, p)); })),
  ],
  // ── 초한
  우희: [
    sig2("해하의 화답", () => `자기 차례마다 2칸 안 아군의 낙담을 풀고 고양시킨다(사기 상승).`,
      turn((u) => { for (const a of around(u, 2, "friend")) { cleanse(a, ["dispirit"]); give(u, a, "spirited", 1); } })),
    sig2("패왕의 곁", (t) => `회피 +${T(t, 8)}%p, 항우가 곁에 붙어 있으면 그 두 배.`,
      { onDefend(ctx, s, p) { ctx.accuracyMod -= N(8, p) * (near(s, "항우", 1) ? 2 : 1); } }),
    sig2("우미인초", (t) => `2칸 안의 항우가 주는 피해 ${T(t, 15)}% 증가, 받는 피해 ${T(t, 10)}% 감소.`,
      { onAllyAttack(ctx, h, p) { if (ctx.attacker.name === "항우" && within(h, ctx.attacker, 2)) ctx.attackMul *= 1 + P(15, p); },
        onAllyDefend(ctx, h, p) { if (ctx.defender.name === "항우" && within(h, ctx.defender, 2)) ctx.reduction = combine(ctx.reduction, P(10, p)); } }),
  ],
  용저: [
    sig2("한신을 얕보다", (t) => `자기보다 레벨이 낮은 적에게 물리 피해 ${T(t, 18)}% 증가.`,
      atk(18, (c, s) => phys(c) && c.defender.level < s.level)),
    sig2("반쯤 건넌 강", (t) => `물·여울·급류 칸의 적에게 주는 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c) => onTerrain(c.defender, "water", "ford", "rapids"))),
    sig2("제나라 구원군", () => `3칸 안에 체력이 절반 이하인 아군이 있으면 자기 차례마다 이동력 +2.`,
      turn((u) => { if (around(u, 3, "friend").some((a) => hpRate(a) <= .5)) give(u, u, "haste", 1, 2); })),
  ],
  조참: [
    sig2("일흔 군데의 상처", (t) => `체력이 낮을수록 받는 물리 피해 감소(체력 30% 이하에서 최대 ${T(t, 22)}%).`,
      { onDefend(ctx, s, p) { if (!phys(ctx)) return; const k = Math.max(0, Math.min(1, (1 - hpRate(s)) / .7)); if (k > 0) ctx.reduction = combine(ctx.reduction, k * P(22, p)); } }),
    sig2("한신과 함께 제를 치다", (t) => `한신이 2칸 안에 있으면 주는 피해 ${T(t, 15)}% 증가, 회심 확률 +5%p.`,
      { onAttack(ctx, s, p) { if (near(s, "한신")) { ctx.attackMul *= 1 + P(15, p); ctx.criticalChance += 5; } } }),
    sig2("상국의 술잔", (t) => `자기 차례마다 자신과 2칸 안 아군 모두 체력 ${T(t, 3)}%와 MP 1 회복.`,
      turn((u, p) => { for (const a of [u, ...around(u, 2, "friend")]) { heal(a, P(3, p)); addMp(a, 1); } })),
  ],
  관영: [
    sig2("낭중기의 교위", (t) => `2칸 안 아군 기병의 명중 +${T(t, 10)}%p.`,
      { onAllyAttack(ctx, h, p) { if (mounted(ctx.attacker) && within(h, ctx.attacker, 2)) ctx.accuracyMod += N(10, p); } }),
    sig2("동성 추격", (t) => `움직인 뒤 체력이 절반 이하인 적을 치면 피해 ${T(t, 20)}% 증가.`,
      atk(20, (c, s) => !!s.movedThisTurn && hpRate(c.defender) <= .5)),
    sig2("패왕의 목", (t) => `체력 30% 이하인 이름있는 적 장수에게 회심 확률 +${T(t, 15)}%p.`,
      crit(15, (c) => isNamedOfficer(c.defender) && hpRate(c.defender) <= .3)),
  ],
};
export default SET;
