import {copyFileSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {basename,dirname,join,resolve} from 'node:path';

const args=process.argv.slice(2),write=args[0]==='--write',files=(write?args.slice(1):args).map(file=>resolve(file));
if(!files.length){
  console.error('usage: node tools/normalize-story-sheets.mjs [--write] <sheet.webp> [...]');
  process.exit(2);
}

function probe(file){
  const p=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=s=x:p=0',file],{encoding:'utf8'});
  if(p.status!==0)throw new Error(p.stderr||`ffprobe failed: ${file}`);
  return p.stdout.trim().split('x').map(Number);
}
function decode(file){
  const p=spawnSync('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],{encoding:null,maxBuffer:256*1024*1024});
  if(p.status!==0)throw new Error(p.stderr?.toString()||`ffmpeg failed: ${file}`);
  return p.stdout;
}
function component(src,width,cw,ch,col,row){
  const n=cw*ch,seen=new Uint8Array(n),components=[];
  const alpha=(x,y)=>src[(((row*ch+y)*width)+(col*cw+x))*4+3];
  for(let sy=0;sy<ch;sy++)for(let sx=0;sx<cw;sx++){
    const si=sy*cw+sx;if(seen[si]||alpha(sx,sy)<=40)continue;
    const q=[si],points=[];seen[si]=1;
    for(let qi=0;qi<q.length;qi++){
      const i=q[qi],x=i%cw,y=(i/cw)|0;points.push(i);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;
        const ni=ny*cw+nx;if(!seen[ni]&&alpha(nx,ny)>40){seen[ni]=1;q.push(ni);}
      }
    }
    components.push(points);
  }
  components.sort((a,b)=>b.length-a.length);const seed=components[0]??[],keep=new Uint8Array(n),q=[];
  for(const i of seed){keep[i]=1;q.push(i);}
  // Restore the antialiased edge around the solid component without restoring
  // the disconnected feet that leaked down from the cell above.
  let frontier=q;
  for(let ring=0;ring<3;ring++){
    const next=[];
    for(const i of frontier){const x=i%cw,y=(i/cw)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;
        const ni=ny*cw+nx;if(!keep[ni]&&alpha(nx,ny)>4){keep[ni]=1;next.push(ni);}
      }}
    frontier=next;
  }
  let left=cw,top=ch,right=-1,bottom=-1;
  for(let i=0;i<n;i++)if(keep[i]){const x=i%cw,y=(i/cw)|0;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  return {keep,left,top,right,bottom,w:right-left+1,h:bottom-top+1,solid:seed.length};
}
function drawScaled(dst,src,width,height,cw,ch,col,row,part,scale,foot){
  const dw=Math.max(1,Math.round(part.w*scale)),dh=Math.max(1,Math.round(part.h*scale));
  const x0=col*cw+Math.round((cw-dw)/2),y0=row*ch+foot-dh;
  const pixel=(sx,sy,k)=>{
    sx=Math.max(part.left,Math.min(part.right,sx));sy=Math.max(part.top,Math.min(part.bottom,sy));
    if(!part.keep[sy*cw+sx])return 0;
    return src[(((row*ch+sy)*width)+(col*cw+sx))*4+k];
  };
  for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
    const fx=part.left+(x+.5)/scale-.5,fy=part.top+(y+.5)/scale-.5,x1=Math.floor(fx),y1=Math.floor(fy),tx=fx-x1,ty=fy-y1;
    const weights=[[x1,y1,(1-tx)*(1-ty)],[x1+1,y1,tx*(1-ty)],[x1,y1+1,(1-tx)*ty],[x1+1,y1+1,tx*ty]];
    let a=0,r=0,g=0,b=0;
    for(const [sx,sy,w] of weights){const aa=pixel(sx,sy,3)/255;a+=aa*w;r+=pixel(sx,sy,0)*aa*w;g+=pixel(sx,sy,1)*aa*w;b+=pixel(sx,sy,2)*aa*w;}
    const di=(((y0+y)*width)+(x0+x))*4;if(a<=0)continue;
    dst[di]=Math.round(r/a);dst[di+1]=Math.round(g/a);dst[di+2]=Math.round(b/a);dst[di+3]=Math.round(a*255);
  }
  return {x:x0-col*cw,y:y0-row*ch,w:dw,h:dh,foot:y0-row*ch+dh};
}

for(const file of files){
  const [width,height]=probe(file);if(width%8||height%3)throw new Error(`${file}: expected an 8x3 sheet`);
  const cw=width/8,ch=height/3,src=decode(file),dst=Buffer.alloc(width*height*4),parts=[];
  for(let row=0;row<3;row++)for(let col=0;col<8;col++)parts.push(component(src,width,cw,ch,col,row));
  const placed=[],targetH=Math.round(ch*.86),targetFoot=Math.round(ch*.94),margin=Math.ceil(ch*.06);
  for(let row=0;row<3;row++){
    const stands=[0,1,2,3,6,7].map(col=>parts[row*8+col]).filter(p=>p.h>0);
    const median=[...stands].sort((a,b)=>a.h-b.h)[Math.floor(stands.length/2)];
    const rowScale=Math.min(targetH/median.h,...stands.map(p=>(cw-margin*2)/p.w));
    for(let col=0;col<8;col++){
      const part=parts[row*8+col];
      placed.push({row,col,...drawScaled(dst,src,width,height,cw,ch,col,row,part,rowScale,targetFoot),source:[part.w,part.h],scale:+rowScale.toFixed(4)});
    }
  }
  const report={file:basename(file),cell:[cw,ch],target:{heightPct:86,footPct:94,marginPct:6},placed};
  console.log(JSON.stringify(report,null,2));
  if(!write)continue;
  const temp=join(dirname(file),`.${basename(file)}.normalized.webp`);
  const p=spawnSync('ffmpeg',['-y','-v','error','-f','rawvideo','-pix_fmt','rgba','-s',`${width}x${height}`,'-i','pipe:0','-frames:v','1','-c:v','libwebp','-quality','92','-compression_level','6','-pix_fmt','yuva420p',temp],{input:dst,maxBuffer:64*1024*1024});
  if(p.status!==0)throw new Error(p.stderr?.toString()||`ffmpeg encode failed: ${file}`);
  copyFileSync(temp,file);unlinkSync(temp);
}
