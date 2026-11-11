import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const venues=JSON.parse(read('data/venue-directory.json')).venues;
const promo=JSON.parse(read('data/venue-unique-intros-09.json')).introductions;
const publicVenues=JSON.parse(read('data/public-venues.json'));
const fail=s=>{throw new Error('[V19-venue-copy] '+s)};
const assert=(ok,s)=>{if(!ok)fail(s)};
assert(venues.length===64,'Expected 64 venues');
assert(Object.keys(promo).length===64,'Exactly 64 individual introductions required');
assert(new Set(Object.values(promo)).size===64,'Duplicated venue intros detected');
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let found=0;
for(let i=1;i<=8;i++){
 const file=`page/karaoke${i}/index.html`,html=read(file);
 assert(!html.includes('지도 핀 좌표를 역조회한 위치입니다'),'Old pin warning appears: '+file);
 assert(!html.includes('이 번지에 해당 업소가 실제로 입점했는지는 확인되지 않았습니다'),'Old generic disclaimer appears: '+file);
 assert(!html.includes('등록 연락처'),'Redundant phone label appears: '+file);
 assert(!html.includes('class="directory-phone"'),'Phone repeated inside directory intro: '+file);
 assert(!html.includes('directory-location-kind'),'Legacy generic context appears: '+file);
 const inBoard=venues.filter(v=>v.board===`karaoke${i}`);
 const cards=(html.match(/class="business-desc-card"/g)||[]).length;
 const intros=(html.match(/class="business-desc-card__intro"/g)||[]).length;
 assert(cards===inBoard.length&&intros===inBoard.length,`Card/intro mismatch in ${file}: ${cards}/${intros}/${inBoard.length}`);
 assert(html.includes('ab09-v18-comprehensive.css'),'Card stylesheet not linked: '+file);
 for(const v of inBoard){
  assert((promo[v.slug]||'').length>=70,'Intro too short: '+v.slug);
  assert(html.includes(`<p class="business-desc-card__intro">${escape(promo[v.slug])}</p>`),'Missing original individual intro '+v.slug);
  assert(html.includes(`id="venue-${v.slug}"`),'Missing venue card '+v.slug);
  assert(html.includes(`/map/${v.board}/?venue=${v.slug}`),'Lost map detail link '+v.slug);
  found++;
 }
}
assert(found===64,'Expected 64 rendered intros: '+found);
assert(publicVenues.length===64,'Public venue dataset drift');
const originalBySlug=Object.fromEntries(venues.map(v=>[v.slug,v]));
for(const v of publicVenues)assert(v.phone===originalBySlug[v.slug]?.phone,'Phone dataset unexpectedly changed: '+v.slug);
const map=read('js/map-view.js');
assert(map.includes('PIN_ADDRESS_DATA_START'),'Map pin data missing');
console.log('[V19-venue-copy] PASS: 64 unique introductions, 0 generic pin disclaimers, 0 directory phone repetitions, map/detail links and phone records preserved');
