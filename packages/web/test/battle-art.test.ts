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
import {crispZoom,groundScaleMode,unitTint} from '../src/pixel-look.ts';
import {outlineFrames} from '../src/sprite-atlas.ts';
describe('dot clarity',()=>{
 it('snaps zoom so every ground dot covers whole pixels',()=>{
  for(const res of [1,1.5,2,3])for(const z of [.7,.78,.9,1,1.25,1.5,1.8]){
   if(z*2*res<2)continue;
   const s=crispZoom(z,res),k=s*2*res;expect(k).toBeCloseTo(Math.round(k));expect(groundScaleMode(s,res)).toBe('nearest');expect(s).toBeLessThanOrEqual(1.8);
  }
  expect(crispZoom(1.1,1,1)).toBeCloseTo(1.5);expect(crispZoom(1.4,1,-1)).toBe(1);expect(crispZoom(1,2,1)).toBe(1);expect(crispZoom(.8,3)).toBeCloseTo(5/6);
  expect(crispZoom(.7,1)).toBe(.7);expect(groundScaleMode(.7,1)).toBe('linear');
 });
 it('draws a round dark rim around silhouettes without touching the body',()=>{
  const w=21,data=new Uint8ClampedArray(w*w*4);
  for(let y=8;y<13;y++)for(let x=8;x<13;x++)data.set([250,240,230,255],(y*w+x)*4);
  const out=outlineFrames({width:w,height:w,data},3).data,at=(x:number,y:number)=>[...out.subarray((y*w+x)*4,(y*w+x)*4+4)];
  expect(at(10,10)).toEqual([250,240,230,255]);
  expect(at(7,10)[3]).toBe(255);expect(at(7,10)[0]).toBeLessThan(40);
  expect(at(6,10)[3]).toBe(255);expect(at(5,10)[3]).toBeGreaterThan(64);expect(at(5,10)[3]).toBeLessThan(255);expect(at(3,10)[3]).toBe(0);expect(at(5,5)[3]).toBe(0);
 });
 it('keeps side tints light and greys out units that already acted',()=>{
  const enemy=unitTint({id:'e',side:'enemy',hasActed:false}),done=unitTint({id:'e',side:'enemy',hasActed:true});
  expect(enemy>>16).toBe(255);expect(enemy&255).toBeGreaterThan(0xc0);
  expect(done>>16).toBeLessThan(0xb0);expect(unitTint({id:'p',side:'player',hasActed:false})).toBe(0xffffff);
 });
});
