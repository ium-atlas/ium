'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import KoreanHistoryMapLessonEntry from '@/components/KoreanHistoryMapLessonEntry';

const STORAGE_KEY = 'ium-korean-history-study-v1';
const keyFor = (moduleId, id) => `${moduleId}:${id}`;
const initialProgress = { completed: [], answers: {}, moduleId: '' };

function cleanProgress(value, modules) {
  if (!value || typeof value !== 'object' || value.version !== 1) return initialProgress;
  const validSections = new Set(modules.flatMap(m => m.sections.map(s => keyFor(m.id, s.id))));
  const answers = {};
  modules.forEach(m => m.questions.forEach(q => {
    const key = keyFor(m.id, q.id), answer = value.answers?.[key];
    if (Number.isInteger(answer) && answer >= 0 && answer < q.choices.length) answers[key] = answer;
  }));
  return {
    completed: Array.isArray(value.completed) ? [...new Set(value.completed.filter(id => validSections.has(id)))] : [],
    answers,
    moduleId: modules.some(m => m.id === value.moduleId) ? value.moduleId : modules[0]?.id || '',
  };
}

function Sources({ sources }) {
  return <details className="kh-sources"><summary>근거 자료 {sources.length}개</summary><ul>{sources.map((source, index) => <li key={`${source}-${index}`}><a href={source} target="_blank" rel="noopener noreferrer">자료 {index + 1} · {source.includes('history.go.kr') ? '국사편찬위원회' : source.includes('encykorea') ? '한국민족문화대백과사전' : source.includes('heritage') ? '국가유산 자료' : '출처 확인'} ↗</a></li>)}</ul></details>;
}

export default function KoreanHistoryCourse({ modules }) {
  const [progress, setProgress] = useState(initialProgress);
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [choice, setChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [quizMessage, setQuizMessage] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const quizHeading = useRef(null);
  const moduleHeading = useRef(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProgress(cleanProgress(JSON.parse(raw), modules));
      else setProgress({ ...initialProgress, moduleId: modules[0]?.id || '' });
    } catch {
      setStorageMessage('저장된 기록을 읽을 수 없어 새 학습 기록으로 시작합니다.');
    }
    setReady(true);
  }, [modules]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...progress })); }
    catch { setStorageMessage('이 브라우저에서 기록을 저장할 수 없습니다. 현재 화면에서는 계속 공부할 수 있습니다.'); }
  }, [progress, ready]);

  const current = modules.find(m => m.id === progress.moduleId) || modules[0];
  const allSections = modules.reduce((n, m) => n + m.sections.length, 0);
  const allQuestions = modules.reduce((n, m) => n + m.questions.length, 0);
  const completedCount = progress.completed.length;
  const percent = allSections ? Math.round(completedCount / allSections * 100) : 0;
  const wrong = current?.questions.filter(q => {
    const answer = progress.answers[keyFor(current.id, q.id)];
    return Number.isInteger(answer) && answer !== q.answerIndex;
  }) || [];
  const question = quiz && !quiz.finished ? current?.questions.find(q => q.id === quiz.ids[quiz.index]) : null;

  function selectModule(id) {
    setProgress(p => ({ ...p, moduleId: id }));
    setQuiz(null); setChoice(null); setSubmitted(false); setQuizMessage('');
    setTimeout(() => moduleHeading.current?.focus(), 0);
  }
  function toggleCompleted(sectionId) {
    const key = keyFor(current.id, sectionId);
    setProgress(p => ({ ...p, completed: p.completed.includes(key) ? p.completed.filter(x => x !== key) : [...p.completed, key] }));
  }
  function startQuiz(wrongOnly = false) {
    const pool = wrongOnly ? wrong : current.questions;
    if (!pool.length) return;
    setQuiz({ ids: pool.map(q => q.id), index: 0, correct: 0, finished: false, wrongOnly });
    setChoice(null); setSubmitted(false); setQuizMessage('');
    setTimeout(() => quizHeading.current?.focus(), 0);
  }
  function submitAnswer(event) {
    event.preventDefault();
    if (!question || submitted) return;
    if (choice === null) { setQuizMessage('보기를 하나 선택해 주세요.'); return; }
    setProgress(p => ({ ...p, answers: { ...p.answers, [keyFor(current.id, question.id)]: choice } }));
    setQuiz(q => ({ ...q, correct: q.correct + (choice === question.answerIndex ? 1 : 0) }));
    setSubmitted(true); setQuizMessage('');
  }
  function nextQuestion() {
    if (!submitted) return;
    setQuiz(q => q.index + 1 >= q.ids.length ? { ...q, finished: true } : { ...q, index: q.index + 1 });
    setChoice(null); setSubmitted(false); setQuizMessage('');
    setTimeout(() => quizHeading.current?.focus(), 0);
  }
  function resetProgress() {
    setProgress({ ...initialProgress, moduleId: modules[0]?.id || '' });
    setQuiz(null); setChoice(null); setSubmitted(false); setResetRequested(false);
  }

  if (!current) return <main className="kh-page"><p>학습 자료를 준비하고 있습니다.</p><Link href="/">지도로 돌아가기</Link></main>;

  return <main className="kh-page">
    <a href="#kh-content" className="kh-skip">본문으로 건너뛰기</a>
    <div className="kh-shell">
      <header className="kh-header"><Link href="/" className="kh-brand">IUM <span>역사를 이해하는 시간</span></Link><Link href="/">역사 지도 ↗</Link></header>
      <KoreanHistoryMapLessonEntry />
      <section className="kh-hero" aria-labelledby="kh-title">
        <div><p className="kh-eyebrow">KOREAN HISTORY · 심화 학습</p><h1 id="kh-title">한국사의 흐름을,<br />내 지식으로.</h1><p className="kh-intro">선사부터 현대까지 개념을 읽고, 지도에서 연결하고, 문제로 확인하세요.</p><p className="kh-note">한능검 심화 80점 이상을 목표로 구성한 학습 자료입니다. 복습 문제는 자체 제작이며 실제 시험 점수를 보장하지 않습니다.</p></div>
        <div className="kh-progress-card"><span>나의 학습 진도</span><strong>{ready ? `${percent}%` : '—'}</strong><progress value={completedCount} max={allSections || 1} aria-label="개념 단원 학습 진도" /><p>{completedCount} / {allSections}개 단원 학습 완료</p><small>{modules.length}개 시대 · 복습 {allQuestions}문항<br />이 브라우저에 기록이 저장됩니다.</small></div>
      </section>
      {storageMessage && <p role="status" className="kh-notice">{storageMessage}</p>}
      <details className="kh-week"><summary>이번 주 학습 순서 · 매일 개념 → 지도 → 복습</summary><ol>{modules.map((m, i) => <li key={m.id}><button type="button" onClick={() => selectModule(m.id)} disabled={!ready}>{i + 1}일차 · {m.title}</button><span>{m.sections.length}단원과 {m.questions.length}문제</span></li>)}</ol><p>마지막 날에는 전 시대의 오답을 다시 풀고, 순서·왕대·문화재를 섞어서 확인하세요. 공부할 시간이 짧은 날은 핵심 포인트와 오답 해설을 먼저 읽으세요.</p></details>
      <nav className="kh-era-nav" aria-label="시대 선택">{modules.map(m => <button key={m.id} type="button" aria-current={m.id === current.id ? 'page' : undefined} onClick={() => selectModule(m.id)} disabled={!ready}><span>{String(m.order).padStart(2, '0')}</span>{m.title}<small>{m.period[0] < 0 ? `기원전 ${Math.abs(m.period[0])}` : m.period[0]}–{m.period[1]}</small></button>)}</nav>
      <div className="kh-main-grid" id="kh-content">
        <aside className="kh-outline"><p className="kh-eyebrow">이 시대의 학습 순서</p><ol>{current.sections.map(s => <li key={s.id}><a href={`#kh-${current.id}-${s.id}`}><span aria-label={progress.completed.includes(keyFor(current.id, s.id)) ? '완료' : '미완료'}>{progress.completed.includes(keyFor(current.id, s.id)) ? '✓' : '○'}</span>{s.title}</a></li>)}</ol><button className="kh-primary" onClick={() => startQuiz()} disabled={!ready || !current.questions.length}>복습 문제 풀기</button><button className="kh-secondary" onClick={() => startQuiz(true)} disabled={!ready || !wrong.length}>오답만 복습 · {wrong.length}</button></aside>
        <div className="kh-content">
          <header className="kh-module-heading"><p className="kh-eyebrow">CHAPTER {String(current.order).padStart(2, '0')}</p><h2 ref={moduleHeading} tabIndex={-1}>{current.title}</h2><p>{current.summary}</p><div className="kh-topic-links">{current.topicIds.map(id => <Link key={id} href={`/${encodeURIComponent(id)}/`}>관련 시대 지도 ↗</Link>)}</div></header>
          {current.sections.map(section => {
            const done = progress.completed.includes(keyFor(current.id, section.id));
            return <article className="kh-section" id={`kh-${current.id}-${section.id}`} key={section.id}>
              <h3>{section.title}</h3><div className="kh-body">{section.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
              <div className="kh-keypoints"><h4>이것은 기억하세요</h4><ul>{section.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul></div>
              {!!section.eventRefs.length && <div className="kh-events"><h4>지도에서 이어 보기</h4><ul>{section.eventRefs.map(ref => <li key={`${ref.topicId}:${ref.eventId}`}><Link href={`/${encodeURIComponent(ref.topicId)}/${encodeURIComponent(ref.eventId)}/`}>{ref.name} <span>↗</span></Link></li>)}</ul></div>}
              <Sources sources={section.sources} /><button type="button" className={`kh-complete ${done ? 'is-done' : ''}`} aria-pressed={done} onClick={() => toggleCompleted(section.id)} disabled={!ready}>{done ? '✓ 학습 완료 · 다시 누르면 취소' : '이 단원 학습 완료하기'}</button>
            </article>;
          })}
          <section className="kh-quiz" aria-labelledby="kh-quiz-heading">
            <p className="kh-eyebrow">RECALL & REVIEW · 자체 제작 5지선다</p><h2 id="kh-quiz-heading" ref={quizHeading} tabIndex={-1}>{quiz?.finished ? '이번 복습을 마쳤습니다' : '개념을 내 것으로 만드는 확인 문제'}</h2>
            {!quiz && <><p>답을 제출하면 정답과 오답의 차이를 설명합니다. 틀린 문제는 오답 복습에 모아 둡니다.</p><div className="kh-actions"><button className="kh-primary" onClick={() => startQuiz()} disabled={!ready}>전체 {current.questions.length}문제 시작</button><button className="kh-secondary" onClick={() => startQuiz(true)} disabled={!ready || !wrong.length}>오답 {wrong.length}문제 풀기</button></div></>}
            {quiz?.finished && <div aria-live="polite"><p className="kh-result">{quiz.correct} / {quiz.ids.length}문제 정답</p><p>이번 자체 제작 복습의 결과입니다. 실제 한능검 점수나 급수로 환산하지 않습니다.</p><div className="kh-actions"><button className="kh-primary" onClick={() => startQuiz()}>전체 문제 다시 풀기</button><button className="kh-secondary" onClick={() => startQuiz(true)} disabled={!wrong.length}>남은 오답 {wrong.length}개 복습</button><button className="kh-secondary" onClick={() => setQuiz(null)}>개념 학습으로</button></div></div>}
            {question && <form onSubmit={submitAnswer} key={question.id}><p className="kh-question-count">{quiz.wrongOnly ? '오답 복습' : '전체 복습'} · {quiz.index + 1} / {quiz.ids.length}</p><fieldset disabled={submitted}><legend>{question.prompt}</legend><div className="kh-choices">{question.choices.map((item, index) => <label key={index} className={`${choice === index ? 'is-selected' : ''} ${submitted && index === question.answerIndex ? 'is-correct' : ''}`}><input type="radio" name="answer" value={index} checked={choice === index} onChange={() => {setChoice(index); setQuizMessage('');}} /><span className="kh-choice-number">{index + 1}</span><span>{item}</span></label>)}</div></fieldset>
              {quizMessage && <p role="alert">{quizMessage}</p>}
              {!submitted ? <button type="submit" className="kh-primary">정답 확인</button> : <div className="kh-explanation" role="status"><strong>{choice === question.answerIndex ? '정답입니다.' : `정답은 ${question.answerIndex + 1}번입니다.`}</strong><p>{question.explanation}</p><a href={`#kh-${current.id}-${question.sectionId}`}>관련 개념 다시 읽기 ↑</a><Sources sources={question.sources} /><button type="button" className="kh-primary" onClick={nextQuestion}>{quiz.index + 1 === quiz.ids.length ? '복습 결과 보기' : '다음 문제 →'}</button></div>}
            </form>}
          </section>
        </div>
      </div>
      <footer className="kh-footer"><p>개념 완료와 마지막 제출 답안을 이 브라우저에 저장합니다. 기기 간에는 동기화되지 않습니다.</p>{resetRequested ? <div className="kh-actions"><span>이 브라우저의 전체 진도와 답안을 지울까요?</span><button className="kh-secondary" onClick={resetProgress}>기록 초기화</button><button className="kh-secondary" onClick={() => setResetRequested(false)}>취소</button></div> : <button className="kh-reset" disabled={!ready} onClick={() => setResetRequested(true)}>학습 기록 초기화</button>}</footer>
    </div>
  </main>;
}
