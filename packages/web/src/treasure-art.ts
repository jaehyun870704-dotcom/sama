/**
 * 보물의 형태(검·창·방패·말·병서…)·등급과 그림.
 *
 * 그림은 두 곳에서 온다.
 *  · 그림 판 treasures-v2.png(6×10): 처음 60점. 칸 번호는 core treasurePowers의 순서.
 *  · 낱장 public/treasures/<id>.webp: 판 밖의 보물과 회차 보물. 그림을 넣으면 TREASURE_ART에 id를 적는다.
 * 그림이 아직 없는 보물은 형태 글자를 담은 등급 테두리 패로 보인다.
 */
import {treasureInfo,type GearSlot} from './progression.ts';

/** 보물의 세부 형태. 도감·정비의 형태 필터에 쓴다. */
export type TreasureForm='sword'|'blade'|'spear'|'polearm'|'bow'|'hidden'|'armor'|'robe'|'shield'|'mount'|'book'|'seal'|'relicItem'|'ornament';
export const FORMS:Array<{id:TreasureForm;name:string;slot:GearSlot}>=[
  {id:'sword',name:'검',slot:'weapon'},{id:'blade',name:'도',slot:'weapon'},{id:'spear',name:'창',slot:'weapon'},{id:'polearm',name:'극·부',slot:'weapon'},
  {id:'bow',name:'궁·노',slot:'weapon'},{id:'hidden',name:'둔기·암기',slot:'weapon'},
  {id:'armor',name:'갑옷',slot:'armor'},{id:'robe',name:'전포·망토',slot:'armor'},{id:'shield',name:'방패·투구',slot:'armor'},
  {id:'mount',name:'말·마구',slot:'accessory'},{id:'book',name:'병서',slot:'accessory'},{id:'seal',name:'인장·부절',slot:'accessory'},
  {id:'relicItem',name:'기물',slot:'accessory'},{id:'ornament',name:'장신구',slot:'accessory'},
];
const FORM_OF:Record<string,TreasureForm>={
  yitian:'sword',qinggang:'sword',doubleSwords:'sword',moonSword:'sword',jadeSword:'sword',
  sevenstar:'blade',greenDragon:'blade',ancientBlade:'blade',phoenixSpear:'blade',threePointBlade:'blade',zhanmaDao:'blade',
  serpentSpear:'spear',ironSpear:'spear',dragonSpear:'spear',tigerSpear:'spear',hookSpear:'spear',
  halberd:'polearm',crescentBlade:'polearm',twinHalberds:'polearm',ironAxe:'polearm',
  bow:'bow',ironBow:'bow',repeatingCrossbow:'bow',longbow:'bow',
  flyingBlade:'hidden',steelWhip:'hidden',goldHammer:'hidden',meteorHammer:'hidden',
  craneRobe:'robe',cloudRobe:'robe',strategistRobe:'robe',bearCloak:'robe',
  rattanShield:'shield',phoenixHelm:'shield',tigerShield:'shield',lionHelm:'shield',
  dilu:'mount',redHare:'mount',swiftSaddle:'mount',shadowHorse:'mount',yellowHorse:'mount',
  dunjia:'book',taiping:'book',mengde:'book',sunzi:'book',sixTeachings:'book',threeStrategies:'book',qingshu:'book',formationScroll:'book',springAutumn:'book',
  seal:'seal',militarySeal:'seal',tigerTally:'seal',tortoiseToken:'seal',
  fan:'relicItem',warDrum:'relicItem',sevenStarFlag:'relicItem',hujia:'relicItem',baguaMirror:'relicItem',purpleGourd:'relicItem',
  jadePendant:'ornament',phoenixHairpin:'ornament',swiftBoots:'ornament',
};
/** 보물의 형태(따로 적지 않은 방어구는 갑옷, 무기는 검, 보조구는 기물). */
export function formOf(id:string):TreasureForm{
  const f=FORM_OF[id];if(f)return f;
  const slot=treasureInfo(id).slot;return slot==='armor'?'armor':slot==='weapon'?'sword':'relicItem';
}
export const formName=(f:TreasureForm)=>FORMS.find(x=>x.id===f)!.name;

/** 등급: 1 일반 · 2 희귀 · 3 영웅 · 4 전설. */
export const GRADES:Array<{grade:number;name:string}>=[{grade:4,name:'전설'},{grade:3,name:'영웅'},{grade:2,name:'희귀'},{grade:1,name:'일반'}];
export const gradeName=(g:number)=>GRADES.find(x=>x.grade===g)?.name??'일반';

/** 회차 보물의 등급. */
export const RELIC_GRADE:Record<string,number>={whetstone:1,lamellar:1,drum:1,herbs:1,warhorse:2,banner:2,quiver:2,sunzi:3,xiaoheLedger:3,yuJade:3,bawangJi:4,huangshi:4};
/** 회차 보물 가운데 같은 물건이 그림 판에 있는 것(판의 장착 보물 id). */
const RELIC_ATLAS:Record<string,string>={drum:'warDrum',sunzi:'sunzi'};

/** 낱장 그림이 있는 보물·회차 보물 id(public/treasures/<id>.webp). */
export const TREASURE_ART:ReadonlySet<string>=new Set<string>([]);

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const EDGES=[0,150,306,458,610,764,919,1072,1228,1387,1619];
function atlasIcon(i:number){const row=Math.floor(i/6),top=EDGES[row]!,height=EDGES[row+1]!-top;return `<i class="treasure-icon" style="background-size:600% ${1619/height*100}%;background-position:${i%6/5*100}% ${top/(1619-height)*100}%"></i>`;}
const sheetIcon=(key:string)=>`<i class="treasure-icon sheet" style="background-image:url(treasures/${encodeURIComponent(key)}.webp)"></i>`;
const pendingIcon=(glyph:string,grade:number,label:string)=>`<i class="treasure-icon pending g${grade}" title="${esc(label)} · 그림 준비 중">${esc(glyph)}</i>`;

/** 장착 보물의 그림. */
export function treasureIcon(id:string){
  if(TREASURE_ART.has(id))return sheetIcon(id);
  const info=treasureInfo(id);if(info.icon>=0)return atlasIcon(info.icon);
  return pendingIcon(formName(formOf(id)).slice(0,1),info.grade,formName(formOf(id)));
}
/** 회차 보물의 그림. */
export function relicIcon(id:string,name:string){
  const key='relic-'+id;if(TREASURE_ART.has(key))return sheetIcon(key);
  const same=RELIC_ATLAS[id];if(same)return treasureIcon(same);
  return pendingIcon(name.slice(0,1),RELIC_GRADE[id]??1,'회차 보물');
}
