function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function convexHull(points){
  if(points.length<3)return points.map((_,i)=>i);
  const ids=points.map((_,i)=>i).sort((i,j)=>points[i].x-points[j].x||points[i].y-points[j].y);
  const lo=[],hi=[];
  for(const i of ids){while(lo.length>1&&cross(points[lo.at(-2)],points[lo.at(-1)],points[i])<=0)lo.pop();lo.push(i)}
  for(let k=ids.length-1;k>=0;k--){const i=ids[k];while(hi.length>1&&cross(points[hi.at(-2)],points[hi.at(-1)],points[i])<=0)hi.pop();hi.push(i)}
  lo.pop();hi.pop();return lo.concat(hi);
}
function routeLength(route,points){
  if(route.length<2)return 0;
  let s=0;for(let i=0;i<route.length;i++)s+=distance(points[route[i]],points[route[(i+1)%route.length]]);
  return s;
}

