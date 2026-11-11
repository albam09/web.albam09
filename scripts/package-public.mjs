/* Build output hardening: Netlify receives public pages/assets only.
   SQL, admin docs, secrets, and build scripts remain in GitHub but outside published dist. */
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'dist');
const dirs=['admin','auth','bbs','bubble-alba','css','explore','fonts','img','js','login','map','member','messages','page','system','thumbs'];
const publicRoot=['index.html','favicon.ico','robots.txt','sitemap.xml','site.webmanifest','llms.txt','geo-catalog.json','geo-catalog.txt','BingSiteAuth.xml','_redirects','_headers'];
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
for(const d of dirs){await fs.cp(path.join(root,d),path.join(out,d),{recursive:true,force:true});}
for(const f of publicRoot){await fs.copyFile(path.join(root,f),path.join(out,f));}
const files=await fs.readdir(root);
for(const f of files){if(/^(?:google[a-z0-9]+|naver[a-z0-9]+)\.(?:html|txt)$/i.test(f)){await fs.copyFile(path.join(root,f),path.join(out,f));}}
await fs.mkdir(path.join(out,'data','pages'),{recursive:true});
for(const f of ['public-venues.json','public-venues.js','geo-catalog.json','geo-catalog.txt']){
 await fs.copyFile(path.join(root,'data',f),path.join(out,'data',f));
}
for(const f of await fs.readdir(path.join(root,'data','pages'))){if(/^(?:index|karaoke[1-8]|room)\.(?:js|json)$/.test(f))await fs.copyFile(path.join(root,'data','pages',f),path.join(out,'data','pages',f));}
const checks=['index.html','sitemap.xml','robots.txt','_redirects','css/master.css','js/home-region-preview.js','explore/post/index.html','data/public-venues.js'];
for(const f of checks){const ok=await fs.stat(path.join(out,f)).catch(()=>null);if(!ok)throw new Error('Missing public file: '+f);}
for(const f of ['SUPABASE09.sql','SUPABASE09_SAFE_FINAL.sql','netlify.toml','scripts/build-site.mjs','data/build/public-content-snapshot.json','data/venue-directory.json','data/region-guide-content.json']){
 if(await fs.stat(path.join(out,f)).catch(()=>null))throw new Error('Restricted build input leaked into dist: '+f);
}
console.log(`[package-public] PASS: public-only dist with ${dirs.length} asset/page directories; build source/SQL excluded`);

const snapshot=JSON.parse(await fs.readFile(path.join(root,'data/build/public-content-snapshot.json'),'utf8'));
await fs.writeFile(path.join(out,'site-version.json'),JSON.stringify({version:'20261112-v18-comprehensive-seo',builtAt:new Date().toISOString(),publicContentVerifiedAt:snapshot.fetchedAt,venueCount:64,mapRegions:10},null,2)+'\n');