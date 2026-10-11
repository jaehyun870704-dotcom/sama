import {describe,expect,it} from 'vitest';
import {effectIcon,effectTone} from '../src/effect-icons.ts';

describe('officer and troop effect cards',()=>{
  it('gives mechanical effects a readable pictogram and tone',()=>{
    const note={kind:'troop' as const,effectKind:'power' as const};
    expect(effectIcon(note)).toContain('<svg');
    expect(effectIcon(note)).toContain('#8fe8ff');
    expect(effectTone(note)).toBe('power');
  });
  it('gives signature and famed effects distinct fallback emblems',()=>{
    expect(effectTone({kind:'signature'})).toBe('signature');
    expect(effectTone({kind:'famed'})).toBe('famed');
    expect(effectIcon({kind:'famed'})).toContain('#e0b758');
  });
});
