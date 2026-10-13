import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign,type Deployment} from '../src/progression.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {foeEdgesExtreme,EXTREME_EDGE,turnLimitsExtreme} from '../src/stage-rules.ts';
import {battleConditions,conditionsHtml} from '../src/battle-conditions.ts';

const at=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
const open=(id:string,difficulty:'normal'|'extreme',d:Deployment)=>new Session(at(id),difficulty,215,'strategy',13,d);
const fresh=()=>({...deployment(freshCampaign(),true),wide:2 as const});
/** 성문·망루를 뺀 적의 공격·최대 체력 합. */
const foes=(s:Session)=>s.state.living('enemy').filter(u=>!/^(gate|tower)_/.test(u.id)).reduce((n,u)=>({attack:n.attack+u.stats.attack,hp:n.hp+u.stats.maxHp}),{attack:0,hp:0});
const old=()=>{const d=fresh();delete d.extremeRules;return d;};

describe('극한 다시 맞춤: 새로 시작한 사마의전 극한만 적이 세다',()=>{
 it('새 출진 기록은 extremeRules를 단다',()=>{
  expect(deployment(freshCampaign(),true).extremeRules).toBe(1);
  expect(deployment(freshCampaign()).extremeRules).toBeUndefined();
 });
 it('극한 + 새 기록 + 넓은 전장에서만 받는다(일반·옛 저장·좁은 전장은 그대로)',()=>{
  expect(open('S2-01','extreme',fresh()).hardened).toBe(true);
  expect(open('S2-01','normal',fresh()).hardened).toBe(false);
  expect(open('S2-01','extreme',old()).hardened).toBe(false);
  expect(open('S2-01','extreme',{...fresh(),wide:1}).hardened).toBe(false);
 });
 it('장별 보정만큼 적의 공격·체력이 오른다',()=>{
  const edge=foeEdgesExtreme['S2-01']??EXTREME_EDGE;expect(edge).toBeGreaterThan(0);
  const a=foes(open('S2-01','extreme',old())),b=foes(open('S2-01','extreme',fresh()));
  expect(b.attack).toBeGreaterThan(a.attack);
  expect(b.hp).toBeGreaterThan(a.hp);
  // 같은 출진에서 일반 난이도는 기록이 있어도 그대로다.
  expect(foes(open('S2-01','normal',fresh()))).toEqual(foes(open('S2-01','normal',old())));
 });
 it('보정 0인 장과 제갈량전은 그대로다',()=>{
  expect(foes(open('S2-08','extreme',fresh()))).toEqual(foes(open('S2-08','extreme',old())));
  const z=chapters.find(c=>c.stage.id.startsWith('Z'))!.stage;
  const zd=zhugeDeployment(freshCampaign(),z,'extreme');
  expect(zd.extremeRules).toBeUndefined();
  expect(new Session(at(z.id),'extreme',215,'strategy',13,{...zd,extremeRules:1}).hardened).toBe(false);
 });
 it('사마의전 32장 모두 표에 있다',()=>{
  const ids=chapters.map(c=>c.stage.id).filter(id=>/^S\d-\d\d$/.test(id));
  expect(ids.length).toBe(32);
  for(const id of ids)expect(foeEdgesExtreme[id],id).toBeGreaterThanOrEqual(0);
 });
 it('극한 턴 제한: 새 극한 전투에만 걸리고, 조건 창에 「극한: N턴 안에 승리」가 보인다',()=>{
  const n=turnLimitsExtreme['S2-11']!;expect(n).toBeGreaterThan(0);
  const s=open('S2-11','extreme',fresh());
  expect(s.extremeLimit).toBe(n);expect(s.deadline).toBe(n);
  expect(s.conditions.limit).toBe(`극한: ${n}턴 안에 승리`);
  expect(s.conditions.lose).toContain(`극한: ${n}턴 안에 승리하지 못함`);
  expect(conditionsHtml(s.conditions)).toContain(`극한: ${n}턴 안에 승리`);
  for(const o of [open('S2-11','normal',fresh()),open('S2-11','extreme',old())]){expect(o.extremeLimit).toBeUndefined();expect(o.conditions.limit).toBeUndefined();}
  expect(battleConditions(s.state,{deadline:20}).limit).toBeUndefined();
 });
 it('극한 턴 제한이 지나도록 이기지 못하면 패배한다(옛 저장은 그대로 진행)',()=>{
  const n=turnLimitsExtreme['S2-11']!;
  // 턴을 기한 다음으로 돌려 놓고 한 수를 두면 장면 판정(advanceScenario)이 돈다.
  const play=(s:Session)=>{(s.state as {turn:number}).turn=n+1;const u=s.state.living('player').find(x=>!x.hasActed)!;s.act({kind:'wait',unit:u.id});return s;};
  const hard=play(open('S2-11','extreme',fresh()));
  expect(hard.state.outcome).toBe('defeat');expect(hard.failure).toBe(`극한: ${n}턴 안에 승리하지 못했습니다.`);
  const legacy=play(open('S2-11','extreme',old()));
  expect(legacy.failure).not.toBe(`극한: ${n}턴 안에 승리하지 못했습니다.`);
 });
});
