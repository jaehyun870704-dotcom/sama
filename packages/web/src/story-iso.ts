/**
 * 이야기 무대의 아이소메트릭 배경 — 조조전 리메이크의 이벤트 장면처럼, 위에서 비스듬히 내려다본
 * 방·뜰·군영을 타일과 입체 소품으로 그린다. 그림 파일 없이 캔버스에 그려서 한 번 만든 뒤 재사용한다.
 *
 * 좌표: 격자 칸 (c, r). c가 늘면 화면 오른쪽 아래, r이 늘면 왼쪽 아래로 간다.
 * 실내는 c=0(왼쪽 위)·r=0(오른쪽 위) 가장자리에 벽이 선다. 인물은 칸 위에 서고 칸 단위로 걷는다.
 * 대본의 자리([x%, y%])는 화면 좌표이므로 가장 가까운 빈 칸으로 맞춘다.
 */
import type {At} from './scenario-types.ts';

export type Cell=readonly [number,number];
export const W=1280,H=640;
const TW=80,TH=40,OX=640,OY=40,N=22;
const pt=(c:number,r:number):[number,number]=>[OX+(c-r)*TW/2,OY+(c+r)*TH/2];

type Kind='hall'|'palace'|'study'|'corridor'|'tent'|'store'|'court'|'gatehouse'|'camp'|'field'|'hill'|'valley'|'forest'|'river'|'bank'|'wall'|'fort'|'fire';
/** 이야기 배경 번호(0~17, scenario-types.ts Scene.art) → 장면 종류. */
const KIND:Record<number,Kind>={0:'court',1:'fire',2:'gatehouse',3:'hill',4:'valley',5:'palace',6:'camp',7:'river',8:'wall',9:'store',10:'court',11:'forest',12:'study',13:'corridor',14:'tent',15:'bank',16:'camp',17:'fort'};
const INDOOR=new Set<Kind>(['hall','palace','study','corridor','tent','store']);

export interface IsoScene {
  url:string;
  /** 대본 자리(화면 %)에 가장 가까운 칸. */
  toCell(at:At):Cell;
  /** 칸의 발 디딤 자리(화면 %). */
  toPct(cell:Cell):At;
  /** 사람이 설 수 있는 화면 안의 칸인가(소품·벽이 없는). */
  standable(cell:Cell):boolean;
  /** 지나갈 수 있는 칸인가(화면 밖 포함, 소품 제외). */
  passable(cell:Cell):boolean;
  indoor:boolean;
}

function rng(seed:number){let a=seed>>>0;return ()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function hash(s:string){let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
const shade=(hex:string,k:number)=>{const n=parseInt(hex.slice(1),16),f=(v:number)=>Math.max(0,Math.min(255,Math.round(v*k)));return `rgb(${f(n>>16&255)},${f(n>>8&255)},${f(n&255)})`;};
const jitter=(hex:string,R:()=>number,amt=0.08)=>shade(hex,1-amt+R()*amt*2);

const cache=new Map<string,IsoScene>();
export function isoScene(art:number,place:string):IsoScene{
  const kind=KIND[art]??'field',key=`${kind}:${place}`;
  const hit=cache.get(key);if(hit)return hit;
  const scene=build(kind,hash(place)+art*7919);cache.set(key,scene);return scene;
}

// ─────────────────────────────────────────────── 그리기 도구
type Ctx=CanvasRenderingContext2D;
function poly(g:Ctx,pts:Array<[number,number]>,fill:string,stroke?:string,lw=1.5){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
const up=([x,y]:[number,number],h:number):[number,number]=>[x,y-h];
/** 바닥 칸 모양(평면 사각형 → 마름모). */
function diamond(c:number,r:number,w=1,d=1){return [pt(c,r),pt(c+w,r),pt(c+w,r+d),pt(c,r+d)];}
/** 입체 상자: 칸 (c,r)에서 w×d, 높이 h, 바닥에서 z만큼 떠 있다. */
function prism(g:Ctx,c:number,r:number,w:number,d:number,h:number,col:string,z=0,line='#1a120c'){
  const A=up(pt(c,r),z),B=up(pt(c+w,r),z),C=up(pt(c+w,r+d),z),D=up(pt(c,r+d),z);
  poly(g,[D,C,up(C,h),up(D,h)],shade(col,0.78),line);
  poly(g,[C,B,up(B,h),up(C,h)],shade(col,0.6),line);
  poly(g,[up(A,h),up(B,h),up(C,h),up(D,h)],shade(col,1.08),line);
}
function glow(g:Ctx,x:number,y:number,rad:number,color:string,alpha=0.5){
  const grd=g.createRadialGradient(x,y,0,x,y,rad);grd.addColorStop(0,color.replace('A',String(alpha)));grd.addColorStop(1,color.replace('A','0'));
  g.save();g.globalCompositeOperation='lighter';g.fillStyle=grd;g.fillRect(x-rad,y-rad,rad*2,rad*2);g.restore();
}
function flame(g:Ctx,x:number,y:number,s:number,R:()=>number){
  for(const [col,k] of [['#ff7a1a',1],['#ffc03a',0.66],['#fff2b0',0.33]] as const){g.beginPath();g.moveTo(x-s*0.5*k,y);g.quadraticCurveTo(x-s*0.55*k,y-s*0.9*k,x+(R()-0.5)*s*0.3,y-s*1.6*k);g.quadraticCurveTo(x+s*0.55*k,y-s*0.9*k,x+s*0.5*k,y);g.closePath();g.fillStyle=col;g.fill();}
  glow(g,x,y-s*0.6,s*3.2,'rgba(255,150,60,A)',0.45);
}

// ─────────────────────────────────────────────── 바닥
type Floor='wood'|'stone'|'grass'|'dirt'|'mat'|'paving'|'sand';
const FLOOR:Record<Floor,string>={wood:'#8a5a34',stone:'#8d8c86',grass:'#5f8a3c',dirt:'#9a7a50',mat:'#b39663',paving:'#a39a88',sand:'#c2a878'};
function floorTile(g:Ctx,c:number,r:number,f:Floor,R:()=>number){
  const d=diamond(c,r);
  if(f==='wood'){
    poly(g,d,jitter(FLOOR.wood,R,0.06));
    g.strokeStyle='rgba(40,22,10,.55)';g.lineWidth=1;
    for(let i=1;i<4;i++){const a=pt(c+i/4,r),b=pt(c+i/4,r+1);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
    g.strokeStyle='rgba(255,220,170,.08)';const a=pt(c,r+0.02),b=pt(c+1,r+0.02);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();
  }else if(f==='stone'||f==='paving'){
    poly(g,d,jitter(FLOOR[f],R,0.07),'rgba(40,38,34,.55)',1.2);
    if(R()<0.3){const [x,y]=pt(c+0.3+R()*0.4,r+0.3+R()*0.4);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,y,3,2);}
  }else if(f==='mat'){
    poly(g,d,jitter(FLOOR.mat,R,0.04),'rgba(80,60,30,.45)',1);
    g.strokeStyle='rgba(90,70,40,.25)';g.lineWidth=1;for(let i=1;i<6;i++){const a=pt(c,r+i/6),b=pt(c+1,r+i/6);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
  }else{
    poly(g,d,jitter(FLOOR[f],R,0.07));
    const [cx,cy]=pt(c+0.5,r+0.5);
    for(let i=0;i<5;i++){const x=cx+(R()-0.5)*56,y=cy+(R()-0.5)*26;
      if(f==='grass'){g.strokeStyle=R()<0.5?'rgba(150,200,90,.55)':'rgba(30,60,20,.45)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x+(R()-0.5)*3,y-4-R()*4);g.stroke();}
      else{g.fillStyle=R()<0.5?'rgba(60,40,20,.35)':'rgba(230,210,170,.25)';g.fillRect(x,y,2+R()*2,1.5);}}
  }
}
function water(g:Ctx,c:number,r:number,R:()=>number,t=0){
  poly(g,diamond(c,r),jitter('#3f6f8a',R,0.05));
  const [x,y]=pt(c+0.5,r+0.5);g.strokeStyle='rgba(200,235,255,.35)';g.lineWidth=1.2;
  for(let i=0;i<2;i++){const ox=(R()-0.5)*40,oy=(R()-0.5)*14;g.beginPath();g.moveTo(x+ox-8,y+oy);g.quadraticCurveTo(x+ox,y+oy-3+t,x+ox+8,y+oy);g.stroke();}
}

// ─────────────────────────────────────────────── 벽(실내)
function wallFace(g:Ctx,side:'left'|'right',h:number,col:string){
  const a=pt(0,0),b=side==='left'?pt(0,N):pt(N,0);
  poly(g,[a,b,up(b,h),up(a,h)],shade(col,side==='left'?0.92:0.72));
}
/** 벽면 위 사각형(가로 t1~t2 칸, 높이 z1~z2). */
function onWall(side:'left'|'right',t1:number,t2:number,z1:number,z2:number){
  const P=(t:number)=>side==='left'?pt(0,t):pt(t,0);
  return [up(P(t1),z1),up(P(t2),z1),up(P(t2),z2),up(P(t1),z2)] as [[number,number],[number,number],[number,number],[number,number]];
}
function lattice(g:Ctx,side:'left'|'right',t1:number,t2:number,z1:number,z2:number,lit:boolean){
  poly(g,onWall(side,t1-0.12,t2+0.12,z1-10,z2+10),'#3b2414','#1a0f08');
  poly(g,onWall(side,t1,t2,z1,z2),lit?'#f2d9a0':'#c8b48a');
  g.strokeStyle='#4a2c16';g.lineWidth=2;
  for(let i=1;i<4;i++){const t=t1+(t2-t1)*i/4,w=onWall(side,t,t,z1,z2);g.beginPath();g.moveTo(...w[0]);g.lineTo(...w[3]);g.stroke();}
  for(let i=1;i<4;i++){const z=z1+(z2-z1)*i/4,s=onWall(side,t1,t2,z,z);g.beginPath();g.moveTo(...s[0]);g.lineTo(...s[1]);g.stroke();}
  if(lit){const [m]=onWall(side,(t1+t2)/2,(t1+t2)/2,(z1+z2)/2,(z1+z2)/2);glow(g,m[0],m[1],90,'rgba(255,214,140,A)',0.25);}
}
function pillar(g:Ctx,c:number,r:number,h:number,col='#7a1f14'){prism(g,c,r,0.42,0.42,h,col);prism(g,c-0.06,r-0.06,0.54,0.54,10,'#3a2a1a');prism(g,c-0.04,r-0.04,0.5,0.5,8,'#b8892e',h-26);}
function indoorWalls(g:Ctx,kind:Kind,R:()=>number){
  const h=kind==='tent'?200:240,col=kind==='palace'?'#6b3a26':kind==='tent'?'#d9c9a3':kind==='store'?'#6d5a42':'#8a6a4a';
  wallFace(g,'left',h,col);wallFace(g,'right',h,col);
  if(kind==='tent'){
    // 군막 천: 세로 이음매와 위쪽 그늘
    g.strokeStyle='rgba(120,100,70,.5)';g.lineWidth=2;
    for(let t=1;t<N;t+=1.5)for(const side of ['left','right'] as const){const s=onWall(side,t,t,0,h);g.beginPath();g.moveTo(...s[0]);g.lineTo(...s[3]);g.stroke();}
    for(const side of ['left','right'] as const){poly(g,onWall(side,0,N,h-40,h),'rgba(90,60,30,.35)');poly(g,onWall(side,0,N,30,42),'#9b2a1c');}
    return;
  }
  // 아래 징두리(나무판) · 위 들보
  for(const side of ['left','right'] as const){
    poly(g,onWall(side,0,N,0,46),shade(kind==='palace'?'#4a1c12':'#4a3220',side==='left'?1:0.8),'#1a0f08');
    poly(g,onWall(side,0,N,h-34,h-14),shade('#3a2414',side==='left'?1:0.8));
    if(kind!=='store')for(let t=1.6;t<N;t+=3.2)lattice(g,side,t,t+1.5,86,170,kind!=='study'||R()<0.6);
    else for(let t=2;t<N;t+=4){poly(g,onWall(side,t,t+1.2,100,140),'#20140a');}
  }
  // 벽을 따라 선 붉은 기둥
  const pc=kind==='palace'?'#8b1e12':kind==='corridor'?'#7a2014':'#5a3420';
  for(let t=0;t<N;t+=3.2){pillar(g,0.05,t,h,pc);pillar(g,t,0.05,h,pc);}
  if(kind==='corridor')for(let t=3;t<N;t+=3.2)pillar(g,8,t,h,pc);
}

// ─────────────────────────────────────────────── 소품
type Prop={c:number;r:number;w:number;d:number;draw:(g:Ctx)=>void;solid:boolean};
const P=(c:number,r:number,w:number,d:number,draw:(g:Ctx)=>void,solid=true):Prop=>({c,r,w,d,draw,solid});
function rug(c:number,r:number,w:number,d:number,col='#8a1f1a'):Prop{return P(c,r,w,d,g=>{
  poly(g,diamond(c,r,w,d),col,'#2a0c08');poly(g,diamond(c+0.25,r+0.25,w-0.5,d-0.5),'none','#d6a64a',2);
  poly(g,diamond(c+0.45,r+0.45,w-0.9,d-0.9),shade(col,1.15));
  const [x,y]=pt(c+w/2,r+d/2);g.strokeStyle='#d6a64a';g.lineWidth=2;g.beginPath();g.ellipse(x,y,Math.min(w,d)*14,Math.min(w,d)*7,0,0,Math.PI*2);g.stroke();
},false);}
function table(c:number,r:number,w:number,d:number,R:()=>number):Prop{return P(c,r,w,d,g=>{
  prism(g,c+0.08,r+0.08,w-0.16,d-0.16,22,'#3a2414');prism(g,c,r,w,d,8,'#6b4426',22);
  // 위에 놓인 두루마리와 붓
  const [x,y]=pt(c+w*0.45,r+d*0.4);g.fillStyle='#efe2bf';g.fillRect(x-14,y-34,22,6);g.fillStyle='#2a1a10';g.fillRect(x+12,y-36,10,2);
  if(R()<0.6){const [a,b]=pt(c+w*0.7,r+d*0.6);g.fillStyle='#b98a3a';g.beginPath();g.ellipse(a,b-34,6,3,0,0,7);g.fill();}
});}
function lamp(c:number,r:number):Prop{return P(c,r,0.4,0.4,g=>{
  prism(g,c+0.12,r+0.12,0.16,0.16,64,'#2a1a10');prism(g,c,r,0.4,0.4,24,'#e8b860',64);
  const [x,y]=pt(c+0.2,r+0.2);glow(g,x,y-76,120,'rgba(255,200,110,A)',0.5);
});}
function brazier(c:number,r:number,R:()=>number):Prop{return P(c,r,0.6,0.6,g=>{
  prism(g,c+0.15,r+0.15,0.3,0.3,30,'#3a3430');prism(g,c,r,0.6,0.6,12,'#5a5048',30);
  const [x,y]=pt(c+0.3,r+0.3);flame(g,x,y-42,12,R);
});}
function screenPanel(c:number,r:number,len:number):Prop{return P(c,r,len,0.15,g=>{
  prism(g,c,r,len,0.15,118,'#3a1e12');
  for(let i=0;i<len*2;i++){const t1=c+i/2+0.06,t2=c+(i+1)/2-0.06,a=up(pt(t1,r+0.15),10),b=up(pt(t2,r+0.15),10);
    poly(g,[a,b,up(b,96),up(a,96)],i%2?'#e9dcb8':'#f2e7c6','#5a3a20',1);
    g.strokeStyle='rgba(60,90,70,.6)';g.lineWidth=2;g.beginPath();g.moveTo(a[0]+6,a[1]-30);g.quadraticCurveTo(a[0]+16,a[1]-60,b[0]-4,b[1]-74);g.stroke();}
});}
function shelf(c:number,r:number,d:number,R:()=>number):Prop{return P(c,r,0.55,d,g=>{
  prism(g,c,r,0.55,d,150,'#4a2c18');
  for(let z=24;z<150;z+=32){const a=up(pt(c+0.55,r),z),b=up(pt(c+0.55,r+d),z);g.strokeStyle='#22140a';g.lineWidth=3;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();
    for(let t=0.15;t<d-0.1;t+=0.22){const p=up(pt(c+0.55,r+t),z+2);g.fillStyle=R()<0.5?'#e6d4a8':'#c99d5a';g.fillRect(p[0]-3,p[1]-14,6,13);}}
});}
function throne(c:number,r:number):Prop{return P(c,r,3,2.4,g=>{
  prism(g,c,r,3,2.4,12,'#5a1a12');prism(g,c+0.3,r+0.3,2.4,1.8,12,'#7a2418',12);
  prism(g,c+0.9,r+0.5,1.2,0.5,70,'#c08a2a',24);prism(g,c+0.9,r+0.9,1.2,0.8,20,'#9a2a1a',24);
  const [x,y]=pt(c+1.5,r+0.6);glow(g,x,y-80,140,'rgba(255,210,120,A)',0.25);
});}
function crate(c:number,r:number,s=1):Prop{return P(c,r,s,s,g=>{prism(g,c,r,s,s,38*s,'#8a6234');const a=up(pt(c,r+s),19*s),b=up(pt(c+s,r+s),19*s);g.strokeStyle='#3a2410';g.lineWidth=2;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();});}
function sacks(c:number,r:number,R:()=>number):Prop{return P(c,r,1,1,g=>{for(let i=0;i<4;i++){const [x,y]=pt(c+0.3+(i%2)*0.4,r+0.3+Math.floor(i/2)*0.4);g.fillStyle=jitter('#c9b07a',R,0.08);g.strokeStyle='#5a4424';g.lineWidth=1.5;g.beginPath();g.ellipse(x,y-12-(i>1?0:8),16,12,0,0,7);g.fill();g.stroke();}});}
function rack(c:number,r:number,len:number):Prop{return P(c,r,len,0.3,g=>{
  prism(g,c,r,len,0.3,14,'#4a3018');
  for(let t=0.2;t<len;t+=0.35){const [x,y]=pt(c+t,r+0.15);g.strokeStyle='#5a3a1a';g.lineWidth=3;g.beginPath();g.moveTo(x,y-10);g.lineTo(x,y-104);g.stroke();g.fillStyle='#c9ced6';g.beginPath();g.moveTo(x-4,y-104);g.lineTo(x,y-120);g.lineTo(x+4,y-104);g.fill();g.fillStyle='#a02418';g.fillRect(x-3,y-102,6,6);}
});}
function banner(c:number,r:number,col:string):Prop{return P(c,r,0.2,0.2,g=>{
  const [x,y]=pt(c+0.1,r+0.1);g.strokeStyle='#3a2410';g.lineWidth=4;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-170);g.stroke();
  poly(g,[[x,y-166],[x+46,y-152],[x+46,y-92],[x,y-104]],col,'#1a0c08');g.fillStyle='rgba(255,230,160,.85)';g.font='bold 22px serif';g.fillText('魏',x+12,y-118);
});}
function tent(c:number,r:number,w:number,d:number,col:string):Prop{return P(c,r,w,d,g=>{
  const A=pt(c,r),B=pt(c+w,r),C=pt(c+w,r+d),D=pt(c,r+d),apex=up(pt(c+w/2,r+d/2),Math.max(w,d)*58),wall=26;
  poly(g,[D,C,up(C,wall),up(D,wall)],shade(col,0.82),'#3a2a18');poly(g,[C,B,up(B,wall),up(C,wall)],shade(col,0.64),'#3a2a18');
  poly(g,[up(D,wall),up(C,wall),apex],shade(col,0.95),'#3a2a18');poly(g,[up(C,wall),up(B,wall),apex],shade(col,0.74),'#3a2a18');
  // 입구와 붉은 띠
  const m=pt(c+w/2,r+d);poly(g,[[m[0]-14,m[1]-8],[m[0]+14,m[1]-1],[m[0]+4,m[1]-40]],'#2a1a10');
  g.strokeStyle='#9b2a1c';g.lineWidth=4;g.beginPath();g.moveTo(...up(D,wall));g.lineTo(...up(C,wall));g.lineTo(...up(B,wall));g.stroke();
  void A;
});}
function tree(c:number,r:number,R:()=>number,blossom=false,big=1):Prop{return P(c,r,0.6,0.6,g=>{
  const [x,y]=pt(c+0.3,r+0.3);g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y,38*big,16*big,0,0,7);g.fill();
  g.fillStyle='#4a3020';g.fillRect(x-6,y-70*big,12,70*big);
  const base=blossom?'#e7b6c4':'#3f6a2c';
  for(let i=0;i<7;i++){const ox=(R()-0.5)*70*big,oy=-80*big-R()*70*big,rad=(26+R()*18)*big;
    g.fillStyle=shade(base,0.7+R()*0.4);g.beginPath();g.arc(x+ox,y+oy,rad,0,7);g.fill();}
  if(blossom)for(let i=0;i<30;i++){g.fillStyle='rgba(255,240,245,.8)';g.fillRect(x+(R()-0.5)*110*big,y-60*big-R()*120*big,3,3);}
});}
function rock(c:number,r:number,R:()=>number,s=1):Prop{return P(c,r,s,s,g=>{
  const [x,y]=pt(c+s/2,r+s/2),pts:Array<[number,number]>=[];for(let i=0;i<7;i++){const a=Math.PI+i/6*Math.PI;pts.push([x+Math.cos(a)*30*s*(0.8+R()*0.3),y+Math.sin(a)*34*s*(0.7+R()*0.4)-4]);}
  poly(g,pts,jitter('#7d7a72',R,0.1),'#2a2824');poly(g,[pts[0]!,pts[1]!,pts[2]!,[x,y-6]],'rgba(255,255,255,.12)');
});}
function bush(c:number,r:number,R:()=>number):Prop{return P(c,r,0.5,0.5,g=>{const [x,y]=pt(c+0.25,r+0.25);for(let i=0;i<4;i++){g.fillStyle=shade('#4d7a32',0.75+R()*0.4);g.beginPath();g.arc(x+(R()-0.5)*30,y-10-R()*12,12+R()*6,0,7);g.fill();}},false);}
function stoneLantern(c:number,r:number):Prop{return P(c,r,0.5,0.5,g=>{prism(g,c+0.1,r+0.1,0.3,0.3,40,'#8e8b82');prism(g,c,r,0.5,0.5,18,'#a9a59a',40);prism(g,c-0.05,r-0.05,0.6,0.6,8,'#7a776e',58);const [x,y]=pt(c+0.25,r+0.25);glow(g,x,y-50,60,'rgba(255,200,120,A)',0.35);});}
function campfire(c:number,r:number,R:()=>number):Prop{return P(c,r,0.7,0.7,g=>{const [x,y]=pt(c+0.35,r+0.35);g.fillStyle='#3a2a1a';for(let i=0;i<5;i++){g.save();g.translate(x,y-4);g.rotate(i*1.25);g.fillRect(-16,-3,32,6);g.restore();}flame(g,x,y-6,16,R);});}
function boat(c:number,r:number):Prop{return P(c,r,3,1,g=>{
  const rim:Array<[number,number]>=[pt(c,r+0.5),pt(c+0.45,r+0.12),pt(c+2.55,r+0.12),pt(c+3,r+0.5),pt(c+2.55,r+0.88),pt(c+0.45,r+0.88)].map(p=>up(p,10));
  const front:Array<[number,number]>=[rim[0]!,rim[5]!,rim[4]!,rim[3]!];poly(g,[...front,...[...front].reverse().map(p=>[p[0],p[1]+16] as [number,number])],'#4a2e16','#1a0e06');
  poly(g,rim,'#7a5230','#1a0e06');poly(g,rim.map(([x,y]):[number,number]=>[x+(OX-x)*0+0,y+4]).slice(1,5),'rgba(0,0,0,.18)');
  prism(g,c+1.2,r+0.3,0.6,0.4,26,'#8a6a3a',10);const [mx,my]=up(pt(c+1.5,r+0.5),36);g.strokeStyle='#3a2410';g.lineWidth=3;g.beginPath();g.moveTo(mx,my);g.lineTo(mx,my-90);g.stroke();
},false);}
/** 가장자리를 따라 선 담·목책·성벽(r=0 또는 c=0 줄). */
function edgeWall(g:Ctx,side:'left'|'right',from:number,to:number,h:number,col:string,crenel:boolean,roof?:string){
  for(let t=from;t<to;t+=1){const c=side==='right'?t:-0.6,r=side==='right'?-0.6:t;prism(g,c,r,side==='right'?1:0.6,side==='right'?0.6:1,h,col);
    if(crenel&&t%2===0)prism(g,c,r,side==='right'?0.5:0.6,side==='right'?0.6:0.5,16,col,h);
    if(roof){const A=up(pt(c,r),h),B=up(pt(c+(side==='right'?1:0.6),r),h),C=up(pt(c+(side==='right'?1:0.6),r+(side==='right'?0.6:1)),h),D=up(pt(c,r+(side==='right'?0.6:1)),h);poly(g,[up(A,4),up(B,4),up(C,14),up(D,14)],roof,'#141414');}}
}
function palisade(g:Ctx,side:'left'|'right',from:number,to:number){
  for(let t=from;t<to;t+=0.22){const [x,y]=side==='right'?pt(t,-0.3):pt(-0.3,t);g.fillStyle=t%0.44<0.22?'#6a4a2a':'#5a3e22';g.strokeStyle='#2a1a0c';g.lineWidth=1;g.beginPath();g.moveTo(x-5,y);g.lineTo(x-5,y-84);g.lineTo(x,y-96);g.lineTo(x+5,y-84);g.lineTo(x+5,y);g.closePath();g.fill();g.stroke();}
}
function hallFacade(g:Ctx,c:number,r:number,w:number,d:number,wallCol:string){
  prism(g,c,r,w,d,16,'#7a7468');prism(g,c+0.2,r+0.2,w-0.4,d-0.4,100,wallCol,16);
  for(let t=0.6;t<w-0.4;t+=1.1){const a=up(pt(c+0.2+t,r+d-0.2),24),b=up(pt(c+0.2+t+0.6,r+d-0.2),24);poly(g,[a,b,up(b,62),up(a,62)],'#f2d9a0','#3a2010');}
  // 팔작지붕
  const h=116,o=0.5,A=up(pt(c-o,r-o),h),B=up(pt(c+w+o,r-o),h),C=up(pt(c+w+o,r+d+o),h),D=up(pt(c-o,r+d+o),h),ridgeA=up(pt(c+w*0.25,r+d/2),h+80),ridgeB=up(pt(c+w*0.75,r+d/2),h+80);
  poly(g,[D,C,ridgeB,ridgeA],'#2e3a40','#0e1214');poly(g,[C,B,ridgeB],'#222c30','#0e1214');poly(g,[A,D,ridgeA],'#26323a','#0e1214');
  g.strokeStyle='rgba(160,180,190,.25)';g.lineWidth=1;for(let i=1;i<10;i++){const t=i/10,p=[D[0]+(C[0]-D[0])*t,D[1]+(C[1]-D[1])*t],q=[ridgeA[0]+(ridgeB[0]-ridgeA[0])*t,ridgeA[1]+(ridgeB[1]-ridgeA[1])*t];g.beginPath();g.moveTo(p[0]!,p[1]!);g.lineTo(q[0]!,q[1]!);g.stroke();}
  void B;
}
function burningHouse(g:Ctx,c:number,r:number,R:()=>number){hallFacade(g,c,r,3,2,'#6a5a48');for(let i=0;i<4;i++){const [x,y]=pt(c+R()*3,r+R()*2);flame(g,x,y-120-R()*40,18+R()*10,R);}}

// ─────────────────────────────────────────────── 장면 조립
function build(kind:Kind,seed:number):IsoScene{
  const R=rng(seed),indoor=INDOOR.has(kind);
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d')!;
  const floor:Floor=kind==='palace'||kind==='corridor'?'stone':kind==='tent'?'mat':kind==='store'?'wood':indoor?'wood':kind==='court'||kind==='gatehouse'||kind==='wall'||kind==='fort'||kind==='fire'?'paving':kind==='bank'?'sand':kind==='valley'||kind==='camp'?'dirt':'grass';
  const props:Prop[]=[],waterCells=new Set<string>();
  const add=(p:Prop)=>props.push(p);
  // 소품 배치: 대본의 사람들은 대개 화면 가운데 아래에 서므로, 무거운 소품은 뒤쪽 가장자리에.
  switch(kind){
    case 'hall':case 'study':case 'palace':case 'corridor':
      add(rug(5,5,6,5,kind==='palace'?'#8f1e18':'#7a2a1c'));
      if(kind==='palace')add(throne(1.2,1.2));else add(table(1.4,1.6,2.2,1.2,R));
      add(lamp(1.1,4.2));add(lamp(4.4,1.1));add(lamp(1.1,10.5));add(lamp(10.5,1.1));
      if(kind==='study'){add(shelf(0.35,6,3.2,R));add(shelf(0.35,12,3.2,R));add(screenPanel(7,0.35,3));}
      else add(screenPanel(13,0.35,3));
      break;
    case 'tent':
      add(rug(4,4,6,5,'#5a3a22'));add(table(5.4,5.2,3,2,R));add(rack(0.4,3,3));add(brazier(1.4,9,R));add(brazier(9.5,1.4,R));add(banner(0.6,0.6,'#8a1f1a'));
      break;
    case 'store':
      for(let i=0;i<5;i++)add(crate(0.4+(i%2)*1.1,1.4+i*1.6,0.9));for(let i=0;i<4;i++)add(sacks(3+i*1.4,0.3,R));add(rack(10,0.4,3));add(lamp(6,6));
      break;
    case 'court':
      add(stoneLantern(4.5,9));add(stoneLantern(9,4.5));add(tree(1.5,10,R,true,1.1));add(tree(10.5,1.6,R,true,1));add(bush(3,12,R));add(bush(12,3,R));
      break;
    case 'gatehouse':case 'wall':case 'fort':
      add(banner(2,1.2,'#8a1f1a'));add(banner(1.2,6,'#1f3f8a'));add(rack(6,1,2.4));add(crate(1,9.5,0.9));add(brazier(9,2.2,R));
      break;
    case 'camp':
      add(tent(0.6,1,3,3,'#e6dcc4'));add(tent(5.6,0.4,2.6,2.6,'#ddd0b4'));add(tent(0.4,6.4,2.6,2.6,'#e2d6bc'));add(banner(4.2,3.6,'#8a1f1a'));add(campfire(8,8,R));add(rack(10.5,1,2.4));add(crate(4,9.5,0.8));
      break;
    case 'fire':
      add(crate(5,9,0.8));add(rock(9,6,R,0.6));
      break;
    case 'river':case 'bank':
      for(let c=-8;c<N+8;c++)for(let r=-8;r<N+8;r++){const band=kind==='river'?(r-c>=-1&&r-c<=3):(c+r>=4&&c+r<=7);if(band)waterCells.add(`${c},${r}`);}
      add(tree(12,1,R,false,0.9));add(rock(2,10,R,0.8));
      if(kind==='bank')add(boat(1,2.2));
      break;
    case 'forest':
      for(let i=0;i<9;i++)add(tree(i<5?0.3+R()*1.8:2+i*1.5,i<5?1+i*2.6:0.3+R()*1.6,R,false,0.9+R()*0.3));add(rock(9,9,R,0.7));add(bush(4,12,R));
      break;
    case 'hill':case 'valley':
      for(let i=0;i<6;i++)add(rock(i<3?0.3+R():2+i*2.2,i<3?2+i*3:0.4+R(),R,0.8+R()*0.6));add(tree(12,1,R,false,0.9));add(tree(1,12,R,false,0.9));add(bush(7,11,R));
      if(kind==='valley')for(let i=0;i<4;i++)add(rock(10+i,10-i*2,R,0.6));
      break;
    default:
      add(tree(1,10,R));add(tree(10,1,R));
  }
  // ── 그리기
  g.fillStyle=indoor?'#1a120c':'#2a3420';g.fillRect(0,0,W,H);
  if(indoor)indoorWalls(g,kind,R);
  const lo=indoor?0:-14,hi=N+8;
  for(let s=lo*2;s<=hi*2;s++)for(let c=lo;c<=hi;c++){const r=s-c;if(r<lo||r>hi)continue;
    if(waterCells.has(`${c},${r}`))water(g,c,r,R);else floorTile(g,c,r,floor,R);}
  if(!indoor&&waterCells.size){g.strokeStyle='rgba(230,215,170,.5)';g.lineWidth=3;for(const k of waterCells){const [c,r]=k.split(',').map(Number) as [number,number];for(const [dc,dr,a,b] of [[0,-1,[c,r],[c+1,r]],[0,1,[c,r+1],[c+1,r+1]],[-1,0,[c,r],[c,r+1]],[1,0,[c+1,r],[c+1,r+1]]] as const){if(!waterCells.has(`${c+dc},${r+dr}`)){g.beginPath();g.moveTo(...pt(a[0],a[1]));g.lineTo(...pt(b[0],b[1]));g.stroke();}}}}
  // 바깥 장면의 뒤쪽 경계(담·목책·성벽·건물)
  if(kind==='court'){edgeWall(g,'left',0,N,70,'#d8d0bc',false,'#2e3a40');edgeWall(g,'right',0,N,70,'#d8d0bc',false,'#2e3a40');hallFacade(g,1,1,6,3,'#c9b9a0');}
  if(kind==='gatehouse'||kind==='wall'||kind==='fort'){const h=kind==='fort'?200:170;edgeWall(g,'left',0,N,h,'#8a857a',true);edgeWall(g,'right',0,N,h,'#8a857a',true);
    if(kind==='gatehouse'){const a=up(pt(6,0),0),b=up(pt(9,0),0);poly(g,[[a[0],a[1]],[b[0],b[1]],[b[0],b[1]-110],[a[0],a[1]-110]],'#2a1a10','#120a06',2);hallFacade(g,5.6,-2.4,4,2,'#7a3a26');}}
  if(kind==='camp'){palisade(g,'left',0,N);palisade(g,'right',0,N);}
  if(kind==='fire'){burningHouse(g,0.6,0.6,R);burningHouse(g,5,-0.6,R);burningHouse(g,-0.6,5,R);burningHouse(g,10,-0.6,R);}
  // 소품을 깊이 순서로(뒤 → 앞)
  props.sort((a,b)=>(a.c+a.r+(a.w+a.d)/2)-(b.c+b.r+(b.w+b.d)/2)).forEach(p=>p.draw(g));
  // 빛과 공기
  const vg=g.createRadialGradient(W/2,H*0.6,H*0.3,W/2,H*0.6,H*0.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,indoor?'rgba(10,6,2,.55)':'rgba(5,10,5,.35)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  if(kind==='fire'){g.fillStyle='rgba(120,30,10,.18)';g.fillRect(0,0,W,H);for(let i=0;i<6;i++){g.fillStyle='rgba(30,25,25,.25)';g.beginPath();g.ellipse(R()*W,R()*H*0.4,120,50,0,0,7);g.fill();}}
  if(kind==='camp'||kind==='bank'){g.fillStyle='rgba(255,200,140,.07)';g.fillRect(0,0,W,H);}
  // ── 걸을 수 있는 칸
  const blocked=new Set<string>();
  for(const p of props)if(p.solid)for(let c=Math.floor(p.c);c<Math.ceil(p.c+p.w);c++)for(let r=Math.floor(p.r);r<Math.ceil(p.r+p.d);r++)blocked.add(`${c},${r}`);
  for(const k of waterCells)blocked.add(k);
  const minEdge=indoor?1:kind==='camp'||kind==='court'||kind==='gatehouse'||kind==='wall'||kind==='fort'?1:-6;
  const passable=([c,r]:Cell)=>!blocked.has(`${c},${r}`)&&c>=minEdge&&r>=minEdge;
  const onScreen=([c,r]:Cell)=>{const [x,y]=pt(c+0.5,r+0.5);return x>56&&x<W-56&&y>OY+150&&y<H-24;};
  const standable=(cell:Cell)=>passable(cell)&&onScreen(cell);
  const toPct=([c,r]:Cell):At=>{const [x,y]=pt(c+0.5,r+0.5);return [x/W*100,y/H*100];};
  const toCell=([px,py]:At):Cell=>{
    const sx=px/100*W,sy=py/100*H,u=(sx-OX)/(TW/2),v=(sy-OY)/(TH/2);
    const want:Cell=[Math.round((u+v)/2-0.5),Math.round((v-u)/2-0.5)];
    if(standable(want))return want;
    let best=want,bd=Infinity;
    for(let c=want[0]-10;c<=want[0]+10;c++)for(let r=want[1]-10;r<=want[1]+10;r++){if(!standable([c,r]))continue;const [x,y]=pt(c+0.5,r+0.5),d=(x-sx)**2+(y-sy)**2*2;if(d<bd){bd=d;best=[c,r];}}
    return best;
  };
  return {url:canvas.toDataURL('image/jpeg',0.9),toCell,toPct,standable,passable,indoor};
}

/** 칸에서 칸으로 가는 걸음들. 조조전처럼 한 축을 먼저 걷고 꺾는다(막히면 돌아간다). */
export function stepsBetween(scene:IsoScene,from:Cell,to:Cell,taken:(c:Cell)=>boolean):Cell[]{
  const ok=(c:Cell)=>(c[0]===to[0]&&c[1]===to[1])||(scene.passable(c)&&!taken(c));
  const line=(a:Cell,axis:0|1):Cell[]|undefined=>{const out:Cell[]=[];let cur:Cell=a;
    for(const ax of axis===0?[0,1] as const:[1,0] as const){while(cur[ax]!==to[ax]){const n:[number,number]=[cur[0],cur[1]];n[ax]+=Math.sign(to[ax]-cur[ax]);cur=n;if(!ok(cur)&&!(cur[0]===to[0]&&cur[1]===to[1]))return undefined;out.push(cur);}}
    return out;};
  const dc=Math.abs(to[0]-from[0]),dr=Math.abs(to[1]-from[1]);
  const direct=line(from,dc>=dr?0:1)??line(from,dc>=dr?1:0);if(direct)return direct;
  // 너비 우선 탐색(가까운 범위)
  const key=(c:Cell)=>`${c[0]},${c[1]}`,prev=new Map<string,Cell|null>([[key(from),null]]),q:Cell[]=[from];
  while(q.length){const cur=q.shift()!;if(cur[0]===to[0]&&cur[1]===to[1])break;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]] as const){const n:Cell=[cur[0]+a,cur[1]+b];if(prev.has(key(n))||Math.abs(n[0]-from[0])+Math.abs(n[1]-from[1])>40||!ok(n))continue;prev.set(key(n),cur);q.push(n);}}
  // 닿을 길이 없으면(강 건너 등) 그냥 곧장 걸어간다(물을 건너는 것처럼).
  if(!prev.has(key(to))){const out:Cell[]=[];let [c,r]=from;while(c!==to[0])out.push([c+=Math.sign(to[0]-c),r]);while(r!==to[1])out.push([c,r+=Math.sign(to[1]-r)]);return out;}
  const path:Cell[]=[];for(let c:Cell|null=to;c&&!(c[0]===from[0]&&c[1]===from[1]);c=prev.get(key(c))??null)path.unshift(c);
  return path;
}
/** 화면 가로로 걸어 들어오고 나가는 바깥 칸(같은 높이에서 화면 밖까지). */
export function offscreenCell(cell:Cell,side:'left'|'right'):Cell{
  let [c,r]=cell;for(let i=0;i<40;i++){const [x]=pt(c+0.5,r+0.5);if(side==='left'?x<-70:x>W+70)break;if(side==='left'){if(i%2)r++;else c--;}else{if(i%2)c++;else r--;}}
  return [c,r];
}

/** 목록 썸네일·정비 화면 배경용(장소 이름 없이 종류별로 한 장). */
export function isoBackdrop(art:number){return `background-image:url(${isoScene(art,'').url});background-size:cover;background-position:center 70%`;}
