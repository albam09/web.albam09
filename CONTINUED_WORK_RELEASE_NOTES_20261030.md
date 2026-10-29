# albam09 계속 작업 및 검증 결과 — 2026-10-30

## 기준 원본
`albam09_20261030_REGION_GUIDES_LANDMARK_PARKING_FULL.zip` 파일을 풀어 직접 수정했습니다. 앞선 `...INDEX_TITLE_3_KEYWORDS_ADDED.zip`의 누락 문서만 복원했으며, 기존 8개 정규 URL·원본 Supabase·개별 업소 좌표를 그대로 유지했습니다.

## 적용한 실제 수정
- `page/karaoke1~8/index.html`: 8곳에 공신력 있는 자료로 확인한 공영 주차장 정보, 출발지·목적지 구별 방법, 현행 조건 확인 문구 추가.
- `page/karaoke1~6/index.html`: 64개 업소 등록 좌표를 기준으로 누락·중복·다른 좌표군 사례를 지역 안내문 접기 영역 안에 표시. 실제 영업장 주소 및 전용주차장으로 단정하지 않음.
- `page/karaoke7~8/index.html`: 실제 등록 업소가 없는 상태를 명확히 표시. 다른 지역 업소를 임의 삽입하지 않음.
- `VENUE_COORDINATE_AND_REGION_AUDIT_20261030.csv`와 `data/venue-location-audit-20261030.json`: 64개 좌표 원본 및 검토 사유를 1행씩 보존.
- `REGIONAL_SECONDARY_KEYWORDS_800_EVIDENCE_TRIAGE_20261030.csv`: 기존 800개 키워드는 검색량 측정 자료가 아닌 편집용 후보임을 유지하고 지역 랜드마크 적합성에 따라 우선순위만 주석 달아 추가함.
- `css/ab09-regional-research-20261030.css`: 기존 폰트/타이포그래피 정의는 수정하지 않고, 새 자료만 모바일 가독성 스타일을 추가함.

## 최신 공개 근거
- 상무지구 느티나무 공영주차장 33면(2022): https://www.news1.kr/amp/local/gwangju-jeonnam/4840133
- 광주역 관사앞 공영주차장 2026년 무료운영 행정예고(현행 적용 확인은 별도): https://rsve.gbfmc.or.kr/board.es?act=view&bid=0004&list_no=8579&mid=a10204000000&tag=
- 용봉동 제1공영주차장 17면(공공데이터 2024): https://fcpk.purpleo.co.kr/view/14632
- 광주관광 쌍암공원 주차 유무: https://tour.gwangju.go.kr/home/tour/info/park/003.cs?act=view&infoId=266
- 목포 평화광장 원형2 주차타워 174면(2026.09.21): https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material?idx=548820&mode=view&page=7
- ACC 주차장 운영시간: https://www.acc.go.kr/main/contents.do?PID=060103
- 봉선시장 공영주차장 105면(2023 남구 안내): https://www.welfarehello.com/community/hometownNews/%EB%B4%89%EC%84%A0%EC%8B%9C%EC%9E%A5-%EA%B3%B5%EC%98%81%EC%A3%BC%EC%B0%A8%EC%9E%A5-%ED%8E%B8%ED%95%98%EA%B2%8C-%EC%9D%B4%EC%9A%A9%ED%95%98%EC%84%B8%EC%9A%94--0233cdb5-caa5-47d0-991a-aab7b8f8f010

## 아직 확정되지 않은 항목
- 64개 업소 좌표와 실제 업소 사업장 주소의 일치, 중복 좌표의 물리적 의미, 현장 운영 상태는 확인되지 않았습니다.
- 페이지2는 광천동 검색 목적을 담지만 원본 14개 좌표가 치평동 쪽에 모여 있어, 업소를 실제 광천동 주소로 옮기거나 광천동 소재로 표시하지 않았습니다.
- `top탑` 좌표는 같은 용봉동 페이지 내 다른 8개 업체 좌표군에서 크게 떨어져 있습니다.
- K-1·여대생 좌표는 원본에 없습니다.
- 유동인구율(시간대·연령별)은 공식 추정·실측 데이터를 확보하지 못했으므로 %를 임의 산출하지 않았습니다.
- 키워드 800개는 지역 랜드마크를 조합한 편집 후보이지 네이버/구글 검색량·관련검색어 실측값이 아닙니다.
- Google/네이버 검색노출이 개선됐다고 주장하지 않습니다. Netlify 배포와 실제 모바일 성능은 서버 반영 뒤 확인해야 합니다.
