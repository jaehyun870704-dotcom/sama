/**
 * 고유 보물 50점의 글(설명)과 얻는 곳, 상점 장비 종류·소모품의 글.
 *
 * 종류·등급·능력·고유 기능은 core equipment.ts가 정한다. 여기는 화면에 보일 글과 획득처만 둔다.
 * 얻는 곳은 두 이야기에 하나씩: s는 사마의전(연의 장 또는 연무장 외전), z는 제갈량전의 장.
 * 설명문은 이 게임이 새로 썼다(원작·위키 문장을 옮기지 않는다).
 */
export interface NamedEntry {readonly s:string;readonly z:string;readonly description:string}
export const NAMED_ENTRIES:Readonly<Record<string,NamedEntry>>={
  doubleSwords:{s:'S2-04',z:'Z2-17',description:'암수 한 쌍으로 벼린 두 자루 칼. 한 손이 막히면 다른 손이 곧장 되받아친다.'},
  qinggang:{s:'S1-08',z:'Z1-05',description:'푸른 기운이 서린 칼날. 말 탄 적의 갑옷 이음매를 노리는 데 쓰였다고 한다.'},
  yitian:{s:'S1-06',z:'Z1-08',description:'하늘에 기댄다는 이름의 명검. 칼끝이 먼저 움직여 쥔 이의 몸을 비켜 세운다.'},
  ancientBlade:{s:'S1-11',z:'Z1-09',description:'오래 전해 내려온 강동의 칼. 가볍게 손에 감겨 휘두르는 몸놀림이 빨라진다.'},
  greenDragon:{s:'S1-06',z:'Z1-07',description:'용의 머리를 새긴 긴 칼. 한 번 내리치면 상대가 칼을 되돌릴 틈이 없다.'},
  serpentSpear:{s:'S1-03',z:'Z1-05',description:'뱀처럼 굽은 날을 단 긴 창. 앞의 적을 꿰뚫고 뒤의 적까지 닿는다.'},
  halberd:{s:'S1-04',z:'Z2-16',description:'초승달 날을 양쪽에 단 극. 하나를 쓰러뜨린 기세로 곁의 적을 다시 휩쓴다.'},
  lubuBow:{s:'S1-04',z:'Z1-12',description:'먼 과녁도 꿰었다는 장수의 활. 맞은 자는 다리가 굳어 한동안 움직이지 못한다.'},
  hornBowSmall:{s:'S2-03',z:'Z1-10',description:'바위에 화살이 박혔다는 옛 명궁의 활. 맞은 자는 정신이 흩어져 술법을 펴지 못한다.'},
  meteorHammer:{s:'Q03',z:'Z2-01',description:'쇠사슬 끝에 쇠망치를 단 무기. 머리를 울려 상대를 어지럽게 만든다.'},
  twinWhips:{s:'S2-11',z:'Z2-02',description:'양손에 하나씩 쥐는 마디 쇠채찍. 막아 낸 공격을 곧바로 되돌려 준다.'},
  goldFireCannon:{s:'S2-09',z:'Z2-05',description:'불붙인 쇠단지를 날려 보내는 투석기. 맞은 자리에 독한 연기가 오래 남는다.'},
  plantainFan:{s:'S2-02',z:'Z1-06',description:'커다란 잎으로 엮은 부채. 부칠 때마다 바람의 술법이 한층 거세진다.'},
  fiveFireFan:{s:'S2-10',z:'Z1-03',description:'다섯 빛깔 불꽃을 수놓은 부채. 불의 술법을 더 뜨겁게 만든다.'},
  fan:{s:'S1-05',z:'Z1-02',description:'흰 깃털로 엮은 부채. 술법을 펼 때 드는 기운을 절반으로 아껴 준다.'},
  sevenstar:{s:'S1-02',z:'Z1-06',description:'일곱 별을 새긴 보검. 별자리를 따라 겨누면 술법이 빗나가지 않는다.'},
  sageSword:{s:'Q10',z:'Z2-03',description:'성인이 지녔다는 보검. 지닌 이의 술법 기운을 크게 북돋운다.'},
  mirrorArmor:{s:'S3-02',z:'Z2-12',description:'가슴과 등에 둥근 거울을 단 갑옷. 먼 데서 날아오는 화살과 돌을 모두 비껴 낸다.'},
  goldArmor:{s:'S1-10',z:'Z1-09',description:'금빛 미늘로 짠 갑옷. 급소를 노린 일격도 미끄러져 큰 상처가 되지 않는다.'},
  linkedArmor:{s:'S2-01',z:'Z1-11',description:'쇠고리를 촘촘히 이어 엮은 갑옷. 잇따라 들어오는 두 번째 칼날을 걸러 낸다.'},
  silverarmor:{s:'S1-07',z:'Z2-07',description:'은으로 테를 두른 갑옷. 술법의 기운을 흩어 받는 해를 절반으로 줄인다.'},
  dragonArmor:{s:'S3-06',z:'Z2-18',description:'용의 비늘을 본떠 짠 갑옷. 몸에 닿는 칼날을 기운으로 받아 내 살을 지킨다.'},
  dragonGi:{s:'S3-05',z:'Z2-09',description:'날아오르는 용을 수놓은 무도가의 옷. 몸이 가벼워져 움직임이 빨라진다.'},
  craneRobe:{s:'S2-07',z:'Z1-02',description:'학의 깃을 엮은 옷. 마음이 차분해져 술법에 쉽게 흔들리지 않는다.'},
  darkRobe:{s:'Q08',z:'Z2-01',description:'칠흑빛 도사의 옷. 술법의 기운을 품어 오래 쓸 수 있게 한다.'},
  phoenixRobe:{s:'S2-13',z:'Z1-14',description:'봉황의 깃으로 지었다는 옷. 입은 이의 상처가 차례마다 아문다.'},
  silverShield:{s:'S3-03',z:'Z2-06',description:'은을 입힌 방패. 술법을 비껴 내지만 아군이 건네는 기운도 가끔 튕겨 낸다.'},
  windGodShield:{s:'S2-12',z:'Z2-14',description:'바람신을 새긴 큰 방패. 칼도 술법도 바람처럼 흘려보낸다.'},
  windWheel:{s:'S3-04',z:'Z2-15',description:'바람처럼 구른다는 바퀴. 투석기와 수레를 험한 길에서도 멀리 끌고 간다.'},
  yellowHorse:{s:'S3-01',z:'Z1-11',description:'누런 털의 날랜 말. 하루에 남보다 두 걸음 더 간다.'},
  shadowHorse:{s:'S1-09',z:'Z1-07',description:'그림자도 따라잡지 못한다는 말. 한 걸음 더 멀리 달린다.'},
  redHare:{s:'S1-08',z:'Z2-11',description:'붉은 털의 천리마. 적진 한가운데를 가로질러 달려도 멈춰 서지 않는다.'},
  dilu:{s:'S1-03',z:'Z1-04',description:'이마에 흰 점이 있는 말. 물길도 벼랑길도 평지처럼 건넌다.'},
  ironHelm:{s:'Q01',z:'Z2-04',description:'쇠를 두들겨 만든 보병의 투구. 머리 위로 떨어지는 칼을 받아 내 오래 버티게 한다.'},
  zhugeTurban:{s:'S2-14',z:'Z2-19',description:'군막의 책사가 즐겨 쓰던 비단 두건. 술법의 기운을 넉넉히 채워 준다.'},
  noFeatherDart:{s:'S3-07',z:'Z2-08',description:'깃 없는 화살이라 불린 돌팔매. 두 칸 밖의 적에게도 돌을 날린다.'},
  sunzi:{s:'S2-08',z:'Z1-12',description:'싸움의 이치를 적은 병법서. 펴 둘 때마다 깨우침이 쌓인다.'},
  mengde:{s:'S1-04',z:'Z2-10',description:'용병의 요점을 추려 적은 병서. 싸움에서 얻는 배움과 손에 익는 장비의 길이 넓어진다.'},
  qingshu:{s:'Q09',z:'Z1-15',description:'의원이 남긴 치료의 책. 곁에 두면 상처가 차례마다 아문다.'},
  taiping:{s:'S1-01',z:'Z1-01',description:'맑은 기운을 기르는 법을 적은 책. 몸에 든 나쁜 기운을 차례마다 씻어 낸다.'},
  taipingYaoshu:{s:'Q05',z:'Z2-03',description:'바람과 비를 부르는 술법을 적은 책. 술법의 기운이 차례마다 샘처럼 솟는다.'},
  dunjia:{s:'S1-05',z:'Z1-14',description:'몸을 숨기고 남의 술법을 빌리는 법을 적은 책. 곁에 선 이의 술법을 흉내 낼 수 있다.'},
  sixTeachings:{s:'S2-05',z:'Z1-08',description:'군을 다스리는 여섯 가르침. 곁에 두면 무기 다루는 솜씨가 날마다 는다.'},
  threeStrategies:{s:'S2-06',z:'Z1-13',description:'세 갈래의 계략을 적은 책. 곁에 두면 갑옷을 다루는 요령이 날마다 는다.'},
  beanBag:{s:'Q02',z:'Z1-01',description:'볶은 콩을 담아 허리에 차는 주머니. 다치면 저절로 콩을 꺼내 먹는다.'},
  seal:{s:'S1-07',z:'Z1-13',description:'나라의 주인을 증명한다는 도장. 지닌 이의 일격에 모두가 몸을 움츠린다.'},
  azureJewel:{s:'C06',z:'Z2-09',description:'동쪽을 지키는 청룡의 구슬. 비구름을 불러 벼락을 떨어뜨리는 술법을 연다.'},
  vermilionJewel:{s:'C07',z:'Z2-05',description:'남쪽을 지키는 주작의 구슬. 하늘에서 불의 새가 내려앉는 술법을 연다.'},
  blackTortoiseJewel:{s:'C08',z:'Z2-13',description:'북쪽을 지키는 현무의 구슬. 전장 모든 이의 기세를 뒤흔드는 술법을 연다.'},
  whiteTigerJewel:{s:'C09',z:'Z2-04',description:'서쪽을 지키는 백호의 구슬. 아군 모두의 상처와 나쁜 기운을 씻는 술법을 연다.'},
};
/** 상점 장비 종류의 한 줄 글(무엇이 오르는가). */
export const SHOP_KIND_TEXT:Readonly<Record<string,string>>={
  sword:'흔한 군용 칼. 공격이 오른다.',spear:'기병과 창병의 긴 창. 같은 등급 검보다 공격이 조금 더 오른다.',bow:'궁병의 활. 공격이 오른다(검보다 조금 낮다).',
  club:'무도가·무희가 쓰는 곤봉. 공격이 오른다(검보다 조금 낮다).',catapult:'포차에 얹는 투석 장치. 공격이 오른다.',
  fan:'책사의 부채. 책략력이 오른다.',sacredSword:'도사·풍수사의 보검. 책략력이 오른다(부채보다 조금 낮다).',
  armor:'쇠와 가죽으로 짠 갑옷. 방어가 오른다.',robe:'가볍게 입는 옷. 방어가 오른다(갑옷보다 낮다).',
  shield:'팔에 거는 방패. 물리 공격을 더 잘 피한다.',helmet:'갑옷 입는 장수의 투구. 최대 체력이 오른다.',hood:'옷 입는 장수의 두건. 최대 MP가 오른다.',
  gloves:'손을 감싸는 장갑. 물리 공격 명중이 오른다.',barding:'말에 입히는 갑옷. 화살·돌 같은 간접 공격의 피해를 줄인다.',
};
/** 소모품 한 줄 글. */
export const CONSUMABLE_TEXT:Readonly<Record<string,string>>={
  bean:'체력을 40 회복한다.',rice:'체력을 100 회복한다.',peach:'체력을 모두 회복한다. 상점에서 팔지 않는다.',
  water:'MP를 20 회복한다.',wine:'MP를 50 회복한다. 상점에서 팔지 않는다.',antidote:'독(출혈)을 푼다.',
  awaken:'혼란을 푼다. 혼란에 빠진 장수는 스스로 쓰지 못하니 곁의 아군이 먹여 준다.',salve:'부동·포박을 푼다.',gargle:'책략 봉인을 푼다.',
  panacea:'나쁜 상태를 모두 푼다.',promotion:'병종을 한 단계 올리고 체력·MP를 모두 채운다.',
};
