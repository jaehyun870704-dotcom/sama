import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign,type Deployment} from '../src/progression.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {foeEdgesExtreme,EXTREME_EDGE} from '../src/stage-rules.ts';

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
});
