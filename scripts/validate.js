#!/usr/bin/env node
// IUM 데이터 검증 — 의존성 없음. 사용법: node scripts/validate.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'data', 'topics');
const MILESTONES_ROOT = path.join(__dirname, '..', 'data', 'milestones');
const TYPES = ['battle','siege','massacre','council','political','treaty','movement','culture'];
const DATE_RE = /^-?[0-9]{1,4}-[0-9]{2}$/;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
let errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

for (const topicDir of fs.readdirSync(ROOT)) {
  const tdir = path.join(ROOT, topicDir);
  if (!fs.statSync(tdir).isDirectory()) continue;
  const tfile = path.join(tdir, 'topic.json');
  if (!fs.existsSync(tfile)) { err(topicDir, 'topic.json 없음 (topic.json missing)'); continue; }
  let topic;
  try { topic = JSON.parse(fs.readFileSync(tfile, 'utf8')); }
  catch (e) { err(tfile, 'JSON 파싱 실패 (JSON parse failed): ' + e.message); continue; }
  for (const k of ['id','title','period','start','end','bounds','perspectives'])
    if (!(k in topic)) err(tfile, `필수 필드 누락 (required field missing): ${k}`);
  const codes = (topic.perspectives || []).map(p => p.code);
  if (codes.length < 2) err(tfile, '관점은 2개 이상이어야 함 (at least 2 perspectives required)');
  (topic.perspectives || []).forEach(p => ['code','label','color'].forEach(k => !(k in p) && err(tfile, `관점에 ${k} 누락 (perspective missing ${k})`)));

  const edir = path.join(tdir, 'events');
  if (!fs.existsSync(edir)) { warn(tdir, 'events/ 폴더 없음 (events/ directory missing)'); continue; }
  for (const ef of fs.readdirSync(edir).filter(f => f.endsWith('.json'))) {
    const fp = path.join(edir, ef);
    let ev;
    try { ev = JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch (e) { err(fp, 'JSON 파싱 실패 (JSON parse failed): ' + e.message); continue; }
    for (const k of ['id','name','type','date','location','perspectives'])
      if (!(k in ev)) err(fp, `필수 필드 누락 (required field missing): ${k}`);
    if (ev.type && !TYPES.includes(ev.type)) err(fp, `알 수 없는 type (unknown type): ${ev.type}`);
    if (ev.date && !DATE_RE.test(ev.date)) err(fp, `date 형식 오류 (YYYY-MM) (date format error): ${ev.date}`);
    if (ev.location && (typeof ev.location.lng !== 'number' || typeof ev.location.lat !== 'number'))
      err(fp, 'location.lng/lat은 숫자여야 함 (location.lng/lat must be numbers)');
    if (ev.perspectives) {
      let visible = 0;
      for (const [c, p] of Object.entries(ev.perspectives)) {
        if (!codes.includes(c)) err(fp, `topic에 정의되지 않은 관점 (perspective not defined in topic): ${c}`);
        if (typeof p.weight !== 'number' || p.weight < 0 || p.weight > 100) err(fp, `${c}.weight는 0~100 정수 (${c}.weight must be an integer from 0 to 100)`);
        if (p.weight >= 10) visible++;
        if (p.narrative && (!p.sources || !p.sources.length))
          err(fp, `${c}: narrative에 sources 없음 — 출처 필수 (missing sources for narrative — sources required)`);
      }
      if (!visible) err(fp, '표시 가능한 관점(weight>=10)이 하나도 없음 (no visible perspectives with weight>=10)');
    }
    if ('disputed' in ev) {
      if (!ev.disputed || typeof ev.disputed !== 'object' || Array.isArray(ev.disputed)) {
        err(fp, 'disputed는 객체여야 함 (disputed must be an object)');
      } else {
        if (!Array.isArray(ev.disputed.fields) || ev.disputed.fields.length === 0)
          err(fp, 'disputed.fields는 비어있지 않은 배열이어야 함 (disputed.fields must be a non-empty array)');
        if (!Number.isInteger(ev.disputed.issue) || ev.disputed.issue <= 0)
          err(fp, 'disputed.issue는 양의 정수여야 함 (disputed.issue must be a positive integer)');
      }
    }
  }
}

if (fs.existsSync(MILESTONES_ROOT)) {
  const regionsFile = path.join(MILESTONES_ROOT, 'regions.json');
  let regionCodes = [];
  if (!fs.existsSync(regionsFile)) {
    err(MILESTONES_ROOT, 'regions.json 없음 (regions.json missing)');
  } else {
    let regions;
    try { regions = JSON.parse(fs.readFileSync(regionsFile, 'utf8')); }
    catch (e) { err(regionsFile, 'JSON 파싱 실패 (JSON parse failed): ' + e.message); }
    if (regions) {
      if (!Array.isArray(regions)) {
        err(regionsFile, 'regions.json은 배열이어야 함 (regions.json must be an array)');
      } else {
        const seen = new Set();
        regions.forEach((r, i) => {
          const f = `${regionsFile}[${i}]`;
          if (!r || typeof r !== 'object' || Array.isArray(r)) {
            err(f, '지역은 객체여야 함 (region must be an object)');
            return;
          }
          for (const k of ['code','label','label_en','color'])
            if (!(k in r)) err(f, `필수 필드 누락 (required field missing): ${k}`);
          if (typeof r.code !== 'string' || !/^[a-z][a-z0-9-]*$/.test(r.code)) {
            err(f, `code 형식 오류 (code format error): ${r.code}`);
          } else if (seen.has(r.code)) {
            err(f, `중복 지역 코드 (duplicate region code): ${r.code}`);
          } else {
            seen.add(r.code);
            regionCodes.push(r.code);
          }
          if (typeof r.label !== 'string' || !r.label.trim())
            err(f, 'label은 비어있지 않은 문자열이어야 함 (label must be a non-empty string)');
          if (typeof r.label_en !== 'string' || !r.label_en.trim())
            err(f, 'label_en은 비어있지 않은 문자열이어야 함 (label_en must be a non-empty string)');
          if (typeof r.color !== 'string' || !COLOR_RE.test(r.color))
            err(f, `color는 #RRGGBB 형식이어야 함 (color must be #RRGGBB): ${r.color}`);
        });
      }
    }
  }

  const regionSet = new Set(regionCodes);
  for (const mf of fs.readdirSync(MILESTONES_ROOT).filter(f => f.endsWith('.json') && f !== 'regions.json')) {
    const fp = path.join(MILESTONES_ROOT, mf);
    const code = path.basename(mf, '.json');
    if (!regionSet.has(code)) err(fp, `regions.json에 없는 지역 코드 (region code not defined in regions.json): ${code}`);
    let milestones;
    try { milestones = JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch (e) { err(fp, 'JSON 파싱 실패 (JSON parse failed): ' + e.message); continue; }
    if (!Array.isArray(milestones)) {
      err(fp, 'milestone 파일은 배열이어야 함 (milestone file must be an array)');
      continue;
    }
    milestones.forEach((m, i) => {
      const f = `${fp}[${i}]`;
      if (!m || typeof m !== 'object' || Array.isArray(m)) {
        err(f, 'milestone은 객체여야 함 (milestone must be an object)');
        return;
      }
      const allowed = new Set(['year','range','label','note','sources']);
      Object.keys(m).forEach(k => !allowed.has(k) && err(f, `알 수 없는 필드 (unknown field): ${k}`));
      const hasYear = 'year' in m, hasRange = 'range' in m;
      if (hasYear === hasRange) err(f, 'year 또는 range 중 정확히 하나 필요 (exactly one of year or range is required)');
      if (hasYear && !Number.isInteger(m.year)) err(f, 'year는 정수여야 함 (year must be an integer)');
      if (hasRange) {
        if (!Array.isArray(m.range) || m.range.length !== 2 || !m.range.every(Number.isInteger)) {
          err(f, 'range는 정수 2개의 배열이어야 함 (range must be an array of two integers)');
        } else if (m.range[0] > m.range[1]) {
          err(f, 'range 시작은 끝보다 작거나 같아야 함 (range start must be <= end)');
        }
      }
      if (typeof m.label !== 'string' || !m.label.trim())
        err(f, 'label은 비어있지 않은 문자열이어야 함 (label must be a non-empty string)');
      else {
        if (m.label.length > 40) err(f, 'label은 40자 이하여야 함 (label must be 40 characters or fewer)');
        if (/[\r\n]/.test(m.label)) err(f, 'label은 한 줄이어야 함 (label must be one line)');
      }
      if ('note' in m && typeof m.note !== 'string')
        err(f, 'note는 문자열이어야 함 (note must be a string)');
      if (!Array.isArray(m.sources) || m.sources.length === 0) {
        err(f, 'sources는 비어있지 않은 배열이어야 함 (sources must be a non-empty array)');
      } else {
        m.sources.forEach((s, j) => {
          if (typeof s !== 'string' || !s.trim())
            err(`${f}.sources[${j}]`, 'source는 비어있지 않은 문자열이어야 함 (source must be a non-empty string)');
        });
      }
    });
  }
}
console.log(`검증 완료 (validation complete) — 오류 ${errors.length}건 (errors), 경고 ${warnings.length}건 (warnings)`);
errors.forEach(e => console.log('  [오류/error] ' + e));
warnings.forEach(w => console.log('  [경고/warning] ' + w));
process.exit(errors.length ? 1 : 0);
