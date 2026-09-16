/**
 * 오늘 민주는 — 화면 조립.
 * 크루캘의 글자 인식(ocr)과 파서(parser), 노선 자료(routes)를 그대로 쓰고,
 * 가족용 표기(plan)와 공항버스 계산(bus)을 얹는다.
 */
(function () {
  'use strict';

  var C = window.CrewCal;
  var plan = C.plan, bus = C.bus, parser = C.parser, routes = C.routes;
  var ocr = C.ocr, routedata = C.routedata, airports = C.airports, flightstatus = C.flightstatus;
  var flighttime = C.flighttime;
  var sync = C.sync;
  var config = C.config || { ADS: { enabled: false }, TRAVEL: {} };

  // 이 폰이 새 판을 받았는지 눈으로 확인할 수 있게 설정 맨 아래에 적는다. family-sw.js 의 VERSION 과 같이 올린다.
  var APP_VERSION = 38;
  (function showVersion() {
    var el = document.getElementById('appVersion');
    if (!el) return;
    var native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    el.textContent = '앱 버전 ' + APP_VERSION + (native ? ' (안드로이드 앱)' : ' (웹)');
  })();

  // 사람 목록은 따로 두고, 스케줄과 설정은 사람마다 다른 자리에 저장한다.
  // 처음 사람은 예전 판과 같은 자리(id minju)를 써서 넣어 둔 스케줄이 그대로 이어진다. 새로 설치하면 이름은 '나'.
  var PEOPLE_KEY = 'crew-family.people';
  var people = loadPeople();
  var NAME = currentPerson().name;
  var KEY = keyFor(people.current);

  function loadPeople() {
    try {
      var saved = JSON.parse(localStorage.getItem(PEOPLE_KEY) || 'null');
      if (saved && Array.isArray(saved.list) && saved.list.length) return saved;
    } catch (e) { /* 못 읽으면 처음부터 */ }
    return { current: 'minju', list: [{ id: 'minju', name: '나' }] };
  }

  function savePeople() {
    try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(people)); } catch (e) { /* 저장 못 해도 이번 화면은 돈다 */ }
  }

  function currentPerson() {
    return people.list.filter(function (p) { return p.id === people.current; })[0] || people.list[0];
  }

  function keyFor(id) {
    return id === 'minju' ? 'crew-family.v1' : 'crew-family.p.' + id;
  }

  /** 받침이 있으면 '은', 없으면 '는' */
  function topic(name) {
    var c = String(name || '').charCodeAt(String(name || '').length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '은' : '는';
  }
  // 기본 시간표(data/ke-times.json)에 빠진 편. 조회 사이트 기준이며 날마다 다를 수 있다.
  var TRIP_COLORS = 4;
  var SOURCE_LABEL = { timetable: '시간표', tmap: 'TMAP 예측', estimate: '추정', setting: '설정값' };

  var platform = bus.platformOf(navigator.userAgent, navigator.maxTouchPoints);

  function $(id) { return document.getElementById(id); }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var ICON = {
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bus: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="15" rx="3"/><path d="M4 11h16M8 18.5V21M16 18.5V21"/></svg>',
    alarm: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M5 4 2.5 6.5M19 4l2.5 2.5"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 3.5v17"/></svg>',
    install: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    locate: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="7.5"/></svg>'
  };

  /* ---------------- 저장 ---------------- */

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 못 읽으면 새로 시작 */ }
    return {};
  }

  var db = null;
  initDb();

  function initDb() {
    db = load();
    // 예전 판은 사는 곳 하나(area)나 정류장 하나(stop)를 저장했다. 그곳을 1순위로 올린다.
    var rawSettings = db.settings || {};
    db.settings = bus.settingsWith(rawSettings);
    if (!Array.isArray(rawSettings.places)) {
      var firstPlace = rawSettings.area || (rawSettings.stop === 'dankook' || rawSettings.stop === 'jukjeon' ? 'suji' : null);
      if (firstPlace) {
        db.settings.places.sort(function (a, b) { return (b.id === firstPlace) - (a.id === firstPlace); });
      }
    }
    db.overrides = db.overrides || {};   // 'YYYY-MM-DD|편명' → 'HH:MM'
    db.entries = Array.isArray(db.entries) ? db.entries : [];
    db.words = db.words || {};           // 코드 → { short, long, category }
    db.routeFix = db.routeFix || {};     // 편명 → { from, to }
    db.edited = db.edited || {};         // 손으로 고친 날짜
    db.booked = db.booked || {};         // 'YYYY-MM-DD|편명|out' → { route, stop, board, placeId }
    db.live = db.live || {};             // 'YYYY-MM-DD|편명' → 공항에서 받은 오늘 시각
    db.blockFix = db.blockFix || {};     // 편명 → 손으로 고친 비행시간(분)
    db.confirmed = db.confirmed || {};   // 코드 → 뜻을 확인했음(맞음)
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      toast('이 브라우저에 저장하지 못했습니다. 개인 정보 보호 모드를 끄고 다시 해 주세요.');
    }
    if (typeof scheduleFamilyUpload === 'function') scheduleFamilyUpload();
  }

  /** 파서 결과에서 달력에 필요한 것만 남긴다. 노선도 이때 채운다. */
  function slim(list) {
    var byDate = {};
    list.forEach(function (entry) {
      (byDate[entry.date] = byDate[entry.date] || []).push(entry);
    });
    routes.apply(byDate);
    return list.map(function (entry) {
      return {
        date: entry.date,
        code: String(entry.code || '').toUpperCase(),
        type: entry.type,
        category: entry.category,
        route: entry.route || null,
        from: entry.from || null,
        to: entry.to || null
      };
    });
  }

  var sampleCache = null;
  function sampleEntries() {
    if (!sampleCache) {
      sampleCache = slim(parser.parse(C.sample.TEXT, { year: C.sample.YEAR, month: C.sample.MONTH }).entries);
    }
    return sampleCache;
  }

  var TEST_NAME = '테스트';

  /** 테스트 사람에게 보여 줄 스케줄. 테스트 모드에서 고른다: 'sample' 예시, 'real' 넣은 스케줄 */
  function testSource() {
    return admin && admin.source === 'real' ? 'real' : 'sample';
  }

  function testMode() {
    return !!(admin && admin.on);
  }

  /** 테스트 모드가 꺼져 있으면 테스트 사람은 목록과 함께 보기에서 숨긴다. */
  function visiblePeople() {
    return people.list.filter(function (p) { return testMode() || p.name !== TEST_NAME; });
  }

  /** 예시는 테스트 모드가 켜져 있고, 이름이 '테스트'이고, 예시를 골랐을 때만 보여 준다. 다른 사람은 스케줄이 없으면 빈 달력이다. */
  function isSample() {
    return testMode() && NAME === TEST_NAME && testSource() === 'sample';
  }
  function rawEntries() { return isSample() ? sampleEntries() : db.entries; }

  /** 고친 노선을 얹은 일정 */
  function entries() {
    return rawEntries().map(function (entry) {
      var fix = entry.type === 'flight' && db.routeFix[entry.code];
      if (!fix) return entry;
      return Object.assign({}, entry, { from: fix.from, to: fix.to, route: fix.from + '/' + fix.to });
    });
  }

  /** 예시를 고치기 시작하면 예시를 내 스케줄로 옮겨 온다 */
  /** 고치기 전에 내 스케줄로 만든다. 예시를 보는 중에 넣은 스케줄이 있으면 덮어쓰지 않고 멈춘다. */
  function ensureOwn() {
    if (!isSample()) return true;
    if (db.entries.length) {
      toast('지금은 예시 스케줄을 보고 있어요. 테스트 모드에서 "넣은 스케줄"로 바꾼 뒤 고쳐 주세요.');
      return false;
    }
    db.entries = sampleEntries().map(function (entry) { return Object.assign({}, entry); });
    admin.source = 'real';
    saveAdmin();
    return true;
  }

  function monthsWithData() {
    var seen = {};
    rawEntries().forEach(function (entry) { seen[entry.date.slice(0, 7)] = true; });
    return Object.keys(seen).sort();
  }

  /* ---------------- 시각 ---------------- */

  function overrideKey(ev) { return ev.date + '|' + ev.code; }

  function tableTime(ev) {
    var row = ((routedata.TIMES && routedata.TIMES.times) || {})[ev.code] ||
      (isSample() && C.sample.TIMES ? C.sample.TIMES[ev.code] : null);
    if (!row) return null;
    return ev.type === 'in' ? (row.end || null) : (row.start || null);
  }

  function timeOf(ev) {
    var live = db.live && db.live[overrideKey(ev)];
    return db.overrides[overrideKey(ev)] || (live && live.time) || tableTime(ev);
  }

  /* ---------------- 테스트 모드 ---------------- */

  var ADMIN_KEY = 'crew-family.admin';
  var admin = readAdmin();

  function readAdmin() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}') || {}; } catch (e) { saved = {}; }
    if (/[?&]admin\b/.test(location.search) && !saved.on) {
      saved.on = true;
      try { localStorage.setItem(ADMIN_KEY, JSON.stringify(saved)); } catch (e) { /* 이번 화면에서만 켜짐 */ }
    }
    return saved;
  }

  function saveAdmin() {
    try { localStorage.setItem(ADMIN_KEY, JSON.stringify(admin)); } catch (e) { /* 저장 못 해도 이번 화면에서는 동작 */ }
  }

  function fakeToday() { return !!(admin.on && admin.today); }

  /** 지금 시각. 테스트 모드에서 날짜를 정했으면 그 날짜와 시각에 멈춰 있다. */
  function nowDate() {
    if (!fakeToday()) return new Date();
    var t = String(admin.time || '09:00').split(':');
    return new Date(+admin.today.slice(0, 4), +admin.today.slice(5, 7) - 1, +admin.today.slice(8, 10), +t[0] || 0, +t[1] || 0);
  }

  function todayIso() {
    var now = nowDate();
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  }

  function dateLabel(iso, withWeekday) {
    var text = (+iso.slice(5, 7)) + '월 ' + (+iso.slice(8, 10)) + '일';
    if (withWeekday) text += ' ' + plan.WEEKDAYS[plan.weekdayOf(iso)] + '요일';
    return text;
  }

  function shortDate(iso) {
    return (+iso.slice(5, 7)) + '/' + (+iso.slice(8, 10)) + ' ' + plan.WEEKDAYS[plan.weekdayOf(iso)];
  }

  /** 그 도시의 지금 시각과 한국과의 차이 */
  function localClock(place) {
    if (!place || !place.zone) return null;
    try {
      var now = nowDate();
      var parts = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: place.zone, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
      var asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
      var diff = Math.round((asUtc - now.getTime()) / 60000) - 540;
      var gap = diff === 0 ? '한국과 같은 시각'
        : '한국보다 ' + bus.span(Math.abs(diff)) + (diff < 0 ? ' 느림' : ' 빠름');
      return { text: bus.clock(+parts.hour * 60 + +parts.minute), gap: gap };
    } catch (e) {
      return null;
    }
  }

  /* ---------------- 상태 ---------------- */

  var state = { view: 'calendar', year: 0, month: 0, model: null, openDate: null };

  function pickMonth() {
    var today = todayIso().slice(0, 7);
    var months = monthsWithData();
    var target = months.indexOf(today) >= 0 ? today : (months[months.length - 1] || today);
    state.year = +target.slice(0, 4);
    state.month = +target.slice(5, 7);
  }

  function modelFor(year, month) {
    return plan.buildMonth(year, month, entries(), { timeOf: timeOf, words: db.words });
  }

  function findDay(iso) {
    return modelFor(+iso.slice(0, 4), +iso.slice(5, 7)).days[+iso.slice(8, 10) - 1];
  }

  function departAirport(ev) { return ev.from === 'GMP' ? 'GMP' : 'ICN'; }
  function arriveAirport(ev) { return ev.to === 'GMP' ? 'GMP' : 'ICN'; }
  function airportShort(code) { return (bus.AIRPORTS[code] || {}).short || code; }
  function airportFull(code) { return (bus.AIRPORTS[code] || {}).name || code; }
  function areaName() {
    var places = bus.activePlaces(db.settings);
    return places.length ? places.map(function (p) { return p.name; }).join(' > ') : '출발지 없음';
  }

  function outRec(ev) { return bus.recommendOut(bus.toMin(ev.time), ev.date, departAirport(ev), db.settings); }
  function inRec(ev) { return bus.recommendIn(bus.toMin(ev.time), ev.date, arriveAirport(ev), db.settings); }

  function tripClass(day) {
    return day.trip == null ? '' : 't-' + (day.trip % TRIP_COLORS);
  }

  function cityOf(iata) { return iata ? airports.cityOf(iata) : ''; }

  /** 한국 공휴일 이름. 2020~2100년 밖이면 null. */
  function holidayOf(iso) {
    return (C.holidays && C.holidays.nameOf(iso)) || null;
  }

  /* ---------------- 오늘 카드 ---------------- */

  function kv(label, value, extra, accent) {
    return '<div class="kv"><span class="kv-label">' + esc(label) + '</span>' +
      '<span class="kv-value' + (accent ? ' is-accent' : '') + '">' + esc(value) +
      (extra ? '<small>' + esc(extra) + '</small>' : '') + '</span></div>';
  }

  function firstDayAfter(iso, test) {
    var months = monthsWithData();
    for (var i = 0; i < months.length; i++) {
      if (months[i] < iso.slice(0, 7)) continue;
      var m = modelFor(+months[i].slice(0, 4), +months[i].slice(5, 7));
      for (var j = 0; j < m.days.length; j++) {
        if (m.days[j].date > iso && test(m.days[j])) return m.days[j];
      }
    }
    return null;
  }

  function nextStubs(iso, onlyOff) {
    var flight = onlyOff ? null : firstDayAfter(iso, function (d) { return d.kind === 'out' || d.kind === 'turn'; });
    var off = firstDayAfter(iso, function (d) { return d.kind === 'off'; });
    var html = '';
    if (!onlyOff) {
      html += flight
        ? kv('다음 비행', dateLabel(flight.date), flight.place.city + (flight.kind === 'turn' ? ' 당일 왕복' : ''))
        : kv('다음 비행', '없음', '넣은 스케줄 기준');
    }
    if (off) html += kv('다음 휴무', dateLabel(off.date));
    return html;
  }

  function busStubOut(rec) {
    if (rec.board == null) {
      return kv('버스', rec.status === 'no-timetable' ? '시간표 없음' : '계산 못 함',
        rec.status === 'no-timetable' ? '설정에서 시각을 넣어 주세요' : '출발 시각이 필요해요');
    }
    return kv('일어나기', bus.clock(rec.wake), '', true) +
      kv(rec.route + ' ' + rec.stopName, bus.clock(rec.board), rec.booked ? (rec.fit ? '예매한 버스' : '예매한 차가 늦어요') : rec.status === 'late' ? '가장 이른 차도 늦어요' : '추천 버스');
  }

  function busStubIn(rec, when) {
    if (rec.board == null) {
      return kv('버스', rec.status === 'missed' ? '막차 뒤 도착' : '시간표 없음',
        rec.status === 'missed' ? '택시를 알아봐 주세요' : (rec.ranges || []).join(', '));
    }
    return kv(rec.route + ' ' + airportShort(rec.airport), bus.clock(rec.board), when || '추천 버스', !when) +
      kv('집 도착', bus.clock(rec.home), '예상');
  }

  function renderTicket() {
    var iso = todayIso();
    var day = findDay(iso);
    var eyebrow = dateLabel(iso, true);
    var city = '', flag = '', iata = '', iataSub = '', line = '', stub = '';

    // 출발 시각이 지났으면 해외(또는 비행 중)로, 귀국하고 집에 올 시간이 지났으면 다음 일정으로 넘긴다
    var nowAt = nowDate();
    var nowMin = nowAt.getHours() * 60 + nowAt.getMinutes();
    var outEv = day.outs && day.outs[0];
    var inEv = day.ins && day.ins[0];
    if (day.kind === 'out' && outEv && outEv.time && day.place && bus.toMin(outEv.time) <= nowMin) {
      var block = flighttime ? flighttime.blockOf(outEv, db.blockFix).minutes : null;
      var landAt = block != null ? bus.toMin(outEv.time) + block : null;
      day = Object.assign({}, day, { kind: 'away', departed: true, flying: landAt != null && nowMin < landAt, landAt: landAt });
    } else if ((day.kind === 'turn' || day.kind === 'in') && inEv && inEv.time &&
        bus.toMin(inEv.time) + (+db.settings.afterLanding || 0) + 90 <= nowMin) {
      day = Object.assign({}, day, { kind: 'home', doneKind: day.kind });
    }

    switch (day.kind) {
      case 'out':
      case 'turn': {
        var ev = day.outs[0];
        flag = day.place.flag; city = day.place.city; iata = day.place.iata; iataSub = ev.code;
        eyebrow += day.kind === 'turn' ? ', 당일 왕복' : ', 출국';
        line = ev.time ? '<span class="t">' + esc(bus.clock(bus.toMin(ev.time))) + '</span> ' + esc(cityOf(ev.from)) + ' 출발' : '출발 시각을 넣어 주세요';
        if (day.kind === 'turn' && day.ins[0] && day.ins[0].time) {
          line += ', <span class="t">' + esc(bus.clock(bus.toMin(day.ins[0].time))) + '</span> 도착';
        }
        stub = busStubOut(bookedPlan(ev, 'out') || outRec(ev));
        break;
      }
      case 'away': {
        var back = plan.returnAfter(modelFor(+iso.slice(0, 4), +iso.slice(5, 7)), iso);
        var clock = localClock(day.place);
        flag = day.place.flag; city = day.place.city; iata = day.place.iata; iataSub = '체류';
        eyebrow += day.departed ? ', 출국함' : ', 해외 체류';
        line = day.flying
          ? '지금 비행 중, 한국 시각 <span class="t">' + esc(bus.clock(day.landAt % 1440)) + '</span> 도착 예정'
          : clock ? '현지 시각 <span class="t">' + esc(clock.text) + '</span>, ' + esc(clock.gap) : esc(day.place.city) + '에 머무는 중';
        stub = (back
          ? kv('돌아오는 날', dateLabel(back.date), back.time ? bus.clock(bus.toMin(back.time)) + ' ' + cityOf(back.to) + ' 도착' : '')
          : kv('돌아오는 날', '스케줄에 없음')) + nextStubs(iso, true);
        break;
      }
      case 'homeward': {
        var hw = day.homeward[0];
        flag = day.place.flag; city = day.place.city; iata = hw.from + '→' + hw.to; iataSub = hw.code;
        eyebrow += ', 귀국길';
        line = '내일 ' + (hw.time ? '<span class="t">' + esc(bus.clock(bus.toMin(hw.time))) + '</span> ' : '') + esc(cityOf(hw.to)) + ' 도착';
        stub = kv('도착', dateLabel(hw.date), hw.time ? bus.clock(bus.toMin(hw.time)) : '') + busStubIn(inRec(hw), '내일 탈 차').split('</div>')[0] + '</div>';
        break;
      }
      case 'in': {
        var inn = day.ins[0];
        flag = day.place.flag; city = '귀국'; iata = inn.to; iataSub = inn.code;
        eyebrow += ', ' + day.place.city + '에서';
        line = inn.time ? '<span class="t">' + esc(bus.clock(bus.toMin(inn.time))) + '</span> ' + esc(cityOf(inn.to)) + ' 도착' : '도착 시각을 넣어 주세요';
        stub = busStubIn(bookedPlan(inn, 'in') || inRec(inn));
        break;
      }
      case 'home':
        city = day.doneKind === 'turn' ? '다녀왔어요' : '귀국했어요';
        line = '오늘 비행을 마쳤어요';
        stub = nextStubs(iso);
        break;
      case 'off':
        city = day.short;
        line = '집에 있어요';
        stub = nextStubs(iso);
        break;
      case 'standby':
        city = day.short;
        line = '연락이 오면 비행에 나갈 수 있어요';
        stub = nextStubs(iso);
        break;
      case 'training':
      case 'work':
        city = day.short === '지상' ? '지상 근무' : day.short;
        line = '비행 없이 한국에서 일해요';
        stub = nextStubs(iso);
        break;
      default: {
        var hasMonth = monthsWithData().indexOf(iso.slice(0, 7)) >= 0;
        city = hasMonth ? '일정 없음' : '스케줄 없음';
        line = hasMonth ? '오늘은 적힌 일정이 없어요' : '이번 달 캡처를 넣어 주세요';
        stub = nextStubs(iso);
      }
    }

    var ticket = $('ticket');
    ticket.className = 'ticket ' + tripClass(day);
    ticket.innerHTML =
      '<div class="ticket-main">' +
        '<span class="ticket-eyebrow"><i class="now-dot"></i>' + esc(eyebrow) + '</span>' +
        '<p class="ticket-city">' + (flag ? '<span class="flag">' + flag + '</span>' : '') + esc(city) + '</p>' +
        '<p class="ticket-line">' + line + '</p>' +
        (iata ? '<span class="ticket-iata" aria-hidden="true">' + esc(iata) + (iataSub ? '<small>' + esc(iataSub) + '</small>' : '') + '</span>' : '') +
      '</div>' +
      '<div class="perf" aria-hidden="true"></div>' +
      '<div class="ticket-stub">' + stub + '</div>';
    ticket.dataset.date = iso;
  }

  /* ---------------- 예매할 때가 된 비행 ---------------- */

  function bookingKey(ev, direction) { return ev.date + '|' + ev.code + '|' + direction; }

  /** 오늘부터 비행일까지 가운데, 예매 알림 날이 지났고 아직 예매 안 한 버스 */
  function dueBookings() {
    var today = todayIso();
    var days = +db.settings.bookDaysBefore;
    var list = [];
    var seen = {};
    monthsWithData().forEach(function (month) {
      modelFor(+month.slice(0, 4), +month.slice(5, 7)).events.forEach(function (ev) {
        if (ev.type !== 'out' && ev.type !== 'in') return;
        var key = bookingKey(ev, ev.type);
        if (seen[key] || ev.date < today) return;
        var mine = db.booked[key] ? bookedPlan(ev, ev.type) : null;
        if (db.booked[key] && (!mine || mine.fit)) return;
        if (!mine && bus.bookingDay(ev.date, days) > today) return;
        seen[key] = true;
        list.push({ ev: ev, key: key, warn: !!mine, rec: mine || (ev.type === 'out' ? outRec(ev) : inRec(ev)) });
      });
    });
    return list.sort(function (a, b) { return a.ev.date < b.ev.date ? -1 : a.ev.date > b.ev.date ? 1 : 0; });
  }

  function renderReminders() {
    var list = canEdit() ? dueBookings() : [];
    var box = $('reminders');
    if (!list.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    var shown = list.slice(0, 2);
    box.hidden = false;
    box.innerHTML = '<h2 class="reminders-title">버스 예매를 확인할 비행<span>' + list.length + '건</span></h2>' +
      '<ul class="reminders-list">' + shown.map(function (item) {
        var ev = item.ev, rec = item.rec;
        var what = ev.type === 'out'
          ? ev.place.city + ' 출발, ' + airportShort(departAirport(ev)) + '행'
          : ev.place.city + '에서 귀국, ' + airportShort(arriveAirport(ev)) + '에서';
        var busText = (item.warn ? '예매한 차가 안 맞음: ' : '') +
          (rec.board != null ? rec.route + ' ' + rec.stopName + ' ' + bus.hhmm(rec.board) : '버스 시간표 확인 필요');
        return '<li><button type="button" class="reminder" data-date="' + ev.date + '">' +
          '<span class="reminder-date">' + esc(shortDate(ev.date)) + '</span>' +
          '<span class="reminder-what">' + esc(what) + '<small>' + esc(busText) + '</small></span>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></li>';
      }).join('') + '</ul>' +
      (list.length > shown.length ? '<p class="note">외 ' + (list.length - shown.length) + '건 더 있어요. 날짜를 눌러 예매해 주세요.</p>' : '');
  }

  /* ---------------- 총 비행 시간 ---------------- */

  var SOURCE_BLOCK = { timetable: '시간표', estimate: '거리 추정', setting: '고친 값', none: '모름' };

  function blockNote(ev) {
    if (!flighttime) return '';
    var block = flighttime.blockOf(ev, db.blockFix);
    return block.minutes == null ? '' : ', 비행 ' + flighttime.hours(block.minutes) + (block.source === 'estimate' ? ' (추정)' : '');
  }

  function monthHours(model) {
    return flighttime.total(model.events, model.year + '-' + pad(model.month), db.blockFix);
  }

  /** 올해 넣은 스케줄 전체의 합계. 같은 편이 앞뒤 달 모델에 겹치지 않게 달마다 그 달 출발만 센다. */
  function yearHours(year) {
    var minutes = 0, count = 0;
    monthsWithData().forEach(function (month) {
      if (month.slice(0, 4) !== String(year)) return;
      var t = monthHours(modelFor(+month.slice(0, 4), +month.slice(5, 7)));
      minutes += t.minutes;
      count += t.count;
    });
    return { minutes: minutes, count: count };
  }

  function renderHoursChip(model) {
    if (!flighttime || !$('flightHours')) return;
    var t = monthHours(model);
    $('monthHeadLabel').textContent = model.month + '월';
    $('flightHoursValue').textContent = t.count ? flighttime.hours(t.minutes) : '없음';
    $('flightHours').classList.toggle('has-estimate', t.estimated > 0 || t.missing > 0);
    $('flightHours').setAttribute('aria-label', model.month + '월 총 비행 시간 ' + (t.count ? flighttime.hours(t.minutes) : '없음') + ', 자세히 보기');
  }

  function hoursSheetHtml(model) {
    var t = monthHours(model);
    var year = yearHours(model.year);
    var limit = flighttime.YEAR_LIMIT_HOURS * 60;
    var ratio = Math.min(100, Math.round(year.minutes / limit * 100));
    var rows = t.items.map(function (item) {
      var ev = item.ev;
      var id = 'block-' + item.date + '-' + item.code;
      return '<li class="hours-item">' +
        '<span class="hours-date">' + esc(shortDate(item.date)) + '</span>' +
        '<span class="hours-flight"><b>' + esc(item.code) + '</b> ' + esc((ev.from || '?') + '→' + (ev.to || '?')) +
          '<small>' + esc(cityOf(ev.from) + ' → ' + cityOf(ev.to)) + '</small></span>' +
        '<span class="hours-time">' + esc(item.minutes == null ? '모름' : flighttime.hours(item.minutes)) +
          '<small class="src src-' + esc(item.source === 'setting' ? 'setting' : item.source === 'estimate' ? 'estimate' : 'timetable') + '">' + esc(SOURCE_BLOCK[item.source]) + '</small></span>' +
        '<label class="visually-hidden" for="' + esc(id) + '">' + esc(item.code) + ' 비행시간 고치기</label>' +
        '<input id="' + esc(id) + '" class="hours-fix" type="text" inputmode="numeric" data-block-fix="' + esc(item.code) + '" placeholder="6:10" value="' +
          esc(db.blockFix[item.code] != null ? Math.floor(db.blockFix[item.code] / 60) + ':' + pad(db.blockFix[item.code] % 60) : '') + '" autocomplete="off"' + (canEdit() ? '' : ' disabled') + '>' +
        '</li>';
    }).join('');
    return '<header class="sheet-head"><p class="eyebrow">총 비행 시간</p>' +
      '<h2 id="hoursTitle" class="display">' + esc(model.month + '월 ' + (t.count ? flighttime.hours(t.minutes) : '비행 없음')) + '</h2>' +
      '<p class="lede">비행 ' + t.count + '편' + (t.estimated ? ', 그중 ' + t.estimated + '편은 거리로 추정' : '') + (t.missing ? ', ' + t.missing + '편은 계산 못 함' : '') + '.</p></header>' +
      '<section class="block"><h3 class="block-title">' + esc(model.year) + '년 누적<span class="route-chip">' + esc(flighttime.hours(year.minutes)) + '</span></h3>' +
        '<div class="meter" role="img" aria-label="연간 한도 1,200시간 가운데 ' + ratio + '퍼센트"><i style="width:' + ratio + '%"></i></div>' +
        '<p class="note">객실승무원 연간 한도 1,200시간의 ' + ratio + '%입니다. 이 앱에 넣은 달만 셉니다. 월, 3개월 한도는 회사 운항규정에 따릅니다.</p></section>' +
      monthsTable(model) +
      '<h3 class="block-title">' + esc(model.month) + '월 편별 비행 시간</h3>' +
      (rows ? '<ul class="hours-list">' + rows + '</ul>' : '<p class="note">이 달에는 비행이 없습니다.</p>') +
      '<p class="note">오른쪽 칸에 6:10처럼 적으면 그 편명의 비행시간을 고칩니다. 같은 편명이 들어간 모든 날에 적용되고, 비우면 원래 값으로 돌아갑니다.</p>' +
      '<section class="block"><h3 class="block-title">어떻게 셌나요</h3>' +
        '<p class="note">비행시간(승무시간)은 이륙하려고 비행기가 처음 움직인 때부터 착륙해 멈춘 때까지, 흔히 말하는 블록 타임입니다(항공안전법 시행규칙 별표 18). ' +
        '편마다 대한항공 계획 시간표 값을 쓰고(' + esc(flighttime.SOURCE) + '), 표에 없는 편은 두 공항 사이 거리로 추정합니다. ' +
        '밤을 넘기는 편은 출발한 날에 한 번만 셉니다. 계획 시간이라 실제 운항이나 급여 명세의 시간과 다를 수 있습니다.</p></section>';
  }

  function monthsTable(model) {
    var months = monthsWithData().slice().reverse();
    if (!months.length) return '';
    var current = model.year + '-' + pad(model.month);
    return '<section class="block"><h3 class="block-title">달마다 비행 시간</h3><ul class="month-hours">' + months.map(function (m) {
      var t = monthHours(modelFor(+m.slice(0, 4), +m.slice(5, 7)));
      return '<li><button type="button" class="month-hours-row' + (m === current ? ' is-current' : '') + '" data-hours-month="' + m + '">' +
        '<span>' + (+m.slice(0, 4)) + '년 ' + (+m.slice(5, 7)) + '월</span>' +
        '<b>' + esc(t.count ? flighttime.hours(t.minutes) : '비행 없음') + '</b><small>' + t.count + '편</small></button></li>';
    }).join('') + '</ul></section>';
  }

  function openHours() {
    $('hoursBody').innerHTML = hoursSheetHtml(modelFor(state.year, state.month));
    if (!$('hoursSheet').open) $('hoursSheet').showModal();
  }

  /* ---------------- 달력 ---------------- */

  /** 칸이 좁아 '도쿄(나리타)' 는 '도쿄' 로. 전체 이름은 날짜 판에 나온다. */
  function cellName(text) {
    return String(text || '').replace(/\s*\(.*?\)\s*/g, '');
  }

  function renderMonth() {
    var model = modelFor(state.year, state.month);
    state.model = model;
    $('monthLabel').textContent = state.year + '년 ' + state.month + '월';

    var months = monthsWithData();
    var current = state.year + '-' + pad(state.month);
    $('monthPrev').disabled = !months.length || current <= months[0];
    $('monthNext').disabled = !months.length || current >= months[months.length - 1];

    var today = todayIso();
    var html = '';
    for (var i = 0; i < model.days[0].weekday; i++) html += '<span class="cell is-empty" aria-hidden="true"></span>';

    model.days.forEach(function (day, index) {
      var classes = ['cell', 'k-' + day.kind];
      var band = plan.bandOf(model.days, index);
      if (band) classes.push('band', band);
      if (day.trip != null) classes.push(tripClass(day));
      if (day.weekday === 0) classes.push('is-sun');
      if (day.date === today) classes.push('is-today');
      if (db.edited[day.date]) classes.push('is-edited');
      // 긴 도시 이름은 글자를 줄이고, 그래도 넘치면 두 줄로 흐르게 한다
      if (cellName(day.short).length >= 4) classes.push('is-long');
      if (cellName(day.short).length >= 6) classes.push('is-xlong');
      var holiday = holidayOf(day.date);
      if (holiday) classes.push('is-holiday');
      var label = dateLabel(day.date, true) + (holiday ? ' ' + holiday : '') +
        (day.short ? ', ' + day.short + (day.sub ? ' ' + day.sub : '') : '') +
        (day.airports ? ', ' + day.airports : '');
      html += '<button type="button" class="' + classes.join(' ') + '" data-date="' + day.date + '" aria-label="' + esc(label) + '">' +
        '<span class="num">' + day.day + '</span>' +
        '<span class="word">' + esc(cellName(day.short)) + '</span>' +
        '<span class="ap">' + esc(day.airports) + '</span>' +
        '<span class="sub' + (/\d/.test(day.sub || '') ? ' is-time' : '') + '">' + esc(cellName(day.sub || '')) + '</span>' +
        (holiday ? '<span class="hol">' + esc(holiday) + '</span>' : '') +
        '</button>';
    });
    $('grid').innerHTML = html;

    renderHoursChip(model);

    var sum = plan.summarize(model);
    $('summary').innerHTML = sum.trips || sum.offDays || sum.workDays
      ? '이번 달 출국 <strong>' + sum.trips + '번</strong>, 휴무 <strong>' + sum.offDays + '일</strong>, 근무 <strong>' + sum.workDays + '일</strong>' +
        (sum.cities.length ? '. 가는 곳: ' + esc(sum.cities.map(cellName).join(', ')) : '')
      : '이 달에는 넣은 스케줄이 없어요.';
  }

  /* ---------------- 날짜 판 ---------------- */

  function timelineItem(what, time, note, key) {
    return '<li' + (key ? ' class="is-key"' : '') + '><span class="what">' + esc(what) +
      (note ? '<small>' + esc(note) + '</small>' : '') + '</span><span class="t">' + esc(time) + '</span></li>';
  }

  function bookingButton(appId, primary) {
    var link = bus.booking(appId, platform);
    return '<a class="btn btn-grow' + (primary ? ' btn-primary' : '') + '" href="' + esc(link.href) + '"' +
      (link.external ? ' target="_blank" rel="noopener"' : '') + '>' + ICON.bus + esc(link.label) + ' 열기</a>';
  }

  function alarmButton(rec, ev) {
    if (platform === 'android') {
      var message = ev.code + ' 출발, ' + rec.route + ' ' + rec.stopName + ' ' + bus.clock(rec.board) + ' 탑승';
      return '<a class="btn btn-grow" href="' + esc(bus.androidAlarm(rec.wake, message)) + '">' + ICON.alarm + '알람 맞추기</a>';
    }
    return '<button type="button" class="btn btn-grow" data-alarm="' + esc(ev.date + '|' + ev.code) + '">' + ICON.alarm +
      (platform === 'ios' ? '캘린더 알림 넣기' : '알림 파일 받기') + '</button>';
  }

  function sourceBadge(source) {
    return '<span class="src src-' + esc(source) + '">' + esc(SOURCE_LABEL[source] || source) + '</span>';
  }

  var airportGroups = null;

  /** 대한항공 노선 자료에 나오는 공항을 나라별로. 한국이 맨 위, 나머지는 나라 이름 순. */
  function airportChoices() {
    if (airportGroups) return airportGroups;
    var seed = (routedata.SEED && (routedata.SEED.routes || routedata.SEED)) || {};
    var codes = {};
    Object.keys(seed).forEach(function (key) {
      var route = seed[key];
      if (route && route.from && route.to) {
        codes[route.from] = true;
        codes[route.to] = true;
      }
    });
    var byCountry = {};
    Object.keys(codes).forEach(function (code) {
      var country = airports.countryOf(code) || 'ZZ';
      (byCountry[country] = byCountry[country] || []).push(code);
    });
    function countryLabel(country) {
      return country === 'ZZ' ? '기타' : (airports.countryName(country) || country);
    }
    airportGroups = Object.keys(byCountry).sort(function (a, b) {
      if (a === 'KR') return -1;
      if (b === 'KR') return 1;
      return countryLabel(a).localeCompare(countryLabel(b), 'ko');
    }).map(function (country) {
      return {
        name: countryLabel(country),
        codes: byCountry[country].sort(function (x, y) {
          return cityOf(x).localeCompare(cityOf(y), 'ko') || (x < y ? -1 : 1);
        })
      };
    });
    return airportGroups;
  }

  function airportSelect(id, label, current, data) {
    var groups = airportChoices();
    var known = groups.some(function (g) { return g.codes.indexOf(current) >= 0; });
    var options = (!current ? '<option value="" selected>고르기</option>' : '') +
      (current && !known ? '<option value="' + esc(current) + '" selected>' + esc(cityOf(current) + ' (' + current + ')') + '</option>' : '') +
      groups.map(function (g) {
        return '<optgroup label="' + esc(g.name) + '">' + g.codes.map(function (code) {
          return '<option value="' + code + '"' + (code === current ? ' selected' : '') + '>' + esc(cityOf(code) + ' (' + code + ')') + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
    return '<label class="route-select" for="' + esc(id) + '"><span>' + esc(label) + '</span>' +
      '<select id="' + esc(id) + '" ' + data + '>' + options + '</select></label>';
  }

  function flightBlock(ev) {
    var key = overrideKey(ev);
    var id = ev.date + '-' + ev.code;
    var edited = !!db.overrides[key];
    var fixed = !!db.routeFix[ev.code];
    var which = ev.type === 'in' ? cityOf(ev.to) + ' 도착' : ev.type === 'out' ? cityOf(ev.from) + ' 출발' : '출발';
    return '<div class="flight">' +
      '<div class="flight-row">' +
        '<span class="flight-route">' +
          esc(cityOf(ev.from) || '?') + '<span class="iata">' + esc(ev.from || '') + '</span> → ' +
          esc(cityOf(ev.to) || '?') + '<span class="iata">' + esc(ev.to || '') + '</span>' +
          '<small>' + esc(ev.code) + (fixed ? ', 고친 노선' : '') + blockNote(ev) + '</small>' +
        '</span>' +
        '<span class="flight-time"><label for="time-' + esc(id) + '">' + esc(which) + (edited ? ' (고친 값)' : '') + '</label>' +
          '<input id="time-' + esc(id) + '" type="time" data-override="' + esc(key) + '" value="' + esc(ev.time || '') + '"' + (canEdit() ? '' : ' disabled') + '>' +
          (edited ? '<button type="button" class="reset" data-reset="' + esc(key) + '">시간표 값으로</button>' : '') +
        '</span>' +
      '</div>' + liveLine(ev) +
    '</div>';
  }

  /** 공항에서 받은 오늘 상태 한 줄 */
  function liveLine(ev) {
    var live = db.live && db.live[overrideKey(ev)];
    var on = flightstatus && flightstatus.enabled(config.FLIGHT_STATUS);
    if (!live) {
      return on && ev.date === todayIso() ? '<p class="live is-wait">공항 운항 정보를 확인하는 중입니다.</p>' : '';
    }
    var at = new Date(live.at);
    var moved = live.scheduled && live.time && live.scheduled !== live.time;
    return '<p class="live' + (moved ? ' is-changed' : '') + '"><b>실시간</b>' +
      esc((ev.type === 'in' ? '도착 ' : '출발 ') + live.time + (moved ? ' (예정 ' + live.scheduled + ')' : '') +
        (live.remark ? ', ' + live.remark : '') + (live.gate ? ', 게이트 ' + live.gate : '')) +
      '<small>' + esc(pad(at.getHours()) + ':' + pad(at.getMinutes())) + ' 확인' +
      (db.overrides[overrideKey(ev)] ? ', 손으로 고친 시각이 우선' : '') + '</small></p>';
  }

  /** 예매해 둔 차. 예전 판은 true 만 저장했다. */
  function bookedFor(ev, direction) {
    var value = db.booked[bookingKey(ev, direction)];
    return value && typeof value === 'object' ? value : null;
  }

  /** 예매한 차로 다시 잰 일정. 예매가 없으면 null. */
  function bookedPlan(ev, direction) {
    var booked = bookedFor(ev, direction);
    if (!booked) return null;
    return direction === 'out'
      ? bus.bookedOut(bus.toMin(ev.time), ev.date, departAirport(ev), db.settings, booked)
      : bus.bookedIn(bus.toMin(ev.time), ev.date, arriveAirport(ev), db.settings, booked);
  }

  function sameBus(a, b) {
    return !!(a && b && a.route === b.route && a.stop === b.stop && +a.board === +b.board);
  }

  function bookValue(ev, direction, option) {
    return [bookingKey(ev, direction), option.route, option.stop, option.board, option.placeId].join('~');
  }

  /** 예매에 필요한 것만 모은 카드. 예매한 뒤에도 바꿀 수 있다. */
  /** 버스타고 조회 화면을 구간과 날짜가 채워진 채로 연다. 코드를 모르는 정류장이면 앱이나 첫 화면을 연다. */
  function prefilledBooking(ev, shown, direction, primary) {
    var ap = direction === 'out' ? departAirport(ev) : arriveAirport(ev);
    var href = shown.booking === 'bustago' ? bus.bustagoSearch(shown.stop, ap, direction, ev.date) : null;
    if (!href) return bookingButton(shown.booking, primary);
    return '<a class="btn btn-grow' + (primary ? ' btn-primary' : '') + '" href="' + esc(href) + '" target="_blank" rel="noopener">' +
      ICON.bus + '버스타고에서 예매</a>';
  }

  /** 버스 카드 한 장: 탈 차, 세 가지 시각, 예매 버튼. 나머지는 "자세히"에 접어 둔다. */
  function busCard(ev, rec, shown, mine, direction, steps, lineHtml, moreHtml, lateText) {
    var key = bookingKey(ev, direction);
    var raw = db.booked[key];
    var broken = !!(mine && !mine.fit);
    var chip = raw ? (broken ? '예매한 차가 안 맞아요' : '예매 완료') : '추천';
    var warn = '';
    var editable = canEdit();
    if (!editable) {
      warn = lateText || '';
    } else if (broken) {
      warn = direction === 'out'
        ? '예매한 차는 공항 도착 목표보다 ' + bus.span(-mine.spare) + ' 늦습니다. 버스타고에서 바꾼 뒤 자세히에서 새 차를 골라 주세요.'
        : '예매한 차가 착륙 후 나오는 시각(' + bus.clock(mine.ready) + ')보다 먼저 떠납니다. 버스타고에서 바꾼 뒤 자세히에서 새 차를 골라 주세요.';
    } else if (raw === true) {
      warn = '어느 차를 예매했는지 모릅니다. 자세히에서 골라 주세요.';
    } else if (lateText) {
      warn = lateText;
    }
    var openDay = bus.bookingDay(ev.date, db.settings.bookDaysBefore);
    state.tuneOpen = state.tuneOpen || {};
    return '<div class="bus-card' + (raw ? ' is-booked' : '') + (broken ? ' is-broken' : '') + '">' +
      '<div class="bus-head"><span class="bus-time">' + esc(bus.hhmm(shown.board)) + '</span>' +
        '<span class="bus-line">' + lineHtml + '</span><span class="bus-chip">' + esc(chip) + '</span></div>' +
      (warn ? '<p class="callout">' + esc(warn) + '</p>' : '') +
      '<ul class="bus-steps">' + steps.map(function (step) {
        return '<li><span>' + esc(step[0]) + '</span><b>' + esc(step[1]) + '</b></li>';
      }).join('') + '</ul>' +
      // 예매 전: 버스타고 예매, 예매했어요. 예매 뒤: 다른 시간 차로 바꾸기, 예매 취소.
      // 예매한 차가 안 맞으면 버스타고에서 표를 바꿔야 하니 그때만 버스타고 버튼을 둔다.
      (editable
        ? '<div class="btn-row">' + (raw
          ? (broken
            ? prefilledBooking(ev, shown, direction, true).replace('버스타고에서 예매', '버스타고에서 바꾸기')
            : '<button type="button" class="btn btn-grow" data-open-tune="' + direction + '">다른 시간 차로 바꾸기</button>') +
            '<button type="button" class="btn btn-grow" data-unbook="' + esc(key) + '">예매 취소</button>'
          : prefilledBooking(ev, shown, direction, true) +
            '<button type="button" class="btn btn-grow" data-book="' + esc(bookValue(ev, direction, shown)) + '">예매했어요</button>') +
          '</div>'
        : '') +
      (direction === 'out' ? '<div class="btn-row">' + alarmButton(shown, ev) + '</div>' : '') +
      (raw || !editable ? '' : '<p class="note">' + esc(dateLabel(openDay)) + '부터 예매 알림을 드려요.</p>') +
      '<details class="bus-more" data-tune="' + direction + '"' + (state.tuneOpen[direction] ? ' open' : '') + '>' +
        '<summary>자세히: 다른 시간 차, 시간 고치기</summary>' + moreHtml + '</details>' +
    '</div>';
  }

  /** 다른 시간 차. 접혀 있고, 다른 차를 예매했으면 여기서 고른다. */
  function choicesList(rec, ev, direction) {
    var mine = bookedFor(ev, direction);
    return '<h4 class="choices-title">다른 시간 차</h4><ul class="choices">' + rec.choices.map(function (c) {
      var isMine = sameBus(mine, c);
      var what = direction === 'out'
        ? c.stopName + ' → ' + airportShort(rec.airport) + ' ' + bus.hhmm(c.arrive)
        : airportShort(rec.airport) + ' → ' + c.stopName + ' ' + bus.hhmm(c.reachStop);
      var tag = direction === 'out'
        ? (c.fit ? '여유 ' + bus.span(c.spare) : bus.span(-c.spare) + ' 늦음')
        : (c.wait > 0 ? bus.span(c.wait) + ' 기다림' : '바로 탑승');
      return '<li class="' + (c.pick ? 'is-pick' : '') + (direction === 'out' && !c.fit ? ' is-late' : '') + (isMine ? ' is-mine' : '') + '">' +
        '<span class="t">' + esc(bus.hhmm(c.board)) + '</span>' +
        '<span class="what"><b>' + esc(c.route) + '</b> ' + esc(what) + placeTag(c) + '</span>' +
        '<span class="tag">' + (isMine ? '<b>예매 완료</b> ' : (c.pick ? '<b>추천</b> ' : '')) + esc(tag + ', ' + bus.span(c.travel)) + ' ' + sourceBadge(c.source) + '</span>' +
        (isMine || !canEdit() ? '' : '<button type="button" class="choice-book" data-book="' + esc(bookValue(ev, direction, c)) + '">이 차로 예매했어요</button>') +
        '</li>';
    }).join('') + '</ul>';
  }

  function outBlock(ev) {
    var rec = outRec(ev);
    var ap = departAirport(ev);
    var html = '<section class="block"><h3 class="block-title">' + esc(airportShort(ap)) + ' 가는 버스</h3>';
    if (rec.status === 'no-time') {
      return html + '<p class="callout is-calm">위에 출발 시각을 넣으면 탈 버스를 골라 드려요.</p></section>';
    }
    if (rec.status === 'no-places') {
      return html + '<p class="callout is-calm">추천에 쓰는 출발지가 없습니다. 설정에서 출발지를 켜거나 추가해 주세요.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-grow" data-go="settings">설정 열기</button></div></section>';
    }
    if (rec.status === 'no-timetable') {
      return html + '<p class="callout is-calm">출발지에서 ' + esc(airportFull(ap)) + ' 가는 버스 시각이 없습니다.' +
        (rec.missing && rec.missing.length ? ' ' + esc(rec.missing.map(function (m) { return m.route; }).join(', ')) + ' 시각을 설정에서 넣어 주세요.' : '') + '</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-grow" data-go="settings">설정 열기</button></div></section>';
    }
    var mine = bookedPlan(ev, 'out');
    var plan = mine || rec;
    var more = '<p class="reason"><b>' + (mine ? '예매한 차 기준' : '이 차를 고른 이유') + '</b>' + esc(mine
        ? mine.route + ' ' + mine.stopName + ' ' + bus.hhmm(mine.board) + ' 출발, ' + bus.span(mine.travel) + ' 걸려 ' + bus.clock(mine.arrive) +
          ' 도착 예상 (' + mine.basis + '), ' + (mine.fit ? '여유 ' + bus.span(mine.spare) : '목표보다 ' + bus.span(-mine.spare) + ' 늦음') + '.'
        : rec.reason) + '</p>' +
      '<p class="note">출발지 순서: ' + esc(areaName()) + '</p>' +
      choicesList(rec, ev, 'out') +
      tuneBlock('out', plan, ap, ev);
    var route = bus.routeById(plan.route);
    if (route && !route.verified && route.note) more += '<p class="note is-warn">' + esc(route.note) + '</p>';
    if (platform === 'android') {
      more += '<p class="note">알람 앱은 날짜를 받지 못해서, 가장 가까운 그 시각으로 맞춰집니다. 전날 밤에 눌러 주세요.</p>';
    } else if (platform === 'ios') {
      more += '<p class="note">아이폰은 웹에서 알람 앱을 열 수 없어 캘린더 알림으로 넣습니다.</p>';
    }
    html += busCard(ev, rec, plan, mine, 'out',
      [['일어나기', bus.clock(plan.wake)], ['집에서 나가기', bus.clock(plan.leaveHome)], [airportShort(ap) + ' 도착', bus.clock(plan.arrive)]],
      esc(plan.stopName) + '에서 <b>' + esc(plan.route) + '</b> 타기', more,
      rec.status === 'late' ? '가장 이른 차도 목표보다 늦습니다. 택시나 자가용을 생각해 보세요.' : '');
    return html + '</section>';
  }

  function inBlock(ev) {
    var rec = inRec(ev);
    var ap = arriveAirport(ev);
    var html = '<section class="block"><h3 class="block-title">' + esc(airportShort(ap)) + '에서 집에 오는 버스</h3>';
    if (rec.status === 'no-time') {
      return html + '<p class="callout is-calm">위에 도착 시각을 넣으면 탈 버스를 골라 드려요.</p></section>';
    }
    if (rec.status === 'no-places') {
      return html + '<p class="callout is-calm">추천에 쓰는 출발지가 없습니다. 설정에서 출발지를 켜거나 추가해 주세요.</p></section>';
    }
    if (rec.status === 'no-timetable') {
      return html + '<p class="callout is-calm">' + esc(airportFull(ap)) + '에서 출발지로 오는 버스 시각표가 아직 없습니다.' +
        (rec.ranges && rec.ranges.length ? ' 운행 시간: ' + esc(rec.ranges.join(', ')) + '.' : '') + '</p>' +
        '<div class="btn-row">' + bookingButton('bustago') + '</div></section>';
    }
    var mine = bookedPlan(ev, 'in');
    if (rec.status === 'missed' && !mine) {
      return html + '<p class="callout">착륙 후 ' + esc(bus.span(+db.settings.afterLanding)) + '을 더하면 ' +
        esc(bus.clock(rec.ready)) + '인데, 막차는 ' + esc(bus.clock(rec.last)) + '입니다. 택시나 마중을 알아봐 주세요.</p></section>';
    }
    var plan = mine || rec;
    var more = '<p class="reason"><b>' + (mine ? '예매한 차 기준' : '이 차를 고른 이유') + '</b>' + esc(mine
        ? mine.route + ' ' + bus.hhmm(mine.board) + ' 출발, ' + bus.span(mine.travel) + ' 걸려 ' + mine.stopName + ' ' + bus.clock(mine.reachStop) + ' 도착 예상 (' + mine.basis + ').'
        : rec.reason) + '</p>' +
      '<p class="note">출발지 순서: ' + esc(areaName()) + '</p>' +
      (rec.choices ? choicesList(rec, ev, 'in') : '') +
      tuneBlock('in', plan, ap, ev);
    var route = bus.routeById(plan.route);
    if (route && !route.verified && route.note) more += '<p class="note is-warn">' + esc(route.note) + '</p>';
    var waitText = plan.wait > 0 ? '나와서 ' + bus.span(plan.wait) + ' 기다림' : plan.wait < 0 ? '나오기 전에 떠남' : '나오자마자 탐';
    html += busCard(ev, rec, rec.board != null ? rec : plan, mine, 'in',
      [[cityOf(ev.to) + ' 도착', bus.clock(rec.arrive)], [plan.stopName + ' 도착', bus.clock(plan.reachStop)], ['집 도착', bus.clock(plan.home)]],
      esc(airportShort(ap)) + '에서 <b>' + esc(plan.route) + '</b> 타기<small>' + esc(waitText) + '</small>', more, '');
    return html + '</section>';
  }

  /* ---------------- 그 자리에서 시간 고치기 ---------------- */

  function tuneField(id, label, value, data) {
    return '<label class="tune-field" for="' + id + '"><span>' + esc(label) + '</span>' +
      '<span class="num-input"><input id="' + id + '" ' + data + ' type="number" inputmode="numeric" min="0" max="300" step="5" value="' +
      esc(value == null ? '' : value) + '">분</span></label>';
  }

  /** 버스 안내 바로 아래에서 계산에 쓰인 시간을 고친다. 설정에도 그대로 저장된다. */
  function tuneBlock(direction, rec, ap, ev) {
    var s = db.settings;
    var id = direction + '-' + ev.date + '-' + ev.code;
    var key = bus.travelKey(direction, rec.stop, ap);
    var own = (direction === 'out' ? s.busToAirport : s.busFromAirport)[key];
    var travel = tuneField('tune-travel-' + id, '버스 타는 시간 (비우면 자동 ' + rec.travel + '분)', own,
      (direction === 'out' ? 'data-travel-out="' : 'data-travel-in="') + esc(key) + '" placeholder="자동"');
    var fields = direction === 'out'
      ? tuneField('tune-prep-' + id, '준비 시간', s.prep, 'data-setting="prep"') +
        tuneField('tune-walk-' + id, rec.stopName + '까지', rec.walk, 'data-place-walk="' + esc(rec.placeId + '|' + rec.stop) + '"') +
        tuneField('tune-early-' + id, '정류장 여유', s.early, 'data-setting="early"') +
        tuneField('tune-before-' + id, airportShort(ap) + ' 출발 몇 분 전 도착', ap === 'GMP' ? s.arriveBeforeGmp : s.arriveBefore,
          'data-setting="' + (ap === 'GMP' ? 'arriveBeforeGmp' : 'arriveBefore') + '"') +
        travel
      : tuneField('tune-land-' + id, '착륙 후 나오기', s.afterLanding, 'data-setting="afterLanding"') +
        travel +
        tuneField('tune-walk-' + id, rec.stopName + '에서 집까지', rec.walk, 'data-place-walk="' + esc(rec.placeId + '|' + rec.stop) + '"');
    return '<h4 class="choices-title">시간 고치기</h4><div class="tune-body">' + fields +
      '<p class="note">여기서 고친 값은 설정에도 저장되어 모든 날짜에 적용됩니다.</p></div>';
  }

  /* ---------------- 앱으로 설치 ---------------- */

  var installPrompt = null;

  function isStandalone() {
    return nativeApp() || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    renderInstall();
  });

  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    db.installDismissed = true;
    save();
    renderInstall();
    toast('앱으로 설치했습니다. 홈 화면에서 열어 주세요.');
  });

  function installGuide() {
    if (isStandalone()) return '<p class="note">지금 앱으로 열려 있습니다.</p>';
    if (installPrompt) {
      return '<div class="btn-row"><button type="button" class="btn btn-primary btn-grow" data-install>' + ICON.install + '앱으로 설치</button></div>';
    }
    if (platform === 'ios') {
      var safari = !/CriOS|FxiOS|EdgiOS|KAKAOTALK|NAVER/i.test(navigator.userAgent);
      return (safari ? '' : '<p class="note is-warn">아이폰은 사파리에서만 설치할 수 있어요. 이 주소를 사파리로 열어 주세요.</p>') +
        '<ol class="install-steps">' +
        '<li>사파리 아래쪽 <b>공유 버튼</b>(네모 위로 화살표)을 누릅니다.</li>' +
        '<li>목록을 올려 <b>홈 화면에 추가</b>를 누릅니다.</li>' +
        '<li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 아이콘이 생깁니다.</li></ol>';
    }
    if (platform === 'android') {
      return '<ol class="install-steps">' +
        '<li>크롬 오른쪽 위 <b>⋮ 메뉴</b>를 누릅니다.</li>' +
        '<li><b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누릅니다.</li></ol>' +
        (location.protocol === 'https:' ? '' : '<p class="note">https 주소에서 열어야 앱으로 설치됩니다.</p>');
    }
    return '<p class="note">폰에서 이 주소를 열어 설치해 주세요. PC 크롬이나 엣지에서는 주소창 오른쪽 설치 아이콘으로 설치할 수 있습니다.</p>';
  }

  function renderInstall() {
    var card = $('installCard');
    var show = !isStandalone() && !db.installDismissed && (platform !== 'web' || !!installPrompt);
    card.hidden = !show;
    card.innerHTML = show
      ? '<div class="install-head"><img src="icons/icon-192.png" alt="" width="44" height="44">' +
        '<div><p class="install-title">앱으로 설치하기</p><p class="note">홈 화면에서 바로 열리고, 인터넷이 없어도 달력을 볼 수 있어요.</p></div>' +
        '<button type="button" class="icon-btn" data-install-dismiss aria-label="설치 안내 닫기">' + ICON.trash + '</button></div>' +
        installGuide()
      : '';
    if ($('installSettings')) $('installSettings').innerHTML = installGuide();
  }

  function categoryOf(code) {
    var list = rawEntries();
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i].category;
    return 'unknown';
  }

  /** 코드 뜻 한 줄: 코드, 달력에 보일 말, 종류 */
  function codeRow(code, prefix) {
    var word = plan.wordFor(code, categoryOf(code), db.words);
    var id = prefix + '-' + code;
    var known = plan.CATEGORIES.some(function (c) { return c.value === word.category; });
    var options = (known ? '' : '<option value="" selected>모름</option>') +
      plan.CATEGORIES.map(function (c) {
        return '<option value="' + c.value + '"' + (c.value === word.category ? ' selected' : '') + '>' + c.label + '</option>';
      }).join('');
    return '<div class="code-row">' +
      '<span class="code-chip' + (isNewCode(code, word) ? ' is-new' : '') + '">' + esc(code) + '</span>' +
      '<label class="visually-hidden" for="word-' + esc(id) + '">' + esc(code) + ' 달력에 보일 말</label>' +
      '<input id="word-' + esc(id) + '" type="text" data-word="' + esc(code) + '" maxlength="4" value="' + esc(word.short) + '" autocomplete="off">' +
      '<label class="visually-hidden" for="cat-' + esc(id) + '">' + esc(code) + ' 종류</label>' +
      '<select id="cat-' + esc(id) + '" data-cat="' + esc(code) + '">' + options + '</select>' +
      '<span class="code-actions">' +
        (word.custom && !isNewCode(code, word) ? '<button type="button" class="reset" data-word-reset="' + esc(code) + '">되돌리기</button>' : '') +
        (db.confirmed[code] ? '' : '<button type="button" class="btn btn-small" data-word-ok="' + esc(code) + '">맞음</button>') +
      '</span>' +
      '</div>';
  }

  /** 기본 뜻이 없는 코드. 앱이 모르는 코드라 사람이 뜻을 정해야 한다. */
  function isNewCode(code, word) {
    return !plan.knownCode(code) && (word.category === 'unknown' || !!(db.words[code] && db.words[code].added));
  }

  var SOURCE_TEXT = { added: '직접 추가', custom: '직접 고침', 'default': '앱 기본 뜻', dict: '근무 코드 사전', category: '스케줄 분류로 추정', unknown: '뜻 모름' };

  function categoryLabel(value) {
    var hit = plan.CATEGORIES.filter(function (c) { return c.value === value; })[0];
    return hit ? hit.label : '모름';
  }

  /** 그 코드가 스케줄에 나온 날 수 */
  function codeDays(code) {
    var days = {};
    rawEntries().forEach(function (entry) { if (entry.code === code) days[entry.date] = true; });
    return Object.keys(days).length;
  }

  /** 코드 관리 표 한 줄: 코드, 달력에 보일 말과 뜻, 종류, 뜻 출처, 확정 여부 */
  function codeLine(code, inSchedule) {
    var word = plan.wordFor(code, categoryOf(code), db.words);
    var source = plan.wordSource(code, categoryOf(code), db.words);
    var days = inSchedule ? codeDays(code) : 0;
    var kind = categoryLabel(word.category);
    var state = !inSchedule || !canEdit() ? '' : db.confirmed[code]
      ? '<span class="code-pill is-ok">확정</span>'
      : '<span class="code-pill is-wait">확인 필요</span>';
    return '<div class="code-line">' +
      '<span class="code-chip">' + esc(code) + '</span>' +
      '<span class="code-what"><b>' + esc(word.short) + (kind === word.short ? '' : ', ' + esc(kind)) + '</b><small>' + esc(word.long) + '</small></span>' +
      '<span class="code-state">' + state + '<span>' + esc(SOURCE_TEXT[source]) + (days ? ', ' + days + '일' : '') + '</span></span>' +
      '</div>';
  }

  /** 스케줄에 나온 근무 코드와 손으로 추가한 코드 */
  function allCodes() {
    var codes = [];
    rawEntries().forEach(function (entry) {
      if (entry.type !== 'flight' && entry.category !== 'layover' && codes.indexOf(entry.code) < 0) codes.push(entry.code);
    });
    Object.keys(db.words).forEach(function (code) { if (codes.indexOf(code) < 0) codes.push(code); });
    return codes.sort();
  }

  function waitingCodes() {
    return allCodes().filter(function (code) { return !db.confirmed[code]; });
  }

  function meaningOf(entry) {
    if (entry.type === 'flight') {
      return entry.from && entry.to ? entry.from + '→' + entry.to : '노선 모름';
    }
    if (entry.category === 'layover') return '체류';
    return plan.wordFor(entry.code, entry.category, db.words).short;
  }

  /** 편명 줄 아래 출발, 도착 공항. 같은 편명이 들어간 모든 날짜에 바로 반영된다. */
  function routeEdit(entry, id) {
    return '<div class="route-edit-body edit-route">' +
      airportSelect(id + '-from', '출발 공항', entry.from, 'data-route-from="' + esc(entry.code) + '"') +
      airportSelect(id + '-to', '도착 공항', entry.to, 'data-route-to="' + esc(entry.code) + '"') +
      (db.routeFix[entry.code] ? '<button type="button" class="reset" data-route-reset="' + esc(entry.code) + '">원래 노선으로</button>' : '') +
      '</div>';
  }

  /* ---------------- 공유 링크 ---------------- */


  /** 링크가 가리킬 앱 주소. 공개 https 주소에서 만들면 그 주소, 앱이나 사내 주소면 설정의 공개 주소. */
  function shareBaseUrl() {
    if (!nativeApp() && location.protocol === 'https:') return location.origin + location.pathname;
    return (config.SHARE && config.SHARE.baseUrl) || (location.origin + location.pathname);
  }

  /* ---------------- 가족 링크 (늘 최신) ---------------- */

  var familyTimer = null;
  var familyBusy = false;
  var GROUP_KEY = 'crew-family.group';
  var MANAGER_KEY = 'crew-family.manager';

  /** 받은 가족 링크: { salt, check, people: [{ name, id, key }] } */
  function groupInfo() {
    try { return JSON.parse(localStorage.getItem(GROUP_KEY) || 'null'); } catch (e) { return null; }
  }

  /** 관리자: 비밀번호로 만든 사람마다 쓰기 열쇠. 한 번 켜면 이 폰에 남는다. */
  function managerInfo() {
    try { return JSON.parse(localStorage.getItem(MANAGER_KEY) || 'null'); } catch (e) { return null; }
  }

  function isManager() {
    var m = managerInfo();
    return !!(m && m.tokens);
  }

  /** 가족 링크로 받는 사람을 이 폰에서 올릴 수 있으면 { id, key, token } */
  function writeLinkFor(person) {
    if (!person || !person.follow) return null;
    var m = managerInfo();
    var token = m && m.tokens && m.tokens[person.follow.id];
    return token ? { id: person.follow.id, key: person.follow.key, token: token } : null;
  }

  /** 받기만 하는 폰은 스케줄을 고치지 못한다. 관리자 폰과 자기 스케줄은 고친다. */
  function canEdit() {
    var me = currentPerson();
    return !(me && me.follow) || !!writeLinkFor(me);
  }

  function unionIds(a, b) {
    var out = (a || []).slice();
    (b || []).forEach(function (id) { if (id && out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  /** 이 폰에 넣은 스케줄이 있는 사람인지 */
  function hasSchedule(p) {
    if (p.id === people.current && db) return !!(db.entries && db.entries.length);
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(keyFor(p.id)) || '{}') || {}; } catch (e) { stored = {}; }
    return !!(stored.entries && stored.entries.length);
  }

  /** 사람을 이 폰 목록에서 뺀다. 보고 있던 사람이면 다른 사람으로, 아무도 없으면 빈 '나' 하나. */
  function removePeople(personIds) {
    if (!personIds.length) return false;
    personIds.forEach(function (pid) {
      try { localStorage.removeItem(keyFor(pid)); } catch (e) { /* 지우지 못해도 목록에서는 뺀다 */ }
    });
    people.list = people.list.filter(function (p) { return personIds.indexOf(p.id) < 0; });
    if (!people.list.length) people.list = [{ id: 'u' + Date.now().toString(36), name: '나' }];
    if (!people.list.some(function (p) { return p.id === people.current; })) {
      var next = people.list.filter(function (p) { return p.follow; })[0] || people.list[0];
      people.current = next.id;
      NAME = next.name;
      KEY = keyFor(next.id);
      initDb();
      pickMonth();
    }
    savePeople();
    renderTitle();
    render();
    if ($('peopleSheet').open) renderPeople();
    return true;
  }

  function saveGroup(group) {
    try { localStorage.setItem(GROUP_KEY, JSON.stringify(group)); return true; } catch (e) { return false; }
  }

  /** 가족 명단의 사람을 이 폰 사람 목록에 넣는다. 새로 들어온 사람 이름을 돌려준다. */
  function adoptMembers(group) {
    var added = [];
    var skip = unionIds(group.hidden, group.removed);
    group.people.forEach(function (member, index) {
      if (skip.indexOf(member.id) >= 0) return;
      if (people.list.some(function (p) { return p.follow && p.follow.id === member.id; })) return;
      var person = people.list.filter(function (p) { return p.name === member.name && !p.follow; })[0];
      if (!person) {
        person = { id: 'u' + Date.now().toString(36) + index, name: member.name };
        people.list.push(person);
        added.push(member.name);
      }
      person.follow = { id: member.id, key: member.key, at: null, error: '' };
    });
    savePeople();
    return added;
  }

  /** 관리자 폰: 비밀번호로 명단 칸과 사람마다 쓰기 열쇠를 채운다. */
  function ensureTokens() {
    var m = managerInfo();
    var group = groupInfo();
    if (!m || !m.pin || !group) return Promise.resolve(m);
    return sync.dirFor(group).then(function (dir) {
      var ids = group.people.map(function (p) { return p.id; }).concat([dir.id]);
      var missing = ids.filter(function (id) { return !m.tokens[id]; });
      return Promise.all(missing.map(function (id) {
        return sync.writeToken(id, m.pin).then(function (token) { m.tokens[id] = token; });
      })).then(function () {
        if (missing.length) localStorage.setItem(MANAGER_KEY, JSON.stringify(m));
        return m;
      });
    });
  }

  /**
   * 가족 명단: 모든 폰이 받아 새 사람을 넣고 관리자가 지운 사람은 뺀다.
   * 관리자 폰은 서버 명단과 다르면(이 폰에서 더하거나 지웠으면) 합친 명단을 올린다.
   */
  function syncDirectory() {
    var group = groupInfo();
    if (!group || !familyOn()) return Promise.resolve();
    return sync.dirFor(group).then(function (dir) {
      return familyApi().get(dir.id).then(function (row) {
        return row ? sync.open(row.cipher, dir.key) : null;
      }).then(function (theirs) {
        theirs = theirs || {};
        var theirPeople = theirs.people || [];
        var removed = unionIds(group.removed, theirs.removed);
        var merged = sync.mergePeople(group.people, theirPeople, removed);
        var changed = merged.length !== group.people.length || removed.length !== (group.removed || []).length;
        group.people = merged;
        group.removed = removed;
        if (changed) saveGroup(group);
        var goneIds = people.list.filter(function (p) { return p.follow && removed.indexOf(p.follow.id) >= 0; }).map(function (p) { return p.id; });
        var gone = removePeople(goneIds);
        var added = adoptMembers(group);
        if (added.length) {
          toast('가족 링크에 새 사람이 들어왔습니다: ' + added.join(', '));
          var me = currentPerson();
          if (!(me && me.follow)) {
            var firstMember = people.list.filter(function (p) { return p.follow; })[0];
            if (firstMember) switchPerson(firstMember.id, '가족 링크에 새 사람이 들어왔습니다: ' + added.join(', '));
          }
          dropEmptyLocals();
        }
        if (added.length || gone) {
          render();
          if ($('peopleSheet').open) renderPeople();
        }
        if (!isManager()) return null;
        var sameIds = function (a, b) {
          var x = (a || []).map(function (p) { return p.id || p; }).sort().join(',');
          var y = (b || []).map(function (p) { return p.id || p; }).sort().join(',');
          return x === y;
        };
        var serverSame = sameIds(theirPeople, merged) && sameIds(theirs.removed, removed);
        return ensureTokens().then(function (m) {
          if (serverSame) return null;
          var token = m && m.tokens[dir.id];
          if (!token) return null;
          return sync.seal({ app: 'crew-family-dir', v: 1, people: merged, removed: removed }, dir.key)
            .then(function (cipher) { return familyApi().put(dir.id, cipher, token); });
        });
      });
    });
  }

  /** 복사해 온 가족 링크(#g=) 글자를 연다 */
  function openLinkText(text) {
    var group = sync && sync.fromGroupHash(text);
    if (!group) return toast('가족 링크가 아닙니다. 링크 전체를 복사해 주세요.');
    return joinGroup(group);
  }

  /**
   * 가족 링크를 넣거나 바꾼 뒤: 가족 명단에 없고 스케줄도 없는 이 폰의 사람을 모두 뺀다.
   * 아직 아무도 추가하지 않은 가족이면 백지로 두고, 화면이 돌도록 빈 '나' 하나만 남긴다.
   */
  function dropEmptyLocals() {
    function filled(p) {
      if (p.id === people.current && db) return !!(db.entries && db.entries.length);
      var stored = {};
      try { stored = JSON.parse(localStorage.getItem(keyFor(p.id)) || '{}') || {}; } catch (e) { stored = {}; }
      return !!(stored.entries && stored.entries.length);
    }
    var keep = people.list.filter(function (p) { return p.follow || p.name === TEST_NAME || filled(p); });
    if (keep.length === people.list.length) return;
    if (!keep.length) keep = [{ id: 'u' + Date.now().toString(36), name: '나' }];
    people.list = keep;
    if (!keep.some(function (p) { return p.id === people.current; })) {
      var next = keep.filter(function (p) { return p.follow; })[0] || keep[0];
      people.current = next.id;
      NAME = next.name;
      KEY = keyFor(next.id);
      initDb();
      pickMonth();
    }
    savePeople();
    renderTitle();
    render();
    if ($('peopleSheet').open) renderPeople();
  }

  function joinGroup(group) {
    var old = groupInfo();
    if (old && old.salt === group.salt) {
      group.removed = old.removed || [];
      group.hidden = old.hidden || [];
      group.people = sync.mergePeople(old.people, group.people, group.removed);
    } else if (old) {
      // 다른 가족 링크: 옛 가족의 받기와 관리자 열쇠가 섞이지 않게 푼다. 받아 둔 스케줄은 이 폰에 남는다.
      people.list.forEach(function (p) { delete p.follow; });
      savePeople();
      localStorage.removeItem(MANAGER_KEY);
    }
    if (!saveGroup(group)) return toast('이 폰에 저장하지 못했습니다.');
    if (group.people.length) adoptMembers(group);
    if (window.history && history.replaceState && location.hash) history.replaceState(null, '', location.pathname + location.search);
    if ($('shareSheet') && $('shareSheet').open) $('shareSheet').close();
    toast('가족 링크를 넣었습니다. 가족 명단을 받는 중입니다.');
    return pullFamilies(false).then(function () {
      var me = currentPerson();
      var first = people.list.filter(function (p) { return p.follow; })[0];
      if (!(me && me.follow) && first) switchPerson(first.id, '가족 링크를 넣었습니다. ' + first.name + ' 스케줄을 봅니다.');
      dropEmptyLocals();
      render();
      if (!first) toast('가족 링크를 넣었습니다. 아직 명단이 없습니다. 관리자가 제목을 눌러 사람을 추가하면 들어옵니다.');
    });
  }

  function familyOn() {
    return !!(sync && config.SYNC && sync.enabled(config.SYNC) && sync.available());
  }

  function familyApi() { return sync.client(config.SYNC); }

  function clockText(iso) {
    if (!iso) return '아직 없음';
    var d = new Date(iso);
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function familyPayload() {
    return { app: 'crew-family-sync', v: 1, name: NAME, entries: db.entries, words: db.words, routeFix: db.routeFix, overrides: db.overrides, booked: db.booked || {}, blockFix: db.blockFix || {} };
  }

  /** 관리자 폰에서 가족 링크 사람의 스케줄을 넣거나 고치면 3초 뒤 잠가서 올린다. */
  function scheduleFamilyUpload() {
    if (!db || !familyOn() || NAME === TEST_NAME) return;
    var me = currentPerson();
    if (!writeLinkFor(me)) return;
    me.follow.dirty = true;
    savePeople();
    var personId = people.current;
    clearTimeout(familyTimer);
    familyTimer = setTimeout(function () { uploadFamily(false, personId); }, 3000);
  }

  function saveQuiet() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* 다음 저장 때 다시 */ }
  }

  function uploadFamily(manual, personId) {
    if (!familyOn()) return Promise.resolve();
    // 3초 사이 다른 사람으로 바꿨으면 올리지 않는다. 그 사람을 다시 볼 때 올린다.
    if (personId && personId !== people.current) return Promise.resolve();
    var me = currentPerson();
    var link = writeLinkFor(me);
    if (!link) {
      if (manual) toast('이 폰은 관리자가 아니라 올릴 수 없습니다.');
      return Promise.resolve();
    }
    if (familyBusy) return Promise.resolve();
    familyBusy = true;
    return sync.seal(familyPayload(), link.key)
      .then(function (cipher) { return familyApi().put(link.id, cipher, link.token); })
      .then(function (serverTime) {
        me.follow.sentAt = typeof serverTime === 'string' ? serverTime : new Date().toISOString();
        me.follow.at = me.follow.sentAt;
        me.follow.error = '';
        me.follow.dirty = false;
        savePeople();
        if (manual) toast('가족에게 최신 스케줄을 올렸습니다.');
      }, function (err) {
        me.follow.error = err.message;
        savePeople();
        if (manual) toast(err.message);
      })
      .then(function () {
        familyBusy = false;
        if (state.view === 'settings') renderFamilyBox();
      });
  }

  /** 받는 사람들의 최신 스케줄을 받아 그 사람 자리에 넣는다. */
  function pullFamilies(manual) {
    if (!familyOn()) return pullPeople(manual);
    return syncDirectory().catch(function () { /* 명단을 못 받아도 스케줄은 받는다 */ }).then(function () { return pullPeople(manual); });
  }

  function pullPeople(manual) {
    if (!familyOn()) {
      if (manual) toast('가족 링크 저장소가 연결되지 않았습니다.');
      return Promise.resolve();
    }
    var followers = people.list.filter(function (p) { return p.follow; });
    return Promise.all(followers.map(function (person) {
      var mine = person.id === people.current;
      if (person.follow.dirty) {
        if (mine) uploadFamily(false, person.id);
        return Promise.resolve(false);
      }
      var local = mine ? db : {};
      if (!mine) {
        try { local = JSON.parse(localStorage.getItem(keyFor(person.id)) || '{}') || {}; } catch (e) { local = {}; }
      }
      var hasLocal = !!(local.entries && local.entries.length);
      return familyApi().get(person.follow.id).then(function (row) {
        if (!row) {
          // 아직 아무도 안 올렸다: 관리자 폰에 스케줄이 있으면 올리고, 아니면 기다린다
          if (mine && hasLocal && writeLinkFor(person)) { person.follow.dirty = true; uploadFamily(false, person.id); return null; }
          throw new Error(person.name + ' 스케줄이 아직 올라오지 않았습니다.');
        }
        return sync.open(row.cipher, person.follow.key);
      }).then(function (payload) {
        if (!payload) return false;
        payload = cleanFamily(payload);
        if (!payload.entries.length && hasLocal) return false;
        var target = local;
        target.entries = payload.entries;
        target.words = payload.words || {};
        target.routeFix = payload.routeFix || {};
        target.overrides = payload.overrides || {};
        target.blockFix = payload.blockFix || {};
        target.booked = plan.keepBookings(Object.assign({}, target.booked || {}, payload.booked || {}), payload.entries);
        if (mine) saveQuiet(); else localStorage.setItem(keyFor(person.id), JSON.stringify(target));
        person.follow.at = new Date().toISOString();
        person.follow.error = '';
        return mine;
      }).catch(function (err) {
        person.follow.error = err.message;
        if (manual) toast(err.message);
        return false;
      });
    })).then(function (results) {
      savePeople();
      if (results.some(Boolean)) render();
      else if (state.view === 'settings') renderFamilyBox();
      if (manual && followers.length && !followers.some(function (p) { return p.follow.error; })) toast('Sync 했습니다. 가족 스케줄이 최신입니다.');
    });
  }

  function cleanFamily(payload) {
    if (!payload || payload.app !== 'crew-family-sync' || !Array.isArray(payload.entries)) throw new Error('이 앱의 가족 링크가 아닙니다.');
    payload.entries = payload.entries.filter(function (entry) {
      return entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && /^[A-Z0-9]{1,8}$/.test(String(entry.code || ''));
    }).slice(0, 5000);
    return payload;
  }

  /** 링크 한 줄: 링크 글자와 보내기, 복사 버튼 */
  function linkRow(label, url, kind, note) {
    return '<div class="link-row"><p class="link-label">' + esc(label) + '</p>' +
      '<p class="share-link">' + esc(url) + '</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-grow' + (kind === 'view' ? ' btn-primary' : '') + '" data-family-send="' + kind + '">보내기</button>' +
        '<button type="button" class="btn btn-grow" data-family-copy="' + kind + '">복사</button>' +
        (kind === 'group' ? '<button type="button" class="btn btn-grow" data-family-qr>QR</button>' : '') + '</div>' +
      (note ? '<p class="note">' + note + '</p>' : '') + '</div>';
  }

  /** 가족 링크 주소. 관리자가 가족에게 보낸다. */
  function familyUrl() {
    var g = groupInfo();
    return g ? sync.groupLinkFor(shareBaseUrl(), g) : null;
  }

  /* ---------------- 가족 링크 QR ---------------- */

  var vendorLoads = {};

  /** QR 라이브러리는 누를 때만 받는다 */
  function loadVendor(src) {
    if (!vendorLoads[src]) {
      vendorLoads[src] = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = function () { delete vendorLoads[src]; reject(new Error('QR 도구를 받지 못했습니다. 인터넷 연결을 확인해 주세요.')); };
        document.head.appendChild(script);
      });
    }
    return vendorLoads[src];
  }

  function familyQr() {
    return loadVendor('vendor/qr/qrcode.js').then(function () {
      var qr = window.qrcode(0, 'M');
      qr.addData(familyUrl());
      qr.make();
      return qr;
    });
  }

  /** 흰 바탕 PNG. 카톡으로 보내고 받은 폰에서 캡처를 골라도 읽힐 만큼 크게. */
  function qrCanvas(qr) {
    var cell = 12, margin = 4, count = qr.getModuleCount();
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = (count + margin * 2) * cell;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
    return canvas;
  }

  function showFamilyQr() {
    if (!familyUrl()) return toast('보낼 가족 링크가 없습니다.');
    familyQr().then(function (qr) {
      $('shareBody').innerHTML = '<header class="sheet-head"><p class="eyebrow">가족 링크</p>' +
        '<h2 id="shareTitle" class="display">QR로 넣기</h2>' +
        '<p class="lede">가족 폰의 이 앱에서 설정, 가족 링크, <b>QR 사진으로 넣기</b>를 누르고 이 QR을 찍은 사진이나 받은 QR 이미지를 고르면 들어갑니다.</p></header>' +
        '<div class="family-qr"><img id="familyQrImage" alt="가족 링크 QR" src="' + qrCanvas(qr).toDataURL('image/png') + '"></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary btn-grow" data-family-qr-save>QR 이미지 보내기</button></div>' +
        '<p class="note">휴대폰 기본 카메라로 찍으면 앱이 아니라 브라우저가 열립니다. 꼭 앱 안의 QR 사진으로 넣기를 써 주세요. QR을 가진 사람은 가족 스케줄을 볼 수 있으니 가족에게만 보내 주세요.</p>';
      if (!$('shareSheet').open) $('shareSheet').showModal();
    }, function (err) { toast(err.message); });
  }

  function saveFamilyQr() {
    familyQr().then(function (qr) {
      qrCanvas(qr).toBlob(function (blob) {
        if (!blob) return toast('QR 이미지를 만들지 못했습니다.');
        saveFile('가족링크-QR.png', blob);
      }, 'image/png');
    }, function (err) { toast(err.message); });
  }

  /** 사진이나 캡처에서 QR을 찾아 가족 링크로 넣는다. 큰 사진은 줄여서, 못 찾으면 한 번 더 작게. */
  function readQrPhoto(file) {
    if (!file) return;
    toast('QR을 읽는 중입니다.');
    loadVendor('vendor/qr/jsQR.js').then(function () {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('사진을 열지 못했습니다.')); };
        img.src = url;
      });
    }).then(function (img) {
      var decode = (window.jsQR && (window.jsQR.default || window.jsQR));
      var found = null;
      [1600, 900, 500].some(function (limit) {
        var scale = Math.min(1, limit / Math.max(img.naturalWidth, img.naturalHeight));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        found = decode(pixels.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
        return !!found;
      });
      if (!found) return toast('QR을 찾지 못했습니다. QR이 사진에 크고 선명하게 나오게 다시 찍어 주세요.');
      openLinkText(found.data);
    }).catch(function (err) { toast(err.message); });
  }

  /** 설정의 가족 링크 칸: 링크 넣기 전, 보는 폰, 관리자 폰 */
  function renderFamilyBox() {
    var box = $('familyLinkBox');
    if (!box) return;
    if (!sync || !config.SYNC || !sync.enabled(config.SYNC)) {
      box.innerHTML = '<p class="note">가족 링크 저장소가 연결되지 않았습니다.</p>';
      return;
    }
    if (!sync.available()) {
      box.innerHTML = '<p class="note">이 주소(' + esc(location.host) + ')에서는 브라우저가 암호화를 막습니다. GitHub 주소나 안드로이드 앱에서 열어 주세요.</p>';
      return;
    }
    var group = groupInfo();
    if ($('familyHowto')) $('familyHowto').hidden = !!group;
    if (!group) {
      box.innerHTML = '<p class="note">받은 가족 링크를 복사한 뒤 누르거나, 가족 링크 QR을 찍은 사진이나 캡처를 골라 주세요.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary btn-grow" data-open-receive>받은 링크 넣기</button>' +
        '<label class="btn btn-grow file-btn" for="qrPhoto">QR 사진으로 넣기<input id="qrPhoto" type="file" accept="image/*"></label></div>';
      return;
    }
    var me = currentPerson();
    var mine = me && me.follow;
    var manager = isManager();
    box.innerHTML =
      (group.people.length
        ? '<p class="note">가족 링크로 ' + esc(group.people.map(function (p) { return p.name; }).join(', ')) + ' 스케줄을 봅니다. 앱을 열 때와 30분마다 최신으로 바뀝니다.'
        : '<p class="note">가족 링크를 넣었습니다. 아직 명단이 없습니다. 관리자가 제목을 눌러 사람을 추가하면 들어옵니다.') +
        (mine ? ' ' + esc(NAME) + ' 마지막으로 받은 때: ' + esc(clockText(me.follow.at)) : '') + '</p>' +
      (mine && me.follow.error ? '<p class="callout">' + esc(me.follow.error) + '</p>' : '') +
      (manager
        ? linkRow('가족 링크 (모두 같은 링크)', familyUrl(), 'group', '가족에게 이 링크 하나만 보내면 됩니다. 링크를 가진 사람은 모두 볼 수 있습니다.') +
          '<p class="note"><b>이 폰은 관리자입니다.</b> 캡처를 넣거나 일정을 고치면 가족 모두에게 올라가고, 마지막에 올린 스케줄로 맞춰집니다. 제목을 눌러 사람을 추가하면 가족 모두의 폰에 들어갑니다.</p>' +
          '<div class="btn-row"><button type="button" class="btn btn-grow" data-family-sync>Sync</button></div>' +
          '<p class="note">못 올린 변경이 있으면 올리고, 가족 스케줄을 최신으로 받습니다. 평소에는 앱을 열 때와 30분마다 저절로 맞춰집니다.</p>' +
          '<div class="btn-row"><button type="button" class="btn btn-grow btn-quiet" data-manager-off>관리자 끄기</button></div>'
        : '<div class="btn-row"><button type="button" class="btn btn-grow" data-family-sync>Sync</button></div>' +
          '<p class="note">가족 스케줄을 지금 최신으로 받습니다. 평소에는 앱을 열 때와 30분마다 저절로 맞춰지니, 방금 올린 스케줄이 안 보일 때만 누르세요.</p>' +
          '<div class="btn-row"><button type="button" class="btn btn-grow" data-manager-on>관리자 켜기</button></div>' +
          '<p class="note">스케줄을 올리거나 고치려면 관리자를 켜고 비밀번호를 넣습니다. 한 번 켜면 이 폰에서 계속 유지됩니다. 가족 링크 보내기와 QR도 관리자를 켜면 보입니다.</p>') +
      '<details class="howto"><summary>다른 가족 링크로 바꾸기</summary>' +
        '<p class="note">새로 받은 가족 링크나 QR로 바꿉니다. 지금 가족 명단과 관리자 설정은 이 폰에서 풀립니다.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-grow" data-open-receive>받은 링크 넣기</button>' +
        '<label class="btn btn-grow file-btn" for="qrPhoto">QR 사진으로 넣기<input id="qrPhoto" type="file" accept="image/*"></label></div>' +
      '</details>';
  }

  /* ---------------- 함께 보기 ---------------- */

  /** 저장된 다른 사람의 한 달. 그 사람이 고친 시각, 노선, 코드 뜻을 그대로 쓴다. */
  function personModel(person, year, month) {
    if (person.id === people.current) {
      return isSample() && NAME !== TEST_NAME ? null : modelFor(year, month);
    }
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem(keyFor(person.id)) || '{}') || {}; } catch (e) { raw = {}; }
    var list = raw.entries || [];
    var useSample = person.name === TEST_NAME && testSource() === 'sample';
    if (useSample) list = sampleEntries();
    if (!list.length) return null;
    var fixes = raw.routeFix || {};
    var overrides = raw.overrides || {};
    var own = list.map(function (entry) {
      var fix = entry.type === 'flight' && fixes[entry.code];
      return fix ? Object.assign({}, entry, { from: fix.from, to: fix.to, route: fix.from + '/' + fix.to }) : entry;
    });
    var timeOfOther = function (ev) {
      if (overrides[overrideKey(ev)]) return overrides[overrideKey(ev)];
      var row = ((routedata.TIMES && routedata.TIMES.times) || {})[ev.code] || (useSample && C.sample.TIMES ? C.sample.TIMES[ev.code] : null);
      if (!row) return null;
      return ev.type === 'in' ? (row.end || null) : (row.start || null);
    };
    return plan.buildMonth(year, month, own, { timeOf: timeOfOther, words: raw.words || {} });
  }

  /** 함께 보기 달력: 같이 쉬는 날은 초록, 같은 날 같은 도시는 도시 이름. 날짜를 누르면 그날 달력으로 간다. */
  function togetherCalendar(year, month, cmp) {
    var both = {}, same = {};
    cmp.together.forEach(function (row) { both[row.date] = row; });
    cmp.samePlace.forEach(function (row) { (same[row.date] = same[row.date] || []).push(row); });
    var first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    var days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    var cells = [];
    for (var blank = 0; blank < first; blank++) cells.push('<span class="tg-cell is-blank" aria-hidden="true"></span>');
    for (var d = 1; d <= days; d++) {
      var iso = year + '-' + (month < 10 ? '0' : '') + month + '-' + (d < 10 ? '0' : '') + d;
      var off = both[iso], here = same[iso];
      var label = [];
      if (off) label.push('같이 휴무: ' + off.names.join(', '));
      if (here) here.forEach(function (row) { label.push(row.city + ': ' + row.names.join(', ')); });
      var weekday = (first + d - 1) % 7;
      cells.push('<button type="button" class="tg-cell' + (off ? ' is-both' : '') + (here ? ' is-same' : '') +
        (weekday === 0 ? ' is-sun' : weekday === 6 ? ' is-sat' : '') + (iso === todayIso() ? ' is-today' : '') +
        '" data-date="' + iso + '" aria-label="' + esc(dateLabel(iso) + (label.length ? ', ' + label.join('. ') : '')) + '">' +
        '<b>' + d + '</b>' +
        (off ? '<small class="tg-off">휴무</small>' : '') +
        (here ? here.map(function (row) { return '<small class="tg-city">' + (row.flag ? row.flag + ' ' : '') + esc(row.city) + '</small>'; }).join('') : '') +
        '</button>');
    }
    return '<div class="tg-cal" role="group" aria-label="' + year + '년 ' + month + '월 함께 보기">' +
      ['일', '월', '화', '수', '목', '금', '토'].map(function (w, i) {
        return '<span class="tg-week' + (i === 0 ? ' is-sun' : i === 6 ? ' is-sat' : '') + '">' + w + '</span>';
      }).join('') + cells.join('') + '</div>';
  }

  function togetherHtml(year, month) {
    // 그 달에 스케줄이 있는 사람만. 아직 아무것도 안 올라온 사람은 휴무 0일로 보이지 않게 뺀다.
    var list = visiblePeople().map(function (person) {
      var model = personModel(person, year, month);
      var filled = model && model.days.some(function (day) { return day.kind !== 'none'; });
      return filled ? { name: person.name, model: model } : null;
    }).filter(Boolean);
    var nav = '<div class="together-nav">' +
      '<button type="button" class="btn btn-small" data-together-shift="-1" aria-label="이전 달">이전 달</button>' +
      '<b>' + year + '년 ' + month + '월</b>' +
      '<button type="button" class="btn btn-small" data-together-shift="1" aria-label="다음 달">다음 달</button></div>';
    if (!list.length) {
      return nav + '<p class="note">이 달에 스케줄이 올라온 사람이 없어요.</p>';
    }
    var cmp = plan.together(list);
    var html = nav + '<h4 class="choices-title">사람마다 휴무</h4><ul class="together-list">' + cmp.offs.map(function (row) {
      return '<li><b>' + esc(row.name) + '</b><span>' + esc(row.text || '없음') + '</span><small>' + row.days.length + '일</small></li>';
    }).join('') + '</ul>';
    if (list.length < 2) {
      return html + '<p class="note">이 달에 스케줄이 올라온 사람만 보입니다. 둘 이상이면 같이 쉬는 날과 같은 날 같은 곳에 있는 날이 달력에 보여요.</p>';
    }
    html += togetherCalendar(year, month, cmp) +
      '<p class="together-legend"><span class="tg-key is-both"></span>같이 휴무<span class="tg-key is-same"></span>같은 날 같은 도시</p>' +
      (cmp.together.length || cmp.samePlace.length ? '' : '<p class="note">이 달에는 같이 쉬는 날도, 같은 도시에 있는 날도 없어요.</p>');
    return html;
  }

  /** 고를 수 있는 코드: 근무 코드 사전과 대한항공 노선 시드. 한 번 만들어 둔다. */
  var codeGroups = null;

  function codeOptionGroups() {
    if (codeGroups) return codeGroups;
    var duty = (C.codes && C.codes.DUTY_CODES) || {};
    var kinds = [['off', '휴무'], ['vacation', '휴가'], ['standby', '대기'], ['training', '교육'], ['layover', '체류'], ['other', '근무, 기타']];
    var groups = kinds.map(function (kind) {
      return {
        name: kind[1],
        items: Object.keys(duty).filter(function (code) { return duty[code].category === kind[0]; }).sort().map(function (code) {
          return { code: code, label: code + ' (' + duty[code].label + ')' };
        })
      };
    });
    var routes = (routedata && routedata.SEED && routedata.SEED.routes) || {};
    var leave = [], back = [], rest = [];
    Object.keys(routes).sort().forEach(function (code) {
      var r = routes[code];
      var item = { code: code, label: code + ' ' + (cityOf(r.from) || r.from) + '→' + (cityOf(r.to) || r.to) };
      var fromKr = airports.countryOf(r.from) === 'KR';
      var toKr = airports.countryOf(r.to) === 'KR';
      (fromKr && !toKr ? leave : toKr && !fromKr ? back : rest).push(item);
    });
    groups.push({ name: '비행: 한국에서 출발', items: leave }, { name: '비행: 한국으로 돌아옴', items: back }, { name: '비행: 국내선, 기타', items: rest });
    codeGroups = groups.filter(function (g) { return g.items.length; });
    return codeGroups;
  }

  function codeOptions(selected, placeholder) {
    var groups = codeOptionGroups();
    var known = groups.some(function (g) { return g.items.some(function (item) { return item.code === selected; }); });
    return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') +
      (selected && !known ? '<option value="' + esc(selected) + '" selected>' + esc(selected + ' (목록에 없는 코드)') + '</option>' : '') +
      groups.map(function (g) {
        return '<optgroup label="' + esc(g.name) + '">' + g.items.map(function (item) {
          return '<option value="' + esc(item.code) + '"' + (item.code === selected ? ' selected' : '') + '>' + esc(item.label) + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
  }

  /** 날 종류를 한 번에 바꾸는 버튼. 누르면 그날 코드를 이 코드 하나로 바꾼다. */
  var QUICK_KINDS = [
    { label: '휴무', code: 'DO', category: 'off' },
    { label: '대기', code: 'STBY', category: 'standby' },
    { label: '교육', code: 'TFRS', category: 'training' },
    { label: '지상 근무', code: 'GRD', category: 'work' }
  ];

  /** 그날 일정 코드와 공항을 고치고 지우고 더하기. 버튼을 눌러야 펼쳐진다. 코드 뜻은 설정의 코드 뜻 칸 한 곳에서만 고친다. */
  function editBlock(iso) {
    if (!canEdit()) return '';
    var open = state.editOpen === iso;
    var chip = db.edited[iso] ? '<span class="route-chip">고친 날</span>' : '';
    if (!open) {
      return '<section class="edit-block"><button type="button" class="btn btn-grow edit-toggle" data-edit-toggle="' + iso + '" aria-expanded="false">' +
        ICON.edit + '이 날 바꾸기' + chip + '</button></section>';
    }
    var own = entries().filter(function (entry) { return entry.date === iso; });
    var hasFlight = own.some(function (entry) { return entry.type === 'flight'; });
    var items = own.map(function (entry, index) {
      var id = 'edit-' + iso + '-' + index;
      return '<li>' +
        '<label class="visually-hidden" for="' + id + '">' + (index + 1) + '번째 일정</label>' +
        '<select id="' + id + '" data-edit-index="' + index + '" data-edit-date="' + iso + '">' + codeOptions(entry.code) + '</select>' +
        '<span class="edit-meaning">' + esc(meaningOf(entry)) + '</span>' +
        '<button type="button" class="edit-remove" data-edit-remove="' + index + '" data-edit-date="' + iso + '" aria-label="' + esc(entry.code) + ' 지우기">' + ICON.trash + '</button>' +
        (entry.type === 'flight' ? routeEdit(entry, id) : '') +
        '</li>';
    }).join('');
    return '<section class="block edit-block"><button type="button" class="btn btn-grow edit-toggle is-open" data-edit-toggle="' + iso + '" aria-expanded="true">' +
      ICON.edit + '닫기' + chip + '</button>' +
      '<p class="block-title">이 날은</p>' +
      '<div class="kind-row">' + QUICK_KINDS.map(function (q) {
        var on = !hasFlight && own.length > 0 && own.every(function (entry) {
          return plan.wordFor(entry.code, entry.category, db.words).category === q.category;
        });
        return '<button type="button" class="kind-btn' + (on ? ' is-on' : '') + '" data-quick-kind="' + iso + '|' + q.code + '" aria-pressed="' + on + '">' + q.label + '</button>';
      }).join('') + '</div>' +
      '<div class="edit-add">' +
        '<label class="visually-hidden" for="add-sel-' + iso + '">추가할 일정</label>' +
        '<select id="add-sel-' + iso + '" data-edit-add-select="' + iso + '">' + codeOptions('', '비행이나 근무 추가하기') + '</select>' +
        '<button type="button" class="btn btn-small" data-edit-add="' + iso + '">넣기</button>' +
      '</div>' +
      '<details class="edit-advanced"><summary>목록에 없는 편명 직접 넣기</summary><div class="edit-add">' +
        '<label class="visually-hidden" for="add-' + iso + '">편명 직접 넣기</label>' +
        '<input id="add-' + iso + '" type="text" data-edit-add-input="' + iso + '" placeholder="예: KE0017" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn btn-small" data-edit-add="' + iso + '">넣기</button>' +
      '</div></details>' +
      (hasFlight
        ? '<ul class="edit-list">' + items + '</ul>' +
          '<p class="note">공항을 바꾸면 같은 편명이 들어간 모든 날짜에 바로 반영됩니다. 밤을 넘기는 귀국편은 출발일과 도착일에 같은 편명을 적어 주세요.</p>'
        : '<details class="edit-advanced"><summary>일정 하나씩 고치기</summary>' +
          (items ? '<ul class="edit-list">' + items + '</ul>' : '<p class="note">적힌 코드가 없습니다.</p>') +
          '<p class="note">휴무인지 근무인지가 틀리면 <button type="button" class="link-btn" data-go-codes>코드 관리</button>에서 바꿉니다.</p></details>') +
      '</section>';
  }

  function sheetHtml(day) {
    var holidayName = holidayOf(day.date);
    var head = '<header class="sheet-head ' + tripClass(day) + '"><p class="eyebrow">' + esc(dateLabel(day.date, true)) +
      (holidayName ? ', ' + esc(holidayName) : '') + '</p>';
    var body = '';
    var tag = day.airports ? '<span class="trip-tag">' + esc(day.airports) + '</span>' : '';

    switch (day.kind) {
      case 'out': {
        var country = airports.countryName(airports.countryOf(day.place.iata));
        head += '<h2 id="sheetTitle" class="display"><span class="flag">' + day.place.flag + '</span>' + esc(day.place.city) + ' 출발</h2>' + tag;
        head += '<p class="lede">' + esc(day.sub === '귀국 후 출발' ? '돌아온 날 바로 다시 나갑니다.'
          : (country && country !== day.place.city ? country + ' ' : '') + day.place.city + '에 가서 머물다 옵니다.') + '</p>';
        body += day.ins.map(function (ev) { return '<section class="block">' + flightBlock(ev) + '</section>' + inBlock(ev); }).join('');
        body += '<section class="block">' + flightBlock(day.outs[0]) + '</section>' + outBlock(day.outs[0]);
        break;
      }
      case 'turn':
        head += '<h2 id="sheetTitle" class="display"><span class="flag">' + day.place.flag + '</span>' + esc(day.place.city) + ' 당일 왕복</h2>' + tag;
        head += '<p class="lede">다녀와서 오늘 안에 돌아옵니다.</p>';
        body += '<section class="block">' + flightBlock(day.outs[0]) + flightBlock(day.ins[0]) + '</section>';
        body += outBlock(day.outs[0]) + inBlock(day.ins[0]);
        break;
      case 'away': {
        var clock = localClock(day.place);
        var back = plan.returnAfter(modelFor(+day.date.slice(0, 4), +day.date.slice(5, 7)), day.date);
        head += '<h2 id="sheetTitle" class="display"><span class="flag">' + day.place.flag + '</span>' + esc(day.place.city) + '에 있어요</h2>' + tag;
        head += '<p class="lede">' + (clock ? '지금 현지 시각 ' + esc(clock.text) + ', ' + esc(clock.gap) + '.' : '') + '</p>';
        body += '<section class="block"><h3 class="block-title">돌아오는 날</h3>' +
          (back ? '<p class="lede">' + esc(dateLabel(back.date, true)) + (back.time ? ' ' + esc(bus.clock(bus.toMin(back.time))) : '') +
            ' ' + esc(cityOf(back.to)) + ' 도착 (' + esc(back.code) + ', ' + esc(back.from) + '→' + esc(back.to) + ')</p>'
            : '<p class="lede">이 달 스케줄에는 귀국편이 없어요.</p>') + '</section>';
        break;
      }
      case 'homeward': {
        var hw = day.homeward[0];
        head += '<h2 id="sheetTitle" class="display"><span class="flag">' + day.place.flag + '</span>' + esc(day.place.city) + '에서 출발</h2>' + tag;
        head += '<p class="lede">밤새 날아 ' + esc(dateLabel(hw.date)) + (hw.time ? ' ' + esc(bus.clock(bus.toMin(hw.time))) : '') + '에 ' + esc(cityOf(hw.to)) + '에 도착합니다.</p>';
        body += '<section class="block">' + flightBlock(hw) + '</section>' + inBlock(hw);
        break;
      }
      case 'in': {
        var inn = day.ins[0];
        head += '<h2 id="sheetTitle" class="display">' + esc(cityOf(inn.to)) + ' 도착</h2>' + tag;
        head += '<p class="lede"><span class="flag">' + day.place.flag + '</span>' + esc(day.place.city) + '에서 돌아옵니다.</p>';
        body += '<section class="block">' + flightBlock(inn) + '</section>' + inBlock(inn);
        break;
      }
      case 'off':
        head += '<h2 id="sheetTitle" class="display">' + esc(day.short) + '</h2><p class="lede">' + esc(day.long || '비행이 없는 날입니다.') + '</p>';
        break;
      case 'standby':
      case 'training':
      case 'work':
        head += '<h2 id="sheetTitle" class="display">' + esc(day.short === '지상' ? '지상 근무' : day.short) + '</h2><p class="lede">' + esc(day.long || '') + '</p>';
        break;
      case 'other':
        head += '<h2 id="sheetTitle" class="display">' + esc(day.short) + '</h2><p class="lede">뜻을 모르는 코드입니다. 아래에서 뜻을 정해 주세요.</p>';
        break;
      case 'flight':
        head += '<h2 id="sheetTitle" class="display">' + esc(day.short) + '</h2>' + tag + '<p class="lede">한국을 거치지 않는 비행입니다.</p>';
        body += '<section class="block">' + day.others.map(flightBlock).join('') + '</section>';
        break;
      default:
        head += '<h2 id="sheetTitle" class="display">일정 없음</h2><p class="lede">이 날은 스케줄에 적힌 것이 없어요.</p>';
    }

    return head + '</header>' + body + editBlock(day.date);
  }

  function openDay(iso) {
    if (state.openDate !== iso) {
      state.editOpen = null;
      state.routeOpen = null;
    }
    state.openDate = iso;
    $('sheetBody').innerHTML = sheetHtml(findDay(iso));
    var sheet = $('daySheet');
    if (!sheet.open) sheet.showModal();
  }

  /* ---------------- 고치기 ---------------- */

  function splitCodes(text) {
    return String(text || '').toUpperCase().split(/[\s,]+/).map(function (c) { return c.trim(); }).filter(Boolean);
  }

  /** 그날 코드 목록을 통째로 바꾼다. 파서를 거쳐 종류와 노선을 붙인다. */
  function setDayCodes(iso, codes) {
    if (!ensureOwn()) return;
    var kept = db.entries.filter(function (entry) { return entry.date !== iso; });
    var fresh = [];
    if (codes.length) {
      var text = codes.map(function (code) { return iso + '\t' + code; }).join('\n');
      fresh = slim(parser.parse(text, { year: +iso.slice(0, 4), month: +iso.slice(5, 7) }).entries)
        .filter(function (entry) { return entry.date === iso; });
      var seen = fresh.map(function (entry) { return entry.code; });
      // 파서가 버린 코드도 '모르는 코드'로 남긴다. 사람이 적은 것은 지우지 않는다.
      codes.forEach(function (code) {
        if (seen.indexOf(code) < 0) fresh.push({ date: iso, code: code, type: 'duty', category: 'unknown', route: null, from: null, to: null });
      });
    }
    db.entries = kept.concat(fresh);
    db.edited[iso] = true;
    save();
    render();
  }

  function codesOn(iso) {
    return rawEntries().filter(function (entry) { return entry.date === iso; }).map(function (entry) { return entry.code; });
  }

  function setWord(code, patch) {
    var cur = plan.wordFor(code, categoryOf(code), db.words);
    var next = {
      short: patch.short != null ? patch.short : cur.short,
      category: patch.category != null ? patch.category : cur.category
    };
    next.long = patch.short != null ? patch.short : cur.long;
    if (!next.short) next.short = code;
    if (db.words[code] && db.words[code].added) next.added = true;
    db.words[code] = next;
    save();
    render();
  }

  function setRoute(code, text) {
    var value = String(text || '').trim().toUpperCase();
    if (!value) {
      delete db.routeFix[code];
    } else {
      var m = /^([A-Z]{3})\s*[-/→> ]?\s*([A-Z]{3})$/.exec(value);
      if (!m) {
        toast('공항 코드는 ICN-JFK 처럼 세 글자씩 적어 주세요.');
        return;
      }
      db.routeFix[code] = { from: m[1], to: m[2] };
    }
    save();
    render();
    toast(code + ' 노선을 ' + (value ? db.routeFix[code].from + '→' + db.routeFix[code].to + '(으)로' : '원래대로') + ' 바꿨습니다.');
  }

  /* ---------------- 파일 내보내기 ---------------- */

  /** 안드로이드 앱(Capacitor) 안인지. 앱 웹뷰는 파일 내려받기와 웹 공유를 못 해서 네이티브 플러그인을 쓴다. */
  function nativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.nativePromise);
  }

  /** 앱 안: 캐시 폴더에 파일을 쓰고 공유 창을 연다(카톡, 드라이브, 파일 저장 등) */
  function nativeShareFile(name, blob) {
    var reader = new FileReader();
    reader.onload = function () {
      var data = String(reader.result).split(',')[1];
      window.Capacitor.nativePromise('Filesystem', 'writeFile', { path: name, data: data, directory: 'CACHE' })
        .then(function (written) {
          return window.Capacitor.nativePromise('Share', 'share', { title: name, files: [written.uri] });
        })
        .catch(function (err) {
          if (!/cancel/i.test(String(err && err.message))) toast('파일을 보내지 못했습니다. ' + (err && err.message || ''));
        });
    };
    reader.readAsDataURL(blob);
  }

  function saveFile(name, blob) {
    if (nativeApp()) return nativeShareFile(name, blob);
    var file = null;
    try { file = new File([blob], name, { type: blob.type }); } catch (e) { /* 오래된 브라우저 */ }
    if (file && platform !== 'web' && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function () { /* 사용자가 닫음 */ });
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function icsEscape(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  /** 한국 날짜와 자정부터 센 분(음수면 전날)을 UTC 스탬프로 */
  function stamp(iso, minutes) {
    var ms = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 0, minutes) - 9 * 3600 * 1000;
    return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function vevent(uid, iso, startMin, length, summary, description, alarmBefore) {
    var lines = [
      'BEGIN:VEVENT',
      'UID:' + uid + '@crew-family',
      'DTSTAMP:' + stamp(todayIso(), 0),
      'DTSTART:' + stamp(iso, startMin),
      'DTEND:' + stamp(iso, startMin + length),
      'SUMMARY:' + icsEscape(summary)
    ];
    if (description) lines.push('DESCRIPTION:' + icsEscape(description));
    if (alarmBefore != null) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(summary),
        'TRIGGER:' + (alarmBefore ? '-PT' + alarmBefore + 'M' : 'PT0M'), 'END:VALARM');
    }
    lines.push('END:VEVENT');
    return lines;
  }

  function allDay(uid, iso, summary) {
    return ['BEGIN:VEVENT', 'UID:' + uid + '@crew-family', 'DTSTAMP:' + stamp(todayIso(), 0),
      'DTSTART;VALUE=DATE:' + iso.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + plan.addDays(iso, 1).replace(/-/g, ''),
      'SUMMARY:' + icsEscape(summary), 'END:VEVENT'];
  }

  /** 예매 알림: 비행 며칠 전 오전 9시 */
  function bookingReminder(ev, rec, direction) {
    if (rec.board == null || db.booked[bookingKey(ev, direction)] || !canEdit()) return [];
    var day = bus.bookingDay(ev.date, db.settings.bookDaysBefore);
    var what = direction === 'out'
      ? rec.stopName + ' → ' + airportShort(departAirport(ev)) + ' ' + bus.hhmm(rec.board)
      : airportShort(arriveAirport(ev)) + ' → ' + rec.stopName + ' ' + bus.hhmm(rec.board);
    return vevent('book-' + direction + '-' + ev.date + ev.code, day, 9 * 60, 15,
      NAME + ' 버스 예매 (' + dateLabel(ev.date) + ' ' + rec.route + '번)', what + ', ' + bus.booking(rec.booking, 'web').label + '에서 예매', 0);
  }

  function outEvents(ev, withReminder) {
    var rec = bookedPlan(ev, 'out') || outRec(ev);
    if (rec.board == null) return [];
    var lines = [].concat(
      vevent('wake-' + ev.date + ev.code, ev.date, rec.wake, 15,
        NAME + ' 일어나기 (' + ev.code + ' 출발일)', rec.route + ' ' + rec.stopName + ' ' + bus.clock(rec.board) + ' 탑승', 0),
      vevent('bus-' + ev.date + ev.code, ev.date, rec.board, rec.travel,
        rec.route + ' ' + rec.stopName + ' 탑승', airportShort(rec.airport) + ' 도착 예상 ' + bus.clock(rec.arrive) + '. ' + rec.reason, 10),
      vevent('fly-' + ev.date + ev.code, ev.date, rec.depart, 30,
        NAME + ' ' + ev.place.city + ' 출발 ' + ev.code + ' (' + ev.from + '→' + ev.to + ')', '', null));
    return withReminder ? lines.concat(bookingReminder(ev, rec, 'out')) : lines;
  }

  function inEvents(ev) {
    var arrive = bus.toMin(ev.time);
    if (arrive == null) return [];
    var lines = vevent('arr-' + ev.date + ev.code, ev.date, arrive, 30,
      NAME + ' ' + cityOf(ev.to) + ' 도착 ' + ev.code + ' (' + ev.from + '→' + ev.to + ')', '', null);
    var rec = bookedPlan(ev, 'in') || inRec(ev);
    if (rec.board != null) {
      lines = lines.concat(vevent('home-' + ev.date + ev.code, ev.date, rec.board, rec.travel,
        airportShort(rec.airport) + ' ' + rec.route + ' 탑승', rec.stopName + ' 도착 예상 ' + bus.clock(rec.reachStop), null));
      lines = lines.concat(bookingReminder(ev, rec, 'in'));
    }
    return lines;
  }

  function calendarFile(lines) {
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//crew-family//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
      .concat(lines, ['END:VCALENDAR']).join('\r\n');
  }

  function offerCalendar(name, text) {
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    if (platform === 'ios') {
      // 사파리는 내려받기 대신 캘린더 추가 창을 띄운다
      var url = URL.createObjectURL(blob);
      window.location.href = url;
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      return;
    }
    saveFile(name, blob);
  }

  function exportMonth() {
    var model = modelFor(state.year, state.month);
    var prefix = model.year + '-' + pad(model.month);
    var lines = [];
    model.events.forEach(function (ev) {
      if (ev.date.slice(0, 7) !== prefix) return;
      if (ev.type === 'out') lines = lines.concat(outEvents(ev, true));
      if (ev.type === 'in') lines = lines.concat(inEvents(ev));
    });
    model.days.forEach(function (day) {
      if (day.kind === 'off') lines = lines.concat(allDay('off-' + day.date, day.date, NAME + ' 휴무'));
      if (day.kind === 'away') lines = lines.concat(allDay('away-' + day.date, day.date, NAME + ' ' + day.place.city + ' 체류'));
    });
    if (!lines.length) return toast('이 달에는 캘린더에 넣을 일정이 없어요.');
    offerCalendar(NAME + '-' + prefix + '.ics', calendarFile(lines));
  }

  /* ---------------- 휴일표 ---------------- */

  var TYPE_LABEL = { off: '휴무', work: '근무', none: '' };

  function holidayLists(model) {
    var off = [], work = [];
    model.days.forEach(function (day) {
      var type = plan.dayType(day);
      if (type === 'off') off.push(day.day);
      if (type === 'work') work.push(day.day);
    });
    return { off: off, work: work };
  }

  function exportTitle(model) {
    return NAME + ' ' + model.year + '년 ' + model.month + '월 근무표';
  }

  function exportSheetHtml(model) {
    var lists = holidayLists(model);
    var cells = plan.WEEKDAYS.map(function (w, i) {
      return '<span class="wd' + (i === 0 ? ' sun' : '') + '">' + w + '</span>';
    }).join('');
    for (var i = 0; i < model.days[0].weekday; i++) cells += '<span aria-hidden="true"></span>';
    model.days.forEach(function (day) {
      var type = plan.dayType(day);
      var hol = holidayOf(day.date);
      cells += '<span class="mc ' + type + (day.weekday === 0 ? ' is-sun' : '') + (hol ? ' is-holiday' : '') + '"><b>' + day.day + '</b><i>' +
        (TYPE_LABEL[type] || '&nbsp;') + '</i>' + (hol ? '<small>' + esc(hol) + '</small>' : '') + '</span>';
    });
    return '<header class="sheet-head"><p class="eyebrow">근무표</p>' +
      '<h2 id="exportTitle" class="display">' + esc(exportTitle(model)) + '</h2>' +
      '<p class="lede">휴무 ' + lists.off.length + '일, 근무 ' + lists.work.length + '일. 비행, 대기, 교육은 모두 근무로 셉니다.</p></header>' +
      '<div class="mini-cal">' + cells + '</div>' +
      '<dl class="export-lines">' +
        '<div><dt class="off">휴무</dt><dd>' + esc(plan.ranges(lists.off) || '없음') + '</dd></div>' +
        '<div><dt>근무</dt><dd>' + esc(plan.ranges(lists.work) || '없음') + '</dd></div>' +
      '</dl>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary btn-grow" data-export="image">' + ICON.image + 'A4 가로 이미지로 저장</button>' +
        '<button type="button" class="btn btn-grow" data-export="text">' + ICON.copy + '글로 복사</button>' +
        '<button type="button" class="btn btn-grow" data-export="csv">' + ICON.sheet + '엑셀(CSV)</button>' +
      '</div>' +
      '<p class="note">실제와 다른 날이 있으면 <button type="button" class="link-btn" data-go-codes>코드 관리</button>에서 그 코드를 휴무나 근무로 바꿔 주세요.</p>';
  }

  function openExport() {
    $('exportBody').innerHTML = exportSheetHtml(modelFor(state.year, state.month));
    if (!$('exportSheet').open) $('exportSheet').showModal();
  }

  function exportText(model) {
    var lists = holidayLists(model);
    return NAME + ' ' + model.year + '년 ' + model.month + '월\n' +
      '휴무 ' + lists.off.length + '일: ' + (plan.ranges(lists.off) || '없음') + '\n' +
      '근무 ' + lists.work.length + '일: ' + (plan.ranges(lists.work) || '없음');
  }

  function exportCsv(model) {
    var rows = ['날짜,요일,구분'];
    model.days.forEach(function (day) {
      rows.push(day.date + ',' + day.weekdayName + ',' + TYPE_LABEL[plan.dayType(day)]);
    });
    saveFile(NAME + '-holidays-' + model.year + pad(model.month) + '.csv',
      new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * 근무표 한 장. A4 가로(297x210mm)를 300dpi 로 그려 인쇄해도 흐리지 않다.
   * 밝은 색으로 고정한다.
   */
  function exportImage(model) {
    var K = {
      paper: '#FFFFFF', ink: '#13203A', ink2: '#505C74', ink3: '#8790A3', line: '#D8DEE7',
      off: '#3F7A57', offTint: '#DFEDE4', workTint: '#EEF1F5', sun: '#B8452A', accent: '#C8810F'
    };
    var body = '"IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif';
    var mono = '"IBM Plex Mono", Menlo, monospace';
    var display = 'Hahmlet, "AppleMyungjo", serif';
    var lists = holidayLists(model);

    var W = 3508, H = 2480;          // A4 가로, 300dpi
    var M = 140;                     // 여백
    var gap = 22;                    // 칸 사이
    var headH = 330;                 // 제목 줄
    var weekH = 100;                 // 요일 줄
    var footH = 150;                 // 아래 휴무 목록
    var lead = model.days[0].weekday;
    var rows = Math.ceil((lead + model.days.length) / 7);
    var gridTop = M + headH + weekH;
    var colW = (W - M * 2 + gap) / 7;
    var rowH = (H - gridTop - footH - M + gap) / rows;

    var ready = document.fonts && document.fonts.load
      ? Promise.all([
          document.fonts.load('700 190px Hahmlet'),
          document.fonts.load('600 80px "IBM Plex Sans KR"'),
          document.fonts.load('600 70px "IBM Plex Mono"')
        ]).catch(function () {})
      : Promise.resolve();

    toast('A4 근무표를 만드는 중입니다.');
    ready.then(function () {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = K.paper;
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // 제목: 왼쪽 이름과 달, 오른쪽 휴무·근무 일수
      ctx.textAlign = 'left';
      ctx.fillStyle = K.accent;
      ctx.font = '600 76px ' + body;
      ctx.fillText(NAME + ' 근무표', M, M + 70);
      ctx.fillStyle = K.ink;
      ctx.font = '700 170px ' + display;
      ctx.fillText(model.year + '년 ' + model.month + '월', M, M + 240);

      ctx.textAlign = 'right';
      ctx.font = '700 130px ' + display;
      ctx.fillStyle = K.ink;
      var workText = '근무 ' + lists.work.length + '일';
      ctx.fillText(workText, W - M, M + 240);
      var workWidth = ctx.measureText(workText).width;
      ctx.fillStyle = K.off;
      ctx.fillText('휴무 ' + lists.off.length + '일', W - M - workWidth - 100, M + 240);

      ctx.strokeStyle = K.line;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(M, M + headH - 40);
      ctx.lineTo(W - M, M + headH - 40);
      ctx.stroke();

      // 요일
      ctx.textAlign = 'center';
      ctx.font = '600 68px ' + body;
      plan.WEEKDAYS.forEach(function (w, i) {
        ctx.fillStyle = i === 0 ? K.sun : i === 6 ? K.ink2 : K.ink3;
        ctx.fillText(w, M + colW * i + (colW - gap) / 2, M + headH + 50);
      });

      // 날짜 칸
      model.days.forEach(function (day, index) {
        var pos = lead + index;
        var x = M + (pos % 7) * colW;
        var y = gridTop + Math.floor(pos / 7) * rowH;
        var w = colW - gap, h = rowH - gap;
        var type = plan.dayType(day);
        if (type === 'none') {
          ctx.strokeStyle = K.line;
          ctx.lineWidth = 5;
          roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 40);
          ctx.stroke();
        } else {
          ctx.fillStyle = type === 'off' ? K.offTint : K.workTint;
          roundRect(ctx, x, y, w, h, 40);
          ctx.fill();
        }

        var holidayName = holidayOf(day.date);
        ctx.textAlign = 'left';
        ctx.fillStyle = day.weekday === 0 || holidayName ? K.sun : K.ink2;
        // 윗줄: 왼쪽 날짜, 오른쪽 공휴일 이름. 아래쪽 넓은 자리에 휴무/근무.
        ctx.font = '600 68px ' + mono;
        ctx.fillText(String(day.day), x + 38, y + 88);
        if (holidayName) {
          ctx.textAlign = 'right';
          ctx.font = '600 42px ' + body;
          ctx.fillText(holidayName, x + w - 34, y + 82);
        }

        ctx.textAlign = 'center';
        var labelY = y + h - Math.max(46, (h - 230) / 2 + 40);
        if (type === 'off') {
          ctx.fillStyle = K.off;
          ctx.font = '700 112px ' + display;
          ctx.fillText('휴무', x + w / 2, labelY);
        } else if (type === 'work') {
          ctx.fillStyle = K.ink;
          ctx.font = '600 96px ' + body;
          ctx.fillText('근무', x + w / 2, labelY);
        }
      });

      // 아래: 휴무 날짜 목록
      var footY = H - M - 20;
      ctx.textAlign = 'left';
      ctx.fillStyle = K.off;
      ctx.font = '700 64px ' + body;
      ctx.fillText('휴무', M, footY);
      ctx.fillStyle = K.ink2;
      ctx.font = '500 62px ' + mono;
      ctx.fillText(plan.ranges(lists.off) || '없음', M + 170, footY);
      ctx.textAlign = 'right';
      ctx.fillStyle = K.ink3;
      ctx.font = '500 48px ' + body;
      ctx.fillText('오늘 ' + NAME + topic(NAME), W - M, footY);

      canvas.toBlob(function (blob) {
        if (!blob) return toast('이미지를 만들지 못했습니다.');
        saveFile(NAME + '-근무표-' + model.year + pad(model.month) + '-A4.png', blob);
      }, 'image/png');
    });
  }

  /**
   * 가족에게 보내는 달력 한 장. 도시, 공항 코드, 비행 시각, 휴무만 넣고 버스와 기상 시각은 넣지 않는다.
   * 밝은 색으로 고정한다.
   */
  function exportCalendarImage(model) {
    var K = {
      paper: '#FFFFFF', ink: '#13203A', ink2: '#505C74', ink3: '#8790A3', line: '#D8DEE7', sun: '#B8452A', accent: '#C8810F',
      off: ['#3F7A57', '#DFEDE4'], standby: ['#626C82', '#E5E8EE'], work: ['#9C5537', '#F2E2D9'],
      trips: [['#2C5A97', '#DCE6F4'], ['#A53A66', '#F6DFE8'], ['#0F6E84', '#D5EBF1'], ['#6446A0', '#E7E0F3']]
    };
    var body = '"IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif';
    var mono = '"IBM Plex Mono", Menlo, monospace';
    var display = 'Hahmlet, "AppleMyungjo", serif';
    var W = 1080, P = 48, colW = (W - P * 2) / 7, cellH = 190;
    var lead = model.days[0].weekday;
    var rows = Math.ceil((lead + model.days.length) / 7);
    var gridTop = 250;
    var H = gridTop + 50 + rows * cellH + 130;
    var sum = plan.summarize(model);

    function fit(ctx, text, max) {
      var t = String(text || '');
      while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1);
      return t === String(text || '') ? t : t.slice(0, -1) + '…';
    }

    var ready = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('700 64px Hahmlet'), document.fonts.load('600 28px "IBM Plex Sans KR"'), document.fonts.load('600 22px "IBM Plex Mono"')]).catch(function () {})
      : Promise.resolve();

    ready.then(function () {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = K.paper;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'left';
      ctx.fillStyle = K.accent;
      ctx.font = '600 28px ' + body;
      ctx.fillText('오늘 ' + NAME + topic(NAME), P, 86);
      ctx.fillStyle = K.ink;
      ctx.font = '700 64px ' + display;
      ctx.fillText(model.year + '년 ' + model.month + '월 스케줄', P, 164);
      ctx.fillStyle = K.ink2;
      ctx.font = '500 28px ' + body;
      ctx.fillText('출국 ' + sum.trips + '번, 휴무 ' + sum.offDays + '일' + (sum.cities.length ? ', ' + sum.cities.map(cellName).join(' · ') : ''), P, 214);

      ctx.textAlign = 'center';
      ctx.font = '500 24px ' + body;
      plan.WEEKDAYS.forEach(function (w, i) {
        ctx.fillStyle = i === 0 ? K.sun : K.ink3;
        ctx.fillText(w, P + colW * i + colW / 2, gridTop + 30);
      });

      model.days.forEach(function (day, index) {
        var pos = lead + index;
        var x = P + (pos % 7) * colW + 3;
        var y = gridTop + 50 + Math.floor(pos / 7) * cellH;
        var w = colW - 6, h = cellH - 10;
        var colors = day.trip != null ? K.trips[day.trip % 4]
          : day.kind === 'off' ? K.off : day.kind === 'standby' ? K.standby
          : (day.kind === 'training' || day.kind === 'work') ? K.work : null;
        if (colors) {
          ctx.fillStyle = colors[1];
          roundRect(ctx, x, y, w, h, 16);
          ctx.fill();
        } else {
          ctx.strokeStyle = K.line;
          ctx.lineWidth = 2;
          roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 16);
          ctx.stroke();
        }
        var holiday = holidayOf(day.date);
        var cx = x + w / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = day.weekday === 0 || holiday ? K.sun : K.ink2;
        ctx.font = '600 24px ' + mono;
        ctx.fillText(String(day.day), cx, y + 36);
        var ink = colors ? colors[0] : K.ink;
        ctx.fillStyle = ink;
        ctx.font = (day.kind === 'off' ? '700 30px ' + display : '700 26px ' + body);
        ctx.fillText(fit(ctx, cellName(day.short), w - 10), cx, y + 82);
        ctx.font = '500 17px ' + mono;
        if (day.airports) ctx.fillText(fit(ctx, day.airports, w - 8), cx, y + 112);
        if (day.sub) {
          ctx.font = (/\d/.test(day.sub) ? '600 18px ' + mono : '500 18px ' + body);
          ctx.fillText(fit(ctx, cellName(day.sub), w - 8), cx, y + 140);
        }
        if (holiday) {
          ctx.fillStyle = K.sun;
          ctx.font = '600 16px ' + body;
          ctx.fillText(fit(ctx, holiday, w - 8), cx, y + h - 12);
        }
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = K.ink3;
      ctx.font = '500 22px ' + body;
      ctx.fillText('시각은 한국 시각입니다. 출발일은 출발, 도착일은 도착 시각.', P, H - 60);

      canvas.toBlob(function (blob) {
        if (!blob) return toast('이미지를 만들지 못했습니다.');
        saveFile(NAME + '-schedule-' + model.year + pad(model.month) + '.png', blob);
      }, 'image/png');
    });
  }

  function copyText(text, done) {
    var message = done || '복사했습니다.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(message); }, function () { shareText(text); });
    } else {
      shareText(text);
    }
  }

  function shareText(text) {
    if (nativeApp()) {
      window.Capacitor.nativePromise('Share', 'share', { text: text }).catch(function () {});
    } else if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else {
      window.prompt('아래 글을 복사해 주세요.', text);
    }
  }

  /* ---------------- 캡처 넣기 ---------------- */

  var pending = null;

  function setStatus(text, tone) {
    var el = $('importStatus');
    el.textContent = text;
    el.className = 'status' + (tone ? ' is-' + tone : '');
  }

  /**
   * 캡처에서 못 읽은 날을 알린다.
   *
   * 크루넷 달력은 날마다 코드가 있으니, 빈 날은 곧 읽기에 실패한 날이다. 조용히
   * 넘어가면 그 날이 달력에서 통째로 빠진 채 남고, 한참 뒤에야 눈으로 알아챈다.
   * 첫 주의 1·2·3 처럼 한 자리 날짜가 칸 선과 붙어 읽히면 잘 빠진다.
   */
  function gapNote(gaps) {
    if (!gaps) return '';
    var parts = [];
    if (gaps.small) {
      parts.push('사진이 작아 글자를 잘못 읽었을 수 있습니다. 메신저로 받은 사진이면 원본 캡처를 넣어 주세요');
    }
    var days = gaps.missingDays || [];
    if (days.length) {
      parts.push('못 읽은 날 ' + days.length + '일 (' + gaps.month + '월 ' + days.join(', ') + '일)');
    }
    if ((gaps.strayDays || []).length) {
      parts.push('칸이 어긋난 날 ' + gaps.strayDays.map(function (x) { return x.day + '일'; }).join(', '));
    }
    if (!parts.length) return '';
    return '<p class="callout">' + esc(parts.join(' · ')) +
      ' — 넣은 뒤 그 날짜를 눌러 직접 넣거나, 그 주가 잘리지 않게 다시 캡처해 주세요.</p>';
  }

  function showPreview(result, source, gaps) {
    var list = slim(result.entries);
    if (!list.length) {
      setStatus('날짜와 근무를 찾지 못했습니다. 달력 전체가 보이게 다시 캡처해 주세요.', 'error');
      return;
    }
    pending = list;
    var months = {};
    list.forEach(function (entry) { months[entry.date.slice(0, 7)] = true; });
    var monthNames = Object.keys(months).sort().map(function (m) { return +m.slice(5, 7) + '월'; });

    var byDate = {};
    list.forEach(function (entry) { (byDate[entry.date] = byDate[entry.date] || []).push(entry); });
    var unknown = 0;
    var rows = Object.keys(byDate).sort().map(function (iso) {
      var parts = byDate[iso].map(function (entry) {
        var meaning = meaningOf(entry);
        var strange = (entry.type === 'flight' && !(entry.from && entry.to)) ||
          (entry.type !== 'flight' && plan.wordFor(entry.code, entry.category, db.words).category === 'unknown');
        if (strange) unknown++;
        return '<span' + (strange ? ' class="unknown"' : '') + '>' + esc(meaning) + '</span><span class="c">' + esc(entry.code) + '</span>';
      });
      return '<li><span class="d">' + esc(shortDate(iso)) + '</span><span>' + parts.join(', ') + '</span></li>';
    }).join('');

    $('previewBody').innerHTML =
      '<header class="sheet-head"><p class="eyebrow">' + esc(source) + '</p>' +
      '<h2 id="previewTitle" class="display">' + esc(monthNames.join(', ')) + ' 스케줄 ' + list.length + '건</h2>' +
      '<p class="lede">날짜와 근무가 맞는지 봐 주세요. 넣은 뒤에도 날짜를 눌러 고칠 수 있습니다.</p></header>' +
      gapNote(gaps) +
      (unknown ? '<p class="callout">모르는 코드가 ' + unknown + '개 있어요. 글자를 잘못 읽었을 수 있습니다.</p>' : '') +
      '<ul class="preview-list">' + rows + '</ul>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary btn-grow" id="applyPreview">이대로 넣기</button>' +
      '<button type="button" class="btn btn-grow" data-close>다시 하기</button></div>';
    $('previewSheet').showModal();
  }

  function applyPending() {
    if (!pending) return;
    var months = {};
    pending.forEach(function (entry) { months[entry.date.slice(0, 7)] = true; });
    db.entries = db.entries.filter(function (entry) { return !months[entry.date.slice(0, 7)]; }).concat(pending);
    db.booked = plan.keepBookings(db.booked, db.entries);
    Object.keys(db.edited).forEach(function (iso) { if (months[iso.slice(0, 7)]) delete db.edited[iso]; });
    var first = Object.keys(months).sort()[0];
    pending = null;
    save();
    // 테스트 사람이 예시를 보는 중에 캡처를 넣으면 넣은 스케줄이 보이게 바꾼다
    if (NAME === TEST_NAME && testSource() === 'sample') {
      admin.source = 'real';
      saveAdmin();
    }
    $('previewSheet').close();
    state.year = +first.slice(0, 4);
    state.month = +first.slice(5, 7);
    setStatus('', '');
    go('calendar');
    toast(+first.slice(5, 7) + '월 스케줄을 넣었습니다.');
  }

  function readPhoto(file) {
    if (!file) return;
    if (!ocr.available()) {
      setStatus('이 브라우저는 사진 속 글자를 읽을 수 없습니다. 아래 "글로 붙여넣기"를 써 주세요.', 'error');
      return;
    }
    var now = nowDate();
    setStatus('글자 인식기를 준비하는 중', '');
    ocr.read(file, {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      onProgress: function (step) {
        var percent = Math.round((step.ratio || 0) * 100);
        setStatus(step.phase === 'load'
          ? '글자 인식기를 받는 중 ' + percent + '% (처음 한 번만)'
          : '캡처를 읽는 중 ' + percent + '%', '');
      }
    }).then(function (result) {
      if (!result.text || !result.text.trim()) {
        setStatus('글자를 찾지 못했습니다. 더 또렷한 캡처로 다시 해 주세요.', 'error');
        return;
      }
      var base = result.month || { year: now.getFullYear(), month: now.getMonth() + 1 };
      setStatus(result.month ? base.year + '년 ' + base.month + '월 캡처로 읽었습니다.' : '몇 월인지 못 읽어 이번 달로 넣었습니다.', 'ok');
      showPreview(parser.parse(result.text, base), '캡처에서 읽음', {
        month: base.month,
        missingDays: result.missingDays || [],
        strayDays: result.strayDays || [],
        small: !!(result.prepared && result.prepared.width && result.prepared.width < 800)
      });
    }).catch(function (err) {
      setStatus((err && err.message) || '캡처를 읽지 못했습니다.', 'error');
    }).then(function () {
      $('photo').value = '';
    });
  }

  function readPaste() {
    var text = $('pasteText').value;
    var month = $('pasteMonth').value;
    if (!text.trim()) return setStatus('붙여넣은 글이 없습니다.', 'error');
    var base = month ? { year: +month.slice(0, 4), month: +month.slice(5, 7) }
      : { year: nowDate().getFullYear(), month: nowDate().getMonth() + 1 };
    showPreview(parser.parse(text, base), '붙여넣은 글에서 읽음');
  }

  /* ---------------- 설정 ---------------- */

  function numberField(id, label, hint, value, data, placeholder) {
    return '<div class="field">' +
      '<label for="' + id + '">' + esc(label) + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</label>' +
      '<span class="num-input"><input id="' + id + '" ' + data + ' type="number" inputmode="numeric" min="0" max="300" step="5"' +
      ' value="' + esc(value == null ? '' : value) + '"' + (placeholder != null ? ' placeholder="' + esc(placeholder) + '"' : '') + '>분</span></div>';
  }

  function routeChips(stopId) {
    var icn = [], gmp = [];
    bus.routesAt(stopId).forEach(function (route) {
      var list = route.airport === 'GMP' ? gmp : icn;
      if (list.indexOf(route.id) < 0) list.push(route.id);
    });
    return (icn.length ? '<span class="route-chip">인천 ' + esc(icn.join(', ')) + '</span>' : '') +
      (gmp.length ? '<span class="route-chip">김포 ' + esc(gmp.join(', ')) + '</span>' : '');
  }

  function placeTag(option) {
    return '<span class="place-tag">' + (option.rank + 1) + '순위 ' + esc(option.placeName) + '</span>';
  }

  function placeCard(place, index, total) {
    var id = place.id;
    var off = place.enabled === false;
    var stops = place.stops.map(function (entry) {
      var stop = bus.STOPS[entry.stop];
      if (!stop) return '';
      var key = id + '|' + entry.stop;
      var inputId = 'walk-' + id + '-' + entry.stop;
      return '<div class="place-stop">' +
        '<span class="place-stop-name">' + esc(stop.name) + '<small>' + esc(stop.detail) + '</small>' +
          '<span class="chip-row">' + routeChips(entry.stop) + '</span></span>' +
        '<label class="walk-field" for="' + esc(inputId) + '"><span>집에서</span>' +
          '<span class="num-input"><input id="' + esc(inputId) + '" data-place-walk="' + esc(key) + '" type="number" inputmode="numeric" min="0" max="120" step="1" value="' + esc(entry.walk) + '">분</span></label>' +
        '<button type="button" class="icon-btn" data-place-removestop="' + esc(key) + '" aria-label="' + esc(place.name + '에서 ' + stop.name + ' 빼기') + '">' + ICON.trash + '</button>' +
        '</div>';
    }).join('');
    return '<li class="place' + (off ? ' is-off' : '') + '">' +
      '<div class="place-head">' +
        '<span class="place-rank">' + (index + 1) + '</span>' +
        '<label class="visually-hidden" for="place-name-' + esc(id) + '">' + (index + 1) + '순위 지역 이름</label>' +
        '<input id="place-name-' + esc(id) + '" class="place-name" type="text" data-place-name="' + esc(id) + '" value="' + esc(place.name) + '" maxlength="12" autocomplete="off">' +
        '<span class="place-actions">' +
          '<button type="button" class="icon-btn" data-place-move="' + esc(id) + '|-1" aria-label="' + esc(place.name) + ' 순위 올리기"' + (index === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
          '<button type="button" class="icon-btn" data-place-move="' + esc(id) + '|1" aria-label="' + esc(place.name) + ' 순위 내리기"' + (index === total - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
          '<button type="button" class="icon-btn" data-place-delete="' + esc(id) + '" aria-label="' + esc(place.name) + ' 지우기">' + ICON.trash + '</button>' +
        '</span>' +
      '</div>' +
      '<label class="check" for="place-on-' + esc(id) + '"><input type="checkbox" id="place-on-' + esc(id) + '" data-place-on="' + esc(id) + '"' + (off ? '' : ' checked') + '>추천에 쓰기</label>' +
      (stops || '<p class="note is-warn">정류장이 없습니다. 정류장을 추가해 주세요.</p>') +
      '<button type="button" class="btn btn-small place-add-stop" data-place-addstop="' + esc(id) + '">정류장 추가</button>' +
      '</li>';
  }

  /** 켜 둔 출발지들의 정류장, 순위 순, 겹치지 않게 */
  function usedStops() {
    var list = [];
    bus.activePlaces(db.settings).forEach(function (place) {
      place.stops.forEach(function (entry) {
        if (bus.STOPS[entry.stop] && list.indexOf(entry.stop) < 0) list.push(entry.stop);
      });
    });
    return list;
  }

  function renderSettings() {
    var s = db.settings;
    var places = s.places;
    $('placeList').innerHTML = places.length
      ? places.map(function (place, i) { return placeCard(place, i, places.length); }).join('')
      : '<li class="note is-warn">출발지가 없습니다. 지역을 추가해 주세요.</li>';

    var stops = usedStops();
    var notes = [];
    bus.ROUTES.forEach(function (route) {
      var used = stops.some(function (id) { return Object.prototype.hasOwnProperty.call(route.stops, id); });
      if (used && route.note && notes.indexOf(route.note) < 0) notes.push(route.note);
    });
    $('areaNote').innerHTML = notes.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('');

    document.querySelectorAll('[data-setting]').forEach(function (input) {
      if (document.activeElement !== input && !input.closest('#daySheet')) input.value = s[input.dataset.setting];
    });

    var info = bus.travelInfo();
    $('travelSource').textContent = info
      ? 'TMAP 예측표 사용 중 (' + (info.generated || '날짜 모름') + ' 조회, ' + info.pairs.length + '개 구간). 표에 없는 구간은 시간표나 추정으로 계산합니다.'
      : 'TMAP 예측표가 없어 김포행은 시간표, 나머지는 요일·시간대 추정으로 계산합니다.';

    var travelRows = [];
    ['ICN', 'GMP'].forEach(function (ap) {
      stops.forEach(function (stopId) {
        if (!bus.routesFor(stopId, ap).length) return;
        var stop = bus.STOPS[stopId];
        var outKey = bus.travelKey('out', stopId, ap), inKey = bus.travelKey('in', stopId, ap);
        travelRows.push(numberField('tout-' + stopId + ap, stop.name + ' → ' + airportShort(ap), '비우면 자동, 평소 ' + (stop.toAirport[ap] || '?') + '분',
          s.busToAirport[outKey], 'data-travel-out="' + outKey + '"', '자동'));
        travelRows.push(numberField('tin-' + stopId + ap, airportShort(ap) + ' → ' + stop.name, '비우면 자동, 평소 ' + (stop.fromAirport[ap] || '?') + '분',
          s.busFromAirport[inKey], 'data-travel-in="' + inKey + '"', '자동'));
      });
    });
    $('travelFields').innerHTML = travelRows.join('') || '<p class="note">출발지를 켜면 구간이 나옵니다.</p>';

    var custom = [];
    stops.forEach(function (stopId) {
      ['ICN', 'GMP'].forEach(function (ap) {
        bus.routesFor(stopId, ap).forEach(function (route) {
          if ((route.stops[stopId] || []).length) return;
          var key = route.id + '@' + stopId;
          custom.push('<div class="field field-block"><label for="custom-' + esc(key.replace('@', '-')) + '">' + esc(route.id + ' ' + bus.STOPS[stopId].name + ' → ' + airportShort(ap)) +
            '<small>시간표가 없어 직접 넣어야 추천에 들어갑니다</small></label>' +
            '<textarea id="custom-' + esc(key.replace('@', '-')) + '" data-custom="' + esc(key) + '" rows="2" placeholder="04:30 06:10 07:40">' + esc(s.customOut[key] || '') + '</textarea></div>');
        });
      });
    });
    $('customTimes').innerHTML = custom.join('');

    if ($('togetherBody')) $('togetherBody').innerHTML = togetherHtml(state.year, state.month);
    renderFamilyBox();

    var codes = allCodes();
    var waiting = waitingCodes();
    // 확인할 코드가 있으면 접힌 제목 옆에 개수를 단다
    if ($('codesWaiting')) {
      $('codesWaiting').hidden = !waiting.length || !canEdit();
      $('codesWaiting').textContent = waiting.length ? '확인 ' + waiting.length : '';
    }
    if ($('installFold')) $('installFold').hidden = isStandalone();
    var done = codes.filter(function (code) { return db.confirmed[code]; });
    var editCodes = canEdit();
    if ($('codeAddRow')) $('codeAddRow').hidden = !editCodes;
    if ($('resetWordsRow')) $('resetWordsRow').hidden = !editCodes;
    var known = plan.allKnownCodes().filter(function (code) { return codes.indexOf(code) < 0; });
    var usedInSchedule = function (code) { return codeDays(code) > 0; };
    $('codeList').innerHTML =
      '<p class="code-sub">지금 쓰는 코드 ' + codes.length + '개</p>' +
      (codes.length
        ? '<div class="code-table">' + codes.map(function (code) { return codeLine(code, usedInSchedule(code) || !!db.words[code]); }).join('') + '</div>'
        : '<p class="note">스케줄을 넣으면 여기에 코드가 나옵니다.</p>') +
      '<details class="codes-done"><summary>앱이 뜻을 아는 코드 ' + known.length + '개 더 보기</summary><div class="code-table">' +
        known.map(function (code) { return codeLine(code, false); }).join('') + '</div></details>' +
      (!editCodes ? '' : '<p class="code-sub">고치기</p>' + (waiting.length
        ? '<p class="code-count">확인할 코드 ' + waiting.length + '개</p>' +
          waiting.map(function (code) { return codeRow(code, 'set'); }).join('') +
          (waiting.length > 1 ? '<div class="btn-row"><button type="button" id="confirmAllWords" class="btn btn-small">' + waiting.length + '개 모두 맞음</button></div>' : '')
        : '<p class="note">' + (codes.length ? '확인할 코드가 없습니다. 새 스케줄에 처음 보는 코드가 나오면 여기에 뜹니다.' : '스케줄을 넣으면 여기에 코드가 나옵니다.') + '</p>') +
      (done.length
        ? '<details class="codes-done"><summary>확정한 코드 ' + done.length + '개 다시 고치기</summary><div class="code-list">' +
          done.map(function (code) { return codeRow(code, 'done'); }).join('') + '</div></details>'
        : ''));

    $('timetableSummary').textContent = '내 출발지 버스 시간표 보기';
    var tables = [];
    bus.ROUTES.forEach(function (route) {
      var used = stops.filter(function (id) { return Object.prototype.hasOwnProperty.call(route.stops, id); });
      if (!used.length) return;
      used.forEach(function (stopId) {
        var out = bus.departuresToAirport(route, stopId, s);
        tables.push('<p class="tt-head">' + esc(route.id + ' ' + bus.STOPS[stopId].name + ' → ' + airportFull(route.airport)) + '</p>' +
          (out.length ? '<ul class="tt">' + out.slice().sort(function (a, b) { return a - b; }).map(function (m) { return '<li>' + bus.hhmm(m) + '</li>'; }).join('') + '</ul>' : '<p class="note">시각이 없습니다.</p>'));
      });
      var back = (route.fromAirport || []).map(bus.toMin);
      tables.push('<p class="tt-head">' + esc(route.id + ' ' + airportFull(route.airport) + ' → 성남·용인') + '</p>' +
        (back.length ? '<ul class="tt">' + back.map(function (m) { return '<li>' + bus.hhmm(m) + '</li>'; }).join('') + '</ul>'
          : '<p class="note">' + esc(route.fromAirportRange || '시각표 없음') + '</p>') +
        '<p class="note">출처: ' + esc(route.source) + '</p>');
    });
    $('timetable').innerHTML = (tables.join('') || '<p class="note">켜 둔 출발지가 없습니다.</p>') +
      '<p class="note">시간표는 바뀔 수 있으니 예매할 때 한 번 더 확인해 주세요.</p>';
  }

  function setMap(field, key, value) {
    db.settings[field] = db.settings[field] || {};
    if (value === '' || value == null) delete db.settings[field][key];
    else db.settings[field][key] = value;
  }

  function onSettingInput(input) {
    var data = input.dataset;
    if (data.setting) {
      db.settings[data.setting] = input.value === '' ? bus.DEFAULTS[data.setting] : Math.max(0, +input.value);
    } else if (data.placeWalk) {
      var parts = data.placeWalk.split('|');
      var place = placeById(parts[0]);
      var entry = place && place.stops.filter(function (e) { return e.stop === parts[1]; })[0];
      if (!entry) return;
      entry.walk = input.value === '' ? 0 : Math.max(0, +input.value);
    } else if (data.travelOut) {
      setMap('busToAirport', data.travelOut, input.value === '' ? '' : Math.max(1, +input.value));
    } else if (data.travelIn) {
      setMap('busFromAirport', data.travelIn, input.value === '' ? '' : Math.max(1, +input.value));
    } else if (data.custom) {
      setMap('customOut', data.custom, input.value.trim() ? input.value : '');
    } else {
      return;
    }
    save();
    renderTicket();
    renderReminders();
  }

  /* ---------------- 출발지 고치기 ---------------- */

  function placeById(id) {
    var places = db.settings.places;
    for (var i = 0; i < places.length; i++) if (places[i].id === id) return places[i];
    return null;
  }

  function afterPlacesChange() {
    save();
    renderSettings();
    renderTicket();
    renderReminders();
  }

  function movePlace(id, delta) {
    var places = db.settings.places;
    var from = places.indexOf(placeById(id));
    var to = from + delta;
    if (from < 0 || to < 0 || to >= places.length) return;
    places.splice(to, 0, places.splice(from, 1)[0]);
    afterPlacesChange();
    toast(places[to].name + '을(를) ' + (to + 1) + '순위로 옮겼습니다.');
  }

  function deletePlace(id) {
    var place = placeById(id);
    if (!place || !window.confirm(place.name + ' 출발지를 지울까요?')) return;
    db.settings.places.splice(db.settings.places.indexOf(place), 1);
    afterPlacesChange();
    toast(place.name + ' 출발지를 지웠습니다.');
  }

  function removeStop(key) {
    var parts = key.split('|');
    var place = placeById(parts[0]);
    if (!place) return;
    place.stops = place.stops.filter(function (e) { return e.stop !== parts[1]; });
    afterPlacesChange();
  }

  /* ---------------- 정류장 고르기 ---------------- */

  function openPicker(mode, placeId) {
    state.picker = { mode: mode, placeId: placeId, loc: (state.picker && state.picker.loc) || null, selected: {}, name: '' };
    renderPicker();
    if (!$('pickerSheet').open) $('pickerSheet').showModal();
  }

  function renderPicker() {
    var p = state.picker;
    var place = p.placeId ? placeById(p.placeId) : null;
    var have = place ? place.stops.map(function (e) { return e.stop; }) : [];
    var list = p.loc
      ? bus.stopsNear(p.loc.lat, p.loc.lon)
      : Object.keys(bus.STOPS).map(function (id) { return { id: id, km: null }; });
    var rows = list.map(function (item) {
      var stop = bus.STOPS[item.id];
      var owned = have.indexOf(item.id) >= 0;
      return '<li><label class="pick' + (owned ? ' is-have' : '') + '" for="pick-' + item.id + '">' +
        '<input type="checkbox" id="pick-' + item.id + '" data-pick-stop="' + item.id + '"' + (owned ? ' checked disabled' : (p.selected[item.id] ? ' checked' : '')) + '>' +
        '<span class="pick-name">' + esc(stop.name) +
          '<small>' + esc(stop.town + ', ' + stop.detail) + (item.km != null ? ', 약 ' + item.km.toFixed(1) + 'km' : '') + (owned ? ', 이미 있음' : '') + '</small>' +
          '<span class="chip-row">' + routeChips(item.id) + '</span></span></label></li>';
    }).join('');
    $('pickerBody').innerHTML =
      '<header class="sheet-head"><p class="eyebrow">' + (p.mode === 'new' ? '지역 추가' : esc(place ? place.name : '') + ' 정류장 추가') + '</p>' +
      '<h2 id="pickerTitle" class="display">' + (p.mode === 'new' ? '어느 정류장에서 타나요' : '정류장 고르기') + '</h2>' +
      '<p class="lede">고른 정류장에 서는 공항버스를 자동으로 가져옵니다. 새 지역은 맨 아래 순위로 들어갑니다.</p></header>' +
      (p.mode === 'new' ? '<div class="field field-block"><label for="pickName">지역 이름<small>비워 두면 첫 정류장 이름을 씁니다</small></label>' +
        '<input id="pickName" type="text" maxlength="12" placeholder="예: 정자, 부모님 댁" value="' + esc(p.name) + '" autocomplete="off"></div>' : '') +
      '<div class="btn-row"><button type="button" class="btn btn-grow" data-locate>' + ICON.locate +
        (p.loc ? '내 위치에서 가까운 순으로 정렬함' : '내 위치에서 가까운 순으로 보기') + '</button></div>' +
      '<ul class="pick-list">' + rows + '</ul>' +
      '<p class="note">지금은 성남, 용인에서 인천·김포 가는 공항버스 정류장만 들어 있습니다. 거리는 직선거리 대략값입니다.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary btn-grow" data-pick-confirm>' + (p.mode === 'new' ? '이 지역 추가' : '정류장 추가') + '</button>' +
      '<button type="button" class="btn btn-grow" data-close>취소</button></div>';
  }

  function keepPickerName() {
    if (state.picker && $('pickName')) state.picker.name = $('pickName').value;
  }

  function locate() {
    if (!navigator.geolocation) return toast('이 브라우저는 위치를 알려 주지 않습니다.');
    keepPickerName();
    toast('위치를 확인하는 중입니다.');
    navigator.geolocation.getCurrentPosition(function (pos) {
      state.picker.loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      renderPicker();
    }, function () {
      toast('위치를 가져오지 못했습니다. 위치 권한을 허용했는지 확인해 주세요.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  }

  function confirmPicker() {
    var p = state.picker;
    var chosen = Object.keys(p.selected).filter(function (id) { return p.selected[id]; });
    if (!chosen.length) return toast('정류장을 하나 이상 골라 주세요.');
    if (p.mode === 'new') {
      var name = ($('pickName') && $('pickName').value.trim()) || bus.STOPS[chosen[0]].name.replace(/역$/, '');
      db.settings.places.push({
        id: 'p' + Date.now().toString(36),
        name: name,
        enabled: true,
        stops: chosen.map(function (id) { return { stop: id, walk: 15 }; })
      });
      toast(name + '을(를) ' + db.settings.places.length + '순위로 추가했습니다. 집에서 걸리는 시간을 맞춰 주세요.');
    } else {
      var place = placeById(p.placeId);
      chosen.forEach(function (id) {
        if (!place.stops.some(function (e) { return e.stop === id; })) place.stops.push({ stop: id, walk: 15 });
      });
      toast(place.name + '에 정류장을 추가했습니다.');
    }
    $('pickerSheet').close();
    afterPlacesChange();
  }

  /* ---------------- 광고 ---------------- */

  var adsLoaded = false;

  /** config.js 의 ADS.enabled 가 true 일 때만 맨 아래 광고 자리를 채운다. */
  function renderAds() {
    var slot = $('adSlot');
    var ads = config.ADS || {};
    if (!ads.enabled || adsLoaded) {
      slot.hidden = !ads.enabled;
      return;
    }
    adsLoaded = true;
    slot.hidden = false;
    var script = document.createElement('script');
    script.async = true;
    if (ads.provider === 'adfit') {
      slot.innerHTML = '<p class="ad-label">광고</p><ins class="kakao_ad_area" style="display:none" data-ad-unit="' + esc(ads.adfit.unit) +
        '" data-ad-width="' + esc(ads.adfit.width) + '" data-ad-height="' + esc(ads.adfit.height) + '"></ins>';
      script.src = 'https://t1.daumcdn.net/kas/static/ba.min.js';
      slot.appendChild(script);
    } else {
      slot.innerHTML = '<p class="ad-label">광고</p><ins class="adsbygoogle" style="display:block" data-ad-client="' + esc(ads.adsense.client) +
        '" data-ad-slot="' + esc(ads.adsense.slot) + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ads.adsense.client);
      script.crossOrigin = 'anonymous';
      script.onload = function () {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* 광고가 안 떠도 앱은 돈다 */ }
      };
      document.head.appendChild(script);
    }
  }

  /* ---------------- 여러 사람 ---------------- */

  function renderTitle() {
    var title = '오늘 ' + NAME + topic(NAME);
    $('appTitle').textContent = title;
    document.title = title;
    if ($('personNow')) $('personNow').textContent = NAME;
  }

  function renderPeople() {
    var shown = visiblePeople();
    var joined = !!groupInfo();
    var manager = isManager();
    var viewer = joined && !manager;
    var list = shown.map(function (person) {
      var on = person.id === people.current;
      var where = person.follow ? '가족 링크' : person.name === TEST_NAME ? '테스트' : '이 폰에만';
      return '<li class="person' + (on ? ' is-current' : '') + '">' +
        '<button type="button" class="person-main" data-person-switch="' + esc(person.id) + '"' + (on ? ' aria-current="true"' : '') + '>' +
          '<span class="person-dot" aria-hidden="true"></span><span class="person-name">' + esc(person.name) + '<small>' + esc(where) + '</small></span>' +
          (on ? '<span class="route-chip">보는 중</span>' : '') + '</button>' +
        (viewer ? '' : '<button type="button" class="icon-btn" data-person-rename="' + esc(person.id) + '" aria-label="' + esc(person.name) + ' 이름 바꾸기">' + ICON.edit + '</button>') +
        (shown.length > 1 || person.follow || hasSchedule(person) ? '<button type="button" class="btn btn-small btn-quiet" data-person-delete="' + esc(person.id) + '">지우기</button>' : '') +
        '</li>';
    }).join('');
    var emptyRoster = joined && !people.list.some(function (p) { return p.follow; });
    var linkBlock = emptyRoster
      ? '<p class="note">아직 가족 명단이 없습니다. ' + (manager ? '위에서 이름을 적고 추가하면 가족 모두의 폰에 들어갑니다.' : '관리자가 사람을 추가하면 여기에 들어옵니다.') + '</p>'
      : !joined
      ? '<p class="note">가족 링크는 설정의 "가족 링크, 관리자"에서 넣습니다.</p>'
      : manager
        ? '<p class="note">가족 링크 보내기와 관리자 끄기는 설정의 "가족 링크, 관리자"에 있습니다.</p>'
        : '<p class="note">가족 링크로 받아 봅니다. 스케줄은 관리자 폰에서 올립니다.</p>';
    $('peopleBody').innerHTML =
      '<header class="sheet-head"><p class="eyebrow">누구 스케줄</p>' +
      '<h2 id="peopleTitle" class="display">스케줄 보는 사람</h2>' +
      '<p class="lede">볼 사람을 누르면 그 사람 달력으로 바뀝니다. ' + (joined && manager
        ? '이 폰은 관리자라서 추가하거나 지우면 가족 모두의 폰에 반영됩니다.'
        : joined ? '지우기는 이 폰에서만 숨기고 가족 폰에는 영향이 없습니다.' : '지우기는 이 폰에서만 지웁니다.') + '</p></header>' +
      '<ul class="people-list">' + list + '</ul>' +
      (viewer ? '' : '<div class="edit-add"><label class="visually-hidden" for="newPersonName">새 사람 이름</label>' +
        '<input id="newPersonName" type="text" maxlength="10" placeholder="새 사람 이름 (예: 지현)" autocomplete="off">' +
        '<button type="button" class="btn btn-small" id="addPerson">추가</button></div>') +
      '<section class="block"><h3 class="block-title">가족 링크</h3>' + linkBlock + '</section>';
  }

  function openPeople() {
    renderPeople();
    if (!$('peopleSheet').open) $('peopleSheet').showModal();
  }

  function switchPerson(id, message) {
    if (!people.list.some(function (p) { return p.id === id; })) return;
    save();
    people.current = id;
    savePeople();
    NAME = currentPerson().name;
    KEY = keyFor(id);
    initDb();
    state.openDate = null;
    state.editOpen = null;
    document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    pickMonth();
    renderTitle();
    go('calendar');
    toast(message || NAME + ' 스케줄로 바꿨습니다.');
  }

  function addPerson(name) {
    var clean = String(name || '').trim();
    if (!clean) return toast('이름을 적어 주세요.');
    if (people.list.some(function (p) { return p.name === clean; })) return toast('같은 이름이 이미 있습니다.');
    var id = 'u' + Date.now().toString(36);
    var group = groupInfo();
    if (group && isManager() && sync) {
      // 관리자 폰: 가족 링크 명단에 넣어 모든 가족 폰에 보이게 한다
      var link = sync.newLink();
      group.people.push({ name: clean, id: link.id, key: link.key });
      saveGroup(group);
      people.list.push({ id: id, name: clean, follow: { id: link.id, key: link.key, at: null, error: '' } });
      savePeople();
      switchPerson(id, clean + '을(를) 가족 링크에 추가했습니다. 캡처를 넣으면 가족 모두에게 보입니다.');
      dropEmptyLocals();
      return ensureTokens().then(syncDirectory).catch(function (err) { toast('가족 명단을 올리지 못했습니다: ' + err.message); });
    }
    people.list.push({ id: id, name: clean });
    savePeople();
    switchPerson(id, clean + '을(를) 이 폰에만 추가했습니다. 캡처를 넣어 주세요.');
  }

  function renamePerson(id) {
    var person = people.list.filter(function (p) { return p.id === id; })[0];
    if (!person) return;
    var next = window.prompt('새 이름', person.name);
    if (!next || !next.trim()) return;
    person.name = next.trim();
    savePeople();
    if (id === people.current) NAME = person.name;
    renderTitle();
    renderPeople();
    render();
  }

  /**
   * 사람 지우기. 관리자 폰에서 가족 링크 사람을 지우면 가족 모두의 폰에서 빠지고 올린 스케줄도 지운다.
   * 보는 폰은 이 폰에서만 숨긴다. 마지막 사람도 지울 수 있고, 모두 지우면 빈 '나' 하나가 남는다.
   */
  function deletePerson(id) {
    var person = people.list.filter(function (p) { return p.id === id; })[0];
    if (!person) return;
    var group = groupInfo();
    if (person.follow && group) {
      var followId = person.follow.id;
      if (isManager()) {
        if (!window.confirm(person.name + '을(를) 가족 모두의 폰에서 지울까요? 올린 스케줄도 함께 지워집니다.')) return;
        var tokens = (managerInfo() || {}).tokens || {};
        group.people = group.people.filter(function (m) { return m.id !== followId; });
        group.removed = unionIds(group.removed, [followId]);
        saveGroup(group);
        removePeople([id]);
        toast(person.name + '을(를) 가족 명단에서 지웠습니다.');
        var dropRow = tokens[followId] && familyOn()
          ? familyApi().remove(followId, tokens[followId]).catch(function () { /* 올린 스케줄이 없으면 그대로 */ })
          : Promise.resolve();
        return dropRow.then(syncDirectory).catch(function (err) { toast('가족 명단을 올리지 못했습니다: ' + err.message); });
      }
      if (!window.confirm(person.name + '을(를) 이 폰에서 숨길까요? 가족 링크의 스케줄은 그대로 남고, 관리자가 지우지 않는 한 다른 폰에는 보입니다.')) return;
      group.hidden = unionIds(group.hidden, [followId]);
      saveGroup(group);
      removePeople([id]);
      return toast(person.name + '을(를) 이 폰에서 숨겼습니다.');
    }
    if (!window.confirm(person.name + '을(를) 이 폰에서 지울까요? 넣은 스케줄과 설정이 모두 지워집니다.')) return;
    removePeople([id]);
    toast(person.name + '을(를) 지웠습니다.');
  }

  /* ---------------- 화면 전환 ---------------- */

  function go(view) {
    if (view === 'import' && !canEdit()) {
      toast(NAME + ' 스케줄은 가족 링크로 받아 봅니다. 올리려면 설정에서 관리자를 켜 주세요.');
      view = state.view === 'import' ? 'calendar' : (state.view || 'calendar');
    }
    state.view = view;
    ['calendar', 'import', 'settings'].forEach(function (name) {
      $('view-' + name).hidden = name !== view;
    });
    document.querySelectorAll('.tab').forEach(function (tab) {
      var on = tab.dataset.go === view;
      tab.classList.toggle('is-active', on);
      if (on) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    });
    document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    $('monthSwitch').hidden = view !== 'calendar';
    $('backButton').hidden = view === 'calendar';
    if (view === 'calendar') render();
    if (view === 'settings') renderSettings();
    window.scrollTo(0, 0);
  }

  /** 테스트 모드 띠(달력 위)와 설정의 테스트 모드 칸 */
  function renderAdmin() {
    var banner = $('adminBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'adminBanner';
      banner.className = 'admin-banner';
      $('sampleBanner').parentNode.insertBefore(banner, $('sampleBanner'));
    }
    banner.hidden = !fakeToday();
    banner.innerHTML = fakeToday()
      ? '<span><b>테스트 모드</b> 오늘을 ' + esc(dateLabel(admin.today, true) + ' ' + (admin.time || '09:00')) + '로 보고 있어요</span>' +
        '<button type="button" class="link-btn" data-admin-reset>실제 오늘로</button>'
      : '';
    var panel = $('adminPanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'adminPanel';
      $('codesPanel').parentNode.insertBefore(panel, $('codesPanel').nextSibling);
    }
    if (!admin.on) {
      panel.className = 'admin-off';
      panel.innerHTML = '<button type="button" id="adminOn" class="link-btn">테스트 모드</button>';
      return;
    }
    var d = nowDate();
    panel.className = 'panel';
    panel.innerHTML = '<h3 class="panel-title">테스트 모드</h3>' +
      '<p class="note">예전 스케줄을 넣고 그날이 오늘인 것처럼 봅니다. 오늘 카드, 예매 알림, 버스 추천이 이 날짜와 시각 기준으로 바뀝니다. 공항 실시간 정보는 가져오지 않습니다. 실제 스케줄과 섞이지 않게 "테스트" 같은 사람을 추가해서 넣어 보세요.</p>' +
      '<div class="admin-fields">' +
        '<label for="adminDate">오늘로 볼 날짜<input id="adminDate" type="date" value="' + esc(admin.today || todayIso()) + '"></label>' +
        '<label for="adminTime">시각<input id="adminTime" type="time" value="' + esc(admin.time || pad(d.getHours()) + ':' + pad(d.getMinutes())) + '"></label>' +
      '</div>' +
      '<div class="btn-row"><button type="button" id="adminApply" class="btn btn-primary btn-grow">이 날로 보기</button>' +
        '<button type="button" class="btn btn-grow" data-admin-reset>실제 오늘로</button></div>' +
      '<p class="fields-label">테스트 사람에게 보여 줄 스케줄</p>' +
      '<div class="kind-row two">' +
        '<button type="button" class="kind-btn' + (testSource() === 'sample' ? ' is-on' : '') + '" data-test-source="sample" aria-pressed="' + (testSource() === 'sample') + '">예시 스케줄</button>' +
        '<button type="button" class="kind-btn' + (testSource() === 'real' ? ' is-on' : '') + '" data-test-source="real" aria-pressed="' + (testSource() === 'real') + '">넣은 스케줄</button>' +
      '</div>' +
      '<p class="note">예시 스케줄은 앱을 보여 주려고 지어낸 근무표입니다. 넣은 스케줄은 테스트 사람에게 캡처로 넣은 것이고, 이 폰에만 저장됩니다.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-grow" data-open-people>사람 추가, 바꾸기</button>' +
        '<button type="button" class="btn btn-grow" data-go="import">캡처 넣기</button></div>' +
      '<div class="btn-row"><button type="button" id="adminOff" class="btn btn-quiet">테스트 모드 끄기</button></div>';
  }

  function render() {
    renderAdmin();
    // 예시를 보고 있거나, 새로 추가한 사람이라 스케줄이 비어 있으면 캡처를 넣으라고 알린다
    var empty = !rawEntries().length;
    // 가족 링크 사람이 아니면 이 폰에만 저장된다. 가족이 못 보는 상태라고 알려 준다.
    var me = currentPerson();
    var localOnly = !isSample() && !empty && !(me && me.follow) && NAME !== TEST_NAME;
    $('sampleBanner').hidden = !(isSample() || empty || localOnly);
    $('sampleText').innerHTML = isSample()
      ? (NAME === TEST_NAME ? '<strong>테스트</strong> 사람이라 예시 스케줄이 보입니다.' : '지금 보이는 건 <strong>예시 스케줄</strong>입니다.')
      : empty ? '<strong>' + esc(NAME) + '</strong> 스케줄이 아직 없습니다.'
      : '<strong>' + esc(NAME) + '</strong> 스케줄은 이 폰에만 있습니다. 가족에게는 안 보여요.';
    $('sampleGo').textContent = localOnly ? '가족과 나누기' : NAME + ' 캡처 넣기';
    $('sampleGo').dataset.go = localOnly ? 'settings' : 'import';
    var editable = canEdit();
    $('sampleGo').hidden = !editable && !localOnly;
    document.querySelectorAll('.tab[data-go="import"]').forEach(function (tab) { tab.hidden = !editable; });
    if ($('clearData')) $('clearData').hidden = !editable;
    renderInstall();
    renderTicket();
    renderReminders();
    renderMonth();
    if (state.openDate && $('daySheet').open) $('sheetBody').innerHTML = sheetHtml(findDay(state.openDate));
    if ($('exportSheet').open) $('exportBody').innerHTML = exportSheetHtml(modelFor(state.year, state.month));
    if (state.view === 'settings') renderSettings();
  }

  var toastTimer = null;
  function toast(text) {
    var el = $('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function shiftMonth(delta) {
    var m = state.month + delta, y = state.year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    state.year = y;
    state.month = m;
    renderMonth();
  }

  /* ---------------- 이벤트 ---------------- */

  document.addEventListener('click', function (event) {
    var target = event.target.closest('button, a');
    if (!target) {
      // 판 바깥(어두운 곳)을 누르면 닫는다
      if (event.target.tagName === 'DIALOG') event.target.close();
      return;
    }
    var data = target.dataset;
    if (data.go) return go(data.go);
    if (target.hasAttribute('data-close')) return target.closest('dialog').close();
    if (target.id === 'openExport') return openExport();
    if (data.date) return openDay(data.date);
    if (target.id === 'monthPrev') return shiftMonth(-1);
    if (target.id === 'monthNext') return shiftMonth(1);
    if (target.id === 'applyPreview') return applyPending();
    if (target.id === 'pasteGo') return readPaste();
    if (target.id === 'exportMonth') return exportMonth();
    if (target.hasAttribute('data-open-receive')) {
      var askPaste = function () {
        var typed = window.prompt('가족에게 받은 가족 링크를 붙여 넣어 주세요.');
        if (typed) openLinkText(typed);
      };
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          if (text && /#g=/.test(text)) return openLinkText(text.trim());
          askPaste();
        }, askPaste);
        return;
      }
      return askPaste();
    }
    if (target.hasAttribute('data-family-qr')) return showFamilyQr();
    if (target.hasAttribute('data-family-qr-save')) return saveFamilyQr();
    if (data.familySend) {
      if (!familyUrl()) return toast('보낼 링크가 없습니다.');
      return shareText('가족 스케줄 링크입니다. 오늘 민주는 앱을 열고 설정, 가족 링크, 받은 링크 넣기를 누르면 들어가요.\n' + familyUrl());
    }
    if (data.familyCopy) {
      if (!familyUrl()) return toast('복사할 링크가 없습니다.');
      return copyText(familyUrl(), '가족 링크를 복사했습니다.');
    }
    if (target.hasAttribute('data-manager-on')) {
      var managerGroup = groupInfo();
      if (!managerGroup) return toast('가족 링크를 먼저 넣어 주세요.');
      var managerPin = window.prompt('관리자 비밀번호를 넣어 주세요.');
      if (!managerPin) return;
      managerPin = managerPin.trim();
      return sync.pinCheck(managerGroup.salt, managerPin).then(function (check) {
        if (check !== managerGroup.check) return toast('비밀번호가 맞지 않습니다.');
        return Promise.all(managerGroup.people.map(function (member) {
          return sync.writeToken(member.id, managerPin).then(function (token) { return [member.id, token]; });
        })).then(function (pairs) {
          var tokens = {};
          pairs.forEach(function (pair) { tokens[pair[0]] = pair[1]; });
          localStorage.setItem(MANAGER_KEY, JSON.stringify({ tokens: tokens, pin: managerPin, at: new Date().toISOString() }));
          render();
          if (state.view === 'settings') renderFamilyBox();
          toast('관리자를 켰습니다. 이 폰에서 캡처를 넣고 일정을 고칠 수 있습니다.');
          ensureTokens().then(function () { return pullFamilies(false); });
        });
      });
    }
    if (target.hasAttribute('data-manager-off')) {
      if (!window.confirm('관리자를 끌까요? 이 폰은 보기만 하게 됩니다.')) return;
      localStorage.removeItem(MANAGER_KEY);
      people.list.forEach(function (p) { if (p.follow) delete p.follow.dirty; });
      savePeople();
      render();
      if (state.view === 'settings') renderFamilyBox();
      return toast('관리자를 껐습니다.');
    }
    if (target.hasAttribute('data-family-sync')) {
      // 관리자 폰: 보고 있는 사람의 못 올린 변경을 먼저 올리고, 모두 최신으로 받는다
      var syncing = writeLinkFor(currentPerson()) && currentPerson().follow.dirty ? uploadFamily(false) : Promise.resolve();
      return syncing.then(function () { return pullFamilies(true); });
    }
    if (data.togetherShift) {
      state.month += +data.togetherShift;
      if (state.month < 1) { state.month = 12; state.year -= 1; }
      if (state.month > 12) { state.month = 1; state.year += 1; }
      render();
      $('togetherBody').innerHTML = togetherHtml(state.year, state.month);
      return;
    }
    if (target.id === 'adminOn') {
      admin.on = true;
      saveAdmin();
      render();
      return toast('테스트 모드를 켰습니다. 날짜를 고르고 "이 날로 보기"를 누르세요.');
    }
    if (target.id === 'adminApply') {
      var adminDay = $('adminDate').value;
      var adminTime = $('adminTime').value || '09:00';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(adminDay)) return toast('날짜를 골라 주세요.');
      admin.today = adminDay;
      admin.time = adminTime;
      saveAdmin();
      state.year = +adminDay.slice(0, 4);
      state.month = +adminDay.slice(5, 7);
      render();
      return toast(dateLabel(adminDay, true) + ' ' + adminTime + '을 오늘로 봅니다.');
    }
    if (target.hasAttribute('data-admin-reset')) {
      delete admin.today;
      delete admin.time;
      saveAdmin();
      var adminReal = new Date();
      state.year = adminReal.getFullYear();
      state.month = adminReal.getMonth() + 1;
      render();
      return toast('실제 오늘로 돌아왔습니다.');
    }
    if (data.testSource) {
      admin.source = data.testSource === 'real' ? 'real' : 'sample';
      saveAdmin();
      var sourceText = admin.source === 'real' ? '넣은 스케줄' : '예시 스케줄';
      var testPerson = people.list.filter(function (p) { return p.name === TEST_NAME; })[0];
      if (testPerson && testPerson.id === people.current) {
        render();
        return toast('테스트 사람에게 ' + sourceText + '을 보여 줍니다.');
      }
      if (testPerson) return switchPerson(testPerson.id, '테스트 사람으로 바꿨습니다. ' + sourceText + '이 보입니다.');
      var testId = 'u' + Date.now().toString(36);
      people.list.push({ id: testId, name: TEST_NAME });
      savePeople();
      return switchPerson(testId, '테스트 사람을 만들었습니다. ' + sourceText + '이 보입니다.');
    }
    if (target.id === 'adminOff') {
      admin = {};
      saveAdmin();
      if (NAME === TEST_NAME) {
        var backPerson = visiblePeople()[0];
        if (backPerson) return switchPerson(backPerson.id, '테스트 모드를 껐습니다. ' + backPerson.name + ' 스케줄로 돌아갑니다.');
      }
      render();
      return toast('테스트 모드를 껐습니다.');
    }
    if (data.hoursMonth) {
      state.year = +data.hoursMonth.slice(0, 4);
      state.month = +data.hoursMonth.slice(5, 7);
      render();
      $('hoursBody').innerHTML = hoursSheetHtml(modelFor(state.year, state.month));
      return;
    }
    if (target.id === 'flightHours') return openHours();
    if (target.id === 'personButton' || target.hasAttribute('data-open-people')) return openPeople();
    if (data.personSwitch) return data.personSwitch === people.current ? $('peopleSheet').close() : switchPerson(data.personSwitch);
    if (data.personRename) return renamePerson(data.personRename);
    if (data.personDelete) return deletePerson(data.personDelete);
    if (target.id === 'addPerson') return addPerson($('newPersonName').value);
    if (data.placeMove) {
      var move = data.placeMove.split('|');
      return movePlace(move[0], +move[1]);
    }
    if (data.placeDelete) return deletePlace(data.placeDelete);
    if (data.placeRemovestop) return removeStop(data.placeRemovestop);
    if (data.placeAddstop) return openPicker('add', data.placeAddstop);
    if (target.id === 'addPlace') return openPicker('new', null);
    if (target.id === 'resetPlaces') {
      if (window.confirm('출발지를 처음 값(미금, 수지, 분당 서현)으로 되돌릴까요?')) {
        db.settings.places = bus.defaultPlaces();
        afterPlacesChange();
        toast('출발지를 처음 값으로 되돌렸습니다.');
      }
      return;
    }
    if (target.hasAttribute('data-locate')) return locate();
    if (target.hasAttribute('data-pick-confirm')) return confirmPicker();
    if (data.editToggle) {
      state.editOpen = state.editOpen === data.editToggle ? null : data.editToggle;
      $('sheetBody').innerHTML = sheetHtml(findDay(data.editToggle));
      var block = $('sheetBody').querySelector('.edit-block');
      if (block && state.editOpen) block.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (target.hasAttribute('data-go-codes')) {
      go('settings');
      $('codesPanel').open = true;
      $('codesPanel').scrollIntoView({ block: 'start' });
      return;
    }
    if (data.wordOk) {
      db.confirmed[data.wordOk] = true;
      save();
      render();
      return toast(data.wordOk + ' 뜻을 확정했습니다.');
    }
    if (target.id === 'confirmAllWords') {
      waitingCodes().forEach(function (code) { db.confirmed[code] = true; });
      save();
      render();
      return toast('코드 뜻을 모두 확정했습니다.');
    }
    if (target.id === 'addCode') {
      var codeInput = $('newCode');
      var newCode = (codeInput.value || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!/^[A-Z0-9]{1,8}$/.test(newCode)) return toast('코드는 영문과 숫자 8자까지 적어 주세요.');
      if (/^KE\d/.test(newCode)) return toast('편명은 날짜의 일정 고치기에서 넣어 주세요.');
      if (allCodes().indexOf(newCode) >= 0) return toast(newCode + ' 코드는 이미 있습니다.');
      db.words[newCode] = { short: newCode.slice(0, 4), long: newCode, category: 'unknown', added: true };
      delete db.confirmed[newCode];
      save();
      render();
      return toast(newCode + ' 코드를 추가했습니다. 뜻과 종류를 정하고 맞음을 눌러 주세요.');
    }
    if (target.id === 'resetWords') {
      if (!Object.keys(db.words).length && !Object.keys(db.confirmed).length) return toast('고친 코드 뜻이 없습니다.');
      if (window.confirm('고친 코드 뜻과 확정을 모두 처음으로 되돌릴까요? 코드를 다시 확인하게 됩니다.')) {
        db.confirmed = {};
        db.words = {};
        save();
        render();
        toast('코드 뜻을 모두 처음 값으로 되돌렸습니다.');
      }
      return;
    }
    if (target.hasAttribute('data-install') && installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(function () { installPrompt = null; renderInstall(); });
      return;
    }
    if (target.hasAttribute('data-install-dismiss')) {
      db.installDismissed = true;
      save();
      renderInstall();
      return toast('설치 안내는 설정 화면에서 다시 볼 수 있어요.');
    }
    if (data.openTune) {
      // 예매한 뒤 다른 시간 차: 자세히를 펼쳐 다른 차 목록과 시간 고치기를 보여 준다
      var card = target.closest('.bus-card');
      var tune = card && card.querySelector('details.bus-more');
      if (!tune) return;
      state.tuneOpen = state.tuneOpen || {};
      state.tuneOpen[data.openTune] = true;
      tune.open = true;
      tune.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if ((data.book || data.unbook) && !canEdit()) return toast('버스 예매는 관리자 폰에서만 합니다.');
    if (data.book) {
      var b = data.book.split('~');
      db.booked[b[0]] = { route: b[1], stop: b[2], board: +b[3], placeId: b[4], at: todayIso() };
      save();
      render();
      return toast(b[1] + ' ' + (bus.STOPS[b[2]] ? bus.STOPS[b[2]].name : '') + ' ' + bus.hhmm(+b[3]) + ' 차로 예매했다고 적어 두었습니다.');
    }
    if (data.unbook) {
      if (!window.confirm('예매 표시를 지울까요? 버스타고에서 바꾸거나 취소한 뒤 새 차를 골라 주세요.')) return;
      delete db.booked[data.unbook];
      save();
      render();
      return toast('예매 표시를 지웠습니다.');
    }
    if (target.id === 'resetPhone') {
      if (!window.confirm('이 폰의 사람, 스케줄, 가족 링크, 관리자 설정을 모두 지울까요? 되돌릴 수 없습니다.')) return;
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('crew-family.') === 0; }).forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) { return toast('이 폰의 저장소를 지우지 못했습니다.'); }
      if (window.history && history.replaceState) history.replaceState(null, '', location.pathname);
      return location.reload();
    }
    if (target.id === 'shareCalendar') return exportCalendarImage(modelFor(state.year, state.month));

    if (data.export) {
      var model = modelFor(state.year, state.month);
      if (data.export === 'image') return exportImage(model);
      if (data.export === 'text') return copyText(exportText(model), '근무표를 복사했습니다. 카톡에 붙여넣으면 됩니다.');
      if (data.export === 'csv') return exportCsv(model);
    }

    if (data.editRemove != null && data.editDate) {
      var list = codesOn(data.editDate);
      list.splice(+data.editRemove, 1);
      return setDayCodes(data.editDate, list);
    }
    if (data.quickKind) {
      var quick = data.quickKind.split('|');
      var hadFlight = entries().some(function (entry) { return entry.date === quick[0] && entry.type === 'flight'; });
      if (hadFlight && !window.confirm('이 날 비행을 지우고 바꿀까요?')) return;
      return setDayCodes(quick[0], [quick[1]]);
    }
    if (data.editAdd) {
      var input = document.querySelector('[data-edit-add-input="' + data.editAdd + '"]');
      var added = splitCodes(input && input.value);
      var picked = document.querySelector('[data-edit-add-select="' + data.editAdd + '"]');
      if (!added.length && picked && picked.value) added = [picked.value];
      if (!added.length) return toast('목록에서 추가할 일정을 골라 주세요.');
      var baseCodes = codesOn(data.editAdd);
      // 휴무나 대기인 날에 비행을 넣으면 그 코드는 비행으로 바뀐 것으로 본다
      if (added.some(function (code) { return /^[A-Z0-9]{2}\d{2,4}$/.test(code); })) {
        baseCodes = baseCodes.filter(function (code) {
          var cat = plan.wordFor(code, categoryOf(code), db.words).category;
          return cat !== 'off' && cat !== 'standby';
        });
      }
      return setDayCodes(data.editAdd, baseCodes.concat(added));
    }
    if (data.wordReset) {
      delete db.words[data.wordReset];
      save();
      return render();
    }
    if (data.routeReset) {
      state.routeOpen = data.routeReset;
      return setRoute(data.routeReset, '');
    }
    if (data.reset) {
      delete db.overrides[data.reset];
      save();
      return render();
    }
    if (target.id === 'clearData') {
      if (!canEdit()) return toast('받기만 하는 폰에서는 스케줄을 지울 수 없습니다. 설정에서 관리자를 켜 주세요.');
      if (!db.entries.length) {
        return toast(isSample() ? '지금은 예시 스케줄이라 지울 넣은 스케줄이 없습니다.' : '지울 스케줄이 없습니다.');
      }
      if (!window.confirm(NAME + '의 넣은 스케줄을 모두 지울까요? 고친 내용과 예매 표시도 지워집니다. 버스 설정과 코드 뜻은 남습니다.')) return;
      db.entries = [];
      db.overrides = {};
      db.routeFix = {};
      db.edited = {};
      db.booked = {};
      save();
      pickMonth();
      render();
      go('calendar');
      window.scrollTo(0, 0);
      return toast(NAME + ' 스케줄을 모두 지웠습니다. ' + (isSample() ? '지금은 예시 스케줄이 보입니다.' : '달력이 비었습니다.'));
    }
    if (data.alarm) {
      var parts = data.alarm.split('|');
      var ev = findDay(parts[0]).outs.filter(function (e) { return e.code === parts[1]; })[0];
      var lines = ev ? outEvents(ev, false) : [];
      if (!lines.length) return toast('시각이 없어 알림을 만들 수 없습니다.');
      return offerCalendar('wake-' + parts[0] + '.ics', calendarFile(lines));
    }
  });

  document.addEventListener('change', function (event) {
    var input = event.target;
    var data = input.dataset;
    if (input.id === 'photo') return readPhoto(input.files && input.files[0]);
    if (input.id === 'qrPhoto') {
      readQrPhoto(input.files && input.files[0]);
      input.value = '';
      return;
    }
    if (data.blockFix && !canEdit()) return render();
    if (data.blockFix) {
      var raw = input.value.trim();
      if (!raw) {
        delete db.blockFix[data.blockFix];
      } else {
        var minutes = flighttime.toMinutes(raw);
        if (minutes == null || minutes <= 0 || minutes > 24 * 60) return toast('비행시간은 6:10 처럼 시:분으로 적어 주세요.');
        db.blockFix[data.blockFix] = minutes;
      }
      save();
      render();
      $('hoursBody').innerHTML = hoursSheetHtml(modelFor(state.year, state.month));
      return toast(data.blockFix + (raw ? ' 비행시간을 고쳤습니다.' : ' 비행시간을 원래 값으로 돌렸습니다.'));
    }
    if (input.closest('#daySheet') && (data.setting || data.placeWalk || data.travelOut || data.travelIn)) {
      onSettingInput(input);
      toast('바꾼 시간으로 다시 계산했습니다.');
      return render();
    }
    if (data.override) {
      if (input.value) db.overrides[data.override] = input.value;
      else delete db.overrides[data.override];
      save();
      return render();
    }
    if (data.editIndex != null && data.editDate) {
      var list = codesOn(data.editDate);
      var replaced = splitCodes(input.value);
      Array.prototype.splice.apply(list, [+data.editIndex, 1].concat(replaced));
      return setDayCodes(data.editDate, list);
    }
    if (data.word) return setWord(data.word, { short: input.value.trim() });
    if (data.cat) return setWord(data.cat, { category: input.value || 'unknown' });
    if (data.routeFrom || data.routeTo) {
      var routeCode = data.routeFrom || data.routeTo;
      var box = input.closest('.route-edit-body');
      var from = box.querySelector('[data-route-from]').value;
      var to = box.querySelector('[data-route-to]').value;
      if (!from || !to) return;
      if (from === to) return toast('출발 공항과 도착 공항이 같습니다.');
      state.routeOpen = routeCode;
      return setRoute(routeCode, from + '-' + to);
    }
    if (data.placeName) {
      var named = placeById(data.placeName);
      if (named && input.value.trim()) named.name = input.value.trim();
      return afterPlacesChange();
    }
    if (data.placeOn) {
      var toggled = placeById(data.placeOn);
      if (toggled) toggled.enabled = input.checked;
      return afterPlacesChange();
    }
    if (data.pickStop && state.picker) {
      state.picker.selected[data.pickStop] = input.checked;
    }
  });

  document.addEventListener('input', function (event) {
    var input = event.target;
    if (input.closest('#view-settings') && !input.dataset.placeName) onSettingInput(input);
  });

  // 시간 고치기를 연 채로 다시 그려도 열린 상태를 지킨다 (toggle 은 거품이 올라오지 않아 capture 로 받는다)
  document.addEventListener('toggle', function (event) {
    var el = event.target;
    if (el.dataset && el.dataset.tune) {
      state.tuneOpen = state.tuneOpen || {};
      state.tuneOpen[el.dataset.tune] = el.open;
    }
  }, true);

  document.addEventListener('keydown', function (event) {
    var input = event.target;
    if (event.key === 'Enter' && input.id === 'newPersonName') {
      event.preventDefault();
      return addPerson(input.value);
    }
    if (event.key === 'Enter' && input.dataset && input.dataset.editAddInput) {
      event.preventDefault();
      var added = splitCodes(input.value);
      if (added.length) setDayCodes(input.dataset.editAddInput, codesOn(input.dataset.editAddInput).concat(added));
      return;
    }
    if (document.querySelector('dialog[open]') || state.view !== 'calendar') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(input.tagName)) return;
    if (event.key === 'ArrowLeft') shiftMonth(-1);
    if (event.key === 'ArrowRight') shiftMonth(1);
  });

  /* ---------------- 비행 당일 실제 시각 ---------------- */

  var liveBusy = false;

  function liveMinutes() {
    return Math.max(5, +((config.FLIGHT_STATUS || {}).refreshMinutes) || 30);
  }

  /** 오늘 한국 공항(인천, 김포)에서 뜨거나 내리는 비행 */
  function todaysFlights() {
    var iso = todayIso();
    var seen = {};
    return modelFor(+iso.slice(0, 4), +iso.slice(5, 7)).events.filter(function (ev) {
      if (ev.date !== iso || (ev.type !== 'out' && ev.type !== 'in')) return false;
      var korean = ev.type === 'out' ? ev.from : ev.to;
      if (korean !== 'ICN' && korean !== 'GMP') return false;
      var key = ev.code + ev.type;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function refreshLive(manual) {
    if (fakeToday()) {
      if (manual) toast('테스트 모드에서는 공항 실시간 정보를 가져오지 않습니다.');
      return;
    }
    var cfg = config.FLIGHT_STATUS;
    if (!flightstatus || !flightstatus.enabled(cfg)) {
      if (manual) toast('실시간 운항 정보가 꺼져 있습니다. src/family/config.js 에서 켤 수 있어요.');
      return;
    }
    if (liveBusy) return;
    var flights = todaysFlights();
    if (!flights.length) {
      if (manual) toast('오늘은 확인할 비행이 없습니다.');
      return;
    }
    liveBusy = true;
    db.live = db.live || {};
    var changed = [];
    var failed = 0;
    Promise.all(flights.map(function (ev) {
      var key = overrideKey(ev);
      var airport = ev.type === 'out' ? ev.from : ev.to;
      return flightstatus.fetchStatus(cfg, ev.code, airport, ev.type).then(function (status) {
        if (!status) return;
        var before = (db.live[key] && db.live[key].time) || tableTime(ev);
        db.live[key] = { time: status.time, scheduled: status.scheduled, remark: status.remark, gate: status.gate, at: Date.now() };
        if (before && before !== status.time) changed.push(ev.code + ' ' + before + '→' + status.time);
      }).catch(function () { failed++; });
    })).then(function () {
      liveBusy = false;
      db.liveAt = Date.now();
      save();
      render();
      if (changed.length) {
        toast('비행 시각이 바뀌었습니다: ' + changed.join(', ') + '. 버스 추천도 다시 계산했습니다.');
      } else if (manual) {
        toast(failed ? '운항 정보를 가져오지 못했습니다. 잠시 뒤 다시 해 주세요.' : '운항 정보를 확인했습니다. 바뀐 시각은 없습니다.');
      }
    });
  }

  /* ---------------- 시작 ---------------- */

  // 테스트 사람을 보다가 테스트 모드를 끈 채로 다시 열었으면 다른 사람으로 연다
  if (!testMode() && NAME === TEST_NAME) {
    var startPerson = visiblePeople()[0];
    if (startPerson) {
      people.current = startPerson.id;
      savePeople();
      NAME = startPerson.name;
      KEY = keyFor(startPerson.id);
      initDb();
    }
  }

  var now = nowDate();
  $('pasteMonth').value = now.getFullYear() + '-' + pad(now.getMonth() + 1);
  pickMonth();
  renderTitle();
  go('calendar');
  renderAds();

  // 가족 링크로 열었으면 넣는다
  if (sync && sync.fromGroupHash(location.hash)) joinGroup(sync.fromGroupHash(location.hash));

  // 가족 링크로 받는 사람은 열 때, 30분마다, 다시 볼 때 최신으로
  pullFamilies(false);
  setInterval(function () { pullFamilies(false); }, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') pullFamilies(false);
  });

  // 해외 체류 중이면 현지 시각이 흐른다
  setInterval(renderTicket, 60 * 1000);

  // 비행 당일에는 공항 운항 정보를 주기적으로 다시 가져온다
  refreshLive(false);
  setInterval(function () { refreshLive(false); }, liveMinutes() * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && Date.now() - (db.liveAt || 0) > liveMinutes() * 60 * 1000) refreshLive(false);
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') {
    navigator.serviceWorker.register('family-sw.js').catch(function () { /* 오프라인 없이도 동작한다 */ });
  }
})();
