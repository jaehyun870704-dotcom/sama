import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign,equipSlot,equippedItems,gearKey,treasureInfo,canWear} from '../src/progression.ts';

describe('얻은 장비는 계통에 맞으면 누구든 단다',()=>{
 it('영입 장수(이름)도 장비를 달고, 전장에 서면 그 장비를 입는다',()=>{
  const c=freshCampaign();c.treasures.push('serpentSpear');
  expect(equipSlot(c,'장합',treasureInfo('serpentSpear').slot,'serpentSpear','cavalry')).toBe(true);
  expect(equippedItems(c,'장합')).toEqual(['serpentSpear']);
  const ch=chapters.findIndex(x=>x.stage.id==='S1-05');
  const make=(withGear:boolean)=>{const d=deployment(c,true);if(!withGear)delete d.loadouts;
   d.scenario={chapter:'H1-S1-05',recruits:[{id:'rc_zhang',name:'장합',unitClass:'cavalry',level:6,xp:0,hp:1}]};
   return new Session(ch,'normal',215,'survival',6,d).state.find('rc_zhang')!;};
  const plain=make(false),geared=make(true);
  expect(geared.stats.attack).toBeGreaterThan(plain.stats.attack);
  expect(geared.traits).toContain('gear:pierceLine');
 });
 it('장비는 한 사람만 단다: 다른 사람이 달면 앞사람에게서 빠진다',()=>{
  const c=freshCampaign();c.treasures.push('shop:shield:1#1');const slot=treasureInfo('shop:shield:1#1').slot;
  equipSlot(c,'sima_lang',slot,'shop:shield:1#1');equipSlot(c,'곽회',slot,'shop:shield:1#1');
  expect(equippedItems(c,'sima_lang')).toEqual([]);expect(equippedItems(c,'곽회')).toEqual(['shop:shield:1#1']);
 });
 it('계통에 맞지 않는 장비는 달지 못한다(이유를 알려 준다)',()=>{
  const c=freshCampaign();c.treasures.push('yitian','fan');
  expect(canWear('cao_zhen','yitian')).toEqual({ok:false,reason:'군주·보병·적병·해적계만'});
  expect(equipSlot(c,'cao_zhen','weapon','yitian')).toBe(false);
  expect(equipSlot(c,'sima_yi','weapon','fan')).toBe(true);
  expect(equipSlot(c,'sima_lang','weapon','yitian')).toBe(true);
 });
 it('연의 장수는 이름으로 와도 같은 자리를 쓴다',()=>{expect(gearKey({id:'u7',name:'사마랑'})).toBe('sima_lang');expect(gearKey({id:'rc_x',name:'위연'})).toBe('위연');});
});
