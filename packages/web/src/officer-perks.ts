/**
 * 장수 효과 — 장수마다 다른 특성 다섯 가지(+ 연의 고유능력).
 *
 * 어떤 효과를 갖는지는 그 장수의 다섯 능력(무력·지력·통솔·정치·매력), 병종 계열, 성격이 정한다.
 * 무력이 높은 장수는 무위·회심, 지력이 높은 장수는 책략 위력·간파, 기병은 돌격 숙련, 무모한 장수는 배수의 진…
 * 효과마다 필요 레벨(그 장수가 어느 회차에서든 닿은 레벨)과 천명 비용이 있다. 배운 효과 가운데
 * 장착 칸 수(기본 2, 연구로 늘어난다)만큼 골라 끼우면, 그 장수가 출진할 때 적용된다.
 */
import type {UnitClass} from '../../core/src/index.ts';
import {familyOf,profileOf,tierOf,evolvedClass} from '../../core/src/index.ts';
import {romanceByName,temperOf} from './romance.ts';
import {customList} from './custom.ts';
import {OFFICER_RECRUITS} from './roguelike.ts';
import type {MetaState} from './meta.ts';
import {perkSlots,researchGrants} from './research.ts';
import {heirGrants} from './chuhan.ts';
import {perkText,type PerkGrant,type PerkGrants} from './perks.ts';

export interface OfficerPerk {
  /** 장수 안에서의 효과 id(= 특성 id) */
  id:string;name:string;trait:string;param:number;
  /** 필요 레벨 · 천명 비용 */
  level:number;cost:number;
  /** 무엇에서 왔나(능력·병종·성격) */
  source:string;
}
const LEVELS=[5,10,15,20,28],COSTS=[3,4,6,8,12],SCALE=[1,1.15,1.3,1.5,1.75];

/** 장수가 주로 쓰는 병종(신장수·영입 명단·이야기 동료, 없으면 능력으로 어림). */
const COMPANION_CLASS:Record<string,UnitClass>={조진:'cavalry',장합:'spearman',곽회:'archer',사마랑:'physician',사마의:'strategist',사마부:'fengshui',사마방:'spearman'};
export function officerClass(name:string):UnitClass{
  const c=customList().find(o=>o.name===name);if(c)return c.unitClass;
  const r=OFFICER_RECRUITS.find(o=>o.name===name);if(r)return r.unitClass;
  if(COMPANION_CLASS[name])return COMPANION_CLASS[name]!;
  const s=romanceByName(name);if(!s)return 'infantry';
  if(s.int>=s.war+15)return s.pol>=s.int?'fengshui':'strategist';
  if(s.war>=88)return s.lead>=85?'heavyCav':'cavalry';
  return s.lead>=s.war?'spearman':'infantry';
}
type Cand={trait:string;base:number;name:string;source:string;score:number};
/** 장수의 효과 목록(고유능력 제외, 필요 레벨 순). 같은 장수는 언제나 같은 목록. */
export function perksFor(name:string,unitClass?:UnitClass):OfficerPerk[]{
  const s=romanceByName(name),cls=unitClass??officerClass(name),fam=familyOf(cls),temper=temperOf(name);
  const st=s??{war:50,int:50,lead:50,pol:50,cha:50};
  const cand:Cand[]=[
    {trait:'physicalPower',base:8,name:'무위 강화',source:'무력',score:st.war},
    {trait:'critical',base:8,name:'회심 일격',source:'무력',score:st.war-4},
    {trait:'penetrate',base:12,name:'파갑',source:'무력',score:(st.war+st.lead)/2-6},
    {trait:'strategyPower',base:8,name:'책략 강화',source:'지력',score:st.int},
    {trait:'strategyEvasion',base:10,name:'간파',source:'지력',score:st.int-5},
    {trait:'manaRegen',base:2,name:'정심',source:'지력',score:(st.int+st.pol)/2-8},
    {trait:'physicalDamageReduction',base:8,name:'철벽 통솔',source:'통솔',score:st.lead},
    {trait:'counterBoost',base:15,name:'반격 강화',source:'통솔',score:st.lead-6},
    {trait:'regen',base:3,name:'재정비',source:'통솔',score:(st.lead+st.cha)/2-8},
    {trait:'strategyDamageReduction',base:10,name:'명경지수',source:'정치',score:st.pol},
    {trait:'accuracyBoost',base:8,name:'인망',source:'매력',score:st.cha-2},
    {trait:'evasionBoost',base:6,name:'민첩',source:'매력',score:st.cha-10},
  ];
  // 병종 계열이 주는 효과(점수를 크게 줘 거의 늘 들어간다)
  const role:Partial<Record<string,[string,number,string]>>={cavalry:['chargePower',10,'돌격 숙련'],heavyCav:['chargePower',8,'돌진 숙련'],horseArcher:['rangedPower',8,'기사 숙련'],
    archer:['rangedPower',10,'궁술 숙련'],crossbow:['rangedPower',10,'노술 숙련'],infantry:['meleePower',8,'백병 숙련'],spearman:['counterBoost',18,'창진'],bandit:['meleePower',10,'매복 숙련'],
    strategist:['strategyPower',8,'군략'],taoist:['strategyPower',8,'도술'],shaman:['strategyPower',8,'요술'],fengshui:['healPower',20,'의술'],physician:['healPower',25,'의술'],maiden:['healPower',20,'기도'],monk:['regen',4,'수행']};
  const rr=role[fam];if(rr)cand.push({trait:rr[0],base:rr[1],name:rr[2],source:'병종',score:200});
  // 성격이 주는 효과
  const tp:Partial<Record<string,[string,number,string]>>={reckless:['lastStand',20,'배수의 진'],brave:['turnaround',15,'전화위복'],proud:['critical',10,'오만한 일격'],calm:['veteran',15,'침착'],cautious:['defenseBoost',6,'신중'],wise:['strategyEvasion',12,'혜안'],timid:['evasionBoost',10,'몸 사리기']};
  const tt=temper?tp[temper]:undefined;if(tt)cand.push({trait:tt[0],base:tt[1],name:tt[2],source:'성격',score:150});
  // 책략을 못 쓰는 병종에 책략 효과는 의미가 적다 — 점수를 낮춘다
  const caster=profileOf(cls).canUseStrategy;
  for(const x of cand)if(!caster&&['strategyPower','manaRegen'].includes(x.trait))x.score-=40;
  // 같은 특성은 한 번만, 점수 높은 다섯
  const picked:Cand[]=[];for(const x of [...cand].sort((a,b)=>b.score-a.score||a.trait.localeCompare(b.trait)))if(!picked.some(p=>p.trait===x.trait)&&picked.length<5)picked.push(x);
  // 낮은 단계는 약한 효과부터: 점수가 낮은 것을 앞에 둔다(가장 잘 맞는 효과가 가장 깊은 곳에)
  picked.sort((a,b)=>a.score-b.score||a.trait.localeCompare(b.trait));
  return picked.map((x,i)=>({id:x.trait,name:x.name,trait:x.trait,param:Math.round(x.base*SCALE[i]!),level:LEVELS[i]!,cost:COSTS[i]!,source:x.source}));
}
export const perkLine=(p:OfficerPerk)=>perkText(p.trait,p.param);

export function perkState(m:MetaState,name:string){return m.officerPerks?.[name]??{learned:[],equipped:[]};}
export const bestLevel=(m:MetaState,name:string)=>m.officerBest?.[name]??0;
/** 배운다: 필요 레벨에 닿았고 천명이 있으면. 칸이 비어 있으면 바로 장착한다. */
export function learnPerk(m:MetaState,name:string,id:string){
  const p=perksFor(name).find(x=>x.id===id),st=perkState(m,name);
  if(!p||st.learned.includes(id)||bestLevel(m,name)<p.level||m.mandate<p.cost)return false;
  m.mandate-=p.cost;const next={learned:[...st.learned,id],equipped:[...st.equipped]};
  if(next.equipped.length<perkSlots(m))next.equipped.push(id);
  (m.officerPerks??={})[name]=next;return true;
}
/** 장착·해제(배운 효과만, 칸 수 안에서). 교체는 무료. */
export function togglePerk(m:MetaState,name:string,id:string){
  const st=perkState(m,name);if(!st.learned.includes(id))return false;
  const on=st.equipped.includes(id);if(!on&&st.equipped.length>=perkSlots(m))return false;
  (m.officerPerks??={})[name]={learned:[...st.learned],equipped:on?st.equipped.filter(x=>x!==id):[...st.equipped,id]};return true;
}
// ─────────────────────────────────────────────── 진화: 장수 효과는 병종이 진화할수록 강해진다

/** 진화 단계(병종 단계 1·2·3)마다 효과 수치 배율과 이름 꼬리. */
export const PERK_TIERS=[{mul:1,suffix:'',mark:'Ⅰ'},{mul:1.5,suffix:'·정예',mark:'Ⅱ'},{mul:2,suffix:'·극의',mark:'Ⅲ'}] as const;
/** 단계에 맞춘 효과(이름·수치). */
export function perkAt(p:OfficerPerk,tier:number){const t=PERK_TIERS[Math.max(1,Math.min(3,tier))-1]!;return {name:p.name+t.suffix,param:Math.round(p.param*t.mul),mark:t.mark};}
/** 장수가 지금 닿아 있는 진화 단계: 출진 병종이 있으면 그 단계, 없으면 기록된 최고 레벨로 진화했을 병종의 단계. */
export function officerTier(m:MetaState,name:string,unitClass?:UnitClass){
  return unitClass?tierOf(unitClass):tierOf(evolvedClass(officerClass(name),Math.max(1,bestLevel(m,name))));
}
type Sortie=string|{name:string;unitClass?:UnitClass};
/** 출진하는 장수들의 장착 효과(이름 → 특성). 칸 수를 넘는 장착은 앞에서부터만. 수치는 그 장수의 진화 단계를 따른다. */
export function officerGrants(m:MetaState,party:readonly Sortie[]):Record<string,PerkGrant[]>{
  const out:Record<string,PerkGrant[]>={};
  for(const u of party){const n=typeof u==='string'?u:u.name,cls=typeof u==='string'?undefined:u.unitClass;const st=perkState(m,n);if(!st.equipped.length)continue;const list=perksFor(n),tier=officerTier(m,n,cls);
    const g=st.equipped.slice(0,perkSlots(m)).map(id=>list.find(p=>p.id===id)).filter((p):p is OfficerPerk=>!!p).map(p=>[p.trait,perkAt(p,tier).param] as PerkGrant);
    if(g.length)out[n]=g;}
  return out;
}
/** 출진할 때 배치에 적어 둘 보정: 연구(전원·사마의) + 계승 + 출진 장수들의 장착 효과(진화 단계 반영). */
export function deploymentPerks(m:MetaState,party:readonly Sortie[]):PerkGrants|undefined{
  const r=researchGrants(m),byName:Record<string,PerkGrant[]>={...r.byName};r.all=[...r.all,...heirGrants(m)];
  for(const [n,g] of Object.entries(officerGrants(m,party)))byName[n]=[...(byName[n]??[]),...g];
  const fam=r.byFamily&&Object.keys(r.byFamily).length?{byFamily:r.byFamily}:{};
  return r.all.length||Object.keys(byName).length||fam.byFamily?{all:r.all,byName,...fam}:undefined;
}
