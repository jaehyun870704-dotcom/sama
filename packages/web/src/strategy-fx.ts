/**
 * 책략·병종 특수 스킬마다 다른 연출.
 *
 * 예전에는 속성 7가지(불·물·바람·번개·땅·계략·회복)로만 나눠, 같은 속성의 책략은 모두 똑같이 보였고
 * 물리 스킬 32개는 전부 '땅'(바위 가시)으로, 술법 22개는 모두 보랏빛 부적으로 보였다.
 * 이제 책략 하나하나가 시전 동작(cast) · 날아가는 모양(travel) · 맞는 자리 효과(layers) · 색을 따로 가진다.
 * 맞는 자리 효과는 아래 층(layer) 20여 가지를 2~3개씩 겹쳐 만든다.
 */
import type {Graphics} from 'pixi.js';
import type {BattleFx} from './battle-fx.ts';

type P={x:number;y:number};
const TAU=Math.PI*2;
let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

/** 시전 동작: 제자리 시전 · 손을 들어 올림 · 한 걸음 내지름 · 표적까지 돌진 · 쏘고 반동 · 던짐 · 회전 · 포효(몸이 부풂). */
export type Cast='cast'|'raise'|'lunge'|'dash'|'shoot'|'throw'|'spin'|'roar';
/** 시전자에서 표적까지 가는 모양. */
export type Travel='orb'|'ember'|'arrow'|'volley'|'sky'|'ground'|'wave'|'beam'|'zigzag'|'rise'|'spear'|'shell'|'talisman'|'leaf'|'none';
/** 맞는 자리 효과의 층. c·c2 = 주색·보조색, n = 개수, s = 크기 배율. */
export type Layer=
  |{k:'column';c:number;w?:number;h?:number}
  |{k:'flames';c:number;c2:number;n?:number;h?:number}
  |{k:'burst';c:number;c2:number;n?:number;up?:number;fall?:boolean}
  |{k:'ring';c:number;n?:number;s?:number}
  |{k:'dome';c:number;s?:number}
  |{k:'bolt';c:number;n?:number}
  |{k:'arcs';c:number;n?:number}
  |{k:'spikes';c:number;c2:number;n?:number}
  |{k:'rocks';c:number;n?:number}
  |{k:'rain';c:number;n?:number;tilt?:number;len?:number}
  |{k:'swirl';c:number;n?:number;s?:number}
  |{k:'streaks';c:number;n?:number;radial?:boolean}
  |{k:'slash';c:number;n?:number;s?:number}
  |{k:'glyph';c:number;t:string;s?:number}
  |{k:'petals';c:number;c2:number;n?:number}
  |{k:'cloud';c:number;s?:number}
  |{k:'bars';c:number;n?:number}
  |{k:'pillars';c:number;n?:number}
  |{k:'wave';c:number;s?:number}
  |{k:'orbs';c:number;n?:number}
  |{k:'cross';c:number;s?:number}
  |{k:'shards';c:number;n?:number}
  |{k:'flash';c:number;a?:number};
export interface StratFx {cast:Cast;travel:Travel;color:number;layers:readonly Layer[];shake?:number}

/**
 * 책략 진화 단계가 눈에 보이는 밀도 차이. 게임 규칙의 기본→숙련→극의와 같은 3단계다.
 * 범위는 커지되 유닛과 지형을 읽을 수 있도록 불투명도는 낮게 유지한다.
 */
export interface StrategyEvolutionFx {scale:number;rings:number;arcs:number;motes:number;column:boolean;flash:number}
export const STRATEGY_EVOLUTION_FX:Readonly<Record<0|1|2|3,StrategyEvolutionFx>>={
  0:{scale:1,rings:0,arcs:0,motes:0,column:false,flash:0},
  1:{scale:.84,rings:1,arcs:0,motes:4,column:false,flash:0},
  2:{scale:1.02,rings:2,arcs:2,motes:12,column:false,flash:0},
  3:{scale:1.2,rings:3,arcs:4,motes:22,column:true,flash:.18},
};

// ───────────────────────────────────── 층 그리기

const fadeIO=(t:number,a=.15,b=.75)=>t<a?t/a:t>b?1-(t-b)/(1-b):1;
function layer(fx:BattleFx,l:Layer,p:P,big:number):Promise<void>|void{
  const cx=p.x,cy=p.y,s=big;
  switch(l.k){
    case 'column':{const w=(l.w??18)*s,h=(l.h??110)*s;return fx.run(900,(g,t)=>{const a=fadeIO(t,.15,.6),k=Math.min(1,t*4);g.roundRect(cx-w,cy-h*k,w*2,h*k,w).fill({color:l.c,alpha:.32*a});g.roundRect(cx-w*.4,cy-h*k,w*.8,h*k,w*.4).fill({color:0xffffff,alpha:.4*a});});}
    case 'flames':{const n=l.n??7,H=(l.h??70)*s;return fx.run(900,(g,t)=>{const a=fadeIO(t,.1,.6);for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*9*s,w=(10-Math.abs(i-(n-1)/2)*1.4)*s,hh=H*(1-Math.abs(i-(n-1)/2)*.1)*(.85+Math.sin(t*20+i)*.15)*Math.min(1,t*3);
      g.moveTo(cx+ox-w,cy).quadraticCurveTo(cx+ox-w*1.2,cy-hh*.5,cx+ox+Math.sin(t*14+i)*6,cy-hh).quadraticCurveTo(cx+ox+w*1.2,cy-hh*.5,cx+ox+w,cy).fill({color:i%2?l.c:l.c2,alpha:.75*a});}});}
    case 'burst':return fx.particles({x:cx,y:cy-24},Math.round((l.n??24)*s),{speed:120*s,up:l.fall?-20:(l.up??70),gravity:l.fall?260:-40,life:900,size:[2,5],colors:[l.c,l.c2,0xffffff]});
    case 'ring':{const n=l.n??3,R=(l.s??1)*s;return fx.run(800,(g,t)=>{for(let k=0;k<n;k++){const q=Math.max(0,t-k*.14);if(q<=0)continue;g.ellipse(cx,cy+6,(14+70*q)*R,(6+26*q)*R).stroke({color:l.c,width:4*(1-q),alpha:(1-q)*.9});}});}
    case 'dome':{const R=(l.s??1)*s;return fx.run(900,(g,t)=>{const a=fadeIO(t),r=(26+8*Math.min(1,t*4))*R;g.arc(cx,cy+4,r*1.3,Math.PI,TAU).lineTo(cx+r*1.3,cy+4).fill({color:l.c,alpha:.22*a});g.arc(cx,cy+4,r*1.3,Math.PI,TAU).stroke({color:l.c,width:3,alpha:a});
      for(let i=0;i<5;i++){const q=Math.PI+i/4*Math.PI;g.moveTo(cx,cy+4-r*1.3).quadraticCurveTo(cx+Math.cos(q)*r*.9,cy+4-r*.7,cx+Math.cos(q)*r*1.3,cy+4+Math.sin(q)*r*.1).stroke({color:0xffffff,width:1.2,alpha:a*.6});}});}
    case 'bolt':{const n=l.n??1,bolts=Array.from({length:n},(_,j)=>{const ox=(j-(n-1)/2)*26*s+(rnd()-.5)*10,pts=[cx+ox,cy-260];let x=cx+ox,y=cy-260;while(y<cy-20){y+=24+rnd()*20;x+=(rnd()-.5)*34;pts.push(x,Math.min(y,cy-18));}return {pts,d:j*.12};});
      fx.screenFlash(0xe8f4ff,.35,160);
      return fx.run(560+n*80,(g,t)=>{for(const b of bolts){const q=(t-b.d)/.55;if(q<0||q>1)continue;const a=q<.5?1:1-(q-.5)/.5,fl=Math.floor(q*12)%2?1:.55;g.moveTo(b.pts[0]!,b.pts[1]!);for(let i=2;i<b.pts.length;i+=2)g.lineTo(b.pts[i]!,b.pts[i+1]!);g.stroke({color:l.c,width:11*s,alpha:a*.45*fl});
        g.moveTo(b.pts[0]!,b.pts[1]!);for(let i=2;i<b.pts.length;i+=2)g.lineTo(b.pts[i]!,b.pts[i+1]!);g.stroke({color:0xffffff,width:4*s,alpha:a*fl});}});}
    case 'arcs':{const n=l.n??5;return fx.run(600,(g,t)=>{const a=1-t;for(let i=0;i<n;i++){const q0=i/n*TAU+t*6,r=26*s;let x=cx+Math.cos(q0)*r,y=cy-24+Math.sin(q0)*r*.6;g.moveTo(x,y);for(let k=1;k<=5;k++){const q=q0+k*.5;x=cx+Math.cos(q)*r*(1+(rnd()-.5)*.4);y=cy-24+Math.sin(q)*r*.6+(rnd()-.5)*8;g.lineTo(x,y);}g.stroke({color:l.c,width:2.5,alpha:a});}g.circle(cx,cy-24,10*s*(1-t)).fill({color:0xffffff,alpha:.6*a});});}
    case 'spikes':{const n=l.n??8,sp=Array.from({length:n},(_,i)=>{const q=i/n*TAU+.2;return {x:cx+Math.cos(q)*30*s,y:cy+6+Math.sin(q)*13*s,h:(30+rnd()*28)*s,w:(8+rnd()*5)*s,d:i*.035};}).sort((a,b)=>a.y-b.y);
      return fx.run(950,(g,t)=>{const a=t<.72?1:1-(t-.72)/.28;for(const k of sp){const up=Math.max(0,Math.min(1,(t-k.d)*5));if(!up)continue;const h=k.h*up;g.poly([k.x-k.w,k.y,k.x,k.y-h,k.x+k.w*.15,k.y+2]).fill({color:l.c,alpha:a});g.poly([k.x+k.w*.15,k.y+2,k.x,k.y-h,k.x+k.w,k.y]).fill({color:l.c2,alpha:a});}},'normal',999);}
    case 'rocks':{const n=l.n??5,rs=Array.from({length:n},(_,i)=>({ox:(rnd()-.5)*60*s,r:(6+rnd()*7)*s,d:i*.09}));void fx.particles({x:cx,y:cy},14,{speed:80,up:60,gravity:300,life:800,size:[2,4],colors:[l.c,0xc8b898]},'normal');
      return fx.run(900,(g,t)=>{for(const k of rs){const q=Math.min(1,Math.max(0,(t-k.d)/.4));if(q<=0)continue;const y=cy-200+q*q*196,a=q<1?1:Math.max(0,1-(t-k.d-.4)*3);g.circle(cx+k.ox,y-k.r,k.r).fill({color:l.c,alpha:a}).stroke({color:0x2a2016,width:1.5,alpha:a});g.circle(cx+k.ox-k.r*.3,y-k.r*1.3,k.r*.35).fill({color:0xe8dcc0,alpha:a*.6});}},'normal',999);}
    case 'rain':{const n=l.n??14,tilt=l.tilt??.35,len=(l.len??18)*s,rs=Array.from({length:n},()=>({ox:(rnd()-.5)*90*s,oy:(rnd()-.5)*30*s,d:rnd()*.4}));
      return fx.run(850,(g,t)=>{for(const k of rs){const q=Math.min(1,Math.max(0,(t-k.d)/.35));if(q<=0||q>=1)continue;const y=cy-160+q*150+k.oy,x=cx+k.ox-(1-q)*60*tilt;g.moveTo(x-len*tilt,y-len).lineTo(x,y).stroke({color:l.c,width:2.5,alpha:.9});g.circle(x,y,2).fill({color:0xffffff,alpha:.9});}});}
    case 'swirl':{const n=l.n??7,R=(l.s??1)*s;return fx.run(900,(g,t)=>{const a=fadeIO(t);for(let i=0;i<n;i++){const y=cy-8-i*13*R,r=(12+i*6)*R*(.85+Math.sin(t*10+i)*.1),rot=t*14+i*.7;g.ellipse(cx+Math.sin(t*8+i)*4,y,r,r*.32).stroke({color:i%2?0xffffff:l.c,width:3,alpha:a*.85});g.circle(cx+Math.cos(rot)*r,y+Math.sin(rot)*r*.32,2.5).fill({color:l.c,alpha:a});}});}
    case 'streaks':{const n=l.n??8;return fx.run(500,(g,t)=>{const a=1-t;for(let i=0;i<n;i++){if(l.radial){const q=i/n*TAU,r1=10+t*20,r2=30+t*60;g.moveTo(cx+Math.cos(q)*r1*s,cy-24+Math.sin(q)*r1*s*.7).lineTo(cx+Math.cos(q)*r2*s,cy-24+Math.sin(q)*r2*s*.7).stroke({color:l.c,width:3*a,alpha:a});}
      else{const y=cy-50+i*(60/n),x0=cx-60*s+t*90*s;g.moveTo(x0-30*s,y).lineTo(x0+20*s,y).stroke({color:l.c,width:2.5,alpha:a*.9});}}});}
    case 'slash':{const n=l.n??1,R=(l.s??1)*s;return fx.run(320+n*70,(g,t)=>{for(let i=0;i<n;i++){const q=Math.max(0,Math.min(1,(t-i*.12)*2.4));if(q<=0)continue;const a=1-Math.max(0,t-i*.12),dir=-.6+i*1.9,r=(32+i*4)*R;g.arc(cx,cy-26,r,dir,dir+2.6*q).stroke({color:0xffffff,width:8*a,alpha:a});g.arc(cx,cy-26,r*.8,dir+.2,dir+2.6*q).stroke({color:l.c,width:4*a,alpha:a*.85});}});}
    case 'glyph':return fx.run(900,(g,t)=>{const a=fadeIO(t,.12,.6),k=t<.15?.4+t/.15*.8:1.2-Math.min(.2,(t-.15));const r=22*(l.s??1)*s*k;g.circle(cx,cy-60,r).fill({color:l.c,alpha:.25*a}).stroke({color:l.c,width:3,alpha:a});drawGlyph(g,l.t,cx,cy-60,r*.62,l.c,a);});
    case 'petals':{const n=l.n??14,ps=Array.from({length:n},()=>({ox:(rnd()-.5)*80*s,d:rnd()*.4,sp:.6+rnd()*.8,ph:rnd()*TAU}));return fx.run(1100,(g,t)=>{for(const k of ps){const q=Math.max(0,Math.min(1,(t-k.d)/.6));if(q<=0||q>=1)continue;const x=cx+k.ox+Math.sin(q*6+k.ph)*12,y=cy-110+q*100*k.sp;g.ellipse(x,y,4,2.2).fill({color:(k.ph>Math.PI?l.c:l.c2),alpha:1-q*.6});}},'normal',999);}
    case 'cloud':{const R=(l.s??1)*s,blobs=Array.from({length:7},()=>({ox:(rnd()-.5)*50,oy:(rnd()-.5)*20,r:12+rnd()*12}));return fx.run(1100,(g,t)=>{const a=fadeIO(t,.2,.6);for(const b of blobs)g.circle(cx+b.ox*R*(1+t*.4),cy-26+b.oy*R-t*14,b.r*R*(1+t*.5)).fill({color:l.c,alpha:.35*a});},'normal',997);}
    case 'bars':{const n=l.n??5;return fx.run(950,(g,t)=>{const a=t<.75?1:1-(t-.75)/.25,k=Math.min(1,t*4);for(let i=0;i<n;i++){const x=cx+(i-(n-1)/2)*12*s;g.rect(x-2.5,cy-90*s+90*s*(1-k)-6,5,70*s).fill({color:l.c,alpha:a}).stroke({color:0x2a1a08,width:1,alpha:a});}g.rect(cx-(n/2)*12*s,cy-24*s-90*s*(1-k)-26,n*12*s,5).fill({color:l.c,alpha:a});},'normal',999);}
    case 'pillars':{const n=l.n??8;return fx.run(1000,(g,t)=>{const a=t<.75?1:1-(t-.75)/.25,k=Math.min(1,t*3);const ps=Array.from({length:n},(_,i)=>{const q=i/n*TAU;return {x:cx+Math.cos(q)*40*s,y:cy+6+Math.sin(q)*17*s};}).sort((a2,b)=>a2.y-b.y);for(const c of ps){const h=34*s*k;g.rect(c.x-6*s,c.y-h,12*s,h).fill({color:l.c,alpha:a}).stroke({color:0x2a2a20,width:1.4,alpha:a});g.ellipse(c.x,c.y-h,6*s,2.5*s).fill({color:0xe8e8d8,alpha:a});}},'normal',999);}
    case 'wave':{const R=(l.s??1)*s;return fx.run(850,(g,t)=>{const a=1-Math.max(0,t-.5)*2,x=cx-80*R+t*160*R,h=(26+Math.sin(t*Math.PI)*24)*R;g.moveTo(x-40*R,cy+8).quadraticCurveTo(x-10*R,cy-h,x+16*R,cy-h*.7).quadraticCurveTo(x+6*R,cy-h*.25,x+30*R,cy+8).fill({color:l.c,alpha:.6*a});g.moveTo(x-10*R,cy-h).quadraticCurveTo(x+10*R,cy-h*1.05,x+16*R,cy-h*.7).stroke({color:0xffffff,width:3,alpha:a});});}
    case 'orbs':{const n=l.n??5;return fx.run(1000,(g,t)=>{const a=fadeIO(t);for(let i=0;i<n;i++){const q=i/n*TAU+t*5,r=28*s*(1-t*.5);g.circle(cx+Math.cos(q)*r,cy-30+Math.sin(q)*r*.4-t*20,5*s).fill({color:l.c,alpha:a}).stroke({color:0xffffff,width:1.5,alpha:a});}});}
    case 'cross':{const R=(l.s??1)*s;return fx.run(500,(g,t)=>{const a=1-t,L=(30+50*t)*R;g.moveTo(cx-L,cy-26).lineTo(cx+L,cy-26).stroke({color:l.c,width:7*a,alpha:a});g.moveTo(cx,cy-26-L*.8).lineTo(cx,cy-26+L*.6).stroke({color:l.c,width:7*a,alpha:a});g.star(cx,cy-26,4,16*a*R,4).fill({color:0xffffff,alpha:a});});}
    case 'shards':{const n=l.n??10,sh=Array.from({length:n},()=>({q:rnd()*TAU,v:50+rnd()*70,r:rnd()*TAU}));return fx.run(700,(g,t)=>{const a=1-t;for(const k of sh){const x=cx+Math.cos(k.q)*k.v*t*s,y=cy-26+Math.sin(k.q)*k.v*t*s*.7+60*t*t;g.poly([x,y-5,x+4,y+2,x-3,y+4]).fill({color:l.c,alpha:a}).stroke({color:0xffffff,width:1,alpha:a});}});}
    case 'flash':fx.screenFlash(l.c,l.a??.3,240);return;
  }
}
/** 글자 대신 쓰는 단순한 문양(한자 표기는 쓰지 않는다). */
function drawGlyph(g:Graphics,t:string,x:number,y:number,r:number,c:number,a:number){
  const st={color:0xffffff,width:Math.max(2,r*.22),alpha:a};
  switch(t){
    case 'x':g.moveTo(x-r,y-r).lineTo(x+r,y+r).moveTo(x+r,y-r).lineTo(x-r,y+r).stroke(st);break;
    case '?':g.arc(x,y-r*.35,r*.55,Math.PI*1.1,Math.PI*2.35).lineTo(x,y+r*.35).stroke(st);g.circle(x,y+r*.85,r*.14).fill({color:0xffffff,alpha:a});break;
    case 'eye':g.moveTo(x-r,y).quadraticCurveTo(x,y-r*.9,x+r,y).quadraticCurveTo(x,y+r*.9,x-r,y).stroke(st);g.circle(x,y,r*.35).fill({color:c,alpha:a});break;
    case 'heart':g.moveTo(x,y+r*.8).bezierCurveTo(x-r*1.4,y-r*.2,x-r*.5,y-r*1.2,x,y-r*.4).bezierCurveTo(x+r*.5,y-r*1.2,x+r*1.4,y-r*.2,x,y+r*.8).fill({color:0xffffff,alpha:a});break;
    case 'down':for(const o of [-.5,.5])g.moveTo(x+o*r,y-r).lineTo(x+o*r,y+r*.6).moveTo(x+o*r-r*.35,y+r*.2).lineTo(x+o*r,y+r*.7).lineTo(x+o*r+r*.35,y+r*.2).stroke(st);break;
    case 'up':for(const o of [-.5,.5])g.moveTo(x+o*r,y+r).lineTo(x+o*r,y-r*.6).moveTo(x+o*r-r*.35,y-r*.2).lineTo(x+o*r,y-r*.7).lineTo(x+o*r+r*.35,y-r*.2).stroke(st);break;
    case 'note':g.circle(x-r*.3,y+r*.5,r*.32).fill({color:0xffffff,alpha:a});g.moveTo(x,y+r*.5).lineTo(x,y-r*.8).lineTo(x+r*.6,y-r*.5).stroke(st);break;
    case 'seal':g.rect(x-r*.75,y-r*.75,r*1.5,r*1.5).stroke(st);g.moveTo(x-r*.4,y).lineTo(x+r*.4,y).moveTo(x,y-r*.4).lineTo(x,y+r*.4).stroke(st);break;
    case 'skull':g.circle(x,y-r*.15,r*.7).stroke(st);g.circle(x-r*.28,y-r*.15,r*.16).fill({color:0xffffff,alpha:a});g.circle(x+r*.28,y-r*.15,r*.16).fill({color:0xffffff,alpha:a});g.moveTo(x-r*.3,y+r*.7).lineTo(x+r*.3,y+r*.7).stroke(st);break;
    case 'clock':g.circle(x,y,r*.85).stroke(st);g.moveTo(x,y).lineTo(x,y-r*.6).moveTo(x,y).lineTo(x-r*.45,y+r*.1).stroke(st);break;
    case 'drum':g.ellipse(x,y-r*.4,r*.8,r*.3).stroke(st);g.moveTo(x-r*.8,y-r*.4).lineTo(x-r*.8,y+r*.5).moveTo(x+r*.8,y-r*.4).lineTo(x+r*.8,y+r*.5).stroke(st);g.ellipse(x,y+r*.5,r*.8,r*.3).stroke(st);break;
    case 'flag':g.moveTo(x-r*.6,y+r).lineTo(x-r*.6,y-r).stroke(st);g.poly([x-r*.6,y-r,x+r*.8,y-r*.6,x-r*.6,y-r*.1]).fill({color:0xffffff,alpha:a});break;
    case 'coin':g.circle(x,y,r*.8).stroke(st);g.rect(x-r*.22,y-r*.22,r*.44,r*.44).stroke(st);break;
    case 'star':g.star(x,y,5,r*.95,r*.42).fill({color:0xffffff,alpha:a});break;
    case 'bell':g.moveTo(x-r*.7,y+r*.5).quadraticCurveTo(x-r*.6,y-r*.9,x,y-r*.9).quadraticCurveTo(x+r*.6,y-r*.9,x+r*.7,y+r*.5).closePath().stroke(st);g.circle(x,y+r*.75,r*.15).fill({color:0xffffff,alpha:a});break;
    case 'sword':g.moveTo(x,y-r).lineTo(x,y+r*.6).moveTo(x-r*.45,y+r*.3).lineTo(x+r*.45,y+r*.3).stroke(st);break;
    default:g.circle(x,y,r*.5).stroke(st);
  }
}

/** 기본→숙련→극의로 넓어지는 지면진·궤도광·중앙 광주. 첨부 레퍼런스의 큰 원형 에너지장을 저채도 반투명으로 재해석했다. */
function evolutionAura(fx:BattleFx,color:number,p:P,big:number,tier:1|2|3){
  const e=STRATEGY_EVOLUTION_FX[tier],cx=p.x,cy=p.y+5,R=(28+tier*10)*big;
  if(e.flash)fx.screenFlash(color,e.flash,180);
  if(e.motes)void fx.particles({x:cx,y:cy-16},e.motes,{speed:55+tier*18,up:45+tier*18,gravity:-35,life:650+tier*120,size:[1.5,3.5],colors:[color,0xffffff]},'normal');
  return fx.run(700+tier*120,(g,t)=>{
    const a=fadeIO(t,.12,.68),grow=.7+Math.min(1,t*3)*.3;
    for(let i=0;i<e.rings;i++){
      const q=Math.max(0,t-i*.08),r=R*grow*(1+i*.22+q*.12);
      g.ellipse(cx,cy,r,r*.42).stroke({color:i?0xffffff:color,width:Math.max(1.2,(3.6-i*.7)*big),alpha:a*(i?.28:.62)});
    }
    for(let i=0;i<e.arcs;i++){
      const angle=t*(tier===3?3.6:2.4)+(i/e.arcs)*TAU,r=R*(.72+(i%2)*.18),x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r*.42;
      g.circle(x,y,(2.2+tier*.45)*big).fill({color:i%2?0xffffff:color,alpha:a*.8});
      g.arc(cx,cy,r,angle-.55,angle+.12).stroke({color,width:1.5*big,alpha:a*.42});
    }
    if(tier>=2){for(let i=0;i<8;i++){const q=i/8*TAU,r1=R*.78,r2=R*(tier===3?1.12:.98);g.moveTo(cx+Math.cos(q)*r1,cy+Math.sin(q)*r1*.42).lineTo(cx+Math.cos(q)*r2,cy+Math.sin(q)*r2*.42).stroke({color,width:1.5*big,alpha:a*.34});}}
    if(e.column){const h=100*big*Math.min(1,t*4),w=14*big;g.roundRect(cx-w,cy-h,w*2,h,w).fill({color,alpha:a*.16});g.roundRect(cx-w*.28,cy-h,w*.56,h,w*.3).fill({color:0xffffff,alpha:a*.28});}
    g.circle(cx,cy-17,(4+tier*2)*big*(1+.2*Math.sin(t*18))).fill({color:0xffffff,alpha:a*(tier===3?.7:.42)});
  },'normal',998);
}

/** 맞는 자리에 그 책략의 고유 효과와 진화 단계 효과를 함께 띄운다. */
export function playImpact(fx:BattleFx,spec:StratFx,p:P,big=1,tier:0|1|2|3=0){
  const e=STRATEGY_EVOLUTION_FX[tier];
  if(tier)void evolutionAura(fx,spec.color,p,big,tier);
  for(const l of spec.layers)void layer(fx,l,p,big*e.scale);
}

/** 시전자 → 표적 사이를 오가는 모양(매 틀 그린다). q: 0→1, g는 이번 틀에 이미 비워진 그래픽. */
export function drawTravel(g:Graphics,spec:StratFx,from:P,to:P,q:number){
  const c=spec.color,dx=to.x-from.x,dy=to.y-from.y,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len,lerp=(k:number,arc=22)=>({x:from.x+dx*k,y:from.y+dy*k-20-Math.sin(k*Math.PI)*arc});
  switch(spec.travel){
    case 'orb':{const p=lerp(q);for(let i=1;i<=4;i++){const b=lerp(Math.max(0,q-i*.05));g.circle(b.x,b.y,7-i*1.3).fill({color:c,alpha:.5-i*.1});}g.circle(p.x,p.y,8).fill({color:c,alpha:.85}).stroke({color:0xffffff,width:2});break;}
    case 'ember':for(let i=0;i<3;i++){const p=lerp(Math.max(0,q-i*.07),30+i*8);g.circle(p.x,p.y,4).fill({color:i?0xffd060:c,alpha:.9});}break;
    case 'arrow':{const p=lerp(q,30),b=lerp(Math.max(0,q-.06),30);g.moveTo(b.x,b.y).lineTo(p.x,p.y).stroke({color:c,width:2.5});g.circle(p.x,p.y,2.5).fill(0xffffff);break;}
    case 'volley':for(let i=0;i<5;i++){const k=Math.max(0,q-i*.04),p=lerp(k,60),b=lerp(Math.max(0,k-.05),60),o=(i-2)*5;g.moveTo(b.x+o,b.y).lineTo(p.x+o,p.y).stroke({color:c,width:2});}break;
    case 'sky':g.ellipse(to.x,to.y+6,10+q*24,4+q*9).fill({color:c,alpha:.25*q});g.moveTo(to.x,to.y-220).lineTo(to.x,to.y-220+q*40).stroke({color:c,width:2,alpha:.6*q});break;
    case 'ground':{const n=Math.floor(q*10);for(let i=0;i<n;i++){const k=i/10,x=from.x+dx*k+(i%2?4:-4),y=from.y+dy*k+6;g.moveTo(x,y).lineTo(from.x+dx*(k+.1),from.y+dy*(k+.1)+6).stroke({color:c,width:3,alpha:.8});}g.circle(from.x+dx*q,from.y+dy*q+4,5).fill({color:c,alpha:.7});break;}
    case 'wave':{const x=from.x+dx*q,y=from.y+dy*q;g.moveTo(x-14,y+8).quadraticCurveTo(x,y-20,x+14,y+8).fill({color:c,alpha:.65}).stroke({color:0xffffff,width:2,alpha:.8});break;}
    case 'beam':{const L=q;g.moveTo(from.x,from.y-24).lineTo(from.x+dx*L,from.y+dy*L-24).stroke({color:c,width:6,alpha:.45});g.moveTo(from.x,from.y-24).lineTo(from.x+dx*L,from.y+dy*L-24).stroke({color:0xffffff,width:2});break;}
    case 'zigzag':{g.moveTo(from.x,from.y-24);for(let i=1;i<=8;i++){const k=Math.min(q,i/8);g.lineTo(from.x+dx*k+(i%2?-uy:uy)*8,from.y+dy*k-24+(i%2?ux:-ux)*8);}g.stroke({color:c,width:3});break;}
    case 'rise':for(let i=0;i<6;i++){const k=Math.max(0,Math.min(1,q-i*.04)),p=lerp(k,50);g.circle(p.x+Math.sin(k*12+i)*5,p.y-i*2,2.5).fill({color:i%2?0xffffff:c,alpha:.9});}break;
    case 'spear':{const p=lerp(q,36),a=Math.atan2(dy-Math.cos(q*Math.PI)*36*Math.PI,dx);g.moveTo(p.x-Math.cos(a)*16,p.y-Math.sin(a)*16).lineTo(p.x+Math.cos(a)*6,p.y+Math.sin(a)*6).stroke({color:0x8a6a40,width:3});g.circle(p.x+Math.cos(a)*6,p.y+Math.sin(a)*6,2.5).fill(c);break;}
    case 'shell':{const p=lerp(q,70);for(let i=1;i<=4;i++){const b=lerp(Math.max(0,q-i*.06),70);g.circle(b.x,b.y,5-i).fill({color:0x8a8078,alpha:.5-i*.1});}g.circle(p.x,p.y,6).fill(0x3a3430).stroke({color:c,width:2});break;}
    case 'talisman':{const p=lerp(q,26),w=Math.cos(q*20)*6;g.rect(p.x-w/2-1,p.y-8,Math.abs(w)+2,16).fill({color:0xf0e0b0}).stroke({color:c,width:1.5});break;}
    case 'leaf':for(let i=0;i<5;i++){const k=Math.max(0,q-i*.05),p=lerp(k,30);g.ellipse(p.x+Math.cos(k*14+i)*10,p.y+Math.sin(k*14+i)*6,3.5,1.8).fill({color:i%2?c:0xffffff,alpha:.9});}break;
    case 'none':break;
  }
}

// ───────────────────────────────────── 책략마다의 연출표

const L=<T extends Layer>(l:T)=>l;
const F=(cast:Cast,travel:Travel,color:number,layers:Layer[],shake?:number):StratFx=>({cast,travel,color,layers,...(shake?{shake}:{})});
const fl=(c:number,c2:number,n?:number,h?:number)=>L({k:'flames',c,c2,...(n?{n}:{}),...(h?{h}:{})});
const bu=(c:number,c2:number,n?:number,o:{up?:number;fall?:boolean}={})=>L({k:'burst',c,c2,...(n?{n}:{}),...o});
const ri=(c:number,n?:number,s?:number)=>L({k:'ring',c,...(n?{n}:{}),...(s?{s}:{})});
const gl=(c:number,t:string,s?:number)=>L({k:'glyph',c,t,...(s?{s}:{})});

export const STRATEGY_FX:Record<string,StratFx>={
  // ── 불
  fire:F('cast','orb',0xff7a2a,[fl(0xff8a2a,0xffb040),bu(0xffd060,0xff5a1a)]),
  embers:F('cast','ember',0xffb040,[bu(0xffd060,0xff8a2a,18,{up:110}),ri(0xffa040,1,.6)]),
  fireWall:F('cast','ground',0xff5a1a,[fl(0xff5a1a,0xffa030,11,46),{k:'streaks',c:0xffb060,n:6}]),
  bowangFire:F('cast','volley',0xff9a30,[{k:'rain',c:0xff9a30,n:16,tilt:.5},fl(0xff7a2a,0xffc060,5,50)]),
  fireShips:F('cast','wave',0xff6a20,[{k:'wave',c:0x2a70c0,s:.9},fl(0xff6a20,0xffb040,6,60),{k:'cloud',c:0x3a2a20}]),
  burnCamp:F('cast','orb',0xe04a10,[fl(0xe04a10,0xff8a2a,9,80),{k:'cloud',c:0x2a2018,s:1.3},bu(0xffb040,0xff4a10,30)],4),
  inferno:F('raise','sky',0xff3a10,[{k:'flash',c:0xff6a20,a:.35},{k:'column',c:0xff4a10,w:26,h:140},fl(0xff3a10,0xffd060,9,90),ri(0xff6a20,3,1.3)],6),
  chainFire:F('cast','beam',0xffa020,[fl(0xffa020,0xff6a10,5,56),{k:'arcs',c:0xffb040,n:4},bu(0xffd060,0xffa020,16)]),
  skyFire:F('raise','sky',0xff4a00,[{k:'rocks',c:0xff5a10,n:6},fl(0xff4a00,0xffc040,7,64),{k:'flash',c:0xff8a30,a:.25}],5),
  // ── 물
  flood:F('cast','wave',0x4aa0e0,[{k:'column',c:0x4aa0e0,w:14,h:90},ri(0xbfe8ff,3),bu(0xbfe8ff,0x6ab8ff,24,{up:140})]),
  mire:F('cast','ground',0x8a6a3a,[{k:'cloud',c:0x6a5030,s:.8},ri(0x8a6a3a,2,.8),bu(0xa08050,0x6a5030,14,{fall:true})]),
  waterSurge:F('cast','wave',0x3a90e0,[{k:'wave',c:0x3a90e0,s:1.1},bu(0xd8f2ff,0x3a90e0,20,{fall:true})]),
  riverDam:F('raise','wave',0x5ab0f0,[{k:'wave',c:0x5ab0f0,s:1.4},{k:'shards',c:0x8a6a40,n:8},ri(0xbfe8ff,2,1.2)],4),
  tidalLine:F('cast','beam',0x2a80d0,[{k:'wave',c:0x2a80d0},{k:'streaks',c:0xbfe8ff,n:7}]),
  deluge:F('raise','sky',0x6ac0ff,[{k:'swirl',c:0x6ac0ff,n:9,s:1.1},{k:'rain',c:0xbfe8ff,n:18,tilt:.1},{k:'column',c:0x4aa0e0,w:12,h:120}]),
  sevenArmies:F('raise','wave',0x2a70c0,[{k:'swirl',c:0x2a70c0,n:5,s:1.5},ri(0x6ab8ff,4,1.4),{k:'wave',c:0x2a70c0,s:1.6}],5),
  weiRiver:F('cast','wave',0x3a7ab0,[{k:'wave',c:0x3a7ab0,s:1.2},{k:'rain',c:0xd8f2ff,n:10,tilt:-.6,len:12}]),
  // ── 바람
  windDragon:F('cast','leaf',0x8fdf9a,[{k:'swirl',c:0x8fdf9a},{k:'petals',c:0x8fcf6a,c2:0xc9e89a,n:12}]),
  gust:F('cast','none',0xd8f0e0,[{k:'streaks',c:0xd8f0e0,n:9},bu(0xffffff,0xc9e89a,12)]),
  gale:F('cast','beam',0xbfeccf,[{k:'slash',c:0xbfeccf,n:3,s:1.1},{k:'streaks',c:0xffffff,n:5}]),
  whirlwind:F('cast','leaf',0x9fe0b0,[{k:'swirl',c:0x9fe0b0,n:9,s:.8},{k:'swirl',c:0xe8fff0,n:4,s:1.3}]),
  tempest:F('raise','sky',0x7ab0a0,[{k:'swirl',c:0x7ab0a0,n:8,s:1.3},{k:'rain',c:0xbfe8ff,n:20,tilt:.8},{k:'cloud',c:0x4a5a5a,s:1.4}],3),
  eastWind:F('raise','leaf',0xe8c070,[{k:'petals',c:0xe8c070,c2:0x8fcf6a,n:22},{k:'streaks',c:0xffe8b0,n:10},{k:'flash',c:0xffe0a0,a:.18}]),
  // ── 번개
  spark:F('cast','zigzag',0xfff06a,[{k:'arcs',c:0xfff06a,n:4},bu(0xfff6a0,0xffffff,10)]),
  thunder:F('raise','sky',0xfff6a0,[{k:'bolt',c:0x9fd8ff},ri(0xfff6a0,1)],7),
  lightningNet:F('cast','zigzag',0x9fd8ff,[{k:'arcs',c:0x9fd8ff,n:8},{k:'bars',c:0x9fd8ff,n:4}]),
  thunderStorm:F('raise','sky',0xc0e0ff,[{k:'bolt',c:0xc0e0ff,n:3},{k:'rain',c:0x9fd8ff,n:14,tilt:.2},{k:'cloud',c:0x3a4060,s:1.3}],7),
  thunderCross:F('cast','ground',0xffe04a,[{k:'cross',c:0xffe04a,s:1.2},{k:'arcs',c:0xffe04a,n:5},ri(0xffe04a,2)],5),
  thunderbolt:F('raise','sky',0xffffff,[{k:'bolt',c:0xfff6a0,n:2},{k:'column',c:0xd8f2ff,w:22,h:200},{k:'flash',c:0xffffff,a:.5}],9),
  // ── 땅
  earthPulse:F('cast','ground',0xc8a868,[ri(0xc8a868,4,.8),bu(0xc8a868,0x8a7a60,10,{fall:true})]),
  feintAttack:F('cast','none',0xd8c090,[{k:'cloud',c:0xc8b080,s:.9},{k:'streaks',c:0xd8c090,n:6,radial:true}]),
  bind:F('cast','ground',0x6a9a3a,[{k:'bars',c:0x5a8a2a,n:6},{k:'petals',c:0x6a9a3a,c2:0x9aca5a,n:8}]),
  ambush:F('cast','none',0xb08a5a,[{k:'spikes',c:0xb0a080,c2:0x6a5a44,n:5},gl(0xb08a5a,'!')]),
  breakArmor:F('cast','talisman',0xc0c8d0,[{k:'shards',c:0xc0c8d0,n:14},gl(0xc0c8d0,'x',.8)]),
  poison:F('cast','orb',0x7ad04a,[{k:'cloud',c:0x5aa02a},bu(0x9aff6a,0x5aa02a,16,{up:40}),gl(0x5aa02a,'skull',.8)]),
  rockfall:F('raise','sky',0x9a8a70,[{k:'rocks',c:0x9a8a70,n:6},ri(0xc8b898,1)],5),
  plague:F('cast','leaf',0x9a6ab0,[{k:'cloud',c:0x6a4a80,s:1.3},bu(0xb08ad0,0x6aa04a,20,{up:30})]),
  encircle:F('cast','none',0xc0a070,[{k:'spikes',c:0xd0c090,c2:0x7a6040,n:12},ri(0xc0a070,1,1.4)]),
  rockAmbush:F('cast','ground',0x8a7a60,[{k:'rocks',c:0x8a7a60,n:4},{k:'spikes',c:0xa09070,c2:0x5e4c38,n:4}],4),
  sandstorm:F('raise','none',0xd8b878,[{k:'swirl',c:0xd8b878,n:6,s:1.2},{k:'streaks',c:0xe8d098,n:12},{k:'flash',c:0xc8a060,a:.22}],3),
  quake:F('raise','ground',0xa08a60,[ri(0xa08a60,5,1.3),{k:'shards',c:0x8a7a60,n:12}],9),
  shatter:F('cast','ground',0xb39d78,[{k:'spikes',c:0xb39d78,c2:0x5e4c38},bu(0x8a7a60,0x6a5a44,18,{fall:true})],5),
  lockedGates:F('raise','none',0xe8c040,[{k:'bars',c:0xe8c040,n:8},{k:'pillars',c:0xc8a040,n:8}]),
  tenAmbush:F('raise','none',0xd0a060,[{k:'spikes',c:0xd0c090,c2:0x6a5a44,n:14},{k:'streaks',c:0xd0a060,n:10,radial:true},gl(0xd0a060,'!',1.2)],6),
  // ── 술법(마음)
  hex:F('cast','talisman',0x8a3ab0,[{k:'cloud',c:0x4a1a6a},gl(0x8a3ab0,'skull')]),
  edict:F('raise','talisman',0xffd040,[gl(0xffd040,'seal',1.2),ri(0xffd040,1)]),
  weakenCurse:F('cast','orb',0x9a5ac0,[gl(0x9a5ac0,'down'),bu(0xb08ad0,0x6a3a8a,12,{fall:true})]),
  confuse:F('cast','talisman',0xffe080,[gl(0xffe080,'?'),{k:'orbs',c:0xffe080,n:4}]),
  silence:F('cast','talisman',0xd04040,[gl(0xd04040,'x'),ri(0xd04040,2,.7)]),
  rumor:F('cast','leaf',0xf0e0b0,[{k:'petals',c:0xf0e0b0,c2:0xd0c090,n:16},gl(0xc0a060,'?',.8)]),
  terror:F('raise','none',0xa02020,[ri(0xa02020,4,1.2),gl(0xa02020,'skull',1.1),{k:'flash',c:0x601010,a:.2}],3),
  counterSpy:F('cast','talisman',0x40a0a0,[gl(0x40a0a0,'eye'),{k:'streaks',c:0x40a0a0,n:6,radial:true}]),
  imperialAura:F('raise','rise',0xffd860,[{k:'column',c:0xffd860,w:28,h:160},{k:'streaks',c:0xffe8a0,n:12,radial:true},gl(0xffd860,'down',.9)]),
  feint:F('cast','none',0xa0c0ff,[{k:'orbs',c:0xa0c0ff,n:3},gl(0xa0c0ff,'?',.9),{k:'cloud',c:0x8090c0,s:.7}]),
  hongmen:F('cast','talisman',0xd02a2a,[{k:'slash',c:0xd02a2a,n:2,s:.8},gl(0xd02a2a,'sword'),gl(0xffd040,'seal',.7)]),
  beautyTrap:F('cast','leaf',0xff8ac0,[{k:'petals',c:0xff8ac0,c2:0xffd0e0,n:18},gl(0xff8ac0,'heart')]),
  demoralize:F('cast','talisman',0xc080c0,[ri(0xc080c0,2),{k:'shards',c:0xc080c0,n:8},gl(0xc080c0,'?')]),
  lureTiger:F('cast','none',0xe0a040,[{k:'slash',c:0xe0a040,n:3,s:.7},gl(0xe0a040,'eye',.9)]),
  nightmare:F('raise','none',0x4a2a6a,[{k:'cloud',c:0x1a0a2a,s:1.5},gl(0x8a5ac0,'eye',1.1),{k:'orbs',c:0x6a3a9a,n:6}]),
  selfInjury:F('cast','none',0xc04030,[{k:'slash',c:0xc04030,n:2},bu(0xff6a5a,0x8a2a20,12,{fall:true})]),
  charmDance:F('cast','leaf',0xff6ab0,[{k:'swirl',c:0xff6ab0,n:5,s:.9},{k:'petals',c:0xff6ab0,c2:0xffffff,n:14},gl(0xff6ab0,'heart',.8)]),
  borrowKnife:F('cast','talisman',0xb0b0c0,[{k:'rain',c:0xd0d0e0,n:6,tilt:-.8,len:26},{k:'slash',c:0xb0b0c0}]),
  fourSongs:F('raise','none',0xc0a0ff,[gl(0xc0a0ff,'note'),{k:'orbs',c:0xc0a0ff,n:4},ri(0xc0a0ff,2,1.2)]),
  grandFeint:F('cast','none',0xe0d0a0,[{k:'bars',c:0xa08060,n:7},gl(0xe0d0a0,'note',.9)]),
  chaos:F('raise','none',0xb060ff,[{k:'swirl',c:0xb060ff,n:9,s:1.2},gl(0xb060ff,'?',1.2),{k:'flash',c:0x8040c0,a:.2}],3),
  stoneMaze:F('raise','none',0xa0a090,[{k:'pillars',c:0xa0a090,n:8},{k:'cloud',c:0x8a8a80,s:1.1}]),
  // ── 고무·지원
  rewind:F('raise','rise',0x80e0ff,[gl(0x80e0ff,'clock',1.1),{k:'swirl',c:0x80e0ff,n:4,s:.8}]),
  banner:F('raise','rise',0xe04040,[gl(0xe04040,'flag'),ri(0xe04040,1)]),
  fortify:F('raise','rise',0x6ab8ff,[{k:'dome',c:0x6ab8ff}]),
  ironBody:F('raise','rise',0xffd040,[{k:'column',c:0xffd040,w:16,h:70},{k:'streaks',c:0xffd040,n:10,radial:true}]),
  ironWall:F('raise','rise',0x9aa0a8,[{k:'pillars',c:0x9aa0a8,n:6},{k:'dome',c:0xc0c8d0,s:1.2}]),
  march:F('raise','rise',0x9aff9a,[{k:'streaks',c:0x9aff9a,n:7},gl(0x9aff9a,'up',.8)]),
  decree:F('raise','rise',0xffe0a0,[gl(0xffe0a0,'seal'),{k:'streaks',c:0xffe0a0,n:8},ri(0xffe0a0,2,1.2)]),
  swiftWind:F('raise','leaf',0xc0ffe0,[{k:'petals',c:0xc0ffe0,c2:0xffffff,n:12},{k:'streaks',c:0xc0ffe0,n:5}]),
  secretPath:F('raise','rise',0x6070a0,[{k:'cloud',c:0x30384a,s:.9},{k:'streaks',c:0x8090c0,n:6}]),
  woodenOx:F('raise','rise',0xc09060,[gl(0xc09060,'coin'),bu(0xe0c090,0xc09060,12)]),
  swordDance:F('spin','rise',0xd0e0ff,[{k:'slash',c:0xd0e0ff,n:4,s:.8},gl(0xd0e0ff,'sword',.8)]),
  warCry:F('roar','rise',0xff8040,[ri(0xff8040,4,1.1),gl(0xff8040,'!')]),
  inspire:F('raise','rise',0xffc040,[gl(0xffc040,'up'),bu(0xffe080,0xffc040,14)]),
  spareArms:F('raise','rise',0xc0c0c0,[{k:'rain',c:0xc0c0c0,n:6,tilt:0,len:22},gl(0xc0c0c0,'sword',.8)]),
  grandDrum:F('roar','rise',0xe06030,[gl(0xe06030,'drum'),ri(0xe06030,5,1.3)]),
  strawBoats:F('raise','rise',0xd0b070,[{k:'rain',c:0xd0b070,n:12,tilt:-.4},gl(0xd0b070,'up',.7)]),
  valor:F('roar','rise',0xff5030,[fl(0xff5030,0xffa040,5,40),gl(0xff5030,'up',.8)]),
  burnBoats:F('roar','rise',0xff7040,[{k:'shards',c:0x8a6040,n:10},fl(0xff7040,0xffc060,4,34)]),
  backWater:F('roar','rise',0x4080ff,[{k:'wave',c:0x4080ff,s:.7},gl(0xff6040,'up',.8)]),
  celestialDance:F('spin','rise',0xffb0e0,[{k:'swirl',c:0xffb0e0,n:6},{k:'petals',c:0xffb0e0,c2:0xfff0a0,n:14}]),
  peachOath:F('raise','rise',0xffa0c0,[{k:'petals',c:0xffa0c0,c2:0xffffff,n:24},gl(0xffa0c0,'heart',.8)]),
  // ── 회복
  purify:F('raise','rise',0xffffff,[{k:'rain',c:0xffffff,n:12,tilt:0,len:10},{k:'column',c:0xe8fff8,w:12,h:90}]),
  spiritBell:F('raise','rise',0xffe080,[gl(0xffe080,'bell'),ri(0xffe080,3,.9)]),
  amnesty:F('raise','rise',0xfff0c0,[{k:'column',c:0xfff0c0,w:30,h:150},{k:'flash',c:0xfff0c0,a:.2}]),
  rations:F('raise','rise',0xf0e0a0,[bu(0xf0e0a0,0xffffff,18,{up:90}),gl(0xf0e0a0,'coin',.7)]),
  qigong:F('raise','rise',0x80ffc0,[{k:'swirl',c:0x80ffc0,n:5,s:.7},{k:'orbs',c:0x80ffc0,n:3}]),
  mend:F('raise','rise',0x9affb0,[{k:'column',c:0x8af0a0,w:12,h:80},bu(0xb8ffb0,0xffffff,12)]),
  royalGrace:F('raise','rise',0xffd860,[{k:'column',c:0xffd860,w:20,h:120},{k:'petals',c:0xffd860,c2:0xfff6c0,n:14}]),
  relief:F('raise','rise',0xffc090,[{k:'cloud',c:0xffe0c0,s:.8},bu(0xffc090,0xffffff,12,{up:80})]),
  greatMend:F('raise','rise',0x6aff90,[{k:'column',c:0x6aff90,w:22,h:130},ri(0x6aff90,3),bu(0xb8ffb0,0xffffff,24)]),
  blessing:F('raise','rise',0xfff6a0,[gl(0xfff6a0,'star'),bu(0xfff6a0,0xffffff,16,{up:100})]),
  sanctuary:F('raise','rise',0xb0ffd0,[{k:'dome',c:0xb0ffd0,s:1.3},{k:'rain',c:0xe8fff0,n:10,tilt:0,len:8}]),
  focus:F('raise','rise',0x80a0ff,[{k:'orbs',c:0x80a0ff,n:6},ri(0x80a0ff,2,.8)]),
  supplyLine:F('raise','rise',0x60c0ff,[{k:'orbs',c:0x60c0ff,n:4},{k:'column',c:0x60c0ff,w:10,h:70},gl(0x60c0ff,'coin',.7)]),
  // ── 병종 특수 스킬(물리)
  shieldBash:F('lunge','none',0xc0d0e0,[{k:'dome',c:0xc0d0e0,s:.6},ri(0xffffff,2,.7)],5),
  pierce:F('lunge','beam',0xffffff,[{k:'streaks',c:0xffffff,n:4},{k:'cross',c:0xe0f0ff,s:.7}],4),
  breakthrough:F('dash','none',0xe0c080,[ri(0xe0c080,3),bu(0xc9b58a,0xa08c64,18,{fall:true})],6),
  trample:F('dash','none',0xa08060,[ri(0xa08060,2,1.1),{k:'shards',c:0x8a6a40,n:8}],7),
  aimedShot:F('shoot','arrow',0xffe0a0,[gl(0xffe0a0,'x',.6),{k:'cross',c:0xffe0a0,s:.6}]),
  volley:F('shoot','volley',0xf0e0c0,[{k:'rain',c:0xf0e0c0,n:16,tilt:.3}]),
  skirmish:F('shoot','volley',0xe0d0b0,[{k:'rain',c:0xe0d0b0,n:10,tilt:-.7},{k:'streaks',c:0xe0d0b0,n:5}]),
  assassinate:F('dash','none',0x6a3a8a,[{k:'cloud',c:0x20102a,s:.7},{k:'slash',c:0x9a5ac0,n:2,s:.8}]),
  rattanRush:F('dash','none',0xc0a050,[{k:'dome',c:0xc0a050,s:.7},bu(0xd0b060,0x8a6a30,12)],5),
  tuskCharge:F('dash','none',0xe8e0c0,[{k:'spikes',c:0xf0e8d0,c2:0xa09880,n:4},ri(0xe8e0c0,2,1.2)],8),
  plunder:F('lunge','none',0xffd040,[gl(0xffd040,'coin'),bu(0xffd040,0xffe080,14,{fall:true})]),
  westernCharge:F('dash','none',0xd06040,[{k:'streaks',c:0xd06040,n:8},ri(0xd06040,2)],6),
  gateCrash:F('lunge','none',0x8a6a40,[{k:'shards',c:0x8a6a40,n:16},ri(0xd8c8a0,2)],8),
  deckVolley:F('shoot','volley',0xc0e0ff,[{k:'rain',c:0xc0e0ff,n:20,tilt:.15},{k:'wave',c:0x3a80c0,s:.6}]),
  flashCut:F('dash','none',0xffffff,[{k:'streaks',c:0xffffff,n:1},{k:'slash',c:0xffffff,n:1,s:1.4},{k:'flash',c:0xffffff,a:.25}],4),
  mountainRaid:F('dash','none',0x9a8a70,[{k:'rocks',c:0x9a8a70,n:3},{k:'slash',c:0xd8c8a0}],5),
  lanceRush:F('dash','beam',0xe0f0ff,[{k:'streaks',c:0xe0f0ff,n:5},{k:'cross',c:0xe0f0ff,s:.8}],5),
  scytheWheels:F('dash','none',0xc0c0c0,[{k:'swirl',c:0xc0c0c0,n:3,s:.7},{k:'slash',c:0xd0d0d0,n:3,s:.7}],5),
  towerShot:F('shoot','arrow',0xd0c0a0,[{k:'rain',c:0xd0c0a0,n:4,tilt:0,len:30},{k:'cross',c:0xd0c0a0,s:.5}]),
  beastRoar:F('roar','none',0xff9040,[ri(0xff9040,5,1.2),{k:'streaks',c:0xff9040,n:10,radial:true}],4),
  ironCharge:F('dash','none',0xb0c0d0,[{k:'shards',c:0xb0c0d0,n:12},{k:'cross',c:0xffffff,s:.7}],8),
  halberdSweep:F('spin','none',0xe0e0ff,[{k:'slash',c:0xe0e0ff,n:3,s:1.2},ri(0xe0e0ff,1,1.3)],5),
  snare:F('throw','none',0xa08a50,[{k:'bars',c:0xa08a50,n:5},ri(0xa08a50,1,.7)]),
  thunderShot:F('throw','shell',0xffa030,[{k:'flash',c:0xffa030,a:.3},bu(0xffa030,0xff5a1a,30),{k:'cloud',c:0x3a3430,s:1.2},ri(0xffd060,2)],8),
  chainFist:F('lunge','none',0xffe060,[{k:'streaks',c:0xffe060,n:6,radial:true},{k:'cross',c:0xffe060,s:.5}],5),
  royalStrike:F('lunge','none',0xffd040,[{k:'cross',c:0xffd040,s:1.2},{k:'column',c:0xffd040,w:10,h:90}],6),
  commandStrike:F('lunge','none',0xff6040,[{k:'slash',c:0xff6040,n:2},gl(0xff6040,'flag',.7)],5),
  yellowSlash:F('lunge','none',0xe0c020,[{k:'slash',c:0xe0c020,n:1,s:1.3},bu(0xffe060,0xe0c020,12)],5),
  boardingSlash:F('dash','none',0x60b0ff,[{k:'wave',c:0x60b0ff,s:.6},{k:'slash',c:0xffffff,n:2}],5),
  javelinCast:F('throw','spear',0xe0d0b0,[{k:'streaks',c:0xe0d0b0,n:3},bu(0xff6a5a,0x8a2a20,8,{fall:true})]),
  qiangCharge:F('dash','none',0xb08050,[{k:'streaks',c:0xb08050,n:9},ri(0xb08050,2,1.1)],6),
  sniperShot:F('shoot','arrow',0xff4040,[gl(0xff4040,'x',.7),{k:'streaks',c:0xff4040,n:2},{k:'flash',c:0xff4040,a:.12}]),
};

/** 표에 없는 책략(새로 더한 것 등)은 속성으로 기본 연출을 고른다. */
const BY_ELEMENT:Record<string,StratFx>={
  fire:STRATEGY_FX.fire!,water:STRATEGY_FX.flood!,wind:STRATEGY_FX.windDragon!,thunder:STRATEGY_FX.thunder!,earth:STRATEGY_FX.shatter!,
  support:STRATEGY_FX.hex!,physical:STRATEGY_FX.shieldBash!,heal:STRATEGY_FX.mend!,buff:STRATEGY_FX.inspire!,
};
export function strategyFx(id:string,element?:string,healing=false,friendly=false):StratFx{
  return STRATEGY_FX[id]??(healing?BY_ELEMENT.heal!:friendly?BY_ELEMENT.buff!:BY_ELEMENT[element??'support']??BY_ELEMENT.support!);
}
