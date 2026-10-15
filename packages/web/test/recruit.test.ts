import {describe,it,expect} from 'vitest';
import {ROSTER,NATIONS,HERO,MERIT,MERIT_COST,LORD_FAME_COST,FAVOR_NEED,battleMerit,missionMerit,retroMerit,meritCost,fameCost,fameNeed,favorNeed,isNationLord,
  recruitStatus,settleBattle,contestWin,spareFoe,persuadeFoe,buyRecruit,catchUpStory,titleNews,heroLabel,recruitedOf,favorOf,fameOf,fameLeft,isStoryRecruit,entryOf,
  type RecruitMeta,type BattleReport,type Nation} from '../src/recruit.ts';
import {readMeta} from '../src/meta.ts';
import {romanceByName} from '../src/romance.ts';
import {officerFaction} from '../src/officer-factions.ts';
import {chapters} from '../src/session.ts';
import {freshScenario,trainCompanions,joinRecruits} from '../src/scenario.ts';
import {XP_PER_LEVEL} from '../src/roguelike.ts';
import {officerClass} from '../src/officer-perks.ts';
const nationOf=(n:string)=>romanceByName(n)?officerFaction(n) as Nation:undefined;
const LORDS=['조조','조비','조예','유비','손권','원술','여포','원담','원상','공손연','맹획','항우','유방'];
const report=(o:Partial<BattleReport>):BattleReport=>({story:'S',stage:'S1-01',win:true,extreme:false,fallen:[],enemies:[],party:[],lost:0,allies:{},...o});
const no=()=>false;

describe('등용 명부(나라별 · 이야기별)',()=>{
  it('lists each officer once per story, with real people, real stages and every nation',()=>{
    const ids=new Set(chapters.map(c=>c.stage.id));
    for(const st of ['S','Z'] as const){const r=ROSTER[st];
      expect(new Set(r.map(e=>e.n)).size,st).toBe(r.length);
      expect(r.length,st).toBeGreaterThanOrEqual(140);
      for(const e of r){if(e.s)expect(ids.has(e.s),`${st} ${e.n} ${e.s}`).toBe(true);expect(NATIONS).toContain(e.f);}
      for(const f of NATIONS)expect(r.some(e=>e.f===f),`${st} ${f}`).toBe(true);
      // 주인공은 제 이야기에서 들이지 않는다
      expect(r.some(e=>e.n===HERO[st]),st).toBe(false);}
    expect(ROSTER.S.some(e=>e.n==='제갈량')).toBe(true);
    expect(ROSTER.Z.some(e=>e.n==='사마의')).toBe(true);
  });
  it('uses all six routes, and a bond partner is someone you can have in that story',()=>{
    for(const st of ['S','Z'] as const){const r=ROSTER[st],routes=new Set(r.map(e=>e.r));
      for(const k of ['story','defeat','merit','bond','feat'])expect(routes.has(k as never),`${st} ${k}`).toBe(true);
      for(const e of r.filter(e=>e.r==='bond'))expect(r.some(x=>x.n===e.w),`${st} ${e.n}←${e.w}`).toBe(true);
      for(const e of r.filter(e=>e.r==='defeat'))expect(['duel','debate']).toContain(e.c);}
    expect(ROSTER.S.some(e=>e.r==='rescue')).toBe(true);
  });
  it('places every defeat officer as an enemy in the stage it names',async()=>{
    const fs=await import('node:fs');
    for(const st of ['S','Z'] as const)for(const e of ROSTER[st].filter(e=>e.r==='defeat')){
      const txt=fs.readFileSync(new URL(`../../data/stages/${e.s}.json`,import.meta.url),'utf8').replace(/\s+/g,'');
      expect(txt.includes(`"name":"${e.n}"`),`${e.n} in ${e.s}`).toBe(true);}
  });
  it('lords come only by payment: 위·촉·오 lords pay that nation\'s fame, the rest pay more merit than anyone',()=>{
    for(const st of ['S','Z'] as const)for(const n of LORDS){const e=entryOf(st,n)!;expect(e.r,`${st} ${n}`).toBe('merit');
      if(['위','촉','오'].includes(e.f)){expect(isNationLord(e)).toBe(true);expect(fameCost(e)).toBe(LORD_FAME_COST);expect(meritCost(e)).toBe(0);}
      else{expect(fameCost(e)).toBe(0);expect(meritCost(e)).toBe(MERIT_COST[1]);expect(fameNeed(st,e)).toBe(0);}}
    expect(MERIT_COST[1]).toBeGreaterThan(Math.max(...[2,3,4,5].map(t=>MERIT_COST[t]!)));
    expect(LORD_FAME_COST).toBeGreaterThan(30);
  });
  it('a full playthrough of both stories earns about enough merit for every merit officer, a single pass does not',()=>{
    const need=(['S','Z'] as const).reduce((n,st)=>n+ROSTER[st].reduce((k,e)=>k+meritCost(e),0),0);
    const onePass=66*MERIT.storyFirst+18*MERIT.storyFirst+66*3*MERIT.seal;
    const everything=66*(MERIT.storyFirst+MERIT.storyFirstExtreme)+18*MERIT.storyFirst+66*6*MERIT.seal+10*MERIT.challenge+11*MERIT.quest;
    expect(onePass).toBeLessThan(need/2);
    expect(everything).toBeGreaterThanOrEqual(need);
  });
});

describe('공훈 · 명성 · 호감',()=>{
  it('pays merit for wins, seals and fallen officers',()=>{
    expect(battleMerit({firstWin:true,extreme:false,newSeals:3,foes:2})).toBe(MERIT.storyFirst+3*MERIT.seal+2*MERIT.foe);
    expect(battleMerit({firstWin:true,extreme:true,newSeals:0,foes:0})).toBe(MERIT.storyFirstExtreme);
    expect(battleMerit({firstWin:false,extreme:false,newSeals:0,foes:0})).toBe(MERIT.storyAgain);
    expect(missionMerit('training',false)).toBe(MERIT.training);
    expect(missionMerit('challenge',true)).toBe(MERIT.challenge);
    expect(missionMerit('quest',false)).toBe(0);
    expect(retroMerit({storyWins:2,sealsPaid:4,challenges:1,quests:0,trainingWins:0,bountyWins:0})).toBe(2*MERIT.storyFirst+4*MERIT.seal+MERIT.challenge);
  });
  it('a won battle builds favor (extreme twice) and fame by nation; a lost one does nothing',()=>{
    const m:RecruitMeta={};
    expect(settleBattle(m,report({win:false,stage:'S2-05',fallen:['맹달']}),no,nationOf).news).toEqual([]);
    const r=settleBattle(m,report({stage:'S2-05',fallen:['맹달','신성 수비병'],enemies:['맹달']}),no,nationOf);
    expect(favorOf(m,'S','맹달')).toBe(1);expect(r.news.join(' ')).toMatch(/맹달 호감 1\/3/);
    expect(fameOf(m,'S',nationOf('맹달')!)).toBe(3+1+5);// 꺾음 3 · 나온 나라 1 · 같은 장에서 합류한 사마사 5
    settleBattle(m,report({stage:'S2-05',extreme:true,fallen:['맹달']}),no,nationOf);
    expect(favorOf(m,'S','맹달')).toBe(3);
    expect(recruitStatus(m,'S',entryOf('S','맹달')!)).toBe('ready');
    // 제갈량전 호감은 따로
    expect(favorOf(m,'Z','맹달')).toBe(0);
  });
  it('story, feat, rescue and bond officers join right after the win',()=>{
    const m:RecruitMeta={};
    expect(settleBattle(m,report({stage:'S1-02'}),no,nationOf).joined).toContain('사마방');
    // 조건 승리: 마초는 S1-06을 아군 손실 없이
    expect(settleBattle(m,report({stage:'S1-06',lost:1}),no,nationOf).joined).not.toContain('마초');
    expect(settleBattle(m,report({stage:'S1-06',lost:0}),no,nationOf).joined).toContain('마초');
    // 구출: 조휴를 체력 절반 이상으로 지키고 S2-08을 이긴다
    expect(settleBattle(m,report({stage:'S2-08',allies:{조휴:.3}}),no,nationOf).joined).not.toContain('조휴');
    expect(settleBattle(m,report({stage:'S2-08',allies:{조휴:.6}}),no,nationOf).joined).toContain('조휴');
    // 인연: 마초와 함께 출진해 이기면 마대
    expect(settleBattle(m,report({stage:'S2-10',party:['사마의','마초']}),no,nationOf).joined).toContain('마대');
    // 제갈량전은 따로 — 제갈량 휘하
    const z=settleBattle(m,report({story:'Z',stage:'Z1-03'}),no,nationOf);
    expect(z.joined).toEqual(expect.arrayContaining(['관우','장비','조운']));
    expect(recruitedOf(m,'Z')).toContain('관우');expect(recruitedOf(m,'S')).not.toContain('관우');
    expect(isStoryRecruit('관우','Z')).toBe(true);expect(isStoryRecruit('관우','S')).toBe(false);
  });
  it('catches up story officers whose stage was already won',()=>{
    const m:RecruitMeta={};const won=new Set(['S1-02','S1-03','S2-05']);
    expect(catchUpStory(m,'S',s=>won.has(s))).toEqual(expect.arrayContaining(['사마방','사마부','사마사']));
    expect(catchUpStory(m,'S',s=>won.has(s))).toEqual([]);
  });
  it('after a duel win you spare the foe (favor) or ask them to join (only when favor is full)',()=>{
    const m:RecruitMeta={},need=favorNeed(entryOf('S','왕평')!);
    expect(contestWin(m,'S','왕평',nationOf)?.n).toBe('왕평');
    expect(favorOf(m,'S','왕평')).toBe(1);
    const no1=persuadeFoe(m,'S','왕평');expect(no1.ok).toBe(false);expect(no1.news[0]).toMatch(/고개를 저었다/);
    expect(spareFoe(m,'S','왕평')).toMatch(/살려 보냈다 — 호감 2/);
    while(favorOf(m,'S','왕평')<need)spareFoe(m,'S','왕평');
    expect(persuadeFoe(m,'S','왕평').ok).toBe(true);
    expect(recruitedOf(m,'S')).toContain('왕평');
    expect(contestWin(m,'S','왕평',nationOf)).toBeUndefined();
    // 공훈 길 장수는 명성만 오른다
    const before=fameOf(m,'S','위');expect(contestWin(m,'S','장료',nationOf)).toBeUndefined();expect(fameOf(m,'S','위')).toBe(before+3);
    expect(FAVOR_NEED[3]).toBe(3);
  });
  it('merit officers need merit and fame; nation lords spend fame without lowering the fame gauge',()=>{
    const m:RecruitMeta={merit:1000,fame:{'S:위':100}};
    const zhang=entryOf('S','장료')!;
    expect(recruitStatus(m,'S',zhang)).toBe('ready');
    expect(buyRecruit(m,'S','장료')).toBeDefined();expect(m.merit).toBe(1000-meritCost(zhang));
    expect(buyRecruit(m,'S','조조')).toBeDefined();
    expect(m.merit).toBe(1000-meritCost(zhang));// 조조는 공훈이 아니라 위의 공적(명성)으로
    expect(fameLeft(m,'S','위')).toBe(100+5+5-LORD_FAME_COST);
    expect(fameOf(m,'S','위')).toBe(110);
    expect(recruitStatus(m,'S',entryOf('S','조비')!)).toBe('locked');// 남은 명성 50 < 60
    expect(recruitStatus({merit:1000},'S',entryOf('S','여포')!)).toBe('ready');// 군웅 군주는 공훈만
    expect(recruitStatus({merit:279},'S',entryOf('S','여포')!)).toBe('locked');
  });
});

describe('칭호',()=>{
  it('collecting every officer of a nation in a story grants its title, worn in front of the hero name',()=>{
    const m:RecruitMeta={recruited:ROSTER.S.filter(e=>e.f==='초').map(e=>e.n)};
    expect(titleNews(m,'S')[0]).toMatch(/칭호 「패왕의 벗」/);
    expect(m.titles).toEqual(['S:초']);expect(titleNews(m,'S')).toEqual([]);
    expect(heroLabel(m,'S')).toBe('사마의');
    m.title={S:'초'};expect(heroLabel(m,'S')).toBe('「패왕의 벗」 사마의');
    m.title={S:'위'};expect(heroLabel(m,'S')).toBe('사마의');// 얻지 않은 칭호는 달 수 없다
    expect(heroLabel({...m,title:{Z:'초'}},'Z')).toBe('제갈량');// 이야기마다 따로
  });
  it('old saves move defeat counts into 사마의전 favor and keep titles clean',()=>{
    const m=readMeta(JSON.stringify({version:1,mandate:0,earned:0,unlocks:[],chronicle:[],tales:[],endings:[],runs:0,wins:0,best:0,recruited:['사마방'],defeats:{맹달:2},lineageRewards:['sima'],titles:['S:초','X:위'],title:{S:'초',Z:'없음'},fame:{'S:위':12,'Q:위':3},fameSpent:{'S:위':60,'S:초':1}}));
    expect(m.favor).toEqual({'S:맹달':2});
    expect(m.titles).toEqual(['S:초']);expect(m.title).toEqual({S:'초'});
    expect(m.fame).toEqual({'S:위':12});expect(m.fameSpent).toEqual({'S:위':60});
    expect('defeats' in m).toBe(false);expect('lineageRewards' in m).toBe(false);
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

