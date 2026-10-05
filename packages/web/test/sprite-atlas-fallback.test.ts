import {describe,it,expect} from 'vitest';
import {isolateFrames} from '../src/sprite-atlas.ts';
// 칸 안의 떨어진 조각(투석기 옆 병사처럼): union이면 한 프레임에 함께 담겨 프레임이 넓어지고, 아니면 가장 큰 조각만 남는다.
function sheet(){
  const width=400,height=100,data=new Uint8ClampedArray(width*height*4);
  const put=(x:number,y:number)=>{const i=(y*width+x)*4;data[i]=200;data[i+3]=255;};
  for(let c=0;c<4;c++)for(let y=20;y<90;y++)for(let x=c*100+20;x<c*100+50;x++)put(x,y);
  for(let y=10;y<40;y++)for(let x=60;x<90;x++)put(x,y); // 0칸의 두 번째 조각
  return {width,height,data};
}
function cell0Aspect(img:{width:number;height:number;data:Uint8ClampedArray}){
  const cw=img.width/4;let l=cw,r=0,t=img.height,b=0;
  for(let y=0;y<img.height;y++)for(let x=0;x<cw;x++)if(img.data[(y*img.width+x)*4+3]!>0){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  return (r-l+1)/(b-t+1);
}
describe('isolateFrames union',()=>{
  it('keeps every piece of a cell together when union is on',()=>{
    const plain=cell0Aspect(isolateFrames(sheet(),1,4,false)),merged=cell0Aspect(isolateFrames(sheet(),1,4,true));
    expect(plain).toBeLessThan(0.5);   // 몸통만: 30×70
    expect(merged).toBeGreaterThan(0.8); // 몸통+조각: 70×80
  });
});
