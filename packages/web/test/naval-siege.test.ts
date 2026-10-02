import {describe,it,expect} from 'vitest';
import {Session} from '../src/session.ts';
import {freshCampaign,deployment} from '../src/progression.ts';
import {navalCrewRow,oarAngle,navalCrews} from '../src/naval-art.ts';
import {trialMap} from '../src/expedition-scenes.ts';
import {CONTROLLABLE,decide,key,manhattan} from '../../core/src/index.ts';
import {structureKind} from '../src/campaign-rules.ts';
import {placeFor,classFamily,degree,placeThemes,familyMotifs} from '../src/music.ts';
import {supportOptions} from '../src/troops.ts';
import type {Coord} from '../../core/src/index.ts';
function fort(){const d=deployment(freshCampaign(),true);for(const who of Object.keys(d.levels))d.levels[who]=Math.max(d.levels[who]!,3);d.mission={id:'Q02',runId:'siege',version:3,balance:1,supportClasses:['engineer','catapult']};return new Session(7,'normal',215,'survival',4,d);}
function allyPhase(s:Session){for(let i=0;i<40&&s.state.currentSide!=='ally';i++){const u=s.state.living(s.state.currentSide).find(x=>!x.hasActed);if(CONTROLLABLE.has(s.state.currentSide)&&u)s.act({kind:'wait',unit:u.id});else s.tick();}expect(s.state.currentSide).toBe('ally');}
function freeNeighbour(s:Session,at:Coord){return [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].map(d=>({x:at.x+d.x,y:at.y+d.y})).find(p=>s.state.map.inBounds(p)&&!s.state.unitAt(p)&&['plain','road'].includes(s.state.map.tileAt(p).terrain));}
function naval(seed=215){const d=deployment(freshCampaign(),true);for(const who of Object.keys(d.levels))d.levels[who]=Math.max(d.levels[who]!,11);d.mission={id:'T07',runId:'naval-'+seed,version:3,balance:1,supportClasses:['crossbow','physician']};return new Session(7,'normal',seed,'survival',4,d);}
function play(s:Session){for(let i=0;i<1200&&s.state.outcome==='ongoing';i++){const st=s.state;if(!CONTROLLABLE.has(st.currentSide)){s.tick();continue;}const u=st.living(st.currentSide).find(x=>!x.hasActed);if(!u){s.tick();continue;}for(const cmd of decide(st,u)){if(cmd.kind==='move'&&key(cmd.to)===key(u.pos))continue;s.act(cmd);if(st.outcome!=='ongoing')break;}if(!u.hasActed&&st.outcome==='ongoing')s.act({kind:'wait',unit:u.id});}}
describe('naval battles',()=>{
 it('launches two allied boats on the water against an enemy river fleet',()=>{
  const s=naval(),st=s.state,boats=st.living().filter(u=>u.unitClass==='navy');
  expect(boats.filter(u=>u.side==='ally')).toHaveLength(2);expect(boats.filter(u=>u.side==='enemy')).toHaveLength(3);
  for(const u of boats)expect(['water','rapids']).toContain(st.map.tileAt(u.pos).terrain);
  for(const u of st.living())expect(st.map.moveCost(u.unitClass,u.pos)).toBeLessThan(Infinity);
  expect(trialMap('T07','장강 수군 조련').rows.some(r=>r.includes('b'))).toBe(true);
 });
 it('can be won with boats fighting on the river',()=>{for(const seed of [215,216]){const s=naval(seed);play(s);expect(s.state.outcome).toBe('victory');expect(s.state.log.some(e=>e.t==='attack'&&s.state.find(e.attacker)?.unitClass==='navy'&&s.state.find(e.attacker)?.side!=='enemy')).toBe(true);}});
 it('keeps a stable crew per boat and sweeps oars between poses',()=>{
  expect(navalCrewRow('granted_navy_0')).toBe(navalCrewRow('granted_navy_0'));expect(navalCrewRow('x','강안 궁병')).toBe(2);expect(navalCrewRow('x','지휘선')).toBe(3);
  expect(navalCrews.map(c=>c.sourceRow)).toEqual([0,1,2,4]);expect(new Set([0,1,2,3].map(oarAngle)).size).toBe(4);
 });
});
describe('siege works',()=>{
 it('lets engineers repair the siege ram and raise a limited number of barricades',()=>{
  const s=fort();allyPhase(s);const st=s.state,engineer=st.living('ally').find(u=>u.unitClass==='engineer')!,ram=st.get('siege_crew');
  expect(supportOptions).toContain('engineer');
  const spot=freeNeighbour(s,ram.pos)!;engineer.pos=spot;ram.hp=20;
  expect(s.act({kind:'item',unit:engineer.id,item:'repair',target:ram.id}).ok).toBe(true);expect(ram.hp).toBeGreaterThan(20);
  const enemy=st.living('enemy').find(u=>!structureKind(u.id))!;expect(s.act({kind:'item',unit:st.living('ally').find(u=>u.unitClass==='catapult')!.id,item:'repair',target:ram.id}).ok).toBe(false);
  expect(enemy).toBeDefined();
  const fresh=fort();allyPhase(fresh);const eng=fresh.state.living('ally').find(u=>u.unitClass==='engineer')!,cell=freeNeighbour(fresh,eng.pos)!;
  expect(fresh.act({kind:'item',unit:eng.id,item:'fortify',target:'99,99'}).ok).toBe(false);
  expect(fresh.act({kind:'item',unit:eng.id,item:'fortify',target:cell.x+','+cell.y}).ok).toBe(true);
  const work=fresh.state.unitAt(cell)!;expect(structureKind(work.id)).toBe('barricade');expect(work.side).toBe('allyAi');expect(work.stats.attack).toBe(0);expect(fresh.barricadesLeft(eng.id)).toBe(1);
  expect(Session.load(fresh.save()).state.snapshot()).toEqual(fresh.state.snapshot());
 });
 it('rallies the assault when the gate falls',()=>{
  const s=fort();allyPhase(s);const st=s.state,ram=st.get('siege_crew'),gate=st.living('enemy').find(u=>structureKind(u.id)==='gate')!;
  const spot=freeNeighbour(s,gate.pos)!;ram.pos=spot;gate.hp=1;
  expect(s.act({kind:'attack',unit:ram.id,target:gate.id}).ok).toBe(true);expect(gate.alive).toBe(false);
  expect(ram.statuses.some(x=>x.kind==='rally')).toBe(true);
  for(const u of st.living().filter(u=>u.side!=='enemy'&&manhattan(u.pos,gate.pos)>2))expect(u.statuses.some(x=>x.kind==='rally')).toBe(false);
 });
});
describe('procedural score',()=>{
 it('picks a place theme for every story stage, expedition landscape and raw map',()=>{
  expect(placeFor('S1-05')).toBe('river');expect(placeFor('S1-06')).toBe('fortress');expect(placeFor('S1-04')).toBe('court');
  expect(placeFor('T07')).toBe('naval');expect(placeFor('Q02')).toBe('fortress');expect(placeFor('T02')).toBe('forest');
  expect(placeFor('X',Array(10).fill('water'))).toBe('naval');expect(placeFor('X',['plain','gate','wall'])).toBe('fortress');expect(placeFor('X',['plain'])).toBe('field');
  for(const theme of Object.values(placeThemes)){expect(theme.mode).toHaveLength(5);expect(theme.phrase).toHaveLength(16);expect(degree(theme,5)).toBe(theme.root+12);expect(degree(theme,-1)).toBeLessThan(theme.root);}
 });
 it('gives each troop family its own motif',()=>{
  expect(classFamily('cavalry')).toBe('horse');expect(classFamily('horseArcher')).toBe('horse');expect(classFamily('crossbow')).toBe('bow');expect(classFamily('physician')).toBe('sage');
  expect(classFamily('ram')).toBe('siege');expect(classFamily('navy')).toBe('boat');expect(classFamily('monk')).toBe('foot');expect(classFamily(undefined)).toBeUndefined();
  expect(new Set(Object.values(familyMotifs).map(m=>m.name)).size).toBe(7);
 });
});
