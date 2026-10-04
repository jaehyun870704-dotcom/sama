/**
 * 신장수 초상 — 고전 삼국지 장수 얼굴처럼 얼굴을 꽉 채운 사실풍 초상.
 * 얼굴형·피부·눈매·눈썹·입·수염·머리색·머리·관모·옷·갑옷·소품·배경·나이·흉터를 고르면 캔버스에 그린다.
 * 굵은 먹선 대신 부드러운 명암(흐린 그늘·볕 층을 얼굴 모양 안에 겹쳐 칠함)과 머리카락·수염 결을 한 올씩 그려
 * 칠한 그림처럼 보이게 한다. 그림은 고르는 값(PortraitSpec)만 저장하고 화면에 낼 때 그린다(같은 값은 한 번만).
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
  age:['젊은','장년','노년'],
  mark:['없음','뺨 흉터','눈 흉터','거친 수염 자국'],
} as const;
export type PortraitPart=keyof typeof PORTRAIT_PARTS;
export type PortraitSpec=Record<PortraitPart,number>;
export const PORTRAIT_KEYS=Object.keys(PORTRAIT_PARTS) as PortraitPart[];

/** 저장된 초상 값 정리(범위 밖·없는 값은 0). */
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
    hat:martial?[2,2,3,6,0][pick(5)]!:mage?4:[1,4,0,6][pick(4)]!,robe:pick(7),armor:martial?1+pick(3):0,item:0,bg:pick(5),age:pick(10)<6?0:pick(10)<8?1:2,mark:martial&&pick(4)===0?1+pick(3):0};
  if(temper==='reckless'||temper==='brave'){s.eyes=2;s.brows=pick(2)?0:3;s.mouth=2;}
  if(temper==='wise'||temper==='calm'){s.eyes=1;s.brows=1;s.mouth=1;}
  if(temper==='proud'){s.eyes=0;s.brows=2;}
  if(temper==='timid'){s.eyes=4;s.brows=1;s.mouth=0;}
  if(s.age===2&&s.hair<2)s.hair=2+pick(2);
  s.item=unitClass==='strategist'||unitClass==='fengshui'?1+pick(2)*3:['archer','crossbow','horseArcher','slinger'].includes(String(unitClass))?5:['spearman','javelin'].includes(String(unitClass))?3:martial?2:pick(2)?4:0;
  return s;
}

// ─────────────────────────────────────────────── 그리기
type G=CanvasRenderingContext2D;type P=[number,number];
/** 칠의 크기(그린 뒤 화면 칸에 맞춰 줄어든다). */
const S=256,CX=128;
const SKIN:Array<[string,string,string,string]>=[['#f0d6be','#d8b094','#a8806a','#664236'],['#e4c2a2','#c49a7a','#946a52','#58382a'],['#d2a682','#ae805e','#7e5640','#4a2e20'],['#ae7e5e','#8a5e42','#62402c','#3a2418']];
const HAIR:Array<[string,string]>=[['#15110e','#4a3c32'],['#3a2416','#86603c'],['#4c4844','#a8a49c'],['#b8b2a8','#f2eee6']];
const ROBE:Array<[string,string]>=[['#2e4a80','#121e3a'],['#8a2a1c','#3e0e08'],['#2e6a60','#0e2a26'],['#34343a','#0e0e12'],['#5e2e74','#24102e'],['#a07c3c','#4a3416'],['#e2dccc','#8e8676']];
const BG:Array<[string,string]>=[['#6a4630','#160c08'],['#4a4a4e','#0c0c0e'],['#2c3a58','#080c16'],['#34462e','#0a100a'],['#62241a','#160604']];

function rng(seed:number){let a=seed>>>0||1;return ()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const lin=(g:G,x0:number,y0:number,x1:number,y1:number,stops:Array<[number,string]>)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);for(const [o,c] of stops)gr.addColorStop(o,c);return gr;};
const rad=(g:G,x:number,y:number,r0:number,r1:number,stops:Array<[number,string]>)=>{const gr=g.createRadialGradient(x,y,r0,x,y,r1);for(const [o,c] of stops)gr.addColorStop(o,c);return gr;};
const mix=(hex:string,a:number)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
/** 모양 안에만, 흐리게 칠한다(부드러운 명암). */
function soft(g:G,clip:()=>void,blur:number,paint:()=>void,op:GlobalCompositeOperation='source-over'){g.save();g.beginPath();clip();g.clip();g.filter=`blur(${blur}px)`;g.globalCompositeOperation=op;paint();g.restore();}
function blob(g:G,x:number,y:number,rx:number,ry:number,fill:string,rot=0){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,Math.PI*2);g.fill();}

interface Face {cx:number;cy:number;rx:number;ry:number;jaw:number;top:number;bot:number;eyeY:number;fx:number}
function faceOf(s:PortraitSpec):Face{
  const f=[{rx:58,ry:76,jaw:0.6},{rx:54,ry:82,jaw:0.56},{rx:63,ry:74,jaw:0.9},{rx:64,ry:72,jaw:0.76}][s.face]!;
  const cy=134;return {...f,cx:CX,cy,top:cy-f.ry,bot:cy+f.ry,eyeY:cy-8,fx:CX-5};
}
/** 얼굴 윤곽(이마는 둥글고, 광대에서 턱으로 좁아진다). */
function facePath(g:G,f:Face){
  const {cx,cy,rx,ry,jaw,top,bot}=f;
  g.moveTo(cx-rx,cy-6);g.bezierCurveTo(cx-rx,top-10,cx+rx,top-10,cx+rx,cy-6);
  g.bezierCurveTo(cx+rx+2,cy+ry*0.3,cx+rx*jaw+4,bot-14,cx+2,bot);g.bezierCurveTo(cx-rx*jaw-2,bot-14,cx-rx-2,cy+ry*0.3,cx-rx,cy-6);g.closePath();
}

function background(g:G,s:PortraitSpec,R:()=>number){
  const [a,b]=BG[s.bg]!;g.fillStyle=rad(g,CX-30,70,10,230,[[0,a],[1,b]]);g.fillRect(0,0,S,S);
  // 붓질 결(사선의 옅은 얼룩)
  for(let i=0;i<40;i++){g.strokeStyle=`rgba(${R()<0.5?'255,240,220':'0,0,0'},${0.03+R()*0.04})`;g.lineWidth=6+R()*14;g.beginPath();const x=R()*S,y=R()*S;g.moveTo(x,y);g.lineTo(x+40+R()*60,y-20-R()*30);g.stroke();}
}
function shoulders(g:G,s:PortraitSpec,f:Face){
  const [c,d]=ROBE[s.robe]!;
  // 목
  const [,,sh]=SKIN[s.skin]!;g.fillStyle=lin(g,0,f.bot-40,0,S,[[0,sh],[1,SKIN[s.skin]![3]]]);g.beginPath();g.moveTo(f.cx-34,f.bot-36);g.lineTo(f.cx+34,f.bot-36);g.lineTo(f.cx+44,S);g.lineTo(f.cx-44,S);g.fill();
  g.save();g.filter='blur(6px)';blob(g,f.cx+6,f.bot-20,f.rx*0.8,22,mix(SKIN[s.skin]![3],0.7));g.restore();
  // 옷/어깨(화면 아래 모서리)
  g.fillStyle=lin(g,0,212,S,S,[[0,c],[1,d]]);g.beginPath();g.moveTo(0,S);g.lineTo(0,226);g.quadraticCurveTo(40,212,f.cx-40,222);g.lineTo(f.cx,S);g.lineTo(f.cx+40,222);g.quadraticCurveTo(S-40,212,S,226);g.lineTo(S,S);g.fill();
  g.fillStyle='#e8e0cc';g.beginPath();g.moveTo(f.cx-40,222);g.lineTo(f.cx-6,S);g.lineTo(f.cx+4,S);g.lineTo(f.cx-30,220);g.fill();
  g.strokeStyle='rgba(220,180,90,.7)';g.lineWidth=2;g.beginPath();g.moveTo(f.cx-40,222);g.lineTo(f.cx,S);g.lineTo(f.cx+40,222);g.stroke();
  if(s.armor){const [p0,p1]=s.armor===3?['#e8c060','#7a5a18']:s.armor===2?['#8e5e38','#3e2410']:['#a0a8b4','#3a4048'];
    for(const side of [-1,1]){const x0=side<0?0:S;g.fillStyle=lin(g,x0,214,x0-side*80,S,[[0,p1],[0.5,p0],[1,p1]]);g.beginPath();g.moveTo(x0,214);g.quadraticCurveTo(x0-side*60,206,x0-side*82,236);g.lineTo(x0-side*70,S);g.lineTo(x0,S);g.fill();
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1.4;for(let k=0;k<3;k++){g.beginPath();g.moveTo(x0,224+k*11);g.quadraticCurveTo(x0-side*50,214+k*11,x0-side*76,242+k*7);g.stroke();}
      g.fillStyle='rgba(255,250,230,.55)';g.beginPath();g.ellipse(x0-side*40,220,18,3,side*0.2,0,7);g.fill();}}
}
function hairBack(g:G,s:PortraitSpec,f:Face,R:()=>number){
  if(s.hat!==5&&s.hat!==6)return;const [d,l]=HAIR[s.hair]!;
  g.fillStyle=d;g.beginPath();g.moveTo(f.cx-f.rx-14,f.cy-30);g.quadraticCurveTo(f.cx-f.rx-30,f.cy+70,f.cx-f.rx-6,S);g.lineTo(f.cx+f.rx+6,S);g.quadraticCurveTo(f.cx+f.rx+30,f.cy+70,f.cx+f.rx+14,f.cy-30);g.fill();
  for(let i=0;i<60;i++){const side=R()<0.5?-1:1,x=f.cx+side*(f.rx+2+R()*20);g.strokeStyle=mix(l,0.1+R()*0.18);g.lineWidth=0.9;g.beginPath();g.moveTo(x,f.cy-20);g.quadraticCurveTo(x+side*(6+R()*10),f.cy+60,x+side*R()*8,S);g.stroke();}
}
function ears(g:G,s:PortraitSpec,f:Face){
  const [,m,sh]=SKIN[s.skin]!;
  for(const side of [-1,1]){const x=f.cx+side*(f.rx+2),y=f.cy+4;g.fillStyle=lin(g,x-10,y,x+10,y,side<0?[[0,sh],[1,m]]:[[0,m],[1,sh]]);g.beginPath();g.ellipse(x,y,9,17,side*0.12,0,7);g.fill();
    g.strokeStyle=mix(SKIN[s.skin]![3],0.6);g.lineWidth=1.4;g.beginPath();g.arc(x+side*1,y,5,side<0?-1.4:1.7,side<0?1.4:4.6);g.stroke();}
}
function faceSkin(g:G,s:PortraitSpec,f:Face){
  const [lt,m,sh,dp]=SKIN[s.skin]!,clip=()=>facePath(g,f);
  g.fillStyle=lin(g,f.cx-f.rx,f.top,f.cx+f.rx,f.bot,[[0,lt],[0.5,m],[1,sh]]);g.beginPath();facePath(g,f);g.fill();
  // 큰 명암: 빛은 왼쪽 위에서 — 먼 쪽 3분의 1은 깊게 가라앉는다
  soft(g,clip,16,()=>{blob(g,f.cx+f.rx*1.05,f.cy+6,f.rx*0.62,f.ry*1.3,mix(dp,0.62));blob(g,f.cx-f.rx*1.15,f.cy+10,f.rx*0.25,f.ry,mix(dp,0.3));},'multiply');
  // 그늘: 먼 쪽(오른쪽) 볼, 눈두덩, 광대 아래, 턱 아래, 관자놀이
  soft(g,clip,10,()=>{blob(g,f.cx+f.rx*0.85,f.cy+10,f.rx*0.45,f.ry*0.9,mix(dp,0.45));blob(g,f.cx,f.bot+6,f.rx*0.8,18,mix(dp,0.5));
    for(const side of [-1,1]){blob(g,f.fx+side*26,f.eyeY-2,18,9,mix(dp,0.32));blob(g,f.cx+side*(f.rx*0.62),f.cy+28,14,22,mix(dp,0.22));blob(g,f.cx+side*(f.rx*0.9),f.cy-26,10,20,mix(dp,0.25));}});
  // 볕: 이마, 콧등, 가까운 쪽 광대, 턱 끝
  soft(g,clip,9,()=>{blob(g,f.cx-12,f.top+28,f.rx*0.55,16,'rgba(255,240,215,.35)');blob(g,f.fx-2,f.cy+8,6,24,'rgba(255,240,215,.38)');blob(g,f.cx-f.rx*0.52,f.cy+10,14,10,'rgba(255,235,210,.3)');blob(g,f.cx-4,f.bot-14,12,7,'rgba(255,235,210,.25)');});
  // 광대 아래 꺼진 면(사실풍 얼굴의 각)
  soft(g,clip,7,()=>{for(const side of [-1,1])blob(g,f.cx+side*f.rx*0.6,f.cy+34,9,20,mix(dp,side>0?0.4:0.22),side*-0.35);blob(g,f.cx-f.rx*0.48,f.cy+4,12,7,'rgba(255,238,215,.32)',-0.3);});
  // 볼의 혈색
  soft(g,clip,8,()=>{for(const side of [-1,1])blob(g,f.cx+side*f.rx*0.5,f.cy+22,13,8,'rgba(190,80,60,.12)');});
  if(s.hat===5){soft(g,clip,6,()=>{for(const side of [-1,1])blob(g,f.cx+side*f.rx*0.48,f.cy+20,12,7,'rgba(230,110,110,.18)');});}
}
function eye(g:G,s:PortraitSpec,f:Face,side:number){
  const x=f.fx+side*26+(side>0?2:0),y=f.eyeY,far=side>0?0.9:1;
  const st=s.eyes,w=(st===2?15:st===3?14:st===4?13:14)*far,h=st===2?6.6:st===3?3.2:st===1?4.4:st===4?5.8:4.8,tilt=st===0?-5:st===3?-3:st===4?1:-1;
  const ox=x+side*w,ix=x-side*w,oy=y+tilt,iy=y+1;
  const almond=()=>{g.moveTo(ix,iy);g.bezierCurveTo(ix+side*w*0.4,y-h*1.5,ox-side*w*0.35,oy-h*1.3,ox,oy);g.bezierCurveTo(ox-side*w*0.4,oy+h*0.9,ix+side*w*0.4,iy+h*1.1,ix,iy);g.closePath();};
  // 흰자와 눈동자
  g.fillStyle='#ece4da';g.beginPath();almond();g.fill();
  g.save();g.beginPath();almond();g.clip();
  const ir=Math.min(h*1.35+1.2,7.6),ix2=x-side*1.5,iy2=y-(st===1?1.5:0.6);
  g.fillStyle=rad(g,ix2,iy2,1,ir,[[0,'#3e2614'],[0.7,'#24160c'],[1,'#0c0806']]);g.beginPath();g.arc(ix2,iy2,ir,0,7);g.fill();
  g.fillStyle='#050302';g.beginPath();g.arc(ix2,iy2,ir*0.42,0,7);g.fill();
  g.fillStyle='rgba(60,30,10,.45)';g.fillRect(x-w-2,y-h*2,w*2+4,h*1.25);// 윗눈꺼풀 그늘
  g.restore();
  g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(ix2-2,iy2-2.2,1.6,0,7);g.fill();
  // 속눈썹 선(위가 진하고 바깥으로 길게), 쌍꺼풀 주름, 아래 눈꺼풀
  g.strokeStyle='#120a06';g.lineWidth=st===2?3:2.6;g.lineCap='round';g.beginPath();g.moveTo(ix,iy);g.bezierCurveTo(ix+side*w*0.4,y-h*1.5,ox-side*w*0.35,oy-h*1.3,ox+side*3,oy-1);g.stroke();
  if(st===1){g.fillStyle=SKIN[s.skin]![1];g.beginPath();g.moveTo(ix,iy-1);g.bezierCurveTo(ix+side*w*0.4,y-h*1.6,ox-side*w*0.35,oy-h*1.4,ox,oy-1);g.lineTo(ox,oy-h*0.2);g.bezierCurveTo(ox-side*w*0.4,oy-h*0.5,ix+side*w*0.4,iy-h*0.5,ix,iy-1);g.fill();g.strokeStyle='#120a06';g.lineWidth=2.2;g.beginPath();g.moveTo(ix,iy-h*0.3);g.quadraticCurveTo(x,y-h*0.7,ox,oy-h*0.25);g.stroke();}
  g.strokeStyle=mix(SKIN[s.skin]![3],0.55);g.lineWidth=1.3;g.beginPath();g.moveTo(ix+side*2,iy-h*1.9);g.quadraticCurveTo(x,y-h*2.6-2,ox-side*2,oy-h*1.7);g.stroke();
  g.strokeStyle=mix(SKIN[s.skin]![3],0.45);g.lineWidth=1.1;g.beginPath();g.moveTo(ix+side*3,iy+h*0.9);g.quadraticCurveTo(x,y+h*1.4,ox-side*2,oy+h*0.6);g.stroke();
  if(s.hat===5||st===4){g.strokeStyle='#120a06';g.lineWidth=1.2;for(let k=0;k<3;k++){const t=0.65+k*0.12,px=ix+(ox-ix)*t,py=y-h*1.1+(oy-y)*t;g.beginPath();g.moveTo(px,py);g.lineTo(px+side*3,py-3);g.stroke();}}
}
function brows(g:G,s:PortraitSpec,f:Face,R:()=>number){
  const [d]=HAIR[Math.min(s.hair,s.age===2?3:s.hair)]!,th=s.brows===0?5:s.brows===1?2.2:3.6;
  for(const side of [-1,1]){
    const x0=f.fx+side*9,x1=f.fx+side*44,y0=f.eyeY-17+(s.brows===3?4:0),y1=f.eyeY-17-(s.brows===2?9:s.brows===3?-1:2),ym=f.eyeY-24-(s.brows===2?4:0);
    const n=s.brows===1?22:34;
    for(let i=0;i<n;i++){const t=i/n,x=x0+(x1-x0)*t,y=(1-t)*(1-t)*y0+2*t*(1-t)*ym+t*t*y1,thick=th*(1-t*0.6);
      g.strokeStyle=mix(d,0.55+R()*0.35);g.lineWidth=1.3;g.beginPath();g.moveTo(x,y+thick*(R()-0.2));g.lineTo(x+side*(4+R()*3),y-thick*0.6-R()*1.5);g.stroke();}
  }
}
function nose(g:G,s:PortraitSpec,f:Face){
  const [,,sh,dp]=SKIN[s.skin]!,y=f.cy+26,x=f.fx;
  soft(g,()=>facePath(g,f),4,()=>{blob(g,x+8,y-18,4.5,24,mix(dp,0.5));blob(g,x+16,f.eyeY+4,8,7,mix(dp,0.35));blob(g,x,y+8,14,4.5,mix(dp,0.55));blob(g,x+10,y+2,6,6,mix(dp,0.45));});
  soft(g,()=>facePath(g,f),2.5,()=>{blob(g,x-2,y-16,2.6,18,'rgba(255,240,220,.4)');});
  g.strokeStyle=mix(dp,0.55);g.lineWidth=1.6;g.beginPath();g.moveTo(x-9,y-2);g.quadraticCurveTo(x-12,y+5,x-5,y+5);g.moveTo(x+9,y-2);g.quadraticCurveTo(x+12,y+5,x+5,y+5);g.stroke();
  blob(g,x-4,y+4,3,1.6,mix(dp,0.75));blob(g,x+5,y+4,3,1.6,mix(dp,0.75));
  blob(g,x,y-2,4,3,'rgba(255,240,220,.35)');void sh;
}
function mouth(g:G,s:PortraitSpec,f:Face){
  const [,,sh,dp]=SKIN[s.skin]!,y=f.cy+46,x=f.fx+1,w=s.mouth===3?17:15,lip=s.hat===5?'#b8545a':mix(sh,1);
  const curve=s.mouth===1?3:s.mouth===3?5:s.mouth===2?-2:0;
  soft(g,()=>facePath(g,f),4,()=>{blob(g,x,y+11,11,4,mix(dp,0.35));});
  // 윗입술(어두운) · 아랫입술(밝은)
  g.fillStyle=s.hat===5?'#a84a50':mix(dp,0.55);g.beginPath();g.moveTo(x-w,y-curve*0.6);g.quadraticCurveTo(x-6,y-6,x,y-4);g.quadraticCurveTo(x+6,y-6,x+w,y-curve*0.6);g.quadraticCurveTo(x,y+1,x-w,y-curve*0.6);g.fill();
  g.fillStyle=lip;g.globalAlpha=0.55;g.beginPath();g.moveTo(x-w+3,y);g.quadraticCurveTo(x,y+9,x+w-3,y);g.quadraticCurveTo(x,y+2,x-w+3,y);g.fill();g.globalAlpha=1;
  if(s.mouth===3){g.fillStyle='#3a1410';g.beginPath();g.moveTo(x-w+2,y-curve*0.5);g.quadraticCurveTo(x,y+7,x+w-2,y-curve*0.5);g.quadraticCurveTo(x,y+1,x-w+2,y-curve*0.5);g.fill();g.fillStyle='#ece4d8';g.fillRect(x-8,y-1,16,2.5);}
  g.strokeStyle='#2a1208';g.lineWidth=s.mouth===2?2.2:1.6;g.beginPath();g.moveTo(x-w,y-curve*0.6);g.quadraticCurveTo(x,y+1.5-curve*0.2,x+w,y-curve*0.6);g.stroke();
  g.fillStyle='rgba(255,235,220,.35)';g.beginPath();g.ellipse(x-2,y+4,5,1.5,0,0,7);g.fill();
}
function ageMarks(g:G,s:PortraitSpec,f:Face,R:()=>number){
  const dp=SKIN[s.skin]![3];
  if(s.age>=1){g.strokeStyle=mix(dp,0.32+s.age*0.1);g.lineWidth=1.3;
    for(const side of [-1,1]){g.beginPath();g.moveTo(f.fx+side*12,f.cy+30);g.quadraticCurveTo(f.fx+side*20,f.cy+42,f.fx+side*18,f.cy+54);g.stroke();
      g.beginPath();g.moveTo(f.fx+side*42,f.eyeY+2);g.lineTo(f.fx+side*48,f.eyeY+6);g.moveTo(f.fx+side*42,f.eyeY+6);g.lineTo(f.fx+side*47,f.eyeY+11);g.stroke();}}
  if(s.age===2){g.strokeStyle=mix(dp,0.4);g.lineWidth=1.2;for(let k=0;k<3;k++){g.beginPath();g.moveTo(f.cx-26,f.top+30+k*7);g.quadraticCurveTo(f.cx,f.top+26+k*7,f.cx+24,f.top+31+k*7);g.stroke();}
    for(const side of [-1,1]){g.beginPath();g.moveTo(f.fx+side*14,f.eyeY+12);g.quadraticCurveTo(f.fx+side*26,f.eyeY+18,f.fx+side*38,f.eyeY+12);g.stroke();}}
  if(s.mark===1){g.strokeStyle='rgba(120,50,40,.7)';g.lineWidth=2.4;g.beginPath();g.moveTo(f.cx+f.rx*0.3,f.cy+8);g.lineTo(f.cx+f.rx*0.62,f.cy+40);g.stroke();g.strokeStyle='rgba(255,220,200,.35)';g.lineWidth=1;g.beginPath();g.moveTo(f.cx+f.rx*0.3-1,f.cy+8);g.lineTo(f.cx+f.rx*0.62-1,f.cy+40);g.stroke();}
  if(s.mark===2){g.strokeStyle='rgba(120,50,40,.75)';g.lineWidth=2.4;g.beginPath();g.moveTo(f.fx-18,f.eyeY-30);g.lineTo(f.fx-34,f.eyeY+22);g.stroke();}
  if(s.mark===3||s.beard>=2){// 거친 수염 자국(턱·입가에 고운 점)
    g.save();g.beginPath();facePath(g,f);g.clip();const d=HAIR[s.hair]![0];
    for(let i=0;i<(s.mark===3?900:500);i++){const a=R()*Math.PI,r=R();const x=f.cx+Math.cos(a)*f.rx*0.85*r*1.1,y=f.cy+30+Math.sin(a)*(f.ry*0.65)*r;if(y<f.cy+26)continue;g.fillStyle=mix(d,0.18+R()*0.2);g.fillRect(x,y,1.2,1.2);}g.restore();}
}
function beard(g:G,s:PortraitSpec,f:Face,R:()=>number){
  if(!s.beard||s.hat===5)return;const [d,l]=HAIR[s.hair]!,my=f.cy+40,strand=(x:number,y:number,dx:number,len:number,w=1.3)=>{g.strokeStyle=R()<0.3?mix(l,0.28+R()*0.25):mix(d,0.45+R()*0.35);g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+dx*0.5,y+len*0.55,x+dx,y+len);g.stroke();};
  // 수염 덩이를 먼저 칠하고(흐린 가장자리) 그 위에 결을 얹는다 — 얼굴에 붙어 자란 것처럼
  const massPaint=(path:()=>void,blur:number)=>{g.save();g.filter=`blur(${blur}px)`;g.fillStyle=lin(g,0,my-10,0,S,[[0,mix(d,0.92)],[0.6,d],[1,mix(l,0.7)]]);g.beginPath();path();g.fill();g.restore();};
  massPaint(()=>{g.moveTo(f.fx-20,my+2);g.quadraticCurveTo(f.fx-8,my-12,f.fx,my-9);g.quadraticCurveTo(f.fx+8,my-12,f.fx+20,my+2);g.quadraticCurveTo(f.fx+10,my-3,f.fx,my-3);g.quadraticCurveTo(f.fx-10,my-3,f.fx-20,my+2);},1.4);
  if(s.beard>=2){const len=s.beard===4?S-f.bot+14:s.beard===3?20:28,w=s.beard===3?f.rx*0.98:24;
    massPaint(()=>{g.moveTo(f.cx-w,s.beard===3?f.cy-6:my+10);g.quadraticCurveTo(f.cx-w*0.9,f.bot-6,f.cx-10,f.bot+len*0.8);g.quadraticCurveTo(f.cx,f.bot+len,f.cx+10,f.bot+len*0.8);g.quadraticCurveTo(f.cx+w*0.9,f.bot-6,f.cx+w,s.beard===3?f.cy-6:my+10);
      g.quadraticCurveTo(f.cx+w*0.7,f.bot-18,f.cx,f.bot-22);g.quadraticCurveTo(f.cx-w*0.7,f.bot-18,f.cx-w,s.beard===3?f.cy-6:my+10);},2.2);
    if(s.beard===3)soft(g,()=>facePath(g,f),3,()=>{blob(g,f.fx,f.cy+52,14,6,SKIN[s.skin]![2]!);});}
  // 콧수염: 인중에서 양쪽으로 흘러내림
  for(const side of [-1,1])for(let i=0;i<34;i++){const t=R(),x=f.fx+side*(2+t*16),y=my-6+t*2;strand(x,y,side*(4+t*8),6+t*10,1);}
  if(s.beard===2||s.beard===4){const len=s.beard===4?S-f.bot+10:26;
    for(let i=0;i<(s.beard===4?150:90);i++){const t=R()*2-1,x=f.cx+t*16,y=f.bot-16+R()*8;strand(x,y,t*8+(R()-0.5)*6,len*(0.6+R()*0.4),1);}}
  if(s.beard===3){for(const side of [-1,1])for(let i=0;i<90;i++){const t=R(),x=f.cx+side*(f.rx*(0.95-t*0.75)),y=f.cy+(t*f.ry*0.95);strand(x,y,side*-2,10+R()*12,1);}
    for(let i=0;i<60;i++){const t=R()*2-1,x=f.cx+t*24,y=f.bot-12;strand(x,y,t*4,16+R()*12,1);}}
}
function hairFront(g:G,s:PortraitSpec,f:Face,R:()=>number){
  const [d,l]=HAIR[s.hair]!,top=f.top;
  // 이마 위 머리 덩이
  const mass=()=>{g.moveTo(f.cx-f.rx-6,f.cy-4);g.bezierCurveTo(f.cx-f.rx-12,top-34,f.cx+f.rx+12,top-34,f.cx+f.rx+6,f.cy-4);g.quadraticCurveTo(f.cx+f.rx-6,top+30,f.cx+10,top+18);g.quadraticCurveTo(f.cx-f.rx*0.6,top+24,f.cx-f.rx-6,f.cy-4);g.closePath();};
  g.fillStyle=lin(g,f.cx-f.rx,top-30,f.cx+f.rx,f.cy,[[0,d],[0.3,mix(l,0.9)],[0.45,d],[1,d]]);g.beginPath();mass();g.fill();
  soft(g,mass,6,()=>{blob(g,f.cx-f.rx*0.4,top-6,f.rx*0.5,10,mix(l,0.45),-0.25);blob(g,f.cx+f.rx*0.6,top+10,f.rx*0.5,30,'rgba(0,0,0,.45)');});
  soft(g,()=>facePath(g,f),6,()=>{blob(g,f.cx,top+26,f.rx*0.95,12,mix(SKIN[s.skin]![3],0.5));});
  g.save();g.beginPath();mass();g.clip();
  for(let i=0;i<120;i++){const x=f.cx-f.rx+R()*f.rx*2,y0=top-30+R()*20;g.strokeStyle=R()<0.35?mix(l,0.12+R()*0.18):mix('#000000',0.18);g.lineWidth=0.9;g.beginPath();g.moveTo(x,y0);g.quadraticCurveTo(x+(x<f.cx?-10:10),y0+30,x+(x<f.cx?-18:18)*R(),y0+60);g.stroke();}
  g.restore();
  // 관자놀이 머리와 늘어진 몇 가닥
  for(const side of [-1,1])for(let i=0;i<20;i++){const x=f.cx+side*(f.rx-4+R()*8);g.strokeStyle=mix(d,0.4+R()*0.4);g.lineWidth=1;g.beginPath();g.moveTo(x,f.cy-34);g.quadraticCurveTo(x+side*4,f.cy-10,x+side*R()*3,f.cy+8+R()*14);g.stroke();}
  if(s.hat===6)for(let i=0;i<34;i++){const x=f.cx-30+R()*60;g.strokeStyle=mix(d,0.5+R()*0.4);g.lineWidth=1.2;g.beginPath();g.moveTo(x,top+6);g.quadraticCurveTo(x+(R()-0.5)*20,top+30,x+(R()-0.5)*26,top+42+R()*24);g.stroke();}
}
function headwear(g:G,s:PortraitSpec,f:Face,R:()=>number){
  const top=f.top,[d,l]=HAIR[s.hair]!;
  if(s.hat===0){// 상투: 위로 빗어 올린 머리와 묶은 끈(위는 화면 밖)
    g.fillStyle=d;g.beginPath();g.ellipse(f.cx,top-18,24,20,0,0,7);g.fill();g.fillStyle='#7a1f16';g.fillRect(f.cx-22,top-6,44,6);
    for(let i=0;i<30;i++){g.strokeStyle=mix(l,0.3+R()*0.3);g.lineWidth=1;g.beginPath();g.arc(f.cx,top-18,10+R()*12,3.4+R(),4.6+R());g.stroke();}}
  if(s.hat===1){// 관: 검은 칠관과 비녀
    g.fillStyle=lin(g,f.cx-50,0,f.cx+50,0,[[0,'#2a2622'],[0.4,'#0e0c0a'],[1,'#1e1a16']]);g.beginPath();g.moveTo(f.cx-50,top+16);g.lineTo(f.cx-42,-10);g.lineTo(f.cx+44,-10);g.lineTo(f.cx+52,top+16);g.quadraticCurveTo(f.cx,top+8,f.cx-50,top+16);g.fill();
    g.strokeStyle='rgba(200,170,100,.45)';g.lineWidth=1.4;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(f.cx+k*14,top+12);g.lineTo(f.cx+k*16,-10);g.stroke();}
    g.fillStyle='#0e0c0a';g.fillRect(f.cx-52,top+10,104,10);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(f.cx-50,top+11,100,2);
    g.strokeStyle='#d0a848';g.lineWidth=3.4;g.beginPath();g.moveTo(f.cx-80,top-4);g.lineTo(f.cx+80,top-14);g.stroke();g.fillStyle='#e8c060';g.beginPath();g.arc(f.cx+80,top-14,4,0,7);g.fill();}
  if(s.hat===2){// 투구: 철(또는 금) 투구, 이마 가리개 문양, 볼 가리개, 정수리 장식
    const gold=s.armor===3,[a,b,c]=gold?['#f2d27a','#b08a30','#5a3e10']:['#d6dce4','#8a929e','#2e343c'];
    const dome=()=>{g.moveTo(f.cx-f.rx-14,f.cy-10);g.bezierCurveTo(f.cx-f.rx-20,top-70,f.cx+f.rx+20,top-70,f.cx+f.rx+14,f.cy-10);g.lineTo(f.cx+f.rx+2,f.eyeY-20);g.quadraticCurveTo(f.cx,f.eyeY-46,f.cx-f.rx-2,f.eyeY-20);g.closePath();};
    g.fillStyle=lin(g,f.cx-f.rx,0,f.cx+f.rx,0,[[0,b],[0.28,a],[0.6,b],[1,c]]);g.beginPath();dome();g.fill();
    soft(g,dome,5,()=>{blob(g,f.cx-24,top-14,16,40,'rgba(255,255,255,.45)',-0.3);blob(g,f.cx+f.rx,f.cy-20,20,40,'rgba(0,0,0,.35)');});
    // 이마 띠와 가운데 문양(구름 무늬)
    g.fillStyle=lin(g,0,f.eyeY-44,0,f.eyeY-24,[[0,a],[1,c]]);g.beginPath();g.moveTo(f.cx-f.rx-4,f.eyeY-22);g.quadraticCurveTo(f.cx,f.eyeY-50,f.cx+f.rx+4,f.eyeY-22);g.lineTo(f.cx+f.rx,f.eyeY-14);g.quadraticCurveTo(f.cx,f.eyeY-40,f.cx-f.rx,f.eyeY-14);g.fill();
    g.fillStyle=gold?'#fff0b0':'#e8c060';g.beginPath();g.moveTo(f.cx,f.eyeY-70);g.bezierCurveTo(f.cx-22,f.eyeY-66,f.cx-16,f.eyeY-40,f.cx,f.eyeY-36);g.bezierCurveTo(f.cx+16,f.eyeY-40,f.cx+22,f.eyeY-66,f.cx,f.eyeY-70);g.fill();
    g.strokeStyle='#5a3e10';g.lineWidth=1.4;g.beginPath();g.arc(f.cx-6,f.eyeY-54,5,0,5);g.arc(f.cx+6,f.eyeY-54,5,Math.PI,Math.PI*2.6);g.stroke();
    // 리벳
    for(let k=-4;k<=4;k++){const x=f.cx+k*15,y=f.eyeY-28-Math.cos(k/5)*16;g.fillStyle=c;g.beginPath();g.arc(x,y,2.4,0,7);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x-1,y-1.5,1.2,1.2);}
    // 볼 가리개
    for(const side of [-1,1]){g.fillStyle=lin(g,f.cx+side*f.rx,0,f.cx+side*(f.rx-20),0,[[0,c],[1,b]]);g.beginPath();g.moveTo(f.cx+side*(f.rx+14),f.cy-12);g.lineTo(f.cx+side*(f.rx+12),f.cy+40);g.quadraticCurveTo(f.cx+side*(f.rx-2),f.cy+56,f.cx+side*(f.rx-10),f.cy+46);g.lineTo(f.cx+side*(f.rx-6),f.cy-6);g.closePath();g.fill();
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1.2;for(let k=0;k<4;k++){g.beginPath();g.moveTo(f.cx+side*(f.rx+12),f.cy-4+k*12);g.lineTo(f.cx+side*(f.rx-6),f.cy+k*12);g.stroke();}}
    // 붉은 술(화면 위로)
    g.fillStyle='#a8241a';for(let i=0;i<14;i++){g.beginPath();g.ellipse(f.cx+(R()-0.5)*30,-4+R()*10,4,12,(R()-0.5),0,7);g.fill();}}
  if(s.hat===3){// 붉은 두건: 이마를 감싼 천과 매듭, 위로 삐친 머리
    for(let i=0;i<60;i++){const x=f.cx-f.rx+R()*f.rx*2;g.strokeStyle=mix(d,0.7+R()*0.3);g.lineWidth=2;g.beginPath();g.moveTo(x,top+6);g.quadraticCurveTo(x+(R()-0.5)*20,top-20,x+(R()-0.5)*30,top-40-R()*20);g.stroke();}
    const band=()=>{g.moveTo(f.cx-f.rx-8,f.eyeY-26);g.quadraticCurveTo(f.cx,f.eyeY-52,f.cx+f.rx+8,f.eyeY-26);g.lineTo(f.cx+f.rx+6,f.eyeY-8);g.quadraticCurveTo(f.cx,f.eyeY-32,f.cx-f.rx-6,f.eyeY-8);g.closePath();};
    g.fillStyle=lin(g,0,f.eyeY-50,0,f.eyeY-8,[[0,'#c43a2a'],[1,'#6a1610']]);g.beginPath();band();g.fill();
    soft(g,band,3,()=>{for(let k=0;k<5;k++){g.strokeStyle='rgba(60,10,6,.5)';g.lineWidth=3;g.beginPath();g.moveTo(f.cx-f.rx+k*28,f.eyeY-40);g.lineTo(f.cx-f.rx+k*28+14,f.eyeY-14);g.stroke();}});
    g.fillStyle='#8a2216';g.beginPath();g.moveTo(f.cx+f.rx+4,f.eyeY-22);g.quadraticCurveTo(f.cx+f.rx+40,f.eyeY-10,f.cx+f.rx+34,f.eyeY+30);g.lineTo(f.cx+f.rx+22,f.eyeY+24);g.quadraticCurveTo(f.cx+f.rx+24,f.eyeY-2,f.cx+f.rx,f.eyeY-12);g.fill();}
  if(s.hat===4){// 윤건: 푸른 비단 두건
    const cap=()=>{g.moveTo(f.cx-f.rx-8,f.eyeY-20);g.bezierCurveTo(f.cx-f.rx-14,top-60,f.cx+f.rx+14,top-60,f.cx+f.rx+8,f.eyeY-20);g.quadraticCurveTo(f.cx,f.eyeY-46,f.cx-f.rx-8,f.eyeY-20);g.closePath();};
    g.fillStyle=lin(g,f.cx-f.rx,0,f.cx+f.rx,0,[[0,'#3a5a7e'],[0.4,'#2a4664'],[1,'#121e2e']]);g.beginPath();cap();g.fill();
    soft(g,cap,3,()=>{for(let k=-3;k<=3;k++){g.strokeStyle='rgba(10,20,30,.45)';g.lineWidth=3;g.beginPath();g.moveTo(f.cx+k*16,top-40);g.quadraticCurveTo(f.cx+k*18,top,f.cx+k*20,f.eyeY-28);g.stroke();}blob(g,f.cx-20,top-20,14,26,'rgba(200,220,240,.25)');});}
  if(s.hat===5){// 여인 쪽머리: 가운데 가르마, 높이 올린 머리, 비녀·꽃·구슬
    const crown=()=>{g.moveTo(f.cx-f.rx-10,f.cy);g.bezierCurveTo(f.cx-f.rx-16,top-40,f.cx+f.rx+16,top-40,f.cx+f.rx+10,f.cy);g.quadraticCurveTo(f.cx+f.rx-8,top+34,f.cx,top+16);g.quadraticCurveTo(f.cx-f.rx+8,top+34,f.cx-f.rx-10,f.cy);g.closePath();};
    g.fillStyle=d;g.beginPath();g.ellipse(f.cx,top-30,46,30,0,0,7);g.fill();g.beginPath();crown();g.fill();
    g.save();g.beginPath();crown();g.ellipse(f.cx,top-30,46,30,0,0,7);g.clip();for(let i=0;i<100;i++){const side=R()<0.5?-1:1;g.strokeStyle=mix(l,0.25+R()*0.3);g.lineWidth=1.1;g.beginPath();g.moveTo(f.cx+side*2,top+12);g.quadraticCurveTo(f.cx+side*(20+R()*30),top-10,f.cx+side*(f.rx+8),f.cy-10+R()*20);g.stroke();}g.restore();
    g.strokeStyle='#d8b048';g.lineWidth=3;g.beginPath();g.moveTo(f.cx-60,top-20);g.lineTo(f.cx+70,top-44);g.stroke();
    for(const [x,y,c,r] of [[f.cx+44,top-28,'#d85a74',9],[f.cx+58,top-18,'#f0c24a',7],[f.cx+30,top-40,'#e88aa0',7],[f.cx-40,top-30,'#d85a74',8]] as const){for(let k=0;k<5;k++){const a=k/5*Math.PI*2;blob(g,x+Math.cos(a)*r*0.6,y+Math.sin(a)*r*0.6,r*0.5,r*0.35,c,a);}blob(g,x,y,r*0.3,r*0.3,'#fff3b0');}
    g.strokeStyle='rgba(216,176,72,.9)';g.lineWidth=1.2;for(let k=0;k<3;k++){g.beginPath();g.moveTo(f.cx+64,top-40);g.lineTo(f.cx+66+k*4,top-10+k*6);g.stroke();blob(g,f.cx+66+k*4,top-8+k*6,2.4,2.4,'#8ad0c0');}}
}
function heldItem(g:G,s:PortraitSpec){
  // 꽉 찬 얼굴 초상이라 소품은 아래 모서리에 걸쳐 보인다
  if(s.item===1){g.save();g.translate(214,250);g.rotate(-0.3);for(let k=0;k<9;k++){const a=-Math.PI*0.95+k*0.13;g.fillStyle=k%2?'#f2ede2':'#e2dccc';g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a-0.06)*60,Math.sin(a-0.06)*60,Math.cos(a)*56,Math.sin(a)*56);g.lineTo(Math.cos(a+0.12)*56,Math.sin(a+0.12)*56);g.closePath();g.fill();}g.restore();}
  if(s.item===2){g.save();g.translate(226,196);g.rotate(0.42);g.fillStyle='#5a3a1e';g.fillRect(-5,-60,10,44);g.fillStyle='#d8b048';g.fillRect(-16,-18,32,7);g.fillStyle='#8a1f1a';g.beginPath();g.arc(0,-62,6,0,7);g.fill();g.restore();}
  if(s.item===3){g.strokeStyle='#4a2e18';g.lineWidth=7;g.beginPath();g.moveTo(236,S);g.lineTo(216,0);g.stroke();g.fillStyle='#b8261a';g.beginPath();g.moveTo(208,38);g.lineTo(226,38);g.lineTo(229,58);g.lineTo(205,58);g.fill();}
  if(s.item===4){g.save();g.translate(214,236);g.rotate(-0.35);g.fillStyle='#e8dcb8';g.fillRect(-30,-9,60,18);g.fillStyle='#6a3418';g.fillRect(-36,-11,7,22);g.fillRect(29,-11,7,22);g.fillStyle='#a8241a';g.fillRect(-3,-9,5,18);g.restore();}
  if(s.item===5){g.strokeStyle='#5a3418';g.lineWidth=6;g.beginPath();g.arc(250,170,90,Math.PI*0.6,Math.PI*1.18);g.stroke();g.strokeStyle='rgba(240,230,210,.8)';g.lineWidth=1.2;const a=Math.PI*0.6,b=Math.PI*1.18;g.beginPath();g.moveTo(250+Math.cos(a)*90,170+Math.sin(a)*90);g.lineTo(250+Math.cos(b)*90,170+Math.sin(b)*90);g.stroke();}
}
function finish(g:G,R:()=>number){
  // 칠한 그림의 결: 살짝 흐리고, 따뜻한 빛, 고운 입자, 가장자리 그늘
  const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d')!.drawImage(g.canvas,0,0);g.save();g.filter='blur(0.6px)';g.drawImage(c,0,0);g.restore();
  g.save();g.globalCompositeOperation='soft-light';g.fillStyle=lin(g,0,0,S,S,[[0,'rgba(255,220,170,.5)'],[0.55,'rgba(255,220,170,0)'],[1,'rgba(0,0,0,.35)']]);g.fillRect(0,0,S,S);g.restore();
  const img=g.getImageData(0,0,S,S),d=img.data;for(let i=0;i<d.length;i+=4){const n=(R()-0.5)*14;d[i]=Math.max(0,Math.min(255,d[i]!+n));d[i+1]=Math.max(0,Math.min(255,d[i+1]!+n));d[i+2]=Math.max(0,Math.min(255,d[i+2]!+n));}g.putImageData(img,0,0);
  g.fillStyle=rad(g,CX,120,90,190,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.55)']]);g.fillRect(0,0,S,S);
}
/** 초상 한 장을 캔버스(256×256)에 그린다. */
export function drawPortrait(g:G,s:PortraitSpec){
  const R=rng(PORTRAIT_KEYS.reduce((h,k)=>Math.imul(h^(s[k]+1),16777619)>>>0,2166136261)),f=faceOf(s);
  g.save();g.clearRect(0,0,S,S);g.lineCap='round';g.lineJoin='round';
  background(g,s,R);if(s.item===3||s.item===5)heldItem(g,s);
  // 얼굴을 화면에 꽉 차게(머리 꼭대기는 잘려도 좋다)
  g.save();g.translate(CX,160);g.scale(1.16,1.16);g.translate(-CX,-160);hairBack(g,s,f,R);shoulders(g,s,f);ears(g,s,f);faceSkin(g,s,f);
  ageMarks(g,s,f,R);eye(g,s,f,-1);eye(g,s,f,1);brows(g,s,f,R);nose(g,s,f);mouth(g,s,f);beard(g,s,f,R);
  if(s.hat!==2&&s.hat!==4)hairFront(g,s,f,R);headwear(g,s,f,R);g.restore();if(s.item!==3&&s.item!==5)heldItem(g,s);finish(g,R);g.restore();
}
const urls=new Map<string,string>();
/** 초상의 data URL(같은 값은 한 번만 그린다). 캔버스가 없으면(시험 환경) 빈 문자열. */
export function portraitURL(s:PortraitSpec){
  const key=PORTRAIT_KEYS.map(k=>s[k]).join(',');const hit=urls.get(key);if(hit)return hit;
  if(typeof document==='undefined')return '';
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d',{willReadFrequently:true})!;drawPortrait(g,s);
  const url=c.toDataURL('image/png');urls.set(key,url);return url;
}
