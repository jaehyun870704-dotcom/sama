import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args=Object.fromEntries(process.argv.slice(2).map((value,index,list)=>value.startsWith('--')?[value.slice(2),list[index+1]]:null).filter(Boolean));
const input=args.input,output=args.output,type=args.type,layout=args.layout??'cells';
if(!input||!output||!['sd','duel'].includes(type))throw new Error('usage: node tools/build-officer-sheet.mjs --input source --output target --type sd|duel [--layout cells|grid] [--height N]');

const spec=type==='sd'?{width:1400,height:280,cellW:350,cellH:280,foot:268,figureH:Number(args.height??200),pad:10}:{width:1024,height:256,cellW:256,cellH:256,foot:230,figureH:Number(args.height??182),pad:26};
const source=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {data,info}=source;
if(args.chroma==='magenta')for(let pixel=0;pixel<info.width*info.height;pixel++){
  const i=pixel*4,r=data[i],g=data[i+1],b=data[i+2];
  if(r>175&&b>165&&g<125&&Math.abs(r-b)<100)data[i+3]=0;
}

function componentFrames(){
  const pixels=info.width*info.height,seen=new Uint8Array(pixels),components=[];
  for(let start=0;start<pixels;start++){
    if(seen[start]||data[start*4+3]<12)continue;
    const stack=[start],points=[];seen[start]=1;
    let minX=info.width,maxX=0,minY=info.height,maxY=0;
    while(stack.length){
      const p=stack.pop(),y=Math.floor(p/info.width),x=p-y*info.width;points.push(p);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        if(nx<0||ny<0||nx>=info.width||ny>=info.height)continue;
        const next=ny*info.width+nx;if(!seen[next]&&data[next*4+3]>=12){seen[next]=1;stack.push(next);}
      }
    }
    if(points.length>=100)components.push({points,minX,maxX,minY,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2});
  }
  const chosen=components.sort((a,b)=>b.points.length-a.points.length).slice(0,4);
  if(chosen.length!==4)throw new Error(`expected four figures, found ${chosen.length}`);
  chosen.sort((a,b)=>Math.abs(a.cy-b.cy)>info.height*.2?a.cy-b.cy:a.cx-b.cx);
  return chosen.map(c=>{
    const width=c.maxX-c.minX+1,height=c.maxY-c.minY+1,rgba=Buffer.alloc(width*height*4);
    for(const p of c.points){const sy=Math.floor(p/info.width),sx=p-sy*info.width,src=p*4,dst=((sy-c.minY)*width+(sx-c.minX))*4;data.copy(rgba,dst,src,src+4);}
    return {rgba,width,height};
  });
}

async function cellFrames(){
  if(info.width%4||info.height<1)throw new Error(`source is not a four-cell row: ${info.width}x${info.height}`);
  const cellW=info.width/4,sourceRows=Number(args.rows??1),sourceRow=Number(args.row??0),sourceH=Math.floor(info.height/sourceRows),frames=[];
  for(let index=0;index<4;index++){
    const crop=await sharp(input).extract({left:index*cellW,top:sourceRow*sourceH,width:cellW,height:sourceH}).png().toBuffer();
    const trimmed=await sharp(crop).trim({background:{r:0,g:0,b:0,alpha:0},threshold:8}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    frames.push({rgba:trimmed.data,width:trimmed.info.width,height:trimmed.info.height});
  }
  return frames;
}

const frames=layout==='grid'?componentFrames():await cellFrames();
const canvas=Buffer.alloc(spec.width*spec.height*4);
for(let index=0;index<4;index++){
  const frame=frames[index],scale=Math.min(spec.figureH/frame.height,(spec.cellW-spec.pad*2)/frame.width),width=Math.max(1,Math.round(frame.width*scale)),height=Math.max(1,Math.round(frame.height*scale));
  const resized=await sharp(frame.rgba,{raw:{width:frame.width,height:frame.height,channels:4}}).resize(width,height,{fit:'fill',kernel:'lanczos3'}).raw().toBuffer();
  const left=index*spec.cellW+Math.round((spec.cellW-width)/2),top=spec.foot-height;
  for(let y=0;y<height;y++)resized.copy(canvas,((top+y)*spec.width+left)*4,y*width*4,(y+1)*width*4);
}
await mkdir(path.dirname(output),{recursive:true});
await sharp(canvas,{raw:{width:spec.width,height:spec.height,channels:4}}).webp({lossless:true}).toFile(output);
