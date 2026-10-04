import {describe,it,expect} from 'vitest';
import {Session} from '../src/session.ts';
import type {Deployment} from '../src/progression.ts';

const base=():Deployment=>({levels:{sima_yi:6,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{}});
const recruit={id:'rc_of1',name:'학소',unitClass:'shieldBow' as const,level:5,xp:0,hp:.8,officer:true as const};

describe('회차에서 얻은 장수·보물은 연의 전장에 곧바로 실린다',()=>{
 it('fields recruited officers beside 사마의 and applies run relics',()=>{
  const plain=new Session(2,'normal',215,'survival',4,{...base(),scenario:{chapter:'S1-03'}});
  const s=new Session(2,'normal',215,'survival',4,{...base(),scenario:{chapter:'S1-03',relics:['lamellar'],recruits:[recruit]}});
  const u=s.state.find('rc_of1')!;
  expect(u.name).toBe('학소');expect(u.side).toBe('player');expect(u.alive).toBe(true);
  expect(u.hp).toBe(Math.round(u.stats.maxHp*.8));
  expect(s.state.get('sima_yi').stats.defense).toBe(plain.state.get('sima_yi').stats.defense+3);
  const again=Session.load(s.save());expect(again.state.find('rc_of1')?.name).toBe('학소');
 });
});
