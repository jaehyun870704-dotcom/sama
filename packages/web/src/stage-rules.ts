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
  /** Reason shown on defeat. */
  failure?:(v:StageView)=>string|undefined;
}
export const stageRules:Record<string,StageRules>={
  'S2-02':{sealNames:['황제 철수','함대 보존','신속한 철수'],protect:[{unit:'cao_pi',hp:150,movement:3}],labels:[{region:'exit',text:'북서쪽 출구'}],failure:({state})=>state.find('cao_pi')?.alive===false?'조비가 퇴각했습니다.':undefined},
  'S2-01':{
    sealNames:['반란 진압','수비대 전원 생환','신속한 진압'],
    labels:[{region:'citadel',text:'무위 성채'}],
    tough:[{unit:'citadel_warden',hpScale:1.8,defense:4}],
    failure:({state})=>state.captured.get('citadel')==='enemy'?'반란군이 무위 성채를 점령했습니다.':undefined,
  },
};

export function protectedFailure(s:BattleState,ids:string[]){
  const fallen=ids.map(id=>s.find(id)).find(u=>u&&!u.alive);
  return fallen?`${fallen.name}이(가) 퇴각했습니다.`:undefined;
}
