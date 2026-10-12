from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).parents[1]/'packages/web/public/officers'
portrait=Image.open(Path(__file__).parents[1]/'packages/web/public/portraits/yu-ji.webp').convert('RGBA')
portrait.thumbnail((900,900))
bust=Image.new('RGBA',(3072,1024),(0,0,0,0))
for i in range(3):
    p=portrait.copy(); p.thumbnail((900,900)); x=i*1024+(1024-p.width)//2; y=40
    px=p.load()
    for yy in range(p.height):
      for xx in range(p.width):
        r,g,b,a=px[xx,yy]
        if r<55 and g<50 and b<45: px[xx,yy]=(r,g,b,0)
    bust.alpha_composite(p,(x,y))
bust.save(root/'yu_ji-bust-v1.webp','WEBP',lossless=True,quality=95)
duel=Image.new('RGBA',(1024,256),(0,0,0,0)); d=ImageDraw.Draw(duel)
for i in range(4):
 x=i*256; cx=x+128; lean=(i-1)*5
 d.ellipse((cx-45,228,cx+45,242),fill=(20,24,28,80)); d.polygon([(cx-32,125),(cx-48,210),(cx+48,210),(cx+32,125)],fill=(130,53,66,255),outline=(28,24,28,255)); d.ellipse((cx-20,62,cx+20,105),fill=(205,153,119,255),outline=(30,24,28,255),width=3); d.polygon([(cx-26,70),(cx,48),(cx+26,70),(cx+18,84),(cx-18,84)],fill=(30,28,34,255)); d.line((cx+22,145,cx+76+lean,94-i*3),fill=(80,55,34,255),width=5); d.polygon([(cx+72+lean,94-i*3),(cx+96+lean,88-i*3),(cx+78+lean,107-i*3)],fill=(210,180,120,255)); d.line((cx-22,130,cx-58,110+i*5),fill=(170,44,58,255),width=4)
duel.save(root/'yu_ji-duel-v1.webp','WEBP',lossless=True,quality=95)
