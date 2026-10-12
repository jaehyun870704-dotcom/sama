import type {MapFile,StageDef} from '../../../core/src/index.ts';
import type {ZhugeBatch} from './types.ts';
import z110 from '../../../data/stages/Z1-10.json';
import z111 from '../../../data/stages/Z1-11.json';
import z112 from '../../../data/stages/Z1-12.json';
import z113 from '../../../data/stages/Z1-13.json';
import z114 from '../../../data/stages/Z1-14.json';
import z115 from '../../../data/stages/Z1-15.json';
import z201 from '../../../data/stages/Z2-01.json';
import z202 from '../../../data/stages/Z2-02.json';
import bajunMap from '../../../data/maps/z1-10-bajun.json';
import jiamengMap from '../../../data/maps/z1-11-jiameng.json';
import dingjunMap from '../../../data/maps/z1-12-dingjun.json';
import hanshuiMap from '../../../data/maps/z1-13-hanshui.json';
import yufuMap from '../../../data/maps/z1-14-yufu.json';
import nananMap from '../../../data/maps/z1-15-nanan.json';
import nanzhongMap from '../../../data/maps/z2-01-nanzhong.json';
import mansongMap from '../../../data/maps/z2-02-mansong.json';

/**
 * 제갈량전 장 묶음 B(10~15장 · 16~17장). 형식은 ./types.ts, 장 구성은 docs/design/제갈량전-기획.md.
 * 사건 순서는 『삼국지연의』·정사를 따르고, 전장·규칙·수치는 이 게임이 지었다.
 */
const batch:ZhugeBatch={
  chapters:[
    {stage:z110 as StageDef,map:bajunMap as MapFile,year:'건안 19년 · 214년',label:'강을 거슬러',quote:'우리 고을에는 머리 잘리는 장군은 있어도 항복하는 장군은 없다.'},
    {stage:z111 as StageDef,map:jiamengMap as MapFile,year:'건안 19년 · 214년',label:'서량의 바람',quote:'횃불 아래 두 사람의 창끝이 밤새 부딪쳤다.'},
    {stage:z112 as StageDef,map:dingjunMap as MapFile,year:'건안 24년 · 219년',label:'노장의 돌격',quote:'늙었다는 말은 칼끝으로 갚겠소.'},
    {stage:z113 as StageDef,map:hanshuiMap as MapFile,year:'건안 24년 · 219년',label:'한중 평정',quote:'버리자니 아깝고 먹자니 살이 없다.'},
    {stage:z114 as StageDef,map:yufuMap as MapFile,year:'장무 2년 · 222년',label:'패주와 구원',quote:'강가의 돌무더기가 대군의 발을 묶는다.'},
    {stage:z115 as StageDef,map:nananMap as MapFile,year:'장무 3년 · 223년',label:'탁고와 반란',quote:'그대의 재주는 조비의 열 배다. 뒷일을 맡긴다.'},
    {stage:z201 as StageDef,map:nanzhongMap as MapFile,year:'건흥 3년 · 225년',label:'남정의 시작',quote:'성을 치는 것보다 마음을 치는 것이 먼저다.'},
    {stage:z202 as StageDef,map:mansongMap as MapFile,year:'건흥 3년 · 225년',label:'첫 번째 사로잡기',quote:'풀어 주마. 다시 와서 겨뤄라.'},
  ],
  rules:{
    'Z1-10':{foeEdge:{normal:5,extreme:25},sealNames:['엄안 사로잡기','신속한 입성','부대 보존'],weather:'맑음 · 강바람',labels:[{region:'keep',text:'강주성'},{region:'side_path',text:'샛길'}]},
    'Z1-11':{foeEdge:{normal:-12,extreme:0},sealNames:['마초 격퇴','신속한 격퇴','서량군 격파'],weather:'밤 · 횃불과 모래바람',labels:[{region:'pass',text:'가맹관'}]},
    'Z1-12':{foeEdge:{normal:-20,extreme:-14},sealNames:['하후연 격파','신속한 승리','하후상 사로잡기'],weather:'흐림 · 산바람',labels:[{region:'depot',text:'천탕산 군량고'},{region:'dingjun',text:'정군산'}],
      phase:({state})=>state.captured.get('depot')==='player'?'하후연 격파':'천탕산 군량고 점령'},
    'Z1-13':{foeEdge:{normal:0,extreme:40},tough:[{unit:'z_cao_cao_foe',hpScale:1.5}],sealNames:['조조 퇴각','신속한 승리','부대 보존'],weather:'맑음 · 한수의 북소리',labels:[{region:'cao_camp',text:'조조 본진'},{region:'yangping',text:'양평관'}]},
    'Z1-14':{foeEdge:{normal:-27,extreme:-18},sealNames:['백제성 도착','부대 보존','추격대 격파'],weather:'건조한 바람 · 불길',protect:[{unit:'z_liu_bei',hp:240,movement:3}],
      labels:[{region:'objective',text:'백제성 길'},{region:'fish_belly',text:'어복포'}],
      failure:({state})=>state.find('z_liu_bei')?.alive===false?'유비가 쓰러졌습니다.':undefined},
    'Z1-15':{foeEdge:{normal:-15,extreme:0},tough:[{unit:'z_huang_yuan_foe',hpScale:2}],sealNames:['황원 사로잡기','부대 보존','반군 격파'],weather:'흐림 · 강안개',labels:[{region:'exit',text:'남안 협구'},{region:'linqiong',text:'임공성'}],
      failure:({state})=>state.find('z_liang')?.alive===false?undefined:'황원이 남안 협구를 빠져나갔습니다.'},
    'Z2-01':{foeEdge:{normal:5,extreme:40},sealNames:['옹개·주포 격퇴','고정 회유','신속한 평정'],weather:'무더위 · 장기',labels:[{region:'yong_camp',text:'옹개 진채'},{region:'gao_camp',text:'고정 진채'},{region:'zhu_camp',text:'주포 진채'}]},
    'Z2-02':{foeEdge:{normal:-28,extreme:-24},sealNames:['맹획 사로잡기','신속한 승리','부대 보존'],weather:'무더위 · 밀림',labels:[{region:'meng_camp',text:'맹획 진채'},{region:'west_dong',text:'금환삼결'},{region:'mid_dong',text:'동도나'},{region:'east_dong',text:'아회남'}]},
  },
  levels:{'Z1-10':11,'Z1-11':12,'Z1-12':13,'Z1-13':14,'Z1-14':15,'Z1-15':16,'Z2-01':17,'Z2-02':17},
  npcs:[
    {name:'맹달',unitClass:'infantry',side:'allyAi',stages:['Z1-11']},
    {name:'가맹관 수비병',unitClass:'spearman',side:'allyAi',stages:['Z1-11']},
    {name:'마초',unitClass:'xiliang',side:'allyAi',stages:['Z1-13']},
    {name:'마대',unitClass:'xiliang',side:'allyAi',stages:['Z1-13']},
  ],
  people:[
    {name:'하후상',epithet:'하후연의 조카 · 천탕산의 장수',stats:[70,58,68,56,60],temper:'brave',side:'wei',courtesy:'백인',
      bio:'하후연의 조카로 조비와 가까웠다. 위가 선 뒤 형주를 맡아 상용을 거두었고 정남대장군에 올랐다. 연의에서는 한중에서 황충에게 사로잡혔다가 촉의 진식과 맞바꾸어 돌아온다.'},
    {name:'한호',epithet:'둔전을 건의한 조조의 호군',stats:[68,62,66,64,58],temper:'calm',side:'wei',courtesy:'원사',
      bio:'하내 사람으로 조조의 호군이 되어 둔전을 넓히자고 건의해 군량의 바탕을 다졌다. 한중 원정에도 따라나섰다. 연의에서는 천탕산을 지키다 황충의 칼에 쓰러진다.'},
    {name:'황원',epithet:'유비의 병을 틈탄 한가 태수',stats:[56,44,52,40,36],temper:'timid',side:'other',
      bio:'촉의 한가 태수다. 223년 유비가 영안에서 병이 깊다는 말을 듣고 군사를 일으켜 임공성을 불태웠다. 양홍의 계책대로 진홀·정작이 뒤쫓아, 강을 따라 오로 달아나던 그를 사로잡아 성도에서 처형했다.'},
  ],
};
export default batch;
