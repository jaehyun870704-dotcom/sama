import {Container,Sprite,Texture,Rectangle,Graphics} from 'pixi.js';
import type {BattleState,TerrainKind,Coord} from '../../core/src/index.ts';
import {MATERIALS,materialOf,biomeFor,noiseField,sample,blendWeights,pickMaterial,rampIndex,bayer,smooth,type Biome,type RGB} from './terrain-paint.ts';
import {ART_SCALE} from './pixel-look.ts';

/** Battlefield art is painted on a pixel grid of 24 art pixels per tile and shown
 * at 2× with nearest-neighbour scaling: fine enough to sit beside the detailed
 * troop art, coarse enough to stay dot art. Only ramp colours are written. */
const T=24,SCALE=ART_SCALE,S=T*SCALE;
/** Painters were laid out on a 16-dot tile; u() keeps their proportions on any grid. */
const u=(n:number)=>Math.round(n*T/16),Q=16/T;
/** Ramps gain a midpoint between neighbours so dithering mixes close colours
 * instead of checkering two distant ones. */
const fineRamps=new WeakMap<RGB[],RGB[]>();
function fine(ramp:RGB[]){
  let out=fineRamps.get(ramp);if(out)return out;
  out=ramp.flatMap((c,i)=>{const n=ramp[i+1];return n?[c,[0,1,2].map(k=>Math.round((c[k]!+n[k]!)/2)) as RGB]:[c];});
  fineRamps.set(ramp,out);return out;
}
let noises:{warpA:Float32Array;warpB:Float32Array;coarse:Float32Array;fine:Float32Array}|undefined;
function noise(){return noises??={warpA:noiseField(11,4,3),warpB:noiseField(23,4,3),coarse:noiseField(37,3,4),fine:noiseField(53,32,2)};}
/** Deterministic per-cell random so the same map always paints the same way. */
function hash(x:number,y:number,i=0){let h=(x*374761393+y*668265263+i*2147483647)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;}
const css=(c:RGB)=>`rgb(${c[0]},${c[1]},${c[2]})`;
function terrainAt(state:BattleState,x:number,y:number):TerrainKind|undefined{return state.map.inBounds({x,y})?state.map.tileAt({x,y}).terrain:undefined;}
const idx=(m:string)=>MATERIALS.indexOf(m as never);

function paintGround(img:ImageData,state:BattleState,biome:Biome){
  const map=state.map,W=img.width,H=img.height,d=img.data,n=noise(),M=MATERIALS.length;
  const mats=new Uint8Array(map.width*map.height);
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)mats[y*map.width+x]=idx(materialOf(map.tileAt({x,y}).terrain));
  const pick=new Uint8Array(W*H),elev=new Float32Array(W*H),wet=new Float32Array(W*H);
  const wgt=new Float32Array(M),raw=new Float32Array(M);
  const WA=idx('water'),HI=idx('hill'),R=idx('rock'),CL=idx('cliff'),F=idx('forest'),FO=idx('ford'),MA=idx('marsh');
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
    const wa=sample(n.warpA,px*1.6*Q,py*1.6*Q)-.5,wb=sample(n.warpB,px*1.6*Q,py*1.6*Q)-.5;
    blendWeights(mats,map.width,map.height,(px+.5)/T-.5+wa*.5,(py+.5)/T-.5+wb*.5,wgt,raw,6);
    const i=py*W+px;pick[i]=pickMaterial(wgt,bayer(px,py));
    elev[i]=raw[HI]!*.9+raw[R]!*1.3+raw[CL]!*1.8+raw[F]!*.15-raw[WA]!*.3;wet[i]=raw[WA]!+raw[FO]!*.6+raw[MA]!*.2;
  }
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
    const i=py*W+px,m=MATERIALS[pick[i]!]!,th=bayer(px,py),c=sample(n.coarse,px*1.2*Q,py*1.2*Q),f=hash(px,py,3)*.25+sample(n.fine,px*.9*Q,py*.9*Q)*.75;
    const e0=elev[Math.max(0,py-1)*W+Math.max(0,px-1)]!,e1=elev[Math.min(H-1,py+1)*W+Math.min(W-1,px+1)]!,light=(e0-e1)*1.6/Q;
    // Calm, broad shading: per-dot noise made the ground fizz behind the troops.
    let ramp=fine(biome.ramps[m]),shade=.45+(c-.5)*.5+(f-.5)*.2+light;
    if(m==='water'){
      const depth=smooth(.45,1,wet[i]!);shade=.85-depth*.6+(f-.5)*.12;
      if(wet[i]!<.52){ramp=fine(biome.sand);shade=.25+(c-.5)*.4+(f-.5)*.3;} else if(wet[i]!<.58)shade=0;
    }else if(m==='dirt'){if(f>.8)shade-=.2;}
    else if(m==='yard'){if(px%u(8)===0||(py+(Math.floor(px/u(8))%2)*u(4))%u(8)===0)shade-=.3;}
    else if(m==='marsh'&&f>.72){ramp=fine(biome.ramps.water);shade=.55;}
    else if(m==='ford'){shade=.4+(f-.5)*.5;}
    else if(m==='cliff'){if(py%u(5)===0)shade-=.35;shade+=light*.5;}
    const col=ramp[rampIndex(Math.max(0,Math.min(1,shade)),ramp.length,th)]!;
    d[i*4]=col[0];d[i*4+1]=col[1];d[i*4+2]=col[2];d[i*4+3]=255;
  }
}

/** Scenery-v3 objects (oak, pine, rock spire, …) shrunk to art pixels with a hard
 * alpha cut so their soft glow never reaches the battlefield. */
const thumbs=new Map<string,HTMLCanvasElement>();
const boxes=new Map<number,{x:number;y:number;w:number;h:number}>();
function sceneryThumb(atlas:Texture,frame:number,w:number,h:number,flip=false,dark=false){
  const key=frame+':'+w+':'+h+':'+flip+':'+dark;const old=thumbs.get(key);if(old)return old;
  const src=atlas.source.resource as CanvasImageSource,cw=atlas.width/4,ch=atlas.height/2,ox=(frame%4)*cw,oy=Math.floor(frame/4)*ch;
  if(!boxes.has(frame)){
    const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d',{willReadFrequently:true})!;g.drawImage(src,ox,oy,cw,ch,0,0,cw,ch);
    const a=g.getImageData(0,0,cw,ch).data;let x0=cw,y0=ch,x1=0,y1=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(a[(y*cw+x)*4+3]!>200){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    boxes.set(frame,{x:ox+x0,y:oy+y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)});
  }
  const b=boxes.get(frame)!,out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d',{willReadFrequently:true})!;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';if(flip){g.translate(w,0);g.scale(-1,1);}g.drawImage(src,b.x,b.y,b.w,b.h,0,0,w,h);
  const img=g.getImageData(0,0,w,h);for(let i=3;i<img.data.length;i+=4){img.data[i]=img.data[i]!>150?255:0;if(dark){img.data[i-3]=img.data[i-3]!*.55;img.data[i-2]=img.data[i-2]!*.5;img.data[i-1]=img.data[i-1]!*.52;}}g.setTransform(1,0,0,1,0,0);g.putImageData(img,0,0);
  thumbs.set(key,out);return out;
}

function paintWaterDetail(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const foam=css(biome.ramps.water[4]!),white='rgb(226,240,236)';
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    const t=terrainAt(state,x,y),px=x*T,py=y*T;
    if(t==='water')for(let i=0;i<2;i++){if(hash(x,y,i+60)<.45)continue;ctx.fillStyle=foam;ctx.fillRect(px+u(2)+Math.floor(hash(x,y,i+61)*u(10)),py+u(3)+Math.floor(hash(x,y,i+62)*u(10)),u(3)+Math.floor(hash(x,y,i+63)*u(3)),1);}
    if(t==='rapids')for(let i=0;i<6;i++){const sx=px+Math.floor(hash(x,y,i)*u(12)),sy=py+u(1)+i*u(2)+Math.floor(hash(x,y,i+9)*u(2));ctx.fillStyle=i%2?white:foam;ctx.fillRect(sx,sy,u(3)+Math.floor(hash(x,y,i+3)*u(3)),1);ctx.fillRect(sx+1,sy-1,1,1);}
    if(t==='ford')for(let i=0;i<4;i++){const sx=px+u(2)+Math.floor(hash(x,y,i+20)*u(11)),sy=py+u(2)+Math.floor(hash(x,y,i+21)*u(11));ctx.fillStyle='rgb(120,116,104)';ctx.fillRect(sx,sy,u(2),1);ctx.fillStyle='rgb(170,166,150)';ctx.fillRect(sx,sy-1,u(2),1);ctx.fillStyle=white;ctx.fillRect(sx-1,sy+1,u(4),1);}
  }
}

function paintMarsh(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const [dark,,mid,light]=biome.canopy;
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='marsh')continue;
    for(let i=0;i<18;i++){const sx=x*T+Math.floor(hash(x,y,i+30)*(T-1)),sy=y*T+u(3)+Math.floor(hash(x,y,i+31)*u(12)),h=u(3)+Math.floor(hash(x,y,i+32)*u(3));
      ctx.fillStyle=css(i%3===0?light!:i%3===1?mid!:dark!);ctx.fillRect(sx,sy-h,1,h);if(i%4===0){ctx.fillStyle='rgb(150,112,62)';ctx.fillRect(sx,sy-h-1,1,2);}}
  }
}

function paintGrass(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const g=biome.ramps.grass;
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    const t=terrainAt(state,x,y);if(t!=='plain'&&t!=='hill')continue;
    for(let i=0;i<4;i++){const sx=x*T+u(2)+Math.floor(hash(x,y,i+40)*u(12)),sy=y*T+u(3)+Math.floor(hash(x,y,i+41)*u(11));ctx.fillStyle=css(g[1]!);ctx.fillRect(sx-1,sy,1,1);ctx.fillRect(sx+1,sy,1,1);ctx.fillStyle=css(g[4]!);ctx.fillRect(sx,sy-1,1,1);}
    if(t==='plain'&&hash(x,y,77)>.88){const fx=x*T+u(3)+Math.floor(hash(x,y,78)*u(9)),fy=y*T+u(3)+Math.floor(hash(x,y,79)*u(9));ctx.fillStyle='rgb(238,226,160)';ctx.fillRect(fx,fy,1,1);ctx.fillRect(fx+2,fy+1,1,1);ctx.fillStyle='rgb(240,238,226)';ctx.fillRect(fx+1,fy+2,1,1);}
  }
}

function paintFields(ctx:CanvasRenderingContext2D,state:BattleState){
  for(const p of state.map.regions.get('fields')??[]){
    if(state.map.tileAt(p).terrain!=='plain')continue; // flooded or built over
    const px=p.x*T,py=p.y*T;ctx.fillStyle='rgb(164,154,88)';ctx.fillRect(px+1,py+1,T-2,T-2);
    for(let j=0;j<Math.floor((T-2)/3);j++){ctx.fillStyle='rgb(108,116,64)';ctx.fillRect(px+1,py+2+j*3,T-2,1);ctx.fillStyle='rgb(211,196,125)';ctx.fillRect(px+2,py+1+j*3,T-4,1);}
  }
}

function paintBridges(ctx:CanvasRenderingContext2D,state:BattleState,stone:(at:Coord)=>boolean){
  const wetAt=(x:number,y:number)=>{const t=terrainAt(state,x,y);return t==='water'||t==='rapids';};
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='bridge')continue;
    const across=wetAt(x,y-1)||wetAt(x,y+1)||!(wetAt(x-1,y)||wetAt(x+1,y));
    const isStone=stone({x,y}),deck=isStone?['rgb(201,194,173)','rgb(163,155,134)','rgb(110,104,90)']:['rgb(196,154,98)','rgb(156,116,68)','rgb(90,62,38)'];
    const px=x*T,py=y*T,before=across?terrainAt(state,x,y-1)==='bridge':terrainAt(state,x-1,y)==='bridge',after=across?terrainAt(state,x,y+1)==='bridge':terrainAt(state,x+1,y)==='bridge';
    const lo=before?0:u(3),hi=after?T:T-u(3);
    ctx.fillStyle='rgba(8,24,30,.55)';if(across)ctx.fillRect(px,py+lo+u(2),T,hi-lo);else ctx.fillRect(px+lo+u(2),py,hi-lo,T);
    for(let k=0;k<T;k+=2){ctx.fillStyle=deck[(k/2)%2]!;if(across)ctx.fillRect(px+k,py+lo,2,hi-lo);else ctx.fillRect(px+lo,py+k,hi-lo,2);}
    ctx.fillStyle=deck[2]!;
    if(across){if(!before)ctx.fillRect(px,py+lo-1,T,1);if(!after)ctx.fillRect(px,py+hi,T,1);for(const k of [1,8,14].map(u)){if(!before)ctx.fillRect(px+k,py+lo-u(2),1,u(2));if(!after)ctx.fillRect(px+k,py+hi,1,u(2));}}
    else{if(!before)ctx.fillRect(px+lo-1,py,1,T);if(!after)ctx.fillRect(px+hi,py,1,T);}
  }
}

/** Plank roads (잔도) bolted to the cliff: boards across the path, posts and a drop. */
function paintPlanks(ctx:CanvasRenderingContext2D,state:BattleState){
  const path=(x:number,y:number)=>{const t=terrainAt(state,x,y);return t!==undefined&&t!=='cliff'&&t!=='water'&&t!=='rapids'&&t!=='mountain';};
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='plank')continue;
    const px=x*T,py=y*T,horizontal=path(x-1,y)||path(x+1,y);
    ctx.fillStyle='rgba(10,8,6,.6)';if(horizontal)ctx.fillRect(px,py+u(12),T,u(3));else ctx.fillRect(px+u(12),py,u(3),T);
    for(let k=0;k<T;k+=2){ctx.fillStyle=k%4?'rgb(170,126,74)':'rgb(138,98,56)';if(horizontal)ctx.fillRect(px+k,py+u(4),2,u(8));else ctx.fillRect(px+u(4),py+k,u(8),2);}
    ctx.fillStyle='rgb(74,50,30)';
    if(horizontal){ctx.fillRect(px,py+u(3),T,1);ctx.fillRect(px,py+u(12),T,1);for(const k of [2,9].map(u))ctx.fillRect(px+k,py+u(12),1,u(4));}
    else{ctx.fillRect(px+u(3),py,1,T);ctx.fillRect(px+u(12),py,1,T);for(const k of [2,9].map(u))ctx.fillRect(px+u(12),py+k,u(4),1);}
  }
}

/** Continuous ramparts in art pixels: walkway, merlons and a shaded outer face. */
function paintWalls(ctx:CanvasRenderingContext2D,state:BattleState){
  const isWall=(x:number,y:number)=>{const t=terrainAt(state,x,y);return t==='wall'||t==='gate';};
  const cells:Coord[]=[];for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++)if(terrainAt(state,x,y)==='wall')cells.push({x,y});
  const inset=u(2);
  for(const {x,y} of cells){
    if(isWall(x,y+1))continue;const px=x*T,py=y*T,l=isWall(x-1,y)?0:inset,r=isWall(x+1,y)?0:inset;
    ctx.fillStyle='rgb(104,98,84)';ctx.fillRect(px+l,py+T-inset,T-l-r,inset+u(3));ctx.fillStyle='rgb(76,71,60)';ctx.fillRect(px+l,py+T+u(1),T-l-r,1);
    ctx.fillStyle='rgba(15,18,12,.45)';ctx.fillRect(px+l,py+T+u(2),T-l-r,u(2));
  }
  for(const {x,y} of cells){
    const px=x*T,py=y*T,l=isWall(x-1,y)?0:inset,r=isWall(x+1,y)?0:inset,t=isWall(x,y-1)?0:inset,b=isWall(x,y+1)?0:inset;
    ctx.fillStyle='rgb(166,159,139)';ctx.fillRect(px+l,py+t,T-l-r,T-t-b);
    ctx.fillStyle='rgb(140,133,114)';for(let k=u(4);k<T;k+=u(4))ctx.fillRect(px+l,py+k,T-l-r,1);
    ctx.fillStyle='rgb(196,189,168)';ctx.fillRect(px+l,py+t,T-l-r,1);
    const horiz=isWall(x-1,y)||isWall(x+1,y),vert=isWall(x,y-1)||isWall(x,y+1),corner=horiz&&vert;
    ctx.fillStyle='rgb(122,115,99)';
    const m=u(2);
    if(corner||(!horiz&&!vert)){ctx.fillRect(px,py,T,T);ctx.fillStyle='rgb(180,172,151)';ctx.fillRect(px+m,py+m,T-2*m,T-2*m);ctx.fillStyle='rgb(122,115,99)';for(let k=0;k<T;k+=u(4)){ctx.fillRect(px+k,py,m,m);ctx.fillRect(px+k,py+T-m,m,m);ctx.fillRect(px,py+k,m,m);ctx.fillRect(px+T-m,py+k,m,m);}}
    else if(horiz)for(let k=0;k<T;k+=u(3)){ctx.fillRect(px+k,py+t,m,m);ctx.fillRect(px+k,py+T-b-m,m,m);}
    else for(let k=0;k<T;k+=u(3)){ctx.fillRect(px+l,py+k,m,m);ctx.fillRect(px+T-r-m,py+k,m,m);}
  }
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='gate'||state.find(`gate_${x}_${y}`))continue;
    const px=x*T,py=y*T,m=u(2);ctx.fillStyle='rgb(107,100,85)';ctx.fillRect(px,py+1,m,T-2);ctx.fillRect(px+T-m,py+1,m,T-2);ctx.fillStyle='rgb(74,52,36)';ctx.fillRect(px+m,py+m,1,T-2*m);ctx.fillRect(px+T-m-1,py+m,1,T-2*m);
  }
}

/** Cliff faces drop below the rock where open ground begins. */
function paintCliffFaces(ctx:CanvasRenderingContext2D,state:BattleState,biome:Biome){
  const r=biome.ramps.cliff;
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    if(terrainAt(state,x,y)!=='cliff')continue;const below=terrainAt(state,x,y+1);if(below==='cliff'||below===undefined)continue;
    const px=x*T,py=y*T+T-u(3);ctx.fillStyle=css(r[0]!);ctx.fillRect(px,py,T,u(4));ctx.fillStyle=css(r[1]!);for(let k=0;k<T;k+=u(3))ctx.fillRect(px+k,py+1,1,u(3));ctx.fillStyle='rgba(10,10,8,.45)';ctx.fillRect(px,py+u(4),T,u(2));
  }
}

/** Trees, rock spires and mountains from scenery-v3, sorted back to front. */
function paintScenery(ctx:CanvasRenderingContext2D,state:BattleState,atlas:Texture){
  const props:Array<{frame:number;x:number;y:number;w:number;h:number;flip:boolean;dark?:boolean}>=[];
  for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
    const t=terrainAt(state,x,y),px=x*T,py=y*T;
    if(t==='forest'){
      const count=2+(hash(x,y,1)>.6?1:0);
      for(let i=0;i<count;i++){const h=u(12)+Math.floor(hash(x,y,i+2)*u(5)),w=Math.round(h*.82);props.push({frame:hash(x,y,i+7)>.62?1:0,x:px+u(1)+Math.floor(hash(x,y,i+3)*(T-w+u(6)))-u(2),y:py+u(4)+Math.floor(hash(x,y,i+4)*u(10)),w,h,flip:hash(x,y,i+5)>.5});}
    }
    if(t==='mountain'){
      const inner=terrainAt(state,x-1,y)==='mountain'&&terrainAt(state,x+1,y)==='mountain'&&terrainAt(state,x,y-1)==='mountain'&&terrainAt(state,x,y+1)==='mountain';
      if(inner&&hash(x,y,12)<.62)continue;
      const w=u(inner?30:23)+Math.floor(hash(x,y,13)*u(7)),h=Math.round(w*1.1);props.push({frame:4,x:px+T/2-w/2+Math.floor((hash(x,y,14)-.5)*u(8)),y:py+T+u(2),w,h,flip:hash(x,y,15)>.5});
    }
    // Cliffs (impassable) use the same rock art, darkened and taller, so they read apart from climbable mountains.
    if(t==='cliff'){const w=u(16)+Math.floor(hash(x,y,16)*u(5)),h=Math.round(w*1.3);props.push({frame:4,x:px+T/2-w/2,y:py+T,w,h,flip:hash(x,y,17)>.5,dark:true});}
  }
  props.sort((a,b)=>a.y-b.y);
  for(const p of props){
    ctx.fillStyle='rgba(10,20,10,.35)';ctx.fillRect(Math.round(p.x+u(2)),Math.round(p.y-u(2)),p.w-u(2),u(2));
    ctx.drawImage(sceneryThumb(atlas,p.frame,p.w,p.h,p.flip,p.dark),Math.round(p.x),Math.round(p.y-p.h));
  }
}

function tint(ctx:CanvasRenderingContext2D,w:number,h:number,biome:Biome){
  if(!biome.tint)return;const [c,a]=biome.tint,img=ctx.getImageData(0,0,w,h),d=img.data;
  for(let i=0;i<d.length;i+=4){d[i]=d[i]!*(1-a)+c[0]*a;d[i+1]=d[i+1]!*(1-a)+c[1]*a;d[i+2]=d[i+2]!*(1-a)+c[2]*a;}
  ctx.putImageData(img,0,0);
}

/** Render actual map data; decorations never replace collision or terrain rules. */
export function terrainLayer(state:BattleState,atlas:Texture){
  const map=state.map,layer=new Container(),biome=biomeFor(state.stage.id);
  const canvas=document.createElement('canvas');canvas.width=map.width*T;canvas.height=map.height*T;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
  const img=ctx.createImageData(canvas.width,canvas.height);paintGround(img,state,biome);ctx.putImageData(img,0,0);
  paintFields(ctx,state);
  paintWaterDetail(ctx,state,biome);
  paintMarsh(ctx,state,biome);
  paintGrass(ctx,state,biome);
  paintBridges(ctx,state,at=>state.stage.id==='S1-08'&&at.y<20);
  paintPlanks(ctx,state);
  paintWalls(ctx,state);
  paintCliffFaces(ctx,state,biome);
  paintScenery(ctx,state,atlas);
  tint(ctx,canvas.width,canvas.height,biome);
  const texture=Texture.from(canvas);texture.source.scaleMode='nearest';const ground=new Sprite(texture);ground.scale.set(SCALE);layer.addChild(ground);
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
