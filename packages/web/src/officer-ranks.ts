/**
 * 장수의 연의 계급 — 장수 도감을 위에서 아래로 「군주 → 재상·대장군 → 장군 → 참모·장수 → 인물」 순으로 세운다.
 * 연의에서 오른 가장 높은 자리를 기준으로 이 게임이 묶은 다섯 단계다. 같은 단계 안에서는 아래 표에 적은 서열 순(연의의 직위·공훈), 표에 없으면 연의 능력 합이 높은 순.
 * 표에 없는 장수는 4단계(참모·장수)로 본다.
 */
import {romanceByName} from './romance.ts';

export const RANK_LABEL=['','군주','재상·대장군','장군','참모·장수','인물'] as const;
export type RankTier=1|2|3|4|5;

const TIERS:Record<RankTier,string>={
  // 황제·왕·한 지역의 주인(칭제한 원술이 군웅 맨 앞)
  1:'조조 조비 조예 유비 손권 원술 여포 원담 원상 공손연 맹획 항우 유방 손견 손책 원소 동탁 유표',
  // 승상·삼공·대사마·대장군·대도독·상국 (오의 4대 도독은 주유·노숙·여몽·육손 순, 한초삼걸은 장량·소하·한신 순)
  2:'사마의 사마사 사마소 사마부 조진 조인 조휴 조상 하후돈 가후 등애 종회 왕릉 제갈량 강유 장완 비의 주유 노숙 여몽 육손 장소 제갈근 제갈각 육항 범증 장량 소하 한신 조참 진평 공손찬 장각 마등',
  // 이름난 장수·사방장군·전후좌우장군·상서령 (촉 오호대장군은 관우·장비·마초·황충·조운 순)
  3:'하후연 조홍 장료 서황 장합 우금 악진 허저 이전 곽회 방덕 문빙 순욱 왕쌍 문흠 문앙 맹달 장패 관우 장비 마초 황충 조운 위연 방통 법정 이엄 오의 왕평 마대 요화 황권 엄안 정보 황개 한당 장흠 감녕 주연 서성 정봉 반장 안량 문추 장임 고람 이각 곽사 축융 올돌골 종리매 계포 용저 영포 팽월 번쾌 관영 곽가 순유 정욱 전위 태사자 주태 능통 화웅 고순',
  // 참모·중견 장수
  4:'사마랑 사마방 호준 대릉 학소 조창 서서 마량 마속 관평 관흥 장포 고상 맹염 미축 손건 간옹 등지 진식 장익 유봉 양의 이적 미방 오반 주창 관색 여범 손소 고수 진궁 저수 전풍 심배 봉기 양앙 비연 왕이 손상향 관은병 포삼랑 여령기 마운록',
  // 무관이 아닌 인물·가족
  5:'조식 제갈균 장춘화 견씨 황월영 초선 우희 변씨 보연사 신헌영 왕원희 대교 소교 하후씨 동백 채문희',
};
const tierOf=new Map<string,RankTier>(),seat=new Map<string,number>();
for(const [t,names] of Object.entries(TIERS) as Array<[string,string]>){
  for(const n of names.split(/\s+/).filter(Boolean))if(!tierOf.has(n)){tierOf.set(n,Number(t) as RankTier);seat.set(n,seat.size);}
}

/** 연의 계급 단계(1 군주 … 5 인물). */
export const rankTier=(name:string):RankTier=>tierOf.get(name)??4;
export const rankLabel=(name:string)=>RANK_LABEL[rankTier(name)];
/** 표에 없는 장수의 순서: 연의 능력(무력·지력·통솔·정치·매력) 합이 높은 순. */
const power=(name:string)=>{const r=romanceByName(name);return r?r.war+r.int+r.lead+r.pol+r.cha:0;};
/** 계급 순으로 정렬한 새 배열(같은 계급은 표의 서열, 표에 없으면 능력 합, 그다음 원래 순서). */
export function byRank<T>(list:readonly T[],name:(x:T)=>string):T[]{
  return list.map((x,i)=>({x,i,t:rankTier(name(x)),s:seat.get(name(x))??1e9,p:power(name(x))})).sort((a,b)=>a.t-b.t||a.s-b.s||b.p-a.p||a.i-b.i).map(o=>o.x);
}
