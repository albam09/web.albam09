# albam09 탐험기 작성 직후 스타일 누락 수정 및 통합 검증 — 2026-10-31

## 증상과 확인된 원인
- 작성 직후 `/explore/post/{slug}/`로 이동하면 전체 사이트가 CSS 없이 기본 HTML처럼 표시되는 현상(대형 로고·기본 링크·글머리표).
- `js/explorer-write.js`: 저장 RPC 이후 해당 동적 상세 URL로 이동하도록 구성되어 있음.
- `_redirects`: `/explore/post/* /explore/post/index.html 200` — 기존 동적 URL을 공통 상세 템플릿으로 제공함.
- 기존 `explore/post/index.html`은 CSS/JS를 `../../css/`, `../../js/`로 참조. 주소가 `/explore/post/{slug}/`인 경우 브라우저가 `/explore/css/`, `/explore/js/`를 요청하게 되는 구조적 오류.

## 이번 수정
1. `explore/post/index.html`: CSS, JS, favicon, 이미지, webmanifest 등 사이트 리소스를 `/css/`, `/js/`, `/img/`, `/favicon.ico`, `/site.webmanifest`로 변경. 실제 탐험기 slug의 URL 깊이와 무관하게 동일하게 로드.
2. `scripts/build-site.mjs`: 공개글 정적 HTML을 생성할 때도 루트 절대 경로를 유지. 이전의 상대경로 재계산 제거.
3. `scripts/check-release.mjs`: 상세 페이지의 잘못된 상대경로 재발 시 빌드를 실패시키는 검사 추가.
4. `scripts/tests/test-explorer-post-assets.mjs`: 임의의 실제 상세 URL에서 로컬 자산 경로 24개, fallback rewrite, 정적 생성 코드 확인.
5. 기존 진행 중이던 INDEX 길잡이 박스 위치 및 모든 메뉴의 반응형 공통 정렬은 현 작업본 그대로 보존.

## 테스트 결과
- URL 깊이 따른 경로 및 실제 파일 존재 여부: 24개 PASS.
- Node release 검사: PASS.
- 정적 글 생성/비공개·삭제·조회 실패 테스트: PASS.
- Javascript 전체 문법 검사: 48개, 오류 0건.
- 시각 검증: CSS 10개 파일을 HTML에 인라인 적용하고 가상의 검토 대기 탐험기를 렌더링한 **PC 1440px / 모바일 390px** 결과: 로고 25px, 메뉴 12개, 가로 넘침 없음.
- INDEX 접힘 순서: 소개 → 탐험기 5개 → 업소 모아보기 → BBS → 검색 길잡이 (맨 아래) PASS.

## 범위 및 한계
- 브라우저에서 실제 HTTP 테스트 서버에 접속하는 작업은 실행 환경의 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단됨. 따라서 시각 검증은 실제 서버 응답이나 실제 로그인 상태를 포함하지 않는 **로컬 CSS 인라인 렌더링**이며, 실서비스 정상 동작을 확정하지 않음.
- Netlify 배포 후 반드시 회원 로그인 → 탐험기 작성 → 저장 → `/explore/post/글주소/` 확인, DevTools Network에서 `/css/`와 `/js/`의 200 상태 확인 필요.
- 본 ZIP은 정적 소스와 Netlify 빌드 설정을 담음. 수동 ZIP 배포는 Netlify `build-site.mjs`를 자동 실행하지 않을 수 있으므로, 글별 정적 SEO HTML이 필요하면 Git 연동 빌드와 공개 글 데이터 연결을 이용할 것.
- Supabase DB, 인증 권한, 배포 환경, 회원 데이터를 변경하지 않음.
