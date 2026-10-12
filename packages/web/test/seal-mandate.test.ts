import {describe,it,expect} from 'vitest';
import {freshMeta,paySeals,readMeta} from '../src/meta.ts';

describe('연의 천명(옛 인장) → 쓸 천명',()=>{
  it('처음 얻은 칸마다 천명 1, 같은 칸은 두 번 주지 않는다',()=>{
    const m=freshMeta();
    expect(paySeals(m,{'S1-01:normal':[1,2]},['S1-01'])).toBe(2);
    expect(m.mandate).toBe(2);expect(m.earned).toBe(2);
    // 다시 이겨 같은 칸 + 새 칸 하나
    expect(paySeals(m,{'S1-01:normal':[1,2,3],'S1-01:extreme':[1]},['S1-01'])).toBe(2);
    expect(m.mandate).toBe(4);
    expect(paySeals(m,{'S1-01:normal':[1,2,3],'S1-01:extreme':[1]},['S1-01'])).toBe(0);
  });
  it('연의 장이 아닌 전장·이상한 칸 번호는 주지 않는다',()=>{
    const m=freshMeta();
    expect(paySeals(m,{'M-03:normal':[1,2,3],'S1-02:normal':[0,4,9]},['M-03','S1-02'])).toBe(0);
    expect(m.mandate).toBe(0);
  });
  it('준 기록은 저장했다 다시 읽어도 남는다(새로고침 뒤 두 번 받지 않는다)',()=>{
    const m=freshMeta();paySeals(m,{'S2-04:extreme':[1,3]},['S2-04']);
    const back=readMeta(JSON.stringify({...m,sealPaid:[...m.sealPaid!,'엉뚱한 값']}));
    expect(back.sealPaid).toEqual(['S2-04:extreme:1','S2-04:extreme:3']);
    expect(paySeals(back,{'S2-04:extreme':[1,3]},['S2-04'])).toBe(0);
  });
});
