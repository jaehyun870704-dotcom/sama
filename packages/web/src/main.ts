import {expeditions,expeditionReward,canExpedition,storyWins} from './expeditions.ts';
import {campMarkup} from './camp.ts';
import {officerFeatures,talentTree,strategyHint,martialPower} from './officers.ts';
import {actionNames,duelActionNames,duelLine,type DuelAction} from './duel.ts';
import {spriteAtlas} from './sprite-atlas.ts';
import {encounterLevels,structureKind} from './campaign-rules.ts';
import {readCampaign,writeCampaign,deployment,levelInfo,award,equip,equipSlot,treasureInfo,type GearSlot,treasures,OFFICERS} from './progression.ts';
import {storyBeats,storyLocations,storyBackdrop,acts,stories} from './story.ts';
import './style.css';
import catalogue from './campaign.json';
import { Session, chapters, campaignOrder, type Preparation } from './session.ts';
import { Battlefield, classNames, terrainNames, unitName } from './battlefield.ts';
import { Soundscape } from './audio.ts';
import { CONTROLLABLE, awardedSeals, estimatePhysical, estimateStrategy, manhattan } from '../../core/src/index.ts';
import type { Command, Coord, LogEntry, Unit } from '../../core/src/index.ts';

const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const SAVE_KEY='sama-battle-v2',PROGRESS_KEY='sama-seals-v2';
const sound=new Soundscape(), field=new Battlefield();
let session=new Session(),selected='sima_yi',mode='move',threat=false,speed=1,menuOpen=true,aiTimer:ReturnType<typeof setTimeout>|undefined,lastLog=0,resultShown=false;
let saveAvailable=false,hasStarted=false;
try{saveAvailable=!!localStorage.getItem(SAVE_KEY);}catch{/* Private browsing may disable storage. */}
const sideNames={player:'아군',ally:'편입 아군',enemy:'적군',allyAi:'우군'};

$('#app').innerHTML=`<header class="topbar"><button id="brand" class="brand" aria-label="연의 지도"><span class="seal-logo">司</span><span>사마의전<small>SIMA YI CHRONICLE</small></span></button><div class="chapter-breadcrumb">상편 <span>/</span> 살아남는 자</div><nav><button id="sound-toggle" title="전체 소리 켜기/끄기">♪ <span>소리 켜짐</span></button><button id="help">도움말 <kbd>?</kbd></button><button id="settings" aria-label="설정">⚙</button><button id="menu">연의 지도</button></nav></header>
<main class="layout"><aside class="left-panel"><div class="eyebrow">CHAPTER Ⅰ <span>상편</span></div><h1 id="stage-title"></h1><p id="stage-subtitle" class="muted"></p><div class="rule"></div><section class="mission"><div class="section-label">전투 목표 <span>OBJECTIVES</span></div><div id="objectives"></div></section><section class="turn-card"><div class="turn-number"><span>TURN</span><strong id="turn">01</strong><span>/ 60</span></div><div id="phase" class="phase"></div><div class="phase-track"><i></i><i></i><i></i><i></i></div></section><section><div class="section-label">현재 차례 부대 <span id="unit-count"></span></div><div id="roster" class="roster"></div></section><p class="roster-note">청록 · 아군 &nbsp; 파랑 · 편입 아군<br>황금 · 자동 우군 &nbsp; 붉은색 · 적군</p><div class="left-bottom"><span class="small-seal">忍</span><p>칼을 거두고,<br>때를 기다린다.</p></div></aside>
<section class="battle-panel"><div class="battle-heading"><div><span class="eyebrow" id="year"></span><h2 id="map-name"></h2></div><span class="weather">☀ &nbsp; 맑음 <span>·</span> 바람 약함</span></div><p id="compact-objective"></p><div id="map" class="map"><div class="map-vignette"></div><div class="compass"><span>北</span><b>✧</b></div><div class="map-controls"><button id="zoom-out" aria-label="축소">−</button><button id="zoom-reset" aria-label="지도 전체 보기">⌖</button><button id="zoom-in" aria-label="확대">＋</button></div><div class="map-legend"><i class="dot teal"></i> 이동 가능 <i class="dot red"></i> 적 시야 / 사거리 <i class="dot gold"></i> 목표</div><div id="tile-info">장수를 선택해 첫 수를 두세요.</div><div id="phase-banner" aria-live="polite"></div></div><div class="battle-toolbar"><button id="undo">↶ <span>무르기</span> <kbd>Z</kbd></button><button id="threat" aria-pressed="false">◎ <span>위험 범위</span></button><button id="speed">▷ <span>1× 속도</span></button><span id="save-status" role="status">자동 저장 준비</span><button id="end-phase" class="primary">아군 턴 종료 <span>→</span></button></div><div class="dispatch"><span>軍報</span><p id="latest-log" aria-live="polite">전장을 살피고 명령을 내려 주십시오.</p><button id="log-button">전투 기록 ↗</button></div></section>
<aside class="right-panel"><div class="section-label">장수 정보 <span>OFFICER</span></div><div id="unit-detail"></div><div class="section-label command-label">전술 명령 <span>COMMAND</span></div><div id="commands" class="commands"></div><p id="command-hint" class="command-hint"></p><div class="tactic-note"><span>策</span><div><strong>전장을 읽는 법</strong><p id="tactical-tip"></p></div></div></aside></main><footer><span>삼국지 · 사마의전</span><span>상편 · 대표 전장 ${chapters.length}개</span><span>선택 → 이동 → 행동 → 턴 종료</span></footer>
<dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status"></div>`;

function toast(text:string){$('#toast').textContent=text;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
function modal(html:string,closable=true){
  const d=$<HTMLDialogElement>('#modal');$('#modal-content').innerHTML=(closable?'<button class="modal-close" data-close aria-label="닫기">×</button>':'')+html;
  if(!d.open)d.showModal();d.scrollTop=0;$('#modal-content [data-close]')?.addEventListener('click',closeModal);
  d.oncancel=e=>{if(!closable)e.preventDefault();else setTimeout(()=>pump(),0);};
}
function closeModal(){$<HTMLDialogElement>('#modal').close();pump();}
function progress():Record<string,number[]>{try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)??'{}') as Record<string,number[]>;}catch{return {};}}
function cleared(chapter:number){return !!progress()[`${chapters[chapter]!.stage.id}:normal`]?.includes(1);}
function unlocked(chapter:number){const i=campaignOrder.indexOf(chapter);return cleared(chapter)||i===0||cleared(campaignOrder[i-1]!);}
let campaign=readCampaign();
// Old clear seals become one-time campaign rewards; old battles still replay their old rules.
for(const chapter of campaignOrder)for(const difficulty of ['normal','extreme'] as const){const id=chapters[chapter]!.stage.id;if(progress()[id+':'+difficulty]?.includes(1))award(campaign,id,difficulty,chapters[chapter]!.stage.deployment.forced,[1]);}
try{writeCampaign(campaign);}catch{/* Session remains playable without persistent storage. */}
const officerNames:Record<string,string>={sima_yi:'사마의',sima_lang:'사마랑',sima_fang:'사마방',cao_zhen:'조진'};
function growthText(){const l=levelInfo(campaign.xp.sima_yi??0);return '사마의 Lv.'+l.level+' · 경험치 '+l.xp+'/'+l.next;}
function saveCampaign(){try{writeCampaign(campaign);return true;}catch{toast('성장 기록을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');return false;}}
function storyScene(chapter:number,beat=0,fromArt?:number){
  menuOpen=true;clearTimeout(aiTimer);sound.scene=chapter===4?'dream':'camp';void sound.start().then(updateSound);
  const c=chapters[chapter]!,beats=storyBeats[c.stage.id]!,b=beats[beat]!;
  const location=storyLocations[c.stage.id]![beat]!;
  const previous=fromArt===undefined?undefined:{art:fromArt};
  const backdrop=(index:number,extra='')=>`<div class="story-backdrop ${extra}" style="${storyBackdrop(index)}"></div>`;
  const companion=location.actor??(b.actor===4?(chapter===1||chapter===5||chapter===6?3:0):b.actor);
  modal(`<div class="story-scene scene-${chapter}"><div class="eyebrow">${c.year} · 이야기 ${beat+1}/${beats.length}</div><h2>${stories[chapter]![0]}</h2>
  <div class="story-stage pose-${b.pose}" aria-label="${location.name} · 2D 장수 이야기 장면">
    ${previous?backdrop(previous.art,'outgoing'):''}${backdrop(location.art,'incoming')}
    <div class="story-light"></div><span class="story-location">${location.name}</span>
    <div class="story-actor hero ${b.actor===4?'speaking':''}" style="--row:80%" role="img" aria-label="${chapter===2?'소년 사마의':'사마의'}"></div>
    <div class="story-actor companion ${b.actor!==4?'speaking':''}" style="--row:${companion*20}%" role="img" aria-label="${location.companion}"></div>
  </div><div class="story-caption" aria-live="polite"><strong>${b.speaker}</strong><p>${b.line}</p></div>
  <div class="modal-actions"><button id="story-back" ${beat===0?'disabled':''}>← 이전 장면</button><button id="story-skip">군의로 건너뛰기</button><button class="primary" id="story-next">${beat===beats.length-1?'출진 준비':'다음 이야기'} →</button></div></div>`,false);
  $('#story-back').onclick=()=>{if(beat>0)storyScene(chapter,beat-1,location.art);};
  $('#story-skip').onclick=()=>briefing(chapter);$('#story-next').onclick=()=>beat+1<beats.length?storyScene(chapter,beat+1,location.art):briefing(chapter);
}
let menuArc=1;
function showMenu(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='camp';sound.combat=false;
  const p=progress(),names=['살아남는 자','맞서는 자','거머쥐는 자'];
  modal(`<div class="campaign"><div class="campaign-art"><img src="/sima-portrait-v2.png" alt="부채를 든 사마의 창작 초상"><div class="art-caption">司 馬 懿 <span>인내 끝에, 천하를 읽다</span></div></div><div class="campaign-copy"><div class="eyebrow">三國志 · TACTICAL CHRONICLE</div><p class="chapter-pretitle">한 사람의 생애, 서른두 번의 선택</p><h2>사마의전</h2><p class="tagline">칼을 거두고, 때를 기다린다.</p><p class="growth-summary">${growthText()} · 보물 ${campaign.treasures.length}/${treasures.length}</p><div class="arc-tabs" role="tablist" aria-label="연의 편 선택">${['상편','중편','하편'].map((n,i)=>`<button role="tab" aria-selected="${menuArc===i+1}" data-arc="${i+1}">${n}<small>${[11,14,7][i]} 전장</small></button>`).join('')}</div><div class="section-label">${names[menuArc-1]} <span>${menuArc===1?`대표 전장 ${chapters.length}개 플레이 가능`:'제작 예정'}</span></div><div class="campaign-path">${catalogue.filter(c=>c.id.startsWith(`S${menuArc}-`)).map(c=>{
    const i=chapters.findIndex(x=>x.stage.id===c.id),ready=i>=0,open=ready&&unlocked(i),won=ready&&cleared(i);
    const act=acts.find(a=>a.arc===menuArc&&a.from===Number(c.id.slice(-2)));
    return `${act?'<h3 class="act-title">'+act.title+'</h3>':''}<button class="journey-node ${won?'cleared':''}" data-chapter="${i}" ${open?'':'disabled'}><span class="chapter-no">${c.id.slice(-2)}</span><span><strong>${c.name}</strong><small>${ready?won?'완료 · 일반 / 극한 재도전':open?'출진 가능 · 권장 Lv.'+encounterLevels[c.id]+' · '+chapters[i]!.label:'앞선 대표 전장 완료 후 개방':'제작 예정'}</small></span><b>${won?'◆':open?'→':'·'}</b></button>`;
  }).join('')}</div><div class="menu-actions">${saveAvailable?'<button id="resume" class="primary">전투 이어하기 →</button>':''}${hasStarted?'<button id="back-battle">현재 전장</button>':''}<button id="art-preview">새 그래픽 · 한중 바로 체험</button><button id="expeditions">수련 · 보물 인연</button><button id="chronicle">연의 기록</button></div><p class="prototype-note">현재 수비전 → 낙양 → 육혼산 → 흉몽 → 장강 → 동관 → 한중 上 → 한중 下 순서로 대표 전장을 체험합니다.<br>사이의 미제작 전장은 건너뜁니다. 기록은 이 브라우저에 저장됩니다.</p></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>b.onclick=()=>storyScene(Number(b.dataset.chapter)));
  document.querySelectorAll<HTMLButtonElement>('[data-arc]').forEach(b=>b.onclick=()=>{menuArc=Number(b.dataset.arc);showMenu();});
  $('#expeditions').onclick=showExpeditions;
  $('#art-preview').onclick=()=>{session=new Session(1,'normal',215,'survival',4,deployment(campaign,true));activate();};
  $('#chronicle').onclick=()=>{modal(`<div class="briefing"><div class="eyebrow">연의 기록</div><h2>지나온 전장</h2>${campaignOrder.map(i=>`<p>${chapters[i]!.stage.subtitle} · ${cleared(i)?'일반 완료':'미완료'} · 인장 ${(p[chapters[i]!.stage.id+':normal']??[]).length}/3</p>`).join('')}<p>동료는 이야기에 따라 합류합니다. 패배해도 다음 출진의 기본 보급은 줄어들지 않습니다.</p><button id="record-back">← 연의 지도</button></div>`,false);$('#record-back').onclick=showMenu;};
  $('#resume')?.addEventListener('click',()=>{try{session=Session.load(JSON.parse(localStorage.getItem(SAVE_KEY)??'null'));activate();toast('저장한 전투를 불러왔습니다.');}catch{toast('현재 버전의 저장 기록을 읽지 못했습니다.');}});
  $('#back-battle')?.addEventListener('click',()=>{menuOpen=false;closeModal();});
}

function briefing(chapter:number,expeditionId?:string){
  const expedition=expeditions.find(m=>m.id===expeditionId);
  if(expedition?!canExpedition(campaign,expedition.id):!unlocked(chapter))return;
  const c=expedition?{...chapters[7]!,year:'외전 · 권장 Lv.'+expedition.level,stage:{...chapters[7]!.stage,subtitle:expedition.name}}:chapters[chapter]!,intro=chapter===2,escape=chapter===0;
  const dispatch=(preview=false)=>{const d=deployment(campaign,true);if(expedition)d.mission={id:expedition.id,runId:preview?'preview':crypto.randomUUID()};return d;};
  const mission=chapter===7?'사마의와 조진을 생존시키고 양앙을 포함한 전초 수비대 7부대를 모두 격퇴하십시오. 수비대장만 쓰러뜨려서는 끝나지 않습니다.':chapter===6?'조조를 보호하며 마초를 격퇴한 뒤, 사마의 또는 조진으로 관문 안 금빛 구역을 점령하십시오. 조조·사마의·조진 퇴각 시 패배합니다.':chapter===5?'수송대 두 부대 중 최소 한 부대를 선택한 동쪽 출구로 호위하십시오. 두 수송대가 모두 소실되거나 사마의·조진이 퇴각하면 실패합니다.':chapter===4?'진궁·여포·주유를 차례로 격파한 다음, 전차의 방해를 뚫고 황제 옆 금빛 칸에 도달하십시오.':chapter===3?'길잡이와 대화해 탈출로를 정하고, 추격 압박이 한계에 닿기 전에 형제 모두 선택한 출구에 도착하십시오.':intro?'사마의로 창고에 도달한 뒤 민중에게 인접해 무장시키고 습격대를 격퇴하십시오.':escape?'두 형제 모두 남문에 도착하고 통행료 1,000전을 지불하십시오.':'수비대장을 격퇴한 뒤 본대로 중앙 성채를 점령하십시오. 경쟁 우군 선점 시 패배합니다.';
  const rule=chapter===7?'26×20 산길 전장. 굽은 큰길은 기병이, 숲길은 보병이 접근하기 좋습니다. 본대 2명 뒤 편입 아군 4부대를 직접 지휘합니다. 노병은 2~3칸에서 사격하고 풍수사는 3칸 안의 아군을 치유합니다. 일반 18턴 / 극한 16턴 안에 완료하면 신속 인장을 얻습니다.':chapter===6?'28×20 관문 전장. 허저를 전방 또는 후방에 배치합니다. 3턴 적 차례에 서쪽 복병 2기가 출현합니다. 성문 HP 95, 감시탑 HP 110 / 사거리 1~5. 포차로 문을 열고 풍수사의 치유로 호위 병력을 유지하십시오. 마초 격퇴 시 감시탑이 철수하고 관문 수비대가 2턴 혼란에 빠집니다.':chapter===5?'24×18 강변 전장. 수송대는 우군 차례에 최대 3칸 자동 이동하며 공격하지 않습니다. 교량길은 짧지만 사격대가 지키고, 남쪽 길은 길지만 전방을 우회합니다. 3턴 적 차례에 후방 기병 2부대가 나타납니다. 노병과 방패병으로 길을 열고 후방을 지키십시오.':chapter===4?'대결을 넘길 때 체력·책략·상태이상을 회복하고 시작 지점으로 돌아옵니다. 구급약은 보충되지 않습니다. 마지막 구간은 전멸전이 아닙니다. 무르기와 목표 전환 직전 복원이 가능합니다.':chapter===3?'일반 압박 한계 12, 극한 9. 매 턴 압박이 1씩 오릅니다. 거짓 군령 강행은 압박 +2와 궁병 매복을 부릅니다. 3턴 적 차례에 추격 기병 2부대가 서쪽에서 등장합니다.':intro?'소년 사마의와 민중은 공격할 수 없습니다. 사마의가 창고를 열면 인접한 민중이 보병으로 전환됩니다. 사마방·형제의 생존이 필수이며, 민중 전멸도 패배입니다.':escape?'지참금 3,000전. 첫 매수 1,000전, 이후 1,500전. 살피기는 행동 1회를 소비해 순찰 경로를 공개합니다.':'48×36 전장. 성문 각 칸 HP 95 · 감시탑 HP 110 / 사거리 1~5. 문을 파괴하면 통로가 열립니다. 중앙 석교와 남쪽 목교로 진격하며, 미니맵 클릭으로 먼 지점을 확인합니다. 본대 다음 편입 아군 8기를 직접 지휘합니다. 편입 아군도 손실에 포함됩니다. 경쟁 우군은 지시를 받지 않습니다.';
  let officer=c.stage.deployment.forced[0]!,filter='all',inspect=campaign.treasures[0]??treasures[0]!.id,prep:Preparation='survival',difficulty:'normal'|'extreme'='normal';
  const draw=()=>{
    const previousScroll=$('#modal-content .camp-screen')?$<HTMLDialogElement>('#modal').scrollTop:0;
    const preview=new Session(chapter,difficulty,215,prep,4,dispatch(true));
    const units=preview.state.living().filter(u=>u.side==='player'||u.side==='ally');
    modal(`<div class="briefing camp-screen"><div class="eyebrow">${c.year} · 출진 전 정비</div><h2>${c.stage.subtitle}</h2><p class="camp-mission">${expedition?'사마의와 조진을 지키며 수비대를 격파하십시오. 패배해도 성장 기록은 유지됩니다.':mission}</p>${campMarkup(campaign,units,officer,filter,inspect,portraitFor)}<details><summary>작전·지형 정보</summary><p>${expedition?'12×10 소규모 전장 · 적 전멸 시 승리. 수련은 반복 경험치, 보물 외전은 첫 승리 보물과 경험치를 지급합니다.':rule}</p></details><div class="preparations">${[['survival','생존','체력 +25'],['strategy','책략','MP +18'],['command','지휘','이동 +1']].map(([id,name,desc])=>`<label><input type="radio" name="preparation" value="${id}" ${prep===id?'checked':''}>${name} · ${desc}</label>`).join('')}</div><div class="difficulty"><label><input type="radio" name="difficulty" value="normal" ${difficulty==='normal'?'checked':''}> 일반</label><label><input type="radio" name="difficulty" value="extreme" ${difficulty==='extreme'?'checked':''} ${!expedition&&cleared(chapter)?'':'disabled'}> 극한 · 일반 완료 후</label></div><div class="modal-actions"><button id="brief-back">← 연의 지도</button><span>구급약 2 · ${growthText()}</span><button id="deploy" class="primary">출진한다 →</button></div></div>`,false);
    document.querySelectorAll<HTMLButtonElement>('[data-officer]').forEach(b=>b.onclick=()=>{officer=b.dataset.officer!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-gear-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.gearFilter!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-treasure]').forEach(b=>b.onclick=()=>{inspect=b.dataset.treasure!;draw();});
    $('#equip-treasure')?.addEventListener('click',()=>{if(equipSlot(campaign,officer,treasureInfo(inspect).slot,inspect)){saveCampaign();draw();}});
    document.querySelectorAll<HTMLButtonElement>('[data-unequip]').forEach(b=>b.onclick=()=>{if(equipSlot(campaign,officer,b.dataset.unequip as GearSlot,'')){saveCampaign();draw();}});
    document.querySelectorAll<HTMLInputElement>('[name=preparation]').forEach(el=>el.onchange=()=>{prep=el.value as Preparation;draw();});
    document.querySelectorAll<HTMLInputElement>('[name=difficulty]').forEach(el=>el.onchange=()=>{difficulty=el.value as 'normal'|'extreme';draw();});
    $('#brief-back').onclick=showMenu;
    $('#deploy').onclick=()=>{session=new Session(chapter,difficulty,expedition?Date.now()%100000:215,prep,4,dispatch());activate();persist();};
    $<HTMLDialogElement>('#modal').scrollTop=previousScroll;
  };draw();
}

let duelPresented=false;
function showExpeditions(){
 menuOpen=true;clearTimeout(aiTimer);
 modal(`<div class="briefing expedition-hub"><div class="eyebrow">연무장 · 보물 인연</div><h2>다음 승리를 준비하다</h2><p>${growthText()} · 수련 ${campaign.trainingWins??0}승 · 보물 외전 ${campaign.quests?.length??0}/11</p><p>수련은 반복 경험치를 줍니다. 자신의 레벨보다 쉬운 수련은 경험치 20으로 줄어듭니다. 보물 외전의 경험치와 보물은 첫 승리 보상입니다.</p>${['training','quest'].map(kind=>`<h3>${kind==='training'?'반복 수련':'보물 인연 · 첫 승리마다 보물 4종'}</h3><div class="expedition-grid">${expeditions.filter(m=>m.kind===kind).map(m=>`<button data-expedition="${m.id}" ${canExpedition(campaign,m.id)?'':'disabled'}><strong>${m.name}</strong><small>권장 Lv.${m.level} · ${kind==='training'?'반복 가능':(campaign.quests??[]).includes(m.id)?'인연 완료':'보물 4종'}<br>${canExpedition(campaign,m.id)?'도전 가능':'본편 '+m.requires+'승 필요 ('+storyWins(campaign)+'/'+m.requires+')'}</small></button>`).join('')}</div>`).join('')}<button id="expedition-back">← 연의 지도</button></div>`,false);
 document.querySelectorAll<HTMLButtonElement>('[data-expedition]').forEach(el=>el.onclick=()=>expeditionStory(el.dataset.expedition!));$('#expedition-back').onclick=showMenu;
}
function expeditionStory(id:string,beat=0){const m=expeditions.find(x=>x.id===id);if(!m||!canExpedition(campaign,id))return;
 modal(`<div class="story-scene"><div class="eyebrow">${m.kind==='training'?'반복 수련':'보물 인연'} · ${beat+1}/2</div><h2>${m.name}</h2><div class="story-stage"><div class="story-backdrop incoming" style="${storyBackdrop(beat===0?m.art:m.kind==='training'?6:17)}"></div><div class="story-actor hero speaking" style="--row:80%"></div><div class="story-actor companion" style="--row:0%"></div></div><div class="story-caption"><p>${m.lines[beat]}</p></div><div class="modal-actions"><button id="expedition-cancel">의뢰 목록</button><button id="expedition-next" class="primary">${beat===0?'다음 이야기':'출진 정비'} →</button></div></div>`,false);
 $('#expedition-cancel').onclick=showExpeditions;$('#expedition-next').onclick=()=>beat===0?expeditionStory(id,1):briefing(7,id);
}
function showExpeditionResult(){if(resultShown)return;resultShown=true;const run=session.deployment!.mission!,m=expeditions.find(x=>x.id===run.id)!,win=session.state.outcome==='victory';const oldGrowth=deployment(campaign,true).growth!;
 const reward=expeditionReward(campaign,m.id,run.runId,win);saveCampaign();const newGrowth=deployment(campaign,true).growth!;
 const unlocked=OFFICERS.flatMap(id=>talentTree(id,levelInfo(campaign.xp[id]??0).level,newGrowth).filter(t=>t.ready&&!talentTree(id,session.deployment!.levels[id]!,oldGrowth).find(x=>x.trait===t.trait)?.ready).map(t=>officerNames[id]+' · '+t.name));
 modal(`<div class="result"><div class="result-character">${win?'勝':'練'}</div><h2>${win?'성장의 한 걸음':'다시 준비할 시간'}</h2><p>${m.name} · ${session.state.turn}턴</p><p class="battle-aftermath">${win?m.lines[2]:'패배해도 경험치와 보물은 잃지 않습니다. 정비 후 다시 도전하세요.'}</p><p>경험치 +${reward.xp} · ${growthText()}</p>${reward.items.length?`<p class="treasure-reward">보물 해금: ${reward.items.map(id=>treasures.find(t=>t.id===id)!.name).join(' · ')}</p>`:''}${unlocked.length?`<p class="treasure-reward">고유특성 해금: ${unlocked.join(' · ')}</p>`:''}<div class="modal-actions"><button id="expedition-again">${m.kind==='training'?'다시 수련':'다시 도전'}</button><button id="expedition-list">수련 · 보물 인연</button><button id="expedition-menu">연의 지도</button></div></div>`,false);
 $('#expedition-again').onclick=()=>briefing(7,m.id);$('#expedition-list').onclick=showExpeditions;$('#expedition-menu').onclick=showMenu;
}
function activate(){
  hasStarted=true;menuOpen=false;resultShown=false;duelPresented=false;mode='move';
  selected=session.state.living(session.state.currentSide).find(u=>!u.hasActed)?.id??'sima_yi';
  lastLog=session.state.log.length;field.load(session.state);const u=session.state.find(selected);if(u)field.focusUnit(u.pos);
  sound.scene='battle';sound.combat=session.chapter!==0;void sound.start().then(updateSound);
  $<HTMLDialogElement>('#modal').close();render();pump();
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(session.save()));saveAvailable=true;$('#save-status').textContent='✓ 자동 저장됨';}catch{$('#save-status').textContent='저장 공간 사용 불가';}}
function describe(e:LogEntry){const name=(id:string)=>session.state.find(id)?.name??id;switch(e.t){
  case 'turnStart':return `${e.turn}턴 · ${sideNames[e.side]}의 차례입니다.`;
  case 'move':return `${name(e.unit)} 이동 · ${terrainNames[session.state.map.tileAt(e.to).terrain]}`;
  case 'attack':case 'counter':return `${name(e.attacker)}${e.t==='counter'?' 반격':' 공격'} → ${name(e.defender)} · ${e.hit?e.damage+' 피해':'회피'}`;
  case 'strategy':return `${name(e.caster)} · ${e.strategy==='heal'?'치유':session.state.strategies.get(e.strategy)?.name??e.strategy} · ${Math.abs(e.damage.reduce((a,b)=>a+b,0))}${e.damage.some(d=>d<0)?' 회복':e.damage.every(d=>d===0)?' 지원':' 피해'}`;
  case 'retreat':return `${name(e.unit)} 퇴각`;
  case 'outcome':return e.outcome==='victory'?'작전 성공.':'작전 실패.';
  case 'choice':return '선택에 따라 전장의 흐름이 바뀝니다.';
  default:return '';
}}
function consumeLog(){const logs=session.state.log.slice(lastLog);lastLog=session.state.log.length;field.play(logs);for(const e of logs){const line=describe(e);if(line)$('#latest-log').textContent=line;if(e.t==='turnStart'){const banner=$('#phase-banner');banner.textContent=`${sideNames[e.side]}의 차례`;banner.classList.add('show');setTimeout(()=>banner.classList.remove('show'),1300);sound.sfx('turn');}}}
function portraitFor(u:Unit){
  if(u.unitClass==='ram')return '<span class="battle-model" role="img" aria-label="충차" style="background-image:var(--ram-atlas);background-size:200% 200%;background-position:0 0"></span>';
  if(u.id.startsWith('convoy_'))return `<span class="battle-model" role="img" aria-label="수송대" style="background-image:url(/convoys-v1.png);background-size:400% 200%;background-position:0 ${u.id==='convoy_b'?100:0}%"></span>`;
  const structure=structureKind(u.id);if(structure)return `<span class="battle-model" role="img" aria-label="${unitName(u)}" style="background-image:url(/scenery-v3.png);background-size:400% 200%;background-position:${structure==='gate'?66.666:100}% 0"></span>`;
  const extra=['crossbow','heavyCav','engineer','fengshui'].indexOf(u.unitClass),row=extra>=0?extra:['strategist','civilian'].includes(u.unitClass)?4:u.unitClass==='spearman'?1:u.unitClass==='archer'?2:u.unitClass==='cavalry'?3:u.unitClass==='catapult'?5:0;
  return `<span class="battle-model" role="img" aria-label="${unitName(u)}" style="background-image:var(--${extra>=0?'extra':'base'}-atlas);background-size:400% ${extra>=0?400:600}%;background-position:0 ${row/(extra>=0?3:5)*100}%"></span>`;
}
function render(){
  const s=session.state,c=session.deployment?.mission?{...chapters[session.chapter]!,stage:s.stage,year:'외전 · 수련과 인연'}:chapters[session.chapter]!;
  $('#stage-title').textContent=c.stage.title;$('#stage-subtitle').textContent=`제 ${c.stage.order}장 · ${s.difficulty==='normal'?'일반':'극한'}`;
  $('#map-name').textContent=c.stage.subtitle??c.stage.title;$('#year').textContent=`${c.year} · ${s.map.width}×${s.map.height}`;
  document.body.classList.toggle('nightmare',session.chapter===4);
  $('.weather').textContent=session.chapter===4?'☾ 흉몽 · 짙은 안개':'☀ 맑음 · 바람 약함';
  const objective=session.chapter===6?`${session.phase} · 조조 HP ${s.find('cao_cao')?.hp??0}/180 · 3턴 후방 복병`:session.chapter===5?`${session.phase} · 수송대 ${s.living('allyAi').length}/2 생존`:session.chapter===3?`${session.phase} · 추격 압박 ${session.pressure}/${session.pressureLimit}`:session.chapter===0?`${session.phase} · 지참금 ${session.funds}전`:session.chapter===1?`${session.phase} · 우군 선점 저지`:`${session.phase} · 남은 적 ${s.living('enemy').length}부대`;
  $('#compact-objective').textContent=objective;
  $('#objectives').innerHTML=`<p><b>◇</b> ${objective}</p><small>${c.stage.deployment.forced.map(id=>officerNames[id]).join(' · ')} 생존 필수</small><div class="resource-strip">구급약 ${session.medicine} · ${session.scouted?'정찰 완료':'살피기로 경로 확인'}</div>`;
  $('#turn').textContent=String(s.turn).padStart(2,'0');$('#phase').textContent=`${sideNames[s.currentSide]}의 차례`;
  document.querySelectorAll('.phase-track i').forEach((el,i)=>el.classList.toggle('active',i===s.phaseIndex));
  const roster=s.living(s.currentSide).sort((a,b)=>Number(a.hasActed)-Number(b.hasActed));$('#unit-count').textContent=`${roster.length}부대`;
  $('#roster').innerHTML=roster.map(u=>`<button data-unit="${u.id}" class="roster-unit ${u.id===selected?'selected':''} ${u.hasActed?'spent':''}"><span class="unit-symbol ${u.side}">${u.id==='sima_yi'?'司':u.id==='cao_zhen'?'曹':classNames[u.unitClass]?.slice(0,1)}</span><span><strong>${unitName(u)}</strong><small>${classNames[u.unitClass]} · Lv.${u.level}</small><i class="mini-hp"><i style="width:${u.hp/u.stats.maxHp*100}%"></i></i></span><span>${u.hasActed?'✓':'●'}</span></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(b=>b.onclick=()=>select(b.dataset.unit!));
  renderUnit(s.find(selected));
  $<HTMLButtonElement>('#end-phase').disabled=!CONTROLLABLE.has(s.currentSide)||s.outcome!=='ongoing'||field.busy||!!session.activeDuel;
  $<HTMLButtonElement>('#undo').disabled=!session.checkpoints.length||field.busy;
  $('#tactical-tip').textContent=session.revision===4&&session.chapter===4?'여포는 물리 공격이 강합니다. 무력보다 지력 차이를 활용해 설전 승리와 혼란을 노리세요. 각 대결이 끝나면 체력·MP가 회복됩니다.':session.revision===4?'일기토는 인접한 적, 설전은 3칸 이내 적을 선택합니다. 충차는 성문·감시탑에 피해 3배. 풍수사는 MP 8로 3칸 이내 아군을 치유합니다.':'목표와 승리 조건을 확인하세요. 본대 다음 편입 아군을 직접 지휘합니다.';
  sound.scene=s.outcome!=='ongoing'?'result':session.chapter===4?'dream':s.living('player').some(u=>u.hp<u.stats.maxHp*.35)?'crisis':'battle';
  consumeLog();field.render(s,selected,mode,threat,session.scouted);checkModal();
}
function renderUnit(u:Unit|undefined){
  if(!u)return;const s=session.state,can=u.alive&&!u.hasActed&&u.side===s.currentSide&&CONTROLLABLE.has(u.side)&&s.outcome==='ongoing';
  const feature=session.revision===4?officerFeatures[u.id]:undefined;const talents=session.deployment?.growth?talentTree(u.id,u.level,session.deployment.growth):[];
  $('#unit-detail').innerHTML=`<div class="portrait"><div>${portraitFor(u)}</div><span class="portrait-tag">${sideNames[u.side]}</span><div class="portrait-title"><h2>${unitName(u)}</h2><span>${classNames[u.unitClass]}</span></div></div><div class="unit-meta"><span>${classNames[u.unitClass]}</span><b>Lv.${u.level}</b></div>${[['hp','체력',u.hp,u.stats.maxHp],['mp','책략',u.mp,u.stats.maxMp]].map(([kind,name,value,max])=>`<div class="stat-bar ${kind}"><div><span>${name}</span><b>${value}<small> / ${max}</small></b></div><i><i style="width:${Number(value)/Math.max(1,Number(max))*100}%"></i></i></div>`).join('')}<div class="stats">${[['무력',martialPower(u)],['공격',u.stats.attack],['방어',u.stats.defense],['지력',u.stats.intellect],['이동',u.stats.movement]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>${feature?session.deployment?.growth&&['sima_yi','sima_lang','sima_fang','cao_zhen'].includes(u.id)?talents.map(t=>`<p class="feature-card ${t.ready?'':'locked'}"><b>${t.ready?'◆':'◇'} ${t.name}</b><br>${t.ready?t.description:t.requirement}</p>`).join(''):`<p class="feature-card"><b>${feature.name}</b><br>${feature.description}</p>`:''}${u.statuses.length?`<p>${u.statuses.map(x=>({confusion:'혼란',burn:'화상',seal:'봉인',immobile:'속박'}[x.kind as string]??x.kind)+' '+x.turns+'턴').join(' · ')}</p>`:''}`;
  const buttons=[{id:'move',name:'이동',icon:'➶',meta:'1',disabled:u.hasMoved},{id:'attack',name:'공격',icon:'⚔',meta:'2',disabled:u.unitClass==='civilian'},...u.strategies.map(id=>({id,name:s.strategies.get(id)!.name,icon:({fire:'火',windDragon:'風',bind:'縛',confuse:'惑',flood:'水',thunder:'雷',inferno:'焰'} as Record<string,string>)[id]??'策',meta:s.strategies.get(id)!.mpCost+' MP',disabled:u.mp<s.strategies.get(id)!.mpCost||s.hasStatus(u,'seal')})),{id:'wait',name:'대기',icon:'◷',meta:'W',disabled:false}];
  if(session.deployment&&u.unitClass==='fengshui')buttons.push({id:'heal',name:'치유',icon:'癒',meta:'8 MP',disabled:u.mp<8||s.hasStatus(u,'seal')});
  if(session.revision===4&&!['civilian','ram','catapult'].includes(u.unitClass)&&!structureKind(u.id))buttons.push({id:'duel',name:'일기토',icon:'鬪',meta:'5합',disabled:false},{id:'debate',name:'설전',icon:'論',meta:'5합',disabled:false});
  buttons.push({id:'scout',name:'살피기',icon:'眼',meta:'행동',disabled:session.scouted},{id:'medicine',name:'구급약',icon:'藥',meta:String(session.medicine),disabled:!u.canUseItems||u.unitClass==='civilian'||!session.medicine||u.hp===u.stats.maxHp});
  const region=[...s.map.regions].find(([name,coords])=>s.victory.some(v=>v.type==='capture'&&v.target===name)&&coords.some(c=>c.x===u.pos.x&&c.y===u.pos.y));
  if(region&&u.side==='player')buttons.push({id:'capture',name:'거점 확보',icon:'⚑',meta:'',disabled:session.chapter===6&&!!s.find('ma_chao')?.alive});
  $('#commands').innerHTML=buttons.map(b=>`<button title="${strategyHint(b.id)}" data-command="${b.id}" class="${mode===b.id?'active':''}" ${!can||b.disabled||field.busy?'disabled':''}><span>${b.icon}</span>${b.name}<small>${b.meta}</small></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(b=>b.onclick=()=>{const id=b.dataset.command!;if(id==='wait')act({kind:'wait',unit:u.id});else if(id==='capture'&&region)act({kind:'capture',unit:u.id,region:region[0]});else if(['scout','medicine'].includes(id)){if(id==='scout')threat=true;act({kind:'item',unit:u.id,item:id});}else{mode=id;render();}});
  $('#command-hint').textContent=!can?'해당 부대의 차례에 조작할 수 있습니다.':mode==='move'?'푸른 칸을 선택해 이동하세요.':mode==='heal'?'3칸 이내 부상당한 아군을 선택하세요.':s.strategies.get(mode)?.targetSides.includes('player')?'사거리 안의 아군을 선택해 지원하세요.':mode==='duel'?'인접한 적을 선택하세요. 무력으로 5합을 겨룹니다.':mode==='debate'?'3칸 이내 적을 선택하세요. 지력으로 5합을 겨룹니다.':'사거리 안의 적을 선택하세요.';
}
function select(id:string){selected=id;const u=session.state.find(id);if(u)field.focusUnit(u.pos);mode=u?.hasMoved?'attack':'move';sound.sfx('select');render();}
function act(command:Command){
  if(field.busy){toast('동작이 끝나면 명령할 수 있습니다.');return;}
  if(menuOpen||$<HTMLDialogElement>('#modal').open&&command.kind!=='choose'&&!(command.kind==='item'&&command.item.startsWith('duel-round:')))return;
  const prev=session.state.currentSide,r=session.act(command);if(!r.ok){toast(r.error??'명령 실패');return;}
  if(command.kind==='item'&&['duel','debate'].includes(command.item))duelPresented=false;
  if(prev!==session.state.currentSide){const next=session.state.living(session.state.currentSide).find(u=>!u.hasActed);if(next){selected=next.id;field.focusUnit(next.pos);mode='move';}}
  if(command.kind==='move')mode=session.state.find(selected)?.strategies[0]??'attack';
  persist();render();pump();
}
function pump(){clearTimeout(aiTimer);if(menuOpen||field.busy||$<HTMLDialogElement>('#modal').open||session.state.outcome!=='ongoing'||session.activeDuel)return;aiTimer=setTimeout(()=>{const side=session.state.currentSide;if(session.tick()){if(side!==session.state.currentSide){const next=session.state.living(session.state.currentSide).find(u=>!u.hasActed);if(next){selected=next.id;mode='move';field.focusUnit(next.pos);}}persist();render();pump();}},450/speed);}
function undo(){if(field.busy)return;if(session.undo()){activate();persist();toast('직전 명령을 되돌렸습니다.');}}
function showDuel(){
  const d=session.activeDuel??session.lastDuel;if(!d)return;clearTimeout(aiTimer);const labels=duelActionNames(d.kind),energyName=d.kind==='debate'?'논거':'기합';
  const a=session.state.get(d.player.id),b=session.state.get(d.enemy.id),last=d.history.at(-1);
  modal(`<div class="duel-screen ${d.kind}"><div class="eyebrow">${d.kind==='duel'?'무력으로 겨루는 일기토':'지력으로 겨루는 설전'}</div><h2>${d.kind==='duel'?'일기토':'설전'} <small>${d.round} / 5합</small></h2><div class="duel-hud">${[d.player,d.enemy].map(u=>`<div><strong>${u.name}</strong><span>${d.kind==='duel'?'무력':'지력'} ${u.stat} · ${energyName} ${u.energy}/3</span><meter min="0" max="${u.maxHp}" value="${u.hp}"></meter><small>${u.hp} / ${u.maxHp}</small></div>`).join('')}</div><div class="duel-arena"><div class="duel-fighter player motion-${last?.action??'idle'}">${portraitFor(a)}${last?`<span class="duel-speech">${duelLine(d.kind,last.action)}</span>`:''}${last?`<b class="damage-number">−${last.taken}</b>`:''}</div><span class="duel-versus">${d.kind==='duel'?'鬪':'論'}</span><div class="duel-fighter enemy motion-${last?.enemyAction??'idle'}">${portraitFor(b)}${last?`<span class="duel-speech">${duelLine(d.kind,last.enemyAction)}</span>`:''}${last?`<b class="damage-number">−${last.dealt}</b>`:''}</div></div><p class="duel-report" aria-live="polite">${last?`${last.round}합 · ${labels[last.action]} 대 ${labels[last.enemyAction]} · 준 피해 ${last.dealt} / 받은 피해 ${last.taken}`:(d.kind==='debate'?'논박은 정신력 피해, 반론은 피해 감소와 논거 +1, 숙고는 논거 +2, 논파는 논거 2를 소비합니다.':'공격은 피해, 방어는 피해 감소와 기합 +1, 기합은 +2, 필살기는 기합 2를 소비합니다.')}</p>${d.result?`<h3>${d.result==='win'?'승리':d.result==='lose'?'패배':'무승부'}</h3><p>전투 체력: 승자 15% · 패자 45% · 무승부 양쪽 25% 피해 (최소 1 유지). 패자는 2턴 혼란. 행동 1회 소비.</p><button id="duel-return" class="primary">전장으로 돌아가기</button>`:`<div class="duel-actions">${(Object.keys(labels) as DuelAction[]).map(id=>`<button data-duel-action="${id}" ${id==='special'&&d.player.energy<2?'disabled':''}>${labels[id]}<small>${id==='attack'?'능력치 피해':id==='guard'?'피해 65% 감소':id==='rally'?energyName+' +2':'피해 ×1.8'}</small></button>`).join('')}</div>`}<details><summary>합별 기록</summary>${d.history.map(h=>`<p>${h.round}합 · ${labels[h.action]} / ${labels[h.enemyAction]} · ${h.dealt}:${h.taken}</p>`).join('')}</details></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-duel-action]').forEach(el=>el.onclick=()=>{sound.sfx(d.kind==='duel'?'attack':'magic');act({kind:'item',unit:d.player.id,item:'duel-round:'+el.dataset.duelAction});});
  $('#duel-return')?.addEventListener('click',()=>{duelPresented=true;$<HTMLDialogElement>('#modal').close();render();pump();});
}
function checkModal(){
  if(menuOpen||field.busy)return;const s=session.state;
  if(session.activeDuel||session.lastDuel&&!duelPresented){showDuel();return;}
  if(s.outcome!=='ongoing'&&session.deployment?.mission){showExpeditionResult();return;}
  if(s.outcome!=='ongoing'&&session.deployment?.mission){showExpeditionResult();return;}
  if(s.outcome!=='ongoing'){
    if(resultShown)return;resultShown=true;const win=s.outcome==='victory',seals=session.seals;
    const reward=win?award(campaign,s.stage.id,s.difficulty,[...s.units.keys()],seals):null;
    if(reward?.xp)saveCampaign();
    if(win)try{const p=progress(),k=s.stage.id+':'+s.difficulty;p[k]=[...new Set([...(p[k]??[]),...seals])];localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));}catch{/* optional persistence */}
    sound.sfx(win?'victory':'defeat');
    modal(`<div class="result"><div class="result-character">${win?'勝':'敗'}</div><h2>${win?'판을 읽었다.':'아직, 끝이 아니다.'}</h2><p>${s.stage.subtitle} · ${s.turn}턴</p>${reward?.xp?`<p class="growth-summary">경험치 +${reward.xp} · ${growthText()}</p><p class="treasure-reward">보물: ${treasures.filter(t=>t.stage===s.stage.id).map(t=>t.name).join(' · ')}</p>`:''}<div class="seals">${session.sealNames.map((name,i)=>`<div class="${seals.includes(i+1)?'earned':''}"><b>◆</b><span>${name}</span></div>`).join('')}</div><p>${win?'전투 기록과 인장이 저장되었습니다.':esc(session.failure)}</p><div class="modal-actions"><button id="result-undo">↶ 마지막 수 무르기</button>${session.phaseCheckpoint!==null?'<button id="phase-restore">목표 전환 직전으로</button>':''}<button id="retry">다시 도전</button><button id="result-menu">연의 지도</button>${win&&campaignOrder.indexOf(session.chapter)<campaignOrder.length-1?'<button id="next-chapter" class="primary">다음 전장 →</button>':''}</div></div>`,false);
    $('#result-undo').onclick=undo;$('#result-menu').onclick=showMenu;
    $('#phase-restore')?.addEventListener('click',()=>{if(session.restorePhase()){activate();persist();}});
    $('#retry').onclick=()=>{session=new Session(session.chapter,session.difficulty,215,session.preparation,session.revision,session.deployment?deployment(campaign,true):undefined);activate();persist();};
    $('#next-chapter')?.addEventListener('click',()=>storyScene(campaignOrder[campaignOrder.indexOf(session.chapter)+1]!));return;
  }
  if(s.activeDialogue){const node=session.battle.dialogue.node(s.activeDialogue);modal(`<div class="dialogue"><div class="eyebrow">전장의 갈림길</div><h2>${node.speaker?s.find(node.speaker)?.name??node.speaker:'선택의 시간'}</h2><blockquote>${esc(node.text)}</blockquote>${session.chapter===0?`<p>지참금 ${session.funds}전 · 남문 통행료 1,000전 확보</p>`:''}<div class="dialogue-options">${node.options.map((o,i)=>`<button data-choice="${o.id}"><span>0${i+1}</span>${esc(o.text)}</button>`).join('')}</div><button id="dialogue-undo">직전 선택 무르기</button></div>`,false);$('#dialogue-undo').onclick=undo;document.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(b=>b.onclick=()=>{$<HTMLDialogElement>('#modal').close();act({kind:'choose',nodeId:node.id,optionId:b.dataset.choice!});});}
}
field.onCue=kind=>sound.sfx(kind);field.onAnimationEnd=()=>{render();pump();};
field.onCell=at=>{
  if(field.busy||menuOpen)return;const s=session.state,u=s.find(selected),target=s.unitAt(at);
  if(u?.alive&&u.side===s.currentSide&&CONTROLLABLE.has(u.side)&&!u.hasActed){
    if(mode==='heal'&&target){act({kind:'item',unit:u.id,item:'heal',target:target.id});return;}
    if(target?.side==='enemy'&&(mode==='duel'||mode==='debate')){act({kind:'item',unit:u.id,item:mode,target:target.id});return;}
    if(target?.side==='enemy'&&mode==='attack'){act({kind:'attack',unit:u.id,target:target.id});return;}
    if(s.strategies.has(mode)){act({kind:'strategy',unit:u.id,strategy:mode,at});return;}
    if(!target&&mode==='move'){act({kind:'move',unit:u.id,to:at});return;}
  }if(target)select(target.id);
};
field.onHover=at=>{if(!at){$('#tile-info').textContent='휠 확대 · 드래그 이동 · 미니맵 클릭 · 전체 보기';return;}const s=session.state,u=s.find(selected),target=s.unitAt(at);let line=`${terrainNames[s.map.tileAt(at).terrain]} · (${at.x+1}, ${at.y+1}) · 회피 +${s.map.evasionBonus(at)}%`;if(target)line+=` · ${unitName(target)} ${target.hp} HP`;if(u&&target?.side==='enemy'){const d=s.strategies.get(mode);if(d&&manhattan(u.pos,at)<=d.range)line+=` · 예상 피해 ≈${estimateStrategy(u,target,d,s.map)}`;else if(mode==='attack'&&manhattan(u.pos,at)<=u.range[1])line+=` · 예상 피해 ≈${estimatePhysical(u,target,s.map)}`;}$('#tile-info').textContent=line;};
function updateSound(){$('#sound-toggle').innerHTML=`♪ <span>${sound.enabled?'소리 켜짐':'음소거'}</span>`;}
$('#sound-toggle').onclick=()=>{sound.enabled=!sound.enabled;void sound.start().then(updateSound);};
$('#menu').onclick=showMenu;$('#brand').onclick=showMenu;$('#undo').onclick=undo;
$('#end-phase').onclick=()=>act({kind:'endPhase'});
$('#zoom-in').onclick=()=>field.zoomBy(.2);$('#zoom-out').onclick=()=>field.zoomBy(-.2);$('#zoom-reset').onclick=()=>field.reset();
$('#threat').onclick=()=>{threat=!threat;$('#threat').setAttribute('aria-pressed',String(threat));render();};
$('#speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;field.playbackRate=speed;$('#speed').innerHTML=`▷ ${speed}× 속도`;};
$('#help').onclick=()=>modal('<div class="dialogue"><h2>전장의 길잡이</h2><p>부대 선택 → 이동 → 공격·책략·대기 → 턴 종료. 본대 다음 편입 아군을 직접 조작합니다.</p><p>1 이동 · 2 공격 · 3 첫 책략 · W 대기 · Z 무르기. 휠 확대, 드래그 이동, 미니맵으로 먼 지역을 살피세요.</p><p>일기토(무력)는 인접, 설전(지력)은 3칸 이내. 일기토는 공격·방어·기합·필살기, 설전은 논박·반론·숙고·논파를 선택합니다.</p></div>');
$('#settings').onclick=()=>{modal(`<div class="dialogue"><h2>소리 설정</h2><label>배경음 <input id="music-volume" type="range" min="0" max="1" step=".01" value="${sound.musicVolume}"></label><label>효과음 <input id="effects-volume" type="range" min="0" max="1" step=".01" value="${sound.effectsVolume}"></label></div>`);$<HTMLInputElement>('#music-volume').oninput=e=>{sound.musicVolume=Number((e.target as HTMLInputElement).value);sound.update();};$<HTMLInputElement>('#effects-volume').oninput=e=>{sound.effectsVolume=Number((e.target as HTMLInputElement).value);sound.update();};};
$('#log-button').onclick=()=>modal(`<div class="dialogue"><h2>전투 기록</h2>${session.state.log.map(describe).filter(Boolean).slice(-60).map(t=>`<p>${esc(t)}</p>`).join('')}</div>`);
document.addEventListener('visibilitychange',()=>void sound.visibility(document.hidden));
document.addEventListener('keydown',e=>{if($<HTMLDialogElement>('#modal').open||menuOpen||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;if(e.key.toLowerCase()==='z')undo();else if(e.key==='?')$('#help').click();else{const id=({1:'move',2:'attack',3:session.state.find(selected)?.strategies[0],w:'wait'} as Record<string,string|undefined>)[e.key.toLowerCase()];if(id)document.querySelector<HTMLButtonElement>(`[data-command="${id}"]`)?.click();}});
async function boot(){try{await Promise.all([['base','/units-v3.png',6,4],['extra','/units-extra-v1.png',4,4],['ram','/ram-v1.png',2,2]].map(async([name,url,rows,columns])=>{const atlas=await spriteAtlas(String(url),Number(rows),Number(columns));document.documentElement.style.setProperty('--'+name+'-atlas','url('+atlas.toDataURL()+')');}));await field.init($('#map'));field.load(session.state);render();showMenu();}catch(error){$('#map').innerHTML='<p class="render-error">전장 그래픽을 초기화하지 못했습니다. 새로고침해 주세요.</p>';console.error(error);}}
void boot();
