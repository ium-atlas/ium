import { getTopicIds, getTopic } from '@/lib/data';
import TopicMap from '@/components/TopicMap';

export function generateStaticParams() {
  return getTopicIds().map(id => ({ topic: id }));
}

export function generateMetadata({ params }) {
  const t = getTopic(params.topic);
  return {
    title: `${t.title} (${t.subtitle})`,
    description: `${t.title} — ${t.perspectives.map(p => p.label).join('·')} ${t.perspectives.length}개 관점으로 보는 인터랙티브 역사 지도. 사건 ${t.events.length}개를 타임라인으로 재생하세요.`,
  };
}

export default function TopicPage({ params }) {
  const topic = getTopic(params.topic);
  return <TopicMap topic={topic} />;
}
