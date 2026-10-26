albam09 사이트 통합본 (2026-10-26)

한 개 ZIP으로 로컬 확인 + Netlify 운영 배포에 사용합니다.

[로컬 화면 확인]
1. 이 ZIP의 파일을 모두 같은 폴더에 압축 해제
2. index.html 더블클릭 → 일반 지역·게시판 HTML 내부 링크 이동 가능
3. 로그인/JS fetch/API 등 웹서버가 필요한 기능을 보려면 START_LOCAL_SITE.bat 실행
   - Windows에서 Python이 있으면 Python, 없으면 PowerShell을 이용해 로컬 서버를 엽니다.
   - localhost 서버 실행 시 Supabase 로그인/권한 기능은 OAuth 리디렉션 허용 URL에 따라 제한될 수 있습니다.

[운영 배포]
1. Netlify에 이 ZIP을 업로드합니다. (기존 도메인과 빌드 설정 유지)
2. 배포 후 /page/karaoke01/ ~ /page/karaoke08/ 및 /bbs/ 링크 확인
3. canonical/robots/sitemap/_redirects는 이전 코드에서 변경하지 않았습니다.

[중요]
- SQL 7개, CSS 26개를 모두 원본 그대로 보존했습니다. 35개 제외를 되돌렸습니다.
- 추가 JS는 file:// 환경에서만 동작합니다.
- 서버 운영 URL은 /page/karaoke01/ 등의 기존 주소를 사용합니다.
- 이 작업은 Google 검색 결과의 노출 순위를 보장하는 변경이 아닙니다.
- 파일 검사 및 브라우저 실측 여부는 함께 제공하는 검사 보고서를 참고하세요.

[2026-10-26 URL 이전] 상세 내역: KARAOKE_01_08_URL_MIGRATION_20261026.txt
