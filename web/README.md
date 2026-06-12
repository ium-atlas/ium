# IUM 웹 서비스 (Next.js)

## 실행

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

## 빌드 (정적 출력)

```bash
npm run build    # out/ 폴더에 정적 사이트 생성
```

`out/`을 Vercel, Cloudflare Pages, GitHub Pages 등 아무 정적 호스팅에 올리면 된다.
(Vercel은 레포 연결만 하면 자동 — output: 'export' 설정이 이미 되어 있음)

## 구조

```
app/
  page.jsx                 홈 — 세계지도 + 주제 카드 + 시대 필터
  [topic]/page.jsx         주제 뷰 (SSG)
  [topic]/[event]/page.jsx 사건 페이지 (SSG + SEO 메타 + 서버렌더 본문)
  sitemap.js               사이트맵 자동 생성
components/
  HomeMap.jsx              홈 지도 (클라이언트)
  TopicMap.jsx             주제 지도 — 타임라인·관점 레이어·연대기·패널 (클라이언트)
lib/
  data.js                  data/topics JSON 로더 (빌드 타임, 서버 전용)
  icons.js                 사건 유형 아이콘 8종 + 공용 유틸
data/topics/               역사 데이터 (repo/data와 동일 구조)
```

## 콘텐츠 추가

`data/topics/<주제>/events/`에 JSON 추가 → `npm run build` 하면 사건 페이지가 자동 생성된다.
스키마와 검증: `../repo/schema/`, `node ../repo/scripts/validate.js`

## 주의

- 사건 페이지 URL: `/<topic>/<event-id>/` (예: `/crusade-1/jerusalem/`)
- 배포 후 `app/sitemap.js`의 `base`를 실제 도메인으로 교체할 것
- 영토 데이터(historical-basemaps)는 런타임 fetch — 출시 전 라이선스 확인 필요 (MVP_기획_십자군.md 참조)
