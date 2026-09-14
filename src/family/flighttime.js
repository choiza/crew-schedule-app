/**
 * 비행시간(승무시간) 계산.
 * 브라우저에서는 window.CrewCal.flighttime, Node 에서는 require('./flighttime.js') 로 사용한다.
 *
 * 승무시간은 "이륙을 목적으로 비행기가 최초로 움직이기 시작한 때부터 최종적으로 비행기가 정지한 때까지"
 * (항공안전법 시행규칙 별표 18 비고), 흔히 말하는 블록 타임이다.
 * 객실승무원은 연간 1,200시간을 넘을 수 없고(같은 규칙 제128조 제1항), 월·3개월 한도는 회사 운항규정에 따른다.
 *
 * 한 편의 시간은 이 순서로 정한다.
 *   1. setting    사용자가 편명마다 고친 값
 *   2. timetable  아래 표 (FlightMapper 대한항공 계획 시간표, 2026년 9월 하계 기준, 출입구~출입구)
 *   3. estimate   두 공항 사이 대권 거리로 추정 (이착륙과 지상 이동 45분 + 시속 약 830km)
 * 모두 계획 시간이라 실제 급여 명세의 비행시간과는 다를 수 있다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../geo.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.flighttime = factory(root.CrewCal.geo);
  }
})(typeof self !== 'undefined' ? self : this, function (geo) {
  'use strict';

  var SOURCE = 'FlightMapper 대한항공 계획 시간표, 2026년 9월 기준';
  var YEAR_LIMIT_HOURS = 1200;

  // 편명 → 계획 소요 시간 (시:분). 동계(10월 25일부터)에는 10~20분 다를 수 있다.
  var TABLE = {
    KE0011: '11:10', KE0012: '13:10', KE0017: '11:10', KE0018: '13:10',
    KE0023: '10:40', KE0024: '12:30', KE0035: '13:40', KE0036: '15:10',
    KE0037: '12:50', KE0038: '14:40', KE0041: '10:00', KE0042: '11:50',
    KE0081: '14:00', KE0086: '15:30', KE0093: '13:30', KE0094: '15:25',
    KE0401: '10:10', KE0402: '10:40',
    KE0643: '06:10', KE0644: '06:30',
    KE0703: '02:30', KE0704: '02:30',
    KE0835: '03:55', KE0836: '03:50',
    KE0873: '01:25', KE0874: '01:25',
    KE0901: '14:20', KE0902: '12:00', KE0907: '14:25', KE0908: '12:40',
    KE0925: '14:00', KE0926: '12:10', KE0927: '13:20', KE0928: '11:40',
    KE0931: '13:10', KE0932: '11:30',
    KE0951: '10:30', KE0952: '08:50', KE0955: '12:00', KE0956: '10:05'
  };

  function toMinutes(text) {
    var m = /^\s*(\d{1,2})\s*[:시h]\s*(\d{1,2})\s*분?\s*$/i.exec(String(text == null ? '' : text));
    if (m) return +m[1] * 60 + +m[2];
    var only = /^\s*(\d{1,4})\s*분?\s*$/.exec(String(text == null ? '' : text));
    return only ? +only[1] : null;
  }

  /** KE81, KE081 → KE0081 */
  function normalize(code) {
    var text = String(code || '').toUpperCase().replace(/\s+/g, '');
    var m = /^([A-Z0-9]{2})0*(\d{1,4})([A-Z]?)$/.exec(text);
    if (!m) return text;
    return m[1] + ('0000' + m[2]).slice(-4) + m[3];
  }

  function estimate(from, to) {
    if (!geo || !from || !to) return null;
    var a = geo.coordOf(from), b = geo.coordOf(to);
    if (!a || !b || (!a.exact && !b.exact)) return null;
    var km = geo.distanceKm(a, b);
    if (!km) return null;
    return { minutes: Math.round((45 + km / 13.8) / 5) * 5, km: Math.round(km) };
  }

  /** 한 편의 비행시간과 근거 */
  function blockOf(ev, fixes) {
    var code = normalize(ev.code);
    var own = fixes && fixes[code];
    if (own != null && own !== '') return { code: code, minutes: +own, source: 'setting' };
    if (TABLE[code]) return { code: code, minutes: toMinutes(TABLE[code]), source: 'timetable' };
    var guess = estimate(ev.from, ev.to);
    if (guess) return { code: code, minutes: guess.minutes, source: 'estimate', km: guess.km };
    return { code: code, minutes: null, source: 'none' };
  }

  function departDate(ev) {
    return (ev.dates && ev.dates[0]) || ev.startDate || ev.date;
  }

  /**
   * 기간 안에 출발한 비행의 합계. 밤을 넘기는 편은 출발한 날 한 번만 센다.
   * prefix: 'YYYY-MM' 또는 'YYYY'
   */
  function total(events, prefix, fixes) {
    var items = events.filter(function (ev) {
      return departDate(ev).indexOf(prefix) === 0;
    }).map(function (ev) {
      var block = blockOf(ev, fixes);
      return { ev: ev, date: departDate(ev), code: block.code, minutes: block.minutes, source: block.source, km: block.km };
    }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var minutes = 0, estimated = 0, missing = 0;
    items.forEach(function (item) {
      if (item.minutes == null) missing++;
      else minutes += item.minutes;
      if (item.source === 'estimate') estimated++;
    });
    return { minutes: minutes, count: items.length, estimated: estimated, missing: missing, items: items };
  }

  /** 4945 → '82시간 25분' */
  function hours(minutes) {
    var h = Math.floor(minutes / 60), m = minutes % 60;
    return (h ? h + '시간' : '') + (m ? (h ? ' ' : '') + m + '분' : (h ? '' : '0분'));
  }

  return {
    SOURCE: SOURCE,
    YEAR_LIMIT_HOURS: YEAR_LIMIT_HOURS,
    TABLE: TABLE,
    toMinutes: toMinutes,
    normalize: normalize,
    estimate: estimate,
    blockOf: blockOf,
    total: total,
    hours: hours
  };
});
