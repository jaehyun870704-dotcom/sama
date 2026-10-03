/** 천명의 원정 화면: 출발 부대 선택 · 층 갈림길 · 보상 · 원정 종료. 규칙은 roguelike.ts에 있다. */
import {newRun,startingOffers,floorChoices,visitNode,finishBattle,takeReward,skipReward,describeReward,nextEvolutionText,battleRef,survivorsOf,
  regionOf,isBossFloor,RELICS,RUN_FLOORS,PARTY_LIMIT,XP_PER_LEVEL,type Run,type RunNode,type RunUnit} from './roguelike.ts';
import {classNames} from './troops.ts';
import {tierOf,type UnitClass,type BattleState} from '../../core/src/index.ts';
import type {Deployment} from './progression.ts';

export interface RunHost {
  modal(html:string,closable?:boolean):void;
  showMenu():void;
  toast(text:string):void;
  startBattle(deployment:Deployment,seed:number):void;
  /** 지금 열려 있는 원정 전투(끝나지 않은 것) */
  liveRunBattle():{seed:number;floor:number;kind:string}|undefined;
  backToBattle():void;
}

const KEY='sama-run-v1',BEST='sama-run-best';
export const RUN_CHAPTER=11;

export function loadRun():Run|null{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const r=JSON.parse(raw) as Run;return r?.version===1&&Array.isArray(r.party)?r:null;}catch{return null;}}
function saveRun(run:Run){try{localStorage.setItem(KEY,JSON.stringify(run));}catch{/* storage optional */}}
function clearRun(){try{localStorage.removeItem(KEY);}catch{/* storage optional */}}
function best(){try{return Number(localStorage.getItem(BEST)??0)||0;}catch{return 0;}}
function recordBest(floor:number){try{if(floor>best())localStorage.setItem(BEST,String(floor));}catch{/* storage optional */}}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const name=(c:UnitClass)=>classNames[c]??c;
const pips=(c:UnitClass)=>'◆'.repeat(tierOf(c))+'◇'.repeat(3-tierOf(c));

function unitCard(u:RunUnit){
  return `<div class="run-unit${u.hero?' hero':''}"><div class="run-unit-head"><strong>${esc(u.hero?'사마의':u.name)}</strong><span class="run-tier" title="병종 단계">${pips(u.unitClass)}</span></div>
  <small>${esc(name(u.unitClass))} · Lv.${u.level}</small>
  <div class="run-bar hp" title="체력"><i style="width:${Math.round(u.hp*100)}%"></i></div>
  <div class="run-bar xp" title="경험치"><i style="width:${Math.round(u.xp/XP_PER_LEVEL*100)}%"></i></div>
  <small class="run-next">${esc(nextEvolutionText(u.unitClass))}</small></div>`;
}
function partyPanel(run:Run){
  const relics=run.relics.map(id=>RELICS.find(r=>r.id===id)!).map(r=>`<span class="run-relic" title="${esc(r.effect)}">${esc(r.name)}</span>`).join('');
  return `<div class="run-party">${run.party.map(unitCard).join('')}</div><p class="run-relics">${relics||'<span class="muted">보물 없음</span>'}</p>`;
}
const news=(run:Run)=>run.news.length?`<div class="run-news">${run.news.map(n=>`<p${n.startsWith('진화!')?' class="evo"':''}>${esc(n)}</p>`).join('')}</div>`:'';

/** 메뉴의 '천명의 원정' 단추. 진행 중인 원정이 있으면 이어서, 없으면 출발 부대 선택. */
export function openRun(host:RunHost){
  const run=loadRun();
  if(run&&(run.status==='map'||run.status==='reward'))return showRun(host,run);
  showStart(host);
}

function showStart(host:RunHost){
  const seed=(Date.now()%2147483647)||7,offers=startingOffers(seed);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · 로그라이크</div><h2>출발 부대를 고른다</h2>
  <p>열두 층을 지나 하북·한중·강동의 우두머리를 꺾는다. 층마다 갈림길 하나를 고르고, 쓰러진 부대는 영영 돌아오지 않는다. 레벨이 오르면 병종이 진화한다. 사마의가 쓰러지면 원정이 끝난다.</p>
  <p class="muted">최고 기록 ${best()}층 · 부대는 최대 ${PARTY_LIMIT}개</p>
  <div class="run-choices">${offers.map((o,i)=>`<button data-start="${i}"><strong>${o.map(name).join(' · ')}</strong><small>${o.map(c=>nextEvolutionText(c)).join(' / ')}</small></button>`).join('')}</div>
  <button id="run-back">← 연의 지도</button></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-start]').forEach(b=>b.onclick=()=>{const run=newRun(seed,offers[Number(b.dataset.start)]!);saveRun(run);showRun(host,run);});
  document.getElementById('run-back')!.onclick=host.showMenu;
}

export function showRun(host:RunHost,run:Run){
  if(run.status==='reward')return showReward(host,run);
  if(run.status==='won'||run.status==='lost')return showEnd(host,run);
  if(run.active)return showActive(host,run);
  const choices=floorChoices(run),region=regionOf(run.floor);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(region.name)}</div>
  <h2>${isBossFloor(run.floor)?'우두머리가 기다린다':'갈림길'}</h2>${news(run)}${partyPanel(run)}
  <div class="run-choices">${choices.map((c,i)=>`<button data-node="${i}" class="${c.kind==='boss'?'primary':''}"><strong>${esc(c.label)}</strong><small>${esc(c.detail)}</small></button>`).join('')}</div>
  <div class="run-actions"><button id="run-menu">← 연의 지도 (원정은 저장됨)</button><button id="run-abandon">원정 포기</button></div></div>`,false);
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
  const deployment:Deployment={levels:{sima_yi:hero.level,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:battleRef(run,kind)};
  run.active=kind;saveRun(run);host.startBattle(deployment,(run.seed+run.floor*97)%2147483647);
}

/** 전투 도중 메뉴로 나왔다면: 그 전장으로 돌아가거나, 같은 전장을 처음부터 다시 치른다. 다른 갈림길로는 빠질 수 없다. */
function showActive(host:RunHost,run:Run){
  const kind=run.active as 'battle'|'elite'|'boss',live=host.liveRunBattle(),same=live?.seed===run.seed&&live.floor===run.floor&&live.kind===kind;
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(regionOf(run.floor).name)}</div>
  <h2>전투가 아직 끝나지 않았다</h2><p>${same?'열려 있는 전장으로 돌아가 승부를 마저 낸다.':'진행하던 전장 기록이 다른 전투로 바뀌었다. 같은 전장을 처음부터 다시 치른다(지형·적 배치는 같다).'} 전투를 마치기 전에는 다른 갈림길을 고를 수 없다.</p>
  ${partyPanel(run)}<div class="run-actions"><button id="run-resume" class="primary">${same?'전장으로 돌아가기':'같은 전장 다시 시작'}</button><button id="run-menu">← 연의 지도</button></div></div>`,false);
  document.getElementById('run-resume')!.onclick=()=>same?host.backToBattle():launch(host,run,kind);
  document.getElementById('run-menu')!.onclick=host.showMenu;
}

function choose(host:RunHost,run:Run,node:RunNode){
  if(node.kind==='battle'||node.kind==='elite'||node.kind==='boss')return launch(host,run,node.kind);
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
  const won=run.status==='won',reached=won?RUN_FLOORS:run.floor;recordBest(reached);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${won?'완주':'원정 종료'}</div><h2>${won?'천명을 거머쥐다':'원정이 끝났다'}</h2>${news(run)}
  <p>${won?'세 지역의 우두머리를 모두 꺾었다.':`${reached}층에서 멈췄다.`} 최고 기록 ${best()}층.</p>
  ${run.party.length?`<h3>끝까지 남은 부대</h3>${partyPanel(run)}`:''}
  ${run.fallen.length?`<h3>쓰러진 부대</h3><p class="muted">${run.fallen.map(esc).join(' · ')}</p>`:''}
  <div class="run-actions"><button id="run-new" class="primary">새 원정</button><button id="run-menu">← 연의 지도</button></div></div>`,false);
  clearRun();
  document.getElementById('run-new')!.onclick=()=>showStart(host);
  document.getElementById('run-menu')!.onclick=host.showMenu;
}

/** 원정 전투가 끝났을 때 main.ts가 부른다. */
export function finishRunBattle(host:RunHost,state:BattleState,deployment:Deployment){
  const ref=deployment.run!,run=loadRun();
  if(!run||run.floor!==ref.floor||run.status!=='map'||!run.active){host.toast('이 전투의 원정 기록을 찾을 수 없습니다.');return host.showMenu();}
  finishBattle(run,{kind:ref.kind,label:'',detail:''},state.outcome==='victory',survivorsOf(state,ref));
  saveRun(run);showRun(host,run);
}
