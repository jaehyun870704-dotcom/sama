import {describe,expect,it} from 'vitest';
import {elementImpactProfile,type Element} from '../src/battle-fx.ts';

describe('strategy impact profiles',()=>{
  it('gives every element a complete, finite contact profile',()=>{
    for(const el of ['fire','water','wind','thunder','earth','support','heal'] as Element[]){
      const profile=elementImpactProfile(el);
      for(const value of Object.values(profile))expect(Number.isFinite(value),el).toBe(true);
    }
  });

  it('keeps healing still while thunder and earth feel heaviest',()=>{
    expect(elementImpactProfile('heal')).toMatchObject({stop:0,knock:0});
    expect(elementImpactProfile('thunder').stop).toBeGreaterThan(elementImpactProfile('wind').stop);
    expect(elementImpactProfile('earth').knock).toBeGreaterThan(elementImpactProfile('fire').knock);
  });
});
