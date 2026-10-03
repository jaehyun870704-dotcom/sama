import {describe,it,expect} from 'vitest';
import {newRun,battleRef,recruit} from '../src/roguelike.ts';
import {Session} from '../src/session.ts';
import {RUN_CHAPTER} from '../src/run-ui.ts';
import {cryFor} from '../src/emotes.ts';
import {classFamily} from '../src/music.ts';
import {deployment,freshCampaign,award,levelInfo} from '../src/progression.ts';
import {growthMilestones,officerEvolution} from '../src/growth-milestones.ts';
import {chapters,campaignOrder} from '../src/session.ts';
import {getTrait,makeUnit,type DamageContext,type UnitClass} from '../../core/src/index.ts';

/** 진화 병종은 계열의 기능(치유 명령·외침·음악·보물 조건)을 그대로 이어받는다. */
describe('진화 병종의 계열 기능',()=>{
 it('lets an evolved feng shui master still use 치유',()=>{
  const run=newRun(77,['infantry','archer','cavalry']);recruit(run,'fengshui',12);
  const sage=run.party.at(-1)!;expect(sage.unitClass).toBe('sage');
  run.party[1]!.hp=.3;
  const s=new Session(RUN_CHAPTER,'normal',5,'survival',4,{levels:{sima_yi:4,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:battleRef(run,'battle')});
  const healer=s.state.get(sage.id),hurt=s.state.get(run.party[1]!.id);
  hurt.pos={x:healer.pos.x,y:healer.pos.y+1};
  const before=hurt.hp;expect(s.act({kind:'item',unit:healer.id,item:'heal',target:hurt.id} as never).ok).toBe(true);
  expect(hurt.hp).toBeGreaterThan(before);
 });
 it('gives evolved troops their lineage battle cry and music family',()=>{
  expect(cryFor('tigerRider')).toEqual(cryFor('cavalry'));expect(cryFor('sharpshooter')).toEqual(cryFor('archer'));
  expect(cryFor('mastermind',true)).toEqual(cryFor('strategist',true));
  expect(classFamily('lancer')).toBe('horse');expect(classFamily('greatBow')).toBe('bow');expect(classFamily('immortal')).toBe('sage');
 });
 it('applies treasure conditions (mounted, caster, armored) to evolved troops too',()=>{
  const me=makeUnit({id:'a',unitClass:'infantry',level:10,side:'player',pos:{x:0,y:0}});
  const boost=(trait:string,foe:UnitClass)=>{const ctx={attacker:me,defender:makeUnit({id:'b',unitClass:foe,level:10,side:'enemy',pos:{x:1,y:0}}),kind:'physical',distance:1,attackMul:1,reduction:0,accuracyMod:0,defenseIgnore:0,critChance:0,evasionMod:0} as unknown as DamageContext;
   getTrait('treasure:'+trait).hooks.onAttack!(ctx,me);return ctx.attackMul;};
  expect(boost('greenDragon','tigerRider')).toBeCloseTo(boost('greenDragon','cavalry'));expect(boost('greenDragon','tigerRider')).toBeGreaterThan(1);
  expect(boost('greenDragon','warElephant')).toBeGreaterThan(1);
  expect(boost('ironAxe','royalGuard')).toBeGreaterThan(1);
 });
 it('evolves story officers by level and keeps what they learned',()=>{
  const d=deployment(freshCampaign(),true);d.levels.sima_yi=16;d.levels.cao_zhen=12;d.levels.sima_fang=3;
  const chapter=campaignOrder.find((c:number)=>chapters[c]!.stage.id==='S1-09')!;
  const s=new Session(chapter,'normal',215,'strategy',4,d),hero=s.state.get('sima_yi');
  expect(hero.unitClass).toBe('mastermind');expect(hero.traits).toContain('alwaysHit');expect(hero.strategies).toContain('windDragon');
  expect(hero.hp).toBe(hero.stats.maxHp);expect(s.state.get('cao_zhen').unitClass).toBe('ironCav');
  const low=deployment(freshCampaign(),true);low.levels.sima_yi=7;
  expect(new Session(chapter,'normal',215,'strategy',4,low).state.get('sima_yi').unitClass).toBe('strategist');
 });
 it('announces an officer evolution on the result screen',()=>{
  expect(officerEvolution('sima_yi',7,8)).toEqual({from:'책사',to:'군사'});expect(officerEvolution('sima_yi',8,9)).toBeUndefined();
  const before=freshCampaign();before.xp.sima_yi=1100;const after=structuredClone(before);
  award(after,'S1-03','normal',['sima_yi'],[1]);
  expect(levelInfo(after.xp.sima_yi!).level).toBeGreaterThanOrEqual(8);
  expect(growthMilestones(before,after).find(x=>x.id==='sima_yi')?.evolution?.to).toBe('군사');
 });
});
