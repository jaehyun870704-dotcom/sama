/**
 * 천명 조건(옛 인장) — 규칙판 14(2026-10-17)에서 더 어렵게.
 * 장 데이터의 표현식(turn_limit:N · player_losses_lt:N · enemy_retreat_count:N)을 조인다:
 * 턴 제한은 85%(내림, 최소 3턴) · 허용 퇴각은 하나 줄이고(최소 「퇴각 없이」) · 격파 수는 하나 늘린다.
 * 「clear」(승리)·대상 지정 조건은 그대로다. 장마다 따로 정한 판정(stage-rules seals)은 손대지 않는다.
 */
import {parseSeal,evaluate,type BattleState} from '../../core/src/index.ts';

export function tightenSeal(expr:string):string{
  const [head,arg]=expr.split(':'),n=Number(arg);
  if(head==='turn_limit'&&Number.isFinite(n))return `turn_limit:${Math.max(3,Math.floor(n*.85))}`;
  if(head==='player_losses_lt'&&Number.isFinite(n))return `player_losses_lt:${Math.max(1,n-1)}`;
  if(head==='enemy_retreat_count'&&Number.isFinite(n))return `enemy_retreat_count:${n+1}`;
  return expr;
}
/** 조인 기준으로 판정한 천명 조건 칸. */
export function tightSeals(state:BattleState,difficulty:'normal'|'extreme'):number[]{
  if(state.outcome!=='victory')return [];
  const out:number[]=[];
  for(const seal of state.stage.seals){const cond=parseSeal(tightenSeal(difficulty==='normal'?seal.normal:seal.extreme));if(cond===null||evaluate(state,cond))out.push(seal.slot);}
  return out;
}
/** 화면용 기준: 「9턴 안」 「퇴각 없이」 「적 5부대 격파」. 승리만이면 빈 문자열. */
export function sealRequirement(expr:string,tight:boolean):string{
  const e=tight?tightenSeal(expr):expr,[head,arg]=e.split(':'),n=Number(arg);
  if(head==='turn_limit')return `${n}턴 안`;
  if(head==='player_losses_lt')return n<=1?'퇴각 없이':`퇴각 ${n-1}부대 이하`;
  if(head==='no_player_losses')return '퇴각 없이';
  if(head==='enemy_retreat_count')return `적 ${n}부대 격파`;
  return '';
}
