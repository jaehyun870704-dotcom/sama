/**
 * 제갈량전이 엔진 기능으로 옮긴 장: 날씨(독룡동·상방곡) · 따라가기(화용도) · 공성 없는 성문(남군·남안) · 차례 목표(신성·남안).
 */
import {describe,it,expect,vi} from 'vitest';
vi.setConfig({testTimeout:120000});
import {Session,chapters,zhugeOrder} from '../src/session.ts';
import {freshCampaign} from '../src/progression.ts';
import {zhugeDeployment} from '../src/zhuge.ts';
import {stageRules,weatherLine} from '../src/stage-rules.ts';
import {addSiegeCompany} from '../src/campaign-rules.ts';
import {applyAction,CONTROLLABLE,decide,manhattan} from '../../core/src/index.ts';
import type {StageDef} from '../../core/src/index.ts';

const open=(id:string,wide?:2)=>{const i=zhugeOrder.find(c=>chapters[c]!.stage.id===id)!;return new Session(i,'normal',7,'survival',13,{...zhugeDeployment(freshCampaign(),chapters[i]!.stage,'normal'),...(wide?{wide}:{})});};
/** 아군은 AI가 고른 수를 그대로 두고, 상대 차례는 tick으로 넘긴다. */
function playUntil(s:Session,turn:number){
  for(let guard=0;guard<5000&&s.state.outcome==='ongoing'&&s.state.turn<turn;guard++){
    const side=s.state.currentSide;
    if(CONTROLLABLE.has(side)&&!s.state.activeDialogue){
      for(const u of s.state.living(side)){if(u.hasActed||!u.alive)continue;for(const c of decide(s.state,u))if(!s.act(c).ok)break;if(u.alive&&!u.hasActed)s.act({kind:'wait',unit:u.id});}
    }
    if(s.state.activeDialogue){const d=s.battle.dialogue.node(s.state.activeDialogue);s.act({kind:'choose',nodeId:d.id,optionId:d.options[0]!.id});continue;}
    s.tick();
  }
}
const structures=(s:Session)=>s.state.living().filter(u=>/^(gate|tower)_|^siege_crew$/.test(u.id)).map(u=>u.id);

describe('제갈량전 · 날씨',()=>{
  it('날씨가 없는 장은 규칙의 날씨 줄 그대로 보인다',()=>{
    const s=open('Z1-02');
    expect(s.state.weather).toBe('clear');
    expect(s.weather).toBe(stageRules['Z1-02']!.weather);
  });
  it('상방곡: 먹구름으로 시작하고, 비가 오면 화면의 날씨 줄이 바뀐다',()=>{
    const s=open('Z2-18');
    expect(s.state.weather).toBe('cloudy');
    expect(s.weather).toContain('먹구름');
    applyAction(s.state,{type:'set_weather',weather:'rain'});
    expect(weatherLine(s.state,stageRules['Z2-18'],'')).toContain('큰비');
  });
  it('독룡동: 안개(독기)로 시작해 3턴에 갠다 · 저장을 불러와도 같은 날씨·같은 전장', ()=>{
    const s=open('Z2-03');
    expect(s.state.weather).toBe('fog');
    expect(s.state.map.regionCoords('springs').every(c=>s.state.activeHazard(c)==='trap')).toBe(true);
    playUntil(s,4);
    expect(s.state.log.some(e=>e.t==='weather'&&e.weather==='clear')).toBe(true);
    const back=Session.load(JSON.parse(JSON.stringify(s.save())));
    expect(back.state.weather).toBe(s.state.weather);
    expect(back.state.log.length).toBe(s.state.log.length);
    expect(JSON.stringify([...back.state.units.values()].map(u=>[u.id,u.pos,u.hp]))).toBe(JSON.stringify([...s.state.units.values()].map(u=>[u.id,u.pos,u.hp])));
  },60000);
});

describe('제갈량전 · 따라가기(화용도)',()=>{
  it('조조는 관우를 따라가는 부대로 나와 관우 쪽으로 다가간다',()=>{
    const s=open('Z1-07');
    // 3턴 적 차례의 등장 사건을 그대로 일으킨다.
    for(const a of s.state.stage.events!.find(e=>e.id==='Z1-07/cao-cao')!.actions)applyAction(s.state,a);
    const cao=s.state.get('z_cao_cao'),guan=s.state.get('z_guan_yu');
    expect(cao.behavior).toBe('follow');
    expect(cao.followUnit).toBe('z_guan_yu');
    expect(s.state.map.regions.has('guan_side')).toBe(false);
    const before=manhattan(cao.pos,guan.pos),move=decide(s.state,cao).find(c=>c.kind==='move');
    expect(before).toBeGreaterThan(1);
    expect(move&&move.kind==='move'?manhattan(move.to,guan.pos):before).toBeLessThan(before);
    // 따라가는 부대는 싸우지 않는다(조조를 쓰러뜨리면 지는 장).
    expect(decide(s.state,cao).some(c=>c.kind==='attack'||c.kind==='strategy')).toBe(false);
  });
});

describe('제갈량전 · 공성 없는 성문',()=>{
  it('남군·양양(Z1-08): 성문은 열린 채이고 공성대·성문 방벽이 붙지 않는다',()=>{
    const s=open('Z1-08');
    expect(s.state.stage.siege).toBe(false);
    expect(structures(s)).toEqual([]);
    const gates:string[]=[];for(let y=0;y<s.state.map.height;y++)for(let x=0;x<s.state.map.width;x++)if(s.state.map.tileAt({x,y}).terrain==='gate')gates.push(x+','+y);
    expect(gates.length).toBeGreaterThan(0);
    // 같은 성을 공성전으로 두면(siege 플래그를 빼면) 예전처럼 공성대·방벽이 붙는다.
    (s.state.stage as StageDef).siege=undefined;
    addSiegeCompany(s.state);
    expect(structures(s).length).toBeGreaterThan(0);
  });
  it('남안(Z2-08): 동문은 닫힌 성문으로 시작해, 관흥·장포가 문 안쪽에 닿으면 열린다 · 넓은 전장도 같다',()=>{
    for(const wide of [undefined,2] as const){
      const s=open('Z2-08',wide),door=s.state.map.regionCoords('east_door');
      expect(structures(s)).toEqual([]);
      expect(door.every(c=>s.state.map.tileAt(c).terrain==='gate'&&s.state.map.tileAt(c).locked)).toBe(true);
      expect(s.state.victory.map(c=>c.order)).toEqual([1,1,2]);
      const gx=s.state.get('z_guan_xing'),inner=s.state.map.regionCoords('door_inner').find(c=>!s.state.unitAt(c))!;
      gx.pos={...inner};
      s.act({kind:'wait',unit:'z_guan_xing'});
      expect(door.every(c=>!s.state.map.tileAt(c).locked)).toBe(true);
      expect(s.state.goalProgress).toBe(1);
      expect(s.state.scenarioPhase).toBe('assault');
    }
  });
});

describe('제갈량전 · 차례 목표·성문(신성)',()=>{
  it('맹달의 본채에 닿은 뒤 총대장은 본채로 되돌아가지 않고 서쪽 산길로 간다',()=>{
    const s=open('Z2-06');
    expect(s.state.victory.map(c=>[c.target,c.order])).toEqual([['keep',1],['west_exit',2]]);
    // 동문은 공성대 없이 닫힌 성문으로 시작해, 맹달과 만나는 순간(이보가 문을 연다) 열린다.
    const door=s.state.map.regionCoords('east_door');
    expect(structures(s)).toEqual([]);
    expect(door.every(c=>s.state.map.tileAt(c).terrain==='gate'&&s.state.map.tileAt(c).locked)).toBe(true);
    const liang=s.state.get('z_liang'),keep=s.state.map.regionCoords('keep').find(c=>!s.state.unitAt(c))!;
    liang.pos={...keep};
    s.act({kind:'wait',unit:'z_liang'});
    expect(door.every(c=>!s.state.map.tileAt(c).locked)).toBe(true);
    expect(s.state.goalProgress).toBe(1);
    expect(s.state.scenarioPhase).toBe('escape');
    // 본채 밖 한 칸으로 옮겨도 다음 걸음은 서쪽 산길 쪽이다.
    const exit=s.state.map.regionCoords('west_exit')[0]!,field=s.state.map.travelField(liang.unitClass,s.state.map.regionCoords('west_exit'));
    const out=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].map(d=>({x:liang.pos.x+d.x,y:liang.pos.y+d.y})).find(c=>s.state.map.inBounds(c)&&!s.state.unitAt(c)&&Number.isFinite(s.state.map.moveCost(liang.unitClass,c))&&!s.state.map.regionCoords('keep').some(k=>k.x===c.x&&k.y===c.y));
    if(!out)return;
    liang.pos=out;liang.hasMoved=false;liang.hasActed=false;
    const here=field.get(out.x+','+out.y)??Infinity;
    const move=decide(s.state,liang).find(c=>c.kind==='move');
    expect(exit).toBeDefined();
    if(move&&move.kind==='move')expect(field.get(move.to.x+','+move.to.y)??Infinity).toBeLessThan(here);
  });
});

describe('제갈량전 · 영역 피해(박망파·신야·상방곡)',()=>{
  it('불은 골짜기·성 안에 선 적만 태운다 · 상방곡은 불 다음 차례에 비가 와 불길이 꺼진다',()=>{
    for(const [id,ev,region] of [['Z1-03','Z1-03/fire','valley'],['Z1-04','Z1-04/fire','town'],['Z2-18','Z2-18/fire','valley']] as const){
      const s=open(id);
      const action=s.state.stage.events!.find(e=>e.id===ev)!.actions.find(a=>a.type==='damage_region')!;
      expect(action.region).toBe(region);
      const inside=new Set(s.state.map.regionCoords(region).map(c=>c.x+','+c.y));
      // 적 하나를 영역 안 빈 칸에 세워 둔다(맞는 쪽과 안 맞는 쪽이 모두 있게).
      const spot=s.state.map.regionCoords(region).find(c=>!s.state.unitAt(c))!;
      const foes=s.state.living('enemy').filter(u=>!inside.has(u.pos.x+','+u.pos.y));
      expect(foes.length).toBeGreaterThan(1);
      foes[0]!.pos={...spot};
      const before=new Map(s.state.living('enemy').map(u=>[u.id,u.hp]));
      applyAction(s.state,action);
      expect(s.state.get(foes[0]!.id).hp).toBeLessThan(before.get(foes[0]!.id)!);
      for(const u of s.state.living('enemy')){
        const hurt=u.hp<before.get(u.id)!;
        expect(hurt).toBe(inside.has(u.pos.x+','+u.pos.y));
      }
    }
    const s=open('Z2-18');
    for(const a of s.state.stage.events!.find(e=>e.id==='Z2-18/fire')!.actions)applyAction(s.state,a);
    expect(s.state.map.regionCoords('valley').some(c=>s.state.map.tileAt(c).hazard==='fire')).toBe(true);
    for(const a of s.state.stage.events!.find(e=>e.id==='Z2-18/rain')!.actions)applyAction(s.state,a);
    expect(s.state.weather).toBe('rain');
    expect(s.state.map.regionCoords('valley').every(c=>s.state.map.tileAt(c).hazard==='none')).toBe(true);
  });
});
