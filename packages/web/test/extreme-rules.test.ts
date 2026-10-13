import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign,type Deployment} from '../src/progression.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {foeEdgesExtreme,EXTREME_EDGE,turnLimitsExtreme,foeEdgesExtremeZ,turnLimitsExtremeZ} from '../src/stage-rules.ts';
import {isZhugeStage,isZhugeBranch} from '../src/zhuge-data.ts';
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
 it('보정 0인 장은 그대로다',()=>{
  expect(foes(open('S2-08','extreme',fresh()))).toEqual(foes(open('S2-08','extreme',old())));
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

describe('제갈량전 극한 다시 맞춤: 새 극한 본편 전투만 적 보정·턴 제한을 받는다',()=>{
 const stageOf=(id:string)=>chapters[at(id)]!.stage;
 const zNew=(id:string,difficulty:'normal'|'extreme'='extreme')=>zhugeDeployment(freshCampaign(),stageOf(id),difficulty);
 const zOld=(id:string,difficulty:'normal'|'extreme'='extreme')=>{const d=zNew(id,difficulty);delete d.extremeRules;return d;};
 const zOpen=(id:string,difficulty:'normal'|'extreme',d:Deployment)=>new Session(at(id),difficulty,215,'strategy',13,d);
 const edged=Object.keys(foeEdgesExtremeZ).find(id=>foeEdgesExtremeZ[id]!>0)!;
 const limited=Object.keys(turnLimitsExtremeZ)[0]!;
 it('제갈량전 출진 기록도 extremeRules를 단다',()=>{
  expect(zNew('Z1-01').extremeRules).toBe(1);
 });
 it('본편 극한 + 새 기록만 받는다(일반·옛 저장·갈림길은 그대로)',()=>{
  expect(zOpen('Z1-01','extreme',zNew('Z1-01')).hardened).toBe(true);
  expect(zOpen('Z1-01','normal',zNew('Z1-01','normal')).hardened).toBe(false);
  expect(zOpen('Z1-01','extreme',zOld('Z1-01')).hardened).toBe(false);
  const zb=chapters.find(c=>isZhugeBranch(c.stage.id))!.stage;
  expect(new Session(at(zb.id),'normal',215,'strategy',13,zhugeDeployment(freshCampaign(),zb,'normal')).hardened).toBe(false);
 });
 it('표의 장은 모두 제갈량전 본편(Z1·Z2) 장이고, 보정·턴 수가 알맞다',()=>{
  for(const [id,n] of Object.entries(foeEdgesExtremeZ)){expect(isZhugeStage(id),id).toBe(true);expect(n,id).toBeGreaterThanOrEqual(0);}
  for(const [id,n] of Object.entries(turnLimitsExtremeZ)){expect(isZhugeStage(id),id).toBe(true);expect(n,id).toBeGreaterThan(1);}
  expect(chapters.filter(c=>/^Z\d-\d\d$/.test(c.stage.id)).length).toBe(34);
 });
 it('보정이 있는 장은 새 극한에서만 적이 세지고, 옛 저장은 예전 그대로 열린다',()=>{
  const a=foes(zOpen(edged,'extreme',zOld(edged))),b=foes(zOpen(edged,'extreme',zNew(edged)));
  expect(b.attack).toBeGreaterThan(a.attack);expect(b.hp).toBeGreaterThan(a.hp);
  // 표에 없는 장은 새 기록이어도 같다.
  const none=chapters.map(c=>c.stage.id).find(id=>/^Z\d-\d\d$/.test(id)&&!foeEdgesExtremeZ[id])!;
  expect(foes(zOpen(none,'extreme',zNew(none)))).toEqual(foes(zOpen(none,'extreme',zOld(none))));
  expect(foes(zOpen(edged,'normal',zNew(edged,'normal')))).toEqual(foes(zOpen(edged,'normal',zOld(edged,'normal'))));
 });
 it('턴 제한: 새 극한에만 걸리고 조건 창에 보이며, 지나면 패배한다(옛 저장은 그대로)',()=>{
  const n=turnLimitsExtremeZ[limited]!;
  const s=zOpen(limited,'extreme',zNew(limited));
  expect(s.extremeLimit).toBe(n);expect(s.deadline).toBe(n);
  expect(s.conditions.limit).toBe(`극한: ${n}턴 안에 승리`);
  expect(conditionsHtml(s.conditions)).toContain(`극한: ${n}턴 안에 승리`);
  for(const o of [zOpen(limited,'normal',zNew(limited,'normal')),zOpen(limited,'extreme',zOld(limited))]){expect(o.extremeLimit).toBeUndefined();expect(o.conditions.limit).toBeUndefined();}
  const play=(x:Session)=>{(x.state as {turn:number}).turn=n+1;const u=x.state.living('player').find(v=>!v.hasActed)!;x.act({kind:'wait',unit:u.id});return x;};
  const hard=play(zOpen(limited,'extreme',zNew(limited)));
  expect(hard.state.outcome).toBe('defeat');expect(hard.failure).toBe(`극한: ${n}턴 안에 승리하지 못했습니다.`);
  const legacy=play(zOpen(limited,'extreme',zOld(limited)));
  expect(legacy.failure).not.toBe(`극한: ${n}턴 안에 승리하지 못했습니다.`);
 });
 it('옛 제갈량전 저장(기록에 extremeRules 없음)은 저장·불러오기 뒤에도 예전 규칙으로 다시 열린다',()=>{
  for(const [d,hard] of [[zOld(edged),false],[zNew(edged),true]] as const){
   const s=zOpen(edged,'extreme',d);
   for(const u of s.state.living('player').slice(0,2))s.act({kind:'wait',unit:u.id});
   const l=Session.load(JSON.parse(JSON.stringify(s.save())));
   expect(l.hardened).toBe(hard);expect(l.state.outcome).toBe('ongoing');
   expect(l.journal.length).toBe(s.journal.length);
   expect(foes(l)).toEqual(foes(s));
   expect(l.deployment?.extremeRules).toBe(hard?1:undefined);
  }
 });
});
