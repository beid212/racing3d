// Локальный статический сервер без зависимостей: npm start -> http://localhost:8000
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),port=+process.env.PORT||8000;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 const f=path.normalize(path.join(root,p));
 if(!f.startsWith(root)||f.includes(path.sep+'node_modules'+path.sep)){res.writeHead(403);return res.end('403')}
 fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404')}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)});
}).listen(port,()=>console.log('http://localhost:'+port));
