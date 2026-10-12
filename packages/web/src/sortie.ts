/**
 * 출진 편성 규칙 — 필수 장수는 반드시 나가고, 그 밖의 장수는 난이도에 맞춘 인원 안에서 골라 데려간다.
 *
 * 연의 장: 스테이지가 정한 필수 장수(deployment.forced)에, 그 시기에 사마의 곁에 있을 수 있는
 * 장수를 더 데려갈 수 있다(출진 칸이 남을 때만).
 * 가상 전장: 대본이 정한 필수 장수(required)에, 편이 깊을수록 더 많이(상편 4 · 중편 6 · 하편 8,
 * 우두머리 전 +2) 데려간다. 뒤로 갈수록 적이 늘고 큰 싸움이 많아서다.
 *
 * 일반·극한 모두 인원 대신 '출진 코스트'로 제한한다: 병종마다 코스트(진화 단계가 높을수록, 기마는 +1)가 있고,
 * 출진하는 장수들의 코스트 합이 전장의 상한을 넘으면 더 데려갈 수 없다.
 * 필수 장수는 언제나 제 병종 그대로 나서고 그 코스트가 먼저 잡힌다. 남은 코스트 안에서만 다른 장수를 고를 수 있다
 * (필수 장수만으로 상한을 채우거나 넘으면 더 데려갈 수 없다).
 */
import type {MapFile,StageDef,UnitClass} from '../../core/src/index.ts';
import {evolvedClass,familyOf,tierOf} from '../../core/src/index.ts';
import {campaignOrder,chapters} from './session.ts';
import {LARGE_BATTLES} from './large-battle.ts';

/** 연의 장에서 사마의 곁에 설 수 있는 시기(스테이지 id 범위, 연의 진행 순서 기준). */
export const SORTIE_WINDOWS:Record<string,[string,string]>={sima_lang:['S1-01','S1-08'],sima_fang:['S1-01','S1-08'],cao_zhen:['S1-05','S2-09']};
/** 이야기상 혼자 서야 하는 장(꿈속·궁정 설전): 더 데려갈 수 없다. */
const ALONE=new Set(['S1-04','S1-11']);
const orderOf=(id:string)=>campaignOrder.findIndex(i=>chapters[i]!.stage.id===id);

/** 인원은 시작 칸만 제한하고, 실제 편성 한계는 COST가 정한다. */
export function storySortieLimit(_difficulty:'normal'|'extreme'){return 8;}

// ─────────────────────────────────────────────── 출진 코스트

const TIER_COST=[0,2,3,4,6] as const;
const MOUNTED=new Set(['cavalry','heavyCav','horseArcher','elephant']);
/** 병종 코스트: 1단 2 · 2단 3 · 3단 4 · 4단 6, 말·코끼리를 탄 병종 +1. */
export function unitCost(c:UnitClass){return TIER_COST[Math.min(4,Math.max(1,tierOf(c)))]!+(MOUNTED.has(familyOf(c))?1:0);}
const actOfStage=(stageId:string)=>Math.min(3,Math.max(1,Number(/^S(\d)/.exec(stageId)?.[1]??1))) as 1|2|3;
/**
 * 출진 코스트 상한. 극한은 정예 소수 편성을 요구하고, 일반은 편이 깊을수록(적이 늘어난다) 여유가 커진다:
 * 상편 +4 · 중편 +8 · 하편 +12, 대규모 전투(LARGE_BATTLES)는 +4 더.
 */
export function storyCostCap(stageId:string,difficulty:'normal'|'extreme'='extreme'){const act=actOfStage(stageId),base=act>=3?16:act===2?13:10;return base+(difficulty==='normal'?4*act+(LARGE_BATTLES.has(stageId)?4:0):0);}
/** 가상 전장의 극한 출진 코스트 상한(편이 깊을수록·우두머리 전에서 넓다). */
export function taleCostCap(act:1|2|3,boss:boolean){return (act===3?24:act===2?18:13)+(boss?3:0);}
/**
 * 연의 장에 함께 나서는 등용 장수 수. 편이 깊을수록 많고, 연의·정사의 대규모 전투(LARGE_BATTLES)는 더 많다.
 * 일반 상편 2 · 중편 4 · 하편 6(대규모 +2), 극한 1 · 2 · 3(대규모 +1). 실제로 몇 명이 서는지는 출진 코스트가 정한다.
 */
export function storyRetinueCap(stageId:string,difficulty:'normal'|'extreme'){const act=actOfStage(stageId),large=LARGE_BATTLES.has(stageId);
  return difficulty==='extreme'?act+(large?1:0):2*act+(large?2:0);}
/** 연의 장 장수의 본래 병종(레벨이 오르면 진화한다). */
export const STORY_BASE_CLASS:Record<string,UnitClass>={sima_yi:'strategist',sima_lang:'infantry',cao_zhen:'heavyCav',sima_fang:'spearman'};
export const storyClassAt=(id:string,level:number)=>evolvedClass(STORY_BASE_CLASS[id]??'infantry',level);
/** 연의 장 필수 장수의 출진 코스트(제 병종 그대로). */
export function forcedCost(stage:StageDef,levels:Readonly<Record<string,number>>){
  return stage.deployment.forced.filter(id=>STORY_BASE_CLASS[id]).reduce((n,id)=>n+unitCost(storyClassAt(id,levels[id]??1)),0);
}
/** 홀로 서는 장(꿈속 대결·건업 설전)이거나 사마의가 나서지 않는 장: 누구도 더 데려가지 못한다(등용 장수 포함). */
export function soloStage(stage:StageDef){return ALONE.has(stage.id)||!stage.deployment.forced.includes('sima_yi');}
/** 연의 장에 더 데려갈 수 있는 장수와 남은 출진 칸. */
export function optionalOfficers(stage:StageDef,map:MapFile):{allowed:string[];capacity:number}{
  const forced=stage.deployment.forced;
  if(soloStage(stage))return {allowed:[],capacity:0};
  const cells=(map.regions?.player_start as unknown[]|undefined)?.length??0;
  const granted=(stage.deployment.grantedUnits??[]).reduce((n,g)=>n+g.count,0);
  const capacity=Math.max(0,cells-forced.length-granted),at=orderOf(stage.id);
  const allowed=Object.entries(SORTIE_WINDOWS).filter(([id,[from,to]])=>!forced.includes(id)&&at>=orderOf(from)&&at<=orderOf(to)).map(([id])=>id);
  return {allowed,capacity};
}
/** 실제로 데려갈 장수: 허용 목록·시작 칸·COST 예산 안에서. */
/** reserved: 등용 장수처럼 이 목록 밖에서 먼저 잡아 둔 COST. */
export function pickExtras(stage:StageDef,map:MapFile,wanted:readonly string[],difficulty:'normal'|'extreme',levels?:Readonly<Record<string,number>>,reserved=0){
  const {allowed,capacity}=optionalOfficers(stage,map);
  const picked=wanted.filter((id,i)=>allowed.includes(id)&&wanted.indexOf(id)===i).slice(0,Math.min(capacity,storySortieLimit(difficulty)));
  if(!levels)return picked;
  // 필수 장수의 COST를 먼저 잡고, 남은 예산 안에 드는 장수만 더한다.
  const cap=storyCostCap(stage.id,difficulty);let used=forcedCost(stage,levels)+reserved;const out:string[]=[];
  for(const id of picked){const c=unitCost(storyClassAt(id,levels[id]??1));if(used+c<=cap){out.push(id);used+=c;}}
  return out;
}
/** 화면용: 필수·선택 장수별 병종·COST, 합계와 남은 예산. */
/** retinue: 함께 나서는 등용 장수(이름·병종) — 같은 COST 안에 든다. */
export function storyCostSheet(stage:StageDef,ids:readonly string[],levels:Readonly<Record<string,number>>,difficulty:'normal'|'extreme'='extreme',retinue:ReadonlyArray<{name:string;unitClass:UnitClass}>=[]){
  const cap=storyCostCap(stage.id,difficulty),forcedIds=stage.deployment.forced.filter(id=>STORY_BASE_CLASS[id]);
  const rows=[...forcedIds,...ids.filter(id=>!forcedIds.includes(id))].map(id=>{const c=storyClassAt(id,levels[id]??1);return {id,unitClass:c,cost:unitCost(c),forced:forcedIds.includes(id)};}).concat(retinue.map(r=>({id:'rt:'+r.name,unitClass:r.unitClass,cost:unitCost(r.unitClass),forced:false})));
  const used=rows.reduce((n,r)=>n+r.cost,0);
  return {cap,rows,used,left:Math.max(0,cap-used)};
}

/** 가상 전장에 고를 수 있는 장수 수(필수 장수 제외): 상편 4 · 중편 6 · 하편 8, 우두머리 전 +2. */
export function taleSortieLimit(act:1|2|3,boss:boolean,_difficulty:'normal'|'extreme'){
  return Math.max(1,(act===1?4:act===2?6:8)+(boss?2:0));
}
/** 천명의 길 행군 전투에 나서는 장수 수(사마의 제외): 상편 5 · 중편 7 · 하편 9. */
export function marchSortieLimit(act:1|2|3){return act===1?5:act===2?7:9;}
