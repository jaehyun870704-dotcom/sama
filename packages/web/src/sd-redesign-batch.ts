/** 2026-10-15: 사마의(도보)·장료(기마) 기준으로 다시 그린 첫 30명. */
export const SD_REDESIGN_BATCH = [
  ['yuan_shu','원술',true],['yuan_shao','원소',true],['yuan_tan','원담',true],
  ['dong_zhuo','동탁',true],['hua_xiong','화웅',false],['gongsun_zan','공손찬',true],
  ['zhang_jiao','장각',false],['gao_shun','고순',false],['ma_teng','마등',true],
  ['liu_biao','유표',true],['zhang_ren','장임',false],['gao_lan','고람',true],
  ['jia_xu','가후',false],['pang_de','방덕',true],['guo_jia','곽가',false],
  ['dian_wei','전위',false],['xun_you','순유',false],['cheng_yu','정욱',false],
  ['wen_qin','문흠',false],['wen_yang','문앙',true],['cao_zhang','조창',true],
  ['lu_su','노숙',false],['gan_ning','감녕',false],['taishi_ci','태사자',true],
  ['sun_jian','손견',true],['sun_ce','손책',true],['zhou_tai','주태',false],
  ['ling_tong','능통',true],['lu_kang','육항',false],['gao_shou','고수',false],
] as const;
export const SD_REDESIGN_VERSION=4;

/** 2차 50명: 누락 15명과 배경·체형 오류 장수. 1차/승인본은 유지한다. */
export const SD_REDESIGN_BATCH_02 = [
  ['wang_yi','왕이',false],
  ['sun_shangxiang','손상향',true],
  ['bian_shi','변씨',false],
  ['bu_lianshi','보연사',false],
  ['guan_yinping','관은병',false],
  ['bao_sanliang','포삼랑',false],
  ['lingqi','여령기',true],
  ['ma_yunlu','마운록',true],
  ['xin_xianying','신헌영',false],
  ['wang_yuanji','왕원희',false],
  ['da_qiao','대교',false],
  ['xiao_qiao','소교',false],
  ['xiahou_shi','하후씨',false],
  ['dong_bai','동백',false],
  ['cai_wenji','채문희',false],
  ['gongsun_yuan','공손연',true],
  ['yuan_shang','원상',true],
  ['cao_xiu','조휴',true],
  ['yu_jin','우금',false],
  ['xu_sheng','서성',false],
  ['lu_bu','여포',true],
  ['sun_quan','손권',true],
  ['ma_chao','마초',true],
  ['guan_yu','관우',true],
  ['zhang_fei','장비',true],
  ['liu_bei','유비',true],
  ['xu_huang','서황',true],
  ['xun_yu','순욱',false],
  ['huang_gai','황개',false],
  ['hao_zhao','학소',false],
  ['wen_ping','문빙',false],
  ['ding_feng','정봉',false],
  ['zhuge_ke','제갈각',false],
  ['wang_ling','왕릉',false],
  ['zhang_ba','장패',true],
  ['meng_yan','맹염',true],
  ['bi_yan','비연',true],
  ['ju_shou','저수',false],
  ['tian_feng','전풍',false],
  ['shen_pei','심배',false],
  ['cao_zhi','조식',false],
  ['feng_ji','봉기',false],
  ['han_dang','한당',false],
  ['zhang_qin','장흠',false],
  ['pan_zhang','반장',true],
  ['diaochan','초선',false],
  ['zhen_shi','견씨',false],
  ['li_jue','이각',true],
  ['guo_si','곽사',true],
  ['xiang_yu','항우',true]
] as const;
export const SD_REDESIGN_VERSION_02=6;
export const SD_REDESIGN_OFFICERS=[...SD_REDESIGN_BATCH,...SD_REDESIGN_BATCH_02] as const;
export const SD_REDESIGN_GROUPS=[
  {version:SD_REDESIGN_VERSION,officers:SD_REDESIGN_BATCH},
  {version:SD_REDESIGN_VERSION_02,officers:SD_REDESIGN_BATCH_02},
] as const;
export const SD_REDESIGN_VERSIONS:Readonly<Record<string,readonly [number,number]>>=Object.fromEntries(
  SD_REDESIGN_GROUPS.flatMap(group=>group.officers.map(([id])=>[id,[group.version,group.version] as const])),
);
