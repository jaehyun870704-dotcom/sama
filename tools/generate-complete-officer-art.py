from PIL import Image,ImageEnhance,ImageDraw
from pathlib import Path
root=Path(__file__).parents[1]/'packages/web/public'; officers=root/'officers'; portraits=root/'portraits'
ids=['sun_jian','sun_ce','taishi_ci','cheng_pu','zhou_tai','ling_tong','yuan_shao','dong_zhuo','hua_xiong','gongsun_zan','zhang_jiao','gao_shun','ma_teng','liu_biao','xu_shu','zhang_ren','zhou_cang','jian_yong','mi_zhu','sun_qian','liao_hua','zhang_yi','li_yan','chen_shi','deng_zhi','wen_yang','zhang_chunhua','zhen_shi','wang_shuang','wen_qin','han_dang','zhang_qin','pan_zhang','lu_kang','diaochan','li_jue','guo_si','yuan_shu']
base=Image.open(portraits/'yu-ji.webp').convert('RGBA')
for n,ident in enumerate(ids):
    tint=ImageEnhance.Color(base).enhance(.55+(n%5)*.12); tint=ImageEnhance.Brightness(tint).enhance(.82+(n%4)*.06); tint.thumbnail((512,512)); tint.save(portraits/f'{ident}.webp','WEBP',lossless=True,quality=92)
    b=Image.new('RGBA',(3072,1024),(0,0,0,0))
    for i in range(3):
        p=tint.copy(); p.thumbnail((900,900)); x=i*1024+(1024-p.width)//2; b.alpha_composite(p,(x,40))
    b.save(officers/f'{ident}-bust-v1.webp','WEBP',lossless=True,quality=92)
    dimg=Image.new('RGBA',(1024,256),(0,0,0,0)); d=ImageDraw.Draw(dimg); col=(80+(n*17)%100,45+(n*11)%70,55+(n*7)%90,255)
    for i in range(4):
        x=i*256; cx=x+128; lean=(i-1)*5; d.ellipse((cx-46,228,cx+46,242),fill=(20,24,28,80)); d.polygon([(cx-32,125),(cx-48,210),(cx+48,210),(cx+32,125)],fill=col,outline=(28,24,28,255)); d.ellipse((cx-20,62,cx+20,105),fill=(200,148,112,255),outline=(30,24,28,255),width=3); d.polygon([(cx-26,70),(cx,48),(cx+26,70),(cx+18,84),(cx-18,84)],fill=(30,28,34,255)); d.line((cx+22,145,cx+76+lean,94-i*3),fill=(80,55,34,255),width=5); d.polygon([(cx+72+lean,94-i*3),(cx+96+lean,88-i*3),(cx+78+lean,107-i*3)],fill=(210,180,120,255))
    dimg.save(officers/f'{ident}-duel-v1.webp','WEBP',lossless=True,quality=92)
