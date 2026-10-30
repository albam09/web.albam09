import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../../', import.meta.url);
const pages = ['map/',...Array.from({length:6},(_,i)=>`map/karaoke${i+1}/`)];
const empty = ['map/karaoke7/','map/karaoke8/','map/room/'];
const txt = p => fs.readFileSync(new URL(p,root),'utf8');
const headers=txt('_headers');
assert.doesNotMatch(headers,/\/map\/\*\s*\n\s*X-Robots-Tag:\s*noindex/i);
const sitemap=txt('sitemap.xml');
for(const p of pages){
 const html=txt(`${p}index.html`);
 assert.match(html,/<meta name="robots" content="index, follow/);
 assert.ok(html.includes(`<link rel="canonical" href="https://albam09.com/${p}">`));
 assert.ok(sitemap.includes(`<loc>https://albam09.com/${p}</loc>`),`missing sitemap: ${p}`);
 assert.match(html,/<h1 class="panel-title"/);
}
for(const p of empty){
 const html=txt(`${p}index.html`);
 assert.match(html,/<meta\s+content="noindex, follow"\s+name="robots"/);
 assert.ok(!sitemap.includes(`<loc>https://albam09.com/${p}</loc>`));
}
console.log('Map indexability: 7 populated maps indexable; 3 empty maps noindex; sitemap, canonicals, headers OK');
