import type {ScenarioPack} from '../scenario-types.ts';

/**
 * 가상 시나리오 A — 상편 '즉시 출사'(serve)·'원소에게'(yuan) 루트, 중편 갈림길 두 곳,
 * 중편 '적벽을 넘은 위'(chibi)·'세자의 스승'(heir)·'원씨의 천하'(hebei)·'사마씨의 나라'(independent) 루트.
 * 각 루트: 가상 전장 3장 + 우두머리 장, 그리고 선택(path)으로 3장을 대신하는 다른 가상 전장 하나.
 */
type Chapters=ScenarioPack['chapters'];

// ───────────────────────── 상편 · 즉시 출사(serve): 조조의 젊은 참모 ─────────────────────────
const SERVE:Chapters=[
  {id:'IF1-srv-1',year:'203년',title:'여양 공방',
    synopsis:'조조의 부름에 곧장 응한 젊은 사마의는 막부의 말석에서 하북을 셈했다. 원소가 죽고 아들들이 칼을 겨누자 그가 아뢴다. "형제가 다툴 때를 기다리십시오." 그 전에 여양의 길목을 막은 원소의 조카 고간부터 걷어내야 한다.',
    scenes:[
      {place:'허도 · 사공부 회랑',art:13,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조조',look:'civil',at:[64,58],face:'left'},{name:'순욱',look:'civil',at:[78,52],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'201년, 사마의는 사공 조조의 부름에 곧장 응했다. 하내의 젊은 서생은 막부의 말석에서 붓을 들고, 말없이 천하를 셈했다. 이듬해 여름, 원소가 피를 토하고 숨을 거두었다.'},
          {enter:'전령',at:[48,72],from:'right'},
          {say:'전령',line:'아뢰오! 원소의 장자 원담과 셋째 원상이 후계를 두고 서로 칼을 겨눈다 하옵니다!',to:'조조'},
          {emote:'조조',text:'!'},
          {say:'조조',line:'본초가 남긴 것은 칼 두 자루와 갈라진 집안뿐이로구나. 지금 단숨에 업성을 치면 어떻겠소?',to:'순욱'},
          {move:'사마의',to:[46,62]},
          {say:'사마의',line:'급히 치면 형제는 손을 잡고, 늦추면 서로를 찌릅니다. 형제가 다툴 때를 기다리십시오. 다만 여양의 길목만은 먼저 열어 두어야 합니다.',to:'조조'},
          {emote:'순욱',text:'…'},
          {exit:'전령',to:'right'},
        ]},
      {place:'여양 · 황하 나루의 군영',art:16,cast:[{name:'사마의',look:'strategist',at:[40,62],face:'right'},{name:'조진',look:'cavalry',at:[26,56],face:'right'},{name:'장합',look:'spear',at:[60,54],face:'left'},{name:'곽회',look:'archer'},{name:'위군 병사',look:'infantry',at:[74,70],face:'left'}],
        steps:[
          {say:'조진',line:'중달, 붓만 쥐던 손으로 진영에 서니 어떤가? 하북 바람이 칼날 같지?',to:'사마의'},
          {enter:'곽회',at:[14,68],from:'left'},
          {say:'곽회',line:'척후가 돌아왔습니다. 고간의 병주군이 나루 건너 언덕에 목책을 겹겹이 세웠습니다.'},
          {move:'장합',to:[52,58]},
          {say:'장합',line:'고간은 원소 공의 조카요. 내가 관도에서 넘어오기 전, 저 목책 안의 장수들과 한솥밥을 먹었소.',to:'사마의'},
          {emote:'사마의',text:'…'},
          {choice:'사마의',options:[
            {id:'jianzhao',text:'원소의 옛 종사 견초를 불러, 옛 동료들의 마음을 흔들게 한다',reply:'칼보다 먼저 닿는 것이 옛정입니다. 견초라면 저 목책 안에 아는 얼굴이 많을 겁니다.',answer:{speaker:'장합',line:'견초라… 의리를 아는 자요. 그가 온다면 저쪽 절반은 싸우기도 전에 흔들릴 거요.'},note:'견초(기병)가 영입된다',effects:[{kind:'recruit',name:'견초',unitClass:'cavalry'},{kind:'flag',flag:'srv_jianzhao'}]},
            {id:'night',text:'밤에 상류로 나루를 건너 고간의 등 뒤를 친다',reply:'목책은 앞만 보고 서 있습니다. 등은 비어 있지요.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'front',text:'정면으로 나루를 건너 조공의 위세를 하북에 보인다',reply:'하북이 지켜보고 있습니다. 첫 싸움은 크게 이겨야 다음 싸움이 짧아집니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {move:'위군 병사',to:[86,66]},
          {say:'조진',line:'좋다! 앞장은 내가 서지. 중달은 뒤에서 그 셈이 맞는지나 보게!'},
        ]},
    ],
    after:[
      {place:'여양 · 무너진 목책',art:17,cast:[{name:'사마의',look:'strategist',at:[36,62],face:'right'},{name:'조진',look:'cavalry',at:[22,56],face:'right'},{name:'견초',look:'cavalry'},{name:'위군 병사',look:'infantry',at:[64,68],face:'left'}],
        steps:[
          {narrate:'고간은 병주로 물러났다. 여양의 길목이 열렸다.'},
          {enter:'견초',at:[52,58],from:'right',when:'srv_jianzhao'},
          {say:'견초',line:'옛 동료들이 창을 거두었소. 원씨 형제의 집안싸움에 죽을 까닭은 없다더군. 나도 그대의 셈을 따라가 보겠소.',to:'사마의',when:'srv_jianzhao'},
          {emote:'조진',text:'♪'},
          {say:'조진',line:'원담과 원상은 벌써 서로 사자를 보내 욕을 한다더군. 중달 말대로야.'},
          {say:'사마의',line:'형이 아우를 치면, 아우는 업성에 갇힙니다. 그때 장수의 물길을 보러 가지요.'},
          {exit:'위군 병사',to:'right'},
        ]},
    ]},

  {id:'IF1-srv-2',year:'204년',title:'업성 수공',
    synopsis:'원담과 원상이 서로를 치는 사이, 조조의 군이 업성을 에워쌌다. 원상의 충신 심배가 성을 지킨다. 장수(漳水)를 끌어 성을 잠기게 하자는 계책이 사마의의 붓끝에서 나왔다.',
    scenes:[
      {place:'업성 · 장수 강둑',art:15,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[20,56],face:'right'},{name:'사마랑',look:'civil'},{name:'심배',look:'strategist',at:[82,40],face:'left'},{name:'위군 병사',look:'infantry',at:[56,72],face:'right'}],
        steps:[
          {narrate:'204년 봄. 원상이 형 원담을 치러 평원으로 나간 틈에, 조조의 군이 업성을 둘러쌌다.'},
          {say:'심배',line:'역적 조조야! 업성의 성벽은 원 공께서 쌓으신 것, 네 놈의 사다리로는 넘지 못한다!'},
          {emote:'조조',text:'분노'},
          {enter:'사마랑',at:[12,66],from:'left'},
          {say:'사마랑',line:'의야, 강물이 불었다. 장수가 성 쪽으로 기울어 흐르는구나.',to:'사마의'},
          {move:'사마의',to:[46,64]},
          {say:'사마의',line:'성벽은 사다리를 막지만 물은 막지 못합니다. 성을 둘러 해자를 파고 장수를 끌어들이면, 심배는 싸우지 않고 굶습니다.',to:'조조'},
          {say:'조조',line:'좋은 셈이다. 허나 성 안에는 백성도 있다. 그리고 평원의 원담도 칼을 갈고 있지.'},
          {emote:'사마의',text:'…'},
          {choice:'사마의',options:[
            {id:'flood',text:'물길을 판다. 업성을 잠기게 하라',reply:'모질다 하셔도 좋습니다. 싸움이 길어지면 성 안의 백성이 더 많이 굶습니다.',answer:{speaker:'사마랑',line:'…네 셈이 옳겠지. 다만 그 물이 누구의 집을 덮는지는 잊지 마라.'},note:'책략 MP +15. 수공의 원망이 뒤에 남는다',effects:[{kind:'insight'},{kind:'flag',flag:'srv_flood'}]},
            {id:'nanpi',text:'업성은 둘러싸 두고, 남피의 원담부터 꺾는다',reply:'형을 먼저 꺾으면 아우는 돌아올 곳만 잃습니다. 다음 싸움은 남피의 얼어붙은 해자입니다.',note:'다음 가상 전장이 「남피 설원」으로 바뀐다',effects:[{kind:'path',tale:'IF1-srv-nanpi'},{kind:'flag',flag:'srv_nanpi'}]},
            {id:'gate',text:'심배의 조카 심영에게 밀서를 보내 성문을 열게 한다',reply:'성벽은 밖에서 무너지지 않습니다. 안에서 열립니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
          ]},
          {move:'위군 병사',to:[66,70]},
          {exit:'사마랑',to:'left'},
        ]},
    ],
    after:[
      {place:'업성 · 원소의 묘 앞',art:2,cast:[{name:'조조',look:'civil',at:[46,56],face:'right'},{name:'사마의',look:'strategist',at:[28,62],face:'right'},{name:'심배',look:'strategist',at:[70,62],face:'left'},{name:'조비',look:'civil'}],
        steps:[
          {say:'심배',line:'나를 북쪽을 보게 하고 베어라. 내 주인은 북쪽에 계시다.'},
          {emote:'사마의',text:'…'},
          {say:'사마의',line:'(물에 잠겼던 거리를 바라보며) 이긴 싸움에도 값은 치러야 합니다. 이 값은 제 이름 아래 적어 두십시오.',when:'srv_flood'},
          {enter:'조비',at:[60,70],from:'left'},
          {say:'조비',line:'아버님, 원씨의 부중을 거두었습니다. 그대가 사마중달인가? 그대의 셈 이야기를 많이 들었소.',to:'사마의'},
          {say:'조조',line:'원담은 남피에, 원상은 북쪽 오환에 있다. 중달, 다음 길을 그려 오너라.'},
          {exit:'심배',to:'right'}
        ]},
    ]},

  {id:'IF1-srv-3',year:'207년',title:'백랑산 원정',
    synopsis:'원상과 원희는 오환으로 달아나 선우 답돈의 기병에 몸을 맡겼다. 장맛비에 해안길이 막힌 무종에서, 사마의는 사막을 건너는 강행군을 택한다. 백랑산 아래 오환의 기병이 펼쳐졌다.',
    scenes:[
      {place:'무종 · 물에 잠긴 해안길',art:11,cast:[{name:'사마의',look:'strategist',at:[38,62],face:'right'},{name:'조진',look:'cavalry',at:[24,56],face:'right'},{name:'곽가',look:'civil',at:[54,58],face:'left'},{name:'전주',look:'cavalry'},{name:'위군 병사',look:'infantry',at:[72,70],face:'left'}],
        steps:[
          {narrate:'207년 여름. 큰비가 내려 바닷가 길이 끊겼다. 군중의 군사 곽가는 기침이 멎지 않았다.'},
          {emote:'곽가',text:'땀'},
          {say:'곽가',line:'중달… 병법은 귀신같이 빠른 것을 귀하게 여기네. 치중을 버리고 가볍게 내달려야 하네. 콜록…',to:'사마의'},
          {move:'사마의',to:[44,62]},
          {enter:'전주',at:[84,58],from:'right'},
          {say:'전주',line:'무종의 전주라 하오. 이 비에 바닷길은 못 쓰오. 허나 노룡새를 넘는 옛 길이 있소. 이백 년 묵은 길이지.'},
          {emote:'조진',text:'?'},
          {say:'사마의',line:'옛 길이라면 오환도 잊었을 길입니다. 그런데 곽 군사의 몸이 그 길을 견딜지….'},
          {choice:'사마의',options:[
            {id:'tianchou',text:'전주를 길잡이로 맞아 노룡새의 옛 길로 간다',reply:'길을 아는 이가 칼 든 이보다 귀합니다. 함께 가 주시오.',answer:{speaker:'전주',line:'원씨에게 집을 잃은 사람이 많소. 나도 그중 하나요. 앞장서겠소.'},note:'전주(기병)가 영입된다',effects:[{kind:'recruit',name:'전주',unitClass:'cavalry'}]},
            {id:'guojia',text:'곽가를 역참에 남겨 쉬게 하고, 내가 그의 계책대로 경기병을 몬다',reply:'봉효 공, 공의 계책은 제가 들고 가겠습니다. 공은 살아서 승전보를 들으십시오.',answer:{speaker:'곽가',line:'허허, 하내의 젊은이가 나를 살리겠다는군. …좋네. 이번만은 지게.'},note:'방어 태세. 곽가가 살아남는다',effects:[{kind:'guard'},{kind:'flag',flag:'srv_guojia'}]},
            {id:'rush',text:'비를 무릅쓰고 정면의 길로 곧장 밀고 나간다',reply:'오환은 우리가 비를 피해 멈추리라 여깁니다. 그 생각보다 먼저 닿습니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'위군 병사',to:'right'},
        ]},
    ],
    after:[
      {place:'백랑산 · 흩어진 오환의 진',art:3,cast:[{name:'사마의',look:'strategist',at:[36,60],face:'right'},{name:'조진',look:'cavalry',at:[22,56],face:'right'},{name:'전령',look:'cavalry'},{name:'곽가',look:'civil'}],
        steps:[
          {narrate:'선우 답돈이 쓰러지고 오환의 기병이 흩어졌다. 그러나 원상과 원희는 다시 동쪽으로 달아났다.'},
          {enter:'전령',at:[60,66],from:'right'},
          {say:'전령',line:'원상 형제가 남은 기병 수천을 이끌고 유성 쪽으로 달아났습니다! 요동의 공손강에게 가려는 듯합니다!'},
          {emote:'조진',text:'분노'},
          {enter:'곽가',at:[50,58],from:'left',when:'srv_guojia'},
          {say:'곽가',line:'(편지를 흔들며) 역참에서 누워 승전보를 들으니, 병이 반은 나은 것 같네. 중달, 끝을 맺으러 가게.',when:'srv_guojia'},
          {say:'사마의',line:'쫓는 것도, 기다리는 것도 셈입니다. 유성으로 가지요.'},
        ]},
    ]},

  {id:'IF1-srv-nanpi',year:'205년',title:'남피 설원',
    synopsis:'사마의는 업성을 둘러싸 둔 채 형 원담부터 치자고 아뢰었다. 정월의 남피, 해자는 얼어붙었고 원담은 성문을 열고 나와 죽기로 싸운다. 형을 꺾으면 아우는 돌아올 곳을 잃는다.',
    scenes:[
      {place:'남피 · 얼어붙은 해자',art:8,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[20,56],face:'right'},{name:'조진',look:'cavalry',at:[48,58],face:'right'},{name:'원담',look:'infantry',at:[84,48],face:'left'},{name:'위군 병사',look:'infantry',at:[62,70],face:'right'}],
        steps:[
          {narrate:'205년 정월. 남피의 해자가 얼어붙었다. 원담의 군이 성문을 열고 얼음 위로 쏟아져 나왔다.'},
          {say:'원담',line:'아우에게 쫓기고 조조에게 쫓기니, 이제 물러설 땅도 없다! 하북의 장자가 어떻게 죽는지 보아라!'},
          {move:'위군 병사',to:[54,72]},
          {emote:'위군 병사',text:'땀'},
          {say:'조조',line:'얼음 위에서 미끄러지는 건 우리 쪽이로군. 중달, 하루 물렸다가 다시 칠까?',to:'사마의'},
          {move:'사마의',to:[40,64]},
          {say:'사마의',line:'오늘 물리면 원담은 아우와 화해할 핑계를 얻습니다. 오늘 끝내야 합니다.'},
          {choice:'사마의',options:[
            {id:'drum',text:'공께서 몸소 북을 치시게 하여 군의 기세를 되살린다',reply:'사공께서 북채를 드시면, 병사들은 얼음이 아니라 북소리를 밟고 갑니다.',answer:{speaker:'조조',line:'하하! 이 늙은이를 북잡이로 쓰겠다는 거냐. 좋다, 북을 가져와라!'},note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
            {id:'sand',text:'밤새 얼음 위에 모래와 짚을 깔고 새벽에 친다',reply:'미끄러지는 땅을 바꾸면 됩니다. 원담은 밤새 우리가 달아난다고 여길 겁니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'letter',text:'원담의 장수들에게 "원상이 너희를 팔았다"는 글을 쏘아 보낸다',reply:'형제의 싸움은 장수들의 싸움이기도 합니다. 저 안에도 갈 곳을 셈하는 자가 있습니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
          ]},
          {move:'조진',to:[60,60]},
          {say:'조진',line:'얼음이든 눈이든, 길만 열어 주면 내가 달린다!'},
        ]},
    ],
    after:[
      {place:'남피 · 눈 내린 성문',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[50,56],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'원담은 남피의 눈 속에서 쓰러졌다. 하북의 장자가 남긴 피가 얼음 위에서 얼었다.'},
          {enter:'전령',at:[70,66],from:'right'},
          {say:'전령',line:'원상과 원희가 오환의 기병을 모아 유성에서 다시 일어났다 하옵니다!'},
          {emote:'조조',text:'!'},
          {say:'사마의',line:'형이 쓰러졌으니 아우도 돌아갈 곳이 없습니다. 이제는 쫓아서 끝을 맺을 때입니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'serve:boss',year:'207년',title:'유성의 마지막 기병',
    synopsis:'하북을 잃은 원상이 남은 기병을 모아 요서 유성 앞에 섰다. 등 뒤의 요동에는 그를 받아 줄지 모를 공손강이 있다. 원소가 남긴 마지막 칼을 꺾으면 하북은 조조의 것이 된다.',
    scenes:[
      {place:'요서 · 유성 앞 군막',art:14,cast:[{name:'사마의',look:'strategist',at:[38,62],face:'right'},{name:'조조',look:'civil',at:[56,56],face:'left'},{name:'조진',look:'cavalry',at:[22,58],face:'right'},{name:'곽회',look:'archer'},{name:'곽가',look:'civil'}],
        steps:[
          {narrate:'207년 가을. 하북에 남은 원씨의 깃발은 요서 유성 앞의 기병 몇 천뿐이었다.'},
          {narrate:'백랑산의 오환이 무너졌다. 원상에게는 이제 의지할 선우도 없다.',unless:'srv_nanpi'},
          {narrate:'남피에서 형 원담이 쓰러졌다. 원상은 오환의 기병을 빌려 마지막 칼을 들었다.',when:'srv_nanpi'},
          {enter:'곽회',at:[76,66],from:'right'},
          {say:'곽회',line:'원상이 유성 동쪽 들판에 진을 쳤습니다. 등 뒤의 요동 공손강은 아직 성문을 열지 않았습니다.'},
          {enter:'곽가',at:[70,56],from:'left',when:'srv_guojia'},
          {say:'곽가',line:'공손강은 원상을 두려워하오. 우리가 몰아붙이면 손을 잡고, 늦추면 서로를 의심하지.',when:'srv_guojia'},
          {say:'조조',line:'중달, 그대는 늘 기다리라 하지. 이번에도 기다리라 하겠느냐?',to:'사마의'},
          {emote:'사마의',text:'…'},
          {move:'사마의',to:[46,62]},
          {choice:'사마의',options:[
            {id:'wait',text:'공손강에게 사자를 보내고, 원상의 퇴로가 닫히기를 기다렸다 친다',reply:'공손강이 성문을 닫으면 원상의 기병 절반은 싸우기 전에 흩어집니다. 기다림도 칼입니다.',answer:{speaker:'조조',line:'허허, 역시 그 말이로군. 좋다. 사흘을 주마.'},note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'},{kind:'flag',flag:'srv_wait'}]},
            {id:'pincer',text:'곽회에게 동쪽 퇴로를 막게 하고 새벽에 들이친다',reply:'달아날 길이 막힌 기병은 말에서 내리는 법을 모릅니다. 곽회, 동쪽을 맡게.',answer:{speaker:'곽회',line:'동쪽 길목에 쇠뇌를 늘어세우겠습니다. 한 기도 요동에 들이지 않겠습니다.'},note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'charge',text:'원소의 마지막 칼과 정면으로 맞붙는다',reply:'하북 사람들이 보고 있습니다. 원씨가 정면에서 졌다는 것을 그들 눈으로 보게 해야 합니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'곽회',to:'right'},
        ]},
    ],
    after:[
      {place:'유성 · 저무는 들판',art:6,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[54,56],face:'left'},{name:'사마랑',look:'civil'}],
        steps:[
          {narrate:'원상이 쓰러지고, 원소가 일군 하북은 마침내 조조의 것이 되었다.'},
          {say:'조조',line:'이제 북쪽에 칼이 없다. 남쪽 형주의 유표는 늙었고, 장강 건너에는 손씨의 애송이가 있지. 중달, 다음은 강이다.',to:'사마의'},
          {enter:'사마랑',at:[18,66],from:'left'},
          {emote:'사마랑',text:'♪'},
          {say:'사마랑',line:'의야, 하내에서 기별이 왔다. 춘화가 아이를 가졌단다. 내년 이맘때면 너도 아비가 되겠구나.',to:'사마의'},
          {say:'사마의',line:'(남쪽 하늘을 오래 바라본다) …그 아이가 태어날 무렵엔, 장강 위에 서 있겠군요.'},
          {exit:'사마랑',to:'left'}
        ]},
    ]},
];

// ───────────────────────── 상편 · 원소에게(yuan): 하북의 책사 ─────────────────────────
// 원소 쪽 루트: 조진은 나오지 않는다. 사마의 곁의 기병 자리는 백마에서 살아남은 문추가 선다.
const YUAN:Chapters=[
  {id:'IF1-yuan-1',year:'201년',title:'백마 구원',
    synopsis:'조조의 부름을 물리친 사마의는 하북의 원소에게 몸을 맡겼다. 원소의 대장 안량이 백마에서 쓰러졌고, 그를 벤 붉은 얼굴의 장수 관우가 아직 전장에 있다. 분노한 문추가 홀로 뛰쳐나가려 한다.',
    scenes:[
      {place:'여양 · 원소의 군막',art:14,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'원소',look:'civil',at:[64,54],face:'left'},{name:'문추',look:'cavalry',at:[48,58],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'201년. 조조의 사자를 돌려보낸 사마의는 북쪽 원소의 막하로 갔다. 원소의 남정은 한 해 늦어졌고, 하북의 대군이 마침내 황하를 건넜다.'},
          {enter:'전령',at:[82,70],from:'right'},
          {say:'전령',line:'아뢰오! 안량 장군이 백마에서 쓰러지셨습니다! 붉은 얼굴에 긴 수염의 장수가 단칼에…!',to:'원소'},
          {emote:'원소',text:'분노'},
          {say:'문추',line:'안량은 내 형제나 다름없었소! 내가 가서 그 붉은 얼굴의 목을 가져오겠소!'},
          {move:'사마의',to:[40,62]},
          {say:'사마의',line:'문 장군, 그 장수는 관우입니다. 홀로 가시면 안량 장군의 뒤를 따르실 뿐입니다.',to:'문추'},
          {exit:'전령',to:'right'},
        ]},
      {place:'백마 · 흙먼지 날리는 들판',art:16,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'문추',look:'cavalry',at:[50,56],face:'right'},{name:'장합',look:'spear'},{name:'유비',look:'infantry'}],
        steps:[
          {enter:'장합',at:[66,60],from:'right'},
          {say:'장합',line:'관우는 아직 백마 들판에 있소. 조조의 은혜를 갚기 전에는 물러가지 않겠다는군.'},
          {enter:'유비',at:[18,66],from:'left'},
          {say:'유비',line:'중달 공, 관우는 내 아우요. 그가 조조의 진에 살아 있다는 것을 오늘에야 알았소.',to:'사마의'},
          {emote:'사마의',text:'!'},
          {choice:'사마의',options:[
            {id:'letter',text:'유비 공께 편지를 쓰시게 하여, 관우의 칼끝을 흔든다',reply:'칼로는 관우를 이기기 어렵습니다. 허나 의리로는 흔들 수 있습니다.',answer:{speaker:'유비',line:'…형이 아우에게 쓰는 편지가 칼이 되는구려. 쓰겠소.'},note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'},{kind:'flag',flag:'yuan_liubei'}]},
            {id:'net',text:'문추와 장합이 세 겹으로 에워싸, 한 사람이 홀로 맞서지 않게 한다',reply:'관우 하나에 장수 하나를 내주면 열 번 져도 이상하지 않습니다. 셋이 함께 섭니다.',answer:{speaker:'문추',line:'…알겠소. 오늘은 그대의 셈을 따르겠소.'},note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'avenge',text:'안량의 원수를 갚자고 외쳐 하북군의 기세를 올린다',reply:'분노도 쓰기에 따라 무기가 됩니다. 다만 앞서 달리지는 마십시오.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {move:'문추',to:[58,58]},
        ]},
    ],
    after:[
      {place:'백마 · 해 지는 들판',art:3,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'문추',look:'cavalry',at:[56,58],face:'left'},{name:'유비',look:'infantry'}],
        steps:[
          {narrate:'관우는 칼을 거두고 남쪽으로 말을 돌렸다. 품에는 형의 편지가 있었다.',when:'yuan_liubei'},
          {narrate:'관우는 칼을 거두고 물러났다. 하북군은 백마를 되찾았다.',unless:'yuan_liubei'},
          {emote:'문추',text:'…'},
          {say:'문추',line:'그대가 붙잡지 않았다면 나는 오늘 안량 곁에 누웠을 거요. 이 목숨, 그대의 셈에 빚졌소.',to:'사마의'},
          {enter:'유비',at:[18,66],from:'left',when:'yuan_liubei'},
          {say:'유비',line:'운장은 반드시 내게 올 것이오. 고맙소, 중달 공.',when:'yuan_liubei'},
          {say:'사마의',line:'백마는 시작일 뿐입니다. 조조는 이제 하북의 곡창, 오소를 노릴 겁니다.'},
          {exit:'유비',to:'left',when:'yuan_liubei'}
        ]},
    ]},

  {id:'IF1-yuan-2',year:'201년',title:'오소 수비',
    synopsis:'관도에서 두 진이 석 달째 마주했다. 하북의 군량은 오소에 쌓여 있다. 사마의는 오소를 지키라 간언했고, 이번에는 원소가 들었다. 밤을 틈타 조조의 기병이 온다. 선두에 선 자는 장료다.',
    scenes:[
      {place:'관도 · 원소의 본진',art:14,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'원소',look:'civil',at:[66,54],face:'left'},{name:'저수',look:'strategist',at:[46,58],face:'right'},{name:'허유',look:'strategist'}],
        steps:[
          {narrate:'관도에서 두 진이 석 달째 마주했다. 하북의 군량 만여 수레는 북쪽 오소에 쌓여 있다.'},
          {say:'저수',line:'오소를 지키는 순우경은 술을 좋아합니다. 장기에게 별군을 주어 오소 바깥을 지키게 하소서.',to:'원소'},
          {say:'원소',line:'저수는 늘 겁이 많아. 조조는 굶어 가는데 무엇이 두렵단 말이냐.'},
          {emote:'저수',text:'땀'},
          {enter:'허유',at:[84,62],from:'right'},
          {say:'허유',line:'주공! 조조는 허도를 비우고 전군을 관도에 묶었습니다. 경기병으로 허도를 치소서!'},
          {move:'사마의',to:[38,62]},
          {say:'사마의',line:'두 분의 말이 다 옳습니다. 조조가 노리는 곳은 오소이고, 비어 있는 곳은 허도입니다.'},
          {say:'원소',line:'중달, 백마를 지킨 그대의 말이라면 듣겠다. 무엇을 할 테냐?',to:'사마의'},
          {choice:'사마의',options:[
            {id:'jushou',text:'저수 공께 오소를 맡기고, 장기의 별군을 바깥에 세운다',reply:'곡창을 지킬 사람은 곡창이 위태롭다고 먼저 말한 사람입니다.',answer:{speaker:'저수',line:'늙은이의 말을 들어 준 이는 그대가 처음이오. 이제부터 그대와 함께 셈하겠소.'},note:'저수(책사)가 영입된다',effects:[{kind:'recruit',name:'저수',unitClass:'strategist'},{kind:'flag',flag:'yuan_jushou'}]},
            {id:'xudu',text:'오소는 지키되, 허유의 계책대로 경기병을 허도로 보낸다',reply:'조조가 오소를 치러 오는 밤, 우리는 그의 집을 칩니다. 오소를 막은 뒤 곧장 영천으로 내려가지요.',answer:{speaker:'허유',line:'하하! 내 말을 알아듣는 자가 있었군. 길은 내가 안내하겠소.'},note:'다음 가상 전장이 「허도 급습」으로 바뀐다',effects:[{kind:'path',tale:'IF1-yuan-xudu'},{kind:'flag',flag:'yuan_xudu'}]},
            {id:'hidden',text:'오소 둘레의 숲에 복병을 묻고 불씨를 기다린다',reply:'장료가 횃불을 드는 순간, 숲이 먼저 일어납니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
          ]},
          {exit:'허유',to:'right'},
        ]},
    ],
    after:[
      {place:'오소 · 불붙지 않은 곡창',art:9,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'곽회',look:'archer',at:[52,60],face:'left'},{name:'저수',look:'strategist'}],
        steps:[
          {narrate:'장료의 기병은 오소의 곡창에 불씨 하나 던지지 못하고 어둠 속으로 물러났다.'},
          {enter:'저수',at:[70,58],from:'right',when:'yuan_jushou'},
          {say:'저수',line:'곡식 한 섬이 병사 하나의 목숨이오. 오늘 만 명을 살렸소.',when:'yuan_jushou'},
          {say:'곽회',line:'조조의 진에서 군량이 열흘 치도 남지 않았다는 말이 돕니다.',to:'사마의'},
          {emote:'사마의',text:'…'},
          {say:'사마의',line:'굶주린 범은 마지막에 가장 사납게 뜁니다. 이제부터가 진짜 싸움입니다.'},
          {exit:'곽회',to:'right'}
        ]},
    ]},

  {id:'IF1-yuan-3',year:'201년',title:'관도 결전',
    synopsis:'오소를 잃지 않은 하북군이 관도의 진채를 밀어붙인다. 조조의 본진 앞을 웃통 벗은 장사 허저가 막아선다. 그를 넘으면 조조가 보인다.',
    scenes:[
      {place:'관도 · 마주 선 진채',art:17,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'문추',look:'cavalry',at:[48,56],face:'right'},{name:'장합',look:'spear',at:[20,56],face:'right'},{name:'곽회',look:'archer'},{name:'하북 병사',look:'infantry',at:[66,70],face:'right'}],
        steps:[
          {narrate:'조조의 진채에서 돌덩이가 날아올랐다. 벽력거라 불리는 발석거가 하북군의 망루를 하나씩 부수었다.'},
          {emote:'하북 병사',text:'땀'},
          {move:'하북 병사',to:[58,72]},
          {say:'문추',line:'저 앞에 웃통을 벗은 거한이 서 있소. 허저라던가. 저 자가 조조의 문이오.',to:'사마의'},
          {enter:'곽회',at:[76,64],from:'right'},
          {say:'곽회',line:'망루가 셋 무너졌습니다. 돌이 닿지 않는 낮은 곳으로 군을 물려야 합니다.'},
          {move:'사마의',to:[40,62]},
          {choice:'사마의',options:[
            {id:'tunnel',text:'땅굴을 파 진채 아래로 들어간다',reply:'돌은 하늘로 날아옵니다. 우리는 땅 밑으로 갑니다.',answer:{speaker:'장합',line:'땅굴이라면 내 창병이 앞장서겠소. 허저도 발밑은 보지 못할 거요.'},note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'low',text:'망루를 버리고 군을 낮게 엎드리게 한다',reply:'높이 선 것은 부서집니다. 오늘은 낮게, 단단하게 섭니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'banners',text:'하북 대군의 깃발을 모두 세워 기세로 누른다',reply:'조조의 병사들은 굶었습니다. 깃발 열 개를 보면 백 개로 셉니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {say:'장합',line:'허저의 힘이 장사라 해도, 진은 힘으로 서는 것이 아니오. 갑시다.'},
        ]},
    ],
    after:[
      {place:'관도 · 무너진 앞 진채',art:16,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'문추',look:'cavalry',at:[54,56],face:'left'},{name:'장합',look:'spear',at:[20,58],face:'right'}],
        steps:[
          {narrate:'허저가 상처를 입고 물러났다. 조조 본진의 깃발이 흙먼지 너머로 보였다.'},
          {emote:'문추',text:'!'},
          {say:'문추',line:'보이오! 조조의 일산이오!'},
          {move:'장합',to:[28,58]},
          {say:'사마의',line:'범은 우리 앞에 섰습니다. 내일, 범의 숨이 어디서 끊기는지 보게 될 겁니다.'},
          {exit:'문추',to:'right'}
        ]},
    ]},

  {id:'IF1-yuan-xudu',year:'201년',title:'허도 급습',
    synopsis:'오소를 지킨 그 밤, 사마의는 허유와 함께 경기병을 이끌고 영천의 숲길로 내려갔다. 텅 빈 줄 알았던 허도 앞에는 조조의 종제 조홍이 남은 군을 모아 기다리고 있다.',
    scenes:[
      {place:'영천 · 허도로 가는 숲길',art:11,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'허유',look:'strategist',at:[44,58],face:'right'},{name:'문추',look:'cavalry',at:[18,56],face:'right'},{name:'조홍',look:'cavalry',at:[84,54],face:'left'},{name:'척후',look:'cavalry'}],
        steps:[
          {narrate:'오소를 지킨 밤, 하북의 경기병 수천이 영천의 숲길을 따라 남으로 내달렸다.'},
          {enter:'척후',at:[66,68],from:'right'},
          {say:'척후',line:'허도 앞에 조홍이 남은 군을 모아 진을 쳤습니다! 비어 있지 않습니다!'},
          {emote:'허유',text:'땀'},
          {say:'조홍',line:'원소의 개들아! 형님이 안 계신 허도는 이 조자렴이 지킨다!'},
          {move:'사마의',to:[38,62]},
          {say:'허유',line:'으음… 성 안에는 천자도 계시오. 성벽에 불이라도 붙으면 하북이 역적이 되오.',to:'사마의'},
          {choice:'사마의',options:[
            {id:'rumor',text:'허도 성 안에 "관도의 조조가 무너졌다"는 소문을 먼저 흘린다',reply:'지키는 자가 지킬 까닭을 잃으면, 성 밖의 진은 반으로 줄어듭니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'emperor',text:'성벽에는 화살 하나 쏘지 말고, 성 밖의 조홍만 친다',reply:'천자는 놀라게 하지 않습니다. 우리가 이기면 천자가 우리를 부르게 됩니다.',answer:{speaker:'허유',line:'허허… 칼보다 명분이 먼저라. 원 공께 꼭 들려 드려야겠군.'},note:'방어 태세. 천자를 놀라게 하지 않았다',effects:[{kind:'guard'},{kind:'flag',flag:'yuan_emperor'}]},
            {id:'dash',text:'조홍이 진을 다 펴기 전에 그대로 들이친다',reply:'빠름은 기병의 유일한 갑옷입니다. 멈추면 벗겨집니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {exit:'척후',to:'left'},
        ]},
    ],
    after:[
      {place:'허도 · 닫힌 성문 앞',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'허유',look:'strategist',at:[50,58],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'조홍이 무너졌다. 허도의 성문은 닫혀 있었지만, 그 위의 깃발이 떨고 있었다.'},
          {enter:'전령',at:[72,66],from:'right'},
          {say:'전령',line:'관도의 조조가 허도가 위태롭다는 소식에 본진을 들어 돌아서려 한답니다!'},
          {emote:'사마의',text:'!'},
          {say:'사마의',line:'범이 등을 돌렸습니다. 관도로 돌아갑니다. 원 공께 지금이라 아뢰십시오.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'yuan:boss',year:'201년',title:'관도의 범',
    synopsis:'조조의 본진이 흔들린다. 원소는 지금이야말로 조맹덕의 목을 거둘 때라 외친다. 그러나 궁지에 몰린 범은 가장 사납다. 사마의는 관도의 마지막 싸움을 어떻게 끝낼 것인가.',
    scenes:[
      {place:'관도 · 원소의 본진',art:14,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'원소',look:'civil',at:[62,54],face:'left'},{name:'장합',look:'spear',at:[46,58],face:'right'},{name:'문추',look:'cavalry'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'허도가 위태롭다는 소식에 조조의 본진이 흔들렸다.',when:'yuan_xudu'},
          {narrate:'허저가 물러나자 조조의 본진이 맨몸으로 드러났다.',unless:'yuan_xudu'},
          {say:'원소',line:'중달! 이제 조맹덕의 목이 내 손 안이다. 전군을 들어 짓밟아라!',to:'사마의'},
          {enter:'문추',at:[18,56],from:'left'},
          {say:'문추',line:'선봉은 내가 서겠소. 안량의 원수, 오늘 갚겠소!'},
          {enter:'전령',at:[80,70],from:'right'},
          {say:'전령',line:'조조가 진을 둥글게 말고 사방에 창을 세웠습니다! 죽기로 싸울 기세입니다!'},
          {emote:'사마의',text:'…'},
          {move:'사마의',to:[40,62]},
          {choice:'사마의',options:[
            {id:'open',text:'포위의 한쪽을 열어 둔다. 궁지의 적은 몰지 않는다',reply:'달아날 길이 보이면 범은 이빨 대신 다리를 씁니다. 그 다리를 뒤에서 칩니다.',answer:{speaker:'원소',line:'놓아주자는 말이냐? …아니, 그대의 눈빛은 그게 아니로군. 좋다.'},note:'기습: 적 전원이 체력 80%로 시작. 조조가 살아 달아난다',effects:[{kind:'ambush'},{kind:'flag',flag:'yuan_open'}]},
            {id:'starve',text:'남은 군량길을 마저 끊고, 굶주린 진을 친다',reply:'창을 세운 병사도 배는 고픕니다. 하루만 더 굶기지요.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'all',text:'원 공의 말씀대로 전군을 들어 정면으로 짓밟는다',reply:'하북의 십만이 한 번에 움직이면, 그 자체가 책략입니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'전령',to:'right'},
        ]},
    ],
    after:[
      {place:'관도 · 무너진 조조의 본진',art:16,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'원소',look:'civil',at:[54,56],face:'left'},{name:'사마랑',look:'civil'}],
        steps:[
          {narrate:'조조는 백여 기를 이끌고 허창으로 달아났다. 관도의 승부가 뒤집혔다.'},
          {say:'사마의',line:'(열어 둔 길을 바라보며) 범을 놓아준 것이 아닙니다. 하북이 이길 시간을 번 것이지요.',when:'yuan_open'},
          {say:'원소',line:'하하… 하하하! 보았느냐, 하북의 천하다! 콜록, 콜록…!'},
          {emote:'원소',text:'땀'},
          {enter:'사마랑',at:[18,66],from:'left'},
          {say:'사마랑',line:'(작게) 의야, 원 공의 얼굴빛이 좋지 않다. 이긴 자의 기침이 길면, 집안이 먼저 갈라지는 법이다.',to:'사마의'},
          {move:'사마의',to:[40,64]}
        ]},
    ]},
];

// ───────────────────────── 중편 갈림길 ─────────────────────────
const FATE2:Chapters=[
  {id:'fate:2:serve',year:'208년 · 장강',title:'적벽 전야',
    synopsis:'조조의 대군이 형주를 삼키고 장강에 이르렀다. 남쪽에는 손권과 유비의 연합군, 안쪽에는 세자 자리를 두고 다투는 조비와 조식. 젊은 참모 사마의는 어디에 힘을 쏟을 것인가.',
    scenes:[
      {place:'오림 · 장강 위의 누선',art:7,cast:[{name:'조조',look:'civil',at:[56,52],face:'left'},{name:'사마의',look:'strategist',at:[36,60],face:'right'},{name:'조진',look:'cavalry',at:[22,58],face:'right'},{name:'곽가',look:'civil'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'208년 겨울. 형주를 삼킨 조조의 대군이 장강에 닿았다. 강 건너 적벽에는 손권과 유비의 깃발이 섰다.'},
          {say:'조조',line:'달 밝고 별 드문데 까마귀가 남으로 나는구나! 중달, 이 강만 건너면 천하가 하나다.',to:'사마의'},
          {say:'조조',line:'…봉효가 살아 있었다면, 이 강을 보며 무어라 했을꼬.',unless:'srv_guojia'},
          {enter:'곽가',at:[70,58],from:'right',when:'srv_guojia'},
          {say:'곽가',line:'승상, 북쪽 병사들이 배멀미에 쓰러집니다. 이런 때 오는 좋은 계책은 대개 남이 보낸 것이지요.',when:'srv_guojia'},
          {enter:'전령',at:[84,70],from:'right'},
          {say:'전령',line:'방통이라는 선비가 와서, 배를 쇠사슬로 묶으면 병사들이 땅처럼 걸을 수 있다 하옵니다!'},
          {emote:'사마의',text:'…'},
          {exit:'전령',to:'right'},
        ]},
      {place:'오림 · 깊은 밤의 군막',art:14,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조비',look:'civil'},{name:'사마랑',look:'civil'},{name:'조진',look:'cavalry',at:[64,58],face:'left'}],
        steps:[
          {enter:'조비',at:[54,58],from:'right'},
          {say:'조비',line:'중달, 업성에서 기별이 왔소. 아우 자건의 곁에 양수와 정의가 모여 아버님께 내 흉을 본다 하오.',to:'사마의'},
          {say:'조진',line:'사슬이니 세자니, 중달 머리가 둘이라도 모자라겠군.'},
          {enter:'사마랑',at:[18,66],from:'left'},
          {say:'사마랑',line:'의야, 갓 태어난 사가 네 얼굴을 모른다. 어디에 서든 살아서 돌아와야 한다.',to:'사마의'},
          {move:'사마의',to:[42,62]},
          {say:'사마의',line:'강 위의 사슬은 불을 기다리고, 업성의 붓은 세자를 기다립니다. 둘 다 지금 잡아야 할 줄입니다. …허나 손은 하나뿐이지요.'},
          {choice:'사마의',options:[
            {id:'chibi',text:'적벽의 화공을 간파한다. 승상께 연환계와 고육계를 아뢴다',reply:'사슬은 풀 수 있을 때 풀어야 합니다. 이 강을 건너면 천하의 셋 가운데 둘이 한 사람의 것이 됩니다.',answer:{speaker:'조진',line:'하하, 역시! 강 건너 주유의 얼굴이 보고 싶군!'},note:'가상 · 적벽을 넘은 위 — 적벽 장강, 우두머리 주유'},
            {id:'heir',text:'조비를 세자로 굳힌다. 세자의 스승이 된다',reply:'강은 내년에도 흐릅니다. 허나 세자의 자리는 한 번 정해지면 백 년을 갑니다.',answer:{speaker:'조비',line:'…그대가 내 곁에 선다면, 나는 아우의 시를 두려워하지 않겠소.'},note:'가상 · 세자의 스승 — 한중 정군산, 우두머리 유비'},
          ]},
          {exit:'조비',to:'right'},
        ]},
    ]},

  {id:'fate:2:yuan',year:'202년 · 업성',title:'원소의 죽음',
    synopsis:'관도를 이긴 원소도 병을 이기지 못했다. 원담과 원상 형제가 후계를 두고 칼을 겨누고, 조조는 허창에서 재기를 노린다. 원씨의 책사로 남을 것인가, 사마씨의 가장으로 설 것인가.',
    scenes:[
      {place:'업성 · 원소의 침전',art:5,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'원상',look:'cavalry',at:[56,56],face:'left'},{name:'원담',look:'infantry'},{name:'심배',look:'strategist',at:[70,52],face:'left'},{name:'문추',look:'cavalry',at:[16,58],face:'right'}],
        steps:[
          {narrate:'202년 여름. 관도를 이긴 원소도 피를 토하는 병을 이기지 못하고 업성에서 눈을 감았다. 후계는 정해지지 않았다.'},
          {say:'심배',line:'원 공께서는 생전에 셋째 공자를 아끼셨소. 하북은 원상 공자께서 이으셔야 하오.'},
          {enter:'원담',at:[84,64],from:'right'},
          {say:'원담',line:'장자를 두고 아우가 잇는다? 청주의 군을 이끌고 온 내가 들러리냐!'},
          {emote:'원상',text:'분노'},
          {move:'원담',to:[78,60]},
          {say:'원상',line:'중달! 관도를 이긴 셈은 그대의 것이었다. 그대가 누구 편에 서는지 하북이 보고 있다.',to:'사마의'},
          {emote:'사마의',text:'…'},
        ]},
      {place:'업성 · 달 비친 회랑',art:13,cast:[{name:'사마의',look:'strategist',at:[36,62],face:'right'},{name:'사마랑',look:'civil'},{name:'장합',look:'spear',at:[62,56],face:'left'},{name:'문추',look:'cavalry',at:[76,60],face:'left'}],
        steps:[
          {enter:'사마랑',at:[16,66],from:'left'},
          {say:'사마랑',line:'아버님께서 하내에서 기다리신다. 형제가 칼을 겨누는 집에 오래 머물면 우리 집안도 그 칼에 베인다.',to:'사마의'},
          {say:'장합',line:'나는 원씨의 녹을 먹은 몸이오. 원씨를 떠나라 하면 따르기 어렵소. 허나 그대의 셈이라면 귀는 열어 두겠소.'},
          {move:'문추',to:[54,60]},
          {say:'문추',line:'백마에서 살아난 목숨이오. 그대가 어디로 가든 내 말머리는 그대를 따르겠소.',to:'사마의'},
          {move:'사마의',to:[42,62]},
          {choice:'사마의',options:[
            {id:'hebei',text:'원상을 후계로 세워 하북을 하나로 묶고, 원씨의 천하를 세운다',reply:'형제를 둘 다 살리는 길은 하나를 세우고 하나를 달래는 것뿐입니다. 하북이 하나면 허창은 오래 버티지 못합니다.',answer:{speaker:'장합',line:'그렇다면 내 창은 허창을 향하겠소.'},note:'가상 · 원씨의 천하 — 허창 평원, 우두머리 순욱'},
            {id:'independent',text:'원씨 형제를 버리고 고향 하내에서 사마씨의 깃발을 세운다',reply:'남의 집안싸움에 내 집안을 걸 수는 없습니다. 형님, 하내로 돌아갑시다. 이번에는 우리 깃발을 들고.',answer:{speaker:'사마랑',line:'…각오는 되었다. 아버님께 내가 먼저 말씀드리마.'},note:'가상 · 사마씨의 나라 — 하내 산지, 우두머리 원담'},
          ]},
          {exit:'장합',to:'right'},
        ]},
    ]},
];

// ───────────────────────── 중편 · 적벽을 넘은 위(chibi) ─────────────────────────
const CHIBI:Chapters=[
  {id:'IF2-cb-1',year:'208년',title:'연환의 사슬',
    synopsis:'배를 사슬로 묶으라는 방통의 계책. 젊은 사마의는 그 사슬이 불을 기다리는 사슬임을 알아보았다. 때마침 장간이 훔쳐 온 편지 한 장에 형주 수군의 도독 채모의 목이 걸렸다.',
    scenes:[
      {place:'오림 · 사슬로 묶인 수채',art:15,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조조',look:'civil',at:[56,54],face:'left'},{name:'채모',look:'infantry',at:[74,62],face:'left'},{name:'장간',look:'civil'},{name:'위군 병사',look:'infantry',at:[86,70],face:'left'}],
        steps:[
          {narrate:'사마의는 강을 골랐다. 수채의 큰 배들이 쇠사슬로 이어져, 북쪽 병사들이 땅처럼 그 위를 걸었다.'},
          {enter:'장간',at:[44,66],from:'left'},
          {say:'장간',line:'승상! 주유의 군막에서 훔쳐 온 편지입니다. 채모와 장윤이 주유와 내통한다 쓰여 있습니다!',to:'조조'},
          {emote:'조조',text:'분노'},
          {move:'위군 병사',to:[80,64]},
          {emote:'채모',text:'땀'},
          {say:'채모',line:'승상, 억울하옵니다! 북쪽 군에 물을 아는 자는 저 하나뿐이옵니다!'},
          {move:'사마의',to:[38,62]},
          {say:'사마의',line:'주유가 그토록 귀한 편지를 장간 공 같은 이에게 들킬 리 없습니다. 그리고 사슬로 묶인 배는, 불이 붙으면 함께 탑니다.',to:'조조'},
          {choice:'사마의',options:[
            {id:'caimao',text:'채모를 살려 수군을 맡기고, 사슬의 이음새를 그에게 맡긴다',reply:'편지는 주유의 붓입니다. 물을 아는 장수를 베는 것이야말로 주유가 바라는 일입니다.',answer:{speaker:'채모',line:'…이 목숨, 물 위에서 갚겠소. 사슬은 한 번에 풀리게 고쳐 놓으리다.'},note:'채모(수군)가 영입된다',effects:[{kind:'recruit',name:'채모',unitClass:'navy'},{kind:'flag',flag:'cb_caimao'}]},
            {id:'ring',text:'사슬은 그대로 두되, 도끼 한 번에 끊기는 고리를 단다',reply:'방통이 바라는 것은 사슬이 아니라 불입니다. 불이 오면 끊으면 됩니다.',note:'책략 MP +15',effects:[{kind:'insight'}]},
            {id:'hunt',text:'수채를 떠나려는 방통을 붙잡으러 곧장 나간다',reply:'계책을 낸 자가 아직 강가에 있습니다. 봉추의 날개가 펴지기 전에 꺾지요.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'장간',to:'left'},
        ]},
    ],
    after:[
      {place:'오림 · 사슬을 푼 수채',art:7,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'채모',look:'infantry'},{name:'조진',look:'cavalry',at:[54,58],face:'left'}],
        steps:[
          {narrate:'방통은 작은 배를 타고 남쪽으로 달아났다. 봉추의 계책은 반쯤 끊겼다.'},
          {enter:'채모',at:[70,62],from:'right',when:'cb_caimao'},
          {say:'채모',line:'사슬마다 쇠고리를 달았소. 불이 붙으면 배들이 흩어질 거요. 다음은 강동이 무엇을 보낼지 보는 일이오.',when:'cb_caimao'},
          {emote:'조진',text:'?'},
          {say:'조진',line:'중달, 강동에서 늙은 장수 하나가 매를 맞았다는 소문이 돈다. 주유에게 대들었다나.'},
          {say:'사마의',line:'매 맞은 장수는 항복해 옵니다. 그리고 그가 끌고 오는 배에는 대개 불이 실려 있지요.'},
          {exit:'조진',to:'right'}
        ]},
    ]},

  {id:'IF2-cb-2',year:'208년',title:'고육계',
    synopsis:'노장 황개가 매를 맞고 투항해 왔다. 등의 상처가 진짜라 해도, 그가 끌고 온 배에는 기름과 마른 풀이 실려 있다. 사신으로 온 감택의 눈빛을 사마의가 읽는다.',
    scenes:[
      {place:'오림 · 바람 부는 강가',art:7,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조조',look:'civil',at:[50,54],face:'right'},{name:'감택',look:'civil'},{name:'조진',look:'cavalry',at:[16,56],face:'right'},{name:'위군 병사',look:'infantry',at:[64,72],face:'left'}],
        steps:[
          {enter:'감택',at:[76,60],from:'right'},
          {say:'감택',line:'황공복 장군이 등의 살이 터지도록 맞았소. 주유를 버리고 승상께 배를 이끌고 오겠다 하오.',to:'조조'},
          {say:'조조',line:'하하! 강동에도 사람이 있구나. 언제 온다더냐?'},
          {move:'사마의',to:[40,62]},
          {say:'사마의',line:'감택 공, 하나만 묻지요. 황 장군의 배는, 바람이 동남으로 바뀌는 날에 오시겠지요?',to:'감택'},
          {emote:'감택',text:'땀'},
          {say:'감택',line:'…바, 바람이야 하늘의 일이니 어찌 알겠소.'},
          {choice:'사마의',options:[
            {id:'trap',text:'항복을 받는 척하고, 배들을 강 한가운데서 멈춰 세운다',reply:'항복하는 배라면 멈추라는 말에 멈출 겁니다. 멈추지 않는 배는 적입니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'},{kind:'flag',flag:'cb_trap'}]},
            {id:'sanjiang',text:'바람이 바뀌기 전에 먼저 친다. 삼강구의 오군 수채로 간다',reply:'불을 기다리는 쪽이 아니라 놓는 쪽이 되겠습니다. 황개를 막은 뒤 곧장 삼강구로 내려갑니다.',answer:{speaker:'조진',line:'좋아! 기다리는 건 질색이었다!'},note:'다음 가상 전장이 「삼강구 기습」으로 바뀐다',effects:[{kind:'path',tale:'IF2-cb-sanjiang'},{kind:'flag',flag:'cb_sanjiang'}]},
            {id:'face',text:'감택을 돌려보내고, 다가오는 배를 정면에서 맞는다',reply:'계책이 드러난 고육계는 그저 매 맞은 노인일 뿐입니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'감택',to:'right'},
          {move:'위군 병사',to:[72,70]},
        ]},
    ],
    after:[
      {place:'오림 · 동남풍 부는 밤',art:15,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[54,56],face:'left'},{name:'위군 병사',look:'infantry'}],
        steps:[
          {narrate:'그날 밤 동남풍이 불었다. 그러나 불배들은 강 한가운데서 가라앉았다. 적벽의 불은 끝내 일어나지 않았다.'},
          {enter:'위군 병사',at:[72,70],from:'right'},
          {say:'위군 병사',line:'황개는 부하들이 건져 달아났습니다! 배에서 기름 항아리가 수백 개 나왔습니다!'},
          {emote:'조조',text:'!'},
          {say:'조조',line:'…중달, 오늘 밤 그대가 없었다면 내 백만 대군이 강 위에서 횃불이 되었겠구나.',to:'사마의'},
          {exit:'위군 병사',to:'right'}
        ]},
    ]},

  {id:'IF2-cb-3',year:'208년',title:'장강 도하',
    synopsis:'불이 일어나지 않은 장강을 위군이 건넌다. 그 선봉을 오의 감녕이 백 명의 결사대로 막아선다. 비단 돛을 단 강도 출신의 맹장, 그를 넘으면 강동이다.',
    scenes:[
      {place:'장강 남안 · 도하 전야',art:15,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'조진',look:'cavalry',at:[48,58],face:'right'},{name:'곽회',look:'archer'},{name:'위군 병사',look:'infantry',at:[66,70],face:'right'}],
        steps:[
          {narrate:'위군의 선봉이 남안의 모래톱에 닿았다. 밤이 깊자 강 위에서 방울 소리가 들려왔다.'},
          {emote:'위군 병사',text:'?'},
          {enter:'곽회',at:[80,64],from:'right'},
          {say:'곽회',line:'방울 소리입니다! 감녕이 백 명의 결사대를 데리고 진영을 휘젓고 다닙니다!'},
          {move:'위군 병사',to:[56,72]},
          {say:'조진',line:'겨우 백 명에게 만 명이 떨고 있다니! 중달, 내가 나가서 목을 따 오겠다!'},
          {move:'사마의',to:[40,62]},
          {choice:'사마의',options:[
            {id:'torch',text:'진영마다 횃불을 밝히고, 움직이지 말고 제자리를 지키게 한다',reply:'야습은 어둠과 소란을 먹고 삽니다. 둘 다 주지 않으면 백 명은 그냥 백 명입니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'empty',text:'빈 진영 하나를 내주어 감녕을 깊이 끌어들인다',reply:'백 명이 들어올 길은 열어 두고, 나갈 길은 닫습니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'shout',text:'"강동이 코앞이다"라고 외쳐 군의 기세를 올린다',reply:'강을 건넌 병사에게 필요한 것은 돌아갈 배가 아니라 나아갈 이유입니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {say:'조진',line:'좋다, 그 셈대로 하지. 대신 마지막 일격은 내 몫이야!'},
        ]},
    ],
    after:[
      {place:'장강 남안 · 밝아 오는 모래톱',art:15,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조진',look:'cavalry',at:[52,58],face:'left'},{name:'곽회',look:'archer',at:[68,62],face:'left'}],
        steps:[
          {narrate:'감녕의 결사대는 방울을 버리고 물러났다. 위군이 강동의 땅을 밟았다.'},
          {emote:'조진',text:'♪'},
          {say:'곽회',line:'주유가 적벽의 남안에 모든 수군을 모았습니다. 마지막 싸움이 될 겁니다.'},
          {move:'사마의',to:[42,62]},
          {say:'사마의',line:'주유는 불을 잃었습니다. 불 없는 주유가 무엇을 들고 나올지, 보러 가지요.'},
          {exit:'곽회',to:'right'}
        ]},
    ]},

  {id:'IF2-cb-sanjiang',year:'208년',title:'삼강구 기습',
    synopsis:'불을 기다리지 않고 먼저 놓기로 했다. 사마의는 날랜 배를 모아 오군의 수채가 있는 삼강구로 내려간다. 그곳은 오하아몽이라 불리던 여몽이 지킨다.',
    scenes:[
      {place:'삼강구 · 오군 수채 앞',art:7,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조진',look:'cavalry',at:[18,56],face:'right'},{name:'채모',look:'infantry'},{name:'여몽',look:'infantry',at:[84,54],face:'left'},{name:'위군 병사',look:'infantry',at:[48,72],face:'right'}],
        steps:[
          {narrate:'안개 낀 새벽, 위군의 날랜 배들이 물살을 타고 삼강구로 내려갔다.'},
          {enter:'채모',at:[44,62],from:'left',when:'cb_caimao'},
          {say:'채모',line:'삼강구는 물길이 셋으로 갈리오. 가운데 물길로 들면 오군의 수채가 옆구리를 보이오.',when:'cb_caimao'},
          {say:'여몽',line:'예전의 아몽이 아니다! 글을 읽은 여자명이 너희의 셈을 읽고 있었다!'},
          {emote:'조진',text:'분노'},
          {move:'위군 병사',to:[58,70]},
          {move:'사마의',to:[36,62]},
          {choice:'사마의',options:[
            {id:'fire',text:'오군 수채에 쌓인 기름배에 먼저 불을 놓는다',reply:'주유가 우리에게 쓰려던 불을, 그들의 수채에 돌려줍니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'three',text:'세 물길로 나누어 동시에 들어간다',reply:'여몽이 글을 읽었다면, 세 갈래의 글은 한 번에 읽지 못할 겁니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
            {id:'mist',text:'안개가 걷힐 때까지 배를 멈추고 여몽의 배치를 읽는다',reply:'글을 읽는 자에게는 침묵이 가장 어려운 글입니다.',note:'책략 MP +15',effects:[{kind:'insight'}]},
          ]},
          {exit:'위군 병사',to:'right'},
        ]},
    ],
    after:[
      {place:'삼강구 · 불타는 오군 수채',art:1,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조진',look:'cavalry',at:[52,58],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'삼강구의 오군 수채가 불탔다. 강동이 위에게 쓰려던 불이었다.'},
          {enter:'전령',at:[72,66],from:'right'},
          {say:'전령',line:'주유가 남은 군을 모두 적벽 남안으로 모았습니다! 등 뒤의 수채를 잃고 마지막 싸움을 하려 합니다!'},
          {emote:'사마의',text:'…'},
          {say:'사마의',line:'불을 잃고 등까지 잃었습니다. 주유는 이제 칼 하나로 섭니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'chibi:boss',year:'208년',title:'적벽의 주유',
    synopsis:'불은 일어나지 않았다. 등 뒤를 잃은 주유가 적벽 남안에 남은 수군을 모두 모았다. 미주랑이라 불린 강동의 대도독이 마지막 칼을 든다. 그를 꺾으면 강동의 문이 열린다.',
    scenes:[
      {place:'적벽 남안 · 붉은 절벽 아래',art:7,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조조',look:'civil',at:[16,56],face:'right'},{name:'조진',look:'cavalry',at:[44,58],face:'right'},{name:'주유',look:'strategist',at:[84,50],face:'left'},{name:'오군 병사',look:'crossbow',at:[72,66],face:'left'}],
        steps:[
          {narrate:'붉은 절벽 아래, 강동의 마지막 수군이 늘어섰다. 깃발에는 주(周)자가 펄럭였다.'},
          {say:'주유',line:'북쪽 사람이 물 위에서 나를 이기려 하는가! 불이 없으면 칼로, 칼이 없으면 이 몸으로 막겠다!'},
          {emote:'오군 병사',text:'분노'},
          {move:'오군 병사',to:[66,68]},
          {say:'조조',line:'미주랑… 아깝구나. 저런 자가 내 곁에 있었다면.'},
          {move:'사마의',to:[36,62]},
          {say:'사마의',line:'주유의 뒤에는 동남풍을 빌렸다는 제갈량이 있고, 주유의 위에는 그를 의심하기 시작한 손권이 있습니다.',to:'조조'},
          {emote:'조진',text:'?'},
          {choice:'사마의',options:[
            {id:'kongming',text:'제갈량의 배를 먼저 찾아 강동과 유비의 사이를 끊는다',reply:'연합은 두 사람이 서로를 믿을 때만 연합입니다. 한 사람이 떠나면 주유는 혼자입니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'letter',text:'손권에게 "주유가 강동의 왕이 되려 한다"는 글을 흘린다',reply:'주유를 꺾는 것은 칼이 아니라, 그를 아끼는 주인의 의심일 겁니다.',answer:{speaker:'조조',line:'허허, 모진 셈이로구나. 허나 그 모짊이 내 천하를 앞당기겠지.'},note:'책략 MP +15. 주유의 이름에 그늘이 남는다',effects:[{kind:'insight'},{kind:'flag',flag:'cb_letter'}]},
            {id:'banner',text:'승상의 깃발을 앞세워 붉은 절벽 아래로 정면 상륙한다',reply:'강을 건넌 백만이 여기 있다는 것을, 강동의 모든 눈에 보이게 하겠습니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
        ]},
    ],
    after:[
      {place:'적벽 · 연기 걷힌 절벽',art:15,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조조',look:'civil',at:[52,56],face:'left'},{name:'채모',look:'infantry'}],
        steps:[
          {narrate:'주유는 옆구리에 화살을 맞고 시상으로 물러났다. 위군의 깃발이 붉은 절벽 위에 꽂혔다.'},
          {narrate:'주군의 의심 속에 물러난 주유는 다시는 군을 이끌지 못했다.',when:'cb_letter'},
          {enter:'채모',at:[72,62],from:'right',when:'cb_caimao'},
          {say:'채모',line:'형주와 강동의 물길이 이제 모두 승상의 것이오. 내 수군이 건업까지 길을 내겠소.',when:'cb_caimao'},
          {say:'조조',line:'천하의 셋 가운데 둘이다. 중달, 이 늙은이가 살아서 셋을 다 볼 수 있겠느냐?',to:'사마의'},
          {emote:'사마의',text:'…'},
          {exit:'조조',to:'right'}
        ]},
    ]},
];

// ───────────────────────── 중편 · 세자의 스승(heir) ─────────────────────────
const HEIR:Chapters=[
  {id:'IF2-hr-1',year:'219년',title:'정군산',
    synopsis:'적벽 대신 업성을 고른 사마의는 조비를 세자로 굳히고 세자의 스승이 되었다. 그 공으로 한중을 맡은 그의 앞에, 노장 황충이 정군산 꼭대기에 올랐다. 하후연이 쓰러졌어야 할 그 산을, 이번에는 사마의가 먼저 오른다.',
    scenes:[
      {place:'업성 · 동궁의 서재',art:12,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조비',look:'civil',at:[56,56],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'적벽의 불은 일어났고, 조조는 북으로 물러났다. 그 사이 사마의는 업성에 머물며 조비의 곁을 지켰다. 217년, 조비가 세자가 되었다.'},
          {say:'조비',line:'스승님, 아버님께서 한중을 그대에게 맡기라 하셨소. 유비가 한중을 노린다 하오.',to:'사마의'},
          {enter:'전령',at:[80,68],from:'right'},
          {say:'전령',line:'정군산의 하후연 장군이 위태롭습니다! 촉의 노장 황충이 산꼭대기를 노리고 있습니다!'},
          {emote:'조비',text:'!'},
          {move:'사마의',to:[42,62]},
          {say:'사마의',line:'세자를 지키는 길은 세자의 스승이 이기는 것뿐입니다. 다녀오겠습니다.'},
          {exit:'전령',to:'right'},
        ]},
      {place:'정군산 · 산기슭 진영',art:3,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'하후연',look:'cavalry',at:[58,56],face:'left'},{name:'조진',look:'cavalry',at:[18,56],face:'right'},{name:'곽회',look:'archer'}],
        steps:[
          {say:'하후연',line:'중달인가! 황충 늙은이가 산 위에서 내 녹각을 불태우고 있소. 당장 내려가 목을 베겠소!'},
          {enter:'곽회',at:[74,66],from:'right'},
          {say:'곽회',line:'산꼭대기가 비어 있습니다. 황충은 아직 서쪽 봉우리에 있습니다.'},
          {move:'사마의',to:[42,62]},
          {choice:'사마의',options:[
            {id:'yuan',text:'하후연 장군께 뒤를 받쳐 달라 청하고, 내가 먼저 꼭대기에 오른다',reply:'승상께서 장군께 "백지장군이 되지 말라" 하셨지요. 오늘은 제 뒤에서 그 용맹을 아껴 주십시오.',answer:{speaker:'하후연',line:'…허허, 젊은 놈에게 꾸중을 듣는구나. 좋다. 이번만은 뒤에 서지.'},note:'하후연(기병)이 영입된다',effects:[{kind:'recruit',name:'하후연',unitClass:'cavalry'},{kind:'flag',flag:'hr_yuan_saved'}]},
            {id:'night',text:'밤에 횃불 없이 산을 올라 황충보다 먼저 꼭대기를 쥔다',reply:'노장은 해가 뜨기를 기다립니다. 우리는 기다리지 않습니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'shout',text:'모든 진영의 북을 울려 황충을 산 아래로 꾀어낸다',reply:'노장일수록 북소리를 참지 못합니다. 그가 내려오면 산은 우리 것입니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {emote:'하후연',text:'…'},
        ]},
    ],
    after:[
      {place:'정군산 · 꼭대기',art:3,cast:[{name:'사마의',look:'strategist',at:[36,62],face:'right'},{name:'하후연',look:'cavalry'},{name:'조진',look:'cavalry',at:[54,58],face:'left'}],
        steps:[
          {narrate:'황충은 정군산을 내주고 물러났다. 한중의 첫 봉우리가 위의 것이 되었다.'},
          {enter:'하후연',at:[70,58],from:'right',when:'hr_yuan_saved'},
          {say:'하후연',line:'꼭대기에서 내려다보니 알겠군. 내가 저 아래로 뛰어들었다면 지금쯤 황충의 칼끝에 있었을 거요.',when:'hr_yuan_saved'},
          {narrate:'하후연은 끝내 산 아래로 뛰쳐나갔다가 크게 다쳐 장안으로 실려 갔다.',unless:'hr_yuan_saved'},
          {emote:'조진',text:'!'},
          {say:'조진',line:'한수 쪽에 조운이 진을 쳤는데, 진채 문이 활짝 열려 있다는군. 이게 무슨 수작이지?'},
          {exit:'조진',to:'right'}
        ]},
    ]},

  {id:'IF2-hr-2',year:'219년',title:'한수의 빈 진채',
    synopsis:'한수 가에 조운이 진채의 문을 활짝 열어 두었다. 공성계인가, 함정인가. 군사들이 머뭇거리는 사이 사마의는 문 안으로 군을 들이기로 한다. 다만 그 다음 걸음은 아직 정하지 않았다.',
    scenes:[
      {place:'한수 · 문 열린 진채 앞',art:15,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'서황',look:'heavy',at:[16,56],face:'right'},{name:'조진',look:'cavalry',at:[44,58],face:'right'},{name:'조운',look:'heavy',at:[84,54],face:'left'},{name:'위군 병사',look:'infantry',at:[60,72],face:'right'}],
        steps:[
          {narrate:'한수 가의 촉군 진채는 문이 활짝 열려 있었다. 깃발은 누웠고, 북소리도 없었다. 문 앞에는 은빛 갑옷의 장수 하나뿐.'},
          {say:'조운',line:'상산의 조자룡이 여기 있다. 들어올 자신이 있으면 들어오라.'},
          {emote:'위군 병사',text:'땀'},
          {move:'위군 병사',to:[52,74]},
          {say:'서황',line:'복병이 있을 거요. 장판에서 저 자 하나에게 조공의 대군이 휘둘렸소.',to:'사마의'},
          {move:'사마의',to:[38,62]},
          {say:'사마의',line:'빈 문은 겁 많은 자를 쫓아내려고 엽니다. 복병이 많다면 문을 닫았겠지요. 들어갑니다. 다만 그 뒤가 문제입니다.'},
          {choice:'사마의',options:[
            {id:'micang',text:'진채를 지난 뒤에는 양평관이 아니라 미창산 샛길로 돈다',reply:'조운이 문을 열어 두고 시간을 버는 것은 양평관을 굳히기 위해서입니다. 굳은 문은 두고, 옆길로 갑니다.',answer:{speaker:'서황',line:'미창산 샛길은 서량 사람들이 지킨다 들었소. 쉬운 길은 아닐 거요.'},note:'다음 가상 전장이 「미창 산길」로 바뀐다',effects:[{kind:'path',tale:'IF2-hr-micang'},{kind:'flag',flag:'hr_micang'}]},
            {id:'xuhuang',text:'서황 장군께 강가를 맡기고, 우리는 진채 안으로 든다',reply:'복병이 있다면 강가에서 나옵니다. 장군의 도끼가 거기 있으면 저는 안심하고 들어갑니다.',answer:{speaker:'서황',line:'맡겨 두시오. 강가에 개미 한 마리 지나가지 못하게 하리다.'},note:'서황의 부대가 초록 깃발로 돕는다',effects:[{kind:'reinforce',name:'서황',unitClass:'heavyCav',side:'npc'}]},
            {id:'drum',text:'북소리가 나면 멈추고, 그치면 다시 나아가게 한다',reply:'조운의 북은 놀라게 하려는 북입니다. 놀라지만 않으면 그저 소리입니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
          ]},
        ]},
    ],
    after:[
      {place:'한수 · 텅 빈 진채 안',art:16,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조진',look:'cavalry',at:[50,58],face:'left'},{name:'곽회',look:'archer'}],
        steps:[
          {narrate:'조운은 물러났다. 진채 안에는 북 몇 개와 쇠뇌 몇 틀뿐이었다.'},
          {say:'조진',line:'정말 비어 있었군! 중달, 어떻게 알았나?'},
          {say:'사마의',line:'알았던 게 아닙니다. 빈 문의 반은 연 자의 담력이고, 나머지 반은 보는 자의 겁입니다. 저는 겁을 하나 덜 냈을 뿐입니다.'},
          {enter:'곽회',at:[72,64],from:'right'},
          {say:'곽회',line:'미창산 샛길에 서량의 기병이 보입니다. 깃발에 마(馬)자가 있습니다.',when:'hr_micang'},
          {say:'곽회',line:'양평관에 위연이 군을 모았습니다. 관 위에 쇠뇌가 빽빽합니다.',unless:'hr_micang'},
          {emote:'사마의',text:'…'},
          {exit:'조진',to:'right'}
        ]},
    ]},

  {id:'IF2-hr-3',year:'219년',title:'양평관',
    synopsis:'한중의 관문 양평관을 위연이 지킨다. 반골이라 불리지만 그 용맹만은 유비도 아끼는 장수다. 관을 넘으면 유비의 본진이다.',
    scenes:[
      {place:'양평관 · 관 아래',art:17,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'조진',look:'cavalry',at:[18,56],face:'right'},{name:'곽회',look:'archer',at:[46,60],face:'right'},{name:'위연',look:'infantry',at:[84,46],face:'left'},{name:'위군 병사',look:'infantry',at:[60,72],face:'right'}],
        steps:[
          {narrate:'양평관. 한중으로 드는 마지막 관문 위에 위연의 깃발이 섰다.'},
          {say:'위연',line:'위의 서생이 한중을 넘보느냐! 이 관은 이 위문장의 목을 베기 전에는 열리지 않는다!'},
          {emote:'조진',text:'분노'},
          {move:'곽회',to:[52,62]},
          {say:'곽회',line:'관 위의 쇠뇌가 우리 진을 겨누고 있습니다. 정면은 무겁습니다.'},
          {move:'위군 병사',to:[54,74]},
          {move:'사마의',to:[38,62]},
          {choice:'사마의',options:[
            {id:'rope',text:'밤에 관 옆 절벽으로 밧줄을 내려 관 안을 친다',reply:'관문은 앞을 보고 서 있습니다. 절벽은 아무도 보지 않지요.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'wait',text:'위연이 성질을 못 참고 나올 때까지 관 아래에서 욕을 듣는다',reply:'위연은 지키는 장수가 아니라 나가는 장수입니다. 그가 관을 나서면 관은 빈 껍데기입니다.',note:'책략 MP +15',effects:[{kind:'insight'}]},
            {id:'shout',text:'세자 저하의 깃발을 높이 들어 군의 기세를 올린다',reply:'우리 뒤에는 위의 다음 주인이 계십니다. 그 깃발 아래에서 물러서는 자는 없습니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
        ]},
    ],
    after:[
      {place:'양평관 · 열린 관문',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조진',look:'cavalry',at:[52,58],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'위연은 관을 버리고 남쪽으로 물러났다. 양평관이 열렸다.'},
          {enter:'전령',at:[72,66],from:'right'},
          {say:'전령',line:'유비가 면수 남쪽에 본진을 펼쳤습니다! 법정이 그 곁에서 군을 부린다 하옵니다!'},
          {emote:'조진',text:'!'},
          {say:'사마의',line:'한중왕이 되려는 자가 몸소 나왔습니다. 이 싸움이 세자 저하의 앞날을 정합니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'IF2-hr-micang',year:'219년',title:'미창 산길',
    synopsis:'양평관을 두고 미창산 샛길로 돌았다. 좁은 산길 끝에서 서량의 금마초가 기다린다. 아비와 일족을 조조에게 잃은 사내다. 그의 창끝에는 원한이 서려 있다.',
    scenes:[
      {place:'미창산 · 좁은 골짜기',art:4,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'조진',look:'cavalry',at:[16,56],face:'right'},{name:'곽회',look:'archer',at:[44,60],face:'right'},{name:'마초',look:'cavalry',at:[84,52],face:'left'},{name:'서량 기병',look:'horseArcher',at:[72,64],face:'left'}],
        steps:[
          {narrate:'미창산의 샛길은 말 두 필이 겨우 나란히 설 만큼 좁았다. 골짜기 끝에 흰 갑옷의 기병들이 늘어섰다.'},
          {say:'마초',line:'조씨의 개들이 내 앞에 왔구나! 동관에서 못다 한 원한, 이 골짜기에서 갚겠다!'},
          {emote:'서량 기병',text:'분노'},
          {move:'서량 기병',to:[64,64]},
          {say:'조진',line:'금마초… 조공의 수염을 자르게 했던 그 자인가.'},
          {move:'사마의',to:[36,62]},
          {say:'사마의',line:'마초는 분노로 싸웁니다. 분노는 빠르지만 길을 보지 못합니다.'},
          {choice:'사마의',options:[
            {id:'narrow',text:'골짜기 가장 좁은 곳에 창병을 세워 기병의 발을 묶는다',reply:'서량의 말은 들판에서 강합니다. 이 골짜기는 들판이 아닙니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'rumor',text:'"한수가 이미 위에 항복했다"는 소문을 서량 기병들 사이에 퍼뜨린다',reply:'마초의 기병은 마초를 따르는 것이 아니라 서량을 따릅니다. 서량이 흔들리면 기병도 흔들립니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'cliff',text:'곽회의 궁병을 양쪽 비탈에 숨겨 두고 마초를 끌어들인다',reply:'분노한 기병은 길이 좁아질수록 더 빨리 달립니다. 그 끝에 화살을 둡니다.',answer:{speaker:'곽회',line:'비탈에 올라가 숨을 죽이겠습니다. 신호만 주십시오.'},note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
          ]},
        ]},
    ],
    after:[
      {place:'미창산 · 골짜기 출구',art:11,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'곽회',look:'archer',at:[52,60],face:'left'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'마초의 기병은 골짜기를 버리고 흩어졌다. 샛길 끝으로 양평관의 뒤가 보였다.'},
          {enter:'전령',at:[72,66],from:'right'},
          {say:'전령',line:'양평관의 위연이 등 뒤가 뚫렸다는 말에 관을 버렸습니다! 유비가 면수 남쪽에 본진을 펼쳤습니다!'},
          {emote:'곽회',text:'!'},
          {say:'사마의',line:'관문은 두드리지 않고 지났습니다. 이제 한중왕을 만나러 가지요.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'heir:boss',year:'219년',title:'면수의 한중왕',
    synopsis:'유비가 몸소 면수 남쪽에 본진을 펼쳤다. 곁에는 꾀주머니 법정이 있다. 한중을 지키면 세자 조비의 자리도, 세자의 스승의 자리도 굳어진다.',
    scenes:[
      {place:'한중 · 면수 북안의 군막',art:14,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'조진',look:'cavalry',at:[18,56],face:'right'},{name:'곽회',look:'archer',at:[50,58],face:'left'},{name:'하후연',look:'cavalry'},{name:'전령',look:'infantry'}],
        steps:[
          {narrate:'면수 남쪽에 유비의 본진이 섰다. 한중을 놓고 벌이는 마지막 싸움이었다.'},
          {say:'곽회',line:'유비의 곁에 법정이 있습니다. 유비의 군은 법정이 부리고, 유비는 사람을 모읍니다.',to:'사마의'},
          {enter:'하후연',at:[64,58],from:'right',when:'hr_yuan_saved'},
          {say:'하후연',line:'이번에는 뒤에 서지 않겠소. 정군산에서 아낀 용맹, 여기서 쓰겠소!',when:'hr_yuan_saved'},
          {enter:'전령',at:[80,70],from:'right'},
          {say:'전령',line:'상용의 맹달에게서 밀사가 왔습니다. 유비가 자신을 믿지 않는다며 투덜댄다 합니다.'},
          {emote:'사마의',text:'…'},
          {move:'사마의',to:[40,62]},
          {choice:'사마의',options:[
            {id:'mengda',text:'상용의 맹달에게 답신을 보내 위로 맞아들인다',reply:'맹달은 믿을 사람은 아닙니다. 허나 오늘은 쓸 사람이지요. 믿지 않고 쓰는 법도 있습니다.',answer:{speaker:'조진',line:'저런 자를 받아들여도 괜찮겠나? 언젠가 또 등을 돌릴 텐데.'},note:'맹달(보병)이 영입된다. 언젠가 다시 돌아설지 모른다',effects:[{kind:'recruit',name:'맹달',unitClass:'infantry'},{kind:'flag',flag:'hr_meng'}]},
            {id:'fazheng',text:'유비가 아니라 법정을 노린다',reply:'유비의 손발을 부리는 것은 법정의 머리입니다. 머리를 흔들면 손발이 어긋납니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'river',text:'면수를 등지고 진을 쳐 물러설 곳을 없앤다',reply:'세자 저하의 스승이 한중에서 물러섰다는 말은 업성에 닿아서는 안 됩니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'전령',to:'right'},
        ]},
    ],
    after:[
      {place:'면수 · 물러가는 촉군',art:15,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'조진',look:'cavalry',at:[52,58],face:'left'},{name:'맹달',look:'infantry'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'유비는 한중을 내주고 촉으로 물러났다. 한중왕의 꿈이 면수에 잠겼다.'},
          {enter:'맹달',at:[70,60],from:'right',when:'hr_meng'},
          {say:'맹달',line:'상용의 문은 이제 위를 향해 열려 있소. 앞으로 잘 부탁하오, 중달 공.',when:'hr_meng'},
          {enter:'전령',at:[80,68],from:'right'},
          {say:'전령',line:'낙양에서 급보입니다! 위왕 전하께서 위독하십니다! 세자 저하께서 스승님을 찾으십니다!'},
          {emote:'사마의',text:'!'},
          {say:'사마의',line:'(낙양 쪽 하늘을 본다) …때가 오는군요. 말을 준비하라.'},
        ]},
    ]},
];

// ───────────────────────── 중편 · 원씨의 천하(hebei) ─────────────────────────
// 원소 쪽 루트: 조진은 나오지 않는다. 사마의 곁에는 장합·문추가 선다.
const HEBEI:Chapters=[
  {id:'IF2-hb-1',year:'203년',title:'허창 외곽',
    synopsis:'사마의는 원상을 후계로 세우고 원담에게는 청주와 대장군의 인수를 주어 달랬다. 하나로 묶인 하북이 남쪽 허창으로 내려간다. 외눈의 하후돈이 허창 앞에 마지막 방벽을 쳤다.',
    scenes:[
      {place:'업성 · 원소의 영전',art:5,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'원상',look:'cavalry',at:[56,56],face:'left'},{name:'원담',look:'infantry'}],
        steps:[
          {narrate:'원소의 영전 앞에서 사마의는 원상을 후계로 세웠다. 장자 원담에게는 청주와 대장군의 인수가 돌아갔다.'},
          {enter:'원담',at:[80,62],from:'right'},
          {say:'원담',line:'아우의 깃발 아래 서는 것은 이번 한 번뿐이다. 허창을 얻지 못하면, 그 책임은 중달 네가 지거라.',to:'사마의'},
          {emote:'원상',text:'땀'},
          {move:'사마의',to:[42,62]},
          {say:'사마의',line:'형제가 하나로 서면 허창은 한 해를 버티지 못합니다. 그 한 해만 서로를 참아 주십시오.'},
          {exit:'원담',to:'right'},
        ]},
      {place:'허창 북쪽 · 영천 들판',art:16,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'장합',look:'spear',at:[48,58],face:'right'},{name:'문추',look:'cavalry',at:[18,56],face:'right'},{name:'사마랑',look:'civil'},{name:'하후돈',look:'cavalry',at:[86,52],face:'left'}],
        steps:[
          {say:'하후돈',line:'관도에서 진 것은 맹덕이지 내가 아니다! 이 하후원양의 한 눈이 너희를 똑똑히 보고 있다!'},
          {enter:'사마랑',at:[12,66],from:'left'},
          {say:'사마랑',line:'의야, 업성 옥에 갇힌 전풍 공이 편지를 보냈다. "하후돈은 왼눈이 멀어 왼쪽이 어둡다" 하는구나.',to:'사마의'},
          {emote:'사마의',text:'!'},
          {move:'장합',to:[56,58]},
          {choice:'사마의',options:[
            {id:'tianfeng',text:'전풍을 옥에서 풀어 군사로 맞는다',reply:'관도에서 원 공께 바른 말을 하다 갇힌 분입니다. 이긴 지금이야말로 그 말을 들어야 할 때입니다.',answer:{speaker:'사마랑',line:'전풍 공은 고집이 세다. 허나 그 고집이 너를 지켜 줄 게다.'},note:'전풍(책사)이 영입된다',effects:[{kind:'recruit',name:'전풍',unitClass:'strategist'},{kind:'flag',flag:'hb_tianfeng'}]},
            {id:'left',text:'하후돈의 왼쪽, 보이지 않는 쪽으로 기병을 돌린다',reply:'한 눈으로 천하를 보는 장수에게도 보이지 않는 쪽은 있습니다.',answer:{speaker:'문추',line:'왼쪽이라! 내 말이 먼저 닿겠소!'},note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'front',text:'하북의 대군 그대로 정면에서 밀어붙인다',reply:'허창의 성벽 위에서 모두가 보고 있습니다. 첫 싸움은 크게 이겨야 합니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {say:'장합',line:'외눈이라 얕보지 마시오. 저 자는 화살 맞은 눈알을 삼킨 사내요.'},
        ]},
    ],
    after:[
      {place:'허창 · 성벽이 보이는 언덕',art:3,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'장합',look:'spear',at:[52,58],face:'left'},{name:'전풍',look:'strategist'}],
        steps:[
          {narrate:'하후돈은 허창 성 안으로 물러났다. 조조가 쌓은 도읍의 성벽이 눈앞에 섰다.'},
          {enter:'전풍',at:[70,60],from:'right',when:'hb_tianfeng'},
          {say:'전풍',line:'옥에서 나와 보는 첫 하늘이 허창의 하늘이라니. 중달, 허창은 서두르지 마시오. 완성의 원군부터 끊어야 하오.',when:'hb_tianfeng'},
          {emote:'장합',text:'…'},
          {say:'사마의',line:'허창은 남쪽 완성에서 숨을 쉽니다. 그 숨통부터 막지요.'},
          {exit:'장합',to:'right'}
        ]},
    ]},

  {id:'IF2-hb-2',year:'204년',title:'완성 공략',
    synopsis:'허창으로 가는 원군은 남쪽 완성에서 올라온다. 완성은 조조의 사촌 조인이 지킨다. 그런데 완성 성 안에서, 언제나 살아남는 쪽을 고르던 늙은 책사 가후가 밀서를 보내왔다.',
    scenes:[
      {place:'완성 · 성벽 아래',art:8,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'문추',look:'cavalry',at:[16,56],face:'right'},{name:'곽회',look:'archer',at:[44,60],face:'right'},{name:'조인',look:'heavy',at:[84,44],face:'left'},{name:'밀사',look:'civil'}],
        steps:[
          {narrate:'완성의 성벽 위에 조인의 깃발이 섰다. 이 성이 버티는 한, 허창은 숨을 쉰다.'},
          {say:'조인',line:'번성이든 완성이든, 이 조자효가 지키는 성은 떨어지지 않는다!'},
          {emote:'문추',text:'분노'},
          {enter:'밀사',at:[56,70],from:'right'},
          {say:'밀사',line:'(낮게) 가후 공께서 보내셨습니다. "이긴 쪽에 서는 것이 늙은이의 버릇이오" 라 전하라 하셨습니다.',to:'사마의'},
          {emote:'사마의',text:'?'},
          {move:'곽회',to:[48,62]},
          {choice:'사마의',options:[
            {id:'jiaxu',text:'가후의 밀서를 받아들여, 그를 막하로 맞는다',reply:'가후는 늘 살아남는 쪽을 고릅니다. 그가 우리를 골랐다면, 우리가 이기고 있다는 뜻이지요.',answer:{speaker:'밀사',line:'가후 공께서 성문의 열쇠 대신, 조인의 진법을 적은 종이를 보내셨습니다.'},note:'가후(책사)가 영입된다',effects:[{kind:'recruit',name:'가후',unitClass:'strategist'}]},
            {id:'runan',text:'완성을 꺾은 뒤 신야로 내려가지 않고, 동쪽 여남의 군량고를 친다',reply:'허창의 숨통은 완성이고, 밥통은 여남입니다. 둘을 다 쥐면 허창은 싸우지 않고 마릅니다.',note:'다음 가상 전장이 「여남 평정」으로 바뀐다',effects:[{kind:'path',tale:'IF2-hb-runan'},{kind:'flag',flag:'hb_runan'}]},
            {id:'siege',text:'성을 둘러싸고 조인이 나오기를 기다린다',reply:'조인은 지키는 데 능하지만, 원군이 오지 않으면 나옵니다. 나오는 순간을 칩니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
          ]},
          {exit:'밀사',to:'right'},
        ]},
    ],
    after:[
      {place:'완성 · 열린 남문',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'문추',look:'cavalry',at:[52,58],face:'left'},{name:'곽회',look:'archer'}],
        steps:[
          {narrate:'조인은 성을 버리고 남쪽으로 물러났다. 허창으로 가는 원군의 길이 끊겼다.'},
          {enter:'곽회',at:[72,64],from:'right'},
          {say:'곽회',line:'여남으로 가는 길을 열었습니다. 악진이 군량고 앞에 진을 쳤습니다.',when:'hb_runan'},
          {say:'곽회',line:'남쪽 신야에서 유비가 군을 모았습니다. 유표의 객장으로 머물던 그가 길을 막습니다.',unless:'hb_runan'},
          {emote:'문추',text:'!'},
          {say:'사마의',line:'허창을 둘러싼 고리를 하나씩 끊어 갑니다. 다음 고리입니다.'},
          {exit:'문추',to:'right'}
        ]},
    ]},

  {id:'IF2-hb-3',year:'205년',title:'신야의 객장',
    synopsis:'형주 유표에게 몸을 의탁한 유비가 신야에서 남쪽 길을 막는다. 관도에서 원소의 객장이던 그가, 이번에는 하북의 대군 앞에 선 객장이다. 그 곁에는 단복이라 이름을 바꾼 선비 서서가 있다.',
    scenes:[
      {place:'신야 · 백하 강둑',art:15,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'장합',look:'spear',at:[16,56],face:'right'},{name:'유비',look:'infantry',at:[82,52],face:'left'},{name:'서서',look:'civil'},{name:'하북 병사',look:'infantry',at:[50,72],face:'right'}],
        steps:[
          {narrate:'신야의 백하는 물이 얕고 둑이 높았다. 둑 위에 유비의 깃발이 섰다.'},
          {say:'유비',line:'중달 공, 백마에서 그대는 내 편지를 칼로 썼지. 오늘 그 칼이 나를 향하는구려.',when:'yuan_liubei'},
          {say:'유비',line:'원씨의 천하를 위해 한실의 종친을 치는가, 사마중달!',unless:'yuan_liubei'},
          {emote:'사마의',text:'…'},
          {enter:'서서',at:[66,62],from:'right'},
          {say:'서서',line:'둑을 막아 두었소. 하북군이 강을 건너는 순간 물이 내려가오. …그대가 그걸 모를 리 없겠지만.'},
          {move:'하북 병사',to:[44,72]},
          {move:'사마의',to:[38,62]},
          {choice:'사마의',options:[
            {id:'xushu',text:'영천에 계신 서서의 노모를 예로 모시고, 그 소식을 서서에게 전한다',reply:'어머니를 볼모로 삼지는 않습니다. 다만 아들이 어머니 곁에 설 길을 열어 둘 뿐입니다.',answer:{speaker:'서서',line:'…볼모가 아니라 손님으로 모셨다니. 그 예를 저버릴 수는 없구려.'},note:'서서(책사)가 영입된다',effects:[{kind:'recruit',name:'서서',unitClass:'strategist'}]},
            {id:'dam',text:'둑의 물을 먼저 터뜨려 빈 강을 건넌다',reply:'물은 한 번 흘러가면 다시 모이지 않습니다. 먼저 쏟게 하면 그만입니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'banner',text:'원씨의 깃발과 천자의 조서를 높이 들어 군의 기세를 올린다',reply:'한실의 종친이라면 천자의 조서 앞에서 칼끝이 무거워질 겁니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
          {exit:'서서',to:'right'},
        ]},
    ],
    after:[
      {place:'신야 · 비어 버린 성',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'장합',look:'spear',at:[52,58],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'유비는 백성들을 데리고 남쪽 강릉으로 물러났다. 신야가 비었다.'},
          {enter:'전령',at:[74,66],from:'right'},
          {say:'전령',line:'허창의 순욱이 남은 군과 백성을 모아 성을 지키겠다 합니다! 조조는 서쪽으로 빠져나갔다는 소문입니다!'},
          {emote:'장합',text:'!'},
          {say:'사마의',line:'왕좌지재라 불린 분이 홀로 성을 지키는군요. …마지막 고리입니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'IF2-hb-runan',year:'205년',title:'여남 평정',
    synopsis:'허창의 동남쪽 여남은 조조의 군량 창고다. 작은 체구에 담이 큰 악진이 그 길을 지킨다. 여남을 쥐면 허창은 바다 위의 외딴 섬이 된다.',
    scenes:[
      {place:'여남 · 군량 창고 앞',art:9,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'문추',look:'cavalry',at:[16,56],face:'right'},{name:'곽회',look:'archer',at:[44,60],face:'right'},{name:'악진',look:'infantry',at:[84,54],face:'left'},{name:'위군 병사',look:'infantry',at:[70,68],face:'left'}],
        steps:[
          {narrate:'여남의 창고에는 허창 군민이 한 해를 버틸 곡식이 쌓여 있었다.'},
          {say:'악진',line:'몸이 작다고 얕보지 마라! 이 악문겸은 늘 먼저 성벽에 오른 사람이다!'},
          {emote:'위군 병사',text:'분노'},
          {move:'위군 병사',to:[64,68]},
          {say:'문추',line:'하하, 작은 범이로군. 중달, 저 창고에 불을 놓을까?',to:'사마의'},
          {move:'사마의',to:[36,62]},
          {say:'사마의',line:'창고는 태우지 않습니다. 허창을 얻은 뒤 그 백성이 먹을 곡식입니다.'},
          {choice:'사마의',options:[
            {id:'night',text:'창고 둘레의 작은 길로 밤에 숨어든다',reply:'악진은 늘 먼저 오르는 장수입니다. 그러니 먼저 들어오는 적은 생각하지 못하지요.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'grain',text:'여남의 백성들에게 "창고를 지키는 쪽이 이긴다"는 방을 붙인다',reply:'곡식을 지키겠다는 쪽에 백성이 섭니다. 백성이 비켜서면 악진의 진은 반으로 줄어듭니다.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'drum',text:'하북의 북을 울리며 정면에서 들이친다',reply:'작은 범은 큰 북소리에 더 사납게 뜁니다. 사나운 범은 빨리 지칩니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
        ]},
    ],
    after:[
      {place:'여남 · 지켜 낸 창고',art:9,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'곽회',look:'archer',at:[52,60],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'악진은 물러났고, 여남의 창고는 불 한 점 없이 하북의 것이 되었다.'},
          {enter:'전령',at:[72,66],from:'right'},
          {say:'전령',line:'허창의 순욱이 성문을 닫고 끝까지 지키겠다 합니다! 조조는 서쪽으로 빠져나갔다 하옵니다!'},
          {emote:'곽회',text:'!'},
          {say:'사마의',line:'숨통도 밥통도 끊었습니다. 이제 남은 것은 순욱 한 사람의 뜻입니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'hebei:boss',year:'206년',title:'허창의 왕좌지재',
    synopsis:'조조는 서쪽으로 빠져나갔고, 허창에는 순욱이 남았다. 왕을 도울 재목이라 불린 사람, 한실의 신하로 남겠다는 사람이다. 허창의 성문을 열면 천자가 하북의 손에 들어온다.',
    scenes:[
      {place:'허창 · 닫힌 성문 앞',art:8,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'원상',look:'cavalry',at:[16,56],face:'right'},{name:'장합',look:'spear',at:[44,58],face:'right'},{name:'순욱',look:'civil',at:[82,40],face:'left'},{name:'문추',look:'cavalry'}],
        steps:[
          {narrate:'206년. 하북의 대군이 허창을 에워쌌다. 성벽 위에 관복 차림의 순욱이 섰다.'},
          {say:'순욱',line:'나는 조공의 신하이기 전에 한의 신하요. 천자께서 계신 이 성을, 칼 든 자에게는 열지 않겠소.'},
          {say:'원상',line:'중달! 성을 짓밟고 천자를 모셔 오라. 하북의 천하가 오늘 시작된다!',to:'사마의'},
          {enter:'문추',at:[58,62],from:'left'},
          {say:'문추',line:'성 안의 군은 많지 않소. 다만 순욱이 백성까지 성벽에 올렸소.'},
          {emote:'사마의',text:'…'},
          {move:'사마의',to:[38,62]},
          {choice:'사마의',options:[
            {id:'han',text:'순욱에게 "천자와 한의 종묘를 지키겠다"는 맹세의 글을 보낸다',reply:'순욱이 지키는 것은 조조가 아니라 한입니다. 한을 지키겠다 하면, 그의 칼끝이 무거워집니다.',answer:{speaker:'원상',line:'…맹세라. 그 맹세, 중달 네가 지켜야 할 것이다.'},note:'책략 MP +15. 한실을 지키겠다는 맹세가 남는다',effects:[{kind:'insight'},{kind:'flag',flag:'hb_han'}]},
            {id:'inside',text:'성 안에 남은 동승의 잔당과 내응한다',reply:'허창에는 조조를 미워하던 한의 신하들이 아직 있습니다. 그들에게 문 하나만 부탁하지요.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
            {id:'storm',text:'원상 공의 명대로 사방에서 성벽을 오른다',reply:'오래 끌면 서쪽의 조조가 숨을 고릅니다. 오늘 끝냅니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {move:'장합',to:[52,58]},
        ]},
    ],
    after:[
      {place:'허창 · 궁 앞 회랑',art:13,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'순욱',look:'civil',at:[60,58],face:'left'},{name:'원상',look:'cavalry'}],
        steps:[
          {narrate:'허창이 열렸다. 조조는 서량으로 달아났고, 천자는 하북의 손에 들어왔다.'},
          {say:'순욱',line:'그대의 맹세를 들었소. 나는 영천으로 돌아가겠소. 그 맹세가 지켜지는지, 고향에서 지켜보리다.',when:'hb_han'},
          {say:'순욱',line:'성은 열렸어도 내 마음은 열리지 않소. 나는 영천으로 돌아가 다시는 붓을 들지 않겠소.',unless:'hb_han'},
          {enter:'원상',at:[78,60],from:'right'},
          {say:'원상',line:'중달, 오늘부터 그대가 승상이다. 천하의 일은 모두 그대에게 맡기마.',to:'사마의'},
          {emote:'사마의',text:'…'},
          {exit:'순욱',to:'left'}
        ]},
    ]},
];

// ───────────────────────── 중편 · 사마씨의 나라(independent) ─────────────────────────
// 원소 쪽 루트: 조진은 나오지 않는다. 장합은 처음에 원씨에 남았다가 칼을 맞대고서야 사마의를 따른다.
const INDEPENDENT:Chapters=[
  {id:'IF2-in-1',year:'202년',title:'온현 수비',
    synopsis:'원소가 죽은 밤, 사마의는 원씨 형제를 버리고 고향 하내 온현으로 돌아와 사마씨의 깃발을 세웠다. 원씨의 장수 고람이 배신자를 벌하러 온현으로 온다. 고향의 성벽이 첫 시험대다.',
    scenes:[
      {place:'하내 온현 · 사마가의 뜰',art:0,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'사마방',look:'civil',at:[62,54],face:'left'},{name:'사마랑',look:'civil',at:[20,58],face:'right'},{name:'사마부',look:'civil'}],
        steps:[
          {narrate:'202년 가을. 사마의는 문추와 몇백의 군을 이끌고 고향 온현으로 돌아왔다. 대문 위에 사마(司馬)의 깃발이 올랐다.'},
          {say:'사마방',line:'의야. 깃발을 세운다는 것은 가문의 목을 거는 일이다. 알고 한 일이냐?',to:'사마의'},
          {move:'사마의',to:[44,62]},
          {say:'사마의',line:'남의 집안싸움에 목을 거느니, 제 집안을 위해 걸겠습니다, 아버님.'},
          {enter:'사마부',at:[76,64],from:'right'},
          {say:'사마부',line:'형님! 고람이 원상의 명을 받아 군을 끌고 온현으로 온답니다! 배신자를 벌하겠다고…!'},
          {emote:'사마방',text:'…'},
        ]},
      {place:'온현 · 낮은 성벽',art:8,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'문추',look:'cavalry',at:[20,56],face:'right'},{name:'사마부',look:'civil',at:[50,60],face:'left'},{name:'온현 백성',look:'infantry',at:[70,72],face:'left'}],
        steps:[
          {move:'온현 백성',to:[62,72]},
          {emote:'온현 백성',text:'땀'},
          {say:'문추',line:'고람은 원씨의 장수 가운데 손꼽히는 창이오. 성벽이 낮으니 오래 버티긴 어렵소.'},
          {choice:'사마의',options:[
            {id:'fu',text:'아우 사마부에게 군의 셈을 맡겨 곁에 세운다',reply:'부야, 붓만 들던 손이지만 셈은 나보다 빠르다. 오늘부터 너도 이 집안의 칼이다.',answer:{speaker:'사마부',line:'형님 곁이라면 두렵지 않습니다. 군량과 병사의 수, 제가 맡겠습니다.'},note:'사마부(책사)가 영입된다',effects:[{kind:'recruit',name:'사마부',unitClass:'strategist'}]},
            {id:'people',text:'성 밖의 백성을 모두 성 안으로 들이고 문을 닫는다',reply:'성벽보다 귀한 것이 사람입니다. 사마씨의 깃발은 백성을 버리지 않는다는 것을 보이겠습니다.',note:'아군 전원 처음 1턴 방어 태세. 하내 백성의 마음이 모인다',effects:[{kind:'guard'},{kind:'flag',flag:'in_people'}]},
            {id:'rumor',text:'고람의 군에 "원상이 그대를 버림돌로 썼다"는 소문을 흘린다',reply:'고람은 원씨 형제 어느 쪽에서도 아낌받지 못했습니다. 그 서운함을 건드리지요.',note:'척후: 적 한 부대가 나오지 않는다',effects:[{kind:'scout'}]},
          ]},
          {exit:'온현 백성',to:'left'},
        ]},
    ],
    after:[
      {place:'온현 · 성문 앞',art:2,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'고람',look:'spear',at:[58,60],face:'left'},{name:'문추',look:'cavalry',at:[20,56],face:'right'}],
        steps:[
          {narrate:'고람은 온현의 성벽을 넘지 못하고 사로잡혔다.'},
          {say:'고람',line:'배신자의 손에 죽느니, 차라리 원씨의 장수로 죽겠소. 베시오.'},
          {move:'사마의',to:[44,62]},
          {say:'사마의',line:'베지 않겠소. 그대를 가두어 두겠소. 언젠가 그대의 창이 원씨가 아니라 하내를 지키고 싶어질 날까지.'},
          {emote:'고람',text:'?'},
          {say:'문추',line:'(작게) 장합이 원씨를 떠나 갈 곳을 찾는다는 소문이 있소. 우리 쪽으로 올지, 칼을 들고 올지는 모르겠소.'},
          {exit:'문추',to:'left'}
        ]},
    ]},

  {id:'IF2-in-2',year:'203년',title:'장합의 귀순',
    synopsis:'원담과 원상 모두에게 의심받던 장합이 원씨를 떠났다. 갈 곳을 찾던 그가 하내의 경계에 창을 들고 섰다. "그대가 따를 만한 주인인지, 창으로 묻겠소." 칼로 꺾어야 그가 따른다.',
    scenes:[
      {place:'하내 경계 · 숲길',art:11,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'문추',look:'cavalry',at:[16,56],face:'right'},{name:'곽회',look:'archer'},{name:'장합',look:'spear',at:[82,54],face:'left'}],
        steps:[
          {narrate:'203년. 원씨 형제의 의심을 견디지 못한 장합이 업성을 떠났다. 그의 창이 하내의 경계에 멈추었다.'},
          {say:'장합',line:'중달, 원씨는 이제 지킬 그릇이 아니오. 허나 그대가 내 창을 맡길 그릇인지는 창으로 묻겠소.',to:'사마의'},
          {emote:'문추',text:'!'},
          {say:'문추',line:'준예, 백마에서 같이 싸운 사이에 창을 겨누겠다는 거요?',to:'장합'},
          {enter:'곽회',at:[44,68],from:'left'},
          {say:'곽회',line:'남쪽 맹진 나루에 조조의 우금이, 서쪽 태항산에는 하후연이 움직인다는 척후의 보고입니다.'},
          {move:'사마의',to:[38,62]},
          {choice:'사마의',options:[
            {id:'ford',text:'장합의 창을 받아 주되, 그 뒤에는 태항산이 아니라 맹진 나루를 막는다',reply:'장합 장군과의 싸움은 오늘 끝납니다. 그 뒤 남쪽 나루가 열리면 하내는 사흘 안에 조조의 것이 됩니다.',answer:{speaker:'곽회',line:'맹진 나루라면 물길을 압니다. 곧 길을 잡겠습니다.'},note:'다음 가상 전장이 「맹진 나루」로 바뀐다',effects:[{kind:'path',tale:'IF2-in-ford'},{kind:'flag',flag:'in_ford'}]},
            {id:'net',text:'에워싸되 죽이지 마라. 장합이 지칠 때까지 버틴다',reply:'꺾되 부러뜨리지 않습니다. 부러진 창은 다시 쓸 수 없으니까요.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'face',text:'내가 몸소 앞에 서서 장합의 창을 맞는다',reply:'창으로 묻는다면 몸으로 답해야지요. 장군, 제 앞으로 오십시오.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {move:'장합',to:[74,56]},
        ]},
    ],
    after:[
      {place:'하내 경계 · 해 지는 숲',art:11,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'장합',look:'spear',at:[60,58],face:'left'},{name:'문추',look:'cavalry',at:[20,56],face:'right'}],
        steps:[
          {narrate:'해가 질 무렵, 장합은 창을 거꾸로 쥐고 땅에 꽂았다.'},
          {move:'장합',to:[50,60]},
          {say:'장합',line:'졌소. 아니, 원씨에게 지고 그대에게 이겼다고 해 두지. 오늘부터 이 창은 사마씨의 깃발 곁에 서겠소.',to:'사마의'},
          {emote:'문추',text:'♪'},
          {say:'사마의',line:'장군의 창이 있으니 하내의 성벽이 한 겹 높아졌습니다. 이제 바깥의 범들을 막을 차례입니다.'},
          {move:'사마의',to:[42,62]}
        ]},
    ]},

  {id:'IF2-in-3',year:'204년',title:'태항산 길',
    synopsis:'하내에 제3의 깃발이 섰다는 소식에 조조가 움직였다. 질풍 같은 행군으로 이름난 하후연이 태항산을 넘어 하내를 노린다. 산길에서 그를 막아야 한다.',
    scenes:[
      {place:'태항산 · 굽이진 산길',art:3,cast:[{name:'사마의',look:'strategist',at:[32,62],face:'right'},{name:'장합',look:'spear',at:[18,56],face:'right'},{name:'양준',look:'civil'},{name:'산민',look:'bandit',at:[66,70],face:'left'}],
        steps:[
          {narrate:'태항산의 산길은 구름 속으로 굽어 올라갔다. 그 너머에서 하후연의 기병이 사흘에 오백 리를 달려온다.'},
          {move:'산민',to:[58,70]},
          {say:'산민',line:'저 산 너머에 말발굽 소리가 천둥 같소. 우리 마을이 짓밟히겠소!'},
          {enter:'양준',at:[76,62],from:'right'},
          {say:'양준',line:'중달, 오랜만이오. 어릴 적 그대를 보고 "보통 아이가 아니다" 했던 양준이오. 산마을 사람들이 그대를 돕겠다 하여 데려왔소.',to:'사마의'},
          {emote:'사마의',text:'!'},
          {move:'사마의',to:[40,62]},
          {choice:'사마의',options:[
            {id:'yangjun',text:'양준을 맞아 산마을과 군을 잇는 일을 맡긴다',reply:'어린 저를 처음 알아봐 주신 분입니다. 이번에는 제가 공을 모시겠습니다.',answer:{speaker:'양준',line:'허허, 그 아이가 이렇게 자랐구려. 산사람들의 길은 내가 잇겠소.'},note:'양준(책사)이 영입된다',effects:[{kind:'recruit',name:'양준',unitClass:'strategist'}]},
            {id:'hunters',text:'산마을 사냥꾼들에게 활을 들려 비탈을 맡긴다',reply:'이 산은 그들의 산입니다. 산에 사는 사람만큼 산을 잘 쓰는 군대는 없습니다.',answer:{speaker:'산민',line:'토끼 잡던 활로 범을 잡아 보겠소!'},note:'태항산 사냥꾼 2부대가 초록 깃발로 돕는다',effects:[{kind:'reinforce',name:'태항산 사냥꾼',unitClass:'archer',side:'npc'},{kind:'reinforce',name:'산마을 의병',unitClass:'bandit',side:'npc'}]},
            {id:'fast',text:'하후연이 빠른 만큼, 지친 말이 산마루에 닿는 순간을 친다',reply:'사흘에 오백 리를 달린 말은 산마루에서 숨을 고릅니다. 그 한숨에 칩니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
          ]},
          {exit:'산민',to:'right'},
        ]},
    ],
    after:[
      {place:'태항산 · 산마루',art:3,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'장합',look:'spear',at:[52,58],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'하후연의 기병은 산마루에서 말을 돌렸다. 태항산은 하내의 성벽이 되었다.'},
          {enter:'전령',at:[74,66],from:'right'},
          {say:'전령',line:'원담이 원상에게 쫓겨 남쪽으로 내려옵니다! 하내를 근거지로 삼겠다며 군을 몰아옵니다!'},
          {emote:'장합',text:'분노'},
          {say:'사마의',line:'원씨의 장자가 마지막으로 기댈 곳이 우리 집이로군요. 문을 열어 줄 수는 없습니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'IF2-in-ford',year:'204년',title:'맹진 나루',
    synopsis:'장합의 창을 받은 뒤, 사마의는 태항산이 아니라 남쪽 맹진 나루로 군을 돌렸다. 조조의 우금이 황하를 건너려 한다. 군령이 엄하기로 이름난 장수다. 나루가 열리면 하내는 사흘을 버티지 못한다.',
    scenes:[
      {place:'맹진 · 황하 나루',art:15,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'장합',look:'spear',at:[16,56],face:'right'},{name:'곽회',look:'archer',at:[44,60],face:'right'},{name:'우금',look:'spear',at:[84,52],face:'left'},{name:'위군 병사',look:'infantry',at:[70,68],face:'left'}],
        steps:[
          {narrate:'맹진의 황하는 누렇게 불어 있었다. 건너편 모래톱에 조조군의 배들이 줄지어 섰다.'},
          {say:'우금',line:'하내의 반적은 들어라! 군령에 따라, 항복하지 않는 자는 모두 벤다!'},
          {move:'위군 병사',to:[62,68]},
          {emote:'장합',text:'…'},
          {say:'장합',line:'우금의 군은 무섭도록 정돈되어 있소. 허나 정돈된 군은 뜻밖의 일에 약하오.',to:'사마의'},
          {move:'곽회',to:[48,62]},
          {move:'사마의',to:[36,62]},
          {choice:'사마의',options:[
            {id:'half',text:'우금의 군이 반쯤 건넜을 때 친다',reply:'강을 반쯤 건넌 군은 앞도 뒤도 아닙니다. 군령도 물 위에서는 반만 닿습니다.',note:'기습: 적 전원이 체력 80%로 시작',effects:[{kind:'ambush'}]},
            {id:'stakes',text:'나루의 얕은 곳에 말뚝을 박고 쇠뇌를 늘어세운다',reply:'배가 닿을 곳을 정해 주면, 우금은 그곳으로만 옵니다.',note:'아군 전원 처음 1턴 방어 태세',effects:[{kind:'guard'}]},
            {id:'banner',text:'사마씨의 깃발을 나루 끝까지 세워 하내 사람들의 기세를 올린다',reply:'이 강 건너는 우리 고향입니다. 고향 앞에서 물러서는 자는 없습니다.',note:'아군 전원 처음 2턴 사기 상승',effects:[{kind:'rally'}]},
          ]},
        ]},
    ],
    after:[
      {place:'맹진 · 물러가는 배들',art:7,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'곽회',look:'archer',at:[52,60],face:'left'},{name:'전령',look:'cavalry'}],
        steps:[
          {narrate:'우금의 배들은 남쪽 기슭으로 물러갔다. 맹진 나루는 하내의 것으로 남았다.'},
          {enter:'전령',at:[74,66],from:'right'},
          {say:'전령',line:'원담이 원상에게 쫓겨 하내로 내려옵니다! 우리 땅을 근거지로 삼겠다 합니다!'},
          {emote:'곽회',text:'!'},
          {say:'사마의',line:'남쪽 문을 닫으니 북쪽 문을 두드리는군요. 원씨와의 인연, 이번에 끝냅니다.'},
          {exit:'전령',to:'right'}
        ]},
    ]},

  {id:'independent:boss',year:'205년',title:'심수의 원담',
    synopsis:'아우 원상에게 쫓긴 원소의 장자 원담이 하내를 근거지로 삼으려 남쪽으로 내려왔다. 갈 곳 잃은 장자의 칼은 사납다. 그를 꺾으면 사마씨의 깃발은 원씨와 조조 사이에 홀로 선다.',
    scenes:[
      {place:'하내 · 심수 강둑',art:15,cast:[{name:'사마의',look:'strategist',at:[30,62],face:'right'},{name:'장합',look:'spear',at:[44,58],face:'right'},{name:'문추',look:'cavalry',at:[16,56],face:'right'},{name:'원담',look:'infantry',at:[84,52],face:'left'},{name:'사자',look:'cavalry'}],
        steps:[
          {narrate:'205년 봄. 원담의 군이 심수를 따라 하내로 내려왔다. 깃발은 찢겨 있었지만 칼은 아직 날카로웠다.'},
          {say:'원담',line:'사마의! 아버님의 은혜를 입고 등을 돌린 자여! 하내를 내놓아라. 원씨의 장자가 갈 곳은 여기뿐이다!'},
          {emote:'문추',text:'분노'},
          {enter:'사자',at:[58,70],from:'left'},
          {say:'사자',line:'업성의 원상 공께서 보내셨습니다. 원담을 함께 치자면, 기병을 보내 주시겠답니다.',to:'사마의'},
          {say:'장합',line:'원상의 손을 잡으면 원담은 쉽게 꺾이겠지만, 그 빚은 원상이 기억할 거요.'},
          {move:'사마의',to:[38,62]},
          {choice:'사마의',options:[
            {id:'yuanshang',text:'원상의 손을 잡는다. 형을 아우의 기병과 함께 친다',reply:'빚은 나중에 갚으면 됩니다. 지금은 하내를 지키는 것이 먼저입니다.',answer:{speaker:'사자',line:'원상 공께서 기뻐하실 겁니다. 기병이 곧 북쪽에서 내려옵니다.'},note:'원상의 기병이 초록 깃발로 돕는다. 원상에게 빚이 남는다',effects:[{kind:'reinforce',name:'원상',unitClass:'cavalry',side:'npc'},{kind:'flag',flag:'in_yuanshang'}]},
            {id:'mercy',text:'원담에게 항복을 권하는 글을 보낸다. 장자의 목숨은 살린다',reply:'원 공께 받은 은혜가 있습니다. 그 아드님을 베고 싶지는 않습니다. 받지 않으면 그때는 칼입니다.',note:'책략 MP +15',effects:[{kind:'insight'},{kind:'flag',flag:'in_mercy'}]},
            {id:'alone',text:'누구의 손도 빌리지 않고 사마씨의 깃발만으로 맞선다',reply:'제3의 깃발은 남의 기병으로 서지 않습니다. 하내의 힘만으로 이겨야 하북과 중원이 우리를 봅니다.',note:'정면 승부: 적 정예 1부대 추가, 경험치 1.5배',effects:[{kind:'bold'}]},
          ]},
          {exit:'사자',to:'left'},
        ]},
    ],
    after:[
      {place:'하내 온현 · 깃발 아래',art:10,cast:[{name:'사마의',look:'strategist',at:[34,62],face:'right'},{name:'장합',look:'spear',at:[50,58],face:'left'},{name:'고람',look:'spear'},{name:'사마랑',look:'civil'}],
        steps:[
          {narrate:'원담은 심수 가에서 쓰러졌다. 항복의 글을 끝내 찢고, 칼을 쥔 채였다.',when:'in_mercy'},
          {narrate:'원담은 심수 가에서 쓰러졌다. 원씨의 장자는 고향이 아닌 남의 땅에서 눈을 감았다.',unless:'in_mercy'},
          {enter:'고람',at:[70,60],from:'right'},
          {say:'고람',line:'옥에서 다 들었소. 원씨는 끝났소. …이 창, 이제 하내를 지키는 데 쓰겠소.',to:'사마의'},
          {enter:'사마랑',at:[18,66],from:'left'},
          {say:'사마랑',line:'의야, 북쪽의 원상이 원군의 값을 셈하자며 사자를 보낼 게다. 남쪽의 조조도 우리를 보고 있다.',when:'in_yuanshang'},
          {say:'사마의',line:'(깃발을 올려다보며) 북에는 기운 원씨, 남에는 강한 조조. 이제 이 깃발이 어느 쪽을 먼저 향할지 정해야겠지요.'},
          {move:'장합',to:[58,58]}
        ]},
    ]},
];

const pack:ScenarioPack={
  chapters:[...SERVE,...YUAN,...FATE2,...CHIBI,...HEIR,...HEBEI,...INDEPENDENT],
  extraTales:[
    {id:'IF1-srv-nanpi',route:'serve',replaces:'IF1-srv-3',title:'남피 설원',intro:'업성을 둘러싸 둔 채 형 원담부터 치기로 했다. 정월의 남피, 해자는 얼어붙었고 원담은 성문을 열고 나와 죽기로 싸운다. 형을 꺾으면 아우는 돌아올 곳을 잃는다.',target:{name:'원담',unitClass:'infantry'}},
    {id:'IF1-yuan-xudu',route:'yuan',replaces:'IF1-yuan-3',title:'허도 급습',intro:'오소를 지킨 그 밤, 허유의 계책대로 경기병이 영천의 숲길을 내달린다. 텅 빈 줄 알았던 허도 앞에 조조의 종제 조홍이 남은 군을 모아 기다린다.',target:{name:'조홍',unitClass:'cavalry'}},
    {id:'IF2-cb-sanjiang',route:'chibi',replaces:'IF2-cb-3',title:'삼강구 기습',intro:'불을 기다리지 않고 먼저 놓기로 했다. 날랜 배들이 오군의 수채가 있는 삼강구로 내려간다. 오하아몽이라 불리던 여몽이 그곳을 지킨다.',target:{name:'여몽',unitClass:'infantry'}},
    {id:'IF2-hr-micang',route:'heir',replaces:'IF2-hr-3',title:'미창 산길',intro:'굳게 닫힌 양평관을 두고 미창산 샛길로 돈다. 좁은 골짜기 끝에서 서량의 금마초가 원한 서린 창을 들고 기다린다.',target:{name:'마초',unitClass:'cavalry'}},
    {id:'IF2-hb-runan',route:'hebei',replaces:'IF2-hb-3',title:'여남 평정',intro:'허창의 밥통인 여남의 군량 창고를 친다. 작은 체구에 담이 큰 악진이 창고 앞을 지킨다. 여남을 쥐면 허창은 외딴 섬이 된다.',target:{name:'악진',unitClass:'infantry'}},
    {id:'IF2-in-ford',route:'independent',replaces:'IF2-in-3',title:'맹진 나루',intro:'태항산 대신 남쪽 맹진 나루를 막는다. 군령이 엄하기로 이름난 조조의 우금이 황하를 건너려 한다. 나루가 열리면 하내는 사흘을 버티지 못한다.',target:{name:'우금',unitClass:'spearman'}},
  ],
  endingNotes:[
    {flag:'srv_flood',line:'업성을 물에 잠기게 했던 젊은 날의 셈을, 그는 늙어서도 이따금 떠올렸다.'},
    {flag:'srv_guojia',line:'역참에 남겨져 목숨을 건진 곽가는, 그 뒤로 사마의를 "내 목숨의 셈을 맞힌 자"라 불렀다.'},
    {flag:'yuan_open',line:'관도에서 열어 둔 포위의 한쪽은, 훗날까지 하북 사람들 사이에서 이야깃거리로 남았다.'},
    {flag:'cb_caimao',line:'목숨을 건진 채모의 수군은 끝까지 사마의의 배를 지켰다.'},
    {flag:'cb_letter',line:'주유를 꺾은 것은 칼이 아니라 의심이었다. 사마의는 그 글을 쓴 일을 누구에게도 말하지 않았다.'},
    {flag:'hr_yuan_saved',line:'정군산에서 살아남은 하후연은 늘 "백지장군이 될 뻔한 날"을 웃으며 이야기했다.'},
    {flag:'hr_meng',line:'상용의 맹달은 결국 또 한 번 마음을 바꾸려 했고, 사마의는 그날을 이미 셈해 두고 있었다.'},
    {flag:'hb_han',line:'허창의 성벽 앞에서 한실을 지키겠다던 맹세를, 영천의 순욱은 끝까지 지켜보았다.'},
    {flag:'in_people',line:'온현의 성문을 열어 백성을 들였던 날부터, 하내 사람들은 사마씨의 깃발을 제 깃발로 여겼다.'},
    {flag:'in_yuanshang',line:'심수에서 빌린 원상의 기병은, 끝내 값비싼 빚으로 돌아왔다.'},
    {flag:'in_mercy',line:'항복의 글을 찢은 원담의 마지막을, 사마의는 원소의 묘 앞에서 조용히 고했다.'},
  ],
};
export default pack;
