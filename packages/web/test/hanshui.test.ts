import {describe,it,expect} from 'vitest';
import {Session,chapters,campaignOrder} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';

const create=()=>new Session(8,'normal',215,'survival',4,deployment(freshCampaign(),true));
function nextPlayerTurn(s:Session){s.act({kind:'endPhase'});for(let i=0;i<300&&s.state.currentSide!=='player'&&s.state.outcome==='ongoing';i++){if(s.state.currentSide==='ally')s.act({kind:'endPhase'});else s.tick();}}
describe('한중 공방전 上 · 쳇바퀴',()=>{
 it('is the ninth battle of the upper arc',()=>{expect(chapters[8]!.stage.id).toBe('S1-09');expect(campaignOrder.at(-1)).toBe(8);});
 it('keeps the far bank out of reach until the bank is held for two turns',()=>{
  const s=create(),span={x:12,y:7};
  expect(s.state.map.tileAt(span).terrain).toBe('water');expect(s.phase).toContain('부교 재건 0/2');
  const hero=s.state.get('cao_zhen');hero.pos={x:11,y:7};
  for(let turn=0;turn<3&&s.state.outcome==='ongoing';turn++)nextPlayerTurn(s);
  expect(s.state.map.tileAt(span).terrain).toBe('bridge');
  expect(s.state.log.some(e=>e.t==='terrain'&&e.region==='bridge_span')).toBe(true);
  expect(s.phase).toContain('조조 호위');
 });
 it('gives Cao Cao a sturdy, unarmed escort profile',()=>{const c=create().state.get('cao_cao');expect(c.hp).toBe(160);expect(c.range).toEqual([0,0]);expect(c.side).toBe('allyAi');});
});
