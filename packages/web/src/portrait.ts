/**
 * 신장수 초상 — 얼굴형·피부·눈매·눈썹·입·수염·머리·관모·옷·갑옷·소품·배경을 골라 그리는 흉상 초상.
 * 그림은 고르는 값(PortraitSpec)만 저장하고, 화면에 낼 때 캔버스로 그려 data URL로 쓴다(같은 값은 한 번만 그림).
 * 연의 인물 초상처럼 먹선 테두리·볕 드는 쪽 밝은 칠·그늘 진 쪽 어두운 칠로 그리고, 마지막에 고운 결을 얹는다.
 */
import type {UnitClass} from '../../core/src/index.ts';
import type {Temper} from './duel.ts';

export const PORTRAIT_PARTS={
  face:['갸름한','긴','각진','둥근'],
  skin:['밝은','보통','볕에 그은','짙은'],
  eyes:['날카로운','차분한','부리부리한','가는','부드러운'],
  brows:['굵은','가는','치켜올린','찌푸린'],
  mouth:['다문','엷은 미소','굳게 다문','웃는'],
  beard:['없음','콧수염','턱수염','구레나룻','긴 수염'],
  hair:['검은','갈색','희끗한','흰'],
  hat:['상투','관','투구','두건','윤건','여인 쪽머리','풀어 내린 머리'],
  robe:['남','적','청록','흑','자','황토','백'],
  armor:['없음','비늘 갑옷','가죽 갑옷','금빛 갑옷'],
  item:['없음','부채','검','창','두루마리','활'],
  bg:['석양','먹빛','푸른 밤','녹음','붉은 군막'],
} as const;
export type PortraitPart=keyof typeof PORTRAIT_PARTS;
export type PortraitSpec=Record<PortraitPart,number>;
export const PORTRAIT_KEYS=Object.keys(PORTRAIT_PARTS) as PortraitPart[];

/** 저장된 초상 값 정리(범위 밖은 0). */
export function readPortrait(raw:unknown):PortraitSpec|undefined{
  if(!raw||typeof raw!=='object')return undefined;const r=raw as Record<string,unknown>,out={} as PortraitSpec;
  for(const k of PORTRAIT_KEYS){const v=r[k],n=PORTRAIT_PARTS[k].length;out[k]=Number.isInteger(v)&&(v as number)>=0&&(v as number)<n?v as number:0;}
  return out;
}
const hashName=(s:string)=>{let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;};
const MARTIAL=new Set(['infantry','spearman','cavalry','heavyCav','horseArcher','bandit','javelin','archer','crossbow','slinger','assassin']);
/** 이름·병종·성격으로 어울리는 초상을 지어 준다(무작위의 씨앗은 이름). */
export function suggestPortrait(name:string,unitClass:UnitClass|string,temper:Temper|string,salt=0):PortraitSpec{
  let h=hashName(name+'#'+salt);const pick=(n:number)=>{h=Math.imul(h^(h>>>15),2246822519)>>>0;return h%n;};
  const martial=MARTIAL.has(unitClass),mage=['taoist','fengshui','monk'].includes(String(unitClass));
  const s:PortraitSpec={face:pick(4),skin:martial?1+pick(3):pick(3),eyes:pick(5),brows:pick(4),mouth:pick(4),beard:pick(5),hair:pick(10)<8?0:1+pick(3),
    hat:martial?(pick(3)?2:3):mage?4:pick(2)?1:4,robe:pick(7),armor:martial?1+pick(3):0,item:0,bg:pick(5)};
  if(temper==='reckless'||temper==='brave'){s.eyes=2;s.brows=pick(2)?0:3;s.mouth=2;}
  if(temper==='wise'||temper==='calm'){s.eyes=1;s.brows=1;s.mouth=1;}
  if(temper==='proud'){s.eyes=0;s.brows=2;}
  if(temper==='timid'){s.eyes=4;s.brows=1;s.mouth=0;}
  s.item=unitClass==='strategist'||unitClass==='fengshui'?1+pick(2)*3:['archer','crossbow','horseArcher','slinger'].includes(String(unitClass))?5:['spearman','javelin'].includes(String(unitClass))?3:martial?2:pick(2)?4:0;
  return s;
}

// ─────────────────────────────────────────────── 그리기
const SKIN:Array<[string,string,string]>=[['#f4dcc0','#d9b394','#b88c6c'],['#ecc9a4','#cfa47c','#a87a56'],['#d8a878','#b88456','#8e603a'],['#b07a50','#8e5c36','#6a4024']];
const HAIR:Array<[string,string]>=[['#1e1a18','#3a332e'],['#4a2e1c','#6e4a30'],['#4a4642','#8e8a84'],['#cfcac0','#f2eee6']];
const ROBE:Array<[string,string]>=[['#24407a','#162a52'],['#8a2418','#5e140c'],['#2a6a62','#184640'],['#2a2a30','#141418'],['#5a2a72','#3a184e'],['#a07a3a','#6e5224'],['#e6e0d0','#b8b0a0']];
const BG:Array<[string,string]>=[['#e8a860','#7a3a20'],['#5a5a5a','#1a1a1c'],['#2a3a6a','#0e1428'],['#4a7a4a','#1a301c'],['#8a2a1a','#2a0a06']];
type G=CanvasRenderingContext2D;
const S=192,CX=96;
function grad(g:G,x0:number,y0:number,x1:number,y1:number,stops:Array<[number,string]>){const gr=g.createLinearGradient(x0,y0,x1,y1);for(const [o,c] of stops)gr.addColorStop(o,c);return gr;}
function ink(g:G,w=2){g.strokeStyle='#1a120c';g.lineWidth=w;g.lineJoin='round';g.lineCap='round';}
function path(g:G,pts:Array<[number,number]>,close=true){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath();}

function background(g:G,s:PortraitSpec){
  const [a,b]=BG[s.bg]!;const r=g.createRadialGradient(CX,70,10,CX,90,140);r.addColorStop(0,a);r.addColorStop(1,b);g.fillStyle=r;g.fillRect(0,0,S,S);
  // 먼 산(먹빛 실루엣)과 흩날리는 먹점
  g.fillStyle='rgba(10,8,6,.22)';g.beginPath();g.moveTo(0,130);g.quadraticCurveTo(30,92,58,116);g.quadraticCurveTo(80,84,110,112);g.quadraticCurveTo(150,78,192,118);g.lineTo(192,192);g.lineTo(0,192);g.fill();
  g.fillStyle='rgba(10,8,6,.14)';g.beginPath();g.moveTo(0,150);g.quadraticCurveTo(50,118,96,142);g.quadraticCurveTo(140,120,192,146);g.lineTo(192,192);g.lineTo(0,192);g.fill();
}
function hairBack(g:G,s:PortraitSpec,face:{rx:number;ry:number;cy:number}){
  const [d]=HAIR[s.hair]!;g.fillStyle=d!;
  if(s.hat===6||s.hat===5){ink(g,2);g.beginPath();g.moveTo(CX-face.rx-6,face.cy-14);g.quadraticCurveTo(CX-face.rx-16,face.cy+50,CX-face.rx+2,face.cy+80);g.lineTo(CX+face.rx-2,face.cy+80);g.quadraticCurveTo(CX+face.rx+16,face.cy+50,CX+face.rx+6,face.cy-14);g.closePath();g.fill();g.stroke();}
}
function body(g:G,s:PortraitSpec){
  const [c,d]=ROBE[s.robe]!;
  // 어깨와 옷: 볕은 왼쪽 위에서
  g.fillStyle=grad(g,20,130,172,192,[[0,c!],[1,d!]]);ink(g,2.4);
  path(g,[[0,192],[6,168],[22,146],[56,132],[80,126],[112,126],[136,132],[170,146],[186,168],[192,192]]);g.fill();g.stroke();
  // 옷깃(왼쪽이 위로 여민 교령), 흰 속깃
  g.fillStyle='#efe8d8';path(g,[[80,126],[96,148],[112,126],[106,124],[96,138],[86,124]]);g.fill();
  g.fillStyle=grad(g,70,126,130,192,[[0,c!],[1,d!]]);ink(g,2);path(g,[[76,126],[90,124],[124,192],[104,192]]);g.fill();g.stroke();
  path(g,[[116,126],[102,124],[84,170],[94,170]]);g.fill();g.stroke();
  // 옷깃 테두리(금실)
  g.strokeStyle='rgba(230,190,90,.85)';g.lineWidth=2;g.beginPath();g.moveTo(80,128);g.lineTo(112,192);g.moveTo(112,128);g.lineTo(90,170);g.stroke();
  // 주름
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1.5;for(const [x0,y0,x1,y1] of [[34,150,28,192],[48,142,52,192],[150,148,160,192],[138,140,140,192]] as const){g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo((x0+x1)/2+4,(y0+y1)/2,x1,y1);g.stroke();}
  if(s.armor){
    const plate:[string,string]=s.armor===3?['#e0b850','#9a7420']:s.armor===2?['#8a5a34','#5a3a1e']:['#8a929e','#4a505c'];
    // 어깨받이와 가슴 비늘
    for(const side of [-1,1]){g.fillStyle=grad(g,CX+side*40,134,CX+side*90,170,[[0,plate[0]!],[1,plate[1]!]]);ink(g,2);
      g.beginPath();g.moveTo(CX+side*36,134);g.quadraticCurveTo(CX+side*82,128,CX+side*92,160);g.lineTo(CX+side*62,168);g.quadraticCurveTo(CX+side*52,150,CX+side*36,146);g.closePath();g.fill();g.stroke();
      for(let k=0;k<3;k++){g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.2;g.beginPath();g.moveTo(CX+side*(42+k*4),144+k*7);g.quadraticCurveTo(CX+side*(70+k*3),138+k*7,CX+side*(86-k),158+k*3);g.stroke();}}
    g.fillStyle=plate[1];ink(g,2);path(g,[[CX-30,146],[CX+30,146],[CX+34,192],[CX-34,192]]);g.fill();g.stroke();
    for(let row=0;row<5;row++)for(let k=-3;k<=3;k++){const x=CX+k*9+(row%2)*4.5,y=150+row*8;if(Math.abs(x-CX)>29+row)continue;g.fillStyle=(row+k)%2?plate[0]!:plate[1]!;g.beginPath();g.arc(x,y,4.6,0,Math.PI);g.fill();g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1;g.stroke();}
    g.fillStyle='#8a1f1a';g.fillRect(CX-34,184,68,7);g.fillStyle='#e0b850';g.beginPath();g.arc(CX,187,4.5,0,7);g.fill();
  }
}
function faceShape(g:G,s:PortraitSpec){
  const f=[{rx:29,ry:38,jaw:0.62},{rx:26,ry:42,jaw:0.58},{rx:31,ry:37,jaw:0.86},{rx:32,ry:35,jaw:0.74}][s.face]!,cy=86;
  return {...f,cy};
}
function head(g:G,s:PortraitSpec,f:ReturnType<typeof faceShape>){
  const [lt,md,dk]=SKIN[s.skin]!;
  // 목
  g.fillStyle=grad(g,CX-14,110,CX+14,130,[[0,md!],[1,dk!]]);ink(g,2);path(g,[[CX-13,108],[CX+13,108],[CX+15,130],[CX-15,130]]);g.fill();g.stroke();
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(CX-13,112,26,6);
  // 귀
  for(const side of [-1,1]){g.fillStyle=md!;ink(g,1.8);g.beginPath();g.ellipse(CX+side*(f.rx+1),f.cy+2,6,10,0,0,7);g.fill();g.stroke();g.strokeStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(CX+side*(f.rx+1),f.cy+2,3,side<0?-1.2:1.9,side<0?1.2:4.3);g.stroke();}
  // 얼굴: 위는 둥글고 아래로 턱선
  const top=f.cy-f.ry,bot=f.cy+f.ry,jw=f.rx*f.jaw;
  g.fillStyle=grad(g,CX-f.rx,top,CX+f.rx,bot,[[0,lt!],[0.55,md!],[1,dk!]]);ink(g,2.2);
  g.beginPath();g.moveTo(CX-f.rx,f.cy-4);g.bezierCurveTo(CX-f.rx,top-6,CX+f.rx,top-6,CX+f.rx,f.cy-4);
  g.bezierCurveTo(CX+f.rx,f.cy+f.ry*0.45,CX+jw,bot-6,CX,bot);g.bezierCurveTo(CX-jw,bot-6,CX-f.rx,f.cy+f.ry*0.45,CX-f.rx,f.cy-4);g.closePath();g.fill();g.stroke();
  // 볼의 그늘(오른쪽)과 홍조
  g.fillStyle='rgba(60,30,10,.12)';g.beginPath();g.ellipse(CX+f.rx*0.62,f.cy+12,f.rx*0.35,f.ry*0.45,0,0,7);g.fill();
  g.fillStyle='rgba(200,80,60,.10)';for(const side of [-1,1]){g.beginPath();g.ellipse(CX+side*f.rx*0.5,f.cy+14,7,4,0,0,7);g.fill();}
}
function features(g:G,s:PortraitSpec,f:ReturnType<typeof faceShape>){
  const ey=f.cy+2,ex=13;
  // 눈썹
  ink(g,s.brows===0?4.2:s.brows===1?2:3.2);g.strokeStyle=HAIR[s.hair]![0]!;
  for(const side of [-1,1]){const x0=CX+side*6,x1=CX+side*(ex+10),lift=s.brows===2?6:s.brows===3?-2:2,inner=s.brows===3?4:0;
    g.beginPath();g.moveTo(x0,ey-10+inner);g.quadraticCurveTo(CX+side*(ex+2),ey-14-lift,x1,ey-11-(s.brows===2?4:0));g.stroke();}
  // 눈
  for(const side of [-1,1]){const x=CX+side*ex;
    const w=s.eyes===2?8:s.eyes===3?7:s.eyes===4?7.5:7.5,h=s.eyes===2?4.6:s.eyes===3?2:s.eyes===1?2.8:s.eyes===4?3.8:3.2,tilt=s.eyes===0?side*-0.18:s.eyes===3?side*-0.1:0;
    g.save();g.translate(x,ey);g.rotate(tilt);
    g.fillStyle='#f4efe6';g.beginPath();g.ellipse(0,0,w,h,0,0,7);g.fill();
    g.fillStyle='#2a1a10';g.beginPath();g.arc(side*0.5,0.3,Math.min(h+0.4,3.6),0,7);g.fill();g.fillStyle='#fff';g.fillRect(side*0.5-1,-1.4,1.6,1.6);
    ink(g,s.eyes===2?2.8:2.2);g.beginPath();g.ellipse(0,0,w,h,0,Math.PI*1.02,Math.PI*1.98);g.stroke();
    if(s.eyes===1){g.fillStyle=SKIN[s.skin]![1]!;g.fillRect(-w,-h-1,w*2,h*0.9);g.strokeStyle='#1a120c';g.lineWidth=2;g.beginPath();g.moveTo(-w,-h*0.2);g.lineTo(w,-h*0.2);g.stroke();}
    g.strokeStyle='rgba(60,30,10,.35)';g.lineWidth=1;g.beginPath();g.ellipse(0,1,w,h+1.5,0,Math.PI*0.15,Math.PI*0.85);g.stroke();
    g.restore();}
  // 코(콧등 볕)
  g.strokeStyle='rgba(255,240,220,.45)';g.lineWidth=2;g.beginPath();g.moveTo(CX-2,ey-2);g.lineTo(CX-2,ey+12);g.stroke();
  g.strokeStyle='rgba(60,30,10,.55)';g.lineWidth=1.6;g.beginPath();g.moveTo(CX+1,ey+2);g.quadraticCurveTo(CX+5,ey+14,CX+1,ey+17);g.stroke();
  g.fillStyle='rgba(60,30,10,.35)';g.beginPath();g.ellipse(CX-3,ey+17,2,1.2,0,0,7);g.ellipse(CX+4,ey+17,2,1.2,0,0,7);g.fill();
  // 입
  const my=ey+26;ink(g,2);
  if(s.mouth===0){g.beginPath();g.moveTo(CX-8,my);g.quadraticCurveTo(CX,my+1,CX+8,my);g.stroke();}
  if(s.mouth===1){g.beginPath();g.moveTo(CX-8,my);g.quadraticCurveTo(CX,my+4,CX+9,my-2);g.stroke();}
  if(s.mouth===2){g.lineWidth=2.6;g.beginPath();g.moveTo(CX-9,my+1);g.quadraticCurveTo(CX,my-2,CX+9,my+1);g.stroke();}
  if(s.mouth===3){g.fillStyle='#7a2a20';g.beginPath();g.moveTo(CX-9,my-1);g.quadraticCurveTo(CX,my+9,CX+9,my-1);g.closePath();g.fill();g.stroke();g.fillStyle='#f4efe6';g.fillRect(CX-6,my-1,12,2);}
  g.fillStyle='rgba(200,90,70,.25)';g.beginPath();g.ellipse(CX,my+5,5,2,0,0,7);g.fill();
}
function facialHair(g:G,s:PortraitSpec,f:ReturnType<typeof faceShape>){
  if(!s.beard||s.hat===5)return;const [d,l]=HAIR[s.hair]!,my=f.cy+28,bot=f.cy+f.ry;
  g.fillStyle=d!;ink(g,1.6);
  if(s.beard>=1){for(const side of [-1,1]){g.beginPath();g.moveTo(CX+side*2,my-6);g.quadraticCurveTo(CX+side*10,my-8,CX+side*14,my-1);g.quadraticCurveTo(CX+side*10,my-4,CX+side*2,my-3);g.closePath();g.fill();}}
  if(s.beard===2||s.beard===4){const len=s.beard===4?52:14;g.beginPath();g.moveTo(CX-8,bot-6);g.quadraticCurveTo(CX-10,bot+len*0.6,CX-2,bot+len);g.lineTo(CX+2,bot+len);g.quadraticCurveTo(CX+10,bot+len*0.6,CX+8,bot-6);g.closePath();g.fill();g.stroke();
    g.strokeStyle=l!;g.lineWidth=1;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(CX+k*2.5,bot);g.quadraticCurveTo(CX+k*3,bot+len*0.5,CX+k*1.5,bot+len-3);g.stroke();}}
  if(s.beard===3){ink(g,1.6);g.beginPath();g.moveTo(CX-f.rx+2,f.cy+4);g.quadraticCurveTo(CX-f.rx+4,bot-4,CX,bot+6);g.quadraticCurveTo(CX+f.rx-4,bot-4,CX+f.rx-2,f.cy+4);g.lineTo(CX+f.rx-8,f.cy+10);g.quadraticCurveTo(CX+12,bot-6,CX,bot-4);g.quadraticCurveTo(CX-12,bot-6,CX-f.rx+8,f.cy+10);g.closePath();g.fill();g.stroke();}
}
function hairFront(g:G,s:PortraitSpec,f:ReturnType<typeof faceShape>){
  const [d,l]=HAIR[s.hair]!,top=f.cy-f.ry;
  g.fillStyle='rgba(40,20,8,.22)';g.beginPath();g.ellipse(CX,top+20,f.rx*0.8,7,0,0,7);g.fill();
  g.fillStyle=grad(g,CX-f.rx,top-8,CX+f.rx,f.cy-10,[[0,l!],[0.4,d!],[1,d!]]);ink(g,2);
  g.beginPath();g.moveTo(CX-f.rx-2,f.cy);g.bezierCurveTo(CX-f.rx-4,top-10,CX+f.rx+4,top-10,CX+f.rx+2,f.cy);
  g.quadraticCurveTo(CX+f.rx-4,f.cy-20,CX+f.rx*0.3,top+10);g.quadraticCurveTo(CX,top+16,CX-f.rx*0.3,top+10);g.quadraticCurveTo(CX-f.rx+4,f.cy-20,CX-f.rx-2,f.cy);g.closePath();g.fill();g.stroke();
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1.5;g.beginPath();g.moveTo(CX-f.rx*0.6,top+2);g.quadraticCurveTo(CX-6,top-4,CX+f.rx*0.3,top);g.stroke();
}
function headwear(g:G,s:PortraitSpec,f:ReturnType<typeof faceShape>){
  const top=f.cy-f.ry,[d]=HAIR[s.hair]!;
  if(s.hat===0){// 상투: 머리 위 둥근 매듭과 비녀
    g.fillStyle=d!;ink(g,2);g.beginPath();g.ellipse(CX,top-10,11,10,0,0,7);g.fill();g.stroke();g.fillStyle='#8a1f1a';g.fillRect(CX-11,top-3,22,4);g.strokeStyle='#d8b04a';g.lineWidth=2.4;g.beginPath();g.moveTo(CX-20,top-8);g.lineTo(CX+20,top-14);g.stroke();}
  if(s.hat===1){// 관: 검은 칠관, 앞이 낮고 뒤가 높은 양관과 비녀
    g.fillStyle='#16130f';ink(g,2);path(g,[[CX-24,top+6],[CX-20,top-20],[CX-6,top-34],[CX+18,top-30],[CX+24,top+6]]);g.fill();g.stroke();
    g.strokeStyle='rgba(200,170,90,.7)';g.lineWidth=1.4;for(let k=0;k<3;k++){g.beginPath();g.moveTo(CX-16+k*10,top+4);g.lineTo(CX-10+k*10,top-26);g.stroke();}
    g.strokeStyle='#d8b04a';g.lineWidth=2.6;g.beginPath();g.moveTo(CX-34,top-6);g.lineTo(CX+34,top-12);g.stroke();g.fillStyle='#d8b04a';g.beginPath();g.arc(CX+34,top-12,3,0,7);g.fill();
    g.fillStyle='#16130f';g.fillRect(CX-26,top+2,52,6);}
  if(s.hat===2){// 투구: 철 투구, 이마 가리개, 볼 가리개, 붉은 술
    const met:[string,string]=s.armor===3?['#e0b850','#8a6a1e']:['#9aa2ae','#4a505c'];
    g.fillStyle=grad(g,CX-30,top-20,CX+30,top+20,[[0,met[0]!],[1,met[1]!]]);ink(g,2.2);
    g.beginPath();g.moveTo(CX-f.rx-6,f.cy-2);g.bezierCurveTo(CX-f.rx-8,top-28,CX+f.rx+8,top-28,CX+f.rx+6,f.cy-2);g.lineTo(CX+f.rx-2,f.cy-12);g.quadraticCurveTo(CX,top+6,CX-f.rx+2,f.cy-12);g.closePath();g.fill();g.stroke();
    for(const side of [-1,1]){g.beginPath();g.moveTo(CX+side*(f.rx+6),f.cy-2);g.lineTo(CX+side*(f.rx+8),f.cy+22);g.lineTo(CX+side*(f.rx-2),f.cy+26);g.lineTo(CX+side*(f.rx-2),f.cy-8);g.closePath();g.fill();g.stroke();}
    g.fillStyle='#d8b04a';path(g,[[CX-8,top-2],[CX,top-14],[CX+8,top-2],[CX,top+2]]);g.fill();g.stroke();
    g.fillStyle='#b8261a';g.beginPath();g.moveTo(CX,top-22);g.quadraticCurveTo(CX-14,top-32,CX-8,top-40);g.quadraticCurveTo(CX+2,top-32,CX+9,top-39);g.quadraticCurveTo(CX+12,top-30,CX,top-22);g.fill();ink(g,1.4);g.stroke();
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;g.beginPath();g.arc(CX-10,top-4,18,3.6,4.6);g.stroke();}
  if(s.hat===3){// 두건: 이마에 묶은 천과 옆으로 날리는 끈
    g.fillStyle=ROBE[s.robe]![0]!;ink(g,2);g.beginPath();g.moveTo(CX-f.rx-3,f.cy-12);g.bezierCurveTo(CX-f.rx,top-14,CX+f.rx,top-14,CX+f.rx+3,f.cy-12);g.lineTo(CX+f.rx+2,f.cy-20);g.quadraticCurveTo(CX,top+4,CX-f.rx-2,f.cy-20);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(CX+f.rx,f.cy-16);g.quadraticCurveTo(CX+f.rx+22,f.cy-10,CX+f.rx+18,f.cy+16);g.lineTo(CX+f.rx+12,f.cy+12);g.quadraticCurveTo(CX+f.rx+14,f.cy-4,CX+f.rx-2,f.cy-10);g.closePath();g.fill();g.stroke();}
  if(s.hat===4){// 윤건: 푸른 비단 두건, 뒤로 늘어진 두 자락
    g.fillStyle='#2a4a6a';ink(g,2);g.beginPath();g.moveTo(CX-f.rx-2,f.cy-10);g.bezierCurveTo(CX-f.rx-6,top-30,CX+f.rx+6,top-30,CX+f.rx+2,f.cy-10);g.quadraticCurveTo(CX,top+2,CX-f.rx-2,f.cy-10);g.closePath();g.fill();g.stroke();
    g.strokeStyle='rgba(180,210,240,.5)';g.lineWidth=1.4;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(CX+k*8,top-16);g.quadraticCurveTo(CX+k*9,top-4,CX+k*10,top+4);g.stroke();}
    g.fillStyle='#2a4a6a';ink(g,1.6);for(const side of [-1,1]){g.beginPath();g.moveTo(CX+side*(f.rx-2),f.cy-12);g.quadraticCurveTo(CX+side*(f.rx+18),f.cy+20,CX+side*(f.rx+10),f.cy+48);g.lineTo(CX+side*(f.rx+2),f.cy+44);g.quadraticCurveTo(CX+side*(f.rx+8),f.cy+16,CX+side*(f.rx-8),f.cy-8);g.closePath();g.fill();g.stroke();}}
  if(s.hat===5){// 여인 쪽머리: 높이 올린 머리, 비녀와 꽃
    g.fillStyle=d!;ink(g,2);g.beginPath();g.ellipse(CX,top-14,20,14,0,0,7);g.fill();g.stroke();g.beginPath();g.ellipse(CX-16,top-4,10,9,0,0,7);g.fill();g.stroke();
    g.strokeStyle='#d8b04a';g.lineWidth=2.4;g.beginPath();g.moveTo(CX-8,top-24);g.lineTo(CX+30,top-30);g.stroke();for(const [x,y,c] of [[CX+30,top-30,'#d8b04a'],[CX+12,top-22,'#d84a6a'],[CX+18,top-18,'#f2d24a']] as const){g.fillStyle=c;g.beginPath();g.arc(x,y,3.4,0,7);g.fill();}
    g.strokeStyle='rgba(216,74,106,.8)';g.lineWidth=1.4;g.beginPath();g.moveTo(CX+30,top-28);g.lineTo(CX+34,top-12);g.moveTo(CX+30,top-28);g.lineTo(CX+28,top-10);g.stroke();}
}
function heldItem(g:G,s:PortraitSpec){
  if(!s.item)return;
  if(s.item===1){// 깃털 부채
    g.save();g.translate(150,150);g.rotate(-0.4);g.fillStyle='#f4f0e6';ink(g,1.6);g.beginPath();g.moveTo(0,0);for(let k=0;k<=8;k++){const a=-Math.PI*0.85+k*0.2;g.quadraticCurveTo(Math.cos(a-0.1)*44,Math.sin(a-0.1)*44,Math.cos(a)*40,Math.sin(a)*40);}g.closePath();g.fill();g.stroke();
    g.strokeStyle='rgba(120,110,90,.5)';g.lineWidth=1;for(let k=0;k<8;k++){const a=-Math.PI*0.8+k*0.2;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*36,Math.sin(a)*36);g.stroke();}
    g.fillStyle='#5a3a1e';g.fillRect(-3,0,6,22);g.restore();}
  if(s.item===2){// 검자루(어깨 뒤)
    g.save();g.translate(150,138);g.rotate(0.5);ink(g,2);g.fillStyle='#6a4a2a';g.fillRect(-4,-44,8,30);g.strokeRect(-4,-44,8,30);g.fillStyle='#d8b04a';g.fillRect(-12,-16,24,5);g.strokeRect(-12,-16,24,5);g.fillStyle='#8a1f1a';g.beginPath();g.arc(0,-46,5,0,7);g.fill();g.stroke();g.restore();}
  if(s.item===3){// 창(뒤로 비스듬히)
    g.save();ink(g,3);g.strokeStyle='#5a3a1e';g.lineWidth=5;g.beginPath();g.moveTo(170,192);g.lineTo(150,40);g.stroke();g.fillStyle='#c9ced6';ink(g,1.6);path(g,[[146,44],[149,14],[155,44]]);g.fill();g.stroke();g.fillStyle='#b8261a';path(g,[[144,46],[156,46],[158,56],[142,56]]);g.fill();g.restore();}
  if(s.item===4){// 두루마리
    g.save();g.translate(146,166);g.rotate(-0.3);ink(g,1.6);g.fillStyle='#efe2bf';g.fillRect(-20,-6,40,12);g.strokeRect(-20,-6,40,12);g.fillStyle='#7a3a1a';g.fillRect(-24,-8,5,16);g.fillRect(19,-8,5,16);g.fillStyle='#b8261a';g.fillRect(-2,-6,4,12);g.restore();}
  if(s.item===5){// 활(어깨에 멘)
    g.save();ink(g,3);g.strokeStyle='#6a3a1a';g.lineWidth=4;g.beginPath();g.arc(176,120,60,Math.PI*0.62,Math.PI*1.25);g.stroke();g.strokeStyle='#e8e0d0';g.lineWidth=1;g.beginPath();const a=Math.PI*0.62,b=Math.PI*1.25;g.moveTo(176+Math.cos(a)*60,120+Math.sin(a)*60);g.lineTo(176+Math.cos(b)*60,120+Math.sin(b)*60);g.stroke();g.restore();}
}
function finish(g:G){
  // 고운 결과 테두리 그늘
  const img=g.getImageData(0,0,S,S),d=img.data;let seed=12345;for(let i=0;i<d.length;i+=4){seed=(seed*1103515245+12345)>>>0;const n=((seed>>>16)%13)-6;d[i]=Math.max(0,Math.min(255,d[i]!+n));d[i+1]=Math.max(0,Math.min(255,d[i+1]!+n));d[i+2]=Math.max(0,Math.min(255,d[i+2]!+n));}
  g.putImageData(img,0,0);
  const v=g.createRadialGradient(CX,90,60,CX,96,140);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=v;g.fillRect(0,0,S,S);
}
/** 초상 한 장을 캔버스에 그린다. */
export function drawPortrait(g:G,s:PortraitSpec){
  g.save();g.clearRect(0,0,S,S);background(g,s);
  const f=faceShape(g,s);
  // 흉상을 크게: 얼굴이 초상 칸의 3분의 1을 넘게
  g.save();g.translate(CX,113);g.scale(1.24,1.24);g.translate(-CX,-104);
  hairBack(g,s,f);if(s.item===3)heldItem(g,s);body(g,s);head(g,s,f);features(g,s,f);facialHair(g,s,f);
  if(s.hat!==2)hairFront(g,s,f);headwear(g,s,f);if(s.item!==3)heldItem(g,s);g.restore();
  // 볕 드는 왼쪽 가장자리의 따스한 빛
  g.save();g.globalCompositeOperation='soft-light';g.fillStyle=grad(g,0,0,S,S,[[0,'rgba(255,220,170,.45)'],[0.6,'rgba(255,220,170,0)'],[1,'rgba(0,0,0,.25)']]);g.fillRect(0,0,S,S);g.restore();
  finish(g);g.restore();
}
const urls=new Map<string,string>();
/** 초상의 data URL(같은 값은 한 번만 그린다). 캔버스가 없으면(시험 환경) 빈 문자열. */
export function portraitURL(s:PortraitSpec){
  const key=PORTRAIT_KEYS.map(k=>s[k]).join(',');const hit=urls.get(key);if(hit)return hit;
  if(typeof document==='undefined')return '';
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d',{willReadFrequently:true})!;drawPortrait(g,s);
  const url=c.toDataURL('image/png');urls.set(key,url);return url;
}
