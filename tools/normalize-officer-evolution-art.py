from PIL import Image
from pathlib import Path
p=Path(__file__).parents[1]/'packages/web/public/officers'
for f in p.glob('*-battle-*.webp'):
    im=Image.open(f)
    if im.size==(1400,280):
        im.resize((1120,224),Image.Resampling.LANCZOS).save(f,'WEBP',lossless=True,quality=95)
