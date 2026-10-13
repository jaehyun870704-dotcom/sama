/**
 * 정비 화면: 아래 버튼 줄이 보물(장비) 칸을 가리지 않는다 · 초상이 없는 이름난 장수(엄안)도 카드에 대체 초상이 나온다.
 */
import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {specFor} from '../src/faces.ts';
import {portraitImage} from '../src/portrait-images.ts';
import {officerLook} from '../src/officer-art.ts';

const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');

describe('정비 화면 아래 버튼 줄',()=>{
  it('대화상자 아래 가장자리에 붙고(떠 있으면 줄 밑으로 내용이 비치고 보물 탭을 가렸다), 보물 칸은 줄 높이만큼 위에 멈춘다',()=>{
    expect(css).toContain('.camp-screen .modal-actions{bottom:0;');
    expect(css).not.toContain('.camp-screen .modal-actions{bottom:32px');
    expect(css).toMatch(/#modal:has\(\.camp-screen\)\{scroll-padding-bottom:\d+px\}/);
    expect(css).toMatch(/\.camp-screen \.treasury\{scroll-margin-bottom:\d+px\}/);
  });
});

describe('초상이 없는 이름난 장수의 카드 얼굴',()=>{
  it('엄안은 넣은 초상·원화가 없어 전투 그림 한 칸(카드에서 거의 빈칸)이 나왔다 → 초상 생성기로 지은 대체 초상',()=>{
    expect(portraitImage('엄안')).toBeUndefined();
    expect(officerLook('엄안')).toBeUndefined();
    expect(specFor('엄안')).toBeDefined();
    // 장수 카드 얼굴(faceFor)이 이 경우 cardFace(지은 초상)를 쓴다.
    expect(main).toMatch(/romanceOf\(u\)&&specFor\(name\)\)return `<span class="battle-model officer-photo">\$\{cardFace\(name\)\}<\/span>`/);
  });
});
