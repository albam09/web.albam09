# CLS 예방 수정 / 2026-10-23

기준: albam09_full_20261023_explore_titles_original_h1.zip

변경: 실제 제공되는 Albam09Cute.ttf 파일을 woff2로 잘못 명시한 inline @font-face 선언을 truetype으로 교정하고, swap을 block으로 변경했습니다. 폰트 preload를 추가했습니다.
기존 원본의 시각적 디자인, HTML H1, title, JS, SEO URL, 이미지, Supabase, 카드 레이아웃은 그대로 두었습니다.

검증 범위: ZIP 무결성, 해당 HTML 폰트 경로 및 format 선언, 기존 탐험기 title/H1 변경 없음.
유의: 브라우저 CLS 실측은 이 실행 환경의 로컬 브라우저 접근 제한으로 완료하지 못했습니다. 페이지스피드 CLS 0.162 개선 여부는 운영/스테이징 배포 후 확인이 필요합니다.
