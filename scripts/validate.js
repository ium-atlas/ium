#!/usr/bin/env node
// IUM 데이터 검증 — 의존성 없음. 사용법: node scripts/validate.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'data', 'topics');
const TYPES = ['battle','siege','massacre','council','political','treaty','movement','culture'];
const DATE_RE = /^-?[0-9]{1,4}-[0-9]{2}$/;
let errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

for (const topicDir of fs.readdirSync(ROOT)) {
  const tdir = path.join(ROOT, topicDir);
  if (!fs.statSync(tdir).isDirectory()) continue;
  const tfile = path.join(tdir, 'topic.json');
  if (!fs.existsSync(tfile)) { err(topicDir, 'topic.json 없음'); continue; }
  let topic;
  try { topic = JSON.parse(fs.readFileSync(tfile, 'utf8')); }
  catch (e) { err(tfile, 'JSON 파싱 실패: ' + e.message); continue; }
  for (const k of ['id','title','period','start','end','bounds','perspectives'])
    if (!(k in topic)) err(tfile, `필수 필드 누락: ${k}`);
  const codes = (topic.perspectives || []).map(p => p.code);
  if (codes.length < 2) err(tfile, '관점은 2개 이상이어야 함');
  (topic.perspectives || []).forEach(p => ['code','label','color'].forEach(k => !(k in p) && err(tfile, `관점에 ${k} 누락`)));

  const edir = path.join(tdir, 'events');
  if (!fs.existsSync(edir)) { warn(tdir, 'events/ 폴더 없음'); continue; }
  for (const ef of fs.readdirSync(edir).filter(f => f.endsWith('.json'))) {
    const fp = path.join(edir, ef);
    let ev;
    try { ev = JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch (e) { err(fp, 'JSON 파싱 실패: ' + e.message); continue; }
    for (const k of ['id','name','type','date','location','perspectives'])
      if (!(k in ev)) err(fp, `필수 필드 누락: ${k}`);
    if (ev.type && !TYPES.includes(ev.type)) err(fp, `알 수 없는 type: ${ev.type}`);
    if (ev.date && !DATE_RE.test(ev.date)) err(fp, `date 형식 오류 (YYYY-MM): ${ev.date}`);
    if (ev.location && (typeof ev.location.lng !== 'number' || typeof ev.location.lat !== 'number'))
      err(fp, 'location.lng/lat은 숫자여야 함');
    if (ev.perspectives) {
      let visible = 0;
      for (const [c, p] of Object.entries(ev.perspectives)) {
        if (!codes.includes(c)) err(fp, `topic에 정의되지 않은 관점: ${c}`);
        if (typeof p.weight !== 'number' || p.weight < 0 || p.weight > 100) err(fp, `${c}.weight는 0~100 정수`);
        if (p.weight >= 10) visible++;
        if (p.narrative && (!p.sources || !p.sources.length))
          warn(fp, `${c}: narrative에 sources 없음 — PR 시 출처 필수`);
      }
      if (!visible) err(fp, '표시 가능한 관점(weight>=10)이 하나도 없음');
    }
  }
}
console.log(`검증 완료 — 오류 ${errors.length}건, 경고 ${warnings.length}건`);
errors.forEach(e => console.log('  [오류] ' + e));
warnings.forEach(w => console.log('  [경고] ' + w));
process.exit(errors.length ? 1 : 0);
