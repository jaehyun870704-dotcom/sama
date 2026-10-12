import type {MapFile,StageDef} from '../../../core/src/index.ts';
import type {ZhugeBatch} from './types.ts';
import z211Stage from '../../../data/stages/Z2-11.json';
import z211Map from '../../../data/maps/z2-11-xicheng-retreat.json';
import z212Stage from '../../../data/stages/Z2-12.json';
import z212Map from '../../../data/maps/z2-12-chencang-walls.json';
import z213Stage from '../../../data/stages/Z2-13.json';
import z213Map from '../../../data/maps/z2-13-wudu-yinping.json';
import z214Stage from '../../../data/stages/Z2-14.json';
import z214Map from '../../../data/maps/z2-14-qishan-camp.json';
import z215Stage from '../../../data/stages/Z2-15.json';
import z215Map from '../../../data/maps/z2-15-wooden-ox.json';
import z216Stage from '../../../data/stages/Z2-16.json';
import z216Map from '../../../data/maps/z2-16-mumen-gorge.json';
import z217Stage from '../../../data/stages/Z2-17.json';
import z217Map from '../../../data/maps/z2-17-weishui-bridge.json';
import z218Stage from '../../../data/stages/Z2-18.json';
import z218Map from '../../../data/maps/z2-18-shangfang-valley.json';
import z219Stage from '../../../data/stages/Z2-19.json';
import z219Map from '../../../data/maps/z2-19-wuzhang-autumn.json';

/** 제갈량전 장 묶음 D(26~34장: 가정 이후 ~ 오장원). 형식은 ./types.ts, 장 구성은 docs/design/제갈량전-기획.md. */
const batch:ZhugeBatch={
  chapters:[
    {stage:z211Stage as StageDef,map:z211Map as MapFile,year:'건흥 6년 · 228년 · 서성',label:'빈 성과 퇴각',quote:'성문을 열어 두어라. 의심 많은 자는 열린 문 앞에서 멈춘다.'},
    {stage:z212Stage as StageDef,map:z212Map as MapFile,year:'건흥 6년 · 228년 겨울 · 진창',label:'성을 친다',quote:'천 명이 지키는 성도, 지키는 사람이 학소라면 만 명의 성이다.'},
    {stage:z213Stage as StageDef,map:z213Map as MapFile,year:'건흥 7년 · 229년 · 무도·음평',label:'두 고을',quote:'구원군을 막는 길은 구원군이 오는 길목에 먼저 서는 것이다.'},
    {stage:z214Stage as StageDef,map:z214Map as MapFile,year:'건흥 9년 · 231년 · 기산',label:'본영 사수',quote:'움직이지 않는 산은 바람이 아무리 불어도 기울지 않는다.'},
    {stage:z215Stage as StageDef,map:z215Map as MapFile,year:'건흥 9년 · 231년 · 사곡',label:'나무 소의 군량',quote:'먹지도 지치지도 않는 소라면, 혀 하나로 멈출 수도 있다.'},
    {stage:z216Stage as StageDef,map:z216Map as MapFile,year:'건흥 9년 · 231년 · 목문',label:'좁은 길의 쇠뇌',quote:'쫓는 자가 빠를수록, 좁은 길은 더 깊다.'},
    {stage:z217Stage as StageDef,map:z217Map as MapFile,year:'건흥 12년 · 234년 · 위수',label:'부교와 북원',quote:'강을 건너는 다리는 물보다 먼저 사람의 마음에 놓는다.'},
    {stage:z218Stage as StageDef,map:z218Map as MapFile,year:'건흥 12년 · 234년 · 상방곡',label:'불과 비',quote:'일을 꾸미는 것은 사람이나, 이루는 것은 하늘이다.'},
    {stage:z219Stage as StageDef,map:z219Map as MapFile,year:'건흥 12년 · 234년 가을 · 오장원',label:'남긴 계책',quote:'죽은 제갈이 산 중달을 달아나게 했다.'},
  ],
  // foeEdge: sim(보물·연구 없이, 처음 하는 사람의 장 기본 레벨) 일반 90%·극한 70% 기준으로 맞춘 적 세기 보정(%).
  // tough: 기믹으로 꺾어야 하는 적장. 목문의 장합·상방곡과 오장원의 사마의는 매복·불·목상 사건이 체력을 크게 깎는다.
  rules:{
    'Z2-11':{foeEdge:{extreme:30},sealNames:['양평관 도착','추격 저지','부대 보존'],weather:'봄바람 · 흙먼지 이는 서성',labels:[{region:'objective',text:'양평관 길'},{region:'wei_north',text:'사마의 본대'}]},
    'Z2-12':{foeEdge:{normal:-38,extreme:-21},sealNames:['학소 퇴각','왕쌍 격퇴','신속한 공성'],weather:'겨울 · 눈발 날리는 진창',medicine:3,tough:[{unit:'z_hao_zhao',hpScale:1.8,defense:3}],labels:[{region:'keep',text:'진창성 · 학소'},{region:'relief',text:'구원군 길'}]},
    'Z2-13':{foeEdge:{normal:-10,extreme:18},medicine:3,tough:[{unit:'z_chen_shi',hpScale:3,defense:6}],sealNames:['두 진지 점령','진식 생환','신속한 점령'],weather:'초봄 · 녹은 눈이 흐르는 산길',labels:[{region:'wudu',text:'무도 진지'},{region:'yinping',text:'음평 진지'},{region:'relief',text:'곽회의 구원군'}]},
    'Z2-14':{foeEdge:{normal:-42,extreme:-15},sealNames:['위군 격퇴','신속한 격퇴','수비대 생존'],tough:[{unit:'z2_14_guard',hpScale:2.2}],weather:'봄 · 보리가 패는 농서의 들',labels:[{region:'camp_core',text:'기산 본영'},{region:'wei_west',text:'사마의 본대'}]},
    'Z2-15':{foeEdge:{normal:-15,extreme:5},sealNames:['수송대 귀환','잠위 격퇴','부대 보존'],weather:'초여름 · 잔도에 걸린 구름',protect:[{unit:'z2_15_ox',hp:520,movement:4},{unit:'z2_15_horse',hp:520,movement:4}],labels:[{region:'depot',text:'위군 군량고'},{region:'objective',text:'잔도 어귀'}]},
    'Z2-16':{foeEdge:{normal:-10,extreme:35},sealNames:['장합 퇴각','추격대 격파','부대 보존'],weather:'여름 · 골짜기를 메운 먼지',tough:[{unit:'z_zhang_he',hpScale:7,defense:12}],labels:[{region:'gorge',text:'목문 골짜기'},{region:'far_ridge_label',text:'쇠뇌 매복'}]},
    'Z2-17':{foeEdge:{normal:-22,extreme:0},sealNames:['북원 도달','진랑 격퇴','신속한 도하'],weather:'봄 · 불어난 위수',labels:[{region:'bridge_site',text:'다리 터'},{region:'beiyuan',text:'북원'},{region:'ford_east',text:'동쪽 여울'}]},
    'Z2-18':{foeEdge:{normal:-5,extreme:19},sealNames:['사마의 퇴각','위군 격파','신속한 화공'],weather:'늦여름 · 먹구름이 낮게 깔림',weatherText:{cloudy:'☁ 늦여름 · 먹구름이 낮게 깔림',rain:'☂ 큰비 · 상방곡의 불이 꺼졌다'},tough:[{unit:'z_sima_yi',hpScale:3,defense:8}],labels:[{region:'grain',text:'미끼 군량'},{region:'valley',text:'상방곡'}]},
    'Z2-19':{foeEdge:{normal:15,extreme:45},sealNames:['사마의 퇴각','신속한 철군','목상 보존'],somber:true,weather:'가을 · 큰 별이 떨어진 다음 날',tough:[{unit:'z_sima_yi',hpScale:2.5,defense:6}],labels:[{region:'statue',text:'승상의 수레'}]},
  },
  npcs:[
    {name:'진식',unitClass:'infantry',side:'allyAi',stages:['Z2-13']},
    {name:'기산 수비대',unitClass:'spearman',side:'allyAi',stages:['Z2-14']},
    {name:'목우 수송대',unitClass:'transport',side:'allyAi',stages:['Z2-15']},
    {name:'유마 수송대',unitClass:'transport',side:'allyAi',stages:['Z2-15']},
    {name:'목문 쇠뇌수',unitClass:'crossbow',side:'allyAi',stages:['Z2-16']},
    {name:'제갈량의 목상',unitClass:'strategist',side:'allyAi',stages:['Z2-19']},
  ],
  levels:{'Z2-11':26,'Z2-12':26,'Z2-13':27,'Z2-14':28,'Z2-15':29,'Z2-16':30,'Z2-17':31,'Z2-18':32,'Z2-19':33},
  people:[
    {name:'잠위',epithet:'목우유마를 몰던 위의 장수',stats:[72,38,60,30,42],temper:'brave',side:'wei',
      bio:'정사에는 보이지 않고 연의에만 나오는 위의 장수다. 사마의가 빼앗은 목우유마를 본떠 만든 수레로 군량을 나르다가, 위군으로 꾸민 왕평의 군사에게 습격당해 목숨을 잃는다.'},
    {name:'진랑',epithet:'조조의 의붓아들 · 위수의 보기 이만',stats:[70,52,68,48,60],temper:'proud',side:'wei',courtesy:'원명',
      bio:'조조가 거둔 의붓아들로 조예의 총애를 받아 효기장군에 올랐다. 234년 제갈량이 위수 남쪽에 진을 치자 보병과 기병 이만을 이끌고 사마의의 지휘를 받았다. 연의에서는 위수 북쪽의 싸움에서 촉군에게 목숨을 잃는다.'},
  ],
};
export default batch;
