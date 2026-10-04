import {describe,it,expect} from 'vitest';
import {startPersuasion,speak,FIT,APPROACHES,PERSUADE_GOAL,PERSUADE_ROUNDS,reaction} from '../src/persuade.ts';

describe('장수 설득',()=>{
 it('always offers a way to win: each round has an approach this temper takes to',()=>{
  for(const name of ['허저','장합','순욱','조상','위연','등애','장료','가규']){const p=startPersuasion(name,1234);
   expect(p.options).toHaveLength(PERSUADE_ROUNDS);for(const o of p.options){expect(new Set(o).size).toBe(3);expect(o.some(a=>FIT[p.temper][a]>=20)).toBe(true);}}
 });
 it('wins by speaking to the temper and loses by speaking past it',()=>{
  const best=startPersuasion('순욱',7);
  while(best.status==='talking'){const o=best.options[best.round]!;speak(best,[...o].sort((a,b)=>FIT[best.temper][b]-FIT[best.temper][a])[0]!);}
  expect(best.status).toBe('won');expect(best.heart).toBeGreaterThanOrEqual(PERSUADE_GOAL);
  const worst=startPersuasion('순욱',7);
  while(worst.status==='talking'){const o=worst.options[worst.round]!;speak(worst,[...o].sort((a,b)=>FIT[worst.temper][a]-FIT[worst.temper][b])[0]!);}
  expect(worst.status).toBe('lost');
 });
 it('gives old friends a warmer start, halves a repeated approach, and ignores approaches not on offer',()=>{
  expect(startPersuasion('사마사',1).heart).toBeGreaterThan(startPersuasion('위연',1).heart);
  const p=startPersuasion('허저',3),a=p.options[0]![0]!;const off=APPROACHES.find(x=>!p.options[0]!.includes(x))!;
  expect(speak(p,off)).toBe(0);expect(p.round).toBe(0);
  const first=speak(p,a);if(p.status==='talking'&&p.options[1]!.includes(a)&&first>0)expect(speak(p,a)).toBe(Math.round(first/2));
 });
 it('reacts in proportion to how far the heart moved',()=>{expect(reaction(30,0).emote).toBe('!');expect(reaction(10,0).emote).toBe('…');expect(reaction(-20,0).emote).toBe('분노');});
 it('is the same talk for the same seed',()=>{expect(startPersuasion('조진',99)).toEqual(startPersuasion('조진',99));});
});
