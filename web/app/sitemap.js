import { getTopicIds, getTopic } from '@/lib/data';

export const dynamic = 'force-static';

export default function sitemap() {
  const base = 'https://example.com'; // 배포 후 실제 도메인으로 교체
  const urls = [{ url: base, priority: 1 }];
  getTopicIds().forEach(id => {
    urls.push({ url: `${base}/${id}/`, priority: 0.8 });
    getTopic(id).events.forEach(e => urls.push({ url: `${base}/${id}/${e.id}/`, priority: 0.6 }));
  });
  return urls;
}
