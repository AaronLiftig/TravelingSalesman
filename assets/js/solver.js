function solve(points,metric){
  const t0=performance.now();
  const hull=convexHull(points);
  const route=hull.slice();
  const used=new Set(hull);
  const steps=[];

  while(used.size<points.length){
    let best=Infinity;
    const candidates=[];
    for(let i=0;i<route.length;i++){
      const a=route[i],b=route[(i+1)%route.length];
      const A=points[a],B=points[b],M=edgeMidpoint(A,B);
      for(let p=0;p<points.length;p++) if(!used.has(p)){
        const score=metric.score(points[p],A,B);
        if(score<best-1e-10){best=score;candidates.length=0;candidates.push({p,edge:i,a,b,M,score,angle:edgeAngle(A,M,points[p])})}
        else if(Math.abs(score-best)<=1e-10)candidates.push({p,edge:i,a,b,M,score,angle:edgeAngle(A,M,points[p])});
      }
    }
    if(!candidates.length)break;

    // If one edge has several equally-short connections, insert them together in
    // their angular order around that edge's midpoint. Otherwise insert the single winner.
    const edge=candidates[0].edge;
    const sameEdge=candidates.filter(c=>c.edge===edge).sort((a,b)=>a.angle-b.angle);
    const chosen=sameEdge.length?sameEdge:[candidates[0]];
    let insertAt=edge+1;
    const beforeA=route[edge];
    const beforeB=route[(edge+1)%route.length];
    for(const c of chosen){
      if(used.has(c.p))continue;
      route.splice(insertAt,0,c.p);
      used.add(c.p);
      steps.push({point:c.p,edgeIndex:edge,from:beforeA,to:beforeB,score:c.score,mid:c.M,angle:c.angle,route:route.slice(),connections:[[beforeA,c.p],[c.p,beforeB]]});
      insertAt++;
    }
    if(chosen.length===0)break;
  }
  return{hull,route,runtimeMs:performance.now()-t0,steps};
}


