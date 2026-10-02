import type {UnitClass} from '../../core/src/index.ts';
import {allStrategies} from './officers.ts';

export const troopRoles:Partial<Record<UnitClass,{name:string;role:string;base:UnitClass;tint:number;spells:string[]}>>={
 shaman:{name:'주술사',role:'독·봉인·혼란으로 적을 약화하는 책략 병종',base:'strategist',tint:0xd7afff,spells:['fire','embers','bind','poison','silence','confuse','feint','demoralize']},
 maiden:{name:'무녀',role:'정화·방호·고무로 부대를 지키는 지원 병종',base:'fengshui',tint:0xffc4de,spells:['mend','purify','fortify','inspire','greatMend']},
 taoist:{name:'도사',role:'바람·수계·낙뢰를 다루는 원소 책략 병종',base:'strategist',tint:0xaee9ff,spells:['fire','gust','windDragon','flood','waterSurge','thunder','whirlwind','tempest','thunderbolt']},
 physician:{name:'의술사',role:'회복·정화에 집중하는 의무 병종',base:'fengshui',tint:0xb8ffd9,spells:['mend','purify','greatMend']},
 monk:{name:'무도가',role:'험지 기동과 근접 공격, 자기 회복을 겸하는 병종',base:'infantry',tint:0xffd398,spells:['mend','march','fortify']},
 horseArcher:{name:'궁기병',role:'이동 6 · 사거리 2~3, 기동 사격에 특화',base:'cavalry',tint:0xc7e6ae,spells:[]},
 bandit:{name:'산적',role:'숲·산지에서 강하지만 평지 방어가 약한 병종',base:'infantry',tint:0xd8b58e,spells:[]},
};
export const supportOptions:UnitClass[]=['infantry','fengshui','strategist','shaman','maiden','taoist','physician','monk','horseArcher','bandit','spearman','crossbow','archer','cavalry','heavyCav','catapult','ram','engineer'];
export function troopStrategies(kind:UnitClass,level:number){const role=troopRoles[kind];return role?allStrategies.filter(s=>role.spells.includes(s.id)&&(s.level<=level||s.id==='mend')).map(s=>s.id):undefined;}
export function visualClass(kind:UnitClass){return troopRoles[kind]?.base??kind;}

export const troopSheets=[{id:'casters',url:'/troops-casters-v1.png',rows:3},{id:'specialists',url:'/troops-specialists-v1.png',rows:4},{id:'casters-walk',url:'/troops-casters-walk-v1.png',rows:3},{id:'specialists-walk',url:'/troops-specialists-walk-v1.png',rows:4},{id:'casters-reaction',url:'/troops-casters-reaction-v1.png',rows:3},{id:'specialists-reaction',url:'/troops-specialists-reaction-v1.png',rows:4},{id:'base-reaction',url:'/units-base-reaction-v1.png',rows:6},{id:'extra-reaction',url:'/units-extra-reaction-v1.png',rows:4}] as const;
export const troopArt:Partial<Record<UnitClass,{sheet:'casters'|'specialists';row:number;rows:number}>>={shaman:{sheet:'casters',row:0,rows:3},maiden:{sheet:'casters',row:1,rows:3},taoist:{sheet:'casters',row:2,rows:3},physician:{sheet:'specialists',row:0,rows:4},monk:{sheet:'specialists',row:1,rows:4},horseArcher:{sheet:'specialists',row:2,rows:4},bandit:{sheet:'specialists',row:3,rows:4}};

export const basicReactionArt:Partial<Record<UnitClass,{sheet:string;row:number;rows:number}>>={
 infantry:{sheet:'base-reaction',row:0,rows:6},spearman:{sheet:'base-reaction',row:1,rows:6},archer:{sheet:'base-reaction',row:2,rows:6},cavalry:{sheet:'base-reaction',row:3,rows:6},strategist:{sheet:'base-reaction',row:4,rows:6},catapult:{sheet:'base-reaction',row:5,rows:6},crossbow:{sheet:'extra-reaction',row:0,rows:4},heavyCav:{sheet:'extra-reaction',row:1,rows:4},engineer:{sheet:'extra-reaction',row:2,rows:4},fengshui:{sheet:'extra-reaction',row:3,rows:4}
};
