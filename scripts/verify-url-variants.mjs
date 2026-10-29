#!/usr/bin/env node
/**
 * Albam09 regional canonical / UTM / content-version audit.
 * Usage: node scripts/verify-url-variants.mjs           (offline static audit)
 *        node scripts/verify-url-variants.mjs --live    (requires live Internet)
 * Optional: --base=https://your-deploy.netlify.app
 * Exits nonzero if canonical mismatch, wrong BBS links, or main content divergence.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const regions=Array.from({length:8},(_,i)=>i+1);
const baseArg=process.argv.find(s=>s.startsWith('--base='));
const base=(baseArg ? baseArg.slice(7):'https://albam09.com').replace(/\/$/,'');
const live=process.argv.includes('--live');
let failures=0;
const out=(msg)=>console.log('[url-variants] '+msg);
const fail=(s)=>{out('FAIL: '+s);failures++};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const meta=(h,kind)=>{
 const head=h.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
 if(kind==='canonical')return (head.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)||head.match(/<link\b[^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*\brel=["']canonical["'][^>]*>/i)||[])[0]||'';
 if(kind==='title')return (head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.trim()||'';
 return '';
};
for(const n of regions){
 const rel=`page/karaoke${n}/index.html`;
 const h=fs.readFileSync(path.join(root,rel),'utf8');
 const expected=`https://albam09.com/page/karaoke${n}/`;
 const canon=meta(h,'canonical');
 if(!canon.includes(`href="${expected}"`) && !canon.includes(`href='${expected}'`))fail(`${rel} canonical incorrect: ${canon}`);
 if(!h.includes('name="albam09-content-release" content="20261030-canonical-link-audit-v1"'))fail(`${rel} release marker missing`);
 const nav=h.match(/<nav\b[^>]*\bclass="[^"]*\bab09-region-intent\b[^"]*"[^>]*>[\s\S]*?<\/nav>/i)?.[0]||'';
 if(!nav)fail(`${rel} related-search navigation missing`);
 const uris=[...nav.matchAll(/href="(\/bbs\/\d+\/)"/g)].map(x=>x[1]);
 if(new Set(uris).size!==uris.length)fail(`${rel} multiple labels point to same BBS article`);
 for(const url of uris){if(!fs.existsSync(path.join(root,url.slice(1),'index.html')))fail(`${rel} broken link: ${url}`)}
 out(`local karaoke${n}: title=${meta(h,'title').slice(0,48)}, canonical=OK, BBS ${uris.length} unique`);
}
const he=fs.readFileSync(path.join(root,'_headers'),'utf8');
if(!/\/page\/\*\s+Cache-Control: public, max-age=0, must-revalidate/.test(he))fail('regional HTML cache-revalidation header missing');
if(live){
 for(const n of regions){
  const url=`${base}/page/karaoke${n}/`;
  try{
   const variants=[url,`${url}?utm_source=chatgpt.com`];
   const data=[];
   for(const u of variants){
    const response=await fetch(u,{redirect:'follow',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error(`${u} returned HTTP ${response.status}`);
    const body=await response.text();
    data.push({requested:u,returned:response.url,body,status:response.status,etag:response.headers.get('etag'),cache:response.headers.get('cache-control'),cacheStatus:response.headers.get('cache-status'),age:response.headers.get('age'),netlifyId:response.headers.get('x-nf-request-id'),release:body.match(/<meta name="albam09-content-release" content="([^"]+)"/)?.[1]||'not-found'});
   }
   const [a,b]=data;
   out(`LIVE karaoke${n} headers: regular ${JSON.stringify({etag:a.etag,cache:a.cache,cacheStatus:a.cacheStatus,age:a.age,netlifyRequestId:a.netlifyId})}; UTM ${JSON.stringify({etag:b.etag,cache:b.cache,cacheStatus:b.cacheStatus,age:b.age,netlifyRequestId:b.netlifyId})}`);
   if(a.release==='not-found'||b.release==='not-found')fail(`LIVE karaoke${n} expected release marker missing; deployed source may be older`);
   if(a.body!==b.body)fail(`LIVE karaoke${n} variants differ: body sha256 ${sha(a.body)} vs ${sha(b.body)}; titles ${JSON.stringify(meta(a.body,'title'))} vs ${JSON.stringify(meta(b.body,'title'))}; versions ${a.release} vs ${b.release}; final URLs ${a.returned} vs ${b.returned}`);
   else out(`LIVE karaoke${n} OK both URL variants identical: sha256 ${sha(a.body)}, marker=${a.release}`);
  }catch(e){fail(`LIVE karaoke${n} unavailable: ${e.message}`)}
 }
}
if(failures){out(`${failures} issue(s)`);process.exit(1)}
out('PASS: 8 regional source canonicals + BBS links + cache control'+(live?' + live URL pair equality':''));
