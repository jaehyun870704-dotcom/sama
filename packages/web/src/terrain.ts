import {Container,Sprite,Texture,Rectangle,Graphics} from 'pixi.js';
import type {BattleState,TerrainKind,Coord} from '../../core/src/index.ts';
import {MATERIALS,materialOf,biomeFor,noiseField,sample,blendWeights,smooth,type Biome} from './terrain-paint.ts';

const S=48;
let noises:{warpA:Float32Array;warpB:Float32Array;coarse:Float32Array;fine:Float32Array;ripple:Float32Array}|undefined;
function noise(){return noises??={warpA:noiseField(11,4,3),warpB:noiseField(23,4,3),coarse:noiseField(37,3,4),fine:noiseField(53,32,2),ripple:noiseField(71,6,3)};}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Deterministic per-cell random so the same map always paints the same way. */
function hash(x:number,y:number,i=0){let h=(x*374761393+y*668265263+i*2147483647)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;}
const rgb=(c:readonly number[],a=1)=>`rgba(${(c[0]??0)|0},${(c[1]??0)|0},${(c[2]??0)|0},${a})`;
const shade=(c:readonly number[],k:number):number[]=>[(c[0]??0)*k,(c[1]??0)*k,(c[2]??0)*k];

/** Base ground: grass, forest floor, roads, water, rock, hills and paved yards
 * blended per pixel with warped borders and light from the upper left. */
function paintGround(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const map=state.map,W=map.width*S,H=map.height*S,n=noise();
  const mats=new Uint8Array(map.width*map.height);
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)mats[y*map.width+x]=MATERIALS.indexOf(materialOf(map.tileAt({x,y}).terrain));
  const img=ctx.createImageData(W,H),d=img.data,elev=new Float32Array(W*H),M=MATERIALS.length;
  const wgt=new Float32Array(M),raw=new Float32Array(M);
  const G=0,F=1,D=2,WA=3,R=4,HI=5,Y=6;
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
    const wa=sample(n.warpA,px*.55,py*.55)-.5,wb=sample(n.warpB,px*.55,py*.55)-.5;
    const tx=px/S-.5+wa*.62,ty=py/S-.5+wb*.62;
    blendWeights(mats,map.width,map.height,tx,ty,wgt,raw);
    const c=sample(n.coarse,px*.35,py*.35),f=sample(n.fine,px,py),grain=(f-.5)*2;
    let r=0,g=0,b=0;
    const add=(col:readonly number[],w:number)=>{r+=col[0]!*w;g+=col[1]!*w;b+=col[2]!*w;};
    if(wgt[G]!>.001){const t=smooth(.3,.7,c);add([mix(biome.grass[0][0],biome.grass[1][0],t)+grain*10,mix(biome.grass[0][1],biome.grass[1][1],t)+grain*12,mix(biome.grass[0][2],biome.grass[1][2],t)+grain*6],wgt[G]!);}
    if(wgt[F]!>.001)add(shade(biome.forest,.9+c*.25+grain*.05),wgt[F]!);
    if(wgt[D]!>.001){const t=smooth(.35,.65,sample(n.coarse,px*.9+80,py*.9));const rut=f>.82?.86:1;add(shade([mix(biome.dirt[0][0],biome.dirt[1][0],t),mix(biome.dirt[0][1],biome.dirt[1][1],t),mix(biome.dirt[0][2],biome.dirt[1][2],t)],rut*(1+grain*.05)),wgt[D]!);}
    if(wgt[WA]!>.001){
      const depth=smooth(.55,1,raw[WA]!),rip=sample(n.ripple,px*.7,py*2.2),line=(rip-.5)*.5*depth;
      const water=[mix(biome.shallow[0],biome.deep[0],depth)+line*55,mix(biome.shallow[1],biome.deep[1],depth)+line*60,mix(biome.shallow[2],biome.deep[2],depth)+line*50];
      // Wet sand and a dark bank line where land meets water.
      const shore=raw[WA]!;const sand=smooth(.62,.42,shore),bank=shore>.42&&shore<.5?.72:1;
      add([mix(water[0]!,biome.sand[0],sand)*bank,mix(water[1]!,biome.sand[1],sand)*bank,mix(water[2]!,biome.sand[2],sand)*bank],wgt[WA]!);
    }
    if(wgt[R]!>.001){const t=smooth(.25,.75,sample(n.coarse,px*1.4,py*1.4)),cr=f>.86?.75:1;add(shade([mix(biome.rock[0][0],biome.rock[1][0],t),mix(biome.rock[0][1],biome.rock[1][1],t),mix(biome.rock[0][2],biome.rock[1][2],t)],cr*(1+grain*.08)),wgt[R]!);}
    if(wgt[HI]!>.001)add(shade(biome.hill,.92+c*.18+grain*.05),wgt[HI]!);
    if(wgt[Y]!>.001){const slab=(px%16===0||(py+((Math.floor(px/16)%2)*8))%16===0)?.86:1;add(shade(biome.yard,slab*(.95+c*.1+grain*.04)),wgt[Y]!);}
    const dither=(hash(px,py,1)-.5)*(wgt[WA]!>.6?6:14);
    const i=(py*W+px)*4;d[i]=r+dither;d[i+1]=g+dither;d[i+2]=b+dither*.6;d[i+3]=255;
    elev[py*W+px]=raw[HI]!*1.1+raw[R]!*1.2+raw[F]!*.15-raw[WA]!*.25;
  }
  // Relief shading: compare elevation up-left against down-right.
  for(let py=3;py<H-3;py++)for(let px=3;px<W-3;px++){
    const k=(elev[(py-3)*W+px-3]!-elev[(py+3)*W+px+3]!)*.8,i=(py*W+px)*4,m=1+Math.max(-.32,Math.min(.32,k));
    d[i]=Math.min(255,d[i]!*m);d[i+1]=Math.min(255,d[i+1]!*m);d[i+2]=Math.min(255,d[i+2]!*m);
  }
  ctx.putImageData(img,0,0);
}

function terrainAt(state:BattleState,x:number,y:number):TerrainKind|undefined{return state.map.inBounds({x,y})?state.map.tileAt({x,y}).terrain:undefined;}

function paintRapids(ctx:CanvasRenderingContext2D,state:BattleState){
  ctx.lineCap='round';
  // Calm water: a few soft glints per tile, current running across the view.
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++)if(terrainAt(state,x,y)==='water')for(let i=0;i<2;i++){
    if(hash(x,y,i+60)<.35)continue;const sx=x*S+4+hash(x,y,i+61)*34,sy=y*S+8+hash(x,y,i+62)*32,len=6+hash(x,y,i+63)*8;
    ctx.strokeStyle=`rgba(210,236,236,${.18+hash(x,y,i+64)*.16})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+len/2,sy-2,sx+len,sy);ctx.stroke();
  }
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++)if(terrainAt(state,x,y)==='rapids')for(let i=0;i<5;i++){
    const sx=x*S+hash(x,y,i)*40,sy=y*S+6+i*9;ctx.strokeStyle=`rgba(235,248,246,${.45+hash(x,y,i+9)*.35})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+6,sy-3,sx+13,sy+1);ctx.stroke();
  }
}

function paintBridges(ctx:CanvasRenderingContext2D,state:BattleState,stone:(at:Coord)=>boolean){
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='bridge')continue;
    const wet=(t?:TerrainKind)=>t==='water'||t==='rapids';
    // A bridge runs across the river: along x when the water continues above/below.
    const horizontal=wet(terrainAt(state,x,y-1))||wet(terrainAt(state,x,y+1))||!(wet(terrainAt(state,x-1,y))||wet(terrainAt(state,x+1,y)));
    const px=x*S,py=y*S,isStone=stone({x,y});
    const deck=isStone?['#c9c2ad','#a39b86','#7a7464']:['#c49a62','#9c7444','#5e4228'];
    ctx.fillStyle='rgba(10,30,36,.35)';
    if(horizontal)ctx.fillRect(px,py+8,S,S-8);else ctx.fillRect(px+8,py,S-8,S);
    ctx.save();ctx.translate(px+S/2,py+S/2);if(!horizontal)ctx.rotate(Math.PI/2);
    const along=horizontal?[terrainAt(state,x,y-1),terrainAt(state,x,y+1)]:[terrainAt(state,x+1,y),terrainAt(state,x-1,y)];
    const top=along[0]==='bridge'?-S/2:-17,bottom=along[1]==='bridge'?S/2:17;
    ctx.fillStyle=deck[1]!;ctx.fillRect(-S/2-1,top,S+2,bottom-top);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?deck[0]!:deck[1]!;ctx.fillRect(-S/2+i*6,top+1,5,bottom-top-2);ctx.fillStyle='rgba(40,25,15,.35)';ctx.fillRect(-S/2+i*6+5,top+1,1,bottom-top-2);}
    ctx.fillStyle=deck[2]!;if(top<-S/2+1){}else{ctx.fillRect(-S/2-1,top-2,S+2,4);for(const xx of [-20,0,20])ctx.fillRect(xx-2,top-5,4,6);}
    if(bottom<S/2){ctx.fillRect(-S/2-1,bottom-2,S+2,4);for(const xx of [-20,0,20])ctx.fillRect(xx-2,bottom-2,4,8);}
    ctx.restore();
  }
}

function crown(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,biome:Biome,seed:number){
  const [light,mid,dark]=biome.canopy;
  if(seed>.72){
    // Conifer: stacked tiers.
    ctx.fillStyle='#4a3424';ctx.fillRect(x-1.5,y+r*.4,3,r*.7);
    for(let k=0;k<3;k++){const ty=y-r*.9+k*r*.45,tw=r*(.55+k*.28);
      const grd=ctx.createLinearGradient(x-tw,0,x+tw,0);grd.addColorStop(0,rgb(light));grd.addColorStop(.45,rgb(mid));grd.addColorStop(1,rgb(dark));
      ctx.fillStyle=grd;ctx.beginPath();ctx.moveTo(x,ty-r*.45);ctx.lineTo(x+tw,ty+r*.38);ctx.lineTo(x-tw,ty+r*.38);ctx.closePath();ctx.fill();ctx.strokeStyle=rgb(shade(dark,.8),.7);ctx.lineWidth=1;ctx.stroke();}
    return;
  }
  // Broadleaf: a cluster of shaded leaf balls.
  const balls=6;for(let k=0;k<balls;k++){
    const a=k/balls*Math.PI*2+seed*6,rr=r*(.45+hash(k,seed*1000|0)*.25),bx=x+Math.cos(a)*r*.42,by=y+Math.sin(a)*r*.32-(k%2)*2;
    const grd=ctx.createRadialGradient(bx-rr*.4,by-rr*.5,rr*.1,bx,by,rr);grd.addColorStop(0,rgb(light));grd.addColorStop(.55,rgb(mid));grd.addColorStop(1,rgb(dark));
    ctx.fillStyle=grd;ctx.beginPath();ctx.arc(bx,by,rr,0,Math.PI*2);ctx.fill();
  }
  const top=ctx.createRadialGradient(x-r*.3,y-r*.45,1,x,y-r*.1,r*.6);top.addColorStop(0,rgb(light));top.addColorStop(1,rgb(mid,0));ctx.fillStyle=top;ctx.beginPath();ctx.arc(x,y-r*.15,r*.55,0,Math.PI*2);ctx.fill();
}

function paintForests(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const trees:Array<{x:number;y:number;r:number;seed:number}>=[];
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='forest')continue;
    const count=3+Math.floor(hash(x,y)*2);
    for(let i=0;i<count;i++)trees.push({x:x*S+6+hash(x,y,i)*36,y:y*S+8+hash(x,y,i+5)*34,r:12+hash(x,y,i+11)*6,seed:hash(x,y,i+17)});
  }
  trees.sort((a,b)=>a.y-b.y);
  ctx.fillStyle='rgba(12,28,16,.38)';
  for(const t of trees){ctx.beginPath();ctx.ellipse(t.x+5,t.y+t.r*.75,t.r*1.05,t.r*.5,0,0,Math.PI*2);ctx.fill();}
  for(const t of trees)crown(ctx,t.x,t.y,t.r,biome,t.seed);
}

function paintMountains(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const peaks:Array<{x:number;y:number;w:number;h:number;seed:number}>=[];
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='mountain')continue;
    // Range edges carry peaks; deep inside a massif only some cells rise into
    // larger summits so the rock relief shows between them.
    const inner=['mountain'].includes(terrainAt(state,x-1,y)??'')&&terrainAt(state,x+1,y)==='mountain'&&terrainAt(state,x,y-1)==='mountain'&&terrainAt(state,x,y+1)==='mountain';
    const r=hash(x,y,12);
    if(inner&&r<.55){if(r<.2)crown(ctx,x*S+10+hash(x,y,13)*28,y*S+20+hash(x,y,14)*20,6,biome,.15);continue;}
    const big=inner?1.45:1;
    peaks.push({x:x*S+S/2+(hash(x,y)-.5)*20,y:y*S+S*.9,w:(28+hash(x,y,2)*16)*big,h:(46+hash(x,y,3)*30)*big,seed:hash(x,y,4)});
    if(!inner&&r>.45)peaks.push({x:x*S+(hash(x,y,6)>.5?6:S-6),y:y*S+S*1.02,w:18+hash(x,y,7)*10,h:24+hash(x,y,8)*14,seed:hash(x,y,9)});
  }
  peaks.sort((a,b)=>a.y-b.y);
  const [lit,dark]=biome.rock,[,green]=biome.canopy;
  for(const p of peaks){
    const tip={x:p.x+(p.seed-.5)*p.w*.5,y:p.y-p.h},mid=tip.x+p.w*.1;
    ctx.fillStyle='rgba(20,18,14,.28)';ctx.beginPath();ctx.ellipse(p.x+8,p.y+2,p.w*1.1,p.w*.3,0,0,Math.PI*2);ctx.fill();
    // Jagged silhouette: lit west face, shaded east face.
    const jag=(t:number,side:number)=>({x:tip.x+side*p.w*t+(hash(p.x|0,p.y|0,t*10+side|0)-.5)*p.w*.22,y:tip.y+p.h*t+(hash(p.y|0,p.x|0,t*10|0)-.5)*p.h*.08});
    const west=[tip,jag(.18,-1),jag(.36,-1),jag(.55,-1),jag(.72,-1),jag(.88,-1),{x:p.x-p.w,y:p.y}],east=[tip,jag(.16,1),jag(.33,1),jag(.5,1),jag(.7,1),jag(.86,1),{x:p.x+p.w,y:p.y}];
    const lg=ctx.createLinearGradient(0,tip.y,0,p.y);lg.addColorStop(0,rgb(shade(lit,1.12)));lg.addColorStop(.5,rgb(shade(lit,.92)));lg.addColorStop(.85,rgb(shade(green,.9)));lg.addColorStop(1,rgb(shade(green,.75)));
    ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(mid,p.y);for(const q of west)ctx.lineTo(q.x,q.y);ctx.closePath();ctx.fill();
    const dg=ctx.createLinearGradient(0,tip.y,0,p.y);dg.addColorStop(0,rgb(shade(dark,.9)));dg.addColorStop(.55,rgb(shade(dark,.75)));dg.addColorStop(1,rgb(shade(green,.5)));
    ctx.fillStyle=dg;ctx.beginPath();ctx.moveTo(mid,p.y);for(const q of east)ctx.lineTo(q.x,q.y);ctx.closePath();ctx.fill();
    // Gullies and the sunlit ridge.
    ctx.strokeStyle=rgb(shade(dark,.7),.7);ctx.lineWidth=1.3;
    for(let k=0;k<3;k++){const sx=tip.x+(k-1)*p.w*.25,sy=tip.y+p.h*(.25+k*.12);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(k-1)*4,sy+p.h*.3);ctx.stroke();}
    ctx.strokeStyle=rgb(shade(lit,1.45),.9);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(jag(.3,-1).x,jag(.3,-1).y);ctx.lineTo(jag(.55,-1).x,jag(.55,-1).y);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.moveTo(west[6]!.x,west[6]!.y);for(const q of [...west].reverse())ctx.lineTo(q.x,q.y);for(const q of east.slice(1))ctx.lineTo(q.x,q.y);ctx.closePath();ctx.clip();
    ctx.strokeStyle='rgba(35,30,24,.35)';ctx.lineWidth=1;for(let k=0;k<14;k++){const sx=p.x-p.w+hash(k,p.x|0,3)*p.w*2,sy=tip.y+hash(k,p.y|0,4)*p.h;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+3,sy+5);ctx.stroke();}
    ctx.fillStyle=rgb(shade(green,.85),.55);for(let k=0;k<6;k++){ctx.beginPath();ctx.arc(p.x-p.w*.8+hash(k,p.x|0,5)*p.w*1.6,p.y-hash(k,p.y|0,6)*p.h*.35,3+hash(k,1,7)*3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    ctx.strokeStyle='rgba(28,24,18,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(west[6]!.x,west[6]!.y);for(const q of [...west].reverse())ctx.lineTo(q.x,q.y);for(const q of east.slice(1))ctx.lineTo(q.x,q.y);ctx.stroke();
    for(let k=0;k<4;k++)crown(ctx,p.x-p.w*.75+k*p.w*.5,p.y-3-hash(k,p.x|0)*6,4+p.seed*3,biome,.2);
  }
}

function paintGrass(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const [light,,dark]=biome.canopy;ctx.lineWidth=1;
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    const t=terrainAt(state,x,y);if(t!=='plain'&&t!=='hill'&&t!=='forest')continue;
    for(let i=0;i<9;i++){const sx=x*S+hash(x,y,i+30)*46,sy=y*S+hash(x,y,i+50)*46,dk=i%3!==0;
      ctx.strokeStyle=dk?rgb(shade(dark,1.3),.45):rgb(light,.5);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-1,sy-3);ctx.moveTo(sx+1.5,sy);ctx.lineTo(sx+2,sy-4);ctx.moveTo(sx+3,sy);ctx.lineTo(sx+4.5,sy-2.5);ctx.stroke();}
    if(t==='plain'&&hash(x,y,77)>.86){const fx=x*S+8+hash(x,y,78)*30,fy=y*S+8+hash(x,y,79)*30;for(let k=0;k<4;k++){ctx.fillStyle=k%2?'#e8dc9a':'#f2efe0';ctx.fillRect(fx+k*3,fy+(k%2)*2,2,2);}}
  }
}

function paintHills(ctx:CanvasRenderingContext2D,state:BattleState){
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='hill')continue;
    for(let i=0;i<4;i++){const sx=x*S+6+hash(x,y,i)*34,sy=y*S+10+hash(x,y,i+3)*30;ctx.strokeStyle='rgba(60,70,30,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+2,sy-5);ctx.moveTo(sx+3,sy);ctx.lineTo(sx+5,sy-4);ctx.stroke();}
    if(hash(x,y,9)>.6){const sx=x*S+12+hash(x,y,10)*22,sy=y*S+30;ctx.fillStyle='#8d8676';ctx.beginPath();ctx.ellipse(sx,sy,5,3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b4ad9b';ctx.beginPath();ctx.ellipse(sx-1,sy-1,3,1.6,0,0,Math.PI*2);ctx.fill();}
  }
}

/** Continuous ramparts: stone walkway, crenellated parapets and a shaded outer face. */
function paintWalls(ctx:CanvasRenderingContext2D,state:BattleState){
  const isWall=(x:number,y:number)=>{const t=terrainAt(state,x,y);return t==='wall'||t==='gate';};
  const cells:Coord[]=[];for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++)if(terrainAt(state,x,y)==='wall')cells.push({x,y});
  const inset=7;
  // Outer face first so walkways overlap it.
  for(const {x,y} of cells){
    if(isWall(x,y+1))continue;
    const px=x*S,py=y*S;const grd=ctx.createLinearGradient(0,py+S-inset,0,py+S+10);grd.addColorStop(0,'#77705f');grd.addColorStop(1,'#4c473c');
    ctx.fillStyle=grd;ctx.fillRect(px+(isWall(x-1,y)?0:inset),py+S-inset,S-(isWall(x-1,y)?0:inset)-(isWall(x+1,y)?0:inset),inset+10);
    ctx.fillStyle='rgba(30,28,22,.5)';for(let k=0;k<3;k++)ctx.fillRect(px+inset+k*14+(y%2)*6,py+S-inset+4,1,12);ctx.fillRect(px,py+S+2,S,1);
    ctx.fillStyle='rgba(15,18,12,.35)';ctx.fillRect(px+(isWall(x-1,y)?0:inset),py+S+10,S-(isWall(x-1,y)?0:inset)-(isWall(x+1,y)?0:inset),5);
  }
  for(const {x,y} of cells){
    const px=x*S,py=y*S,l=isWall(x-1,y)?0:inset,r=isWall(x+1,y)?0:inset,t=isWall(x,y-1)?0:inset,b=isWall(x,y+1)?0:inset;
    ctx.fillStyle='#a69f8b';ctx.fillRect(px+l,py+t,S-l-r,S-t-b);
    ctx.fillStyle='rgba(70,64,52,.35)';for(let k=0;k<S;k+=12)ctx.fillRect(px+l,py+k+((x%2)*6),S-l-r,1);
    ctx.fillStyle='#c4bda8';ctx.fillRect(px+l,py+t,S-l-r,2);
    const corner=(isWall(x-1,y)||isWall(x+1,y))&&(isWall(x,y-1)||isWall(x,y+1));
    // Parapets along both long edges; merlons every 8px.
    const horiz=isWall(x-1,y)||isWall(x+1,y);
    ctx.fillStyle='#8b8472';
    if(horiz&&!corner)for(let k=0;k<S;k+=8){ctx.fillRect(px+k,py+t-1,5,5);ctx.fillRect(px+k,py+S-b-4,5,5);}
    else if(!corner)for(let k=0;k<S;k+=8){ctx.fillRect(px+l-1,py+k,5,5);ctx.fillRect(px+S-r-4,py+k,5,5);}
    if(corner||(!horiz&&!isWall(x,y-1)&&!isWall(x,y+1))){
      // Bastion at corners and lone posts.
      ctx.fillStyle='#958e7b';ctx.fillRect(px+2,py+2,S-4,S-4);ctx.fillStyle='#b3ac97';ctx.fillRect(px+6,py+6,S-12,S-12);
      ctx.fillStyle='#7a7363';for(let k=0;k<S-4;k+=9){ctx.fillRect(px+2+k,py+2,5,4);ctx.fillRect(px+2+k,py+S-6,5,4);ctx.fillRect(px+2,py+2+k,4,5);ctx.fillRect(px+S-6,py+2+k,4,5);}
    }
    ctx.strokeStyle='rgba(40,36,28,.55)';ctx.lineWidth=1;ctx.strokeRect(px+l+.5,py+t+.5,S-l-r-1,S-t-b-1);
  }
  // Gate passages without a destructible gate unit read as an open gateway.
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='gate'||state.find(`gate_${x}_${y}`))continue;
    const px=x*S,py=y*S;ctx.fillStyle='#6b6455';ctx.fillRect(px,py+4,6,S-8);ctx.fillRect(px+S-6,py+4,6,S-8);
    ctx.fillStyle='#4a3424';ctx.fillRect(px+6,py+6,4,S-12);ctx.fillRect(px+S-10,py+6,4,S-12);
  }
}

function paintFields(ctx:CanvasRenderingContext2D,state:BattleState){
  for(const p of state.map.regions.get('fields')??[]){
    const px=p.x*S,py=p.y*S;ctx.fillStyle='#a49a58';ctx.fillRect(px+2,py+2,S-4,S-4);
    for(let j=0;j<6;j++){ctx.fillStyle='#6c7440';ctx.fillRect(px+3,py+4+j*7,S-6,3);ctx.fillStyle='#d3c47d';ctx.fillRect(px+4,py+4+j*7,S-8,1);}
  }
}

/** Soft darkening toward the map border frames the battlefield like a painted scroll. */
function vignette(ctx:CanvasRenderingContext2D,w:number,h:number,biome:Biome){
  const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(12,16,10,.32)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(biome.tint){ctx.fillStyle=rgb(biome.tint[0],biome.tint[1]);ctx.fillRect(0,0,w,h);}
}

/** Render actual map data; decorations never replace collision or terrain rules. */
export function terrainLayer(state:BattleState,atlas:Texture){
  const map=state.map,layer=new Container(),biome=biomeFor(state.stage.id);
  const canvas=document.createElement('canvas');canvas.width=map.width*S;canvas.height=map.height*S;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  paintGround(ctx,state,biome);
  paintFields(ctx,state);
  paintRapids(ctx,state);
  paintBridges(ctx,state,at=>state.stage.id==='S1-08'&&at.y<20);
  paintGrass(ctx,state,biome);
  paintHills(ctx,state);
  paintWalls(ctx,state);
  paintMountains(ctx,state,biome);
  paintForests(ctx,state,biome);
  vignette(ctx,canvas.width,canvas.height,biome);
  const texture=Texture.from(canvas);texture.source.scaleMode='linear';layer.addChild(new Sprite(texture));
  const frames=Array.from({length:8},(_,i)=>new Texture({source:atlas.source,frame:new Rectangle((i%4)*atlas.width/4,Math.floor(i/4)*atlas.height/2,atlas.width/4,atlas.height/2)}));
  const object=(cell:number,x:number,y:number,w:number,h:number)=>{
    const s=new Sprite(frames[cell]);s.anchor.set(.5,.87);s.position.set((x+.5)*S,(y+.8)*S);s.width=w;s.height=h;layer.addChild(s);
  };
  // Landmarks keep the existing painted buildings: towers, halls, camps and villages.
  if(state.stage.id==='S1-08'){
    object(6,39,7,155,145);
    for(const [x,y] of [[33,5],[44,5],[33,16],[44,16]])if(!state.find(`tower_${x}_${y}`))object(3,x!,y!,85,118);
  }
  for(const region of ['camp','village']){
    const cells=map.regions.get(region);if(cells)for(const [i,at] of cells.entries())if(i%2===0)object(region==='camp'?5:6,at.x,at.y,90,94);
  }
  for(const at of map.regions.get('objective')??[]){const g=new Graphics();g.rect(at.x*S,at.y*S,S,S).fill({color:0xf5d48e,alpha:.14}).stroke({color:0xf4d493,width:2,alpha:.8});layer.addChild(g);}
  return {layer,texture,frames};
}
