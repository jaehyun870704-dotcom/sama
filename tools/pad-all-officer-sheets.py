from PIL import Image
from pathlib import Path
p=Path(__file__).parents[1]/'packages/web/public/officers'
for f in p.glob('*-battle-*.webp'):
 im=Image.open(f).convert('RGBA'); rows=im.height//224; cw=im.width//4; out=Image.new('RGBA',im.size,(0,0,0,0)); changed=False
 for r in range(rows):
  for c in range(4):
   cell=im.crop((c*cw,r*224,(c+1)*cw,(r+1)*224)); box=cell.getchannel('A').getbbox()
   if not box: continue
   l,t,rr,b=box; content=cell.crop(box); maxw=cw-16; maxh=224-18; scale=min(1,maxw/content.width,maxh/content.height)
   if scale<1: content=content.resize((max(1,int(content.width*scale)),max(1,int(content.height*scale))),Image.Resampling.LANCZOS); changed=True
   x=c*cw+(cw-content.width)//2; y=r*224+224-9-content.height; out.alpha_composite(content,(x,y))
 if changed: out.save(f,'WEBP',lossless=True,quality=95)
