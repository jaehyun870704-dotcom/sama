/**
 * 제갈량전 연의 지도 — 본편 34장(줄기)과 선택분기 갈림길(가지)을 한 판에 그린다.
 * 사마의전 연의 지도(chronicle-map.ts)와 같은 틀: 줄기는 두 줄 지그재그(붉은 선), 갈림 장 오른쪽에 갈림길 칸 →
 * 가상 전장 둘 → 우두머리가 한 줄로 이어진다(푸른 선). 화면은 main.ts(showZhuge)가 맡고, 여기는 판 모양·열림 규칙·보상만 둔다.
 */
import {ZHUGE_FORKS,branchNode,forkOf,type BranchReward} from './zhuge/branches.ts';
import {addGold,addSupply,newShopItem,gearName,type Campaign} from './progression.ts';
import {consumable} from '../../core/src/index.ts';

export type ZMapKind='story'|'fork'|'tale'|'boss';
export interface ZMapNode {
  id:string;kind:ZMapKind;title:string;
  /** 본편 장 · 가지 칸의 스테이지 id(갈림길 칸은 없음) */
  stage?:string;
  /** 갈림길 칸 · 가지 칸이 속한 갈림 지점 */
  fork?:string;
  /** 바로 앞 칸(선으로 잇고, 열림 조건이 된다) */
  prev?:string;
  /** 판 위 자리(칸 단위) */
  col:number;row:number;
  line:'trunk'|'branch';
  /** 1 상편(와룡) · 2 하편(출사표) */
  arc:1|2;
}
/** 상편과 하편 사이의 빈 줄(편 이름을 쓴다). */
export const ARC_GAP=0.8;
/** 가지 칸 사이 간격(칸 단위). */
const BRANCH_COL=[2.3,3.5,4.7,5.9] as const;

/**
 * 판: trunk는 본편 장(순서대로). 상편(Z1) 다음 줄에 하편(Z2)이 이어지고, 갈림 장마다 오른쪽으로 가지가 뻗는다.
 * 갈림길 칸 id는 fork id(zf1…), 가지 칸 id는 스테이지 id(ZB1-01…).
 */
export function zhugeMapNodes(trunk:ReadonlyArray<{id:string;title:string}>):ZMapNode[]{
  const nodes:ZMapNode[]=[];
  trunk.forEach((s,i)=>{const arc:1|2=s.id.startsWith('Z2')?2:1;nodes.push({id:s.id,kind:'story',title:s.title,stage:s.id,col:i%2,row:i+(arc===2?ARC_GAP:0),line:'trunk',arc,...(i>0?{prev:trunk[i-1]!.id}:{})});});
  for(const f of ZHUGE_FORKS){
    const anchor=nodes.find(n=>n.id===f.anchor);if(!anchor)continue;
    nodes.push({id:f.id,kind:'fork',title:f.title,fork:f.id,prev:f.anchor,col:BRANCH_COL[0],row:anchor.row,line:'branch',arc:anchor.arc});
    let prev=f.id;
    f.nodes.forEach((id,k)=>{const b=branchNode(id)!;nodes.push({id,kind:k===f.nodes.length-1?'boss':'tale',title:b.title,stage:id,fork:f.id,prev,col:BRANCH_COL[Math.min(3,k+1)]!,row:anchor.row,line:'branch',arc:anchor.arc});prev=id;});
  }
  return nodes;
}
/**
 * 칸의 상태. won(id): 그 스테이지를 이겼나(일반·극한 어느 쪽이든). open(id): 본편 장이 열렸나(앞 장을 이김).
 * 갈림길은 갈림 장을 이기면 열리고, 가지 칸은 갈림 장을 이기고 앞 칸(첫 칸은 갈림길)을 이기면 열린다.
 */
export function zhugeNodeState(n:ZMapNode,won:(id:string)=>boolean,open:(id:string)=>boolean):{open:boolean;won:boolean}{
  if(n.kind==='story')return {open:open(n.stage!),won:won(n.stage!)};
  const f=forkOf(n.fork)!,anchorWon=won(f.anchor);
  if(n.kind==='fork')return {open:anchorWon,won:anchorWon};
  const prevOk=!n.prev||n.prev===f.id||won(n.prev);
  return {open:anchorWon&&prevOk,won:won(n.id)};
}
/** 열리지 않은 가지 칸의 안내. */
export function zhugeLockText(n:ZMapNode,won:(id:string)=>boolean,anchorTitle:(id:string)=>string){
  const f=forkOf(n.fork);if(!f)return '앞 장을 이겨야 열린다.';
  if(!won(f.anchor))return `본편 「${anchorTitle(f.anchor)}」을(를) 이기면 갈림길이 열린다.`;
  return '앞 가상 전장을 이겨야 열린다.';
}
/** 보상 글(칸 정보 · 결과 화면). */
export function rewardParts(r:BranchReward){
  return {gold:`금 +${r.gold.toLocaleString()}`,gear:gearName(r.gear),supplies:Object.entries(r.supplies).map(([id,n])=>`${consumable(id)?.name??id} ×${n}`)};
}
/** 다시 이기면 금만 셋에 하나. */
export const replayGold=(r:BranchReward)=>Math.round(r.gold/3);
/**
 * 가지 칸을 이겼을 때 보상을 준다: 처음이면 금(제갈량전) + 상점 장비 한 점 + 소모품, 다시 이기면 금 1/3.
 * 돌려주는 것은 결과 화면에 쓸 글.
 */
export function grantBranchReward(c:Campaign,id:string,first:boolean):string[]{
  const b=branchNode(id);if(!b)return [];
  const r=b.reward;
  if(!first){const g=replayGold(r);addGold(c,'Z',g);return [`금 +${g.toLocaleString()} (제갈량전 · 다시 이김)`];}
  addGold(c,'Z',r.gold);newShopItem(c,r.gear);
  for(const [sid,n] of Object.entries(r.supplies))addSupply(c,sid,n);
  const p=rewardParts(r);
  return [`금 +${r.gold.toLocaleString()} (제갈량전)`,`장비 「${p.gear}」을(를) 얻었다`,...(p.supplies.length?[`소모품 ${p.supplies.join(' · ')}`]:[])];
}
