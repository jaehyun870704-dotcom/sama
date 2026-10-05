/**
 * 병종 도트 생성기 — 사양(unit-looks.ts)대로 64×64 도트 한 칸을 그린다(오른쪽을 본다).
 *
 * 자세 번호는 전장 시트와 같다.
 *   0 대기 · 1 들어 올림 · 2 내려침/찌름 · 3 숨 고르기
 *   8·9 막기 · 10·11 맞음 · 12·13 걷기(왼발·오른발)
 * 몸·갑옷·투구·무기·방패·짐·탈것을 따로 그려서, 같은 계열이라도 모양이 다르다.
 * DOM 없이 픽셀 배열만 다룬다(시험과 워커에서도 쓸 수 있다).
 */
import type {Look,Weapon,Metal,HorseCoat} from './unit-looks.ts';

export const PX=64;
export interface PixelImage{width:number;height:number;data:Uint8ClampedArray}
type C=number;
type Ramp=[C,C,C,C];

// ── 색
const hsl=(h:number,s:number,l:number):C=>{h=((h%360)+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return (Math.round((r+m)*255)<<16)|(Math.round((g+m)*255)<<8)|Math.round((b+m)*255);};
/** 색상각으로 네 단계(그늘·바탕·밝음·광) 색. -1은 흰 천, -2는 검은 천. */
function clothRamp(h:number,sat=.62):Ramp{
  if(h===-1)return [0x8c8a86,0xc9c5bc,0xe9e5da,0xfffcf2];
  if(h===-2)return [0x121216,0x26262e,0x3c3c48,0x5c5c6c];
  return [hsl(h,sat*.9,.2),hsl(h,sat,.36),hsl(h,sat*.95,.52),hsl(h,sat*.7,.7)];
}
const METAL:Record<Metal,Ramp>={
  iron:[0x23272e,0x4b535e,0x7b8693,0xbcc6d0],steel:[0x2a3442,0x5a6c80,0x95a9be,0xe0ecf6],
  gold:[0x4e3008,0x9c6a12,0xd9a832,0xfff0a2],bronze:[0x40260e,0x7c4c20,0xb07a38,0xe2b670],
  black:[0x0e0e12,0x23242c,0x3e404c,0x70748a],white:[0x6c7480,0xb4bcc6,0xdde3ea,0xffffff]};
const SKIN={light:[0x8a5638,0xc78d62,0xe8b88c,0xf6d4b0] as Ramp,tan:[0x6e4022,0xa76c3e,0xcc9060,0xe6b486] as Ramp,dark:[0x40220e,0x6c3c1c,0x94582e,0xb87a4c] as Ramp};
const LEATHER:Ramp=[0x2e1c10,0x5c3a20,0x8a5c34,0xb4824e];
const WOOD:Ramp=[0x34200e,0x63401e,0x92663a,0xbe9258];
const RATTAN:Ramp=[0x5a3e14,0x92702e,0xc49c52,0xe6c886];
const FUR:Ramp=[0x3a2a1c,0x6e5638,0x9e835e,0xcdb48e];
const HAIR={black:0x17120f,grey:0x77747a,white:0xe4e2dc,brown:0x4a2c18,red:0x8a2a12};
const HORSE:Record<HorseCoat,Ramp>={bay:[0x3a1c0c,0x6e3618,0xa05a2a,0xc8864e],black:[0x0e0c0c,0x23201f,0x3c3634,0x5e5654],
  white:[0x8a8c90,0xc6c8cc,0xe8eaec,0xffffff],red:[0x4a0e06,0x8a2210,0xc04222,0xe4744a],grey:[0x3e4248,0x6a7078,0x9aa0a8,0xc8ccd2],dun:[0x5a4024,0x8e6a3e,0xbe955e,0xdcb886]};
const ELE:Ramp=[0x3a3634,0x625c58,0x8a837d,0xb2aaa2];
const OUT=0x140d09;
const GOLD=METAL.gold,SILVER=METAL.white,BRONZE=METAL.bronze;

// ── 화판
class Pix{
  d=new Int32Array(PX*PX).fill(-1);
  set(x:number,y:number,c:C){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=PX||y>=PX)return;this.d[y*PX+x]=c;}
  get(x:number,y:number){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=PX||y>=PX)return -1;return this.d[y*PX+x]!;}
  rect(x:number,y:number,w:number,h:number,c:C){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c);}
  /** 바탕·위 광·오른쪽 아래 그늘이 있는 상자 */
  box(x:number,y:number,w:number,h:number,r:Ramp){x=Math.round(x);y=Math.round(y);this.rect(x,y,w,h,r[1]);for(let i=0;i<w;i++)this.set(x+i,y,r[2]);for(let j=0;j<h;j++)this.set(x,y+j,r[2]);for(let i=0;i<w;i++)this.set(x+i,y+h-1,r[0]);if(w>2)for(let j=1;j<h;j++)this.set(x+w-1,y+j,r[0]);}
  line(x0:number,y0:number,x1:number,y1:number,c:C,t=1){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*1.5));
    for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;if(t<=1)this.set(x,y,c);else{const r=(t-1)/2;for(let j=-r;j<=r+.01;j++)for(let i=-r;i<=r+.01;i++)this.set(x+i,y+j,c);}}}
  /** 굵은 막대(가운데 밝은 줄) */
  rod(x0:number,y0:number,x1:number,y1:number,r:Ramp,t=2){this.line(x0,y0,x1,y1,r[1],t);if(t>=2){const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1;this.line(x0-dy/l*.5,y0+dx/l*-.5,x1-dy/l*.5,y1+dx/l*-.5,r[2],1);}}
  ellipse(cx:number,cy:number,rx:number,ry:number,r:Ramp|C){const ramp=typeof r==='number'?null:r;
    for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const u=(x-cx)/rx,v=(y-cy)/ry,q=u*u+v*v;if(q>1.0)continue;
      if(!ramp){this.set(x,y,r as C);continue;}const light=-u*.55-v*.75;this.set(x,y,q>.72&&light<0?ramp[0]:light>.45&&q<.6?ramp[3]:light>.05?ramp[2]:ramp[1]);}}
  poly(pts:Array<[number,number]>,c:C){const ys=pts.map(p=>p[1]);const y0=Math.floor(Math.min(...ys)),y1=Math.ceil(Math.max(...ys));
    for(let y=y0;y<=y1;y++){const xs:number[]=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i]!,[bx,by]=pts[(i+1)%pts.length]!;if((ay<=y+.5&&by>y+.5)||(by<=y+.5&&ay>y+.5)){xs.push(ax+(y+.5-ay)/(by-ay)*(bx-ax));}}
      xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]!);x<Math.round(xs[k+1]!);x++)this.set(x,y,c);}}
  /** 바깥 테두리(투명 칸이 그림에 붙어 있으면 짙은 선) */
  outline(){const o=this.d.slice();for(let y=0;y<PX;y++)for(let x=0;x<PX;x++){if(this.d[y*PX+x]!>=0)continue;
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>this.get(x+dx!,y+dy!)>=0&&this.get(x+dx!,y+dy!)!==OUT))o[y*PX+x]=OUT;}this.d=o;}
  toImage(scale=1):PixelImage{const w=PX*scale,data=new Uint8ClampedArray(w*w*4);for(let y=0;y<w;y++)for(let x=0;x<w;x++){const c=this.d[Math.floor(y/scale)*PX+Math.floor(x/scale)]!;if(c<0)continue;const i=(y*w+x)*4;data[i]=c>>16&255;data[i+1]=c>>8&255;data[i+2]=c&255;data[i+3]=255;}return {width:w,height:w,data};}
}

// ── 자세
interface Pose{lean:number;bob:number;front:[number,number];back:[number,number];feetF:number;feetB:number;liftF:number;liftB:number;kind:'idle'|'windup'|'strike'|'guard'|'hurt'|'walk'}
function poseOf(n:number):Pose{
  switch(n){
    case 1:return {kind:'windup',lean:-1,bob:1,front:[-1,-8],back:[-4,3],feetF:4,feetB:-6,liftF:0,liftB:0};
    case 2:return {kind:'strike',lean:2,bob:2,front:[10,1],back:[6,4],feetF:8,feetB:-6,liftF:0,liftB:0};
    case 3:return {kind:'idle',lean:0,bob:1,front:[5,7],back:[-3,8],feetF:5,feetB:-4,liftF:0,liftB:0};
    case 8:case 9:return {kind:'guard',lean:-1,bob:2+(n-8),front:[6,2],back:[7,3],feetF:7,feetB:-6,liftF:0,liftB:0};
    case 10:case 11:return {kind:'hurt',lean:-3+(n-10),bob:n-10,front:[2,9],back:[-5,6],feetF:3,feetB:-5,liftF:0,liftB:1};
    case 12:return {kind:'walk',lean:1,bob:0,front:[4,8],back:[-2,8],feetF:7,feetB:-5,liftF:0,liftB:2};
    case 13:return {kind:'walk',lean:1,bob:1,front:[4,8],back:[-2,8],feetF:2,feetB:-1,liftF:2,liftB:0};
    default:return {kind:'idle',lean:0,bob:0,front:[5,7],back:[-3,8],feetF:5,feetB:-4,liftF:0,liftB:0};
  }
}
type Grip='one'|'pole'|'slash'|'bow'|'xbow'|'sling'|'fists'|'lift'|'none';
const GRIP:Record<Weapon,Grip>={sword:'one',dao:'one',dagger:'one',mace:'one',hammer:'one',fan:'one',bell:'one',sticks:'one',gourd:'one',flag:'pole',
  axe:'slash',greatBlade:'slash',guandao:'slash',spear:'pole',pike:'pole',ji:'pole',snakeSpear:'pole',javelin:'pole',staff:'pole',orbStaff:'pole',
  bow:'bow',longbow:'bow',crossbow:'xbow',repeater:'xbow',greatBow:'xbow',sling:'sling',boulder:'lift',fists:'fists',none:'none'};
/** 손 위치와 무기 각도(도, 0=앞, -90=위) */
function hold(w:Weapon,p:Pose,sh:[number,number]):{hand:[number,number];ang:number;back?:[number,number]}{
  const g=GRIP[w],[sx,sy]=sh,at=(dx:number,dy:number):[number,number]=>[sx+dx,sy+dy];
  const along=(h:[number,number],a:number,d:number):[number,number]=>[h[0]-Math.cos(a*Math.PI/180)*d,h[1]-Math.sin(a*Math.PI/180)*d];
  switch(g){
    case 'one':{const t={idle:[at(5,7),-60],windup:[at(-1,-8),-150],strike:[at(10,2),25],guard:[at(6,1),-85],hurt:[at(2,9),70],walk:[at(4,8),-40]}[p.kind] as [[number,number],number];return {hand:t[0],ang:t[1]};}
    case 'pole':{const t={idle:[at(6,6),-75],windup:[at(1,4),-8],strike:[at(11,3),4],guard:[at(6,3),-100],hurt:[at(3,8),-35],walk:[at(5,6),-62]}[p.kind] as [[number,number],number];return {hand:t[0],ang:t[1],back:along(t[0],t[1],7)};}
    case 'slash':{const t={idle:[at(6,6),-70],windup:[at(1,-6),-135],strike:[at(10,4),35],guard:[at(6,3),-95],hurt:[at(3,8),-30],walk:[at(5,6),-60]}[p.kind] as [[number,number],number];return {hand:t[0],ang:t[1],back:along(t[0],t[1],6)};}
    case 'bow':{const draw=p.kind==='windup'||p.kind==='strike';const hand=draw?at(10,1):at(7,6);return {hand,ang:draw?-90:-70,back:draw?(p.kind==='windup'?at(-1,1):at(4,1)):at(-2,8)};}
    case 'xbow':{const aim=p.kind==='windup'||p.kind==='strike'||p.kind==='idle';const hand=aim?at(9,3):at(6,7);return {hand,ang:p.kind==='strike'?-8:aim?0:30,back:aim?at(3,4):at(1,8)};}
    case 'sling':{const t={idle:[at(5,8),80],windup:[at(0,-10),-120],strike:[at(10,0),-20],guard:[at(5,4),60],hurt:[at(2,9),70],walk:[at(4,8),80]}[p.kind] as [[number,number],number];return {hand:t[0],ang:t[1]};}
    case 'fists':{const t={idle:[at(6,4),0],windup:[at(0,4),0],strike:[at(12,2),0],guard:[at(6,0),0],hurt:[at(2,9),0],walk:[at(4,7),0]}[p.kind] as [[number,number],number];return {hand:t[0],ang:t[1],back:p.kind==='strike'?at(1,5):at(3,4)};}
    case 'lift':{const up=p.kind==='windup'||p.kind==='idle'||p.kind==='walk';return {hand:up?at(3,-7):at(9,2),ang:0,back:up?at(-3,-7):at(6,2)};}
    default:return {hand:at(4,9),ang:80};
  }
}

// ── 무기
function drawWeapon(px:Pix,w:Weapon,hand:[number,number],ang:number,look:Look,ramps:{metal:Ramp;accent:Ramp},p:Pose){
  const a=ang*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),[hx,hy]=hand;
  const pt=(d:number,side=0):[number,number]=>[hx+dx*d-dy*side,hy+dy*d+dx*side];
  const steel=look.weaponHue!==undefined?[hsl(look.weaponHue,.5,.2),hsl(look.weaponHue,.55,.38),hsl(look.weaponHue,.5,.58),hsl(look.weaponHue,.4,.78)] as Ramp:METAL.steel;
  const gold=look.tier===3||look.trim==='gold';
  const shaft=(back:number,fwd:number,r=WOOD,t=2)=>{const [x0,y0]=pt(-back),[x1,y1]=pt(fwd);px.rod(x0,y0,x1,y1,r,t);};
  const blade=(from:number,to:number,width:number,r:Ramp,curve=0)=>{for(let d=from;d<=to;d+=.5){const k=(d-from)/Math.max(1,to-from),wv=width*(1-k*.55),c=curve*k*k;
    for(let s=-wv/2;s<=wv/2;s+=.5){const [x,y]=pt(d,s+c);px.set(x,y,s<-wv/2+1?r[3]:s>wv/2-1?r[0]:r[2]);}}};
  switch(w){
    case 'sword':{shaft(2,1,gold?GOLD:BRONZE,2);const [gx,gy]=pt(1);px.line(gx-dy*2,gy+dx*2,gx+dy*2,gy-dx*2,(gold?GOLD:BRONZE)[2],1);blade(2,15,2.5,steel);break;}
    case 'dao':{shaft(2,1,LEATHER,2);const [gx,gy]=pt(1);px.line(gx-dy*2,gy+dx*2,gx+dy*2,gy-dx*2,BRONZE[2],1);blade(2,13,3.5,steel,1.6);break;}
    case 'dagger':{shaft(1,1,LEATHER,2);blade(1,7,2.5,steel);break;}
    case 'mace':{shaft(3,10,WOOD,2);const [mx,my]=pt(12);px.ellipse(mx,my,3.4,3.4,gold?GOLD:METAL.iron);for(const s of [-1,1]){const [sx,sy]=pt(12,s*4);px.set(sx,sy,METAL.iron[2]);}break;}
    case 'hammer':{shaft(3,10,WOOD,2);const [mx,my]=pt(11);for(let s=-4;s<=4;s++)for(let d=-2;d<=2;d++){const [x,y]=pt(11+d,s);px.set(x,y,Math.abs(s)>=4?METAL.iron[0]:d<=-1?METAL.iron[3]:METAL.iron[1]);}void mx;void my;if(look.aura!==undefined){const [ax,ay]=pt(14);px.set(ax,ay,0xfff6a0);}break;}
    case 'axe':{shaft(7,16,WOOD,2);for(let d=8;d<=17;d+=.5)for(let s=0;s<=8.5-Math.abs(d-12.5)*.75;s+=.5){const edge=8.5-Math.abs(d-12.5)*.75;const [x,y]=pt(d,s+1);px.set(x,y,s>=edge-1?steel[3]:s<1.5?steel[0]:steel[2]);}const [kx,ky]=pt(16.5,-1.5);px.set(kx,ky,steel[1]);break;}
    case 'greatBlade':{shaft(7,6,WOOD,2);blade(6,21,8,steel,2.5);const [gx,gy]=pt(6);px.ellipse(gx,gy,1.6,1.6,gold?GOLD:BRONZE);break;}
    case 'guandao':{shaft(10,8,look.weaponHue!==undefined?[0x10301c,0x1c5a32,0x2c8a4c,0x5cbf7c]:WOOD,2);blade(8,23,7,steel,3);const [gx,gy]=pt(8);px.ellipse(gx,gy,2,2,GOLD);const [tx,ty]=pt(-9);px.ellipse(tx,ty,1.2,1.2,GOLD);break;}
    case 'spear':{shaft(9,15,WOOD,2);blade(15,20,3,steel);const [tx,ty]=pt(14.5);px.ellipse(tx-dy*1.2,ty+dx*1.2,1.6,1.6,ramps.accent);break;}
    case 'pike':{shaft(12,20,WOOD,2);blade(20,25,2.6,steel);const [tx,ty]=pt(19.5);px.ellipse(tx-dy*1.4,ty+dx*1.4,1.7,1.7,ramps.accent);break;}
    case 'ji':{shaft(10,16,gold?[0x3a1a08,0x7a3a12,0xa8582a,0xd08850]:WOOD,2);blade(16,22,2.6,steel);for(let d=13;d<=17;d++)for(let s=1;s<=1+(d-13)*.9;s++){const [x,y]=pt(d,-s-.5);px.set(x,y,s>=(d-13)*.9?steel[3]:steel[2]);}
      const [tx,ty]=pt(12.5);px.ellipse(tx,ty+1,1.5,2.2,ramps.accent);break;}
    case 'snakeSpear':{shaft(10,15,METAL.black,2);for(let d=15;d<=23;d++){const s=Math.sin((d-15)*1.2)*1.5;const [x,y]=pt(d,s);px.set(x,y,steel[2]);const [x2,y2]=pt(d,s+1);px.set(x2,y2,steel[1]);}break;}
    case 'javelin':{shaft(4,10,WOOD,1.5);blade(10,14,2.2,steel);break;}
    case 'staff':{shaft(10,14,WOOD,2);const [tx,ty]=pt(14);for(const s of [-1.5,1.5]){px.ellipse(tx-dy*s*1.4,ty+dx*s*1.4,1.4,1.4,gold?GOLD:BRONZE);}break;}
    case 'orbStaff':{shaft(10,13,gold?GOLD:WOOD,2);const [tx,ty]=pt(15.5);const hue=look.aura??190;px.ellipse(tx,ty,3,3,[hsl(hue,.6,.25),hsl(hue,.7,.45),hsl(hue,.8,.65),0xffffff]);
      const [cx,cy]=pt(13);px.line(cx-dy*2,cy+dx*2,cx+dy*2,cy-dx*2,GOLD[2],1);break;}
    case 'flag':{shaft(8,22,WOOD,2);const [tx,ty]=pt(22);const r=ramps.accent;px.poly([[tx,ty],[tx-10,ty+1],[tx-9,ty+5],[tx-11,ty+9],[tx,ty+8]],r[1]);px.line(tx,ty,tx-10,ty+1,r[2]);px.ellipse(tx-5,ty+4.5,1.6,1.6,GOLD);break;}
    case 'fan':{shaft(1,3,BRONZE,1);const [fx,fy]=pt(6);for(let k=-3;k<=3;k++){const b=a+k*.22;px.line(fx-Math.cos(a)*3,fy-Math.sin(a)*3,fx+Math.cos(b)*4,fy+Math.sin(b)*4,k%2?0xf4f0e6:0xdcd6c8,1);}px.ellipse(fx+dx*3,fy+dy*3,2.4,2.4,[0xb8b2a4,0xe8e4da,0xfffcf4,0xffffff]);break;}
    case 'bell':{shaft(1,5,BRONZE,1);const [bx,by]=pt(7);px.ellipse(bx,by,2.4,2.8,GOLD);px.set(bx,by+3,GOLD[0]);px.line(bx,by+3,bx-1,by+6,ramps.accent[2]);break;}
    case 'sticks':{shaft(1,7,WOOD,1);const [tx,ty]=pt(7);px.ellipse(tx,ty,1.3,1.3,ramps.accent);break;}
    case 'gourd':{const [gx,gy]=pt(2,2);px.ellipse(gx,gy+2,2.6,3,[0x6a4a10,0xb08624,0xd8b040,0xf4dc80]);px.ellipse(gx,gy-1.5,1.6,1.6,[0x6a4a10,0xb08624,0xd8b040,0xf4dc80]);px.set(gx,gy-3.3,0x8a2a12);break;}
    case 'bow':case 'longbow':{const L=w==='longbow'?13:10,draw=p.kind==='windup'||p.kind==='strike';
      for(let k=-L;k<=L;k++){const bend=(1-(k/L)**2)*(draw?3.2:2.4);px.set(hx+bend,hy+k,k%4===0?WOOD[3]:WOOD[1]);px.set(hx+bend+1,hy+k,WOOD[0]);}
      const sx=draw?hx-(p.kind==='windup'?9:4):hx-.5;px.line(hx,hy-L,sx,hy,0xe8e0cc);px.line(sx,hy,hx,hy+L,0xe8e0cc);
      if(p.kind==='windup'){px.line(sx,hy,hx+6,hy,WOOD[2]);px.set(hx+6,hy,steel[3]);px.set(hx+7,hy,steel[2]);}
      if(p.kind==='strike'){px.line(hx+8,hy-1,hx+16,hy-1,WOOD[2]);px.set(hx+17,hy-1,steel[3]);}break;}
    case 'crossbow':case 'repeater':case 'greatBow':{const big=w==='greatBow',L=big?13:10;px.rod(hx-L,hy,hx+3,hy,WOOD,2);px.line(hx+2,hy-(big?6:5),hx+2,hy+(big?6:5),WOOD[0],2);px.line(hx+2,hy-(big?6:5),hx+2,hy+(big?6:5),WOOD[2],1);
      px.line(hx+2,hy-(big?6:5),hx-3,hy,0xe8e0cc);px.line(hx+2,hy+(big?6:5),hx-3,hy,0xe8e0cc);
      if(w==='repeater')px.box(hx-6,hy-5,5,4,WOOD);if(big){px.box(hx-11,hy+1,3,3,METAL.iron);px.set(hx+4,hy,steel[3]);}
      if(p.kind!=='strike'){px.line(hx-2,hy-1,hx+5,hy-1,steel[2]);}else{px.line(hx+7,hy-1,hx+15,hy-1,WOOD[2]);px.set(hx+16,hy-1,steel[3]);}break;}
    case 'sling':{const [ex,ey]=pt(7);px.line(hx,hy,ex,ey,0xcab894);px.ellipse(ex,ey,1.6,1.6,[0x3c3a38,0x6c6864,0x9a958e,0xc4beb6]);break;}
    case 'boulder':{px.ellipse(hx,hy-4,6,5,[0x3c3a38,0x6c6864,0x9a958e,0xc4beb6]);px.set(hx-2,hy-6,0xd8d2ca);px.set(hx+2,hy-2,0x3c3a38);break;}
    case 'fists':{const [fx,fy]=hand;px.ellipse(fx,fy,1.8,1.8,ramps.accent);break;}
    case 'none':break;
  }
}

// ── 방패·왼손
function drawOff(px:Pix,look:Look,at:[number,number],p:Pose,ramps:{cloth:Ramp;accent:Ramp;metal:Ramp}){
  const [x,y]=at,trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE;
  switch(look.off){
    case 'round':{px.ellipse(x+2,y,7,7.5,WOOD);px.ellipse(x+2,y,5.6,6,LEATHER);for(let t=0;t<6.28;t+=.7){px.set(x+2+Math.cos(t)*6.4,y+Math.sin(t)*6.8,trim[2]);}px.line(x-2,y-4,x+6,y+4,ramps.accent[1],2);px.ellipse(x+2,y,2.2,2.2,trim);break;}
    case 'buckler':{px.ellipse(x+1,y,3.4,3.6,trim);px.ellipse(x+1,y,1.4,1.4,ramps.metal);break;}
    case 'tower':{const h=p.kind==='guard'?25:23,W=10;px.box(x-2,y-h/2,W,h,WOOD);px.rect(x-1,y-h/2+1,W-2,h-2,LEATHER[1]);px.poly([[x-1,y-h/2+1],[x+W-3,y-h/2+1],[x+W-3,y-h/2+6],[x-1,y-h/2+10]],ramps.accent[1]);px.line(x-1,y-h/2+1,x-1,y+h/2-2,LEATHER[2]);
      for(const yy of [y-h/2,y+h/2-1])px.line(x-2,yy,x+W-3,yy,trim[2]);px.ellipse(x+W/2-1,y+1,2.4,2.4,trim);for(const k of [-7,7])px.set(x+W/2-1,y+1+k,trim[3]);if(look.tier===3){px.line(x-2,y-h/2,x-2,y+h/2,trim[2]);px.line(x+W-3,y-h/2,x+W-3,y+h/2,trim[2]);}break;}
    case 'kite':{px.poly([[x-1,y-7],[x+6,y-7],[x+6,y+3],[x+2.5,y+8],[x-1,y+3]],ramps.cloth[1]);px.line(x-1,y-7,x+6,y-7,trim[2]);px.line(x+2.5,y-6,x+2.5,y+6,trim[2]);break;}
    case 'rattan':{px.ellipse(x+1,y,6,6,RATTAN);for(let r=2;r<=5;r+=1.5)for(let t=0;t<6.28;t+=.5)px.set(x+1+Math.cos(t)*r,y+Math.sin(t)*r,RATTAN[0]);px.ellipse(x+1,y,1.5,1.5,look.trim==='gold'?GOLD:RATTAN);break;}
    case 'drum':{px.ellipse(x+2,y+2,5,4.5,[0x5a1408,0x9a2a14,0xc84a2a,0xe8805a]);px.ellipse(x+3,y+2,3.4,3.6,[0xb89a6a,0xd8c094,0xf0dcb4,0xfff4dc]);for(const k of [-4,0,4])px.set(x+2+k*.6,y-2.3,GOLD[2]);break;}
    case 'scroll':{px.rod(x-1,y+2,x+5,y+2,[0x7a6a44,0xc8b88a,0xeadcb0,0xfff6dc],3);px.set(x-1,y+2,WOOD[0]);px.set(x+5,y+2,WOOD[0]);break;}
    case 'gourd':{px.ellipse(x+1,y+3,2.6,3,[0x6a4a10,0xb08624,0xd8b040,0xf4dc80]);px.ellipse(x+1,y,1.6,1.6,[0x6a4a10,0xb08624,0xd8b040,0xf4dc80]);break;}
    case 'dagger':{px.line(x,y,x+4,y-4,METAL.steel[2],1);px.set(x,y,LEATHER[1]);break;}
    case 'sword':{px.line(x,y+1,x+8,y-6,METAL.steel[2],1);px.line(x,y+1,x+1,y,BRONZE[2],1);break;}
    default:break;
  }
}

// ── 짐(등 뒤)
function drawPack(px:Pix,look:Look,bx:number,by:number,ramps:{accent:Ramp}){
  switch(look.pack){
    case 'quiver':{px.box(bx-4,by-2,3,10,LEATHER);for(const k of [0,1,2])px.line(bx-4+k,by-2,bx-5+k,by-6,k===1?ramps.accent[2]:0xe8e0cc);break;}
    case 'javelins':{for(const k of [0,1,2,3])px.line(bx-6+k,by+9,bx-2+k,by-9,WOOD[1+(k%2)]!);for(const k of [0,1,2,3])px.set(bx-2+k,by-10,METAL.steel[3]);px.box(bx-6,by+2,6,3,LEATHER);break;}
    case 'stones':{px.ellipse(bx-3,by+8,3.5,3,[0x3a2a18,0x6a5030,0x947446,0xbca070]);break;}
    case 'wood':{px.box(bx-7,by-2,5,12,WOOD);for(const k of [0,4,8])px.line(bx-7,by-2+k,bx-3,by-2+k,WOOD[0]);px.line(bx-5,by-4,bx-5,by-2,WOOD[1]);break;}
    case 'medicine':{px.box(bx-7,by,6,8,[0x40280e,0x7a5226,0xa8783e,0xd0a464]);px.line(bx-6,by+3,bx-2,by+3,0xc0302a);px.line(bx-4,by+1,bx-4,by+5,0xc0302a);break;}
    case 'bigDrum':{px.ellipse(bx-6,by+2,5.5,7,[0x5a1408,0x9a2a14,0xc84a2a,0xe8805a]);px.ellipse(bx-5,by+2,3,5.2,[0xb89a6a,0xd8c094,0xf0dcb4,0xfff4dc]);for(const k of [-4,0,4])px.set(bx-9,by+2+k,GOLD[2]);break;}
    case 'rope':{for(let t=0;t<6.28;t+=.35){px.set(bx-4+Math.cos(t)*3.5,by+4+Math.sin(t)*3.5,0xc8b07a);px.set(bx-4+Math.cos(t)*2.2,by+4+Math.sin(t)*2.2,0x9a8050);}break;}
    default:break;
  }
}

// ── 머리·투구
function drawHead(px:Pix,look:Look,hx:number,hy:number,ramps:{cloth:Ramp;accent:Ramp;metal:Ramp},hurt:boolean){
  const skin=SKIN[look.skin??'light'],hair=HAIR[look.hair??'black'],trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE;
  const m=ramps.metal,ac=ramps.accent;
  // 머리 뒤 장식(깃·꼬리)은 얼굴보다 먼저
  if(look.helm==='pheasant'){for(const k of [0,1])for(let t=0;t<=1;t+=.04){const x=hx-1+k*2-t*14+Math.sin(t*3)*2,y=hy-6-t*16+t*t*12;px.set(x,y,t>.8?0xfff4e0:k?0xc8a050:0x9a6a30);}}
  if(look.helm==='tallPlume'||look.helm==='plume'){const tall=look.helm==='tallPlume'?11:8;for(let k=0;k<=tall;k++){const x=hx-1-k*.55,y=hy-7-k*.9;px.set(x,y,ac[2]);px.set(x-1,y,ac[1]);px.set(x+1,y+.5,ac[0]);}}
  if(look.helm==='headband'){px.line(hx-6,hy-2,hx-9,hy+2,ac[1],1);px.line(hx-6,hy-1,hx-8,hy+4,ac[0],1);}
  if(look.helm==='hood'||look.helm==='veil'){px.poly([[hx-6,hy-6],[hx+3,hy-7],[hx+5,hy-3],[hx-1,hy-1],[hx-2,hy+8],[hx-7,hy+7]],look.helm==='veil'?ac[2]:ramps.cloth[1]);}
  // 얼굴
  px.ellipse(hx,hy,6,6.2,skin);
  px.rect(hx-5,hy-1,2,3,skin[1]);px.set(hx-4,hy,skin[0]); // 귀
  // 머리칼(투구 없으면)
  const capped=['kettle','plume','tallPlume','horned','lion','mask','crown','scholar','cap','rattanHat','straw','turban','fur','pheasant','hood','veil'].includes(look.helm);
  if(!capped||look.helm==='scholar'||look.helm==='crown'){px.poly([[hx-6,hy-2],[hx-5,hy-6],[hx,hy-7],[hx+5,hy-5],[hx+5,hy-3],[hx+1,hy-4],[hx-3,hy-3],[hx-3,hy+3],[hx-6,hy+3]],look.helm==='bald'?skin[2]:hair);}
  if(look.female){px.poly([[hx-6,hy-3],[hx-8,hy+6],[hx-5,hy+8],[hx-3,hy]],hair);}
  // 눈·눈썹·입
  const ex=hx+2.5,ey=hy;
  if(look.eyepatch){px.rect(ex-1,ey-1,3,2,0x111111);px.line(ex-1,ey-1,hx-5,hy-3,0x111111);}else{px.set(ex,ey,hurt?0x2a1a14:0x1a1210);px.set(ex+1,ey,hurt?skin[0]:0x1a1210);px.set(ex,ey-1,skin[3]);}
  px.line(ex-1,ey-2,ex+2,ey-2,look.hair==='white'||look.hair==='grey'?hair:0x2a1a10);
  px.set(hx+5,hy+1,skin[1]); // 코
  px.line(hx+2,hy+3,hx+4,hy+3,hurt?0x6a2a20:skin[0]);
  // 수염
  const bc=look.hair==='white'?0xe8e6e0:look.hair==='grey'?0x8a8890:look.hair==='red'?0x8a2a12:0x1e1612;
  switch(look.beard){
    case 'stubble':for(let x=hx;x<=hx+4;x+=2)px.set(x,hy+4,skin[0]);break;
    case 'short':px.poly([[hx-1,hy+2],[hx+5,hy+2],[hx+4,hy+6],[hx,hy+6]],bc);px.line(hx+2,hy+3,hx+4,hy+3,skin[0]);break;
    case 'goatee':px.line(hx+1,hy+2,hx+5,hy+2,bc);px.poly([[hx+2,hy+4],[hx+4,hy+4],[hx+3,hy+8]],bc);break;
    case 'long':px.line(hx+1,hy+2,hx+5,hy+2,bc);px.poly([[hx-1,hy+3],[hx+5,hy+3],[hx+4,hy+9],[hx+2,hy+13],[hx,hy+9]],bc);px.line(hx+2,hy+4,hx+2,hy+11,look.hair==='white'?0xffffff:0x3a2a20);break;
    case 'full':px.poly([[hx-3,hy],[hx+5,hy+2],[hx+5,hy+7],[hx+1,hy+9],[hx-3,hy+5]],bc);px.line(hx+2,hy+3,hx+4,hy+3,skin[0]);px.set(ex,ey,0x1a1210);break;
    default:break;
  }
  // 투구·관
  if(look.helm==='mask'&&look.armor==='night'){px.poly([[hx-7,hy-5],[hx-1,hy-8],[hx+5,hy-6],[hx+6,hy-2],[hx-2,hy-1],[hx-2,hy+6],[hx-7,hy+6]],ramps.cloth[0]);px.line(hx-1,hy-8,hx+5,hy-6,ramps.cloth[2]);px.rect(hx+1,hy+1,6,4,ramps.cloth[1]);px.line(hx-7,hy-3,hx-11,hy+1,ac[1]);px.line(hx-7,hy-2,hx-10,hy+3,ac[0]);return;}
  switch(look.helm){
    case 'topknot':px.ellipse(hx-2,hy-8,2.2,2,hair);px.line(hx-5,hy-8,hx+1,hy-9,GOLD[2]);break;
    case 'headband':px.line(hx-6,hy-3,hx+5,hy-4,ac[1],2);px.line(hx-6,hy-3,hx+5,hy-4,ac[2],1);break;
    case 'cap':px.poly([[hx-6,hy-2],[hx-6,hy-6],[hx-2,hy-9],[hx+3,hy-8],[hx+5,hy-4],[hx+5,hy-3]],0x2a2018);px.line(hx-5,hy-6,hx+3,hy-7,0x4a3a2a);px.box(hx-3,hy-11,4,3,[0x1a140e,0x2a2018,0x4a3a2a,0x6a5a48]);break;
    case 'kettle':case 'plume':case 'tallPlume':case 'horned':case 'mask':{
      px.ellipse(hx,hy-4,6.2,4.6,m);px.rect(hx-7,hy-2,13,2,m[0]);px.line(hx-7,hy-2,hx+5,hy-2,trim[2]);px.poly([[hx-7,hy-1],[hx-4,hy-1],[hx-4,hy+5],[hx-8,hy+4]],m[1]); // 목 가리개
      px.ellipse(hx,hy-9,1.4,1.4,look.tier>=2?trim:m);
      if(look.helm==='horned'){for(const s of [-1,1])for(let t=0;t<=1;t+=.1){px.set(hx+s*4+s*t*4,hy-6-t*6+t*t*3,t>.6?0xeee6d4:0xc8b894);}}
      if(look.helm==='mask'&&look.armor!=='night'){px.rect(hx+1,hy+1,5,4,m[1]);px.line(hx+1,hy+1,hx+5,hy+1,m[2]);px.set(ex,ey,0xff5030);px.set(ex+1,ey,0xff5030);}
      if(look.helm==='tallPlume'){for(const s of [-1,1])px.line(hx+s*5,hy-5,hx+s*8,hy-9,trim[2],1);}
      break;}
    case 'lion':{px.ellipse(hx,hy-4,6.4,4.8,m);px.rect(hx-7,hy-2,13,2,m[0]);for(let k=0;k<9;k++)px.set(hx-7+k*.6,hy-9+Math.abs(k-4)*.6,ac[k%2+1]!);
      px.poly([[hx-1,hy-9],[hx+6,hy-8],[hx+7,hy-5],[hx+3,hy-5]],ac[1]);px.set(hx+5,hy-7,0x1a1210);px.line(hx+3,hy-5,hx+7,hy-5,0xf0e6d0);px.poly([[hx-7,hy-1],[hx-4,hy-1],[hx-4,hy+5],[hx-8,hy+4]],ac[0]);break;}
    case 'crown':{px.rect(hx-4,hy-8,8,3,GOLD[1]);px.line(hx-4,hy-8,hx+3,hy-8,GOLD[3]);for(const k of [-3,0,3])px.set(hx+k,hy-9,GOLD[2]);px.ellipse(hx,hy-7,1,1,0x2ad08a);px.line(hx-5,hy-9,hx+5,hy-10,0x1a1a1a);break;}
    case 'scholar':{px.poly([[hx-4,hy-6],[hx+3,hy-6],[hx+4,hy-12],[hx-3,hy-11]],0x16161c);px.line(hx-3,hy-11,hx+4,hy-12,0x40404c);px.line(hx-4,hy-6,hx+3,hy-6,0x40404c);px.line(hx+3,hy-5,hx+3,hy+2,0x16161c);break;}
    case 'rattanHat':case 'straw':{const r=look.helm==='straw'?[0x7a5a20,0xb89040,0xdcb860,0xf0d890] as Ramp:RATTAN;px.poly([[hx-10,hy-3],[hx,hy-11],[hx+10,hy-3],[hx+8,hy-2],[hx-8,hy-2]],r[1]);px.line(hx-10,hy-3,hx,hy-11,r[2]);for(let k=-8;k<=8;k+=3)px.line(hx,hy-11,hx+k,hy-3,r[0]);px.line(hx-10,hy-3,hx+10,hy-3,r[0]);break;}
    case 'turban':{px.ellipse(hx-.5,hy-5,6.4,3.8,ac);for(let k=-5;k<=5;k+=2)px.line(hx+k,hy-8,hx+k-2,hy-2,ac[0]);break;}
    case 'fur':{px.ellipse(hx,hy-5,6.4,4,FUR);for(let k=-6;k<=6;k+=2)px.set(hx+k,hy-2,FUR[3]);px.poly([[hx-6,hy-3],[hx-3,hy-3],[hx-3,hy+3],[hx-7,hy+2]],FUR[1]);break;}
    case 'feather':{for(const [k,c] of [[-3,ac[2]],[0,0xf4f0e6],[3,ac[1]]] as Array<[number,C]>){px.line(hx+k*.7,hy-4,hx+k-1,hy-14+Math.abs(k),c,1);px.set(hx+k-1,hy-14+Math.abs(k),c);}px.line(hx-6,hy-3,hx+5,hy-4,ac[1],2);break;}
    case 'bald':px.set(hx-1,hy-5,skin[3]);px.set(hx,hy-5,skin[3]);for(const k of [-2,0,2])px.set(hx+k,hy-3,skin[0]);break;
    case 'flower':px.ellipse(hx-3,hy-6,2.6,2.2,hair);px.ellipse(hx-1,hy-7,1.6,1.6,[hsl(330,.7,.4),hsl(330,.7,.6),hsl(330,.7,.75),0xffffff]);px.line(hx-5,hy-7,hx+2,hy-9,GOLD[2]);break;
    case 'veil':px.ellipse(hx-2,hy-6,3,2.4,hair);px.line(hx-6,hy-5,hx+4,hy-6,GOLD[2]);break;
    case 'hood':px.line(hx-6,hy-6,hx+4,hy-7,ramps.cloth[2]);break;
    default:break;
  }
}

// ── 몸통(갑옷)
function drawTorso(px:Pix,look:Look,x:number,top:number,hip:number,lean:number,ramps:{cloth:Ramp;accent:Ramp;metal:Ramp},robeLen:number){
  const m=ramps.metal,cl=ramps.cloth,ac=ramps.accent,trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE,skin=SKIN[look.skin??'light'];
  const big=look.build==='big'?1:look.build==='slim'?-1:0,w=14+big*2,L=x-w/2,tl=L+lean;
  const body=(c:C)=>px.poly([[tl,top],[tl+w,top],[L+w+.5,hip],[L-.5,hip]],c);
  switch(look.armor){
    case 'robe':case 'monkRobe':{
      // 긴 옷: 어깨에서 밑단으로 퍼지고, 접힌 주름·안섶·띠·밑단 장식
      const hemL=L-4,hemR=L+w+4,hemY=top+robeLen;
      px.poly([[tl+1,top],[tl+w-1,top],[hemR,hemY],[hemL,hemY]],cl[1]);
      px.poly([[tl+1,top],[tl+3,top],[hemL+3,hemY],[hemL,hemY]],cl[2]);
      px.poly([[tl+w-3,top],[tl+w-1,top],[hemR,hemY],[hemR-4,hemY]],cl[0]);
      for(const f of [.38,.62])px.line(tl+w*f,top+8,L+w*f+(f-.5)*6,hemY-1,cl[0]);
      px.poly([[tl+w*.55,top],[tl+w*.2,top+7],[tl+w*.35,top+7]],0xf2ece0);px.poly([[tl+w*.55,top],[tl+w*.85,top+6],[tl+w*.7,top+7]],0xd8d0c0);
      px.rect(L-1,hip-2,w+2,3,ac[1]);px.line(L-1,hip-2,L+w+1,hip-2,ac[2]);px.line(L+w-3,hip+1,L+w-1,hip+7,ac[1]);px.set(L+w-2,hip+8,ac[2]);
      px.line(hemL,hemY-1,hemR,hemY-1,look.trim&&look.trim!=='none'?trim[2]:ac[1]);px.line(hemL,hemY,hemR,hemY,cl[0]);
      if(look.armor==='monkRobe'){px.poly([[tl+w*.5,top],[tl+w,top],[tl+w,top+6]],skin[1]);for(let k=0;k<6;k++)px.set(tl+w*.35+k*1.3,top+1+k*1.2,0x5a2a10);}
      break;}
    case 'bare':body(skin[1]);px.line(tl+3,top+3,tl+5,top+5,skin[0]);px.line(tl+8,top+3,tl+6,top+5,skin[0]);px.line(tl+w/2,top+6,L+w/2,hip-3,skin[0]);px.rect(L-1,hip-2,w+2,2,ac[1]);break;
    case 'vest':body(skin[1]);px.poly([[tl,top],[tl+5,top],[L+4,hip],[L-.5,hip]],LEATHER[1]);px.poly([[tl+w-3,top],[tl+w,top],[L+w+.5,hip],[L+w-4,hip]],LEATHER[1]);px.rect(L-1,hip-2,w+2,2,ac[1]);break;
    case 'tunic':body(cl[1]);px.line(tl+1,top,L+1,hip,cl[2]);px.line(tl+w*.5,top,tl+w*.25,top+5,cl[0]);px.line(tl+w*.5,top,tl+w*.75,top+5,cl[0]);px.rect(L-1,hip-2,w+2,2,LEATHER[0]);px.set(L+w*.6,hip-1,BRONZE[2]);break;
    case 'apron':body(cl[1]);px.poly([[tl+3,top+3],[tl+w-1,top+3],[L+w,hip+6],[L+3,hip+6]],LEATHER[1]);px.line(tl+3,top+3,tl+w-1,top+3,LEATHER[2]);px.rect(L-1,hip-2,w+2,2,LEATHER[0]);break;
    case 'night':body(cl[1]);for(let k=top+2;k<hip;k+=3)px.line(tl+(k-top)/(hip-top)*-lean,k,L+w-(k-top)/(hip-top)*-lean,k-1,cl[0]);px.rect(L-1,hip-2,w+2,2,ac[1]);break;
    case 'fur':body(cl[1]);px.poly([[tl-1,top],[tl+w+1,top],[L+w,top+7],[L,top+7]],FUR[1]);for(let k=0;k<12;k++)px.set(tl+(k*5)%w,top+1+(k*3)%6,FUR[k%2?3:0]);px.rect(L-1,hip-2,w+2,2,LEATHER[0]);break;
    case 'leather':body(cl[1]);px.poly([[tl+1,top+1],[tl+w-1,top+1],[L+w-1,hip-1],[L+1,hip-1]],LEATHER[1]);for(let k=top+3;k<hip-2;k+=3)px.line(tl+2,k,tl+w-2,k,LEATHER[0]);px.line(tl+1,top+1,L+1,hip-1,LEATHER[2]);px.rect(L-1,hip-2,w+2,2,LEATHER[0]);px.set(L+w*.6,hip-1,BRONZE[2]);break;
    case 'rattan':body(RATTAN[1]);for(let k=top;k<hip;k+=2)for(let i=0;i<w;i+=2)px.set(L+i+((k/2)%2),k,RATTAN[(i+k)%4===0?3:0]);px.rect(L-1,hip-2,w+2,2,ac[1]);break;
    case 'lamellar':case 'scale':case 'plate':{
      body(m[1]);
      if(look.armor==='lamellar'){for(let k=top+1;k<hip-1;k+=2){px.line(L,k,L+w,k,m[0]);for(let i=1;i<w;i+=3)px.set(L+i+((k>>1)%2),k+1,m[2]);}}
      else if(look.armor==='scale'){for(let k=top+1;k<hip-1;k+=2)for(let i=0;i<w;i+=2){px.set(L+i+((k>>1)%2),k,m[2]);px.set(L+i+((k>>1)%2),k+1,m[0]);}px.ellipse(tl+w*.6,top+4.5,2.2,2.2,trim);}
      else{px.poly([[tl+1,top+1],[tl+w-1,top+1],[tl+w-2,top+7],[tl+2,top+7]],m[2]);px.line(tl+2,top+7,tl+w-2,top+7,m[0]);px.rect(L+1,top+9,w-2,hip-top-11,m[1]);px.line(L+1,top+9,L+w-2,top+9,m[3]);}
      px.line(tl,top,L,hip,m[3]);
      if(look.trim&&look.trim!=='none'){px.line(tl,top,tl+w,top,trim[2]);px.line(L,hip-1,L+w,hip-1,trim[2]);}
      px.rect(L-1,hip-2,w+2,2,look.tier>=3?trim[1]:LEATHER[0]);px.set(L+w*.6,hip-1,trim[3]);
      break;}
  }
}
/** 허리 아래 치마 갑(다리 위) */
function drawSkirt(px:Pix,look:Look,x:number,hip:number,ramps:{cloth:Ramp;metal:Ramp;accent:Ramp}){
  if(look.armor==='robe'||look.armor==='monkRobe')return;
  const big=look.build==='big'?1:0,L=x-7-big,w=14+big*2,m=ramps.metal,cl=ramps.cloth,trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE;
  if(['lamellar','scale','plate'].includes(look.armor)){const len=look.armor==='plate'?7:6;px.poly([[L-1,hip],[L+w+1,hip],[L+w+2,hip+len],[L-2,hip+len]],m[1]);for(let k=hip+1;k<hip+len;k+=2)px.line(L-1,k,L+w+1,k,m[0]);px.line(L+w/2,hip,L+w/2,hip+len,m[0]);if(look.trim&&look.trim!=='none')px.line(L-2,hip+len-1,L+w+2,hip+len-1,trim[2]);}
  else if(look.armor==='rattan'){px.poly([[L-1,hip],[L+w+1,hip],[L+w+2,hip+5],[L-2,hip+5]],RATTAN[1]);for(let i=0;i<w+2;i+=2)px.line(L-1+i,hip,L-1+i,hip+5,RATTAN[0]);}
  else if(look.armor==='tunic'||look.armor==='leather'||look.armor==='fur'||look.armor==='apron'){px.poly([[L,hip],[L+w,hip],[L+w+1,hip+5],[L-1,hip+5]],cl[1]);px.line(L+w/2,hip,L+w/2,hip+5,cl[0]);px.line(L-1,hip+4,L+w+1,hip+4,cl[0]);}
}
/** 어깨 갑(2단 이상) */
function drawPauldron(px:Pix,look:Look,x:number,y:number,ramps:{metal:Ramp}){
  if(look.tier<2||['robe','monkRobe','bare','vest','night','rattan'].includes(look.armor))return;
  const trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE,big=look.tier===3?1:0;
  px.ellipse(x,y,3.4+big,2.6+big*.6,ramps.metal);px.line(x-3-big,y+2,x+3+big,y+2,look.tier===3?trim[2]:ramps.metal[0]);
  if(look.tier===3){px.set(x,y-1,trim[3]);px.set(x+1,y-1,trim[2]);}
}

// ── 팔·다리
function limb(px:Pix,a:[number,number],b:[number,number],r:Ramp,t=3){px.line(a[0],a[1],b[0],b[1],r[0],t);px.line(a[0]-.5,a[1]-.5,b[0]-.5,b[1]-.5,r[1],Math.max(1,t-1));}
function sleeveRamp(look:Look,ramps:{cloth:Ramp;metal:Ramp}):Ramp{
  if(look.armor==='bare'||look.armor==='vest')return SKIN[look.skin??'light'];
  if(look.armor==='plate'||(look.armor==='scale'&&look.tier===3))return ramps.metal;
  if(look.armor==='rattan')return RATTAN;
  if(look.armor==='fur')return FUR;
  return ramps.cloth;
}
function legs(px:Pix,look:Look,x:number,hip:number,ground:number,p:Pose,ramps:{cloth:Ramp;metal:Ramp}){
  const trou=look.armor==='bare'||look.armor==='vest'?[0x2a2018,0x4a3a2a,0x6a5640,0x8a7660] as Ramp:look.armor==='night'?ramps.cloth:[0x2a2622,0x4e463e,0x6e655a,0x8e8478] as Ramp;
  const boot=look.tier>=2&&['lamellar','scale','plate'].includes(look.armor)?ramps.metal:[0x1a120c,0x3a2818,0x5a4028,0x7a5a3c] as Ramp;
  for(const [fx,lift,front] of [[p.feetB,p.liftB,false],[p.feetF,p.liftF,true]] as Array<[number,number,boolean]>){
    const hx=x+(front?2:-2),kx=x+fx*.55+(front?1:-1),ky=hip+(ground-hip)*.5-lift,ax=x+fx,ay=ground-2-lift;
    const r=front?trou:[trou[0],trou[0],trou[1],trou[2]] as Ramp;
    limb(px,[hx,hip+1],[kx,ky],r,5);limb(px,[kx,ky],[ax,ay],r,4);
    px.box(ax-2,ay-1,6,3,boot);if(look.tier>=3&&boot===ramps.metal)px.set(ax,ay-1,GOLD[2]);
  }
}

// ── 망토·깃발(등)
function drawCape(px:Pix,x:number,top:number,bottom:number,lean:number,swing:number,ramps:{accent:Ramp;cloth:Ramp},look:Look){
  const c=look.tier===3||look.trim==='gold'?ramps.accent:ramps.cloth;const trim=look.trim==='gold'?GOLD:look.trim==='silver'?SILVER:BRONZE;
  px.poly([[x+lean+1,top],[x+lean-4,top],[x-9-swing,bottom],[x-2-swing,bottom+1],[x+1,top+6]],c[0]);
  px.poly([[x+lean,top+1],[x+lean-3,top+1],[x-8-swing,bottom-1],[x-3-swing,bottom]],c[1]);
  px.line(x-9-swing,bottom,x-2-swing,bottom+1,trim[2]);
}
function drawBanners(px:Pix,x:number,top:number,n:number,ramps:{accent:Ramp},look:Look){
  const trim=look.trim==='silver'?SILVER:GOLD;
  for(let k=0;k<n;k++){const bx=x-4-k*3,ty=top-14+k*3;px.line(bx,ty,bx,top+8,WOOD[0],1);px.poly([[bx,ty+1],[bx-6,ty+1],[bx-5,ty+4],[bx-6,ty+8],[bx,ty+8]],ramps.accent[1]);px.line(bx-6,ty+1,bx,ty+1,ramps.accent[2]);px.set(bx,ty,trim[3]);px.set(bx-3,ty+4,trim[2]);}
}

// ── 말·코끼리
function drawHorse(px:Pix,look:Look,p:Pose,ramps:{cloth:Ramp;accent:Ramp;metal:Ramp}){
  const r=HORSE[look.horse??'bay'],G=60,bob=p.kind==='walk'?(p.bob?1:0):0,rear=p.kind==='strike'?3:p.kind==='windup'?1:0;
  const mane=look.horse==='white'||look.horse==='grey'?0xeceef2:look.horse==='dun'?0x2a1c10:look.horse==='red'?0x3a0a04:0x120c0a;
  const by=46-bob,trim=look.trim==='gold'||look.tier===3?GOLD:look.trim==='silver'?SILVER:BRONZE;
  const leg=(x:number,ph:number,dark:boolean,front:boolean)=>{const sw=p.kind==='walk'?Math.sin(ph+(p.bob?Math.PI:0))*3:0,lift=front?rear:0;
    const c:Ramp=dark?[r[0],r[0],r[1],r[1]]:r;limb(px,[x,by+3-lift],[x+sw*.4+(front&&rear?2:0),by+9-lift*1.5],c,4);limb(px,[x+sw*.4+(front&&rear?2:0),by+9-lift*1.5],[x+sw,G-2-lift*1.5],c,3);px.rect(x+sw-1,G-2-lift*1.5,4,2,0x1a1210);};
  leg(17,0,true,false);leg(42,1.5,true,true);
  // 꼬리
  px.poly([[13,by-5],[8,by-1],[7,by+9],[10,by+10],[13,by+2],[15,by-2]],mane);
  // 몸통·가슴
  px.ellipse(29,by,17,8,r);px.ellipse(43,by-2+(-rear*.3),6.5,6.5,r);
  // 목·머리(앞발을 들면 같이 든다)
  const ny=by-rear;
  px.poly([[39,ny-5],[46,ny-17],[53,ny-15],[49,ny],[42,ny+2]],r[1]);px.line(39,ny-5,46,ny-17,r[2]);px.line(49,ny,53,ny-15,r[0]);
  px.poly([[46,ny-19],[52,ny-21],[61,ny-14],[61,ny-10],[56,ny-9],[50,ny-12],[46,ny-15]],r[1]);px.line(46,ny-19,52,ny-21,r[2]);px.line(52,ny-21,61,ny-14,r[2]);px.line(56,ny-9,61,ny-10,r[0]);
  px.poly([[48,ny-20],[49,ny-24],[51,ny-20]],r[1]);px.set(53,ny-17,0x0a0808);px.set(54,ny-17,r[3]);px.set(60,ny-12,r[0]);
  for(let k=0;k<12;k++){const t=k/11;px.set(46-t*7,ny-18+t*13,mane);px.set(45-t*7,ny-17+t*13,mane);}
  // 굴레·고삐
  px.line(50,ny-19,57,ny-10,0x2a1a10);px.line(57,ny-11,36,by-9,0x6a4a2a);
  leg(21,3,false,false);leg(39,4.5,false,true);
  // 마의(2단)·마갑(3단)
  if(look.barding===1){px.poly([[16,by-6],[41,by-6],[43,by+5],[14,by+5]],ramps.cloth[1]);px.line(16,by-6,41,by-6,ramps.cloth[2]);for(let k=14;k<=43;k+=2)px.set(k,by+6,trim[2]);
    px.poly([[40,ny-4],[46,ny-15],[50,ny-13],[47,ny-1]],ramps.cloth[1]);}
  else if(look.barding===2){const m=ramps.metal;px.poly([[14,by-7],[43,by-7],[45,by+6],[12,by+6]],m[1]);for(let k=by-6;k<by+6;k+=2)for(let i=13;i<45;i+=2)px.set(i+((k>>1)%2),k,m[(i+k)%3===0?3:0]);
    px.poly([[39,ny-5],[46,ny-17],[52,ny-15],[48,ny+1]],m[1]);for(let k=0;k<6;k++)px.line(41+k,ny-4-k*2,48+k*.5,ny-2-k*2,m[0]);
    px.poly([[47,ny-20],[52,ny-21],[60,ny-14],[57,ny-12],[50,ny-14]],m[2]);px.line(12,by+6,45,by+6,trim[2]);px.ellipse(52,ny-18,1.2,1.2,trim);}
  px.box(24,by-10,11,4,look.barding===0?LEATHER:[ramps.cloth[0],ramps.cloth[0],ramps.cloth[1],ramps.cloth[2]]);px.line(24,by-10,34,by-10,trim[2]);
  return {seatX:29,seatY:by-9};
}
function drawElephant(px:Pix,look:Look,p:Pose,ramps:{cloth:Ramp;accent:Ramp;metal:Ramp}){
  const G=60,step=p.kind==='walk'?(p.bob?1:-1):0,raise=p.kind==='strike'?3:p.kind==='windup'?1:0,by=44;
  const leg=(x:number,ph:number,dark:boolean)=>{const s=step*ph;const c:Ramp=dark?[ELE[0],ELE[0],ELE[1],ELE[1]]:ELE;px.box(x+s,by+3,7,G-by-3,c);for(let k=0;k<3;k++)px.set(x+s+1+k*2,G-1,0xd8d0c4);};
  leg(10,1,true);leg(35,-1,true);
  px.poly([[5,by-4],[2,by+3],[3,by+7]],ELE[1]);
  px.ellipse(25,by-1,21,11,ELE);for(let k=0;k<6;k++)px.line(10+k*5,by+5,12+k*5,by+8,ELE[0]);
  leg(16,-1,false);leg(40,1,false);
  const hx=48,hy=by-8-raise;px.ellipse(hx,hy,9,9,ELE);
  px.poly([[hx-6,hy-6],[hx+1,hy-7],[hx+2,hy+8],[hx-5,hy+11],[hx-9,hy+2]],ELE[0]);px.poly([[hx-5,hy-5],[hx,hy-6],[hx+1,hy+7],[hx-4,hy+9],[hx-8,hy+2]],ELE[1]);
  px.set(hx+4,hy-2,0x0a0808);px.set(hx+5,hy-3,0xffffff);
  const tip=p.kind==='strike'?[hx+14,hy-8]:p.kind==='windup'?[hx+13,hy+4]:[hx+10,G-3];
  for(let t=0;t<=1;t+=.05){const x=hx+6+(tip[0]!-hx-6)*t+Math.sin(t*3.1)*2,y=hy+3+(tip[1]!-hy-3)*t;px.ellipse(x,y,2.8-t*1.3,2.8-t*1.3,ELE);}
  px.line(hx+5,hy+5,hx+12,hy+9,0xf4ece0,2);px.set(hx+12,hy+9,0xffffff);
  const trim=look.trim==='gold'||look.tier===3?GOLD:BRONZE;
  if(look.barding&&look.barding>=1){const c=look.barding===2?ramps.metal:ramps.cloth;px.poly([[9,by-9],[39,by-9],[41,by+5],[7,by+5]],c[1]);for(let k=7;k<=41;k+=2)px.set(k,by+6,trim[2]);
    if(look.barding===2){for(let k=by-8;k<by+5;k+=2)for(let i=8;i<41;i+=3)px.set(i+((k>>1)%2),k,c[(i+k)%3===0?3:0]);px.poly([[hx-3,hy-9],[hx+6,hy-8],[hx+7,hy],[hx-2,hy-1]],c[2]);px.ellipse(hx+2,hy-5,1.5,1.5,trim);}}
  // 가마(망루): 낮게 얹고, 2단부터 지붕
  px.box(14,by-16,22,7,WOOD);px.line(14,by-16,35,by-16,trim[2]);for(const k of [15,20,25,30])px.line(k,by-15,k,by-10,WOOD[0]);
  return {seatX:25,seatY:by-12,roof:(look.barding??0)>=1?{l:12,r:38,y:by-16}:null};
}
/** 사양과 자세로 한 칸을 그린다. clothHue는 진영 색(사양에 옷 색이 없을 때). */
export function renderUnit(look:Look,clothHue:number,pose:number):PixelImage{
  const px=new Pix(),p=poseOf(pose);
  const cloth=clothRamp(look.cloth??clothHue),accent=clothRamp(look.accent,.72),metal=METAL[look.metal??(look.tier===3?'gold':look.tier===2?'steel':'iron')];
  const ramps={cloth,accent,metal};
  // 진영 색이 사양 옷 색과 다르면 띠(허리띠·망토 안감)에 진영 색을 넣어 피아를 알아보게 한다.
  const side=clothRamp(clothHue);
  const auraAt=(cx:number,cy:number)=>{if(look.aura===undefined)return;const a=hsl(look.aura,.8,.62),b=hsl(look.aura,.9,.82);for(let k=0;k<22;k++){const t=k/22*6.28+pose*.3,r=12+(k%3)*2.2;const x=cx+Math.cos(t)*r,y=cy+Math.sin(t)*r*1.3;px.set(x,y,k%4===0?b:a);if(k%4===0){px.set(x+1,y,a);px.set(x,y+1,a);}}};
  const mounted=look.mount!=='foot';
  let seat:{seatX:number;seatY:number;roof?:{l:number;r:number;y:number}|null}={seatX:30,seatY:44};
  if(look.mount==='horse')seat=drawHorse(px,look,p,ramps);
  else if(look.mount==='elephant')seat=drawElephant(px,look,p,ramps);
  const big=look.build==='big'?1:0,G=60;
  const x=mounted?seat.seatX:30,hip=mounted?seat.seatY:42+p.bob-big,top=hip-13-big,robe=look.armor==='robe'||look.armor==='monkRobe';
  const lean=p.lean,hx=x+lean+1,hy=top-6;
  const h=hold(look.weapon,p,[x+lean+3,top+2]);
  auraAt(x+1,top+6);
  // 등 뒤: 깃발·망토·짐
  if(look.banners)drawBanners(px,x+lean,top,look.banners,{accent:side},look);
  if(look.cape)drawCape(px,x,top,mounted?hip+6:hip+12,lean,p.kind==='walk'?2:p.kind==='strike'?3:0,{accent,cloth:side},look);
  if(look.pack&&look.pack!=='none')drawPack(px,look,x+lean-3,top+2,{accent});
  // 뒤 팔
  const sl=sleeveRamp(look,ramps),skin=SKIN[look.skin??'light'],dim:Ramp=[sl[0],sl[0],sl[1],sl[2]];
  const backHand=h.back??[x+lean-3+p.back[0]*.4,top+2+p.back[1]];
  const bElbow:[number,number]=[(x+lean-3+backHand[0])/2-1,(top+3+backHand[1])/2];
  limb(px,[x+lean-3,top+3],bElbow,dim,3);limb(px,bElbow,backHand,dim,3);
  px.ellipse(backHand[0],backHand[1],1.2,1.2,skin);
  // 다리(보병) / 말 위 다리
  if(!mounted)legs(px,look,x,hip,G,p,ramps);
  else if(look.mount==='horse'){const tr:Ramp=[0x2a2622,0x4e463e,0x6e655a,0x8e8478];limb(px,[x+1,hip],[x+5,hip+5],tr,4);limb(px,[x+5,hip+5],[x+4,hip+11],tr,3);px.box(x+2,hip+10,5,3,look.tier>=2?metal:LEATHER);}
  // 몸통·치마
  if(!mounted)drawSkirt(px,look,x,hip,ramps);
  drawTorso(px,look,x,top,hip,lean,ramps,mounted?13:G-top-2);
  if(look.cloth!==undefined&&look.cloth!==clothHue&&!robe)px.line(x-6,hip-1,x+6,hip-1,side[2]);
  else if(look.cloth!==undefined&&robe)px.rect(x-7,hip-2,15,2,side[1]);
  // 머리
  drawHead(px,look,hx,hy,ramps,p.kind==='hurt');
  // 방패: 몸 앞(막기 때 더 앞으로). 양손 무기면 등에 진다.
  const shield=look.off==='tower'||look.off==='round'||look.off==='rattan'||look.off==='kite';
  const twoHand=['pole','slash','xbow','lift'].includes(GRIP[look.weapon]);
  const offAt:[number,number]=shield?[x+lean+(p.kind==='guard'?7:4),top+7]:[backHand[0]+1,backHand[1]];
  if(shield&&twoHand)drawOff(px,look,[x+lean-9,top+5],p,ramps);
  else if(shield)drawOff(px,look,offAt,p,ramps);
  drawPauldron(px,look,x+lean-2,top+2,ramps);
  // 앞 팔과 무기(활은 팔 뒤)
  const hand=h.hand,elbow:[number,number]=[(x+lean+3+hand[0])/2+(hand[1]<top?-1:1),(top+3+hand[1])/2+1];
  if(GRIP[look.weapon]==='bow')drawWeapon(px,look.weapon,hand,h.ang,look,{metal,accent},p);
  limb(px,[x+lean+3,top+3],elbow,sl,robe?4:3);limb(px,elbow,hand,sl,robe?4:3);
  if(robe){const cx=(elbow[0]+hand[0]*2)/3,cy=(elbow[1]+hand[1]*2)/3;px.poly([[cx-2,cy-1],[cx+2,cy-1],[cx+2,cy+4],[cx-3,cy+5]],sl[1]);px.line(cx-3,cy+5,cx+2,cy+4,sl[0]);}
  px.ellipse(hand[0],hand[1],1.4,1.4,skin);
  if(GRIP[look.weapon]!=='bow')drawWeapon(px,look.weapon,hand,h.ang,look,{metal,accent},p);
  if(!shield&&look.off!=='none'&&!twoHand)drawOff(px,look,offAt,p,ramps);
  drawPauldron(px,look,x+lean+3,top+2,ramps);
  if(seat.roof){const {l,r,y}=seat.roof;px.line(l+2,y,l+2,y-21,WOOD[1]);px.line(r-2,y,r-2,y-21,WOOD[1]);px.poly([[l,y-21],[r,y-21],[r-4,y-25],[l+4,y-25]],accent[1]);px.line(l,y-21,r,y-21,GOLD[2]);}
  px.outline();
  return px.toImage();
}
