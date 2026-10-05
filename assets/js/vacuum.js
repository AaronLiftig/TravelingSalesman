// Vacuum-seal construction, tension-free.
//
// A film wraps the points like a vacuum bag; pumping the air out pushes it inward
// until it rests on every point. Points are frictionless pins that only push
// outward, and each free stretch of film between two pins bows inward as a
// circular arc. When an arc reaches a free point, that point becomes a new pin
// and the stretch splits in two. The order of contact is the tour.
//
// Tension is deliberately left out. With uniform tension (Young–Laplace), every
// stretch shares one radius, so a stretch of length L only bows in by about
// L²/8R: spans between nearby points stay almost straight while long spans swing
// deep, and points beside short spans can only be reached by "snap-through",
// which physics does not resolve.
//
// Instead, every stretch bows proportionally: at any moment all stretches take
// the same arc shape, scaled to their length. An arc through A and B is fixed by
// its inscribed angle, so the film reaches first the free point P that sees its
// stretch at the widest angle APB. The rule is scale-free, so a short gap can
// only bow as far as its length allows and cannot push a thin finger out to a
// distant point. (Bowing by an equal absolute depth instead did exactly that.)
// Every point on a stretch's inner side is eventually reached, so the film never
// needs to snap through.
//
// Shared rules (modelling choices):
//   • The film cannot pass through itself: a contact that would cross the tour
//     is skipped, and that stretch continues to the next point.
//   • A free point duplicating a pin, or lying on a stretch between its pins, is
//     touched immediately.
//   • Exact ties on one stretch insert together, in order along the arc; ties
//     across stretches go to the lowest edge index, as in the other metrics.
//   • A stretch with no free point on its inner side rests against the film.
//   • If no contact is possible anywhere, the solver falls back to cheapest
//     insertion (this did not occur in testing).
// New stretches start fresh from their pins, so a contact can come "earlier"
// than the previous one; it simply happens next.

const VAC_EPS=1e-12;
const VAC_TIE=1e-9;

function vacCross(A,B,P){return(B.x-A.x)*(P.y-A.y)-(B.y-A.y)*(P.x-A.x)}

// Priority of an inner point (larger = touched sooner). h = distance to line AB > 0.
const VAC_MODELS={
  bulge(A,B,P){
    // Inscribed angle APB in (0, π); the widest angle lies under the shallowest arc shape.
    const ax=A.x-P.x,ay=A.y-P.y,bx=B.x-P.x,by=B.y-P.y;
    return Math.atan2(Math.abs(ax*by-ay*bx),ax*bx+ay*by);
  }
};

// The film cannot pass through itself: the new stretches A→p1→…→B must not
// properly cross any other tour edge.
function vacClear(points,route,edge,chain){
  const a=route[edge],b=route[(edge+1)%route.length],seq=[a,...chain,b],n=route.length;
  for(let j=0;j<n;j++){
    if(j===edge)continue;
    const u=route[j],v=route[(j+1)%n],U=points[u],V=points[v];
    for(let k=0;k+1<seq.length;k++){
      const s=seq[k],t=seq[k+1];
      if(s===u||s===v||t===u||t===v)continue;
      const S=points[s],T=points[t];
      const d1=vacCross(S,T,U),d2=vacCross(S,T,V),d3=vacCross(U,V,S),d4=vacCross(U,V,T);
      if(((d1>VAC_EPS&&d2<-VAC_EPS)||(d1<-VAC_EPS&&d2>VAC_EPS))&&((d3>VAC_EPS&&d4<-VAC_EPS)||(d3<-VAC_EPS&&d4>VAC_EPS)))return false;
    }
  }
  return true;
}

// Classify P against stretch AB: 2 = touched already (duplicate pin or on the
// stretch), 1 = inner side with a priority, -1 = not reachable from this stretch.
function vacClassify(points,A,B,L,P,prio){
  const ap=Math.hypot(P.x-A.x,P.y-A.y),pb=Math.hypot(B.x-P.x,B.y-P.y);
  if(ap<=VAC_EPS||pb<=VAC_EPS)return{cls:2,pr:-Math.min(ap,pb)};
  if(L<=VAC_EPS)return null;
  const h=vacCross(A,B,P)/L;
  if(h>VAC_EPS)return{cls:1,pr:prio(A,B,P,L,h,ap,pb)};
  const dot=(A.x-P.x)*(B.x-P.x)+(A.y-P.y)*(B.y-P.y);
  if(h>=-VAC_EPS&&dot<0)return{cls:2,pr:-ap};
  return null;
}

// Soonest contact on one stretch, skipping points in `blocked`.
function vacEdgeBest(points,route,remaining,e,blocked,prio){
  const A=points[route[e]],B=points[route[(e+1)%route.length]],L=Math.hypot(B.x-A.x,B.y-A.y);
  let best=null;
  for(const p of remaining){
    if(blocked&&blocked.has(p))continue;
    const c=vacClassify(points,A,B,L,points[p],prio);if(!c)continue;
    if(!best||c.cls>best.cls||(c.cls===best.cls&&c.pr>best.pr))best={cls:c.cls,pr:c.pr,edge:e,p,L};
  }
  return best;
}
function vacSooner(x,y){
  if(x.cls!==y.cls)return x.cls>y.cls;
  if(x.pr!==y.pr)return x.pr>y.pr;
  return x.edge<y.edge;
}
function vacTied(a,b){return Math.abs(a-b)<=VAC_TIE*Math.max(1,Math.abs(a),Math.abs(b))}

function makeVacuumMetric({id,name,model,formula,description,defaultOff=false}){
  const prio=VAC_MODELS[model];
  return{
    id,name,formula,description,defaultOff,vacuum:true,model,usesMidpoint:false,
    // Stateless score for solvers without pick support (lower = sooner); always
    // finite. The full method (self-contact, ties) runs through pick().
    score(P,A,B){
      const L=Math.hypot(B.x-A.x,B.y-A.y),c=vacClassify(null,A,B,L,P,prio);
      if(!c)return 1e6+Math.hypot(P.x-(A.x+B.x)/2,P.y-(A.y+B.y)/2);
      return c.cls===2?-1e6:-c.pr;
    },
    pick({points,route,remaining}){
      const events=[],blocked=new Map();
      for(let e=0;e<route.length;e++)events.push(vacEdgeBest(points,route,remaining,e,null,prio));
      for(;;){
        let ev=null;for(const x of events)if(x&&(!ev||vacSooner(x,ev)))ev=x;
        if(!ev)return null;                                   // nothing reachable → solver falls back
        if(ev.cls===1&&!vacClear(points,route,ev.edge,[ev.p])){
          let set=blocked.get(ev.edge);if(!set)blocked.set(ev.edge,set=new Set());
          set.add(ev.p);events[ev.edge]=vacEdgeBest(points,route,remaining,ev.edge,set,prio);continue;
        }
        let ps=[ev.p];
        const a=route[ev.edge],b=route[(ev.edge+1)%route.length],A=points[a],B=points[b];
        if(ev.cls===1){
          // Exact ties on the same arc insert together, ordered along the arc.
          const set=blocked.get(ev.edge),group=[];
          for(const q of remaining){
            if(set&&set.has(q))continue;
            const c=vacClassify(points,A,B,ev.L,points[q],prio);
            if(c&&c.cls===1&&vacTied(c.pr,ev.pr))group.push(q);
          }
          if(group.length>1){
            const M=edgeMidpoint(A,B);
            group.sort((x,y)=>edgeAngle(A,M,points[x])-edgeAngle(A,M,points[y]));
            if(vacClear(points,route,ev.edge,group))ps=group;
          }
        }
        return{edge:ev.edge,points:ps,info:{arc:ev.cls===1}};
      }
    }
  };
}

const VACUUM_VARIANTS=[
  makeVacuumMetric({id:"vacuum",name:"Vacuum",model:"bulge",
    formula:"touch first: the widest ∠APB  (every stretch bows in proportion to its length)",
    description:"A tension-free vacuum film. Every stretch bows inward into the same arc shape, scaled to its length, so the film reaches first the point that sees its stretch at the widest angle. Short spans bow as readily as long ones, but only as far as their length allows."})
];
for(const m of VACUUM_VARIANTS){metrics[m.id]=m;METRIC_ORDER.push(m.id)}
