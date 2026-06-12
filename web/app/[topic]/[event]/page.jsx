import { getTopicIds, getTopic, getTopicWithContemporaries } from '@/lib/data';
import TopicMap from '@/components/TopicMap';
import { ICONS } from '@/lib/icons';

export function generateStaticParams() {
  const params = [];
  getTopicIds().forEach(id => {
    getTopic(id).events.forEach(e => params.push({ topic: id, event: e.id }));
  });
  return params;
}

export function generateMetadata({ params }) {
  const t = getTopic(params.topic);
  const ev = t.events.find(e => e.id === params.event);
  if (!ev) return {};
  const names = t.perspectives
    .filter(p => (ev.perspectives[p.code]?.weight || 0) >= 10)
    .map(p => `${p.label}: ${ev.perspectives[p.code]?.name || '-'}`).join(' / ');
  return {
    title: `${ev.name} (${ev.date}) — 관점별 비교`,
    description: `${ev.name} — 같은 사건, 다른 기억. ${names}`,
  };
}

export default function EventPage({ params }) {
  const topic = getTopicWithContemporaries(params.topic);
  const ev = topic.events.find(e => e.id === params.event);
  const visible = topic.perspectives.filter(p => (ev.perspectives[p.code]?.weight || 0) >= 10);

  return (
    <>
      <TopicMap topic={topic} initialEventId={params.event} />
      <article className="article">
        <h1>{ev.name}</h1>
        <div className="meta">{ev.date} · {(ICONS[ev.type] || ICONS.political).label} · {topic.title}</div>
        {visible.map(p => {
          const persp = ev.perspectives[p.code];
          return (
            <section key={p.code}>
              <h2>
                <span className="dot" style={{ background: p.color }} />
                {p.label}의 기록 <span className="weight">— 비중 {persp.weight}/100{persp.name ? ` · "${persp.name}"` : ''}</span>
              </h2>
              <p>{persp.narrative || '서술 준비 중입니다. 사료 기반 서술 기여를 환영합니다.'}</p>
              {persp.sources?.length > 0 && <div className="srcs">출처: {persp.sources.join(' · ')}</div>}
            </section>
          );
        })}
      </article>
    </>
  );
}
