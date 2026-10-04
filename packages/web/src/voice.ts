/**
 * 이야기·나레이션 한국어 더빙 — 브라우저에 든 한국어 음성 합성으로 읽는다(녹음 파일 없이).
 * 성우가 배역마다 목소리를 바꾸듯: 나레이션은 낮고 느리게, 인물은 성별·나이·성격에 따라 음높이와 빠르기를 달리하고,
 * 남녀 목소리가 둘 다 있으면 나눠 쓴다. 긴 문장은 문장 단위로 끊어 차례로 읽는다(브라우저가 긴 낭독을 자르는 것을 막는다).
 */
const KEY='sama-voice';
let enabled=(()=>{try{return localStorage.getItem(KEY)!=='off';}catch{return true;}})();
const synth=():SpeechSynthesis|undefined=>typeof window!=='undefined'&&'speechSynthesis' in window?window.speechSynthesis:undefined;

export const voiceSupported=()=>!!synth();
export const voiceOn=()=>enabled&&voiceSupported();
export function setVoice(on:boolean){enabled=on;try{localStorage.setItem(KEY,on?'on':'off');}catch{/* 저장 못 해도 이번 판은 따른다 */}if(!on)stopVoice();}

let voices:SpeechSynthesisVoice[]=[];
function loadVoices(){const s=synth();if(!s)return;voices=s.getVoices().filter(v=>/^ko/i.test(v.lang));}
if(typeof window!=='undefined'&&synth()){loadVoices();synth()!.addEventListener?.('voiceschanged',loadVoices);}
const FEMALE_VOICE=/yuna|sunhi|heami|seoyeon|jimin|female|여|google 한국/i,MALE_VOICE=/injoon|hyunsu|minsu|male|남/i;
function pick(female:boolean){
  if(!voices.length)loadVoices();if(!voices.length)return undefined;
  const want=voices.find(v=>(female?FEMALE_VOICE:MALE_VOICE).test(v.name)&&!(female?MALE_VOICE:/(?!)/).test(v.name));
  return want??voices.find(v=>v.localService)??voices[0];
}

const FEMALE=/우희|아낙|궁녀|부인|황후|태후|공주|어머니|여인|견씨|변씨|장춘화|손상향|초선|채염|채문희|시녀|며느리|누이|할머니|무녀|왕비|왕후|부녀|소녀|딸|여관|과부|유모|곽씨|장씨 부인/;
const OLD=/노인|할아버|노장|노승|사마방|황충|엄안|정봉|원로|늙은|촌로|노파/;
const YOUNG=/아이|소년|동자|사마소|사마사|아들|어린|조카|사동|심부름/;
const DEEP=/조조|여포|장비|허저|전위|마초|사마랑|조진|장합|하후|원소|동탁|관우|항우/;
interface Part {pitch:number;rate:number;female:boolean}
const hash=(s:string)=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;};
/** 배역 목소리: 나레이션·주요 인물은 정해 두고, 나머지는 이름에서 늘 같은 목소리가 나오게. */
function part(speaker:string|null):Part{
  if(!speaker)return {pitch:.82,rate:.9,female:false};
  if(speaker==='사마의')return {pitch:.9,rate:.93,female:false};
  if(speaker==='제갈량')return {pitch:.98,rate:.9,female:false};
  if(speaker==='꿈속의 목소리')return {pitch:.62,rate:.82,female:false};
  const k=(hash(speaker)%100)/100;
  if(FEMALE.test(speaker))return {pitch:1.18+k*.14,rate:.98+k*.06,female:true};
  if(YOUNG.test(speaker))return {pitch:1.12+k*.1,rate:1.02,female:false};
  if(OLD.test(speaker))return {pitch:.74+k*.06,rate:.86,female:false};
  if(DEEP.test(speaker))return {pitch:.74+k*.08,rate:.95,female:false};
  return {pitch:.84+k*.18,rate:.94+k*.08,female:false};
}
/** 읽기 좋게: 그림 글자·괄호 표시를 빼고, 줄임표·줄표는 잠깐 쉬는 쉼표로. */
function clean(text:string){
  return text.replace(/[「」『』《》〈〉"“”]/g,'').replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu,'').replace(/…+|\.{2,}/g,', ').replace(/\s*—\s*/g,', ').replace(/~/g,'').replace(/\s+/g,' ').trim();
}
let token=0;
/** 한 줄을 읽는다(앞 줄은 끊는다). 끝나면 resolve — 기다리지 않아도 된다. */
export function speak(speaker:string|null,text:string):Promise<void>{
  const s=synth();if(!enabled||!s)return Promise.resolve();
  s.cancel();const my=++token,p=part(speaker),voice=pick(p.female),body=clean(text);if(!body)return Promise.resolve();
  const chunks=body.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
  return new Promise<void>(done=>{
    try{chunks.forEach((c,i)=>{const u=new SpeechSynthesisUtterance(c);u.lang='ko-KR';try{if(voice)u.voice=voice;}catch{/* 목소리를 못 고르면 기본 한국어 목소리 */}
      u.pitch=Math.min(2,Math.max(0,p.pitch+(/[!！]$/.test(c)?.06:0)));u.rate=p.rate*(/[!！]$/.test(c)?1.04:1);u.volume=1;
      if(i===chunks.length-1){u.onend=()=>{if(my===token)done();};u.onerror=()=>done();}
      s.speak(u);});}catch{done();return;}
    // 음성이 끝내 안 나는 브라우저에서도 멈추지 않게
    setTimeout(done,Math.max(4000,body.length*260));
  });
}
export const narrate=(text:string)=>speak(null,text);
export function stopVoice(){token++;synth()?.cancel();}
