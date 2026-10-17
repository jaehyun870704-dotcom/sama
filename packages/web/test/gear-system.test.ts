import {describe,it,expect,beforeEach} from 'vitest';
import {Session,chapters,campaignOrder,zhugeOrder} from '../src/session.ts';
import {freshCampaign,deployment,award,treasures,treasureInfo,applyTreasure,equipSlot,equippedItems,readCampaign,writeCampaign,CAMPAIGN_KEYS,buyGear,sellGear,buySupply,sellSupply,goldOf,addGearExp,gearLevel,tierUnlocked,tierThresholds,awardZhugeTreasures,isNamedGear,canWear,chapterGold,type Campaign} from '../src/progression.ts';
import {expeditions,MISSION_REWARDS,expeditionReward} from '../src/expeditions.ts';
import {settleGear,gearExpFromLog} from '../src/gear-battle.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {shopMarkup} from '../src/shop.ts';
import {campMarkup} from '../src/camp.ts';
import {legacyGear,LEGACY_GEAR_IDS} from '../src/gear-migration.ts';
import {makeUnit,gearDef} from '../../core/src/index.ts';

const store=new Map<string,string>();
beforeEach(()=>{store.clear();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};});
const S=(id:string)=>campaignOrder.find(i=>chapters[i]!.stage.id===id)!;

describe('고유 보물 50점의 획득처',()=>{
  it('50점 모두 사마의전과 제갈량전에서 하나씩 얻는 곳이 있다',()=>{
    const sIds=new Set(campaignOrder.map(i=>chapters[i]!.stage.id)),zIds=new Set(zhugeOrder.map(i=>chapters[i]!.stage.id)),exp=new Set(expeditions.map(m=>m.id));
    expect(treasures).toHaveLength(50);
    for(const t of treasures){expect(sIds.has(t.stage)||exp.has(t.stage),t.id+' '+t.stage).toBe(true);expect(zIds.has(t.zstage),t.id+' '+t.zstage).toBe(true);}
  });
  it('사마의전을 끝까지 이기고 외전을 모두 넘으면 50점을 모두 얻는다',()=>{
    const c=freshCampaign();
    for(const i of campaignOrder){const st=chapters[i]!.stage;award(c,st.id,'normal',st.deployment.forced,[1]);}
    // 이른 전설 보물(상편 4등급)은 극한 승리에서만 나온다.
    expect(c.treasures).not.toContain('yitian');
    for(const i of campaignOrder){const st=chapters[i]!.stage;award(c,st.id,'extreme',st.deployment.forced,[1]);}
    for(const m of expeditions.filter(m=>m.kind==='quest'||m.kind==='challenge').sort((a,b)=>a.id.localeCompare(b.id)))expect(expeditionReward(c,m.id,'r-'+m.id,true).xp).toBeGreaterThan(0);
    expect(treasures.filter(t=>!c.treasures.includes(t.id)).map(t=>t.id)).toEqual([]);
    for(const [id,r] of Object.entries(MISSION_REWARDS))if(r.named)expect(treasures.find(t=>t.id===r.named)!.stage,id).toBe(id);
  });
  it('제갈량전의 장을 모두 이기면 50점을 모두 얻는다',()=>{
    const c=freshCampaign();for(const i of zhugeOrder)awardZhugeTreasures(c,chapters[i]!.stage.id);
    expect(treasures.filter(t=>!c.treasures.includes(t.id)).map(t=>t.id)).toEqual([]);
    expect(awardZhugeTreasures(c,'Z1-01')).toEqual([]);
  });
});

describe('장비를 전장에 입히기',()=>{
  it('레벨에 맞는 능력과 고유 기능을 입히고, 계통에 맞지 않으면 입히지 않는다',()=>{
    const u=makeUnit({id:'a',unitClass:'cavalry',level:10,side:'player',pos:{x:0,y:0}}),atk=u.stats.attack;
    expect(applyTreasure(u,'greenDragon',true,9)).toBe(true);
    expect(u.stats.attack-atk).toBe(28);expect(u.traits).toContain('gear:noCounter');expect(u.gearBonus).toEqual({attack:28});
    expect(applyTreasure(u,'yitian')).toBe(false);
    const robe=makeUnit({id:'b',unitClass:'strategist',level:10,side:'player',pos:{x:0,y:0}});
    expect(applyTreasure(robe,'shop:armor:2#1')).toBe(false);expect(applyTreasure(robe,'shop:robe:2#1')).toBe(true);
    applyTreasure(robe,'qingshu');applyTreasure(robe,'phoenixRobe');expect(robe.traits.filter(t=>t==='gear:regen20')).toHaveLength(1);
  });
  it('출진 기록에 장비 레벨과 보관함 도구가 실리고, 전장 보관함으로 꺼내 쓴다(저장 재생도 같다)',()=>{
    const c=freshCampaign();c.treasures.push('shop:fan:2#1');c.shopSerial=1;c.supplies={bean:2,promotion:1};addGearExp(c,'shop:fan:2#1',80);
    expect(gearLevel(c,'shop:fan:2#1')).toBe(3);
    expect(equipSlot(c,'sima_yi','weapon','shop:fan:2#1')).toBe(true);
    const d=deployment(c,true);expect(d.gearLevels).toEqual({'shop:fan:2#1':3});expect(d.supplies).toEqual({bean:2,promotion:1});expect(d.gearRules).toBe(2);
    const s=new Session(S('S1-01'),'normal',215,'survival',13,d),hero=s.state.get('sima_yi');
    expect(s.state.inventory).toEqual({bean:2,promotion:1});
    expect(s.act({kind:'item',unit:'sima_yi',item:'bean'}).ok).toBe(false);
    const from=hero.unitClass,ok=s.act({kind:'item',unit:'sima_yi',item:'promotion'});expect(ok.ok,ok.error).toBe(true);expect(s.state.inventory.promotion).toBe(0);expect(hero.unitClass).not.toBe(from);
    const back=Session.load(JSON.parse(JSON.stringify(s.save())));expect(back.state.inventory.promotion).toBe(0);expect(back.state.get('sima_yi').unitClass).toBe(hero.unitClass);
    // 전투가 끝나면 쓴 도구를 보관함에서 뺀다.
    const got=settleGear(c,s.state,s.deployment);expect(got.used).toEqual({promotion:1});expect(c.supplies).toEqual({bean:2});
  });
  it('사신보옥은 그 계통에 사신 책략을 연다',()=>{
    const c=freshCampaign();c.treasures.push('vermilionJewel');expect(equipSlot(c,'sima_yi','accessory','vermilionJewel')).toBe(true);
    const s=new Session(S('S1-01'),'normal',215,'survival',13,deployment(c,true));
    expect(s.state.get('sima_yi').strategies).toContain('jewelVermilion');expect(s.state.strategies.get('jewelVermilion')?.name).toBe('주작');
    expect(equipSlot(c,'sima_lang','accessory','vermilionJewel')).toBe(false);
  });
  it('장비 경험치: 무기는 공격·반격으로, 방어구는 맞아서 쌓인다',()=>{
    const log=[{t:'attack',attacker:'a',defender:'b',damage:5,hit:true,critical:false},{t:'attack',attacker:'b',defender:'a',damage:0,hit:false,critical:false},{t:'counter',attacker:'a',defender:'b',damage:3,hit:true}] as Parameters<typeof gearExpFromLog>[0];
    expect(gearExpFromLog(log,'a')).toEqual({weapon:5,armor:1});
  });
});

describe('상점 · 금',()=>{
  it('이야기마다 금을 따로 쓰고, 사면 낱개가 보관함에, 팔면 절반을 돌려받는다',()=>{
    expect(goldOf(freshCampaign(),'S')).toBe(3000);expect(goldOf(freshCampaign(),'Z')).toBe(3000);
    // 아래는 금 1000에서 시작해 모자랄 때를 본다(시작 금은 3000 · 2026-10-17).
    const c=freshCampaign();c.gold={S:1000,Z:1000};expect(goldOf(c,'S')).toBe(1000);expect(goldOf(c,'Z')).toBe(1000);
    const id=buyGear(c,'S','shop:sword:2')!;expect(id).toBe('shop:sword:2#1');expect(goldOf(c,'S')).toBe(400);expect(goldOf(c,'Z')).toBe(1000);
    expect(buyGear(c,'S','shop:sword:2')).toBeUndefined();
    expect(buyGear(c,'Z','shop:sword:1')).toBe('shop:sword:1#2');
    expect(equipSlot(c,'sima_lang','weapon',id)).toBe(true);
    expect(sellGear(c,'S',id)).toBe(300);expect(c.treasures).not.toContain(id);expect(equippedItems(c,'sima_lang')).toEqual([]);expect(goldOf(c,'S')).toBe(700);
    c.treasures.push('yitian');expect(sellGear(c,'S','yitian')).toBe(0);expect(c.treasures).toContain('yitian');
    expect(buySupply(c,'Z','bean',3)).toBe(true);expect(c.supplies?.bean).toBe(3);expect(buySupply(c,'Z','peach')).toBe(false);expect(sellSupply(c,'Z','bean',1)).toBe(25);
  });
  it('등급은 이야기 길이의 1/5 · 1/2 · 4/5를 이기면 열린다',()=>{
    expect(tierThresholds(32)).toEqual([0,6,16,26]);expect(tierThresholds(34)).toEqual([0,7,17,27]);
    expect(tierUnlocked(1,0,32)).toBe(true);expect(tierUnlocked(2,5,32)).toBe(false);expect(tierUnlocked(2,6,32)).toBe(true);expect(tierUnlocked(4,26,32)).toBe(true);
    expect(chapterGold(0,true)).toBe(300);expect(chapterGold(10,false)).toBe(Math.round(700/3));
  });
  it('상점 화면: 고른 장수가 못 다는 장비는 흐리게 하고 이유를 쓴다, 잠긴 등급은 살 수 없다',()=>{
    const c=freshCampaign();c.treasures.push('yitian');
    const html=shopMarkup(c,{story:'S',tab:'weapon',kind:'all',officer:'cao_zhen',switchable:true},[{key:'cao_zhen',name:'조진',unitClass:'heavyCav'}],{wins:0,total:32});
    expect(html).toContain('data-shop-buy="shop:spear:1"');expect(html).not.toContain('data-shop-buy="shop:spear:2"');expect(html).toContain('군주·보병·적병·해적계만');
    expect(html).toContain('팔 수 없음');expect(html).not.toMatch(/[一-鿿]/);
    const tools=shopMarkup(c,{story:'Z',tab:'supply',kind:'all',officer:'',switchable:false},[],{wins:0,total:34});
    expect(tools).toContain('회복의 콩');expect(tools).toContain('팔지 않음');
  });
  it('정비 화면도 같은 장착 규칙을 쓴다',()=>{
    const c=freshCampaign();c.treasures.push('yitian','serpentSpear');
    const u=makeUnit({id:'cao_zhen',name:'조진',unitClass:'heavyCav',level:5,side:'player',pos:{x:0,y:0}});
    const html=campMarkup(c,[u],'cao_zhen','weapon','yitian',()=>'');
    expect(html).toContain('unfit');expect(html).toContain('군주·보병·적병·해적계만');
    expect(canWear('cao_zhen','serpentSpear').ok).toBe(true);
  });
});

describe('예전 저장 옮기기',()=>{
  it('지운 보물은 같은 칸·등급의 상점 장비로 바꾸고, 계통에 맞으면 그대로 장착한다',()=>{
    expect(LEGACY_GEAR_IDS).toHaveLength(114);expect(legacyGear('peerlessSword')).toEqual({slot:'weapon',grade:4});expect(legacyGear('yitian')).toBeUndefined();
    const old={version:1,xp:{sima_yi:3000},rewards:['S1-01:normal','S1-02:normal'],treasures:['peerlessSword','overlordArmor','moonSword','laozi','taiping','sevenstar','yitian','fan'],
      equipped:{},loadouts:{cao_zhen:{weapon:'peerlessSword',armor:'overlordArmor'},sima_yi:{weapon:'moonSword',accessory:'fan'},sima_lang:{weapon:'yitian'},장합:{accessory:'laozi'}}};
    store.set(CAMPAIGN_KEYS.main,JSON.stringify(old));
    const c=readCampaign();
    expect(c.treasures.filter(id=>!isNamedGear(id)).map(id=>id.replace(/#\d+$/,'')).sort()).toEqual(['shop:armor:4','shop:fan:3','shop:gloves:4','shop:spear:4'].sort());
    expect(treasureInfo(c.loadouts!.cao_zhen!.weapon!).kind).toBe('spear');
    expect(treasureInfo(c.loadouts!.cao_zhen!.armor!).kind).toBe('armor');
    expect(treasureInfo(c.loadouts!.sima_yi!.weapon!).kind).toBe('fan');
    // 백우선은 이제 무기 칸이라 보조구 자리에서 벗겨 보관함으로.
    expect(c.loadouts!.sima_yi!.accessory).toBeUndefined();expect(c.treasures).toContain('fan');
    expect(c.loadouts!.sima_lang!.weapon).toBe('yitian');
    expect(c.loadouts!['장합']?.accessory).toMatch(/^shop:gloves:4#/);
    // 계통에 맞지 않는 장착은 벗긴다.
    store.set(CAMPAIGN_KEYS.main,JSON.stringify({...old,loadouts:{cao_zhen:{weapon:'yitian'}}}));
    const d=readCampaign();expect(d.loadouts?.cao_zhen?.weapon).toBeUndefined();expect(d.treasures).toContain('yitian');
    // 다시 읽어도 같다(낱개 번호가 늘지 않는다).
    writeCampaign(c);const again=readCampaign();expect(again.treasures).toEqual(c.treasures);expect(again.loadouts).toEqual(c.loadouts);
  });
  it('지운 보물을 들고 나간 예전 전투 저장도 오류 없이 불러온다',()=>{
    const base=new Session(S('S1-01'),'normal',215,'survival',13,deployment(freshCampaign(),true)).save();
    const old=JSON.parse(JSON.stringify(base)) as {deployment:{loadouts?:Record<string,Record<string,string>>;gearRules?:number};journal:unknown[]};
    delete old.deployment.gearRules;old.deployment.loadouts={sima_yi:{weapon:'moonSword',accessory:'mengde'}};
    const s=Session.load(old);expect(s.state.stage.id).toBe('S1-01');expect(s.deployment?.loadouts?.sima_yi).toEqual({accessory:'mengde'});
  });
  it('이미 이긴 장의 고유 보물은 불러올 때 받는다(획득처가 바뀐 보물 포함)',()=>{
    store.set(CAMPAIGN_KEYS.main,JSON.stringify({version:1,xp:{},rewards:['S1-04:normal'],quests:['Q01'],challenges:['C06'],treasures:[],equipped:{}}));
    const c=readCampaign() as Campaign;expect(c.treasures).toEqual(expect.arrayContaining(['ironHelm','azureJewel']));
    // 상편의 4등급 전설 보물은 극한으로 이긴 기록이 있어야 받는다.
    expect(c.treasures).not.toContain('halberd');
    store.set(CAMPAIGN_KEYS.main,JSON.stringify({version:1,xp:{},rewards:['S1-04:normal','S1-04:extreme'],quests:['Q01'],challenges:['C06'],treasures:[],equipped:{}}));
    expect((readCampaign() as Campaign).treasures).toEqual(expect.arrayContaining(['halberd','mengde','lubuBow','ironHelm','azureJewel']));
    for(const id of c.treasures)expect(gearDef(id),id).toBeDefined();
  });
});

describe('제갈량전 출진',()=>{
  it('장수 이름에 단 장비를 입고, 출진 기록에 장비 레벨을 싣는다',()=>{
    const st=chapters[zhugeOrder[0]!]!.stage,c=freshCampaign();c.treasures.push('craneRobe');c.gearExp={craneRobe:200};
    expect(equipSlot(c,'제갈량','armor','craneRobe')).toBe(true);
    const d=zhugeDeployment(c,st,'normal');expect(d.gearLevels).toEqual({craneRobe:6});expect(d.gearRules).toBe(2);
  });
});
