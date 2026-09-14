'use strict';

const test = require('node:test');
const assert = require('node:assert');
const sync = require('../src/family/sync.js');
const qrcode = require('../vendor/qr/qrcode.js');
const jsQRModule = require('../vendor/qr/jsQR.js');
const jsQR = jsQRModule.default || jsQRModule;

/** QR 모듈을 흰 바탕 검은 칸 RGBA 픽셀로 그린다. 앱의 캔버스 그리기와 같은 모양. */
function rasterize(qr, cell, margin) {
  const count = qr.getModuleCount();
  const size = (count + margin * 2) * cell;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!qr.isDark(r, c)) continue;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const i = (((r + margin) * cell + y) * size + (c + margin) * cell + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, size };
}

test('가족 링크를 QR로 그리고 다시 읽으면 같은 가족 링크', async () => {
  const group = await sync.newGroup([], '2004');
  const link = sync.groupLinkFor('https://choiza.github.io/crew-schedule-app/family.html', group);
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  const { data, size } = rasterize(qr, 6, 4);
  const found = jsQR(data, size, size, { inversionAttempts: 'attemptBoth' });
  assert.ok(found, 'QR을 못 읽음');
  assert.strictEqual(found.data, link);
  const back = sync.fromGroupHash(found.data);
  assert.deepStrictEqual([back.salt, back.check, back.people.length], [group.salt, group.check, 0]);
});
