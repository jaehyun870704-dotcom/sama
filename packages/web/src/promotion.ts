/**
 * 승급 포인트(2026-10-17).
 *
 * 병종 승급은 원래 레벨로만 열린다(classes.ts EVOLUTION). 승급 포인트는 그 문을 조금 일찍 연다:
 * - 얻기: 연의 장에서 얻은 천명 조건(옛 인장) 하나마다 1, 극한으로 이긴 장마다 1 더. 기록(progress)에서 셈하므로 두 번 받지 않는다.
 * - 쓰기: 다음 승급 레벨이 4레벨 안에 있는 사씨 일가 장수(사마의·사마랑·사마방·조진)를 그 레벨로 곧장 끌어올린다.
 *   모자란 레벨 하나마다 1포인트. 경험치는 그 레벨이 막 된 값으로 맞춘다(병종은 레벨로 정해지므로 화면·전투가 모두 같은 병종을 본다).
 */
import {nextEvolution} from '../../core/src/index.ts';
import {levelInfo,xpAtLevel,type Campaign} from './progression.ts';
import {storyClassAt} from './sortie.ts';

/** 조기 승급을 허락하는 거리: 다음 승급 레벨까지 이만큼 안이면 쓸 수 있다. */
export const PROMO_REACH=4;
export const PROMO_OFFICERS=['sima_yi','sima_lang','sima_fang','cao_zhen'] as const;

/** 기록에서 셈한 승급 포인트: 얻은 몫 − 쓴 몫. */
export function promotionPoints(progress:Readonly<Record<string,readonly number[]>>,c:Pick<Campaign,'promoSpent'>){
  let earned=0;
  for(const [k,seals] of Object.entries(progress)){if(!Array.isArray(seals)||!/^S\d-\d\d:/.test(k))continue;earned+=new Set(seals).size;if(k.endsWith(':extreme'))earned+=1;}
  const spent=c.promoSpent??0;
  return {earned,spent,left:Math.max(0,earned-spent)};
}

/** 이 장수를 지금 조기 승급할 수 있나: 다음 병종·필요 레벨·드는 포인트. */
export function promotionOffer(c:Pick<Campaign,'xp'>,officer:string){
  const level=levelInfo(c.xp[officer]??0).level,from=storyClassAt(officer,level),next=nextEvolution(from);
  if(!next)return undefined;
  const gap=next.level-level;if(gap<1||gap>PROMO_REACH)return undefined;
  return {officer,level,from,to:next.to,need:next.level,cost:gap};
}

/** 포인트를 써서 승급한다. 됐으면 그 제안을, 안 되면 undefined. */
export function promote(c:Campaign,progress:Readonly<Record<string,readonly number[]>>,officer:string){
  const offer=promotionOffer(c,officer);if(!offer)return undefined;
  if(promotionPoints(progress,c).left<offer.cost)return undefined;
  c.xp[officer]=Math.max(c.xp[officer]??0,xpAtLevel(offer.need));c.promoSpent=(c.promoSpent??0)+offer.cost;
  return offer;
}
