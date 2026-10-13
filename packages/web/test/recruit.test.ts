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
  it('varies the conditions between officers and pays no gold',()=>{
    const sigs=LINEAGES.flatMap(l=>l.officers.map(o=>o.conds.map(c=>c.kind).sort().join('+')));
    expect(new Set(sigs).size).toBeGreaterThanOrEqual(10);
    expect(JSON.stringify(LINEAGES)).not.toMatch(/금화|은전|gold|coin/);
  });
  it('splits officers into three routes: story, defeat and merit',()=>{
    const by=(r:string)=>LINEAGES.flatMap(l=>l.officers).filter(o=>o.route===r);
    expect(by('story').length).toBeGreaterThanOrEqual(8);
    expect(by('defeat').length).toBeGreaterThanOrEqual(4);
    expect(by('merit').length).toBeGreaterThanOrEqual(15);
    // 연의 합류는 연의 장 하나, 격파 귀순은 격파 조건, 공훈 등용은 공훈 + 다른 공적 하나 이상
    for(const o of by('story'))expect(o.conds.some(c=>c.kind==='stage'),o.name).toBe(true);
    for(const o of by('defeat'))expect(o.conds.some(c=>c.kind==='defeat'),o.name).toBe(true);
    for(const o of by('merit')){expect(o.conds.filter(c=>c.kind==='merit').length,o.name).toBe(1);expect(o.conds.length,o.name).toBeGreaterThanOrEqual(2);}
  });
  it('places every defeat target as an enemy in the stage it names',async()=>{
    const fs=await import('node:fs');
    for(const o of LINEAGES.flatMap(l=>l.officers))for(const c of o.conds)if(c.kind==='defeat'){
      const stage=JSON.parse(fs.readFileSync(new URL(`../../data/stages/${c.stage}.json`,import.meta.url),'utf8'));
      const enemy=(stage.difficulty?.normal?.forces??[]).some((f:{side:string;units:{name:string}[]})=>f.side==='enemy'&&f.units.some(u=>u.name===c.name))||JSON.stringify(stage).includes(`"name":"${c.name}"`)||JSON.stringify(stage).includes(`"name": "${c.name}"`);
      expect(enemy,`${c.name} in ${c.stage}`).toBe(true);
    }
  });
  it('opens merit officers in lineage order, story and defeat officers on their own',()=>{
    for(const l of LINEAGES){const merit=l.officers.filter(o=>o.route==='merit');
      if(merit[0])expect(previousOf(merit[0].name)).toBeUndefined();
      for(let i=1;i<merit.length;i++)expect(previousOf(merit[i]!.name)).toBe(merit[i-1]!.name);
      for(const o of l.officers)if(o.route!=='merit')expect(previousOf(o.name)).toBeUndefined();}
    const all=ctx({won:()=>true,extreme:()=>true,heroLevel:40,seals:999,challenges:99,trainingWins:99,endings:9,treasures:999,merit:99999,defeats:{맹달:9,왕평:9,강유:9,왕릉:9}});
    expect(recruitStatus('조홍',all)).toBe('ready');
    expect(recruitStatus('조휴',all)).toBe('sealed');
    expect(recruitStatus('조휴',{...all,recruited:new Set(['조홍'])})).toBe('ready');
    expect(recruitStatus('사마소',all)).toBe('ready');
    expect(recruitStatus('강유',all)).toBe('ready');
    expect(recruitStatus('조홍',{...all,merit:99})).toBe('locked');
    expect(condMet({kind:'level',level:6},ctx({heroLevel:6}))).toBe(true);
  });
});
describe('공훈과 격파',()=>{
  it('pays merit for wins, seals and fallen officers',async()=>{
    const {battleMerit,missionMerit,MERIT,retroMerit}=await import('../src/recruit.ts');
    expect(battleMerit({firstWin:true,extreme:false,newSeals:3,foes:2})).toBe(MERIT.storyFirst+3*MERIT.seal+2*MERIT.foe);
    expect(battleMerit({firstWin:true,extreme:true,newSeals:0,foes:0})).toBe(MERIT.storyFirstExtreme);
    expect(battleMerit({firstWin:false,extreme:false,newSeals:0,foes:0})).toBe(MERIT.storyAgain);
    expect(missionMerit('training',false)).toBe(MERIT.training);
    expect(missionMerit('challenge',true)).toBe(MERIT.challenge);
    expect(missionMerit('quest',false)).toBe(0);
    expect(retroMerit({storyWins:2,sealsPaid:4,challenges:1,quests:0,trainingWins:0,bountyWins:0})).toBe(2*MERIT.storyFirst+4*MERIT.seal+MERIT.challenge);
  });
  it('a full playthrough earns enough merit for every merit officer, but one normal pass does not',async()=>{
    const {MERIT,meritCost}=await import('../src/recruit.ts');
    const need=LINEAGES.flatMap(l=>l.officers).reduce((n,o)=>n+meritCost(o.name),0);
    const normalPass=32*MERIT.storyFirst+96*MERIT.seal;
    const everything=normalPass+32*MERIT.storyFirstExtreme+10*MERIT.challenge+11*MERIT.quest;
    expect(normalPass).toBeLessThan(need);
    expect(everything).toBeGreaterThanOrEqual(need);
  });
  it('counts defeats (extreme twice) and lets the officer defect once enough',async()=>{
    const {recordDefeats,autoRecruits,defeatNews}=await import('../src/recruit.ts');
    const d:Record<string,number>={};
    expect(recordDefeats(d,['맹달','맹달','신성 수비병'],false)).toEqual(['맹달']);
    expect(d).toEqual({맹달:1});
    expect(defeatNews(['맹달'],ctx({defeats:d}))[0]).toMatch(/1\/2 — 1번 더/);
    expect(autoRecruits(ctx({defeats:d}))).not.toContain('맹달');
    recordDefeats(d,['맹달'],true);expect(d.맹달).toBe(3);
    expect(autoRecruits(ctx({defeats:d}))).toContain('맹달');
    // 강유는 격파 3번에 사마의 Lv.20까지
    expect(autoRecruits(ctx({defeats:{강유:3},heroLevel:19}))).not.toContain('강유');
    expect(autoRecruits(ctx({defeats:{강유:3},heroLevel:20}))).toContain('강유');
  });
  it('rewards a lineage once when every officer in it is recruited',async()=>{
    const {completedLineages}=await import('../src/recruit.ts');
    const sima=LINEAGES.find(l=>l.id==='sima')!;
    const names=new Set(sima.officers.map(o=>o.name));
    expect(completedLineages(names,[]).map(l=>l.id)).toEqual(['sima']);
    expect(completedLineages(names,['sima'])).toEqual([]);
    expect(sima.reward).toBeGreaterThan(0);
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
  it('연의 합류 장수만 그 장을 이기면 저절로 들어오고, 공훈 등용 장수는 들어오지 않는다',async()=>{
    const {autoRecruits}=await import('../src/recruit.ts');
    const won=new Set(['S1-02','S1-03','S1-05','S1-06']);
    const got=autoRecruits(ctx({won:s=>won.has(s),heroLevel:3,merit:9999,trainingWins:99}));
    expect(got).toEqual(expect.arrayContaining(['사마방','사마부','장제']));
    expect(got).not.toContain('악진');// 공훈 등용은 등용 화면에서 공훈을 바쳐야
    expect(got).not.toContain('조홍');
    expect(got).not.toContain('사마사');// S2-05를 아직 이기지 않았다
  });
});
