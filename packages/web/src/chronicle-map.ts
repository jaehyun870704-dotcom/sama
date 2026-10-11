/**
 * 연의 지도 — 편(상·중·하)마다 연의(정사) 줄기와 선택분기(가상 시나리오) 갈림길을 한 판에 그린다.
 * 구조는 조조전 Online의 연의 화면(장 카드가 선으로 이어지고, 갈라진 길은 조건을 채워야 열린다)을 참고했고,
 * 장·길·조건은 이 게임의 연의 32장과 fate.ts의 갈림길(ROUTES)을 그대로 쓴다.
 *
 * - 줄기(붉은 선): 그 편의 연의 장.
 * - 가지(푸른 선): 그 편의 갈림길에서 갈라지는 가상 길. 길마다 가상 전장 몇 개와 우두머리로 끝난다.
 *   정사 줄기에서 갈라지는 길은 갈림 장(앵커)을 이기면, 앞 편의 가상 길에서 이어지는 길은 그 길의 우두머리를 꺾으면 열린다.
 */
import {ROUTES,FATE_POINTS,routeById,type Route,type Tale} from './fate.ts';

export type MapNodeKind='story'|'fork'|'tale'|'boss';
export interface MapNode {
  id:string;kind:MapNodeKind;arc:1|2|3;title:string;
  /** 연의 장 id(줄기) */
  stage?:string;
  /** 가상 길과 그 길에 이르는 앞 편의 선택(전투를 만들 때 쓴다) */
  route?:string;routePath?:Partial<Record<1|2|3,string>>;
  tale?:Tale;
  /** 바로 앞 칸(선으로 잇고, 열림 조건이 된다) */
  prev?:string;
  /** 판 위 자리(칸 단위) */
  col:number;row:number;
  line:'trunk'|'branch';
  /** 가지 첫 칸: 열리는 조건 — 연의 장 id 또는 'boss:<앞 길 id>' */
  gate?:string;
  /** 가지 안 몇 번째(권장 레벨 계산) */
  step?:number;
}
/** 줄기에서 갈라지는 자리: 상편은 '출사 전야'(S1-04) 다음, 중편·하편은 앞 편의 마지막 장을 이기면. */
export const FORK_ANCHOR:Record<1|2|3,string>={1:'S1-04',2:'S1-11',3:'S2-14'};
/** 정사 길(줄기)의 id */
const HISTORY:Record<1|2|3,string>={1:'refuse',2:'wei',3:'patience'};

/** 앞 편까지의 선택: 이 길에 이르려면 어떤 길들을 지나왔나. */
function pathTo(r:Route):Partial<Record<1|2|3,string>>{
  const out:Partial<Record<1|2|3,string>>={[r.act]:r.id};let cur=r;
  while(cur.act>1){const parentId=cur.after?.[0];const parent=routeById(parentId);if(!parent)break;out[parent.act]=parent.id;cur=parent;}
  for(const a of [1,2] as const)if(a<r.act&&!out[a])out[a]=HISTORY[a];
  return out;
}
/** 그 편에 그릴 가상 길들: 신세력 전용 길은 빼고, 정사 줄기의 자식 → 앞 편 가상 길의 자식 순. */
export function arcRoutes(arc:1|2|3){
  const virt=ROUTES.filter(r=>r.act===arc&&!r.history&&!r.custom);
  const fromTrunk=virt.filter(r=>arc===1||(r.after??[]).includes(HISTORY[(arc-1) as 1|2]));
  return [...fromTrunk,...virt.filter(r=>!fromTrunk.includes(r))];
}
/**
 * 한 편의 지도. stages: 그 편 연의 장 id(순서대로)와 이름.
 * 줄기는 두 줄로 지그재그(조조전 화면처럼), 가지는 오른쪽에 길마다 한 줄.
 */
export function arcMap(arc:1|2|3,stages:ReadonlyArray<{id:string;name:string}>):MapNode[]{
  const nodes:MapNode[]=[];
  // 중편·하편은 맨 위에 갈림길 칸을 둔다(앞 편 끝에서 갈라진다).
  const fork=arc>1;
  if(fork)nodes.push({id:`fork:${arc}`,kind:'fork',arc,title:FATE_POINTS[arc].title,col:0,row:0,line:'trunk'});
  const top=fork?1:0;
  stages.forEach((s,i)=>nodes.push({id:s.id,kind:'story',arc,title:s.name,stage:s.id,col:i%2===0?0:1,row:top+i,line:'trunk',...(i>0?{prev:stages[i-1]!.id}:fork?{prev:`fork:${arc}`}:{})}));
  const anchorRow=arc===1?stages.findIndex(s=>s.id===FORK_ANCHOR[1]):0;
  // 상편은 갈림 장 옆에 갈림길 칸을 둔다(그 장을 이기면 열린다).
  if(arc===1)nodes.push({id:'fork:1',kind:'fork',arc,title:FATE_POINTS[1].title,col:2.2,row:anchorRow,line:'branch',prev:FORK_ANCHOR[1],gate:FORK_ANCHOR[1]});
  arcRoutes(arc).forEach((r,k)=>{
    const col=arc===1?3.4+k*1.2:2.2+k*1.2,startRow=(arc===1?anchorRow:0)+1;
    const parent=r.after?.[0],gate=arc===1?FORK_ANCHOR[1]:parent&&routeById(parent)?.history?FORK_ANCHOR[arc]:`boss:${parent}`;
    const head=arc===1?'fork:1':`fork:${arc}`,path=pathTo(r);
    let prev=head;
    r.tales.forEach((t,j)=>{const id=t.id;nodes.push({id,kind:'tale',arc,title:t.title,route:r.id,routePath:path,tale:t,prev,col,row:startRow+j,line:'branch',step:j,...(j===0?{gate}:{})});prev=id;});
    nodes.push({id:`boss:${r.id}`,kind:'boss',arc,title:`${r.region.boss.name} 결전`,route:r.id,routePath:path,prev,col,row:startRow+r.tales.length,line:'branch',step:r.tales.length,...(r.tales.length?{}:{gate})});
  });
  return nodes;
}
/** 가지 칸의 권장 레벨: 갈림 장의 권장 레벨에서 한 칸마다 +1, 우두머리 +1. */
export function branchLevel(node:MapNode,anchorLevel:number){return anchorLevel+1+(node.step??0)+(node.kind==='boss'?1:0);}
/** 원정 전장 층(지역·적 구성): 편마다 6층. */
export function branchFloor(node:MapNode){return Math.min(18,(node.arc-1)*6+(node.kind==='boss'?6:2+(node.step??0)));}

// ─── 가지에서 이긴 기록(연의 칸): 가상 전장 id 또는 'boss:<길 id>'
const KEY='sama-branches-v1';
export function branchWins():Set<string>{try{const v=JSON.parse(localStorage.getItem(KEY)??'[]') as unknown;return new Set(Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'&&x.length<60):[]);}catch{return new Set();}}
export function recordBranchWin(id:string){try{const s=branchWins();s.add(id);localStorage.setItem(KEY,JSON.stringify([...s]));}catch{/* storage optional */}}

// ─── 장마다 승리/출진 횟수(조조전 화면의 '승리/출진')
const STATS='sama-chronicle-stats-v1';
export function nodeStats():Record<string,[number,number]>{try{const v=JSON.parse(localStorage.getItem(STATS)??'{}') as Record<string,unknown>;const out:Record<string,[number,number]>={};for(const [k,x] of Object.entries(v))if(Array.isArray(x)&&x.length===2&&x.every(n=>Number.isInteger(n)&&n>=0))out[k]=[x[0],x[1]];return out;}catch{return {};}}
export function countSortie(id:string,won:boolean){try{const s=nodeStats(),[w,t]=s[id]??[0,0];s[id]=won?[w+1,t]:[w,t+1];localStorage.setItem(STATS,JSON.stringify(s));}catch{/* storage optional */}}
