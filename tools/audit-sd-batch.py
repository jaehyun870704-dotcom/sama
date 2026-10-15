"""Read-only validation of a generated SD batch (Pillow required).

Usage: python tools/audit-sd-batch.py sources.json
The source JSON is the same input used by pack-generated-sd.mjs.
"""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'packages/web/public/officers'
entries = json.loads(Path(sys.argv[1]).read_text())
issues, results = [], []
ids = [entry['id'] for entry in entries]
if len(set(ids)) != len(ids):
    issues.append('Duplicate officer IDs in batch')
approved = {'sima_yi','xiahou_yuan','zhang_liao','zhang_he','cao_pi','cao_rui','cao_cao','cao_hong','sima_shi','sima_zhao'}
if approved.intersection(ids):
    issues.append('Batch includes an approved reference officer')
for entry in entries:
    ident, version = entry['id'], entry.get('version', 4)
    for kind, cw, ch, baseline in [('sd',350,280,268), ('duel',256,256,230)]:
        path = root / f'{ident}-{kind}-v{version}.webp'
        if not path.exists():
            issues.append(f'{path.name}: missing')
            continue
        im = Image.open(path).convert('RGBA')
        if im.size != (cw*4, ch):
            issues.append(f'{path.name}: incorrect dimensions {im.size}')
            continue
        alpha = im.getchannel('A')
        if any(alpha.getpixel(point) for point in [(0,0),(cw*4-1,0),(0,ch-1),(cw*4-1,ch-1)]):
            issues.append(f'{path.name}: nontransparent canvas corners')
        for frame in range(4):
            a = alpha.crop((frame*cw,0,(frame+1)*cw,ch))
            box = a.point(lambda v:255 if v>8 else 0).getbbox()
            if not box:
                issues.append(f'{path.name}/{frame}: empty frame')
                continue
            l,t,r,b = box
            transparent = a.histogram()[0]/(cw*ch)
            if transparent < .25:
                issues.append(f'{path.name}/{frame}: background is not transparent')
            if l < 5 or r > cw-5 or t < 8 or b > baseline+1:
                issues.append(f'{path.name}/{frame}: insufficient margin {box}')
            if abs(b-baseline)>2:
                issues.append(f'{path.name}/{frame}: footline {b}, expected {baseline}')
            ratio=(r-l)/(b-t)
            # Long weapons alone may widen action poses; the idle is the card.
            if frame==0 and ratio > (1.55 if entry['mounted'] else 1.45):
                issues.append(f'{path.name}: idle is excessively wide ({ratio:.2f})')
            results.append({'id':ident,'kind':kind,'frame':frame,'box':box,'transparent':round(transparent,3),'aspect':round(ratio,3)})
print(json.dumps({'officers':len(entries),'frames':len(results),'issues':issues,'results':results},ensure_ascii=False,indent=2))
sys.exit(bool(issues))
