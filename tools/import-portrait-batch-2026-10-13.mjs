import sharp from 'sharp';
import path from 'node:path';

const generated='C:/Users/kjh87/.codex/generated_images/01a132a5-1de2-7953-8ab5-67946b9364cd';
const out=path.join(process.cwd(),'packages/web/public/portraits');
const files={
  'yan-yan-v1.webp':'exec-86799272-3257-4fea-973d-3148b484fc25.png',
  'li-hui-v1.webp':'exec-d2f0b1ae-4178-40a2-ad6f-bc6722ff5ea4.png',
  'hermit-v1.webp':'exec-ebfcb807-f1be-4196-b7d9-945186defcca.png',
  'jin-xiang-v1.webp':'exec-a66f21c1-2473-48f0-8248-4d08dddd16e5.png',
  'liu-shan-v1.webp':'exec-7735fd64-bbf7-48b7-baf8-d60e7e785625.png',
  'zhuge-jun-v2.webp':'exec-b809779a-b993-4a9c-afd9-89e51321f468.png',
  'liu-qi-v2.webp':'exec-b245fff9-767a-4be6-b40e-ab7bc70fac06.png',
  'guan-xing-v2.webp':'exec-1500320c-5d36-4705-913c-502a9a1d16aa.png',
  'zhang-bao-v2.webp':'exec-de872905-0d3b-4bfd-be46-feb01d5c034f.png',
  'cui-liang-v2.webp':'exec-274ddc85-dec4-40cd-bf2c-f5d2ca056459.png',
  'yu-fan-v2.webp':'exec-eb66ab11-41bd-4ae0-96e8-426f793e6e67.png',
  'ma-jun-v2.webp':'exec-1fced96e-ef48-4437-a77d-3c01670b753b.png',
  'gao-ding-v2.webp':'exec-c07764e0-7053-498d-b2f5-73a2a6c66836.png',
  'e-huan-v2.webp':'exec-0c37b729-90f8-466e-b0b3-7d925de2a373.png',
  'yang-yi-v2.webp':'exec-e3e72dd7-55af-403f-8a45-a5da2c842188.png',
};

for(const [name,source] of Object.entries(files)){
  await sharp(path.join(generated,source)).resize(1024,1024,{fit:'cover'}).webp({quality:94,effort:6}).toFile(path.join(out,name));
}
