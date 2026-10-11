/**
 * 조조전 규칙(규칙판 5)을 전장의 부대에 입힌다.
 * 장수 능력 = 연의 무력·지력·통솔 + 연의 인물상으로 정한 민첩·운. 표에 없는 장수는 연의 능력으로 어림한다.
 * 일반 병사는 병과 등급으로 정한 능력(S 80 · A 70 · B 60 · C 40)을 쓴다.
 * 이미 맞춰 둔 능력치(우두머리 보정·시련·보물·연구)는 "지금 값 ÷ 옛 기본값" 비율로 새 능력치에 옮긴다.
 */
import {ccStatsFor,genericAbility,statsFor} from '../../core/src/index.ts';
import type {Ability,Unit,UnitStats} from '../../core/src/index.ts';
import {romanceOf} from './romance.ts';

/**
 * 연의 인물상으로 정한 민첩·운(20~100). 연의에 그 사람의 날램·명운이 뚜렷이 그려진 장수만 적는다.
 * 나머지는 아래 어림식(민첩 = 무력·지력, 운 = 매력)을 쓴다. 근거는 연의의 장면이다.
 */
export const CC_OFFICER_AGI_LUCK:Record<string,readonly [number,number]>={
  조조:[76,92],   // 동탁 암살 실패 뒤 탈출·복양 화재·완성(전위의 희생)·화용도·동관 할수기포 — 고비마다 살아남는다
  악진:[80,54],   // 언제나 먼저 성벽에 오르는 선등의 날램 / 합비에서 감녕의 화살에 맞아 떨어진다
  조홍:[72,52],   // 형양에서 조조에게 말을 내주고 걸어서 따른다 / 서황의 말을 듣지 않고 나가 동관을 잃는다
  서황:[76,58],   // 번성에서 관우의 포위를 깨뜨린다 / 신성에서 맹달의 화살에 쓰러진다
  우금:[68,30],   // 번성 칠군이 물에 잠겨 항복하고, 돌아와 능에 그려진 그림을 보고 부끄러워 죽는다
  하후돈:[80,50], // 조성의 화살에 한쪽 눈을 잃고 눈알을 삼킨다
  장료:[92,66],   // 합비에서 팔백 기로 손권 진을 뚫는다 / 정봉의 화살을 맞고 병들어 죽는다
  관우:[86,48],   // 오관을 지나 천 리를 홀로 달린다 / 맥성에서 사로잡혀 목숨을 잃는다
  조창:[88,58],   // 오환 정벌에서 몸소 앞장서 달린다 / 형과의 다툼 끝에 갑자기 죽는다
  조인:[72,74],   // 팔문금쇄진을 서서에게 간파당한다 / 번성이 물에 잠겨도 끝내 지켜 낸다
  하후연:[94,42], // 사흘에 오백 리, 엿새에 천 리를 가는 질풍 / 정군산에서 황충의 한칼에 쓰러진다
  장합:[84,56],   // 지형과 형세에 따라 군을 바꾸는 교변 / 목문도에서 화살비를 맞는다
  조비:[64,86],   // 시문을 즐긴 문인 / 후계 다툼에서 이겨 황제에 오른다
  허저:[66,70],   // 무거운 힘장사 / 위수에서 배를 저어 조조를 구하고, 웃통 벗고 마초와 싸워 화살을 맞고도 산다
  순욱:[54,40],   // 빈 찬합을 받고 스스로 목숨을 끊는다
  만총:[66,74],   // 합비 신성을 굳게 지켜 오군을 물리친다
  가후:[70,88],   // 이각·장수·조조로 주인을 바꾸면서도 끝내 천수를 누린다
  사마의:[70,84], // 맹달을 치러 여드레에 천이백 리를 달린다 / 상방곡 화공에서 소나기로 살아남는다
};

const even=(v:number)=>Math.max(20,Math.min(100,Math.round(v/2)*2));
/** 부대의 장수 능력(무력·지력·통솔·민첩·운). 장수가 아니면 병과 등급으로. */
export function abilityOf(u:Unit):Ability{
  const r=romanceOf(u);if(!r)return genericAbility(u.unitClass);
  const cc=CC_OFFICER_AGI_LUCK[r.name];
  return {war:r.war,int:r.int,lead:r.lead,agi:cc?.[0]??even(.45*r.war+.25*r.int+22),luck:cc?.[1]??even(.6*r.cha+25)};
}
const KEYS=['maxHp','maxMp','attack','defense','intellect','spirit','agility'] as const;
/**
 * 조조전 규칙을 켜고 능력치를 조조전 성장식으로 바꾼다(체력·책략 비율은 그대로).
 * 성문·망루·목책·호위 대상처럼 체력을 일부러 맞춘 부대는 keepHp로 체력·책략 최대치를 그대로 둔다
 * (공격·방어·순발은 새 규칙에 맞춰야 피해가 옛 규칙과 같은 무게로 들어간다).
 */
/** 이름난 장수의 회심 보너스(%p): 무력·운이 높을수록 잘 터진다(5~20). 일반 병사는 0. */
export function officerCritOf(u:Unit):number{
  const r=romanceOf(u);if(!r)return 0;const a=abilityOf(u);
  return Math.max(5,Math.min(20,Math.round(5+(a.war-60)/4+(a.luck-60)/8)));
}
export function applyCC(u:Unit,keepHp=false):void{
  u.ccRules=true;u.ability=abilityOf(u);
  const oc=officerCritOf(u);if(oc>0)u.officerCrit=oc;
  const s=u.stats,base=statsFor(u.unitClass,u.level),cc=ccStatsFor(u.unitClass,u.level,u.ability,u.side,s.movement,!!u.ratioRules);
  const hp=u.hp/Math.max(1,s.maxHp),mp=s.maxMp>0?u.mp/s.maxMp:1;
  for(const k of KEYS)if(!keepHp||(k!=='maxHp'&&k!=='maxMp'))s[k]=Math.max(k==='maxMp'?0:1,Math.round(s[k]*cc[k]/Math.max(1,base[k])));
  s.morale=Math.max(1,Math.round(cc.morale*(s.morale||50)/50));
  u.hp=Math.max(1,Math.round(s.maxHp*hp));u.mp=Math.round(s.maxMp*mp);
}
/** 조조전 규칙 부대의 레벨 a→b 성장분. */
export function ccLevelDelta(u:Unit,a:number,b:number):Omit<UnitStats,'movement'>{
  const ab=u.ability??genericAbility(u.unitClass),x=ccStatsFor(u.unitClass,a,ab,u.side,u.stats.movement,!!u.ratioRules),y=ccStatsFor(u.unitClass,b,ab,u.side,u.stats.movement,!!u.ratioRules);
  return {maxHp:y.maxHp-x.maxHp,maxMp:y.maxMp-x.maxMp,attack:y.attack-x.attack,defense:y.defense-x.defense,intellect:y.intellect-x.intellect,spirit:y.spirit-x.spirit,agility:y.agility-x.agility,morale:y.morale-x.morale};
}
