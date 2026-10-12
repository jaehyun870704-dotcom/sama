import type {MapFile,StageDef} from '../../../core/src/index.ts';
import type {ZhugeBatch} from './types.ts';
import z102Stage from '../../../data/stages/Z1-02.json';
import z102Map from '../../../data/maps/z1-02-longzhong.json';
import z103Stage from '../../../data/stages/Z1-03.json';
import z103Map from '../../../data/maps/z1-03-bowang.json';
import z104Stage from '../../../data/stages/Z1-04.json';
import z104Map from '../../../data/maps/z1-04-xinye.json';
import z105Stage from '../../../data/stages/Z1-05.json';
import z105Map from '../../../data/maps/z1-05-hanjin.json';
import z106Stage from '../../../data/stages/Z1-06.json';
import z106Map from '../../../data/maps/z1-06-nanping.json';
import z107Stage from '../../../data/stages/Z1-07.json';
import z107Map from '../../../data/maps/z1-07-huarong.json';
import z108Stage from '../../../data/stages/Z1-08.json';
import z108Map from '../../../data/maps/z1-08-nanjun.json';
import z109Stage from '../../../data/stages/Z1-09.json';
import z109Map from '../../../data/maps/z1-09-four-commanderies.json';

/** 제갈량전 장 묶음 A(Z1-02~Z1-09). 형식은 ./types.ts, 장 구성은 docs/design/제갈량전-기획.md. */
const batch:ZhugeBatch={
  chapters:[
    {stage:z102Stage as StageDef,map:z102Map as MapFile,year:'건안 2년 · 197년',label:'은거와 도적',quote:'몸을 숨길 곳을 찾는 길도 칼끝을 지나야 했다.'},
    {stage:z103Stage as StageDef,map:z103Map as MapFile,year:'건안 13년 · 208년',label:'첫 화공',quote:'바람은 남쪽에서, 불은 골짜기 깊은 곳에서.'},
    {stage:z104Stage as StageDef,map:z104Map as MapFile,year:'건안 13년 · 208년',label:'빈 성과 물',quote:'성을 버려야 사람을 지킨다.'},
    {stage:z105Stage as StageDef,map:z105Map as MapFile,year:'건안 13년 · 208년',label:'호송과 물길',quote:'배 한 척에 실린 것은 사람이 아니라 내일이었다.'},
    {stage:z106Stage as StageDef,map:z106Map as MapFile,year:'건안 13년 · 208년',label:'설전과 동남풍',quote:'혀로 맺은 맹약을 바람이 지켰다.'},
    {stage:z107Stage as StageDef,map:z107Map as MapFile,year:'건안 13년 · 208년',label:'놓아 주는 싸움',quote:'칼은 들었으나 옛정이 길을 비켰다.'},
    {stage:z108Stage as StageDef,map:z108Map as MapFile,year:'건안 14년 · 209년',label:'두 성의 주인',quote:'남이 싸우는 사이, 빈 성의 문이 열렸다.'},
    {stage:z109Stage as StageDef,map:z109Map as MapFile,year:'건안 14년 · 209년',label:'네 갈래 진군',quote:'늙은 활은 꺾이지 않고, 주인을 골랐다.'},
  ],
  rules:{
    'Z1-02':{sealNames:['초가에 닿다','형제 무사','빠른 걸음'],weather:'맑음 · 융중의 산바람',labels:[{region:'objective',text:'융중 초가'},{region:'chief_camp',text:'도적 두목'}]},
    'Z1-03':{sealNames:['하후돈 격퇴','빠른 승리','적군 와해'],tough:[{unit:'z_xiahou_dun',hpScale:2.2,defense:4}],weather:'건조한 남풍 · 마른 갈대',labels:[{region:'mouth',text:'골짜기 어귀'},{region:'camp',text:'유비 본진'}],zones:[{region:'valley',color:0xff8a3d}],
      phase:({state})=>state.firedEvents.has('Z1-03/fire')?'골짜기에 불 · 하후돈을 물리쳐라':`조운이 적을 골짜기로 끈다 · 2턴에 불(지금 ${state.turn}턴)`},
    'Z1-04':{sealNames:['신야 철수','부대 보존','빠른 철수'],weather:'가을 · 강한 서풍',protect:[{unit:'z4_people_a',hp:110,movement:4},{unit:'z4_people_b',hp:110,movement:4}],labels:[{region:'town',text:'신야성'},{region:'exit',text:'번성 가는 길'}],zones:[{region:'exit',color:0xffd27a}],
      phase:({state})=>state.scenarioPhase==='evac'?'백성을 백하 건너로 · 빈 신야성에 적이 들면 불(늦어도 5턴)':state.scenarioPhase==='fire'?'신야성의 불 · 허저가 백하 물가에 닿으면 물(늦어도 7턴)':'남은 적을 물리쳐라'},
    'Z1-05':{sealNames:['강하 도착','부대 보존','빠른 물길'],weather:'흐림 · 한수의 물안개',protect:[{unit:'z5_ship',hp:170,movement:3}],labels:[{region:'objective',text:'강하 나루'},{region:'north_ford',text:'여울'}],zones:[{region:'objective',color:0xffd27a}],
      phase:({state})=>state.find('z_liu_qi')?.alive?'유기의 강하 수군 합류 · 배를 강하 나루까지':'배를 지켜 한수를 내려가라 · 4턴에 강하에서 원군'},
    'Z1-06':{sealNames:['나루 도착','빠른 탈출','추격 떨치기'],weather:'겨울 · 동남풍',labels:[{region:'altar',text:'칠성단'},{region:'objective',text:'조운의 배'}],zones:[{region:'objective',color:0xffd27a}],
      phase:({state})=>state.turn<2?'동남풍이 분다 · 총대장은 나루로':'정봉·서성의 추격 · 총대장을 조운의 배까지'},
    'Z1-07':{sealNames:['화용도의 해후','빠른 매복','패잔병 소탕'],weather:'흐림 · 진흙길과 젖은 바람',tough:[{unit:'z_cao_cao',hpScale:2.5,defense:6}],
      labels:[{region:'huarong',text:'화용도'},{region:'wulin',text:'오림'}],zones:[{region:'huarong',color:0xffd27a}],
      // 조조는 관우를 찾아 달린다: 엔진의 따라가기(behavior 'follow' · followUnit 'z_guan_yu')가 매 차례 관우 곁으로 이끈다.
      phase:({state})=>state.find('z_cao_cao')?.alive?'조조가 화용도로 온다 · 쓰러뜨리지 말고 관우와 마주치게 하라':'패잔병을 치며 조조를 기다려라 · 3턴에 조조 등장',
      failure:({state})=>state.find('z_cao_cao')?.alive===false?'조조가 쓰러졌습니다. 화용도의 매듭은 놓아 주는 데 있었습니다.':undefined},
    'Z1-08':{sealNames:['두 성 차지','빠른 점령','부대 보존'],tough:[{unit:'z_cao_ren',hpScale:2.2,defense:4}],weather:'늦겨울 · 맑음',labels:[{region:'nanjun_keep',text:'남군 안채'},{region:'xiangyang_keep',text:'양양 안채'}],zones:[{region:'nanjun_keep',color:0xffd27a},{region:'xiangyang_keep',color:0xffd27a}],
      phase:({state})=>state.captured.get('nanjun_keep')==='player'?'양양의 안채를 차지하라':'주유가 조인을 붙잡은 사이 남군의 안채를 차지하라'},
    'Z1-09':{sealNames:['네 고을 평정','빠른 평정','부대 보존'],weather:'봄 · 상강의 물안개',tough:[{unit:'z_huang_zhong',hpScale:1.5,defense:3}],
      labels:[{region:'lingling_keep',text:'영릉'},{region:'guiyang_keep',text:'계양'},{region:'wuling_keep',text:'무릉'},{region:'changsha_keep',text:'장사'}],
      zones:[{region:'lingling_keep',color:0xffd27a},{region:'guiyang_keep',color:0xffd27a},{region:'wuling_keep',color:0xffd27a},{region:'changsha_keep',color:0xffd27a}],
      phase:({state})=>{const left=['lingling_keep','guiyang_keep','wuling_keep','changsha_keep'].filter(r=>state.captured.get(r)!=='player').length;return `네 고을의 안채 · 남은 곳 ${left}${state.firedEvents.has('Z1-09/huang-zhong')?' · 황충·위연 합류':' · 황충을 꺾으면 장사가 돌아선다'}`;}},
  },
  levels:{'Z1-02':4,'Z1-03':5,'Z1-04':6,'Z1-05':7,'Z1-06':8,'Z1-07':8,'Z1-08':9,'Z1-09':10},
  stageClass:{'Z1-05':{z_guan_yu:'navy'}},
  people:[
    {name:'하후란',epithet:'조운의 고향 사람 · 박망에서 사로잡힌 장수',stats:[62,50,56,52,48],temper:'brave',side:'wei',
      bio:'상산 사람으로 조운과 어려서부터 알던 사이였다. 「조운별전」에 따르면 박망 싸움에서 유비군에게 사로잡혔는데, 조운이 유비에게 목숨을 빌어 살려 주고 법에 밝다며 군정으로 천거했다.'},
    {name:'한호',epithet:'둔전을 건의한 호군',stats:[66,60,64,62,58],temper:'calm',side:'wei',courtesy:'원사',
      bio:'하내 사람으로 자는 원사다. 조조를 따라 둔전을 일으키자고 건의했고 호군과 중호군을 지내며 군을 감독했다. 연의에서는 하후돈의 부장으로 박망파 싸움에 나선다.'},
    {name:'조순',epithet:'호표기를 이끈 조인의 아우',stats:[74,58,76,56,62],temper:'calm',side:'wei',courtesy:'자화',
      bio:'조인의 아우로 조조의 정예 기병 호표기를 이끌었다. 208년 장판에서 유비를 뒤쫓아 그 두 딸과 짐수레를 빼앗았고, 이어 강릉을 손에 넣는 데 공을 세웠다.'},
    {name:'유기',epithet:'유표의 맏아들 · 강하 태수',stats:[40,60,50,62,72],temper:'timid',side:'other',
      bio:'형주목 유표의 맏아들이다. 계모 채씨와 아우 유종 쪽의 시기를 받자 제갈량의 말을 따라 강하 태수로 나가 몸을 피했다. 208년 장판에서 쫓겨 온 유비를 맞았고, 이듬해 형주자사로 세워졌으나 곧 병으로 죽었다.'},
    {name:'진교',epithet:'조인의 장사',stats:[30,74,56,78,62],temper:'calm',side:'wei',courtesy:'계필',
      bio:'광릉 동양 사람으로 자는 계필이다. 조인의 장사로 강릉성에 있으면서 주유의 군사와 맞선 조인의 싸움을 지켜보았고, 뒤에 위의 상서령과 사도에 올랐다. 연의에서는 남군을 지키다 조운에게 사로잡혀 병부를 빼앗긴다.'},
  ],
  npcs:[
    {name:'서서',unitClass:'infantry',side:'allyAi',stages:['Z1-02']},
    {name:'신야 백성',unitClass:'civilian',side:'allyAi',stages:['Z1-04']},
    {name:'피난민 배',unitClass:'navy',side:'allyAi',stages:['Z1-05']},
    {name:'유기',unitClass:'navy',side:'allyAi',stages:['Z1-05']},
    {name:'강하 수군',unitClass:'navy',side:'allyAi',stages:['Z1-05']},
    {name:'강하 군사',unitClass:'infantry',side:'allyAi',stages:['Z1-05']},
    {name:'주유',unitClass:'strategist',side:'allyAi',stages:['Z1-08']},
    {name:'정보',unitClass:'spearman',side:'allyAi',stages:['Z1-08']},
    {name:'오군 보병',unitClass:'infantry',side:'allyAi',stages:['Z1-08']},
    {name:'오군 궁병',unitClass:'archer',side:'allyAi',stages:['Z1-08']},
  ],
};
export default batch;
