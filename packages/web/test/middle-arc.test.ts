import {describe,it,expect} from 'vitest';
import {Session,chapters,campaignOrder} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';

const at=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
const open=(id:string,d:'normal'|'extreme'='normal')=>new Session(at(id),d,215,'survival',4,deployment(freshCampaign(),true));
describe('중편 · 무위 반란 진압전',()=>{
 it('follows the upper arc in campaign order',()=>{expect(campaignOrder.indexOf(at('S2-01'))).toBe(campaignOrder.indexOf(at('S1-11'))+1);});
 it('holds the citadel with a warden and sends no siege rams to a defence',()=>{
  const s=open('S2-01');expect(s.state.get('citadel_warden').pos).toEqual({x:5,y:7});
  expect([...s.state.units.values()].some(u=>u.unitClass==='ram')).toBe(false);
  expect(s.state.get('rebel_shaman').traits).toContain('strategyReflect');
  expect(s.sealNames[0]).toBe('반란 진압');
 });
});
