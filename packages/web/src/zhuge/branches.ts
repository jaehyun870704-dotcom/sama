/**
 * 제갈량전 선택분기 — 연의의 갈림 지점 여섯 곳에서 「다른 길」을 고르면 열리는 가상 전장.
 *
 * 사마의전 연의 지도(chronicle-map.ts · fate.ts)와 같은 틀이다: 본편 줄기(34장)의 갈림 장을 이기면 갈림길 칸이 열리고,
 * 그 뒤로 가상 전장 둘과 갈래 끝 우두머리 하나가 차례로 열린다. 사마의전의 가지는 원정 전장을 그때그때 만들지만,
 * 제갈량전의 가지는 본편처럼 손으로 쓴 스테이지(packages/data/stages/ZB*.json)다 — 맵은 기존 것을 다시 쓰고
 * 적 배치·승리 조건·전투 대사는 새로 썼다. 가상 시나리오는 이 게임의 창작이다(연의·정사의 실제 일이 아니다).
 *
 * 이 파일은 데이터와 타입만 가져온다(묶음 파일과 같은 규칙 — 순환 import 방지).
 */
import type {MapFile,StageDef,UnitClass} from '../../../core/src/index.ts';
import type {ZhugeBatch} from './types.ts';
import type {BattleLine} from '../battle-lines.ts';
import zb101 from '../../../data/stages/ZB1-01.json';
import zb102 from '../../../data/stages/ZB1-02.json';
import zb103 from '../../../data/stages/ZB1-03.json';
import zb201 from '../../../data/stages/ZB2-01.json';
import zb202 from '../../../data/stages/ZB2-02.json';
import zb203 from '../../../data/stages/ZB2-03.json';
import zb301 from '../../../data/stages/ZB3-01.json';
import zb302 from '../../../data/stages/ZB3-02.json';
import zb303 from '../../../data/stages/ZB3-03.json';
import zb401 from '../../../data/stages/ZB4-01.json';
import zb402 from '../../../data/stages/ZB4-02.json';
import zb403 from '../../../data/stages/ZB4-03.json';
import zb501 from '../../../data/stages/ZB5-01.json';
import zb502 from '../../../data/stages/ZB5-02.json';
import zb503 from '../../../data/stages/ZB5-03.json';
import zb601 from '../../../data/stages/ZB6-01.json';
import zb602 from '../../../data/stages/ZB6-02.json';
import zb603 from '../../../data/stages/ZB6-03.json';
import xinyeMap from '../../../data/maps/z1-04-xinye.json';
import xiangyangMap from '../../../data/maps/xiangyang-walls.json';
import nanjunMap from '../../../data/maps/z1-08-nanjun.json';
import hanshuiBridgeMap from '../../../data/maps/hanzhong-hanshui-bridge.json';
import fanchengMap from '../../../data/maps/fancheng-relief.json';
import xinchengMap from '../../../data/maps/xincheng-fort.json';
import hanshuiFloodMap from '../../../data/maps/hanzhong-hanshui-flood.json';
import chengguMap from '../../../data/maps/chenggu-river.json';
import wuweiMap from '../../../data/maps/wuwei-citadel.json';
import mumenMap from '../../../data/maps/mumen-gorge.json';
import nananMap from '../../../data/maps/z1-15-nanan.json';
import shitingMap from '../../../data/maps/shiting-gorge.json';
import mansongMap from '../../../data/maps/z2-02-mansong.json';
import yinkengMap from '../../../data/maps/z2-04-yinkeng.json';
import dulongMap from '../../../data/maps/z2-03-dulong.json';
import jietingMap from '../../../data/maps/jieting-hill.json';
import bajunMap from '../../../data/maps/z1-10-bajun.json';
import luoguMap from '../../../data/maps/luogu-valley.json';

/** 갈림 지점: 본편의 이 장(anchor)을 이기면 갈림길이 열린다. */
export interface ZhugeFork {
  id:string;anchor:string;
  /** 갈림길 칸에 쓰는 때·곳 · 제목 · 상황 */
  year:string;title:string;prompt:string;
  /** 다른 길을 고르는 말 · 그 길의 설명 · 길 이름 */
  choice:string;detail:string;name:string;
  /** 정사(본편)는 어떻게 흘렀나 — 갈림길 칸에서 함께 보인다. */
  history:string;
  /** 칸 id(차례대로 · 마지막이 우두머리) */
  nodes:string[];
}
/** 칸을 처음 이기면 받는 것. 다시 이기면 금만 셋에 하나. */
export interface BranchReward {gold:number;gear:string;supplies:Record<string,number>}
export interface BranchNode {
  id:string;fork:string;title:string;
  /** 출진 전 서사 */
  intro:string;
  /** 이긴 뒤 한 줄 */
  outro:string;
  /** 쓰러뜨려야 할 이름난 적장 */
  foe:{name:string;unitClass:UnitClass};
  boss?:true;
  reward:BranchReward;
}

export const ZHUGE_FORKS:readonly ZhugeFork[]=[
  {id:'zf1',anchor:'Z1-02',year:'207년 · 융중',title:'융중대의 첫 수',
    prompt:'초가에서 천하를 셋으로 나누는 계책을 들려준 날, 제갈량은 유비에게 한 가지를 더 말했다. "형주의 주인 유표는 오래 가지 못합니다. 형주를 먼저 쥐지 않으면 조조가 쥡니다." 유비는 같은 성씨의 땅을 빼앗을 수 없다며 고개를 저었다.',
    history:'정사에서 유비는 형주를 받지 않았다. 유표가 죽자 유종이 조조에게 항복했고, 유비는 신야를 버리고 남쪽으로 쫓겼다.',
    choice:'형주를 먼저 쥔다',detail:'유표의 뜻을 받아 형주를 맡는다. 채모와 형주 호족이 칼을 든다.',name:'가상 · 형주의 새 주인',
    nodes:['ZB1-01','ZB1-02','ZB1-03']},
  {id:'zf2',anchor:'Z1-08',year:'209년 · 남군',title:'적벽 뒤의 형주',
    prompt:'적벽의 불이 꺼지고 남군과 양양이 손에 들어왔다. 장수들은 남쪽 네 고을로 내려가자고 했다. 제갈량은 북쪽 한수를 바라보았다. 조조가 숨을 고르는 지금, 한 걸음 더 나아갈 수도 있다.',
    history:'정사에서 유비는 남쪽 네 고을(무릉·장사·계양·영릉)을 거두어 근거지를 넓혔다. 양양과 번성은 조인과 악진이 지켰다.',
    choice:'한수를 건너 북쪽을 친다',detail:'남쪽 고을 대신 한수 북쪽의 번성과 완성을 노린다. 조씨 일족의 장수들이 막아선다.',name:'가상 · 한수 너머',
    nodes:['ZB2-01','ZB2-02','ZB2-03']},
  {id:'zf3',anchor:'Z1-13',year:'219년 · 한중에서 형주로',title:'형주에서 온 급보',
    prompt:'한중왕의 즉위식이 끝나기도 전에 형주에서 급보가 왔다. 관우가 번성을 에워쌌으나, 동쪽 오가 수상하다. 성도를 지키라는 명을 받은 제갈량은 붓을 내려놓았다.',
    history:'정사에서 원군은 가지 않았다. 여몽이 강릉을 기습했고, 관우는 맥성에서 빠져나오다 붙잡혀 목숨을 잃었다.',
    choice:'직접 형주로 간다',detail:'조운·황충·위연을 이끌고 형주로 내려가 관우를 돕는다. 서황과 여몽을 차례로 맞는다.',name:'가상 · 맥성의 원군',
    nodes:['ZB3-01','ZB3-02','ZB3-03']},
  {id:'zf4',anchor:'Z1-14',year:'222년 · 어복포',title:'이릉의 불길 뒤',
    prompt:'이릉의 진채가 불에 타고 유비는 백제성으로 물러났다. 육손의 군사가 강을 따라 쫓아온다. 제갈량이 어복포 강가에 쌓아 둔 돌무더기 앞에서, 쫓는 자와 쫓기는 자의 자리가 바뀔 수도 있다.',
    history:'연의에서 육손은 어복포의 돌무더기 진(팔진도)에 길을 잃었다가 황승언의 안내로 빠져나와 군사를 돌렸다. 촉은 다시 동쪽을 치지 않았다.',
    choice:'팔진 앞에서 되받아친다',detail:'돌무더기 진에 든 오군을 치고, 강을 거슬러 육손의 진까지 간다.',name:'가상 · 이릉의 설욕',
    nodes:['ZB4-01','ZB4-02','ZB4-03']},
  {id:'zf5',anchor:'Z2-02',year:'225년 · 남중',title:'두 번째로 놓아 준 뒤',
    prompt:'맹획은 다시 풀려나 숲으로 돌아갔다. 장수들은 이번에야말로 베어야 한다고 했다. 제갈량은 맹획 대신 그를 둘러싼 사람들을 보았다. 아우 맹우, 아내 축융, 그리고 동마다 다른 부족들.',
    history:'연의에서 제갈량은 맹획을 일곱 번 사로잡고 일곱 번 놓아 주었다. 맹획은 마지막에 마음으로 따랐다.',
    choice:'곁의 사람부터 꺾는다',detail:'맹획을 쫓지 않고 맹우와 축융을 먼저 꺾어, 맹획이 기댈 곳을 하나씩 거둔다.',name:'가상 · 마음을 치는 길',
    nodes:['ZB5-01','ZB5-02','ZB5-03']},
  {id:'zf6',anchor:'Z2-10',year:'228년 · 가정',title:'가정을 누구에게',
    prompt:'기산으로 나온 첫 북벌. 사마의가 장합을 앞세워 가정으로 온다는 소식이 들렸다. 가정을 잃으면 모든 것을 잃는다. 마속이 자원했고, 장수들은 고개를 저었다. 제갈량은 지도 위의 작은 길목을 오래 보았다.',
    history:'정사에서 마속은 왕평의 말을 듣지 않고 산 위에 진을 쳤다가 물길을 끊겨 장합에게 크게 졌다. 첫 북벌은 거기서 끝났다.',
    choice:'몸소 가정으로 간다',detail:'제갈량이 마속·왕평과 함께 가정에 서서, 물이 있는 길목에 진을 친다.',name:'가상 · 길목의 진',
    nodes:['ZB6-01','ZB6-02','ZB6-03']},
];

const R=(gold:number,gear:string,supplies:Record<string,number>):BranchReward=>({gold,gear,supplies});
export const BRANCH_NODES:readonly BranchNode[]=[
  {id:'ZB1-01',fork:'zf1',title:'단계를 건너라',foe:{name:'채모',unitClass:'spearman'},reward:R(400,'shop:sword:1',{bean:2}),
    intro:'형주를 맡겠다는 답을 들은 채모가 양양의 연회 자리에 칼을 숨겼다. 이적이 몰래 일러 준 덕에 유비는 자리를 빠져나왔다. 서쪽 단계 나루까지 가면 산다.',
    outro:'유비를 태운 말이 단계의 물을 건넜다. 이적이 뒤따라와 함께 가겠다고 했다.'},
  {id:'ZB1-02',fork:'zf1',title:'양양 성문',foe:{name:'문빙',unitClass:'spearman'},reward:R(450,'shop:helmet:1',{water:2}),
    intro:'"채모가 양양을 쥐는 한 형주는 공의 것이 아닙니다." 이적의 말을 따라 양양으로 간다. 성을 지키는 문빙은 형주의 이름난 장수다.',
    outro:'문빙이 칼을 거두었다. "형주를 지키는 것이 내 일이었소. 주인이 바뀌어도 그 일은 같소."'},
  {id:'ZB1-03',fork:'zf1',title:'형주의 주인',foe:{name:'채모',unitClass:'spearman'},boss:true,reward:R(700,'shop:fan:2',{rice:2}),
    intro:'채모가 강릉에 형주 수군을 모았다. 유종의 이름으로 항복 문서를 조조에게 보내려 한다. 문서가 강을 건너기 전에 채모를 꺾어라.',
    outro:'항복 문서는 불에 탔다. 형주 아홉 군의 주인이 바뀌었다는 소식이 북쪽으로 달렸다.'},
  {id:'ZB2-01',fork:'zf2',title:'한수의 나루',foe:{name:'악진',unitClass:'infantry'},reward:R(600,'shop:spear:2',{bean:3}),
    intro:'남군을 얻은 기세로 북쪽을 친다. 한수를 건너는 나루는 악진이 지킨다. 다리목의 악진을 물리치면 번성으로 가는 길이 열린다.',
    outro:'악진이 물러나자 나루의 배가 모두 촉군의 것이 되었다. 형주 선비 마량이 찾아와 길을 안내하겠다고 했다.'},
  {id:'ZB2-02',fork:'zf2',title:'번성의 포위',foe:{name:'만총',unitClass:'infantry'},reward:R(650,'shop:armor:2',{panacea:1}),
    intro:'한수를 건너자 번성이 앞을 막는다. 성을 지키는 만총은 물러설 줄 모르는 사람이다. 성 밖의 포진을 뚫고 안채를 차지하라.',
    outro:'번성의 깃발이 내려갔다. 만총은 끝까지 성 안에 있다가 북쪽 문으로 물러났다.'},
  {id:'ZB2-03',fork:'zf2',title:'완성의 조인',foe:{name:'조인',unitClass:'spearman'},boss:true,reward:R(1000,'shop:barding:2',{rice:2}),
    intro:'번성이 떨어지자 조인이 완성에 들어앉았다. 이 성을 넘으면 허도로 가는 길이 보인다. 성 안 깊숙이 버티는 조인을 물리쳐라.',
    outro:'완성이 열렸다. 허도의 조조가 처음으로 남쪽 지도를 오래 보았다고 한다.'},
  {id:'ZB3-01',fork:'zf3',title:'한수의 둑',foe:{name:'서황',unitClass:'swordsman'},reward:R(800,'shop:bow:2',{water:2}),
    intro:'관우가 번성을 에워쌌다. 언성의 서황이 내려와 포위를 풀려 한다. 제갈량은 한수의 둑을 열어 서황의 길을 끊는다. 물이 들판을 쓸고 지나간 뒤, 서황을 물리쳐라.',
    outro:'서황이 물러났다. 그날 밤 맥성 쪽에서 빠져나온 요화가 촉군 진에 닿았다.'},
  {id:'ZB3-02',fork:'zf3',title:'강릉을 지켜라',foe:{name:'장흠',unitClass:'spearman'},reward:R(850,'shop:robe:2',{rice:2}),
    intro:'요화가 알렸다. "여몽의 군사가 흰옷을 입고 강을 건넜습니다. 강릉이 위태롭습니다." 오군보다 먼저 강릉 성채에 들어가 차지하라.',
    outro:'강릉 성채의 문이 닫혔다. 흰옷의 배들은 강가에서 머뭇거리다 물러났다.'},
  {id:'ZB3-03',fork:'zf3',title:'맥성의 새벽',foe:{name:'여몽',unitClass:'spearman'},boss:true,reward:R(1300,'shop:sword:3',{panacea:2}),
    intro:'맥성에 닿았다. 관우와 관평이 성 안에서 맞는다. 성을 둘러싼 오군의 우두머리는 여몽이다. 여몽을 꺾으면 포위가 풀린다. 관우를 잃어서는 안 된다.',
    outro:'포위가 풀리고 새벽이 왔다. 관우는 말없이 제갈량의 손을 잡았다가 놓았다.'},
  {id:'ZB4-01',fork:'zf4',title:'돌무더기 팔진',foe:{name:'주연',unitClass:'spearman'},reward:R(850,'shop:hood:2',{water:3}),
    intro:'이릉에서 이긴 육손의 선봉 주연이 어복포까지 쫓아왔다. 강가의 돌무더기가 진이 되어 길을 잃게 한다. 미로에 든 오군이 흔들릴 때 주연을 쳐라.',
    outro:'돌무더기 사이로 바람이 울었다. 길을 잃은 오군이 흩어지고, 강 북쪽에서 황권의 깃발이 보였다.'},
  {id:'ZB4-02',fork:'zf4',title:'강북의 길',foe:{name:'한당',unitClass:'infantry'},reward:R(900,'shop:gloves:2',{awaken:2}),
    intro:'강 북쪽에 남겨졌던 황권이 돌아왔다. 오군 한당이 강가 길의 동쪽 나루를 막고 있다. 조운이 먼저 동쪽 나루에 닿아 배를 붙잡아라.',
    outro:'조운이 배의 밧줄을 끊어 쥐었다. 황권이 강을 건너며 말했다. "다시 돌아올 줄은 몰랐습니다."'},
  {id:'ZB4-03',fork:'zf4',title:'이릉의 설욕',foe:{name:'육손',unitClass:'strategist'},boss:true,reward:R(1400,'shop:sacredSword:3',{wine:1}),
    intro:'오군이 흩어진 틈에 강을 거슬러 육손의 본진을 찾았다. 골짜기 끝에 육손이 진을 쳤다. 불로 이긴 자의 진을, 이번에는 우리가 꺾는다.',
    outro:'육손이 물러나며 화친의 글을 남겼다. 백제성의 유비는 그 글을 오래 들고 있었다.'},
  {id:'ZB5-01',fork:'zf5',title:'대래동의 맹우',foe:{name:'맹우',unitClass:'infantry'},reward:R(950,'shop:shield:2',{antidote:2}),
    intro:'마속의 말이 남았다. "성을 치는 것은 하책이요, 마음을 치는 것이 상책입니다." 맹획보다 먼저 그 아우 맹우를 꺾어 남만의 세 동을 흔든다.',
    outro:'맹우는 사로잡혔다가 술과 밥을 받고 풀려났다. 돌아가는 길에 관색이 남쪽 길에서 합류했다.'},
  {id:'ZB5-02',fork:'zf5',title:'축융의 비도',foe:{name:'축융',unitClass:'javelin'},reward:R(1000,'shop:spear:3',{bean:3}),
    intro:'아우가 돌아오자 맹획 대신 그 아내 축융이 비도를 들고 나섰다. 맹수를 앞세운 은갱동 어귀에서 축융을 물리쳐라.',
    outro:'축융의 비도가 땅에 꽂혔다. "남편보다 먼저 지는 것은 처음이오." 그녀도 풀려나 돌아갔다.'},
  {id:'ZB5-03',fork:'zf5',title:'일곱 번째 마음',foe:{name:'맹획',unitClass:'infantry'},boss:true,reward:R(1600,'shop:armor:3',{peach:1}),
    intro:'아우와 아내가 모두 촉군 진에서 돌아왔다. 맹획은 독룡동 깊은 동굴 앞에 마지막 군사를 모았다. 이번에 꺾으면, 그는 다시 일어나지 않겠다고 했다.',
    outro:'맹획이 무릎을 꿇었다. "승상은 하늘의 위엄을 가졌소. 남쪽 사람은 다시 배반하지 않겠소."'},
  {id:'ZB6-01',fork:'zf6',title:'길목에 친 진',foe:{name:'대릉',unitClass:'infantry'},reward:R(1300,'shop:fan:3',{water:3}),
    intro:'제갈량이 몸소 가정에 왔다. 마속은 산 위에 진을 치자 했으나, 왕평의 말대로 물이 있는 길목에 목책을 세웠다. 장합의 선봉이 온다. 일곱 턴을 버텨라.',
    outro:'목책은 무너지지 않았다. 마속이 왕평에게 고개를 숙였다. "산 위였다면, 우리는 목이 말라 죽었겠소."'},
  {id:'ZB6-02',fork:'zf6',title:'열류성의 고상',foe:{name:'곽회',unitClass:'archer'},reward:R(1400,'shop:helmet:3',{rice:3}),
    intro:'가정을 지키는 사이 곽회가 열류성을 에워쌌다. 성 안에는 고상이 버틴다. 성 앞 들판에 진을 친 곽회를 물리쳐 포위를 풀어라.',
    outro:'곽회가 물러나자 열류성의 문이 열렸다. 고상이 지친 군사를 이끌고 나와 합류했다.'},
  {id:'ZB6-03',fork:'zf6',title:'가정의 장합',foe:{name:'장합',unitClass:'cavalry'},boss:true,reward:R(2200,'shop:fan:4',{peach:1,wine:1}),
    intro:'길이 막힌 장합은 낙곡으로 돌아 들어가 촉군의 등을 노린다. 골짜기의 산채에 버틴 장합을 꺾으면 가정의 싸움이 끝난다.',
    outro:'장합이 물러났다. 첫 북벌의 깃발은 처음으로 장안 쪽을 향해 나아갔다.'},
];
export const branchNode=(id:string|undefined)=>BRANCH_NODES.find(n=>n.id===id);
export const forkOf=(id:string|undefined)=>ZHUGE_FORKS.find(f=>f.id===id||f.nodes.includes(id??''));
export const isZhugeBranch=(id:string|undefined)=>!!id&&/^ZB\d-\d\d$/.test(id);

/** 전투 중 대사(battle-lines.ts가 장 id로 찾는다). */
export const BRANCH_LINES:Record<string,BattleLine[]>={
  'ZB1-01':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'주공, 돌아보지 마십시오. 서쪽 단계 나루까지만 가시면 됩니다.'},
    {id:'open-2',when:{turn:1},speaker:'채모',text:'유비를 성 밖으로 내보내지 마라! 오늘 형주의 주인은 정해진다.'},
    {id:'chase',when:{turn:3},speaker:'장비',text:'뒤에서 기병이 또 온다! 형님은 앞만 보고 달리시오!'},
    {id:'cai',when:{retreat:'zb1_cai_mao'},speaker:'관우',text:'채모가 물러났다. 연회의 칼은 거기까지다.'},
  ],
  'ZB1-02':[
    {id:'open-1',when:{turn:1},speaker:'이적',text:'양양 안채만 쥐면 성 안의 군사는 따릅니다. 문빙은 고집 센 사람이나 의리를 압니다.'},
    {id:'open-2',when:{turn:2},speaker:'문빙',text:'누가 형주의 주인이든, 이 성문은 내 허락 없이 열리지 않는다.'},
    {id:'south',when:{turn:4},speaker:'조운',text:'남쪽 숲에서 채모의 군사가 나옵니다. 뒤를 맡겠습니다.'},
    {id:'wen',when:{retreat:'zb1_wen_pin'},speaker:'제갈량',text:'문빙이 물러났소. 안채로 들어가 깃발을 바꾸시오.'},
  ],
  'ZB1-03':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'채모는 강릉 안채에 있소. 수군이 뭍에서 싸우면 반은 이긴 것이오.'},
    {id:'open-2',when:{turn:2},speaker:'채모',text:'형주는 조승상께 바친다. 굴러온 유씨에게 줄 땅은 없다!'},
    {id:'west',when:{turn:3},speaker:'관우',text:'서쪽 길에서 채모의 친위가 옵니다. 등을 내주지 마시오.'},
    {id:'cai',when:{retreat:'zb1_cai_mao_boss'},speaker:'유비',text:'형주의 백성에게 알려라. 아무도 해치지 않는다.'},
  ],
  'ZB2-01':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'다리목만 쥐면 한수는 우리 것이오. 악진을 노리시오.'},
    {id:'open-2',when:{turn:1},speaker:'악진',text:'선봉은 언제나 나였다. 이 다리도 내가 지킨다!'},
    {id:'rear',when:{turn:5},speaker:'관평',text:'아버님, 북동쪽에서 악진의 원군 기병이 내려옵니다!'},
    {id:'yue',when:{retreat:'zb2_yue_jin'},speaker:'관우',text:'악진이 물러났다. 다리를 건너라.'},
  ],
  'ZB2-02':[
    {id:'open-1',when:{turn:1},speaker:'마량',text:'번성의 안채는 북쪽 성채 안입니다. 투석기를 먼저 치워야 성벽에 붙을 수 있습니다.'},
    {id:'open-2',when:{turn:2},speaker:'만총',text:'성은 사람이 지키는 것이다. 나는 이 자리를 떠나지 않는다.'},
    {id:'land',when:{turn:3},speaker:'장비',text:'강가로 위군 기병이 올라온다! 내가 막지!'},
    {id:'man',when:{retreat:'zb2_man_chong'},speaker:'제갈량',text:'만총이 물러났소. 안채를 차지하시오.'},
  ],
  'ZB2-03':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'조인은 지키는 싸움의 명수요. 서두르지 말고 성문을 먼저 여시오.'},
    {id:'open-2',when:{turn:2},speaker:'조인',text:'남군에서는 물러났으나, 완성은 한 걸음도 내주지 않는다.'},
    {id:'relief',when:{turn:3},speaker:'조운',text:'남쪽에서 완성의 구원군이 옵니다!'},
    {id:'hong',when:{retreat:'zb2_cao_hong'},speaker:'관우',text:'조홍이 물러났다. 안쪽으로 들어간다.'},
    {id:'ren',when:{retreat:'zb2_cao_ren'},speaker:'제갈량',text:'완성이 열렸소. 허도가 보이는구려.'},
  ],
  'ZB3-01':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'세 턴째에 둑을 엽니다. 그때까지 들판 가운데로 나서지 마시오.'},
    {id:'open-2',when:{turn:1},speaker:'서황',text:'관우의 포위를 풀러 왔다. 길을 막는 자는 누구든 벤다.'},
    {id:'flood',when:{lockedBy:'ZB3-01/flood'},speaker:'황충',text:'물이다! 들판의 위군이 휩쓸렸다. 지금 치자!'},
    {id:'xu',when:{retreat:'zb3_xu_huang'},speaker:'제갈량',text:'서황이 물러났소. 번성의 포위는 이어지오.'},
  ],
  'ZB3-02':[
    {id:'open-1',when:{turn:1},speaker:'요화',text:'성채 안에 이미 흰옷의 오군이 들었습니다. 서둘러야 합니다.'},
    {id:'open-2',when:{turn:2},speaker:'장흠',text:'장사꾼 옷을 벗을 때가 왔다. 강릉은 오의 것이다!'},
    {id:'boats',when:{turn:3},speaker:'위연',text:'강 가운데로 오군이 또 건너옵니다!'},
    {id:'jiang',when:{retreat:'zb3_jiang_qin'},speaker:'제갈량',text:'장흠이 물러났소. 성채를 차지하시오.'},
  ],
  'ZB3-03':[
    {id:'open-1',when:{turn:1},speaker:'관우',text:'공명, 이 늙은이를 구하러 여기까지 왔소?'},
    {id:'open-2',when:{turn:1},speaker:'제갈량',text:'형주는 장군 없이는 지킬 수 없습니다. 여몽만 꺾으면 길이 열립니다.'},
    {id:'zhu',when:{turn:3},speaker:'관평',text:'남쪽 길로 주연의 군사가 들어옵니다!'},
    {id:'pan',when:{retreat:'zb3_pan_zhang'},speaker:'관우',text:'반장이 물러났다. 이 칼은 아직 무디지 않다.'},
    {id:'lu',when:{retreat:'zb3_lu_meng'},speaker:'제갈량',text:'여몽이 물러났소. 형주로 돌아갑시다.'},
  ],
  'ZB4-01':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'저 돌무더기는 그저 돌이 아니오. 다음 턴이면 오군이 길을 잃을 것이오.'},
    {id:'open-2',when:{turn:1},speaker:'주연',text:'돌무더기 따위가 무슨 진이냐. 밀고 들어가라!'},
    {id:'maze',when:{lockedBy:'ZB4-01/maze'},speaker:'관흥',text:'오군이 제 편끼리 부딪칩니다! 지금입니다!'},
    {id:'zhu',when:{retreat:'zb4_zhu_ran'},speaker:'조운',text:'주연이 물러났습니다. 선봉이 무너졌습니다.'},
  ],
  'ZB4-02':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'자룡, 동쪽 나루로. 배만 붙잡으면 모두 건널 수 있소.'},
    {id:'open-2',when:{turn:1},speaker:'황권',text:'다시 이 강을 건널 날이 올 줄 몰랐습니다.'},
    {id:'han',when:{turn:2},speaker:'한당',text:'나루를 내주지 마라. 촉군을 강가에 묶어 둔다!'},
    {id:'more',when:{turn:3},speaker:'장포',text:'나루 쪽에서 오군 원군이 나옵니다. 제가 길을 열겠습니다!'},
  ],
  'ZB4-03':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'육손은 불을 쓰는 자요. 숲 가까이 진을 모으지 마시오.'},
    {id:'open-2',when:{turn:2},speaker:'육손',text:'와룡이 직접 왔구나. 이번에는 바람이 누구 편인지 보자.'},
    {id:'front',when:{turn:3},speaker:'이엄',text:'골짜기 앞쪽에서 오군 기병이 나옵니다!'},
    {id:'lu',when:{retreat:'zb4_lu_xun'},speaker:'제갈량',text:'이릉의 빚은 여기서 갚았소.'},
  ],
  'ZB5-01':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'맹우를 베지는 마시오. 사로잡아 돌려보내는 것이 이번 싸움이오.'},
    {id:'open-2',when:{turn:2},speaker:'맹우',text:'형님을 두 번이나 놓아 주었다고? 이번엔 우리가 너희를 놓아 주지 않는다!'},
    {id:'wood',when:{turn:3},speaker:'왕평',text:'남쪽 숲에서 만병이 나옵니다!'},
    {id:'meng',when:{retreat:'zb5_meng_you'},speaker:'제갈량',text:'맹우를 정중히 모시시오. 술과 밥을 내어 주시오.'},
  ],
  'ZB5-02':[
    {id:'open-1',when:{turn:1},speaker:'관색',text:'승상, 축융의 비도는 멀리서도 날아옵니다. 방패를 앞세우십시오.'},
    {id:'open-2',when:{turn:2},speaker:'축융',text:'사내들이 못 하는 일이면 내가 한다. 맹수들아, 나가라!'},
    {id:'north',when:{turn:3},speaker:'마대',text:'북쪽 숲에서 맹수가 또 나옵니다!'},
    {id:'zhu',when:{retreat:'zb5_zhu_rong'},speaker:'제갈량',text:'축융 부인도 돌려보내시오. 남편에게 우리의 뜻을 전할 것이오.'},
  ],
  'ZB5-03':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'맹획은 동굴 앞에 있소. 이번이 마지막이 되게 합시다.'},
    {id:'open-2',when:{turn:2},speaker:'맹획',text:'아우도 아내도 돌려보냈다고? 그래도 나는 아직 지지 않았다!'},
    {id:'raid',when:{turn:3},speaker:'위연',text:'남쪽으로 만병 기마가 돌아 들어옵니다!'},
    {id:'meng',when:{retreat:'zb5_meng_huo'},speaker:'맹획',text:'…졌소. 이번에는 몸이 아니라 마음이 졌소.'},
  ],
  'ZB6-01':[
    {id:'open-1',when:{turn:1},speaker:'왕평',text:'물길 곁 길목입니다. 일곱 턴만 버티면 장합도 물러납니다.'},
    {id:'open-2',when:{turn:1},speaker:'마속',text:'승상, 산 위가 아니어도… 이 길목이라면 지킬 수 있겠습니다.'},
    {id:'west',when:{turn:2},speaker:'강유',text:'서쪽 길로도 위군이 들어옵니다!'},
    {id:'second',when:{turn:4},speaker:'위연',text:'장합의 둘째 진이 온다. 여기서 밀리면 끝이다!'},
    {id:'dai',when:{retreat:'zb6_dai_ling'},speaker:'제갈량',text:'대릉이 물러났소. 선봉의 기세가 꺾였소.'},
  ],
  'ZB6-02':[
    {id:'open-1',when:{turn:1},speaker:'제갈량',text:'곽회는 들판 가운데에 있소. 언덕의 궁병을 먼저 조심하시오.'},
    {id:'open-2',when:{turn:2},speaker:'곽회',text:'성 안의 고상은 오래 못 버틴다. 구원군만 막으면 된다.'},
    {id:'side',when:{turn:3},speaker:'마대',text:'샛길로 위군 기병이 돌아옵니다!'},
    {id:'guo',when:{retreat:'zb6_guo_huai'},speaker:'제갈량',text:'곽회가 물러났소. 열류성에 알리시오.'},
  ],
  'ZB6-03':[
    {id:'open-1',when:{turn:1},speaker:'고상',text:'승상, 열류성의 은혜를 이 골짜기에서 갚겠습니다.'},
    {id:'open-2',when:{turn:2},speaker:'장합',text:'가정의 길목을 막았다고 끝난 줄 아느냐. 골짜기는 내가 더 잘 안다.'},
    {id:'rear',when:{turn:3},speaker:'강유',text:'뒤로 돌아온 위군입니다! 진을 돌리십시오!'},
    {id:'zhang',when:{retreat:'zb6_zhang_he'},speaker:'제갈량',text:'장합이 물러났소. 이제 북쪽으로 갑시다.'},
  ],
};

/** 장 묶음 형식(zhuge/types.ts): 장·규칙·레벨. 레벨은 갈림 장 기본 레벨에서 칸마다 +1, 우두머리 +2(사마의전 branchLevel과 같다). */
const batch:ZhugeBatch={
  chapters:[
    {stage:zb101 as StageDef,map:xinyeMap as MapFile,year:'건안 12년 · 207년 · 양양',label:'가상 · 탈출',quote:'형주를 쥐려면, 먼저 살아서 성을 나가야 한다.'},
    {stage:zb102 as StageDef,map:xiangyangMap as MapFile,year:'건안 12년 · 207년 · 양양',label:'가상 · 점령',quote:'성문은 칼보다 사람이 연다.'},
    {stage:zb103 as StageDef,map:nanjunMap as MapFile,year:'건안 13년 · 208년 · 강릉',label:'가상 · 우두머리',quote:'항복 문서가 떠나기 전에.'},
    {stage:zb201 as StageDef,map:hanshuiBridgeMap as MapFile,year:'건안 14년 · 209년 · 한수',label:'가상 · 격퇴',quote:'다리목을 쥐는 자가 강을 쥔다.'},
    {stage:zb202 as StageDef,map:fanchengMap as MapFile,year:'건안 14년 · 209년 · 번성',label:'가상 · 점령',quote:'투석기부터, 그다음이 성벽이다.'},
    {stage:zb203 as StageDef,map:xinchengMap as MapFile,year:'건안 15년 · 210년 · 완성',label:'가상 · 우두머리',quote:'지키는 싸움의 명수를, 성째로 연다.'},
    {stage:zb301 as StageDef,map:hanshuiFloodMap as MapFile,year:'건안 24년 · 219년 · 한수',label:'가상 · 격퇴',quote:'물은 길을 막고, 길이 막힌 자는 서두른다.'},
    {stage:zb302 as StageDef,map:chengguMap as MapFile,year:'건안 24년 · 219년 · 강릉',label:'가상 · 점령',quote:'흰옷의 배보다 한 걸음 먼저.'},
    {stage:zb303 as StageDef,map:wuweiMap as MapFile,year:'건안 24년 · 219년 겨울 · 맥성',label:'가상 · 우두머리',quote:'작은 성 안에 큰 사람이 있다.'},
    {stage:zb401 as StageDef,map:mumenMap as MapFile,year:'장무 2년 · 222년 · 어복포',label:'가상 · 격퇴',quote:'돌은 움직이지 않는다. 길을 잃는 것은 사람이다.'},
    {stage:zb402 as StageDef,map:nananMap as MapFile,year:'장무 2년 · 222년 · 강북',label:'가상 · 도달',quote:'남겨진 사람을 데려오는 것도 싸움이다.'},
    {stage:zb403 as StageDef,map:shitingMap as MapFile,year:'장무 2년 · 222년 · 협석',label:'가상 · 우두머리',quote:'불로 이긴 자의 진을, 바람 없이 꺾는다.'},
    {stage:zb501 as StageDef,map:mansongMap as MapFile,year:'건흥 3년 · 225년 · 대래동',label:'가상 · 격퇴',quote:'마음을 치려면 곁의 사람부터.'},
    {stage:zb502 as StageDef,map:yinkengMap as MapFile,year:'건흥 3년 · 225년 · 은갱동',label:'가상 · 격퇴',quote:'비도는 멀리서 오고, 맹수는 가까이서 온다.'},
    {stage:zb503 as StageDef,map:dulongMap as MapFile,year:'건흥 3년 · 225년 · 독룡동',label:'가상 · 우두머리',quote:'일곱 번째에는 몸이 아니라 마음이 진다.'},
    {stage:zb601 as StageDef,map:jietingMap as MapFile,year:'건흥 6년 · 228년 · 가정',label:'가상 · 버티기',quote:'산이 아니라 물 곁의 길목에.'},
    {stage:zb602 as StageDef,map:bajunMap as MapFile,year:'건흥 6년 · 228년 · 열류성',label:'가상 · 격퇴',quote:'에워싼 자를 에워싼다.'},
    {stage:zb603 as StageDef,map:luoguMap as MapFile,year:'건흥 6년 · 228년 · 낙곡',label:'가상 · 우두머리',quote:'골짜기를 더 잘 아는 자가 이긴다.'},
  ],
  rules:{
    'ZB1-01':{foeEdge:{normal:-15},sealNames:['단계 도착','채모 격퇴','빠른 탈출'],weather:'봄 · 연회 날의 맑은 하늘',labels:[{region:'west_road',text:'단계 나루'},{region:'town',text:'양양 연회장'}]},
    'ZB1-02':{foeEdge:{normal:-10},medicine:3,sealNames:['양양 안채 점령','문빙 격퇴','빠른 점령'],weather:'봄 · 한수의 강바람',labels:[{region:'xiangyang',text:'양양 안채'}],zones:[{region:'xiangyang',color:0xffd27a}]},
    'ZB1-03':{sealNames:['채모 격퇴','빠른 결전','부대 보존'],weather:'가을 · 강릉의 강안개',tough:[{unit:'zb1_cai_mao_boss',hpScale:1.8,defense:2}],labels:[{region:'nanjun_keep',text:'강릉 안채'}]},
    'ZB2-01':{foeEdge:{normal:-10},medicine:3,sealNames:['악진 격퇴','부대 보존','빠른 도하'],tough:[{unit:'zb2_yue_jin',hpScale:1.6,defense:2}],phase:({state})=>state.firedEvents.has('ZB2-01/pontoon')?undefined:'공병이 부교를 놓는 중 · 2턴에 다리가 선다',weather:'초봄 · 녹은 물이 흐르는 한수',labels:[{region:'bridge_bank',text:'다리목'}]},
    'ZB2-02':{foeEdge:{normal:-22},sealNames:['번성 안채 점령','만총 격퇴','빠른 점령'],weather:'봄 · 흙바람',labels:[{region:'keep',text:'번성 안채'},{region:'landing',text:'강가 나루'}],zones:[{region:'keep',color:0xffd27a}]},
    'ZB2-03':{foeEdge:{normal:-12},sealNames:['조인 격퇴','조홍 격퇴','빠른 공성'],weather:'여름 · 뙤약볕',tough:[{unit:'zb2_cao_ren',hpScale:2,defense:3}],labels:[{region:'objective',text:'완성 안채'}]},
    'ZB3-01':{sealNames:['서황 격퇴','부대 보존','빠른 격퇴'],weather:'가을 · 불어난 한수',labels:[{region:'flood_3',text:'둑 아래 들판'}],
      phase:({state})=>state.firedEvents.has('ZB3-01/flood')?undefined:`3턴에 둑을 연다 · 지금 ${state.turn}턴`},
    'ZB3-02':{sealNames:['강릉 성채 점령','장흠 격퇴','빠른 점령'],weather:'겨울 · 강 위의 흰 돛',labels:[{region:'objective',text:'강릉 성채'}],zones:[{region:'objective',color:0xffd27a}]},
    'ZB3-03':{sealNames:['여몽 격퇴','반장 격퇴','부대 보존'],weather:'겨울 새벽 · 서리',tough:[{unit:'zb3_lu_meng',hpScale:1.8,defense:3}],labels:[{region:'citadel',text:'맥성'}],
      failure:({state})=>state.find('z_guan_yu')?.alive===false?'관우가 퇴각했습니다.':undefined},
    'ZB4-01':{sealNames:['주연 격퇴','부대 보존','빠른 격퇴'],tough:[{unit:'zb4_zhu_ran',hpScale:1.6,defense:2}],weather:'여름 · 돌무더기를 스치는 바람',labels:[{region:'join',text:'돌무더기 진'},{region:'gorge_mouth',text:'주연의 진'}],
      phase:({state})=>state.firedEvents.has('ZB4-01/maze')?undefined:'2턴에 돌무더기 진이 움직인다'},
    'ZB4-02':{sealNames:['동쪽 나루 도착','한당 격퇴','빠른 도하'],weather:'여름 · 탁한 장강',labels:[{region:'exit',text:'동쪽 나루'},{region:'rebel_east',text:'한당의 진'}],
      failure:({state})=>state.find('z_zhao_yun')?.alive===false?'조운이 퇴각했습니다.':undefined},
    'ZB4-03':{foeEdge:{normal:-12},sealNames:['육손 격퇴','부대 보존','빠른 격퇴'],weather:'가을 · 골짜기의 마른 바람',tough:[{unit:'zb4_lu_xun',hpScale:2,defense:3}],labels:[{region:'objective',text:'육손의 진'}]},
    'ZB5-01':{sealNames:['맹우 격퇴','부대 보존','빠른 격퇴'],tough:[{unit:'zb5_meng_you',hpScale:1.6,defense:2}],weather:'여름 · 무더운 남만의 숲',labels:[{region:'meng_camp',text:'대래동'}]},
    'ZB5-02':{sealNames:['축융 격퇴','부대 보존','빠른 격퇴'],weather:'여름 · 장기가 낀 골짜기',labels:[{region:'fort',text:'은갱동 어귀'}]},
    'ZB5-03':{sealNames:['맹획 격퇴','부대 보존','빠른 격퇴'],weather:'여름 · 독한 안개',tough:[{unit:'zb5_meng_huo',hpScale:2.2,defense:3}],labels:[{region:'cave',text:'독룡동'}]},
    'ZB6-01':{sealNames:['길목 사수','대릉 격퇴','부대 보존'],weather:'봄 · 가정의 마른 바람',labels:[{region:'player_start',text:'길목의 목책'}],
      phase:({state})=>`길목을 지켜라 · ${Math.max(0,8-state.turn)}턴 남음`,
      failure:({state})=>state.find('z_ma_su')?.alive===false?'마속이 퇴각했습니다.':undefined},
    'ZB6-02':{sealNames:['곽회 격퇴','부대 보존','빠른 구원'],tough:[{unit:'zb6_guo_huai',hpScale:1.8,defense:3}],weather:'봄 · 열류성의 흙먼지',labels:[{region:'keep',text:'열류성'},{region:'field',text:'곽회의 진'}]},
    'ZB6-03':{foeEdge:{normal:-8},sealNames:['장합 격퇴','부대 보존','빠른 격퇴'],weather:'봄 · 골짜기의 그늘',tough:[{unit:'zb6_zhang_he',hpScale:3,defense:8}],labels:[{region:'shu_fort',text:'낙곡 산채'},{region:'advance_point',text:'장합의 진'}]},
  },
  levels:{
    'ZB1-01':5,'ZB1-02':6,'ZB1-03':8,
    'ZB2-01':10,'ZB2-02':11,'ZB2-03':13,
    'ZB3-01':15,'ZB3-02':16,'ZB3-03':18,
    'ZB4-01':16,'ZB4-02':17,'ZB4-03':19,
    'ZB5-01':18,'ZB5-02':19,'ZB5-03':21,
    'ZB6-01':26,'ZB6-02':27,'ZB6-03':29,
  },
};
export default batch;
