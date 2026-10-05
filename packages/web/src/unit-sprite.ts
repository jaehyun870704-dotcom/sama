/**
 * 도트 병종 그림을 화면에 쓰는 쪽(전장 텍스처·도감 그림). 그리기는 unit-pixel.ts가 한다.
 */
import type {UnitClass} from '../../core/src/index.ts';
import {renderUnit,type PixelImage} from './unit-pixel.ts';
import {classLook,officerLook,hasPixelLook} from './unit-looks.ts';
import {DYE_HUE,type Dye} from './dye.ts';

export {hasPixelLook};
/** 걷기 자세(전장 시트의 4~7)는 도트 걷기 그림(12·13)으로 바꾼다. */
export const pixelPose=(pose:number)=>pose>=4&&pose<8?12+(pose%2):pose;
export function pixelCanvas(img:PixelImage,scale=2){
  const c=document.createElement('canvas');c.width=img.width*scale;c.height=img.height*scale;
  const g=c.getContext('2d')!,t=document.createElement('canvas');t.width=img.width;t.height=img.height;
  t.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data),img.width,img.height),0,0);
  g.imageSmoothingEnabled=false;g.drawImage(t,0,0,c.width,c.height);return c;
}
/** 병종(·장수) 한 자세의 도트 캔버스. 장수 이름을 주면 그 장수의 고유 모습. */
export function unitPixelCanvas(cls:UnitClass,dye:Dye,pose=0,officer=''){
  const base=classLook(cls);if(!base)return null;
  const look=officer?officerLook(base,officer):base;
  return pixelCanvas(renderUnit(look,DYE_HUE[dye],pixelPose(pose)),2);
}
const urls=new Map<string,string>();
/** 도감용 그림 주소(아군 파랑, 대기 자세) */
export function unitPixelURL(cls:UnitClass,dye:Dye='blue',pose=0){
  const key=cls+':'+dye+':'+pose;let u=urls.get(key);
  if(!u){const c=unitPixelCanvas(cls,dye,pose);u=c?c.toDataURL():'';urls.set(key,u);}
  return u;
}
