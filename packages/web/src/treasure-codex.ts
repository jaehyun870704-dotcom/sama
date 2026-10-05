/**
 * 보물 도감 — 첫 화면(본영)에서 보물을 한눈에: 가진 것, 어디서 얻는지, 효과(능력치·특기·특성), 장착한 장수.
 *
 * 보물은 두 갈래다.
 *  · 장착 보물(treasures): 연의 전장·보물 외전에서 얻어 장수에게 끼운다(무기·방어구·보조구). 영구 보관.
 *  · 회차 보물(RELICS): 천명의 길·원정의 행군로 '보물고'에서 고른다. 그 회차 동안 부대 전원에 효과. 회차가 끝나면 사라진다.
 */
import {treasures,treasureInfo,gearNames,readCampaign,type GearSlot} from './progression.ts';
import {treasurePowerText} from '../../core/src/treasure-traits.ts';
import {TREASURE_SPECIALS} from './treasure-specials.ts';
import {treasureIcon} from './camp.ts';
import {RELICS} from './roguelike.ts';
import {loadRun} from './run-ui.ts';
import {loadScenario} from './scenario.ts';
import {chapters} from './session.ts';
import {expeditions} from './expeditions.ts';

const OFFICER_KO:Record<string,string>={sima_yi:'사마의',sima_lang:'사마랑',sima_fang:'사마방',cao_zhen:'조진'};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export type TreasureTab='all'|'owned'|GearSlot|'relic';
export const TREASURE_TABS:Array<[TreasureTab,string]>=[['all','전체'],['owned','가진 것'],['weapon','무기'],['armor','방어구'],['accessory','보조구'],['relic','회차 보물']];

/** 보물을 얻는 곳(연의 장 제목 또는 보물 외전 이름) */
export function treasureSource(stage:string){
  const ch=chapters.find(c=>c.stage.id===stage);if(ch)return `연의 「${ch.stage.title}」 (${ch.label})`;
  const q=expeditions.find(e=>e.id===stage);if(q)return `보물 외전 「${q.name}」`;
  return stage;
}
/** 지금 가진 보물과 장착 상태(영구 보관 + 이번 회차) */
export function treasureHoldings(){
  const c=readCampaign(),owned=new Set(c.treasures),wearer=new Map<string,string>();
  for(const [officer,slots] of Object.entries(c.loadouts??{}))for(const id of Object.values(slots??{}))if(id)wearer.set(id,officer);
  for(const [officer,id] of Object.entries(c.equipped))if(id&&!wearer.has(id))wearer.set(id,officer);
  const sc=loadScenario(),run=loadRun();
  const relics=new Set<string>([...(sc.run?.status==='alive'?sc.run.relics:[]),...(run?.relics??[])]);
  return {owned,wearer,relics};
}
export function treasureSummary(){const h=treasureHoldings();return {owned:h.owned.size,total:treasures.length,relics:h.relics.size,relicTotal:RELICS.length};}

function card(id:string,h:ReturnType<typeof treasureHoldings>){
  const t=treasures.find(x=>x.id===id)!,info=treasureInfo(id),own=h.owned.has(id),who=h.wearer.get(id),power=treasurePowerText(id),sp=TREASURE_SPECIALS[id];
  return `<article class="tc-card g${info.grade} ${own?'owned':'missing'}">${treasureIcon(id)}<div class="tc-body"><h4>${esc(t.name)} <small>${gearNames[info.slot]} · ${info.rarity}</small></h4>
    <p class="tc-effect">${esc(t.effect)}</p>${power?`<p class="tc-power">특성 · ${esc(power)}</p>`:''}${sp?`<p class="tc-special">✦ 특기 「${esc(sp.name)}」 ${esc(sp.text)}</p>`:''}
    <p class="tc-where">${own?who?`장착 · ${esc(OFFICER_KO[who]??who)}`:'보관 중 · 정비에서 장착':`얻는 곳 · ${esc(treasureSource(t.stage))}`}</p></div></article>`;
}
function relicCard(id:string,h:ReturnType<typeof treasureHoldings>){
  const r=RELICS.find(x=>x.id===id)!,have=h.relics.has(id);
  return `<article class="tc-card relic ${have?'owned':'missing'}"><i class="tc-relic">${esc(r.name.slice(0,1))}</i><div class="tc-body"><h4>${esc(r.name)} <small>회차 보물</small></h4><p class="tc-effect">${esc(r.effect)}</p><p class="tc-where">${have?'이번 회차에 지님 · 부대 전원 적용':'행군로 「보물고」에서 셋 중 하나를 고른다'}</p></div></article>`;
}
/** 보물 도감 화면 본문 */
export function treasureCodex(tab:TreasureTab='all'){
  const h=treasureHoldings(),s=treasureSummary();
  const list=tab==='relic'?[]:treasures.filter(t=>tab==='all'||(tab==='owned'?h.owned.has(t.id):treasureInfo(t.id).slot===tab));
  const sorted=[...list].sort((a,b)=>Number(h.owned.has(b.id))-Number(h.owned.has(a.id))||treasureInfo(b.id).grade-treasureInfo(a.id).grade);
  return `<div class="tc-tabs">${TREASURE_TABS.map(([id,name])=>`<button data-tc-tab="${id}" class="${id===tab?'active':''}">${name}</button>`).join('')}<span class="muted">장착 보물 ${s.owned}/${s.total} · 회차 보물 ${s.relics}/${s.relicTotal}</span></div>
  <p class="muted tc-help">장착 보물은 연의 전장과 보물 외전에서 얻어 정비 화면에서 장수에게 끼운다(무기·방어구·보조구 한 칸씩). 회차 보물은 천명의 길·원정의 행군로 「보물고」에서 고르고, 그 회차 동안 부대 전원에 효과가 있다.</p>
  <div class="tc-grid">${tab==='relic'?RELICS.map(r=>relicCard(r.id,h)).join(''):sorted.map(t=>card(t.id,h)).join('')}</div>`;
}
/** 본영의 보물 패널: 가진 보물 몇 개를 그림으로, 없으면 어디서 얻는지. */
export function treasurePanel(){
  const h=treasureHoldings(),s=treasureSummary();
  const owned=treasures.filter(t=>h.owned.has(t.id)).sort((a,b)=>treasureInfo(b.id).grade-treasureInfo(a.id).grade).slice(0,8);
  const relics=RELICS.filter(r=>h.relics.has(r.id));
  return `<section class="hub-treasure"><div class="section-label">보물 <span>장착 ${s.owned}/${s.total} · 회차 ${s.relics}/${s.relicTotal}</span></div>
    <div class="hub-treasure-row">${owned.length?owned.map(t=>`<button class="hub-treasure-item g${treasureInfo(t.id).grade}" data-treasure="${t.id}" title="${esc(t.effect)}">${treasureIcon(t.id)}<b>${esc(t.name)}</b></button>`).join(''):'<p class="muted">아직 가진 장착 보물이 없다. 연의 전장을 이기면 그 장의 보물을, 보물 외전을 처음 이기면 네 점을 얻는다.</p>'}
    ${relics.map(r=>`<span class="hub-treasure-item relic" title="${esc(r.effect)}"><i class="tc-relic">${esc(r.name.slice(0,1))}</i><b>${esc(r.name)}</b></span>`).join('')}</div>
    <button id="hub-treasures" class="hub-treasure-more">보물 목록 전체 보기 ▶</button></section>`;
}
