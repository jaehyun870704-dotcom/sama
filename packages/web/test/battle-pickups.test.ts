/**
 * 전장 소모품 줍기(웹 계층): 이야기 전투(규칙판 13)에만 놓이고, 주운 것은 전장 보관함에 바로 들어가 쓸 수 있으며,
 * 전투가 끝나면 이야기 보관함에 더해지고 결과 화면 소식에 「주운 도구」로 나온다. 저장을 다시 열어도 같다.
 * 대화창이 사람을 가리지 않게 카메라를 옮기는 거리(planTalkShift)도 여기서 본다.
 */
import {describe,it,expect,beforeEach} from 'vitest';
import {Session,chapters,campaignOrder,zhugeOrder} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {settleGear,gearNews,pickedFromLog} from '../src/gear-battle.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {planTalkShift} from '../src/story-stage.ts';
import {key,type Coord} from '../../core/src/index.ts';

const store=new Map<string,string>();
beforeEach(()=>{store.clear();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};});
const S=(id:string)=>campaignOrder.find(i=>chapters[i]!.stage.id===id)!;
const Z=(id:string)=>zhugeOrder.find(i=>chapters[i]!.stage.id===id)!;
const at=(k:string):Coord=>{const [x,y]=k.split(',').map(Number);return {x:x!,y:y!};};

describe('전장 소모품이 놓이는 전투',()=>{
  it('이야기 전투(규칙판 13)에는 놓이고, 예전 규칙판과 출진 기록 없는 전투에는 없다',()=>{
    expect(new Session(S('S1-08'),'normal',215,'strategy',13,{...deployment(freshCampaign(),true),wide:2}).state.pickups.size).toBeGreaterThan(0);
    expect(new Session(S('S1-08'),'normal',215,'strategy',12,{...deployment(freshCampaign(),true),wide:2}).state.pickups.size).toBe(0);
    expect(new Session(S('S1-08'),'normal',215,'strategy',13).state.pickups.size).toBe(0);
    const z=chapters[Z('Z1-08')]!.stage;
    const zs=new Session(Z('Z1-08'),'normal',215,'strategy',13,zhugeDeployment(freshCampaign(),z,'normal'));
    expect([...zs.state.pickups.values()].filter(v=>['bean','rice','water'].includes(v)).length).toBeGreaterThanOrEqual(4);
  });
});

describe('줍고, 쓰고, 이야기 보관함에 더한다',()=>{
  it('주운 콩을 바로 쓰고, 끝나면 보관함에 남은 만큼 더해지고 소식에 나온다(저장 재생도 같다)',()=>{
    const c=freshCampaign();c.supplies={rice:1};
    const s=new Session(S('S1-08'),'normal',215,'strategy',13,{...deployment(c,true),wide:2});
    expect(s.state.inventory).toEqual({rice:1});
    // 사마의가 이번 차례에 닿는 칸에 콩·물을 둔다(전장 배치와 상관없이 줍기 규칙만 본다).
    const hero=s.state.get('sima_yi'),reach=[...s.state.map.reachable(hero,s.state.occupancy()).keys()].filter(k=>k!==key(hero.pos));
    s.state.pickups.clear();s.state.pickups.set(reach[0]!,'bean');
    const moved=s.act({kind:'move',unit:'sima_yi',to:at(reach[0]!)});expect(moved.ok,moved.error).toBe(true);
    expect(s.state.inventory.bean).toBe(1);
    expect(s.state.log.some(e=>e.t==='pickup'&&e.item==='bean')).toBe(true);
    expect(pickedFromLog(s.state.log)).toEqual({bean:1});
    const got=settleGear(c,s.state,s.deployment);
    expect(got.picked).toEqual({bean:1});
    expect(got.used).toEqual({});
    expect(c.supplies).toEqual({rice:1,bean:1});
    expect(gearNews(got)[0]).toBe('주운 도구 · 회복의 콩 1개');
  });
  it('주운 것을 그 전투에서 다 쓰면 보관함은 그대로, 소식에는 주운 것과 쓴 것이 함께 나온다',()=>{
    const c=freshCampaign();
    const s=new Session(S('S1-08'),'normal',215,'strategy',13,{...deployment(c,true),wide:2});
    const hero=s.state.get('sima_yi'),reach=[...s.state.map.reachable(hero,s.state.occupancy()).keys()].filter(k=>k!==key(hero.pos));
    s.state.pickups.clear();s.state.pickups.set(reach[0]!,'bean');
    expect(s.act({kind:'move',unit:'sima_yi',to:at(reach[0]!)}).ok).toBe(true);
    hero.hp=Math.max(1,hero.hp-60);
    const used=s.act({kind:'item',unit:'sima_yi',item:'bean'});expect(used.ok,used.error).toBe(true);
    const got=settleGear(c,s.state,s.deployment);
    expect(got.picked).toEqual({bean:1});expect(got.used).toEqual({bean:1});
    expect(c.supplies??{}).toEqual({});
    expect(gearNews(got)).toEqual(['주운 도구 · 회복의 콩 1개','쓴 도구 · 회복의 콩 1개']);
  });
  it('저장을 다시 열면 같은 자리에 같은 소모품이 놓이고, 이미 주운 칸은 비어 있다',()=>{
    const s=new Session(S('S1-08'),'normal',215,'strategy',13,{...deployment(freshCampaign(),true),wide:2});
    const before=[...s.state.pickups];
    const back=Session.load(JSON.parse(JSON.stringify(s.save())));
    expect([...back.state.pickups]).toEqual(before);
  });
});

describe('대화창이 서 있는 사람을 가리지 않게 카메라를 옮긴다',()=>{
  const box=(l:number,r:number,t:number,b:number)=>({l,r,t,b});
  it('아래 창(흉상 포함)에 걸린 사람만큼 위로 올린다',()=>{
    const r=planTalkShift([box(100,200,250,330),box(500,600,150,230)],[box(0,1000,350,500),box(20,240,260,500)],false,500);
    expect(r.shift).toBe(-74);expect(r.left).toBe(0);
  });
  it('맨 위 사람이 무대 밖으로 나가지 않는 데까지만 올리고, 남는 가림을 알려 준다',()=>{
    const r=planTalkShift([box(100,200,250,330),box(500,600,40,120)],[box(0,1000,260,500)],false,500);
    expect(r.shift).toBe(-36);expect(r.left).toBe(38);
  });
  it('위 창이면 아래로 내린다 · 가리지 않으면 그대로',()=>{
    expect(planTalkShift([box(100,200,60,140)],[box(0,1000,0,100)],true,500).shift).toBe(44);
    expect(planTalkShift([box(100,200,60,140)],[box(300,1000,0,100)],true,500).shift).toBe(0);
  });
});
