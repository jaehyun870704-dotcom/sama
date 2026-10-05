import {describe,it,expect} from 'vitest';
import {paintedTroopArt,paintedTroopFrame} from '../src/painted-troops.ts';
import {classSprite} from '../src/codex-ui.ts';
import {lookText} from '../src/troop-evolution.ts';
describe('dedicated troop art',()=>{
  it('uses separate elephant and harness designs, never horse armor overlays',()=>{
    for(const [row,c] of (['elephant','warElephant','elephantKing'] as const).entries()){
      expect(paintedTroopArt[c]?.row).toBe(row);
      expect(classSprite(c)).toContain('--elephant-v1-atlas');
      expect(classSprite(c)).not.toContain('cx-armor');
      expect(lookText(c)).toContain('하네스');
      expect(lookText(c)).not.toContain('깃발');
    }
    expect(new Set(['elephant','warElephant','elephantKing'].map(c=>lookText(c as 'elephant'))).size).toBe(3);
  });
  it('retains distinct rattan evolution rows without metal armor overlays',()=>{
    for(const [row,c] of (['rattan','rattanElite','wuguoRattan'] as const).entries()){
      expect(paintedTroopArt[c]?.row).toBe(row);
      expect(classSprite(c)).toContain('--rattan-v3-atlas');
      expect(classSprite(c)).not.toContain('cx-armor');
    }
  });
  it('maps battle attack, walk and reaction poses to their own action columns',()=>{
    const f=(p:number)=>paintedTroopFrame(p);
    expect([0,1,2,3].map(f)).toEqual([0,1,1,1]);
    expect([4,5,6,7].map(f)).toEqual([2,0,2,0]);
    expect([8,9,10,11].map(f)).toEqual([3,0,3,0]);
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

import {paintedFrames,SHOOT,THRUST} from '../src/painted-troops.ts';
describe('sheet-specific frame use',()=>{
  it('archers aim then loose and never walk with the shooting frame; spearmen thrust with the stride frame',()=>{
    expect(paintedFrames('archer-v1')).toBe(SHOOT);expect([1,2,3,4,5].map(p=>paintedTroopFrame(p,SHOOT))).toEqual([1,2,2,0,0]);
    expect(paintedFrames('spearman-v1')).toBe(THRUST);expect([1,2,4,5].map(p=>paintedTroopFrame(p,THRUST))).toEqual([1,2,2,0]);
  });
  it('maps the four new families to their own sheets by tier',()=>{
    for(const [a,b,c,sheet] of [['infantry','shieldGuard','royalGuard','infantry-v2'],['spearman','pikeman','halberdier','spearman-v1'],['archer','longbow','sharpshooter','archer-v1'],['cavalry','lancer','tigerRider','cavalry-v1']] as const){
      expect(paintedTroopArt[a]).toEqual({sheet,row:0,rows:3});expect(paintedTroopArt[b]?.row).toBe(1);expect(paintedTroopArt[c]?.row).toBe(2);
      expect(lookText(a)).not.toMatch(/강철|금빛|기본 차림/);expect(lookText(c)).not.toMatch(/강철|금빛/);
    }
  });
});

import {RUN,CASTER,paintedTroopSheets} from '../src/painted-troops.ts';
describe('second batch: assassin, slinger, shaman, maiden and the new rattan sheet',()=>{
  it('runs with the second column and strikes with the third for assassins and rattan troops',()=>{
    expect(paintedFrames('assassin-v1')).toBe(RUN);expect(paintedFrames('rattan-v3')).toBe(RUN);
    expect([1,2,3,4,5].map(p=>paintedTroopFrame(p,RUN))).toEqual([2,2,2,1,0]);
  });
  it('maps casters and the five new families to their own sheets',()=>{
    expect(paintedFrames('shaman-v1')).toBe(CASTER);expect(paintedFrames('maiden-v1')).toBe(CASTER);
    for(const [a,c,sheet] of [['assassin','wraith','assassin-v1'],['slinger','boulderCorps','slinger-v1'],['shaman','demonKing','shaman-v1'],['maiden','celestial','maiden-v1'],['rattan','wuguoRattan','rattan-v3']] as const){
      expect(paintedTroopArt[a]?.sheet).toBe(sheet);expect(paintedTroopArt[c]).toEqual({sheet,row:2,rows:3});expect(lookText(c)).not.toMatch(/강철|금빛|기본 차림/);
    }
  });
  it('packs sheets with pieces apart (siege engine and crew) as one frame per cell',()=>{
    const slinger=paintedTroopSheets.find(s=>s.id==='slinger-v1');expect(slinger&&'union' in slinger&&slinger.union).toBe(true);
    expect(paintedTroopSheets.find(s=>s.id==='elephant-v1')).not.toHaveProperty('union');
  });
});
