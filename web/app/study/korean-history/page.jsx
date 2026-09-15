import { getKoreanHistoryCourse } from '@/lib/study';
import KoreanHistoryCourse from '@/components/KoreanHistoryCourse';
import './study.css';

export const metadata = {
  title: '한국사 심화 학습',
  description: '선사부터 현대까지 개념, 지도, 자체 제작 복습 문제로 이어지는 한국사능력검정시험 심화 학습 코스.',
};

export default function KoreanHistoryStudyPage() {
  return <KoreanHistoryCourse modules={getKoreanHistoryCourse()} />;
}
