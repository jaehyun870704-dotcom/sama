import type {UnitClass} from '../../core/src/index.ts';
import {fourStageCorrectionRows,singleStageCorrectionRows} from './complete-troops.ts';
import {legacyStrategies} from './officers.ts';
import {V12_LINEAGE,V12_SKILL_REPLACED} from './strategies-v12.ts';

/**
 * 계통(4단 진화 줄)마다 쓰는 책략과 특수기.
 *
 * - 책략 병종은 계통마다 서로 다른 책략을 쓴다. 겹쳐도 되는 것은 소회복·정화·명상 같은 기본기뿐이다(SHARED).
 * - 물리로 싸우는 계통은 특수기를 하나씩 가진다(공격력으로 피해, MP 조금).
 * - 같은 계통의 진화형은 같은 목록을 쓰고, 레벨이 오르면 습득 레벨에 맞춰 하나씩 열린다.
 */
export type Lineage=keyof typeof fourStageCorrectionRows|keyof typeof singleStageCorrectionRows;
export const SHARED=new Set(['mend','purify','focus']);

const LINEAGE:Partial<Record<UnitClass,Lineage>>={};
for(const [key,classes] of Object.entries(fourStageCorrectionRows))for(const c of classes)LINEAGE[c as UnitClass]=key as Lineage;
for(const [key,classes] of Object.entries(singleStageCorrectionRows))for(const c of classes){
  const lineage=key==='single-stage-royal-prince'||key==='single-stage-emperor'||key==='single-stage-heaven-emperor'?'single-stage-crown-prince':key;
  LINEAGE[c as UnitClass]=lineage as Lineage;
}
export const lineageOf=(c:UnitClass):Lineage=>LINEAGE[c]??'single-stage-civilian';

const IMPERIAL=['edict','purify','royalGrace','imperialAura','strawBoats','secretPath','amnesty','focus'] as const;

/** 책략 계통의 고유 책략(습득 레벨은 책략 정의를 따른다). */
export const LINEAGE_SPELLS:Partial<Record<Lineage,readonly string[]>>={
  // 책사: 불과 계략
  'four-stage-strategist':['fire','embers','fireWall','bowangFire','counterSpy','fireShips','burnCamp','inferno','chainFire','selfInjury','skyFire','grandFeint','focus'],
  // 도사: 바람과 번개, 맵 전체를 휩쓰는 모래폭풍
  'four-stage-taoist':['spark','windDragon','gust','gale','thunder','whirlwind','lightningNet','thunderStorm','sandstorm','thunderCross','tempest','eastWind','thunderbolt','focus'],
  // 풍수사: 땅과 물의 기운, 시간을 되돌리는 회귀
  'four-stage-fengshui':['earthPulse','mend','purify','bind','flood','mire','waterSurge','riverDam','tidalLine','rewind','deluge','quake','sevenArmies','weiRiver','lockedGates','stoneMaze'],
  // 주술사: 저주와 약화
  'four-stage-shaman':['hex','weakenCurse','poison','silence','terror','plague','feint','hongmen','nightmare','borrowKnife','chaos','focus'],
  // 도독: 매복과 진법
  'four-stage-commander':['feintAttack','ambush','breakArmor','confuse','rumor','rockfall','encircle','demoralize','lureTiger','rockAmbush','fourSongs','shatter','tenAmbush'],
  // 무녀: 치유와 수호
  'four-stage-maiden':['mend','purify','fortify','spiritBell','relief','greatMend','ironWall','blessing','sanctuary'],
  // 무희: 춤으로 북돋움
  'four-stage-dancer':['swordDance','mend','march','inspire','swiftWind','grandDrum','beautyTrap','charmDance','celestialDance'],
  // 군주: 통솔
  'four-stage-lord':['banner','warCry','decree','valor','burnBoats','backWater','peachOath'],
  // 황태자: 황명
  'single-stage-crown-prince':IMPERIAL,
  // 수송대: 보급
  'single-stage-transport':['rations','spareArms','supplyLine','woodenOx','focus'],
  // 무도가: 기공
  'four-stage-monk':['qigong','ironBody'],
  // 기마책사: 이동하면서 기를 모으는 부채 책략
  'four-stage-mounted-strategist':['focus'],
};

/** 물리 계통의 특수기(계통마다 하나). 군주·도독·무도가처럼 칼도 쓰는 책략 병종도 하나씩 갖는다. */
export const LINEAGE_SKILL:Partial<Record<Lineage,string>>={
  'four-stage-infantry':'shieldBash','four-stage-spearman':'pierce','four-stage-cavalry':'breakthrough','four-stage-heavy-cavalry':'trample',
  'four-stage-archer':'aimedShot','four-stage-crossbow':'volley','four-stage-horse-archer':'skirmish',
  'four-stage-assassin':'assassinate','four-stage-rattan':'rattanRush','four-stage-elephant':'tuskCharge','four-stage-bandit':'plunder',
  'single-stage-xiliang':'westernCharge','single-stage-ram':'gateCrash','single-stage-navy':'deckVolley','four-stage-swordsman':'flashCut',
  'four-stage-mountain-cavalry':'mountainRaid','four-stage-valiant-cavalry':'lanceRush','four-stage-chariot':'scytheWheels',
  'single-stage-siege-tower':'towerShot','four-stage-nanman':'beastRoar','single-stage-gaema-warrior':'ironCharge','four-stage-halberd-cavalry':'halberdSweep',
  'single-stage-engineer':'snare','four-stage-catapult':'thunderShot','four-stage-monk':'chainFist','four-stage-lord':'royalStrike',
  'four-stage-commander':'commandStrike',
  'four-stage-yellow-turban':'yellowSlash','four-stage-pirate':'boardingSlash',
  'four-stage-javelin':'javelinCast','four-stage-qiang':'qiangCharge','four-stage-sniper':'sniperShot',
};

const levelOf=new Map(legacyStrategies.map(s=>[s.id,s.level]));
/** 새 전투가 쓰는 규칙판(규칙판 12부터 새 책략 목록). */
export const CURRENT_SPELL_RULES=12;
/** 이 병종의 특수기 id(없으면 undefined). 규칙판 12에서 검사는 특수기 대신 검술 셋을 배운다. */
export function classSkill(c:UnitClass,rev=CURRENT_SPELL_RULES){const lin=lineageOf(c);return rev>=12&&V12_SKILL_REPLACED.has(lin)?undefined:LINEAGE_SKILL[lin];}
/** 이 병종이 레벨 level에서 쓰는 책략·특수기. 예전 목록은 소회복을 처음부터 쓴다. */
export function classSpells(c:UnitClass,level:number,rev=CURRENT_SPELL_RULES):string[]{
  const lin=lineageOf(c),skill=classSkill(c,rev);
  const list=rev>=12?(V12_LINEAGE[lin]??[]).filter(([,lv])=>lv<=level).map(([id])=>id):(LINEAGE_SPELLS[lin]??[]).filter(id=>(levelOf.get(id)??99)<=level||id==='mend');
  return skill?[skill,...list]:[...list];
}
/** 이 계통이 그 책략을 배우는 레벨(규칙판 12). */
export function learnLevelFor(c:UnitClass,id:string):number|undefined{return V12_LINEAGE[lineageOf(c)]?.find(([x])=>x===id)?.[1];}
/** 이 병종이 언젠가 쓰게 될 책략 전부(도감용). */
export function classSpellBook(c:UnitClass,rev=CURRENT_SPELL_RULES){return classSpells(c,99,rev);}
