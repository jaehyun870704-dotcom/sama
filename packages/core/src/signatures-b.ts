/**
 * 이름있는 장수 고유특성 묶음 B: 장수마다 셋(첫째는 처음부터 · 둘째는 2차 병종 진화 · 셋째는 3차 병종 진화에서 열린다).
 * 수치는 병종 단계에 따라 커진다(sigMul: ×1 · ×1.3 · ×1.6 · ×2). 조각은 signature-kit.ts에서 가져온다.
 */
import type { Signature } from "./signature-kit.ts";
import { sig2, T, N, P, atk, def, crit, aim, dodge, pierce, turn, both, give, heal, cleanse, once, around, near, onTerrain, fort, byWater, phys, strat, hpRate, turnOf, mounted, foot, caster, fam, isNamedOfficer } from "./signature-kit.ts";
import { combine } from "./traits.ts";
import { engageDistance } from "./reach.ts";
import type { Unit } from "./types.ts";

const SIMA = ["사마의", "사마사", "사마소"];
const has = (u: Unit, ...kinds: string[]) => u.statuses.some((x) => kinds.includes(x.kind));

const SET: Record<string, [Signature, Signature, Signature]> = {
  // ── 위·진
  호준: [
    sig2("사마씨의 오랜 부장", (t) => `2칸 안에 사마의·사마사·사마소 가운데 누가 있으면 받는 피해 ${T(t, 12)}% 감소.`, def(12, (_c, s) => SIMA.some((n) => near(s, n)))),
    sig2("동흥으로 함께 간 길", (t) => `곁에 붙은 아군이 둘 이상이면 물리 피해 ${T(t, 15)}% 증가.`, atk(15, (c, s) => phys(c) && around(s, 1, "friend").length >= 2)),
    sig2("노부장의 방진", (t) => `자기 차례마다 곁에 붙은 아군을 견고하게 한다. 받는 물리 피해 ${T(t, 10)}% 감소.`, both(def(10, (c) => phys(c)), turn((u) => { for (const a of around(u, 1, "friend")) give(u, a, "guard", 1); }))),
  ],
  견초: [
    sig2("오환을 다루는 법", (t) => `기병·궁기병을 상대로 주는 피해 ${T(t, 15)}% 증가.`, atk(15, (c) => mounted(c.defender))),
    sig2("안문의 변경 수비", (t) => `기병에게 받는 물리 피해 ${T(t, 15)}% 감소, 회피 +5%p.`, both(def(15, (c) => phys(c) && mounted(c.attacker)), dodge(5, (c) => mounted(c.attacker)))),
    sig2("선비를 쫓는 기병", (t) => `이번 차례 움직인 칸마다 회심 확률 +${T(t, 2)}%p(최대 5칸).`, { onAttack(ctx, s, p) { ctx.criticalChance += Math.min(5, s.movedSteps ?? 0) * N(2, p); } }),
  ],
  전주: [
    sig2("노룡새의 옛길", (t) => `험한 지형도 평지처럼 움직인다. 산지·숲 칸에서 회피 +${T(t, 8)}%p.`, both({ ignoresRoughTerrain: true }, dodge(8, (_c, s) => onTerrain(s, "mountain", "forest")))),
    sig2("백랑산의 기습", (t) => `전투 첫 두 턴 동안 회심 확률 +${T(t, 15)}%p.`, crit(15, (_c, s) => turnOf(s) <= 2)),
    sig2("서무산의 은거", (t) => `자기 차례마다 자신과 곁에 붙은 아군의 체력을 ${T(t, 5)}% 회복하고 낙담을 풀어 준다.`, turn((u, p) => { for (const a of [u, ...around(u, 1, "friend")]) { heal(a, P(5, p)); cleanse(a, ["dispirit"]); } })),
  ],
  채모: [
    sig2("형주 수군 조련", (t) => `2칸 안 아군 수군이 주는 피해 ${T(t, 12)}% 증가.`, { onAllyAttack(ctx, h, p) { if (fam(ctx.attacker.unitClass) === "navy" && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.attackMul *= 1 + P(12, p); } }),
    sig2("양양의 뱃길", (t) => `물 위나 물가에 서면 명중 +${T(t, 12)}%p.`, aim(12, (_c, s) => byWater(s))),
    sig2("유종을 세우다", (t) => `2칸 안에 아군이 셋 이상 모이면 주는 피해 ${T(t, 15)}% 증가.`, atk(15, (_c, s) => around(s, 2, "friend").length >= 3)),
  ],
  사마부: [
    sig2("위의 군량관", (t) => `자기 차례마다 2칸 안 아군의 MP를 ${T(t, 2)}, 체력을 2% 채운다.`, turn((u, p) => { for (const a of around(u, 2, "friend")) { a.mp = Math.min(a.stats.maxMp, a.mp + N(2, p)); heal(a, .02); } })),
    sig2("아흔셋의 천수", (t) => `체력이 절반 이하이면 자기 차례마다 최대 체력의 ${T(t, 6)}%를 회복한다.`, turn((u, p) => { if (hpRate(u) <= .5) heal(u, P(6, p)); })),
    sig2("조모를 안고 울다", (t) => `2칸 안에서 체력이 30% 이하인 아군이 받는 피해 ${T(t, 18)}% 감소.`, { onAllyDefend(ctx, h, p) { if (hpRate(ctx.defender) <= .3 && engageDistance(h.pos, ctx.defender.pos) <= 2) ctx.reduction = combine(ctx.reduction, P(18, p)); } }),
  ],
  양준: [
    sig2("사람을 알아보는 눈", (t) => `2칸 안 이름있는 아군 장수의 명중 +${T(t, 10)}%p.`, { onAllyAttack(ctx, h, p) { if (isNamedOfficer(ctx.attacker) && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.accuracyMod += N(10, p); } }),
    sig2("청렴한 수령", (t) => `자기 차례마다 곁에 붙은 아군의 쇠약·파갑을 풀어 준다. 받는 피해 ${T(t, 6)}% 감소.`, both(def(6), turn((u) => { for (const a of around(u, 1, "friend")) cleanse(a, ["weaken", "breach"]); }))),
    sig2("어린 사마의를 알아보다", (t) => `3칸 안에 사마의가 있으면 책략 피해 ${T(t, 20)}% 증가.`, atk(20, (c, s) => strat(c) && near(s, "사마의", 3))),
  ],
  양수: [
    sig2("계륵의 뜻", (t) => `체력이 절반 이하인 적에게 책략 명중 +${T(t, 15)}%p.`, aim(15, (c) => strat(c) && hpRate(c.defender) <= .5)),
    sig2("절묘호사", (t) => `지력이 상대보다 높으면 책략 명중 +${T(t, 12)}%p, 책략이 정신력을 10% 무시한다.`, both(aim(12, (c, s) => strat(c) && s.stats.intellect > c.defender.stats.intellect), pierce(10, (c, s) => strat(c) && s.stats.intellect > c.defender.stats.intellect))),
    sig2("재주가 넘친 주부", (t) => `책략 피해 ${T(t, 25)}% 증가. 대신 받는 물리 피해 10% 증가.`, both(atk(25, (c) => strat(c)), { onDefend(ctx) { if (phys(ctx)) ctx.reduction = 1 - (1 - ctx.reduction) * 1.1; } })),
  ],
  만총: [
    sig2("합비 신성", (t) => `성채·성문 칸에서 받는 피해 ${T(t, 15)}% 감소. 그때 곁에 붙은 아군도 받는 피해 5% 감소.`, both(def(15, (_c, s) => fort(s)), { onAllyDefend(ctx, h) { if (fort(h) && ctx.defender !== h && engageDistance(h.pos, ctx.defender.pos) <= 1) ctx.reduction = combine(ctx.reduction, .05); } })),
    sig2("번성을 버리지 마라", () => `자기 차례마다 2칸 안 아군의 낙담을 풀고, 그 가운데 체력이 절반 이하인 아군의 사기를 북돋운다.`, turn((u) => { for (const a of [u, ...around(u, 2, "friend")]) { cleanse(a, ["dispirit"]); if (hpRate(a) <= .5) give(u, a, "rally", 1); } })),
    sig2("물에서 물러난 성", (t) => `물 위나 물가의 적에게 받는 피해 ${T(t, 20)}% 감소.`, def(20, (c) => byWater(c.attacker))),
  ],
  가충: [
    sig2("제갈탄의 속을 떠보다", () => `두 턴마다 자기 차례에 3칸 안에서 체력이 가장 많은 적 하나를 파갑에 빠뜨린다(받는 피해 증가).`, turn((u) => { if ((turnOf(u) - 1) % 2 !== 0) return; const e = around(u, 3, "foe").sort((a, b) => b.hp - a.hp)[0]; if (e) give(u, e, "breach", 2); })),
    sig2("성제를 부추기다", (t) => `2칸 안 아군이 이름있는 적 장수를 물리 공격하면 피해 ${T(t, 12)}% 증가.`, { onAllyAttack(ctx, h, p) { if (phys(ctx) && isNamedOfficer(ctx.defender) && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.attackMul *= 1 + P(12, p); } }),
    sig2("태시율령", (t) => `받는 책략 피해 ${T(t, 15)}% 감소. 자기 차례마다 2칸 안 아군의 봉인을 풀어 준다.`, both(def(15, (c) => strat(c)), turn((u) => { for (const a of [u, ...around(u, 2, "friend")]) cleanse(a, ["seal"]); }))),
  ],
  석포: [
    sig2("짝이 없는 석중용", (t) => `자신의 체력이 가득할 때 회피 +${T(t, 12)}%p.`, dodge(12, (_c, s) => s.hp >= s.stats.maxHp)),
    sig2("수춘의 원군 격파", (t) => `3칸 안에 적이 셋 이상이면 주는 피해 ${T(t, 15)}% 증가.`, atk(15, (_c, s) => around(s, 3, "foe").length >= 3)),
    sig2("개국의 대사마", (t) => `2칸 안 아군 기병이 받는 피해 ${T(t, 12)}% 감소.`, { onAllyDefend(ctx, h, p) { if (mounted(ctx.defender) && engageDistance(h.pos, ctx.defender.pos) <= 2) ctx.reduction = combine(ctx.reduction, P(12, p)); } }),
  ],
  // ── 촉
  유봉: [
    sig2("상용 공취", (t) => `성채·성문 칸의 적에게 주는 물리 피해 ${T(t, 20)}% 증가.`, atk(20, (c) => phys(c) && fort(c.defender))),
    sig2("익주 공략의 선봉", (t) => `전투 첫 세 턴 동안 물리 피해 ${T(t, 15)}% 증가.`, atk(15, (c, s) => phys(c) && turnOf(s) <= 3)),
    sig2("돌아갈 곳 없는 양자", (t) => `체력 30% 이하에서 물리 공격이 방어 ${T(t, 25)}% 무시.`, pierce(25, (c, s) => phys(c) && hpRate(s) <= .3)),
  ],
  관색: [
    sig2("남정의 선봉", (t) => `숲·갈대늪 칸의 적에게 주는 물리 피해 ${T(t, 18)}% 증가.`, atk(18, (c) => phys(c) && onTerrain(c.defender, "forest", "marsh"))),
    sig2("관씨 형제", (t) => `2칸 안에 관흥이나 관평이 있으면 회심 확률 +${T(t, 12)}%p.`, crit(12, (_c, s) => near(s, "관흥") || near(s, "관평"))),
    sig2("청룡의 셋째", (t) => `이름있는 적 장수를 물리 공격하면 피해 ${T(t, 15)}% 증가, 방어 10% 무시.`, both(atk(15, (c) => phys(c) && isNamedOfficer(c.defender)), pierce(10, (c) => phys(c) && isNamedOfficer(c.defender)))),
  ],
  // ── 위
  장제: [
    sig2("조상에게 보낸 편지", () => `두 턴마다 자기 차례에 3칸 안에서 레벨이 가장 높은 적 하나를 낙담시킨다.`, turn((u) => { if ((turnOf(u) - 1) % 2 !== 0) return; const e = around(u, 3, "foe").sort((a, b) => b.level - a.level)[0]; if (e) give(u, e, "dispirit", 2); })),
    sig2("군정에 밝은 태위", (t) => `3칸 안 아군 하나마다 책략 명중 +${T(t, 3)}%p(최대 넷).`, { onAttack(ctx, s, p) { if (strat(ctx)) ctx.accuracyMod += Math.min(4, around(s, 3, "friend").length) * N(3, p); } }),
    sig2("낙수의 맹세", (t) => `전투 첫 세 턴 동안 책략 피해 ${T(t, 18)}% 증가.`, atk(18, (c, s) => strat(c) && turnOf(s) <= 3)),
  ],
  왕관: [
    sig2("중령군 대행", () => `자기 차례마다 곁에 붙은 적을 둔화시킨다(이동력 감소).`, turn((u) => { for (const e of around(u, 1, "foe")) give(u, e, "slow", 1); })),
    sig2("법을 지키는 관리", (t) => `혼란·쇠약·지체에 걸린 적에게 주는 물리 피해 ${T(t, 18)}% 증가.`, atk(18, (c) => phys(c) && has(c.defender, "confusion", "weaken", "sluggish"))),
    sig2("검소한 장례", (t) => `자기 차례마다 자신의 쇠약·파갑·출혈을 풀고, 받는 물리 피해 ${T(t, 12)}% 감소.`, both(def(12, (c) => phys(c)), turn((u) => cleanse(u, ["weaken", "breach", "bleed"])))),
  ],
  왕찬: [
    sig2("등루부", (t) => `산지·구릉·성채 칸에서 책략 명중 +${T(t, 12)}%p.`, aim(12, (c, s) => strat(c) && onTerrain(s, "mountain", "hill", "fort"))),
    sig2("바둑판을 되살린 기억", (t) => `자기 차례마다 3칸 안에서 MP가 가장 적은 아군 책사 하나의 MP를 ${T(t, 5)} 채운다.`, turn((u, p) => { const a = [u, ...around(u, 3, "friend")].filter((x) => caster(x) && x.mp < x.stats.maxMp).sort((x, y) => x.mp / x.stats.maxMp - y.mp / y.stats.maxMp)[0]; if (a) a.mp = Math.min(a.stats.maxMp, a.mp + N(5, p)); })),
    sig2("건안의 문장", (t) => `2칸 안에 아군이 둘 이상이면 책략 피해 ${T(t, 20)}% 증가.`, atk(20, (c, s) => strat(c) && around(s, 2, "friend").length >= 2)),
  ],
  왕창: [
    sig2("강릉 공략", (t) => `물 위나 물가의 적에게 회심 확률 +${T(t, 12)}%p.`, crit(12, (c) => byWater(c.defender))),
    sig2("정남장군", (t) => `2칸 안 아군 수군이 받는 피해 ${T(t, 12)}% 감소.`, { onAllyDefend(ctx, h, p) { if (fam(ctx.defender.unitClass) === "navy" && engageDistance(h.pos, ctx.defender.pos) <= 2) ctx.reduction = combine(ctx.reduction, P(12, p)); } }),
    sig2("아들에게 남긴 가훈", (t) => `자기보다 레벨이 높은 적에게 받는 피해 ${T(t, 12)}% 감소.`, def(12, (c, s) => c.attacker.level > s.level)),
  ],
  // ── 촉·위
  황권: [
    sig2("강북의 고군", (t) => `3칸 안에 아군이 없으면 주는 피해 ${T(t, 15)}% 증가, 받는 피해 ${T(t, 10)}% 감소.`, both(atk(15, (_c, s) => !around(s, 3, "friend").length), def(10, (_c, s) => !around(s, 3, "friend").length))),
    sig2("한중을 먼저 취하소서", (t) => `산지·구릉 칸의 적에게 주는 피해 ${T(t, 18)}% 증가.`, atk(18, (c) => onTerrain(c.defender, "mountain", "hill"))),
    sig2("유비가 저버린 신하", (t) => `받는 책략 피해 ${T(t, 12)}% 감소, 회피 +${T(t, 5)}%p.`, both(def(12, (c) => strat(c)), dodge(5))),
  ],
  하후패: [
    sig2("정군산의 원한", (t) => `이름있는 적 장수를 치면 회심 확률 +${T(t, 12)}%p.`, crit(12, (c) => isNamedOfficer(c.defender))),
    sig2("음평 너머로 망명", (t) => `이번 차례 3칸 이상 움직였다면 회피 +${T(t, 12)}%p.`, dodge(12, (_c, s) => (s.movedSteps ?? 0) >= 3)),
    sig2("강유와의 북벌", (t) => `2칸 안에 강유가 있으면 물리 피해 ${T(t, 18)}% 증가, 받는 피해 ${T(t, 8)}% 감소.`, both(atk(18, (c, s) => phys(c) && near(s, "강유")), def(8, (_c, s) => near(s, "강유")))),
  ],
  하후무: [
    sig2("청하공주의 부마", (t) => `2칸 안에 이름있는 아군 장수가 둘 이상이면 받는 피해 ${T(t, 15)}% 감소.`, def(15, (_c, s) => around(s, 2, "friend").filter(isNamedOfficer).length >= 2)),
    sig2("달아나는 말", () => `체력이 절반 이하이면 자기 차례마다 이동력 +2.`, turn((u) => { if (hpRate(u) <= .5) give(u, u, "haste", 1, 2); })),
    sig2("관중의 안서장군", (t) => `평지·길 칸에서 주는 피해 ${T(t, 18)}% 증가.`, atk(18, (_c, s) => onTerrain(s, "plain", "road"))),
  ],
  // ── 남만
  타사대왕: [
    sig2("독룡동의 샘", () => `자기 차례마다 곁에 붙은 적 모두를 독에 빠뜨린다(출혈).`, turn((u) => { for (const e of around(u, 1, "foe")) give(u, e, "bleed", 2); })),
    sig2("네 갈래 독천", (t) => `출혈·화상에 걸린 적에게 주는 피해 ${T(t, 20)}% 증가.`, atk(20, (c) => has(c.defender, "bleed", "burn"))),
    sig2("독룡동의 깊은 골짜기", (t) => `숲·갈대늪·산지 칸에서 받는 책략 피해 ${T(t, 20)}% 감소, 회피 +5%p.`, both(def(20, (c, s) => strat(c) && onTerrain(s, "forest", "marsh", "mountain")), dodge(5, (_c, s) => onTerrain(s, "forest", "marsh", "mountain")))),
  ],
  목록대왕: [
    sig2("바람을 부르는 주문", (t) => `바람 책략 피해 ${T(t, 20)}% 증가.`, atk(20, (c) => strat(c) && c.element === "wind")),
    sig2("맹수 몰이", (t) => `자기 차례마다 2칸 안 아군 기병·코끼리 부대의 사기를 북돋운다. 그 부대들이 주는 피해 ${T(t, 8)}% 증가.`, both(turn((u) => { for (const a of around(u, 2, "friend")) if (mounted(a)) give(u, a, "rally", 1); }), { onAllyAttack(ctx, h, p) { if (mounted(ctx.attacker) && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.attackMul *= 1 + P(8, p); } })),
    sig2("흰 코끼리", (t) => `받는 물리 피해 ${T(t, 18)}% 감소. 자기 차례마다 곁에 붙은 적을 지체시킨다.`, both(def(18, (c) => phys(c)), turn((u) => { for (const e of around(u, 1, "foe")) give(u, e, "sluggish", 1); }))),
  ],
  // ── 오·위
  전종: [
    sig2("곡식을 풀어 구하다", (t) => `자기 차례마다 2칸 안에서 체력이 가장 낮은 아군 하나의 체력을 ${T(t, 8)}% 회복한다.`, turn((u, p) => { const a = [u, ...around(u, 2, "friend")].filter((x) => x.hp < x.stats.maxHp).sort((x, y) => hpRate(x) - hpRate(y))[0]; if (a) heal(a, P(8, p)); })),
    sig2("산월 토벌", (t) => `숲·산지 칸의 적에게 주는 물리 피해 ${T(t, 16)}% 증가.`, atk(16, (c) => phys(c) && onTerrain(c.defender, "forest", "mountain"))),
    sig2("작피의 접전", (t) => `곁에 붙은 적이 둘 이상이면 받은 물리 피해의 ${T(t, 15)}%를 되돌린다.`, { onDefend(ctx, s, p) { if (phys(ctx) && around(s, 1, "foe").length >= 2) ctx.reflect += P(15, p); } }),
  ],
  조우: [
    sig2("연왕의 위엄", (t) => `2칸 안 아군 보병·창병이 주는 피해 ${T(t, 10)}% 증가.`, { onAllyAttack(ctx, h, p) { if (foot(ctx.attacker) && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.attackMul *= 1 + P(10, p); } }),
    sig2("나흘의 대장군", (t) => `전투 첫 네 턴 동안 2칸 안 아군이 받는 피해 ${T(t, 8)}% 감소.`, { onAllyDefend(ctx, h, p) { if (turnOf(h) <= 4 && engageDistance(h.pos, ctx.defender.pos) <= 2) ctx.reduction = combine(ctx.reduction, P(8, p)); } }),
    sig2("물러날 줄 아는 왕", (t) => `체력이 절반 이하이면 받는 피해 ${T(t, 15)}% 감소하고 자기 차례마다 체력 3%를 회복한다.`, both(def(15, (_c, s) => hpRate(s) <= .5), turn((u) => { if (hpRate(u) <= .5) heal(u, .03); }))),
  ],
  // ── 군웅
  원희: [
    sig2("유주의 기병", (t) => `움직인 뒤 공격하면 회심 확률 +${T(t, 10)}%p.`, crit(10, (_c, s) => !!s.movedThisTurn)),
    sig2("원상과 함께", (t) => `2칸 안에 원상이 있으면 받는 피해 ${T(t, 15)}% 감소, 주는 피해 10% 증가.`, both(def(15, (_c, s) => near(s, "원상")), atk(10, (_c, s) => near(s, "원상")))),
    sig2("요동으로 달아나다", (t) => `체력 30% 이하이면 자기 차례마다 이동력 +2, 회피 +${T(t, 12)}%p.`, both(dodge(12, (_c, s) => hpRate(s) <= .3), turn((u) => { if (hpRate(u) <= .3) give(u, u, "haste", 1, 2); }))),
  ],
  한수: [
    sig2("서량의 노군벌", (t) => `3칸 안 아군 기병 하나마다 주는 피해 ${T(t, 4)}% 증가(최대 넷).`, { onAttack(ctx, s, p) { ctx.attackMul *= 1 + Math.min(4, around(s, 3, "friend").filter(mounted).length) * P(4, p); } }),
    sig2("말 머리를 맞댄 담소", (t) => `곁에 붙은 이름있는 적 장수에게 받는 피해 ${T(t, 15)}% 감소.`, def(15, (c) => c.distance <= 1 && isNamedOfficer(c.attacker))),
    sig2("삼십 년의 할거", (t) => `전투가 다섯 턴을 넘기면 주는 피해 ${T(t, 20)}% 증가.`, atk(20, (_c, s) => turnOf(s) > 5)),
  ],
  방덕: [
    sig2("관을 짊어지고", (t) => `체력 절반 이하에서 받는 피해 ${T(t, 12)}% 감소, 주는 물리 피해 ${T(t, 12)}% 증가.`, both(def(12, (_c, s) => hpRate(s) <= .5), atk(12, (c, s) => phys(c) && hpRate(s) <= .5))),
    sig2("관우와의 백 합", (t) => `관우를 치면 피해 ${T(t, 25)}% 증가, 그 밖의 이름있는 적 장수에게는 ${T(t, 10)}% 증가.`, { onAttack(ctx, _s, p) { if (ctx.defender.name === "관우") ctx.attackMul *= 1 + P(25, p); else if (isNamedOfficer(ctx.defender)) ctx.attackMul *= 1 + P(10, p); } }),
    sig2("무릎 꿇지 않는다", (t) => `자기 차례마다 자신의 혼란·낙담·쇠약을 풀어 낸다. 체력 30% 이하에서 회심 확률 +${T(t, 15)}%p.`, both(crit(15, (_c, s) => hpRate(s) <= .3), turn((u) => cleanse(u, ["confusion", "dispirit", "weaken"])))),
  ],
  장위: [
    sig2("양평관 수비", (t) => `성문·성채·산지 칸에서 받는 물리 피해 ${T(t, 15)}% 감소.`, def(15, (c, s) => phys(c) && onTerrain(s, "gate", "fort", "mountain"))),
    sig2("한중의 군권", (t) => `2칸 안 아군 보병·창병의 명중 +${T(t, 10)}%p.`, { onAllyAttack(ctx, h, p) { if (foot(ctx.attacker) && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.accuracyMod += N(10, p); } }),
    sig2("오두미도의 결속", (t) => `자기 차례마다 곁에 붙은 아군의 혼란을 풀고 체력을 ${T(t, 5)}% 회복한다.`, turn((u, p) => { for (const a of around(u, 1, "friend")) { cleanse(a, ["confusion"]); heal(a, P(5, p)); } })),
  ],
  양임: [
    sig2("군령장", (t) => `전투 첫 두 턴 동안 물리 명중 +${T(t, 10)}%p, 회심 확률 +5%p.`, both(aim(10, (c, s) => phys(c) && turnOf(s) <= 2), crit(5, (c, s) => phys(c) && turnOf(s) <= 2))),
    sig2("양평관의 창", (t) => `기병을 물리 공격하면 방어 ${T(t, 18)}% 무시.`, pierce(18, (c) => phys(c) && mounted(c.defender))),
    sig2("장위와 함께", (t) => `2칸 안에 장위가 있으면 받는 피해 ${T(t, 15)}% 감소, 회심 확률 +10%p.`, both(def(15, (_c, s) => near(s, "장위")), crit(10, (_c, s) => near(s, "장위")))),
  ],
  // ── 촉
  법정: [
    sig2("정군산의 때", (t) => `2칸 안 아군이 체력이 절반 이하인 적을 치면 피해 ${T(t, 12)}% 증가.`, { onAllyAttack(ctx, h, p) { if (hpRate(ctx.defender) <= .5 && engageDistance(h.pos, ctx.attacker.pos) <= 2) ctx.attackMul *= 1 + P(12, p); } }),
    sig2("은혜도 원한도 갚는다", (t) => `받은 피해의 ${T(t, 15)}%를 공격자에게 되돌린다. 자기 차례마다 곁에 붙은 아군의 체력을 3% 회복한다.`, both({ onDefend(ctx, _s, p) { ctx.reflect += P(15, p); } }, turn((u) => { for (const a of around(u, 1, "friend")) heal(a, .03); }))),
    sig2("익주를 바친 책사", (t) => `3칸 안에 유비가 있으면 책략 피해 ${T(t, 20)}% 증가, 책략 명중 +10%p.`, both(atk(20, (c, s) => strat(c) && near(s, "유비", 3)), aim(10, (c, s) => strat(c) && near(s, "유비", 3)))),
  ],
  장저: [
    sig2("적진에 홀로 남은 부장", (t) => `홀로 적에게 에워싸여 곁에 붙은 적이 둘 이상이면 회피 +${T(t, 10)}%p, 받는 물리 피해 5% 감소.`, both(dodge(10, (_c, s) => around(s, 1, "foe").length >= 2), def(5, (c, s) => phys(c) && around(s, 1, "foe").length >= 2))),
    sig2("조운의 부장", (t) => `2칸 안에 조운이 있으면 받는 피해 ${T(t, 18)}% 감소.`, def(18, (_c, s) => near(s, "조운"))),
    sig2("한수의 구출", (t) => `체력이 30% 이하로 떨어지면 자기 차례에 스스로 견고해지고 체력을 ${T(t, 15)}% 회복한다(전투당 한 번).`, turn((u, p) => { if (hpRate(u) <= .3 && once(u, "장저")) { give(u, u, "guard", 2); heal(u, P(15, p)); } })),
  ],
  // ── 오
  하제: [
    sig2("산월 평정", (t) => `산지·숲 칸에서 주는 피해 ${T(t, 15)}% 증가.`, atk(15, (_c, s) => onTerrain(s, "mountain", "forest"))),
    sig2("화려한 군장", () => `자기 차례마다 2칸 안 적 모두를 낙담시킨다(사기 감소).`, turn((u) => { for (const e of around(u, 2, "foe")) give(u, e, "dispirit", 1); })),
    sig2("동구의 강 방어", (t) => `물가에서 받는 물리 피해 ${T(t, 15)}% 감소, 명중 +${T(t, 8)}%p.`, both(def(15, (c, s) => phys(c) && byWater(s)), aim(8, (_c, s) => byWater(s)))),
  ],
  // ── 촉(가정)
  장휴: [
    sig2("가정의 아문장", (t) => `산지·구릉에서 받는 물리 피해 ${T(t, 12)}% 감소.`, def(12, (c, s) => phys(c) && onTerrain(s, "mountain", "hill"))),
    sig2("마속의 명령", (t) => `2칸 안에 마속이 있으면 주는 피해 ${T(t, 15)}% 증가.`, atk(15, (_c, s) => near(s, "마속"))),
    sig2("물길 끊긴 산상", (t) => `곁에 붙은 아군이 없고 체력이 절반 이하이면 물리 피해 ${T(t, 25)}% 증가.`, atk(25, (c, s) => phys(c) && hpRate(s) <= .5 && !around(s, 1, "friend").length)),
  ],
  이성: [
    sig2("가정의 창진", (t) => `기병·코끼리 부대에게 받는 물리 피해 ${T(t, 18)}% 감소.`, def(18, (c) => phys(c) && mounted(c.attacker))),
    sig2("장휴와 나란히", (t) => `2칸 안에 장휴나 황습이 있으면 물리 피해 ${T(t, 15)}% 증가.`, atk(15, (c, s) => phys(c) && (near(s, "장휴") || near(s, "황습")))),
    sig2("산상의 마지막 창", (t) => `체력 30% 이하에서 반격을 받지 않고 물리 피해 ${T(t, 15)}% 증가.`, { onAttack(ctx, s, p) { if (phys(ctx) && hpRate(s) <= .3) { ctx.attackMul *= 1 + P(15, p); ctx.suppressCounter = true; } } }),
  ],
  황습: [
    sig2("가정의 궁수", (t) => `산지·구릉에서 두 칸 이상 떨어진 적을 쏘면 명중 +${T(t, 12)}%p.`, aim(12, (c, s) => c.distance >= 2 && onTerrain(s, "mountain", "hill"))),
    sig2("빼앗긴 군권", (t) => `곁에 붙은 아군이 없으면 회심 확률 +${T(t, 12)}%p.`, crit(12, (_c, s) => !around(s, 1, "friend").length)),
    sig2("왕평을 따라", (t) => `2칸 안에 왕평이 있으면 받는 피해 ${T(t, 15)}% 감소, 명중 +${T(t, 10)}%p.`, both(def(15, (_c, s) => near(s, "왕평")), aim(10, (_c, s) => near(s, "왕평")))),
  ],
  // ── 오
  주환: [
    sig2("유수의 수비", (t) => `3칸 안 적이 아군보다 많으면 받는 피해 ${T(t, 15)}% 감소.`, def(15, (_c, s) => around(s, 3, "foe").length > around(s, 3, "friend").length)),
    sig2("조인을 물리치다", (t) => `이름있는 적 장수에게 받은 물리 피해의 ${T(t, 15)}%를 되돌린다.`, { onDefend(ctx, _s, p) { if (phys(ctx) && isNamedOfficer(ctx.attacker)) ctx.reflect += P(15, p); } }),
    sig2("석정의 퇴로 차단", (t) => `체력이 절반 이하인 적을 치면 명중 +${T(t, 10)}%p, 회심 확률 +${T(t, 10)}%p.`, both(aim(10, (c) => hpRate(c.defender) <= .5), crit(10, (c) => hpRate(c.defender) <= .5))),
  ],
  고승: [
    sig2("고옹의 손자", (t) => `받는 책략 피해 ${T(t, 10)}% 감소. 자기 차례마다 자신의 봉인·지체를 푼다.`, both(def(10, (c) => strat(c)), turn((u) => cleanse(u, ["seal", "sluggish"])))),
    sig2("작피의 방진", (t) => `곁에 붙은 아군이 둘 이상이면 받는 피해 ${T(t, 12)}% 감소.`, def(12, (_c, s) => around(s, 1, "friend").length >= 2)),
    sig2("작피에서 막아서다", (t) => `체력이 가득한 적에게 물리 명중 +${T(t, 10)}%p, 피해 ${T(t, 12)}% 증가.`, both(aim(10, (c) => phys(c) && c.defender.hp >= c.defender.stats.maxHp), atk(12, (c) => phys(c) && c.defender.hp >= c.defender.stats.maxHp))),
  ],
};
export default SET;
