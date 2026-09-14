'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('../src/family/flightstatus.js');

test('편명은 앞의 0 을 뗀 것부터 찾는다', () => {
  assert.deepStrictEqual(fs.flightIds('KE0901'), ['KE901', 'KE0901']);
  assert.deepStrictEqual(fs.flightIds('KE017'), ['KE17', 'KE017']);
  assert.deepStrictEqual(fs.flightIds('KE1406'), ['KE1406']);
});

test('여러 모양의 시각을 HH:MM 으로', () => {
  assert.strictEqual(fs.clockOf('202610051205'), '12:05');
  assert.strictEqual(fs.clockOf('1205'), '12:05');
  assert.strictEqual(fs.clockOf('12:05'), '12:05');
  assert.strictEqual(fs.clockOf(''), null);
  assert.strictEqual(fs.clockOf('2599'), null);
});

test('인천 응답: 변경 시각이 있으면 그것을 쓴다', () => {
  const json = { response: { body: { items: [{ flightId: 'KE901', scheduleDateTime: '202610051205', estimatedDateTime: '202610051230', gatenumber: '248', remark: '지연' }] } } };
  const items = fs.itemsOf(json);
  assert.strictEqual(items.length, 1);
  assert.deepStrictEqual(fs.parseItem(items[0]), { scheduled: '12:05', estimated: '12:30', time: '12:30', gate: '248', remark: '지연', terminal: null });
});

test('김포 응답: items.item 한 건짜리도 읽는다', () => {
  const json = { response: { body: { items: { item: { std: '0840', etd: '0845', GATE: '3', rmkKor: '출발' } } } } };
  const parsed = fs.parseItem(fs.itemsOf(json)[0]);
  assert.deepStrictEqual([parsed.scheduled, parsed.time, parsed.gate, parsed.remark], ['08:40', '08:45', '3', '출발']);
});

test('중계 주소를 쓰면 키 없이 노선 이름만 넘긴다', () => {
  const url = fs.buildUrl({ proxyUrl: 'https://x.workers.dev/' }, 'GMP', 'out', 'KE1406');
  assert.strictEqual(url, 'https://x.workers.dev/?r=gmp_dep&flight_id=KE1406&airport_code=GMP');
  const direct = fs.buildUrl({ serviceKey: 'abc%2B' }, 'ICN', 'in', 'KE18');
  assert.match(direct, /^https:\/\/apis\.data\.go\.kr\/B551177\/StatusOfPassengerFlightsOdp\/getPassengerArrivalsOdp\?serviceKey=abc%2B&type=json/);
});

test('0 을 뗀 편명으로 못 찾으면 원래 편명으로 한 번 더', async () => {
  const asked = [];
  const fetcher = async (url) => {
    asked.push(new URL(url).searchParams.get('flight_id'));
    const found = url.includes('flight_id=KE0901');
    return { ok: true, json: async () => ({ response: { body: { items: found ? [{ scheduleDateTime: '202610051205' }] : [] } } }) };
  };
  const status = await fs.fetchStatus({ enabled: true, proxyUrl: 'https://x.workers.dev/' }, 'KE0901', 'ICN', 'out', fetcher);
  assert.deepStrictEqual(asked, ['KE901', 'KE0901']);
  assert.strictEqual(status.time, '12:05');
});

test('꺼져 있거나 키가 없으면 켜지지 않는다', () => {
  assert.strictEqual(fs.enabled({ enabled: false, serviceKey: 'k' }), false);
  assert.strictEqual(fs.enabled({ enabled: true }), false);
  assert.strictEqual(fs.enabled({ enabled: true, proxyUrl: 'https://x' }), true);
});
