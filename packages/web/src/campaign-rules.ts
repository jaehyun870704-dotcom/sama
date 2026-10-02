import {makeUnit} from '../../core/src/index.ts';
import type {BattleState,StageDef} from '../../core/src/index.ts';

// Fixed encounter bands: enemies never level up in response to equipment or replay.
export const encounterLevels:Record<string,number>={'S1-01':1,'S1-02':2,'S1-03':3,'S1-04':4,'S1-05':5,'S1-06':6,'S1-07':6,'S1-08':7};
export function campaignStage(source:StageDef):StageDef{
  const s=structuredClone(source),base=encounterLevels[s.id]??1,old=s.difficulty.normal.recommendedLevel;
  const adjust=(n:number|undefined)=>Math.max(1,base+Math.max(-1,Math.min(1,(n??old)-old)));
  for(const tier of ['normal','extreme'] as const)s.difficulty[tier]={...s.difficulty[tier],recommendedLevel:base,minEnemyLevel:base+(tier==='extreme'?2:0)};
  for(const group of [...s.deployment.grantedUnits??[],...s.deployment.allyAi??[]])group.level=adjust(group.level);
  for(const event of s.events??[])for(const action of event.actions)for(const unit of action.units??[])unit.level=adjust(unit.level);
  if(s.id==='S1-08'){
    // Eight support units retain their roles, with three additional silhouettes/classes.
    const granted=s.deployment.grantedUnits!;
    granted[2]!.count=1;granted.push({type:'fengshui',count:1,level:base,countsTowardAllyLoss:true});
    granted[3]!.count=1;granted.push({type:'crossbow',count:1,level:base,countsTowardAllyLoss:true});
    s.perf={tier:'C',maxSimultaneousUnits:80};
  }
  return s;
}
export function structureKind(id:string){return /^gate_\d+_\d+$/.test(id)?'gate':/^tower_\d+_\d+$/.test(id)?'tower':/^barricade_\d+_\d+$/.test(id)?'barricade':undefined;}
/** Frame in the 4×2 scenery sheet: gate, watchtower, and the wall segment reused as a barricade. */
export function structureFrame(kind:'gate'|'tower'|'barricade'){return kind==='gate'?2:kind==='tower'?3:7;}
export function addFortifications(state:BattleState){
  if(!['S1-08','S1-06'].includes(state.stage.id))return;
  const level=(state.stage.id==='S1-06'?6:5)+(state.difficulty==='extreme'?2:0);
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(state.map.tileAt({x,y}).terrain!=='gate')continue;
    const guard=state.unitAt({x,y});if(guard){const candidates=[{x:x+1,y},{x:x-1,y},{x,y:y+1},{x,y:y-1}];const free=candidates.find(p=>state.map.inBounds(p)&&!state.unitAt(p)&&!['wall','gate','water','mountain'].includes(state.map.tileAt(p).terrain));if(!free)throw new Error('성문 수비대 배치 공간이 없습니다.');guard.pos=free;}
    const unit=makeUnit({id:`gate_${x}_${y}`,name:'성문 방벽',side:'enemy',unitClass:'infantry',level,pos:{x,y},behavior:'passive',statOverrides:{maxHp:95,defense:10,attack:0,movement:0,agility:0}});
    unit.range=[0,0];state.add(unit);
  }
  const towers=state.map.regions.get('watchtowers')??[{x:33,y:5},{x:44,y:5},{x:33,y:16},{x:44,y:16}];
  for(const {x,y} of towers){
    if(state.unitAt({x,y}))continue;
    const unit=makeUnit({id:`tower_${x}_${y}`,name:'감시탑',side:'enemy',unitClass:'crossbow',level,pos:{x,y},behavior:'hold',traits:['alwaysHit'],statOverrides:{maxHp:110,defense:12,attack:33,movement:0}});
    unit.range=[1,5];state.add(unit);
  }
}

/** Every castle map receives a controllable siege crew in new-rules battles. */
export function addSiegeCompany(state:BattleState){
  if(state.stage.id==='S1-04')return;
  const cells=[];for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++)cells.push({x,y});
  if(!cells.some(p=>state.map.tileAt(p).terrain==='wall'))return;
  const hero=state.get('sima_yi');
  const free=cells.filter(p=>!state.unitAt(p)&&['plain','road','fort'].includes(state.map.tileAt(p).terrain)).sort((a,b)=>(Math.abs(a.x-hero.pos.x)+Math.abs(a.y-hero.pos.y))-(Math.abs(b.x-hero.pos.x)+Math.abs(b.y-hero.pos.y)));
  if(!free[0])throw new Error('충차 배치 공간이 없습니다.');
  state.add(makeUnit({id:'siege_crew',name:'공성대장',side:'ally',unitClass:'ram',level:hero.level,pos:free[0],traits:['siegeRam','noCounterAttack'],canUseItems:false}));
  if(['S1-06','S1-08'].includes(state.stage.id))return;
  // Estate fortifications defend the family; Luoyang's gate remains a paid exit.
  const side=state.stage.id==='S1-01'?'allyAi':'enemy';
  const gates=cells.filter(p=>state.map.tileAt(p).terrain==='gate');
  for(const p of gates){if(state.unitAt(p))continue;const u=makeUnit({id:`gate_${p.x}_${p.y}`,name:'성문 방벽',side,unitClass:'infantry',level:hero.level,pos:p,behavior:'passive',statOverrides:{maxHp:95,attack:0,defense:10,movement:0}});u.range=[0,0];state.add(u);}
  for(const gate of gates.filter((_,i)=>i%2===0)){
    const at=[{x:gate.x-1,y:gate.y},{x:gate.x,y:gate.y-1}].find(p=>state.map.inBounds(p)&&state.map.tileAt(p).terrain==='wall'&&!state.unitAt(p));if(!at)continue;
    const tower=makeUnit({id:`tower_${at.x}_${at.y}`,name:'감시탑',side,unitClass:'crossbow',level:hero.level,pos:at,behavior:state.stage.id==='S1-02'?'passive':'hold',traits:['alwaysHit'],statOverrides:{maxHp:110,attack:26,defense:12,movement:0}});tower.range=[1,4];state.add(tower);
  }
}

/** S1-08 race: tiles left for the competing ally and for Sima Yi to reach the central fort. */
export function raceGap(state:BattleState){
  const fort=state.map.regionCoords('central_fort');if(!fort.length)return undefined;
  const dist=(p:{x:number;y:number})=>Math.min(...fort.map(f=>Math.abs(f.x-p.x)+Math.abs(f.y-p.y)));
  const racers=state.living('allyAi').filter(u=>u.behavior==='race');
  const hero=state.find('sima_yi');
  return {ally:racers.length?Math.min(...racers.map(u=>dist(u.pos))):undefined,hero:hero?.alive?dist(hero.pos):undefined};
}
