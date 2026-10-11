/**
 * 이름 있는 장수의 전장 전신 원화.
 *
 * 각 파일은 투명 바탕의 정사각 전신화다. 전용 그림이 있으면 병종 시트보다
 * 먼저 사용하고, 공격·이동은 기존 전장 트윈으로 움직인다.
 */
export const officerBattleArt = {
  '가후':'officers/jia-xu.webp',
  '우금':'officers/yu-jin.webp',
  '악진':'officers/yue-jin.webp',
  '등애':'officers/deng-ai.webp',
  '종회':'officers/zhong-hui.webp',
  '학소':'officers/hao-zhao.webp',
  '조홍':'officers/cao-hong.webp',
  '조창':'officers/cao-zhang.webp',
  '문빙':'officers/wen-ping.webp',
  '관평':'officers/guan-ping.webp',
  '마대':'officers/ma-dai.webp',
  '서성':'officers/xu-sheng.webp',
  '정봉':'officers/ding-feng.webp',
  '안량':'officers/yan-liang.webp',
  '문추':'officers/wen-chou.webp',
  '저수':'officers/ju-shou.webp',
  '전풍':'officers/tian-feng.webp',
  '심배':'officers/shen-pei.webp',
  '한신':'officers/han-xin.webp',
  '장량':'officers/zhang-liang.webp',
  '소하':'officers/xiao-he.webp',
  '영포':'officers/ying-bu.webp',
  '팽월':'officers/peng-yue.webp',
  '번쾌':'officers/fan-kuai.webp',
  '진평':'officers/chen-ping.webp',
  '범증':'officers/fan-zeng.webp',
  '종리매':'officers/zhongli-mo.webp',
  '계포':'officers/ji-bu.webp',
} as const;

export type PaintedBattleOfficer = keyof typeof officerBattleArt;
export function officerBattleURL(name:string){return officerBattleArt[name as PaintedBattleOfficer];}

