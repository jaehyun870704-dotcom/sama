import {describe,it,expect} from 'vitest';
import {allUnitClasses} from '../../core/src/index.ts';
import {completeTroopArt,completeTroopRows,completeTroopSheets} from '../src/complete-troops.ts';
import {paintedTroopArt,paintedTroopSheets,POSE} from '../src/painted-troops.ts';
import {classSprite} from '../src/codex-ui.ts';
import {classSheets} from '../src/troops.ts';

describe('새 화풍 전체 병종 원화',()=>{
  it('깃허브의 136개 병종을 하나도 빠짐없이, 중복 칸 없이 매핑한다',()=>{
    const classes=allUnitClasses();
    expect(classes).toHaveLength(136);
    expect(completeTroopRows.flat()).toHaveLength(136);
    expect(new Set(completeTroopRows.flat()).size).toBe(136);
    expect(Object.keys(completeTroopArt).sort()).toEqual([...classes].sort());
    expect(new Set(Object.values(completeTroopArt).map(x=>`${x.sheet}:${x.row}`)).size).toBe(136);
    for(const c of classes)expect(paintedTroopArt[c],c).toEqual(completeTroopArt[c]);
  });

  it('17개 시트 모두 8행·4동작이며 신규 원화 파일만 사용한다',()=>{
    expect(completeTroopSheets).toHaveLength(17);
    for(const sheet of completeTroopSheets){
      expect(sheet.rows).toBe(8);
      expect(sheet.url).toMatch(/^troops-complete-\d{2}-v[12]\.png$/);
      const loaded=paintedTroopSheets.find(x=>x.id===sheet.id);
      expect(loaded?.frames).toBe(POSE);
      expect(loaded).toHaveProperty('union',true);
    }
    expect(completeTroopSheets[9]?.url).toBe('troops-complete-10-v2.png');
  });

  it('예전 manifest 전용 그림이 있어도 신규 전체 원화를 우선한다',()=>{
    classSheets.set('infantry','troops/old-infantry.png');
    expect(classSprite('infantry')).toContain('--complete-01-atlas');
    expect(classSprite('infantry')).not.toContain('--own-infantry-atlas');
    classSheets.delete('infantry');
  });
});
