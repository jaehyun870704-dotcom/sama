import {describe,it,expect} from 'vitest';
import {finaleData,finalePath,replayData} from '../src/ending-finale.ts';
import {endingFor,ALL_ENDINGS} from '../src/fate.ts';

describe('결말 컷신 · 종막 자료',()=>{
  it('정사 결말은 세 편 모두 정사의 길로 적고, 마지막 장면을 배경으로 쓴다',()=>{
    const route={1:'refuse',2:'wei',3:'patience'},d=finaleData(endingFor(route),{route,people:[{label:'함께한 사람들',names:['사마의','사마사']},{label:'빈 묶음',names:[]}]});
    expect(d.kind).toBe('정사');expect(d.title).toBe('진의 기틀');expect(d.lines.length).toBeGreaterThan(0);
    expect(d.path.map(p=>p.act)).toEqual(['상편','중편','하편']);
    expect(d.people).toHaveLength(1);// 빈 묶음은 뺀다
    expect(d.place).toContain('궁정');
  });
  it('갈림길을 하나도 정하지 않은 편은 정사의 길로 적는다',()=>{
    expect(finalePath({3:'coup'})[0]!.name).toBe('정사의 길');
  });
  it('모든 결말을 다시 볼 수 있다: 결말마다 제목·후일담·걸어온 길 세 편이 채워진다',()=>{
    for(const id of ALL_ENDINGS){const d=replayData(id,{count:1,total:ALL_ENDINGS.length});
      expect(d.title.length,id).toBeGreaterThan(0);expect(d.lines.length,id).toBeGreaterThan(0);expect(d.path,id).toHaveLength(3);
      expect(d.path[2]!.name,id).not.toBe('정사의 길');}
  });
  it('신세력 결말은 세력 이름을 넣어 적는다',()=>{
    const d=finaleData(endingFor({3:'np_unify'}),{route:{1:'np1',2:'np_south',3:'np_unify'},text:t=>t.replace(/\{세력\}/g,'하내')});
    expect(JSON.stringify(d)).not.toContain('{세력}');
  });
});
