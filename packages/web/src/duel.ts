export type DuelAction='attack'|'guard'|'rally'|'special';
export type DuelKind='duel'|'debate';
export interface DuelFighter {id:string;name:string;stat:number;hp:number;maxHp:number;energy:number}
export interface DuelRound {round:number;action:DuelAction;enemyAction:DuelAction;dealt:number;taken:number}
export interface DuelState {kind:DuelKind;round:number;player:DuelFighter;enemy:DuelFighter;history:DuelRound[];result?:'win'|'lose'|'draw'}
export const actionNames={attack:'공격',guard:'방어',rally:'기합',special:'필살기'};
export const debateNames={attack:'논박',guard:'반론',rally:'숙고',special:'논파'};
export function duelActionNames(kind:DuelKind){return kind==='debate'?debateNames:actionNames;}
export function duelLine(kind:DuelKind,action:DuelAction){return (kind==='debate'?{
 attack:'그 주장은 앞뒤가 맞지 않소.',guard:'근거부터 차근차근 살펴봅시다.',rally:'논점을 정리할 시간이 필요하오.',special:'이 증거로 결론을 내리겠소!',
 }:{attack:'빈틈을 보였구나!',guard:'그 일격, 받아내겠다.',rally:'아직 승부는 끝나지 않았다!',special:'이 일격에 승부를 건다!'} as Record<DuelAction,string>)[action];}
export function newDuel(kind:DuelKind,a:{id:string;name:string;stat:number},b:{id:string;name:string;stat:number}):DuelState{
  const fighter=(u:typeof a):DuelFighter=>({...u,hp:160,maxHp:160,energy:0});
  return {kind,round:0,player:fighter(a),enemy:fighter(b),history:[]};
}
export function duelRound(s:DuelState,action:DuelAction){
  if(s.result||s.round>=5)return false;
  if(!Object.hasOwn(actionNames,action)||action==='special'&&s.player.energy<2)return false;
  const enemyAction:DuelAction=s.enemy.energy>=2?'special':(['attack','rally','guard','attack','attack'] as const)[(s.round+s.enemy.stat%3)%5]!;
  const damage=(a:DuelFighter,b:DuelFighter,move:DuelAction,defend:DuelAction)=>{
    if(move==='guard'||move==='rally'||a.hp<=0)return 0;
    const base=Math.max(8,22+(a.stat-b.stat)*.45);
    return Math.round(base*(move==='special'?1.8:1)*(1+a.energy*.12)*(defend==='guard'?.35:1));
  };
  const dealt=damage(s.player,s.enemy,action,enemyAction),taken=damage(s.enemy,s.player,enemyAction,action);
  s.player.hp=Math.max(0,s.player.hp-taken);s.enemy.hp=Math.max(0,s.enemy.hp-dealt);
  for(const [u,move] of [[s.player,action],[s.enemy,enemyAction]] as const){if(move==='rally')u.energy=Math.min(3,u.energy+2);else if(move==='special')u.energy-=2;else if(move==='guard')u.energy=Math.min(3,u.energy+1);}
  s.round++;s.history.push({round:s.round,action,enemyAction,dealt,taken});
  if(s.round===5)s.result=s.player.hp>s.enemy.hp?'win':s.player.hp<s.enemy.hp?'lose':'draw';
  return true;
}
