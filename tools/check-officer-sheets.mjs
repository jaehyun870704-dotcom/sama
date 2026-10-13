import {readdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve('packages/web/public/officers');
const requested=process.argv.slice(2);
const unifiedIds=[
  'zhuge_jin','meng_da','sima_lang','sima_fang','sima_shi','sima_zhao','sima_yi','z_jun','cao_zhen','jian_yong',
  'gao_xiang','guan_suo','guan_xing','deng_zhi','ma_dai','ma_liang','ma_su','mi_fang','mi_zhu','fa_zheng',
  'fei_yi','sun_qian','yang_yi','yan_yan','wu_ban','wu_yi','wang_ping','liao_hua','wei_yan','liu_feng',
  'li_yan','yi_ji','jiang_wan','zhang_yi','zhang_bao','zhou_cang','chen_shi','huang_quan','huang_yueying',
];
const files=requested[0]==='--all'
  ?(await readdir(root)).filter(name=>/-sd-v\d+\.webp$|-duel-v\d+\.webp$/.test(name)).map(name=>path.join(root,name))
  :requested.length?requested:unifiedIds.flatMap(id=>[path.join(root,`${id}-sd-v1.webp`),path.join(root,`${id}-duel-v2.webp`)]);
const problems=[];
for(const file of files){
  const type=/-sd-v\d+\.webp$/.test(file)?'sd':'duel',expected=type==='sd'?[1400,280,350,268]:[1024,256,256,230];
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==expected[0]||info.height!==expected[1]){problems.push({file:path.basename(file),issue:'size',actual:[info.width,info.height],expected:expected.slice(0,2)});continue;}
  for(let cell=0;cell<4;cell++){
    let minX=expected[2],maxX=-1,minY=info.height,maxY=-1,edge=0,count=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<expected[2];x++){
      const alpha=data[(y*info.width+cell*expected[2]+x)*4+3];if(alpha<12)continue;
      count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      if(x<8||x>=expected[2]-8||y<8||y>=info.height-4)edge++;
    }
    if(!count){problems.push({file:path.basename(file),cell,issue:'empty'});continue;}
    const center=(minX+maxX)/2,offset=Math.round(center-expected[2]/2);
    if(edge)problems.push({file:path.basename(file),cell,issue:'edge-alpha',pixels:edge});
    if(Math.abs(offset)>expected[2]*.08)problems.push({file:path.basename(file),cell,issue:'off-center',offset});
    if(Math.abs(maxY-expected[3])>3)problems.push({file:path.basename(file),cell,issue:'baseline',actual:maxY,expected:expected[3]});
  }
}
console.log(JSON.stringify(problems,null,2));
process.exitCode=problems.length?1:0;
