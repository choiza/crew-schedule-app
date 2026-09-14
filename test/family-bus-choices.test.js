'use strict';

const test = require('node:test');
const assert = require('node:assert');
const bus = require('../src/family/bus.js');

const MON = '2026-09-21';
const hm = (min) => bus.hhmm(min);
const place = (id, name, stops) => ({ id, name, enabled: true, stops });

test.afterEach(() => bus.setTravelData(null));

test('처음 출발지는 미금, 수지, 분당 서현 순서이고 미금역까지 20분', () => {
  const s = bus.settingsWith({});
  assert.deepStrictEqual(s.places.map((p) => p.name), ['미금', '수지', '분당 서현']);
  assert.deepStrictEqual(s.places[0].stops, [{ stop: 'miguem', walk: 20 }]);
});

test('1순위 미금에서 인천 13:50 출발: 목표 10:50 에 맞고 집에서 가장 늦게 나서는 차', () => {
  const r = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', {});
  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(hm(r.target), '10:50');
  assert.deepStrictEqual([r.route, r.stop, r.placeName, r.rank, hm(r.board)], ['5400', 'miguem', '미금', 0, '09:00']);
  assert.strictEqual(r.travel, 100);
  // 09:00 − 정류장 여유 5분 − 미금역까지 20분 − 준비 60분
  assert.strictEqual(hm(r.wake), '07:35');
  assert.match(r.reason, /^1순위 미금에서/);
  assert.match(r.basis, /월요일 9시대 추정/);
});

test('후보에는 다른 출발지의 차도 하나씩 들어가고 순위 순으로 늘어선다', () => {
  const r = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', {});
  assert.strictEqual(r.choices.filter((c) => c.pick).length, 1);
  const ranks = r.choices.map((c) => c.rank);
  assert.deepStrictEqual(ranks, ranks.slice().sort((a, b) => a - b));
  assert.ok(ranks.includes(1) && ranks.includes(2));
  assert.ok(r.choices.some((c) => !c.fit));
});

test('1순위에 너무 이른 차만 있으면 다음 순위에서 고른다', () => {
  // 단국대는 11:50 차가 늦고 06:20 차는 목표보다 2시간 넘게 일찍 닿는다
  const places = [place('dk', '단국대', [{ stop: 'dankook', walk: 10 }]), place('mg', '미금', [{ stop: 'miguem', walk: 20 }])];
  const r = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', { places });
  assert.deepStrictEqual([r.placeName, r.rank, hm(r.board)], ['미금', 1, '09:00']);
  assert.match(r.reason, /1순위 단국대에는 여유 90분 안에 맞는 차가 없어 2순위 미금에서 골랐습니다/);
});

test('끈 출발지는 추천에 쓰지 않는다', () => {
  const s = bus.settingsWith({});
  s.places[0].enabled = false;
  const r = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', s);
  assert.notStrictEqual(r.placeName, '미금');
  const none = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', { places: [] });
  assert.strictEqual(none.status, 'no-places');
});

test('출근 시간대는 더 오래 걸린다고 본다', () => {
  const s = bus.settingsWith({});
  const rush = bus.travelMinutes(bus.routeById('5400'), 'miguem', 'out', MON, bus.toMin('07:40'), 9, s);
  const noon = bus.travelMinutes(bus.routeById('5400'), 'miguem', 'out', MON, bus.toMin('12:10'), 15, s);
  assert.strictEqual(rush.minutes, 120);
  assert.strictEqual(noon.minutes, 100);
  assert.match(rush.basis, /출근 시간/);
});

test('분당 서현은 5400 과 5300 을 함께 본다', () => {
  const places = [place('sh', '분당 서현', [{ stop: 'seohyeon', walk: 15 }])];
  const r = bus.recommendOut(bus.toMin('13:50'), MON, 'ICN', { places });
  assert.deepStrictEqual([r.route, hm(r.board)], ['5400', '09:20']);
  assert.deepStrictEqual(bus.routesAt('seohyeon').map((x) => x.id).sort(), ['5100', '5200', '5300', '5400']);
});

test('옆 정류장 시간표는 표의 간격대로 만든다', () => {
  assert.strictEqual(bus.routeById('5400').stops.jeongja[0], '04:25');
  assert.strictEqual(bus.routeById('5400').stops.seohyeon[10], '09:20');
  assert.strictEqual(bus.routeById('5300').stops.seohyeon[26], '19:30');
  assert.strictEqual(bus.routeById('5300').stops.seohyeon[27], '21:55');
  assert.strictEqual(bus.routeById('5200').stops.miguem[0], '05:23');
  assert.strictEqual(bus.routeById('5100').stops.seohyeon[2], '08:10');
});

test('김포는 시간표의 도착 시각으로 걸리는 시간을 잰다', () => {
  const r = bus.recommendOut(bus.toMin('10:00'), MON, 'GMP', {});
  assert.strictEqual(hm(r.target), '08:00');
  assert.deepStrictEqual([r.route, r.stop, hm(r.board)], ['5200', 'miguem', '05:23']);
  assert.strictEqual(r.source, 'timetable');
  assert.strictEqual(r.travel, 102);
});

test('첫차도 늦으면 late 와 늦는 시간', () => {
  // 서현역에는 심야 N5300(02:25)이 있어 늦지 않으므로 미금만 켠다
  const places = [place('mg', '미금', [{ stop: 'miguem', walk: 20 }])];
  const r = bus.recommendOut(bus.toMin('07:00'), MON, 'ICN', { places });
  assert.strictEqual(r.status, 'late');
  assert.ok(r.spare < 0);
  assert.match(r.reason, /늦습니다/);
});

test('8282 는 시각을 넣어야 후보가 된다', () => {
  const places = [place('sj', '수지', [{ stop: 'jukjeon', walk: 5 }])];
  const before = bus.recommendOut(bus.toMin('14:05'), MON, 'ICN', { places });
  assert.strictEqual(before.status, 'no-timetable');
  assert.ok(before.missing.some((m) => m.route === '8282'));
  const after = bus.recommendOut(bus.toMin('14:05'), MON, 'ICN', { places, customOut: { '8282@jukjeon': '0930 10:05' } });
  assert.deepStrictEqual([after.route, hm(after.board)], ['8282', '09:30']);
});

test('인천 도착 05:35: 착륙 후 60분 뒤, 1순위 미금으로 가장 빨리 가는 차', () => {
  const r = bus.recommendIn(bus.toMin('05:35'), '2026-09-23', 'ICN', {});
  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(hm(r.ready), '06:35');
  assert.deepStrictEqual([r.route, hm(r.board), r.stop, r.placeName], ['5400', '07:15', 'miguem', '미금']);
  // 수요일 7시대 출근 보정: 105분 × 1.2 → 125분, 미금역 09:20 도착 + 집까지 20분
  assert.strictEqual(r.travel, 125);
  assert.strictEqual(hm(r.home), '09:40');
  assert.match(r.reason, /^1순위 미금\(으\)로/);
});

test('김포에서 오는 시각표가 없으면 첫차·막차만', () => {
  const r = bus.recommendIn(bus.toMin('12:00'), MON, 'GMP', {});
  assert.strictEqual(r.status, 'no-timetable');
  assert.ok(r.ranges.some((x) => /06:30~22:50/.test(x)));
});

test('막차 뒤 도착은 missed', () => {
  const r = bus.recommendIn(bus.toMin('21:30'), MON, 'ICN', {});
  assert.strictEqual(r.status, 'missed');
});

test('가까운 정류장 순서', () => {
  const near = bus.stopsNear(37.351, 127.109);
  assert.strictEqual(near[0].id, 'miguem');
  assert.ok(near[0].km < 0.5);
});

test('예매한 차로 다시 재고, 비행이 당겨지면 늦는다고 알린다', () => {
  const booked = { route: '5400', stop: 'miguem', board: bus.toMin('09:00'), placeId: 'miguem' };
  const ok = bus.bookedOut(bus.toMin('13:50'), MON, 'ICN', {}, booked);
  assert.deepStrictEqual([ok.status, hm(ok.arrive), ok.spare, hm(ok.wake)], ['ok', '10:40', 10, '07:35']);
  const moved = bus.bookedOut(bus.toMin('13:20'), MON, 'ICN', {}, booked);
  assert.deepStrictEqual([moved.status, moved.spare], ['late', -20]);
});

test('예매한 귀국 버스는 착륙이 늦어지면 놓친다고 알린다', () => {
  const booked = { route: '5400', stop: 'miguem', board: bus.toMin('07:15'), placeId: 'miguem' };
  assert.strictEqual(bus.bookedIn(bus.toMin('05:35'), '2026-09-23', 'ICN', {}, booked).status, 'ok');
  const late = bus.bookedIn(bus.toMin('06:40'), '2026-09-23', 'ICN', {}, booked);
  assert.deepStrictEqual([late.status, late.wait], ['missed', -25]);
});

test('TMAP 예측표가 있으면 요일·시간대 값을 쓴다', () => {
  bus.setTravelData({ busFactor: 1.2, overhead: 10, generated: '2026-09-20', routes: { 'miguem>ICN': { byWeekday: { 1: { 9: 70 } } } } });
  const t = bus.travelMinutes(bus.routeById('5400'), 'miguem', 'out', MON, bus.toMin('09:00'), 10, bus.settingsWith({}));
  assert.deepStrictEqual([t.minutes, t.source], [95, 'tmap']);
  assert.match(t.basis, /TMAP 예측 월요일 9시대/);
});

test('설정에 넣은 소요 시간이 모두를 이긴다', () => {
  const t = bus.travelMinutes(bus.routeById('5200'), 'miguem', 'out', MON, bus.toMin('05:23'), 0,
    bus.settingsWith({ busToAirport: { 'miguem>GMP': 80 } }));
  assert.deepStrictEqual([t.minutes, t.source], [80, 'setting']);
});

test('예매 알림 날짜와 시각 표기', () => {
  assert.strictEqual(bus.bookingDay('2026-09-21', 14), '2026-09-07');
  assert.strictEqual(bus.clock(0), '오전 12:00');
  assert.strictEqual(bus.clock(-30), '전날 오후 11:30');
  assert.strictEqual(bus.span(95), '1시간 35분');
  assert.strictEqual(bus.platformOf('Mozilla/5.0 (Linux; Android 14)'), 'android');
  assert.strictEqual(bus.platformOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), 'ios');
});
