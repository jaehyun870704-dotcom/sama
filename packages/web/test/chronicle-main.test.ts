import {describe,it,expect,beforeEach} from 'vitest';
import {freshCampaign,readCampaign,writeCampaign,CAMPAIGN_KEYS,OFFICERS,treasures} from '../src/progression.ts';
import {sealTiers,claimSealTier,sealTreasure,sealClaimed} from '../src/seal-rewards.ts';
import {chapters,campaignOrder,sealNamesOf,Session} from '../src/session.ts';
import {romanceOf} from '../src/romance.ts';

const store=new Map<string,string>();
beforeEach(()=>{store.clear();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};});

describe('연의가 본편: 성장 기록 칸 분리',()=>{
  it('연의 칸과 천명의 길 칸은 서로 덮어쓰지 않는다',()=>{
    const main=freshCampaign();main.xp.sima_yi=5000;main.treasures.push('taiping');writeCampaign(main,CAMPAIGN_KEYS.main);
    writeCampaign(freshCampaign(),CAMPAIGN_KEYS.run);
    expect(readCampaign(CAMPAIGN_KEYS.main).xp.sima_yi).toBe(5000);
    expect(readCampaign().treasures).toContain('taiping');
    expect(readCampaign(CAMPAIGN_KEYS.run).xp.sima_yi).toBe(0);
  });
  it('받은 인장 보상은 저장했다 다시 읽어도 남는다',()=>{
    const c=freshCampaign();c.sealRewards=['S1:22','bad'];writeCampaign(c);expect(readCampaign().sealRewards).toEqual(['S1:22']);
  });
});

describe('연의 인장',()=>{
  it('32장 모두 인장 이름 세 개가 있다(전투 전에도 보인다)',()=>{
    expect(campaignOrder).toHaveLength(32);
    for(const i of campaignOrder){const n=sealNamesOf(i);expect(n).toHaveLength(3);for(const x of n)expect(x.length).toBeGreaterThan(1);}
    const s=new Session(campaignOrder[3]!,'normal',215);expect(s.sealNames).toEqual(sealNamesOf(campaignOrder[3]!));
  });
  it('상·중·하편은 11·14·7장',()=>{
    const count=(p:string)=>campaignOrder.filter(i=>chapters[i]!.stage.id.startsWith(p)).length;
    expect([count('S1-'),count('S2-'),count('S3-')]).toEqual([11,14,7]);
  });
  it('편별 인장 보상: 문턱 1/3·2/3·전부, 한 번만, 재화 없이 경험치와 보물',()=>{
    const tiers=sealTiers(0,11);expect(tiers.map(t=>t.need)).toEqual([22,44,66]);
    const c=freshCampaign(),before=c.xp.sima_lang!;
    expect(claimSealTier(c,tiers[0]!,21)).toBeNull();
    const pick=sealTreasure(c,tiers[0]!.key);expect(pick).toBeDefined();expect(treasures.find(t=>t.id===pick)?.quest?.startsWith('R')).toBe(true);
    const got=claimSealTier(c,tiers[0]!,22)!;expect(got.treasure).toBe(pick);expect(c.treasures).toContain(pick);
    for(const id of OFFICERS)expect(c.xp[id]).toBeGreaterThan(id==='sima_lang'?before:0);
    expect(sealClaimed(c,tiers[0]!.key)).toBe(true);expect(claimSealTier(c,tiers[0]!,66)).toBeNull();
  });
});

describe('연의에 데려가는 등용 장수',()=>{
  it('사마의 곁에 서고, 연의 능력치를 받으며, 그 장의 인물과 겹치지 않는다',()=>{
    const s=new Session(campaignOrder[0]!,'normal',215,'survival',13,{levels:{sima_yi:5,sima_lang:5,sima_fang:5,cao_zhen:5},equipped:{},retinue:[{id:'rt_0',name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1},{id:'rt_1',name:'사마랑',unitClass:'infantry',level:4,xp:0,hp:1}]} as never);
    const u=s.state.find('rt_0');expect(u?.name).toBe('장합');expect(u?.side).toBe('player');expect(romanceOf(u!)?.name).toBe('장합');
    expect([...s.state.units.values()].filter(x=>x.name==='사마랑')).toHaveLength(1);
  });
  it('저장·불러오기를 거쳐도 남고, 세 명 이상이면 기록을 거부한다',()=>{
    const base={levels:{sima_yi:5,sima_lang:5,sima_fang:5,cao_zhen:5},equipped:{},retinue:[{id:'rt_0',name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1}]};
    const s=new Session(campaignOrder[0]!,'normal',215,'survival',13,base as never);
    const data=JSON.parse(JSON.stringify(s.save()));expect(Session.load(data).state.find('rt_0')?.name).toBe('장합');
    data.deployment.retinue=[0,1,2].map(i=>({id:'rt_'+i,name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1}));
    expect(()=>Session.load(data)).toThrow();
  });
});
