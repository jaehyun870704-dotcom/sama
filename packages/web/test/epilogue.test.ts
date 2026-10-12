import {describe,it,expect} from 'vitest';
import {epilogueBeats,epilogueYears,epilogueLines} from '../src/story.ts';

describe('에필로그 컷신',()=>{
 it('회상 여덟 장면은 인장으로 갈린 한 줄과 무대를 가진다',()=>{
  const none=epilogueBeats({}),all=epilogueBeats({'S2-05:extreme':[3],'S3-06:normal':[2]});
  expect(none).toHaveLength(8);expect(none.every(b=>!b.kept&&b.art>=0&&b.place&&b.when)).toBe(true);
  expect(all.find(b=>b.id==='S2-05')!.kept).toBe(true);expect(all.at(-1)!.line).toContain('두 아들은 모두 살아서');
  expect(epilogueLines({})).toEqual(none.map(b=>b.line));
 });
 it('연표는 251년에서 시작해 280년 천하가 하나 되는 데서 끝난다',()=>{
  expect(epilogueYears[0]!.year).toContain('251');expect(epilogueYears.at(-1)!.line).toContain('하나가 된다');
  expect([...epilogueYears.map(y=>y.year+y.line)].join('')).not.toMatch(/[\u4e00-\u9fff]/);
 });
});
