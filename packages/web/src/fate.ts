/**
 * 운명의 갈림길 — 사마의의 선택으로 갈라지는 정사·가상 시나리오.
 *
 * 원정의 중편·하편 첫 층에서 사마의가 선택한다. 정사를 고르면 연의 전장(스토리 32전장)이 이어지고,
 * 가상을 고르면 그 편의 지역·적·우두머리가 바뀌고 '가상 전장'(서사와 이름난 적장이 있는 전투)이 나온다.
 * 두 번의 선택 조합으로 결말 아홉 가지가 갈린다. 가상 시나리오는 이 게임의 창작이다.
 */
import type {UnitClass} from '../../core/src/index.ts';

export interface Tale {
  id:string;title:string;
  /** 출진 전 서사 */
  intro:string;
  /** 쓰러뜨려야 할 이름난 적장 */
  target:{name:string;unitClass:UnitClass};
}
export interface RouteRegion {name:string;arc:string;terrain:0|1|2;boss:{name:string;unitClass:UnitClass};pool:UnitClass[]}
export interface Route {
  id:string;act:2|3;history:boolean;
  /** 선택지에 쓰는 말 */
  choice:string;detail:string;
  /** 루트 이름(진행 표시·결말에 쓴다) */
  name:string;
  region:RouteRegion;
  /** 가상 전장(정사 루트는 연의 전장을 쓴다) */
  tales:Tale[];
}
export interface FatePoint {act:2|3;year:string;title:string;prompt:string}

export const FATE_POINTS:Record<2|3,FatePoint>={
  2:{act:2,year:'220년 · 낙양',title:'조조의 죽음',prompt:'조조가 낙양에서 숨을 거두었다. 세자 조비가 위왕을 잇지만, 업성에는 조식을 따르는 문사들이 모이고 서쪽에서는 유비가 한중왕을 칭했다. 천하가 숨을 죽인 이 밤, 사마의는 어디에 서는가.'},
  3:{act:3,year:'234년 이후 · 낙양',title:'오래 기다린 자의 선택',prompt:'긴 싸움이 끝났다. 조정에서는 대장군 조상이 병권을 쥐고 노신을 밀어낸다. 몸은 늙었고 남은 날은 많지 않다. 은인자중의 끝에서, 사마의는 남은 생을 어디에 거는가.'},
};

const WEI_POOL:UnitClass[]=['infantry','spearman','cavalry','crossbow','archer','heavyCav'];
export const ROUTES:Route[]=[
  // ── 분기 ① 조조의 죽음
  {id:'wei',act:2,history:true,choice:'조비를 받든다',detail:'정사대로 위를 지키며 기산에서 제갈량의 북벌을 막는다. 연의 전장이 이어진다.',name:'정사 · 위의 방패',
    region:{name:'기산 산악',arc:'중편',terrain:1,boss:{name:'제갈량',unitClass:'strategist'},pool:['infantry','spearman','bandit','assassin','archer','crossbow','taoist','strategist','heavyCav']},tales:[]},
  {id:'cao_zhi',act:2,history:false,choice:'조식을 옹립한다',detail:'업성의 문사들과 손잡고 조식을 위왕으로 세운다. 위가 둘로 갈라지고, 조비의 친위대가 몰려온다.',name:'가상 · 업성의 왕',
    region:{name:'업성 내란',arc:'중편',terrain:0,boss:{name:'조비',unitClass:'strategist'},pool:WEI_POOL},
    tales:[
      {id:'IF2-zhi-1',title:'업성 봉기',intro:'"칠보시를 짓던 공자가 왕이 되면, 천하는 시로 다스려지겠소?" 조식의 웃음 뒤로 업성의 성문이 닫힌다. 조비의 호위 대장 허저가 성 밖에 진을 쳤다. 허저를 물리쳐야 봉기가 산다.',target:{name:'허저',unitClass:'infantry'}},
      {id:'IF2-zhi-2',title:'허창 탈취',intro:'천자가 있는 허창을 쥐는 자가 명분을 쥔다. 조씨 종실의 대들보 조진이 허창을 지킨다. 한때 함께 싸운 벗과 칼을 맞댈 차례다.',target:{name:'조진',unitClass:'heavyCav'}},
      {id:'IF2-zhi-3',title:'종친의 반격',intro:'천리구라 불린 조휴가 동쪽 군을 이끌고 업성으로 내달린다. 그를 막지 못하면 조식의 왕위는 사흘을 넘기지 못한다.',target:{name:'조휴',unitClass:'cavalry'}},
    ]},
  {id:'shu',act:2,history:false,choice:'유비에게 간다',detail:'조조 없는 위를 버리고 한중왕 유비에게 몸을 맡긴다. 와룡과 총(冢)이 한 깃발 아래 서서 북쪽을 친다.',name:'가상 · 촉의 사마의',
    region:{name:'형주 강릉',arc:'중편',terrain:2,boss:{name:'조인',unitClass:'heavyCav'},pool:WEI_POOL},
    tales:[
      {id:'IF2-shu-1',title:'양양 공략',intro:'제갈량이 부채를 거두며 말한다. "중달, 북쪽의 문은 양양이오." 위의 명장 서황이 양양을 굳게 지킨다.',target:{name:'서황',unitClass:'heavyCav'}},
      {id:'IF2-shu-2',title:'번성 포위',intro:'한수가 불어 번성이 물에 잠겼다. 성을 구하러 온 우금의 칠군이 물가에 갇혔다. 지금이 칠군을 꺾을 때다.',target:{name:'우금',unitClass:'spearman'}},
      {id:'IF2-shu-3',title:'완성 진격',intro:'번성을 지나면 완성, 완성을 지나면 허창이다. 가정에서 마속을 꺾었어야 할 장합이 이번에는 촉의 길을 막는다.',target:{name:'장합',unitClass:'cavalry'}},
    ]},
  // ── 분기 ② 오래 기다린 자의 선택
  {id:'patience',act:3,history:true,choice:'병을 칭하고 때를 기다린다',detail:'정사대로 물러나 앉아 요동을 정벌하고, 때가 오면 고평릉에서 움직인다. (조비를 받든 길이라면 연의 전장이 이어진다.)',name:'정사 · 은인자중',
    region:{name:'요동 요수',arc:'하편',terrain:2,boss:{name:'공손연',unitClass:'infantry'},pool:['infantry','spearman','cavalry','horseArcher','crossbow','archer','heavyCav','bandit','rattan']},
    tales:[
      {id:'IF3-pat-1',title:'요동의 반란',intro:'연왕을 칭한 공손연의 대장 비연이 요수에 진을 쳤다. 비가 그치지 않는 강가에서, 노장 사마의는 서두르지 않는다.',target:{name:'비연',unitClass:'cavalry'}},
      {id:'IF3-pat-2',title:'고평릉 전야',intro:'조상이 황제를 모시고 고평릉으로 떠났다. 낙양에 남은 것은 병든 노인 하나와, 그를 지켜보는 조상의 심복 하안뿐이다.',target:{name:'하안',unitClass:'strategist'}},
    ]},
  {id:'coup',act:3,history:false,choice:'지금 조상을 친다',detail:'기다리지 않는다. 아직 힘이 남았을 때 군을 일으켜 낙양을 장악한다. 조상의 금군이 막아선다.',name:'가상 · 이른 정변',
    region:{name:'낙양 정변',arc:'하편',terrain:0,boss:{name:'조상',unitClass:'cavalry'},pool:['infantry','spearman','crossbow','cavalry','archer']},
    tales:[
      {id:'IF3-coup-1',title:'무기고 장악',intro:'"지낭"이라 불린 환범이 조상에게 달려가기 전에 무기고를 쥐어야 한다. 사마사가 사병 삼천을 이끌고 어둠 속에 섰다.',target:{name:'환범',unitClass:'strategist'}},
      {id:'IF3-coup-2',title:'낙수 부교',intro:'조상의 아우 조희가 낙수 부교를 끊으려 한다. 다리가 끊기면 황제를 모신 조상의 본대가 낙양으로 돌아온다.',target:{name:'조희',unitClass:'cavalry'}},
    ]},
  {id:'unify',act:3,history:false,choice:'천하통일에 건다',detail:'조정 다툼은 아들들에게 맡기고, 남은 생을 오를 치는 데 쓴다. 강동의 물길이 마지막 전장이다.',name:'가상 · 천하통일',
    region:{name:'강동 수향',arc:'하편',terrain:2,boss:{name:'육손',unitClass:'strategist'},pool:['infantry','spearman','rattan','crossbow','taoist','shaman','elephant','cavalry']},
    tales:[
      {id:'IF3-uni-1',title:'합비 돌파',intro:'합비를 넘어 장강으로. 주연이 지키는 강가 요새가 첫 관문이다.',target:{name:'주연',unitClass:'infantry'}},
      {id:'IF3-uni-2',title:'유수구 결전',intro:'재주가 넘치는 제갈각이 유수구에 수군을 모았다. 이 물길을 넘으면 건업이 보인다.',target:{name:'제갈각',unitClass:'strategist'}},
      {id:'IF3-uni-3',title:'건업 포위',intro:'벽안자염의 손권이 건업 성벽 위에 섰다. 강동의 주인과 마주할 날이 왔다.',target:{name:'손권',unitClass:'strategist'}},
    ]},
];
export const routeById=(id:string|undefined)=>ROUTES.find(r=>r.id===id);
export const routesFor=(act:2|3)=>ROUTES.filter(r=>r.act===act);

/** 결말: 하편의 선택이 줄기, 중편의 선택이 빛깔을 정한다. */
export interface Ending {id:string;title:string;lines:string[];history:boolean}
const ACT2_TONE:Record<string,string>={
  wei:'위의 방패로 제갈량을 막아 낸 노신은',
  cao_zhi:'조식을 왕으로 세워 위를 둘로 갈랐던 사마의는',
  shu:'촉의 깃발 아래 와룡과 나란히 섰던 사마의는',
};
const ACT3_END:Record<string,{title:string;line:string}>={
  patience:{title:'진(晉)의 기틀',line:'끝내 서두르지 않았다. 그가 쌓은 기다림 위에서 손자 사마염이 진(晉)을 연다.'},
  coup:{title:'낙양의 주인',line:'기다림을 버리고 칼을 뽑았다. 낙양은 하룻밤 사이 사마씨의 것이 되었고, 역사는 그를 찬탈자이자 구원자로 함께 기록했다.'},
  unify:{title:'천하통일',line:'남은 생을 강동에 걸었다. 건업이 무너진 날, 백 년 만에 천하가 한 사람의 이름 아래 모였다.'},
};
export function endingFor(route2:string|undefined,route3:string|undefined):Ending{
  const a2=route2&&ACT2_TONE[route2]?route2:'wei',a3=route3&&ACT3_END[route3]?route3:'patience';
  const end=ACT3_END[a3]!;
  const flavor=a2==='wei'?'':a2==='cao_zhi'?' · 업성의 왕':' · 촉의 승상';
  return {id:`${a2}/${a3}`,title:end.title+flavor,lines:[`${ACT2_TONE[a2]!} ${end.line}`,a2==='wei'&&a3==='patience'?'정사의 결말이다. 천하는 결국 사마씨에게로 흘러갔다.':'이것은 일어나지 않은 역사, 사마의가 다른 길을 고른 세계의 이야기다.'],history:a2==='wei'&&a3==='patience'};
}
export const ALL_ENDINGS=routesFor(2).flatMap(a=>routesFor(3).map(b=>`${a.id}/${b.id}`));
