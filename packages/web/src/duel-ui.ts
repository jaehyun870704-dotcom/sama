/**
 * 일기토·설전 화면 — 두 단계.
 *  1) 대결 선포: 왼쪽 붉은 깃발에 상대, 오른쪽 푸른 깃발에 우리 장수, 가운데 붓글씨 「對決」(설전은 「舌戰」)과
 *     엇갈린 칼(설전은 붓), 위에 「단기접전」 띠.
 *  2) 겨루기: 옆에서 본 채색 배경 위에 두 사람이 마주 서고, 왼쪽 위·오른쪽 아래에 먹 붓 대사창(흉상·이름·대사),
 *     아래에는 검붉은 옻칠 판에 합 순서(一~五)와 행동 칸(먹 그림 아이콘)이 놓인다.
 */
import type {DuelAction,DuelState} from './duel.ts';
import {duelActionNames,duelAdvantage,duelExchangeLine,newDuel,duelRound,type DuelKind} from './duel.ts';
import {bustFace,displayName} from './faces.ts';
import {officerPortrait} from './officer-art.ts';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const NUM=['1합','2합','3합','4합','5합'];
/** 행동 아이콘(먹 붓으로 그린 듯한 선 그림). */
const ICON:Record<'duel'|'debate',Record<DuelAction,string>>={
  duel:{
    attack:'<path d="M10 54 L50 14 M44 12 L54 10 L52 20 M16 40 L24 48" />',
    guard:'<path d="M32 8 C44 14 52 14 54 16 C54 38 46 50 32 58 C18 50 10 38 10 16 C12 14 20 14 32 8 Z M32 18 V48" />',
    rally:'<path d="M32 56 C18 46 22 34 30 28 C28 38 36 38 36 30 C36 22 30 18 32 8 C46 18 50 34 44 46 C40 54 36 56 32 56 Z" />',
    feint:'<path d="M8 34 C18 14 44 14 56 34 C44 52 20 52 8 34 Z M25 34 A7 7 0 1 0 39 34 A7 7 0 1 0 25 34 M12 52 L24 42" />',
    special:'<path d="M8 40 C22 34 36 20 56 8 M14 50 C30 44 44 32 58 18 M10 28 C20 22 30 14 40 8" />',
  },
  debate:{
    attack:'<path d="M12 50 L44 18 M40 14 L50 12 L48 22 M12 50 L8 56 L14 54 Z M20 20 C28 12 40 10 48 14" />',
    guard:'<path d="M10 14 H54 V44 H34 L22 56 V44 H10 Z M20 26 H44 M20 34 H38" />',
    rally:'<path d="M32 10 A16 16 0 1 1 31.9 10 M32 18 V26 M32 32 L38 38 M14 54 H50" />',
    feint:'<path d="M10 18 Q32 4 54 18 Q44 26 34 34 Q24 42 12 54 M24 18 Q34 28 48 30 M14 42 Q28 42 38 54" />',
    special:'<path d="M32 6 L38 24 L58 24 L42 36 L48 56 L32 44 L16 56 L22 36 L6 24 L26 24 Z" />',
  },
};
const icon=(kind:'duel'|'debate',a:DuelAction)=>`<svg viewBox="0 0 64 64" aria-hidden="true" class="duel-ico">${ICON[kind][a]}</svg>`;
const HELP:Record<'duel'|'debate',Record<DuelAction,string>>={
  duel:{attack:'필살을 끊는다',guard:'공격을 막고 기합 +1',rally:'간파를 누르고 기합 +2',feint:'방어를 깨뜨린다',special:'기합 2 · 기합을 벤다'},
  debate:{attack:'논파의 허점을 찌른다',guard:'논박을 막고 논거 +1',rally:'유도를 견디고 논거 +2',feint:'반론을 유도한다',special:'논거 2 · 숙고를 끊는다'},
};
const DUEL_BACKDROPS=['duel-arena-field-v2.webp','duel-arena-river-v2.webp','duel-arena-gate-v2.webp'] as const;
const DEBATE_BACKDROPS=['debate-arena-palace-v2.webp','debate-arena-tent-v2.webp'] as const;
const preloaded=new Set<string>();
/** 전투를 시작할 때 대결 배경과 전장 장수들의 대결 그림을 미리 받아 둔다(대결 화면이 몇 초 비어 보이지 않게). */
export function preloadDuelArt(urls:readonly (string|undefined)[]){
  for(const url of [...DUEL_BACKDROPS,...DEBATE_BACKDROPS,...urls]){if(!url||preloaded.has(url))continue;preloaded.add(url);const im=new Image();im.decoding='async';im.src=url;}
}
const backdropIndex=(seed:string,length:number)=>{
  let hash=2166136261;
  for(const ch of seed)hash=Math.imul(hash^ch.charCodeAt(0),16777619);
  return (hash>>>0)%length;
};
/** 대결 장소(옆에서 본 배경): 일기토는 들판·강변·성문, 설전은 궁전·군막을 번갈아 쓴다. */
export function duelBackdrop(kind:'duel'|'debate',seed:string,indoor=false){
  const scenes=kind==='debate'||indoor?DEBATE_BACKDROPS:DUEL_BACKDROPS;
  const scene=scenes[backdropIndex(seed,scenes.length)];
  return `background-image:url(${scene});background-position:center;background-size:cover`;
}
const face=(name:string)=>bustFace(name)??`<div class="talk-bust sprite">${officerPortrait(name)}</div>`;
/** 겨루기 화면 중앙에 크게 세우는 전신 전투 모델. */
export function duelModel(model:string,side:'player'|'enemy',name:string){
  // 말 탄 크기는 이름이 아니라 실제로 세운 그림으로 정한다(그림을 만드는 쪽이 data-mounted를 붙인다).
  // 이름으로 정하면 걸어서 싸우는 검객 그림의 장합도 말 탄 크기로 커지고, 말 탄 군주 병사 그림의 유비는 작게 섰다.
  const mounted=model.includes('data-mounted');
  return `<div class="duel-model ${side==='enemy'?'face-left':'face-right'}${mounted?' mounted':''}" aria-label="${esc(displayName(name))}">${model}</div>`;
}
/** 전투 밖 대결에서 병종을 모르는 쪽: 일기토는 검객, 설전은 책사 전신 모델을 쓴다. */
export function contestModel(kind:DuelKind,side:'player'|'enemy',name:string){
  const sheet=kind==='duel'?'four-stage-swordsman':'four-stage-strategist';
  const model=`<span class="battle-model" role="img" style="background-image:var(--${sheet}-atlas);background-size:400% 400%;background-position:0 0"></span>`;
  return duelModel(model,side,name);
}

/** 1) 대결 선포 화면. */
export function duelSplash(d:DuelState,acceptLine?:string,historic=false){
  const title=d.kind==='duel'?'일기토':'설전',sub=d.kind==='duel'?'단기접전':'설전';
  const banner=(name:string,side:'red'|'blue')=>`<div class="vs-banner ${side}"><div class="vs-face">${face(name)}</div><b>${esc(displayName(name))}</b></div>`;
  return `<div class="duel-splash ${d.kind}" role="dialog" aria-label="${sub}">
    <div class="vs-title">${sub}</div>
    ${banner(d.enemy.name,'red')}
    <div class="vs-emblem"><div class="vs-hex"></div><span class="vs-glyph">${title}</span><div class="vs-cross ${d.kind}"></div></div>
    ${banner(d.player.name,'blue')}
    <div class="vs-floor" aria-hidden="true"><span class="vs-unit vs-left" data-vs-model="enemy"></span><span class="vs-unit vs-right" data-vs-model="player"></span></div>
    ${acceptLine?`<p class="vs-accept">${historic?'<b>연의의 대결</b> · ':''}${esc(d.enemy.name)}: “${esc(acceptLine)}”</p>`:''}
    <button type="button" class="vs-go primary">${d.kind==='duel'?'겨룬다':'논한다'} ▶</button>
  </div>`;
}
/** 먹 붓 대사창(위·아래). */
function inkLine(name:string,line:string,pos:'top'|'bottom'){
  return `<div class="duel-talk ${pos}"><div class="duel-talk-face">${face(name)}</div><div class="duel-talk-body"><b>${esc(displayName(name))}</b><p>${esc(line)}</p></div></div>`;
}
/**
 * 한 사람에게 들어온 한 합의 연출. incoming: 상대의 수, own: 내 수, dmg: 받은 피해, stat: 상대의 무력(지력).
 * 피해 숫자 아래에 「무력 87」처럼 피해가 어디서 왔는지 적는다.
 */
export function hitFx(kind:DuelKind,incoming:DuelAction,own:DuelAction,dmg:number,stat:number){
  const fx:string[]=[];
  if(own==='rally')fx.push(`<i class="fx fx-aura ${kind}"></i>`);
  if(own==='feint')fx.push(`<i class="fx fx-feint ${kind}"></i>`);
  if(dmg>0){
    const big=incoming==='special',guarded=own==='guard';
    if(kind==='duel')fx.push(`<i class="fx fx-slash${big?' big':''}"></i>`,big?'<i class="fx fx-slash cross big"></i>':'','<i class="fx fx-spark"></i>');
    else fx.push(`<i class="fx fx-ink${big?' big':''}"></i>`,'<i class="fx fx-ring"></i>',`<b class="fx-word${big?' big':''}">${big?'논파!':'논박!'}</b>`);
    if(big&&kind==='duel')fx.push('<b class="fx-word duel big">필살!</b>');
    if(guarded)fx.push(`<b class="fx-guard">${kind==='duel'?'막았다':'반론'}</b>`);
    fx.push(`<b class="damage-number${big?' crit':''}${guarded?' guarded':''}">−${dmg}<small>${kind==='duel'?'대결 무력':'설전 지력'} ${stat}${big?' ×1.5':''}${guarded?' · 방어':''}</small></b>`);
  }else if(own==='guard'&&(incoming==='attack'||incoming==='special')){
    if(kind==='duel')fx.push('<i class="fx fx-spark block"></i>');
    fx.push(`<b class="fx-guard">${kind==='duel'?'막았다':'반론'}</b>`);
  }
  return fx.filter(Boolean).join('');
}
/** 2) 겨루기 화면. models: 두 사람의 전장 그림(HTML). */
export function duelArena(d:DuelState,o:{models:{player:string;enemy:string};backdrop:string;openingLine?:string}){
  const labels=duelActionNames(d.kind),last=d.history.at(-1),energy=d.kind==='debate'?'논거':'기합';
  const pLine=last?duelExchangeLine(d.kind,last.action,last.enemyAction):d.kind==='duel'?'내가 상대해 주마!':'그 말, 내가 받아 주겠소.';
  const eLine=last?duelExchangeLine(d.kind,last.enemyAction,last.action):o.openingLine??'덤벼라!';
  /** 머리 위 작은 막대: 이름·체력(남은 만큼 초록→노랑→빨강)·기합(논거) 구슬. */
  const hp=(u:DuelState['player'],side:string)=>{const k=u.hp/Math.max(1,u.maxHp);return `<div class="duel-mini ${side}${k<=.3?' low':k<=.6?' mid':''}"><b>${esc(displayName(u.name))} <span title="연의 능력 + 레벨(대결에 쓰는 값)">${d.kind==='duel'?'무력':'지력'} ${u.stat}</span></b><div class="duel-hp"><i style="width:${(k*100).toFixed(1)}%"></i></div><small>${u.hp}/${u.maxHp}</small><em title="${energy}">${'●'.repeat(u.energy)}${'○'.repeat(Math.max(0,3-u.energy))}</em></div>`;};
  const track=NUM.map((n,i)=>{const h=d.history[i];const cls=!h?'':h.dealt>h.taken?'won':h.dealt<h.taken?'lost':'even';
    return `<div class="duel-round ${cls}${i===d.round&&!d.result?' now':''}"><span class="duel-round-no">${n}</span><div class="duel-round-tile">${h?icon(d.kind,h.action):''}</div>${h?`<small>${h.dealt}:${h.taken}</small>`:''}</div>${i<4?'<i class="duel-arrow">➜</i>':''}`;}).join('');
  const actions=(Object.keys(labels) as DuelAction[]).map(a=>{const off=a==='special'&&d.player.energy<2;
    return `<button type="button" class="duel-act${off?' off':''}" data-duel-action="${a}" ${off||d.result?'disabled':''}>${icon(d.kind,a)}<b>${labels[a]}</b><small>${HELP[d.kind][a]}</small></button>`;}).join('');
  const result=d.result?`<div class="duel-result ${d.result}"><span>${d.result==='win'?'승리':d.result==='lose'?'패배':'무승부'}</span><p>${d.result==='win'?'승리':d.result==='lose'?'패배':'무승부'} · 전투 체력: 승자 15% · 패자 45% · 무승부 양쪽 25% 피해(최소 1). 패자는 2턴 ${d.kind==='duel'?'쇠약·둔화':'혼란·책략 봉인'}.</p><button id="duel-return" class="primary">전장으로 돌아가기</button></div>`:'';
  // 타격 연출: 맞은 쪽에 베기·불꽃(일기토) 또는 먹물·글자 충격파(설전), 막으면 방패 번쩍임, 필살기는 화면 번쩍임·크게 흔들림.
  const special=!!last&&((last.action==='special'&&last.dealt>0)||(last.enemyAction==='special'&&last.taken>0));
  const shake=!last?'':special?' shake-big':last.dealt||last.taken?' shake':'';
  const edge=last?duelAdvantage(last.action,last.enemyAction):0;
  const clash=last?`<div class="duel-clash ${edge>0?'won':edge<0?'lost':'even'}"><b>${edge>0?'상성 우세':edge<0?'상성 열세':'정면 승부'}</b><small>${labels[last.action]} ↔ ${labels[last.enemyAction]}</small></div>`:'';
  const cutin=last?[last.action==='special'?{side:'player',name:d.player.name}:undefined,last.enemyAction==='special'?{side:'enemy',name:d.enemy.name}:undefined]
    .filter((x):x is {side:string;name:string}=>!!x).map(x=>`<div class="duel-cutin ${x.side}" aria-hidden="true"><span>${face(x.name)}</span><b>${esc(displayName(x.name))}<small>${d.kind==='duel'?'필살기':'논파'}</small></b></div>`).join(''):'';
  const endClass=(player:boolean)=>!d.result?'':d.result==='draw'?' result-draw':(d.result==='win')===player?' result-winner':' result-loser';
  const even=!!last&&edge===0&&d.kind==='duel';
  // 연기(animateDuel): 첫 화면은 양쪽에서 걸어 들어오고, 합마다 '준비 → 돌진 → 맞부딪침 → 밀려남 → 제자리'.
  // 맞부딪치는 순간까지 타격 효과·피해 숫자·흔들림을 숨겨 두었다가(pre-impact) 그때 터뜨린다.
  const swing=(a:DuelAction|undefined)=>d.kind==='duel'&&(a==='attack'||a==='special')?`<i class="fx fx-arc${a==='special'?' big':''}"></i>`:'';
  return `<div class="duel-stage live-models ${d.kind} choreo${last?' pre-impact':' entering'}" data-round="${d.history.length}" data-p-act="${last?.action??''}" data-e-act="${last?.enemyAction??''}">
    <div class="duel-view${shake}" style="${o.backdrop}">${special?`<i class="duel-flash ${d.kind}"></i>`:''}${last?'':'<i class="duel-divider" aria-hidden="true"></i>'}
      <div class="duel-sun"></div>
      <div class="duel-ground${even?' clash-even':''}${d.result?' resolved':''}">
        <div class="duel-fighter player motion-${last?.action??'idle'}${last?.taken?' hit':''}${endClass(true)}">${o.models.player}${swing(last?.action)}${last?hitFx(d.kind,last.enemyAction,last.action,last.taken,d.enemy.stat):''}</div>
        <div class="duel-fighter enemy motion-${last?.enemyAction??'idle'}${last?.dealt?' hit':''}${endClass(false)}">${o.models.enemy}${swing(last?.enemyAction)}${last?hitFx(d.kind,last.action,last.enemyAction,last.dealt,d.player.stat):''}</div>
      </div>
      ${hp(d.player,'left fixed')}${hp(d.enemy,'right fixed')}
      ${cutin}
      ${clash}
      ${inkLine(d.player.name,pLine,'top')}${inkLine(d.enemy.name,eLine,'bottom')}
      ${result}
    </div>
    <div class="duel-panel">
      <div class="duel-panel-head"><span>${d.kind==='duel'?'일기토':'설전'}</span><b>${Math.min(5,d.round+ (d.result?0:1))} / 5합</b></div>
      <div class="duel-track">${track}</div>
      <div class="duel-acts">${actions}</div>
      ${last?`<p class="duel-report" aria-live="polite">${last.round}합 · ${labels[last.action]} 대 ${labels[last.enemyAction]} · 준 피해 ${last.dealt} / 받은 피해 ${last.taken}</p>`:''}
    </div>
  </div>`;
}

/**
 * 겨루기 연기 — 조조전의 단기접전처럼 두 장수가 맞달려 부딪치고, 맞은 쪽이 밀려났다가 제자리로 돌아온다.
 * 화면은 합마다 새로 그리므로, 새로 그린 직후 이 함수가 그 합의 움직임을 이어서 보여 준다(Web Animations).
 * 일기토는 크게 돌진하고, 설전은 한 걸음 다가서며 몸을 내민다. 움직임 줄이기 설정이면 바로 결과만 보인다.
 */
export function animateDuel(root:ParentNode=document){
  const stage=root.querySelector<HTMLElement>('.duel-stage.choreo');if(!stage)return;
  const p=stage.querySelector<HTMLElement>('.duel-fighter.player'),e=stage.querySelector<HTMLElement>('.duel-fighter.enemy');
  const impact=()=>stage.classList.remove('pre-impact');
  if(!p||!e||matchMedia('(prefers-reduced-motion: reduce)').matches||typeof p.animate!=='function'){impact();stage.classList.remove('entering');return;}
  const smooth='cubic-bezier(.45,0,.25,1)';
  if(stage.classList.contains('entering')){
    // 입장: 화면 양 끝에서 걸어 들어와 마주 선다(걸음마다 살짝 뜬다).
    const walk=(el:HTMLElement,from:string)=>el.animate([{transform:`translateX(${from})`,opacity:0},{transform:`translateX(${from})`,opacity:1,offset:.08},{transform:'translateX(0)',opacity:1}],{duration:1100,easing:'cubic-bezier(.25,.6,.3,1)'});
    walk(p,'-38vw');walk(e,'38vw');
    window.setTimeout(()=>stage.classList.remove('entering'),1150);return;
  }
  const debate=stage.classList.contains('debate'),pa=stage.dataset.pAct??'',ea=stage.dataset.eAct??'';
  const rush=(a:string)=>a==='attack'||a==='special'||a==='feint';
  const pr=p.getBoundingClientRect(),er=e.getBoundingClientRect();
  const gap=Math.max(0,(er.left+er.width/2)-(pr.left+pr.width/2)-Math.min(pr.width,er.width)*.55);
  const both=rush(pa)&&rush(ea),share=debate?.28:both?.5:.92;
  const reach=(a:string)=>rush(a)?gap*share*(a==='feint'?.6:1):0;
  const total=debate?1150:1250,hitAt=.44;
  const play=(el:HTMLElement,a:string,dir:1|-1,hit:boolean)=>{
    const x=reach(a)*dir,back=-dir*(hit?(debate?26:46):0);
    const guard=a==='guard',rally=a==='rally';
    const frames:Keyframe[]=[
      {transform:'translate(0,0) rotate(0deg)',offset:0},
      // 준비: 무게를 뒤로 싣는다.
      {transform:`translate(${-dir*(guard?14:10)}px,2px) rotate(${-dir*2}deg)`,offset:.16},
      // 돌진(또는 막기·기합).
      {transform:rally?'translate(0,-22px) rotate(0deg)':guard?`translate(${-dir*6}px,0) rotate(${-dir*1}deg)`:`translate(${x}px,0) rotate(${dir*3}deg)`,offset:hitAt},
      // 맞부딪침 직후: 맞았으면 뒤로 밀려나며 몸이 젖혀진다.
      {transform:`translate(${(guard?-dir*6:x)+back}px,0) rotate(${hit?-dir*7:dir*1}deg)`,offset:.62},
      {transform:`translate(${((guard?-dir*6:x)+back)*.5}px,0) rotate(0deg)`,offset:.8},
      {transform:'translate(0,0) rotate(0deg)',offset:1},
    ];
    el.animate(frames,{duration:total,easing:smooth});
  };
  // 일기토: 몸(.duel-fighter)은 돌진하고, 그림(.duel-model)은 칼을 들어 올렸다가(뒤로 젖힘) 내리친다(앞으로 숙임).
  // 맞은 쪽 그림은 그 순간 붉게 번쩍이며 비틀거린다.
  const body=(el:HTMLElement)=>el.querySelector<HTMLElement>('.duel-model');
  const swing=(el:HTMLElement,a:string,dir:1|-1)=>{const m=body(el);if(!m||!rush(a))return;
    m.animate([{rotate:'0deg',offset:0},{rotate:`${-dir*9}deg`,offset:.3},{rotate:`${-dir*11}deg`,offset:hitAt-.04},{rotate:`${dir*12}deg`,offset:hitAt+.04},{rotate:`${dir*4}deg`,offset:.7},{rotate:'0deg',offset:1}],{duration:total,easing:'ease-in-out',composite:'add'});};
  const stagger=(el:HTMLElement,dir:1|-1)=>{const m=body(el);if(!m)return;
    m.animate([{filter:'none',scale:'1 1',offset:0},{filter:'none',scale:'1 1',offset:hitAt},{filter:'brightness(1.9) sepia(.6) hue-rotate(-30deg) saturate(3)',scale:'1.04 .94',offset:hitAt+.05},{filter:'none',scale:'.98 1.02',offset:hitAt+.16},{filter:'none',scale:'1 1',offset:1}],{duration:total,easing:'ease-out'});
    void dir;};
  // 설전: 다가서지 않고 제자리에서 부채·손을 휘두르며 말한다. 말이 먹글자가 되어 상대에게 날아가 꽂히고,
  // 꽂힌 쪽은 움찔 물러서며 식은땀을 흘린다(논파당함). 막으면 같은 글자를 되받아친다.
  const glyphs=['理','義','策','論','辯','證'];
  const speak=(el:HTMLElement,a:string,dir:1|-1)=>{const m=body(el);if(!m||a==='guard')return;
    const lean=a==='rally'?0:dir*10;
    m.animate([{translate:'0 0',rotate:'0deg'},{translate:`${lean*.4}px -4px`,rotate:`${dir*-4}deg`,offset:.2},{translate:`${lean}px 0`,rotate:`${dir*5}deg`,offset:.36},{translate:`${lean*.6}px -3px`,rotate:`${dir*-3}deg`,offset:.5},{translate:`${lean}px 0`,rotate:`${dir*4}deg`,offset:.64},{translate:'0 0',rotate:'0deg'}],{duration:total,easing:'ease-in-out',composite:'add'});};
  const fly=(from:HTMLElement,to:HTMLElement,n:number,delay:number,big:boolean)=>{
    const view=stage.querySelector<HTMLElement>('.duel-view');if(!view)return;const vr=view.getBoundingClientRect(),fr=from.getBoundingClientRect(),tr=to.getBoundingClientRect();
    for(let i=0;i<n;i++){const g=document.createElement('b');g.className='duel-glyph'+(big?' big':'');g.textContent=glyphs[(i*7+n)%glyphs.length]!;view.appendChild(g);
      const x0=fr.left+fr.width*.5-vr.left,y0=fr.top+fr.height*(.32+i*.08)-vr.top,x1=tr.left+tr.width*.5-vr.left,y1=tr.top+tr.height*(.3+i*.1)-vr.top;
      g.animate([{transform:`translate(${x0}px,${y0}px) scale(.4)`,opacity:0},{transform:`translate(${x0+(x1-x0)*.15}px,${y0-26}px) scale(1)`,opacity:1,offset:.25},{transform:`translate(${x1}px,${y1}px) scale(${big?1.6:1.2})`,opacity:1,offset:.85},{transform:`translate(${x1}px,${y1}px) scale(${big?2.2:1.6})`,opacity:0}],{duration:total*.5,delay:delay+i*90,easing:'cubic-bezier(.4,0,.6,1)',fill:'both'}).finished.then(()=>g.remove(),()=>g.remove());}};
  const sweat=(el:HTMLElement)=>{const d=document.createElement('i');d.className='duel-sweat';d.textContent='💧';el.appendChild(d);window.setTimeout(()=>d.remove(),total);};
  if(debate){
    speak(p,pa,1);speak(e,ea,-1);
    const big=(a:string)=>a==='special';
    if(rush(pa)||pa==='rally')fly(p,e,big(pa)?3:2,total*.12,big(pa));
    if(rush(ea)||ea==='rally')fly(e,p,big(ea)?3:2,total*.12,big(ea));
    // 논파당한 쪽: 몸이 뒤로 물러서며 움찔(몸 전체는 아래 play가 밀어낸다) + 식은땀
    for(const [el,hit,dir] of [[p,p.classList.contains('hit'),1],[e,e.classList.contains('hit'),-1]] as const){if(hit){stagger(el,dir);window.setTimeout(()=>sweat(el),Math.round(total*hitAt));}}
  }else{
    swing(p,pa,1);swing(e,ea,-1);
    if(p.classList.contains('hit'))stagger(p,1);if(e.classList.contains('hit'))stagger(e,-1);
  }
  play(p,pa,1,p.classList.contains('hit'));play(e,ea,-1,e.classList.contains('hit'));
  window.setTimeout(impact,Math.round(total*hitAt));
}

/**
 * 전투 밖의 대결(이야기 선택지·출진 전 조우): 선포 화면 → 5합 겨루기를 덮개 하나에 띄우고 결과를 돌려준다.
 * stat은 일기토면 무력, 설전이면 지력(+레벨)을 넣는다.
 */
export function playContest(kind:DuelKind,me:{name:string;stat:number},foe:{name:string;stat:number},o:{acceptLine?:string;seed?:string;indoor?:boolean;done?:string;
  /** 효과음(전투 중 겨루기와 같은 소리): 선포 화면은 critical, 겨루기는 필살·논파만 critical. */
  sound?:(critical:boolean)=>void;
  /** 병종을 아는 쪽의 전신 모델(없으면 일기토 검객·설전 책사). */
  models?:{player?:string;enemy?:string}}={}):Promise<'win'|'lose'|'draw'>{
  const d=newDuel(kind,{id:'me',...me},{id:'foe',...foe});
  const el=document.createElement('div');el.className='contest-overlay';
  // 열린 dialog(최상위 층) 안에 붙여야 그 위로 보인다.
  (document.querySelector('dialog[open]')??document.body).appendChild(el);
  const models={player:o.models?.player?duelModel(o.models.player,'player',me.name):contestModel(kind,'player',me.name),enemy:o.models?.enemy?duelModel(o.models.enemy,'enemy',foe.name):contestModel(kind,'enemy',foe.name)};
  return new Promise(resolve=>{
    const arena=()=>{el.innerHTML=`<div class="contest-box">${duelArena(d,{models,backdrop:duelBackdrop(kind,o.seed??foe.name,o.indoor),...(o.acceptLine?{openingLine:o.acceptLine}:{})}).replace('전장으로 돌아가기',esc(o.done??'이야기로 돌아가기')).replace(/전투 체력: 승자 15% · 패자 45% · 무승부 양쪽 25% 피해\(최소 1\)\. 패자는 2턴 [^<]*/,kind==='duel'?'이기면 이번 전투 아군 사기 상승 · 적의 기세가 꺾인다.':'이기면 이번 전투 아군 사기 상승 · 사마의 책략 MP +15.')}</div>`;
      animateDuel(el);
      el.querySelectorAll<HTMLButtonElement>('[data-duel-action]').forEach(b=>b.onclick=()=>{if(duelRound(d,b.dataset.duelAction as DuelAction)){o.sound?.(b.dataset.duelAction==='special');arena();}});
      el.querySelector<HTMLButtonElement>('#duel-return')?.addEventListener('click',()=>{el.remove();resolve(d.result??'draw');});};
    el.innerHTML=`<div class="contest-box">${duelSplash(d,o.acceptLine)}</div>`;o.sound?.(true);
    el.querySelectorAll<HTMLElement>('[data-vs-model]').forEach(x=>x.innerHTML=x.dataset.vsModel==='enemy'?models.enemy:models.player);
    let started=false;const go=()=>{if(started)return;started=true;arena();};
    el.querySelector('.vs-go')?.addEventListener('click',go);setTimeout(go,2600);
  });
}
