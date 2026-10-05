import type {UnitClass} from '../../core/src/index.ts';

/** Dedicated art includes all three evolutions; never recolor another troop into these classes. */
export const paintedTroopSheets=[{id:'rattan-v2',url:'troops-rattan-v2.png',rows:3}] as const;
export const paintedTroopArt:Partial<Record<UnitClass,{sheet:string;row:number;rows:number}>>={
  rattan:{sheet:'rattan-v2',row:0,rows:3},
  rattanElite:{sheet:'rattan-v2',row:1,rows:3},
  wuguoRattan:{sheet:'rattan-v2',row:2,rows:3},
};
/** Atlas columns: idle, attack, stride, recoil. Battle pose numbers remain unchanged. */
export function paintedTroopFrame(pose:number){
  if(pose>=8)return pose===9||pose===11?0:3;
  if(pose>=4)return pose%2===0?2:0;
  return pose===1||pose===2?1:0;
}
