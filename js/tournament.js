// ===== Турнир: серия заездов на случайных трассах, очки за места =====
// Запускает и ведёт хост (или одиночная игра). Гости получают состояние сообщениями go/tr.
const TPTS=[10,6,4],PN=['Игрок 1','Игрок 2','Игрок 3'],T_PAUSE=8000,T_DNF=45000;
$('tn').max=CI;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function tourRace(){
 tour.phase='race';
 const m=goMsg(tour.list[tour.i]);link.forEach(c=>send(c,m));begin(m.trk,m.cars,m.pr);closeModal();
}
function startTour(){
 if(!isHost&&link[0])return;           // гость турнир не запускает
 if(!isHost)$('bHost').onclick();      // не выбрали роль: играем как хост в одиночку
 P[0].car=+$('car').value;
 const n=Math.max(2,Math.min(CI,Math.round(+$('tn').value)||5));$('tn').value=n;
 const list=shuffle(Array.from({length:CI},(_,i)=>i)).slice(0,n);
 tour={n,list,i:0,pts:[0,0,0],phase:'race',last:[]};
 tourRace();
}
$('bTour').onclick=startTour;

// вызывается каждый кадр на хосте: конец заезда -> очки -> пауза -> следующая трасса
function tourTick(now){
 if(!tour||!isHost)return;
 if(tour.phase==='race'&&state==='run'){
  const pr=[0,1,2].filter(i=>P[i].present);
  const all=pr.length&&pr.every(i=>ord.includes(i)),late=ord.length&&performance.now()-finAt>T_DNF;
  if(!all&&!late)return;
  const rest=pr.filter(i=>!ord.includes(i)).sort((a,b)=>P[b].prog-P[a].prog),order=[...ord,...rest];
  order.forEach((id,k)=>{tour.pts[id]+=TPTS[k]||0});
  tour.last=order;tour.phase=tour.i+1>=tour.n?'final':'between';tourAt=now+T_PAUSE;
  link.forEach(c=>send(c,{t:'tr',tour}));
 }else if(tour.phase==='between'&&now>=tourAt){tour.i++;tourRace()}
}
function renderTour(now){
 const e=$('tour');
 if(!tour||tour.phase==='race'){e.style.display='none';return}
 const pt=tour.pts,rows=[0,1,2].filter(i=>P[i].present||pt[i]>0).sort((a,b)=>pt[b]-pt[a]),fin=tour.phase==='final';
 let t=fin?'ИТОГИ ТУРНИРА':`Заезд ${tour.i+1} из ${tour.n} завершён`;
 t+='\n\nЗаезд: '+tour.last.map((id,k)=>`${k+1}. ${PN[id]} (+${TPTS[k]||0})`).join('   ');
 t+='\n\nОбщий счёт:\n'+rows.map((i,k)=>`${k+1}. ${PN[i]} — ${pt[i]} очк.`).join('\n');
 if(fin&&rows.length)t+=`\n\nПобедитель: ${PN[rows[0]]}\nEsc — меню, чтобы начать заново`;
 else{const nx=TRACKS[tour.list[tour.i+1]];t+=`\n\nДалее: ${nx?nx.n:''}`+(isHost?` — через ${Math.max(0,Math.ceil((tourAt-now)/1000))} с`:'')}
 e.textContent=t;e.style.display='block';
}
