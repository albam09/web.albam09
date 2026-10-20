# albam09 2026-10-21 · 버블알바 UI, 전역 메뉴, 이미지 붙여넣기

- `bubble-alba/index.html` 및 `css/bubble-alba.css`: 단일 페이지 디자인을 고급 편집형 플럼/골드 레이아웃으로 재구성. SEO 타이틀 여섯 개 키워드 유지. 기존 id/form/JS 바인딩 보존.
- 기존 빠진 탐험기 상단 메뉴 12개를 포함해 `area-list`가 있는 모든 페이지에서 `/bubble-alba/` 링크 검사. 상단 메뉴는 JS 렌더 없이도 정적 링크를 포함한다. 다른 지역 페이지/로그인/BBS는 링크만 변경. 기존 Drawer 메뉴 주입 로직 유지(중복 검사).
- `js/inline-media.js`와 `css/inline-media.css`: 허용된 이미지 URL의 안전한 렌더링. HTML 삽입 대신 이스케이프하여 XSS 억제. 카카오 CDN 핫링크 차단 시 표시 보장 불가.
- `explore/write`: 사용자 이미지 Ctrl+V로 기존 이미지 업로드 경로에 합류.
- `bubble-alba`: 최고관리자의 이미지 클립보드/파일 업로드 (기존 공개 Supabase Storage 정책 필요). 비회원 댓글은 이미지 링크만 허용, 바이너리 업로드 금지.
- `explore/post` 및 `scripts/build-site.mjs`: 동적 글·댓글/정적 HTML 렌더 결과 일치.
- SQL 테이블/RLS/도메인/광고/기존 탐험기 자동 빌드 Hook은 수정하지 않음.

## 확인해야 할 사항

1. GitHub에 압축을 푼 전체 파일을 반영하고 Netlify에서 Git 빌드 완료 확인.
2. `/explore/karaoke1/` 지역 메뉴의 버블알바 링크를 클릭해 `/bubble-alba/`로 이동하는지 확인.
3. 실제 관리자 세션으로 `/bubble-alba/`에서 Ctrl+V 이미지 업로드 테스트. Storage policy에 따라 저장 실패할 수 있음.
4. 비회원 댓글에 `[image](https://item.kakaocdn.net/...)` 등 붙여넣기 후 승인, Googlebot용 HTML도 생성되는지 확인.
