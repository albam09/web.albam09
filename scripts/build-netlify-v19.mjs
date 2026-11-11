/*
 * Netlify production build for the V19 regional-copy release.
 * Live CMS refresh is best-effort ONLY for verified transient network errors.
 * Schema, permission, or validation failures still stop deployment.
 * An unrelated Supabase outage must not block static venue copy corrections.
 */
import {spawnSync} from 'node:child_process';

const steps = [
  ['build-search-pages'],
  ['check-release'],
  ['build-site'],
  ['apply-v18-metadata'],
  ['verify-v18'],
  ['verify-v19-venue-copy'],
  ['check-forum-structured-data'],
  ['check-seo', '--fix-sitemap'],
  ['package-public'],
];

for (const [script, ...args] of steps) {
  console.log(`[netlify-v19] ${script}: starting`);
  const run = spawnSync(process.execPath, [`scripts/${script}.mjs`, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: script === 'build-site' ? 180000 : 120000,
    maxBuffer: 24 * 1024 * 1024,
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.status === 0 && !run.error) continue;

  // Only a transient CMS/network outage can fall back to already committed
  // static pages; it must not bypass validation or an explicit strict build.
  const output = `${run.stdout || ''}\n${run.stderr || ''}`;
  const transientCMSFailure =
    script === 'build-site' &&
    process.env.ALBAM09_CONTENT_STRICT !== '1' &&
    !run.error &&
    /(?:Supabase 네트워크 연결 실패|Supabase HTTP (?:429|5\d\d)|공개 글 조회 실패: 백업이 (?:만료되었거나 손상되어|없어) 배포를 중단합니다)/.test(output);
  if (transientCMSFailure) {
    console.warn('[netlify-v19] Supabase temporarily unavailable; preserving committed public articles while publishing V19 static venue corrections. CMS refresh will retry on the next build.');
    continue;
  }
  console.error(`[netlify-v19] ${script}: failed (${run.error?.message || run.status || run.signal})`);
  process.exit(run.status && run.status > 0 ? run.status : 1);
}
console.log('[netlify-v19] PASS: V19 cards validated and public dist packaged.');
