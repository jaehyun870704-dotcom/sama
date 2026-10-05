/**
 * 병종·장수 겉모습 사양 — 도트 생성기(unit-pixel.ts)가 이대로 그린다.
 *
 * 병종마다 탈것·갑옷·투구·무기·방패·짐을 따로 정해 색만 다른 그림이 나오지 않게 한다.
 * 진화 단계(1→2→3)는 갑옷의 모양 자체가 바뀐다: 천옷·가죽 → 찰갑(어깨 갑) → 비늘·판갑(금테·망토·깃발).
 * 이름 있는 장수는 고유 사양(무기·수염·말 색·투구)을 따로 둔다.
 */
import type {UnitClass} from '../../core/src/index.ts';
import {tierOf,familyOf} from '../../core/src/index.ts';

export type Mount='foot'|'horse'|'elephant';
export type Armor='tunic'|'vest'|'leather'|'lamellar'|'scale'|'plate'|'rattan'|'robe'|'monkRobe'|'fur'|'bare'|'apron'|'night';
export type Helm='none'|'topknot'|'headband'|'hood'|'cap'|'kettle'|'plume'|'tallPlume'|'horned'|'lion'|'turban'|'rattanHat'|'straw'|'bald'|'scholar'|'crown'|'pheasant'|'veil'|'flower'|'mask'|'feather'|'fur';
export type Weapon='sword'|'dao'|'axe'|'greatBlade'|'guandao'|'spear'|'pike'|'ji'|'snakeSpear'|'javelin'|'bow'|'longbow'|'crossbow'|'repeater'|'greatBow'|'sling'|'boulder'|'fan'|'staff'|'orbStaff'|'bell'|'sticks'|'hammer'|'dagger'|'fists'|'flag'|'gourd'|'mace'|'none';
export type Off='none'|'gourd'|'round'|'tower'|'rattan'|'buckler'|'kite'|'drum'|'scroll'|'dagger'|'sword';
export type Pack='none'|'quiver'|'javelins'|'stones'|'wood'|'medicine'|'bigDrum'|'rope';
export type Metal='iron'|'steel'|'gold'|'bronze'|'black'|'white';
export type HorseCoat='bay'|'black'|'white'|'red'|'grey'|'dun';

export interface Look{
  mount:Mount;armor:Armor;helm:Helm;weapon:Weapon;off:Off;tier:1|2|3;
  pack?:Pack;cape?:boolean;banners?:0|1|2;
  beard?:'none'|'stubble'|'short'|'goatee'|'long'|'full';
  hair?:'black'|'grey'|'white'|'brown'|'red';
  skin?:'light'|'tan'|'dark';
  horse?:HorseCoat;barding?:0|1|2;
  /** 옷 주색(색상각). 없으면 진영 색. */
  cloth?:number;
  /** 띠·술·깃털에 쓰는 두 번째 색(색상각, -1은 흰색, -2는 검정) */
  accent:number;
  trim?:'none'|'bronze'|'silver'|'gold';
  metal?:Metal;
  build?:'slim'|'normal'|'big';
  female?:boolean;eyepatch?:boolean;
  /** 술법 기운(색상각) */
  aura?:number;
  /** 무기 색 바꿈(청룡도 초록 등, 색상각) */
  weaponHue?:number;
}

type Spec=Omit<Look,'tier'>;
const S=(o:Spec)=>o;
/** 병종별 사양. 진화 단계는 tierOf로 붙인다. */
const CLASS:Partial<Record<UnitClass,Spec>>={
  // ── 보병: 둥근 방패와 환도 → 큰 방패 → 금위 대방패와 깃발
  infantry:S({mount:'foot',armor:'tunic',helm:'cap',weapon:'dao',off:'round',accent:28}),
  shieldGuard:S({mount:'foot',armor:'lamellar',helm:'kettle',weapon:'sword',off:'tower',accent:0,metal:'steel'}),
  royalGuard:S({mount:'foot',armor:'scale',helm:'tallPlume',weapon:'sword',off:'tower',accent:0,metal:'gold',trim:'gold',cape:true,banners:1}),
  axeman:S({mount:'foot',armor:'vest',helm:'headband',weapon:'axe',off:'none',accent:4,build:'big',beard:'full'}),
  greatBlade:S({mount:'foot',armor:'leather',helm:'kettle',weapon:'greatBlade',off:'none',accent:14,build:'big',beard:'short'}),
  xianzhen:S({mount:'foot',armor:'plate',helm:'horned',weapon:'greatBlade',off:'buckler',accent:0,metal:'black',trim:'bronze',build:'big',cape:true,banners:2,beard:'full'}),
  rattan:S({mount:'foot',armor:'rattan',helm:'rattanHat',weapon:'dao',off:'rattan',accent:20,skin:'dark'}),
  rattanElite:S({mount:'foot',armor:'rattan',helm:'feather',weapon:'spear',off:'rattan',accent:12,skin:'dark',build:'big'}),
  wuguoRattan:S({mount:'foot',armor:'rattan',helm:'crown',weapon:'greatBlade',off:'rattan',accent:44,skin:'dark',build:'big',trim:'gold',cape:true,banners:1}),
  qingzhou:S({mount:'foot',armor:'tunic',helm:'headband',weapon:'spear',off:'buckler',accent:50,beard:'stubble'}),
  danyang:S({mount:'foot',armor:'leather',helm:'hood',weapon:'dao',off:'dagger',accent:200}),
  baier:S({mount:'foot',armor:'scale',helm:'plume',weapon:'sword',off:'tower',accent:-1,metal:'white',trim:'silver',cape:true,banners:1}),
  jiangdong:S({mount:'foot',armor:'tunic',helm:'topknot',weapon:'sword',off:'buckler',accent:0,cloth:0}),
  bawang:S({mount:'foot',armor:'lamellar',helm:'kettle',weapon:'ji',off:'none',accent:0,metal:'black',cloth:0,beard:'short'}),
  overlordGuard:S({mount:'foot',armor:'plate',helm:'tallPlume',weapon:'guandao',off:'none',accent:0,metal:'black',trim:'gold',cloth:0,cape:true,banners:2,build:'big'}),
  // ── 창병
  spearman:S({mount:'foot',armor:'tunic',helm:'cap',weapon:'spear',off:'none',accent:0}),
  pikeman:S({mount:'foot',armor:'lamellar',helm:'kettle',weapon:'pike',off:'none',accent:0,metal:'steel'}),
  halberdier:S({mount:'foot',armor:'scale',helm:'plume',weapon:'ji',off:'none',accent:0,metal:'steel',trim:'gold',cape:true}),
  javelin:S({mount:'foot',armor:'vest',helm:'headband',weapon:'javelin',off:'buckler',pack:'javelins',accent:30}),
  eliteJavelin:S({mount:'foot',armor:'leather',helm:'kettle',weapon:'javelin',off:'round',pack:'javelins',accent:30}),
  flyingSpear:S({mount:'foot',armor:'scale',helm:'plume',weapon:'javelin',off:'none',pack:'javelins',accent:30,metal:'bronze',trim:'gold',cape:true}),
  jishi:S({mount:'foot',armor:'lamellar',helm:'hood',weapon:'ji',off:'none',accent:280}),
  daji:S({mount:'foot',armor:'lamellar',helm:'horned',weapon:'ji',off:'none',accent:280,metal:'steel',build:'big'}),
  tianji:S({mount:'foot',armor:'scale',helm:'crown',weapon:'ji',off:'none',accent:280,metal:'steel',trim:'gold',cape:true,banners:2}),
  // ── 궁병·투석병
  archer:S({mount:'foot',armor:'tunic',helm:'cap',weapon:'bow',off:'none',pack:'quiver',accent:30}),
  longbow:S({mount:'foot',armor:'leather',helm:'hood',weapon:'longbow',off:'none',pack:'quiver',accent:110}),
  sharpshooter:S({mount:'foot',armor:'scale',helm:'feather',weapon:'longbow',off:'none',pack:'quiver',accent:-1,metal:'bronze',trim:'gold',cape:true}),
  slinger:S({mount:'foot',armor:'vest',helm:'headband',weapon:'sling',off:'none',pack:'stones',accent:30,skin:'tan'}),
  hurler:S({mount:'foot',armor:'leather',helm:'cap',weapon:'sling',off:'buckler',pack:'stones',accent:30,build:'big'}),
  boulderCorps:S({mount:'foot',armor:'fur',helm:'horned',weapon:'boulder',off:'none',accent:30,build:'big',beard:'full'}),
  // ── 노병
  crossbow:S({mount:'foot',armor:'lamellar',helm:'kettle',weapon:'crossbow',off:'none',pack:'quiver',accent:0}),
  repeater:S({mount:'foot',armor:'leather',helm:'hood',weapon:'repeater',off:'none',accent:0}),
  greatBow:S({mount:'foot',armor:'scale',helm:'plume',weapon:'greatBow',off:'none',pack:'quiver',accent:0,metal:'black',trim:'gold',cape:true,build:'big'}),
  shieldBow:S({mount:'foot',armor:'tunic',helm:'cap',weapon:'crossbow',off:'tower',accent:120}),
  xiandeng:S({mount:'foot',armor:'lamellar',helm:'kettle',weapon:'crossbow',off:'kite',accent:120,metal:'steel'}),
  baizhan:S({mount:'foot',armor:'plate',helm:'horned',weapon:'repeater',off:'tower',accent:120,metal:'black',trim:'gold',cape:true,banners:1}),
  // ── 기병(말)
  cavalry:S({mount:'horse',armor:'leather',helm:'cap',weapon:'dao',off:'none',horse:'bay',barding:0,accent:0}),
  lancer:S({mount:'horse',armor:'lamellar',helm:'kettle',weapon:'pike',off:'none',horse:'bay',barding:1,accent:0,metal:'steel'}),
  tigerRider:S({mount:'horse',armor:'scale',helm:'lion',weapon:'ji',off:'none',horse:'black',barding:2,accent:30,metal:'gold',trim:'gold',cape:true,banners:1}),
  xiliang:S({mount:'horse',armor:'fur',helm:'fur',weapon:'spear',off:'none',horse:'dun',barding:0,accent:20,beard:'full',skin:'tan'}),
  feixiong:S({mount:'horse',armor:'lamellar',helm:'horned',weapon:'mace',off:'none',horse:'black',barding:1,accent:0,metal:'black',beard:'full'}),
  liangzhouIron:S({mount:'horse',armor:'plate',helm:'lion',weapon:'pike',off:'none',horse:'grey',barding:2,accent:20,metal:'steel',trim:'bronze',cape:true}),
  langzhong:S({mount:'horse',armor:'leather',helm:'cap',weapon:'sword',off:'none',horse:'grey',barding:0,accent:40}),
  yulin:S({mount:'horse',armor:'lamellar',helm:'feather',weapon:'spear',off:'none',horse:'white',barding:1,accent:-1,metal:'steel'}),
  huben:S({mount:'horse',armor:'scale',helm:'lion',weapon:'ji',off:'none',horse:'red',barding:2,accent:30,metal:'steel',trim:'gold',cape:true,banners:1}),
  riderSage:S({mount:'horse',armor:'robe',helm:'scholar',weapon:'fan',off:'none',horse:'white',barding:0,accent:44,beard:'goatee'}),
  swiftSage:S({mount:'horse',armor:'robe',helm:'scholar',weapon:'fan',off:'scroll',horse:'grey',barding:1,accent:190,cape:true,beard:'goatee'}),
  divineSage:S({mount:'horse',armor:'robe',helm:'crown',weapon:'orbStaff',off:'none',horse:'white',barding:2,accent:190,trim:'gold',cape:true,aura:190,beard:'long'}),
  heavyCav:S({mount:'horse',armor:'lamellar',helm:'kettle',weapon:'pike',off:'none',horse:'black',barding:1,accent:0,metal:'iron'}),
  ironCav:S({mount:'horse',armor:'plate',helm:'mask',weapon:'pike',off:'none',horse:'black',barding:2,accent:0,metal:'steel'}),
  ironPagoda:S({mount:'horse',armor:'plate',helm:'mask',weapon:'mace',off:'round',horse:'black',barding:2,accent:0,metal:'black',trim:'gold',cape:true,banners:2,build:'big'}),
  horseArcher:S({mount:'horse',armor:'leather',helm:'fur',weapon:'bow',off:'none',pack:'quiver',horse:'dun',barding:0,accent:30,skin:'tan'}),
  nomad:S({mount:'horse',armor:'fur',helm:'fur',weapon:'bow',off:'none',pack:'quiver',horse:'grey',barding:0,accent:150,skin:'tan',beard:'short'}),
  whiteHorse:S({mount:'horse',armor:'scale',helm:'plume',weapon:'bow',off:'none',pack:'quiver',horse:'white',barding:1,accent:-1,metal:'white',trim:'silver',cape:true,cloth:210}),
  // ── 코끼리
  elephant:S({mount:'elephant',armor:'bare',helm:'feather',weapon:'spear',off:'none',accent:20,skin:'dark',barding:0}),
  warElephant:S({mount:'elephant',armor:'rattan',helm:'rattanHat',weapon:'javelin',off:'none',accent:20,skin:'dark',barding:1}),
  elephantKing:S({mount:'elephant',armor:'scale',helm:'crown',weapon:'ji',off:'none',accent:44,skin:'dark',barding:2,metal:'gold',trim:'gold',banners:2}),
  // ── 책사·풍수사·고취수
  strategist:S({mount:'foot',armor:'robe',helm:'scholar',weapon:'fan',off:'none',accent:44,beard:'goatee'}),
  tactician:S({mount:'foot',armor:'robe',helm:'scholar',weapon:'fan',off:'scroll',accent:44,cape:true,beard:'goatee'}),
  mastermind:S({mount:'foot',armor:'robe',helm:'crown',weapon:'fan',off:'scroll',accent:44,trim:'gold',cape:true,aura:270,beard:'long'}),
  fengshui:S({mount:'foot',armor:'robe',helm:'topknot',weapon:'staff',off:'none',accent:30,cloth:42,beard:'goatee'}),
  sage:S({mount:'foot',armor:'robe',helm:'scholar',weapon:'orbStaff',off:'none',accent:190,cloth:180,cape:true,beard:'long',hair:'grey'}),
  immortal:S({mount:'foot',armor:'robe',helm:'crown',weapon:'orbStaff',off:'gourd',accent:50,cloth:-1,trim:'gold',aura:55,beard:'long',hair:'white'}),
  drummer:S({mount:'foot',armor:'tunic',helm:'headband',weapon:'sticks',off:'drum',accent:4}),
  warDrummer:S({mount:'foot',armor:'leather',helm:'kettle',weapon:'sticks',off:'none',pack:'bigDrum',accent:4,build:'big'}),
  grandBand:S({mount:'foot',armor:'scale',helm:'plume',weapon:'flag',off:'none',pack:'bigDrum',accent:4,metal:'bronze',trim:'gold',cape:true}),
  civilian:S({mount:'foot',armor:'tunic',helm:'straw',weapon:'none',off:'none',accent:30,cloth:35}),
  // ── 술사
  shaman:S({mount:'foot',armor:'fur',helm:'feather',weapon:'bell',off:'none',accent:280,cloth:280,skin:'tan'}),
  warlock:S({mount:'foot',armor:'robe',helm:'mask',weapon:'orbStaff',off:'none',accent:280,cloth:275,aura:280}),
  demonKing:S({mount:'foot',armor:'robe',helm:'horned',weapon:'orbStaff',off:'none',accent:300,cloth:-2,trim:'gold',cape:true,aura:300,build:'big'}),
  maiden:S({mount:'foot',armor:'robe',helm:'flower',weapon:'bell',off:'none',accent:330,cloth:340,female:true}),
  priestess:S({mount:'foot',armor:'robe',helm:'veil',weapon:'staff',off:'none',accent:330,cloth:330,female:true,cape:true}),
  celestial:S({mount:'foot',armor:'robe',helm:'crown',weapon:'fan',off:'none',accent:330,cloth:-1,trim:'gold',aura:330,female:true,cape:true}),
  taoist:S({mount:'foot',armor:'robe',helm:'topknot',weapon:'sword',off:'scroll',accent:200,cloth:205,beard:'goatee'}),
  stormSage:S({mount:'foot',armor:'robe',helm:'scholar',weapon:'orbStaff',off:'none',accent:200,cloth:210,cape:true,aura:200,beard:'long'}),
  thunderGod:S({mount:'foot',armor:'scale',helm:'crown',weapon:'hammer',off:'none',accent:200,metal:'gold',trim:'gold',cape:true,aura:55,build:'big',beard:'full'}),
  physician:S({mount:'foot',armor:'robe',helm:'cap',weapon:'gourd',off:'none',pack:'medicine',accent:140,cloth:140,beard:'goatee'}),
  divineDoctor:S({mount:'foot',armor:'robe',helm:'scholar',weapon:'staff',off:'none',pack:'medicine',accent:140,cloth:150,cape:true,beard:'long',hair:'grey'}),
  medicineSaint:S({mount:'foot',armor:'robe',helm:'crown',weapon:'orbStaff',off:'none',pack:'medicine',accent:140,cloth:-1,trim:'gold',aura:140,beard:'long',hair:'white'}),
  monk:S({mount:'foot',armor:'monkRobe',helm:'bald',weapon:'fists',off:'none',accent:30,cloth:30}),
  warriorMonk:S({mount:'foot',armor:'monkRobe',helm:'bald',weapon:'staff',off:'none',accent:20,cloth:20,build:'big'}),
  arhat:S({mount:'foot',armor:'monkRobe',helm:'bald',weapon:'staff',off:'none',accent:44,cloth:44,trim:'gold',aura:48,build:'big'}),
  // ── 산적·자객·산악병
  bandit:S({mount:'foot',armor:'vest',helm:'headband',weapon:'dao',off:'none',accent:20,beard:'stubble',skin:'tan'}),
  outlaw:S({mount:'foot',armor:'fur',helm:'turban',weapon:'axe',off:'none',accent:20,beard:'full',build:'big'}),
  greenwoodKing:S({mount:'foot',armor:'fur',helm:'crown',weapon:'greatBlade',off:'none',accent:110,beard:'full',build:'big',cape:true,banners:1,trim:'bronze'}),
  assassin:S({mount:'foot',armor:'night',helm:'mask',weapon:'dagger',off:'none',accent:0,cloth:-2,build:'slim'}),
  phantom:S({mount:'foot',armor:'night',helm:'hood',weapon:'dagger',off:'dagger',accent:270,cloth:265,build:'slim'}),
  wraith:S({mount:'foot',armor:'night',helm:'mask',weapon:'dagger',off:'dagger',accent:0,cloth:-2,trim:'gold',cape:true,aura:0,build:'slim'}),
  mountaineer:S({mount:'foot',armor:'vest',helm:'straw',weapon:'bow',off:'none',pack:'rope',accent:110,cloth:110}),
  wudang:S({mount:'foot',armor:'leather',helm:'headband',weapon:'bow',off:'dagger',pack:'quiver',accent:110,cloth:115}),
  cliffWalker:S({mount:'foot',armor:'lamellar',helm:'hood',weapon:'javelin',off:'buckler',pack:'rope',accent:110,cloth:120,metal:'black',cape:true}),
  // ── 공병
  engineer:S({mount:'foot',armor:'apron',helm:'headband',weapon:'hammer',off:'none',pack:'wood',accent:30,beard:'short'}),
  sapper:S({mount:'foot',armor:'apron',helm:'kettle',weapon:'hammer',off:'none',pack:'wood',accent:30,build:'big',beard:'full'}),
  masterBuilder:S({mount:'foot',armor:'lamellar',helm:'cap',weapon:'hammer',off:'scroll',pack:'wood',accent:44,trim:'gold',beard:'long',hair:'grey'}),
};
/** 사양이 없는 병종(진화 단계만 있는 경우)은 계열의 첫 단계를 쓰고 단계만 올린다. */
export function classLook(c:UnitClass):Look|null{
  const spec=CLASS[c]??CLASS[familyOf(c)];if(!spec)return null;
  return {...spec,tier:Math.max(1,Math.min(3,tierOf(c))) as 1|2|3};
}
/** 사람이 들고 서는 병종인가(충차·포차·배는 그림 시트를 그대로 쓴다). */
export function hasPixelLook(c:UnitClass){return !!(CLASS[c]??CLASS[familyOf(c)]);}

/** 이름 있는 장수의 고유 모습 — 병종 사양 위에 덮어쓴다. */
const OFFICER:Record<string,Partial<Look>>={
  '사마의':{armor:'robe',helm:'scholar',weapon:'fan',off:'scroll',cloth:230,accent:-2,beard:'long',trim:'gold',cape:true},
  '사마사':{armor:'scale',helm:'plume',weapon:'sword',cloth:230,accent:-2,metal:'black',trim:'gold',eyepatch:true,beard:'short',cape:true},
  '사마소':{armor:'lamellar',helm:'kettle',weapon:'sword',cloth:230,accent:-2,metal:'steel',trim:'gold',beard:'goatee',cape:true},
  '사마랑':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:220,accent:-1,beard:'goatee'},
  '사마방':{armor:'robe',helm:'scholar',weapon:'staff',cloth:215,accent:-1,beard:'long',hair:'white'},
  '장춘화':{armor:'robe',helm:'flower',weapon:'dagger',female:true,cloth:330,accent:-1},
  '조조':{armor:'scale',helm:'crown',weapon:'sword',cloth:0,accent:44,metal:'gold',trim:'gold',cape:true,banners:1,beard:'short'},
  '조비':{armor:'robe',helm:'crown',weapon:'sword',cloth:270,accent:44,trim:'gold',cape:true,beard:'goatee'},
  '조식':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:200,accent:-1},
  '조예':{armor:'robe',helm:'crown',weapon:'sword',cloth:265,accent:44,trim:'gold',cape:true},
  '조진':{armor:'plate',helm:'tallPlume',weapon:'ji',metal:'steel',trim:'gold',cape:true,beard:'full'},
  '조인':{armor:'plate',helm:'horned',weapon:'pike',off:'tower',metal:'black',trim:'bronze',beard:'full',build:'big'},
  '조휴':{armor:'lamellar',helm:'plume',weapon:'spear',metal:'steel',trim:'bronze',cape:true},
  '조상':{armor:'scale',helm:'tallPlume',weapon:'sword',metal:'gold',trim:'gold',cape:true,build:'big'},
  '하후돈':{armor:'plate',helm:'horned',weapon:'guandao',metal:'black',eyepatch:true,beard:'full',cape:true},
  '하후연':{armor:'lamellar',helm:'plume',weapon:'bow',pack:'quiver',metal:'steel',beard:'short',horse:'bay'},
  '허저':{armor:'bare',helm:'topknot',weapon:'mace',build:'big',beard:'full',skin:'tan'},
  '장료':{armor:'scale',helm:'lion',weapon:'ji',metal:'steel',trim:'gold',cape:true,beard:'goatee',horse:'black'},
  '서황':{armor:'plate',helm:'kettle',weapon:'axe',metal:'iron',beard:'full',build:'big'},
  '장합':{armor:'lamellar',helm:'plume',weapon:'spear',metal:'steel',accent:200,cape:true,beard:'goatee'},
  '곽회':{armor:'lamellar',helm:'kettle',weapon:'spear',metal:'steel',beard:'short'},
  '등애':{armor:'leather',helm:'hood',weapon:'spear',beard:'short',pack:'rope'},
  '종회':{armor:'scale',helm:'scholar',weapon:'sword',metal:'steel',cape:true},
  '순욱':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:200,accent:-1,beard:'goatee'},
  '곽가':{armor:'robe',helm:'topknot',weapon:'fan',cloth:180,accent:44},
  '가후':{armor:'robe',helm:'scholar',weapon:'fan',cloth:-2,accent:280,beard:'long',hair:'grey'},
  '제갈량':{armor:'robe',helm:'scholar',weapon:'fan',cloth:-1,accent:-2,trim:'none',cape:true,beard:'long',aura:200},
  '관우':{armor:'scale',helm:'kettle',weapon:'guandao',weaponHue:150,cloth:130,accent:130,metal:'bronze',beard:'long',skin:'dark',horse:'red',cape:true,build:'big'},
  '장비':{armor:'plate',helm:'kettle',weapon:'snakeSpear',cloth:-2,accent:0,metal:'black',beard:'full',build:'big',horse:'black'},
  '조운':{armor:'scale',helm:'plume',weapon:'spear',cloth:-1,accent:-1,metal:'white',trim:'silver',horse:'white',cape:true},
  '마초':{armor:'scale',helm:'lion',weapon:'spear',cloth:-1,accent:0,metal:'white',trim:'silver',horse:'white',cape:true},
  '황충':{armor:'lamellar',helm:'kettle',weapon:'longbow',pack:'quiver',metal:'bronze',beard:'long',hair:'white'},
  '위연':{armor:'plate',helm:'horned',weapon:'guandao',metal:'black',beard:'full',skin:'dark'},
  '강유':{armor:'scale',helm:'plume',weapon:'spear',metal:'steel',cloth:130,trim:'gold',cape:true},
  '유비':{armor:'robe',helm:'crown',weapon:'sword',off:'sword',cloth:130,accent:44,trim:'gold',cape:true,beard:'short'},
  '마속':{armor:'robe',helm:'scholar',weapon:'fan',cloth:130},
  '왕평':{armor:'leather',helm:'hood',weapon:'spear',cloth:120},
  '방통':{armor:'robe',helm:'topknot',weapon:'fan',cloth:30,beard:'full'},
  '서서':{armor:'robe',helm:'scholar',weapon:'sword',cloth:150},
  '여포':{armor:'scale',helm:'pheasant',weapon:'ji',cloth:-2,accent:0,metal:'gold',trim:'gold',horse:'red',cape:true,banners:0,build:'big'},
  '진궁':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:300,beard:'goatee'},
  '주유':{armor:'scale',helm:'plume',weapon:'sword',cloth:0,accent:0,metal:'steel',trim:'gold',cape:true},
  '손권':{armor:'scale',helm:'crown',weapon:'sword',cloth:0,accent:44,metal:'gold',trim:'gold',cape:true,beard:'full',hair:'red'},
  '육손':{armor:'robe',helm:'scholar',weapon:'sword',cloth:0,accent:44,trim:'gold'},
  '여몽':{armor:'lamellar',helm:'kettle',weapon:'dao',off:'round',cloth:0,beard:'short'},
  '감녕':{armor:'vest',helm:'feather',weapon:'dao',cloth:0,accent:44,beard:'stubble',skin:'tan'},
  '황개':{armor:'lamellar',helm:'kettle',weapon:'mace',cloth:0,beard:'long',hair:'white'},
  '노숙':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:0,beard:'short'},
  '맹획':{armor:'fur',helm:'feather',weapon:'axe',skin:'dark',beard:'full',build:'big',cape:true},
  '축융':{armor:'rattan',helm:'feather',weapon:'javelin',pack:'javelins',skin:'dark',female:true},
  '공손연':{armor:'fur',helm:'fur',weapon:'sword',cloth:290,accent:-1,trim:'bronze',cape:true,beard:'short'},
  '맹달':{armor:'lamellar',helm:'kettle',weapon:'spear',metal:'steel',beard:'goatee'},
  '원소':{armor:'scale',helm:'crown',weapon:'sword',cloth:44,accent:44,metal:'gold',trim:'gold',cape:true,beard:'long'},
  '문추':{armor:'plate',helm:'horned',weapon:'spear',cloth:44,metal:'iron',beard:'full',build:'big'},
  '안량':{armor:'plate',helm:'horned',weapon:'guandao',cloth:44,metal:'iron',beard:'full',build:'big'},
  '항우':{armor:'plate',helm:'tallPlume',weapon:'ji',cloth:0,accent:0,metal:'black',trim:'gold',horse:'black',cape:true,banners:1,build:'big',beard:'short'},
  '유방':{armor:'robe',helm:'crown',weapon:'sword',cloth:30,accent:0,trim:'gold',cape:true,beard:'long'},
  '한신':{armor:'scale',helm:'plume',weapon:'sword',cloth:30,metal:'steel',trim:'gold',cape:true},
  '장량':{armor:'robe',helm:'scholar',weapon:'none',off:'scroll',cloth:-1,accent:30},
  '우희':{armor:'robe',helm:'flower',weapon:'sword',off:'sword',female:true,cloth:0,accent:330},
  '번쾌':{armor:'bare',helm:'headband',weapon:'axe',off:'round',build:'big',beard:'full',skin:'tan'},
};
/** 장수 모습: 병종 사양 + 장수 고유 사양. 고유 사양이 없으면 이름에서 수염·머리·띠 색을 정해 장수끼리도 다르게 한다. */
export function officerLook(base:Look,name:string):Look{
  const own=OFFICER[name];
  let h=0;for(const ch of name)h=(h*31+ch.charCodeAt(0))>>>0;
  const beards=['short','goatee','long','full','stubble'] as const;
  const generic:Partial<Look>={beard:base.female?'none':beards[h%beards.length]??'short',accent:(h>>3)%360,trim:base.trim&&base.trim!=='none'?base.trim:'bronze',cape:true};
  const merged:Look={...base,...generic,...own,tier:base.tier};
  if(merged.mount==='horse'&&!merged.horse)merged.horse='bay';
  return merged;
}

const ARMOR_KO:Record<Look['armor'],string>={tunic:'무명 전포',vest:'민소매 가죽 조끼',leather:'가죽 갑',lamellar:'쇠 찰갑',scale:'비늘 갑',plate:'통판 철갑',rattan:'등나무 갑',robe:'긴 도포',monkRobe:'승복',fur:'털가죽 옷',bare:'맨몸',apron:'작업 앞치마',night:'검은 야행복'};
const HELM_KO:Record<Look['helm'],string>={none:'맨머리',topknot:'상투',headband:'머리띠',hood:'두건',cap:'책(幘) 모자',kettle:'철 투구',plume:'술 달린 투구',tallPlume:'긴 깃 투구',horned:'뿔 투구',lion:'사자 투구',turban:'두른 수건',rattanHat:'등나무 삿갓',straw:'밀짚 삿갓',bald:'민머리',scholar:'진현관',crown:'금관',pheasant:'꿩깃 관',veil:'면사포',flower:'꽃 비녀',mask:'철가면',feather:'깃털 장식',fur:'털모자'};
const WEAPON_KO:Record<Weapon,string>={sword:'검',dao:'환도',axe:'큰 도끼',greatBlade:'대도',guandao:'언월도',spear:'창',pike:'장창',ji:'극',snakeSpear:'사모',javelin:'투창',bow:'활',longbow:'장궁',crossbow:'쇠뇌',repeater:'연노',greatBow:'대황노',sling:'투석끈',boulder:'바위',fan:'우선',staff:'석장',orbStaff:'보주 지팡이',bell:'방울',sticks:'북채',hammer:'망치',dagger:'단검',fists:'맨주먹',flag:'군기',gourd:'약 호리병',mace:'철퇴',none:'맨손'};
const OFF_KO:Partial<Record<Off,string>>={round:'둥근 방패',tower:'큰 방패',rattan:'등나무 방패',buckler:'손방패',kite:'연 방패',drum:'북',scroll:'두루마리',dagger:'보조 단검',sword:'쌍검',gourd:'약 호리병'};
/** 겉모습 한 줄 설명(도감·진화표) */
export function describeLook(l:Look){
  const parts=[WEAPON_KO[l.weapon],OFF_KO[l.off],ARMOR_KO[l.armor],HELM_KO[l.helm]].filter(Boolean) as string[];
  if(l.mount==='horse')parts.push(l.barding===2?'말 전신 마갑':l.barding===1?'마의 두른 말':'맨 말');
  if(l.mount==='elephant')parts.push(l.barding===2?'철갑 두른 코끼리':l.barding===1?'덮개 두른 코끼리':'코끼리');
  if(l.cape)parts.push('망토');if(l.banners)parts.push(`등 깃발 ${l.banners}`);if(l.aura!==undefined)parts.push('술법 기운');
  return parts.join(' · ');
}
