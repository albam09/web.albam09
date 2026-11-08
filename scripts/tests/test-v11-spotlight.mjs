import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html');
const builder=read('scripts/build-search-pages.mjs');
const js=read('js/home-region-preview.js');
const css=read('css/albam09-v11-spotlight.css');
assert.match(home,/albam09-v11-spotlight\.css\?v=20261108-v11/);
assert.match(home,/home-region-preview\.js\?v=20261108-v11/);
assert.equal((home.match(/data-region-preview="karaoke[1-8]"/g)||[]).length,8);
assert.equal((home.match(/class="ab09-spotlight"/g)||[]).length,12); // six regions, two preview images each
assert.match(builder,/homeSpotlight\(/,'Builder must preserve spotlight after Netlify regeneration');
assert.match(js,/__ALBAM09_V11_SPOTLIGHT__/);
assert.match(js,/touchstart/);
assert.match(js,/INTERVAL=3650/);
assert.match(css,/ab09-spotlight__media img/);
for(const board of ['karaoke1','karaoke2']){
 const map=read(`map/${board}/index.html`),region=read(`page/${board}/index.html`);
 assert.doesNotMatch(region,/상세 위치 문의|상세 주소 확인 필요/);
 assert.doesNotMatch(map,/상세 위치 문의|상세 주소 확인 필요|reverseSelectedVenue\(p\)/);
 assert.match(map,/핀 좌표로 주소 검색/);
}
console.log('V11 PASS: generated photo preview, mobile swipe controls, original map/search integrity, no placeholder location hints');
