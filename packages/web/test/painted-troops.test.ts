import {describe,it,expect} from 'vitest';
import {paintedTroopArt,paintedTroopFrame} from '../src/painted-troops.ts';
import {classSprite} from '../src/codex-ui.ts';
describe('dedicated troop art',()=>{
  it('retains distinct rattan evolution rows without metal armor overlays',()=>{
    for(const [row,c] of (['rattan','rattanElite','wuguoRattan'] as const).entries()){
      expect(paintedTroopArt[c]?.row).toBe(row);
      expect(classSprite(c)).toContain('--rattan-v2-atlas');
      expect(classSprite(c)).not.toContain('cx-armor');
    }
  });
  it('maps battle attack, walk and reaction poses to their own action columns',()=>{
    expect([0,1,2,3].map(paintedTroopFrame)).toEqual([0,1,1,0]);
    expect([4,5,6,7].map(paintedTroopFrame)).toEqual([2,0,2,0]);
    expect([8,9,10,11].map(paintedTroopFrame)).toEqual([3,0,3,0]);
  });
});
import {lookText} from '../src/troop-evolution.ts';
import {hasPaintedMotion} from '../src/troops.ts';
describe('dedicated art replaces armor-overlay rules',()=>{
  it('describes each rattan tier by its own painted look, not steel or gold armor',()=>{
    for(const c of ['rattan','rattanElite','wuguoRattan'] as const){const t=lookText(c);expect(t).toContain('등');expect(t).not.toMatch(/강철|금빛|기본 차림/);}
  });
  it('lets the battlefield use the painted walk and facing frames',()=>{
    expect(hasPaintedMotion('rattan')).toBe(true);expect(hasPaintedMotion('wuguoRattan')).toBe(true);
  });
});
