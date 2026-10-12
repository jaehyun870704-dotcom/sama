/**
 * 제갈량전 — 두 번째 주인공 이야기의 장 목록과 아군 장수 명부.
 *
 * 장은 session.ts의 chapters 뒤에 덧붙는다(앞 32장의 번호는 그대로 — 옛 저장이 장 번호를 쓴다).
 * 장 id는 Z1-xx(상편 「와룡」)·Z2-xx(하편 「출사표」). 기획: docs/design/제갈량전-기획.md.
 * 이 이야기의 이름있는 장수 id는 z_ 로 시작한다. 능력·고유특성은 이름으로 연의 장수록에서 찾는다(romance.ts).
 */
import type {MapFile,StageDef,UnitClass} from '../../core/src/index.ts';
import z101Stage from '../../data/stages/Z1-01.json';
import xuzhouFlightMap from '../../data/maps/xuzhou-flight.json';

export interface ZhugeChapter {stage:StageDef;map:MapFile;year:string;label:string;quote:string}
export const ZHUGE_CHAPTERS:ZhugeChapter[]=[
  {stage:z101Stage as StageDef,map:xuzhouFlightMap as MapFile,year:'흥평 원년 · 194년',label:'피난과 도강',quote:'살아서 강을 건너는 것, 그것이 오늘의 싸움이다.'},
];
export const ZHUGE_IDS=ZHUGE_CHAPTERS.map(c=>c.stage.id);
export const isZhugeStage=(id:string|undefined)=>!!id&&/^Z[12]-\d\d$/.test(id);

/** 제갈량전에서 직접 지휘하는 장수(출진 명부). 병종은 장마다 바뀔 수 있다(아래 stageClass). */
export interface ZhugeOfficer {id:string;name:string;unitClass:UnitClass;strategies?:string[]}
export const ZHUGE_ROSTER:readonly ZhugeOfficer[]=[
  {id:'z_liang',name:'제갈량',unitClass:'strategist'},
  {id:'z_jin',name:'제갈근',unitClass:'fengshui'},
  {id:'z_jun',name:'제갈균',unitClass:'infantry'},
];
/** 장마다 다른 병종: 피난길의 세 형제는 싸울 수 없는 피난민이다. */
const STAGE_CLASS:Record<string,Record<string,UnitClass>>={
  'Z1-01':{z_liang:'civilian',z_jin:'civilian',z_jun:'civilian'},
};
export function zhugeClass(stage:string,id:string):UnitClass|undefined{
  return STAGE_CLASS[stage]?.[id]??ZHUGE_ROSTER.find(o=>o.id===id)?.unitClass;
}
export const zhugeName=(id:string)=>ZHUGE_ROSTER.find(o=>o.id===id)?.name;
