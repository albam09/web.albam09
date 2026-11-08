import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const F=createRequire(import.meta.url)('../js/forum-schema.js');
const root=process.cwd();let count=0;
async function walk(dir){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.name==='node_modules'||entry.name.startsWith('.'))continue;
  // A previous local build can leave a publish copy beside the source.
  // Validate that copy separately from its own root, not as a /dist/ URL.
  if(dir===root&&entry.name==='dist')continue;
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){await walk(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  const html=await fs.readFile(file,'utf8'),rel=path.relative(root,file),nodes=[];
  function collect(obj){
   if(!obj||typeof obj!=='object')return;
   if(Array.isArray(obj)){obj.forEach(collect);return;}
   if(obj['@type']==='DiscussionForumPosting')nodes.push(obj);
   if(obj['@graph'])collect(obj['@graph']);
  }
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(!/type=["']application\/ld\+json["']/i.test(match[1]))continue;
   try{collect(JSON.parse(match[2]));}catch(e){throw new Error(`${rel}: invalid JSON-LD: ${e.message}`);}
  }
  if(/itemtype=["']https?:\/\/schema\.org\/DiscussionForumPosting["']/i.test(html))throw new Error(`${rel}: duplicate legacy forum Microdata is not allowed`);
  if(nodes.length>1)throw new Error(`${rel}: multiple DiscussionForumPosting nodes`);
  for(const node of nodes){
   const errors=F.issues(node);if(errors.length)throw new Error(`${rel}: ${errors.join(', ')}`);
   const expected=F.origin+'/'+rel.replace(/index\.html$/,'').split(path.sep).join('/');
   if(node.url!==expected)throw new Error(`${rel}: discussion URL does not match its page`);
   const profile=path.join(root,new URL(node.author.url).pathname.slice(1),'index.html');
   await fs.access(profile).catch(()=>{throw new Error(`${rel}: author profile is missing`);});
   count++;
  }
 }
}
await walk(root);
console.log(`[forum-check] PASS: ${count} public posts; one complete forum node per page, valid dates and real author pages`);
