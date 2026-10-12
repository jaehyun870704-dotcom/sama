/**
 * 등용(계보) — 이름난 장수를 조건을 채워 사마의 휘하로 들인다.
 *
 * 구조(조조전 Online의 '계보'를 구조만 참고, 이름·조건·수치는 이 게임이 정함):
 * - 장수는 인연이 닿는 무리(계보)로 묶이고, 계보 안에서는 앞 단계를 먼저 들여야 다음 단계가 열린다.
 * - 재화(돈)는 쓰지 않는다. 장수마다 '해낸 일'이 조건이다: 그 장수와 얽힌 연의 장을 이김 · 극한 승리 · 사마의 레벨 ·
 *   다른 장수를 먼저 들임 · 인장 합계 · 도전의 관문 · 수련 승수 · 본 결말 · 모은 보물.
 * - 들인 장수는 천명의 길 동료로 합류한다(회차가 바뀌어도 meta.recruited에 남아 다시 합류).
 */
export type RecruitCond=
  |{kind:'stage';stage:string}
  |{kind:'extreme';stage:string}
  |{kind:'level';level:number}
  |{kind:'officer';name:string}
  |{kind:'seals';count:number}
  |{kind:'challenge';step:number}
  |{kind:'training';wins:number}
  |{kind:'ending';count:number}
  |{kind:'treasures';count:number};
export interface RecruitOfficer {name:string;conds:readonly RecruitCond[];line:string}
export interface Lineage {id:string;name:string;seal:string;blurb:string;officers:readonly RecruitOfficer[]}

/** 계보 다섯. 같은 계보에서는 위에서부터 차례로 들인다(앞 단계 등용이 숨은 조건). */
export const LINEAGES:readonly Lineage[]=[
  {id:'sima',name:'사마 일가',seal:'司',blurb:'하내 사마씨 — 형제와 아들들',officers:[
    {name:'사마부',conds:[{kind:'stage',stage:'S1-03'}],line:'형님, 집안일은 제게 맡기고 큰일을 보십시오.'},
    {name:'사마방',conds:[{kind:'level',level:6},{kind:'stage',stage:'S1-05'}],line:'엄한 아비가 아들의 길을 지켜보마.'},
    {name:'사마사',conds:[{kind:'stage',stage:'S2-05'},{kind:'officer',name:'사마부'}],line:'아버님의 뜻이 곧 제 칼끝입니다.'},
    {name:'사마소',conds:[{kind:'stage',stage:'S2-08'},{kind:'seals',count:30}],line:'형님 곁에서, 아버님의 그림을 완성하겠습니다.'},
  ]},
  {id:'wei_clan',name:'위의 종실',seal:'曹',blurb:'조씨·하후씨 — 위 황실의 피붙이',officers:[
    {name:'조홍',conds:[{kind:'stage',stage:'S1-04'}],line:'재물은 아끼되 사람은 아끼지 않는다? 내가 그랬던가.'},
    {name:'조휴',conds:[{kind:'stage',stage:'S2-02'},{kind:'training',wins:3}],line:'천리구라 불린 몸, 이번엔 꾀에 빠지지 않겠소.'},
    {name:'하후패',conds:[{kind:'stage',stage:'S2-07'},{kind:'level',level:18}],line:'아버지 하후연의 이름을 더럽히지 않겠다.'},
    {name:'조상',conds:[{kind:'stage',stage:'S3-05'},{kind:'extreme',stage:'S3-04'}],line:'대장군의 자리… 태부께서 곁에 계시다면야.'},
  ]},
  {id:'wei_generals',name:'위의 명장',seal:'將',blurb:'전장에서 이름을 얻은 장수들',officers:[
    {name:'악진',conds:[{kind:'stage',stage:'S1-06'}],line:'선봉은 언제나 내 몫이었소.'},
    {name:'서황',conds:[{kind:'stage',stage:'S1-10'},{kind:'level',level:10}],line:'주아부처럼 군율로 싸우겠소.'},
    {name:'장합',conds:[{kind:'stage',stage:'S2-06'},{kind:'challenge',step:3}],line:'교변의 재주, 도독을 위해 쓰겠소.'},
    {name:'곽회',conds:[{kind:'stage',stage:'S2-07'},{kind:'extreme',stage:'S2-06'}],line:'옹주의 바람은 내가 가장 잘 아오.'},
    {name:'장료',conds:[{kind:'challenge',step:6},{kind:'ending',count:1}],line:'요래요래 — 합비의 이름을 다시 떨치리다.'},
  ]},
  {id:'wei_minds',name:'위의 책사',seal:'策',blurb:'붓과 꾀로 나라를 받친 사람들',officers:[
    {name:'장제',conds:[{kind:'stage',stage:'S1-05'}],line:'벗이여, 그대의 때를 함께 기다리겠네.'},
    {name:'가규',conds:[{kind:'stage',stage:'S2-01'},{kind:'treasures',count:10}],line:'예주를 다스리던 법도로 군량을 맡지요.'},
    {name:'가충',conds:[{kind:'stage',stage:'S2-13'},{kind:'officer',name:'사마소'}],line:'사마씨의 일이라면 무엇이든.'},
    {name:'순욱',conds:[{kind:'seals',count:60},{kind:'level',level:20}],line:'왕좌를 보좌할 재목을 보았소.'},
  ]},
  {id:'turncoats',name:'항장',seal:'降',blurb:'적이었으나 사마의의 그릇을 보고 돌아선 장수들',officers:[
    {name:'황권',conds:[{kind:'stage',stage:'S2-03'}],line:'촉을 등진 것이 아니라, 길이 끊겼을 뿐이오.'},
    {name:'맹달',conds:[{kind:'stage',stage:'S2-05'},{kind:'level',level:14}],line:'네 번째 주인은… 끝까지 모시리다.'},
    {name:'왕평',conds:[{kind:'extreme',stage:'S2-06'},{kind:'officer',name:'장합'}],line:'산 위에 진을 치지 말라 했건만. 이제 그대의 군을 따르겠소.'},
    {name:'강유',conds:[{kind:'stage',stage:'S2-12'},{kind:'ending',count:1},{kind:'officer',name:'왕평'}],line:'승상의 뜻을 이을 곳이 여기라면.'},
  ]},
  // ── 연의 밖에서 이름을 얻은 장수들: 연의의 해당 시기를 지나고, 그 장수와 어울리는 '해낸 일'을 채우면 들인다.
  {id:'cao_veterans',name:'조조의 옛 장수',seal:'魏',blurb:'창업기의 맹장·책사 — 조조 곁에서 사마의를 지켜본 사람들',officers:[
    {name:'하후돈',conds:[{kind:'stage',stage:'S1-07'},{kind:'level',level:8}],line:'눈 하나로도 전장은 다 보이네.'},
    {name:'하후연',conds:[{kind:'stage',stage:'S1-08'},{kind:'officer',name:'하후돈'}],line:'사흘에 오백 리, 천 리라도 달려가지.'},
    {name:'조인',conds:[{kind:'stage',stage:'S1-10'},{kind:'seals',count:20}],line:'성 하나를 맡기면 끝까지 지켜 내겠소.'},
    {name:'방덕',conds:[{kind:'extreme',stage:'S1-06'},{kind:'officer',name:'조인'}],line:'관을 짊어지고 왔소. 물러설 생각은 없소.'},
    {name:'가후',conds:[{kind:'stage',stage:'S1-11'},{kind:'treasures',count:15}],line:'살아남는 계책이라면 내가 조금 아오.'},
  ]},
  {id:'late_pillars',name:'후대의 기둥',seal:'晉',blurb:'사마의가 길러 낸 장수들 — 촉을 막고 진의 터를 닦다',officers:[
    {name:'호준',conds:[{kind:'stage',stage:'S2-09'},{kind:'level',level:16}],line:'태위의 군령이라면 어디든 가겠습니다.'},
    {name:'진태',conds:[{kind:'stage',stage:'S3-02'},{kind:'officer',name:'호준'}],line:'옹주는 제가 지키겠습니다.'},
    {name:'왕기',conds:[{kind:'stage',stage:'S3-04'},{kind:'training',wins:5}],line:'군량과 길을 먼저 살피는 것이 제 버릇입니다.'},
    {name:'등애',conds:[{kind:'stage',stage:'S3-03'},{kind:'challenge',step:5}],line:'사, 사마 태부… 저, 저를 써 주십시오.'},
    {name:'종회',conds:[{kind:'stage',stage:'S3-06'},{kind:'officer',name:'등애'},{kind:'seals',count:90}],line:'제 꾀가 태부의 그릇에 닿을지 보시지요.'},
  ]},
];
export const RECRUITABLE=LINEAGES.flatMap(l=>l.officers.map(o=>o.name));
/**
 * 이야기를 하면서 저절로 들어오는 장수: 연의 장(또는 극한)이 조건에 들어 있는 장수는, 그 장을 이겨
 * 조건을 모두 채운 순간 등용 화면에 가지 않아도 합류한다(계보 순서는 지킨다). 새로 들어온 이름을 돌려준다.
 */
export function storyRecruits(x:RecruitContext):string[]{
  const rec=new Set(x.recruited),got:string[]=[];let changed=true;
  while(changed){changed=false;
    for(const o of LINEAGES.flatMap(l=>l.officers)){
      if(rec.has(o.name)||!o.conds.some(c=>c.kind==='stage'||c.kind==='extreme'))continue;
      if(recruitStatus(o.name,{...x,recruited:rec})==='ready'){rec.add(o.name);got.push(o.name);changed=true;}
    }}
  return got;
}

export interface RecruitContext {
  /** 연의 장을 이겼나(일반 이상) */
  won(stage:string):boolean;
  /** 극한으로 이겼나 */
  extreme(stage:string):boolean;
  heroLevel:number;seals:number;challenges:number;trainingWins:number;endings:number;treasures:number;
  recruited:ReadonlySet<string>;
  /** 장 id → 화면에 보일 이름 */
  stageName(stage:string):string;
}
export function condMet(c:RecruitCond,x:RecruitContext):boolean{
  switch(c.kind){
    case 'stage':return x.won(c.stage);
    case 'extreme':return x.extreme(c.stage);
    case 'level':return x.heroLevel>=c.level;
    case 'officer':return x.recruited.has(c.name);
    case 'seals':return x.seals>=c.count;
    case 'challenge':return x.challenges>=c.step;
    case 'training':return x.trainingWins>=c.wins;
    case 'ending':return x.endings>=c.count;
    case 'treasures':return x.treasures>=c.count;
  }
}
export function condText(c:RecruitCond,x:RecruitContext):string{
  switch(c.kind){
    case 'stage':return `연의 「${x.stageName(c.stage)}」 승리`;
    case 'extreme':return `「${x.stageName(c.stage)}」 극한 승리`;
    case 'level':return `사마의 Lv.${c.level} (지금 ${x.heroLevel})`;
    case 'officer':return `${c.name} 먼저 등용`;
    case 'seals':return `인장 ${c.count}개 (지금 ${x.seals})`;
    case 'challenge':return `도전의 관문 ${c.step}단계 돌파 (지금 ${x.challenges})`;
    case 'training':return `수련 ${c.wins}승 (지금 ${x.trainingWins})`;
    case 'ending':return `결말 ${c.count}개 보기 (지금 ${x.endings})`;
    case 'treasures':return `보물 ${c.count}점 모으기 (지금 ${x.treasures})`;
  }
}
/** 계보 안 앞 단계(바로 위 장수) — 없으면 undefined */
export function previousOf(name:string):string|undefined{
  for(const l of LINEAGES){const i=l.officers.findIndex(o=>o.name===name);if(i>0)return l.officers[i-1]!.name;if(i===0)return undefined;}
  return undefined;
}
export type RecruitStatus='recruited'|'ready'|'locked'|'sealed';
/** 등용함 · 들일 수 있음 · 조건 남음 · 앞 단계가 아직(계보 순서) */
export function recruitStatus(name:string,x:RecruitContext):RecruitStatus{
  if(x.recruited.has(name))return 'recruited';
  const prev=previousOf(name);if(prev&&!x.recruited.has(prev))return 'sealed';
  const o=LINEAGES.flatMap(l=>l.officers).find(o=>o.name===name);if(!o)return 'locked';
  return o.conds.every(c=>condMet(c,x))?'ready':'locked';
}
