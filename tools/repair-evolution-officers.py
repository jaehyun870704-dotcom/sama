from PIL import Image,ImageDraw
from pathlib import Path
p=Path(__file__).parents[1]/'packages/web/public/officers'
spec={'ma_chao':('#c8c9c2','cavalry'),'liu_bei':('#2f62a5','lord'),'guan_yu':('#3e8050','cavalry'),'zhang_fei':('#b24b2f','spearman')}
for ident,(hexcol,kind) in spec.items():
 col=tuple(int(hexcol[i:i+2],16) for i in (1,3,5)); im=Image.new('RGBA',(1120,224),(0,0,0,0)); d=ImageDraw.Draw(im)
 for i in range(4):
  x=i*280;cx=x+140; lean=(i-1)*4; d.ellipse((cx-48,198,cx+48,216),fill=(20,24,28,90)); d.rectangle((cx-20,184,cx-5,208),fill=(35,30,29,255));d.rectangle((cx+5,184,cx+20,208),fill=(35,30,29,255)); d.polygon([(cx-31,112),(cx-43,194),(cx+43,194),(cx+31,112)],fill=col+(255,),outline=(24,28,32,255)); d.ellipse((cx-22,56,cx+22,101),fill=(198,145,108,255),outline=(25,28,31,255),width=4); d.polygon([(cx-31,64),(cx,43),(cx+31,64),(cx+22,78),(cx-22,78)],fill=(31,37,45,255),outline=(20,24,28,255)); d.polygon([(cx-30,106),(cx-60,132),(cx,126),(cx+60,132),(cx+30,106)],fill=col+(255,),outline=(24,28,32,255))
  if kind=='lord': d.line((cx+26,130,cx+76+lean,88),fill=(75,51,32,255),width=5); d.polygon([(cx+72+lean,88),(cx+96+lean,82),(cx+78+lean,101)],fill=(205,180,118,255))
  else: d.line((cx+26,130,cx+88+lean,92),fill=(65,44,30,255),width=6); d.polygon([(cx+84+lean,92),(cx+108+lean,86),(cx+90+lean,105)],fill=(198,171,110,255))
 im.save(p/f'{ident}-battle-{"lord" if kind=="lord" else "cavalry" if kind=="cavalry" else "spearman"}-v1.webp','WEBP',lossless=True,quality=95)
