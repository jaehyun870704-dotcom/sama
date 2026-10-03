import type {BattleState,Difficulty} from '../../core/src/index.ts';
import {fireScripted} from '../../core/src/index.ts';

/** Per-stage rules that live in the client layer (protected units, phase readouts,
 * custom seals). New stages register here instead of growing Session with branches. */
export interface StageView {state:BattleState;difficulty:Difficulty;journalLength:number}
export interface StageRules {
  sealNames:[string,string,string];
  /** A costly win: the result plays a gong instead of the victory fanfare. */
  somber?:boolean;
  /** Starting first-aid stock (default 2). */
  medicine?:number;
  /** First aid can also calm a confused ally within two tiles (진정). */
  calm?:boolean;
  /** Weather line shown over the map. */
  weather?:string;
  /** Non-combatants under escort: unarmed, sturdier, slower. */
  protect?:Array<{unit:string;hp:number;movement?:number}>;
  /** Named foes that must be handled by the gimmick rather than worn down. */
  tough?:Array<{unit:string;hpScale:number;defense?:number}>;
  /** Units that hold their ground for the whole battle (fixed support). */
  anchored?:string[];
  /** Enemy barricades standing at the start. */
  barricades?:Array<{x:number;y:number}>;
  /** Live phase text; return undefined to show the scenario phase as is. */
  phase?:(v:StageView)=>string|undefined;
  /** Seal slots earned on victory; undefined falls back to the stage's seal expressions. */
  seals?:(v:StageView)=>number[]|undefined;
  /** Map labels drawn over regions (first cell of each region). */
  labels?:Array<{region:string;text:string}>;
  /** Regions outlined on the map every frame (shelter, rally points). */
  zones?:Array<{region:string;color:number}>;
  /** Scenario upkeep after every action: may change units and returns a defeat reason when lost. */
  tick?:(v:StageView)=>string|undefined;
  /** Turn after which the battle is lost (forced marches, sieges against the clock). */
  deadline?:number;
  /** Failure line when the deadline passes (defaults to a generic one). */
  deadlineText?:string;
  /** Reason shown on defeat. */
  failure?:(v:StageView)=>string|undefined;
}
const HILL=['ma_su','hill_spear','hill_bow','hill_foot_a','hill_foot_b','hill_xbow'];

export const stageRules:Record<string,StageRules>={
  'S2-14':{
    sealNames:['무사 철수','추격 저지','병력 보존'],
    somber:true,
    calm:true,
    medicine:3,
    weather:'가을 하늘 · 큰 별이 떨어진 다음 날',
    labels:[{region:'west_exit',text:'촉의 퇴로'},{region:'east_exit',text:'동쪽 철수로'},{region:'plateau',text:'오장원'}],
    tick:({state})=>{
      if(!state.firedEvents.has('wuzhang/banner')){
        for(const u of state.living('enemy'))if(u.behavior==='flee'&&state.map.regionCoords('west_exit').some(c=>c.x===u.pos.x&&c.y===u.pos.y)){state.units.delete(u.id);state.survivalClocks.set('escaped',(state.survivalClocks.get('escaped')??0)+1);}
        if(state.losses.enemy>=4||state.turn>=6){
          // The chase ends the moment the army wavers: what is still fleeing is simply gone.
          for(const u of state.living('enemy'))if(u.behavior==='flee'){state.units.delete(u.id);}
          fireScripted(state,'wuzhang/banner');
          // Sima Yi alone keeps his head: he is the one who calms the others and leads the withdrawal.
          const yi=state.find('sima_yi');if(yi)yi.statuses=yi.statuses.filter(x=>x.kind!=='confusion');
        }
      }
      return undefined;
    },
    phase:({state})=>{const p=state.scenarioPhase??'추격';
      if(p==='추격')return `추격 · 저지 ${state.losses.enemy}/4 · 빠져나간 촉군 ${state.survivalClocks.get('escaped')??0}`;
      return '동요 · 추격을 멈추고 사마의를 동쪽으로';},
    // 병력 보존: no one lost, and every unit brought back east of the plateau (x ≥ 17), not abandoned in the panic.
    seals:({state})=>[1,...((state.survivalClocks.get('escaped')??0)<=1?[2]:[]),...(state.losses.player+state.losses.ally===0&&[...state.living('player'),...state.living('ally')].every(u=>u.pos.x>=17)?[3]:[])],
  },
  'S2-13':{
    sealNames:['호로곡 탈출','부대 보존','신속한 탈출'],
    weather:'마른 하늘 · 골짜기의 불',
    zones:[{region:'shelter',color:0x8fd0ff}],
    labels:[{region:'rally',text:'합류 지점'},{region:'exit_label',text:'불타는 목책 · 비가 오면 열림'},{region:'shelter_label',text:'바위 그늘 · 포격 차폐'}],
    tough:[{unit:'sima_shi',hpScale:2,defense:4},{unit:'sima_zhao',hpScale:2,defense:4}],
    tick:({state})=>{
      if(!state.firedEvents.has('hulu/joined')){
        const inRally=(id:string)=>{const u=state.find(id);return !!u?.alive&&state.map.regionCoords('rally').some(c=>c.x===u.pos.x&&c.y===u.pos.y);};
        if(inRally('sima_yi')&&inRally('sima_shi')){state.firedEvents.add('hulu/joined');state.survivalClocks.set('hulu',state.turn);state.scenarioPhase='버티기';}
      }
      return undefined;
    },
    phase:({state})=>{const p=state.scenarioPhase??'합류';const start=state.survivalClocks.get('hulu');
      if(p==='합류')return '합류 · 사마의와 사마사가 합류 지점으로 (합류 뒤 7턴 버티기)';
      if(p==='버티기'&&start!==undefined)return `버티기 · 비까지 ${Math.max(0,7-(state.turn-start))}턴`;
      return '퇴로 열림 · 사마의를 서쪽 출구로';},
    failure:({state})=>protectedFailure(state,['sima_shi','sima_zhao']),
  },
  'S2-12':{
    sealNames:['도하 저지','부대 보존','신속한 격퇴'],
    weather:'흐림 · 강바람',
    labels:[{region:'north_camp',text:'북안 진영'},{region:'guo_post',text:'곽회 · 북원'}],
    tough:[{unit:'meng_yan',hpScale:1.4,defense:2}],
    phase:({state})=>`${state.scenarioPhase??'가운데 여울'} · 격퇴 ${state.losses.enemy}/7`,
    failure:({state})=>state.captured.get('north_camp')==='enemy'?'촉군이 북안 진영을 점령했습니다.':undefined,
  },
  'S2-11':{
    sealNames:['회군 완료','남은 병력 보존','신속한 회군'],
    somber:true,
    labels:[{region:'gorge_mouth',text:'골짜기 어귀'},{region:'retreat_exit',text:'동쪽 회군로'},{region:'gorge_label',text:'목문도'}],
    tough:[{unit:'zhang_he',hpScale:1.5,defense:3}],
    tick:({state})=>{const zh=state.find('zhang_he');if(zh?.alive&&zh.stats.movement!==3)zh.stats.movement=3;return undefined;},
    phase:({state})=>{
      const zh=state.find('zhang_he'),yi=state.find('sima_yi'),p=state.scenarioPhase??'선봉 유지';
      if(zh?.alive&&yi?.alive&&(p==='선봉 유지'||p==='본대 합류'))return `${p} · 장합과 본대 사이 ${Math.abs(zh.pos.x-yi.pos.x)+Math.abs(zh.pos.y-yi.pos.y)}칸`;
      return p==='회군'?'회군 · 사마의를 동쪽 회군로로':p;
    },
    failure:({state})=>state.find('zhang_he')?.alive===false?'선봉 장합이 고립되어 퇴각했습니다. 본대가 너무 멀리 떨어졌습니다.':undefined,
  },
  'S2-10':{
    sealNames:['고상 격퇴','부대 보존','신속한 추격'],
    weather:'맑음 · 마른 바람',
    labels:[{region:'escape',text:'서쪽 골짜기 출구'},{region:'fields',text:'불타는 보리밭'}],
    tick:({state})=>{
      const gao=state.find('gao_xiang');if(!gao?.alive)return undefined;
      if(state.turn>=4&&gao.behavior!=='flee'){gao.behavior='flee';gao.goalRegion='escape';gao.stats.movement=3;}
      return state.map.regionCoords('escape').some(c=>c.x===gao.pos.x&&c.y===gao.pos.y)?'고상이 보리 수레를 끌고 서쪽 골짜기로 빠져나갔습니다.':undefined;
    },
    phase:({state})=>{const gao=state.find('gao_xiang');if(!gao?.alive)return '고상 격퇴';
      const left=Math.min(...state.map.regionCoords('escape').map(c=>Math.abs(c.x-gao.pos.x)+Math.abs(c.y-gao.pos.y)));
      return `${state.scenarioPhase??'고상 추격'} · 고상과 출구 사이 ${left}칸`;},
  },
  'S2-09':{
    sealNames:['성고 탈환','대릉 전선 보존','이엄의 편지'],
    weather:'큰비 뒤 · 강물이 불어남',
    labels:[{region:'citadel',text:'성고 성채'},{region:'flooded',text:'불어난 강 · 도하 불가'},{region:'mountain_road',text:'북쪽 산길 → 성고'}],
    anchored:['dai_ling','front_spear','front_shield','shu_catapult'],
    tough:[{unit:'dai_ling',hpScale:2,defense:6},{unit:'citadel_captain',hpScale:1.5,defense:2}],
    deadline:18,
    deadlineText:'대릉의 전선이 더 버티지 못했습니다.',
    phase:({state})=>{const d=state.find('dai_ling'),hp=d?.alive?Math.round(100*d.hp/d.stats.maxHp):0;
      return `${state.scenarioPhase??'성채 탈환'} · 대릉 체력 ${hp}% · ${Math.max(0,19-state.turn)}턴 남음`;},
    seals:({state})=>[1,...(['dai_ling','front_spear','front_shield'].every(id=>state.find(id)?.alive)?[2]:[]),...(state.choices.some(c=>c.nodeId==='envoy'&&c.optionId==='letter')?[3]:[])],
    failure:({state})=>protectedFailure(state,['dai_ling']),
  },
  'S2-08':{
    sealNames:['조휴 구출','부대 보존','신속한 구출'],
    labels:[{region:'camp',text:'조휴 진영'},{region:'ridge',text:'능선'}],
    anchored:['sima_yi','cao_xiu'],
    barricades:[{x:9,y:6},{x:9,y:7},{x:9,y:8},{x:13,y:6},{x:13,y:8}],
    tough:[{unit:'cao_xiu',hpScale:1.6,defense:3},{unit:'sima_shi',hpScale:1.4,defense:2},{unit:'sima_zhao',hpScale:1.4,defense:2}],
    deadline:14,
    deadlineText:'조휴의 진영이 더 버티지 못하고 무너졌습니다.',
    phase:({state})=>{const inCamp=['sima_shi','sima_zhao'].filter(id=>{const u=state.find(id);return !!u?.alive&&state.map.regionCoords('camp').some(c=>c.x===u.pos.x&&c.y===u.pos.y);}).length;
      return `협석 돌파 · 진영 도착 ${inCamp}/2 · 조휴 진영 버팀 ${Math.max(0,15-state.turn)}턴`;},
    failure:({state})=>protectedFailure(state,['sima_shi','sima_zhao','cao_xiu']),
  },
  'S2-07':{
    sealNames:['위연 또는 7부대 격퇴','곽회 생존','위연을 놓치지 않음'],
    weather:'장맛비 · 길이 젖음',
    labels:[{region:'pass_exit',text:'양평관'},{region:'guo_camp',text:'곽회 진영'}],
    tough:[{unit:'guo_huai',hpScale:1.4,defense:2}],
    deadline:15,
    tick:({state})=>{
      const route=state.choices.find(c=>c.nodeId==='route')?.optionId;
      if(route&&!state.firedEvents.has('yangping/flee')&&state.turn>=(route==='valley'?5:7)&&state.find('wei_yan')?.alive){
        state.firedEvents.add('yangping/flee');
        // Wei Yan runs for the pass; his guards stay behind as the rearguard.
        const wei=state.get('wei_yan');wei.behavior='flee';wei.goalRegion='pass_exit';
        for(const id of ['wei_guard_0','wei_guard_1']){const u=state.find(id);if(u?.alive)u.behavior='hold';}
      }
      const wei=state.find('wei_yan');
      if(wei?.alive&&wei.behavior==='flee'&&state.map.regionCoords('pass_exit').some(c=>c.x===wei.pos.x&&c.y===wei.pos.y)){state.units.delete(wei.id);state.firedEvents.add('yangping/escaped');}
      return undefined;
    },
    phase:({state})=>{const left=Math.max(0,16-state.turn),down=state.losses.enemy;
      if(state.firedEvents.has('yangping/escaped'))return `위연 탈출 · 격퇴 ${down}/7 · ${left}턴 남음`;
      return `${state.firedEvents.has('yangping/flee')?'위연 도주 중':(state.scenarioPhase??'길 선택')} · 격퇴 ${down}/7 · ${left}턴 남음`;},
    seals:({state})=>[1,...(state.find('guo_huai')?.alive?[2]:[]),...(state.find('wei_yan')?.alive===false?[3]:[])],
  },
  'S2-06':{
    sealNames:['남산 공략','도주 최소화','신속한 수원 차단'],
    weather:'☀ 맑음 · 메마른 산',
    labels:[{region:'spring',text:'북쪽 샘'},{region:'south_exit',text:'남쪽 출구'}],
    // The hill camp is strong while it has water; cutting the spring is what breaks it.
    tough:HILL.map(unit=>({unit,hpScale:1.5,defense:3})),
    deadline:20,
    tick:({state,difficulty})=>{
      const spring=state.map.regionCoords('spring'),at=(c:{x:number;y:number})=>state.unitAt(c);
      const held=spring.some(c=>{const u=at(c);return !!u&&u.side!=='enemy';})&&!spring.some(c=>at(c)?.side==='enemy');
      if(state.currentSide==='player'&&(state.survivalClocks.get('water_turn')??0)<state.turn){state.survivalClocks.set('water_turn',state.turn);if(held&&state.turn>1)state.survivalClocks.set('water_cut',(state.survivalClocks.get('water_cut')??0)+1);}
      if((state.survivalClocks.get('water_cut')??0)>=4&&!state.firedEvents.has('jieting/collapse')){
        state.firedEvents.add('jieting/collapse');state.survivalClocks.set('collapse_turn',state.turn);state.scenarioPhase='붕괴 · 도주 저지';
        for(const u of state.living('enemy')){
          u.behavior='escortee';u.goalRegion='south_exit';
          if(HILL.includes(u.id)){const max=Math.round(u.stats.maxHp/1.5);u.stats.maxHp=max;u.hp=Math.min(u.hp,max);u.stats.defense-=3;}
        }
      }
      if(state.firedEvents.has('jieting/collapse'))for(const u of state.living('enemy'))if(state.map.regionCoords('south_exit').some(c=>c.x===u.pos.x&&c.y===u.pos.y)){state.survivalClocks.set('escaped',(state.survivalClocks.get('escaped')??0)+1);state.retreat(u);}
      const limit=difficulty==='extreme'?1:2,gone=state.survivalClocks.get('escaped')??0;
      return gone>limit?`촉군 ${gone}부대가 남쪽 출구로 빠져나갔습니다.`:undefined;
    },
    phase:({state,difficulty})=>state.firedEvents.has('jieting/collapse')?`도주 저지 · 빠져나간 적 ${state.survivalClocks.get('escaped')??0}/${difficulty==='extreme'?1:2} · ${Math.max(0,21-state.turn)}턴 남음`:`수원 차단 · 물 잔량 ${Math.max(0,4-(state.survivalClocks.get('water_cut')??0))}/4 · ${Math.max(0,21-state.turn)}턴 남음`,
    seals:({state})=>[1,...((state.survivalClocks.get('escaped')??0)===0?[2]:[]),...((state.survivalClocks.get('collapse_turn')??99)<=7?[3]:[])],
  },
  'S2-05':{sealNames:['맹달 격퇴','부대 보존','신속한 공성'],deadline:14,labels:[{region:'keep',text:'신성 본채'}],phase:({state})=>state.scenarioPhase?`${state.scenarioPhase} · ${Math.max(0,15-state.turn)}턴 남음`:undefined,tough:[{unit:'sima_shi',hpScale:1.5,defense:3},{unit:'sima_zhao',hpScale:1.5,defense:3}],failure:({state})=>protectedFailure(state,['sima_shi','sima_zhao'])},
  'S2-04':{sealNames:['양양 수성','수비대 전원 생환','적 격퇴 수'],tough:[{unit:'gate_captain',hpScale:1.8,defense:4}],labels:[{region:'xiangyang',text:'양양 성문'}],phase:({state})=>`${state.scenarioPhase} · ${Math.max(0,8-(state.turn-(state.survivalClocks.get('xiangyang')??1)))}턴 남음`,failure:({state})=>state.captured.get('xiangyang')==='enemy'?'오군이 양양 성문을 차지했습니다.':undefined},
  'S2-03':{sealNames:['황제 탈출','부대 보존','신속한 탈출'],weather:'혹한 · 강이 얼어붙음',protect:[{unit:'cao_pi',hp:150,movement:3}],tough:[{unit:'gao_shou',hpScale:1.6}],labels:[{region:'exit',text:'북쪽 출구'}],failure:({state})=>state.find('cao_pi')?.alive===false?'조비가 퇴각했습니다.':undefined},
  'S2-02':{sealNames:['황제 철수','함대 보존','신속한 철수'],weather:'폭풍 · 낙뢰',protect:[{unit:'cao_pi',hp:150,movement:3}],labels:[{region:'exit',text:'북서쪽 출구'}],failure:({state})=>state.find('cao_pi')?.alive===false?'조비가 퇴각했습니다.':undefined},
  'S2-01':{
    sealNames:['반란 진압','수비대 전원 생환','신속한 진압'],
    labels:[{region:'citadel',text:'무위 성채'}],
    tough:[{unit:'citadel_warden',hpScale:1.8,defense:4}],
    failure:({state})=>state.captured.get('citadel')==='enemy'?'반란군이 무위 성채를 점령했습니다.':undefined,
  },
};

/** Korean subject particle: 이 after a final consonant, 가 otherwise. */
export function subject(name:string){const c=name.charCodeAt(name.length-1);return name+(c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28!==0?'이':'가');}
export function protectedFailure(s:BattleState,ids:string[]){
  const fallen=ids.map(id=>s.find(id)).find(u=>u&&!u.alive);
  return fallen?`${subject(fallen.name)} 퇴각했습니다.`:undefined;
}
