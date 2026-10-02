/** Speech-balloon emotes shown above units: each troop class has its own battle
 * cry, and reactions (critical, evade, guard, crisis, status) share a set. */
export type EmoteShape='balloon'|'burst';
export interface Emote {glyph:string;label:string;color:number;shape:EmoteShape}

const RED=0xd8463a,GOLD=0xd9a43a,BLUE=0x3f7fd0,GREEN=0x3d9a63,PURPLE=0x8a5ad0,GREY=0x7d8a86,BROWN=0x9a6a3a;
export const classCries:Record<string,Emote>={
  infantry:{glyph:'斬',label:'베기!',color:RED,shape:'balloon'},
  spearman:{glyph:'槍',label:'창진 찌르기!',color:RED,shape:'balloon'},
  cavalry:{glyph:'突',label:'돌격!',color:RED,shape:'burst'},
  heavyCav:{glyph:'鐵',label:'철기 돌진!',color:RED,shape:'burst'},
  horseArcher:{glyph:'騎',label:'기사 사격!',color:GOLD,shape:'balloon'},
  archer:{glyph:'射',label:'일제 사격!',color:GOLD,shape:'balloon'},
  crossbow:{glyph:'弩',label:'연노 발사!',color:GOLD,shape:'balloon'},
  catapult:{glyph:'砲',label:'투석!',color:BROWN,shape:'burst'},
  ram:{glyph:'衝',label:'충차 돌입!',color:BROWN,shape:'burst'},
  navy:{glyph:'舟',label:'접현!',color:BLUE,shape:'balloon'},
  engineer:{glyph:'工',label:'공병 돌격!',color:BROWN,shape:'balloon'},
  strategist:{glyph:'策',label:'계책!',color:PURPLE,shape:'balloon'},
  fengshui:{glyph:'風',label:'풍수!',color:GREEN,shape:'balloon'},
  shaman:{glyph:'呪',label:'저주!',color:PURPLE,shape:'balloon'},
  maiden:{glyph:'祈',label:'기원!',color:GREEN,shape:'balloon'},
  taoist:{glyph:'道',label:'도술!',color:BLUE,shape:'balloon'},
  physician:{glyph:'醫',label:'의술!',color:GREEN,shape:'balloon'},
  monk:{glyph:'拳',label:'권격!',color:RED,shape:'balloon'},
  bandit:{glyph:'賊',label:'급습!',color:BROWN,shape:'balloon'},
  civilian:{glyph:'!',label:'으악!',color:GREY,shape:'balloon'},
};
export const reactions:Record<string,Emote>={
  counter:{glyph:'反',label:'반격!',color:RED,shape:'balloon'},
  critical:{glyph:'!!',label:'치명타!',color:RED,shape:'burst'},
  evade:{glyph:'…',label:'회피',color:GREY,shape:'balloon'},
  guard:{glyph:'盾',label:'방어!',color:BLUE,shape:'balloon'},
  crisis:{glyph:'!?',label:'위기!',color:GOLD,shape:'balloon'},
  retreat:{glyph:'…',label:'퇴각',color:GREY,shape:'balloon'},
  heal:{glyph:'癒',label:'회복',color:GREEN,shape:'balloon'},
  repair:{glyph:'工',label:'수리',color:BROWN,shape:'balloon'},
  rally:{glyph:'♪',label:'사기 상승',color:GOLD,shape:'balloon'},
  haste:{glyph:'疾',label:'신속',color:GREEN,shape:'balloon'},
  confusion:{glyph:'?',label:'혼란',color:PURPLE,shape:'balloon'},
  burn:{glyph:'火',label:'화상',color:RED,shape:'balloon'},
  bleed:{glyph:'血',label:'출혈',color:RED,shape:'balloon'},
  shock:{glyph:'雷',label:'감전',color:GOLD,shape:'balloon'},
  bound:{glyph:'縛',label:'포박',color:PURPLE,shape:'balloon'},
  seal:{glyph:'封',label:'봉인',color:PURPLE,shape:'balloon'},
  immobile:{glyph:'縛',label:'속박',color:PURPLE,shape:'balloon'},
  breach:{glyph:'破',label:'성문 돌파!',color:GOLD,shape:'burst'},
};
export function cryFor(unitClass:string,isStrategy=false,strategy=''){
  if(strategy==='heal'||strategy==='mend'||strategy==='greatMend')return reactions.heal!;
  if(strategy==='repair')return reactions.repair!;
  const cry=classCries[unitClass];
  if(isStrategy&&cry&&!['strategist','fengshui','shaman','maiden','taoist','physician','monk'].includes(unitClass))return classCries.strategist!;
  return cry??classCries.infantry!;
}
/** Heavy hits that leave a unit standing below a third of its strength. */
export function isCrisis(hpAfter:number,maxHp:number,damage:number){return hpAfter>0&&damage>0&&hpAfter<=maxHp/3;}
