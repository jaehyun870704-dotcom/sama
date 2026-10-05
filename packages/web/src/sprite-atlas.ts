export const SPRITE_CELL=256;
export interface AtlasPixels {width:number;height:number;data:Uint8ClampedArray}

/** Generated sheets have uneven gutters. Find connected silhouettes before assigning
 * frames, so a spear crossing a nominal cell boundary stays with its owner. */
/** union=true: 같은 칸에 든 실루엣 조각(투석기와 병사, 떠도는 부적)을 한 프레임으로 합친다. 기본은 칸마다 가장 큰 조각만 쓴다. */
export function isolateFrames(source:AtlasPixels,rows:number,columns=4,union=false):AtlasPixels {
  const {width,height,data}=source,labels=new Int32Array(width*height);
  const queue=new Int32Array(width*height);
  const groups:Array<{id:number;size:number;left:number;top:number;right:number;bottom:number}>=[];
  let id=0;
  for(let start=0;start<labels.length;start++){
    if(labels[start]||data[start*4+3]!<8)continue;
    id++;let head=0,tail=1;queue[0]=start;labels[start]=id;
    let left=width,top=height,right=0,bottom=0;
    while(head<tail){
      const p=queue[head++]!,x=p%width,y=Math.floor(p/width);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(const n of [x>0?p-1:-1,x+1<width?p+1:-1,y>0?p-width:-1,y+1<height?p+width:-1]){
        if(n>=0&&!labels[n]&&data[n*4+3]!>=8){labels[n]=id;queue[tail++]=n;}
      }
    }
    if(tail>=100)groups.push({id,size:tail,left,top,right,bottom});
  }
  type Frame={ids:Set<number>;size:number;left:number;top:number;right:number;bottom:number};
  const frames=new Map<number,Frame>();
  for(const g of groups){
    const col=Math.min(columns-1,Math.floor((g.left+g.right)/2/(width/columns)));
    const row=Math.min(rows-1,Math.floor((g.top+g.bottom)/2/(height/rows)));
    const slot=row*columns+col,cur=frames.get(slot);
    if(!cur)frames.set(slot,{ids:new Set([g.id]),size:g.size,left:g.left,top:g.top,right:g.right,bottom:g.bottom});
    else if(union){cur.ids.add(g.id);cur.size+=g.size;cur.left=Math.min(cur.left,g.left);cur.top=Math.min(cur.top,g.top);cur.right=Math.max(cur.right,g.right);cur.bottom=Math.max(cur.bottom,g.bottom);}
    else if(cur.size<g.size)frames.set(slot,{ids:new Set([g.id]),size:g.size,left:g.left,top:g.top,right:g.right,bottom:g.bottom});
  }
  if(frames.size!==rows*columns)throw new Error(`Sprite atlas: expected ${rows*columns} complete silhouettes, found ${frames.size}`);
  const outWidth=SPRITE_CELL*columns,outHeight=SPRITE_CELL*rows;
  const out=new Uint8ClampedArray(outWidth*outHeight*4);
  // One scale for the whole sheet preserves body size between attack poses.
  const scale=Math.min(...[...frames.values()].map(g=>(SPRITE_CELL-28)/Math.max(g.right-g.left+1,g.bottom-g.top+1)));
  for(const [slot,g] of frames){
    const w=Math.round((g.right-g.left+1)*scale),h=Math.round((g.bottom-g.top+1)*scale);
    const ox=(slot%columns)*SPRITE_CELL+Math.floor((SPRITE_CELL-w)/2),oy=Math.floor(slot/columns)*SPRITE_CELL+SPRITE_CELL-14-h;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const sx=g.left+Math.min(g.right-g.left,Math.floor(x/scale)),sy=g.top+Math.min(g.bottom-g.top,Math.floor(y/scale)),p=sy*width+sx;
      if(!g.ids.has(labels[p]!))continue;
      const dest=((oy+y)*outWidth+ox+x)*4;out.set(data.subarray(p*4,p*4+4),dest);
    }
  }
  return {width:outWidth,height:outHeight,data:out};
}

const cache=new Map<string,Promise<HTMLCanvasElement>>();
function toCanvas(p:AtlasPixels){
  const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;
  const g=canvas.getContext('2d',{willReadFrequently:true})!,img=g.createImageData(p.width,p.height);img.data.set(p.data);g.putImageData(img,0,0);return canvas;
}
/** Small worker pool: every sheet is cut in parallel, away from the main thread. */
type Job={url:string;rows:number;columns:number;union:boolean;resolve:(c:HTMLCanvasElement)=>void;reject:(e:unknown)=>void};
const queue:Job[]=[],idle:Worker[]=[],pending=new Map<number,Job>(),running=new Map<Worker,number>();let workers=0,jobs=0;
/** 작업자 파일을 못 불러오면(배포 누락·차단) 다시 쓰지 않고 메인 스레드에서 자른다. 대기가 끝나지 않아 화면이 멈추는 일을 막는다. */
let workerBroken=false;
const JOB_TIMEOUT=20000;
const poolSize=()=>Math.max(1,Math.min(4,(navigator.hardwareConcurrency||2)-1));
function failAll(reason:string){
  workerBroken=true;
  for(const job of pending.values())job.reject(new Error(reason));pending.clear();running.clear();
  for(const job of queue.splice(0))job.reject(new Error(reason));
}
function dispatch(){
  while(queue.length){
    if(workerBroken){failAll('atlas worker unavailable');return;}
    let w=idle.pop();
    if(!w){if(workers>=poolSize())return;workers++;
      try{w=new Worker(new URL('./atlas-worker.ts',import.meta.url),{type:'module'});}catch{failAll('atlas worker could not start');return;}
      const worker=w;
      worker.onerror=()=>{worker.terminate();failAll('atlas worker failed to load');};
      worker.onmessage=(e:MessageEvent<{id:number;width:number;height:number;plain:ArrayBuffer;rim:ArrayBuffer;error?:string}>)=>{
        const d=e.data,job=pending.get(d.id);pending.delete(d.id);running.delete(worker);idle.push(worker);
        if(job){if(d.error)job.reject(new Error(d.error));else{const plain=toCanvas({width:d.width,height:d.height,data:new Uint8ClampedArray(d.plain)});rims.set(plain,toCanvas({width:d.width,height:d.height,data:new Uint8ClampedArray(d.rim)}));job.resolve(plain);}}
        dispatch();};}
    const job=queue.shift()!,id=++jobs;pending.set(id,job);running.set(w,id);
    // 답이 오지 않는 작업은 메인 스레드로 넘긴다(작업자가 조용히 죽은 경우).
    setTimeout(()=>{const j=pending.get(id);if(j){pending.delete(id);j.reject(new Error('atlas worker timed out'));}},JOB_TIMEOUT);
    w.postMessage({id,url:new URL(job.url,location.href).href,rows:job.rows,columns:job.columns,union:job.union});
  }
}
async function onMainThread(url:string,rows:number,columns:number,union=false){
  const img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(img,0,0);
  return toCanvas(isolateFrames(context.getImageData(0,0,canvas.width,canvas.height),rows,columns,union));
}
export function spriteAtlas(url:string,rows:number,columns=4,union=false){
  // 문서 기준 상대 경로를 완전한 주소로: 워커는 자기 스크립트 위치를 기준으로 경로를 풀기 때문이다.
  url=typeof document!=='undefined'?new URL(url,document.baseURI).href:url;
  const key=url+':'+rows+':'+columns+(union?':u':'');
  if(!cache.has(key))cache.set(key,workerBroken||typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'?onMainThread(url,rows,columns,union):
    new Promise<HTMLCanvasElement>((resolve,reject)=>{queue.push({url,rows,columns,union,resolve,reject});dispatch();}).catch(()=>onMainThread(url,rows,columns,union)));
  return cache.get(key)!;
}

/** Dark rim around every silhouette so troops read against busy ground. A chamfer
 * distance keeps the rim round; soft edge pixels are laid over it, not replaced. */
export function outlineFrames(source:AtlasPixels,radius=4,rgb:[number,number,number]=[24,18,14]):AtlasPixels {
  const {width,height,data}=source,n=width*height,dist=new Float32Array(n),out=new Uint8ClampedArray(data);
  for(let i=0;i<n;i++)dist[i]=data[i*4+3]!>=96?0:1e9;
  const relax=(i:number,j:number,c:number)=>{if(dist[j]!+c<dist[i]!)dist[i]=dist[j]!+c;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;
    if(x>0)relax(i,i-1,1);if(y>0){relax(i,i-width,1);if(x>0)relax(i,i-width-1,1.4);if(x+1<width)relax(i,i-width+1,1.4);}}
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;
    if(x+1<width)relax(i,i+1,1);if(y+1<height){relax(i,i+width,1);if(x+1<width)relax(i,i+width+1,1.4);if(x>0)relax(i,i+width-1,1.4);}}
  for(let i=0;i<n;i++){
    const d=dist[i]!;if(d===0||d>radius)continue;
    const a=data[i*4+3]!/255,rim=Math.min(1,radius+.5-d);
    for(let k=0;k<3;k++)out[i*4+k]=Math.round(data[i*4+k]!*a+rgb[k]!*(1-a));
    out[i*4+3]=Math.round(255*Math.max(a,rim));
  }
  return {width,height,data:out};
}

const rims=new WeakMap<HTMLCanvasElement,HTMLCanvasElement>();
/** Outlined copy of an atlas canvas for the battlefield; story art keeps its plain edges. */
export function outlinedCanvas(canvas:HTMLCanvasElement,radius=4){
  const old=rims.get(canvas);if(old)return old;
  const g=canvas.getContext('2d',{willReadFrequently:true})!,pixels=outlineFrames(g.getImageData(0,0,canvas.width,canvas.height),radius);
  const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;
  const o=out.getContext('2d')!,img=o.createImageData(out.width,out.height);img.data.set(pixels.data);o.putImageData(img,0,0);
  rims.set(canvas,out);return out;
}
