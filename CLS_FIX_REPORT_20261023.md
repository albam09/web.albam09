# CLS 수정 / 2026-10-23 — 페이지 렌더링 순서 보정

PageSpeed 보고서에서 `.daum-wm-content.hero-desc`가 전체 CLS 0.165의 이동 요소로 표시되며, `/fonts/Albam09Cute.ttf`가 관련 웹 글꼴로 노출되었습니다.

기준 ZIP: albam09_full_20261023_cls_font_fix.zip (탐험기 SEO Title 유지, H1 원본 복구).

수정 내용: 10개 페이지에서 HTML `</html>` 뒤에 존재하던 `albam09-h1-index-size-sync-20260622` 와 `albam09-final-font-size-last` 스타일 블록을 문자 그대로 보존한 채 `<head>`로 옮겼습니다. 최초 렌더링 전에 글꼴 및 글자 크기 스타일을 파악하도록 개선합니다. 이전 단계의 TTF format 수정과 preload도 보존했습니다.

변경하지 않은 것: 스타일 선언의 구체 값, 웹 글꼴 파일, 이미지, JS, HTML 본문과 H1, title, canonical, Supabase 연결 및 라우팅.

검사: ZIP CRC 전체 검사, 10개 HTML에서 스타일 블록이 `<head>` 안에 하나씩 존재하는지 검증.

주의: 실제 CLS 수치는 브라우저와 PageSpeed 재측정 전에는 0.1 이하로 개선되었다고 보장할 수 없습니다. PageSpeed 의 `레이아웃 변경 원인`은 이동한 요소를 보여줄 뿐, 글꼴만이 유일한 원인임을 확증하지 않습니다.
