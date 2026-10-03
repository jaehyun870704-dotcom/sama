import type {ScenarioPack} from '../scenario-types.ts';

/**
 * 연의 하편(정사 · 은인자중): 'fate:3:wei'에서 「병을 칭하고 때를 기다린다」를 고른 뒤
 * 요수(S3-01) → 양평 → 번성 → 환성 → 낙곡 → 고평릉의 변(S3-06) → 수춘(S3-07) → 결말 「진(晉)의 기틀」.
 * 표식(flag)은 h3_ 로 시작한다.
 */
const pack:ScenarioPack={
  chapters:[
    // ── S3-01 깃발은 남쪽에
    {
      id:'S3-01',year:'238년',title:'깃발은 남쪽에',
      synopsis:'기다리기로 한 노신에게 황제의 부름이 먼저 닿는다. 요동의 공손연이 연왕을 칭했다. 사마의는 요수에 이르러 남쪽에 깃발을 세우고, 북쪽으로 건넌다.',
      scenes:[
        {
          place:'낙양 · 궁정',art:5,
          cast:[
            {name:'조예',look:'civil',at:[70,52],face:'left'},
            {name:'내관',look:'civil',at:[84,58],face:'left'},
            {name:'사마의',look:'strategist'},
          ],
          steps:[
            {narrate:'기다리기로 한 사람에게도 일은 먼저 찾아왔다. 238년 정월, 요동의 공손연이 연왕을 칭하자 황제 조예가 장안의 사마의를 낙양으로 불렀다.'},
            {enter:'사마의',at:[34,60],from:'left'},
            {say:'조예',line:'태위, 공손연은 어떻게 나오겠소? 그리고 그를 꺾는 데 얼마나 걸리겠소?',to:'사마의'},
            {say:'사마의',line:'성을 버리고 달아나면 상책, 요수에서 막으면 중책, 양평에 앉아 지키면 하책입니다. 그는 요수에서 막다가 양평으로 물러날 것입니다.',to:'조예'},
            {say:'사마의',line:'가는 데 백 일, 싸우는 데 백 일, 돌아오는 데 백 일, 쉬는 데 육십 일. 한 해면 족합니다.'},
            {emote:'조예',text:'!'},
            {move:'내관',to:[78,60]},
            {say:'조예',line:'한 해라… 짐이 기다리겠소. 사만 군을 내어 주리다.'},
            {exit:'사마의',to:'left'},
          ],
        },
        {
          place:'하내 온현 · 고향 마을',art:0,
          cast:[
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[26,64],face:'right'},
            {name:'마을 어른',look:'civil'},
          ],
          steps:[
            {narrate:'요동으로 가는 길은 하내 온현을 지난다. 사마의가 나고 자란 땅이다.'},
            {enter:'마을 어른',at:[64,58],from:'right'},
            {say:'마을 어른',line:'태위께서 오셨다! 늙은이들이 술과 소를 마련했습니다. 하룻밤만 머물다 가십시오.',to:'사마의'},
            {emote:'사마사',text:'?'},
            {choice:'사마의',options:[
              {id:'hometown',text:'하룻밤 머물러 고향 어른들과 잔을 나눈다',
                reply:'만 리를 쓸고 공을 이루면, 늙어 무양으로 돌아가 처분을 기다리리라. 오늘은 그 노래를 부르고 싶구나.',
                answer:{speaker:'마을 어른',line:'태위의 노래를 온현이 오래 기억하겠습니다.'},
                note:'고향의 정이 병사들을 달군다: 첫 2턴 아군 사기 상승',
                effects:[{kind:'rally'},{kind:'flag',flag:'h3_hometown'}]},
              {id:'straight',text:'잔은 돌아오는 길에 받겠다. 곧장 요동으로 간다',
                reply:'백 일이라 했다. 하루도 헛되이 쓸 수 없다.',
                answer:{speaker:'사마사',line:'예. 밤에도 행군을 멈추지 않겠습니다.'},
                note:'행군 내내 요수의 지도를 살핀다: 책략 MP +15',
                effects:[{kind:'insight'}]},
            ]},
            {exit:'마을 어른',to:'right'},
          ],
        },
        {
          place:'요수 · 서쪽 강변',art:11,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[22,66],face:'right'},
            {name:'척후',look:'infantry'},
            {name:'호준',look:'spear'},
          ],
          steps:[
            {narrate:'6월, 위군이 요수 서쪽에 닿았다. 강 건너에 비연과 양조의 연군이 스무 리 넘게 목책을 둘렀다.'},
            {enter:'척후',at:[72,62],from:'right'},
            {say:'척후',line:'연군이 강 동쪽을 따라 끝도 없이 늘어섰습니다! 해자까지 팠습니다!'},
            {say:'사마사',line:'아버님, 정면으로 건너면 강 한가운데서 막힙니다.',to:'사마의'},
            {move:'사마의',to:[46,58]},
            {say:'사마의',line:'제갈량은 우리를 깃발로 움직였다. 이번에는 우리가 저들을 움직인다. 호준, 남쪽 여울에 깃발을 가득 세워라.'},
            {enter:'호준',at:[60,64],from:'left'},
            {say:'호준',line:'깃발은 많고 군사는 적은 양동이군요. 북을 크게 울려 보이겠습니다.',to:'사마의'},
            {exit:'호준',to:'right'},
            {say:'사마사',line:'저들이 남쪽으로 몰리면, 본대는 북쪽 여울로 건너겠습니다.'},
          ],
        },
      ],
      after:[
        {
          place:'요수 · 무너진 연군 진영',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[42,60],face:'right'},
            {name:'호준',look:'spear',at:[62,62],face:'left'},
            {name:'사마사',look:'cavalry'},
          ],
          steps:[
            {enter:'사마사',at:[28,64],from:'left'},
            {say:'사마사',line:'연군이 남쪽만 바라보다 무너졌습니다. 양평까지 막을 자가 없습니다.',to:'사마의'},
            {say:'호준',line:'장수들이 남은 연군 진영을 마저 치자고 합니다.'},
            {say:'사마의',line:'치지 않는다. 적이 지키는 곳을 치지 않고, 적이 비운 곳으로 간다. 저들의 처자가 양평에 있다. 곧장 양평으로 간다.'},
            {emote:'호준',text:'!'},
            {move:'사마의',to:[72,58]},
            {narrate:'사마의는 연군의 진영을 버려두고 양평으로 내달렸다. 놀란 연군이 뒤를 쫓았으나, 세 번 싸워 세 번 모두 졌다.'},
          ],
        },
      ],
    },

    // ── S3-02 같은 깃발
    {
      id:'S3-02',year:'238년 가을',title:'같은 깃발',
      synopsis:'양평성을 에워싸자 한 달 넘게 비가 쏟아진다. 사마의는 진영을 옮기지 않고 비가 그치기를 기다린다. 장마가 그치면 군량고를 부수고, 달아나는 공손연을 잡는다.',
      scenes:[
        {
          place:'양평 · 장마 속의 진영',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[42,58],face:'right'},
            {name:'장정',look:'infantry'},
            {name:'진규',look:'civil'},
          ],
          steps:[
            {narrate:'양평성을 에워싸자 하늘이 열렸다. 한 달 넘게 비가 쏟아져 요수가 넘쳤고, 진영 바닥까지 물이 찼다.'},
            {enter:'장정',at:[66,62],from:'right'},
            {say:'장정',line:'태위, 진영이 물에 잠깁니다! 높은 곳으로 옮겨야 병사들이 삽니다!',to:'사마의'},
            {say:'사마의',line:'진영을 옮기자는 자는 벤다고 이미 일렀다. 명은 한 번 꺾이면 다시 서지 않는다. 데려가라.'},
            {emote:'장정',text:'땀'},
            {exit:'장정',to:'right'},
            {enter:'진규',at:[64,60],from:'right'},
            {say:'진규',line:'상용의 맹달은 여드레 만에 치셨습니다. 이번에는 어찌 이리 느리십니까?',to:'사마의'},
            {say:'사마의',line:'그때는 우리가 적고 양식이 넉넉했으며, 맹달은 많고 양식이 모자랐소. 지금은 거꾸로요. 나는 비가 그치기를 기다리는 것이오.'},
            {emote:'진규',text:'…'},
          ],
        },
        {
          place:'양평 · 에워싼 성',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'포차병',look:'engineer',at:[20,66],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'연의 사자',look:'civil'},
          ],
          steps:[
            {narrate:'비가 그쳤다. 토산이 쌓이고 땅굴이 파였다. 포차가 밤낮으로 성벽을 두드리자 성 안에서는 사람이 사람을 먹었다.'},
            {enter:'연의 사자',at:[70,60],from:'right'},
            {say:'연의 사자',line:'연왕께서 아드님을 볼모로 보내겠다 하십니다. 포위를 풀어 주십시오.',to:'사마의'},
            {say:'사마의',line:'군사의 큰일은 다섯이다. 싸울 수 있으면 싸우고, 못 하면 지키고, 못 지키면 달아난다. 나머지 둘은 항복과 죽음뿐이다.'},
            {exit:'연의 사자',to:'right'},
            {enter:'사마사',at:[54,62],from:'left'},
            {say:'사마사',line:'공손연은 성에 틀어박혀 군량으로 버틸 생각입니다.'},
            {say:'사마의',line:'군량고를 포차로 부숴라. 먹을 것이 떨어지면 그는 성을 버리고 달아난다. 그때가 잡을 때다.'},
            {move:'포차병',to:[26,62]},
            {say:'사마사',line:'그가 같은 깃발을 여럿 세워 우리를 속이려 할 수도 있습니다.'},
            {say:'사마의',line:'깃발은 같아도 사람의 걸음은 다르다. 가장 겁먹은 걸음을 쫓아라.'},
            {emote:'사마사',text:'!'},
          ],
        },
      ],
      after:[
        {
          place:'양평 · 열린 성문',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[44,60],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'전령',look:'infantry'},
          ],
          steps:[
            {narrate:'8월, 큰 별이 양평성 동남쪽으로 떨어졌다. 공손연은 아들 공손수와 포위를 뚫고 달아나다 양수 가에서 목이 떨어졌다.'},
            {enter:'사마사',at:[30,64],from:'left'},
            {say:'사마사',line:'공손연을 잡았습니다. 미끼 깃발은 둘이었습니다.',to:'사마의'},
            {say:'사마의',line:'성 안의 열다섯 넘은 사내는 모두 벤다. 다시는 이 땅에서 왕을 칭하는 자가 없게 하라.'},
            {emote:'사마사',text:'…'},
            {enter:'전령',at:[72,62],from:'right'},
            {say:'전령',line:'태위! 낙양에서 급보입니다. 폐하께서 위중하십니다!'},
            {move:'사마의',to:[24,58]},
            {say:'사마의',line:'요동은 평정되었다. 돌아가자. 낙양에서 우리를 기다리는 것은 칼보다 무거운 일이다.'},
          ],
        },
      ],
    },

    // ── S3-03 늙은 장수의 걸음
    {
      id:'S3-03',year:'241년',title:'늙은 장수의 걸음',
      synopsis:'조예가 죽고 대장군 조상이 병권을 쥐었다. 태부로 밀려난 사마의는 오의 주연이 번성을 에워싸자 스스로 구원을 청한다. 그는 이제 빨리 걷지 않는다. 다만 한 걸음도 헛되이 쓰지 않는다.',
      scenes:[
        {
          place:'낙양 · 출정을 청하는 조정',art:14,
          cast:[
            {name:'조상',look:'cavalry',at:[66,56],face:'left'},
            {name:'대신',look:'civil',at:[80,62],face:'left'},
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
          ],
          steps:[
            {narrate:'239년 정월, 조예는 사마의의 손을 잡고 여덟 살 조방을 부탁한 뒤 숨을 거두었다. 함께 부탁받은 대장군 조상은 사마의를 태부로 높여 병권에서 밀어냈다.'},
            {narrate:'241년, 오의 주연이 번성을 에워쌌다.'},
            {say:'대신',line:'번성은 단단합니다. 오군은 먼 길을 와서 오래 버티지 못하니, 서두를 것 없습니다.'},
            {say:'조상',line:'태부께서는 연세도 있으시니, 이번에는 쉬시지요.',to:'사마의'},
            {move:'사마의',to:[48,58]},
            {say:'사마의',line:'변경의 성이 적을 맞았는데 조정은 앉아서 논하는구려. 성 안 사람들은 오래 버티라는 말을 듣고 싶지 않소. 내가 직접 가겠소.'},
            {emote:'조상',text:'분노'},
            {exit:'사마의',to:'left'},
          ],
        },
        {
          place:'번성 · 남쪽 들판',art:4,
          cast:[
            {name:'사마의',look:'strategist',at:[30,60],face:'right'},
            {name:'사마사',look:'cavalry'},
          ],
          steps:[
            {narrate:'6월, 남쪽의 더위가 예순셋의 몸을 짓눌렀다. 사마의는 날랜 병사를 골라 앞세웠다.'},
            {enter:'사마사',at:[50,62],from:'right'},
            {say:'사마사',line:'아버님, 들판으로 곧장 가면 오군 포차의 사정권입니다. 서쪽 숲길은 하루가 더 걸립니다.',to:'사마의'},
            {choice:'사마의',options:[
              {id:'field',text:'내가 앞장서 들판을 건넌다. 병사들이 내 깃발을 보게 하라',
                reply:'늙은 장수가 줄 수 있는 것은 빠른 다리가 아니라, 곁에 서 있는 얼굴이다.',
                answer:{speaker:'사마사',line:'아버님 깃발 곁에 제가 서겠습니다.'},
                note:'태부의 깃발이 앞선다: 첫 2턴 아군 사기 상승',
                effects:[{kind:'rally'}]},
              {id:'forest',text:'숲길로 돌아 몸을 숨긴다. 늦은 하루는 내가 지겠다',
                reply:'하루 늦은 구원이 사람을 덜 잃는다면, 나는 그 하루를 택한다.',
                answer:{speaker:'사마사',line:'숲 끝에서 방패를 세우고 들어가겠습니다.'},
                note:'숲에 몸을 숨기고 다가간다: 첫 턴 아군 방어 태세',
                effects:[{kind:'guard'}]},
            ]},
            {move:'사마의',to:[64,58]},
            {emote:'사마사',text:'!'},
          ],
        },
      ],
      after:[
        {
          place:'번성 · 열린 포위망',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'번성 수비병',look:'spear'},
          ],
          steps:[
            {enter:'사마사',at:[26,64],from:'left'},
            {say:'사마사',line:'주연이 밤을 틈타 물러갔습니다. 수비대가 성문을 열고 아버님을 맞습니다.',to:'사마의'},
            {enter:'번성 수비병',at:[66,62],from:'right'},
            {say:'번성 수비병',line:'태부께서 오셨다는 말에, 성벽 위 병사들이 울었습니다.'},
            {say:'사마의',line:'병사들은 내 곁에 있으면 덜 두려워한다. 그것이 늙은 장수가 줄 수 있는 것이다.'},
            {emote:'번성 수비병',text:'…'},
            {narrate:'조정은 사마의의 식읍에 두 현을 더했다. 그 소식을 들은 조상의 눈빛은 더 차가워졌다.'},
          ],
        },
      ],
    },

    // ── S3-04 하루를 지키는 자
    {
      id:'S3-04',year:'243년',title:'하루를 지키는 자',
      synopsis:'예순다섯의 사마의가 다시 출정한다. 오의 제갈각이 환성에 군량을 쌓고 북쪽을 엿본다. 강 위에 다리는 없다. 공병이 다리를 놓는 이틀이 이 싸움의 전부다.',
      scenes:[
        {
          place:'낙양 · 늙은 태부의 출정',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[22,64],face:'right'},
            {name:'대신',look:'civil'},
          ],
          steps:[
            {narrate:'243년, 예순다섯의 사마의가 다시 갑옷을 입었다. 오의 제갈각이 환성에 군량을 쌓고 북쪽을 엿본다.'},
            {enter:'대신',at:[68,58],from:'right'},
            {say:'대신',line:'적은 굳은 성에 있고 우리는 멀리 가야 합니다. 저들의 원군이 오면 나아가지도 물러나지도 못합니다.',to:'사마의'},
            {move:'사마의',to:[48,58]},
            {say:'사마의',line:'오군이 잘하는 것은 물 위의 싸움이오. 뭍의 성을 치면 저들이 어찌 나오는지 보게 되오. 버티면 물이 줄어 배를 못 쓰고, 버리면 우리가 이긴 것이오.'},
            {emote:'대신',text:'…'},
            {exit:'대신',to:'right'},
          ],
        },
        {
          place:'환성 · 남쪽 강변',art:11,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[20,66],face:'right'},
            {name:'공병',look:'engineer',at:[50,66],face:'right'},
            {name:'방패병',look:'infantry',at:[60,62],face:'right'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {enter:'사마소',at:[86,60],from:'right'},
            {say:'사마소',line:'제갈각이 환성에 군량을 쌓고 있습니다. 강을 건널 다리가 없습니다.',to:'사마의'},
            {say:'사마의',line:'공병이 다리를 놓는다. 이틀이면 된다. 그 이틀 동안 방패를 공병 곁에 붙여라. 다만 건너편 노병의 화살은 방패로도 못 막는다.'},
            {move:'공병',to:[60,68]},
            {move:'방패병',to:[70,64]},
            {say:'공병',line:'망치 소리가 그치지 않게 하겠습니다. 이틀만 지켜 주십시오.'},
            {say:'사마사',line:'노병은 제가 맡겠습니다. 다리가 놓이는 순간 건너가겠습니다.'},
            {emote:'사마소',text:'!'},
          ],
        },
      ],
      after:[
        {
          place:'환성 · 비워진 성',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'사마사',look:'cavalry',at:[26,64],face:'right'},
            {name:'공병',look:'engineer'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {narrate:'위군이 다리를 건너자 제갈각은 쌓아 둔 군량을 불태우고 성을 버렸다.'},
            {say:'사마사',line:'제갈각이 군량을 불태우고 물러갔습니다.',to:'사마의'},
            {enter:'공병',at:[62,66],from:'right'},
            {say:'사마의',line:'다리를 놓은 공병에게 상을 내려라. 이 싸움은 칼보다 망치가 이겼다.'},
            {emote:'공병',text:'♪'},
            {enter:'사마소',at:[76,60],from:'right'},
            {say:'사마소',line:'아버님, 낙양의 소식입니다. 조상 대장군이 공을 세우려 촉을 치겠다고 합니다.'},
          ],
        },
      ],
    },

    // ── S3-05 낙곡의 그림자
    {
      id:'S3-05',year:'244년',title:'낙곡의 그림자',
      synopsis:'대장군 조상이 위엄을 세우려 촉을 치러 낙곡으로 들어간다. 사마의는 말렸으나 듣지 않았고, 따라가지 않는다. 사마소가 그 자리를 대신한다. 골짜기는 길고, 조상은 멈출 줄 모른다.',
      scenes:[
        {
          place:'낙양 · 사마가의 서재',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[34,60],face:'right'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {narrate:'244년 봄, 대장군 조상이 십여만 군을 일으켜 촉을 치러 나섰다. 사마의는 말렸으나 조상은 듣지 않았다.'},
            {enter:'사마소',at:[56,62],from:'right'},
            {say:'사마소',line:'아버님, 저도 정촉장군으로 하후현 장군을 따라 낙곡으로 갑니다.',to:'사마의'},
            {move:'사마의',to:[42,58]},
            {say:'사마의',line:'골짜기에서는 들어가는 길보다 나오는 길을 먼저 보아라. 흥세에는 왕평이 있다. 글은 몰라도 산은 아는 장수다.'},
            {emote:'사마소',text:'?'},
            {choice:'사마의',options:[
              {id:'letter',text:'하후현에게 편지를 쓴다. 무제께서 한중에서 겪으신 일을 적는다',
                reply:'무제께서도 한중에 드셨다가 크게 지실 뻔했다. 하후현은 그 일을 아는 사람이니, 읽으면 알 것이다.',
                answer:{speaker:'사마소',line:'편지는 제가 직접 하후 장군께 전하겠습니다.'},
                note:'물러날 길을 미리 본다: 책략 MP +15',
                effects:[{kind:'insight'},{kind:'flag',flag:'h3_letter'}]},
              {id:'shield',text:'내 방패병을 소에게 붙여 보낸다',
                reply:'대장군은 내가 지키지 못해도, 내 아들은 지킨다.',
                answer:{speaker:'사마소',line:'아버님의 방패와 함께 돌아오겠습니다.'},
                note:'아버지의 방패가 따른다: 첫 턴 아군 방어 태세',
                effects:[{kind:'guard'}]},
            ]},
            {exit:'사마소',to:'right'},
          ],
        },
        {
          place:'낙곡 · 흥세 앞 골짜기',art:4,
          cast:[
            {name:'조상',look:'cavalry',at:[62,56],face:'left'},
            {name:'조상 친위',look:'spear',at:[76,60],face:'left'},
            {name:'사마소',look:'crossbow',at:[40,62],face:'right'},
            {name:'짐꾼',look:'infantry'},
          ],
          steps:[
            {narrate:'낙곡의 길은 수백 리였다. 짐을 지던 소와 나귀가 줄줄이 쓰러지고, 짐꾼들의 곡소리가 골짜기를 메웠다.'},
            {enter:'짐꾼',at:[22,66],from:'left'},
            {say:'짐꾼',line:'소가 또 쓰러졌습니다! 군량이 앞으로 가지 못합니다!'},
            {say:'조상',line:'사마 가문의 둘째인가. 이번 공은 내 것이다. 너는 뒤나 지켜라.',to:'사마소'},
            {move:'사마소',to:[48,60]},
            {say:'사마소',line:'흥세의 왕평이 산마루를 쥐고 있습니다. 요새를 얻더라도 더 들어가면 안 됩니다.',to:'조상'},
            {say:'사마소',line:'하후 장군께서도 아버님 편지를 읽고, 물러날 길을 함께 보자 하셨습니다.',when:'h3_letter'},
            {emote:'조상',text:'분노'},
          ],
        },
      ],
      after:[
        {
          place:'낙양 교외 · 돌아오는 길',art:11,
          cast:[
            {name:'사마의',look:'strategist',at:[30,60],face:'right'},
            {name:'사마소',look:'crossbow'},
            {name:'조상',look:'cavalry'},
          ],
          steps:[
            {narrate:'조상은 끝내 물러났다. 돌아오는 고갯길마다 촉의 비의가 앞을 막아, 위군은 산을 헤치고서야 빠져나왔다.'},
            {enter:'사마소',at:[50,62],from:'right'},
            {say:'사마소',line:'조상 대장군을 모시고 돌아왔습니다. 군의 절반을 잃었습니다.',to:'사마의'},
            {say:'사마의',line:'하후현이 네 손에서 편지를 받고 고개를 끄덕였다지. 그 끄덕임이 수천을 살렸다.',when:'h3_letter'},
            {enter:'조상',at:[74,58],from:'right'},
            {emote:'조상',text:'분노'},
            {exit:'조상',to:'left'},
            {say:'사마의',line:'조상은 이번 일로 우리를 더 미워할 것이다. 그리고 더 깔볼 것이다. 둘 다 좋다.'},
          ],
        },
      ],
    },

    // ── S3-06 쉰 해의 칼
    {
      id:'S3-06',year:'249년 정월',title:'쉰 해의 칼',
      synopsis:'병들어 누운 줄로만 알았던 일흔한 살의 사마의가 일어난다. 조상이 어린 황제를 모시고 고평릉으로 나간 날, 두 아들은 무기고로, 그는 영녕궁으로. 쉰 해를 기다린 칼이 칼집에서 나온다.',
      scenes:[
        {
          place:'낙양 · 병을 핑계로 누운 집',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[36,64],face:'right'},
            {name:'시녀',look:'lady',at:[22,62],face:'right'},
            {name:'이승',look:'civil'},
          ],
          steps:[
            {narrate:'247년, 아내 장춘화가 세상을 떠났다. 사마의는 그해부터 병을 칭하고 문을 닫았다. 조상은 하안·등양·이승과 함께 조정을 마음대로 했다.'},
            {enter:'이승',at:[66,60],from:'right'},
            {say:'이승',line:'형주자사로 떠나게 되어 태부께 하직 인사를 드리러 왔습니다.',to:'사마의'},
            {move:'시녀',to:[48,64]},
            {say:'시녀',line:'태부, 죽을 드십시오.'},
            {choice:'사마의',options:[
              {id:'feign',text:'죽 그릇을 쥔 손을 떨고, 말을 잘못 알아듣는다',
                reply:'병주라… 병주는 오랑캐와 가까우니 잘 대비하시오.',
                answer:{speaker:'이승',line:'형주입니다, 태부. 병주가 아니라 형주입니다…'},
                note:'조상의 경계가 풀린다: 책략 MP +15',
                effects:[{kind:'insight'},{kind:'flag',flag:'h3_feign'}]},
              {id:'entrust',text:'이승의 손을 잡고 두 아들을 부탁한다',
                reply:'나는 늙고 병들어 오늘내일하오. 사와 소를… 그대에게 부탁하오.',
                answer:{speaker:'이승',line:'태부, 부디 몸을 돌보십시오…'},
                note:'아들을 부탁하는 눈물: 첫 2턴 아군 사기 상승',
                effects:[{kind:'rally'},{kind:'flag',flag:'h3_entrust'}]},
            ]},
            {exit:'이승',to:'right'},
            {narrate:'이승은 조상에게 돌아가 말했다. "태부는 시체에 숨만 붙어 있을 뿐입니다. 걱정할 것 없습니다."'},
            {move:'사마의',to:[44,58]},
            {emote:'사마의',text:'…'},
          ],
        },
        {
          place:'낙양 · 정월의 밤',art:13,
          cast:[
            {name:'사마의',look:'strategist',at:[36,60],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {narrate:'249년 정월, 조상 형제가 어린 황제를 모시고 성 밖 고평릉으로 성묘를 나갔다.'},
            {enter:'사마사',at:[56,62],from:'right'},
            {say:'사마사',line:'아버님, 조상이 황제를 모시고 고평릉으로 나갔습니다. 성 안에는 그의 금군만 남았습니다.',to:'사마의'},
            {enter:'사마소',at:[70,64],from:'right'},
            {say:'사마의',line:'조상에게 밀려난 지 십 년이다. 오늘 일어난다. 사야, 소야, 너희는 무기고를 쥐어라. 나는 서쪽에서 금군을 붙든다.'},
            {say:'사마소',line:'무기고를 쥐면 성문으로 가겠습니다. 영녕궁은 아버님이 직접 들어가셔야 합니다.'},
            {emote:'사마소',text:'땀'},
            {say:'사마의',line:'사가 몰래 길러 온 사병 삼천이 아침이면 한자리에 모인다. 소야, 형을 믿어라.'},
            {narrate:'전날 밤 사마사는 깊이 잠들었고, 사마소는 한숨도 자지 못했다.'},
          ],
        },
      ],
      after:[
        {
          place:'낙양 · 영녕궁 앞',art:5,
          cast:[
            {name:'사마의',look:'strategist',at:[40,60],face:'right'},
            {name:'장제',look:'civil',at:[60,58],face:'left'},
            {name:'사마사',look:'cavalry'},
          ],
          steps:[
            {narrate:'성문이 닫혔다. 고유가 조상의 진영을, 왕관이 조희의 진영을 거두었다. 다만 지낭 환범이 대사농의 인수를 품고 성을 빠져나갔다.'},
            {enter:'사마사',at:[24,64],from:'left'},
            {say:'사마사',line:'태후께서 조상의 관직을 거두는 조서를 내리셨습니다.',to:'사마의'},
            {say:'장제',line:'지낭이 갔습니다. 그러나 둔한 말은 마구간의 콩을 못 잊는 법, 조상은 그 꾀를 쓰지 못할 것입니다.'},
            {move:'사마의',to:[46,58]},
            {say:'사마의',line:'조상에게 사람을 보내라. 관직만 내려놓으면 목숨은 보전한다고, 낙수를 두고 맹세한다. …그 약속을 내가 지킬지는, 나도 아직 모르겠구나.'},
            {emote:'장제',text:'…'},
            {narrate:'조상은 칼을 내려놓았다. 그리고 얼마 지나지 않아 그의 삼족이 저잣거리에서 목이 떨어졌다. 낙수의 맹세는 지켜지지 않았다.'},
          ],
        },
      ],
    },

    // ── S3-07 마지막 출정
    {
      id:'S3-07',year:'251년',title:'마지막 출정',
      synopsis:'태위 왕릉이 수춘에서 다른 황제를 세우려 한다. 일흔셋의 사마의가 마지막으로 군을 이끈다. 배가 영수를 따라 내려가고, 수춘의 수문 앞에서 오래된 두 사람이 마주 선다.',
      scenes:[
        {
          place:'낙양 · 마지막 출정',art:14,
          cast:[
            {name:'사마의',look:'strategist',at:[38,60],face:'right'},
            {name:'사마소',look:'crossbow',at:[24,64],face:'right'},
            {name:'사마사',look:'cavalry'},
          ],
          steps:[
            {narrate:'251년, 태위 왕릉이 어린 황제를 폐하고 허창의 초왕 조표를 세우려 했다. 함께 꾀하던 조카 영호우는 먼저 죽었고, 뜻은 밀고로 새어 나왔다.'},
            {enter:'사마사',at:[60,62],from:'right'},
            {say:'사마사',line:'아버님, 왕릉이 수춘에서 초왕을 세우려 했습니다. 아버님께서 직접 가실 필요는 없습니다.',to:'사마의'},
            {say:'사마의',line:'왕릉은 나와 함께 늙은 사람이다. 그를 꺾는 일은 내가 해야 한다. 배를 내어라. 영수를 따라 내려간다.'},
            {emote:'사마소',text:'…'},
            {choice:'사마의',options:[
              {id:'pardon',text:'먼저 왕릉의 죄를 용서한다는 글을 보낸다',
                reply:'글이 먼저 가고 배가 뒤따른다. 그가 글을 쥐고 망설이는 하루가 수천의 목숨이다.',
                answer:{speaker:'사마사',line:'…글과 배를 함께 띄우겠습니다.'},
                note:'왕릉이 망설인다: 첫 턴 아군 방어 태세',
                effects:[{kind:'guard'},{kind:'flag',flag:'h3_pardon'}]},
              {id:'sail',text:'글은 보내지 않는다. 배를 곧장 내린다',
                reply:'그는 편지 한 장에 올 사람이 아니다. 늙은 벗에게는 얼굴을 보여야 한다.',
                answer:{speaker:'사마소',line:'노를 재촉하겠습니다. 아흐레면 닿습니다.'},
                note:'노신의 마지막 출정: 첫 2턴 아군 사기 상승',
                effects:[{kind:'rally'}]},
            ]},
            {exit:'사마사',to:'right'},
          ],
        },
        {
          place:'수춘 · 수문 앞',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[32,62],face:'right'},
            {name:'사마소',look:'crossbow',at:[18,66],face:'right'},
            {name:'왕릉',look:'infantry',at:[74,48],face:'left'},
            {name:'수춘 병사',look:'spear',at:[86,54],face:'left'},
          ],
          steps:[
            {narrate:'배는 영수를 따라 아흐레 만에 감성에 닿았다. 물안개 너머로 수춘의 성벽과 닫힌 수문이 보였다.'},
            {say:'사마소',line:'수로 끝의 수문만 열리면 성 안으로 들어갈 수 있습니다. 포격과 하늘을 조심하십시오.'},
            {move:'사마의',to:[46,60]},
            {say:'왕릉',line:'죄를 용서한다는 글을 보내 놓고, 어찌 군을 끌고 왔소!',when:'h3_pardon'},
            {say:'왕릉',line:'편지 한 장이면 내 발로 갔을 것을, 어찌 군을 끌고 왔소!',unless:'h3_pardon'},
            {say:'사마의',line:'그대가 편지 한 장에 따라올 사람이 아니기 때문이오.',to:'왕릉'},
            {say:'왕릉',line:'중달, 그대가 나를 저버렸소!'},
            {say:'사마의',line:'내가 그대를 저버릴지언정, 나라를 저버리지는 않소.'},
            {emote:'왕릉',text:'분노'},
            {move:'수춘 병사',to:[86,60]},
          ],
        },
      ],
      after:[
        {
          place:'수춘 · 열린 수문',art:8,
          cast:[
            {name:'사마의',look:'strategist',at:[42,60],face:'right'},
            {name:'사마사',look:'cavalry'},
            {name:'사마소',look:'crossbow'},
          ],
          steps:[
            {narrate:'왕릉은 낙양으로 끌려가는 길에 관에 박을 못을 달라 했고, 사마의는 그것을 내주었다. 항현의 가규 사당 앞에서 왕릉은 "왕릉은 위의 충신이다!" 외치고 독을 마셨다.'},
            {enter:'사마사',at:[26,64],from:'left'},
            {say:'사마사',line:'왕릉이 스스로 목숨을 끊었습니다. 초왕에게도 자결의 명이 내려갔습니다.',to:'사마의'},
            {enter:'사마소',at:[60,64],from:'right'},
            {say:'사마의',line:'사야, 소야. 내가 평생 칼을 감추고 기다린 것은 이 집안을 지키기 위해서였다. 이제 그 칼은 너희 손에 있다.'},
            {say:'사마의',line:'너희가 그것으로 무엇을 지킬지, 나는 보지 못할 것이다.'},
            {emote:'사마소',text:'…'},
            {say:'사마소',line:'아버님…'},
            {move:'사마의',to:[16,58]},
            {say:'사마의',line:'돌아가자. 낙양의 하늘을 한 번 더 보고 싶구나.'},
          ],
        },
      ],
    },

    // ── 결말: 진(晉)의 기틀
    {
      id:'ending:patience',year:'251년 가을 · 낙양',title:'진(晉)의 기틀',
      synopsis:'위의 방패로 제갈량을 막아 낸 노신은 끝내 서두르지 않았다. 그가 쌓은 기다림 위에서 손자 사마염이 진(晉)을 연다. 정사의 결말.',
      scenes:[
        {
          place:'낙양 · 사마가의 침소',art:12,
          cast:[
            {name:'사마의',look:'strategist',at:[40,64],face:'right'},
            {name:'사마사',look:'cavalry',at:[24,62],face:'right'},
            {name:'사마소',look:'crossbow',at:[62,62],face:'left'},
            {name:'사마염',look:'civil'},
          ],
          steps:[
            {narrate:'251년 여름, 낙양으로 돌아온 사마의는 자리에 누웠다. 꿈에 가규와 왕릉이 나타나 그를 내려다보았다고, 사람들은 수군거렸다.'},
            {say:'사마의',line:'사야. 나를 수양산에 묻어라. 봉분도 쌓지 말고 나무도 심지 마라. 입던 옷 그대로, 무덤에 아무것도 넣지 마라.',to:'사마사'},
            {emote:'사마사',text:'…'},
            {say:'사마사',line:'…아버님 뜻대로 하겠습니다.'},
            {enter:'사마염',at:[78,64],from:'right'},
            {say:'사마소',line:'염아, 할아버님께 인사드려라.'},
            {move:'사마염',to:[52,68]},
            {say:'사마염',line:'할아버님, 저는 언제쯤 할아버님처럼 군을 이끌 수 있습니까?',to:'사마의'},
            {say:'사마의',line:'서두르지 마라. 기다리는 법을 먼저 배워라. 천하는 먼저 뛰는 자가 아니라, 끝까지 서 있는 자의 것이다.'},
            {say:'사마의',line:'병든 척은 이제 그만해도 되겠구나. 이번에는… 진짜다.',when:'h3_feign'},
            {say:'사마의',line:'이승 앞에서 너희를 부탁하던 눈물은 꾸민 것이었다. 그러나 너희를 아끼는 마음은 꾸민 것이 아니었다.',when:'h3_entrust'},
            {say:'사마의',line:'…무양으로 돌아가 늙겠다고 노래했건만. 온현의 어른들께 미안하구나.',when:'h3_hometown'},
            {narrate:'그해 8월, 사마의는 일흔셋으로 세상을 떠났다.'},
          ],
        },
        {
          place:'낙양 · 새 왕조의 궁정',art:5,
          cast:[
            {name:'장수',look:'heavy',at:[24,62],face:'right'},
            {name:'문관',look:'civil',at:[76,62],face:'left'},
            {name:'사마염',look:'civil'},
          ],
          steps:[
            {narrate:'사마사가 아버지의 뒤를 이어 조정을 쥐었고, 사마소가 형의 뒤를 이어 촉을 멸했다.'},
            {narrate:'265년, 손자 사마염이 위의 선양을 받아 진(晉)을 연다. 280년, 건업이 무너지고 백 년 만에 천하가 하나가 되었다.'},
            {enter:'사마염',at:[40,64],from:'left'},
            {move:'사마염',to:[50,52]},
            {emote:'문관',text:'!'},
            {say:'문관',line:'만세, 만세, 만만세!'},
            {say:'사마염',line:'할아버님은 서두르지 않으셨다. 그 기다림 위에 이 나라를 세운다.'},
            {narrate:'위의 방패로 제갈량을 막아 낸 노신은 끝내 서두르지 않았다. 그가 쌓은 기다림 위에서 손자 사마염이 진(晉)을 열었다.'},
            {narrate:'정사의 결말이다. 천하는 결국 사마씨에게로 흘러갔다.'},
          ],
        },
      ],
    },
  ],
  endingNotes:[
    {flag:'h3_hometown',line:'온현의 잔치에서 부른 노래 — "공을 이루면 늙어 무양으로 돌아가리라" — 그 귀향은 끝내 오지 않았다.'},
    {flag:'h3_letter',line:'낙곡으로 보낸 편지 한 통은 하후현의 군을 살렸다. 그러나 그 하후현도 훗날 사마씨의 칼 아래 섰다.'},
    {flag:'h3_feign',line:'이승 앞에서 흘린 죽 한 그릇은 위나라에서 가장 값비싼 연기로 남았다.'},
    {flag:'h3_entrust',line:'거짓 병상에서 아들들을 부탁하던 목소리만은 꾸밈이 아니었다고, 사마사는 오래 믿었다.'},
    {flag:'h3_pardon',line:'용서의 글과 함께 내려간 배 — 사람들은 그것을 늙은 이리의 마지막 책략이라 불렀다.'},
  ],
};
export default pack;
