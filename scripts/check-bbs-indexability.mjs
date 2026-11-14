import fs from 'node:fs/promises';
import path from 'node:path';

// Public article and pagination URLs must remain independently discoverable.
const root=process.cwd(), origin='https://albam09.com';
const dir=path.join(root,'bbs');
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const sitemapUrls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
const names=(await fs.readdir(dir,{withFileTypes:true}))
  .filter(e=>e.isDirectory() && /^(?:\d+|page(?:[2-9]|[1-9]\d+))$/.test(e.name))
  .map(e=>e.name).sort();
if(!names.length)throw Error('No public BBS pages found');
for(const name of names){
  const url=`${origin}/bbs/${name}/`;
  const html=await fs.readFile(path.join(dir,name,'index.html'),'utf8');
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const robots=metas.filter(m=>/^(?:robots|googlebot)$/i.test(m.name||''));
  const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(m=>(m.rel||'').toLowerCase()==='canonical').map(m=>m.href);
  if(!robots.some(m=>m.name.toLowerCase()==='robots' && /\bindex\b/i.test(m.content||'')) || robots.some(m=>/\bnoindex\b/i.test(m.content||'')))
    throw Error(`BBS page must permit indexing: ${url}`);
  if(canonical.length!==1 || canonical[0]!==url)throw Error(`BBS canonical mismatch: ${url}`);
  if(!sitemapUrls.has(url))throw Error(`BBS URL missing from sitemap: ${url}`);
}
console.log(`[bbs-indexability] PASS: ${names.length} public article and pagination URLs allow indexing and appear in sitemap.`);
