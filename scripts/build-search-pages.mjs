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
const pinAddresses=json('data/map-pin-addresses.json').points;
const venues=source.venues;
const release=source.release;
const updated=source.updatedAt;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const serial=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const regionData=[["karaoke1", "서구1", "상무지구", "상무지구노래방 · 상무지구가라오케", "상무지구 노래방·가라오케 업소 지도", "치평동 상무지구 노래방과 상무지구 가라오케를 찾는다면 상무역 부근 노래방, 상무역 부근 가라오케, 광주광역시청 인근 노래홀을 서로 다른 위치 검색어로 비교해 보세요. 라마다호텔·센트럴호텔 주변으로 안내되는 곳도 실제 카드 주소와 지도 핀을 확인해야 합니다.", "상무역 근처 가라오케와 치평동 노래주점은 가까워 보이더라도 업소마다 건물과 출입구가 다릅니다. 상무중앙로·상무연하로 부근 노래방을 찾을 때는 지도 핀 기준 건물 주소와 실제 입점 주소를 구분하고, 방문 전 층수·예약·운영시간·주차장 정보를 확인하세요. 광천동 노래방과 화정동 가라오케는 서구권 페이지에서 별도로 살펴볼 수 있습니다."], ["karaoke2", "서구2", "광천동·서구권", "광천동노래방 · 광천동가라오케", "광천동 노래방·가라오케와 서구권 이동 안내", "광천동 노래방·광천동 가라오케와 유스퀘어 부근 노래방을 찾는 경우 금호월드, 광주신세계 주변의 출발지와 실제 업소 소재지를 나눠서 비교하세요. 이 목록에는 화정동으로 안내된 업소도 포함되어 있어 모든 업소가 광천동 안에 있는 것은 아닙니다.", "광주종합버스터미널 근처 가라오케, 광천동 노래주점, 화정동 노래방을 함께 검색한다면 실제 건물 주소와 서구 내 이동 거리를 확인하세요. 광천동에서 출발해 상무지구 노래방으로 이동할 계획이면 상무지구 페이지를 별도로 이용하고, 터미널·백화점 주차와 목적지 주차 조건은 구별해야 합니다."], ["karaoke3", "북구2", "신안동·유동", "신안동노래방 · 신안동가라오케", "신안동 노래방·가라오케와 유동 업소 지도", "신안동 노래방과 신안동 가라오케를 찾을 때는 광주역 부근 노래방, 광주역 주변 노래홀, 유동 노래방을 각각 검색해 보세요. 중흥로·경양로·무등로 일대의 업소는 실제 기록된 도로명·지번 주소와 지도 핀을 대조할 수 있습니다.", "광주역 근처 가라오케, 신안동 노래주점, 유동 노래홀은 같은 북구권이라도 도착할 건물이 다릅니다. 광주역 노래방 검색 후 해당 카드의 건물 번호와 층수 표기를 확인하고, 등록 주소가 아닌 지도 핀 참고 주소는 별도로 구분하세요. 전남대 후문 노래방은 용봉동 페이지에서 찾을 수 있습니다."], ["karaoke4", "북구1", "용봉동", "용봉동노래방 · 용봉동가라오케", "용봉동 노래방·가라오케와 저불로 업소 안내", "용봉동 노래방·용봉동 가라오케를 검색하는 경우 전남대 후문 부근 노래방, 전남대학교 후문 가라오케, 저불로 노래홀을 함께 살펴보세요. 등록 자료에 포함된 저불로·전철우사거리 일대 업소를 위치별로 비교할 수 있습니다.", "전남대 후문 근처 노래방과 비엔날레 부근 가라오케는 같은 용봉동 검색어라도 거리가 다를 수 있습니다. 저불로 노래주점·용봉동 노래홀의 기재된 주소, 지도상 건물 위치, 주차 가능한 장소를 확인하고 신안동·유동 업소는 북구의 별도 목록에서 비교하세요."], ["karaoke5", "광산구", "첨단지구", "첨단지구노래방 · 첨단지구가라오케", "첨단지구 노래방·가라오케와 쌍암동 업소 지도", "첨단지구 노래방과 첨단지구 가라오케는 쌍암동 노래방, 첨단중앙로 부근 노래홀, 쌍암공원 근처 가라오케 같은 구체적인 위치 검색어로 비교하세요. 등록된 주소가 있는 업소와 지도 핀만 있는 업소를 구분해 표시합니다.", "광주 첨단 가라오케·쌍암동 노래주점을 찾을 때 첨단중앙로 주변 업소와 쌍암공원 인근을 한 장소로 간주하지 마세요. 첨단지구 노래홀의 상호, 건물 번지, 지도 참고 위치를 비교하고 주차장이나 룸 구성은 해당 업소에서 확인해야 합니다."], ["karaoke6", "목포", "목포·남악", "목포노래방 · 목포가라오케", "목포 노래방·가라오케와 남악권 위치 안내", "목포 노래방·목포 가라오케는 하당 노래방, 평화광장 부근 가라오케, 목포 상동 노래홀, 남악 가요주점처럼 생활권별로 찾아보세요. 목포시와 무안군 남악읍은 행정구역이 달라 실제 방문 주소를 확인하는 것이 중요합니다.", "목포 하당 가라오케·평화광장 근처 노래방을 찾는다면 목포역 주변 노래방과 이동 경로를 분리해 확인하세요. 남악 가라오케 검색 결과는 목포 업소와 혼동하지 말고 지도상의 건물 주소, 주차 위치, 영업 정보를 개별적으로 확인해야 합니다."], ["karaoke7", "동구", "광주 동구", "광주동구노래방 · 광주동구가라오케", "광주 동구 노래방·가라오케와 충장로 이동 안내", "광주 동구 노래방과 광주 동구 가라오케를 찾는 방문자를 위해 충장로 부근 노래방, 금남로 가라오케, 문화전당역 근처 노래홀의 위치 기준을 안내합니다. 현재 이 페이지에 등록된 업소는 없으며, 실제 영업장 주소가 확인되면 추가합니다.", "충장로 노래방·금남로 노래주점 검색 시 국립아시아문화전당 부근이라는 설명만으로 업소가 있다고 단정할 수 없습니다. 동명동 가라오케 등 동구 관련 검색어를 구분하되, 미등록 업소명·가격·주차 가능 여부를 만들어 게시하지 않습니다."], ["karaoke8", "남구", "광주 남구", "광주남구노래방 · 광주남구가라오케", "광주 남구 노래방·가라오케와 봉선동 이동 안내", "광주 남구 노래방·광주 남구 가라오케를 찾을 때 봉선동 노래방, 진월동 가라오케, 백운광장 부근 노래홀을 지역별로 나눠 살펴볼 수 있습니다. 현재 이 페이지에 등록된 업소는 없으며, 지역 이동 정보만 제공합니다.", "봉선동 가라오케·백운광장 근처 노래방·진월동 노래주점 검색은 서로 다른 위치를 가리킵니다. 실제 등록 업소가 없는 단계에서 주월동·봉선동의 미확인 업체를 있는 것처럼 보여주지 않으며, 확인 가능한 주소 자료가 생기면 지역별로 분류합니다."]];
const regions=Object.fromEntries(regionData.map(([board,region,label,h1,title,intro,more])=>[board,{board,region,label,h1,title,intro,more}]));
const forBoard=board=>venues.filter(v=>v.board===board);
const route=v=>`/map/${v.board}/?venue=${encodeURIComponent(v.slug)}`;
const regionUrl=board=>`https://albam09.com/page/${board}/`;
// Never imply a pin lookup proves the business occupies that building.
// For unverified points prefer the administrative address and a map-coordinate link.
const location=v=>v.addressPrecision==='street'?v.address:(v.address||v.area);
const hasPin=v=>Number.isFinite(v.lat)&&Number.isFinite(v.lng);
const pinFor=v=>hasPin(v)?(pinAddresses[`${v.lat.toFixed(7)},${v.lng.toFixed(7)}`]||null):null;
const displayAddress=v=>v.addressPrecision==='street' && /\d/.test(v.address||'') ? v.address : (pinFor(v)?.road || pinFor(v)?.parcel || location(v));
const pinAddressStatus=v=>v.addressPrecision==='street' && /\d/.test(v.address||'')?'등록된 건물 주소':pinFor(v)?'지도 핀 기준 건물 주소':'세부 주소 확인 필요';
const operatingLabel=v=>{const h=String(v.hours||'').trim();return h && !/(문의|확인|미정|없음)/.test(h) ? h : '';};
const venueIntros=json('data/venue-original-intros-11-20261030.json').introductions;
// Keep the current Kakao map presentation, including the venue's name on its pin.
// When there is no point, search the recorded address, then the venue in its region.
const pinSearch=v=>hasPin(v)
 ? 'https://map.kakao.com/link/map/'+encodeURIComponent(v.name)+','+v.lat+','+v.lng
 : 'https://map.kakao.com/link/search/'+encodeURIComponent(v.addressSearchText&&/\d/.test(v.addressSearchText)?v.addressSearchText:[v.area,v.name].filter(Boolean).join(' '));

if(!venues.length||new Set(venues.map(v=>v.slug)).size!==venues.length)throw Error('Directory must contain distinct venue slugs');
if(!pinAddresses||Object.keys(pinAddresses).length===0)throw Error('Saved map addresses are missing');
const pinMarker=/\/\* PIN_ADDRESS_DATA_START \*\/[\s\S]*?\/\* PIN_ADDRESS_DATA_END \*\//;
const oldMapView=read('js/map-view.js');
if(!pinMarker.test(oldMapView))throw Error('Map address data marker is missing');
write('js/map-view.js',oldMapView.replace(pinMarker,()=>`/* PIN_ADDRESS_DATA_START */${serial(pinAddresses)}/* PIN_ADDRESS_DATA_END */`));
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
const contact=`<article id="affiliate-contact" class="ab09-partner-card" aria-label="무료제휴 문의"><div class="ab09-partner-card__media"><img src="/img/favicon/apple-touch-icon.png" alt="광주버블여지도" loading="lazy" width="128" height="128"><span class="ab09-partner-card__brand">광주버블여지도</span></div><details><summary><strong>무료제휴 문의</strong><span class="ab09-partner-card__button">상세보기</span></summary><div class="ab09-partner-card__links"><a href="mailto:groogaolove@gmail.com">이메일 · groogaolove@gmail.com</a><a href="https://t.me/medic0111" target="_blank" rel="noopener noreferrer">텔레그램 · @medic0111</a></div></details></article>`;
function cards(r,items){
 return `<section list=""><h2 id="spots">${esc(r.label)} 업소 목록</h2><div wrapper="">${items.map(v=>thumb(v)).join('')}${items.length?'':`<p class="directory-empty">현재 공개된 ${esc(r.label)} 업소 정보가 없습니다. 아래 지역 안내와 기사를 참고하세요.</p>`}</div>${contact}</section>`;
}
function businessInfo(r,items){
 if(!items.length)return '';
 return `<section class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>업소별 주소·이용 정보</span><span aria-hidden="true" class="business-description-fold__action">보기</span></summary><div class="business-description-fold__content"><h2>${esc(r.label)} 업소별 위치 정보</h2><p class="directory-note">등록 주소와 지도 핀 기준 건물 주소는 구분해서 표기합니다. 지도 핀은 실제 영업장 입점 확인 자료가 아닙니다.</p><div class="business-desc-grid">${items.map(v=>{const addr=displayAddress(v),status=pinAddressStatus(v),time=operatingLabel(v),pin=!!pinFor(v),registered=status==='등록된 건물 주소';const context=registered?`${v.name} 등록 자료의 건물 주소로, 현재 입점·출입구·층수는 현장 확인이 필요합니다.`:pin?`${v.name} 지도 핀 좌표를 역조회한 위치입니다. 이 번지에 해당 업소가 실제로 입점했는지는 확인되지 않았습니다.`:`${v.name}은 ${v.area} 지역 정보만 확인되었습니다. 정확한 도로명·지번과 영업장 위치는 아직 확인되지 않았습니다.`;return `<article class="business-desc-card" id="venue-${esc(v.slug)}"><div class="business-desc-copy"><a class="business-desc-card__title-link" href="${route(v)}"><span class="business-desc-card__title">${esc(v.name)}</span></a><div class="business-desc-card__facts"><span class="business-desc-fact business-desc-fact--location" title="${esc(status)}: ${esc(addr)}"><b>${esc(status)}</b> ${esc(addr)}</span>${time?`<span class="business-desc-fact business-desc-fact--hours"><b>기재된 이용시간(재확인 필요)</b> ${esc(time)}</span>`:''}</div><p class="directory-location-kind">${esc(context)}</p><a class="directory-map-pin" href="${esc(pinSearch(v))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(v.name)} 지도 위치 확인">지도·길찾기 ↗</a>${v.phone?`<a class="directory-phone" href="tel:${v.phone.replace(/\D/g,'')}">${esc(v.phoneLabel)} ${esc(v.phone)}</a>`:''}</div><a class="business-desc-card__button" href="${route(v)}" aria-label="${esc(v.name)} 상세보기">상세보기</a></article>`;}).join('')}</div></div></details></section>`;
}
function guide(r){
 const i=r.board.replace('karaoke','');
 const links=[['#spots','업소 목록'],[`/map/${r.board}/`,'지역 지도'],[`/explore/${r.board}/`,'최신 탐험기'],[`/bbs/region/${r.board}/`,'지역 기사'],[`#ab09-region-${i}-1`,'주차·이동 안내']];
 return `<section aria-label="${esc(r.label)} 이용 안내" class="business-description-section business-description-showcase info-fold-card info-guide-card" data-region-story="${r.board}"><nav class="ab09-region-intent" aria-label="${esc(r.label)} 바로가기"><h2>${esc(r.label)} 이용 정보</h2><div class="ab09-region-intent__links">${links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</div></nav><details class="business-description-fold"><summary><span>${esc(r.label)} 교통·주차·모임 안내</span><span aria-hidden="true" class="business-description-fold__action">보기</span></summary><div class="business-description-fold__content">${guides[r.board]}</div></details></section>`;
}

// Static HTML and browser data are generated together. A deployment cannot
// accidentally keep the old nine-venue Yongbong payload after changing its HTML.
const publicRows=venues.map(v=>({slug:v.slug,id:v.id,name:v.name,title:v.title,region:v.region,board:v.board,phone:v.phone,lat:v.lat,lng:v.lng,address:v.address,displayAddress:displayAddress(v),addressStatus:pinAddressStatus(v),locationHint:v.locationHint,area:v.area,image:v.image,coordinateStatus:v.coordinateStatus,addressSearchText:v.addressSearchText||'',buildingAddressCrosschecked:!!v.buildingAddressCrosschecked,businessLocationVerified:!!v.businessLocationVerified,pinKind:v.pinKind||'none'}));
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
home=block(home,'HERO','<section title=""><h1 class="daum-wm-title">광주노래방 · 광주가라오케 지역지도</h1><p class="hero-keyline">광주·목포 노래방·가라오케 지역별 검색</p><p class="daum-wm-content hero-desc">상무지구 노래방·상무지구 가라오케부터 광주역 신안동 노래홀, 전남대 후문 용봉동 노래방, 첨단지구 쌍암동 가라오케, 광천동·유스퀘어 주변 노래방, 목포 하당 노래방까지 지역별 검색어로 업소와 지도 정보를 찾아보세요. 등록 주소와 지도 핀 참고 주소를 구분해 확인할 수 있으며, 동구·남구처럼 아직 등록 업소가 없는 지역은 지역 안내를 제공합니다.</p></section>');
function homeSpotlight(v,index,total){
 return `<a class="ab09-spotlight" href="${route(v)}" aria-label="${esc(v.name)} 지도 위치 보기"><span class="ab09-spotlight__media"><img src="${esc(v.image)}" alt="${esc(v.name)} 등록 이미지" loading="lazy" decoding="async"></span><span class="ab09-spotlight__veil" aria-hidden="true"></span><span class="ab09-spotlight__content"><span class="ab09-spotlight__eyebrow">VENUE <b>${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</b></span><strong class="ab09-spotlight__name">${esc(v.name)}</strong><span class="ab09-spotlight__cta">지도에서 보기 <span aria-hidden="true">↗</span></span></span></a>`;
}
const homeCards=Object.values(regions).map(r=>{
 const rows=forBoard(r.board);
 const preview=rows.length
  ? `<li class="is-active ab09-spotlight-host" data-preview-item><div class="ab09-venue-rail" role="group" aria-roledescription="슬라이더">${rows.slice(0,2).map((v,i)=>homeSpotlight(v,i,rows.length)).join('')}</div></li>`
  : '<li empty="">현재 등록 업소 없음 · 지역 안내 보기</li>';
 return `<ul class="rotating-list-container${rows.length?'':' is-empty-region'}" data-card-href="/page/${r.board}/" data-region-preview="${r.board}" id="${r.board}-list"><li class="rotating-list-heading" empty=""><h3><a href="/page/${r.board}/">${esc(r.h1)} (${rows.length}개)</a></h3></li>${preview}</ul>`;
}).join('');
const homeContact=contact;
home=block(home,'VENUE_CARDS',`<section list=""><h2>지역별 업소 탐색</h2><div wrapper="">${homeCards}${homeContact}</div></section>`);
if(!home.includes('albam09-v11-spotlight.css'))home=home.replace('</head>','<link rel="stylesheet" href="css/albam09-v11-spotlight.css?v=20261108-v11">\n</head>');
home=block(home,'BRAND_GUIDE','');
// Original 11 detail-copy is read-only reference material: only its original text is reproduced on the 09 index.
const copiedIntros=venues.filter(v=>venueIntros[v.slug]);
const introCards=copiedIntros.map(v=>`<article class="ab09-index-intro-card"><h3>${esc(v.name)} · ${esc(regions[v.board].label)}</h3><p>${esc(venueIntros[v.slug])}</p><a href="/page/${v.board}/#venue-${esc(v.slug)}">${esc(regions[v.board].label)} 위치 정보 확인</a></article>`).join('');
home=block(home,'HOME_DIRECTORY',`<section id="index-original-intros" class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>등록 업소 소개 더보기 (${copiedIntros.length}건)</span><span class="business-description-fold__action" aria-hidden="true">보기</span></summary><div class="business-description-fold__content"><h2>광주·목포 등록 업소 기존 소개</h2><p class="directory-note">기존 업소 상세 페이지에 기재된 소개 문구를 원문 그대로 옮겼습니다. 이 내용은 업소 측의 소개 자료이며 사실 검증된 운영·가격 보증이 아닙니다.</p><div class="ab09-index-intro-grid">${introCards}</div></div></details></section>`);
home=block(home,'HOME_SECONDARY','<section id="index-secondary-search-guide" class="business-description-section business-description-showcase info-fold-card info-guide-card"><details class="business-description-fold"><summary><span>탐험기·지역 기사 이용 안내</span><span class="business-description-fold__action" aria-hidden="true">보기</span></summary><div class="business-description-fold__content"><p><a href="/explore/">탐험기</a>에서는 공개된 회원 방문 기록을, <a href="/bbs/">기사게시판</a>에서는 지역별 이동·주차·이용 정보 글을 볼 수 있습니다. 후기 작성 시 방문한 업소와 실제 지역을 선택해 주세요.</p></div></details></section>');
const homeUrl='https://albam09.com/';
home=head(home,{title:'광주노래방 · 광주가라오케 지역지도 | 광주버블여지도',description:'광주·목포 노래방·가라오케 지역지도. 상무지구, 광천동·서구권, 신안동·유동, 용봉동, 첨단지구 등 지역별 업소와 지도·탐험기를 찾아보세요.',url:homeUrl,schema:{'@context':'https://schema.org','@graph':[org,{'@type':'WebSite','@id':homeUrl+'#website',url:homeUrl,name:'광주버블여지도',inLanguage:'ko-KR',publisher:{'@id':org['@id']}},{'@type':'CollectionPage','@id':homeUrl+'#webpage',url:homeUrl,name:'광주·목포 노래방·가라오케 지역지도',mainEntity:{'@id':homeUrl+'#regions'}},{'@type':'ItemList','@id':homeUrl+'#regions',name:'지역별 안내',numberOfItems:8,itemListElement:Object.values(regions).map((r,i)=>({'@type':'ListItem',position:i+1,name:r.label,url:regionUrl(r.board)}))}]}});
if(!home.includes('js/home-region-preview.js'))home=home.replace('</body>','<script src="js/home-region-preview.js?v=20261108-v11" defer></script>\n</body>');
else home=home.replace(/js\/home-region-preview\.js\?v=[^"']+/g,'js/home-region-preview.js?v=20261108-v11');
write('index.html',home);

const mapRows=venues.map(v=>({name:v.name,area:v.area,address:displayAddress(v),addressStatus:pinAddressStatus(v),lat:v.lat,lng:v.lng,url:v.detailUrl,slug:v.slug,board:v.board,phone:v.phone,image:v.image,addressVerified:!!v.businessLocationVerified,buildingAddressCrosschecked:!!v.buildingAddressCrosschecked,addressSearchText:v.addressSearchText||'',pinKind:v.pinKind||'none',locationStatus:v.coordinateStatus,pinAddress:pinFor(v)}));
for(const board of ['index',...Object.keys(regions),'room']){
 const file=board==='index'?'map/index.html':`map/${board}/index.html`;
 if(!fs.existsSync(path.join(root,file)))continue;
 const r=regions[board],items=board==='index'?venues:forBoard(board);
 let s=read(file).replace(/const places=\[[\s\S]*?\];/,`const places=${serial(mapRows)};`);
 s=s.replace(/const initialRegionSlugs=[\s\S]*?;/,`const initialRegionSlugs=${board==='index'?'null':serial(items.map(v=>v.slug))};`);
 const label=r?.label||(board==='index'?'전체 지역':'룸소주방');
 s=s.replace(/(<h1 class="panel-title"[^>]*>)[^<]*/,'$1'+esc(label)+' 지도 · 업소 ');
 s=s.replace(/(<span id="count">)[\s\S]*?(<\/span>)/,'$1('+items.length+')$2');
 const fallback=items.map(v=>{const area=v.area+(pinFor(v)&&!/\d/.test(v.addressSearchText||v.address||'')?' · 지도 기준':'');return `<div class="place-item"><a class="place-name" href="/page/${v.board}/#venue-${esc(v.slug)}">${esc(v.name)}</a><div class="place-meta">${esc(area)}<br>${esc(displayAddress(v))}</div></div>`;}).join('')||'<p class="panel-note">현재 공개된 업소 정보가 없습니다.</p>';
 s=s.replace(/(<div\b[^>]*\bid="placeList"[^>]*>)[\s\S]*?(<\/div>\s*<\/aside>)/,`$1${fallback}$2`);
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
 const list=`<ul class="bbs-venue-evidence">${picks.map(v=>`<li><strong>${esc(v.name)}</strong> — 위치 안내: ${esc(location(v))}${operatingLabel(v)?'. 기재 시간: '+esc(operatingLabel(v)):''}. <a href="${route(v)}">업소 위치 확인</a></li>`).join('')}</ul>`;
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
 if(s.includes('class="ui-unified-page"')&&s.includes('info-fold-card')&&!s.includes('albam09-v12-ui.css')){s=s.replace('</head>','<link rel="stylesheet" href="/css/albam09-v12-ui.css?v=20261109-v12">\n</head>');}
 const deepTemplate=file==='explore/post/index.html'||file.startsWith('explore/author/');
 if(!s.includes('albam09-v9-final.css')){const depth=file.split('/').length-1;const prefix=deepTemplate?'/':'../'.repeat(depth);s=s.replace('</head>',`<link rel="stylesheet" href="${prefix}css/albam09-v9-final.css?v=${release}" data-ab09-v9="1">\n</head>`);}
 if(deepTemplate)s=s.replace(/href="(?:\.\.\/)+css\/albam09-v9-final\.css([^"\s]*)"/g,'href="/css/albam09-v9-final.css$1"');
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