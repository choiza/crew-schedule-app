/**
 * 파싱 검증 도구 (개발용).
 *
 * 크루넷 원본 글과 앱이 실제로 만든 일정을 날짜별로 나란히 놓고, 건수가 다른
 * 날을 짚어 준다. 3월 1일 국내선 네 편이 소리 없이 사라진 일이 있어, 고칠
 * 때마다 먼저 여기로 확인한다.
 *
 * 왼쪽(원본)은 일부러 아주 단순하게 읽는다. 고치지도 버리지도 않고 코드처럼
 * 생긴 것을 그대로 센다. 파서와 같은 길을 쓰면 무엇이 새는지 알 수 없다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.verify = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  var DAY = /^(\d{1,2})일?$/;
  // 코드처럼 생긴 것: 근무 코드(ATDO) 또는 편명(KE1807). 시각·구간은 세지 않는다.
  var DUTY = /^[A-Z]{1,6}$/;
  var FLIGHT = /^[A-Z]{2}-?\d{1,4}[A-Z]?$/;
  var ROUTE = /^[A-Z]{3}(?:[/\-][A-Z]{3})+$/;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function looksLikeCode(token) {
    if (ROUTE.test(token)) return false;
    return FLIGHT.test(token) || DUTY.test(token);
  }

  /**
   * 원본 글을 날짜 -> 코드 목록으로 읽는다. 고치지 않고 본 대로 센다.
   * '2026-03-01\tKE1807 KE1810' 도 '1 KE1807 KE1810' 도 받는다.
   */
  function readSource(text, opts) {
    var options = opts || {};
    var out = {};
    String(text == null ? '' : text).split(/\r?\n/).forEach(function (line) {
      var raw = line.trim();
      if (!raw) return;
      var tokens = raw.split(/[\s,|]+/).filter(Boolean);
      if (!tokens.length) return;

      var head = tokens[0];
      var date = null;
      var m = head.match(DATE);
      if (m) date = m[1] + '-' + pad2(+m[2]) + '-' + pad2(+m[3]);
      else if (DAY.test(head) && options.year && options.month) {
        date = options.year + '-' + pad2(options.month) + '-' + pad2(+head.replace('일', ''));
      }
      if (!date) return;

      var codes = [];
      tokens.slice(1).forEach(function (token) {
        var up = token.toUpperCase();
        if (looksLikeCode(up)) codes.push(up);
      });
      out[date] = (out[date] || []).concat(codes);
    });
    return out;
  }

  /** 일정 목록을 날짜 -> 코드 목록으로. */
  function readEntries(entries) {
    var out = {};
    (entries || []).forEach(function (e) {
      if (!e || !e.date) return;
      (out[e.date] = out[e.date] || []).push(String(e.code || '').toUpperCase());
    });
    return out;
  }

  /** 날짜별 표를 날짜 -> 코드 목록으로. */
  function readByDate(byDate) {
    var out = {};
    Object.keys(byDate || {}).forEach(function (date) {
      out[date] = (byDate[date] || []).map(function (e) { return String(e.code || '').toUpperCase(); });
    });
    return out;
  }

  function count(map) {
    return Object.keys(map).reduce(function (n, date) { return n + map[date].length; }, 0);
  }

  /**
   * 원본과 파싱 결과(그리고 저장된 것)를 날짜별로 견준다.
   * 건수가 다른 날이 하나라도 있으면 ok 가 거짓이다.
   */
  function compare(source, parsed, stored, opts) {
    var options = opts || {};
    var dates = {};
    [source, parsed, stored || {}].forEach(function (map) {
      Object.keys(map || {}).forEach(function (date) {
        if (options.prefix && date.indexOf(options.prefix) !== 0) return;
        dates[date] = true;
      });
    });

    var rows = Object.keys(dates).sort().map(function (date) {
      var a = (source[date] || []).slice();
      var b = (parsed[date] || []).slice();
      var c = stored ? (stored[date] || []).slice() : null;
      var missing = a.filter(function (code) {
        var at = b.indexOf(code);
        if (at === -1) return true;
        b.splice(at, 1);
        return false;
      });
      return {
        date: date,
        day: +date.slice(8),
        source: (source[date] || []).slice(),
        parsed: (parsed[date] || []).slice(),
        stored: c,
        missing: missing,
        extra: b,
        ok: (source[date] || []).length === (parsed[date] || []).length && !missing.length
      };
    });

    var bad = rows.filter(function (row) { return !row.ok; });
    return {
      rows: rows,
      mismatches: bad.length,
      ok: bad.length === 0,
      sourceCount: count(source),
      parsedCount: count(parsed),
      storedCount: stored ? count(stored) : null
    };
  }

  /** 상단에 한 줄로. '원본 44건 → 파싱 44건 · 불일치 0일' */
  function headline(result) {
    return '원본 ' + result.sourceCount + '건 → 파싱 ' + result.parsedCount + '건' +
      (result.storedCount == null ? '' : ' (저장 ' + result.storedCount + '건)') +
      ' · 불일치 ' + result.mismatches + '일' + (result.ok ? ' · 이상 없음' : '');
  }

  return {
    readSource: readSource,
    readEntries: readEntries,
    readByDate: readByDate,
    compare: compare,
    headline: headline,
    looksLikeCode: looksLikeCode
  };
});
