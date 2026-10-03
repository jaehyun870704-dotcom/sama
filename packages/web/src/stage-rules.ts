import type {BattleState,Difficulty} from '../../core/src/index.ts';

/** Per-stage rules that live in the client layer (protected units, phase readouts,
 * custom seals). New stages register here instead of growing Session with branches. */
export interface StageView {state:BattleState;difficulty:Difficulty;journalLength:number}
export interface StageRules {
  sealNames:[string,string,string];
  /** Non-combatants under escort: unarmed, sturdier, slower. */
  protect?:Array<{unit:string;hp:number;movement?:number}>;
  /** Named foes that must be handled by the gimmick rather than worn down. */
  tough?:Array<{unit:string;hpScale:number;defense?:number}>;
  /** Live phase text; return undefined to show the scenario phase as is. */
  phase?:(v:StageView)=>string|undefined;
  /** Seal slots earned on victory; undefined falls back to the stage's seal expressions. */
  seals?:(v:StageView)=>number[]|undefined;
  /** Map labels drawn over regions (first cell of each region). */
  labels?:Array<{region:string;text:string}>;
  /** Scenario upkeep after every action: may change units and returns a defeat reason when lost. */
  tick?:(v:StageView)=>string|undefined;
  /** Turn after which the battle is lost (forced marches, sieges against the clock). */
  deadline?:number;
  /** Reason shown on defeat. */
  failure?:(v:StageView)=>string|undefined;
}
const HILL=['ma_su','hill_spear','hill_bow','hill_foot_a','hill_foot_b','hill_xbow'];

export const stageRules:Record<string,StageRules>={
  'S2-06':{
    sealNames:['남산 공략','도주 최소화','신속한 수원 차단'],
    labels:[{region:'spring',text:'북쪽 샘'},{region:'south_exit',text:'남쪽 출구'}],
    // The hill camp is strong while it has water; cutting the spring is what breaks it.
    tough:HILL.map(unit=>({unit,hpScale:1.5,defense:3})),
    deadline:20,
    tick:({state,difficulty})=>{
      const spring=state.map.regionCoords('spring'),at=(c:{x:number;y:number})=>state.unitAt(c);
      const held=spring.some(c=>{const u=at(c);return !!u&&u.side!=='enemy';})&&!spring.some(c=>at(c)?.side==='enemy');
      if(state.currentSide==='player'&&(state.survivalClocks.get('water_turn')??0)<state.turn){state.survivalClocks.set('water_turn',state.turn);if(held&&state.turn>1)state.survivalClocks.set('water_cut',(state.survivalClocks.get('water_cut')??0)+1);}
      if((state.survivalClocks.get('water_cut')??0)>=4&&!state.firedEvents.has('jieting/collapse')){
        state.firedEvents.add('jieting/collapse');state.survivalClocks.set('collapse_turn',state.turn);state.scenarioPhase='붕괴 · 도주 저지';
        for(const u of state.living('enemy')){
          u.behavior='escortee';u.goalRegion='south_exit';
          if(HILL.includes(u.id)){const max=Math.round(u.stats.maxHp/1.5);u.stats.maxHp=max;u.hp=Math.min(u.hp,max);u.stats.defense-=3;}
        }
      }
      if(state.firedEvents.has('jieting/collapse'))for(const u of state.living('enemy'))if(state.map.regionCoords('south_exit').some(c=>c.x===u.pos.x&&c.y===u.pos.y)){state.survivalClocks.set('escaped',(state.survivalClocks.get('escaped')??0)+1);state.retreat(u);}
      const limit=difficulty==='extreme'?1:2,gone=state.survivalClocks.get('escaped')??0;
      return gone>limit?`촉군 ${gone}부대가 남쪽 출구로 빠져나갔습니다.`:undefined;
    },
    phase:({state,difficulty})=>state.firedEvents.has('jieting/collapse')?`도주 저지 · 빠져나간 적 ${state.survivalClocks.get('escaped')??0}/${difficulty==='extreme'?1:2} · ${Math.max(0,21-state.turn)}턴 남음`:`수원 차단 · 물 잔량 ${Math.max(0,4-(state.survivalClocks.get('water_cut')??0))}/4 · ${Math.max(0,21-state.turn)}턴 남음`,
    seals:({state})=>[1,...((state.survivalClocks.get('escaped')??0)===0?[2]:[]),...((state.survivalClocks.get('collapse_turn')??99)<=7?[3]:[])],
  },
  'S2-05':{sealNames:['맹달 격퇴','부대 보존','신속한 공성'],deadline:14,labels:[{region:'keep',text:'신성 본채'}],phase:({state})=>state.scenarioPhase?`${state.scenarioPhase} · ${Math.max(0,15-state.turn)}턴 남음`:undefined,tough:[{unit:'sima_shi',hpScale:1.5,defense:3},{unit:'sima_zhao',hpScale:1.5,defense:3}],failure:({state})=>protectedFailure(state,['sima_shi','sima_zhao'])},
  'S2-04':{sealNames:['양양 수성','수비대 전원 생환','적 격퇴 수'],tough:[{unit:'gate_captain',hpScale:1.8,defense:4}],labels:[{region:'xiangyang',text:'양양 성문'}],phase:({state})=>`${state.scenarioPhase} · ${Math.max(0,8-(state.turn-(state.survivalClocks.get('xiangyang')??1)))}턴 남음`,failure:({state})=>state.captured.get('xiangyang')==='enemy'?'오군이 양양 성문을 차지했습니다.':undefined},
  'S2-03':{sealNames:['황제 탈출','부대 보존','신속한 탈출'],protect:[{unit:'cao_pi',hp:150,movement:3}],tough:[{unit:'gao_shou',hpScale:1.6}],labels:[{region:'exit',text:'북쪽 출구'}],failure:({state})=>state.find('cao_pi')?.alive===false?'조비가 퇴각했습니다.':undefined},
  'S2-02':{sealNames:['황제 철수','함대 보존','신속한 철수'],protect:[{unit:'cao_pi',hp:150,movement:3}],labels:[{region:'exit',text:'북서쪽 출구'}],failure:({state})=>state.find('cao_pi')?.alive===false?'조비가 퇴각했습니다.':undefined},
  'S2-01':{
    sealNames:['반란 진압','수비대 전원 생환','신속한 진압'],
    labels:[{region:'citadel',text:'무위 성채'}],
    tough:[{unit:'citadel_warden',hpScale:1.8,defense:4}],
    failure:({state})=>state.captured.get('citadel')==='enemy'?'반란군이 무위 성채를 점령했습니다.':undefined,
  },
};

/** Korean subject particle: 이 after a final consonant, 가 otherwise. */
export function subject(name:string){const c=name.charCodeAt(name.length-1);return name+(c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28!==0?'이':'가');}
export function protectedFailure(s:BattleState,ids:string[]){
  const fallen=ids.map(id=>s.find(id)).find(u=>u&&!u.alive);
  return fallen?`${subject(fallen.name)} 퇴각했습니다.`:undefined;
}
