import {describe,it,expect} from 'vitest';
import {renderUnit} from '../src/unit-pixel.ts';
import {classLook,officerLook,hasPixelLook,describeLook} from '../src/unit-looks.ts';
import {classNames} from '../src/troops.ts';
import {tierOf,type UnitClass} from '../../core/src/index.ts';

const people=(Object.keys(classNames) as UnitClass[]).filter(hasPixelLook);
const hash=(d:Uint8ClampedArray)=>{let h=2166136261;for(let i=0;i<d.length;i+=3)h=Math.imul(h^d[i]!,16777619);return h>>>0;};
describe('도트 병종 그림',()=>{
  it('사람 병종은 모두 도트 사양이 있고 충차·포차·배는 그림 시트를 쓴다',()=>{
    expect(people.length).toBeGreaterThan(80);
    for(const c of ['ram','catapult','navy','ironRam','louchuan'] as UnitClass[])expect(hasPixelLook(c)).toBe(false);
  });
  it('병종마다 그림이 서로 다르다(색만 바꾼 같은 그림이 없다)',()=>{
    const seen=new Map<number,string>();
    for(const c of people){const h=hash(renderUnit(classLook(c)!,218,0).data);expect(seen.get(h),`${c} = ${seen.get(h)}`).toBeUndefined();seen.set(h,c);}
  });
  it('진화하면 갑옷·투구·무기 중 무엇이든 모양이 바뀐다',()=>{
    for(const [a,b] of [['infantry','shieldGuard'],['shieldGuard','royalGuard'],['spearman','pikeman'],['axeman','greatBlade'],['archer','longbow'],['elephant','warElephant']] as Array<[UnitClass,UnitClass]>){
      const x=classLook(a)!,y=classLook(b)!;expect(x.armor!==y.armor||x.helm!==y.helm||x.weapon!==y.weapon||x.off!==y.off||x.barding!==y.barding,`${a}→${b}`).toBe(true);
      expect(tierOf(b)).toBeGreaterThan(tierOf(a)===3?0:tierOf(a)-1);
    }
  });
  it('상병 계열은 코끼리를 탄다',()=>{for(const c of ['elephant','warElephant','elephantKing'] as UnitClass[])expect(classLook(c)!.mount).toBe('elephant');});
  it('모든 자세를 그린다',()=>{for(const p of [0,1,2,3,8,9,10,11,12,13]){const img=renderUnit(classLook('cavalry')!,358,p);expect(img.width).toBe(64);expect(img.data.some((v,i)=>i%4===3&&v>0)).toBe(true);}});
  it('장수는 병종 그림과 다르게 그린다',()=>{
    const base=classLook('cavalry')!;
    for(const n of ['관우','장비','여포','조운'])expect(hash(renderUnit(officerLook(base,n),218,0).data)).not.toBe(hash(renderUnit(base,218,0).data));
    expect(officerLook(base,'관우').weapon).toBe('guandao');
  });
  it('겉모습 설명이 장비를 말한다',()=>{expect(describeLook(classLook('axeman')!)).toContain('큰 도끼');expect(describeLook(classLook('elephant')!)).toContain('코끼리');});
});
