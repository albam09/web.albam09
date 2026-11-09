import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),origin='https://albam09.com';
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
function metadata(html){
 const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const canonicals=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(m=>m.rel==='canonical').map(m=>m.href);
 return {noindex:metas.some(m=>m.name==='robots'&&/\bnoindex\b/i.test(m.content||'')),canonicals,h1:(html.match(/<h1\b/gi)||[]).length};
}
const sitemap=path.join(root,'sitemap.xml');let xml=await fs.readFile(sitemap,'utf8');
const fixes=process.argv.includes('--fix-sitemap'),seen=new Set();let count=0,removed=0;
for(const match of [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)]){
 const entry=match[0],url=entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
 if(!url?.startsWith(origin+'/'))throw Error('Invalid sitemap URL: '+url);
 const pathname=new URL(url).pathname;
 const file=path.join(root,pathname.slice(1),'index.html');
 const html=await fs.readFile(file,'utf8').catch(()=>{throw Error('Missing sitemap page: '+url);});
 const m=metadata(html);
 if(m.noindex){if(!fixes)throw Error('Noindex page in sitemap: '+url);xml=xml.replace(entry,'');removed++;continue;}
 if(seen.has(url))throw Error('Duplicate sitemap URL: '+url);seen.add(url);
 if(m.canonicals.length!==1||m.canonicals[0]!==url)throw Error('Sitemap canonical mismatch: '+url);
 if(m.h1!==1)throw Error(`Expected one main heading: ${url} (${m.h1})`);
 count++;
}
if(fixes&&removed)await fs.writeFile(sitemap,xml.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n'));
for(let i=1;i<=8;i++)if(!seen.has(`${origin}/page/karaoke${i}/`))throw Error('Missing regional URL: '+i);
const robots=await fs.readFile(path.join(root,'robots.txt'),'utf8');
if(!robots.includes(`Sitemap: ${origin}/sitemap.xml`)||/^Disallow:\s*\/\s*$/m.test(robots))throw Error('Crawl directive error');
console.log(`[seo-check] PASS: ${count} canonical, indexable sitemap pages; ${removed} noindex entries removed; main headings and robots checked`);
