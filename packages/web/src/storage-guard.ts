/**
 * 저장 실패 알림 — 저장 공간이 가득 찼거나 브라우저가 저장을 막으면, 진행이 조용히 사라지지 않게 알린다.
 * 게임 곳곳의 저장(전투·연의·천명의 길·원정·설정)은 실패해도 놀이를 멈추지 않도록 오류를 삼킨다.
 * 그래서 쓰기 하나하나가 아니라 localStorage 쓰기 자체를 한 곳에서 지켜보고, 실패하면 이벤트를 낸다.
 */
export const STORAGE_FAIL='sama:storage-fail';
export interface StorageFail {key:string;quota:boolean}
/** 저장 공간이 가득 찬 오류인가(브라우저마다 이름·번호가 다르다). */
export function isQuotaError(e:unknown){
  const x=e as {name?:string;code?:number}|null;
  return !!x&&(x.name==='QuotaExceededError'||x.name==='NS_ERROR_DOM_QUOTA_REACHED'||x.code===22||x.code===1014);
}
let installed=false;
/** 한 번만 건다. 원래 동작(실패하면 오류를 던짐)은 그대로 두고, 알림만 더한다. */
export function guardStorage(target:typeof globalThis=globalThis){
  if(installed||typeof target.Storage==='undefined')return;installed=true;
  const proto=target.Storage.prototype,set=proto.setItem;
  proto.setItem=function(this:Storage,key:string,value:string){
    try{set.call(this,key,value);}
    catch(e){try{target.dispatchEvent?.(new CustomEvent<StorageFail>(STORAGE_FAIL,{detail:{key,quota:isQuotaError(e)}}));}catch{/* 알림이 안 돼도 원래 오류는 던진다 */}throw e;}
  };
}
/** 알림 문장. */
export function storageFailText(f:StorageFail){
  return f.quota?'저장 공간이 가득 차 진행이 저장되지 않았습니다. 💾 저장·불러오기에서 안 쓰는 칸을 지워 주세요.'
    :'브라우저가 저장을 막아 진행이 저장되지 않았습니다(사생활 보호 모드·저장 차단 설정을 확인해 주세요).';
}
