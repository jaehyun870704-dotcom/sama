import type {ScenarioPack} from '../scenario-types.ts';

/**
 * 연의 중편 — 정사 · 위의 방패.
 * 'fate:2:refuse'에서 조비를 받든(wei) 뒤 S2-01(무위)부터 S2-14(오장원)까지 이어지고,
 * 제갈량이 죽은 뒤 운명의 갈림길 'fate:3:wei'(오래 기다린 자의 선택)로 넘어간다.
 *
 * 이야기에 남는 표식
 *   wuwei_mercy / wuwei_stern   무위 반란군을 어떻게 다스렸나(S2-01)
 *   mengda_letter               맹달에게 먼저 안심시키는 편지를 보냈다(S2-05)
 *   advised_retreat             자오곡의 비 속에서 조진에게 회군을 권했다(S2-07)
 *   heeded_zhanghe              목문도에서 장합의 말을 듣고 본대를 곁에 붙였다(S2-11)
 *   sons_vow / father_first     호로곡에 들기 전 두 아들에게 남긴 말(S2-13)
 *   wary_pursuit / hard_pursuit 오장원 추격의 방식(S2-14)
 */
const pack:ScenarioPack={
  chapters:[
    // ───────────────────────── S2-01 무위
    {
      id:'S2-01',year:'220년',title:'되돌아오는 화살',
      synopsis:'조조가 죽던 밤 사마의는 조비의 곁에 섰고, 조비는 한의 선양을 받아 위를 세웠다. 새 왕조의 첫 해, 양주의 호족들이 무위 성채를 에워싼다. 반란군의 무당은 책략을 그대로 되돌린다.',
      scenes:[
        {place:'낙양 · 새 왕조의 조회',art:5,
          cast:[
            {name:'조비',look:'civil',at:[50,44]},
            {name:'사마의',look:'strategist',at:[30,62],face:'right'},
            {name:'조진',look:'heavy',at:[70,62],face:'left'},
            {name:'전령',look:'infantry'},
          ],
          steps:[
            {narrate:'220년. 조조가 낙양에서 눈을 감던 밤, 사마의는 망설이지 않고 세자 조비의 소매를 잡았다. 그해 겨울, 한의 마지막 황제가 자리를 내주고 조비가 위(魏)의 황제가 되었다.'},
            {say:'조비',line:'중달, 아버님 영구 앞에서 가장 먼저 내 곁에 선 사람이 그대였지. 새 조정에도 그대의 자리가 있다.',to:'사마의'},
            {move:'사마의',to:[38,60]},
            {say:'사마의',line:'신은 폐하의 그림자로 족합니다. 그림자는 앞에 나서지 않으나, 해가 어느 쪽으로 지는지는 먼저 압니다.'},
            {enter:'전령',at:[86,62],from:'right'},
            {emote:'전령',text:'땀'},
            {say:'전령',line:'아뢰오! 양주의 호족들이 새 왕조를 따를 수 없다며 들고일어났습니다! 무위 성채가 에워싸였습니다!'},
            {emote:'조비',text:'분노'},
            {say:'조비',line:'즉위의 북소리가 그치기도 전에… 조진, 중달. 둘이 함께 가서 서쪽을 잠재워라.'},
            {exit:'전령',to:'right'},
          ]},
        {place:'무위 · 성채 망루',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'조진',look:'heavy',at:[50,62],face:'right'},
            {name:'성채 수비장',look:'spear'},
          ],
          steps:[
            {narrate:'서쪽으로 스무 날. 무위의 성채는 아직 버티고 있었다. 북쪽 들에는 기병의 먼지가, 동쪽 길에는 궁수들의 횃불이 줄지어 있었다.'},
            {enter:'성채 수비장',at:[74,62],from:'right'},
            {say:'성채 수비장',line:'오셨군요! 저 무당이 북을 치면 우리 책사들의 불길이 거꾸로 날아와 성벽을 태웁니다.'},
            {emote:'조진',text:'?'},
            {say:'사마의',line:'반란군에 주술을 쓰는 무당이 있다더니 사실이군요. 책략을 맞으면 그 힘을 되돌려 보냅니다. 그자는 창과 화살로 상대해야 합니다.',to:'조진'},
            {say:'조진',line:'성채만 지키면 반란은 오래가지 못하네. 북쪽과 동쪽, 두 갈래를 나눠 막지.'},
            {choice:'사마의',options:[
              {id:'mercy',text:'칼을 버리는 자는 살려 고향으로 돌려보낸다고 성 밖에 알려라.',
                reply:'저들도 새 왕조가 두려워 칼을 든 백성입니다. 문을 열어 두면 반은 스스로 흩어집니다.',
                answer:{speaker:'성채 수비장',line:'성벽 위에서 외치게 하겠습니다. 흔들리는 자가 적지 않을 겁니다.'},
                note:'아군 전원 첫 턴 방어 태세 · 뒷이야기가 달라진다',
                effects:[{kind:'guard'},{kind:'flag',flag:'wuwei_mercy'}]},
              {id:'stern',text:'두령의 목을 성문에 걸겠다고 알려라.',
                reply:'새 황제의 첫 해입니다. 여기서 위엄이 서지 않으면 반란은 다른 곳에서 또 일어납니다.',
                answer:{speaker:'조진',line:'자네 입에서 그런 말이 나오니 더 서늘하군. 북을 울려라!'},
                note:'아군 전원 처음 2턴 사기 상승',
                effects:[{kind:'rally'},{kind:'flag',flag:'wuwei_stern'}]},
            ]},
            {exit:'성채 수비장',to:'right'},
          ]},
      ],
      after:[
        {place:'무위 · 진압 뒤의 성벽',art:8,
          cast:[
            {name:'조진',look:'heavy',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'항복한 반란병',look:'bandit'},
          ],
          steps:[
            {say:'조진',line:'양주가 잠잠해졌군. 자네 덕에 무당의 술수에 휘말리지 않았어.'},
            {enter:'항복한 반란병',at:[76,64],from:'right',when:'wuwei_mercy'},
            {say:'항복한 반란병',line:'살려 주신다는 말을 믿고 칼을 버렸습니다. 고향으로 돌아가 밭을 갈겠습니다.',when:'wuwei_mercy'},
            {say:'조진',line:'두령의 목을 걸었더니 남은 무리가 하룻밤에 흩어졌네. 자네 얼굴이 그리 차가울 줄은 몰랐어.',when:'wuwei_stern'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'폐하께서 동쪽 강동을 치려 하신다는 말이 들립니다. 이번에는 물 위의 싸움이 될 겁니다.'},
            {move:'사마의',to:[24,58]},
          ]},
      ],
    },

    // ───────────────────────── S2-02 동구
    {
      id:'S2-02',year:'222년',title:'하늘의 칼',
      synopsis:'손권이 신하를 칭하고도 볼모를 보내지 않자, 조비는 친히 강동을 치러 나섰다. 동구의 함대가 폭풍에 흩어지고 여범의 오군이 퇴로를 노린다. 번개 칠 자리를 읽으며 황제를 북서쪽 출구로 모신다.',
      scenes:[
        {place:'수춘 · 동정의 군막',art:14,
          cast:[
            {name:'조비',look:'civil',at:[50,48]},
            {name:'조진',look:'heavy'},
            {name:'사마의',look:'strategist',at:[30,62],face:'right'},
          ],
          steps:[
            {narrate:'222년 가을. 손권은 위의 책봉을 받고도 아들을 볼모로 보내지 않았다. 크게 노한 조비는 세 길로 강동을 치게 하고, 자신도 수춘을 지나 강가로 나섰다.'},
            {say:'조비',line:'손권은 입으로만 신하를 칭한다. 짐이 직접 강을 건너 그 거짓을 벗기겠다.'},
            {enter:'조진',at:[68,62],from:'right'},
            {say:'조진',line:'폐하께서 친히 나서셨으니 장수들의 기세가 하늘을 찌릅니다. 다만 동구 쪽 하늘이 심상치 않다는군.',to:'사마의'},
            {emote:'사마의',text:'…'},
            {move:'사마의',to:[38,58]},
            {say:'사마의',line:'바람이 남동에서 꺾여 듭니다. 강물 냄새가 비릿합니다. 폐하, 폭풍이 옵니다.'},
          ]},
        {place:'동구 · 폭풍 전야의 강',art:7,
          cast:[
            {name:'조비',look:'civil',at:[22,56],face:'right'},
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'조진',look:'heavy',at:[50,62],face:'right'},
            {name:'위군 병사',look:'infantry',at:[68,64],face:'left'},
          ],
          steps:[
            {narrate:'동구. 하늘이 낮게 내려앉고, 묶어 둔 배들이 서로 부딪혀 울었다. 남쪽 기슭에는 오의 여범이 배를 띄울 채비를 하고 있었다.'},
            {emote:'위군 병사',text:'땀'},
            {say:'위군 병사',line:'닻줄이 끊어집니다! 배들이 남쪽 기슭으로 떠밀려 갑니다!'},
            {exit:'위군 병사',to:'right'},
            {say:'사마의',line:'번개는 같은 자리를 두 번 치지 않지만, 칠 자리는 미리 하늘이 알려 줍니다. 그 칸에 서 있지만 않으면 됩니다.'},
            {say:'조진',line:'함선은 잃어도 폐하는 잃을 수 없네. 북서쪽 길로 모시세.'},
            {emote:'조비',text:'분노'},
            {say:'조비',line:'짐더러 손권에게 등을 보이라는 것인가!'},
            {move:'사마의',to:[30,58]},
            {say:'사마의',line:'오늘 물러나시는 것은 하늘을 피하시는 것이지 손권을 피하시는 것이 아닙니다. 강은 내일도 그 자리에 있습니다.',to:'조비'},
            {emote:'조비',text:'…'},
          ]},
      ],
      after:[
        {place:'동구 · 폭풍이 지난 강둑',art:15,
          cast:[
            {name:'조진',look:'heavy',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {say:'조진',line:'폐하께서 무사히 물러나셨네. 함선 몇 척은 남쪽 기슭으로 떠밀려 갔지만.'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'폐하께서는 다시 강을 건너려 하실 겁니다. 다음에는 제가 곁에 없을 수도 있습니다. 조 장군께 맡기겠습니다.'},
            {move:'조진',to:[48,60]},
            {say:'조진',line:'자네가 없으면 내가 자네 몫까지 생각해야 하나? 머리가 아프겠군.'},
            {exit:'조진',to:'right'},
          ]},
      ],
    },

    // ───────────────────────── S2-03 광릉
    {
      id:'S2-03',year:'225년',title:'얼어붙은 강',
      synopsis:'조비가 다시 광릉으로 나섰으나 강이 얼어 함대가 묶였다. 허창을 지키게 된 사마의는 떠나는 조진에게 부대를 맡긴다. 그날 밤, 오의 고수가 결사대를 이끌고 얼음 위로 황제의 행영을 친다.',
      scenes:[
        {place:'허창 · 유수의 집무실',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[40,58],face:'right'},
            {name:'사마사',look:'cavalry',at:[24,62],face:'right'},
            {name:'조진',look:'heavy'},
          ],
          steps:[
            {narrate:'225년. 조비는 다시 강동으로 나섰다. 이번에 사마의에게 내려진 명은 출정이 아니라 허창 유수 — 황제가 없는 동안 나라의 뒤를 맡는 일이었다.'},
            {enter:'조진',at:[62,60],from:'right'},
            {say:'사마의',line:'폐하께서 다시 강동으로 나서십니다. 저는 허창을 지키라는 명을 받았습니다. 이번에는 장군 혼자 가셔야 합니다.',to:'조진'},
            {say:'조진',line:'걱정 말게. 자네가 늘 말하던 대로, 다치면 고치고 막히면 뚫고 멀면 쏘면 되지 않나.'},
            {emote:'사마사',text:'?'},
            {say:'사마사',line:'아버님은 왜 함께 가시지 않습니까? 장수들이 아버님 없이 강을 건넌다니요.'},
            {say:'사마의',line:'폐하께서 내게 등을 맡기셨다. 등을 맡은 사람은 앞을 보지 않는다. 그것이 믿음에 답하는 법이다.'},
            {exit:'조진',to:'right'},
          ]},
        {place:'광릉 · 얼어붙은 강가',art:16,
          cast:[
            {name:'조비',look:'civil',at:[28,56],face:'right'},
            {name:'조진',look:'heavy',at:[46,60],face:'right'},
            {name:'위군 의원',look:'physician'},
          ],
          steps:[
            {narrate:'광릉. 강이 얼어 수천 척의 배가 얼음에 갇혔다. 황제는 강 건너 오군의 진을 바라보며 긴 한숨을 쉬었다.'},
            {enter:'위군 의원',at:[64,64],from:'right'},
            {emote:'위군 의원',text:'땀'},
            {say:'조진',line:'강이 얼어 배가 묶였다는군… 밤이 길겠어. 의원과 궁병을 폐하 곁에 두겠네.',to:'위군 의원'},
            {move:'조진',to:[36,58]},
          ]},
        {place:'광릉 · 강 건너 오군 진',art:15,
          cast:[
            {name:'손소',look:'crossbow',at:[56,58],face:'left'},
            {name:'고수',look:'bandit'},
          ],
          steps:[
            {enter:'고수',at:[72,62],from:'right'},
            {say:'손소',line:'위의 황제가 얼음에 묶였다. 고수, 오백 명이면 되겠느냐?'},
            {emote:'고수',text:'!'},
            {say:'고수',line:'오백이면 충분합니다. 황제의 수레 덮개를 벗겨 장군께 바치겠습니다.'},
            {exit:'고수',to:'left'},
          ]},
      ],
      after:[
        {place:'허창 · 돌아온 행렬',art:2,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'조진',look:'heavy'},
          ],
          steps:[
            {enter:'조진',at:[56,62],from:'right'},
            {say:'조진',line:'폐하를 모셨네. 고수에게 수레 덮개를 빼앗긴 것은 부끄럽지만… 사람은 잃지 않았어.'},
            {say:'사마의',line:'장군께서 부대를 기르신 덕입니다. 다만 폐하의 기침 소리가 가라앉지 않는다 들었습니다.'},
            {emote:'조진',text:'…'},
            {move:'사마의',to:[44,60]},
            {say:'사마의',line:'조정이 흔들릴 때를 대비해야 합니다. 그날이 오면, 장군과 제가 등을 맞대야 합니다.'},
          ]},
      ],
    },

    // ───────────────────────── S2-04 양양
    {
      id:'S2-04',year:'226년',title:'세 갈래 물결',
      synopsis:'조비가 마흔의 나이로 세상을 떠나며 조진·진군·조휴·사마의에게 어린 조예를 맡겼다. 국상의 틈을 노려 손권이 양양으로 군을 보낸다. 세 갈래로 밀려오는 제갈근과 장패를 여덟 턴 동안 막아 성문을 지킨다.',
      scenes:[
        {place:'낙양 · 새 황제의 조회',art:5,
          cast:[
            {name:'조예',look:'civil',at:[50,44]},
            {name:'진군',look:'civil',at:[34,56],face:'right'},
            {name:'조진',look:'heavy',at:[66,58],face:'left'},
            {name:'사마의',look:'strategist',at:[22,62],face:'right'},
            {name:'전령',look:'infantry'},
          ],
          steps:[
            {narrate:'226년 여름. 조비가 가복전에서 눈을 감았다. 마지막 조서는 조진·진군·조휴·사마의 넷에게 태자 조예를 보필하라 일렀다.'},
            {say:'조예',line:'선황께서 경들을 믿으셨으니 짐도 믿겠소. 다만 짐은 아직 경들의 얼굴을 다 알지 못하오.'},
            {say:'진군',line:'폐하, 신하는 얼굴이 아니라 하는 일로 알아보시면 됩니다. 곧 그럴 일이 올 것입니다.'},
            {enter:'전령',at:[84,62],from:'right'},
            {emote:'전령',text:'!'},
            {say:'전령',line:'급보! 오군이 국상을 틈타 강하와 양양으로 올라옵니다! 제갈근과 장패가 앞장섰다 하옵니다!'},
            {exit:'전령',to:'right'},
          ]},
        {place:'양양 · 성루',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[36,58],face:'right'},
            {name:'조진',look:'heavy',at:[50,62],face:'right'},
            {name:'양양 수문장',look:'spear'},
          ],
          steps:[
            {enter:'양양 수문장',at:[70,62],from:'right'},
            {say:'양양 수문장',line:'강변에 배가 닿았습니다! 동쪽 큰길과 남쪽 숲길에서도 깃발이 보입니다!'},
            {say:'사마의',line:'오군은 세 갈래로 옵니다. 강에서 내리는 자들은 책략에 강하고, 동쪽의 장패는 창칼에 단단합니다. 한 병종으로는 막을 수 없습니다.'},
            {say:'조진',line:'길목마다 맞는 부대를 세우세. 여덟 턴만 버티면 오군은 물러갈 걸세.'},
            {emote:'양양 수문장',text:'땀'},
            {move:'양양 수문장',to:[80,64]},
          ]},
        {place:'양양 · 성 밖 길목',art:16,
          cast:[
            {name:'제갈근',look:'strategist',at:[60,56],face:'left'},
            {name:'장패',look:'cavalry'},
          ],
          steps:[
            {enter:'장패',at:[46,62],from:'right'},
            {say:'장패',line:'국상 중인 위군이 무얼 하겠소. 양양 성문은 내가 열겠소!'},
            {emote:'제갈근',text:'…'},
            {say:'제갈근',line:'서두르지 마시오. 사마의라는 자가 형주로 왔다 하오. 조심스러운 자가 가장 무서운 법이오.'},
            {exit:'장패',to:'left'},
          ]},
      ],
      after:[
        {place:'양양 · 물러가는 오군의 깃발',art:8,
          cast:[
            {name:'조진',look:'heavy',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {emote:'조진',text:'♪'},
            {say:'조진',line:'제갈근이 물러났네! 장패도 다시는 강을 건너지 못할 걸세.'},
            {move:'조진',to:[50,62]},
            {say:'사마의',line:'폐하께서 저를 형주·예주의 군사를 맡는 자리에 앉히셨습니다. 이제부터는 제가 먼저 판을 짜야 합니다.'},
            {narrate:'사마의는 표기장군이 되어 완성에 진을 쳤다. 남쪽의 오와 서쪽의 촉, 두 문을 한 몸으로 지키는 자리였다.'},
            {exit:'사마의',to:'left'},
          ]},
      ],
    },

    // ───────────────────────── S2-05 신성
    {
      id:'S2-05',year:'227년',title:'여드레 천이백 리',
      synopsis:'신성 태수 맹달이 촉과 손잡고 반기를 들려 한다. 표를 올려 허락을 기다리면 늦는다. 사마의는 먼저 치고 나중에 아뢰기로 하고, 두 아들과 함께 천이백 리를 여드레에 내달린다.',
      scenes:[
        {place:'완성 · 표문을 쓰는 밤',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[40,58],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {narrate:'227년 겨울, 완성. 신성 태수 맹달이 촉과 오에 몰래 편지를 보낸다는 말이 돌았다. 세 번 주인을 바꾼 자의 네 번째 배신이었다.'},
            {enter:'사마사',at:[58,60],from:'right'},
            {emote:'사마사',text:'!'},
            {say:'사마사',line:'아버님, 맹달이 촉과 내통한다는 밀서입니다. 조정에 먼저 아뢰고 허락을 기다리시겠습니까?'},
            {say:'사마의',line:'허락을 기다리면 맹달은 성을 굳힌다. 먼저 치고 나중에 아뢴다. 사야, 너는 기병을, 소야, 너는 노병을 맡아라.'},
            {enter:'사마소',at:[24,62],from:'left'},
            {say:'사마소',line:'형님이 성문을 열면 제가 성벽 위의 궁수를 떨어뜨리겠습니다. 첫 출전입니다, 아버님.'},
            {choice:'사마의',options:[
              {id:'letter',text:'떠나기 전에 맹달에게 편지를 써 보내라. 그대를 믿는다고.',
                reply:'의심받는다 여기면 서두르고, 믿는다 여기면 미룬다. 맹달이 미루는 하루가 우리의 하루다.',
                answer:{speaker:'사마사',line:'…아버님은 칼보다 붓을 먼저 드시는군요.'},
                note:'책략 MP +15 · 맹달이 방심한다',
                effects:[{kind:'insight'},{kind:'flag',flag:'mengda_letter'}]},
              {id:'march',text:'편지는 필요 없다. 오늘 밤 바로 떠난다.',
                reply:'말이 오가는 사이 성문은 닫힌다. 병사들에게 갑옷을 입은 채 자라 일러라.',
                answer:{speaker:'사마소',line:'곧 북을 울리겠습니다!'},
                note:'아군 전원 처음 2턴 사기 상승',
                effects:[{kind:'rally'}]},
            ]},
          ]},
        {place:'신성 가는 길 · 산길 행군',art:4,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[48,62],face:'right'},
            {name:'위군 병사',look:'infantry',at:[66,64],face:'left'},
          ],
          steps:[
            {narrate:'천이백 리 길. 낮에도 걷고 밤에도 걸었다. 짚신이 닳으면 맨발로 걸었다.'},
            {emote:'위군 병사',text:'땀'},
            {say:'위군 병사',line:'도독, 발이 다 터졌습니다… 언제까지 걸어야 합니까?'},
            {move:'사마의',to:[56,62]},
            {say:'사마의',line:'맹달이 우리가 온 것을 아는 날까지다. 그날이 늦을수록 너희가 덜 죽는다.',to:'위군 병사'},
            {say:'사마사',line:'맹달의 답장을 가로챘습니다. 도독이 오려면 한 달은 걸린다며 촉에 느긋하게 써 보냈습니다.',when:'mengda_letter'},
            {say:'사마사',line:'척후의 말로는 맹달이 아직 성 밖 해자를 다 파지 못했다 합니다. 서두르면 닿습니다.',unless:'mengda_letter'},
            {emote:'사마의',text:'…'},
            {exit:'위군 병사',to:'right'},
          ]},
      ],
      after:[
        {place:'신성 · 열여섯 날 만에 열린 성문',art:8,
          cast:[
            {name:'사마사',look:'cavalry',at:[56,62],face:'left'},
            {name:'사마소',look:'crossbow',at:[68,62],face:'left'},
            {name:'사마의',look:'strategist',at:[38,60],face:'right'},
          ],
          steps:[
            {say:'사마사',line:'맹달이 꺾였습니다. 제갈량의 원군은 끝내 오지 않았습니다.'},
            {say:'사마소',line:'맹달이 마지막에 그랬답니다. 편지 한 장에 속았다고. 아버님의 붓이 성문보다 먼저 열렸습니다.',when:'mengda_letter'},
            {emote:'사마소',text:'♪',unless:'mengda_letter'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'둘 다 잘 싸웠다. 제갈량은 이제 기산으로 나올 것이다. 그때 우리가 막을 곳은… 가정이다.'},
            {move:'사마의',to:[46,58]},
          ]},
      ],
    },

    // ───────────────────────── S2-06 가정
    {
      id:'S2-06',year:'228년',title:'물을 끊다',
      synopsis:'제갈량이 출사표를 올리고 기산으로 나왔다. 선봉 마속은 길목을 버리고 남산 위에 진을 쳤다. 사마의와 장합은 북쪽 샘 두 곳을 쥐어 산 위의 물길을 끊는다.',
      scenes:[
        {place:'장안 · 출격 군의',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'장합',look:'cavalry'},
          ],
          steps:[
            {narrate:'228년 봄. 촉의 승상 제갈량이 출사표를 올리고 기산으로 나왔다. 남안·천수·안정 세 군이 하루아침에 촉으로 돌아섰고, 장안은 술렁였다.'},
            {enter:'장합',at:[58,62],from:'right'},
            {say:'장합',line:'제갈량이 기산으로 나왔소. 선봉 마속이 가정을 맡았는데, 길목을 버리고 남산 위에 진을 쳤다는군.'},
            {emote:'사마의',text:'!'},
            {say:'사마의',line:'산 위의 진은 높아서 강해 보이지만 물이 없습니다. 북쪽 샘 두 곳만 지키면 사흘을 못 버틸 겁니다.'},
            {say:'장합',line:'물이 끊기면 무너진 무리가 남쪽으로 쏟아지겠지. 그 길은 내가 막으리다. 마속을 놓치지 마시오.'},
            {move:'장합',to:[48,62]},
          ]},
        {place:'가정 · 남산 위 촉군 진',art:3,
          cast:[
            {name:'마속',look:'strategist',at:[50,50],face:'right'},
            {name:'왕평',look:'infantry',at:[64,60],face:'left'},
          ],
          steps:[
            {say:'왕평',line:'참군, 승상께서는 길목에 진을 치라 하셨습니다. 산 위에는 물이 없습니다!'},
            {say:'마속',line:'높은 데서 내려다보며 치면 파죽지세라 했소. 병서 한 줄 읽지 않은 자가 무얼 아오.'},
            {emote:'왕평',text:'분노'},
            {move:'왕평',to:[78,62]},
            {say:'왕평',line:'그렇다면 제 천 명이라도 산 아래에 두겠습니다. 물러날 길은 남겨야 합니다.'},
            {exit:'왕평',to:'right'},
          ]},
        {place:'가정 · 북쪽 샘',art:11,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'장합',look:'cavalry',at:[48,62],face:'right'},
            {name:'위군 척후',look:'infantry'},
          ],
          steps:[
            {enter:'위군 척후',at:[70,64],from:'right'},
            {emote:'장합',text:'!'},
            {say:'위군 척후',line:'산 위 촉군이 물통을 지고 북쪽 샘으로 내려옵니다! 서쪽 길에도 급수대가 보입니다!'},
            {say:'사마의',line:'물은 칼보다 느리게, 그러나 반드시 사람을 무너뜨립니다. 샘 두 칸을 내주지 마십시오.'},
            {exit:'위군 척후',to:'right'},
          ]},
      ],
      after:[
        {place:'가정 · 무너진 남산의 진',art:4,
          cast:[
            {name:'장합',look:'cavalry',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {say:'장합',line:'마속의 진이 무너졌소. 제갈량은 한중으로 물러갈 수밖에 없겠지.'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'제갈량은 마속을 벨 겁니다. 법을 세우려고요. 그리고 반드시 다시 나옵니다. 다음에는 더 단단하게.'},
            {move:'장합',to:[66,62]},
            {emote:'장합',text:'…'},
            {narrate:'한중으로 돌아간 제갈량은 눈물을 흘리며 마속을 베었다. 그리고 스스로 벼슬을 세 등급 깎았다.'},
          ]},
      ],
    },

    // ───────────────────────── S2-07 자오곡 · 양평관
    {
      id:'S2-07',year:'230년',title:'젖은 잔도',
      synopsis:'대사마 조진이 이번에는 위가 먼저 촉으로 들어간다며 자오곡으로 나섰다. 서른 날 이어진 비에 잔도가 무너지고, 그 틈에 위연이 곽회의 진영을 치고 양평관으로 돌아가려 한다.',
      scenes:[
        {place:'장안 · 조진의 출정',art:14,
          cast:[
            {name:'조진',look:'heavy',at:[56,60],face:'left'},
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
          ],
          steps:[
            {narrate:'230년. 대사마가 된 조진은 해마다 촉이 오기만 기다릴 수 없다고 아뢰었다. 조진은 자오곡으로, 사마의는 한수를 거슬러 한중으로 들어가기로 했다.'},
            {say:'조진',line:'몇 해째 저쪽이 오기만 기다렸네. 이번에는 우리가 간다. 한중에서 만나세, 중달.'},
            {move:'사마의',to:[44,60]},
            {say:'사마의',line:'장군, 잔도는 비에 약합니다. 하늘이 길을 끊으면 체면 때문에 버티지 마십시오.'},
            {emote:'조진',text:'♪'},
            {say:'조진',line:'자네는 늘 돌아올 길부터 걱정하는군. 그게 자네가 살아남는 법이겠지.'},
            {exit:'조진',to:'right'},
          ]},
        {place:'자오곡 · 서른 날의 비',art:4,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'곽회',look:'spear'},
          ],
          steps:[
            {narrate:'비가 서른 날 그치지 않았다. 잔도가 끊기고, 군량 수레는 진흙에 박혀 꿈쩍하지 않았다.'},
            {enter:'곽회',at:[56,62],from:'right'},
            {emote:'곽회',text:'땀'},
            {say:'곽회',line:'도독, 비가 그치지 않습니다. 길이 끊기고 군량이 늦어 조 대사마께서 회군을 고민하십니다.'},
            {say:'사마의',line:'그보다 위연이 서쪽으로 돌아 곽 장군의 진영을 노린다는 첩보가 있소.'},
            {choice:'사마의',options:[
              {id:'advise',text:'대사마께 회군을 권하는 글을 올리겠소. 비와는 싸울 수 없소.',
                reply:'장군의 체면보다 병사의 목숨이 무겁소. 그 글의 탓은 내가 지겠소.',
                answer:{speaker:'곽회',line:'대사마께서 언짢아하실 겁니다. 그래도… 누군가는 말해야 했습니다.'},
                note:'아군 전원 첫 턴 방어 태세 · 조진과의 이야기가 달라진다',
                effects:[{kind:'guard'},{kind:'flag',flag:'advised_retreat'}]},
              {id:'hold',text:'회군은 대사마께서 정하실 일이오. 우리는 위연만 보오.',
                reply:'윗사람의 일에 말을 보태지 않는 것도 신하의 길이오. 대신 위연의 길을 먼저 읽겠소.',
                note:'책략 MP +15',
                effects:[{kind:'insight'}]},
            ]},
            {say:'곽회',line:'진영은 버티겠습니다. 다만 위연이 양평관으로 빠지기 전에 잡아야 합니다.'},
            {move:'곽회',to:[70,62]},
          ]},
      ],
      after:[
        {place:'양평관 · 비 그친 저녁',art:11,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {say:'곽회',line:'진영은 지켰습니다. 그러나 조 대사마께서 회군을 명하셨습니다.'},
            {say:'곽회',line:'대사마께서 도독의 글을 읽고 한참을 말이 없으셨답니다. 그리고 짧게, 중달 말이 옳다고.',when:'advised_retreat'},
            {emote:'사마의',text:'…'},
            {move:'사마의',to:[46,60]},
            {say:'사마의',line:'비가 우리를 막았고, 위연은 길을 알았소. 다음에는 우리가 길을 먼저 알아야 하오.'},
            {exit:'곽회',to:'right'},
            {narrate:'젖은 길을 되짚어 돌아온 조진은 그 겨울 병석에 누웠다.'},
          ]},
      ],
    },

    // ───────────────────────── S2-08 석정(회상)
    {
      id:'S2-08',year:'228년(회상)',title:'능선과 골짜기',
      synopsis:'회군한 겨울밤, 사마의는 두 아들과 두 해 전 석정의 일을 떠올린다. 육손의 유인에 빠진 조휴를 구하러, 사마의는 능선에 서고 사마사·사마소가 협석 골짜기의 목책을 뚫고 달렸던 날이다.',
      scenes:[
        {place:'완성 · 회군한 겨울밤',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[40,58],face:'right'},
            {name:'사마소',look:'crossbow',at:[60,62],face:'left'},
            {name:'사마사',look:'cavalry'},
          ],
          steps:[
            {narrate:'230년 겨울, 완성. 빗물에 젖은 갑옷을 말리던 밤, 사마소가 등불 아래에서 물었다.'},
            {say:'사마소',line:'아버님, 길을 먼저 알아야 한다고 하셨지요. 석정에서도 똑같이 말씀하셨습니다.'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'기억하느냐. 두 해 전 가을, 너희가 처음으로 내 곁을 떠나 싸운 날을.'},
            {narrate:'— 228년 가을. 조휴는 오의 주방이 보낸 거짓 항복 편지를 믿고 석정 깊이 들어갔다. 그곳에서 그를 기다린 것은 육손이었다.'},
            {enter:'사마사',at:[74,62],from:'right'},
            {emote:'사마사',text:'!'},
            {say:'사마사',line:'아버님, 조휴 장군이 육손에게 속아 석정 깊이 들어갔다가 포위되었습니다. 협석 골짜기가 막혔습니다.'},
            {say:'사마의',line:'나는 저 능선에 서서 골짜기를 내려다보겠다. 목책은 내가 책략으로 흔들 테니, 너희 둘은 멈추지 말고 달려라.'},
            {say:'사마소',line:'형님이 앞을 열면 제가 비탈의 궁수를 떨어뜨리겠습니다. 조휴 장군의 진영이 버틸 때까지.'},
          ]},
        {place:'석정 · 협석 골짜기 어귀',art:4,
          cast:[
            {name:'육손',look:'strategist',at:[60,54],face:'left'},
            {name:'오군 전령',look:'infantry'},
          ],
          steps:[
            {enter:'오군 전령',at:[44,62],from:'left'},
            {say:'오군 전령',line:'대도독, 위의 능선에 사마의의 깃발이 섰습니다! 골짜기로는 젊은 장수 둘이 달려옵니다!'},
            {emote:'육손',text:'?'},
            {say:'육손',line:'아비는 높은 데 서고 아들들을 골짜기로 보냈다… 협석의 목책을 닫아라. 젊은 말은 막히면 날뛴다.'},
            {exit:'오군 전령',to:'left'},
          ]},
      ],
      after:[
        {place:'석정 · 열린 협석 길',art:11,
          cast:[
            {name:'사마사',look:'cavalry',at:[56,62],face:'left'},
            {name:'조휴',look:'infantry',at:[70,64],face:'left'},
            {name:'사마의',look:'strategist'},
          ],
          steps:[
            {enter:'사마의',at:[38,60],from:'left'},
            {say:'사마사',line:'조휴 장군을 모셔 왔습니다. 진영은 잃었지만 군은 살았습니다.'},
            {emote:'조휴',text:'땀'},
            {move:'사마의',to:[46,60]},
            {say:'사마의',line:'잘했다. 오늘 너희는 내가 없는 곳에서 싸웠다. 그것이 내가 바라던 일이다.'},
            {narrate:'석정의 부끄러움을 안고 돌아간 조휴는 그해를 넘기지 못했다. — 이야기가 끝나자 사마소는 오래 등불만 바라보았다. 이듬해 봄, 제갈량이 다시 기산으로 나왔다.'},
          ]},
      ],
    },

    // ───────────────────────── S2-09 성고
    {
      id:'S2-09',year:'231년',title:'막힌 강, 열린 길',
      synopsis:'조진이 병석에 눕자 조예는 사마의에게 서쪽의 모든 군을 맡겼다. 제갈량이 다시 기산으로 나왔고, 강물이 불어 대릉의 전선이 강가에 묶였다. 사마의는 북쪽 산길로 돌아 촉의 보급로인 성고 성채를 친다.',
      scenes:[
        {place:'장안 · 장합과의 군의',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'장합',look:'cavalry',at:[54,62],face:'left'},
            {name:'곽회',look:'spear'},
          ],
          steps:[
            {narrate:'231년 봄. 조진이 병석에 눕자 황제 조예는 사마의를 장안으로 불러 서쪽의 모든 군을 맡겼다. 제갈량이 네 번째로 기산에 나왔다.'},
            {say:'장합',line:'대사마께서 병석에서 말씀하셨다 하오. 자오곡에서 중달의 글이 아니었으면 군을 다 잃었을 거라고.',when:'advised_retreat'},
            {say:'장합',line:'대사마께서 병석에서 서쪽 일은 중달에게 맡기라 하셨다 하오. 그대가 이제 우리의 기둥이오.',unless:'advised_retreat'},
            {say:'장합',line:'군을 둘로 나누어 옹과 미에 따로 두는 것이 어떻소? 한쪽이 막히면 다른 쪽이 돕게.'},
            {say:'사마의',line:'나누면 초의 세 군이 경포에게 하나씩 먹혔듯 됩니다. 한데 모으겠습니다.'},
            {enter:'곽회',at:[74,62],from:'right'},
            {emote:'곽회',text:'땀'},
            {say:'곽회',line:'대릉 장군의 전선이 강가에 묶였습니다. 강물이 불어 건널 수 없고, 강 건너 투석기가 매일 진을 깎습니다.'},
            {say:'사마의',line:'막힌 곳을 아무리 두드려도 열리지 않소. 촉군의 군량은 성고 성채를 거쳐 오오. 북쪽 산길로 돌아 그곳을 찌르겠소.'},
            {say:'곽회',line:'그 사이 대릉 장군이 버텨야 합니다. 도독, 길에서 너무 오래 머물지 마십시오.'},
            {move:'장합',to:[62,60]},
          ]},
        {place:'성고 · 불어난 강',art:4,
          cast:[
            {name:'대릉',look:'infantry',at:[44,62],face:'right'},
            {name:'전선 병사',look:'infantry'},
          ],
          steps:[
            {emote:'대릉',text:'땀'},
            {enter:'전선 병사',at:[64,64],from:'right'},
            {say:'전선 병사',line:'장군! 강 건너 투석기가 또 돌을 올립니다!'},
            {say:'대릉',line:'엎드려라! 방패를 겹쳐라! 도독이 성고를 칠 때까지만 이 강둑을 버티면 된다!'},
            {move:'전선 병사',to:[54,64]},
          ]},
      ],
      after:[
        {place:'성고 · 되찾은 성채',art:8,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'이엄의 사자',look:'civil'},
          ],
          steps:[
            {enter:'이엄의 사자',at:[72,64],from:'right'},
            {emote:'이엄의 사자',text:'땀'},
            {say:'곽회',line:'이엄의 편지가 승상에게 갔습니다. 군량이 끊긴 것을 숨긴 채로요.'},
            {say:'사마의',line:'제갈량은 싸움이 아니라 제 편의 거짓말 때문에 물러날 것이오. 그래도 그는 다시 오오. 다음 상대는… 장합 장군이 먼저 맞게 될 것이오.'},
            {exit:'이엄의 사자',to:'right'},
          ]},
      ],
    },

    // ───────────────────────── S2-10 상규
    {
      id:'S2-10',year:'231년',title:'불타는 보리밭',
      synopsis:'성고를 잃고도 제갈량은 곧장 물러나지 않았다. 굶주린 촉군이 상규의 익은 보리를 베어 가고, 고상이 수레를 몰아 서쪽 골짜기로 빠지려 한다. 촉군은 밭에 불을 놓고 길목에 함정을 묻었다.',
      scenes:[
        {place:'상규 · 군막',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'곽회',look:'spear'},
          ],
          steps:[
            {narrate:'그러나 제갈량은 곧장 물러나지 않았다. 굶주린 군을 이끌고 상규로 가, 익어 가는 보리를 베기 시작했다.'},
            {enter:'곽회',at:[56,62],from:'right'},
            {say:'곽회',line:'도독, 제갈량의 군이 상규의 보리를 베고 있습니다. 고상이 수레를 몰고 서쪽 골짜기로 나가려 합니다.'},
            {emote:'사마의',text:'!'},
            {say:'사마의',line:'보리를 가져가면 저들은 한 달을 더 버틴다. 고상을 놓쳐서는 안 되오. 다만 저들은 밭에 불을 놓을 것이오.'},
            {say:'곽회',line:'남쪽 골짜기가 지름길이지만, 촉군이 무언가를 묻어 두었다는 말이 있습니다. 먼저 살피고 들어가십시오.'},
            {move:'곽회',to:[66,62]},
          ]},
        {place:'상규 · 익어 가는 보리밭',art:4,
          cast:[
            {name:'고상',look:'infantry',at:[40,60],face:'left'},
            {name:'보리 베는 병사',look:'spear',at:[58,64],face:'left'},
          ],
          steps:[
            {say:'고상',line:'수레가 가득 찼다! 서쪽 골짜기로 나간다. 밭에는 불을 놓아라, 위군이 따라오지 못하게!'},
            {emote:'보리 베는 병사',text:'…'},
            {say:'보리 베는 병사',line:'장군, 밭 주인들이 울며 매달립니다. 한 해 농사라고…'},
            {say:'고상',line:'승상께서 굶는 병사부터 먹이라 하셨다. 미안하다 하고 불을 놓아라.'},
            {exit:'고상',to:'left'},
            {move:'보리 베는 병사',to:[46,64]},
          ]},
      ],
      after:[
        {place:'상규 · 타고 남은 밭',art:4,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {emote:'곽회',text:'땀'},
            {say:'곽회',line:'고상을 꺾었습니다. 보리 수레는 반도 못 가져갔습니다.'},
            {say:'사마의',line:'불길과 함정은 시간을 벌려는 것이었소. 제갈량에게 가장 모자란 것은 군량이 아니라 시간이오.'},
            {move:'사마의',to:[30,58]},
            {exit:'곽회',to:'right'},
            {narrate:'타 버린 밭 위로 재가 날렸다. 여름이 깊어 갈 무렵, 촉군의 깃발이 하나둘 남쪽으로 기울기 시작했다.'},
          ]},
      ],
    },

    // ───────────────────────── S2-11 목문도
    {
      id:'S2-11',year:'231년',title:'목문도의 화살',
      synopsis:'군량이 떨어진 제갈량이 물러난다. 장합은 물러나는 군을 쫓지 말라 했으나 선봉에 섰고, 사마의의 본대가 뒤를 따른다. 목문도의 골짜기 위에는 쇠뇌가 기다리고 있다.',
      scenes:[
        {place:'기산 · 물러나는 촉군',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'곽회',look:'spear',at:[20,62],face:'right'},
            {name:'장합',look:'cavalry'},
          ],
          steps:[
            {narrate:'231년 여름. 군량이 끊긴 촉군이 기산에서 진을 거두기 시작했다. 조정에서는 왜 쫓지 않느냐는 글이 날아들었다.'},
            {say:'사마의',line:'제갈량이 군량이 떨어져 물러납니다. 장 장군, 선봉을 맡아 쫓아 주시오.'},
            {enter:'장합',at:[56,62],from:'right'},
            {say:'장합',line:'병법에 물러나는 군은 쫓지 말라 했소. 제갈량은 물러날 때 반드시 덫을 남기는 자요.',to:'사마의'},
            {emote:'곽회',text:'…'},
            {choice:'사마의',options:[
              {id:'order',text:'조정의 눈이 우리를 보고 있소. 장 장군, 앞장서 주시오.',
                reply:'쫓지 않으면 겁쟁이라 불리고, 그 이름은 군 전체를 꺾소. 본대도 곧 뒤따르겠소.',
                answer:{speaker:'장합',line:'…명이라면 가겠소. 다만 골짜기 어귀에서 반드시 기다려 주시오.'},
                note:'아군 전원 처음 2턴 사기 상승',
                effects:[{kind:'rally'}]},
              {id:'together',text:'장군의 말이 옳소. 본대를 장군 바로 뒤에 붙여 함께 가겠소.',
                reply:'덫이 있다면 둘이 함께 밟읍시다. 혼자 앞서지 마시오.',
                answer:{speaker:'장합',line:'그 말을 들으니 마음이 놓이오. 골짜기 어귀에서 기다리겠소.'},
                note:'아군 전원 첫 턴 방어 태세 · 뒷이야기가 달라진다',
                effects:[{kind:'guard'},{kind:'flag',flag:'heeded_zhanghe'}]},
            ]},
            {exit:'장합',to:'right'},
          ]},
        {place:'목둔 · 골짜기 어귀',art:4,
          cast:[
            {name:'벼랑 쇠뇌수',look:'crossbow',at:[78,40],face:'left'},
            {name:'장합',look:'cavalry'},
          ],
          steps:[
            {narrate:'목문도. 좁은 골짜기 양쪽 벼랑 위, 풀숲 사이로 쇠뇌 끝이 번뜩였다.'},
            {say:'벼랑 쇠뇌수',line:'승상의 명이다. 위의 장수가 어귀에 들어서면 쏴라. 연노 열 발이 한 번에 난다.'},
            {enter:'장합',at:[40,64],from:'left'},
            {emote:'장합',text:'?'},
            {say:'장합',line:'이 골짜기, 너무 조용하오. 새 한 마리 울지 않는군.'},
            {move:'장합',to:[48,64]},
          ]},
      ],
      after:[
        {place:'목둔 · 돌아오는 길',art:11,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'위군 병사',look:'infantry'},
          ],
          steps:[
            {enter:'위군 병사',at:[72,64],from:'right'},
            {say:'곽회',line:'장 장군의 시신을 수습했습니다. 무릎에 쇠뇌 화살이 박혀 있었습니다.'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'쫓지 말라 한 그의 말이 옳았소. 나는 그 말을 오래 기억할 것이오.',unless:'heeded_zhanghe'},
            {say:'사마의',line:'그의 말을 듣고 곁에 붙었는데도… 하늘은 끝내 그를 데려갔소. 그 골짜기를 나는 잊지 않을 것이오.',when:'heeded_zhanghe'},
            {exit:'위군 병사',to:'left'},
          ]},
      ],
    },

    // ───────────────────────── S2-12 위수
    {
      id:'S2-12',year:'234년',title:'세 여울',
      synopsis:'234년, 세 해 동안 군량을 모은 제갈량이 다섯 번째로 나와 위수 남쪽 오장원에 진을 쳤다. 위수에는 건널 수 있는 여울이 셋. 사마의는 가운데를 두텁게 하고 예비대로 측면을 받친다.',
      scenes:[
        {place:'위수 북안 · 군막',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[22,62],face:'right'},
            {name:'곽회',look:'spear'},
          ],
          steps:[
            {narrate:'234년 봄. 세 해 동안 목우와 유마로 군량을 모은 제갈량이 다섯 번째로 나왔다. 이번에는 둔전까지 일구며 오래 머물 채비였다.'},
            {enter:'곽회',at:[58,62],from:'right'},
            {say:'곽회',line:'제갈량이 위수 남쪽 오장원에 진을 쳤습니다. 여울은 셋, 우리가 지킬 곳도 셋입니다.'},
            {say:'사마의',line:'셋을 다 같은 힘으로 지키면 셋 다 뚫리오. 가운데를 두텁게 하고, 측면은 오는 것을 보고 예비대를 보내겠소.'},
            {say:'곽회',line:'서쪽 북원은 제가 맡겠습니다. 장 장군을 잃은 뒤로 병사들이 도독만 바라봅니다.'},
            {emote:'사마사',text:'!'},
            {say:'사마사',line:'예비대는 제가 끌겠습니다. 노란 깃발이 오르는 쪽으로 곧장 달리겠습니다.'},
            {exit:'곽회',to:'right'},
          ]},
        {place:'위수 · 남안 촉군 진',art:15,
          cast:[
            {name:'맹염',look:'cavalry',at:[56,62],face:'left'},
            {name:'촉 도하 보병',look:'infantry',at:[70,64],face:'left'},
          ],
          steps:[
            {say:'맹염',line:'승상께서 다리를 놓아 뒤를 받쳐 주신다 하셨다. 여울을 건너 사마의의 진영을 밟자!'},
            {emote:'촉 도하 보병',text:'!'},
            {move:'맹염',to:[44,62]},
            {move:'촉 도하 보병',to:[56,64]},
          ]},
      ],
      after:[
        {place:'위수 · 물러선 남안',art:4,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {say:'곽회',line:'세 여울 모두 막았습니다. 촉군이 오장원으로 물러갑니다.'},
            {say:'사마의',line:'이제 저들은 싸움을 걸어 올 것이오. 우리는 받지 않소. 오래 버티는 쪽이 이기는 싸움이 되었소.'},
            {emote:'곽회',text:'?'},
            {move:'사마의',to:[34,58]},
            {exit:'곽회',to:'right'},
          ]},
      ],
    },

    // ───────────────────────── S2-13 호로곡
    {
      id:'S2-13',year:'234년',title:'하늘이 내린 비',
      synopsis:'호로곡에 촉군의 군량 창고가 있다는 첩보가 들어온다. 미끼인 줄 알면서도 확인하러 들어간 사마의 부자는 골짜기 안에서 갈라지고, 사방에서 불길이 일어난다. 합류해 버티면 하늘이 길을 열 것이다.',
      scenes:[
        {place:'위수 · 사마의의 군막',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[38,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[22,62],face:'right'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {enter:'사마소',at:[60,62],from:'right'},
            {say:'사마소',line:'아버님, 호로곡에 촉군의 군량 창고가 있다는 첩보입니다. 지키는 병사도 적다고 합니다.'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'제갈량이 군량을 그렇게 허술하게 둘 리 없다. 그러나 확인은 해야 한다. 사야, 너는 북쪽 길로, 나는 남쪽 길로 들어간다.'},
            {say:'사마사',line:'골짜기 가운데에서 만나겠습니다. 무슨 일이 있어도 그곳까지는 가겠습니다.'},
            {choice:'사마의',options:[
              {id:'vow',text:'불길이 일면 서로를 찾아라. 셋이 함께가 아니면 나오지 마라.',
                reply:'한 사람을 두고 나온 살길은 길이 아니다. 우리는 가운데에서 다시 하나가 된다.',
                answer:{speaker:'사마소',line:'형님의 깃발만 보고 달리겠습니다.'},
                note:'아군 전원 처음 2턴 사기 상승 · 뒷이야기가 달라진다',
                effects:[{kind:'rally'},{kind:'flag',flag:'sons_vow'}]},
              {id:'first',text:'만일 내가 막히면 나를 찾지 말고 너희부터 빠져나가라.',
                reply:'늙은이 하나를 잃는 것은 괜찮다. 사마씨의 내일은 너희 둘에게 있다.',
                answer:{speaker:'사마사',line:'…그 명만은 따를 수 없을지도 모릅니다.'},
                note:'아군 전원 첫 턴 방어 태세 · 뒷이야기가 달라진다',
                effects:[{kind:'guard'},{kind:'flag',flag:'father_first'}]},
            ]},
            {exit:'사마사',to:'left'},
          ]},
        {place:'호로곡 · 불길을 기다리는 골짜기',art:4,
          cast:[
            {name:'제갈량',look:'strategist',at:[64,48],face:'left'},
            {name:'위연',look:'infantry'},
            {name:'촉 매복병',look:'spear',at:[80,62],face:'left'},
          ],
          steps:[
            {enter:'위연',at:[48,62],from:'left'},
            {emote:'위연',text:'!'},
            {say:'위연',line:'승상! 사마의가 미끼를 물었습니다. 부자가 따로따로 골짜기로 들어옵니다!'},
            {say:'제갈량',line:'어귀를 막고 마른 풀에 불을 놓아라. 오늘 이 골짜기에서 중달과의 긴 싸움을 끝낸다.'},
            {move:'촉 매복병',to:[72,58]},
            {exit:'위연',to:'left'},
          ]},
      ],
      after:[
        {place:'호로곡 · 비 그친 출구',art:11,
          cast:[
            {name:'사마사',look:'cavalry',at:[56,62],face:'left'},
            {name:'사마소',look:'crossbow',at:[68,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {emote:'사마사',text:'땀'},
            {say:'사마사',line:'아버님, 비가 아니었다면…'},
            {say:'사마소',line:'서로를 찾으라 하신 말씀대로, 불길 속에서도 형님의 깃발만 보고 달렸습니다.',when:'sons_vow'},
            {say:'사마사',line:'먼저 빠지라 하셨지만… 저희는 못 들은 척했습니다. 벌하셔도 좋습니다.',when:'father_first'},
            {emote:'사마의',text:'…'},
            {say:'사마의',line:'하늘이 우리를 살렸다. 그러나 다시는 저자의 미끼를 물지 않겠다. 이제 우리는 싸우지 않고 기다린다.'},
            {move:'사마의',to:[48,60]},
          ]},
      ],
    },

    // ───────────────────────── S2-14 오장원
    {
      id:'S2-14',year:'234년',title:'산 중달이 달아나다',
      synopsis:'백 일 넘게 이어진 대치 끝에, 큰 별이 오장원으로 떨어졌다. 제갈량이 죽고 촉군이 물러난다. 그러나 쫓아간 위군 앞에서 촉군이 돌아서고, 수레 위에 죽었다던 제갈량이 앉아 있다.',
      scenes:[
        {place:'위수 · 백 일의 대치',art:16,
          cast:[
            {name:'사마의',look:'strategist',at:[36,58],face:'right'},
            {name:'사마사',look:'cavalry',at:[22,62],face:'right'},
            {name:'촉 사자',look:'civil'},
          ],
          steps:[
            {narrate:'그 뒤로 백여 일. 위군은 성채에서 나오지 않았다. 싸움을 걸다 못한 제갈량은 상자 하나를 들려 사자를 보냈다. 안에는 여인의 옷과 머리꾸미개가 들어 있었다.'},
            {enter:'촉 사자',at:[60,62],from:'right'},
            {say:'촉 사자',line:'승상께서 보내신 것이오. 나와서 싸우지 못하는 장수에게는 이 옷이 어울린다 하셨소.'},
            {emote:'사마사',text:'분노'},
            {say:'사마의',line:'좋은 옷이구려. 그런데 승상께서는 요즘 잠은 잘 주무시오? 식사는 얼마나 드시오?',to:'촉 사자'},
            {say:'촉 사자',line:'일찍 일어나 늦게 주무시고, 장 스무 대 넘는 벌도 몸소 살피시오. 드시는 것은 하루 몇 홉뿐이오.'},
            {exit:'촉 사자',to:'right'},
            {say:'사마의',line:'먹는 것은 적고 일은 많으니, 어찌 오래 가겠느냐. 사야, 옷은 잘 개어 두어라.'},
          ]},
        {place:'위수 · 별이 떨어진 밤',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'곽회',look:'spear'},
          ],
          steps:[
            {enter:'곽회',at:[56,62],from:'right'},
            {say:'곽회',line:'도독, 어젯밤 큰 별이 오장원 쪽으로 떨어졌습니다. 촉군 진영이 조용합니다.'},
            {emote:'사마의',text:'!'},
            {say:'사마의',line:'제갈량이 죽었소. 촉군이 물러나기 시작할 것이오. 지금 쫓으면 그들의 꼬리를 자를 수 있소.'},
            {choice:'사마의',options:[
              {id:'wary',text:'쫓되, 깃발 하나에도 물러설 수 있게 대열을 늦추지 마시오.',
                reply:'죽은 자의 꾀가 살아 있을지도 모르오. 꼬리만 자르고 머리는 건드리지 않겠소.',
                answer:{speaker:'곽회',line:'옳습니다. 장 장군을 잃은 목둔을 잊지 않겠습니다. 퇴로부터 열어 두지요.'},
                note:'아군 전원 첫 턴 방어 태세',
                effects:[{kind:'guard'},{kind:'flag',flag:'wary_pursuit'}]},
              {id:'hard',text:'그의 수레까지 쫓으시오. 오늘 끝을 보겠소.',
                reply:'열 해를 그에게 끌려다녔소. 마지막 날만큼은 내가 그를 쫓겠소.',
                answer:{speaker:'곽회',line:'그는 물러날 때마다 덫을 남겼습니다. 목둔처럼… 그래도 명이라면, 북을 울리겠습니다!'},
                note:'아군 전원 처음 2턴 사기 상승 · 뒷이야기가 달라진다',
                effects:[{kind:'rally'},{kind:'flag',flag:'hard_pursuit'}]},
            ]},
            {exit:'곽회',to:'right'},
          ]},
        {place:'오장원 · 비어 가는 진영',art:4,
          cast:[
            {name:'강유',look:'cavalry'},
            {name:'제갈량의 수레',look:'strategist',at:[64,58],face:'left'},
          ],
          steps:[
            {enter:'강유',at:[48,62],from:'left'},
            {say:'강유',line:'승상의 유언대로 한다. 위군이 쫓아오면 깃발을 돌리고 수레를 앞세워라. …승상, 마지막까지 저들을 속이시는군요.',to:'제갈량의 수레'},
            {emote:'강유',text:'…'},
            {move:'강유',to:[56,62]},
          ]},
      ],
      after:[
        {place:'오장원 · 동쪽으로 돌아가는 길',art:11,
          cast:[
            {name:'곽회',look:'spear',at:[56,62],face:'left'},
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
          ],
          steps:[
            {say:'곽회',line:'촉군이 다 빠져나갔습니다. 그 수레에 있던 것은 나무로 깎은 상이었다고 합니다.'},
            {say:'곽회',line:'가장 깊이 쫓던 우리가 가장 멀리 달아났지요. 백성들이 노래합니다. 죽은 제갈이 산 중달을 쫓았다고.',when:'hard_pursuit'},
            {say:'사마의',line:'산 사람의 뜻은 헤아릴 수 있어도, 죽은 사람의 뜻은 헤아릴 수 없었소. 사람들이 웃어도 좋소. 나는 살아서 돌아왔소.'},
            {move:'사마의',to:[30,58]},
            {say:'사마의',line:'빈 진영의 짜임새를 보았소. 우물 하나, 부뚜막 하나도 법도에 맞았소. 그는 천하의 기재였소.'},
            {emote:'곽회',text:'…'},
            {exit:'곽회',to:'right'},
          ]},
      ],
    },

    // ───────────────────────── 운명의 갈림길 · 오래 기다린 자의 선택
    {
      id:'fate:3:wei',year:'234년 이후',title:'오래 기다린 자의 선택',
      synopsis:'긴 싸움이 끝났다. 조정에서는 대장군 조상이 병권을 쥐고 노신을 밀어낸다. 몸은 늙었고 남은 날은 많지 않다. 은인자중의 끝에서, 사마의는 남은 생을 어디에 거는가.',
      scenes:[
        {place:'낙양 · 사마가의 뜰',art:0,
          cast:[
            {name:'사마의',look:'strategist',at:[44,58],face:'right'},
            {name:'사마사',look:'cavalry',at:[28,62],face:'right'},
            {name:'사마소',look:'crossbow',at:[18,64],face:'right'},
            {name:'조상의 사자',look:'civil'},
            {name:'사마부',look:'civil'},
            {name:'등애',look:'spear'},
          ],
          steps:[
            {narrate:'오장원 뒤로 여러 해. 서쪽 국경은 조용해졌고, 위수의 노장은 낙양으로 돌아왔다. 황제 조예는 병약해지고, 종친 조상이 조정의 병권을 쥐어 간다.'},
            {enter:'조상의 사자',at:[68,62],from:'right'},
            {say:'조상의 사자',line:'대장군의 말씀이오. 태위께서는 연로하시니 이제 태부로 높여 모시겠다 하오. 병권은 대장군께서 맡으시겠다고.'},
            {emote:'사마사',text:'분노'},
            {say:'사마의',line:'대장군의 배려에 감사드린다고 전하시오. 늙은이에게는 높은 자리가 곧 쉴 자리요.',to:'조상의 사자'},
            {exit:'조상의 사자',to:'right'},
            {move:'사마사',to:[34,60]},
            {say:'사마사',line:'아버님! 저것은 높임이 아니라 칼을 빼앗는 것입니다. 아직 금군 안에 우리 사람이 있습니다. 지금 쳐야 합니다.'},
            {say:'사마소',line:'호로곡에서 서로를 찾으라 하셨지요. 이번에는 저희가 아버님 곁을 찾아왔습니다.',when:'sons_vow'},
            {enter:'사마부',at:[60,60],from:'right'},
            {say:'사마부',line:'중달아, 우리 집안은 위의 녹을 먹었다. 칼을 뽑으면 이름이 남는다. 오장원에서처럼 기다려라.',to:'사마의'},
            {enter:'등애',at:[78,64],from:'right'},
            {emote:'등애',text:'!'},
            {say:'등애',line:'애, 애는 생각합니다. 회수 남북에 둔전을 열면 다섯 해 군량이 쌓입니다. 조정 다툼보다 강동을 치는 것이 천하의 일입니다.'},
            {say:'사마소',line:'등 장군은 말은 더듬어도 셈은 더듬지 않지요.'},
            {emote:'사마의',text:'…'},
            {move:'사마의',to:[48,56]},
            {say:'사마의',line:'기다림은 내 평생의 칼이었다. 그 칼을 계속 품을 것이냐, 지금 뽑을 것이냐, 아니면 다른 곳으로 겨눌 것이냐.'},
            {choice:'사마의',options:[
              {id:'patience',text:'병을 칭하고 문을 닫는다. 때는 반드시 온다.',
                reply:'오장원에서 나는 달아났고, 살아서 돌아왔다. 이번에도 기다린다. 기다리는 동안 조상은 스스로 무너질 것이다.',
                answer:{speaker:'사마부',line:'…그것이 네가 가장 잘하는 일이지.'},
                note:'정사 · 은인자중 — 요동 요수로. 우두머리 공손연'},
              {id:'coup',text:'사야, 사병을 모아라. 지금 조상을 친다.',
                reply:'나는 너무 오래 기다렸다. 남은 날이 많지 않다. 몸에 힘이 남았을 때 낙양을 쥔다.',
                answer:{speaker:'사마사',line:'삼천이면 됩니다. 무기고부터 쥐겠습니다.'},
                note:'가상 · 이른 정변 — 낙양 정변. 우두머리 조상'},
              {id:'unify',text:'조정은 너희에게 맡긴다. 나는 등애와 함께 강동으로 간다.',
                reply:'제갈량을 막은 손으로 손권까지 꺾는다면, 늙은이의 남은 날로 그만한 쓸 곳은 없다.',
                answer:{speaker:'등애',line:'애, 애가 앞길을 닦겠습니다! 물길은 제가 압니다.'},
                note:'가상 · 천하통일 — 강동 수향. 우두머리 육손'},
            ]},
          ]},
      ],
    },
  ],
};
export default pack;
