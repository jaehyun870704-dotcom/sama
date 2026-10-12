// 게임 전 전수조사에서 고친 진행 오류들이 다시 생기지 않게 지킨다.
import {describe,it,expect} from 'vitest';
import {levelInfo,deployment,freshCampaign} from '../src/progression.ts';
import {freshScenario,choose,undoChoice,readScenario,recruitOffer,rosterFull,type ScenarioState} from '../src/scenario.ts';
import {grantXp,newRun,finishBattle,RUN_FLOORS,type Run} from '../src/roguelike.ts';
import type {ScenarioStep} from '../src/scenario-types.ts';

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
 it('부대가 가득 차면 영입을 내밀지 않는다',()=>{
  const s:ScenarioState=freshScenario();
  for(let i=0;i<8;i++)s.officers['장수'+i]={name:'장수'+i,unitClass:'infantry',level:1,xp:0};
  s.run={seed:7} as ScenarioState['run'];
  expect(rosterFull(s)).toBe(true);expect(recruitOffer(s,'IF1-1')).toEqual([]);
 });
});

describe('천명의 원정 마지막 층',()=>{
 it('18층 우두머리에게 지고 가호를 쓰면 19층으로 넘어가지 않는다',()=>{
  const run=newRun(3,['infantry','archer']);run.floor=RUN_FLOORS;run.secondChance=true;
  finishBattle(run,{kind:'boss'} as Parameters<typeof finishBattle>[1],false,{});
  expect(run.floor).toBe(RUN_FLOORS);expect(run.status).toBe('map');
 });
});
