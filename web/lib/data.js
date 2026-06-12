import fs from 'fs';
import path from 'path';

const DATA_ROOT = path.join(process.cwd(), '..', 'data');
const ROOT = path.join(DATA_ROOT, 'topics');
const MILESTONES_ROOT = path.join(DATA_ROOT, 'milestones');
export const YEAR_MIN = -3000;
export const YEAR_MAX = 2030;

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

export function getTopicWithContemporaries(id) {
  const topic = getTopic(id);
  return {
    ...topic,
    events: topic.events.map(event => ({
      ...event,
      contemporaries: getContemporariesForEvent(id, event.id),
    })),
  };
}

export function getAllTopicEvents() {
  return getTopicIds().flatMap(topicId => {
    const topic = getTopic(topicId);
    return topic.events.map(event => ({
      id: event.id,
      kind: 'topicEvent',
      topicId,
      topicTitle: topic.title,
      topicSubtitle: topic.subtitle,
      regionLabel: topic.title,
      label: event.name,
      type: event.type,
      date: event.date,
      year: yearFromDate(event.date),
      startYear: yearFromDate(event.date),
      endYear: yearFromDate(event.date),
      location: event.location,
      href: `/${topicId}/${event.id}/`,
    }));
  });
}

export function getMilestoneRegions() {
  const file = path.join(MILESTONES_ROOT, 'regions.json');
  if (!fs.existsSync(file)) return [];
  const raw = readJson(file, []);
  if (Array.isArray(raw)) return raw.map(normalizeRegion).filter(Boolean);
  if (Array.isArray(raw.regions)) return raw.regions.map(normalizeRegion).filter(Boolean);
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([id, value]) => normalizeRegion({ id, ...value })).filter(Boolean);
  }
  return [];
}

export function getMilestones() {
  if (!fs.existsSync(MILESTONES_ROOT)) return [];

  const regions = new Map(getMilestoneRegions().map(region => [region.id, region]));
  return fs.readdirSync(MILESTONES_ROOT)
    .filter(file => file.endsWith('.json') && file !== 'regions.json')
    .flatMap(file => {
      const regionId = path.basename(file, '.json');
      const region = regions.get(regionId) || { id: regionId, label: regionId };
      const raw = readJson(path.join(MILESTONES_ROOT, file), []);
      const rows = Array.isArray(raw) ? raw : raw.milestones || raw.items || [];
      return rows.map((row, index) => normalizeMilestone(row, region, index)).filter(Boolean);
    })
    .sort((a, b) => a.startYear - b.startYear || a.regionLabel.localeCompare(b.regionLabel));
}

export function getYearMapItems() {
  return [
    ...getAllTopicEvents().map(event => ({
      ...event,
      yearLabel: formatYearRange(event.startYear, event.endYear),
    })),
    ...getMilestones().filter(milestone => milestone.anchor).map(milestone => ({
      ...milestone,
      yearLabel: formatYearRange(milestone.startYear, milestone.endYear),
      location: milestone.anchor,
    })),
  ];
}

export function getYearContent(year) {
  const y = Number(year);
  const events = getAllTopicEvents().filter(event => event.year === y);
  const milestones = getMilestones().filter(milestone => containsYear(milestone, y));
  return {
    year: y,
    events,
    milestones,
    total: events.length + milestones.length,
  };
}

export function getContentYears(minCount = 2) {
  const years = new Set();
  getAllTopicEvents().forEach(event => years.add(event.year));
  getMilestones().forEach(milestone => {
    const start = Math.max(YEAR_MIN, milestone.startYear);
    const end = Math.min(YEAR_MAX, milestone.endYear);
    for (let year = start; year <= end; year++) years.add(year);
  });
  return [...years]
    .filter(year => getYearContent(year).total >= minCount)
    .sort((a, b) => a - b);
}

export function getYearCounts(minCount = 1) {
  return Object.fromEntries(
    getContentYears(minCount).map(year => [year, getYearContent(year).total])
  );
}

export function getContemporariesForEvent(topicId, eventId, span = 10) {
  const topic = getTopic(topicId);
  const event = topic.events.find(e => e.id === eventId);
  if (!event) return [];
  const year = yearFromDate(event.date);
  const lo = year - span;
  const hi = year + span;

  const topicEvents = getAllTopicEvents()
    .filter(item => item.topicId !== topicId && item.year >= lo && item.year <= hi)
    .map(item => ({
      kind: item.kind,
      id: `${item.topicId}-${item.id}`,
      regionLabel: item.regionLabel,
      label: item.label,
      year: item.year,
      yearLabel: formatYearRange(item.startYear, item.endYear),
      href: item.href,
    }));

  const milestones = getMilestones()
    .filter(item => item.endYear >= lo && item.startYear <= hi)
    .map(item => ({
      kind: item.kind,
      id: item.id,
      regionLabel: item.regionLabel,
      label: item.label,
      year: item.startYear,
      yearLabel: formatYearRange(item.startYear, item.endYear),
      sources: item.sources,
    }));

  return [...topicEvents, ...milestones]
    .sort((a, b) => a.year - b.year || a.regionLabel.localeCompare(b.regionLabel) || a.label.localeCompare(b.label));
}

export function monthIndex(s) {
  const neg = s[0] === '-';
  const [y, m] = (neg ? s.slice(1) : s).split('-').map(Number);
  return (neg ? -y : y) * 12 + m - 1;
}

export function yearFromDate(s) {
  if (!s) return null;
  const neg = s[0] === '-';
  const [y] = (neg ? s.slice(1) : s).split('-').map(Number);
  return neg ? -y : y;
}

export function formatYear(year) {
  return year < 0 ? `BC ${Math.abs(year)}` : String(year);
}

export function formatYearRange(start, end) {
  return start === end ? formatYear(start) : `${formatYear(start)}–${formatYear(end)}`;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function normalizeRegion(region) {
  if (!region || typeof region !== 'object') return null;
  const id = region.id || region.code || region.slug;
  if (!id) return null;
  const anchor = normalizePoint(region.anchor);
  return {
    ...region,
    id,
    label: region.label || region.name || id,
    anchor,
  };
}

function normalizeMilestone(row, region, index) {
  if (!row || typeof row !== 'object') return null;
  const range = normalizeRange(row);
  if (!range) return null;
  const [startYear, endYear] = range;
  const label = row.label || row.title || row.name;
  if (!label) return null;
  return {
    id: `${region.id}-${index}`,
    kind: 'milestone',
    regionId: region.id,
    regionLabel: row.regionLabel || region.label || region.id,
    label,
    note: row.note || null,
    year: startYear,
    startYear,
    endYear,
    anchor: normalizePoint(row.anchor) || region.anchor || null,
    sources: Array.isArray(row.sources) ? row.sources : [],
  };
}

function normalizeRange(row) {
  if (typeof row.year === 'number') return [row.year, row.year];
  if (Array.isArray(row.range) && row.range.length >= 2) {
    const start = Number(row.range[0]);
    const end = Number(row.range[1]);
    if (Number.isFinite(start) && Number.isFinite(end)) return start <= end ? [start, end] : [end, start];
  }
  if (row.range && typeof row.range === 'object') {
    const start = Number(row.range.start ?? row.range.from);
    const end = Number(row.range.end ?? row.range.to);
    if (Number.isFinite(start) && Number.isFinite(end)) return start <= end ? [start, end] : [end, start];
  }
  if (typeof row.range === 'string') {
    const parts = row.range.split(/\s*(?:-|–|—|~)\s*/).map(Number);
    if (parts.length >= 2 && parts.every(Number.isFinite)) {
      return parts[0] <= parts[1] ? [parts[0], parts[1]] : [parts[1], parts[0]];
    }
  }
  return null;
}

function normalizePoint(point) {
  if (!point || typeof point !== 'object') return null;
  const lng = Number(point.lng);
  const lat = Number(point.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function containsYear(item, year) {
  return item.startYear <= year && item.endYear >= year;
}
