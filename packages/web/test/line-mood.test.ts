import {describe,expect,it} from 'vitest';
import {lineMood} from '../src/line-mood.ts';
import {gestureFor} from '../src/story-motion.ts';

describe('대사 분위기',()=>{
 it('성난 말·놀란 말·웃는 말·슬픈 말·아뢰는 말을 가른다',()=>{
  expect(lineMood('이놈, 감히 내 앞을 막느냐!')).toBe('angry');
  expect(lineMood('무엇이? 성문이 열렸다고?')).toBe('surprise');
  expect(lineMood('하하, 잘했다.')).toBe('smile');
  expect(lineMood('송구합니다…')).toBe('sad');
  expect(lineMood('주공께 아뢰옵니다.')).toBe('deferent');
  expect(lineMood('내일 아침까지 기다리겠다.')).toBe('neutral');
 });
 it('몸짓도 같은 판단을 쓴다',()=>{
  expect(gestureFor('이놈, 감히!!','speak',false).surprise).toBe(true);
  expect(gestureFor('주공께 아뢰옵니다.','speak',false).bow).toBe(true);
 });
});
