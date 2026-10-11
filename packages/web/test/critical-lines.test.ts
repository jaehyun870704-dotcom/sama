import {describe,expect,it} from 'vitest';
import {CRITICAL_LINES,criticalLine} from '../src/critical-lines.ts';
import {officerLook} from '../src/officer-art.ts';

describe('major-officer critical lines',()=>{
  it('only assigns cut-ins to officers with dedicated painted portraits',()=>{
    for(const [name,line] of Object.entries(CRITICAL_LINES)){
      expect(officerLook(name),name).toBeDefined();
      expect(line.length,name).toBeGreaterThanOrEqual(10);
      expect(line.length,name).toBeLessThanOrEqual(30);
    }
    expect(criticalLine('보병')).toBeUndefined();
    expect(criticalLine('성채 수비대장')).toBeUndefined();
  });

  it('keeps the cut-in cast intentionally rare',()=>{
    expect(Object.keys(CRITICAL_LINES)).toHaveLength(11);
  });
});
