import {describe,it,expect} from 'vitest';
import {LINEAGES,RECRUITABLE,condMet,previousOf,recruitStatus,type RecruitContext} from '../src/recruit.ts';
import {romanceByName} from '../src/romance.ts';
import {chapters} from '../src/session.ts';
import {freshScenario,trainCompanions,joinRecruits} from '../src/scenario.ts';
import {XP_PER_LEVEL} from '../src/roguelike.ts';
import {officerClass} from '../src/officer-perks.ts';
function ctx(over:Partial<RecruitContext>={}):RecruitContext{
  return {won:()=>false,extreme:()=>false,heroLevel:1,seals:0,challenges:0,trainingWins:0,endings:0,treasures:0,recruited:new Set(),stageName:s=>s,...over};
}
describe('recruit lineages',()=>{
  it('lists every recruitable officer once, with roster stats, and only real stage ids',()=>{
    expect(new Set(RECRUITABLE).size).toBe(RECRUITABLE.length);
    for(const n of RECRUITABLE)expect(romanceByName(n),n).toBeTruthy();
    const ids=new Set(chapters.map(c=>c.stage.id));
    for(const o of LINEAGES.flatMap(l=>l.officers))for(const c of o.conds)if(c.kind==='stage'||c.kind==='extreme')expect(ids.has(c.stage),`${o.name} ${c.stage}`).toBe(true);
    for(const o of LINEAGES.flatMap(l=>l.officers))for(const c of o.conds)if(c.kind==='officer')expect(RECRUITABLE).toContain(c.name);
  });
  it('uses no currency and varies the conditions between officers',()=>{
    const sigs=LINEAGES.flatMap(l=>l.officers.map(o=>o.conds.map(c=>c.kind).sort().join('+')));
    expect(new Set(sigs).size).toBeGreaterThanOrEqual(10);
    expect(JSON.stringify(LINEAGES)).not.toMatch(/금화|은전|gold|coin/);
  });
  it('opens each lineage from the top down',()=>{
    for(const l of LINEAGES){expect(previousOf(l.officers[0]!.name)).toBeUndefined();for(let i=1;i<l.officers.length;i++)expect(previousOf(l.officers[i]!.name)).toBe(l.officers[i-1]!.name);}
    const all=ctx({won:()=>true,extreme:()=>true,heroLevel:40,seals:999,challenges:99,trainingWins:99,endings:9,treasures:999});
    expect(recruitStatus('사마부',all)).toBe('ready');
    expect(recruitStatus('사마방',all)).toBe('sealed');
    expect(recruitStatus('사마방',{...all,recruited:new Set(['사마부'])})).toBe('ready');
    expect(recruitStatus('사마부',{...all,recruited:new Set(['사마부'])})).toBe('recruited');
    expect(recruitStatus('사마방',ctx({recruited:new Set(['사마부']),heroLevel:5,won:()=>true}))).toBe('locked');
    expect(condMet({kind:'level',level:6},ctx({heroLevel:6}))).toBe(true);
  });
});
describe('companions grow and join',()=>{
  it('training XP never lifts a companion past the hero +1',()=>{
    const s=freshScenario();s.officers['조진']={name:'조진',unitClass:'cavalry',level:4,xp:0};
    for(let i=0;i<20;i++)trainCompanions(s,1,5);
    expect(s.officers['조진']!.level).toBe(6);expect(s.officers['조진']!.xp).toBe(0);
    s.officers['조진']!.level=1;const ups=trainCompanions(s,1.5,10);expect(ups).toEqual(['조진 Lv.2']);expect(s.officers['조진']!.xp).toBe(Math.round(XP_PER_LEVEL*.5));
  });
  it('recruits join a run one level below the hero, once',()=>{
    const s=freshScenario();
    expect(joinRecruits(s,['사마부','사마부'],8,officerClass)).toEqual(['사마부']);
    expect(s.officers['사마부']!.level).toBe(7);
    expect(joinRecruits(s,['사마부'],8,officerClass)).toEqual([]);
  });
});

describe('이야기를 하면서 들이는 장수',()=>{
  it('연의 장을 이겨 조건을 다 채운 장수만 저절로 합류하고, 계보 순서를 지킨다',async()=>{
    const {storyRecruits}=await import('../src/recruit.ts');
    const won=new Set(['S1-03','S1-04','S1-05']);
    const got=storyRecruits(ctx({won:s=>won.has(s),heroLevel:3}));
    expect(got).toEqual(expect.arrayContaining(['사마부','조홍','장제']));
    expect(got).not.toContain('사마방');// Lv.6 조건이 남았다
    expect(got).not.toContain('순욱');// 연의 장 조건이 없는 장수는 등용 화면에서만
    const later=storyRecruits(ctx({won:s=>won.has(s)||s==='S1-07',heroLevel:8}));
    expect(later).toEqual(expect.arrayContaining(['하후돈','사마방']));
  });
});
