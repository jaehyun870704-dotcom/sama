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
  'S2-01':[{art:14,name:'낙양 · 새 왕조의 조회',companion:'조진'},{art:8,name:'무위 · 성채 망루',companion:'조진'},{art:16,name:'무위 · 성채 마당',companion:'조진'}],
  'S1-11':[{art:14,name:'장안 · 위왕의 군의',companion:'조진'},{art:7,name:'장강 · 건업으로 가는 배',companion:'조진'},{art:5,name:'건업 · 궁정 앞 계단',companion:'조진'}],
  'S1-10':[{art:16,name:'한수 · 무너진 진영',companion:'조진'},{art:7,name:'한수 · 불어나는 강가',companion:'조진'},{art:4,name:'한수 · 북쪽 고갯길',companion:'조진'}],
  'S1-09':[{art:14,name:'한중 · 철수 군의',companion:'조진'},{art:15,name:'한수 · 불탄 부교터',companion:'조진'},{art:7,name:'한수 · 강변 정찰',companion:'조진'}],
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
  'S2-01':[
    {speaker:'조진',line:'선왕께서 돌아가시고 새 황제께서 즉위하셨네. 그 틈을 노려 양주의 호족들이 들고일어났어.',pose:'enter',actor:3},
    {speaker:'사마의',line:'반란군에 주술을 쓰는 무당이 있다 합니다. 책략을 맞으면 그 힘을 되돌려 보낸다더군요. 그자는 창과 화살로 상대해야 합니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'성채만 지키면 반란은 오래가지 못하네. 북쪽과 동쪽, 두 갈래를 나눠 막지.',pose:'resolve',actor:3},
  ],
  'S1-11':[
    {speaker:'조진',line:'우금의 칠군이 번성에서 물에 잠겼다. 조정에서는 도읍을 옮기자는 말까지 나온다네.',pose:'enter',actor:3},
    {speaker:'사마의',line:'옮길 필요 없습니다. 관우가 뜻을 이루는 것을 손권이 바랄 리 없습니다. 강동을 움직여 관우의 등을 치게 하면 번성의 포위는 절로 풀립니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'그 혀 하나에 형주가 달렸군. 손권의 신하들은 하나같이 만만치 않다네. 사람마다 다른 말로 설득하게.',pose:'resolve',actor:3},
  ],
  'S1-10':[
    {speaker:'조진',line:'조운이 한수 진영을 뚫었다! 그 한 사람의 창에 진영 하나가 통째로 흔들리고 있네.',pose:'enter',actor:3},
    {speaker:'사마의',line:'조운은 베어 넘길 수 없습니다. 사방을 막아 발을 묶어야 합니다. 둑이 무너지면 들판이 곧 물에 잠길 겁니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'봉쇄는 내가 맡지. 자네는 승상께서 북쪽 고개를 넘으실 때까지 길을 열게.',pose:'resolve',actor:3},
  ],
  'S1-09':[
    {speaker:'조진',line:'승상께서 계륵이라 하셨다더군. 먹자니 살이 없고 버리자니 아깝다… 한중에서 물러난다는 뜻일세.',pose:'enter',actor:3},
    {speaker:'사마의',line:'조운이 한수의 부교를 불태웠습니다. 강변을 지키며 다리를 다시 놓아야 승상께서 건너실 수 있습니다.',pose:'speak',actor:4},
    {speaker:'조진',line:'공병을 맡기겠네. 다리가 서기 전까지는 승상 곁을 떠나지 말게. 쳇바퀴처럼 같은 강변을 돌게 되더라도.',pose:'resolve',actor:3},
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
  ['진심을 칠하다','조비의 물음에 사마의는 전장의 결과로 답하려 한다. 한중으로 이어지는 큰길은 창병이, 숲길은 사격대가 지킨다. 조진의 기병과 지원 부대를 연계해 전초 수비망을 걷어 내고, 다음 성채 공략의 길을 열어야 한다.'],
  ['쳇바퀴','219년, 한중의 주인은 유비가 되었다. 정군산에서 하후연이 쓰러지고, 조조는 계륵이라는 한마디를 남긴 채 철군을 명한다. 한수의 부교는 불탔다. 강변을 지키며 다리를 다시 놓고, 물러나는 주군을 야곡 출구까지 모셔야 한다.'],
  ['범람','한수 진영의 밤, 백마의 장수가 진영을 가른다. 조운의 창은 막을 수 없고, 쏟아지는 비에 강물은 둑을 넘는다. 들판이 물에 잠기기 전에 그의 사방을 막고, 조조를 북쪽 고개로 모셔야 한다.'],
  ['혀에 걸린 사활','관우가 번성을 물에 잠기게 했다. 조정은 흔들리고, 사마의는 건업의 손권 조정에 사신으로 든다. 적벽을 기억하는 장소, 형주를 노리는 여몽, 유비와의 신의를 따지는 제갈근, 그리고 모욕을 삼킨 손권. 칼 대신 말로 강을 건너야 한다.'],
  ['되돌아오는 화살','220년, 조조가 죽고 조비가 한의 제위를 넘겨받았다. 새 왕조가 서던 해, 양주의 호족들이 무위에서 들고일어난다. 반란군 속에는 책략의 힘을 되돌리는 무당이 섞여 있다. 강하게 치는 것만이 답이 아니다.'],
];

/** After a main-battle victory: where the story picks up, and what changed. */
export const storyAftermath:Record<string,{art:number;name:string;beats:Array<{speaker:string;line:string}>}>={
  'S1-01':{art:0,name:'하내 · 불길이 지난 뜰',beats:[
    {speaker:'사마방',line:'의야, 오늘 너는 칼보다 눈으로 싸웠다. 그것을 잊지 마라.'},
    {speaker:'사마의',line:'창고는 지켰지만 황건의 불길은 낙양까지 번질 것입니다. 가문을 옮길 준비를 해야 합니다.'}]},
  'S1-02':{art:2,name:'낙양 · 남문 밖 언덕',beats:[
    {speaker:'사마랑',line:'남문을 빠져나왔다. 뒤를 돌아보지 마라. 낙양은 이제 동탁의 것이다.'},
    {speaker:'사마의',line:'형님, 불타는 도성을 보니 알겠습니다. 힘만으로 세운 권세는 저렇게 무너집니다.'}]},
  'S1-03':{art:3,name:'육혼산 · 고개 너머',beats:[
    {speaker:'사마랑',line:'추격대를 따돌렸다. 이 산을 넘으면 온현으로 돌아갈 길이 열린다.'},
    {speaker:'사마의',line:'숨는 것도 병법입니다. 때가 올 때까지 이름을 낮추겠습니다.'}]},
  'S1-04':{art:12,name:'사마가 · 새벽의 서재',beats:[
    {speaker:'꿈속의 목소리',line:'여포의 창도, 진궁의 꾀도 결국 섬길 이를 잘못 골라 무너졌다.'},
    {speaker:'사마의',line:'꿈이 끝났다. 조씨의 부름에 응할지… 이제는 내가 고를 차례다.'}]},
  'S1-05':{art:16,name:'장강 북안 · 수송대 야영지',beats:[
    {speaker:'조진',line:'수송대가 모두 강을 건넜다. 적벽의 불길 속에서도 이만하면 잘 버틴 셈이지.'},
    {speaker:'사마의',line:'물 위에서는 강동을 이길 수 없습니다. 북방을 먼저 다지는 것이 순서입니다.'}]},
  'S1-06':{art:8,name:'동관 · 관문 위',beats:[
    {speaker:'조진',line:'마초가 물러갔다! 승상께서 무사하시니 이번 공은 크네.'},
    {speaker:'사마의',line:'한수와 마초 사이가 벌어진 이상, 서량은 다시 한 깃발 아래 뭉치지 못할 겁니다.'}]},
  'S1-07':{art:17,name:'양평관 · 무너진 전초',beats:[
    {speaker:'조진',line:'양평관 수비망이 무너졌다. 장로도 오래 버티지 못하겠군.'},
    {speaker:'사마의',line:'조비 공자께 드릴 것은 공이 아니라, 살아 돌아온 병사들의 수입니다.'}]},
  'S2-01':{art:8,name:'무위 · 진압 뒤의 성벽',beats:[
    {speaker:'조진',line:'양주가 잠잠해졌군. 자네 덕에 무당의 술수에 휘말리지 않았어.'},
    {speaker:'사마의',line:'폐하께서 동쪽 강동을 치려 하신다는 말이 들립니다. 이번에는 물 위의 싸움이 될 겁니다.'}]},
  'S1-11':{art:7,name:'장강 · 흰 옷을 입은 배들',beats:[
    {speaker:'조진',line:'손권이 움직였다! 여몽이 상인으로 꾸민 배로 강을 거슬러 오른다는군.'},
    {speaker:'사마의',line:'관우는 앞의 번성만 보고 뒤의 강릉을 보지 못할 겁니다. 이제 상편이 끝났습니다. 다음은… 조씨의 천하가 바뀌는 때입니다.'}]},
  'S1-10':{art:4,name:'북쪽 고개 · 물에 잠긴 들판을 내려다보며',beats:[
    {speaker:'조진',line:'조운을 묶어 두었기에 승상께서 무사하셨다. 하지만 한수에 빠진 병사가 얼마인지…'},
    {speaker:'사마의',line:'형주에서 관우가 북상한다는 소식입니다. 이번 물은 번성까지 번질 겁니다. 강동의 손권을 움직여야 합니다.'}]},
  'S1-09':{art:7,name:'야곡 · 철수로 입구',beats:[
    {speaker:'조진',line:'승상께서 강을 건너셨다. 부교 하나가 수만 군의 목숨을 살렸군.'},
    {speaker:'사마의',line:'하지만 한수는 곧 불어납니다. 다음 강변에서는 물이 길을 막을 겁니다.'}]},
  'S1-08':{art:14,name:'한중 · 본대 군막',beats:[
    {speaker:'조진',line:'성채를 먼저 차지했다. 우군 장수들이 얼굴을 붉히더군.'},
    {speaker:'사마의',line:'지금 촉으로 밀고 들어가야 합니다… 하지만 승상께서는 농을 얻고 촉까지 바랄 수는 없다 하시겠지요.'}]},
};
