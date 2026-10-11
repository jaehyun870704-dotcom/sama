import {describe,it,expect} from 'vitest';
import {arcMap,arcRoutes,branchLevel,branchFloor,FORK_ANCHOR} from '../src/chronicle-map.ts';
import {ROUTES,routeById} from '../src/fate.ts';
import {Session,chapters,campaignOrder} from '../src/session.ts';
import {RUN_CHAPTER} from '../src/run-ui.ts';
import catalogue from '../src/campaign.json';

const stagesOf=(a:number)=>catalogue.filter(c=>c.id.startsWith(`S${a}-`)).map(c=>({id:c.id,name:c.name}));
describe('연의 지도: 줄기와 선택분기 갈림길',()=>{
  it('줄기는 그 편의 연의 장을 차례로 잇고, 갈림 장은 실제 연의 장이다',()=>{
    for(const a of [1,2,3] as const){const nodes=arcMap(a,stagesOf(a)),trunk=nodes.filter(n=>n.kind==='story');
      expect(trunk.map(n=>n.stage)).toEqual(stagesOf(a).map(s=>s.id));
      for(const n of trunk.slice(1))expect(n.prev).toBe(trunk[trunk.indexOf(n)-1]!.id);
      expect(chapters.some(c=>c.stage.id===FORK_ANCHOR[a])).toBe(true);}
  });
  it('신세력 전용 길을 뺀 모든 가상 길이 어느 편엔가 가지로 그려진다',()=>{
    const drawn=new Set([1,2,3].flatMap(a=>arcRoutes(a as 1|2|3).map(r=>r.id)));
    for(const r of ROUTES.filter(r=>!r.history&&!r.custom))expect(drawn.has(r.id),r.id).toBe(true);
  });
  it('가지마다 가상 전장들 뒤에 우두머리 결전이 오고, 첫 칸만 갈림 조건을 가진다',()=>{
    for(const a of [1,2,3] as const){const nodes=arcMap(a,stagesOf(a));
      for(const r of arcRoutes(a)){const col=nodes.filter(n=>n.route===r.id);
        expect(col.at(-1)!.kind).toBe('boss');expect(col.filter(n=>n.gate)).toHaveLength(1);
        const g=col[0]!.gate!;if(g.startsWith('boss:'))expect(routeById(g.slice(5))?.act).toBe(a-1);else expect(g).toBe(FORK_ANCHOR[a===1?1:a]);
        // 이 길에 이르는 선택: 편마다 하나씩, 이 편의 칸은 자기 길
        expect(col[0]!.routePath?.[a]).toBe(r.id);for(let k=1;k<a;k++)expect(col[0]!.routePath?.[k as 1|2]).toBeTruthy();}}
  });
  it('가지 전투를 실제로 열 수 있다(적장·우두머리가 전장에 선다)',()=>{
    const nodes=[1,2,3].flatMap(a=>arcMap(a as 1|2|3,stagesOf(a)).filter(n=>n.kind==='tale'||n.kind==='boss'));
    for(const n of [nodes[0]!,nodes.find(x=>x.kind==='boss')!,nodes.at(-1)!]){
      const party=[{id:'sima_yi',name:'사마의',unitClass:'strategist' as const,level:8,xp:0,hp:1,hero:true as const},{id:'of1',name:'사마랑',unitClass:'infantry' as const,level:7,xp:0,hp:1,officer:true as const}];
      const s=new Session(RUN_CHAPTER,'normal',11,'survival',13,{levels:{sima_yi:8,sima_lang:1,sima_fang:1,cao_zhen:1},equipped:{},run:{seed:11,floor:branchFloor(n),kind:n.kind==='boss'?'boss':'tale',party,relics:[],route:n.routePath as never,...(n.kind==='tale'?{tale:n.tale!.id}:{}),enemyBase:branchLevel(n,6)},branch:n.id} as never);
      expect(s.state.find(n.kind==='boss'?'boss':'target')?.side).toBe('enemy');
      const data=JSON.parse(JSON.stringify(s.save()));expect(Session.load(data).deployment?.branch).toBe(n.id);
    }
    expect(campaignOrder.length).toBe(32);
  });
});
