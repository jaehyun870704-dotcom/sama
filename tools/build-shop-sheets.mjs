import sharp from 'sharp';
import path from 'node:path';

const root=process.cwd();
const generated='C:/Users/kjh87/.codex/generated_images/01a132a5-1de2-7953-8ab5-67946b9364cd';
const outDir=path.join(root,'packages/web/public/shop-items');
const CELL_W=272,CELL_H=272,SHEET_W=816,SHEET_H=1088;

const sources=[
  {
    file:path.join(generated,'exec-e14436b7-5e99-48fe-9b49-2588cca2e0cb.png'),
    // The generator returned a regular 4×3 source; reflow it to 3×4.
    boxes:Array.from({length:12},(_,i)=>({left:(i%4)*307,top:Math.floor(i/4)*426,width:i%4===3?309:307,height:Math.floor(i/4)===2?426:426})),
  },
  {
    file:path.join(generated,'exec-88c9ffb7-66a2-44b8-9d22-53eb5d789833.png'),
    // The source is visually grouped 4 / 3 / 5. Each box contains one whole item.
    boxes:[
      {left:0,top:0,width:384,height:300},{left:384,top:0,width:384,height:300},{left:768,top:0,width:384,height:300},{left:1152,top:0,width:384,height:300},
      {left:0,top:300,width:430,height:360},{left:430,top:330,width:440,height:330},{left:900,top:330,width:420,height:330},
      {left:0,top:650,width:330,height:374},{left:315,top:650,width:300,height:374},{left:595,top:660,width:300,height:364},{left:875,top:660,width:300,height:364},{left:1170,top:650,width:366,height:374},
    ],
  },
  {
    file:path.join(generated,'exec-918e899f-cd61-4daf-8061-cc22a427da67.png'),
    boxes:[
      {left:0,top:0,width:512,height:410},{left:512,top:0,width:512,height:410},{left:1024,top:0,width:512,height:410},
      {left:0,top:410,width:512,height:390},{left:512,top:410,width:512,height:390},{left:1024,top:410,width:512,height:390},
    ],
  },
];

const bg={r:3,g:47,b:35,alpha:1};
async function cell(file,box){
  const inner=await sharp(file).extract(box).resize({width:246,height:246,fit:'contain',background:bg}).webp({quality:94}).toBuffer();
  return sharp({create:{width:CELL_W,height:CELL_H,channels:4,background:bg}}).composite([{input:inner,left:13,top:13}]).png().toBuffer();
}

await sharp({create:{width:1,height:1,channels:4,background:bg}}).toBuffer();
for(let sheet=0;sheet<sources.length;sheet++){
  const src=sources[sheet];
  const cells=await Promise.all(src.boxes.map(b=>cell(src.file,b)));
  const canvas=sharp({create:{width:SHEET_W,height:SHEET_H,channels:4,background:bg}});
  await canvas.composite(cells.map((input,i)=>({input,left:(i%3)*CELL_W,top:Math.floor(i/3)*CELL_H})))
    .webp({quality:94,effort:6})
    .toFile(path.join(outDir,`shop-items-${String(sheet+1).padStart(2,'0')}-v1.webp`));
}
