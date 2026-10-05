/**
 * 병종 차트로 늘린 병종의 이름·역할·책략(core chart-classes.ts의 계통과 짝).
 * 그림은 차트에서 잘라 낸 낱장을 4동작(대기·준비·공격·피격)으로 기울여 만든 시트를 쓴다(painted-troops.ts).
 */
import type {UnitClass} from '../../core/src/index.ts';

type Role={name:string;role:string;base:UnitClass;tint:number;spells:string[]};
const LEAD=['inspire','march','fortify','warCry'];
const CAST=['fire','embers','gust','windDragon','rumor','ambush'];
const CAST2=[...CAST,'fireWall','rockfall'];
const HEAL=['mend','purify','greatMend'];
const DANCE=['mend','purify','fortify','inspire','greatMend','focus'];
const r=(name:string,role:string,base:UnitClass,tint:number,spells:string[]=[]):Role=>({name,role,base,tint,spells});

export const CHART_ROLES:Partial<Record<UnitClass,Role>>={
  // 검사계
  swordsman:r('검객','날랜 칼 한 자루로 싸우는 검사 계통의 시작','infantry',0xe8dcc0),
  knightErrant:r('협객','검사 2단계 · 회심 일격이 잦아진다','infantry',0xc8a880),
  swordArtist:r('검술가','검사 3단계 · 회심과 공격력이 오른다','infantry',0xc0c8d8),
  swordMaster:r('검사','검사 4단계 · 검기로 방어를 꿰뚫는다','infantry',0xd8a060),
  swordSaint:r('검성','검사 5단계 · 궁지에서 더 날카로워지는 검의 끝','infantry',0xfff0b0),
  // 군주계
  lord:r('군주','말 위에서 군을 이끄는 군주 계통 · 사기를 북돋운다','cavalry',0x9ab8e8,LEAD),
  hegemon:r('패주','군주 2단계 · 궁지에서 받는 피해가 줄어든다','cavalry',0xc0a070,LEAD),
  sovereign:r('제왕','군주 3단계 · 공격력이 오른다','cavalry',0xe8c060,LEAD),
  sonOfHeaven:r('천자','군주 4단계 · 책략에도 버티는 천명의 군주','cavalry',0xf0e0ff,LEAD),
  // 도독계
  commander:r('도독','칼과 책략을 함께 쓰는 지휘관 계통','infantry',0xa8c0d8,CAST),
  grandCommander:r('대도독','도독 2단계 · 책략 피해가 오른다','infantry',0xd08070,CAST),
  marshal:r('사마','도독 3단계 · 반격이 강해진다','infantry',0xe0c070,CAST2),
  heavenCommander:r('천군도독','도독 4단계 · 천군을 호령하는 대장','infantry',0xe06050,CAST2),
  // 무희계
  dancer:r('무희','춤으로 아군을 북돋고 다치게 한 이를 돌보는 병종','maiden',0xffb0d0,DANCE),
  songstress:r('가희','무희 2단계 · 책략 피해를 덜 받는다','maiden',0xd8b0f0,DANCE),
  beauty:r('가인','무희 3단계 · 회복이 강해진다','maiden',0xf0a080,DANCE),
  heavenDancer:r('천무','무희 4단계 · 하늘의 춤, 물리·책략 모두 덜 받는다','maiden',0xfff0c0,DANCE),
  // 산악기병계
  mountainCav:r('산악기병','산과 숲을 평지처럼 달리는 기병','cavalry',0xc8a878),
  scoutCav:r('수색기병','산악기병 2단계 · 회심 일격','cavalry',0xd8c8a8),
  raidCav:r('맹습기병','산악기병 3단계 · 움직인 뒤 치면 더 아프다','cavalry',0xa0a0a0),
  pegasusCav:r('비마','산악기병 4단계 · 날개 달린 백마','cavalry',0xf0f0ff),
  // 효기병계
  valiantCav:r('효기병','날랜 돌격 기병 계통','cavalry',0xc89060),
  dragonCav:r('용기병','효기병 2단계 · 돌격 피해가 오른다','cavalry',0xe0b060),
  stormCav:r('돌격효기병','효기병 3단계 · 친 만큼 체력을 되찾는다','cavalry',0xff8040),
  heavenCav:r('천군효기병','효기병 4단계 · 붉은 갑주의 천군 기병','cavalry',0xe04040),
  // 전차계
  lightChariot:r('경전차','두 필 말이 끄는 가벼운 전차','heavyCav',0xc0a080),
  assaultChariot:r('돌격전차','전차 2단계 · 바퀴 날로 돌진한다','heavyCav',0xa0a8b0),
  heavyChariot:r('중전차','전차 3단계 · 철갑으로 물리 피해를 덜 받는다','heavyCav',0x9098a0),
  divineChariot:r('신전차','전차 4단계 · 용머리 금전차','heavyCav',0xffd060),
  // 정란계
  siegeTower:r('경정란','높은 망루에서 활을 쏘는 공성탑 · 사거리 1~3','catapult',0xc0a070),
  jinglan:r('정란','정란 2단계 · 공격력이 오른다','catapult',0xb08860),
  heavyJinglan:r('중정란','정란 3단계 · 두꺼운 판벽','catapult',0x907860),
  divineJinglan:r('신정란','정란 4단계 · 금장 망루, 방어를 꿰뚫는다','catapult',0xf0d080),
  // 천자계
  crownPrince:r('황태자','황실의 후계 · 회복과 정화','strategist',0xa0b8e0,HEAL),
  royalPrince:r('친왕공','천자 2단계 · 책략 피해를 덜 받는다','strategist',0xc0c8d0,HEAL),
  emperor:r('황제','천자 3단계 · 회복이 강해진다','strategist',0xffd040,HEAL),
  heavenEmperor:r('천자도록','천자 4단계 · 천자의 위광','strategist',0xfff0c0,HEAL),
  // 보급계
  transport:r('수송대','손수레로 군량을 나르며 다친 병사를 돌본다','engineer',0xc8b088,['mend']),
  baggageTrain:r('치중대','보급 2단계 · 수레 행렬, 회복이 오른다','engineer',0xd0b890,['mend','purify']),
  woodenOx:r('목우유마','보급 3단계 · 제갈량의 나무 소','engineer',0xb08858,HEAL),
  divineOx:r('신목우','보급 4단계 · 금빛 신목우','engineer',0xffd060,HEAL),
  // 모병 특수 병과 계통
  nanmanRider:r('남만기병','남만의 날랜 기마병','cavalry',0xc08860),
  nanmanBeast:r('남만맹수병','남만기병 2단계 · 맹수를 탄 기병','cavalry',0xa07050),
  gaemaWarrior:r('고구려 개마무사','사람과 말 모두 쇠미늘을 두른 기병','heavyCav',0x808890),
  gaemaCaptain:r('개마대장','개마 2단계 · 물리 피해를 덜 받는다','heavyCav',0x9098a8),
  whiteTigerCav:r('백호기병','개마 3단계 · 백호 갑주, 방어를 꿰뚫는다','heavyCav',0xf0f0f0),
  halberdCav:r('극기병','극을 든 기병 · 창병 상대로 버틴다','cavalry',0xb09070),
  heavyHalberdCav:r('중장극기병','극기병 2단계 · 반격이 강해진다','cavalry',0x9098a0),
  wheelSage:r('사륜거 책사','수레 위의 책사 · 느리지만 책략이 강하다','strategist',0xe0e0d0,CAST),
  fanSage:r('백우선 사륜거','사륜거 2단계 · 백우선의 신산','strategist',0xc0f0d0,CAST2),
  yellowTurban:r('황건병','황건의 무리 · 궁지에서 사나워진다','infantry',0xf0d040),
  ytArcher:r('황건궁병','황건의 궁수','archer',0xe8c840),
  ytSpear:r('황건창병','황건의 창병 · 반격이 강하다','spearman',0xe8c840),
  ytBrawler:r('황건무인','맨손의 황건 무인 · 회심 일격','monk',0xe8c840),
  nanmanFoot:r('남만보병','험지를 가리지 않는 남만의 보병','infantry',0xc08860),
  northFoot:r('북방보병','북방 이민족의 보병','infantry',0xb0a890),
  northRider:r('북방기병','말 위에서 활을 쏘는 북방 기병','horseArcher',0xb0a078),
  palanquin:r('어가','천자의 가마 · 책략 피해를 덜 받는다','strategist',0xf0a0a0,HEAL),
  baguaChariot:r('팔괘전차','팔괘진을 새긴 전차 · 책략을 쓴다','heavyCav',0x90e0b0,CAST),
  flyingBlade:r('비도수','칼을 던지는 자객 · 사거리 1~2','bandit',0x909090),
  bashuRepeater:r('파촉 연노병','파촉의 연노 부대','crossbow',0xa0b070),
  // 기존 계통의 4단계
  ironInfantry:r('무극보병','보병 4단계 · 철갑 보병','infantry',0xffd060),
  divineSpear:r('신창','창병 4단계 · 금창의 달인','spearman',0xffd060),
  divineStrategist:r('신산','책사 4단계 · 신묘한 계산','strategist',0xfff0c0,['fire','embers','gust','windDragon','ambush','fireWall','rockfall','whirlwind','feint','tempest','breakArmor','chainFire','skyFire','shatter']),
  heavenTaoist:r('천도사','도사 4단계 · 하늘의 도를 부린다','taoist',0xfff0a0,['fire','gust','windDragon','flood','waterSurge','thunder','whirlwind','tempest','thunderbolt','gale','mire','tidalLine','thunderCross','quake']),
  fistSaint:r('권성','무도가 4단계 · 주먹의 성인','monk',0xffd060,['mend','march','fortify']),
  chieftain:r('두령','산적 4단계 · 산채의 두령','bandit',0xe0a060),
  admiral:r('수군도독','수군 4단계 · 수군을 거느리는 도독','navy',0x80a0e0),
  wujiHeavyCav:r('무극중기병','중기병 4단계 · 금장 중기병','heavyCav',0xffd060),
  dragonRam:r('신충차','충차 4단계 · 용머리 충차','ram',0x80c080),
};
