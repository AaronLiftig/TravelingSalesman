class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext("2d")}
  resize(){const d=window.devicePixelRatio||1,w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.canvas.width=w*d;this.canvas.height=h*d;this.ctx.setTransform(d,0,0,d,0,0)}
  draw(points,hull,route,step=null,kind="your",showMid=true){
    if(!this.canvas.clientWidth)return;
    this.resize();const c=this.ctx,w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    // Keep marks legible as point counts grow well past the old 20-point limit.
    const n=points.length,dot=n>400?1.8:n>150?2.5:n>60?3:4,line=n>400?1.2:n>150?1.8:n>60?2.2:3;
    c.clearRect(0,0,w,h);c.fillStyle="#0c1016";c.fillRect(0,0,w,h);
    c.strokeStyle="#222b38";c.lineWidth=1;c.beginPath();
    for(let x=0;x<w;x+=40){c.moveTo(x,0);c.lineTo(x,h)}for(let y=0;y<h;y+=40){c.moveTo(0,y);c.lineTo(w,y)}c.stroke();
    if(hull.length){c.strokeStyle="#596678";c.lineWidth=Math.min(2,line);c.beginPath();hull.forEach((i,k)=>{const p=points[i],x=p.x*w,y=p.y*h;k?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()}
    if(kind==="your"&&showMid&&hull.length){const s=Math.max(3,dot+1);c.strokeStyle="#f6c453";c.lineWidth=1.5;for(let i=0;i<hull.length;i++){const A=points[hull[i]],B=points[hull[(i+1)%hull.length]],x=(A.x+B.x)*w/2,y=(A.y+B.y)*h/2;c.beginPath();c.moveTo(x,y-s);c.lineTo(x+s,y);c.lineTo(x,y+s);c.lineTo(x-s,y);c.closePath();c.stroke()}}
    if(step&&kind==="your"){
      // Vacuum contact: the film arc of radius R through A, P and B at the moment of contact.
      if(step.arc)this.arc(points[step.from],points[step.point],points[step.to],w,h);
      for(const pair of step.connections){const A=points[pair[0]],B=points[pair[1]];c.strokeStyle="#9aa7ba88";c.lineWidth=1;c.beginPath();c.moveTo(A.x*w,A.y*h);c.lineTo(B.x*w,B.y*h);c.stroke()}
    }
    if(route.length){c.strokeStyle=kind==="your"?"#4f86ff":"#58c7a5";c.lineWidth=line;c.lineJoin="round";c.beginPath();route.forEach((i,k)=>{const p=points[i],x=p.x*w,y=p.y*h;k?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()}
    const hi=step?.point??-1;
    c.fillStyle="#e8edf5";points.forEach((p,i)=>{if(i===hi)return;c.beginPath();c.arc(p.x*w,p.y*h,dot,0,Math.PI*2);c.fill()});
    if(hi>=0){const p=points[hi];c.beginPath();c.arc(p.x*w,p.y*h,dot+3,0,Math.PI*2);c.fillStyle="#ff8a3d";c.fill();c.lineWidth=1.5;c.strokeStyle="#0c1016";c.stroke()}
  }
  arc(A,P,B,w,h){
    const ax=A.x*w,ay=A.y*h,px=P.x*w,py=P.y*h,bx=B.x*w,by=B.y*h;
    const d=2*(ax*(py-by)+px*(by-ay)+bx*(ay-py));if(Math.abs(d)<1e-9)return;
    const a2=ax*ax+ay*ay,p2=px*px+py*py,b2=bx*bx+by*by;
    const ux=(a2*(py-by)+p2*(by-ay)+b2*(ay-py))/d,uy=(a2*(bx-px)+p2*(ax-bx)+b2*(px-ax))/d,r=Math.hypot(ax-ux,ay-uy);
    const tA=Math.atan2(ay-uy,ax-ux),tP=Math.atan2(py-uy,px-ux),tB=Math.atan2(by-uy,bx-ux),T=2*Math.PI;
    const rel=t=>((t-tA)%T+T)%T,ccw=rel(tP)>rel(tB);   // go the way that passes through P
    const c=this.ctx;c.strokeStyle="#b18cff";c.lineWidth=1.6;c.beginPath();c.arc(ux,uy,r,tA,tB,ccw);c.stroke();
  }
}
