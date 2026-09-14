'use strict';

const test = require('node:test');
const assert = require('node:assert');
const sync = require('../src/family/sync.js');

const CFG = { url: 'https://abcdefgh.supabase.co', anonKey: 'anon-public-key' };

function payload(n) {
  return { app: 'crew-family-sync', v: 1, name: '테스트', entries: [{ date: '2026-09-01', code: n || 'DO', type: 'duty', category: 'off' }] };
}

/** Supabase 함수를 흉내 내는 가짜 저장소 */
function fakeSupabase() {
  const rows = {};
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    const name = url.split('/rpc/')[1];
    const body = JSON.parse(init.body);
    const ok = (data) => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });
    const fail = (message) => ({ ok: false, status: 400, text: async () => JSON.stringify({ message }) });
    if (name === 'put_family_share') {
      const row = rows[body.p_id];
      if (row && row.token !== body.p_token) return fail('wrong token');
      rows[body.p_id] = { cipher: body.p_cipher, token: body.p_token, updated_at: '2026-09-14T09:00:00Z' };
      return ok('2026-09-14T09:00:00Z');
    }
    if (name === 'get_family_share') {
      const row = rows[body.p_id];
      return ok(row ? [{ cipher: row.cipher, updated_at: row.updated_at }] : []);
    }
    return fail('unknown');
  };
  return { rows, calls, fetcher };
}

test('설정이 채워져야 켜진다', () => {
  assert.strictEqual(sync.enabled(CFG), true);
  assert.strictEqual(sync.enabled({ url: '', anonKey: 'x' }), false);
  assert.strictEqual(sync.enabled({ url: 'https://evil.example.com', anonKey: 'x' }), false);
});

test('잠근 스케줄은 링크의 열쇠로만 풀린다', async () => {
  const link = sync.newLink();
  const cipher = await sync.seal(payload(), link.key);
  assert.deepStrictEqual(await sync.open(cipher, link.key), payload());
  await assert.rejects(sync.open(cipher, sync.newLink().key), /열쇠가 맞지 않습니다/);
});

test('보내는 폰이 올리면 링크 받은 폰이 최신을 받는다', async () => {
  const fake = fakeSupabase();
  const api = sync.client(CFG, fake.fetcher);
  const link = sync.newLink();
  await api.put(link.id, await sync.seal(payload('DO'), link.key), link.token);
  await api.put(link.id, await sync.seal(payload('STBY'), link.key), link.token);
  const got = await api.get(link.id);
  assert.strictEqual((await sync.open(got.cipher, link.key)).entries[0].code, 'STBY');
  // 저장소에는 잠긴 글자만 있다
  assert.ok(!fake.rows[link.id].cipher.includes('STBY'));
  // 부르는 모양
  const first = fake.calls[0];
  assert.strictEqual(first.url, 'https://abcdefgh.supabase.co/rest/v1/rpc/put_family_share');
  assert.strictEqual(first.init.headers.apikey, 'anon-public-key');
  assert.strictEqual(first.init.headers.Authorization, 'Bearer anon-public-key');
});

test('쓰기 열쇠가 다른 폰은 바꿀 수 없고, 없는 링크는 null', async () => {
  const fake = fakeSupabase();
  const api = sync.client(CFG, fake.fetcher);
  const link = sync.newLink();
  await api.put(link.id, await sync.seal(payload(), link.key), link.token);
  await assert.rejects(api.put(link.id, 'x'.repeat(40), sync.newLink().token), /권한이 없습니다/);
  assert.strictEqual(await api.get(sync.newLink().id), null);
});

test('인터넷이 끊기면 알아듣는 말로', async () => {
  const api = sync.client(CFG, async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.get('a'.repeat(24)), /인터넷에 연결되지 않아/);
});

test('가족 링크 하나에 여러 사람이 담기고, 쓰기 열쇠는 링크에 없다', async () => {
  const group = await sync.newGroup(['민주', '신주'], '2004');
  const url = sync.groupLinkFor('https://choiza.github.io/crew-schedule-app/family.html', group);
  const back = sync.fromGroupHash(url.slice(url.indexOf('#')));
  assert.deepStrictEqual(back, group);
  for (const p of group.people) {
    const token = await sync.writeToken(p.id, '2004');
    assert.ok(token.length >= 32);
    assert.ok(!url.includes(token));
  }
  assert.strictEqual(sync.fromGroupHash('#g=bad'), null);
});

test('관리자 비밀번호가 맞을 때만 같은 확인값과 같은 쓰기 열쇠', async () => {
  const group = await sync.newGroup(['민주'], '2004');
  assert.strictEqual(await sync.pinCheck(group.salt, '2004'), group.check);
  assert.notStrictEqual(await sync.pinCheck(group.salt, '2005'), group.check);
  const id = group.people[0].id;
  assert.strictEqual(await sync.writeToken(id, '2004'), await sync.writeToken(id, '2004'));
  assert.notStrictEqual(await sync.writeToken(id, '2004'), await sync.writeToken(id, '1234'));
});

test('비밀번호로 만든 쓰기 열쇠로 올리고, 틀린 비밀번호 열쇠는 막힌다', async () => {
  const fake = fakeSupabase();
  const api = sync.client(CFG, fake.fetcher);
  const group = await sync.newGroup(['민주'], '2004');
  const p = group.people[0];
  await api.put(p.id, await sync.seal(payload('DO'), p.key), await sync.writeToken(p.id, '2004'));
  await api.put(p.id, await sync.seal(payload('STBY'), p.key), await sync.writeToken(p.id, '2004'));
  await assert.rejects(api.put(p.id, await sync.seal(payload('X'), p.key), await sync.writeToken(p.id, '0000')), /권한이 없습니다/);
});

test('가족 명단 칸은 링크에서만 나오고, 사람을 더하면 합쳐진다', async () => {
  const group = await sync.newGroup(['민주', '신주'], '2004');
  const a = await sync.dirFor(group);
  const b = await sync.dirFor(JSON.parse(JSON.stringify(group)));
  assert.deepStrictEqual(a, b);
  assert.match(a.id, /^[A-Za-z0-9_-]{24}$/);
  // 명단을 잠그고 풀 수 있는 열쇠
  const sealed = await sync.seal({ people: group.people }, a.key);
  assert.deepStrictEqual((await sync.open(sealed, a.key)).people, group.people);
  const other = await sync.newGroup(['민주'], '2004');
  assert.notStrictEqual((await sync.dirFor(other)).id, a.id);
  const added = sync.newLink();
  const merged = sync.mergePeople(group.people, group.people.concat([{ name: '지현', id: added.id, key: added.key }]));
  assert.deepStrictEqual(merged.map((p) => p.name), ['민주', '신주', '지현']);
  assert.strictEqual(sync.mergePeople(merged, group.people).length, 3);
});
