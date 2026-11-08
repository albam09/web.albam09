ALBAM09 V8 전체 사이트 수정본
버전: 20261108-search-fix-v8

ZIP의 최상위에 index.html, netlify.toml, _redirects, css, js, data, page 등이 있습니다.

[GitHub → Netlify 자동 배포를 사용하는 경우]
1. 압축을 풉니다.
2. 이 ZIP 안의 파일·폴더 내용을 현재 Netlify와 연결된 GitHub 저장소의 사이트 루트에 반영합니다.
3. GitHub 변경을 커밋한 뒤 Netlify의 새 배포 완료를 확인합니다.
4. 배포된 /data/release.json의 release가 20261108-search-fix-v8인지 확인합니다.
Git 자동 배포 중에는 수동으로 올린 파일이 이후 Git 배포에 덮어써질 수 있으므로 저장소에도 수정본을 반영해야 합니다.

[수동 배포를 사용하는 경우]
압축을 푼 뒤 index.html이 바로 들어 있는 사이트 폴더 전체를 배포합니다.

[로컬 확인]
START_LOCAL_SITE.bat를 사용해 로컬 서버에서 확인합니다.

[수정 및 검증 내역]
docs/GOOGLE_SEARCH_FIX_V8.md
docs/V8_REGION_CHANGES.csv
docs/V8_VALIDATION.json

이 파일은 업로드용 전체 수정본입니다. 현재 운영 중인 사이트를 자동으로 변경하거나 Google 순위·지도 계정 제한을 해제한 것은 아닙니다.
