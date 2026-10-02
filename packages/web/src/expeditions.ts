import {configureTrialGoal} from './expedition-objectives.ts';
import {trialMap,expeditionLandscape,navalEnemies} from './expedition-scenes.ts';
import type {MapFile,StageDef,UnitClass} from '../../core/src/index.ts';
import base from '../../data/stages/S1-07.json';
import {treasures,levelInfo,OFFICERS,type Campaign} from './progression.ts';
export interface Expedition {id:string;name:string;kind:'training'|'quest';level:number;requires:number;art:number;lines:string[]}
const tales:Array<[string,number,number,number,string,string,string]>=[
 ['흩어진 무구',1,2,9,'사마랑: 피난민의 수레에 가문의 무구와 군고가 실려 있었다.','사마의: 약탈대의 길목을 막고, 무구가 주인을 찾게 하겠습니다.','장인: 쌍고검과 고정도를 손질했습니다. 피갑과 군고도 가져가십시오.'],
 ['봉인된 군수고',2,3,2,'사마방: 낙양을 떠나며 맡긴 군수고에 도적이 들었다.','사마의: 군수고의 열쇠를 되찾아 남은 이들의 장비를 마련하겠습니다.','수문장: 열쇠를 되찾았군요. 사모와 비도, 쇄자갑과 장군인을 받아 주십시오.'],
 ['산길의 약속',2,4,11,'길잡이: 고개를 지키던 동료들이 산적에게 쫓겨났습니다.','사마랑: 우회로를 확보하고 장인들을 안전하게 돌려보내자.','길잡이: 봉취도와 월아극, 어린갑과 비운안을 약속대로 드립니다.'],
 ['활시위의 비밀',3,5,6,'노장: 사수들이 지키는 진지를 뚫어 보아라. 무작정 다가오면 쓰러질 것이다.','사마의: 숲을 이용해 접근하고 기병으로 측면을 열겠습니다.','노장: 철태궁과 원융노를 맡긴다. 등갑과 손자병법도 전술에 보탬이 될 것이다.'],
 ['병서가 잠든 사당',4,6,14,'학자: 사당을 점거한 무리가 병서를 불태우려 합니다.','사마의: 기록이 사라지면 다음 세대는 같은 실수를 되풀이합니다.','학자: 육도와 명광개를 지켰습니다. 삼첨도와 강편도 함께 가져가십시오.'],
 ['잃어버린 군마',5,7,3,'조진: 군마를 빼앗은 기병이 능선에 진을 쳤다.','사마의: 창병으로 돌격을 막고 노병으로 퇴로를 끊으십시오.','조진: 양유궁과 개산부, 현철갑과 삼략을 회수했다. 다음 싸움에 쓰자.'],
 ['용담의 시험',6,8,17,'백마의 무인: 창은 용기만으로 다루는 것이 아니다. 동료를 지키는 눈이 필요하다.','사마의: 지원대를 보존하면서 중앙의 수비대를 격파하겠습니다.','백마의 무인: 용담창과 쌍철극, 호위갑과 절영을 맡길 만하군.'],
 ['달빛 아래의 교환',6,9,0,'상인: 약탈자를 막아 준다면 숨겨 둔 보물을 내놓겠습니다.','조진: 거래보다 사람이 먼저다. 피난길을 열자.','상인: 유금추와 월광검, 학창의와 조황비전입니다. 약속을 지킵니다.'],
 ['의원의 잃어버린 서책',7,10,9,'의원: 청낭서를 빼앗겼습니다. 부상자들을 치료할 방법이 담겨 있습니다.','사마의: 책을 되찾을 때까지 다친 병사를 뒤로 물리고 진을 유지하십시오.','의원: 청낭서와 백옥검, 호두창과 운금포를 드립니다. 생명을 지키는 데 써 주십시오.'],
 ['팔진의 문',8,11,7,'노군사: 길이 보인다고 곧장 나아가지 마라. 진의 틈을 읽어라.','사마의: 적의 중앙을 묶고 양익을 돌파하겠습니다.','노군사: 팔진도와 칠성기, 용린갑과 황금갑을 계승할 자격을 얻었다.'],
 ['천하를 읽는 기록',8,12,14,'사마방: 사람을 얻는 것과 땅을 얻는 것 중 무엇이 더 어려운가.','사마의: 오늘의 승리보다 내일 함께할 이들을 남기겠습니다.','사마방: 춘추좌씨전과 백옥환, 호부와 군사포를 받거라. 네 길의 증표다.'],
];
export const expeditions:Expedition[]=[
 {id:'T01',name:'초진 연무',kind:'training',level:1,requires:0,art:6,lines:['교관: 처음부터 실전에 익숙한 병사는 없다.','사마의: 이동과 협공을 반복하며 부대의 호흡을 맞추겠습니다.','교관: 오늘의 성장을 다음 전장으로 가져가거라. 다시 연습해도 좋다.']},
 {id:'T02',name:'산길 토벌',kind:'training',level:4,requires:2,art:11,lines:['조진: 산길의 잔당이 보급을 괴롭히고 있다.','사마의: 매번 달라지는 적의 배치를 살피며 부대를 단련합시다.','조진: 보급로가 열렸다. 다음 순찰에도 함께하자.']},
 {id:'T03',name:'군사 대련',kind:'training',level:8,requires:5,art:17,lines:['교관: 정예 부대와 실전처럼 겨뤄 보아라.','사마의: 책략과 지원을 함께 써야 오래 버틸 수 있습니다.','교관: 패배를 두려워하지 않는 반복이 장수를 만든다.']},
 {id:'T07',name:'장강 수군 조련',kind:'training',level:11,requires:6,art:3,lines:['조진: 오의 수군이 강을 오르내리며 보급선을 끊고 있다.','사마의: 배 위에서는 기병도 창병도 같은 물결 위에 섭니다. 수군으로 물길을 막고 육군은 부교로 건너겠습니다.','조진: 북방 병사도 물 위에서 싸울 수 있다는 것을 보였구나.']},
 {id:'T04',name:'교량 확보 연습',kind:'training',level:14,requires:6,art:3,lines:['교관: 강을 건너는 동안 후열이 무너지면 전군이 위험하다.','사마의: 선봉과 회복대를 나누어 교두보를 만들겠습니다.','교관: 좁은 지형에서도 서로를 지키는 법을 배웠구나.']},
 {id:'T05',name:'정예 진형 돌파',kind:'training',level:20,requires:8,art:11,lines:['조진: 정예병이 산길에 방진을 세웠다.','사마의: 광역 책략과 지원을 조합해 틈을 만들겠습니다.','조진: 정예를 상대할 실력이 쌓이고 있다.']},
 {id:'T06',name:'군략의 완성',kind:'training',level:27,requires:8,art:17,lines:['교관: 이제 부대 전체의 움직임으로 답해 보아라.','사마의: 천뢰와 공성계에 이르는 길도 오늘의 연습에서 시작합니다.','교관: 대가에게도 배움은 끝나지 않는다. 다시 겨뤄 보자.']},
 ...tales.map(([name,requires,level,art,...lines],i)=>({id:'Q'+String(i+1).padStart(2,'0'),name,requires,level,art,lines,kind:'quest' as const})),
];
export const storyWins=(c:Campaign)=>new Set(c.rewards.filter(x=>x.endsWith(':normal')).map(x=>x.split(':')[0])).size;
export function canExpedition(c:Campaign,id:string){const m=expeditions.find(x=>x.id===id);return !!m&&storyWins(c)>=m.requires;}
export function trainingXp(c:Campaign,m:Expedition){
 const excess=Math.max(0,levelInfo(c.xp.sima_yi??0).level-m.level-3);
 return Math.max(20,Math.round((40+m.level*12)*Math.max(.3,1-excess*.12)));
}
export function growthAdvice(c:Campaign,targetLevel:number){
 const current=levelInfo(c.xp.sima_yi??0).level;
 if(current>=targetLevel)return '권장 레벨 충족 · 지형과 병종 조합을 확인하세요.';
 const practice=expeditions.filter(m=>m.kind==='training'&&canExpedition(c,m.id)&&m.level<=current+1).at(-1)!;
 const projected=structuredClone(c);let wins=0;
 while(levelInfo(projected.xp.sima_yi??0).level<targetLevel&&wins<999){projected.xp.sima_yi=(projected.xp.sima_yi??0)+trainingXp(projected,practice);wins++;}
 return '권장 레벨까지 '+(targetLevel-current)+'레벨 · '+practice.name+' 약 '+wins+'승 (현재 수련만 반복 시, 본편·보물 보상 제외)';
}
export function expeditionReward(c:Campaign,id:string,runId:string,victory:boolean){
 const m=expeditions.find(x=>x.id===id);if(!m||!victory||!runId||!canExpedition(c,id)||(c.completedRuns??[]).includes(runId))return {xp:0,items:[] as string[]};
 (c.completedRuns??=[]).push(runId);
 if(m.kind==='quest'&&(c.quests??[]).includes(id))return {xp:0,items:[] as string[]};
 const xp=m.kind==='quest'?100+m.level*12:trainingXp(c,m);
 for(const who of OFFICERS)c.xp[who]=(c.xp[who]??0)+xp;
 if(m.kind==='training')c.trainingWins=(c.trainingWins??0)+1;else(c.quests??=[]).push(id);
 const items=treasures.filter(t=>t.quest===id&&!c.treasures.includes(t.id)).map(t=>t.id);c.treasures.push(...items);return {xp,items};
}
export function expeditionBattle(id:string,seed:number,version=1,supportClasses?:UnitClass[]){
 const m=expeditions.find(x=>x.id===id);if(!m)throw new Error('알 수 없는 외전');
 let map:MapFile={id:'expedition-field',name:m.name,legend:{'.':'plain',',':'road',f:'forest',h:'hill'},rows:['............','..ff....ff..','..ff....ff..','............',',,,,,,,,,,,,',',,,,,,,,,,,,','............','...hh..ff...','...hh..ff...','............'],regions:{player_start:[{x:1,y:4},{x:1,y:5},{x:2,y:3},{x:2,y:6},{x:1,y:6},{x:1,y:3}],ally_start:[{x:2,y:3},{x:2,y:6},{x:1,y:6},{x:1,y:3}],camp:[{x:10,y:5}]}};
 if(version>=2)map=trialMap(id,m.name);
 const stage=structuredClone(base) as StageDef;stage.id=m.id;stage.subtitle=m.name;stage.title=m.kind==='training'?'반복 수련':'보물 인연';stage.mapId=map.id;stage.dialogues=[];stage.gimmicks=[];
 stage.deployment={forced:['sima_yi','cao_zhen'],slots:2,grantedUnits:[{type:supportClasses?.[0]??'infantry',count:1,level:m.level,countsTowardAllyLoss:true},{type:supportClasses?.[1]??'fengshui',count:1,level:m.level,countsTowardAllyLoss:true}]};
 const naval=version>=2&&expeditionLandscape(id)==='naval';
 // Naval trials always add two boats; they are placed on the water cells after the land slots.
 if(naval)stage.deployment.grantedUnits!.push({type:'navy',count:2,level:m.level,countsTowardAllyLoss:true});
 stage.difficulty={normal:{recommendedLevel:m.level,minEnemyLevel:m.level},extreme:{recommendedLevel:m.level,minEnemyLevel:m.level}};
 stage.events=[{id:m.id+'/start',trigger:{type:'battle_start'},actions:[{type:'spawn_units',side:'enemy',units:([['infantry',8,4],['spearman',9,6],['archer',10,3],['cavalry',10,5]] as const).slice(0,m.kind==='training'&&m.level===1?3:4).map(([template,x,y],i)=>({id:'trial_enemy_'+i,name:['대련 보병','대련 창병','대련 궁병','대련 기병'][i]!,template,at:{x:version>=2?map.rows[0]!.length-12+x:x,y:y+(Math.abs(seed)%2&&i===0?1:0)},level:m.level,behavior:'hold' as const}))},{type:'set_phase',phase:m.kind==='training'?'부대 연계 수련':'보물 인연의 시련'}]}];
 if(naval)stage.events[0]!.actions[0]!.units=navalEnemies.map((e,i)=>({id:'trial_enemy_'+i,name:e.name,template:e.template,at:{x:e.at.x,y:e.at.y+(Math.abs(seed)%2&&i===0?1:0)},level:m.level,behavior:'hold' as const}));
 if(version>=3)configureTrialGoal(stage,map,m.level);
 return {stage,map};
}
