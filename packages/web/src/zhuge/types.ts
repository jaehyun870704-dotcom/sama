/**
 * 제갈량전 장 묶음(batch)의 형식. 장을 여럿이 나눠 만들 수 있게, 장마다 필요한 것을 묶음 파일 하나에 모은다.
 * 묶음 파일(batch-*.ts)은 데이터와 타입만 가져온다(다른 모듈을 값으로 가져오지 않는다 — 순환 import 방지).
 */
import type {MapFile,StageDef,UnitClass} from '../../../core/src/index.ts';
import type {StageRules} from '../stage-rules.ts';
import type {Temper} from '../duel.ts';

export interface ZhugeChapter {stage:StageDef;map:MapFile;year:string;label:string;quote:string}
/** 장수록에 없는 인물(능력·별호·성격·세력·열전·자). 능력은 이 게임이 직접 매긴다. */
export interface ZhugePerson {
  name:string;epithet:string;
  /** 무력·지력·통솔·정치·매력(1~99, 지력 100은 제갈량 한 사람·무력 100은 여포 한 사람) */
  stats:[number,number,number,number,number];
  temper:Temper;
  /** 도감 세력 */
  side:'wei'|'shu'|'wu'|'other';
  /** 인물열전(정사 기준, 연의에만 있는 인물은 첫 문장에 밝힌다) */
  bio:string;
  /** 자(사서에 전하는 것만) */
  courtesy?:string;
  woman?:boolean;
  /** 병종을 고정할 때(없으면 능력으로 정한다) */
  unitClass?:UnitClass;
}
/** 직접 지휘하는 장수(출진 명부). id는 z_로 시작한다. */
export interface ZhugeOfficer {id:string;name:string;unitClass:UnitClass;strategies?:string[]}
export interface ZhugeNpc {name:string;unitClass:UnitClass;side:'allyAi'|'ally';stages:string[]}
export interface ZhugeBatch {
  chapters:ZhugeChapter[];
  /** 장마다의 규칙(천명 조건 이름·지켜야 할 대상·날씨·표지 등) */
  rules:Record<string,StageRules>;
  /** 장의 기본 레벨(적의 레벨 기준 · 처음 하는 사람의 출진 레벨) */
  levels:Record<string,number>;
  /** 장마다 다른 병종(예: 피난민) */
  stageClass?:Record<string,Record<string,UnitClass>>;
  /** 이 묶음에서 처음 나오는 출진 장수 */
  roster?:ZhugeOfficer[];
  /** 이 묶음의 전장에 나오는 우군·편입 아군(NPC 도감) */
  npcs?:ZhugeNpc[];
  /** 이 묶음에서 처음 나오는 인물 */
  people?:ZhugePerson[];
}
