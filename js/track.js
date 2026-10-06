// ===== Трасса: сплайн, асфальт с текстурой, бордюры, отбойники, арка, горы, деревья =====
const GLB_CACHE={};
function loadGLB(path){
 if(!path||!THREE.GLTFLoader||location.protocol==='file:')return Promise.resolve(null);
 return GLB_CACHE[path]||(GLB_CACHE[path]=new Promise(res=>new THREE.GLTFLoader().load(path,g=>res(g.scene),undefined,()=>res(null))));
}
const lam=c=>{const m=new THREE.MeshLambertMaterial({color:c});m.color.convertSRGBToLinear();return m};
let OPEN=false; // выставляется в build(): трасса-спринт (не замкнута)
const normals=s=>{const N=s.length;return s.map((p,i)=>{const a=OPEN?s[Math.max(0,i-1)]:s[(i+N-1)%N],b=OPEN?s[Math.min(N-1,i+1)]:s[(i+1)%N],tx=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tx,ty)||1;return[-ty/l,tx/l]})};
function tang(t,i){const j=t.open?Math.min(i,t.N-2):i,a=t.s[j],b=t.s[(j+1)%t.N];return Math.atan2(b[1]-a[1],b[0]-a[0])}

// равномерный сплайн Catmull-Rom: шаг ~10 ед. независимо от расстояния между контрольными точками
function buildSpline(pts,scl,open){
 const Q=pts.map(p=>[p[0]*scl,p[1]*scl]),n=Q.length,segs=open?n-1:n,dense=[];
 const P=i=>open?Q[Math.max(0,Math.min(n-1,i))]:Q[(i+n)%n];
 for(let i=0;i<segs;i++){
  const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2),st=Math.max(12,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/5));
  for(let j=0;j<st;j++){const u=j/st,u2=u*u,u3=u2*u;
   dense.push([0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u3)))}}
 if(open)dense.push(Q[n-1].slice());
 const m=dense.length,cnt=open?m-1:m,cum=[0];
 for(let i=0;i<cnt;i++){const a=dense[i],b=dense[(i+1)%m];cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
 const L=cum[cnt],N=open?Math.max(2,Math.round(L/10))+1:Math.max(8,Math.round(L/10)),out=[];
 let j=0;
 for(let k=0;k<N;k++){
  const d=open?L*k/(N-1):L*k/N;
  while(j<cnt-1&&cum[j+1]<d)j++;
  const a=dense[j],b=dense[(j+1)%m],l=(cum[j+1]-cum[j])||1,u=Math.max(0,Math.min(1,(d-cum[j])/l));
  out.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]);
 }
 return out;
}

// лента вдоль центральной линии: ширина w, смещение off, цвет по сегменту, UV для текстуры
function ribbon(s,nr,w,y,col,skip,mat,off=0,tile=160){
 const N=s.length,segs=OPEN?N-1:N,pos=[],cl=[],nm=[],uv=[],dist=[0];
 for(let i=0;i<segs;i++)dist.push(dist[i]+Math.hypot(s[(i+1)%N][0]-s[i][0],s[(i+1)%N][1]-s[i][1]));
 const V=(i,sd)=>{const p=s[i%N],n=nr[i%N],o=off+w*sd;pos.push(p[0]+n[0]*o,y,p[1]+n[1]*o);nm.push(0,1,0);uv.push((sd+1)/2,dist[i]/tile)};
 for(let i=0;i<segs;i++){
  if(skip&&skip(i))continue;
  V(i,1);V(i+1,1);V(i,-1);V(i+1,-1);V(i,-1);V(i+1,1);
  const c=lin(col(i));for(let k=0;k<6;k++)cl.push(c.r,c.g,c.b);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(nm,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const m=new THREE.Mesh(g,mat);m.receiveShadow=true;return m;
}

// процедурные деревья (запасной вариант, если нет GLB)
const PG={tr:new THREE.CylinderGeometry(1.5,2,8,8),co:new THREE.ConeGeometry(9,15,9),co2:new THREE.ConeGeometry(7,13,9),co3:new THREE.ConeGeometry(5,11,9),
 ca:new THREE.CylinderGeometry(2.5,2.5,20,10),ar:new THREE.CylinderGeometry(1.6,1.6,8,8),sc:new THREE.ConeGeometry(7,22,9),st:new THREE.CylinderGeometry(1.4,1.8,6,8)};
const glow=(c,e)=>{const m=new THREE.MeshLambertMaterial({color:c});m.emissive.setHex(e);return m};
Object.assign(PG,{pa:new THREE.CylinderGeometry(1.1,1.8,24,7),fr:new THREE.SphereGeometry(10,8,6),rk:new THREE.DodecahedronGeometry(9,0),cr:new THREE.ConeGeometry(4,24,5),br2:new THREE.CylinderGeometry(.6,1,12,5)});
const PM={br:lam(0x6b4a2b),gr:lam(0x24602f),gr2:lam(0x2d7338),ca:lam(0x4f8a3c),sn:lam(0xf4f8fb),dk:lam(0x5b4a3a),
 or1:lam(0xd2691e),or2:lam(0xe0a030),or3:lam(0xa83a1e),pf:lam(0x2f9a3a),rk1:lam(0x6e6a66),rk2:lam(0x8a5a3e),dd:lam(0x4a3a2c),
 cr1:glow(0x66e0ff,0x16505e),cr2:glow(0xe070ff,0x4a1a5a)};
function prop(kind,x,z,r){
 const G=new THREE.Group(),at=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);G.add(m)};
 if(kind==='tree'){at(PG.tr,PM.br,0,4,0);at(PG.co,PM.gr,0,13,0);at(PG.co2,PM.gr2,0,21,0);at(PG.co3,PM.gr,0,28,0)}
 else if(kind==='cactus'){at(PG.ca,PM.ca,0,10,0);at(PG.ar,PM.ca,4,13,0)}
 else if(kind==='autumn'){at(PG.tr,PM.br,0,4,0);const c=r<.33?PM.or1:r<.66?PM.or2:PM.or3;at(PG.co,c,0,13,0);at(PG.co2,c,0,21,0);at(PG.co3,c,0,28,0)}
 else if(kind==='palm'){at(PG.pa,PM.br,0,12,0);const f=new THREE.Mesh(PG.fr,PM.pf);f.position.set(0,25,0);f.scale.set(1,.3,1);G.add(f)}
 else if(kind==='rock'){const m=new THREE.Mesh(PG.rk,r<.5?PM.rk1:PM.rk2);m.position.y=5;m.scale.set(1+r,.7+r*.6,1.2);G.add(m)}
 else if(kind==='dead'){at(PG.pa,PM.dd,0,12,0);const b=new THREE.Mesh(PG.br2,PM.dd);b.position.set(4,18,0);b.rotation.z=-.9;G.add(b);const c=new THREE.Mesh(PG.br2,PM.dd);c.position.set(-3,22,0);c.rotation.z=.7;G.add(c)}
 else if(kind==='crystal'){const m=r<.5?PM.cr1:PM.cr2;at(PG.cr,m,0,12,0);const b=new THREE.Mesh(PG.cr,m);b.position.set(5,8,2);b.rotation.z=-.4;b.scale.setScalar(.6);G.add(b)}
 else{at(PG.st,PM.dk,0,3,0);at(PG.sc,PM.sn,0,15,0)}
 G.scale.setScalar(1.6+r*1.4);G.position.set(x,0,z);G.rotation.y=r*TAU;return G;
}
// расстановка декораций: GLB-модель (если загрузилась) или процедурный вариант
function fillScenery(t,srcModel){
 t.sc.clear();const pd=PROPS[t.prop];
 for(const [x,z,r] of t.spots){
  let o;
  if(srcModel&&pd){
   const m=srcModel.clone(true),b=new THREE.Box3().setFromObject(m),h=(b.max.y-b.min.y)||1;
   m.position.x-=(b.min.x+b.max.x)/2;m.position.y-=b.min.y;m.position.z-=(b.min.z+b.max.z)/2;
   o=new THREE.Group();o.add(m);o.scale.setScalar(pd.h*(.8+r*.7)/h);o.rotation.y=r*TAU;o.position.set(x,0,z);
  }else o=prop(t.prop,x,z,r);
  t.sc.add(o);
 }
}

function build(t,ti){
 OPEN=!!t.open;t.open=OPEN;
 const scl=t.scl||SC,s=buildSpline(t.pts,scl,OPEN);
 t.s=s;t.N=s.length;const N=t.N,nr=normals(s),G=new THREE.Group();
 // старт, финиш и длина гонки: у круга 3 круга, у спринта один проезд от арки до арки
 t.S0=OPEN?Math.min(24,N>>2):0;t.F0=OPEN?Math.min(10,N>>3):0;
 t.laps=OPEN?1:LAPS;t.need=OPEN?Math.max(10,N-1-t.S0-t.F0):LAPS*N;
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 for(const p of s){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
 t.bb={x0,x1,y0,y1};t.gs=Math.max(14000,Math.max(x1-x0,y1-y0)+9000);t.gc=[(x0+x1)/2,(y0+y1)/2];
 t.gtex=noiseTex(t.bg,26,70,false);t.gtex.repeat.set(t.gs/127,t.gs/127);
 const asph=noiseTex('#4a4d52',30,90,true),
  asphM=new THREE.MeshStandardMaterial({map:asph,roughness:.93,vertexColors:true}),
  curbM=new THREE.MeshStandardMaterial({roughness:.55,vertexColors:true}),
  lineM=new THREE.MeshStandardMaterial({roughness:.7,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 G.add(ribbon(s,nr,HW+9,.2,i=>(i>>2)%2?'#d62d2d':'#f0f0f0',null,curbM,0,1));
 G.add(ribbon(s,nr,HW,.5,()=>'#ffffff',null,asphM,0,170));
 G.add(ribbon(s,nr,1.5,.8,()=>'#eeeeee',null,lineM,HW-8));
 G.add(ribbon(s,nr,1.5,.8,()=>'#eeeeee',null,lineM,-(HW-8)));
 G.add(ribbon(s,nr,1.6,.8,()=>'#e8e2c8',i=>(i>>1)%2,lineM));
 // отбойники по краям (в physics.js на них есть столкновение)
 const bm=new THREE.InstancedMesh(new THREE.BoxGeometry(13,8,3.5),new THREE.MeshStandardMaterial({roughness:.75}),N*2),
  mx=new THREE.Matrix4(),q=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1),ps=new THREE.Vector3(),ax=new THREE.Vector3(0,1,0);
 let bi=0;
 for(let i=0;i<N;i++)for(const sd of[-1,1]){
  q.setFromAxisAngle(ax,-tang(t,i));ps.set(s[i][0]+nr[i][0]*(HW+28)*sd,4,s[i][1]+nr[i][1]*(HW+28)*sd);
  bm.setMatrixAt(bi,mx.compose(ps,q,one));bm.setColorAt(bi,lin((i>>1)%2?'#d62d2d':'#eeeeee'));bi++;
 }
 bm.castShadow=bm.receiveShadow=true;G.add(bm);
 // арки с шашечным полем: старт (и финиш у спринта)
 const cc=document.createElement('canvas');cc.width=32;cc.height=128;const x=cc.getContext('2d');
 for(let r=0;r<8;r++)for(let c=0;c<2;c++){x.fillStyle=(r+c)%2?'#fff':'#111';x.fillRect(c*16,r*16,16,16)}
 const ft=new THREE.CanvasTexture(cc);ft.encoding=THREE.sRGBEncoding;
 const arch=idx=>{
  const A=new THREE.Group();A.position.set(s[idx][0],0,s[idx][1]);A.rotation.y=-tang(t,idx);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(20,2*HW),new THREE.MeshBasicMaterial({map:ft}));fl.rotation.x=-Math.PI/2;fl.position.y=1;A.add(fl);
  for(const sd of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(5,70,5),lam(0xcccccc));p.position.set(0,35,sd*(HW+36));p.castShadow=true;A.add(p)}
  const b=new THREE.Mesh(new THREE.BoxGeometry(8,12,2*HW+80),lam(0xd33a2c));b.position.y=76;b.castShadow=true;A.add(b);G.add(A);
 };
 arch(t.S0);if(OPEN)arch(N-1-t.F0);
 // горы на горизонте и декорации
 t.mt=new THREE.Group();G.add(t.mt);
 let seed=11+ti*7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,mm=lam(t.mtn);
 for(let k=0;k<26;k++){const ang=k/26*TAU+rnd()*.2,r=3700+rnd()*900,h=450+rnd()*550,m=new THREE.Mesh(new THREE.ConeGeometry(450+rnd()*450,h,6),mm);
  m.position.set(Math.cos(ang)*r,h/2-20,Math.sin(ang)*r*.85);t.mt.add(m)}
 t.spots=[];
 {const want=Math.min(600,Math.round(N/2.5)),lim2=(HW+80)**2;
  for(let k=0;k<want*6&&t.spots.length<want;k++){
   const i=Math.floor(rnd()*N),off=(HW+80+rnd()*1100)*(rnd()<.5?-1:1),px=s[i][0]+nr[i][0]*off,pz=s[i][1]+nr[i][1]*off;
   let ok=true;for(let q=0;q<N;q+=2){const d=(s[q][0]-px)**2+(s[q][1]-pz)**2;if(d<lim2){ok=false;break}}
   if(ok)t.spots.push([px,pz,rnd()]);
  }}
 t.sc=new THREE.Group();G.add(t.sc);fillScenery(t,null);
 if(PROPS[t.prop])loadGLB(PROPS[t.prop].file).then(m=>{if(m)fillScenery(t,m)});
 G.visible=false;scene.add(G);t.grp=G;
}
// Трассы собираются при первом показе: 34+ трасс сразу заняли бы много памяти и времени загрузки
const ensure=t=>{if(!t.grp)build(t,TRACKS.indexOf(t));return t};
TRACKS.forEach((t,i)=>$('trk').add(new Option(`${i+1}. ${t.n}`,i)));
let T=ensure(TRACKS[0]),shown=-1;
function showTrack(i){
 if(shown===i)return;shown=i;
 TRACKS.forEach((t,j)=>{if(t.grp)t.grp.visible=j===i});
 const t=ensure(TRACKS[i]);t.grp.visible=true;ground.material.map=t.gtex;ground.material.needsUpdate=true;ground.scale.set(t.gs/14000,t.gs/14000,1);ground.position.set(t.gc[0],-.1,t.gc[1]);setAtmosphere(t);
}
