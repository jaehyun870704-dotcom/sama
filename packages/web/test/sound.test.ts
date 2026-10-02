import {describe,it,expect} from 'vitest';
import {recipeNames,recipes,renderVariants,zhengNote,SR,pluck,rng} from '../src/sound-bank.ts';
import {soundsFor,strategySound,type SoundEvent} from '../src/sound-events.ts';
import {supportOptions} from '../src/troops.ts';
const stats=(b:Float32Array)=>{let pk=0,s=0;for(const x of b){expect(Number.isFinite(x)).toBe(true);pk=Math.max(pk,Math.abs(x));s+=x*x;}return {pk,rms:Math.sqrt(s/b.length)};};
describe('synthesized sound bank',()=>{
 it.each(recipeNames)('%s renders audible, unclipped, varied takes',name=>{
  const [a,b]=renderVariants(name,2);const sa=stats(a!);
  expect(sa.pk).toBeGreaterThan(.3);expect(sa.pk).toBeLessThanOrEqual(1);expect(sa.rms).toBeGreaterThan(.01);
  expect(a!.length/SR).toBeLessThan(4.5);
  let diff=0;for(let i=0;i<Math.min(a!.length,b!.length);i++)diff+=Math.abs(a![i]!-b![i]!);expect(diff/a!.length).toBeGreaterThan(.001);
 });
 it('is deterministic per seed so saved replays sound the same',()=>{expect(renderVariants('clash',1,5)[0]).toEqual(renderVariants('clash',1,5)[0]);});
 it('plucks a string at the requested pitch',()=>{
  // Autocorrelation peak: the period of the strongest repetition is the pitch.
  const b=pluck(220,.5,rng(3),.5),start=Math.floor(SR*.05);let best=0,lag=0;
  for(let l=60;l<400;l++){let c=0;for(let i=start;i<start+2000;i++)c+=b[i]!*b[i+l]!;if(c>best){best=c;lag=l;}}
  expect(SR/lag).toBeGreaterThan(205);expect(SR/lag).toBeLessThan(235);
  expect(stats(zhengNote(62)).pk).toBeGreaterThan(.5);
 });
});
describe('battle sound events',()=>{
 const known=(shots:{name:string}[])=>shots.every(s=>recipes[s.name]);
 it('gives every troop class an attack, impact, move and selection sound',()=>{
  for(const c of [...supportOptions,'navy','civilian','engineer']){
   for(const kind of ['attack-start','impact','move','select'] as const){const shots=soundsFor({kind,unitClass:c,hit:true},()=>.1);expect(shots.length,c+' '+kind).toBeGreaterThan(0);expect(known(shots)).toBe(true);}
  }
 });
 it('voices each strategy element differently',()=>{
  expect(strategySound('fire')).toBe('fire');expect(strategySound('windDragon')).toBe('wind');expect(strategySound('flood')).toBe('water');
  expect(strategySound('thunder')).toBe('thunder');expect(strategySound('bind')).toBe('earth');expect(strategySound('confuse')).toBe('confuse');
  expect(strategySound('mend')).toBe('heal');expect(strategySound('fortify')).toBe('buff');expect(strategySound('rockfall')).toBe('boulder-hit');expect(strategySound('heal')).toBe('heal');
 });
 it('separates misses, guards, criticals and the ceremony around a battle',()=>{
  expect(soundsFor({kind:'impact',unitClass:'infantry',hit:false})[0]!.name).toBe('evade');
  expect(soundsFor({kind:'impact',unitClass:'infantry',hit:true,guard:true}).some(s=>s.name==='guard')).toBe(true);
  expect(soundsFor({kind:'impact',unitClass:'infantry',hit:true,critical:true}).some(s=>s.duck)).toBe(true);
  expect(soundsFor({kind:'turn',side:'player'}).map(s=>s.name)).toContain('war-drum');expect(soundsFor({kind:'turn',side:'enemy'}).map(s=>s.name)).toContain('enemy-drum');
  for(const kind of ['battle-start','victory','defeat','breach','retreat','repair','duel','ui','page','strategy-start'] as SoundEvent['kind'][])expect(known(soundsFor({kind,unitClass:'infantry'}))).toBe(true);
 });
});
