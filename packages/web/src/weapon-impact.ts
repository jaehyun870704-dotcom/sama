import {familyOf,type Unit} from '../../core/src/index.ts';
import {gearDef,gearBaseId,GEAR_KINDS} from '../../core/src/index.ts';

/** 전투 효과가 따라 그릴 무기 실루엣. 이름 있는 장수는 고유 무기를 가장 먼저 따른다. */
export type WeaponShape='sword'|'blade'|'spear'|'polearm'|'axe'|'bow'|'crossbow'|'blunt'|'fan'|'siege';
export type WeaponImpact='slash'|'cleave'|'pierce'|'arrow'|'bolt'|'blunt'|'fan';

/** 고유 보물 가운데 종류와 다른 실루엣을 쓰는 것(방천화극·청룡언월도는 긴 날, 금화관포는 쏘는 동작). */
const NAMED_SHAPE:Record<string,WeaponShape>={halberd:'polearm',greenDragon:'polearm',goldFireCannon:'crossbow',ancientBlade:'blade'};
const KIND_SHAPE:Partial<Record<string,WeaponShape>>={sword:'sword',sacredSword:'sword',spear:'spear',bow:'bow',club:'blunt',fan:'fan'};

/** 연의에서 실루엣이 분명한 장수는 병종의 범용 무기보다 고유 주무기를 우선한다. */
const SIGNATURE:Record<string,WeaponShape>={
  sima_yi:'fan',sima_lang:'fan',sima_fang:'fan',sima_shi:'sword',sima_zhao:'sword',
  cao_cao:'sword',cao_zhen:'sword',cao_pi:'sword',cao_rui:'sword',cao_ren:'blade',cao_xiu:'spear',cao_hong:'blade',cao_zhang:'spear',
  xiahou_dun:'spear',xiahou_yuan:'bow',xu_chu:'blunt',zhang_liao:'polearm',xu_huang:'axe',zhang_he:'spear',yu_jin:'spear',yue_jin:'blade',deng_ai:'sword',zhong_hui:'fan',hao_zhao:'crossbow',wen_ping:'spear',jia_xu:'fan',xun_yu:'fan',
  liu_bei:'sword',guan_yu:'polearm',zhang_fei:'spear',zhao_yun:'spear',ma_chao:'spear',huang_zhong:'bow',wei_yan:'blade',jiang_wei:'spear',wooden_zhuge:'fan',pang_tong:'fan',xu_shu:'fan',guan_ping:'blade',ma_dai:'spear',
  lu_bu:'polearm',yan_liang:'polearm',wen_chou:'spear',ju_shou:'fan',tian_feng:'fan',shen_pei:'fan',
  sun_quan:'sword',zhou_yu:'sword',lu_meng:'blade',lu_xun:'sword',gan_ning:'blade',xu_sheng:'spear',ding_feng:'blade',
  xiang_yu:'polearm',liu_bang:'sword',han_xin:'sword',zhang_liang:'fan',xiao_he:'fan',ying_bu:'polearm',peng_yue:'blade',fan_kuai:'axe',chen_ping:'fan',fan_zeng:'fan',zhongli_mo:'spear',ji_bu:'blade',
  '사마의':'fan','사마랑':'fan','사마방':'fan','사마사':'sword','사마소':'sword',
  '조조':'sword','조진':'sword','조비':'sword','조예':'sword','조인':'blade','조휴':'spear','조홍':'blade','조창':'spear',
  '하후돈':'spear','하후연':'bow','허저':'blunt','장료':'polearm','서황':'axe','장합':'spear','우금':'spear','악진':'blade','등애':'sword','종회':'fan','학소':'crossbow','문빙':'spear','가후':'fan','순욱':'fan',
  '유비':'sword','관우':'polearm','장비':'spear','조운':'spear','마초':'spear','황충':'bow','위연':'blade','강유':'spear','제갈량':'fan','방통':'fan','서서':'fan','관평':'blade','마대':'spear',
  '여포':'polearm','안량':'polearm','문추':'spear','저수':'fan','전풍':'fan','심배':'fan',
  '손권':'sword','주유':'sword','여몽':'blade','육손':'sword','감녕':'blade','서성':'spear','정봉':'blade',
  '항우':'polearm','유방':'sword','한신':'sword','장량':'fan','소하':'fan','영포':'polearm','팽월':'blade','번쾌':'axe','진평':'fan','범증':'fan','종리매':'spear','계포':'blade'
};

export function equippedWeaponShape(id?:string):WeaponShape|undefined{
  if(!id)return undefined;const base=gearBaseId(id);if(NAMED_SHAPE[base])return NAMED_SHAPE[base];
  const d=gearDef(id);if(!d||GEAR_KINDS[d.kind].slot!=='weapon')return undefined;return KIND_SHAPE[d.kind];
}

export function weaponShape(u:Pick<Unit,'id'|'name'|'unitClass'>,equippedWeapon?:string):WeaponShape{
  const family=familyOf(u.unitClass);
  if(family==='catapult'||family==='ram')return 'siege';
  const signature=SIGNATURE[u.id]??SIGNATURE[u.name],equipped=equippedWeaponShape(equippedWeapon);
  // 원거리 병종(사거리 2 이상)은 고유 무기가 칼이어도 쏘는 동작을 지킨다 — 두세 칸 밖에서 칼을 휘두르면 안 된다.
  if(family==='archer'||family==='horseArcher'||family==='crossbow'){const pref=signature??equipped;return pref==='bow'||pref==='crossbow'?pref:family==='crossbow'?'crossbow':'bow';}
  if(signature)return signature;
  if(equipped)return equipped;
  if(family==='spearman'||family==='cavalry'||family==='heavyCav')return 'spear';
  if(family==='strategist'||family==='fengshui')return 'fan';
  if(family==='monk')return 'blunt';
  return 'blade';
}

export function weaponImpact(shape:WeaponShape):WeaponImpact{
  if(shape==='sword'||shape==='blade')return 'slash';
  if(shape==='polearm'||shape==='axe')return 'cleave';
  if(shape==='spear')return 'pierce';
  if(shape==='bow')return 'arrow';
  if(shape==='crossbow')return 'bolt';
  if(shape==='fan')return 'fan';
  return 'blunt';
}
