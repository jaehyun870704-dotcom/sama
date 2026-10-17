import {trialGoals,trialGoalText,trialProgress} from './expedition-objectives.ts';
import {GAME_NAME,GAME_SERIES} from './brand.ts';
import {DOCK_ICONS} from './dock-icons.ts';
import {navalAtlas} from './naval-art.ts';
import {evolutionChart,officerGallery,paintArmor,fitEvoSprites,type EvoGroup} from './troop-evolution.ts';
import {officerFaction,type OfficerFaction} from './officer-factions.ts';
import {troopAdvice,adviceFor,recommendExpeditionSupport,supportWarnings,physicalMatchup} from './troop-tactics.ts';
import {officerLooks,officerLook,officerPortrait,dialogueCaption,splitSpokenLine,customFace} from './officer-art.ts';
import {troopRoles,supportOptions,visualClass,troopArt,troopSheets,basicReactionArt,evolutionLines,classSheets,loadClassSheets} from './troops.ts';
import {growthMilestones} from './growth-milestones.ts';
import {trialStory,trialTactics,layoutName} from './expedition-scenes.ts';
import {expeditions,expeditionReward,canExpedition,storyWins,trainingXp,growthAdvice,missionRewardText,type Expedition} from './expeditions.ts';
const KIND_LABEL:Record<Expedition['kind'],string>={training:'반복 수련',quest:'보물 인연',bounty:'보물 사냥',challenge:'도전 퀘스트'};
import {campMarkup} from './camp.ts';
import {officerFeatures,talentTree,strategyHint,martialPower,debatePower,STATUS_NAMES} from './officers.ts';
import {deploymentPerks} from './officer-perks.ts';
import {watchCssAtlases} from './css-atlas.ts';
import {actionNames,duelActionNames,duelLine,temperNames,type DuelAction,type DuelKind} from './duel.ts';
import {spriteAtlas} from './sprite-atlas.ts';
import {paintedTroopArt} from './painted-troops.ts';
import {officerDebateModelStyle,officerDuelModelStyle,officerDuelMounted,officerBattleSheet,officerDuelSheetUrl,hasUnifiedSd} from './officer-models.ts';
import {MOUNTED_FAMILIES} from './armor.ts';
import {coachStep,COACH_KEY} from './tutorial.ts';
import {dueLines} from './battle-lines.ts';
import {loadSettings,saveSettings,type Speed} from './settings.ts';
import {SLOT_COUNT,slotKey,readSlot,slotLabel,readFull,snapshotKeys,restoreKeys,agoText,purgeRetired,storageUse,type FullSlot} from './save-slots.ts';
import {encounterLevels,structureKind,structureFrame,raceGap} from './campaign-rules.ts';
import {readCampaign,writeCampaign,mergeRunCampaign,xpAtLevel,deployment,levelInfo,award,equip,equipSlot,treasureInfo,gearKey,gearNames,gearName,type GearSlot,treasures,OFFICERS,addGold,chapterGold,awardZhugeTreasures,earlyLegend,gearDeployment,type Story} from './progression.ts';
import {showShop,type ShopUnit} from './shop.ts';
import {settleGear,gearNews} from './gear-battle.ts';
import {CONSUMABLES,consumable,jewelWeatherBlock,JEWEL_WEATHER} from '../../core/src/index.ts';
import {ZHUGE_ROSTER} from './zhuge-data.ts';
import {actorMarkup,playBeat} from './story-motion.ts';
import {playScenes,playNarration,choiceFlags,setStoryTitle,plainChoices} from './story-stage.ts';
import type {ChoiceEffect,Scene,Look} from './scenario-types.ts';
import type {BattleMods} from './roguelike.ts';
import {storyBeats,storyLocations,storyBackdrop,storyAftermath,acts,stories,epilogueBeats,epilogueYears} from './story.ts';
import {playEpilogue} from './epilogue.ts';
import {showHub,showQuests,showTitle,showCollections,showStoryPick,finishRunBattle,finishRunStory,RUN_CHAPTER,type RunHost} from './run-ui.ts';
import {showScenario,campOf,finishIfBattle,finishStoryBattle,noteDefeatReason,type ScenarioHost} from './scenario-ui.ts';
import {scriptOf,loadScenario,saveScenario,trainCompanions,currentStep,joinRecruits} from './scenario.ts';
import {isZhugeStage,isZhugeBranch,zhugeName} from './zhuge-data.ts';
import {zhugeMapNodes,zhugeNodeState,zhugeLockText,rewardParts,replayGold,grantBranchReward,ARC_GAP,type ZMapNode} from './zhuge-map.ts';
import {branchNode,forkOf} from './zhuge/branches.ts';
import {zhugeDeployment,zhugeLevel,zhugeBase,growZhuge,zhugeMilestones} from './zhuge.ts';
import {conditionsHtml,goalMarks,winText} from './battle-conditions.ts';
import {promotionPoints,promotionOffer,promote,PROMO_OFFICERS,PROMO_REACH} from './promotion.ts';
import {optionalOfficers,soloStage,pickExtras,storySortieLimit,storyCostSheet,storyRetinueCap,unitCost,storyClassAt,FOREIGN_COST} from './sortie.ts';
import {isoBackdrop,isoScene,loadIsoArt,loadPaintedScenes} from './story-iso.ts';
import {loadFigures} from './story-figure.ts';
import {registerCustoms} from './custom.ts';
import {loadMeta as loadMetaForCustoms,saveMeta as saveMetaForCustoms} from './meta.ts';
import {loadPortraitImages,portraitImage} from './portrait-images.ts';
import {cardFace,specFor} from './faces.ts';
import {renderHud,type CardOpts} from './unit-hud.ts';
import {inkChoice} from './ink-choice.ts';
import {duelSplash,duelArena,duelBackdrop,duelModel,preloadDuelArt,playContest,animateDuel} from './duel-ui.ts';
// 없앤 모드(천명의 길·천명의 원정·신장수 만들기)의 기록을 지운다 — 그만큼 저장 칸에 여유가 생긴다(사용자 결정 2026-10-12).
purgeRetired();
{const m=loadMetaForCustoms();if(m.customOfficers?.length){m.customOfficers=[];saveMetaForCustoms(m);}}
registerCustoms([]);
// 직접 넣은 초상 그림(저장소 public/portraits와 이 브라우저에 올린 것)을 먼저 읽어 둔다.
void loadPortraitImages('');
const scenarioYear=(id:string)=>scriptOf(id)?.year??'';
import type {ScenarioDeployment,Deployment} from './progression.ts';
import {loadMeta,saveMeta,recordStory,paySeals,simaEndings} from './meta.ts';
import {ALL_ENDINGS,endingFor,factionText} from './fate.ts';
import {playEndingCutscene,finaleData,replayData,type FinaleData} from './ending-finale.ts';
import {ROSTER,NATIONS,ROUTES,ROUTE_LABEL,ROUTE_MARK,ROUTE_NOTE,HERO,STORY_NAME,TITLES,MERIT,FAME,battleMerit,missionMerit,retroMerit,meritCost,fameCost,favorNeed,favorOf,fameOf,fameLeft,titleKey,entryOf,recruitedOf,recruitStatus,recruitProgress,condLines,readyList,buyRecruit,settleBattle,catchUpStory,contestWin,spareFoe,persuadeFoe,heroLabel,heroTitle,type Nation,type RosterEntry,type RecruitRoute,type BattleReport} from './recruit.ts';
import {FAME_NATIONS} from './recruit-roster.ts';
import {officerClass} from './officer-perks.ts';
import {RUN_FLOORS,RELICS,newRun,startingOfficers,battleRef,stageOfficerNames,type RunBattleRef} from './roguelike.ts';
import {romance,romanceOf,romanceByName,temperOf,signatureSkills} from './romance.ts';
import './style.css';
import catalogue from './campaign.json';
import { Session, chapters, campaignOrder, sealNamesOf, type Preparation ,zhugeOrder} from './session.ts';
import {sealTiers,sealRewardText,sealClaimed,claimSealTier,zhugeSealTiers,claimZhugeSealTier} from './seal-rewards.ts';
import {zhugeChoiceLog,zhugeTally,zhugeEndingId,zhugeEndingFlag,zhugeEndingNotes,zhugeAxisBeats,ZHUGE_AXIS,ZHUGE_BRANCHES,ZHUGE_ENDINGS,ZHUGE_ENDING_TEXT,ZHUGE_TEMPER_NOTE,ZHUGE_YEARS,type ZhugeBranch} from './zhuge-ending.ts';
import {arcMap,arcRoutes,branchLevel,branchFloor,branchWins,recordBranchWin,nodeStats,countSortie,FORK_ANCHOR,type MapNode} from './chronicle-map.ts';
import {supplyIcon,treasureIcon} from './treasure-art.ts';
import {revealAfterResult} from './treasure-reveal.ts';
import {ambition,ambitionOk,ambitionRule,ambitionPercent,recordStageChoices,choiceAmbition} from './ambition.ts';
import {FATE_POINTS,routeById} from './fate.ts';
import { Battlefield, classNames, terrainNames, unitName } from './battlefield.ts';
import { WEATHER_NAMES } from './stage-rules.ts';
import { Soundscape } from './audio.ts';
import {placeFor,bossNear} from './music.ts';
import { evolvedClass, decide, key as cellKey, unitEffectNotes, CONTROLLABLE, ignoresRough, awardedSeals, estimatePhysical, estimateStrategy, previewAttack, doubleAttackChance, criticalChance, manhattan, inReach, reachLabel,unitReachLabel, tierOf, familyOf, troopEffectOf, troopEffectText, classTactics, STRATEGY_TIER_NAMES } from '../../core/src/index.ts';
import type { BattleState, Command, Coord, LogEntry, TerrainKind, Unit } from '../../core/src/index.ts';
import {strategyIconUrl} from './strategy-icons.ts';
import {effectIcon,effectTone} from './effect-icons.ts';
import {과와,을를} from './josa.ts';
import {guardStorage,storageFailText,STORAGE_FAIL,type StorageFail} from './storage-guard.ts';

const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const SAVE_KEY='sama-battle-v2',PROGRESS_KEY='sama-seals-v2';
const sound=new Soundscape(), field=new Battlefield();
/** Developer shortcuts (straight into a late battle) only appear with ?dev in the address. */
const devMode=new URLSearchParams(location.search).has('dev');
/** 새 전투가 쓰는 규칙판: 5 = 조조전 병과 체계(등급 성장·지형 효율·명중/2회 공격/회심 비율). 예전 저장은 저장된 규칙판 그대로. */
const RULES=14 as const;
let session=new Session(),selected='sima_yi',mode='move',threat=false,speed=1,menuOpen=true,aiTimer:ReturnType<typeof setTimeout>|undefined,lastLog=0,resultShown=false;
let saveAvailable=false,hasStarted=false;
try{saveAvailable=!!localStorage.getItem(SAVE_KEY);}catch{/* Private browsing may disable storage. */}
const sideNames={player:'아군',ally:'편입 아군',enemy:'적군',allyAi:'우군'};
/** 화면에 보이는 장 번호: 'S1-01' 같은 내부 id 대신 '상편 1장'(사마의전 상·중·하편 · 제갈량전 상·하편). */
const stageNo=(id:string)=>{const m=/^([SZ])(\d)-(\d\d)$/.exec(id);if(!m)return id;const arc=(m[1]==='S'?['상','중','하']:['상','하'])[Number(m[2])-1]??'';return `${arc}편 ${Number(m[3])}장`;};

$('#app').innerHTML=`<header class="topbar"><button id="brand" class="brand" aria-label="본영"><span class="seal-logo">맹</span><span>${GAME_NAME}<small>${GAME_SERIES}</small></span></button><div class="chapter-breadcrumb" id="arc-crumb">상편 <span>/</span> 살아남는 자</div><nav><button id="sound-toggle" title="전체 소리 켜기/끄기">♪ <span>소리 켜짐</span></button><button id="help">도움말 <kbd>?</kbd></button><button id="settings" aria-label="설정">⚙</button><button id="topbar-save" title="저장 · 불러오기">💾 저장</button><button id="menu">본영</button></nav></header>
<main class="layout"><aside class="left-panel" id="left-panel"><button id="left-close" class="left-close" aria-label="전황 닫기">닫기 ✕</button><div class="eyebrow" id="arc-eyebrow">제1편 <span>상편</span></div><h1 id="stage-title"></h1><p id="stage-subtitle" class="muted"></p><div class="rule"></div><section class="mission"><div class="section-label">전투 목표 <span>목표</span></div><div id="objectives"></div></section><section class="turn-card"><div class="turn-number"><span>차례</span><strong id="turn">01</strong><span id="turn-limit">/ 60</span></div><div id="phase" class="phase"></div><div class="phase-track"><i></i><i></i><i></i><i></i></div></section><section><div class="section-label">현재 차례 부대 <span id="unit-count"></span></div><div id="roster" class="roster"></div></section><p class="roster-note">파랑 · 아군(편입 아군 포함)<br>초록 · NPC 우군 &nbsp; 빨강 · 적군</p><div class="left-bottom"><span class="small-seal">인</span><p>칼을 거두고,<br>때를 기다린다.</p></div></aside>
<section class="battle-panel"><div class="battle-heading"><div><span class="eyebrow" id="year"></span><h2 id="map-name"></h2></div><span class="weather">☀ &nbsp; 맑음 <span>·</span> 바람 약함</span></div><p id="compact-objective"></p><div id="map" class="map"><div class="map-vignette"></div><div id="map-objective" class="map-objective" aria-live="polite"></div><button id="left-toggle" class="left-toggle" aria-expanded="false" aria-controls="left-panel">☰ 전황</button><div class="compass"><span>북</span><b>✧</b></div><div class="map-controls"><button id="zoom-out" aria-label="축소">−</button><button id="zoom-reset" aria-label="고른 장수에게로">⌖</button><button id="zoom-in" aria-label="확대">＋</button></div><div class="map-legend"><i class="dot teal"></i> 이동 가능 <i class="dot red"></i> 적 시야 / 사거리 <i class="dot gold"></i> 목표</div><div id="unit-hud" class="unit-hud"></div><div id="action-dock" class="action-dock" hidden></div><div id="tile-info">장수를 선택해 첫 수를 두세요.</div><div id="phase-banner" aria-live="polite"></div><div id="battle-line" class="battle-line" aria-live="polite" hidden></div><div id="battle-relics" class="battle-relics" hidden></div><div id="encounter" class="encounter" role="dialog" hidden></div><div id="coach" class="coach" role="status" hidden><p></p><button id="coach-close" aria-label="안내 닫기">닫기</button></div></div><div class="battle-toolbar"><button id="undo">↶ <span>무르기</span> <kbd>Z</kbd></button><button id="threat" aria-pressed="false">◎ <span>위험 범위</span></button><button id="speed">▷ <span>1× 속도</span></button><button id="auto-battle" aria-pressed="false" title="아군을 대신 지휘한다(대사 선택·일기토 수락은 직접)">⟳ <span>자동 전투</span></button><span id="save-status" role="status">자동 저장 준비</span><button id="end-phase" class="primary">아군 턴 종료 <span>→</span></button></div><div class="dispatch"><span>군보</span><p id="latest-log" aria-live="polite">전장을 살피고 명령을 내려 주십시오.</p><button id="log-button">전투 기록 ↗</button></div></section>
<aside class="right-panel"><div class="section-label">장수 정보 <span>장수</span></div><div id="unit-detail"></div><div class="section-label command-label">전술 명령 <span>명령</span></div><div id="commands" class="commands"></div><p id="command-hint" class="command-hint"></p><div class="tactic-note"><span>책</span><div><strong>전장을 읽는 법</strong><p id="tactical-tip"></p></div></div></aside></main><footer><span>${GAME_SERIES} ${GAME_NAME}</span><span>상편·중편·하편 · 플레이 가능 전장 ${chapters.length}개</span><span>선택 → 이동 → 행동 → 턴 종료</span></footer>
<dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status"></div>`;

/** 마지막으로 그린 승리 조건(바뀌면 알린다). */
const objectiveSeen:{session?:unknown;key?:string}={};
/** 마지막으로 깜박여 알린 목표 지점(전투 시작·목표가 바뀔 때만 다시 깜박인다). */
const goalSeen:{session?:unknown;key?:string}={};
/** 지도 위 승리 조건: 전투 시작·목표가 바뀔 때 펼쳐 보이고, 장수를 고르거나 몇 초 지나면 한 줄 꼬리표로 접는다.
 * 꼬리표를 누르거나 O 키로 다시 펼친다. 왼쪽 "전투 목표" 패널에는 늘 전문이 있다. */
const objectiveBox={open:true,auto:false,guide:false,timer:undefined as ReturnType<typeof setTimeout>|undefined};
/** 목표 안내는 장마다 처음 한 번만 펼친다. 그 뒤로는 '◇ 목표' 꼬리표만 두고, 궁금할 때 직접 펼쳐 본다. */
const GUIDE_KEY='sama-goal-guide-v1';
function goalGuideSeen(id:string){try{const v=JSON.parse(localStorage.getItem(GUIDE_KEY)??'[]') as unknown;return Array.isArray(v)&&v.includes(id);}catch{return false;}}
function markGoalGuide(id:string){try{const v=JSON.parse(localStorage.getItem(GUIDE_KEY)??'[]') as unknown;const a=Array.isArray(v)?v.filter((x):x is string=>typeof x==='string').slice(-300):[];if(!a.includes(id))a.push(id);localStorage.setItem(GUIDE_KEY,JSON.stringify(a));}catch{/* storage optional */}}
function setObjectiveOpen(open:boolean,autoCloseMs?:number){
  clearTimeout(objectiveBox.timer);objectiveBox.open=open;objectiveBox.auto=!!(open&&autoCloseMs);if(!open)objectiveBox.guide=false;
  const el=$('#map-objective');el.classList.toggle('collapsed',!open);el.querySelector('.mo-toggle')?.setAttribute('aria-expanded',String(open));
  if(open&&autoCloseMs)objectiveBox.timer=setTimeout(()=>setObjectiveOpen(false),autoCloseMs);
  stackOverlays();keepUnitsClear(false);
}
/** 짧은 알림. icon(그림 HTML)을 주면 글 앞에 붙인다(전장에서 주운 도구). */
function toast(text:string,icon=''){const el=$('#toast');if(icon){el.innerHTML=`${icon}<span>${esc(text)}</span>`;el.classList.add('with-icon');}else{el.textContent=text;el.classList.remove('with-icon');}$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
// 저장이 실패하면(저장 공간 가득 참·저장 차단) 알린다. 같은 알림은 20초에 한 번만.
guardStorage();{let lastWarn=0;window.addEventListener(STORAGE_FAIL,e=>{const f=(e as CustomEvent<StorageFail>).detail,now=Date.now();
  const status=document.getElementById('save-status');if(status)status.textContent=f.quota?'⚠ 저장 공간 가득 참':'⚠ 저장 막힘';
  if(now-lastWarn<20000)return;lastWarn=now;toast(storageFailText(f));});}
function modal(html:string,closable=true){
  const d=$<HTMLDialogElement>('#modal');$('#modal-content').innerHTML=(closable?'<button class="modal-close" data-close aria-label="닫기">×</button>':'')+html;
  if(!d.open)d.showModal();d.scrollTop=0;$('#modal-content [data-close]')?.addEventListener('click',closeModal);
  d.oncancel=e=>{if(!closable)e.preventDefault();else setTimeout(()=>pump(),0);};
  // 닫을 수 없는 창(이야기·결과·보상 고르기): Esc를 연달아 눌러도 닫히지 않게 키 입력 단계에서 막는다(크롬은 두 번째 Esc의 cancel을 막지 못한다).
  d.onkeydown=e=>{if(!closable&&e.key==='Escape')e.preventDefault();};
}
function closeModal(){$<HTMLDialogElement>('#modal').close();pump();}
/**
 * 창 내용이 화면보다 길면 내용 전체를 줄여 한 화면에 보이게(가로 화면 PC·휴대폰 공통).
 * 글씨가 읽히지 않을 만큼 줄이지는 않는다(최소 80%). 목록·도감 화면은 줄이지 않고 창 안에서 스크롤한다.
 */
let fitQueued=false;
const SCROLL_SCREENS='.treasure-screen,.troop-evolution,.codex-screen,.fate-map-screen,.save-screen';
function fitModal(){fitQueued=false;const d=$<HTMLDialogElement>('#modal'),c=$('#modal-content');if(!d.open){c.style.zoom='';return;}
  c.style.zoom='';if(c.querySelector(SCROLL_SCREENS))return;
  // 연구: 칸을 고를 때마다 배율이 흔들리지 않게 화면 높이로만 정한다(넘치면 창 안에서 스크롤).
  if(c.querySelector('.research-screen')){if(d.clientHeight<900)c.style.zoom='0.8';return;}const avail=d.clientHeight;let need=d.scrollHeight;if(need<=avail+2)return;
  let z=Math.max(.8,avail/need);c.style.zoom=String(z);need=d.scrollHeight;if(need>avail+2){z=Math.max(.8,z*avail/need);c.style.zoom=String(z);}}
function queueFit(){if(fitQueued)return;fitQueued=true;requestAnimationFrame(()=>requestAnimationFrame(fitModal));}
{const c=document.querySelector('#modal-content');if(c){new MutationObserver(queueFit).observe(c,{childList:true,subtree:true,characterData:true});c.addEventListener('load',queueFit,true);addEventListener('resize',queueFit);document.fonts?.ready.then(queueFit);}}
/**
 * 연의 완주: 정사 결말 「진의 기틀」 컷신(해설 → 사마가의 침소·새 왕조의 궁정 → 종막) 뒤 에필로그.
 * 연의에서 고른 선택(표식)이 결말 대사를 바꾼다. 정사 결말을 본 결말로 남긴다.
 */
function playYeonEnding(){
  if(!storyReady){menuOpen=true;modal(waitPanel('결말 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>playYeonEnding());return;}
  menuOpen=true;sound.scene='camp';void sound.start().then(updateSound);
  const meta=loadMeta();if(!meta.endings.includes('patience')){meta.endings.push('patience');saveMeta(meta);}
  const route={1:'refuse',2:'wei',3:'patience'},e=endingFor(route);
  const people=[{label:'함께한 사람들',names:[...new Set(['사마의','사마랑','사마방','조진','사마사','사마소',...(meta.recruited??[])])]}];
  modal('<div class="ss-host finale-host"></div>',false);const root=$('.finale-host');
  void playEndingCutscene(root,finaleData(e,{route,people,seen:{count:simaEndings(meta).length,total:ALL_ENDINGS.length}}),{id:'patience',flags:yeonFlags(),heading:'연의 · 결말'}).then(()=>{if(document.contains(root))void showEpilogue(root,people[0]!.names.length);});
}
/** 본 결말 다시 보기(시나리오 보기 화면에서). */
function replayEnding(id:string){
  if(!storyReady){menuOpen=true;modal(waitPanel('결말 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>replayEnding(id));return;}
  menuOpen=true;const meta=loadMeta(),faction=loadScenario().run?.faction?.name;
  const d=replayData(id,{count:simaEndings(meta).length,total:ALL_ENDINGS.length}),T=(t:string)=>factionText(t,faction);
  modal('<div class="ss-host finale-host"></div>',false);const root=$('.finale-host');
  void playEndingCutscene(root,{...d,title:T(d.title),lines:d.lines.map(T),place:T(d.place),path:d.path.map(p=>({...p,name:T(p.name)}))},{id,flags:id==='patience'?yeonFlags():[],heading:'결말 다시 보기'}).then(()=>{if(document.contains(root))showStoryArchive();});
}
/** 연의 에필로그 컷신: 여덟 전장 회상(인장으로 갈린 한 줄) → 251년부터 280년까지의 연표 → 맺음과 이번 길의 기록. */
async function showEpilogue(root:HTMLElement,people:number){
  const p=progress(),total=campaignOrder.length*3,meta=loadMeta();
  const got=campaignOrder.reduce((n,i)=>{const id=chapters[i]!.stage.id;return n+new Set([...(p[id+':normal']??[]),...(p[id+':extreme']??[])]).size;},0);
  const beats=epilogueBeats(p),kept=beats.filter(b=>b.kept).length;
  await playEpilogue(root,{eyebrow:'에필로그 · 251년 가을',title:'칼을 감춘 사람',beats,years:epilogueYears,
    closing:['그는 평생 칼을 감추고 때를 기다렸다. 칼은 아들들이 뽑았고, 천하는 손자의 것이 되었다.',
      kept>=beats.length/2?'그가 지켜 낸 사람들은 그 세월을 끝까지 보았다.':'지키지 못한 이름들을, 그는 끝내 잊지 않았다.'],
    stats:[{label:'모은 연의 천명',value:`${got} / ${total}`},{label:'이긴 전장',value:`${campaignOrder.filter(cleared).length} / ${campaignOrder.length}`},
      {label:'지켜 낸 회상',value:`${kept} / ${beats.length}`},{label:'함께한 사람',value:`${people}명`},{label:'본 결말',value:`${simaEndings(meta).length} / ${ALL_ENDINGS.length}`}],
    button:'연의 회상'});
  if(document.contains(root))showChronicle();
}
function progress():Record<string,number[]>{try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)??'{}') as Record<string,number[]>;}catch{return {};}}
/** 이긴 적이 있는가: 일반·극한 어느 쪽이든 승리 기록이 남았거나(인장 조건과 무관), 천명의 길·원정에서 이긴 연의 전장. */
function cleared(chapter:number){const id=chapters[chapter]!.stage.id,p=progress();return Array.isArray(p[`${id}:normal`])||Array.isArray(p[`${id}:extreme`])||loadMeta().chronicle.includes(id);}
function unlocked(chapter:number){const i=campaignOrder.indexOf(chapter);return cleared(chapter)||i===0||cleared(campaignOrder[i-1]!);}
mergeRunCampaign();
let campaign=readCampaign();
// Old clear seals become one-time campaign rewards; old battles still replay their old rules.
for(const chapter of campaignOrder)for(const difficulty of ['normal','extreme'] as const){const id=chapters[chapter]!.stage.id;if(progress()[id+':'+difficulty]?.includes(1))award(campaign,id,difficulty,chapters[chapter]!.stage.deployment.forced,[1]);}
// 새 장비 체계(금·고유 보물 50) 이전의 기록: 이미 이긴 장의 금과 제갈량전 고유 보물을 한 번 셈해 준다.
{const p=progress();
  for(const i of zhugeOrder){const id=chapters[i]!.stage.id;if(Array.isArray(p[id+':normal'])||Array.isArray(p[id+':extreme']))awardZhugeTreasures(campaign,id,Array.isArray(p[id+':extreme'])?'extreme':'normal');}
  if(!campaign.gold){const g={S:1000,Z:1000};
    campaignOrder.forEach((ch,k)=>{const id=chapters[ch]!.stage.id;for(const d of ['normal','extreme'] as const)if(campaign.rewards.includes(id+':'+d))g.S+=chapterGold(k,true);});
    zhugeOrder.forEach((ch,k)=>{const id=chapters[ch]!.stage.id;for(const d of ['normal','extreme'] as const)if(Array.isArray(p[id+':'+d]))g.Z+=chapterGold(k,true);});
    campaign.gold=g;}}
try{writeCampaign(campaign);}catch{/* Session remains playable without persistent storage. */}
// 연의 천명(옛 인장)은 얻을 때마다 쓸 천명 1을 준다. 이 규칙 전에 얻어 둔 것도 여기서 한 번 준다.
{const m=loadMeta(),g=paySeals(m,progress(),campaignOrder.map(i=>chapters[i]!.stage.id));if(g){saveMeta(m);setTimeout(()=>toast(`지난 기록의 연의 천명 ${g}개 · 천명 +${g} (연구에 쓴다)`),1600);}}
const officerNames:Record<string,string>={sima_yi:'사마의',sima_lang:'사마랑',sima_fang:'사마방',cao_zhen:'조진'};
/** 승리로 얻은 쓸 천명 한 줄: 이긴 몫 + 처음 얻은 연의 천명 몫. */
function mandateText(win:number,seals:number){return `천명 +${win+seals} (${[...(win?[`승리 ${win}`]:[]),...(seals?[`새 연의 천명 ${seals}개`]:[])].join(' · ')} · 연구에 쓴다)`;}
function growthText(){const l=levelInfo(campaign.xp.sima_yi??0);return '사마의 Lv.'+l.level+' · 경험치 '+l.xp+'/'+l.next;}
/** 등용 장수의 레벨: 처음 나설 때는 사마의 레벨−1, 그 뒤로는 자기가 싸워 번 경험치로 오른다. */
/** 제갈량전 등용 장수의 레벨: 싸운 기록이 있으면 그 레벨, 없으면 제갈량 레벨−1(그 장에서는 장 기본 레벨보다 낮지 않다). */
function zRetinueLevel(name:string,stage?:(typeof chapters)[number]['stage'],difficulty:'normal'|'extreme'='normal'){const x=campaign.retinueXp?.[name];const base=x!==undefined?levelInfo(x).level:Math.max(1,levelInfo(campaign.retinueXp?.['제갈량']??0).level-1);return stage?Math.max(base,zhugeBase(stage,difficulty)):base;}
function retinueLevel(name:string){const x=campaign.retinueXp?.[name];return x!==undefined?levelInfo(x).level:Math.max(1,levelInfo(campaign.xp.sima_yi??0).level-1);}
/** 등용 장수 경험치 적립: 싸워 번 만큼 + 승리 몫. 오른 레벨 글을 돌려준다. */
function growRetinue(units:ReadonlyArray<{id:string;name:string;level?:number}>,earned:Record<string,number>,bonus:number){
  const out:string[]=[];const r=campaign.retinueXp??={};
  // 기록이 없으면 이번에 나선 레벨에서 시작한다(사마의가 방금 오른 레벨로 계산하지 않게).
  for(const u of units){const before=r[u.name]!==undefined?retinueLevel(u.name):u.level??retinueLevel(u.name),base=r[u.name]??xpAtLevel(before);r[u.name]=base+Math.max(0,earned[u.id]??0)+bonus;const after=levelInfo(r[u.name]!).level;if(after>before)out.push(`${u.name} Lv.${before} → ${after}`);}
  return out;
}
function saveCampaign(){try{writeCampaign(campaign);return true;}catch{toast('성장 기록을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');return false;}}
/** 상점 왼쪽에 보일 장수: 사마의전은 연의 장수 넷과 등용 장수, 제갈량전은 기록이 있는 제갈량전 장수. */
function shopUnits(story:Story):ShopUnit[]{
  if(story==='S'){const lv=(id:string)=>levelInfo(campaign.xp[id]??0).level;
    return [...OFFICERS.map(id=>({key:id,name:officerNames[id]!,unitClass:storyClassAt(id,lv(id)),level:lv(id)})),...(loadMeta().recruited??[]).map(n=>({key:n,name:n,unitClass:evolvedClass(officerClass(n),retinueLevel(n)),level:retinueLevel(n)}))];}
  const seen=new Set<string>();
  return ZHUGE_ROSTER.filter(o=>o.name==='제갈량'||campaign.retinueXp?.[o.name]!==undefined).filter(o=>!seen.has(o.name)&&seen.add(o.name)).map(o=>({key:o.name,name:o.name,unitClass:officerClass(o.name),...(campaign.retinueXp?.[o.name]!==undefined?{level:levelInfo(campaign.retinueXp[o.name]!).level}:{})}));
}
/** 이야기에서 이긴 장 수(상점 등급 해금). */
function shopProgress(story:Story){return story==='S'?{wins:campaignOrder.filter(cleared).length,total:campaignOrder.length}:{wins:zhugeOrder.filter(zhugeCleared).length,total:zhugeOrder.length};}
/** 상점 열기: units를 주면(출진 정비) 그 부대만, 아니면 이야기의 장수 목록. */
function openShop(story:Story,back:()=>void,units?:ShopUnit[],switchable=false){
  menuOpen=true;clearTimeout(aiTimer);
  showShop({modal:h=>modal(h,false),toast,save:saveCampaign,campaign:()=>campaign,progress:shopProgress,units:st=>units&&st===story?units:shopUnits(st),back},{story,switchable});
}
/** 승리 금(처음 이긴 장은 크게, 다시 이기면 1/3). 받은 금. */
function winGold(story:Story,stageId:string,first:boolean){const order=story==='S'?campaignOrder:zhugeOrder,k=order.findIndex(i=>chapters[i]!.stage.id===stageId);if(k<0)return 0;const g=chapterGold(k,first);addGold(campaign,story,g);return g;}
/** viewOnly: 「시나리오 보기」에서 연 이야기 — 끝나면 출진 대신 목록으로 돌아간다. */
let stopStoryMotion:()=>void=()=>{};
/** 연의 이야기에서 세운 표식(뒤 장의 when/unless가 읽는다). 천명의 길 회차와 따로 둔다. */
const YEON_FLAGS='sama-yeon-flags-v1';
function yeonFlags():string[]{try{const v=JSON.parse(localStorage.getItem(YEON_FLAGS)??'[]') as unknown;return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'&&x.length<80).slice(-200):[];}catch{return [];}}
function saveYeonFlags(f:readonly string[]){try{localStorage.setItem(YEON_FLAGS,JSON.stringify([...new Set(f)].slice(-200)));}catch{/* storage optional */}}
/**
 * 연의 이야기: 천명의 길과 같은 이야기 무대(작은 인물이 걷고 말풍선·감정을 띄우는 조조전식 장면)로 그 장의 대본을 연다.
 * 장을 여는 해설 → 장면들 → (보기만 하면 목록으로 / 아니면 출진 정비). 대사 선택의 효과(사기·방어 태세·책략 MP)와
 * 이야기 속 일기토·설전의 결과는 이번 전투에 실린다. 대본이 없는 장만 예전 두 사람 장면을 쓴다.
 */
function storyScene(chapter:number,beat=0,fromArt?:number,viewOnly=false){
  const c=chapters[chapter],script=c?scriptOf(c.stage.id):undefined;
  if(!script||!c)return legacyStoryScene(chapter,beat,fromArt,viewOnly);
  if(!storyReady){menuOpen=true;modal(waitPanel('이야기 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>storyScene(chapter,beat,fromArt,viewOnly));return;}
  menuOpen=true;clearTimeout(aiTimer);sound.scene=chapter===4?'dream':'camp';void sound.start().then(updateSound);
  modal('<div class="ss-host yeon-host"></div>',false);
  const zh=isZhugeStage(c.stage.id),root=$('.ss-host'),heading=`${zh?'제갈량전':'연의'} · ${script.title}`,own=choiceFlags(script.scenes),flags=yeonFlags().filter(f=>!own.has(f)&&!f.startsWith(`contest:${c.stage.id}:`)),picked:ChoiceEffect[]=[];let contest:{kind:'duel'|'debate';result:string}|undefined;
  const heroName=zh?'제갈량':'사마의',hero=zh?zhugeLevel(campaign,heroName,c.stage,'normal'):levelInfo(campaign.xp.sima_yi??0).level;
  setStoryTitle(heroName,heroTitle(loadMeta(),zh?'Z':'S'));
  void (async()=>{
    if(script.history?.length&&script.scenes[0])await playNarration(root,{heading,year:script.year,title:script.title,lines:script.history,art:script.scenes[0].art,place:script.scenes[0].place});
    await playScenes(root,plainChoices(script.scenes),{heading,flags:()=>flags,
      onChoice:o=>{for(const e of o.effects??[]){picked.push(e);if(e.kind==='flag'&&!flags.includes(e.flag))flags.push(e.flag);}},
      onContest:async e=>{const by=e.by??heroName,stat=(n:string)=>{const r=romanceByName(n);return (e.kind==='duel'?(r?.war??55):(r?.int??55))+hero;};
        // 두 사람 모두 실제 장수 그림으로 마주 세운다(사마의는 지금 병종, 상대는 그 장수의 병종).
        const model=(name:string,side:'player'|'enemy')=>portraitFor({id:name==='사마의'&&!zh?'sima_yi':'contest_'+side,name,unitClass:name==='사마의'&&!zh?storyClassAt('sima_yi',hero):officerClass(name),side} as unknown as Unit,false,e.kind);
        const r=await playContest(e.kind,{name:by,stat:stat(by)},{name:e.foe,stat:stat(e.foe)},{...(e.line?{acceptLine:e.line}:{}),seed:c.stage.id+e.foe,done:'돌아가기',reward:`이기면 이번 전투 아군 사기 상승 · ${e.kind==='duel'?'첫 턴 방어 태세':`${heroName} 책략 MP +15`}.`,sound:k=>sound.event({kind:'duel',critical:k,debate:e.kind==='debate'}),models:{player:model(by,'player'),enemy:model(e.foe,'enemy')}});
        // 대결 결과도 표식으로 남긴다(뒤 장면이 when/unless로 이긴 경우·진 경우를 가른다) — 시나리오 모드와 같은 꼴.
        flags.push(`contest:${c.stage.id}:${e.kind}:${r}`);contest={kind:e.kind,result:r};
        // 이야기 속 겨룸에서 이기면(장마다 상대마다 한 번) 명성·호감 — 격파 길 장수면 살려 보낼지 등용을 권할지 고른다.
        if(r==='win'&&!viewOnly&&!storyContestSeen(`${c.stage.id}:${e.foe}`))await contestRecruit(zh?'Z':'S',e.foe,root,`story:${c.stage.id}:${e.foe}`);
        return r;}});
    setStoryTitle(heroName,'');
    if(!viewOnly)saveYeonFlags(flags);
    // 이번 전투에 실을 효과: 고른 대사(사기·방어·책략 MP) + 이야기 속 대결의 승리.
    // 고른 대사는 더 이상 능력치를 주지 않는다(plainChoices) — 이야기 속 대결의 승리만 전투에 싣는다.
    const mods:BattleMods={};void picked;
    if(contest?.result==='win'){mods.rally=true;if(contest.kind==='debate')mods.insight=true;else mods.guard=true;}
    if(!document.contains(root))return;
    if(zh){if(viewOnly)showZhuge();else zhugeBriefing(chapter,Object.keys(mods).length?mods:undefined);return;}
    if(viewOnly)showStoryArchive(chapter);else briefing(chapter,undefined,undefined,Object.keys(mods).length?mods:undefined);
  })();
}
function legacyStoryScene(chapter:number,beat=0,fromArt?:number,viewOnly=false){
  if(!storyReady){menuOpen=true;modal(waitPanel('이야기 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>legacyStoryScene(chapter,beat,fromArt,viewOnly));return;}
  menuOpen=true;clearTimeout(aiTimer);sound.scene=chapter===4?'dream':'camp';void sound.start().then(updateSound);
  const c=chapters[chapter]!,beats=storyBeats[c.stage.id]!,b=beats[beat]!;
  const location=storyLocations[c.stage.id]![beat]!;
  const previous=fromArt===undefined?undefined:{art:fromArt};
  const backdrop=(index:number,extra='')=>`<div class="story-backdrop ${extra}" style="${storyBackdrop(index)}"></div>`;
  // 새 장소(또는 처음)면 두 사람이 걸어 들어오고, 같은 자리에서 이어지면 선 채로 이어 말한다.
  const prevLoc=beat>0?storyLocations[c.stage.id]![beat-1]:undefined,walkIn=fromArt===undefined||!prevLoc||prevLoc.art!==location.art||prevLoc.companion!==location.companion;
  const heroName='사마의';
  modal(`<div class="story-scene scene-${chapter}"><div class="eyebrow">${c.year} · 이야기 ${beat+1}/${beats.length}</div><h2>${stories[chapter]![0]}</h2>
  <div class="story-stage pose-${b.pose}" aria-label="${location.name} · 2D 장수 이야기 장면">
    ${previous?backdrop(previous.art,'outgoing'):''}${backdrop(location.art,'incoming')}
    <div class="story-light"></div><span class="story-location">${location.name}</span>
    ${actorMarkup(heroName,'hero',walkIn?'offstage':'')}${actorMarkup(location.companion,'companion',walkIn?'offstage':'')}
  </div>${dialogueCaption(b.speaker,b.line)}
  <div class="modal-actions"><button id="story-back" ${beat===0?'disabled':''}>← 이전 장면</button><button id="story-skip">${viewOnly?'목록으로':'군의로 건너뛰기'}</button><button class="primary" id="story-next">${beat===beats.length-1?(viewOnly?'다 보았다 · 목록으로':'출진 준비'):'다음 이야기'} →</button></div></div>`,false);
  // 인물 연기: 걸어 들어오기 → 몸짓(읍·놀람·무릎) → 말하기 → 마무리 자세.
  stopStoryMotion();const speaker=b.speaker==='해설'?'none':b.actor===4?'hero':'companion';
  stopStoryMotion=playBeat($('.story-stage'),{speaker,line:b.line,pose:b.pose,walkIn,deferent:speaker!=='none'&&/주공|폐하|승상|전하|아버님|형님|장군님|대왕/.test(b.line)});
  $('#story-back').onclick=()=>{if(beat>0)legacyStoryScene(chapter,beat-1,location.art,viewOnly);};
  const end=()=>viewOnly?showStoryArchive(chapter):briefing(chapter);
  $('#story-skip').onclick=end;$('#story-next').onclick=()=>beat+1<beats.length?legacyStoryScene(chapter,beat+1,location.art,viewOnly):end();
}
// ── 제갈량전: 장 목록 · 출진 정비 · 결과. 장 id는 Z…, 진행(천명 조건)·천명은 사마의전과 같은 기록에 장 id로 남는다.
/** 제갈량전 진행 요약(이야기 고르기·본영). */
function zhugeSummary(){const n=zhugeOrder.find(i=>!zhugeCleared(i));return {...(n!==undefined?{next:`${scriptOf(chapters[n]!.stage.id)?.title??chapters[n]!.stage.title}`}:{}),won:zhugeOrder.filter(zhugeCleared).length,total:zhugeOrder.length,seals:zhugeOrder.reduce((t,i)=>t+zhugeSeals(chapters[i]!.stage.id),0),sealMax:zhugeOrder.length*6};}
/** 장의 연의 천명(일반 3 + 극한 3) 가운데 얻은 수. */
function zhugeSeals(id:string){const p=progress();return new Set(p[id+':normal']??[]).size+new Set(p[id+':extreme']??[]).size;}
function zhugeCleared(i:number){const id=chapters[i]!.stage.id,p=progress();return Array.isArray(p[`${id}:normal`])||Array.isArray(p[`${id}:extreme`]);}
/** 처음 장은 언제나 열려 있다(사마의전을 하지 않아도 고를 수 있다). 그 뒤는 앞 장을 이기면 열린다. */
function zhugeUnlocked(i:number){const k=zhugeOrder.indexOf(i);return k===0||zhugeCleared(i)||(k>0&&zhugeCleared(zhugeOrder[k-1]!));}
/** 제갈량전 칸(본편 장 · 가지 칸)을 이겼나: 일반·극한 어느 쪽이든 기록이 있으면. */
function zhugeWon(id:string){const p=progress();return Array.isArray(p[`${id}:normal`])||Array.isArray(p[`${id}:extreme`]);}
/** 가지 칸의 chapters 번호. */
const zhugeIndex=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
/** 가지 칸이 열렸나(갈림 장을 이기고 앞 칸을 이겼다). */
function branchOpen(id:string){const n=zhugeMap().find(x=>x.id===id);return !!n&&zhugeNodeState(n,zhugeWon,zid=>zhugeUnlocked(zhugeIndex(zid))).open;}
let zgMap:ZMapNode[]|undefined;
function zhugeMap(){return zgMap??=zhugeMapNodes(zhugeOrder.map(i=>{const id=chapters[i]!.stage.id;return {id,title:scriptOf(id)?.title??chapters[i]!.stage.title};}));}
let zgStage='';
/**
 * 제갈량전 연의 지도: 사마의전 연의 지도와 같은 판(줄기 · 갈림길 · 가지)과 오른쪽 정보 칸.
 * 줄기는 본편 34장, 갈림 장 오른쪽으로 선택분기(가상 전장 둘 + 우두머리)가 뻗는다.
 */
function showZhuge(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;
  const p=progress(),stats=nodeStats(),nodes=zhugeMap(),byId=new Map(nodes.map(n=>[n.id,n]));
  const st=(n:ZMapNode)=>zhugeNodeState(n,zhugeWon,id=>zhugeUnlocked(zhugeIndex(id)));
  const first=nodes.find(n=>n.kind==='story'&&st(n).open&&!st(n).won)??nodes.filter(n=>n.kind==='story'&&st(n).open).at(-1)??nodes[0]!;
  const sel=byId.get(zgStage)??first;zgStage=sel.id;
  const CW=176,RH=128,NW=150,NH=104,PAD=34;
  const xOf=(n:ZMapNode)=>PAD+n.col*CW,yOf=(n:ZMapNode)=>PAD+n.row*RH;
  const W=Math.max(...nodes.map(xOf))+NW+PAD,H=Math.max(...nodes.map(yOf))+NH+PAD;
  const artOf=(id:string)=>scriptOf(id)?.scenes[0]?.art;
  const art=(n:ZMapNode):number=>n.kind==='story'?artOf(n.stage!)??(zhugeIndex(n.stage!)%18):n.kind==='fork'?artOf(forkOf(n.fork)!.anchor)??3:((n.id.charCodeAt(2)*7+n.id.charCodeAt(5)*3)%18);
  const lines=nodes.filter(n=>n.prev&&byId.has(n.prev)).map(n=>{const a=byId.get(n.prev!)!,x1=xOf(a)+NW/2,y1=yOf(a)+NH/2,x2=xOf(n)+NW/2,y2=yOf(n)+NH/2,on=st(a).won&&st(n).open;
    const d=Math.abs(x1-x2)<4||a.row===n.row?`M${x1},${y1} L${x2},${y2}`:`M${x1},${y1} L${x1},${(y1+y2)/2} L${x2},${(y1+y2)/2} L${x2},${y2}`;
    return `<path class="ym-line ${n.line} ${on?'on':''}" d="${d}"/>`;}).join('');
  const foeOf=(n:ZMapNode)=>n.kind==='tale'||n.kind==='boss'?branchNode(n.id)?.foe:undefined;
  const nodeHtml=(n:ZMapNode)=>{const s=st(n),a=new Set(p[n.id+':normal']??[]),b=new Set(p[n.id+':extreme']??[]);
    const pips=n.kind==='story'?[1,2,3].map(k=>`<i class="${a.has(k)?'n':''}${b.has(k)?' x':''}"></i>`).join(''):n.kind==='fork'?'':[1,2,3].map(k=>`<i class="${a.has(k)?'n':''}"></i>`).join('');
    const foe=foeOf(n),label=n.kind==='fork'?`갈림길 · ${n.title}`:n.kind==='boss'?`★ ${n.title}`:n.title;
    return `<button class="ym-node ${n.kind} ${n.line} ${s.won?'won':''} ${s.open?'':'locked'} ${n.id===sel.id?'sel':''}" data-zg-node="${esc(n.id)}" style="left:${xOf(n)}px;top:${yOf(n)}px"><span class="ym-pips">${pips}</span><span class="ym-thumb" style="${storyBackdrop(art(n))}">${foe?`<span class="ym-foe">${cardFace(foe.name)}</span>`:''}${n.kind==='fork'?'<b class="ym-fork-mark">갈림</b>':''}</span><span class="ym-plate">${esc(label)}</span>${s.open?'':'<span class="ym-chain" aria-label="잠김"></span>'}</button>`;};
  const arcHead=(arc:1|2,text:string)=>{const top=nodes.find(n=>n.kind==='story'&&n.arc===arc);return top?`<span class="zg-arc-head" style="top:${yOf(top)-(arc===2?RH*ARC_GAP*0.62:PAD*0.9)}px">${text}</span>`:'';};
  // 오른쪽: 고른 칸
  const ss=st(sel),[w,t]=stats[sel.id]??[0,0],idx=sel.stage?zhugeIndex(sel.stage):-1,c=idx>=0?chapters[idx]:undefined;
  // 제갈량의 기록 레벨(처음이면 장마다 권장 레벨로 선다 · zhuge.ts).
  const heroXp=campaign.retinueXp?.['제갈량'],hero=heroXp!==undefined?levelInfo(heroXp).level:0;
  let year='',lvl=0,minutes=20,story='',rewards='',lock='',extra='',enter='';
  if(sel.kind==='story'){const sc=scriptOf(sel.stage!);year=c!.year;lvl=zhugeBase(c!.stage,'normal');minutes=Math.max(15,Math.min(60,Math.round(c!.map.rows.length*(c!.map.rows[0]?.length??20)/22)));
    story=sc?.synopsis??c!.stage.synopsis??'';const items=treasures.filter(x=>x.zstage===sel.stage);
    rewards=`${items.map(x=>`<span class="ym-item" title="${esc(x.name)} · 첫 승리">${treasureIcon(x.id)}</span>`).join('')}<span class="ym-item text">경험치</span><span class="ym-item text">금</span><span class="ym-item text">연의 천명 ×3</span>`;
    const names=sealNamesOf(idx),a=new Set(p[sel.id+':normal']??[]),b=new Set(p[sel.id+':extreme']??[]);
    extra=`<div class="stage-seals"><span>천명 조건 <small>일반 ${a.size}/3 · 극한 ${b.size}/3</small></span><ol>${names.map((nm,k)=>`<li><b>${esc(nm)}</b><i class="${a.has(k+1)?'earned':''}" title="일반">◆</i><i class="x ${b.has(k+1)?'earned':''}" title="극한">◆</i></li>`).join('')}</ol></div>`;
    lock=ss.open?'':'앞 장을 이기면 열린다.';enter=ss.won?'다시 출진':'이야기 시작';}
  else if(sel.kind==='fork'){const f=forkOf(sel.fork)!;year=f.year;story=f.prompt;
    extra=`<p class="zg-history"><b>정사에서는</b> ${esc(f.history)}</p><div class="ym-choices"><span>갈라지는 길</span><button class="ym-route" data-zg-first="${esc(f.nodes[0]!)}"><b>${esc(f.choice)}</b><small>${esc(f.name)} · ${esc(f.detail)}</small></button><p class="muted">본편 줄기(붉은 선)는 연의대로 이어진다. 가지(푸른 선)는 가상 전장 둘과 우두머리로 끝난다.</p></div>`;
    lock=ss.open?'':`본편 「${esc(scriptOf(f.anchor)?.title??f.anchor)}」을(를) 이기면 갈림길이 열린다.`;}
  else{const f=forkOf(sel.fork)!,b=branchNode(sel.id)!,r=rewardParts(b.reward);year=f.name;lvl=zhugeBase(c!.stage,'normal');minutes=sel.kind==='boss'?30:20;story=b.intro;
    const replay=ss.won;
    rewards=`<span class="ym-item" title="${esc(r.gear)} · 첫 승리">${treasureIcon(b.reward.gear)}</span><span class="ym-item text gold">${esc(replay?`금 +${replayGold(b.reward).toLocaleString()}`:r.gold)}</span>${replay?'':r.supplies.map(x=>`<span class="ym-item text">${esc(x)}</span>`).join('')}<span class="ym-item text">경험치</span><span class="ym-item face" title="적장 ${esc(b.foe.name)}">${cardFace(b.foe.name)}</span>`;
    const forced=c!.stage.deployment.forced,prevStage=sel.prev&&sel.prev!==f.id?chapters[zhugeIndex(sel.prev)]?.stage.deployment.forced??[]:forced,joined=forced.filter(id=>!prevStage.includes(id));
    extra=`<div class="zg-party"><span>함께 가는 장수</span>${forced.map(id=>`<em class="${joined.includes(id)?'join':''}">${esc(zhugeName(id)??id)}${joined.includes(id)?' · 합류':''}</em>`).join('')}</div><p class="zg-reward-note">${replay?'이미 이긴 칸 · 다시 이기면 금만 셋에 하나':`처음 이기면 ${esc(r.gear)} · ${esc(r.gold)}${r.supplies.length?' · '+esc(r.supplies.join(' · ')):''}`}</p>`;
    lock=ss.open?'':zhugeLockText(sel,zhugeWon,id=>scriptOf(id)?.title??id);enter=ss.won?'다시 출진':'출진 정비';}
  const trunkWon=nodes.filter(n=>n.kind==='story'&&st(n).won).length,trunkAll=nodes.filter(n=>n.kind==='story').length;
  const branchAll=nodes.filter(n=>n.kind==='tale'||n.kind==='boss'),branchWon=branchAll.filter(n=>st(n).won).length;
  const seals=zhugeOrder.reduce((t2,i)=>t2+zhugeSeals(chapters[i]!.stage.id),0);
  // 천명 보상: 사마의전과 같은 틀 — 편(상·하)마다 모은 연의 천명이 1/3 · 2/3 · 전부를 넘으면 받는다.
  const arcs=zhugeArcs(),tiers=arcs.flatMap(a=>zhugeSealTiers(a.arc-1,a.stages).map(t=>({...t,have:a.have})));
  const have=arcs.reduce((t,a)=>t+a.have,0),max=arcs.reduce((t,a)=>t+a.stages*6,0);
  const next=tiers.find(x=>!sealClaimed(campaign,x.key)),ready=tiers.find(x=>!sealClaimed(campaign,x.key)&&x.have>=x.need);
  const sealBar=`<div class="zg-seals"><span class="ym-seal-head">모은 연의 천명</span><i class="sr-meter"><i style="width:${max?Math.round(have/max*100):0}%"></i></i><b>${have}/${max}</b>
    <details class="ym-reward-list"><summary>보상 목록</summary><div>${tiers.map(x=>`<p class="${sealClaimed(campaign,x.key)?'got':x.have>=x.need?'ready':''}"><b>${x.arc} ${x.need}개</b> 경험치 +${x.xp} · ${esc(sealRewardText(x))}${sealClaimed(campaign,x.key)?' ✓':''}</p>`).join('')}</div></details>
    <span class="zg-next">${next?`다음 보상 ${next.arc} ${next.have}/${next.need} · ${esc(sealRewardText(next))}`:'모든 보상을 받았다'}</span>
    <button id="zg-claim" class="${ready?'ready':''}" ${ready?'':'disabled'}>받기</button>
    <div class="zg-arcs">${arcs.map(a=>`<span>${a.arc===1?'상편 「와룡」':'하편 「출사표」'} <b>${a.have}/${a.stages*6}</b></span>`).join('')}<span>제갈량전 금 <b>${(campaign.gold?.Z??1000).toLocaleString()}</b></span></div></div>`;
  // 본 결말: 오장원을 넘으면 열린다. 본 갈래는 다시 볼 수 있다.
  const meta=loadMeta(),seen=ZHUGE_BRANCHES.filter(b=>meta.endings.includes(zhugeEndingId(b)));
  const endings=`<section class="zg-endings"><h3>결말 <small>본 결말 ${seen.length}/${ZHUGE_ENDINGS.length}</small></h3><div class="chronicle-list">${ZHUGE_BRANCHES.map(b=>seen.includes(b)?`<button type="button" class="done end-replay" data-zg-end="${b}" title="결말 다시 보기">◆ ${esc(ZHUGE_ENDING_TEXT[b].title)} ▶</button>`:'<span>· 아직 보지 못한 결말</span>').join('')}${seen.length?'<button type="button" class="end-replay" id="zg-recap">내가 한 선택 ▶</button>':''}</div>${seen.length?'':'<p class="muted">오장원(마지막 장)을 이기면 결말이 열린다. 결말은 이야기 속 선택에 따라 갈린다.</p>'}</section>`;
  modal(`<div class="yeon-map zhuge-map">
  <header class="ym-top"><button id="zg-back" class="ym-backbtn">← 이야기 고르기</button>
    <div class="ym-arcs"><b class="ym-story-name">제갈량전</b>${heroChip('Z')}</div>
    <div class="zg-progress"><small>본편 <b>${trunkWon}/${trunkAll}</b> · 분기 <b>${branchWon}/${branchAll.length}</b> · 연의 천명 <b>${seals}/${trunkAll*6}</b></small><i class="sr-meter"><i style="width:${Math.round((trunkWon+branchWon)/(trunkAll+branchAll.length)*100)}%"></i></i></div>
    <span class="ym-hero">${hero?`제갈량 Lv.${hero} · `:''}금 ${(campaign.gold?.Z??1000).toLocaleString()}</span></header>
  <div class="ym-body">
    <section class="ym-board-wrap"><div class="ym-board" style="width:${W}px;height:${H}px">${arcHead(1,'상편 · 와룡')}${arcHead(2,'하편 · 출사표')}
      <svg class="ym-lines" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${lines}</svg>${nodes.map(nodeHtml).join('')}</div></section>
    <aside class="ym-detail ${sel.line}"><h2 class="ym-vtitle">${esc(sel.kind==='fork'?forkOf(sel.fork)!.title:sel.title)}</h2><div class="ym-info">
      <div class="ym-info-head"><strong>${esc(year)}</strong>${sel.kind!=='fork'?`<span class="ym-diff">${sel.kind==='story'?'일반 · 극한':sel.kind==='boss'?'가상 · 우두머리':'가상'}</span>`:''}</div>
      ${sel.kind!=='fork'?`<div class="ym-stat"><span class="ym-shot" style="${storyBackdrop(art(sel))}"></span><dl><div><dt>승리/출진</dt><dd>${w}/${w+t}</dd></div><div><dt>권장 LV</dt><dd>${lvl}${hero&&hero<lvl?` <small class="warn">(제갈량 ${hero} → ${lvl}로 선다)</small>`:''}</dd></div><div><dt>소요시간</dt><dd>약 ${minutes}분</dd></div></dl></div>
      <h3 class="ym-h">입수 가능 보상 목록</h3><div class="ym-items">${rewards}</div>`:''}
      <p class="ym-story">${esc(story)}</p>${extra}
      <div class="ym-go">${ss.open&&sel.kind!=='fork'?`<button id="zg-enter" class="primary">${enter} →</button>`:lock?`<div class="ym-lock">🔒 ${lock}</div>`:''}</div>
      <div class="zg-meta">${sealBar}${endings}</div>
    </div></aside></div>
  <footer class="ym-foot"><button id="zg-home">본영</button><button id="zg-shop">상점</button><button id="zg-recruit">등용${(()=>{const n=readyList(ensureMerit(),'Z').length;return n?` <b class="rc-dot">${n}</b>`:'';})()}</button>${lastBattle()?.ongoing?'<button id="resume" class="primary">전투 이어하기 →</button>':''}${hasStarted?'<button id="back-battle">현재 전장</button>':''}<button id="save-slots">저장 칸</button></footer></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-zg-node]').forEach(b=>b.onclick=()=>{zgStage=b.dataset.zgNode!;showZhuge();});
  document.querySelectorAll<HTMLButtonElement>('[data-zg-first]').forEach(b=>b.onclick=()=>{zgStage=b.dataset.zgFirst!;showZhuge();});
  $('#zg-back').onclick=()=>showStoryPick(runHost,showMenu);$('#zg-home').onclick=showMenu;$('#zg-shop').onclick=()=>openShop('Z',showZhuge,undefined,true);document.getElementById('zg-recruit')?.addEventListener('click',()=>showRecruit('Z'));
  $('#save-slots').onclick=()=>showSlots(showZhuge);$('#back-battle')?.addEventListener('click',()=>{menuOpen=false;closeModal();});$('#resume')?.addEventListener('click',resumeSaved);
  document.getElementById('zg-enter')?.addEventListener('click',()=>{if(sel.kind==='story')storyScene(idx);else zhugeBriefing(idx);});
  const el=document.querySelector<HTMLElement>('.ym-node.sel'),wrap=document.querySelector<HTMLElement>('.ym-board-wrap');if(el&&wrap){wrap.scrollTop=Math.max(0,el.offsetTop-wrap.clientHeight/2+NH/2);wrap.scrollLeft=Math.max(0,el.offsetLeft-wrap.clientWidth/2+NW/2);}
  document.querySelectorAll<HTMLButtonElement>('[data-zg-end]').forEach(b=>b.onclick=()=>playZhugeEnding(b.dataset.zgEnd as ZhugeBranch));
  document.getElementById('zg-recap')?.addEventListener('click',()=>showZhugeRecap());
  document.getElementById('zg-claim')!.onclick=()=>{if(!ready)return;const got=claimZhugeSealTier(campaign,ready,ready.have,zhugeNames());if(!got)return;saveCampaign();sound.event({kind:'victory'});
    toast(`천명 보상 · 제갈량전 장수 경험치 +${got.xp} · ${got.text}`);showZhuge();};
}
/** 제갈량전 편(상 Z1 · 하 Z2)마다 장 수와 모은 연의 천명. */
function zhugeArcs(){return ([1,2] as const).map(arc=>{const list=zhugeOrder.filter(i=>chapters[i]!.stage.id.startsWith(`Z${arc}-`));
  return {arc,stages:list.length,won:list.filter(zhugeCleared).length,have:list.reduce((t,i)=>t+zhugeSeals(chapters[i]!.stage.id),0)};});}
/** 제갈량전 장수 이름: 제갈량과 기록이 있는 제갈량전 장수(상점 장수 목록과 같은 기준). */
function zhugeNames(){return shopUnits('Z').map(u=>u.name);}
/** 34장에서 고른 선택(연의 이야기 표식에 남은 것)과 대결 결과. */
function zhugePicks(flags:readonly string[]){return zhugeChoiceLog(zhugeOrder.map(i=>chapters[i]!.stage.id),scriptOf,flags);}
/**
 * 제갈량전 결말: 결말 장면(오장원의 마지막 밤 → 성도 → 정군산) → 종막 → 에필로그(마음과 법의 회상 · 촉의 앞날) → 「내가 한 선택」.
 * replay: 장 목록에서 본 결말 다시 보기(그 갈래의 장면과 종막만 보고 장 목록으로).
 */
function playZhugeEnding(replay?:ZhugeBranch){
  if(!storyReady){menuOpen=true;modal(waitPanel('결말 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>playZhugeEnding(replay));return;}
  menuOpen=true;clearTimeout(aiTimer);sound.scene='camp';void sound.start().then(updateSound);
  const flags=yeonFlags(),picks=zhugePicks(flags),t=zhugeTally(flags,picks),branch=replay??t.branch,text=ZHUGE_ENDING_TEXT[branch];
  const meta=loadMeta(),id=zhugeEndingId(branch);if(!meta.endings.includes(id)){meta.endings.push(id);saveMeta(meta);}
  const arcs=zhugeArcs(),seen=ZHUGE_ENDINGS.filter(e=>meta.endings.includes(e)).length;
  const data:FinaleData={kind:'정사',year:'234년 가을',title:text.title,lines:text.lines,notes:replay?[]:zhugeEndingNotes(t,picks,flags),
    path:[...arcs.map(a=>({act:a.arc===1?'상편 「와룡」':'하편 「출사표」',name:`이긴 장 ${a.won}/${a.stages} · 연의 천명 ${a.have}/${a.stages*6}`})),{act:'결말',name:text.path}],
    people:[{label:'함께한 사람들',names:zhugeNames()}],art:3,place:'정군산 · 승상의 무덤',seen:{count:seen,total:ZHUGE_ENDINGS.length},story:'제갈량전'};
  modal('<div class="ss-host finale-host"></div>',false);const root=$('.finale-host');
  void playEndingCutscene(root,data,{id:'zhuge',flags:[zhugeEndingFlag(branch),...flags.filter(f=>f.startsWith('z219_'))],heading:replay?'제갈량전 · 결말 다시 보기':'제갈량전 · 결말'}).then(()=>{
    if(!document.contains(root))return;if(replay){showZhuge();return;}void showZhugeEpilogue(root,flags);});
}
/** 제갈량전 에필로그: 마음과 법이 맞선 장의 회상 → 큰 별이 진 뒤 촉의 연표 → 맺음과 이번 길의 기록. */
async function showZhugeEpilogue(root:HTMLElement,flags:readonly string[]){
  const picks=zhugePicks(flags),t=zhugeTally(flags,picks),text=ZHUGE_ENDING_TEXT[t.branch],arcs=zhugeArcs(),meta=loadMeta();
  const cs=picks.flatMap(p=>p.contest?[p.contest]:[]),stages=arcs.reduce((n,a)=>n+a.stages,0);
  await playEpilogue(root,{eyebrow:'에필로그 · 234년 가을',title:text.title,beats:zhugeAxisBeats(picks,flags),years:ZHUGE_YEARS,
    closing:[...text.closing,ZHUGE_TEMPER_NOTE[t.temper]],
    stats:[{label:'이긴 장',value:`${arcs.reduce((n,a)=>n+a.won,0)} / ${stages}`},{label:'모은 연의 천명',value:`${arcs.reduce((n,a)=>n+a.have,0)} / ${stages*6}`},
      {label:'마음 · 법',value:`${t.heart} · ${t.law}`},{label:'대결 승리',value:`${cs.filter(c=>c.result==='win').length} / ${cs.length}`},{label:'본 결말',value:`${ZHUGE_ENDINGS.filter(e=>meta.endings.includes(e)).length} / ${ZHUGE_ENDINGS.length}`}],
    button:'내가 한 선택',marks:{kept:'마음',lost:'법'}});
  if(document.contains(root))showZhugeRecap();
}
/** 「내가 한 선택」 회고: 34장마다 고른 선택 · 마음과 법 · 대결 결과 · 모은 연의 천명. */
function showZhugeRecap(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';
  const flags=yeonFlags(),has=new Set(flags),picks=zhugePicks(flags),t=zhugeTally(flags,picks),axis=new Map(ZHUGE_AXIS.map(a=>[a.stage,a])),arcs=zhugeArcs();
  const cs=picks.flatMap(p=>p.contest?[p.contest]:[]),lean:Record<string,string>={guard:'굳힘',rally:'나섬',insight:'책략'},res:Record<string,string>={win:'승리',lose:'패배',draw:'무승부'};
  const rows=picks.map(p=>{const a=axis.get(p.id),side=a?(has.has(a.heart)?'heart':has.has(a.law)?'law':''):'';
    return `<li class="${side}"><span class="zr-no">${stageNo(p.id)}</span><div class="zr-text"><b>${esc(p.title)}</b> <small>${esc(p.year)}</small><p>${p.option?esc(p.option.text):'<small>고른 기록이 없다</small>'}</p></div><span class="zr-tags">${side?`<i class="${side}">${side==='heart'?'마음':'법'}</i>`:''}${p.option?.lean&&lean[p.option.lean]?`<i>${lean[p.option.lean]}</i>`:''}${p.contest?`<i class="${p.contest.result}">${p.contest.kind==='duel'?'일기토':'설전'} ${esc(p.contest.by)} 대 ${esc(p.contest.foe)} · ${res[p.contest.result]}</i>`:''}<i>천명 ${zhugeSeals(p.id)}/6</i></span></li>`;}).join('');
  modal(`<div class="briefing zg-recap"><div class="eyebrow">제갈량전 · 회고</div><h2>내가 한 선택</h2><p class="screen-lede">와룡에서 오장원까지, 장마다 고른 말과 겨룸의 결과. 다시 출진해 다른 답을 고르면 결말이 바뀐다.</p>
  <div class="zr-head"><span>결말 갈래 「${esc(ZHUGE_ENDING_TEXT[t.branch].title)}」</span><span>마음 ${t.heart} · 법 ${t.law}</span><span>굳힘 ${t.guard} · 나섬 ${t.rally}</span><span>대결 ${cs.filter(c=>c.result==='win').length}승 / ${cs.length}</span><span>연의 천명 ${arcs.reduce((n,a)=>n+a.have,0)}/${arcs.reduce((n,a)=>n+a.stages*6,0)}</span></div>
  <ol class="zr-list">${rows}</ol><div class="modal-actions"><button id="zr-list" class="primary">장 목록</button></div></div>`,false);
  $('#zr-list').onclick=showZhuge;
}
/** 제갈량전 출진 전 정비: 사마의전 연의 정비와 같은 틀(작전 · 천명 조건 · 출진 부대 · 보물 · 준비 · 난이도). */
function zhugeBriefing(chapter:number,storyMods?:BattleMods){
  const c=chapters[chapter]!,branch=isZhugeBranch(c.stage.id),bn=branch?branchNode(c.stage.id):undefined;
  if(branch?!branchOpen(c.stage.id):!zhugeUnlocked(chapter)){toast('아직 열리지 않은 전장입니다.');showZhuge();return;}
  zgStage=c.stage.id;
  let difficulty:'normal'|'extreme'='normal',prep:Preparation='survival',officer='',filter='weapon',inspect=campaign.treasures[0]??treasures[0]!.id;
  const normalDone=!branch&&Array.isArray(progress()[c.stage.id+':normal']);
  // 등용 장수: 제갈량전에서 들인 장수를 제갈량 곁에 세운다(일반 2명 · 극한 1명 · 대규모 전투는 더). 제갈량이 나서지 않는 장에는 데려가지 못한다.
  let retinue:string[]=[];
  const retinueOk=c.stage.deployment.forced.includes('z_liang'),retinueCap=()=>storyRetinueCap(c.stage.id,difficulty);
  const retinuePool=()=>{const taken=new Set(c.stage.deployment.forced.map(id=>zhugeName(id)).filter((n):n is string=>!!n));return (loadMeta().recruitedZ??[]).filter(n=>!taken.has(n));};
  const retinueUnits=()=>retinue.slice(0,retinueCap()).map((name,i)=>{const lv=zRetinueLevel(name,c.stage,difficulty);return {id:'rt_'+i,name,unitClass:evolvedClass(officerClass(name),lv),level:lv,xp:0,hp:1,officer:true as const};});
  const retinueMarkup=()=>{if(!retinueOk)return '';const pool=retinuePool(),cap=retinueCap();retinue=retinue.filter(n=>pool.includes(n)).slice(0,cap);
    return `<div class="retinue-pick"><div class="rp-head"><b>등용 장수 · 제갈량 휘하</b><small>${pool.length?`${retinue.length}/${cap}명 · 저마다 싸워 번 레벨로 선다`:'아직 제갈량전에서 등용한 장수가 없다 — 본영 「등용」에서 들인다'}</small></div>${pool.length?`<div class="rp-list">${pool.map(n=>{const on=retinue.includes(n),lv=zRetinueLevel(n,c.stage,difficulty),full=!on&&retinue.length>=cap;return `<button type="button" class="rp-chip ${on?'on':''}" data-retinue="${esc(n)}" ${full?'disabled':''}><span class="rc-face">${cardFace(n)}</span><span><strong>${esc(n)}</strong><small>Lv.${lv} · ${esc(classNames[evolvedClass(officerClass(n),lv)]??'')}</small></span></button>`;}).join('')}</div>`:''}</div>`;};
  const dispatch=(preview=false)=>{const d={...zhugeDeployment(campaign,c.stage,difficulty),...(storyMods?{storyMods:{...storyMods}}:{}),...(retinueOk&&retinue.length?{retinue:retinueUnits()}:{})};
    // 연구(천명으로 여는 영구 강화)는 두 이야기 어디서든 함께 간다.
    if(!preview){const m=loadMeta(),names=c.stage.deployment.forced.map(id=>zhugeName(id)).filter((n):n is string=>!!n),p=deploymentPerks(m,[...names,...Object.keys(m.officerPerks??{})]);if(p)d.perks=p;}return d;};
  const hero=()=>zhugeLevel(campaign,'제갈량',c.stage,difficulty);
  const draw=()=>{
    const previousScroll=$('#modal-content .camp-screen')?$<HTMLDialogElement>('#modal').scrollTop:0;
    const preview=new Session(chapter,difficulty,215,prep,RULES,dispatch(true)),units=preview.state.living().filter(u=>u.side==='player'||u.side==='ally');
    if(!units.some(u=>gearKey(u)===officer))officer=gearKey(units.find(u=>u.side==='player')??units[0]!);
    modal(`<div class="briefing camp-screen"><div class="prep-backdrop" style="${isoBackdrop(16)}"></div><div class="eyebrow">${branch?`선택분기 · ${esc(forkOf(c.stage.id)?.name??'')} · `:''}${esc(c.year)} · 출진 전 정비${heroChip('Z')}</div><h2>${esc(branch?c.stage.title:c.stage.subtitle??c.stage.title)}</h2>${bn?`<div class="bb-foe"><span class="rc-face big">${cardFace(bn.foe.name)}</span><div><b>적장 ${esc(bn.foe.name)}</b><small>${esc(classNames[bn.foe.unitClass]??bn.foe.unitClass)}${bn.boss?' · 갈래 끝 우두머리':''}</small><p>${esc(bn.intro)}</p></div></div>`:''}<p class="camp-mission">${esc(c.stage.synopsis??'')}</p>${conditionsHtml(preview.conditions)}<nav class="brief-tabs" aria-label="출진 전 정비"><button type="button" data-brief-tab=".sortie-deck,.retinue-pick">출진 덱</button><button type="button" data-brief-tab=".camp-workbench">장비</button><button type="button" id="brief-shop" class="shop-tab">상점</button></nav>${retinueMarkup()}${campMarkup(campaign,units,officer,filter,inspect,faceFor,[],c.stage.deployment.forced)}<div class="preparations">${[['survival','생존','체력 +25'],['strategy','책략','MP +18'],['command','지휘','이동 +1']].map(([id,name,desc])=>`<label><input type="radio" name="preparation" value="${id}" ${prep===id?'checked':''}>${name} · ${desc}</label>`).join('')}</div><div class="difficulty">${branch?'<label><input type="radio" name="difficulty" value="normal" checked> 가상 전장 · 일반만</label>':`<label><input type="radio" name="difficulty" value="normal" ${difficulty==='normal'?'checked':''}> 일반</label><label><input type="radio" name="difficulty" value="extreme" ${difficulty==='extreme'?'checked':''} ${normalDone?'':'disabled'}> 극한 · 일반 완료 후</label>`}</div><div class="modal-actions"><button id="brief-back">← 연의 지도</button><button id="brief-shop">상점</button><span>구급약 ${preview.medicine} · 제갈량 Lv.${hero()}</span><button id="deploy" class="primary">출진한다 →</button></div></div>`,false);
    document.querySelectorAll<HTMLButtonElement>('[data-officer]').forEach(b=>b.onclick=()=>{officer=b.dataset.officer!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-gear-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.gearFilter!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-treasure]').forEach(b=>b.onclick=()=>{inspect=b.dataset.treasure!;draw();});
    const cls=()=>units.find(u=>gearKey(u)===officer)?.unitClass;
    $('#equip-treasure')?.addEventListener('click',e=>{const id=(e.currentTarget as HTMLElement).dataset.item||inspect;if(equipSlot(campaign,officer,treasureInfo(id).slot,id,cls())){inspect=id;saveCampaign();draw();}});
    document.querySelectorAll<HTMLButtonElement>('[data-equip-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.equipId!;inspect=id;if(equipSlot(campaign,officer,treasureInfo(id).slot,id,cls())){saveCampaign();toast(`${gearName(id)} 장착`);}draw();});
    briefTabs();
    $('#brief-shop')?.addEventListener('click',()=>openShop('Z',draw,units.map(u=>({key:gearKey(u),name:u.name,unitClass:u.unitClass,level:u.level}))));
    document.querySelectorAll<HTMLButtonElement>('[data-unequip]').forEach(b=>b.onclick=()=>{if(equipSlot(campaign,officer,b.dataset.unequip as GearSlot,'')){saveCampaign();draw();}});
    document.querySelectorAll<HTMLInputElement>('[name=preparation]').forEach(el=>el.onchange=()=>{prep=el.value as Preparation;draw();});
    document.querySelectorAll<HTMLInputElement>('[name=difficulty]').forEach(el=>el.onchange=()=>{difficulty=el.value as 'normal'|'extreme';draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-retinue]').forEach(b=>b.onclick=()=>{const n=b.dataset.retinue!;retinue=retinue.includes(n)?retinue.filter(x=>x!==n):[...retinue,n].slice(0,retinueCap());draw();});
    $('#brief-back').onclick=showZhuge;
    $('#deploy').onclick=()=>{session=new Session(chapter,difficulty,215,prep,RULES,dispatch());activate();persist();};
    $<HTMLDialogElement>('#modal').scrollTop=previousScroll;
  };draw();
}
/** 제갈량전 전투가 끝났을 때: 천명 조건·천명·장수 성장(이름별) → 전투 뒤 장면 → 결과. */
function finishZhuge(){
  const s=session.state,win=s.outcome==='victory',seals=session.seals,id=s.stage.id,chapter=session.chapter,difficulty=s.difficulty;
  const again=session.rewarded;session.rewarded=true;persist();
  sound.sfx(win?'victory':'defeat');
  const news:string[]=[];let growth:ReturnType<typeof zhugeMilestones>=[];let gotTreasures:string[]=[];
  const firstZ=!Array.isArray(progress()[id+':'+difficulty]),branch=isZhugeBranch(id),bn=branchNode(id);
  if(!again)countSortie(id,win);
  if(win){
    // 선택분기 가상 전장: 처음 이기면 금 · 상점 장비 · 소모품, 다시 이기면 금 1/3(zhuge-map.ts).
    if(branch){if(!again)news.push(...grantBranchReward(campaign,id,firstZ));}
    else{const got=awardZhugeTreasures(campaign,id,difficulty);gotTreasures=got.map(t=>t.id);if(got.length)news.push(`보물 ${got.map(t=>`「${t.name}」`).join(' · ')} 얻었다`);
      if(!again){const g=winGold('Z',id,firstZ);if(g)news.push(`금 +${g.toLocaleString()} (제갈량전)`);}}
    saveCampaign();
    try{const p=progress(),k=id+':'+difficulty;p[k]=[...new Set([...(p[k]??[]),...seals])];localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));}catch{/* optional persistence */}
    const m=loadMeta();let sealGain=0,winGain=0;
    if(branch){if(!again&&firstZ){winGain=1;m.mandate+=1;m.earned+=1;}}
    else{recordStory(m,id);sealGain=paySeals(m,progress(),[id]);if(!again){winGain=difficulty==='extreme'?2:1;m.mandate+=winGain;m.earned+=winGain;}}
    saveMeta(m);
    if(winGain+sealGain)news.push(mandateText(winGain,sealGain));
    if(!again){const before={...campaign.retinueXp};growZhuge(campaign,s.living('player'),session.xpEarned,40+zhugeBase(s.stage,'normal')*10);growth=zhugeMilestones(campaign,before,s.living('player'));
      // 제갈량 휘하 등용 장수도 싸워 번 만큼 + 승리 몫을 이름별 기록에 더한다.
      const rt=session.deployment?.retinue??[];if(rt.length){const ups=growRetinue(rt,session.xpEarned,40+zhugeBase(s.stage,'normal')*10);if(ups.length)news.push('등용 장수 성장 · '+ups.join(' · '));}
      saveCampaign();
      // 등용 정산(제갈량전): 공훈 · 명성 · 격파 호감 · 연의 합류·조건 승리·구출·인연.
      const rep=battleReport('Z',s),rc=settleRecruits('Z',battleMerit({firstWin:firstZ,extreme:rep.extreme,newSeals:sealGain,foes:rep.fallen.length}),rep);news.push(...rc.news);}
  }
  if(!again){news.push(...gearNews(settleGear(campaign,s,session.deployment,session.xpEarned)));saveCampaign();}
  const k=zhugeOrder.indexOf(chapter),fk=forkOf(id),nextBranch=fk?fk.nodes[fk.nodes.indexOf(id)+1]:undefined,next=branch?(nextBranch?zhugeIndex(nextBranch):undefined):zhugeOrder[k+1],sc=scriptOf(id),xp={...session.xpEarned};
  const result=()=>{menuOpen=true;
    modal(`<div class="result"><div class="result-character">${win?'승':'패'}</div><h2>${branch?(win?'갈림길 너머를 보았다':'아직 이 길은 멀다'):win?'살아서 다음 길로.':'아직, 끝이 아니다.'}</h2><p>${branch?'선택분기 · ':''}${esc(s.stage.title)} · ${s.turn}턴</p>${branch&&win&&bn?`<p class="zg-outro">${esc(bn.outro)}</p>`:''}${news.length?`<div class="run-news">${news.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${growth.map(x=>`<div class="growth-summary"><b>${esc(x.name)}${x.to>x.from?` · Lv.${x.from} → ${x.to}`:''}</b>${x.evolution?`<p class="evo-news">병종 진화: ${esc(x.evolution.from)} → <b>${esc(x.evolution.to)}</b>${x.evolution.bloom?` · 개화 「${esc(x.evolution.bloom.name)}」 ${esc(x.evolution.bloom.description)}`:''}</p>`:''}${x.signatures.length?`<p>고유특성 해금: ${x.signatures.map(n=>`「${esc(n)}」`).join(' · ')}</p>`:''}</div>`).join('')}${resultSeals(session.sealNames,seals,win)}<p>${win?'전투 기록과 천명이 저장되었습니다.':esc(session.failure)}</p><div class="modal-actions"><button id="zg-retry">다시 도전</button><button id="zg-list">연의 지도</button>${win?(next!==undefined?`<button id="zg-next" class="primary">${branch?'다음 칸 →':'다음 장 →'}</button>`:branch?'':'<button id="zg-ending" class="primary">결말 보기 →</button>'):''}</div></div>`,false);
    $('#zg-retry').onclick=()=>zhugeBriefing(chapter);$('#zg-list').onclick=()=>{if(branch&&win&&nextBranch)zgStage=nextBranch;showZhuge();};
    document.getElementById('zg-next')?.addEventListener('click',()=>{if(branch)zhugeBriefing(next!);else storyScene(next!);});
    revealAfterResult(gotTreasures,'Z',document.querySelector('#modal .result'));
    document.getElementById('zg-ending')?.addEventListener('click',()=>playZhugeEnding());
  };
  void xp;
  setTimeout(()=>{
    if(!win||!sc?.after?.length){result();return;}
    menuOpen=true;modal('<div class="ss-host yeon-host"></div>',false);
    const root=$('.ss-host');void playScenes(root,sc.after,{heading:`제갈량전 · ${sc.title}`,flags:()=>[]}).then(()=>{if(document.contains(root))result();});
  },900);
}
let menuArc=1,menuStage='';
/** 마지막 전투의 요약(첫 화면 '이어하기'에 쓴다): 어디서 · 몇 턴 · 아직 끝나지 않았는가. */
const LAST_KEY='sama-last-battle-v1';
interface LastBattle {where:string;turn:number;ongoing:boolean;at:number}
function lastBattle():LastBattle|undefined{try{const v=JSON.parse(localStorage.getItem(LAST_KEY)??'null') as LastBattle|null;if(v&&typeof v.where==='string'&&Number.isInteger(v.turn))return v;return saveAvailable?{where:'저장된 전투',turn:0,ongoing:true,at:0}:undefined;}catch{return undefined;}}
function battleWhere(){const st=session.state.stage,cat=catalogue.find(c=>c.id===st.id);return session.deployment?.branch?`선택분기 · ${st.title.replace(/^가상 전장 · /,'')}`:session.deployment?.mission?`외전 · ${expeditions.find(m=>m.id===session.deployment!.mission!.id)?.name??'수련'}`:session.deployment?.run&&!session.deployment.scenario?`천명의 원정 · ${session.deployment.run.floor}층`:cat?`${stageNo(cat.id)} ${cat.name}`:st.title;}
/**
 * 이어하기: 가장 마지막에 하던 전투를 '내 차례'에서 다시 잡는다.
 * 적·우군 차례 도중에 저장됐으면 그 차례를 화면 없이 끝까지 돌려, 아군 차례가 막 시작된 자리에서 넘겨준다.
 */
const resumeSaved=()=>{try{const loaded=Session.load(JSON.parse(localStorage.getItem(SAVE_KEY)??'null'));
  // 끝났지만 결과(승리 기록·보상)를 받기 전에 꺼진 전투: 불러와 결과 화면부터 잇는다.
  if(loaded.state.outcome!=='ongoing'&&lastBattle()?.ongoing&&lastBattle()!.at>0){session=loaded;activate();toast('마지막 전투 · 결과를 이어서 받습니다');return;}
  if(loaded.state.outcome!=='ongoing'){toast('마지막 전투는 이미 끝났습니다.');try{const l=lastBattle();if(l)localStorage.setItem(LAST_KEY,JSON.stringify({...l,ongoing:false}));}catch{/* optional */}return;}
  for(let i=0;i<4000;i++){const st=loaded.state;if(st.outcome!=='ongoing'||st.activeDialogue||loaded.activeDuel)break;if(CONTROLLABLE.has(st.currentSide)&&st.living(st.currentSide).some(u=>!u.hasActed))break;if(!loaded.tick())break;}
  session=loaded;activate();persist();toast(`마지막 전투 · ${session.state.turn}턴 · ${CONTROLLABLE.has(session.state.currentSide)?'내 차례부터 이어갑니다':'이어갑니다'}`);}
  // 읽지 못한 기록은 다시 '이어하기'로 내밀지 않는다(단추가 계속 남아 같은 오류만 되풀이하던 문제).
  catch{toast('현재 버전의 저장 기록을 읽지 못했습니다.');try{const l=lastBattle();if(l)localStorage.setItem(LAST_KEY,JSON.stringify({...l,ongoing:false}));}catch{/* optional */}}};
const runHost:RunHost={modal:(html,closable)=>modal(html,closable),showMenu:()=>showMenu(),toast:t=>toast(t),startBattle:(dep,seed)=>{session=new Session(RUN_CHAPTER,'normal',seed,'survival',RULES,dep);activate();persist();},
  startStory:(chapter,dep,seed)=>{session=new Session(chapter,'normal',seed,'survival',RULES,dep);activate();persist();},
  showChronicle:()=>showChronicleLanding(),showChronicleNext:()=>showChronicleNext(),chronicleSummary:()=>chronicleSummary(),showZhuge:()=>showZhuge(),zhugeSummary:()=>zhugeSummary(),showScenario:()=>showScenario(scenarioHost),showTraining:()=>showTraining(),showStoryArchive:()=>showStoryArchive(),showRecruit:()=>showRecruit(),recruitReady:()=>readyCount(),showShop:(back:()=>void)=>openShop('S',back,undefined,true),shopLine:()=>`사마의전 금 ${(campaign.gold?.S??1000).toLocaleString()} · 제갈량전 금 ${(campaign.gold?.Z??1000).toLocaleString()}`,showExpeditions:(tab?:Expedition['kind'])=>showExpeditions(tab),showTroops:()=>showTroopGallery(),showOfficers:()=>showOfficerGallery(),showSlots:(back?:()=>void)=>showSlots(back),
  get resumeSaved(){const l=lastBattle();return l?.ongoing?resumeSaved:undefined;},lastBattle:()=>{const l=lastBattle();return l?.ongoing?{where:l.where,turn:l.turn}:undefined;},
  liveRunBattle:()=>{const s=openRunSession();if(!s)return undefined;const d=s.deployment!;return d.run?{seed:d.run.seed,floor:d.run.floor,kind:d.run.kind}:{seed:d.runStory!.seed,floor:d.runStory!.floor,kind:'story'};},
  backToBattle:()=>{const s=openRunSession();if(s&&s!==session){session=s;activate();return;}menuOpen=false;closeModal();}};

/** 시나리오 모드(본편)가 쓰는 연결: 연의 장의 정비·전투와 가상 전장 출진, 사마의의 성장 기록. */
const scenarioHost:ScenarioHost={modal:(html,closable)=>{menuOpen=true;clearTimeout(aiTimer);sound.scene='camp';modal(html,closable);},contestSound:(kind,critical)=>sound.event({kind:'duel',critical,debate:kind==='debate'}),unitModel:(unitClass,name,side,kind)=>portraitFor({id:'contest',name,unitClass,side} as unknown as Unit,false,kind),showSlots:()=>showSlots(()=>showScenario(scenarioHost)),showMenu:()=>showMenu(),toast:t=>toast(t),
  storyBriefing:(chapter,sc)=>briefing(chapter,undefined,sc),
  startBattle:(dep,seed,difficulty='normal')=>{session=new Session(RUN_CHAPTER,difficulty,seed,'survival',RULES,dep);activate();persist();},
  hero:()=>{const l=levelInfo(campaign.xp.sima_yi??0);return {level:l.level,xp:l.next?Math.min(99,Math.floor(l.xp/l.next*100)):0};},
  addHeroXp:n=>{const before=levelInfo(campaign.xp.sima_yi??0).level;campaign.xp.sima_yi=(campaign.xp.sima_yi??0)+Math.max(0,n);saveCampaign();const after=levelInfo(campaign.xp.sima_yi).level;return [`사마의 경험치 +${n}`,...(after>before?[`레벨 상승 · 사마의 Lv.${after}`]:[])];},
  heroLoadout:()=>campaign.loadouts,
};/** 끝나지 않은 원정 전투: 지금 화면의 것, 없으면 자동 저장된 것. */
function openRunSession(){
  const inRun=(s:Session)=>!!(s.deployment?.run||s.deployment?.runStory)&&!s.deployment?.branch&&s.state.outcome==='ongoing';
  if(hasStarted&&inRun(session))return session;
  try{const s=Session.load(JSON.parse(localStorage.getItem(SAVE_KEY)??'null'));return inRun(s)?s:undefined;}catch{return undefined;}
}
/** 첫 화면: 천명의 원정 본영. 게임의 중심은 원정이다. */
function showMenu(){menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;showHub(runHost);}
/** 연의 회상: 원정에서 이긴 연의 전장(또는 예전 연의 진행에서 깬 전장)을 다시 치른다. */
function replayable(chapter:number){return cleared(chapter)||loadMeta().chronicle.includes(chapters[chapter]!.stage.id);}
function showChronicleLanding(){menuArc=1;menuStage='';showChronicle();}
/** 연의(본편)에서 다음에 이길 장 — 없으면 undefined(32장을 모두 이겼다). */
const nextChronicle=()=>campaignOrder.find(i=>!cleared(i));
/** 연의 진행 요약: 첫 화면·본영에 쓴다. 인장은 장마다 일반 3 + 극한 3. */
function chronicleSummary(){
  const p=progress(),n=nextChronicle(),seals=campaignOrder.reduce((t,i)=>{const id=chapters[i]!.stage.id;return t+new Set(p[id+':normal']??[]).size+new Set(p[id+':extreme']??[]).size;},0);
  return {...(n!==undefined?{next:`${stageNo(chapters[n]!.stage.id)} ${catalogue.find(c=>c.id===chapters[n]!.stage.id)?.name??stories[n]?.[0]??''}`}:{}),won:campaignOrder.filter(cleared).length,total:campaignOrder.length,seals,sealMax:campaignOrder.length*6};
}
/** 연의 이어하기: 다음 장이 있는 편의 진군 경로를 그 장을 고른 채로 연다. */
function showChronicleNext(){const n=nextChronicle();if(n===undefined){showChronicleLanding();return;}const id=chapters[n]!.stage.id;menuArc=Number(id[1]);menuStage=id;showChronicle();}
/**
 * 시나리오 보기: 연의 32장의 이야기를 편별로 모아 다시 본다(싸우지 않고 이야기만).
 * 닿은 장(열린 장)만 볼 수 있고, 이긴 장은 바로 다시 싸울 수도 있다. 본 결말도 여기 모은다.
 */
function showStoryArchive(focus?:number){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;
  const meta=loadMeta(),arcs:Array<[string,string,string]>=[['S1','상편','살아남는 자'],['S2','중편','맞서는 자'],['S3','하편','거머쥐는 자']];
  const row=(i:number)=>{const c=chapters[i]!,open=unlocked(i)||replayable(i),won=cleared(i);
    return `<li class="sa-row ${won?'won':open?'open':'locked'}${focus===i?' focus':''}"><span class="sa-no">${c.stage.id.slice(-2)}</span><span class="sa-title"><strong>${open?esc(catalogue.find(x=>x.id===c.stage.id)?.name??stories[i]?.[0]??c.stage.id):'??? · 아직 닿지 않은 장'}</strong><small>${esc(c.year)}${open?` · 「${esc(stories[i]?.[0]??'')}」 · ${esc(c.label)}`:''}</small></span><span class="sa-state">${won?'◆ 이김':open?'열림':'잠김'}</span><span class="sa-acts"><button data-sa-read="${i}" ${open?'':'disabled'}>이야기 보기</button><button data-sa-fight="${i}" ${won?'':'disabled'} title="${won?'이 장을 다시 싸운다':'이긴 장만 다시 싸울 수 있다'}">다시 싸우기</button></span></li>`;};
  const seenEnd=ALL_ENDINGS.filter(id=>meta.endings.includes(id));
  modal(`<div class="briefing story-archive"><div class="eyebrow">본영 · 연의 32장</div><h2>시나리오 보기</h2><p class="screen-lede">지난 이야기를 다시 보고, 이긴 장은 다시 싸운다.</p>
  <p class="muted">닿은 장은 싸우지 않고 이야기만 다시 볼 수 있다. 이긴 장은 「다시 싸우기」로 일반·극한을 다시 치른다. 아직 닿지 않은 장은 제목도 가려 둔다.</p>
  ${arcs.map(([pre,arc,sub])=>{const list=campaignOrder.filter(i=>chapters[i]!.stage.id.startsWith(pre));const won=list.filter(cleared).length;
    return `<section class="sa-arc"><h3>${arc} <small>${sub} · 이김 ${won}/${list.length}</small></h3><ol class="sa-list">${list.map(row).join('')}</ol></section>`;}).join('')}
  <section class="sa-arc"><h3>본 결말 <small>${seenEnd.length}/${ALL_ENDINGS.length}</small></h3><div class="chronicle-list">${ALL_ENDINGS.map(id=>{const e=endingFor({3:id}),seen=meta.endings.includes(id);return seen?`<button type="button" class="done end-replay" data-end-replay="${id}" title="결말 다시 보기">◆ ${esc(factionText(e.title,loadScenario().run?.faction?.name))} ▶</button>`:'<span>· 아직 보지 못한 결말</span>';}).join('')}</div></section>
  <div class="modal-actions"><button id="sa-back">← 본영</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-sa-read]').forEach(b=>b.onclick=()=>storyScene(Number(b.dataset.saRead),0,undefined,true));
  document.querySelectorAll<HTMLButtonElement>('[data-end-replay]').forEach(b=>b.onclick=()=>replayEnding(b.dataset.endReplay!));
  document.querySelectorAll<HTMLButtonElement>('[data-sa-fight]').forEach(b=>b.onclick=()=>storyScene(Number(b.dataset.saFight)));
  $('#sa-back').onclick=showMenu;
  if(focus!==undefined)document.querySelector('.sa-row.focus')?.scrollIntoView({block:'center'});
}

/** 가지 칸이 열렸나 / 이겼나. */
function branchState(n:MapNode,wins:Set<string>){
  const won=n.kind==='fork'?(n.arc===1?cleared(chapters.findIndex(c=>c.stage.id===FORK_ANCHOR[1])):true):wins.has(n.id);
  const gateOk=(g:string|undefined)=>!g||(g.startsWith('boss:')?wins.has(g):cleared(chapters.findIndex(c=>c.stage.id===g)));
  const prevOk=!n.prev||n.prev.startsWith('fork:')||(n.prev.startsWith('S')?cleared(chapters.findIndex(c=>c.stage.id===n.prev)):wins.has(n.prev));
  // 갈림의 첫 칸은 야망 조건도 맞아야 열린다(조조전의 야망 조건).
  const amb=!n.gate||!n.route||ambitionOk(n.route,ambition());
  return {won,open:gateOk(n.gate)&&prevOk&&amb,gateOk:gateOk(n.gate)&&prevOk,amb};
}
/** 판 위 칸 하나의 상태(줄기: 연의 장 · 가지: 가상 전장). */
function nodeState(n:MapNode,wins:Set<string>){
  if(n.kind==='story'){const i=chapters.findIndex(c=>c.stage.id===n.stage);return {i,won:i>=0&&cleared(i),open:i>=0&&(replayable(i)||unlocked(i))};}
  if(n.kind==='fork'){const o=n.arc===1?cleared(chapters.findIndex(c=>c.stage.id===FORK_ANCHOR[1])):cleared(chapters.findIndex(c=>c.stage.id===FORK_ANCHOR[n.arc]));return {i:-1,won:o,open:o};}
  const b=branchState(n,wins);return {i:-1,...b};
}
/** 가지 칸의 권장 레벨: 갈림 장 권장 레벨에서 칸마다 +1. */
const anchorLevel=(arc:1|2|3)=>encounterLevels[FORK_ANCHOR[arc]]??1;
/**
 * 연의 지도(조조전 Online의 연의 화면 구조): 왼쪽 판에 연의 줄기(붉은 선)와 선택분기 가지(푸른 선),
 * 오른쪽에 고른 칸의 세로 제목 · 승리/출진 · 권장 레벨 · 소요 시간 · 입수 가능 보상 · 이야기 · 입장.
 */
function showChronicleMap(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;
  const p=progress(),wins=branchWins(),stats=nodeStats();
  // 사마의전은 한 판: 상·중·하편의 판을 위에서 아래로 이어 붙인다(편마다 갈림길은 그대로).
  const nodes:MapNode[]=[],joins:Array<[string,string]>=[];let off=0,lastStory='';
  for(const a of [1,2,3] as const){const list=catalogue.filter(c=>c.id.startsWith(`S${a}-`)).map(c=>({id:c.id,name:c.name}));const ns=arcMap(a,list).map(n=>({...n,row:n.row+off}));
    const head=ns.find(n=>n.kind==='fork'&&!n.prev)??ns.find(n=>n.kind==='story');if(lastStory&&head)joins.push([lastStory,head.id]);lastStory=list.at(-1)?.id??lastStory;
    nodes.push(...ns);off=Math.max(...ns.map(n=>n.row))+1.3;}
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const st=(n:MapNode)=>nodeState(n,wins);
  const first=nodes.find(n=>n.kind==='story'&&st(n).open&&!st(n).won)??nodes.filter(n=>n.kind==='story'&&st(n).open).at(-1)??nodes[0]!;
  const sel=byId.get(menuStage)??first;menuStage=sel.id;const arc=sel.arc;menuArc=arc;
  // 판 크기와 칸 좌표(px)
  const CW=176,RH=128,NW=150,NH=104,PAD=34;
  const xOf=(n:MapNode)=>PAD+n.col*CW,yOf=(n:MapNode)=>PAD+n.row*RH;
  const W=Math.max(...nodes.map(n=>xOf(n)))+NW+PAD,H=Math.max(...nodes.map(n=>yOf(n)))+NH+PAD;
  const art=(n:MapNode)=>n.kind==='story'?(storyLocations[n.stage!]?.[0]?.art??Math.max(0,st(n).i)%18):n.kind==='fork'?[0,10,14][n.arc-1]!:(n.route!.length*7+(n.step??0)*3)%18;
  const lines=nodes.filter(n=>n.prev&&byId.has(n.prev)).map(n=>{const a=byId.get(n.prev!)!,x1=xOf(a)+NW/2,y1=yOf(a)+NH/2,x2=xOf(n)+NW/2,y2=yOf(n)+NH/2,on=st(a).won&&st(n).open;
    const d=Math.abs(x1-x2)<4?`M${x1},${y1} L${x2},${y2}`:a.row===n.row?`M${x1},${y1} L${x2},${y2}`:`M${x1},${y1} L${x1},${(y1+y2)/2} L${x2},${(y1+y2)/2} L${x2},${y2}`;
    return `<path class="ym-line ${n.line} ${on?'on':''}" d="${d}"/>`;}).join('')+joins.map(([from,to])=>{const a=byId.get(from),n=byId.get(to);if(!a||!n)return '';const x1=xOf(a)+NW/2,y1=yOf(a)+NH/2,x2=xOf(n)+NW/2,y2=yOf(n)+NH/2;return `<path class="ym-line trunk ${st(a).won?'on':''}" d="M${x1},${y1} L${x1},${(y1+y2)/2} L${x2},${(y1+y2)/2} L${x2},${y2}"/>`;}).join('');
  const nodeHtml=(n:MapNode)=>{const s=st(n),pips=n.kind==='story'?(()=>{const a=new Set(p[n.stage+':normal']??[]),b=new Set(p[n.stage+':extreme']??[]);return [1,2,3].map(k=>`<i class="${a.has(k)?'n':''}${b.has(k)?' x':''}"></i>`).join('');})():n.kind==='fork'?'':`<i class="${s.won?'n':''}"></i>`;
    const label=n.kind==='fork'?`갈림길 · ${n.title}`:n.kind==='story'?n.title:`${n.title}`;
    return `<button class="ym-node ${n.kind} ${n.line} ${s.won?'won':''} ${s.open?'':'locked'} ${n.id===sel.id?'sel':''}" data-node="${esc(n.id)}" style="left:${xOf(n)}px;top:${yOf(n)}px"><span class="ym-pips">${pips}</span><span class="ym-thumb" style="${storyBackdrop(art(n))}">${n.kind==='tale'&&n.tale?`<span class="ym-foe">${cardFace(n.tale.target.name)}</span>`:n.kind==='boss'?`<span class="ym-foe">${cardFace(routeById(n.route)!.region.boss.name)}</span>`:''}${n.kind==='fork'?'<b class="ym-fork-mark">갈림</b>':''}</span><span class="ym-plate">${esc(label)}</span>${s.open?'':'<span class="ym-chain" aria-label="잠김"></span>'}</button>`;};
  // 오른쪽: 고른 칸
  const ss=st(sel),hero=levelInfo(campaign.xp.sima_yi??0).level,[w,t]=stats[sel.id]??[0,0];
  const route=sel.route?routeById(sel.route):undefined;
  let year='',lvl=0,minutes=20,story='',rewards='',lock='',title=sel.title,extra='';
  if(sel.kind==='story'){const c=chapters[ss.i]!,cat=catalogue.find(x=>x.id===sel.stage)!;year=c.year;lvl=encounterLevels[sel.stage!]??1;minutes=Math.max(15,Math.min(60,Math.round(c.map.rows.length*(c.map.rows[0]?.length??20)/22)));
    story=stories[ss.i]?.[1]??cat.objective;const items=treasures.filter(x=>x.stage===sel.stage&&!x.quest);
    rewards=`${items.map(x=>`<span class="ym-item" title="${esc(x.name)} · 첫 승리">${treasureIcon(x.id)}</span>`).join('')}<span class="ym-item text">경험치</span><span class="ym-item text">천명</span><span class="ym-item text">연의 천명 ×3</span>`;
    const names=sealNamesOf(ss.i),a=new Set(p[sel.stage+':normal']??[]),b=new Set(p[sel.stage+':extreme']??[]);
    extra=`<div class="stage-seals"><span>천명 조건 <small>일반 ${a.size}/3 · 극한 ${b.size}/3</small></span><ol>${names.map((nm,k)=>`<li><b>${esc(nm)}</b><i class="${a.has(k+1)?'earned':''}" title="일반">◆</i><i class="x ${b.has(k+1)?'earned':''}" title="극한">◆</i></li>`).join('')}</ol></div>`;
    lock=ss.open?'':'이전 시나리오를 진행해야만 합니다.';}
  else if(sel.kind==='fork'){const f=FATE_POINTS[sel.arc];year=f.year;story=f.prompt;title=f.title;
    const kids=arcRoutes(arc);extra=`<div class="ym-choices"><span>갈라지는 길</span>${kids.map(r=>`<button class="ym-route" data-route-first="${esc(r.tales[0]?.id??'boss:'+r.id)}"><b>${esc(r.choice)}</b><small>${esc(r.name)}${r.after?.[0]&&!routeById(r.after[0])?.history?` · ${esc(routeById(r.after[0])!.choice)} 길에서`:''}${ambitionRule(r.id)?` · <span class="${ambitionOk(r.id,ambition())?'amb-ok':'amb-no'}">${ambitionRule(r.id)}</span>`:''}</small></button>`).join('')}<p class="muted">정사 줄기(붉은 선)는 연의 장으로 이어진다.</p></div>`;
    lock=ss.open?'':`「${catalogue.find(x=>x.id===FORK_ANCHOR[sel.arc])?.name??FORK_ANCHOR[sel.arc]}」을(를) 이기면 갈림길이 열립니다.`;}
  else{year=route!.name;lvl=branchLevel(sel,anchorLevel(arc));minutes=sel.kind==='boss'?30:20;
    story=sel.kind==='tale'?sel.tale!.intro:`${route!.region.name}의 주인 ${route!.region.boss.name}이(가) 마지막 길을 막는다. 이 길의 끝을 본다.`;
    const ending=sel.kind==='boss'&&route!.ending;
    rewards=`<span class="ym-item text">경험치</span><span class="ym-item text">천명</span>${ending?`<span class="ym-item text gold">결말 「${esc(route!.ending!.title)}」</span>`:''}${sel.kind==='tale'?`<span class="ym-item face" title="꺾은 적장">${cardFace(sel.tale!.target.name)}</span>`:''}`;
    const g=sel.gate,bs=branchState(sel,wins);lock=ss.open?'':bs.gateOk&&!bs.amb?`야망 조건이 맞아야 합니다 — ${ambitionRule(sel.route!)} (지금 ${ambition()}). 연의 장 안의 선택으로 야망이 오르내린다.`:g?.startsWith('boss:')?`선택분기 조건이 맞아야 합니다 — 「${esc(routeById(g.slice(5))?.choice??'')}」 길의 끝을 보아야 열린다.`:g?`선택분기 조건이 맞아야 합니다 — 「${esc(catalogue.find(x=>x.id===g)?.name??g)}」을(를) 이겨야 열린다.`:'앞 가상 전장을 이겨야 합니다.';}
  const amb=ambition(),trunkWon=nodes.filter(n=>n.kind==='story'&&st(n).won).length,branchWon=nodes.filter(n=>(n.kind==='tale'||n.kind==='boss')&&wins.has(n.id)).length,branchAll=nodes.filter(n=>n.kind==='tale'||n.kind==='boss').length;
  const stages=nodes.filter(n=>n.kind==='story').length,max=stages*6;
  // 연의 천명 보상: 편마다 세 문턱(9칸)을 한 줄로 보인다. 칸마다 그 편에서 모은 수로 받는다.
  const tiers=([1,2,3] as const).flatMap(a=>{const n=catalogue.filter(c=>c.id.startsWith(`S${a}-`)).length,h=arcSeals(a);return sealTiers(a-1,n).map(t=>({...t,have:h}));});
  const have=([1,2,3] as const).reduce((t,a)=>t+arcSeals(a),0),next=tiers.find(x=>!sealClaimed(campaign,x.key)),ready=tiers.find(x=>!sealClaimed(campaign,x.key)&&x.have>=x.need);
  const nextName=next?sealRewardText(next):undefined;
  modal(`<div class="yeon-map">
  <header class="ym-top"><button id="ym-back" class="ym-backbtn">← 이야기 고르기</button>
    <div class="ym-arcs"><b class="ym-story-name">사마의전</b>${heroChip('S')}</div>
    <div class="ym-ambition" title="야망: 연의 장 안의 선택이 쌓인 값. 붉게(+) 기울면 야망, 푸르게(−) 기울면 충의 — 선택분기의 문을 연다."><small>야망 <b class="${amb>=0?'up':'down'}">${amb>0?'+':''}${amb}</b> · 정사 ${trunkWon}/${stages} · 분기 ${branchWon}/${branchAll}</small><i class="ym-amb"><em style="width:${Math.max(0,50-ambitionPercent(amb))}%"></em><b style="width:${Math.max(0,ambitionPercent(amb)-50)}%"></b></i></div>
    <div class="ym-seals"><span class="ym-seal-head">모은 연의 천명</span><i class="sr-meter"><i style="width:${Math.round(have/max*100)}%"></i></i><b>${have}/${max}</b>
      <details class="ym-reward-list"><summary>보상 목록</summary><div>${tiers.map(x=>`<p class="${sealClaimed(campaign,x.key)?'got':x.have>=x.need?'ready':''}"><b>${x.arc} ${x.need}개</b> 경험치 +${x.xp} · ${esc(sealRewardText(x))}${sealClaimed(campaign,x.key)?' ✓':''}</p>`).join('')}</div></details>
      <span class="ym-next">${next?`다음 보상 ${next.arc} ${next.have}/${next.need}${nextName?` · ${esc(nextName)}`:''}`:'모든 보상을 받았다'}</span>
      <button id="ym-claim" class="${ready?'ready':''}" ${ready?'':'disabled'}>받기</button></div>
    <span class="ym-hero">${growthText()}</span></header>
  <div class="ym-body">
    <section class="ym-board-wrap"><div class="ym-board" style="width:${W}px;height:${H}px">
      <svg class="ym-lines" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${lines}</svg>${nodes.map(nodeHtml).join('')}</div></section>
    <aside class="ym-detail ${sel.line}"><h2 class="ym-vtitle">${esc(title)}</h2><div class="ym-info">
      <div class="ym-info-head"><strong>${esc(year)}</strong>${sel.kind!=='fork'?`<span class="ym-diff">${sel.kind==='story'?'일반 · 극한':'가상'}</span>`:''}</div>
      ${sel.kind!=='fork'?`<div class="ym-stat"><span class="ym-shot" style="${storyBackdrop(art(sel))}"></span><dl><div><dt>승리/출진</dt><dd>${w}/${w+t}</dd></div><div><dt>권장 LV</dt><dd>${lvl}${hero&&hero<lvl?` <small class="warn">(제갈량 ${hero} → ${lvl}로 선다)</small>`:''}</dd></div><div><dt>소요시간</dt><dd>약 ${minutes}분</dd></div></dl></div>
      <h3 class="ym-h">입수 가능 보상 목록</h3><div class="ym-items">${rewards}</div>`:''}
      <p class="ym-story">${esc(story)}</p>${extra}
      <div class="ym-go">${ss.open&&sel.kind!=='fork'?`<button id="ym-enter" class="primary">${sel.kind==='story'?(ss.won?'입장 · 다시 치르기':'입장'):(ss.won?'입장 · 다시 치르기':'입장')}</button>`:lock?`<div class="ym-lock">🔒 ${lock}</div>`:''}</div>
    </div></aside></div>
  <footer class="ym-foot"><button id="ym-home">본영</button><button id="ym-train">수련장</button><button id="ym-recruit">등용${(()=>{const n=readyCount();return n?` <b class="rc-dot">${n}</b>`:'';})()}</button><button id="ym-troops">병종 도감</button>${lastBattle()?.ongoing?'<button id="resume" class="primary">전투 이어하기 →</button>':''}${hasStarted?'<button id="back-battle">현재 전장</button>':''}<button id="save-slots">저장 칸</button></footer></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(b=>b.onclick=()=>{menuStage=b.dataset.node!;showChronicleMap();});
  document.querySelectorAll<HTMLButtonElement>('[data-route-first]').forEach(b=>b.onclick=()=>{menuStage=b.dataset.routeFirst!;showChronicleMap();});
  $('#ym-back').onclick=()=>showStoryPick(runHost,showMenu);$('#ym-home').onclick=showMenu;$('#ym-train').onclick=()=>showTraining();$('#ym-recruit').onclick=()=>showRecruit('S');$('#ym-troops').onclick=()=>showTroopGallery();
  $('#save-slots').onclick=()=>showSlots();$('#back-battle')?.addEventListener('click',()=>{menuOpen=false;closeModal();});$('#resume')?.addEventListener('click',resumeSaved);
  $('#ym-claim').onclick=()=>{if(!ready)return;const got=claimSealTier(campaign,ready,ready.have);if(!got)return;saveCampaign();sound.event({kind:'victory'});
    toast(`천명 보상 · 연의 장수 모두 경험치 +${got.xp} · ${got.text}`);showChronicleMap();};
  document.getElementById('ym-enter')?.addEventListener('click',()=>{if(sel.kind==='story')storyScene(ss.i);else branchBriefing(sel);});
  // 고른 칸이 보이게 판을 굴린다.
  const el=document.querySelector<HTMLElement>('.ym-node.sel'),wrap=document.querySelector<HTMLElement>('.ym-board-wrap');if(el&&wrap){wrap.scrollTop=Math.max(0,el.offsetTop-wrap.clientHeight/2+NH/2);wrap.scrollLeft=Math.max(0,el.offsetLeft-wrap.clientWidth/2+NW/2);}
}
/** 가지(가상 전장) 출진 전: 서사와 함께 갈 장수. 연의 칸의 레벨로 나선다. 등용 장수는 편이 깊을수록 더 많이(상편 2 · 중편 4 · 하편 6). */
function branchParty(arc:1|2|3=1){
  const lv=levelInfo(campaign.xp.sima_yi??0).level;
  const mates=(['sima_lang','sima_fang','cao_zhen'] as const).map((id,k)=>{const l=levelInfo(campaign.xp[id]??0).level;return {id:'of'+(k+1),name:officerNames[id]!,unitClass:storyClassAt(id,l),level:l,xp:0,hp:1,officer:true as const};});
  const rec=(loadMeta().recruited??[]).slice(0,2*arc).map((name,k)=>({id:'of'+(k+4),name,unitClass:evolvedClass(officerClass(name),retinueLevel(name)),level:retinueLevel(name),xp:0,hp:1,officer:true as const}));
  return [{id:'sima_yi',name:'사마의',unitClass:evolvedClass('strategist',lv),level:lv,xp:0,hp:1,hero:true as const},...mates,...rec];
}
function branchBriefing(n:MapNode){
  const route=routeById(n.route)!,foe=n.kind==='tale'?n.tale!.target:route.region.boss,party=branchParty(n.arc),lvl=branchLevel(n,anchorLevel(n.arc));
  modal(`<div class="briefing branch-brief"><div class="eyebrow">가상 전장 · ${esc(route.name)}</div><h2>${esc(n.title)}</h2>
  <div class="bb-foe"><span class="rc-face big">${cardFace(foe.name)}</span><div><b>적장 ${esc(foe.name)}</b><small>${esc(classNames[foe.unitClass]??foe.unitClass)} · 권장 Lv.${lvl}</small><p>${esc(n.kind==='tale'?n.tale!.intro:route.detail)}</p></div></div>
  <h3>함께 가는 장수 <small>연의에서 키운 레벨 그대로 · 등용 장수 최대 2명</small></h3><div class="bb-party">${party.map(u=>`<span class="rp-chip on"><span class="rc-face">${cardFace(u.name)}</span><span><strong>${esc(u.name)}</strong><small>Lv.${u.level} · ${esc(classNames[u.unitClass]??u.unitClass)}</small></span></span>`).join('')}</div>
  <div class="run-actions"><button id="bb-go" class="primary">출진 ▶</button><button id="bb-back">← 연의 지도</button></div></div>`,false);
  $('#bb-back').onclick=showChronicleMap;
  $('#bb-go').onclick=()=>{const seed=[...n.id].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7);
    const ref:RunBattleRef={seed,floor:branchFloor(n),kind:n.kind==='boss'?'boss':'tale',party,relics:[],route:{...n.routePath} as RunBattleRef['route'],...(n.kind==='tale'?{tale:n.tale!.id}:{}),enemyBase:lvl};
    const d:Deployment={levels:{sima_yi:party[0]!.level,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},...(campaign.loadouts?{loadouts:structuredClone(campaign.loadouts)}:{}),...(gearDeployment(campaign).gearLevels?{gearLevels:gearDeployment(campaign).gearLevels!}:{}),gearRules:2,run:ref,branch:n.id};
    const perks=deploymentPerks(loadMeta(),['사마의',...Object.keys(loadMeta().officerPerks??{})]);if(perks)d.perks=perks;
    session=new Session(RUN_CHAPTER,'normal',seed,'survival',RULES,d);activate();persist();};
}
/** 가지 전투가 끝났을 때: 연의 칸 성장 · 이긴 기록 · 결말. */
function finishBranchBattle(){
  if(resultShown)return;resultShown=true;const s=session.state,win=s.outcome==='victory',id=session.deployment!.branch!,ref=session.deployment!.run!;
  sound.sfx(win?'victory':'defeat');countSortie(id,win);
  const news:string[]=[];
  if(win){recordBranchWin(id);const m=loadMeta();
    if(ref.tale&&!m.tales.includes(ref.tale))m.tales.push(ref.tale);
    const route=routeById(id.startsWith('boss:')?id.slice(5):undefined);if(route?.act===3&&!m.endings.includes(route.id)){m.endings.push(route.id);news.push(`결말 「${route.ending?.title??route.name}」을(를) 보았다`);}
    m.mandate+=1;m.earned+=1;saveMeta(m);news.push('천명 +1');
    const map:Record<string,string>={sima_yi:'sima_yi',of1:'sima_lang',of2:'sima_fang',of3:'cao_zhen'};const before=structuredClone(campaign);
    for(const [uid,g] of Object.entries(session.xpEarned)){const who=map[uid];if(who&&g>0)campaign.xp[who]=(campaign.xp[who]??0)+g;}
    const bonus=60+ref.floor*10;for(const id2 of OFFICERS)campaign.xp[id2]=(campaign.xp[id2]??0)+bonus;news.push(...growRetinue(ref.party.filter(u=>/^of[45]$/.test(u.id)),session.xpEarned,bonus));saveCampaign();news.push(`연의 장수 모두 경험치 +${bonus}`);
    news.push(...growthMilestones(before,campaign).filter(x=>x.to>x.from).map(x=>`${officerNames[x.id]} Lv.${x.from} → ${x.to}`));}
  setTimeout(()=>{menuOpen=true;modal(`<div class="result"><div class="result-character">${win?'승':'패'}</div><h2>${win?'갈림길 너머를 보았다':'아직 이 길은 멀다'}</h2><p>${esc(s.stage.title)}</p>${news.length?`<div class="run-news">${news.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
    <div class="run-actions"><button id="br-map" class="primary">연의 지도로</button><button id="br-retry">다시 도전</button></div></div>`,false);
    $('#br-map').onclick=showChronicleMap;$('#br-retry').onclick=()=>{const n=arcMap(Number(id.startsWith('boss:')?routeById(id.slice(5))!.act:routeById(ref.route?.[3]??ref.route?.[2]??ref.route?.[1])?.act??1) as 1|2|3,[]).find(x=>x.id===id);if(n)branchBriefing(n);else showChronicleMap();};},900);
}
/** 편별 인장 누적 보상 띠: 지금 편에서 모은 인장과 세 문턱(받기 · 받음 · 남음). */
function arcSeals(arc:number){const p=progress();return campaignOrder.filter(i=>chapters[i]!.stage.id.startsWith(`S${arc}-`)).reduce((t,i)=>{const id=chapters[i]!.stage.id;return t+new Set(p[id+':normal']??[]).size+new Set(p[id+':extreme']??[]).size;},0);}
function showChronicle(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;
  const p=progress(),names=['살아남는 자','맞서는 자','거머쥐는 자'];
  if(menuArc===0){
    const subtitles=['소년과 피난 · 출사와 시험 · 한중과 외교','위의 방패 · 군략의 대결 · 위수와 오장원','원정과 구원 · 권력과 후계'];
    const gateArt=['chronicle/arc-1-ink-v1.webp','chronicle/arc-2-ink-v1.webp','chronicle/arc-3-ink-v1.webp'];
    const gates=[1,2,3].map((arc,index)=>{const stages=catalogue.filter(c=>c.id.startsWith(`S${arc}-`)),won=stages.filter(c=>{const i=chapters.findIndex(x=>x.stage.id===c.id);return i>=0&&cleared(i);}),last=won.at(-1),rate=Math.round(won.length/stages.length*100);return `<article class="chronicle-gate"><div class="chronicle-gate-art" style="background-image:url('${gateArt[index]}');background-size:cover;background-position:36% 50%"><span>제 ${['일','이','삼'][index]}편</span><strong>${names[index]}</strong></div><div class="chronicle-gate-copy"><div><small>${subtitles[index]}</small><h3>${['상편','중편','하편'][index]}</h3><p>달성률 <b>${rate}%</b><i style="--rate:${rate}%"></i></p><em>${last?`최근 기록 · ${esc(last.name)}`:'아직 기록 없음 · 첫 장부터 시작'}</em></div><button data-chronicle-arc="${arc}" class="${arc===1?'primary':''}">입장 <span>→</span></button></div></article>`;}).join('');
    modal(`<div class="chronicle-landing"><header><div><div class="eyebrow">연의 · 32장</div><h2>연의 지도</h2><p class="screen-lede">한 편을 고르면 장별 진군 경로가 열린다.</p></div><div class="growth-summary">${growthText()}<br>보물 ${campaign.treasures.length}점</div></header><section class="chronicle-gates">${gates}</section><footer><button id="chronicle-run-home">← 본영</button>${lastBattle()?.ongoing?'<button id="resume" class="primary">전투 이어하기 →</button>':''}<small>각 편의 전장은 앞 장을 마치면 차례로 열립니다.</small></footer></div>`,false);
    document.querySelectorAll<HTMLButtonElement>('[data-chronicle-arc]').forEach(b=>b.onclick=()=>{menuArc=Number(b.dataset.chronicleArc);menuStage='';showChronicle();});
    $('#chronicle-run-home').onclick=showMenu;
    $('#resume')?.addEventListener('click',resumeSaved);
    return;
  }
  showChronicleMap();
}
function readStore(key:string){try{return localStorage.getItem(key);}catch{return null;}}
function showSlots(back:()=>void=showMenu){
  const battle=hasStarted&&session.state.outcome==='ongoing';
  const where=()=>{if(battle){const c=chapters[session.chapter]!;return `전투 중 · ${session.deployment?.run?`원정 ${session.deployment.run.floor}층`:c.stage.subtitle??c.stage.title} · ${session.state.turn}턴`;}
    return '본영';};
  const rows=Array.from({length:SLOT_COUNT},(_,i)=>{const raw=readStore(slotKey(i+1)),full=readFull(raw),old=full?undefined:readSlot(raw);
    const label=full?`<b>${full.meta.where}</b><small>${agoText(full.meta.at)}${full.meta.hero?` · 사마의 Lv.${full.meta.hero}`:''}${full.meta.mandate!==undefined?` · 천명 ${full.meta.mandate}`:''} · 진행 전체</small>`:old?`<b>${old.meta.title}</b><small>${slotLabel(old)} · 전투만</small>`:'<small>비어 있음</small>';
    return `<div class="slot-row"><div><strong>${i+1}번 칸</strong>${label}</div><div class="slot-actions"><button data-slot-save="${i+1}" class="${full||old?'':'primary'}">여기에 저장</button>${full||old?`<button data-slot-load="${i+1}" class="primary">불러오기</button><button data-slot-clear="${i+1}" aria-label="${i+1}번 칸 지우기">지우기</button>`:''}</div></div>`;}).join('');
  modal(`<div class="briefing save-screen"><div class="eyebrow">기록</div><h2>저장·불러오기</h2><p class="screen-lede">지금 진행을 칸에 저장하고, 저장한 칸에서 다시 시작한다.</p>
    <ul class="save-help"><li><b>자동 저장</b> 전투는 행동마다 저절로 저장된다. 첫 화면의 「이어하기」가 그것을 연다.</li>
    <li><b>저장 칸 ${SLOT_COUNT}개</b> 지금 이 순간의 <em>전체</em>(사마의전·제갈량전 진행·연구·천명·보물·장수 성장·진행 중 전투)를 통째로 담는다. 갈림길 앞에서 저장해 두고, 일이 틀어지면 불러온다.</li>
    <li>쓰는 저장 공간: <b>${(storageUse().total/1048576).toFixed(1)}MB</b> · 브라우저마다 다르지만 보통 5MB 안팎까지 쓸 수 있다.</li>
    <li>지금: <b>${where()}</b></li></ul>${rows}<div class="modal-actions"><button id="slots-back">← 돌아가기</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-slot-save]').forEach(b=>b.onclick=()=>{
    if(battle)persist();
    const m=loadMeta(),rec:FullSlot={full:1,meta:{title:where(),where:where(),at:Date.now(),hero:levelInfo(campaign.xp.sima_yi??0).level,mandate:m.mandate},keys:snapshotKeys()};
    try{localStorage.setItem(slotKey(Number(b.dataset.slotSave)),JSON.stringify(rec));toast(`${b.dataset.slotSave}번 칸에 저장했습니다.`);}catch{toast('이 브라우저에서는 저장할 수 없습니다(저장 공간 부족).');}
    showSlots(back);});
  document.querySelectorAll<HTMLButtonElement>('[data-slot-load]').forEach(b=>b.onclick=()=>{
    const raw=readStore(slotKey(Number(b.dataset.slotLoad))),full=readFull(raw);
    if(full){try{restoreKeys(full.keys);toast(`${b.dataset.slotLoad}번 칸을 불러옵니다…`);setTimeout(()=>location.reload(),400);}catch{toast('불러오지 못했습니다.');}return;}
    const r=readSlot(raw);try{session=Session.load(r!.save as Parameters<typeof Session.load>[0]);activate();toast(`${b.dataset.slotLoad}번 칸을 불러왔습니다.`);}catch{toast('이 칸은 현재 버전에서 읽을 수 없습니다.');}});
  document.querySelectorAll<HTMLButtonElement>('[data-slot-clear]').forEach(b=>b.onclick=()=>{try{localStorage.removeItem(slotKey(Number(b.dataset.slotClear)));}catch{/* nothing to clear */}showSlots(back);});
  $('#slots-back').onclick=()=>{if(battle){$<HTMLDialogElement>('#modal').close();menuOpen=false;render();pump();}else back();};
}

function briefing(chapter:number,expeditionId?:string,scenario?:ScenarioDeployment,storyMods?:BattleMods){
  const expedition=expeditions.find(m=>m.id===expeditionId);
  // 시나리오 모드의 연의 장은 이야기 다음에 반드시 이 정비를 거친다(회상 잠금과 무관).
  // 아직 열리지 않은 장: 조용히 멈추면 이야기 무대가 그대로 남는다. 연의 목록으로 돌려보낸다.
  if(!scenario&&(expedition?!canExpedition(campaign,expedition.id):!(replayable(chapter)||unlocked(chapter)))){toast('아직 열리지 않은 전장입니다.');showChronicle();return;}
  const c=expedition?{...chapters[7]!,year:'외전 · 권장 Lv.'+expedition.level,stage:{...chapters[7]!.stage,subtitle:expedition.name}}:chapters[chapter]!,intro=chapter===2,escape=chapter===0;
  let supports=[...supportOptions.slice(0,2)];
  const recommendation=expedition?recommendExpeditionSupport(expedition.id):undefined;
  let extras:string[]=[];
  // 연의(본편)에만: 등용한 장수를 데려간다(일반 2명 · 극한 1명). 사마의 레벨−1로 선다.
  let retinue:string[]=[];
  // 홀로 서는 장(꿈속 대결·건업 설전)에는 데려가지 못한다.
  const retinueCap=()=>storyRetinueCap(c.stage.id,difficulty),retinueOk=!scenario&&!expedition&&!soloStage(c.stage);
  const retinueCost=()=>retinueOk?retinueUnits().reduce((n,u)=>n+unitCost(u.unitClass)+(u.extraCost??0),0):0;
  /** 사마의전의 다른 나라 장수(위가 아닌 장수)는 COST가 더 든다. */
  const foreignCost=(name:string)=>officerFaction(name)==='위'?0:FOREIGN_COST;
  const retinueUnits=()=>retinue.slice(0,retinueCap()).map((name,i)=>({id:'rt_'+i,name,unitClass:evolvedClass(officerClass(name),retinueLevel(name)),level:retinueLevel(name),xp:0,hp:1,officer:true as const,...(foreignCost(name)?{extraCost:foreignCost(name)}:{})}));
  const dispatch=(preview=false)=>{const d=deployment(campaign,true);if(!expedition)d.wide=2;if(scenario)d.trial=1;if(scenario)d.scenario=structuredClone(scenario);if(retinueOk&&retinue.length)d.retinue=retinueUnits();if(storyMods&&!scenario&&!expedition)d.storyMods={...storyMods};
    // 연구(로그라이크의 영구 강화)는 연의·회상·수련 어디서든 함께 간다.
    if(!preview){const m=loadMeta(),p=deploymentPerks(m,['사마의',...Object.keys(m.officerPerks??{})]);if(p)d.perks=p;}if(!expedition&&extras.length)d.extraOfficers=pickExtras(c.stage,c.map,extras,difficulty,d.levels,retinueCost());if(expedition)d.mission={id:expedition.id,runId:preview?'preview':crypto.randomUUID(),version:4,balance:1,supportClasses:[...supports]};return d;};
  const mission=chapter===7?'사마의와 조진을 생존시키고 양앙을 포함한 전초 수비대 7부대를 모두 격퇴하십시오. 수비대장만 쓰러뜨려서는 끝나지 않습니다.':chapter===6?'조조를 보호하며 마초를 격퇴한 뒤, 사마의 또는 조진으로 관문 안 금빛 구역을 점령하십시오. 조조·사마의·조진 퇴각 시 패배합니다.':chapter===5?'수송대 두 부대 중 최소 한 부대를 선택한 동쪽 출구로 호위하십시오. 두 수송대가 모두 소실되거나 사마의·조진이 퇴각하면 실패합니다.':chapter===4?'진궁·여포·주유를 차례로 격파한 다음, 전차의 방해를 뚫고 황제 옆 금빛 칸에 도달하십시오.':chapter===3?'길잡이와 대화해 탈출로를 정하고, 추격 압박이 한계에 닿기 전에 형제 모두 선택한 출구에 도착하십시오.':intro?'사마의로 창고에 도달한 뒤 민중에게 인접해 무장시키고 습격대를 격퇴하십시오.':escape?'두 형제 모두 남문에 도착하고 통행료 1,000전을 지불하십시오.':'수비대장을 격퇴한 뒤 본대로 중앙 성채를 점령하십시오. 경쟁 우군 선점 시 패배합니다.';
  let officer=c.stage.deployment.forced[0]!,filter='weapon',inspect=campaign.treasures[0]??treasures[0]!.id,prep:Preparation='survival',difficulty:'normal'|'extreme'='normal';
  /** 난이도가 바뀌어 등용 장수만으로 COST가 넘치면 뒤에서부터 내린다. */
  const trimRetinue=()=>{const lv=deployment(campaign,true).levels;retinue=retinue.slice(0,retinueCap());while(retinue.length){const sh=storyCostSheet(c.stage,[],lv,difficulty,retinueUnits());if(sh.used<=sh.cap)break;retinue.pop();}};
  const costLeft=()=>{const lv=deployment(campaign,true).levels;return storyCostSheet(c.stage,pickExtras(c.stage,c.map,extras,difficulty,lv,retinueCost()),lv,difficulty,retinueUnits()).left;};
  /** 출진 부대 카드에 붙일 COST(장수 id·등용 장수 rt_n → COST). */
  const unitCosts=()=>{const lv=deployment(campaign,true).levels,rt=retinueUnits(),out:Record<string,number>={};
    for(const r of storyCostSheet(c.stage,pickExtras(c.stage,c.map,extras,difficulty,lv,retinueCost()),lv,difficulty,rt).rows){const id=r.id.startsWith('rt:')?rt.find(u=>'rt:'+u.name===r.id)?.id:r.id;if(id)out[id]=r.cost;}return out;};
  /** 등용 장수 칸: 본영 '등용'에서 들인 장수 가운데 고른다(이 장에 이미 나오는 이름은 빠진다). */
  const retinueMarkup=()=>{if(!retinueOk)return '';const taken=stageOfficerNames(c.stage),all=loadMeta().recruited??[],pool=all.filter(n=>!taken.has(n)),busy=all.filter(n=>taken.has(n)),cap=retinueCap();
    retinue=retinue.filter(n=>pool.includes(n)).slice(0,cap);trimRetinue();
    return `<div class="retinue-pick"><div class="rp-head"><b>등용 장수</b><small>${pool.length?`${retinue.length}/${cap}명 · 저마다 싸워 번 레벨로 선다 · 같은 COST 안에서 고른다`:'아직 등용한 장수가 없다 — 본영 「등용」에서 들인다'}</small></div>${pool.length?`<div class="rp-list">${pool.map(n=>{const on=retinue.includes(n),cost=unitCost(evolvedClass(officerClass(n),retinueLevel(n)))+foreignCost(n),full=!on&&(retinue.length>=cap||cost>costLeft());return `<button type="button" class="rp-chip ${on?'on':''}" data-retinue="${esc(n)}" ${full?'disabled':''}><b class="sortie-cost" title="출진 COST ${cost}"><small>COST</small>${cost}</b><span class="rc-face">${cardFace(n)}</span><span><strong>${esc(n)}</strong><small>Lv.${retinueLevel(n)} · ${esc(classNames[evolvedClass(officerClass(n),retinueLevel(n))]??'')}${foreignCost(n)?` · <em class="foreign">${esc(officerFaction(n))} 출신 COST +${foreignCost(n)}</em>`:''}</small></span></button>`;}).join('')}${busy.map(n=>`<button type="button" class="rp-chip busy" disabled title="이 장의 이야기에 이미 나오는 장수라 따로 데려가지 않는다"><span class="rc-face">${cardFace(n)}</span><span><strong>${esc(n)}</strong><small>이 장에 이미 나온다</small></span></button>`).join('')}</div>`:busy.length?`<div class="rp-list">${busy.map(n=>`<button type="button" class="rp-chip busy" disabled><span class="rc-face">${cardFace(n)}</span><span><strong>${esc(n)}</strong><small>이 장에 이미 나온다</small></span></button>`).join('')}</div>`:''}</div>`;};
  /** 승급 포인트(promotion.ts): 다음 승급 레벨이 4레벨 안인 사씨 일가 장수를 포인트로 곧장 승급시킨다. */
  const promoMarkup=()=>{const pts=promotionPoints(progress(),campaign),offers=PROMO_OFFICERS.map(id=>promotionOffer(campaign,id)).filter(o=>!!o);
    return `<div class="promo-pick"><div class="rp-head"><b>승급 포인트 ${pts.left}</b><small>천명 조건 하나마다 1 · 극한 승리마다 1 더 · 다음 승급까지 ${PROMO_REACH}레벨 안이면 모자란 레벨만큼 써서 곧장 승급</small></div>${offers.length?`<div class="rp-list">${offers.map(o=>`<button type="button" class="rp-chip" data-promote="${o.officer}" ${pts.left<o.cost?'disabled':''}><b>${officerNames[o.officer]}</b><small>${classNames[o.from]??o.from} → ${classNames[o.to]??o.to} · Lv.${o.level}→${o.need} · ${o.cost}포인트</small></button>`).join('')}</div>`:'<small class="muted">지금 조기 승급할 장수가 없다(다음 승급까지 레벨이 많이 남았거나 이미 마지막 병종).</small>'}</div>`;};
  /** 출진 장수: 필수(잠김) + 선택(난이도별 인원 제한). */
  const sortieMarkup=()=>{if(retinueOk)trimRetinue();const {allowed,capacity}=optionalOfficers(c.stage,c.map),limit=Math.min(capacity,storySortieLimit(difficulty));
    const lv=deployment(campaign,true).levels,sheet=storyCostSheet(c.stage,pickExtras(c.stage,c.map,extras,difficulty,lv,retinueCost()),lv,difficulty,retinueUnits());
    const costOf=(id:string)=>unitCost(storyClassAt(id,lv[id]??1));
    const chosen=(id:string)=>sheet.rows.some(r=>r.id===id&&!r.forced);
    const blocked=(id:string)=>!chosen(id)&&(limit===0||costOf(id)>sheet.left);
    const ratio=Math.min(100,Math.round(sheet.used/sheet.cap*100));
    const deck=[...sheet.rows.map(r=>{const rt=r.id.startsWith('rt:'),name=rt?r.id.slice(3):officerNames[r.id]??r.id;return {name,cost:r.cost,forced:r.forced,cls:classNames[r.unitClass]??''};})];
    const deckRow=`<div class="deck-row" aria-label="출진 부대 덱">${deck.map(d=>`<div class="deck-card${d.forced?' forced':''}"><span class="dc-face">${cardFace(d.name)}</span><b>${esc(d.name)}</b><small>${esc(d.cls)}</small><i class="dc-cost">${d.cost}</i></div>`).join('')}${Array.from({length:Math.max(0,Math.min(3,Math.floor(sheet.left/2)))},()=>'<div class="deck-card empty"><span>빈 자리</span></div>').join('')}</div>`;
    return `<section class="sortie-picker sortie-deck"><h3 class="deck-title">출진 부대 덱 <small>카드를 눌러 넣고 뺀다 · COST 안에서</small></h3>${deckRow}<div class="prep-cost-board"><div class="prep-cost-title"><small>${difficulty==='extreme'?'극한 정예 편성':'일반 편성'}</small><strong>COST 중심 출진</strong></div><span><small>출진 부대</small><b>${sheet.rows.length}</b><em> / ${c.stage.deployment.forced.length+limit+(retinueOk?retinueCap():0)}</em></span><span><small>사용 COST</small><b class="${sheet.used>sheet.cap?'over':''}">${sheet.used}</b></span><span><small>남은 COST</small><b>${sheet.left}</b></span><span><small>COST 상한</small><b>${sheet.cap}</b></span><i class="prep-cost-meter" style="--used:${ratio}%"></i></div><div class="sortie-toolbar"><p>장수마다 COST가 다르다(동그라미 숫자). 필수 장수 몫을 먼저 빼고, 남은 COST 안에서 더 데려간다.</p>${allowed.length?'<button id="auto-sortie" type="button">COST 자동 편성</button><button id="clear-sortie" type="button">선택 해제</button>':''}</div><div class="sortie-cards">
    ${c.stage.deployment.forced.map(id=>`<span class="sortie-chip forced"><b class="sortie-cost" title="출진 COST ${costOf(id)}"><small>COST</small>${costOf(id)}</b><span><strong>${officerNames[id]??id}</strong><small>Lv.${levelInfo(campaign.xp[id]??0).level} · ${classNames[storyClassAt(id,lv[id]??1)]??''}</small><em>필수 출진</em></span></span>`).join('')}
    ${allowed.map(id=>`<label class="sortie-chip${blocked(id)?' blocked':''}"${blocked(id)?` title="${limit===0?'출진 칸이 남지 않았다':`남은 COST ${sheet.left} · 이 장수 COST ${costOf(id)}`}"`:''}><input type="checkbox" data-extra="${id}" ${chosen(id)?'checked':''} ${blocked(id)?'disabled':''}><b class="sortie-cost" title="출진 COST ${costOf(id)}"><small>COST</small>${costOf(id)}</b><span><strong>${officerNames[id]??id}</strong><small>Lv.${levelInfo(campaign.xp[id]??0).level} · ${classNames[storyClassAt(id,lv[id]??1)]??''}</small><em>${chosen(id)?'출진 선택':'대기'}</em></span></label>`).join('')}</div>
    <small class="cost-rule">병종 COST: 1단 2 · 2단 3 · 3단 4 · 4단 6 · 기마/코끼리 +1${sheet.rows.filter(r=>r.forced).reduce((n,r)=>n+r.cost,0)>=sheet.cap?' · 필수 장수만으로 상한 도달':''}</small>${promoMarkup()}${retinueMarkup()}</section>`;};
  const draw=()=>{
    const previousScroll=$('#modal-content .camp-screen')?$<HTMLDialogElement>('#modal').scrollTop:0;
    const preview=new Session(chapter,difficulty,215,prep,RULES,dispatch(true));
    const units=preview.state.living().filter(u=>u.side==='player'||u.side==='ally');
    modal(`<div class="briefing camp-screen"><div class="prep-backdrop" style="${isoBackdrop(expedition?6:16)}"></div><div class="eyebrow">${c.year} · 출진 전 정비${expedition?'':heroChip('S')}</div><h2>${c.stage.subtitle}</h2><p class="camp-mission">${expedition?trialGoalText(expedition.id):mission}</p>${conditionsHtml(preview.conditions)}<nav class="brief-tabs" aria-label="출진 전 정비"><button type="button" data-brief-tab=".sortie-deck,.retinue-pick">출진 덱</button><button type="button" data-brief-tab=".camp-workbench">장비</button><button type="button" id="brief-shop" class="shop-tab">상점</button></nav>${expedition?`<fieldset class="support-picker"><legend>지원 병종 편성 · 두 부대 선택</legend>${supports.map((kind,i)=>`<label>지원 ${i+1}<select data-support="${i}">${supportOptions.map(k=>`<option value="${k}" ${kind===k?'selected':''}>${classNames[k]}</option>`).join('')}</select><small>${troopAdvice[kind]}</small></label>`).join('')}<div class="support-recommendation"><b>목표·지형에 맞는 편성</b><p>${recommendation!.classes.map(k=>classNames[k]).join(' + ')} · ${recommendation!.reason}</p><button id="recommend-support" type="button">추천 병종으로 편성</button><small>추천은 선택 사항입니다. 병종은 전투마다 다시 고를 수 있습니다.</small></div>${supportWarnings(units).map(t=>`<p class="composition-note">${t}</p>`).join('')}</fieldset>`:''}${expedition?`<p class="trial-objective">${growthAdvice(campaign,expedition.level)}<br>지원 부대는 권장 레벨과 사마의 레벨 +1 중 낮은 레벨로 출진합니다.</p>`:''}${expedition?'':sortieMarkup()}${campMarkup(campaign,units,officer,filter,inspect,faceFor,scenario?.relics,c.stage.deployment?.forced??[],expedition?{}:unitCosts())}<div class="preparations">${[['survival','생존','체력 +25'],['strategy','책략','MP +18'],['command','지휘','이동 +1']].map(([id,name,desc])=>`<label><input type="radio" name="preparation" value="${id}" ${prep===id?'checked':''}>${name} · ${desc}</label>`).join('')}</div><div class="difficulty"><label><input type="radio" name="difficulty" value="normal" ${difficulty==='normal'?'checked':''}> 일반</label><label><input type="radio" name="difficulty" value="extreme" ${difficulty==='extreme'?'checked':''} ${!expedition&&cleared(chapter)?'':'disabled'}> 극한 · 일반 완료 후</label></div><div class="modal-actions"><button id="brief-back">← ${scenario?'장 목록':expedition?'수련 · 보물 인연':'연의 회상'}</button><button id="brief-shop">상점</button>${scenario?'<button id="brief-camp">← 진영으로</button>':''}<span>구급약 2 · ${growthText()}</span><button id="deploy" class="primary">출진한다 →</button></div></div>`,false);
    document.querySelectorAll<HTMLButtonElement>('[data-officer]').forEach(b=>b.onclick=()=>{officer=b.dataset.officer!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-gear-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.gearFilter!;draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-treasure]').forEach(b=>b.onclick=()=>{inspect=b.dataset.treasure!;draw();});
    const cls=()=>units.find(u=>gearKey(u)===officer)?.unitClass;
    $('#equip-treasure')?.addEventListener('click',e=>{const id=(e.currentTarget as HTMLElement).dataset.item||inspect;if(equipSlot(campaign,officer,treasureInfo(id).slot,id,cls())){inspect=id;saveCampaign();draw();}});
    document.querySelectorAll<HTMLButtonElement>('[data-equip-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.equipId!;inspect=id;if(equipSlot(campaign,officer,treasureInfo(id).slot,id,cls())){saveCampaign();toast(`${gearName(id)} 장착`);}draw();});
    briefTabs();
    $('#brief-shop')?.addEventListener('click',()=>openShop('S',draw,units.map(u=>({key:gearKey(u),name:u.name,unitClass:u.unitClass,level:u.level}))));
    document.querySelectorAll<HTMLButtonElement>('[data-unequip]').forEach(b=>b.onclick=()=>{if(equipSlot(campaign,officer,b.dataset.unequip as GearSlot,'')){saveCampaign();draw();}});
    document.querySelectorAll<HTMLInputElement>('[name=preparation]').forEach(el=>el.onchange=()=>{prep=el.value as Preparation;draw();});
    document.querySelectorAll<HTMLInputElement>('[name=difficulty]').forEach(el=>el.onchange=()=>{difficulty=el.value as 'normal'|'extreme';extras=pickExtras(c.stage,c.map,extras,difficulty,deployment(campaign,true).levels,retinueCost());draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-retinue]').forEach(b=>b.onclick=()=>{const n=b.dataset.retinue!;retinue=retinue.includes(n)?retinue.filter(x=>x!==n):[...retinue,n].slice(0,retinueCap());extras=pickExtras(c.stage,c.map,extras,difficulty,deployment(campaign,true).levels,retinueCost());draw();});
    document.querySelectorAll<HTMLInputElement>('[data-extra]').forEach(el=>el.onchange=()=>{const id=el.dataset.extra!;const next=el.checked?[...extras,id]:extras.filter(x=>x!==id);const ok=pickExtras(c.stage,c.map,next,difficulty,deployment(campaign,true).levels,retinueCost());if(el.checked&&!ok.includes(id)){el.checked=false;toast(`남은 COST나 출진 시작 칸이 부족합니다. 다른 장수를 해제한 뒤 선택하세요.`);return;}extras=ok;draw();});
    $('#auto-sortie')?.addEventListener('click',()=>{const lv=deployment(campaign,true).levels,{allowed}=optionalOfficers(c.stage,c.map);extras=pickExtras(c.stage,c.map,[...allowed].sort((a,b)=>unitCost(storyClassAt(a,lv[a]??1))-unitCost(storyClassAt(b,lv[b]??1))),difficulty,lv,retinueCost());draw();});
    $('#clear-sortie')?.addEventListener('click',()=>{extras=[];draw();});
    document.querySelectorAll<HTMLButtonElement>('[data-promote]').forEach(b=>b.onclick=()=>{const o=promote(campaign,progress(),b.dataset.promote!);if(!o){toast('승급 포인트가 모자랍니다.');return;}saveCampaign();toast(`${officerNames[o.officer]} 승급: ${classNames[o.to]??o.to} (Lv.${o.need})`);draw();});
    $('#brief-back').onclick=scenario?()=>showScenario(scenarioHost,scenario.chapter):expedition?()=>expedition.kind==='training'?showTraining():showExpeditions(expedition.kind):showChronicle;
    if(scenario)$('#brief-camp').onclick=()=>campOf(scenarioHost,scenario.chapter);
    document.querySelectorAll<HTMLSelectElement>('[data-support]').forEach(el=>el.onchange=()=>{const k=supportOptions.find(k=>k===el.value);if(k){supports[Number(el.dataset.support)]=k;draw();}});
    $('#recommend-support')?.addEventListener('click',()=>{if(recommendation){supports=[...recommendation.classes];draw();}});
    $('#deploy').onclick=()=>{session=new Session(chapter,difficulty,expedition?Date.now()%100000:215,prep,RULES,dispatch());activate();persist();};
    $<HTMLDialogElement>('#modal').scrollTop=previousScroll;
  };draw();
}

/** 결과 화면의 천명 조건 셋: 「2/3 달성」 머리와, 조건마다 달성 ✓ / 미달 ✗ 를 크게. */
function resultSeals(names:readonly string[],got:readonly number[],win:boolean){
  const n=names.filter((_,i)=>got.includes(i+1)).length;
  return `<div class="result-seals"><div class="rs-head"><b>천명 조건</b><span>${win?`${n}/${names.length} 달성`:'패배 — 천명 조건은 이겨야 얻는다'}</span></div><ol>${names.map((nm,i)=>{const ok=got.includes(i+1);return `<li class="${ok?'earned':'missed'}"><i>${ok?'✓':'✗'}</i><span>${esc(nm)}</span><small>${ok?'달성':'미달'}</small></li>`;}).join('')}</ol></div>`;}
/** 상시 HUD: 이 장의 천명 조건(옛 인장) 셋 — 이미 얻은 것은 ◆, 아직은 ◇(일반·극한은 지금 난이도 기록). */
function hudSeals(){if(session.deployment?.run||session.deployment?.mission||!/^[SZ]\d/.test(session.state.stage.id))return '';const id=session.state.stage.id,names=(()=>{try{return sealNamesOf(session.chapter);}catch{return [] as string[];}})();if(!names.length)return '';
  const got=new Set(progress()[id+':'+session.difficulty]??[]);
  const req=session.sealRequirements;
  return `<p class="mo-seals"><b>천명</b> ${names.map((n,k)=>`<span class="${got.has(k+1)?'got':''}">${got.has(k+1)?'◆':'◇'} ${esc(n)}${req[k]?` <small>(${esc(req[k]!)})</small>`:''}</span>`).join(' ')}</p>`;}
/** 상시 HUD: 지금 전장에서 겨룰 수 있는 대결(이름 있는 적장 ↔ 나설 수 있는 아군 장수). */
function hudContests(){if(session.revision<4)return '';const st=session.state,mine=[...st.living('player'),...st.living('ally')].filter(u=>!structureKind(u.id)&&!['ram','catapult','civilian'].includes(familyOf(u.unitClass)));
  const out:string[]=[];for(const e of st.living('enemy')){if(!romanceOf(e)||structureKind(e.id))continue;for(const k of ['duel','debate'] as const){const by=mine.find(u=>session.contestAllowed(u,e,k));if(by){out.push(`${k==='duel'?'⚔ 일기토':'✒ 설전'} ${esc(unitName(e))} ← ${esc(unitName(by))}`);break;}}if(out.length>=4)break;}
  return out.length?`<p class="mo-contest"><b>대결</b> ${out.join(' · ')}</p>`:'';}
/** 정비 화면 위 탭: 출진 덱·장비로 스크롤(상점은 따로 연다). */
function briefTabs(){document.querySelectorAll<HTMLButtonElement>('[data-brief-tab]').forEach(b=>b.onclick=()=>{const el=document.querySelector<HTMLElement>(b.dataset.briefTab!.split(',').map(x=>'#modal '+x).join(','));el?.scrollIntoView({behavior:'smooth',block:'start'});});}
let duelPresented=false;
/** 장수 열전: 얼굴을 고르면 그 장수의 무력·능력과 고유특성만 보인다(전체 표는 두지 않는다). */
function showTroopGallery(group:EvoGroup='all'){
 menuOpen=true;clearTimeout(aiTimer);
 modal(`<div class="briefing troop-evolution"><div class="eyebrow">도감 · 병종</div><h2>병종 진화표</h2><p class="muted">레벨이 오르면 진화하고, 공격 범위가 넓어진다.</p>${evolutionChart(group)}<div class="modal-actions"><button id="troop-back">← 도감</button></div></div>`,false);
 document.querySelectorAll<HTMLButtonElement>('[data-evo-group]').forEach(b=>b.onclick=()=>showTroopGallery(b.dataset.evoGroup as EvoGroup));
 void paintArmor();void fitEvoSprites();$('#troop-back').onclick=()=>showCollections(runHost);
}
/** 장수 도감: 이름있는 장수만 진영(위·촉·오·군웅·초·한)별로 본다. 병종 진화표와 따로 둔다. */
function showOfficerGallery(f:OfficerFaction='위'){
 menuOpen=true;clearTimeout(aiTimer);
 modal(`<div class="briefing troop-evolution officer-gallery"><div class="eyebrow">도감 · 장수</div><h2>장수</h2><p class="muted">이름있는 장수의 전투 모습 · 병종 · 고유특성을 진영별로 본다.</p>${officerGallery(f)}<div class="modal-actions"><button id="troop-back">← 도감</button></div></div>`,false);
 document.querySelectorAll<HTMLButtonElement>('[data-officer-faction]').forEach(b=>b.onclick=()=>showOfficerGallery(b.dataset.officerFaction as OfficerFaction));
 void paintArmor();void fitEvoSprites();$('#troop-back').onclick=()=>showCollections(runHost);
}
/**
 * 수련장: 천명의 길에서 막혔을 때 레벨을 올리는 곳. 지금 갈 장의 권장 레벨과 사마의·동료 레벨을 나란히 보여 주고,
 * 지금 레벨에 맞는 수련장을 골라 준다. 수련에서 이기면 사마의·연의 장수와 천명의 길 동료가 함께 자란다.
 */
function showTraining(){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;
  // 막혔을 때 레벨업: 기준은 본편인 연의의 '다음에 이길 장'(아직 이기지 못한 첫 장)이다.
  const nextIdx=campaignOrder.find(i=>!cleared(i)),hero=levelInfo(campaign.xp.sima_yi??0).level;
  const mates=OFFICERS.filter(id=>id!=='sima_yi').map(id=>({name:officerNames[id]??id,level:levelInfo(campaign.xp[id]??0).level}));
  const target=nextIdx!==undefined?encounterLevels[chapters[nextIdx]!.stage.id]:undefined;
  const stepName=nextIdx!==undefined?`${stageNo(chapters[nextIdx]!.stage.id)} ${catalogue.find(c=>c.id===chapters[nextIdx]!.stage.id)?.name??stories[nextIdx]?.[0]??''}`:'연의 32장을 모두 이겼다';
  const step=nextIdx!==undefined;
  const grounds=expeditions.filter(m=>m.kind==='training');
  const pick=grounds.filter(m=>canExpedition(campaign,m.id)&&m.level<=hero+1).at(-1)??grounds[0]!;
  const gap=target!==undefined?target-hero:0;
  const verdict=target===undefined?(step?'':'연의를 모두 마쳤다. 수련은 극한 천명 조건이나 도전의 관문을 위해 언제든 할 수 있다.'):gap>0?`권장 레벨까지 ${gap}레벨 모자란다 · ${growthAdvice(campaign,target)}`:'권장 레벨을 넘었다 — 막혔다면 지형·병종 상성과 보물을 다시 살펴보자.';
  const card=(m:Expedition)=>{const open=canExpedition(campaign,m.id);return `<button class="tg-card ${m.id===pick.id?'pick':''}" data-train="${m.id}" ${open?'':'disabled'}><span class="tg-lv">Lv.${m.level}</span><strong>${esc(m.name)}</strong><small>${open?`승리마다 경험치 +${trainingXp(campaign,m)} · 출진한 장수 모두`:`본편 ${m.requires}승 필요 (${storyWins(campaign)}/${m.requires})`}</small>${m.id===pick.id?'<em>지금 추천</em>':''}</button>`;};
  modal(`<div class="briefing training-screen"><div class="eyebrow">본영 · 수련장</div><h2>수련장</h2><p class="screen-lede">막힌 장이 있으면 여기서 레벨을 올리고 다시 간다.</p>
  <section class="tg-target"><div><small>지금 갈 곳</small><strong>${esc(stepName)}</strong>${target!==undefined?`<span>권장 Lv.${target}</span>`:''}</div>
    <div><small>사마의</small><strong>Lv.${hero}</strong>${target!==undefined?`<i class="tg-meter"><i style="width:${Math.min(100,Math.round(hero/target*100))}%"></i></i>`:''}</div>
    <div><small>연의 장수</small><strong>${mates.map(o=>`${esc(o.name)} ${o.level}`).join(' · ')}</strong></div></section>
  <p class="tg-verdict">${esc(verdict)}</p>
  <div class="run-actions"><button id="tg-go" class="primary">추천 수련 바로 출진 · ${esc(pick.name)} (Lv.${pick.level})</button></div>
  <h3 class="tg-h">수련장 고르기 <small>지금 레벨보다 크게 낮은 곳은 경험치가 줄어든다</small></h3>
  <div class="tg-grid">${grounds.map(card).join('')}</div>
  <h3 class="tg-h">보물 모으기 <small>레벨 대신 장비로 강해지기</small></h3>
  <div class="run-actions"><button id="tg-bounty">보물 사냥 (반복 · 이길 때마다 장비·도구)</button><button id="tg-quest">보물 인연 외전 (한 번씩 · 고유 보물·장비)</button></div>
  <div class="run-actions"><button id="tg-back">← 본영</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-train]').forEach(b=>b.onclick=()=>expeditionStory(b.dataset.train!));
  $('#tg-go').onclick=()=>expeditionStory(pick.id);$('#tg-bounty').onclick=()=>showExpeditions('bounty');$('#tg-quest').onclick=()=>showExpeditions('quest');$('#tg-back').onclick=showMenu;
}
/** 장을 이겼는가(두 이야기 공통 — 천명 기록·시나리오 모드 기록). */
function stageWon(stage:string){const i=chapters.findIndex(c=>c.stage.id===stage);return (i>=0&&cleared(i))||loadScenario().done.includes(stage);}
/** 장 id → 화면에 보일 이름('중편 5장 신성의 번개' 꼴). */
function stageLabel(stage:string){const cat=catalogue.find(c=>c.id===stage);if(cat)return `${stageNo(stage)} ${cat.name}`;const c=chapters.find(c=>c.stage.id===stage);return c?(c.stage.subtitle??c.stage.title):stage;}
/** 이름난 장수의 나라(이름 없는 병사는 셈하지 않는다). */
const nationOf=(n:string):Nation|undefined=>romanceByName(n)?officerFaction(n) as Nation:undefined;
/** 공훈이 생기기 전 저장: 지금까지의 공적(이긴 장·받은 천명·도전·보물 외전·수련·보물 사냥)을 한 번 공훈으로 셈한다. 이미 이긴 장의 연의 합류 장수도 따라잡는다. */
function ensureMerit(m=loadMeta()){
  let dirty=false;
  if(m.merit===undefined){m.merit=retroMerit({storyWins:m.chronicle.length,sealsPaid:(m.sealPaid??[]).length,challenges:(campaign.challenges??[]).length,quests:(campaign.quests??[]).length,trainingWins:campaign.trainingWins??0,bountyWins:campaign.bountyWins??0});dirty=true;}
  for(const st of ['S','Z'] as const){const got=catchUpStory(m,st,stageWon);if(got.length){dirty=true;if(st==='S'){const sc=loadScenario();joinRecruits(sc,got,levelInfo(campaign.xp.sima_yi??0).level,officerClass);saveScenario(sc);}}}
  if(dirty)saveMeta(m);
  return m;
}
/** 본영에서 지금 들일 수 있는 장수 수(공훈·격파, 두 이야기 합). 첫 화면·본영 표시에 쓴다. */
function readyCount(){const m=ensureMerit();return readyList(m,'S').length+readyList(m,'Z').length;}
/** 끝난 전투의 등용 기록(이름난 적장·출진한 장수·손실·지켜야 할 아군의 체력). */
function battleReport(story:Story,s:BattleState):BattleReport{
  const all=[...s.units.values()],named=(n:string)=>!!romanceByName(n);
  return {story,stage:s.stage.id,win:s.outcome==='victory',extreme:s.difficulty==='extreme',
    fallen:all.filter(u=>u.side==='enemy'&&!u.alive&&!u.name.endsWith('환영')&&named(u.name)).map(u=>u.name),
    enemies:all.filter(u=>u.side==='enemy'&&named(u.name)).map(u=>u.name),
    party:all.filter(u=>u.side==='player').map(u=>u.name),
    lost:all.filter(u=>u.side==='player'&&!u.alive).length,
    allies:Object.fromEntries(all.filter(u=>u.side!=='enemy').map(u=>[u.name,u.alive?u.hp/Math.max(1,u.stats.maxHp):0]))};
}
/**
 * 전투가 끝난 뒤 등용 정산: 공훈을 더하고(두 이야기 함께), 이긴 전투면 명성·호감을 쌓고
 * 연의 합류·조건 승리·구출·인연 장수를 그 이야기 주인공 휘하로 들인다. 결과 화면에 붙일 문구를 돌려준다.
 */
function settleRecruits(story:Story,merit:number,report?:BattleReport):{news:string[];joined:string[]}{
  const m=ensureMerit(),news:string[]=[];let joined:string[]=[];
  if(merit>0){m.merit=(m.merit??0)+merit;news.push(`공훈 +${merit} (모은 공훈 ${m.merit})`);}
  if(report){const r=settleBattle(m,report,stageWon,nationOf);news.push(...r.news);joined=r.joined;}
  saveMeta(m);
  if(story==='S'&&joined.length){const sc=loadScenario();joinRecruits(sc,joined,levelInfo(campaign.xp.sima_yi??0).level,officerClass);saveScenario(sc);}
  const ready=readyList(m,story);
  if(ready.length)news.push(`등용 가능 · ${ready.slice(0,5).map(e=>e.n).join(' · ')}${ready.length>5?` 외 ${ready.length-5}명`:''} — 본영 「등용」에서 들인다`);
  return {news,joined};
}
/** 지금 전투가 어느 이야기의 전투인가(등용이 쌓이는 전투만 — 수련·시나리오 밖 외전은 없음). */
function battleStory():Story|undefined{
  const id=session.state.stage.id;if(isZhugeStage(id)||isZhugeBranch(id))return 'Z';
  return !session.deployment?.mission&&chapters.some(c=>c.stage.id===id)&&/^S/.test(id)?'S':undefined;
}
/**
 * 일기토·설전에서 이긴 뒤 등용 고르기: 명성·호감 +1, 격파 길 장수면 「살려 보낸다」(호감 +1) / 「등용을 권한다」(호감이 가득 차야 받아들임).
 * host 안에 고르기 판을 띄우고, 고르면(또는 고를 것이 없으면) 끝난다.
 */
function contestRecruit(story:Story,foe:string,host:Element,key:string):Promise<void>{
  if(contestHandled.has(key))return Promise.resolve();contestHandled.add(key);
  const m=ensureMerit(),e=contestWin(m,story,foe,nationOf);saveMeta(m);
  const f=nationOf(foe);
  if(!e){if(f)toast(`${f} 명성 +${FAME.contest}`);return Promise.resolve();}
  return new Promise(done=>{
    const box=document.createElement('div');box.className='contest-recruit';
    const v=favorOf(m,story,foe),need=favorNeed(e);
    box.innerHTML=`<span class="rc-face">${cardFace(foe)}</span><div><b>${esc(foe)}</b> — 꺾였지만 목숨은 그대 손에 있다. <small>호감 ${Math.min(v,need)}/${need} · ${f??''} 명성 +${FAME.contest}</small>
      <div class="cr-actions"><button type="button" data-cr="spare">살려 보낸다 <small>호감 +1</small></button><button type="button" data-cr="ask" class="${v>=need?'primary':''}">등용을 권한다 <small>${v>=need?'받아들일 것이다':`호감 ${need}이 차야 한다`}</small></button></div><p class="cr-note" hidden></p></div>`;
    host.appendChild(box);
    const finish=(text:string,ok=false)=>{const p=box.querySelector<HTMLElement>('.cr-note')!;p.hidden=false;p.textContent=text;box.querySelectorAll<HTMLButtonElement>('[data-cr]').forEach(b=>b.disabled=true);if(ok)sound.event({kind:'victory'});setTimeout(done,ok?1600:1100);};
    box.querySelector<HTMLButtonElement>('[data-cr="spare"]')!.onclick=()=>{const mm=loadMeta(),t=spareFoe(mm,story,foe);saveMeta(mm);finish(t);};
    box.querySelector<HTMLButtonElement>('[data-cr="ask"]')!.onclick=()=>{const mm=loadMeta(),r=persuadeFoe(mm,story,foe);saveMeta(mm);
      if(r.ok&&story==='S'){const sc=loadScenario();joinRecruits(sc,[foe],levelInfo(campaign.xp.sima_yi??0).level,officerClass);saveScenario(sc);}
      finish(r.news.join(' · '),r.ok);};
  });
}
const contestHandled=new Set<string>();
/** 이야기 속 겨룸의 등용 몫은 장마다 상대마다 한 번만(이야기를 다시 봐도 또 쌓이지 않게). 처음이면 기록하고 false. */
function storyContestSeen(key:string){try{const k='sama-contest-recruit-v1',l=JSON.parse(localStorage.getItem(k)??'[]') as string[];if(l.includes(key))return true;localStorage.setItem(k,JSON.stringify([...l,key].slice(-400)));}catch{/* optional */}return false;}
/**
 * 등용: 이야기(사마의전·제갈량전)와 나라(위·촉·오·군웅·초·한)마다 장수가 늘어선다.
 * 들이는 길은 여섯 — 연의 합류 · 격파(호감) · 공훈(+명성) · 인연 · 조건 승리 · 구출. 나라를 다 모으면 칭호를 얻는다.
 */
function showRecruit(story:Story=recruitStory,nation?:Nation,focus?:string,joined?:string){
  menuOpen=true;clearTimeout(aiTimer);sound.scene='title';sound.combat=false;recruitStory=story;
  const m=ensureMerit(),roster=ROSTER[story],got=new Set(recruitedOf(m,story));
  const focusEntry=focus?entryOf(story,focus):undefined;
  const nat:Nation=nation??focusEntry?.f??NATIONS.find(f=>roster.some(e=>e.f===f&&recruitStatus(m,story,e)==='ready'))??'위';
  const list=roster.filter(e=>e.f===nat).sort((a,b)=>a.t-b.t);
  const sel=focusEntry&&focusEntry.f===nat?focusEntry:list.find(e=>recruitStatus(m,story,e)==='ready')??list.find(e=>!got.has(e.n))??list[0]!;
  const pct=(v:number)=>Math.round(v*100),tierName=(t:number)=>t===1?'군주':'';
  const tip=(e:RosterEntry)=>{const st=recruitStatus(m,story,e);if(st==='recruited')return `Lv.${story==='S'?retinueLevel(e.n):zRetinueLevel(e.n)}`;
    if(e.r==='defeat')return `호감 ${Math.min(favorOf(m,story,e.n),favorNeed(e))}/${favorNeed(e)}`;
    if(e.r==='merit')return fameCost(e)?`${e.f} 공적 ${fameCost(e)}`:`공훈 ${meritCost(e)}`;
    if(e.r==='bond')return `${e.w}와 출진`;
    return e.s?stageNo(e.s):'';};
  const badge:Record<string,string>={recruited:'등용함',ready:'등용 가능',locked:'조건 남음'};
  const node=(e:RosterEntry)=>{const st=recruitStatus(m,story,e),p=recruitProgress(m,story,e,stageWon);
    return `<button class="rc-node ${st} route-${e.r}${e.n===sel.n?' sel':''}${e.t===1?' lord':''}" data-rc="${esc(e.n)}"><span class="rc-face">${cardFace(e.n)}</span><b><i class="rc-route" title="${ROUTE_LABEL[e.r]}">${ROUTE_MARK[e.r]}</i>${esc(e.n)}${e.t===1?'<em class="rc-lord">군주</em>':''}</b><small>${badge[st]} · ${esc(tip(e))}</small>${st!=='recruited'?`<i class="rc-bar" aria-hidden="true"><i style="width:${pct(p)}%"></i></i>`:''}</button>`;};
  const st=recruitStatus(m,story,sel),r=romanceByName(sel.n);
  const conds=condLines(m,story,sel,stageWon,stageLabel).map(l=>`<li class="${l.ok?'ok':''}">${l.ok?'✓':'·'} ${esc(l.text)}${l.ok?'':`<i class="rc-bar" aria-hidden="true"><i style="width:${pct(l.p)}%"></i></i>`}</li>`).join('');
  const goText=st==='recruited'?`이미 ${HERO[story]} 휘하에 있다`:st==='ready'?(sel.r==='merit'?(fameCost(sel)?`${sel.f}의 공적(명성) ${fameCost(sel)}을 바치고 ${esc(sel.n)} 등용`:`공훈 ${meritCost(sel)}을 바치고 ${esc(sel.n)} 등용`):`${esc(sel.n)}의 귀순을 받아들인다`)
    :({story:'연의에서 그 장을 이기면 저절로 합류한다',defeat:'호감이 가득 차면 받아들인다',merit:'조건을 채우면 바쳐서 등용한다',bond:'인연 있는 장수와 함께 이기면 따라온다',feat:'조건대로 이기면 찾아온다',rescue:'지켜서 이기면 찾아온다'} as Record<RecruitRoute,string>)[sel.r];
  const storyCount=(s:Story)=>`${recruitedOf(m,s).length}/${ROSTER[s].length}`;
  const natCount=(f:Nation)=>{const l=roster.filter(e=>e.f===f);return `${l.filter(e=>got.has(e.n)).length}/${l.length}`;};
  const titled=(f:Nation)=>(m.titles??[]).includes(titleKey(story,f));
  const earned=NATIONS.filter(titled),worn=m.title?.[story];
  const routeCount=(k:RecruitRoute)=>{const l=list.filter(e=>e.r===k);return l.length?`<span class="rc-chip route-${k}" title="${esc(ROUTE_NOTE[k])}"><i class="rc-route">${ROUTE_MARK[k]}</i>${ROUTE_LABEL[k]} <b>${l.filter(e=>got.has(e.n)).length}/${l.length}</b></span>`:'';};
  const fameLine=FAME_NATIONS[story].includes(nat)?`${nat} 명성 <b>${fameOf(m,story,nat)}</b>${roster.some(e=>e.f===nat&&fameCost(e))?` <small>(바칠 수 있는 ${fameLeft(m,story,nat)})</small>`:''}`:`${nat} — ${STORY_NAME[story]}에는 적으로 나오지 않아 공훈만으로 들인다`;
  modal(`<div class="briefing recruit-screen v2"><div class="eyebrow">본영 · 등용 · ${STORY_NAME[story]} ${storyCount(story)}명</div><h2>등용</h2><p class="screen-lede">나라마다 장수를 모은다. ${STORY_NAME[story]}에서 들인 장수는 ${esc(HERO[story])} 휘하로 그 이야기 출진에 함께 선다.</p>
  <div class="rc-stories" role="tablist">${(['S','Z'] as const).map(s=>`<button role="tab" data-rc-story="${s}" class="${s===story?'on':''}" aria-selected="${s===story}">${STORY_NAME[s]} <small>${storyCount(s)}</small></button>`).join('')}</div>
  <div class="rc-summary"><span class="rc-merit"><small>모은 공훈(두 이야기 함께)</small><b>${(m.merit??0).toLocaleString()}</b></span><span class="rc-fame">${fameLine}</span>
    <span class="rc-titles"><small>칭호</small>${earned.length?`<button type="button" data-rc-title="" class="${worn?'':'on'}">달지 않음</button>${earned.map(f=>`<button type="button" data-rc-title="${f}" class="${worn===f?'on':''}">「${TITLES[f].name}」</button>`).join('')}`:'<em>나라 하나를 다 모으면 칭호를 얻는다 — 달면 주인공 이름 앞에 붙는다</em>'}</span></div>
  <div class="rc-nations" role="tablist">${NATIONS.map(f=>`<button role="tab" data-rc-nation="${f}" class="${f===nat?'on':''}${titled(f)?' titled':''}" aria-selected="${f===nat}">${f} <small>${natCount(f)}</small>${roster.some(e=>e.f===f&&recruitStatus(m,story,e)==='ready')?'<b class="rc-dot">!</b>':''}</button>`).join('')}</div>
  <div class="rc-routes">${ROUTES.map(routeCount).join('')}<span class="rc-reward">${titled(nat)?`칭호 「${TITLES[nat].name}」 ✓`:`다 모으면 칭호 「${TITLES[nat].name}」`}</span></div>
  <details class="rc-howto"><summary>등용의 여섯 갈래 · 공훈과 명성 얻는 법</summary><ul>
    ${ROUTES.map(k=>`<li><b>${ROUTE_LABEL[k]}</b> — ${esc(ROUTE_NOTE[k])}</li>`).join('')}
    <li><b>공훈</b> — 연의 첫 승리 +${MERIT.storyFirst}(극한 +${MERIT.storyFirstExtreme}) · 다시 이기면 +${MERIT.storyAgain} · 새로 얻은 천명 하나 +${MERIT.seal} · 쓰러뜨린 이름난 적장 +${MERIT.foe} · 수련·보물 사냥 승리 +${MERIT.training} · 도전 첫 돌파 +${MERIT.challenge} · 보물 외전 첫 승리 +${MERIT.quest}. 두 이야기가 함께 쓴다.</li>
    <li><b>명성</b> — 이야기마다 나라별로 쌓인다. 이긴 전투에서 그 나라 이름난 장수를 꺾으면 +${FAME.foe}(극한 +${FAME.foeExtreme}) · 일기토·설전 승리 +${FAME.contest} · 그 나라 장수를 들이면 +${FAME.recruit} · 이긴 전투에 나온 적 나라마다 +${FAME.battle}.</li>
    <li><b>군주</b> — 위·촉·오 군주는 그 나라 공적(명성)을 바치고, 나머지 군주는 공훈을 바친다. 일반 장수보다 값이 크다.</li></ul></details>
  ${joined?`<div class="rc-joined"><span class="rc-face big">${cardFace(joined)}</span><div><b>${esc(joined)}</b> — ${esc(HERO[story])} 휘하에 들었다.${romanceByName(joined)?.epithet?`<p>「${esc(romanceByName(joined)!.epithet)}」</p>`:''}</div></div>`:''}
  <div class="rc-body"><div class="rc-tree"><div class="rc-steps">${list.map(node).join('')}</div></div>
  <aside class="rc-detail"><div class="rc-head"><span class="rc-face big">${cardFace(sel.n)}</span><div><small>${sel.f}${tierName(sel.t)?' · 군주':''} · <span class="rc-chip route-${sel.r}"><i class="rc-route">${ROUTE_MARK[sel.r]}</i>${ROUTE_LABEL[sel.r]}</span></small><h3>${esc(sel.n)}</h3><p>${esc(r?.epithet??'')}</p><p class="rc-stats">${r?`무력 ${r.war} · 지력 ${r.int} · 통솔 ${r.lead}`:''} · ${esc(classNames[officerClass(sel.n)]??'')}</p></div></div>
    <p class="rc-route-note">${esc(ROUTE_NOTE[sel.r])}</p>
    <h4>등용 조건</h4><ul class="rc-conds">${conds}</ul>
    <button id="rc-go" class="primary" ${st==='ready'?'':'disabled'}>${goText}</button></aside></div>
  <div class="run-actions"><button id="rc-back">← 본영</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-rc]').forEach(b=>b.onclick=()=>showRecruit(story,nat,b.dataset.rc));
  document.querySelectorAll<HTMLButtonElement>('[data-rc-story]').forEach(b=>b.onclick=()=>showRecruit(b.dataset.rcStory as Story));
  document.querySelectorAll<HTMLButtonElement>('[data-rc-nation]').forEach(b=>b.onclick=()=>showRecruit(story,b.dataset.rcNation as Nation));
  document.querySelectorAll<HTMLButtonElement>('[data-rc-title]').forEach(b=>b.onclick=()=>{const mm=loadMeta(),f=b.dataset.rcTitle as Nation|'';mm.title={...mm.title};if(f)mm.title[story]=f;else delete mm.title[story];saveMeta(mm);if(f)toast(`칭호 「${TITLES[f].name}」 — ${heroLabel(mm,story)}`);showRecruit(story,nat,sel.n);});
  $('#rc-back').onclick=showMenu;
  $('#rc-go').onclick=()=>{const mm=ensureMerit(),news=buyRecruit(mm,story,sel.n);if(!news)return;saveMeta(mm);
    if(story==='S'){const sc=loadScenario();joinRecruits(sc,[sel.n],levelInfo(campaign.xp.sima_yi??0).level,officerClass);saveScenario(sc);}sound.event({kind:'victory'});
    if(news.length)setTimeout(()=>toast(news.join(' · ')),900);showRecruit(story,nat,sel.n,sel.n);};
}
let recruitStory:Story='S';
/** 주인공이 단 칭호(없으면 빈 글). 연의 지도·출진 정비의 이야기 이름 옆에 붙인다. */
function heroChip(story:Story){const m=loadMeta(),t=heroTitle(m,story);return t?`<span class="hero-title" title="등용 칭호">${esc(heroLabel(m,story))}</span>`:'';}
function showExpeditions(tab:Expedition['kind']='challenge'){
 menuOpen=true;clearTimeout(aiTimer);
 const done=(m:Expedition)=>m.kind==='quest'?(campaign.quests??[]).includes(m.id):m.kind==='challenge'?(campaign.challenges??[]).includes(m.id):false;
 const reward=(m:Expedition)=>m.kind==='training'?'승리 경험치 +'+trainingXp(campaign,m)+((campaign.trained??[]).includes(m.id)?'':' · 첫 승리 '+missionRewardText(m.id)):m.kind==='bounty'?'승리마다 장비·도구 하나와 금':done(m)?(m.kind==='challenge'?'돌파 완료':'인연 완료'):(m.kind==='challenge'?'첫 돌파 ':'첫 승리 ')+missionRewardText(m.id);
 const lock=(m:Expedition)=>m.kind==='challenge'&&m.step!>1&&!(campaign.challenges??[]).includes('C'+String(m.step!-1).padStart(2,'0'))?(m.step!-1)+'단계를 먼저 넘으세요':'본편 '+m.requires+'승 필요 ('+storyWins(campaign)+'/'+m.requires+')';
 const card=(m:Expedition)=>`<button data-expedition="${m.id}" class="${m.kind}${done(m)?' done':''}" ${canExpedition(campaign,m.id)?'':'disabled'}><strong>${m.kind==='challenge'?`<em class="step">${m.step}</em>${m.name}`:`${m.name} · ${trialGoals[m.id]!.name}`}</strong><small>권장 Lv.${m.level} · ${reward(m)} · ${layoutName(m.id)}<br>${canExpedition(campaign,m.id)?'도전 가능':lock(m)}</small></button>`;
 const cleared=(campaign.challenges??[]).length;
 const sections:Array<[Expedition['kind'],string,string]>=[
  ['challenge','도전 퀘스트 · 10단계',`앞 단계를 넘어야 다음 단계가 열립니다. 단계마다 적이 늘고 강해지며 증원이 몰려옵니다. 5·10단계에는 수문장이 기다립니다. 돌파 ${cleared}/10`],
  ['bounty','반복 퀘스트 · 보물 사냥','이길 때마다 그 사냥터의 꾸러미에서 상점 장비나 도구 하나와 금을 얻습니다. 복숭아·술처럼 상점에서 팔지 않는 도구도 나옵니다. 몇 번이든 다시 할 수 있습니다.'],
  ['quest','보물 인연 · 첫 승리 보상','고유 보물이나 상점 장비, 금을 한 번 받습니다.'],
  ['training','반복 수련','승리마다 경험치와 금을 얻고, 수련장마다 첫 승리에 도구를 줍니다.'],
 ];
 const [,title,note]=sections.find(x=>x[0]===tab)!;
 modal(`<div class="briefing expedition-hub"><div class="eyebrow">본영 · 연무장</div><h2>연무장</h2><p>${growthText()} · 도전 ${cleared}/10 · 보물 사냥 ${campaign.bountyWins??0}승 · 보물 외전 ${campaign.quests?.length??0}/11 · 수련 ${campaign.trainingWins??0}승</p><div class="expedition-tabs" role="tablist">${sections.map(([kind,label])=>`<button role="tab" data-exp-tab="${kind}" class="${kind===tab?'on':''}" aria-selected="${kind===tab}">${label.split(' · ')[0]}</button>`).join('')}</div><h3>${title}</h3>${note?`<p class="muted">${note}</p>`:''}<div class="expedition-grid${tab==='challenge'?' challenge-ladder':''}">${expeditions.filter(m=>m.kind===tab).map(card).join('')}</div><p class="muted">권장 레벨보다 4레벨 이상 높으면 수련 경험치가 단계적으로 줄어듭니다. 보물 외전과 도전의 경험치·보물은 첫 승리 보상입니다.</p><div class="modal-actions"><button id="expedition-back">${tab==='challenge'?'← 본영':'← 수련장'}</button></div></div>`,false);
 document.querySelectorAll<HTMLButtonElement>('[data-exp-tab]').forEach(el=>el.onclick=()=>showExpeditions(el.dataset.expTab as Expedition['kind']));
 document.querySelectorAll<HTMLButtonElement>('[data-expedition]').forEach(el=>el.onclick=()=>expeditionStory(el.dataset.expedition!));$('#expedition-back').onclick=tab==='challenge'?showMenu:showTraining;
}
/**
 * 수련·도전 이야기: 연의·천명의 길과 같은 이야기 무대로. 의뢰 → 정찰 → 출진의 결의 세 장면을
 * 사마의와 조진(또는 말하는 사람)이 걸어 들어와 주고받는다. 끝나면 출진 정비.
 */
function expeditionStory(id:string,_beat=0){const m=expeditions.find(x=>x.id===id);if(!m||!canExpedition(campaign,id))return;
  if(!storyReady){menuOpen=true;modal(waitPanel('이야기 준비 중','인물과 배경 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void storyArt.then(()=>expeditionStory(id));return;}
  menuOpen=true;clearTimeout(aiTimer);sound.scene='camp';void sound.start().then(updateSound);
  const look=(n:string):Look=>n==='사마의'?'strategist':n==='조진'?'heavy':/책사|학자|의원|상인/.test(n)?'civil':'infantry';
  const scenes:Scene[]=trialStory(m.id,m.name,m.art,m.lines).map((sc,i)=>{const sp=splitSpokenLine(sc.line),other=sp.speaker==='사마의'||sp.speaker==='해설'?'조진':sp.speaker;
    return {place:sc.place,art:sc.art,cast:[{name:'사마의',look:'strategist',...(i?{at:[40,66] as [number,number]}:{}),face:'right'},{name:other,look:look(other),...(i?{at:[60,64] as [number,number]}:{}),face:'left'}],
      steps:[...(i?[]:[{enter:'사마의',at:[40,66] as [number,number],from:'left' as const},{enter:other,at:[60,64] as [number,number],from:'right' as const}]),
        ...(i===0?[{narrate:`${KIND_LABEL[m.kind]} · ${m.name} — ${trialGoalText(id)}`}]:[]),
        sp.speaker==='해설'?{narrate:sp.line}:{say:sp.speaker,line:sp.line,to:sp.speaker==='사마의'?other:'사마의'}]};});
  modal('<div class="ss-host trial-host"></div>',false);
  const root=$('.ss-host');
  void playScenes(root,scenes,{heading:`${KIND_LABEL[m.kind]} · ${m.name}`,flags:()=>[]}).then(()=>{if(document.contains(root))briefing(7,id);});
}
/** 연의 장수록: 별호 · 다섯 능력 · 고유능력. 연의에 없는 졸병은 표시하지 않는다. */
function romanceCard(u:Unit){
  const r=romanceOf(u);if(!r||u.name.endsWith('환영'))return '';
  const bars=([['무력',r.war],['지력',r.int],['통솔',r.lead],['정치',r.pol],['매력',r.cha]] as const).map(([k,v])=>`<span><small>${k}</small><b>${v}</b><i style="width:${v}%"></i></span>`).join('');
  const temper=temperOf(r.name);
  return `<div class="romance-card"><div class="romance-epithet">${r.epithet}${temper?` <span class="temper-tag" title="일기토·설전에 응하는 방식">성격 · ${temperNames[temper]}</span>`:''}</div><div class="romance-stats">${bars}</div>${session.revision>=8?(()=>{const te=troopEffectOf(u.unitClass);return te?`<p><b>병종 특성 「${te.effect.name}」</b> ${troopEffectText(te.effect,te.tier)}</p>`:'';})()+signatureSkills(r.name,u.traitParams['sig:'+r.name]??1).filter(g=>g.open).map(g=>`<p><b>고유특성 「${g.name}」</b> ${g.description}</p>`).join(''):(()=>{const sk=r.skill??officerFeatures[u.id];return sk?`<p><b>${sk.name}</b> ${sk.description}</p>`:'';})()}</div>`;
}
function milestoneMarkup(items:ReturnType<typeof growthMilestones>){return items.map(x=>`<div class="growth-summary"><b>${officerNames[x.id]}${x.to>x.from?' · Lv.'+x.from+' → '+x.to:''}</b>${x.evolution?`<p class="evo-news">병종 진화: ${x.evolution.from} → <b>${x.evolution.to}</b>${x.evolution.bloom?` · 개화 「${x.evolution.bloom.name}」 ${x.evolution.bloom.description}`:''}</p>`:''}${x.strategies.length?'<p>새 책략: '+x.strategies.join(' · ')+'</p>':''}</div>`).join('');}
function showExpeditionResult(){if(resultShown)return;resultShown=true;const run=session.deployment!.mission!,m=expeditions.find(x=>x.id===run.id)!,win=session.state.outcome==='victory';const before=structuredClone(campaign);
 const reward=expeditionReward(campaign,m.id,run.runId,win);
 const again=session.rewarded;session.rewarded=true;persist();
 // 외전 승리도 공훈을 준다(수련·보물 사냥은 매번, 도전·보물 외전은 첫 승리)..
 if(win&&!again&&reward.xp>0){const rc=settleRecruits('S',missionMerit(m.kind,true));if(rc.news.length)setTimeout(()=>toast(rc.news.join(' · ')),1600);}const gearLines=again?[]:gearNews(settleGear(campaign,session.state,session.deployment,session.xpEarned));saveCampaign();
 const milestones=growthMilestones(before,campaign);
 modal(`<div class="result"><div class="result-character">${win?'승':'련'}</div><h2>${win?'성장의 한 걸음':'다시 준비할 시간'}</h2><p>${m.name} · ${session.state.turn}턴</p>${win?`<div class="story-stage reward-scene"><div class="story-backdrop incoming" style="${storyBackdrop(m.art)}"></div>${actorMarkup('사마의','hero')}${actorMarkup('조진','companion')}</div>`:''}${win?dialogueCaption(splitSpokenLine(m.lines[2]!).speaker,splitSpokenLine(m.lines[2]!).line):`<p class="battle-aftermath">${esc(session.failure)}<br>패배해도 경험치와 보물은 잃지 않습니다. 정비 후 다시 도전하세요.</p>`}<p>${win&&!reward.xp?'이미 보상을 받은 전투입니다. · ':'경험치 +'+reward.xp+' · '}${growthText()}</p>${reward.items.length?`<p class="treasure-reward">얻은 것: ${reward.items.map(esc).join(' · ')}</p>`:''}${gearLines.map(x=>`<p class="growth-summary">${esc(x)}</p>`).join('')}${milestoneMarkup(milestones)}<div class="modal-actions"><button id="expedition-again">${m.kind==='training'?'다시 수련':'다시 도전'}</button>${m.kind==='challenge'&&win&&m.step!<10?'<button id="expedition-next-step" class="primary">다음 단계 →</button>':''}<button id="expedition-list">연무장 목록</button><button id="expedition-menu">연의 회상</button></div></div>`,false);
 $('#expedition-again').onclick=()=>briefing(7,m.id);const nextStep=document.getElementById('expedition-next-step');if(nextStep)nextStep.onclick=()=>expeditionStory('C'+String(m.step!+1).padStart(2,'0'));$('#expedition-list').onclick=()=>m.kind==='training'?showTraining():showExpeditions(m.kind);$('#expedition-menu').onclick=m.kind==='challenge'?showMenu:showTraining;
 // 외전·도전에서 처음 얻은 고유 보물(사마의전 획득처)도 결과 화면 다음에 장면으로.
 revealAfterResult(campaign.treasures.filter(id=>!before.treasures.includes(id)),'S',document.querySelector('#modal .result'));
}
function activate(){
  // 전장 그림이 아직이면 기다렸다가 시작한다(첫 화면을 빨리 띄우느라 그림은 뒤에서 준비한다).
  if(!fieldReady){startRest();modal(waitPanel('전장 준비 중','전장 그림을 마저 받고 있습니다. 끝나면 바로 시작합니다.'),false);void fieldInit?.then(activate,error=>{console.error(error);modal(`<div class="briefing"><h2>전장 그래픽 오류</h2><p class="render-error">전장 그래픽을 준비하지 못했습니다. 브라우저를 최신으로 올리거나, 다른 탭을 닫고 다시 시도해 주세요.</p><p class="muted">원인: ${String((error as Error)?.message??error).replace(/[<>&]/g,'').slice(0,160)}</p><div class="modal-actions"><button class="primary" id="field-retry">다시 시도</button></div></div>`,false);$('#field-retry').onclick=()=>location.reload();});return;}
  hasStarted=true;menuOpen=false;resultShown=false;scored=false;scorePending=false;duelPresented=!session.activeDuel;mode='move';setAuto(false);
  selected=session.state.living(session.state.currentSide).find(u=>!u.hasActed)?.id??'sima_yi';
  preloadDuelArt([...session.state.units.values()].map(u=>officerDuelSheetUrl(u)));
  lastLog=session.state.log.length;field.load(session.state);const u=session.state.find(selected);if(u)field.focusUnit(u.pos);
  const m=session.state.map,terrain:TerrainKind[]=[];for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)terrain.push(m.tileAt({x,y}).terrain);
  sound.scene='battle';sound.place=placeFor(session.state.stage.id,terrain);sound.focus=undefined;sound.combat=session.chapter!==0;void sound.start().then(()=>{updateSound();if(!session.journal.length)sound.event({kind:'battle-start'});});
  // A resumed battle should not replay every line whose moment has already passed.
  lineSeen=new Set(session.journal.length?dueLines(session.state.stage.id,session.state,new Set()).map(l=>l.id):[]);lineQueue=[];clearTimeout(lineTimer);lineTimer=undefined;lineToken++;$('#battle-line').hidden=true;$('#latest-log').textContent='';
  // 처음 싸우는 장: 목표를 펼쳐 안내하고(장수를 고르면 접힌다), 그 뒤로는 접어 둔 꼬리표만.
  const guideId=session.state.stage.id+':'+JSON.stringify(session.state.stage.victory),guide=!session.journal.length&&!goalGuideSeen(guideId);if(guide)markGoalGuide(guideId);
  objectiveBox.open=guide;objectiveBox.guide=guide;goalSeen.session=undefined;$<HTMLDialogElement>('#modal').close();render();setObjectiveOpen(guide);if(guide){objectiveBox.auto=true;objectiveBox.guide=true;render();}pump();
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(session.save()));saveAvailable=true;localStorage.setItem(LAST_KEY,JSON.stringify({where:battleWhere(),turn:session.state.turn,ongoing:session.state.outcome==='ongoing'||!resultShown,at:Date.now()}));$('#save-status').textContent='✓ 자동 저장됨';}catch{$('#save-status').textContent='저장 공간 사용 불가';}}
function describe(e:LogEntry){const name=(id:string)=>session.state.find(id)?.name??id;switch(e.t){case 'telegraph':return e.warning?`⚠ ${e.label??'적 증원'} 예고 · ${e.turns}턴 뒤 노란 칸으로 적이 들어옵니다. 미리 대비하세요.`:`⚠ ${e.label??'광역 공격'} 예고 · ${e.turns}턴 뒤 붉은 칸에 떨어집니다. 칸을 비우세요.`;case 'strike':return `${e.hits.length?e.hits.map(h=>name(h.unit)+' −'+h.damage).join(', '):'아무도 맞지 않았습니다'} · ${e.label?e.label+'!':'예고된 공격이 떨어졌습니다.'}`;
  case 'weather':return `날씨가 바뀌었습니다 · ${WEATHER_NAMES[e.weather]}${e.weather==='rain'?' — 불길이 꺼집니다.':''}`;
  case 'gate':return e.open?'성문이 열렸습니다.':'성문이 닫혔습니다.';
  case 'turnStart':return `${e.turn}턴 · ${sideNames[e.side]}의 차례입니다.`;
  case 'move':return `${name(e.unit)} 이동 · ${terrainNames[session.state.map.tileAt(e.to).terrain]}`;
  case 'attack':case 'counter':return `${name(e.attacker)}${e.t==='counter'?' 반격':' 공격'} → ${name(e.defender)} · ${e.hit?e.damage+' 피해':'회피'}`;
  case 'strategy':return `${e.double?'연속 책략! ':''}${name(e.caster)} · ${e.strategy==='heal'?'기본 회복':e.strategy==='calm'?'진정':e.strategy==='repair'?'수리':session.state.strategies.get(e.strategy)?.name??e.strategy} · ${Math.abs(e.damage.reduce((a,b)=>a+b,0))}${e.damage.some(d=>d<0)?' 회복':e.damage.every(d=>d===0)?' 지원':' 피해'}`;
  case 'retreat':return structureKind(e.unit)==='gate'?`${name(e.unit)} 파괴 · 성문 돌파! 주변 아군 사기 상승`:`${name(e.unit)} ${structureKind(e.unit)?'파괴':'퇴각'}`;
  case 'spawn':return e.units.some(id=>structureKind(id)==='barricade')?'공병이 방책을 세웠습니다.':'';
  case 'outcome':return e.outcome==='victory'?'작전 성공.':`작전 실패 — ${session.failure||defeatCause(session.state)}`;
  case 'choice':return '선택에 따라 전장의 흐름이 바뀝니다.';
  case 'item':{const it=consumable(e.item)?.name??e.item,gain=[...(e.hp?[`체력 +${e.hp}`]:[]),...(e.mp?[`MP +${e.mp}`]:[])].join(' · ');return e.auto?`${name(e.unit)} · 콩주머니에서 ${it}을 꺼내 먹었다${gain?' · '+gain:''}`:`${name(e.unit)} · ${it} → ${name(e.target)}${gain?' · '+gain:''}`;}
  case 'pickup':return `${name(e.unit)} · ${을를(consumable(e.item)?.name??e.item)} 주웠다`;
  case 'convert':return `${name(e.unit)} · 인수로 병종이 올랐다`;
  default:return '';
}}
function consumeLog(){const logs=session.state.log.slice(lastLog);lastLog=session.state.log.length;if(logs.some(e=>e.t==='terrain'||e.t==='gate'))field.repaintTerrain();field.play(logs);hudFight(logs);for(const e of logs){const line=describe(e);if(line)$('#latest-log').textContent=line;if(e.t==='pickup')toast(line,supplyIcon(e.item,consumable(e.item)?.name??e.item));if(e.t==='turnStart'){const banner=$('#phase-banner');banner.textContent=`${sideNames[e.side]}의 차례`;banner.classList.add('show');setTimeout(()=>banner.classList.remove('show'),1300);sound.event({kind:'turn',side:e.side});if(e.side!=='player')sound.focus=undefined;}}}
function portraitFor(u:Unit,reaction=false,contestKind?:DuelKind):string{
  const debate=contestKind==='debate'?officerDebateModelStyle(u,reaction?3:0):undefined;
  if(debate)return `<span class="battle-model officer-battle-model" role="img" aria-label="${unitName(u)} 설전 도보 모델" style="${debate}"></span>`;
  // 설전은 궁정·군막에서 말없이 논하는 장면이다. 기마 장수의 전용 일기토 시트 대신
  // 같은 비율의 도보 책사 모델을 세워 마초 같은 장수가 말을 탄 채 궁정에 들어오지 않게 한다.
  if(contestKind==='debate'&&(officerDuelMounted(u)||(!hasUnifiedSd(u)&&(MOUNTED_FAMILIES.has(familyOf(u.unitClass))||u.unitClass.startsWith('mounted')))))return '<span class="battle-model" role="img" aria-label="설전 도보 모델" style="background-image:var(--four-stage-strategist-atlas);background-size:400% 400%;background-position:0 0"></span>';
  // 일기토·설전은 SD 화풍으로 통일한다: 통합 SD가 없는 장수는 옛 일기토·전투 그림(실사 비례) 대신 그 병종의 SD 그림으로 세운다.
  const legacyContest=!!contestKind&&!hasUnifiedSd(u);
  const officer=legacyContest?undefined:officerDuelModelStyle(u);
  if(officer)return `<span class="battle-model officer-battle-model" role="img" aria-label="${unitName(u)} 전신"${officerDuelMounted(u)?' data-mounted':''} style="${officer}"></span>`;
  // 전용 대결 그림이 없는 장수(유비·손권·조예 등)는 병종 그림 대신 자기 전투 그림 첫 칸(대기)을 세운다. 칸이 가로로 길어 폭에 맞추고 발끝을 아래에 붙인다.
  const sd=legacyContest?undefined:officerBattleSheet(u)?.action;
  if(sd&&sd.rows===1)return `<span class="battle-model sheet-model" role="img" aria-label="${unitName(u)}"${MOUNTED_FAMILIES.has(familyOf(u.unitClass))||u.unitClass.startsWith('mounted')?' data-mounted':''} style="background-image:url(${sd.sheet});background-size:400% auto;background-repeat:no-repeat;background-position:${reaction?100:0}% 100%"></span>`;
  const painted=paintedTroopArt[u.unitClass];
  // 말·전차를 탄 병종 그림은 일기토에서 말 탄 크기로 세운다(duelModel이 data-mounted를 본다).
  if(painted)return `<span class="battle-model" role="img" aria-label="${unitName(u)}"${MOUNTED_FAMILIES.has(familyOf(u.unitClass))||u.unitClass.startsWith('mounted')?' data-mounted':''} style="background-image:var(--${painted.sheet}-atlas);background-size:400% ${painted.rows*100}%;background-position:${reaction?100:0}% ${painted.rows>1?painted.row/(painted.rows-1)*100:0}%"></span>`;
  // 신장수: 직접 만든 초상
  {const url=customFace(u.name);if(url&&u.side==='player')return `<span class="battle-model custom-portrait" role="img" aria-label="${unitName(u)}" style="background-image:url(${url});background-size:cover"></span>`;}
  const art=troopArt[u.unitClass];if(art)return `<span class="battle-model" role="img" aria-label="${unitName(u)}" style="background-image:var(--${art.sheet}${reaction?'-reaction':''}-atlas);background-size:400% ${art.rows*100}%;background-position:${reaction?33.333333:0}% ${art.row/(art.rows-1)*100}%"></span>`;
  const role=troopRoles[u.unitClass];if(role)return `<span class="troop-portrait" style="filter:sepia(.18)">${portraitFor({...u,unitClass:visualClass(u.unitClass)})}<b style="color:#${role.tint.toString(16)}">${role.name}</b></span>`;
  if(familyOf(u.unitClass)==='ram')return '<span class="battle-model" role="img" aria-label="충차" style="background-image:var(--ram-atlas);background-size:200% 200%;background-position:0 0"></span>';
  if(u.id.startsWith('convoy_'))return `<span class="battle-model" role="img" aria-label="수송대" style="background-image:url(convoys-v1.webp);background-size:400% 200%;background-position:0 ${u.id==='convoy_b'?100:0}%"></span>`;
  const structure=structureKind(u.id);if(structure){const f=structureFrame(structure);return `<span class="battle-model" role="img" aria-label="${unitName(u)}" style="background-image:url(scenery-v3.webp);background-size:400% 200%;background-position:${f%4/3*100}% ${Math.floor(f/4)*100}%"></span>`;}
  const extra=['crossbow','heavyCav','engineer','fengshui'].indexOf(u.unitClass),row=extra>=0?extra:['strategist','civilian'].includes(u.unitClass)?4:u.unitClass==='spearman'?1:u.unitClass==='archer'?2:u.unitClass==='cavalry'?3:u.unitClass==='catapult'?5:0;
  return `<span class="battle-model" role="img" aria-label="${unitName(u)}" style="background-image:var(--${extra>=0?'extra':'base'}-atlas);background-size:400% ${extra>=0?400:600}%;background-position:0 ${row/(extra>=0?3:5)*100}%"></span>`;
}
/** 장수 카드의 얼굴: 넣은 초상이 있는 이름난 장수는 초상, 아니면 병종 그림. */
function faceFor(u:Unit):string{
  const name=romanceOf(u)?.name??(u.id==='sima_yi'?'사마의':u.name);
  if(!u.name.endsWith('환영')&&(portraitImage(name)||officerLook(name)))return `<span class="battle-model officer-photo">${officerPortrait(name)}</span>`;
  // 넣은 초상·원화가 없는 이름난 장수(엄안 등): 전투 그림 한 칸은 카드에서 콩알만 해 빈칸처럼 보였다 — 초상 생성기로 지은 대체 초상을 쓴다.
  if(!u.name.endsWith('환영')&&romanceOf(u)&&specFor(name))return `<span class="battle-model officer-photo">${cardFace(name)}</span>`;
  return portraitFor(u);
}
function raceLabel(s:BattleState){const g=raceGap(s);if(!g||g.ally===undefined)return '우군 선점 저지';return `경쟁 우군 성채까지 ${g.ally}칸 · 사마의 ${g.hero??'-'}칸${g.hero!==undefined&&g.ally<g.hero?' ⚠ 우군이 앞섬':''}`;}
const ARCS:Record<string,[string,string,string]>={upper:['Ⅰ','상편','살아남는 자'],middle:['Ⅱ','중편','맞서는 자'],lower:['Ⅲ','하편','거머쥐는 자']};
/** 하단 정보창: 고른 장수(왼쪽)와 가리킨 상대(오른쪽). 싸움 연출 중에는 그 싸움을 보여 준다. */
let hudLock=false,hudAt:Coord|undefined;
function hudHover(at:Coord|undefined){
  hudAt=at;if(hudLock)return;const s=session.state,u=s.find(selected),t=at?s.unitAt(at):undefined;
  let left:{u:Unit;o?:CardOpts}|undefined=u?.alive?{u}:undefined,right:{u:Unit;o?:CardOpts}|undefined=t&&t!==u?{u:t}:undefined;
  if(!left&&t){left={u:t};right=undefined;}
  if(u&&t&&right&&t.side==='enemy'){const d=manhattan(u.pos,t.pos),def=s.strategyFor(u,mode);
    if(def&&d<=def.range){const dmg=estimateStrategy(u,t,def,s.map);right.o={preview:dmg,note:`${def.name??mode} · 예상 피해 ${dmg}`};}
    else if(mode==='attack'&&inReach(u,u.pos,t.pos)){const v=previewAttack(u,t,s.map,session.battle.wouldCounter(t,u));right.o={preview:v.hit>0?v.damage:0,note:`명중 ${v.hit}% · 피해 ${v.damage}${criticalChance(u,t)>=3?` · 회심 ${criticalChance(u,t)}%`:''}${doubleAttackChance(u,t)>1?` · 연속 ${Math.round(doubleAttackChance(u,t))}%`:''}${v.lethal?' · 격파':''}`};if(v.counter)left={u,o:{preview:v.counter.damage,note:`반격 ${v.counter.damage} · 명중 ${v.counter.hit}%`}};}}
  renderHud($('#unit-hud'),s,left,right);
}
/** 싸움이 일어나면: 친 쪽과 맞은 쪽 카드를 띄우고 체력 막대를 싸우기 전에서 뒤로 줄인다. */
function hudFight(logs:readonly LogEntry[]){
  const s=session.state,clampHp=(u:Unit,v:number)=>Math.max(0,Math.min(u.stats.maxHp,v));
  const atk=logs.find(e=>e.t==='attack'||e.t==='strategy');if(!atk)return;
  if(atk.t==='attack'){const a=s.find(atk.attacker),d=s.find(atk.defender);if(!a||!d)return;
    const back=logs.find((e):e is Extract<LogEntry,{t:'counter'}>=>e.t==='counter'&&e.attacker===d.id&&e.defender===a.id);
    renderHud($('#unit-hud'),s,{u:a,o:{hpFrom:clampHp(a,a.hp+(back?.hit?back.damage:0))}},{u:d,o:{hpFrom:clampHp(d,d.hp+(atk.hit?atk.damage:0)),note:atk.hit?`${atk.critical?'회심! ':''}피해 ${atk.damage}`:'빗나감'}});}
  else{const a=s.find(atk.caster),d=s.find(atk.targets[0]??'');if(!a)return;
    renderHud($('#unit-hud'),s,{u:a},d?{u:d,o:{hpFrom:clampHp(d,d.hp+(atk.damage[0]??0)),note:`책략 ${atk.damage[0]??0}`}}:undefined);}
  hudLock=true;
}
function render(){
  queueMicrotask(()=>hudHover(hudAt));queueMicrotask(encounterCheck);
  // 지금 실려 있는 회차 보물: 얻자마자 전장에서도 보인다.
  {const d=session.deployment,ids=d?.run?.relics??d?.runStory?.relics??d?.scenario?.relics??[],el=$('#battle-relics');el.innerHTML=(d?.trial?'<span class="trial" title="로그라이크 난이도: 적 체력 +20% · 공격 +12% · 방어 +10%. 연구로 이겨낸다.">⚠ 천명의 시련</span>':'')+ids.map(id=>RELICS.find(r=>r.id===id)).filter(Boolean).map(r=>`<span title="${r!.effect}">◈ ${r!.name}</span>`).join('');el.hidden=!ids.length&&!d?.trial;}
  if(isZhugeStage(session.state.stage.id)){const k=zhugeOrder.indexOf(session.chapter)+1;$('#arc-crumb').innerHTML=`제갈량전 <span>/</span> ${esc(chapters[session.chapter]?.year??'')}`;$('#arc-eyebrow').innerHTML=`제갈량전 <span>${k}장</span>`;}
  else if(isZhugeBranch(session.state.stage.id)){$('#arc-crumb').innerHTML=`제갈량전 <span>/</span> 선택분기`;$('#arc-eyebrow').innerHTML=`제갈량전 <span>${esc(forkOf(session.state.stage.id)?.name??'')}</span>`;}
  else{const [no,arc,name]=session.deployment?.branch?['∞','연의','선택분기']:session.deployment?.run?['∞','원정','천명의 길']:ARCS[(session.state.stage as {arc?:string}).arc??'upper']??ARCS.upper!;$('#arc-crumb').innerHTML=`${arc} <span>/</span> ${name}`;$('#arc-eyebrow').innerHTML=`제${({'Ⅰ':1,'Ⅱ':2,'Ⅲ':3} as Record<string,number>)[no]??''}편 <span>${arc}</span>`;}
  const s=session.state,c=session.deployment?.run?{...chapters[session.chapter]!,stage:s.stage,year:session.deployment.scenario?`시나리오 · ${scenarioYear(session.deployment.scenario.chapter)}`:session.deployment.branch?`연의 · 선택분기 · ${routeById(session.deployment.run.route?.[3]??session.deployment.run.route?.[2]??session.deployment.run.route?.[1])?.name??''}`:`천명의 원정 · ${session.deployment.run.floor}층`}:session.deployment?.mission?{...chapters[session.chapter]!,stage:s.stage,year:'외전 · 수련과 인연'}:chapters[session.chapter]!;
  $('#stage-title').textContent=c.stage.title;$('#stage-subtitle').textContent=session.deployment?.scenario?(session.deployment.run?'시나리오 · 가상 전장':`시나리오 · 연의 · ${s.difficulty==='normal'?'일반':'극한'}`):session.deployment?.branch?'연의 · 선택분기 가상 전장':session.deployment?.run?`천명의 원정 · ${session.deployment.run.floor}/${RUN_FLOORS}층`:session.deployment?.runStory?`천명의 원정 · ${session.deployment.runStory.floor}/${RUN_FLOORS}층 · 연의 전장`:isZhugeBranch(c.stage.id)?'제갈량전 · 선택분기 가상 전장':isZhugeStage(c.stage.id)?`제갈량전 제 ${zhugeOrder.indexOf(session.chapter)+1}장 · ${s.difficulty==='normal'?'일반':'극한'}`:`제 ${c.stage.order}장 · ${s.difficulty==='normal'?'일반':'극한'}`;
  $('#map-name').textContent=c.stage.subtitle??c.stage.title;$('#year').textContent=`${c.year} · ${s.map.width}×${s.map.height}`;
  document.body.classList.toggle('nightmare',session.chapter===4);
  $('.weather').textContent=session.weather;
  const objective=(session.deployment?.mission?.version??1)>=3?trialProgress(s):session.chapter===6?`${session.phase} · 조조 HP ${s.find('cao_cao')?.hp??0}/180 · 3턴 후방 복병`:session.chapter===5?`${session.phase} · 수송대 ${s.living('allyAi').length}/2 생존`:session.chapter===3?`${session.phase} · 추격 압박 ${session.pressure}/${session.pressureLimit}`:session.chapter===0?`${session.phase} · 지참금 ${session.funds}전`:session.chapter===1?`${session.phase} · ${raceLabel(s)}`:`${session.phase} · 남은 적 ${s.living('enemy').length}부대`;
  $('#compact-objective').textContent=objective;
  const cond=session.conditions;$('#compact-objective').title=`승리: ${winText(cond)}\n패배: ${cond.lose.join(' · ')}${cond.limit?`\n${cond.limit}`:''}`;
  // 지도 위 목표 띠: 지금 걸린 승리 조건(진행 ✓·수 포함)과 패배 조건을 늘 보인다. 전투 중 목표가 바뀌면 알린다.
  // 범례(이동 가능·적 시야·목표)도 이 상자 안에 둔다. 따로 지도 구석에 두면 그 자리의 유닛을 덮는다.
  $('#map-objective').innerHTML=`<button class="mo-toggle" type="button" aria-expanded="${objectiveBox.open}" aria-controls="map-objective" title="승리·패배 조건 펼치기·접기 (O)"><b>◇ 목표</b><span class="mo-short" title="${esc(winText(cond))}">${esc(winText(cond))}</span>${cond.limit?`<span class="mo-short-limit" title="${esc(cond.limit)}">${esc(cond.limit)}</span>`:''}<i class="mo-arrow"></i></button><div class="mo-body"><p class="mo-win"><b>승리</b> ${cond.win.map(esc).join(' <i>또는</i> ')}</p><p class="mo-lose"><b>패배</b> ${cond.lose.map(esc).join(' · ')}</p>${cond.limit?`<p class="mo-limit"><b>기한</b> ${esc(cond.limit)}</p>`:''}${hudSeals()}${hudContests()}<p class="mo-legend">${LEGEND_HTML}</p>${objectiveBox.guide?'<p class="mo-guide">처음 한 번만 펼쳐 안내합니다 · 다시 보려면 「◇ 목표」를 누르거나 O 키 · 전황 패널에도 늘 있습니다</p>':''}</div>`;
  $('#map-objective').classList.toggle('collapsed',!objectiveBox.open);
  {const key=JSON.stringify(s.victory);if(objectiveSeen.session===session&&objectiveSeen.key!==key&&s.outcome==='ongoing'){toast(`목표가 바뀌었습니다 — ${winText(cond)}`);const el=$('#map-objective');el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}objectiveSeen.session=session;objectiveSeen.key=key;}
  // 탈출·도착·점령 목표는 지도에서 그 칸을 몇 초 깜박여 어디로 가야 하는지 보인다.
  {const marks=goalMarks(s),key=marks.map(m=>m.target).join();if((goalSeen.session!==session||goalSeen.key!==key)&&s.outcome==='ongoing'&&marks.length)field.flashGoals(marks,showGoal);goalSeen.session=session;goalSeen.key=key;}
  $('#objectives').innerHTML=`<p><b>◇</b> ${objective}</p>${conditionsHtml(cond)}<div class="resource-strip">구급약 ${session.medicine} · ${session.scouted?'정찰 완료':'살피기로 경로 확인'}</div>`;
  $('#turn').textContent=String(s.turn).padStart(2,'0');{const tl=$('#turn-limit'),x=session.extremeLimit!==undefined&&session.deadline===session.extremeLimit;tl.textContent=x?`/ ${session.deadline} 극한`:`/ ${session.deadline??60}`;tl.classList.toggle('extreme-limit',x);tl.title=x?`극한: ${session.deadline}턴 안에 승리하지 못하면 패배`:'';}$('#phase').textContent=`${sideNames[s.currentSide]}의 차례`;
  document.querySelectorAll('.phase-track i').forEach((el,i)=>el.classList.toggle('active',i===s.phaseIndex));
  const roster=s.living(s.currentSide).sort((a,b)=>Number(a.hasActed)-Number(b.hasActed));$('#unit-count').textContent=`${roster.length}부대`;
  $('#roster').innerHTML=roster.map(u=>`<button data-unit="${u.id}" class="roster-unit ${u.id===selected?'selected':''} ${u.hasActed?'spent':''}"><span class="unit-symbol ${u.side}">${u.id==='sima_yi'?'사':u.id==='cao_zhen'?'조':classNames[u.unitClass]?.slice(0,1)}</span><span><strong>${unitName(u)}</strong><small>${classNames[u.unitClass]} · Lv.${u.level}${xpOf(u)?` · 경험 ${xpOf(u)!.now}`:''}</small><i class="mini-hp"><i style="width:${u.hp/u.stats.maxHp*100}%"></i></i></span><span>${u.hasActed?'✓':'●'}</span></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(b=>b.onclick=()=>select(b.dataset.unit!));
  renderUnit(s.find(selected));
  $<HTMLButtonElement>('#end-phase').disabled=!CONTROLLABLE.has(s.currentSide)||s.outcome!=='ongoing'||field.busy||!!session.activeDuel;
  $<HTMLButtonElement>('#undo').disabled=!session.checkpoints.length||field.busy;
  $('#tactical-tip').textContent=session.revision>=4&&session.chapter===4?'여포는 물리 공격이 강합니다. 무력보다 지력 차이를 활용해 설전 승리와 혼란을 노리세요. 각 대결이 끝나면 체력·MP가 회복됩니다.':session.revision>=4?'일기토는 붙어 선 적(대각선 포함), 설전은 3칸 이내 적을 선택합니다. 충차는 성문·감시탑에 피해 3배. 풍수사는 소회복·회복으로 아군을 치유하고, 상승 책략으로 북돋웁니다.':'목표와 승리 조건을 확인하세요. 본대 다음 편입 아군을 직접 지휘합니다.';
  {const tu=session.state.find(selected),ct=tu&&tu.side==='player'&&tu.alive?contestTip(tu):'';if(ct)$('#tactical-tip').textContent=ct+' · '+$('#tactical-tip').textContent;}
  sound.scene=s.outcome!=='ongoing'?'result':session.chapter===4?'dream':s.living('player').some(u=>u.hp<u.stats.maxHp*.35)?'crisis':bossNear(s.living())?'boss':'battle';
  renderCoach();queueLines();stackOverlays();
  // 첫 차례(아직 아무도 움직이지 않음)에는 아군 전원을, 그 뒤에는 고른 장수를 상자 밖에 둔다. 대화 선택으로 합류한 장수도 포함된다.
  {const st=session.state,fresh=st.turn===1&&st.currentSide==='player'&&!st.living('player').some(u=>u.hasMoved||u.hasActed);keepUnitsClear(!fresh);}
  if(fieldReady){consumeLog();field.render(s,selected,mode,threat,session.scouted);}checkModal();if(resultShown&&!scorePending)markScored();
}
let lineSeen=new Set<string>(),lineQueue:{speaker:string;text:string}[]=[],lineTimer:ReturnType<typeof setTimeout>|undefined,lineToken=0;
function queueLines(){
  if(session.deployment?.mission||session.state.outcome!=='ongoing')return;
  for(const l of dueLines(session.state.stage.id,session.state,lineSeen)){lineSeen.add(l.id);lineQueue.push(l);}
  if(!lineTimer)showNextLine();
}
function showNextLine(){
  const el=$('#battle-line'),next=lineQueue.shift();
  if(!next){el.hidden=true;lineTimer=undefined;stackOverlays();return;}
  // 초상을 받은 뒤에 띄운다: 처음 나오는 장수는 그림을 받는 동안 빈 칸으로 보였다(최대 1.5초 기다림).
  const html=dialogueCaption(next.speaker,next.text),url=/url\('([^']+)'\)/.exec(html)?.[1],token=++lineToken;
  const reveal=()=>{if(token!==lineToken)return;el.innerHTML=html;el.hidden=false;$('#latest-log').textContent=`${next.speaker}: ${next.text}`;stackOverlays();
    lineTimer=setTimeout(showNextLine,Math.min(6500,2600+next.text.length*45));};
  if(!url){reveal();return;}
  const img=new Image();let shown=false;const go=()=>{if(shown)return;shown=true;clearTimeout(lineTimer);reveal();};
  img.onload=go;img.onerror=go;lineTimer=setTimeout(go,1500);img.src=url;
}
/** 지도 위 띠를 겹치지 않게 위에서부터 쌓는다: 전투 대사 → 승리·패배 조건 → 첫 전투 안내. 글 길이에 따라 높이가 달라 고정 위치로는 겹친다. */
let stackFrame=0;
const LEGEND_HTML=`<i class="dot teal"></i> 이동 가능 <i class="dot red"></i> 적 시야 / 사거리 <i class="dot gold"></i> 목표 <i class="dot amber"></i> 순찰 길·순찰 시야`;
function stackOverlays(){cancelAnimationFrame(stackFrame);stackFrame=requestAnimationFrame(()=>{
  const map=$('#map'),obj=$('#map-objective'),line=$('#battle-line'),coach=$('#coach');
  obj.style.top='';coach.style.top='';const mr=map.getBoundingClientRect();if(!mr.height)return;
  const shown=(el:HTMLElement)=>!el.hidden&&getComputedStyle(el).display!=='none',crosses=(a:DOMRect,b:DOMRect)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
  const below=(r:DOMRect)=>Math.ceil(r.bottom-mr.top+6)+'px';
  if(map.contains(obj)&&shown(line)&&shown(obj)){const lr=line.getBoundingClientRect();if(crosses(lr,obj.getBoundingClientRect()))obj.style.top=below(lr);}
  if(shown(coach)){for(const el of [line,obj])if(shown(el)){const r=el.getBoundingClientRect();if(crosses(r,coach.getBoundingClientRect()))coach.style.top=below(r);}}
  // 아래쪽: 회차 보물·천명의 시련 꼬리표가 안내 글(#tile-info)을 덮지 않게 글을 그만큼 오른쪽에서 시작한다.
  const relics=$('#battle-relics'),tip=$('#tile-info');tip.style.paddingLeft='';if(shown(relics)&&relics.innerHTML.trim()){const rr=relics.getBoundingClientRect(),tr=tip.getBoundingClientRect();if(crosses(rr,tr))tip.style.paddingLeft=Math.ceil(rr.right-tr.left+10)+'px';}
  // 전투 대사 띠가 아군을 덮으면 반대쪽 가장자리(위↔아래)로, 첫 전투 안내·승리 조건은 왼쪽↔오른쪽으로 옮긴다. 양쪽 다 덮으면 덜 덮는 쪽.
  const pts=field.unitScreenPoints(['player','ally']),flipAway=(el:HTMLElement,cls:string)=>{if(!shown(el))return;
    const hits=()=>{const r=el.getBoundingClientRect();return pts.filter(p=>p.x>r.left-8&&p.x<r.right+8&&p.y>r.top-8&&p.y<r.bottom+8).length;};
    const a=hits();if(a){el.classList.toggle(cls);const b=hits();if(b>=a)el.classList.toggle(cls);}};
  flipAway(line,'flip');flipAway(coach,'side-right');flipAway(obj,'side-right');
  // 낮은 화면(휴대폰 가로): 안내가 아직 대사 띠·승리 조건과 겹치면 반대쪽으로, 그래도 겹치면 대사가 끝날 때까지 잠시 숨긴다.
  coach.classList.remove('yield');
  const clash=()=>shown(coach)&&[line,obj].some(el=>shown(el)&&crosses(el.getBoundingClientRect(),coach.getBoundingClientRect()));
  if(clash()){coach.classList.toggle('side-right');if(clash()){coach.classList.toggle('side-right');if(shown(line))coach.classList.add('yield');}}
  // 목표 지점을 비추는 동안에는 승리 조건 상자가 그 칸을 덮지 않게: 반대쪽으로 옮기고, 그래도 덮으면 접고,
  // 접힌 꼬리표마저 덮으면 깜박임이 끝날 때까지 잠시 감춘다.
  obj.classList.remove('goal-hide');
  const goal=field.goalScreenPoints();if(goal.length&&shown(obj)){
    const hits=()=>{const r=obj.getBoundingClientRect();return goal.filter(p=>p.x>r.left-8&&p.x<r.right+8&&p.y>r.top-8&&p.y<r.bottom+8).length;};
    const a=hits();if(a){obj.classList.toggle('side-right');const b=hits();if(b>=a)obj.classList.toggle('side-right');
      if(Math.min(a,b)&&!objectiveBox.guide){if(objectiveBox.open)setObjectiveOpen(false);else obj.classList.add('goal-hide');}}}
});}
/** 목표 지점이 화면에 나온 때·카메라가 돌아온 때·깜박임이 끝난 때: 상자가 목표·아군을 덮지 않게 다시 놓는다. */
function showGoal(phase:'shown'|'back'|'end'){stackOverlays();if(phase==='back')keepUnitsClear(false);}// 돌아온 카메라가 아군을 상자 밑에 두지 않게
/** 지도 위 상자(목표·장수 카드·명령 단추·첫 전투 안내·조작 단추)가 아군을 덮으면 카메라를 조금 밀어 꺼낸다.
 * 전투 시작에는 아군 전원, 장수를 고른 뒤에는 그 장수만 본다. 카메라는 지도 끝을 넘지 않는다. */
let clearFrame=0;
function keepUnitsClear(onlySelected:boolean){cancelAnimationFrame(clearFrame);clearFrame=requestAnimationFrame(()=>{
  const map=$('#map'),mr=map.getBoundingClientRect();if(!mr.height||menuOpen)return;
  const shown=(el:HTMLElement)=>!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&+getComputedStyle(el).opacity>.05;
  const boxes=['#map-objective','#unit-hud.show>*','#action-dock','#coach','#left-toggle','.map-controls','#battle-relics','.tactical-minimap','#tile-info']
    .flatMap(s=>[...map.querySelectorAll<HTMLElement>(s)]).filter(shown).map(e=>e.getBoundingClientRect()).filter(r=>r.width>4&&r.height>4);
  let pts=field.unitScreenPoints(['player','ally']);if(onlySelected)pts=pts.filter(p=>p.id===selected);
  const edge=10,pad=12,inView=(x:number,y:number)=>x>mr.left+edge&&x<mr.right-edge&&y>mr.top+edge&&y<mr.bottom-edge;
  pts=pts.filter(p=>inView(p.x,p.y));if(!pts.length||!boxes.length)return;
  const under=(x:number,y:number)=>boxes.find(r=>x>r.left-pad&&x<r.right+pad&&y>r.top-pad&&y<r.bottom+pad);
  const bad=(dx:number,dy:number)=>pts.reduce((n,p)=>n+(!inView(p.x+dx,p.y+dy)||under(p.x+dx,p.y+dy)?1:0),0);
  const base=bad(0,0);if(!base)return;
  const tries:[number,number][]=[];
  for(const p of pts){const r=under(p.x,p.y);if(!r)continue;
    tries.push([r.right+pad+6-p.x,0],[r.left-pad-6-p.x,0],[0,r.bottom+pad+6-p.y],[0,r.top-pad-6-p.y]);}
  const lim=Math.min(mr.width,mr.height)*.45;let best:[number,number]|undefined,bestBad=base,bestLen=Infinity;
  for(const [dx,dy] of tries){if(Math.abs(dx)>lim||Math.abs(dy)>lim)continue;const n=bad(dx,dy),len=Math.hypot(dx,dy);if(n<bestBad||(n===bestBad&&best&&len<bestLen)){best=[dx,dy];bestBad=n;bestLen=len;}}
  if(best){field.panBy(best[0],best[1]);stackOverlays();}// 카메라가 움직였으니 대사 띠·안내 상자 자리도 다시 정한다
});}
addEventListener('resize',stackOverlays);
function coachDone(){try{return localStorage.getItem(COACH_KEY)==='1';}catch{return false;}}
function finishCoach(){try{localStorage.setItem(COACH_KEY,'1');}catch{/* Storage may be blocked; the coach simply shows again. */}$('#coach').hidden=true;}
function renderCoach(){
  const s=session.state,el=$('#coach');
  if(s.stage.id!=='S1-01'||session.deployment?.mission||coachDone()){el.hidden=true;return;}
  if(s.turn>1||s.outcome!=='ongoing'){finishCoach();return;}
  const text=coachStep(s.turn,s.currentSide==='player',s.living('player').map(u=>({id:u.id,hasMoved:u.hasMoved,hasActed:u.hasActed})),selected);
  el.hidden=!text;if(text)el.querySelector('p')!.textContent=text;stackOverlays();
}
/** 원정 전투: 다음 레벨까지의 경험치(이번 전투에서 번 만큼 포함). */
function xpOf(u:Unit){return session.xpProgress(u.id);}
function xpBar(u:Unit):Array<[string,string,number,number]>{const x=xpOf(u);return x&&x.need?[['xp',`경험치 · 이번 전투 +${x.gained}`,x.now,x.need]]:[];}
function renderUnit(u:Unit|undefined){
  if(!u)return;const s=session.state,can=u.alive&&!u.hasActed&&u.side===s.currentSide&&CONTROLLABLE.has(u.side)&&s.outcome==='ongoing';
  const feature=session.revision>=4?officerFeatures[u.id]:undefined;const talents=session.revision<8&&session.deployment?.growth?talentTree(u.id,u.level,session.deployment.growth):[];
  // 한 화면 장수 카드: 초상·이름·체력/책략/경험 막대·능력치 8칸·성격·특성(이름만)·책략(눌러서 선택)·상태
  const r=romanceOf(u),temper=r?temperOf(r.name):undefined,sk=session.revision>=8?undefined:r?.skill??feature;
  const ab=u.ccRules?u.ability:undefined;
  // 조조전 규칙 전투: 장수 능력 다섯(무력·지력·통솔·민첩·운)과 부대 공격·방어·이동. 순발력·사기는 칸에 마우스를 올리면 보인다.
  const statCells=ab?[['무력',ab.war],['지력',ab.int],['통솔',ab.lead],['민첩',ab.agi],['운',ab.luck],['공격',u.stats.attack],['방어',u.stats.defense],['이동',u.stats.movement]] as Array<[string,number]>:[...(r&&!u.name.endsWith('환영')?[['무력',r.war],['지력',r.int],['통솔',r.lead],['정치',r.pol],['매력',r.cha]]:[['무력',martialPower(u)],['지력',u.stats.intellect]]),['공격',u.stats.attack],['방어',u.stats.defense],['이동',u.stats.movement]] as Array<[string,number]>;
  const known=s.usableStrategies(u);
  // 사신 책략은 날씨가 맞아야 부를 수 있다(청룡=비 · 주작=맑음 · 현무=흐림): 맞지 않으면 흐리게 하고 이유를 단다.
  const sky=(id:string)=>jewelWeatherBlock(id,s.weather),skyNeed=(id:string)=>({rain:'☂ 비 올 때',clear:'☀ 맑을 때',cloudy:'☁ 흐릴 때',fog:'≋ 안개 낄 때',snow:'❄ 눈 올 때'} as Record<string,string>)[JEWEL_WEATHER[id]??'']??'';
  const strategyChips=known.map(id=>{const d=s.strategyFor(u,id)!,tier=d.tier??1,why=sky(id);const off=!can||u.mp<d.mpCost||s.hasStatus(u,'seal')||!!why;return `<button class="uc-strat t${tier}${mode===id?' active':''}${why?' weather-off':''}" data-uc-strat="${id}" ${off?'disabled':''} title="${why?why+' · ':''}${d.name} · ${STRATEGY_TIER_NAMES[tier]} · 위력 ${d.power} · ${strategyHint(id)}"><img src="${strategyIconUrl(id,tier)}" alt=""><b>${d.name}</b><small>${why?skyNeed(id):d.mpCost}</small></button>`;}).join('');
  const effects=unitEffectNotes(u),traits=[...(sk?[{n:sk.name,d:sk.description,on:true}]:[]),...talents.map(t=>({n:t.name,d:t.ready?t.description:t.requirement,on:t.ready}))].filter((t,i,a)=>a.findIndex(x=>x.n===t.n)===i);
  $('#unit-detail').innerHTML=`<div class="uc"><div class="uc-head"><div class="portrait uc-face"><div>${faceFor(u)}</div><span class="portrait-tag">${sideNames[u.side]}</span></div><div class="uc-id"><h2>${unitName(u)}</h2><small>${classNames[u.unitClass]} · Lv.${u.level}${r?.epithet?` · ${r.epithet}`:''}</small>${[['hp','체력',u.hp,u.stats.maxHp],['mp','책략',u.mp,u.stats.maxMp],...xpBar(u).map(([k,,v,m])=>[k,'경험',v,m] as [string,string,number,number])].map(([kind,name,value,max])=>`<div class="uc-bar ${kind}"><span>${name}</span><i><i style="width:${Number(value)/Math.max(1,Number(max))*100}%"></i></i><b>${value}<small>/${max}</small></b></div>`).join('')}</div></div>
    <div class="uc-stats"${ab?` title="순발력 ${u.stats.agility} · 사기 ${u.stats.morale} · 정신력 ${u.stats.spirit}"`:''}>${statCells.map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    ${effects.length?`<div class="uc-effects" aria-label="장수와 병종 효과">${effects.map(e=>`<article class="uc-effect tone-${effectTone(e)}" title="${esc(e.text)}"><span class="uc-effect-icon">${effectIcon(e)}</span><div><b>${esc(e.name)}${e.kind==='famed'?'':` <i>${'Ⅰ Ⅱ Ⅲ Ⅳ'.split(' ')[Math.max(0,Math.min(3,e.tier-1))]}</i>`}</b><small>${e.kind==='troop'?'병종 효과':e.kind==='officer'?'장수 효과':e.kind==='signature'?'고유 효과':'명성 효과'}</small><p>${esc(e.text)}</p></div></article>`).join('')}</div>`:''}
    ${temper||traits.length?`<div class="uc-traits">${temper?`<span class="uc-chip temper" title="일기토·설전에 응하는 방식">성격 · ${temperNames[temper]}</span>`:''}${traits.map(t=>`<span class="uc-chip${t.on?'':' locked'}" title="${t.d.replace(/"/g,'&quot;')}">${t.on?'◆':'◇'} ${t.n}</span>`).join('')}</div>`:''}
    ${known.length?`<div class="uc-strats"><div class="uc-label">책략</div><div class="uc-strat-list">${strategyChips}</div></div>`:''}
    <p class="uc-tip">${classTactics(u.unitClass).map(t=>`전법 「${t.name}」`).join(' · ')}${classTactics(u.unitClass).length?' · ':''}일반 공격 사거리 ${u.range[0]===u.range[1]?u.range[0]:`${u.range[0]}~${u.range[1]}`} · ${unitReachLabel(u)}${u.statuses.length?` · <b>${u.statuses.map(x=>(STATUS_NAMES[x.kind]??x.kind)+' '+x.turns+'턴').join(' · ')}</b>`:''}</p></div>`;
  const buttons=[{id:'move',name:'이동',icon:'➶',meta:'1',disabled:u.hasMoved},{id:'attack',name:'공격',icon:'⚔',meta:'2',disabled:u.unitClass==='civilian'},...known.map(id=>{const d=s.strategyFor(u,id)!,why=sky(id);return {id,name:d.name,icon:`<img src="${strategyIconUrl(id,d.tier??1)}" alt="">`,meta:why?skyNeed(id):d.mpCost+' MP',disabled:u.mp<d.mpCost||s.hasStatus(u,'seal')||!!why,...(why?{why}:{})};}),{id:'wait',name:'대기',icon:'◷',meta:'W',disabled:false}];
  if(session.deployment&&familyOf(u.unitClass)==='fengshui')buttons.push({id:'heal',name:'기본 회복',icon:'회',meta:'8 MP',disabled:u.mp<8||s.hasStatus(u,'seal')});
  if(familyOf(u.unitClass)==='engineer')buttons.push({id:'repair',name:'수리',icon:'수',meta:'인접',disabled:false},{id:'fortify',name:'방책',icon:'책',meta:session.barricadesLeft(u.id)+'회',disabled:session.barricadesLeft(u.id)<=0});
  if(session.revision>=4&&!['civilian','ram','catapult'].includes(familyOf(u.unitClass))&&!structureKind(u.id))buttons.push({id:'duel',name:'일기토',icon:'겨',meta:session.contestKinds(u).has('duel')?'5합':'무력형만',disabled:!session.contestKinds(u).has('duel')},{id:'debate',name:'설전',icon:'논',meta:session.contestKinds(u).has('debate')?'5합':'지력형만',disabled:!session.contestKinds(u).has('debate')});
  if(session.canCalm)buttons.push({id:'calm',name:'진정',icon:'진',meta:String(session.medicine),disabled:!session.medicine});
  // 도구(소모품): 부대 공용 보관함에 있는 것만. 자신 또는 상하좌우로 붙은 아군에게 쓴다.
  for(const d of CONSUMABLES){const n=s.inventory[d.id]??0;if(n>0&&u.canUseItems&&u.unitClass!=='civilian')buttons.push({id:'use:'+d.id,name:d.name,icon:supplyIcon(d.id,d.name),meta:n+'개',disabled:false});}
  buttons.push({id:'scout',name:'살피기',icon:'살',meta:'행동',disabled:session.scouted},{id:'medicine',name:'구급약',icon:'약',meta:String(session.medicine),disabled:!u.canUseItems||u.unitClass==='civilian'||!session.medicine||u.hp===u.stats.maxHp});
  const region=[...s.map.regions].find(([name,coords])=>s.victory.some(v=>v.type==='capture'&&v.target===name)&&coords.some(c=>c.x===u.pos.x&&c.y===u.pos.y));
  if(region&&u.side==='player')buttons.push({id:'capture',name:'거점 확보',icon:'⚑',meta:'',disabled:session.chapter===6&&!!s.find('ma_chao')?.alive});
  $('#commands').innerHTML=buttons.map(b=>`<button title="${b.why?b.why+' · ':''}${strategyHint(b.id)}" data-command="${b.id}" class="${mode===b.id?'active':''}" ${!can||b.disabled||field.busy?'disabled':''}><span>${b.icon}</span>${b.name}<small>${b.meta}</small></button>`).join('');
  const runCmd=(id:string)=>{dockOpen='';if(id==='wait')act({kind:'wait',unit:u.id});else if(id==='capture'&&region)act({kind:'capture',unit:u.id,region:region[0]});else if(['scout','medicine'].includes(id)){if(id==='scout')threat=true;act({kind:'item',unit:u.id,item:id});}else{mode=id;render();}};
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(b=>b.onclick=()=>runCmd(b.dataset.command!));
  document.querySelectorAll<HTMLButtonElement>('[data-uc-strat]').forEach(b=>b.onclick=()=>runCmd(b.dataset.ucStrat!));
  renderDock(buttons,can&&!field.busy,runCmd);
  $('#command-hint').textContent=!can?(u.side==='enemy'?'붉은 칸: 이 적이 다음 차례에 움직일 수 있는 곳 · 옅은 칸: 거기서 칠 수 있는 곳':u.side==='allyAi'?'초록 칸: 이 우군이 움직일 수 있는 곳':'해당 부대의 차례에 조작할 수 있습니다.'):mode==='move'?'푸른 칸을 선택해 이동하세요.':mode==='heal'?'3칸 이내 부상당한 아군을 선택하세요.':mode.startsWith('use:')?`${consumable(mode.slice(4))?.name??'도구'}: 자신 또는 상하좌우로 붙은 아군을 선택하세요.`:mode==='calm'?'2칸 이내에서 혼란에 빠진 아군을 선택하세요. 구급약 1개를 씁니다.':mode==='repair'?'인접한 아군 충차·포차·방책·성문을 선택해 수리하세요.':mode==='fortify'?'인접한 빈 칸을 선택해 방책을 세우세요.':s.strategies.get(mode)?.targetSides.includes('player')?'사거리 안의 아군을 선택해 지원하세요.':mode==='duel'?'붙어 선 적(대각선 포함 8방향)을 선택하세요. 무력으로 5합을 겨룹니다.':mode==='debate'?'3칸 이내(대각선 포함) 적을 선택하세요. 지력으로 5합을 겨룹니다.':'사거리 안의 적을 선택하세요.';
}
/**
 * 지도 오른쪽 아래의 둥근 명령 단추(조조전 온라인처럼): 이동·공격·책략·특수(일기토·설전)·도구·대기.
 * 책략·특수·도구는 눌렀을 때 위로 목록이 펼쳐진다.
 */
let dockOpen='';
type DockBtn={id:string;name:string;icon:string;meta:string;disabled:boolean;why?:string};
function renderDock(buttons:DockBtn[],can:boolean,run:(id:string)=>void){
  const dock=$('#action-dock');if(!can){dock.hidden=true;document.body.classList.remove('dock-on');return;}
  const by=(ids:string[])=>buttons.filter(b=>ids.includes(b.id)),known=new Set(['move','attack','wait','duel','debate','scout','medicine','calm','capture']);
  const strat=buttons.filter(b=>!known.has(b.id)&&!b.id.startsWith('use:')),special=by(['duel','debate']),tools=[...by(['medicine','scout','calm','capture']),...buttons.filter(b=>b.id.startsWith('use:'))];
  const groups:Array<{key:string;label:string;items?:DockBtn[]|undefined;one?:DockBtn|undefined;tone:string}>=[
    {key:'move',label:'이동',one:buttons.find(b=>b.id==='move'),tone:'jade'},
    {key:'attack',label:'공격',one:buttons.find(b=>b.id==='attack'),tone:'red'},
    ...(strat.length?[{key:'strat',label:'책략',items:strat,tone:'blue'}]:[]),
    ...(special.length?[{key:'special',label:'대결',items:special,tone:'gold'}]:[]),
    ...(tools.length?[{key:'tools',label:'도구',items:tools,tone:'brown'}]:[]),
    {key:'wait',label:'대기',one:buttons.find(b=>b.id==='wait'),tone:'grey'},
  ];
  const open=groups.find(g=>g.key===dockOpen&&g.items);
  dock.innerHTML=`${open?`<div class="dock-pop" role="menu">${open.items!.map(b=>`<button role="menuitem" data-dock-cmd="${b.id}" class="${mode===b.id?'active':''}${b.why?' weather-off':''}" ${b.why?`title="${b.why}"`:''} ${b.disabled?'disabled':''}><i>${b.icon}</i><b>${b.name}</b><small>${b.meta}</small></button>`).join('')}</div>`:''}
    <div class="dock-row">${groups.map(g=>{const active=g.one?mode===g.one.id:!!g.items?.some(b=>b.id===mode),off=g.one?g.one.disabled:g.items!.every(b=>b.disabled);
      return `<button class="dock-btn tone-${g.tone}${active?' active':''}${dockOpen===g.key?' open':''}" data-dock="${g.key}" ${off?'disabled':''} aria-label="${g.label}"><i class="dock-ico">${DOCK_ICONS[g.key]??''}</i><b>${g.label}</b></button>`;}).join('')}</div>`;
  dock.hidden=false;document.body.classList.add('dock-on');
  requestAnimationFrame(()=>{const row=dock.querySelector<HTMLElement>('.dock-row');if(row)document.body.style.setProperty('--dock-w',row.offsetWidth+'px');});
  dock.querySelectorAll<HTMLButtonElement>('[data-dock]').forEach(b=>b.onclick=e=>{e.stopPropagation();const g=groups.find(x=>x.key===b.dataset.dock)!;
    if(g.one)run(g.one.id);else{dockOpen=dockOpen===g.key?'':g.key;render();}});
  dock.querySelectorAll<HTMLButtonElement>('[data-dock-cmd]').forEach(b=>b.onclick=e=>{e.stopPropagation();run(b.dataset.dockCmd!);});
}
/** 고른 장수가 겨룰 수 있는 이름있는 적장: 일기토(곁 8칸)·설전(3칸 안). 지금 닿는 상대는 「지금」으로 표시한다. */
function contestTip(u:Unit){
  const st=session.state,foes=st.living('enemy').filter(e=>!!romanceOf(e)&&!structureKind(e.id));if(!foes.length)return '';
  const dist=(e:Unit)=>Math.max(Math.abs(e.pos.x-u.pos.x),Math.abs(e.pos.y-u.pos.y));
  const list=(kind:'duel'|'debate',reach:number)=>foes.filter(e=>session.contestAllowed(u,e,kind)).sort((a,b)=>dist(a)-dist(b)).slice(0,4).map(e=>`${unitName(e)}${dist(e)<=reach?'(지금)':`(${dist(e)}칸)`}`);
  const duel=list('duel',1),debate=list('debate',3);
  if(!duel.length&&!debate.length)return `${unitName(u)}이(가) 겨룰 적장이 지금 전장에 없다.`;
  return [duel.length?`일기토 상대: ${duel.join(' · ')}`:'',debate.length?`설전 상대: ${debate.join(' · ')}`:''].filter(Boolean).join(' / ');
}
function select(id:string){selected=id;const u=session.state.find(id);if(u)field.focusUnit(u.pos);mode=u?.hasMoved?'attack':'move';sound.select(u?.unitClass);if(objectiveBox.auto)setObjectiveOpen(false);render();keepUnitsClear(true);}
/** S1-02 지참금 줄: 노잣돈을 내면 남는 돈과, 남문 통행료(1,000전)가 모자라게 되는지 미리 알려 준다. */
function fundsNote(node:string){
  const bribe=node==='bribe'||node==='lie_failed',cost=session.bribes===0?1000:1500,left=session.funds-cost;
  const warn=bribe&&left<1000?`<b class="funds-warn">노잣돈(${cost.toLocaleString()}전)을 내면 ${Math.max(0,left).toLocaleString()}전만 남아 남문 통행료가 모자랍니다 — 남문에 닿는 순간 패배합니다.</b>`:'';
  const ok=session.funds>=1000;
  return `<p class="ink-extra">지참금 ${session.funds.toLocaleString()}전 · 남문 통행료 1,000전 ${ok?'확보':'<b class="funds-warn">부족</b>'}${bribe?` · 이번 노잣돈 ${cost.toLocaleString()}전`:''}</p>${warn?`<p class="ink-extra">${warn}</p>`:''}`;
}
/** 패배 이유 한 줄: 세션이 남긴 이유가 없을 때 패배 조건에서 찾는다(누가 퇴각했는지, 턴 제한인지). */
function defeatCause(s:BattleState){
  for(const c of s.defeat){if(c.type==='retreat'&&c.unit){const u=s.find(c.unit);if(u&&!u.alive)return `${u.name.replace(/의?\s*환영$/,'')} 퇴각`;}}
  const limit=s.defeat.find(c=>c.type==='turn_limit');if(limit&&s.turn>(limit.n??Infinity))return `${limit.n}턴 안에 끝내지 못함`;
  const fallen=[...s.units.values()].filter(u=>!u.alive&&(u.side==='player'||u.side==='allyAi')&&(u.side==='player'||/[가-힣]/.test(u.name))).map(u=>u.name);
  return fallen.length?`${fallen.slice(0,3).join('·')} 퇴각`:'패배 조건 충족';
}
function act(command:Command){
  if(field.busy){toast('동작이 끝나면 명령할 수 있습니다.');return;}
  if(menuOpen||$<HTMLDialogElement>('#modal').open&&command.kind!=='choose'&&!(command.kind==='item'&&command.item.startsWith('duel-round:')))return;
  const prev=session.state.currentSide,r=session.act(command);if(!r.ok){toast(r.error??'명령 실패');if(command.kind==='choose')render();return;}// 거절된 선택지: 대화창을 다시 띄운다(창만 닫히고 대화가 남아 모든 명령이 막히던 문제)
  if(command.kind==='item'&&['duel','debate'].includes(command.item)){duelPresented=false;if(session.lastRefusal){showRefusal();return;}}
  if(prev!==session.state.currentSide){const next=session.state.living(session.state.currentSide).find(u=>!u.hasActed);if(next){selected=next.id;field.focusUnit(next.pos);mode='move';}}
  // 움직인 뒤에는 공격 대기: 책략은 플레이어가 책략 목록에서 고를 때만 쓴다(자동으로 책략을 고르지 않는다).
  if(command.kind==='move')mode='attack';
  persist();render();pump();
}
/** AI pacing: a unit that does something gets its beat; one that only holds its ground
 * leaves no log entry, and the next unit follows at once instead of an empty pause. */
let quietTick=false;
/**
 * 자동 전투(조조전 Online의 '자동'): 아군 차례에 장수 하나씩 전장 AI가 대신 움직인다.
 * 대사 선택·일기토/설전 수락처럼 창이 뜨는 일은 멈춰서 직접 고르게 한다. 다시 누르면 꺼진다.
 */
let autoBattle=false;
function setAuto(on:boolean){autoBattle=on;const b=document.getElementById('auto-battle');if(b){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on);}if(on)pump();}
/** 규칙판 14: 도중에 합류한 편입 아군(ally 차례)은 AI가 지휘한다 — 플레이어는 본대(player 차례)만 움직인다. */
const autoAllyPhase=()=>session.revision>=14&&session.state.currentSide==='ally';
const autoSide=()=>autoBattle||autoAllyPhase();
function autoStep(){
  if(!autoSide()||menuOpen||field.busy||$<HTMLDialogElement>('#modal').open)return;
  const st=session.state;if(st.outcome!=='ongoing'||st.activeDialogue||session.activeDuel||!CONTROLLABLE.has(st.currentSide))return;
  const u=st.living(st.currentSide).find(x=>!x.hasActed);
  if(!u){act({kind:'endPhase'});return;}
  selected=u.id;
  for(const cmd of decide(st,u)){if(cmd.kind==='move'&&cellKey(cmd.to)===cellKey(u.pos))continue;const r=session.act(cmd);if(!r.ok)break;if(st.outcome!=='ongoing'||st.activeDialogue||session.activeDuel)break;}
  if(!u.hasActed&&u.alive&&st.outcome==='ongoing'&&!st.activeDialogue&&!session.activeDuel)session.act({kind:'wait',unit:u.id});
  persist();render();pump();
}
function pump(){clearTimeout(aiTimer);if(menuOpen||field.busy||$<HTMLDialogElement>('#modal').open||session.state.outcome!=='ongoing'||session.activeDuel)return;if(autoSide()&&CONTROLLABLE.has(session.state.currentSide)&&!session.state.activeDialogue){aiTimer=setTimeout(autoStep,(autoAllyPhase()&&!autoBattle?380:520)/speed);return;}aiTimer=setTimeout(()=>{const side=session.state.currentSide,logged=session.state.log.length;if(session.tick()){quietTick=session.state.log.length===logged&&side===session.state.currentSide;if(side!==session.state.currentSide){const next=session.state.living(session.state.currentSide).find(u=>!u.hasActed);if(next){selected=next.id;mode='move';field.focusUnit(next.pos);}}persist();render();pump();}},quietTick?30:450/speed);}
/** 무르기·목표 전환 되돌리기: 다시 짜다 기록이 어긋나 실패하면 마지막 자동 저장으로 돌아간다(반쯤 다시 짠 전투를 남기지 않게). */
function rewind(f:()=>boolean,done?:string){if(field.busy)return;
  try{if(f()){activate();persist();if(done)toast(done);}}
  catch{try{session=Session.load(JSON.parse(localStorage.getItem(SAVE_KEY)??'null'));activate();}catch{/* 저장도 못 읽으면 그대로 */}toast('되돌리지 못해 마지막 자동 저장으로 돌아갔습니다.');}}
function undo(){rewind(()=>session.undo(),'직전 명령을 되돌렸습니다.');}
/** 도전을 거절당했을 때: 상대의 대답과 그 효과. */
function showRefusal(){
  const r=session.lastRefusal;if(!r)return;session.lastRefusal=null;clearTimeout(aiTimer);
  const who=session.state.find(r.target),me=session.state.find(r.challenger);if(!who||!me)return;
  modal(`<div class="dialogue refusal"><div class="eyebrow">${r.kind==='duel'?'일기토':'설전'} · 도전 거절</div>${dialogueCaption(who.name.replace(/의?\s*환영$/,''),r.line)}
  <p class="refusal-effect">${unitName(me)}의 기세가 오른다(2턴 사기 상승) · ${unitName(who)}의 사기가 꺾였다(사기 −10).</p>
  <div class="modal-actions"><button class="primary" id="refusal-ok">전장으로</button></div></div>`,false);
  $('#refusal-ok').onclick=()=>{$<HTMLDialogElement>('#modal').close();persist();render();pump();};
}
/**
 * 전투 중 조우: 이름 있는 우리 장수가 이름난 적장과 3칸 안에서 처음 마주치면(내 차례) 일기토·설전을 제안한다.
 * 일기토는 붙어 있어야(1칸), 설전은 3칸 안. 한 쌍에 한 번만 묻는다.
 */
let met=new Set<string>(),metFor:object|undefined;
function encounterCheck(){
  const el=$('#encounter');if(metFor!==session){metFor=session;met=new Set();el.hidden=true;}
  if(!el.hidden||menuOpen||field.busy||$<HTMLDialogElement>('#modal').open||session.activeDuel||session.revision<4)return;
  const s=session.state;if(s.outcome!=='ongoing'||!CONTROLLABLE.has(s.currentSide))return;
  const fighter=(u:Unit)=>!['civilian','ram','catapult'].includes(familyOf(u.unitClass))&&!/^(gate|tower)_/.test(u.id);
  for(const u of s.living(s.currentSide)){if(u.hasActed||!CONTROLLABLE.has(u.side)||!fighter(u)||!(romanceOf(u)||u.id==='sima_yi'))continue;
    for(const e of s.living('enemy')){if(!fighter(e)||!romanceOf(e))continue;const d=session.revision>=14?Math.max(Math.abs(u.pos.x-e.pos.x),Math.abs(u.pos.y-e.pos.y)):manhattan(u.pos,e.pos),k=u.id+':'+e.id;if(d>3||met.has(k))continue;
      met.add(k);showEncounter(u,e,d);return;}}
}
function showEncounter(u:Unit,e:Unit,d:number){
  const el=$('#encounter'),s=session.state;
  el.innerHTML=`<div class="enc-faces"><span>${faceFor(u)}</span><b>VS</b><span>${faceFor(e)}</span></div><p><b>${unitName(e)}</b>${과와(unitName(e)).slice(-1)} 마주쳤다!<small>${unitName(u)} · 대결 무력 ${martialPower(u)} 설전 지력 ${debatePower(u)} ↔ ${unitName(e)} · 대결 무력 ${martialPower(e)} 설전 지력 ${debatePower(e)}</small></p>
    <div class="enc-acts"><button data-enc="duel" ${d>1?'disabled title="붙어 서야 일기토를 청할 수 있다"':''}>⚔ 일기토${d>1?' (붙어서)':''}</button><button data-enc="debate">✒ 설전</button><button data-enc="pass">지나간다</button></div>`;
  el.hidden=false;sound.event({kind:'duel',critical:false});
  el.querySelectorAll<HTMLButtonElement>('[data-enc]').forEach(b=>b.onclick=()=>{el.hidden=true;const k=b.dataset.enc!;if(k==='pass'){render();return;}
    selected=u.id;act({kind:'item',unit:u.id,item:k,target:e.id});});
  void s;
}
let duelSplashSeen:object|undefined;
function showDuel(){
  const d=session.activeDuel??session.lastDuel;if(!d)return;clearTimeout(aiTimer);
  // 무르기·이어하기로 되살린 지난 대결의 상대가 이미 전장에서 사라졌으면(탈출·미끼 제거) 다시 보이지 않는다.
  const a=session.state.find(d.player.id),b=session.state.find(d.enemy.id);
  if(!a||!b){if(!session.activeDuel){session.lastDuel=null;duelPresented=true;}render();pump();return;}
  // 겨루기는 초상 카드가 아니라 실제 병종 전신 모델을 1:1로 맞세운다.
  const nameOf=(u:Unit)=>romanceOf(u)?.name??(u.id==='sima_yi'?'사마의':u.name.replace(/의?\s*환영$/,''));
  const models={player:duelModel(portraitFor(a,false,d.kind),'player',nameOf(a)),enemy:duelModel(portraitFor(b,false,d.kind),'enemy',nameOf(b))};
  if(d.round===0&&!d.history.length&&duelSplashSeen!==d){
    modal(duelSplash(d,session.lastAccept?.line,!!session.lastAccept?.historic),false);
    document.querySelectorAll<HTMLElement>('[data-vs-model]').forEach(el=>el.innerHTML=el.dataset.vsModel==='enemy'?models.enemy:models.player);
    sound.event({kind:'duel',critical:true,debate:d.kind==='debate'});
    const go=()=>{if(duelSplashSeen===d)return;duelSplashSeen=d;showDuel();};
    $('.vs-go').addEventListener('click',go);setTimeout(go,2600);return;
  }
  const indoor=session.state.map.tileAt(a.pos).terrain==='fort'||/궁|부$|청|막/.test(session.state.stage.subtitle??'');
  modal(duelArena(d,{models,backdrop:duelBackdrop(d.kind,session.state.stage.id+d.enemy.id,indoor),...(session.lastAccept?.line?{openingLine:session.lastAccept.line}:{})}),false);
  animateDuel();
  // 이긴 겨룸: 명성·호감이 쌓이고, 격파 길 장수면 살려 보낼지 등용을 권할지 고른다.
  {const rs=battleStory(),host=document.querySelector('#modal .duel-result');if(d.result==='win'&&rs&&host)void contestRecruit(rs,nameOf(b),host,`${session.state.stage.id}:${session.state.turn}:${d.enemy.id}:${d.history.length}`);}
  document.querySelectorAll<HTMLButtonElement>('[data-duel-action]').forEach(el=>el.onclick=()=>{sound.event({kind:'duel',critical:el.dataset.duelAction==='special',debate:d.kind==='debate'});act({kind:'item',unit:d.player.id,item:'duel-round:'+el.dataset.duelAction});});
  $('#duel-return')?.addEventListener('click',()=>{duelPresented=true;$<HTMLDialogElement>('#modal').close();render();pump();});
}
/** 결과를 받은 전투: '이어하기' 기록을 끝남으로 바꾼다(결과를 받기 전에 꺼졌으면 이어하기가 결과부터 잇는다). */
/**
 * scored: 이 전투의 결과를 받았다(이어하기 기록을 닫는다).
 * scorePending: 결과 처리를 잠시 뒤(승리 연출 뒤)로 미뤄 둔 동안. 그 사이에 창을 닫으면 다시 열 때 결과를 이어서 받도록 기록을 열어 둔다.
 */
let scored=false,scorePending=false;
function markScored(){if(scored)return;scored=true;try{const l=lastBattle();if(l)localStorage.setItem(LAST_KEY,JSON.stringify({...l,ongoing:false}));}catch{/* optional */}}
function checkModal(){
  if(menuOpen||field.busy)return;const s=session.state;
  // 새 대결이 열리면 그 결과도 보여 줘야 한다(앞 대결에서 '돌아가기'를 눌러 둔 표시가 남아 결과창이 멈추던 문제).
  if(session.activeDuel){duelPresented=false;showDuel();return;}
  if(session.lastDuel&&!duelPresented){showDuel();return;}
  if(s.outcome!=='ongoing'&&session.deployment?.mission){showExpeditionResult();return;}
  if(s.outcome!=='ongoing'&&session.deployment?.branch){finishBranchBattle();return;}
  if(s.outcome!=='ongoing'&&session.deployment?.run&&session.deployment.scenario){
    // 시나리오 모드의 가상 전장: 장수 성장·다음 장으로.
    if(resultShown)return;resultShown=true;sound.sfx(s.outcome==='victory'?'victory':'defeat');
    const dep=session.deployment,xp={...session.xpEarned};noteDefeatReason(s.outcome==='victory'?'':session.failure||defeatCause(s));scorePending=true;setTimeout(()=>{scorePending=false;markScored();menuOpen=true;void finishIfBattle(scenarioHost,s,dep,xp);},900);return;
  }
  if(s.outcome!=='ongoing'&&session.deployment?.run){
    // 원정 전투: 연의 보상 대신 원정 기록에 결과를 넘긴다.
    if(resultShown)return;resultShown=true;sound.sfx(s.outcome==='victory'?'victory':'defeat');
    const dep=session.deployment;{const xp={...session.xpEarned};scorePending=true;setTimeout(()=>{scorePending=false;markScored();finishRunBattle(runHost,s,dep,xp);},900);};return;
  }
  if(s.outcome!=='ongoing'&&session.deployment?.runStory){
    // 원정의 연의 전장: 이기면 천명 기록에 남고, 지면 원정이 끝난다(천명의 가호가 있으면 한 번 견딘다).
    if(resultShown)return;resultShown=true;sound.sfx(s.outcome==='victory'?(session.somber?'somber':'victory'):'defeat');
    const dep=session.deployment;{const xp={...session.xpEarned};scorePending=true;setTimeout(()=>{scorePending=false;markScored();finishRunStory(runHost,s,dep,xp);},900);};return;
  }
  if(s.outcome!=='ongoing'&&(isZhugeStage(s.stage.id)||isZhugeBranch(s.stage.id))){if(resultShown)return;resultShown=true;finishZhuge();return;}
  if(s.outcome!=='ongoing'){
    if(resultShown)return;resultShown=true;const win=s.outcome==='victory',seals=session.seals;
    // 결과 화면의 '무르기'로 되돌렸다 다시 이긴 전투는 싸워 번 경험치·등용 성장·천명·출진 횟수를 한 번만 친다.
    // 보상을 받았다는 표시는 저장에 남는다(무르기 뒤 새로고침해도 두 번 받지 않는다).
    const again=session.rewarded;session.rewarded=true;persist();
    if(!again&&!session.deployment?.scenario&&chapters.some(c=>c.stage.id===s.stage.id))countSortie(s.stage.id,win);
    if(win&&!session.deployment?.scenario&&chapters.some(c=>c.stage.id===s.stage.id))recordStageChoices(s.stage.id,s.choices);
    const before=structuredClone(campaign);
    const firstWin=!campaign.rewards.includes(s.stage.id+':'+s.difficulty);
    const reward=win?award(campaign,s.stage.id,s.difficulty,[...s.units.keys()],seals):null;
    // 금(처음 이긴 장은 크게 · 다시 이기면 1/3)과 장비 단련 · 쓴 도구: 무르기 뒤 다시 이겨도 한 번만.
    const goldGain=win&&!again?winGold('S',s.stage.id,firstWin):0;
    const gearSettled=!again?gearNews(settleGear(campaign,s,session.deployment,session.xpEarned)):[];
    if(goldGain||gearSettled.length)saveCampaign();
    const extraNews=[...(goldGain?[`금 +${goldGain.toLocaleString()} (사마의전)`]:[]),...gearSettled];
    // 싸워서 번 경험치(때리기·물리치기): 이긴 전투면 처음이든 다시 하는 전투든 장수에게 남는다.
    const fought=win&&!again?OFFICERS.reduce((n,id)=>{const g=session.xpEarned[id]??0;if(g>0)campaign.xp[id]=(campaign.xp[id]??0)+g;return n+Math.max(0,g);},0):0;
    const retinueUps=win&&!again&&session.deployment?.retinue?.length&&!session.deployment.scenario?growRetinue(session.deployment.retinue,session.xpEarned,50):[];
    if(reward?.xp||fought||retinueUps.length||session.deployment?.retinue?.length)saveCampaign();
    if(retinueUps.length)setTimeout(()=>toast('등용 장수 성장 · '+retinueUps.join(' · ')),1200);
    if(win)try{const p=progress(),k=s.stage.id+':'+s.difficulty;p[k]=[...new Set([...(p[k]??[]),...seals])];localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));}catch{/* optional persistence */}
    // 처음 얻은 연의 천명마다 쓸 천명 1(어느 길에서 이겼든 · 무르기 뒤 다시 이겨도 한 번만).
    let sealGain=0;
    if(win&&chapters.some(c=>c.stage.id===s.stage.id)){const m=loadMeta();sealGain=paySeals(m,progress(),[s.stage.id]);if(sealGain)saveMeta(m);}
    // 이긴 연의 전장은 어느 길에서 이겼든 기록한다(다음 장 해금 · 연구의 '이긴 연의 전장' 조건).
    let mandateGain=0;
    if(win&&chapters.some(c=>c.stage.id===s.stage.id)){const m=loadMeta();if(!m.chronicle.includes(s.stage.id))recordStory(m,s.stage.id);
      // 연의 회상·수련 전투(천명의 길 밖)도 천명을 조금 준다: 연구가 로그라이크의 성장이다.
      if(!again&&!session.deployment?.scenario&&!session.deployment?.mission){mandateGain=s.difficulty==='extreme'?2:1;m.mandate+=mandateGain;m.earned+=mandateGain;}saveMeta(m);}
    // 이야기를 하면서 들이는 장수: 이 장을 이겨 조건을 다 채운 장수는 등용 화면에 가지 않아도 합류한다.
    // 등용 정산: 공훈(첫 승리·천명·쓰러뜨린 적장) · 명성 · 격파 호감 · 연의 합류·조건 승리·구출·인연 장수 합류.
    if(win&&!again&&!session.deployment?.mission&&chapters.some(c=>c.stage.id===s.stage.id)){
      const rep=battleReport('S',s);
      const rc=settleRecruits('S',battleMerit({firstWin,extreme:rep.extreme,newSeals:sealGain,foes:rep.fallen.length}),rep);extraNews.push(...rc.news);
      if(rc.joined.length)setTimeout(()=>toast(`등용 · ${rc.joined.join(' · ')} 합류 — 사마의 휘하에 들었다`),1900);}
    sound.sfx(win?(session.somber?'somber':'victory'):'defeat');
    if(session.deployment?.scenario){
      // 시나리오 모드의 연의 장: 보상은 같고, 전투 뒤 장면과 다음 장은 시나리오 흐름이 맡는다.
      const news=[...extraNews,...(mandateGain+sealGain?[mandateText(mandateGain,sealGain)]:[]),...(reward?.xp?[`경험치 +${reward.xp}`]:[]),...(fought?[`전투 경험치 +${fought} (때리고 물리쳐 번 경험치)`]:[]),...(reward?.treasure?[`보물 ${을를(`「${reward.treasure.name}」`)} 얻었다`]:[]),...growthMilestones(before,campaign).filter(x=>x.to>x.from||x.evolution).map(x=>`${officerNames[x.id]} Lv.${x.from} → ${x.to}${x.evolution?` · 병종 진화 ${x.evolution.from} → ${x.evolution.to}`:''}`)];
      const chapterId=session.deployment.scenario.chapter,hero=s.find('sima_yi'),heroHp=hero?.alive?Math.max(.05,hero.hp/hero.stats.maxHp):undefined;const rc=session.deployment.scenario.recruits,xp={...session.xpEarned};scorePending=true;setTimeout(()=>{scorePending=false;markScored();menuOpen=true;void finishStoryBattle(scenarioHost,chapterId,win,news,heroHp,s,rc,xp,(reward?.got??[]).map(t=>t.id));},900);return;
    }
    const after=win?storyAftermath[s.stage.id]:undefined;
    modal(`<div class="result">${after?`<div class="aftermath"><div class="aftermath-stage" style="${storyBackdrop(after.art)}"><span class="story-location">${after.name}</span></div><div id="aftermath-line">${dialogueCaption(after.beats[0]!.speaker,after.beats[0]!.line)}</div>${after.beats.length>1?'<button id="aftermath-next">다음 장면 →</button>':''}</div>`:''}<div class="result-character">${win?'승':'패'}</div><h2>${win?'판을 읽었다.':'아직, 끝이 아니다.'}</h2><p>${s.stage.subtitle} · ${s.turn}턴</p>${resultSeals(session.sealNames,seals,win)}<div class="result-rewards"><div class="section-label">보상</div>${reward?.xp||fought?`<p class="growth-summary">${reward?.xp?`경험치 +${reward.xp} · `:''}${fought?`전투 경험치 +${fought} · `:''}${growthText()}</p>${treasures.some(t=>t.stage===s.stage.id)?`<p class="treasure-reward">보물: ${treasures.filter(t=>t.stage===s.stage.id).map(t=>earlyLegend(t,'S')&&s.difficulty!=='extreme'?`${t.name}(전설 · 극한으로 이겨야 얻는다)`:t.name).join(' · ')}</p>`:''}`:''}${milestoneMarkup(growthMilestones(before,campaign))}${extraNews.map(x=>`<p class="growth-summary">${esc(x)}</p>`).join('')}${mandateGain+sealGain?`<p class="growth-summary">${mandateText(mandateGain,sealGain)}</p>`:''}</div><p>${win?'전투 기록과 천명이 저장되었습니다.':esc(session.failure)}</p><div class="modal-actions"><button id="result-undo">↶ 마지막 수 무르기</button>${session.phaseCheckpoint!==null?'<button id="phase-restore">목표 전환 직전으로</button>':''}<button id="retry">다시 도전</button><button id="result-menu">연의 회상</button>${win&&session.chapter===campaignOrder.at(-1)?'<button id="epilogue" class="primary">에필로그 →</button>':''}${win&&campaignOrder.indexOf(session.chapter)<campaignOrder.length-1&&unlocked(campaignOrder[campaignOrder.indexOf(session.chapter)+1]!)?'<button id="next-chapter" class="primary">다음 전장 →</button>':''}</div></div>`,false);
    // 보물 획득 장면: 결과 화면 다음에 새로 얻은 고유 보물을 한 점씩.
    revealAfterResult((reward?.got??[]).map(t=>t.id),'S',document.querySelector('#modal .result'));
    if(after){let k=0;$('#aftermath-next')?.addEventListener('click',e=>{k=(k+1)%after.beats.length;const b=after.beats[k]!;$('#aftermath-line').innerHTML=dialogueCaption(b.speaker,b.line);(e.currentTarget as HTMLButtonElement).textContent=k===after.beats.length-1?'↺ 처음 장면':'다음 장면 →';});}
    $('#result-undo').onclick=undo;$('#result-menu').onclick=showChronicle;
    $('#phase-restore')?.addEventListener('click',()=>rewind(()=>session.restorePhase()));
    $('#retry').onclick=()=>{session=new Session(session.chapter,session.difficulty,215,session.preparation,session.revision,session.deployment?{...deployment(campaign,true),...(session.wide?{wide:(session.deployment?.wide??1)}:{}),...(session.deployment.retinue?{retinue:structuredClone(session.deployment.retinue)}:{}),...(session.deployment.extraOfficers?{extraOfficers:[...session.deployment.extraOfficers]}:{})}:undefined);activate();persist();};
    $('#epilogue')?.addEventListener('click',()=>playYeonEnding());
    $('#next-chapter')?.addEventListener('click',()=>storyScene(campaignOrder[campaignOrder.indexOf(session.chapter)+1]!));return;
  }
  if(s.activeDialogue){const node=session.battle.dialogue.node(s.activeDialogue);{const who=node.speaker?s.find(node.speaker)?.name??node.speaker:'사마의',extra=`${session.chapter===0?fundsNote(s.activeDialogue):''}${session.chapter===10?'<p class="ink-extra">틀리면 신뢰가 깎이고 같은 물음을 다시 받습니다</p>':'<button id="dialogue-undo" class="ink-undo">직전 선택 무르기</button>'}`;
    modal(`<div class="dialogue ink-mode"><div class="eyebrow">${session.chapter===10?'설전 · 건업 궁정':'전장의 갈림길'}</div>${inkChoice(who,node.text,node.options.map(o=>{const v=session.deployment?.scenario||session.deployment?.run||session.deployment?.runStory||session.deployment?.mission?0:choiceAmbition(s.stage.id,node.id,o.id);const cost=s.stage.id==='S1-02'?((node.id==='bribe'&&o.id==='pay')||(node.id==='lie_failed'&&o.id==='pay_late')?(session.bribes===0?1000:1500):node.id==='gate_payment'?1000:0):0,
      // 노잣돈·통행료: 얼마를 내고 얼마가 남는지 미리 보인다(남문 통행료 1,000전을 남겨야 성을 나갈 수 있다).
      money=cost?` · ${cost.toLocaleString()}전 (남은 지참금 ${session.funds.toLocaleString()}전${session.funds<cost?' · 부족':node.id!=='gate_payment'&&session.funds-cost<1000?' · 남문 통행료 1,000전이 모자라게 된다':''})`:'';
      return {text:(v?`${o.text} · ${v>0?'야망':'충의'} ${v>0?'+':'−'}${Math.abs(v)}`:o.text)+money,id:o.id};}),{attr:'data-choice',extra,...(session.chapter===10?{gauge:{label:'신뢰',value:session.trust/Math.max(1,session.trustLimit)}}:{})})}</div>`,false);}$('#dialogue-undo')?.addEventListener('click',undo);document.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(b=>b.onclick=()=>{$<HTMLDialogElement>('#modal').close();act({kind:'choose',nodeId:node.id,optionId:b.dataset.choice!});const last=[...session.state.log].reverse().find(e=>e.t==='choice');if(last&&last.t==='choice'&&last.correct===false)toast(session.chapter===10?`설득이 먹히지 않았습니다. 신뢰 ${session.trust}/${session.trustLimit}`:'선택의 대가를 치렀습니다.');});}
}
field.onSound=e=>sound.event(e);field.xpFor=e=>session.xpGains.get(e);field.weaponFor=u=>{const key=gearKey(u),id=session.deployment?.loadouts?.[key]?.weapon??session.deployment?.equipped[key];return id&&treasureInfo(id).slot==='weapon'?id:undefined;};field.onAnimationEnd=()=>{render();pump();setTimeout(()=>{hudLock=false;hudHover(hudAt);},900);};
field.onCell=at=>{
  if(field.busy||menuOpen)return;const s=session.state,u=s.find(selected),target=s.unitAt(at);
  if(u?.alive&&u.side===s.currentSide&&CONTROLLABLE.has(u.side)&&!u.hasActed){
    if(mode==='heal'&&target){act({kind:'item',unit:u.id,item:'heal',target:target.id});return;}
    if(mode==='calm'&&target){act({kind:'item',unit:u.id,item:'calm',target:target.id});return;}
    if(mode.startsWith('use:')&&target&&target.side!=='enemy'){act({kind:'item',unit:u.id,item:mode.slice(4),target:target.id});return;}
    if(mode==='repair'&&target&&target.side!=='enemy'){act({kind:'item',unit:u.id,item:'repair',target:target.id});return;}
    if(mode==='fortify'&&!target){act({kind:'item',unit:u.id,item:'fortify',target:at.x+','+at.y});return;}
    if(target?.side==='enemy'&&(mode==='duel'||mode==='debate')){act({kind:'item',unit:u.id,item:mode,target:target.id});return;}
    if(target?.side==='enemy'&&mode==='attack'){act({kind:'attack',unit:u.id,target:target.id});return;}
    if(s.strategies.has(mode)){act({kind:'strategy',unit:u.id,strategy:mode,at});return;}
    if(!target&&mode==='move'){act({kind:'move',unit:u.id,to:at});return;}
  }if(target)select(target.id);
};
field.onHover=at=>{hudHover(at);if(!at){$('#tile-info').textContent='끌어서 전장을 살피고, 미니맵을 눌러 옮긴다 · ⌖ 고른 장수에게로';return;}const s=session.state,u=s.find(selected),target=s.unitAt(at);const tile=s.map.tileAt(at),hz=tile.hazard;let line=`${terrainNames[tile.terrain]}${tile.locked?' · 닫힘(지날 수 없음)':''}${hz==='fire'?' · 불길(화상)':hz!=='none'&&tile.hazardWhen?` · ${hz==='trap'?'독 샘':'위험 지대'}(${s.activeHazard(at)!=='none'?'지금 독 · 최대 체력 25% 피해':'지금은 잠잠함'})`:hz==='trap'&&session.scouted?' · 함정(최대 체력 25% 피해)':''} · (${at.x+1}, ${at.y+1}) · 회피 +${s.map.evasionBonus(at)}%`;if(target)line+=` · ${unitName(target)} ${target.hp} HP`;if(u&&target?.side==='enemy'&&(mode==='duel'||mode==='debate')&&session.revision>=4){const a=session.challengeAnswer(u,target,mode);line+=a.reason==='nameless'?' · 이름 없는 병사는 응하지 않는다':a.accept?` · ${a.reason==='historic'?'연의의 대결 — 반드시 응한다':'응할 것 같다'}`:` · 거절할 것 같다(${a.reason==='wounded'?'부상':'성격'})`;}if(u&&target?.side==='enemy'){const d=s.strategies.get(mode);if(d&&manhattan(u.pos,at)<=d.range)line+=` · 예상 피해 ≈${estimateStrategy(u,target,d,s.map)}`;else if(mode==='attack'&&manhattan(u.pos,at)<=u.range[1]&&manhattan(u.pos,at)>=u.range[0]){const v=previewAttack(u,target,s.map,session.battle.wouldCounter(target,u));line+=` · 명중 ${v.hit}% · 피해 ${v.damage}${v.lethal?' (격파)':''}${v.counter?` · 반격 ${v.counter.damage} (명중 ${v.counter.hit}%)`:' · 반격 없음'}`;}}if(u&&mode==='move'){const cost=s.map.moveCost(u.unitClass,at,ignoresRough(u));line+=' · 이동 비용 '+(Number.isFinite(cost)?cost:'진입 불가')+' · 지형 위력 ×'+s.map.terrainAffinity(u.unitClass,at).toFixed(2);}if(u&&target?.side==='enemy'&&mode==='attack'&&!structureKind(target.id))line+=' · '+physicalMatchup(u.unitClass,target.unitClass);$('#tile-info').textContent=line;};
function updateSound(){$('#sound-toggle').innerHTML=`♪ <span>${sound.enabled?'소리 켜짐':'음소거'}</span>`;}
$('#sound-toggle').onclick=()=>{sound.enabled=!sound.enabled;storeSettings();void sound.start().then(updateSound);};
$('#menu').onclick=showMenu;$('#brand').onclick=showMenu;$('#undo').onclick=undo;
$('#end-phase').onclick=()=>act({kind:'endPhase'});
$('#coach-close').onclick=finishCoach;
$('#map-objective').addEventListener('click',e=>{if((e.target as HTMLElement).closest('.mo-toggle'))setObjectiveOpen(!objectiveBox.open);});
$('#zoom-in').onclick=()=>field.zoomBy(.2);$('#zoom-out').onclick=()=>field.zoomBy(-.2);$('#zoom-reset').onclick=()=>field.reset();
// 가로 모드 전용: 세로로 들면 회전 안내를 덮는다. 전체 화면을 지원하는 기기는 버튼 한 번으로 가로 고정.
{const gate=document.createElement('div');gate.id='rotate-gate';gate.setAttribute('role','dialog');gate.setAttribute('aria-label','가로 화면 안내');
  gate.innerHTML='<div class="rg-phone" aria-hidden="true"></div><b>가로로 돌려 주세요</b><p>'+GAME_NAME+'은 가로 화면으로 진행합니다.<br>휴대폰을 옆으로 눕히면 바로 이어집니다.</p>'+(document.fullscreenEnabled?'<button type="button" class="primary" id="rg-full">전체 화면 · 가로로 시작</button>':'');
  document.body.appendChild(gate);
  gate.querySelector<HTMLButtonElement>('#rg-full')?.addEventListener('click',async()=>{try{await document.documentElement.requestFullscreen({navigationUI:'hide'});await (screen.orientation as ScreenOrientation&{lock?:(o:string)=>Promise<void>}).lock?.('landscape');}catch{/* 지원하지 않는 기기는 직접 돌린다 */}});}
$('#left-toggle').onclick=()=>{const open=document.body.classList.toggle('left-open');$('#left-toggle').setAttribute('aria-expanded',String(open));};
$('#left-close').onclick=()=>{document.body.classList.remove('left-open');$('#left-toggle').setAttribute('aria-expanded','false');};
// 휴대폰: 장수 상세는 '장수 정보' 머리를 눌러 여닫는 덧창(지도·명령이 한 화면에 들어오게)
/* 위 막대 높이를 재어 전장·패널이 화면 높이를 꼭 채우게(스크롤 없이) */
{const bar=document.querySelector<HTMLElement>('.topbar');const fit=()=>{if(bar)document.documentElement.style.setProperty('--topbar-h',bar.offsetHeight+'px');};fit();addEventListener('resize',fit);if(bar)new ResizeObserver(fit).observe(bar);}
{const head=document.querySelector<HTMLElement>('.right-panel>.section-label');if(head){head.setAttribute('role','button');head.tabIndex=0;const flip=()=>document.body.classList.toggle('unit-open');head.onclick=flip;head.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}};$('#unit-detail').addEventListener('click',()=>{if(matchMedia('(max-width:700px),(orientation:landscape) and (max-height:520px)').matches)document.body.classList.remove('unit-open');});}}
$('#threat').onclick=()=>{threat=!threat;$('#threat').setAttribute('aria-pressed',String(threat));render();};
function applySpeed(){const skip=speed===4;field.playbackRate=skip?3:speed;field.skipAnimations=skip;$('#speed').innerHTML=skip?'⏭ 연출 생략':`▷ ${speed}× 속도`;$('#speed').title=skip?'전투 동작을 건너뛰고 결과만 봅니다':'전투 연출 속도';}
$('#auto-battle').onclick=()=>{setAuto(!autoBattle);toast(autoBattle?'자동 전투 — 아군을 대신 지휘합니다. 다시 누르면 멈춥니다.':'자동 전투를 멈췄습니다.');};
$('#speed').onclick=()=>{speed=speed===1?2:speed===2?3:speed===3?4:1;applySpeed();storeSettings();};
function storeSettings(){saveSettings({music:sound.musicVolume,effects:sound.effectsVolume,sound:sound.enabled,speed:speed as Speed});}
{const saved=loadSettings();sound.musicVolume=saved.music;sound.effectsVolume=saved.effects;sound.enabled=saved.sound;speed=saved.speed;applySpeed();updateSound();}
/** 도움말(2026-10-17 새로 씀): 지금 게임의 흐름·전투 규칙·대결·성장·조작을 짧은 묶음으로. */
const HELP_SECTIONS:Array<[string,string[]]>=[
  ['게임의 흐름',['사마의전(연의)과 제갈량전 두 이야기를 장마다 이야기 → 출진 전 정비 → 전투 → 결과 순으로 진행합니다.','이야기 속 선택은 능력치를 주지 않고, 뒤 장면의 대사와 결말을 바꿉니다.','본영에서 연의 회상(다시 하기)·등용·연구·상점·도감을 엽니다.']],
  ['출진 전 정비',['「출진 부대 덱」: 위 줄이 편성된 부대, 아래 카드에서 넣고 뺍니다. 병종마다 COST가 있고 장마다 COST 상한이 있습니다.','등용 장수 가운데 다른 나라 출신(사마의전은 위가 아닌 장수)은 COST가 2 더 듭니다.','「상점」 탭에서 장비·소모품을 사고, 「장비」에서 장수마다 무기·방어구·보조구를 답니다.','승급 포인트: 천명 조건 하나마다 1, 극한 승리마다 1 더. 다음 승급 레벨까지 4레벨 안이면 모자란 레벨만큼 써서 곧장 승급합니다.']],
  ['전투 규칙',['부대 선택 → 이동 → 공격·책략·도구·대기. 아군(본대) 차례가 끝나면 편입 아군·적·우군이 차례로 움직입니다. 도중에 합류한 편입 아군은 AI가 지휘합니다.','지력형 병종(책사·풍수사·도사·주술사)은 물리 공격이 약한 대신 책략 피해가 큽니다. 지형마다 책략·공격 위력이 달라집니다(칸을 가리키면 지형 위력이 보입니다).','산지는 기병이 거의 오르지 못합니다(산악기병은 예외). 벼랑·성벽은 지날 수 없습니다.','성문을 막고 탈출하는 전장은 그 성문을 부수면 바로 이깁니다.','지도 위 「◇ 목표」에 승리·패배 조건, 이 장의 천명 조건 셋, 지금 겨룰 수 있는 대결이 늘 보입니다. 주황 점선은 순찰대의 길과 시야입니다.']],
  ['일기토 · 설전',['무력형 장수는 일기토, 지력형 장수는 설전만 겨룹니다(연의의 맞수 대결은 예외). 둘 다 대각선을 포함한 8방향으로 잽니다 — 일기토는 붙어서, 설전은 3칸 안.','다섯 합을 고릅니다. 방어 > 공격 > 필살 > 기합 > 간파 > 방어 — 상성으로 이긴 합은 피해 ×1.5, 진 합은 ×0.35.','이기면 2턴 버프(일기토: 사기·고양 / 설전: 고양·경신), 지면 2턴 디버프(쇠약·둔화 / 혼란·책략 봉인). 이름표 옆 작은 원 표식이 걸린 상태입니다(초록 이로움 · 빨강 해로움).']],
  ['조작',['1 이동 · 2 공격 · 3 첫 책략 · W 대기 · Z 무르기 · E 턴 종료 · N 다음 부대 · O 목표 펼치기 · Esc 명령 취소.','큰 전장은 +/− 버튼과 드래그·미니맵으로 살핍니다. 터치는 길게 눌러 칸 정보를 봅니다.']],
];
const HELP_HTML=`<div class="dialogue help-guide"><h2>전장의 길잡이</h2>${HELP_SECTIONS.map(([t,ls],i)=>`<details ${i<2?'open':''}><summary>${t}</summary><ul>${ls.map(l=>`<li>${l}</li>`).join('')}</ul></details>`).join('')}</div>`;
$('#help').onclick=()=>modal(HELP_HTML);
$('#topbar-save').onclick=()=>{menuOpen=true;clearTimeout(aiTimer);showSlots();};
$('#settings').onclick=()=>{modal(`<div class="dialogue"><h2>소리 설정</h2><label>배경음 <input id="music-volume" type="range" min="0" max="1" step=".01" value="${sound.musicVolume}"></label><label>효과음 <input id="effects-volume" type="range" min="0" max="1" step=".01" value="${sound.effectsVolume}"></label></div>`);$<HTMLInputElement>('#music-volume').oninput=e=>{sound.musicVolume=Number((e.target as HTMLInputElement).value);sound.update();storeSettings();};$<HTMLInputElement>('#effects-volume').oninput=e=>{sound.effectsVolume=Number((e.target as HTMLInputElement).value);sound.update();storeSettings();};};
$('#log-button').onclick=()=>modal(`<div class="dialogue"><h2>전투 기록</h2>${session.state.log.map(describe).filter(Boolean).slice(-60).map(t=>`<p>${esc(t)}</p>`).join('')}</div>`);
document.addEventListener('visibilitychange',()=>void sound.visibility(document.hidden));
// Every button answers with a soft wood-block click.
document.addEventListener('pointerdown',e=>{if((e.target as HTMLElement|null)?.closest?.('button'))sound.event({kind:'ui'});},true);
document.addEventListener('keydown',e=>{if($<HTMLDialogElement>('#modal').open||menuOpen||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;const key=e.key.toLowerCase();
  if(key==='z')undo();else if(e.key==='?')$('#help').click();
  else if(key==='e'){const end=$<HTMLButtonElement>('#end-phase');if(!end.disabled)end.click();}
  else if(key==='o')setObjectiveOpen(!objectiveBox.open);
  else if(e.key==='Escape'){if(mode!=='move'){mode='move';render();}}
  else if(key==='n'){
    // Cycle through units that can still act this phase.
    const ready=session.state.living(session.state.currentSide).filter(u=>!u.hasActed);
    if(ready.length&&CONTROLLABLE.has(session.state.currentSide)){e.preventDefault();const i=ready.findIndex(u=>u.id===selected);select(ready[(i+1)%ready.length]!.id);}
  }
  else{const id=({1:'move',2:'attack',3:session.state.find(selected)?.strategies[0],w:'wait'} as Record<string,string|undefined>)[e.key.toLowerCase()];if(id)document.querySelector<HTMLButtonElement>(`[data-command="${id}"]`)?.click();}});
// Story and gallery art reads the cut sheets through CSS; a blob URL avoids encoding megapixels into a string.
const atlasUrl=(canvas:HTMLCanvasElement)=>new Promise<string>(resolve=>canvas.toBlob(blob=>resolve(blob?URL.createObjectURL(blob):canvas.toDataURL())));
/**
 * 그림 준비: 시트를 모두 자르기까지 몇 초~수십 초(모바일)가 걸린다. 본영은 바로 띄우고,
 * 그림은 뒤에서 준비한다. 시트 하나가 실패해도 게임 전체가 멈추지 않게 하나씩 따로 받는다.
 * 준비가 끝나기 전에 누른 단추는 기다렸다가 이어서 실행한다(전투·이야기 장면은 그림이 있어야 한다).
 */
let fieldReady=false,fieldInit:Promise<void>|undefined;
// 이야기 장면에 필요한 그림(인물·배경)만 따로 기다린다. 본영·도감 단추는 그림 준비 중에도 바로 열린다.
let storyReady=false,storyArt:Promise<unknown>=new Promise(()=>{});
let artCount='';
function artProgress(done:number,total:number){
  let bar=document.getElementById('art-loading');
  if(!bar){bar=document.createElement('div');bar.id='art-loading';bar.setAttribute('role','status');document.body.appendChild(bar);}
  artCount=Math.round(done/total*100)+'%';
  bar.innerHTML=`<b>그림 준비 중</b><i><i style="width:${artCount}"></i></i><small>${done}/${total}</small>`;
  document.querySelectorAll('.art-wait-count').forEach(e=>e.textContent=artCount);
}
const waitPanel=(title:string,line:string)=>`<div class="briefing art-wait"><h2>${title}</h2><p>${line}</p><p class="art-wait-line">그림 받는 중 <b class="art-wait-count">${artCount}</b></p></div>`;
// 느린 회선·느린 PC: 그림 하나가 끝나지 않아도 게임 전체가 멈추지 않게 시간을 둔다.
const within=<T,>(p:Promise<T>,ms:number)=>Promise.race([p,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('timed out')),ms))]);
// 그림 받기 순서: 이야기 그림(인물·배경)을 먼저 받고, 전장·도감 그림은 그다음에 받는다.
// 회선이 느려도 첫 이야기가 빨리 열리게 하려는 것이다. 전투를 먼저 고르면 전장 그림을 바로 받기 시작한다.
let startRest:()=>void=()=>{};
async function boot(){
  // 병종 그림(CSS)은 화면에 나타날 때만 자른다(css-atlas.ts).
  watchCssAtlases();
  const soft=<T,>(p:Promise<T>,what:string)=>within(p,180000).catch(error=>{console.warn(what+' 그림을 읽지 못해 대신 그림을 씁니다.',error);});
  const cssAtlas=async(name:string,url:string,rows:number,columns=4,union=false,alphaCutoff=8,strictGrid=false)=>{const atlas=await spriteAtlas(url,rows,columns,union,alphaCutoff,strictGrid);document.documentElement.style.setProperty('--'+name+'-atlas','url('+await atlasUrl(atlas)+')');};
  const storyJobs=[soft(cssAtlas('officer-story','officer-story-v1.webp',2),'officer-story'),soft(loadFigures(),'인물'),soft(loadIsoArt(),'조형물'),soft(loadPaintedScenes(),'이야기 배경')];
  const total=storyJobs.length+5;let done=0;const tick=(j:Promise<unknown>)=>void j.then(()=>artProgress(++done,total));
  storyJobs.forEach(tick);artProgress(0,total);
  storyArt=Promise.all(storyJobs).then(()=>{storyReady=true;});
  let rest:Promise<unknown>|undefined;
  startRest=()=>{if(rest)return;
    field.onArtReady=()=>{if(fieldReady&&!menuOpen&&!field.busy)render();};
    fieldInit=field.init($('#map')).then(()=>{fieldReady=true;field.load(session.state);});
    const jobs:Promise<unknown>[]=[fieldInit.catch(()=>undefined),
      ...([['base','units-v3.webp',6],['extra','units-extra-v1.webp',4],['ram','ram-v1.webp',2,2]] as const).map(([name,url,rows,columns])=>soft(cssAtlas(name,url,rows,columns),name)),
      soft(navalAtlas().then(async c=>document.documentElement.style.setProperty('--naval-atlas','url('+await atlasUrl(c)+')')),'수군'),
      ];
    jobs.forEach(tick);rest=Promise.all(jobs);};
  void storyArt.then(()=>startRest());
  render();showTitle(runHost);
  await storyArt;startRest();await rest;
  if(!fieldReady){$('#map').innerHTML='<p class="render-error">전장 그래픽을 초기화하지 못했습니다. 새로고침해 주세요.</p>';await fieldInit?.catch(error=>console.error(error));}
  document.getElementById('art-loading')?.remove();
  // 그림이 늦게 들어온 본영을 다시 그린다(열린 화면이 본영일 때만).
  if(menuOpen&&document.getElementById('hub-training'))showMenu();
}
// ?dev only: a handle for QA scripts to inspect or nudge the running battle.
if(devMode)Object.assign(window,{__sama:{get session(){return session;},get field(){return field;},render,start(chapter:number){session=new Session(chapter,'normal',215,'survival',RULES,{...deployment(campaign,true),wide:2});activate();},story(chapter:number){storyScene(chapter);},trial(id?:string){expeditionStory(id??expeditions.find(m=>canExpedition(campaign,m.id))!.id);},contest(kind:'duel'|'debate',foe=kind==='duel'?'여포':'제갈량',me='사마의'){menuOpen=true;modal('<div class="story-scene"><p>개발용 대결</p></div>',false);const mk=(name:string,side:'player'|'enemy')=>{const r=romanceByName(name);return portraitFor({id:name==='사마의'?'sima_yi':'dev_'+side,name,unitClass:name==='사마의'?storyClassAt('sima_yi',levelInfo(campaign.xp.sima_yi??0).level):officerClass(name),side,level:10} as unknown as Unit,false,kind)+(r?'':'');};void playContest(kind,{name:me,stat:90},{name:foe,stat:88},{acceptLine:kind==='duel'?'덤벼라!':'그 말, 내가 받아 주겠소.',models:{player:mk(me,'player'),enemy:mk(foe,'enemy')}});},run(floor:number,kind:'battle'|'elite'|'boss'|'tale',seed=7,route?:Record<number,string>,tale?:string){const r=newRun(seed,startingOfficers());r.floor=floor;if(route)r.route=route as {1?:string;2?:string;3?:string};runHost.startBattle({levels:{sima_yi:2+floor,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:battleRef(r,kind,tale),trial:1},seed);},brief(chapter:number){briefing(chapter);},zhugeBrief(chapter:number){zhugeBriefing(chapter);},backdrop(art:number,place:string){return isoScene(art,place).url;},ending(id:string){if(id==='patience')playYeonEnding();else replayEnding(id);},zhugeEnding(replay?:ZhugeBranch){playZhugeEnding(replay);},zhugeList(){showZhuge();},epilogue(){menuOpen=true;modal('<div class="ss-host finale-host"></div>',false);void showEpilogue($('.finale-host'),9);},get campaign(){return campaign;},act(cmd:Command){act(cmd);}}});
void boot();
