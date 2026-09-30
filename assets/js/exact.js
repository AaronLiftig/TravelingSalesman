function heldKarp(points){
  const t0=performance.now();
  const n=points.length;if(n>20)return null;
  if(n===1)return{length:0,route:[0],runtimeMs:performance.now()-t0};
  const m=n-1,N=1<<m,dp=new Float64Array(N*m),par=new Int16Array(N*m);
  dp.fill(Infinity);par.fill(-1);
  for(let j=0;j<m;j++)dp[(1<<j)*m+j]=distance(points[0],points[j+1]);
  for(let mask=1;mask<N;mask++)for(let j=0;j<m;j++)if(mask&(1<<j)){
    const prev=mask^(1<<j);if(!prev)continue;let best=Infinity,bp=-1;
    for(let k=0;k<m;k++)if(prev&(1<<k)){const v=dp[prev*m+k]+distance(points[k+1],points[j+1]);if(v<best){best=v;bp=k}}
    dp[mask*m+j]=best;par[mask*m+j]=bp;
  }
  const full=N-1;let best=Infinity,last=-1;
  for(let j=0;j<m;j++){const v=dp[full*m+j]+distance(points[j+1],points[0]);if(v<best){best=v;last=j}}
  const rev=[];let mask=full,j=last;
  while(j>=0){rev.push(j+1);const p=par[mask*m+j];mask^=1<<j;if(p<0)break;j=p}
  rev.reverse();
  return{length:best,route:[0,...rev],runtimeMs:performance.now()-t0};
}

