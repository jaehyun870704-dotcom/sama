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
