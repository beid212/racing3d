// ---------- состояние ----------
const P=[0,1,2].map(()=>({x:0,y:0,a:0,vx:0,vy:0,w:0,st:0,slip:0,d:0,nt:100,nlock:false,nit:0,prog:0,ci:0,car:0,present:false,done:false,time:0}));
const R=[0,1,2].map(()=>({x:0,y:0,a:0})),VS=[0,1,2].map(()=>({sp:0,yaw:0,af:0,roll:0,pit:0})),meshes=[null,null,null];
let curTrk=0,myId=0,isHost=false,state='idle',goAt=0,t0=0,ord=[],camA=0,shake=0;
const link=[null,null,null],keys={};
addEventListener('keydown',e=>{if(typeof modalOpen!=='undefined'&&modalOpen)return;keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=false);
function place(i){
 const t=T,idx=(((t.S0-8-6*i)%t.N)+t.N)%t.N,p=t.s[idx],a=tang(t,idx),off=i==1?28:-28;
 Object.assign(P[i],{x:p[0]+Math.cos(a+1.5708)*off,y:p[1]+Math.sin(a+1.5708)*off,a,vx:0,vy:0,w:0,st:0,slip:0,d:0,nt:100,nlock:false,nit:0,prog:-(8+6*i),ci:idx,done:false,time:0});
 Object.assign(R[i],{x:P[i].x,y:P[i].y,a});Object.assign(VS[i],{sp:0,yaw:0,af:0,roll:0,pit:0});
}
function spawn(i){
 place(i);if(meshes[i]){scene.remove(meshes[i]);meshes[i]=null}
 if(P[i].present){meshes[i]=makeCar(P[i].car,COL[i]);scene.add(meshes[i])}
}
function begin(trk,cars,pr){
 T=TRACKS[trk];curTrk=trk;showTrack(trk);ord=[];
 for(let i=0;i<3;i++){P[i].car=cars[i];P[i].present=pr[i];spawn(i)}
 camA=P[myId].a;state='count';goAt=performance.now()+3000;
}
function setStatus(s){$('status').textContent=s}

let tour=null,finAt=0,tourAt=0; // турнир (см. js/tournament.js), момент первого финиша
