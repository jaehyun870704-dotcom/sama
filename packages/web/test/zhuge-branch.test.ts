import {describe,it,expect} from 'vitest';
import {Session,chapters,zhugeOrder,zhugeBranchOrder} from '../src/session.ts';
import {freshCampaign,goldOf,supplyCount} from '../src/progression.ts';
import {zhugeDeployment,zhugeBase} from '../src/zhuge.ts';
import {ZHUGE_FORKS,BRANCH_NODES,BRANCH_LINES,branchNode,forkOf,isZhugeBranch} from '../src/zhuge/branches.ts';
import {zhugeMapNodes,zhugeNodeState,grantBranchReward,replayGold} from '../src/zhuge-map.ts';
import {isZhugeStage,ZHUGE_ROSTER} from '../src/zhuge-data.ts';
import {stageRules} from '../src/stage-rules.ts';
import {encounterLevels} from '../src/campaign-rules.ts';
import {dueLines} from '../src/battle-lines.ts';
import {gearDef,consumable} from '../../core/src/index.ts';

const trunk=()=>zhugeOrder.map(i=>({id:chapters[i]!.stage.id,title:chapters[i]!.stage.title}));
const idOf=(i:number)=>chapters[i]!.stage.id;

describe('제갈량전 선택분기',()=>{
  it('갈림 지점 여섯 곳 · 지점마다 가상 전장 둘과 우두머리 하나 · 본편 장 번호는 그대로',()=>{
    expect(ZHUGE_FORKS).toHaveLength(6);
    expect(zhugeOrder).toHaveLength(34);
    expect(zhugeBranchOrder).toHaveLength(18);
    // 가지 칸은 본편 뒤에 붙는다(옛 저장의 장 번호가 바뀌지 않는다).
    expect(Math.min(...zhugeBranchOrder)).toBeGreaterThan(Math.max(...zhugeOrder));
    const anchors=new Set(zhugeOrder.map(idOf));
    for(const f of ZHUGE_FORKS){
      expect(anchors.has(f.anchor),f.id).toBe(true);
      expect(f.nodes).toHaveLength(3);
      f.nodes.forEach((id,k)=>{const b=branchNode(id)!;expect(b.fork).toBe(f.id);expect(!!b.boss,id).toBe(k===2);expect(forkOf(id)?.id).toBe(f.id);});
    }
    expect(new Set(BRANCH_NODES.map(n=>n.id))).toEqual(new Set(zhugeBranchOrder.map(idOf)));
    for(const i of zhugeBranchOrder){expect(isZhugeBranch(idOf(i))).toBe(true);expect(isZhugeStage(idOf(i))).toBe(false);}
  });
  it('권장 레벨: 갈림 장 기본 레벨 +1 · +2 · 우두머리 +4(사마의전 branchLevel과 같은 계단)',()=>{
    for(const f of ZHUGE_FORKS){const a=encounterLevels[f.anchor]!;
      expect(f.nodes.map(id=>encounterLevels[id])).toEqual([a+1,a+2,a+4]);}
  });
  it('칸마다 규칙(천명 조건 이름 셋)과 전투 대사가 있고, 대사의 적장 id가 스테이지에 있다',()=>{
    for(const i of zhugeBranchOrder){const st=chapters[i]!.stage,id=st.id;
      expect(stageRules[id]?.sealNames,id).toHaveLength(3);
      const lines=BRANCH_LINES[id]!;expect(lines.length,id).toBeGreaterThanOrEqual(3);
      const json=JSON.stringify(st);
      for(const l of lines)if('retreat' in l.when)expect(json,`${id} ${l.id}`).toContain(`"${l.when.retreat}"`);
      // 출진 장수는 모두 제갈량전 명부에 있다.
      for(const u of st.deployment.forced)expect(ZHUGE_ROSTER.some(o=>o.id===u),`${id} ${u}`).toBe(true);
    }
  });
  it('각 칸을 처음 하는 사람의 레벨로 세운다: 출진 장수 · 이름난 적장 · 저장 재생',()=>{
    for(const i of zhugeBranchOrder){const st=chapters[i]!.stage,b=branchNode(st.id)!;
      const s=new Session(i,'normal',215,'strategy',13,{...zhugeDeployment(freshCampaign(),st,'normal'),wide:2});
      const players=s.state.living('player');
      expect(players.map(u=>u.id).sort(),st.id).toEqual([...st.deployment.forced].sort());
      for(const u of players)expect(u.level,`${st.id} ${u.id}`).toBe(zhugeBase(st,'normal'));
      expect(s.state.living('enemy').some(u=>u.name===b.foe.name),`${st.id} ${b.foe.name}`).toBe(true);
      expect(Session.load(JSON.parse(JSON.stringify(s.save()))).state.stage.id).toBe(st.id);
      expect(dueLines(st.id,s.state,new Set()).length,st.id).toBeGreaterThan(0);
    }
  });
  it('지도: 갈림 장을 이기면 갈림길과 첫 칸이 열리고, 앞 칸을 이겨야 다음 칸이 열린다',()=>{
    const nodes=zhugeMapNodes(trunk()),f=ZHUGE_FORKS[2]!;
    expect(nodes.filter(n=>n.kind==='story')).toHaveLength(34);
    expect(nodes.filter(n=>n.kind==='fork')).toHaveLength(6);
    expect(nodes.filter(n=>n.kind==='tale')).toHaveLength(12);
    expect(nodes.filter(n=>n.kind==='boss')).toHaveLength(6);
    const won=new Set<string>(),st=(id:string)=>zhugeNodeState(nodes.find(n=>n.id===id)!,x=>won.has(x),()=>true);
    expect(st(f.id).open).toBe(false);expect(st(f.nodes[0]!).open).toBe(false);
    won.add(f.anchor);
    expect(st(f.id).open).toBe(true);expect(st(f.nodes[0]!).open).toBe(true);expect(st(f.nodes[1]!).open).toBe(false);
    won.add(f.nodes[0]!);expect(st(f.nodes[0]!).won).toBe(true);expect(st(f.nodes[1]!).open).toBe(true);expect(st(f.nodes[2]!).open).toBe(false);
    won.add(f.nodes[1]!);expect(st(f.nodes[2]!).open).toBe(true);
    // 가지 칸만 이겨도 갈림 장을 이기지 않았으면 열리지 않는다(옛 기록 · 잘못된 기록).
    won.delete(f.anchor);expect(st(f.nodes[2]!).open).toBe(false);
    // 갈림길은 갈림 장 옆 같은 줄, 가지는 그 오른쪽으로 뻗는다.
    const anchor=nodes.find(n=>n.id===f.anchor)!;
    for(const id of [f.id,...f.nodes]){const n=nodes.find(x=>x.id===id)!;expect(n.row).toBe(anchor.row);expect(n.col).toBeGreaterThan(anchor.col);}
  });
  it('보상: 처음 이기면 금 · 상점 장비 · 소모품, 다시 이기면 금 1/3만',()=>{
    for(const b of BRANCH_NODES){
      expect(gearDef(b.reward.gear)?.named,b.id).toBe(false);
      for(const id of Object.keys(b.reward.supplies))expect(consumable(id),`${b.id} ${id}`).toBeDefined();
    }
    const c=freshCampaign(),b=branchNode('ZB3-03')!,g0=goldOf(c,'Z');
    const news=grantBranchReward(c,b.id,true);
    expect(goldOf(c,'Z')).toBe(g0+b.reward.gold);
    expect(c.treasures.filter(t=>t.startsWith(b.reward.gear+'#'))).toHaveLength(1);
    for(const [id,n] of Object.entries(b.reward.supplies))expect(supplyCount(c,id)).toBe(n);
    expect(news.join(' ')).toContain('장비');
    const n1=c.treasures.length;grantBranchReward(c,b.id,false);
    expect(c.treasures.length).toBe(n1);
    expect(goldOf(c,'Z')).toBe(g0+b.reward.gold+replayGold(b.reward));
    expect(grantBranchReward(c,'Z1-01',true)).toEqual([]);
  });
});
