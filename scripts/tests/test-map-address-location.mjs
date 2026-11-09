import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url),A=require('../../js/map-address.js'),G=require('../../js/map-location.js');
const p={lat:35.15327401976874,lng:126.84185570289276};
let sdkCalls=0,requests=[];
const services={Status:{OK:'OK',ZERO_RESULT:'ZERO_RESULT'},Coords:{WGS84:'WGS84'},Geocoder:class {coord2Address(lng,lat,done){requests.push([lng,lat]);done([{road_address:{address_name:'테스트 도로명 10'},address:{address_name:'테스트 지번 20'}}],'OK');}}};
await assert.rejects(A.createClient().resolve(p),{code:'not-configured'});
const client=A.createClient({loadSdk:async()=>{sdkCalls++;return services;}});
const [a,b]=await Promise.all([client.resolve(p),client.resolve(p)]);
assert.equal(a,b);assert.deepEqual(requests,[[p.lng,p.lat]]);assert.equal(sdkCalls,1);
assert.equal(a.road,'테스트 도로명 10');assert.equal(a.parcel,'테스트 지번 20');assert.equal(a.kind,'pin-address');
assert.equal(await client.resolve(p),a);assert.equal(requests.length,1);
assert.notEqual(A.pointKey({...p,lng:p.lng+.001}),A.pointKey(p));
const stored={road:'',parcel:'전남광주통합특별시 서구 치평동 1162번지',source:'지오코더'};
const offline=A.createClient({preloaded:{[A.pointKey(p)]:stored}});
assert.equal(await offline.resolve(p),stored,'Saved map address must work without an API key');
await assert.rejects(offline.resolve({...p,lng:p.lng+.001}),{code:'not-configured'},'Changed coordinates must not reuse a stale address');
await assert.rejects(client.resolve({lat:null,lng:1}),{code:'no-coordinate'});
assert.throws(()=>A.parse([],p),{code:'no-address'});
assert.equal(A.parse([{address:{address_name:'테스트 지번 30'}}],p).road,'');
assert.equal(G.heading({alpha:90,absolute:false}),null,'Relative alpha must not pretend to be north');
assert.equal(G.heading({alpha:null,absolute:true}),null);
assert.equal(G.heading({alpha:270,beta:0,gamma:0,absolute:true}),90);
assert.equal(G.heading({alpha:0,beta:60,gamma:0,absolute:true}),0);
assert.equal(G.heading({webkitCompassHeading:0,webkitCompassAccuracy:10}),0);
assert.equal(G.heading({webkitCompassHeading:0,webkitCompassAccuracy:-1}),null);
assert.equal(G.heading({alpha:0,beta:0,gamma:0,absolute:true},90),90);
assert.equal(G.cardinal(0),'북');assert.equal(G.cardinal(90),'동');assert.equal(G.cardinal(180),'남');assert.equal(G.cardinal(270),'서');
assert.ok(G.smooth(359,1) >359,'Cross north on the short arc');
const handlers=new Map(),docHandlers=new Map(),timers=new Map(),positions=[],headings=[],states=[],cleared=[];
let sequence=0,timerId=0,success,fail,permissionCalls=0;
const w={isSecureContext:true,screen:{orientation:{angle:0}},navigator:{geolocation:{watchPosition(ok,no,options){sequence++;success=ok;fail=no;assert.equal(options.enableHighAccuracy,true);return sequence;},clearWatch(id){cleared.push(id);}}},
 DeviceOrientationEvent:{async requestPermission(){permissionCalls++;return 'granted';}},
 addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name),
 setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),
 document:{hidden:false,addEventListener:(name,fn)=>docHandlers.set(name,fn),removeEventListener:name=>docHandlers.delete(name)}};
const control=G.createController({platform:w,onPosition:p=>positions.push(p),onHeading:h=>headings.push(h),onState:s=>states.push(s)});
assert.equal(sequence,0,'No automatic geolocation request before user action');
control.locate();control.locate();assert.equal(sequence,1,'No duplicate watch on repeated taps');
success({coords:{latitude:35.1,longitude:126.8,accuracy:27,heading:180},timestamp:123});
assert.equal(positions[0].accuracy,27);assert.equal(headings.length,0,'GPS travel course is not facing direction');
await Promise.all([control.enableHeading(),control.enableHeading()]);assert.equal(permissionCalls,1);
handlers.get('deviceorientation')({alpha:90,absolute:false});assert.equal(headings.length,0);
handlers.get('deviceorientationabsolute')({alpha:270,beta:0,gamma:0,absolute:true});assert.equal(headings.at(-1),90);
w.document.hidden=true;docHandlers.get('visibilitychange')();assert.deepEqual(cleared,[1]);assert.equal(headings.at(-1),null);
w.document.hidden=false;docHandlers.get('visibilitychange')();assert.equal(sequence,2);
fail({code:1});assert.equal(states.at(-1).status,'denied');assert.deepEqual(cleared,[1,2]);
control.stop();assert.equal(handlers.has('deviceorientationabsolute'),false);
const old=positions.length;success({coords:{latitude:40,longitude:127,accuracy:1},timestamp:124});assert.equal(positions.length,old,'Ignore callbacks after stopping');
control.destroy();assert.equal(docHandlers.size,0);
for(const file of ['map/index.html',...Array.from({length:8},(_,i)=>`map/karaoke${i+1}/index.html`),'map/room/index.html']){
 const html=fs.readFileSync(file,'utf8');const quick=html.match(/<div id="quick">([\s\S]*?)<\/div>/)[1];const labels=[...quick.matchAll(/<button\b[^>]*>([^<]+)<\/button>/g)].map(m=>m[1]);assert.equal(labels.at(-1),'목포·남악',`${file}: Mokpo must be last`);assert.deepEqual(labels.slice(0,3),['상무지구','광천동','용봉동']);for(const name of ['map-provider-config','map-address','map-location'])assert.ok(html.includes(name+'.js'));
}
console.log('PASS: pin address coordinate order, road/parcel parsing, missing-key failure, compass directions and sensor permission/watch lifecycle, all 10 map routes');
