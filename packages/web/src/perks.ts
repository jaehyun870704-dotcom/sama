/**
 * 전투 보정 묶음(연구·장수 효과) — 둘 다 결국 '어떤 특성을 몇만큼'이다.
 * 같은 특성을 연구와 장수 효과에서 함께 받으면 수치가 더해진다(회심 10 + 5 = 15).
 * 전투를 열 때 배치(Deployment)에 그 순간의 값을 적어 두므로, 저장된 전투를 다시 돌려도 같은 결과가 나온다.
 */
import type {BattleState,Unit} from '../../core/src/index.ts';
import {allTraitIds} from '../../core/src/index.ts';

/** [특성 id, 수치] */
export type PerkGrant=[string,number];
export interface PerkGrants {
  /** 아군 전원(연구) */
  all:PerkGrant[];
  /** 장수 이름 → 그 장수만(장수 효과) */
  byName:Record<string,PerkGrant[]>;
}

/** 특성 하나를 입힌다. 이미 있으면 수치를 더한다. */
export function grantPerk(u:Unit,id:string,param:number){
  if(!u.traits.includes(id))u.traits.push(id);
  u.traitParams[id]=(u.traitParams[id]??0)+param;
}
/** 전장의 아군에게 연구·장수 효과를 입힌다. */
export function applyPerkGrants(state:BattleState,g:PerkGrants){
  for(const u of state.living('player')){
    for(const [id,n] of g.all)grantPerk(u,id,n);
    for(const [id,n] of g.byName[u.name]??[])grantPerk(u,id,n);
  }
}
/** 저장된 보정이 올바른가(알 수 없는 특성·터무니없는 수치는 거절). */
export function validGrants(g:unknown):g is PerkGrants{
  if(!g||typeof g!=='object')return false;
  const x=g as PerkGrants,ids=new Set(allTraitIds());
  const ok=(list:unknown)=>Array.isArray(list)&&list.length<=40&&list.every(p=>Array.isArray(p)&&p.length===2&&typeof p[0]==='string'&&ids.has(p[0])&&Number.isFinite(p[1])&&Math.abs(p[1])<=200);
  return ok(x.all)&&!!x.byName&&typeof x.byName==='object'&&Object.keys(x.byName).length<=40&&Object.values(x.byName).every(ok);
}

/** 화면에 보일 이름·설명(수치는 n). */
export const PERK_TEXT:Record<string,{name:string;text:(n:number)=>string}>={
  physicalPower:{name:'무위',text:n=>`물리 공격 피해 +${n}%`},
  strategyPower:{name:'책략 위력',text:n=>`책략 공격 피해 +${n}%`},
  physicalDamageReduction:{name:'갑주',text:n=>`받는 물리 피해 -${n}%`},
  strategyDamageReduction:{name:'정신 수양',text:n=>`받는 책략 피해 -${n}%`},
  critical:{name:'회심',text:n=>`회심(1.5배) 확률 +${n}%`},
  penetrate:{name:'관통',text:n=>`적 방어 ${n}% 무시`},
  counterBoost:{name:'반격 강화',text:n=>`반격 위력 +${n}%`},
  lifesteal:{name:'흡혈',text:n=>`입힌 피해의 ${n}% 회복`},
  veteran:{name:'역전용사',text:n=>`체력 절반 이하에서 받는 피해 -${n}%`},
  lastStand:{name:'배수의 진',text:n=>`체력이 낮을수록 공격력 상승(최대 +${n}%)`},
  turnaround:{name:'전화위복',text:n=>`체력 절반 이하에서 공격력 +${n}%`},
  strategyEvasion:{name:'간파',text:n=>`적 책략 명중 -${n}%p`},
  healPower:{name:'의술',text:n=>`회복량 +${n}%`},
  defenseBoost:{name:'신중',text:n=>`받는 모든 피해 -${n}%`},
  accuracyBoost:{name:'정조',text:n=>`명중 +${n}%p`},
  evasionBoost:{name:'몸놀림',text:n=>`적 명중 -${n}%p`},
  regen:{name:'재정비',text:n=>`차례 시작에 체력 ${n}% 회복`},
  manaRegen:{name:'정심',text:n=>`차례 시작에 MP ${n} 회복`},
  chargePower:{name:'돌격 숙련',text:n=>`움직인 뒤 물리 공격 피해 +${n}%`},
  rangedPower:{name:'원거리 숙련',text:n=>`두 칸 이상 물리 공격 피해 +${n}%`},
  meleePower:{name:'근접 숙련',text:n=>`붙어서 물리 공격 피해 +${n}%`},
};
export const perkText=(id:string,n:number)=>PERK_TEXT[id]?.text(n)??`${id} ${n}`;
