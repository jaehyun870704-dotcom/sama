/**
 * 천명의 원정 — 로그라이크 모드의 순수 규칙.
 *
 * 게임의 중심. 한 번의 원정은 상편·중편·하편 3편 18층(6층마다 우두머리). 층마다 갈림길 중 하나를 고른다.
 * 연의 32전장은 원정 안의 '연의 전장' 갈림길로 나온다. 한 번 이긴 연의 전장은 영구 기록(천명 기록)에 남아
 * 다음 원정은 그다음 이야기로 이어진다. 원정이 끝나면 천명을 얻어 영구 해금에 쓴다(meta.ts).
 * 전장은 원정 씨앗과 층으로 결정론적으로 생성되고, 쓰러진 부대는 원정에서 영원히 빠진다.
 * 경험치로 레벨이 오르면 병종이 진화한다(classes.ts의 계통).
 * 화면과 저장은 main.ts가 맡는다. 이 모듈은 상태를 바꾸는 순수 함수만 둔다.
 */
import {Rng,VARIANTS,evolvedClass,nextEvolution,profileOf,evolveUnit,familyOf,type UnitClass,type StageDef,type MapFile,type UnitSpawnSpec,type BattleState} from '../../core/src/index.ts';
import {classNames,troopStrategies} from './troops.ts';
import {availableStrategies,allStrategies} from './officers.ts';
import {ROUTES,routeById,routesFor,fatePoint,type Tale} from './fate.ts';
import {romanceOf} from './romance.ts';

export const FLOORS_PER_ACT=6;
export const RUN_FLOORS=18;
export const PARTY_LIMIT=6;
export const XP_PER_LEVEL=100;

export interface RunUnit {id:string;name:string;unitClass:UnitClass;level:number;xp:number;/** 체력 비율 0~1 */hp:number;hero?:true}
export type NodeKind='battle'|'elite'|'boss'|'recruit'|'rest'|'treasure'|'training'|'story'|'fate'|'tale';
export interface RunNode {kind:NodeKind;label:string;detail:string;/** 연의 전장의 스테이지 id */stage?:string;/** 가상 전장 id */tale?:string}
export interface Relic {id:string;name:string;effect:string}
export interface Run {
  version:1;seed:number;floor:number;party:RunUnit[];relics:string[];fallen:string[];
  status:'map'|'reward'|'won'|'lost';nextId:number;
  /** 지금 치르는 전투(끝나기 전에 다른 갈림길로 빠질 수 없다) */
  active?:NodeKind;
  /** 보상 화면에서 고를 수 있는 것 */
  offer?:RewardOption[];
  /** 마지막으로 일어난 일 (진화·레벨업 등), 화면에 한 번 보여 준다 */
  news:string[];
  /** 지금 치르는 연의 전장 */
  activeStage?:string;
  /** 지금까지 이긴 연의 전장(원정 시작 때 천명 기록을 이어받는다) */
  chronicle?:string[];
  /** 이번 원정에서 이긴 연의 전장 */
  storyDone?:string[];
  /** 이번 원정에서 꺾은 우두머리 수 */
  bosses?:number;
  /** 원정 시작 때 적용된 영구 해금 */
  unlocks?:string[];
  /** 천명의 가호: 한 번 패배해도 원정이 끝나지 않는다 */
  secondChance?:boolean;
  /** 원정 종료 보상(천명)을 이미 받았는지 */
  mandateGranted?:boolean;
  /** 운명의 갈림길에서 고른 길(편 → 루트 id) */
  route?:{1?:string;2?:string;3?:string};
  /** 이번 원정에서 이긴 가상 전장 */
  talesDone?:string[];
  /** 지금 치르는 가상 전장 */
  activeTale?:string;
}
export type RewardOption={kind:'recruit';unitClass:UnitClass;level:number}|{kind:'heal';amount:number}|{kind:'relic';relic:string}|{kind:'xp';amount:number};

export const RELICS:Relic[]=[
  {id:'whetstone',name:'숫돌',effect:'모든 부대 공격 +3'},
  {id:'lamellar',name:'찰갑',effect:'모든 부대 방어 +3'},
  {id:'warhorse',name:'준마',effect:'기병 계열 이동 +1'},
  {id:'drum',name:'진군고',effect:'보병·창병 계열 이동 +1'},
  {id:'banner',name:'군기',effect:'전투 시작 2턴 동안 사기 상승'},
  {id:'herbs',name:'약초 꾸러미',effect:'전투 뒤 체력 20% 추가 회복'},
  {id:'sunzi',name:'손자병법',effect:'책략 MP +12, 지력 +3'},
  {id:'quiver',name:'화살통',effect:'궁·노 계열 공격 +5'},
];

/** 세 편: 상편(관중) · 중편(기산) · 하편(요동). 편마다 지형·적 구성·우두머리가 다르다. */
export interface Region {name:string;arc:string;terrain:0|1|2;boss:{name:string;unitClass:UnitClass};pool:UnitClass[]}
export const REGIONS:Region[]=[
  {name:'관중 평원',arc:'상편',terrain:0,boss:{name:'마초',unitClass:'cavalry' as UnitClass},pool:['infantry','spearman','cavalry','archer','crossbow','slinger','horseArcher'] as UnitClass[]},
  {name:'기산 산악',arc:'중편',terrain:1,boss:{name:'제갈량',unitClass:'strategist' as UnitClass},pool:['infantry','spearman','bandit','assassin','archer','crossbow','taoist','strategist','heavyCav'] as UnitClass[]},
  {name:'요동 요수',arc:'하편',terrain:2,boss:{name:'공손연',unitClass:'infantry' as UnitClass},pool:['infantry','spearman','cavalry','horseArcher','crossbow','archer','heavyCav','bandit','rattan'] as UnitClass[]},
];
export const actOf=(floor:number)=>Math.min(3,Math.max(1,Math.ceil(floor/FLOORS_PER_ACT)));
export const regionOf=(floor:number)=>REGIONS[actOf(floor)-1]!;
/** 그 원정이 고른 길의 지역: 상편은 하나, 중편·하편은 운명의 갈림길에서 고른 루트(고르기 전에는 정사). */
export function regionFor(run:{route?:Run['route']},floor:number):Region{
  const act=actOf(floor) as 1|2|3;
  return routeById(run.route?.[act])?.region??REGIONS[act-1]!;
}
/** 이 편이 정사를 따라가는가(연의 전장이 이어지는가). 하편 정사는 중편도 정사여야 한다. */
export function onHistory(run:{route?:Run['route']},act:number){
  if(act===1)return (run.route?.[1]??'refuse')==='refuse';
  const r2=run.route?.[2]??'wei';if(act===2)return r2==='wei';
  return r2==='wei'&&(run.route?.[3]??'patience')==='patience';
}
export const isBossFloor=(floor:number)=>floor%FLOORS_PER_ACT===0;

/** 편마다 연의 전장 순서(연의의 시간 순). */
export const STORY_ORDER:Record<1|2|3,string[]>={
  1:Array.from({length:11},(_,i)=>`S1-${String(i+1).padStart(2,'0')}`),
  2:Array.from({length:14},(_,i)=>`S2-${String(i+1).padStart(2,'0')}`),
  3:Array.from({length:7},(_,i)=>`S3-${String(i+1).padStart(2,'0')}`),
};
/** 이 층에서 나올 가상 전장: 고른 루트의 이야기 중 이번 원정에서 아직 치르지 않은 다음 것. */
export function nextTale(run:Run):Tale|undefined{
  const act=actOf(run.floor) as 1|2|3;if(onHistory(run,act))return undefined;
  const route=routeById(run.route?.[act]);if(!route)return undefined;
  const done=new Set(run.talesDone??[]);return route.tales.find(t=>!done.has(t.id));
}
export const taleById=(id:string|undefined)=>ROUTES.flatMap(r=>r.tales).find(t=>t.id===id);
/** 운명의 갈림길에서 길을 고른다. 이미 고른 편이거나 다른 편의 길이면 거절한다. */
export function chooseFate(run:Run,routeId:string){
  const act=actOf(run.floor) as 1|2|3,route=routeById(routeId);
  if(!route||route.act!==act||run.route?.[act]||!routesFor(act,run.route).includes(route))return false;
  run.route={...run.route,[act]:routeId};run.news=[`운명의 갈림길 — 「${route.choice}」. ${route.history?'역사대로 흘러간다.':'역사가 갈라졌다. 이제부터는 일어나지 않은 이야기다.'}`];
  return true;
}

/** 이 층에서 나올 연의 전장: 아직 이기지 못한 다음 이야기, 다 이겼으면 이번 원정에서 안 치른 것. */
export function nextStory(run:Run):string|undefined{
  if(!onHistory(run,actOf(run.floor)))return undefined;
  const list=STORY_ORDER[actOf(run.floor) as 1|2|3],known=new Set(run.chronicle??[]),done=new Set(run.storyDone??[]);
  return list.find(id=>!known.has(id))??list.find(id=>!done.has(id));
}

/** 영입 가능한 기본 병종 */
export const RECRUITS:UnitClass[]=['infantry','spearman','cavalry','archer','crossbow','fengshui','horseArcher','slinger','assassin','rattan','elephant','monk','taoist','physician','bandit','heavyCav'];

const rngFor=(run:{seed:number},salt:number)=>new Rng((run.seed*7919+salt*104729)>>>0||1);

function unitName(cls:UnitClass){return classNames[cls]??cls;}
/** 한국어 조사: 받침 유무(로는 ㄹ받침도 '로'). */
const fin=(w:string)=>{const c=w.charCodeAt(w.length-1);return c>=0xac00&&c<=0xd7a3?(c-0xac00)%28:0;};
export const ga=(w:string)=>w+(fin(w)?'이':'가'),eul=(w:string)=>w+(fin(w)?'을':'를'),ro=(w:string)=>{const f=fin(w);return w+(f&&f!==8?'으로':'로');};
/** 같은 병종이 둘 이상이면 갑·을·병… 으로 구분한다. */
function uniqueName(run:Run,cls:UnitClass,self?:RunUnit){
  const base=unitName(cls),taken=new Set(run.party.filter(u=>u!==self&&!u.hero).map(u=>u.name));
  if(!taken.has(base))return base;
  for(const tag of ['을','병','정','무','기'])if(!taken.has(`${base} ${tag}`))return `${base} ${tag}`;
  return base;
}

export interface RunOptions {chronicle?:string[];unlocks?:string[];relic?:string}
export const has=(run:Run,unlock:string)=>!!run.unlocks?.includes(unlock);
export function newRun(seed:number,start:UnitClass[],opts:RunOptions={}):Run{
  const run:Run={version:1,seed,floor:1,party:[],relics:[],fallen:[],status:'map',nextId:1,news:[],chronicle:[...(opts.chronicle??[])],storyDone:[],bosses:0,unlocks:[...(opts.unlocks??[])]};
  const level=has(run,'veteran_start')?6:4;
  run.party.push({id:'sima_yi',name:'사마의',unitClass:evolvedClass('strategist',level),level,xp:0,hp:1,hero:true});
  for(const cls of start)recruit(run,cls,level);
  if(opts.relic&&RELICS.some(r=>r.id===opts.relic))run.relics.push(opts.relic);
  if(has(run,'second_chance'))run.secondChance=true;
  return run;
}

/** 출발 부대 후보 세 묶음(병종 3개씩). */
export function startingOffers(seed:number,unlocks:string[]=[]):UnitClass[][]{
  const r=new Rng(seed>>>0||1),pick=()=>RECRUITS[r.int(0,RECRUITS.length-1)]!,wide=unlocks.includes('wide_network');
  const size=wide?4:3,group=()=>Array.from({length:size},pick);
  return [['infantry','archer','cavalry',...(wide?['fengshui' as UnitClass]:[])],group(),group(),...(wide?[group()]:[])];
}

export function recruit(run:Run,cls:UnitClass,level:number){
  if(run.party.length>=PARTY_LIMIT)return false;
  const evolved=evolvedClass(cls,level);
  run.party.push({id:'r'+run.nextId++,name:uniqueName(run,evolved),unitClass:evolved,level,xp:0,hp:1});
  return true;
}

/** 이 층의 갈림길 세 곳. 같은 원정·같은 층이면 언제나 같다. */
export function floorChoices(run:Run):RunNode[]{
  const f=run.floor;
  const act=actOf(f);
  if(!run.route?.[act as 1|2|3]){const p=fatePoint(act as 1|2|3,run.route);return [{kind:'fate',label:`운명의 갈림길 · ${p.title}`,detail:p.prompt}];}
  if(isBossFloor(f)){const g=regionFor(run,f),b=g.boss;return [{kind:'boss',label:`우두머리 · ${b.name}`,detail:`${g.arc}의 끝, ${g.name}의 주인. 격퇴하면 체력이 모두 회복된다.`}];}
  const r=rngFor(run,f),kinds:NodeKind[]=['battle'],size=has(run,'scout_map')?4:3;
  // 각 편의 첫 층을 뺀 모든 층에 연의 전장이 하나 나온다(남아 있다면).
  const story=f%FLOORS_PER_ACT!==1?nextStory(run):undefined,tale=!story&&f%FLOORS_PER_ACT!==1?nextTale(run):undefined;
  if(story)kinds.push('story');if(tale)kinds.push('tale');
  const extra:NodeKind[]=f>=2?['battle','elite','recruit','rest','treasure','training']:['battle','recruit','training'];
  while(kinds.length<size){const k=extra[r.int(0,extra.length-1)]!;if(k!=='battle'&&kinds.includes(k))continue;kinds.push(k);}
  return kinds.map(kind=>kind==='story'?{...describeNode(kind),stage:story!}:kind==='tale'?{...describeNode(kind),tale:tale!.id}:describeNode(kind));
}
function describeNode(kind:NodeKind):RunNode{
  switch(kind){
    case 'battle':return {kind,label:'전투',detail:'적 부대를 섬멸한다. 경험치 120과 보상 하나.'};
    case 'elite':return {kind,label:'정예 전투',detail:'진화한 정예가 섞인 강적. 경험치 180과 보물 보상.'};
    case 'boss':return {kind,label:'우두머리',detail:''};
    case 'recruit':return {kind,label:'모병소',detail:'새 병종 하나를 부대에 들인다.'};
    case 'rest':return {kind,label:'의원',detail:'모든 부대의 체력을 60% 회복한다.'};
    case 'treasure':return {kind,label:'보물고',detail:'원정 내내 효과가 이어지는 보물 하나를 고른다.'};
    case 'training':return {kind,label:'수련장',detail:'모든 부대가 경험치 100을 얻는다.'};
    case 'story':return {kind,label:'연의 전장',detail:'연의 이야기 속 전투. 사마의 본대가 출진한다. 이기면 경험치 150과 보물, 영구 기록. 지면 원정이 끝난다.'};
    case 'tale':return {kind,label:'가상 전장',detail:'역사가 갈라진 세계의 전투. 이름난 적장을 물리치면 승리. 경험치 160과 보물, 가상 기록.'};
    case 'fate':return {kind,label:'운명의 갈림길',detail:''};
  }
}

const avgLevel=(run:Run)=>Math.round(run.party.reduce((n,u)=>n+u.level,0)/Math.max(1,run.party.length));
const recruitLevel=(run:Run)=>Math.max(1,avgLevel(run)-1+(has(run,'elite_recruits')?3:0));

/** 비전투 갈림길을 고르면 곧장 결과가 정해진다(모병·보물은 보상 화면으로). */
export function visitNode(run:Run,node:RunNode){
  run.news=[];
  if(node.kind==='rest'){for(const u of run.party)u.hp=Math.min(1,u.hp+(has(run,'field_medic')?1:.6));run.news.push('의원에서 모든 부대의 체력을 회복했다.');advance(run);return;}
  if(node.kind==='training'){grantXp(run,100);advance(run);return;}
  const r=rngFor(run,run.floor*31+7);
  if(node.kind==='recruit'){run.offer=pickDistinct(r,RECRUITS,3).map(unitClass=>({kind:'recruit' as const,unitClass,level:recruitLevel(run)}));run.status='reward';return;}
  if(node.kind==='treasure'){run.offer=relicOffer(run,r);run.status='reward';}
}

function pickDistinct<T>(r:Rng,from:T[],n:number){const pool=[...from],out:T[]=[];while(out.length<n&&pool.length)out.push(pool.splice(r.int(0,pool.length-1),1)[0]!);return out;}
function relicOffer(run:Run,r:Rng):RewardOption[]{const left=RELICS.filter(x=>!run.relics.includes(x.id)).map(x=>x.id);return pickDistinct(r,left,3).map(relic=>({kind:'relic' as const,relic}));}

/** 경험치를 나눠 주고 레벨업·진화를 소식으로 남긴다. */
export function grantXp(run:Run,amount:number,who=run.party){
  const ups:string[]=[];
  for(const u of who){
    u.xp+=amount;let leveled=false;
    while(u.xp>=XP_PER_LEVEL){u.xp-=XP_PER_LEVEL;u.level++;leveled=true;
      const to=evolvedClass(u.unitClass,u.level);
      if(to!==u.unitClass){const from=u.hero?'사마의':u.name;u.unitClass=to;if(!u.hero)u.name=uniqueName(run,to,u);run.news.push(`진화! ${ga(from)} ${ro(unitName(to))} 거듭났다 (Lv.${u.level})${VARIANTS[to]?.bloom?` · 개화 「${VARIANTS[to]!.bloom!.name}」 ${VARIANTS[to]!.bloom!.description}`:''}`);}
    }
    if(leveled)ups.push(`${u.hero?'사마의':u.name} ${u.level}`);
  }
  if(ups.length)run.news.push(`레벨 상승 · ${ups.join(' · ')}`);
}

/** 전투 결과를 원정에 반영한다. survivors: 살아남은 부대의 체력 비율. */
export function finishBattle(run:Run,node:RunNode,victory:boolean,survivors:Record<string,number>){
  run.news=[];delete run.active;delete run.activeTale;
  const lost=run.party.filter(u=>survivors[u.id]===undefined);
  for(const u of lost)run.fallen.push(`${u.hero?'사마의':u.name} Lv.${u.level} · ${run.floor}층`);
  if(!victory||!survivors.sima_yi){
    run.party=run.party.filter(u=>survivors[u.id]!==undefined||u.hero);
    if(spendSecondChance(run))return;
    run.news.push(survivors.sima_yi?`${run.floor}층 전투에서 패했다. 원정은 여기서 끝난다.`:`사마의가 ${run.floor}층에서 쓰러졌다. 원정은 여기서 끝난다.`);run.status='lost';run.party=run.party.filter(u=>survivors[u.id]!==undefined);return;}
  run.party=run.party.filter(u=>survivors[u.id]!==undefined);
  for(const u of run.party)u.hp=Math.max(.05,survivors[u.id]!);
  if(lost.length)run.news.push(`잃은 부대: ${lost.map(u=>u.name).join(', ')}`);
  if(run.relics.includes('herbs'))for(const u of run.party)u.hp=Math.min(1,u.hp+.2);
  if(node.kind==='boss'){for(const u of run.party)u.hp=1;run.bosses=(run.bosses??0)+1;}
  grantXp(run,node.kind==='boss'?200:node.kind==='tale'?160:node.kind==='elite'?180:120);
  if(node.kind==='tale'&&node.tale)run.talesDone=[...new Set([...(run.talesDone??[]),node.tale])];
  if(node.kind==='boss'&&run.floor>=RUN_FLOORS){run.status='won';return;}
  const r=rngFor(run,run.floor*53+11);
  if(node.kind==='elite'||node.kind==='boss'||node.kind==='tale'){run.offer=relicOffer(run,r);if(!run.offer.length)run.offer=[{kind:'xp',amount:80}];}
  else run.offer=[{kind:'recruit',unitClass:RECRUITS[r.int(0,RECRUITS.length-1)]!,level:recruitLevel(run)},{kind:'heal',amount:.4},relicOffer(run,r)[0]??{kind:'xp',amount:80}];
  run.status='reward';
}

/** 천명의 가호: 한 번 패배를 견딘다. 사마의는 체력 30%로 살아남고 다음 층으로 물러난다(보상 없음). */
function spendSecondChance(run:Run){
  if(!run.secondChance)return false;
  run.secondChance=false;const hero=run.party.find(u=>u.hero);if(hero)hero.hp=.3;
  run.news.push(`천명의 가호 — ${run.floor}층에서 패했지만 사마의가 살아남아 물러났다. (가호는 원정마다 한 번)`);
  advance(run);return true;
}

/** 연의 전장의 결과. heroHp: 살아남은 사마의의 체력 비율. 본대만 싸우고 부대는 진영을 지킨다. */
export function finishStory(run:Run,stage:string,victory:boolean,heroHp:number,title=stage){
  run.news=[];delete run.active;delete run.activeStage;
  if(!victory){if(spendSecondChance(run))return;run.news.push(`연의 전장 「${title}」에서 패했다. 원정은 여기서 끝난다.`);run.status='lost';return;}
  const hero=run.party.find(u=>u.hero);if(hero)hero.hp=Math.max(.05,Math.min(1,heroHp));
  run.chronicle=[...new Set([...(run.chronicle??[]),stage])];run.storyDone=[...new Set([...(run.storyDone??[]),stage])];
  run.news.push(`연의 전장 「${title}」을 이겨 천명 기록에 남겼다.`);
  if(run.relics.includes('herbs'))for(const u of run.party)u.hp=Math.min(1,u.hp+.2);
  grantXp(run,150);
  const r=rngFor(run,run.floor*71+3);run.offer=relicOffer(run,r);if(!run.offer.length)run.offer=[{kind:'xp',amount:100}];
  run.status='reward';
}

/** 원정이 끝났을 때 얻는 천명: 오른 층 + 우두머리 3 + 연의·가상 전장 2 + 완주 10. */
export function mandateEarned(run:Run){
  const floors=run.status==='won'?RUN_FLOORS:Math.max(0,run.floor-1);
  return floors+3*(run.bosses??0)+2*(run.storyDone?.length??0)+2*(run.talesDone?.length??0)+(run.status==='won'?10:0);
}

export function takeReward(run:Run,i:number){
  const o=run.offer?.[i];if(!o)return;run.news=[];
  if(o.kind==='recruit'){if(!recruit(run,o.unitClass,o.level))grantXp(run,60);else run.news.push(`${ga(run.party.at(-1)!.name)} 부대에 들어왔다.`);}
  if(o.kind==='heal')for(const u of run.party)u.hp=Math.min(1,u.hp+o.amount);
  if(o.kind==='relic'){run.relics.push(o.relic);run.news.push(`보물 「${RELICS.find(x=>x.id===o.relic)!.name}」을 얻었다.`);}
  if(o.kind==='xp')grantXp(run,o.amount);
  delete run.offer;advance(run);
}
export function skipReward(run:Run){delete run.offer;advance(run);}
function advance(run:Run){run.floor++;run.status='map';}

export function describeReward(o:RewardOption){
  switch(o.kind){
    case 'recruit':{const c=evolvedClass(o.unitClass,o.level);return {title:`영입 · ${unitName(c)}`,detail:`Lv.${o.level} · ${nextEvolutionText(c)}`};}
    case 'heal':return {title:'휴식',detail:`모든 부대 체력 ${Math.round(o.amount*100)}% 회복`};
    case 'relic':{const r=RELICS.find(x=>x.id===o.relic)!;return {title:`보물 · ${r.name}`,detail:r.effect};}
    case 'xp':return {title:'전훈',detail:`모든 부대 경험치 ${o.amount}`};
  }
}
export function nextEvolutionText(cls:UnitClass){const n=nextEvolution(cls);return n?`Lv.${n.level}에 ${ro(unitName(n.to))} 진화${VARIANTS[n.to]?.bloom?` · 「${VARIANTS[n.to]!.bloom!.name}」 개화`:''}`:'최종 단계';}

// ─────────────────────────────────────────────── 전장 생성

const W=16,H=12;
/** 원정 전장: 지역마다 다른 지형, 좌측 출진 칸과 우측 적진. 모든 칸에 보병이 닿도록 보장한다. */
export function runMap(run:{seed:number;route?:Run['route']},floor:number,kind:NodeKind):MapFile{
  const r=rngFor(run,floor*977+kind.length),region=regionFor(run,floor).terrain;
  const g=Array.from({length:H},()=>Array<string>(W).fill('.'));
  const blob=(ch:string,n:number,size:number,x0=3,x1=W-4)=>{for(let k=0;k<n;k++){const cx=r.int(x0,x1),cy=r.int(1,H-2);for(let i=0;i<size;i++){const x=cx+r.int(-1,1),y=cy+r.int(-1,1);if(x>=2&&x<W-2&&y>=0&&y<H)g[y]![x]=ch;}}};
  blob('f',region===0?4:3,5);blob('h',region===1?4:2,4);
  if(region===1)blob('^',3,4,4,W-5);
  if(region===2){const rx=r.int(6,9);for(let y=0;y<H;y++){g[y]![rx]='~';g[y]![rx+1]='~';}for(const fy of [r.int(1,4),r.int(7,10)]){g[fy]![rx]='_';g[fy]![rx+1]='_';}blob('m',2,3);}
  const road=r.int(3,H-4);for(let x=0;x<W;x++)if(g[road]![x]==='.'||g[road]![x]==='f'||g[road]![x]==='h')g[road]![x]=',';
  // Keep both camps clear.
  for(let y=0;y<H;y++)for(const x of [0,1,W-2,W-1])if(!'~_'.includes(g[y]![x]!))g[y]![x]=y===road?',':'.';
  const cells=(xs:number[],ys:number[])=>ys.flatMap(y=>xs.map(x=>({x,y})));
  const mid=Math.floor(H/2);
  return {id:`run-${floor}-${kind}`,name:regionFor(run,floor).name,legend:{'.':'plain',',':'road',f:'forest',h:'hill','^':'mountain','~':'water','_':'ford',m:'marsh'},
    rows:g.map(row=>row.join('')),regions:{player_start:cells([0,1],[mid-2,mid-1,mid,mid+1]),enemy_camp:cells([W-2,W-1],[1,2,3,4,5,6,7,8,9,10]),objective:cells([W-1],[mid])}};
}

/** 원정 전투의 스테이지. 적은 층·지역·종류로 정해지고, 레벨이 높으면 그들도 진화해 있다. */
export function runStage(run:Run,kind:NodeKind,map:MapFile,taleId?:string):StageDef{
  const f=run.floor,r=rngFor(run,f*613+kind.length),region=regionFor(run,f),tale=kind==='tale'?taleById(taleId):undefined;
  const base=2+Math.round(f*1.05)+(f>FLOORS_PER_ACT*2?1:0)+(kind==='battle'||kind==='tale'?0:1);
  const count=Math.min(8,3+Math.floor(f/4.5)+(kind==='elite'?1:kind==='boss'||kind==='tale'?-1:0));
  const camp=(map.regions!.enemy_camp as Array<{x:number;y:number}>).slice();
  const enemies:UnitSpawnSpec[]=[];
  for(let i=0;i<count&&camp.length;i++){
    const at=camp.splice(r.int(0,camp.length-1),1)[0]!,cls=region.pool[r.int(0,region.pool.length-1)]!,level=base+r.int(-1,1);
    const elite=kind==='elite'&&i<2;const evolved=evolvedClass(cls,elite?level+8:level);
    enemies.push({id:`foe_${i}`,name:unitName(evolved),template:evolved,level,at,behavior:i%3===2?'hold':'advance'});
  }
  if(kind==='boss'){const b=region.boss,mid=Math.floor(H/2),bi=camp.reduce((best,c,i)=>Math.abs(c.y-mid)*2+(W-1-c.x)<Math.abs(camp[best]!.y-mid)*2+(W-1-camp[best]!.x)?i:best,0),at=camp.splice(bi,1)[0]??{x:W-1,y:mid};enemies.push({id:'boss',name:b.name,template:evolvedClass(b.unitClass,base+3),level:base-2,at,behavior:'hold'});}
  if(tale){const mid=Math.floor(H/2),bi=camp.reduce((best,c,i)=>Math.abs(c.y-mid)*2+(W-1-c.x)<Math.abs(camp[best]!.y-mid)*2+(W-1-camp[best]!.x)?i:best,0),at=camp.splice(bi,1)[0]??{x:W-1,y:mid};// 연의의 맹장은 능력치로 이미 강하다: 무력 75를 넘는 8마다 레벨을 하나 낮춰 균형을 맞춘다.
    const war=romanceOf({id:'target',name:tale.target.name})?.war??70,level=Math.max(1,base-1-Math.max(0,Math.round((war-75)/8)));
    enemies.push({id:'target',name:tale.target.name,template:evolvedClass(tale.target.unitClass,level),level,at,behavior:'hold'});}
  const party:UnitSpawnSpec[]=run.party.filter(u=>!u.hero).map(u=>({id:u.id,name:u.name,template:u.unitClass,level:u.level,region:'party_start',behavior:'advance'}));
  return {id:`R-${String(f).padStart(2,'0')}`,arc:'lower',order:100+f,title:tale?`가상 전장 · ${tale.title}`:`${region.name} · ${f}층`,subtitle:kind==='boss'?`우두머리 ${region.boss.name}`:tale?`적장 ${tale.target.name}`:kind==='elite'?'정예 전투':'원정 전투',
    synopsis:kind==='boss'?`${eul(region.boss.name)} 격퇴하면 승리. 쓰러진 부대는 원정에서 사라진다.`:tale?`${eul(tale.target.name)} 물리치면 승리. ${tale.intro}`:'적을 모두 물리치면 승리. 쓰러진 부대는 원정에서 사라진다.',
    mapId:map.id,deployment:{forced:['sima_yi'],slots:0,grantedUnits:[]},
    victory:kind==='boss'?[{type:'retreat',unit:'boss'}]:tale?[{type:'retreat',unit:'target'}]:[{type:'annihilate',side:'enemy'}],
    defeat:[{type:'retreat',unit:'sima_yi'}],
    seals:[{slot:1,normal:'clear',extreme:'clear'},{slot:2,normal:'clear',extreme:'clear'},{slot:3,normal:'clear',extreme:'clear'}],
    difficulty:{normal:{minEnemyLevel:base,recommendedLevel:base},extreme:{minEnemyLevel:base+2,recommendedLevel:base+2}},
    gimmicks:[],perf:{maxSimultaneousUnits:20,tier:'A'},
    events:[{id:'run/start',trigger:{type:'battle_start'},actions:[
      ...(party.length?[{type:'spawn_units' as const,side:'player' as const,units:party}]:[]),
      {type:'spawn_units',side:'enemy',units:enemies}]}]} as StageDef;
}

/** 원정 전투에서 아군 부대가 서는 칸: 사마의 자리를 뺀 출진 칸과 그 옆 열. */
export function partyStart(map:MapFile){return [...(map.regions!.player_start as Array<{x:number;y:number}>).slice(1),...[0,1,2,3].map(d=>({x:2,y:Math.floor(H/2)-2+d}))];}

export function runBattle(run:Run,kind:NodeKind,taleId?:string){
  const map=runMap(run,run.floor,kind);
  (map.regions as Record<string,Array<{x:number;y:number}>>).party_start=partyStart(map);
  return {map,stage:runStage(run,kind,map,taleId)};
}

/** 병종이 책략을 쓰는지 (원정 부대의 책략 목록을 정할 때). */
export const casts=(cls:UnitClass)=>profileOf(cls).canUseStrategy;

/** 세션이 저장하는 원정 전투의 원본: 이것만 있으면 같은 전장을 다시 만든다(저장·무르기 재생). */
export interface RunBattleRef {seed:number;floor:number;kind:NodeKind;party:RunUnit[];relics:string[];route?:Run['route'];tale?:string}
export const battleRef=(run:Run,kind:NodeKind,tale?:string):RunBattleRef=>({seed:run.seed,floor:run.floor,kind,party:structuredClone(run.party),relics:[...run.relics],...(run.route?{route:{...run.route}}:{}),...(tale?{tale}:{})});
export function refBattle(ref:RunBattleRef){
  const run:Run={version:1,seed:ref.seed,floor:ref.floor,party:ref.party,relics:ref.relics,fallen:[],status:'map',nextId:0,news:[],...(ref.route?{route:ref.route}:{})};
  return runBattle(run,ref.kind,ref.tale);
}

/** 전투 시작 직후: 원정 부대의 체력·병종·책략, 보물 효과를 전장에 반영한다. */
export function prepareRunBattle(state:BattleState,ref:RunBattleRef){
  for(const ru of ref.party){
    const u=state.find(ru.id);if(!u)continue;
    if(u.unitClass!==ru.unitClass)evolveUnit(u,ru.unitClass);
    if(ru.hero){(u as {name:string}).name='사마의';}
    u.hp=Math.max(1,Math.round(u.stats.maxHp*ru.hp));
    if(casts(u.unitClass))u.strategies=troopStrategies(u.unitClass,u.level)??availableStrategies(u.level,true);
    u.canUseItems=true;
  }
  // 진화 책사·적 술사가 쓰는 책략을 전장 책략표에 올린다.
  for(const u of state.living())for(const id of u.strategies){const d=allStrategies.find(x=>x.id===id);if(d&&!state.strategies.has(id))state.strategies.set(id,d);}
  applyRelics(state,ref.relics);
}

/** 보물 효과를 아군 전원에 입힌다(원정 전투·연의 전장 공통). */
export function applyRelics(state:BattleState,relics:string[]){
  const has=(id:string)=>relics.includes(id);
  for(const u of [...state.living('player')]){
    const fam=familyOf(u.unitClass);
    if(has('whetstone'))u.stats.attack+=3;
    if(has('lamellar'))u.stats.defense+=3;
    if(has('warhorse')&&['cavalry','heavyCav','horseArcher'].includes(fam))u.stats.movement+=1;
    if(has('drum')&&['infantry','spearman','bandit'].includes(fam))u.stats.movement+=1;
    if(has('quiver')&&['archer','crossbow','horseArcher'].includes(fam))u.stats.attack+=5;
    if(has('sunzi')){u.stats.maxMp+=12;u.mp+=12;u.stats.intellect+=3;}
    if(has('banner'))state.applyStatus(u,{kind:'rally',turns:2,magnitude:1});
  }
}

/** 연의 전장의 원본: 세션이 저장하고 불러올 때 쓴다. */
export interface RunStoryRef {seed:number;floor:number;stage:string;heroLevel:number;heroHp:number;relics:string[]}

/** 전투가 끝난 뒤 원정에 넘길 생존자 체력 비율. */
export function survivorsOf(state:BattleState,ref:RunBattleRef){
  const out:Record<string,number>={};
  for(const ru of ref.party){const u=state.find(ru.id);if(u?.alive)out[ru.id]=Math.max(.05,u.hp/u.stats.maxHp);}
  return out;
}
