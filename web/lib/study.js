import fs from 'fs';
import path from 'path';

export function getKoreanHistoryCourse() {
  const root = path.join(process.cwd(), '..', 'data');
  const folder = path.join(root, 'study');
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(name => name.endsWith('.json')).map(name => {
    const module = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
    return {
      ...module,
      sections: module.sections.map(section => ({
        ...section,
        eventRefs: section.eventRefs.map(ref => {
          const eventFile = path.join(root, 'topics', ref.topicId, 'events', `${ref.eventId}.json`);
          const event = JSON.parse(fs.readFileSync(eventFile, 'utf8'));
          return { ...ref, name: event.name, date: event.date };
        }),
      })),
    };
  }).sort((a, b) => a.order - b.order);
}
