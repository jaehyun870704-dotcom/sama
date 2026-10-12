from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).parents[1]/'packages/web/public/officers'
classes=['infantry','spearman','cavalry','heavyCav','archer','crossbow','strategist','fengshui','ram','catapult','engineer','navy','warlock','priestess','stormSage','warriorMonk','outlaw','shaman','maiden','taoist','monk','horseArcher','bandit','assassin','elephant']
palette=['#536a78','#6d5942','#80613e','#4f515b','#657849','#526a84','#655c84','#557a76']
for n,cls in enumerate(classes):
 im=Image.new('RGBA',(1024,256),(0,0,0,0));d=ImageDraw.Draw(im); col=tuple(int(palette[n%len(palette)][i:i+2],16) for i in (1,3,5))
 for i in range(4):
  x=i*256;cx=x+128; sway=(i-1)*5
  d.ellipse((cx-48,228,cx+48,242),fill=(20,24,28,80));d.rectangle((cx-18,198,cx-4,230),fill=(34,30,29,255));d.rectangle((cx+4,198,cx+18,230),fill=(34,30,29,255))
  d.polygon([(cx-32,136),(cx-43,204),(cx+43,204),(cx+32,136)],fill=col+(255,),outline=(24,28,32,255));d.ellipse((cx-22,70,cx+22,115),fill=(196,143,105,255),outline=(25,28,31,255),width=4);d.polygon([(cx-31,76),(cx,54),(cx+31,76),(cx+22,89),(cx-22,89)],fill=(34,39,46,255),outline=(20,24,28,255));d.polygon([(cx-31,124),(cx-57,151),(cx,143),(cx+57,151),(cx+31,124)],fill=col+(255,),outline=(24,28,32,255))
  if cls in ('archer','crossbow'): d.arc((cx+15,118,cx+74,180),270,90,fill=(188,143,79,255),width=5);d.line((cx+45,120,cx+45,180),fill=(218,193,131,255),width=2)
  elif cls in ('strategist','fengshui','warlock','priestess','stormSage','shaman','maiden','taoist','monk'): d.line((cx+24,148,cx+72+sway,105),fill=(122,94,58,255),width=5);d.ellipse((cx+64+sway,96,cx+82+sway,114),fill=(190,160,92,255))
  else: d.line((cx+25,150,cx+92+sway,108),fill=(61,43,31,255),width=6);d.polygon([(cx+88+sway,108),(cx+112+sway,102),(cx+94+sway,120)],fill=(190,164,108,255))
 im.save(root/f'duel-class-{cls}-v1.webp','WEBP',lossless=True,quality=95)
