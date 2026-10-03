import type {UnitClass} from '../../core/src/index.ts';
import {VARIANTS,familyOf} from '../../core/src/index.ts';
import {allStrategies} from './officers.ts';

export const troopRoles:Partial<Record<UnitClass,{name:string;role:string;base:UnitClass;tint:number;spells:string[]}>>={
 shaman:{name:'주술사',role:'독·봉인·혼란으로 적을 약화하는 책략 병종',base:'strategist',tint:0xd7afff,spells:['fire','embers','bind','poison','silence','confuse','feint','demoralize']},
 maiden:{name:'무녀',role:'정화·방호·고무로 부대를 지키는 지원 병종',base:'fengshui',tint:0xffc4de,spells:['mend','purify','fortify','inspire','greatMend']},
 taoist:{name:'도사',role:'바람·수계·낙뢰를 다루는 원소 책략 병종',base:'strategist',tint:0xaee9ff,spells:['fire','gust','windDragon','flood','waterSurge','thunder','whirlwind','tempest','thunderbolt']},
 physician:{name:'의술사',role:'회복·정화에 집중하는 의무 병종',base:'fengshui',tint:0xb8ffd9,spells:['mend','purify','greatMend']},
 monk:{name:'무도가',role:'험지 기동과 근접 공격, 자기 회복을 겸하는 병종',base:'infantry',tint:0xffd398,spells:['mend','march','fortify']},
 horseArcher:{name:'궁기병',role:'이동 6 · 사거리 2~3, 기동 사격에 특화',base:'cavalry',tint:0xc7e6ae,spells:[]},
 bandit:{name:'산적',role:'숲·산지에서 강하지만 평지 방어가 약한 병종',base:'infantry',tint:0xd8b58e,spells:[]},
 // 확장 병종과 진화 단계: 그림은 계열의 것을 쓰고 색조·등급 표식으로 구분한다.
 shieldGuard:{name:'방패병',role:'보병 2단계 · 곁의 아군이 받을 피해를 대신 받는 호위 전열',base:'infantry',tint:0xbfd2ff,spells:[]},
 royalGuard:{name:'금위군',role:'보병 3단계 · 호위와 배수진, 무너지지 않는 최정예 전열',base:'infantry',tint:0xffe08a,spells:[]},
 pikeman:{name:'장창병',role:'창병 2단계 · 더 긴 창으로 기병을 받아 낸다',base:'spearman',tint:0xc8e6ff,spells:[]},
 halberdier:{name:'극병',role:'창병 3단계 · 몇 번이고 반격하는 미늘창 부대',base:'spearman',tint:0xffd27a,spells:[]},
 lancer:{name:'돌격기병',role:'경기병 2단계 · 평지 돌파 위력이 오른다',base:'cavalry',tint:0xc6d8ff,spells:[]},
 tigerRider:{name:'호표기',role:'경기병 3단계 · 조조의 친위 기병, 회심 공격',base:'cavalry',tint:0xffd88a,spells:[]},
 ironCav:{name:'철기',role:'중기병 2단계 · 쇠미늘로 물리 피해를 덜 받는다',base:'heavyCav',tint:0xd0d6e0,spells:[]},
 longbow:{name:'강궁병',role:'궁병 2단계 · 사거리 2~3',base:'archer',tint:0xcfe8c0,spells:[]},
 sharpshooter:{name:'신궁',role:'궁병 3단계 · 사거리 2~4, 방어를 꿰뚫는 화살',base:'archer',tint:0xffe39a,spells:[]},
 repeater:{name:'연노병',role:'노병 2단계 · 더 강한 연사',base:'crossbow',tint:0xc9dcff,spells:[]},
 greatBow:{name:'대황노',role:'노병 3단계 · 사거리 2~4, 호위를 무시하는 관통 사격',base:'crossbow',tint:0xffd690,spells:[]},
 tactician:{name:'군사',role:'책사 2단계 · 지력과 책략 MP가 오른다',base:'strategist',tint:0xc9d4ff,spells:['fire','embers','gust','windDragon','ambush','fireWall','rockfall']},
 mastermind:{name:'귀모',role:'책사 3단계 · 적의 책략을 흘려 보내는 최고의 책사',base:'strategist',tint:0xffd98c,spells:['fire','embers','gust','windDragon','ambush','fireWall','rockfall','whirlwind','feint','tempest']},
 sage:{name:'현자',role:'풍수사 2단계 · 회복과 정화가 강해진다',base:'fengshui',tint:0xd2f0ff,spells:['mend','purify','fortify','inspire']},
 immortal:{name:'선인',role:'풍수사 3단계 · 책략 피해를 덜 받는 회복의 대가',base:'fengshui',tint:0xfff0a8,spells:['mend','purify','fortify','inspire','greatMend']},
 nomad:{name:'유목기병',role:'궁기병 2단계 · 이동 7의 기동 사격',base:'horseArcher',tint:0xdcefb8,spells:[]},
 whiteHorse:{name:'백마의종',role:'궁기병 3단계 · 공손찬의 백마 기사단, 회심 사격',base:'horseArcher',tint:0xffffff,spells:[]},
 slinger:{name:'투석병',role:'사거리 1~2, 붙어 있는 적에게도 돌을 던지는 경보병',base:'archer',tint:0xd9c8a6,spells:[]},
 hurler:{name:'벽력투석대',role:'투석병 2단계 · 사거리 1~3',base:'archer',tint:0xf0d38a,spells:[]},
 assassin:{name:'자객',role:'이동 6 · 높은 회심률, 몸은 약하다',base:'bandit',tint:0x8e8aa8,spells:[]},
 phantom:{name:'무영객',role:'자객 2단계 · 그림자 같은 일격',base:'bandit',tint:0x6f6a96,spells:[]},
 rattan:{name:'등갑병',role:'물리 피해 25% 감소 · 화계에 크게 약하다',base:'infantry',tint:0xd8b36a,spells:[]},
 rattanElite:{name:'정예 등갑병',role:'등갑병 2단계 · 물리 피해 35% 감소, 여전히 불에 약하다',base:'infantry',tint:0xe9c56c,spells:[]},
 elephant:{name:'상병',role:'남만의 코끼리 부대 · 체력이 매우 높고 느리다',base:'heavyCav',tint:0xb9b2a4,spells:[]},
 warElephant:{name:'전투상',role:'상병 2단계 · 쇠 갑주를 두른 코끼리',base:'heavyCav',tint:0xd3cbbb,spells:[]},
};
export const supportOptions:UnitClass[]=['infantry','fengshui','strategist','shaman','maiden','taoist','physician','monk','horseArcher','bandit','spearman','crossbow','archer','cavalry','heavyCav','catapult','ram','engineer'];
export function troopStrategies(kind:UnitClass,level:number){const role=troopRoles[kind];return role?allStrategies.filter(s=>role.spells.includes(s.id)&&(s.level<=level||s.id==='mend')).map(s=>s.id):undefined;}
export function visualClass(kind:UnitClass){return troopRoles[kind]?.base??kind;}
/** The class whose sprite a unit is drawn with: extended classes borrow their lineage's art. */
export function artClass(kind:UnitClass):UnitClass{return VARIANTS[kind]?(troopRoles[kind]?.base??familyOf(kind)):kind;}
/** Every class a player can field, by tier: for codex and recruiting. */
export const recruitPool:UnitClass[]=['infantry','spearman','cavalry','archer','crossbow','strategist','fengshui','horseArcher','heavyCav','slinger','assassin','rattan','elephant','monk','taoist','physician','bandit'];

export const troopSheets=[{id:'casters',url:'/troops-casters-v1.png',rows:3},{id:'specialists',url:'/troops-specialists-v1.png',rows:4},{id:'casters-walk',url:'/troops-casters-walk-v1.png',rows:3},{id:'specialists-walk',url:'/troops-specialists-walk-v1.png',rows:4},{id:'casters-reaction',url:'/troops-casters-reaction-v1.png',rows:3},{id:'specialists-reaction',url:'/troops-specialists-reaction-v1.png',rows:4},{id:'base-reaction',url:'/units-base-reaction-v1.png',rows:6},{id:'extra-reaction',url:'/units-extra-reaction-v1.png',rows:4}] as const;
export const troopArt:Partial<Record<UnitClass,{sheet:'casters'|'specialists';row:number;rows:number}>>={shaman:{sheet:'casters',row:0,rows:3},maiden:{sheet:'casters',row:1,rows:3},taoist:{sheet:'casters',row:2,rows:3},physician:{sheet:'specialists',row:0,rows:4},monk:{sheet:'specialists',row:1,rows:4},horseArcher:{sheet:'specialists',row:2,rows:4},bandit:{sheet:'specialists',row:3,rows:4}};

export const basicReactionArt:Partial<Record<UnitClass,{sheet:string;row:number;rows:number}>>={
 infantry:{sheet:'base-reaction',row:0,rows:6},spearman:{sheet:'base-reaction',row:1,rows:6},archer:{sheet:'base-reaction',row:2,rows:6},cavalry:{sheet:'base-reaction',row:3,rows:6},strategist:{sheet:'base-reaction',row:4,rows:6},catapult:{sheet:'base-reaction',row:5,rows:6},crossbow:{sheet:'extra-reaction',row:0,rows:4},heavyCav:{sheet:'extra-reaction',row:1,rows:4},engineer:{sheet:'extra-reaction',row:2,rows:4},fengshui:{sheet:'extra-reaction',row:3,rows:4}
};
