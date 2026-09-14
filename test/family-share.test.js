'use strict';

const test = require('node:test');
const assert = require('node:assert');

const share = require('../src/family/share.js');
const sample = require('../src/family/sample.js');
const parser = require('../src/parser.js');

function payload() {
  const entries = parser.parse(sample.TEXT, { year: 2026, month: 9 }).entries
    .map((e) => ({ date: e.date, code: e.code, type: e.type, category: e.category }));
  return { app: 'crew-family-share', v: 1, name: '테스트', entries, words: { GRD: { short: '지상', category: 'work' } } };
}

test('비밀번호로 잠근 링크를 같은 비밀번호로 연다', async () => {
  const data = payload();
  const token = await share.pack(data, '482913');
  assert.match(token, /^[A-Za-z0-9_-]+$/);
  const back = await share.unpack(token, '482913');
  assert.deepStrictEqual(back, data);
});

test('비밀번호가 틀리면 열리지 않는다', async () => {
  const token = await share.pack(payload(), '482913');
  await assert.rejects(share.unpack(token, '482914'), /비밀번호가 틀렸거나/);
});

test('같은 스케줄도 링크마다 글자가 달라 옛 링크를 짐작할 수 없다', async () => {
  const a = await share.pack(payload(), '1234');
  const b = await share.pack(payload(), '1234');
  assert.notStrictEqual(a, b);
});

test('잘린 링크, 모르는 모양, 짧은 비밀번호', async () => {
  const token = await share.pack(payload(), '1234');
  await assert.rejects(share.unpack(token.slice(0, 20), '1234'), /잘렸/);
  await assert.rejects(share.unpack('%%%', '1234'), /잘렸|모양/);
  await assert.rejects(share.pack(payload(), '12'), /숫자 4~8자리/);
  assert.strictEqual(share.validPin('123456'), true);
  assert.strictEqual(share.validPin('12a4'), false);
});

test('한 달 스케줄 링크는 메신저로 보내기 좋은 길이다', async () => {
  const token = await share.pack(payload(), '482913');
  assert.ok(token.length < 3000, String(token.length));
});

test('링크 만들기와 꺼내기, 여섯 자리 비밀번호', () => {
  const link = share.linkFor('https://choiza.github.io/crew-schedule-app/family.html#old', 'abc_-1');
  assert.strictEqual(link, 'https://choiza.github.io/crew-schedule-app/family.html#s=abc_-1');
  assert.strictEqual(share.tokenFrom('#s=abc_-1'), 'abc_-1');
  assert.strictEqual(share.tokenFrom('#x=1&s=Zz9'), 'Zz9');
  assert.strictEqual(share.tokenFrom(''), null);
  assert.match(share.randomPin(), /^\d{6}$/);
});

test('열쇠를 링크에 넣으면 비밀번호 없이 링크만으로 연다', async () => {
  const data = payload();
  const key = share.randomKey();
  assert.match(key, /^\d{8}$/);
  const link = share.linkFor('https://choiza.github.io/crew-schedule-app/family.html', await share.pack(data, key), key);
  const hash = link.slice(link.indexOf('#'));
  assert.strictEqual(share.keyFrom(hash), key);
  assert.deepStrictEqual(await share.unpack(share.tokenFrom(hash), share.keyFrom(hash)), data);
  // 열쇠 없는 옛 링크
  assert.strictEqual(share.keyFrom('#s=abc'), null);
});
