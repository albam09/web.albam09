# albam09 탐험기 구조화 데이터 감사 — 2026-10-22

## 검사 대상
- 기준 전체 소스: `albam09_full_20261021_v5.zip`
- 대상 URL: `https://albam09.com/explore/post/karaoke1-20261011151123-23e495b99f/`
- 실제 운영 URL의 서버 응답을 이 환경에서 직접 가져오지는 못했으므로, 기존 검색결과의 정확한 원본과 최신 배포 버전을 동일시하지 않습니다.

## 확인한 내용
1. 사용자가 제공한 Google 검색 리치 결과 화면에는 같은 글 제목으로 유효/유효하지 않은 `DiscussionForumPosting` 항목이 하나씩 표시됩니다. 이러한 현상은 중복 마크업 가능성을 시사합니다.
2. 최신 v5 소스의 `scripts/build-site.mjs`는 완전한 `DiscussionForumPosting` JSON-LD를 생성하고, `js/explorer-post.js`는 같은 ID의 기존 스크립트를 교체합니다. `explore/post/index.html` 템플릿 자체에는 `DiscussionForumPosting` microdata가 없습니다.
3. Google의 필수 필드: `datePublished`, `author` 및 작성자 이름과 내용. `url`, `author.url`은 권장 속성이므로 실제 프로필 주소가 없으면 가짜로 만들면 안 됩니다.

## 이번 변경
- `scripts/build-site.mjs`: 중복 `DiscussionForumPosting` 또는 필수 작성일/작성자/URL 누락이 있으면 빌드를 실패 처리하는 검증 추가. 데이터·게시글은 변경하지 않음.
- `scripts/tests/test-build-site.mjs`: 이미지 붙여넣기 모듈과 버블알바 파일을 포함하도록 테스트 픽스처 복구, 버블알바 API mock 분리, 중복 스키마를 의도적으로 주입해 빌드 차단 검증.
- 다른 서비스 런타임·Supabase 정책·메뉴·페이지 타이틀 변경 없음.

## 로컬 검증
- `node scripts/tests/test-build-site.mjs`: PASS (공개/비공개/조회 오류/중복 JSON-LD 방지)
- `node scripts/tests/test-admin-comments.mjs`: PASS
- 전체 로컬 JS/MJS 32개 `node --check`: 오류 0건
- ZIP CRC: 오류 없음

## 반영 절차
1. GitHub `albam09/web.albam09`의 `main` 브랜치에 필요한 변경 파일을 반영.
2. Netlify가 GitHub 기반으로 다시 빌드한 로그에서 `[build-site]` 출력 확인.
3. Google 리치 결과 테스트에서 **실제 URL** 검사. `DiscussionForumPosting`이 1개이고 필수 속성이 있는지 확인.
4. Search Console에서 `수정 결과 확인`을 실행. 이전에 크롤링된 데이터가 즉시 지워지는 것은 아님.

주의: 이 수정은 Google의 실제 색인/검색 순위를 보장하지 않습니다. 운영 배포와 실제 URL 테스트는 이 ZIP 작성 환경에서 직접 실행하지 않았습니다.
