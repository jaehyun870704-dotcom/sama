import type {UnitClass} from '../../core/src/index.ts';

/** Dedicated art includes all three evolutions; never recolor another troop into these classes. */
export const paintedTroopSheets=[{id:'rattan-v2',url:'troops-rattan-v2.png',rows:3},{id:'elephant-v1',url:'troops-elephant-v1.png',rows:3}] as const;
export const paintedTroopArt:Partial<Record<UnitClass,{sheet:string;row:number;rows:number}>>={
  rattan:{sheet:'rattan-v2',row:0,rows:3},
  rattanElite:{sheet:'rattan-v2',row:1,rows:3},
  wuguoRattan:{sheet:'rattan-v2',row:2,rows:3},
  elephant:{sheet:'elephant-v1',row:0,rows:3},
  warElephant:{sheet:'elephant-v1',row:1,rows:3},
  elephantKing:{sheet:'elephant-v1',row:2,rows:3},
};
/** 진화표의 겉모습 설명: 전용 그림은 단계 장비가 그림에 이미 그려져 있어 갑옷 덧그리기 규칙 대신 이 글을 쓴다. */
export const paintedLook:Partial<Record<UnitClass,string>>={
  elephant:'가죽·밧줄 하네스 · 얇은 안장 덮개 · 단독 기수',
  warElephant:'보강 가죽 하네스 · 누빔 방호포 · 머리 철갑 · 난간 좌석',
  elephantKing:'다중 체결 하네스 · 측면 비늘갑 · 상아 보호구 · 2인승 전투 누각',
  rattan:'등나무 갑옷 · 등투구 · 녹색 천 · 작은 등패 · 환도',
  rattanElite:'겹겹 짙은 등갑 · 넓게 덧댄 등패 · 짙은 녹색 어깨 망토',
  wuguoRattan:'촘촘한 짙은 등갑에 놋쇠 띠 · 황토색 망토 · 높은 등투구 · 큰 등패',
};
/** Atlas columns: idle, attack, stride, recoil. Battle pose numbers remain unchanged. */
export function paintedTroopFrame(pose:number){
  if(pose>=8)return pose===9||pose===11?0:3;
  if(pose>=4)return pose%2===0?2:0;
  return pose===1||pose===2?1:0;
}
