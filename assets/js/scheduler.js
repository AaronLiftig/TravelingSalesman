// Runs solver generators in short time slices so the browser can repaint between
// them. Progress comes from the generators themselves (rounds completed, subsets
// processed), never from a timer.

const yieldToBrowser=(()=>{
  const ch=new MessageChannel(),queue=[];
  ch.port1.onmessage=()=>queue.shift()();
  return()=>new Promise(resolve=>{queue.push(resolve);ch.port2.postMessage(0)});
})();

// tasks: [{start:()=>generator, status, progress, result, activeMs}]
// Resolves true when every task finished, false if cancelled.
// activeMs counts only time spent computing, not time spent yielded to the browser.
async function runTasks(tasks,{sliceMs=12,isCancelled=()=>false,onUpdate=()=>{}}={}){
  for(const task of tasks){
    task.status="running";task.activeMs=0;onUpdate(task);
    const it=task.start();
    for(;;){
      const t0=performance.now();let r;
      do{r=it.next();if(!r.done&&r.value)task.progress=r.value}
      while(!r.done&&performance.now()-t0<sliceMs);
      task.activeMs+=performance.now()-t0;
      if(r.done){task.result=r.value;break}
      onUpdate(task);
      await yieldToBrowser();
      if(isCancelled())return false;
    }
    task.status="done";onUpdate(task);
    await yieldToBrowser();
    if(isCancelled())return false;
  }
  return true;
}

// ---- Cost model -------------------------------------------------------------
// Insertion does Σ (tour edges × remaining points) metric evaluations; Held–Karp
// (m = n−1) does m(m−1)·2^(m−2) inner steps plus per-subset overhead. Per-step costs are measured
// once on this device at startup, so estimates reflect the actual browser.

const PerfModel={evalMs:{},hkOpMs:0};

function insertionEvals(n,hullSize){
  let s=0;for(let k=hullSize;k<n;k++)s+=k*(n-k);return s;
}
function heldKarpOps(n){
  if(n<2)return 0;
  const m=n-1;return m*(m-1)*Math.pow(2,m-2)+4*Math.pow(2,m);
}
function metricCostMs(id,n,hullSize){return(PerfModel.evalMs[id]||0)*insertionEvals(n,hullSize)}
function heldKarpCostMs(n){return PerfModel.hkOpMs*heldKarpOps(n)}
function estimateMs(n,hullSize,metricIds,includeExact){
  let ms=0;for(const id of metricIds)ms+=metricCostMs(id,n,hullSize);
  return ms+(includeExact?heldKarpCostMs(n):0);
}
// Largest point count whose heuristic run alone is expected to fit within
// targetMs (used for reference; the app's point limit is pointLimit()). Uses the expected hull size of
// uniformly random points, ≈ (8/3)·ln n.
function practicalPointLimit(metricIds,targetMs){
  if(!metricIds.length)return 0;
  const cost=n=>estimateMs(n,Math.max(3,Math.round(8/3*Math.log(n))),metricIds,false);
  let lo=3,hi=50000;
  if(cost(hi)<=targetMs)return hi;
  while(hi-lo>1){const mid=(lo+hi)>>1;cost(mid)<=targetMs?lo=mid:hi=mid}
  return lo;
}

// The app's point limit: the largest n whose full run — Held–Karp plus every
// selected metric — is expected to fit within targetMs, never above what
// Held–Karp can hold in memory. Every run therefore has an exact baseline.
function pointLimit(metricIds,targetMs){
  let n=3;
  while(n<HELD_KARP_LIMIT&&estimateMs(n+1,Math.max(3,Math.round(8/3*Math.log(n+1))),metricIds,true)<=targetMs)n++;
  return n;
}

function calibrate(targetMs){
  const pts=generatePoints(140,987654321),evals=insertionEvals(140,convexHull(pts).length);
  for(const id of METRIC_ORDER){
    let best=Infinity;
    for(let r=0;r<3;r++)best=Math.min(best,solve(pts,metrics[id]).runtimeMs);
    PerfModel.evalMs[id]=Math.max(best,0.05)/evals;
  }
  // Held–Karp is timed at 17 points (≈1/30 s), large enough that its memory
  // access pattern resembles the big runs it predicts.
  heldKarp(generatePoints(12,4242));
  const hn=Math.min(17,HK_MEMORY_LIMIT),hp=generatePoints(hn,4242);
  PerfModel.hkOpMs=Math.max(heldKarp(hp).runtimeMs,0.05)/heldKarpOps(hn);
  while(HELD_KARP_LIMIT>3&&heldKarpCostMs(HELD_KARP_LIMIT)>targetMs)HELD_KARP_LIMIT--;
}
