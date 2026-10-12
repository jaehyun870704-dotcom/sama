/**
 * 사마의 그림은 나이에 따라 바꾸지 않는다 — 어느 장이든 최종(성인) 사마의 그림 하나만 쓴다.
 * 예전에 상편 앞 세 장에서 쓰던 「소년 사마의」 그림 열쇠가 남아 있으면 성인 사마의로 돌린다.
 * (setStoryEra·resetStoryEra는 부르는 곳이 남아 있어 그대로 두되 아무것도 바꾸지 않는다.)
 */
export function setStoryEra(_stageId:string|undefined){/* 나이에 따른 그림 교체 없음 */}
export function resetStoryEra(){/* 나이에 따른 그림 교체 없음 */}
export const youngSimaYi=()=>false;

const FINAL_KEYS:Record<string,string>={sima_yi_young:'sima_yi','소년 사마의':'사마의'};
/** 그림을 찾을 때 쓰는 열쇠(id·이름). 소년 사마의 열쇠는 언제나 성인 사마의로. */
export function artKey(key:string){return FINAL_KEYS[key]??key;}
