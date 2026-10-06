// ===== Своя трасса: приходит из редактора (localStorage) или вставкой JSON =====
const CI=TRACKS.length; // индекс слота «Своя трасса» — сразу после трасс из config.js
let customDef=null,lastStored=null;
function setCustom(def){
 if(!def||!Array.isArray(def.pts))return false;
 const pts=def.pts.filter(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1])).map(p=>[+p[0],+p[1]]),sprint=!!def.sprint;
 if(pts.length<(sprint?2:3)||pts.length>500)return false;
 const bk=typeof def.theme==='string'&&BIOMES[def.theme]?def.theme:['forest','desert','snow'][def.theme|0]||'forest',th=BIOMES[bk],scl=Math.max(.3,Math.min(30,+def.sc||SC));
 const old=TRACKS[CI];if(old&&old.grp)scene.remove(old.grp);
 const t={n:'Своя трасса',bg:th.bg,prop:th.prop,mtn:th.mtn,atm:th.atm,pts,open:sprint,scl};
 build(t,CI);TRACKS[CI]=t;customDef={pts,sprint,sc:scl,theme:bk};
 if(!$('trk').options[CI])$('trk').add(new Option('Своя трасса',CI));
 shown=-1;return true;
}
function syncStored(select){
 if(state!=='idle')return;
 try{
  const s=localStorage.getItem('race3d.custom');
  if(s&&s!==lastStored){lastStored=s;if(setCustom(JSON.parse(s))&&select){$('trk').value=CI;setStatus('Трасса из редактора загружена: «Своя трасса».')}}
 }catch(e){}
}
$('cApply').onclick=()=>{
 try{
  if(state!=='idle'){setStatus('Менять трассу можно до старта гонки.');return}
  if(setCustom(JSON.parse($('cDef').value))){$('trk').value=CI;setStatus('Своя трасса применена. Нажмите «Старт гонки».')}
  else setStatus('В JSON должен быть массив pts (минимум 3 точки, для спринта 2).');
 }catch(e){setStatus('Не удалось разобрать JSON.')}
};
$('cFill').onclick=()=>{$('cDef').value=customDef?JSON.stringify(customDef):'';};
addEventListener('storage',e=>{if(e.key==='race3d.custom')syncStored(true)});
syncStored(false);
