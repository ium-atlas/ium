import fs from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd(), '..', 'data', 'topics');

export function getTopicIds() {
  return fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, 'topic.json')));
}

export function getTopicMeta(id) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, id, 'topic.json'), 'utf8'));
}

export function getTopic(id) {
  const meta = getTopicMeta(id);
  const edir = path.join(ROOT, id, 'events');
  const events = fs.readdirSync(edir).filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(edir, f), 'utf8')));
  const rfile = path.join(ROOT, id, 'routes.geojson');
  const routes = fs.existsSync(rfile) ? JSON.parse(fs.readFileSync(rfile, 'utf8')) : { type: 'FeatureCollection', features: [] };
  events.sort((a, b) => monthIndex(a.date) - monthIndex(b.date));
  return { ...meta, events, routes };
}

export function getAllTopics() {
  return getTopicIds().map(getTopicMeta);
}

export function monthIndex(s) {
  const neg = s[0] === '-';
  const [y, m] = (neg ? s.slice(1) : s).split('-').map(Number);
  return (neg ? -y : y) * 12 + m - 1;
}
