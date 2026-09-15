#!/usr/bin/env node
// 한국사 학습 데이터와 지도 사건 연결 검증. node scripts/validate-study.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'data');
const folder = path.join(root, 'study');
const errors = [];
const ids = new Set(), orders = new Set();
const fail = (where, message) => errors.push(`${where}: ${message}`);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function sources(value, where) {
  if (!Array.isArray(value) || !value.length) return fail(where, '출처가 필요합니다.');
  value.forEach(source => {
    try { const url = new URL(source); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); }
    catch { fail(where, `유효하지 않은 출처 URL: ${source}`); }
  });
}
const files = fs.existsSync(folder) ? fs.readdirSync(folder).filter(f => f.endsWith('.json')) : [];
if (files.length !== 7) fail('study', `7개 시대 모듈이 필요합니다. 현재 ${files.length}개`);
files.forEach(file => {
  let m;
  try { m = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8')); }
  catch (e) { return fail(file, `JSON 오류: ${e.message}`); }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return fail(file, '모듈 객체가 필요합니다.');
  for (const field of ['id','title','summary']) if (!nonempty(m[field])) fail(file, `${field} 빈 값`);
  if (m.id !== path.basename(file, '.json')) fail(file, '파일명과 id 불일치');
  if (ids.has(m.id)) fail(file, '중복 모듈 id'); ids.add(m.id);
  if (!Number.isInteger(m.order) || m.order < 1 || m.order > 7 || orders.has(m.order)) fail(file, 'order는 중복 없는 1~7이어야 합니다.'); orders.add(m.order);
  if (!Array.isArray(m.period) || m.period.length !== 2 || !m.period.every(Number.isFinite) || m.period[0] > m.period[1]) fail(file, '기간 오류');
  const topics = Array.isArray(m.topicIds) ? m.topicIds : [];
  if (!topics.length || new Set(topics).size !== topics.length) fail(file, 'topicIds 누락 또는 중복');
  topics.forEach(id => { if (!nonempty(id) || !fs.existsSync(path.join(root,'topics',id,'topic.json'))) fail(file, `없는 토픽 ${id}`); });
  const sections = Array.isArray(m.sections) ? m.sections : [];
  const questions = Array.isArray(m.questions) ? m.questions : [];
  if (!sections.length || !questions.length) fail(file, '단원과 문제가 필요합니다.');
  const sectionIds = new Set(), questionIds = new Set();
  sections.forEach(s => {
    const where = `${file}/${s?.id}`;
    if (!s || typeof s !== 'object') return fail(where, '단원 객체가 필요합니다.');
    for (const field of ['id','title','body']) if (!nonempty(s[field])) fail(where, `${field} 빈 값`);
    if (sectionIds.has(s.id)) fail(where, '단원 id 중복'); sectionIds.add(s.id);
    if (!Array.isArray(s.keyPoints) || !s.keyPoints.length || !s.keyPoints.every(nonempty)) fail(where, '핵심 포인트 오류');
    sources(s.sources, where);
    if (!Array.isArray(s.eventRefs)) fail(where, 'eventRefs 배열 필요');
    else s.eventRefs.forEach(ref => {
      if (!ref || !nonempty(ref.topicId) || !nonempty(ref.eventId)) return fail(where, '사건 참조 형식 오류');
      if (!topics.includes(ref.topicId)) fail(where, `topicIds에 없는 사건 토픽 ${ref.topicId}`);
      const eventFile = path.join(root,'topics',ref.topicId,'events',`${ref.eventId}.json`);
      if (!fs.existsSync(eventFile)) fail(where, `없는 사건 ${ref.topicId}/${ref.eventId}`);
      else { try { const ev = JSON.parse(fs.readFileSync(eventFile,'utf8')); if (ev.id !== ref.eventId) fail(where,'사건 파일명/id 불일치'); } catch { fail(where,'사건 JSON 오류'); } }
    });
  });
  questions.forEach(q => {
    const where = `${file}/${q?.id}`;
    if (!q || typeof q !== 'object') return fail(where, '문항 객체가 필요합니다.');
    for (const field of ['id','prompt','explanation','sectionId']) if (!nonempty(q[field])) fail(where, `${field} 빈 값`);
    if (questionIds.has(q.id)) fail(where, '문항 id 중복'); questionIds.add(q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 5 || !q.choices.every(nonempty) || new Set(q.choices).size !== 5) fail(where, '서로 다른 5개 보기가 필요합니다.');
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 4) fail(where,'정답은 0~4 정수여야 합니다.');
    if (!sectionIds.has(q.sectionId)) fail(where, '없는 sectionId');
    sources(q.sources, where);
  });
});
errors.forEach(error => console.error(error));
console.log(`한국사 학습 검증 — 모듈 ${files.length}개, 오류 ${errors.length}건`);
process.exitCode = errors.length ? 1 : 0;
