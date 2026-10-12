/** 병종 진화표 "장수" 탭의 진영 구분(위·촉·오·군웅). 전용 전투 그림이 있는 장수와, 그림이 들어올 군주를 미리 적어 둔다. */
export type OfficerFaction='위'|'촉'|'오'|'군웅';
export const OFFICER_FACTIONS:readonly OfficerFaction[]=['위','촉','오','군웅'];
const of=(f:OfficerFaction,...ids:string[])=>ids.map(id=>[id,f] as const);
export const OFFICER_FACTION:Record<string,OfficerFaction>=Object.fromEntries([
  ...of('위','sima_fu','hu_zun','sima_yi','sima_yi_young','cao_zhen','sima_lang','sima_fang','sima_shi','sima_zhao','cao_cao','cao_pi','cao_rui','xu_chu','xiahou_dun','xiahou_yuan','zhang_liao','xu_huang','zhang_he','cao_ren','xun_yu','meng_da','wang_ling','guo_huai','cao_xiu','cao_shuang','jia_xu','yu_jin','yue_jin','deng_ai','zhong_hui','hao_zhao','cao_hong','cao_zhang','wen_ping'),
  ...of('촉','liu_bei','guan_yu','zhang_fei','wooden_zhuge','zhao_yun','huang_zhong','wei_yan','jiang_wei','pang_tong','ma_chao','ma_su','wang_ping','gao_xiang','meng_yan','dai_ling','guan_ping','ma_dai'),
  ...of('오','sun_quan','zhou_yu','lu_xun','lu_meng','gan_ning','lu_su','huang_gai','lu_fan','sun_shao','zhu_ran','zhuge_ke','zhang_zhao','zhuge_jin','zhang_ba','xu_sheng','ding_feng'),
  ...of('군웅','lu_bu','xiang_yu','chen_gong','meng_huo','zhu_rong','gongsun_yuan','yuan_tan','yuan_shang','liu_bang','yang_ang','bi_yan','gao_shou','yan_liang','wen_chou','ju_shou','tian_feng','shen_pei','han_xin','zhang_liang','xiao_he','ying_bu','peng_yue','fan_kuai','chen_ping','fan_zeng','zhongli_mo','ji_bu','yu_ji','long_ju'),
]);
