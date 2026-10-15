/**
 * 등용 — 이름난 장수를 나라마다 모은다. 두 이야기가 따로 모은다:
 * 사마의전에서 들인 장수는 사마의 휘하로, 제갈량전에서 들인 장수는 제갈량 휘하로 들어 그 이야기의 출진 「등용 장수」 칸에 선다(나라와 상관없이).
 *
 * 들이는 길(장수마다 하나 — recruit-roster.ts):
 * 1. 연의 합류(story) — 이야기 속에서 주인공 곁에 서는 사람. 그 장을 이기면 저절로 들어온다.
 * 2. 격파(defeat) — 맞선 적장. 꺾을 때마다 호감이 쌓인다. 일기토·설전에서 이기면 「살려 보낸다」(호감 더)와
 *    「등용을 권한다」(호감이 가득 찼을 때만 받아들임) 가운데 고른다. 호감이 가득 차면 본영 「등용」에서도 받아들일 수 있다.
 * 3. 공훈(merit) — 싸워 모은 공훈을 바쳐 모셔 온다. 그 나라 명성도 정해진 만큼 쌓여야 한다. 군주는 모두 이 길로만 온다:
 *    위·촉·오 군주(조조·조비·조예·유비·손권)는 그 나라의 공적(명성)을 바치고, 나머지 군주는 공훈만 바친다 — 어느 쪽이든 일반 장수보다 비싸다.
 *    바친 명성은 따로 적어 두어, 다른 장수의 명성 조건(쌓인 명성)은 줄지 않는다.
 * 4. 인연(bond) — 인연 있는 장수와 함께 출진해 이기면 따라온다.
 * 5. 조건 승리(feat) — 그 장을 정해진 조건(손실 없이·극한)으로 이기면 그 솜씨를 보고 들어온다.
 * 6. 구출(rescue) — 그 장에서 지켜야 할 아군을 살려(체력 절반 이상) 이기면 은혜를 갚으러 온다.
 *
 * 나라 하나를 다 모으면 그 이야기의 칭호를 얻는다. 칭호를 달면 주인공 이름 앞에 붙는다(꾸밈 — 능력치는 그대로).
 * 공훈은 두 이야기가 함께 쓰는 하나의 주머니, 명성·호감은 이야기마다 따로다.
 */
import {ROSTER_S,ROSTER_Z,FAME_NATIONS} from './recruit-roster.ts';
import {을를,이가,과와} from './josa.ts';

export type Story='S'|'Z';
export type Nation='위'|'촉'|'오'|'군웅'|'초'|'한';
export const NATIONS:readonly Nation[]=['위','촉','오','군웅','초','한'];
export type RecruitRoute='story'|'defeat'|'merit'|'bond'|'feat'|'rescue';
export interface RosterEntry {
  n:string;f:Nation;
  /** 계급(1 군주 … 5) — officer-ranks.ts */
  t:number;r:RecruitRoute;
  /** 만나는 장(연의 합류·격파·조건·구출) */
  s?:string;
  /** 격파: 겨룸의 종류(무력이 높으면 일기토, 지력이 높으면 설전) */
  c?:'duel'|'debate';
  /** 조건 승리: noLoss 아군 손실 없이 · extreme 극한으로 */
  k?:'noLoss'|'extreme';
  /** 인연: 함께 출진해야 할 장수 */
  w?:string;
}
export const ROSTER:Record<Story,readonly RosterEntry[]>={S:ROSTER_S,Z:ROSTER_Z};
export const HERO:Record<Story,string>={S:'사마의',Z:'제갈량'};
export const STORY_NAME:Record<Story,string>={S:'사마의전',Z:'제갈량전'};

export const ROUTE_LABEL:Record<RecruitRoute,string>={story:'연의 합류',defeat:'격파',merit:'공훈',bond:'인연',feat:'조건 승리',rescue:'구출'};
export const ROUTE_MARK:Record<RecruitRoute,string>={story:'연',defeat:'격',merit:'공',bond:'인',feat:'조',rescue:'구'};
export const ROUTES:readonly RecruitRoute[]=['story','defeat','merit','bond','feat','rescue'];
export const ROUTE_NOTE:Record<RecruitRoute,string>={
  story:'이야기 속에서 주인공 곁에 서는 사람이다. 그 장을 이기면 저절로 합류한다.',
  defeat:'맞선 적장이다. 전장에서 꺾고 이길 때마다 호감이 쌓인다(극한은 두 배). 일기토·설전에서 이기면 「살려 보낸다」나 「등용을 권한다」를 고른다. 호감이 가득 차면 등용을 받아들인다.',
  merit:'싸워 모은 공훈을 바쳐 모셔 온다. 그 나라 명성도 정해진 만큼 쌓여야 한다. 군주는 이 길로만 온다 — 위·촉·오 군주는 그 나라 공적(명성)을, 나머지 군주는 공훈을 일반 장수보다 많이 바친다.',
  bond:'인연 있는 장수와 함께 출진해 이기면 따라온다.',
  feat:'그 장을 정해진 조건으로 이기면 그 솜씨를 보고 찾아온다.',
  rescue:'그 장에서 지켜야 할 사람을 살려서 이기면 은혜를 갚으러 온다.',
};
/** 공훈 등용 값(계급별). */
export const MERIT_COST:Readonly<Record<number,number>>={1:280,2:100,3:60,4:40,5:25};
/** 위·촉·오 군주: 공훈 대신 그 나라 공적(명성)을 바친다. */
export const LORD_FAME_COST=60;
const NATION_LORD_LANDS:readonly Nation[]=['위','촉','오'];
/** 그 나라 공적(명성)으로 모셔 오는 군주인가(위·촉·오 군주). */
export const isNationLord=(e:RosterEntry)=>e.r==='merit'&&e.t===1&&NATION_LORD_LANDS.includes(e.f);
/** 격파 등용에 필요한 호감(계급별). */
export const FAVOR_NEED:Readonly<Record<number,number>>={1:5,2:4,3:3,4:2,5:2};
/** 공훈 등용에 필요한 그 나라 명성(계급별). */
export const FAME_NEED:Readonly<Record<number,number>>={1:50,2:30,3:20,4:10,5:5};
/** 명성: 이긴 전투에서 꺾은 그 나라 이름난 장수(극한) · 일기토·설전 승리 · 그 나라 장수를 들임 · 이긴 전투에 나온 적 나라마다. */
export const FAME={foe:3,foeExtreme:5,contest:3,recruit:5,battle:1} as const;
/** 칭호: 이야기마다 한 나라를 다 모으면 얻는다. */
export const TITLES:Readonly<Record<Nation,{name:string;note:string}>>={
  위:{name:'위의 기둥',note:'위의 장수를 모두 모았다'},
  촉:{name:'한실의 충신',note:'촉의 장수를 모두 모았다'},
  오:{name:'강동의 호걸',note:'오의 장수를 모두 모았다'},
  군웅:{name:'난세의 패자',note:'군웅을 모두 모았다'},
  초:{name:'패왕의 벗',note:'초의 장수를 모두 모았다'},
  한:{name:'개국의 공신',note:'한의 장수를 모두 모았다'},
};

export const entryOf=(story:Story,name:string)=>ROSTER[story].find(e=>e.n===name);
export const meritCost=(e:RosterEntry)=>e.r==='merit'&&!isNationLord(e)?MERIT_COST[e.t]??80:0;
/** 바칠 그 나라 공적(명성) — 위·촉·오 군주만. */
export const fameCost=(e:RosterEntry)=>isNationLord(e)?LORD_FAME_COST:0;
export const favorNeed=(e:RosterEntry)=>FAVOR_NEED[e.t]??3;
/** 쌓인 명성 조건(군주는 없음 — 위·촉·오 군주는 명성을 바치고, 나머지 군주는 공훈만). 그 이야기에서 적으로 나오는 장수가 없는 나라는 명성을 쌓을 수 없으니 공훈만 본다. */
export const fameNeed=(story:Story,e:RosterEntry)=>e.r==='merit'&&e.t>1&&FAME_NATIONS[story].includes(e.f)?FAME_NEED[e.t]??10:0;
export const favorKey=(story:Story,name:string)=>`${story}:${name}`;
export const fameKey=(story:Story,nation:Nation)=>`${story}:${nation}`;
export const titleKey=fameKey;

/**
 * 공훈 — 싸워서 쌓고 공훈 등용에 바친다(두 이야기 함께).
 * 연의 첫 승리(극한은 더 크게) · 다시 이긴 연의 · 새로 얻은 천명 · 쓰러뜨린 이름난 적장 · 수련 · 보물 사냥 · 도전 첫 돌파 · 보물 외전 첫 승리.
 */
export const MERIT={storyFirst:60,storyFirstExtreme:100,storyAgain:15,seal:10,foe:6,training:10,bounty:10,challenge:60,quest:30} as const;
/** 전투 한 번에 받는 공훈. foes는 쓰러뜨린 이름난 적장 수. */
export function battleMerit(o:{firstWin:boolean;extreme:boolean;newSeals:number;foes:number}):number{
  return (o.firstWin?(o.extreme?MERIT.storyFirstExtreme:MERIT.storyFirst):MERIT.storyAgain)+o.newSeals*MERIT.seal+o.foes*MERIT.foe;
}
/** 외전 승리 공훈(수련·보물 사냥은 매번, 도전·보물 외전은 첫 승리만). */
export function missionMerit(kind:'training'|'bounty'|'challenge'|'quest',first:boolean):number{
  return kind==='training'?MERIT.training:kind==='bounty'?MERIT.bounty:first?(kind==='challenge'?MERIT.challenge:MERIT.quest):0;
}
/** 공훈이 생기기 전 저장: 지금까지의 공적을 공훈으로 한 번 셈해 준다. */
export function retroMerit(o:{storyWins:number;sealsPaid:number;challenges:number;quests:number;trainingWins:number;bountyWins:number}):number{
  return o.storyWins*MERIT.storyFirst+o.sealsPaid*MERIT.seal+o.challenges*MERIT.challenge+o.quests*MERIT.quest+o.trainingWins*MERIT.training+o.bountyWins*MERIT.bounty;
}

/** 등용 기록(meta.ts MetaState의 일부). recruited는 사마의전, recruitedZ는 제갈량전. */
export interface RecruitMeta {
  recruited?:string[];recruitedZ?:string[];merit?:number;
  /** 'S:맹달' → 호감 */
  favor?:Record<string,number>;
  /** 'S:촉' → 쌓인 명성 */
  fame?:Record<string,number>;
  /** 'S:촉' → 군주에게 바친 명성 */
  fameSpent?:Record<string,number>;
  /** 얻은 칭호 'S:위' */
  titles?:string[];
  /** 주인공이 단 칭호(나라) */
  title?:Partial<Record<Story,Nation>>;
}
export const recruitedOf=(m:RecruitMeta,story:Story):readonly string[]=>(story==='S'?m.recruited:m.recruitedZ)??[];
export const favorOf=(m:RecruitMeta,story:Story,name:string)=>m.favor?.[favorKey(story,name)]??0;
export const fameOf=(m:RecruitMeta,story:Story,nation:Nation)=>m.fame?.[fameKey(story,nation)]??0;
/** 바칠 수 있는 명성(쌓인 명성 − 바친 명성). */
export const fameLeft=(m:RecruitMeta,story:Story,nation:Nation)=>Math.max(0,fameOf(m,story,nation)-(m.fameSpent?.[fameKey(story,nation)]??0));
const addFame=(m:RecruitMeta,story:Story,nation:Nation,n:number)=>{const f=m.fame??={},k=fameKey(story,nation);f[k]=Math.min(9999,(f[k]??0)+n);};
const addFavor=(m:RecruitMeta,story:Story,name:string,n:number)=>{const f=m.favor??={},k=favorKey(story,name);f[k]=Math.min(99,(f[k]??0)+n);return f[k]!;};

export type RecruitStatus='recruited'|'ready'|'locked';
/** 등용함 · 들일 수 있음(공훈·격파는 본영에서) · 조건 남음 */
export function recruitStatus(m:RecruitMeta,story:Story,e:RosterEntry):RecruitStatus{
  if(recruitedOf(m,story).includes(e.n))return 'recruited';
  if(e.r==='merit')return (m.merit??0)>=meritCost(e)&&fameOf(m,story,e.f)>=fameNeed(story,e)&&fameLeft(m,story,e.f)>=fameCost(e)?'ready':'locked';
  if(e.r==='defeat')return favorOf(m,story,e.n)>=favorNeed(e)?'ready':'locked';
  return 'locked';
}
export interface CondLine {ok:boolean;text:string;p:number}
/** 장수 한 명의 등용 조건 줄(진척 막대 포함). won은 장을 이겼는지, stageName은 장 이름. */
export function condLines(m:RecruitMeta,story:Story,e:RosterEntry,won:(stage:string)=>boolean,stageName:(stage:string)=>string):CondLine[]{
  const r=(have:number,need:number)=>Math.max(0,Math.min(1,need>0?have/need:1)),got=recruitedOf(m,story).includes(e.n);
  const at=e.s?`「${stageName(e.s)}」`:'';
  switch(e.r){
    case 'story':return [{ok:got||(!!e.s&&won(e.s)),text:`연의 ${at} 승리`,p:got?1:0}];
    case 'defeat':{const f=favorOf(m,story,e.n),need=favorNeed(e);
      return [{ok:got||f>=need,text:`호감 ${Math.min(f,need)}/${need} — ${at}에서 만난다 · 꺾고 이기면 +1(극한 +2) · ${e.c==='debate'?'설전':'일기토'}에서 이기면 +1`,p:got?1:r(f,need)}];}
    case 'merit':{const c=meritCost(e),need=fameNeed(story,e),fm=fameOf(m,story,e.f),mt=m.merit??0;
      if(isNationLord(e)){const fc=fameCost(e),left=fameLeft(m,story,e.f);return [{ok:got||left>=fc,text:`${e.f}의 공적(명성) ${fc} 바치기 (바칠 수 있는 명성 ${left})`,p:got?1:r(left,fc)}];}
      return [{ok:got||mt>=c,text:`공훈 ${c} 바치기 (지금 ${mt})`,p:got?1:r(mt,c)},...(need?[{ok:got||fm>=need,text:`${e.f} 명성 ${need} (지금 ${fm})`,p:got?1:r(fm,need)}]:[])];}
    case 'bond':return [{ok:got,text:`${과와(e.w??'')} 함께 출진해 ${STORY_NAME[story]} 전투에서 이기기`,p:got?1:recruitedOf(m,story).includes(e.w??'')?.5:0}];
    case 'feat':return [{ok:got,text:`${at}${e.k==='extreme'?'을 극한으로':'을 아군 손실 없이'} 이기기`,p:got?1:0}];
    case 'rescue':return [{ok:got,text:`${at}에서 ${을를(e.n)} 지켜(체력 절반 이상) 이기기`,p:got?1:0}];
  }
}
/** 장수 한 명의 진척(0~1) — 목록 칸의 작은 막대. */
export function recruitProgress(m:RecruitMeta,story:Story,e:RosterEntry,won:(stage:string)=>boolean):number{
  const lines=condLines(m,story,e,won,s=>s);return lines.reduce((n,l)=>n+(l.ok?1:l.p),0)/Math.max(1,lines.length);
}
/** 공훈·격파로 지금 본영에서 들일 수 있는 장수. */
export function readyList(m:RecruitMeta,story:Story):RosterEntry[]{return ROSTER[story].filter(e=>(e.r==='merit'||e.r==='defeat')&&recruitStatus(m,story,e)==='ready');}

/** 장수 하나를 들인다(값은 부른 쪽이 치른다). 명성·칭호를 갱신하고 칭호 알림을 돌려준다. */
export function joinRecruit(m:RecruitMeta,story:Story,name:string):string[]{
  const e=entryOf(story,name);if(!e||recruitedOf(m,story).includes(name))return [];
  if(story==='S')m.recruited=[...(m.recruited??[]),name];else m.recruitedZ=[...(m.recruitedZ??[]),name];
  addFame(m,story,e.f,FAME.recruit);
  return titleNews(m,story);
}
/** 다 모은 나라의 칭호를 준다(새로 얻은 것만 알린다). */
export function titleNews(m:RecruitMeta,story:Story):string[]{
  const got=new Set(recruitedOf(m,story)),out:string[]=[];
  for(const f of NATIONS){const k=titleKey(story,f);if((m.titles??[]).includes(k))continue;
    const list=ROSTER[story].filter(e=>e.f===f);if(list.length&&list.every(e=>got.has(e.n))){m.titles=[...(m.titles??[]),k];out.push(`칭호 「${TITLES[f].name}」 — ${STORY_NAME[story]}에서 ${f}의 장수를 모두 모았다`);}}
  return out;
}
/** 본영에서 들이기(공훈은 값을 치른다 · 격파는 호감이 찼을 때). 못 들이면 undefined. */
export function buyRecruit(m:RecruitMeta,story:Story,name:string):string[]|undefined{
  const e=entryOf(story,name);if(!e||recruitStatus(m,story,e)!=='ready')return undefined;
  if(e.r==='merit'){m.merit=(m.merit??0)-meritCost(e);const fc=fameCost(e);if(fc){const sp=m.fameSpent??={},k=fameKey(story,e.f);sp[k]=(sp[k]??0)+fc;}}
  return joinRecruit(m,story,name);
}
/** 단 칭호(얻은 것만). */
export function heroTitle(m:RecruitMeta,story:Story):string{const t=m.title?.[story];return t&&(m.titles??[]).includes(titleKey(story,t))?TITLES[t].name:'';}
/** 칭호를 이름 앞에 붙인 주인공 이름. */
export function heroLabel(m:RecruitMeta,story:Story):string{const t=heroTitle(m,story);return t?`「${t}」 ${HERO[story]}`:HERO[story];}

/** 전투가 끝났을 때의 기록(등용 정산에 쓴다). */
export interface BattleReport {
  story:Story;stage:string;win:boolean;extreme:boolean;
  /** 쓰러진(퇴각한) 적 장수 이름 */
  fallen:readonly string[];
  /** 이 전투에 나온 적 장수 이름(쓰러지지 않은 이도) */
  enemies:readonly string[];
  /** 출진한 내 편 장수 이름 */
  party:readonly string[];
  /** 퇴각한 내 편 부대 수 */
  lost:number;
  /** 내 편·우군 장수 이름 → 남은 체력 비율(퇴각했으면 0) */
  allies:Readonly<Record<string,number>>;
}
export type NationOf=(name:string)=>Nation|undefined;
/**
 * 이긴 전투 뒤 등용 정산(공훈은 부른 쪽이 따로 더한다):
 * 꺾은 적장의 호감·명성 · 연의 합류(그 장을 이김 — 지난 승리도 셈한다) · 조건 승리 · 구출 · 인연. 알림 문구와 새로 들어온 이름을 돌려준다.
 */
export function settleBattle(m:RecruitMeta,r:BattleReport,won:(stage:string)=>boolean,nationOf:NationOf):{news:string[];joined:string[]}{
  const news:string[]=[],joined:string[]=[],st=r.story;if(!r.win)return {news,joined};
  const has=(n:string)=>recruitedOf(m,st).includes(n);
  // 명성: 꺾은 이름난 적장(나라별) + 이 전투에 나온 적 나라마다 1.
  const fame:Partial<Record<Nation,number>>={};
  for(const n of new Set(r.fallen)){const f=nationOf(n);if(f)fame[f]=(fame[f]??0)+(r.extreme?FAME.foeExtreme:FAME.foe);}
  for(const f of new Set(r.enemies.map(nationOf)))if(f)fame[f]=(fame[f]??0)+FAME.battle;
  for(const [f,v] of Object.entries(fame) as Array<[Nation,number]>)addFame(m,st,f,v);
  const fameText=(Object.entries(fame) as Array<[Nation,number]>).map(([f,v])=>`${f} +${v}`).join(' · ');
  if(fameText)news.push(`명성 ${fameText}`);
  // 격파: 꺾은 적장의 호감.
  for(const n of new Set(r.fallen)){const e=entryOf(st,n);if(!e||e.r!=='defeat'||has(n))continue;
    const v=addFavor(m,st,n,r.extreme?2:1),need=favorNeed(e);
    news.push(v>=need?`${n} 호감 ${need}/${need} — 본영 「등용」에서 받아들일 수 있다`:`${n} 호감 ${v}/${need}`);}
  const join=(n:string,why:string)=>{if(has(n))return;const t=joinRecruit(m,st,n);joined.push(n);news.push(`등용 · ${n}(${why}) — ${HERO[st]} 휘하에 들었다`,...t);};
  for(const e of ROSTER[st]){if(has(e.n))continue;
    if(e.r==='story'&&e.s&&(e.s===r.stage||won(e.s)))join(e.n,ROUTE_LABEL.story);
    else if(e.r==='feat'&&e.s===r.stage&&(e.k==='extreme'?r.extreme:r.lost===0))join(e.n,ROUTE_LABEL.feat);
    else if(e.r==='rescue'&&e.s===r.stage&&(r.allies[e.n]??0)>=.5)join(e.n,ROUTE_LABEL.rescue);
    else if(e.r==='bond'&&e.w&&r.party.includes(e.w))join(e.n,`${ROUTE_LABEL.bond} · ${e.w}`);}
  return {news,joined};
}
/** 지난 기록 따라잡기: 이미 이긴 장의 연의 합류 장수를 들인다(새 길이 생기기 전 저장). 들인 이름을 돌려준다. */
export function catchUpStory(m:RecruitMeta,story:Story,won:(stage:string)=>boolean):string[]{
  const out:string[]=[];for(const e of ROSTER[story])if(e.r==='story'&&e.s&&won(e.s)&&!recruitedOf(m,story).includes(e.n)){joinRecruit(m,story,e.n);out.push(e.n);}
  return out;
}

/** 일기토·설전에서 이긴 직후: 명성과 호감 +1. 등용을 고를 수 있는 상대(격파 길 · 아직 안 들임)면 그 항목을 돌려준다. */
export function contestWin(m:RecruitMeta,story:Story,foe:string,nationOf:NationOf):RosterEntry|undefined{
  const f=nationOf(foe);if(f)addFame(m,story,f,FAME.contest);
  const e=entryOf(story,foe);if(!e||e.r!=='defeat'||recruitedOf(m,story).includes(foe))return undefined;
  addFavor(m,story,foe,1);return e;
}
/** 「살려 보낸다」: 호감을 한 번 더 쌓는다. */
export function spareFoe(m:RecruitMeta,story:Story,foe:string):string{
  const e=entryOf(story,foe);if(!e)return '';const v=addFavor(m,story,foe,1),need=favorNeed(e);
  return `${을를(foe)} 살려 보냈다 — 호감 ${Math.min(v,need)}/${need}${v>=need?' · 이제 등용을 받아들인다':''}`;
}
/** 「등용을 권한다」: 호감이 가득 찼으면 들인다. */
export function persuadeFoe(m:RecruitMeta,story:Story,foe:string):{ok:boolean;news:string[]}{
  const e=entryOf(story,foe);if(!e)return {ok:false,news:[]};const v=favorOf(m,story,foe),need=favorNeed(e);
  if(v<need)return {ok:false,news:[`${이가(foe)} 고개를 저었다 — 호감 ${v}/${need}. 더 꺾거나 살려 보내 마음을 얻어야 한다`]};
  return {ok:true,news:[`등용 · ${foe}(격파) — ${HERO[story]} 휘하에 들었다`,...joinRecruit(m,story,foe)]};
}
/** 연의 합류 장수인가(연의 장 대결의 사기 효과를 같이 받는다). */
export function isStoryRecruit(name:string,story:Story='S'):boolean{return entryOf(story,name)?.r==='story';}
