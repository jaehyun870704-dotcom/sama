/**
 * 천명의 원정 — 로그라이크 모드의 순수 규칙.
 *
 * 한 번의 원정은 12층(하북 · 한중 · 강동, 4층마다 우두머리). 층마다 갈림길 세 곳 중 하나를 고른다.
 * 전장은 원정 씨앗과 층으로 결정론적으로 생성되고, 쓰러진 부대는 원정에서 영원히 빠진다.
 * 경험치로 레벨이 오르면 병종이 진화한다(classes.ts의 계통).
 * 화면과 저장은 main.ts가 맡는다. 이 모듈은 상태를 바꾸는 순수 함수만 둔다.
 */
import {Rng,evolvedClass,nextEvolution,profileOf,evolveUnit,familyOf,type UnitClass,type StageDef,type MapFile,type UnitSpawnSpec,type BattleState} from '../../core/src/index.ts';
import {classNames,troopStrategies} from './troops.ts';
import {availableStrategies,allStrategies} from './officers.ts';

export const RUN_FLOORS=12;
export const PARTY_LIMIT=6;
export const XP_PER_LEVEL=100;

export interface RunUnit {id:string;name:string;unitClass:UnitClass;level:number;xp:number;/** 체력 비율 0~1 */hp:number;hero?:true}
export type NodeKind='battle'|'elite'|'boss'|'recruit'|'rest'|'treasure'|'training';
export interface RunNode {kind:NodeKind;label:string;detail:string}
export interface Relic {id:string;name:string;effect:string}
export interface Run {
  version:1;seed:number;floor:number;party:RunUnit[];relics:string[];fallen:string[];
  status:'map'|'reward'|'won'|'lost';nextId:number;
  /** 보상 화면에서 고를 수 있는 것 */
  offer?:RewardOption[];
  /** 마지막으로 일어난 일 (진화·레벨업 등), 화면에 한 번 보여 준다 */
  news:string[];
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

export const REGIONS=[
  {name:'하북 평원',boss:{name:'안량',unitClass:'cavalry' as UnitClass},pool:['infantry','spearman','cavalry','archer','crossbow','slinger'] as UnitClass[]},
  {name:'한중 산악',boss:{name:'마초',unitClass:'cavalry' as UnitClass},pool:['infantry','spearman','bandit','assassin','archer','horseArcher','strategist','heavyCav'] as UnitClass[]},
  {name:'강동 수향',boss:{name:'육손',unitClass:'strategist' as UnitClass},pool:['infantry','spearman','rattan','crossbow','taoist','shaman','elephant','cavalry'] as UnitClass[]},
];
export const regionOf=(floor:number)=>REGIONS[Math.min(2,Math.floor((floor-1)/4))]!;
export const isBossFloor=(floor:number)=>floor%4===0;

/** 영입 가능한 기본 병종 */
export const RECRUITS:UnitClass[]=['infantry','spearman','cavalry','archer','crossbow','fengshui','horseArcher','slinger','assassin','rattan','elephant','monk','taoist','physician','bandit','heavyCav'];

const rngFor=(run:{seed:number},salt:number)=>new Rng((run.seed*7919+salt*104729)>>>0||1);

function unitName(cls:UnitClass){return classNames[cls]??cls;}

export function newRun(seed:number,start:UnitClass[]):Run{
  const run:Run={version:1,seed,floor:1,party:[],relics:[],fallen:[],status:'map',nextId:1,news:[]};
  run.party.push({id:'sima_yi',name:'사마의',unitClass:'strategist',level:4,xp:0,hp:1,hero:true});
  for(const cls of start)recruit(run,cls,4);
  return run;
}

/** 출발 부대 후보 세 묶음(병종 3개씩). */
export function startingOffers(seed:number):UnitClass[][]{
  const r=new Rng(seed>>>0||1),pick=()=>RECRUITS[r.int(0,RECRUITS.length-1)]!;
  return [['infantry','archer','cavalry'],[pick(),pick(),pick()],[pick(),pick(),pick()]];
}

export function recruit(run:Run,cls:UnitClass,level:number){
  if(run.party.length>=PARTY_LIMIT)return false;
  const evolved=evolvedClass(cls,level);
  run.party.push({id:'r'+run.nextId++,name:unitName(evolved),unitClass:evolved,level,xp:0,hp:1});
  return true;
}

/** 이 층의 갈림길 세 곳. 같은 원정·같은 층이면 언제나 같다. */
export function floorChoices(run:Run):RunNode[]{
  const f=run.floor;
  if(isBossFloor(f)){const b=regionOf(f).boss;return [{kind:'boss',label:`우두머리 · ${b.name}`,detail:`${regionOf(f).name}의 주인. 격퇴하면 체력이 모두 회복된다.`}];}
  const r=rngFor(run,f),kinds:NodeKind[]=['battle'];
  const extra:NodeKind[]=f>=2?['battle','elite','recruit','rest','treasure','training']:['battle','recruit','training'];
  while(kinds.length<3){const k=extra[r.int(0,extra.length-1)]!;if(k!=='battle'&&kinds.includes(k))continue;kinds.push(k);}
  return kinds.map(kind=>describeNode(kind));
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
  }
}

const avgLevel=(run:Run)=>Math.round(run.party.reduce((n,u)=>n+u.level,0)/Math.max(1,run.party.length));

/** 비전투 갈림길을 고르면 곧장 결과가 정해진다(모병·보물은 보상 화면으로). */
export function visitNode(run:Run,node:RunNode){
  run.news=[];
  if(node.kind==='rest'){for(const u of run.party)u.hp=Math.min(1,u.hp+.6);run.news.push('의원에서 모든 부대의 체력을 회복했다.');advance(run);return;}
  if(node.kind==='training'){grantXp(run,100);advance(run);return;}
  const r=rngFor(run,run.floor*31+7);
  if(node.kind==='recruit'){run.offer=pickDistinct(r,RECRUITS,3).map(unitClass=>({kind:'recruit' as const,unitClass,level:Math.max(1,avgLevel(run)-1)}));run.status='reward';return;}
  if(node.kind==='treasure'){run.offer=relicOffer(run,r);run.status='reward';}
}

function pickDistinct<T>(r:Rng,from:T[],n:number){const pool=[...from],out:T[]=[];while(out.length<n&&pool.length)out.push(pool.splice(r.int(0,pool.length-1),1)[0]!);return out;}
function relicOffer(run:Run,r:Rng):RewardOption[]{const left=RELICS.filter(x=>!run.relics.includes(x.id)).map(x=>x.id);return pickDistinct(r,left,3).map(relic=>({kind:'relic' as const,relic}));}

/** 경험치를 나눠 주고 레벨업·진화를 소식으로 남긴다. */
export function grantXp(run:Run,amount:number,who=run.party){
  for(const u of who){
    u.xp+=amount;
    while(u.xp>=XP_PER_LEVEL){u.xp-=XP_PER_LEVEL;u.level++;
      const to=evolvedClass(u.unitClass,u.level);
      if(to!==u.unitClass){const from=u.unitClass;u.unitClass=to;if(!u.hero)u.name=unitName(to);run.news.push(`${u.hero?'사마의':unitName(from)}가 ${unitName(to)}(으)로 진화했다! (Lv.${u.level})`);}
      else run.news.push(`${u.hero?'사마의':u.name} Lv.${u.level}`);
    }
  }
}

/** 전투 결과를 원정에 반영한다. survivors: 살아남은 부대의 체력 비율. */
export function finishBattle(run:Run,node:RunNode,victory:boolean,survivors:Record<string,number>){
  run.news=[];
  const lost=run.party.filter(u=>survivors[u.id]===undefined);
  for(const u of lost)run.fallen.push(`${u.hero?'사마의':u.name} Lv.${u.level} · ${run.floor}층`);
  if(!victory||!survivors.sima_yi){run.status='lost';run.party=run.party.filter(u=>survivors[u.id]!==undefined);return;}
  run.party=run.party.filter(u=>survivors[u.id]!==undefined);
  for(const u of run.party)u.hp=Math.max(.05,survivors[u.id]!);
  if(lost.length)run.news.push(`잃은 부대: ${lost.map(u=>u.name).join(', ')}`);
  if(run.relics.includes('herbs'))for(const u of run.party)u.hp=Math.min(1,u.hp+.2);
  if(node.kind==='boss')for(const u of run.party)u.hp=1;
  grantXp(run,node.kind==='boss'?200:node.kind==='elite'?180:120);
  if(node.kind==='boss'&&run.floor>=RUN_FLOORS){run.status='won';return;}
  const r=rngFor(run,run.floor*53+11);
  if(node.kind==='elite'||node.kind==='boss'){run.offer=relicOffer(run,r);if(!run.offer.length)run.offer=[{kind:'xp',amount:80}];}
  else run.offer=[{kind:'recruit',unitClass:RECRUITS[r.int(0,RECRUITS.length-1)]!,level:Math.max(1,avgLevel(run)-1)},{kind:'heal',amount:.4},relicOffer(run,r)[0]??{kind:'xp',amount:80}];
  run.status='reward';
}

export function takeReward(run:Run,i:number){
  const o=run.offer?.[i];if(!o)return;run.news=[];
  if(o.kind==='recruit'){if(!recruit(run,o.unitClass,o.level))grantXp(run,60);else run.news.push(`${unitName(evolvedClass(o.unitClass,o.level))}이(가) 부대에 들어왔다.`);}
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
export function nextEvolutionText(cls:UnitClass){const n=nextEvolution(cls);return n?`Lv.${n.level}에 ${unitName(n.to)}(으)로 진화`:'최종 단계';}

// ─────────────────────────────────────────────── 전장 생성

const W=16,H=12;
/** 원정 전장: 지역마다 다른 지형, 좌측 출진 칸과 우측 적진. 모든 칸에 보병이 닿도록 보장한다. */
export function runMap(run:{seed:number},floor:number,kind:NodeKind):MapFile{
  const r=rngFor(run,floor*977+kind.length),region=Math.min(2,Math.floor((floor-1)/4));
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
  return {id:`run-${floor}-${kind}`,name:REGIONS[region]!.name,legend:{'.':'plain',',':'road',f:'forest',h:'hill','^':'mountain','~':'water','_':'ford',m:'marsh'},
    rows:g.map(row=>row.join('')),regions:{player_start:cells([0,1],[mid-2,mid-1,mid,mid+1]),enemy_camp:cells([W-2,W-1],[1,2,3,4,5,6,7,8,9,10]),objective:cells([W-1],[mid])}};
}

/** 원정 전투의 스테이지. 적은 층·지역·종류로 정해지고, 레벨이 높으면 그들도 진화해 있다. */
export function runStage(run:Run,kind:NodeKind,map:MapFile):StageDef{
  const f=run.floor,r=rngFor(run,f*613+kind.length),region=regionOf(f);
  const base=2+Math.round(f*1.1)+(f>=9?2:0)+(kind==='battle'?0:1);
  const count=Math.min(8,3+Math.floor(f/3)+(kind==='elite'?1:kind==='boss'?-1:0));
  const camp=(map.regions!.enemy_camp as Array<{x:number;y:number}>).slice();
  const enemies:UnitSpawnSpec[]=[];
  for(let i=0;i<count&&camp.length;i++){
    const at=camp.splice(r.int(0,camp.length-1),1)[0]!,cls=region.pool[r.int(0,region.pool.length-1)]!,level=base+r.int(-1,1);
    const elite=kind==='elite'&&i<2;const evolved=evolvedClass(cls,elite?level+8:level);
    enemies.push({id:`foe_${i}`,name:unitName(evolved),template:evolved,level,at,behavior:i%3===2?'hold':'advance'});
  }
  if(kind==='boss'){const b=region.boss,at=camp.splice(0,1)[0]??{x:W-1,y:Math.floor(H/2)};enemies.push({id:'boss',name:b.name,template:evolvedClass(b.unitClass,base+3),level:base,at,behavior:'hold'});}
  const party:UnitSpawnSpec[]=run.party.filter(u=>!u.hero).map(u=>({id:u.id,name:u.name,template:u.unitClass,level:u.level,region:'party_start',behavior:'advance'}));
  return {id:`R-${String(f).padStart(2,'0')}`,arc:'lower',order:100+f,title:`${region.name} · ${f}층`,subtitle:kind==='boss'?`우두머리 ${region.boss.name}`:kind==='elite'?'정예 전투':'원정 전투',
    synopsis:kind==='boss'?`${region.boss.name}을(를) 격퇴하면 승리. 쓰러진 부대는 원정에서 사라진다.`:'적을 모두 물리치면 승리. 쓰러진 부대는 원정에서 사라진다.',
    mapId:map.id,deployment:{forced:['sima_yi'],slots:0,grantedUnits:[]},
    victory:kind==='boss'?[{type:'retreat',unit:'boss'}]:[{type:'annihilate',side:'enemy'}],
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

export function runBattle(run:Run,kind:NodeKind){
  const map=runMap(run,run.floor,kind);
  (map.regions as Record<string,Array<{x:number;y:number}>>).party_start=partyStart(map);
  return {map,stage:runStage(run,kind,map)};
}

/** 병종이 책략을 쓰는지 (원정 부대의 책략 목록을 정할 때). */
export const casts=(cls:UnitClass)=>profileOf(cls).canUseStrategy;

/** 세션이 저장하는 원정 전투의 원본: 이것만 있으면 같은 전장을 다시 만든다(저장·무르기 재생). */
export interface RunBattleRef {seed:number;floor:number;kind:NodeKind;party:RunUnit[];relics:string[]}
export const battleRef=(run:Run,kind:NodeKind):RunBattleRef=>({seed:run.seed,floor:run.floor,kind,party:structuredClone(run.party),relics:[...run.relics]});
export function refBattle(ref:RunBattleRef){
  const run:Run={version:1,seed:ref.seed,floor:ref.floor,party:ref.party,relics:ref.relics,fallen:[],status:'map',nextId:0,news:[]};
  return runBattle(run,ref.kind);
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
  const mine=[...state.living('player')];
  const has=(id:string)=>ref.relics.includes(id);
  for(const u of mine){
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

/** 전투가 끝난 뒤 원정에 넘길 생존자 체력 비율. */
export function survivorsOf(state:BattleState,ref:RunBattleRef){
  const out:Record<string,number>={};
  for(const ru of ref.party){const u=state.find(ru.id);if(u?.alive)out[ru.id]=Math.max(.05,u.hp/u.stats.maxHp);}
  return out;
}
