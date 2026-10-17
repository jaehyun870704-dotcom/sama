import {describe,it,expect} from 'vitest';
import {treasures,freshCampaign,award,awardZhugeTreasures} from '../src/progression.ts';
import {TREASURE_LINES,commonRevealLines} from '../src/treasure-lines.ts';
import {revealCard,revealQueue,revealMarkup} from '../src/treasure-reveal.ts';

const HANJA=/[㐀-鿿豈-﫿]/;

describe('보물 획득 장면 — 대사 데이터',()=>{
  it('고유 보물 50점 모두 두 이야기의 대사(한두 줄)가 있다',()=>{
    expect(treasures).toHaveLength(50);
    expect(Object.keys(TREASURE_LINES).sort()).toEqual(treasures.map(t=>t.id).sort());
    for(const t of treasures)for(const story of ['s','z'] as const){
      const lines=TREASURE_LINES[t.id]![story];
      expect(lines.length,`${t.id}.${story}`).toBeGreaterThanOrEqual(1);
      expect(lines.length,`${t.id}.${story}`).toBeLessThanOrEqual(2);
      for(const [who,line] of lines){
        expect(typeof who).toBe('string');
        expect(line.trim().length,`${t.id}.${story}`).toBeGreaterThan(5);
        expect(HANJA.test(who+line),`${t.id}.${story} 한자`).toBe(false);
      }
    }
  });
  it('모든 보물의 장면 카드: 이름·등급·종류·고유 기능 한 줄',()=>{
    for(const t of treasures)for(const story of ['S','Z'] as const){
      const c=revealCard(t.id,story)!;
      expect(c.name).toBe(t.name);expect(c.grade).toBe(t.grade);
      expect(['일반','희귀','영웅','전설']).toContain(c.rank);
      expect(c.kind.length).toBeGreaterThan(0);
      expect(c.power.length,t.id).toBeGreaterThan(0);
      expect(c.common).toBe(false);
    }
    // 고유 기능이 없는 보물은 기본 능력을 보인다(고정도: 민첩·공격).
    expect(revealCard('ancientBlade','S')!.power).toContain('민첩');
    expect(revealCard('greenDragon','Z')!.power).toContain('무반격');
  });
  it('사마의전과 제갈량전은 서로 다른 대사를 쓴다',()=>{
    expect(revealCard('dilu','S')!.lines).not.toEqual(revealCard('dilu','Z')!.lines);
    expect(revealCard('dilu','Z')!.lines[0]![0]).toBe('유비');
  });
  it('대사가 없는 보물은 공통 문구(받침에 맞춘 을/를)',()=>{
    expect(commonRevealLines('청공검')[0]![1]).toContain('「청공검」을');
    expect(commonRevealLines('백우선')[0]![1]).toContain('「백우선」을');
    expect(commonRevealLines('적토마')[0]![1]).toContain('「적토마」를');
  });
  it('상점 장비·모르는 id는 장면이 없다',()=>{
    expect(revealCard('shop:sword:1#1','S')).toBeUndefined();
    expect(revealQueue(['shop:sword:1#1','nope'],'S')).toEqual([]);
  });
});

describe('보물 획득 장면 — 획득 시 장면 큐',()=>{
  it('사마의전 연의 장을 처음 이기면 새로 얻은 보물마다 한 장씩, 다시 이기면 없다',()=>{
    const c=freshCampaign();
    // 상편의 4등급 전설 보물은 일반 승리로는 나오지 않는다.
    expect(award(c,'S1-04','normal',['sima_yi'],[1]).got).toEqual([]);
    const first=award(c,'S1-04','extreme',['sima_yi'],[1]);
    expect(first.got.map(t=>t.id).sort()).toEqual(['halberd','lubuBow','mengde']);
    const q=revealQueue(first.got.map(t=>t.id),'S');
    expect(q.map(x=>x.id)).toEqual(first.got.map(t=>t.id));
    expect(q.find(x=>x.id==='mengde')!.lines).toEqual(TREASURE_LINES.mengde!.s);
    // 극한을 처음 이겨도 이미 가진 보물은 다시 보이지 않는다.
    const again=award(c,'S1-04','extreme',['sima_yi'],[1]);
    expect(again.got).toEqual([]);
    expect(revealQueue(again.got.map(t=>t.id),'S')).toEqual([]);
  });
  it('제갈량전 장을 이기면 제갈량전 대사로 큐가 선다',()=>{
    const c=freshCampaign();
    const got=awardZhugeTreasures(c,'Z1-01').map(t=>t.id);
    expect(got.sort()).toEqual(['beanBag','taiping']);
    const q=revealQueue(got,'Z');
    expect(q).toHaveLength(2);
    expect(q.find(x=>x.id==='beanBag')!.lines[0]![0]).toBe('제갈균');
    expect(revealQueue(awardZhugeTreasures(c,'Z1-01').map(t=>t.id),'Z')).toEqual([]);
  });
  it('여러 점이면 「모두 건너뛰기」가 있고 마지막 장은 「확인」',()=>{
    const q=revealQueue(['halberd','lubuBow','mengde'],'S');
    const first=revealMarkup(q[0]!,0,q.length),last=revealMarkup(q[2]!,2,q.length);
    expect(first).toContain('모두 건너뛰기');expect(first).toContain('1 / 3');expect(first).toContain('다음 보물');
    expect(last).not.toContain('모두 건너뛰기');expect(last).toContain('확인');
    expect(first).toContain('treasure-icon');expect(first).toContain('★★★★');
    const one=revealMarkup(revealCard('fan','Z')!,0,1);
    expect(one).not.toContain('모두 건너뛰기');expect(one).toContain('황월영');
  });
});
