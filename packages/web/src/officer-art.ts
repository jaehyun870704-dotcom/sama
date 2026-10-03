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
] as const;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function officerLook(name:string){return officerLooks.find(p=>p.id===name||p.name===name);}
/** Named speakers without a painted portrait show the upper body of their troop art
 * (rows of units-v3: 0 infantry, 1 spear, 2 bow, 3 horse, 4 robe, 5 siege). */
const troopFaces:Record<string,number>={'양앙':0,'성채 수비대장':0,'교관':0,'노장':0,'학자':4,'의원':4,'상인':4,'장인':4,'꿈속의 황제':4,'장소':4,'제갈근':4,'손권':4,'여몽':3,'사마사':3,'사마소':2,'맹달':0,'이엄':4,'장합':3,'곽회':0,'제갈량':4,'마속':4,'왕평':0,'위연':0};
export function troopFaceRow(name:string){
  if(name in troopFaces)return troopFaces[name]!;
  if(/창병/.test(name))return 1;if(/궁병|노병/.test(name))return 2;if(/기병|전차/.test(name))return 3;
  if(/피난민|민중|책사|사자|환영/.test(name))return 4;if(/병|대|장$/.test(name))return 0;
  return undefined;
}
export function officerPortrait(name:string){const p=officerLook(name),row=p?undefined:troopFaceRow(name);if(row!==undefined)return `<div class="officer-face troop-face" role="img" aria-label="${escape(name)} 병종 초상" style="background-position:9% ${((2*row+.62)/11*100).toFixed(2)}%"></div>`;return p?`<div class="officer-face" role="img" aria-label="${p.name} 초상" data-officer="${p.id}" style="background-position:${p.slot%4/3*100}% ${Math.floor(p.slot/4)/2*100}%"></div>`:`<div class="officer-face unknown-face" role="img" aria-label="${escape(name)} · 전용 초상 미등록"><span>${name==='꿈속의 목소리'?'夢':'言'}</span></div>`;}
export function dialogueCaption(speaker:string,line:string){const p=officerLook(speaker);return `<div class="story-caption with-officer" aria-live="polite">${officerPortrait(speaker)}<div class="dialogue-copy"><small>${p?.title??'이야기'}</small><strong>${escape(p?.name??speaker)}</strong><p>${escape(line)}</p></div></div>`;}
export function splitSpokenLine(line:string){const at=line.indexOf(':');return at>0&&at<20?{speaker:line.slice(0,at).trim(),line:line.slice(at+1).trim()}:{speaker:'해설',line};}
export function storyActorStyle(name:string,fallbackRow=0){const p=officerLook(name);return p&&p.slot<8?`background-image:var(--officer-story-atlas);background-size:400% 200%;background-position:${p.slot%4/3*100}% ${Math.floor(p.slot/4)*100}%`:`--row:${fallbackRow*20}%`;}
