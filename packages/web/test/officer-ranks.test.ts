import {describe,it,expect} from 'vitest';
import {officerGallery} from '../src/troop-evolution.ts';
import {rankTier,byRank} from '../src/officer-ranks.ts';
import {officerManifest} from '../src/officer-models.ts';
import {signatureSkill} from '../src/romance.ts';

const order=(html:string)=>[...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map(m=>m[1]!);
describe('장수 도감: 연의 계급 순', ()=>{
  it('군주 → 재상·대장군 → 장군 → 참모·장수 → 인물 순으로 선다', ()=>{
    const wei=order(officerGallery('위')),at=(n:string)=>wei.indexOf(n);
    for(const [a,b] of [['조조','사마의'],['사마의','장료'],['장료','사마랑'],['사마랑','장춘화'],['조조','조비']])expect(at(a),`${a} < ${b}`).toBeLessThan(at(b));
    const shu=order(officerGallery('촉'));expect(shu[0]).toBe('유비');expect(shu.indexOf('제갈량')).toBeLessThan(shu.indexOf('관우'));expect(shu.indexOf('관우')).toBeLessThan(shu.indexOf('관흥'));
    expect(order(officerGallery('오'))[0]).toBe('손권');
    expect(order(officerGallery('초'))[0]).toBe('항우');expect(order(officerGallery('한'))[0]).toBe('유방');
  });
  it('단계 머리글이 붙고, 같은 단계는 한데 모인다', ()=>{
    const html=officerGallery('위');expect(html).toContain('class="evo-rank">군주');expect(html).toContain('연의 계급 순');
    const named=officerManifest.filter(e=>!!signatureSkill(e.name));
    const tiers=byRank(named,e=>e.name).map(e=>rankTier(e.name));
    for(let i=1;i<tiers.length;i++)expect(tiers[i]!).toBeGreaterThanOrEqual(tiers[i-1]!);
  });
});
