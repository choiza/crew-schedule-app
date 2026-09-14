'use strict';

const test = require('node:test');
const assert = require('node:assert');
const bus = require('../src/family/bus.js');

test('미금역에서 인천공항 T2로 가는 날, 구간과 날짜가 채워진 버스타고 주소', () => {
  const url = new URL(bus.bustagoSearch('miguem', 'ICN', 'out', '2026-10-05'));
  assert.strictEqual(url.origin, 'https://m.bustago.or.kr:444');
  assert.strictEqual(url.searchParams.get('sterCode'), '1214');
  assert.strictEqual(url.searchParams.get('eterCode'), '9337');
  assert.strictEqual(url.searchParams.get('sterName'), '미금역');
  assert.strictEqual(url.searchParams.get('eterName'), '인천공항T2');
  assert.strictEqual(url.searchParams.get('startDate'), '20261005');
});

test('돌아오는 날은 출발지와 도착지를 바꾼다', () => {
  const url = new URL(bus.bustagoSearch('seohyeon', 'ICN', 'in', '2026-10-07'));
  assert.strictEqual(url.searchParams.get('sterCode'), '9337');
  assert.strictEqual(url.searchParams.get('eterName'), '서현역');
});

test('코드를 모르는 정류장이나 김포는 null', () => {
  assert.strictEqual(bus.bustagoSearch('jukjeon', 'ICN', 'out', '2026-10-05'), null);
  assert.strictEqual(bus.bustagoSearch('miguem', 'GMP', 'out', '2026-10-05'), null);
});
