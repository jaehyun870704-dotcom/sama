/**
 * 장비의 그림 · 종류 이름 · 등급 이름.
 *
 * 그림은 이미 있는 그림판의 칸을 쓴다(그림 안에 글자는 없다).
 *  · 그림 판 treasures-v2.webp(6×10): 칸 번호는 ATLAS_CELLS 순서(예전 보물 순서 그대로 — 바꾸지 않는다).
 *  · 추가 그림판 treasures-extra-01~06-v1.webp · treasures-unique-01~03-v1.webp · treasures-legend-01~02-v1.webp(3×4).
 * 고유 보물 50점은 모두 자기 그림이 있다. 지운 보물의 칸은 같은 생김새의 상점 장비 그림으로 다시 쓴다.
 * 그림이 없는 상점 장비는 종류 글자를 담은 등급 테두리 패로 그린다.
 */
import {treasureInfo,type GearSlot} from './progression.ts';
import {GEAR_KINDS,SHOP_KINDS,gearDef,gearBaseId,type GearKind} from '../../core/src/index.ts';

/** 종류 필터에 쓰는 종류 목록(고유 보물만의 종류 포함). */
export type TreasureForm=GearKind;
export const FORMS:Array<{id:GearKind;name:string;slot:GearSlot}>=(Object.keys(GEAR_KINDS) as GearKind[]).map(id=>({id,name:GEAR_KINDS[id].name,slot:GEAR_KINDS[id].slot}));
/** 장비의 종류. */
export function formOf(id:string):GearKind{return gearDef(id)?.kind??'sword';}
export const formName=(f:GearKind)=>GEAR_KINDS[f]?.name??'';
export {SHOP_KINDS};

/** 등급: 1 일반 · 2 희귀 · 3 영웅 · 4 전설. */
export const GRADES:Array<{grade:number;name:string}>=[{grade:4,name:'전설'},{grade:3,name:'영웅'},{grade:2,name:'희귀'},{grade:1,name:'일반'}];
export const gradeName=(g:number)=>GRADES.find(x=>x.grade===g)?.name??'일반';

/** 회차 보물의 등급. */
export const RELIC_GRADE:Record<string,number>={whetstone:1,lamellar:1,drum:1,herbs:1,warhorse:2,banner:2,quiver:2,sunzi:3,xiaoheLedger:3,yuJade:3,bawangJi:4,huangshi:4};

/** 그림 판 treasures-v2.webp의 칸 이름(왼쪽 위부터 가로 6칸씩). 칸 이름은 그 칸에 그려진 물건이다. */
export const ATLAS_CELLS:readonly string[]=['silverarmor','yitian','dunjia','taiping','sevenstar','dilu','mengde','qinggang','greenDragon','serpentSpear','halberd','bow','redHare','fan','seal','ironArmor','doubleSwords','ancientBlade','leatherArmor','warDrum','ironSpear','flyingBlade','chainArmor','militarySeal','phoenixSpear','crescentBlade','scaleArmor','swiftSaddle','ironBow','repeatingCrossbow','rattanArmor','sunzi','threePointBlade','steelWhip','brightArmor','sixTeachings','longbow','ironAxe','blackArmor','threeStrategies','dragonSpear','twinHalberds','tigerArmor','shadowHorse','goldHammer','moonSword','craneRobe','yellowHorse','jadeSword','tigerSpear','cloudRobe','qingshu','sevenStarFlag','formationScroll','dragonArmor','goldArmor','springAutumn','jadePendant','tigerTally','strategistRobe'];
/** 추가 그림판(3×4)의 칸 이름. 각 배열은 한 장의 왼쪽 위부터 가로 3칸씩 읽는 순서. */
export const EXTRA_TREASURE_SHEETS=[
  ['rattanShield','hujia','meteorHammer','phoenixHelm','hookSpear','baguaMirror','purpleGourd','bearCloak','phoenixHairpin','swiftBoots','zhanmaDao','tigerShield'],
  ['lionHelm','tortoiseToken','bronzeSword','hornBowSmall','hideShield','strawCape','copperBell','travelPouch','ringBlade','ironRod','lamellarVest','wolfHelm'],
  ['bambooSlips','ponyBridle','snakeBlade','armorPiercer','boltQuiver','mountainArmor','fireproofRobe','beaconToken','wuhuanBow','cavalrySaber','feltArmor','horseBarding'],
  ['eagleFeather','nomadSteed','poisonDarts','tuskSpear','rattanHelm','shuBrocade','bronzeDrum','spiritBead','initiateBadge','sharpSpearhead','riverShield','summitBanner'],
  ['gatekeeperHalberd','gatekeeperArmor','courtSeal','cliffSandals','fordHorse','hundredPaceBow','peerlessSword','overlordArmor','relic-whetstone','relic-lamellar','relic-warhorse','relic-banner'],
  ['relic-herbs','relic-quiver','relic-xiaoheLedger','relic-yuJade','relic-bawangJi','relic-huangshi'],
] as const;
export const UNIQUE_TREASURE_SHEETS=[
  ['zhansheSword','baipiDao','guoxiaMa','liangzhouMa','baihu','fourWheelCart','simaFa','weiLiaozi','shiji','hanfeizi','guanzi','shangjunshu'],
  ['yanziChunqiu','yinfu','siminYueling','yantielun','laozi','zhuangzi','lunyu','shijing','shujing','yijing','liji','taipingYaoshu'],
  ['shanhaijing','xishuMap'],
] as const;
export const LEGEND_TREASURE_SHEETS=[
  ['ironHelm','beanBag','twinWhips','plantainFan','mirrorArmor','dragonGi','silverShield','lubuBow','linkedArmor','windGodShield','noFeatherDart','goldFireCannon'],
  ['fiveFireFan','sageSword','darkRobe','phoenixRobe','windWheel','zhugeTurban','azureJewel','vermilionJewel','blackTortoiseJewel','whiteTigerJewel'],
] as const;
/**
 * 상점 장비 그림판(shop-items/shop-items-01·02-v1.webp, 3×4, 2026-10-13 납품). 그림을 보고 게임 등급 이름에 맞춘 칸 이름이다.
 * 장갑 첫 칸은 가죽 장갑이라 2등급(가죽장갑)에, 놋쇠 장갑 칸은 맞는 등급이 없어 쓰지 않는다(무명장갑은 글자 패).
 * 02판 뒤 다섯 칸(소모품)은 그림이 물건과 맞지 않아 쓰지 않는다(null).
 */
export const SHOP_ITEM_SHEETS=[
  ['shop-catapult-1','shop-catapult-2','shop-catapult-3','shop-catapult-4','shop-fan-1','shop-fan-2','shop-fan-3','shop-fan-4','shop-gloves-2',null,'shop-gloves-3','shop-gloves-4'],
  ['shop-hood-1','shop-hood-2','shop-hood-3','shop-hood-4','shop-sacredSword-1','shop-barding-2','shop-barding-3',null,null,null,null,null],
] as const;
type Cell={file:string;cell:number};
const CELLS=new Map<string,Cell>([
  ...EXTRA_TREASURE_SHEETS.flatMap((items,sheet)=>items.map((id,cell)=>[id,{file:`treasures-extra-${String(sheet+1).padStart(2,'0')}-v1.webp`,cell}] as const)),
  ...UNIQUE_TREASURE_SHEETS.flatMap((items,sheet)=>items.map((id,cell)=>[id,{file:`treasures-unique-${String(sheet+1).padStart(2,'0')}-v1.webp`,cell}] as const)),
  ...LEGEND_TREASURE_SHEETS.flatMap((items,sheet)=>items.map((id,cell)=>[id,{file:`treasures-legend-${String(sheet+1).padStart(2,'0')}-v1.webp`,cell}] as const)),
  ...SHOP_ITEM_SHEETS.flatMap((items,sheet)=>items.flatMap((id,cell)=>id?[[id,{file:`shop-items/shop-items-${String(sheet+1).padStart(2,'0')}-v1.webp`,cell}] as const]:[])),
]);
/**
 * 상점 장비 종류 × 등급 → 다시 쓰는 그림 칸(지운 보물이 그려진 칸). 없으면 글자 패.
 * 칼·창·활·곤봉·갑옷·옷·방패·투구는 생김새가 같은 칸이 있어 그림을 쓴다.
 */
export const SHOP_ART:Readonly<Partial<Record<GearKind,readonly [string|null,string|null,string|null,string|null]>>>={
  sword:['bronzeSword','moonSword','snakeBlade','peerlessSword'],
  spear:['ironSpear','tigerSpear','dragonSpear','tuskSpear'],
  bow:['bow','longbow','ironBow','hundredPaceBow'],
  club:['ironRod','steelWhip','goldHammer','armorPiercer'],
  sacredSword:['shop-sacredSword-1','baipiDao','jadeSword','zhansheSword'],
  armor:['leatherArmor','chainArmor','blackArmor','brightArmor'],
  robe:['strawCape','bearCloak','cloudRobe','strategistRobe'],
  shield:['hideShield','rattanShield','riverShield','tigerShield'],
  helmet:['wolfHelm','phoenixHelm','rattanHelm','lionHelm'],
  barding:['swiftSaddle','shop-barding-2','shop-barding-3','horseBarding'],
  catapult:['shop-catapult-1','shop-catapult-2','shop-catapult-3','shop-catapult-4'],
  fan:['shop-fan-1','shop-fan-2','shop-fan-3','shop-fan-4'],
  gloves:[null,'shop-gloves-2','shop-gloves-3','shop-gloves-4'],
  hood:['shop-hood-1','shop-hood-2','shop-hood-3','shop-hood-4'],
};
/** 장비 id(고유 보물 또는 상점 장비)가 쓰는 그림 칸 이름. 없으면 undefined. */
export function artKey(id:string):string|undefined{
  const d=gearDef(id);if(!d)return undefined;
  if(d.named)return d.id;
  return SHOP_ART[d.kind]?.[d.grade-1]??undefined;
}
/** 실제 그림이 있는 칸 이름(그림 판 + 추가 그림판). */
export const TREASURE_ART:ReadonlySet<string>=new Set([...ATLAS_CELLS,...CELLS.keys()]);

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const EDGES=[0,150,306,458,610,764,919,1072,1228,1387,1619];
function atlasIcon(i:number){const row=Math.floor(i/6),top=EDGES[row]!,height=EDGES[row+1]!-top;return `<i class="treasure-icon" style="background-size:600% ${1619/height*100}%;background-position:${i%6/5*100}% ${top/(1619-height)*100}%"></i>`;}
const sheetIcon=(c:Cell)=>{const col=c.cell%3,row=Math.floor(c.cell/3);return `<i class="treasure-icon sheet" style="background-image:url(${c.file});background-size:300% 400%;background-position:${col*50}% ${row*100/3}%;background-repeat:no-repeat"></i>`;};
const pendingIcon=(glyph:string,grade:number,label:string)=>`<i class="treasure-icon pending g${grade}" title="${esc(label)}">${esc(glyph)}</i>`;
function cellIcon(key:string){const c=CELLS.get(key);if(c)return sheetIcon(c);const k=ATLAS_CELLS.indexOf(key);return k>=0?atlasIcon(k):'';}

/** 장비의 그림(고유 보물은 자기 그림, 상점 장비는 다시 쓰는 칸 또는 종류 글자 패). */
export function treasureIcon(id:string):string{
  const key=artKey(id),icon=key?cellIcon(key):'';if(icon)return icon;
  const info=treasureInfo(id),kind=gearDef(gearBaseId(id))?.kind??'sword';
  return pendingIcon(formName(kind).slice(0,1),info.grade,formName(kind));
}
/** 회차 보물 가운데 같은 물건이 그림 판에 있는 것(그림 판의 칸 이름). */
const RELIC_ATLAS:Record<string,string>={drum:'warDrum',sunzi:'sunzi'};
/** 회차 보물의 그림. */
export function relicIcon(id:string,name:string){
  const key='relic-'+id;if(CELLS.has(key))return cellIcon(key);
  const same=RELIC_ATLAS[id];if(same)return cellIcon(same);
  return pendingIcon(name.slice(0,1),RELIC_GRADE[id]??1,'회차 보물');
}
