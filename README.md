한국어 | [English](README.en.md)

<div align="center">

# 🗺️ IUM — 역사를 여러 관점으로

**같은 사건, 다른 기억.** 역사적 사건을 지도 위에 펼치고, 각 문명권이 그 사건을 *얼마나 다르게, 얼마나 중요하게* 기억하는지 보여주는 인터랙티브 역사 지도입니다.

*Interactive historical atlas showing how the same event is remembered differently — and how much it matters — across civilizations.*

[데모 보기](#시작하기) · [기여하기](CONTRIBUTING.md) · [English](README.en.md)

</div>

---

## 왜 만들었나

십자군 전쟁은 유럽사에서 중세의 중심 사건이지만, 당대 아랍 연대기에서는 변경의 소규모 분쟁이었습니다.
몽골의 고려 침공은 한국사의 대사건이지만, 몽골 측 기록에서는 변방 작전 중 하나였습니다.

**역사의 비중은 관점에 따라 다릅니다.** IUM은 이 "비중의 비대칭"을 지도 위에서 한눈에 보여줍니다.

## 핵심 기능

- **관점 레이어** — 유럽 / 아랍·이슬람 / 비잔틴 / 고려 / 몽골… 관점별 반투명 원이 겹쳐 표시되고, 원의 크기 = 그 관점에서의 비중
- **타임라인 재생** — 원정 경로와 사건이 시간순으로 펼쳐지고, 사건이 몰린 지역으로 카메라가 따라감
- **관점별 서술 비교** — 사건 클릭 → 각 문명권의 사료·교과서 기반 서술을 출처와 함께 나란히
- **시대별 영토** — 해당 시점의 국가 경계 표시 (근사치)
- **시대 필터** — 기원전 3000년부터 현재까지, 시대를 골라 주제 탐색

## 시작하기

```bash
git clone https://github.com/ium-atlas/ium.git
cd ium
# 프로토타입은 의존성 없는 단일 HTML — 바로 열면 됩니다
open prototype/index.html

# 웹 사이트 (Next.js) — data/의 콘텐츠를 직접 읽습니다
cd web && npm install && npm run dev
```

## 데이터 구조

모든 역사 콘텐츠는 `data/topics/`의 JSON 파일입니다. **코드를 몰라도 기여할 수 있습니다.**

```
data/topics/crusade-1/
  topic.json            # 주제 메타 (기간, 관점 목록, 지도 범위)
  events/jerusalem-1099.json   # 사건 1개 = 파일 1개
  routes.geojson        # 원정 경로
```

사건 파일 예시:

```jsonc
{
  "id": "jerusalem-1099",
  "name": "예루살렘 함락",
  "type": "siege",            // battle | siege | massacre | council | political | treaty | movement | culture
  "date": "1099-07",
  "location": { "lng": 35.23, "lat": 31.78 },
  "perspectives": {
    "eu":  { "name": "예루살렘 해방",        "weight": 95, "narrative": "...", "sources": ["..."] },
    "ar":  { "name": "예루살렘 함락과 학살",  "weight": 70, "narrative": "...", "sources": ["..."] },
    "byz": { "name": "(정치적 거리두기)",     "weight": 30, "narrative": "...", "sources": ["..."] }
  }
}
```

`weight`(0–100)가 이 프로젝트의 핵심입니다 — 각 관점의 역사 서술 전통에서 그 사건이 차지하는 비중. 산정 기준은 [CONTRIBUTING.md](CONTRIBUTING.md#비중-산정-기준)를 보세요.

## 기여하기

- 🐛 **오류 제보·출처 제안** — [이슈 열기](../../issues/new/choose). 가장 쉬운 기여입니다
- 📜 **사건 추가/보완** — JSON 파일 하나로 PR. 모든 서술에 출처 필수
- 🌍 **새 주제 제안** — 관점 비대칭이 큰 사건일수록 환영합니다

자세한 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 읽어주세요. 모든 PR은 CI가 스키마를 자동 검증합니다.

## 로드맵

- [x] 프로토타입 (1차 십자군, 몽골 제국과 고려)
- [ ] 데이터 ↔ 프로토타입 자동 연동 (현재는 프로토타입에 데이터 내장)
- [ ] Next.js 사이트 (사건별 정적 페이지, SEO)
- [ ] 영어판
- [ ] 사이트 내 기여 폼

## 라이선스

- **코드**: [MIT](LICENSE)
- **데이터** (`data/`): [CC BY-SA 4.0](data/LICENSE) — 출처를 밝히고 동일 조건으로 공유하면 상업적 사용 포함 자유롭게 쓸 수 있습니다

## English

For the full English translation, see [README.en.md](README.en.md).
