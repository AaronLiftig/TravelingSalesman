function edgeMidpoint(A,B){return{x:(A.x+B.x)/2,y:(A.y+B.y)/2}}
function edgeAngle(A,M,P){
  const ax=A.x-M.x,ay=A.y-M.y,px=P.x-M.x,py=P.y-M.y;
  const den=Math.hypot(ax,ay)*Math.hypot(px,py);
  if(!den)return 0;
  return Math.acos(Math.max(-1,Math.min(1,(ax*px+ay*py)/den)));
}

// Every metric scores an (internal point P, current tour edge AB) pair; the solver
// inserts the globally lowest-scoring pair each round. Adding a metric means adding
// an entry here and its id to METRIC_ORDER.
const metrics = {
  cheapest: {
    id:"cheapest", name:"Cheapest Insertion",
    formula:"‖A − P‖ + ‖P − B‖ − ‖A − B‖",
    description:"Classic cheapest insertion: the increase in tour length caused by inserting the internal point between A and B. Starts from the same convex hull as the other metrics.",
    score(P,A,B){
      return Math.hypot(A.x-P.x,A.y-P.y)+Math.hypot(P.x-B.x,P.y-B.y)-Math.hypot(A.x-B.x,A.y-B.y);
    }
  },
  segment: {
    id:"segment", name:"Segment Distance",
    formula:"min₀≤t≤1 ‖P − ((1−t)A + tB)‖",
    description:"Shortest Euclidean distance from the internal point to any point on the finite line segment AB, not just its midpoint.",
    score(P,A,B){
      const dx=B.x-A.x,dy=B.y-A.y;
      const l=dx*dx+dy*dy;
      const t=l?Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l)):0;
      return Math.hypot(P.x-(A.x+t*dx),P.y-(A.y+t*dy));
    }
  },
  midpoint: {
    id:"midpoint", name:"Midpoint Distance",
    formula:"‖P − M‖,  where M = (A + B) / 2",
    description:"Euclidean distance between the internal point and the midpoint of the outer-point edge.",
    usesMidpoint:true,
    score(P,A,B){
      const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
      return Math.hypot(P.x-mx,P.y-my);
    }
  },
  trig: {
    id:"trig", name:"Trig-Adjusted",
    formula:"d(P,AB) / sin(θ),  where θ = ∠(A−M, P−M)",
    description:"The original metric: perpendicular distance from the internal point to the line through AB, divided by the angle sine measured from the edge midpoint.",
    usesMidpoint:true,
    score(P,A,B){
      const dx=B.x-A.x,dy=B.y-A.y;
      const lineDen=Math.hypot(dx,dy);
      if(!lineDen)return Infinity;

      // Distance from P to the infinite line through A and B.
      const lineDistance=Math.abs(dx*(A.y-P.y)-dy*(A.x-P.x))/lineDen;

      // Original get_angle(A, midpoint, P): angle at the midpoint.
      const M={x:(A.x+B.x)/2,y:(A.y+B.y)/2};
      const ax=A.x-M.x,ay=A.y-M.y;
      const px=P.x-M.x,py=P.y-M.y;
      const den=Math.hypot(ax,ay)*Math.hypot(px,py);
      if(!den)return Infinity;
      const cosine=Math.max(-1,Math.min(1,(ax*px+ay*py)/den));
      const angle=Math.acos(cosine);
      const sine=Math.sin(angle);
      return sine<=1e-12?Infinity:lineDistance/sine;
    }
  }
};
const METRIC_ORDER=["cheapest","segment","midpoint","trig"];
