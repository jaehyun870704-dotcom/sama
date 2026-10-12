/**
 * 제갈량전의 규칙: 출진 레벨(인물별 기록)·출진 편성·승리 뒤 성장.
 *
 * 레벨은 인물마다 기억된다(사용자 결정 · docs/design/제갈량전-기획.md). 기록은 이름별 경험치(Campaign.retinueXp)에 쌓여,
 * 사마의전에서 등용해 키운 장수가 제갈량전에서 내 편으로 나오면 그 레벨로 선다(적으로 나오면 그 장의 기본 레벨).
 * 처음 보는 장수는 그 장의 권장 레벨로 선다. 화면은 main.ts(zhuge 화면)가 맡는다.
 */
import type {StageDef} from '../../core/src/index.ts';
import {levelInfo,xpAtLevel,type Campaign,type Deployment} from './progression.ts';
import {encounterLevels} from './campaign-rules.ts';
import {ZHUGE_ROSTER,zhugeName} from './zhuge-data.ts';

/** 그 장의 기본(권장) 레벨: 극한은 2 높다. */
export function zhugeBase(stage:StageDef,difficulty:'normal'|'extreme'){return (encounterLevels[stage.id]??stage.difficulty.normal.recommendedLevel)+(difficulty==='extreme'?2:0);}
/** 장수의 출진 레벨: 쌓은 기록과 그 장의 기본 레벨 가운데 높은 쪽. */
export function zhugeLevel(c:Pick<Campaign,'retinueXp'>,name:string,stage:StageDef,difficulty:'normal'|'extreme'){
  const x=c.retinueXp?.[name];return Math.max(x!==undefined?levelInfo(x).level:1,zhugeBase(stage,difficulty));
}
/** 제갈량전 장의 출진 기록. 사마의전 장수 칸은 저장 검사를 위해 1로 채운다(이 장에는 나오지 않는다). */
export function zhugeDeployment(c:Pick<Campaign,'retinueXp'>,stage:StageDef,difficulty:'normal'|'extreme'):Deployment{
  const levels:Record<string,number>={sima_yi:1,sima_lang:1,sima_fang:1,cao_zhen:1};
  for(const id of stage.deployment.forced){const name=zhugeName(id);if(name)levels[id]=zhugeLevel(c,name,stage,difficulty);}
  return {levels,equipped:{},wide:2};
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
