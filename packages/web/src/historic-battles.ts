/**
 * 연의·정사의 대규모 전투 — 적 장수와 병사를 늘린다(규칙판 13, 새로 시작한 넓은 전장 wide 2).
 *
 * - 장수: 그 싸움에 실제로 나섰던 적 장수를 2~3명 더 세운다. 모두 연의 장수록에 있어 그 능력과 지은 초상을 쓴다(romanceOf가 hx_ id를 이름으로 찾는다).
 * - 병사: 전투 시작 때 서 있는 이름 없는 적 부대를 절반만큼 더 세운다(같은 병종·레벨, 바로 곁 빈칸에).
 * - 늘어난 부대는 본진을 지킨다(hold) — 다가오는 적과 싸우되, 호위 대상을 쫓아 맵을 가로지르지 않는다.
 * - 다리·길목이나 원본보다 앞(우리 편 쪽)에는 세우지 않는다. 늘어난 적이 아군 NPC를 덮치는 장은 우두머리 곁(후방)에 세운다(rear).
 * - 클리어율: 늘어난 만큼 적 전체의 공격·체력을 장마다 낮춰(HISTORIC_EDGE) 예전 클리어율에 맞춘다(자동 플레이로 잰 값).
 *
 * 예전 저장(규칙판 12 이하)·좁은 전장·원정·시련 전투는 바뀌지 않는다.
 */
import {makeUnit,key,type BattleState,type Unit,type UnitClass,type Coord} from '../../core/src/index.ts';
import {romanceOf} from './romance.ts';

export interface HistoricBattle {
  /** 싸움 이름과 해(설명용) */
  battle:string;
  /** 더 세우는 적 장수: [이름, 병종] */
  officers:ReadonlyArray<readonly [string,UnitClass]>;
  /** 증원을 모두 우두머리 곁(후방)에 세운다 — 앞 대열을 두껍게 하면 늘어난 적이 아군 NPC를 덮치는 장(석정). */
  rear?:boolean;
}

/** 연의·정사에서 대군이 맞붙은 싸움. 적은 그 싸움의 실제 상대편 장수다. */
export const HISTORIC_BATTLES:Record<string,HistoricBattle>={
  'S1-06':{battle:'동관 전투(211)',officers:[['한수','xiliang'],['방덕','heavyCav'],['마대','xiliang']]},
  'S1-07':{battle:'양평관 전투(215)',officers:[['장위','infantry'],['양임','spearman']]},
  'S1-09':{battle:'정군산 전투(219)',officers:[['법정','strategist'],['진식','infantry']]},
  'S1-10':{battle:'한수 전투(219)',officers:[['장저','infantry'],['유봉','spearman']]},
  'S2-02':{battle:'동구 전투(222)',officers:[['서성','crossbow'],['전종','spearman'],['하제','infantry']]},
  'S2-03':{battle:'광릉 전투(224)',officers:[['서성','crossbow'],['전종','spearman']]},
  'S2-06':{battle:'가정 전투(228)',officers:[['장휴','infantry'],['이성','spearman'],['황습','archer']]},
  'S2-08':{battle:'석정 전투(228)',officers:[['주환','cavalry'],['전종','spearman']],rear:true},
  'S2-10':{battle:'노성·상규 전투(231)',officers:[['오반','infantry'],['오의','cavalry']]},
  'S2-12':{battle:'위수 대치(234)',officers:[['마대','cavalry'],['요화','spearman'],['장익','infantry']]},
  'S3-01':{battle:'요수 전투(238)',officers:[['양조','infantry'],['윤직','spearman']]},
  'S3-02':{battle:'양평 포위전(238)',officers:[['공손수','cavalry'],['왕건','infantry']]},
  // 오의 장휴(장흠의 아들)는 가정의 촉 장휴와 다른 사람이다. 장수록은 이름 하나에 한 사람이라 여기서는 같은 싸움의 고승을 세운다.
  'S3-03':{battle:'번성 구원전(241)',officers:[['전종','spearman'],['고승','infantry']]},
  'S3-05':{battle:'흥세 전투(244)',officers:[['왕평','heavyCav'],['비의','strategist'],['유민','spearman']]},
};

/** 전투 시작 때 서 있는 이름 없는 적 부대를 이만큼 더 세운다. */
export const SOLDIER_GROWTH=.5;
/** 규칙판 14: 대규모 전투는 더 크게 — 병사를 원래의 80%만큼 더 세운다. */
export const SOLDIER_GROWTH_14=.8;

/**
 * 늘어난 적을 감안한 적 전체 공격·체력 보정(%). 자동 플레이(SIM_WIDE=2, 50회)로 예전 클리어율에 맞췄다.
 * 값이 없으면 보정하지 않는다.
 */
export const HISTORIC_EDGE:Record<string,{normal:number;extreme:number}>={
  'S1-06':{normal:-32,extreme:-22},'S1-07':{normal:-28,extreme:-8},'S1-09':{normal:-38,extreme:-56},'S1-10':{normal:-4,extreme:-12},'S2-02':{normal:-6,extreme:0},
  'S2-03':{normal:-34,extreme:-48},'S2-06':{normal:-24,extreme:-38},'S2-08':{normal:-40,extreme:-56},
  'S2-10':{normal:-55,extreme:-38},'S3-01':{normal:-30,extreme:-44},'S3-02':{normal:-18,extreme:-36},
  'S3-05':{normal:-50,extreme:-48},
};

/** 규칙판 14: 병사를 80%만큼 더 세우는 대신(SOLDIER_GROWTH_14) 적 하나하나를 이만큼(%) 약하게 — 더 많이, 더 길게 싸우되 클리어율은 예전 수준. */
export const HISTORIC_EDGE_14=-10;
/** 규칙판 14에서 장마다 더 거는 보정(%) — 자동 플레이(24회)로 규칙판 13 클리어율에 맞췄다. */
export const HISTORIC_EDGE_14_STAGE:Record<string,{normal?:number;extreme?:number}>={'S1-07':{normal:-6,extreme:-10},'S1-10':{extreme:-18},'S3-01':{extreme:-10}};

// 다리·나루 같은 길목에는 세우지 않는다(건너는 길을 막으면 싸움이 아니라 교착이 된다).
const OPEN=new Set(['plain','road','fort','forest','hill','grass','sand','town','camp']);
const fixed=(u:Unit)=>/^(gate|tower|barricade)_\d+_\d+$/.test(u.id)||u.unitClass==='civilian'||u.stats.movement===0;

/** from 둘레에서 가장 가까운 빈 땅(맵 안·서 있을 수 있는 지형·빈칸). 없으면 undefined. */
function freeNear(state:BattleState,from:Coord,unitClass:UnitClass,taken:Set<string>):Coord|undefined{
  const seen=new Set([key(from)]),queue:Coord[]=[from],occupied=state.occupancy();
  // 원본보다 우리 편에 가까운 칸(앞)에는 세우지 않는다 — 옆이나 뒤에 서서 대열을 두껍게 한다.
  const foes=[...state.living('player'),...state.living('ally'),...state.living('allyAi')];
  const near=(c:Coord)=>Math.min(Infinity,...foes.map(u=>Math.abs(u.pos.x-c.x)+Math.abs(u.pos.y-c.y)));
  const line=near(from);
  while(queue.length){
    const c=queue.shift()!;
    const ok=state.map.inBounds(c)&&!occupied.has(key(c))&&!taken.has(key(c))&&OPEN.has(state.map.tileAt(c).terrain)&&Number.isFinite(state.map.moveCost(unitClass,c))&&near(c)>=line;
    if(ok)return c;
    if(seen.size>400)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const){const n={x:c.x+dx,y:c.y+dy};if(!state.map.inBounds(n)||seen.has(key(n)))continue;seen.add(key(n));queue.push(n);}
  }
  return undefined;
}

/** 대규모 전투의 적 증원을 전장에 세운다. 늘린 부대 id를 돌려준다. */
export function reinforceHistoric(state:BattleState,stageId:string,skip:ReadonlySet<string>=new Set(),growth=SOLDIER_GROWTH):string[]{
  const plan=HISTORIC_BATTLES[stageId];if(!plan)return [];
  const enemies=state.living('enemy').filter(u=>!fixed(u));if(!enemies.length)return [];
  const taken=new Set<string>(),added:string[]=[];let n=0;
  const place=(src:Unit,o:{name:string;unitClass:UnitClass;level:number})=>{
    const at=freeNear(state,src.pos,o.unitClass,taken);if(!at)return;taken.add(key(at));
    // 늘어난 부대는 본진을 지킨다(hold): 다가오는 적은 치되, 맵을 가로질러 호위 대상을 쫓지 않는다.
    const u=makeUnit({id:`hx_${n++}`,name:o.name,side:'enemy',unitClass:o.unitClass,level:o.level,pos:at,behavior:'hold'});
    state.add(u);added.push(u.id);
  };
  const steady=enemies.filter(u=>!['race','flee','escortee','passive','follow'].includes(u.behavior??'advance')&&!u.goalRegion);
  const lead=steady.find(u=>romanceOf(u))??[...steady].sort((a,b)=>b.level-a.level)[0];
  // 병사: 이름 없는(연의 장수록에 없는) 부대를 절반만큼, 같은 병종·레벨로 곁에(rear면 우두머리 곁에).
  const rank=enemies.filter(u=>!romanceOf(u)&&u.behavior!=='race'&&u.behavior!=='follow'&&!u.goalRegion&&!skip.has(u.id)&&!/depot|convoy|decoy|target|boss|guard_post/.test(u.id));
  const extra=Math.round(rank.length*growth);
  for(let i=0;i<extra;i++){const src=rank[i%rank.length]!;place(plan.rear&&lead?lead:src,{name:src.name,unitClass:src.unitClass,level:src.level});}
  // 장수: 병사 대열 사이사이에(대열이 없으면 우두머리 곁에). 우두머리 바로 곁에 세우면, 달아나는 우두머리를 쫓는 길을 막아 버린다.
  if(!lead)return added;
  const top=Math.max(...enemies.map(u=>u.level));
  plan.officers.forEach(([name,unitClass],i)=>{if(!state.living('enemy').some(u=>u.name===name))place(rank.length&&!plan.rear?rank[Math.floor((i+.5)*rank.length/plan.officers.length)]!:lead,{name,unitClass,level:top});});
  return added;
}
