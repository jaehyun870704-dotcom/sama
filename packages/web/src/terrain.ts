import {Container,Sprite,Texture,Rectangle,Graphics} from 'pixi.js';
import type {BattleState} from '../../core/src/index.ts';

/** Render actual map data; decorations never replace collision or terrain rules. */
export function terrainLayer(state:BattleState,atlas:Texture){
  const map=state.map,layer=new Container(),size=48;
  const canvas=document.createElement('canvas');canvas.width=map.width*size;canvas.height=map.height*size;
  const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  const palette:Record<string,string>={plain:'#849568',road:'#c3ac7c',forest:'#627c50',mountain:'#7e8778',hill:'#9b9b70',water:'#467e89',rapids:'#3d7483',bridge:'#48808b',fort:'#b3a48b',gate:'#b2a08a',wall:'#7c8478'};
  if(state.stage.id==='S1-06')Object.assign(palette,{plain:'#afa17c',road:'#c2ab80',hill:'#a2916b',mountain:'#8f8978',forest:'#838359',water:'#708c8b'});
  if(state.stage.id==='S1-07')Object.assign(palette,{plain:'#7f9270',road:'#b8a884',hill:'#929477',mountain:'#777f76',forest:'#486a52',fort:'#9f9684'});
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
    const t=map.tileAt({x,y}).terrain,px=x*size,py=y*size;
    rect(px,py,size,size,palette[t]!);
    if(t==='plain'||t==='forest'||t==='hill'){
      const light=Math.sin(x*.45+y*.18)*Math.cos(y*.33-x*.16);
      rect(px,py,size,size,light>0?'#bfd18912':'#344f4010');
      for(let i=0;i<6;i++){
        const dx=(x*23+y*11+i*13)%42,dy=(y*19+x*7+i*11)%42;
        rect(px+dx,py+dy,7,3,i%2?'#b7bf7620':'#536e3c18');
      }
    }
    for(let i=0;i<32;i++){
      const dx=(x*19+y*23+i*17)%47,dy=(x*31+y*7+i*13)%47;
      rect(px+dx,py+dy,i%3+1,1,i%2?'#e8e8b920':'#263c3020');
    }
    if(t==='plain'||t==='forest')for(let i=0;i<4;i++){
      const dx=(x*11+y*17+i*13)%42+2,dy=(y*11+x*7+i*17)%42+2;
      rect(px+dx,py+dy,1,3,'#50644260');rect(px+dx+2,py+dy+1,1,2,'#c3cb8f70');
    }
    if(t==='water'||t==='rapids'){
      for(let i=0;i<3;i++){const xx=px+(x*7+y*11+i*13)%32,yy=py+8+i*13;rect(xx,yy,12,1,'#bddace75');rect(xx+4,yy+2,7,1,'#2b606a70');}
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
        const at={x:x+dx!,y:y+dy!};if(!map.inBounds(at))continue;
        if(!['water','rapids','bridge'].includes(map.tileAt(at).terrain)){
          rect(px+(dx===1?43:0),py+(dy===1?43:0),dx?5:48,dy?5:48,'#b6b88a');
          rect(px+(dx===1?40:dx===-1?5:0),py+(dy===1?40:dy===-1?5:0),dx?3:48,dy?3:48,'#8caf9d');
        }
      }
    }
    if(t==='road')for(let i=0;i<8;i++)rect(px+(x*11+i*13)%45,py+(y*17+i*7)%45,2,2,'#796a4940');
    if(t==='fort'||t==='gate')for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      rect(px+i*12,py+j*12,11,11,(i+j)%2?'#b1a58e':'#baad96');
    }
    if(t==='bridge'){
      const stone=state.stage.id==='S1-08'&&y<20;
      for(let i=0;i<8;i++)rect(px+i*6,py+3,5,42,stone?'#b6b3a0':'#bc9867');
      rect(px,py+3,48,3,stone?'#ddd2b6':'#dcc18d');rect(px,py+43,48,3,'#5d604f');
    }
  }
  for(const p of map.regions.get('fields')??[]){
    rect(p.x*48,p.y*48,48,48,'#a69a5e');
    for(let j=0;j<6;j++){rect(p.x*48,p.y*48+j*8,47,3,'#6e7341');rect(p.x*48+2,p.y*48+j*8,44,1,'#d1c37c');}
  }
  if(state.stage.id==='S1-04'){ctx.fillStyle='#39335f55';ctx.fillRect(0,0,canvas.width,canvas.height);}
  const texture=Texture.from(canvas);texture.source.scaleMode='nearest';layer.addChild(new Sprite(texture));
  const frames=Array.from({length:8},(_,i)=>new Texture({source:atlas.source,frame:new Rectangle((i%4)*atlas.width/4,Math.floor(i/4)*atlas.height/2,atlas.width/4,atlas.height/2)}));
  const object=(cell:number,x:number,y:number,w:number,h:number)=>{
    const s=new Sprite(frames[cell]);s.anchor.set(.5,.87);s.position.set((x+.5)*size,(y+.8)*size);s.width=w;s.height=h;layer.addChild(s);
  };
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
    const t=map.tileAt({x,y}).terrain;
    if(t==='forest'){
      const variation=(x*13+y*7)%11;
      object((x+y)%3===0?1:0,x+(variation-5)*.025,y+(variation-5)*.015,59+variation,72+variation);
    }
    if(t==='mountain'&&(x+y)%2===0)object(4,x,y,100+(x%3)*8,116+(y%3)*8);
    if(t==='wall'&&!state.find(`tower_${x}_${y}`))object((x+y)%7===0?3:7,x,y,64,(x+y)%7===0?88:60);
    if(t==='gate'&&!state.find(`gate_${x}_${y}`))object(2,x,y,64,75);
  }
  if(state.stage.id==='S1-08'){
    object(6,39,7,155,145);
    for(const [x,y] of [[33,5],[44,5],[33,16],[44,16]])if(!state.find(`tower_${x}_${y}`))object(3,x!,y!,85,118);
    for(const [x,y] of [[9,24],[11,25],[30,32]])object(0,x!,y!,65,82);
  }
  for(const region of ['camp','village']){
    const cells=map.regions.get(region);if(cells)for(const [i,at] of cells.entries())if(i%2===0)object(region==='camp'?5:6,at.x,at.y,90,94);
  }
  for(const at of map.regions.get('objective')??[]){const g=new Graphics();g.rect(at.x*48,at.y*48,48,48).fill({color:0xf5d48e,alpha:.14}).stroke({color:0xf4d493,width:2,alpha:.8});layer.addChild(g);}
  return {layer,texture,frames};
}
