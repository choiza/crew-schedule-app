#!/usr/bin/env node
/**
 * TMAP 타임머신 자동차 길 안내로 요일·시간대별 걸리는 시간을 뽑아
 * src/family/travel-data.js 를 다시 쓴다.
 *
 * 준비: SK 오픈API(openapi.sk.com)에서 앱을 만들고 TMAP 앱 키를 받는다.
 *
 *   TMAP_APP_KEY=발급받은키 node scripts/tmap-travel-times.js
 *   TMAP_APP_KEY=... node scripts/tmap-travel-times.js --pairs miguem>ICN,ICN>miguem --hours 5-21
 *   node scripts/tmap-travel-times.js --dry-run          # 요청만 보여주고 보내지 않는다
 *
 * 한 쌍(정류장→공항)에 요일 7 × 시간대 수만큼 요청한다. 무료 사용량을 넘지 않게
 * --pairs, --hours 로 줄여서 여러 날에 나눠 돌리면 된다. 이미 있는 값은 건너뛴다.
 *
 * API 형식은 SK 오픈API 문서의 "타임머신 자동차 길 안내" 기준으로 적었다.
 * 처음 돌릴 때 --pairs 하나, --hours 하나로 응답을 확인하고 넓혀 주세요.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const bus = require('../src/family/bus.js');

const OUT = path.join(__dirname, '..', 'src', 'family', 'travel-data.js');
const ENDPOINT = 'https://apis.openapi.sk.com/tmap/routes/prediction?version=1';

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const dryRun = process.argv.includes('--dry-run');
const key = process.env.TMAP_APP_KEY;
const hours = (() => {
  const [a, b] = String(arg('hours', '4-22')).split('-').map(Number);
  return Array.from({ length: (b || a) - a + 1 }, (_, k) => a + k);
})();
const delayMs = Number(arg('delay', '400'));

/** 쓸 정류장→공항 쌍. 기본은 노선이 있는 모든 쌍. */
function allPairs() {
  const pairs = [];
  bus.ROUTES.forEach((route) => {
    Object.keys(route.stops).forEach((stopId) => {
      [bus.travelKey('out', stopId, route.airport), bus.travelKey('in', stopId, route.airport)].forEach((k) => {
        if (!pairs.includes(k)) pairs.push(k);
      });
    });
  });
  return pairs;
}
const pairs = arg('pairs') ? arg('pairs').split(',') : allPairs();

function pointOf(id) {
  if (bus.AIRPORTS[id]) return bus.AIRPORTS[id];
  return bus.STOPS[id];
}

/** 다가오는 그 요일, 그 시각 (한국 시각 ISO) */
function nextDate(weekday, hour) {
  const now = new Date(Date.now() + 9 * 3600e3);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(hour)}:00:00+0900`;
}

function load() {
  try {
    delete require.cache[require.resolve(OUT)];
    const data = require(OUT);
    return data && data.routes ? data : null;
  } catch (e) {
    return null;
  }
}

function write(data) {
  const body = JSON.stringify(data, null, 2);
  const text = `/**
 * TMAP 타임머신 예측표. scripts/tmap-travel-times.js 가 이 파일을 다시 쓴다. 손으로 고치지 말 것.
 * 비어 있으면 앱은 시간표와 추정표로 계산한다.
 *
 * routes['miguem>ICN'].byWeekday[요일 0~6][시 0~23] = 자동차로 걸리는 분
 * 버스 분 = 자동차 분 × busFactor + overhead (정류장 들르는 시간)
 */
(function (root) {
  'use strict';
  var data = ${body.replace(/\n/g, '\n  ')};
  var C = root.CrewCal;
  var useTmap = !(C && C.config && C.config.TRAVEL && C.config.TRAVEL.useTmap === false);
  if (C && C.bus && useTmap) C.bus.setTravelData(data);
  if (typeof module === 'object' && module.exports) module.exports = data;
})(typeof self !== 'undefined' ? self : this);
`;
  fs.writeFileSync(OUT, text);
}

async function ask(from, to, when) {
  const body = {
    routesInfo: {
      departure: { name: from.name || from.id || 'start', lon: String(from.lon), lat: String(from.lat), depSearchFlag: '05' },
      destination: { name: to.name || to.id || 'end', lon: String(to.lon), lat: String(to.lat), destSearchFlag: '03' },
      predictionType: 'departure',
      predictionTime: when,
      searchOption: '00',
      tollgateCarType: 'car',
      trafficInfo: 'N'
    }
  };
  if (dryRun) {
    console.log('POST', ENDPOINT, JSON.stringify(body));
    return null;
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { appKey: key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const props = json.features && json.features[0] && json.features[0].properties;
  if (!props || !props.totalTime) throw new Error('응답에 totalTime 이 없습니다: ' + JSON.stringify(json).slice(0, 300));
  return Math.round(props.totalTime / 60);
}

async function main() {
  if (!key && !dryRun) {
    console.error('TMAP_APP_KEY 가 없습니다. SK 오픈API에서 받은 키를 환경변수로 넣어 주세요. (--dry-run 으로 요청만 볼 수 있습니다)');
    process.exit(1);
  }
  const data = load() || { source: null, generated: null, busFactor: 1.2, overhead: 10, routes: {} };
  let asked = 0;

  for (const pair of pairs) {
    const [fromId, toId] = pair.split('>');
    const from = pointOf(fromId), to = pointOf(toId);
    if (!from || !to) {
      console.warn('모르는 쌍, 건너뜀:', pair);
      continue;
    }
    data.routes[pair] = data.routes[pair] || { byWeekday: {} };
    for (let weekday = 0; weekday < 7; weekday++) {
      const row = (data.routes[pair].byWeekday[weekday] = data.routes[pair].byWeekday[weekday] || {});
      for (const hour of hours) {
        if (row[hour]) continue;
        const when = nextDate(weekday, hour);
        try {
          const minutes = await ask(from, to, when);
          if (minutes) row[hour] = minutes;
          asked++;
          if (!dryRun) {
            console.log(pair, bus.WEEKDAYS[weekday], hour + '시', minutes + '분');
            data.source = 'TMAP 타임머신 자동차 길 안내';
            data.generated = new Date().toISOString().slice(0, 10);
            write(data);
            await new Promise((r) => setTimeout(r, delayMs));
          }
        } catch (err) {
          console.error(pair, bus.WEEKDAYS[weekday], hour + '시', '실패:', err.message);
          if (/HTTP 4(01|03|29)/.test(err.message)) {
            console.error('키 문제이거나 사용량을 넘었습니다. 저장된 값까지만 남기고 멈춥니다.');
            process.exit(2);
          }
        }
      }
    }
  }
  console.log(dryRun ? `요청 ${asked}건 (보내지 않음)` : `요청 ${asked}건 완료 → ${path.relative(process.cwd(), OUT)}`);
}

main();
