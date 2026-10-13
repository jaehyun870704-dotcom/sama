/**
 * 제갈량전 결말 — 오장원(Z2-19)을 넘은 뒤의 결말 갈래와 「내가 한 선택」 회고.
 *
 * 결말은 34장에서 고른 선택(이야기 표식 z…_…)으로 갈린다. 축은 둘이다.
 *  · 마음과 법: 같은 물음에 「사람을 믿고 살리는 답」과 「군령·위엄으로 다잡는 답」이 맞선 다섯 장
 *    (Z1-02 · Z1-04 · Z1-07 · Z2-01 · Z2-05). 마음이 둘 이상 많으면 「마음을 얻은 사람」, 법이 둘 이상 많으면
 *    「법을 세운 사람」, 그 사이면 「저울을 든 사람」.
 *  · 굳힘과 나섬: 모든 장의 선택 가운데 첫 턴 방어 태세(진을 굳힘)와 사기 상승(앞으로 나섬) 수 — 결말 덧말 한 줄.
 * 이야기 속 일기토·설전 결과(contest:<장>:<종류>:<결과>)와 모은 연의 천명은 회고에 함께 적는다.
 * 결말 id는 meta.endings에 'zhuge_heart' 꼴로 남는다(사마의전 결말 수 ALL_ENDINGS와 따로 센다).
 * 장면 대본은 scenario/zhuge-ending.ts('ending:zhuge'), 화면은 main.ts가 맡는다.
 */
import type {ChapterScript,ChoiceOption} from './scenario-types.ts';

export type ZhugeBranch='heart'|'law'|'balance';
export const ZHUGE_BRANCHES:readonly ZhugeBranch[]=['heart','law','balance'];
export const ZHUGE_ENDINGS=ZHUGE_BRANCHES.map(b=>`zhuge_${b}`);
export const zhugeEndingId=(b:ZhugeBranch)=>`zhuge_${b}`;
export const zhugeBranchOf=(id:string):ZhugeBranch|undefined=>ZHUGE_BRANCHES.find(b=>zhugeEndingId(b)===id);
/** 결말 장면의 when/unless가 읽는 표식. */
export const zhugeEndingFlag=(b:ZhugeBranch)=>`zend_${b}`;

/** 마음과 법이 맞선 장: 그 장의 두 표식과 회상 한 줄. */
export const ZHUGE_AXIS:ReadonlyArray<{stage:string;heart:string;law:string;heartLine:string;lawLine:string}>=[
  {stage:'Z1-02',heart:'z2_talk',law:'z2_stand',
    heartLine:'융중의 길목에서 그는 칼 대신 말로 도적의 두목을 돌려보냈다.',
    lawLine:'융중의 길목에서 그는 아우와 함께 칼로 길을 열었다. 길을 막는 자에게 먼저 물러설 까닭은 없었다.'},
  {stage:'Z1-04',heart:'z4_people',law:'z4_road',
    heartLine:'신야를 비우던 날, 그는 백성을 먼저 강 건너로 보내고 군사에게 뒤를 맡겼다.',
    lawLine:'신야를 비우던 날, 그는 군사가 먼저 길을 열고 백성이 그 뒤를 따르게 했다. 흐트러진 행렬은 모두를 잃는다.'},
  {stage:'Z1-07',heart:'z7_trust',law:'z7_pledge',
    heartLine:'화용도에서 그는 관우의 의리를 믿었다. 군령장은 받지 않았다.',
    lawLine:'화용도에서 그는 관우에게도 군령장을 받았다. 의형제의 정보다 군령이 먼저였다.'},
  {stage:'Z2-01',heart:'z201_heart',law:'z201_sword',
    heartLine:'남중에서 그는 사로잡은 자를 모두 풀어 주었다. 마음이 꺾이지 않은 적은 다시 온다고 믿었다.',
    lawLine:'남중에서 그는 먼저 크게 이겨 위엄을 보였다. 두려움을 안 뒤에야 은혜가 통한다고 믿었다.'},
  {stage:'Z2-05',heart:'z205_mercy',law:'z205_lure',
    heartLine:'반사곡의 불길 앞에서도 그는 골짜기 어귀에 항복할 길을 남겨 두었다.',
    lawLine:'반사곡에서 그는 위연에게 끝까지 지고 달아나라는 다짐을 받았다. 약속은 지켜졌고, 골짜기는 불탔다.'},
];

export interface ZhugeTally {heart:number;law:number;branch:ZhugeBranch;guard:number;rally:number;temper:'steady'|'bold'|'even'}
/** 이야기 표식으로 결말 갈래를 정한다. */
export function zhugeTally(flags:readonly string[],picks:readonly ZhugePick[]=[]):ZhugeTally{
  const has=new Set(flags);let heart=0,law=0;
  for(const a of ZHUGE_AXIS){if(has.has(a.heart))heart++;else if(has.has(a.law))law++;}
  const branch:ZhugeBranch=heart-law>=2?'heart':law-heart>=2?'law':'balance';
  const guard=picks.filter(p=>p.option?.lean==='guard').length,rally=picks.filter(p=>p.option?.lean==='rally').length;
  return {heart,law,branch,guard,rally,temper:guard>rally?'steady':rally>guard?'bold':'even'};
}

export type Lean='guard'|'rally'|'insight'|'contest';
export interface ZhugePick {
  id:string;title:string;year:string;art:number;place:string;
  /** 고른 선택지(기록이 없으면 없음) */
  option?:{id:string;text:string;note?:string;lean?:Lean};
  /** 그 장 이야기 속 일기토·설전 결과 */
  contest?:{kind:'duel'|'debate';by:string;foe:string;result:'win'|'lose'|'draw'};
}
const CONTEST=/^contest:(Z[12]-\d\d):(duel|debate):(win|lose|draw)$/;
const leanOf=(o:ChoiceOption):Lean|undefined=>{const e=o.effects??[];
  return e.some(x=>x.kind==='duel'||x.kind==='debate')?'contest':e.some(x=>x.kind==='guard')?'guard':e.some(x=>x.kind==='rally')?'rally':e.some(x=>x.kind==='insight')?'insight':undefined;};
/**
 * 「내가 한 선택」: 장마다 고른 선택지와 대결 결과. 선택지는 그 선택이 세운 표식으로, 표식이 없는 대결 선택지는
 * 그 장의 대결 결과 표식으로 찾는다.
 */
export function zhugeChoiceLog(ids:readonly string[],script:(id:string)=>ChapterScript|undefined,flags:readonly string[]):ZhugePick[]{
  const has=new Set(flags),contests=new Map<string,{kind:'duel'|'debate';result:'win'|'lose'|'draw'}>();
  for(const f of flags){const m=CONTEST.exec(f);if(m)contests.set(m[1]!,{kind:m[2] as 'duel'|'debate',result:m[3] as 'win'|'lose'|'draw'});}
  return ids.map(id=>{const sc=script(id),first=sc?.scenes[0];
    const base:ZhugePick={id,title:sc?.title??id,year:sc?.year??'',art:first?.art??14,place:first?.place??''};
    const step=sc?[...sc.scenes,...(sc.after??[])].flatMap(s=>s.steps).find(st=>'choice' in st):undefined;
    const options=step&&'choice' in step?step.options:[],c=contests.get(id);
    const flagOf=(o:ChoiceOption)=>o.effects?.find(e=>e.kind==='flag');
    let picked=options.find(o=>{const f=flagOf(o);return f&&f.kind==='flag'&&has.has(f.flag);});
    if(!picked&&c)picked=options.find(o=>!flagOf(o)&&o.effects?.some(e=>e.kind===c.kind));
    const ce=c?options.flatMap(o=>o.effects??[]).find(e=>e.kind===c.kind):undefined;
    return {...base,...(picked?{option:{id:picked.id,text:picked.text,...(picked.note?{note:picked.note}:{}),...(leanOf(picked)?{lean:leanOf(picked)!}:{})}}:{}),
      ...(c&&ce&&(ce.kind==='duel'||ce.kind==='debate')?{contest:{kind:c.kind,by:ce.by??'제갈량',foe:ce.foe,result:c.result}}:{})};
  });
}

/** 결말 글: 제목 · 후일담(종막) · 맺음(에필로그 끝). */
export const ZHUGE_ENDING_TEXT:Readonly<Record<ZhugeBranch,{title:string;path:string;lines:readonly string[];closing:readonly string[]}>>={
  heart:{title:'마음을 얻은 사람',path:'마음의 길',
    lines:['승상은 사로잡은 적을 놓아 주고, 백성을 먼저 건네고, 사람의 의리를 믿었다. 그가 얻은 것은 땅보다 사람의 마음이었다.',
      '그가 떠난 뒤로도 남중은 오래 잠잠했고, 촉의 백성은 해마다 길가에 제단을 쌓아 그를 기렸다.',
      '나라는 끝내 북쪽을 되찾지 못했으나, 사람들은 그를 이긴 사람보다 믿을 수 있는 사람으로 기억했다.'],
    closing:['그는 칼보다 사람을 먼저 셈했다. 그 셈은 전장에서는 늦었고, 세월 앞에서는 옳았다.']},
  law:{title:'법을 세운 사람',path:'법의 길',
    lines:['승상은 군령장을 받고, 기세로 적을 누르고, 약속을 어긴 자에게 법을 물었다. 그의 군은 물러날 때조차 흐트러지지 않았다.',
      '그가 남긴 법과 장부는 장완과 비의의 손에서 스무 해 가까이 작은 나라를 버티게 했다.',
      '벌을 받은 이들조차 그 법이 고르다는 것을 알았다. 엄한 사람이었으나, 사사로운 사람은 아니었다.'],
    closing:['그는 자기 자신에게 가장 엄했다. 법은 그가 떠난 뒤에도 그의 자리를 지켰다.']},
  balance:{title:'저울을 든 사람',path:'저울의 길',
    lines:['승상은 어떤 날은 사람을 믿었고, 어떤 날은 법을 세웠다. 한쪽으로 기울지 않으려고 평생 저울을 들고 있었다.',
      '촉은 작은 나라였으나, 그가 있는 동안 안에서부터 무너지지는 않았다.',
      '사람들은 그를 두고, 다스림은 엄했으나 원망하는 이가 없었다고 말했다.'],
    closing:['마음과 법은 저울의 두 접시였다. 그는 그 저울을 내려놓지 않은 채 눈을 감았다.']},
};
/** 굳힘과 나섬 — 결말 덧말 한 줄. */
export const ZHUGE_TEMPER_NOTE:Readonly<Record<ZhugeTally['temper'],string>>={
  steady:'그는 늘 진을 먼저 굳혔다. 서두르지 않는 군은 크게 지지 않는다고 믿었다.',
  bold:'그는 망설이는 날보다 앞으로 나서는 날이 많았다. 기세가 꺾이면 작은 나라는 버티지 못한다고 믿었다.',
  even:'그는 굳힐 때와 나설 때를 가렸다. 같은 수를 두 번 쓰지 않았다.',
};
/** 종막 덧말: 굳힘·나섬 한 줄 + 대결 전적 + 오장원의 마지막 선택. */
export function zhugeEndingNotes(t:ZhugeTally,picks:readonly ZhugePick[],flags:readonly string[]):string[]{
  const cs=picks.flatMap(p=>p.contest?[p.contest]:[]),won=cs.filter(c=>c.result==='win').length;
  return [ZHUGE_TEMPER_NOTE[t.temper],
    ...(cs.length?[`이야기 속 일기토와 설전 ${cs.length}번 가운데 ${won}번을 이겼다.${won*2>=cs.length?' 말과 칼이 모두 그의 편이었다.':' 진 날의 일도 그는 장부에 적어 두었다.'}`]:[]),
    ...(flags.includes('z219_banner')?['오장원을 떠나던 날, 강유는 승상의 깃발을 다시 세웠다. 그 북소리는 오래 위수 가에 남았다.']:flags.includes('z219_quiet')?['오장원을 떠나던 날, 촉군은 숨을 죽였고 나무 승상만이 말없이 사마의를 돌려세웠다.']:[])];
}
/** 에필로그 회상: 마음과 법이 맞선 장에서 고른 쪽. 고르지 않은 장은 빼고, 이 장의 무대를 쓴다. */
export function zhugeAxisBeats(picks:readonly ZhugePick[],flags:readonly string[]){
  const has=new Set(flags);
  return ZHUGE_AXIS.flatMap(a=>{const p=picks.find(x=>x.id===a.stage);const heart=has.has(a.heart),law=!heart&&has.has(a.law);
    if(!p||(!heart&&!law))return [];
    return [{when:p.year.split('·')[0]!.trim(),name:p.title,art:p.art,place:p.place,line:heart?a.heartLine:a.lawLine,kept:heart}];});
}
/** 에필로그 연표: 큰 별이 진 뒤 촉이 걸어간 길(정사). */
export const ZHUGE_YEARS:ReadonlyArray<{year:string;line:string;art:number;place:string}>=[
  {year:'234년 가을',line:'위연과 양의가 서로를 역적이라 부르는 표문을 올린다. 위연은 남곡 어귀에서 길을 끊었으나 군사가 흩어지고, 마대의 칼에 쓰러진다.',art:11,place:'남곡 어귀 · 잔도'},
  {year:'235년',line:'장완이 승상의 뒤를 이어 나라를 맡는다. 자리를 탐하던 양의는 원망을 늘어놓다 벼슬을 잃는다.',art:5,place:'성도 · 승상부'},
  {year:'246년',line:'장완이 병으로 세상을 떠나고 비의가 그 뒤를 잇는다. 둘은 승상의 장부를 그대로 펴고 나라를 지켰다.',art:12,place:'성도 · 서재'},
  {year:'253년',line:'비의가 새해 잔치에서 위의 항장의 칼에 쓰러진다. 그해부터 강유가 다시 북쪽으로 군을 이끈다.',art:14,place:'한수 · 잔치의 군막'},
  {year:'263년',line:'등애가 음평의 험한 길을 넘는다. 승상의 아들 제갈첨과 손자 제갈상이 면죽에서 싸우다 죽고, 유선이 성문을 연다.',art:4,place:'면죽 · 성 밖 들판'},
  {year:'264년',line:'강유는 항복한 뒤에도 나라를 되살리려 했으나 성도의 난리 속에 쓰러진다. 승상이 간 길을 끝까지 걸은 마지막 사람이었다.',art:16,place:'성도 · 무너진 진영'},
];
