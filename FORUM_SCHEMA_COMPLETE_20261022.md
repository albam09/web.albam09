# 2026-10-22 탐험기 토론 포럼 구조화 데이터 보완 (v7)

목적: Google `DiscussionForumPosting`에 신고된 필수 정보(datePublished, author)와 권장 정보(url, author.url)를 실제 게시글·작성자 데이터에 근거해 전부 제공.

## 변경 사항
- `scripts/build-site.mjs`: 공개 탐험기와 승인된 공개 댓글을 Supabase REST에서 확인. 각 글에 작성일 ISO 8601, 작성자 Person.name, 글 canonical URL, 실제 회원 공개 프로필 URL을 포함하는 **단일** DiscussionForumPosting JSON-LD 생성. 승인 댓글에도 Comment + datePublished/author/author.url/url 생성.
- `explore/member/<sha256-prefix>/index.html`: 빌드 시 공개 활동이 있는 회원의 프로필 웹페이지를 자동 생성. 표시 정보는 원래 공개된 닉네임·공개 글·공개 댓글만; 이메일, 내부 auth UUID, 비공개 정보 없음. `ProfilePage` + `Person` 스키마, canonical 제공.
- `sitemap.xml`: 공개 글과 공개 작성자 프로필 URL 자동 포함. 글 숨김·삭제 후 빌드 시 필요 없는 프로필 HTML·URL 제거.
- `js/explorer-post.js`: 클라이언트 JSON-LD도 동일 작성자 프로필 URL로 갱신. 공개 댓글 프로필 링크 제공. HTML meta/canonical, 댓글 기능 유지.
- `explore/post/index.html`: 변경 JavaScript 캐시 버전 갱신.
- `scripts/tests/test-build-site.mjs`: 게시글·공개 댓글 필수/권장 스키마, 프로필 실체, 원본 UUID 비노출, 마크업 중복 차단, API 장애 시 빌드 실패, 글 숨김 시 정리 검증.
- `supabase/ALBAM09_EXPLORER_COMMENT_REBUILD_20261022.sql`: *추가 적용 선택 사항*. 현재 `albam09_explorer_netlify_rebuild()` 함수를 공개 댓글 상태 변경에도 연결. SQL은 기존 데이터·RLS 정책을 바꾸지 않으며 게시글 승인/수정에 이미 쓰는 Netlify Build Hook을 재사용.

## 적용
1. ZIP을 풀어 GitHub 저장소 `albam09/web.albam09`의 `main`에 기존 경로 그대로 반영하고 커밋. 수동 Netlify ZIP 업로드 불필요.
2. Netlify Deploy log의 `[build-site] 공개 탐험기 ... 공개 댓글 ... 공개 작성자 프로필 ...` 표시와 Published를 확인.
3. 실제 게시글 URL의 HTML 원본에서 `explorer-post-ld` JSON-LD가 1개이며 `author.url` 프로필로 연결되는지 확인.
4. 필요하면 Supabase SQL Editor에서 `ALBAM09_EXPLORER_COMMENT_REBUILD_20261022.sql` 전체 실행. 댓글 승인/숨김/수정에 자동 Netlify rebuild가 진행됨. 이미 트리거가 존재하면 다시 생성하는 방식으로 멱등 처리.
5. Google 리치 결과 테스트의 "실제 URL 테스트"로 필수 항목을 확인한 뒤 Search Console에서 수정 확인.

**한계**: 코드 단위 생성/검증은 완료했지만 운영 Netlify 및 Supabase 계정에 직접 적용·배포하지 않았음. 공개 프로필 주소가 실제로 생성되는 것은 Git 기반 Netlify 빌드 이후이며, Google 리치 결과 표시·색인은 보장되지 않음. 일부 댓글이 아직 비공개면 JSON-LD에 포함하지 않음. 관리자가 게시글과 댓글의 공개 범위에 따라 빌드가 자동으로 발생하는지도 운영 환경에서 확인해야 함.
