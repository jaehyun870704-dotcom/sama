/**
 * 천명 — 원정과 원정 사이에 남는 영구 진행.
 *
 * 원정이 끝날 때마다 천명을 얻고(roguelike.ts mandateEarned), 해금에 쓴다.
 * 연의 전장을 이긴 기록(천명 기록)도 여기에 남아, 다음 원정은 그다음 이야기로 이어지고
 * 이긴 연의 전장은 '연의 회상'에서 다시 치를 수 있다.
 */
import {mandateEarned,RUN_FLOORS,type Run} from './roguelike.ts';
import {endingFor,ALL_ENDINGS,ROUTES} from './fate.ts';
import {readCustoms,type CustomOfficer} from './custom.ts';
import {ZHUGE_ENDINGS} from './zhuge-ending.ts';
import {RESEARCH} from './research.ts';
import {LEGACIES} from './chuhan.ts';
import {NATIONS,type Nation} from './recruit.ts';

export interface MetaState {
  version:1;
  /** 쓸 수 있는 천명 */
  mandate:number;
  /** 지금까지 얻은 천명 합계 */
  earned:number;
  unlocks:string[];
  /** 원정에서 이긴 연의 전장 */
  chronicle:string[];
  /** 이긴 가상 전장 */
  tales:string[];
  /** 본 결말(중편 루트/하편 루트) · 제갈량전 결말('zhuge_heart' 꼴, zhuge-ending.ts) */
  endings:string[];
  runs:number;wins:number;best:number;
  /** 플레이어가 만든 신장수(영구) */
  customOfficers?:CustomOfficer[];
  /** 연구: 칸 id → 배운 단계(research.ts) */
  research?:Record<string,number>;
  /** 장수 효과: 장수 이름 → 배운 효과·장착한 효과(officer-perks.ts) */
  officerPerks?:Record<string,{learned:string[];equipped:string[]}>;
  /** 장수가 어느 회차에서든 닿은 가장 높은 레벨(장수 효과의 필요 레벨) */
  officerBest?:Record<string,number>;
  /** 사마의전에서 등용한 장수(recruit.ts) — 사마의 휘하 */
  recruited?:string[];
  /** 제갈량전에서 등용한 장수 — 제갈량 휘하 */
  recruitedZ?:string[];
  /** 공훈 등용에 바칠 공훈(두 이야기 함께, recruit.ts MERIT) — 없으면 아직 셈하지 않은 옛 저장 */
  merit?:number;
  /** 격파 호감: '이야기:이름' → 호감('S:맹달') */
  favor?:Record<string,number>;
  /** 나라 명성: '이야기:나라' → 쌓인 명성('S:촉') */
  fame?:Record<string,number>;
  /** 위·촉·오 군주에게 바친 명성('S:위') */
  fameSpent?:Record<string,number>;
  /** 얻은 칭호('S:위' — 그 이야기에서 그 나라를 다 모음) */
  titles?:string[];
  /** 주인공이 단 칭호(이야기 → 나라) */
  title?:{S?:Nation;Z?:Nation};
  /** 계승: 연 초한 영웅의 유산들과 지금 계승한 영웅(chuhan.ts) */
  legacies?:string[];heir?:string;
  /** 쓸 천명으로 바꿔 준 연의 천명(옛 인장) — 'S1-01:normal:2' 꼴. 같은 것을 두 번 주지 않는다. */
  sealPaid?:string[];
}
export interface Unlock {id:string;name:string;cost:number;effect:string}

export const UNLOCKS:Unlock[]=[
  {id:'veteran_start',name:'노련한 출발',cost:6,effect:'사마의와 출발 부대가 Lv.6으로 시작한다'},
  {id:'field_medic',name:'군의관',cost:6,effect:'의원이 체력을 모두 회복시킨다'},
  {id:'wide_network',name:'넓은 인맥',cost:8,effect:'사마사가 경기병을 이끌고 처음부터 함께 떠난다'},
  {id:'elite_recruits',name:'정예 모병',cost:8,effect:'모병·영입 부대의 레벨 +3'},
  {id:'heirloom',name:'가보',cost:10,effect:'출발할 때 보물 하나를 골라 들고 간다'},
  {id:'scout_map',name:'척후',cost:10,effect:'갈림길이 하나 더(4곳) 보인다'},
  {id:'second_chance',name:'천명의 가호',cost:12,effect:'원정마다 한 번, 패배해도 원정이 끝나지 않는다'},
];

const KEY='sama-meta-v1';
const TALE_IDS=new Set(ROUTES.flatMap(r=>r.tales.map(t=>t.id)));
export const freshMeta=():MetaState=>({version:1,mandate:0,earned:0,unlocks:[],chronicle:[],tales:[],endings:[],runs:0,wins:0,best:0});

export function readMeta(raw:string|null):MetaState{
  try{
    const m=JSON.parse(raw??'null') as Partial<MetaState>|null;
    if(!m||m.version!==1)return freshMeta();
    const ids=new Set(UNLOCKS.map(u=>u.id)),num=(v:unknown)=>Number.isFinite(v)&&(v as number)>=0?Math.floor(v as number):0;
    return {version:1,mandate:num(m.mandate),earned:num(m.earned),runs:num(m.runs),wins:num(m.wins),best:Math.min(RUN_FLOORS,num(m.best)),
      unlocks:Array.isArray(m.unlocks)?m.unlocks.filter(x=>typeof x==='string'&&ids.has(x)):[],
      chronicle:Array.isArray(m.chronicle)?m.chronicle.filter(x=>typeof x==='string'&&/^[SZ][1-3]-\d\d$/.test(x)):[],
      tales:Array.isArray(m.tales)?m.tales.filter(x=>typeof x==='string'&&TALE_IDS.has(x)):[],
      endings:Array.isArray(m.endings)?[...new Set(m.endings.filter(x=>typeof x==='string'&&(ALL_ENDINGS.includes(x)||ZHUGE_ENDINGS.includes(x))))]:[],
      ...(Array.isArray(m.customOfficers)?{customOfficers:readCustoms(m.customOfficers)}:{}),
      ...(Array.isArray(m.recruited)?{recruited:strList(m.recruited,200)}:{}),
      ...(Array.isArray(m.recruitedZ)?{recruitedZ:strList(m.recruitedZ,200)}:{}),
      ...(m.merit!==undefined?{merit:Math.min(1e7,num(m.merit))}:{}),
      ...cleanRecruit(m as Partial<MetaState>&{defeats?:unknown}),
      ...(Array.isArray(m.sealPaid)?{sealPaid:[...new Set(m.sealPaid.filter((x):x is string=>typeof x==='string'&&SEAL_KEY.test(x)))].slice(0,400)}:{}),
      ...cleanProgress(m)};
  }catch{return freshMeta();}
}
/** 등용 기록(호감·명성·칭호)을 정리한다. 옛 저장의 격파 횟수(defeats)는 사마의전 호감으로 옮긴다. */
function cleanRecruit(m:Partial<MetaState>&{defeats?:unknown}):Pick<MetaState,'favor'|'fame'|'fameSpent'|'titles'|'title'>{
  const out:Pick<MetaState,'favor'|'fame'|'fameSpent'|'titles'|'title'>={},nat=(x:unknown):x is Nation=>typeof x==='string'&&(NATIONS as readonly string[]).includes(x);
  const counts=(v:unknown,key:RegExp,max:number,limit:number)=>v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k,n])=>key.test(k)&&Number.isFinite(n)&&(n as number)>0).slice(0,limit).map(([k,n])=>[k,Math.min(max,Math.floor(n as number))])):{};
  const favor=m.favor!==undefined?counts(m.favor,/^[SZ]:.{1,12}$/,99,400):Object.fromEntries(Object.entries(counts(m.defeats,/^.{1,12}$/,99,60)).map(([k,n])=>['S:'+k,n]));
  if(Object.keys(favor).length)out.favor=favor;
  const fame=counts(m.fame,/^[SZ]:(위|촉|오|군웅|초|한)$/,9999,12);if(Object.keys(fame).length)out.fame=fame;
  const spent=counts(m.fameSpent,/^[SZ]:(위|촉|오)$/,9999,6);if(Object.keys(spent).length)out.fameSpent=spent;
  if(Array.isArray(m.titles)){const t=[...new Set(m.titles.filter((x):x is string=>typeof x==='string'&&/^[SZ]:(위|촉|오|군웅|초|한)$/.test(x)))];if(t.length)out.titles=t;}
  if(m.title&&typeof m.title==='object'){const t:{S?:Nation;Z?:Nation}={};if(nat(m.title.S))t.S=m.title.S;if(nat(m.title.Z))t.Z=m.title.Z;if(t.S||t.Z)out.title=t;}
  return out;
}
const SEAL_KEY=/^[SZ][1-3]-\d\d:(normal|extreme):[1-3]$/;
const isName=(k:string)=>k.length>0&&k.length<=12;
const strList=(v:unknown,limit:number)=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&x.length<=40))].slice(0,limit):[];
/** 연구·장수 효과·장수 최고 레벨을 정리한다(없는 칸·이상한 값은 버린다). */
function cleanProgress(m:Partial<MetaState>):Pick<MetaState,'research'|'officerPerks'|'officerBest'|'legacies'|'heir'>{
  const out:Pick<MetaState,'research'|'officerPerks'|'officerBest'|'legacies'|'heir'>={};
  if(Array.isArray(m.legacies)){const l=[...new Set(m.legacies.filter(x=>typeof x==='string'&&LEGACIES.some(y=>y.hero===x)))];if(l.length){out.legacies=l;if(typeof m.heir==='string'&&l.includes(m.heir))out.heir=m.heir;}}
  if(m.research&&typeof m.research==='object'){const r:Record<string,number>={};for(const n of RESEARCH){const v=(m.research as Record<string,unknown>)[n.id];if(Number.isInteger(v)&&(v as number)>0)r[n.id]=Math.min(n.max,v as number);}if(Object.keys(r).length)out.research=r;}
  if(m.officerPerks&&typeof m.officerPerks==='object'){const r:NonNullable<MetaState['officerPerks']>={};
    for(const [k,v] of Object.entries(m.officerPerks).slice(0,300)){if(!isName(k)||!v||typeof v!=='object')continue;const learned=strList((v as {learned?:unknown}).learned,8),equipped=strList((v as {equipped?:unknown}).equipped,4).filter(x=>learned.includes(x));r[k]={learned,equipped};}
    if(Object.keys(r).length)out.officerPerks=r;}
  if(m.officerBest&&typeof m.officerBest==='object'){const r:Record<string,number>={};for(const [k,v] of Object.entries(m.officerBest).slice(0,300))if(isName(k)&&Number.isInteger(v)&&(v as number)>=1)r[k]=Math.min(60,v as number);if(Object.keys(r).length)out.officerBest=r;}
  return out;
}
/** 장수가 닿은 레벨을 기록한다(가장 높은 것만 남는다). */
export function recordOfficerLevels(m:MetaState,party:ReadonlyArray<{name:string;level:number}>){
  const best=m.officerBest??={};for(const u of party)if(u.level>(best[u.name]??0))best[u.name]=Math.min(60,u.level);
}
/** 사마의전 결말만(본 결말 수·연구 조건은 사마의전 결말 ALL_ENDINGS로 센다 — 제갈량전 결말은 따로). */
export const simaEndings=(m:Pick<MetaState,'endings'>)=>m.endings.filter(e=>ALL_ENDINGS.includes(e));
export function loadMeta():MetaState{try{return readMeta(localStorage.getItem(KEY));}catch{return freshMeta();}}
export function saveMeta(m:MetaState){try{localStorage.setItem(KEY,JSON.stringify(m));}catch{/* storage optional */}}

export function buyUnlock(m:MetaState,id:string){
  const u=UNLOCKS.find(x=>x.id===id);
  if(!u||m.unlocks.includes(id)||m.mandate<u.cost)return false;
  m.mandate-=u.cost;m.unlocks.push(id);return true;
}
/** 연의 전장을 이긴 순간 바로 기록한다(원정이 나중에 끝나도 남는다). */
export function recordStory(m:MetaState,stage:string){if(!m.chronicle.includes(stage))m.chronicle.push(stage);}
/**
 * 연의 천명(옛 인장): 장마다 일반 3 + 극한 3. 처음 얻을 때마다 쓸 천명 1을 준다(연구에 쓴다).
 * earned는 '장:난이도' → 얻은 칸 번호. 준 것은 sealPaid에 남아, 다시 이기거나 지난 기록을 읽어도 두 번 주지 않는다.
 */
export function paySeals(m:MetaState,earned:Readonly<Record<string,readonly number[]|undefined>>,stageIds:readonly string[]):number{
  const paid=new Set(m.sealPaid??[]);let gain=0;
  for(const id of stageIds)for(const d of ['normal','extreme'] as const)for(const slot of earned[`${id}:${d}`]??[]){
    const k=`${id}:${d}:${slot}`;if(!SEAL_KEY.test(k)||paid.has(k))continue;paid.add(k);gain++;}
  if(gain){m.sealPaid=[...paid];m.mandate+=gain;m.earned+=gain;}
  return gain;
}
/** 원정이 끝났을 때 한 번만 천명을 준다. */
export function settleRun(m:MetaState,run:Run){
  if(run.mandateGranted||(run.status!=='won'&&run.status!=='lost'))return 0;
  const gain=mandateEarned(run);run.mandateGranted=true;
  m.mandate+=gain;m.earned+=gain;m.runs++;if(run.status==='won')m.wins++;
  m.best=Math.max(m.best,run.status==='won'?RUN_FLOORS:run.floor);
  for(const s of run.storyDone??[])recordStory(m,s);
  for(const t of run.talesDone??[])if(!m.tales.includes(t))m.tales.push(t);
  if(run.status==='won'){const e=endingFor(run.route).id;if(!m.endings.includes(e))m.endings.push(e);}
  return gain;
}
