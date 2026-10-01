import {spriteAtlas} from './sprite-atlas.ts';
import {structureKind} from './campaign-rules.ts';
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import {terrainLayer} from './terrain.ts';
import type {LogEntry} from '../../core/src/index.ts';
import { key, manhattan, ignoresRough } from '../../core/src/index.ts';
import type { BattleState, Coord, Unit, TerrainKind } from '../../core/src/index.ts';

const W=48,H=48;
const colors:Record<TerrainKind,number>={plain:0x6b7560,road:0xada084,forest:0x435f50,mountain:0x69736d,hill:0x83846a,water:0x3d6770,rapids:0x3d6770,bridge:0x98846a,fort:0xab9e7b,gate:0x8b8a77,wall:0x777f74};
const sides={player:0x68c9bf,ally:0x86b7d9,allyAi:0xd3b06b,enemy:0xe78b79};
export const terrainNames:Record<TerrainKind,string>={plain:'평지',road:'길',forest:'숲',mountain:'산지',hill:'구릉',water:'수상',rapids:'완류',bridge:'다리',fort:'성채',gate:'성문',wall:'성벽'};
export const classNames:Record<string,string>={infantry:'보병',spearman:'창병',cavalry:'경기병',heavyCav:'중기병',archer:'궁병',crossbow:'노병',strategist:'책사',fengshui:'풍수사',ram:'충차',catapult:'포차',engineer:'공병',navy:'수군',civilian:'민중'};
export function unitName(u:Unit){return classNames[u.name]??u.name;}
function iso(c:Coord){return {x:c.x*W+W/2,y:c.y*H+H/2};}
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
  private state:BattleState|undefined;
  private selected='';
  private mode='move';
  private previousPositions=new Map<string,Coord>();
  private textures=new Map<string,Texture>();
  private atlas:Texture|undefined;
  private extra:Texture|undefined;
  private ram:Texture|undefined;
  private convoys:Texture|undefined;
  private scenery:Texture|undefined;
  private terrainTextures:Texture[]=[];
  private actors=new Map<string,{piece:Container,sprite:Sprite,unit:Unit}>();
  private minimap:HTMLCanvasElement|undefined;
  private animationEpoch=0;
  busy=false;
  playbackRate=1;
  onCue:(kind:'move'|'attack'|'magic')=>void=()=>{};
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
    await this.app.init({resizeTo:privateHost,backgroundAlpha:0,antialias:false,resolution:Math.min(devicePixelRatio,2),autoDensity:true,preference:'webgl'});
    this.ram=Texture.from(await spriteAtlas('/ram-v1.png',2,2));this.ram.source.scaleMode='nearest';
    this.convoys=await Assets.load<Texture>('/convoys-v1.png');this.convoys.source.scaleMode='nearest';
    this.extra=Texture.from(await spriteAtlas('/units-extra-v1.png',4));this.extra.source.scaleMode='nearest';
    this.atlas=Texture.from(await spriteAtlas('/units-v3.png',6));this.atlas.source.scaleMode='nearest';
    this.scenery=await Assets.load<Texture>('/scenery-v3.png');this.scenery.source.scaleMode='nearest';
    privateHost.appendChild(this.app.canvas);
    this.minimap=document.createElement('canvas');this.minimap.className='tactical-minimap';this.minimap.width=192;this.minimap.height=144;this.minimap.setAttribute('aria-label','전체 전황 지도. 클릭하면 해당 위치로 이동합니다.');privateHost.appendChild(this.minimap);
    this.minimap.addEventListener('pointerdown',e=>{e.stopPropagation();if(!this.state)return;const r=this.minimap!.getBoundingClientRect();this.focus({x:(e.clientX-r.left)/r.width*this.state.map.width,y:(e.clientY-r.top)/r.height*this.state.map.height});});
    this.app.canvas.setAttribute('aria-label','정방 격자 전술 지도. 방향키로 칸 이동, Enter로 선택. 마우스 휠로 확대, 드래그로 이동.');
    this.app.canvas.tabIndex=0;
    this.app.stage.addChild(this.world);this.world.addChild(this.ground,this.ranges,this.pieces,this.cursor,this.effects);
    const canvas=this.app.canvas;
    canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,px:this.pan.x,py:this.pan.y};this.dragged=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{
      if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>5)this.dragged=true;if(this.dragged){this.pan={x:this.drag.px+dx,y:this.drag.py+dy};this.fit();return;}}
      const r=canvas.getBoundingClientRect();this.setHover(this.fromPoint(e.clientX-r.left,e.clientY-r.top));
    });
    canvas.addEventListener('pointerup',e=>{if(!this.dragged){const r=canvas.getBoundingClientRect();const c=this.fromPoint(e.clientX-r.left,e.clientY-r.top);if(c)this.onCell(c);}this.drag=undefined;});
    canvas.addEventListener('pointercancel',()=>{this.drag=undefined;});
    canvas.addEventListener('pointerleave',()=>{if(!this.drag)this.setHover(undefined);});
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
    this.zoom=Math.max(.22,Math.min(1.8,z));this.fit();this.focus({x:center.x/W-.5,y:center.y/H-.5});
  }
  zoomBy(d:number){this.setZoom(this.zoom+d);}
  reset(){if(!this.state)return;this.overview=true;this.zoom=Math.min((this.app.screen.width-40)/(this.state.map.width*W),(this.app.screen.height-70)/(this.state.map.height*H));this.pan={x:0,y:0};this.fit();}
  focusUnit(at:Coord){this.overview=false;this.zoom=Math.max(this.zoom,this.app.screen.width<500?.85:1);this.focus(at);}
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
    this.world.position.set(x,y);this.pan={x:x-left,y:y-top};this.drawMinimap();
  }
  private drawMinimap(){
    if(!this.minimap||!this.state)return;const c=this.minimap,g=c.getContext('2d')!,m=this.state.map,sx=c.width/m.width,sy=c.height/m.height;
    g.clearRect(0,0,c.width,c.height);
    for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){g.fillStyle='#'+colors[m.tileAt({x,y}).terrain].toString(16).padStart(6,'0');g.fillRect(x*sx,y*sy,sx+1,sy+1);}
    for(const u of this.state.living()){g.fillStyle='#'+sides[u.side].toString(16);g.fillRect(u.pos.x*sx-1,u.pos.y*sy-1,4,4);}
    g.strokeStyle='#fff1c0';g.lineWidth=1.5;g.strokeRect(-this.world.x/this.zoom/W*sx,-this.world.y/this.zoom/H*sy,this.app.screen.width/this.zoom/W*sx,this.app.screen.height/this.zoom/H*sy);
  }
  load(state:BattleState){
    this.animationEpoch++;this.busy=false;this.overview=false;this.state=state;this.previousPositions.clear();this.actors.clear();clear(this.pieces);clear(this.ground);clear(this.effects);this.cursor.clear();
    for(const texture of this.terrainTextures)texture.destroy(texture.source.resource instanceof HTMLCanvasElement);this.terrainTextures=[];
    this.paintTerrain();this.zoom=this.app.screen.width<500?.78:1;this.focus(state.living('player')[0]?.pos??{x:0,y:0});
  }
  private paintTerrain(){
    const result=terrainLayer(this.state!,this.scenery!);this.ground.addChild(result.layer);this.terrainTextures=[result.texture,...result.frames];
    const m=this.state!.map;const labels=this.state!.stage.id==='S1-07'?[{at:m.regions.get('enemy_camp')?.[0],text:'전초 수비 진지'},{at:m.regions.get('forest_route')?.[0],text:'보병 숲길'},{at:m.regions.get('main_route')?.[0],text:'기병 큰길'}]:this.state!.stage.id==='S1-05'?[{at:m.regions.get('escort_goal')?.[0],text:'동쪽 교량 출구'},{at:m.regions.get('south_exit')?.[0],text:'남쪽 강변 출구'}]:this.state!.stage.id==='S1-03'?[{at:m.regions.get('east_pass')?.[0],text:'동쪽 고개'},{at:m.regions.get('ravine_exit')?.[0],text:'남쪽 계곡'}]:[{at:m.regions.get('objective')?.[0],text:this.state!.stage.id==='S1-06'?'관문 돌파 구역':this.state!.stage.id==='S1-04'?'황제에게 접근':this.state!.stage.id==='S1-02'?'南門':this.state!.stage.id==='S1-01'?'창고':'중앙 성채'}];
    for(const {at,text} of labels)if(at){const label=new Text({text,style:{fontFamily:'Malgun Gothic',fontSize:14,fontWeight:'700',fill:0xffe4a3,dropShadow:{color:0x14201b,blur:2,distance:1}}});label.anchor.set(.5,1);label.position.set((at.x+.5)*W,at.y*H-6);this.ground.addChild(label);}
  }
  render(state:BattleState,selected:string,mode:string,showThreat:boolean,scouted=false){
    this.state=state;this.selected=selected;this.mode=mode;this.ranges.clear();
    const u=state.find(selected);
    if(state.stage.id==='S1-03'&&!state.activeDialogue){const target=state.victory.find(c=>c.type==='reach')?.target;if(target)for(const at of state.map.regionCoords(target)){const p=iso(at);diamond(this.ranges,p.x,p.y,0xffdf84,.3).stroke({color:0xffe3a0,width:3});}}
    if(scouted)for(const enemy of state.living('enemy')){
      const route=enemy.patrolRoute??[];
      if(route.length){const first=iso(enemy.pos);this.ranges.moveTo(first.x,first.y);for(const at of route){const p=iso(at);this.ranges.lineTo(p.x,p.y);}this.ranges.stroke({color:0xffd082,width:2,alpha:.7});}
    }
    if(state.stage.id==='S1-08')for(const racer of state.living('allyAi').filter(u=>u.behavior==='race')){
      const goal=state.map.regions.get('central_fort')?.[0];if(goal){const p=iso(racer.pos),end=iso(goal);this.ranges.moveTo(p.x,p.y).lineTo(end.x,end.y).stroke({color:0xf4cc75,width:1,alpha:.4});}
    }
    if(showThreat)for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){
      const c={x,y};if(state.living('enemy').some(e=>manhattan(e.pos,c)<=(e.visionRange??e.range[1]))){const p=iso(c);diamond(this.ranges,p.x,p.y,0xd36a5e,.22);}
    }
    if(u?.alive&&u.side===state.currentSide&&!u.hasActed){
      if(mode==='heal'&&u.unitClass==='fengshui')for(let y=0;y<state.map.height;y++)for(let x=0;x<state.map.width;x++){if(manhattan(u.pos,{x,y})<=3){const p=iso({x,y});diamond(this.ranges,p.x,p.y,0x83e8b2,.22);}}
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
          const mounted=(unit.id.startsWith('convoy_')||['cavalry','heavyCav','catapult','ram'].includes(unit.unitClass));sprite.width=mounted?90:78;sprite.height=mounted?90:78;if(unit.id.startsWith('convoy_')){sprite.width=76;sprite.height=76;}else if(!structureKind(unit.id))sprite.anchor.y=.945;if(structureKind(unit.id)){sprite.width=structureKind(unit.id)==='tower'?85:64;sprite.height=structureKind(unit.id)==='tower'?118:75;}
          const base=new Graphics();base.ellipse(0,5,17,7).fill({color:0x13211c,alpha:.4});base.ellipse(0,7,16,7).stroke({color:sides[unit.side],width:3});piece.addChild(base,sprite);
          actor={piece,sprite,unit};this.actors.set(unit.id,actor);this.pieces.addChild(piece);
        }
        actor.unit=unit;actor.piece.position.set((unit.pos.x+.5)*W,(unit.pos.y+.5)*H);actor.piece.zIndex=unit.pos.y;
        actor.sprite.texture=this.unitTexture(unit);actor.sprite.alpha=unit.hasActed?.65:1;actor.sprite.tint=unit.side==='enemy'?0xffb3a0:unit.side==='allyAi'?0xffdc8e:0xffffff;
        if(actor.piece.children.length>2)for(const child of actor.piece.removeChildren(2))child.destroy();
        const bar=new Graphics();if(unit.id===selected)bar.ellipse(0,7,22,10).stroke({color:0xffe9aa,width:2});
        bar.rect(-16,13,32,4).fill(0x182720).rect(-16,13,32*Math.max(0,unit.hp/unit.stats.maxHp),4).fill(sides[unit.side]);actor.piece.addChild(bar);
        if(unit.id===selected||unit.side==='player'){
          const name=new Text({text:unitName(unit),style:{fontFamily:'Malgun Gothic',fontSize:11,fill:0xfff4da,dropShadow:{color:0x10251e,blur:2,distance:1}}});name.anchor.set(.5,0);name.y=19;actor.piece.addChild(name);
        }
      }
      this.pieces.sortableChildren=true;
    }
    this.drawMinimap();
  }
  private unitTexture(u:Unit,pose=0){
    if(u.unitClass==='ram'){const id='ram:'+pose,old=this.textures.get(id);if(old)return old;const a=this.ram!,w=a.width/2,h=a.height/2,t=new Texture({source:a.source,frame:new Rectangle(pose%2*w,Math.floor(pose/2)*h,w,h)});this.textures.set(id,t);return t;}
    if(u.id.startsWith('convoy_')){const row=u.id==='convoy_b'?1:0,id='convoy:'+row+':'+pose;const old=this.textures.get(id);if(old)return old;const atlas=this.convoys!,w=atlas.width/4,h=atlas.height/2;const t=new Texture({source:atlas.source,frame:new Rectangle(pose*w,row*h,w,h)});this.textures.set(id,t);return t;}
    const structure=structureKind(u.id),extraRow=['crossbow','heavyCav','engineer','fengshui'].indexOf(u.unitClass);
    if(structure||extraRow>=0){const id=structure??('extra:'+extraRow+':'+pose);const old=this.textures.get(id);if(old)return old;const atlas=structure?this.scenery!:this.extra!,w=atlas.width/4,h=atlas.height/(structure?2:4),col=structure?(structure==='gate'?2:3):pose,row=structure?0:extraRow;const t=new Texture({source:atlas.source,frame:new Rectangle(col*w,row*h,w,h)});this.textures.set(id,t);return t;}

    const row=['strategist','fengshui','civilian'].includes(u.unitClass)?4:u.unitClass==='spearman'?1:['archer','crossbow'].includes(u.unitClass)?2:['cavalry','heavyCav'].includes(u.unitClass)?3:u.unitClass==='catapult'?5:0;
    const id=row+':'+pose,old=this.textures.get(id);if(old)return old;
    const atlas=this.atlas!,w=atlas.width/4,h=atlas.height/6;
    const texture=new Texture({source:atlas.source,frame:new Rectangle(pose*w,row*h,w,h)});this.textures.set(id,texture);return texture;
  }
  /** Sequential log playback keeps attack, impact and counterattack visibly separate. */
  play(logs:LogEntry[]){
    const events=logs.filter(e=>['move','attack','counter','strategy'].includes(e.t));if(!events.length)return;
    const epoch=this.animationEpoch;this.busy=true;
    void (async()=>{try{for(const e of events){if(epoch!==this.animationEpoch)break;await this.animateEvent(e,epoch);}}finally{if(epoch===this.animationEpoch){this.busy=false;this.onAnimationEnd();}}})();
  }
  private tween(ms:number,epoch:number,fn:(p:number)=>void){
    if(this.reduced){fn(1);return Promise.resolve();}
    return new Promise<void>(resolve=>{const start=performance.now();const tick=()=>{if(epoch!==this.animationEpoch){this.app.ticker.remove(tick);resolve();return;}const p=Math.min(1,(performance.now()-start)/(ms/this.playbackRate));fn(p);if(p===1){this.app.ticker.remove(tick);resolve();}};this.app.ticker.add(tick);});
  }
  private async animateEvent(e:LogEntry,epoch:number){
    if(e.t==='move'){
      this.onCue('move');
      const actor=this.actors.get(e.unit);if(!actor)return;const from=iso(e.from),to=iso(e.to);this.focusUnit(e.to);
      await this.tween(420,epoch,p=>{actor.piece.position.set(from.x+(to.x-from.x)*p,from.y+(to.y-from.y)*p);actor.sprite.y=8-Math.abs(Math.sin(p*Math.PI*4))*3;actor.sprite.rotation=Math.sin(p*Math.PI*4)*.025;if(actor.unit.id.startsWith('convoy_'))actor.sprite.texture=this.unitTexture(actor.unit,1+Math.floor(p*6)%2);});
      if(epoch===this.animationEpoch){actor.sprite.y=8;actor.sprite.rotation=0;actor.sprite.texture=this.unitTexture(actor.unit);}return;
    }
    if(e.t!=='attack'&&e.t!=='counter'&&e.t!=='strategy')return;
    const caster=e.t==='strategy'?e.caster:e.attacker,actor=this.actors.get(caster);if(!actor)return;
    const targetId=e.t==='strategy'?e.targets[0]:e.defender,target=this.state?.find(targetId??'');if(!target)return;
    const from=iso(actor.unit.pos),to=iso(target.pos),dx=to.x-from.x,dy=to.y-from.y,len=Math.max(1,Math.hypot(dx,dy));
    this.focusUnit({x:(actor.unit.pos.x+target.pos.x)/2,y:(actor.unit.pos.y+target.pos.y)/2});
    const ranged=e.t==='strategy'||['archer','crossbow','catapult'].includes(actor.unit.unitClass),fx=new Graphics();this.effects.addChild(fx);
    let hit=false;
    await this.tween(e.t==='strategy'?950:760,epoch,p=>{
      const pose=p<.22?1:p<.65?2:p<.92?3:0;actor.sprite.texture=this.unitTexture(actor.unit,pose);
      const lunge=ranged?0:Math.sin(Math.min(1,p/.65)*Math.PI)*19;actor.sprite.x=dx/len*lunge;actor.sprite.y=8+dy/len*lunge;
      fx.clear();
      if(ranged&&p>.2&&p<.6){const q=(p-.2)/.4,x=from.x+dx*q,y=from.y+dy*q-Math.sin(q*Math.PI)*22;
        if(e.t==='strategy')fx.circle(x,y-20,7+q*8).stroke({color:e.strategy==='fire'?0xffae60:0xb1f1ed,width:3});
        else if(actor.unit.unitClass==='catapult')fx.circle(x,y-20,6).fill(0xb9ad8f);
        else fx.moveTo(x-dx/len*16,y-dy/len*16-20).lineTo(x,y-20).stroke({color:0xffedba,width:2});
      }
      if(e.t==='strategy'&&(e.strategy==='heal'||e.damage.some(d=>d<0))&&p>=.6&&p<.88){fx.circle(to.x,to.y-15,18+(p-.6)*50).stroke({color:0xb1f1bd,width:3,alpha:1-(p-.6)/.28});}
      if(!(e.t==='strategy'&&(e.strategy==='heal'||e.damage.some(d=>d<0)))&&p>=.6&&p<.88){const q=(p-.6)/.28;fx.moveTo(to.x-20+q*35,to.y-36).lineTo(to.x+15,to.y-5).stroke({color:e.t==='strategy'?0xb0f0dc:0xffe3a0,width:4*(1-q),alpha:1-q});const victim=this.actors.get(target.id);if(victim){victim.sprite.x=Math.sin(q*Math.PI*3)*5;victim.sprite.tint=0xffd5b3;}}
      if(p>=.6&&!hit){hit=true;this.onCue(e.t==='strategy'?'magic':'attack');if(e.t==='strategy')e.targets.forEach((id,i)=>{const u=this.state?.find(id);if(u)this.burst(u.pos,(e.strategy==='heal'||e.damage.some(d=>d<0))?'+'+Math.abs(e.damage[i]??0):String(e.damage[i]??0),e.strategy==='fire'?0xffb071:0xb9efe4);});else this.burst(target.pos,e.hit?'−'+e.damage:'회피',0xffd0ab);}
    });
    if(epoch!==this.animationEpoch)return;
    fx.destroy();actor.sprite.x=0;actor.sprite.y=8;actor.sprite.texture=this.unitTexture(actor.unit);
    const victim=this.actors.get(target.id);if(victim){victim.sprite.x=0;victim.sprite.tint=target.side==='enemy'?0xffb3a0:0xffffff;}
  }
  burst(at:Coord,text:string,color=0xf2c885){
    const p=iso(at),item=new Container(),g=new Graphics();item.position.set(p.x,p.y-20);g.circle(0,0,16).stroke({color,width:2,alpha:.7});
    const label=new Text({text,style:{fontFamily:'Malgun Gothic',fontSize:22,fontWeight:'700',fill:color,dropShadow:{color:0x15221c,blur:3,distance:2}}});label.anchor.set(.5);label.y=-20;item.addChild(g,label);this.effects.addChild(item);
    if(this.reduced){setTimeout(()=>item.destroy({children:true}),600);return;}
    const born=performance.now();const tick=()=>{if(item.destroyed){this.app.ticker.remove(tick);return;}const age=(performance.now()-born)/900;item.y=p.y-20-age*35;item.alpha=1-age;g.scale.set(1+age*2);if(age>=1){this.app.ticker.remove(tick);item.destroy({children:true});}};this.app.ticker.add(tick);
  }
}
