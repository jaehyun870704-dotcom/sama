import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {HISTORIC_BATTLES} from '../src/historic-battles.ts';

const at=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
const make=(id:string,rev:12|13,wide?:2)=>new Session(at(id),'normal',215,'strategy',rev,{...deployment(freshCampaign(),true),...(wide?{wide}:{})});

describe('대규모 전투 증원(규칙판 13)',()=>{
 it('연의·정사의 대규모 전투는 적 장수와 병사가 늘어난다',()=>{
  for(const id of Object.keys(HISTORIC_BATTLES)){
   const before=make(id,12,2).state.living('enemy').length,s=make(id,13,2),now=s.state.living('enemy');
   expect(s.historic,id).toBe(true);expect(now.length,id).toBeGreaterThan(before);
   const officers=HISTORIC_BATTLES[id]!.officers.map(([n])=>n);
   expect(now.filter(u=>officers.includes(u.name)).length,id).toBeGreaterThanOrEqual(2);
  }
 });
 it('늘어난 부대는 모두 빈 땅에 서고 서로 겹치지 않는다',()=>{
  for(const id of Object.keys(HISTORIC_BATTLES)){const st=make(id,13,2).state,seen=new Set<string>();
   for(const u of st.living()){const k=u.pos.x+','+u.pos.y;expect(seen.has(k),`${id} ${u.id}`).toBe(false);seen.add(k);expect(st.map.inBounds(u.pos)).toBe(true);}}
 });
 it('예전 규칙판·좁은 전장·대규모가 아닌 장은 그대로이고, 저장을 다시 열어도 같은 전장이다',()=>{
  expect(make('S2-06',12,2).historic).toBe(false);expect(make('S2-06',13).historic).toBe(false);expect(make('S1-02',13,2).historic).toBe(false);
  const s=make('S2-06',13,2);expect(Session.load(s.save()).state.snapshot()).toEqual(s.state.snapshot());
 });
 it('정군산(S1-09): 편입 아군이 강변 두 칸을 2턴 지켜도 부교가 놓인다(규칙판 13) — 예전 규칙판은 그대로',()=>{
  const fired=(rev:12|13)=>{const s=make('S1-09',rev,2),st=s.state,bank=st.map.regionCoords('bridge_bank');
   expect(st.scenarioPhase).toBe('부교 재건');
   st.living('ally').slice(0,bank.length).forEach((u,i)=>{u.pos={...bank[i]!};});
   st.updateRegionHolds();st.turn+=1;(s as unknown as {advanceScenario():void}).advanceScenario();
   return st.firedEvents.has('hanshui/bridge');};
  expect(fired(13)).toBe(true);expect(fired(12)).toBe(false);
 });
});
