# albam09 2026-10-21 — 댓글 승인 / 탐험기 수정 / 검색 구조화 데이터

## 해결한 실제 원인

1. `/admin/`에 게시글 승인 목록만 있고 댓글 승인 목록이 없었음.
2. 과거 운영 DB에 적용한 `SUPABASE09-SUPERADMIN-PERMISSIONS.sql`이 `albam09_update_explorer_post`를 최고관리자만 수정하도록 덮어쓸 수 있었음. 클라이언트 표시 권한과 실제 RPC 권한이 불일치했음.
3. 정적/동적 탐험기 상세 HTML의 `itemscope itemtype=DiscussionForumPosting` Microdata는 `headline`과 `text`만 명시한 불완전한 별도 노드였고, 완전한 JSON-LD와 중복 선언되어 Google의 `author`/`datePublished` 누락 경고를 일으킬 수 있었음.

## 반영한 수정

- `admin/index.html`: 댓글 승인 대기 / 최근 공개 댓글 별도 목록 추가.
- `js/admin09.js`: 댓글 조회 및 승인/반려, 최고관리자 삭제 조작; 기존 게시글/운영자 관리는 보존.
- `js/explorer-write.js`: 수정 진입 시 09 전용 운영자 권한 새로 조회, 인증 초기화 준비 완료 이벤트 사용.
- `js/explorer-post.js`: 중복 Microdata 제거, 댓글 URL 앵커 연결, 기존 공개 댓글만 JSON-LD에 포함.
- `scripts/build-site.mjs`: 불완전 Microdata 제거, 발행일 검증, 게시글 작성자 닉네임 포함하도록 공개글 조회 보강.
- `explore/post/index.html`, `explore/write/index.html`, `admin/index.html`: 수정된 스크립트 캐시 버전 적용.
- `supabase/ALBAM09_ADMIN_COMMENTS_EDIT_FIX_20261021.sql`: 게시글 작성자/09 스태프 수정·삭제 권한 통일, 09 스태프만 댓글 승인/반려할 수 있는 RPC, 댓글 공개 조회 RLS. 공개 회원 프로필·08 권한 수정 없음, 데이터 삭제 없음.

## 적용 순서 (이미 연결된 GitHub/Netlify/Supabase 유지)

1. **기존 Supabase SQL Editor**에서 `supabase/ALBAM09_ADMIN_COMMENTS_EDIT_FIX_20261021.sql`만 실행. 기존 초기 설치 SQL, 과거 `SUPABASE09-SUPERADMIN-PERMISSIONS.sql`을 다시 실행하지 마세요.
2. GitHub `albam09/web.albam09`의 `main`에 이 전체본의 변경 파일 반영. Netlify가 자동 빌드함. 기존 사이트를 별도로 수동 ZIP 배포하지 마세요.
3. Netlify Deploy log에서 `[build-site] 공개 탐험기 N개` 확인, 개별 상세 HTML과 sitemap.xml에 새 구조화 데이터가 반영되었는지 확인.
4. `/admin/`의 **댓글 승인 대기**에서 테스트 댓글 승인 → 일반 브라우저로 글 상세 댓글 표시 확인. 최고관리자 계정에서 탐험기 다른 작성자 글 **수정→저장** 확인.
5. Google Rich Results Test 또는 Search Console 실제 URL 테스트에서 `DiscussionForumPosting` 노드가 한 개이고 `author.name`, `datePublished`, `url`, `text`가 있는지 확인. 이후 Search Console **수정 결과 확인** 사용.

### Google의 `author.url` 권장 항목

실제 공개 회원별 프로필 URL이 없는 상태에서 존재하지 않는 URL을 만들어서는 안 됩니다. 필수인 `author.name`과 `datePublished` 및 권장인 게시글 `url`은 반영했습니다. 실재하는 공개 프로필이 생기면 `author.url`을 연결할 수 있습니다. 경고 감소와 실제 Google 색인은 Google의 재크롤링에 달려 있습니다.

## 자동 회귀검증

- `node scripts/tests/test-build-site.mjs`: 정적 HTML·canonical·sitemap·archive 생성, 숨김글 제거, 오류 시 빌드 실패, JSON-LD 1개와 필수 속성 검증.
- `node scripts/tests/test-admin-comments.mjs`: 관리자 댓글 승인 대기와 게시글 검토 목록 분리, 승인·반려 버튼·원문 링크 렌더링.
- `node --check`: 수정된 JS/MJS 문법.
- 운영 계정으로 Supabase RPC 실호출과 실제 Google 재크롤링은 이 환경에서 확인하지 않았습니다. SQL 파일 준비와 프론트/빌드 테스트 통과는 실서버 반영 완료가 아닙니다.

배포 시 현재 live DB의 함수 정의가 예전 SQL에 의해 덮인 상태라면 새로운 SQL 적용 후 변경됩니다. `profiles.role`이나 기존 댓글/게시글은 지우지 않습니다.
