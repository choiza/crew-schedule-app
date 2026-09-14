/**
 * 크루넷 일정을 가족이 읽는 말로 옮긴다.
 * "KE0017 / LO / KE0018 / KE0018" → LA 출발, LA, 귀국길, 귀국.
 * 브라우저에서는 window.CrewCal.plan, Node 에서는 require('./plan.js') 로 사용한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../airports.js'), require('../codes.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.plan = factory(root.CrewCal.airports, root.CrewCal.codes);
  }
})(typeof self !== 'undefined' ? self : this, function (airports, codes) {
  'use strict';

  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  // 근무 코드의 종류. 사용자가 코드마다 바꿀 수 있다.
  var CATEGORIES = [
    { value: 'off', label: '휴무' },
    { value: 'standby', label: '대기' },
    { value: 'training', label: '교육' },
    { value: 'work', label: '근무' }
  ];

  // 한 날에 여러 코드가 겹치면 앞쪽이 이긴다
  var RANK = ['training', 'work', 'standby', 'vacation', 'off', 'unknown'];

  var KIND_OF = {
    off: 'off', vacation: 'off', standby: 'standby', training: 'training', work: 'work', unknown: 'other'
  };

  // 기본 뜻. 크루캘 사전(codes.js)보다 가족에게 맞춘 말이다.
  var DEFAULT_WORDS = {
    ATDO: { short: '휴무', long: '의무 휴일 (장거리 비행 뒤 꼭 쉬는 날)', category: 'off' },
    PDO: { short: '휴무', long: '유급 휴일', category: 'off' },
    ADO: { short: '휴무', long: '자동 휴무 (한 달 최소 휴무일을 채우려고 넣는 날)', category: 'off' },
    RDO: { short: '휴무', long: '신청한 휴무', category: 'off' },
    ALV: { short: '휴가', long: '연차 휴가', category: 'vacation' },
    SLV: { short: '휴가', long: '신청한 휴가', category: 'vacation' },
    ABS: { short: '결근', long: '결근', category: 'work' },
    RF: { short: '비행대기', long: '비행 대기. 비어 있다가 나중에 비행이 들어올 수 있는 날', category: 'standby' },
    DO: { short: '휴무', long: '휴일', category: 'off' },
    STBY: { short: '대기', long: '대기 근무. 연락이 오면 비행에 나갑니다', category: 'standby' },
    TFRS: { short: '교육', long: '교육', category: 'training' },
    GRD: { short: '지상', long: '지상 근무', category: 'work' }
  };

  // 근무 코드 사전(codes.js)의 분류를 달력 종류로 옮긴다. 병가, 모성 휴가는 근무가 아니라 휴가로 센다.
  var DICT_CATEGORY = { off: 'off', vacation: 'vacation', standby: 'standby', training: 'training', layover: 'layover', flight: 'work', other: 'work' };
  var DICT_LEAVE = { SICK: true, SK: true, ML: true };

  /** 근무 코드 사전에 있는 코드의 뜻. 달력 칸에 들어가게 짧은 말은 4글자까지. */
  function dictWord(key) {
    var hit = codes && codes.DUTY_CODES && codes.DUTY_CODES[key];
    if (!hit) return null;
    var category = DICT_LEAVE[key] ? 'vacation' : (DICT_CATEGORY[hit.category] || 'work');
    var fallback = CATEGORY_WORDS[category] || { short: hit.label, long: hit.label };
    var label = String(hit.label || '').split('/')[0];
    var compact = label.replace(/\s+/g, '');
    // 휴무와 휴가는 달력에서 늘 같은 말로 보이게 한다. 자세한 뜻은 long 에 남긴다.
    var short = category === 'off' ? '휴무'
      : category === 'vacation' && !DICT_LEAVE[key] ? '휴가'
      : compact.length <= 4 ? compact : fallback.short;
    return { short: short, long: hit.label || fallback.long, category: category };
  }

  var CATEGORY_WORDS = {
    off: { short: '휴무', long: '휴일' },
    vacation: { short: '휴가', long: '휴가' },
    standby: { short: '대기', long: '대기 근무' },
    training: { short: '교육', long: '교육' },
    work: { short: '근무', long: '근무' },
    layover: { short: '체류', long: '해외 체류' }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function addDays(iso, n) {
    var d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  function weekdayOf(iso) {
    return new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
  }

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function isKorea(iata) {
    return airports.countryOf(iata) === 'KR';
  }

  function placeOf(iata) {
    if (!iata) return null;
    return {
      iata: iata,
      city: airports.cityOf(iata),
      flag: airports.flagOf(iata) || '',
      zone: airports.zoneOf(iata)
    };
  }

  /**
   * 코드의 뜻. 사용자가 고친 것 → 기본 뜻 → 근무 코드 사전 → 크루캘 분류 순.
   * 반환: { short, long, category, custom }
   */
  function wordFor(code, category, words) {
    var key = String(code || '').toUpperCase();
    var own = words && words[key];
    var base = DEFAULT_WORDS[key] || dictWord(key) || CATEGORY_WORDS[category] || null;
    if (own) {
      return {
        short: own.short || (base && base.short) || key,
        long: own.long || own.short || (base && base.long) || key,
        category: own.category || (base && base.category) || category || 'unknown',
        custom: true
      };
    }
    if (DEFAULT_WORDS[key]) return Object.assign({ custom: false }, DEFAULT_WORDS[key]);
    var dict = dictWord(key);
    if (dict) return Object.assign({ custom: false }, dict);
    if (CATEGORY_WORDS[category]) return Object.assign({ custom: false, category: category }, CATEGORY_WORDS[category]);
    return { short: key, long: key + ' (뜻을 모르는 코드)', category: 'unknown', custom: false };
  }

  /**
   * 코드 뜻이 어디서 왔는지. 코드 관리 표에 보인다.
   * added: 직접 추가, custom: 직접 고침, default: 앱 기본 뜻, dict: 근무 코드 사전, category: 스케줄 분류로 추정, unknown: 뜻 모름
   */
  function wordSource(code, category, words) {
    var key = String(code || '').toUpperCase();
    var own = words && words[key];
    if (own && own.added && !DEFAULT_WORDS[key] && !dictWord(key)) return 'added';
    if (own) return 'custom';
    if (DEFAULT_WORDS[key]) return 'default';
    if (dictWord(key)) return 'dict';
    if (CATEGORY_WORDS[category]) return 'category';
    return 'unknown';
  }

  /** 이어진 날에 걸쳐 적힌 같은 편명을 한 번의 비행으로 묶는다. */
  function flightRuns(entries) {
    var byCode = {};
    entries.forEach(function (entry) {
      if (entry.type !== 'flight' || !entry.code) return;
      var code = String(entry.code).toUpperCase();
      byCode[code] = byCode[code] || {};
      byCode[code][entry.date] = entry;
    });

    var runs = [];
    Object.keys(byCode).forEach(function (code) {
      var current = null;
      Object.keys(byCode[code]).sort().forEach(function (date) {
        if (current && addDays(current.dates[current.dates.length - 1], 1) === date) {
          current.dates.push(date);
        } else {
          current = { code: code, dates: [date], entry: byCode[code][date] };
          runs.push(current);
        }
      });
    });
    return runs;
  }

  /**
   * 한국을 떠나는 편(out)은 첫날, 한국에 닿는 편(in)은 마지막 날에 일어난다.
   * 크루넷은 밤을 넘기는 귀국편을 출발일과 도착일 두 칸에 적기 때문이다.
   */
  function eventsOf(entries, timeOf) {
    return flightRuns(entries).map(function (run) {
      var entry = run.entry;
      var first = run.dates[0];
      var last = run.dates[run.dates.length - 1];
      var ev = { code: run.code, dates: run.dates, from: entry.from || null, to: entry.to || null };

      if (!ev.from || !ev.to) {
        ev.type = 'unknown';
        ev.date = first;
      } else if (isKorea(ev.from) && !isKorea(ev.to)) {
        ev.type = 'out';
        ev.date = first;
        ev.place = placeOf(ev.to);
      } else if (!isKorea(ev.from) && isKorea(ev.to)) {
        ev.type = 'in';
        ev.date = last;
        ev.startDate = first;
        ev.place = placeOf(ev.from);
      } else {
        ev.type = isKorea(ev.from) ? 'domestic' : 'abroad';
        ev.date = first;
        ev.place = placeOf(ev.to);
      }
      ev.time = timeOf ? timeOf(ev) : null;
      return ev;
    }).sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      // 같은 날이면 떠나는 편이 먼저다 (당일 왕복)
      if (a.type !== b.type) return a.type === 'out' ? -1 : 1;
      return 0;
    });
  }

  function dutyOf(duties, words) {
    var best = null;
    duties.forEach(function (entry) {
      if (entry.category === 'layover') return;
      var word = wordFor(entry.code, entry.category, words);
      var rank = RANK.indexOf(word.category);
      if (rank < 0) rank = RANK.length;
      if (!best || rank < best.rank) best = { rank: rank, word: word, code: entry.code };
    });
    return best;
  }

  /**
   * 한 달치 날마다 무엇을 하는지, 어디에 있는지.
   * entries 에는 앞뒤 달 일정이 섞여도 된다. 달을 넘는 여행을 잇는 데 쓴다.
   * options: { timeOf(ev) → 'HH:MM', words: { CODE: { short, long, category } } }
   */
  function buildMonth(year, month, entries, options) {
    var opts = options || {};
    var prefix = year + '-' + pad(month);
    var events = eventsOf(entries, opts.timeOf);
    var trips = events.filter(function (ev) { return ev.type === 'out' || ev.type === 'in'; });

    var byDate = {};
    entries.forEach(function (entry) {
      (byDate[entry.date] = byDate[entry.date] || []).push(entry);
    });

    // 달이 시작할 때 이미 해외에 있었는지
    var start = prefix + '-01';
    var abroad = null;
    trips.forEach(function (ev) {
      if (ev.date < start) abroad = ev.type === 'out' ? ev.place : null;
    });

    // 여행 묶음 번호. 달력에서 묶음마다 색을 달리한다.
    var tripNo = -1;
    var tripOpen = false;
    function openTrip() { tripNo++; tripOpen = true; return tripNo; }
    function continueTrip() { return tripOpen ? tripNo : openTrip(); }

    var days = [];
    var count = daysInMonth(year, month);
    for (var d = 1; d <= count; d++) {
      var iso = prefix + '-' + pad(d);
      var outs = trips.filter(function (ev) { return ev.type === 'out' && ev.date === iso; });
      var ins = trips.filter(function (ev) { return ev.type === 'in' && ev.date === iso; });
      var homeward = trips.filter(function (ev) {
        return ev.type === 'in' && ev.startDate === iso && ev.date > iso;
      });
      var others = events.filter(function (ev) {
        return (ev.type === 'unknown' || ev.type === 'domestic' || ev.type === 'abroad') &&
          ev.dates.indexOf(iso) >= 0;
      });
      var own = byDate[iso] || [];
      var duties = own.filter(function (entry) { return entry.type !== 'flight'; });

      // 나가는 편이 이 달 앞에 없어도 귀국편이 걸쳐 있으면 해외에 있던 것이다
      if (!abroad && !outs.length) {
        trips.forEach(function (ev) {
          if (ev.type === 'in' && ev.startDate < iso && ev.date >= iso) abroad = ev.place;
        });
      }

      var day = {
        date: iso,
        day: d,
        weekday: weekdayOf(iso),
        weekdayName: WEEKDAYS[weekdayOf(iso)],
        outs: outs,
        ins: ins,
        homeward: homeward,
        others: others,
        trip: null,
        codes: own.map(function (entry) { return entry.code; }),
        dutyCodes: duties.map(function (entry) { return entry.code; })
      };

      if (outs.length && ins.length) {
        var out = outs[0], back = ins[0];
        var sameCity = out.place.iata === back.place.iata;
        var backFirst = out.time && back.time && back.time < out.time;
        if (sameCity && !backFirst) {
          day.kind = 'turn';
          day.place = out.place;
          day.short = out.place.city;
          day.sub = '당일 왕복';
          day.airports = out.from + '⇄' + out.to;
          day.trip = openTrip();
          tripOpen = false;
          abroad = null;
        } else {
          day.kind = 'out';
          day.place = out.place;
          day.short = out.place.city;
          day.sub = '귀국 후 출발';
          day.airports = out.from + '→' + out.to;
          if (tripOpen) tripOpen = false;
          day.trip = openTrip();
          abroad = out.place;
        }
      } else if (outs.length) {
        day.kind = 'out';
        day.place = outs[0].place;
        day.short = outs[0].place.city;
        day.sub = '출발';
        day.airports = outs[0].from + '→' + outs[0].to;
        day.trip = openTrip();
        abroad = outs[0].place;
      } else if (ins.length) {
        day.kind = 'in';
        day.place = ins[0].place;
        day.short = '귀국';
        day.sub = ins[0].place.city;
        day.airports = ins[0].from + '→' + ins[0].to;
        day.trip = continueTrip();
        tripOpen = false;
        abroad = null;
      } else if (homeward.length) {
        day.kind = 'homeward';
        day.place = homeward[0].place;
        day.short = homeward[0].place.city;
        day.sub = '귀국길';
        day.airports = homeward[0].from + '→' + homeward[0].to;
        day.trip = continueTrip();
      } else if (abroad) {
        day.kind = 'away';
        day.place = abroad;
        day.short = abroad.city;
        day.sub = '체류';
        day.airports = abroad.iata;
        day.trip = continueTrip();
      } else {
        var duty = dutyOf(duties, opts.words);
        if (duty) {
          day.kind = KIND_OF[duty.word.category] || 'other';
          day.category = duty.word.category;
          day.short = duty.word.short;
          day.sub = '';
          day.long = duty.word.long;
        } else if (others.length) {
          day.kind = 'flight';
          day.place = others[0].place || null;
          day.short = others[0].place ? others[0].place.city : others[0].code;
          day.sub = '비행';
          day.airports = others[0].from && others[0].to ? others[0].from + '→' + others[0].to : '';
        } else {
          day.kind = 'none';
          day.short = '';
          day.sub = '';
        }
      }
      // 달력 칸에 한국 시각을 적는다: 출발일은 출발, 도착일은 도착, 당일 왕복은 둘 다
      if (day.kind === 'out' && outs[0].time) {
        day.sub = outs[0].time + ' 출발';
      } else if (day.kind === 'in' && ins[0].time) {
        day.sub = ins[0].time + ' 도착';
      } else if (day.kind === 'turn' && outs[0].time) {
        day.sub = outs[0].time + (ins[0] && ins[0].time ? '→' + ins[0].time : ' 출발');
      }
      day.airports = day.airports || '';
      days.push(day);
    }

    return { year: year, month: month, days: days, events: events };
  }

  var BAND = { out: true, away: true, homeward: true, in: true };

  /** 달력에서 출국부터 귀국까지 한 띠로 잇기 위한 모양 */
  function bandOf(days, index) {
    var day = days[index];
    if (!BAND[day.kind]) return null;
    var prev = days[index - 1], next = days[index + 1];
    var startsHere = day.kind === 'out' || !prev || !BAND[prev.kind] || prev.trip !== day.trip || day.weekday === 0;
    var endsHere = day.kind === 'in' || !next || !BAND[next.kind] || next.trip !== day.trip || day.weekday === 6;
    var parts = [];
    if (startsHere) parts.push('start');
    if (endsHere) parts.push('end');
    return parts.length ? parts.join(' ') : 'mid';
  }

  /** 휴일표용 구분: 'off' 휴일, 'work' 근무, 'none' 일정 없음 */
  function dayType(day) {
    if (day.kind === 'off') return 'off';
    if (day.kind === 'none') return 'none';
    return 'work';
  }

  /** 달 요약: 출국 횟수, 쉬는 날, 다녀오는 도시 */
  function summarize(model) {
    var outs = 0, off = 0, work = 0, cities = [];
    model.days.forEach(function (day) {
      if (day.kind === 'out' || day.kind === 'turn') {
        outs++;
        if (day.place && cities.indexOf(day.place.city) < 0) cities.push(day.place.city);
      }
      var type = dayType(day);
      if (type === 'off') off++;
      if (type === 'work') work++;
    });
    return { trips: outs, offDays: off, workDays: work, cities: cities };
  }

  /** [1,2,3,5,7,8] → '1~3, 5, 7~8' */
  function ranges(numbers) {
    var out = [];
    for (var i = 0; i < numbers.length; i++) {
      var start = numbers[i];
      while (i + 1 < numbers.length && numbers[i + 1] === numbers[i] + 1) i++;
      out.push(start === numbers[i] ? String(start) : start + '~' + numbers[i]);
    }
    return out.join(', ');
  }

  /** 이 날 뒤로 처음 인천에 닿는 편 */
  function returnAfter(model, iso) {
    for (var i = 0; i < model.events.length; i++) {
      var ev = model.events[i];
      if (ev.type === 'in' && ev.date >= iso) return ev;
    }
    return null;
  }

  /**
   * 여러 사람의 같은 달을 견준다. people: [{ name, model }]
   * 돌려주는 것: 사람마다 휴무 날, 둘 이상 같이 쉬는 날, 둘 이상 같은 날 같은 해외 도시에 있는 날
   */
  function together(list) {
    var offs = list.map(function (person) {
      var days = person.model.days.filter(function (day) { return dayType(day) === 'off'; }).map(function (day) { return day.day; });
      return { name: person.name, days: days, text: ranges(days) };
    });
    var length = list.length ? list[0].model.days.length : 0;
    var both = [], same = [];
    for (var i = 0; i < length; i++) {
      var iso = list[0].model.days[i].date;
      var resting = list.filter(function (person) { return dayType(person.model.days[i]) === 'off'; }).map(function (person) { return person.name; });
      if (resting.length >= 2) both.push({ date: iso, day: i + 1, names: resting });
      var byCity = {};
      list.forEach(function (person) {
        var day = person.model.days[i];
        if (!day || !day.place || ['out', 'away', 'turn', 'homeward'].indexOf(day.kind) < 0) return;
        if (isKorea(day.place.iata)) return;
        var city = day.place.city || day.place.iata;
        (byCity[city] = byCity[city] || { city: city, flag: day.place.flag, names: [] }).names.push(person.name);
      });
      Object.keys(byCity).forEach(function (city) {
        if (byCity[city].names.length >= 2) same.push({ date: iso, day: i + 1, city: city, flag: byCity[city].flag, names: byCity[city].names });
      });
    }
    return { offs: offs, together: both, samePlace: same };
  }

  /**
   * 새 스케줄이 들어와도 버스 예매 표시를 이어 쓴다.
   * 예매 키는 '날짜|편명|방향'. 같은 날짜에 같은 편명이 남아 있는 것만 남기고, 없어진 비행의 표시는 버린다.
   * 비행 시각만 바뀐 경우는 남기고, 예매한 차가 안 맞는지는 화면에서 따로 알린다.
   */
  function keepBookings(booked, entries) {
    var alive = {};
    (entries || []).forEach(function (entry) {
      if (entry && entry.type === 'flight') alive[entry.date + '|' + String(entry.code || '').toUpperCase()] = true;
    });
    var kept = {};
    Object.keys(booked || {}).forEach(function (key) {
      var parts = key.split('|');
      if (parts.length >= 2 && alive[parts[0] + '|' + parts[1]]) kept[key] = booked[key];
    });
    return kept;
  }

  return {
    WEEKDAYS: WEEKDAYS,
    CATEGORIES: CATEGORIES,
    wordSource: wordSource,
    /** 앱이 뜻을 아는 코드 전체: 기본 뜻과 근무 코드 사전 */
    allKnownCodes: function () {
      var list = Object.keys(DEFAULT_WORDS);
      Object.keys((codes && codes.DUTY_CODES) || {}).forEach(function (k) { if (list.indexOf(k) < 0) list.push(k); });
      return list.sort();
    },
    knownCode: function (code) { var key = String(code || '').toUpperCase(); return !!(DEFAULT_WORDS[key] || dictWord(key)); },
    together: together,
    keepBookings: keepBookings,
    DEFAULT_WORDS: DEFAULT_WORDS,
    addDays: addDays,
    weekdayOf: weekdayOf,
    daysInMonth: daysInMonth,
    wordFor: wordFor,
    flightRuns: flightRuns,
    eventsOf: eventsOf,
    buildMonth: buildMonth,
    bandOf: bandOf,
    dayType: dayType,
    summarize: summarize,
    ranges: ranges,
    returnAfter: returnAfter,
    placeOf: placeOf
  };
});
