import {describe,it,expect} from 'vitest';
import {newRun,floorChoices,chooseFate,nextStory,nextTale,regionFor,runBattle,battleRef,finishBattle,mandateEarned,RUN_FLOORS} from '../src/roguelike.ts';
import {ROUTES,routesFor,endingFor,ALL_ENDINGS,FATE_POINTS} from '../src/fate.ts';
import {freshMeta,settleRun,readMeta} from '../src/meta.ts';
import {romanceOf} from '../src/romance.ts';
import {Session} from '../src/session.ts';
import {RUN_CHAPTER} from '../src/run-ui.ts';
import {validateStage} from '../../core/src/index.ts';

const fresh=()=>newRun(91,['infantry','archer','cavalry']);
const at=(floor:number,route?:{2?:string;3?:string})=>{const r=fresh();r.floor=floor;if(route)r.route=route;return r;};

describe('운명의 갈림길',()=>{
 it('stops each of the middle and last acts at a fate point until Sima Yi chooses',()=>{
  expect(floorChoices(at(3)).some(n=>n.kind==='fate')).toBe(false);
  for(const f of [7,13]){const run=at(f,f===13?{2:'wei'}:undefined);const nodes=floorChoices(run);
   expect(nodes.map(n=>n.kind)).toEqual(['fate']);expect(nodes[0]!.detail).toBe(FATE_POINTS[f===7?2:3].prompt);}
  const run=at(7);expect(chooseFate(run,'patience')).toBe(false);expect(chooseFate(run,'shu')).toBe(true);expect(chooseFate(run,'wei')).toBe(false);
  expect(run.route).toEqual({2:'shu'});expect(floorChoices(run).some(n=>n.kind==='fate')).toBe(false);
  expect(routesFor(2).filter(r=>r.history)).toHaveLength(1);expect(routesFor(3).filter(r=>r.history)).toHaveLength(1);
 });
 it('keeps history on the story battles, and turns what-if routes into their own region, boss and tales',()=>{
  const wei=at(8,{2:'wei'});expect(nextStory(wei)).toBe('S2-01');expect(nextTale(wei)).toBeUndefined();expect(regionFor(wei,8).boss.name).toBe('제갈량');
  const shu=at(8,{2:'shu'});expect(nextStory(shu)).toBeUndefined();expect(nextTale(shu)!.id).toBe('IF2-shu-1');
  expect(regionFor(shu,8).name).toBe('형주 강릉');shu.floor=12;expect(floorChoices(shu)[0]!.label).toBe('우두머리 · 조인');
  shu.floor=9;expect(floorChoices(shu).find(n=>n.kind==='tale')?.tale).toBe('IF2-shu-1');
  // 하편 정사는 중편도 정사여야 연의 전장이 이어진다.
  expect(nextStory(at(14,{2:'wei',3:'patience'}))).toBe('S3-01');
  expect(nextStory(at(14,{2:'cao_zhi',3:'patience'}))).toBeUndefined();expect(nextTale(at(14,{2:'cao_zhi',3:'patience'}))!.id).toBe('IF3-pat-1');
  expect(nextTale(at(14,{2:'wei',3:'coup'}))!.id).toBe('IF3-coup-1');
 });
 it('fights a what-if tale against its named general, who carries the romance rating, and saves exactly',()=>{
  for(const route of ROUTES.filter(r=>r.tales.length))for(const t of route.tales){
   const run=at(route.act===2?9:15,route.act===2?{2:route.id}:{2:'wei',3:route.id});
   const b=runBattle(run,'tale',t.id);expect(validateStage(b.stage),t.id).toEqual([]);
   expect(b.stage.victory).toEqual([{type:'retreat',unit:'target'}]);
   expect(romanceOf({id:'target',name:t.target.name}),t.target.name).toBeDefined();
  }
  const run=at(9,{2:'cao_zhi'}),ref=battleRef(run,'tale','IF2-zhi-1');
  const s=new Session(RUN_CHAPTER,'normal',3,'survival',4,{levels:{sima_yi:9,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:ref});
  const target=s.state.find('target')!;expect(target.name).toBe('허저');expect(target.traits).toContain('guardian');
  s.act({kind:'endPhase'});expect(Session.load(JSON.parse(JSON.stringify(s.save()))).state.snapshot()).toEqual(s.state.snapshot());
  const bad=s.save();bad.deployment!.run!.route={2:'patience'};expect(()=>Session.load(bad)).toThrow('잘못된 원정 기록');
  finishBattle(run,{kind:'tale',label:'',detail:'',tale:'IF2-zhi-1'},true,Object.fromEntries(run.party.map(u=>[u.id,1])));
  expect(run.talesDone).toEqual(['IF2-zhi-1']);expect(run.status).toBe('reward');expect(nextTale({...run,floor:10})!.id).toBe('IF2-zhi-2');
 });
 it('ends in one of nine endings, history only when both choices follow history, and records it',()=>{
  expect(ALL_ENDINGS).toHaveLength(9);expect(new Set(ALL_ENDINGS.map(id=>{const [a,b]=id.split('/');return endingFor(a,b).title;})).size).toBe(9);
  expect(endingFor('wei','patience').history).toBe(true);expect(endingFor('shu','unify')).toMatchObject({history:false,title:'천하통일 · 촉의 승상'});
  const run=at(RUN_FLOORS,{2:'cao_zhi',3:'coup'});run.status='won';run.talesDone=['IF2-zhi-1','IF3-coup-1'];
  expect(mandateEarned(run)).toBe(RUN_FLOORS+4+10);
  const m=freshMeta();settleRun(m,run);expect(m.endings).toEqual(['cao_zhi/coup']);expect(m.tales).toEqual(['IF2-zhi-1','IF3-coup-1']);
  expect(readMeta(JSON.stringify({...m,endings:['cao_zhi/coup','x/y'],tales:['IF2-zhi-1','bad']}))).toMatchObject({endings:['cao_zhi/coup'],tales:['IF2-zhi-1']});
 });
});
