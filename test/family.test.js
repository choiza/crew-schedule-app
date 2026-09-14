'use strict';

const test = require('node:test');
const assert = require('node:assert');

const parser = require('../src/parser.js');
const routes = require('../src/routes.js');
const routedata = require('../src/routedata.js');
const plan = require('../src/family/plan.js');
const sample = require('../src/family/sample.js');

function sampleEntries() {
  const parsed = parser.parse(sample.TEXT, { year: 2026, month: 9 });
  const byDate = {};
  parsed.entries.forEach((e) => (byDate[e.date] = byDate[e.date] || []).push(e));
  routes.apply(byDate);
  return parsed.entries;
}

// 앱과 같은 순서: 공항 시간표, 없으면 예시 시각
function timeOf(ev) {
  const row = routedata.TIMES.times[ev.code] || sample.TIMES[ev.code];
  if (!row) return null;
  return ev.type === 'in' ? row.end || null : row.start || null;
}

function sampleMonth(words) {
  return plan.buildMonth(2026, 9, sampleEntries(), { timeOf, words });
}

function day(model, d) {
  return model.days[d - 1];
}

test('예시 9월을 가족 말로 옮긴다', () => {
  const m = sampleMonth();
  assert.strictEqual(m.days.length, 30);
  assert.deepStrictEqual([day(m, 1).kind, day(m, 1).short], ['off', '휴무']);
  assert.deepStrictEqual([day(m, 2).kind, day(m, 2).short], ['work', '지상']);
  assert.deepStrictEqual([day(m, 3).kind, day(m, 3).short], ['out', '로스앤젤레스']);
  assert.deepStrictEqual([day(m, 4).kind, day(m, 4).short], ['away', '로스앤젤레스']);
  assert.deepStrictEqual([day(m, 5).kind, day(m, 5).sub], ['homeward', '귀국길']);
  assert.deepStrictEqual([day(m, 6).kind, day(m, 6).short], ['in', '귀국']);
  assert.deepStrictEqual([day(m, 10).kind, day(m, 10).short], ['turn', '오사카']);
  assert.deepStrictEqual([day(m, 13).kind, day(m, 13).short], ['out', '방콕']);
  assert.strictEqual(day(m, 15).kind, 'homeward');
  assert.strictEqual(day(m, 16).kind, 'in');
  assert.strictEqual(day(m, 17).short, '휴무');
  assert.deepStrictEqual([day(m, 22).kind, day(m, 22).short], ['away', '파리']);
  assert.strictEqual(day(m, 28).short, '대기');
  assert.strictEqual(day(m, 18).short, '교육');
});

test('달력 칸에 출발일은 출발, 도착일은 도착, 당일 왕복은 둘 다 적는다', () => {
  const m = sampleMonth();
  assert.strictEqual(day(m, 10).sub, '09:35→14:25');
  assert.strictEqual(day(m, 3).sub, '14:30 출발');
  assert.strictEqual(day(m, 4).sub, '체류');
  assert.strictEqual(day(m, 6).sub, '17:50 도착');
  assert.strictEqual(day(m, 13).sub, '18:05 출발');
  assert.strictEqual(day(m, 25).sub, '15:50 도착');
});

test('공항 코드를 날마다 단다', () => {
  const m = sampleMonth();
  assert.strictEqual(day(m, 10).airports, 'ICN⇄KIX');
  assert.strictEqual(day(m, 3).airports, 'ICN→LAX');
  assert.strictEqual(day(m, 4).airports, 'LAX');
  assert.strictEqual(day(m, 5).airports, 'LAX→ICN');
  assert.strictEqual(day(m, 1).airports, '');
});

test('여행 묶음마다 번호가 달라 색이 갈린다', () => {
  const m = sampleMonth();
  // 3~6 로스앤젤레스 / 10 오사카 / 13~16 방콕 / 21~25 파리
  assert.deepStrictEqual([3, 4, 5, 6].map((d) => day(m, d).trip), [0, 0, 0, 0]);
  assert.strictEqual(day(m, 10).trip, 1);
  assert.deepStrictEqual([13, 14, 15, 16].map((d) => day(m, d).trip), [2, 2, 2, 2]);
  assert.deepStrictEqual([21, 22, 23, 24, 25].map((d) => day(m, d).trip), [3, 3, 3, 3, 3]);
  assert.strictEqual(day(m, 11).trip, null);
});

test('귀국편은 마지막 칸 날짜에 도착 시각을 단다', () => {
  const m = sampleMonth();
  const back = m.events.find((ev) => ev.code === 'KE0018' && ev.type === 'in');
  assert.strictEqual(back.date, '2026-09-06');
  assert.strictEqual(back.startDate, '2026-09-05');
  assert.strictEqual(back.time, '17:50');
});

test('출국 띠는 출발일에 시작해 귀국일에 끝난다', () => {
  const m = sampleMonth();
  assert.strictEqual(plan.bandOf(m.days, 12), 'start');
  assert.strictEqual(plan.bandOf(m.days, 13), 'mid');
  assert.strictEqual(plan.bandOf(m.days, 15), 'end');
  assert.strictEqual(plan.bandOf(m.days, 11), null);
});

test('코드 뜻을 고치면 달력 말과 휴일 셈이 바뀐다', () => {
  const before = plan.summarize(sampleMonth());
  assert.deepStrictEqual([before.offDays, before.workDays], [10, 20]);

  const m = sampleMonth({ GRD: { short: '휴가', category: 'off' }, TFRS: { short: '연수' } });
  assert.deepStrictEqual([day(m, 2).kind, day(m, 2).short], ['off', '휴가']);
  assert.deepStrictEqual([day(m, 18).kind, day(m, 18).short], ['training', '연수']);
  const after = plan.summarize(m);
  assert.deepStrictEqual([after.offDays, after.workDays], [12, 18]);
});

test('모르는 코드는 코드 그대로, 근무로 센다', () => {
  const entries = sampleEntries().filter((e) => !(e.date === '2026-09-07' && e.code === 'ATDO'));
  entries.push({ date: '2026-09-07', code: 'ZZZ', type: 'duty', category: 'unknown' });
  const m = plan.buildMonth(2026, 9, entries, { timeOf });
  assert.deepStrictEqual([day(m, 7).kind, day(m, 7).short], ['other', 'ZZZ']);
  assert.strictEqual(plan.dayType(day(m, 7)), 'work');
});

test('휴일 날짜를 범위로 줄인다', () => {
  assert.strictEqual(plan.ranges([1, 7, 8, 11, 12, 17, 20, 26, 27, 30]), '1, 7~8, 11~12, 17, 20, 26~27, 30');
  assert.strictEqual(plan.ranges([]), '');
});

test('기본 뜻에 없는 코드도 근무 코드 사전에서 뜻을 찾는다', () => {
  const w = (code) => { const x = plan.wordFor(code, 'unknown', {}); return [x.short, x.category]; };
  assert.deepStrictEqual(w('GDO'), ['휴무', 'off']);
  assert.deepStrictEqual(w('HSBY'), ['자택대기', 'standby']);
  assert.deepStrictEqual(w('ANL'), ['휴가', 'vacation']);
  assert.deepStrictEqual(w('SIM'), ['교육', 'training']);
  assert.deepStrictEqual(w('SICK'), ['병가', 'vacation']);
  assert.deepStrictEqual(w('OFC'), ['사무근무', 'work']);
  assert.deepStrictEqual(w('ATDO'), ['휴무', 'off']);
  assert.strictEqual(plan.knownCode('rsv'), true);
  assert.strictEqual(plan.knownCode('ZZZ'), false);
  // 사전에 있어도 사람이 고친 뜻이 먼저
  assert.deepStrictEqual(plan.wordFor('GDO', 'unknown', { GDO: { short: '보장', category: 'off' } }).short, '보장');
});

test('사전 코드로 이루어진 날도 휴무와 근무를 바르게 센다', () => {
  const entries = sampleEntries().filter((e) => !(e.date === '2026-09-07' || e.date === '2026-09-09'));
  entries.push({ date: '2026-09-07', code: 'GDO', type: 'duty', category: 'off' });
  entries.push({ date: '2026-09-09', code: 'HSBY', type: 'duty', category: 'standby' });
  const m = plan.buildMonth(2026, 9, entries, { timeOf });
  assert.strictEqual(plan.dayType(day(m, 7)), 'off');
  assert.deepStrictEqual([day(m, 9).kind, plan.dayType(day(m, 9))], ['standby', 'work']);
});

test('대한항공 자료에서 확인한 코드를 가족 말로 옮긴다', () => {
  const w = (code) => { const x = plan.wordFor(code, 'unknown', {}); return [x.short, x.category]; };
  assert.deepStrictEqual(w('RDO'), ['휴무', 'off']);
  assert.deepStrictEqual(w('ALV'), ['휴가', 'vacation']);
  assert.deepStrictEqual(w('SLV'), ['휴가', 'vacation']);
  assert.deepStrictEqual(w('RF'), ['비행대기', 'standby']);
  assert.deepStrictEqual(w('ABS'), ['결근', 'work']);
  assert.match(plan.wordFor('ADO', 'unknown', {}).long, /자동 휴무/);
});
