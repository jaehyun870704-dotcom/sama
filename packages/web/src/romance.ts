/**
 * 연의 장수록 — 『삼국지연의』의 묘사를 바탕으로 이 게임이 직접 매긴 장수 능력.
 *
 * 다섯 능력(1~100): 무력(일기토·물리 공격), 지력(책략·설전), 통솔(방어·체력),
 * 정치(정신), 매력(사기). 50이 병종 기본치이고, 높을수록 같은 병종·레벨의 졸병보다 강하다.
 * 연의에 이름난 일화가 있는 장수는 그 일화에서 딴 고유능력(특성)을 하나 가진다.
 */
import type {Unit} from '../../core/src/index.ts';

export interface RomanceSkill {name:string;description:string;trait:string;param?:number}
export interface RomanceOfficer {
  name:string;
  /** 연의 속 별호나 한 줄 인물평 */
  epithet:string;
  war:number;int:number;lead:number;pol:number;cha:number;
  skill?:RomanceSkill;
}
const o=(name:string,epithet:string,[war,int,lead,pol,cha]:[number,number,number,number,number],skill?:RomanceSkill):RomanceOfficer=>({name,epithet,war,int,lead,pol,cha,...(skill?{skill}:{})});

/** 장수 id → 연의 능력. 이름으로 찾는 원정 우두머리는 아래 byName이 맡는다. */
export const romance:Record<string,RomanceOfficer>={
  // 사마씨 일가와 조진 (아군)
  sima_yi:o('사마의','총(冢)에 숨은 이리 · 때를 기다린 자',[63,97,95,92,78]),
  sima_lang:o('사마랑','백달 · 사마팔달의 맏이',[38,74,55,80,77]),
  sima_fang:o('사마방','엄정한 가장 · 경조윤',[45,70,62,78,70]),
  cao_zhen:o('조진','조씨 종실의 대들보',[80,62,82,55,70]),
  sima_shi:o('사마사','자원 · 침착한 맏아들',[70,86,83,82,72]),
  sima_zhao:o('사마소','자상 · 그 마음은 길 가는 사람도 안다',[66,84,78,86,74]),
  // 위
  cao_cao:o('조조','치세의 능신, 난세의 간웅',[72,94,98,95,96]),
  xu_chu:o('허저','호치 · 웃통 벗고 마초와 싸운 장사',[96,36,65,20,60],{name:'호치의 호위',description:'인접 아군의 피해를 대신 받는다',trait:'guardian'}),
  cao_pi:o('조비','위 문제 · 칠보시의 형',[70,78,72,82,72]),
  zhang_he:o('장합','교변의 명장 · 가정에서 마속을 꺾다',[88,70,85,55,68],{name:'교변',description:'반격 위력 20% 증가',trait:'counterBoost',param:20}),
  guo_huai:o('곽회','옹주를 지킨 노장',[74,76,84,70,70]),
  cao_xiu:o('조휴','천리구 · 석정에서 꾀에 빠지다',[76,58,72,52,66]),
  cao_shuang:o('조상','고평릉에서 모든 것을 잃은 대장군',[50,40,48,45,55]),
  wang_ling:o('왕릉','수춘에서 일어난 노신',[72,72,80,74,76]),
  meng_da:o('맹달','세 번 주인을 바꾼 신성 태수',[76,66,72,58,50]),
  yang_ang:o('양앙','장로의 양평관 수비장',[70,40,62,30,40]),
  // 여포와 그 무리 (꿈속의 환영)
  lu_bu:o('여포','인중여포 마중적토 · 비장',[100,26,88,14,40],{name:'비장의 무위',description:'물리 공격 피해 18% 증가',trait:'flyingGeneral'}),
  chen_gong:o('진궁','조조를 버린 지모의 선비',[45,87,74,75,68],{name:'냉철한 간파',description:'받는 책략 피해 15% 감소',trait:'strategicGuard'}),
  zhou_yu:o('주유','미주랑 · 적벽의 화공',[74,96,97,84,93],{name:'적벽의 화공',description:'책략 공격 피해 12% 증가',trait:'zhouStrategy'}),
  // 서량·촉
  ma_chao:o('마초','금마초 · 서량의 비단 갑옷',[97,42,86,26,80],{name:'서량의 맹장',description:'물리 공격 피해 10% 증가',trait:'westernValor'}),
  huang_zhong:o('황충','정군산의 노장 · 노익장',[94,58,82,50,72],{name:'노익장',description:'적 방어 20% 무시',trait:'penetrate',param:20}),
  zhao_yun:o('조운','상산 조자룡 · 장판의 단기필마',[96,76,90,66,88],{name:'단기필마',description:'체력 절반 이하에서 받는 피해 25% 감소',trait:'veteran',param:25}),
  ma_su:o('마속','재주가 말보다 앞선 자',[62,82,64,70,64]),
  wang_ping:o('왕평','가정에서 마속을 말린 부장',[76,68,80,52,62]),
  wei_yan:o('위연','반골의 맹장 · 자오곡 기계',[92,62,84,40,50],{name:'반골의 용맹',description:'물리 공격 피해 12% 증가',trait:'physicalPower',param:12}),
  gao_xiang:o('고상','촉의 군량 수송장',[68,50,66,40,52]),
  meng_yan:o('맹염','오장원의 촉 장수',[70,48,64,38,48]),
  jiang_wei:o('강유','천수의 기린아 · 제갈량의 후계',[90,90,92,68,82],{name:'기린아',description:'책략 공격 피해 10% 증가',trait:'strategyPower',param:10}),
  wooden_zhuge:o('제갈량','와룡 · 죽은 제갈이 산 중달을 쫓다',[38,100,96,98,96],{name:'팔진도',description:'받는 책략 피해 25% 감소',trait:'strategyDamageReduction',param:25}),
  // 오
  sun_quan:o('손권','벽안자염 · 강동의 주인',[66,80,82,86,94],{name:'강동 수성',description:'받는 물리 피해 10% 감소',trait:'commandDefense'}),
  zhang_zhao:o('장소','오의 원로 · 내사는 장소에게',[20,84,40,92,72]),
  zhuge_jin:o('제갈근','제갈량의 형 · 온후한 사신',[38,80,62,84,82]),
  lu_meng:o('여몽','괄목상대 · 백의도강',[82,90,90,74,80],{name:'백의도강',description:'적 방어 20% 무시',trait:'penetrate',param:20}),
  lu_fan:o('여범','손책 이래의 수군 원로',[56,72,70,78,66]),
  sun_shao:o('손소','강노를 이끈 오의 장수',[78,60,76,48,64]),
  zhang_ba:o('장패','태산의 호족 출신 장수',[82,52,76,40,60]),
  lu_xun:o('육손','이릉의 화공 · 서생 대도독',[66,96,96,88,86],{name:'이릉의 화공',description:'책략 공격 피해 15% 증가',trait:'strategyPower',param:15}),
  zhu_ran:o('주연','강릉을 지킨 오의 맹장',[76,62,80,52,64]),
  zhuge_ke:o('제갈각','재주가 넘친 제갈근의 아들',[50,88,74,72,60]),
  dai_ling:o('대릉','오장원의 위 장수',[70,50,66,38,50]),
  gao_shou:o('고수','결사대를 이끈 장수',[72,40,60,30,44]),
  // 요동 공손씨
  gongsun_yuan:o('공손연','연왕을 칭한 요동의 주인',[62,58,66,60,48]),
  bi_yan:o('비연','공손연의 대장',[72,50,70,40,50]),
};

/** 원정 우두머리처럼 id가 정해지지 않은 장수는 이름으로 찾는다. */
const byName:Record<string,RomanceOfficer>={
  ...Object.fromEntries(Object.values(romance).map(r=>[r.name,r])),
  안량:o('안량','원소의 하북 명장 · 백마에서 관우에게 베이다',[92,30,78,20,50],{name:'하북 명장',description:'물리 공격 피해 10% 증가',trait:'physicalPower',param:10}),
};
/** 가짜(미끼)는 진짜의 이름을 달고 있어도 능력이 없다. */
const DECOYS=new Set(['decoy']);
export function romanceOf(u:{id:string;name:string}):RomanceOfficer|undefined{
  if(DECOYS.has(u.id))return undefined;
  return romance[u.id]??(u.id==='boss'?byName[u.name]:undefined);
}

const scale=(r:number,span:number)=>1+(r-50)/50*span;
/**
 * 연의 능력을 유닛에 입힌다(한 번만). 무력→공격, 지력→지력, 통솔→방어·체력,
 * (지력+정치)/2→정신, 매력→사기. 체력·책략 비율은 유지한다.
 */
export function applyRomance(u:Unit):boolean{
  const r=romanceOf(u);if(!r)return false;
  const hp=u.hp/Math.max(1,u.stats.maxHp),s=u.stats;
  s.attack=Math.max(1,Math.round(s.attack*scale(r.war,.15)));
  s.intellect=Math.max(1,Math.round(s.intellect*scale(r.int,.15)));
  s.defense=Math.max(1,Math.round(s.defense*scale(r.lead,.1)));
  s.spirit=Math.max(1,Math.round(s.spirit*scale((r.int+r.pol)/2,.1)));
  s.maxHp=Math.max(1,Math.round(s.maxHp*scale(r.lead,.06)));
  s.morale=Math.round(40+r.cha*.2);
  u.hp=Math.max(1,Math.round(s.maxHp*hp));
  if(r.skill&&!u.traits.includes(r.skill.trait)){u.traits.push(r.skill.trait);if(r.skill.param!==undefined)u.traitParams[r.skill.trait]=r.skill.param;}
  return true;
}

/** 일기토 무력: 연의 무력에 레벨을 더한다(연의에 없는 장수는 공격력으로 어림). */
export function romanceWar(u:Unit):number|undefined{const r=romanceOf(u);return r?r.war:undefined;}
