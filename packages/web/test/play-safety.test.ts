// 게임 전 전수조사에서 고친 진행 오류들이 다시 생기지 않게 지킨다.
import {describe,it,expect} from 'vitest';
import {levelInfo,deployment,freshCampaign} from '../src/progression.ts';
import {freshScenario,choose,undoChoice,readScenario,recruitOffer,recruitOfficer,joinCaptive,scenarioParty,type ScenarioState} from '../src/scenario.ts';
import {grantXp,newRun,finishBattle,recruit,battleRef,sortieOf,sortieSize,RUN_FLOORS,type Run} from '../src/roguelike.ts';
import type {ScenarioStep} from '../src/scenario-types.ts';
import {Session} from '../src/session.ts';
import {RUN_CHAPTER} from '../src/run-ui.ts';

describe('저장·성장 상한',()=>{
 it('40레벨에서는 남는 경험치를 0으로 둔다(출진 기록이 저장 검사를 통과하게)',()=>{
  const c=freshCampaign();c.xp.sima_yi=50000;
  expect(levelInfo(50000)).toMatchObject({level:40,xp:0});
  expect(deployment(c).xp?.sima_yi).toBe(0);
 });
 it('원정·천명의 길 장수는 60레벨에서 멈춘다',()=>{
  const run={party:[{id:'a',name:'갑',unitClass:'infantry',level:60,xp:50,hp:1,officer:true}],news:[],relics:[],fallen:[]} as unknown as Run;
  grantXp(run,500);
  expect(run.party[0]!.level).toBe(60);expect(run.party[0]!.xp).toBeLessThan(100);
 });
 it('60을 넘겨 저장된 장수는 버리지 않고 60으로 읽는다',()=>{
  const s=readScenario(JSON.stringify({version:1,officers:{을:{unitClass:'infantry',level:64,xp:30}}}));
  expect(s.officers['을']).toMatchObject({level:60,xp:0});
 });
});

describe('천명의 길 선택 되돌리기',()=>{
 // 실제 대본의 선택지(IF3-hrg-1 · shi: 사마사 영입)로 확인한다.
 const step={id:'IF3-hrg-1',kind:'story',act:3} as unknown as ScenarioStep;
 const shi=[{kind:'recruit' as const,name:'사마사',unitClass:'cavalry' as const},{kind:'flag' as const,flag:'hrg_shi'}];
 it('장을 다시 시작해도 이미 있던 장수는 지우지 않는다',()=>{
  const s:ScenarioState=freshScenario();s.officers['사마사']={name:'사마사',unitClass:'cavalry',level:15,xp:0};
  choose(s,step,'shi',shi,10);undoChoice(s,step);
  expect(s.officers['사마사']?.level).toBe(15);expect(s.flags).not.toContain('hrg_shi');
 });
 it('그 선택으로 들어온 장수는 되돌릴 때 함께 나간다',()=>{
  const s:ScenarioState=freshScenario();
  choose(s,step,'shi',shi,10);expect(s.officers['사마사']).toBeDefined();
  undoChoice(s,step);expect(s.officers['사마사']).toBeUndefined();
 });
 it('천명의 길 영입에는 상한이 없고, 싸움에는 체력·레벨 순으로 6명만 나간다',()=>{
  const s:ScenarioState=freshScenario();
  for(let i=0;i<12;i++)s.officers['장수'+i]={name:'장수'+i,unitClass:'infantry',level:1+i,xp:0};
  s.run={seed:7,hp:{'장수11':.3}} as unknown as ScenarioState['run'];
  expect(recruitOffer(s,'IF1-1').length).toBeGreaterThan(0);
  const name=recruitOffer(s,'IF1-1')[0]!.name;expect(recruitOfficer(s,name,10)).toBe(true);
  expect(joinCaptive(s,'포로장수','infantry',5)).toBe(true);expect(Object.keys(s.officers).length).toBe(14);
  const party=scenarioParty(s,10,0).filter(u=>!u.hero).map(u=>u.name);
  expect(party.length).toBe(6);expect(party).not.toContain('장수11');expect(party).toContain('장수10');
  expect(scenarioParty(s,10,0,Object.keys(s.officers)).length).toBe(15);
 });
});

describe('천명의 원정 마지막 층',()=>{
 it('18층 우두머리에게 지고 가호를 쓰면 19층으로 넘어가지 않는다',()=>{
  const run=newRun(3,['infantry','archer']);run.floor=RUN_FLOORS;run.secondChance=true;
  finishBattle(run,{kind:'boss'} as Parameters<typeof finishBattle>[1],false,{});
  expect(run.floor).toBe(RUN_FLOORS);expect(run.status).toBe('map');
 });
 it('원정 영입에도 상한이 없고, 출진은 층이 깊을수록 늘며 본진 대기는 체력이 그대로다',()=>{
  const run:Run=newRun(11,['infantry','archer']);
  for(let i=0;i<14;i++)expect(recruit(run,'infantry',3)).toBe(true);
  expect(sortieSize(1)).toBe(7);expect(sortieSize(9)).toBe(9);expect(sortieSize(15)).toBe(11);expect(sortieSize(18,'boss')).toBe(12);
  const ref=battleRef(run,'battle');expect(ref.party.length).toBe(7);expect(ref.party.some(u=>u.hero)).toBe(true);
  expect(sortieOf(run).length).toBe(7);
  const bench=run.party.find(u=>!ref.party.some(r=>r.id===u.id))!;bench.hp=.8;
  run.status='map';finishBattle(run,{kind:'battle',label:'',detail:''},true,Object.fromEntries(ref.party.map(u=>[u.id,1])),{},ref.party.map(u=>u.id));
  expect(bench.hp).toBe(.8);expect(run.party.filter(u=>ref.party.some(r=>r.id===u.id)).every(u=>u.hp===1)).toBe(true);
 });
 it('하편 우두머리 전의 큰 부대(12명)도 모두 전장에 선다',()=>{
  const run:Run=newRun(23,['infantry','archer']);
  for(let i=0;i<14;i++)recruit(run,'infantry',12);
  run.floor=18;const ref=battleRef(run,'boss');expect(ref.party.length).toBe(12);
  const state=new Session(RUN_CHAPTER,'normal',run.seed,'survival',4,{levels:{sima_yi:run.party[0]!.level,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:ref}).state;
  for(const u of ref.party)expect(state.find(u.id),u.name).toBeDefined();
 });
});
