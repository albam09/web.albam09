# 2026-10-27 지역별 안내 박스 추가 및 외부 상세페이지 연결 점검

## 변경 파일
- page/karaoke1~8/index.html : 각 페이지 1개씩 지역별 독립 접기 안내 박스 추가
- REGIONAL_SECONDARY_KEYWORDS_800_EDITORIAL.csv : 지역별 100개×8=800개 키워드 *조사·편집 후보*. 검색량 데이터 또는 실제 Google 검색 횟수로 오인하지 마세요. 홈페이지 본문에 전부 쏟아 넣지 않았습니다.

## 수정하지 않은 항목
- index.html / 기타 BBS·탐험기 / CSS·JS / Supabase SQL / 이미지 / 업소 기존 프로필 링크 주소 / _redirects / robots.txt / sitemap.xml / SEO title·canonical·H1
- ilovebam11.com/place/ 의 사진과 본문은 파일에 들어 있지 않으며 외부 사이트도 수정하지 않았습니다.
- albam09 각 지역 구조화 데이터의 LocalBusiness item.url에 기존 외부 ilovebam11.com 주소가 있었던 경우 그 url 속성만 제거 (업소 자체의 @id, name, description, mainEntityOfPage는 보존).
- noindex 추가 없음. 기존 외부 place 상세보기 a 링크의 rel=nofollow 유지.

## 검색엔진·외부 place 타협안
- 지역 페이지는 albam09.com 자기 주소 self-canonical을 그대로 유지.
- albam09에서 외부 place로 나가는 HTML 링크에는 원래 rel=nofollow가 이미 설정돼 있음. Google 가이드에 따르면 외부로 연결한다는 사실만으로 상대 사이트가 '본 사이트'가 되는 것은 아님.
- 제휴 유료 광고가 있다면 별도 판단 후 rel=sponsored 검토. 무료 제휴·자체 설명 링크 모두를 일괄 광고로 오분류하지 않음.
- 기존 place 페이지에 noindex, 이미지 수정, 본문 수정 또는 리디렉션 요구 없음.
- LocalBusiness의 url은 Google 문서에서 권장 항목이므로 제거가 리치결과에 어떤 영향을 줄지는 실제 배포 뒤 테스트가 필요. JSON-LD 속성 하나를 제거한다고 albam09 검색 순위가 오른다는 보장은 없음.
- 실제 Google이 어느 URL을 대표로 선택했는지는 Search Console URL 검사 데이터가 필요함.

## 검색어 편집 원칙
- 후보 키워드는 구체적인 지역×검증 가능한 랜드마크×업종×이용 의도 조합을 정리한 기획 목록임.
- 실제 검색량·자동완성 노출을 측정한 800개의 실증 키워드가 아니며, 특정 키워드를 검색하면 해당 업종의 업체가 반드시 존재한다는 뜻도 아님.
- INDEX와 다른 지역 페이지 문단을 재활용하지 않고 8개 지역에 독립된 4개 단락씩 새로 작성.
- 업소별 서비스, 실가격, 실제 후기, 제휴 검색순위/매출 보장은 만들어 넣지 않음.

## 지리 근거
- 광주광역시관광 관광 안내: 충장로·금남로·5·18기념공원 및 자유공원.
- GIST 공식 오시는 길: 과학기술원은 북구 오룡동에 위치, 광산구 첨단지구 상권과 동일 위치로 취급하지 않음.
- 기존 업소 등록 데이터: 쌍암동, 치평동, 유동/경양로, 용봉동/저불로, 하당/남악 등의 위치 단서.
- 남악은 전남 무안군 행정구역. 하당과 평화광장은 목포, 거리·시간은 임의 단정하지 않음.

## 참조
- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=ko
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ko
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=ko
