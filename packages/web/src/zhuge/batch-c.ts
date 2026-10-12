import type {MapFile,StageDef} from '../../../core/src/index.ts';
import type {ZhugeBatch} from './types.ts';
import z203 from '../../../data/stages/Z2-03.json';
import z203Map from '../../../data/maps/z2-03-dulong.json';
import z204 from '../../../data/stages/Z2-04.json';
import z204Map from '../../../data/maps/z2-04-yinkeng.json';
import z205 from '../../../data/stages/Z2-05.json';
import z205Map from '../../../data/maps/z2-05-panshe.json';
import z206 from '../../../data/stages/Z2-06.json';
import z206Map from '../../../data/maps/z2-06-xincheng.json';
import z207 from '../../../data/stages/Z2-07.json';
import z207Map from '../../../data/maps/z2-07-qishan.json';
import z208 from '../../../data/stages/Z2-08.json';
import z208Map from '../../../data/maps/z2-08-nanan.json';
import z209 from '../../../data/stages/Z2-09.json';
import z209Map from '../../../data/maps/z2-09-tianshui.json';
import z210 from '../../../data/stages/Z2-10.json';
import z210Map from '../../../data/maps/z2-10-weinan.json';

/** 제갈량전 장 묶음 C(남중 평정 후반 ~ 1차 북벌 앞머리). 형식은 ./types.ts, 장 구성은 docs/design/제갈량전-기획.md. */
const batch:ZhugeBatch={
  chapters:[
    {stage:z203 as StageDef,map:z203Map as MapFile,year:'건흥 3년 · 225년 · 남중 독룡동',label:'독천과 해독',quote:'샘이 독이면, 사람의 지혜로 물을 바꾼다.'},
    {stage:z204 as StageDef,map:z204Map as MapFile,year:'건흥 3년 · 225년 · 남중 은갱동',label:'맹수와 목수',quote:'짐승은 불을 두려워하고, 사람은 그 두려움을 쓴다.'},
    {stage:z205 as StageDef,map:z205Map as MapFile,year:'건흥 3년 · 225년 · 남중 반사곡',label:'등갑과 화공',quote:'칼을 튕겨 내는 갑옷도 불 앞에서는 장작이다.'},
    {stage:z206 as StageDef,map:z206Map as MapFile,year:'건흥 6년 · 228년 · 신성',label:'편지와 급습',quote:'한 달 걸린다던 길을, 그 사람은 여드레에 왔다.'},
    {stage:z207 as StageDef,map:z207Map as MapFile,year:'건흥 6년 · 228년 · 기산',label:'북벌의 첫발',quote:'신은 엎드려 아뢰옵니다. 지금 천하는 셋으로 나뉘었습니다.'},
    {stage:z208 as StageDef,map:z208Map as MapFile,year:'건흥 6년 · 228년 · 남안',label:'거짓 사자',quote:'성문은 칼로 여는 것이 아니라 말로 여는 것이다.'},
    {stage:z209 as StageDef,map:z209Map as MapFile,year:'건흥 6년 · 228년 · 천수',label:'기린아',quote:'평생 배운 것을 전할 사람을, 적진에서 찾았다.'},
    {stage:z210 as StageDef,map:z210Map as MapFile,year:'건흥 6년 · 228년 · 기산 앞',label:'설전과 야습',quote:'말 한마디가 화살보다 먼저 진을 무너뜨린다.'},
  ],
  rules:{
    'Z2-03':{foeEdge:{normal:0,extreme:25},sealNames:['독룡동 평정','신속한 평정','부대 보존'],weather:'무더위 · 독기 서린 골짜기',
      labels:[{region:'hermit',text:'만안계 은자'},{region:'springs',text:'독천'},{region:'cave',text:'독룡동'}],
      phase:({state})=>state.scenarioPhase==='poison'?'독기 · 부대 공격 약화 — 총대장이 만안계 은자에게 닿으면 풀린다':'해독 · 독룡동의 만병 섬멸'},
    'Z2-04':{foeEdge:{normal:5,extreme:18},sealNames:['은갱동 평정','신속한 평정','부대 보존'],weather:'흐림 · 목록대왕이 부른 바람',
      labels:[{region:'fort',text:'은갱동'},{region:'wood_in',text:'목수 도착'}],
      phase:({state})=>state.scenarioPhase==='beasts'?`맹수의 포효 · 부대 사기 저하 — 목수가 3턴에 온다`:'목수의 불 · 맹수가 겁을 먹었다'},
    'Z2-05':{foeEdge:{normal:-12,extreme:-8},sealNames:['등갑군 격파','신속한 격파','부대 보존'],weather:'맑음 · 바싹 마른 골짜기',
      labels:[{region:'valley',text:'반사곡'},{region:'wuge_camp',text:'오과국 진영'}],
      phase:({state})=>state.scenarioPhase==='lure'?'유인 · 올돌골을 반사곡으로 끌어들이면 불이 오른다(늦어도 6턴)':'화공 · 불에 그을린 등갑군을 쓸어라'},
    'Z2-06':{foeEdge:{normal:-6,extreme:0},sealNames:['서문 탈출','신속한 탈출','맹달 구출'],weather:'정월 · 차가운 강바람',
      labels:[{region:'keep',text:'맹달의 본채'},{region:'west_exit',text:'서쪽 산길'},{region:'east_door',text:'동문'}],
      phase:({state})=>state.scenarioPhase==='approach'?'맹달과 만나기 · 총대장을 신성 본채로':'급습 · 사마의가 왔다 — 총대장을 서쪽 산길로',
      seals:({state})=>[1,...(state.turn<=9?[2]:[]),...(state.find('z_meng_da')?.alive?[3]:[])]},
    'Z2-07':{foeEdge:{normal:-26,extreme:-22},sealNames:['기산 점령','신속한 진군','부대 보존'],weather:'봄 · 맑고 바람 약함',
      labels:[{region:'qishan',text:'기산 진채'},{region:'xh_camp',text:'하후무 본진'}],
      phase:({state})=>state.find('z_xiahou_mao')?.alive?'하후무를 몰아내라':'기산 진채를 점령하라'},
    'Z2-08':{foeEdge:{normal:-8,extreme:-5},anchored:['z_xiahou_mao','z8_keep_a','z8_keep_b','z8_amb_c'],sealNames:['남안 함락','신속한 함락','부대 보존'],weather:'봄비 · 젖은 성벽',
      labels:[{region:'door_inner',text:'동문'},{region:'keep',text:'하후무'}],
      phase:({state})=>state.scenarioPhase==='infiltrate'?'잠입 · 관흥이나 장포를 동문 안쪽으로':'동문이 열렸다 · 하후무를 몰아내라'},
    'Z2-09':{foeEdge:{normal:-15,extreme:-3},tough:[{unit:'z_jiangwei_ts',hpScale:1.5}],sealNames:['천수군 격파','신속한 격파','강유 귀순'],weather:'맑음 · 서늘한 바람',
      labels:[{region:'city',text:'천수성'},{region:'jixian',text:'기현'}],
      phase:({state})=>state.scenarioPhase==='lure'?'강유를 꺾어라 · 체력이 절반 아래로 내려가면 마음이 흔들린다':'강유가 돌아섰다 · 천수군을 물리쳐라'},
    'Z2-10':{foeEdge:{normal:-12,extreme:-8},sealNames:['조진 격퇴','신속한 반격','곽회 격퇴'],weather:'밤 · 달 없는 하늘',
      labels:[{region:'shu_camp',text:'빈 영채'},{region:'wei_camp',text:'조진 본진'}],
      phase:({state})=>state.scenarioPhase==='night'?'야습 · 빈 영채로 적을 끌어들여라(2턴에 불)':'반격 · 조진을 몰아내거나 본진을 점령하라'},
  },
  levels:{'Z2-03':18,'Z2-04':19,'Z2-05':20,'Z2-06':21,'Z2-07':22,'Z2-08':23,'Z2-09':24,'Z2-10':25},
  people:[
    // ── 남중(오과국)
    {name:'토안',epithet:'오과국의 등갑 장수',stats:[78,28,62,20,34],temper:'brave',side:'other',
      bio:'정사에 없고 『삼국지연의』에만 나오는 인물이다. 연의에서는 오과국 왕 올돌골의 부장으로 해니와 함께 등갑군을 이끌고 촉군을 몰아붙이다가, 반사곡에서 불길에 갇혀 쓰러진다.'},
    {name:'해니',epithet:'오과국의 등갑 장수',stats:[76,26,60,18,32],temper:'reckless',side:'other',
      bio:'정사에 없고 『삼국지연의』에만 나오는 인물이다. 연의에서는 토안과 함께 올돌골을 섬긴 오과국의 장수로, 달아나는 위연을 쫓아 반사곡 깊이 들어갔다가 등갑군과 함께 불에 탄다.'},
    // ── 위
    {name:'신의',epithet:'위흥 태수 · 맹달을 고변한 자',stats:[62,58,64,56,40],temper:'cautious',side:'wei',
      bio:'상용 일대의 호족으로 형 신탐과 함께 유비에게 귀부했다가, 맹달과 함께 위로 돌아섰다. 위흥 태수로 있으면서 맹달과 사이가 나빠 그의 속셈을 조정에 알렸고, 맹달이 죽은 뒤 사마의에게 불려 가 벼슬을 잃었다.'},
    {name:'이보',epithet:'신성의 문을 연 맹달의 부장',stats:[60,40,52,34,30],temper:'timid',side:'wei',
      bio:'맹달의 부장이다. 228년 정월 사마의가 신성을 에워싼 지 열엿새 만에 맹달의 생질 등현과 함께 성문을 열고 항복했고, 이 때문에 맹달은 붙잡혀 목이 베였다.'},
    {name:'한덕',epithet:'서량의 큰 도끼',stats:[82,30,64,24,40],temper:'reckless',side:'wei',
      bio:'정사에 없고 『삼국지연의』에만 나오는 인물이다. 연의에서는 서량의 대장으로 큰 도끼를 잘 쓰며, 네 아들과 함께 하후무를 따라 나섰다가 봉명산에서 아들들을 모두 조운에게 잃고 자신도 죽는다.'},
    {name:'최량',epithet:'안정 태수',stats:[48,56,54,58,40],temper:'cautious',side:'wei',
      bio:'정사에 없고 『삼국지연의』에만 나오는 인물이다. 연의에서는 안정 태수로 제갈량의 거짓 사자에 속아 성을 비웠다가 사로잡히고, 남안에 들어가 하후무와 계교를 꾸미다가 도리어 죽는다.'},
    {name:'양릉',epithet:'남안 태수',stats:[50,50,56,52,40],temper:'proud',side:'wei',
      bio:'정사에 없고 『삼국지연의』에만 나오는 인물이다. 연의에서는 남안 태수로 최량과 함께 촉군을 성 안으로 끌어들여 치려 했으나, 제갈량에게 속셈을 간파당해 성과 함께 목숨을 잃는다.'},
    {name:'조준',epithet:'조진과 함께 자란 종친',stats:[70,44,60,40,48],temper:'brave',side:'wei',
      bio:'조진의 종친으로 어려서 조진과 함께 조조를 섬겼다. 일찍 세상을 떠나자 조진이 자기 봉읍을 나누어 그 아들에게 주기를 청했다고 정사에 전한다. 연의에서는 조진의 선봉으로 촉의 영채를 치다 죽는다.'},
    {name:'주찬',epithet:'조진의 고향 친구',stats:[68,42,58,40,46],temper:'brave',side:'wei',
      bio:'조진과 같은 고향 사람으로 조준과 함께 어려서부터 조조를 섬겼다. 일찍 세상을 떠나 조진이 그 아들에게 봉읍을 나누어 주었다고 정사에 전한다. 연의에서는 조준과 함께 촉의 영채를 습격하다 죽는다.'},
  ],
  npcs:[
    {name:'목수',unitClass:'catapult',side:'ally',stages:['Z2-04']},
    {name:'맹달',unitClass:'infantry',side:'allyAi',stages:['Z2-06']},
    {name:'신성 수비병',unitClass:'spearman',side:'allyAi',stages:['Z2-06']},
    {name:'신성 궁병',unitClass:'archer',side:'allyAi',stages:['Z2-06']},
  ],
};
export default batch;
