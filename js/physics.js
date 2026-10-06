// ---------- игра: физика ----------
let nf=0;const G0=1100,MS=.065,WALL=HW+28-1.75; // центр стены HW+28, половина толщины 1.75 (см. track.js)
function nearest(m){
 const s=T.s,N=T.N,op=T.open;let best=1e9,bi=m.ci;
 for(let d=-20;d<=20;d++){let i=m.ci+d;if(op){if(i<0||i>=N)continue}else i=(i+N)%N;
  const dx=m.x-s[i][0],dy=m.y-s[i][1],q=dx*dx+dy*dy;if(q<best){best=q;bi=i}}
 let dl=bi-m.ci;if(!op){if(dl>N/2)dl-=N;if(dl<-N/2)dl+=N}
 m.prog+=dl;m.ci=bi;return Math.sqrt(best);
}
function phys(m,c,dt){
 const d=m.d=nearest(m);
 const sg=d<=HW?1:d<=HW+9?.92:c.og,sr=d<=HW?.18:d<=HW+9?.25:c.or;
 const fx=Math.cos(m.a),fy=Math.sin(m.a),lx=-fy,ly=fx;
 const vf=m.vx*fx+m.vy*fy,vl=m.vx*lx+m.vy*ly,sp=Math.hypot(m.vx,m.vy);
 const live=!m.done,up=live&&(keys.ArrowUp||keys.KeyW),dn=live&&(keys.ArrowDown||keys.KeyS),
  lf=live&&(keys.ArrowLeft||keys.KeyA),rt=live&&(keys.ArrowRight||keys.KeyD),hb=live&&keys.Space;
 // продольные силы
 let af=0;
 if(up)af=c.acc*(.45+.55*sg)*(m.nit?1.7:1);
 if(dn)af=vf>10?-c.brake:-c.acc*.45;
 if(hb)af-=Math.sign(vf)*Math.min(Math.abs(vf)/dt,220);
 m.vx+=fx*af*dt;m.vy+=fy*af*dt;
 // сопротивление: качение/трава + аэродинамика
 const dr=sr+c.k2*sp;m.vx/=1+dr*dt;m.vy/=1+dr*dt;
 // боковое сцепление с насыщением (трение ограничено)
 const lim=G0*c.grip*sg*(hb?.28:1)*(1+c.df*sp/400)*(1-.25*Math.min(1,Math.abs(af)/400));
 const dv=Math.max(-lim*dt,Math.min(lim*dt,vl));
 m.vx-=lx*dv;m.vy-=ly*dv;m.slip=Math.abs(vl-dv);
 // руль
 m.st+=(((rt?1:0)-(lf?1:0))-m.st)*Math.min(1,dt*8);
 const dl=m.st*c.steer/(1+Math.abs(vf)/200);
 let wt=vf*Math.tan(dl)/c.wb;
 if(hb)wt*=1.6;
 else{const need=Math.abs(wt*vf);if(need>lim*1.25)wt*=lim*1.25/need}
 m.w+=(wt-m.w)*Math.min(1,dt*(hb?5:9));
 m.a+=m.w*dt;
 const bb=T.bb;
 m.x=Math.max(bb.x0-1500,Math.min(bb.x1+1500,m.x+m.vx*dt));
 m.y=Math.max(bb.y0-1500,Math.min(bb.y1+1500,m.y+m.vy*dt));
 // отбойник: внутренняя грань стены на WALL, учитываем габариты машины (L x W) по нормали к стене
 {
  const s=T.s[m.ci],ex=m.x-s[0],ey=m.y-s[1],el=Math.hypot(ex,ey)||1,nx=ex/el,ny=ey/el,
   cf=Math.cos(m.a),sf=Math.sin(m.a),
   ext=c.L/2*Math.abs(cf*nx+sf*ny)+c.W/2*Math.abs(-sf*nx+cf*ny),lim=WALL-ext;
  if(el>lim){
   m.x=s[0]+nx*lim;m.y=s[1]+ny*lim;
   const vn=m.vx*nx+m.vy*ny;
   if(vn>0){m.vx-=1.35*vn*nx;m.vy-=1.35*vn*ny;m.vx*=.92;m.vy*=.92;shake=Math.max(shake,Math.min(1,vn/200))}
  }
 }
}
function step(dt,now){
 if(state==='count'&&now>=goAt){state='run';t0=now}
 const m=P[myId];if(state!=='run'||!m.present)return;
 const c=CARS[m.car];
 const upk=!m.done&&(keys.ArrowUp||keys.KeyW),on=upk&&(keys.ShiftLeft||keys.ShiftRight)&&m.nt>0&&!m.nlock;
 if(on){m.nt-=38*dt;if(m.nt<=0){m.nt=0;m.nlock=true}}else m.nt=Math.min(100,m.nt+(m.slip>70?16:6)*dt);
 if(m.nlock&&m.nt>=30)m.nlock=false;
 m.nit=on?1:0;
 for(let q=0;q<3;q++)phys(m,c,dt/3);
 P.forEach((o,i)=>{if(i===myId||!o.present)return;
  const dx=m.x-o.x,dy=m.y-o.y,q=Math.hypot(dx,dy);
  if(q<46&&q>.01){const nx=dx/q,ny=dy/q;m.x+=nx*(46-q);m.y+=ny*(46-q);
   const vn=m.vx*nx+m.vy*ny;
   if(vn<0){const j=-1.45*vn*.55;m.vx+=nx*j;m.vy+=ny*j;m.w+=(Math.random()-.5)*1.4;shake=Math.max(shake,Math.min(1,-vn/180))}}});
 if(!m.done&&m.prog>=T.need){
  m.done=true;m.time=(now-t0)/1000;
  if(isHost)addFin(0);else send(link[0],{t:'fin'});
 }
}
