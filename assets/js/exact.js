// Held–Karp exact solver: O(2ⁿ·n²) time, O(2ⁿ·n) memory.
//
// Every run needs an optimal baseline, so the point limit for the whole app is
// the largest n this solver can finish within the time target on this device
// (set by the scheduler's calibration) and within a memory budget. Memory per
// (subset, last point) state: 8-byte length + 1-byte parent.
const HK_BYTES_PER_STATE=9;
function heldKarpBytes(n){return n<2?0:Math.pow(2,n-1)*(n-1)*HK_BYTES_PER_STATE}
const HK_MEMORY_BUDGET=(typeof navigator!=="undefined"&&navigator.deviceMemory&&navigator.deviceMemory<=4)?220e6:420e6;
const HK_MEMORY_LIMIT=(()=>{let n=2;while(heldKarpBytes(n+1)<=HK_MEMORY_BUDGET)n++;return n})();
// Lowered by calibrate() to what fits in the time target.
let HELD_KARP_LIMIT=HK_MEMORY_LIMIT;

function* heldKarpSteps(points){
  const n=points.length;if(n>HK_MEMORY_LIMIT)return null;
  if(n===1)return{length:0,route:[0]};
  const D=new Float64Array(n*n);
  for(let a=0;a<n;a++)for(let b=0;b<n;b++)D[a*n+b]=distance(points[a],points[b]);
  const m=n-1,N=1<<m;
  let dp,par;
  try{dp=new Float64Array(N*m);par=new Int8Array(N*m)}catch(e){return null}   // allocation refused
  dp.fill(Infinity);par.fill(-1);
  for(let j=0;j<m;j++)dp[(1<<j)*m+j]=D[j+1];
  for(let mask=1;mask<N;mask++){
    if((mask&2047)===0)yield{done:mask,total:N};
    // Visit only set bits, in ascending order (same tie-breaking as a full scan).
    for(let jb=mask;jb;jb&=jb-1){
      const j=31-Math.clz32(jb&-jb),prev=mask^(1<<j);if(!prev)continue;
      let best=Infinity,bp=-1;
      const row=(j+1)*n+1,base=prev*m;
      for(let kb=prev;kb;kb&=kb-1){const k=31-Math.clz32(kb&-kb),v=dp[base+k]+D[row+k];if(v<best){best=v;bp=k}}
      dp[mask*m+j]=best;par[mask*m+j]=bp;
    }
  }
  const full=N-1;let best=Infinity,last=-1;
  for(let j=0;j<m;j++){const v=dp[full*m+j]+D[(j+1)*n];if(v<best){best=v;last=j}}
  const rev=[];let mask=full,j=last;
  while(j>=0){rev.push(j+1);const p=par[mask*m+j];mask^=1<<j;if(p<0)break;j=p}
  rev.reverse();
  return{length:best,route:[0,...rev]};
}

function heldKarp(points){
  const t0=performance.now();
  const it=heldKarpSteps(points);let r;
  while(!(r=it.next()).done);
  return r.value&&{...r.value,runtimeMs:performance.now()-t0};
}
