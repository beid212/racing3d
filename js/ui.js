// ===== Меню в модальном окне: кнопка «Меню» или Esc =====
let modalOpen=true;
function setModal(v){
 modalOpen=v;$('modal').classList.toggle('open',v);
 if(v){for(const k in keys)keys[k]=false;syncStored(false);$('bClose').focus()}
}
const openModal=()=>setModal(true),closeModal=()=>setModal(false);
$('bMenu').onclick=()=>setModal(!modalOpen);
$('bClose').onclick=closeModal;
$('modal').addEventListener('mousedown',e=>{if(e.target===$('modal'))closeModal()});
addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();setModal(!modalOpen)}});
const toggleFull=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})};
$('bFull').onclick=toggleFull;
