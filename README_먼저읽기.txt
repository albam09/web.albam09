ALBAM09 V6 안전 패치 (GitHub Desktop / Netlify)

1. 이 ZIP의 내용(APPLY_FIX.bat, APPLY_FIX.ps1, _PATCH_FILES 폴더)을 GitHub 저장소 루트(netlify.toml 파일이 있는 폴더)에 압축 해제합니다.
2. APPLY_FIX.bat을 실행하면 기존 6개 파일은 GitHub 저장소 상위 폴더에 백업한 뒤 교체하고, 125개 HTML에서 모바일 CSS 버전 쿼리만 갱신합니다.
3. GitHub Desktop에서 변경 파일을 검토하고 Commit -> Push origin 합니다.
4. APPLY_FIX.bat, APPLY_FIX.ps1, README 및 _PATCH_FILES 폴더는 커밋 대상에서 제외하거나 삭제하세요.

기능: 등록 업소 선택 -> 탐험기 업소명을 지도에 링크; 모바일 상단 12개 메뉴 6열 x 2행, 기존 글자 크기 유지.
주의: Netlify 자동 배포의 최종 성공 여부는 Netlify Deploys에서 확인하세요.
