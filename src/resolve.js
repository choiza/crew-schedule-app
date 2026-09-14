/**
 * 하루에 겹쳐 들어온 근무를 살펴본다.
 *
 * 예전에는 여기서 겹친 것을 지웠다. 그러다 3월 1일 국내선 네 편(KE1807·1810·
 * 1815·1820)이 통째로 사라지고 없던 휴무만 남는 일이 있었다. 읽어 들인 근무를
 * 지우면 무엇이 틀렸는지조차 알 수 없게 된다.
 *
 * 그래서 이 모듈은 아무것도 지우지 않는다. 딱 하나, 글자 그대로 같은
 * (날짜, 코드) 가 두 번 들어온 것만 하나로 합친다. 그 밖에 이상한 조합은
 * '확인 필요' 로 알리기만 하고 판단은 사람에게 맡긴다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./codes.js'), require('./airports.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.resolve = factory(root.CrewCal.codes, root.CrewCal.airports);
  }
})(typeof self !== 'undefined' ? self : this, function (codes, airports) {
  'use strict';

  /** 휴무 계열끼리 겹쳤을 때 어느 것을 대표로 볼지. 앞에 있을수록 구체적이다. */
  var OFF_RANK = ['ATDO', 'ADO', 'GDO', 'CDO', 'PDO', 'DO', 'OFF', 'X'];

  /** 겹침을 알릴 때 쓰는 말. */
  var CONFLICT_TEXT = {
    'off-duplicate': '같은 날 휴무가 여러 개입니다',
    'off-with-layover': '휴무와 체류가 같은 날에 있습니다',
    'off-with-flight': '휴무와 비행이 같은 날에 있습니다',
    'domestic-layover': '국내선 뒤에 체류가 붙어 있습니다'
  };

  function categoryOf(entry) {
    if (!entry) return 'unknown';
    if (entry.category) return entry.category;
    if (entry.type === 'flight') return 'flight';
    return codes ? codes.describe(entry.code).category : 'unknown';
  }

  function codeOf(entry) {
    return String((entry && entry.code) || '').toUpperCase();
  }

  function isOff(entry) { return categoryOf(entry) === 'off'; }
  function isLayover(entry) { return categoryOf(entry) === 'layover'; }
  function isFlight(entry) {
    return !!entry && !entry.strange && (categoryOf(entry) === 'flight' || entry.type === 'flight');
  }

  function warn(message) {
    if (typeof console !== 'undefined' && console && typeof console.warn === 'function') {
      console.warn('[crew-cal] ' + message);
    }
  }

  function prevDay(date) {
    var d = new Date(date + 'T00:00:00Z');
    if (isNaN(d.getTime())) return null;
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  /** 그 편의 구간. 크루넷 원본이 적어 준 것만 쓴다. 없으면 null. */
  function routeOf(entry) {
    return isFlight(entry) && entry.route ? entry.route : null;
  }

  /** 국내선인지. 구간을 알면 그것으로, 모르면 편명 대역으로 본다. */
  function isDomesticFlight(entry) {
    if (!isFlight(entry)) return false;
    var route = routeOf(entry);
    if (route && airports) {
      var parts = airports.splitRoute(route);
      if (parts.from && parts.to) {
        return airports.countryOf(parts.from) === 'KR' && airports.countryOf(parts.to) === 'KR';
      }
    }
    return false;   // 구간을 모르면 국내선인지도 모른다
  }

  /** 도착지가 한국 밖인 비행이면 참. 구간을 모르면 판단하지 않는다(null). */
  function arrivesOverseas(entry) {
    var route = routeOf(entry);
    if (!route || !airports) return null;
    var parts = airports.splitRoute(route);
    if (!parts || !parts.to) return null;
    var country = airports.countryOf(parts.to);
    if (!country) return null;
    return country !== 'KR';
  }

  /**
   * 이 날짜, 또는 체류로 이어지는 그 앞날의 마지막 비행. 없으면 null.
   * 체류가 어디서 비롯됐는지 따질 때 쓴다.
   */
  function lastFlightBefore(byDate, date, limit) {
    var back = limit == null ? 7 : limit;
    var cursor = date;
    for (var i = 0; i <= back && cursor; i++) {
      var list = byDate[cursor] || [];
      var flights = list.filter(isFlight);
      if (flights.length) return flights[flights.length - 1];
      if (i > 0 && !(list.length && list.every(isLayover))) return null;
      cursor = prevDay(cursor);
    }
    return null;
  }

  /** 이 날짜 직전에 해외에 내려놓은 비행이 있었는지. 모르면 null. */
  function arrivedOverseasBefore(byDate, date, limit) {
    var back = limit == null ? 7 : limit;
    var cursor = prevDay(date);
    for (var i = 0; i < back && cursor; i++) {
      var list = byDate[cursor] || [];
      var flights = list.filter(isFlight);
      if (flights.length) {
        var unknown = false;
        for (var j = flights.length - 1; j >= 0; j--) {
          var verdict = arrivesOverseas(flights[j]);
          if (verdict === true) return true;
          if (verdict === null) unknown = true;
        }
        return unknown ? null : false;
      }
      if (list.length && list.every(isLayover)) { cursor = prevDay(cursor); continue; }
      return false;
    }
    return false;
  }

  /** 휴무 계열 가운데 대표로 삼을 것. 화면에서 하나만 보일 때 쓴다. */
  function primaryOff(list) {
    var offs = (list || []).filter(isOff);
    if (!offs.length) return null;
    return offs.slice().sort(function (a, b) {
      return OFF_RANK.indexOf(codeOf(a)) - OFF_RANK.indexOf(codeOf(b));
    })[0];
  }

  /**
   * 하루치를 살펴 이상한 조합을 찾는다. 아무것도 지우지 않는다.
   * byDate 를 주면 앞뒤 날까지 살펴본다.
   */
  function conflictsOf(list, date, byDate) {
    var out = [];
    var offs = (list || []).filter(isOff);
    var layovers = (list || []).filter(isLayover);
    var flights = (list || []).filter(isFlight);

    function note(kind, entries) {
      out.push({
        date: date || null,
        kind: kind,
        codes: entries.map(codeOf),
        message: CONFLICT_TEXT[kind] + ': ' + entries.map(codeOf).join(', ')
      });
    }

    if (offs.length > 1) note('off-duplicate', offs);
    if (offs.length && layovers.length) note('off-with-layover', offs.concat(layovers));
    if (offs.length && flights.length) note('off-with-flight', offs.concat(flights));

    // 국내선은 체류가 드물다. 부산에서 자는 일정이 실제로 있으니 알리기만 한다.
    if (layovers.length && byDate && date) {
      var last = lastFlightBefore(byDate, date);
      if (last && isDomesticFlight(last)) {
        note('domestic-layover', [last].concat(layovers));
      }
    }
    return out;
  }

  /**
   * 같은 편명이 이어진 날에 거듭 나오면 날짜를 넘어가는 한 비행이다.
   * 크루넷 홈 목록은 시각 칸으로 그날 무슨 일이 있었는지 알려 주지만, 달력 캡처에는
   * 편명만 있다. 그때도 이어진 날을 한 덩어리로 묶어 한 편으로 센다.
   *   첫날 = 출발, 가운데 = 기내, 마지막 = 도착
   * 엔트리를 지우거나 만들지 않는다. 어느 덩어리에 드는지만 적어 준다.
   */
  function linkSegments(entriesByDate) {
    var runs = {};
    Object.keys(entriesByDate || {}).sort().forEach(function (date) {
      (entriesByDate[date] || []).forEach(function (entry) {
        if (!isFlight(entry)) return;
        var code = codeOf(entry);
        var run = runs[code];
        if (run && isNextDay(run.last, date)) {
          run.last = date;
          run.days.push(entry);
        } else {
          run = runs[code] = { id: code + '@' + date, last: date, days: [entry] };
        }
        entry.segment = run.id;
      });
    });

    // 덩어리마다 첫날·가운데·마지막을 적는다. 크루넷이 알려 준 값이 있으면 그것이 먼저.
    var seen = {};
    Object.keys(entriesByDate || {}).sort().forEach(function (date) {
      (entriesByDate[date] || []).forEach(function (entry) {
        if (!isFlight(entry) || !entry.segment) return;
        var first = !seen[entry.segment];
        seen[entry.segment] = true;
        entry.segmentStart = first;
      });
    });

    Object.keys(runs).forEach(function (code) { /* 마지막 상태만 쓰고 버린다 */ });
    return entriesByDate;
  }

  /**
   * 같은 칸에 TVL 이 함께 있으면 그날 비행은 손님으로 타고 가는 것이다.
   * 크루넷 홈 목록은 편명 카드 안에 적어 주지만, 달력 캡처에서는 따로 떨어져 나온다.
   */
  function markDeadhead(entriesByDate) {
    Object.keys(entriesByDate || {}).forEach(function (date) {
      var list = entriesByDate[date] || [];
      var tvl = list.filter(function (e) { return codeOf(e) === 'TVL'; });
      if (!tvl.length) return;
      var flights = list.filter(function (e) { return e.type === 'flight'; });
      if (!flights.length) return;                 // 붙일 편이 없으면 그대로 둔다
      flights.forEach(function (e) { e.deadhead = true; });
      // 배지로 보이니 제 엔트리는 화면에서 접는다. 데이터는 지우지 않는다.
      tvl.forEach(function (e) { e.attachedTo = flights[0].code; });
    });
    return entriesByDate;
  }

  /** 덩어리 안에서 그날이 출발인지 기내인지 도착인지. 시각을 아는 날은 시각이 먼저. */
  function markLegs(entriesByDate) {
    var groups = {};
    Object.keys(entriesByDate || {}).sort().forEach(function (date) {
      (entriesByDate[date] || []).forEach(function (entry) {
        if (!isFlight(entry) || !entry.segment) return;
        (groups[entry.segment] = groups[entry.segment] || []).push(entry);
      });
    });
    Object.keys(groups).forEach(function (id) {
      var days = groups[id];
      days.forEach(function (entry, i) {
        if (entry.legRole) return;                 // 크루넷 원본이 적어 준 것이 먼저
        if (entry.start) { entry.legRole = 'depart'; return; }
        if (entry.end) { entry.legRole = 'arrive'; return; }
        if (days.length < 2) return;               // 하루짜리는 시각을 모를 뿐이다
        entry.legRole = i === 0 ? 'depart' : (i === days.length - 1 ? 'arrive' : 'enroute');
      });
    });
    return entriesByDate;
  }

  function isNextDay(a, b) {
    var d = new Date(a + 'T00:00:00Z');
    if (isNaN(d.getTime())) return false;
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10) === b;
  }

  /** 글자 그대로 같은 (날짜, 코드) 가 두 번 들어오면 앞의 것만 남긴다. */
  function dedupe(entries) {
    var seen = {};
    var out = [];
    var dropped = [];
    (entries || []).forEach(function (entry) {
      if (!entry || !entry.date) return;
      var key = entry.date + '|' + codeOf(entry);
      if (seen[key]) {
        dropped.push({ date: entry.date, code: codeOf(entry), reason: 'duplicate', entry: entry });
        return;
      }
      seen[key] = true;
      out.push(entry);
    });
    dedupe.lastDropped = dropped;
    return out;
  }

  function groupByDate(entries) {
    var byDate = {};
    entries.forEach(function (entry) {
      (byDate[entry.date] = byDate[entry.date] || []).push(entry);
    });
    return byDate;
  }

  /**
   * 일정 목록을 훑는다. 지우는 것은 글자까지 똑같은 중복뿐이다.
   * { entries, dropped, conflicts } 를 준다.
   */
  function resolve(entries) {
    var list = dedupe(entries);
    var dropped = dedupe.lastDropped || [];
    var byDate = groupByDate(list);
    var conflicts = [];

    Object.keys(byDate).sort().forEach(function (date) {
      conflictsOf(byDate[date], date, byDate).forEach(function (item) {
        conflicts.push(item);
        warn(date + ' ' + item.message + ' — 지우지 않고 그대로 두었습니다. 확인해 보세요.');
      });
    });

    dropped.forEach(function (item) {
      warn(item.date + ' 에 ' + item.code + ' 가 두 번 들어와 하나로 합쳤습니다.');
    });

    return { entries: list, dropped: dropped, conflicts: conflicts };
  }

  /** 날짜별 표를 그대로 훑어 돌려준다. */
  function resolveByDate(entriesByDate) {
    var flat = [];
    Object.keys(entriesByDate || {}).sort().forEach(function (date) {
      (entriesByDate[date] || []).forEach(function (entry) {
        if (entry && entry.date === date) flat.push(entry);
        else if (entry) {
          var copy = {};
          Object.keys(entry).forEach(function (k) { copy[k] = entry[k]; });
          copy.date = date;
          flat.push(copy);
        }
      });
    });
    var done = resolve(flat);
    var out = {};
    done.entries.forEach(function (entry) {
      (out[entry.date] = out[entry.date] || []).push(entry);
    });
    return { entriesByDate: out, dropped: done.dropped, conflicts: done.conflicts };
  }

  return {
    resolve: resolve,
    resolveByDate: resolveByDate,
    dedupe: dedupe,
    conflictsOf: conflictsOf,
    linkSegments: linkSegments,
    markLegs: markLegs,
    markDeadhead: markDeadhead,
    isNextDay: isNextDay,
    primaryOff: primaryOff,
    isOff: isOff,
    isLayover: isLayover,
    isFlight: isFlight,
    isDomesticFlight: isDomesticFlight,
    arrivesOverseas: arrivesOverseas,
    arrivedOverseasBefore: arrivedOverseasBefore,
    lastFlightBefore: lastFlightBefore,
    routeOf: routeOf,
    OFF_RANK: OFF_RANK,
    CONFLICT_TEXT: CONFLICT_TEXT
  };
});
