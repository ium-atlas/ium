import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

export const metadata = {
  title: { default: 'IUM — 역사를 여러 관점으로', template: '%s | IUM' },
  description: '같은 사건, 다른 기억. 역사적 사건을 지도 위에 펼치고 각 문명권이 얼마나 다르게 기억하는지 보여주는 인터랙티브 역사 지도.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
