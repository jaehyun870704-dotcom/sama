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
describe('중편 · 동구 전투',()=>{
 it('launches the granted ships on the river, not the bank',()=>{
  const s=open('S2-02'),ships=s.state.living('ally').filter(u=>u.unitClass==='navy');
  expect(ships).toHaveLength(2);for(const b of ships)expect(s.state.map.tileAt(b.pos).terrain).toBe('water');
 });
 it('warns of the first lightning on turn one so it can be dodged',()=>{
  const s=open('S2-02');expect(s.state.telegraphs).toHaveLength(1);expect(s.state.telegraphs[0]!.at).toBe(2);expect(s.state.telegraphs[0]!.label).toBe('낙뢰');
 });
});
describe('중편 · 광릉 전투',()=>{
 it('fields Cao Zhen without Sima Yi and requires Gao Shou before the escape',()=>{
  const s=open('S2-03');expect(s.state.find('sima_yi')).toBeUndefined();expect(s.state.get('cao_zhen').side).toBe('player');
  expect(s.state.victory.map(v=>v.type)).toEqual(['retreat','reach']);expect(s.state.get('cao_pi').range).toEqual([0,0]);
 });
});
