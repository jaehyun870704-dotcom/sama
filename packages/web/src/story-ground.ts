/**
 * 야외 이야기 장면의 땅 — 위에서 비스듬히 내려다본 채색 지도(조조전 온라인 이야기 화면 느낌)를 코드로 그린다.
 * 2560×1280 한 장: 그린 풀밭 질감 위에 흙길(붓결·자갈·가장자리 풀포기), 물(물결·물가 거품), 돌판 마당, 성벽을 깔고,
 * 큰 나무(가을나무 포함)·바위·집·막사·항아리·울타리·석등·우물·모닥불·깃발 같은 소품을 놓는다.
 * 격자 20×10(한 칸 128px) 위에서 사람이 설 수 있는 칸을 가린다.
 */
import type {Texture} from 'pixi.js';
import {sceneryThumb} from './terrain.ts';
import {noiseField,sample} from './terrain-paint.ts';

export const GW=20,GH=10,C=128,PW=GW*C,PH=GH*C;
export type GroundKind='field'|'hill'|'valley'|'forest'|'river'|'bank'|'deck'|'camp'|'battlefield'|'town'|'fire'|'gatehouse'|'wall'|'fort'|'court'
  |'garden'|'pass'|'marsh'|'farm'|'ruins'|'clearing'|'market'|'ferry';
/** snow: 눈 덮인 땅, camp: 숲속·나루 같은 곳에 군막을 함께 세운다. */
export interface GroundOpts {snow?:boolean;camp?:boolean}
type Cell='grass'|'dirt'|'water'|'stone'|'wall'|'gate'|'bridge'|'block'|'pool'|'crop'|'scree';
type Ctx=CanvasRenderingContext2D;
type Light='day'|'night'|'dawn'|'dusk';
interface Prop {kind:'tree'|'pine'|'autumn'|'willow'|'house'|'hall'|'tent'|'tower'|'rock'|'bush'|'jar'|'bench'|'fence'|'lantern'|'well'|'fire'|'banner'|'flowers'|'reeds'|'boat'|'crate'|'rockery'|'pavilion'|'stall'|'stump'|'ruin'|'deadtree'|'haystack'|'ruintower'|'stepstone';x:number;y:number;s:number;flip?:boolean;color?:string}

let meadow:HTMLCanvasElement|undefined,atlas:Texture|undefined,noiseA:Float32Array|undefined;
export async function loadGroundArt(){
  if(typeof document==='undefined'||(meadow&&atlas))return;
  try{
    const [m,s]=await Promise.all(['textures/meadow.webp','scenery-v3.png'].map(async u=>{const img=new Image();img.src=new URL(u,document.baseURI).href;await img.decode();return img;}));
    const w=m!.naturalWidth,h=m!.naturalHeight,c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d')!;
    for(const [fx,fy] of [[0,0],[1,0],[0,1],[1,1]] as const){g.save();g.translate(fx?w*2:0,fy?h*2:0);g.scale(fx?-1:1,fy?-1:1);g.drawImage(m!,0,0);g.restore();}
    meadow=c;atlas={source:{resource:s},width:s!.naturalWidth,height:s!.naturalHeight} as unknown as Texture;
  }catch{/* 재료가 없으면 그린 배경을 쓴다 */}
}
export const groundReady=()=>!!(meadow&&atlas);
const noise=()=>noiseA??=noiseField(7,4,4);
const layer=(fn:(g:Ctx)=>void)=>{const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d')!;fn(g);return c;};
/** 흐린 모양을 반으로 잘라 매끈한 가장자리로(구름처럼 울퉁불퉁한 이음새를 없앤다). */
function smoothMask(src:HTMLCanvasElement,blur:number,soft=2){const b=layer(m=>{m.filter=`blur(${blur}px)`;m.drawImage(src,0,0);});const ctx=b.getContext('2d')!,img=ctx.getImageData(0,0,PW,PH),d=img.data;for(let i=3;i<d.length;i+=4){const a=d[i]!;d[i]=a<110?0:a>146?255:(a-110)*7;}ctx.putImageData(img,0,0);return soft?layer(m=>{m.filter=`blur(${soft}px)`;m.drawImage(b,0,0);}):b;}
const rgba=(r:number,g:number,b:number,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;

// ─────────────────────────────────────────────── 배치
function layout(kind:GroundKind,R:()=>number,opts:GroundOpts={}){
  const g:Cell[][]=Array.from({length:GH},()=>Array.from({length:GW},():Cell=>'grass'));
  const props:Prop[]=[];const roads:Array<Array<[number,number]>>=[];
  const inb=(x:number,y:number)=>x>=0&&y>=0&&x<GW&&y<GH;
  const set=(x:number,y:number,t:Cell)=>{if(inb(x,y))g[y]![x]=t;};
  const rect=(x0:number,y0:number,x1:number,y1:number,t:Cell)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)set(x,y,t);};
  const place=(p:Prop,fw=1,fh=1)=>{props.push(p);for(let dx=-Math.floor(fw/2);dx<=Math.floor((fw-1)/2);dx++)for(let dy=-fh+1;dy<=0;dy++)set(Math.floor(p.x+dx),Math.floor(p.y+dy),'block');};
  /** 굽은 길(픽셀 좌표의 점 목록). 길 폭은 그릴 때 정한다. */
  const road=(pts:Array<[number,number]>)=>roads.push(pts.map(([x,y])=>[x*C,y*C]));
  const clump=(cx:number,cy:number,n:number,r:number,autumn=R()<.3)=>{for(let i=0;i<n;i++){const a=R()*6.283,d=Math.sqrt(R())*r;place({kind:autumn&&R()<.5?'autumn':R()<.25?'pine':'tree',x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d*.6,s:.85+R()*.4,flip:R()<.5});}};
  const edges=(n:number)=>{for(let i=0;i<n;i++){const side=i%4,cx=side===0?.6+R()*1.5:side===1?GW-.6-R()*1.5:3+R()*(GW-6),cy=side<2?1.5+R()*(GH-3):side===2?.4+R()*.8:GH-.3-R()*.7;clump(cx,cy,2+Math.floor(R()*3),1.3);}};
  const rocks=(n:number)=>{for(let i=0;i<n;i++)place({kind:'rock',x:1+R()*(GW-2),y:1+R()*(GH-1),s:.6+R()*.9,flip:R()<.5});};
  const flowers=(n:number)=>{for(let i=0;i<n;i++)props.push({kind:'flowers',x:R()*GW,y:R()*GH,s:1});};
  const bushes=(n:number)=>{for(let i=0;i<n;i++)props.push({kind:'bush',x:R()*GW,y:.5+R()*(GH-.5),s:.7+R()*.6});};
  switch(kind){
    case 'river':case 'bank':case 'deck':{
      for(let x=0;x<GW;x++){const e=2+Math.round(Math.sin(x*.5+R()*.4)*.8+R()*.5);rect(x,0,x+1,e,'water');}
      if(kind!=='bank'){rect(9,0,11,4,'bridge');}
      road([[0,GH-2.5],[5,GH-3.4],[10,GH-4.6],[15,GH-3.8],[GW,GH-4.4]]);
      for(let i=0;i<9;i++)props.push({kind:'reeds',x:R()*GW,y:3.1+R()*.8,s:.8+R()*.5});
      if(kind!=='bank')props.push({kind:'boat',x:14.5,y:1.5,s:1},{kind:'boat',x:3.5,y:1.1,s:.9,flip:true});
      clump(2,7,3,1.3);clump(GW-2.5,6.5,3,1.4,true);rocks(3);bushes(5);flowers(6);break;}
    case 'valley':
      for(let y=0;y<GH;y++){const l=2+Math.round(Math.sin(y*.7)*1+R()*.6),r=GW-2-Math.round(Math.cos(y*.6)*1+R()*.6);for(let x=0;x<l;x++)place({kind:'rock',x:x+.5,y:y+.9,s:1.1+R()*.5,flip:R()<.5});for(let x=r;x<GW;x++)place({kind:'rock',x:x+.5,y:y+.9,s:1.1+R()*.5,flip:R()<.5});}
      road([[GW/2+1,-.5],[GW/2-1.5,3],[GW/2+1.5,6.5],[GW/2-.5,GH+.5]]);
      clump(5,8,2,1);clump(GW-5,2.5,2,1,true);bushes(4);break;
    case 'hill':case 'forest':case 'field':
      road([[-.5,GH-1.8],[4,GH-3],[9,GH-5.5],[14,GH-6.8],[GW+.5,GH-7.6]]);
      edges(kind==='forest'?9:6);if(kind==='forest')clump(GW/2,1.6,4,2.2);
      rocks(kind==='hill'?4:2);bushes(6);flowers(kind==='forest'?4:9);break;
    case 'camp':case 'battlefield':
      road([[-.5,GH/2+.5],[GW/2,GH/2-.5],[GW+.5,GH/2+.6]]);road([[GW/2-.5,-.5],[GW/2+.5,GH+.5]]);
      for(const [x,y] of [[3.5,2.6],[7.5,1.9],[GW-7.5,1.9],[GW-3.5,2.6],[2.5,GH-.6],[GW-2.5,GH-.6]] as const)place({kind:'tent',x,y,s:1,flip:R()<.5},2,2);
      for(let x=0;x<GW;x+=1)if(Math.abs(x-GW/2)>1.2)props.push({kind:'fence',x:x+.5,y:.55,s:1});
      props.push({kind:'fire',x:GW/2-3,y:GH/2+1.8,s:1},{kind:'banner',x:GW/2-5,y:3.4,s:1,color:'#1f3f8a'},{kind:'banner',x:GW/2+5,y:3.4,s:1,color:'#1f3f8a'},{kind:'crate',x:5.5,y:GH-1.2,s:1},{kind:'crate',x:GW-6,y:GH-1.4,s:.9});
      clump(1,GH-2.5,2,1);clump(GW-1,GH-2.5,2,1);break;
    case 'town':case 'fire':
      road([[-.5,GH/2+1.2],[GW/2,GH/2+.6],[GW+.5,GH/2+1.4]]);road([[GW/2-1,-.5],[GW/2,GH+.5]]);
      for(const [x,y,f] of [[3.5,3.2,false],[8,2.6,true],[GW-8,2.6,false],[GW-3.5,3.2,true],[4,GH-.4,true],[GW-4,GH-.4,false]] as const)place({kind:'house',x,y,s:1,flip:f},3,2);
      for(const [x,y] of [[5.4,3.6],[GW-5.6,3.5],[6,GH-.8]] as const)props.push({kind:'jar',x,y,s:1},{kind:'jar',x:x+.35,y:y+.15,s:.8});
      props.push({kind:'bench',x:GW/2+3.5,y:GH/2+2.6,s:1},{kind:'well',x:GW/2-3.6,y:GH/2-1.2,s:1});
      for(let x=0;x<5;x++)props.push({kind:'fence',x:11.5+x,y:GH-2.4,s:1});
      clump(.8,GH-1.5,2,.8,true);clump(GW-.8,.9,2,.8,true);bushes(4);flowers(5);break;
    case 'court':
      rect(3,3,GW-3,GH-1,'stone');
      place({kind:'hall',x:GW/2,y:2.9,s:1},5,3);place({kind:'house',x:4.5,y:2.6,s:.8,flip:false},3,2);place({kind:'house',x:GW-4.5,y:2.6,s:.8,flip:true},3,2);
      props.push({kind:'lantern',x:GW/2-2.6,y:3.6,s:1},{kind:'lantern',x:GW/2+2.6,y:3.6,s:1},{kind:'rockery',x:4.2,y:GH-1.6,s:1},{kind:'rockery',x:GW-4.2,y:GH-1.8,s:.85,flip:true},{kind:'jar',x:GW/2-4.6,y:3.3,s:1},{kind:'jar',x:GW/2+4.5,y:3.3,s:1});
      clump(1.2,GH-2.2,2,.8,true);clump(GW-1.2,GH-2.4,2,.8);clump(1.2,1.4,2,.8);clump(GW-1.2,1.4,2,.8,true);
      for(let y=4;y<GH-1;y+=.9)props.push({kind:'flowers',x:3.3,y,s:1},{kind:'flowers',x:GW-3.3,y,s:1});break;
    case 'gatehouse':case 'fort':case 'wall':{
      const wy=kind==='wall'?5:2;rect(0,wy,GW,wy+2,'wall');
      if(kind!=='wall'){rect(GW/2-1,wy,GW/2+1,wy+2,'gate');rect(3,wy+2,GW-3,GH,'stone');road([[GW/2,wy+1.5],[GW/2,GH+.5]]);}
      else{rect(0,wy+2,GW,GH,'stone');road([[-.5,2.5],[GW/2,1.6],[GW+.5,2.8]]);}
      place({kind:'tower',x:1.2,y:wy+1.9,s:1},2,3);place({kind:'tower',x:GW-1.2,y:wy+1.9,s:1,flip:true},2,3);
      if(kind!=='wall'){place({kind:'tent',x:3,y:GH-.5,s:.9},2,2);place({kind:'tent',x:GW-3,y:GH-.5,s:.9,flip:true},2,2);props.push({kind:'banner',x:GW/2-2.4,y:wy+3.2,s:1,color:'#8a1f1a'},{kind:'banner',x:GW/2+2.4,y:wy+3.2,s:1,color:'#8a1f1a'},{kind:'crate',x:5,y:wy+3.4,s:1},{kind:'jar',x:GW-5.4,y:wy+3.3,s:1});}
      clump(1,.9,2,.9,true);clump(GW-1,.9,2,.9);bushes(3);break;}
    case 'garden':{
      // 뒤뜰 정원: 굽은 연못·돌다리·정자·석등·가산·버드나무·꽃밭, 위쪽에 본채
      for(const [x0,y0,x1,y1] of [[3,4,8,8],[4,3,7,4],[8,5,9,8],[2,5,3,7]] as const)rect(x0,y0,x1,y1,'pool');
      rect(5,5,6,8,'bridge');
      road([[11.5,GH+.5],[11,7],[12,4.6],[GW/2+1,3.6]]);road([[12,5],[15.5,5.6],[15.5,7]]);for(const [x,y] of [[11.5,9.4],[11.2,8.4],[11.1,7.4],[11.4,6.4],[11.9,5.5],[11.5,4.5],[13.2,5.1],[14.4,5.4]] as const)props.push({kind:'stepstone',x,y,s:1});
      place({kind:'hall',x:GW/2+1,y:2.6,s:.95},5,3);place({kind:'pavilion',x:15.5,y:7.4,s:1},2,2);
      props.push({kind:'lantern',x:10.4,y:5.2,s:1},{kind:'lantern',x:12.6,y:6.6,s:1},{kind:'lantern',x:13.6,y:3.9,s:.9},{kind:'rockery',x:2.4,y:3.6,s:1},{kind:'rockery',x:8.7,y:4.6,s:.7,flip:true},{kind:'bench',x:17.8,y:5.4,s:1});
      for(const [x,y] of [[1.6,8.4],[8.9,3.6],[18.4,8.8],[17.6,2.8]] as const)place({kind:'willow',x,y,s:1,flip:R()<.5});
      clump(1,1.4,2,.8,true);clump(GW-1,1.4,2,.8);
      for(let i=0;i<14;i++)props.push({kind:'flowers',x:12.6+R()*6.5,y:5+R()*4.6,s:1});for(let i=0;i<8;i++)props.push({kind:'reeds',x:2.6+R()*6,y:4+R()*4.4,s:.6});bushes(4);break;}
    case 'pass':{
      // 굽이진 고갯길: 비탈 바위밭 사이로 난 좁은 길, 소나무
      const c=(y:number)=>3.2+y*1.35+Math.sin(y*.9)*1.4;
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const d=Math.abs(x+.5-c(y));if(d>3.1)set(x,y,'scree');}
      road([[c(-.5),-.5],[c(2.5),2.5],[c(5),5],[c(7.5),7.5],[c(GH+.5),GH+.5]]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const d=Math.abs(x+.5-c(y));if(d>3.3&&R()<.33)place({kind:R()<.55?'rock':'pine',x:x+.5,y:y+.9,s:.8+R()*.5,flip:R()<.5});}
      for(let i=0;i<6;i++){const y=1+R()*(GH-1.5);props.push({kind:'bush',x:c(y)+(R()<.5?-2.6:2.6),y,s:.7});}
      flowers(3);break;}
    case 'marsh':{
      // 갈대 늪: 군데군데 고인 물, 우거진 갈대, 버드나무, 질척한 길
      for(const [x,y,w,h] of [[2,2,3,2],[7,1,2,1],[13,2,4,2],[4,6,2,2],[10,5,3,2],[15,7,3,2],[1,8,2,1]] as const)rect(x,y,x+w,y+h,'pool');
      road([[-.5,GH-2.6],[6,GH-4.2],[9,GH-2.6],[14,GH-4.6],[GW+.5,GH-5.4]]);
      for(let i=0;i<34;i++){let x=R()*GW,y=1+R()*(GH-1);for(let k=0;k<6;k++){const cx=Math.floor(x),cy=Math.floor(y);if(inb(cx,cy)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>g[cy+b!]?.[cx+a!]==='pool'))break;x=R()*GW;y=1+R()*(GH-1);}props.push({kind:'reeds',x,y,s:.9+R()*.5});}
      for(const [x,y] of [[6.5,4.8],[18.6,4.2],[.8,5.6]] as const)place({kind:'willow',x,y,s:1,flip:R()<.5});
      bushes(5);flowers(3);break;}
    case 'farm':{
      // 고향 마을: 논밭 두렁·초가·볏단·우물·울타리
      road([[-.5,4.4],[GW/2,4.1],[GW+.5,4.5]]);road([[GW/2-.4,4],[GW/2,GH+.5]]);
      for(const [x0,y0,x1,y1] of [[1,6,4,9],[5,6,8,9],[12,6,15,9],[16,6,19,9],[14,1,18,3]] as const)rect(x0,y0,x1,y1,'crop');
      place({kind:'house',x:4,y:3.3,s:.85,flip:false},3,2);place({kind:'house',x:8.6,y:2.9,s:.75,flip:true},3,2);
      for(const [x,y] of [[11.8,3.2],[19.2,4.4],[4.6,5.5]] as const)place({kind:'haystack',x,y,s:1});
      props.push({kind:'well',x:GW/2+2,y:GH-2.2,s:.9},{kind:'jar',x:6.2,y:3.5,s:.9},{kind:'jar',x:6.6,y:3.7,s:.7});
      for(let x=0;x<8;x++)props.push({kind:'fence',x:.6+x,y:5.6,s:1});for(let x=0;x<7;x++)props.push({kind:'fence',x:12.5+x,y:5.6,s:1});
      clump(1,1.4,3,1.1,true);clump(GW-.8,7.4,2,.8);flowers(5);bushes(3);break;}
    case 'ruins':{
      // 무너진 옛터: 깨진 돌바닥, 허물어진 담, 무너진 망루, 마른 나무, 돌무더기
      rect(3,3,17,9,'stone');for(let i=0;i<10;i++)props.push({kind:'bush',x:3.5+R()*13,y:3.6+R()*5.2,s:.45+R()*.3});
      road([[-.5,GH-1.6],[6,GH-2],[GW/2,GH-3.4],[GW+.5,GH-2.6]]);
      for(const [x,y,f] of [[3.4,3.4,false],[7.5,3.2,true],[13.4,3.4,false],[16.6,5.6,true],[3.6,7.2,true]] as const)place({kind:'ruin',x,y,s:.9+R()*.3,flip:f},2,1);
      place({kind:'ruintower',x:GW-2,y:3.4,s:1,flip:true},2,3);
      for(const [x,y] of [[1.4,5.8],[9.6,1.6],[18.4,8.6],[11.6,8.4]] as const)place({kind:'deadtree',x,y,s:1,flip:R()<.5});
      rocks(7);bushes(4);break;}
    case 'clearing':{
      // 숲속 빈터: 둘레를 빽빽한 나무가 두르고 가운데는 트인 풀밭, 그루터기
      for(let i=0;i<GW;i+=1.6){clump(i+.5,.9,1,.5);clump(i+.8,GH-.2,1,.5,R()<.4);}
      for(let y=2;y<GH-1;y+=1.4){clump(.7,y,1,.4);clump(GW-.7,y,1,.4,true);}
      clump(3,2.4,2,.8);clump(GW-3.2,2.6,2,.8,true);clump(2.6,GH-2.2,2,.7);
      road([[GW/2-1,GH+.5],[GW/2,GH/2+1],[GW/2+2.6,-.5]]);
      for(const [x,y] of [[6.4,6.6],[13.8,5.8],[8.2,3.4]] as const)place({kind:'stump',x,y,s:1});
      if(opts.camp){for(const [x,y] of [[6,3.6],[14.6,3.4],[15,8.2]] as const)place({kind:'tent',x,y,s:.9,flip:R()<.5},2,2);props.push({kind:'fire',x:GW/2-1.2,y:6.6,s:1},{kind:'banner',x:GW/2+2.2,y:4.6,s:.9,color:'#1f3f8a'});}
      flowers(10);bushes(5);break;}
    case 'market':{
      // 저잣거리: 큰길 양편의 노점(차양)·항아리·상자·깃발, 뒤로 집
      road([[-.5,GH/2+.8],[GW/2,GH/2+.4],[GW+.5,GH/2+.9]]);road([[GW/2+.2,-.5],[GW/2-.2,GH+.5]]);
      for(const [x,y,f] of [[3,2.7,false],[7.4,2.3,true],[GW-7,2.3,false],[GW-3,2.7,true]] as const)place({kind:'house',x,y,s:.9,flip:f},3,2);
      const tones=['#a8322a','#2a5a8a','#b8862a','#3a7a4a','#8a3a6a'];let k=0;
      for(const [x,y] of [[2.6,4.6],[5.6,4.5],[13.4,4.5],[16.6,4.6],[3.2,8.2],[6.6,8.4],[13,8.3],[16.4,8.2]] as const)place({kind:'stall',x,y,s:1,color:tones[k++%tones.length]!,flip:R()<.5},2,1);
      props.push({kind:'banner',x:8.6,y:3.8,s:.8,color:'#a8322a'},{kind:'banner',x:11.8,y:3.8,s:.8,color:'#2a5a8a'},{kind:'jar',x:8.4,y:8.9,s:1},{kind:'jar',x:8.8,y:9.1,s:.8},{kind:'crate',x:11.6,y:8.8,s:1},{kind:'crate',x:12,y:9.2,s:.8},{kind:'lantern',x:GW/2+1.6,y:6.8,s:.8});
      clump(.6,1.2,2,.6,true);clump(GW-.6,1.2,2,.6);break;}
    case 'ferry':{
      // 나루: 위쪽 강, 물로 뻗은 나무 잔교, 매어 둔 배, 짐더미, 뱃사공 오두막
      for(let x=0;x<GW;x++){const e=3+Math.round(Math.sin(x*.45+R()*.3)*.6);rect(x,0,x+1,e,'water');}
      rect(9,0,11,3,'bridge');
      props.push({kind:'boat',x:7.4,y:1.6,s:1,flip:true},{kind:'boat',x:12.8,y:1.3,s:1.05},{kind:'boat',x:17,y:.9,s:.85});
      road([[GW/2,3.2],[GW/2-.6,6],[GW/2+.4,GH+.5]]);road([[-.5,GH-2],[GW/2,6.2],[GW+.5,GH-2.4]]);
      for(const [x,y] of [[8.2,4.4],[12.2,4.6],[12.7,4.9]] as const)props.push({kind:'crate',x,y,s:1});props.push({kind:'jar',x:7.6,y:4.5,s:1},{kind:'jar',x:7.9,y:4.7,s:.8});
      place({kind:'house',x:16.4,y:5.6,s:.7,flip:true},3,2);
      if(opts.camp){for(const [x,y] of [[3.4,6.6],[5.8,GH-.6],[GW-3,GH-.4]] as const)place({kind:'tent',x,y,s:.95,flip:R()<.5},2,2);props.push({kind:'banner',x:GW/2+1.8,y:4.2,s:1,color:'#1f3f8a'},{kind:'fire',x:GW/2-2.8,y:7.4,s:.9});}
      for(let i=0;i<10;i++)props.push({kind:'reeds',x:R()*GW,y:3.3+R()*.7,s:.8+R()*.4});
      clump(1.2,7.2,3,1.1);bushes(4);flowers(4);break;}
  }
  return {g,props,roads};
}

// ─────────────────────────────────────────────── 바닥 재질
function paintGrass(g:Ctx,R:()=>number,dry:boolean){
  const pat=g.createPattern(meadow!,'repeat')!;pat.setTransform(new DOMMatrix([.78,0,0,.78,-(R()*900)|0,-(R()*500)|0]));g.fillStyle=pat;g.fillRect(0,0,PW,PH);
  // 큰 얼룩으로 반복을 지운다: 짙은 풀·누런 풀·햇빛 받은 풀
  g.save();for(let i=0;i<34;i++){const x=R()*PW,y=R()*PH,r=180+R()*320,k=R();const gr=g.createRadialGradient(x,y,0,x,y,r);
    const col=k<.4?'20,40,16':k<.75?(dry?'150,128,60':'90,110,40'):'250,235,170';gr.addColorStop(0,`rgba(${col},${k<.4?.32:k<.75?.28:.18})`);gr.addColorStop(1,`rgba(${col},0)`);g.globalCompositeOperation=k<.75?'multiply':'soft-light';g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}g.restore();
  if(dry){g.save();g.globalCompositeOperation='overlay';g.fillStyle='rgba(190,160,80,.28)';g.fillRect(0,0,PW,PH);g.restore();}
}
/** 흙길: 부드러운 가장자리의 마스크 → 따뜻한 흙빛 + 그린 질감의 명암 + 붓결·자갈·바퀴 자국, 가장자리에 풀포기. */
function paintRoads(g:Ctx,roads:Array<Array<[number,number]>>,R:()=>number,extraMask?:HTMLCanvasElement){
  if(!roads.length&&!extraMask)return;
  const mask=layer(m=>{m.lineCap='round';m.lineJoin='round';m.strokeStyle='#000';
    for(const pts of roads){for(const [w,a] of [[270,.55],[210,1]] as const){m.globalAlpha=a;m.lineWidth=w;m.beginPath();m.moveTo(...pts[0]!);for(let i=1;i<pts.length;i++){const p=pts[i]!,q=pts[i-1]!,mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;m.quadraticCurveTo(q[0],q[1],mx,my);}const l=pts.at(-1)!;m.lineTo(...l);m.stroke();}}
    m.globalAlpha=1;if(extraMask)m.drawImage(extraMask,0,0);
    // 가장자리를 울퉁불퉁하게
    m.globalCompositeOperation='destination-out';for(let i=0;i<260;i++){const x=R()*PW,y=R()*PH;m.fillStyle='rgba(0,0,0,.9)';m.beginPath();m.ellipse(x,y,18+R()*40,10+R()*22,R()*3,0,7);m.fill();}
  });
  const soft=layer(m=>{m.filter='blur(9px)';m.drawImage(mask,0,0);});
  const dirt=layer(d=>{d.fillStyle='#a9875a';d.fillRect(0,0,PW,PH);
    const pat=d.createPattern(meadow!,'repeat')!;pat.setTransform(new DOMMatrix([1.1,0,0,1.1,0,0]));d.save();d.globalCompositeOperation='overlay';d.filter='grayscale(1) contrast(1.15) blur(1.5px)';d.globalAlpha=.75;d.fillStyle=pat;d.fillRect(0,0,PW,PH);d.restore();
    for(let i=0;i<40;i++){const x=R()*PW,y=R()*PH,r=90+R()*200,gr=d.createRadialGradient(x,y,0,x,y,r),dark=R()<.55;gr.addColorStop(0,dark?'rgba(110,80,40,.35)':'rgba(240,215,160,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=gr;d.fillRect(x-r,y-r,r*2,r*2);}
    d.lineCap='round';for(let i=0;i<900;i++){const x=R()*PW,y=R()*PH,l=14+R()*40,a=(R()-.5)*.5,k=R();d.strokeStyle=k<.6?'rgba(255,245,220,.22)':'rgba(70,48,24,.2)';d.lineWidth=2+R()*4;d.beginPath();d.moveTo(x,y);d.quadraticCurveTo(x+l/2,y+Math.sin(a)*l*.4,x+l,y+Math.sin(a)*l);d.stroke();}
    for(let i=0;i<700;i++){const x=R()*PW,y=R()*PH,r=2+R()*4;d.fillStyle='rgba(40,28,14,.5)';d.beginPath();d.ellipse(x+1,y+1.5,r*1.1,r*.75,0,0,7);d.fill();d.fillStyle=`rgba(${225+R()*25|0},${210+R()*25|0},${180+R()*20|0},.9)`;d.beginPath();d.ellipse(x,y,r,r*.7,R(),0,7);d.fill();}
    d.globalCompositeOperation='destination-in';d.drawImage(soft,0,0);
  });
  g.drawImage(dirt,0,0);
  // 가장자리 풀포기와 그늘
  const md=soft.getContext('2d')!.getImageData(0,0,PW,PH).data;const alphaAt=(x:number,y:number)=>md[((y|0)*PW+(x|0))*4+3]!/255;
  g.lineCap='round';let n=0;for(let i=0;i<9000&&n<1400;i++){const x=R()*PW,y=R()*PH,a=alphaAt(x,y);if(a<.12||a>.62)continue;n++;
    for(let k=0;k<3;k++){const h=10+R()*16,dx=(k-1)*5;g.strokeStyle=R()<.5?'rgba(90,120,40,.85)':'rgba(170,190,80,.8)';g.lineWidth=2.2;g.beginPath();g.moveTo(x+dx*.3,y);g.lineTo(x+dx,y-h);g.stroke();}}
  // 길 가장자리에만 얕은 그늘(길 전체를 어둡게 하지 않게 고리만 남긴다)
  const ring=layer(r=>{r.drawImage(mask,6,10);r.globalCompositeOperation='destination-out';r.drawImage(mask,-4,-6);});
  g.save();g.globalCompositeOperation='multiply';g.filter='blur(8px)';g.globalAlpha=.45;g.drawImage(ring,0,0);g.restore();
}
function cellMask(cells:Cell[][],t:Cell,inset=0){return layer(m=>{m.fillStyle='#000';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]===t)m.fillRect(x*C-inset,y*C-inset,C+inset*2,C+inset*2);});}
function paintWater(g:Ctx,cells:Cell[][],R:()=>number){
  let any=false;for(const row of cells)if(row.includes('water'))any=true;if(!any)return;
  // 물가 선: 칸 경계를 부드럽게 이어 물결치는 선으로(구멍 없이)
  const depth:number[]=[];for(let x=0;x<GW;x++){let d=0;while(d<GH&&cells[d]![x]==='water')d++;depth.push(d*C);}
  const shore=(px:number)=>{const t=px/C-.5,i=Math.max(0,Math.min(GW-1,Math.floor(t))),j=Math.min(GW-1,i+1),f=Math.max(0,Math.min(1,t-i)),sm=f*f*(3-2*f);return depth[i]!*(1-sm)+depth[j]!*sm+Math.sin(px*.011)*14+Math.sin(px*.031+2)*7;};
  const hard=layer(m=>{m.fillStyle='#000';m.beginPath();m.moveTo(0,0);for(let px=0;px<=PW;px+=8)m.lineTo(px,shore(px));m.lineTo(PW,0);m.closePath();m.fill();});
  const soft=layer(m=>{m.filter='blur(10px)';m.drawImage(hard,0,0);});
  // 젖은 모래 띠(물 바깥)
  g.save();g.filter='blur(18px)';g.globalCompositeOperation='multiply';g.globalAlpha=.55;g.drawImage(hard,0,14);g.restore();
  const water=layer(w=>{const gr=w.createLinearGradient(0,0,0,PH*.45);gr.addColorStop(0,'#122c40');gr.addColorStop(1,'#245c78');w.fillStyle=gr;w.fillRect(0,0,PW,PH);
    for(let i=0;i<40;i++){const x=R()*PW,y=R()*PH*.4,r=80+R()*160,g2=w.createRadialGradient(x,y,0,x,y,r);g2.addColorStop(0,R()<.5?'rgba(8,24,40,.4)':'rgba(120,190,200,.22)');g2.addColorStop(1,'rgba(0,0,0,0)');w.fillStyle=g2;w.fillRect(x-r,y-r,r*2,r*2);}
    w.lineCap='round';for(let i=0;i<500;i++){const x=R()*PW,y=R()*PH*.4,l=30+R()*90;w.strokeStyle=R()<.3?'rgba(5,20,35,.35)':`rgba(190,230,235,${.15+R()*.25})`;w.lineWidth=1.5+R()*2.5;w.beginPath();w.moveTo(x,y);w.quadraticCurveTo(x+l/2,y-3-R()*4,x+l,y+(R()-.5)*4);w.stroke();}
    // 물가 얕은 물빛
    w.save();w.globalCompositeOperation='source-atop';w.filter='blur(14px)';w.globalAlpha=.5;w.fillStyle='rgba(140,200,190,1)';w.globalCompositeOperation='source-atop';w.drawImage(layer(t=>{t.drawImage(hard,0,-22);t.globalCompositeOperation='destination-out';t.drawImage(hard,0,-70);t.globalCompositeOperation='source-in';t.fillStyle='rgba(150,205,195,1)';t.fillRect(0,0,PW,PH);}),0,0);w.restore();
    w.globalCompositeOperation='destination-in';w.drawImage(soft,0,0);});
  g.drawImage(water,0,0);
  // 물가 거품선
  const foam=layer(f=>{f.filter='blur(4px)';f.drawImage(hard,0,0);f.filter='none';f.globalCompositeOperation='destination-out';f.drawImage(hard,0,-8);f.globalCompositeOperation='source-in';f.fillStyle='rgba(236,246,240,.8)';f.fillRect(0,0,PW,PH);});
  g.drawImage(foam,0,0);
  // 다리
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='bridge'){const px=x*C,py=y*C;g.fillStyle='rgba(8,24,30,.45)';g.fillRect(px+10,py,C-20,C+8);
    for(let k=0;k<C;k+=14){g.fillStyle=k%28?'rgb(176,134,84)':'rgb(150,110,66)';g.fillRect(px+16,py+k,C-32,13);g.fillStyle='rgba(50,30,14,.5)';g.fillRect(px+16,py+k+13,C-32,1.5);}
    g.fillStyle='rgb(92,62,36)';g.fillRect(px+10,py,7,C);g.fillRect(px+C-17,py,7,C);for(const k of [8,56,104]){g.fillRect(px+6,py+k,15,14);g.fillRect(px+C-21,py+k,15,14);}}
}
/** 돌판 마당: 크기가 다른 넓적한 돌을 엇갈려 깔고 빛깔·이끼·금·닳은 자국. */
function paintStone(g:Ctx,cells:Cell[][],R:()=>number){
  let any=false;for(const row of cells)if(row.includes('stone'))any=true;if(!any)return;
  const edge=(x:number,y:number)=>cells[y]![x]==='stone'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const xx=x+dx!,yy=y+dy!;return xx<0||yy<0||xx>=GW||yy>=GH||(cells[yy]![xx]!=='stone'&&cells[yy]![xx]!=='wall'&&cells[yy]![xx]!=='gate');});
  const mask=layer(m=>{m.fillStyle='#000';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='stone')m.fillRect(x*C-4,y*C-4,C+8,C+8);
    // 바깥 가장자리를 풀이 파고든 듯 울퉁불퉁하게
    m.globalCompositeOperation='destination-out';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(edge(x,y))for(let i=0;i<5;i++){const side=R();const ex=side<.5?x*C+R()*C:(x+(R()<.5?0:1))*C,ey=side<.5?(y+(R()<.5?0:1))*C:y*C+R()*C;
      if(cells[Math.max(0,Math.min(GH-1,Math.floor(ey/C+(ey%C<2?-.5:.5))))]![Math.max(0,Math.min(GW-1,Math.floor(ex/C+(ex%C<2?-.5:.5))))]==='stone')continue;m.fillStyle='#000';m.beginPath();m.ellipse(ex,ey,14+R()*34,10+R()*22,R()*3,0,7);m.fill();}});
  const st=layer(s=>{s.fillStyle='#7a7366';s.fillRect(0,0,PW,PH);
    let r=0;for(let yy=-20;yy<PH+90;r++){const RH=r%3===1?84:66;let x=-(R()*120|0);while(x<PW){const w=80+R()*95,k=R(),v=(k-.5)*26,warm=R()<.35?10:0,sx=x+4,sy=yy+4,sw=w-8,sh=RH-8,j=()=>(R()-.5)*6;
        s.fillStyle=`rgb(${176+v+warm|0},${168+v+warm*.6|0},${150+v|0})`;s.beginPath();s.moveTo(sx+j(),sy+j());s.lineTo(sx+sw+j(),sy+j());s.lineTo(sx+sw+j(),sy+sh+j());s.lineTo(sx+j(),sy+sh+j());s.closePath();s.fill();
        s.fillStyle='rgba(255,250,236,.26)';s.fillRect(sx,sy,sw,3);s.fillRect(sx,sy,3,sh);s.fillStyle='rgba(40,34,26,.3)';s.fillRect(sx,sy+sh-3,sw,3);s.fillRect(sx+sw-3,sy,3,sh);
        for(let q=0;q<5;q++){s.fillStyle=R()<.5?'rgba(255,248,230,.12)':'rgba(60,50,36,.14)';s.beginPath();s.ellipse(sx+R()*sw,sy+R()*sh,10+R()*20,6+R()*10,R()*3,0,7);s.fill();}
        if(k>.92){s.strokeStyle='rgba(50,42,30,.6)';s.lineWidth=1.8;s.beginPath();s.moveTo(sx+sw*.2,sy+2);s.lineTo(sx+sw*.5,sy+sh*.5);s.lineTo(sx+sw*.45,sy+sh-2);s.stroke();}
        if(R()<.25){s.fillStyle='rgba(92,118,60,.65)';s.beginPath();s.ellipse(x+(R()<.5?0:w),yy+RH,8+R()*10,4,0,0,7);s.fill();}
        x+=w;}yy+=RH;}
    for(let i=0;i<30;i++){const x=R()*PW,y=R()*PH,rr=120+R()*280,gr=s.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,R()<.55?'rgba(60,50,40,.3)':'rgba(240,232,210,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=gr;s.fillRect(x-rr,y-rr,rr*2,rr*2);}
    // 가운데로 난 밝게 닳은 길
    const path=s.createLinearGradient(PW/2-220,0,PW/2+220,0);path.addColorStop(0,'rgba(255,245,220,0)');path.addColorStop(.5,'rgba(255,245,220,.18)');path.addColorStop(1,'rgba(255,245,220,0)');s.fillStyle=path;s.fillRect(0,0,PW,PH);
    s.globalCompositeOperation='destination-in';s.filter='blur(2.5px)';s.drawImage(mask,0,0);});
  g.save();g.filter='blur(10px)';g.globalCompositeOperation='multiply';g.globalAlpha=.4;g.drawImage(mask,8,14);g.restore();
  g.drawImage(st,0,0);
  // 마당 가장자리 풀포기
  g.lineCap='round';const md=mask.getContext('2d')!.getImageData(0,0,PW,PH).data;let n=0;for(let i=0;i<9000&&n<700;i++){const x=R()*PW|0,y=R()*PH|0,a=md[(y*PW+x)*4+3]!;if(a<10||a>200)continue;
    const nb=md[((y+6)*PW+x)*4+3]??0;if(nb>200&&a>10){n++;for(let k=0;k<3;k++){g.strokeStyle=R()<.5?'rgba(90,120,40,.85)':'rgba(170,190,80,.8)';g.lineWidth=2.2;g.beginPath();g.moveTo(x+(k-1)*2,y);g.lineTo(x+(k-1)*6,y-10-R()*14);g.stroke();}}}
}
/** 연못·늪: 칸을 이어 둥근 물웅덩이로(물가 그늘·얕은 물빛·물결·거품·돌다리). */
function paintPools(g:Ctx,cells:Cell[][],R:()=>number){
  let any=false;for(const row of cells)if(row.includes('pool'))any=true;if(!any)return;
  const hard=layer(m=>{m.fillStyle='#000';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='pool'||(cells[y]![x]==='bridge'&&[[1,0],[-1,0]].some(([a])=>cells[y]![x+a!]==='pool'))){
    m.beginPath();m.ellipse((x+.5)*C+(R()-.5)*16,(y+.5)*C+(R()-.5)*12,C*.72,C*.62,R()*.6,0,7);m.fill();}});
  const smooth=smoothMask(hard,34,0);hard.getContext('2d')!.clearRect(0,0,PW,PH);hard.getContext('2d')!.drawImage(smooth,0,0);
  const soft=layer(m=>{m.filter='blur(3px)';m.drawImage(hard,0,0);});
  // 물가 진흙 띠
  g.save();g.filter='blur(14px)';g.globalCompositeOperation='multiply';g.globalAlpha=.6;g.drawImage(layer(t=>{t.drawImage(hard,0,0);t.globalCompositeOperation='source-in';t.fillStyle='#5a4a30';t.fillRect(0,0,PW,PH);}),0,8);g.restore();
  const water=layer(w=>{w.fillStyle='#1e4a5a';w.fillRect(0,0,PW,PH);
    for(let i=0;i<50;i++){const x=R()*PW,y=R()*PH,r=60+R()*140,g2=w.createRadialGradient(x,y,0,x,y,r);g2.addColorStop(0,R()<.5?'rgba(8,24,30,.45)':'rgba(120,190,180,.25)');g2.addColorStop(1,'rgba(0,0,0,0)');w.fillStyle=g2;w.fillRect(x-r,y-r,r*2,r*2);}
    w.lineCap='round';for(let i=0;i<500;i++){const x=R()*PW,y=R()*PH,l=20+R()*60;w.strokeStyle=R()<.3?'rgba(5,20,30,.35)':`rgba(200,235,230,${.12+R()*.22})`;w.lineWidth=1.5+R()*2;w.beginPath();w.moveTo(x,y);w.quadraticCurveTo(x+l/2,y-3,x+l,y+(R()-.5)*3);w.stroke();}
    // 가장자리 얕은 물빛
    w.drawImage(layer(t=>{t.filter='blur(12px)';t.drawImage(hard,0,0);t.filter='none';t.globalCompositeOperation='destination-out';t.drawImage(layer(u=>{u.filter='blur(4px)';u.drawImage(hard,0,0);u.globalCompositeOperation='destination-in';u.drawImage(hard,0,0);}),0,0);t.globalCompositeOperation='source-in';t.fillStyle='rgba(150,200,180,.55)';t.fillRect(0,0,PW,PH);}),0,0);
    // 연잎
    for(let i=0;i<40;i++){const x=R()*PW,y=R()*PH,r=10+R()*12;w.fillStyle=R()<.5?'rgba(70,120,50,.95)':'rgba(96,146,62,.95)';w.beginPath();w.moveTo(x,y);w.arc(x,y,r,.3,6.0);w.closePath();w.fill();if(R()<.2){w.fillStyle='#f0b8c8';w.beginPath();w.arc(x+r*.3,y-r*.2,4,0,7);w.fill();}}
    w.globalCompositeOperation='destination-in';w.drawImage(soft,0,0);});
  g.drawImage(water,0,0);
  g.drawImage(layer(f=>{f.filter='blur(3px)';f.drawImage(hard,0,0);f.filter='none';f.globalCompositeOperation='destination-out';f.drawImage(hard,0,4);f.globalCompositeOperation='source-in';f.fillStyle='rgba(236,246,240,.7)';f.fillRect(0,0,PW,PH);}),0,0);
  // 물가 돌
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='pool'&&cells[y+1]?.[x]!=='pool'&&cells[y+1]?.[x]!=='bridge'&&R()<.6){const px=(x+.2+R()*.6)*C,py=(y+1)*C-8;g.fillStyle='rgba(20,16,10,.35)';g.beginPath();g.ellipse(px+4,py+6,22,8,0,0,7);g.fill();g.fillStyle='#a49c8a';g.beginPath();g.ellipse(px,py,20,11,R(),0,7);g.fill();g.fillStyle='rgba(255,250,236,.35)';g.beginPath();g.ellipse(px-5,py-4,8,4,0,0,7);g.fill();}
  // 돌다리(세로)
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='bridge'&&[[1,0],[-1,0]].some(([a])=>cells[y]![x+a!]==='pool')){const px=x*C,py=y*C;g.fillStyle='rgba(8,24,30,.4)';g.fillRect(px+22,py+6,C-36,C+4);
    for(let k=0;k<C;k+=32){g.fillStyle=`rgb(${178+R()*20|0},${172+R()*18|0},${156+R()*16|0})`;g.fillRect(px+18,py+k+2,C-36,29);g.fillStyle='rgba(255,250,236,.3)';g.fillRect(px+18,py+k+2,C-36,3);g.fillStyle='rgba(40,34,26,.35)';g.fillRect(px+18,py+k+28,C-36,3);}}
}
/** 논밭: 두렁으로 나뉜 밭에 줄지어 자란 곡식(밤·저녁엔 빛만 바뀐다). */
function paintCrops(g:Ctx,cells:Cell[][],R:()=>number){
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='crop'){const px=x*C,py=y*C;
    g.fillStyle='#6a5232';g.fillRect(px,py,C,C);
    const left=cells[y]![x-1]!=='crop',right=cells[y]![x+1]!=='crop',top=cells[y-1]?.[x]!=='crop',bot=cells[y+1]?.[x]!=='crop';
    g.fillStyle='rgba(30,20,8,.25)';for(let k=8;k<C;k+=16)g.fillRect(px,py+k,C,4);
    const ripe=(x*7+y*3)%5===0;
    for(let k=10;k<C;k+=16)for(let j=6;j<C;j+=12){const cx=px+j+(R()-.5)*3,cy=py+k;g.strokeStyle=ripe?`rgba(${210+R()*30|0},${170+R()*30|0},70,.95)`:`rgba(${80+R()*30|0},${140+R()*30|0},${50+R()*20|0},.95)`;g.lineWidth=2.4;g.beginPath();for(const d of [-4,0,4]){g.moveTo(cx,cy);g.lineTo(cx+d,cy-9-R()*5);}g.stroke();}
    g.fillStyle='rgba(196,170,120,.9)';if(left)g.fillRect(px,py,7,C);if(right)g.fillRect(px+C-7,py,7,C);if(top)g.fillRect(px,py,C,7);if(bot)g.fillRect(px,py+C-7,C,7);}
}
/** 바위 비탈: 회갈색 돌밭(사람이 서지 않는 곳). */
function paintScree(g:Ctx,cells:Cell[][],R:()=>number){
  let any=false;for(const row of cells)if(row.includes('scree'))any=true;if(!any)return;
  const mask=layer(m=>{m.fillStyle='#000';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='scree')m.fillRect(x*C-10,y*C-10,C+20,C+20);m.globalCompositeOperation='destination-out';for(let i=0;i<160;i++){m.beginPath();m.ellipse(R()*PW,R()*PH,24+R()*50,16+R()*28,R()*3,0,7);m.fill();}});
  const soft=smoothMask(mask,30,4);
  const sc=layer(d=>{d.fillStyle='#8a8070';d.fillRect(0,0,PW,PH);
    for(let i=0;i<40;i++){const x=R()*PW,y=R()*PH,r=80+R()*180,gr=d.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(60,52,40,.35)':'rgba(200,190,170,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=gr;d.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<1600;i++){const x=R()*PW,y=R()*PH,r=3+R()*9;d.fillStyle='rgba(30,26,20,.45)';d.beginPath();d.ellipse(x+2,y+3,r*1.1,r*.7,0,0,7);d.fill();const v=150+R()*60|0;d.fillStyle=`rgb(${v},${v-6},${v-18})`;d.beginPath();d.ellipse(x,y,r,r*.7,R()*3,0,7);d.fill();d.fillStyle='rgba(255,250,236,.3)';d.beginPath();d.ellipse(x-r*.3,y-r*.25,r*.4,r*.25,0,0,7);d.fill();}
    for(let i=0;i<260;i++){const x=R()*PW,y=R()*PH;d.strokeStyle='rgba(96,120,60,.7)';d.lineWidth=2;d.beginPath();d.moveTo(x,y);d.lineTo(x+(R()-.5)*6,y-8-R()*10);d.stroke();}
    d.globalCompositeOperation='destination-in';d.drawImage(soft,0,0);});
  g.save();g.filter='blur(12px)';g.globalCompositeOperation='multiply';g.globalAlpha=.45;g.drawImage(mask,10,16);g.restore();
  g.drawImage(sc,0,0);
  // 비탈 위 가장자리는 밝게, 아래 가장자리는 짙게(높이가 느껴지게)
  g.drawImage(layer(t=>{t.drawImage(soft,0,0);t.globalCompositeOperation='destination-out';t.drawImage(soft,0,10);t.globalCompositeOperation='source-in';t.fillStyle='rgba(240,230,205,.55)';t.fillRect(0,0,PW,PH);}),0,0);
  g.drawImage(layer(t=>{t.drawImage(soft,0,0);t.globalCompositeOperation='destination-out';t.drawImage(soft,0,-14);t.globalCompositeOperation='source-in';t.fillStyle='rgba(40,30,20,.5)';t.fillRect(0,0,PW,PH);}),0,0);
}
/** 눈: 땅을 덮은 눈(군데군데 흙·풀이 비치고, 길에는 바퀴 자국). */
function paintSnow(g:Ctx,cells:Cell[][],roads:Array<Array<[number,number]>>,R:()=>number){
  const snow=layer(w=>{w.fillStyle='#eef2f6';w.fillRect(0,0,PW,PH);
    for(let i=0;i<60;i++){const x=R()*PW,y=R()*PH,r=80+R()*220,gr=w.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.6?'rgba(170,190,215,.35)':'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(0,0,0,0)');w.fillStyle=gr;w.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<1400;i++){w.fillStyle=`rgba(${R()<.5?'255,255,255':'160,180,205'},.5)`;w.beginPath();w.ellipse(R()*PW,R()*PH,2+R()*5,1+R()*2,0,0,7);w.fill();}
    // 흙·풀이 비치는 자리
    w.globalCompositeOperation='destination-out';w.filter='blur(18px)';for(let i=0;i<34;i++){w.fillStyle=`rgba(0,0,0,${.3+R()*.35})`;w.beginPath();w.ellipse(R()*PW,R()*PH,50+R()*110,26+R()*50,(R()-.5)*.4,0,7);w.fill();}
    w.filter='none';w.fillStyle='#000';for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=cells[y]![x];if(c==='water'||c==='pool'||c==='wall'||c==='gate')w.fillRect(x*C,y*C,C,C);}});
  g.drawImage(snow,0,0);
  g.save();g.lineCap='round';g.filter='blur(2px)';for(const pts of roads)for(const off of [-30,30]){g.strokeStyle='rgba(120,128,140,.38)';g.lineWidth=10;g.beginPath();g.moveTo(pts[0]![0]+off,pts[0]![1]);for(let i=1;i<pts.length;i++){const p=pts[i]!,q=pts[i-1]!;g.quadraticCurveTo(q[0]+off,q[1],(p[0]+q[0])/2+off,(p[1]+q[1])/2);}g.lineTo(pts.at(-1)![0]+off,pts.at(-1)![1]);g.stroke();}g.restore();
}
/** 성벽 띠: 남쪽 벽면(벽돌·빗물 자국·밑동 그늘), 성 위 길, 바깥쪽 성가퀴, 성문. */
function paintWall(g:Ctx,cells:Cell[][],R:()=>number){
  const rows:number[]=[];for(let y=0;y<GH;y++)if(cells[y]!.some(c=>c==='wall'||c==='gate'))rows.push(y);if(!rows.length)return;
  const y0=rows[0]!*C,y1=(rows.at(-1)!+1)*C,FACE=Math.round(C*1.25),top=y1-FACE-y0;
  // 성 위 길
  const gr=g.createLinearGradient(0,y0,0,y0+top);gr.addColorStop(0,'#a9a28e');gr.addColorStop(1,'#8e8774');g.fillStyle=gr;g.fillRect(0,y0,PW,top);
  g.strokeStyle='rgba(60,54,44,.35)';g.lineWidth=2;for(let k=0;k<top;k+=36){g.beginPath();g.moveTo(0,y0+k);g.lineTo(PW,y0+k);g.stroke();}for(let r=0;r*36<top;r++)for(let k=(r%2)*40;k<PW;k+=80){g.beginPath();g.moveTo(k,y0+r*36);g.lineTo(k,y0+r*36+36);g.stroke();}
  // 성가퀴(위쪽 가장자리)
  for(let k=0;k<PW;k+=52){g.fillStyle='rgb(136,128,112)';g.fillRect(k,y0-6,52,22);g.fillStyle='rgb(198,190,170)';g.fillRect(k+4,y0-10,30,24);g.fillStyle='rgb(40,34,28)';g.fillRect(k+17,y0-2,4,10);}
  // 남쪽 벽면
  const fy=y1-FACE,fg=g.createLinearGradient(0,fy,0,y1);fg.addColorStop(0,'#8e8878');fg.addColorStop(1,'#5a554a');g.fillStyle=fg;g.fillRect(0,fy,PW,FACE);
  for(let r=0;r*20<FACE;r++){const yy=fy+r*20,off=(r%2)*24;g.fillStyle='rgba(30,26,20,.5)';g.fillRect(0,yy,PW,2);for(let k=-off;k<PW;k+=48){g.fillRect(Math.max(0,k),yy,2,20);if(R()<.28){g.fillStyle=R()<.5?'rgba(255,245,225,.09)':'rgba(0,0,0,.14)';g.fillRect(Math.max(0,k)+2,yy+2,44,17);g.fillStyle='rgba(30,26,20,.5)';}}}
  for(let i=0;i<30;i++){const x=R()*PW,g2=g.createLinearGradient(0,fy,0,fy+FACE*.7);g2.addColorStop(0,'rgba(30,26,20,.35)');g2.addColorStop(1,'rgba(30,26,20,0)');g.fillStyle=g2;g.fillRect(x,fy,6+R()*6,FACE*.7);}
  const sh=g.createLinearGradient(0,y1,0,y1+40);sh.addColorStop(0,'rgba(10,14,8,.5)');sh.addColorStop(1,'rgba(10,14,8,0)');g.fillStyle=sh;g.fillRect(0,y1,PW,40);
  for(let i=0;i<60;i++){g.fillStyle='rgba(70,95,50,.4)';g.beginPath();g.ellipse(R()*PW,y1-2,10+R()*14,4,0,0,7);g.fill();}
  // 성문
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cells[y]![x]==='gate'&&(x===0||cells[y]![x-1]!=='gate')){const px=x*C,w=C*2,gy=fy;
    g.fillStyle='#2a221c';g.beginPath();g.moveTo(px+14,y1);g.lineTo(px+14,gy+60);g.quadraticCurveTo(px+w/2,gy-10,px+w-14,gy+60);g.lineTo(px+w-14,y1);g.closePath();g.fill();
    for(const side of [0,1]){const dx=px+20+side*(w/2-12);g.fillStyle='rgb(118,34,22)';g.fillRect(dx,gy+62,w/2-28,y1-gy-62);g.fillStyle='rgb(228,190,96)';for(let a=0;a<4;a++)for(let b=0;b<5;b++){g.beginPath();g.arc(dx+12+a*((w/2-52)/3),gy+78+b*((y1-gy-100)/4),4,0,7);g.fill();}}
    g.fillStyle='rgba(255,220,150,.08)';g.fillRect(px+14,gy+60,w-28,y1-gy-60);}
}

// ─────────────────────────────────────────────── 소품
function shadow(g:Ctx,x:number,y:number,rx:number,ry:number,a=.4){const gr=g.createRadialGradient(x,y,0,x,y,rx);gr.addColorStop(0,`rgba(8,14,6,${a})`);gr.addColorStop(1,'rgba(8,14,6,0)');g.fillStyle=gr;g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);g.fillRect(x-rx,y-rx,rx*2,rx*2);g.restore();}
function sprite(g:Ctx,frame:number,x:number,y:number,w:number,h:number,flip=false,filter=''){const t=sceneryThumb(atlas!,frame,w,h,flip);g.save();if(filter)g.filter=filter;g.drawImage(t,Math.round(x-w/2),Math.round(y-h*.96));g.restore();}
/** 눈 장면이면 나무·풀 빛을 바래고 위에 눈을 얹는다. */
let SNOW=false;
function drawProp(g:Ctx,p:Prop,R:()=>number){
  if(SNOW&&['tree','pine','autumn','willow','bush','house','hall','tent','tower','pavilion'].includes(p.kind)){
    const BW=1000,BH=760,ox=p.x*C-BW/2,oy=p.y*C-BH+60,c=document.createElement('canvas');c.width=BW;c.height=BH;const h=c.getContext('2d')!;h.translate(-ox,-oy);SNOW=false;drawProp(h,p,R);SNOW=true;
    g.save();g.filter='saturate(.45) brightness(1.08)';g.drawImage(c,ox,oy);g.restore();
    // 위를 향한 면에 눈: 소품 모양을 아래로 조금 밀어 빼고 남은 윗가장자리만 희게
    const t=document.createElement('canvas');t.width=BW;t.height=BH;const u=t.getContext('2d')!;u.drawImage(c,0,0);u.globalCompositeOperation='destination-out';u.drawImage(c,0,9);u.globalCompositeOperation='source-in';u.fillStyle='rgba(248,250,255,.92)';u.fillRect(0,0,BW,BH);g.drawImage(t,ox,oy);return;}
  const x=p.x*C,y=p.y*C,s=p.s;
  switch(p.kind){
    case 'tree':case 'pine':case 'autumn':{const w=300*s,h=(p.kind==='pine'?430:390)*s;shadow(g,x+18,y-6,w*.5,w*.17,.45);sprite(g,p.kind==='pine'?1:0,x,y,w,h,p.flip,p.kind==='autumn'?`hue-rotate(${-38-R()*18|0}deg) saturate(1.3) brightness(1.06)`:'');break;}
    case 'bush':{shadow(g,x+8,y,60*s,20*s,.3);for(const [k,n,lift] of [[.62,10,0],[.86,13,10],[1.14,9,22]] as const)for(let i=0;i<n;i++){const a=R()*6.283,rr=Math.sqrt(R())*50*s;g.fillStyle=`rgb(${(70*k)|0},${(118*k)|0},${(46*k)|0})`;g.beginPath();g.ellipse(x+Math.cos(a)*rr*1.3-lift*.4,y-34*s+Math.sin(a)*rr*.55-lift,14*s+R()*10,10*s+R()*8,R()*3,0,7);g.fill();}
      if(R()<.5)for(let i=0;i<6;i++){g.fillStyle=R()<.5?'rgba(250,240,230,.9)':'rgba(230,150,170,.9)';g.beginPath();g.arc(x+(R()-.5)*90*s,y-30*s-R()*40*s,3.5,0,7);g.fill();}break;}
    case 'rock':{const w=150*s,h=110*s;shadow(g,x+12,y,w*.55,h*.22,.45);const pts:Array<[number,number]>=[];for(let i=0;i<8;i++){const a=Math.PI+i/7*Math.PI,rr=1+(R()-.5)*.35;pts.push([x+Math.cos(a)*w*.5*rr,y-6+Math.sin(a)*h*.9*rr]);}
      const gr=g.createLinearGradient(x-w/2,y-h,x+w/2,y);gr.addColorStop(0,'#c9c7bc');gr.addColorStop(.5,'#8e8c84');gr.addColorStop(1,'#565650');g.fillStyle=gr;g.strokeStyle='#2e2d2a';g.lineWidth=2.5;g.beginPath();pts.forEach((q,i)=>i?g.lineTo(...q):g.moveTo(...q));g.closePath();g.fill();g.stroke();
      g.strokeStyle='rgba(40,40,36,.35)';g.lineWidth=1.5;for(let i=0;i<4;i++){const sx=x+(R()-.5)*w*.6;g.beginPath();g.moveTo(sx,y-h*.8);g.quadraticCurveTo(sx+(R()-.5)*20,y-h*.4,sx+(R()-.5)*14,y-8);g.stroke();}
      for(let i=0;i<5;i++){g.fillStyle='rgba(100,136,64,.7)';g.beginPath();g.ellipse(x+(R()-.5)*w*.8,y-4-R()*10,10*s,4*s,0,0,7);g.fill();}break;}
    case 'rockery':{for(let i=0;i<3;i++)drawProp(g,{kind:'rock',x:p.x+(i-1)*.45*s,y:p.y-(i===1?.35:0)*s,s:s*(i===1?1.1:.75),flip:i===2},R);break;}
    case 'house':{const w=460*s,h=400*s;shadow(g,x+30,y-10,w*.5,w*.16,.5);sprite(g,6,x,y,w,h,p.flip);break;}
    case 'hall':{const w=760*s,h=520*s;shadow(g,x+40,y-16,w*.5,w*.14,.5);sprite(g,6,x,y,w,h,p.flip);break;}
    case 'tent':{const w=310*s,h=300*s;shadow(g,x+20,y-6,w*.48,w*.15,.45);sprite(g,5,x,y,w,h,p.flip);break;}
    case 'tower':{const w=330*s,h=450*s;shadow(g,x+26,y-8,w*.5,w*.15,.5);sprite(g,3,x,y,w,h,p.flip);break;}
    case 'jar':{const r=34*s;shadow(g,x+6,y,r*1.3,r*.5,.45);const gr=g.createRadialGradient(x-r*.4,y-r*1.3,r*.2,x,y-r,r*1.4);gr.addColorStop(0,'#c9915a');gr.addColorStop(.6,'#8e5a30');gr.addColorStop(1,'#4a2c16');g.fillStyle=gr;g.beginPath();g.ellipse(x,y-r*1.05,r,r*1.15,0,0,7);g.fill();
      g.fillStyle='#3a2414';g.beginPath();g.ellipse(x,y-r*2.1,r*.55,r*.22,0,0,7);g.fill();g.fillStyle='rgba(255,230,190,.35)';g.beginPath();g.ellipse(x-r*.4,y-r*1.4,r*.18,r*.5,.3,0,7);g.fill();break;}
    case 'bench':{const w=150*s,h=26*s;shadow(g,x,y,w*.6,14*s,.4);g.fillStyle='#4a3018';for(const dx of [-w*.38,w*.38]){g.fillRect(x+dx-5,y-44*s,10,44*s);}g.fillStyle='#8c6238';g.fillRect(x-w/2,y-50*s,w,h);g.fillStyle='rgba(255,230,190,.25)';g.fillRect(x-w/2,y-50*s,w,5);g.fillStyle='rgba(40,20,8,.45)';g.fillRect(x-w/2,y-50*s+h-4,w,4);break;}
    case 'fence':{const w=C*s;g.fillStyle='#5a3c22';for(const dx of [-w/2+10,w/2-10]){g.fillRect(x+dx-6,y-70,12,70);g.fillStyle='#3a2414';g.fillRect(x+dx-6,y-74,12,6);g.fillStyle='#5a3c22';}
      g.fillStyle='#7a5430';g.fillRect(x-w/2,y-58,w,10);g.fillRect(x-w/2,y-30,w,10);g.fillStyle='rgba(255,220,170,.2)';g.fillRect(x-w/2,y-58,w,2);g.fillRect(x-w/2,y-30,w,2);break;}
    case 'lantern':{shadow(g,x+6,y,40*s,14*s,.4);g.fillStyle='#8e8b82';g.fillRect(x-14*s,y-60*s,28*s,60*s);g.fillStyle='#a9a59a';g.fillRect(x-30*s,y-82*s,60*s,22*s);g.fillStyle='#7a776e';g.beginPath();g.moveTo(x-40*s,y-82*s);g.lineTo(x,y-110*s);g.lineTo(x+40*s,y-82*s);g.closePath();g.fill();
      const gr=g.createRadialGradient(x,y-72*s,0,x,y-72*s,70*s);gr.addColorStop(0,'rgba(255,200,120,.45)');gr.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=gr;g.fillRect(x-70*s,y-142*s,140*s,140*s);break;}
    case 'well':{shadow(g,x+8,y,70*s,24*s,.45);g.fillStyle='#7a7468';g.beginPath();g.ellipse(x,y-30*s,62*s,30*s,0,0,7);g.fill();g.fillStyle='#1a2a30';g.beginPath();g.ellipse(x,y-36*s,44*s,20*s,0,0,7);g.fill();g.fillStyle='#9a958a';g.beginPath();g.ellipse(x,y-30*s,62*s,30*s,0,Math.PI,7);g.fill();g.strokeStyle='#2a2622';g.lineWidth=2;g.beginPath();g.ellipse(x,y-30*s,62*s,30*s,0,0,7);g.stroke();
      g.fillStyle='#5a3c22';g.fillRect(x-58*s,y-130*s,10,100*s);g.fillRect(x+48*s,y-130*s,10,100*s);g.fillStyle='#3a2414';g.fillRect(x-70*s,y-140*s,140*s,14);break;}
    case 'fire':{shadow(g,x,y,50*s,18*s,.3);g.fillStyle='#3a2a1a';for(let i=0;i<5;i++){g.save();g.translate(x,y-6);g.rotate(i*1.25);g.fillRect(-40*s,-6,80*s,12);g.restore();}
      const gr=g.createRadialGradient(x,y-30*s,0,x,y-30*s,120*s);gr.addColorStop(0,'rgba(255,170,70,.55)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(x-120*s,y-150*s,240*s,240*s);
      for(const [k,c] of [[1,'#ff6a1c'],[.7,'#ffb13a'],[.4,'#fff0a0']] as const){g.fillStyle=c;g.beginPath();g.moveTo(x-26*s*k,y-8);g.quadraticCurveTo(x-30*s*k,y-50*s*k,x,y-90*s*k);g.quadraticCurveTo(x+30*s*k,y-50*s*k,x+26*s*k,y-8);g.closePath();g.fill();}break;}
    case 'banner':{g.fillStyle='#3a2414';g.fillRect(x-4,y-230*s,8,230*s);g.fillStyle=p.color??'#1f3f8a';g.beginPath();g.moveTo(x+4,y-226*s);g.lineTo(x+86*s,y-212*s);g.lineTo(x+70*s,y-150*s);g.lineTo(x+4,y-120*s);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+4,y-226*s,20*s,106*s);g.fillStyle='#e8c070';g.font=`${40*s|0}px serif`;g.fillText('魏',x+22*s,y-160*s);break;}
    case 'flowers':{for(let i=0;i<9;i++){const fx=x+(R()-.5)*90,fy=y+(R()-.5)*40;g.fillStyle=['#f6f0dc','#f2d24a','#e98aa8','#c9a0e8','#ff9a6a'][Math.floor(R()*5)]!;g.beginPath();g.arc(fx,fy,3+R()*2.5,0,7);g.fill();g.fillStyle='rgba(60,110,40,.8)';g.fillRect(fx-1,fy+2,2,8);}break;}
    case 'reeds':{for(let i=0;i<14;i++){const sx=x+(R()-.5)*90*s,sy=y+(R()-.5)*20,h=40+R()*50,lean=(R()-.5)*18;g.strokeStyle=R()<.5?'rgb(96,126,62)':'rgb(150,170,82)';g.lineWidth=2.2;g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(sx+lean*.3,sy-h*.5,sx+lean,sy-h);g.stroke();if(i%3===0){g.fillStyle='rgb(140,104,58)';g.beginPath();g.ellipse(sx+lean,sy-h,3,9,0,0,7);g.fill();}}break;}
    case 'boat':{const w=200*s;g.save();if(p.flip){g.translate(x*2,0);g.scale(-1,1);}g.fillStyle='rgba(5,20,30,.4)';g.beginPath();g.ellipse(x,y+10,w*.55,18,0,0,7);g.fill();g.fillStyle='#5a3a1e';g.beginPath();g.moveTo(x-w/2,y-20);g.quadraticCurveTo(x,y+26,x+w/2,y-20);g.lineTo(x+w*.42,y-40);g.lineTo(x-w*.42,y-40);g.closePath();g.fill();g.fillStyle='#8a6038';g.fillRect(x-w*.4,y-40,w*.8,8);g.fillStyle='#3a2414';g.fillRect(x-3,y-150*s,6,112*s);g.fillStyle='#e8dcc0';g.beginPath();g.moveTo(x+3,y-146*s);g.lineTo(x+70*s,y-100*s);g.lineTo(x+3,y-60*s);g.closePath();g.fill();g.restore();break;}
    case 'willow':{const w=300*s,h=380*s;shadow(g,x+18,y-6,w*.5,w*.17,.42);sprite(g,0,x,y,w,h,p.flip,'hue-rotate(22deg) saturate(.85) brightness(1.12)');
      g.strokeStyle='rgba(150,190,90,.75)';g.lineWidth=2.4;for(let i=0;i<26;i++){const sx=x+(R()-.5)*w*.7,sy=y-h*(.45+R()*.4),l=40+R()*70;g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(sx+(R()-.5)*10,sy+l*.5,sx+(R()-.5)*14,sy+l);g.stroke();}break;}
    case 'pavilion':{const w=270*s,h=230*s;shadow(g,x+24,y-6,w*.55,w*.18,.5);
      g.fillStyle='#8e8878';g.beginPath();g.ellipse(x,y-14*s,w*.46,w*.16,0,0,7);g.fill();g.fillStyle='#b2ab98';g.beginPath();g.ellipse(x,y-20*s,w*.44,w*.15,0,0,7);g.fill();
      g.fillStyle='#8a2a1e';for(const dx of [-.34,-.12,.12,.34])g.fillRect(x+dx*w-6*s,y-h*.62,12*s,h*.46);g.fillStyle='rgba(255,220,180,.25)';for(const dx of [-.34,-.12,.12,.34])g.fillRect(x+dx*w-6*s,y-h*.62,4*s,h*.46);
      g.fillStyle='#2e3a36';g.beginPath();g.moveTo(x-w*.6,y-h*.58);g.quadraticCurveTo(x-w*.42,y-h*.66,x-w*.3,y-h*.84);g.lineTo(x,y-h);g.lineTo(x+w*.3,y-h*.84);g.quadraticCurveTo(x+w*.42,y-h*.66,x+w*.6,y-h*.58);g.quadraticCurveTo(x,y-h*.66,x-w*.6,y-h*.58);g.fill();
      g.strokeStyle='rgba(150,170,160,.5)';g.lineWidth=2;for(let k=-5;k<=5;k++){g.beginPath();g.moveTo(x+k*w*.05,y-h*.98);g.lineTo(x+k*w*.1,y-h*.62);g.stroke();}
      g.fillStyle='#c9a35a';g.beginPath();g.arc(x,y-h*1.02,7*s,0,7);g.fill();break;}
    case 'stall':{const w=150*s;shadow(g,x+10,y,w*.6,18*s,.4);g.fillStyle='#4a3018';for(const dx of [-.45,.45])g.fillRect(x+dx*w-3,y-120*s,6,120*s);
      g.fillStyle='#7a5430';g.fillRect(x-w*.42,y-46*s,w*.84,30*s);g.fillStyle='rgba(255,230,190,.25)';g.fillRect(x-w*.42,y-46*s,w*.84,4);
      for(let i=0;i<7;i++){g.fillStyle=['#d8a040','#a83a2a','#e8dcc0','#6a8a3a','#c06a2a'][Math.floor(R()*5)]!;g.beginPath();g.arc(x-w*.34+i*w*.11,y-50*s,7*s,0,7);g.fill();}
      const tone=p.color??'#a8322a';g.fillStyle=tone;g.beginPath();g.moveTo(x-w*.56,y-104*s);g.lineTo(x+w*.56,y-104*s);g.lineTo(x+w*.5,y-132*s);g.lineTo(x-w*.5,y-132*s);g.closePath();g.fill();
      g.fillStyle='rgba(255,255,255,.22)';for(let i=0;i<6;i++)g.fillRect(x-w*.5+i*w*.2,y-132*s,w*.1,28*s);g.fillStyle=tone;for(let i=0;i<8;i++){g.beginPath();g.arc(x-w*.5+i*w*.143,y-104*s,w*.072,0,Math.PI);g.fill();}break;}
    case 'stepstone':{g.fillStyle='rgba(30,24,16,.35)';g.beginPath();g.ellipse(x+3,y+5,40*s,17*s,0,0,7);g.fill();g.fillStyle='#b6ae9a';g.beginPath();g.ellipse(x,y,38*s,16*s,(R()-.5)*.4,0,7);g.fill();g.fillStyle='rgba(255,250,236,.35)';g.beginPath();g.ellipse(x-8*s,y-4*s,18*s,6*s,0,0,7);g.fill();break;}
    case 'stump':{shadow(g,x+6,y,34*s,12*s,.35);g.fillStyle='#5a3c22';g.fillRect(x-22*s,y-26*s,44*s,24*s);g.fillStyle='#c09a64';g.beginPath();g.ellipse(x,y-26*s,22*s,10*s,0,0,7);g.fill();g.strokeStyle='rgba(90,60,30,.7)';g.lineWidth=1.5;for(const r of [.35,.7]){g.beginPath();g.ellipse(x,y-26*s,22*s*r,10*s*r,0,0,7);g.stroke();}break;}
    case 'haystack':{const r=50*s;shadow(g,x+10,y,r*1.2,r*.4,.45);const gr=g.createRadialGradient(x-r*.4,y-r*1.1,r*.2,x,y-r*.7,r*1.3);gr.addColorStop(0,'#f0d080');gr.addColorStop(.7,'#c09a40');gr.addColorStop(1,'#7a5a20');g.fillStyle=gr;g.beginPath();g.ellipse(x,y-r*.6,r,r*.9,0,Math.PI,0);g.lineTo(x+r,y);g.lineTo(x-r,y);g.closePath();g.fill();
      g.strokeStyle='rgba(120,86,30,.6)';g.lineWidth=1.6;for(let i=0;i<14;i++){const a=Math.PI+R()*Math.PI;g.beginPath();g.moveTo(x+Math.cos(a)*r*.9,y-r*.6+Math.sin(a)*r*.8);g.lineTo(x+Math.cos(a)*r*.5,y-r*.6+Math.sin(a)*r*.4+8);g.stroke();}
      g.strokeStyle='#6a4a1a';g.lineWidth=3;g.beginPath();g.ellipse(x,y-r*.5,r*.96,r*.22,0,0,Math.PI);g.stroke();break;}
    case 'ruin':{const w=C*1.7*s;shadow(g,x+10,y,w*.55,16*s,.45);const n=7;
      for(let i=0;i<n;i++){const bx=x-w/2+i*w/n,hh=(70-Math.abs(i-(p.flip?4.5:1.5))*14+R()*14)*s;if(hh<12)continue;for(let k=0;k*22*s<hh;k++){const v=150+R()*40|0;g.fillStyle=`rgb(${v},${v-6},${v-20})`;g.fillRect(bx+(k%2)*4,y-(k+1)*22*s,w/n-3,20*s);g.fillStyle='rgba(255,250,236,.25)';g.fillRect(bx+(k%2)*4,y-(k+1)*22*s,w/n-3,3);g.fillStyle='rgba(30,26,20,.35)';g.fillRect(bx+(k%2)*4,y-(k+1)*22*s+17*s,w/n-3,3);}
        if(R()<.4){g.fillStyle='rgba(86,120,56,.7)';g.beginPath();g.ellipse(bx+w/n/2,y-hh+4,12,5,0,0,7);g.fill();}}
      for(let i=0;i<6;i++){const rx=x+(R()-.5)*w,ry=y+4+R()*14,r=6+R()*10;g.fillStyle='#9a9280';g.beginPath();g.ellipse(rx,ry,r,r*.6,R()*3,0,7);g.fill();}break;}
    case 'ruintower':{const w=330*s,h=450*s;shadow(g,x+26,y-8,w*.5,w*.15,.5);sprite(g,3,x,y,w,h,p.flip,'grayscale(.65) brightness(.82) sepia(.25)');
      g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.moveTo(x-w*.5,y-h*.98);g.lineTo(x+w*.5,y-h*.98);g.lineTo(x+w*.5,y-h*.66);g.lineTo(x+w*.2,y-h*.78);g.lineTo(x,y-h*.6);g.lineTo(x-w*.25,y-h*.74);g.lineTo(x-w*.5,y-h*.62);g.closePath();g.fill();g.restore();
      for(let i=0;i<10;i++){const rx=x+(R()-.5)*w*.9,ry=y+R()*16,r=8+R()*12;g.fillStyle='#8a8272';g.beginPath();g.ellipse(rx,ry,r,r*.6,R()*3,0,7);g.fill();}break;}
    case 'deadtree':{const h=230*s;shadow(g,x+14,y,50*s,14*s,.4);const br=(bx:number,by:number,a:number,l:number,wd:number,d:number):void=>{const ex=bx+Math.cos(a)*l,ey=by+Math.sin(a)*l;g.strokeStyle=d<2?'#3a2a1c':'#4e3a28';g.lineWidth=wd;g.beginPath();g.moveTo(bx,by);g.lineTo(ex,ey);g.stroke();if(d<4)for(const k of [-1,1])br(ex,ey,a+k*(.35+R()*.35),l*(.62+R()*.15),wd*.62,d+1);};
      g.lineCap='round';br(x,y,-Math.PI/2+(p.flip?.08:-.08),h*.42,16*s,0);break;}
    case 'crate':{const w=64*s;shadow(g,x+6,y,w*.8,w*.3,.4);g.fillStyle='#8a6a3c';g.fillRect(x-w/2,y-w,w,w);g.fillStyle='#5a4020';g.fillRect(x-w/2,y-w,w,4);g.fillRect(x-w/2,y-4,w,4);g.fillRect(x-w/2,y-w,4,w);g.fillRect(x+w/2-4,y-w,4,w);g.strokeStyle='rgba(40,24,8,.5)';g.lineWidth=3;g.beginPath();g.moveTo(x-w/2+4,y-w+4);g.lineTo(x+w/2-4,y-4);g.stroke();break;}
  }
}

// ─────────────────────────────────────────────── 빛
function lighting(g:Ctx,R:()=>number,light:Light,fireScene:boolean){
  // 왼쪽 위에서 비치는 해: 왼쪽 위는 따뜻하게, 오른쪽 아래는 약간 서늘하게
  g.save();g.globalCompositeOperation='soft-light';const sun=g.createLinearGradient(0,0,PW,PH);sun.addColorStop(0,'rgba(255,240,200,.55)');sun.addColorStop(1,'rgba(40,60,110,.45)');g.fillStyle=sun;g.fillRect(0,0,PW,PH);g.restore();
  // 구름 그림자
  g.save();g.globalCompositeOperation='multiply';g.filter='blur(60px)';for(let i=0;i<3;i++){g.fillStyle='rgba(30,40,50,.22)';g.beginPath();g.ellipse(R()*PW,R()*PH,260+R()*300,120+R()*140,R(),0,7);g.fill();}g.restore();
  if(light==='night'){g.save();g.globalCompositeOperation='multiply';g.fillStyle='rgba(50,70,130,.6)';g.fillRect(0,0,PW,PH);g.globalCompositeOperation='screen';g.fillStyle='rgba(255,190,110,.05)';g.fillRect(0,0,PW,PH);g.restore();}
  if(light==='dawn'){g.save();g.globalCompositeOperation='multiply';g.fillStyle='rgba(185,195,235,.3)';g.fillRect(0,0,PW,PH);g.restore();}
  if(light==='dusk'){g.save();g.globalCompositeOperation='multiply';g.fillStyle='rgba(255,165,95,.28)';g.fillRect(0,0,PW,PH);g.restore();}
  if(fireScene){g.save();g.globalCompositeOperation='overlay';g.fillStyle='rgba(255,110,40,.28)';g.fillRect(0,0,PW,PH);g.restore();
    for(let i=0;i<6;i++){const x=R()*PW,y=R()*PH*.6,r=150+R()*220,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,150,60,.4)');gr.addColorStop(1,'rgba(255,150,60,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
    g.save();g.filter='blur(18px)';for(let i=0;i<5;i++){const x=R()*PW,y=R()*PH*.5;for(let k=0;k<6;k++){g.fillStyle=`rgba(60,50,46,${.35-k*.05})`;g.beginPath();g.ellipse(x+k*18+(R()-.5)*30,y-k*70,50+k*22,36+k*12,0,0,7);g.fill();}}g.restore();}
  // 가장자리 어둡게
  const v=g.createRadialGradient(PW/2,PH/2,PH*.4,PW/2,PH/2,PW*.6);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=v;g.fillRect(0,0,PW,PH);
}

// ─────────────────────────────────────────────── 조립
export interface Ground {canvas:HTMLCanvasElement;cells:Cell[][];standable:(x:number,y:number)=>boolean}
export function paintGround(kind:GroundKind,seed:number,light:Light,clearCells:ReadonlyArray<readonly [number,number]>=[],opts:GroundOpts={}):Ground|undefined{
  if(!groundReady())return undefined;
  let s0=seed>>>0||1;const R=()=>{s0=(s0*1664525+1013904223)>>>0;return s0/4294967296;};
  const {g:cells,props,roads}=layout(kind,R,opts);
  // 대본 자리 둘레의 소품은 치운다(사람이 설 자리)
  const keep=props.filter(p=>!clearCells.some(([cx,cy])=>Math.abs(p.x-cx-.5)<1.6&&Math.abs(p.y-cy-.8)<1.4)||['flowers','reeds'].includes(p.kind));
  for(const [cx,cy] of clearCells)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=cx+dx,y=cy+dy;if(x>=0&&y>=0&&x<GW&&y<GH&&(cells[y]![x]==='block'||cells[y]![x]==='crop'||cells[y]![x]==='scree'))cells[y]![x]='grass';}
  const canvas=document.createElement('canvas');canvas.width=PW;canvas.height=PH;const g=canvas.getContext('2d')!;g.imageSmoothingQuality='high';
  const dry=kind==='hill'||kind==='battlefield'||kind==='valley'||kind==='pass'||kind==='ruins';
  paintGrass(g,R,dry);
  // 진영 마당: 밟혀 다져진 넓은 흙
  const yardMask=kind==='camp'||kind==='battlefield'?layer(m=>{m.fillStyle='#000';m.beginPath();m.ellipse(PW/2,PH/2+40,PW*.34,PH*.3,0,0,7);m.fill();}):undefined;
  paintRoads(g,roads,R,yardMask);
  paintScree(g,cells,R);
  paintCrops(g,cells,R);
  paintStone(g,cells,R);
  paintWater(g,cells,R);
  paintPools(g,cells,R);
  paintWall(g,cells,R);
  if(opts.snow)paintSnow(g,cells,roads,R);
  SNOW=!!opts.snow;
  for(const p of [...keep].sort((a,b)=>a.y-b.y))drawProp(g,p,R);
  const scene=noise();void sample(scene,0,0);
  SNOW=false;
  lighting(g,R,light,kind==='fire');
  if(opts.snow){g.save();g.globalCompositeOperation='soft-light';g.fillStyle='rgba(200,215,240,.5)';g.fillRect(0,0,PW,PH);g.restore();}
  const WALK=new Set<Cell>(['grass','dirt','stone','bridge']);
  const standable=(x:number,y:number)=>x>=0&&y>=1&&x<GW&&y<GH&&WALK.has(cells[y]![x]!)&&!keep.some(p=>!['flowers','reeds','fence','stump','stepstone'].includes(p.kind)&&Math.abs(p.x-x-.5)<(p.kind==='hall'?2.6:p.kind==='house'||p.kind==='tower'||p.kind==='ruintower'?1.6:p.kind==='tent'||p.kind==='pavilion'?1.2:p.kind==='ruin'?1:.7)&&y+.8>p.y-(p.kind==='hall'?2.2:p.kind==='house'||p.kind==='tower'||p.kind==='ruintower'?1.8:p.kind==='tent'||p.kind==='pavilion'?1.3:.8)&&y+.8<=p.y+.35);
  return {canvas,cells,standable};
}
