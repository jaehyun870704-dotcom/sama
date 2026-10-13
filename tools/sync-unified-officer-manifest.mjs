import {readFile,writeFile} from 'node:fs/promises';

const file=new URL('../packages/web/public/officers/manifest.json',import.meta.url);
const entries=[
  ['zhuge_jin','제갈근'],['meng_da','맹달'],['sima_lang','사마랑'],['sima_fang','사마방'],['sima_shi','사마사'],['sima_zhao','사마소'],['sima_yi','사마의'],['z_jun','제갈균'],['cao_zhen','조진'],['jian_yong','간옹'],
  ['gao_xiang','고상'],['guan_suo','관색'],['guan_xing','관흥'],['deng_zhi','등지'],['ma_dai','마대'],['ma_liang','마량'],['ma_su','마속'],['mi_fang','미방'],['mi_zhu','미축'],['fa_zheng','법정'],
  ['fei_yi','비의'],['sun_qian','손건'],['yang_yi','양의'],['yan_yan','엄안'],['wu_ban','오반'],['wu_yi','오의'],['wang_ping','왕평'],['liao_hua','요화'],['wei_yan','위연'],['liu_feng','유봉'],
  ['li_yan','이엄'],['yi_ji','이적'],['jiang_wan','장완'],['zhang_yi','장익'],['zhang_bao','장포'],['zhou_cang','주창'],['chen_shi','진식'],['huang_quan','황권'],['huang_yueying','황월영'],
];
const manifest=JSON.parse(await readFile(file,'utf8'));
for(const [id,name] of entries){
  let officer=manifest.officers.find(entry=>entry.id===id);
  if(!officer){officer={id,name,aliases:[`${name}의 환영`],battle:{}};manifest.officers.push(officer);}
  officer.battle={sd:{sheet:`${id}-sd-v1.webp`,cell:[350,280],rows:1}};
  officer.duel=`${id}-duel-v2.webp`;
}
await writeFile(file,`${JSON.stringify(manifest,null,2)}\n`);
