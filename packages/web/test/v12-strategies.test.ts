import {describe,it,expect} from 'vitest';
import {Session} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {allStrategies,legacyStrategies,upgradeStrategyId,findStrategy} from '../src/officers.ts';
import {V12_LINEAGE} from '../src/strategies-v12.ts';
import {TREASURE_SPECIALS} from '../src/treasure-specials.ts';
import {effAgility,Battle,BattleState,makeUnit} from '../../core/src/index.ts';
import {flatMap,minimalStage} from '../../core/test/fixtures.ts';

function trial(rev:2|3|4|5|6|7|8|9|10|11|12,level=20){const c=freshCampaign(),d=deployment(c,true);for(const who of Object.keys(d.levels))d.levels[who]=Math.max(d.levels[who]!,level);d.mission={id:'T01',runId:'v12-'+rev,version:2};return new Session(7,'normal',215,'survival',rev,d);}

describe('규칙판 12 책략 목록',()=>{
 it('계통 습득표의 책략은 모두 목록에 있고 습득 레벨은 1~40이다',()=>{
  for(const [lin,list] of Object.entries(V12_LINEAGE))for(const [id,lv] of list){expect(allStrategies.some(s=>s.id===id),`${lin}:${id}`).toBe(true);expect(lv,`${lin}:${id}`).toBeGreaterThanOrEqual(1);expect(lv).toBeLessThanOrEqual(40);}
 });
 it('예전 책략은 모두 새 목록의 책략으로 옮겨진다(물리 특수기는 그대로)',()=>{
  for(const s of legacyStrategies){const up=upgradeStrategyId(s.id);expect(up,s.id).toBeTruthy();expect(allStrategies.some(x=>x.id===up),`${s.id}→${up}`).toBe(true);}
 });
 it('새 전투는 새 목록, 예전 규칙판 저장은 예전 목록으로 재생된다',()=>{
  const now=trial(12),old=trial(11);
  for(const u of now.state.living())for(const id of u.strategies)expect(allStrategies.some(s=>s.id===id),`${u.id}:${id}`).toBe(true);
  expect(now.state.get('sima_yi').strategies).toContain('emberBolt');
  expect(old.state.get('sima_yi').strategies).toContain('fire');
  expect(Session.load(old.save()).state.snapshot()).toEqual(old.state.snapshot());
 });
 it('보물이 주는 책략도 새 목록으로 바뀌고 설명의 이름도 새 이름이다',()=>{
  for(const sp of Object.values(TREASURE_SPECIALS))for(const id of sp.strategies??[]){expect(allStrategies.some(s=>s.id===id),id).toBe(true);expect(sp.text).toContain(findStrategy(id)!.name);}
 });
 it('정좌는 체력을 MP로 바꾸고, 진언은 자기 자신에게 쓸 수 없다',()=>{
  const s=trial(12),u=s.state.get('sima_yi');u.strategies.push('meditation','counsel');u.mp=0;const hp=u.hp;
  expect(s.act({kind:'strategy',unit:u.id,strategy:'meditation',at:u.pos}).ok).toBe(true);expect(u.mp).toBeGreaterThan(0);expect(u.hp).toBe(hp-u.mp);
  const s2=trial(12),v=s2.state.get('sima_yi');v.strategies.push('counsel');v.mp=v.stats.maxMp;
  expect(s2.act({kind:'strategy',unit:v.id,strategy:'counsel',at:v.pos}).ok).toBe(false);
 });
 it('위풍은 공격·방어·순발·사기를 한꺼번에 올리고, 경신은 순발력을 높인다',()=>{
  const s=trial(12),u=s.state.get('sima_yi');u.strategies.push('poise');u.mp=u.stats.maxMp;const agi=effAgility(u);
  expect(s.act({kind:'strategy',unit:u.id,strategy:'poise',at:u.pos}).ok).toBe(true);
  for(const k of ['rally','guard','swift','spirited'])expect(u.statuses.some(x=>x.kind===k),k).toBe(true);
  expect(effAgility(u)).toBeGreaterThan(agi);
 });
});

describe('흡수 책략(코어)',()=>{
 it('흡기는 준 피해만큼 체력을 되찾고, 탈기는 상대 MP를 빼앗는다',()=>{
  const lifeDrain=allStrategies.find(s=>s.id==='lifeDrain')!,manaDrain=allStrategies.find(s=>s.id==='manaDrain')!;
  const state=new BattleState(minimalStage(),flatMap(8,8),3);
  const hero=makeUnit({id:'hero',side:'player',unitClass:'strategist',level:30,pos:{x:1,y:1}}),foe=makeUnit({id:'foe',side:'enemy',unitClass:'strategist',level:10,pos:{x:3,y:1}});
  hero.strategies=['lifeDrain','manaDrain'];hero.mp=Math.max(10,hero.stats.maxMp-20);hero.hp=10;foe.stats.maxHp=9999;foe.hp=9999;foe.mp=30;
  state.add(hero);state.add(foe);
  const b=new Battle(state,{seed:3,strategies:new Map([[lifeDrain.id,{...lifeDrain,maxHit:100,sureHit:true}],[manaDrain.id,{...manaDrain,sureHit:true}]])});b.start();
  expect(b.execute({kind:'strategy',unit:'hero',strategy:'lifeDrain',at:foe.pos}).ok).toBe(true);
  expect(hero.hp).toBe(Math.min(hero.stats.maxHp,10+(9999-foe.hp)));
  hero.hasActed=false;hero.hasMoved=false;const mp=hero.mp;
  expect(b.execute({kind:'strategy',unit:'hero',strategy:'manaDrain',at:foe.pos}).ok).toBe(true);
  expect(foe.mp).toBeLessThan(30);const d=state.strategyFor(hero,'manaDrain')!;expect(hero.mp-(mp-d.mpCost)).toBe(30-foe.mp);
 });
});
