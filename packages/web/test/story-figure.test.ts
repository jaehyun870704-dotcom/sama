import {describe,expect,it} from 'vitest';
import {figArtFor} from '../src/story-figure.ts';

describe('이야기 무대 인물은 기존 그림을 쓴다',()=>{
  it('전신 일러스트가 있는 장수는 그 그림',()=>{
    expect(figArtFor('사마의','strategist')).toEqual({kind:'fig',slot:0,tint:0});
    expect(figArtFor('허저','heavy')).toEqual({kind:'fig',slot:7,tint:0});
  });
  it('황제는 관을 쓴 군주 그림',()=>{
    expect(figArtFor('헌제','civil')).toMatchObject({kind:'fig',slot:5});
  });
  it('이름 없는 병사·백성은 병종 그림, 말 탄 병종은 말에서 내린다',()=>{
    expect(figArtFor('창병','spear')).toEqual({kind:'sheet',look:'spear'});
    expect(figArtFor('기마 척후','cavalry')).toEqual({kind:'sheet',look:'infantry'});
    expect(figArtFor('의원','physician')).toEqual({kind:'sheet',look:'physician'});
  });
});
