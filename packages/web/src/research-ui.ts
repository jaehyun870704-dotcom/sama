/**
 * 연구 화면 — 전투·내정·편성 세 갈래의 나무. 칸을 누르면 아래에 효과·비용·선행·조건이 뜨고 천명으로 한 단계 올린다.
 * 잠긴 칸은 자물쇠와 함께 무엇을 해야 열리는지(회차·연의 전장·결말) 보여 준다.
 */
import {loadMeta,saveMeta} from './meta.ts';
import {RESEARCH,RESEARCH_TABS,nodeById,nodeState,rankOf,buyResearch,gateText,gateOpen,researchProgress,type ResearchTab} from './research.ts';

export interface ResearchHost {modal(html:string,closable?:boolean):void;toast(text:string):void;back():void;codex?():void}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const CELL_W=104,CELL_H=104;

export function showResearch(host:ResearchHost,tab:ResearchTab='battle',pick?:string){
  const meta=loadMeta(),nodes=RESEARCH.filter(n=>n.tab===tab),t=RESEARCH_TABS.find(x=>x.id===tab)!,prog=researchProgress(meta,tab);
  const sel=nodes.find(n=>n.id===pick)??nodes.find(n=>nodeState(meta,n)==='open')??nodes[0]!;
  const cols=Math.max(...nodes.map(n=>n.col))+1,rows=Math.max(...nodes.map(n=>n.row))+1,W=cols*CELL_W,H=rows*CELL_H;
  const at=(n:{col:number;row:number})=>({x:n.col*CELL_W+CELL_W/2,y:n.row*CELL_H+CELL_H/2+2});
  const arrows=nodes.flatMap(n=>(n.requires??[]).map(([id])=>{const from=nodeById(id);if(!from||from.tab!==tab)return '';const a=at(from),b=at(n),lit=rankOf(meta,id)>0;
    const pts=a.y===b.y?`${a.x+26},${a.y} ${b.x-30},${b.y}`:a.x===b.x?`${a.x},${a.y+(b.y>a.y?26:-26)} ${b.x},${b.y+(b.y>a.y?-30:30)}`:`${a.x+26},${a.y} ${b.x-40},${a.y} ${b.x-40},${b.y} ${b.x-30},${b.y}`;
    return `<polyline points="${pts}" class="${lit?'lit':''}" marker-end="url(#rs-arrow)"/>`;})).join('');
  const tiles=nodes.map(n=>{const st=nodeState(meta,n),r=rankOf(meta,n.id),p=at(n);
    return `<button data-rs="${n.id}" class="rs-node ${st} ${n.id===sel.id?'chosen':''}" style="left:${p.x-30}px;top:${p.y-30}px" aria-label="${esc(n.name)} ${r}/${n.max}"><span class="rs-glyph">${st==='locked'&&!r?'🔒':n.glyph}</span><small>${r}/${n.max}</small><em>${esc(n.name)}</em></button>`;}).join('');
  const st=nodeState(meta,sel),r=rankOf(meta,sel.id),cost=r<sel.max?sel.cost(r):0;
  const reqs=(sel.requires??[]).map(([id,k])=>{const x=nodeById(id)!;return `<span class="${rankOf(meta,id)>=k?'ok':'no'}">${esc(x.name)} ${k}단계</span>`;}).join(' ');
  const detail=`<div class="rs-detail"><div class="rs-detail-head"><span class="rs-glyph big">${sel.glyph}</span><div><h3>${esc(sel.name)} <small>${r}/${sel.max}</small></h3>
    <p>${r?`지금: ${esc(sel.effect(r))}`:'아직 배우지 않았다.'}${r<sel.max?`<br>다음: <b>${esc(sel.effect(r+1))}</b>`:'<br><b>끝까지 연구했다.</b>'}</p></div></div>
    ${reqs?`<p class="rs-req">선행 ${reqs}</p>`:''}${sel.gate?`<p class="rs-req">조건 <span class="${gateOpen(meta,sel.gate)?'ok':'no'}">${esc(gateText(sel.gate))}</span></p>`:''}
    ${r<sel.max?`<button id="rs-buy" class="primary" ${st==='open'&&meta.mandate>=cost?'':'disabled'}>연구 · 천명 ${cost}</button>`:''}</div>`;
  host.modal(`<div class="briefing research-screen"><div class="eyebrow">연구 · 회차를 넘어 남는 힘</div><h2>연구</h2>
    <div class="rs-tabs">${RESEARCH_TABS.map(x=>`<button data-rs-tab="${x.id}" class="rs-tab-${x.id} ${x.id===tab?'active':''}">${x.name}</button>`).join('')}<span class="rs-mandate">천명 <b>${meta.mandate}</b></span></div>
    <div class="rs-body"><aside class="rs-banner rs-tab-${tab}"><h3>${t.name}</h3><p>${esc(t.blurb)}</p><div class="rs-emblem">${tab==='battle'?'⚔':tab==='domestic'?'⚖':tab==='formation'?'⚑':'초'}</div><small>연구 진행률</small><b>${prog.done}/${prog.total}</b></aside>
    <div class="rs-tree-wrap"><div class="rs-tree" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" aria-hidden="true"><defs><marker id="rs-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker></defs>${arrows}</svg>${tiles}</div></div></div>
    ${detail}
    <p class="muted">천명은 천명의 길 회차가 끝날 때 얻는다. 잠긴 칸은 회차를 거듭하고 연의 전장을 이기고 결말을 볼수록 서서히 열린다.</p>
    <div class="run-actions">${host.codex?'<button id="rs-codex">인물열전 ▸</button>':''}<button id="rs-back">← 본영</button></div></div>`,false);
  document.querySelectorAll<HTMLButtonElement>('[data-rs-tab]').forEach(b=>b.onclick=()=>showResearch(host,b.dataset.rsTab as ResearchTab));
  document.querySelectorAll<HTMLButtonElement>('[data-rs]').forEach(b=>b.onclick=()=>showResearch(host,tab,b.dataset.rs));
  document.getElementById('rs-buy')?.addEventListener('click',()=>{const m=loadMeta();if(buyResearch(m,sel.id)){saveMeta(m);host.toast(`「${sel.name}」 ${rankOf(m,sel.id)}단계 연구를 마쳤다.`);}showResearch(host,tab,sel.id);});
  document.getElementById('rs-codex')?.addEventListener('click',()=>host.codex!());
  document.getElementById('rs-back')!.onclick=host.back;
}
