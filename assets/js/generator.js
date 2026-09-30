function rng(seed){
  let x=(seed>>>0)||1;
  return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296};
}
function generatePoints(n,seed){
  const r=rng(seed),p=[];
  for(let i=0;i<n;i++)p.push({x:.04+r()*.92,y:.04+r()*.92});
  return p;
}

const metrics = {
  trig: {
    id:"trig", name:"Trig-Adjusted Line Distance",
    formula:"d(P,AB) / sin(θ),  where θ = ∠(A−M, P−M)",
    description:"The original metric: perpendicular distance from the internal point to the line through AB, divided by the angle sine measured from the edge midpoint.",
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
  },
  midpoint: {
    id:"midpoint", name:"Midpoint Distance",
    formula:"‖P − M‖,  where M = (A + B) / 2",
    description:"Euclidean distance: Euclidean distance between the internal point and the midpoint of the outer-point edge.",
    score(P,A,B){
      const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
      return Math.hypot(P.x-mx,P.y-my);
    }
  },
  segment: {
    id:"segment", name:"Shortest Segment Distance (Additional Metric)",
    formula:"min₀≤t≤1 ‖P − ((1−t)A + tB)‖",
    description:"Shortest Euclidean distance from the internal point to any point on the finite line segment AB, not just its midpoint.",
    score(P,A,B){
      const dx=B.x-A.x,dy=B.y-A.y;
      const l=dx*dx+dy*dy;
      const t=l?Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l)):0;
      return Math.hypot(P.x-(A.x+t*dx),P.y-(A.y+t*dy));
    }
  }
};

