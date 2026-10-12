from PIL import Image
from pathlib import Path
import json
p=Path(__file__).parents[1]/'packages/web/public/officers'
bad=[]; total=0
for f in p.glob('*-battle-*.webp'):
    im=Image.open(f).convert('RGBA'); rows=im.height//224; cols=4
    if im.width not in (1120,1400): bad.append((f.name,'width',im.size)); continue
    for r in range(rows):
      for c in range(cols):
        cell=im.crop((c*im.width//4,r*224,(c+1)*im.width//4,(r+1)*224)); a=cell.getchannel('A'); box=a.getbbox(); total+=1
        if box and (box[0]<8 or box[1]<8 or box[2]>cell.width-8 or box[3]>cell.height-8): bad.append((f.name,f'cell {r},{c}',box))
print(json.dumps({'cells':total,'issues':bad},ensure_ascii=False,indent=2))
