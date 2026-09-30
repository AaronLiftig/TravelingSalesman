function edgeMidpoint(A,B){return{x:(A.x+B.x)/2,y:(A.y+B.y)/2}}
function edgeAngle(A,M,P){
  const ax=A.x-M.x,ay=A.y-M.y,px=P.x-M.x,py=P.y-M.y;
  const den=Math.hypot(ax,ay)*Math.hypot(px,py);
  if(!den)return 0;
  return Math.acos(Math.max(-1,Math.min(1,(ax*px+ay*py)/den)));
}

// This is the original convex-hull/midpoint insertion idea expressed without ES modules.
// Each round finds the globally shortest metric from an unconnected inner point to a
// current edge. Equal minima on the same edge are resolved together in angular order,
// matching the original project's multi-connection idea.
