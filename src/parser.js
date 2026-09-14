/**
 * 크루넷에서 복사한 스케줄 텍스트를 날짜 + 코드 목록으로 파싱한다.
 *
 * 설계 원칙
 *  - 줄 단위로 훑되, 날짜만 있는 줄은 "현재 날짜"를 바꾸고 다음 줄들의 코드를 그 날짜에 붙인다.
 *  - 공백/탭/쉼표/줄바꿈이 섞여도, 날짜 표기가 여러 형태여도 최대한 받아낸다.
 *  - 판단이 애매한 토큰은 버리지 않고 경고로 남겨 사용자가 미리보기에서 결정하게 한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./codes.js'), require('./resolve.js'), require('./crewnet.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.parser = factory(root.CrewCal.codes, root.CrewCal.resolve, root.CrewCal.crewnet);
  }
})(typeof self !== 'undefined' ? self : this, function (codes, resolver, crewnet) {
  'use strict';

  var MONTHS = codes.MONTHS;
  var MONTH_ALT = Object.keys(MONTHS).join('|');

  var RE = {
    ymd: /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})\.?$/,
    md: /^(\d{1,2})[-./](\d{1,2})\.?$/,
    ymdCompact: /^(\d{4})(\d{2})(\d{2})$/,
    dayMarker: /^@D(\d{1,2})$/,
    dMon: new RegExp('^(\\d{1,2})[-\\s]?(' + MONTH_ALT + ')[-\\s]?(\\d{2}|\\d{4})?$'),
    monD: new RegExp('^(' + MONTH_ALT + ')[-\\s]?(\\d{1,2})$'),
    bareDay: /^(\d{1,2})$/,
    flight: /^([A-Z]{2})-?(\d{1,4})([A-Z])?$/,
    airline: /^[A-Z]{2}$/,
    digits: /^\d{1,4}$/,
    route: /^[A-Z]{3}(?:[/\-][A-Z]{3})+$/,
    clock: /^(\d{1,2}):([0-5]\d)(?:\s*\+(\d))?$/,
    clockRange: /^(\d{1,2}):([0-5]\d)[-~](\d{1,2}):([0-5]\d)(?:\+(\d))?$/,
    compactRange: /^(\d{3,4})[-~](\d{3,4})(?:\+(\d))?$/,
    compactClock: /^(\d{3,4})(?:\+(\d))?$/,
    dayOffset: /^\+(\d)$/,
    dutyLike: /^[A-Z]{1,6}$/,
    rangeSep: /^[~]$/
  };

  function normalizeText(text) {
    var s = String(text == null ? '' : text);
    s = s.replace(/\r\n?/g, '\n');
    s = s.replace(/[   　]/g, ' ');
    // 전각 문자 -> 반각
    s = s.replace(/[！-～]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/[‐-―−]/g, '-');
    s = s.replace(/[〜]/g, '~');
    return s;
  }

  function preprocessLine(line) {
    var s = line;
    s = s.replace(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/g, '$1-$2-$3');
    s = s.replace(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/g, '$1-$2');
    s = s.replace(/(\d{4})\s*년\s*(\d{1,2})\s*월/g, '$1-$2-1');
    // 요일 표기 제거: (일) (SUN) [월] 등
    s = s.replace(/[([](?:일|월|화|수|목|금|토)[)\]]/g, ' ');
    s = s.replace(/[([](?:SUN|MON|TUE|WED|THU|FRI|SAT)[)\]]/gi, ' ');
    // 남은 "6일" 형태는 일자 마커로 변환
    s = s.replace(/(^|[^\d])(\d{1,2})\s*일(?![0-9])/g, '$1 @D$2 ');
    return s;
  }

  /** '1030' / '930' -> '10:30' / '09:30'. 시각으로 볼 수 없으면 null. */
  function toClock(digits) {
    var raw = String(digits);
    if (!/^\d{3,4}$/.test(raw)) return null;
    var s = raw.length === 3 ? '0' + raw : raw;
    var h = +s.slice(0, 2);
    var m = +s.slice(2, 4);
    if (h > 23 || m > 59) return null;
    return pad2(h) + ':' + pad2(m);
  }

  /** 'HH:MM' 정규화. 시각이 아니면 null. */
  function toClockFromParts(hour, minute) {
    var h = +hour, m = +minute;
    if (h > 23 || m > 59) return null;
    return pad2(h) + ':' + pad2(m);
  }

  /** 라벨 없이 쓰인 시각 토큰 하나를 읽는다. ('10:30', '1030', '0850+1') */
  function readClockToken(token) {
    if (!token) return null;
    var t = String(token).toUpperCase().replace(/[LZ]$/, '');
    var m = t.match(RE.clock);
    if (m) {
      var value = toClockFromParts(m[1], m[2]);
      return value ? { value: value, offset: m[3] ? +m[3] : 0 } : null;
    }
    m = t.match(RE.compactClock);
    if (m) {
      var compact = toClock(m[1]);
      return compact ? { value: compact, offset: m[2] ? +m[2] : 0 } : null;
    }
    return null;
  }

  /** 'STD 1030' / '출발 10:30' / 'ARR14:20' 처럼 라벨이 붙은 시각. */
  function readLabeledTime(token, nextToken) {
    var joined = String(token).toUpperCase().match(/^([A-Z가-힣]{1,8})[:\-]?(\d{1,2}:?[0-5]?\d(?:\+\d)?)$/);
    if (joined) {
      var which = codes.timeLabel(joined[1]);
      var parsed = which && readClockToken(joined[2]);
      if (parsed) return { which: which, time: parsed, consumed: 1 };
    }
    var label = codes.timeLabel(token);
    if (label) {
      var next = readClockToken(nextToken);
      if (next) return { which: label, time: next, consumed: 2 };
    }
    return null;
  }

  /**
   * 스케줄이 아니라 화면 조작용으로 붙어 오는 줄. 페이지를 통째로 복사하면 섞여 들어온다.
   * 경고 목록만 어지럽히므로 조용히 건너뛴다.
   */
  var NOISE_LINE = /^(?:MY\s*SKD|Actual|Extra|prev(?:ious)?|next|clear|오늘|이전|다음|초기화|인쇄|조회|검색|더보기|Total|Sum|합계|Page\s*\d+)(?:\s*\(\s*(?:Current|Next|Previous)\s*Month\s*\))?$/i;

  function isNoiseLine(line) {
    var t = String(line || '').trim().replace(/\s+/g, ' ');
    if (!t) return true;
    if (NOISE_LINE.test(t)) return true;
    // "clear 오늘" 처럼 조작용 단어만 이어 붙은 줄
    var words = t.split(' ');
    if (words.length <= 3 && words.every(function (w) { return NOISE_LINE.test(w); })) return true;
    return false;
  }

  function tokenize(line) {
    return line
      .split(/[\s,;|]+/)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; });
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function isoDate(y, m, d) {
    return y + '-' + pad2(m) + '-' + pad2(d);
  }

  function isValidDate(y, m, d) {
    if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function resolveYear(month, ctx) {
    // 연도가 안 적힌 경우: 기준 월과 6개월 이상 벌어지면 연도가 넘어간 것으로 본다.
    var diff = month - ctx.baseMonth;
    if (diff < -6) return ctx.baseYear + 1;
    if (diff > 6) return ctx.baseYear - 1;
    return ctx.baseYear;
  }

  function normalizeYear(raw, ctx) {
    var n = parseInt(raw, 10);
    if (raw.length === 4) return n;
    return 2000 + n;
  }

  /** 토큰 하나를 날짜로 해석. 실패하면 null. */
  function parseDateToken(token, ctx, atLineStart) {
    var t = token.toUpperCase();
    var m;

    if ((m = t.match(RE.ymd))) {
      return build(+m[1], +m[2], +m[3]);
    }
    if ((m = t.match(RE.ymdCompact))) {
      return build(+m[1], +m[2], +m[3]);
    }
    if ((m = t.match(RE.md))) {
      var mo = +m[1], da = +m[2];
      return build(resolveYear(mo, ctx), mo, da);
    }
    if ((m = t.match(RE.dMon))) {
      var mon = MONTHS[m[2]];
      var yr = m[3] ? normalizeYear(m[3], ctx) : resolveYear(mon, ctx);
      return build(yr, mon, +m[1]);
    }
    if ((m = t.match(RE.monD))) {
      var mon2 = MONTHS[m[1]];
      return build(resolveYear(mon2, ctx), mon2, +m[2]);
    }
    if ((m = t.match(RE.dayMarker))) {
      return buildDayOnly(+m[1]);
    }
    if (atLineStart && (m = t.match(RE.bareDay))) {
      return buildDayOnly(+m[1]);
    }
    return null;

    function build(y, mm, dd) {
      if (!isValidDate(y, mm, dd)) return null;
      return isoDate(y, mm, dd);
    }
    /*
     * 일자 숫자만 있는 경우. 달력 격자를 복사하면 앞뒤로 옆 달의 흐린 날짜가 딸려 온다.
     * 첫 줄의 26~31 은 지난달 말일이고, 마지막 줄의 1~6 은 다음 달 초다.
     * 날짜가 크게 되돌아가면 다음 달로 넘기고, 맨 처음 숫자가 크면 지난달로 본다.
     */
    function buildDayOnly(dd) {
      var y = ctx.currentYear || ctx.baseYear;
      var mm = ctx.currentMonth || ctx.baseMonth;

      if (ctx.prevDay == null) {
        if (ctx.leadingIsPrevMonth) { mm -= 1; if (mm < 1) { mm = 12; y -= 1; } }
      } else if (dd < ctx.prevDay - 15) {
        mm += 1; if (mm > 12) { mm = 1; y += 1; }
      }

      if (!isValidDate(y, mm, dd)) return null;
      return isoDate(y, mm, dd);
    }
  }

  function expandRange(fromIso, toIso) {
    var out = [];
    var start = new Date(fromIso + 'T00:00:00Z');
    var end = new Date(toIso + 'T00:00:00Z');
    if (isNaN(start) || isNaN(end) || end < start) return [fromIso];
    var guard = 0;
    while (start <= end && guard++ < 400) {
      out.push(start.toISOString().slice(0, 10));
      start.setUTCDate(start.getUTCDate() + 1);
    }
    return out;
  }

  function makeFlightItem(airline, number, suffix) {
    var code = airline + number + (suffix || '');
    return {
      code: code,
      type: 'flight',
      category: 'flight',
      label: airline + ' ' + number + '편',
      airline: airline,
      flightNumber: number,
      known: true
    };
  }

  /**
   * 편명 꼴이지만 아는 항공사가 아닌 글자. 비행으로 세지 않고 따로 담아 둔다.
   * 달력 칸에는 띄우지 않고, 날짜를 눌렀을 때 원래 글자를 볼 수 있게만 남긴다.
   */
  function makeStrangeItem(code) {
    return {
      code: String(code).toUpperCase(),
      type: 'duty',
      category: 'unknown',
      label: '알 수 없는 코드',
      known: false,
      strange: true
    };
  }

  function makeDutyItem(code) {
    var hit = codes.lookup(code);
    if (hit) {
      return {
        code: code.toUpperCase(),
        type: 'duty',
        category: hit.category,
        label: hit.label,
        known: true
      };
    }
    return {
      code: code.toUpperCase(),
      type: 'duty',
      category: 'unknown',
      label: '미확인 코드',
      known: false
    };
  }

  function splitSlashCodes(token) {
    // "LO/STBY" 처럼 슬래시로 붙은 근무 코드 분리 (공항 코드 ICN/NRT 는 제외)
    if (token.indexOf('/') === -1) return null;
    var parts = token.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    var allKnown = parts.every(function (p) { return codes.lookup(p); });
    return allKnown ? parts : null;
  }

  /**
   * 붙여넣은 글의 일자 숫자를 순서대로 훑어, 첫머리가 지난달 말일인지 본다.
   * 달력 격자는 26~31 로 시작해 곧 1~7 로 떨어진다. 그 모양일 때만 지난달로 본다.
   * 달 중간부터 잘라 붙여넣은 경우에는 건드리지 않는다.
   */
  function startsWithPreviousMonth(lines) {
    var days = [];
    for (var i = 0; i < lines.length && days.length < 200; i++) {
      var line = lines[i].trim();
      if (!line || isNoiseLine(line)) continue;
      var tokens = tokenize(preprocessLine(line));
      for (var j = 0; j < tokens.length; j++) {
        var m = tokens[j].match(/^(?:@D)?(\d{1,2})$/);
        if (!m) continue;
        var d = +m[1];
        if (d >= 1 && d <= 31) days.push(d);
      }
    }
    if (!days.length || days[0] < 21) return false;

    // 말일 다음에 초하루가 오는 지점을 찾는다
    var roll = -1;
    for (var k = 1; k < days.length; k++) {
      if (days[k] < days[k - 1] && days[k] <= 7) { roll = k; break; }
    }
    if (roll === -1 || roll > 7) return false;   // 앞머리는 길어야 한 주다

    // 그 뒤로 한 달이 통째로 이어져야 격자의 앞머리로 볼 수 있다.
    // 달 끝부분만 잘라 붙여넣은 경우에는 여기서 걸러진다.
    for (var n = roll; n < days.length; n++) {
      if (days[n] >= 20) return true;
    }
    return false;
  }

  /**
   * 크루넷 홈 목록을 읽은 결과를 이 파서와 같은 모양으로 돌려준다.
   * 구간·시각이 원본에 다 들어 있으므로 여기서 더 채우거나 짐작할 것이 없다.
   */
  function fromCrewnet(text, options) {
    var read = crewnet.parse(text, options);
    var seq = 0;
    var entries = read.entries.map(function (item) {
      return {
        id: 'p' + (++seq),
        date: item.date,
        code: item.code,
        type: item.type,
        category: item.category,
        label: item.label,
        known: item.known,
        route: item.route || null,
        from: item.from || null,
        to: item.to || null,
        start: item.start || null,
        end: item.end || null,
        endOffset: 0,
        deadhead: !!item.deadhead,
        segment: item.segment || null,
        segmentStart: item.segmentStart !== false,
        legRole: item.legRole || null,
        strange: false,
        source: 'crewnet'
      };
    });

    var warnings = read.warnings.map(function (w) {
      return { line: 0, text: w.text, message: w.message };
    });
    var checked = resolver ? resolver.resolve(entries) : { entries: entries, dropped: [], conflicts: [] };
    checked.conflicts.forEach(function (item) {
      warnings.push({
        line: 0, text: item.date + ' ' + item.codes.join(', '),
        message: item.date + ' — ' + item.message + '. 지우지 않았으니 확인해 보세요.'
      });
    });

    var span = splitOutOfMonth(checked.entries, options && options.year, options && options.month);
    if (span.outside.length) warnings.push(outOfMonthNote(span.outside, span.prefix));

    return {
      entries: checked.entries,
      warnings: warnings,
      dropped: checked.dropped,
      conflicts: checked.conflicts,
      ignoredLines: 0,
      skippedLines: [],
      outOfMonth: span.outside,
      shape: 'crewnet',
      stats: summarize(checked.entries)
    };
  }

  /**
   * 기준 달을 벗어난 날짜는 조용히 만들어 두지 않는다.
   * 기준 연·월을 잘못 잡아 엉뚱한 달에 저장되는 일을 막는 마지막 관문이다.
   * 지우는 것이 아니라 따로 담아 두고 알린다 — 미리보기에서 되돌릴 수 있다.
   */
  function splitOutOfMonth(entries, year, month) {
    if (!year || !month) return { kept: entries, outside: [] };
    var prefix = year + '-' + pad2(month);
    var kept = [];
    var outside = [];
    entries.forEach(function (entry) {
      if (entry.date && entry.date.slice(0, 7) === prefix) kept.push(entry);
      else outside.push(entry);
    });
    return { kept: kept, outside: outside, prefix: prefix };
  }

  /** 적힌 날짜는 그대로 두되 기준 달 밖이라는 것만 알린다. */
  function outOfMonthNote(outside, prefix) {
    return {
      line: 0,
      text: prefix + ' 밖',
      message: '기준 달(' + prefix + ') 밖의 날짜가 ' + outside.length + '건 있습니다: ' +
        outside.slice(0, 6).map(function (x) { return x.date + ' ' + x.code; }).join(', ') +
        (outside.length > 6 ? ' 외' : '') +
        '. 글에 그렇게 적혀 있어 그대로 두었습니다 — 기준 연·월이 맞는지 확인해 주세요.'
    };
  }

  function outOfMonthWarning(outside, prefix) {
    return {
      line: 0,
      text: prefix + ' 밖',
      message: '기준 달(' + prefix + ') 밖의 날짜 ' + outside.length + '건은 넣지 않았습니다: ' +
        outside.slice(0, 6).map(function (x) { return x.date + ' ' + x.code; }).join(', ') +
        (outside.length > 6 ? ' 외' : '') + '. 기준 연·월을 확인해 주세요.'
    };
  }

  /**
   * 달력 칸 하나에 적힌 글을 근무 목록으로. 못 알아본 토큰은 버리지 않고 돌려준다.
   * 칸(격자)에서도 세로로 읽은 글에서도 같은 규칙으로 읽어야 결과가 어긋나지 않는다.
   */
  function readCellItems(text) {
    var out = [];
    var lost = [];
    var tokens = tokenize(preprocessLine(text));
    for (var i = 0; i < tokens.length; i++) {
      var upper = repairFlightCode(tokens[i].toUpperCase());
      var fl = upper.match(RE.flight);
      if (fl && !codes.lookup(upper)) {
        out.push(codes.isAirline(fl[1])
          ? makeFlightItem(fl[1], fl[2], fl[3])
          : makeStrangeItem(upper));
        continue;
      }
      if (RE.airline.test(upper) && codes.isAirline(upper) && !codes.lookup(upper) &&
          i + 1 < tokens.length && RE.digits.test(tokens[i + 1])) {
        out.push(makeFlightItem(upper, tokens[i + 1]));
        i++;
        continue;
      }
      var slashed = splitSlashCodes(upper);
      if (slashed) {
        slashed.forEach(function (p) { out.push(makeDutyItem(p)); });
        continue;
      }
      if (codes.lookup(upper)) { out.push(makeDutyItem(upper)); continue; }
      // 달력 칸에 딸려 오는 순수한 숫자(칸 번호 등)는 조용히 넘긴다
      if (codes.IGNORED_TOKENS[upper] || /^\d+$/.test(upper)) continue;
      if (RE.dutyLike.test(upper) && upper.length >= 2) { out.push(makeDutyItem(upper)); continue; }
      lost.push(tokens[i]);
    }
    return { items: out, lost: lost };
  }

  /*
   * 편명은 항공사 두 글자 + 숫자다. 그 자리에 O·I·S 같은 글자가 와 있으면
   * 숫자를 잘못 옮겨 적은 것이다(KEO457 -> KE0457). 규칙이 딱 떨어지므로
   * 비슷한 편명을 찾아 바꾸는 것이 아니라 글자만 제자리 숫자로 돌린다.
   */
  var AS_DIGIT = { O: '0', Q: '0', D: '0', I: '1', L: '1', J: '1', S: '5', B: '8', Z: '2', G: '6', T: '7' };

  function repairFlightCode(token) {
    var m = /^([A-Z]{2})([A-Z0-9]{3,4})$/.exec(token);
    if (!m || !codes.isAirline(m[1])) return token;
    var tail = m[2];
    if (/^\d+$/.test(tail)) return token;
    var fixed = '';
    for (var i = 0; i < tail.length; i++) {
      var ch = tail.charAt(i);
      if (/\d/.test(ch)) { fixed += ch; continue; }
      if (!AS_DIGIT[ch]) return token;     // 돌릴 수 없는 글자가 있으면 손대지 않는다
      fixed += AS_DIGIT[ch];
    }
    return m[1] + fixed;
  }

  /* ======================================================================
   * 월별 달력 화면을 복사해 붙여넣은 글
   *
   * 크루넷 월별 화면을 복사하면 한 주가 한 덩이로 나온다.
   *
   *     4   5   6   7   8   9   10
   *     LO  KE0658  ATDO  KE0727  ADO  KE0005  LO
   *
   * 줄을 공백으로만 쪼개면 칸(열) 자리가 사라져 한 주치 코드가 그 주 첫날에
   * 몽땅 얹힌다. 날짜가 7일 간격으로 찍히던 것이 이것이었다.
   * 그래서 날짜 줄의 열 자리를 기억해 두고, 아래 줄의 코드를 그 열에 맞춰 나눈다.
   * 열을 못 맞추는 덩이는 아무 날에나 얹지 않고 못 읽은 줄로 돌려준다.
   * ====================================================================== */

  /** 탭이 있으면 탭이 곧 칸이다. 없으면 글자 자리로 칸을 가늠한다. */
  function cellsOf(line) {
    var out = [];
    if (line.indexOf('\t') >= 0) {
      line.split('\t').forEach(function (part, col) {
        var text = part.trim();
        if (text) out.push({ text: text, col: col });
      });
      return { cells: out, mode: 'tab' };
    }
    // 두 칸 이상 띄면 칸이 갈린 것으로 본다. 한 칸 띄어쓰기는 한 칸 안의 두 코드다.
    var re = /\S+(?:[ ]\S+)*/g;
    var m;
    while ((m = re.exec(line)) !== null) out.push({ text: m[0], col: m.index });
    return { cells: out, mode: 'space' };
  }

  /**
   * 날짜 줄인가. 1~31 사이 숫자만 셋 이상 일곱 이하, 커지는 차례로 늘어선 줄.
   * '4 5 6 7 8 9 10' 은 날짜 줄이고 'KE0727 KE0728' 은 아니다.
   */
  function readDayRow(line) {
    var got = cellsOf(line);
    var cells = got.cells;
    if (cells.length < 3 || cells.length > 7) return null;
    var days = [];
    for (var i = 0; i < cells.length; i++) {
      var text = cells[i].text.trim();
      if (!/^\d{1,2}$/.test(text)) return null;
      var day = +text;
      if (day < 1 || day > 31) return null;
      days.push({ day: day, col: cells[i].col });
    }
    // 달이 바뀌면 31 다음에 1 이 온다. 그 한 번만 빼고는 늘 커져야 한다.
    var drops = 0;
    for (var j = 1; j < days.length; j++) {
      if (days[j].day <= days[j - 1].day) drops++;
    }
    if (drops > 1) return null;
    return { days: days, mode: got.mode };
  }

  /** 붙여넣은 글이 월별 달력 모양인가. 날짜 줄이 둘 이상이면 그렇게 본다. */
  function looksLikeGrid(text) {
    var lines = normalizeText(text).split('\n');
    var rows = 0;
    for (var i = 0; i < lines.length; i++) {
      if (readDayRow(lines[i]) && ++rows >= 2) return true;
    }
    return false;
  }

  /** 코드 한 덩이가 어느 날짜 칸의 것인지. 자신할 수 없으면 null. */
  function columnFor(col, days, mode) {
    var i;
    if (mode === 'tab') {
      for (i = 0; i < days.length; i++) {
        if (days[i].col === col) return i;
      }
      return null;
    }
    var width = days.length > 1
      ? Math.max(4, (days[days.length - 1].col - days[0].col) / (days.length - 1))
      : 8;
    var best = null;
    var bestGap = Infinity;
    for (i = 0; i < days.length; i++) {
      var gap = Math.abs(days[i].col - col);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    // 칸 너비의 4분의 3보다 멀면 어느 칸인지 자신할 수 없다. 짐작해서 얹지 않는다.
    return bestGap <= width * 0.75 ? best : null;
  }

  /**
   * 달력 모양 글을 읽는다. 날짜는 글에 적힌 날짜 줄에서만 온다.
   * 줄 번호나 몇 번째 주인지로 날짜를 만들지 않는다.
   */
  function parseGrid(text, options) {
    options = options || {};
    var baseYear = options.year || new Date().getFullYear();
    var baseMonth = options.month || (new Date().getMonth() + 1);

    var entries = [];
    var warnings = [];
    var skippedLines = [];
    var outOfMonth = [];
    var seq = 0;
    var row = null;
    var cursor = { year: baseYear, month: baseMonth, prevDay: 0 };

    function dateOfDay(day) {
      // 31 다음에 1 이 나오면 달이 넘어간 것이다. 그 외에는 기준 달을 그대로 쓴다.
      if (cursor.prevDay && day < cursor.prevDay - 15) {
        cursor.month += 1;
        if (cursor.month > 12) { cursor.month = 1; cursor.year += 1; }
      }
      cursor.prevDay = day;
      if (!isValidDate(cursor.year, cursor.month, day)) return null;
      return isoDate(cursor.year, cursor.month, day);
    }

    function itemsOf(text) { return readCellItems(text); }

    normalizeText(text).split('\n').forEach(function (rawLine, lineIndex) {
      var trimmed = rawLine.trim();
      if (!trimmed) return;

      var dayRow = readDayRow(rawLine);
      if (dayRow) {
        row = { days: [], mode: dayRow.mode };
        dayRow.days.forEach(function (d) {
          row.days.push({ col: d.col, date: dateOfDay(d.day) });
        });
        return;
      }

      // 달력 맨 위의 '2026년 1월' · '2026-01' 머리글. 기준 달을 여기서 맞춘다.
      var header = /^(\d{4})\s*[년\-./]\s*(\d{1,2})\s*월?$/.exec(trimmed);
      if (header && +header[2] >= 1 && +header[2] <= 12) {
        cursor.year = +header[1];
        cursor.month = +header[2];
        cursor.prevDay = 0;
        return;
      }

      if (isNoiseLine(trimmed)) return;
      // 요일 머리글(일 월 화 …)은 날짜가 아니다
      if (/^[일월화수목금토\s]+$/.test(trimmed) && trimmed.length <= 20) return;

      if (!row) {
        skippedLines.push({ line: lineIndex + 1, text: trimmed, reason: '날짜 없음' });
        return;
      }

      var got = cellsOf(rawLine);
      var lost = [];
      got.cells.forEach(function (cell) {
        var index = columnFor(cell.col, row.days, got.mode);
        var slot = index === null ? null : row.days[index];
        var read = itemsOf(cell.text);
        read.lost.forEach(function (t) { lost.push(t); });
        if (!slot || !slot.date) {
          read.items.forEach(function (item) { lost.push(item.code); });
          return;
        }
        read.items.forEach(function (item) {
          entries.push({
            id: 'g' + (++seq),
            date: slot.date,
            code: item.code,
            type: item.type,
            category: item.category,
            label: item.label,
            known: item.known,
            route: item.route || null,
            start: null,
            end: null,
            endOffset: 0,
            strange: !!item.strange,
            source: trimmed
          });
        });
      });
      if (lost.length) {
        skippedLines.push({
          line: lineIndex + 1,
          text: lost.join(' '),
          reason: row ? '열을 맞출 수 없음' : '코드 인식 불가'
        });
      }
    });

    var split = splitOutOfMonth(entries, baseYear, baseMonth);
    var kept = split.kept;
    outOfMonth = split.outside;
    if (outOfMonth.length) warnings.push(outOfMonthWarning(outOfMonth, split.prefix));

    kept.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10);
    });

    var dropped = [];
    var conflicts = [];
    if (resolver) {
      var checked = resolver.resolve(kept);
      kept = checked.entries;
      dropped = checked.dropped;
      conflicts = checked.conflicts;
    }

    return {
      entries: kept,
      warnings: warnings,
      dropped: dropped,
      conflicts: conflicts,
      ignoredLines: [],
      skippedLines: skippedLines,
      outOfMonth: outOfMonth,
      shape: 'grid',
      stats: summarize(kept)
    };
  }

  /* ======================================================================
   * 달력을 세로(열)로 긁어 붙여넣은 글
   *
   * 휴대폰에서 달력을 드래그해 복사하면 칸 순서가 아니라 열 순서로 딸려 온다.
   * 일요일 칸을 위에서 아래까지 다 읽고, 그다음 월요일 칸을 처음부터 — 이런 식이다.
   *
   *     S / 28 / 4 / LO / KE0658 / 11 / KE0006 / 18 / … / M / 29 / 5 / …
   *
   * 그래서 날짜 숫자가 28 4 11 18 25 29 5 12 … 로 올랐다 떨어졌다 한다.
   * 줄 단위 파서는 숫자가 떨어질 때마다 달이 넘어간 줄 알고 2월·3월·4월을
   * 만들어 냈다(일요일 칸만 1월에 남았다).
   * 한 열 안에서는 날짜가 반드시 7씩 뛴다는 것을 알아보면 제대로 읽을 수 있다.
   * ====================================================================== */

  var WEEK_HEAD = /^(?:[SMTWF]|[일월화수목금토])$/;

  /** 붙여넣은 글이 세로로 긁은 달력인가. 날짜 숫자가 7씩 뛰면 그렇다. */
  function looksLikeColumns(text) {
    var days = [];
    normalizeText(text).split('\n').forEach(function (line) {
      var t = line.trim();
      if (!/^\d{1,2}$/.test(t)) return;
      var day = +t;
      if (day >= 1 && day <= 31) days.push(day);
    });
    if (days.length < 8) return false;
    var step7 = 0;
    var step1 = 0;
    for (var i = 1; i < days.length; i++) {
      var gap = days[i] - days[i - 1];
      if (gap === 7) step7++;
      else if (gap === 1) step1++;
    }
    // 한 주씩 뛰는 계단이 여섯 번 넘게 나오고, 하루씩 늘어나는 보통 차례보다
    // 뚜렷하게 많을 때만. 평범한 날짜 목록을 이쪽으로 끌어오면 안 된다.
    return step7 >= 6 && step7 > step1 * 2;
  }

  /**
   * 세로로 긁은 달력을 읽는다. 날짜는 글에 적힌 숫자 그대로 쓰고,
   * 달은 기준 달 하나로 둔다. 숫자가 떨어진다고 달을 넘기지 않는다.
   */
  function parseColumns(text, options) {
    options = options || {};
    var baseYear = options.year || new Date().getFullYear();
    var baseMonth = options.month || (new Date().getMonth() + 1);

    var slots = [];
    var skippedLines = [];
    var current = null;

    normalizeText(text).split('\n').forEach(function (rawLine, lineIndex) {
      var trimmed = rawLine.trim();
      if (!trimmed) return;

      // '2026.01' · '2026년 1월' 머리글로 기준 달을 맞춘다
      var header = /^(\d{4})\s*[년\-./]\s*(\d{1,2})\s*월?/.exec(trimmed);
      if (header && +header[2] >= 1 && +header[2] <= 12 && !/\d{1,2}\s*[일]/.test(trimmed)) {
        baseYear = +header[1];
        baseMonth = +header[2];
        return;
      }
      // 요일 머리글(S M T W F · 일 월 화 …)은 열이 바뀌는 자리다
      if (WEEK_HEAD.test(trimmed)) { current = null; return; }
      if (isNoiseLine(trimmed) || trimmed === '오늘' || /^[<>‹›\s]+$/.test(trimmed)) return;

      // 그대로 적힌 날짜 줄은 그 날짜를 쓴다
      var full = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/.exec(trimmed);
      if (full) {
        current = { date: isoDate(+full[1], +full[2], +full[3]), day: +full[3], fixed: true, items: [], line: lineIndex + 1 };
        slots.push(current);
        return;
      }

      if (/^\d{1,2}$/.test(trimmed)) {
        var day = +trimmed;
        if (day >= 1 && day <= 31) {
          current = { day: day, fixed: false, items: [], line: lineIndex + 1 };
          slots.push(current);
          return;
        }
      }

      var read = readCellItems(trimmed);
      if (!current) {
        skippedLines.push({ line: lineIndex + 1, text: trimmed, reason: '날짜 없음' });
        return;
      }
      if (!read.items.length) {
        skippedLines.push({ line: lineIndex + 1, text: trimmed, reason: '코드 인식 불가' });
        return;
      }
      read.items.forEach(function (item) { current.items.push(item); });
      if (read.lost.length) {
        skippedLines.push({ line: lineIndex + 1, text: read.lost.join(' '), reason: '코드 인식 불가' });
      }
    });

    // 한 열은 날짜가 7씩 뛰는 묶음이다. 열이 바뀌는 자리에서 끊는다.
    var runs = [];
    slots.forEach(function (slot) {
      var run = runs[runs.length - 1];
      if (run && !slot.fixed && !run.fixed &&
          slot.day === run.slots[run.slots.length - 1].day + 7) {
        run.slots.push(slot);
        return;
      }
      runs.push({ fixed: !!slot.fixed, slots: [slot] });
    });

    /*
     * 달 배정. 한 열의 맨 위에 지난달 끝자락이, 맨 아래에 다음 달 첫머리가 온다.
     * 그 자리에서만 달을 옮기고 나머지는 모두 기준 달이다.
     */
    var prevTail = null;     // 지난달 날짜가 시작되는 값(예: 28)
    var nextHead = null;     // 다음 달 날짜가 끝나는 값(예: 7)
    runs.forEach(function (run) {
      var list = run.slots;
      if (list.length < 2) return;
      if (list[1].day < list[0].day) {
        prevTail = prevTail === null ? list[0].day : Math.min(prevTail, list[0].day);
      }
      if (list[list.length - 1].day < list[list.length - 2].day) {
        nextHead = nextHead === null ? list[list.length - 1].day
          : Math.max(nextHead, list[list.length - 1].day);
      }
    });

    // 같은 숫자가 다른 열에서 이 달 날짜로 또 나오면, 홀로 선 큰 숫자는 지난달 것이다.
    var inMonthDays = {};
    runs.forEach(function (run) {
      run.slots.forEach(function (slot, i) {
        if (run.slots.length < 2) return;
        var first = i === 0 && run.slots[1].day < slot.day;
        var last = i === run.slots.length - 1 && run.slots[i - 1].day > slot.day;
        if (!first && !last) inMonthDays[slot.day] = true;
      });
    });

    function shift(months) {
      var m = baseMonth + months, y = baseYear;
      while (m > 12) { m -= 12; y++; }
      while (m < 1) { m += 12; y--; }
      return { year: y, month: m };
    }

    var entries = [];
    var seq = 0;
    runs.forEach(function (run) {
      var list = run.slots;
      list.forEach(function (slot, i) {
        var where = null;
        if (slot.fixed) {
          where = { date: slot.date };
        } else if (list.length >= 2 && i === 0 && list[1].day < slot.day) {
          where = shift(-1);
        } else if (list.length >= 2 && i === list.length - 1 && list[i - 1].day > slot.day) {
          where = shift(1);
        } else if (list.length === 1 && prevTail !== null &&
            slot.day >= prevTail && inMonthDays[slot.day]) {
          // 홀로 선 큰 숫자. 같은 숫자가 이 달 날짜로 따로 나오므로 지난달 것이다.
          where = shift(-1);
        } else if (list.length === 1 && nextHead !== null &&
            slot.day <= nextHead && inMonthDays[slot.day]) {
          where = shift(1);
        } else {
          where = { year: baseYear, month: baseMonth };
        }
        var date = where.date ||
          (isValidDate(where.year, where.month, slot.day) ? isoDate(where.year, where.month, slot.day) : null);
        if (!date) {
          if (slot.items.length) {
            skippedLines.push({
              line: slot.line,
              text: slot.items.map(function (x) { return x.code; }).join(' '),
              reason: '날짜 없음'
            });
          }
          return;
        }
        slot.items.forEach(function (item) {
          entries.push({
            id: 'c' + (++seq),
            date: date,
            code: item.code,
            type: item.type,
            category: item.category,
            label: item.label,
            known: item.known,
            route: item.route || null,
            start: null,
            end: null,
            endOffset: 0,
            strange: !!item.strange,
            source: item.code
          });
        });
      });
    });

    entries.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10);
    });

    var warnings = [];
    var split = splitOutOfMonth(entries, baseYear, baseMonth);
    // 달력 격자의 앞뒤 달 날짜는 원래 딸려 오는 것이라 알리기만 한다.
    if (split.outside.length) warnings.push(outOfMonthNote(split.outside, split.prefix));

    var dropped = [];
    var conflicts = [];
    if (resolver) {
      var checked = resolver.resolve(entries);
      entries = checked.entries;
      dropped = checked.dropped;
      conflicts = checked.conflicts;
    }

    return {
      entries: entries,
      warnings: warnings,
      dropped: dropped,
      conflicts: conflicts,
      ignoredLines: [],
      skippedLines: skippedLines,
      outOfMonth: split.outside,
      shape: 'columns',
      stats: summarize(entries)
    };
  }

  function parse(text, options) {
    // 크루넷 홈 목록은 전용 읽기로 보낸다. 날짜 블록(달/일/요일)과 구간이 있어
    // 줄 단위로 훑는 이 파서보다 훨씬 또렷하게 읽힌다.
    if (crewnet && crewnet.looksLikeCrewnet(text)) return fromCrewnet(text, options);
    // 월별 달력 화면은 열 자리가 곧 날짜다. 줄 단위로 훑으면 한 주가 한 날에 얹힌다.
    if (looksLikeGrid(text)) return parseGrid(text, options);
    // 세로로 긁어 온 달력은 날짜가 7씩 뛴다. 숫자가 떨어진다고 달을 넘기면 안 된다.
    if (looksLikeColumns(text)) return parseColumns(text, options);
    return parseLines(text, options);
  }

  function parseLines(text, options) {
    options = options || {};
    var base = options.baseDate ? new Date(options.baseDate + 'T00:00:00Z') : new Date();
    var ctx = {
      baseYear: options.year || (options.baseDate ? base.getUTCFullYear() : base.getFullYear()),
      baseMonth: options.month || (options.baseDate ? base.getUTCMonth() + 1 : base.getMonth() + 1),
      currentYear: null,
      currentMonth: null,
      prevDay: null,
      leadingIsPrevMonth: false
    };

    var entries = [];
    var warnings = [];
    var ignoredLines = [];
    var skippedLines = [];
    var seen = {};
    var currentDates = [];
    var seq = 0;

    var rawLines = normalizeText(text).split('\n');
    ctx.leadingIsPrevMonth = startsWithPreviousMonth(rawLines);

    rawLines.forEach(function (rawLine, lineIndex) {
      var trimmed = rawLine.trim();
      if (!trimmed || isNoiseLine(trimmed)) return;

      var tokens = tokenize(preprocessLine(trimmed));
      if (!tokens.length) return;

      /*
       * 한 줄에 여러 날이 들어 있는 경우가 있다. 달력 화면을 복사하면
       * 앞 칸의 마지막 코드와 다음 칸의 날짜가 "TVL 6" 처럼 한 줄로 붙어 나온다.
       * 그래서 줄을 날짜 단위 묶음(segment)으로 쪼개 읽는다.
       */
      var segments = [{ dates: [], items: [] }];
      var pendingRange = false;
      var unknownTokens = [];
      var lastRoute = null;

      function seg() { return segments[segments.length - 1]; }

      function addDate(date) {
        if (seg().items.length) segments.push({ dates: [], items: [] });
        seg().dates.push(date);
      }

      function hasAnyDate() {
        return segments.some(function (x) { return x.dates.length; }) || currentDates.length > 0;
      }

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var upper = token.toUpperCase();

        // 1) 날짜
        //    맨 앞의 1~2자리 숫자는 물론, 줄 중간에 다시 나오는 숫자도 날짜로 본다.
        //    (달력을 복사하면 앞 칸 코드와 다음 칸 날짜가 한 줄에 붙는다)
        var atLineStart = (segments.length === 1 && seg().dates.length === 0 && seg().items.length === 0 && i <= 1);
        var midLineDay = false;
        if (!atLineStart && RE.bareDay.test(token) && hasAnyDate()) {
          var next = tokens[i + 1];
          midLineDay = !next || !/^\d+$/.test(next);
        }

        var asDate = parseDateToken(token, ctx, atLineStart || midLineDay);
        if (asDate) {
          var dates = seg().dates;
          if (pendingRange && dates.length) {
            var expanded = expandRange(dates[dates.length - 1], asDate);
            expanded.shift();
            expanded.forEach(function (d) { dates.push(d); });
            pendingRange = false;
          } else {
            addDate(asDate);
          }
          ctx.currentYear = +asDate.slice(0, 4);
          ctx.currentMonth = +asDate.slice(5, 7);
          ctx.prevDay = +asDate.slice(8, 10);
          continue;
        }

        // 2) 날짜 범위 구분자 (뒤에 날짜가 와야 범위로 본다)
        if (RE.rangeSep.test(token) || upper === '-' || upper === 'TO') {
          if (seg().dates.length && parseDateToken(tokens[i + 1] || '', ctx, false)) {
            pendingRange = true;
            continue;
          }
        }

        // 3) 출발/도착 라벨이 붙은 시각 (STD 1030 / 출발 10:30 / ARR14:20)
        var labeled = readLabeledTime(token, tokens[i + 1]);
        if (labeled) {
          applyTime(seg().items, labeled.time, labeled.which);
          i += labeled.consumed - 1;
          continue;
        }

        // 4) 시각 범위 (1030-1420, 09:30-14:20, 2350-0620+1)
        var range = readTimeRange(upper);
        if (range) {
          applyTime(seg().items, range.start, 'start');
          applyTime(seg().items, range.end, 'end');
          continue;
        }

        // 5) 단독 시각. 한 줄에 두 번 나오면 출발 -> 도착 순으로 채운다.
        var clock = upper.match(RE.clock) ? readClockToken(upper) : null;
        if (clock) {
          applyTime(seg().items, clock, 'auto');
          continue;
        }

        // 6) '+1' 만 따로 떨어져 있으면 직전 도착 시각을 익일로 표시
        var offsetOnly = upper.match(RE.dayOffset);
        if (offsetOnly) {
          markNextDay(seg().items, +offsetOnly[1]);
          continue;
        }

        // 4) 구간(공항 코드)
        if (RE.route.test(upper)) {
          lastRoute = upper.replace(/-/g, '/');
          applyDetail(seg().items, { route: lastRoute });
          continue;
        }

        // 5) 항공편 (KE0035 / KE 0035 / KE-035)
        //    편명 꼴이어도 아는 항공사가 아니면 비행으로 받지 않는다. 'AS0016' 처럼
        //    잘못 읽힌 글자가 비행이 되어 달력에 뜨는 일이 있었다.
        var fl = upper.match(RE.flight);
        if (fl && !codes.lookup(upper)) {
          if (codes.isAirline(fl[1])) {
            seg().items.push(makeFlightItem(fl[1], fl[2], fl[3]));
          } else {
            seg().items.push(makeStrangeItem(upper));
            unknownTokens.push(upper);
          }
          continue;
        }
        if (RE.airline.test(upper) && codes.isAirline(upper) && !codes.lookup(upper) &&
            i + 1 < tokens.length && RE.digits.test(tokens[i + 1])) {
          seg().items.push(makeFlightItem(upper, tokens[i + 1]));
          i++;
          continue;
        }

        // 6) 근무 코드
        var slashed = splitSlashCodes(upper);
        if (slashed) {
          slashed.forEach(function (p) { seg().items.push(makeDutyItem(p)); });
          continue;
        }
        if (codes.lookup(upper)) {
          seg().items.push(makeDutyItem(upper));
          continue;
        }

        // 7) 편명이 이미 나온 줄에서 3~4자리 숫자는 출발/도착 시각으로 본다
        if (/^\d{3,4}(\+\d)?$/.test(upper) && hasFlight(seg().items) && needsTime(seg().items)) {
          var implicit = readClockToken(upper);
          if (implicit) {
            applyTime(seg().items, implicit, 'auto');
            continue;
          }
        }

        // 8) 무시 대상
        if (codes.IGNORED_TOKENS[upper] || /^\d+$/.test(upper)) continue;

        // 9) 정체불명 코드 후보 -> 사용자에게 판단을 넘긴다
        if (RE.dutyLike.test(upper) && upper.length >= 2) {
          var item = makeDutyItem(upper);
          seg().items.push(item);
          unknownTokens.push(upper);
          continue;
        }

        ignoredLines.push({ line: lineIndex + 1, text: trimmed, token: token });
      }

      var lineHasDate = segments.some(function (x) { return x.dates.length; });
      var lineHasItems = segments.some(function (x) { return x.items.length; });

      if (!lineHasItems) {
        // 날짜도 근무도 못 읽어낸 줄. 왜 빠졌는지 볼 수 있게 사유와 함께 남긴다.
        if (!lineHasDate) {
          skippedLines.push({
            line: lineIndex + 1,
            text: trimmed,
            // 코드처럼 생긴 글자가 있었는데 못 알아본 것과, 아예 날짜도 코드도
            // 없는 줄(머리글·안내문)은 사용자가 할 일이 다르다.
            reason: unknownTokens.length ? '코드 인식 불가' : '날짜 없음'
          });
        } else currentDates = segments[segments.length - 1].dates;
        return;
      }

      if (!lineHasDate && !currentDates.length) {
        // 코드는 읽혔는데 붙일 날짜가 없는 줄. 경고에 묻어 두면 못 보고 지나친다.
        // 고쳐서 다시 읽을 수 있도록 '못 읽은 줄' 쪽에 사유와 함께 올린다.
        skippedLines.push({
          line: lineIndex + 1,
          text: trimmed,
          reason: '날짜 없음'
        });
        return;
      }

      if (unknownTokens.length) {
        warnings.push({
          line: lineIndex + 1,
          text: trimmed,
          message: '알 수 없는 코드: ' + unknownTokens.join(', ') + ' — 확인 후 반영하세요.'
        });
      }

      segments.forEach(function (part) {
        var targetDates = part.dates.length ? part.dates : currentDates;
        if (part.dates.length) currentDates = part.dates;
        if (!part.items.length || !targetDates.length) return;
        addEntries(targetDates, part.items, trimmed);
      });
    });

    function addEntries(targetDates, items, trimmed) {
      targetDates.forEach(function (date) {
        items.forEach(function (item) {
          var key = [date, item.code, item.route || '', item.start || '', item.end || ''].join('|');
          if (seen[key]) return;
          seen[key] = true;
          entries.push({
            id: 'p' + (++seq),
            date: date,
            code: item.code,
            type: item.type,
            category: item.category,
            label: item.label,
            known: item.known,
            route: item.route || null,
            start: item.start || null,
            end: item.end || null,
            endOffset: item.endOffset || 0,
            strange: !!item.strange,
            source: trimmed
          });
        });
      });
    }

    entries.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10);
    });

    // 같은 날에 겹쳐 들어온 근무를 살펴본다. 글자까지 똑같은 중복만 하나로 하고,
    // 그 밖에 이상한 조합은 지우지 않고 '확인 필요' 로만 알린다.
    var dropped = [];
    var conflicts = [];
    if (resolver) {
      var checked = resolver.resolve(entries);
      entries = checked.entries;
      dropped = checked.dropped;
      conflicts = checked.conflicts;
      dropped.forEach(function (item) {
        warnings.push({
          line: 0,
          text: item.date + ' ' + item.code,
          message: item.date + ' 에 ' + item.code + ' 가 두 번 들어와 하나로 합쳤습니다.'
        });
      });
      conflicts.forEach(function (item) {
        warnings.push({
          line: 0,
          text: item.date + ' ' + item.codes.join(', '),
          message: item.date + ' — ' + item.message + '. 지우지 않았으니 확인해 보세요.'
        });
      });
    }

    // 이 길로 들어온 날짜는 글에 그대로 적혀 있던 값이다(2026-02-01, 2/1, 2월 1일).
    // 달을 넘겨 이어지는 비행이 실제로 있으므로 지우지 않고, 기준 달 밖이라는 것만 알린다.
    // 날짜를 자리에서 유추하는 달력 격자(parseGrid)는 그 자리에서 막는다.
    var span = splitOutOfMonth(entries, options.year, options.month);
    if (span.outside.length) warnings.push(outOfMonthNote(span.outside, span.prefix));

    return {
      entries: entries,
      warnings: warnings,
      dropped: dropped,
      conflicts: conflicts,
      ignoredLines: ignoredLines,
      skippedLines: skippedLines,
      outOfMonth: span.outside,
      shape: 'lines',
      stats: summarize(entries)
    };

    function timeTarget(list) {
      if (!list.length) return null;
      for (var k = list.length - 1; k >= 0; k--) {
        if (list[k].type === 'flight') return list[k];
      }
      return list[list.length - 1];
    }

    function applyDetail(list, detail) {
      var target = timeTarget(list);
      if (!target) return;
      Object.keys(detail).forEach(function (k) {
        if (detail[k] != null && target[k] == null) target[k] = detail[k];
      });
    }

    /**
     * 시각을 붙인다.
     *  which 'start' 출발(시작) / 'end' 도착(종료)
     *  which 'auto' 한 줄에 시각이 두 번 나오면 출발 -> 도착 순으로 채운다.
     */
    function applyTime(list, time, which) {
      var target = timeTarget(list);
      if (!target || !time) return;
      var slot = which;
      if (slot === 'auto') slot = target.start == null ? 'start' : (target.end == null ? 'end' : null);
      if (!slot || target[slot] != null) return;
      target[slot] = time.value;
      if (slot === 'end' && time.offset) target.endOffset = time.offset;
    }

    function markNextDay(list, days) {
      var target = timeTarget(list);
      if (target && target.end) target.endOffset = days;
    }

    function hasFlight(list) {
      return list.some(function (item) { return item.type === 'flight'; });
    }

    function needsTime(list) {
      var target = timeTarget(list);
      return !!target && (target.start == null || target.end == null);
    }
  }

  /** '1030-1420', '09:30-14:20', '2350-0620+1' -> { start, end } */
  function readTimeRange(token) {
    var m = token.match(RE.clockRange);
    if (m) {
      var s1 = toClockFromParts(m[1], m[2]);
      var e1 = toClockFromParts(m[3], m[4]);
      if (!s1 || !e1) return null;
      return { start: { value: s1, offset: 0 }, end: { value: e1, offset: m[5] ? +m[5] : 0 } };
    }
    m = token.match(RE.compactRange);
    if (m) {
      var s2 = toClock(m[1]);
      var e2 = toClock(m[2]);
      if (!s2 || !e2) return null;
      return { start: { value: s2, offset: 0 }, end: { value: e2, offset: m[3] ? +m[3] : 0 } };
    }
    return null;
  }

  function summarize(entries) {
    var byDate = {};
    var counts = { flight: 0, layover: 0, standby: 0, off: 0, vacation: 0, training: 0, other: 0, unknown: 0 };
    entries.forEach(function (e) {
      byDate[e.date] = true;
      if (counts[e.category] == null) counts[e.category] = 0;
      counts[e.category]++;
    });
    var dates = Object.keys(byDate).sort();
    return {
      dateCount: dates.length,
      entryCount: entries.length,
      firstDate: dates[0] || null,
      lastDate: dates[dates.length - 1] || null,
      counts: counts
    };
  }

  return {
    parse: parse,
    parseLines: parseLines,
    parseGrid: parseGrid,
    looksLikeGrid: looksLikeGrid,
    parseColumns: parseColumns,
    looksLikeColumns: looksLikeColumns,
    repairFlightCode: repairFlightCode,
    readDayRow: readDayRow,
    cellsOf: cellsOf,
    fromCrewnet: fromCrewnet,
    normalizeText: normalizeText,
    preprocessLine: preprocessLine,
    tokenize: tokenize,
    isNoiseLine: isNoiseLine,
    expandRange: expandRange,
    readClockToken: readClockToken,
    readTimeRange: readTimeRange,
    isoDate: isoDate,
    isValidDate: isValidDate
  };
});
