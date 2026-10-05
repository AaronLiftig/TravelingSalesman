// Convex-hull insertion. Each round finds the globally shortest metric from an
// unconnected inner point to a current edge. Equal minima on the same edge are
// resolved together in angular order, matching the original project's
// multi-connection idea.
//
// Optional metric hooks (existing metrics define neither and are unaffected):
//   init(points, hull) → state           called once before the first round
//   pick({points, route, remaining, state})
//       → {edge, points:[p, ...], info} | null
//     Chooses this round's edge and point(s) in insertion order; info is copied
//     onto each step. Returning null falls back to cheapest insertion.
//   meta(state) → object                 extra data returned with the result
//
// The solver never returns an incomplete tour: if a metric yields no usable
// candidate, the round is decided by cheapest insertion and flagged fallback.
//
// Written as a generator that yields after every round so the UI can run several
// metrics in time slices, show real progress and stay responsive. Each round is
// O(edges × remaining points), so a full solve stays O(n³).

function cheapestInsertionScore(P,A,B){
  return Math.hypot(A.x-P.x,A.y-P.y)+Math.hypot(P.x-B.x,P.y-B.y)-Math.hypot(A.x-B.x,A.y-B.y);
}

// Global minimum of score over (edge, remaining point); same-edge ties sorted by
// angle around the edge midpoint. Returns null when no score is comparable.
function scanBest(points,route,remaining,score){
  let best=Infinity;
  const candidates=[];
  for(let i=0;i<route.length;i++){
    const a=route[i],b=route[(i+1)%route.length];
    const A=points[a],B=points[b];
    for(let r=0;r<remaining.length;r++){
      const p=remaining[r];
      const s=score(points[p],A,B);
      if(s<best-1e-10){best=s;candidates.length=0;candidates.push({p,edge:i,a,b,score:s})}
      else if(Math.abs(s-best)<=1e-10)candidates.push({p,edge:i,a,b,score:s});
    }
  }
  if(!candidates.length)return null;
  const edge=candidates[0].edge;
  const sameEdge=candidates.filter(c=>c.edge===edge);
  for(const c of sameEdge){
    const A=points[c.a],B=points[c.b];
    c.M=edgeMidpoint(A,B);c.angle=edgeAngle(A,c.M,points[c.p]);
  }
  sameEdge.sort((x,y)=>x.angle-y.angle);
  return{edge,chosen:sameEdge};
}

function* solveSteps(points,metric){
  const hull=convexHull(points);
  const route=hull.slice();
  const onHull=new Uint8Array(points.length);
  for(const h of hull)onHull[h]=1;
  // Unconnected points in ascending index order (same scan order as before).
  const remaining=[];
  for(let p=0;p<points.length;p++)if(!onHull[p])remaining.push(p);
  const interior=remaining.length;
  const steps=[];
  const state=metric.init?metric.init(points,hull):null;

  while(remaining.length){
    let edge=-1,chosen=null,info=null,fallback=false;
    if(metric.pick){
      const pk=metric.pick({points,route,remaining,state});
      if(pk&&pk.points.length&&pk.edge>=0&&pk.edge<route.length){
        edge=pk.edge;info=pk.info||null;
        chosen=pk.points.map(p=>({p,score:info&&Number.isFinite(info.t)?info.t:0}));
      }
    }else{
      const r=scanBest(points,route,remaining,metric.score);
      if(r){edge=r.edge;chosen=r.chosen}
    }
    if(!chosen){
      const r=scanBest(points,route,remaining,cheapestInsertionScore);
      edge=r.edge;chosen=r.chosen;fallback=true;info=null;
    }

    let insertAt=edge+1;
    const beforeA=route[edge];
    const beforeB=route[(edge+1)%route.length];
    const inserted=new Set();
    for(const c of chosen){
      if(inserted.has(c.p))continue;
      route.splice(insertAt,0,c.p);
      inserted.add(c.p);
      const step={point:c.p,edgeIndex:edge,from:beforeA,to:beforeB,score:c.score,mid:c.M,angle:c.angle,connections:[[beforeA,c.p],[c.p,beforeB]]};
      if(info)Object.assign(step,info);
      if(fallback)step.fallback=true;
      steps.push(step);
      insertAt++;
    }
    for(let r=remaining.length-1;r>=0;r--)if(inserted.has(remaining[r]))remaining.splice(r,1);
    yield{done:interior-remaining.length,total:interior};
  }
  return{hull,route,steps,meta:metric.meta&&state?metric.meta(state):null};
}

// Synchronous convenience wrapper (used for calibration and tests).
function solve(points,metric){
  const t0=performance.now();
  const it=solveSteps(points,metric);let r;
  while(!(r=it.next()).done);
  return{...r.value,runtimeMs:performance.now()-t0};
}
