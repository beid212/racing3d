// ===== Рендер: сцена, освещение, небо, окружение, текстуры, частицы =====
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const R3=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
R3.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R3.setSize(innerWidth,innerHeight,false);
R3.outputEncoding=THREE.sRGBEncoding;R3.toneMapping=THREE.ACESFilmicToneMapping;
R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,1,12000);
scene.fog=new THREE.Fog(0xffffff,900,5000);
addEventListener('resize',()=>{R3.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
const hemi=new THREE.HemisphereLight(0xffffff,0x445544,.5);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:1,far:900});
sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;sun.shadow.normalBias=.5;scene.add(sun,sun.target);
const sunVec=new THREE.Vector3(.4,.7,.3);

// небо: градиент + солнце; тот же материал строит карту окружения для отражений на лаке
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
 uniforms:{top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunCol:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)}},
 vertexShader:'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 v;uniform vec3 top,hor,sunCol,sunDir;void main(){vec3 d=normalize(v);float h=clamp(d.y,0.,1.);vec3 c=mix(hor,top,pow(h,.5));float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(s,700.)*6.+pow(s,10.)*.35);if(d.y<0.)c=hor*.55;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});
const skyMesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),skyMat);
skyMesh.scale.setScalar(6000);skyMesh.renderOrder=-10;skyMesh.frustumCulled=false;scene.add(skyMesh);
const pmrem=new THREE.PMREMGenerator(R3),envScene=new THREE.Scene();
const envMesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),skyMat);envMesh.scale.setScalar(50);envScene.add(envMesh);
let envRT=null;
function setAtmosphere(t){
 const a=t.atm,u=skyMat.uniforms;
 u.top.value.copy(lin(a.top));u.hor.value.copy(lin(a.hor));u.sunCol.value.copy(lin(a.sunCol));
 u.sunDir.value.set(...a.sun).normalize();sunVec.copy(u.sunDir.value);
 sun.color.copy(lin(a.sunCol));sun.intensity=a.int;hemi.intensity=a.hemi;hemi.color.copy(lin(a.hor));
 R3.toneMappingExposure=a.exp;
 scene.fog.color.copy(lin(a.hor));scene.fog.near=a.fog[0];scene.fog.far=a.fog[1];
 if(envRT)envRT.dispose();envRT=pmrem.fromScene(envScene);scene.environment=envRT.texture;
}

// процедурные текстуры (асфальт, трава, песок, снег)
function noiseTex(base,amp,blots,lines){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<blots;i++){const px=Math.random()*256,py=Math.random()*256,r=8+Math.random()*30,g=x.createRadialGradient(px,py,0,px,py,r);
  const dk=Math.random()<.5;g.addColorStop(0,dk?'rgba(0,0,0,.10)':'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r)}
 const id=x.getImageData(0,0,256,256),d=id.data;
 for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*amp;d[i]+=n;d[i+1]+=n;d[i+2]+=n}
 x.putImageData(id,0,0);
 if(lines){x.fillStyle='rgba(0,0,0,.12)';x.fillRect(60,0,34,256);x.fillRect(162,0,34,256)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;
 t.anisotropy=R3.capabilities.getMaxAnisotropy();return t;
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(14000,14000),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.set(1200,-.1,900);ground.receiveShadow=true;scene.add(ground);

// ---- частицы: дым из-под колёс, пыль, пламя нитро ----

const ptex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,2,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const parts=[];let pIdx=0;
for(let i=0;i<90;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ptex,transparent:true,depthWrite:false,opacity:0}));s.visible=false;scene.add(s);parts.push({s,life:0,max:1,vx:0,vy:0,vz:0,sz:10})}
function puff(x,z,col,sz,add){const p=parts[pIdx++%parts.length];p.s.position.set(x,3,z);p.s.material.color.set(col);p.life=p.max=.9;
 p.vx=(Math.random()-.5)*24;p.vz=(Math.random()-.5)*24;p.vy=14;p.sz=sz;p.s.material.blending=add?THREE.AdditiveBlending:THREE.NormalBlending;p.s.visible=true}
function tickParts(dt){for(const p of parts){if(p.life<=0){p.s.visible=false;continue}p.life-=dt;const u=Math.max(0,p.life/p.max);
 p.s.position.x+=p.vx*dt;p.s.position.y+=p.vy*dt;p.s.position.z+=p.vz*dt;p.s.scale.setScalar(p.sz*(2-u));p.s.material.opacity=u*.55}}

