import type {RunBattleRef,RunStoryRef} from './roguelike.ts';
import {NAMED_GEAR,GEAR_KINDS,GRADE_NAMES,gearDef,gearStats,gearAllowed,gearLevelFromExp,gearPowerText,isShopGear,shopEquivalent,consumable,CONSUMABLES,maxLevelOf} from '../../core/src/index.ts';
import type {Difficulty,Unit,UnitClass,GearSlot as CoreGearSlot,GearGrade,GearKind,GearStat} from '../../core/src/index.ts';
import {NAMED_ENTRIES} from './treasure-catalogue.ts';
import {legacyGear} from './gear-migration.ts';
import {officerClass} from './officer-perks.ts';

export const OFFICERS=['sima_yi','sima_lang','sima_fang','cao_zhen'] as const;
/** 이야기(재화를 따로 쓰는 단위): S 사마의전 · Z 제갈량전. */
export type Story='S'|'Z';
export interface Campaign {version:1; xp:Record<string,number>; rewards:string[];
  /** 보관함: 고유 보물 id와 상점 장비 낱개 id(`shop:<종류>:<등급>#<번호>`). */
  treasures:string[]; equipped:Record<string,string>;loadouts?:Record<string,Partial<Record<GearSlot,string>>>;completedRuns?:string[];trainingWins?:number;quests?:string[];/** 넘은 도전 단계(C01~C10) */challenges?:string[];/** 반복 퀘스트(보물 사냥) 승리 수 */bountyWins?:number;/** 받은 연의 천명(옛 인장) 보상(S1:22 · 제갈량전 Z1:30 꼴) */sealRewards?:string[];/** 등용 장수의 누적 경험치(이름 → 경험치) */retinueXp?:Record<string,number>;
  /** 금: 이야기마다 따로(없으면 아직 셈하지 않은 예전 저장 — 시작 금 1000). */
  gold?:Partial<Record<Story,number>>;
  /** 부대 공용 소모품(소모품 id → 개수). */
  supplies?:Record<string,number>;
  /** 장비 경험치(장비 낱개 id → 누적 경험치). 보조구는 레벨이 없다. */
  gearExp?:Record<string,number>;
  /** 다음에 살 상점 장비의 낱개 번호 */
  shopSerial?:number;
  /** 첫 승리 보상을 받은 수련장(T01 꼴) */
  trained?:string[]}
export interface Growth {storyWins:number;trainingWins:number;questWins:number}
/** 시나리오 모드의 장: 장 id와 대사 선택이 남긴 전투 효과. */
export interface ScenarioDeployment {chapter:string;mods?:import('./roguelike.ts').BattleMods;/** 가상 전장을 극한으로 */difficulty?:'extreme';/** 로그라이크 회차: 연의 장에 들고 가는 보물과 사마의의 남은 체력 */relics?:string[];heroHp?:number;/** 회차에서 영입한 장수(연의 장에 함께 나선다, 최대 3) */recruits?:import('./roguelike.ts').RunUnit[]}
export interface Deployment {scenario?:ScenarioDeployment;/** 연의 이야기에서 고른 대사·대결 승리의 효과(사기·방어 태세·책략 MP) */storyMods?:Pick<import('./roguelike.ts').BattleMods,'rally'|'guard'|'insight'>;/** 연의 지도의 선택분기 전투(가상 전장 id 또는 'boss:<길 id>') */branch?:string;/** 연의 장에 데려가는 등용 장수(본편 · 최대 2명) */retinue?:import('./roguelike.ts').RunUnit[];/** 연구·장수 효과(출진 순간의 값) */perks?:import('./perks.ts').PerkGrants;/** 연의 장에 더 데려가는 장수(필수 장수 밖) */extraOfficers?:string[];treasureRules?:1;/** 넓은 전장(연의 지도 1.5배 · 이동 +2) — 새로 시작한 전투만. 2는 큰 전투(중편 후반·하편의 복잡한 장에 아군·적군 증원)까지 */wide?:1|2;/** 천명의 시련(로그라이크 난이도): 적 체력 +20%·공격 +12%·방어 +10% — 연구로 이겨낸다 */trial?:1;/** 천명의 원정 전투 (로그라이크) */run?:RunBattleRef;/** 원정 안의 연의 전장 */runStory?:RunStoryRef;levels:Record<string,number>;/** 연의 장수의 이번 레벨 안 경험치(전투 중에 싸워서 번 경험치가 여기서부터 쌓인다) */xp?:Record<string,number>;equipped:Record<string,string>;loadouts?:Record<string,Partial<Record<GearSlot,string>>>;growth?:Growth;mission?:{id:string;runId:string;version?:2|3|4;balance?:1;supportClasses?:UnitClass[]};
  /** 출진 순간의 장비 레벨(장비 id → 레벨). 없으면 1. */
  gearLevels?:Record<string,number>;
  /** 출진 순간의 부대 보관함 소모품(전투 중 「도구」로 꺼내 쓴다). */
  supplies?:Record<string,number>;
  /** 새 장비 체계(고유 보물 50 · 상점 장비 · 장비 레벨)로 만든 출진. 없으면 그 전의 저장이다. */
  gearRules?:2;
  /** 극한 다시 맞춤(2026-10-13) 뒤에 만든 출진: 사마의전·제갈량전 본편 극한의 적이 더 세고 턴 제한이 걸린다(`foeEdgesExtreme`·`turnLimitsExtreme`, 제갈량전은 …Z 표). 없으면 그 전의 저장이다. */
  extremeRules?:1}
export type GearSlot=CoreGearSlot;
/** 고유 보물(이름 있는 보물) 한 점: 도감·정비·상점이 보는 꼴. */
export interface Treasure {id:string;name:string;
  /** 사마의전에서 얻는 곳(연의 장 id 또는 연무장 외전 id) */stage:string;
  /** 제갈량전에서 얻는 곳(장 id) */zstage:string;
  glyph:string;effect:string;description:string;bonus:Partial<Unit['stats']>;slot:GearSlot;grade:number;kind:GearKind;
  /** 연무장 외전에서 얻으면 그 외전 id */quest?:string}
const STAT_KO:Record<string,string>={attack:'공격',defense:'방어',maxHp:'최대 체력',maxMp:'최대 MP',intellect:'책략력',spirit:'정신',agility:'민첩',movement:'이동'};
export const statText=(b:Partial<Record<string,number>>)=>Object.entries(b).filter(([,v])=>v).map(([k,v])=>`${STAT_KO[k]??k} +${v}`).join(' · ');
/** 고유 보물 50점(번호 순). */
export const treasures:Treasure[]=NAMED_GEAR.map(d=>{const e=NAMED_ENTRIES[d.id]!,bonus=gearStats(d,1);
  return {id:d.id,name:d.name,stage:e.s,zstage:e.z,glyph:d.name.slice(0,1),bonus,effect:[statText(bonus),gearPowerText(d.id)].filter(Boolean).join(' · '),description:e.description,slot:GEAR_KINDS[d.kind].slot,grade:d.grade,kind:d.kind,...(/^[QRCT]\d{2}$/.test(e.s)?{quest:e.s}:{})};});
export const gearNames:Record<GearSlot,string>={weapon:'무기',armor:'방어구',accessory:'보조구'};
export const isNamedGear=(id:string)=>!!gearDef(id)?.named;
/** 장비 한 점(고유 보물 또는 상점 장비 낱개)의 칸·등급·종류·이름. 알 수 없는 id는 무기 1등급으로 돌려준다. */
export function treasureInfo(id:string){const d=gearDef(id);const grade=(d?.grade??1) as GearGrade;
  return {slot:(d?GEAR_KINDS[d.kind].slot:'weapon') as GearSlot,grade,rarity:GRADE_NAMES[grade],kind:(d?.kind??'sword') as GearKind,name:d?.name??id,named:!!d?.named,price:d?.price??0};}
export const gearName=(id:string)=>gearDef(id)?.name??id;
/** 장비의 지금 레벨(장비 경험치로). */
export function gearLevel(c:Pick<Campaign,'gearExp'>,id:string){const d=gearDef(id);return d?gearLevelFromExp(d,c.gearExp?.[id]??0):1;}
/** 장비의 능력·고유 기능 한 줄(레벨에 맞춰). */
export function gearEffectText(id:string,level=1){const d=gearDef(id);if(!d)return '';return [statText(gearStats(d,level)),gearPowerText(id)].filter(Boolean).join(' · ');}
export function equippedItems(c:Pick<Campaign,'equipped'|'loadouts'>,id:string){return c.loadouts?.[id]?Object.values(c.loadouts[id]!).filter((x):x is string=>!!x):c.equipped[id]?[c.equipped[id]!]:[];}
/** 보물을 다는 자리: 연의 장수는 id, 영입 장수·편입 장수 등 그 밖의 사람은 이름. 누구든 장비를 달 수 있다(계통에 맞는 것만). */
const OFFICER_BY_NAME:Record<string,string>={사마의:'sima_yi',사마랑:'sima_lang',사마방:'sima_fang',조진:'cao_zhen'};
/** 연의 장수의 병종(전장에서 서는 병종의 줄기). */
export const OFFICER_CLASS:Readonly<Record<string,UnitClass>>={sima_yi:'strategist',sima_lang:'infantry',sima_fang:'spearman',cao_zhen:'heavyCav'};
export const gearKey=(u:{id:string;name:string})=>(OFFICERS as readonly string[]).includes(u.id)?u.id:OFFICER_BY_NAME[u.name]??u.name;
export const validGearKey=(k:unknown):k is string=>typeof k==='string'&&((OFFICERS as readonly string[]).includes(k)||k.length>0&&k.length<=24&&!/[<>"'&]/.test(k));
/** 장비 자리의 장수 병종: 연의 장수는 정해진 병종, 그 밖은 장수록 병종(진화 단계와 무관하게 계통으로 본다). */
export function gearClassOf(key:string):UnitClass{return OFFICER_CLASS[key]??officerClass(key);}
/** 이 장수(자리)가 이 장비를 달 수 있나. 못 달면 이유. unitClass를 주면 그 병종으로 본다(정비 화면의 실제 병종). */
export function canWear(key:string,id:string,unitClass?:UnitClass){return gearAllowed(id,unitClass??gearClassOf(key));}
export function equipSlot(c:Campaign,officer:string,slot:GearSlot,id:string,unitClass?:UnitClass){
 if(!validGearKey(officer)||!Object.hasOwn(gearNames,slot))return false;
 if(id&&(!c.treasures.includes(id)||treasureInfo(id).slot!==slot||!gearDef(id)||!canWear(officer,id,unitClass).ok))return false;
 if(!c.loadouts){c.loadouts={};for(const [who,item] of Object.entries(c.equipped))if(gearDef(item))c.loadouts[who]={[treasureInfo(item).slot]:item};}
 for(const gear of Object.values(c.loadouts))for(const key of Object.keys(gear) as GearSlot[])if(gear[key]===id&&id)delete gear[key];
 const gear=c.loadouts[officer]??={};if(id)gear[slot]=id;else delete gear[slot];return true;
}
export function freshCampaign():Campaign{return {version:1,xp:{sima_yi:0,sima_lang:100,sima_fang:350,cao_zhen:250},rewards:[],treasures:[],equipped:{}};}
/** 그 레벨이 막 된 순간의 누적 경험치. */
export function xpAtLevel(level:number){let t=0;for(let l=1;l<Math.min(40,level);l++)t+=100+(l-1)*20;return t;}
export function levelInfo(total:number){
  let level=1,remaining=Math.max(0,Math.floor(total));
  while(level<40&&remaining>=100+(level-1)*20){remaining-=100+(level-1)*20;level++;}
  // 40레벨(최고)에서 남는 경험치는 쓸 데가 없다: 0으로 둔다(출진 기록·저장 검사가 1000 미만을 기대한다).
  return {level,xp:level===40?0:remaining,next:level===40?0:100+(level-1)*20};
}
/** 출진 기록에 실을 장비 레벨과 보관함 소모품(전투 재생이 같은 값을 쓰게). */
export function gearDeployment(c:Campaign):Pick<Deployment,'gearLevels'|'supplies'>{
  const ids=new Set<string>([...Object.values(c.equipped),...Object.values(c.loadouts??{}).flatMap(g=>Object.values(g??{}))].filter((x):x is string=>!!x&&!!gearDef(x)));
  const gearLevels:Record<string,number>={};for(const id of ids){const l=gearLevel(c,id);if(l>1)gearLevels[id]=l;}
  const supplies:Record<string,number>={};for(const [k,n] of Object.entries(c.supplies??{}))if(n>0&&consumable(k))supplies[k]=n;
  return {...(Object.keys(gearLevels).length?{gearLevels}:{}),...(Object.keys(supplies).length?{supplies}:{})};
}
export function deployment(c:Campaign,modern=false):Deployment{return {...(modern?{treasureRules:1 as const,extremeRules:1 as const,growth:{storyWins:new Set(c.rewards.filter(r=>r.endsWith(':normal')).map(r=>r.split(':')[0])).size,trainingWins:c.trainingWins??0,questWins:c.quests?.length??0}}:{}),levels:Object.fromEntries(OFFICERS.map(id=>[id,levelInfo(c.xp[id]??0).level])),xp:Object.fromEntries(OFFICERS.map(id=>[id,levelInfo(c.xp[id]??0).xp])),equipped:{...c.equipped},...(c.loadouts?{loadouts:structuredClone(c.loadouts)}:{}),...(modern?gearDeployment(c):{}),gearRules:2};}
/** 고유 보물을 보관함에 넣는다(이미 있으면 그대로). 넣었으면 true. */
export function grantTreasure(c:Campaign,id:string){if(!isNamedGear(id)||c.treasures.includes(id))return false;c.treasures.push(id);return true;}
export function award(c:Campaign,stage:string,difficulty:Difficulty,participants:string[],seals:number[]){
  const id=stage+':'+difficulty;if(c.rewards.includes(id)||!seals.includes(1))return {xp:0,treasure:null as Treasure|null,levels:[] as string[],got:[] as Treasure[]};
  const amount=difficulty==='normal'?140:70,levels:string[]=[];c.rewards.push(id);
  for(const officer of OFFICERS){if(officer!=='sima_yi'&&!participants.includes(officer))continue;const before=levelInfo(c.xp[officer]??0).level;c.xp[officer]=(c.xp[officer]??0)+amount;if(levelInfo(c.xp[officer]!).level>before)levels.push(officer);}
  const treasure=treasures.find(t=>t.stage===stage&&!c.treasures.includes(t.id))??null;
  // 이번에 새로 얻은 보물(획득 장면 차례): 이미 가진 것은 빠진다.
  const got=treasures.filter(t=>t.stage===stage&&grantTreasure(c,t.id));
  return {xp:amount,treasure,levels,got};
}
/** 제갈량전 장을 처음 이겼을 때의 고유 보물(이미 가진 것은 건너뛴다). 새로 얻은 보물을 돌려준다. */
export function awardZhugeTreasures(c:Campaign,stage:string){const got:Treasure[]=[];for(const t of treasures.filter(x=>x.zstage===stage))if(grantTreasure(c,t.id))got.push(t);return got;}
export function equip(c:Campaign,officer:string,id:string){
  if(!OFFICERS.includes(officer as typeof OFFICERS[number]))return false;
  if(!id){delete c.equipped[officer];return true;}
  if(!c.treasures.includes(id)||!gearDef(id)||!canWear(officer,id).ok)return false;
  for(const [other,item] of Object.entries(c.equipped))if(item===id)delete c.equipped[other];
  c.equipped[officer]=id;return true;
}
/**
 * 장비 한 점을 전장의 부대에 입힌다: 레벨에 맞는 능력 + 고유 기능(`gear:*` 특성).
 * 계통에 맞지 않는 장비(병종이 바뀌어 못 쓰게 된 것)는 입히지 않는다. 입혔으면 true.
 */
export function applyTreasure(unit:Unit,id:string|undefined,_uniqueEffects=true,level=1){
  const d=id?gearDef(id):undefined;if(!d||!gearAllowed(id!,unit.unitClass).ok)return false;
  const bonus=gearStats(d,level),gb=unit.gearBonus??={};
  for(const [stat,value] of Object.entries(bonus) as Array<[GearStat,number]>){unit.stats[stat]+=value;gb[stat]=(gb[stat]??0)+value;}
  for(const [t,p] of d.traits??[]){if(!unit.traits.includes(t))unit.traits.push(t);unit.traitParams[t]=Math.max(unit.traitParams[t]??0,p);}
  if(unit.traits.includes('gear:sling'))unit.range=[unit.range[0],Math.max(unit.range[1],2)];
  unit.hp=unit.stats.maxHp;unit.mp=unit.stats.maxMp;return true;
}
/**
 * 성장 기록 칸. 연의(본편)와 천명의 길은 한 칸(main)을 같이 쓴다 — 어느 쪽에서 오른 레벨·얻은 보물이든 양쪽에 그대로 남는다.
 * run은 잠시 따로 저장하던 시절의 칸: 처음 읽을 때 main에 합치고 지운다(mergeCampaigns).
 */
export const CAMPAIGN_KEYS={main:'sama-campaign-v1',run:'sama-campaign-run-v1'} as const;
/**
 * 두 기록 합치기: 장수 경험치·등용 장수 경험치·훈련/사냥 승리는 큰 쪽, 보물·퀘스트·도전·회차·인장 보상은 합집합.
 * 연의 장 보상 기록(rewards)과 장비 배치는 a(연의 쪽)를 따른다 — 연의에서 아직 받지 않은 장 보상을 막지 않게.
 */
export function mergeCampaigns(a:Campaign,b:Campaign):Campaign{
  const out=structuredClone(a),union=(x?:string[],y?:string[])=>[...new Set([...(x??[]),...(y??[])])];
  for(const [id,v] of Object.entries(b.xp))out.xp[id]=Math.max(out.xp[id]??0,v);
  out.treasures=union(a.treasures,b.treasures);out.completedRuns=union(a.completedRuns,b.completedRuns);out.quests=union(a.quests,b.quests);if(a.trained||b.trained)out.trained=union(a.trained,b.trained);out.challenges=union(a.challenges,b.challenges);out.sealRewards=union(a.sealRewards,b.sealRewards);
  out.trainingWins=Math.max(a.trainingWins??0,b.trainingWins??0);out.bountyWins=Math.max(a.bountyWins??0,b.bountyWins??0);
  if(b.retinueXp){const r=out.retinueXp??={};for(const [k,v] of Object.entries(b.retinueXp))r[k]=Math.max(r[k]??0,v);}
  return out;
}
/** 따로 저장하던 천명의 길 칸이 남아 있으면 연의 칸에 합치고 지운다. 합쳤으면 true. */
export function mergeRunCampaign(){
  try{if(localStorage.getItem(CAMPAIGN_KEYS.run)===null)return false;
    writeCampaign(mergeCampaigns(readCampaign(CAMPAIGN_KEYS.main),readCampaign(CAMPAIGN_KEYS.run)));localStorage.removeItem(CAMPAIGN_KEYS.run);return true;
  }catch{return false;}
}
const SHOP_ID=/^shop:([a-zA-Z]+):([1-4])#(\d{1,7})$/;
/** 상점 장비 낱개 id를 새로 만들어 보관함에 넣는다. */
export function newShopItem(c:Campaign,defId:string){const n=(c.shopSerial??0)+1;c.shopSerial=n;const id=defId+'#'+n;c.treasures.push(id);return id;}
/**
 * 예전 저장의 보관함을 새 장비 체계로 옮긴다(장착은 readCampaign이 바뀐 id로 다시 단다).
 *  · 고유 보물 50점은 그대로.
 *  · 지운 보물은 같은 칸·같은 등급의 상점 장비로 바꾼다. 종류는 장착자의 계통에 맞는 것(보관 중이면 칸의 기본 종류).
 * 바꾼 개수와 옛 id → 새 낱개 id를 돌려준다.
 */
export function migrateGear(value:Pick<Campaign,'treasures'|'equipped'|'loadouts'>,clean:Campaign){
  let migrated=0;const plan=new Map<string,string>(),swap=new Map<string,string>();
  const wearerOf=(id:string)=>{for(const [who,gear] of Object.entries(value.loadouts??{}))if(gear&&typeof gear==='object'&&Object.values(gear).includes(id))return who;for(const [who,item] of Object.entries(value.equipped??{}))if(item===id)return who;return undefined;};
  const raw=Array.isArray(value.treasures)?value.treasures.filter((x):x is string=>typeof x==='string'):[];
  for(const id of new Set(raw)){
    if(isNamedGear(id)){clean.treasures.push(id);continue;}
    const m=SHOP_ID.exec(id);if(m&&gearDef(id)){clean.treasures.push(id);clean.shopSerial=Math.max(clean.shopSerial??0,Number(m[3]));continue;}
    const old=legacyGear(id);if(!old)continue;
    const who=wearerOf(id),cls=who&&validGearKey(who)?gearClassOf(who):undefined;
    plan.set(id,shopEquivalent(old.slot,old.grade,cls));migrated++;
  }
  for(const [oldId,defId] of plan)swap.set(oldId,newShopItem(clean,defId));
  return {migrated,swap};
}
export function readCampaign(key:string=CAMPAIGN_KEYS.main):Campaign{
  try{const value=JSON.parse(localStorage.getItem(key)??'null') as Campaign;
    if(value?.version!==1||!value.xp||!Array.isArray(value.rewards)||!Array.isArray(value.treasures)||!value.equipped)return freshCampaign();
    // 값 하나가 망가졌다고 진행 전체를 버리지 않는다: 망가진 칸만 기본값으로 둔다.
    const clean=freshCampaign();for(const id of OFFICERS){const n=value.xp[id];if(typeof n==='number'&&Number.isFinite(n)&&n>=0)clean.xp[id]=Math.min(100000,Math.floor(n));}
    clean.rewards=[...new Set(value.rewards.filter(id=>typeof id==='string'&&/^[SZ][123]-\d{2}:(normal|extreme)$/.test(id)))];
    if(Number.isSafeInteger(value.shopSerial)&&value.shopSerial!>0)clean.shopSerial=value.shopSerial!;
    if(Array.isArray(value.trained)){const t=[...new Set(value.trained.filter(x=>typeof x==='string'&&/^T\d{2}$/.test(x)))];if(t.length)clean.trained=t;}
    const {swap}=migrateGear(value,clean);
    clean.completedRuns=Array.isArray(value.completedRuns)?[...new Set(value.completedRuns.filter(x=>typeof x==='string'&&x.length<100))]:[];clean.trainingWins=Number.isSafeInteger(value.trainingWins)?Math.max(0,value.trainingWins!):0;clean.quests=Array.isArray(value.quests)?[...new Set(value.quests.filter(x=>typeof x==='string'&&/^Q\d{2}$/.test(x)))]:[];clean.challenges=Array.isArray(value.challenges)?[...new Set(value.challenges.filter(x=>typeof x==='string'&&/^C\d{2}$/.test(x)))]:[];clean.bountyWins=Number.isSafeInteger(value.bountyWins)?Math.max(0,value.bountyWins!):0;if(value.retinueXp&&typeof value.retinueXp==='object'){const r:Record<string,number>={};for(const [k,v] of Object.entries(value.retinueXp).slice(0,80))if(k.length>0&&k.length<=12&&Number.isFinite(v)&&v>=0)r[k]=Math.min(100000,Math.floor(v));if(Object.keys(r).length)clean.retinueXp=r;}clean.sealRewards=Array.isArray(value.sealRewards)?[...new Set(value.sealRewards.filter(x=>typeof x==='string'&&/^(S[123]|Z[12]):\d{1,3}$/.test(x)))]:[];
    // 이미 넘은 장·외전의 고유 보물(획득처를 새로 정한 보물도 여기서 받는다).
    for(const item of treasures){const src=item.stage;if(clean.rewards.some(r=>r.startsWith(src+':'))||clean.quests.includes(src)||clean.challenges.includes(src))grantTreasure(clean,item.id);}
    if(value.gold&&typeof value.gold==='object'){const g:Partial<Record<Story,number>>={};for(const s of ['S','Z'] as const){const n=value.gold[s];if(typeof n==='number'&&Number.isFinite(n)&&n>=0)g[s]=Math.min(99_999_999,Math.floor(n));}clean.gold=g;}
    if(value.supplies&&typeof value.supplies==='object'){const sp:Record<string,number>={};for(const [k,n] of Object.entries(value.supplies))if(consumable(k)&&Number.isSafeInteger(n)&&n>0)sp[k]=Math.min(999,n);if(Object.keys(sp).length)clean.supplies=sp;}
    if(value.gearExp&&typeof value.gearExp==='object'){const gx:Record<string,number>={};for(const [k,n] of Object.entries(value.gearExp))if(clean.treasures.includes(k)&&Number.isFinite(n)&&n>0)gx[k]=Math.min(100000,Math.floor(n));if(Object.keys(gx).length)clean.gearExp=gx;}
    const fix=(id:string)=>swap.get(id)??id;
    for(const id of OFFICERS)if(typeof value.equipped[id]==='string')equip(clean,id,fix(value.equipped[id]!));
    if(value.loadouts&&typeof value.loadouts==='object')for(const id of Object.keys(value.loadouts).filter(validGearKey)){const gear=value.loadouts[id];if(!gear||typeof gear!=='object')continue;for(const slot of Object.keys(gearNames) as GearSlot[])if(typeof gear[slot]==='string'){const item=fix(gear[slot]!);if(clean.treasures.includes(item)&&treasureInfo(item).slot===slot&&canWear(id,item).ok)equipSlot(clean,id,slot,item);}}
    return clean;
  }catch{return freshCampaign();}
}
export function writeCampaign(c:Campaign,key:string=CAMPAIGN_KEYS.main){localStorage.setItem(key,JSON.stringify(c));}

// ─────────────────────────────────────────────────────────── 금 · 상점

/** 시작 금. */
export const START_GOLD=1000;
export const goldOf=(c:Pick<Campaign,'gold'>,story:Story)=>c.gold?.[story]??START_GOLD;
export function addGold(c:Campaign,story:Story,n:number){const g=c.gold??={};g[story]=Math.max(0,goldOf(c,story)+Math.round(n));return g[story]!;}
/** 이 이야기의 몇째 장(0부터)을 이긴 금: 처음은 크게, 다시 이기면 1/3. */
export function chapterGold(index:number,first:boolean){const full=300+40*Math.max(0,index);return first?full:Math.round(full/3);}
/** 상점 등급이 열리는 이긴 장 수(이야기 길이의 약 1/5 · 1/2 · 4/5). */
export function tierThresholds(total:number){return [0,Math.round(total/5),Math.round(total/2),Math.round(total*4/5)] as const;}
export function tierUnlocked(grade:number,wins:number,total:number){return wins>=tierThresholds(total)[grade-1]!;}
/** 판 값(산 값의 절반). 고유 보물은 팔 수 없다(0). */
export const sellPrice=(id:string)=>isShopGear(id)?Math.floor((gearDef(id)?.price??0)/2):0;
/** 상점 장비 사기: 금을 내고 낱개 하나를 보관함에. 성공하면 새 낱개 id. */
export function buyGear(c:Campaign,story:Story,defId:string){
  const d=gearDef(defId);if(!d||d.named||!d.price||goldOf(c,story)<d.price)return undefined;
  addGold(c,story,-d.price);return newShopItem(c,d.id);
}
/** 상점 장비 팔기: 장착 중이면 벗기고 판다. 고유 보물은 팔 수 없다. */
export function sellGear(c:Campaign,story:Story,id:string){
  if(!isShopGear(id)||!c.treasures.includes(id))return 0;
  const price=sellPrice(id);c.treasures=c.treasures.filter(x=>x!==id);
  for(const gear of Object.values(c.loadouts??{}))for(const k of Object.keys(gear) as GearSlot[])if(gear[k]===id)delete gear[k];
  for(const [k,v] of Object.entries(c.equipped))if(v===id)delete c.equipped[k];
  if(c.gearExp)delete c.gearExp[id];addGold(c,story,price);return price;
}
export function supplyCount(c:Pick<Campaign,'supplies'>,id:string){return c.supplies?.[id]??0;}
export function addSupply(c:Campaign,id:string,n:number){if(!consumable(id))return;const s=c.supplies??={};s[id]=Math.max(0,Math.min(999,(s[id]??0)+n));if(!s[id])delete s[id];}
export function buySupply(c:Campaign,story:Story,id:string,n=1){const d=consumable(id);if(!d?.price||n<1||goldOf(c,story)<d.price*n)return false;addGold(c,story,-d.price*n);addSupply(c,id,n);return true;}
/** 소모품 팔기: 상점 값의 절반(팔지 않는 복숭아·술은 50). */
export function sellSupply(c:Campaign,story:Story,id:string,n=1){const d=consumable(id);if(!d||supplyCount(c,id)<n||n<1)return 0;const each=Math.floor((d.price||100)/2);addSupply(c,id,-n);addGold(c,story,each*n);return each*n;}
export {CONSUMABLES,maxLevelOf};
/** 장비 낱개의 장비 경험치를 더한다(보조구는 레벨이 없어 쌓지 않는다). 레벨이 오르면 새 레벨. */
export function addGearExp(c:Campaign,id:string,n:number){
  const d=gearDef(id);if(!d||n<=0||maxLevelOf(d)<=1||!c.treasures.includes(id))return undefined;
  const before=gearLevel(c,id),x=c.gearExp??={};x[id]=Math.min(100000,(x[id]??0)+Math.round(n));const after=gearLevel(c,id);return after>before?after:undefined;
}
/** 장비의 고유 기능 글(예전 이름). */
export const treasurePowerText=(id:string)=>gearPowerText(id);
