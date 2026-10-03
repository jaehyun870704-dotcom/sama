import {describe,it,expect} from 'vitest';
import {stepsBetween,offscreenCell,W,type Cell,type IsoScene} from '../src/story-iso.ts';

const blocked=new Set(['3,0','3,1','3,2','3,3']);
const scene={passable:([c,r]:Cell)=>!blocked.has(`${c},${r}`)&&c>=0&&r>=0} as unknown as IsoScene;
const adjacent=(a:Cell,b:Cell)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;

describe('이야기 무대의 걸음',()=>{
 it('walks one cell per step, along one axis then the other',()=>{
  const path=stepsBetween(scene,[0,5],[2,7],()=>false);
  expect(path.at(-1)).toEqual([2,7]);expect(path).toHaveLength(4);
  [[0,5] as Cell,...path].reduce((a,b)=>{expect(adjacent(a,b)).toBe(true);return b;});
 });
 it('goes around furniture and people instead of through them',()=>{
  const path=stepsBetween(scene,[1,1],[5,1],c=>c[0]===2&&c[1]===1);
  expect(path.at(-1)).toEqual([5,1]);
  for(const c of path)expect(blocked.has(`${c[0]},${c[1]}`)).toBe(false);
  expect(path.some(c=>c[0]===2&&c[1]===1)).toBe(false);
 });
 it('enters and leaves from beyond the screen edge at the same height',()=>{
  const left=offscreenCell([8,8],'left'),right=offscreenCell([8,8],'right');
  const x=([c,r]:Cell)=>640+(c+0.5-(r+0.5))*40;
  expect(x(left)).toBeLessThan(0);expect(x(right)).toBeGreaterThan(W);
  expect(Math.abs((left[0]+left[1])-16)).toBeLessThanOrEqual(1);
 });
});
