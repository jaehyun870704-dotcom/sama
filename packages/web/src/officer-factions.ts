/**
 * 장수의 진영 구분: 위 · 촉 · 오 · 군웅 · 초 · 한(사용자 결정 2026-10-12). 인물 열전·병종 진화표 장수 탭이 함께 쓴다.
 * 초·한은 초한 영웅(chuhan.ts), 제갈량전 인물은 그 인물에 적힌 세력, 나머지는 아래 명부(없으면 위).
 */
import {ZHUGE_PEOPLE_ALL} from './zhuge/index.ts';
import {CHU,HAN} from './chuhan.ts';

export type FactionSide='wei'|'shu'|'wu'|'other'|'chu'|'han';
export type OfficerFaction='위'|'촉'|'오'|'군웅'|'초'|'한';
export const OFFICER_FACTIONS:readonly OfficerFaction[]=['위','촉','오','군웅','초','한'];
export const FACTION_LABEL:Record<FactionSide,OfficerFaction>={wei:'위',shu:'촉',wu:'오',other:'군웅',chu:'초',han:'한'};
const SHU=new Set('마초 황충 조운 마속 왕평 위연 고상 맹염 강유 제갈량 방통 유비 관우 장비 서서 관평 유봉 마대 관색 황권 하후패 이엄 법정 진식 장저 장휴 이성 황습 오반 오의 요화 장익 비의 유민 주창 간옹 미축 손건 등지'.split(' '));
const WU=new Set('주유 손권 장소 제갈근 여몽 여범 손소 육손 주연 제갈각 고수 황개 감녕 노숙 정봉 전종 서성 하제 주환 고승 한당 장흠 반장 육항'.split(' '));
const OTHER=new Set('여포 진궁 양앙 공손연 비연 안량 원담 고람 맹획 축융 올돌골 봉기 원상 심배 고간 답돈 문추 저수 채모 전풍 타사대왕 목록대왕 원희 한수 장위 양임 양조 윤직 공손수 왕건 초선 이각 곽사 원술 장임'.split(' '));
/** 이름 → 진영(위·촉·오·군웅·초·한). */
export function factionSide(name:string):FactionSide{
  const zp=ZHUGE_PEOPLE_ALL.find(p=>p.name===name);if(zp&&!SHU.has(name)&&!WU.has(name)&&!OTHER.has(name))return zp.side;
  if((CHU as readonly string[]).includes(name))return 'chu';if((HAN as readonly string[]).includes(name))return 'han';
  return SHU.has(name)?'shu':WU.has(name)?'wu':OTHER.has(name)?'other':'wei';
}
export const officerFaction=(name:string):OfficerFaction=>FACTION_LABEL[factionSide(name)];
