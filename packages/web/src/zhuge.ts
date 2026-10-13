/**
 * 제갈량전의 규칙: 출진 레벨(인물별 기록)·출진 편성·승리 뒤 성장.
 *
 * 레벨은 인물마다 기억된다(사용자 결정 · docs/design/제갈량전-기획.md). 기록은 이름별 경험치(Campaign.retinueXp)에 쌓여,
 * 사마의전에서 등용해 키운 장수가 제갈량전에서 내 편으로 나오면 그 레벨로 선다(적으로 나오면 그 장의 기본 레벨).
 * 처음 보는 장수는 그 장의 권장 레벨로 선다. 화면은 main.ts(zhuge 화면)가 맡는다.
 */
import type {StageDef} from '../../core/src/index.ts';
import {evolvedClass,tierOf,VARIANTS,signatureSet,SIGNATURE_UNLOCK_TIERS} from '../../core/src/index.ts';
import {classNames} from './troops.ts';
import {levelInfo,xpAtLevel,gearDeployment,type Campaign,type Deployment} from './progression.ts';
import {encounterLevels} from './campaign-rules.ts';
import {ZHUGE_ROSTER,zhugeName} from './zhuge-data.ts';

/** 그 장의 기본(권장) 레벨: 극한은 2 높다. */
export function zhugeBase(stage:StageDef,difficulty:'normal'|'extreme'){return (encounterLevels[stage.id]??stage.difficulty.normal.recommendedLevel)+(difficulty==='extreme'?2:0);}
/** 장수의 출진 레벨: 쌓은 기록과 그 장의 기본 레벨 가운데 높은 쪽. */
export function zhugeLevel(c:Pick<Campaign,'retinueXp'>,name:string,stage:StageDef,difficulty:'normal'|'extreme'){
  const x=c.retinueXp?.[name];return Math.max(x!==undefined?levelInfo(x).level:1,zhugeBase(stage,difficulty));
}
/**
 * 제갈량전 장의 출진 기록. 사마의전 장수 칸은 저장 검사를 위해 1로 채운다(이 장에는 나오지 않는다).
 * 보물은 두 이야기가 함께 쓴다: 장수 이름에 단 보물(Campaign.loadouts)을 그대로 입고 나선다.
 * extremeRules: 이 기록으로 연 극한 본편 전투는 제갈량전 극한 표(foeEdgesExtremeZ·turnLimitsExtremeZ)를 받는다. 이 기록이 없는 옛 저장은 그대로다.
 */
export function zhugeDeployment(c:Pick<Campaign,'retinueXp'|'loadouts'>&Partial<Campaign>,stage:StageDef,difficulty:'normal'|'extreme'):Deployment{
  const levels:Record<string,number>={sima_yi:1,sima_lang:1,sima_fang:1,cao_zhen:1};
  for(const id of stage.deployment.forced){const name=zhugeName(id);if(name)levels[id]=zhugeLevel(c,name,stage,difficulty);}
  return {levels,equipped:{},wide:2,treasureRules:1,extremeRules:1,...(c.loadouts?{loadouts:structuredClone(c.loadouts)}:{}),...(c.treasures?gearDeployment(c as Campaign):{}),gearRules:2};
}
/**
 * 이긴 뒤 성장: 출진한 장수마다 싸워 번 경험치 + 승리 몫을 이름별 기록에 더한다.
 * 기록이 없던 장수는 이번에 나선 레벨에서 시작한다. 오른 레벨 글을 돌려준다.
 */
export function growZhuge(c:Campaign,units:ReadonlyArray<{id:string;name:string;level:number}>,earned:Record<string,number>,bonus:number){
  const out:string[]=[],r=c.retinueXp??={};
  for(const u of units){if(!ZHUGE_ROSTER.some(o=>o.id===u.id))continue;
    const before=r[u.name]!==undefined?Math.max(levelInfo(r[u.name]!).level,u.level):u.level,base=Math.max(r[u.name]??0,xpAtLevel(before));
    r[u.name]=base+Math.max(0,earned[u.id]??0)+bonus;const after=levelInfo(r[u.name]!).level;if(after>before)out.push(`${u.name} Lv.${before} → ${after}`);}
  return out;
}
/**
 * 이긴 뒤 장수마다 달라진 것(사마의전 결과 화면과 같은 소식): 레벨 · 병종 진화(개화) · 새로 열린 고유특성.
 * before: 성장 전의 이름별 경험치(growZhuge를 부르기 전에 떠 둔 것).
 */
export function zhugeMilestones(c:Pick<Campaign,'retinueXp'>,before:Readonly<Record<string,number>>,units:ReadonlyArray<{id:string;name:string;level:number}>){
  return units.filter(u=>ZHUGE_ROSTER.some(o=>o.id===u.id)).map(u=>{
    const base=ZHUGE_ROSTER.find(o=>o.id===u.id)!.unitClass,from=before[u.name]!==undefined?Math.max(levelInfo(before[u.name]!).level,u.level):u.level,to=levelInfo(c.retinueXp?.[u.name]??0).level;
    const a=evolvedClass(base,from),b=evolvedClass(base,Math.max(from,to)),ta=tierOf(a),tb=tierOf(b);
    const signatures=signatureSet(u.name).filter((_g,i)=>ta<SIGNATURE_UNLOCK_TIERS[i]!&&tb>=SIGNATURE_UNLOCK_TIERS[i]!).map(g=>g.name);
    return {name:u.name,from,to:Math.max(from,to),...(a!==b?{evolution:{from:classNames[a]??a,to:classNames[b]??b,bloom:VARIANTS[b]?.bloom}}:{}),signatures};
  }).filter(x=>x.to>x.from||x.evolution||x.signatures.length);
}
