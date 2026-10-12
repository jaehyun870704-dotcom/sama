/** 천명의 원정 화면: 본영(첫 화면) · 출발 · 층 갈림길 · 보상 · 원정 종료 · 천명 해금. 규칙은 roguelike.ts, 영구 진행은 meta.ts. */
import {showCodex,codexNames} from './codex-ui.ts';
import {GAME_NAME,GAME_SERIES,GAME_TAG} from './brand.ts';
import {allStrategies} from './officers.ts';
import {RECRUITABLE} from './recruit.ts';
import {showResearch} from './research-ui.ts';
import {newRun,startingOfficers,departingOfficers,floorChoices,visitNode,finishBattle,finishStory,takeReward,skipReward,describeReward,nextEvolutionText,battleRef,survivorsOf,
  regionFor,actOf,isBossFloor,mandateEarned,chooseFate,taleById,RELICS,REGIONS,STORY_ORDER,RUN_FLOORS,XP_PER_LEVEL,sortieOf,sortieSize,cycleSortie,type Run,type RunNode,type RunUnit,type OfficerSpec} from './roguelike.ts';
import {romanceStats,romanceByName} from './romance.ts';
import {scenarioSummary} from './scenario-ui.ts';
import {runBoard} from './run-board.ts';
import {showCustomEditor} from './custom-ui.ts';
import {treasureSummary,treasureCodex,defaultFilter,type TreasureTab,type CodexFilter} from './treasure-codex.ts';
import {fateMap} from './fate-map.ts';
import {classTactics} from '../../core/src/index.ts';
import {loadMeta,saveMeta,buyUnlock,recordStory,settleRun,UNLOCKS,type MetaState} from './meta.ts';
import {deploymentPerks} from './officer-perks.ts';
import {fatePoint,ROUTES,routesFor,routeById,endingFor,ALL_ENDINGS} from './fate.ts';
import {classNames} from './troops.ts';
import {chapters,campaignOrder} from './session.ts';
import {freshCampaign,award,deployment as campaignDeployment} from './progression.ts';
import {tierOf,currentClass,type UnitClass,type BattleState} from '../../core/src/index.ts';
import type {Deployment} from './progression.ts';
import {을를} from './josa.ts';
import {playEndingCutscene,finaleData} from './ending-finale.ts';

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
  /** 연의(본편): 다음에 이길 장이 있는 편을 바로 연다 */
  showChronicleNext():void;
  /** 연의 진행 요약: 다음 장 · 이긴 장 · 인장 */
  chronicleSummary():{next?:string;won:number;total:number;seals:number;sealMax:number};
  showTroops():void;
  showSlots(back?:()=>void):void;
  /** 시나리오 모드(본편: 연의 + 가상) */
  showScenario():void;
  /** 수련·보물 인연·도전(연무장) */
  showExpeditions(tab?:'training'|'quest'|'bounty'|'challenge'):void;
  /** 수련장: 막혔을 때 다음 장 권장 레벨까지 키우는 곳 */
  showTraining():void;
  /** 시나리오 보기: 지난 이야기 다시 보기 · 이긴 장 다시 싸우기 · 본 결말 */
  showStoryArchive():void;
  /** 등용: 계보마다 조건을 채워 장수를 들인다 */
  showRecruit():void;
  /** 제갈량전: 장 목록 */
  showZhuge():void;
  /** 제갈량전 진행 요약 */
  zhugeSummary():{next?:string;won:number;total:number;seals:number;sealMax:number};
  /** 자동 저장된 전투가 있으면 이어 하기 */
  resumeSaved?:(()=>void)|undefined;
  /** 이어할 마지막 전투(끝나지 않은 것) */
  lastBattle():{where:string;turn:number}|undefined;
}

const KEY='sama-run-v1';
export const RUN_CHAPTER=11;

export function loadRun():Run|null{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const r=JSON.parse(raw) as Run;if(r?.version!==1||!Array.isArray(r.party))return null;for(const u of r.party)u.unitClass=currentClass(u.unitClass);return r;}catch{return null;}}
function saveRun(run:Run){try{localStorage.setItem(KEY,JSON.stringify(run));}catch{/* storage optional */}}
function clearRun(){try{localStorage.removeItem(KEY);}catch{/* storage optional */}}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const name=(c:UnitClass)=>classNames[c]??c;
const pips=(c:UnitClass)=>{const t=Math.max(1,Math.min(4,tierOf(c)));return '◆'.repeat(t)+'◇'.repeat(4-t);};
const stageTitle=(id:string)=>{const c=chapters.find(x=>x.stage.id===id);return c?`${c.stage.subtitle??c.stage.title}`:id;};
const ongoing=(run:Run|null):run is Run=>!!run&&(run.status==='map'||run.status==='reward');

function unitCard(u:RunUnit,bench=false,mode?:'in'|'out'|'auto'){
  return `<div class="run-unit${u.hero?' hero':''}${u.officer?' officer':''}${bench?' bench':''}"><div class="run-unit-head"><strong>${esc(u.hero?'사마의':u.name)}${bench?' <em class="run-bench" title="다음 싸움에는 본진에서 쉰다(출진은 체력·레벨 순, 층이 깊을수록 많이)">대기</em>':''}</strong><span class="run-tier" title="병종 단계">${pips(u.unitClass)}</span></div>
  <small>${esc(name(u.unitClass))} · Lv.${u.level} · 경험치 ${u.xp}/${XP_PER_LEVEL}</small>
  <div class="run-bar hp" title="체력"><i style="width:${Math.round(u.hp*100)}%"></i></div>
  <div class="run-bar xp" title="경험치"><i style="width:${Math.round(u.xp/XP_PER_LEVEL*100)}%"></i></div>
  <small class="run-next">${esc(nextEvolutionText(u.unitClass))}</small>${mode&&!u.hero?`<button type="button" class="run-sortie ${mode}" data-sortie-id="${esc(u.id)}" title="누를 때마다 자동 → 출진 고정 → 대기">${mode==='in'?'출진 고정':mode==='out'?'대기 고정':'자동 편성'}</button>`:''}</div>`;
}
function partyPanel(run:Run,editable=false){
  const relics=run.relics.map(id=>RELICS.find(r=>r.id===id)!).map(r=>`<span class="run-relic" title="${esc(r.effect)}">${esc(r.name)}</span>`).join('');
  const kind=isBossFloor(run.floor)?'boss':'battle',go=new Set(sortieOf(run,kind));
  const head=editable&&run.party.length>1?`<p class="run-sortie-note">이번 출진 ${go.size}/${sortieSize(run.floor,kind)}명 · 장수 아래 단추로 「출진 고정」·「대기 고정」을 정한다(나머지는 체력·레벨 순 자동).</p>`:'';
  return `${head}<div class="run-party">${run.party.map(u=>unitCard(u,!go.has(u),editable?(run.sortie?.[u.id]??'auto'):undefined)).join('')}</div><p class="run-relics">${relics||'<span class="muted">보물 없음</span>'}${run.secondChance?'<span class="run-relic grace" title="원정마다 한 번, 패배해도 원정이 끝나지 않는다">천명의 가호</span>':''}</p>`;
}
const news=(run:Run)=>run.news.length?`<div class="run-news">${run.news.map(n=>`<p${n.startsWith('진화!')?' class="evo"':''}>${esc(n)}</p>`).join('')}</div>`:'';
const actTrack=(run:Run)=>`<div class="run-track" aria-label="원정 진행">${[1,2,3].map(act=>{const cur=actOf(run.floor),r=regionFor(run,(act-1)*6+1),route=routeById(run.route?.[act as 1|2|3]);return `<span class="${act<cur?'done':act===cur?'now':''}${route&&!route.history?' if':''}">${r.arc} · ${!route?'갈림길 전':r.name}${route&&!route.history?' · 가상':''}</span>`;}).join('')}</div>`;

// ─────────────────────────────────────────────── 첫 화면 · 본영 · 도감

/** 본영 칸 하나: 그림 글자(인장) · 이름 · 한 줄 설명 · 진행 */
const tile=(id:string,seal:string,title:string,line:string,meta='',cls='')=>`<button id="${id}" class="lobby-tile ${cls}"><span class="lobby-seal" aria-hidden="true">${seal}</span><span class="lobby-text"><strong>${title}</strong><small>${line}</small>${meta?`<em>${meta}</em>`:''}</span></button>`;

/**
 * 첫 화면(타이틀). 성문 앞 전장 그림 위에 제목과 시작 단추만 둔다 — 무엇을 할지는 본영에서 고른다.
 * 그림·제목은 모두 이 게임이 직접 만든 것이다(다른 게임의 로고·그림을 쓰지 않는다).
 */
export function showTitle(host:RunHost){
  const c=host.chronicleSummary(),resume=host.resumeSaved,last=host.lastBattle();
  const item=(id:string,label:string,sub:string,cls='')=>`<button id="${id}" class="${cls}"><span>${label}</span><small>${sub}</small></button>`;
  host.modal(`<div class="title-screen"><div class="title-bg" aria-hidden="true"></div><img class="title-hero" src="portraits/cao-cao.webp" alt="관을 쓴 조조 창작 초상">
  <div class="title-copy"><p class="title-eyebrow">${GAME_SERIES}</p><h1 class="title-logo">${GAME_NAME}</h1><p class="title-tag">${GAME_TAG}</p>
  <nav class="title-menu" aria-label="첫 화면 메뉴">
    <div class="tm-group">${item('title-start','시작','사마의전 · 제갈량전 가운데 고른다','primary')}${resume&&last?item('title-resume','이어하기',`${esc(last.where)}${last.turn?` · ${last.turn}턴`:''} · 내 차례부터`):''}${item('title-load','불러오기','저장 칸에서 기록을 불러온다')}</div>
    <div class="tm-group">${item('title-codex','도감 보기','인물 · 병종 · 책략 · 보물 · 갈림길')}${item('title-custom','신장수 만들기','나만의 장수 · 신세력')}${item('title-lobby','본영','수련장 · 도전 · 등용 · 연구')}</div>
    <div class="tm-group sub">${item('title-roguelike','천명의 길','회차마다 갈림길을 골라 결말까지','title-sub')}</div>
  </nav>
  <p class="title-note">비상업 팬 창작 게임 · 등장인물은 『삼국지연의』와 정사를 바탕으로 새로 그렸다</p></div></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('title-start',()=>showStoryPick(host,()=>showTitle(host)));on('title-resume',()=>host.resumeSaved?.());on('title-load',()=>host.showSlots(()=>showTitle(host)));
  on('title-codex',()=>showCollections(host,()=>showTitle(host)));on('title-custom',()=>showCustomEditor(host,()=>showTitle(host)));
  on('title-lobby',()=>showHub(host));on('title-roguelike',host.showScenario);
}

/**
 * 이야기 고르기: 시작을 누르면 주인공이 다른 이야기들 가운데 하나를 고른다.
 * 어느 이야기든 처음부터 고를 수 있고, 보물·연구·장수마다 쌓은 레벨은 함께 쓴다.
 */
export function showStoryPick(host:RunHost,back:()=>void){
  const sima=host.chronicleSummary(),zhuge=host.zhugeSummary();
  const card=(id:string,seal:string,name:string,line:string,s:{next?:string;won:number;total:number;seals:number;sealMax:number})=>`<button id="${id}" class="story-pick-card"><span class="lobby-seal" aria-hidden="true">${seal}</span><strong>${name}</strong><small>${line}</small><em>${s.won}/${s.total}장 · 연의 천명 ${s.seals}/${s.sealMax}${s.next?` · 다음 ${esc(s.next)}`:' · 모두 이겼다'}</em></button>`;
  host.modal(`<div class="briefing story-pick"><p class="eyebrow">시작 · 이야기 고르기</p><h2>누구의 이야기를 걸을까</h2><p class="screen-lede">어느 이야기든 처음부터 고를 수 있다. 보물·연구와 장수마다 쌓은 레벨은 이야기를 넘어 이어진다.</p>
  <div class="story-pick-grid">${card('pick-sima','사','사마의전','하내의 소년이 칼을 거두고 때를 기다려 천하를 쥐기까지',sima)}${card('pick-zhuge','제','제갈량전','피난길의 소년이 와룡이 되어 오장원에 이르기까지',zhuge)}</div>
  <div class="modal-actions"><button id="pick-back">← 돌아가기</button></div></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('pick-sima',host.showChronicleNext);on('pick-zhuge',host.showZhuge);on('pick-back',back);
}

/**
 * 본영(로비): 할 일을 칸으로 나눈다. 출진(본편) · 수련장(막혔을 때 레벨업) · 도전 · 원정 · 시나리오 보기 · 도감 · 군영.
 * 보물은 첫 화면에 늘어놓지 않고 도감에서 본다.
 */
export function showHub(host:RunHost){
  const meta=loadMeta(),sc=scenarioSummary(),run=loadRun(),c=host.chronicleSummary();
  host.modal(`<div class="lobby"><div class="lobby-bg" aria-hidden="true"></div>
  <header class="lobby-head"><div><p class="eyebrow">본영 · 군막</p><h2>천하를 향한 다음 수</h2></div>
  <div class="hub-stats"><span><b>${c.won}/${c.total}</b><small>이긴 연의</small></span><span><b>${c.seals}/${c.sealMax}</b><small>연의 천명</small></span><span><b>${(meta.recruited??[]).length}</b><small>등용</small></span><span><b>${meta.mandate}</b><small>천명</small></span></div></header>
  <div class="lobby-main">
    ${tile('hub-chronicle','사','사마의전',`연의 ${c.total}장 · 일반/극한과 천명 조건`,c.next?`다음 · ${esc(c.next)}`:`${c.total}장 완료 · 극한 천명 조건과 천명 보상을 모아 보자`,'primary')}
    ${tile('hub-zhuge','제','제갈량전',`연의 ${host.zhugeSummary().total}장 · 피난길에서 오장원까지`,host.zhugeSummary().next?`다음 · ${esc(host.zhugeSummary().next!)}`:'이어지는 장을 기다린다','primary')}
    ${tile('hub-training','수','수련장','막혔을 때 레벨업 · 다음 연의 장 권장 레벨까지','승리마다 경험치 · 연의 장수 모두')}
    ${tile('hub-challenge','관','도전의 관문','10단계 · 단계마다 적이 늘고 강해진다','처음 넘는 단계마다 보물')}
    ${tile('hub-recruit','등','등용','계보마다 조건을 채워 장수를 휘하로 · 연의에 데려간다',`등용 ${(meta.recruited??[]).length}/${RECRUITABLE.length}명`)}
    ${tile('hub-archive','서','시나리오 보기','지난 이야기를 다시 보고, 이긴 장을 다시 싸운다',`결말 ${meta.endings.length}/${ALL_ENDINGS.length}`)}
    ${tile('hub-collections','감','도감','인물 · 병종 · 책략 · 보물 · 갈림길',`보물 ${treasureSummary().owned}/${treasureSummary().total}`)}
    ${tile('hub-scenario','명','천명의 길','회차마다 갈림길을 골라 가상 전장과 결말까지',sc.state.run?`제${sc.state.run.no}회차 · ${esc(sc.tag)} 「${esc(sc.title)}」`:'연의와 레벨·보물을 함께 쓴다','sub')}
    ${tile('hub-run','정','천명의 원정','3편 18층을 오르는 한 번뿐인 길',ongoing(run)?`원정 중 · ${run.floor}층`:`최고 ${meta.best}층 · 천명 ${meta.mandate}`,'sub')}
  </div>
  <nav class="lobby-sub">${host.resumeSaved?'<button id="hub-resume" class="primary">전투 이어하기</button>':''}<button id="hub-research">연구</button><button id="hub-custom">신장수 · 신세력</button><button id="hub-slots">저장 칸</button><button id="hub-title">첫 화면</button></nav></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('hub-scenario',host.showScenario);on('hub-chronicle',host.showChronicleNext);on('hub-zhuge',host.showZhuge);on('hub-training',host.showTraining);on('hub-challenge',()=>host.showExpeditions('challenge'));on('hub-run',()=>showQuests(host));
  on('hub-archive',host.showStoryArchive);on('hub-recruit',host.showRecruit);on('hub-collections',()=>showCollections(host,()=>showHub(host)));on('hub-custom',()=>showCustomEditor(host,()=>showHub(host)));
  on('hub-research',()=>showResearch({modal:host.modal,toast:host.toast,back:()=>showHub(host),codex:()=>codexOf(host)()}));
  on('hub-resume',()=>host.resumeSaved?.());on('hub-slots',()=>host.showSlots());on('hub-title',()=>showTitle(host));
}
const codexOf=(host:RunHost,tab:'people'|'classes'|'strategies'='people')=>()=>{const back=()=>showCollections(host);const research=()=>showResearch({modal:host.modal,toast:host.toast,back,codex:()=>showCodex({modal:host.modal,toast:host.toast,back,research})});showCodex({modal:host.modal,toast:host.toast,back,research},{tab});};

/** 도감: 모은 것을 한곳에서 본다(인물열전 · 병종 진화표 · 책략 · 보물 · 갈림길 지도). */
/** 도감에서 나갈 곳: 첫 화면에서 들어오면 첫 화면, 본영에서 들어오면 본영(도감 안 화면을 오가도 유지). */
let collectionsBack:(()=>void)|undefined;
export function showCollections(host:RunHost,back?:()=>void){
  if(back)collectionsBack=back;const leave=collectionsBack??(()=>showHub(host));
  const t=treasureSummary(),meta=loadMeta();
  const card=(id:string,seal:string,title:string,line:string,count:string)=>`<button id="${id}" class="codex-card"><span class="lobby-seal" aria-hidden="true">${seal}</span><strong>${title}</strong><small>${line}</small><em>${count}</em></button>`;
  host.modal(`<div class="briefing collections-screen"><div class="eyebrow">도감</div><h2>도감</h2><p class="screen-lede">모은 보물과 알게 된 인물·병종·책략·갈림길을 본다.</p>
  <div class="codex-cards">
    ${card('col-people','인','인물 열전','연의·정사의 장수 · 능력 · 고유특성 · 열전',`${codexNames().length}명`)}
    ${card('col-classes','병','병종','병종마다 무기·상성·부대효과',`${Object.keys(classNames).length}종`)}
    ${card('col-evolution','진','병종 진화표','레벨이 오르면 어떻게 강해지는가','4단계 진화')}
    ${card('col-strategies','책','책략','속성 단계 · 상승 · 감소 · 보급 · 사신',`${allStrategies.length}종`)}
    ${card('col-treasures','보','보물','가진 것 · 얻는 곳 · 효과 · 특기',`${t.owned}/${t.total} · 회차 ${t.relics}/${t.relicTotal}`)}
    ${card('col-fate','갈','갈림길 지도','정사와 가상이 갈라지는 곳과 결말',`결말 ${meta.endings.length}/${ALL_ENDINGS.length}`)}
  </div>
  <div class="run-actions"><button id="col-back">← 돌아가기</button></div></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('col-people',codexOf(host,'people'));on('col-classes',codexOf(host,'classes'));on('col-strategies',codexOf(host,'strategies'));
  on('col-evolution',host.showTroops);on('col-treasures',()=>showTreasures(host));on('col-fate',()=>showFateMap(host,()=>showCollections(host)));on('col-back',leave);
}

/** 보물 도감: 가진 것·얻는 곳·효과·특기·장착한 장수. */
export function showTreasures(host:RunHost,tab:TreasureTab|CodexFilter='all'){
  const f=typeof tab==='string'?defaultFilter(tab):tab;
  host.modal(`<div class="briefing treasure-screen"><div class="eyebrow">도감 · 보물</div><h2>보물</h2>${treasureCodex(f)}<div class="run-actions"><button id="tc-back">← 도감</button></div></div>`,false);
  const go=(g:Partial<CodexFilter>)=>showTreasures(host,{...f,...g});
  document.querySelectorAll<HTMLButtonElement>('[data-tc-kind]').forEach(b=>b.onclick=()=>go({kind:b.dataset.tcKind as CodexFilter['kind'],form:'all'}));
  document.querySelectorAll<HTMLButtonElement>('[data-tc-form]').forEach(b=>b.onclick=()=>go({form:b.dataset.tcForm as CodexFilter['form']}));
  document.querySelectorAll<HTMLButtonElement>('[data-tc-grade]').forEach(b=>b.onclick=()=>go({grade:Number(b.dataset.tcGrade)}));
  document.querySelectorAll<HTMLButtonElement>('[data-tc-own]').forEach(b=>b.onclick=()=>go({own:b.dataset.tcOwn as CodexFilter['own']}));
  document.getElementById('tc-back')!.onclick=()=>showCollections(host);
}
/** 갈림길 지도: 연의에서 가상으로 갈라지는 자리와 진행 방식. */
export function showFateMap(host:Pick<RunHost,'modal'>,back:()=>void){
  host.modal(`<div class="briefing fate-map-screen"><div class="eyebrow">도감 · 갈림길</div><h2>갈림길 지도</h2><p class="screen-lede">정사와 가상이 어디서 갈라지고 어떤 결말로 이어지는지 본다.</p>${fateMap()}<div class="run-actions"><button id="fm-back">← 돌아가기</button></div></div>`,false);
  document.getElementById('fm-back')!.onclick=back;
}
/** 반복 퀘스트: 연의 밖에서 레벨을 올리고 보물을 모으는 곳(성장 기록은 연의와 같다). */
/** 천명의 원정(로그라이크) 입구: 이어 하기 · 새 원정 · 천명 해금. 수련·도전·시나리오 보기는 본영에 따로 있다. */
export function showQuests(host:RunHost){
  const meta=loadMeta(),run=loadRun();
  host.modal(`<div class="briefing run-screen quest-screen"><div class="eyebrow">본영 · 천명의 원정</div><h2>천명의 원정</h2>
  <p>3편 18층을 오른다. 층마다 갈림길(전투·정예·모병·휴식·보물)을 고르고, 쓰러진 장수는 돌아오지 않는다. 원정이 끝나면 오른 만큼 천명을 얻어 영구 해금에 쓴다. 원정 부대는 연의·천명의 길과 따로 꾸린다.</p>
  <div class="quest-grid one">
    <article><h3>원정 <small>천명 ${meta.mandate} · 최고 ${meta.best}층 · ${meta.runs}회</small></h3>
      <div class="run-actions">${ongoing(run)?`<button id="q-run-continue" class="primary">원정 이어하기 · ${run.floor}층</button>`:''}<button id="q-run-new" class="${ongoing(run)?'':'primary'}">${ongoing(run)?'새 원정 (지금 원정은 포기)':'새 원정 시작'}</button><button id="q-shop">천명 해금 ${meta.unlocks.length}/${UNLOCKS.length}</button></div></article>
  </div>
  <div class="run-actions"><button id="q-back">← 본영</button></div></div>`,false);
  const on=(id:string,f:()=>void)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  on('q-run-continue',()=>showRun(host,run!));on('q-shop',()=>showShop(host));on('q-back',host.showMenu);
  on('q-run-new',()=>{if(ongoing(run)){const b=document.getElementById('q-run-new')!;if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='정말 포기하고 새로 시작';b.classList.add('danger');return;}run.status='lost';run.news=['원정을 포기했다.'];saveRun(run);return showEnd(host,run);}showStart(host);});
}

function showShop(host:RunHost,note=''){
  const meta=loadMeta();
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · 해금 · 천명 ${meta.mandate}</div><h2>천명 해금</h2>
  <p>원정이 끝날 때마다 천명을 얻는다: 오른 층 1 · 꺾은 우두머리 3 · 이긴 연의 전장 2 · 완주 10. 해금은 다음 원정부터 계속 적용된다.</p>${note?`<div class="run-news"><p>${esc(note)}</p></div>`:''}
  <div class="run-choices">${UNLOCKS.map(u=>{const own=meta.unlocks.includes(u.id);return `<button data-unlock="${u.id}" ${own||meta.mandate<u.cost?'disabled':''} class="${own?'owned':''}"><strong>${esc(u.name)} <small>${own?'해금됨':`천명 ${u.cost}`}</small></strong><small>${esc(u.effect)}</small></button>`;}).join('')}</div>
  <div class="run-actions"><button id="shop-back">← 천명의 원정</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-unlock]').forEach(b=>b.onclick=()=>{const m=loadMeta();if(buyUnlock(m,b.dataset.unlock!)){saveMeta(m);showShop(host,`${을를(`「${UNLOCKS.find(u=>u.id===b.dataset.unlock)!.name}」`)} 해금했다.`);}});
  document.getElementById('shop-back')!.onclick=()=>showQuests(host);
}


// ─────────────────────────────────────────────── 원정

/** 원정 열기: 진행 중이면 이어서, 없으면 출발 부대 선택. */
export function openRun(host:RunHost){
  const run=loadRun();
  if(ongoing(run))return showRun(host,run);
  showStart(host);
}

/** 원정의 출발: 부대를 고르지 않는다. 사마의와 그를 따르는 장수들이 정해진 대로 떠난다. */
function showStart(host:RunHost){
  const meta=loadMeta(),seed=(Date.now()%2147483647)||7,start=startingOfficers(meta.unlocks);
  const card=(o:OfficerSpec)=>{const r=romanceByName(o.name),t=classTactics(o.unitClass)[0];return `<div class="run-unit officer"><div class="run-unit-head"><strong>${esc(o.name)}</strong><span class="run-tier">${esc(name(o.unitClass))}</span></div>
    <small>${esc(r?.epithet??'')}</small><small>${esc(romanceStats(o.name))}</small>${t?`<small class="run-next">전법 「${esc(t.name)}」 ${esc(t.description)}</small>`:''}</div>`;};
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · 출발</div><h2>출발 부대</h2>
  <p>원정은 언제나 이 장수들과 함께 떠난다. 장수는 연의의 능력을 지니고, 싸울 때마다 경험치를 얻어 레벨이 오르며 병종이 진화한다. 쓰러진 장수는 돌아오지 않고, 사마의가 쓰러지면 원정이 끝난다. 새 장수는 모병소와 전투 보상에서 영입한다.</p>
  <p class="muted">천명 ${meta.mandate} · 해금 ${meta.unlocks.length}/${UNLOCKS.length} · 영입은 제한 없음 · 싸움에는 사마의 포함 1~6층 7명 · 7~12층 9명 · 13~18층 11명(우두머리 전 +1)이 체력·레벨 순으로 나간다</p>
  <div class="run-party"><div class="run-unit hero"><div class="run-unit-head"><strong>사마의</strong><span class="run-tier">책사</span></div><small>${esc(romanceByName('사마의')?.epithet??'')}</small><small>${esc(romanceStats('사마의'))}</small></div>${start.map(card).join('')}</div>
  <div class="run-actions"><button id="run-go" class="primary">출진</button><button id="run-back">← 천명의 원정</button></div></div>`,false);
  document.getElementById('run-go')!.onclick=()=>{
    if(meta.unlocks.includes('heirloom'))return pickHeirloom(host,seed,start,meta);
    begin(host,seed,start,meta);
  };
  document.getElementById('run-back')!.onclick=()=>showQuests(host);
}
function pickHeirloom(host:RunHost,seed:number,start:OfficerSpec[],meta:MetaState){
  const options=RELICS.filter((_,i)=>(i+seed)%2===0).slice(0,3);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · 출발</div><h2>가보 고르기</h2><p class="screen-lede">이번 원정에 들고 갈 가보 하나를 고른다.</p>
  <div class="run-choices">${options.map(r=>`<button data-relic="${r.id}"><strong>${esc(r.name)}</strong><small>${esc(r.effect)}</small></button>`).join('')}</div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-relic]').forEach(b=>b.onclick=()=>begin(host,seed,start,meta,b.dataset.relic));
}
function begin(host:RunHost,seed:number,start:OfficerSpec[],meta:MetaState,relic?:string){
  const run=newRun(seed,start,{chronicle:meta.chronicle,unlocks:meta.unlocks,...(relic?{relic}:{})});
  saveRun(run);showRun(host,run);
}

export function showRun(host:RunHost,run:Run){
  if(run.status==='reward')return showReward(host,run);
  if(run.status==='won'||run.status==='lost')return showEnd(host,run);
  if(run.active)return showActive(host,run);
  const choices=floorChoices(run),region=regionFor(run,run.floor);
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(region.arc)} · ${esc(region.name)}</div>${actTrack(run)}
  <h2>${isBossFloor(run.floor)?`${esc(region.arc)}의 끝 · 우두머리가 기다린다`:'갈림길'}</h2>${news(run)}${partyPanel(run,true)}
  <div class="run-choices">${choices.map((c,i)=>`<button data-node="${i}" class="${c.kind==='boss'?'primary':c.kind==='story'?'story':''}"><strong>${esc(c.label)}${c.stage?` · ${esc(stageTitle(c.stage))}`:''}</strong><small>${esc(c.detail)}</small></button>`).join('')}</div>
  <div class="run-actions"><button id="run-menu">← 천명의 원정 (원정은 저장됨)</button><button id="run-abandon">원정 포기</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(b=>b.onclick=()=>choose(host,run,choices[Number(b.dataset.node)]!));
  document.querySelectorAll<HTMLButtonElement>('[data-sortie-id]').forEach(b=>b.onclick=()=>{cycleSortie(run,b.dataset.sortieId!);saveRun(run);showRun(host,run);});
  document.getElementById('run-menu')!.onclick=()=>showQuests(host);
  const abandon=document.getElementById('run-abandon')!;
  abandon.onclick=()=>{
    // 한 번 더 눌러야 포기된다: 실수로 원정 전체를 잃지 않게.
    if(abandon.dataset.armed!=='1'){abandon.dataset.armed='1';abandon.textContent='정말 포기 (부대 전원 해산)';abandon.classList.add('danger');return;}
    run.status='lost';run.news=['원정을 포기했다.'];saveRun(run);showEnd(host,run);};
}

/** 운명의 갈림길: 사마의가 역사의 길과 다른 길 가운데 하나를 고른다. 고른 길은 그 편 끝까지 간다. */
function showFate(host:RunHost,run:Run){
  const act=actOf(run.floor) as 1|2|3,p=fatePoint(act,run.route);
  host.modal(`<div class="briefing run-screen fate-screen"><div class="eyebrow">${esc(p.year)} · 운명의 갈림길</div><h2>${esc(p.title)}</h2>
  <blockquote>${esc(p.prompt)}</blockquote>
  <div class="run-choices">${routesFor(act,run.route).map(r=>`<button data-route="${r.id}" class="${r.history?'history':'what-if'}"><strong><span class="route-tag">${r.history?'정사':'가상'}</span>${esc(r.choice)}</strong><small>${esc(r.detail)}</small><small class="route-meta">${esc(r.region.name)} · 우두머리 ${esc(r.region.boss.name)}${(()=>{const d=departingOfficers(run,r.id);return d.length?` · 떠나는 장수: ${esc(d.map(u=>u.name).join('·'))}`:'';})()}</small></button>`).join('')}</div>
  <p class="muted">한 번 고른 길은 되돌릴 수 없다. 가상으로 들어선 길은 끝까지 가상으로 이어지고, 하편의 길이 결말을 정한다.</p>
  <div class="run-actions"><button id="run-menu">← 천명의 원정 (원정은 저장됨)</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(b=>b.onclick=()=>{if(chooseFate(run,b.dataset.route!)){saveRun(run);showRun(host,run);}});
  document.getElementById('run-menu')!.onclick=()=>showQuests(host);
}

/** 가상 전장: 출진 전에 그 세계의 이야기를 한 장 보여 준다. */
function showTale(host:RunHost,run:Run,taleId:string){
  const t=taleById(taleId);if(!t)return;
  host.modal(`<div class="briefing run-screen fate-screen"><div class="eyebrow">가상 전장 · ${esc(regionFor(run,run.floor).name)} · ${run.floor}층</div><h2>${esc(t.title)}</h2>
  <blockquote>${esc(t.intro)}</blockquote><p class="muted">승리 조건: 적장 ${esc(t.target.name)} 격퇴 · 쓰러진 부대는 원정에서 사라진다.</p>
  <div class="run-actions"><button id="tale-go" class="primary">출진</button><button id="tale-back">← 갈림길</button></div></div>`,false);
  document.getElementById('tale-go')!.onclick=()=>launch(host,run,'tale',taleId);
  document.getElementById('tale-back')!.onclick=()=>showRun(host,run);
}

function launch(host:RunHost,run:Run,kind:'battle'|'elite'|'boss'|'tale',tale?:string){
  const hero=run.party.find(u=>u.hero)!;
  const p=deploymentPerks(loadMeta(),run.party.map(u=>({name:u.hero?'사마의':u.name,unitClass:u.unitClass})));
  const deployment:Deployment={levels:{sima_yi:Math.min(40,hero.level),sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:battleRef(run,kind,tale),trial:1,...(p?{perks:p}:{})};
  run.active=kind;if(tale)run.activeTale=tale;else delete run.activeTale;saveRun(run);host.startBattle(deployment,(run.seed+run.floor*97)%2147483647);
}

/** 연의 전장의 장수 레벨: 연의를 그 장까지 따라온 사람의 레벨, 사마의는 원정 레벨이 더 높으면 그것. */
export function storyDeployment(run:Run,stage:string):{chapter:number;deployment:Deployment}{
  const chapter=chapters.findIndex(c=>c.stage.id===stage);
  const c=freshCampaign();
  for(const i of campaignOrder){const s=chapters[i]!.stage;if(s.id===stage)break;award(c,s.id,'normal',s.deployment.forced,[1]);}
  const d=campaignDeployment(c,true),hero=run.party.find(u=>u.hero)!;
  d.equipped={};delete d.loadouts;
  d.levels.sima_yi=Math.min(40,Math.max(d.levels.sima_yi??1,hero.level));
  d.runStory={seed:run.seed,floor:run.floor,stage,heroLevel:hero.level,heroHp:hero.hp,relics:[...run.relics],heroXp:hero.xp};
  {const p=deploymentPerks(loadMeta(),['사마의']);if(p)d.perks=p;}d.trial=1;
  // 본편 연의와 같은 넓은 전장으로 싸운다(예전 좁은 전장은 S1-09·S1-02 일반 클리어율이 63~81%로 낮았다 · 넓은 전장 98~100%).
  d.wide=2;
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
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}/${RUN_FLOORS}층 · ${esc(regionFor(run,run.floor).name)}</div>
  <h2>전투가 아직 끝나지 않았다</h2><p>${same?'열려 있는 전장으로 돌아가 승부를 마저 낸다.':'진행하던 전장 기록이 다른 전투로 바뀌었다. 같은 전장을 처음부터 다시 치른다(지형·적 배치는 같다).'} 전투를 마치기 전에는 다른 갈림길을 고를 수 없다.</p>
  ${partyPanel(run)}<div class="run-actions"><button id="run-resume" class="primary">${same?'전장으로 돌아가기':'같은 전장 다시 시작'}</button><button id="run-menu">← 본영</button></div></div>`,false);
  document.getElementById('run-resume')!.onclick=()=>same?host.backToBattle():kind==='story'?launchStory(host,run,run.activeStage!):launch(host,run,kind as 'battle'|'elite'|'boss'|'tale',run.activeTale);
  document.getElementById('run-menu')!.onclick=()=>showQuests(host);
}

function choose(host:RunHost,run:Run,node:RunNode){
  if(node.kind==='battle'||node.kind==='elite'||node.kind==='boss')return launch(host,run,node.kind);
  if(node.kind==='story'&&node.stage)return launchStory(host,run,node.stage);
  if(node.kind==='fate')return showFate(host,run);
  if(node.kind==='tale'&&node.tale)return showTale(host,run,node.tale);
  visitNode(run,node);saveRun(run);showRun(host,run);
}

function showReward(host:RunHost,run:Run){
  const offer=run.offer??[];
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${run.floor}층</div><h2>전투 보상</h2><p class="screen-lede">셋 중 하나를 받는다.</p>${news(run)}${partyPanel(run)}
  <div class="run-choices">${offer.map((o,i)=>{const d=describeReward(o);return `<button data-reward="${i}"><strong>${esc(d.title)}</strong><small>${esc(d.detail)}</small></button>`;}).join('')}</div>
  <div class="run-actions"><button id="run-skip">건너뛰기</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-reward]').forEach(b=>b.onclick=()=>{takeReward(run,Number(b.dataset.reward));saveRun(run);showRun(host,run);});
  document.getElementById('run-skip')!.onclick=()=>{skipReward(run);saveRun(run);showRun(host,run);};
}

function showEnd(host:RunHost,run:Run){
  // 완주: 결말 컷신(결말 장면 → 종막)을 먼저 본다. 컷신은 한 번만(끝나면 원정 기록을 비운다).
  if(run.status==='won'&&!run.endingShown){run.endingShown=true;saveRun(run);
    host.modal('<div class="ss-host finale-host"></div>',false);const root=document.querySelector<HTMLElement>('.finale-host');
    const e=endingFor(run.route),seenNow=loadMeta().endings.length+(loadMeta().endings.includes(e.id)?0:1);
    const people=[{label:'끝까지 함께한 부대',names:run.party.map(u=>u.name)},{label:'먼저 쓰러진 사람들',names:run.fallen}];
    if(root){void playEndingCutscene(root,finaleData(e,{route:run.route??{},people,seen:{count:seenNow,total:ALL_ENDINGS.length}}),{id:e.id,heading:`천명의 원정 · ${e.title}`}).then(()=>showEnd(host,run));return;}
  }
  const meta=loadMeta(),gain=settleRun(meta,run);saveMeta(meta);
  const won=run.status==='won',reached=won?RUN_FLOORS:run.floor;
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">천명의 원정 · ${won?'완주':'원정 종료'}</div><h2>${won?'천명을 거머쥐다':'원정이 끝났다'}</h2>${news(run)}
  ${won?(()=>{const e=endingFor(run.route);return `<div class="ending-card ${e.history?'history':'what-if'}"><div class="eyebrow">결말 · ${e.history?'정사':'가상'}</div><h3>${esc(e.title)}</h3>${e.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</div>`;})():''}
  <p>${won?'세 편의 우두머리를 모두 꺾었다.':`${reached}층(${esc(regionFor(run,reached).arc)})에서 멈췄다.`} 최고 기록 ${meta.best}층 · 본 결말 ${meta.endings.length}/${ALL_ENDINGS.length}.</p>
  <div class="hub-stats"><span><b>+${gain||mandateEarned(run)}</b><small>얻은 천명</small></span><span><b>${meta.mandate}</b><small>쓸 수 있는 천명</small></span><span><b>${(run.storyDone?.length??0)+(run.talesDone?.length??0)}</b><small>이긴 연의·가상 전장</small></span><span><b>${run.bosses??0}</b><small>꺾은 우두머리</small></span></div>
  ${run.party.length?`<h3>끝까지 남은 부대</h3>${partyPanel(run)}`:''}
  ${run.fallen.length?`<h3>쓰러진 부대</h3><p class="muted">${run.fallen.map(esc).join(' · ')}</p>`:''}
  <div class="run-actions"><button id="run-new" class="primary">새 원정</button><button id="run-shop">천명 해금</button><button id="run-menu">← 본영</button></div></div>`,false);
  clearRun();
  document.getElementById('run-new')!.onclick=()=>showStart(host);
  document.getElementById('run-shop')!.onclick=()=>showShop(host);
  document.getElementById('run-menu')!.onclick=()=>showQuests(host);
}

/** 원정 전투가 끝났을 때 main.ts가 부른다. */
export function finishRunBattle(host:RunHost,state:BattleState,deployment:Deployment,earned:Record<string,number>={}){
  const ref=deployment.run!,run=loadRun();
  if(!run||run.floor!==ref.floor||run.status!=='map'||!run.active||run.active==='story'){host.toast('이 전투의 원정 기록을 찾을 수 없습니다.');return host.showMenu();}
  finishBattle(run,{kind:ref.kind,label:'',detail:'',...(ref.tale?{tale:ref.tale}:{})},state.outcome==='victory',survivorsOf(state,ref),earned,ref.party.map(u=>u.id));
  saveRun(run);showRun(host,run);
}

/** 연의 전장이 끝났을 때 main.ts가 부른다. 이기면 천명 기록에 바로 남긴다. */
export function finishRunStory(host:RunHost,state:BattleState,deployment:Deployment,earned:Record<string,number>={}){
  const ref=deployment.runStory!,run=loadRun();
  if(!run||run.floor!==ref.floor||run.status!=='map'||run.active!=='story'||run.activeStage!==ref.stage){host.toast('이 연의 전장의 원정 기록을 찾을 수 없습니다.');return host.showMenu();}
  const hero=state.find('sima_yi'),victory=state.outcome==='victory';
  finishStory(run,ref.stage,victory,hero?.alive?hero.hp/Math.max(1,hero.stats.maxHp):0,stageTitle(ref.stage),earned.sima_yi??0);
  if(victory){const meta=loadMeta();recordStory(meta,ref.stage);saveMeta(meta);}
  saveRun(run);showRun(host,run);
}
