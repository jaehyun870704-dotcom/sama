/** Manual battle save slots beside the automatic one. Each slot keeps the
 * replayable save plus a small label so the list can be shown without loading. */
export const SLOT_COUNT=3;
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
