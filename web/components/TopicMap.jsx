'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { BASE_STYLE, ICONS, iconSVG, loadIcons, MIN_W, ami, fmtM } from '@/lib/icons';

export default function TopicMap({ topic, initialEventId }) {
  const T = topic;
  const m0 = ami(T.start);
  const total = ami(T.end) - m0;
  const evMonth = e => ami(e.date) - m0;

  const mapRef = useRef(null);
  const playTimer = useRef(null);
  const terrState = useRef({ loaded: null, req: 0, cache: {} });
  const [cur, setCur] = useState(initialEventId ? Math.max(0, evMonth(T.events.find(e => e.id === initialEventId) || T.events[0])) : 0);
  const [playing, setPlaying] = useState(false);
  const [enabled, setEnabled] = useState(() => Object.fromEntries(T.perspectives.map(p => [p.code, true])));
  const [terrOn, setTerrOn] = useState(true);
  const [terrYear, setTerrYear] = useState(null);
  const [openEv, setOpenEv] = useState(initialEventId ? T.events.find(e => e.id === initialEventId) || null : null);
  const [tab, setTab] = useState(T.perspectives[0].code);
  const curRef = useRef(cur);
  curRef.current = cur;

  const w = (e, c) => e.perspectives[c]?.weight ?? 0;

  // ── 지도 데이터
  const routeGeo = useCallback(c => ({
    type: 'FeatureCollection',
    features: T.routes.features.map(f => {
      const coords = f.geometry.coordinates.filter((_, i) => ami(f.properties.timeline[i]) - m0 <= c);
      return { type: 'Feature', properties: { color: f.properties.color },
        geometry: { type: 'LineString', coordinates: coords.length > 1 ? coords : [] } };
    }),
  }), [T, m0]);

  const eventGeo = useCallback(() => ({
    type: 'FeatureCollection',
    features: T.events.map(e => {
      const props = { id: e.id, m: evMonth(e), type: e.type };
      T.perspectives.forEach(p => { props['w_' + p.code] = w(e, p.code); });
      return { type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [e.location.lng, e.location.lat] } };
    }),
  }), [T]);

  // ── 영토
  const updateTerr = useCallback(async (c, on) => {
    const map = mapRef.current, st = terrState.current;
    if (!map || !T.territory_years?.length || !on || !map.getSource('terr')) return;
    const year = Math.floor((m0 + c) / 12);
    let pick = T.territory_years[0];
    T.territory_years.forEach(y => { if (y <= year) pick = y; });
    if (pick === st.loaded) return;
    const req = ++st.req;
    if (!st.cache[pick]) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${pick}.geojson`);
        if (!r.ok) throw 0;
        const gj = await r.json();
        const PAL = ['#4a90d9', '#3eb489', '#b06ad9', '#e8884a', '#d94a4a', '#d9c44a', '#5dc4d9', '#d96aa8'];
        gj.features.forEach(f => {
          const n = f.properties.NAME || f.properties.name || '';
          let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
          f.properties._n = n; f.properties._c = PAL[h % PAL.length];
        });
        st.cache[pick] = gj;
      } catch { return; }
    }
    if (req !== st.req || !map.getSource('terr')) return;
    map.getSource('terr').setData(st.cache[pick]);
    st.loaded = pick;
    setTerrYear(pick);
  }, [T, m0]);

  // ── 카메라
  const focusCamera = useCallback((list, clickZoom) => {
    const map = mapRef.current;
    if (!map || !list.length) return;
    const e0 = list[0];
    const near = T.events.filter(e => evMonth(e) <= curRef.current &&
      Math.abs(e.location.lng - e0.location.lng) < 6 && Math.abs(e.location.lat - e0.location.lat) < 6);
    if (near.length >= 2) {
      const lngs = near.map(e => e.location.lng), lats = near.map(e => e.location.lat);
      map.fitBounds([[Math.min(...lngs) - 1.5, Math.min(...lats) - 1.5], [Math.max(...lngs) + 1.5, Math.max(...lats) + 1.5]],
        { duration: 850, maxZoom: 6.5, padding: 80 });
    } else {
      map.flyTo({ center: [e0.location.lng, e0.location.lat], zoom: clickZoom || Math.max(map.getZoom(), 4.8), duration: 850 });
    }
  }, [T]);

  // ── 지도 초기화
  useEffect(() => {
    const map = new maplibregl.Map({ container: 'map', style: BASE_STYLE, bounds: T.bounds, maxZoom: 8 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
      loadIcons(map);
      map.addSource('terr', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'terr-fill', type: 'fill', source: 'terr', paint: { 'fill-color': ['get', '_c'], 'fill-opacity': .14 } });
      map.addLayer({ id: 'terr-line', type: 'line', source: 'terr', paint: { 'line-color': '#5a6678', 'line-width': .8, 'line-opacity': .6 } });

      map.addSource('routes', { type: 'geojson', data: routeGeo(curRef.current) });
      map.addLayer({ id: 'routes', type: 'line', source: 'routes',
        paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': .85 },
        layout: { 'line-cap': 'round', 'line-join': 'round' } });

      map.addSource('events', { type: 'geojson', data: eventGeo() });
      T.perspectives.forEach(p => {
        map.addLayer({ id: 'ev-' + p.code, type: 'circle', source: 'events',
          filter: ['all', ['<=', ['get', 'm'], curRef.current], ['>=', ['get', 'w_' + p.code], MIN_W]],
          paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'w_' + p.code], 0, 2, 100, 24],
            'circle-color': p.color, 'circle-opacity': .28,
            'circle-stroke-width': 1.6, 'circle-stroke-color': p.color, 'circle-stroke-opacity': .9 } });
      });
      map.addLayer({ id: 'ev-ic', type: 'symbol', source: 'events',
        filter: ['<=', ['get', 'm'], curRef.current],
        layout: { 'icon-image': ['concat', 'ic-', ['get', 'type']], 'icon-size': 0.5,
          'icon-allow-overlap': true, 'icon-ignore-placement': true } });

      const clickLayers = [...T.perspectives.map(p => 'ev-' + p.code), 'ev-ic'];
      clickLayers.forEach(l => {
        map.on('click', l, e => {
          const ev = T.events.find(x => x.id === e.features[0].properties.id);
          if (ev) setOpenEv(ev);
        });
        map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', l, () => { map.getCanvas().style.cursor = ''; });
      });
      map.on('click', 'terr-fill', e => {
        if (map.queryRenderedFeatures(e.point, { layers: clickLayers.filter(l => map.getLayer(l)) }).length) return;
        new maplibregl.Popup({ closeButton: false }).setLngLat(e.lngLat)
          .setHTML(`<b>${e.features[0].properties._n || '(이름 없음)'}</b> · ${terrState.current.loaded}년경`).addTo(map);
      });

      updateTerr(curRef.current, true);
      if (initialEventId) {
        const ev = T.events.find(x => x.id === initialEventId);
        if (ev) setTimeout(() => focusCamera([ev], 5.5), 600);
      }
    });
    return () => { clearInterval(playTimer.current); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── cur 변경 → 지도 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('routes')) return;
    map.getSource('routes').setData(routeGeo(cur));
    T.perspectives.forEach(p =>
      map.setFilter('ev-' + p.code, ['all', ['<=', ['get', 'm'], cur], ['>=', ['get', 'w_' + p.code], MIN_W]]));
    map.getLayer('ev-ic') && map.setFilter('ev-ic', ['<=', ['get', 'm'], cur]);
    updateTerr(cur, terrOn);
  }, [cur, terrOn, T, routeGeo, updateTerr]);

  // ── 레이어 토글
  const toggleLayer = code => {
    setEnabled(prev => {
      const next = { ...prev, [code]: !prev[code] };
      const map = mapRef.current;
      if (map?.getLayer('ev-' + code))
        map.setLayoutProperty('ev-' + code, 'visibility', next[code] ? 'visible' : 'none');
      return next;
    });
  };
  const toggleTerr = () => {
    setTerrOn(prev => {
      const next = !prev;
      const map = mapRef.current;
      ['terr-fill', 'terr-line'].forEach(l => map?.getLayer(l) &&
        map.setLayoutProperty(l, 'visibility', next ? 'visible' : 'none'));
      if (next) updateTerr(curRef.current, true);
      return next;
    });
  };

  // ── 재생
  const togglePlay = () => {
    if (playing) { clearInterval(playTimer.current); setPlaying(false); return; }
    setPlaying(true);
    if (curRef.current >= total) setCur(0);
    const step = Math.max(1, Math.round(total / 80));
    playTimer.current = setInterval(() => {
      const prev = curRef.current;
      if (prev >= total) {
        clearInterval(playTimer.current); setPlaying(false);
        mapRef.current?.fitBounds(T.bounds, { duration: 1500 });
        return;
      }
      const next = Math.min(total, prev + step);
      setCur(next);
      focusCamera(T.events.filter(e => { const m = evMonth(e); return m > prev && m <= next; }));
    }, 400);
  };

  // ── 패널 데이터
  const openEvent = ev => {
    setOpenEv(ev);
    const visTabs = T.perspectives.filter(p => w(ev, p.code) >= MIN_W);
    if (visTabs.length && !visTabs.find(p => p.code === tab)) setTab(visTabs[0].code);
  };
  const chronClick = ev => {
    const m = evMonth(ev);
    if (m > cur) setCur(m);
    setTimeout(() => focusCamera([ev], 5.5), 0);
    openEvent(ev);
  };

  const usedTypes = [...new Set(T.events.map(e => e.type))];
  const nowEvents = T.events.filter(e => evMonth(e) === cur);
  const narrP = openEv?.perspectives[tab];
  const contemporaries = openEv?.contemporaries || [];

  return (
    <div className="mapwrap">
      <div id="map" />

      <div className="topbar">
        <a className="logo" href="/">IUM<small>{T.title} {T.subtitle}</small></a>
        <a className="backbtn" href="/">← 세계지도</a>
        <div className="layers">
          {T.perspectives.map(p => (
            <div key={p.code} className={'lay ' + (enabled[p.code] ? 'on' : 'off')} onClick={() => toggleLayer(p.code)}>
              <span className="sw" style={{ background: p.color }} />{p.label}
            </div>
          ))}
          {T.territory_years?.length > 0 && (
            <div className={'lay ' + (terrOn ? 'on' : 'off')} onClick={toggleTerr}>
              <span className="sw" style={{ background: '#5a6678' }} />영토
            </div>
          )}
        </div>
        <div className="hint">원의 크기 = 관점 비중{terrYear ? ` · 영토는 ${terrYear}년경 기준 (근사치)` : ''}</div>
      </div>

      <div className="chron">
        <h3>연대기 — 시대순</h3>
        <div className="chron-list">
          {T.events.map(e => {
            const m = evMonth(e);
            return (
              <div key={e.id} className={'ce' + (m > cur ? ' future' : '') + (m === cur ? ' now' : '')} onClick={() => chronClick(e)}>
                <div className="cd">{fmtM(ami(e.date))} <em>· {(ICONS[e.type] || ICONS.political).label}</em></div>
                <div className="cn">
                  <span dangerouslySetInnerHTML={{ __html: iconSVG(e.type, 14, '#9ab3c4') }} />
                  <span>{e.name}</span>
                </div>
                <div className="cw">
                  {T.perspectives.filter(p => w(e, p.code) >= MIN_W).map(p => (
                    <i key={p.code} style={{ width: 4 + w(e, p.code) * 0.45, background: p.color, opacity: enabled[p.code] ? 1 : .15 }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={'panel' + (openEv ? ' open' : '')}>
        {openEv && (
          <>
            <div className="panel-head">
              <button className="panel-close" onClick={() => setOpenEv(null)}>✕</button>
              <div className="ev-date">{fmtM(ami(openEv.date))}</div>
              <div className="ev-title">{openEv.name}</div>
            </div>
            <div className="gauge">
              <h4>관점별 비중 · 명칭</h4>
              {T.perspectives.filter(p => w(openEv, p.code) >= MIN_W).map(p => (
                <div key={p.code}>
                  <div className="grow">
                    <span className="lab">{p.label}</span>
                    <div className="gbar"><div className="gfill" style={{ width: w(openEv, p.code) + '%', background: p.color }} /></div>
                    <span className="val">{w(openEv, p.code)}</span>
                  </div>
                  <div className="gname">{openEv.perspectives[p.code]?.name || ''}</div>
                </div>
              ))}
            </div>
            <div className="tabs">
              {T.perspectives.filter(p => w(openEv, p.code) >= MIN_W).map(p => (
                <button key={p.code} className={'tab' + (tab === p.code ? ' on' : '')} onClick={() => setTab(p.code)}>{p.label}</button>
              ))}
            </div>
            <div className="narr">
              {narrP?.narrative
                ? <span>{narrP.narrative}</span>
                : <span className="placeholder">[ 서술 준비 중 — 사료 기반 서술이 들어갈 자리 ]</span>}
              {narrP?.sources?.length > 0 && <div className="src">출처: {narrP.sources.join(' · ')}</div>}
              {contemporaries.length > 0 && (
                <div className="same-era">
                  <h4>같은 시기, 세계는</h4>
                  <div className="same-era-list">
                    {contemporaries.map(item => {
                      const body = (
                        <>
                          <div className="same-era-top">
                            <span>{item.regionLabel}</span>
                            <em>{item.yearLabel}</em>
                          </div>
                          <div className="same-era-label">{item.label}</div>
                        </>
                      );
                      return item.href ? (
                        <a key={`${item.kind}-${item.id}`} className="same-era-item link" href={item.href}>{body}</a>
                      ) : (
                        <div key={`${item.kind}-${item.id}`} className="same-era-item">{body}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="iconlegend">
        {usedTypes.map(k => (
          <span key={k}>
            <span dangerouslySetInnerHTML={{ __html: iconSVG(k, 13, '#cdd6e0') }} />
            {(ICONS[k] || ICONS.political).label}
          </span>
        ))}
      </div>

      <div className="botbar">
        <div className="tl-top">
          <button className="playbtn" onClick={togglePlay}>{playing ? '❚❚' : '▶'}</button>
          <div className="cur-date">{fmtM(m0 + cur)}</div>
          <div className="cur-event">{nowEvents.map(e => e.name).join(' · ')}</div>
        </div>
        <div className="track">
          {T.events.map(e => (
            <div key={e.id} className={'tm' + (evMonth(e) > cur ? ' future' : '')}
              style={{ left: (evMonth(e) / total * 100) + '%' }}
              data-n={`${fmtM(ami(e.date))} ${e.name}`}
              onClick={() => { setCur(evMonth(e)); openEvent(e); }} />
          ))}
        </div>
        <input className="tlslider" type="range" min={0} max={total} step={1} value={cur}
          onChange={e => setCur(+e.target.value)} />
        <div className="tl-labels">
          <span>{fmtM(m0)} {T.events[0]?.name}</span>
          <span>{fmtM(m0 + total)} {T.events[T.events.length - 1]?.name}</span>
        </div>
      </div>
    </div>
  );
}
