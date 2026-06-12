'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import { BASE_STYLE, fmtY } from '@/lib/icons';

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

export default function HomeMap({ topics }) {
  const router = useRouter();
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [range, setRange] = useState([-3000, 2030]);

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
    COMING_SOON.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tcard soon';
      el.innerHTML = `<div class="tt">${t.title}</div><div class="tp">${t.subtitle}</div><div class="badge">준비 중</div>`;
      const mk = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(t.card).addTo(map);
      markersRef.current.push({ period: t.period, el, mk });
    });

    return () => { markersRef.current = []; map.remove(); };
  }, [topics, router]);

  useEffect(() => {
    const [lo, hi] = range;
    markersRef.current.forEach(({ period, el }) => {
      el.style.display = period[1] >= lo && period[0] <= hi ? '' : 'none';
    });
  }, [range]);

  const setLo = v => setRange(([_, hi]) => { const n = Math.max(-3000, Math.min(2030, v)); return n > hi ? [hi, n] : [n, hi]; });
  const setHi = v => setRange(([lo, _]) => { const n = Math.max(-3000, Math.min(2030, v)); return n < lo ? [n, lo] : [lo, n]; });
  const pct = v => ((v + 3000) / 5030) * 100;
  const [lo, hi] = range;

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
            <input type="number" value={lo} step={10} onChange={e => setLo(+e.target.value)} title="음수 = 기원전" />
            –
            <input type="number" value={hi} step={10} onChange={e => setHi(+e.target.value)} />
          </div>
        </div>
        <div className="dual">
          <div className="rail" />
          <div className="fill" style={{ left: pct(lo) + '%', width: pct(hi) - pct(lo) + '%' }} />
          <input type="range" min={-3000} max={2030} step={10} value={lo} onChange={e => setLo(+e.target.value)} />
          <input type="range" min={-3000} max={2030} step={10} value={hi} onChange={e => setHi(+e.target.value)} />
        </div>
        <div className="era-labels"><span>← 기원전 3000</span><span>BC 1000</span><span>0</span><span>1000</span><span>현재 →</span></div>
        <div className="era-sel">{fmtY(lo)} – {fmtY(hi)} 시대의 주제를 보는 중</div>
      </div>
    </div>
  );
}
