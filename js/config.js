// ===== Конфигурация: константы, машины, трассы, пути к моделям =====
const $=id=>document.getElementById(id),cv=$('c'),mg=$('mini').getContext('2d');
const TAU=Math.PI*2,LAPS=3,HW=60,SC=3; // SC: множитель карты (координаты pts умножаются на него); у трассы можно задать свой scl
// Сеть. По умолчанию PeerJS Cloud + публичный STUN Google. Для России/строгих NAT см. README:
// свой PeerJS-сервер (NET.host...) и свой TURN (добавьте его в ICE.iceServers).
const NET={host:null,port:443,path:'/',secure:true};
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
const wrap=d=>{while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d};
const COL=['#e8452c','#3b8fe0','#f2b632'];

// 10 машин. file — путь к GLB-модели (если файла нет, рисуется встроенная модель типа k).
// len — длина модели в игровых единицах, yaw/flip/scale — подгонка ориентации модели.
const CARS=[
 {n:'Спорткар',          file:'models/cars/car01.glb',max:360,acc:320,brake:520,grip:1.00,df:.1, steer:.55,wb:22,og:.5, or:1.3,L:30,W:15,len:30,k:'sport'},
 {n:'Болид',             file:'models/cars/car02.glb',max:420,acc:300,brake:560,grip:1.15,df:.9, steer:.45,wb:24,og:.35,or:1.9,L:34,W:14,len:34,k:'f1'},
 {n:'Внедорожник',       file:'models/cars/car03.glb',max:330,acc:330,brake:480,grip:.95, df:0,  steer:.55,wb:22,og:.8, or:.55,L:30,W:19,len:30,k:'jeep'},
 {n:'Хэтчбек',           file:'models/cars/car04.glb',max:345,acc:360,brake:500,grip:1.05,df:0,  steer:.60,wb:20,og:.55,or:1.1,L:26,W:16,len:26,k:'hatch'},
 {n:'Мускул-кар',        file:'models/cars/car05.glb',max:375,acc:360,brake:480,grip:.82, df:0,  steer:.50,wb:24,og:.45,or:1.4,L:30,W:15,len:32,k:'sport'},
 {n:'Купе GT',           file:'models/cars/car06.glb',max:350,acc:300,brake:540,grip:1.10,df:.15,steer:.55,wb:22,og:.5, or:1.2,L:30,W:15,len:30,k:'sport'},
 {n:'Раллийная',         file:'models/cars/car07.glb',max:320,acc:340,brake:500,grip:.90, df:0,  steer:.62,wb:20,og:.95,or:.5, L:26,W:16,len:27,k:'hatch'},
 {n:'Пикап',             file:'models/cars/car08.glb',max:310,acc:340,brake:470,grip:.85, df:0,  steer:.50,wb:26,og:.8, or:.6, L:30,W:19,len:34,k:'jeep'},
 {n:'Суперкар',          file:'models/cars/car09.glb',max:395,acc:330,brake:560,grip:1.20,df:.5, steer:.52,wb:22,og:.4, or:1.6,L:30,W:15,len:31,k:'sport'},
 {n:'Классика',          file:'models/cars/car10.glb',max:300,acc:290,brake:450,grip:.80, df:0,  steer:.55,wb:22,og:.6, or:1.0,L:26,W:16,len:28,k:'hatch'}];
CARS.forEach(c=>c.k2=(c.acc-.18*c.max)/(c.max*c.max));

// Модели окружения (h — желаемая высота в единицах). Нет файла — рисуется процедурное дерево.
const PROPS={
 tree:  {file:'models/props/tree.glb',  h:46},
 cactus:{file:'models/props/cactus.glb',h:28},
 snow:  {file:'models/props/pine.glb',  h:44}};

// Биомы: цвет земли, декорации (prop), горы и настроение сцены (небо, солнце, туман).
// prop: tree, cactus, snow (есть GLB-модели), palm, rock, dead, crystal, autumn (процедурные).
const BIOMES={
 forest:{n:'Лес',bg:'#3f7a45',prop:'tree',mtn:'#4d6a58',atm:{top:'#4a86c8',hor:'#cfe0ea',sun:[-.6,.38,.5],sunCol:'#ffd9a8',int:1.05,hemi:.5,exp:1.0,fog:[900,5200]}},
 desert:{n:'Дюны',bg:'#c9a26b',prop:'cactus',mtn:'#a9825a',atm:{top:'#3b7fd4',hor:'#f1dfb8',sun:[.2,.9,.3],sunCol:'#fff6e0',int:1.25,hemi:.6,exp:1.05,fog:[1200,5600]}},
 snow:{n:'Снега',bg:'#e3eaef',prop:'snow',mtn:'#c8d3dd',atm:{top:'#7f95aa',hor:'#dfe7ee',sun:[.3,.42,-.5],sunCol:'#ffe9d0',int:.85,hemi:.7,exp:.95,fog:[700,4200]}},
 autumn:{n:'Осень',bg:'#8a6a2f',prop:'autumn',mtn:'#7a5a45',atm:{top:'#6a8fc0',hor:'#f0d9b5',sun:[.7,.3,.2],sunCol:'#ffc78a',int:1.0,hemi:.55,exp:1.0,fog:[800,4800]}},
 tropics:{n:'Тропики',bg:'#4f9a52',prop:'palm',mtn:'#2f6a5a',atm:{top:'#2f8fe0',hor:'#d6f0ea',sun:[.1,.95,.2],sunCol:'#fffbe8',int:1.3,hemi:.65,exp:1.1,fog:[1200,6000]}},
 volcano:{n:'Вулкан',bg:'#2e2a2a',prop:'rock',mtn:'#4a2a22',atm:{top:'#5a2428',hor:'#e08a5a',sun:[-.3,.25,.6],sunCol:'#ff7a3a',int:.95,hemi:.45,exp:1.05,fog:[500,3600]}},
 canyon:{n:'Каньон',bg:'#b5653a',prop:'rock',mtn:'#9a4a2a',atm:{top:'#4a86c8',hor:'#f1c9a0',sun:[.5,.6,-.3],sunCol:'#fff0d0',int:1.2,hemi:.55,exp:1.05,fog:[1000,5200]}},
 swamp:{n:'Болото',bg:'#4a5a3a',prop:'dead',mtn:'#4a5a50',atm:{top:'#7a8f86',hor:'#b5c4b0',sun:[.2,.5,.4],sunCol:'#e8f0c8',int:.7,hemi:.6,exp:.95,fog:[300,2600]}},
 crystal:{n:'Кристаллы',bg:'#3a3a6a',prop:'crystal',mtn:'#5a4a8a',atm:{top:'#2a1a5a',hor:'#e08ad0',sun:[-.4,.35,.4],sunCol:'#ffb0f0',int:.9,hemi:.6,exp:1.1,fog:[700,4400]}},
 night:{n:'Ночной лес',bg:'#1f3a2a',prop:'tree',mtn:'#1a2a3a',atm:{top:'#0a1230',hor:'#2a3a5a',sun:[.3,.5,.3],sunCol:'#aab8ff',int:.4,hemi:.4,exp:1.35,fog:[500,3200]}},
 tundra:{n:'Тундра',bg:'#cfe3ee',prop:'snow',mtn:'#9fb8cc',atm:{top:'#6aa0d0',hor:'#e6f2fa',sun:[.6,.35,.1],sunCol:'#fff4e0',int:1.0,hemi:.75,exp:1.0,fog:[900,5000]}},
 savanna:{n:'Саванна',bg:'#b8a24a',prop:'dead',mtn:'#8a7a4a',atm:{top:'#4a8ad0',hor:'#f4e4b8',sun:[.4,.7,.2],sunCol:'#fff2c8',int:1.2,hemi:.6,exp:1.05,fog:[1100,5600]}}};
const mkT=(b,n,open,pts,extra)=>Object.assign({n,open:!!open,pts,biome:b},BIOMES[b],extra);

// Трассы: контрольные точки pts (в любых координатах) + биом. open:true — спринт (не замкнута).
// Ещё 30 случайных трасс добавляет js/tracks-gen.js (создаётся командой npm run gen-tracks).
const TRACKS=[
 mkT('forest','Лесная петля',false,[[420,70],[650,90],[730,220],[600,300],[700,420],[520,530],[330,500],[250,380],[120,430],[80,250],[200,120]]),
 mkT('desert','Дюны',false,[[120,100],[400,60],[680,110],[720,250],[560,300],[640,430],[500,540],[300,500],[200,380],[330,290],[160,230]]),
 mkT('snow','Снежные зубцы',false,[[110,500],[110,150],[250,70],[400,220],[550,70],[690,150],[690,500],[550,540],[400,400],[250,540]]),
 mkT('forest','Спринт по холмам',true,[[100,300],[350,200],[600,300],[800,520],[1050,640],[1300,500],[1400,250],[1650,120],[1900,250],[2000,500],[2250,640],[2500,520],[2650,300],[2900,200],[3150,330]],{atm:Object.assign({},BIOMES.forest.atm,{sun:[.5,.45,-.4]})})];
CARS.forEach((c,i)=>$('car').add(new Option(`${i+1}. ${c.n}`,i)));
