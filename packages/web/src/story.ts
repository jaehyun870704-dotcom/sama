export interface StoryBeat {speaker:string;line:string;pose:'enter'|'speak'|'resolve';actor:number}
export function storyBackdrop(index:number){
  if(!Number.isInteger(index)||index<0||index>17)throw new Error('Unknown story backdrop');
  // Measured panel boundaries, inset two pixels to exclude adjacent artwork.
  const edges=index<9?[0,340,681,1024]:[0,340,665,1024],row=Math.floor(index%9/3);
  const x=index%3*512+2,y=edges[row]!+2,w=508,h=edges[row+1]!-edges[row]!-4;
  return `background-image:url('/story-backgrounds-${index<9?1:2}.png');background-size:${1536/w*100}% ${1024/h*100}%;background-position:${x/(1536-w)*100}% ${y/(1024-h)*100}%`;
}
/** Atlas cell + narrative location per beat, independent of saved chapter indexes. */
export const storyLocations:Record<string,Array<{art:number;name:string;companion:string;actor?:number}>>={
  'S1-07':[
    {art:14,name:'출정 전 · 조비의 군막',companion:'조비',actor:0},
    {art:6,name:'본영 · 출정의 아침',companion:'조비',actor:0},
    {art:11,name:'한중 가도 · 숲길의 분기',companion:'조진',actor:3},
    {art:3,name:'한중 가도 · 산등성이 정찰',companion:'조진',actor:3},
    {art:17,name:'한중 · 전초 진지 너머',companion:'조진',actor:3},
    {art:6,name:'선봉 군영 · 출진 명령',companion:'조진',actor:3},
  ],
  'S1-01':[{art:0,name:'하내 · 사마가의 뜰',companion:'사마방'},{art:9,name:'하내 · 무기 창고',companion:'사마랑'},{art:10,name:'하내 · 저택 동문',companion:'사마랑'}],
  'S1-02':[{art:1,name:'낙양 · 불타는 대로',companion:'사마랑'},{art:0,name:'낙양 · 피난길의 빈 저택',companion:'사마랑'},{art:2,name:'낙양 · 남문 집결지',companion:'사마랑'}],
  'S1-03':[{art:11,name:'육혼산 · 갈림길',companion:'사마랑'},{art:4,name:'육혼산 · 계곡 정찰',companion:'사마랑'},{art:3,name:'육혼산 · 고갯길',companion:'사마랑'}],
  'S1-04':[{art:12,name:'사마가 · 출사 전야의 서재',companion:'꿈속의 그림자'},{art:5,name:'흉몽 · 낯선 대전',companion:'꿈속의 목소리'},{art:13,name:'흉몽 · 끝없는 회랑',companion:'꿈속의 그림자'}],
  'S1-05':[{art:16,name:'장강 · 수송대 집결지',companion:'조진'},{art:7,name:'장강 · 퇴각로 정찰',companion:'조진'},{art:15,name:'장강 · 교량 앞',companion:'조진'}],
  'S1-06':[{art:8,name:'동관 · 관문 앞',companion:'조진'},{art:16,name:'동관 · 승상 군영 후방',companion:'조진'},{art:14,name:'동관 · 출진 군의',companion:'허저'}],
  'S1-08':[{art:14,name:'한중 · 본대 군막',companion:'조진'},{art:17,name:'한중 · 성채 정찰',companion:'조진'},{art:4,name:'한중 · 교량 접근로',companion:'조진'}],
};
export const storyBeats:Record<string,StoryBeat[]>={
  'S1-07':[
    {speaker:'조비',line:'아버지께서는 한중으로 향하신다. 사람들은 공을 세우라 하지만, 나는 내 곁에 남을 사람이 누구인지 먼저 알고 싶다.',pose:'enter',actor:0},
    {speaker:'사마의',line:'마음을 말로 칠할 수는 없습니다. 맡기신 병사들을 돌려보내는 것으로 제 뜻을 보이겠습니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'양앙의 수비대가 산길을 세 겹으로 막았다. 큰길은 기병이 빠르지만, 굽이마다 창병이 기다린다.',pose:'enter',actor:3},
    {speaker:'사마의',line:'보병과 노병을 숲길에 붙이십시오. 제가 사격대를 견제하면 기병은 열린 길로 돌아가면 됩니다. 풍수사는 두 부대 사이에 두십시오.',pose:'speak',actor:4},
    {speaker:'조진',line:'전초 진지 뒤가 한중의 성채다. 오늘은 남겨 둔 적 없이 길부터 확보하자. 다음 싸움의 보급로가 될 것이다.',pose:'speak',actor:3},
    {speaker:'사마의',line:'사람을 잃고 얻은 길은 오래 지킬 수 없습니다. 부대를 나누되 서로 도울 거리는 남기십시오. 진군합니다.',pose:'resolve',actor:4},
  ],
  'S1-01':[
    {speaker:'사마방',line:'북문은 내가 지키마. 중달아, 먼저 사람들을 창고로 데려가거라.',pose:'enter',actor:1},
    {speaker:'소년 사마의',line:'제 손으로 칼을 들 수 없다면… 모두가 스스로를 지키게 하겠습니다.',pose:'speak',actor:4},
    {speaker:'사마랑',line:'내가 앞을 막겠다. 내 뒤에서 움직여라. 우리 셋 모두 살아남아야 한다.',pose:'resolve',actor:0},
  ],
  'S1-02':[
    {speaker:'사마랑',line:'도읍을 버린 사람들이 성문으로 몰리고 있다. 우리에게 남은 돈은 삼천 전이다.',pose:'enter',actor:0},
    {speaker:'사마의',line:'순찰병을 피하겠습니다. 돈을 써야 한다면 문을 열 값부터 남겨야 합니다.',pose:'speak',actor:4},
    {speaker:'사마랑',line:'남문에서 다시 만나자. 둘 중 하나만 나가서는 의미가 없다.',pose:'resolve',actor:0},
  ],
  'S1-03':[
    {speaker:'사마랑',line:'말발굽 소리가 가까워진다. 고개로 갈 것이냐, 계곡으로 갈 것이냐?',pose:'enter',actor:0},
    {speaker:'사마의',line:'길을 아는 이의 말을 먼저 듣겠습니다. 빠른 길이 늘 안전한 길은 아닙니다.',pose:'speak',actor:4},
    {speaker:'사마랑',line:'네 판단을 믿는다. 이번에는 내가 네 뒤를 지키마.',pose:'resolve',actor:0},
  ],
  'S1-04':[
    {speaker:'사마의',line:'조정의 부름이라… 내 재주를 보이기 전에, 누구를 위해 쓸지부터 알아야 한다.',pose:'enter',actor:4},
    {speaker:'꿈속의 목소리',line:'진궁의 뜻, 여포의 힘, 주유의 지혜. 그 끝에서 기다리는 것은 누구인가?',pose:'speak',actor:1},
    {speaker:'사마의',line:'꿈이라 해도 피하지 않겠다. 내 발로 끝까지 가 보겠다.',pose:'resolve',actor:4},
  ],
  'S1-06':[
    {speaker:'조진',line:'동관의 마초가 진로를 막았다. 포차를 관문 앞으로 옮기면 길을 열 수 있다.',pose:'enter',actor:3},
    {speaker:'사마의',line:'뒤쪽 먼지도 보십시오. 기병이 우리 군영을 돌아옵니다. 승상 곁의 방패를 모두 빼서는 안 됩니다.',pose:'speak',actor:4},
    {speaker:'허저',line:'내 자리는 명령대로 정하겠다. 대신 내가 떠난 곳은 누가 지킬지 먼저 말해라.',pose:'resolve',actor:0},
  ],
  'S1-05':[
    {speaker:'조진',line:'강 너머에서 적의 횃불이 보인다. 군량과 부상병을 실은 수레가 아직 뒤에 있다.',pose:'enter',actor:3},
    {speaker:'사마의',line:'수레를 버리면 오늘은 빨라도 내일 싸울 수 없습니다. 전방에 길을 열고 후방에 방패를 남기십시오.',pose:'speak',actor:4},
    {speaker:'조진',line:'교량을 돌파할지 남쪽으로 돌아갈지 정해라. 나는 수송대가 마지막 고개를 넘을 때까지 지키겠다.',pose:'resolve',actor:3},
  ],
  'S1-08':[
    {speaker:'조진',line:'두 교량 너머가 한중의 성채다. 서쪽 우군도 같은 깃발을 노리고 있다.',pose:'enter',actor:3},
    {speaker:'사마의',line:'성문을 부수기 전 감시탑의 사거리를 살피십시오. 지원대는 통로를 열고, 본대가 성채를 맡겠습니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'좋다. 네가 길을 읽고 내가 앞장서겠다. 오늘, 그 계책을 증명해 보아라.',pose:'resolve',actor:3},
  ],
};
export const acts=[
  {arc:1,title:'소년과 피난',from:1,to:3},{arc:1,title:'출사와 시험',from:4,to:6},{arc:1,title:'한중과 외교',from:7,to:11},
  {arc:2,title:'위의 방패',from:1,to:4},{arc:2,title:'군략의 대결',from:5,to:9},{arc:2,title:'위수와 오장원',from:10,to:14},
  {arc:3,title:'원정과 구원',from:1,to:4},{arc:3,title:'권력과 후계',from:5,to:7},
];

export const stories=[
  ['낙양의 밤','불타는 도읍에서 벼슬도 문벌도 형제를 지켜 주지 못한다. 사마랑이 남은 노잣돈을 꺼낸다. 성문까지 가는 길과, 그 문을 여는 값. 중달은 둘을 함께 계산한다.'],
  ['한중의 군막','피난하던 소년은 이제 군막에서 지도를 펼친다. 조진의 본대와 여덟 지원 부대가 명령을 기다린다. 서쪽 우군도 같은 성채를 노린다. 먼저 도착하는 것만으로는 충분하지 않다.'],
  ['하내의 불길','저택 밖에서 북소리가 들린다. 사마방은 북문을, 사마랑은 동문을 맡는다. 어린 중달이 할 수 있는 일은 하나. 흩어진 사람들을 무기 창고로 잇는 것이다.'],
  ['육혼산의 갈림길','피난 행렬 뒤로 말발굽 소리가 번진다. 사마랑은 길잡이를 부른다. 빠른 고개와 긴 계곡. 형제가 함께 살아 나갈 길을 정해야 한다.'],
  ['출사 전야','조정의 부름을 앞둔 밤, 낯선 회랑에 눈을 뜬다. 진궁의 물음, 여포의 창, 주유의 불빛. 아직 만나지 않은 얼굴들이 중달의 앞길을 가로막는다.'],
  ['강변의 수레','강물 위에 불빛이 번진다. 군량과 부상병을 실은 두 수송대가 진흙길에 멈췄다. 사마의는 전방을 가리키고, 조진은 후미를 돌아본다. 길을 열어야 한다. 그리고 누군가는 뒤에 남아야 한다.'],
  ['동관의 먼지','성문 위로 적의 깃발이 보인다. 뒤에서는 조조의 군막을 향해 먼지가 일어난다. 허저가 명령을 기다린다. 앞으로 보낼 한 부대와 뒤에 남길 한 부대, 둘 모두 사마의의 책임이다.'],
  ['진심을 칠하다','조비의 물음에 사마의는 전장의 결과로 답하려 한다. 한중으로 이어지는 큰길은 창병이, 숲길은 사격대가 지킨다. 조진의 기병과 지원 부대를 연계해 전초 수비망을 걷어 내고, 다음 성채 공략의 길을 열어야 한다.']
];
