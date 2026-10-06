// Запускается автоматически после `npm install`: копирует библиотеки из node_modules в libs/,
// откуда их берёт index.html (работает и локально, и на GitHub Pages: закоммитьте папку libs/).
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'libs');
const files=[
 ['three/build/three.min.js','three.min.js'],
 ['three/examples/js/loaders/GLTFLoader.js','GLTFLoader.js'],
 ['peerjs/dist/peerjs.min.js','peerjs.min.js']];
fs.mkdirSync(out,{recursive:true});
let bad=0;
for(const [from,to] of files){
 const src=path.join(root,'node_modules',from);
 if(!fs.existsSync(src)){console.error('нет файла: '+src);bad++;continue}
 fs.copyFileSync(src,path.join(out,to));console.log('libs/'+to);
}
if(bad){console.error('Не все библиотеки скопированы. Выполните: npm install');process.exit(1)}
