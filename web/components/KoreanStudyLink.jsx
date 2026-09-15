'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function KoreanStudyLink() {
  const pathname = usePathname();
  if (pathname?.startsWith('/study/')) return null;
  return <Link href="/study/korean-history/" aria-label="한국사 심화 학습 코스 열기" style={{position:'fixed',bottom:'max(18px, env(safe-area-inset-bottom))',right:18,zIndex:30,padding:'11px 17px',borderRadius:24,background:'#1c3b36',color:'#fffaf0',border:'1px solid #8eac95',font:'600 14px system-ui',textDecoration:'none',boxShadow:'0 3px 14px #0003'}}>한국사 심화 공부 →</Link>;
}
