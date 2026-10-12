import {describe,it,expect,beforeEach} from 'vitest';
import {freshCampaign,readCampaign,writeCampaign,mergeCampaigns,mergeRunCampaign,CAMPAIGN_KEYS,OFFICERS,treasures,xpAtLevel,levelInfo} from '../src/progression.ts';
import {sealTiers,claimSealTier,sealTreasure,sealClaimed} from '../src/seal-rewards.ts';
import {chapters,campaignOrder,sealNamesOf,Session} from '../src/session.ts';
import {romanceOf} from '../src/romance.ts';
import {choiceFlags} from '../src/story-stage.ts';
import {scriptOf} from '../src/scenario.ts';

const store=new Map<string,string>();
beforeEach(()=>{store.clear();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};});

describe('연의와 천명의 길: 성장 기록 한 칸',()=>{
  it('따로 저장하던 천명의 길 칸은 연의 칸에 합쳐지고 지워진다(레벨은 큰 쪽, 보물은 모두)',()=>{
    const main=freshCampaign();main.xp.sima_yi=5000;main.xp.sima_lang=900;main.treasures.push('taiping');main.rewards.push('S1-01:normal');writeCampaign(main,CAMPAIGN_KEYS.main);
    const run=freshCampaign();run.xp.sima_yi=2000;run.xp.sima_lang=3000;run.treasures.push('sevenstar');run.rewards.push('S1-02:normal');run.retinueXp={하후패:700};run.completedRuns=['r1'];writeCampaign(run,CAMPAIGN_KEYS.run);
    expect(mergeRunCampaign()).toBe(true);
    const c=readCampaign();
    expect(c.xp.sima_yi).toBe(5000);expect(c.xp.sima_lang).toBe(3000);
    expect(c.treasures).toEqual(expect.arrayContaining(['taiping','sevenstar']));
    expect(c.rewards).toEqual(['S1-01:normal']);
    expect(c.retinueXp).toEqual({하후패:700});expect(c.completedRuns).toEqual(['r1']);
    expect(localStorage.getItem(CAMPAIGN_KEYS.run)).toBeNull();
    expect(mergeRunCampaign()).toBe(false);
  });
  it('합치기는 장비 배치를 연의 쪽으로 둔다',()=>{
    const a=freshCampaign(),b=freshCampaign();a.equipped.sima_yi='taiping';b.equipped.sima_yi='sevenstar';
    expect(mergeCampaigns(a,b).equipped.sima_yi).toBe('taiping');
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
  it('이야기 선택의 사기·방어 효과를 등용 장수도 받는다',()=>{
    const s=new Session(campaignOrder[0]!,'normal',215,'survival',13,{levels:{sima_yi:5,sima_lang:5,sima_fang:5,cao_zhen:5},equipped:{},storyMods:{rally:true,guard:true},retinue:[{id:'rt_0',name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1}]} as never);
    const u=s.state.find('rt_0')!;expect(u.statuses.some(x=>x.kind==='rally')).toBe(true);expect(u.statuses.some(x=>x.kind==='guard')).toBe(true);
  });
  it('저장·불러오기를 거쳐도 남고, 세 명 이상이면 기록을 거부한다',()=>{
    const base={levels:{sima_yi:5,sima_lang:5,sima_fang:5,cao_zhen:5},equipped:{},retinue:[{id:'rt_0',name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1}]};
    const s=new Session(campaignOrder[0]!,'normal',215,'survival',13,base as never);
    const data=JSON.parse(JSON.stringify(s.save()));expect(Session.load(data).state.find('rt_0')?.name).toBe('장합');
    data.deployment.retinue=[0,1,2].map(i=>({id:'rt_'+i,name:'장합',unitClass:'cavalry',level:4,xp:0,hp:1}));
    expect(()=>Session.load(data)).toThrow();
  });
});

describe('등용 장수 개별 성장 · 이어하기',()=>{
  it('xpAtLevel은 levelInfo의 역: 그 레벨이 막 된 경험치',()=>{
    for(const lv of [1,2,7,20,39])expect(levelInfo(xpAtLevel(lv)).level).toBe(lv);
  });
  it('등용 장수 경험치는 저장했다 다시 읽어도 남고, 이상한 값은 버린다',()=>{
    const c=freshCampaign();c.retinueXp={'장합':1234,'':5,'너무긴이름너무긴이름너무긴':9,'가충':-3};writeCampaign(c);
    expect(readCampaign().retinueXp).toEqual({'장합':1234});
  });
  it('저장된 전투를 불러오면 아군 차례에서 다시 잡을 수 있다(적 차례는 화면 없이 넘긴다)',()=>{
    const s=new Session(campaignOrder[0]!,'normal',215,'survival',13,{levels:{sima_yi:5,sima_lang:5,sima_fang:5,cao_zhen:5},equipped:{}} as never);
    for(const u of s.state.living('player'))s.act({kind:'wait',unit:u.id});
    s.act({kind:'endPhase'});
    const loaded=Session.load(JSON.parse(JSON.stringify(s.save())));
    for(let i=0;i<4000;i++){const st=loaded.state;if(st.outcome!=='ongoing'||st.activeDialogue||loaded.activeDuel)break;if(['player','ally'].includes(st.currentSide)&&st.living(st.currentSide).some(u=>!u.hasActed))break;if(!loaded.tick())break;}
    expect(['player','ally']).toContain(loaded.state.currentSide);expect(loaded.state.turn).toBeGreaterThanOrEqual(1);
  });
});

describe('야망 분기 · 등용 장수 COST',()=>{
  it('선택지마다 야망 값이 실제 연의 장 선택지에 붙어 있다',async()=>{
    const {CHOICE_AMBITION,ROUTE_AMBITION}=await import('../src/ambition.ts');const fs=await import('node:fs');
    for(const k of Object.keys(CHOICE_AMBITION)){const [stage,node,opt]=k.split(':');const st=JSON.parse(fs.readFileSync(new URL(`../../data/stages/${stage}.json`,import.meta.url),'utf8'));
      const d=(st.dialogues??[]).find((x:{id:string})=>x.id===node);expect(d,k).toBeTruthy();expect(d.options.some((o:{id:string})=>o.id===opt),k).toBe(true);}
    const {ROUTES}=await import('../src/fate.ts');for(const id of Object.keys(ROUTE_AMBITION))expect(ROUTES.some(r=>r.id===id),id).toBe(true);
  });
  it('이긴 장의 선택이 쌓이고, 같은 장을 다시 이기면 그 장의 몫만 바뀐다',async()=>{
    const {recordStageChoices,ambition,ambitionOk}=await import('../src/ambition.ts');
    expect(ambition()).toBe(0);expect(ambitionOk('serve',0)).toBe(false);expect(ambitionOk('shu',0)).toBe(true);
    recordStageChoices('S1-02',[{nodeId:'bribe',optionId:'fight'},{nodeId:'fight_confirm',optionId:'commit'}]);
    recordStageChoices('S1-03',[{nodeId:'mountain_choice',optionId:'bluff'}]);
    expect(ambition()).toBe(35);expect(ambitionOk('yuan',ambition())).toBe(true);
    recordStageChoices('S1-02',[{nodeId:'bribe',optionId:'pay'}]);expect(ambition()).toBe(10);
  });
  it('같은 물음에 여러 번 답하면(설전에서 틀려 다시 묻기) 마지막 답만 친다',async()=>{
    const {recordStageChoices,ambition}=await import('../src/ambition.ts');
    recordStageChoices('S1-11',[{nodeId:'zhang_zhao',optionId:'arrogant'},{nodeId:'zhang_zhao',optionId:'arrogant'},{nodeId:'zhang_zhao',optionId:'present'}]);
    expect(ambition()).toBe(-5);
  });
  it('홀로 서는 장(꿈속 대결·건업 설전)에는 등용 장수가 서지 않는다',async()=>{
    const {optionalOfficers,soloStage}=await import('../src/sortie.ts');
    for(const id of ['S1-04','S1-11']){const i=campaignOrder.find(k=>chapters[k]!.stage.id===id)!;
      expect(optionalOfficers(chapters[i]!.stage,chapters[i]!.map).capacity).toBe(0);expect(soloStage(chapters[i]!.stage)).toBe(true);
      const rt=[{id:'rt_0',name:'하후패',unitClass:'infantry' as never,level:5,xp:0,hp:1,officer:true as const}];
      const s=new Session(i,'normal',215,'survival',13,{levels:{sima_yi:5},equipped:{},retinue:rt});
      expect([...s.state.units.values()].some(u=>u.name==='하후패')).toBe(false);}
  });
  it('등용 장수는 같은 COST 안에 든다: 선택 장수 예산이 줄고, 표에 함께 잡힌다',async()=>{
    const {pickExtras,storyCostSheet,optionalOfficers,unitCost}=await import('../src/sortie.ts');
    const c=chapters[campaignOrder.find(i=>optionalOfficers(chapters[i]!.stage,chapters[i]!.map).allowed.length>0)!]!;
    const lv={sima_yi:12,sima_lang:12,sima_fang:12,cao_zhen:12},{allowed}=optionalOfficers(c.stage,c.map);
    const free=pickExtras(c.stage,c.map,allowed,'extreme',lv),tight=pickExtras(c.stage,c.map,allowed,'extreme',lv,99);
    expect(tight.length).toBe(0);expect(free.length).toBeGreaterThanOrEqual(tight.length);
    const sheet=storyCostSheet(c.stage,[],lv,'extreme',[{name:'장합',unitClass:'cavalry'}]);
    expect(sheet.rows.some(r=>r.id==='rt:장합')).toBe(true);expect(sheet.used).toBe(storyCostSheet(c.stage,[],lv,'extreme').used+unitCost('cavalry'));
  });
});

describe('연의 이야기 표식',()=>{
  it('다시 볼 때 지울 수 있게, 그 장의 선택지가 세우는 표식을 모두 모은다',()=>{
    const f=choiceFlags(scriptOf('S1-02')!.scenes);
    expect(f.has('h1_coin_split')).toBe(true);expect(f.has('h1_led_refugees')).toBe(true);
    expect(choiceFlags(scriptOf('S1-01')!.scenes).has('h1_armed')).toBe(true);
  });
});
