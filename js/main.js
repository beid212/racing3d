function drawMini(){
 mg.clearRect(0,0,160,120);if(state==='idle')return;
 const bb=T.bb,w=Math.max(1,bb.x1-bb.x0),h=Math.max(1,bb.y1-bb.y0),k=Math.min(144/w,104/h),ox=8+(144-w*k)/2,oy=8+(104-h*k)/2,
  X=x=>(x-bb.x0)*k+ox,Y=y=>(y-bb.y0)*k+oy;
 mg.lineJoin='round';mg.lineWidth=5;mg.strokeStyle='rgba(255,255,255,.55)';mg.beginPath();
 const st=Math.max(1,Math.floor(T.N/300));
 for(let i=0;i<T.N;i+=st){const p=T.s[i];i?mg.lineTo(X(p[0]),Y(p[1])):mg.moveTo(X(p[0]),Y(p[1]))}
 if(T.open){const e=T.s[T.N-1];mg.lineTo(X(e[0]),Y(e[1]))}else mg.closePath();
 mg.stroke();
 P.forEach((p,i)=>{if(!p.present)return;mg.fillStyle=COL[i];mg.beginPath();mg.arc(X(p.x),Y(p.y),i===myId?5:3.5,0,TAU);mg.fill();
  if(i===myId){mg.strokeStyle='#fff';mg.lineWidth=1.5;mg.stroke()}});
}
let prev=performance.now(),sendT=0;
function frame(now){
 const dt=Math.min(.05,(now-prev)/1000)||.016;prev=now;
 step(dt,now);if(typeof tourTick==='function'){tourTick(now);renderTour(now)}
 const m=P[myId];
 if(state==='idle'){
  {const ti=+$('trk').value;T=ensure(TRACKS[ti]);showTrack(ti)}
  const a=now/9000,b=T.bb,cx=(b.x0+b.x1)/2,cz=(b.y0+b.y1)/2,rr=Math.min(6500,Math.max(1800,Math.max(b.x1-b.x0,b.y1-b.y0)*.55));
  cam.fov=60;cam.updateProjectionMatrix();
  cam.position.set(cx+Math.cos(a)*rr,rr*.65,cz+Math.sin(a)*rr);cam.lookAt(cx,0,cz);
  sun.target.position.set(cx,0,cz);sun.position.set(cx+sunVec.x*320,sunVec.y*320,cz+sunVec.z*320);
 }else{
  for(let i=0;i<3;i++){
   const p=P[i],r=R[i],v=VS[i],k=i===myId?1:Math.min(1,dt*14),ox=r.x,oy=r.y,oa=r.a;
   r.x+=(p.x-r.x)*k;r.y+=(p.y-r.y)*k;r.a+=wrap(p.a-r.a)*k;
   if(!p.present&&meshes[i]){scene.remove(meshes[i]);meshes[i]=null}
   const M3=meshes[i];if(!M3)continue;
   const dx=r.x-ox,dy=r.y-oy,sp=Math.hypot(dx,dy)/dt,lp=Math.min(1,dt*8),ud=M3.userData;
   const nsp=v.sp+(sp-v.sp)*lp;v.af+=((nsp-v.sp)/dt-v.af)*lp*.5;v.sp=nsp;v.yaw+=(wrap(r.a-oa)/dt-v.yaw)*lp;
   v.roll+=(-Math.max(-.14,Math.min(.14,v.yaw*v.sp*.00012))-v.roll)*lp;
   v.pit+=(Math.max(-.08,Math.min(.08,v.af*.00006))-v.pit)*lp;
   M3.position.set(r.x,0,r.y);M3.rotation.y=-r.a;ud.B.rotation.x=v.roll;ud.B.rotation.z=v.pit;
   ud.wheels.forEach(w=>{w.sp.rotation.z-=v.sp/w.r*dt;if(w.front)w.st.rotation.y=-Math.max(-.45,Math.min(.45,v.yaw*.22))});
   if(state==='run'&&p.nit){const f=CARS[p.car].L*.75;puff(r.x-Math.cos(r.a)*f,r.y-Math.sin(r.a)*f,Math.random()<.5?0x66ccff:0xffaa33,11,1)}
   if(state==='run'&&v.sp>90){
    const sl=Math.abs(wrap(Math.atan2(dy,dx)-r.a)),W=CARS[p.car].W*1.5;
    const bx=r.x-Math.cos(r.a)*14*1.5,bz=r.y-Math.sin(r.a)*14*1.5,sx=-Math.sin(r.a)*W/2,sz=Math.cos(r.a)*W/2;
    if(sl>.2&&sl<2.6&&Math.random()<.8){puff(bx+sx,bz+sz,0xe8e8e8,16);puff(bx-sx,bz-sz,0xe8e8e8,16)}
    else if(i===myId&&p.d>HW+9&&Math.random()<.6)puff(bx+sx,bz+sz,0xb89a6a,13);
   }
  }
  tickParts(dt);
  if(m.nit)shake=Math.max(shake,.12);shake*=Math.exp(-6*dt);
  const vang=Math.atan2(m.vy,m.vx),sp=Math.hypot(m.vx,m.vy);
  camA+=wrap((sp>80?m.a+wrap(vang-m.a)*.35:m.a)-camA)*Math.min(1,dt*4);
  const cx=Math.cos(camA),cz=Math.sin(camA);
  nf+=((m.nit?12:0)-nf)*Math.min(1,dt*6);cam.fov=60+Math.min(24,sp/17)+nf;cam.updateProjectionMatrix();
  cam.position.set(m.x-cx*150+(Math.random()-.5)*shake*14,64+Math.random()*shake*8,m.y-cz*150+(Math.random()-.5)*shake*14);
  cam.lookAt(m.x+cx*90,8,m.y+cz*90);
  sun.target.position.set(m.x,0,m.y);sun.position.set(m.x+sunVec.x*320,sunVec.y*320,m.y+sunVec.z*320);
 }
 skyMesh.position.copy(cam.position);if(T.mt)T.mt.position.set(cam.position.x,0,cam.position.z);
 R3.render(scene,cam);drawMini();
 let hud='',txt='';
 if(state!=='idle'){
  const key=i=>ord.includes(i)?1e9-ord.indexOf(i):P[i].prog;
  const ids=[0,1,2].filter(i=>P[i].present).sort((a,b)=>key(b)-key(a));
  const lap=Math.max(1,Math.min(T.laps,Math.floor(m.prog/T.N)+1)),sp=Math.hypot(m.vx,m.vy),pct=Math.max(0,Math.min(100,Math.round(m.prog/T.need*100)));
  hud=(T.open?`Спринт ${pct}%`:`Круг ${lap}/${T.laps}`)+(tour?`  ·  Турнир ${tour.i+1}/${tour.n}`:'')+`  ·  место ${ids.indexOf(myId)+1}/${ids.length}  ·  ${Math.round(sp*.5)} км/ч`+(m.slip>70&&sp>100?'  ·  занос':'')+(m.d>HW+9?'  ·  вне трассы':'');
  if(state==='count'){const n=Math.ceil((goAt-now)/1000);txt=n>0?n:''}
  else if(now-t0<800)txt='Старт!';
  if(m.done){const pl=ord.indexOf(myId)+1;txt=(pl?pl+' место':'Финиш')+` · ${m.time.toFixed(1)} с`}
 }
 $('hud').textContent=hud;$('msg').textContent=txt;
 $('nitro').style.display=state==='idle'?'none':'block';$('nfill').style.width=m.nt+'%';$('nfill').style.background=m.nlock?'#777':m.nit?'#7fd6ff':'#2fa8e8';
 if(state!=='idle'&&now-sendT>33){
  sendT=now;const o={t:'s',x:m.x,y:m.y,a:m.a,p:m.prog,n:m.nit?1:0};
  if(isHost)link.forEach(c=>send(c,{...o,i:0}));else send(link[0],o);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
