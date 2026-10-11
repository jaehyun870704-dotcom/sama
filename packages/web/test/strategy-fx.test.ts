import {describe,expect,it} from 'vitest';
import {allStrategies} from '../src/officers.ts';
import {STRATEGY_FX,strategyFx} from '../src/strategy-fx.ts';

describe('책략·스킬 연출',()=>{
  it('모든 책략·병종 스킬이 자기 연출을 가진다(속성 기본값에 기대지 않는다)',()=>{
    const missing=allStrategies.filter(s=>!STRATEGY_FX[s.id]).map(s=>s.id);
    expect(missing).toEqual([]);
  });
  it('연출이 서로 겹치지 않는다(시전 동작·날아가는 모양·효과 층·색 조합이 모두 다르다)',()=>{
    const seen=new Map<string,string>();
    for(const s of allStrategies){const f=strategyFx(s.id),key=JSON.stringify([f.cast,f.travel,f.color,f.layers]);expect(seen.get(key),`${s.id}↔${seen.get(key)}`).toBeUndefined();seen.set(key,s.id);}
  });
  it('맞는 자리 효과가 겹치는 경우도 없다(효과 층 구성만 따로 봐도 모두 다르다)',()=>{
    const seen=new Map<string,string>();
    for(const s of allStrategies){const key=JSON.stringify(strategyFx(s.id).layers.map(l=>l.k).concat(String(strategyFx(s.id).color)));expect(seen.get(key),`${s.id}↔${seen.get(key)}`).toBeUndefined();seen.set(key,s.id);}
  });
  it('물리 스킬은 몸으로 움직이고(내지르기·돌진·사격·투척·회전·포효), 책략은 시전한다',()=>{
    for(const s of allStrategies){const f=strategyFx(s.id);if(s.physical)expect(['lunge','dash','shoot','throw','spin','roar'],s.id).toContain(f.cast);else expect(['cast','raise','spin','roar'],s.id).toContain(f.cast);}
  });
});
