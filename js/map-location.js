/* Device location and compass. Sensor access starts only from a user's button.
   No location is uploaded, persisted, or used as a venue address. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ALBAM09_MAP_LOCATION=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const wrap=v=>(v%360+360)%360;
 function heading(event,screenAngle=0){
  if(Number.isFinite(event.webkitCompassHeading)){
   if(Number.isFinite(event.webkitCompassAccuracy)&&event.webkitCompassAccuracy<0)return null;
   return wrap(event.webkitCompassHeading+screenAngle);
  }
  if(event.absolute!==true||!Number.isFinite(event.alpha))return null;
  const {alpha,beta,gamma}=event;
  // W3C's back-of-screen vector when the device is held upright.
  if(Number.isFinite(beta)&&Number.isFinite(gamma)&&(Math.abs(beta)>30||Math.abs(gamma)>30)){
   const a=alpha*Math.PI/180,b=beta*Math.PI/180,g=gamma*Math.PI/180;
   const x=-Math.cos(a)*Math.sin(g)-Math.sin(a)*Math.sin(b)*Math.cos(g);
   const y=-Math.sin(a)*Math.sin(g)+Math.cos(a)*Math.sin(b)*Math.cos(g);
   if(Math.hypot(x,y)>.25)return wrap(Math.atan2(x,y)*180/Math.PI);
  }
  return wrap(360-alpha+screenAngle);
 }
 const smooth=(previous,next,factor=.28)=>previous===null?next:wrap(previous+(wrap(next-previous+180)-180)*factor);
 const cardinal=value=>['북','북동','동','남동','남','남서','서','북서'][Math.round(wrap(value)/45)%8];
 function createController({platform,onPosition=()=>{},onHeading=()=>{},onState=()=>{}}){
  const w=platform;let watch=null,watchGeneration=0,wantLocation=false,wantHeading=false,headingGranted=false,permissionPending=null,listening=false,lastHeading=null,headingTimer=null,disposed=false;
  const state=(kind,status,extra={})=>onState({kind,status,...extra});
  const angle=()=>Number.isFinite(w.screen?.orientation?.angle)?w.screen.orientation.angle:(Number.isFinite(w.orientation)?w.orientation:0);
  function clearWatch(){watchGeneration++;if(watch!==null){w.navigator.geolocation.clearWatch(watch);watch=null;}}
  function startWatch(){
   if(disposed||!wantLocation||watch!==null)return;
   if(!w.isSecureContext){state('location','insecure');return;}
   if(!w.navigator.geolocation){state('location','unsupported');return;}
   const generation=++watchGeneration;state('location','locating');
   const id=w.navigator.geolocation.watchPosition(pos=>{
    if(generation!==watchGeneration||disposed)return;
    const c=pos.coords;
    if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180||!Number.isFinite(c.accuracy)||c.accuracy<0){state('location','unavailable');return;}
    onPosition({lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,timestamp:pos.timestamp});state('location','ready',{accuracy:c.accuracy});
   },err=>{
    if(generation!==watchGeneration||disposed)return;
    if(err.code===1){wantLocation=false;clearWatch();}
    state('location',err.code===1?'denied':err.code===3?'timeout':'unavailable');
   },{enableHighAccuracy:true,timeout:15000,maximumAge:5000});
   if(generation===watchGeneration)watch=id;else w.navigator.geolocation.clearWatch(id);
  }
  function locate(){wantLocation=true;startWatch();}
  function sensor(event){
   if(!wantHeading||disposed)return;const value=heading(event,angle());if(value===null)return;
   lastHeading=smooth(lastHeading,value);onHeading(lastHeading);state('heading','ready',{heading:lastHeading});
   w.clearTimeout(headingTimer);headingTimer=w.setTimeout(()=>{lastHeading=null;onHeading(null);state('heading','unavailable');},15000);
  }
  function detach(){if(listening){w.removeEventListener('deviceorientationabsolute',sensor);w.removeEventListener('deviceorientation',sensor);listening=false;}w.clearTimeout(headingTimer);lastHeading=null;onHeading(null);}
  function attach(){
   if(listening||!wantHeading||disposed)return;listening=true;
   w.addEventListener('deviceorientationabsolute',sensor);w.addEventListener('deviceorientation',sensor);
   state('heading','waiting');headingTimer=w.setTimeout(()=>state('heading','unsupported'),6500);
  }
  async function enableHeading(){
   if(disposed)return;
   if(!w.isSecureContext){state('heading','insecure');return;}
   const Device=w.DeviceOrientationEvent;
   if(!Device){state('heading','unsupported');return;}
   wantHeading=true;
   try{
    // Called before any await so iOS sees the actual user activation.
    if(typeof Device.requestPermission==='function'&&!headingGranted){
     if(!permissionPending)permissionPending=Promise.resolve(Device.requestPermission(true)).finally(()=>{permissionPending=null;});
     const permission=await permissionPending;
     if(permission!=='granted'){wantHeading=false;state('heading','denied');return;}
    }
    headingGranted=true;if(wantHeading&&!disposed)attach();
   }catch{wantHeading=false;state('heading','denied');}
  }
  function stop(){wantLocation=false;wantHeading=false;clearWatch();detach();state('location','off');state('heading','off');}
  function visibility(){if(w.document.hidden){clearWatch();detach();state('location',wantLocation?'paused':'off');}else{if(wantLocation)startWatch();if(wantHeading&&headingGranted)attach();}}
  function pagehide(){clearWatch();detach();}
  function pageshow(){if(wantLocation)startWatch();if(wantHeading&&headingGranted)attach();}
  w.document.addEventListener('visibilitychange',visibility);w.addEventListener('pagehide',pagehide);w.addEventListener('pageshow',pageshow);
  function destroy(){stop();disposed=true;w.document.removeEventListener('visibilitychange',visibility);w.removeEventListener('pagehide',pagehide);w.removeEventListener('pageshow',pageshow);}
  return {locate,enableHeading,stop,destroy};
 }
 return {wrap,heading,smooth,cardinal,createController};
});
