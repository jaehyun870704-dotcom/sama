import {OFFICERS,deployment,levelInfo,type Campaign} from './progression.ts';
import {allStrategies,talentTree} from './officers.ts';

/** Compare campaign state before and after a reward, so reloads never announce it twice. */
export function growthMilestones(before:Campaign,after:Campaign){
 const old=deployment(before,true),next=deployment(after,true);
 return OFFICERS.map(id=>{
  const from=levelInfo(before.xp[id]??0).level,to=levelInfo(after.xp[id]??0).level;
  const previous=talentTree(id,from,old.growth!);
  return {id,from,to,talents:talentTree(id,to,next.growth!).filter(t=>t.ready&&!previous.some(p=>p.trait===t.trait&&p.ready)).map(t=>t.name),strategies:id==='sima_yi'?allStrategies.filter(s=>s.level>from&&s.level<=to).map(s=>s.name):[]};
 }).filter(x=>x.to>x.from||x.talents.length||x.strategies.length);
}
