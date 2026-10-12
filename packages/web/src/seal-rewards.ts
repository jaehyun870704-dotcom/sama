/**
 * 연의 천명 보상(옛 인장 보상) — 편(상·중·하)마다 모은 연의 천명 수가 문턱을 넘으면 보상을 받는다. 연의 천명은 처음 얻을 때마다 쓸 천명 1도 준다(meta.ts paySeals).
 * 구조는 조조전 Online의 '연의 인장 보상'을 참고했고(편별 누적 인장 → 단계 보상), 수치·보상은 이 게임이 정했다.
 * 보상: 연의 장수 모두의 경험치 + 사마의전 금 + 소모품(마지막 단계에는 인수와 상점에서 팔지 않는 복숭아·술).
 */
import {OFFICERS,addGold,addSupply,type Campaign} from './progression.ts';
import {consumable} from '../../core/src/index.ts';

export const SEAL_ARCS=[{pre:'S1',name:'상편'},{pre:'S2',name:'중편'},{pre:'S3',name:'하편'}] as const;
export interface SealTier {key:string;arc:string;need:number;xp:number;gold:number;supplies:Record<string,number>}
const TIER_SUPPLIES:Array<Record<string,number>>=[{bean:3,rice:1},{rice:2,water:2,panacea:1},{peach:1,wine:1,promotion:1}];
/** 편의 인장 최대치(장 수 × 일반 3 + 극한 3)에서 1/3 · 2/3 · 전부를 문턱으로 삼는다. */
export function sealTiers(arcIndex:number,stages:number):SealTier[]{
  const a=SEAL_ARCS[arcIndex]!,max=stages*6;
  return [1/3,2/3,1].map((f,k)=>{const need=Math.ceil(max*f);return {key:`${a.pre}:${need}`,arc:a.name,need,xp:(k+1)*(arcIndex+2)*60,gold:(k+1)*(arcIndex+1)*400,supplies:{...TIER_SUPPLIES[k]!}};});
}
/** 보상 한 줄(경험치 밖): 금과 소모품. */
export function sealRewardText(t:Pick<SealTier,'gold'|'supplies'>){
  return [`금 ${t.gold.toLocaleString()}`,...Object.entries(t.supplies).map(([id,n])=>`${consumable(id)?.name??id} ${n}개`)].join(' · ');
}
export function sealClaimed(c:Pick<Campaign,'sealRewards'>,key:string){return (c.sealRewards??[]).includes(key);}
/** 보상 받기: 연의 장수 모두 경험치 + 금 + 소모품. 이미 받았거나 인장이 모자라면 null. */
export function claimSealTier(c:Campaign,tier:SealTier,have:number){
  if(have<tier.need||sealClaimed(c,tier.key))return null;
  for(const id of OFFICERS)c.xp[id]=(c.xp[id]??0)+tier.xp;
  addGold(c,'S',tier.gold);for(const [id,n] of Object.entries(tier.supplies))addSupply(c,id,n);
  c.sealRewards=[...(c.sealRewards??[]),tier.key];
  return {xp:tier.xp,gold:tier.gold,text:sealRewardText(tier)};
}
