import {playbackEvents} from './battle-playback.ts';
import {troopFacing,troopWalkPose,troopReaction,troopReactionPose,retreatMotion} from './troop-motion.ts';
import {troopRoles,visualClass,troopArt,troopSheets,basicReactionArt,artClass} from './troops.ts';
import {spriteAtlas,outlinedCanvas} from './sprite-atlas.ts';
import {cryFor,reactions,isCrisis,type Emote} from './emotes.ts';
import type {SoundEvent} from './sound-events.ts';
import {navalAtlas,navalCrewRow,NAVAL_WATERLINE} from './naval-art.ts';
import {structureKind,structureFrame} from './campaign-rules.ts';
import { Application, CanvasSource, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import {terrainLayer} from './terrain.ts';
import {stageRules} from './stage-rules.ts';
import {factionOf} from './officer-art.ts';
import {crispZoom,groundScaleMode,unitTint} from './pixel-look.ts';
import type {LogEntry} from '../../core/src/index.ts';
import { key, manhattan, ignoresRough, tierOf, familyOf } from '../../core/src/index.ts';
import type { BattleState, Coord, Unit, TerrainKind } from '../../core/src/index.ts';

const W=48,H=48;
async function imageCanvas(url:string){const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d')!.drawImage(img,0,0);return c;}
const colors:Record<TerrainKind,number>={plain:0x6b7560,road:0xada084,forest:0x435f50,mountain:0x69736d,hill:0x83846a,water:0x3d6770,rapids:0x3d6770,bridge:0x98846a,fort:0xab9e7b,gate:0x8b8a77,wall:0x777f74,cliff:0x5b554b,marsh:0x6f8a5c,plank:0x8a6a45,ford:0x6f9ea3};
const sides={player:0x68c9bf,ally:0x86b7d9,allyAi:0xd3b06b,enemy:0xe78b79};
export const terrainNames:Record<TerrainKind,string>={plain:'평지',road:'길',forest:'숲',mountain:'산지',hill:'구릉',water:'수상',rapids:'완류',bridge:'다리',fort:'성채',gate:'성문',wall:'성벽',cliff:'절벽(통행 불가)',marsh:'갈대늪',plank:'잔도',ford:'여울'};
export {classNames} from './troops.ts';
import {classNames} from './troops.ts';
export function unitName(u:Unit){return classNames[u.name]??u.name;}
function iso(c:Coord){return {x:c.x*W+W/2,y:c.y*H+H/2};}
/** A named officer on the field: a victory/defeat target or someone with a known allegiance. */
function isCommander(state:BattleState,u:Unit){return [...state.victory,...state.defeat].some(c=>c.type==='retreat'&&c.unit===u.id)||factionOf(u.name)!==undefined;}
function diamond(g:Graphics,x:number,y:number,color:number,alpha=1){return g.rect(x-W/2,y-H/2,W,H).fill({color,alpha});}
function clear(c:Container){for(const child of c.removeChildren())child.destroy({children:true});}

export class Battlefield {
  app=new Application();
  world=new Container();
  ground=new Container();
  ranges=new Graphics();
  pieces=new Container();
  cursor=new Graphics();
  effects=new Container();
  rubble=new Container();
  /** M-18 warnings: red cells with the turns left until the blow lands. */
  warnings=new Container();
  private state:BattleState|undefined;
  private selected='';
  private mode='move';
  private previousPositions=new Map<string,Coord>();
  private textures=new Map<string,Texture>();
  private atlas:Texture|undefined;
  private extra:Texture|undefined;
  private facing=new Map<string,number>();
  private troopTextures=new Map<string,Texture>();
  private ram:Texture|undefined;
  private naval:Texture|undefined;
  private convoys:Texture|undefined;
  private scenery:Texture|undefined;
  private terrainTextures:Texture[]=[];
  private actors=new Map<string,{piece:Container,sprite:Sprite,unit:Unit}>();
  private minimap:HTMLCanvasElement|undefined;
  private animationEpoch=0;
  private statusSeen=new Map<string,Set<string>>();
  busy=false;
  playbackRate=1;
  onSound:(e:SoundEvent)=>void=()=>{};
  /** Stereo position of a tile on screen, −0.85 (left) … 0.85 (right). */
  private panOf(at:Coord){const p=this.world.toGlobal({x:(at.x+.5)*W,y:0});return Math.max(-.85,Math.min(.85,p.x/Math.max(1,this.app.screen.width)*2-1));}
  onAnimationEnd:()=>void=()=>{};
  private observer:ResizeObserver|undefined;
  private zoom=1;
  private overview=false;
  private pan={x:0,y:0};
  private drag:{x:number;y:number;px:number;py:number}|undefined;
  private dragged=false;
  private hover:Coord|undefined;
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  onCell:(c:Coord)=>void=()=>{};
  onHover:(c:Coord|undefined)=>void=()=>{};
  async init(privateHost:HTMLElement){
    await this.app.init({resizeTo:privateHost,backgroundAlpha:0,antialias:false,resolution:Math.min(devicePixelRatio,3),autoDensity:true,preference:'webgl'});
    // Painted art is far larger than its cell on screen: mipmapped smooth reduction keeps
    // every stroke instead of dropping random pixels, and the dark rim keeps the dot look.
    const smooth=(canvas:HTMLCanvasElement,rim=true)=>new Texture({source:new CanvasSource({resource:rim?outlinedCanvas(canvas):canvas,autoGenerateMipmaps:true,scaleMode:'linear'})});
    // Every sheet is requested at once so the worker pool cuts them in parallel.
    const [troops,ram,naval,convoys,extra,atlas,scenery]=await Promise.all([Promise.all(troopSheets.map(sheet=>spriteAtlas(sheet.url,sheet.rows))),spriteAtlas('/ram-v1.png',2,2),navalAtlas(),imageCanvas('/convoys-v1.png'),spriteAtlas('/units-extra-v1.png',4),spriteAtlas('/units-v3.png',6),imageCanvas('/scenery-v3.png')]);
    troopSheets.forEach((sheet,i)=>this.troopTextures.set(sheet.id,smooth(troops[i]!)));
    this.ram=smooth(ram);this.naval=smooth(naval);this.convoys=smooth(convoys);this.extra=smooth(extra);this.atlas=smooth(atlas);this.scenery=smooth(scenery,false);
    privateHost.appendChild(this.app.canvas);
    this.minimap=document.createElement('canvas');this.minimap.className='tactical-minimap';this.minimap.width=192;this.minimap.height=144;this.minimap.setAttribute('aria-label','전체 전황 지도. 클릭하면 해당 위치로 이동합니다.');privateHost.appendChild(this.minimap);
    this.minimap.addEventListener('pointerdown',e=>{e.stopPropagation();if(!this.state)return;const r=this.minimap!.getBoundingClientRect();this.focus({x:(e.clientX-r.left)/r.width*this.state.map.width,y:(e.clientY-r.top)/r.height*this.state.map.height});});
    this.app.canvas.setAttribute('aria-label','정방 격자 전술 지도. 방향키로 칸 이동, Enter로 선택. 마우스 휠로 확대, 드래그로 이동.');
    this.app.canvas.tabIndex=0;
    this.app.stage.addChild(this.world);this.world.addChild(this.ground,this.rubble,this.ranges,this.warnings,this.pieces,this.cursor,this.effects);
    const canvas=this.app.canvas;
    // Touch: one finger drags, two fingers pinch-zoom around their midpoint, and a
    // long press shows the tile under the finger the way hovering does with a mouse.
    const fingers=new Map<number,{x:number;y:number}>();let pinch:{dist:number;zoom:number}|undefined,hold:ReturnType<typeof setTimeout>|undefined,held=false;
    const local=(e:{clientX:number;clientY:number})=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
    const spread=()=>{const [a,b]=[...fingers.values()];return {dist:Math.hypot(a!.x-b!.x,a!.y-b!.y),mid:{x:(a!.x+b!.x)/2,y:(a!.y+b!.y)/2}};};
    canvas.addEventListener('pointerdown',e=>{
      fingers.set(e.pointerId,local(e));canvas.setPointerCapture(e.pointerId);clearTimeout(hold);held=false;
      if(fingers.size===2){pinch={dist:spread().dist,zoom:this.zoom};this.drag=undefined;this.dragged=true;return;}
      this.drag={x:e.clientX,y:e.clientY,px:this.pan.x,py:this.pan.y};this.dragged=false;
      if(e.pointerType==='touch'){const at=local(e);hold=setTimeout(()=>{if(!this.dragged&&fingers.size===1){held=true;this.setHover(this.fromPoint(at.x,at.y));}},450);}
    });
    canvas.addEventListener('pointermove',e=>{
      if(fingers.has(e.pointerId))fingers.set(e.pointerId,local(e));
      if(pinch&&fingers.size===2){const {dist,mid}=spread();if(pinch.dist>0)this.zoomAt(pinch.zoom*dist/pinch.dist,mid,false);return;}
      if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>5){this.dragged=true;clearTimeout(hold);}if(this.dragged){this.pan={x:this.drag.px+dx,y:this.drag.py+dy};this.fit();return;}}
      if(e.pointerType!=='touch'){const at=local(e);this.setHover(this.fromPoint(at.x,at.y));}
    });
    const release=(e:PointerEvent,cancel:boolean)=>{
      const was=fingers.size;fingers.delete(e.pointerId);clearTimeout(hold);
      if(pinch){if(fingers.size<2){const s=spread0();this.zoomAt(this.zoom,s,true);pinch=undefined;}this.drag=undefined;return;}
      if(!cancel&&was===1&&!this.dragged&&!held){const at=local(e),c=this.fromPoint(at.x,at.y);if(c)this.onCell(c);}
      this.drag=undefined;
    };
    // After a pinch the zoom settles on the nearest crisp step around the screen centre.
    const spread0=()=>({x:this.app.screen.width/2,y:this.app.screen.height/2});
    canvas.addEventListener('pointerup',e=>release(e,false));
    canvas.addEventListener('pointercancel',e=>release(e,true));
    canvas.addEventListener('pointerleave',e=>{if(!this.drag&&e.pointerType!=='touch')this.setHover(undefined);});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.setZoom(this.zoom*(e.deltaY>0?.9:1.1));},{passive:false});
    canvas.addEventListener('keydown',e=>{
      const moves:Record<string,Coord>={ArrowRight:{x:1,y:0},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowUp:{x:0,y:-1}};
      if(moves[e.key]){e.preventDefault();const d=moves[e.key]!,c=this.hover??this.state?.find(this.selected)?.pos??{x:0,y:0};const next={x:c.x+d.x,y:c.y+d.y};if(this.state?.map.inBounds(next))this.setHover(next);}
      if(e.key==='Enter'&&this.hover){e.preventDefault();this.onCell(this.hover);}
    });
    this.observer=new ResizeObserver(()=>requestAnimationFrame(()=>{
      this.app.resize();
      if(this.overview)this.reset();else this.fit();
    }));this.observer.observe(privateHost);
    this.app.ticker.maxFPS=60;
    // Boats ride the swell while idle; tweens own the sprite during playback.
    this.app.ticker.add(()=>{if(this.busy||this.reduced)return;const t=performance.now()/1000;for(const [id,a] of this.actors)if(a.unit.unitClass==='navy'){const phase=id.length*.7;a.sprite.y=8+Math.sin(t*1.6+phase)*1.8;a.sprite.rotation=Math.sin(t*1.1+phase)*.035;}});
  }
  private fromPoint(x:number,y:number):Coord|undefined{
    const p=this.world.toLocal({x,y});const c={x:Math.floor(p.x/W),y:Math.floor(p.y/H)};
    return this.state?.map.inBounds(c)?c:undefined;
  }
  private setHover(c:Coord|undefined){
    this.hover=c;this.cursor.clear();if(c){
      const u=this.state?.find(this.selected),def=this.state?.strategies.get(this.mode);
      if(u&&def&&manhattan(u.pos,c)<=def.range)for(let dy=-def.radius;dy<=def.radius;dy++)for(let dx=-def.radius;dx<=def.radius;dx++){
        const at={x:c.x+dx,y:c.y+dy};if(Math.abs(dx)+Math.abs(dy)>def.radius||!this.state!.map.inBounds(at))continue;
        const p=iso(at);diamond(this.cursor,p.x,p.y,0xf5d395,.34).stroke({color:0xffe1a8,width:1.4});
      }
      const p=iso(c);diamond(this.cursor,p.x,p.y,0xffffff,.12).stroke({color:0xe9dcc0,width:1.6,alpha:.8});
    }
    this.onHover(c);
  }
  setZoom(z:number){
    if(!this.state)return;
    this.overview=false;
    const w=this.app.screen.width,h=this.app.screen.height;
    const center=this.world.toLocal({x:w/2,y:h/2});
    this.zoom=crispZoom(Math.max(.22,Math.min(1.8,z)),this.app.renderer.resolution,Math.sign(z-this.zoom));this.fit();this.focus({x:center.x/W-.5,y:center.y/H-.5});
  }
  zoomBy(d:number){this.setZoom(this.zoom+d);}
  /** Zoom keeping the world point under `at` (screen space) fixed; snap only when the gesture ends. */
  zoomAt(z:number,at:{x:number;y:number},snap:boolean){
    if(!this.state)return;this.overview=false;
    const before=this.world.toLocal(at),clamped=Math.max(.22,Math.min(1.8,z));
    this.zoom=snap?crispZoom(clamped,this.app.renderer.resolution):clamped;this.fit();
    const now=this.world.toGlobal(before);this.pan={x:this.pan.x+at.x-now.x,y:this.pan.y+at.y-now.y};this.fit();
  }
  reset(){if(!this.state)return;this.overview=true;this.zoom=crispZoom(Math.min((this.app.screen.width-40)/(this.state.map.width*W),(this.app.screen.height-70)/(this.state.map.height*H)),this.app.renderer.resolution,-1);this.pan={x:0,y:0};this.fit();}
  focusUnit(at:Coord){this.overview=false;this.zoom=Math.max(this.zoom,crispZoom(this.app.screen.width<500?.85:1,this.app.renderer.resolution));this.focus(at);}
  focus(at:Coord){
    if(!this.state)return;
    this.pan={x:(this.state.map.width*W/2-(at.x+.5)*W)*this.zoom,y:(this.state.map.height*H/2-(at.y+.5)*H)*this.zoom};this.fit();
  }
  private fit(){
    if(!this.state)return;
    const w=this.app.screen.width,h=this.app.screen.height,m=this.state.map,scale=this.zoom;
    this.world.scale.set(scale);
    const left=(w-m.width*W*scale)/2,top=(h-m.height*H*scale)/2;
    const x=m.width*W*scale>w?Math.max(w-m.width*W*scale-24,Math.min(24,left+this.pan.x)):left;
    const y=m.height*H*scale>h?Math.max(h-m.height*H*scale-24,Math.min(24,top+this.pan.y)):top;
    // Whole device pixels keep ground dots the same size across the screen.
    const r=this.app.renderer.resolution,px=Math.round(x*r)/r,py=Math.round(y*r)/r;
    this.world.position.set(px,py);this.pan={x:px-left,y:py-top};
    const ground=this.terrainTextures[0];if(ground)ground.source.scaleMode=groundScaleMode(scale,r);
    this.drawMinimap();
  }
  private drawMinimap(){
    if(!this.minimap||!this.state)return;const c=this.minimap,g=c.getContext('2d')!,m=this.state.map,sx=c.width/m.width,sy=c.height/m.height;
    g.clearRect(0,0,c.width,c.height);
    for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){g.fillStyle='#'+colors[m.tileAt({x,y}).terrain].toString(16).padStart(6,'0');g.fillRect(x*sx,y*sy,sx+1,sy+1);}
    for(const u of this.state.living()){g.fillStyle='#'+sides[u.side].toString(16);g.fillRect(u.pos.x*sx-1,u.pos.y*sy-1,4,4);}
    g.strokeStyle='#fff1c0';g.lineWidth=1.5;g.strokeRect(-this.world.x/this.zoom/W*sx,-this.world.y/this.zoom/H*sy,this.app.screen.width/this.zoom/W*sx,this.app.screen.height/this.zoom/H*sy);
  }
  load(state:BattleState){
    this.animationEpoch++;this.busy=false;this.overview=false;this.state=state;this.previousPositions.clear();this.facing.clear();this.statusSeen.clear();this.actors.clear();clear(this.pieces);clear(this.ground);clear(this.effects);clear(this.rubble);this.cursor.clear();
    // Only the painted ground owns its canvas; scenery frames share the atlas.
    this.terrainTextures.forEach((texture,i)=>texture.destroy(i===0));this.terrainTextures=[];
    this.paintTerrain();this.zoom=crispZoom(this.app.screen.width<500?.78:1,this.app.renderer.resolution);this.focus(state.living('player')[0]?.pos??{x:0,y:0});
  }
  /** A bridge was built or the river rose: repaint the ground from the changed map. */
  repaintTerrain(){
    if(!this.state)return;clear(this.ground);
    this.terrainTextures.forEach((texture,i)=>texture.destroy(i===0));this.terrainTextures=[];
    this.paintTerrain();this.fit();
  }
  private paintTerrain(){
    const result=terrainLayer(this.state!,this.scenery!);this.ground.addChild(result.layer);this.terrainTextures=[result.texture,...result.frames];
    const m=this.state!.map;const ruled=stageRules[this.state!.stage.id]?.labels,labels=ruled?ruled.map(l=>({at:m.regions.get(l.region)?.[0],text:l.text})):this.state!.stage.id==='S1-07'?[{at:m.regions.get('enemy_camp')?.[0],text:'전초 수비 진지'},{at:m.regions.get('forest_route')?.[0],text:'보병 숲길'},{at:m.regions.get('main_route')?.[0],text:'기병 큰길'}]:this.state!.stage.id==='S1-05'?[{at:m.regions.get('escort_goal')?.[0],text:'동쪽 교량 출구'},{at:m.regions.get('south_exit')?.[0],text:'남쪽 강변 출구'}]:this.state!.stage.id==='S1-03'?[{at:m.regions.get('east_pass')?.[0],text:'동쪽 고개'},{at:m.regions.get('ravine_exit')?.[0],text:'남쪽 계곡'}]:this.state!.stage.id==='S1-09'?[{at:m.regions.get('exit')?.[0],text:'야곡 출구'},{at:m.regions.get('bridge_bank')?.[0],text:'부교터'}]:this.state!.stage.id==='S1-10'?[{at:m.regions.get('exit')?.[0],text:'북쪽 고개'}]:[{at:m.regions.get('objective')?.[0],text:this.state!.stage.id==='S1-06'?'관문 돌파 구역':this.state!.stage.id==='S1-04'?'황제에게 접근':this.state!.stage.id==='S1-02'?'남문':this.state!.stage.id==='S1-01'?'창고':'중앙 성채'}];
    for(const {at,text} of labels)if(at){const label=new Text({text,style:{fontFamily:'Malgun Gothic',fontSize:14,fontWeight:'700',fill:0xffe4a3,dropShadow:{color:0x14201b,blur:2,distance:1}}});label.anchor.set(.5,1);label.position.set((at.x+.5)*W,at.y*H-6);this.ground.addChild(label);}
    for(const goal of this.state!.victory){
      if(!goal.target?.startsWith('trial_'))continue;
      const at=m.regionCoords(goal.target)[0];if(!at)continue;
      const text=goal.target==='trial_defense'?'방어 거점':goal.target==='trial_safe'?'구출 안전지대':goal.type==='capture'?'점령 거점':'호위 출구';
      const label=new Text({text,style:{fontFamily:'Malgun Gothic',fontSize:14,fontWeight:'700',fill:0xffe4a3,stroke:{color:0x14201b,width:4}}});label.anchor.set(.5,1);label.position.set((at.x+.5)*W,at.y*H-6);this.ground.addChild(label);
    }
  }
  render(state:BattleState,selected:string,mode:string,showThreat:boolean,scouted=false){
    this.state=state;this.selected=selected;this.mode=mode;this.ranges.clear();
    clear(this.warnings);
    for(const t of state.telegraphs??[]){
      const left=Math.max(1,t.at-state.turn),g=new Graphics();
      const warn=t.ratio<=0;
      for(const c of t.cells){const p=iso(c);diamond(g,p.x,p.y,warn?0xe0b030:0xd83a2a,left<=1?.38:.22).stroke({color:warn?0xffe08a:0xffb08a,width:2,alpha:.9});}
      this.warnings.addChild(g);
      const head=t.cells[0]!,p=iso(head),tag=new Text({text:`${t.label??'경고'} · ${left}턴`,style:{fontFamily:'Malgun Gothic',fontSize:12,fontWeight:'700',fill:0xffe0c8,stroke:{color:0x3a0c08,width:4}}});
      tag.anchor.set(.5,1);tag.position.set(p.x,p.y-H*.35);this.warnings.addChild(tag);
    }
    // Tile hazards: fire is always visible; traps only once the field has been scouted.
    const hazards=new Graphics();
    for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
      const tile=state.map.tileAt({x,y});if(tile.hazard==='fire'){const p=iso({x,y});diamond(hazards,p.x,p.y,0xff6a1a,.3).stroke({color:0xffb060,width:2,alpha:.85});hazards.rect(p.x-W*.22,p.y-H*.1,W*.44,H*.36).fill({color:0xffc04a,alpha:.22});}
      else if(tile.hazard==='trap'&&scouted){const p=iso({x,y});diamond(hazards,p.x,p.y,0x5a1810,.18).stroke({color:0xe0503a,width:2,alpha:.9});hazards.moveTo(p.x-W*.16,p.y-H*.16).lineTo(p.x+W*.16,p.y+H*.16).moveTo(p.x+W*.16,p.y-H*.16).lineTo(p.x-W*.16,p.y+H*.16).stroke({color:0xe0503a,width:2.5,alpha:.95});}
    }
    for(const z of stageRules[state.stage.id]?.zones??[])for(const at of state.map.regionCoords(z.region)){const p=iso(at);diamond(hazards,p.x,p.y,z.color,.16).stroke({color:z.color,width:2,alpha:.85});}
    this.warnings.addChild(hazards);
    const u=state.find(selected);
    for(const goal of state.victory){
      if(!goal.target?.startsWith('trial_'))continue;
      const color=goal.target==='trial_defense'?0xff9874:0xffdf84;
      for(const at of state.map.regionCoords(goal.target)){const p=iso(at);diamond(this.ranges,p.x,p.y,color,.35).stroke({color,width:3});}
    }
    if(state.stage.id==='S1-03'&&!state.activeDialogue){const target=state.victory.find(c=>c.type==='reach')?.target;if(target)for(const at of state.map.regionCoords(target)){const p=iso(at);diamond(this.ranges,p.x,p.y,0xffdf84,.3).stroke({color:0xffe3a0,width:3});}}
    if(scouted)for(const enemy of state.living('enemy')){
      const route=enemy.patrolRoute??[];
      if(route.length){const first=iso(enemy.pos);this.ranges.moveTo(first.x,first.y);for(const at of route){const p=iso(at);this.ranges.lineTo(p.x,p.y);}this.ranges.stroke({color:0xffd082,width:2,alpha:.7});}
    }
    // S1-08 racers: a gold ring under each competing ally instead of a line across the map.
    if(state.stage.id==='S1-08')for(const racer of state.living('allyAi').filter(u=>u.behavior==='race')){const p=iso(racer.pos);diamond(this.ranges,p.x,p.y,0xf4cc75,.12).stroke({color:0xf4cc75,width:1.5,alpha:.7});}
    if(showThreat)for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
      const c={x,y};if(state.living('enemy').some(e=>manhattan(e.pos,c)<=(e.visionRange??e.range[1]))){const p=iso(c);diamond(this.ranges,p.x,p.y,0xd36a5e,.22);}
    }
    if(u?.alive&&u.side===state.currentSide&&!u.hasActed){
      if((mode==='repair'||mode==='fortify')&&u.unitClass==='engineer')for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const at={x:u.pos.x+d.x,y:u.pos.y+d.y};if(!state.map.inBounds(at))continue;const occupant=state.unitAt(at),ok=mode==='repair'?!!occupant&&occupant.side!=='enemy':!occupant;if(ok){const p=iso(at);diamond(this.ranges,p.x,p.y,mode==='repair'?0x9fe0a8:0xe0c27a,.28).stroke({color:mode==='repair'?0xb9f2c0:0xf2d79a,width:1.4});}}
      if(mode==='heal'&&familyOf(u.unitClass)==='fengshui')for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){if(manhattan(u.pos,{x,y})<=3){const p=iso({x,y});diamond(this.ranges,p.x,p.y,0x83e8b2,.22);}}
      if(mode==='move'&&!u.hasMoved){const reach=state.map.reachable(u,state.occupancy(),ignoresRough(u));for(const k of reach.keys()){const [x,y]=k.split(',').map(Number);const p=iso({x:x!,y:y!});diamond(this.ranges,p.x,p.y,0x62ddd0,.24).stroke({color:0x8de2cb,width:.7,alpha:.55});}}
      else if(mode==='attack'||mode==='duel'||mode==='debate'||state.strategies.has(mode)){
        const def=state.strategies.get(mode);for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){const d=manhattan(u.pos,{x,y});if(d<=(def?.range??(mode==='debate'?3:mode==='duel'?1:u.range[1]))&&d>=(def?0:u.range[0])){const p=iso({x,y});diamond(this.ranges,p.x,p.y,def?0xd3b878:0xe58e78,.22).stroke({color:def?0xe5c88b:0xf0a091,width:.8,alpha:.5});}}
      }
    }
    if(!this.busy){
      for(const [id,actor] of this.actors)if(!state.find(id)?.alive){actor.piece.destroy({children:true});this.actors.delete(id);}
      for(const unit of state.living()){
        let actor=this.actors.get(unit.id);
        if(!actor){
          const piece=new Container(),sprite=new Sprite(this.unitTexture(unit));sprite.anchor.set(.5,.88);sprite.position.set(0,8);
          const mounted=(unit.id.startsWith('convoy_')||['cavalry','heavyCav','horseArcher','catapult','ram'].includes(artClass(unit.unitClass)));sprite.width=mounted?96:84;sprite.height=mounted?96:84;if(unit.id.startsWith('convoy_')){sprite.width=80;sprite.height=80;}else if(unit.unitClass==='navy'){sprite.width=sprite.height=104;sprite.anchor.y=NAVAL_WATERLINE+.03;}else if(!structureKind(unit.id))sprite.anchor.y=.945;if(structureKind(unit.id)){const kind=structureKind(unit.id);sprite.width=kind==='tower'?85:kind==='barricade'?58:64;sprite.height=kind==='tower'?118:kind==='barricade'?46:75;}
          // Troops first face the bulk of the opposing army; afterwards they turn as they move and strike.
          if(!structureKind(unit.id)){const foes=state.living().filter(o=>(o.side==='enemy')!==(unit.side==='enemy')&&!structureKind(o.id));const cx=foes.reduce((a,o)=>a+o.pos.x,0)/Math.max(1,foes.length);if(foes.length&&cx<unit.pos.x)sprite.scale.x*=-1;}
          // Dark-edged side disc under the feet: reads on grass, sand and water alike.
          const base=new Graphics();base.ellipse(0,6,20,9).fill({color:0x0b1410,alpha:.5});base.ellipse(0,7,17,7).fill({color:sides[unit.side],alpha:.3}).stroke({color:0x0d1411,width:5});base.ellipse(0,7,17,7).stroke({color:sides[unit.side],width:2.5});piece.addChild(base,sprite);
          actor={piece,sprite,unit};this.actors.set(unit.id,actor);this.pieces.addChild(piece);
        }
        const seen=this.statusSeen.get(unit.id),now=new Set(unit.statuses.map(x=>x.kind as string));
        if(seen)for(const kind of now)if(!seen.has(kind)&&reactions[kind])this.emote(unit.pos,reactions[kind]!);
        this.statusSeen.set(unit.id,now);
        actor.unit=unit;actor.piece.position.set((unit.pos.x+.5)*W,(unit.pos.y+.5)*H);actor.piece.zIndex=unit.pos.y;
        actor.sprite.texture=this.unitTexture(unit,this.facing.get(unit.id)??0);actor.sprite.alpha=1;actor.sprite.tint=unitTint(unit);
        if(actor.piece.children.length>2)for(const child of actor.piece.removeChildren(2))child.destroy();
        const bar=new Graphics();if(unit.id===selected||unit.id==='rescue_target'||unit.id==='convoy_trial')bar.ellipse(0,7,22,10).stroke({color:0xffe9aa,width:2});
        const ratio=Math.max(0,unit.hp/unit.stats.maxHp);bar.rect(-18,12,36,7).fill(0x0d1310).rect(-17,13,34,5).fill(0x40312a).rect(-17,13,Math.round(34*ratio),5).fill(ratio<.3?0xf06a4f:sides[unit.side]).rect(-17,13,Math.round(34*ratio),1).fill({color:0xffffff,alpha:.35});
        // Evolved troops (tier 2/3) wear gold rank diamonds beside the health bar.
        for(let t=1;t<tierOf(unit.unitClass);t++){const x=-25,y=15-(t-1)*8;bar.poly([x,y-4,x+3.5,y,x,y+4,x-3.5,y]).fill(0xe8c06a).stroke({color:0x2a1d0b,width:1.2});}
        actor.piece.addChild(bar);
        if(structureKind(unit.id)){const hp=new Text({text:unit.hp+'/'+unit.stats.maxHp,style:{fontFamily:'Malgun Gothic',fontSize:10,fontWeight:'700',fill:unit.hp<unit.stats.maxHp*.35?0xffa58a:0xfff1cf,stroke:{color:0x16130f,width:3}}});hp.anchor.set(.5,0);hp.y=20;actor.piece.addChild(hp);}
        else if(unit.id===selected||unit.side==='player'||['rescue_target','convoy_trial'].includes(unit.id)||isCommander(state,unit)){
          // Named commanders (targets, protected officers) carry their name so they stand out from the rank and file.
          const foe=unit.side==='enemy'&&unit.id!==selected;
          const name=new Text({text:unitName(unit),style:{fontFamily:'Malgun Gothic',fontSize:11,fontWeight:'700',fill:foe?0xffc2a8:unit.side==='allyAi'?0xffe39a:0xfff4da,stroke:{color:foe?0x2a0d08:0x0d1411,width:3}}});name.anchor.set(.5,0);name.y=20;actor.piece.addChild(name);
        }
      }
      this.pieces.sortableChildren=true;
      for(const fallen of state.units.values())if(!fallen.alive&&structureKind(fallen.id)&&!this.rubble.children.some(c=>c.label===fallen.id))this.drawRubble(fallen);
    }
    this.drawMinimap();
  }
  private hasReaction(u:Unit){const k=artClass(u.unitClass);return !structureKind(u.id)&&!u.id.startsWith('convoy_')&&!!(troopArt[k]||basicReactionArt[k]);}
  private unitTexture(u:Unit,pose=0){
    if(artClass(u.unitClass)!==u.unitClass)u={...u,unitClass:artClass(u.unitClass)};
    const basic=basicReactionArt[u.unitClass];if(pose>=8&&basic&&!structureKind(u.id)&&!u.id.startsWith('convoy_')){const frame=pose%4,id=basic.sheet+':'+basic.row+':'+frame,old=this.textures.get(id);if(old)return old;const atlas=this.troopTextures.get(basic.sheet)!,w=atlas.width/4,h=atlas.height/basic.rows,t=new Texture({source:atlas.source,frame:new Rectangle(frame*w,basic.row*h,w,h)});this.textures.set(id,t);return t;}
    const art=troopArt[u.unitClass];if(art){const sheet=art.sheet+(pose>=8?'-reaction':pose>=4?'-walk':''),frame=pose%4;const id=sheet+':'+art.row+':'+frame,old=this.textures.get(id);if(old)return old;const atlas=this.troopTextures.get(sheet)!,w=atlas.width/4,h=atlas.height/art.rows;const texture=new Texture({source:atlas.source,frame:new Rectangle(frame*w,art.row*h,w,h)});this.textures.set(id,texture);return texture;}
    if(u.unitClass==='navy'){const row=navalCrewRow(u.id,u.name),frame=pose%4,id='naval:'+row+':'+frame,old=this.textures.get(id);if(old)return old;const a=this.naval!,w=a.width/4,h=a.height/4,t=new Texture({source:a.source,frame:new Rectangle(frame*w,row*h,w,h)});this.textures.set(id,t);return t;}
    if(troopRoles[u.unitClass])u={...u,unitClass:visualClass(u.unitClass)};
    if(u.unitClass==='ram'){const id='ram:'+pose,old=this.textures.get(id);if(old)return old;const a=this.ram!,w=a.width/2,h=a.height/2,t=new Texture({source:a.source,frame:new Rectangle(pose%2*w,Math.floor(pose/2)*h,w,h)});this.textures.set(id,t);return t;}
    if(u.id.startsWith('convoy_')){const row=u.id==='convoy_b'?1:0,id='convoy:'+row+':'+pose;const old=this.textures.get(id);if(old)return old;const atlas=this.convoys!,w=atlas.width/4,h=atlas.height/2;const t=new Texture({source:atlas.source,frame:new Rectangle(pose*w,row*h,w,h)});this.textures.set(id,t);return t;}
    const structure=structureKind(u.id),extraRow=['crossbow','heavyCav','engineer','fengshui'].indexOf(u.unitClass);
    if(structure||extraRow>=0){const id=structure??('extra:'+extraRow+':'+pose);const old=this.textures.get(id);if(old)return old;const atlas=structure?this.scenery!:this.extra!,w=atlas.width/4,h=atlas.height/(structure?2:4),col=structure?structureFrame(structure)%4:pose,row=structure?Math.floor(structureFrame(structure)/4):extraRow;const t=new Texture({source:atlas.source,frame:new Rectangle(col*w,row*h,w,h)});this.textures.set(id,t);return t;}

    const row=['strategist','fengshui','civilian'].includes(u.unitClass)?4:u.unitClass==='spearman'?1:['archer','crossbow'].includes(u.unitClass)?2:['cavalry','heavyCav'].includes(u.unitClass)?3:u.unitClass==='catapult'?5:0;
    const id=row+':'+pose,old=this.textures.get(id);if(old)return old;
    const atlas=this.atlas!,w=atlas.width/4,h=atlas.height/6;
    const texture=new Texture({source:atlas.source,frame:new Rectangle(pose*w,row*h,w,h)});this.textures.set(id,texture);return texture;
  }
  /** Sequential log playback keeps attack, impact and counterattack visibly separate. */
  play(logs:LogEntry[]){
    const events=playbackEvents(logs);if(!events.length)return;
    const epoch=this.animationEpoch;this.busy=true;
    void (async()=>{try{for(const e of events){if(epoch!==this.animationEpoch)break;await this.animateEvent(e,epoch);}}finally{if(epoch===this.animationEpoch){this.busy=false;this.onAnimationEnd();}}})();
  }
  private tween(ms:number,epoch:number,fn:(p:number)=>void){
    if(this.reduced){fn(1);return Promise.resolve();}
    return new Promise<void>(resolve=>{const start=performance.now();const tick=()=>{if(epoch!==this.animationEpoch){this.app.ticker.remove(tick);resolve();return;}const p=Math.min(1,(performance.now()-start)/(ms/this.playbackRate));fn(p);if(p===1){this.app.ticker.remove(tick);resolve();}};this.app.ticker.add(tick);});
  }
  private async animateEvent(e:LogEntry,epoch:number){
    if(e.t==='retreat'){
      const actor=this.actors.get(e.unit);if(!actor)return;
      const mechanical=!!structureKind(e.unit)||['ram','catapult'].includes(actor.unit.unitClass)||e.unit.startsWith('convoy_');
      this.focusUnit(actor.unit.pos);const kind=structureKind(e.unit);this.burst(actor.unit.pos,kind==='gate'?'성문 돌파!':kind?'파괴':'퇴각',kind==='gate'?0xffd27a:0xd4c2a2);
      if(kind){this.debris(actor.unit.pos,kind==='gate'?26:16);if(kind==='gate'){this.onSound({kind:'breach',pan:this.panOf(actor.unit.pos)});this.emote(actor.unit.pos,reactions.breach!);}void this.shake(kind==='gate'?9:5,520,epoch);}
      this.onSound({kind:'retreat',unitClass:actor.unit.unitClass,structure:!!kind&&kind!=='gate',pan:this.panOf(actor.unit.pos)});
      if(!kind)this.emote(actor.unit.pos,reactions.retreat!);
      if(this.hasReaction(actor.unit))actor.sprite.texture=this.unitTexture(actor.unit,10);
      await this.tween(720,epoch,p=>{const m=retreatMotion(p,mechanical);actor.sprite.rotation=m.rotation;actor.sprite.y=8+m.drop;actor.piece.alpha=m.alpha;});
      if(epoch===this.animationEpoch){actor.piece.destroy({children:true});this.actors.delete(e.unit);this.facing.delete(e.unit);}return;
    }
    if(e.t==='guard'){
      const protector=this.actors.get(e.protector);if(!protector||!this.hasReaction(protector.unit))return;
      const facing=this.facing.get(e.protector)??0,scale=protector.sprite.scale.x;
      await this.tween(300,epoch,p=>{protector.sprite.texture=this.unitTexture(protector.unit,troopReactionPose('guard',p));protector.sprite.scale.x=Math.abs(scale);});
      if(epoch===this.animationEpoch){protector.sprite.texture=this.unitTexture(protector.unit,facing);protector.sprite.scale.x=scale;}return;
    }
    if(e.t==='move'){
      const actor=this.actors.get(e.unit);if(!actor)return;this.onSound({kind:'move',unitClass:actor.unit.unitClass,pan:this.panOf(e.from)});const from=iso(e.from),to=iso(e.to);this.focusUnit(e.to);const facing=troopFacing(to.x-from.x,to.y-from.y);if(troopArt[artClass(actor.unit.unitClass)]){this.facing.set(e.unit,facing.pose);actor.sprite.scale.x=Math.abs(actor.sprite.scale.x)*facing.flip;}else if(!structureKind(actor.unit.id)&&to.x!==from.x)actor.sprite.scale.x=Math.abs(actor.sprite.scale.x)*(to.x<from.x?-1:1);
      await this.tween(420,epoch,p=>{actor.piece.position.set(from.x+(to.x-from.x)*p,from.y+(to.y-from.y)*p);actor.sprite.y=8-Math.abs(Math.sin(p*Math.PI*4))*3;actor.sprite.rotation=Math.sin(p*Math.PI*4)*.025;if(troopArt[artClass(actor.unit.unitClass)])actor.sprite.texture=this.unitTexture(actor.unit,troopWalkPose(facing.pose,p));else if(actor.unit.id.startsWith('convoy_'))actor.sprite.texture=this.unitTexture(actor.unit,1+Math.floor(p*6)%2);else if(actor.unit.unitClass==='navy'){actor.sprite.texture=this.unitTexture(actor.unit,1+Math.floor(p*6)%2);actor.sprite.y=8-Math.sin(p*Math.PI*3)*2;}});
      if(epoch===this.animationEpoch){actor.sprite.y=8;actor.sprite.rotation=0;actor.sprite.texture=this.unitTexture(actor.unit,this.facing.get(e.unit)??0);}return;
    }
    if(e.t==='strike'){
      // The warned blow lands: flash every marked cell, then damage numbers on whoever stayed.
      const mid=e.cells[Math.floor(e.cells.length/2)]!;this.focusUnit(mid);
      this.onSound({kind:'strike',pan:this.panOf(mid)});
      const flash=new Graphics();for(const c of e.cells){const p=iso(c);diamond(flash,p.x,p.y,0xfff1c8,.85);}this.effects.addChild(flash);
      void this.shake(6,380,epoch);for(const c of e.cells)this.debris(c,4);
      await this.tween(380,epoch,p=>{flash.alpha=1-p;});flash.destroy();
      for(const h of e.hits){const u=this.state?.find(h.unit);if(u&&h.damage>0)this.burst(u.pos,'−'+h.damage,0xffc8a0);}
      return;
    }
    if(e.t!=='attack'&&e.t!=='counter'&&e.t!=='strategy')return;
    const caster=e.t==='strategy'?e.caster:e.attacker,actor=this.actors.get(caster);if(!actor)return;
    const targetId=e.t==='strategy'?e.targets[0]:e.defender,target=this.state?.find(targetId??'');if(!target)return;
    const from=iso(actor.unit.pos),to=iso(target.pos),dx=to.x-from.x,dy=to.y-from.y,len=Math.max(1,Math.hypot(dx,dy));
    this.focusUnit({x:(actor.unit.pos.x+target.pos.x)/2,y:(actor.unit.pos.y+target.pos.y)/2});
    if(troopArt[artClass(actor.unit.unitClass)]){this.facing.set(actor.unit.id,0);actor.sprite.scale.x=Math.abs(actor.sprite.scale.x)*(dx<0?-1:1);}else if(!structureKind(actor.unit.id)&&dx!==0)actor.sprite.scale.x=Math.abs(actor.sprite.scale.x)*(dx<0?-1:1);
    const ranged=e.t==='strategy'||['archer','crossbow','catapult','horseArcher'].includes(artClass(actor.unit.unitClass))||(actor.unit.unitClass==='navy'&&manhattan(actor.unit.pos,target.pos)>1),fx=new Graphics();this.effects.addChild(fx);
    const reactions_=(e.t==='strategy'?e.targets:[e.defender]).map((id,i)=>{
      const victim=this.actors.get(id),damage=e.t==='strategy'?(e.damage[i]??0):e.damage;
      const kind=troopReaction(e.t==='strategy'||e.hit,damage,!!victim&&!!this.state?.hasStatus(victim.unit,'guard'));
      return {victim,kind,scale:victim?.sprite.scale.x??1,tint:victim?.sprite.tint??0xffffff,texture:victim?.sprite.texture};
    });
    let hit=false;
    this.onSound(e.t==='strategy'?{kind:'strategy-start',unitClass:actor.unit.unitClass,strategy:e.strategy,pan:this.panOf(actor.unit.pos)}:{kind:'attack-start',unitClass:actor.unit.unitClass,pan:this.panOf(actor.unit.pos)});
    this.emote(actor.unit.pos,e.t==='counter'?reactions.counter!:cryFor(actor.unit.unitClass,e.t==='strategy',e.t==='strategy'?e.strategy:''));
    await this.tween(e.t==='strategy'?950:760,epoch,p=>{
      const pose=troopArt[artClass(actor.unit.unitClass)]?(p<.2||p>.9?0:e.t==='strategy'?3:2):(p<.22?1:p<.65?2:p<.92?3:0);actor.sprite.texture=this.unitTexture(actor.unit,pose);
      const lunge=ranged?0:Math.sin(Math.min(1,p/.65)*Math.PI)*19;actor.sprite.x=dx/len*lunge;actor.sprite.y=8+dy/len*lunge;
      fx.clear();
      if(ranged&&p>.2&&p<.6){const q=(p-.2)/.4,x=from.x+dx*q,y=from.y+dy*q-Math.sin(q*Math.PI)*22;
        if(e.t==='strategy')fx.circle(x,y-20,7+q*8).stroke({color:e.strategy==='fire'?0xffae60:e.strategy==='repair'?0xe8c27a:0xb1f1ed,width:3});
        else if(actor.unit.unitClass==='catapult'){for(let k=1;k<=4;k++){const b=Math.max(0,q-k*.06),tx=from.x+dx*b,ty=from.y+dy*b-Math.sin(b*Math.PI)*46;fx.circle(tx,ty-20,6-k).fill({color:0xd8cdb0,alpha:.5-k*.1});}fx.circle(x,y-20-Math.sin(q*Math.PI)*24,7).fill(0xb9ad8f).stroke({color:0x4b4235,width:1.5});}
        else fx.moveTo(x-dx/len*16,y-dy/len*16-20).lineTo(x,y-20).stroke({color:0xffedba,width:2});
      }
      if(e.t==='strategy'&&(e.strategy==='heal'||e.strategy==='calm'||e.damage.some(d=>d<0))&&p>=.6&&p<.88){fx.circle(to.x,to.y-15,18+(p-.6)*50).stroke({color:0xb1f1bd,width:3,alpha:1-(p-.6)/.28});}
      if(reactions_.some(r=>r.kind!=='none')&&p>=.6&&p<.88){const q=(p-.6)/.28;fx.moveTo(to.x-20+q*35,to.y-36).lineTo(to.x+15,to.y-5).stroke({color:e.t==='strategy'?0xb0f0dc:0xffe3a0,width:4*(1-q),alpha:1-q});}
      for(const r of reactions_){const v=r.victim;if(!v||r.kind==='none')continue;
        if(p>=.6&&p<.94){const q=(p-.6)/.34;if(this.hasReaction(v.unit)){v.sprite.texture=this.unitTexture(v.unit,troopReactionPose(r.kind,q));v.sprite.scale.x=Math.abs(r.scale)*(actor.unit.pos.x<v.unit.pos.x?-1:1);}v.sprite.x=r.kind==='hurt'?Math.sin(q*Math.PI*3)*5:0;v.sprite.tint=r.kind==='hurt'?0xffd5b3:r.tint;}
        else if(p>=.94){v.sprite.x=0;v.sprite.scale.x=r.scale;v.sprite.tint=r.tint;if(r.texture)v.sprite.texture=r.texture;}
      }
      if(p>=.6&&!hit){hit=true;if(e.t==='attack'&&e.critical&&e.hit)this.emote(target.pos,reactions.critical!,-26);if((e.t==='attack'||e.t==='counter')&&!e.hit)this.emote(target.pos,reactions.evade!);for(const r of reactions_)if(r.victim){if(r.kind==='guard')this.emote(r.victim.unit.pos,reactions.guard!);else{const dmg=e.t==='strategy'?(e.damage[e.targets.indexOf(r.victim.unit.id)]??0):e.damage;if(isCrisis(r.victim.unit.hp,r.victim.unit.stats.maxHp,dmg))this.emote(r.victim.unit.pos,reactions.crisis!,-24);}}if(e.t==='strategy')this.onSound({kind:e.strategy==='repair'?'repair':'strategy',strategy:e.strategy,unitClass:actor.unit.unitClass,pan:this.panOf(target.pos)});else this.onSound({kind:'impact',unitClass:actor.unit.unitClass,target:{id:target.id,unitClass:target.unitClass},hit:e.hit,critical:e.t==='attack'&&e.critical,guard:reactions_.some(r=>r.kind==='guard'),heavy:e.damage>=target.stats.maxHp*.3,structure:!!structureKind(target.id),pan:this.panOf(target.pos)});if(e.t!=='strategy'&&e.hit&&(structureKind(target.id)||['ram','catapult'].includes(actor.unit.unitClass))){this.debris(target.pos,actor.unit.unitClass==='ram'?18:10);if(actor.unit.unitClass==='ram'||actor.unit.unitClass==='catapult')void this.shake(actor.unit.unitClass==='ram'?7:4,300,epoch);}if(e.t==='strategy')e.targets.forEach((id,i)=>{const u=this.state?.find(id);if(u)this.burst(u.pos,(e.strategy==='heal'||e.strategy==='calm'||e.damage.some(d=>d<0))?'+'+Math.abs(e.damage[i]??0):String(e.damage[i]??0),e.strategy==='fire'?0xffb071:0xb9efe4);});else this.burst(target.pos,e.hit?'−'+e.damage:'회피',0xffd0ab);}
    });
    if(epoch!==this.animationEpoch)return;
    fx.destroy();actor.sprite.x=0;actor.sprite.y=8;actor.sprite.texture=this.unitTexture(actor.unit);
    for(const r of reactions_){if(r.victim){r.victim.sprite.x=0;r.victim.sprite.scale.x=r.scale;r.victim.sprite.tint=r.tint;if(r.texture)r.victim.sprite.texture=r.texture;}}
  }
  /** Broken timber and stones stay where a gate, tower or barricade fell. */
  private drawRubble(u:Unit){
    const p=iso(u.pos),item=new Container(),g=new Graphics();item.label=u.id;
    g.ellipse(p.x,p.y+6,22,11).fill({color:0x2e2822,alpha:.6});
    // The fallen structure's own art, toppled and scorched.
    const kind=structureKind(u.id)!,frame=structureFrame(kind),a=this.scenery!,w=a.width/4,h=a.height/2;
    const fallen=new Sprite(new Texture({source:a.source,frame:new Rectangle(frame%4*w,Math.floor(frame/4)*h,w,h)}));
    fallen.anchor.set(.5,.9);fallen.position.set(p.x+3,p.y+12);fallen.width=kind==='tower'?62:50;fallen.height=kind==='tower'?44:34;fallen.rotation=kind==='gate'?.28:-.42;fallen.tint=0x8a7360;fallen.alpha=.92;
    const seed=u.pos.x*31+u.pos.y*17,stones=new Graphics();
    for(let i=0;i<10;i++){const a2=((seed*(i+3))%360)*Math.PI/180,d=8+((seed+i*7)%12),x=p.x+Math.cos(a2)*d,y=p.y+6+Math.sin(a2)*d*.5;stones.ellipse(x,y,3+(i%3)*2,2+(i%2)*2).fill(i%3===0?0x5b4330:0x8b8576).stroke({color:0x221c16,width:1});}
    for(let i=0;i<3;i++){const x=p.x-16+i*13;stones.moveTo(x,p.y+14-i*2).lineTo(x+12,p.y+4+i*3).stroke({color:0x4a2f1c,width:4});}
    stones.circle(p.x-6,p.y-4,9).fill({color:0x6e6a62,alpha:.25});
    item.addChild(g,fallen,stones);this.rubble.addChild(item);
  }
  private debris(at:Coord,count:number){
    if(this.reduced)return;const p=iso(at),born=performance.now(),g=new Graphics();this.effects.addChild(g);
    const parts=Array.from({length:count},(_,i)=>({vx:Math.cos(i*2.4)*(30+i%5*14),vy:-60-(i%4)*28,size:2+i%3,color:i%3===0?0x6d4b2c:0xa49b86}));
    const tick=()=>{if(g.destroyed){this.app.ticker.remove(tick);return;}const t=(performance.now()-born)/700;g.clear();
      for(const q of parts)g.rect(p.x+q.vx*t,p.y-14+q.vy*t+140*t*t,q.size,q.size).fill({color:q.color,alpha:1-t});
      g.circle(p.x,p.y-6,10+t*26).fill({color:0xcfc4ad,alpha:.28*(1-t)});
      if(t>=1){this.app.ticker.remove(tick);g.destroy();}};this.app.ticker.add(tick);
  }
  private shake(power:number,ms:number,epoch:number){return this.tween(ms,epoch,p=>{const k=(1-p)*power;this.world.pivot.set(Math.sin(p*60)*k,Math.cos(p*47)*k*.6);if(p>=1)this.world.pivot.set(0,0);});}
  /** Pop a speech balloon (or a jagged burst for charges and criticals) above a unit. */
  emote(at:Coord,e:Emote,lift=0){
    const p=iso(at),item=new Container(),g=new Graphics();item.position.set(p.x+10,p.y-70+lift);item.zIndex=999;
    const burst=e.shape==='burst';
    const text=new Text({text:e.text,style:{fontFamily:'Malgun Gothic,"Noto Sans KR",sans-serif',fontSize:13,fontWeight:'900',fill:burst?0xfff6e0:e.color,stroke:{color:burst?0x2a1a12:0xfffaf0,width:burst?3:0}}});text.anchor.set(.5);
    const w=Math.max(30,text.width+16),h=24;
    if(burst){
      const pts:number[]=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?.78:1;pts.push(Math.cos(a)*(w/2+7)*r,Math.sin(a)*(h/2+7)*r);}
      g.poly(pts).fill(e.color).stroke({color:0x2a1a12,width:2});
    }else{
      g.roundRect(-w/2,-h/2,w,h,9).fill(0xfffaf0).stroke({color:0x2a2620,width:2});g.poly([-8,h/2-1,0,h/2-1,-11,h/2+8]).fill(0xfffaf0);g.moveTo(-8,h/2).lineTo(-11,h/2+8).lineTo(0,h/2).stroke({color:0x2a2620,width:2});
    }
    item.addChild(g,text);this.effects.addChild(item);
    if(this.reduced){setTimeout(()=>item.destroy({children:true}),900);return;}
    const born=performance.now();item.scale.set(.2);
    const tick=()=>{if(item.destroyed){this.app.ticker.remove(tick);return;}const t=(performance.now()-born)/1300;
      item.scale.set(t<.12?.2+t/.12*1:t<.2?1.2-(t-.12)/.08*.2:1);item.y=p.y-70+lift-Math.max(0,t-.55)*30;item.alpha=t<.7?1:1-(t-.7)/.3;
      if(t>=1){this.app.ticker.remove(tick);item.destroy({children:true});}};this.app.ticker.add(tick);
  }
  burst(at:Coord,text:string,color=0xf2c885){
    const p=iso(at),item=new Container(),g=new Graphics();item.position.set(p.x,p.y-20);g.circle(0,0,16).stroke({color,width:2,alpha:.7});
    const label=new Text({text,style:{fontFamily:'Malgun Gothic',fontSize:22,fontWeight:'700',fill:color,dropShadow:{color:0x15221c,blur:3,distance:2}}});label.anchor.set(.5);label.y=-20;item.addChild(g,label);this.effects.addChild(item);
    if(this.reduced){setTimeout(()=>item.destroy({children:true}),600);return;}
    const born=performance.now();const tick=()=>{if(item.destroyed){this.app.ticker.remove(tick);return;}const age=(performance.now()-born)/900;item.y=p.y-20-age*35;item.alpha=1-age;g.scale.set(1+age*2);if(age>=1){this.app.ticker.remove(tick);item.destroy({children:true});}};this.app.ticker.add(tick);
  }
}
