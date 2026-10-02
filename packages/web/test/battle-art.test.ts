import {describe,it,expect} from 'vitest';
import {classCries,reactions,cryFor,isCrisis} from '../src/emotes.ts';
import {materialOf,biomeFor,noiseField,blendWeights,MATERIALS,smooth} from '../src/terrain-paint.ts';
import {supportOptions} from '../src/troops.ts';
describe('troop emotes',()=>{
 it('gives every playable class its own battle cry',()=>{
  for(const cls of [...supportOptions,'navy','civilian'])expect(classCries[cls],cls).toBeDefined();
  expect(new Set(Object.values(classCries).map(e=>e.text)).size).toBe(Object.keys(classCries).length);
  for(const e of [...Object.values(classCries),...Object.values(reactions)])expect(e.text,'한자 없이 한글로').not.toMatch(/[\u4e00-\u9fff]/);
  expect(cryFor('cavalry').shape).toBe('burst');expect(cryFor('archer').text).toContain('사격');
  expect(cryFor('fengshui',true,'heal')).toBe(reactions.heal);expect(cryFor('engineer',true,'repair')).toBe(reactions.repair);
  expect(cryFor('infantry',true,'fire')).toBe(classCries.strategist);expect(cryFor('unknown')).toBe(classCries.infantry);
 });
 it('covers every status a unit can gain and flags crises',()=>{
  for(const kind of ['confusion','immobile','bound','bleed','burn','shock','seal','guard','haste','rally'])expect(reactions[kind],kind).toBeDefined();
  expect(isCrisis(20,90,40)).toBe(true);expect(isCrisis(0,90,90)).toBe(false);expect(isCrisis(60,90,10)).toBe(false);
 });
});
describe('painted terrain',()=>{
 it('maps every terrain to a material and picks stage biomes',()=>{
  for(const t of ['plain','road','forest','mountain','hill','water','rapids','bridge','fort','gate','wall'] as const)expect(MATERIALS).toContain(materialOf(t));
  expect(biomeFor('S1-06').name).toContain('황토');expect(biomeFor('T07').name).toContain('장강');expect(biomeFor('S1-04').tint).toBeDefined();
 });
 it('blends tile materials into normalized, sharpened weights',()=>{
  const n=noiseField(5);expect(Math.min(...n)).toBeGreaterThanOrEqual(0);expect(Math.max(...n)).toBeLessThanOrEqual(1);
  const mats=Uint8Array.from([0,3,0,3]),w=new Float32Array(MATERIALS.length),raw=new Float32Array(MATERIALS.length);
  blendWeights(mats,2,2,0,0,w,raw);expect(w[0]).toBeCloseTo(1);
  blendWeights(mats,2,2,.5,.5,w,raw);expect(w[0]!+w[3]!).toBeCloseTo(1);expect(w[0]).toBeCloseTo(.5);
  blendWeights(mats,2,2,.3,.5,w,raw);expect(w[0]!).toBeGreaterThan(raw[0]!);
  expect(smooth(0,1,.5)).toBeCloseTo(.5);
 });
});
