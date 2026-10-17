import {describe,expect,it} from 'vitest';
import {promotionPoints,promotionOffer,promote} from '../src/promotion.ts';
import {freshCampaign,xpAtLevel,levelInfo} from '../src/progression.ts';
import {storyClassAt} from '../src/sortie.ts';

describe('승급 포인트',()=>{
 it('천명 조건 하나마다 1, 극한 승리마다 1 더 — 기록에서 셈하므로 두 번 받지 않는다',()=>{
  expect(promotionPoints({'S1-01:normal':[1,2,2],'S1-01:extreme':[1],'Z1-01:normal':[1,2,3]},{}).earned).toBe(2+1+1);
  expect(promotionPoints({'S1-01:normal':[1,2,3]},{promoSpent:2}).left).toBe(1);
 });
 it('다음 승급 레벨이 4레벨 안이면 모자란 레벨만큼 써서 곧장 승급한다',()=>{
  const c=freshCampaign();c.xp.sima_yi=xpAtLevel(5);
  expect(promotionOffer(c,'sima_yi')?.cost).toBe(3);
  const before=storyClassAt('sima_yi',5);
  expect(promote(c,{'S1-01:normal':[1]},'sima_yi')).toBeUndefined();
  const o=promote(c,{'S1-01:normal':[1,2,3],'S1-02:normal':[1]},'sima_yi');
  expect(o?.need).toBe(8);expect(levelInfo(c.xp.sima_yi!).level).toBe(8);expect(storyClassAt('sima_yi',8)).not.toBe(before);expect(c.promoSpent).toBe(3);
  c.xp.sima_yi=xpAtLevel(9);expect(promotionOffer(c,'sima_yi')).toBeUndefined();
 });
});
