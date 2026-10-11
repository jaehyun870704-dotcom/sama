import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {officerBattleArt,officerBattleURL} from '../src/officer-battle-art.ts';

const requested=[
  '가후','우금','악진','등애','종회','학소','조홍','조창','문빙',
  '관평','마대','서성','정봉','안량','문추','저수','전풍','심배',
  '한신','장량','소하','영포','팽월','번쾌','진평','범증','종리매','계포',
] as const;

describe('painted officer battle art',()=>{
  it('maps every officer explicitly listed for replacement',()=>{
    expect(Object.keys(officerBattleArt)).toHaveLength(requested.length);
    for(const name of requested)expect(officerBattleURL(name),name).toMatch(/^officers\/[\w-]+\.webp$/);
  });
  it('ships every mapped WebP cutout',()=>{
    for(const [name,url] of Object.entries(officerBattleArt)){
      const file=resolve(import.meta.dirname,'../public',url);
      expect(existsSync(file),name).toBe(true);
      const png=readFileSync(file);
      expect(png.subarray(0,4).toString('ascii'),name).toBe('RIFF');
      expect(png.subarray(8,12).toString('ascii'),name).toBe('WEBP');
      expect(png.length,name).toBeGreaterThan(20_000);
    }
  });
  it('ships Zhang Fei as a dedicated dialogue and duel portrait',()=>{
    const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'../public/portraits/manifest.json'),'utf8')) as Record<string,string>;
    expect(manifest['장비']).toBe('zhang-fei.png');
    expect(existsSync(resolve(import.meta.dirname,'../public/portraits',manifest['장비']!))).toBe(true);
  });
});
