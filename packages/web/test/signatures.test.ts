import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign} from '../src/progression.ts';
import {romanceOf,romanceByName,signatureSkill} from '../src/romance.ts';
import {SIGNATURE_NAMES,SIGNATURE_UNLOCK_TIERS,tierOf,signatureSet,troopEffectOf} from '../../core/src/index.ts';
import {officerClass} from '../src/officer-perks.ts';

describe('규칙판 8: 이름있는 장수는 고유특성, 목록 밖 인물은 병종', () => {
  it('고유특성이 있는 장수는 모두 게임 장수록에 있는 인물이다', () => {
    for(const n of SIGNATURE_NAMES)expect(romanceByName(n),n).toBeDefined();
  });
  it('본편 전장 전체: 장수록의 이름있는 장수는 모두 고유특성을 갖는다(목록 밖 인물 없음)', () => {
    let named=0,plain=0;
    for(let c=1;c<chapters.length;c++){
      const s=new Session(c,'normal',215,'survival',8,deployment(freshCampaign(),true));
      for(const u of s.state.units.values()){
        const r=romanceOf(u);if(!r||u.name.endsWith('환영'))continue;
        const sig=u.traits.filter(t=>t.startsWith('sig:'));
        expect(u.traits.some(t=>t.startsWith('officer:')),u.name).toBe(false);
        if(signatureSkill(r.name)){if(sig.length){named++;expect(sig[0]).toBe('sig:'+r.name);expect(sig.length).toBe(tierOf(u.unitClass)>=4?3:tierOf(u.unitClass)>=3?2:1);}}
        else{plain++;expect(sig,u.name).toEqual([]);}
      }
    }
    expect(named).toBeGreaterThan(20);
    expect(plain).toBe(0);
  });
  it('규칙판 8 저장은 다시 불러올 수 있다(이어하기)', () => {
    const s=new Session(chapters.findIndex(c=>c.stage.id==='S1-06'),'normal',215,'survival',8,deployment(freshCampaign(),true));
    const sigs=(x:Session)=>[...x.state.units.values()].flatMap(u=>u.traits.filter(t=>t.startsWith('sig:'))).sort();
    expect(sigs(s)).toContain('sig:마초');
    const back=Session.load(JSON.parse(JSON.stringify(s.save())));
    expect(back.revision).toBe(8);
    expect(sigs(back)).toEqual(sigs(s));
  });
  it('장수 특성은 하나만: 성장 특성 나무·장수 효과(장착)를 붙이지 않는다', () => {
    const OLD=['simaPatience','caoVanguard','familyShield','commandDefense','zhouStrategy','westernValor','guardian','flyingGeneral','strategicGuard'];
    const grown={...deployment(freshCampaign(),true),growth:{storyWins:9,trainingWins:9,questWins:9},
      perks:{all:[],byName:{사마의:[['physicalPower',10]] as [string,number][]}}};
    const s=new Session(chapters.findIndex(c=>c.stage.id==='S1-08'),'normal',215,'survival',8,grown);
    const sy=s.state.find('sima_yi')!;
    expect(sy.traits.filter(t=>t.startsWith('sig:'))[0]).toBe('sig:사마의');
    expect(sy.traits.filter(t=>OLD.includes(t)||t==='physicalPower'||t.startsWith('officer:'))).toEqual([]);
  });
  it('본편 전장 전체(규칙판 10): 이름있는 장수는 아군·적·지켜야 할 우군 모두 병종 특성과 고유특성을 둘 다 가진다', () => {
    let both=0;
    for(let c=1;c<chapters.length;c++){
      const s=new Session(c,'normal',215,'survival',10,{...deployment(freshCampaign(),true),wide:2});
      for(const u of s.state.units.values()){
        const r=romanceOf(u);if(!r||u.name.endsWith('환영')||u.unitClass==='civilian'||!signatureSkill(r.name))continue;
        expect(u.traits.some(t=>t.startsWith('sig:')),`${s.state.stage.id} ${u.name} 고유특성`).toBe(true);
        expect(u.traits.some(t=>t.startsWith('troop:')),`${s.state.stage.id} ${u.name} 병종 특성`).toBe(true);
        both++;
      }
    }
    expect(both).toBeGreaterThan(40);
    // 지켜야 할 장수(S1-09 조조)도 둘 다 갖고, 저장·불러오기 뒤에도 그대로다.
    const s9=new Session(chapters.findIndex(c=>c.stage.id==='S1-09'),'normal',215,'survival',10,{...deployment(freshCampaign(),true),wide:2});
    const back=Session.load(JSON.parse(JSON.stringify(s9.save())));
    const cc=back.state.find('cao_cao')!;
    expect(back.revision).toBe(10);
    expect(cc.traits.some(t=>t.startsWith('troop:'))&&cc.traits.includes('sig:조조')).toBe(true);
  });
  it('장수는 병종 특성과 고유특성을 함께 쓰고, 고유특성은 단계마다 병종 특성보다 세다', () => {
    const s=new Session(chapters.findIndex(c=>c.stage.id==='S1-06'),'normal',215,'survival',8,deployment(freshCampaign(),true));
    for(const u of s.state.units.values())if(u.traits.some(t=>t.startsWith('sig:')))expect(u.traits.some(t=>t.startsWith('troop:')),u.name).toBe(true);
    for(let t=1;t<=4;t++){let sv=0,sn=0,tv=0,tn=0;
      for(const n of SIGNATURE_NAMES){const e=troopEffectOf(officerClass(n));if(e){tv+=e.effect.values[Math.min(e.effect.values.length,t)-1]!;tn++;}
        signatureSet(n).forEach((g,i)=>{if(t<SIGNATURE_UNLOCK_TIERS[i]!)return;const m=g.text(t).match(/(\d+)%/);if(m){sv+=+m[1]!;sn++;}});}
      expect(sv/sn,`단계 ${t}`).toBeGreaterThan(1.2*tv/tn);}
  });
});
