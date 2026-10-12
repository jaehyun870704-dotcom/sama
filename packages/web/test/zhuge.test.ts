import {describe,it,expect} from 'vitest';
import {Session,chapters,zhugeOrder,campaignOrder} from '../src/session.ts';
import {freshCampaign,equipSlot,treasures,treasureInfo} from '../src/progression.ts';
import {zhugeDeployment,zhugeLevel,growZhuge} from '../src/zhuge.ts';
import {ZHUGE_PACKS,scriptOf} from '../src/scenario.ts';
import {checkPack} from '../src/scenario-types.ts';
import {allUnitClasses} from '../../core/src/index.ts';
import {romanceOf} from '../src/romance.ts';

describe('제갈량전',()=>{
  it('장은 사마의전 32장 뒤에 덧붙고(앞 장 번호 그대로), 따로 순서를 가진다',()=>{
    expect(campaignOrder).toHaveLength(32);
    expect(zhugeOrder.length).toBeGreaterThan(0);
    for(const i of zhugeOrder){expect(i).toBeGreaterThanOrEqual(32);expect(chapters[i]!.stage.id).toMatch(/^Z[12]-\d\d$/);expect(scriptOf(chapters[i]!.stage.id)).toBeDefined();}
  });
  it('대본 형식이 맞다',()=>{for(const p of ZHUGE_PACKS)expect(checkPack(p,{unitClasses:allUnitClasses()})).toEqual([]);});
  it('1장: 세 형제(피난민)가 출진하고, 연의 장수록의 능력을 이름으로 찾는다',()=>{
    const st=chapters[zhugeOrder[0]!]!.stage;
    const s=new Session(zhugeOrder[0]!,'normal',215,'survival',13,zhugeDeployment(freshCampaign(),st,'normal'));
    const players=s.state.living('player');
    expect(players.map(u=>u.name).sort()).toEqual(['제갈균','제갈근','제갈량']);
    for(const u of players){expect(u.unitClass).toBe('civilian');expect(romanceOf(u)?.name).toBe(u.name);}
    expect(s.state.find('sima_yi')).toBeUndefined();
    // 저장했다 불러와도 같은 전장이다.
    const back=Session.load(JSON.parse(JSON.stringify(s.save())));
    expect(back.state.stage.id).toBe('Z1-01');
  });
  it('보물은 두 이야기가 함께 쓴다: 장수 이름에 단 보물을 입고 나선다',()=>{
    const st=chapters[zhugeOrder[0]!]!.stage,c=freshCampaign();
    const armor=treasures.find(t=>treasureInfo(t.id).slot==='armor')!;c.treasures.push(armor.id);
    expect(equipSlot(c,'제갈량','armor',armor.id)).toBe(true);
    const plain=new Session(zhugeOrder[0]!,'normal',215,'survival',13,zhugeDeployment(freshCampaign(),st,'normal')).state.find('z_liang')!;
    const geared=new Session(zhugeOrder[0]!,'normal',215,'survival',13,zhugeDeployment(c,st,'normal')).state.find('z_liang')!;
    expect(JSON.stringify(geared.stats)).not.toBe(JSON.stringify(plain.stats));
    // 사마의에게 옮기면 제갈량은 벗는다(한 보물은 한 사람만).
    equipSlot(c,'sima_yi','armor',armor.id);expect(c.loadouts?.['제갈량']?.armor).toBeUndefined();
  });
  it('레벨은 인물마다 기억된다: 기록이 높으면 그 레벨, 없으면 장의 기본 레벨',()=>{
    const st=chapters[zhugeOrder[0]!]!.stage,c=freshCampaign();
    const base=zhugeLevel(c,'제갈량',st,'normal');
    c.retinueXp={제갈량:999999};
    expect(zhugeLevel(c,'제갈량',st,'normal')).toBeGreaterThan(base);
    expect(zhugeDeployment(c,st,'normal').levels.z_liang).toBe(zhugeLevel(c,'제갈량',st,'normal'));
  });
  it('이기면 출진한 장수의 이름별 기록이 자란다',()=>{
    const c=freshCampaign();
    growZhuge(c,[{id:'z_liang',name:'제갈량',level:3},{id:'enemy_x',name:'조인',level:5}],{z_liang:120},70);
    expect(c.retinueXp?.제갈량).toBeGreaterThan(0);
    expect(c.retinueXp?.조인).toBeUndefined();
  });
});
