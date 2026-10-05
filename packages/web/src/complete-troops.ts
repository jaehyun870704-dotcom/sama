import type {UnitClass} from '../../core/src/index.ts';

/**
 * 새 레퍼런스 화풍으로 다시 그린 전체 병종 시트.
 * 한 시트는 8행(병종) x 4열(대기·준비/걷기·공격/책략·피격/방어)이다.
 */
export const completeTroopRows = [
  ['infantry','shieldGuard','royalGuard','ironInfantry','spearman','pikeman','halberdier','divineSpear'],
  ['cavalry','lancer','tigerRider','heavyCav','ironCav','ironPagoda','wujiHeavyCav','xiliang'],
  ['archer','longbow','sharpshooter','crossbow','repeater','greatBow','slinger','hurler'],
  ['strategist','tactician','mastermind','divineStrategist','fengshui','sage','immortal','crownPrince'],
  ['shaman','warlock','demonKing','maiden','priestess','celestial','taoist','stormSage'],
  ['thunderGod','heavenTaoist','monk','warriorMonk','arhat','fistSaint','bandit','outlaw'],
  ['greenwoodKing','chieftain','assassin','phantom','wraith','rattan','rattanElite','wuguoRattan'],
  ['elephant','warElephant','elephantKing','horseArcher','nomad','whiteHorse','boulderCorps','feixiong'],
  ['liangzhouIron','ram','ironRam','cloudRam','dragonRam','catapult','engineer','navy'],
  ['mengchong','louchuan','admiral','siegeTower','jinglan','heavyJinglan','divineJinglan','swordsman'],
  ['knightErrant','swordArtist','swordMaster','swordSaint','commander','grandCommander','marshal','heavenCommander'],
  ['lord','hegemon','sovereign','sonOfHeaven','dancer','songstress','beauty','heavenDancer'],
  ['royalPrince','emperor','heavenEmperor','wheelSage','fanSage','palanquin','mountainCav','scoutCav'],
  ['raidCav','pegasusCav','valiantCav','dragonCav','stormCav','heavenCav','lightChariot','assaultChariot'],
  ['heavyChariot','divineChariot','transport','baggageTrain','woodenOx','divineOx','nanmanRider','nanmanBeast'],
  ['gaemaWarrior','gaemaCaptain','whiteTigerCav','halberdCav','heavyHalberdCav','northRider','yellowTurban','ytArcher'],
  ['ytSpear','ytBrawler','nanmanFoot','northFoot','baguaChariot','flyingBlade','bashuRepeater','civilian'],
] as const satisfies readonly (readonly UnitClass[])[];

export const completeTroopSheets = completeTroopRows.map((_,i)=>({
  id:`complete-${String(i+1).padStart(2,'0')}`,
  url:`troops-complete-${String(i+1).padStart(2,'0')}-${i===9?'v2':'v1'}.png`,
  rows:8,
  // 생성 원화의 희미한 반투명 배경은 인접 행을 이어 붙이므로 실루엣으로 취급하지 않는다.
  alphaCutoff:240,
  strictGrid:true,
}));

export type CompleteTroopCell={sheet:string;row:number;rows:number};
export const completeTroopArt=Object.fromEntries(
  completeTroopRows.flatMap((classes,sheet)=>classes.map((troop,row)=>[
    troop,{sheet:`complete-${String(sheet+1).padStart(2,'0')}`,row,rows:8},
  ])),
) as Record<UnitClass,CompleteTroopCell>;
