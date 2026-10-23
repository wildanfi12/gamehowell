import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {PRODUCTS,CONFIG} from './js/config.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const modules=['config','skins','rules','storage','audio','assets','game','main'];
const chunks=await Promise.all(modules.map(async name=>(await readFile(path.join(root,'js',name+'.js'),'utf8')).replace(/^import[\s\S]*?from ["'][^"']+["'];\r?\n/gm,'').replace(/^export /gm,'')));
const errorHandler=`const loading=document.getElementById('loading'); if(loading){loading.classList.remove('hidden');loading.innerHTML='<div class="center"><h2>Game belum dapat dimulai</h2><p>Coba buka file ini di Chrome atau Edge terbaru.</p><p id="load-error"></p></div>';document.getElementById('load-error').textContent=error.message;} console.error(error);`;
const bundle=`(async()=>{\n${chunks.join('\n')}\n})().catch(error=>{${errorHandler}});\n`;
await writeFile(path.join(root,'js/app.js'),bundle);

let html=await readFile(path.join(root,'index.html'),'utf8');
if (!html.includes('howell-emblem.png')) {
  html = html.replace(/<link rel="stylesheet" href="css\/style\.css[^"]*"\s*\/?>/, '<link rel="icon" type="image/png" href="assets/branding/howell-emblem.png" />\r\n    <link rel="stylesheet" href="css/style.css?v=2.8.0" />');
}
html=html.replace(/<script type="module" src="js\/main\.js"><\/script>/,'<script src="js/app.js?v=2.8.0"></script>');
await writeFile(path.join(root,'index.html'),html);

const css=await readFile(path.join(root,'css/style.css'),'utf8');
const map={};
const allImages = [
  ...PRODUCTS.map(p=>p.image),
  CONFIG.bagImage,
  CONFIG.bombImage,
  'assets/branding/howell-logo-white.png',
  'assets/skins/howell-chomper.png'
];
for(const image of allImages) map[image]='data:image/png;base64,'+(await readFile(path.join(root,image))).toString('base64');
const init=`const embeddedAssets=${JSON.stringify(map)};for(const product of PRODUCTS)product.image=embeddedAssets[product.image];CONFIG.bagImage=embeddedAssets[CONFIG.bagImage];CONFIG.bombImage=embeddedAssets[CONFIG.bombImage];SKINS.original.assetPath=embeddedAssets[SKINS.original.assetPath];SKINS.chomper.assetPath=embeddedAssets[SKINS.chomper.assetPath];`;
const standaloneBundle=bundle.replace(/const assets\s*=\s*await loadAssets/,()=>init+'\nconst assets = await loadAssets');
let standalone=html.replace(/<link rel="stylesheet" href="css\/style\.css[^"]*"\s*\/?>/,()=>`<style>${css}</style>`).replace(/<script src="js\/app\.js[^"]*"><\/script>/,()=>`<script>${standaloneBundle.replace(/<\/script/gi,'<\\/script')}</script>`);
for(const [src,data] of Object.entries(map))standalone=standalone.replaceAll(`src="${src}"`,`src="${data}"`);
await writeFile(path.join(root,'..','HOWELL-MAIN-LANGSUNG.html'),standalone);
console.log('Built classic-script game and standalone HTML (all assets embedded).');
