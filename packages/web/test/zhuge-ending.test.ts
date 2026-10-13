import {describe,it,expect,beforeEach} from 'vitest';
import {chapters,zhugeOrder} from '../src/session.ts';
import {scriptOf} from '../src/scenario.ts';
import {zhugeChoiceLog,zhugeTally,zhugeEndingNotes,zhugeAxisBeats,zhugeEndingId,zhugeBranchOf,ZHUGE_AXIS,ZHUGE_ENDINGS,ZHUGE_ENDING_TEXT,ZHUGE_YEARS} from '../src/zhuge-ending.ts';
import {zhugeSealTiers,claimZhugeSealTier,sealClaimed,sealRewardText,sealTiers} from '../src/seal-rewards.ts';
import {freshCampaign,readCampaign,writeCampaign,treasureInfo} from '../src/progression.ts';
import {readMeta,freshMeta,simaEndings} from '../src/meta.ts';
import {ALL_ENDINGS} from '../src/fate.ts';
import {gearAllowed} from '../../core/src/index.ts';

const ids=zhugeOrder.map(i=>chapters[i]!.stage.id);
const log=(flags:string[])=>zhugeChoiceLog(ids,scriptOf,flags);
const hanja=/[一-鿿]/;

describe('제갈량전 결말 갈래',()=>{
  it('마음과 법이 맞선 다섯 장은 모두 실제 선택지의 표식이다',()=>{
    for(const a of ZHUGE_AXIS){const opts=log([a.heart]).find(p=>p.id===a.stage)!;expect(opts.option,a.stage).toBeDefined();
      expect(log([a.law]).find(p=>p.id===a.stage)!.option!.id).not.toBe(opts.option!.id);}
  });
  it('마음이 둘 이상 많으면 마음, 법이 둘 이상 많으면 법, 그 사이는 저울',()=>{
    const heart=ZHUGE_AXIS.map(a=>a.heart),law=ZHUGE_AXIS.map(a=>a.law);
    expect(zhugeTally(heart).branch).toBe('heart');expect(zhugeTally(law).branch).toBe('law');
    expect(zhugeTally([...heart.slice(0,3),...law.slice(3)]).branch).toBe('balance');
    expect(zhugeTally([...heart.slice(0,4),...law.slice(4)])).toMatchObject({heart:4,law:1,branch:'heart'});
    expect(zhugeTally([...law.slice(0,4),...heart.slice(4)])).toMatchObject({heart:1,law:4,branch:'law'});
    // 기록이 없으면(예전 저장·선택 없이 넘긴 장) 저울
    expect(zhugeTally([]).branch).toBe('balance');
  });
  it('굳힘·나섬은 모든 장의 선택지 효과로 센다',()=>{
    const flags=['z1_wait','z3_wall','z4_people','z5_fast'],t=zhugeTally(flags,log(flags));
    expect(t.guard).toBe(3);expect(t.rally).toBe(1);expect(t.temper).toBe('steady');
  });
  it('「내가 한 선택」: 표식 없는 대결 선택지도 대결 결과로 찾는다',()=>{
    const p=log(['contest:Z2-12:debate:win','z111_duel','contest:Z1-11:duel:lose','z219_quiet']);
    expect(p).toHaveLength(34);
    const z212=p.find(x=>x.id==='Z2-12')!;expect(z212.option?.id).toBe('debate_haozhao');expect(z212.contest).toEqual({kind:'debate',by:'제갈량',foe:'학소',result:'win'});
    const z111=p.find(x=>x.id==='Z1-11')!;expect(z111.option?.id).toBe('duel');expect(z111.contest).toMatchObject({by:'장비',foe:'마초',result:'lose'});
    expect(p.find(x=>x.id==='Z2-19')!.option).toMatchObject({id:'quiet',lean:'guard'});
    expect(p.find(x=>x.id==='Z1-01')!.option).toBeUndefined();
  });
  it('종막 덧말과 회상: 대결 전적 · 오장원의 마지막 선택 · 고른 장만 회상',()=>{
    const flags=['z7_pledge','z201_heart','contest:Z2-12:debate:win','z219_banner'],picks=log(flags),t=zhugeTally(flags,picks);
    const notes=zhugeEndingNotes(t,picks,flags);expect(notes.some(n=>n.includes('1번 가운데 1번'))).toBe(true);expect(notes.at(-1)).toContain('깃발');
    const beats=zhugeAxisBeats(picks,flags);expect(beats.map(b=>b.name)).toEqual(['화용도','남중의 세 반란']);
    expect(beats.map(b=>b.kept)).toEqual([false,true]);expect(beats[0]!.when).toBe('208년');
  });
  it('결말 대본: 세 갈래마다 다른 줄이 있고, 한자가 없다',()=>{
    const sc=scriptOf('ending:zhuge')!;expect(sc).toBeDefined();
    const steps=sc.scenes.flatMap(s=>s.steps);
    for(const b of ['heart','law','balance'] as const){expect(steps.filter(st=>st.when===`zend_${b}`).length).toBeGreaterThanOrEqual(3);
      const e=ZHUGE_ENDING_TEXT[b];expect(e.lines.length).toBeGreaterThanOrEqual(3);expect([e.title,...e.lines,...e.closing].join('')).not.toMatch(hanja);}
    expect(JSON.stringify(sc)).not.toMatch(hanja);expect(ZHUGE_YEARS.map(y=>y.line).join('')).not.toMatch(hanja);
    expect(ZHUGE_YEARS[0]!.year).toContain('234');expect(ZHUGE_YEARS.at(-1)!.year).toContain('264');
  });
  it('결말 id는 meta.endings에 남고, 사마의전 결말 수와 따로 센다',()=>{
    expect(ZHUGE_ENDINGS).toEqual(['zhuge_heart','zhuge_law','zhuge_balance']);expect(zhugeBranchOf(zhugeEndingId('law'))).toBe('law');
    const m=readMeta(JSON.stringify({...freshMeta(),endings:['patience','zhuge_law','zhuge_law','zhuge_fake']}));
    expect(m.endings).toEqual(['patience','zhuge_law']);expect(simaEndings(m)).toEqual(['patience']);
    expect(ALL_ENDINGS.some(e=>e.startsWith('zhuge_'))).toBe(false);
  });
});

describe('제갈량전 천명 보상',()=>{
  const store=new Map<string,string>();
  beforeEach(()=>{store.clear();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};});
  it('상편 15장 · 하편 19장: 문턱 1/3 · 2/3 · 전부, 금과 소모품은 사마의전 같은 편 번호와 같다',()=>{
    const z1=zhugeSealTiers(0,15),z2=zhugeSealTiers(1,19);
    expect(z1.map(t=>t.need)).toEqual([30,60,90]);expect(z2.map(t=>t.need)).toEqual([38,76,114]);
    expect(z1.map(t=>t.key)).toEqual(['Z1:30','Z1:60','Z1:90']);expect(z2.every(t=>t.story==='Z'&&t.arc==='하편')).toBe(true);
    expect(z1.map(t=>[t.gold,t.xp])).toEqual(sealTiers(0,15).map(t=>[t.gold,t.xp]));
    for(const t of [...z1,...z2]){expect(t.gear).toHaveLength(1);expect(treasureInfo(t.gear![0]!).name).toBeTruthy();}
    expect(sealRewardText(z1[0]!)).toContain('군선');expect(sealRewardText(z2[2]!)).toContain('금선');
    // 첫 칸 장비는 제갈량(책사계)이 바로 든다
    expect(gearAllowed(z1[0]!.gear![0]!,'strategist').ok).toBe(true);
  });
  it('받기: 제갈량전 금 · 상점 장비 낱개 · 소모품 · 장수 경험치, 한 번만',()=>{
    const c=freshCampaign(),t=zhugeSealTiers(0,15)[0]!;c.retinueXp={제갈량:500};
    expect(claimZhugeSealTier(c,t,29,['제갈량'])).toBeNull();expect(c.sealRewards??[]).toEqual([]);
    const got=claimZhugeSealTier(c,t,30,['제갈량','조운','제갈량'])!;
    expect(got.gold).toBe(400);expect(c.gold?.Z).toBe(1400);expect(c.gold?.S).toBeUndefined();
    expect(got.items).toHaveLength(1);expect(got.items[0]).toMatch(/^shop:fan:2#\d+$/);expect(c.treasures).toContain(got.items[0]);
    expect(c.supplies?.bean).toBe(3);expect(c.retinueXp).toEqual({제갈량:500+t.xp,조운:t.xp});
    expect(sealClaimed(c,'Z1:30')).toBe(true);expect(claimZhugeSealTier(c,t,90,['제갈량'])).toBeNull();expect(c.gold?.Z).toBe(1400);
    // 사마의전 보상 칸과 섞이지 않는다
    expect(sealClaimed(c,'S1:30')).toBe(false);
  });
  it('받은 칸은 저장에 남고, 예전 저장(칸 기록 없음)도 그대로 열린다',()=>{
    const c=freshCampaign();claimZhugeSealTier(c,zhugeSealTiers(1,19)[0]!,40,['제갈량']);c.sealRewards!.push('S1:22','Z9:1','bad');writeCampaign(c);
    const back=readCampaign();expect(back.sealRewards).toEqual(['Z2:38','S1:22']);expect(back.treasures.some(x=>x.startsWith('shop:armor:3#'))).toBe(true);expect(back.gold?.Z).toBe(1800);
    const old=freshCampaign();delete (old as {sealRewards?:string[]}).sealRewards;writeCampaign(old);expect(readCampaign().sealRewards).toEqual([]);
  });
});
