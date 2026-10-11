import {describe,it,expect} from 'vitest';
import {Session,chapters} from '../src/session.ts';
import {deployment,freshCampaign} from '../src/progression.ts';
import {capHit} from '../../core/src/index.ts';

const open=(id:string,rev:7|8|9,wide?:2)=>new Session(chapters.findIndex(c=>c.stage.id===id),'normal',215,'survival',rev,{...deployment(freshCampaign(),true),...(wide?{wide}:{})});

describe('규칙판 9: 한 방에 쓰러지지 않게', () => {
  it('아군은 한 번의 공격으로 최대 체력의 40%까지만 잃고, 적은 그대로다', () => {
    const s=open('S1-06',9);
    const sy=s.state.find('sima_yi')!;
    expect(sy.hitCap).toBe(40);
    expect(capHit(sy,9999)).toBe(Math.ceil(sy.stats.maxHp*.4));
    const foe=s.state.living('enemy')[0]!;
    expect(foe.hitCap).toBeUndefined();
  });
  it('쓰러지면 패배하는 우군 NPC는 30%까지, 체력도 더 단단하다', () => {
    const before=open('S1-06',8).state.find('cao_cao')!, after=open('S1-06',9).state.find('cao_cao')!;
    expect(after.hitCap).toBe(30);
    expect(after.stats.maxHp).toBeGreaterThan(before.stats.maxHp);
  });
  it('예전 규칙판 전투는 그대로(저장 재생이 달라지지 않게)', () => {
    expect(open('S1-06',8).state.find('sima_yi')!.hitCap).toBeUndefined();
  });
  it('규칙판 9 저장을 다시 불러오면 상한도 그대로 붙는다', () => {
    const s=open('S1-06',9,2);const back=Session.load(JSON.parse(JSON.stringify(s.save())));
    expect(back.revision).toBe(9);expect(back.state.find('sima_yi')!.hitCap).toBe(40);
  });
});
