from PIL import Image, ImageDraw
from pathlib import Path

root=Path(__file__).parents[1]/'packages/web/public/officers'
data={
'sun_jian':('#b84b3a','spear'),'sun_ce':('#c85d39','sword'),'taishi_ci':('#4e83b8','spear'),'cheng_pu':('#80643f','spear'),'zhou_tai':('#704b38','sword'),'ling_tong':('#4a6c9c','sword'),
'yuan_shao':('#8d3150','lord'),'dong_zhuo':('#542a36','lord'),'hua_xiong':('#8b3e2f','heavy'),'gongsun_zan':('#d3c7b0','spear'),'zhang_jiao':('#7a5aa6','staff'),'gao_shun':('#455064','sword'),'ma_teng':('#9a5d35','spear'),'liu_biao':('#4f6b43','lord'),'xu_shu':('#527a8c','staff'),
'zhang_ren':('#5f7a42','spear'),'zhou_cang':('#405879','sword'),'jian_yong':('#8a6b44','staff'),'mi_zhu':('#88683d','lord'),'sun_qian':('#536d8b','staff'),'liao_hua':('#5d5d67','sword'),'zhang_yi':('#386c72','spear'),'li_yan':('#5b6e9b','staff'),'chen_shi':('#5c6a45','spear'),'deng_zhi':('#4b7690','staff'),
'wen_yang':('#b06f3d','spear'),'zhang_chunhua':('#536c9b','staff'),'zhen_shi':('#a96c88','fan'),'wang_shuang':('#5a4d4d','heavy'),'wen_qin':('#74513e','spear'),'han_dang':('#6d7645','bow'),'zhang_qin':('#3e6870','sword'),'pan_zhang':('#76553a','spear'),'lu_kang':('#4c7088','staff'),'diaochan':('#a85c7d','fan'),'li_jue':('#65443f','sword'),'guo_si':('#704937','sword'),'yuan_shu':('#8d5361','lord')}

def sheet(path,color,weapon):
    im=Image.new('RGBA',(1120,224),(0,0,0,0)); d=ImageDraw.Draw(im)
    for i in range(4):
        x=i*280; cx=x+140; shift=(i-1)*4
        # shadow, boots, robe, head and plume; compact SD silhouette
        d.ellipse((cx-47,x*0+198,cx+47,216),fill=(20,24,28,90))
        d.polygon([(cx-32,150),(cx-43,199),(cx+43,199),(cx+32,150)],fill=color+(255,))
        d.rectangle((cx-21,193,cx-7,211),fill=(35,31,32,255)); d.rectangle((cx+7,193,cx+21,211),fill=(35,31,32,255))
        d.ellipse((cx-22,78,cx+22,122),fill=(196,143,105,255),outline=(25,28,31,255),width=4)
        d.polygon([(cx-31,82),(cx,62),(cx+31,82),(cx+22,94),(cx-22,94)],fill=(32,39,46,255),outline=(20,24,28,255))
        d.polygon([(cx-30,126),(cx-62,151),(cx-45,165),(cx,145),(cx+45,165),(cx+62,151),(cx+30,126)],fill=color+(255,),outline=(24,28,32,255))
        # right-facing weapon
        if weapon in ('spear','sword','heavy'):
            d.line((cx+28,150,cx+92+shift,108-i*5),fill=(62,43,30,255),width=6)
            d.polygon([(cx+88+shift,109-i*5),(cx+112+shift,103-i*5),(cx+94+shift,121-i*5)],fill=(190,164,108,255))
        elif weapon=='bow':
            d.arc((cx+20,122,cx+78,180),270,90,fill=(182,138,78,255),width=5); d.line((cx+49,125,cx+49,177),fill=(214,190,130,255),width=2)
        else:
            d.line((cx+25,147,cx+67+shift,112),fill=(120,95,60,255),width=5); d.ellipse((cx+58+shift,103,cx+77+shift,122),fill=(185,159,93,255))
    im.save(path,'WEBP',lossless=True,quality=95)

classes={'heavy':'heavyCav','staff':'strategist','fan':'dancer','lord':'lord','spear':'spearman','sword':'infantry','bow':'archer'}
for ident,(col,weap) in data.items(): sheet(root/f'{ident}-battle-{classes[weap]}-v1.webp',tuple(int(col[i:i+2],16) for i in (1,3,5)),weap)
