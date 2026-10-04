/**
 * 삼국지 인물열전 — 장수·병종·책략을 한곳에서 본다.
 *
 * 인물: 연의 장수록의 모든 장수(신장수 포함). 초상, 다섯 능력, 병종·성격, 고유능력, 열전 본문,
 *       그리고 장수 효과(배우기·장착)까지. 전용 원화가 없는 장수는 초상 생성기(portrait.ts)로 얼굴을 지어 준다.
 * 병종: 모든 병종의 그림·능력 계수·사거리·전법·개화 스킬·진화 계통·쓰는 책략.
 * 책략: 아이콘 목록과 속성·소모 MP·습득 레벨·시전 범위·효과 범위 격자·설명.
 */
import type {UnitClass} from '../../core/src/index.ts';
import {VARIANTS,tierOf,familyOf,profileOf,classTactics,strategyArea} from '../../core/src/index.ts';
import {allRomanceNames,romanceByName,temperOf} from './romance.ts';
import {temperNames} from './duel.ts';
import {customNames,customList} from './custom.ts';
import {officerLook,officerPortrait} from './officer-art.ts';
import {suggestPortrait,portraitURL} from './portrait.ts';
import {bioOf} from './officer-bios.ts';
import {classNames,troopRoles,troopArt,basicReactionArt,artClass,recruitPool,evolutionLines} from './troops.ts';
import {adviceFor} from './troop-tactics.ts';
import {allStrategies,strategyHint,STATUS_NAMES,SHAPE_TEXT,type LearnedStrategy} from './officers.ts';
import {officerFeatures} from './officers.ts';
import {loadMeta,saveMeta} from './meta.ts';
import {perksFor,perkLine,perkState,bestLevel,learnPerk,togglePerk,officerClass} from './officer-perks.ts';
import {perkSlots} from './research.ts';

export interface CodexHost {modal(html:string,closable?:boolean):void;toast(text:string):void;back():void;research?():void}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// ─────────────────────────────────────────────── 인물

export type Side='wei'|'shu'|'wu'|'other'|'custom';
const SIDE_NAMES:Record<Side,string>={wei:'위',shu:'촉',wu:'오',other:'군웅',custom:'신장수'};
const SHU=new Set('마초 황충 조운 마속 왕평 위연 고상 맹염 강유 제갈량 방통 유비 관우 장비 서서 관평 유봉 마대 관색 황권 하후패 이엄'.split(' '));
const WU=new Set('주유 손권 장소 제갈근 여몽 여범 손소 육손 주연 제갈각 고수 황개 감녕 노숙 정봉 전종 서성'.split(' '));
const OTHER=new Set('여포 진궁 양앙 공손연 비연 안량 원담 고람 맹획 축융 올돌골 봉기 원상 심배 고간 답돈 문추 저수 채모 전풍 타사대왕 원희'.split(' '));
const WOMEN=new Set(['축융']);
export function sideOf(name:string):Side{if(customNames().includes(name))return 'custom';return SHU.has(name)?'shu':WU.has(name)?'wu':OTHER.has(name)?'other':'wei';}
/** 열전에 오르는 모든 장수(위·촉·오·군웅·신장수 순, 같은 세력 안에서는 장수록 순). */
export function codexNames(){const order:Side[]=['wei','shu','wu','other','custom'];const names=allRomanceNames();return order.flatMap(s=>names.filter(n=>sideOf(n)===s));}
/** 얼굴: 전용 원화 → 신장수 초상 → 초상 생성기로 지은 얼굴. */
export function codexFace(name:string){
  if(officerLook(name)||customNames().includes(name))return officerPortrait(name);
  const spec=suggestPortrait(name,officerClass(name),temperOf(name)??'calm');if(WOMEN.has(name)){spec.hat=5;spec.beard=0;}
  const url=portraitURL(spec);
  return url?`<div class="officer-face custom-face" role="img" aria-label="${esc(name)} 초상" style="background-image:url(${url});background-size:cover;background-position:center"></div>`:officerPortrait(name);
}
/** 열전 본문(신장수는 능력과 성격으로 짓는다). */
export function biography(name:string){
  const b=bioOf(name);if(b)return b;
  const c=customList().find(o=>o.name===name);
  if(c)return `${c.name}은(는) 『삼국지연의』에 이름이 없는, 이 이야기에서 새로 일어선 인물이다. 사람들은 그를 「${c.epithet||'이름 없는 장수'}」라 불렀다. ${temperNames[c.temper]}한 성품으로 ${classNames[c.unitClass]??c.unitClass}을(를) 이끌었고, 그 행적은 이제부터 쓰인다.`;
  const r=romanceByName(name);return r?`${name} — ${r.epithet}. 자세한 행적은 전하지 않는다.`:'';
}
const STAT_ROWS:Array<[keyof NonNullable<ReturnType<typeof romanceByName>>,string]>=[['war','무력'],['int','지력'],['lead','통솔'],['pol','정치'],['cha','매력']];

function peopleTab(pick:string,side:Side|'all'){
  const meta=loadMeta(),names=codexNames().filter(n=>side==='all'||sideOf(n)===side),name=names.includes(pick)?pick:names[0]??'';
  const r=romanceByName(name),cls=officerClass(name),temper=temperOf(name),skill=r?.skill??officerFeatures[name];
  const st=perkState(meta,name),best=bestLevel(meta,name),slots=perkSlots(meta),perks=perksFor(name);
  const list=`<div class="cx-filter">${(['all','wei','shu','wu','other','custom'] as const).map(s=>`<button data-cx-side="${s}" class="${side===s?'active':''}">${s==='all'?'전체':SIDE_NAMES[s]}</button>`).join('')}</div>
    <div class="cx-people">${names.map(n=>`<button data-cx-person="${esc(n)}" class="cx-person side-${sideOf(n)} ${n===name?'chosen':''}" aria-label="${esc(n)}"><span class="cx-face">${codexFace(n)}</span><b>${esc(n)}</b></button>`).join('')||'<p class="muted">이 세력에는 아직 장수가 없다.</p>'}</div>`;
  const detail=!name?'':`<div class="cx-detail cx-person-detail">
    <div class="cx-head"><span class="cx-big-face">${codexFace(name)}</span><div><small class="cx-side side-${sideOf(name)}">${SIDE_NAMES[sideOf(name)]}</small><h3>${esc(name)}</h3><p class="cx-epithet">${esc(r?.epithet??'')}</p>
      <p class="cx-tags"><span>${esc(classNames[cls]??cls)}</span>${temper?`<span>성격 ${temperNames[temper]}</span>`:''}${best?`<span>최고 Lv.${best}</span>`:''}</p></div></div>
    ${r?`<div class="cx-stats">${STAT_ROWS.map(([k,label])=>{const v=r[k] as number;return `<div class="cx-stat"><span>${label}</span><i><i style="width:${v}%" class="${v>=90?'hi':v<40?'lo':''}"></i></i><b>${v}</b></div>`;}).join('')}</div>`:''}
    ${skill?`<p class="cx-unique"><b>고유능력 「${esc(skill.name)}」</b> ${esc(skill.description)}</p>`:''}
    <div class="cx-bio"><h4>열전</h4><p>${esc(biography(name))}</p></div>
    <div class="cx-perks"><h4>장수 효과 <small>장착 ${st.equipped.length}/${slots} · 천명 ${meta.mandate}</small></h4>
      ${perks.map(p=>{const learned=st.learned.includes(p.id),on=st.equipped.includes(p.id),reach=best>=p.level;
        return `<div class="cx-perk ${learned?'learned':''} ${on?'equipped':''} ${!learned&&!reach?'locked':''}"><span class="cx-perk-glyph">${on?'◆':learned?'◇':'🔒'}</span><div><b>${esc(p.name)}</b> <small>${p.source}</small><br><span>${esc(perkLine(p))}</span><br><small>필요 Lv.${p.level} · 천명 ${p.cost}</small></div>
        ${learned?`<button data-cx-toggle="${p.id}">${on?'해제':'장착'}</button>`:`<button data-cx-learn="${p.id}" ${reach&&meta.mandate>=p.cost?'':'disabled'}>${reach?'습득':'Lv.'+p.level+' 필요'}</button>`}</div>`;}).join('')}
      <p class="muted">필요 레벨은 이 장수가 어느 회차에서든 닿은 가장 높은 레벨입니다. 장착한 효과는 이 장수가 천명의 길에서 출진할 때 적용되고, 교체는 무료입니다.</p></div>
  </div>`;
  return {html:`<div class="cx-split"><div class="cx-list">${list}</div>${detail}</div>`,name};
}

// ─────────────────────────────────────────────── 병종

/** 모든 병종: 모병 가능 계통부터, 진화 단계 순. */
export function codexClasses():UnitClass[]{
  const lines=evolutionLines().map(l=>l.map(([c])=>c)),seen=new Set<UnitClass>(),out:UnitClass[]=[];
  const firsts=[...recruitPool,...lines.map(l=>l[0]!)];for(const f of firsts){const line=lines.find(l=>l[0]===f)??[f];for(const c of line)if(!seen.has(c)){seen.add(c);out.push(c);}}
  for(const c of ['ram','catapult','engineer','navy'] as UnitClass[])if(!seen.has(c)){seen.add(c);out.push(c);}
  return out;
}
function sprite(c:UnitClass){
  const base=artClass(c),fam=familyOf(base),art=troopArt[base]??troopArt[fam],react=basicReactionArt[base]??basicReactionArt[fam],tint=troopRoles[c]?.tint;
  const hex=tint!==undefined?'#'+tint.toString(16).padStart(6,'0'):'',glow=hex?`;--cx-tint:${hex}`:'';
  const sheet=art??react;
  if(sheet){const pos=`0% ${sheet.row/(sheet.rows-1)*100}%`,size=`400% ${sheet.rows*100}%`,img=`var(--${sheet.sheet}-atlas)`;
    // 진화·확장 병종은 전장처럼 색조를 입힌다(그림 모양대로만 물들도록 같은 그림을 가면으로 쓴다).
    const dye=hex&&VARIANTS[c]?`<i class="cx-dye" style="background:${hex};-webkit-mask-image:${img};mask-image:${img};-webkit-mask-size:${size};mask-size:${size};-webkit-mask-position:${pos};mask-position:${pos}"></i>`:'';
    return `<div class="cx-sprite" style="background-image:${img};background-size:${size};background-position:${pos}${glow}">${dye}</div>`;}
  return `<div class="cx-sprite empty" style="${glow.slice(1)}"><span>${esc((classNames[c]??c).slice(0,1))}</span></div>`;
}
const PROFILE_ROWS:Array<[keyof ReturnType<typeof profileOf>,string]>=[['hp','체력'],['attack','공격'],['defense','방어'],['intellect','지력'],['spirit','정신'],['agility','순발'],['mp','책략']];
function classesTab(pick:string){
  const all=codexClasses(),c=(all.includes(pick as UnitClass)?pick:all[0]!) as UnitClass,p=profileOf(c),v=VARIANTS[c],line=evolutionLines().find(l=>l.some(([x])=>x===c));
  const spells=troopRoles[c]?.spells??(['strategist','fengshui'].includes(familyOf(c))?['(레벨에 따라 모든 책략)']:[]);
  const grid=`<div class="cx-classes">${all.map(k=>`<button data-cx-class="${k}" class="cx-class tier-${tierOf(k)} ${k===c?'chosen':''}">${sprite(k)}<b>${esc(classNames[k]??k)}</b><small>${'◆'.repeat(tierOf(k))}</small></button>`).join('')}</div>`;
  const detail=`<div class="cx-detail"><div class="cx-head">${sprite(c)}<div><small>${'◆'.repeat(tierOf(c))} ${tierOf(c)===1?'기본':tierOf(c)===2?'정예':'최정예'} · ${esc(classNames[familyOf(c)]??familyOf(c))} 계열</small><h3>${esc(classNames[c]??c)}</h3><p>${esc(troopRoles[c]?.role??adviceFor(c))}</p></div></div>
    <div class="cx-stats">${PROFILE_ROWS.map(([k,label])=>{const n=p[k] as number;return `<div class="cx-stat"><span>${label}</span><i><i style="width:${Math.min(100,n/2.2*100)}%" class="${n>=1.3?'hi':n<0.7?'lo':''}"></i></i><b>${n.toFixed(2)}</b></div>`;}).join('')}</div>
    <p class="cx-tags"><span>이동 ${p.movement}</span><span>사거리 ${p.range[0]}~${p.range[1]}</span>${p.canUseStrategy?'<span>책략 사용</span>':''}</p>
    ${v?.bloom?`<p class="cx-unique"><b>개화 「${esc(v.bloom.name)}」</b> ${esc(v.bloom.description)}</p>`:''}
    ${classTactics(c).map(t=>`<p class="cx-unique"><b>전법 「${esc(t.name)}」</b> ${esc(t.description)}</p>`).join('')}
    ${line?`<div class="cx-line">${line.map(([k,lv],i)=>`${i?`<span class="evo-arrow">Lv.${lv} →</span>`:''}<button data-cx-class="${k}" class="evo-node ${k===c?'chosen':''}"><b>${'◆'.repeat(tierOf(k))}</b>${esc(classNames[k]??k)}</button>`).join('')}</div>`:''}
    ${spells.length?`<p class="cx-spells"><b>쓰는 책략</b> ${spells.map(id=>{const s=allStrategies.find(x=>x.id===id);return s?`<button data-cx-spell="${s.id}">${esc(s.name)}</button>`:esc(id);}).join(' ')}</p>`:''}</div>`;
  return `<div class="cx-split"><div class="cx-list">${grid}</div>${detail}</div>`;
}

// ─────────────────────────────────────────────── 책략

const ELEMENT_NAMES:Record<string,string>={fire:'화(火)',wind:'풍(風)',water:'수(水)',thunder:'뇌(雷)',earth:'지(地)',support:'술(術)'};
const GLYPH:Record<string,string>={fire:'火',windDragon:'龍',bind:'縛',confuse:'亂',flood:'水',thunder:'雷',inferno:'業',embers:'燼',gust:'風',ambush:'伏',poison:'毒',silence:'封',fireWall:'陣',rockfall:'石',waterSurge:'濤',feint:'虛',whirlwind:'旋',lightningNet:'網',encircle:'圍',demoralize:'離',deluge:'洪',tempest:'嵐',thunderbolt:'霆',grandFeint:'空',
  mend:'癒',purify:'淨',fortify:'固',march:'行',inspire:'鼓',greatMend:'生',weakenCurse:'衰',breakArmor:'破',rumor:'言',mire:'泥',terror:'威',gale:'斬',plague:'疫',tidalLine:'決',chainFire:'連',thunderCross:'擊',skyFire:'天',quake:'震',shatter:'碎',chaos:'混',warCry:'喊',focus:'瞑',swiftWind:'迅',grandDrum:'鳴',ironWall:'鐵',valor:'勇',sanctuary:'聖'};
/** 책략마다 한 줄 풀이(무엇을 하는 계책인가). */
export const STRATEGY_TEXT:Record<string,string>={
  fire:'적 한 부대에 불을 놓아 태운다. 숲에서 더 거세다.',embers:'작은 불씨를 던져 적을 그을린다. 적은 MP로 쓰는 첫 화계.',inferno:'넓은 땅을 업화로 덮는다. 맞은 적은 화상을 입는다.',fireWall:'불의 진을 쳐 둘레의 적을 태운다.',
  chainFire:'배를 묶은 연환처럼, 한 줄로 늘어선 적을 차례로 불사른다.',skyFire:'하늘에서 불비를 내려 십자로 퍼뜨린다.',
  windDragon:'바람의 용이 휘몰아쳐 둘레의 적을 친다. 사마의의 장기.',gust:'돌풍으로 적 한 부대를 밀어 친다.',whirlwind:'회오리로 둘레를 휩쓴다.',tempest:'폭풍으로 넓은 땅을 휩쓴다.',gale:'칼날 같은 질풍이 한 줄로 내달린다.',
  flood:'물길을 터 십자로 적을 휩쓴다. 물가에서 더 세다.',waterSurge:'격류로 둘레의 적을 덮치고 발을 묶는다.',deluge:'큰물을 일으켜 넓은 땅을 잠근다.',tidalLine:'둑을 무너뜨려 한 줄의 적을 쓸어 가고 발을 묶는다.',mire:'땅을 진흙탕으로 만들어 적의 걸음을 늦춘다.',
  thunder:'벼락 한 줄기로 적을 감전시킨다.',lightningNet:'번개 그물로 둘레의 적을 감전시킨다.',thunderbolt:'천뢰가 한 부대를 꿰뚫는다.',thunderCross:'벼락이 십자로 갈라져 내리꽂힌다.',
  bind:'적 한 부대를 묶어 움직이지 못하게 한다.',ambush:'숨긴 병사가 덮쳐 적을 포박한다.',rockfall:'산 위에서 돌을 굴려 친다. 산지에서 더 세다.',encircle:'둘레를 에워싸 적을 포박한다.',poison:'독을 풀어 적이 피를 흘리게 한다.',plague:'역병을 퍼뜨려 둘레의 적이 피를 흘린다.',
  quake:'땅을 뒤흔들어 넓은 땅의 적을 치고 걸음을 늦춘다.',breakArmor:'갑옷의 이음매를 노려 적이 받는 피해를 늘린다.',shatter:'진을 부수어 둘레의 적이 받는 피해를 늘린다.',
  confuse:'헛소문으로 적 한 부대를 혼란에 빠뜨린다.',feint:'허를 찔러 적을 혼란시킨다.',demoralize:'이간책으로 둘레의 적을 혼란시킨다.',grandFeint:'공성계 — 성문을 열어 두어 넓은 땅의 적을 헷갈리게 한다.',rumor:'여러 부대에 헛소문을 흘려 혼란 상태로 만든다.',chaos:'대혼란계 — 넓은 땅의 적을 한꺼번에 흔든다.',
  silence:'적 책사의 입을 막아 책략을 봉인한다.',weakenCurse:'저주로 적의 힘을 빼 공격 피해를 줄인다.',terror:'위세로 둘레의 적을 눌러 공격 피해를 줄인다.',
  mend:'아군 한 부대의 체력을 회복한다.',greatMend:'둘레의 아군을 크게 회복한다.',sanctuary:'성역을 펼쳐 넓은 땅의 아군을 회복한다.',purify:'해로운 상태이상을 씻어 낸다.',focus:'마음을 가다듬어 아군 한 부대의 MP를 되찾게 한다.',
  fortify:'아군 한 부대를 견고하게 해 받는 피해를 줄인다.',ironWall:'둘레의 아군을 철벽처럼 굳힌다.',march:'강행군으로 아군의 이동력을 늘린다.',swiftWind:'둘레의 아군을 빠르게 움직이게 한다.',
  inspire:'북을 울려 둘레 아군의 사기를 올린다.',warCry:'함성으로 둘레 아군의 공격 피해를 늘린다.',grandDrum:'큰 북소리로 넓은 땅의 아군을 고무한다.',valor:'결사의 각오 — 한 부대가 더 세게 치고 덜 다친다.',
};
const PALETTE:Record<string,[string,string,string]>={fire:['#ffcf7a','#d4421a','#3b0a02'],wind:['#c8f7dc','#2f9e6e','#0b2e22'],water:['#b8e0ff','#2563eb','#0a1a3d'],thunder:['#f1e4ff','#8b5cf6','#1e0b3d'],earth:['#ecdcae','#8a6a2a','#2a1c08'],curse:['#f2c8ff','#9d3fbf','#2a0a33'],heal:['#d2ffdc','#22a05a','#06301a'],buff:['#fff2c0','#d4a017','#3a2a04']};
const iconCache=new Map<string,string>();
function paletteOf(s:LearnedStrategy){if(s.support)return s.support==='heal'||s.support==='cleanse'||s.support==='mana'?PALETTE.heal!:PALETTE.buff!;return s.element==='support'?PALETTE.curse!:PALETTE[s.element]??PALETTE.buff!;}
/** 책략 아이콘(빛살 위에 한 글자). 캔버스가 없으면 빈 문자열. */
export function strategyIcon(id:string){
  const hit=iconCache.get(id);if(hit!==undefined)return hit;
  const s=allStrategies.find(x=>x.id===id);if(!s||typeof document==='undefined')return '';
  const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d')!,[l,m,d]=paletteOf(s);
  const bg=g.createRadialGradient(48,70,4,48,56,80);bg.addColorStop(0,l);bg.addColorStop(.45,m);bg.addColorStop(1,d);g.fillStyle=bg;g.fillRect(0,0,96,96);
  // 아래에서 솟는 빛살
  g.save();g.globalCompositeOperation='lighter';const n=s.shape==='line'?7:s.shape==='cross'?4:13;
  for(let i=0;i<n;i++){const a=s.shape==='cross'?i*Math.PI/2:-Math.PI*(.12+.76*i/Math.max(1,n-1)),len=s.shape==='cross'?50:60+((i*37)%25);
    const gr=g.createLinearGradient(48,s.shape==='cross'?48:84,48+Math.cos(a)*len,(s.shape==='cross'?48:84)+Math.sin(a)*len);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.strokeStyle=gr;g.lineWidth=s.shape==='cross'?10:3+((i*13)%4);g.beginPath();g.moveTo(48,s.shape==='cross'?48:84);g.lineTo(48+Math.cos(a)*len,(s.shape==='cross'?48:84)+Math.sin(a)*len);g.stroke();}
  g.restore();
  g.fillStyle='rgba(0,0,0,.35)';g.font='bold 46px "Noto Serif KR","Nanum Myeongjo",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(GLYPH[id]??'策',50,52);
  g.fillStyle='#fffaf0';g.fillText(GLYPH[id]??'策',48,49);
  g.strokeStyle='rgba(255,236,190,.55)';g.lineWidth=3;g.strokeRect(1.5,1.5,93,93);
  const url=c.toDataURL('image/png');iconCache.set(id,url);return url;
}
/** 9×9 격자: 가운데가 시전자(또는 찍은 칸). */
export function rangeGrid(cells:Array<{x:number;y:number}>,kind:'cast'|'effect'|'help',center='self'){
  const set=new Set(cells.map(c=>`${c.x},${c.y}`));let out='';
  for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const on=set.has(`${x},${y}`),mid=x===0&&y===0;out+=`<i class="${on?kind:''} ${mid?'mid '+center:''}"></i>`;}
  return `<div class="cx-grid">${out}</div>`;
}
export function castCells(range:number){const out:Array<{x:number;y:number}>=[];for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++)if(Math.abs(x)+Math.abs(y)<=range)out.push({x,y});return out;}
function strategiesTab(pick:string){
  const list=[...allStrategies].sort((a,b)=>a.level-b.level||a.id.localeCompare(b.id)),s=list.find(x=>x.id===pick)??list[0]!;
  const users=Object.entries(troopRoles).filter(([,r])=>r?.spells.includes(s.id)).map(([k])=>classNames[k]??k);
  const effect=strategyArea(s,{x:0,y:0},{x:-1,y:0});
  const grid=`<div class="cx-spell-grid">${list.map(x=>`<button data-cx-spell="${x.id}" class="cx-spell ${x.id===s.id?'chosen':''}" title="${esc(x.name)}"><img src="${strategyIcon(x.id)}" alt=""><small>${esc(x.name)}</small></button>`).join('')}</div>`;
  const detail=`<div class="cx-detail cx-spell-detail"><div class="cx-head"><img class="cx-spell-big" src="${strategyIcon(s.id)}" alt=""><div><h3>${esc(s.name)}</h3>
    <p class="cx-tags"><span>속성 ${s.support?'지원':ELEMENT_NAMES[s.element]}</span><span>소모 MP ${s.mpCost}</span><span>습득 Lv.${s.level}</span>${s.support?'':`<span>위력 ${s.power}</span>`}</p></div></div>
    <div class="cx-ranges"><figure><figcaption>시전 범위 · ${s.range}칸</figcaption>${rangeGrid(castCells(s.range),'cast')}</figure><figure><figcaption>효과 범위 · ${SHAPE_TEXT(s)}</figcaption>${rangeGrid(effect,s.support?'help':'effect','target')}</figure></div>
    <div class="cx-bio"><h4>설명</h4><p>${esc(STRATEGY_TEXT[s.id]??'')}</p><p class="muted">${esc(strategyHint(s.id))}${s.inflicts?.length?` · 상태: ${s.inflicts.map(x=>STATUS_NAMES[x]??x).join('·')}`:''}${s.shape==='line'?' · 시전자에게서 멀어지는 방향으로 뻗는다':''}</p></div>
    <p class="cx-spells"><b>쓰는 병종</b> ${[...users.map(esc),'책사·풍수사 계열(레벨에 따라)'].join(' · ')}</p></div>`;
  return `<div class="cx-split"><div class="cx-list">${grid}</div>${detail}</div>`;
}

// ─────────────────────────────────────────────── 화면

export type CodexTab='people'|'classes'|'strategies';
export interface CodexView {tab:CodexTab;person?:string;side?:Side|'all';cls?:string;spell?:string}
export function showCodex(host:CodexHost,view:CodexView={tab:'people'}){
  const v:CodexView={side:'all',...view};
  const people=v.tab==='people'?peopleTab(v.person??'사마의',v.side??'all'):undefined;
  const body=people?people.html:v.tab==='classes'?classesTab(v.cls??'infantry'):strategiesTab(v.spell??'fire');
  host.modal(`<div class="briefing codex-screen"><div class="eyebrow">三國志 人物列傳 · 삼국지 인물열전</div><h2>${v.tab==='people'?'난세를 살아간 사람들':v.tab==='classes'?'병종 — 전장을 채운 부대들':'책략 목록'}</h2>
    <div class="cx-tabs">${([['people','인물 열전'],['classes','병종'],['strategies','책략']] as const).map(([id,label])=>`<button data-cx-tab="${id}" class="${v.tab===id?'active':''}">${label}</button>`).join('')}${host.research?'<button id="cx-research" class="cx-research">연구 ▸</button>':''}</div>
    ${body}<div class="run-actions"><button id="cx-back">← 본영</button></div></div>`,false);
  const all=<T extends HTMLElement>(sel:string)=>document.querySelectorAll<T>(sel);
  all('[data-cx-tab]').forEach(b=>b.onclick=()=>showCodex(host,{...v,tab:b.dataset.cxTab as CodexTab}));
  all('[data-cx-side]').forEach(b=>b.onclick=()=>showCodex(host,{...v,side:b.dataset.cxSide as Side|'all',person:''}));
  all('[data-cx-person]').forEach(b=>b.onclick=()=>showCodex(host,{...v,person:b.dataset.cxPerson!}));
  all('[data-cx-class]').forEach(b=>b.onclick=()=>showCodex(host,{...v,tab:'classes',cls:b.dataset.cxClass!}));
  all('[data-cx-spell]').forEach(b=>b.onclick=()=>showCodex(host,{...v,tab:'strategies',spell:b.dataset.cxSpell!}));
  const who=people?.name??'';
  all('[data-cx-learn]').forEach(b=>b.onclick=()=>{const m=loadMeta();if(learnPerk(m,who,b.dataset.cxLearn!)){saveMeta(m);host.toast('장수 효과를 익혔다.');}showCodex(host,{...v,person:who});});
  all('[data-cx-toggle]').forEach(b=>b.onclick=()=>{const m=loadMeta();if(togglePerk(m,who,b.dataset.cxToggle!))saveMeta(m);else host.toast('장착 칸이 가득 찼다. 연구 「장수 효과 칸」으로 늘릴 수 있다.');showCodex(host,{...v,person:who});});
  document.getElementById('cx-research')?.addEventListener('click',()=>host.research!());
  document.getElementById('cx-back')!.onclick=host.back;
  document.querySelector('.cx-list .chosen')?.scrollIntoView?.({block:'nearest'});
}
