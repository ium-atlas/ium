import { getAllTopics, getTopic } from '@/lib/data';
import HomeMap from '@/components/HomeMap';

export default function Home() {
  const topics = getAllTopics().map(meta => {
    const full = getTopic(meta.id);
    const avgWeights = {};
    meta.perspectives.forEach(p => {
      avgWeights[p.code] = Math.round(
        full.events.reduce((s, e) => s + (e.perspectives[p.code]?.weight || 0), 0) / (full.events.length || 1)
      );
    });
    return { ...meta, avgWeights };
  });
  return <HomeMap topics={topics} />;
}
