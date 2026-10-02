/** Screen-space direction; diagonals use the dominant axis (ties face vertically). */
export function troopFacing(dx:number,dy:number){
 if(dx===0&&dy===0)return {pose:0,flip:1};
 return Math.abs(dy)>=Math.abs(dx)?{pose:dy<0?6:4,flip:1}:{pose:0,flip:dx<0?-1:1};
}
export function troopWalkPose(base:number,progress:number){return base+(Math.floor(Math.max(0,Math.min(1,progress))*6)%2);}

/** Only actual positive damage triggers a physical reaction. */
export function troopReaction(hit:boolean,damage:number,guarded=false):'none'|'hurt'|'guard'{
 return !hit||damage<=0?'none':guarded?'guard':'hurt';
}
export function troopReactionPose(kind:'hurt'|'guard',progress:number){
 return (kind==='guard'?8:10)+(progress>=.5?1:0);
}

export function retreatMotion(progress:number,mechanical=false){
 const p=Math.max(0,Math.min(1,progress));
 return {alpha:1-Math.max(0,(p-.4)/.6),rotation:mechanical?Math.sin(p*Math.PI*6)*.04:Math.min(1,p/.55)*.95,drop:Math.min(1,p/.55)*(mechanical?6:14)};
}
