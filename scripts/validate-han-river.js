#!/usr/bin/env node
// Focused checks for the map lesson's stage sequence, geographic targets and sources.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'web/lib/lessons/han-river.js'), 'utf8');
const lesson = vm.runInNewContext(`${source.replace(/export const /g, 'const ')}; ({ places, steps, mapQuestions, kingdoms })`);
const { places, steps, mapQuestions, kingdoms } = lesson;
const ids = new Set(places.map(p => p.id));
assert.equal(ids.size, places.length, 'Duplicate place identifier');
assert.equal(steps.map(s => s.year).join(','), '4세기,475년,551년,553년,554년');
for (const place of places) {
  const [lng,lat] = place.coordinates;
  assert.ok(Number.isFinite(lng) && Number.isFinite(lat) && lng > 124 && lng < 131 && lat > 34 && lat < 40, `Invalid location: ${place.id}`);
  // All teaching targets must fit in the mobile SVG crop.
  const x=(lng-123.7)*90, y=(40.6-lat)*105;
  assert.ok(x>100 && x<610 && y>105 && y<585, `Mobile target offscreen: ${place.id}`);
}
for (const step of steps) {
  assert.ok(step.sources.length, `Missing historical evidence: ${step.id}`);
  step.sources.forEach(url => assert.equal(new URL(url).protocol, 'https:'));
  step.focus.forEach(id => assert.ok(ids.has(id), `Unknown focus target: ${id}`));
  step.route.forEach(route => {
    assert.ok(ids.has(route.from) && ids.has(route.to) && route.from !== route.to);
    assert.ok(kingdoms[route.kingdom]);
  });
}
assert.ok(mapQuestions.length >= 3);
for(const question of mapQuestions) {
  assert.ok(steps[question.step] && ids.has(question.answer));
  assert.ok(question.prompt && question.explanation);
}
assert.equal(mapQuestions.find(q=>q.id==='capital').answer, 'ungjin');
assert.equal(mapQuestions.find(q=>q.id==='upstream').answer, 'upperHan');
assert.equal(mapQuestions.find(q=>q.id==='battle').answer, 'gwansan');
const han=places.find(p=>p.id==='hanseong'), battle=places.find(p=>p.id==='gwansan');
assert.ok(han.coordinates[1]-battle.coordinates[1]>1, 'Gwansan must remain south of the Han River');
const geo=JSON.parse(fs.readFileSync(path.join(root,'web/lib/lessons/han-river-geography.json'),'utf8'));
assert.equal(geo.rivers.map(r=>r.name).sort().join(','),'Han,Namhan');
assert.ok(geo.land.length>0 && geo.rivers.every(r=>r.path.startsWith('M') && !r.path.includes('NaN')));
console.log(`한강 지도 수업 검증 통과 — ${steps.length}개 장면, ${places.length}개 위치, ${mapQuestions.length}개 지도 문제`);
