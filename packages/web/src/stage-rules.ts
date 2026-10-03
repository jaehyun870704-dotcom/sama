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
  /** Turn after which the battle is lost (forced marches, sieges against the clock). */
  deadline?:number;
  /** Reason shown on defeat. */
  failure?:(v:StageView)=>string|undefined;
}
export const stageRules:Record<string,StageRules>={
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
