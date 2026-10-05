const $=id=>document.getElementById(id);
const EXACT="exact";
const TARGET_MS=10000;        // warn before runs expected to take longer than this
const AUTO_RUN_MS=3000;       // changing a control re-runs automatically only below this
const PROGRESS_DELAY_MS=1000; // computations faster than this show no progress UI
const ANIMATE_MAX_POINTS=30;  // above this, results open on the final tour (Play still animates)

const selected=new Set(METRIC_ORDER.filter(id=>!metrics[id].defaultOff));
const panels={};
// Results for the current points (n + seed) are cached per metric, so toggling a
// metric back on, or adding one, never recomputes the others or Held–Karp.
let cache={key:null,results:{},exact:undefined};
let state=null,runId=0,playback=0,playing=false,timer=null,progressTimer=null;

function fmt(x){return Number.isFinite(x)?x.toFixed(3):"—"}
function pct(x){return Number.isFinite(x)?(100*x).toFixed(2)+"%":"—"}
function ms(x){return Number.isFinite(x)?fmt(x)+" ms":"—"}
function secs(x){return x<1000?"under 1 s":"about "+(x/1000).toFixed(x<10000?1:0)+" s"}
function log(s){const el=$("log");el.insertAdjacentHTML("beforeend",s+"<br>");el.scrollTop=el.scrollHeight}
function stop(){playing=false;clearTimeout(timer);timer=null;$("playPause").textContent="Play"}
function readN(){const n=Math.floor(+$("points").value);return Number.isFinite(n)?Math.max(3,Math.min(n,currentLimit())):3}
function currentLimit(){return pointLimit(selectedIds(),TARGET_MS)}
function readSeed(){return(+$("seed").value||1)>>>0}
function selectedIds(){return METRIC_ORDER.filter(id=>selected.has(id))}

// ---- Controls -----------------------------------------------------------------

function buildMetricList(){
  for(const id of METRIC_ORDER){
    const m=metrics[id],row=document.createElement("div");
    row.className="metric-row";
    row.innerHTML=`<label class="check"><input type="checkbox" checked><span></span></label>
      <button type="button" class="info" aria-expanded="false" aria-controls="more-${id}">Formula</button>
      <div class="more" id="more-${id}" hidden><div class="formula"></div><div class="desc"></div></div>`;
    row.querySelector("span").textContent=m.name;
    row.querySelector(".formula").textContent=m.formula;
    row.querySelector(".desc").textContent=m.description;
    const box=row.querySelector("input"),info=row.querySelector(".info"),more=row.querySelector(".more");
    box.checked=selected.has(id);
    box.dataset.id=id;
    box.onchange=()=>{box.checked?selected.add(id):selected.delete(id);onSelectionChange()};
    info.onclick=()=>{const open=more.hidden;more.hidden=!open;info.setAttribute("aria-expanded",open)};
    $("metricList").append(row);
  }
}
function setAllMetrics(on){
  for(const box of $("metricList").querySelectorAll("input")){box.checked=on;on?selected.add(box.dataset.id):selected.delete(box.dataset.id)}
  onSelectionChange();
}
function onSelectionChange(){updateEstimate();calculate({auto:true})}

function syncPoints(n){$("points").value=n;$("pointsRange").value=Math.min(n,+$("pointsRange").max)}

// Everything needed to decide whether (and how expensively) to run.
function plan(){
  const n=readN(),seed=readSeed(),points=generatePoints(n,seed),hull=convexHull(points);
  const key=`${n}:${seed}`,reuse=cache.key===key,ids=selectedIds();
  const todo=ids.filter(id=>!(reuse&&cache.results[id]));
  const needExact=n<=HELD_KARP_LIMIT&&!(reuse&&cache.exact);
  return{n,seed,points,hull,key,ids,todo,needExact,ms:estimateMs(n,hull.length,todo,needExact)};
}

function updateEstimate(){
  const p=plan(),ids=p.ids,el=$("estimate");
  const limit=currentLimit(),typed=Math.floor(+$("points").value);
  $("pointsRange").max=limit;$("points").max=limit;
  $("pointsRange").value=Math.min(p.n,limit);
  if(!ids.length){el.textContent="Select at least one metric.";return}
  const full=estimateMs(p.n,p.hull.length,ids,true);
  el.innerHTML=`Estimated time: <b>${secs(full)}</b>, including the exact optimum.<br>`+
    `Limit: <b>${limit}</b> points, so every result has an exact baseline. `+limitReason(limit)+
    (typed>limit?`<br><span class="warn">${typed} is above the limit; using ${limit}.</span>`:"");
}

// Says which constraint sets the limit: Held–Karp's memory or the time target.
function limitReason(limit){
  let byTime=3;while(byTime<40&&heldKarpCostMs(byTime+1)<=TARGET_MS)byTime++;
  if(limit>=HK_MEMORY_LIMIT&&byTime>HK_MEMORY_LIMIT)
    return `Held–Karp's memory is the constraint on this device (${limit} points needs about ${Math.round(heldKarpBytes(limit)/1e6)} MB); time alone would allow about ${byTime}.`;
  return `That is the most the exact solver and the selected metrics can finish in about ${TARGET_MS/1000} s on this device.`;
}

function showWarning(p){
  const extra=p.n>HELD_KARP_LIMIT?` Held–Karp will be skipped (exact-solver limit is ${HELD_KARP_LIMIT} points).`:"";
  $("warningText").textContent=`This run is estimated to take ${secs(p.ms)} for ${p.ids.length} metric${p.ids.length>1?"s":""} on ${p.n.toLocaleString()} points, above the ${TARGET_MS/1000} s target.${extra} The page stays responsive and you can cancel it.`;
  $("warning").hidden=false;
}
function hideWarning(){$("warning").hidden=true}

// ---- Running ------------------------------------------------------------------

function calculate({auto=false,confirmed=false}={}){
  stop();hideWarning();$("runHint").hidden=true;
  const p=plan();syncPoints(p.n);
  if(!p.ids.length){cancelRun(false);state=null;render();return}
  // An auto-run for exactly what is already shown (e.g. a repeated change event) is a no-op.
  if(auto&&state&&!state.computing&&!state.cancelled&&!state.stale&&state.key===p.key&&state.ids.join()===p.ids.join())return;
  if(auto&&p.ms>AUTO_RUN_MS){
    if(state&&state.key!==p.key){state.stale=true;render()}
    $("runHint").hidden=false;
    return;
  }
  if(!confirmed&&p.ms>TARGET_MS){showWarning(p);return}
  start(p);
}

function start(p){
  const my=++runId,{n,seed,points,hull,key,ids}=p;
  if(cache.key!==key)cache={key,results:{},exact:undefined};
  if(n>HELD_KARP_LIMIT)cache.exact=null;
  state={key,n,seed,points,hull,ids,runs:{},exact:null,computing:true,cancelled:false,stale:false,tasks:[]};
  playback=0;rebuildRuns();

  const tasks=p.todo.map(id=>({id,label:metrics[id].name,weight:metricCostMs(id,n,hull.length),status:"queued",start:()=>solveSteps(points,metrics[id])}));
  if(p.needExact)tasks.push({id:EXACT,label:"Held–Karp",weight:heldKarpCostMs(n),status:"queued",start:()=>heldKarpSteps(points)});
  state.tasks=tasks;
  buildProgress(p,tasks);

  $("log").innerHTML="";
  log(`seed=${seed}, points=${n}, hull=${hull.length}`);
  log(`metrics: ${ids.map(id=>metrics[id].name).join(", ")}`);
  const reused=ids.length-p.todo.length;
  if(reused)log(`reused ${reused} result${reused>1?"s":""} for the same points`);
  render();

  clearTimeout(progressTimer);
  progressTimer=setTimeout(()=>{if(my===runId&&state.computing)$("progress").hidden=false},PROGRESS_DELAY_MS);
  const t0=performance.now();
  runTasks(tasks,{
    isCancelled:()=>my!==runId,
    onUpdate:task=>{
      if(my!==runId)return;
      if(task.status==="running"&&!task.announced){task.announced=true;render()}
      if(task.status==="done"){
        const r={...task.result,runtimeMs:task.activeMs};
        if(task.id===EXACT)cache.exact=task.result?r:null;else cache.results[task.id]=r;
        rebuildRuns();render();
      }
      updateProgress();
    }
  }).then(done=>{
    if(!done||my!==runId)return;
    clearTimeout(progressTimer);$("progress").hidden=true;
    state.computing=false;rebuildRuns();logResults(performance.now()-t0);updateEstimate();
    if(state.n<=ANIMATE_MAX_POINTS){render();play()}else{playback=maxSteps();render()}
  }).catch(err=>{
    console.error(err);if(my!==runId)return;
    clearTimeout(progressTimer);$("progress").hidden=true;state.computing=false;
    log(`error: ${err.message}`);render();
  });
}

function cancelRun(userInitiated=true){
  runId++;clearTimeout(progressTimer);$("progress").hidden=true;
  if(state&&state.computing){state.computing=false;state.cancelled=true;if(userInitiated)log("computation cancelled")}
  render();
}

// Derive per-metric comparisons from cached results for the current points.
function rebuildRuns(){
  const ex=cache.exact||null;state.exact=ex;state.runs={};
  for(const id of state.ids){
    const res=cache.results[id];if(!res)continue;
    const length=routeLength(res.route,state.points),el=ex?ex.length:null;
    state.runs[id]={result:res,length,
      extra:el==null?null:length-el,gap:el==null?null:(length-el)/el,
      sameRoute:ex?sameTour(res.route,ex.route):null,sameLength:ex?Math.abs(length-el)<1e-8:null};
  }
}

function logResults(totalMs){
  for(const id of rankedIds()){const st=state.runs[id].result.steps,fb=st.filter(s=>s.fallback).length;
    log(`${metrics[id].name}: ${fmt(state.runs[id].length)}${state.exact?` (gap ${pct(state.runs[id].gap)})`:""}, ${st.length} steps${fb?`, ${fb} fallback`:""}`)}
  if(state.exact)log(`Held–Karp optimum: ${fmt(state.exact.length)}`);
  else if(state.n>HELD_KARP_LIMIT)log(`Held–Karp skipped: ${state.n} points exceeds exact-solver limit (${HELD_KARP_LIMIT})`);
  log(`total wall time ${fmt(totalMs)} ms`);
}

// ---- Progress (driven by completed work reported by the solvers) ---------------

function buildProgress(p,tasks){
  $("progressSub").textContent=`Running ${p.ids.length} metric${p.ids.length>1?"s":""} on ${p.n.toLocaleString()} points`;
  const list=$("progressList");list.innerHTML="";
  const add=(id,label,st,cls="")=>{const li=document.createElement("li");li.dataset.id=id;li.className=cls;li.innerHTML=`<span></span><span class="st"></span>`;li.firstChild.textContent=label;li.lastChild.textContent=st;list.append(li)};
  for(const id of p.ids)add(id,metrics[id].name,tasks.some(t=>t.id===id)?"…":"✓ reused",tasks.some(t=>t.id===id)?"":"done");
  if(p.n>HELD_KARP_LIMIT)add(EXACT,"Held–Karp","— skipped","exact");
  else add(EXACT,"Held–Karp",p.needExact?"…":"✓ reused",p.needExact?"exact":"exact done");
  updateProgress();
}
function updateProgress(){
  if(!state)return;
  let total=0,done=0;
  for(const t of state.tasks){
    const frac=t.status==="done"?1:t.status==="running"&&t.progress?t.progress.done/Math.max(1,t.progress.total):0;
    total+=t.weight;done+=t.weight*frac;
    const li=$("progressList").querySelector(`li[data-id="${t.id}"]`);if(!li)continue;
    li.classList.toggle("running",t.status==="running");li.classList.toggle("done",t.status==="done");
    li.lastChild.textContent=t.status==="done"?"✓":t.status==="running"?Math.floor(100*frac)+"%":"…";
  }
  $("progressBar").style.width=(total?100*done/total:0)+"%";
}

// ---- Display ------------------------------------------------------------------

function buildPanels(){
  const stat=(label,k)=>`<div><dt>${label}</dt><dd data-k="${k}">—</dd></div>`;
  for(const id of [...METRIC_ORDER,EXACT]){
    const exact=id===EXACT,el=document.createElement("article");
    el.className="panel"+(exact?" exact":"");
    el.innerHTML=`<header class="panel-head"><h2><span></span><span class="badge" hidden>Best</span></h2>
      <div class="headline"><span><small>Length</small><b data-k="length">—</b></span><span><small>${exact?"Result":"Gap"}</small><b data-k="${exact?"result":"gap"}">—</b></span></div></header>
      <div class="canvas-wrap"><canvas></canvas><div class="status">Ready</div></div>
      <dl class="stats">${exact?stat("Runtime","runtime")+stat("Points","n")+stat("Solver limit","limit")
        :stat("Extra length","extra")+stat("Runtime","runtime")+stat("Runtime vs exact","ratio")+stat("Insertion steps","steps")+stat("Same tour?","sameRoute")+stat("Same length?","sameLength")}</dl>`;
    el.querySelector("h2 span").textContent=exact?"Held–Karp (exact)":metrics[id].name;
    $("results").append(el);
    panels[id]={el,renderer:new Renderer(el.querySelector("canvas")),status:el.querySelector(".status"),badge:el.querySelector(".badge"),
      set(k,v){const d=el.querySelector(`[data-k="${k}"]`);if(d)d.textContent=v}};
  }
}

function rankedIds(){
  if(!state)return[];
  return state.ids.filter(id=>state.runs[id]).sort((a,b)=>state.runs[a].length-state.runs[b].length);
}
function bestIds(){
  if(!state||state.computing)return[];
  const ids=state.ids.filter(id=>selected.has(id)&&state.runs[id]);if(!ids.length)return[];
  const min=Math.min(...ids.map(id=>state.runs[id].length));
  return ids.filter(id=>state.runs[id].length-min<=1e-9);
}
function visibleIds(){
  const ids=selectedIds(),mode=$("display").value;
  if(mode==="one"){const v=$("displayOne").value;return ids.includes(v)?[v]:ids.slice(0,1)}
  if(mode==="best"){const b=bestIds();return b.length?b:ids}
  return ids;
}
function updateDisplayOne(){
  const sel=$("displayOne"),ids=selectedIds(),cur=sel.value;
  sel.hidden=$("display").value!=="one";
  if([...sel.options].map(o=>o.value).join()!==ids.join()){
    sel.innerHTML="";for(const id of ids)sel.add(new Option(metrics[id].name,id));
    if(ids.includes(cur))sel.value=cur;
  }
}
function maxSteps(){return state?Math.max(0,...Object.values(state.runs).map(r=>r.result.steps.length)):0}

function render(){
  updateDisplayOne();
  const any=selected.size>0,vis=new Set(visibleIds()),best=new Set(selectedIds().length>1?bestIds():[]);
  $("empty").hidden=any;
  for(const id of METRIC_ORDER){
    const p=panels[id],show=any&&vis.has(id);
    p.el.hidden=!show;
    p.el.classList.toggle("best",best.has(id));p.badge.hidden=!best.has(id);
    p.el.classList.toggle("stale",!!state?.stale);
    if(show)renderMetric(id);
  }
  panels[EXACT].el.hidden=!any;panels[EXACT].el.classList.toggle("stale",!!state?.stale);
  if(any)renderExact();
  renderSidebar();
}

function pendingText(id){
  if(state.cancelled)return"Cancelled — press Generate & Solve";
  const t=state.tasks.find(t=>t.id===id);
  if(t&&t.status==="running")return"Computing…";
  return state.computing?"Waiting…":"Not computed";
}

// Tour after the first `count` insertions. Each step inserts its point just before
// `to`, which also keeps same-edge groups in their inserted order.
function partialRoute(hull,steps,count){
  const r=hull.slice();
  for(let i=0;i<count;i++){const s=steps[i],j=r.indexOf(s.to);r.splice(j<0?r.length:j,0,s.point)}
  return r;
}

function renderMetric(id){
  const p=panels[id];
  const blank=()=>{for(const k of["length","gap","extra","runtime","ratio","steps","sameRoute","sameLength"])p.set(k,"—")};
  if(!state){p.renderer.draw([],[],[]);blank();p.status.textContent="Ready";return}
  const run=state.runs[id];
  const mids=!!metrics[id].usesMidpoint;
  if(!run){p.renderer.draw(state.points,state.hull,[],null,"your",mids);blank();p.status.textContent=pendingText(id);return}
  const steps=run.result.steps,len=steps.length,k=Math.min(playback,len);
  const done=playback>=len,step=!done&&k>0?steps[k-1]:null,route=done?run.result.route:partialRoute(state.hull,steps,k-1);
  p.renderer.draw(state.points,state.hull,route,step,"your",mids);
  const ex=state.exact,skipped=state.n>HELD_KARP_LIMIT;
  p.set("length",fmt(run.length));
  p.set("gap",ex?pct(run.gap):skipped?"n/a":"…");
  p.set("extra",ex?fmt(run.extra):"—");
  p.set("runtime",ms(run.result.runtimeMs));
  p.set("ratio",ex&&ex.runtimeMs>0?fmt(run.result.runtimeMs/ex.runtimeMs)+"×":"—");
  p.set("steps",len);
  p.set("sameRoute",ex?(run.sameRoute?"Yes":"No"):"—");
  p.set("sameLength",ex?(run.sameLength?"Yes":"No"):"—");
  p.status.textContent=done?`Final tour · ${len} insertion${len===1?"":"s"}`:`${k}/${len} connections`;
}

function renderExact(){
  const p=panels[EXACT];
  p.set("limit",`${HELD_KARP_LIMIT} points`);
  if(!state){p.renderer.draw([],[],[],null,"exact",false);p.set("length","—");p.set("result","—");p.set("runtime","—");p.set("n","—");p.status.textContent="Ready";return}
  p.set("n",state.n.toLocaleString());
  if(state.n>HELD_KARP_LIMIT||(cache.exact===null&&!state.computing)){
    p.renderer.draw(state.points,state.hull,[],null,"exact",false);
    p.set("length","—");p.set("result","Unavailable");p.set("runtime","—");
    p.status.textContent=state.n>HELD_KARP_LIMIT?`Skipped — ${state.n} points exceeds exact-solver limit (${HELD_KARP_LIMIT})`:"Unavailable — the browser could not allocate enough memory";
  }else if(state.exact){
    p.renderer.draw(state.points,state.hull,state.exact.route,null,"exact",false);
    p.set("length",fmt(state.exact.length));p.set("result","Optimal");p.set("runtime",ms(state.exact.runtimeMs));
    p.status.textContent=`Optimal length ${state.exact.length.toFixed(3)}`;
  }else{
    p.renderer.draw(state.points,state.hull,[],null,"exact",false);
    p.set("length","—");p.set("result","—");p.set("runtime","—");p.status.textContent=pendingText(EXACT);
  }
}

function renderSidebar(){
  const ex=state?.exact,skipped=state&&state.n>HELD_KARP_LIMIT;
  $("exactLength").textContent=ex?fmt(ex.length):skipped?"Skipped":"—";
  $("exactTime").textContent=ex?ms(ex.runtimeMs):"—";
  $("pointCount").textContent=state?state.n.toLocaleString():"—";
  $("hullCount").textContent=state?state.hull.length:"—";
  const body=$("ranking").tBodies[0];body.innerHTML="";
  const ids=rankedIds().filter(id=>selected.has(id)),best=new Set(bestIds());
  if(!ids.length){body.innerHTML=`<tr><td class="muted">No results yet</td></tr>`;return}
  ids.forEach((id,i)=>{
    const r=state.runs[id],tr=body.insertRow();if(best.has(id))tr.className="top";
    tr.insertCell().textContent=i+1;tr.insertCell().textContent=metrics[id].name;
    tr.insertCell().textContent=fmt(r.length);tr.insertCell().textContent=ex?pct(r.gap):"—";
  });
}

// ---- Playback (all panels advance together) -------------------------------------

function play(){
  if(!state||playing||!maxSteps())return;
  if(playback>=maxSteps())playback=0; // Play from the final tour replays from the hull
  playing=true;$("playPause").textContent="Pause";tick()
}
function tick(){
  if(!playing||!state)return;
  if(playback>=maxSteps()){stop();render();return}
  playback++;render();
  const speed=+$("speed").value;timer=setTimeout(tick,Math.max(8,210-speed*2));
}

// ---- Wiring -------------------------------------------------------------------

$("pointsRange").oninput=()=>{$("points").value=$("pointsRange").value;updateEstimate()};
$("pointsRange").onchange=()=>calculate({auto:true});
$("points").oninput=()=>updateEstimate();
$("points").onchange=()=>calculate({auto:true});
$("seed").onchange=()=>{updateEstimate();calculate({auto:true})};
$("run").onclick=()=>calculate();
$("random").onclick=()=>{$("seed").value=Math.floor(Math.random()*0xffffffff);updateEstimate();calculate()};
$("runAnyway").onclick=()=>calculate({confirmed:true});
$("cancelWarning").onclick=hideWarning;
$("cancelRun").onclick=()=>cancelRun(true);
$("selectAll").onclick=()=>setAllMetrics(true);
$("selectNone").onclick=()=>setAllMetrics(false);
$("display").onchange=render;
$("displayOne").onchange=render;
$("playPause").onclick=()=>playing?stop():play();
$("step").onclick=()=>{stop();if(!state)calculate();else{playback=Math.min(playback+1,maxSteps());render()}};
$("reset").onclick=()=>{stop();playback=0;render()};
$("skip").onclick=()=>{stop();playback=maxSteps();render()};
let resizeQueued=false;
addEventListener("resize",()=>{if(resizeQueued)return;resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;render()})});

buildMetricList();buildPanels();calibrate(TARGET_MS);updateEstimate();calculate({auto:true});
