/**
 * 사마의전에 옮긴 엔진 기능: 날씨(호로곡·젖은 잔도·양평·동구·광릉·수춘) · 영역 피해(범람·양평 장마) · 공성 없는 성문(낙양 병영·수춘 수문).
 */
import {describe,it,expect,vi} from 'vitest';
vi.setConfig({testTimeout:120000});
import {Session,chapters} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {stageRules,weatherLine} from '../src/stage-rules.ts';
import {fireScripted} from '../../core/src/index.ts';

const at=(id:string)=>chapters.findIndex(c=>c.stage.id===id);
const open=(id:string,wide?:2)=>new Session(at(id),'normal',215,'survival',13,{...deployment(freshCampaign(),true),...(wide?{wide}:{})});
const line=(s:Session)=>weatherLine(s.state,stageRules[s.state.stage.id],'');
/** 이 진영의 차례가 될 때까지 차례를 넘긴다(대화는 첫 선택지). */
function endUntil(s:Session,turn:number,side='player'){
  for(let guard=0;guard<200&&s.state.outcome==='ongoing'&&!(s.state.turn===turn&&s.state.currentSide===side);guard++){
    if(s.state.activeDialogue){const d=s.battle.dialogue.node(s.state.activeDialogue);s.act({kind:'choose',nodeId:d.id,optionId:d.options[0]!.id});continue;}
    if(s.state.currentSide==='player'||s.state.currentSide==='ally')s.act({kind:'endPhase'});else s.tick();
  }
}

describe('사마의전 · 날씨',()=>{
  it('S2-13 호로곡: 맑게 시작해 서쪽 목책이 타고, 버틴 끝에 큰비가 불을 끈다',()=>{
    for(const wide of [undefined,2] as const){
      const s=open('S2-13',wide);
      expect(s.state.weather).toBe('clear');expect(line(s)).toContain('서쪽 목책이 탄다');
      const palisade=s.state.map.regionCoords('burning_palisade');expect(palisade.length).toBeGreaterThanOrEqual(6);
      expect(palisade.every(c=>s.state.map.tileAt(c).hazard==='fire')).toBe(true);
      s.state.scenarioPhase='버티기';fireScripted(s.state,'hulu/rain');
      expect(s.state.weather).toBe('rain');expect(palisade.every(c=>s.state.map.tileAt(c).hazard==='none')).toBe(true);
      expect(line(s)).toContain('큰비');
    }
  });
  it('S2-13 바위 그늘: 세 부자가 포격에 두 번 맞으면 셋째 천명을 놓친다',()=>{
    const s=open('S2-13'),view=()=>stageRules['S2-13']!.seals!({state:s.state,difficulty:'normal',journalLength:0});
    s.state.outcome='victory';expect(view()).toEqual([1,2,3]);
    s.state.push({t:'strike',id:'a',cells:[],hits:[{unit:'sima_yi',damage:10}]});expect(view()).toContain(3);
    s.state.push({t:'strike',id:'b',cells:[],hits:[{unit:'sima_shi',damage:10}]});expect(view()).not.toContain(3);
  });
  it('S2-07 젖은 잔도는 비, 낙석은 비가 오는 동안만',()=>{
    const s=open('S2-07');expect(s.state.weather).toBe('rain');
    expect(s.state.stage.events!.find(e=>e.id==='yangping/rockfall')!.trigger.whenWeather).toEqual({is:['rain']});
  });
  it('S2-02 동구는 폭풍(비)으로 시작해 8턴에 걷히고, S2-03 광릉은 눈',()=>{
    const s=open('S2-02');expect(s.state.weather).toBe('rain');expect(line(s)).toContain('폭풍');
    endUntil(s,8);if(s.state.outcome==='ongoing')expect(s.state.weather).toBe('cloudy');
    expect(open('S2-03').state.weather).toBe('snow');
  });
});

describe('사마의전 · 영역 피해',()=>{
  it('S3-02 양평: 장마 동안 성 앞 낮은 들에 선 부대만 빗물에 다치고, 3턴에 비가 그친다',()=>{
    const s=open('S3-02');expect(s.state.weather).toBe('rain');
    const yi=s.state.get('sima_yi'),low=s.state.map.regionCoords('lowland')[0]!;
    yi.pos={...low};const hp=yi.hp;
    const other=s.state.living('ally')[0]!,start=other.hp;
    s.act({kind:'endPhase'});endUntil(s,1,'enemy');
    expect(yi.hp).toBeLessThan(hp);expect(other.hp).toBe(start);
    endUntil(s,3);expect(s.state.weather).toBe('clear');expect(line(s)).toContain('장마가 그쳤다');
    const strikes=()=>s.state.log.filter(e=>e.t==='strike').length,before=strikes();
    endUntil(s,3,'enemy');expect(strikes()).toBe(before);
  });
  it('S1-10 범람: 물이 차오르는 칸에 선 부대가 휩쓸린다(퇴각시키지는 않는다)',()=>{
    const s=open('S1-10');expect(s.state.weather).toBe('rain');
    const yi=s.state.get('sima_yi'),cell=s.state.map.regionCoords('flood_1').find(c=>!s.state.unitAt(c))!;
    yi.pos={...cell};yi.hp=5;
    endUntil(s,3,'enemy');
    expect(s.state.log.some(e=>e.t==='strike'&&e.hits.some(h=>h.unit==='sima_yi'))).toBe(true);
    expect(yi.alive).toBe(true);expect(yi.hp).toBeGreaterThanOrEqual(1);
  });
});

describe('사마의전 · 공성 없는 성문',()=>{
  it('S3-06 낙양: 무기고를 쥐면 두 아들이 금군 병영의 성문을 닫는다',()=>{
    for(const wide of [undefined,2] as const){
      const s=open('S3-06',wide),gate=s.state.map.regionCoords('barracks_gate');
      expect(gate.length).toBeGreaterThan(0);expect(gate.every(c=>s.state.map.tileAt(c).terrain==='gate'&&!s.state.map.tileAt(c).locked)).toBe(true);
      expect([...s.state.units.keys()].some(id=>/^(gate|tower)_|^siege_crew$/.test(id))).toBe(false);
      s.state.captured.set('armory','player');s.act({kind:'wait',unit:'sima_yi'});
      expect(s.state.firedEvents.has('coup/armory')).toBe(true);
      expect(gate.every(c=>s.state.map.tileAt(c).locked)).toBe(true);
    }
  });
});

describe('사마의전 · 예전 저장',()=>{
  it('대본·지도가 바뀐 장의 예전 전투 저장은 어긋나는 곳에서 멈춰 이어 한다(오류 없이 열린다)',()=>{
    for(const id of ['S3-06','S3-07','S2-13']){
      const s=open(id),save=s.save();
      // 바꾸기 전 지도에서만 가능했던 수(지금은 성벽·성문인 칸으로 가기)를 흉내 낸다.
      save.journal=[{kind:'move',unit:'sima_yi',to:{x:5,y:1}} as never,...save.journal];
      const loaded=Session.load(structuredClone(save));
      expect(loaded.state.stage.id).toBe(id);expect(loaded.journal.length).toBe(0);
    }
  });
});
