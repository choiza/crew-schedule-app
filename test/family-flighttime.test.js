'use strict';

const test = require('node:test');
const assert = require('node:assert');

const parser = require('../src/parser.js');
const routes = require('../src/routes.js');
const plan = require('../src/family/plan.js');
const sample = require('../src/family/sample.js');
const ft = require('../src/family/flighttime.js');

function sampleEvents() {
  const parsed = parser.parse(sample.TEXT, { year: 2026, month: 9 });
  const byDate = {};
  parsed.entries.forEach((e) => (byDate[e.date] = byDate[e.date] || []).push(e));
  routes.apply(byDate);
  return plan.eventsOf(parsed.entries, null);
}

test('편명 모양을 네 자리로 맞춘다', () => {
  assert.strictEqual(ft.normalize('KE17'), 'KE0017');
  assert.strictEqual(ft.normalize('ke 901'), 'KE0901');
  assert.strictEqual(ft.normalize('KE1406'), 'KE1406');
});

test('시간 적는 여러 모양', () => {
  assert.strictEqual(ft.toMinutes('6:10'), 370);
  assert.strictEqual(ft.toMinutes('14시 5분'), 845);
  assert.strictEqual(ft.toMinutes('95'), 95);
  assert.strictEqual(ft.toMinutes('abc'), null);
  assert.strictEqual(ft.hours(3870), '64시간 30분');
  assert.strictEqual(ft.hours(120), '2시간');
  assert.strictEqual(ft.hours(0), '0분');
});

test('표에 있는 편은 계획 시간표를 쓴다', () => {
  const b = ft.blockOf({ code: 'KE0901', from: 'ICN', to: 'CDG' }, {});
  assert.deepStrictEqual([b.minutes, b.source], [860, 'timetable']);
});

test('표에 없는 편은 거리로 추정한다', () => {
  const b = ft.blockOf({ code: 'KE0711', from: 'ICN', to: 'NRT' }, {});
  assert.strictEqual(b.source, 'estimate');
  assert.ok(b.minutes >= 120 && b.minutes <= 150, String(b.minutes));
  const far = ft.blockOf({ code: 'KE9999', from: 'ICN', to: 'JFK' }, {});
  assert.ok(Math.abs(far.minutes - 840) <= 30, String(far.minutes));
});

test('고친 값이 표보다 먼저다', () => {
  const b = ft.blockOf({ code: 'KE901', from: 'ICN', to: 'CDG' }, { KE0901: 900 });
  assert.deepStrictEqual([b.minutes, b.source], [900, 'setting']);
});

test('예시 9월 총 비행 시간: 8편, 64시간 30분', () => {
  const t = ft.total(sampleEvents(), '2026-09', {});
  assert.strictEqual(t.count, 8);
  assert.strictEqual(t.estimated, 4);
  assert.strictEqual(t.minutes, 3870);
  // 밤을 넘기는 귀국편은 출발한 날로 센다
  assert.strictEqual(t.items.find((i) => i.code === 'KE0018').date, '2026-09-05');
});
