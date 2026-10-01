import {extraTreasures} from './treasure-catalogue.ts';
import type {Difficulty,Unit} from '../../core/src/index.ts';

export const OFFICERS=['sima_yi','sima_lang','sima_fang','cao_zhen'] as const;
export interface Campaign {version:1; xp:Record<string,number>; rewards:string[]; treasures:string[]; equipped:Record<string,string>;loadouts?:Record<string,Partial<Record<GearSlot,string>>>;completedRuns?:string[];trainingWins?:number;quests?:string[]}
export interface Growth {storyWins:number;trainingWins:number;questWins:number}
export interface Deployment {levels:Record<string,number>;equipped:Record<string,string>;loadouts?:Record<string,Partial<Record<GearSlot,string>>>;growth?:Growth;mission?:{id:string;runId:string}}
export type GearSlot="weapon"|"armor"|"accessory";
export interface Treasure {id:string;name:string;stage:string;glyph:string;effect:string;description:string;bonus:Partial<Unit['stats']>;slot?:GearSlot;grade?:number;icon?:number;quest?:string}
export const treasures:Treasure[]=[
  {id:'silverarmor',name:'백은갑',stage:'S1-07',glyph:'甲',effect:'방어 +4 · 최대 체력 +8',description:'연의 속 장수들의 갑주 묘사에서 착안한 창작 보상. 사마의의 실제 소유 이력을 뜻하지 않습니다.',bonus:{defense:4,maxHp:8}},
  {id:'yitian',name:'의천검',stage:'S1-06',glyph:'劍',effect:'공격 +5 · 최대 체력 +8',description:'연의 속 조조의 명검에서 착안한 모사품. 입수 사건과 능력치는 게임 창작입니다.',bonus:{attack:5,maxHp:8}},
  {id:'dunjia',name:'둔갑천서',stage:'S1-05',glyph:'遁',effect:'민첩 +4 · 최대 체력 +8',description:'연의의 도술 서책을 모티브로 만든 창작 필사본. 수송대가 지켜 낸 물자로 입수하며 실제 소유 이력을 뜻하지 않습니다.',bonus:{agility:4,maxHp:8}},
  {id:'taiping',name:'태평청령서',stage:'S1-01',glyph:'書',effect:'최대 체력 +12',description:'연의의 태평청령서를 모티브로 한 잔권. 입수 사건과 효과는 게임 창작입니다.',bonus:{maxHp:12}},
  {id:'sevenstar',name:'칠성보도',stage:'S1-02',glyph:'刀',effect:'공격 +4',description:'조조의 동탁 암살 일화에서 착안한 모사품. 원본의 소유 이력을 바꾸지 않습니다.',bonus:{attack:4}},
  {id:'dilu',name:'적로',stage:'S1-03',glyph:'馬',effect:'이동 +1',description:'유비와 적로의 탈출 일화에서 착안한 게임 창작 장구입니다.',bonus:{movement:1}},
  {id:'mengde',name:'맹덕신서',stage:'S1-04',glyph:'策',effect:'최대 MP +10 · 지력 +3',description:'연의 속 조조의 병서를 모티브로 한 필사본. 꿈에서 얻은 깨달음을 보상으로 표현합니다.',bonus:{maxMp:10,intellect:3}},
  {id:'qinggang',name:'청강검',stage:'S1-08',glyph:'劍',effect:'공격 +7 · 방어 +2',description:'조운이 얻은 청강검의 일화에서 착안한 모사품. 사마의의 실제 소유물이라는 뜻은 아닙니다.',bonus:{attack:7,defense:2}},
];
const extraItems=[
 ['greenDragon','청룡언월도','S1-06','攻','공격 +8',{attack:8},'관우의 청룡언월도'],
 ['serpentSpear','장팔사모','S1-03','槍','공격 +5 · 민첩 +2',{attack:5,agility:2},'장비의 장팔사모'],
 ['halberd','방천화극','S1-04','戟','공격 +7',{attack:7},'여포의 방천화극'],
 ['bow','보조궁','S1-02','弓','공격 +3 · 민첩 +3',{attack:3,agility:3},'연의 장수들의 활'],
 ['redHare','적토마','S1-08','馬','이동 +1 · 민첩 +5',{movement:1,agility:5},'관우와 적토마'],
 ['fan','백우선','S1-05','扇','지력 +5 · 최대 MP +5',{intellect:5,maxMp:5},'제갈량의 깃털 부채'],
 ['seal','전국옥새','S1-07','璽','정신 +5 · 최대 체력 +10',{spirit:5,maxHp:10},'전국옥새를 둘러싼 연의의 다툼'],
 ['ironArmor','철제 갑주','S1-01','甲','방어 +2',{defense:2},'연의의 장수 갑주'],
] as const;
for(const [id,name,stage,glyph,effect,bonus,motif] of extraItems)treasures.push({id,name,stage,glyph,effect,bonus,description:motif+'에서 착안한 재현품. 입수·등급·효과는 게임 창작입니다.'});
for(const t of treasures){t.name=t.name.replace(/ (모사품|재현품|필사본|잔권|모조품)/g,'').replace('적로','적로').replace('적토마','적토마');t.description=t.name+'에 얽힌 인연을 이어받은 보물. '+t.effect+'.';}
treasures.push(...extraTreasures);
export const gearNames:Record<GearSlot,string>={weapon:'무기',armor:'방어구',accessory:'보조구'};
export function treasureInfo(id:string){const i=treasures.findIndex(t=>t.id===id),item=treasures[i];const slot:GearSlot=['silverarmor','ironArmor'].includes(id)?'armor':['dunjia','taiping','dilu','mengde','redHare','fan','seal'].includes(id)?'accessory':'weapon';const grade=['ironArmor','taiping'].includes(id)?1:['sevenstar','bow','dilu'].includes(id)?2:['yitian','qinggang','greenDragon','halberd','seal','redHare'].includes(id)?4:3;return {slot:item?.slot??slot,grade:item?.grade??grade,rarity:['일반','희귀','영웅','전설'][(item?.grade??grade)-1]!,icon:item?.icon??Math.max(0,i)};}
export function equippedItems(c:Pick<Campaign,'equipped'|'loadouts'>,id:string){return c.loadouts?.[id]?Object.values(c.loadouts[id]!):c.equipped[id]?[c.equipped[id]!]:[];}
export function equipSlot(c:Campaign,officer:string,slot:GearSlot,id:string){
 if(!OFFICERS.includes(officer as typeof OFFICERS[number])||!Object.hasOwn(gearNames,slot))return false;
 if(id&&(!c.treasures.includes(id)||treasureInfo(id).slot!==slot))return false;
 if(!c.loadouts){c.loadouts={};for(const [who,item] of Object.entries(c.equipped))c.loadouts[who]={[treasureInfo(item).slot]:item};}
 for(const gear of Object.values(c.loadouts))for(const key of Object.keys(gear) as GearSlot[])if(gear[key]===id&&id)delete gear[key];
 const gear=c.loadouts[officer]??={};if(id)gear[slot]=id;else delete gear[slot];return true;
}
export function freshCampaign():Campaign{return {version:1,xp:{sima_yi:0,sima_lang:100,sima_fang:350,cao_zhen:250},rewards:[],treasures:[],equipped:{}};}
export function levelInfo(total:number){
  let level=1,remaining=Math.max(0,Math.floor(total));
  while(level<40&&remaining>=100+(level-1)*20){remaining-=100+(level-1)*20;level++;}
  return {level,xp:remaining,next:level===40?0:100+(level-1)*20};
}
export function deployment(c:Campaign,modern=false):Deployment{return {...(modern?{growth:{storyWins:new Set(c.rewards.filter(r=>r.endsWith(':normal')).map(r=>r.split(':')[0])).size,trainingWins:c.trainingWins??0,questWins:c.quests?.length??0}}:{}),levels:Object.fromEntries(OFFICERS.map(id=>[id,levelInfo(c.xp[id]??0).level])),equipped:{...c.equipped},...(c.loadouts?{loadouts:structuredClone(c.loadouts)}:{})};}
export function award(c:Campaign,stage:string,difficulty:Difficulty,participants:string[],seals:number[]){
  const id=stage+':'+difficulty;if(c.rewards.includes(id)||!seals.includes(1))return {xp:0,treasure:null as Treasure|null,levels:[] as string[]};
  const amount=difficulty==='normal'?140:70,levels:string[]=[];c.rewards.push(id);
  for(const officer of OFFICERS){if(officer!=='sima_yi'&&!participants.includes(officer))continue;const before=levelInfo(c.xp[officer]??0).level;c.xp[officer]=(c.xp[officer]??0)+amount;if(levelInfo(c.xp[officer]!).level>before)levels.push(officer);}
  const treasure=treasures.find(t=>t.stage===stage&&!c.treasures.includes(t.id))??null;
  for(const item of treasures.filter(t=>t.stage===stage))if(!c.treasures.includes(item.id))c.treasures.push(item.id);
  return {xp:amount,treasure,levels};
}
export function equip(c:Campaign,officer:string,id:string){
  if(!OFFICERS.includes(officer as typeof OFFICERS[number]))return false;
  if(!id){delete c.equipped[officer];return true;}
  if(!c.treasures.includes(id)||!treasures.some(t=>t.id===id))return false;
  for(const [other,item] of Object.entries(c.equipped))if(item===id)delete c.equipped[other];
  c.equipped[officer]=id;return true;
}
export function applyTreasure(unit:Unit,id:string|undefined){
  const item=treasures.find(t=>t.id===id);if(!item)return;
  for(const [stat,value] of Object.entries(item.bonus))unit.stats[stat as keyof Unit['stats']]+=value;
  unit.hp=unit.stats.maxHp;unit.mp=unit.stats.maxMp;
}
export function readCampaign():Campaign{
  try{const value=JSON.parse(localStorage.getItem('sama-campaign-v1')??'null') as Campaign;
    if(value?.version!==1||!value.xp||!Array.isArray(value.rewards)||!Array.isArray(value.treasures)||!value.equipped)return freshCampaign();
    if(Object.values(value.xp).some(n=>!Number.isFinite(n)||n<0)||value.rewards.some(n=>typeof n!=='string'))return freshCampaign();
    const clean=freshCampaign();for(const id of OFFICERS)clean.xp[id]=Math.min(100000,Math.floor(value.xp[id]??clean.xp[id]!));
    clean.rewards=[...new Set(value.rewards.filter(id=>/^S[123]-\d{2}:(normal|extreme)$/.test(id)))];clean.treasures=[...new Set(value.treasures.filter(id=>treasures.some(t=>t.id===id)))];
    clean.completedRuns=Array.isArray(value.completedRuns)?[...new Set(value.completedRuns.filter(x=>typeof x==='string'&&x.length<100))]:[];clean.trainingWins=Number.isSafeInteger(value.trainingWins)?Math.max(0,value.trainingWins!):0;clean.quests=Array.isArray(value.quests)?[...new Set(value.quests.filter(x=>typeof x==='string'&&/^Q\d{2}$/.test(x)))]:[];
    for(const item of treasures)if(!item.quest&&clean.rewards.some(r=>r.startsWith(item.stage+':'))&&!clean.treasures.includes(item.id))clean.treasures.push(item.id);
    for(const id of OFFICERS)if(typeof value.equipped[id]==='string')equip(clean,id,value.equipped[id]!);
    if(value.loadouts&&typeof value.loadouts==='object')for(const id of OFFICERS){const gear=value.loadouts[id];if(!gear||typeof gear!=='object')continue;for(const slot of Object.keys(gearNames) as GearSlot[])equipSlot(clean,id,slot,typeof gear[slot]==='string'?gear[slot]!:'');}
    return clean;
  }catch{return freshCampaign();}
}
export function writeCampaign(c:Campaign){localStorage.setItem('sama-campaign-v1',JSON.stringify(c));}
