import {describe,expect,it} from 'vitest';
import {plainChoices} from '../src/story-stage.ts';
import {PACKS,ZHUGE_PACKS} from '../src/scenario.ts';

describe('연의 이야기 선택지',()=>{
 it('능력치 효과·안내를 걷어 내고 분기 표식만 남긴다',()=>{
  for(const script of [...PACKS,...ZHUGE_PACKS].flatMap(p=>p.chapters)){
   for(const sc of plainChoices(script.scenes))for(const st of sc.steps)if('choice' in st)for(const o of st.options){
    expect((o.effects??[]).some(e=>['rally','guard','insight'].includes(e.kind))).toBe(false);
    for(const part of (o.note??'').split(' · '))expect(/^(?!이기면).*(사기 상승|방어 태세|MP \+\d+)/.test(part),part).toBe(false);
   }
  }
 });
});
