# 광주버블여지도 — 버블알바 단일 페이지 적용 안내 (2026-10-21)

## 사용자 요구 / 페이지
- 페이지: `/bubble-alba/`
- 타이틀: `광주공주알바 | 광주버블알바 | 광주노래방알바 | 광주룸빠알바 - 광주버블여지도`
- 공고 등록/수정/삭제: 09 `albam09_staff.level='super_admin'` **서버 권한으로**만 허용
- 댓글 등록: 로그인 없는 방문자 포함 누구나 가능. 공개는 최고관리자의 승인 후.
- 기존 08 profiles/auth, 기존 탐험기 댓글/글/SQL을 변경하지 않고 09 신규 테이블 두 개만 추가.

## 적용 순서 — 현재 운영 사이트 보존
1. **먼저** 기존 Supabase SQL Editor에서 `supabase/ALBAM09_BUBBLE_ALBA_20261021.sql` 내용을 실행합니다. 실행 전 SQL의 권한 범위를 검토하십시오. 임의의 테스트 계정에 최고관리자 권한을 주지 마십시오.
2. SQL 실행 성공을 확인한 **후**, 이 ZIP의 전체 사이트 파일을 GitHub `albam09/web.albam09`의 `main`에 동일 경로로 반영합니다. 새 파일만 아니라 변경된 `scripts/build-site.mjs`, `js/site-drawer-menu.js`, `index.html`, `sitemap.xml`, 그리고 cache bust된 공통 HTML 경로도 함께 반영되어야 합니다. 기존 Netlify 도메인이나 Supabase 키를 변경하지 마십시오.
3. 기존 Git 연동 Netlify 빌드를 확인합니다. `[build-site] 버블알바 공개 공고 ...` 라인이 성공 로그에 있어야 합니다. 해당 테이블이 없으면 **배포 실패하도록 의도**했습니다. 빈 SEO 페이지를 성공한 배포로 만들지 않습니다.
4. 최고관리자로 로그인 → `/bubble-alba/` 맨 아래 공고 작성 폼 확인 → 운영자가 직접 확인한 실제 공고만 입력 → 게시 선택 → 저장. Netlify 자동 재빌드 트리거는 Vault에 저장된 기존 `albam09_netlify_explore_build_hook`을 재사용합니다.
5. 비로그인 브라우저에서 공고 댓글 작성 → 최고관리자가 같은 페이지를 열고 댓글 보기 → 승인/반려 → 일반 방문자에게 공개되는지 확인합니다.
6. 새 URL을 Google Search Console에서 검사합니다. sitemap에 `/bubble-alba/` 1개만 추가되며, 내용 없는 키워드형 복제 페이지는 만들지 않습니다.

## 기능과 보안
- 가입자·일반 관리자도 공고를 작성할 수 없습니다. `albam09_alba_save_post`/`albam09_alba_remove_post`는 내부에서 `public.albam09_is_super(auth.uid())` 검사.
- 비회원 댓글은 보안 정의 함수 `albam09_alba_submit_comment`를 통해 **pending**으로만 등록됩니다. 공개 댓글에만 RLS SELECT 허용.
- 같은 방문자의 반복 제출을 줄이기 위해 honeypot, 중복댓글 검사, PostgREST가 제공한 IP 프록시 헤더의 일일 해시 기반 빈도 제한을 사용합니다. 헤더 위조 등으로 우회가 가능하므로 고트래픽 공개운영 시 서버측 Turnstile/추가 스팸 필터를 권장합니다.
- 개인정보·연락처·신분증 같은 민감정보를 댓글에 공개하지 않도록 UI에 안내했습니다.
- 메인과 사이트 메뉴에서 연결하지만 기존 8개 지역 nav 탭 구조를 변경하지 않아 모바일 가로 폭 회귀를 피합니다.
- JSON-LD는 `WebPage`로 설정. 요건이 없는 공고에 허위 `JobPosting` 구조화 데이터를 생성하지 않습니다.
- **새 글/승인된 댓글**은 정적 HTML에도 포함되도록 빌드 스크립트를 확장했습니다. 별도 개별 공고 페이지를 양산하지 않습니다.
- 임시저장 게시물과 미승인 댓글은 공용 REST 조회·정적 HTML에 표시되지 않습니다.
- 별도의 GitHub 적용 파일 ZIP과 전체 ZIP을 두 개 요구하지 않습니다. **전체 ZIP 1개**를 소스 기준으로 사용합니다.

## 검증 범위
- JS 파서: Node 22 `node --check` 검증.
- build script: 네트워크 호출을 mock한 실제 Node 실행으로 공개 공고/댓글 SSR와 sitemap 유지 검증, 미존재 테이블 조회 시 빌드 실패 검증.
- 브라우저: 외부 및 localhost 접속은 브라우저 환경에서 차단되어 CSS를 인라인으로 주입한 Chromium 페이지 렌더링으로 1440/390 너비에서 가로 넘침 없음 확인.
- 사용자 실계정 최고관리자 로그인·Netlify 배포·실제 Supabase SQL 권한 테스트는 이 환경에서 수행하지 않았습니다. SQL 적용 및 운영 검증은 필요합니다.

## 변경 파일 목록
- 새로 생성: `bubble-alba/index.html`, `css/bubble-alba.css`, `js/bubble-alba.js`, `supabase/ALBAM09_BUBBLE_ALBA_20261021.sql`, 이 README
- 기존 수정: `scripts/build-site.mjs`, `js/site-drawer-menu.js`, `index.html`, `sitemap.xml`, 사이트 공통 드로어 JS 참조 캐시 버전(기존 92개 HTML)
