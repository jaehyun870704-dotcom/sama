/**
 * 상점 — 금으로 이름 없는 장비와 소모품을 사고팔고, 그 자리에서 장수의 장비를 정비한다.
 *
 * 탭: 무기 · 방어구 · 보조구 · 도구. 무기·방어구·보조구 탭은 종류(검·창…)로 다시 거른다.
 * 왼쪽은 장수 목록과 각자의 세 칸(무기·방어구·보조구). 장수를 고르면 그 장수가 쓸 수 있는 장비만 밝게 보인다.
 * 사기는 금을 내고, 팔기는 산 값의 절반을 받는다(고유 보물은 팔 수 없다). 장비 등급은 이야기를 진행할수록 열린다.
 * 금은 이야기(사마의전·제갈량전)마다 따로 쓰고, 보관함은 두 이야기가 함께 쓴다.
 */
import {GEAR_KINDS,SHOP_GEAR,SHOP_KINDS,CONSUMABLES,gearDef,maxLevelOf,type GearKind,type UnitClass} from '../../core/src/index.ts';
import {buyGear,sellGear,buySupply,sellSupply,sellPrice,goldOf,supplyCount,equipSlot,equippedItems,canWear,gearName,gearLevel,gearEffectText,treasureInfo,tierThresholds,tierUnlocked,gearNames,type Campaign,type GearSlot,type Story} from './progression.ts';
import {supplyIcon,treasureIcon} from './treasure-art.ts';
import {SHOP_KIND_TEXT,CONSUMABLE_TEXT} from './treasure-catalogue.ts';
import {classNames} from './troops.ts';

export interface ShopUnit {key:string;name:string;unitClass:UnitClass;level?:number}
export interface ShopHost {
  modal(html:string):void;toast(msg:string):void;save():boolean;
  campaign():Campaign;
  /** 그 이야기에서 이긴 장 수와 전체 장 수(등급 해금) */
  progress(story:Story):{wins:number;total:number};
  /** 상점 왼쪽에 보일 장수 */
  units(story:Story):ShopUnit[];
  back():void;
}
export type ShopTab=GearSlot|'supply';
export interface ShopState {story:Story;tab:ShopTab;kind:GearKind|'all';officer:string;inspect?:string;
  /** 이야기를 바꿀 수 있나(본영에서 열었을 때만) */switchable:boolean}
const STORY_NAMES:Record<Story,string>={S:'사마의전',Z:'제갈량전'};
const TABS:Array<[ShopTab,string]>=[['weapon','무기'],['armor','방어구'],['accessory','보조구'],['supply','도구']];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const stars=(g:number)=>'★'.repeat(g);

/** 상점 화면 본문(테스트도 읽는다). */
export function shopMarkup(c:Campaign,st:ShopState,units:readonly ShopUnit[],prog:{wins:number;total:number}){
  const unit=units.find(u=>u.key===st.officer)??units[0],gold=goldOf(c,st.story),gates=tierThresholds(prog.total);
  const roster=units.map(u=>{const worn=equippedItems(c,u.key);return `<button class="sh-unit ${u.key===unit?.key?'chosen':''}" data-shop-officer="${esc(u.key)}"><b>${esc(u.name)}</b><small>${u.level?`Lv.${u.level} · `:''}${esc(classNames[u.unitClass]??u.unitClass)}</small><span class="sh-slots">${(Object.keys(gearNames) as GearSlot[]).map(slot=>{const id=worn.find(x=>treasureInfo(x).slot===slot);return `<i title="${gearNames[slot]} · ${id?esc(gearName(id)):'비어 있음'}">${id?treasureIcon(id):'<em class="empty-slot">＋</em>'}</i>`;}).join('')}</span></button>`;}).join('');
  const fit=(id:string)=>unit?canWear(unit.key,id,unit.unitClass):{ok:true};
  let body='';
  if(st.tab==='supply'){
    body=`<div class="sh-list">${CONSUMABLES.map(d=>{const n=supplyCount(c,d.id);return `<div class="sh-row supply">${supplyIcon(d.id,d.name)}<div class="sh-name"><b>${esc(d.name)}</b><small>${esc(CONSUMABLE_TEXT[d.id]??'')}</small></div><span class="sh-have">보관 ${n}개</span>${d.price?`<button data-shop-buy-supply="${d.id}" ${gold>=d.price?'':'disabled'}>사기 · ${d.price.toLocaleString()}금</button>`:'<span class="muted">팔지 않음</span>'}<button data-shop-sell-supply="${d.id}" ${n>0?'':'disabled'}>팔기 · ${Math.floor((d.price||100)/2)}금</button></div>`;}).join('')}</div>
      <p class="muted">도구는 전투 중 「도구」 명령으로 자신 또는 상하좌우로 붙은 아군에게 쓴다. 부대가 함께 쓰는 보관함에서 꺼낸다.</p>`;
  }else{
    const kinds=SHOP_KINDS.filter(k=>GEAR_KINDS[k].slot===st.tab);
    const shown=SHOP_GEAR.filter(d=>GEAR_KINDS[d.kind].slot===st.tab&&(st.kind==='all'||d.kind===st.kind));
    const rows=shown.map(d=>{const open=tierUnlocked(d.grade,prog.wins,prog.total),ok=fit(d.id);
      return `<div class="sh-row grade-${d.grade} ${ok.ok?'':'unfit'} ${open?'':'locked'}">${treasureIcon(d.id)}<div class="sh-name"><b>${esc(d.name)} <small class="tc-star g${d.grade}">${stars(d.grade)}</small></b><small>${esc(GEAR_KINDS[d.kind].name)} · ${esc(gearEffectText(d.id,1))}${maxLevelOf(d)>1?` (최고 Lv.${maxLevelOf(d)}: ${esc(gearEffectText(d.id,maxLevelOf(d)))})`:''}</small>${ok.ok?'':`<em class="tt-unfit">${esc(ok.reason??'')}</em>`}</div>
        ${open?`<button data-shop-buy="${d.id}" ${gold>=d.price?'':'disabled'}>사기 · ${d.price.toLocaleString()}금</button>${unit&&ok.ok?`<button data-shop-buy-equip="${d.id}" ${gold>=d.price?'':'disabled'}>사서 ${esc(unit.name)}에게 장착</button>`:''}`:`<span class="muted">${STORY_NAMES[st.story]} ${gates[d.grade-1]}장 승리 후</span>`}</div>`;}).join('');
    const owned=c.treasures.filter(id=>!!gearDef(id)&&treasureInfo(id).slot===st.tab&&(st.kind==='all'||treasureInfo(id).kind===st.kind)).sort((a,b)=>treasureInfo(b).grade-treasureInfo(a).grade||a.localeCompare(b));
    const wearer=(id:string)=>units.find(u=>equippedItems(c,u.key).includes(id));
    const mine=owned.map(id=>{const m=treasureInfo(id),ok=fit(id),w=wearer(id),d=gearDef(id)!,on=!!unit&&w?.key===unit.key,lv=maxLevelOf(d)>1?` Lv.${gearLevel(c,id)}/${maxLevelOf(d)}`:'';
      return `<div class="sh-row grade-${m.grade} ${ok.ok?'':'unfit'} ${on?'worn':''}">${treasureIcon(id)}<div class="sh-name"><b>${esc(gearName(id))}${lv} <small class="tc-star g${m.grade}">${stars(m.grade)}</small>${m.named?' <small class="sh-named">고유 보물</small>':''}</b><small>${esc(gearEffectText(id,gearLevel(c,id)))}</small>${w?`<em class="sh-worn">장착 · ${esc(w.name)}</em>`:''}${ok.ok?'':`<em class="tt-unfit">${esc(ok.reason??'')}</em>`}</div>
        ${unit?on?`<button data-shop-unequip="${m.slot}">해제</button>`:`<button data-shop-equip="${esc(id)}" ${ok.ok?'':'disabled'}>${ok.ok?(w?`${esc(w.name)}에게서 옮겨 장착`:'장착'):esc(ok.reason??'')}</button>`:''}
        ${m.named?'<span class="muted">팔 수 없음</span>':`<button data-shop-sell="${esc(id)}">팔기 · ${sellPrice(id).toLocaleString()}금</button>`}</div>`;}).join('');
    body=`<div class="sh-kinds" role="group" aria-label="종류"><button data-shop-kind="all" class="${st.kind==='all'?'active':''}">전체</button>${kinds.map(k=>`<button data-shop-kind="${k}" class="${st.kind===k?'active':''}">${GEAR_KINDS[k].name}</button>`).join('')}</div>
      ${st.kind!=='all'&&SHOP_KIND_TEXT[st.kind]?`<p class="muted">${esc(SHOP_KIND_TEXT[st.kind]!)}</p>`:''}
      <h3>팔고 있는 장비</h3><div class="sh-list">${rows||'<p class="muted">이 종류의 장비는 상점에서 팔지 않는다.</p>'}</div>
      <h3>보관함 <small>${owned.length}점</small></h3><div class="sh-list">${mine||'<p class="muted">보관함에 이 칸의 장비가 없다.</p>'}</div>`;
  }
  return `<div class="briefing shop-screen"><div class="eyebrow">${STORY_NAMES[st.story]} · 상점</div><h2>상점</h2>
    <div class="sh-head"><span class="sh-gold">금 <b>${gold.toLocaleString()}</b></span>${st.switchable?`<span class="sh-story">${(['S','Z'] as const).map(s=>`<button data-shop-story="${s}" class="${st.story===s?'active':''}">${STORY_NAMES[s]} 금 ${goldOf(c,s).toLocaleString()}</button>`).join('')}</span>`:''}
      <span class="muted">열린 등급 ${[1,2,3,4].filter(g=>tierUnlocked(g,prog.wins,prog.total)).map(stars).join(' · ')} · ${STORY_NAMES[st.story]} ${prog.wins}/${prog.total}장 승리</span></div>
    <div class="sh-body"><aside class="sh-roster"><div class="section-label">장수 <span>${units.length}명</span></div>${roster||'<p class="muted">정비할 장수가 없다.</p>'}</aside>
      <section class="sh-main"><div class="sh-tabs" role="tablist">${TABS.map(([t,n])=>`<button role="tab" data-shop-tab="${t}" class="${st.tab===t?'active':''}" aria-selected="${st.tab===t}">${n}</button>`).join('')}</div>${body}</section></div>
    <p class="muted">장비 등급은 ${STORY_NAMES[st.story]}을 진행할수록 열린다(★★ ${gates[1]}장 · ★★★ ${gates[2]}장 · ★★★★ ${gates[3]}장 승리). 무기는 공격·반격으로, 방어구는 공격을 받아 단련된다(상점 장비 최고 Lv.3 · 고유 보물 최고 Lv.9).</p>
    <div class="modal-actions"><button id="shop-back">← 돌아가기</button></div></div>`;
}

/** 상점 화면을 열고 단추를 잇는다. */
export function showShop(host:ShopHost,init:Partial<ShopState>&{story:Story}){
  const st:ShopState={tab:'weapon',kind:'all',officer:'',switchable:false,...init};
  const draw=()=>{
    const c=host.campaign(),units=host.units(st.story),prog=host.progress(st.story);
    if(!units.some(u=>u.key===st.officer))st.officer=units[0]?.key??'';
    const unit=units.find(u=>u.key===st.officer);
    host.modal(shopMarkup(c,st,units,prog));
    const on=(sel:string,fn:(el:HTMLButtonElement)=>void)=>document.querySelectorAll<HTMLButtonElement>(sel).forEach(el=>el.onclick=()=>fn(el));
    const commit=(msg:string)=>{if(host.save())host.toast(msg);draw();};
    on('[data-shop-officer]',el=>{st.officer=el.dataset.shopOfficer!;draw();});
    on('[data-shop-tab]',el=>{st.tab=el.dataset.shopTab as ShopTab;st.kind='all';draw();});
    on('[data-shop-kind]',el=>{st.kind=el.dataset.shopKind as GearKind|'all';draw();});
    on('[data-shop-story]',el=>{st.story=el.dataset.shopStory as Story;draw();});
    on('[data-shop-buy]',el=>{const id=buyGear(c,st.story,el.dataset.shopBuy!);if(id)commit(`${gearName(id)} 구입`);else host.toast('금이 모자랍니다.');});
    on('[data-shop-buy-equip]',el=>{if(!unit)return;const id=buyGear(c,st.story,el.dataset.shopBuyEquip!);if(!id){host.toast('금이 모자랍니다.');return;}equipSlot(c,unit.key,treasureInfo(id).slot,id,unit.unitClass);commit(`${gearName(id)} 구입 · ${unit.name} 장착`);});
    on('[data-shop-sell]',el=>{const id=el.dataset.shopSell!,name=gearName(id),got=sellGear(c,st.story,id);if(got)commit(`${name} 판매 · 금 +${got.toLocaleString()}`);});
    on('[data-shop-equip]',el=>{if(!unit)return;const id=el.dataset.shopEquip!;if(equipSlot(c,unit.key,treasureInfo(id).slot,id,unit.unitClass))commit(`${unit.name} · ${gearName(id)} 장착`);else host.toast(canWear(unit.key,id,unit.unitClass).reason??'장착할 수 없습니다.');});
    on('[data-shop-unequip]',el=>{if(unit&&equipSlot(c,unit.key,el.dataset.shopUnequip as GearSlot,''))commit(`${unit.name} · 장비 해제`);});
    on('[data-shop-buy-supply]',el=>{const id=el.dataset.shopBuySupply!;if(buySupply(c,st.story,id))commit(`${CONSUMABLES.find(x=>x.id===id)?.name??id} 구입`);else host.toast('금이 모자랍니다.');});
    on('[data-shop-sell-supply]',el=>{const id=el.dataset.shopSellSupply!,got=sellSupply(c,st.story,id);if(got)commit(`${CONSUMABLES.find(x=>x.id===id)?.name??id} 판매 · 금 +${got}`);});
    document.getElementById('shop-back')?.addEventListener('click',()=>host.back());
  };
  draw();
}
