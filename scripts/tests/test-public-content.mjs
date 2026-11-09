import {resolvePublicContent} from '../public-content.mjs';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir=await mkdtemp(path.join(os.tmpdir(),'albam09-snapshot-'));
const cacheFile=path.join(dir,'public.json'),now=Date.now();
const validate=async p=>{if(!Array.isArray(p.posts))throw Error('invalid content');};
const base={source:'test-public-source',cacheFile,validate,now};
const outage=async()=>{throw Object.assign(Error('503'),{transient:true});};
try{
 await assert.rejects(resolvePublicContent({...base,refresh:outage}),/백업이 없어/);
 const live=await resolvePublicContent({...base,refresh:async()=>({posts:[{slug:'kept-post'}]})});
 assert.equal(live.mode,'live');
 const original=await readFile(cacheFile,'utf8');
 const cached=await resolvePublicContent({...base,refresh:outage,now:now+1000});
 assert.deepEqual(cached.payload,live.payload);assert.equal(cached.mode,'recent-snapshot');
 await assert.rejects(resolvePublicContent({...base,refresh:outage,strict:true}),/503/);
 await assert.rejects(resolvePublicContent({...base,refresh:outage,now:now+86400001}),/만료/);
 await assert.rejects(resolvePublicContent({...base,refresh:async()=>{throw Error('401');}}),/401/);
 await assert.rejects(resolvePublicContent({...base,refresh:async()=>({posts:null})}),/invalid/);
 assert.equal(await readFile(cacheFile,'utf8'),original,'Errors cannot overwrite the last valid snapshot');
 const changed=JSON.parse(original);changed.payload.posts=[];await writeFile(cacheFile,JSON.stringify(changed));
 await assert.rejects(resolvePublicContent({...base,refresh:outage}),/손상/);
 await writeFile(cacheFile,original);
 const empty=await resolvePublicContent({...base,refresh:async()=>({posts:[]})});
 assert.deepEqual(empty.payload.posts,[],'A successful empty response must remove hidden/deleted posts');
 console.log('PASS: public snapshot TTL, integrity, explicit strict mode, transient-only fallback, successful deletion');
}finally{await rm(dir,{recursive:true,force:true});}
