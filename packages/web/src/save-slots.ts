/** Manual battle save slots beside the automatic one. Each slot keeps the
 * replayable save plus a small label so the list can be shown without loading. */
/** 저장 칸 수: 천명의 길·천명의 원정·신장수를 없애고 그 기록 몫만큼 늘렸다(사용자 결정 2026-10-12: 10칸 이상). */
export const SLOT_COUNT=20;
/** 없앤 모드(천명의 길·천명의 원정)의 기록 키: 칸에 담지 않고, 남아 있으면 지운다. */
export const RETIRED_KEYS=['sama-scenario-v1','sama-run-v1'] as const;
export const slotKey=(i:number)=>`sama-slot-${i}`;
export interface SlotMeta {title:string;turn:number;difficulty:string;at:number}
export interface SlotRecord {meta:SlotMeta;save:unknown}
export function readSlot(raw:string|null):SlotRecord|undefined{
  try{const v=raw?JSON.parse(raw) as SlotRecord:undefined;return v&&v.meta&&typeof v.meta.title==='string'&&v.save?v:undefined;}catch{return undefined;}
}
export function slotLabel(r:SlotRecord|undefined,now=Date.now()){
  if(!r)return '비어 있음';
  const min=Math.round((now-r.meta.at)/60000),ago=min<1?'방금':min<60?`${min}분 전`:min<1440?`${Math.round(min/60)}시간 전`:`${Math.round(min/1440)}일 전`;
  return `${r.meta.title} · ${r.meta.turn}턴 · ${r.meta.difficulty==='extreme'?'극한':'일반'} · ${ago}`;
}

// ─────────────────────────────────────────────── 통째 저장(v42)
/** 저장 칸 하나가 게임 전체(천명의 길 진행·연구·보물·성장·진행 중 전투)를 통째로 담는다. */
export interface FullSlot {full:1;meta:{title:string;where:string;at:number;hero?:number;mandate?:number};keys:Record<string,string>}
const OWN=(k:string)=>k.startsWith('sama-')&&!k.startsWith('sama-slot-')&&!(RETIRED_KEYS as readonly string[]).includes(k);
export function snapshotKeys():Record<string,string>{
  const out:Record<string,string>={};
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&OWN(k)){const v=localStorage.getItem(k);if(v!==null)out[k]=v;}}}catch{/* 저장소 없음 */}
  return out;
}
export function restoreKeys(keys:Record<string,string>){
  const old:string[]=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&OWN(k)&&k!=='sama-settings-v1')old.push(k);}
  // 도중에 저장 공간이 모자라 실패하면 원래 기록으로 되돌린다(반쯤 지워진 진행을 남기지 않는다).
  const backup:Record<string,string>={};for(const k of old){const v=localStorage.getItem(k);if(v!==null)backup[k]=v;}
  try{
    for(const k of old)localStorage.removeItem(k);
    for(const [k,v] of Object.entries(keys))if(OWN(k))localStorage.setItem(k,v);
  }catch(e){
    for(const k of Object.keys(keys))if(OWN(k)&&!(k in backup))localStorage.removeItem(k);
    for(const [k,v] of Object.entries(backup)){try{localStorage.setItem(k,v);}catch{/* 되돌리기도 못 하면 남은 대로 */}}
    throw e;
  }
}
export function readFull(raw:string|null):FullSlot|undefined{
  try{const v=raw?JSON.parse(raw) as FullSlot:undefined;return v&&v.full===1&&v.meta&&typeof v.meta.title==='string'&&v.keys&&typeof v.keys==='object'?v:undefined;}catch{return undefined;}
}
export function agoText(at:number,now=Date.now()){const min=Math.round((now-at)/60000);return min<1?'방금':min<60?`${min}분 전`:min<1440?`${Math.round(min/60)}시간 전`:`${Math.round(min/1440)}일 전`;}
/** 없앤 모드의 기록을 지운다: 저장소에 남은 키와, 저장 칸 안에 담겨 있던 몫까지(그만큼 칸을 더 둘 수 있다). */
export function purgeRetired(){
  try{
    for(const k of RETIRED_KEYS)localStorage.removeItem(k);
    for(let i=1;i<=SLOT_COUNT;i++){const raw=localStorage.getItem(slotKey(i)),full=readFull(raw);if(!full)continue;
      let changed=false;for(const k of RETIRED_KEYS)if(k in full.keys){delete full.keys[k];changed=true;}
      if(changed)localStorage.setItem(slotKey(i),JSON.stringify(full));}
  }catch{/* 저장소 없음 */}
}
/** 이 게임이 쓰는 저장 공간(대략의 바이트)과 칸마다의 크기. */
export function storageUse(){
  let total=0;const slots:number[]=[];
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith('sama-'))continue;const n=(k.length+(localStorage.getItem(k)?.length??0))*2;total+=n;const m=/^sama-slot-(\d+)$/.exec(k);if(m)slots[Number(m[1])]=n;}}catch{/* 저장소 없음 */}
  return {total,slots};
}
