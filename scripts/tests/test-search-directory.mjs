import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const directory=JSON.parse(read('data/venue-directory.json')).venues;
assert.equal(directory.length,64);
assert.equal(new Set(directory.map(v=>v.slug)).size,64);
const counts={karaoke1:34,karaoke2:3,karaoke3:15,karaoke4:3,karaoke5:7,karaoke6:2,karaoke7:0,karaoke8:0};
const scriptData=(p,key)=>{const context={window:{}};vm.runInNewContext(read(p),context);return context.window[key];};
const globalData=scriptData('data/public-venues.js','PUBLIC_VENUES');
assert.equal(globalData.length,64);
assert.equal(JSON.stringify(globalData),JSON.stringify(JSON.parse(read('data/public-venues.json'))));
const seen=new Set();
for(const [board,count] of Object.entries(counts)){
 const rows=directory.filter(v=>v.board===board);
 const html=read(`page/${board}/index.html`);
 assert.equal(rows.length,count);
 assert.equal((html.match(/class="venue-list-a11y-item"/g)||[]).length,count,'Visible cards must match browser data');
 assert.equal((html.match(/class="business-desc-card"/g)||[]).length,count,'Detailed facts must match cards');
 const js=scriptData(`data/pages/${board}.js`,'PUBLIC_PAGE_VENUES');
 assert.equal(js.length,count);
 assert.equal(JSON.stringify(js),JSON.stringify(JSON.parse(read(`data/pages/${board}.json`))));
 assert.ok(js.every(v=>v.board===board));
 assert.ok(html.includes(`href="https://albam09.com/page/${board}/" rel="canonical"`));
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.doesNotMatch(html,/<meta[^>]*content="noindex/);
 const graph=JSON.parse(html.match(/<script id="search-directory-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 const list=graph.find(o=>o['@type']==='ItemList');
 assert.equal(list.numberOfItems,count);
 assert.deepEqual(list.itemListElement.map(v=>v.name).sort(),rows.map(v=>v.name).sort());
 assert.ok(!graph.some(o=>String(o['@type']).includes('LocalBusiness')),'Do not assert unverified LocalBusiness facts');
 for(const v of rows){assert.ok(html.includes(`id="venue-${v.slug}"`));assert.ok(!seen.has(v.slug));seen.add(v.slug);}
 const map=read(`map/${board}/index.html`);
 const initial=JSON.parse(map.match(/const initialRegionSlugs=(\[[\s\S]*?\]);/)[1]);
 assert.deepEqual(initial.sort(),rows.map(v=>v.slug).sort());
 const staticList=map.match(/id="placeList"[^>]*>([\s\S]*?)<\/aside>/)[1];
 assert.equal((staticList.match(/class="place-item"/g)||[]).length,count,'Map HTML must contain only its own region');
 assert.doesNotMatch(map,/nominatim\.openstreetmap\.org/,'Do not turn reverse geocoding into a business address');
 assert.match(read('js/map-data.js'),/label:'핀 위치 지도'/,'Coordinate pins link to their exact point');
 assert.match(read('js/map-data.js'),/label:'등록 주소 지도'/,'Unlocated records use only an actual registered building address');
 assert.doesNotMatch(map,/핀 좌표로 주소 검색/,'Customer actions must not expose coordinate lookup');
 assert.match(map,/js\/map-view\.js/,'All regions use the shared map engine');
 assert.doesNotMatch(map,/reverseSelectedVenue\(p\)/,'Do not invoke missing reverse-geocode handler');
 for(const [,attrs,body] of map.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/\bsrc=|application\/ld\+json|type=["']module/.test(attrs)||!body.trim())continue;
  new vm.Script(body,{filename:`map/${board}/inline.js`});
 }
}
assert.equal(seen.size,64);
assert.equal(directory.find(v=>v.slug==='boss').board,'karaoke3');
assert.equal(directory.find(v=>v.slug==='padam-padam').board,'karaoke4');
assert.equal(directory.filter(v=>v.coordinateStatus==='address-coordinate-conflict').length,8);
assert.equal(directory.filter(v=>v.coordinateStatus==='building-address-reference').length,3,'Only independently geocoded buildings may be corrected');
assert.ok(directory.filter(v=>v.coordinateStatus==='address-coordinate-conflict').every(v=>v.lat===null&&v.lng===null));
const home=read('index.html');
assert.doesNotMatch(home.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1],/상무지구/,'Home targets the regional directory, not Sangmu alone');
assert.equal((home.match(/data-preview-item/g)||[]).length,6);
assert.doesNotMatch(home,/class="business-desc-card"/,'Do not repeat all regional descriptions on home');
const nearest=read('js/nearest.js');
const start=nearest.indexOf('function listPagePlaces('),end=nearest.indexOf('function renderDistanceResults(',start);
const rows=vm.runInNewContext(nearest.slice(start,end)+';listPagePlaces("ALL");',{
 normalizeRegion:s=>s,
 getPlaces:()=>[{name:'null',lat:null,lng:null},{name:'empty',lat:'',lng:''},{name:'bad',lat:NaN,lng:126},{name:'valid',lat:35.1,lng:126.8}]
});
assert.equal(rows.length,1);assert.equal(rows[0].name,'valid');
console.log('PASS: all 64 venues preserved; regional HTML/data/schema/maps agree; 19 reclassified links; unknown pins excluded from distance results; map JavaScript parses');
