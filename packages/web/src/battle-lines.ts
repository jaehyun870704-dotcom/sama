import type {BattleState} from '../../core/src/index.ts';
import {raceGap} from './campaign-rules.ts';

/** Non-blocking battle chatter: short lines with a portrait that float over the map
 * when the board reaches a moment, the way the classic games keep the story moving
 * mid-battle without stopping play. */
export type LineWhen=
  |{turn:number}
  |{retreat:string}
  |{firstEnemyDown:true}
  |{enemiesBelow:number}
  |{reach:{unit:string;region:string}}
  |{allyAhead:true}
  |{lockedBy:string};
export interface BattleLine {id:string;when:LineWhen;speaker:string;text:string}

export const battleLines:Record<string,BattleLine[]>={
  'S1-01':[
    {id:'open-1',when:{turn:1},speaker:'사마방',text:'창고를 내주면 마을이 굶는다. 랑아, 의를 잘 지켜라.'},
    {id:'open-2',when:{turn:1},speaker:'사마의',text:'아버님, 습격대는 세 갈래입니다. 가까운 무리부터 끊으면 나머지는 머뭇거릴 겁니다.'},
    {id:'first',when:{firstEnemyDown:true},speaker:'사마랑',text:'하나 물러났다! 의야, 피난민 쪽을 놓치지 마라.'},
    {id:'turn3',when:{turn:3},speaker:'사마방',text:'서두르지 마라. 한 칸 물러서는 것도 싸움이다.'},
    {id:'cleared',when:{enemiesBelow:1},speaker:'사마의',text:'습격대는 흩어졌다. 이제 창고와 민병을 수습하자.'},
    {id:'warehouse',when:{reach:{unit:'sima_yi',region:'warehouse'}},speaker:'사마의',text:'곡식은 지켰다… 하지만 난세는 이제 막 시작이다.'},
  ],
  'S1-07':[
    {id:'open-1',when:{turn:1},speaker:'조진',text:'중달, 양평관 앞 산길이 좁다. 기병은 큰길로, 보병은 숲길로 나눠야겠지.'},
    {id:'open-2',when:{turn:1},speaker:'사마의',text:'숲에는 오두미도의 제주가 있습니다. 주문에 홀리기 전에 책략으로 먼저 치겠습니다.'},
    {id:'yang',when:{turn:2},speaker:'양앙',text:'위군이 산을 넘었다고? 이 관문은 한 발짝도 못 넘는다!'},
    {id:'taoist',when:{retreat:'vanguard_bow'},speaker:'조진',text:'제주가 물러났다! 숲길이 열렸다.'},
    {id:'camp',when:{enemiesBelow:4},speaker:'사마의',text:'전초 진지만 남았습니다. 양앙을 끌어내면 수비망은 무너집니다.'},
    {id:'yang-down',when:{retreat:'yang_ang'},speaker:'조진',text:'양앙이 꺾였다! 남은 무리를 정리하자.'},
  ],
  'S1-08':[
    {id:'open-1',when:{turn:1},speaker:'조진',text:'우군 장수들이 먼저 성채를 차지하려 서두른다. 공을 빼앗기면 위에서 말이 많아질 걸세.'},
    {id:'open-2',when:{turn:1},speaker:'사마의',text:'공보다 길이 먼저입니다. 수비대장을 먼저 꺾어야 성채가 우리 것이 됩니다.'},
    {id:'guard',when:{turn:3},speaker:'성채 수비대장',text:'성문을 굳게 닫아라! 다가오는 놈은 반격으로 하나씩 꺾어라!'},
    {id:'ahead',when:{allyAhead:true},speaker:'조진',text:'우군이 앞서 간다! 서둘러야 하네, 중달.'},
    {id:'reinforce',when:{turn:6},speaker:'사마의',text:'북문으로 증원이 옵니다. 다리를 막고 성채로 곧장 가십시오.'},
    {id:'chief-down',when:{retreat:'zhang_lu'},speaker:'사마의',text:'수비대장이 물러났다. 지금이다, 성채로!'},
  ],
  'S1-10':[
    {id:'open-1',when:{turn:1},speaker:'사마의',text:'조운의 앞·뒤·좌·우를 모두 막아야 합니다. 강물과 바위도 벽이 됩니다.'},
    {id:'open-2',when:{turn:1},speaker:'조운',text:'상산의 조자룡이 여기 있다! 조조의 목을 내놓아라!'},
    {id:'rise',when:{turn:3},speaker:'조진',text:'강물이 둑을 넘었다! 남쪽 들판이 여울이 되어 발이 묶인다.'},
    {id:'rise-2',when:{turn:5},speaker:'사마의',text:'물이 더 차오릅니다. 들판 한가운데로는 가지 마십시오.'},
    {id:'lock',when:{lockedBy:'flood/lock'},speaker:'조진',text:'조운이 묶였다! 승상, 지금 고개로 오르십시오!'},
    {id:'exit',when:{reach:{unit:'cao_cao',region:'exit'}},speaker:'사마의',text:'승상께서 고개를 넘으셨다. 물러나라, 강물이 길을 덮는다.'},
  ],
  'S1-09':[
    {id:'open-1',when:{turn:1},speaker:'조진',text:'강변 두 칸을 두 턴 동안 지키면 부교가 선다. 공병을 앞세우게.'},
    {id:'open-2',when:{turn:1},speaker:'사마의',text:'승상은 다리가 놓일 때까지 강가에서 기다리실 겁니다. 뒤쪽 추격 기병을 먼저 막겠습니다.'},
    {id:'pursuit',when:{turn:3},speaker:'사마의',text:'남서쪽에서 추격대가 옵니다. 승상의 뒤를 비우지 마십시오.'},
    {id:'bridge',when:{reach:{unit:'cao_cao',region:'bridge_span'}},speaker:'조진',text:'부교가 섰다! 승상께서 건너신다, 길을 열어라!'},
    {id:'huang',when:{turn:5},speaker:'황충',text:'늙었다고 얕보지 마라. 이 활은 아직 정군산의 피를 기억한다!'},
    {id:'huang-down',when:{retreat:'huang_zhong'},speaker:'조진',text:'황충이 물러났다! 야곡 출구가 열렸다.'},
  ],
};

function met(state:BattleState,w:LineWhen){
  if('turn' in w)return state.turn>=w.turn&&state.currentSide==='player';
  if('retreat' in w){const u=state.find(w.retreat);return !!u&&!u.alive;}
  if('firstEnemyDown' in w)return [...state.units.values()].some(u=>u.side==='enemy'&&!u.alive);
  if('enemiesBelow' in w)return state.living('enemy').length<w.enemiesBelow&&state.turn>1;
  if('reach' in w){const u=state.find(w.reach.unit);return !!u?.alive&&state.map.regionCoords(w.reach.region).some(c=>c.x===u.pos.x&&c.y===u.pos.y);}
  if('lockedBy' in w)return state.firedEvents.has(w.lockedBy);
  const g=raceGap(state);return !!g&&g.ally!==undefined&&g.hero!==undefined&&g.ally<g.hero;
}
/** Lines whose moment has come and that have not been shown yet, in script order. */
export function dueLines(stageId:string,state:BattleState,seen:ReadonlySet<string>){
  return (battleLines[stageId]??[]).filter(l=>!seen.has(l.id)&&met(state,l.when));
}
