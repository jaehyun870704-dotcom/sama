/**
 * 전투와 장비 사이: 사신 책략 열기, 전투가 끝난 뒤 장비 경험치·쓴 소모품·책의 경험치를 성장 기록에 남기기.
 *
 * 장비 경험치(단련): 무기는 공격·반격할 때(맞히면 3, 빗나가면 1), 방어구는 공격받을 때(맞으면 2, 피하면 1) 쌓인다.
 * 육도·삼략은 자기 차례마다 무기·방어구 경험치를, 손자병법서는 장수 경험치를 더하고, 맹덕신서는 둘 다 1.5배로 늘린다.
 * 전투 기록(log)만 읽으므로 저장을 다시 재생해도 같은 값이 나온다.
 */
import type {BattleState,LogEntry,Unit} from '../../core/src/index.ts';
import {JEWEL_STRATEGIES,consumable} from '../../core/src/index.ts';
import {JEWEL_STRATEGY_DEFS} from './strategies-v12.ts';
import {OFFICERS,addGearExp,addSupply,gearKey,gearName,equippedItems,treasureInfo,type Campaign,type Deployment,type GearSlot} from './progression.ts';

/** 사신보옥을 지닌 부대에게 그 사신 책략을 연다(전장 책략표에도 올린다). */
export function grantJewelStrategies(state:BattleState,u:Unit,_revision=13){
  for(const [sid,trait] of Object.entries(JEWEL_STRATEGIES)){
    if(!u.traits.includes(trait))continue;
    const def=JEWEL_STRATEGY_DEFS.find(s=>s.id===sid);if(!def)continue;
    if(!state.strategies.has(sid))state.strategies.set(sid,def);
    if(!u.strategies.includes(sid))u.strategies.push(sid);
  }
}
/** 기록에서 부대 하나가 번 무기·방어구 경험치. */
export function gearExpFromLog(log:readonly LogEntry[],unitId:string){
  let weapon=0,armor=0;
  for(const e of log){
    if(e.t==='attack'||e.t==='counter'){
      if(e.attacker===unitId)weapon+=e.t==='attack'?(e.hit?3:1):(e.hit?2:1);
      if(e.defender===unitId)armor+=e.hit?2:1;
    }
  }
  return {weapon,armor};
}
export interface GearSettle {levelUps:string[];used:Record<string,number>;bookXp:number;picked?:Record<string,number>}
/** 전장에서 주운 소모품 수(기록의 pickup). */
export function pickedFromLog(log:readonly LogEntry[]){const out:Record<string,number>={};for(const e of log)if(e.t==='pickup')out[e.item]=(out[e.item]??0)+1;return out;}
/**
 * 전투가 끝났을 때 한 번: 출진한 아군 장수의 장비 경험치·책 경험치를 쌓고, 쓴 소모품을 보관함에서 뺀다.
 * xpEarned: 이번 전투에서 장수가 싸워 번 경험치(맹덕신서가 절반을 더 준다).
 */
export function settleGear(c:Campaign,state:BattleState,d:Deployment|undefined,xpEarned:Readonly<Record<string,number>>={}):GearSettle{
  const out:GearSettle={levelUps:[],used:{},bookXp:0,picked:{}};
  if(!d||d.run)return out;
  const turns=state.log.filter(e=>e.t==='turnStart'&&e.side==='player').length;
  for(const u of state.units.values()){
    if(u.side!=='player'&&u.side!=='ally')continue;
    const key=gearKey(u),items=equippedItems(d,key);if(!items.length)continue;
    const gear:Partial<Record<GearSlot,string>>=Object.fromEntries(items.map(id=>[treasureInfo(id).slot,id]));
    const mul=u.traits.includes('gear:mengde')?1.5:1,{weapon,armor}=gearExpFromLog(state.log,u.id);
    const drill=(t:string)=>u.traits.includes(t)?(u.traitParams[t]??0)*turns:0;
    const gain:Partial<Record<GearSlot,number>>={weapon:(weapon+drill('gear:weaponDrill'))*mul,armor:(armor+drill('gear:armorDrill'))*mul};
    for(const slot of ['weapon','armor'] as const){const id=gear[slot];if(!id)continue;const up=addGearExp(c,id,gain[slot]??0);if(up)out.levelUps.push(`${gearName(id)} Lv.${up}`);}
    // 손자병법서(차례마다 경험치) · 맹덕신서(싸워 번 경험치의 절반을 더)
    const book=Math.round(drill('gear:sunzi')*mul+(mul>1?Math.max(0,xpEarned[u.id]??0)*(mul-1):0));
    if(book>0){out.bookXp+=book;if((OFFICERS as readonly string[]).includes(key))c.xp[key]=(c.xp[key]??0)+book;else if(c.retinueXp?.[key]!==undefined)c.retinueXp[key]+=book;}
  }
  // 쓴 소모품: 출진할 때 실은 수 + 전장에서 주운 수 − 전장에 남은 수. 보관함은 남은 수만큼으로 맞춘다(주운 것은 더해진다).
  const picked=pickedFromLog(state.log);out.picked=picked;
  for(const id of new Set([...Object.keys(d.supplies??{}),...Object.keys(picked)])){if(!consumable(id))continue;const n=d.supplies?.[id]??0,got=picked[id]??0,left=state.inventory[id]??0,spent=Math.max(0,n+got-left);if(spent)out.used[id]=spent;if(left!==n)addSupply(c,id,left-n);}
  return out;
}
/** 결과 화면에 실을 장비 소식. */
export function gearNews(s:GearSettle){
  const list=(r:Record<string,number>)=>Object.entries(r).filter(([,n])=>n>0).map(([id,n])=>`${consumable(id)?.name??id} ${n}개`);
  const used=list(s.used),picked=list(s.picked??{});
  return [...(picked.length?[`주운 도구 · ${picked.join(' · ')}`]:[]),...(s.levelUps.length?[`장비 단련 · ${s.levelUps.join(' · ')}`]:[]),...(s.bookXp?[`병서의 깨달음 · 경험치 +${s.bookXp}`]:[]),...(used.length?[`쓴 도구 · ${used.join(' · ')}`]:[])];
}
