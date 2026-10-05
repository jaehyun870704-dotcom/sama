import {describe,it,expect} from 'vitest';
import {paintedTroopArt,paintedTroopFrame} from '../src/painted-troops.ts';
import {classSprite} from '../src/codex-ui.ts';
import {lookText} from '../src/troop-evolution.ts';
describe('dedicated troop art',()=>{
  it('uses separate elephant and harness designs, never horse armor overlays',()=>{
    for(const [row,c] of (['elephant','warElephant','elephantKing'] as const).entries()){
      expect(paintedTroopArt[c]?.row).toBe(row);
      expect(classSprite(c)).toContain('--complete-08-atlas');
      expect(classSprite(c)).not.toContain('cx-armor');
      expect(lookText(c)).toContain('하네스');
      expect(lookText(c)).not.toContain('깃발');
    }
    expect(new Set(['elephant','warElephant','elephantKing'].map(c=>lookText(c as 'elephant'))).size).toBe(3);
  });
  it('retains distinct rattan evolution rows without metal armor overlays',()=>{
    for(const [row,c] of (['rattan','rattanElite','wuguoRattan'] as const).entries()){
      expect(paintedTroopArt[c]?.row).toBe(row+5);
      expect(classSprite(c)).toContain('--complete-07-atlas');
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
    expect(paintedFrames('spearman-v2')).toBe(THRUST);expect([1,2,4,5].map(p=>paintedTroopFrame(p,THRUST))).toEqual([1,2,2,0]);
  });
  it('maps the four new families to their own sheets by tier',()=>{
    for(const [a,b,c,sheet,row] of [['infantry','shieldGuard','royalGuard','complete-01',0],['spearman','pikeman','halberdier','complete-01',4],['archer','longbow','sharpshooter','complete-03',0],['cavalry','lancer','tigerRider','complete-02',0]] as const){
      expect(paintedTroopArt[a]).toEqual({sheet,row,rows:8});expect(paintedTroopArt[b]?.row).toBe(row+1);expect(paintedTroopArt[c]?.row).toBe(row+2);
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
    for(const [a,c,aSheet,aRow,cSheet,cRow] of [['assassin','wraith','complete-07',2,'complete-07',4],['slinger','boulderCorps','complete-03',6,'complete-08',6],['shaman','demonKing','complete-05',0,'complete-05',2],['maiden','celestial','complete-05',3,'complete-05',5],['rattan','wuguoRattan','complete-07',5,'complete-07',7]] as const){
      expect(paintedTroopArt[a]).toEqual({sheet:aSheet,row:aRow,rows:8});expect(paintedTroopArt[c]).toEqual({sheet:cSheet,row:cRow,rows:8});expect(lookText(c)).not.toMatch(/강철|금빛|기본 차림/);
    }
  });
  it('packs sheets with pieces apart (siege engine and crew) as one frame per cell',()=>{
    const slinger=paintedTroopSheets.find(s=>s.id==='slinger-v1');expect(slinger&&'union' in slinger&&slinger.union).toBe(true);
    expect(paintedTroopSheets.find(s=>s.id==='complete-08')).toHaveProperty('union',true);
  });
});

import {CHARGE} from '../src/painted-troops.ts';
describe('cavalry gallops between cells and thrusts on attack',()=>{
  it('uses the gallop column for walking and wind-up, the thrust column for the strike',()=>{
    expect(paintedFrames('cavalry-v2')).toBe(CHARGE);expect([1,2,4,5,8].map(p=>paintedTroopFrame(p,CHARGE))).toEqual([1,2,1,0,3]);
  });
});

describe('병종 차트로 늘린 병종', () => {
  it('gives every chart class a Korean name, its own art row and a 조조전 grade', async () => {
    const {CHART_ROLES} = await import('../src/chart-troops.ts');
    const {paintedTroopArt, paintedTroopSheets} = await import('../src/painted-troops.ts');
    const {classNames, recruitPool} = await import('../src/troops.ts');
    const {VARIANTS, gradeProfileOf, evolvedClass, tierOf} = await import('../../core/src/index.ts');
    for (const c of Object.keys(CHART_ROLES) as Array<keyof typeof CHART_ROLES>) {
      expect(VARIANTS[c], c).toBeDefined();
      expect(classNames[c], c).toMatch(/[가-힣]/);
      const art = paintedTroopArt[c];
      expect(art, c).toBeDefined();
      const sheet = paintedTroopSheets.find((s) => s.id === art!.sheet);
      expect(sheet && art!.row < sheet.rows, c).toBe(true);
      expect(gradeProfileOf(c).grades).toHaveLength(5);
    }
    for (const c of ['swordsman', 'lord', 'commander', 'dancer', 'transport', 'yellowTurban'] as const) expect(recruitPool).toContain(c);
    expect(evolvedClass('swordsman', 40)).toBe('swordSaint');
    expect(tierOf('swordSaint')).toBe(5);
    expect(evolvedClass('infantry', 30)).toBe('ironInfantry');
  });
});
