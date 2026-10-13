/**
 * 등용(계보) — 이름난 장수를 사마의 휘하로 들인다. 들이는 길은 셋이다.
 *
 * 1. 연의 합류(story) — 사마 일가와 사마의 곁에서 싸운 막료. 그 장을 이기면 이야기 속에서 저절로 들어온다.
 * 2. 격파 귀순(defeat) — 사마의와 맞선 적장. 그 장수를 전장에서 몇 번 꺾어(퇴각시키고 이긴 전투) 그릇을 보여 줘야 무릎을 꿇는다.
 *    극한에서 꺾으면 두 번으로 친다.
 * 3. 공훈 등용(merit) — 위의 명장·책사·종실. 싸워 쌓은 공훈을 바쳐 모셔 온다. 장수마다 공훈과 함께 '해낸 일' 하나가 더 필요하다.
 *
 * 구조(조조전 Online의 '계보'를 구조만 참고, 이름·조건·수치는 이 게임이 정함):
 * - 장수는 인연이 닿는 무리(계보)로 묶인다. 공훈 등용 장수는 같은 계보의 앞 공훈 장수를 먼저 들여야 열린다.
 * - 계보 하나를 다 모으면 계보 완성 보상(천명)을 한 번 받는다.
 * - 들인 장수는 연의 출진의 「등용 장수」 칸과 천명의 길 동료로 합류한다(meta.recruited).
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
  |{kind:'treasures';count:number}
  /** 그 장수를 전장에서 count번 꺾기(퇴각시키고 이긴 전투, 극한은 2번) — stage는 만나는 곳 */
  |{kind:'defeat';name:string;stage:string;count:number}
  /** 공훈 cost를 바친다(등용할 때 빠진다) */
  |{kind:'merit';cost:number};
export type RecruitRoute='story'|'defeat'|'merit';
export interface RecruitOfficer {name:string;route:RecruitRoute;conds:readonly RecruitCond[];line:string}
export interface Lineage {id:string;name:string;seal:string;blurb:string;/** 계보를 다 모으면 받는 천명 */reward:number;officers:readonly RecruitOfficer[]}

export const ROUTE_LABEL:Record<RecruitRoute,string>={story:'연의 합류',defeat:'격파 귀순',merit:'공훈 등용'};
export const ROUTE_NOTE:Record<RecruitRoute,string>={
  story:'연의에서 사마의 곁에 서는 사람이다. 그 장을 이기면 저절로 합류한다.',
  defeat:'사마의와 맞선 적장이다. 전장에서 꺾고 이길 때마다 마음이 기운다. 정해진 횟수를 채우면 스스로 귀순한다. 극한에서 꺾으면 두 번으로 친다.',
  merit:'싸워 쌓은 공훈을 바쳐 모셔 온다. 공훈과 함께 그 장수가 눈여겨볼 공적이 하나 더 필요하다.',
};

const S=(stage:string):RecruitCond=>({kind:'stage',stage});
const M=(cost:number):RecruitCond=>({kind:'merit',cost});
const D=(name:string,stage:string,count:number):RecruitCond=>({kind:'defeat',name,stage,count});

/** 계보 여덟. 공훈 등용 장수는 같은 계보 안에서 위에서부터 차례로 들인다. */
export const LINEAGES:readonly Lineage[]=[
  {id:'sima',name:'사마 일가',seal:'사',blurb:'하내 사마씨 — 아버지·형제·아들',reward:5,officers:[
    {name:'사마방',route:'story',conds:[S('S1-02')],line:'엄한 아비가 아들의 길을 지켜보마.'},
    {name:'사마부',route:'story',conds:[S('S1-03')],line:'형님, 집안일은 제게 맡기고 큰일을 보십시오.'},
    {name:'사마사',route:'story',conds:[S('S2-05')],line:'아버님의 뜻이 곧 제 칼끝입니다.'},
    {name:'사마소',route:'story',conds:[S('S2-08')],line:'형님 곁에서, 아버님의 그림을 완성하겠습니다.'},
  ]},
  {id:'sima_staff',name:'사마의의 막료',seal:'막',blurb:'사마의의 군막에서 함께 싸운 장수와 책사',reward:6,officers:[
    {name:'장제',route:'story',conds:[S('S1-05')],line:'벗이여, 그대의 때를 함께 기다리겠네.'},
    {name:'장합',route:'story',conds:[S('S2-06')],line:'교변의 재주, 도독을 위해 쓰겠소.'},
    {name:'곽회',route:'story',conds:[S('S2-07')],line:'옹주의 바람은 내가 가장 잘 아오.'},
    {name:'호준',route:'story',conds:[S('S2-09')],line:'태위의 군령이라면 어디든 가겠습니다.'},
    {name:'가충',route:'story',conds:[S('S3-06')],line:'사마씨의 일이라면 무엇이든.'},
  ]},
  {id:'turncoats',name:'항장',seal:'항',blurb:'적이었으나 사마의에게 꺾이고 그 그릇에 돌아선 장수들',reward:10,officers:[
    {name:'맹달',route:'defeat',conds:[D('맹달','S2-05',2)],line:'네 번째 주인은… 끝까지 모시리다.'},
    {name:'왕평',route:'defeat',conds:[D('왕평','S2-06',2)],line:'산 위에 진을 치지 말라 했건만. 이제 그대의 군을 따르겠소.'},
    {name:'강유',route:'defeat',conds:[D('강유','S2-14',3),{kind:'level',level:20}],line:'승상의 뜻을 이을 곳이 여기라면.'},
    {name:'왕릉',route:'defeat',conds:[D('왕릉','S3-07',2)],line:'수춘의 깃발을 내리겠소. 태부의 군을 따르리다.'},
    {name:'황권',route:'merit',conds:[M(120),S('S2-03')],line:'촉을 등진 것이 아니라, 길이 끊겼을 뿐이오.'},
  ]},
  {id:'wei_clan',name:'위의 종실',seal:'조',blurb:'조씨·하후씨 — 위 황실의 피붙이',reward:6,officers:[
    {name:'조홍',route:'merit',conds:[M(100),{kind:'training',wins:3}],line:'재물은 아끼되 사람은 아끼지 않는다? 내가 그랬던가.'},
    {name:'조휴',route:'merit',conds:[M(160),S('S2-08')],line:'천리구라 불린 몸, 이번엔 꾀에 빠지지 않겠소.'},
    {name:'조상',route:'merit',conds:[M(200),S('S3-05'),{kind:'extreme',stage:'S3-04'}],line:'대장군의 자리… 태부께서 곁에 계시다면야.'},
    {name:'하후패',route:'merit',conds:[M(220),{kind:'level',level:18}],line:'아버지 하후연의 이름을 더럽히지 않겠다.'},
  ]},
  {id:'wei_generals',name:'위의 명장',seal:'장',blurb:'전장에서 이름을 얻은 장수들',reward:8,officers:[
    {name:'악진',route:'merit',conds:[M(80),S('S1-06')],line:'선봉은 언제나 내 몫이었소.'},
    {name:'서황',route:'merit',conds:[M(160),{kind:'level',level:10}],line:'주아부처럼 군율로 싸우겠소.'},
    {name:'장료',route:'merit',conds:[M(300),{kind:'challenge',step:6}],line:'요래요래 — 합비의 이름을 다시 떨치리다.'},
  ]},
  {id:'cao_veterans',name:'조조의 옛 장수',seal:'위',blurb:'창업기의 맹장 — 조조 곁에서 사마의를 지켜본 사람들',reward:8,officers:[
    {name:'하후돈',route:'merit',conds:[M(120),S('S1-07')],line:'눈 하나로도 전장은 다 보이네.'},
    {name:'하후연',route:'merit',conds:[M(160),{kind:'seals',count:20}],line:'사흘에 오백 리, 천 리라도 달려가지.'},
    {name:'조인',route:'merit',conds:[M(200),{kind:'training',wins:8}],line:'성 하나를 맡기면 끝까지 지켜 내겠소.'},
    {name:'방덕',route:'merit',conds:[M(260),{kind:'extreme',stage:'S1-06'}],line:'관을 짊어지고 왔소. 물러설 생각은 없소.'},
  ]},
  {id:'wei_minds',name:'위의 책사',seal:'책',blurb:'붓과 꾀로 나라를 받친 사람들',reward:8,officers:[
    {name:'가규',route:'merit',conds:[M(100),{kind:'treasures',count:10}],line:'예주를 다스리던 법도로 군량을 맡지요.'},
    {name:'가후',route:'merit',conds:[M(220),{kind:'treasures',count:15}],line:'살아남는 계책이라면 내가 조금 아오.'},
    {name:'순욱',route:'merit',conds:[M(320),{kind:'seals',count:60},{kind:'ending',count:1}],line:'왕좌를 보좌할 재목을 보았소.'},
  ]},
  {id:'late_pillars',name:'후대의 기둥',seal:'진',blurb:'사마의가 길러 낸 장수들 — 촉을 막고 진의 터를 닦다',reward:10,officers:[
    {name:'진태',route:'merit',conds:[M(140),S('S3-02')],line:'옹주는 제가 지키겠습니다.'},
    {name:'왕기',route:'merit',conds:[M(180),{kind:'training',wins:5}],line:'군량과 길을 먼저 살피는 것이 제 버릇입니다.'},
    {name:'등애',route:'merit',conds:[M(260),{kind:'challenge',step:5}],line:'사, 사마 태부… 저, 저를 써 주십시오.'},
    {name:'종회',route:'merit',conds:[M(340),{kind:'seals',count:90}],line:'제 꾀가 태부의 그릇에 닿을지 보시지요.'},
  ]},
];
export const RECRUITABLE=LINEAGES.flatMap(l=>l.officers.map(o=>o.name));
const ALL=LINEAGES.flatMap(l=>l.officers);
export const officerOf=(name:string)=>ALL.find(o=>o.name===name);
export const lineageOf=(name:string)=>LINEAGES.find(l=>l.officers.some(o=>o.name===name));
/** 격파 귀순 대상 이름(전투가 끝나면 이 이름만 격파 수를 센다). */
export const DEFEAT_TARGETS:readonly string[]=[...new Set(ALL.flatMap(o=>o.conds.flatMap(c=>c.kind==='defeat'?[c.name]:[])))];
export const meritCost=(name:string)=>{for(const c of officerOf(name)?.conds??[])if(c.kind==='merit')return c.cost;return 0;};

/**
 * 공훈 — 싸워서 쌓고 공훈 등용에 바친다.
 * 연의 첫 승리(극한은 더 크게) · 다시 이긴 연의 · 새로 얻은 천명 · 쓰러뜨린 이름난 적장 · 수련 · 보물 사냥 · 도전 첫 돌파 · 보물 외전 첫 승리.
 */
export const MERIT={storyFirst:30,storyFirstExtreme:50,storyAgain:8,seal:5,foe:4,training:6,bounty:6,challenge:40,quest:20} as const;
/** 전투 한 번에 받는 공훈. foes는 쓰러뜨린 이름난 적장 수. */
export function battleMerit(o:{firstWin:boolean;extreme:boolean;newSeals:number;foes:number}):number{
  return (o.firstWin?(o.extreme?MERIT.storyFirstExtreme:MERIT.storyFirst):MERIT.storyAgain)+o.newSeals*MERIT.seal+o.foes*MERIT.foe;
}
/** 외전 승리 공훈(수련·보물 사냥은 매번, 도전·보물 외전은 첫 승리만 — 이미 넘은 곳은 first=false). */
export function missionMerit(kind:'training'|'bounty'|'challenge'|'quest',first:boolean):number{
  return kind==='training'?MERIT.training:kind==='bounty'?MERIT.bounty:first?(kind==='challenge'?MERIT.challenge:MERIT.quest):0;
}
/** 공훈이 생기기 전 저장: 지금까지의 공적을 공훈으로 한 번 셈해 준다. */
export function retroMerit(o:{storyWins:number;sealsPaid:number;challenges:number;quests:number;trainingWins:number;bountyWins:number}):number{
  return o.storyWins*MERIT.storyFirst+o.sealsPaid*MERIT.seal+o.challenges*MERIT.challenge+o.quests*MERIT.quest+o.trainingWins*MERIT.training+o.bountyWins*MERIT.bounty;
}
/** 이긴 전투에서 쓰러진 적 장수 이름 → 격파 귀순 기록에 더한다(극한은 2). 더한 이름을 돌려준다. */
export function recordDefeats(defeats:Record<string,number>,fallen:readonly string[],extreme:boolean):string[]{
  const got:string[]=[];
  for(const n of new Set(fallen))if(DEFEAT_TARGETS.includes(n)){defeats[n]=Math.min(99,(defeats[n]??0)+(extreme?2:1));got.push(n);}
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
  /** 지금 가진 공훈 */
  merit?:number;
  /** 격파 귀순 기록(이름 → 꺾은 횟수) */
  defeats?:Readonly<Record<string,number>>;
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
    case 'defeat':return (x.defeats?.[c.name]??0)>=c.count;
    case 'merit':return (x.merit??0)>=c.cost;
  }
}
export function condText(c:RecruitCond,x:RecruitContext):string{
  switch(c.kind){
    case 'stage':return `연의 「${x.stageName(c.stage)}」 승리`;
    case 'extreme':return `「${x.stageName(c.stage)}」 극한 승리`;
    case 'level':return `사마의 Lv.${c.level} (지금 ${x.heroLevel})`;
    case 'officer':return `${c.name} 먼저 등용`;
    case 'seals':return `연의 천명 ${c.count}개 (지금 ${x.seals})`;
    case 'challenge':return `도전의 관문 ${c.step}단계 돌파 (지금 ${x.challenges})`;
    case 'training':return `수련 ${c.wins}승 (지금 ${x.trainingWins})`;
    case 'ending':return `결말 ${c.count}개 보기 (지금 ${x.endings})`;
    case 'treasures':return `보물 ${c.count}점 모으기 (지금 ${x.treasures})`;
    case 'defeat':return `「${x.stageName(c.stage)}」에서 ${c.name} 격파 ${Math.min(c.count,x.defeats?.[c.name]??0)}/${c.count}`;
    case 'merit':return `공훈 ${c.cost} 바치기 (지금 ${x.merit??0})`;
  }
}
/** 조건 하나의 진척(0~1). 막대로 보여 준다. */
export function condProgress(c:RecruitCond,x:RecruitContext):number{
  const r=(have:number,need:number)=>Math.max(0,Math.min(1,need>0?have/need:1));
  switch(c.kind){
    case 'level':return r(x.heroLevel,c.level);
    case 'seals':return r(x.seals,c.count);
    case 'challenge':return r(x.challenges,c.step);
    case 'training':return r(x.trainingWins,c.wins);
    case 'ending':return r(x.endings,c.count);
    case 'treasures':return r(x.treasures,c.count);
    case 'defeat':return r(x.defeats?.[c.name]??0,c.count);
    case 'merit':return r(x.merit??0,c.cost);
    default:return condMet(c,x)?1:0;
  }
}
/** 장수 한 명의 진척(조건 진척의 평균, 0~1) — 목록 칸의 작은 막대. */
export function recruitProgress(name:string,x:RecruitContext):number{
  const o=officerOf(name);if(!o)return 0;if(x.recruited.has(name))return 1;
  return o.conds.reduce((n,c)=>n+condProgress(c,x),0)/Math.max(1,o.conds.length);
}
/** 계보 안 앞 단계: 공훈 등용 장수만, 같은 계보의 바로 앞 공훈 등용 장수를 먼저 들여야 한다. */
export function previousOf(name:string):string|undefined{
  const l=lineageOf(name),o=officerOf(name);if(!l||!o||o.route!=='merit')return undefined;
  const merit=l.officers.filter(x=>x.route==='merit'),i=merit.findIndex(x=>x.name===name);
  return i>0?merit[i-1]!.name:undefined;
}
export type RecruitStatus='recruited'|'ready'|'locked'|'sealed';
/** 등용함 · 들일 수 있음 · 조건 남음 · 앞 단계가 아직(계보 순서) */
export function recruitStatus(name:string,x:RecruitContext):RecruitStatus{
  if(x.recruited.has(name))return 'recruited';
  const prev=previousOf(name);if(prev&&!x.recruited.has(prev))return 'sealed';
  const o=officerOf(name);if(!o)return 'locked';
  return o.conds.every(c=>condMet(c,x))?'ready':'locked';
}
/** 연의 합류 장수인가(연의 장 대결의 사기 효과를 같이 받는다). */
export function isStoryRecruit(name:string):boolean{return officerOf(name)?.route==='story';}
/**
 * 전투가 끝난 뒤 저절로 들어오는 장수: 연의 합류(그 장을 이김)와 격파 귀순(정해진 횟수를 꺾음).
 * 공훈 등용은 등용 화면에서 공훈을 바쳐야 한다. 새로 들어온 이름을 돌려준다.
 */
export function autoRecruits(x:RecruitContext):string[]{
  const rec=new Set(x.recruited),got:string[]=[];let changed=true;
  while(changed){changed=false;
    for(const o of ALL){
      if(rec.has(o.name)||o.route==='merit')continue;
      if(recruitStatus(o.name,{...x,recruited:rec})==='ready'){rec.add(o.name);got.push(o.name);changed=true;}
    }}
  return got;
}
/** 옛 이름(연의 합류만 보던 때) — 같은 동작. */
export const storyRecruits=autoRecruits;
/** 다 모았지만 아직 보상을 받지 않은 계보. */
export function completedLineages(recruited:ReadonlySet<string>,rewarded:readonly string[]):Lineage[]{
  return LINEAGES.filter(l=>!rewarded.includes(l.id)&&l.officers.every(o=>recruited.has(o.name)));
}
/** 격파 진척 알림 문구(전투 뒤): 아직 귀순하지 않은 대상만. */
export function defeatNews(names:readonly string[],x:RecruitContext):string[]{
  return names.flatMap(n=>{const o=ALL.find(a=>a.route==='defeat'&&a.conds.some(c=>c.kind==='defeat'&&c.name===n));if(!o||x.recruited.has(o.name))return [];
    const c=o.conds.find(c=>c.kind==='defeat') as Extract<RecruitCond,{kind:'defeat'}>,have=Math.min(c.count,x.defeats?.[n]??0);
    return [have>=c.count?(o.conds.every(k=>condMet(k,x))?`${n} 격파 ${have}/${c.count} — 귀순한다`:`${n} 격파 ${have}/${c.count} — 남은 조건을 채우면 귀순한다`):`${n} 격파 ${have}/${c.count} — ${c.count-have}번 더 꺾으면 귀순한다`];});
}
