import { ICONS } from '@/lib/icons';
import { formatYear, formatYearRange, getContentYears, getYearContent } from '@/lib/data';

export function generateStaticParams() {
  return getContentYears(2).map(year => ({ year: String(year) }));
}

export function generateMetadata({ params }) {
  const year = Number(params.year);
  const content = getYearContent(year);
  const parts = [
    content.milestones.length ? `지역 기록 ${content.milestones.length}개` : null,
    content.events.length ? `토픽 사건 ${content.events.length}개` : null,
  ].filter(Boolean);
  const summary = parts.length ? parts.join(', ') : '동시대 기록';
  return {
    title: `${formatYear(year)}년의 세계 — ${summary}`,
    description: `${formatYear(year)}년의 세계 — ${summary}를 한 화면에서 비교합니다.`,
  };
}

export default function YearPage({ params }) {
  const year = Number(params.year);
  const content = getYearContent(year);
  const years = getContentYears(2);
  const index = years.indexOf(year);
  const prevYear = index > 0 ? years[index - 1] : null;
  const nextYear = index >= 0 && index < years.length - 1 ? years[index + 1] : null;
  const milestonesByRegion = groupByRegion(content.milestones);

  return (
    <main className="year-page">
      <div className="year-shell">
        <header className="year-header">
          <a className="logo" href="/">IUM<small>같은 해, 세계는</small></a>
          <a className="backbtn" href={`/?year=${year}`}>지도에서 보기</a>
        </header>

        <section className="year-hero">
          <div className="year-kicker">동시대 단면</div>
          <h1>{formatYear(year)}년의 세계</h1>
          <p>
            지역 기록 {content.milestones.length}개와 토픽 사건 {content.events.length}개를
            같은 연도 위에 놓고 봅니다.
          </p>
        </section>

        <nav className="year-nav" aria-label="콘텐츠가 있는 이전/다음 연도">
          {prevYear === null ? <span /> : <a href={`/year/${prevYear}/`}>← {formatYear(prevYear)}년</a>}
          <a href="/">세계지도</a>
          {nextYear === null ? <span /> : <a href={`/year/${nextYear}/`}>{formatYear(nextYear)}년 →</a>}
        </nav>

        <section className="year-section">
          <h2>이때 여기는</h2>
          {milestonesByRegion.length ? (
            <div className="year-regions">
              {milestonesByRegion.map(group => (
                <article key={group.regionLabel} className="year-region">
                  <h3>{group.regionLabel}</h3>
                  {group.items.map(item => (
                    <div key={item.id} className="year-row">
                      <div className="year-row-main">
                        <span>{formatYearRange(item.startYear, item.endYear)}</span>
                        <strong>{item.label}</strong>
                      </div>
                      {item.note && <p>{item.note}</p>}
                      <div className="year-sources">출처: {item.sources.join(' · ')}</div>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          ) : (
            <p className="year-empty">등록된 지역 milestone은 아직 없습니다.</p>
          )}
        </section>

        <section className="year-section">
          <h2>토픽 사건</h2>
          {content.events.length ? (
            <div className="year-events">
              {content.events.map(event => (
                <a key={`${event.topicId}-${event.id}`} className="year-event" href={event.href}>
                  <span>{event.topicTitle}</span>
                  <strong>{event.label}</strong>
                  <em>{event.date} · {(ICONS[event.type] || ICONS.political).label}</em>
                </a>
              ))}
            </div>
          ) : (
            <p className="year-empty">이 연도에 연결된 토픽 사건은 아직 없습니다.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function groupByRegion(items) {
  const groups = new Map();
  items.forEach(item => {
    if (!groups.has(item.regionLabel)) groups.set(item.regionLabel, []);
    groups.get(item.regionLabel).push(item);
  });
  return [...groups.entries()].map(([regionLabel, groupItems]) => ({
    regionLabel,
    items: groupItems.sort((a, b) => a.startYear - b.startYear || a.label.localeCompare(b.label)),
  }));
}
