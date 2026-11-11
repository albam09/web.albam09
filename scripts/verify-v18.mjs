import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const v=JSON.parse(read('data/venue-directory.json')).venues;
const pins=JSON.parse(read('data/map-pin-addresses.json')).points;
const orig=JSON.parse(read('data/venue-original-intros-11-20261030.json')).introductions;
const html=read('index.html');
const fail=msg=>{throw Error('[V18-verify] '+msg)};
const check=(cond,msg)=>{if(!cond)fail(msg)};
check(v.length===64,'Expected 64 venue records');
check(Object.keys(orig).length===45,'Original 11 introductions must equal 45');
check(!html.includes('지역별 업소 이용 가이드'),'Removed index guide returned');
check(html.includes('id="index-original-intros"'),'Index introduction fold missing');
check(!/<details\b[^>]*\bopen(?:\s|=|>)/i.test(html.match(/<section id="index-original-intros"[\s\S]*?<\/section>/)?.[0]||''),'Index intro unexpectedly expanded');
check((html.match(/class="ab09-index-intro-card"/g)||[]).length===45,'Original intro card count changed');
check(html.includes('상무지구 노래방·상무지구 가라오케'),'Index H1 body missing key terms');
let totalCards=0,pin=0,street=0,none=0,hours=0;
for(const n of [1,2,3,4,5,6,7,8]){
 const f=`page/karaoke${n}/index.html`,s=read(f);
 check(s.includes('hero-intro-details'),'Regional hero details missing '+f);
 check(s.includes('더보기')&&s.includes('접기'),'Regional collapse text missing '+f);
 check(s.includes('노래방')&&s.includes('가라오케'),'Regional SEO terms missing '+f);
 check(s.includes('<meta name="keywords"'),'Region meta keywords missing '+f);
 check(!s.includes('등록된 업소 주소가 아닌 지역 안내이며'),'Generic address message returned '+f);
 const count=(s.match(/class="business-desc-card"/g)||[]).length;
 totalCards+=count;
 if(count)check(!s.includes('마감시간 문의'),'Generic closing-time message returned '+f);
 const h=(s.match(/class="business-desc-fact business-desc-fact--hours"/g)||[]).length;
 hours+=h;
}
check(totalCards===64,'Missing venue information cards '+totalCards);
for(const item of v){
 const s=read(`page/${item.board}/index.html`);
 const exact=item.addressPrecision==='street'&&/\d/.test(item.address||'');
 const key=Number.isFinite(item.lat)&&Number.isFinite(item.lng)?item.lat.toFixed(7)+','+item.lng.toFixed(7):'';
 const p=pins[key];
 if(exact){street++;check(s.includes(item.address),'Registered address missing '+item.slug);}
 else if(p){pin++;check(s.includes(p.road||p.parcel),'Pin reference address missing '+item.slug);}
 else{none++;check(s.includes(item.name),'Unconfirmed venue missing '+item.slug);}
}
check(street===16&&pin===43&&none===5,'Address provenance count drift '+JSON.stringify({street,pin,none}));
check(hours===10,'Only 10 explicitly provided time ranges should remain, found '+hours);
check(html.match(/<meta name="keywords"/g)?.length===1,'Duplicate index keyword tags');
check(html.match(/<meta property="og:description"/g)?.length===1,'Duplicate index OG tags');
check(html.match(/<meta name="twitter:description"/g)?.length===1,'Duplicate index X/Twitter tags');
const report=read('reports/V18_09_전체페이지_메타키워드.csv');
const lineCount=report.trimEnd().split('\n').length-1;
check(lineCount>=90,'Insufficient page-level keyword report '+lineCount);
console.log(`[V18-verify] PASS: 5 requirements, 45 original descriptions, 8 unique regional heroes, ${totalCards} cards, ${street} recorded addresses, ${pin} pin reference addresses, ${none} unverified addresses, ${hours} specific-time rows, ${lineCount} tagged HTML pages`);