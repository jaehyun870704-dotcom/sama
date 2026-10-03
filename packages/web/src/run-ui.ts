/** 천명의 원정 화면: 본영(첫 화면) · 출발 · 층 갈림길 · 보상 · 원정 종료 · 천명 해금. 규칙은 roguelike.ts, 영구 진행은 meta.ts. */
import {newRun,startingOffers,floorChoices,visitNode,finishBattle,finishStory,takeReward,skipReward,describeReward,nextEvolutionText,battleRef,survivorsOf,
  regionOf,actOf,isBossFloor,mandateEarned,RELICS,REGIONS,STORY_ORDER,RUN_FLOORS,PARTY_LIMIT,XP_PER_LEVEL,type Run,type RunNode,type RunUnit} from './roguelike.ts';
import {loadMeta,saveMeta,buyUnlock,recordStory,settleRun,UNLOCKS,type MetaState} from './meta.ts';
import {classNames} from './troops.ts';
import {chapters,campaignOrder} from './session.ts';
import {freshCampaign,award,deployment as campaignDeployment} from './progression.ts';
import {tierOf,type UnitClass,type BattleState} from '../../core/src/index.ts';
import type {Deployment} from './progression.ts';

export interface RunHost {
  modal(html:string,closable?:boolean):void;
  /** 본영(첫 화면)으로 */
  showMenu():void;
  toast(text:string):void;
  startBattle(deployment:Deployment,seed:number):void;
  /** 연의 전장 출진: 스토리 장의 실제 전장을 원정 상태로 연다 */
  startStory(chapter:number,deployment:Deployment,seed:number):void;
  /** 지금 열려 있는 원정 전투(끝나지 않은 것) */
  liveRunBattle():{seed:number;floor:number;kind:string}|undefined;
  backToBattle():void;
  /** 연의 회상(이긴 연의 전장 다시 치르기) */
  showChronicle():void;
  showTroops():void;
  showOfficers():void;
  showSlots():void;
  /** 자동 저장된 전투가 있으면 이어 하기 */
  resumeSaved?:(()=>void)|undefined;
}

const KEY='sama-run-v1';
export const RUN_CHAPTER=11;

export function loadRun():Run|null{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const r=JSON.parse(raw) as Run;return r?.version===1&&Array.isArray(r.party)?r:null;}catch{return null;}}
function saveRun(run:Run){try{localStorage.setItem(KEY,JSON.stringify(run));}catch{/* storage optional */}}
function clearRun(){try{localStorage.removeItem(KEY);}catch{/* storage optional */}}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const name=(c:UnitClass)=>classNames[c]??c;
const pips=(c:UnitClass)=>'◆'.repeat(tierOf(c))+'◇'.repeat(3-tierOf(c));
const stageTitle=(id:string)=>{const c=chapters.find(x=>x.stage.id===id);return c?`${c.stage.subtitle??c.stage.title}`:id;};
const ongoing=(run:Run|null):run is Run=>!!run&&(run.status==='map'||run.status==='reward');

function unitCard(u:RunUnit){
  return `<div class="run-unit${u.hero?' hero':''}"><div class="run-unit-head"><strong>${esc(u.hero?'사마의':u.name)}</strong><span class="run-tier" title="병종 단계">${pips(u.unitClass)}</span></div>
  <small>${esc(name(u.unitClass))} · Lv.${u.level}</small>
  <div class="run-bar hp" title="체력"><i style="width:${Math.round(u.hp*100)}%"></i></div>
  <div class="run-bar xp" title="경험치"><i style="width:${Math.round(u.xp/XP_PER_LEVEL*100)}%"></i></div>
  <small class="run-next">${esc(nextEvolutionText(u.unitClass))}</small></div>`;
}
function partyPanel(run:Run){
  const relics=run.relics.map(id=>RELICS.find(r=>r.id===id)!).map(r=>`<span class="run-relic" title="${esc(r.effect)}">${esc(r.name)}</span>`).join('');
  return `<div class="run-party">${run.party.map(unitCard).join('')}</div><p class="run-relics">${relics||'<span class="muted">보물 없음</span>'}${run.secondChance?'<span class="run-relic grace" title="원정마다 한 번, 패배해도 원정이 끝나지 않는다">천명의 가호</span>':''}</p>`;
}
const news=(run:Run)=>run.news.length?`<div class="run-news">${run.news.map(n=>`<p${n.startsWith('진화!')?' class="evo"':''}>${esc(n)}</p>`).join('')}</div>`:'';
const actTrack=(run:Run)=>`<div class="run-track" aria-label="원정 진행">${REGIONS.map((r,i)=>{const act=i+1,cur=actOf(run.floor);return `<span class="${act<cur?'done':act===cur?'now':''}">${r.arc} · ${r.name}</span>`;}).join('')}</div>`;

// ─────────────────────────────────────────────── 본영 (첫 화면)

/** 게임의 첫 화면. 원정이 중심이고, 연의 회상·도감은 곁가지다. */
export function showHub(host:RunHost){
  const meta=loadMeta(),run=loadRun(),told=meta.chronicle.length,total=STORY_ORDER[1].length+STORY_ORDER[2].length+STORY_ORDER[3].length;
  host.modal(`<div class="campaign run-hub"><div class="campaign-art"><img src="/sima-portrait-v2.png" alt="부채를 든 사마의 창작 초상"><div class="art-caption">司 馬 懿 <span>천명은 기다리는 자에게 온다</span></div></div>
  <div class="campaign-copy"><div class="eyebrow">三國志 · ROGUELIKE CHRONICLE</div><p class="chapter-pretitle">천명의 원정 · 3편 ${RUN_FLOORS}층</p><h2>사마의전</h2><p class="tagline">한 번의 원정, 한 번뿐인 목숨.</p>
  <div class="hub-stats"><span><b>${meta.mandate}</b><small>천명</small></span><span><b>${told}/${total}</b><small>연의 기록</small></span><span><b>${meta.best}층</b><small>최고 기록</small></span><span><b>${meta.runs}</b><small>원정 · 완주 ${meta.wins}</small></span></div>
  <p class="intro">상편(관중)·중편(기산)·하편(요동) 열여덟 층을 지나 마초·제갈량·공손연을 꺾는다. 층마다 갈림길을 고르고, 쓰러진 부대는 돌아오지 않는다. 연의 전장을 이기면 영구 기록에 남아 다음 원정은 그다음 이야기로 이어진다. 원정이 끝나면 천명을 얻어 영구 해금에 쓴다.</p>
  <div class="hub-actions">${ongoing(run)?`<button id="hub-continue" class="primary">원정 이어하기 · ${run.floor}층 ${esc(regionOf(run.floor).arc)}</button>`:''}<button id="hub-new" class="${ongoing(run)?'':'primary'}">${ongoing(run)?'새 원정 (지금 원정은 포기)':'새 원정 시작'}</button>
  <button id="hub-shop">천명 해금 <small>${meta.unlocks.length}/${UNLOCKS.length}</small></button><button id="hub-chronicle">연의 기록 · 회상</button>${host.resumeSaved?'<button id="hub-resume">전투 이어하기</button>':''}<button id="hub-slots">저장 칸</button><button id="hub-troops">병종 도감</button><button id="hub-officers">장수 · 연의 장수록</button></div>
  <p class="prototype-note">기록은 이 브라우저에 저장됩니다.</p></div></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('hub-continue',()=>showRun(host,run!));
  on('hub-new',()=>{if(ongoing(run)){const b=document.getElementById('hub-new')!;if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='정말 포기하고 새로 시작';b.classList.add('danger');return;}run.status='lost';run.news=['원정을 포기했다.'];saveRun(run);return showEnd(host,run);}showStart(host);});
  on('hub-shop',()=>showShop(host));on('hub-chronicle',()=>showChronicleSummary(host));
  on('hub-resume',()=>host.resumeSaved?.());on('hub-slots',host.showSlots);on('hub-troops',host.showTroops);on('hub-officers',host.showOfficers);
}

function showShop(host:RunHost,note=''){
  const meta=loadMeta();
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명 해금 · 영구 진행</div><h2>천명 ${meta.mandate}</h2>
  <p>원정이 끝날 때마다 천명을 얻는다: 오른 층 1 · 꺾은 우두머리 3 · 이긴 연의 전장 2 · 완주 10. 해금은 다음 원정부터 계속 적용된다.</p>${note?`<div class="run-news"><p>${esc(note)}</p></div>`:''}
  <div class="run-choices">${UNLOCKS.map(u=>{const own=meta.unlocks.includes(u.id);return `<button data-unlock="${u.id}" ${own||meta.mandate<u.cost?'disabled':''} class="${own?'owned':''}"><strong>${esc(u.name)} <small>${own?'해금됨':`천명 ${u.cost}`}</small></strong><small>${esc(u.effect)}</small></button>`;}).join('')}</div>
  <div class="run-actions"><button id="shop-back">← 본영</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-unlock]').forEach(b=>b.onclick=()=>{const m=loadMeta();if(buyUnlock(m,b.dataset.unlock!)){saveMeta(m);showShop(host,`「${UNLOCKS.find(u=>u.id===b.dataset.unlock)!.name}」을(를) 해금했다.`);}});
  document.getElementById('shop-back')!.onclick=host.showMenu;
}

function showChronicleSummary(host:RunHost){
  const meta=loadMeta(),known=new Set(meta.chronicle);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">연의 기록</div><h2>원정에서 이긴 연의 전장</h2>
  <p>연의 전장은 원정의 갈림길로 나온다. 한 번 이기면 여기 남고, 다음 원정은 그다음 이야기를 보여 준다. 이긴 전장은 '연의 회상'에서 다시 치를 수 있다.</p>
  ${REGIONS.map((r,i)=>{const list=STORY_ORDER[(i+1) as 1|2|3];return `<h3>${r.arc} · ${list.filter(id=>known.has(id)).length}/${list.length}</h3><div class="chronicle-list">${list.map(id=>`<span class="${known.has(id)?'done':''}">${known.has(id)?'◆':'·'} ${esc(known.has(id)?stageTitle(id):'아직 모르는 이야기')}</span>`).join('')}</div>`;}).join('')}
  <div class="run-actions"><button id="chron-replay" class="primary" ${known.size?'':'disabled'}>연의 회상 (이긴 전장 다시 치르기)</button><button id="chron-back">← 본영</button></div></div>`,false);
  document.getElementById('chron-replay')!.onclick=host.showChronicle;
  document.getElementById('chron-back')!.onclick=host.showMenu;
}

// ─────────────────────────────────────────────── 원정

/** 원정 열기: 진행 중이면 이어서, 없으면 출발 부대 선택. */
export function openRun(host:RunHost){
  const run=loadRun();
  if(ongoing(run))return showRun(host,run);
  showStart(host);
}

function showStart(host:RunHost){
  const meta=loadMeta(),seed=(Date.now()%2147483647)||7,offers=startingOffers(seed,meta.unlocks);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · 출발</div><h2>출발 부대를 고른다</h2>
  <p>사마의와 함께 떠날 부대를 고른다. 레벨이 오르면 병종이 진화하고, 쓰러진 부대는 영영 돌아오지 않는다. 사마의가 쓰러지면 원정이 끝난다.</p>
  <p class="muted">천명 ${meta.mandate} · 해금 ${meta.unlocks.length}/${UNLOCKS.length} · 부대는 최대 ${PARTY_LIMIT}개</p>
  <div class="run-choices">${offers.map((o,i)=>`<button data-start="${i}"><strong>${o.map(name).join(' · ')}</strong><small>${o.map(c=>nextEvolutionText(c)).join(' / ')}</small></button>`).join('')}</div>
  <button id="run-back">← 본영</button></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-start]').forEach(b=>b.onclick=()=>{
    const start=offers[Number(b.dataset.start)]!;
    if(meta.unlocks.includes('heirloom'))return pickHeirloom(host,seed,start,meta);
    begin(host,seed,start,meta);
  });
  document.getElementById('run-back')!.onclick=host.showMenu;
}
function pickHeirloom(host:RunHost,seed:number,start:UnitClass[],meta:MetaState){
  const options=RELICS.filter((_,i)=>(i+seed)%2===0).slice(0,3);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명 해금 · 가보</div><h2>들고 갈 가보를 고른다</h2>
  <div class="run-choices">${options.map(r=>`<button data-relic="${r.id}"><strong>${esc(r.name)}</strong><small>${esc(r.effect)}</small></button>`).join('')}</div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-relic]').forEach(b=>b.onclick=()=>begin(host,seed,start,meta,b.dataset.relic));
}
function begin(host:RunHost,seed:number,start:UnitClass[],meta:MetaState,relic?:string){
  const run=newRun(seed,start,{chronicle:meta.chronicle,unlocks:meta.unlocks,...(relic?{relic}:{})});
  saveRun(run);showRun(host,run);
}

export function showRun(host:RunHost,run:Run){
  if(run.status==='reward')return showReward(host,run);
  if(run.status==='won'||run.status==='lost')return showEnd(host,run);
  if(run.active)return showActive(host,run);
  const choices=floorChoices(run),region=regionOf(run.floor);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(region.arc)} · ${esc(region.name)}</div>${actTrack(run)}
  <h2>${isBossFloor(run.floor)?`${esc(region.arc)}의 끝 · 우두머리가 기다린다`:'갈림길'}</h2>${news(run)}${partyPanel(run)}
  <div class="run-choices">${choices.map((c,i)=>`<button data-node="${i}" class="${c.kind==='boss'?'primary':c.kind==='story'?'story':''}"><strong>${esc(c.label)}${c.stage?` · ${esc(stageTitle(c.stage))}`:''}</strong><small>${esc(c.detail)}</small></button>`).join('')}</div>
  <div class="run-actions"><button id="run-menu">← 본영 (원정은 저장됨)</button><button id="run-abandon">원정 포기</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(b=>b.onclick=()=>choose(host,run,choices[Number(b.dataset.node)]!));
  document.getElementById('run-menu')!.onclick=host.showMenu;
  const abandon=document.getElementById('run-abandon')!;
  abandon.onclick=()=>{
    // 한 번 더 눌러야 포기된다: 실수로 원정 전체를 잃지 않게.
    if(abandon.dataset.armed!=='1'){abandon.dataset.armed='1';abandon.textContent='정말 포기 (부대 전원 해산)';abandon.classList.add('danger');return;}
    run.status='lost';run.news=['원정을 포기했다.'];saveRun(run);showEnd(host,run);};
}

function launch(host:RunHost,run:Run,kind:'battle'|'elite'|'boss'){
  const hero=run.party.find(u=>u.hero)!;
  const deployment:Deployment={levels:{sima_yi:Math.min(40,hero.level),sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:battleRef(run,kind)};
  run.active=kind;saveRun(run);host.startBattle(deployment,(run.seed+run.floor*97)%2147483647);
}

/** 연의 전장의 장수 레벨: 연의를 그 장까지 따라온 사람의 레벨, 사마의는 원정 레벨이 더 높으면 그것. */
export function storyDeployment(run:Run,stage:string):{chapter:number;deployment:Deployment}{
  const chapter=chapters.findIndex(c=>c.stage.id===stage);
  const c=freshCampaign();
  for(const i of campaignOrder){const s=chapters[i]!.stage;if(s.id===stage)break;award(c,s.id,'normal',s.deployment.forced,[1]);}
  const d=campaignDeployment(c,true),hero=run.party.find(u=>u.hero)!;
  d.equipped={};delete d.loadouts;
  d.levels.sima_yi=Math.min(40,Math.max(d.levels.sima_yi??1,hero.level));
  d.runStory={seed:run.seed,floor:run.floor,stage,heroLevel:hero.level,heroHp:hero.hp,relics:[...run.relics]};
  return {chapter,deployment:d};
}
function launchStory(host:RunHost,run:Run,stage:string){
  const {chapter,deployment}=storyDeployment(run,stage);
  if(chapter<0){host.toast('이 연의 전장을 찾을 수 없습니다.');return;}
  run.active='story';run.activeStage=stage;saveRun(run);host.startStory(chapter,deployment,(run.seed+run.floor*131)%2147483647);
}

/** 전투 도중 메뉴로 나왔다면: 그 전장으로 돌아가거나, 같은 전장을 처음부터 다시 치른다. 다른 갈림길로는 빠질 수 없다. */
function showActive(host:RunHost,run:Run){
  const kind=run.active!,live=host.liveRunBattle(),same=live?.seed===run.seed&&live.floor===run.floor&&live.kind===kind;
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(regionOf(run.floor).name)}</div>
  <h2>전투가 아직 끝나지 않았다</h2><p>${same?'열려 있는 전장으로 돌아가 승부를 마저 낸다.':'진행하던 전장 기록이 다른 전투로 바뀌었다. 같은 전장을 처음부터 다시 치른다(지형·적 배치는 같다).'} 전투를 마치기 전에는 다른 갈림길을 고를 수 없다.</p>
  ${partyPanel(run)}<div class="run-actions"><button id="run-resume" class="primary">${same?'전장으로 돌아가기':'같은 전장 다시 시작'}</button><button id="run-menu">← 본영</button></div></div>`,false);
  document.getElementById('run-resume')!.onclick=()=>same?host.backToBattle():kind==='story'?launchStory(host,run,run.activeStage!):launch(host,run,kind as 'battle'|'elite'|'boss');
  document.getElementById('run-menu')!.onclick=host.showMenu;
}

function choose(host:RunHost,run:Run,node:RunNode){
  if(node.kind==='battle'||node.kind==='elite'||node.kind==='boss')return launch(host,run,node.kind);
  if(node.kind==='story'&&node.stage)return launchStory(host,run,node.stage);
  visitNode(run,node);saveRun(run);showRun(host,run);
}

function showReward(host:RunHost,run:Run){
  const offer=run.offer??[];
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}층 · 보상</div><h2>하나를 고른다</h2>${news(run)}${partyPanel(run)}
  <div class="run-choices">${offer.map((o,i)=>{const d=describeReward(o);return `<button data-reward="${i}"><strong>${esc(d.title)}</strong><small>${esc(d.detail)}${o.kind==='recruit'&&run.party.length>=PARTY_LIMIT?' · 부대가 가득 차 경험치로 바뀜':''}</small></button>`;}).join('')}</div>
  <div class="run-actions"><button id="run-skip">건너뛰기</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-reward]').forEach(b=>b.onclick=()=>{takeReward(run,Number(b.dataset.reward));saveRun(run);showRun(host,run);});
  document.getElementById('run-skip')!.onclick=()=>{skipReward(run);saveRun(run);showRun(host,run);};
}

function showEnd(host:RunHost,run:Run){
  const meta=loadMeta(),gain=settleRun(meta,run);saveMeta(meta);
  const won=run.status==='won',reached=won?RUN_FLOORS:run.floor;
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${won?'완주':'원정 종료'}</div><h2>${won?'천명을 거머쥐다':'원정이 끝났다'}</h2>${news(run)}
  <p>${won?'세 편의 우두머리를 모두 꺾었다.':`${reached}층(${esc(regionOf(reached).arc)})에서 멈췄다.`} 최고 기록 ${meta.best}층.</p>
  <div class="hub-stats"><span><b>+${gain||mandateEarned(run)}</b><small>얻은 천명</small></span><span><b>${meta.mandate}</b><small>쓸 수 있는 천명</small></span><span><b>${run.storyDone?.length??0}</b><small>이긴 연의 전장</small></span><span><b>${run.bosses??0}</b><small>꺾은 우두머리</small></span></div>
  ${run.party.length?`<h3>끝까지 남은 부대</h3>${partyPanel(run)}`:''}
  ${run.fallen.length?`<h3>쓰러진 부대</h3><p class="muted">${run.fallen.map(esc).join(' · ')}</p>`:''}
  <div class="run-actions"><button id="run-new" class="primary">새 원정</button><button id="run-shop">천명 해금</button><button id="run-menu">← 본영</button></div></div>`,false);
  clearRun();
  document.getElementById('run-new')!.onclick=()=>showStart(host);
  document.getElementById('run-shop')!.onclick=()=>showShop(host);
  document.getElementById('run-menu')!.onclick=host.showMenu;
}

/** 원정 전투가 끝났을 때 main.ts가 부른다. */
export function finishRunBattle(host:RunHost,state:BattleState,deployment:Deployment){
  const ref=deployment.run!,run=loadRun();
  if(!run||run.floor!==ref.floor||run.status!=='map'||!run.active||run.active==='story'){host.toast('이 전투의 원정 기록을 찾을 수 없습니다.');return host.showMenu();}
  finishBattle(run,{kind:ref.kind,label:'',detail:''},state.outcome==='victory',survivorsOf(state,ref));
  saveRun(run);showRun(host,run);
}

/** 연의 전장이 끝났을 때 main.ts가 부른다. 이기면 천명 기록에 바로 남긴다. */
export function finishRunStory(host:RunHost,state:BattleState,deployment:Deployment){
  const ref=deployment.runStory!,run=loadRun();
  if(!run||run.floor!==ref.floor||run.status!=='map'||run.active!=='story'||run.activeStage!==ref.stage){host.toast('이 연의 전장의 원정 기록을 찾을 수 없습니다.');return host.showMenu();}
  const hero=state.find('sima_yi'),victory=state.outcome==='victory';
  finishStory(run,ref.stage,victory,hero?.alive?hero.hp/Math.max(1,hero.stats.maxHp):0,stageTitle(ref.stage));
  if(victory){const meta=loadMeta();recordStory(meta,ref.stage);saveMeta(meta);}
  saveRun(run);showRun(host,run);
}
