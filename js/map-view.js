/* V12: one shared Leaflet 1.9.4 map runtime for all regional entry points. */
(function(){
 'use strict';
 const config=window.ALBAM09_MAP_CONFIG||{},D=window.ALBAM09_MAP_DATA,L=window.L;
 const host=document.getElementById('map'),main=document.getElementById('main');
 if(!host||!main||!D)return;
 const rows=Array.isArray(config.places)?config.places:[],bySlug=new Map(rows.map(p=>[p.slug,p]));
 const popup=document.getElementById('popup'),panel=document.getElementById('panel'),list=document.getElementById('placeList'),search=document.getElementById('search');
 const title=panel.querySelector('.panel-title'),note=panel.querySelector('.panel-note'),count=document.getElementById('count');
 const baseTitle=title.firstChild.textContent,baseNote=note.textContent;
 const mobile=window.matchMedia('(max-width:820px)'),reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
 let visible=config.initialRegionSlugs===null?null:new Set(config.initialRegionSlugs||[]),selected=null,markerLayers=[],resizeFrame=0,markerFrame=0,popupKind='venue',popupRows=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=(v,fallback='#')=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)||u.protocol==='file:'?u.href:fallback;}catch{return fallback;}};
 const currentBoard=()=>((location.pathname.match(/\/map\/(karaoke[1-8]|room)(?:\/|$)/)||[])[1]||null);
 const filtered=()=>D.filter(rows,visible,search.value);
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
  for(const p of items){const button=document.createElement('button');button.type='button';button.className='place-item';button.dataset.venue=p.slug;button.innerHTML=`<span class="place-name">${esc(p.name)}</span><span class="place-meta">${esc(p.area)}<br>${esc(p.address)}${D.hasPoint(p)?'':'<br>주소·업소명으로 지도 찾기'}</span>`;button.onclick=()=>select(p,true);frag.appendChild(button);}
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
  const lookup=D.lookup(p),url='https://map.kakao.com/link/search/'+encodeURIComponent(lookup.query),digits=String(p.phone||'').replace(/\D/g,'');
  const same=rows.filter(x=>x.slug!==p.slug&&D.hasPoint(x)&&D.hasPoint(p)&&D.distance(x,p)<2);
  popupKind='venue';popup.hidden=false;popup.style.display='block';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',p.name+' 업소 정보');
  popup.innerHTML=`<button class="map-popup-close" type="button" aria-label="정보창 닫기">×</button><div class="pop-top"><img class="pop-image" src="${esc(safeUrl(p.image))}" alt="${esc(p.name)} 업소 사진"><div><h2 class="pop-title">${esc(p.name)}</h2><div class="pop-sub">${esc(p.area)}</div></div></div><div class="pop-sub pop-address">${esc(p.address)}</div>${D.hasPoint(p)?'':'<p class="pop-sub">지도 위치가 등록되지 않아 주소·업소명으로 찾을 수 있습니다.</p>'}${!p.addressVerified&&D.hasPoint(p)?'<p class="pop-sub pop-location-note">방문 전 건물과 출입구를 확인해 주세요.</p>':''}<div class="pop-actions"><a class="pop-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(lookup.label)}</a>${digits?`<a class="pop-link pop-phone" href="tel:${digits}">전화 ${esc(D.formatPhone(p.phone))}</a>`:''}<a class="pop-link" href="${esc(safeUrl(p.url))}" rel="nofollow noopener">상세보기</a></div>${same.length?'<details class="map-same-location"><summary>같은 등록 위치의 다른 업소</summary>'+same.map(x=>`<button type="button" data-group-venue="${esc(x.slug)}">${esc(x.name)}</button>`).join('')+'</details>':''}`;
  popup.querySelector('.map-popup-close').onclick=closePopup;popup.querySelectorAll('[data-group-venue]').forEach(b=>b.onclick=()=>select(bySlug.get(b.dataset.groupVenue),true));
  popup.querySelectorAll('img').forEach(img=>img.addEventListener('load',positionPopup,{once:true}));positionPopup();
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
 const params=new URLSearchParams(location.search),target=bySlug.get(params.get('venue')),area=params.get('area');
 if(target){select(target,true);}else if(area){const chip=[...document.querySelectorAll('#quick .chip')].find(c=>c.textContent.trim()===area);if(chip)showArea(chip);}else if(params.get('scope')==='all')restore(true);
 document.getElementById('allBtn').textContent='전체 업소';
 host.dataset.mapEngine='leaflet-1.9.4';host.dataset.venueCount=String(rows.length);
})();
