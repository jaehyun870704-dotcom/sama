import {artKey} from './youth.ts';
import {displayName} from './courtesy.ts';
import {portraitImage} from './portrait-images.ts';
import {officerEntry} from './officer-models.ts';
export const officerLooks=[
 {id:'sima_yi',name:'사마의',title:'중달 · 깊은 계책',slot:0},
 {id:'sima_yi_young',name:'소년 사마의',title:'난세를 배우는 소년',slot:1},
 {id:'sima_lang',name:'사마랑',title:'백달 · 가문의 버팀목',slot:2},
 {id:'sima_fang',name:'사마방',title:'엄정한 아버지',slot:3},
 {id:'cao_zhen',name:'조진',title:'자단 · 전장의 선봉',slot:4},
 {id:'cao_cao',name:'조조',title:'맹덕 · 위의 기틀',slot:5},
 {id:'cao_pi',name:'조비',title:'자환 · 젊은 후계자',slot:6},
 {id:'xu_chu',name:'허저',title:'중강 · 굳센 호위',slot:7},
 {id:'ma_chao',name:'마초',title:'맹기 · 서량의 맹장',slot:8},
 {id:'lu_bu',name:'여포',title:'봉선 · 비장',slot:9},
 {id:'chen_gong',name:'진궁',title:'공대 · 냉철한 책사',slot:10},
 {id:'zhou_yu',name:'주유',title:'공근 · 강동의 지략',slot:11},
 // 스토리 SD·흉상만 있는 장수(옛 초상 묶음 그림 4×3칸에는 없다): 12번 이후 칸은 그 그림을 쓰지 않는다.
 {id:'sima_shi',name:'사마사',title:'자원 · 사마의의 맏아들',slot:12},
 {id:'sima_zhao',name:'사마소',title:'자상 · 사마의의 둘째 아들',slot:13},
 {id:'zhang_he',name:'장합',title:'준예 · 노련한 선봉',slot:14},
 {id:'guo_huai',name:'곽회',title:'백제 · 서방의 수문장',slot:15},
 {id:'sima_fu',name:'사마부',title:'숙달 · 사마씨의 중신',slot:16},
 {id:'zhuge_liang',name:'제갈량',title:'공명 · 촉한의 승상',slot:17},
 {id:'sun_quan',name:'손권',title:'중모 · 강동의 군주',slot:18},
 {id:'meng_da',name:'맹달',title:'자경 · 상용의 장수',slot:19},
 {id:'hu_zun',name:'호준',title:'위의 노련한 장수',slot:20},
 {id:'deng_ai',name:'등애',title:'사재 · 험로의 명장',slot:21},
 {id:'zhong_hui',name:'종회',title:'사계 · 젊은 책사',slot:22},
 {id:'yu_ji',name:'우희',title:'패왕의 곁 · 해하의 노래',slot:23},
] as const;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function officerLook(name:string){name=artKey(name);return officerLooks.find(p=>p.id===name||p.name===name);}
/** Named speakers without a painted portrait show the upper body of their troop art
 * (rows of units-v3: 0 infantry, 1 spear, 2 bow, 3 horse, 4 robe, 5 siege). */
const troopFaces:Record<string,number>={'양앙':0,'성채 수비대장':0,'교관':0,'노장':0,'학자':4,'의원':4,'상인':4,'장인':4,'꿈속의 황제':4,'장소':4,'제갈근':4,'손권':4,'여몽':3,'사마사':3,'사마소':2,'맹달':0,'이엄':4,'장합':3,'곽회':0,'제갈량':4,'마속':4,'왕평':0,'위연':0,'조상':3,'비연':3,'공손연':0,'주연':0,'제갈각':4,'강유':3,'맹염':3,'대릉':0,'고상':0,'공병':0};
export function troopFaceRow(name:string){
  if(name in troopFaces)return troopFaces[name]!;
  if(/창병/.test(name))return 1;if(/궁병|노병/.test(name))return 2;if(/기병|전차/.test(name))return 3;
  if(/피난민|민중|책사|사자|환영|백성|상인|하인|노인|학자|의원/.test(name))return 4;if(/병|대|장$|산적|도적|황건|적$|무사|장사|호위|자객/.test(name))return 0;
  return undefined;
}
/** Allegiance of the named officers drawn with a troop face, so a speaker's side reads at a glance. */
const factions:Record<string,'wei'|'shu'|'wu'|'yan'>={'사마사':'wei','사마소':'wei','장합':'wei','곽회':'wei','조상':'wei','대릉':'wei','공병':'wei','맹달':'shu','제갈량':'shu','마속':'shu','왕평':'shu','위연':'shu','강유':'shu','맹염':'shu','고상':'shu','이엄':'shu','손권':'wu','여몽':'wu','장소':'wu','제갈근':'wu','주연':'wu','제갈각':'wu','비연':'yan','공손연':'yan'};
export function factionOf(name:string){return factions[name];}
function nameHash(name:string){let h=0;for(const ch of name)h=(h*31+ch.charCodeAt(0))>>>0;return h;}
/** 신장수 초상: 이름 → 그림 주소(그때 그린다). custom.ts가 등록한다. */
const customFaces=new Map<string,()=>string>();
export function registerFace(name:string,url:()=>string){customFaces.set(name,url);}
export function clearFaces(){customFaces.clear();}
export function customFace(name:string){const img=portraitImage(name);if(img)return img;const f=customFaces.get(name);return f?f():undefined;}
export function officerPortrait(name:string){
  // 상편 앞 세 장: 사마의 초상 대신 소년 사마의 흉상의 첫 표정을 초상으로 쓴다(youth.ts).
  const youth=artKey(name);if(youth!==name&&(youth==='소년 사마의'||youth==='sima_yi_young'))return `<div class="officer-face image-face" role="img" aria-label="소년 사마의 초상" style="background-image:url('officers/sima_yi_young-bust-v1.webp');background-size:300% 100%;background-position:0 12%"></div>`;
  // 원화 id(cao_zhen)로 불러도 넣은 초상(이름 「조진」으로 저장)을 먼저 찾는다.
  const img=portraitImage(name)??portraitImage(officerLook(name)?.name??'');if(img)return `<div class="officer-face image-face" role="img" aria-label="${escape(name)} 초상" style="background-image:url('${img}');background-size:cover;background-position:50% 12%"></div>`;
  const cf=customFaces.get(name);if(cf){const url=cf();if(url)return `<div class="officer-face custom-face" role="img" aria-label="${escape(name)} 초상" style="background-image:url(${url});background-size:cover;background-position:center"></div>`;}const p=officerLook(name),atlas=!!p&&p.slot<12,row=atlas?undefined:troopFaceRow(name);if(row!==undefined){
  // A named officer without painted art: the troop face, nudged in hue per person and marked with
  // the first syllable of the name on a seal in the colour of their side.
  const f=factions[name],named=name in troopFaces&&f!==undefined,h=nameHash(name);
  const tint=named?`;filter:hue-rotate(${(h%7-3)*14}deg) saturate(${(0.85+(h%5)*0.08).toFixed(2)})`:'';
  const y=((2*row+.62)/11*100).toFixed(2);
  if(!named)return `<div class="officer-face troop-face" role="img" aria-label="${escape(name)} 병종 초상" style="background-position:9% ${y}%"></div>`;
  return `<div class="officer-face troop-face named-face faction-${f}" role="img" aria-label="${escape(name)} 병종 초상"><i class="face-img" style="background-position:9% ${y}%${tint}"></i><span class="face-mark">${escape([...name][0]!)}</span></div>`;}return atlas?`<div class="officer-face" role="img" aria-label="${p!.name} 초상" data-officer="${p!.id}" style="background-position:${p!.slot%4/3*100}% ${Math.floor(p!.slot/4)/2*100}%"></div>`:`<div class="officer-face unknown-face" role="img" aria-label="${escape(name)} · 전용 초상 미등록"><span>${name==='꿈속의 목소리'?'꿈':'말'}</span></div>`;}
function dialogueBust(name:string){const p=officerLook(name);return p&&p.slot<14?`<div class="story-caption-bust"><div class="talk-bust officer-bust" role="img" aria-label="${p.name} 흉상" style="background-image:url('officers/${p.id}-bust-v1.webp');background-size:300% 100%;background-position:0 0"></div></div>`:`<div class="story-caption-bust">${officerPortrait(name)}</div>`;}
export function dialogueCaption(speaker:string,line:string){const p=officerLook(speaker);return `<div class="story-caption with-officer" aria-live="polite">${dialogueBust(speaker)}<div class="dialogue-copy"><small>${p?.title??'이야기'}</small><strong>${escape(displayName(p?.name??speaker))}</strong><p>${escape(line)}</p></div></div>`;}
export function splitSpokenLine(line:string){const at=line.indexOf(':');return at>0&&at<20?{speaker:line.slice(0,at).trim(),line:line.slice(at+1).trim()}:{speaker:'해설',line};}
/** 이야기 전신 시트: v1은 8칸(서기~가리키기), v2는 9번째 칸(방석에 앉기)을 더한 9칸. 칸 수는 파일 판에서 읽는다. */
export function storySheetOf(name:string):{url:string;cols:8|9}|undefined{
  const p=officerLook(name);if(!p)return undefined;const file=officerEntry({id:p.id,name:p.name})?.story;if(!file)return undefined;
  return {url:`officers/${file}`,cols:/-story-v1\.webp$/.test(file)?8:9};
}
export function storyActorStyle(name:string,fallbackRow=0){const s=storySheetOf(name);return s?`--story-talk-x:${(3/(s.cols-1)*100).toFixed(4)}%;background-image:url('${s.url}');background-size:${s.cols*100}% 300%;background-position:var(--story-x,0%) var(--story-y,0%)`:`--row:${fallbackRow*20}%`;}
