/* Shared map data rules. Stored coordinates are never changed by the renderer. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ALBAM09_MAP_DATA=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const boards={'상무지구':'karaoke1','광천동':'karaoke2','용봉동':'karaoke4','신안동':'karaoke3','첨단':'karaoke5','목포·남악':'karaoke6'};
 const normalize=v=>String(v||'').normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
 const hasPoint=p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lng)&&Math.abs(p.lat)<=85&&Math.abs(p.lng)<=180;
 function distance(a,b){const rad=Math.PI/180,dy=(a.lat-b.lat)*rad,dx=(a.lng-b.lng)*rad,h=Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));}
 function filter(rows,visible,query){const q=normalize(query);return rows.filter(p=>(visible===null||visible.has(p.slug))&&(!q||normalize([p.name,p.area,p.address,p.addressSearchText,p.pinAddress?.road,p.pinAddress?.parcel].join(' ')).includes(q)));}
 function region(rows,label,point){if(boards[label])return rows.filter(p=>p.board===boards[label]);return hasPoint(point)?rows.filter(p=>hasPoint(p)&&distance(p,point)<=1500):[];}
 function lookup(p){
  if(hasPoint(p))return {label:'길 안내',url:'https://map.kakao.com/link/map/'+encodeURIComponent(p.name||'선택한 장소')+','+p.lat+','+p.lng,kind:'pin'};
  const address=String(p.addressSearchText||'').trim();
  if(address&&/\d/.test(address))return {label:'길 안내',query:address,url:'https://map.kakao.com/link/search/'+encodeURIComponent(address),kind:'address'};
  const query=[String(p.area||'').trim(),String(p.name||'').trim()].filter(Boolean).join(' ');
  return {label:'길 안내',query,url:'https://map.kakao.com/link/search/'+encodeURIComponent(query),kind:'search'};
 }
 function formatPhone(value){const d=String(value||'').replace(/\D/g,'');if(d.length===12&&d.startsWith('050'))return d.replace(/(\d{4})(\d{4})(\d{4})/,'$1-$2-$3');if(d.length===11)return d.replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3');if(d.length===10&&d.startsWith('02'))return d.replace(/(\d{2})(\d{4})(\d{4})/,'$1-$2-$3');if(d.length===10)return d.replace(/(\d{3})(\d{3})(\d{4})/,'$1-$2-$3');return String(value||'');}
 return {boards,normalize,hasPoint,distance,filter,region,lookup,formatPhone};
});
