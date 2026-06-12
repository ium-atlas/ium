'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import { BASE_STYLE, fmtY } from '@/lib/icons';

const RANGE_MIN = -3000;
const RANGE_MAX = 2030;
const DEFAULT_RANGE = [RANGE_MIN, RANGE_MAX];

const COMING_SOON = [
  { title: '임진왜란', subtitle: '1592–1598 · 준비 중', period: [1592, 1598], card: [128.5, 36.2] },
];

const CHIPS = [
  { label: '전체', r: [-3000, 2030] },
  { label: '고대', r: [-3000, 500] },
  { label: '중세', r: [500, 1500] },
  { label: '11세기', r: [1000, 1100] },
  { label: '13세기', r: [1200, 1300] },
  { label: '16세기', r: [1500, 1600] },
  { label: '19세기', r: [1800, 1900] },
  { label: '20세기', r: [1900, 2000] },
];

export default function HomeMap({ topics, yearItems = [], yearCounts = {} }) {
  const router = useRouter();
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const yearMarkersRef = useRef([]);
  const fitYearRef = useRef(null);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [urlReady, setUrlReady] = useState(false);
  const [lo, hi] = range;
  const yearMode = lo === hi;
  const activeYearItems = yearMode ? yearItems.filter(item => item.startYear <= lo && item.endYear >= lo) : [];
  const mappedYearItems = activeYearItems.filter(item => item.location);
  const contentCount = yearMode ? (yearCounts[String(lo)] || activeYearItems.length) : 0;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map', style: BASE_STYLE, center: [60, 35], zoom: 1.7, maxZoom: 8,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    const avgW = (t, code) => {
      if (!t.avgWeights) return 50;
      return t.avgWeights[code] ?? 50;
    };
    topics.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tcard';
      const bars = t.perspectives.map(p =>
        `<i style="width:${6 + avgW(t, p.code) * 0.55}px;background:${p.color}"></i>`).join('');
      const ws = t.perspectives.map(p => avgW(t, p.code));
      const spread = Math.max(...ws) - Math.min(...ws);
      el.innerHTML = `<div class="tt">${t.title}</div>
        <div class="tp">${t.subtitle} · 관점 ${t.perspectives.length}</div>
        <div class="tb">${bars}</div>
        <div class="badge">${spread >= 30 ? '비대칭 지수 높음 ★' : '비대칭 보통'}</div>`;
      el.onclick = () => router.push('/' + t.id + '/');
      const mk = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(t.card).addTo(map);
      markersRef.current.push({ period: t.period, el, mk });
    });
    yearItems.filter(item => item.location).forEach(item => {
      const el = document.createElement('div');
      el.className = `ymarker ${item.kind === 'milestone' ? 'milestone' : 'topic-event'}`;
      el.innerHTML = `<div class="ym-region">${escapeHtml(item.regionLabel)}</div>
        <div class="ym-label">${escapeHtml(item.label)}</div>
        <div class="ym-year">${escapeHtml(item.yearLabel)}</div>`;
      if (item.href) {
        el.onclick = event => {
          event.stopPropagation();
          router.push(item.href);
        };
      }
      el.style.display = 'none';
      const mk = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([item.location.lng, item.location.lat])
        .addTo(map);
      yearMarkersRef.current.push({ item, el, mk });
    });
    COMING_SOON.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tcard soon';
      el.innerHTML = `<div class="tt">${t.title}</div><div class="tp">${t.subtitle}</div><div class="badge">준비 중</div>`;
      const mk = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(t.card).addTo(map);
      markersRef.current.push({ period: t.period, el, mk });
    });

    return () => { markersRef.current = []; yearMarkersRef.current = []; map.remove(); };
  }, [topics, yearItems, router]);

  useEffect(() => {
    const parsed = readRangeFromUrl();
    if (parsed) setRange(parsed);
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    writeRangeToUrl(range);
  }, [range, urlReady]);

  useEffect(() => {
    const singleYear = lo === hi;
    markersRef.current.forEach(({ period, el }) => {
      el.style.display = !singleYear && period[1] >= lo && period[0] <= hi ? '' : 'none';
    });
    const visibleYearMarkers = [];
    yearMarkersRef.current.forEach(marker => {
      const visible = singleYear && marker.item.startYear <= lo && marker.item.endYear >= lo;
      marker.el.style.display = visible ? '' : 'none';
      if (visible) visibleYearMarkers.push(marker);
    });
    if (!singleYear) {
      fitYearRef.current = null;
      return;
    }
    if (fitYearRef.current === lo) return;
    fitYearRef.current = lo;
    focusYearMarkers(mapRef.current, visibleYearMarkers);
  }, [lo, hi]);

  const setLo = v => setRange(([_, hi]) => { const n = clampYear(v); return n > hi ? [hi, n] : [n, hi]; });
  const setHi = v => setRange(([lo, _]) => { const n = clampYear(v); return n < lo ? [n, lo] : [lo, n]; });
  const pct = v => ((v - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;

  return (
    <div className="mapwrap">
      <div id="map" />
      <div className="topbar">
        <a className="logo" href="/">IUM<small>세계 — 시대를 골라 역사를 펼쳐보세요</small></a>
      </div>
      <div className="botbar">
        <div className="era-chips">
          {CHIPS.map(c => (
            <button key={c.label}
              className={'chip' + (c.r[0] === lo && c.r[1] === hi ? ' on' : '')}
              onClick={() => setRange([...c.r])}>{c.label}</button>
          ))}
          <div className="era-inputs">
            정확한 연도
            <input type="number" value={lo} step={1} onChange={e => setLo(+e.target.value)} title="음수 = 기원전" />
            –
            <input type="number" value={hi} step={1} onChange={e => setHi(+e.target.value)} />
          </div>
        </div>
        <div className="dual">
          <div className="rail" />
          <div className="fill" style={{ left: pct(lo) + '%', width: pct(hi) - pct(lo) + '%' }} />
          <input type="range" min={RANGE_MIN} max={RANGE_MAX} step={1} value={lo} onChange={e => setLo(+e.target.value)} />
          <input type="range" min={RANGE_MIN} max={RANGE_MAX} step={1} value={hi} onChange={e => setHi(+e.target.value)} />
        </div>
        <div className="era-labels"><span>← 기원전 3000</span><span>BC 1000</span><span>0</span><span>1000</span><span>현재 →</span></div>
        <div className={'era-sel' + (yearMode ? ' year-on' : '')}>
          {yearMode ? (
            <>
              <span>{fmtY(lo)}년의 세계 · 콘텐츠 {contentCount}개 · 지도 표시 {mappedYearItems.length}개</span>
              {contentCount >= 2 && <a href={`/year/${lo}/`}>연도 페이지</a>}
            </>
          ) : (
            <span>{fmtY(lo)} – {fmtY(hi)} 시대의 주제를 보는 중</span>
          )}
        </div>
      </div>
    </div>
  );
}

function clampYear(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(RANGE_MIN, Math.min(RANGE_MAX, Math.round(n)));
}

function readRangeFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.has('year')) {
    const year = clampYear(params.get('year'));
    return [year, year];
  }
  if (params.has('from') || params.has('to')) {
    const from = clampYear(params.get('from') ?? RANGE_MIN);
    const to = clampYear(params.get('to') ?? RANGE_MAX);
    return from <= to ? [from, to] : [to, from];
  }
  return null;
}

function writeRangeToUrl(range) {
  if (typeof window === 'undefined') return;
  const [lo, hi] = range;
  const url = new URL(window.location.href);
  url.searchParams.delete('year');
  url.searchParams.delete('from');
  url.searchParams.delete('to');
  if (lo === hi) {
    url.searchParams.set('year', String(lo));
  } else if (lo !== DEFAULT_RANGE[0] || hi !== DEFAULT_RANGE[1]) {
    url.searchParams.set('from', String(lo));
    url.searchParams.set('to', String(hi));
  }
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function focusYearMarkers(map, markers) {
  if (!map || markers.length === 0) return;
  const coords = markers.map(marker => [marker.item.location.lng, marker.item.location.lat]);
  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: Math.max(map.getZoom(), 3.4), duration: 650 });
    return;
  }
  const bounds = coords.reduce(
    (box, coord) => box.extend(coord),
    new maplibregl.LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 110, maxZoom: 4.8, duration: 650 });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
