import {describe,expect,it} from 'vitest';
import {duelArena,duelModelFrame} from '../src/duel-ui.ts';
import {newDuel} from '../src/duel.ts';

describe('일기토·설전 인물 크기',()=>{
  it.each(['duel','debate'] as const)('%s가 같은 인물 프레임과 방향 클래스를 쓴다',kind=>{
    const state=newDuel(kind,{id:'p',name:'사마의',stat:80},{id:'e',name:'장비',stat:80});
    const models={
      player:duelModelFrame('<span class="battle-model"></span>','face-right'),
      enemy:duelModelFrame('<div class="talk-bust"></div>','face-left'),
    };
    const html=duelArena(state,{models,backdrop:''});
    expect(html).toContain(`duel-stage ${kind}`);
    expect(html.match(/duel-model duel-character-frame/g)).toHaveLength(2);
    expect(html).toContain('duel-character-frame face-right');
    expect(html).toContain('duel-character-frame face-left');
  });
});
