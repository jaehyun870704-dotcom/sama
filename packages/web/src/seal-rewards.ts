/**
 * 연의 천명 보상(옛 인장 보상) — 편(상·중·하)마다 모은 연의 천명 수가 문턱을 넘으면 보상을 받는다. 연의 천명은 처음 얻을 때마다 쓸 천명 1도 준다(meta.ts paySeals).
 * 구조는 조조전 Online의 '연의 인장 보상'을 참고했고(편별 누적 인장 → 단계 보상), 수치·보상은 이 게임이 정했다.
 * 보상: 연의 장수 모두의 경험치 + 사마의전 금 + 소모품(마지막 단계에는 인수와 상점에서 팔지 않는 복숭아·술).
 */
import {OFFICERS,addGold,addSupply,newShopItem,type Campaign,type Story} from './progression.ts';
import {consumable,gearDef} from '../../core/src/index.ts';

export const SEAL_ARCS=[{pre:'S1',name:'상편'},{pre:'S2',name:'중편'},{pre:'S3',name:'하편'}] as const;
export interface SealTier {key:string;arc:string;need:number;xp:number;gold:number;supplies:Record<string,number>;
  /** 금을 받는 이야기(없으면 사마의전) */
  story?:Story;
  /** 상점 장비(종류·등급 id, 낱개는 받을 때 새로 만든다) — 제갈량전 보상 */
  gear?:string[]}
const TIER_SUPPLIES:Array<Record<string,number>>=[{bean:3,rice:1},{rice:2,water:2,panacea:1},{peach:1,wine:1,promotion:1}];
/** 편의 인장 최대치(장 수 × 일반 3 + 극한 3)에서 1/3 · 2/3 · 전부를 문턱으로 삼는다. */
export function sealTiers(arcIndex:number,stages:number):SealTier[]{
  const a=SEAL_ARCS[arcIndex]!,max=stages*6;
  return [1/3,2/3,1].map((f,k)=>{const need=Math.ceil(max*f);return {key:`${a.pre}:${need}`,arc:a.name,need,xp:(k+1)*(arcIndex+2)*60,gold:(k+1)*(arcIndex+1)*400,supplies:{...TIER_SUPPLIES[k]!}};});
}
/** 보상 한 줄(경험치 밖): 금과 상점 장비·소모품. */
export function sealRewardText(t:Pick<SealTier,'gold'|'supplies'|'gear'>){
  return [`금 ${t.gold.toLocaleString()}`,...(t.gear??[]).map(id=>gearDef(id)?.name??id),...Object.entries(t.supplies).map(([id,n])=>`${consumable(id)?.name??id} ${n}개`)].join(' · ');
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

/**
 * 제갈량전 천명 보상 — 사마의전과 같은 틀(편마다 연의 천명 1/3 · 2/3 · 전부)을 상편(Z1)·하편(Z2) 두 편에 둔다.
 * 보상: 제갈량전 장수(제갈량과 기록이 있는 장수) 경험치 + 제갈량전 금 + 상점 장비 한 점 + 소모품.
 * 경험치·금·소모품 수치는 사마의전의 같은 편 번호와 같다(상편 = 사마의전 상편, 하편 = 사마의전 중편).
 * 장비는 그 편에서 자주 서는 계통(책사·옷 입는 계통, 갑옷 계통)에 맞춰 골랐다. 받은 칸은 Campaign.sealRewards에 'Z1:30' 꼴로 남는다.
 */
export const ZHUGE_SEAL_ARCS=[{pre:'Z1',name:'상편'},{pre:'Z2',name:'하편'}] as const;
const ZHUGE_TIER_GEAR:ReadonlyArray<readonly string[]>=[
  ['shop:fan:2','shop:gloves:2','shop:robe:3'],
  ['shop:armor:3','shop:helmet:3','shop:fan:4'],
];
export function zhugeSealTiers(arcIndex:number,stages:number):SealTier[]{
  const a=ZHUGE_SEAL_ARCS[arcIndex]!;
  return sealTiers(arcIndex,stages).map((t,k)=>({...t,key:`${a.pre}:${t.need}`,arc:a.name,story:'Z' as const,gear:[ZHUGE_TIER_GEAR[arcIndex]![k]!]}));
}
/** 제갈량전 보상 받기: names(제갈량전 장수 이름) 모두 경험치 + 제갈량전 금 + 상점 장비 + 소모품. 이미 받았거나 천명이 모자라면 null. */
export function claimZhugeSealTier(c:Campaign,tier:SealTier,have:number,names:readonly string[]){
  if(have<tier.need||sealClaimed(c,tier.key)||!/^Z[12]:/.test(tier.key))return null;
  const r=c.retinueXp??={};for(const n of new Set(names))r[n]=(r[n]??0)+tier.xp;
  addGold(c,'Z',tier.gold);for(const [id,n] of Object.entries(tier.supplies))addSupply(c,id,n);
  const items=(tier.gear??[]).filter(id=>gearDef(id)&&!gearDef(id)!.named).map(id=>newShopItem(c,id));
  c.sealRewards=[...(c.sealRewards??[]),tier.key];
  return {xp:tier.xp,gold:tier.gold,items,text:sealRewardText(tier)};
}
