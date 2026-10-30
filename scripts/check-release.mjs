import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(n)=>fs.readFileSync(path.join(root,n),'utf8');
const must=(v,msg)=>{if(!v)throw new Error('[release-check] '+msg);};
const present=(p)=>fs.existsSync(path.join(root,p));
for(const p of ['index.html','sitemap.xml','robots.txt','_redirects','netlify.toml','llms.txt','data/geo-catalog.json','data/geo-catalog.txt','bubble-alba/index.html','js/bubble-alba.js','js/realtime09-config.js','js/realtime09-app.js','scripts/build-site.mjs','js/inline-media.js','explore/post/index.html','explore/archive/index.html'])must(present(p),'required source missing: '+p);
const sitemap=read('sitemap.xml');
const redirects=read('_redirects');
const llms=read('llms.txt');
const geo=read('data/geo-catalog.txt');
const structured=JSON.parse(read('data/geo-catalog.json'));
const locs=[...sitemap.matchAll(/<loc>(https:\/\/albam09\.com\/page\/karaoke\d+\/)\<\/loc>/g)].map(m=>m[1]);
for(let i=1;i<=8;i++){
 const url=`https://albam09.com/page/karaoke${i}/`;
 const p=`page/karaoke${i}/index.html`;
 must(present(p),'regional HTML missing: '+p);
 const html=read(p);
 must(html.includes(`href="${url}" rel="canonical"`) || html.includes(`rel="canonical" href="${url}"`),'canonical mismatch: '+p);
 must(html.includes('<title>') && html.includes('<h1'),'SEO title/H1 missing: '+p);
 must(locs.includes(url),'sitemap missing canonical: '+url);
 must(llms.includes(url)&&geo.includes(url),'AI/GEO text URL mismatch: '+url);
 must(structured.hasPart.some(x=>x.url===url),'GEO JSON URL mismatch: '+url);
 must(read('geo-catalog.json')===read('data/geo-catalog.json'),'public GEO JSON copies diverged');
 must(redirects.includes(`/page/karaoke0${i}/ /page/karaoke${i}/ 301!`),'legacy padded URL redirect missing: '+i);
 must(!redirects.includes(`/page/karaoke${i}/ / `),'invalid INDEX redirect: '+i);
}
for(const txt of [llms,geo])must(!/\/page\/karaoke0[1-8]\//.test(txt),'legacy public link found');
must(sitemap.includes('<loc>https://albam09.com/bubble-alba/</loc>'),'bubble-alba sitemap link missing');
must(read('bubble-alba/index.html').includes('ALBA_STATIC_START') && read('bubble-alba/index.html').includes('ALBA_STATIC_END'),'bubble static build markers missing');
must(read('netlify.toml').includes('pretty_urls = true'),'Netlify pretty URL setting missing');
must(redirects.includes('/explore/post/* /explore/post/index.html 200'),'dynamic explore rewrite missing');
must(!/\/\*\s+\/index\.html\s+200/.test(redirects),'homepage catchall would replace regional pages');
must(present('scripts/verify-url-variants.mjs'),'URL variant audit script missing');
// Follow-up QA: canonical UTM aliases share the same region page; link map is not duplicated.
console.log('[release-check] PASS: canonical 8, sitemap, llms, GEO, 301 aliases, bubble-alba, explorer, Netlify');
