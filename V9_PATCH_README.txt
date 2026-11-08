ALBAM09 V9 — V8 안전 패치 (GitHub Desktop / Netlify)
기준: ALBAM09_V8_GOOGLE_SEARCH_FIXED_FULL_SITE(1).zip

1. 기존 GitHub 폴더 백업 또는 작업 커밋 먼저 진행
2. 본 패치 ZIP의 css/, js/, scripts/, data/, map/, page/ ... 파일을
   GitHub 저장소의 netlify.toml이 있는 최상위 폴더에 동일한 경로로 덮어쓰기
3. GitHub Desktop에서 변경 파일 검토 → Commit → Push origin
4. Netlify Deploys에서 빌드 성공 확인

변경점: 모바일 메뉴 높이/간격, 메인 업소 좌측 슬라이더,
탐험기 구조화 데이터, 도로명주소 검색, 검증된 건물기준 핀,
동구/남구 지역 안내, 공개 폴더 dist 보안 분리, 배포 API 재시도.
업소의 실제 출입구/영업 여부까지 확인됐다는 의미는 아닙니다.

이 ZIP은 V8 해당 버전 기준이며 GitHub의 더 최신 별도 변경이 있다면
전체 ZIP 대신 패치 변경 내용을 충돌 없이 반영해야 합니다.
전체 검토 기록: docs/V9_RELEASE_QA.md
64개 주소/핀 표: docs/V9_VENUE_LOCATION_AUDIT.csv
