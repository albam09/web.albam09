import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(process.cwd());
const html=fs.readFileSync(path.join(root,'explore/post/index.html'),'utf8');
const page=new URL('https://albam09.com/explore/post/author-test-20261031/');
const refs=[...html.matchAll(/(?:href|src|poster)=["']([^"']+)["']/g)].map(x=>x[1]);
let count=0;
for(const ref of refs){
  const clean=ref.split('?')[0];
  if(!/\.(?:css|js|png|jpg|jpeg|webp|ico)$/.test(clean) && !clean.endsWith('site.webmanifest'))continue;
  if(/^https?:\/\//.test(ref))continue;
  assert.ok(clean.startsWith('/'),`Asset not root absolute for deep post URL: ${ref}`);
  const full=new URL(ref,page);
  assert.ok(!full.pathname.startsWith('/explore/'),`Broken post resource URL: ${full.href}`);
  assert.ok(fs.existsSync(path.join(root,full.pathname.slice(1))),`Missing asset for ${full.href}`);
  count++;
}
assert.ok(count>=20,`Expected >20 local assets; got ${count}`);
assert.match(html,/href="\/css\/master\.css/);
assert.match(html,/src="\/js\/explorer-post\.js/);
assert.match(html,/src="\/js\/supabase-loader\.js/);
const redirects=fs.readFileSync(path.join(root,'_redirects'),'utf8');
assert.match(redirects,/^\/explore\/post\/\*\s+\/explore\/post\/index\.html\s+200$/m);
const builder=fs.readFileSync(path.join(root,'scripts/build-site.mjs'),'utf8');
assert.match(builder,/const generated=withMeta\(template,d\)/);
console.log(`PASS: deep post URL, ${count} CSS/JS/icon assets, 200 fallback, static builder`);
