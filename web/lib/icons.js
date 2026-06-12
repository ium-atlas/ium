export const ICONS = {
  battle:   { label: '전투',     tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linecap="round" stroke-linejoin="round" fill="{C}"><path fill="none" d="M5 4l15 15M19 4L4 19"/><circle cx="4.5" cy="19.5" r="2"/><circle cx="19.5" cy="19.5" r="2"/></g>' },
  siege:    { label: '공방전',   tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linejoin="round" fill="{C}"><path d="M6 21V8h2.5V5H11v3h2V5h2.5v3H18v13z"/></g>' },
  massacre: { label: '학살',     tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linejoin="round" fill="{C}"><path d="M12 2c1.5 4-3.5 5.5-3.5 9.5a3.5 3.5 0 007 0c0-2-.8-3-.8-4.5 2 1.2 3.8 3.8 3.8 6.5a6.5 6.5 0 11-13 0C5.5 8.5 10 6.5 12 2z"/></g>' },
  council:  { label: '회의·선언', tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="5" y="4" width="14" height="16" rx="2" fill="{C}" fill-opacity="0.15"/><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/></g>' },
  political:{ label: '정치·즉위', tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linejoin="round" fill="{C}"><path d="M4.5 18h15l1.2-8.5-4.7 2.8L12 6.5l-4 5.8-4.7-2.8z"/></g>' },
  treaty:   { label: '조약·강화', tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linejoin="round" fill="{C}"><circle cx="12" cy="9" r="4.5" fill="none"/><circle cx="12" cy="9" r="1.6"/><path fill="none" d="M9.5 13l-2 8 4.5-2.6 4.5 2.6-2-8"/></g>' },
  movement: { label: '천도·이동', tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M3.5 12h14M12 5.5l6.5 6.5-6.5 6.5"/></g>' },
  culture:  { label: '문화·종교', tpl: '<g stroke="{C}" stroke-width="{W}" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 5.5C6.5 4 9.5 4 12 5.5c2.5-1.5 5.5-1.5 8 0V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0zM12 5.5V19"/></g>' },
};

export function iconSVG(type, size, fg, halo) {
  const t = (ICONS[type] || ICONS.political).tpl;
  const inner = (halo ? t.replaceAll('{C}', halo).replaceAll('{W}', '5.5') : '') +
    t.replaceAll('{C}', fg).replaceAll('{W}', '1.8');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${inner}</svg>`;
}

export function loadIcons(map) {
  Object.keys(ICONS).forEach(k => {
    const img = new Image(44, 44);
    img.onload = () => { if (!map.hasImage('ic-' + k)) map.addImage('ic-' + k, img); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSVG(k, 44, '#ffffff', '#10141c'));
  });
}

export const MIN_W = 10;

export const ami = s => {
  const neg = s[0] === '-';
  const [y, m] = (neg ? s.slice(1) : s).split('-').map(Number);
  return (neg ? -y : y) * 12 + m - 1;
};
export const fmtM = a => {
  const y = Math.floor(a / 12), m = a - y * 12 + 1;
  return (y < 0 ? 'BC ' + (-y) : y) + '.' + String(m).padStart(2, '0');
};
export const fmtY = y => (y < 0 ? 'BC ' + (-y) : String(y));

export const BASE_STYLE = {
  version: 8,
  sources: {
    phys: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256, maxzoom: 8,
      attribution: 'Esri World Physical Map',
    },
  },
  layers: [{ id: 'phys', type: 'raster', source: 'phys' }],
};
