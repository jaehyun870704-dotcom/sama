/**
 * 시나리오 모드 화면: 장 선택 → 이야기 무대(선택) → 출진 전 정비(반드시) → 전투 → 전투 뒤 장면 → 다음 장.
 * 규칙은 scenario.ts, 무대 연출은 story-stage.ts. 연의 장의 정비·전투·보상은 main.ts의 기존 흐름을 쓴다.
 */
import {loadScenario,saveScenario,freshScenario,scenarioPath,currentStep,scriptOf,choose,finishStep,fateChoices,floorFor,scenarioParty,rewardOfficers,endingNotes,routeTales,COMPANIONS,type ScenarioState,type ScenarioStep} from './scenario.ts';
import {playScenes,spriteStyle} from './story-stage.ts';
import {storyBackdrop} from './story.ts';
import {routeById,fatePoint,endingFor,type Route} from './fate.ts';
import {chapters} from './session.ts';
import {encounterLevels} from './campaign-rules.ts';
import {treasures,type Deployment,type ScenarioDeployment} from './progression.ts';
import {romanceByName,romanceStats,temperOf} from './romance.ts';
import {temperNames} from './duel.ts';
import {classNames} from './troops.ts';
import {nextEvolutionText,XP_PER_LEVEL,type BattleMods,type RunBattleRef} from './roguelike.ts';
import {loadMeta,saveMeta} from './meta.ts';
import {classTactics,evolvedClass,tierOf,familyOf,type BattleState,type UnitClass} from '../../core/src/index.ts';
import type {ChapterScript,ChoiceEffect,Look,Scene} from './scenario-types.ts';

export interface ScenarioHost {
  modal(html:string,closable?:boolean):void;
  showMenu():void;
  toast(text:string):void;
  /** 연의 장의 출진 전 정비(장비·준비·난이도) → 전투 */
  storyBriefing(chapter:number,scenario:ScenarioDeployment):void;
  /** 가상 전장 출진 */
  startBattle(deployment:Deployment,seed:number):void;
  /** 연의 진행의 사마의: 레벨과 다음 레벨까지 경험치(0~99로 환산) */
  hero():{level:number;xp:number};
  /** 사마의에게 경험치(연의 진행과 같은 기록)를 준다. 레벨이 오르면 소식 문장을 돌려준다. */
  addHeroXp(amount:number):string[];
  /** 사마의의 장비(가상 전장에도 들고 간다) */
  heroLoadout():Deployment['loadouts'];
}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const ACT_NAMES=['상편 · 살아남는 자','중편 · 맞서는 자','하편 · 거머쥐는 자'];
const chapterIndex=(stage:string)=>chapters.findIndex(c=>c.stage.id===stage);
const hashSeed=(id:string)=>{let h=7;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;return h%99991+11;};

/** 대본이 없을 때(혹은 짧은 장): 줄거리로 한 장면을 만든다. */
function fallbackScript(step:ScenarioStep,state:ScenarioState):ChapterScript{
  const title=stepTitle(step,state),synopsis=stepSynopsis(step,state);
  return {id:step.id,year:stepYear(step,state),title,synopsis,scenes:[{place:title,art:step.kind==='fate'?12:step.kind==='ending'?5:14,
    cast:[{name:'사마의',look:'strategist',at:[34,64],face:'right'}],steps:[{narrate:synopsis},{say:'사마의',line:step.kind==='fate'?'갈림길이다. 어느 길로 가든, 돌아올 수는 없다.':'때가 왔다. 가자.'}]}]};
}
export function stepTitle(step:ScenarioStep,state:ScenarioState){
  const s=scriptOf(step.id);if(s)return s.title;
  if(step.kind==='story')return chapters[chapterIndex(step.stage!)]?.stage.subtitle??step.id;
  if(step.kind==='fate')return fatePoint(step.act,state.route).title;
  if(step.kind==='tale')return step.tale!.title;
  if(step.kind==='boss')return `우두머리 · ${routeById(step.route)!.region.boss.name}`;
  return endingFor({...state.route,3:step.route??''}).title;
}
function stepYear(step:ScenarioStep,state:ScenarioState){return scriptOf(step.id)?.year??(step.kind==='story'?chapters[chapterIndex(step.stage!)]?.year??'':step.kind==='fate'?fatePoint(step.act,state.route).year:'');}
function stepSynopsis(step:ScenarioStep,state:ScenarioState){
  const s=scriptOf(step.id);if(s)return s.synopsis;
  if(step.kind==='story')return chapters[chapterIndex(step.stage!)]?.stage.synopsis??'';
  if(step.kind==='fate')return fatePoint(step.act,state.route).prompt;
  if(step.kind==='tale')return step.tale!.intro;
  if(step.kind==='boss'){const r=routeById(step.route)!;return `${r.region.name}의 주인 ${r.region.boss.name}. ${r.name}의 마지막 싸움이다.`;}
  return endingFor({...state.route,3:step.route??''}).lines.join(' ');
}
const kindTag:Record<ScenarioStep['kind'],string>={story:'연의',fate:'갈림길',tale:'가상',boss:'가상 · 우두머리',ending:'결말'};
function firstArt(step:ScenarioStep){return scriptOf(step.id)?.scenes[0]?.art??(step.kind==='fate'?12:step.kind==='ending'?5:14);}

/** 선택으로 고른 효과 → 이번 전투의 효과. */
export function modsOf(state:ScenarioState,step:ScenarioStep):BattleMods{
  const picked=state.choices[step.id],script=scriptOf(step.id),out:BattleMods={};
  if(!picked||!script)return out;
  for(const scene of script.scenes)for(const st of scene.steps)if('choice' in st)for(const o of st.options)if(o.id===picked)for(const e of o.effects??[]){
    if(e.kind==='reinforce')(out.reinforce??=[]).push({name:e.name,unitClass:e.unitClass,side:e.side});
    else if(e.kind==='rally'||e.kind==='guard'||e.kind==='insight'||e.kind==='scout'||e.kind==='ambush'||e.kind==='bold')out[e.kind]=true;
  }
  if(step.kind==='story'){delete out.reinforce;delete out.scout;delete out.ambush;delete out.bold;}
  return out;
}
const MOD_TEXT:Record<string,string>={rally:'아군 2턴 사기 상승',guard:'아군 1턴 방어 태세',insight:'사마의 책략 MP +15',scout:'적 한 부대가 나오지 않는다',ambush:'적 전원 체력 80%로 시작',bold:'적 정예 한 부대 추가 · 경험치 1.5배'};
export function modsText(m:BattleMods){return [...Object.entries(m).filter(([k,v])=>k!=='reinforce'&&v).map(([k])=>MOD_TEXT[k]!),...(m.reinforce??[]).map(r=>`${r.name}(${classNames[r.unitClass]??r.unitClass})이 ${r.side==='npc'?'초록 깃발의 NPC로':'아군으로'} 합류`)];}

// ─────────────────────────────────────────────── 장 선택

export function showScenario(host:ScenarioHost,selected?:string){
  const state=loadScenario(),path=scenarioPath(state),cur=currentStep(state),done=new Set(state.done);
  const sel=path.find(s=>s.id===selected)??cur??path.at(-1)!;
  const route=(act:1|2|3)=>routeById(state.route[act]);
  const track=[1,2,3].map(a=>{const r=route(a as 1|2|3);return `<span class="${r&&!r.history?'if':''} ${cur&&cur.act===a?'now':''}">${ACT_NAMES[a-1]!.split(' · ')[0]} · ${r?esc(r.name):'갈림길 전'}</span>`;}).join('');
  const hero=host.hero();
  const card=(s:ScenarioStep,i:number)=>{const st=done.has(s.id)?'done':s===cur?'now':'locked';
    return `<button class="sc-card ${st} kind-${s.kind}" data-step="${esc(s.id)}" aria-pressed="${s===sel}"><span class="sc-thumb" style="${storyBackdrop(firstArt(s))}"></span><span class="sc-card-text"><small>${String(i+1).padStart(2,'0')} · ${kindTag[s.kind]} · ${esc(stepYear(s,state))}</small><strong>${esc(stepTitle(s,state))}</strong></span><b>${st==='done'?'◆':st==='now'?'▶':'·'}</b></button>`;};
  const groups=[1,2,3].map(a=>{const items=path.map((s,i)=>({s,i})).filter(x=>x.s.act===a);return items.length?`<h3 class="sc-act">${ACT_NAMES[a-1]}</h3>${items.map(x=>card(x.s,x.i)).join('')}`:'';}).join('');
  const isCur=sel===cur,isDone=done.has(sel.id);
  host.modal(`<div class="scenario-screen"><div class="sc-top"><div><div class="eyebrow">三國志 · 사마의전 · 시나리오</div><h2>천명의 길</h2></div>
    <div class="sc-route">${track}</div><p class="muted">사마의 Lv.${hero.level} · 함께하는 장수 ${Object.keys(state.officers).length}명 · 마친 장 ${state.done.length}</p></div>
    <div class="sc-body"><nav class="sc-list" aria-label="장 목록">${groups}</nav>
    <section class="sc-detail"><div class="sc-banner" style="${storyBackdrop(firstArt(sel))}"><span class="sc-kind kind-${sel.kind}">${kindTag[sel.kind]}</span><div class="sc-banner-title"><small>${esc(stepYear(sel,state))}</small><h3>${esc(stepTitle(sel,state))}</h3></div></div>
      <p class="sc-synopsis">${esc(stepSynopsis(sel,state))}</p>${detailRows(sel,state,hero.level)}
      <div class="sc-actions">${isCur?`<button class="primary" id="sc-enter">${sel.kind==='fate'?'갈림길로 ▶':sel.kind==='ending'?'결말 보기 ▶':'이야기 시작 ▶'}</button>`:isDone?`<button id="sc-replay">이야기 다시 보기</button>`:'<button disabled>앞 장을 마치면 열린다</button>'}</div></section></div>
    <div class="sc-foot"><button id="sc-back">← 본영</button><button id="sc-reset" class="${state.done.length?'':'hidden'}">처음부터 다시</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>b.onclick=()=>showScenario(host,b.dataset.step));
  document.getElementById('sc-enter')?.addEventListener('click',()=>void enter(host,sel));
  document.getElementById('sc-replay')?.addEventListener('click',()=>void replay(host,sel));
  document.getElementById('sc-back')!.onclick=host.showMenu;
  const reset=document.getElementById('sc-reset')!;reset.onclick=()=>{if(reset.dataset.armed!=='1'){reset.dataset.armed='1';reset.textContent='정말 처음부터? (선택·장수 기록이 지워진다)';reset.classList.add('danger');return;}saveScenario(freshScenario());showScenario(host);};
  document.querySelector('.sc-card[aria-pressed="true"]')?.scrollIntoView({block:'nearest'});
}
function detailRows(step:ScenarioStep,state:ScenarioState,heroLevel:number){
  const rows:Array<[string,string]>=[];
  if(step.kind==='story'){const i=chapterIndex(step.stage!),c=chapters[i];rows.push(['권장 레벨',`Lv.${encounterLevels[step.stage!]??'?'}`]);if(c)rows.push(['전장',`${c.label} · ${c.map.rows[0]!.length}×${c.map.rows.length}`]);
    const t=treasures.filter(x=>x.stage===step.stage);if(t.length)rows.push(['보물',t.map(x=>x.name).join(' · ')]);}
  if(step.kind==='tale'||step.kind==='boss'){const r=routeById(step.route)!,foe=step.kind==='boss'?r.region.boss:step.tale!.target;
    rows.push(['적장',`${foe.name} (${classNames[foe.unitClass]??foe.unitClass})${romanceStats(foe.name)?' · '+romanceStats(foe.name):''}`],['지역',r.region.name],['승리 조건',`${foe.name} 격퇴 · 사마의 생존`],['적 수준',`Lv.${enemyBase(state,heroLevel,step)} 안팎`]);}
  if(step.kind==='fate')rows.push(['고를 수 있는 길',fateChoices(state,step.id).map(r=>`${r.history?'[정사]':'[가상]'} ${r.choice}`).join(' / ')]);
  if(step.kind==='ending')rows.push(['결말',endingFor({...state.route,3:step.route??''}).title]);
  const picked=state.choices[step.id];if(picked&&step.kind!=='fate'){const m=modsText(modsOf(state,step));if(m.length)rows.push(['선택의 효과',m.join(' · ')]);}
  return rows.length?`<dl class="sc-rows">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`:'';
}
function enemyBase(state:ScenarioState,heroLevel:number,step:ScenarioStep){
  const levels=[heroLevel,...Object.values(state.officers).map(o=>o.level)],avg=levels.reduce((a,b)=>a+b,0)/levels.length;
  return Math.max(1,Math.round(avg)+(step.kind==='boss'?1:0));
}

// ─────────────────────────────────────────────── 이야기 → 정비 → 전투

async function stage(host:ScenarioHost,state:ScenarioState,step:ScenarioStep,scenes:Scene[],heading:string,choosing:boolean){
  host.modal('<div class="ss-host"></div>',false);
  const root=document.querySelector<HTMLElement>('.ss-host')!;
  await playScenes(root,scenes,{heading,flags:()=>state.flags,onChoice:(o)=>{if(choosing){choose(state,step,o.id,o.effects??[],host.hero().level);saveScenario(state);}}});
}
/** 지금 장에 들어간다: 이야기 장면부터. */
export async function enter(host:ScenarioHost,step:ScenarioStep){
  const state=loadScenario(),script=scriptOf(step.id)??fallbackScript(step,state);
  await stage(host,state,step,script.scenes,`${kindTag[step.kind]} · ${script.title}`,true);
  if(step.kind==='fate'){
    if(!state.route[step.act])return showFateFallback(host,state,step);
    return afterFate(host,state,step);
  }
  if(step.kind==='ending')return showEnding(host,state,step);
  prepare(host,step);
}
async function replay(host:ScenarioHost,step:ScenarioStep){
  const state=loadScenario(),script=scriptOf(step.id)??fallbackScript(step,state);
  await stage(host,state,step,[...script.scenes,...(script.after??[])],`다시 보기 · ${script.title}`,false);
  showScenario(host,step.id);
}
/** 출진 전 정비: 이야기가 끝나면 반드시 거친다. */
export function prepare(host:ScenarioHost,step:ScenarioStep){
  const state=loadScenario();
  if(step.kind==='story'){host.storyBriefing(chapterIndex(step.stage!),{chapter:step.id,mods:modsOf(state,step)});return;}
  showIfPrep(host,state,step);
}
/** 대본에 갈림길 선택이 없을 때의 대비: 길 목록에서 고른다. */
function showFateFallback(host:ScenarioHost,state:ScenarioState,step:ScenarioStep){
  const p=fatePoint(step.act,state.route),routes=fateChoices(state,step.id);
  host.modal(`<div class="briefing run-screen fate-screen"><div class="eyebrow">${esc(p.year)} · 운명의 갈림길</div><h2>${esc(p.title)}</h2><blockquote>${esc(p.prompt)}</blockquote>
  <div class="run-choices">${routes.map(r=>`<button data-route="${r.id}" class="${r.history?'history':'what-if'}"><strong><span class="route-tag">${r.history?'정사':'가상'}</span>${esc(r.choice)}</strong><small>${esc(r.detail)}</small></button>`).join('')}</div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(b=>b.onclick=()=>{choose(state,step,b.dataset.route!,[],host.hero().level);saveScenario(state);afterFate(host,state,step);});
}
function afterFate(host:ScenarioHost,state:ScenarioState,step:ScenarioStep){
  finishStep(state,step.id);saveScenario(state);
  const r=routeById(state.route[step.act])!;
  const people=Object.values(state.officers).map(o=>o.name);
  host.modal(`<div class="briefing run-screen fate-screen"><div class="eyebrow">운명의 갈림길 · ${esc(fatePoint(step.act,step.act===1?{}:step.act===2?{1:state.route[1]??''}:{1:state.route[1]??'',2:state.route[2]??''}).title)}</div><h2>${esc(r.choice)}</h2>
  <p class="route-result ${r.history?'history':'what-if'}"><b>${r.history?'정사':'가상'}</b> ${esc(r.name)} — ${esc(r.detail)}</p>
  ${!r.history?`<p class="muted">${r.region.name} · 우두머리 ${esc(r.region.boss.name)} · 가상 전장 ${routeTales(r,state).length}장</p><p>함께하는 장수: ${people.length?esc(people.join(' · ')):'없음'}</p>`:''}
  <div class="run-actions"><button class="primary" id="fate-next">다음 장 ▶</button><button id="fate-list">장 목록</button></div></div>`,false);
  document.getElementById('fate-next')!.onclick=()=>{const n=currentStep(loadScenario());if(n)void enter(host,n);else showScenario(host);};
  document.getElementById('fate-list')!.onclick=()=>showScenario(host);
}
function showEnding(host:ScenarioHost,state:ScenarioState,step:ScenarioStep){
  finishStep(state,step.id);saveScenario(state);
  const e=endingFor(state.route),notes=endingNotes(state);
  const meta=loadMeta();if(!meta.endings.includes(e.id)){meta.endings.push(e.id);saveMeta(meta);}
  host.modal(`<div class="briefing run-screen"><div class="eyebrow">결말 · ${e.history?'정사':'가상'}</div><div class="ending-card ${e.history?'history':'what-if'}"><h3>${esc(e.title)}</h3>${e.lines.map(l=>`<p>${esc(l)}</p>`).join('')}${notes.map(l=>`<p class="ending-note">${esc(l)}</p>`).join('')}</div>
  <p class="muted">본 결말 ${meta.endings.length}/15. 처음부터 다시 시작해 다른 갈림길을 고르면 다른 이야기와 결말이 펼쳐진다.</p>
  <div class="run-actions"><button class="primary" id="end-list">장 목록</button><button id="end-menu">← 본영</button></div></div>`,false);
  document.getElementById('end-list')!.onclick=()=>showScenario(host);document.getElementById('end-menu')!.onclick=host.showMenu;
}

// ─────────────────────────────────────────────── 가상 전장의 출진 전 정비

const LOOK_OF:Partial<Record<string,Look>>={infantry:'infantry',spearman:'spear',archer:'archer',cavalry:'cavalry',heavyCav:'heavy',crossbow:'crossbow',strategist:'strategist',fengshui:'sage',physician:'physician',monk:'monk',bandit:'bandit',horseArcher:'horseArcher',shaman:'shaman',maiden:'lady',taoist:'taoist',engineer:'engineer',slinger:'archer',assassin:'assassin',rattan:'infantry',elephant:'elephant'};
const lookOf=(c:UnitClass):Look=>LOOK_OF[c]??LOOK_OF[familyOf(c)]??'infantry';

export function showIfPrep(host:ScenarioHost,state:ScenarioState,step:ScenarioStep,picked?:string[],focus?:string){
  const hero=host.hero(),names=Object.keys(state.officers);
  const sel=picked??names.slice(0,6),route=routeById(step.route)!,foe=step.kind==='boss'?route.region.boss:step.tale!.target;
  const f=focus??'사마의',mods=modsOf(state,step);
  const unitOf=(name:string)=>name==='사마의'?{name,unitClass:evolvedClass('strategist',hero.level),level:hero.level,xp:hero.xp}:state.officers[name]!;
  const card=(name:string)=>{const u=unitOf(name),c=evolvedClass(u.unitClass,u.level),on=name==='사마의'||sel.includes(name);
    return `<button class="prep-officer ${on?'on':''} ${f===name?'focus':''}" data-officer="${esc(name)}"><span class="prep-sprite" style="${spriteStyle(lookOf(c))}"></span><span><strong>${esc(name)}</strong><small>${esc(classNames[c]??c)} · Lv.${u.level} ${'◆'.repeat(tierOf(c))}</small><i class="prep-xp"><i style="width:${Math.round(u.xp/XP_PER_LEVEL*100)}%"></i></i></span>${name==='사마의'?'<em>총대장</em>':`<label class="prep-toggle"><input type="checkbox" data-sortie="${esc(name)}" ${on?'checked':''}> 출진</label>`}</button>`;};
  const u=unitOf(f),c=evolvedClass(u.unitClass,u.level),r=romanceByName(f),temper=temperOf(f),t=classTactics(c);
  host.modal(`<div class="briefing prep-screen"><div class="eyebrow">출진 전 정비 · ${esc(kindTag[step.kind])} · ${esc(stepTitle(step,state))}</div><h2>누구를 데리고 갈 것인가</h2>
  <p class="camp-mission">승리: ${esc(foe.name)} 격퇴 · 패배: 사마의 퇴각. 지역 ${esc(route.region.name)} · 적 수준 Lv.${enemyBase(state,hero.level,step)} 안팎. 출진은 사마의와 장수 최대 6명.</p>
  ${modsText(mods).length?`<p class="prep-mods"><b>대사 선택의 효과</b> ${esc(modsText(mods).join(' · '))}</p>`:''}
  <div class="prep-body"><div class="prep-list">${card('사마의')}${names.map(card).join('')}</div>
  <div class="prep-detail"><div class="prep-portrait"><span class="prep-sprite big" style="${spriteStyle(lookOf(c),2)}"></span><div><h3>${esc(f)}</h3><p>${esc(classNames[c]??c)} · Lv.${u.level} · 경험치 ${u.xp}/${XP_PER_LEVEL}</p>${r?`<p class="muted">${esc(r.epithet)}</p>`:''}</div></div>
    ${r?`<div class="romance-stats prep-stats">${([['무력',r.war],['지력',r.int],['통솔',r.lead],['정치',r.pol],['매력',r.cha]] as const).map(([k,v])=>`<span><small>${k}</small><b>${v}</b><i style="width:${v}%"></i></span>`).join('')}</div>`:''}
    ${temper?`<p>성격 <b>${temperNames[temper]}</b> — 일기토·설전에 응하는 방식</p>`:''}${r?.skill?`<p><b>${esc(r.skill.name)}</b> ${esc(r.skill.description)}</p>`:''}
    ${t.map(x=>`<p><b class="tactic-name">전법 「${esc(x.name)}」</b> ${esc(x.description)}</p>`).join('')}<p class="muted">${esc(nextEvolutionText(c))}</p></div></div>
  <div class="run-actions"><button class="primary" id="prep-go">출진 ▶</button><button id="prep-back">← 장 목록</button></div></div>`,false);
  const get=()=>[...document.querySelectorAll<HTMLInputElement>('[data-sortie]')].filter(x=>x.checked).map(x=>x.dataset.sortie!);
  document.querySelectorAll<HTMLButtonElement>('[data-officer]').forEach(b=>b.onclick=e=>{if((e.target as HTMLElement).closest('.prep-toggle'))return;showIfPrep(host,state,step,get(),b.dataset.officer!);});
  document.querySelectorAll<HTMLInputElement>('[data-sortie]').forEach(x=>x.onchange=()=>{const now=get();if(now.length>6){x.checked=false;host.toast('출진은 장수 최대 6명입니다.');return;}showIfPrep(host,state,step,now,f);});
  document.getElementById('prep-back')!.onclick=()=>showScenario(host,step.id);
  document.getElementById('prep-go')!.onclick=()=>launch(host,state,step,get());
}
function launch(host:ScenarioHost,state:ScenarioState,step:ScenarioStep,picked:string[]){
  const hero=host.hero(),party=scenarioParty(state,hero.level,hero.xp,picked),mods=modsOf(state,step);
  const ref:RunBattleRef={seed:hashSeed(step.id),floor:floorFor(step,state),kind:step.kind==='boss'?'boss':'tale',party,relics:[],route:{...state.route},
    ...(step.kind==='tale'?{tale:step.id}:{}),...(Object.keys(mods).length?{mods}:{}),enemyBase:enemyBase(state,hero.level,step),scenario:step.id};
  const loadout=host.heroLoadout()?.sima_yi;
  const deployment:Deployment={levels:{sima_yi:hero.level,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},...(loadout?{loadouts:{sima_yi:loadout}}:{}),run:ref,scenario:{chapter:step.id}};
  host.startBattle(deployment,hashSeed(step.id));
}

// ─────────────────────────────────────────────── 전투가 끝난 뒤

/** 가상 전장 전투가 끝났을 때(main.ts가 부른다). */
export async function finishIfBattle(host:ScenarioHost,state:BattleState,deployment:Deployment,earned:Record<string,number>){
  const sc=loadScenario(),step=scenarioPath(sc).find(s=>s.id===deployment.scenario?.chapter);
  if(!step)return showScenario(host);
  if(state.outcome!=='victory')return showDefeat(host,step);
  const ref=deployment.run!,mult=ref.mods?.bold?1.5:1,bonus=step.kind==='boss'?90:70;
  const news=rewardOfficers(sc,ref.party,earned,bonus,mult);
  news.push(...host.addHeroXp(Math.round((140+(earned.sima_yi??0))*mult)));
  finishStep(sc,step.id);saveScenario(sc);
  await afterVictory(host,sc,step,news);
}
/** 연의 장 전투가 끝났을 때(main.ts가 보상 처리 뒤에 부른다). */
export async function finishStoryBattle(host:ScenarioHost,chapterId:string,victory:boolean,news:string[]){
  const sc=loadScenario(),step=scenarioPath(sc).find(s=>s.id===chapterId);
  if(!step)return showScenario(host);
  if(!victory)return showDefeat(host,step);
  finishStep(sc,step.id);saveScenario(sc);
  await afterVictory(host,sc,step,news);
}
async function afterVictory(host:ScenarioHost,sc:ScenarioState,step:ScenarioStep,news:string[]){
  const script=scriptOf(step.id);
  if(script?.after?.length)await stage(host,sc,step,script.after,`전투 뒤 · ${script.title}`,false);
  const next=currentStep(loadScenario());
  host.modal(`<div class="result scenario-result"><div class="result-character">승</div><h2>${esc(stepTitle(step,sc))}</h2><p>${kindTag[step.kind]} · ${esc(stepYear(step,sc))}</p>
  ${news.length?`<div class="run-news">${news.map(n=>`<p${n.startsWith('진화!')?' class="evo"':''}>${esc(n)}</p>`).join('')}</div>`:''}
  ${next?`<p class="muted">다음 장 · ${esc(kindTag[next.kind])} · ${esc(stepTitle(next,loadScenario()))}</p>`:''}
  <div class="modal-actions"><button id="res-list">장 목록</button>${next?'<button class="primary" id="res-next">다음 장 ▶</button>':''}</div></div>`,false);
  document.getElementById('res-list')!.onclick=()=>showScenario(host,next?.id);
  document.getElementById('res-next')?.addEventListener('click',()=>{if(next)void enter(host,next);});
}
function showDefeat(host:ScenarioHost,step:ScenarioStep){
  host.modal(`<div class="result scenario-result"><div class="result-character">패</div><h2>아직, 끝이 아니다.</h2><p>${esc(stepTitle(step,loadScenario()))} — 장수들은 무사히 물러났다. 정비를 다시 하고 도전하라.</p>
  <div class="modal-actions"><button id="def-list">장 목록</button><button class="primary" id="def-retry">출진 전 정비로</button></div></div>`,false);
  document.getElementById('def-list')!.onclick=()=>showScenario(host,step.id);
  document.getElementById('def-retry')!.onclick=()=>prepare(host,step);
}
/** 본영 카드에 쓰는 요약. */
export function scenarioSummary(){const s=loadScenario(),cur=currentStep(s);return {state:s,current:cur,title:cur?stepTitle(cur,s):'결말까지 보았다',tag:cur?kindTag[cur.kind]:'완결'};}
export {COMPANIONS};
export type {Route,ChoiceEffect};
