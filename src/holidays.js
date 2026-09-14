/**
 * 한국 공휴일.
 *
 * 날짜가 고정된 공휴일은 그대로 두고, 설날·부처님오신날·추석은 음력이라
 * scripts/make-holidays.js 가 뽑아 둔 표(holidays-lunar.js)에서 가져온다.
 * 연휴(설·추석 앞뒤 하루)와 대체공휴일은 여기서 규칙으로 계산한다.
 *
 * 대체공휴일 규칙(2023년부터 지금까지):
 *  - 삼일절·광복절·개천절·한글날·부처님오신날·성탄절: 토·일과 겹치면 다음 첫 비공휴일
 *  - 어린이날: 토·일과 겹치거나 다른 공휴일과 겹치면 대체
 *  - 설날·추석 연휴: 사흘 중 일요일이 끼면 하루 대체
 *  - 신정과 현충일은 대체하지 않는다
 * 임시공휴일과 선거일은 미리 알 수 없으니 정해진 것만 EXTRA 에 적어 둔다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./holidays-lunar.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.holidays = factory(root.CrewCal.holidayLunar);
  }
})(typeof self !== 'undefined' ? self : this, function (lunar) {
  'use strict';

  // [월, 일, 이름, 대체 규칙] — 'weekend' 토·일 / 'child' 토·일이나 다른 공휴일 / null 없음
  var FIXED = [
    [1, 1, '신정', null],
    [3, 1, '삼일절', 'weekend'],
    [5, 5, '어린이날', 'child'],
    [6, 6, '현충일', null],
    [8, 15, '광복절', 'weekend'],
    [10, 3, '개천절', 'weekend'],
    [10, 9, '한글날', 'weekend'],
    [12, 25, '성탄절', 'weekend']
  ];

  /** 그때그때 정해져 규칙으로는 알 수 없는 날. 정해진 것만 적는다. */
  var EXTRA = {
    '2025-01-27': '임시공휴일',
    '2025-06-03': '대통령선거',
    '2026-06-03': '지방선거'
  };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function iso(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }

  function shift(date, days) {
    var d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function weekdayOf(date) {
    return new Date(date + 'T00:00:00Z').getUTCDay(); // 0 일요일 … 6 토요일
  }

  /** 음력 공휴일 표에 들어 있는 해인지. 아니면 고정 공휴일만 나온다. */
  function covered(year) {
    return !!(lunar && lunar.DATES && lunar.DATES[year]);
  }

  function coveredRange() {
    if (!lunar) return null;
    return { from: lunar.FROM, to: lunar.TO };
  }

  /** 그 해 음력 공휴일의 양력 날짜 [설날, 부처님오신날, 추석]. 없으면 null. */
  function lunarDates(year) {
    if (!covered(year)) return null;
    return lunar.DATES[year].split(' ').map(function (mmdd) {
      return year + '-' + mmdd.slice(0, 2) + '-' + mmdd.slice(2);
    });
  }

  var cache = {};

  /** 그 해 공휴일 전부. { 'YYYY-MM-DD': 이름 } */
  function ofYear(year) {
    var key = String(year);
    if (cache[key]) return cache[key];

    var map = {};
    function put(date, name) {
      if (!map[date]) { map[date] = name; return; }
      if (map[date].indexOf(name) === -1) map[date] += ' · ' + name;   // 어린이날 겸 부처님오신날처럼
    }

    FIXED.forEach(function (row) { put(iso(year, row[0], row[1]), row[2]); });

    var lunarHits = lunarDates(year);
    if (lunarHits) {
      put(shift(lunarHits[0], -1), '설날 연휴');
      put(lunarHits[0], '설날');
      put(shift(lunarHits[0], 1), '설날 연휴');
      put(lunarHits[1], '부처님오신날');
      put(shift(lunarHits[2], -1), '추석 연휴');
      put(lunarHits[2], '추석');
      put(shift(lunarHits[2], 1), '추석 연휴');
    }

    /** 그 날 다음의 첫 비공휴일. 일요일도 공휴일로 친다. */
    function nextFreeDay(date) {
      var day = shift(date, 1);
      for (var guard = 0; guard < 14; guard++) {
        if (!map[day] && weekdayOf(day) !== 0) return day;
        day = shift(day, 1);
      }
      return null;
    }

    var substitutes = [];

    FIXED.forEach(function (row) {
      if (!row[3]) return;
      var date = iso(year, row[0], row[1]);
      var weekday = weekdayOf(date);
      var onWeekend = weekday === 0 || weekday === 6;
      var shared = map[date] && map[date] !== row[2];   // 다른 공휴일과 겹친 날
      if (onWeekend || (row[3] === 'child' && shared)) substitutes.push(date);
    });

    if (lunarHits) {
      // 부처님오신날도 토·일과 겹치면 대체된다 (고정 공휴일 표에는 없어 여기서 본다)
      var buddha = lunarHits[1];
      var buddhaDay = weekdayOf(buddha);
      if (buddhaDay === 0 || buddhaDay === 6) substitutes.push(buddha);

      [lunarHits[0], lunarHits[2]].forEach(function (mid) {
        var block = [shift(mid, -1), mid, shift(mid, 1)];
        var hasSunday = block.some(function (d) { return weekdayOf(d) === 0; });
        if (hasSunday) substitutes.push(block[2]);
      });
    }

    // 앞선 날부터 채워야 대체공휴일끼리 같은 날에 겹치지 않는다
    substitutes.sort().forEach(function (date) {
      var free = nextFreeDay(date);
      if (free) map[free] = '대체공휴일';
    });

    Object.keys(EXTRA).forEach(function (date) {
      if (date.slice(0, 4) === key) map[date] = EXTRA[date];
    });

    cache[key] = map;
    return map;
  }

  /** 그날 공휴일 이름. 공휴일이 아니면 null. */
  function nameOf(isoDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) return null;
    return ofYear(isoDate.slice(0, 4))[isoDate] || null;
  }

  function isHoliday(isoDate) {
    return !!nameOf(isoDate);
  }

  /** 그 달의 공휴일. { 'YYYY-MM-DD': 이름 } */
  function inMonth(year, month) {
    var prefix = year + '-' + pad2(month);
    var all = ofYear(year);
    var out = {};
    Object.keys(all).forEach(function (date) {
      if (date.indexOf(prefix) === 0) out[date] = all[date];
    });
    return out;
  }

  return {
    FIXED: FIXED,
    EXTRA: EXTRA,
    nameOf: nameOf,
    isHoliday: isHoliday,
    inMonth: inMonth,
    ofYear: ofYear,
    lunarDates: lunarDates,
    covered: covered,
    coveredRange: coveredRange
  };
});
