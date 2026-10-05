// Benchmarks every metric against the Held–Karp optimum on uniform random point
// sets and runs degeneracy checks. Uses the same browser files, loaded into a
// sandbox, so results match the live page.
//
//   node tests/benchmark.js            default sizes and seed counts
//   node tests/benchmark.js 8,12 100   custom sizes and seeds per size
const vm=require("vm"),fs=require("fs"),path=require("path");
// Loaded into the main context (a separate vm context slows V8 several-fold).
for(const f of["geometry","generator","metrics","vacuum","solver","exact"])
  vm.runInThisContext(fs.readFileSync(path.join(__dirname,"../assets/js",f+".js"),"utf8"),{filename:f+".js"});
const {metrics,METRIC_ORDER,generatePoints,solve,heldKarp,routeLength,rng}=vm.runInThisContext("({metrics,METRIC_ORDER,generatePoints,solve,heldKarp,routeLength,rng})");

const sizes=(process.argv[2]||"8,12,16,20").split(",").map(Number);
const seedsFor=n=>+(process.argv[3]||(n<=16?300:40));

function segmentsCross(p1,p2,p3,p4){
  const o=(a,b,c)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
  return o(p1,p2,p3)*o(p1,p2,p4)<0&&o(p3,p4,p1)*o(p3,p4,p2)<0;
}
function selfCrossings(route,pts){
  let k=0;const n=route.length;
  for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){
    if(i===0&&j===n-1)continue;
    if(segmentsCross(pts[route[i]],pts[route[(i+1)%n]],pts[route[j]],pts[route[(j+1)%n]]))k++;
  }
  return k;
}
function validTour(route,n){
  if(route.length!==n)return false;
  const seen=new Uint8Array(n);for(const i of route){if(i<0||i>=n||seen[i])return false;seen[i]=1}return true;
}

// ---- Gap vs optimum -------------------------------------------------------------
const pctf=x=>(100*x).toFixed(2).padStart(6)+"%";
for(const n of sizes){
  const S=seedsFor(n),rows={};
  for(const id of METRIC_ORDER)rows[id]={gaps:[],opt:0,snaps:0,steps:0,fallback:0,cross:0,invalid:0,ms:0};
  for(let seed=1;seed<=S;seed++){
    const pts=generatePoints(n,seed),opt=heldKarp(pts).length;
    for(const id of METRIC_ORDER){
      const r=solve(pts,metrics[id]),row=rows[id];
      if(!validTour(r.route,n)){row.invalid++;continue}
      const len=routeLength(r.route,pts),gap=(len-opt)/opt;
      if(!Number.isFinite(len))row.invalid++;
      row.gaps.push(gap);if(gap<1e-9)row.opt++;
      row.steps+=r.steps.length;row.snaps+=r.steps.filter(s=>s.snap).length;row.fallback+=r.steps.filter(s=>s.fallback).length;
      row.cross+=selfCrossings(r.route,pts)>0?1:0;row.ms+=r.runtimeMs;
    }
  }
  console.log(`\nn = ${n}, ${S} random seeds (uniform in the unit square), gap vs Held–Karp`);
  console.log("metric".padEnd(38)+"  mean   median     p90  optimal  fallbk  crossing  invalid");
  for(const id of METRIC_ORDER){
    const r=rows[id],g=r.gaps.slice().sort((a,b)=>a-b),mean=g.reduce((a,b)=>a+b,0)/g.length;
    console.log(metrics[id].name.padEnd(36)+pctf(mean)+" "+pctf(g[Math.floor(g.length/2)])+" "+pctf(g[Math.floor(g.length*.9)])+
      String((100*r.opt/S).toFixed(0)+"%").padStart(8)+
      String(r.fallback).padStart(8)+String(r.cross).padStart(10)+String(r.invalid).padStart(9));
  }
}

// ---- Degeneracy ----------------------------------------------------------------
console.log("\nDegeneracy checks (every metric must return a complete tour with a finite length)");
const r=rng(99),cases={
  "all points identical":Array.from({length:9},()=>({x:.5,y:.5})),
  "duplicates of hull and interior points":(()=>{const p=generatePoints(12,5);return p.concat(p.slice(0,6).map(q=>({...q})))})(),
  "all collinear":Array.from({length:10},(_,i)=>({x:.1+.08*i,y:.3+.04*i})),
  "collinear interior on a line":[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1},...Array.from({length:6},(_,i)=>({x:.2+.1*i,y:.5}))],
  "points on hull edges":[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:.5,y:0},{x:1,y:.5},{x:.25,y:1},{x:.5,y:.5}],
  "5×5 grid":Array.from({length:25},(_,i)=>({x:(i%5)/4,y:Math.floor(i/5)/4})),
  "triangle only":[{x:0,y:0},{x:1,y:0},{x:.5,y:1}],
  "tight cluster plus far points":[...Array.from({length:10},()=>({x:.5+1e-9*r(),y:.5+1e-9*r()})),{x:0,y:0},{x:1,y:0},{x:.5,y:1}],
  "circle (all on hull)":Array.from({length:12},(_,i)=>({x:.5+.4*Math.cos(i),y:.5+.4*Math.sin(i)})),
  "regular circle plus center":[...Array.from({length:8},(_,i)=>({x:.5+.4*Math.cos(i*Math.PI/4),y:.5+.4*Math.sin(i*Math.PI/4)})),{x:.5,y:.5}]
};
let failures=0;
for(const [label,pts] of Object.entries(cases)){
  const bad=[];
  for(const id of METRIC_ORDER){
    let res;try{res=solve(pts,metrics[id])}catch(e){bad.push(`${id}: threw ${e.message}`);continue}
    const len=routeLength(res.route,pts);
    if(!validTour(res.route,pts.length))bad.push(`${id}: incomplete tour (${res.route.length}/${pts.length})`);
    else if(!Number.isFinite(len))bad.push(`${id}: non-finite length`);
    if(res.steps.some(s=>!Number.isFinite(s.score)))bad.push(`${id}: non-finite step score`);
    const fb=res.steps.filter(s=>s.fallback).length;if(fb&&metrics[id].vacuum)bad.push(`${id}: ${fb} fallback round(s) (allowed, reported)`);
  }
  const hard=bad.filter(b=>!b.includes("allowed"));failures+=hard.length;
  console.log(`${hard.length?"FAIL":"ok  "}  ${label}${bad.length?"\n        "+bad.join("\n        "):""}`);
}
// Stateless score() must be finite for awkward inputs.
const odd=[[{x:0,y:0},{x:0,y:0},{x:0,y:0}],[{x:.5,y:0},{x:0,y:0},{x:1,y:0}],[{x:2,y:0},{x:0,y:0},{x:1,y:0}],[{x:.5,y:-1},{x:0,y:0},{x:1,y:0}],[{x:.5,y:.1},{x:0,y:0},{x:0,y:0}]];
let nonFinite=0;for(const id of METRIC_ORDER)if(metrics[id].vacuum)for(const [P,A,B] of odd)if(!Number.isFinite(metrics[id].score(P,A,B)))nonFinite++;
console.log(`${nonFinite?"FAIL":"ok  "}  vacuum score() finite on degenerate triples (${nonFinite} non-finite)`);
// Complexity: time should grow roughly as n³.
const t=n=>{const p=generatePoints(n,3);let b=Infinity;for(let i=0;i<2;i++)b=Math.min(b,solve(p,metrics.vacuum).runtimeMs);return b};
const t1=t(150),t2=t(300),t3=t(600);
console.log(`      scaling: Vacuum 150→300→600 points: ${t1.toFixed(0)} → ${t2.toFixed(0)} → ${t3.toFixed(0)} ms (×${(t2/t1).toFixed(1)}, ×${(t3/t2).toFixed(1)}; n³ predicts ×8)`);
process.exitCode=failures||nonFinite?1:0;
