import sharp from 'sharp';
import path from 'node:path';

const root=process.cwd();
const generated='C:/Users/kjh87/.codex/generated_images/01a132a5-1de2-7953-8ab5-67946b9364cd';
const publicDir=path.join(root,'packages/web/public');

const backgrounds=[
  ['exec-49d35564-4528-45db-a57c-ca40385ff4a9.png','story-council-day-v1.webp'],
  ['exec-d37437fd-db62-4f97-9ea1-45a0b6e45c12.png','story-banquet-day-v1.webp'],
  ['exec-4ec9454e-74dd-4bb0-b4f6-43ca25938791.png','story-prison-day-v1.webp'],
  ['exec-f66ccb8a-1897-4a9f-98d1-709deba447bb.png','story-office-day-v1.webp'],
];

for(const [source,file] of backgrounds){
  await sharp(path.join(generated,source))
    .resize(1600,900,{fit:'cover',position:'centre'})
    .webp({quality:94,effort:6})
    .toFile(path.join(publicDir,file));
}

await sharp(path.join(generated,'exec-3c105e49-56bf-40f0-bde3-4adb42f502c6.png'))
  .trim({background:{r:0,g:0,b:0,alpha:0}})
  .resize(920,920,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}})
  .extend({
    top:52,bottom:52,left:52,right:52,
    background:{r:0,g:0,b:0,alpha:0},
  })
  .webp({quality:96,alphaQuality:100,effort:6})
  .toFile(path.join(publicDir,'story-props','horse-idle-v1.webp'));
