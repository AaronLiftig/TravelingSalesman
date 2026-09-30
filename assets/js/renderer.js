class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext("2d")}
  resize(){const d=window.devicePixelRatio||1,w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.canvas.width=w*d;this.canvas.height=h*d;this.ctx.setTransform(d,0,0,d,0,0)}
  draw(points,hull,route,step=-1,kind="your",showMid=true){
    this.resize();const c=this.ctx,w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    c.clearRect(0,0,w,h);c.fillStyle="#0c1016";c.fillRect(0,0,w,h);
    c.strokeStyle="#222b38";c.lineWidth=1;c.beginPath();
    for(let x=0;x<w;x+=40){c.moveTo(x,0);c.lineTo(x,h)}for(let y=0;y<h;y+=40){c.moveTo(0,y);c.lineTo(w,y)}c.stroke();
    if(hull.length){c.strokeStyle="#596678";c.lineWidth=2;c.beginPath();hull.forEach((i,k)=>{const p=points[i],x=p.x*w,y=p.y*h;k?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()}
    if(kind==="your"&&showMid&&hull.length){for(let i=0;i<hull.length;i++){const A=points[hull[i]],B=points[hull[(i+1)%hull.length]],x=(A.x+B.x)*w/2,y=(A.y+B.y)*h/2;c.fillStyle="#f6c453";c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill()}}
    if(step&&kind==="your"){const e=step;for(const pair of e.connections){const A=points[pair[0]],B=points[pair[1]];c.strokeStyle="#9aa7ba88";c.lineWidth=1;c.beginPath();c.moveTo(A.x*w,A.y*h);c.lineTo(B.x*w,B.y*h);c.stroke()}}
    if(route.length){c.strokeStyle=kind==="your"?"#4f86ff":"#58c7a5";c.lineWidth=3;c.beginPath();route.forEach((i,k)=>{const p=points[i],x=p.x*w,y=p.y*h;k?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()}
    points.forEach((p,i)=>{c.beginPath();c.arc(p.x*w,p.y*h,i===(step?.point??-1)?7:4,0,Math.PI*2);c.fillStyle=i===(step?.point??-1)?"#f6c453":"#e8edf5";c.fill()});
  }
}



const $=id=>document.getElementById(id);
const metricSelect=$("metric");
Object.values(metrics).forEach(m=>metricSelect.add(new Option(m.name,m.id)));
const yourRenderer=new Renderer($("yourCanvas")),exactRenderer=new Renderer($("exactCanvas"));
let state=null,playback=0,playing=false,timer=null;
