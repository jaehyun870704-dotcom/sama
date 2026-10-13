import sharp from 'sharp';
import path from 'node:path';

const root=process.cwd(),dir=path.join(root,'packages/web/public/officers');
const cushionSource='C:/Users/kjh87/.codex/generated_images/01a132a5-1de2-7953-8ab5-67946b9364cd/exec-2ad74d3e-3f49-400b-9d7d-3d50b4fab974.png';
const ids='cao_cao,cao_pi,cao_zhen,chen_gong,deng_ai,guo_huai,hu_zun,lu_bu,ma_chao,meng_da,sima_fang,sima_fu,sima_lang,sima_shi,sima_yi,sima_zhao,sun_quan,xu_chu,zhang_he,zhong_hui,zhou_yu,zhuge_liang'.split(',');

async function cushion(row,cell){
  const meta=await sharp(cushionSource).metadata(),third=Math.floor(meta.width/3),left=row===2?third*2:third*row,width=row===2?meta.width-left:third;
  const isolated=await sharp(cushionSource).extract({left,top:0,width,height:meta.height}).png().toBuffer();
  return sharp(isolated).trim({background:{r:0,g:0,b:0,alpha:0}})
    .resize({width:Math.round(cell*(row===2?.70:.74)),height:Math.round(cell*(row===2?.15:.19)),fit:'fill'})
    .png().toBuffer();
}

for(const id of ids){
  const input=path.join(dir,`${id}-story-v1.webp`),meta=await sharp(input).metadata(),cell=meta.height/3;
  if(meta.width!==cell*8)throw new Error(`${id}: expected 8 columns`);
  const original=await sharp(input).png().toBuffer(),parts=[];
  for(let row=0;row<3;row++){
    const stand=await sharp(input).extract({left:0,top:row*cell,width:cell,height:cell}).png().toBuffer();
    const kneel=await sharp(input).extract({left:cell*5,top:row*cell,width:cell,height:cell}).png().toBuffer();
    const split=Math.round(cell*.5),upperH=Math.round(cell*.67),drop=Math.round(cell*.09);
    const upper=await sharp(stand).extract({left:0,top:0,width:cell,height:upperH}).png().toBuffer();
    const lower=await sharp(kneel).extract({left:0,top:split,width:cell,height:cell-split}).png().toBuffer();
    const pad=await cushion(row,cell),padMeta=await sharp(pad).metadata();
    const sitting=await sharp({create:{width:cell,height:cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite([
        {input:pad,left:Math.round((cell-padMeta.width)/2),top:Math.round(cell*.77)},
        {input:lower,left:0,top:split},
        {input:upper,left:0,top:drop},
      ]).png().toBuffer();
    parts.push({input:sitting,left:cell*8,top:row*cell});
  }
  await sharp({create:{width:cell*9,height:cell*3,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:original,left:0,top:0},...parts]).webp({quality:94,effort:6}).toFile(path.join(dir,`${id}-story-v2.webp`));
}
