/**
 * 크루넷 홈 화면(crewnet.koreanair.com) 일정 읽기.
 *
 * 화면은 날짜별 목록이다. 왼쪽에 날짜 블록이 세 줄로 서고, 오른쪽에 그날의
 * 듀티 카드가 하나 이상 붙는다.
 *
 *   왼쪽 날짜 블록      오른쪽 듀티 카드
 *     01  (월)          KE 0727
 *     7   (일)          ICN -KIX / 11:03 - 12:41
 *     WED (요일)
 *
 * 첫 줄의 "01" 은 달이지 날짜가 아니다. 이걸 1일로 읽는 바람에 17일 비행이
 * 1월 1일에 유령으로 들어간 일이 있었다. 그래서 세 줄을 한 덩어리로만 인정하고,
 * 요일까지 맞는지 달력과 대조한다.
 *
 * 시각 칸은 "그날 이 듀티에서 무슨 일이 있었나" 를 적는다. 하이픈 앞이 출발,
 * 뒤가 도착이고, 비어 있으면 그날은 그 일이 없었다는 뜻이다.
 *
 *   "21:03 - 14:43"  그날 출발하고 그날 도착
 *   "22:46 -"        그날 출발, 도착은 다른 날
 *   "- 05:07"        출발은 다른 날, 그날 도착
 *   "-"              그날은 기내에 있거나 체류 중
 *
 * 시각은 언제나 그 공항의 현지 시각이다. 마음대로 한국 시각으로 돌리지 않는다.
 * 구간도 원본의 "ICN -LAS" 를 그대로 읽는다. 편명으로 목적지를 짐작하지 않는다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./codes.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.crewnet = factory(root.CrewCal.codes);
  }
})(typeof self !== 'undefined' ? self : this, function (codes) {
  'use strict';

  var WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  var RE = {
    month: /^(0?[1-9]|1[0-2])$/,
    day: /^([12]\d|3[01]|0?[1-9])$/,
    weekday: /^(SUN|MON|TUE|WED|THU|FRI|SAT)$/,
    // 한 줄에 붙어 읽힌 날짜 블록: "01 7 WED"
    dateLine: /^(0?[1-9]|1[0-2])\s+([12]\d|3[01]|0?[1-9])\s+(SUN|MON|TUE|WED|THU|FRI|SAT)\b/,
    flight: /^([A-Z]{2})\s?-?\s?(\d{3,4})$/,
    // "ICN -LAS / 21:03 - 14:43"
    legLine: /^([A-Z]{3})\s*-\s*([A-Z]{3})\s*\/\s*(.*)$/,
    // "LAS / -" 또는 "LAS / - 21:30"
    stayLine: /^([A-Z]{3})\s*\/\s*(.*)$/,
    times: /^(\d{1,2}:[0-5]\d)?\s*-\s*(\d{1,2}:[0-5]\d)?$/,
    clock: /^(\d{1,2}):([0-5]\d)$/
  };

  // 화면 껍데기. 일정과 상관없는 줄들.
  var NOISE = [
    /^HANWAY/i, /^Crewnet$/i, /^crewnet\.koreanair\.com$/i,
    /^(홈|스케줄|공지사항|브리핑시트)$/, /^\d{1,2}:[0-5]\d$/,
    /^[\s|·∨˅v×✕]+$/i
  ];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function isNoise(line) {
    if (!line) return true;
    return NOISE.some(function (re) { return re.test(line); });
  }

  /** 'HH:MM' 로 다듬는다. 시각이 아니면 null. */
  function clock(text) {
    var m = RE.clock.exec(String(text || '').trim());
    if (!m) return null;
    var h = +m[1];
    return h > 23 ? null : pad2(h) + ':' + m[2];
  }

  /**
   * 시각 칸을 읽는다. 하이픈 앞이 출발, 뒤가 도착.
   * 읽을 수 없으면 null (시각 칸이 아니라는 뜻).
   */
  function readTimes(field) {
    var text = String(field == null ? '' : field).trim();
    if (!text) return null;
    var m = RE.times.exec(text);
    if (!m) return null;
    return { start: clock(m[1]) || null, end: clock(m[2]) || null };
  }

  /** 그 달 그 날의 요일. 0 이 일요일. */
  function weekdayOf(year, month, day) {
    var d = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(d.getTime())) return null;
    if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;   // 없는 날
    return d.getUTCDay();
  }

  /** 읽은 요일이 달력과 맞는지. 연·월을 모르면 따지지 않는다. */
  function weekdayMatches(year, month, day, weekday) {
    if (!year || !month) return true;
    var index = WEEKDAYS.indexOf(String(weekday || '').toUpperCase());
    if (index === -1) return true;
    var actual = weekdayOf(year, month, day);
    return actual == null ? false : actual === index;
  }

  function normalize(text) {
    return String(text == null ? '' : text)
      .replace(/\r\n?/g, '\n')
      .replace(/[   　]/g, ' ')
      .replace(/[‐-―−－]/g, '-')
      .replace(/[／]/g, '/')
      .split('\n')
      .map(function (line) { return line.replace(/\s+/g, ' ').trim(); })
      .filter(function (line) { return line && !isNoise(line); });
  }

  /**
   * 줄을 훑어 날짜 블록을 찾는다. 세 줄(달/일/요일)이 나란히 있어야 하고,
   * 한 줄에 붙어 읽힌 "01 7 WED" 도 받는다. 그 밖에는 날짜로 보지 않는다.
   */
  function readDateBlock(lines, at) {
    var joined = RE.dateLine.exec(lines[at]);
    if (joined) {
      return {
        month: +joined[1], day: +joined[2], weekday: joined[3],
        next: at + 1,
        rest: lines[at].slice(joined[0].length).trim()
      };
    }
    if (at + 2 >= lines.length) return null;
    if (!RE.month.test(lines[at])) return null;
    if (!RE.day.test(lines[at + 1])) return null;
    if (!RE.weekday.test(lines[at + 2])) return null;
    return {
      month: +lines[at], day: +lines[at + 1], weekday: lines[at + 2],
      next: at + 3, rest: ''
    };
  }

  function dutyItem(code) {
    var hit = codes ? codes.lookup(code) : null;
    return {
      code: code,
      type: 'duty',
      category: hit ? hit.category : 'unknown',
      label: hit ? hit.label : '미확인 코드',
      known: !!hit
    };
  }

  /**
   * 한 달치를 읽는다. options { year, month } 를 주면 날짜를 또렷이 적고
   * 요일까지 대조한다. month 를 안 주면 원본의 달을 쓴다.
   */
  function parse(text, options) {
    var opts = options || {};
    var lines = normalize(text);
    var entries = [];
    var warnings = [];
    var days = [];
    var seq = 0;

    var current = null;        // 지금 날짜
    var card = null;           // 지금 듀티 카드

    function pushEntry(item) {
      if (!current) return null;
      item.id = 'c' + (++seq);
      item.date = current.date;
      entries.push(item);
      return item;
    }

    /** 오늘 칸에 이미 들어온 마지막 편명. TVL 이 카드 밖에 떨어져 읽혔을 때 쓴다. */
    function lastFlightToday() {
      if (!current) return null;
      for (var i = entries.length - 1; i >= 0; i--) {
        if (entries[i].date !== current.date) break;
        if (entries[i].type === 'flight') return entries[i];
      }
      return null;
    }

    function startDay(block) {
      var month = opts.month || block.month;
      var year = opts.year || new Date().getFullYear();
      // 원본의 달과 보고 있는 달이 다르면 원본을 믿되 알린다
      if (opts.month && block.month !== opts.month) {
        warnings.push({
          text: pad2(block.month) + '/' + pad2(block.day),
          message: '원본의 달(' + pad2(block.month) + ')이 보고 있는 달(' +
            pad2(opts.month) + ')과 다릅니다.'
        });
        month = block.month;
      }
      if (!weekdayMatches(year, month, block.day, block.weekday)) {
        warnings.push({
          text: pad2(month) + '/' + pad2(block.day) + ' ' + block.weekday,
          message: year + '년 ' + month + '월 ' + block.day + '일은 ' +
            block.weekday + ' 이 아닙니다. 날짜를 잘못 읽었을 수 있습니다.'
        });
      }
      current = { date: year + '-' + pad2(month) + '-' + pad2(block.day), weekday: block.weekday };
      days.push(current.date);
      card = null;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      var block = readDateBlock(lines, i);
      if (block) {
        startDay(block);
        i = block.next - 1;
        if (block.rest) lines.splice(i + 1, 0, block.rest);
        continue;
      }

      var upper = line.toUpperCase();

      // 편명 카드의 첫 줄
      var flight = RE.flight.exec(upper);
      if (flight && codes && codes.isAirline(flight[1])) {
        card = pushEntry({
          code: flight[1] + flight[2],
          type: 'flight',
          category: 'flight',
          label: flight[1] + ' ' + flight[2] + '편',
          known: true,
          route: null, from: null, to: null,
          start: null, end: null,
          deadhead: false
        });
        continue;
      }

      // 손님으로 타고 가는 표시. 독립된 근무가 아니라 그 편에 붙는 성질이므로
      // 제 엔트리를 만들지 않는다. 만들면 배지와 엔트리로 두 번 나온다.
      if (upper === 'TVL') {
        var target = card && card.type === 'flight' ? card : lastFlightToday();
        if (target) target.deadhead = true;
        continue;
      }

      // 편명 카드의 둘째 줄: 구간과 시각
      var leg = RE.legLine.exec(upper);
      if (leg && card && card.type === 'flight' && !card.route) {
        var legTimes = readTimes(leg[3]);
        card.from = leg[1];
        card.to = leg[2];
        card.route = leg[1] + '/' + leg[2];
        if (legTimes) { card.start = legTimes.start; card.end = legTimes.end; }
        continue;
      }

      // 체류 카드의 둘째 줄: 머무는 공항과 시각
      var stay = RE.stayLine.exec(upper);
      if (stay && card && card.category === 'layover' && !card.from) {
        var stayTimes = readTimes(stay[2]);
        card.from = stay[1];
        card.to = stay[1];
        card.route = stay[1];
        if (stayTimes) { card.start = stayTimes.start; card.end = stayTimes.end; }
        continue;
      }

      // 근무 코드 카드 (LO / ADO / ATDO / DO …). 코드는 읽은 그대로 쓴다.
      if (codes && codes.lookup(upper)) {
        card = pushEntry(dutyItem(upper));
        card.route = null; card.from = null; card.to = null;
        card.start = null; card.end = null;
        continue;
      }

      if (current) {
        warnings.push({ text: line, message: current.date + ' 에서 알아보지 못한 줄입니다.' });
      }
    }

    linkSegments(entries);
    return {
      entries: entries,
      days: days,
      warnings: warnings,
      shape: 'crewnet'
    };
  }

  /**
   * 같은 편명이 이어진 날에 거듭 나오면 날짜를 넘어가는 한 비행이다.
   * 세 편이 아니라 한 편으로 세도록 묶고, 그날이 출발인지 기내인지 도착인지 적는다.
   */
  function linkSegments(entries) {
    var byCode = {};
    entries.forEach(function (entry) {
      if (entry.type !== 'flight') return;
      (byCode[entry.code] = byCode[entry.code] || []).push(entry);
    });

    var segment = 0;
    Object.keys(byCode).forEach(function (code) {
      var list = byCode[code].slice().sort(function (a, b) {
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      });
      var prev = null;
      var id = null;
      list.forEach(function (entry) {
        if (!prev || !isNextDay(prev.date, entry.date)) {
          id = 's' + (++segment);
          entry.segmentStart = true;
        } else {
          entry.segmentStart = false;
        }
        entry.segment = id;
        entry.legRole = entry.start ? 'depart' : (entry.end ? 'arrive' : 'enroute');
        prev = entry;
      });
    });

    // 묶이지 않은 근무에도 자리를 만들어 둔다
    entries.forEach(function (entry) {
      if (entry.type === 'flight') return;
      entry.segment = null;
      entry.segmentStart = true;
      entry.legRole = entry.start ? 'depart' : (entry.end ? 'arrive' : null);
    });
  }

  function isNextDay(a, b) {
    var d = new Date(a + 'T00:00:00Z');
    if (isNaN(d.getTime())) return false;
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10) === b;
  }

  /** 크루넷 홈 목록처럼 보이는 글인지. 구간 줄이나 날짜 블록이 있으면 그렇다. */
  function looksLikeCrewnet(text) {
    var lines = normalize(text);
    var legs = 0;
    var blocks = 0;
    for (var i = 0; i < lines.length; i++) {
      if (RE.legLine.test(lines[i].toUpperCase())) legs++;
      if (readDateBlock(lines, i)) blocks++;
    }
    // 날짜 블록 하나에 구간 줄 하나만 있어도 크루넷 목록이다. 하루치만 붙여넣는
    // 경우가 있어 둘 이상을 요구하면 엉뚱한 파서로 넘어간다.
    return (blocks >= 1 && legs >= 1) || blocks >= 3;
  }

  return {
    parse: parse,
    looksLikeCrewnet: looksLikeCrewnet,
    normalize: normalize,
    readDateBlock: readDateBlock,
    readTimes: readTimes,
    weekdayOf: weekdayOf,
    weekdayMatches: weekdayMatches,
    linkSegments: linkSegments,
    WEEKDAYS: WEEKDAYS
  };
});
