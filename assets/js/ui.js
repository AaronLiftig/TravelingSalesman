function fmt(x){return Number.isFinite(x)?x.toFixed(3):"—"}
function pct(x){return Number.isFinite(x)?(100*x).toFixed(2)+"%":"—"}
function updateMetric(){const m=metrics[metricSelect.value];$("formula").textContent=m.formula;$("metricDescription").textContent=m.description}
function log(s){$("log").innerHTML+=s+"<br>";$("log").scrollTop=$("log").scrollHeight}
function stop(){playing=false;clearTimeout(timer);timer=null}
function calculate(){
  stop();const n=Math.max(3,Math.min(20,+$("points").value||12));const seed=(+$("seed").value||1)>>>0;
  const pts=generatePoints(n,seed),metric=metrics[metricSelect.value];
  const your=solve(pts,metric),exact=heldKarp(pts),yl=routeLength(your.route,pts),el=exact?exact.length:null;
  state={points:pts,your,exact,yourLength:yl,exactLength:el,extra:el==null?null:yl-el,gap:el==null?null:(yl-el)/el,
    sameRoute:exact?JSON.stringify(your.route.slice().sort((a,b)=>a-b))===JSON.stringify(exact.route.slice().sort((a,b)=>a-b)):false};
  playback=0;$("pointsVal").textContent=n;$("log").innerHTML="";
  log(`seed=${seed}, points=${n}, hull=${your.hull.length}`);log(`metric=${metric.name}`);log(`insertion steps=${your.steps.length}`);
  if(exact)log(`optimality gap=${((yl/el-1)*100).toFixed(3)}%`);else log("Exact Held–Karp unavailable above 20 points.");
  render();play();
}
function render(){
  if(!state)return;const hull=state.your.hull;
  const step=playback>0?state.your.steps[Math.min(playback,state.your.steps.length)-1]:null;
  const visible=playback>=state.your.steps.length?state.your.route:hull;
  yourRenderer.draw(state.points,hull,visible,step,"your",true);
  if(state.exact)exactRenderer.draw(state.points,hull,state.exact.route,null,"exact",false);else exactRenderer.draw(state.points,hull,[],null,"exact",false);
  $("yourLength").textContent=fmt(state.yourLength);$("exactLength").textContent=fmt(state.exactLength);$("extra").textContent=fmt(state.extra);$("gap").textContent=pct(state.gap);
  $("yourTime").textContent=fmt(state.your.runtimeMs)+" ms";$("exactTime").textContent=state.exact?fmt(state.exact.runtimeMs)+" ms":"—";
  $("timeRatio").textContent=state.exact&&state.exact.runtimeMs>0?fmt(state.your.runtimeMs/state.exact.runtimeMs)+"×":"—";$("stepCount").textContent=state.your.steps.length;
  $("sameRoute").textContent=state.exact?(state.sameRoute?"Yes":"No"):"—";$("sameLength").textContent=state.exact?(Math.abs(state.yourLength-state.exactLength)<1e-8?"Yes":"No"):"—";
  $("yourStatus").textContent=`${playback}/${state.your.steps.length} connections`;$("exactStatus").textContent=state.exact?`Optimal length ${state.exact.length.toFixed(3)}`:"Exact route skipped";
}
function play(){if(!state||playing||playback>=state.your.steps.length)return;playing=true;tick()}
function tick(){if(!playing||!state)return;if(playback>=state.your.steps.length){stop();render();return}playback++;render();const speed=+$("speed").value;timer=setTimeout(tick,Math.max(8,210-speed*2))}
$("points").oninput=()=>$("pointsVal").textContent=$("points").value;$("run").onclick=calculate;
$("random").onclick=()=>{$("seed").value=Math.floor(Math.random()*0xffffffff);calculate()};$("pause").onclick=stop;
$("step").onclick=()=>{stop();if(!state)calculate();else{playback=Math.min(playback+1,state.your.steps.length);render()}};
$("reset").onclick=()=>{stop();playback=0;render()};$("points").onchange=calculate;$("seed").onchange=calculate;
metricSelect.onchange=()=>{updateMetric();calculate()};
addEventListener("resize",()=>render());updateMetric();calculate();
