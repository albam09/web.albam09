V13 메인 4개 접기 박스 픽셀 정렬 (V12 기준)

권장: 최신 GitHub 저장소 파일 유지 방법
1. 이 ZIP의 css 폴더와 APPLY_FIX.bat/ps1 파일을 저장소 최상위(netlify.toml 있는 곳)에 복사합니다.
2. APPLY_FIX.bat 실행하면 기존 index.html을 백업하고 새 CSS 링크 한 줄만 추가합니다.
3. GitHub Desktop에서 index.html과 css/albam09-v13-fold-pixel-polish.css만 선택해 Commit -> Push origin합니다.
4. APPLY_FIX.bat/ps1 및 *.bak 파일은 GitHub 커밋에 포함하지 마세요.

브라우저 QA: 1440/390/320px, 접기 4개 한 겹 그림자와 간격, 동일 높이 확인.
Netlify의 실제 운영 배포는 사용자가 푸시한 후 별도 확인해야 합니다.
