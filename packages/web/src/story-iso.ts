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

type Kind='hall'|'palace'|'study'|'corridor'|'tent'|'store'|'court'|'gatehouse'|'camp'|'field'|'hill'|'valley'|'forest'|'river'|'bank'|'wall'|'fort'|'fire'|'deck'|'town';
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
  /** 무대 위에 흩날리는 것(꽃잎·불티·비·눈·반딧불·낙엽·먼지). */
  fx:Fx|undefined;
}

function rng(seed:number){let a=seed>>>0;return ()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function hash(s:string){let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
const shade=(hex:string,k:number)=>{const n=parseInt(hex.slice(1),16),f=(v:number)=>Math.max(0,Math.min(255,Math.round(v*k)));return `rgb(${f(n>>16&255)},${f(n>>8&255)},${f(n&255)})`;};
const jitter=(hex:string,R:()=>number,amt=0.08)=>shade(hex,1-amt+R()*amt*2);

export type Fx='petals'|'embers'|'rain'|'snow'|'fireflies'|'leaves'|'dust'|'mist';
interface Mood {light:'day'|'night'|'dawn'|'dusk';weather?:'rain'|'snow'|'fog';fx:Fx|undefined}
/** 장소 이름에서 때와 날씨를 읽는다. */
export function moodOf(place:string,kind:Kind):Mood{
  const light:Mood['light']=/밤|야간|야습|어둠|별이|달빛|전야|한밤|자정/.test(place)?'night':/새벽|아침|여명|동틀/.test(place)?'dawn':/저녁|석양|해 지는|노을|황혼|해질/.test(place)?'dusk':kind==='fire'?'night':'day';
  const weather:Mood['weather']=/비 |비$|장마|폭우|빗속|비가|비 새는/.test(place)?'rain':/눈 |눈$|설원|한겨울|겨울|눈보라/.test(place)?'snow':/안개|연기 낀|물안개/.test(place)?'fog':undefined;
  const fx:Fx|undefined=weather==='rain'?'rain':weather==='snow'?'snow':kind==='fire'?'embers':kind==='court'?'petals':kind==='forest'||kind==='hill'||kind==='valley'?'leaves':light==='night'&&!INDOOR.has(kind)?'fireflies':kind==='river'||kind==='bank'||kind==='deck'||weather==='fog'?'mist':INDOOR.has(kind)?'dust':kind==='camp'?'embers':undefined;
  return {light,...(weather?{weather}:{}),fx};
}
const cache=new Map<string,IsoScene>();
/**
 * 장소 이름이 말하는 곳을 먼저 따른다(배경 번호는 대본을 쓸 때 고른 대략의 그림이라 장소와 어긋날 수 있다).
 * '지역 · 자세한 곳'의 자세한 곳을 본다(지역 이름의 '진'·'문' 같은 글자에 속지 않게). 말이 없으면 배경 번호.
 */
const PLACE_RULES:Array<[RegExp,Kind]>=[
  [/군막|막사|장막|군의|천막/,'tent'],
  [/서재|서고|서방|글방/,'study'],
  [/회랑|복도/,'corridor'],
  [/앞마당|창고 앞/,'court'],
  [/창고|곳간|무기고|군량고|병기고/,'store'],
  [/누선|배 위|갑판|선단|함선|전선 위|배들|뱃머리|선상/,'deck'],
  [/불타|불길|불탄 (?!부교)|화공|잿더미|타오르|타고 남은/,'fire'],
  [/침전|침소|내실|규방|병상|누운|방 안|안방|객사|빈소|사당|관청|부중|사공부|의정|중서성(?! 뒤뜰)|집무|초막|오두막|암자|객관|실$|방$/,'hall'],
  [/(전|궁) 앞|뒤뜰|앞뜰|바깥뜰|앞마당|뜰|마당|정원|후원/,'court'],
  [/조회|궁정|대전|어전|정전|궁중|조정|왕좌|옥좌|궁 안/,'palace'],
  [/진영|군영|본진|야영|영채|진채|주둔|집결/,'camp'],
  [/궁문|성문|관문|문 밖|문 앞|[남북동서]문/,'gatehouse'],
  [/성루|성벽|성 위|성가퀴|망루|성곽/,'wall'],
  [/요새|보루|관$|산성/,'fort'],
  [/강둑|강가|강변|나루|물가|포구|기슭|남안|북안|샘|해안|바닷가|호숫가/,'bank'],
  [/강$|강 위|물길|여울|부교|하구|강물|장강|수로|호수/,'river'],
  [/숲|수풀|대숲|숲길/,'forest'],
  [/골짜기|계곡|협곡|협석|벼랑|절벽|곡$|곡 |어귀/,'valley'],
  [/산|고개|능선|언덕|봉우리|령$|비탈/,'hill'],
  [/거리|저자|시장|성안|마을|촌$|읍|도성/,'town'],
  [/들$|들판|평원|벌판|초원|길$|가도|길목/,'field'],
  [/저택|의 집|집$|사마가|대문/,'court'],
];
export function kindFor(art:number,place:string):Kind{
  const parts=place.split('·').map(p=>p.trim()),detail=parts.at(-1)??'';
  for(const [re,k] of PLACE_RULES)if(re.test(detail))return k;
  return KIND[art]??'field';
}
export function isoScene(art:number,place:string):IsoScene{
  const kind=kindFor(art,place),key=`${kind}:${place}`;
  const hit=cache.get(key);if(hit)return hit;
  const scene=build(kind,hash(place)+art*7919,place);cache.set(key,scene);return scene;
}

// ─────────────────────────────────────────────── 그리기 도구
type Ctx=CanvasRenderingContext2D;
function poly(g:Ctx,pts:Array<[number,number]>,fill:string,stroke?:string,lw=1.5){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
const up=([x,y]:[number,number],h:number):[number,number]=>[x,y-h];
/** 바닥 칸 모양(평면 사각형 → 마름모). */
function diamond(c:number,r:number,w=1,d=1){return [pt(c,r),pt(c+w,r),pt(c+w,r+d),pt(c,r+d)];}
/** 입체 상자: 칸 (c,r)에서 w×d, 높이 h, 바닥에서 z만큼 떠 있다. */
function prism(g:Ctx,c:number,r:number,w:number,d:number,h:number,col:string,z=0,line='rgba(20,12,6,.45)'){
  const A=up(pt(c,r),z),B=up(pt(c+w,r),z),C=up(pt(c+w,r+d),z),D=up(pt(c,r+d),z);
  // 옆면은 위가 밝고 아래가 어두운 그라데이션(칠한 그림처럼), 테두리는 가늘고 옅게
  const face=(pts:Array<[number,number]>,k:number)=>{const ys=pts.map(p=>p[1]),gr=g.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));gr.addColorStop(0,shade(col,k*1.06));gr.addColorStop(1,shade(col,k*0.82));poly(g,pts,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();g.strokeStyle=line;g.lineWidth=1;g.stroke();};
  face([D,C,up(C,h),up(D,h)],0.8);
  face([C,B,up(B,h),up(C,h)],0.62);
  poly(g,[up(A,h),up(B,h),up(C,h),up(D,h)],shade(col,1.08),line,1);
  // 윗면 앞 모서리의 빛
  g.strokeStyle='rgba(255,240,210,.18)';g.lineWidth=1;g.beginPath();g.moveTo(...up(D,h));g.lineTo(...up(C,h));g.lineTo(...up(B,h));g.stroke();
}
/** 빛은 모아 두었다가 색 보정(밤·새벽) 뒤에 마지막으로 더한다 — 어두운 장면일수록 등불이 살아난다. */
let LIGHTS:Array<[number,number,number,string,number]>|null=null;
let SHAFTS:Array<{side:'left'|'right';t1:number;t2:number}>=[];
function glow(g:Ctx,x:number,y:number,rad:number,color:string,alpha=0.5){
  if(LIGHTS){LIGHTS.push([x,y,rad,color,alpha]);return;}
  lightNow(g,x,y,rad,color,alpha);
}
function lightNow(g:Ctx,x:number,y:number,rad:number,color:string,alpha:number){
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
/** 칸마다 정해진 무작위(같은 장면은 늘 같은 바닥). */
const cellRand=(c:number,r:number,k=0)=>{let h=Math.imul(c*73856093^r*19349663^k*83492791,2654435761)>>>0;h^=h>>>15;return (h%10000)/10000;};
function floorTile(g:Ctx,c:number,r:number,f:Floor,R:()=>number){
  const d=diamond(c,r);
  if(f==='wood'){
    // 판자: 칸을 세 줄로 나누고, 줄마다 이음매 자리가 달라 긴 판자가 이어져 보인다.
    for(let k=0;k<3;k++){
      const v0=r+k/3,v1=r+(k+1)/3,off=cellRand(0,Math.floor(r*3+k),7)*2.5,plank=Math.floor((c-off)/2.5);
      const tone=0.9+cellRand(plank,Math.floor(r*3+k),3)*0.18;
      poly(g,[pt(c,v0),pt(c+1,v0),pt(c+1,v1),pt(c,v1)],shade(FLOOR.wood,tone));
      g.strokeStyle='rgba(30,16,6,.35)';g.lineWidth=1;g.beginPath();g.moveTo(...pt(c,v1));g.lineTo(...pt(c+1,v1));g.stroke();
      // 결
      g.strokeStyle=`rgba(${tone>1?'255,225,180':'40,20,8'},.12)`;for(let i=0;i<2;i++){const v=v0+(i+1)/3/3;g.beginPath();g.moveTo(...pt(c,v));g.lineTo(...pt(c+1,v+0.01*(cellRand(c,r,i+k)-0.5)));g.stroke();}
      // 이음매와 못
      const seam=off+(plank+1)*2.5;if(seam>c&&seam<c+1){g.strokeStyle='rgba(25,12,4,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(...pt(seam,v0));g.lineTo(...pt(seam,v1));g.stroke();
        for(const vv of [v0+0.08,v1-0.08]){const [x,y]=pt(seam-0.05,vv);g.fillStyle='rgba(20,12,6,.7)';g.fillRect(x-1,y-1,2,2);}}
      if(cellRand(c,r,k+11)<0.06){const [x,y]=pt(c+0.5,(v0+v1)/2);g.fillStyle='rgba(40,20,8,.35)';g.beginPath();g.ellipse(x,y,5,2.5,0,0,7);g.fill();}
    }
    g.strokeStyle='rgba(255,230,190,.06)';g.lineWidth=1;g.beginPath();g.moveTo(...pt(c,r));g.lineTo(...pt(c+1,r));g.stroke();
  }else if(f==='stone'||f==='paving'){
    // 돌판: 한 칸을 둘로 나눈 돌, 위쪽 모서리는 밝게·아래쪽은 어둡게(빛이 왼쪽 위에서)
    const split=cellRand(c,r,1)<0.5,parts=split?[[c,r,0.5,1],[c+0.5,r,0.5,1]]:[[c,r,1,0.5],[c,r+0.5,1,0.5]];
    poly(g,d,'#3a3632');
    for(const [a,b,w,h] of parts as Array<[number,number,number,number]>){
      const gap=0.035,q=[pt(a+gap,b+gap),pt(a+w-gap,b+gap),pt(a+w-gap,b+h-gap),pt(a+gap,b+h-gap)];
      poly(g,q,shade(FLOOR[f],0.86+cellRand(a*2,b*2,2)*0.24));
      g.strokeStyle='rgba(255,250,235,.22)';g.lineWidth=1.2;g.beginPath();g.moveTo(...q[3]!);g.lineTo(...q[0]!);g.lineTo(...q[1]!);g.stroke();
      g.strokeStyle='rgba(0,0,0,.28)';g.beginPath();g.moveTo(...q[1]!);g.lineTo(...q[2]!);g.lineTo(...q[3]!);g.stroke();
      if(cellRand(a*2,b*2,5)<0.12){const [x,y]=pt(a+w*0.5,b+h*0.5);g.strokeStyle='rgba(30,28,24,.35)';g.lineWidth=1;g.beginPath();g.moveTo(x-8,y-2);g.lineTo(x-2,y+1);g.lineTo(x+6,y-1);g.stroke();}
      if(f==='paving'&&cellRand(a*2,b*2,6)<0.1){const [x,y]=pt(a+gap,b+h*0.5);g.fillStyle='rgba(80,110,50,.45)';g.beginPath();g.ellipse(x+4,y,6,2,0.4,0,7);g.fill();}
    }
  }else if(f==='mat'){
    poly(g,d,shade(FLOOR.mat,0.92+cellRand(c,r)*0.14),'rgba(80,60,30,.45)',1);
    g.strokeStyle='rgba(90,70,40,.22)';g.lineWidth=1;for(let i=1;i<8;i++){const a=pt(c,r+i/8),b=pt(c+1,r+i/8);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
    g.strokeStyle='rgba(60,40,20,.25)';g.beginPath();g.moveTo(...pt(c+0.5,r));g.lineTo(...pt(c+0.5,r+1));g.stroke();
  }else{
    poly(g,d,shade(FLOOR[f],0.97+cellRand(c,r)*0.06));
  }
}
/** 흙·풀·모래 바닥 위에 얼룩·풀포기·꽃·자갈을 흩뿌린다(칸 무늬가 드러나지 않게). */
function scatterGround(g:Ctx,f:Floor,R:()=>number,isWater:(x:number,y:number)=>boolean){
  if(f!=='grass'&&f!=='dirt'&&f!=='sand')return;
  const base=FLOOR[f];
  // 얼룩은 따로 그려 한 번에 흐린다(얼룩마다 흐리면 느리다)
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d')!;
  for(let i=0;i<320;i++){const x=R()*W,y=R()*H;if(isWater(x,y))continue;o.fillStyle=shade(base,R()<0.5?0.8:1.16).replace('rgb','rgba').replace(')',',.3)');o.beginPath();o.ellipse(x,y,24+R()*70,10+R()*26,0,0,7);o.fill();}
  g.save();g.filter='blur(10px)';g.drawImage(off,0,0);g.restore();
  if(f==='grass'){
    for(let i=0;i<1400;i++){const x=R()*W,y=R()*H;if(isWater(x,y))continue;const tall=4+R()*7;g.strokeStyle=R()<0.55?`rgba(${150+R()*60|0},${190+R()*40|0},90,.55)`:'rgba(28,58,20,.5)';g.lineWidth=1.2;
      g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y-tall);g.moveTo(x,y);g.lineTo(x+2,y-tall*0.8);g.stroke();}
    for(let i=0;i<110;i++){const x=R()*W,y=R()*H;if(isWater(x,y))continue;g.fillStyle=['#f4f0e0','#f2d24a','#e98aa8','#c9a0e8'][Math.floor(R()*4)]!;g.beginPath();g.arc(x,y,1.8,0,7);g.fill();}
  }else{
    for(let i=0;i<520;i++){const x=R()*W,y=R()*H;if(isWater(x,y))continue;g.fillStyle=R()<0.5?'rgba(50,34,18,.4)':'rgba(240,225,190,.3)';g.beginPath();g.ellipse(x,y,1.5+R()*2.5,1+R()*1.5,0,0,7);g.fill();}
    if(f==='dirt')for(let i=0;i<5;i++){const y=R()*H,x=R()*W;g.strokeStyle='rgba(60,40,20,.22)';g.lineWidth=3;g.beginPath();g.moveTo(x-200,y-100);g.quadraticCurveTo(x,y+20,x+220,y+110);g.stroke();}
  }
}
/** 고운 입자(화면 전체의 질감). */
function grain(g:Ctx,R:()=>number,alpha:number){
  const t=document.createElement('canvas');t.width=t.height=128;const tg=t.getContext('2d')!,img=tg.createImageData(128,128);
  for(let i=0;i<img.data.length;i+=4){const v=R()*255|0;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}
  tg.putImageData(img,0,0);g.save();g.globalAlpha=alpha;g.globalCompositeOperation='overlay';g.fillStyle=g.createPattern(t,'repeat')!;g.fillRect(0,0,W,H);g.restore();
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
  if(lit){const [m]=onWall(side,(t1+t2)/2,(t1+t2)/2,(z1+z2)/2,(z1+z2)/2);glow(g,m[0],m[1],90,'rgba(255,214,140,A)',0.25);SHAFTS.push({side,t1,t2});}
}
function hangingScroll(g:Ctx,side:'left'|'right',t1:number,t2:number,R:()=>number){
  poly(g,onWall(side,t1,t2,72,178),'#efe4c4','#3a2410',1);poly(g,onWall(side,t1-0.04,t2+0.04,176,184),'#5a3418');poly(g,onWall(side,t1-0.04,t2+0.04,68,74),'#5a3418');
  g.strokeStyle='rgba(30,20,12,.85)';g.lineWidth=2.4;for(let i=0;i<4;i++){const t=t1+(t2-t1)*(0.35+0.3*R()),z=160-i*22,[a]=onWall(side,t,t,z,z),[b]=onWall(side,t,t,z-14,z-14);g.beginPath();g.moveTo(a[0]-3,a[1]);g.lineTo(b[0]+2,b[1]);g.stroke();}
  const [seal]=onWall(side,t2-0.06,t2-0.06,86,86);g.fillStyle='#b8261a';g.fillRect(seal[0]-3,seal[1]-6,5,5);
}
function drape(g:Ctx,side:'left'|'right',t1:number,t2:number,h:number){
  poly(g,onWall(side,t1,t2,60,h-30),'#8b1a12','#3a0806',1);poly(g,onWall(side,t1,t2,h-44,h-30),'#c9952a');
  const [a]=onWall(side,(t1+t2)/2,(t1+t2)/2,h/2,h/2);g.fillStyle='rgba(230,180,60,.8)';g.beginPath();g.arc(a[0],a[1],9,0,7);g.fill();
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
    if(kind!=='store')for(let t=1.6;t<N;t+=3.2){lattice(g,side,t,t+1.5,86,170,kind!=='study'||R()<0.6);
      // 창과 창 사이: 족자·그림·붉은 휘장
      const m=t+2.35;if(kind==='palace')drape(g,side,m-0.3,m+0.3,h);else if(R()<0.75)hangingScroll(g,side,m-0.22,m+0.22,R);}
    else for(let t=2;t<N;t+=4){poly(g,onWall(side,t,t+1.2,100,140),'#20140a');}
  }
  // 벽을 따라 선 붉은 기둥
  const pc=kind==='palace'?'#8b1e12':kind==='corridor'?'#7a2014':'#5a3420';
  for(let t=0;t<N;t+=3.2){pillar(g,0.05,t,h,pc);pillar(g,t,0.05,h,pc);}
  if(kind==='corridor')for(let t=3;t<N;t+=3.2)pillar(g,8,t,h,pc);
}

// ─────────────────────────────────────────────── 소품
type Prop={c:number;r:number;w:number;d:number;draw:(g:Ctx)=>void;solid:boolean;canopy?:boolean};
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
  const [x,y]=pt(c+0.2,r+0.2);glow(g,x,y-76,100,'rgba(255,200,110,A)',0.38);
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
function tree(c:number,r:number,R:()=>number,blossom=false,big=1):Prop{return {...P(c,r,0.6,0.6,g=>{
  const [x,y]=pt(c+0.3,r+0.3);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+10,y+2,46*big,18*big,0,0,7);g.fill();
  g.fillStyle='#4a3020';g.beginPath();g.moveTo(x-7,y);g.lineTo(x-3,y-74*big);g.lineTo(x+4,y-74*big);g.lineTo(x+8,y);g.closePath();g.fill();
  g.strokeStyle='#3a2416';g.lineWidth=3;g.beginPath();g.moveTo(x,y-50*big);g.lineTo(x-22*big,y-82*big);g.moveTo(x+2,y-60*big);g.lineTo(x+24*big,y-90*big);g.stroke();
  // 잎: 어두운 속 → 중간 → 왼쪽 위 밝은 잎 순으로 작은 덩어리를 겹친다
  const autumn=!blossom&&R()<0.22,base=blossom?'#e3aabb':autumn?'#c9922e':'#4f7a33';
  for(const [k,n,lift] of [[0.62,26,0],[0.88,30,6],[1.18,22,12]] as const)for(let i=0;i<n;i++){
    const a=R()*Math.PI*2,rr=Math.sqrt(R())*50*big,ox=Math.cos(a)*rr*1.15-(lift?lift*0.6:0),oy=-96*big+Math.sin(a)*rr*0.75-lift;
    g.fillStyle=shade(base,k*(0.92+R()*0.16));g.beginPath();g.ellipse(x+ox,y+oy,(9+R()*9)*big,(7+R()*6)*big,R()*3,0,7);g.fill();}
  if(blossom)for(let i=0;i<40;i++){g.fillStyle='rgba(255,240,245,.85)';g.beginPath();g.arc(x+(R()-0.5)*110*big,y-60*big-R()*90*big,1.6,0,7);g.fill();}
}),canopy:true};}
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
function stall(c:number,r:number,R:()=>number,cloth:string):Prop{return P(c,r,2,1,g=>{
  prism(g,c,r,2,1,26,'#6b4426');for(let i=0;i<5;i++){const [x,y]=up(pt(c+0.3+i*0.35,r+0.5),30);g.fillStyle=['#c9a14a','#9b4a2a','#7a9a4a','#e0d0a0','#b8603a'][Math.floor(R()*5)]!;g.beginPath();g.ellipse(x,y,7,4,0,0,7);g.fill();}
  for(const [a,b] of [[0,0],[2,0],[0,1],[2,1]] as const){const [x,y]=pt(c+a,r+b);g.strokeStyle='#3a2410';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-74);g.stroke();}
  const A=up(pt(c-0.1,r-0.1),74),B=up(pt(c+2.1,r-0.1),74),C=up(pt(c+2.1,r+1.1),64),D=up(pt(c-0.1,r+1.1),64);poly(g,[A,B,C,D],cloth,'#1a0c08');
  for(let i=1;i<6;i++){const t=i/6,p0=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t],p1=[D[0]+(C[0]-D[0])*t,D[1]+(C[1]-D[1])*t];g.strokeStyle='rgba(255,240,210,.35)';g.lineWidth=3;g.beginPath();g.moveTo(p0[0]!,p0[1]!);g.lineTo(p1[0]!,p1[1]!);g.stroke();}
});}
function well(c:number,r:number):Prop{return P(c,r,1,1,g=>{prism(g,c,r,1,1,30,'#8e8b82');poly(g,diamond(c+0.15,r+0.15,0.7,0.7).map(p=>up(p,30)),'#1c2a30');const [x,y]=pt(c+0.5,r+0.5);g.strokeStyle='#4a3020';g.lineWidth=3;g.beginPath();g.moveTo(x-30,y-30);g.lineTo(x-30,y-86);g.lineTo(x+30,y-86);g.lineTo(x+30,y-30);g.stroke();});}
function mast(c:number,r:number):Prop{return P(c,r,0.5,0.5,g=>{
  const [x,y]=pt(c+0.25,r+0.25);g.strokeStyle='#4a2c14';g.lineWidth=8;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-330);g.stroke();
  poly(g,[[x-90,y-300],[x+90,y-290],[x+80,y-120],[x-80,y-130]],'#e6dcc0','#5a4a30');g.strokeStyle='rgba(120,90,50,.5)';g.lineWidth=2;for(let i=1;i<5;i++){g.beginPath();g.moveTo(x-88+i*0.5,y-300+i*36);g.lineTo(x+88-i*2,y-290+i*36);g.stroke();}
  g.strokeStyle='rgba(40,30,20,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y-330);g.lineTo(x-260,y+40);g.moveTo(x,y-330);g.lineTo(x+260,y+20);g.stroke();
});}
function cushion(c:number,r:number,col='#7a2a1c'):Prop{return P(c,r,0.6,0.6,g=>{prism(g,c,r,0.6,0.6,7,col);const [x,y]=up(pt(c+0.3,r+0.3),7);g.fillStyle='rgba(230,190,90,.7)';g.fillRect(x-2,y-1,4,2);},false);}
function vase(c:number,r:number,col='#2f5a6a'):Prop{return P(c,r,0.4,0.4,g=>{const [x,y]=pt(c+0.2,r+0.2);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,y,12,5,0,0,7);g.fill();
  g.fillStyle=col;g.strokeStyle='#14100c';g.lineWidth=1.5;g.beginPath();g.moveTo(x-5,y-36);g.quadraticCurveTo(x-16,y-22,x-8,y-2);g.lineTo(x+8,y-2);g.quadraticCurveTo(x+16,y-22,x+5,y-36);g.closePath();g.fill();g.stroke();
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x-6,y-26,2,12);g.strokeStyle='rgba(230,210,150,.7)';g.beginPath();g.moveTo(x-11,y-18);g.lineTo(x+11,y-18);g.stroke();});}
function chest(c:number,r:number,col='#6a2a18'):Prop{return P(c,r,1,0.6,g=>{prism(g,c,r,1,0.6,30,col);const a=up(pt(c,r+0.6),18),b=up(pt(c+1,r+0.6),18);g.strokeStyle='#c9952a';g.lineWidth=2;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();const [x,y]=up(pt(c+0.5,r+0.6),14);g.fillStyle='#d8aa3a';g.fillRect(x-3,y-4,6,6);});}
function censer(c:number,r:number,R:()=>number):Prop{return P(c,r,0.5,0.5,g=>{prism(g,c+0.1,r+0.1,0.3,0.3,22,'#6a5a3a');prism(g,c,r,0.5,0.5,14,'#9a7a3a',22);const [x,y]=up(pt(c+0.25,r+0.25),38);
  g.strokeStyle='rgba(220,220,230,.35)';g.lineWidth=3;g.beginPath();g.moveTo(x,y);for(let i=1;i<6;i++)g.lineTo(x+Math.sin(i*1.4+R())*8,y-i*14);g.stroke();});}
function plant(c:number,r:number,R:()=>number):Prop{return P(c,r,0.5,0.5,g=>{prism(g,c+0.05,r+0.05,0.4,0.4,18,'#6a4a3a');const [x,y]=up(pt(c+0.25,r+0.25),18);for(let i=0;i<9;i++){g.strokeStyle=shade('#3f7a3a',0.7+R()*0.5);g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(R()-0.5)*30,y-20,x+(R()-0.5)*40,y-30-R()*20);g.stroke();}});}
function armorStand(c:number,r:number):Prop{return P(c,r,0.5,0.5,g=>{const [x,y]=pt(c+0.25,r+0.25);g.strokeStyle='#3a2410';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-70);g.stroke();
  poly(g,[[x-16,y-74],[x+16,y-74],[x+13,y-36],[x-13,y-36]],'#4a4e58','#141418');for(let i=0;i<4;i++){g.strokeStyle='rgba(200,170,90,.6)';g.beginPath();g.moveTo(x-14,y-66+i*8);g.lineTo(x+14,y-66+i*8);g.stroke();}
  g.fillStyle='#3a3e48';g.beginPath();g.arc(x,y-84,10,Math.PI,0);g.fill();g.fillStyle='#b8261a';g.fillRect(x-2,y-100,4,8);});}
function barrel(c:number,r:number):Prop{return P(c,r,0.55,0.55,g=>{const [x,y]=pt(c+0.27,r+0.27);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,y,16,7,0,0,7);g.fill();
  g.fillStyle='#7a5230';g.strokeStyle='#2a1a0c';g.lineWidth=1.5;g.beginPath();g.moveTo(x-14,y-2);g.lineTo(x-16,y-26);g.lineTo(x-14,y-48);g.lineTo(x+14,y-48);g.lineTo(x+16,y-26);g.lineTo(x+14,y-2);g.closePath();g.fill();g.stroke();
  for(const z of [10,26,40]){g.strokeStyle='#3a3a3a';g.lineWidth=2;g.beginPath();g.moveTo(x-15,y-z);g.lineTo(x+15,y-z);g.stroke();}g.fillStyle='#5a3a20';g.beginPath();g.ellipse(x,y-48,14,6,0,0,7);g.fill();});}
function hay(c:number,r:number,R:()=>number):Prop{return P(c,r,0.9,0.7,g=>{const [x,y]=pt(c+0.45,r+0.35);g.fillStyle='#c9a24a';g.strokeStyle='#6a5020';g.lineWidth=1.2;g.beginPath();g.ellipse(x,y-14,26,16,0,0,7);g.fill();g.stroke();
  for(let i=0;i<14;i++){g.strokeStyle='rgba(120,90,30,.6)';g.beginPath();const a=R()*6.28;g.moveTo(x+Math.cos(a)*10,y-14+Math.sin(a)*6);g.lineTo(x+Math.cos(a)*24,y-14+Math.sin(a)*14);g.stroke();}});}
function cart(c:number,r:number):Prop{return P(c,r,2,1,g=>{prism(g,c,r+0.1,2,0.8,14,'#7a5230',18);for(const cc of [c+0.4,c+1.6]){const [x,y]=pt(cc,r+0.95);g.strokeStyle='#2a1a0c';g.lineWidth=3;g.fillStyle='#5a3a1e';g.beginPath();g.ellipse(x,y-14,13,16,0,0,7);g.fill();g.stroke();}
  const [a]=[pt(c+2,r+0.5)];g.strokeStyle='#5a3a1e';g.lineWidth=3;g.beginPath();g.moveTo(a[0],a[1]-24);g.lineTo(a[0]+60,a[1]+4);g.stroke();prism(g,c+0.2,r+0.25,1.5,0.5,18,'#c9b07a',32);});}
function reeds(c:number,r:number,R:()=>number):Prop{return P(c,r,0.6,0.6,g=>{const [x,y]=pt(c+0.3,r+0.3);for(let i=0;i<12;i++){const ox=(R()-0.5)*30;g.strokeStyle=shade('#6a8a3a',0.7+R()*0.5);g.lineWidth=1.6;g.beginPath();g.moveTo(x+ox,y);g.quadraticCurveTo(x+ox+(R()-0.5)*8,y-20,x+ox+(R()-0.5)*14,y-34-R()*16);g.stroke();
  if(R()<0.4){g.fillStyle='#7a5a2a';g.fillRect(x+ox-1,y-40-R()*10,3,8);}}},false);}
function pine(c:number,r:number,R:()=>number,big=1):Prop{return {...P(c,r,0.6,0.6,g=>{const [x,y]=pt(c+0.3,r+0.3);g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y,34*big,14*big,0,0,7);g.fill();g.fillStyle='#4a3020';g.fillRect(x-5,y-40*big,10,40*big);
  for(let i=0;i<4;i++){const w=(46-i*9)*big,yy=y-(34+i*30)*big;g.fillStyle=shade('#2f5a32',0.75+i*0.1+R()*0.1);g.beginPath();g.moveTo(x-w,yy);g.lineTo(x,yy-44*big);g.lineTo(x+w,yy);g.closePath();g.fill();g.strokeStyle='rgba(10,30,10,.4)';g.stroke();}}),canopy:true};}
function bamboo(c:number,r:number,R:()=>number):Prop{return {...P(c,r,0.8,0.8,g=>{const [x,y]=pt(c+0.4,r+0.4);for(let i=0;i<9;i++){const ox=(R()-0.5)*40,h=110+R()*80;g.strokeStyle=shade('#6a9a3a',0.7+R()*0.4);g.lineWidth=4;g.beginPath();g.moveTo(x+ox,y);g.lineTo(x+ox+(R()-0.5)*10,y-h);g.stroke();
  for(let k=0;k<h;k+=24){g.strokeStyle='rgba(40,60,20,.5)';g.lineWidth=1;g.beginPath();g.moveTo(x+ox-2,y-k);g.lineTo(x+ox+2,y-k);g.stroke();}
  for(let k=0;k<4;k++){g.fillStyle=shade('#5a8a3a',0.7+R()*0.5);g.beginPath();g.ellipse(x+ox+(R()-0.5)*30,y-h+R()*40,12,4,R()*3,0,7);g.fill();}}}),canopy:true};}
function firewood(c:number,r:number):Prop{return P(c,r,1,0.6,g=>{for(let i=0;i<9;i++){const [x,y]=up(pt(c+0.2+(i%3)*0.3,r+0.3),6+Math.floor(i/3)*10);g.fillStyle='#6a4a2a';g.strokeStyle='#2a1a0c';g.beginPath();g.ellipse(x,y,7,5,0,0,7);g.fill();g.stroke();g.fillStyle='#b8925a';g.beginPath();g.ellipse(x,y,3,2,0,0,7);g.fill();}});}
function fence(c:number,r:number,len:number,alongC=true):Prop{return P(c,r,alongC?len:0.1,alongC?0.1:len,g=>{for(let i=0;i<=len*2;i++){const [x,y]=alongC?pt(c+i/2,r):pt(c,r+i/2);g.fillStyle='#6a4a2a';g.fillRect(x-2,y-30,4,30);}
  for(const z of [10,24]){const a=up(alongC?pt(c,r):pt(c,r),z),b=up(alongC?pt(c+len,r):pt(c,r+len),z);g.strokeStyle='#5a3a1e';g.lineWidth=3;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}});}
function pond(c:number,r:number,w:number,d:number,R:()=>number):Prop{return P(c,r,w,d,g=>{const [x,y]=pt(c+w/2,r+d/2);g.fillStyle='#7d7a72';g.beginPath();g.ellipse(x,y,w*30+8,d*16+5,0,0,7);g.fill();g.fillStyle='#2f5a6a';g.beginPath();g.ellipse(x,y,w*30,d*16,0,0,7);g.fill();
  g.fillStyle='rgba(200,230,240,.25)';g.beginPath();g.ellipse(x-10,y-4,w*14,d*5,0,0,7);g.fill();for(let i=0;i<5;i++){g.fillStyle='#4a7a3a';g.beginPath();g.ellipse(x+(R()-0.5)*w*40,y+(R()-0.5)*d*18,6,3,0,0,7);g.fill();}
  for(let i=0;i<3;i++){g.fillStyle=['#e8742a','#f0f0e8','#e8742a'][i]!;g.beginPath();g.ellipse(x+(R()-0.5)*w*30,y+(R()-0.5)*d*12,4,1.5,R(),0,7);g.fill();}});}
function mat(c:number,r:number,w:number,d:number,col='#7a8a4a'):Prop{return P(c,r,w,d,g=>{poly(g,diamond(c,r,w,d),shade(col,0.92),'rgba(40,40,20,.5)',1);poly(g,diamond(c+0.08,r+0.08,w-0.16,d-0.16),'rgba(0,0,0,0)','rgba(230,220,160,.35)',1);
  g.strokeStyle='rgba(60,70,30,.25)';for(let i=1;i<w*6;i++){g.beginPath();g.moveTo(...pt(c+i/6,r));g.lineTo(...pt(c+i/6,r+d));g.stroke();}},false);}
function lowTable(c:number,r:number,w:number,d:number,R:()=>number):Prop{return P(c,r,w,d,g=>{
  for(const [a,b] of [[0.1,0.1],[w-0.2,0.1],[0.1,d-0.2],[w-0.2,d-0.2]] as const)prism(g,c+a,r+b,0.1,0.1,16,'#2a1810');
  prism(g,c,r,w,d,6,'#7a4a28',16);
  for(let i=0;i<Math.max(1,Math.floor(w*d));i++){const [x,y]=up(pt(c+0.3+R()*(w-0.6),r+0.3+R()*(d-0.6)),22);g.fillStyle=R()<0.5?'#efe2bf':'#c9a86a';g.fillRect(x-6,y-3,12,4);}
});}
function runner(c:number,r:number,w:number,d:number):Prop{return P(c,r,w,d,g=>{poly(g,diamond(c,r,w,d),'#8a8270','rgba(40,36,30,.6)',1);poly(g,diamond(c+0.12,r+0.12,w-0.24,d-0.24),'#b0a888');
  for(let t=1;t<d;t+=2.2){const [x,y]=pt(c+w/2,r+t);g.strokeStyle='rgba(120,100,60,.55)';g.lineWidth=2;g.beginPath();g.ellipse(x,y,w*15,w*7.5,0,0,7);g.stroke();g.beginPath();g.ellipse(x,y,w*8,w*4,0,0,7);g.stroke();}},false);}
function thatchedHouse(g:Ctx,c:number,r:number,w:number,d:number,R:()=>number){
  prism(g,c-0.1,r-0.1,w+0.2,d+0.2,22,'#8a8274');
  for(let i=0;i<w*4;i++){const [x,y]=up(pt(c-0.1+i/4,r+d+0.1),6+(i%2)*8);g.fillStyle='rgba(60,56,50,.45)';g.beginPath();g.ellipse(x,y,6,3,0,0,7);g.fill();}
  prism(g,c,r,w,d,74,'#d8cdb4',22);
  // 나무 기둥·창·문
  for(let t=0;t<=w;t+=1){const a=up(pt(c+t,r+d),22);g.fillStyle='#4a3020';g.fillRect(a[0]-3,a[1]-74,6,74);}
  for(let t=0.25;t<w-0.4;t+=1.1){const a=up(pt(c+t,r+d),46),b=up(pt(c+t+0.5,r+d),46);poly(g,[a,b,up(b,22),up(a,22)],'#5a3a20','#2a1a0c',1);g.strokeStyle='#d8c08a';g.lineWidth=1;g.beginPath();g.moveTo((a[0]+b[0])/2,(a[1]+b[1])/2);g.lineTo((a[0]+b[0])/2,(a[1]+b[1])/2-22);g.stroke();}
  // 초가지붕: 둥글게 부푼 짚, 결을 따라 짧은 붓질
  const h=96,o=0.55,A=up(pt(c-o,r-o),h),B=up(pt(c+w+o,r-o),h),C=up(pt(c+w+o,r+d+o),h-6),D=up(pt(c-o,r+d+o),h-6),RA=up(pt(c+w*0.2,r+d/2),h+70),RB=up(pt(c+w*0.8,r+d/2),h+70);
  poly(g,[D,C,RB,RA],'#a8884a','rgba(60,40,20,.6)',1);poly(g,[C,B,RB],'#8a6e3a','rgba(60,40,20,.6)',1);poly(g,[A,D,RA],'#9a7c42','rgba(60,40,20,.6)',1);
  for(let i=0;i<260;i++){const t=R(),u=R(),px=D[0]+(C[0]-D[0])*t+(RA[0]+(RB[0]-RA[0])*t-(D[0]+(C[0]-D[0])*t))*u,py=D[1]+(C[1]-D[1])*t+(RA[1]+(RB[1]-RA[1])*t-(D[1]+(C[1]-D[1])*t))*u;
    g.strokeStyle=R()<0.5?'rgba(220,190,120,.45)':'rgba(90,60,30,.35)';g.lineWidth=1.2;g.beginPath();g.moveTo(px,py);g.lineTo(px+2,py+8);g.stroke();}
  g.strokeStyle='rgba(70,50,25,.7)';g.lineWidth=4;g.beginPath();g.moveTo(...RA);g.lineTo(...RB);g.stroke();
}
function stoneBorder(c:number,r:number,len:number,R:()=>number,alongC=true):Prop{return P(c,r,alongC?len:0.4,alongC?0.4:len,g=>{for(let i=0;i<len*3;i++){const [x,y]=alongC?pt(c+i/3,r+0.2):pt(c+0.2,r+i/3);g.fillStyle=shade('#9a958a',0.8+R()*0.3);g.strokeStyle='rgba(30,28,24,.5)';g.lineWidth=1;g.beginPath();g.ellipse(x,y-4,10+R()*5,6+R()*3,R(),0,7);g.fill();g.stroke();
  if(R()<0.3){g.fillStyle=['#b89ad8','#e8e0f0','#f2d24a'][Math.floor(R()*3)]!;g.beginPath();g.arc(x+(R()-0.5)*14,y-12,2,0,7);g.fill();}}},false);}
function pots(c:number,r:number):Prop{return P(c,r,0.8,0.6,g=>{for(const [dc,dr,s] of [[0.2,0.2,1],[0.55,0.35,0.75]] as const){const [x,y]=pt(c+dc,r+dr);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,y,14*s,6*s,0,0,7);g.fill();g.fillStyle='#5a4a3a';g.strokeStyle='#1a120c';g.lineWidth=1;g.beginPath();g.ellipse(x,y-14*s,13*s,15*s,0,0,7);g.fill();g.stroke();g.fillStyle='#3a2e24';g.beginPath();g.ellipse(x,y-27*s,8*s,3*s,0,0,7);g.fill();}});}
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
function build(kind:Kind,seed:number,place=''):IsoScene{
  const R=rng(seed),indoor=INDOOR.has(kind),mood=moodOf(place,kind);
  LIGHTS=[];SHAFTS=[];
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d')!;
  const floor:Floor=kind==='corridor'?'stone':kind==='palace'?'wood':kind==='tent'?'mat':kind==='store'?'wood':indoor?'wood':kind==='court'||kind==='town'?'dirt':kind==='gatehouse'||kind==='wall'||kind==='fort'||kind==='fire'?'paving':kind==='deck'?'wood':kind==='bank'?'sand':kind==='valley'||kind==='camp'?'dirt':'grass';
  const props:Prop[]=[],waterCells=new Set<string>();
  const add=(p:Prop)=>props.push(p);
  // 소품 배치: 대본의 사람들은 대개 화면 가운데 아래에 서므로, 무거운 소품은 뒤쪽 가장자리에.
  switch(kind){
    case 'palace':
      // 조회·군의의 대청: 가운데 통로, 양옆에 긴 탁자와 자리(초록 돗자리)가 늘어선다
      add(runner(5.6,2.8,2.2,12));add(throne(5.2,0.3));
      for(let i=0;i<3;i++){add(mat(2.4,3.6+i*3,2.4,1.6));add(lowTable(2.6,3.4+i*3,2,0.5,R));add(mat(8.8,3.6+i*3,2.4,1.6));add(lowTable(9,3.4+i*3,2,0.5,R));}
      add(lamp(4.6,1.2));add(lamp(8.6,1.2));add(censer(4.6,13.4,R));add(screenPanel(12.4,0.35,3));add(vase(0.6,0.6,'#c9952a'));add(plant(0.5,14.5,R));add(plant(14.5,0.5,R));add(armorStand(0.6,8.6));add(chest(13.5,6.2));
      break;
    case 'hall':case 'study':case 'corridor':
      add(rug(5,5,6,5,'#7a2a1c'));
      add(table(1.4,1.6,2.2,1.2,R));
      add(lamp(1.1,4.2));add(lamp(4.4,1.1));add(lamp(1.1,10.5));add(lamp(10.5,1.1));
      if(kind==='study'){add(shelf(0.35,6,3.2,R));add(shelf(0.35,12,3.2,R));add(screenPanel(7,0.35,3));}
      else add(screenPanel(13,0.35,3));
      add(cushion(2,3.2));add(cushion(3.2,3.2,'#2a3a6a'));add(vase(0.5,2.2));add(vase(2.4,0.5,'#8a3a2a'));add(censer(4.2,3.2,R));add(plant(0.5,14.5,R));add(plant(14.5,0.5,R));
      if(kind!=='study'){add(chest(11.5,0.5));add(armorStand(0.6,8.6));}
      break;
    case 'tent':
      add(rug(4,4,6,5,'#5a3a22'));add(table(5.4,5.2,3,2,R));add(rack(0.4,3,3));add(brazier(1.4,9,R));add(brazier(9.5,1.4,R));add(banner(0.6,0.6,'#8a1f1a'));add(armorStand(3,0.6));add(chest(6,0.5));add(chest(0.5,12,'#4a3018'));add(cushion(4.6,6));add(cushion(8.6,6.4));add(barrel(12,0.6));
      break;
    case 'store':
      for(let i=0;i<5;i++)add(crate(0.4+(i%2)*1.1,1.4+i*1.6,0.9));for(let i=0;i<4;i++)add(sacks(3+i*1.4,0.3,R));add(rack(10,0.4,3));add(lamp(6,6));for(let i=0;i<4;i++)add(barrel(13.5+(i%2)*0.6,0.4+Math.floor(i/2)*0.6));add(hay(2.6,9,R));add(chest(0.5,10.5,'#4a3018'));
      break;
    case 'court':
      add(stoneLantern(4.5,9));add(stoneLantern(9,4.5));add(tree(1.5,10,R,true,1.1));add(tree(10.5,1.6,R,true,1));add(bush(3,12,R));add(bush(12,3,R));add(pond(11.5,5.5,2.2,1.6,R));add(bamboo(0.5,13.5,R));add(bamboo(13.5,0.5,R));add(rock(9.8,7.8,R,0.5));add(pots(7.2,1.2));add(stoneBorder(1.2,4.6,4,R));add(stoneBorder(4.6,1.2,3.4,R,false));add(pots(0.6,7.4));
      break;
    case 'gatehouse':case 'wall':case 'fort':
      add(banner(2,1.2,'#8a1f1a'));add(banner(1.2,6,'#1f3f8a'));add(rack(6,1,2.4));add(crate(1,9.5,0.9));add(brazier(9,2.2,R));add(barrel(1,11));add(barrel(1.6,11.4));add(brazier(2.2,9.2,R));add(firewood(12,1));add(cart(10.5,3.4));
      break;
    case 'camp':
      add(tent(0.6,1,3,3,'#e6dcc4'));add(tent(5.6,0.4,2.6,2.6,'#ddd0b4'));add(tent(0.4,6.4,2.6,2.6,'#e2d6bc'));add(tent(9.6,-0.6,2.4,2.4,'#d8c8a8'));add(banner(4.2,3.6,'#8a1f1a'));add(banner(3.6,10.2,'#1f3f8a'));add(campfire(8,8,R));add(rack(10.5,2.4,2.4));add(crate(4,9.5,0.8));add(barrel(4.8,9.8));add(hay(13,2.4,R));add(firewood(9,6.6));add(cart(0.6,10.6));add(armorStand(8.6,2.6));
      break;
    case 'fire':
      add(crate(5,9,0.8));add(rock(9,6,R,0.6));
      break;
    case 'town':
      add(stall(1.2,7,R,'#9b2a1c'));add(stall(7,1.2,R,'#2a5a8a'));add(stall(1.2,11,R,'#3a7a3a'));add(well(9.5,9.5));add(crate(4,10.5,0.8));add(sacks(10.5,4,R));add(banner(5,0.8,'#8a1f1a'));add(barrel(12,1.2));add(cart(11,6));add(pots(3.4,6.6));add(stoneBorder(1,4.2,3,R));add(tree(13.4,2.6,R));add(bush(0.6,13,R));
      break;
    case 'deck':
      for(let c=-14;c<N+8;c++)for(let r=-14;r<N+8;r++)if(!(c>=0&&c<=15&&r>=3&&r<=11))waterCells.add(`${c},${r}`);
      add(mast(6,6.6));add(crate(1,4,0.8));add(crate(1,5,0.8));add(sacks(13,4,R));add(rack(10,3.1,2));
      break;
    case 'river':case 'bank':
      for(let c=-8;c<N+8;c++)for(let r=-8;r<N+8;r++){const band=kind==='river'?(r-c>=-1&&r-c<=3):(c+r>=4&&c+r<=7);if(band)waterCells.add(`${c},${r}`);}
      add(tree(12,1,R,false,0.9));add(rock(2,10,R,0.8));add(pine(13.5,3.5,R,0.9));
      if(kind==='bank'){add(boat(1,2.2));for(let i=0;i<6;i++)add(reeds(-1+i*1.6,8.1-i*1.6+0.0,R));}
      else for(let i=0;i<7;i++)add(reeds(2+i*1.5,7.2+i*1.5,R));
      break;
    case 'forest':
      for(let i=0;i<9;i++){const c=i<5?0.3+R()*1.8:2+i*1.5,r=i<5?1+i*2.6:0.3+R()*1.6;add(i%3===0?pine(c,r,R,1+R()*0.3):tree(c,r,R,false,0.9+R()*0.3));}add(rock(9,9,R,0.7));add(bush(4,12,R));add(bush(11,8,R));add(pine(13,10,R,0.8));add(rock(6.5,12.5,R,0.4));
      break;
    case 'hill':case 'valley':
      for(let i=0;i<6;i++)add(rock(i<3?0.3+R():2+i*2.2,i<3?2+i*3:0.4+R(),R,0.8+R()*0.6));add(pine(12,1,R,1));add(pine(1,12,R,0.9));add(bush(7,11,R));add(bush(12.5,7,R));add(pine(4,0.6,R,0.8));add(rock(10,11,R,0.4));
      if(kind==='valley')for(let i=0;i<4;i++)add(rock(10+i,10-i*2,R,0.6));
      break;
    default:
      add(tree(1,10,R));add(tree(10,1,R));add(pine(13,2,R));add(rock(4,12,R,0.5));add(bush(12,9,R));add(fence(2,4,3));
  }
  // ── 그리기
  g.fillStyle=indoor?'#1a120c':'#2a3420';g.fillRect(0,0,W,H);
  if(indoor)indoorWalls(g,kind,R);
  const lo=indoor?0:-14,hi=N+8;
  // 흙·풀·모래는 칸 무늬 없이 한 장으로 깔고(얼룩으로 질감), 물·판자·돌만 칸으로
  const natural=floor==='grass'||floor==='dirt'||floor==='sand';
  if(natural){g.fillStyle=FLOOR[floor];g.fillRect(0,0,W,H);}
  for(let s=lo*2;s<=hi*2;s++)for(let c=lo;c<=hi;c++){const r=s-c;if(r<lo||r>hi)continue;
    if(waterCells.has(`${c},${r}`))water(g,c,r,R);else if(!natural)floorTile(g,c,r,floor,R);}
  const cellAt=(x:number,y:number):Cell=>{const u=(x-OX)/(TW/2),v=(y-OY)/(TH/2);return [Math.floor((u+v)/2),Math.floor((v-u)/2)];};
  scatterGround(g,floor,R,(x,y)=>{const [c,r]=cellAt(x,y);return waterCells.has(`${c},${r}`)||(indoor&&(c<0||r<0));});
  if(indoor){
    // 벽 밑 그늘
    for(const side of ['left','right'] as const){const A=pt(0,0),B=side==='left'?pt(0,N):pt(N,0),C=side==='left'?pt(1.1,N):pt(N,1.1),D=side==='left'?pt(1.1,0):pt(0,1.1);
      const grd=g.createLinearGradient(...A,...(side==='left'?pt(1.1,0):pt(0,1.1)));grd.addColorStop(0,'rgba(0,0,0,.45)');grd.addColorStop(1,'rgba(0,0,0,0)');poly(g,[A,B,C,D],'rgba(0,0,0,0)');g.fillStyle=grd;g.beginPath();g.moveTo(...A);g.lineTo(...B);g.lineTo(...C);g.lineTo(...D);g.closePath();g.fill();}
    // 창으로 드는 빛(바닥에 비스듬한 빛 기둥)
    if(mood.light!=='night')for(const sh of SHAFTS){const len=4.2,q=sh.side==='left'?[pt(0,sh.t1),pt(0,sh.t2),pt(len,sh.t2+1.2),pt(len,sh.t1+1.2)]:[pt(sh.t1,0),pt(sh.t2,0),pt(sh.t2+1.2,len),pt(sh.t1+1.2,len)];
      const grd=g.createLinearGradient(...q[0]!,...q[3]!);grd.addColorStop(0,'rgba(255,226,160,.28)');grd.addColorStop(1,'rgba(255,226,160,0)');g.save();g.globalCompositeOperation='lighter';g.fillStyle=grd;g.beginPath();q.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();g.restore();}
  }
  if(!indoor&&waterCells.size){g.strokeStyle='rgba(230,215,170,.5)';g.lineWidth=3;for(const k of waterCells){const [c,r]=k.split(',').map(Number) as [number,number];for(const [dc,dr,a,b] of [[0,-1,[c,r],[c+1,r]],[0,1,[c,r+1],[c+1,r+1]],[-1,0,[c,r],[c,r+1]],[1,0,[c+1,r],[c+1,r+1]]] as const){if(!waterCells.has(`${c+dc},${r+dr}`)){g.beginPath();g.moveTo(...pt(a[0],a[1]));g.lineTo(...pt(b[0],b[1]));g.stroke();}}}}
  // 바깥 장면의 뒤쪽 경계(담·목책·성벽·건물)
  if(kind==='court'){edgeWall(g,'left',0,N,70,'#d8d0bc',false,'#2e3a40');edgeWall(g,'right',0,N,70,'#d8d0bc',false,'#2e3a40');hallFacade(g,1,1,6,3,'#c9b9a0');}
  if(kind==='gatehouse'||kind==='wall'||kind==='fort'){const h=kind==='fort'?200:170;edgeWall(g,'left',0,N,h,'#8a857a',true);edgeWall(g,'right',0,N,h,'#8a857a',true);
    if(kind==='gatehouse'){const a=up(pt(6,0),0),b=up(pt(9,0),0);poly(g,[[a[0],a[1]],[b[0],b[1]],[b[0],b[1]-110],[a[0],a[1]-110]],'#2a1a10','#120a06',2);hallFacade(g,5.6,-2.4,4,2,'#7a3a26');}}
  if(kind==='camp'){palisade(g,'left',0,N);palisade(g,'right',0,N);}
  if(kind==='town'){thatchedHouse(g,0.4,-2.4,4,2,R);thatchedHouse(g,5.6,-2.6,3,2,R);thatchedHouse(g,-2.6,0.6,2,4,R);thatchedHouse(g,-2.8,6,2,3,R);thatchedHouse(g,10,-2.4,4,2,R);}
  if(kind==='deck'){for(let c=0;c<=15;c++){prism(g,c,2.85,1,0.15,18,'#5a3a1e');}for(let r=3;r<=11;r++)prism(g,-0.15,r,0.15,1,18,'#5a3a1e');}
  if(kind==='fire'){burningHouse(g,0.6,0.6,R);burningHouse(g,5,-0.6,R);burningHouse(g,-0.6,5,R);burningHouse(g,10,-0.6,R);}
  // 소품을 깊이 순서로(뒤 → 앞)
  props.sort((a,b)=>(a.c+a.r+(a.w+a.d)/2)-(b.c+b.r+(b.w+b.d)/2));
  // 소품 그림자(빛은 왼쪽 위에서): 먼저 모두 깔고 소품을 올린다
  {const sh=document.createElement('canvas');sh.width=W;sh.height=H;const o=sh.getContext('2d')!;o.fillStyle='rgba(0,0,0,.32)';
    for(const p of props){if(!p.solid)continue;const [x,y]=pt(p.c+p.w/2+0.25,p.r+p.d/2+0.25);o.beginPath();o.ellipse(x,y,(p.w+p.d)*TW/4+6,(p.w+p.d)*TH/4+4,0,0,7);o.fill();}
    g.save();g.filter='blur(6px)';g.drawImage(sh,0,0);g.restore();}
  props.forEach(p=>p.draw(g));
  if(kind==='deck'){for(let c=0;c<=15;c++)prism(g,c,12,1,0.15,18,'#5a3a1e');for(let r=3;r<=11;r++)prism(g,16,r,0.15,1,18,'#5a3a1e');}
  // 빛과 공기
  const vg=g.createRadialGradient(W/2,H*0.6,H*0.3,W/2,H*0.6,H*0.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,indoor?'rgba(10,6,2,.55)':'rgba(5,10,5,.35)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  if(kind==='fire'){g.fillStyle='rgba(120,30,10,.18)';g.fillRect(0,0,W,H);for(let i=0;i<6;i++){g.fillStyle='rgba(30,25,25,.25)';g.beginPath();g.ellipse(R()*W,R()*H*0.4,120,50,0,0,7);g.fill();}}
  if(kind==='camp'||kind==='bank'){g.fillStyle='rgba(255,200,140,.07)';g.fillRect(0,0,W,H);}
  // 칠한 그림처럼: 살짝 흐리고(붓 자국), 따뜻한 빛을 얹는다
  {const t=document.createElement('canvas');t.width=W;t.height=H;t.getContext('2d')!.drawImage(canvas,0,0);g.save();g.filter='blur(0.7px)';g.drawImage(t,0,0);g.restore();
    g.save();g.globalCompositeOperation='soft-light';g.fillStyle='rgba(255,214,160,.35)';g.fillRect(0,0,W,H);g.restore();}
  grain(g,R,0.07);
  // 때와 날씨: 장소 이름의 밤·새벽·저녁·비·눈·안개
  const grade=(color:string,op:GlobalCompositeOperation)=>{g.save();g.globalCompositeOperation=op;g.fillStyle=color;g.fillRect(0,0,W,H);g.restore();};
  if(mood.light==='night'){grade('rgba(40,60,120,.62)','multiply');grade('rgba(10,16,40,.25)','source-over');}
  if(mood.light==='dawn'){grade('rgba(170,180,230,.35)','multiply');grade('rgba(255,190,170,.08)','screen');}
  if(mood.light==='dusk'){grade('rgba(255,150,80,.32)','multiply');grade('rgba(255,170,90,.1)','screen');}
  if(mood.weather==='rain'){grade('rgba(120,130,140,.35)','multiply');for(let i=0;i<400;i++){const x=R()*W,y=R()*H;g.strokeStyle='rgba(200,215,230,.25)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x-4,y+14);g.stroke();}
    for(let i=0;i<14;i++){const x=R()*W,y=H*0.3+R()*H*0.7;g.fillStyle='rgba(150,170,190,.25)';g.beginPath();g.ellipse(x,y,20+R()*30,6+R()*6,0,0,7);g.fill();}}
  if(mood.weather==='snow'){for(let i=0;i<60;i++){const x=R()*W,y=R()*H;g.fillStyle='rgba(245,248,255,.55)';g.beginPath();g.ellipse(x,y,20+R()*50,6+R()*16,0,0,7);g.fill();}grade('rgba(200,210,235,.18)','screen');}
  if(mood.weather==='fog'){const grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,'rgba(220,225,230,.45)');grd.addColorStop(1,'rgba(220,225,230,.08)');g.fillStyle=grd;g.fillRect(0,0,W,H);}
  // 모아 둔 빛(등불·화로·불길·창)
  const boost=mood.light==='night'?1.3:mood.light==='dusk'?1.15:1;
  for(const [x,y,rad,color,alpha] of LIGHTS!)lightNow(g,x,y,rad,color,Math.min(0.75,alpha*boost));
  LIGHTS=null;
  // ── 걸을 수 있는 칸
  const blocked=new Set<string>();
  for(const p of props)if(p.solid)for(let c=Math.floor(p.c);c<Math.ceil(p.c+p.w);c++)for(let r=Math.floor(p.r);r<Math.ceil(p.r+p.d);r++){blocked.add(`${c},${r}`);
    // 나무 잎 뒤에 사람이 서면 잎 위에 그려지므로, 줄기 뒤쪽 칸도 비워 둔다
    if(p.canopy)for(const [dc,dr] of [[-1,0],[0,-1],[-1,-1],[-2,-1],[-1,-2],[-2,-2]] as const)blocked.add(`${c+dc},${r+dr}`);}
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
  return {url:canvas.toDataURL('image/jpeg',0.9),toCell,toPct,standable,passable,indoor,fx:mood.fx};
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
export function isoBackdrop(art:number,place=''){return `background-image:url(${isoScene(art,place).url});background-size:cover;background-position:center 70%`;}
