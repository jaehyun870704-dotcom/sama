/**
 * 시나리오 모드 — 게임의 본편. 『삼국지연의』의 사마의 이야기(연의 32장)를 따라가다가,
 * 사마의의 인생에서 세 번 갈림길(201년 출사 · 220년 조조의 죽음 · 234년 이후)을 만난다.
 * 정사를 고르면 연의 장이 이어지고, 다른 길을 고르면 가상 시나리오의 장(가상 전장 3 + 우두머리)이
 * 이어진다. 한 번 가상으로 들어선 길은 결말까지 가상으로 간다(결말 15종).
 *
 * 한 장의 흐름: 이야기 장면(사마의의 대사 선택) → 출진 전 정비(반드시) → 전투 → 전투 뒤 장면 → 다음 장.
 * 레벨업용 반복 전투(수련·천명의 원정)는 이 흐름 밖의 '반복 퀘스트'로 따로 둔다.
 *
 * 이 모듈은 순서·상태·선택 효과의 순수 규칙만 둔다. 화면은 scenario-ui.ts, 무대 연출은 story-stage.ts.
 */
import {ROUTES,routeById,routesFor,validRoute,type Route,type Tale} from './fate.ts';
import {STORY_ORDER,RUN_FLOORS,XP_PER_LEVEL,grantXp,registerTales,landClass,type Run,type RunUnit} from './roguelike.ts';
import {evolvedClass,type UnitClass} from '../../core/src/index.ts';
import type {ChapterScript,ChoiceEffect,ExtraTale,ScenarioPack,ScriptStep} from './scenario-types.ts';
import history1 from './scenario/history-1.ts';
import history2 from './scenario/history-2.ts';
import history3 from './scenario/history-3.ts';
import ifA from './scenario/if-a.ts';
import ifB from './scenario/if-b.ts';
import ifC from './scenario/if-c.ts';

export const PACKS:ScenarioPack[]=[history1,history2,history3,ifA,ifB,ifC];
const SCRIPTS=new Map<string,ChapterScript>(PACKS.flatMap(p=>p.chapters.map(c=>[c.id,c] as const)));
export const EXTRA_TALES:ExtraTale[]=PACKS.flatMap(p=>p.extraTales??[]);
export const ENDING_NOTES=PACKS.flatMap(p=>p.endingNotes??[]);
export const scriptOf=(id:string)=>SCRIPTS.get(id);

export type StepKind='story'|'fate'|'tale'|'boss'|'ending';
export interface ScenarioStep {
  id:string;kind:StepKind;act:1|2|3;
  /** 연의 장의 스테이지 id */
  stage?:string;
  /** 가상 전장 */
  tale?:Tale;
  /** 이 장이 속한 루트 */
  route?:string;
}

export interface ScenarioOfficer {name:string;unitClass:UnitClass;level:number;xp:number}
export interface ScenarioState {
  version:1;
  route:{1?:string;2?:string;3?:string};
  /** 마친 장 id(연의·가상·갈림길·결말) */
  done:string[];
  /** 대사 선택으로 남은 표식 */
  flags:string[];
  /** 장 id → 고른 선택지 id */
  choices:Record<string,string>;
  /** 가상 루트에서 함께 싸우는 장수(이름 → 병종·레벨·경험치) */
  officers:Record<string,ScenarioOfficer>;
  /** 가상 전장 바꿔치기: 원래 전장 id → 다른 전장 id */
  paths:Record<string,string>;
}
export const freshScenario=():ScenarioState=>({version:1,route:{},done:[],flags:[],choices:{},officers:{},paths:{}});

const KEY='sama-scenario-v1';
export function readScenario(raw:string|null):ScenarioState{
  try{
    const s=JSON.parse(raw??'null') as Partial<ScenarioState>|null;if(!s||s.version!==1)return freshScenario();
    const route=s.route&&typeof s.route==='object'?s.route:{};
    const clean:ScenarioState={version:1,route:validRoute(route)?{...route}:{},done:Array.isArray(s.done)?s.done.filter(x=>typeof x==='string'):[],
      flags:Array.isArray(s.flags)?s.flags.filter(x=>typeof x==='string'):[],choices:{},officers:{},paths:{}};
    for(const [k,v] of Object.entries(s.choices??{}))if(typeof v==='string')clean.choices[k]=v;
    for(const [k,v] of Object.entries(s.paths??{}))if(typeof v==='string'&&EXTRA_TALES.some(t=>t.id===v&&t.replaces===k))clean.paths[k]=v;
    for(const [k,o] of Object.entries(s.officers??{}))if(o&&typeof o.unitClass==='string'&&Number.isInteger(o.level)&&o.level>=1&&o.level<=60&&Number.isInteger(o.xp)&&o.xp>=0&&o.xp<XP_PER_LEVEL)clean.officers[k]={name:k,unitClass:o.unitClass as UnitClass,level:o.level,xp:o.xp};
    return clean;
  }catch{return freshScenario();}
}
export function loadScenario(){try{return readScenario(localStorage.getItem(KEY));}catch{return freshScenario();}}
export function saveScenario(s:ScenarioState){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{/* storage optional */}}

/** 그 루트의 가상 전장(선택으로 바뀐 것 반영). */
export function routeTales(route:Route,state:Pick<ScenarioState,'paths'>):Tale[]{
  return route.tales.map(t=>{const alt=EXTRA_TALES.find(x=>x.id===state.paths[t.id]);return alt?{id:alt.id,title:alt.title,intro:alt.intro,target:alt.target}:t;});
}
/** 가상 전장 id(원래 것이든 바뀐 것이든)로 찾는다. */
export function scenarioTale(id:string|undefined):Tale|undefined{
  if(!id)return undefined;const base=ROUTES.flatMap(r=>r.tales).find(t=>t.id===id);if(base)return base;
  const alt=EXTRA_TALES.find(t=>t.id===id);return alt?{id:alt.id,title:alt.title,intro:alt.intro,target:alt.target}:undefined;
}

// 원정·세션이 다른 가상 전장 id도 알아보게 한다(저장 검증·재생).
registerTales(id=>scenarioTale(id));

/**
 * 지금까지의 선택으로 정해지는 장의 순서. 아직 고르지 않은 갈림길에서 끊긴다(그 갈림길까지 포함).
 */
export function scenarioPath(state:ScenarioState):ScenarioStep[]{
  const out:ScenarioStep[]=[],r=state.route;
  const history=(act:1|2|3,ids:string[])=>{for(const id of ids)out.push({id,kind:'story',act,stage:id});};
  const ifRoute=(route:Route)=>{for(const t of routeTales(route,state))out.push({id:t.id,kind:'tale',act:route.act,tale:t,route:route.id});out.push({id:`${route.id}:boss`,kind:'boss',act:route.act,route:route.id});};
  // 상편: 출사 전 네 장(하내·낙양·육혼산·꿈) 뒤에 첫 갈림길.
  history(1,STORY_ORDER[1].slice(0,4));
  out.push({id:'fate:1',kind:'fate',act:1});
  const r1=routeById(r[1]);if(!r1)return out;
  if(r1.history)history(1,STORY_ORDER[1].slice(4));else ifRoute(r1);
  out.push({id:`fate:2:${r1.id}`,kind:'fate',act:2});
  const r2=routeById(r[2]);if(!r2)return out;
  if(r2.history)history(2,STORY_ORDER[2]);else ifRoute(r2);
  out.push({id:`fate:3:${r2.id}`,kind:'fate',act:3});
  const r3=routeById(r[3]);if(!r3)return out;
  if(r3.history)history(3,STORY_ORDER[3]);else ifRoute(r3);
  out.push({id:`ending:${r3.id}`,kind:'ending',act:3,route:r3.id});
  return out;
}
/** 지금 할 장(마치지 않은 첫 장). 모두 마쳤으면 undefined(결말까지 본 것). */
export function currentStep(state:ScenarioState){const done=new Set(state.done);return scenarioPath(state).find(s=>!done.has(s.id));}
export const isDone=(state:ScenarioState,id:string)=>state.done.includes(id);

/** 갈림길 장 id의 선택지(루트 id). */
export function fateChoices(state:ScenarioState,stepId:string):Route[]{
  const [,actText]=stepId.split(':'),act=Number(actText) as 1|2|3;
  return routesFor(act,state.route);
}

/** 대사 선택을 기록하고 그 효과(표식·바꿔치기·영입)를 상태에 남긴다. 갈림길이면 루트를 고른다. */
export function choose(state:ScenarioState,step:ScenarioStep,optionId:string,effects:ChoiceEffect[]=[],heroLevel=1){
  state.choices[step.id]=optionId;
  if(step.kind==='fate'){
    if(!fateChoices(state,step.id).some(r=>r.id===optionId))return false;
    state.route={...state.route,[step.act]:optionId};
    const route=routeById(optionId)!;
    // 가상으로 들어서면 사마의를 따르는 장수들이 모인다(그 길의 적은 빼고).
    if(!route.history)joinCompanions(state,route,heroLevel);
    else for(const name of Object.keys(state.officers))if(foesOf(route).includes(name))delete state.officers[name];
  }
  for(const e of effects){
    if(e.kind==='flag'&&!state.flags.includes(e.flag))state.flags.push(e.flag);
    if(e.kind==='path'){const alt=EXTRA_TALES.find(t=>t.id===e.tale);if(alt)state.paths[alt.replaces]=alt.id;}
    if(e.kind==='recruit'&&!state.officers[e.name])state.officers[e.name]={name:e.name,unitClass:landClass(e.unitClass),level:Math.max(1,heroLevel-1),xp:0};
  }
  return true;
}
/** 그 길에서 적으로 만나는 사람. */
export function foesOf(route:Route){return [route.region.boss.name,...route.tales.map(t=>t.target.name),...EXTRA_TALES.filter(t=>t.route===route.id).map(t=>t.target.name)];}
/** 가상 루트의 기본 동료: 조진(기병)·장합(창병)·곽회(궁병)·사마랑(의원). 원소 쪽에서 시작한 길에는 조진이 없다. */
export const COMPANIONS:Array<{name:string;unitClass:UnitClass}>=[{name:'조진',unitClass:'cavalry'},{name:'장합',unitClass:'spearman'},{name:'곽회',unitClass:'archer'},{name:'사마랑',unitClass:'physician'}];
export function joinCompanions(state:ScenarioState,route:Route,heroLevel:number){
  const yuanSide=state.route[1]==='yuan',foes=new Set(foesOf(route));
  // 원소 쪽 길: 조진 대신 백마에서 살아남은 문추가 곁에 선다.
  if(yuanSide&&!foes.has('문추')&&!state.officers['문추'])state.officers['문추']={name:'문추',unitClass:'cavalry',level:Math.max(1,heroLevel-1),xp:0};
  for(const name of Object.keys(state.officers))if(foes.has(name))delete state.officers[name];
  for(const c of COMPANIONS){if(foes.has(c.name)||(yuanSide&&c.name==='조진')||state.officers[c.name])continue;state.officers[c.name]={name:c.name,unitClass:c.unitClass,level:Math.max(1,heroLevel-1),xp:0};}
}
export function finishStep(state:ScenarioState,id:string){if(!state.done.includes(id))state.done.push(id);}
/** 가상 전장에서 꺾은 적장이 본래 사마의의 동료(장합 등)라면 귀순해 부대로 돌아온다. 돌아온 이름을 돌려준다. */
export function winOver(state:ScenarioState,step:ScenarioStep,level:number){
  const name=step.tale?.target.name,c=COMPANIONS.find(x=>x.name===name);
  if(step.kind!=='tale'||!c||state.officers[c.name])return undefined;
  state.officers[c.name]={name:c.name,unitClass:c.unitClass,level:Math.max(1,level),xp:0};return c.name;
}

/** 장면 진행: 표식에 따라 보일 단계만 고른다. */
export function visibleSteps(steps:ScriptStep[],flags:readonly string[]){return steps.filter(s=>(!s.when||flags.includes(s.when))&&(!s.unless||!flags.includes(s.unless)));}

/** 가상 전장의 원정 층(적 레벨 기준): 상편 2~6, 중편 8~12, 하편 14~18. */
export function floorFor(step:ScenarioStep,state:ScenarioState){
  const base=(step.act-1)*6;
  if(step.kind==='boss')return base+6;
  const route=routeById(step.route);if(!route)return base+2;
  const i=routeTales(route,state).findIndex(t=>t.id===step.id);
  return Math.min(RUN_FLOORS,base+2+Math.max(0,i));
}

/** 가상 전장에 나가는 부대(사마의 + 고른 장수들, 최대 6). heroLevel/heroXp는 연의 진행의 사마의. */
export function scenarioParty(state:ScenarioState,heroLevel:number,heroXp:number,picked?:string[]):RunUnit[]{
  const hero:RunUnit={id:'sima_yi',name:'사마의',unitClass:evolvedClass('strategist',heroLevel),level:heroLevel,xp:Math.min(XP_PER_LEVEL-1,heroXp),hp:1,hero:true};
  const names=(picked??Object.keys(state.officers)).filter(n=>state.officers[n]).slice(0,6);
  return [hero,...names.map((n,i)=>{const o=state.officers[n]!;return {id:'of'+(i+1),name:n,unitClass:evolvedClass(o.unitClass,o.level),level:o.level,xp:o.xp,hp:1,officer:true as const};})];
}

/** 전투가 끝나고: 장수들에게 번 경험치 + 승리 보너스를 주고(진화 포함), 소식 문장을 돌려준다. */
export function rewardOfficers(state:ScenarioState,party:RunUnit[],earned:Record<string,number>,bonus:number,mult=1):string[]{
  const run={party:[] as RunUnit[],news:[] as string[],relics:[],fallen:[]} as unknown as Run;
  for(const u of party){if(u.hero||!state.officers[u.name])continue;const o=state.officers[u.name]!;
    const unit:RunUnit={id:u.id,name:o.name,unitClass:evolvedClass(o.unitClass,o.level),level:o.level,xp:o.xp,hp:1,officer:true};run.party.push(unit);
    grantXp(run,Math.round((bonus+(earned[u.id]??0))*mult),[unit]);
    state.officers[u.name]={name:o.name,unitClass:unit.unitClass,level:unit.level,xp:unit.xp};}
  return run.news;
}

/** 결말 덧말: 이번 이야기에서 남긴 표식에 따른 한 줄들. */
export function endingNotes(state:ScenarioState){return ENDING_NOTES.filter(n=>state.flags.includes(n.flag)).map(n=>n.line);}
