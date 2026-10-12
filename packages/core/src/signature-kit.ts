/**
 * 고유특성 도구: 고유특성을 짓는 데 쓰는 조건·훅 조각(signatures.ts와 장수 묶음 파일 signatures-*.ts가 함께 쓴다).
 */
import type { Unit, UnitClass, StatusKind } from "./types.ts";
import { defineTrait, fieldOf, combine, type DamageContext, type TraitHooks } from "./traits.ts";
import { familyOf } from "./classes.ts";
import { engageDistance } from "./reach.ts";

export const TIER_MUL = [1, 1.3, 1.6, 2] as const;
/** 병종 단계 → 수치 배율 */
export const sigMul = (tier: number) => TIER_MUL[Math.max(1, Math.min(4, Math.round(tier || 1))) - 1]!;
export const pct = (x: number, k: number) => Math.round(x * k);

export const MOUNTED = new Set<string>(["cavalry", "heavyCav", "horseArcher"]);
export const RANGED = new Set<string>(["archer", "crossbow", "horseArcher", "catapult", "navy"]);
export const FOOT = new Set<string>(["infantry", "spearman"]);
export const fam = (c: UnitClass) => familyOf(c) as string;
export const mounted = (u: Unit) => MOUNTED.has(fam(u.unitClass));
export const ranged = (u: Unit) => RANGED.has(fam(u.unitClass));
export const foot = (u: Unit) => FOOT.has(fam(u.unitClass));
export const caster = (u: Unit) => u.stats.maxMp > 0 && u.strategies.length > 0;
export const friends = (a: Unit, b: Unit) => (a.side === "enemy") === (b.side === "enemy");
/** 이름있는 장수(고유특성이나 이름난 장수 표식이 있는 부대) */
export const isNamedOfficer = (u: Unit) => u.famedReach === true || u.traits.some((t) => t.startsWith("sig:"));

export function around(self: Unit, r: number, pick: "friend" | "foe"): Unit[] {
  const f = fieldOf(self);
  if (!f) return [];
  const out: Unit[] = [];
  for (const u of f.units.values()) {
    if (!u.alive || u === self) continue;
    if ((pick === "friend") !== friends(self, u)) continue;
    if (engageDistance(self.pos, u.pos) <= r) out.push(u);
  }
  return out;
}
export function terrainOf(u: Unit): string | undefined {
  const f = fieldOf(u);
  return f && f.map.inBounds(u.pos) ? f.map.tileAt(u.pos).terrain : undefined;
}
export const WET = new Set(["water", "ford", "rapids"]);
/** 물 칸 위나 물 칸 바로 옆 */
export function byWater(u: Unit): boolean {
  const f = fieldOf(u);
  if (!f) return false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const c = { x: u.pos.x + dx, y: u.pos.y + dy };
    if (f.map.inBounds(c) && WET.has(f.map.tileAt(c).terrain)) return true;
  }
  return false;
}
export const turnOf = (u: Unit) => fieldOf(u)?.turn ?? 1;
export const hpRate = (u: Unit) => u.hp / Math.max(1, u.stats.maxHp);
export const phys = (ctx: DamageContext) => ctx.kind === "physical";
export const strat = (ctx: DamageContext) => ctx.kind === "strategy";
export function give(self: Unit, target: Unit, kind: StatusKind, turns: number, magnitude = 1) {
  fieldOf(self)?.applyStatus(target, { kind, turns, magnitude });
}
export function heal(u: Unit, rate: number) {
  if (u.hp >= u.stats.maxHp) return;
  u.hp = Math.min(u.stats.maxHp, u.hp + Math.max(1, Math.round(u.stats.maxHp * rate)));
}
export const NEGATIVE: StatusKind[] = ["confusion", "immobile", "bound", "bleed", "burn", "shock", "seal", "weaken", "breach", "slow", "sluggish", "dispirit"];
export function cleanse(u: Unit, kinds: readonly StatusKind[] = NEGATIVE) {
  u.statuses = u.statuses.filter((s) => !kinds.includes(s.kind));
}
/** 전투당 한 번: 장수의 traitParams에 표시해 둔다. */
export function once(u: Unit, key: string): boolean {
  const k = `once:${key}`;
  if (u.traitParams[k]) return false;
  u.traitParams[k] = 1;
  return true;
}

export interface Signature {
  /** 고유특성 이름 */
  readonly name: string;
  /** 지금 단계의 설명 */
  text(tier?: number): string;
  readonly hooks: TraitHooks;
}



export const N = (x: number, p: number) => pct(x, sigMul(p));
export const P = (x: number, p: number) => N(x, p) / 100;
export type Cond = (ctx: DamageContext, self: Unit) => boolean;
export const always: Cond = () => true;
/** 조건이 맞으면 주는 피해 x% 증가 */
export const atk = (x: number, c: Cond = always): TraitHooks => ({ onAttack(ctx, s, p) { if (c(ctx, s)) ctx.attackMul *= 1 + P(x, p); } });
/** 조건이 맞으면 받는 피해 x% 감소 */
export const def = (x: number, c: Cond = always): TraitHooks => ({ onDefend(ctx, s, p) { if (c(ctx, s)) ctx.reduction = combine(ctx.reduction, P(x, p)); } });
export const crit = (x: number, c: Cond = always): TraitHooks => ({ onAttack(ctx, s, p) { if (c(ctx, s)) ctx.criticalChance += N(x, p); } });
export const aim = (x: number, c: Cond = always): TraitHooks => ({ onAttack(ctx, s, p) { if (c(ctx, s)) ctx.accuracyMod += N(x, p); } });
export const dodge = (x: number, c: Cond = always): TraitHooks => ({ onDefend(ctx, s, p) { if (c(ctx, s)) ctx.accuracyMod -= N(x, p); } });
export const pierce = (x: number, c: Cond = always): TraitHooks => ({ onAttack(ctx, s, p) { if (c(ctx, s)) ctx.defenseIgnore = Math.max(ctx.defenseIgnore, P(x, p)); } });
export const turn = (f: (u: Unit, p: number) => void): TraitHooks => ({ onTurnStart: f });
/** 훅 여러 개를 하나로 */
export function both(...hs: TraitHooks[]): TraitHooks {
  const out: TraitHooks = {};
  for (const k of ["onAttack", "onDefend", "onTurnStart", "onAllyAttack", "onAllyDefend"] as const) {
    const fs = hs.map((h) => h[k]).filter(Boolean) as Array<(...a: unknown[]) => void>;
    if (fs.length) (out as Record<string, unknown>)[k] = (...a: unknown[]) => { for (const f of fs) f(...a); };
  }
  for (const h of hs) { if (h.redirectsAdjacentDamage) out.redirectsAdjacentDamage = true; if (h.ignoresRoughTerrain) out.ignoresRoughTerrain = true; if (h.alwaysDouble) out.alwaysDouble = true; }
  return out;
}
export const fire = (ctx: DamageContext) => ctx.kind === "strategy" && ctx.element === "fire";
export const onTerrain = (u: Unit, ...t: string[]) => t.includes(terrainOf(u) ?? "");
export const fort = (u: Unit) => onTerrain(u, "fort", "gate");
export const near = (u: Unit, name: string, r = 2) => around(u, r, "friend").some((a) => a.name === name);
export const sig2 = (name: string, text: (t?: number) => string, hooks: TraitHooks): Signature => ({ name, text, hooks });
export const T = (t: number | undefined, x: number) => pct(x, sigMul(t ?? 1));
export const early = (n: number) => (u: Unit) => { if (turnOf(u) <= n) give(u, u, "haste", 1, 2); };

