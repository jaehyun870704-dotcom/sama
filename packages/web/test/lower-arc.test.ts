import {describe,it,expect} from 'vitest';
import {Session,chapters,campaignOrder} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {stageRules} from '../src/stage-rules.ts';

const at=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
const open=(id:string,d:'normal'|'extreme'='normal')=>new Session(at(id),d,215,'survival',4,deployment(freshCampaign(),true));
describe('하편 · 요수 전투',()=>{
 it('follows the middle arc in campaign order',()=>{expect(campaignOrder.indexOf(at('S3-01'))).toBe(campaignOrder.indexOf(at('S2-14'))+1);expect(open('S3-01').state.stage.arc).toBe('lower');});
 it('swings the Yan line south when the banners stand at the south ford, then collapses it on the north crossing',()=>{
  const s=open('S3-01');expect(s.phase).toContain('깃발대를 남쪽 여울로');
  s.state.get('feint_banner_0').pos={x:10,y:11};s.act({kind:'endPhase'});
  expect(s.state.firedEvents.has('liaoshui/feint')).toBe(true);expect(s.state.get('yan_line_0').behavior).toBe('race');expect(s.state.get('yan_line_0').goalRegion).toBe('south_guard');
  s.state.get('sima_yi').pos={x:13,y:3};s.act({kind:'endPhase'});
  expect(s.state.firedEvents.has('liaoshui/collapse')).toBe(true);expect(s.state.hasStatus(s.state.get('bi_yan'),'confusion')).toBe(true);
  expect(stageRules['S3-01']!.seals!({state:s.state,difficulty:'normal',journalLength:0})).toContain(2);
 });
 it('gives no collapse when the main body crosses north before the feint',()=>{
  const s=open('S3-01');s.state.get('sima_yi').pos={x:13,y:3};s.act({kind:'wait',unit:'sima_yi'});
  expect(s.phase).toContain('양동 없이 도하');
  s.state.get('feint_banner_0').pos={x:10,y:11};s.act({kind:'endPhase'});
  expect(s.state.firedEvents.has('liaoshui/collapse')).toBe(false);
 });
});
describe('하편 · 공손연 진압전',()=>{
 it('feeds the garrison while granaries stand, then sends out three identical banners',()=>{
  const s=open('S3-02');expect(s.phase).toContain('남은 군량고 2/2');
  for(const id of ['convoy_depot_a','convoy_depot_b'])s.state.retreat(s.state.get(id));s.act({kind:'endPhase'});
  const flags=s.state.living('enemy').filter(u=>u.name==='공손연');expect(flags).toHaveLength(3);
  expect(s.phase).toContain('성을 버릴 채비');expect(s.state.get('gongsun_yuan').behavior).not.toBe('flee');
 });
 it('reveals the decoys to a scout and fails if the real Gongsun Yuan leaves by a gate',()=>{
  const s=open('S3-02');for(const id of ['convoy_depot_a','convoy_depot_b'])s.state.retreat(s.state.get(id));s.act({kind:'endPhase'});
  const scout=s.state.living('ally').find(u=>!u.hasActed&&u.canUseItems!==false)??s.state.living('ally')[0]!;
  s.act({kind:'item',unit:scout.id,item:'scout'});
  expect(s.state.living('enemy').filter(u=>u.name==='공손연')).toHaveLength(1);expect(s.state.living('enemy').filter(u=>u.name==='미끼 깃발대')).toHaveLength(2);
  const gy=s.state.get('gongsun_yuan');gy.pos={x:17,y:1};s.act({kind:'endPhase'});
  expect(s.state.outcome).toBe('defeat');expect(s.failure).toContain('공손연');
 });
});
describe('하편 · 번성 구원전',()=>{
 it('rallies the units standing within two tiles of Sima Yi once a turn',()=>{
  const s=open('S3-03'),yi=s.state.get('sima_yi');
  const near=[...s.state.living('player'),...s.state.living('ally')].find(u=>u.id!=='sima_yi')!;near.pos={x:yi.pos.x+1,y:yi.pos.y};
  s.act({kind:'wait',unit:'sima_yi'});expect(s.state.hasStatus(near,'rally')).toBe(true);
  expect(s.phase).toContain('수비대 2/2');
 });
 it('fails when Wu takes the keep',()=>{
  const s=open('S3-03');s.state.captured.set('keep','enemy');s.act({kind:'endPhase'});
  expect(s.state.outcome).toBe('defeat');expect(s.failure).toContain('번성 본채');
 });
});
