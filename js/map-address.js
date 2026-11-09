/* Pin coordinates -> Korean road/parcel address. Does not change venue records. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ALBAM09_MAP_ADDRESS=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const pointKey=p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180?p.lat.toFixed(7)+','+p.lng.toFixed(7):null;
 const error=(code)=>Object.assign(new Error(code),{code});
 function parse(result,p){
  const item=Array.isArray(result)?result[0]:null;
  const road=String(item?.road_address?.address_name||'').trim(),parcel=String(item?.address?.address_name||'').trim();
  if(!road&&!parcel)throw error('no-address');
  return {pointKey:pointKey(p),lat:p.lat,lng:p.lng,road,parcel,building:String(item?.road_address?.building_name||''),source:'Kakao',kind:'pin-address'};
 }
 function loadKakao(win,key){
  if(win.kakao?.maps?.services?.Geocoder)return Promise.resolve(win.kakao.maps.services);
  return new Promise((resolve,reject)=>{
   const script=win.document.createElement('script');let done=false;
   const finish=(err,value)=>{if(done)return;done=true;win.clearTimeout(timer);script.onerror=null;if(err){script.remove();reject(err);}else resolve(value);};
   const timer=win.setTimeout(()=>finish(error('timeout')),12000);
   script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';
   script.src='https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey='+encodeURIComponent(key);
   script.onerror=()=>finish(error('provider-unavailable'));
   script.onload=()=>{if(!win.kakao?.maps?.load){finish(error('provider-unavailable'));return;}win.kakao.maps.load(()=>{const services=win.kakao?.maps?.services;finish(services?.Geocoder?null:error('provider-unavailable'),services);});};
   win.document.head.appendChild(script);
  });
 }
 function createClient({key='',platform,loadSdk,preloaded={}}={}){
  const cache=new Map(Object.entries(preloaded)),pending=new Map();let sdkPromise=null;
  const configured=Boolean(String(key).trim()||loadSdk);
  function resolvePoint(p){
   const id=pointKey(p);if(!id)return Promise.reject(error('no-coordinate'));
   if(cache.has(id))return Promise.resolve(cache.get(id));
   if(!configured)return Promise.reject(error('not-configured'));
   if(pending.has(id))return pending.get(id);
   if(!sdkPromise)sdkPromise=(loadSdk?loadSdk():loadKakao(platform,key)).catch(e=>{sdkPromise=null;throw e;});
   const task=sdkPromise.then(services=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(error('timeout')),10000);
    new services.Geocoder().coord2Address(p.lng,p.lat,(result,status)=>{
     clearTimeout(timer);
     if(status!==services.Status.OK){reject(error(status===services.Status.ZERO_RESULT?'no-address':'provider-unavailable'));return;}
     try{const value=parse(result,p);cache.set(id,value);resolve(value);}catch(e){reject(e);}
    },{input_coord:services.Coords?.WGS84||'WGS84'});
   })).finally(()=>pending.delete(id));
   pending.set(id,task);return task;
  }
  return {configured,resolve:resolvePoint,peek:p=>cache.get(pointKey(p))||null};
 }
 return {pointKey,parse,createClient};
});
