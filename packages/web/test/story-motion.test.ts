import {describe,it,expect} from 'vitest';
import {gestureFor} from '../src/story-motion.ts';

describe('연의 이야기 인물 몸짓',()=>{
  it('대사에 맞는 몸짓을 고른다',()=>{
    expect(gestureFor('무엇이! 조운이 진영을 뚫었다고?','speak',false).surprise).toBe(true);
    expect(gestureFor('주공, 소신이 가겠습니다.','speak',true).bow).toBe(true);
    expect(gestureFor('무릎 꿇고 죄를 청합니다.','speak',true)).toMatchObject({kneel:true,bow:false,surprise:false,point:false});
    expect(gestureFor('배를 내어라. 영수를 따라 내려간다.','speak',false).point).toBe(true);
    expect(gestureFor('그렇다면 기다리자.','resolve',false).point).toBe(true);
    expect(gestureFor('비가 오는구나.','speak',false)).toMatchObject({kneel:false,surprise:false,bow:false,point:false});
  });
});
