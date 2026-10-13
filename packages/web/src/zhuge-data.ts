/**
 * 제갈량전 — 두 번째 주인공 이야기의 장 목록과 아군 장수 명부.
 *
 * 장은 session.ts의 chapters 뒤에 덧붙는다(앞 32장의 번호는 그대로 — 옛 저장이 장 번호를 쓴다).
 * 장 id는 Z1-xx(상편 「와룡」)·Z2-xx(하편 「출사표」). 기획: docs/design/제갈량전-기획.md.
 * 이 이야기의 이름있는 장수 id는 z_ 로 시작한다. 능력·고유특성은 이름으로 연의 장수록에서 찾는다(romance.ts).
 */
import type {MapFile,StageDef,UnitClass} from '../../core/src/index.ts';
import {ZHUGE_BATCHES} from './zhuge/index.ts';
import type {ZhugeChapter} from './zhuge/types.ts';
export type {ZhugeChapter};
import z101Stage from '../../data/stages/Z1-01.json';
import xuzhouFlightMap from '../../data/maps/xuzhou-flight.json';

/** 장(id 순): 1장은 여기, 나머지는 장 묶음(zhuge/batch-*.ts)에서. */
export const ZHUGE_CHAPTERS:ZhugeChapter[]=[
  {stage:z101Stage as StageDef,map:xuzhouFlightMap as MapFile,year:'흥평 원년 · 194년',label:'피난과 도강',quote:'살아서 강을 건너는 것, 그것이 오늘의 싸움이다.'},
  ...ZHUGE_BATCHES.flatMap(b=>b.chapters),
].sort((x,y)=>x.stage.id<y.stage.id?-1:x.stage.id>y.stage.id?1:0);
export const ZHUGE_IDS=ZHUGE_CHAPTERS.map(c=>c.stage.id);
export const isZhugeStage=(id:string|undefined)=>!!id&&/^Z[12]-\d\d$/.test(id);
/** 제갈량전 선택분기의 가상 전장(ZB1-01…): 본편 순서(zhugeOrder)에는 들지 않고 연의 지도의 갈림길로만 연다. */
export {isZhugeBranch} from './zhuge/branches.ts';

/** 제갈량전에서 직접 지휘하는 장수(출진 명부). 병종은 장마다 바뀔 수 있다(아래 stageClass). */
export interface ZhugeOfficer {id:string;name:string;unitClass:UnitClass;strategies?:string[]}
const BASE_ROSTER:ZhugeOfficer[]=[
  {id:'z_liang',name:'제갈량',unitClass:'strategist'},
  {id:'z_jin',name:'제갈근',unitClass:'fengshui'},
  {id:'z_jun',name:'제갈균',unitClass:'infantry'},
  // 촉의 장수들(장마다 필수 출진으로 세운다. 병종은 장별로 바꿀 수 있다 — stageClass)
  {id:'z_liu_bei',name:'유비',unitClass:'lord'},
  {id:'z_guan_yu',name:'관우',unitClass:'heavyCav'},
  {id:'z_zhang_fei',name:'장비',unitClass:'cavalry'},
  {id:'z_zhao_yun',name:'조운',unitClass:'heavyCav'},
  {id:'z_jian_yong',name:'간옹',unitClass:'fengshui'},
  {id:'z_mi_zhu',name:'미축',unitClass:'fengshui'},
  {id:'z_sun_qian',name:'손건',unitClass:'fengshui'},
  {id:'z_liao_hua',name:'요화',unitClass:'infantry'},
  {id:'z_guan_ping',name:'관평',unitClass:'infantry'},
  {id:'z_mi_fang',name:'미방',unitClass:'infantry'},
  {id:'z_huang_zhong',name:'황충',unitClass:'archer'},
  {id:'z_wei_yan',name:'위연',unitClass:'cavalry'},
  {id:'z_ma_chao',name:'마초',unitClass:'heavyCav'},
  {id:'z_fa_zheng',name:'법정',unitClass:'strategist'},
  {id:'z_ma_su',name:'마속',unitClass:'strategist'},
  {id:'z_ma_liang',name:'마량',unitClass:'fengshui'},
  {id:'z_yi_ji',name:'이적',unitClass:'fengshui'},
  {id:'z_yan_yan',name:'엄안',unitClass:'infantry'},
  {id:'z_wang_ping',name:'왕평',unitClass:'spearman'},
  {id:'z_jiang_wei',name:'강유',unitClass:'heavyCav'},
  {id:'z_ma_dai',name:'마대',unitClass:'cavalry'},
  {id:'z_zhang_yi',name:'장익',unitClass:'spearman'},
  {id:'z_guan_suo',name:'관색',unitClass:'infantry'},
  {id:'z_li_yan',name:'이엄',unitClass:'spearman'},
  {id:'z_deng_zhi',name:'등지',unitClass:'fengshui'},
  {id:'z_wu_yi',name:'오의',unitClass:'spearman'},
  {id:'z_wu_ban',name:'오반',unitClass:'spearman'},
  {id:'z_liu_feng',name:'유봉',unitClass:'infantry'},
  {id:'z_meng_da',name:'맹달',unitClass:'infantry'},
  {id:'z_huang_quan',name:'황권',unitClass:'strategist'},
  {id:'z_zhou_cang',name:'주창',unitClass:'infantry'},
  {id:'z_jiang_wan',name:'장완',unitClass:'fengshui'},
  {id:'z_fei_yi',name:'비의',unitClass:'fengshui'},
  {id:'z_yang_yi',name:'양의',unitClass:'strategist'},
  {id:'z_huang_yueying',name:'황월영',unitClass:'strategist'},
  {id:'z_zhang_bao',name:'장포',unitClass:'infantry'},
  {id:'z_guan_xing',name:'관흥',unitClass:'infantry'},
  {id:'z_chen_shi',name:'진식',unitClass:'infantry'},
  {id:'z_gao_xiang',name:'고상',unitClass:'infantry'},
];
/** 공용 + 장 묶음마다 처음 나오는 출진 장수(같은 id는 앞의 것). */
export const ZHUGE_ROSTER:readonly ZhugeOfficer[]=[...BASE_ROSTER,...ZHUGE_BATCHES.flatMap(b=>b.roster??[])].filter((o,i,a)=>a.findIndex(x=>x.id===o.id)===i);
/** 장마다 다른 병종: 피난길의 세 형제는 싸울 수 없는 피난민이다. */
const STAGE_CLASS:Record<string,Record<string,UnitClass>>=Object.assign({
  'Z1-01':{z_liang:'civilian',z_jin:'civilian',z_jun:'civilian'},
},...ZHUGE_BATCHES.map(b=>b.stageClass??{}));
export function zhugeClass(stage:string,id:string):UnitClass|undefined{
  return STAGE_CLASS[stage]?.[id]??ZHUGE_ROSTER.find(o=>o.id===id)?.unitClass;
}
export const zhugeName=(id:string)=>ZHUGE_ROSTER.find(o=>o.id===id)?.name;
