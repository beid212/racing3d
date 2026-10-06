// ---------- сеть: PeerJS (WebRTC), подключение по ссылке ----------
// Игровой сервер не нужен: облако PeerJS только помогает установить соединение.
const send=(c,o)=>{if(c&&c.readyState==='open')c.send(JSON.stringify(o))};
const upd=(i,m)=>Object.assign(P[i],{x:m.x,y:m.y,a:m.a,prog:m.p,nit:m.n|0});
function addFin(i){if(!ord.includes(i)){ord.push(i);if(ord.length===1)finAt=performance.now();link.forEach(c=>send(c,{t:'ord',o:ord}))}}
function stat(){
 const n=P.filter((p,i)=>i&&p.present).length;
 setStatus(`Гостей подключено: ${n} из 2. Стартуйте в любой момент, остальные подключатся по ходу гонки.`);
 $('bStart').disabled=false;
}

const goMsg=trk=>({t:'go',trk,cars:P.map(p=>p.car),pr:P.map(p=>p.present),def:trk===CI?customDef:undefined,tour:tour||undefined});
const peerOpts=()=>{const o={config:ICE};if(NET.host){o.host=NET.host;o.port=NET.port;o.path=NET.path;o.secure=NET.secure}return o};
const wrapConn=c=>({get readyState(){return c.open?'open':'closed'},send:d=>c.send(d)});
let peer=null;
function hostHandle(k,conn){
 link[k]=wrapConn(conn);const ch=link[k];
 conn.on('open',()=>{P[k].present=true;send(ch,{t:'id',id:k});stat()});
 conn.on('close',()=>{P[k].present=false;link[k]=null;link.forEach(c=>send(c,{t:'leave',i:k}));stat()});
 conn.on('data',d=>{
  const m=JSON.parse(d);
  if(m.t==='h'){P[k].car=m.car;
   if(state!=='idle'){spawn(k);link.forEach((c,j)=>{if(j!==k)send(c,{t:'join',i:k,car:m.car})});send(ch,goMsg(curTrk))}}
  else if(m.t==='s'){upd(k,m);send(link[3-k],{...m,i:k})}
  else if(m.t==='fin')addFin(k);
 });
}
function hostStart(){
 if(peer)return;
 const id='race3d-'+Math.random().toString(36).slice(2,8);
 peer=new Peer(id,peerOpts());
 peer.on('open',id=>{
  const url=location.origin+location.pathname+'?room='+id;
  $('slots').innerHTML='<label>Ссылка для друзей<input id="roomLink" readonly></label><div class="row"><button id="bCopy" class="alt">Копировать ссылку</button></div>';
  $('roomLink').value=url;
  $('bCopy').onclick=async()=>{try{await navigator.clipboard.writeText(url);setStatus('Ссылка скопирована. Отправьте её друзьям.')}catch{$('roomLink').select();setStatus('Выделено, нажмите Ctrl+C.')}};
  setStatus('Отправьте ссылку друзьям (до 2 человек). Стартуйте когда угодно, подключиться можно и во время гонки.');
 });
 peer.on('connection',conn=>{
  const k=[1,2].find(i=>!link[i]);
  if(!k){conn.on('open',()=>conn.close());return}
  hostHandle(k,conn);
 });
 peer.on('error',e=>setStatus('Ошибка сети: '+(e.type||e)+'. Обновите страницу и попробуйте снова.'));
}
function guestJoin(room){
 room=room.trim();const m0=room.match(/room=([\w-]+)/);if(m0)room=m0[1];
 if(!room){setStatus('Вставьте ссылку от хоста.');return}
 setStatus('Подключаюсь…');
 peer=new Peer(peerOpts());
 peer.on('open',()=>{
  const conn=peer.connect(room,{reliable:true});link[0]=wrapConn(conn);const ch=link[0];
  conn.on('close',()=>{state='idle';setStatus('Соединение с хостом потеряно.')});
  conn.on('data',d=>{
   const m=JSON.parse(d);
   if(m.t==='id'){myId=m.id;P[myId].present=true;send(ch,{t:'h',car:+$('car').value});setStatus(`Вы игрок ${myId+1}. Ждите старта от хоста.`)}
   else if(m.t==='s')upd(m.i,m);
   else if(m.t==='tr')tour=m.tour;
   else if(m.t==='go'){tour=m.tour||null;if(m.def)setCustom(m.def);begin(m.trk,m.cars,m.pr)}
   else if(m.t==='ord')ord=m.o;
   else if(m.t==='join'){P[m.i].car=m.car;P[m.i].present=true;spawn(m.i)}
   else if(m.t==='leave')P[m.i].present=false;
  });
 });
 peer.on('error',e=>setStatus(e.type==='peer-unavailable'?'Комната не найдена: хост закрыл страницу или ссылка неверная.':'Ошибка сети: '+(e.type||e)));
}
$('bHost').onclick=()=>{
 isHost=true;myId=0;P[0].present=true;$('bStart').disabled=false;hostStart();
};
$('bJoin').onclick=()=>{
 isHost=false;$('bTour').disabled=true;
 $('slots').innerHTML='<label>Ссылка или код комнаты<input id="roomIn" placeholder="https://…?room=race3d-abc123"></label><div class="row"><button id="bGo">Подключиться</button></div>';
 $('bGo').onclick=()=>guestJoin($('roomIn').value);
 setStatus('Вставьте ссылку от хоста.');
};
$('bSolo').onclick=()=>{$('bHost').onclick();$('bStart').onclick();setStatus('Вы едете один. Друзья могут подключиться по ссылке прямо во время гонки.')};
$('bStart').onclick=()=>{
 P[0].car=+$('car').value;
 tour=null;const m=goMsg(+$('trk').value);
 link.forEach(c=>send(c,m));begin(m.trk,m.cars,m.pr);closeModal();
};
// открыли ссылку ?room=... — подключаемся сразу
{const r=new URLSearchParams(location.search).get('room');if(r){isHost=false;guestJoin(r)}}
