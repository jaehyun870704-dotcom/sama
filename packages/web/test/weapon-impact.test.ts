import {describe,expect,it} from 'vitest';
import {equippedWeaponShape,weaponImpact,weaponShape} from '../src/weapon-impact.ts';

const unit=(id:string,name:string,unitClass:string)=>({id,name,unitClass} as Parameters<typeof weaponShape>[0]);

describe('weapon-shaped battle impact',()=>{
  it('uses iconic officer weapons instead of a generic cavalry slash',()=>{
    expect(weaponShape(unit('zhang_fei','장비','spearman'))).toBe('spear');
    expect(weaponShape(unit('guan_yu','관우','cavalry'))).toBe('polearm');
    expect(weaponShape(unit('fan_kuai','번쾌','cavalry'))).toBe('axe');
    expect(weaponShape(unit('hao_zhao','학소','crossbow'))).toBe('crossbow');
    expect(weaponShape(unit('of3','안량','cavalry'))).toBe('polearm');
    expect(weaponShape(unit('boss','가후','strategist'))).toBe('fan');
  });
  it('keeps an officer signature weapon ahead of currently equipped treasure',()=>{
    expect(weaponShape(unit('cao_zhen','조진','infantry'),'tigerSpear')).toBe('sword');
    expect(weaponShape(unit('zhang_fei','장비','spearman'),'yitian')).toBe('spear');
  });
  it('uses equipped weapons only for units without a signature weapon',()=>{
    expect(weaponShape(unit('support_1','지원병','infantry'),'tigerSpear')).toBe('spear');
    expect(equippedWeaponShape('repeatingCrossbow')).toBe('crossbow');
    expect(equippedWeaponShape('meteorHammer')).toBe('blunt');
  });
  it('maps each shape to a distinct readable hit trace',()=>{
    expect(weaponImpact('spear')).toBe('pierce');
    expect(weaponImpact('polearm')).toBe('cleave');
    expect(weaponImpact('bow')).toBe('arrow');
    expect(weaponImpact('crossbow')).toBe('bolt');
    expect(weaponImpact('fan')).toBe('fan');
  });
  it('keeps ranged troop classes shooting even when the signature weapon is a sword',()=>{
    expect(weaponImpact(weaponShape(unit('zhou_yu','주유','archer')))).toBe('arrow');
    expect(weaponImpact(weaponShape(unit('sima_zhao','사마소','crossbow')))).toBe('bolt');
    expect(weaponImpact(weaponShape(unit('archer_1','궁병','archer'),'yitian'))).toBe('arrow');
    expect(weaponShape(unit('huang_zhong','황충','archer'))).toBe('bow');
  });
});
