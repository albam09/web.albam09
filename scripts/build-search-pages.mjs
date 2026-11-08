import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// The directory is the one source for visible regional lists, map payloads and
// browser search. Never infer a business address from an old map coordinate.
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const json=p=>JSON.parse(read(p));
const source=json('data/venue-directory.json');
const guides=json('data/region-guide-content.json');
const venues=source.venues;
const release=source.release;
const updated=source.updatedAt;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const serial=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const regionData=[
 ['karaoke1','서구1','상무지구','상무지구노래방 · 상무지구가라오케','상무지구 노래방·가라오케 업소 지도',
  '치평동·상무지구의 업소를 상호와 위치 단서로 비교하세요. 라마다호텔·센트럴호텔 부근처럼 건물 주변으로 안내된 곳은 출입구와 층수를 함께 확인하면 약속 장소를 정하기 쉽습니다.',
  '상무역에서 이동하는 일행과 시청 방면에서 합류하는 일행은 출발점이 다릅니다. 아래 목록에서 목적지를 고른 뒤 주소, 이용시간, 주차 조건을 해당 업소에 확인하세요. 광천동·화정동 정보는 서구권 페이지로 구분합니다.'],
 ['karaoke2','서구2','광천동·서구권','광천동노래방 · 광천동가라오케','광천동 노래방·가라오케와 서구권 이동 안내',
  '광천동·유스퀘어에서 모여 이동할 때 참고하는 서구권 안내입니다. 각 카드에 적힌 소재지를 먼저 확인하고 광천동 출발지와 실제 방문할 업소의 위치를 구분해 보세요.',
  '이 목록에는 화정동 위치 단서가 있는 업소와 상세 소재지를 확인해야 하는 서구권 항목이 포함됩니다. 치평동·상무지구로 안내된 업소는 상무지구 목록에 모았습니다. 터미널 주차와 목적지 건물 주차는 각각 확인하세요.'],
 ['karaoke3','북구2','신안동·유동','신안동노래방 · 신안동가라오케','신안동 노래방·가라오케와 유동 업소 지도',
  '광주역 주변 신안동과 유동의 업소를 중흥로·경양로·무등로 일대의 주소로 살펴보세요. 도로명과 번지가 있는 곳, 건물 주변으로만 안내된 곳을 구분해 표시했습니다.',
  '신안동과 유동은 서로 다른 동네입니다. 광주역을 약속 장소로 잡았다면 역에서 출발할 방향과 도착할 건물·층수를 함께 공유하세요. 용봉동 저불로 일대의 업소는 별도의 용봉동 목록에서 확인할 수 있습니다.'],
 ['karaoke4','북구1','용봉동','용봉동노래방 · 용봉동가라오케','용봉동 노래방·가라오케와 저불로 업소 안내',
  '용봉동의 저불로·전철우사거리 등 위치 단서가 있는 업소를 모았습니다. 전남대 정문·후문이나 비엔날레 방면에서 출발한다면 카드의 주소와 실제 목적지를 먼저 맞춰 보세요.',
  '용봉동 1365-4로 안내된 빠담빠담과 저불로 55로 안내된 top탑은 용봉동 목록에 포함합니다. 신안동·유동으로 기재된 업소는 해당 지역 목록에서 비교할 수 있습니다. 지도 위치를 확인해야 하는 항목은 주소 검색을 함께 제공합니다.'],
 ['karaoke5','광산구','첨단지구','첨단지구노래방 · 첨단지구가라오케','첨단지구 노래방·가라오케와 쌍암동 업소 지도',
  '첨단지구·쌍암동의 업소를 상호, 도로명 주소와 호텔 주변 위치 단서로 찾아보세요. 첨단중앙로 일대에서 모이는 경우와 쌍암공원 방면에서 합류하는 경우를 나눠 목적지를 정할 수 있습니다.',
  '첨단아이는 첨단중앙로152번길 81-4, 1층으로 기재되어 있습니다. 상세 주소가 없는 업소는 방문 전에 소재지를 확인하세요. 공원 주차시설과 업소의 전용·제휴 주차는 조건이 다를 수 있습니다.'],
 ['karaoke6','목포','목포·남악','목포노래방 · 목포가라오케','목포 노래방·가라오케와 남악권 위치 안내',
  '목포와 남악권의 업소를 위치 단서와 함께 살펴보는 페이지입니다. 평화광장·하당에서 출발하는 일정과 남악으로 이동하는 일정을 구분하고 실제 방문 주소를 먼저 확인하세요.',
  '현재 자료는 파트너와 오라클가요주점을 포함합니다. 방일해장국 부근이나 남악처럼 넓은 위치 단서로 안내된 곳은 건물명·층수까지 확인한 뒤 이동하세요. 광주 지역 업소는 이 목록에 섞지 않습니다.'],
 ['karaoke7','동구','광주 동구','광주동구노래방 · 광주동구가라오케','광주 동구 노래방·가라오케와 충장로 이동 안내',
  '충장로·금남로·문화전당역 주변에서 저녁 약속을 잡을 때 참고할 광주 동구 안내입니다. 현재 공개된 업소 목록은 비어 있으며, 확인 가능한 도심 접근·주차 안내를 제공합니다.',
  '국립아시아문화전당 주차장과 충장로 상가 주차는 이용 조건이 다릅니다. 약속 장소와 귀가 교통편을 먼저 정하고, 실제 업소 정보가 추가되면 이 지역 목록과 지도에 함께 반영됩니다.'],
 ['karaoke8','남구','광주 남구','광주남구노래방 · 광주남구가라오케','광주 남구 노래방·가라오케와 봉선동 이동 안내',
  '봉선동·진월동·백운동에서 모임 장소를 정할 때 참고할 광주 남구 안내입니다. 현재 공개된 업소 목록은 비어 있으며, 남구 생활권과 주차·이동 정보를 구분해 제공합니다.',
  '봉선시장 주변에서 합류하는 경우와 백운광장·진월동으로 이동하는 경우는 목적지가 다릅니다. 다른 구의 업소를 남구 업소처럼 표시하지 않고 실제 남구 자료가 확보되는 대로 목록에 반영합니다.']
];
const regions=Object.fromEntries(regionData.map(([board,region,label,h1,title,intro,more])=>[board,{board,region,label,h1,title,intro,more}]));
const forBoard=board=>venues.filter(v=>v.board===board);
const route=v=>`/map/${v.board}/?venue=${encodeURIComponent(v.slug)}`;
const regionUrl=board=>`https://albam09.com/page/${board}/`;
const location=v=>v.addressPrecision==='street'?v.address:(v.locationHint||v.address);

if(!venues.length||new Set(venues.map(v=>v.slug)).size!==venues.length)throw Error('Directory must contain distinct venue slugs');
for(const v of venues){
 if(!regions[v.board]||v.region!==regions[v.board].region)throw Error(`Region mismatch: ${v.slug}`);
 if(!/^[a-z0-9_-]+$/i.test(v.slug)||!v.name)throw Error('Invalid directory entry');
 if(v.coordinateStatus==='address-coordinate-conflict'&&(v.lat!==null||v.lng!==null))throw Error('Conflicting coordinate must not be used as a map pin');
}

function block(s,key,content){
 const start=`<!-- SEARCH_${key}_START -->`,end=`<!-- SEARCH_${key}_END -->`;
 const from=s.indexOf(start),to=s.indexOf(end);
 if(from<0||to<from)throw Error(`Missing editable block ${key}`);
 return s.slice(0,from+start.length)+'\n'+content+'\n'+s.slice(to);
}
function meta(s,key,value,type='name'){
 const rx=new RegExp(`<meta\\b(?=[^>]*\\b${type}=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'])[^>]*>`, 'gi');
 const tag=`<meta ${type}="${key}" content="${esc(value)}">`;
 return rx.test(s)?s.replace(rx,tag):s.replace('</head>',tag+'\n</head>');
}
function head(s,{title,description,url,image='/img/og-image.jpg',schema}){
 s=s.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(title)}</title>`);
 s=meta(s,'description',description);s=meta(s,'og:title',title,'property');s=meta(s,'og:description',description,'property');
 s=meta(s,'og:url',url,'property');s=meta(s,'og:image','https://albam09.com'+image,'property');
 s=meta(s,'twitter:title',title);s=meta(s,'twitter:description',description);s=meta(s,'twitter:image','https://albam09.com'+image);
 s=meta(s,'albam09-release',release);
 if(schema){
  s=s.replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi,'');
  s=s.replace('</head>',`<script id="search-directory-schema" type="application/ld+json">${serial(schema)}</script>\n</head>`);
 }
 return s;
}
const org={'@type':'Organization','@id':'https://albam09.com/#organization',name:'광주버블여지도',url:'https://albam09.com/'};
function schemaFor(r,items){
 const url=regionUrl(r.board);
 return {'@context':'https://schema.org','@graph':[
  org,
  {'@type':'CollectionPage','@id':url+'#webpage',url,name:r.h1,description:r.intro,inLanguage:'ko-KR',dateModified:updated,
   isPartOf:{'@id':'https://albam09.com/#website'},publisher:{'@id':org['@id']},mainEntity:{'@id':url+'#places'}},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:'https://albam09.com/'},{'@type':'ListItem',position:2,name:r.label,item:url}]},
  {'@type':'ItemList','@id':url+'#places',name:r.label+' 업소 목록',numberOfItems:items.length,
   itemListElement:items.map((v,i)=>({'@type':'ListItem',position:i+1,name:v.name,url:'https://albam09.com'+route(v)}))}
 ]};
}
function hero(r){
 return `<section title=""><h1 class="daum-wm-title">${esc(r.h1)}</h1><p class="hero-keyline">${esc(r.label)} · 위치와 이용 정보</p><p class="daum-wm-content hero-desc hero-intro-teaser">${esc(r.intro)}</p><details class="hero-intro-details"><summary><span class="hero-intro-open">+ 더보기</span><span class="hero-intro-close">− 접기</span></summary><p class="daum-wm-content hero-desc hero-intro-rest">${esc(r.more)}</p></details></section>`;
}
function thumb(v,prefix='../../'){
 return `<ul><li class="venue-list-a11y-item"><h3><a href="${route(v)}">${esc(v.name)}</a></h3><a class="place-thumb-link" aria-label="${esc(v.name)} 지도에서 위치 보기" href="${route(v)}"><img class="place-list-thumb" src="${prefix+v.image.replace(/^\//,'')}" alt="${esc(v.name)} 등록 이미지" loading="lazy" decoding="async" width="960" height="640"></a></li></ul>`;
}
const contact=`<div class="free-affiliate-contact"><span>무료제휴 문의</span> <a href="mailto:groogaolove@gmail.com">groogaolove@gmail.com</a> <a href="https://t.me/medic0111" target="_blank" rel="noopener">텔레그램 @medic0111</a></div>`;
function cards(r,items){
 return `<section list=""><h2 id="spots">${esc(r.label)} 업소 목록</h2><div wrapper="">${items.map(v=>thumb(v)).join('')}${items.length?'':`<p class="directory-empty">현재 공개된 ${esc(r.label)} 업소 정보가 없습니다. 아래 지역 안내와 기사를 참고하세요.</p>`}</div>${contact}</section>`;
}
function businessInfo(r,items){
 if(!items.length)return '';
 return `<section class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>업소별 주소·이용 정보</span><span aria-hidden="true" class="business-description-fold__action">보기</span></summary><div class="business-description-fold__content"><h2>${esc(r.label)} 업소별 등록 정보</h2><p class="directory-note">제공된 자료의 위치·운영 안내입니다. 실제 영업 여부와 당일 요금·주차 조건은 방문 전에 확인해 주세요.</p><div class="business-desc-grid">${items.map(v=>`<article class="business-desc-card" id="venue-${esc(v.slug)}"><div class="business-desc-copy"><a class="business-desc-card__title-link" href="${route(v)}"><span class="business-desc-card__title">${esc(v.name)}</span></a><div class="business-desc-card__facts"><span class="business-desc-fact business-desc-fact--location" title="위치: ${esc(location(v))}"><b>위치</b> ${esc(location(v))}</span>${v.hours?`<span class="business-desc-fact business-desc-fact--hours"><b>운영 안내</b> ${esc(v.hours)}</span>`:''}</div><p class="directory-location-kind">${v.addressPrecision==='street'?'기재된 주소로 건물·층수를 확인해 주세요.':'정확한 건물 주소와 층수는 문의 시 확인해 주세요.'}</p>${v.phone?`<a class="directory-phone" href="tel:${v.phone.replace(/\D/g,'')}">${esc(v.phoneLabel)} ${esc(v.phone)}</a>`:''}</div><a class="business-desc-card__button" href="${route(v)}" aria-label="${esc(v.name)} 상세보기">상세보기</a></article>`).join('')}</div></div></details></section>`;
}
function guide(r){
 const i=r.board.replace('karaoke','');
 const links=[['#spots','업소 목록'],[`/map/${r.board}/`,'지역 지도'],[`/explore/${r.board}/`,'최신 탐험기'],[`/bbs/region/${r.board}/`,'지역 기사'],[`#ab09-region-${i}-1`,'주차·이동 안내']];
 return `<section aria-label="${esc(r.label)} 이용 안내" class="business-description-section business-description-showcase info-fold-card info-guide-card" data-region-story="${r.board}"><nav class="ab09-region-intent" aria-label="${esc(r.label)} 바로가기"><h2>${esc(r.label)} 이용 정보</h2><div class="ab09-region-intent__links">${links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</div></nav><details class="business-description-fold"><summary><span>${esc(r.label)} 교통·주차·모임 안내</span><span aria-hidden="true" class="business-description-fold__action">보기</span></summary><div class="business-description-fold__content">${guides[r.board]}</div></details></section>`;
}

// Static HTML and browser data are generated together. A deployment cannot
// accidentally keep the old nine-venue Yongbong payload after changing its HTML.
const publicRows=venues.map(v=>({slug:v.slug,id:v.id,name:v.name,title:v.title,region:v.region,board:v.board,phone:v.phone,lat:v.lat,lng:v.lng,address:v.address,locationHint:v.locationHint,area:v.area,image:v.image,coordinateStatus:v.coordinateStatus,addressSearchText:v.addressSearchText||'',buildingAddressCrosschecked:!!v.buildingAddressCrosschecked,businessLocationVerified:!!v.businessLocationVerified,pinKind:v.pinKind||'none'}));
write('data/public-venues.json',JSON.stringify(publicRows)+'\n');
write('data/public-venues.js',`/* Generated from venue-directory.json: ${release} */\nwindow.PUBLIC_VENUES=${serial(publicRows)};\n`);
for(const board of ['index',...Object.keys(regions),'room']){
 const rows=board==='index'?publicRows:publicRows.filter(v=>v.board===board);
 write(`data/pages/${board}.json`,JSON.stringify(rows)+'\n');
 write(`data/pages/${board}.js`,`/* Generated ${release}: ${board} */\nwindow.PUBLIC_PAGE_VENUES=${serial(rows)};\n`);
}

for(const r of Object.values(regions)){
 const items=forBoard(r.board),file=`page/${r.board}/index.html`;
 let s=read(file);
 s=block(s,'HERO',hero(r));s=block(s,'VENUE_CARDS',cards(r,items));s=block(s,'REGION_GUIDE',guide(r));s=block(s,'BUSINESS_INFO',businessInfo(r,items));
 const desc=items.length?`${r.h1} 업소 ${items.length}곳의 위치 단서와 등록 정보를 확인하세요. ${r.intro}`:r.intro;
 s=head(s,{title:r.title+' | 광주버블여지도',description:desc,url:regionUrl(r.board),image:items[0]?.image,schema:schemaFor(r,items)});
 write(file,s);
}

let home=read('index.html');
home=block(home,'HERO','<section title=""><h1 class="daum-wm-title">광주노래방 · 광주가라오케 지역지도</h1><p class="hero-keyline">광주·목포 지역별 업소 탐색</p><p class="daum-wm-content hero-desc">방문할 지역을 먼저 선택하세요. 각 지역 페이지에서 업소의 위치·이용 안내와 지도, 회원이 남긴 탐험기를 함께 확인할 수 있습니다.</p></section>');
const homeCards=Object.values(regions).map(r=>{
 const rows=forBoard(r.board),v=rows[0];
 return `<ul class="rotating-list-container" data-card-href="/page/${r.board}/" data-region-preview="${r.board}" id="${r.board}-list"><li class="rotating-list-heading" empty=""><h3><a href="/page/${r.board}/">${esc(r.label)} (${rows.length}개)</a></h3></li>${v?`<li class="is-active" data-preview-item><a href="${route(v)}" aria-label="${esc(v.name)} 지도에서 위치 보기"><span>${esc(v.name)}</span></a></li>`:'<li empty="">현재 공개된 업소 정보가 없습니다</li>'}</ul>`;
}).join('');
home=block(home,'VENUE_CARDS',`<section list=""><h2>지역별 업소 탐색</h2><div wrapper="">${homeCards}</div>${contact}</section>`);
home=block(home,'BRAND_GUIDE','<section id="index-brand-story-20261027" class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>지역별 업소 이용 가이드</span><span class="business-description-fold__action" aria-hidden="true">보기</span></summary><div class="business-description-fold__content"><h2>동네를 고르고 주소를 확인하세요</h2><p>광주버블여지도는 광주와 목포의 지역별 업소 정보와 공개 탐험기를 모아 제공합니다. 메인의 지역 카드에서 동네를 선택한 뒤 주소·위치 단서와 이용 안내를 비교해 보세요.</p><p>상무지구와 광천동·화정동, 신안동·유동과 용봉동은 구분해 안내합니다. 상세 주소나 당일 운영 조건이 충분하지 않은 항목은 방문 전에 해당 정보를 확인해 주세요.</p><p>등록·정정 요청은 하단 운영정보의 문의 경로로 접수합니다.</p></div></details></section>');
home=block(home,'HOME_DIRECTORY','');
home=block(home,'HOME_SECONDARY','<section id="index-secondary-search-guide" class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>탐험기·지역 기사 이용 안내</span><span class="business-description-fold__action" aria-hidden="true">보기</span></summary><div class="business-description-fold__content"><p><a href="/explore/">탐험기</a>에서는 공개된 회원 방문 기록을, <a href="/bbs/">기사게시판</a>에서는 지역별 이동·주차·이용 정보 글을 볼 수 있습니다. 후기 작성 시 방문한 업소와 실제 지역을 선택해 주세요.</p></div></details></section>');
const homeUrl='https://albam09.com/';
home=head(home,{title:'광주노래방 · 광주가라오케 지역지도 | 광주버블여지도',description:'광주·목포 노래방·가라오케 지역지도. 상무지구, 광천동·서구권, 신안동·유동, 용봉동, 첨단지구 등 지역별 업소와 지도·탐험기를 찾아보세요.',url:homeUrl,schema:{'@context':'https://schema.org','@graph':[org,{'@type':'WebSite','@id':homeUrl+'#website',url:homeUrl,name:'광주버블여지도',inLanguage:'ko-KR',publisher:{'@id':org['@id']}},{'@type':'CollectionPage','@id':homeUrl+'#webpage',url:homeUrl,name:'광주·목포 노래방·가라오케 지역지도',mainEntity:{'@id':homeUrl+'#regions'}},{'@type':'ItemList','@id':homeUrl+'#regions',name:'지역별 안내',numberOfItems:8,itemListElement:Object.values(regions).map((r,i)=>({'@type':'ListItem',position:i+1,name:r.label,url:regionUrl(r.board)}))}]}});
if(!home.includes('js/home-region-preview.js'))home=home.replace('</body>',`<script src="js/home-region-preview.js?v=${release}" defer></script>\n</body>`);
write('index.html',home);

const mapRows=venues.map(v=>({name:v.name,area:v.area,address:location(v),lat:v.lat,lng:v.lng,url:v.detailUrl,slug:v.slug,board:v.board,phone:v.phone,image:v.image,addressVerified:!!v.businessLocationVerified,buildingAddressCrosschecked:!!v.buildingAddressCrosschecked,addressSearchText:v.addressSearchText||'',pinKind:v.pinKind||'none',locationStatus:v.coordinateStatus}));
for(const board of ['index',...Object.keys(regions),'room']){
 const file=board==='index'?'map/index.html':`map/${board}/index.html`;
 if(!fs.existsSync(path.join(root,file)))continue;
 const r=regions[board],items=board==='index'?venues:forBoard(board);
 let s=read(file).replace(/const places=\[[\s\S]*?\];/,`const places=${serial(mapRows)};`);
 s=s.replace(/const initialRegionSlugs=[\s\S]*?;/,`const initialRegionSlugs=${board==='index'?'null':serial(items.map(v=>v.slug))};`);
 const label=r?.label||(board==='index'?'전체 지역':'룸소주방');
 s=s.replace(/(<h1 class="panel-title"[^>]*>)[^<]*/,'$1'+esc(label)+' 지도 · 업소 ');
 s=s.replace(/(<span id="count">)[\s\S]*?(<\/span>)/,'$1('+items.length+')$2');
 const fallback=items.map(v=>`<div class="place-item"><a class="place-name" href="/page/${v.board}/#venue-${esc(v.slug)}">${esc(v.name)}</a><div class="place-meta">${esc(v.area)}<br>${esc(location(v))}</div></div>`).join('')||'<p class="panel-note">현재 공개된 업소 정보가 없습니다.</p>';
 s=s.replace(/(<div\b[^>]*\bid="placeList"[^>]*>)[\s\S]*?(<\/div>\s*<\/aside>)/,`$1${fallback}$2`);
 // Address lookup must never turn the parcel beneath an unverified pin into
 // an asserted business address or overwrite a supplied road-name address.
 s=s.replace(/\/\* Address reverse lookup[\s\S]*?(?=function renderList\()/,'function reverseSelectedVenueAddress(){}\n');
 s=s.replace(/function nearbyForChip\(label\)\{[\s\S]*?\n\}/,`function nearbyForChip(label){
 const mapping={'상무지구':'karaoke1','광천동':'karaoke2','용봉동':'karaoke4','신안동':'karaoke3','첨단':'karaoke5'};
 return places.filter(p=>p.board===mapping[label]);
}`);
 s=s.replace('const matching=actualValidPoints(nearbyForChip(label));','const matching=nearbyForChip(label);');
 s=s.replace("function renderMarkers(){markers.innerHTML='';filteredPlaces().forEach(p=>", "function renderMarkers(){markers.innerHTML='';(selected>=0?places.map((p,i)=>({...p,_i:i})):filteredPlaces()).forEach(p=>");
 // A venue deep link keeps the regional list local while surrounding map pins
 // remain visible. Historic links follow the venue's corrected regional route.
 s=s.replace(/(const i=places\.findIndex\(p=>p\.slug===venueSlug\);\s*if\(i<0\)return;\s*)visibleVenueSlugs=null;/,`$1const target=places[i];
  const currentBoard=(location.pathname.match(/\\/map\\/(karaoke[1-8])\\//)||[])[1];
  if(currentBoard && target.board && currentBoard!==target.board){
    location.replace('/map/'+target.board+'/'+location.search+location.hash);return;
  }
  visibleVenueSlugs=currentBoard?new Set(places.filter(p=>p.board===target.board).map(p=>p.slug)):null;`);
 s=s.replace("label+' 등록 업소 '+subset.length+'곳을 실제 위치에 표시합니다.'","label+' 목록 '+subset.length+'곳의 위치 안내를 표시합니다.'");
 s=s.replace(/document\.getElementById\('sangmuBtn'\)\.onclick=\(\)=>setView\([^;]+;/,`document.getElementById('sangmuBtn').onclick=()=>{
   visibleVenueSlugs=initialRegionSlugs===null?null:new Set(initialRegionSlugs);search.value='';selected=-1;
   const focus=clusterView(filteredPlaces());if(focus){center=focus.center;zoom=focus.zoom;}
   if(regionPanelTitle)regionPanelTitle.firstChild.textContent=basePanelTitle;
   if(regionPanelNote)regionPanelNote.textContent=basePanelNote;
   render();
 };`);
 if(!s.includes('function restoreCurrentRegion(){'))s=s.replace('function restoreRealInventory(){',`function restoreCurrentRegion(){
 visibleVenueSlugs=initialRegionSlugs===null?null:new Set(initialRegionSlugs);search.value='';selected=-1;
 document.querySelectorAll('.chip').forEach(btn=>{btn.classList.remove('selected-area');btn.setAttribute('aria-pressed','false')});
 const focus=clusterView(filteredPlaces());if(focus){center=focus.center;zoom=focus.zoom;}
 if(regionPanelTitle)regionPanelTitle.firstChild.textContent=basePanelTitle;
 if(regionPanelNote)regionPanelNote.textContent=basePanelNote;
 render();
}
function restoreRealInventory(){`);
 s=s.replace(/document\.getElementById\('sangmuBtn'\)\.onclick=\(\)=>\{[\s\S]*?\n\s*\};/g,"document.getElementById('sangmuBtn').onclick=restoreCurrentRegion;");
 s=s.replace("if(regionPanelTitle)regionPanelTitle.firstChild.textContent=basePanelTitle;\n const focus=clusterView(places);","if(regionPanelTitle)regionPanelTitle.firstChild.textContent='전체 지역 지도 · 업소 ';\n const focus=clusterView(places);");
 s=s.replace(/좌표 미등록/g,'지도 위치 확인 필요');
 const locationNotice='${hasCoord?"":"<div class=\\"pop-sub\\">정확한 지도 위치는 방문 전에 확인해 주세요.</div>"}';
 s=s.split(locationNotice).join('');
 s=s.replace(/(<div class="pop-sub pop-address">\$\{esc\(p\.address\)\}<\/div>)/,'$1${hasCoord?"":"<div class=\\"pop-sub\\">정확한 지도 위치는 방문 전에 확인해 주세요.</div>"}');
 s=s.replace(/<div class="pop-actions">\$\{digits\?/,`<div class="pop-actions">\${p.address?\`<a class="pop-link" href="https://map.kakao.com/link/search/\${encodeURIComponent(p.address)}" target="_blank" rel="noopener noreferrer">주소 검색</a>\`:''}\${digits?`);
 const mapUrl='https://albam09.com/'+(board==='index'?'map/':`map/${board}/`);
 s=head(s,{title:label+' 업소 위치 지도 | 광주버블여지도',description:`${label} 업소 ${items.length}곳의 위치 단서와 지도. 업소명·주소로 찾아보고 해당 지역 안내와 비교하세요.`,url:mapUrl,schema:{'@context':'https://schema.org','@type':'CollectionPage',url:mapUrl,name:label+' 업소 위치 지도',isPartOf:{'@id':homeUrl+'#website'},mainEntity:{'@type':'ItemList',numberOfItems:items.length,itemListElement:items.map((v,i)=>({'@type':'ListItem',position:i+1,name:v.name,url:'https://albam09.com/page/'+v.board+'/#venue-'+v.slug}))}}});
 write(file,s);
}

// Global link repairs include legacy articles and historical member posts.
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!e.name.startsWith('.')&&!['dist','node_modules'].includes(e.name)?walk(path.posix.join(dir,e.name)):e.isFile()?[path.posix.join(dir,e.name)]:[]);}
const htmlFiles=walk('').filter(p=>p.endsWith('.html'));
const taxonomy=json('data/bbs-region-taxonomy.json');
for(const r of Object.values(regions))if(taxonomy.regions[r.board])taxonomy.regions[r.board].label=r.label;
write('data/bbs-region-taxonomy.json',JSON.stringify(taxonomy,null,2)+'\n');
const changedBbsPaths=new Set();
for(const [id,entry] of Object.entries(taxonomy.articles)){
 const r=regions[entry.region],file=`bbs/${id}/index.html`;
 if(!r||!fs.existsSync(path.join(root,file)))continue;
 let s=read(file);
 const old=s,items=forBoard(r.board);
 const previous=s.match(/<ul class="bbs-venue-evidence">([\s\S]*?)<\/ul>/)?.[1]||'';
 const desired=[...previous.matchAll(/\/place\/([a-z0-9_-]+)\//gi)].map(m=>venues.find(v=>v.slug===m[1])).filter(v=>v?.board===r.board);
 const picks=[...new Map([...desired,...items].map(v=>[v.slug,v])).values()].slice(0,3);
 const list=`<ul class="bbs-venue-evidence">${picks.map(v=>`<li><strong>${esc(v.name)}</strong> — 위치 안내: ${esc(location(v))}${v.hours?'. 운영 안내: '+esc(v.hours):''}. <a href="${route(v)}">업소 위치 확인</a></li>`).join('')}</ul>`;
 s=s.replace(/<ul class="bbs-venue-evidence">[\s\S]*?<\/ul>/,list);
 const corrections=[
  ['용봉동 목록에도 신안동·유동 주소가 표시된 매장이 있어 실제 모임 장소에서의 이동 경로를 확인해야 합니다.','용봉동 목록과 신안동·유동 목록을 구분했으므로 실제 모임 장소에 맞는 지역을 선택하세요.'],
  ['용봉동에서 전남대 후문 일대를 기준으로 찾더라도 등록 위치에 신안동이 포함될 수 있어 상호와 주소를 같이 읽어야 합니다.','전남대 후문에서 출발한다면 용봉동 업소와 신안동·유동 업소를 구분하고 상호와 주소를 같이 읽어야 합니다.'],
  ['이 페이지에는 상무지구 치평동 소재 업소와 광천동·화정동 방향으로 안내된 업소가 함께 있어 주소 구분이 중요합니다.','광천동 출발지와 화정동 등 실제 방문할 목적지는 구분해야 합니다. 치평동 소재로 안내된 업소는 상무지구 목록에서 볼 수 있습니다.'],
  ['용봉동 등록 주소가 구체적으로 적힌지, 북구 다른 동 주소가 섞였는지,','용봉동 등록 주소가 구체적으로 적힌지, 출발지에서 목적지까지 이동 경로가 어떤지,']
 ];
 for(const [from,to] of corrections)s=s.split(from).join(to);
 if(s!==old){changedBbsPaths.add('/bbs/'+id+'/');
  s=s.replace(/(<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>)([\s\S]*?)(<\/script>)/gi,(all,open,body,close)=>{
   try{const d=JSON.parse(body);const objects=d['@graph']||[d];for(const obj of objects)if(/Article|BlogPosting/.test(String(obj['@type'])))obj.dateModified=updated;return open+serial(d)+close;}catch{return all;}
  });
 }
 write(file,s);
}

// Keep article previews on their own primary regional archive.
for(const r of Object.values(regions)){
 const ids=(taxonomy.regions[r.board]?.article_ids||[]).filter(id=>fs.existsSync(path.join(root,`bbs/${id}/index.html`)));
 const previews=ids.slice(0,5).map(id=>{
  const page=read(`bbs/${id}/index.html`),title=page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||taxonomy.articles[id]?.title||'';
  return `<a class="home-bbs-item" href="/bbs/${id}/"><span class="region">${esc(r.label)}</span><span class="title">${title}</span></a>`;
 }).join('');
 const file=`page/${r.board}/index.html`;let s=read(file);
 s=s.replace(new RegExp(`<section\\b(?=[^>]*data-bbs-region=["']${r.board}["'])[^>]*>[\\s\\S]*?<\\/section>`),`<section aria-label="${esc(r.label)} 기사게시판" class="home-bbs-preview regional-bbs-preview info-fold-card info-bbs-card" data-bbs-region="${r.board}"><details class="bbs-preview-fold"><summary><span class="bbs-preview-fold__title">${esc(r.label)} 기사게시판 (${ids.length}개)</span><span class="bbs-preview-fold__action" aria-hidden="true">보기</span></summary><div class="bbs-preview-fold__content">${previews}<p><a href="/bbs/region/${r.board}/">지역 기사 전체 보기 ›</a></p></div></details></section>`);
 write(file,s);
}

for(const file of htmlFiles){
 let s=read(file);
 if(!s.includes('albam09-v9-final.css')){const depth=file.split('/').length-1;const prefix=file==='explore/post/index.html'?'/':'../'.repeat(depth);s=s.replace('</head>',`<link rel="stylesheet" href="${prefix}css/albam09-v9-final.css?v=${release}" data-ab09-v9="1">\n</head>`);}
 for(const v of venues){
  const encoded=encodeURIComponent(v.slug);
  s=s.replace(new RegExp(`/map/karaoke[1-8]/\\?venue=${encoded}(?=[&"'<>\\s])`,'g'),route(v));
 }
 s=s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
 s=s.replace(/(src=["'](?:\.\.\/)*data\/(?:public-venues|pages\/(?:index|karaoke[1-8]|room))\.js)\?[^"']*/g,`$1?v=${release}`);
 s=s.replace(/(src=["'](?:\.\.\/)*js\/(?:nearest|site-search|explorer-post)\.js)(?:\?[^"']*)?/g,`$1?v=${release}`);
 s=s.replace(/상무\s*·\s*광천동/g,'광천동·서구권');
 s=s.replace(/광천동·금호동/g,'광천동·서구권');
 write(file,s);
}

for(const file of walk('js').filter(p=>p.endsWith('.js')).concat('scripts/build-site.mjs')){
 let s=read(file).replace(/상무\s*·\s*광천동/g,'광천동·서구권');
 if(file==='js/site-search.js')s=s.replace(/var SEARCH_ITEMS = (\[[\s\S]*?\]);/,(_all,body)=>{
  const entries=JSON.parse(body);
  for(const item of entries){
   if(item.region==='서구2'){item.name='광천동·서구권';item.aliases=['광천동','광천','화정동','화정','서구2','유스퀘어','광천동 목록'];}
   if(item.region==='북구2'){item.name='신안동·유동';item.aliases=['신안동','신안','유동','광주역','북구2','신안동 목록'];}
  }
  return 'var SEARCH_ITEMS = '+JSON.stringify(entries)+';';
 });
 if(file==='js/site-search.js'){
  s=s.replace("kind:'업소',region:region,aliases:[name,region+' '+name", "kind:'업소',region:region,area:v.area||'',aliases:[name,(v.area||region)+' '+name,name+' '+(v.area||region),region+' '+name");
  s=s.replace("var meta=[it.kind,it.region].filter(Boolean).join(' · ');", "var regionNames={'서구1':'상무지구','서구2':'광천동·서구권','북구1':'용봉동','북구2':'신안동·유동','광산구':'첨단지구'};var meta=[it.kind,it.area||regionNames[it.region]||it.region].filter(Boolean).join(' · ');");
 }
 write(file,s);
}

const geo={'@context':'https://schema.org','@type':'Dataset',name:'광주버블여지도 지역별 공개 안내',description:'공개된 지역별 업소·지도·탐험기 안내 경로. 업소의 현장 영업·요금·정확한 지도 위치 검증과는 구분합니다.',url:homeUrl,inLanguage:'ko-KR',dateModified:updated,hasPart:Object.values(regions).map(r=>({'@type':'WebPage',name:r.h1,url:regionUrl(r.board),description:r.intro}))};
write('data/geo-catalog.json',JSON.stringify(geo,null,2)+'\n');write('geo-catalog.json',read('data/geo-catalog.json'));
const geoText='# 광주버블여지도 지역 안내\n\n'+Object.values(regions).map(r=>`${r.label}\n${regionUrl(r.board)}\n${r.intro}\n`).join('\n');
write('data/geo-catalog.txt',geoText);write('geo-catalog.txt',geoText);
write('llms.txt','# 광주버블여지도\n\n광주·목포 지역별 업소와 지도·회원 탐험기 안내입니다.\n\n## 지역 페이지\n'+Object.values(regions).map(r=>`- [${r.label}](${regionUrl(r.board)})`).join('\n')+'\n\n## 커뮤니티\n- https://albam09.com/explore/\n- https://albam09.com/bbs/\n\n## 공개 자료\n- https://albam09.com/geo-catalog.json\n- https://albam09.com/geo-catalog.txt\n- https://albam09.com/sitemap.xml\n\n공개 자료의 위치 단서와 검증된 사업장 정보는 구분해서 사용하세요.\n');

let redirects=read('_redirects');
for(const r of Object.values(regions)){
 const rule=`/page/${r.board}/index.html /page/${r.board}/ 301!`;
 if(!redirects.includes(rule))redirects+='\n'+rule;
}
write('_redirects',redirects.trimEnd()+'\n');
let headers=read('_headers');
if(!headers.includes('# SEARCH_DIRECTORY_RELEASE'))headers+='\n# SEARCH_DIRECTORY_RELEASE\n/data/venue-directory.json\n  X-Robots-Tag: noindex, nosnippet\n/data/region-guide-content.json\n  X-Robots-Tag: noindex, nosnippet\n/data/release.json\n  X-Robots-Tag: noindex, nosnippet\n/docs/*\n  X-Robots-Tag: noindex, nofollow\n';
write('_headers',headers);
let netlify=read('netlify.toml');
netlify=netlify.replace('command = "node scripts/check-release.mjs && node scripts/build-site.mjs"','command = "node scripts/build-search-pages.mjs && node scripts/check-release.mjs && node scripts/build-site.mjs"');
write('netlify.toml',netlify);

let sitemap=read('sitemap.xml');
const changedPaths=new Set(['/',...Object.keys(regions).map(b=>`/page/${b}/`),'/map/',...Object.keys(regions).map(b=>`/map/${b}/`),...changedBbsPaths]);
sitemap=sitemap.replace(/<url>[\s\S]*?<\/url>/g,entry=>{
 const loc=entry.match(/<loc>https:\/\/albam09\.com([^<]*)<\/loc>/)?.[1];
 if(!changedPaths.has(loc))return entry;
 return /<lastmod>/.test(entry)?entry.replace(/<lastmod>[^<]*<\/lastmod>/,`<lastmod>${updated}</lastmod>`):entry.replace('</url>',`<lastmod>${updated}</lastmod></url>`);
});
write('sitemap.xml',sitemap);
write('data/release.json',JSON.stringify({release,updatedAt:updated,directorySha256:createHash('sha256').update(serial(venues)).digest('hex'),venueCount:venues.length,regions:Object.fromEntries(Object.keys(regions).map(b=>[b,forBoard(b).length]))},null,2)+'\n');
console.log(`[search-build] ${release}: ${venues.length} venues; `+Object.keys(regions).map(b=>`${b}=${forBoard(b).length}`).join(', '));
