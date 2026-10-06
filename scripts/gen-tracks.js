// Генератор случайных трасс: node scripts/gen-tracks.js [seed] -> js/tracks-gen.js
// Каждая трасса проверяется: стены не пересекаются, повороты не слишком крутые, длина разумная.
const fs=require('fs'),path=require('path');
const HW=60,WALL=HW+26.25,COUNT=30,SEED0=+process.argv[2]||1000;
const BIOMES=[['forest','Лес'],['desert','Дюны'],['snow','Снега'],['autumn','Осень'],['tropics','Тропики'],['volcano','Вулкан'],
 ['canyon','Каньон'],['swamp','Болото'],['crystal','Кристаллы'],['night','Ночной лес'],['tundra','Тундра'],['savanna','Саванна']];
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

// тот же сплайн, что в js/track.js
function buildSpline(pts,scl,open){
 const Q=pts.map(p=>[p[0]*scl,p[1]*scl]),n=Q.length,segs=open?n-1:n,dense=[];
 const P=i=>open?Q[Math.max(0,Math.min(n-1,i))]:Q[(i+n)%n];
 for(let i=0;i<segs;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2),st=Math.max(12,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/5));
  for(let j=0;j<st;j++){const u=j/st,u2=u*u,u3=u2*u;dense.push([0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u3)))}}
 if(open)dense.push(Q[n-1].slice());
 const m=dense.length,cnt=open?m-1:m,cum=[0];
 for(let i=0;i<cnt;i++){const a=dense[i],b=dense[(i+1)%m];cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
 const L=cum[cnt],N=open?Math.max(2,Math.round(L/10))+1:Math.max(8,Math.round(L/10)),o=[];let j=0;
 for(let k=0;k<N;k++){const d=open?L*k/(N-1):L*k/N;while(j<cnt-1&&cum[j+1]<d)j++;
  const a=dense[j],b=dense[(j+1)%m],l=(cum[j+1]-cum[j])||1,u=Math.max(0,Math.min(1,(d-cum[j])/l));o.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u])}
 return o}

function valid(pts,open){
 const s=buildSpline(pts,3,open),N=s.length,len=(open?N-1:N)*10;
 if(open?(len<5000||len>17000):(len<3500||len>14000))return false;
 const gap=70;
 for(let i=0;i<N;i++)for(let j=i+gap;j<N;j++){
  if(!open&&N-(j-i)<gap)continue;
  if(Math.hypot(s[i][0]-s[j][0],s[i][1]-s[j][1])<2*WALL+40)return false}
 const st=6;
 for(let i=st;i<N-st;i++){ // радиус поворота по трём точкам
  const a=s[i-st],b=s[i],c=s[i+st],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),ca=Math.hypot(a[0]-c[0],a[1]-c[1]),
   ar=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
  if(ar>1&&ab*bc*ca/(4*ar)<100)return false}
 if(!open)for(let k=0;k<st;k++){const i=(N-st+k)%N;const a=s[(i+N-st)%N],b=s[i],c=s[(i+st)%N],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),ca=Math.hypot(a[0]-c[0],a[1]-c[1]),
   ar=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;if(ar>1&&ab*bc*ca/(4*ar)<100)return false}
 return true}

function genClosed(r){
 const R=230+r()*430,n=Math.max(7,Math.min(18,Math.round(2*Math.PI*R/190))),sx=.8+r()*.6,sy=.8+r()*.6,rad=[];
 for(let i=0;i<n;i++)rad.push(.5+.5*r());
 const sm=rad.map((v,i)=>(rad[(i+n-1)%n]+2*v+rad[(i+1)%n])/4),pts=[];
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(r()-.5)*.5*Math.PI*2/n;pts.push([Math.round(Math.cos(a)*R*sm[i]*sx),Math.round(Math.sin(a)*R*sm[i]*sy)])}
 return pts}
function genSprint(r){
 const L=1700+r()*3600,m=Math.max(6,Math.min(18,Math.round(L/330))),step=L/m;let x=0,y=0,h=(r()-.5)*.6,t=0;const pts=[[0,0]];
 for(let i=0;i<m;i++){t=t*.5+(r()-.5)*1.4;t=Math.max(-.85,Math.min(.85,t));h+=t;const d=step*(.8+r()*.4);x+=Math.cos(h)*d;y+=Math.sin(h)*d;pts.push([Math.round(x),Math.round(y)])}
 return pts}

const out=[],cnt={};let seed=SEED0;
for(let k=0;k<COUNT;k++){
 const [b,bn]=BIOMES[k%BIOMES.length],open=((k*7)%10)<3;
 let pts=null;
 for(let tries=0;tries<400&&!pts;tries++){const r=rng(seed++);const p=open?genSprint(r):genClosed(r);if(valid(p,open))pts=p}
 if(!pts){console.error('не удалось сгенерировать трассу',k);process.exit(1)}
 const key=b+(open?'S':'L');cnt[key]=(cnt[key]||0)+1;
 out.push(` mkT('${b}','${bn}: ${open?'спринт':'кольцо'} №${cnt[key]}',${open},${JSON.stringify(pts)})`);
}
const file='// АВТОГЕНЕРАЦИЯ: node scripts/gen-tracks.js [seed]. Правьте по желанию или перегенерируйте.\n// '+COUNT+' случайных трасс в 12 биомах (кольца и спринты).\nTRACKS.push(\n'+out.join(',\n')+'\n);\n';
fs.writeFileSync(path.join(__dirname,'..','js','tracks-gen.js'),file);
console.log('готово:',COUNT,'трасс, seed',SEED0,'спринтов:',out.filter(l=>l.includes(',true,')).length);
