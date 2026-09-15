# 한강 지도 수업 데이터

- `han-river.js`: 5개 역사 장면, 현대 지역 대표점, 지도 확인 문제. 역사 근거 URL은 각 장면의 `sources`에 있습니다.
- `han-river-geography.json`: Natural Earth의 육지 윤곽과 한강·남한강 수계를 SVG 경로로 변환한 로컬 자료입니다. 수업은 외부 지도 서버를 호출하지 않습니다.

## 지형 출처

2026-09-15에 아래 공개 데이터를 내려받아 가공했습니다. Natural Earth 데이터는 public domain입니다.

- [1:50m 국가 윤곽](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson)
  - 원본 SHA-256: `3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb`
- [1:10m 하천 중심선](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson)
  - 원본 SHA-256: `bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a`

한국·북한·중국·일본·러시아 중 화면에 걸치는 15개 육지 다각형을 같은 색으로 그립니다. 현대 국경선은 별도로 표시하지 않습니다. 하천은 한국에 위치한 `Han`, `Namhan` 두 선형만 사용합니다. 화면 좌표는 `x=(경도-123.7)×90`, `y=(40.6-위도)×105`로 변환했습니다. 화면은 학습용이며 거리나 면적 측정을 위한 지도가 아닙니다.

나라별 면적을 칠하지 않습니다. 지명 기호와 화살표는 해당 장면의 공격·확보·천도 방향을 설명하며 정확한 국경·행군로를 주장하지 않습니다. 6군·10군의 정확한 비정에는 불명확한 부분이 있습니다. 관산성 점은 옥천 지역의 대표점입니다.

검증: 저장소 루트에서 `node scripts/validate-han-river.js`.


## 구현 파일과 진도 보존

- `web/app/study/korean-history/han-river/page.jsx`, `han-river.css`: 지도 수업 경로와 반응형 화면.
- `web/components/HanRiverLesson.jsx`: 5개 장면 이동, 지명 선택, 지도 확인 문제 3개, 키보드 조작.
- `web/components/KoreanHistoryMapLessonEntry.jsx`: 기존 코스 상단의 지도 수업 진입 카드.
- `web/components/KoreanHistoryCourse.jsx`, `web/app/study/korean-history/study.css`: 진입 카드 연결과 스타일만 추가.
- `web/lib/lessons/han-river.js`, `han-river-geography.json`: 역사 설명·문제와 로컬 지형 자료.
- `scripts/validate-han-river.js`, `.github/workflows/validate.yml`: 지도 수업 검증 및 CI 실행.

기존 60단원·140문항의 데이터와 `ium-korean-history-study-v1` 저장 키를 유지합니다. 새 지도 확인 문제 3개는 별도의 화면 상태로만 진행되며 기존 진도·답안을 변경하지 않습니다.

## 검증 내역

- 5개 장면의 순서, 7개 위치의 모바일 화면 포함 여부, 경로 대상, HTTPS 출처, 지도 확인 문제 3개의 정답 참조 검증 통과.
- 기존 학습 모듈 검증과 지도 데이터 검증 오류 0건.
- 데스크톱·390px 모바일에서 단계 이동, 지도 지명 선택, 오답 후 정답 위치 강조, 3문제 결과 표시, 키보드 이동 확인.
- SVG 제목을 단일 문자열로 렌더링하여 서버·클라이언트 HTML 불일치 해결 후 개발 화면 경고 0건 확인.
- 최종 정적 빌드와 배포 후 확인은 배포 담당 검수에서 수행합니다.
