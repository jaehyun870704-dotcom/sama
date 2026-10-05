import type {UnitClass} from '../../core/src/index.ts';

/** 칸 쓰임새: 시트마다 2·3열이 뜻하는 동작이 다르다. attack은 [준비, 내지름], walk는 [내딛음, 디딤] 칸 번호. */
export type PaintedFrames={attack:[number,number];walk:[number,number];cast:number;hit:number};
export const STRIDE:PaintedFrames={attack:[1,1],walk:[2,0],cast:1,hit:3};   // 2열 공격 · 3열 걷기(보병·등갑병·상병)
export const THRUST:PaintedFrames={attack:[1,2],walk:[2,0],cast:1,hit:3};   // 2열 준비 · 3열 내지름(걷기 겸용: 창병·기병)
export const SHOOT:PaintedFrames={attack:[1,2],walk:[0,0],cast:2,hit:3};    // 2열 겨눔 · 3열 쏨 · 걷기는 대기 칸(궁병·노병)
export const CASTER:PaintedFrames={attack:[1,2],walk:[0,0],cast:2,hit:3};   // 2열 책 들기 · 3열 부채 휘두름(책사·풍수사)
/** Dedicated art includes all three evolutions; never recolor another troop into these classes. */
export const paintedTroopSheets=[
  {id:'rattan-v2',url:'troops-rattan-v2.png',rows:3,frames:STRIDE},
  {id:'elephant-v1',url:'troops-elephant-v1.png',rows:3,frames:STRIDE},
  {id:'infantry-v1',url:'troops-infantry-v1.png',rows:3,frames:STRIDE},
  {id:'spearman-v1',url:'troops-spearman-v1.png',rows:3,frames:THRUST},
  {id:'archer-v1',url:'troops-archer-v1.png',rows:3,frames:SHOOT},
  {id:'cavalry-v1',url:'troops-cavalry-v1.png',rows:3,frames:THRUST},
] as const;
export const paintedFrames=(sheet:string):PaintedFrames=>paintedTroopSheets.find(s=>s.id===sheet)?.frames??STRIDE;
export const paintedTroopArt:Partial<Record<UnitClass,{sheet:string;row:number;rows:number}>>={
  rattan:{sheet:'rattan-v2',row:0,rows:3},
  rattanElite:{sheet:'rattan-v2',row:1,rows:3},
  wuguoRattan:{sheet:'rattan-v2',row:2,rows:3},
  elephant:{sheet:'elephant-v1',row:0,rows:3},
  warElephant:{sheet:'elephant-v1',row:1,rows:3},
  elephantKing:{sheet:'elephant-v1',row:2,rows:3},
  infantry:{sheet:'infantry-v1',row:0,rows:3},
  shieldGuard:{sheet:'infantry-v1',row:1,rows:3},
  royalGuard:{sheet:'infantry-v1',row:2,rows:3},
  spearman:{sheet:'spearman-v1',row:0,rows:3},
  pikeman:{sheet:'spearman-v1',row:1,rows:3},
  halberdier:{sheet:'spearman-v1',row:2,rows:3},
  archer:{sheet:'archer-v1',row:0,rows:3},
  longbow:{sheet:'archer-v1',row:1,rows:3},
  sharpshooter:{sheet:'archer-v1',row:2,rows:3},
  cavalry:{sheet:'cavalry-v1',row:0,rows:3},
  lancer:{sheet:'cavalry-v1',row:1,rows:3},
  tigerRider:{sheet:'cavalry-v1',row:2,rows:3},
};
/** 진화표의 겉모습 설명: 전용 그림은 단계 장비가 그림에 이미 그려져 있어 갑옷 덧그리기 규칙 대신 이 글을 쓴다. */
export const paintedLook:Partial<Record<UnitClass,string>>={
  elephant:'가죽·밧줄 하네스 · 얇은 안장 덮개 · 단독 기수',
  warElephant:'보강 가죽 하네스 · 누빔 방호포 · 머리 철갑 · 난간 좌석',
  elephantKing:'다중 체결 하네스 · 측면 비늘갑 · 상아 보호구 · 2인승 전투 누각',
  rattan:'등나무 갑옷 · 등투구 · 녹색 천 · 작은 등패 · 환도',
  rattanElite:'겹겹 짙은 등갑 · 넓게 덧댄 등패 · 짙은 녹색 어깨 망토',
  wuguoRattan:'촘촘한 짙은 등갑에 놋쇠 띠 · 황토색 망토 · 높은 등투구 · 큰 등패',
  infantry:'푸른 두건 · 가죽 조끼 · 둥근 나무 방패 · 환도',
  shieldGuard:'철 투구 · 비늘 철갑 · 직사각 큰 방패',
  royalGuard:'깃털 투구 · 금장 판갑 · 문양 큰 방패 · 긴 환도',
  spearman:'맨소매 천 옷 · 짧은 창',
  pikeman:'철 투구 · 비늘 철갑 · 붉은 술 장창',
  halberdier:'검은 깃 투구 · 금장 판갑 · 월아극',
  archer:'푸른 두건 · 가죽 조끼 · 짧은 활 · 화살통',
  longbow:'철 투구 · 비늘 철갑 · 큰 활',
  sharpshooter:'붉은 술 금투구 · 금갑 · 용머리 장궁 · 망토',
  cavalry:'머리띠 · 가죽 갑 · 안장 없는 갈색 말 · 창',
  lancer:'철 투구 · 비늘 철갑 · 마갑 두른 말 · 장창',
  tigerRider:'호랑이 가죽 망토 · 붉은 갈기 투구 · 검은 철갑 말',
};
/** 전장 자세 번호 → 시트 칸. 0 대기 · 1 공격 준비 · 2 공격 · 3 책략 · 4~7 걷기(짝수 내딛음) · 8~11 반응. */
export function paintedTroopFrame(pose:number,f:PaintedFrames=STRIDE){
  if(pose>=8)return pose===9||pose===11?0:f.hit;
  if(pose>=4)return pose%2===0?f.walk[0]:f.walk[1];
  if(pose===3)return f.cast;
  return pose===1?f.attack[0]:pose===2?f.attack[1]:0;
}
