function rng(seed){
  let x=(seed>>>0)||1;
  return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296};
}
function generatePoints(n,seed){
  const r=rng(seed),p=[];
  for(let i=0;i<n;i++)p.push({x:.04+r()*.92,y:.04+r()*.92});
  return p;
}
