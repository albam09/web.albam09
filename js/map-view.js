/* V16: shared map with coordinate addresses resilient to older HTML builds. */
(function(){
 'use strict';
 const config=window.ALBAM09_MAP_CONFIG||{},D=window.ALBAM09_MAP_DATA,L=window.L;
 const host=document.getElementById('map'),main=document.getElementById('main');
 if(!host||!main||!D)return;
 // Replaced from data/map-pin-addresses.json at build time. Keeping a copy in
 // this script also covers older map HTML that does not contain pinAddress.
 const savedAddresses=/* PIN_ADDRESS_DATA_START */{"35.1569065,126.8499513":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1211-1번지","source":"지오코더","kind":"pin-address"},"35.1532740,126.8418557":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1162번지","source":"지오코더","kind":"pin-address"},"35.1549492,126.8498460":{"road":"전남광주통합특별시 서구 상무연하로 75","parcel":"전남광주통합특별시 서구 치평동 1217번지","source":"지오코더","kind":"pin-address"},"35.1549797,126.8504826":{"road":"전남광주통합특별시 서구 상무연하로 76","parcel":"전남광주통합특별시 서구 치평동 1218-6번지","source":"지오코더","kind":"pin-address"},"35.1547512,126.8499135":{"road":"전남광주통합특별시 서구 상무연하로 73","parcel":"전남광주통합특별시 서구 치평동 1217-1번지","source":"지오코더","kind":"pin-address"},"35.1546461,126.8504853":{"road":"전남광주통합특별시 서구 상무연하로 72","parcel":"전남광주통합특별시 서구 치평동 1218-4번지","source":"지오코더","kind":"pin-address"},"35.1545890,126.8499258":{"road":"전남광주통합특별시 서구 상무연하로 71","parcel":"전남광주통합특별시 서구 치평동 1217-2번지","source":"지오코더","kind":"pin-address"},"35.1544266,126.8499161":{"road":"전남광주통합특별시 서구 상무연하로 69","parcel":"전남광주통합특별시 서구 치평동 1217-3번지","source":"지오코더","kind":"pin-address"},"35.1543125,126.8504879":{"road":"전남광주통합특별시 서구 상무연하로 68","parcel":"전남광주통합특별시 서구 치평동 1218-3번지","source":"지오코더","kind":"pin-address"},"35.1542733,126.8499173":{"road":"전남광주통합특별시 서구 상무연하로 67","parcel":"전남광주통합특별시 서구 치평동 1217-4번지","source":"지오코더","kind":"pin-address"},"35.1548600,126.8495800":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1217-9번지","source":"지오코더","kind":"pin-address"},"35.1547200,126.8497100":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1217-6번지","source":"지오코더","kind":"pin-address"},"35.1545500,126.8496200":{"road":"전남광주통합특별시 서구 상무중앙로78번길 5-6","parcel":"전남광주통합특별시 서구 치평동 1217-9번지","source":"지오코더","kind":"pin-address"},"35.1543800,126.8497600":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1217-6번지","source":"지오코더","kind":"pin-address"},"35.1542200,126.8495900":{"road":"전남광주통합특별시 서구 상무중앙로78번길 9","parcel":"전남광주통합특별시 서구 치평동 1217-7번지","source":"지오코더","kind":"pin-address"},"35.1540400,126.8497500":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1217-6번지","source":"지오코더","kind":"pin-address"},"35.1538800,126.8496100":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1232번지","source":"지오코더","kind":"pin-address"},"35.1537000,126.8497700":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1233-3번지","source":"지오코더","kind":"pin-address"},"35.1535200,126.8496300":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1233-3번지","source":"지오코더","kind":"pin-address"},"35.1533500,126.8497800":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1233-3번지","source":"지오코더","kind":"pin-address"},"35.1540930,126.8499187":{"road":"전남광주통합특별시 서구 상무연하로 63","parcel":"전남광주통합특별시 서구 치평동 1217-5번지","source":"지오코더","kind":"pin-address"},"35.1540871,126.8504897":{"road":"전남광주통합특별시 서구 상무연하로 66","parcel":"전남광주통합특별시 서구 치평동 1218-2번지","source":"지오코더","kind":"pin-address"},"35.1537413,126.8499106":{"road":"전남광주통합특별시 서구 상무연하로 61","parcel":"전남광주통합특별시 서구 치평동 1233-4번지","source":"지오코더","kind":"pin-address"},"35.1532632,126.8498814":{"road":"전남광주통합특별시 서구 상무연하로 55","parcel":"전남광주통합특별시 서구 치평동 1233-6번지","source":"지오코더","kind":"pin-address"},"35.1525150,126.8499203":{"road":"전남광주통합특별시 서구 상무연하로 47","parcel":"전남광주통합특별시 서구 치평동 1237-1번지","source":"지오코더","kind":"pin-address"},"35.1522477,126.8505153":{"road":"전남광주통합특별시 서구 상무연하로 46","parcel":"전남광주통합특별시 서구 치평동 1238-4번지","source":"지오코더","kind":"pin-address"},"35.1521995,126.8499338":{"road":"전남광주통합특별시 서구 상무연하로 43","parcel":"전남광주통합특별시 서구 치평동 1237-3번지","source":"지오코더","kind":"pin-address"},"35.1510543,126.8499319":{"road":"전남광주통합특별시 서구 상무연하로 31","parcel":"전남광주통합특별시 서구 치평동 1250-2번지","source":"지오코더","kind":"pin-address"},"35.1506666,126.8499240":{"road":"전남광주통합특별시 서구 상무연하로 27","parcel":"전남광주통합특별시 서구 치평동 1250-4번지","source":"지오코더","kind":"pin-address"},"35.1504772,126.8499255":{"road":"전남광주통합특별시 서구 상무중앙로38번길 11","parcel":"전남광주통합특별시 서구 치평동 1250-5번지","source":"지오코더","kind":"pin-address"},"35.1518800,126.8501300":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1232번지","source":"지오코더","kind":"pin-address"},"35.1516600,126.8503400":{"road":"","parcel":"전남광주통합특별시 서구 치평동 1170번지","source":"지오코더","kind":"pin-address"},"35.1636480,126.9036088":{"road":"전남광주통합특별시 북구 중흥로 86","parcel":"전남광주통합특별시 북구 신안동 143-12번지","source":"지오코더","kind":"pin-address"},"35.1609942,126.9069596":{"road":"전남광주통합특별시 북구 경양로 138","parcel":"전남광주통합특별시 북구 유동 101-1번지","source":"지오코더","kind":"pin-address"},"35.1602155,126.9061092":{"road":"전남광주통합특별시 북구 중가로51번길 15","parcel":"전남광주통합특별시 북구 유동 105-2번지","source":"지오코더","kind":"pin-address"},"35.1599127,126.9050464":{"road":"전남광주통합특별시 북구 중가로 43","parcel":"전남광주통합특별시 북구 유동 107-5번지","source":"지오코더","kind":"pin-address"},"35.1595467,126.9057847":{"road":"전남광주통합특별시 북구 중가로 49-1","parcel":"전남광주통합특별시 북구 유동 107-3번지","source":"지오코더","kind":"pin-address"},"35.1601962,126.9058459":{"road":"전남광주통합특별시 북구 경열로233번길 19","parcel":"전남광주통합특별시 북구 유동 105-1번지","source":"지오코더","kind":"pin-address"},"35.1606807,126.9053592":{"road":"전남광주통합특별시 북구 경열로233번길 28","parcel":"전남광주통합특별시 북구 유동 103-10번지","source":"지오코더","kind":"pin-address"},"35.1609376,126.9062687":{"road":"전남광주통합특별시 북구 중가로51번길 29-4","parcel":"전남광주통합특별시 북구 유동 102-12번지","source":"지오코더","kind":"pin-address"},"35.1673042,126.9119215":{"road":"전남광주통합특별시 북구 서암대로 253-10","parcel":"전남광주통합특별시 북구 중흥동 374-54번지","source":"지오코더","kind":"pin-address"},"35.1635570,126.9051632":{"road":"전남광주통합특별시 북구 중흥로 99","parcel":"전남광주통합특별시 북구 신안동 16-5번지","source":"지오코더","kind":"pin-address"},"35.1789200,126.8941800":{"road":"","parcel":"전남광주통합특별시 북구 용봉동 1443번지","source":"지오코더","kind":"pin-address"},"35.2188185,126.8435575":{"road":"전남광주통합특별시 광산구 첨단중앙로152번길 22","parcel":"전남광주통합특별시 광산구 쌍암동 658-4번지","source":"지오코더","kind":"pin-address"},"35.2188108,126.8437883":{"road":"전남광주통합특별시 광산구 첨단중앙로152번길 30","parcel":"전남광주통합특별시 광산구 쌍암동 658-5번지","source":"지오코더","kind":"pin-address"},"35.2192971,126.8436855":{"road":"전남광주통합특별시 광산구 첨단중앙로152번길 31-3","parcel":"전남광주통합특별시 광산구 쌍암동 660-4번지","source":"지오코더","kind":"pin-address"},"35.2186574,126.8437786":{"road":"전남광주통합특별시 광산구 첨단중앙로152번길 6-15","parcel":"전남광주통합특별시 광산구 쌍암동 658-6번지","source":"지오코더","kind":"pin-address"},"35.2188231,126.8427334":{"road":"전남광주통합특별시 광산구 첨단중앙로152번길 6-1","parcel":"전남광주통합특별시 광산구 쌍암동 658-1번지","source":"지오코더","kind":"pin-address"},"34.7984096,126.4294111":{"road":"전남광주통합특별시 목포시 통일대로 40","parcel":"전남광주통합특별시 목포시 상동 1122-11번지","source":"지오코더","kind":"pin-address"},"34.7976411,126.4332907":{"road":"전남광주통합특별시 목포시 평화로83번길 5","parcel":"전남광주통합특별시 목포시 상동 1139-21번지","source":"지오코더","kind":"pin-address"}}/* PIN_ADDRESS_DATA_END */;
 const pointKey=p=>D.hasPoint(p)?p.lat.toFixed(7)+','+p.lng.toFixed(7):null;
 const attachAddresses=D.attachAddresses||((data,saved)=>data.map(p=>({...p,pinAddress:(pointKey(p)&&saved[pointKey(p)])||p.pinAddress||null})));
 const displayAddress=D.displayAddress||(p=>p.address&&/\d/.test(String(p.addressSearchText||p.address))?p.address:(p.pinAddress?.road||p.pinAddress?.parcel||p.address||''));
 const rows=attachAddresses(Array.isArray(config.places)?config.places:[],savedAddresses),bySlug=new Map(rows.map(p=>[p.slug,p]));
 const popup=document.getElementById('popup'),panel=document.getElementById('panel'),list=document.getElementById('placeList'),search=document.getElementById('search');
 const title=panel.querySelector('.panel-title'),note=panel.querySelector('.panel-note'),count=document.getElementById('count');
 const baseTitle=title.firstChild.textContent,baseNote=note.textContent;
 const mobile=window.matchMedia('(max-width:820px)'),reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
 let visible=config.initialRegionSlugs===null?null:new Set(config.initialRegionSlugs||[]),selected=null,markerLayers=[],resizeFrame=0,markerFrame=0,popupKind='venue',popupRows=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=(v,fallback='#')=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)||u.protocol==='file:'?u.href:fallback;}catch{return fallback;}};
 const currentBoard=()=>((location.pathname.match(/\/map\/(karaoke[1-8]|room)(?:\/|$)/)||[])[1]||null);
 const filtered=()=>D.filter(rows,visible,search.value);
 const preloaded=Object.fromEntries(rows.filter(p=>p.pinAddress&&D.hasPoint(p)).map(p=>[pointKey(p),p.pinAddress]));
 const addresses=window.ALBAM09_MAP_ADDRESS?.createClient({key:window.ALBAM09_MAP_PROVIDER?.kakaoJavascriptKey||'',platform:window,preloaded});
 const Geo=window.ALBAM09_MAP_LOCATION;
 let addressRequest=0;
 // Legacy pages nested the side panel and controls inside the old map surface.
 // Move overlays out before Leaflet takes ownership of that surface.
 for(const overlay of [panel,popup,...['zoom','scale','credit','status'].map(id=>document.getElementById(id))])if(overlay)main.appendChild(overlay);
 host.replaceChildren();host.setAttribute('aria-label','업소 위치 지도');
 if(!L){host.innerHTML='<div class="map-load-error">지도를 준비하지 못했습니다. 페이지를 새로고침해 주세요.</div>';return;}
 const map=L.map(host,{zoomControl:false,attributionControl:false,minZoom:8,maxZoom:19,zoomSnap:1,trackResize:false,inertia:!reduced.matches,inertiaMaxSpeed:900,zoomAnimation:!reduced.matches,fadeAnimation:!reduced.matches,markerZoomAnimation:!reduced.matches,bounceAtZoomLimits:false});
 map.setView(config.initialView||[35.1595,126.8526],13,{animate:false});
 const layer=L.tileLayer(config.tileUrl||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:8,maxZoom:19,keepBuffer:2,updateWhenIdle:true,noWrap:true,attribution:'© OpenStreetMap contributors'}).addTo(map);
 const tileStatus=document.createElement('button');tileStatus.className='map-tile-retry';tileStatus.type='button';tileStatus.hidden=true;tileStatus.textContent='배경 지도를 불러오지 못했습니다 · 다시 시도';main.appendChild(tileStatus);
 let failedTiles=0,loadedTiles=0;
 layer.on('loading',()=>{failedTiles=0;loadedTiles=0;});
 layer.on('tileerror',()=>{failedTiles++;});layer.on('tileload',()=>{loadedTiles++;});
 layer.on('load',()=>{tileStatus.hidden=!(failedTiles>0&&loadedTiles===0);});tileStatus.onclick=()=>{tileStatus.hidden=true;layer.redraw();};
 const toggle=document.createElement('button');toggle.type='button';toggle.className='map-list-toggle';toggle.setAttribute('aria-controls','placeList');panel.querySelector('.panel-head').appendChild(toggle);
 function setCollapsed(value){panel.classList.toggle('is-collapsed',value);toggle.setAttribute('aria-expanded',String(!value));toggle.setAttribute('aria-label',value?'업소 목록 펼치기':'업소 목록 접기');toggle.textContent=value?'목록 펼치기':'목록 접기';scheduleResize();}
 toggle.onclick=()=>setCollapsed(!panel.classList.contains('is-collapsed'));setCollapsed(false);
 function setLabel(value,description){title.firstChild.textContent=value;note.textContent=description;}
 function updateQuery(values,path){try{const url=new URL(location.href);if(path)url.pathname=path;for(const [k,v] of Object.entries(values)){if(v===null)url.searchParams.delete(k);else url.searchParams.set(k,v);}history.replaceState(null,'',url.pathname+url.search+url.hash);}catch{}}
 function usable(){const r=main.getBoundingClientRect(),p=panel.getBoundingClientRect();return {left:mobile.matches?10:Math.min(p.width+28,r.width*.48),top:12,right:r.width-12,bottom:r.height-(mobile.matches?p.height+20:26)};}
 function closePopup(){selected=null;popup.hidden=true;popup.style.display='none';popupRows=[];updateQuery({venue:null});renderMarkers();syncActive();}
 function syncActive(){list.querySelectorAll('[data-venue]').forEach(el=>{const on=el.dataset.venue===selected?.slug;el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on));});}
 function renderList(){
  const items=filtered();count.textContent='('+items.length+')';list.replaceChildren();
  if(!items.length){const empty=document.createElement('div');empty.className='map-empty';empty.textContent=search.value?'검색 결과가 없습니다. 검색어를 바꿔 보세요.':'현재 이 지역에 등록된 업소가 없습니다.';list.appendChild(empty);return;}
  const frag=document.createDocumentFragment();
  for(const p of items){const button=document.createElement('button');button.type='button';button.className='place-item';button.dataset.venue=p.slug;const address=displayAddress(p),registered=/\d/.test(p.addressSearchText||p.address||''),area=p.area+(p.pinAddress&&!registered?' · 지도 기준':'');button.title=registered?'등록된 주소':p.pinAddress?'기존 지도 위치 기준 주소':'등록된 지역';button.innerHTML=`<span class="place-name">${esc(p.name)}</span><span class="place-meta">${esc(area)}<br><span class="place-address">${esc(address)}</span></span>`;button.onclick=()=>select(p,true);frag.appendChild(button);}
  list.appendChild(frag);syncActive();
 }
 function groupPoints(items){
  const groups=[];
  for(const p of items){if(!D.hasPoint(p)||p.slug===selected?.slug)continue;const xy=map.project([p.lat,p.lng],map.getZoom()),found=groups.find(g=>Math.hypot(g.xy.x-xy.x,g.xy.y-xy.y)<24);if(found)found.rows.push(p);else groups.push({xy,rows:[p]});}
  if(selected&&D.hasPoint(selected))groups.push({rows:[selected]});return groups;
 }
 function renderMarkers(){
  for(const marker of markerLayers)marker.remove();markerLayers=[];
  const items=selected?rows:filtered(),groups=groupPoints(items);
  for(const group of groups){
   const p=group.rows[0],active=selected?.slug===p.slug,many=group.rows.length>1,label=many?p.name+' 외 '+(group.rows.length-1)+'곳':p.name;
   const icon=L.divIcon({className:'map-venue-icon'+(active?' is-selected':'')+(many?' is-group':''),iconSize:[44,44],iconAnchor:[22,41],html:`<span class="map-pin-label">${esc(label)}</span><span class="map-pin-shape">${many?`<b>${group.rows.length}</b>`:'<i></i>'}</span>`});
   const marker=L.marker([p.lat,p.lng],{icon,title:label,keyboard:true,zIndexOffset:active?10000:0}).addTo(map);
   const el=marker.getElement();if(el)el.setAttribute('aria-label',label+' 위치 보기');
   marker.on('click',()=>{
    if(!many){select(p,true);return;}
    const maxDistance=Math.max(...group.rows.map(x=>D.distance(p,x)));
    if(maxDistance>12&&map.getZoom()<18){fit(group.rows,18);return;}
    selected=null;popupKind='group';popupRows=group.rows;showGroup();
   });markerLayers.push(marker);
  }
 }
 function requestMarkers(){if(markerFrame)return;markerFrame=requestAnimationFrame(()=>{markerFrame=0;renderMarkers();});}
 function positionPopup(){
  if(popup.hidden)return;const u=usable(),w=main.clientWidth,h=main.clientHeight;
  const minLeft=mobile.matches?8:Math.min(u.left,w-260);
  popup.style.maxHeight=Math.max(90,u.bottom-u.top)+'px';
  const point=selected&&D.hasPoint(selected)?map.latLngToContainerPoint([selected.lat,selected.lng]):L.point((u.left+u.right)/2,(u.top+u.bottom)/2);
  const maxLeft=Math.max(8,w-popup.offsetWidth-8),maxTop=Math.max(8,u.bottom-popup.offsetHeight);
  const left=Math.max(8,Math.min(maxLeft,Math.max(minLeft,point.x+18)));
  const top=Math.max(8,Math.min(maxTop,point.y-popup.offsetHeight-26));
  popup.style.left=left+'px';popup.style.top=top+'px';
 }
 function showGroup(){
  popup.hidden=false;popup.style.display='block';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','같은 위치의 업소 선택');
  popup.innerHTML='<button type="button" class="map-popup-close" aria-label="정보창 닫기">×</button><h2 class="pop-title">같은 위치의 업소</h2><div class="map-group-list">'+popupRows.map(p=>`<button type="button" data-group-venue="${esc(p.slug)}">${esc(p.name)}</button>`).join('')+'</div>';
  popup.querySelector('.map-popup-close').onclick=closePopup;popup.querySelectorAll('[data-group-venue]').forEach(b=>b.onclick=()=>select(bySlug.get(b.dataset.groupVenue),true));positionPopup();
 }
 function showPopup(p){
  const lookup=D.lookup(p),digits=String(p.phone||'').replace(/\D/g,'');
  const same=rows.filter(x=>x.slug!==p.slug&&D.hasPoint(x)&&D.hasPoint(p)&&D.distance(x,p)<2);
  popupKind='venue';popup.hidden=false;popup.style.display='block';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',p.name+' 업소 정보');
  popup.innerHTML=`<button class="map-popup-close" type="button" aria-label="정보창 닫기">×</button><div class="pop-top"><img class="pop-image" src="${esc(safeUrl(p.image))}" alt="${esc(p.name)} 업소 사진"><div><h2 class="pop-title">${esc(p.name)}</h2><div class="pop-sub">${esc(p.area)}</div></div></div><div class="pop-sub pop-address">등록 정보 · ${esc(p.address)}</div>${D.hasPoint(p)?'<div class="pop-pin-address" aria-live="polite"></div>':'<p class="pop-sub">등록 좌표가 없습니다.</p>'}<div class="pop-actions">${lookup.url?`<a class="pop-link" href="${esc(lookup.url)}" target="_blank" rel="noopener noreferrer">${esc(lookup.label)}</a>`:''}<button class="pop-link pop-copy-address" type="button" hidden>주소 복사</button>${digits?`<a class="pop-link pop-phone" href="tel:${digits}">전화 ${esc(D.formatPhone(p.phone))}</a>`:''}<a class="pop-link" href="${esc(safeUrl(p.url))}" rel="nofollow noopener">상세보기</a></div>${same.length?'<details class="map-same-location"><summary>같은 등록 위치의 다른 업소</summary>'+same.map(x=>`<button type="button" data-group-venue="${esc(x.slug)}">${esc(x.name)}</button>`).join('')+'</details>':''}`;
  popup.querySelector('.map-popup-close').onclick=closePopup;popup.querySelectorAll('[data-group-venue]').forEach(b=>b.onclick=()=>select(bySlug.get(b.dataset.groupVenue),true));
  popup.querySelectorAll('img').forEach(img=>img.addEventListener('load',positionPopup,{once:true}));positionPopup();
  resolvePinAddress(p);
 }
 async function resolvePinAddress(p){
  const request=++addressRequest,box=popup.querySelector('.pop-pin-address');if(!box||!D.hasPoint(p))return;
  if(!p.pinAddress&&!addresses?.configured&&!addresses?.peek(p)){box.innerHTML='<p>이 지점의 상세 주소를 확인할 수 없습니다.</p>';return;}
  box.textContent='핀 위치 주소를 조회하고 있습니다.';
  try{
   const result=p.pinAddress||await addresses.resolve(p);
   if(request!==addressRequest||selected?.slug!==p.slug||popup.hidden)return;
   box.innerHTML='<strong>지도 주소</strong>'+(result.road?`<p>도로명 · ${esc(result.road)}</p>`:'')+(result.parcel?`<p>지번 · ${esc(result.parcel)}</p>`:'')+`<small>지도에 표시된 지점의 주소 · 제공: ${esc(result.source||'Kakao')}</small>`;
   p.pinAddress=result;
   const row=list.querySelector(`[data-venue="${p.slug}"] .place-address`);if(row)row.textContent=displayAddress(p);
   const copy=popup.querySelector('.pop-copy-address');copy.hidden=false;copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.road||result.parcel);copy.textContent='주소 복사됨';}catch{copy.textContent='주소를 길게 눌러 복사';}};
   positionPopup();
  }catch(e){
   if(request!==addressRequest||selected?.slug!==p.slug||popup.hidden)return;
   box.innerHTML='<p>상세 주소를 불러오지 못했습니다.</p>';
   const retry=document.createElement('button');retry.type='button';retry.className='pin-address-retry';retry.textContent='주소 다시 조회';retry.onclick=()=>resolvePinAddress(p);box.appendChild(retry);positionPopup();
  }
 }
 function fit(items,maxZoom=16){const points=items.filter(D.hasPoint);if(!points.length)return;const u=usable();map.stop();map.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lng])),{paddingTopLeft:[u.left,u.top+32],paddingBottomRight:[main.clientWidth-u.right,main.clientHeight-u.bottom],maxZoom,animate:false});}
 function select(p,focus){
  if(!p)return;map.stop();selected=p;
  if(visible!==null&&!visible.has(p.slug)){visible=new Set(rows.filter(x=>x.board===p.board).map(x=>x.slug));setLabel(p.area+' 지도 · 업소 ',p.area+' 업소 목록입니다.');search.value='';}
  if(mobile.matches)setCollapsed(true);
  renderList();renderMarkers();
  if(focus&&D.hasPoint(p)){map.setView([p.lat,p.lng],Math.max(18,map.getZoom()),{animate:false});const u=usable();map.panBy([main.clientWidth/2-(u.left+u.right)/2,main.clientHeight/2-(u.top+u.bottom)/2],{animate:false});}
  showPopup(p);syncActive();
  updateQuery({venue:p.slug,area:null,scope:null},'/map/'+p.board+'/');
  const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href='https://albam09.com/map/'+p.board+'/';
  document.title=p.name+' 위치 지도 | 광주버블여지도';
 }
 function markChip(chip){document.querySelectorAll('#quick .chip').forEach(b=>{const on=b===chip;b.classList.toggle('selected-area',on);b.setAttribute('aria-pressed',String(on));});}
 function showArea(chip){
  selected=null;popup.hidden=true;popup.style.display='none';search.value='';const label=chip.textContent.trim(),point={lat:Number(chip.dataset.lat),lng:Number(chip.dataset.lng)},items=D.region(rows,label,point);
  visible=new Set(items.map(p=>p.slug));markChip(chip);setCollapsed(false);setLabel(label+(D.boards[label]?' 등록 업소 ':' 인근 업소 '),items.length?label+'에서 찾는 업소 '+items.length+'곳입니다.':'현재 이 지역에 등록된 업소가 없습니다.');renderList();renderMarkers();
  if(items.some(D.hasPoint))fit(items);else if(D.hasPoint(point))map.setView([point.lat,point.lng],15,{animate:false});
  updateQuery({venue:null,area:label,scope:null});
 }
 function restore(all){
  selected=null;popup.hidden=true;popup.style.display='none';search.value='';const board=currentBoard();visible=all||!board?null:new Set(rows.filter(p=>p.board===board).map(p=>p.slug));
  if(!all&&board==='room')visible=new Set(config.initialRegionSlugs||[]);
  markChip(null);setCollapsed(false);setLabel(all?'전체 지역 지도 · 업소 ':baseTitle,baseNote);renderList();renderMarkers();fit(filtered(),all?15:17);updateQuery({venue:null,area:null,scope:all?'all':null});
 }
 document.getElementById('plus').onclick=()=>{map.stop();map.zoomIn();};document.getElementById('minus').onclick=()=>{map.stop();map.zoomOut();};
 document.getElementById('allBtn').onclick=()=>restore(true);document.getElementById('sangmuBtn').onclick=()=>restore(false);
 document.querySelectorAll('#quick .chip').forEach(chip=>{chip.onclick=()=>showArea(chip);chip.setAttribute('aria-pressed','false');});
 search.setAttribute('aria-label','업소명·지역명·주소 검색');search.setAttribute('placeholder','업소명 · 지역명 · 주소 검색');
 let searchTimer=0;search.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{selected=null;popup.hidden=true;popup.style.display='none';setCollapsed(false);renderList();renderMarkers();if(search.value.trim())fit(filtered(),17);updateQuery({venue:null});},120);});
 search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(searchTimer);selected=null;popup.hidden=true;popup.style.display='none';setCollapsed(false);renderList();renderMarkers();fit(filtered(),17);updateQuery({venue:null});search.blur();}});
 map.on('move',positionPopup);map.on('moveend zoomend',()=>{document.getElementById('scale').textContent='확대 '+map.getZoom();requestMarkers();positionPopup();});
 map.on('click',()=>{if(!popup.hidden)closePopup();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!popup.hidden)closePopup();});
 function scheduleResize(){if(resizeFrame)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;map.invalidateSize({pan:true,animate:false,debounceMoveend:true});positionPopup();requestMarkers();});}
 if('ResizeObserver' in window)new ResizeObserver(scheduleResize).observe(main);
 window.addEventListener('resize',scheduleResize);window.visualViewport?.addEventListener('resize',scheduleResize);window.addEventListener('pageshow',scheduleResize);document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleResize();});
 mobile.addEventListener('change',scheduleResize);
 popup.hidden=true;renderList();renderMarkers();fit(filtered(),visible===null?15:17);
 const initialChip=[...document.querySelectorAll('#quick .chip')].find(c=>D.boards[c.textContent.trim()]===currentBoard());if(initialChip)markChip(initialChip);
 const params=new URLSearchParams(location.search),target=bySlug.get(params.get('venue')),area=params.get('area');
 if(target){select(target,true);}else if(area){const chip=[...document.querySelectorAll('#quick .chip')].find(c=>c.textContent.trim()===area);if(chip)showArea(chip);}else if(params.get('scope')==='all')restore(true);
 document.getElementById('allBtn').textContent='전체 업소';
 // Keep the current device's position separate from the venue marker layer.
 if(Geo){
  const toolbar=document.createElement('section');toolbar.className='map-personal-toolbar';toolbar.setAttribute('aria-label','내 위치와 방향');
  toolbar.innerHTML='<div class="map-personal-actions"><button type="button" id="map-locate">◎ 내 위치 확인</button><button type="button" id="map-heading">➤ 바라보는 방향</button><button type="button" id="map-location-stop" hidden>표시 끄기</button></div><p class="map-personal-status" aria-live="polite">위치와 방향은 버튼을 눌러 확인하세요.</p>';
  document.getElementById('quick').after(toolbar);
  const locateButton=toolbar.querySelector('#map-locate'),headingButton=toolbar.querySelector('#map-heading'),stopButton=toolbar.querySelector('#map-location-stop'),statusLine=toolbar.querySelector('.map-personal-status');
  let userMarker=null,accuracyCircle=null,lastPosition=null,follow=false,currentHeading=null,locationMessage='',headingMessage='';
  const updateStatus=()=>{statusLine.textContent=[locationMessage,headingMessage].filter(Boolean).join(' · ')||'위치와 방향은 버튼을 눌러 확인하세요.';};
  function renderHeading(value){
   currentHeading=value;const el=userMarker?.getElement();if(!el)return;
   el.classList.toggle('has-heading',value!==null);el.style.setProperty('--user-heading',(value||0)+'deg');
   el.setAttribute('aria-label',value===null?'내 현재 위치':'내 현재 위치 · '+Geo.cardinal(value)+'쪽 '+Math.round(value)+'도');
  }
  function centerUser(){if(!lastPosition)return;const p=lastPosition;map.stop();map.setView([p.lat,p.lng],p.accuracy<80?18:p.accuracy<400?16:p.accuracy<2000?14:p.accuracy<20000?11:8,{animate:false});const u=usable();map.panBy([main.clientWidth/2-(u.left+u.right)/2,main.clientHeight/2-(u.top+u.bottom)/2],{animate:false});}
  const labels={location:{locating:'위치를 확인하고 있습니다',denied:'위치 권한이 차단되어 있습니다',timeout:'위치 확인 시간 초과 · 다시 눌러 주세요',unavailable:'현재 위치를 확인할 수 없습니다',unsupported:'이 기기는 위치 확인을 지원하지 않습니다',insecure:'HTTPS 주소에서 위치를 확인해 주세요',paused:'위치 확인 일시 정지',off:''},heading:{waiting:'방향 센서 확인 중',denied:'방향 권한이 차단되어 있습니다',unsupported:'이 기기에서 방향 센서 값을 받지 못했습니다',unavailable:'방향 신호를 기다리고 있습니다',insecure:'HTTPS 주소에서 방향을 확인해 주세요',off:''}};
  const controller=Geo.createController({platform:window,onPosition:p=>{
   lastPosition=p;
   if(!accuracyCircle)accuracyCircle=L.circle([p.lat,p.lng],{radius:p.accuracy,color:'#2c91ff',weight:1,fillColor:'#52a6ff',fillOpacity:.12,interactive:false}).addTo(map);
   else accuracyCircle.setLatLng([p.lat,p.lng]).setRadius(p.accuracy);
   if(!userMarker)userMarker=L.marker([p.lat,p.lng],{interactive:false,zIndexOffset:20000,icon:L.divIcon({className:'map-user-marker',iconSize:[28,28],iconAnchor:[14,14],html:'<span class="map-user-direction"><i></i></span><span class="map-user-dot"></span><span class="map-user-label">내 위치</span>'})}).addTo(map);
   else userMarker.setLatLng([p.lat,p.lng]);
   renderHeading(currentHeading);if(follow)centerUser();locateButton.textContent='◎ 내 위치로 이동';stopButton.hidden=false;
  },onHeading:renderHeading,onState:s=>{
   if(s.kind==='location')locationMessage=s.status==='ready'?'내 위치 · 오차 약 '+Math.round(s.accuracy).toLocaleString()+'m':labels.location[s.status]||'';
   else headingMessage=s.status==='ready'?'바라보는 방향 '+Geo.cardinal(s.heading)+' '+Math.round(s.heading)+'°':labels.heading[s.status]||'';
   headingButton.setAttribute('aria-pressed',String(currentHeading!==null));updateStatus();
  }});
  locateButton.onclick=()=>{closePopup();if(mobile.matches)setCollapsed(true);follow=true;centerUser();stopButton.hidden=false;controller.locate();};
  headingButton.onclick=()=>{stopButton.hidden=false;controller.enableHeading();if(!lastPosition){closePopup();if(mobile.matches)setCollapsed(true);follow=true;controller.locate();}};
  stopButton.onclick=()=>{controller.stop();if(userMarker)userMarker.remove();if(accuracyCircle)accuracyCircle.remove();userMarker=null;accuracyCircle=null;lastPosition=null;follow=false;currentHeading=null;stopButton.hidden=true;locateButton.textContent='◎ 내 위치 확인';};
  const stopFollowing=()=>{follow=false;};
  map.on('dragstart',stopFollowing);host.addEventListener('pointerdown',stopFollowing,{passive:true});host.addEventListener('wheel',stopFollowing,{passive:true});
  for(const el of [list,document.getElementById('quick'),document.getElementById('allBtn'),document.getElementById('sangmuBtn'),document.getElementById('plus'),document.getElementById('minus')])el.addEventListener('click',stopFollowing);
 }
 host.dataset.mapEngine='leaflet-1.9.4';host.dataset.venueCount=String(rows.length);
})();
