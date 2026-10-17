import type {StatusKind,StrategyElement,StrategyShape,Side} from '../../core/src/index.ts';
import type {LearnedStrategy,SupportEffect} from './officers.ts';

/**
 * 규칙판 12 책략 목록. 계열 구조(속성 단계 · 상승 · 감소 · 보급 · 흡수 · 보조 · 상태이상 · 사신)는
 * 고전 전술 SRPG의 일반 틀을 따르되, 이름·수치·습득 레벨은 이 게임의 것이다(레벨 상한 40에 맞춤).
 *
 * 속성 공격은 단계마다 같은 꼴이다: 약한 한 부대(싸고 사거리 4) → 강한 한 부대 → 십자 → 강한 십자 → 직선.
 * maxHit은 그 책략의 명중 상한(%)이다. 위력 100은 옛 화계 1단과 같은 기준.
 */
const ENEMY:readonly Side[]=['enemy'];
const FRIENDS:readonly Side[]=['player','ally','allyAi'];
type A=[id:string,name:string,level:number,element:StrategyElement,shape:StrategyShape,range:number,radius:number,mp:number,power:number,maxHit:number,inflicts?:StatusKind|StatusKind[],extra?:Partial<LearnedStrategy>];
const atk=([id,name,level,element,shape,range,radius,mpCost,power,maxHit,inflicts,extra]:A):LearnedStrategy=>({id,name,level,element,shape,range,radius,mpCost,power,maxHit,targetSides:ENEMY,...(inflicts?{inflicts:Array.isArray(inflicts)?inflicts:[inflicts]}:{}),...extra});
/** [id,이름,기준Lv,효과,모양,사거리,반경,MP,위력(회복량·MP량·지속 턴)] */
type S=[id:string,name:string,level:number,support:SupportEffect,shape:StrategyShape,range:number,radius:number,mp:number,power:number,extra?:Partial<LearnedStrategy>];
const sup=([id,name,level,support,shape,range,radius,mpCost,power,extra]:S):LearnedStrategy=>({id,name,level,support,element:'support',shape,range,radius,mpCost,power,targetSides:FRIENDS,...extra});

export const V12_ATTACKS:LearnedStrategy[]=[
  // 화계
  ['emberBolt','화염탄',1,'fire','single',4,0,7,100,100],
  ['searingFire','맹화',7,'fire','single',3,0,13,135,90],
  ['flameWheel','화륜',10,'fire','cross',4,1,16,75,80,'burn'],
  ['flameDragonX','염룡',22,'fire','cross',3,1,26,105,90,'burn'],
  ['flameLance','화창',30,'fire','line',2,2,32,140,75,'burn'],
  // 수계
  ['riptide','물살',1,'water','single',4,0,7,100,100],
  ['torrentX','격랑',8,'water','single',3,0,13,135,90],
  ['whirlpool','소용돌이',12,'water','cross',4,1,16,75,80],
  ['seaDragon','해룡',18,'water','cross',3,1,26,105,90],
  ['downpour','장대비',38,'water','line',2,2,30,120,85,'slow'],
  ['tidalCrash','노도',10,'water','single',2,0,28,230,40,'immobile'],
  // 지계
  ['stoneThrow','투석',1,'earth','single',4,0,7,100,100],
  ['caveIn','낙반',8,'earth','single',3,0,13,135,90],
  ['groundQuake','땅울림',14,'earth','cross',4,1,16,75,80,'slow'],
  ['landslide','산사태',26,'earth','cross',3,1,26,105,100],
  ['boulderX','거석',16,'earth','single',2,0,24,175,95],
  ['rockStorm','암붕',17,'earth','spread',3,1,32,95,95],
  // 풍계
  ['whirl','회오리',1,'wind','single',4,0,7,75,100],
  ['galeBlast','질풍',16,'wind','single',4,0,13,100,90],
  ['windWall','풍벽',8,'wind','spread',4,1,16,60,90],
  ['windGod','풍신',16,'wind','spread',4,1,26,75,100],
  ['greatStorm','대폭풍',29,'wind','global',99,0,50,30,90],
  ['searWind','열풍참',39,'wind','line',2,2,30,130,90,'weaken'],
  // 뇌계 · 특수 공격
  ['chainBolt','연쇄뇌',32,'thunder','cross',3,1,30,95,85,'shock'],
  ['fireArrows','화전',34,'fire','single',3,0,30,60,85,['burn','breach'],{ignoreSpirit:true}],
  // 흡수
  ['lifeDrain','흡기',4,'support','single',3,0,12,70,70,undefined,{drain:'hp'}],
  ['manaDrain','탈기',20,'support','single',3,0,5,48,90,undefined,{drain:'mp'}],
  // 감소(피해는 작고 상태를 건다)
  ['hinder','지체',2,'support','cross',4,1,8,20,85,'sluggish'],
  ['hinderField','지체진',16,'support','spread',3,1,20,20,80,'sluggish'],
  ['greatHinder','대지체',34,'support','cross',4,1,14,25,90,'sluggish',{statusTurns:3}],
  ['dismay','낙담',3,'support','cross',4,1,8,20,85,'dispirit'],
  ['dismayField','낙담진',15,'support','spread',3,1,20,20,80,'dispirit'],
  ['greatDismay','대낙담',35,'support','cross',4,1,14,25,90,'dispirit',{statusTurns:3}],
  ['suppress','억압',9,'support','single',4,0,8,25,85,'weaken'],
  ['suppressCross','억압진',12,'support','cross',3,1,20,20,80,'weaken'],
  ['greatSuppress','대억압',36,'support','single',4,0,14,30,90,'weaken',{statusTurns:3}],
  ['taunt','조롱',4,'support','single',4,0,8,25,85,'breach'],
  ['tauntCross','조롱진',26,'support','cross',3,1,14,20,80,'breach'],
  ['greatTaunt','대조롱',37,'support','single',4,0,14,30,90,'breach',{statusTurns:3}],
  ['subdue','무력화',16,'support','single',2,0,12,25,80,['weaken','breach','sluggish','dispirit']],
  ['snareStep','발목잡기',4,'earth','single',3,0,10,25,85,'slow'],
  // 상태이상
  ['venomDart','독침',1,'earth','single',4,0,10,40,70,'bleed'],
  ['venomCloud','독운',6,'earth','cross',3,1,22,35,50,'bleed'],
  ['venomFlood','독류',21,'earth','cross',3,1,32,50,60,'bleed'],
  ['venomSea','독해',29,'earth','spread',4,1,45,40,50,'bleed'],
  ['deadlyVenom','맹독',14,'earth','single',3,0,18,70,80,'bleed',{statusTurns:3}],
  ['venomSpear','독창',32,'earth','line',2,2,30,90,60,'bleed'],
  ['shackle','결박',4,'support','single',4,0,10,20,70,'immobile'],
  ['greatShackle','대결박',36,'support','cross',3,1,16,20,60,'immobile'],
  ['sealArts','봉인',12,'support','single',4,0,10,20,85,'seal'],
  ['deceive','허언',10,'support','single',4,0,10,25,70,'confusion'],
  ['rumorField','유언비어',27,'support','spread',3,1,24,20,50,'confusion'],
  ['mazeArray','미혹진',38,'support','spread',3,1,28,30,100,['confusion','immobile','seal','weaken','bleed'],{randomInflict:true}],
  // 사신(늦게 배우거나 사신보옥으로 쓴다)
  ['vermilionBlaze','주작의 불길',33,'fire','spread',4,1,60,140,100,'burn'],
  ['blackTortoiseHex','현무의 저주',33,'support','spread',4,1,60,30,100,['confusion','immobile','seal','weaken','breach'],{randomInflict:true}],
  ['azureStorm','청룡의 뇌우',33,'thunder','spread',3,1,60,150,90,'shock'],
].map(r=>atk(r as A));

/**
 * 사신 책략 넷: 사신보옥을 지닌 계통만 쓴다(청룡=기마책사계 · 주작=책사계 · 현무=도사계 · 백호=풍수사계).
 * 배워서 익히지 않는다(습득 레벨 99 · 단계 진화 없음). MP를 크게 쓴다.
 */
export const JEWEL_STRATEGY_DEFS:LearnedStrategy[]=[
  {id:'jewelAzure',name:'청룡',level:99,element:'thunder',shape:'spread',range:4,radius:2,mpCost:50,power:110,maxHit:95,strikes:5,inflicts:['shock'],targetSides:ENEMY},
  {id:'jewelVermilion',name:'주작',level:99,element:'fire',shape:'spread',range:4,radius:2,mpCost:55,power:150,maxHit:95,inflicts:['burn'],targetSides:ENEMY},
  {id:'jewelTortoise',name:'현무',level:99,element:'earth',shape:'global',range:99,radius:0,mpCost:50,power:0,mutate:true,targetSides:['enemy','player','ally','allyAi']},
  {id:'jewelTiger',name:'백호',level:99,support:'renew',element:'support',shape:'global',range:99,radius:0,mpCost:50,power:45,targetSides:FRIENDS},
];
export const V12_SUPPORTS:LearnedStrategy[]=[
  // 상승: 순발(경신) · 사기(격려) · 능력(분발) · 방어(방비) · 이동(급행) · 전부(위풍). 위력 = 지속 턴.
  ['swiftCross','경신령',2,'swift','cross',4,1,8,3],
  ['swiftField','경신진',20,'swift','spread',3,1,20,3],
  ['greatSwift','대경신',35,'swift','cross',4,1,14,5],
  ['cheer','격려',2,'spirited','cross',4,1,8,3],
  ['cheerField','함성진',16,'spirited','spread',3,1,20,3],
  ['greatCheer','대격려',34,'spirited','cross',4,1,14,5],
  ['focusSelf','집중',1,'rally','single',0,0,4,3],
  ['uplift','분발',7,'rally','single',4,0,8,3],
  ['upliftCross','고취',23,'rally','cross',3,1,20,3],
  ['greatUplift','대분발',37,'rally','single',4,0,14,5],
  ['ward','방비',5,'guard','single',4,0,8,3],
  ['wardCross','철진',21,'guard','cross',3,1,20,3],
  ['greatWard','대방비',36,'guard','single',4,0,14,5],
  ['hurry','급행',15,'haste','single',3,0,10,3],
  ['greatHurry','대급행',38,'haste','single',3,0,16,3,{boost:2}],
  ['poise','위풍',20,'empower','single',0,0,10,3],
  // 노래(무녀) · 호령(황태자)
  ['ironSong','철벽가',20,'guard','spread',3,1,40,3],
  ['calmSong','정심가',23,'spirited','spread',3,1,40,3],
  ['battleCall','분전령',24,'rally','spread',3,1,20,3],
  ['precisionCall','정밀령',28,'swift','spread',3,1,20,3],
  // 효기병 자세
  ['steadfast','견인',16,'guard','single',0,0,8,3],
  ['composure','평심',27,'spirited','single',0,0,8,3],
  // 보급: 위력 = 회복 기준치
  ['firstAid','소회복',1,'heal','single',4,0,7,25],
  ['treatment','회복',10,'heal','single',3,0,13,45],
  ['reliefCross','십자 회복',8,'heal','cross',4,1,16,25],
  ['reliefField','광역 회복',29,'heal','spread',3,1,26,45],
  ['remoteSupply','원격 회복',24,'heal','single',99,0,24,45],
  ['reliefMarch','원격 완치',37,'renew','single',99,0,50,35],
  ['whiteTigerGrace','백호 전군 완치',32,'renew','global',99,0,60,40],
  ['counsel','진언',10,'mana','single',3,0,30,30,{noSelf:true}],
  ['proposal','헌계',26,'mana','single',2,0,60,60,{noSelf:true}],
  ['grandProposal','대헌계',31,'mana','cross',2,1,75,75,{noSelf:true}],
  ['meditation','정좌',8,'meditate','single',0,0,0,20],
  // 보조
  ['clearMind','청심',1,'cleanse','single',4,0,10,0],
  ['greatClearMind','대청심',32,'cleanse','cross',3,1,18,0],
  ['regroup','재정비',28,'again','single',1,0,32,0],
  ['greatRegroup','대재정비',40,'again','single',3,0,40,0],
].map(r=>sup(r as S));

/** 검사 · 무도가 등 물리 계통의 공격력 기술(규칙판 12에서 검사는 셋을 차례로 배운다). */
export const V12_SKILLS:LearnedStrategy[]=([
  ['boneBreaker','쇄골참',6,'single',1,0,5,100,95,'bleed',{}],
  ['poisonBlade','독검',16,'single',2,0,6,50,100,'bleed',{sureHit:true}],
  ['skyRend','비천참',27,'single',1,0,8,160,90,undefined,{}],
] as const).map(([id,name,level,shape,range,radius,mpCost,power,maxHit,status,extra])=>({id,name,level,element:'physical' as const,physical:true,shape,range,radius,mpCost,power,maxHit,targetSides:ENEMY,...(status?{inflicts:[status as StatusKind]}:{}),...extra} as LearnedStrategy));

export const V12_STRATEGIES:LearnedStrategy[]=[...V12_ATTACKS,...V12_SUPPORTS,...V12_SKILLS];

/**
 * 계통마다 배우는 책략과 습득 레벨. 같은 책략이라도 계통마다 배우는 레벨이 다르다.
 * 물리 계통의 특수기(class-spells.ts LINEAGE_SKILL)는 그대로 함께 쓴다.
 */
export const V12_LINEAGE:Record<string,ReadonlyArray<readonly [string,number]>>={
  // 군주: 기본 회복과 네 속성을 고루, 끝에 위풍
  'four-stage-lord':[['firstAid',1],['whirl',2],['emberBolt',4],['stoneThrow',6],['riptide',8],['counsel',10],['suppressCross',12],['windWall',14],['flameWheel',16],['groundQuake',18],['whirlpool',20],['reliefCross',22],['poise',24]],
  // 책사: 불·물·땅의 단계 공격, 끝에 화전과 주작
  'four-stage-strategist':[['emberBolt',1],['riptide',2],['stoneThrow',3],['firstAid',6],['focusSelf',8],['flameWheel',10],['whirlpool',12],['groundQuake',14],['meditation',16],['searingFire',18],['caveIn',20],['torrentX',22],['flameDragonX',24],['landslide',26],['seaDragon',28],['flameLance',30],['boulderX',32],['vermilionBlaze',33],['fireArrows',34],['treatment',35]],
  // 풍수사: 회복·상승·재정비, 끝에 백호
  'four-stage-fengshui':[['firstAid',1],['cheer',2],['swiftCross',4],['ward',5],['uplift',7],['reliefCross',8],['treatment',10],['clearMind',12],['counsel',13],['hurry',15],['meditation',16],['cheerField',18],['swiftField',20],['wardCross',21],['upliftCross',23],['remoteSupply',24],['proposal',26],['regroup',28],['reliefField',29],['grandProposal',31],['whiteTigerGrace',32],['greatCheer',34],['greatSwift',35],['greatWard',36],['greatUplift',37],['greatHurry',38],['greatRegroup',40]],
  // 도사(바람·번개, 모든 속성의 단계 공격): 끝에 연쇄뇌·청룡
  'four-stage-taoist':[['whirl',1],['focusSelf',2],['emberBolt',4],['stoneThrow',5],['riptide',7],['windWall',8],['flameWheel',10],['groundQuake',12],['whirlpool',13],['meditation',15],['galeBlast',16],['searingFire',18],['caveIn',20],['torrentX',21],['windGod',23],['flameDragonX',24],['seaDragon',26],['landslide',28],['greatStorm',29],['boulderX',31],['chainBolt',32],['azureStorm',33],['greatShackle',36]],
  // 주술사: 독·감소·혼란, 끝에 현무
  'four-stage-shaman':[['venomDart',1],['hinder',2],['dismay',3],['lifeDrain',4],['firstAid',5],['venomCloud',6],['shackle',8],['suppress',9],['taunt',10],['deceive',11],['sealArts',12],['deadlyVenom',14],['dismayField',15],['hinderField',16],['venomFlood',21],['manaDrain',22],['suppressCross',24],['tauntCross',26],['rumorField',27],['venomSea',29],['subdue',30],['venomSpear',32],['blackTortoiseHex',33],['greatHinder',34],['greatDismay',35],['greatSuppress',36],['greatTaunt',37],['mazeArray',38]],
  // 도독: 물과 불, 허언, 노도·장대비
  'four-stage-commander':[['riptide',1],['emberBolt',2],['firstAid',4],['whirlpool',6],['flameWheel',8],['deceive',10],['torrentX',12],['searingFire',14],['cheerField',16],['seaDragon',18],['swiftField',20],['flameDragonX',22],['tidalCrash',24],['downpour',38]],
  // 무희: 정화·회복·흡기·상승
  'four-stage-dancer':[['clearMind',1],['firstAid',3],['lifeDrain',5],['cheer',7],['swiftCross',9],['ward',12],['uplift',16],['manaDrain',20],['treatment',24]],
  // 무녀(악대): 상승·회복·노래
  'four-stage-maiden':[['cheer',1],['swiftCross',2],['ward',4],['uplift',5],['firstAid',7],['clearMind',8],['cheerField',10],['swiftField',12],['wardCross',13],['upliftCross',15],['reliefCross',16],['lifeDrain',18],['ironSong',20],['calmSong',23],['greatCheer',24],['greatSwift',26],['greatWard',28],['greatUplift',30],['greatClearMind',32],['deceive',34],['treatment',35],['hurry',36],['reliefMarch',37],['regroup',40]],
  // 황태자: 바람과 호령
  'single-stage-crown-prince':[['firstAid',1],['whirl',4],['windWall',7],['galeBlast',12],['windGod',16],['poise',20],['battleCall',24],['precisionCall',28]],
  // 기마책사: 가벼운 책사
  'four-stage-mounted-strategist':[['emberBolt',1],['whirl',3],['focusSelf',6],['searingFire',16],['galeBlast',20]],
  // 수송대
  'single-stage-transport':[['firstAid',1],['meditation',8],['remoteSupply',14]],
  // 물리 계통에 더하는 책략
  'four-stage-monk':[['focusSelf',1],['hinder',4],['venomDart',8],['hinderField',12],['subdue',16]],
  'four-stage-bandit':[['stoneThrow',1],['focusSelf',4],['caveIn',8],['boulderX',16],['rockStorm',17]],
  'four-stage-yellow-turban':[['stoneThrow',1],['focusSelf',4],['caveIn',8],['boulderX',16],['rockStorm',17]],
  'four-stage-catapult':[['shackle',4]],
  'four-stage-chariot':[['focusSelf',8]],
  'single-stage-navy':[['riptide',1],['taunt',4],['torrentX',5],['whirlpool',6],['seaDragon',9],['tidalCrash',10]],
  'four-stage-pirate':[['riptide',1],['taunt',4],['torrentX',6]],
  'four-stage-nanman':[['snareStep',4],['suppress',8],['taunt',12]],
  'four-stage-valiant-cavalry':[['steadfast',16],['composure',27]],
  'four-stage-swordsman':[['boneBreaker',6],['poisonBlade',16],['skyRend',27]],
};
/** 규칙판 12에서 특수기를 새 기술로 바꾼 계통(옛 특수기를 쓰지 않는다). */
export const V12_SKILL_REPLACED=new Set(['four-stage-swordsman']);

/**
 * 옛 책략 → 새 책략. 보물이 주는 책략, 전장 데이터에 적힌 책략, 옛 이름을 새 목록으로 옮길 때 쓴다.
 * 옛 정의의 모양·속성·효과를 보고 가장 가까운 새 책략을 고른다.
 */
export function v12Equivalent(old:LearnedStrategy):string|undefined{
  if(old.physical)return undefined;
  if(old.support){
    switch(old.support){
      case 'heal':return old.shape==='single'?(old.power>=40?'treatment':'firstAid'):old.power>=40?'reliefField':'reliefCross';
      case 'cleanse':return old.shape==='single'?'clearMind':'greatClearMind';
      case 'guard':return old.shape==='single'?'ward':'wardCross';
      case 'haste':return 'hurry';
      case 'rally':return old.shape==='single'?'uplift':'upliftCross';
      case 'valor':return 'poise';
      case 'mana':return old.power>=20?'counsel':'meditation';
      case 'again':return 'regroup';
      default:return 'firstAid';
    }
  }
  const st=old.inflicts?.[0],area=old.shape!=='single';
  if(old.element==='support'||(old.power<=65&&st)){
    switch(st){
      case 'confusion':return area?'rumorField':'deceive';
      case 'seal':return 'sealArts';
      case 'weaken':return area?'suppressCross':'suppress';
      case 'breach':return area?'tauntCross':'taunt';
      case 'immobile':case 'bound':return area?'greatShackle':'shackle';
      case 'slow':return area?'hinderField':'hinder';
      case 'bleed':return area?'venomCloud':'venomDart';
      default:return area?'dismayField':'suppress';
    }
  }
  const ladder:Record<string,[string,string,string,string]>={
    fire:['emberBolt','searingFire','flameWheel','flameDragonX'],water:['riptide','torrentX','whirlpool','seaDragon'],
    earth:['stoneThrow','caveIn','groundQuake','landslide'],wind:['whirl','galeBlast','windWall','windGod'],thunder:['chainBolt','chainBolt','chainBolt','azureStorm'],
  };
  const l=ladder[old.element]??ladder.fire!;
  if(old.shape==='global')return 'greatStorm';
  if(old.shape==='line')return old.element==='water'?'downpour':old.element==='earth'?'venomSpear':old.element==='wind'?'searWind':'flameLance';
  return area?(old.power>=125?l[3]:l[2]):(old.power>=125?l[1]:l[0]);
}

/** 연출·그림을 물려받을 옛 책략(겹치지 않게 하나씩). strategy-fx.ts·strategy-icons.ts가 쓴다. */
export const V12_ART_FROM:Record<string,string>={
  emberBolt:'fire',searingFire:'inferno',flameWheel:'fireWall',flameDragonX:'skyFire',flameLance:'chainFire',fireArrows:'bowangFire',vermilionBlaze:'burnCamp',
  riptide:'waterSurge',torrentX:'flood',whirlpool:'sevenArmies',seaDragon:'deluge',downpour:'tidalLine',tidalCrash:'riverDam',
  stoneThrow:'rockfall',caveIn:'rockAmbush',groundQuake:'quake',landslide:'shatter',boulderX:'earthPulse',rockStorm:'tenAmbush',
  whirl:'whirlwind',galeBlast:'gust',windWall:'windDragon',windGod:'eastWind',greatStorm:'tempest',searWind:'gale',
  chainBolt:'thunderCross',azureStorm:'thunderStorm',lifeDrain:'hex',manaDrain:'counterSpy',
  hinder:'mire',hinderField:'lureTiger',greatHinder:'feintAttack',dismay:'demoralize',dismayField:'fourSongs',greatDismay:'nightmare',
  suppress:'weakenCurse',suppressCross:'terror',greatSuppress:'borrowKnife',taunt:'breakArmor',tauntCross:'selfInjury',greatTaunt:'hongmen',subdue:'grandFeint',snareStep:'ambush',
  venomDart:'poison',venomCloud:'plague',shackle:'bind',greatShackle:'lockedGates',sealArts:'silence',deceive:'confuse',rumorField:'rumor',mazeArray:'stoneMaze',blackTortoiseHex:'chaos',
  swiftCross:'swiftWind',swiftField:'woodenOx',greatSwift:'secretPath',cheer:'warCry',cheerField:'strawBoats',greatCheer:'grandDrum',focusSelf:'qigong',
  uplift:'inspire',upliftCross:'spareArms',greatUplift:'celestialDance',ward:'fortify',wardCross:'ironWall',greatWard:'ironBody',hurry:'march',greatHurry:'decree',poise:'valor',
  ironSong:'banner',calmSong:'spiritBell',battleCall:'backWater',precisionCall:'burnBoats',steadfast:'swordDance',composure:'peachOath',
  firstAid:'mend',treatment:'greatMend',reliefCross:'relief',reliefField:'sanctuary',remoteSupply:'supplyLine',reliefMarch:'blessing',whiteTigerGrace:'royalGrace',
  counsel:'rations',proposal:'imperialAura',grandProposal:'edict',meditation:'focus',clearMind:'purify',greatClearMind:'amnesty',regroup:'rewind',
};

/** 책략 도감 설명(규칙판 12). */
export const V12_TEXT:Record<string,string>={
  jewelAzure:'청룡보옥으로 동쪽 하늘의 비구름을 불러 둘레 두 칸 안의 적에게 벼락을 다섯 번 무작위로 떨어뜨린다. 맞은 적은 감전된다.',jewelVermilion:'주작보옥으로 불의 새를 불러 둘레 두 칸을 크게 태운다. 화상을 남긴다.',
  jewelTortoise:'현무보옥으로 전장 모든 부대의 기세를 뒤흔든다. 우리 편은 대개 강해지고 상대 편은 대개 약해진다.',jewelTiger:'백호보옥으로 맵 위 아군 모두의 상처를 치료하고 해로운 상태를 걷어 낸다.',
  emberBolt:'불덩이 하나를 던져 한 부대를 태운다. 가장 먼저 배우는 화계.',searingFire:'한 부대를 거센 불길로 감싼다. 사거리는 짧지만 화력이 세다.',
  flameWheel:'불의 고리를 십자로 펼쳐 둘레를 함께 태운다.',flameDragonX:'불의 용이 십자로 휘돌아 넓게 태우고 화상을 남긴다.',
  flameLance:'불길을 창처럼 곧게 내질러 한 줄의 적을 꿰뚫는다.',fireArrows:'기름 먹인 불화살을 퍼부어 정신력을 거의 무시하고 태운다. 방어를 깎는다.',
  vermilionBlaze:'남방 주작의 불길을 불러 둘레 3×3을 태운다. 책사가 마지막에 배운다.',
  riptide:'급한 물살로 한 부대를 휩쓴다.',torrentX:'거센 물결을 한 부대에 몰아친다.',whirlpool:'물을 십자로 소용돌이치게 해 둘레를 함께 휩쓴다.',
  seaDragon:'물의 용이 십자로 몰아쳐 넓게 휩쓴다.',downpour:'장대비를 한 줄로 쏟아 길을 진흙탕으로 만든다(이동력 감소).',
  tidalCrash:'성난 파도로 한 부대를 덮친다. 잘 맞지 않지만 맞으면 크게 다치고 발이 묶인다.',
  stoneThrow:'돌덩이를 날려 한 부대를 친다.',caveIn:'머리 위 바위를 무너뜨려 한 부대를 깔아 버린다.',groundQuake:'땅을 십자로 울려 둘레를 흔들고 발을 늦춘다.',
  landslide:'산을 무너뜨려 십자로 쏟아지게 한다.',boulderX:'큰 바위를 굴려 한 부대를 짓누른다. 사거리는 짧다.',rockStorm:'바위 비를 3×3에 쏟는다. 산적이 쓴다.',
  whirl:'회오리를 일으켜 한 부대를 친다. 약하지만 싸다.',galeBlast:'세찬 바람을 한 부대에 몰아친다.',windWall:'바람 벽을 세워 3×3을 휩쓴다.',
  windGod:'바람 신을 불러 3×3을 거세게 휩쓴다.',greatStorm:'큰 폭풍으로 맵 위의 적 모두를 조금씩 친다.',searWind:'뜨거운 바람을 한 줄로 내리쳐 맞은 적을 쇠약하게 한다.',
  chainBolt:'번개를 십자로 옮겨 붙게 한다. 도사가 늦게 배운다.',azureStorm:'동방 청룡의 뇌우를 불러 3×3에 벼락을 내린다.',
  lifeDrain:'상대의 기를 빨아들여 준 피해만큼 체력을 되찾는다.',manaDrain:'상대의 MP를 빼앗아 자기 MP로 삼는다.',
  hinder:'십자 안의 적을 굼뜨게 한다(순발력 20% 감소).',hinderField:'3×3의 적을 굼뜨게 한다.',greatHinder:'십자 안의 적을 오래(3턴) 굼뜨게 한다.',
  dismay:'십자 안의 적의 사기를 꺾는다(사기 20% 감소).',dismayField:'3×3의 적의 사기를 꺾는다.',greatDismay:'십자 안의 적의 사기를 오래 꺾는다.',
  suppress:'한 부대를 억눌러 주는 피해를 줄인다(쇠약).',suppressCross:'십자 안의 적을 쇠약하게 한다.',greatSuppress:'한 부대를 오래 쇠약하게 한다.',
  taunt:'한 부대를 조롱해 받는 피해를 늘린다(파갑).',tauntCross:'십자 안의 적을 조롱해 방비를 무너뜨린다.',greatTaunt:'한 부대의 방비를 오래 무너뜨린다.',
  subdue:'한 부대를 쇠약·파갑·지체·낙담에 한꺼번에 빠뜨린다.',snareStep:'올가미로 발목을 잡아 이동력을 크게 줄인다.',
  venomDart:'독침을 쏘아 중독시킨다(차례마다 체력이 깎인다).',venomCloud:'독 구름을 십자로 퍼뜨린다.',venomFlood:'독물을 십자로 흘려 넓게 중독시킨다.',
  venomSea:'독 비를 3×3에 내려 넓게 중독시킨다.',deadlyVenom:'맹독을 한 부대에 먹여 오래 중독시킨다.',venomSpear:'독을 바른 창을 한 줄로 던진다.',
  shackle:'한 부대를 묶어 움직이지 못하게 한다.',greatShackle:'십자 안의 적을 묶는다.',sealArts:'한 부대의 책략을 봉인한다.',
  deceive:'거짓말로 한 부대를 혼란에 빠뜨린다.',rumorField:'헛소문을 3×3에 퍼뜨려 혼란에 빠뜨린다.',mazeArray:'미로 같은 진으로 3×3의 적마다 혼란·속박·봉인·쇠약·중독 가운데 하나를 건다.',
  blackTortoiseHex:'북방 현무의 기운으로 3×3의 적에게 해로운 상태를 하나씩 건다.',
  swiftCross:'십자 안의 아군을 날래게 한다(순발력 20% 상승 3턴).',swiftField:'3×3의 아군을 날래게 한다.',greatSwift:'십자 안의 아군을 오래(5턴) 날래게 한다.',
  cheer:'십자 안의 아군 사기를 북돋는다(사기 20% 상승 3턴).',cheerField:'함성으로 3×3의 아군 사기를 북돋는다.',greatCheer:'십자 안의 아군 사기를 오래 북돋는다.',
  focusSelf:'숨을 골라 자기 공격 피해를 높인다.',uplift:'한 아군을 분발시켜 공격 피해를 높인다.',upliftCross:'십자 안의 아군을 분발시킨다.',greatUplift:'한 아군을 오래 분발시킨다.',
  ward:'한 아군의 방비를 굳혀 받는 피해를 줄인다.',wardCross:'십자 안의 아군 방비를 굳힌다.',greatWard:'한 아군의 방비를 오래 굳힌다.',
  hurry:'한 아군의 이동력을 1 늘린다.',greatHurry:'한 아군의 이동력을 2 늘린다.',poise:'자기 공격·방어·순발·사기를 한꺼번에 높인다.',
  ironSong:'철벽의 노래로 3×3 아군의 받는 피해를 줄인다.',calmSong:'마음을 가라앉히는 노래로 3×3 아군의 사기를 높인다.',
  battleCall:'호령으로 3×3 아군의 공격 피해를 높인다.',precisionCall:'호령으로 3×3 아군을 날래게 한다.',
  steadfast:'버티는 자세를 잡아 자기 받는 피해를 줄인다.',composure:'마음을 다잡아 자기 사기를 높인다.',
  firstAid:'한 아군의 체력을 조금 회복한다.',treatment:'한 아군의 체력을 크게 회복한다.',reliefCross:'십자 안의 아군 체력을 함께 회복한다.',reliefField:'3×3 안의 아군 체력을 함께 회복한다.',
  remoteSupply:'거리와 상관없이 아군 하나의 체력을 회복한다.',reliefMarch:'거리와 상관없이 아군 하나의 체력을 회복하고 해로운 상태를 모두 걷어 낸다(완치).',
  whiteTigerGrace:'백호의 힘으로 전장의 아군 모두를 회복하고 해로운 상태를 걷어 낸다(완치).',
  counsel:'계책을 건네 다른 아군의 MP를 채운다.',proposal:'큰 계책을 건네 다른 아군의 MP를 많이 채운다.',grandProposal:'십자 안의 다른 아군들 MP를 채운다.',
  meditation:'정좌하여 체력을 MP로 바꾼다(MP를 쓰지 않는다).',clearMind:'한 아군의 해로운 상태를 걷어 낸다.',greatClearMind:'십자 안 아군의 해로운 상태를 걷어 낸다.',
  regroup:'곁의 아군 하나를 재정비시켜 한 번 더 움직이게 한다.',greatRegroup:'세 칸 안의 아군 하나를 재정비시켜 한 번 더 움직이게 한다.',
  boneBreaker:'뼈를 부수는 참격. 출혈을 남긴다.',poisonBlade:'독 묻은 칼. 반드시 맞고 중독시킨다.',skyRend:'하늘을 가르는 일격. 크게 친다.',
};
