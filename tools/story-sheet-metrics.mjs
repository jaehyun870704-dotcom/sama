import {spawnSync} from 'node:child_process';
import {basename,resolve} from 'node:path';

const args=process.argv.slice(2),summary=args[0]==='--summary',files=summary?args.slice(1):args;
if(!files.length){
  console.error('usage: node tools/story-sheet-metrics.mjs <sheet.webp> [...]');
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

for(const arg of files){
  const file=resolve(arg),[width,height]=probe(file),pixels=decode(file);
  if(width%8||height%3)throw new Error(`${file}: expected an 8x3 sheet`);
  const cw=width/8,ch=height/3,rows=[];
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
    let left=cw,top=ch,right=-1,bottom=-1,count=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const i=(((row*ch+y)*width)+(col*cw+x))*4+3;
      if(pixels[i]<=40)continue;
      count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    const h=bottom>=top?bottom-top+1:0;
    rows.push({row,col,left,top,right,bottom,height:h,heightPct:+(h/ch*100).toFixed(1),footPct:+((bottom+1)/ch*100).toFixed(1),topPct:+(top/ch*100).toFixed(1),count});
  }
  const min=(key)=>Math.min(...rows.map(r=>r[key])),max=(key)=>Math.max(...rows.map(r=>r[key]));
  const standing=rows.filter(r=>r.col!==4&&r.col!==5),pass=standing.every(r=>r.heightPct>=80&&r.heightPct<=88&&r.footPct>=93&&r.footPct<=95&&r.topPct>=6);
  const report={file:basename(file),width,height,cell:[cw,ch],heightPct:[min('heightPct'),max('heightPct')],footPct:[min('footPct'),max('footPct')],topPct:[min('topPct'),max('topPct')],standingHeightPct:[Math.min(...standing.map(r=>r.heightPct)),Math.max(...standing.map(r=>r.heightPct))],pass,...(!summary?{cells:rows}:{})};
  console.log(JSON.stringify(report,null,summary?0:2));
}
