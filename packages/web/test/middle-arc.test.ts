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
describe('중편 · 양양 전투',()=>{
 it('starts the eight-turn hold on its own and shows the turns left',()=>{
  const s=open('S2-04');expect(s.state.survivalClocks.get('xiangyang')).toBe(1);expect(s.phase).toContain('8턴 남음');
  expect(s.state.get('gate_captain').pos).toEqual({x:4,y:6});
  for(const u of s.state.living('player'))expect(s.state.map.tileAt(u.pos).terrain).not.toBe('wall');
 });
});
import {subject} from '../src/stage-rules.ts';
describe('중편 · 맹달 차단전',()=>{
 it('trades fatigue against relief armies at the march choice',()=>{
  const forced=open('S2-05');expect(forced.state.activeDialogue).toBe('march');
  const hero=forced.state.get('sima_yi'),full=hero.hp;forced.act({kind:'choose',nodeId:'march',optionId:'forced'});
  expect(hero.hp).toBeLessThan(full);expect(forced.state.find('shu_relief')).toBeUndefined();
  const steady=open('S2-05');steady.act({kind:'choose',nodeId:'march',optionId:'steady'});
  expect(steady.state.get('sima_yi').hp).toBe(steady.state.get('sima_yi').stats.maxHp);expect(steady.state.get('shu_relief').alive).toBe(true);
 });
 it('walls Xincheng with a breakable gate, towers and a ram for the sons',()=>{
  const s=open('S2-05'),units=[...s.state.units.values()];
  expect(units.some(u=>u.id.startsWith('gate_'))).toBe(true);expect(units.some(u=>u.id.startsWith('tower_'))).toBe(true);expect(units.some(u=>u.unitClass==='ram')).toBe(true);
  expect(s.state.get('sima_shi').side).toBe('ally');
 });
 it('fails after the fourteenth turn and names the fallen with the right particle',()=>{
  expect(subject('사마소')).toBe('사마소가');expect(subject('맹달')).toBe('맹달이');
 });
});
