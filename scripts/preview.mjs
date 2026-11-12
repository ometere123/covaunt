/** Zero-dependency design-preview server. Refuses to serve outside web/. */
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('web');
const port=Number(process.env.COVAUNT_PREVIEW_PORT||4174);
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('Set COVAUNT_PREVIEW_PORT between 1024 and 65535');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  const requested=decodeURIComponent(u.pathname);
  if(requested.includes('\0'))throw Error('Invalid path');
  const file=resolve(root,`./${requested.replace(/^\/+/, '')||'index.html'}`);
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end('Forbidden');return;}
  const info=await stat(file);
  if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':data.byteLength,'X-Content-Type-Options':'nosniff'});
  res.end(data);
 }catch(e){res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>{
 console.log(`COVAUNT zero-dependency preview: http://127.0.0.1:${port}`);
 console.log('DESIGN PREVIEW only: no wallet integration, DAO votes, or real NEAR transactions until npm install and deployment config.');
});
