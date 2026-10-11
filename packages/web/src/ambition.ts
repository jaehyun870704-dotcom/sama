/**
 * 야망 — 연의 장 안에서 고른 대사가 쌓여 선택분기(가상 길)의 문을 연다.
 * 구조는 조조전 Online의 '야망' 막대(장 안의 선택이 막대를 움직이고, 막대 값이 갈림길을 연다)를 참고했고,
 * 선택지마다의 값과 길마다의 조건은 이 게임이 정했다.
 *
 * - 양(+)은 야망: 대담함·권모·이익. 음(−)은 충의: 신중함·의리·백성.
 * - 이긴 장의 선택만 친다. 같은 장을 다른 선택으로 다시 이기면 그 장의 몫이 바뀐다(야망을 되돌릴 수 있다).
 */
export const CHOICE_AMBITION:Readonly<Record<string,number>>={
  // 상편 · 낙양 탈출: 몰래 지나가는가, 베고 가는가, 속이는가
  'S1-02:bribe:pay':-5,'S1-02:bribe:fight':15,'S1-02:bribe:lie':10,'S1-02:lie_failed:pay_late':5,'S1-02:fight_confirm:commit':5,
  // 육혼산: 피난민과 함께, 홀로 돌아서, 관군을 사칭해서
  'S1-03:mountain_choice:talk':-10,'S1-03:mountain_choice:ravine':0,'S1-03:mountain_choice:bluff':15,'S1-03:bluff_warning:commit':5,'S1-03:bluff_warning:back':-5,
  // 장강 퇴각: 짧고 위험한 길, 돌아가는 길
  'S1-05:retreat_route:bridge':10,'S1-05:retreat_route:shore':-5,
  // 동관: 허저를 주군 곁에, 선봉에
  'S1-06:tongguan_plan:rear':-10,'S1-06:tongguan_plan:front':10,
  // 동오 설득: 바른 말은 충의, 오만·위협·이익 계산은 야망
  'S1-11:zhang_zhao:present':-5,'S1-11:zhang_zhao:arrogant':15,'S1-11:zhang_zhao:threat':10,
  'S1-11:lu_meng:cede':10,'S1-11:lu_meng:han':-10,'S1-11:lu_meng:later':5,
  'S1-11:zhuge_jin:loan':-5,'S1-11:zhuge_jin:profit':15,'S1-11:zhuge_jin:brother':10,
  'S1-11:sun_quan:pledge':10,'S1-11:sun_quan:warn':15,'S1-11:sun_quan:endure':-10,
  // 중편 · 맹달 토벌: 허락 없이 여드레 강행군
  'S2-05:march:forced':15,'S2-05:march:steady':-5,
  // 위연 추격: 젖은 잔도를 질러가는가
  'S2-07:route:plank':10,'S2-07:route:valley':-5,
  // 노성: 이엄의 편지를 이용하는가
  'S2-09:envoy:letter':15,'S2-09:envoy:release':-10,
};
export const choiceAmbition=(stage:string,nodeId:string,optionId:string)=>CHOICE_AMBITION[`${stage}:${nodeId}:${optionId}`]??0;

/** 선택분기 길마다의 야망 조건(없으면 조건 없음). min 이상 · max 이하. */
export const ROUTE_AMBITION:Readonly<Record<string,{min?:number;max?:number}>>={
  serve:{min:10},yuan:{min:30},
  cao_zhi:{min:40},shu:{max:0},chibi:{max:40},heir:{min:40},hebei:{max:50},independent:{min:60},
  coup:{min:60},unify:{min:0,max:59},zhi_unify:{max:60},zhi_throne:{min:70},shu_north:{max:-20},shu_south:{max:20},
  chibi_shu:{max:50},chibi_throne:{min:60},heir_wu:{max:70},heir_regent:{min:70},hebei_south:{max:70},hebei_throne:{min:80},
  ind_alliance:{max:80},ind_empire:{min:90},
};
export function ambitionOk(route:string,value:number){const r=ROUTE_AMBITION[route];return !r||(r.min===undefined||value>=r.min)&&(r.max===undefined||value<=r.max);}
export function ambitionRule(route:string){const r=ROUTE_AMBITION[route];if(!r)return '';return r.min!==undefined&&r.max!==undefined?`야망 ${r.min}~${r.max}`:r.min!==undefined?`야망 ${r.min} 이상`:`야망 ${r.max} 이하(충의)`;}

// ─── 이긴 연의 장의 선택 기록
const KEY='sama-ambition-v1';
type Book=Record<string,string[]>;
function book():Book{try{const v=JSON.parse(localStorage.getItem(KEY)??'{}') as Record<string,unknown>;const out:Book={};for(const [k,x] of Object.entries(v))if(/^S[123]-\d\d$/.test(k)&&Array.isArray(x))out[k]=x.filter((y):y is string=>typeof y==='string'&&y.length<80).slice(0,20);return out;}catch{return {};}}
/** 연의 장을 이겼을 때: 그 장에서 고른 선택으로 그 장의 몫을 새로 쓴다. */
export function recordStageChoices(stage:string,choices:ReadonlyArray<{nodeId:string;optionId:string}>){
  if(!/^S[123]-\d\d$/.test(stage))return;const b=book();b[stage]=choices.map(c=>`${c.nodeId}:${c.optionId}`);try{localStorage.setItem(KEY,JSON.stringify(b));}catch{/* storage optional */}
}
/** 지금의 야망: 이긴 장의 선택을 모두 더한다. */
export function ambition(){const b=book();let n=0;for(const [stage,list] of Object.entries(b))for(const c of list){const [node,opt]=c.split(':');n+=choiceAmbition(stage,node??'',opt??'');}return n;}
/** 야망 막대 표시(−100~+100에 맞춰 자른다). */
export const ambitionPercent=(v:number)=>Math.max(0,Math.min(100,50+v/2));
