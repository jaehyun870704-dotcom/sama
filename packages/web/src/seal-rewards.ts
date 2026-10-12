/**
 * 연의 천명 보상(옛 인장 보상) — 편(상·중·하)마다 모은 연의 천명 수가 문턱을 넘으면 보상을 받는다. 연의 천명은 처음 얻을 때마다 쓸 천명 1도 준다(meta.ts paySeals).
 * 구조는 조조전 Online의 '연의 인장 보상'을 참고했고(편별 누적 인장 → 단계 보상), 수치·보상은 이 게임이 정했다.
 * 재화는 쓰지 않는다: 보상은 연의 장수 모두의 경험치와, 보물 사냥에서 나오는 보물 하나.
 */
import {OFFICERS,treasures,type Campaign} from './progression.ts';

export const SEAL_ARCS=[{pre:'S1',name:'상편'},{pre:'S2',name:'중편'},{pre:'S3',name:'하편'}] as const;
export interface SealTier {key:string;arc:string;need:number;xp:number}
/** 편의 인장 최대치(장 수 × 일반 3 + 극한 3)에서 1/3 · 2/3 · 전부를 문턱으로 삼는다. */
export function sealTiers(arcIndex:number,stages:number):SealTier[]{
  const a=SEAL_ARCS[arcIndex]!,max=stages*6;
  return [1/3,2/3,1].map((f,k)=>{const need=Math.ceil(max*f);return {key:`${a.pre}:${need}`,arc:a.name,need,xp:(k+1)*(arcIndex+2)*60};});
}
/** 받을 보물: 아직 없는 '보물 사냥' 보물 가운데 하나(보상 칸마다 정해져 있다). */
export function sealTreasure(c:Pick<Campaign,'treasures'>,key:string){
  const pool=treasures.filter(t=>t.quest?.startsWith('R')&&!c.treasures.includes(t.id));if(!pool.length)return undefined;
  let h=7;for(const ch of key)h=(h*31+ch.charCodeAt(0))>>>0;return pool[h%pool.length]!.id;
}
export function sealClaimed(c:Pick<Campaign,'sealRewards'>,key:string){return (c.sealRewards??[]).includes(key);}
/** 보상 받기: 연의 장수 모두 경험치 + 보물 하나. 이미 받았거나 인장이 모자라면 null. */
export function claimSealTier(c:Campaign,tier:SealTier,have:number){
  if(have<tier.need||sealClaimed(c,tier.key))return null;
  for(const id of OFFICERS)c.xp[id]=(c.xp[id]??0)+tier.xp;
  const treasure=sealTreasure(c,tier.key);if(treasure)c.treasures.push(treasure);
  c.sealRewards=[...(c.sealRewards??[]),tier.key];
  return {xp:tier.xp,...(treasure?{treasure}:{})};
}
