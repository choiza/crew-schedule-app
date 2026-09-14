/**
 * 편명 -> 노선 해결. 세 단계를 순서대로 밟고 먼저 되는 데서 멈춘다.
 *
 *   1단계 원본  크루넷 화면의 "ICN -LAS" 를 그대로 쓴다. 시드와 달라도 원본이 이긴다.
 *              스케줄은 바뀌니까.
 *   2단계 DB    사용자가 고친 값 -> 시드 JSON(data/ke-routes.json) -> 국내선 대역 규칙
 *              -> 예전에 조회해 둔 값. 국내선 대역은 홀수가 a->b, 짝수가 b->a.
 *   3단계 조회  위에서 다 실패한 편명만 Claude 에게 물어본다(routelookup.js).
 *
 * 화면에는 3단계로 채운 것만 표를 단다. 1·2단계는 아무 표시도 하지 않는다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./codes.js'), require('./airports.js'), require('./routedata.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.routes = factory(root.CrewCal.codes, root.CrewCal.airports, root.CrewCal.routedata);
  }
})(typeof self !== 'undefined' ? self : this, function (codes, airports, routedata) {
  'use strict';

  var KEY = 'crew-cal.routes.v1';
  var RETRY_DAYS = 7;                       // 못 찾은 편명은 이레 뒤에 다시 물어본다
  var SEED = (routedata && routedata.SEED) || { routes: {}, domesticRanges: [] };
  var memory = null;

  function storage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__crewcal_probe__', '1');
        localStorage.removeItem('__crewcal_probe__');
        return localStorage;
      }
    } catch (e) { /* 사파리 프라이빗 모드 등 */ }
    return null;
  }

  /* ---------------- 사용자 캐시 ----------------
   * 조회해 온 값과 사용자가 손으로 고친 값이 함께 산다. 시드 JSON 은 건드리지 않는다.
   *   { KE0727: { from, to, source: 'user'|'lookup', at }, KE5901: { fail: true, at } }
   */

  function loadCache() {
    var ls = storage();
    if (!ls) return memory || (memory = {});
    try {
      var raw = ls.getItem(KEY);
      var data = raw ? JSON.parse(raw) : null;
      return (data && typeof data === 'object') ? data : {};
    } catch (e) {
      return {};
    }
  }

  function saveCache(data) {
    var ls = storage();
    if (!ls) { memory = data; return data; }
    try { ls.setItem(KEY, JSON.stringify(data)); } catch (e) { memory = data; }
    return data;
  }

  function normalize(code) {
    var parts = codes && codes.splitFlight ? codes.splitFlight(code) : null;
    if (!parts) return String(code || '').toUpperCase();
    var digits = parts.number;
    while (digits.length < 4) digits = '0' + digits;
    return parts.airline + digits + parts.suffix;
  }

  /** 조회해 온 값이나 사용자가 고친 값을 적어 둔다. */
  function remember(code, from, to, source) {
    var key = normalize(code);
    var iata = airports && airports.findCode ? airports.findCode : function (x) { return x; };
    var a = iata(from);
    var b = iata(to);
    if (!key || !a || !b) return null;
    var data = loadCache();
    data[key] = { from: a, to: b, source: source === 'user' ? 'user' : 'lookup', at: new Date().toISOString() };
    saveCache(data);
    return data[key];
  }

  /** 못 찾았다고 적어 둔다. 이레 동안은 다시 묻지 않는다. */
  function rememberFailure(code) {
    var key = normalize(code);
    if (!key) return null;
    var data = loadCache();
    if (data[key] && data[key].source === 'user') return data[key];   // 손으로 넣은 값은 지우지 않는다
    data[key] = { fail: true, at: new Date().toISOString() };
    saveCache(data);
    return data[key];
  }

  function forget(code) {
    var data = loadCache();
    delete data[normalize(code)];
    saveCache(data);
  }

  function forgetAll() {
    saveCache({});
  }

  /** 캐시에 든 것을 목록으로. 설정 화면이 쓴다. */
  function cacheList() {
    var data = loadCache();
    return Object.keys(data).sort().map(function (code) {
      var row = data[code];
      return {
        code: code,
        from: row.from || null,
        to: row.to || null,
        source: row.source || (row.fail ? 'fail' : null),
        fail: !!row.fail,
        at: row.at || null
      };
    });
  }

  /** 못 찾았다고 적어 둔 지 이레가 지났으면 다시 물어봐도 된다. */
  function staleFailure(row) {
    if (!row || !row.fail || !row.at) return true;
    var then = Date.parse(row.at);
    if (isNaN(then)) return true;
    return (Date.now() - then) > RETRY_DAYS * 24 * 3600 * 1000;
  }

  /* ---------------- 2단계: 시드 + 대역 ---------------- */

  /** 국내선 대역 규칙. 홀수가 a->b, 짝수가 b->a. 대역 밖이면 null. */
  function fromDomesticRange(code) {
    var parts = codes && codes.splitFlight ? codes.splitFlight(code) : null;
    if (!parts) return null;
    var n = +parts.number;
    var ranges = SEED.domesticRanges || [];
    for (var i = 0; i < ranges.length; i++) {
      var band = ranges[i];
      if (n < band.from || n > band.to) continue;
      return n % 2 === 1 ? { from: band.a, to: band.b } : { from: band.b, to: band.a };
    }
    return null;
  }

  function fromSeed(code) {
    var row = (SEED.routes || {})[normalize(code)];
    if (!row || !row.from || !row.to) return null;
    return {
      from: row.from,
      to: row.to,
      // 공동운항이면 실제로 누가 띄우는 편인지, 시즌 같은 덧말이 있으면 그것도 함께.
      codeshare: !!row.codeshare,
      operator: row.operator || null,
      operatorName: row.operatorName || (row.operator ? (SEED.operators || {})[row.operator] : null) || null,
      note: row.note || null
    };
  }

  /* ---------------- 세 단계를 순서대로 ---------------- */

  /**
   * 한 일정의 노선을 정한다.
   *   { from, to, route, source: 'original'|'db'|'lookup', pending }
   * 못 찾으면 { source: null }. pending 은 3단계 조회를 기다리는 중이라는 뜻.
   */
  function resolve(entry) {
    if (!entry || entry.type !== 'flight' || entry.strange) return { source: null };

    // 1단계 — 원본. 시드와 달라도 원본이 이긴다.
    if (entry.route || (entry.from && entry.to)) {
      var parts = entry.route && airports ? airports.splitRoute(entry.route) : null;
      var a = entry.from || (parts && parts.from);
      var b = entry.to || (parts && parts.to);
      if (a && b) return { from: a, to: b, route: a + '/' + b, source: 'original' };
    }

    var code = normalize(entry.code);
    var cache = loadCache()[code];

    // 2단계 — 사용자가 고친 값이 먼저
    if (cache && cache.source === 'user' && cache.from && cache.to) {
      return { from: cache.from, to: cache.to, route: cache.from + '/' + cache.to, source: 'db' };
    }

    var hit = fromSeed(code) || fromDomesticRange(code);
    if (hit) {
      return {
        from: hit.from, to: hit.to, route: hit.from + '/' + hit.to, source: 'db',
        codeshare: !!hit.codeshare,
        operator: hit.operator || null,
        operatorName: hit.operatorName || null,
        note: hit.note || null,
        // 출처가 스스로 미심쩍다고 적어 둔 것은 따로 표시한다
        noteWarn: !!(hit.note && /확인 필요|중복|불확실/.test(hit.note))
      };
    }

    // 예전에 조회해 둔 값
    if (cache && cache.from && cache.to) {
      return { from: cache.from, to: cache.to, route: cache.from + '/' + cache.to, source: 'lookup' };
    }

    // 3단계로 넘길 것인지
    return { source: null, askable: !cache || staleFailure(cache) };
  }

  /**
   * 날짜별 표를 훑어 노선을 채운다. 원본은 건드리지 않고 값만 채워 넣는다.
   * 아직 못 찾은 편명은 unresolved 로 돌려준다(3단계에서 쓴다).
   */
  function apply(entriesByDate) {
    var unresolved = {};
    Object.keys(entriesByDate || {}).forEach(function (date) {
      (entriesByDate[date] || []).forEach(function (entry) {
        var found = resolve(entry);
        if (found.source) {
          entry.route = found.route;
          entry.from = found.from;
          entry.to = found.to;
          entry.routeSource = found.source;
          // 원본이 알려 준 구간이어도 편명으로 공동운항·덧말은 붙여 준다
          var extra = fromSeed(entry.code);
          entry.codeshare = !!(found.codeshare || (extra && extra.codeshare));
          entry.operator = found.operator || (extra && extra.operator) || null;
          entry.operatorName = found.operatorName || (extra && extra.operatorName) || null;
          entry.routeNote = found.note || (extra && extra.note) || null;
          entry.routeNoteWarn = !!(entry.routeNote && /확인 필요|중복|불확실/.test(entry.routeNote));
          return;
        }
        entry.routeSource = null;
        if (found.askable && entry.code) unresolved[normalize(entry.code)] = true;
      });
    });
    return Object.keys(unresolved).sort();
  }

  /** 이어진 날의 같은 편을 한 덩어리로 묶고 출발·기내·도착을 적는다. */
  function linkDays(entriesByDate, resolver) {
    if (!resolver) return entriesByDate;
    resolver.linkSegments(entriesByDate);
    resolver.markLegs(entriesByDate);
    resolver.markDeadhead(entriesByDate);
    return entriesByDate;
  }

  return {
    KEY: KEY,
    RETRY_DAYS: RETRY_DAYS,
    SEED: SEED,
    resolve: resolve,
    apply: apply,
    linkDays: linkDays,
    remember: remember,
    rememberFailure: rememberFailure,
    forget: forget,
    forgetAll: forgetAll,
    cacheList: cacheList,
    loadCache: loadCache,
    staleFailure: staleFailure,
    fromSeed: fromSeed,
    OPERATORS: SEED.operators || {},
    fromDomesticRange: fromDomesticRange,
    normalize: normalize
  };
});
