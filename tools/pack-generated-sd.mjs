// Pack generated 2x2 pose artwork into the game's four-frame atlas.
// Illustration changes belong in the image generator, not this packing step.
// Usage: node tools/pack-generated-sd.mjs sources.json
import {readFileSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const entries=JSON.parse(readFileSync(process.argv[2], 'utf8'));
const root=resolve(import.meta.dirname, '../packages/web/public/officers');
const work=mkdtempSync(join(tmpdir(),'sd-pack-'));
const magick=(args)=>execFileSync('magick',args,{encoding:'utf8'}).trim();
try {
  for(const {id,source,mounted,version=4} of entries){
    // Read alpha to find empty gutters: don't crop weapons at an assumed grid.
    const regions=JSON.parse(execFileSync('python',['-c',`
import json,sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA')
a=im.getchannel('A').point(lambda v:255 if v>8 else 0)
def split(projection):
 n=len(projection)
 gaps=[i for i in range(int(n*.3),int(n*.7)) if not projection[i]]
 # 생성 원본은 2×2 사분면이다. 말꼬리·망토가 중앙선에 닿아도 원본의
 # 사분면은 유지되므로, 빈 선이 없을 때만 정확한 중앙을 쓴다.
 return min(gaps,key=lambda i:abs(i-n/2)) if gaps else n//2
sy=split(a.getprojection()[1]); out=[]
for top,bottom in [(0,sy),(sy,im.height)]:
 sx=split(a.crop((0,top,im.width,bottom)).getprojection()[0])
 for left,right in [(0,sx),(sx,im.width)]:
  b=a.crop((left,top,right,bottom)).getbbox()
  if not b:raise ValueError('Empty pose')
  l,t,r,bt=b
  out.append([r-l,bt-t,left+l,top+t])
print(json.dumps(out))
`,source],{encoding:'utf8'}));
    const poses=[];
    for(let i=0;i<4;i++){
      const file=join(work,`${id}-${i}.png`);
      const [cw,ch,x,y]=regions[i];
      magick([source,'-crop',`${cw}x${ch}+${x}+${y}`,'+repage',file]);
      const [w,h]=magick(['identify','-format','%w %h',file]).split(' ').map(Number);
      if(w<=1||h<=1)throw new Error(`${id}: empty pose ${i}`);
      poses.push({file,w,h});
    }
    // One common scale for all four poses. Never resize axes independently.
    const k=Math.min((mounted?240:200)/Math.max(...poses.map(p=>p.h)),320/Math.max(...poses.map(p=>p.w)));
    for(const pose of poses){
      magick([pose.file,'-resize',`${k*100}%`,'-background','none','-gravity','south','-extent','350x268','-gravity','north','-extent','350x280',pose.file]);
    }
    mkdirSync(root,{recursive:true});
    const output=join(root,`${id}-sd-v${version}.webp`);
    magick([...poses.map(p=>p.file),'+append','-define','webp:lossless=true',output]);
    console.log(`${id}: ${output}`);
    // The close-up uses the same design, preserving aspect ratio and footline.
    const duelScale=Math.min((mounted?180:182)/Math.max(...poses.map(p=>p.h)),230/Math.max(...poses.map(p=>p.w)));
    const duelPoses=[];
    for(let i=0;i<4;i++){
      const [cw,ch,x,y]=regions[i],file=join(work,`${id}-duel-${i}.png`);
      magick([source,'-crop',`${cw}x${ch}+${x}+${y}`,'+repage','-resize',`${duelScale*100}%`,'-background','none','-gravity','south','-extent','256x230','-gravity','north','-extent','256x256',file]);
      duelPoses.push(file);
    }
    magick([...duelPoses,'+append','-define','webp:lossless=true',join(root,`${id}-duel-v${version}.webp`)]);
  }
} finally {rmSync(work,{recursive:true,force:true});}
