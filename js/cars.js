// ===== Машины: GLB-модели из models/cars (если есть) или встроенная процедурная модель =====
function linearize(G){const seen=new Set();G.traverse(o=>{const m=o.material;if(m&&m.color&&!seen.has(m)){seen.add(m);m.color.convertSRGBToLinear()}})}

// подгонка чужой модели: длина вдоль X, нос в +X, колёса на земле, по центру
function fitModel(src,c,col){
 const M3=src.clone(true),O=new THREE.Group(),W=new THREE.Group();
 M3.traverse(o=>{
  if(!o.isMesh)return;o.castShadow=true;
  const ms=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{
   const cm=m.clone();if(/paint|body|carpaint|exterior|karos|lak/i.test(cm.name||''))cm.color.copy(lin(col));return cm});
  o.material=Array.isArray(o.material)?ms:ms[0];
 });
 W.add(M3);O.add(W);W.rotation.y=c.yaw||0;
 let b=new THREE.Box3().setFromObject(W),sz=b.getSize(new THREE.Vector3());
 if(sz.z>sz.x*1.15){W.rotation.y+=Math.PI/2;b.setFromObject(W);sz=b.getSize(new THREE.Vector3())}
 if(c.flip)W.rotation.y+=Math.PI;
 W.scale.setScalar(c.len/Math.max(sz.x,.001)*(c.scale||1));
 b.setFromObject(W);
 W.position.set(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);
 return O;
}
function makeCar(ci,col){
 const c=CARS[ci],G=makeProcCar(ci,col);linearize(G);
 loadGLB(c.file).then(src=>{
  if(!src)return;
  const B=G.userData.B;B.clear();B.add(fitModel(src,c,col));G.userData.wheels=[];
 });
 return G;
}

// ---------- машины ----------
function makeProcCar(ci,col){
 const c=CARS[ci],L=c.L,W=c.W,k=c.k,G=new THREE.Group(),B=new THREE.Group(),wheels=[];G.add(B);
 const body=new THREE.MeshPhysicalMaterial({color:col,metalness:.35,roughness:.28,clearcoat:1,clearcoatRoughness:.08});
 const glass=new THREE.MeshPhongMaterial({color:0x0b1520,shininess:120,specular:0x99aabb,transparent:true,opacity:.92});
 const dark=new THREE.MeshStandardMaterial({color:0x1a1d22,roughness:.7}),white=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.4}),
  chrome=new THREE.MeshStandardMaterial({color:0xcfd5dc,metalness:.9,roughness:.25}),tire=new THREE.MeshStandardMaterial({color:0x101114,roughness:.9}),
  lamp=new THREE.MeshBasicMaterial({color:0xfff4c4}),tail=new THREE.MeshBasicMaterial({color:0xff2a1a});
 const ext=(pts,d,m,bv=.6,z=0)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bv,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:3});
  g.translate(0,0,-(d-2*bv)/2);const me=new THREE.Mesh(g,m);me.position.z=z;B.add(me)};
 const box=(w,h,d,m,x,y,z)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);B.add(me)};
 const cyl=(r,h,m,x,y,z)=>{const me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,14),m);me.rotation.z=Math.PI/2;me.position.set(x,y,z);B.add(me)};
 const wheel=(r,wd,x,z,front)=>{
  const st=new THREE.Group(),sp=new THREE.Group();st.position.set(x,r,z);st.add(sp);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,wd,22),tire),rm=new THREE.Mesh(new THREE.CylinderGeometry(r*.62,r*.62,wd+.3,14),chrome),
   sk=new THREE.Mesh(new THREE.BoxGeometry(r*1.15,r*.2,wd+.5),dark);
  t.rotation.x=rm.rotation.x=Math.PI/2;sp.add(t,rm,sk);B.add(st);wheels.push({st,sp,front,r});
 };
 const both=(f)=>{f(1);f(-1)};
 if(k==='sport'){
  ext([[-15,2.2],[15,2.2],[15,5],[12,6],[4,6.6],[-12,6.6],[-15,6]],W,body);
  ext([[5,6.6],[1.5,10.4],[-8.5,10.4],[-11.5,6.6]],W*.82,glass,.4);
  box(10,.7,W*.82-1,body,-3.5,10.9,0);box(15,.12,2.6,white,5,7.25,0);
  box(3,.6,W+1,body,-14.5,10.2,0);both(s=>box(.8,3.4,.8,dark,-14.5,8.4,s*4.5));
  box(2,.5,W+1.5,dark,15.2,2.5,0);both(s=>{box(.6,1.1,3.2,lamp,15.4,4.7,s*W*.32);box(.6,1,3.4,tail,-15.4,5.4,s*W*.32);cyl(.7,2,chrome,-15.5,3.2,s*3.5)});
  wheel(3.5,3.4,9,W/2+.2,1);wheel(3.5,3.4,9,-W/2-.2,1);wheel(3.7,3.6,-9,W/2+.2,0);wheel(3.7,3.6,-9,-W/2-.2,0);
 }else if(k==='f1'){
  ext([[-17,2.4],[17,2.6],[17,3.6],[8,4.2],[2,5.4],[-5,6.4],[-12,6],[-17,5]],5.2,body);
  both(s=>ext([[-12,2.8],[3,2.8],[4,4.6],[-12,5.8]],3.4,body,.6,s*4.6));
  box(4,2.6,2.4,body,-4.5,8,0);
  const h=new THREE.Mesh(new THREE.SphereGeometry(1.7,16,12),white);h.position.set(.5,7.2,0);B.add(h);box(.8,.8,2.4,dark,1.8,7.3,0);
  box(3.2,.6,W+7,body,16,1.8,0);both(s=>{box(3.6,2.6,.5,dark,16,2.9,s*(W/2+3.6));box(4,4.6,.5,dark,-16,8.8,s*(W/2+1.6))});
  box(3,.6,W+3,body,-16,9,0);box(2.6,.6,W+3,body,-16,10.6,0);box(1,5,1.2,dark,-15,6,0);
  wheel(4.2,5.4,11,W/2+3.2,1);wheel(4.2,5.4,11,-W/2-3.2,1);wheel(4.6,6,-11.5,W/2+3.2,0);wheel(4.6,6,-11.5,-W/2-3.2,0);
 }else if(k==='jeep'){
  ext([[-15,3.2],[15,3.2],[15,8],[13,9.4],[-15,9.4]],W,body,.8);
  ext([[3.5,9.4],[1.5,15.6],[-14,15.6],[-14.5,9.4]],W*.9,glass,.5);
  box(15.4,.8,W*.9-1,body,-6.2,16.2,0);
  both(s=>box(13,.5,.5,dark,-6.5,17,s*W*.33));[-11,-6.5,-2].forEach(x=>box(.5,.5,W*.7,dark,x,17,0));
  box(1,1.2,W-3,dark,16,4.8,0);box(.8,3,.8,dark,16,6.5,W/2-3);box(.8,3,.8,dark,16,6.5,-W/2+3);
  both(s=>{cyl(1.5,.9,lamp,15.3,7.4,s*W*.32);box(.6,1.4,2.6,tail,-15.3,7,s*W*.34);box(8.5,.8,3,dark,9.5,8.2,s*(W/2+.3));box(8.5,.8,3,dark,-9.5,8.2,s*(W/2+.3))});
  cyl(4,2,tire,-16.8,9,0);cyl(1.8,2.3,chrome,-16.8,9,0);
  wheel(5.4,5,9.5,W/2+.3,1);wheel(5.4,5,9.5,-W/2-.3,1);wheel(5.4,5,-9.5,W/2+.3,0);wheel(5.4,5,-9.5,-W/2-.3,0);
 }else{
  ext([[-13,2.4],[13,2.4],[13,5.6],[10.5,6.9],[6,7.2],[-13,7.2]],W,body,.8);
  ext([[6.5,7.2],[2.5,12.2],[-8.5,12.2],[-13,7.4]],W*.86,glass,.5);
  box(11,.7,W*.86-1,body,-3,12.6,0);box(1,1.5,W-1,dark,13.4,3.3,0);box(1,1.5,W-1,dark,-13.4,3.3,0);
  both(s=>{cyl(1.3,.9,lamp,13.3,5.2,s*W*.32);box(.6,1.3,2.6,tail,-13.4,5.8,s*W*.33);box(1.2,1,1.6,body,3.8,8.8,s*(W/2+.9))});
  wheel(3.6,3.2,8.4,W/2+.1,1);wheel(3.6,3.2,8.4,-W/2-.1,1);wheel(3.6,3.2,-8.4,W/2+.1,0);wheel(3.6,3.2,-8.4,-W/2-.1,0);
 }
 B.traverse(o=>{if(o.isMesh)o.castShadow=true});
 G.userData={B,wheels};G.scale.setScalar(1.5);return G;
}
