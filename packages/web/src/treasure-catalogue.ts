import type {Treasure,GearSlot} from './progression.ts';
// Four discoveries per side story. Stable IDs preserve equipment saves.
const entries:Array<[string,string,GearSlot,number,number,string]>=[
 ['doubleSwords','쌍고검','weapon',3,1,'Q01'],['ancientBlade','고정도','weapon',3,4,'Q01'],['leatherArmor','피갑','armor',1,15,'Q01'],['warDrum','진군고','accessory',1,14,'Q01'],
 ['ironSpear','철척사모','weapon',2,9,'Q02'],['flyingBlade','비도','weapon',2,7,'Q02'],['chainArmor','쇄자갑','armor',2,0,'Q02'],['militarySeal','장군인','accessory',2,14,'Q02'],
 ['phoenixSpear','봉취도','weapon',3,9,'Q03'],['crescentBlade','월아극','weapon',3,10,'Q03'],['scaleArmor','어린갑','armor',2,15,'Q03'],['swiftSaddle','비운안','accessory',2,5,'Q03'],
 ['ironBow','철태궁','weapon',3,11,'Q04'],['repeatingCrossbow','원융노','weapon',3,11,'Q04'],['rattanArmor','등갑','armor',3,15,'Q04'],['sunzi','손자병법','accessory',3,6,'Q04'],
 ['threePointBlade','삼첨도','weapon',3,8,'Q05'],['steelWhip','강편','weapon',2,9,'Q05'],['brightArmor','명광개','armor',3,0,'Q05'],['sixTeachings','육도','accessory',3,3,'Q05'],
 ['longbow','양유궁','weapon',3,11,'Q06'],['ironAxe','개산부','weapon',2,10,'Q06'],['blackArmor','현철갑','armor',3,15,'Q06'],['threeStrategies','삼략','accessory',3,2,'Q06'],
 ['dragonSpear','용담창','weapon',4,9,'Q07'],['twinHalberds','쌍철극','weapon',3,10,'Q07'],['tigerArmor','호위갑','armor',3,0,'Q07'],['shadowHorse','절영','accessory',4,12,'Q07'],
 ['goldHammer','유금추','weapon',3,10,'Q08'],['moonSword','월광검','weapon',3,7,'Q08'],['craneRobe','학창의','armor',3,0,'Q08'],['yellowHorse','조황비전','accessory',4,5,'Q08'],
 ['jadeSword','백옥검','weapon',4,1,'Q09'],['tigerSpear','호두창','weapon',3,9,'Q09'],['cloudRobe','운금포','armor',3,0,'Q09'],['qingshu','청낭서','accessory',4,3,'Q09'],
 ['sevenStarFlag','칠성기','accessory',4,13,'Q10'],['formationScroll','팔진도','accessory',4,2,'Q10'],['dragonArmor','용린갑','armor',4,15,'Q10'],['goldArmor','황금갑','armor',4,0,'Q10'],
 ['springAutumn','춘추좌씨전','accessory',4,6,'Q11'],['jadePendant','백옥환','accessory',3,14,'Q11'],['tigerTally','호부','accessory',4,14,'Q11'],['strategistRobe','군사포','armor',4,0,'Q11'],
];
export const extraTreasures:Treasure[]=entries.map(([id,name,slot,grade,icon,quest],i)=>{
 const bonus:Treasure['bonus']=slot==='weapon'?{attack:2+grade, ...(i%2?{agility:2}:{maxHp:4})}:slot==='armor'?{defense:grade+1,maxHp:grade*3}:i%3===0?{maxMp:grade*2,intellect:grade}:i%3===1?{spirit:grade+1,agility:grade}:{maxHp:grade*3,agility:grade};
 const names:Record<string,string>={attack:'공격',defense:'방어',maxHp:'최대 체력',maxMp:'최대 MP',intellect:'지력',spirit:'정신',agility:'민첩'};
 return {id,name,slot,grade,icon,quest,stage:quest,glyph:slot==='weapon'?'무':slot==='armor'?'갑':'보',bonus,effect:Object.entries(bonus).map(([k,v])=>names[k]+' +'+v).join(' · '),description:['흩어진 병장기를 되찾아 장인의 손에서 되살린 보물.','험한 길을 함께 넘은 이들이 신뢰의 증표로 건넨 보물.','전란 속에서 지켜 낸 기록과 기술이 담긴 보물.'][i%3]!};
});

/**
 * 연무장(훈련) 첫 승리에 얻는 새 형태의 보물: 방패·투구·암기·거울·호로·비녀·신발·영패 등.
 * 그림 판(treasures-v2.png) 밖이라 그림은 public/treasures/<id>.webp 낱장을 쓴다(treasure-art.ts).
 */
const trainingEntries:Array<[string,string,GearSlot,number,string,Treasure['bonus'],string]>=[
 ['rattanShield','등패','armor',1,'T01',{defense:2,maxHp:4},'등나무를 엮어 만든 가벼운 방패. 화살을 튕겨 내는 데 쓴다.'],
 ['hujia','호가','accessory',1,'T01',{spirit:2,maxMp:2},'북방에서 전해진 갈대 피리. 진중의 밤을 달랜다.'],
 ['meteorHammer','유성추','weapon',2,'T02',{attack:4,agility:2},'쇠사슬 끝에 쇠망치를 단 암기. 갑옷 위로 내리친다.'],
 ['phoenixHelm','봉시투구','armor',2,'T02',{defense:3,maxHp:6},'봉황의 깃을 꽂은 장수의 투구.'],
 ['hookSpear','구겸창','weapon',3,'T03',{attack:5,maxHp:4},'갈고리 낫을 단 창. 말의 다리를 걸어 기병을 넘어뜨린다.'],
 ['baguaMirror','팔괘경','accessory',3,'T03',{spirit:4,intellect:2},'뒷면에 팔괘를 새긴 청동 거울. 요사스러운 술수를 되비춘다.'],
 ['purpleGourd','자금호로','accessory',3,'T07',{maxMp:6,maxHp:6},'붉은 금빛 호리병. 도사가 단약을 담아 다녔다.'],
 ['bearCloak','흑웅피 망토','armor',2,'T07',{defense:2,maxHp:9},'검은 곰 가죽으로 지은 망토. 강바람과 칼끝을 함께 막는다.'],
 ['phoenixHairpin','봉황비녀','accessory',3,'T04',{agility:3,spirit:2},'봉황을 새긴 금비녀. 지닌 이를 날래게 한다는 말이 있다.'],
 ['swiftBoots','신행화','accessory',3,'T04',{agility:4,maxHp:3},'먼 길을 하루에 간다는 신행태보의 가죽신.'],
 ['zhanmaDao','참마도','weapon',4,'T05',{attack:6,maxHp:6},'말과 사람을 한 번에 벤다는 긴 자루의 큰 칼.'],
 ['tigerShield','호두패','armor',4,'T05',{defense:5,maxHp:10},'범의 머리를 새긴 큰 방패. 정면 교전에서 무너지지 않는다.'],
 ['lionHelm','사자투구','armor',4,'T06',{defense:4,maxHp:12},'금빛 사자 머리 투구. 장수의 위용을 드러낸다.'],
 ['tortoiseToken','현무영패','accessory',4,'T06',{defense:2,spirit:4},'북방 현무를 새긴 영패. 진을 지키는 장수에게 내린다.'],
];
const STAT_KO:Record<string,string>={attack:'공격',defense:'방어',maxHp:'최대 체력',maxMp:'최대 MP',intellect:'지력',spirit:'정신',agility:'민첩'};
export const trainingTreasures:Treasure[]=trainingEntries.map(([id,name,slot,grade,quest,bonus,description])=>({id,name,slot,grade,quest,stage:quest,glyph:name.slice(0,1),bonus,description,
 effect:Object.entries(bonus).map(([k,v])=>STAT_KO[k]+' +'+v).join(' · ')}));
