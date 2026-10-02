import type {TerrainKind} from '../../core/src/index.ts';

/** Pure helpers for the painted battlefield: noise, biome palettes and the
 * per-pixel blend between terrain materials. No DOM access here. */
export type Material='grass'|'forest'|'dirt'|'water'|'rock'|'hill'|'yard';
export const MATERIALS:Material[]=['grass','forest','dirt','water','rock','hill','yard'];
export function materialOf(t:TerrainKind):Material{
  switch(t){
    case 'plain':return 'grass';case 'forest':return 'forest';case 'road':return 'dirt';
    case 'mountain':return 'rock';case 'hill':return 'hill';
    case 'water':case 'rapids':case 'bridge':return 'water';
    default:return 'yard';
  }
}
type RGB=[number,number,number];
export interface Biome {name:string;grass:[RGB,RGB];forest:RGB;dirt:[RGB,RGB];shallow:RGB;deep:RGB;sand:RGB;rock:[RGB,RGB];hill:RGB;yard:RGB;canopy:[RGB,RGB,RGB];tint?:[RGB,number]}
const hex=(h:string):RGB=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const spring:Biome={name:'중원 봄 들판',grass:[hex('#5c7a3d'),hex('#7f9150')],forest:hex('#3c5530'),dirt:[hex('#b99c69'),hex('#9c8155')],shallow:hex('#4f939b'),deep:hex('#2a5f72'),sand:hex('#c9bb8a'),rock:[hex('#9a9282'),hex('#6c675c')],hill:hex('#83954f'),yard:hex('#b9ad92'),canopy:[hex('#8fae5c'),hex('#456d35'),hex('#1d3524')]};
export const biomes:Record<string,Biome>={
  spring,
  loess:{...spring,name:'동관 황토 고원',grass:[hex('#9b9a5c'),hex('#b5a96a')],forest:hex('#6f7444'),dirt:[hex('#cfb07a'),hex('#b59463')],hill:hex('#b89f68'),rock:[hex('#ad9a7a'),hex('#7d6c55')],canopy:[hex('#a9b467'),hex('#6c7f3e'),hex('#33402a')],shallow:hex('#6f9592'),deep:hex('#4b6e72')},
  lush:{...spring,name:'한중 산림',grass:[hex('#4c713c'),hex('#6a8a4a')],forest:hex('#2f5130'),canopy:[hex('#86b25c'),hex('#3c6e36'),hex('#1a3523')]},
  river:{...spring,name:'장강 유역',grass:[hex('#5a7d44'),hex('#7b9555')],shallow:hex('#4a8f9e'),deep:hex('#21576d')},
  dream:{...spring,name:'흉몽',tint:[hex('#2e2a58'),.38]},
};
export function biomeFor(stageId:string){
  if(stageId==='S1-06')return biomes.loess!;
  if(stageId==='S1-07'||stageId==='S1-08')return biomes.lush!;
  if(stageId==='S1-05'||stageId==='T07'||stageId==='T04'||stageId==='Q01'||stageId==='Q08')return biomes.river!;
  if(stageId==='S1-04')return biomes.dream!;
  return spring;
}

/** Tileable fractal value noise in [0,1], 256×256. */
export function noiseField(seed:number,cells=8,octaves=4):Float32Array{
  const N=256,out=new Float32Array(N*N);let amp=1,total=0;
  let s=seed>>>0||1;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  for(let o=0;o<octaves;o++){
    const g=cells<<o,grid=Float32Array.from({length:g*g},rnd),step=N/g;
    for(let y=0;y<N;y++){const gy=y/step,y0=Math.floor(gy),fy=gy-y0,sy=fy*fy*(3-2*fy);
      for(let x=0;x<N;x++){const gx=x/step,x0=Math.floor(gx),fx=gx-x0,sx=fx*fx*(3-2*fx);
        const a=grid[(y0%g)*g+x0%g]!,b=grid[(y0%g)*g+(x0+1)%g]!,c=grid[((y0+1)%g)*g+x0%g]!,d=grid[((y0+1)%g)*g+(x0+1)%g]!;
        out[y*N+x]=out[y*N+x]!+amp*((a*(1-sx)+b*sx)*(1-sy)+(c*(1-sx)+d*sx)*sy);}}
    total+=amp;amp*=.5;
  }
  for(let i=0;i<out.length;i++)out[i]=out[i]!/total;
  return out;
}
export function sample(n:Float32Array,x:number,y:number){return n[((Math.floor(y)&255)<<8)|(Math.floor(x)&255)]!;}

/**
 * Material weights at a pixel. Tile centres are blended bilinearly after a
 * noise warp, then sharpened so borders read as organic lines instead of squares.
 * Returns raw (unsharpened) weights too, which drive water depth and elevation.
 */
export function blendWeights(mats:Uint8Array,w:number,h:number,tx:number,ty:number,out:Float32Array,raw:Float32Array,sharp=5){
  out.fill(0);raw.fill(0);
  const ix=Math.floor(tx),iy=Math.floor(ty),fx=tx-ix,fy=ty-iy;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){
    const cx=Math.min(w-1,Math.max(0,ix+i)),cy=Math.min(h-1,Math.max(0,iy+j));
    const b=(i?fx:1-fx)*(j?fy:1-fy),m=mats[cy*w+cx]!;raw[m]=raw[m]!+b;
  }
  let sum=0;for(let m=0;m<raw.length;m++){const v=raw[m]!**sharp;out[m]=v;sum+=v;}
  for(let m=0;m<out.length;m++)out[m]=out[m]!/(sum||1);
}
export const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
