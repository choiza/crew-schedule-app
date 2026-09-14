/**
 * 공항버스 시간표와 "몇 시 차를 타야 하나" 계산.
 * 브라우저에서는 window.CrewCal.bus, Node 에서는 require('./bus.js') 로 사용한다.
 *
 * 시각은 모두 한국 시각, 자정부터 센 분(0~1439)으로 다룬다.
 * 음수는 전날, 1440 이상은 다음 날이다.
 *
 * 출발지(place)는 우선순위 순서로 늘어선 동네 목록이다. 동네마다 정류장과
 * 집에서 그 정류장까지 걸리는 시간을 가진다. 위 순위부터 맞는 차를 찾는다.
 *
 * 걸리는 시간은 세 가지 중 가장 믿을 만한 것을 쓴다.
 *   1. timetable  시간표에 공항 도착 시각이 적혀 있으면 그 차이 (김포행 5100, 5200)
 *   2. tmap       TMAP 타임머신 예측표가 있으면 요일·시간대 값 (scripts/tmap-travel-times.js 로 만든다)
 *   3. estimate   정류장별 평소 시간에 요일·시간대 보정을 곱한 추정
 * 설정에서 직접 넣은 값이 있으면 그것이 모두를 이긴다 (setting).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.bus = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  var AIRPORTS = {
    ICN: { code: 'ICN', name: '인천공항 제2터미널', short: '인천 T2', lat: 37.4602, lon: 126.4407 },
    GMP: { code: 'GMP', name: '김포공항 국제선', short: '김포', lat: 37.5657, lon: 126.8013 }
  };

  /* ---------------- 정류장 ----------------
   * 남쪽(용인)에서 북쪽(성남)으로 늘어놓았다.
   * toAirport / fromAirport: 공항까지, 공항에서 평소 걸리는 분(추정의 바탕).
   * 좌표는 정류장 근처 대략값이며 "가까운 정류장 찾기"와 TMAP 예측에만 쓴다.
   */
  var STOPS = {
    jukjeon: {
      id: 'jukjeon', name: '죽전역', detail: '용인포은아트홀 앞', town: '수지', lat: 37.3246, lon: 127.1073,
      toAirport: { ICN: 95 }, fromAirport: { ICN: 95 }
    },
    dankook: {
      id: 'dankook', name: '단국대 죽전캠퍼스', detail: '죽전야외음악당 앞', town: '수지', lat: 37.3223, lon: 127.1267,
      toAirport: { ICN: 120 }, fromAirport: { ICN: 125 }
    },
    ori: {
      id: 'ori', name: '오리역', detail: '농수산물센터 앞', town: '분당 구미동', lat: 37.3398, lon: 127.1090,
      toAirport: { ICN: 105, GMP: 115 }, fromAirport: { ICN: 110, GMP: 120 }
    },
    miguem: {
      id: 'miguem', name: '미금역', detail: '청솔마을 앞', town: '분당 구미동', lat: 37.3509, lon: 127.1094,
      toAirport: { ICN: 100, GMP: 110 }, fromAirport: { ICN: 105, GMP: 115 }
    },
    jeongja: {
      id: 'jeongja', name: '정자역', detail: '정자역 정류장', town: '분당 정자동', lat: 37.3671, lon: 127.1080,
      toAirport: { ICN: 95, GMP: 105 }, fromAirport: { ICN: 100, GMP: 110 }
    },
    sunae: {
      id: 'sunae', name: '수내역', detail: '롯데백화점 앞', town: '분당 수내동', lat: 37.3786, lon: 127.1144,
      toAirport: { ICN: 90, GMP: 100 }, fromAirport: { ICN: 95, GMP: 105 }
    },
    seohyeon: {
      id: 'seohyeon', name: '서현역', detail: '서현역 정류장', town: '분당 서현동', lat: 37.3849, lon: 127.1233,
      toAirport: { ICN: 85, GMP: 90 }, fromAirport: { ICN: 90, GMP: 95 }
    },
    imae: {
      id: 'imae', name: '이매역', detail: '이매역 정류장', town: '분당 이매동', lat: 37.3957, lon: 127.1276,
      toAirport: { ICN: 90, GMP: 95 }, fromAirport: { ICN: 95, GMP: 100 }
    },
    yatap: {
      id: 'yatap', name: '야탑역', detail: '야탑역 정류장', town: '분당 야탑동', lat: 37.4113, lon: 127.1286,
      toAirport: { ICN: 95, GMP: 100 }, fromAirport: { ICN: 100, GMP: 105 }
    },
    moran: {
      id: 'moran', name: '모란역', detail: '모란역 정류장', town: '성남 중원구', lat: 37.4322, lon: 127.1290,
      toAirport: { ICN: 105, GMP: 105 }, fromAirport: { ICN: 110, GMP: 110 }
    },
    savezone: {
      id: 'savezone', name: '세이브존', detail: '성남 세이브존 앞', town: '성남 중원구', lat: 37.4386, lon: 127.1378,
      toAirport: { ICN: 110, GMP: 115 }, fromAirport: { ICN: 115, GMP: 120 }
    },
    eulji: {
      id: 'eulji', name: '을지대학교', detail: '을지대 성남캠퍼스 앞', town: '성남 수정구', lat: 37.4555, lon: 127.1675,
      toAirport: { ICN: 115 }, fromAirport: { ICN: 120 }
    }
  };

  // 처음 쓰는 사람의 출발지. 위에 있을수록 먼저 찾는다.
  var DEFAULT_PLACES = [
    { id: 'miguem', name: '미금', enabled: true, stops: [{ stop: 'miguem', walk: 20 }] },
    { id: 'suji', name: '수지', enabled: true, stops: [{ stop: 'dankook', walk: 15 }, { stop: 'jukjeon', walk: 15 }] },
    { id: 'seohyeon', name: '분당 서현', enabled: true, stops: [{ stop: 'seohyeon', walk: 15 }] }
  ];

  /* ---------------- 노선과 시간표 ----------------
   * 5400, 5300: 경기고속 운행시간표 이미지, 2026년 3월 1일 시행 (buspia.co.kr).
   *   5400 표에는 11번 줄이 원본에도 없다. 공항 도착 시각은 적혀 있지 않다.
   *   정류장 사이 간격은 표에서 일정해 기준 정류장에서 더해 만든다.
   *   5300 이매역은 표에서 줄마다 23~25분으로 달라 25분으로 둔다.
   * 5100, 5200: 경기고속 "성남공항" 시간표 이미지. 작성일이 적혀 있지 않고,
   *   마지막 칸 "김포공항 국제선" 을 도착 시각으로 보고 계산한다. 김포공항 출발 시각표는 못 구했다.
   * 8282: 인천공항서비스 안내의 T1 출발 시각에서 20분을 뺀 값. 확인 전이다.
   */
  var MIGEUM_5400 = [
    '04:20', '04:40', '05:00', '05:20', '05:40', '06:00', '06:20', '06:40', '07:10', '07:40',
    '09:00', '09:40', '10:20', '11:00', '11:40', '12:10', '12:40', '13:10', '13:40', '14:10',
    '14:40', '15:25', '16:00', '16:40', '17:20', '18:10', '18:40', '19:30'
  ];
  var EULJI_5300 = [
    '04:00', '04:20', '04:40', '05:00', '05:20', '05:40', '06:00', '06:20', '07:15', '07:50',
    '08:30', '09:10', '09:50', '10:30', '11:10', '11:45', '12:15', '12:45', '13:15', '14:15',
    '14:40', '15:00', '15:30', '16:10', '16:50', '17:30', '19:00'
  ];
  var EULJI_N5300 = ['21:30', '02:00'];
  var SAVEZONE_5100 = ['04:25', '06:05', '07:45', '09:35', '11:35', '13:35', '15:35', '17:35', '19:35'];
  var ORI_5200 = ['05:15', '06:55', '08:35', '10:35', '12:35', '14:35', '16:35', '18:35', '20:35'];

  var ROUTES = [
    {
      id: '5400', airport: 'ICN', operator: '경기고속', verified: true,
      source: '경기고속 5400 시간표, 2026년 3월 1일 시행',
      bookOut: 'bustago', bookIn: 'bustago',
      stops: {
        dankook: ['04:40', '06:20', '11:50', '15:40'],
        ori: shift(MIGEUM_5400, -5),
        miguem: MIGEUM_5400,
        jeongja: shift(MIGEUM_5400, 5),
        sunae: shift(MIGEUM_5400, 10),
        seohyeon: shift(MIGEUM_5400, 20)
      },
      fromAirport: ['06:30', '07:15', '07:50', '08:15', '08:45', '09:15', '09:40', '10:05', '10:30', '11:00',
        '12:00', '12:40', '13:15', '14:00', '14:40', '15:20', '15:50', '16:30', '17:00', '17:20',
        '17:45', '18:40', '19:15', '19:45', '20:20', '21:00', '21:20', '22:00'],
      note: '단국대에서 공항 가는 5400은 하루 4번입니다. 공항에서 오는 차가 단국대까지 가는지는 예매할 때 확인해 주세요.'
    },
    {
      id: '5300', airport: 'ICN', operator: '경기고속', verified: true,
      source: '경기고속 5300 시간표, 2026년 3월 1일 시행 (심야 N5300 포함)',
      bookOut: 'bustago', bookIn: 'bustago',
      stops: {
        eulji: EULJI_5300.concat(EULJI_N5300),
        savezone: shift(EULJI_5300, 5).concat(shift(EULJI_N5300, 5)),
        moran: shift(EULJI_5300, 10).concat(shift(EULJI_N5300, 10)),
        yatap: shift(EULJI_5300, 20).concat(shift(EULJI_N5300, 15)),
        imae: shift(EULJI_5300, 25).concat(shift(EULJI_N5300, 20)),
        seohyeon: shift(EULJI_5300, 30).concat(shift(EULJI_N5300, 25))
      },
      fromAirport: ['00:10', '03:50', '06:10', '06:45', '07:30', '08:00', '08:30', '09:00', '09:30', '09:50',
        '10:45', '11:15', '11:50', '12:20', '13:00', '13:30', '14:20', '15:00', '15:40', '16:10',
        '16:50', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:40', '21:40']
    },
    {
      id: '8282', airport: 'ICN', operator: '경남여객', verified: false,
      source: '인천공항서비스 안내의 T1 출발 시각에서 20분을 뺀 값',
      bookOut: 'bustago', bookIn: 'tmoneygo',
      stops: { jukjeon: [] },
      fromAirport: ['06:55', '07:35', '07:55', '10:40', '13:15', '13:55', '16:55', '18:15', '20:15', '20:55'],
      note: '8282 공항 가는 시각은 설정의 시간표에서 직접 넣어 주세요. 공항에서 오는 시각도 확인 전입니다.'
    },
    {
      id: '5200', airport: 'GMP', operator: '경기고속', verified: false,
      source: '경기고속 5200 시간표 (작성일 미상)',
      bookOut: 'bustago', bookIn: 'bustago',
      stops: {
        ori: ORI_5200,
        miguem: shift(ORI_5200, 8),
        jeongja: shift(ORI_5200, 13),
        sunae: shift(ORI_5200, 18),
        seohyeon: shift(ORI_5200, 25)
      },
      arrive: ['07:05', '09:10', '11:00', '12:50', '14:50', '16:30', '19:00', '21:00', '22:50'],
      fromAirport: [],
      fromAirportRange: '김포공항 출발 06:30~22:50',
      note: '5200 시간표는 작성일이 적혀 있지 않습니다. 김포공항에서 오는 시각표는 아직 없어 첫차·막차만 알려 드려요.'
    },
    {
      id: '5100', airport: 'GMP', operator: '경기고속', verified: false,
      source: '경기고속 5100 시간표 (작성일 미상)',
      bookOut: 'bustago', bookIn: 'bustago',
      stops: {
        savezone: SAVEZONE_5100,
        moran: shift(SAVEZONE_5100, 8),
        yatap: shift(SAVEZONE_5100, 15),
        imae: shift(SAVEZONE_5100, 20),
        seohyeon: shift(SAVEZONE_5100, 25)
      },
      arrive: ['06:00', '08:00', '10:10', '11:50', '13:50', '15:40', '18:00', '20:00', '22:00'],
      fromAirport: [],
      fromAirportRange: '김포공항 출발 06:00~22:20',
      note: '5100 시간표는 작성일이 적혀 있지 않습니다. 김포공항에서 오는 시각표는 아직 없어 첫차·막차만 알려 드려요.'
    }
  ];

  var DEFAULTS = {
    places: DEFAULT_PLACES,
    prep: 60,             // 일어나서 집을 나설 때까지
    early: 5,             // 정류장에 미리 가 있기
    arriveBefore: 180,    // 인천 출발 몇 분 전까지 공항 도착
    arriveBeforeGmp: 120, // 김포 출발 몇 분 전까지 공항 도착
    maxSpare: 90,         // 목표보다 이만큼 넘게 일찍 닿는 차는 다음 순위를 먼저 본다
    afterLanding: 60,     // 착륙 후 버스 타는 곳까지
    bookDaysBefore: 14,   // 버스 예매 알림을 비행 며칠 전에
    busToAirport: {},     // 'miguem>ICN': 100 처럼 직접 넣은 소요 시간
    busFromAirport: {},   // 'ICN>miguem': 105
    customOut: {}         // '8282@jukjeon': '04:30 06:10' 처럼 직접 넣은 공항행 시각
  };

  var APPS = {
    bustago: {
      label: '버스타고',
      android: 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;' +
        'package=com.ebcard.bustago;S.browser_fallback_url=' +
        encodeURIComponent('https://play.google.com/store/apps/details?id=com.ebcard.bustago') + ';end',
      ios: 'https://apps.apple.com/kr/app/id966782397',
      web: 'https://www.bustago.or.kr/'
    },
    tmoneygo: {
      label: '티머니GO',
      android: 'https://play.google.com/store/search?q=' + encodeURIComponent('티머니GO') + '&c=apps',
      ios: 'https://apps.apple.com/kr/app/id1483433931',
      web: 'https://www.tmoneygo.co.kr/'
    }
  };

  /* ---------------- 시각 ---------------- */

  function toMin(text) {
    var m = /^\s*(\d{1,2}):?(\d{2})\s*$/.exec(String(text == null ? '' : text));
    if (!m) return null;
    var h = +m[1], mm = +m[2];
    if (h > 23 || mm > 59) return null;
    return h * 60 + mm;
  }

  /** '04:30 0610, 7:05' 같은 글에서 시각만 골라 정렬한다. */
  function parseTimes(text) {
    var seen = {};
    return String(text || '').split(/[\s,/]+/)
      .map(toMin)
      .filter(function (n) {
        if (n == null || seen[n]) return false;
        seen[n] = true;
        return true;
      })
      .sort(function (a, b) { return a - b; });
  }

  function wrap(min) {
    var day = 0;
    while (min < 0) { min += 1440; day--; }
    while (min >= 1440) { min -= 1440; day++; }
    return { min: min, day: day };
  }

  /** 540 → '오전 9:00'. 날을 넘기면 '전날'·'다음 날' 을 붙인다. */
  function clock(min, noDay) {
    if (min == null) return '시각 모름';
    var w = wrap(min);
    var h = Math.floor(w.min / 60), m = w.min % 60;
    var text = (h < 12 ? '오전 ' : '오후 ') + (h % 12 === 0 ? 12 : h % 12) + ':' + (m < 10 ? '0' : '') + m;
    if (noDay || !w.day) return text;
    return (w.day < 0 ? '전날 ' : '다음 날 ') + text;
  }

  /** 540 → '09:00' (입력칸과 캘린더 파일용) */
  function hhmm(min) {
    var w = wrap(min);
    var h = Math.floor(w.min / 60), m = w.min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /** 시간표 목록을 몇 분씩 밀어 옆 정류장 시간표를 만든다 */
  function shift(list, minutes) {
    return list.map(function (t) { return hhmm(toMin(t) + minutes); });
  }

  function span(minutes) {
    var sign = minutes < 0 ? '-' : '';
    var abs = Math.abs(minutes);
    var h = Math.floor(abs / 60), m = abs % 60;
    if (!h) return sign + m + '분';
    return sign + h + '시간' + (m ? ' ' + m + '분' : '');
  }

  function weekdayOf(iso) {
    return new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
  }

  function round5(n) { return Math.round(n / 5) * 5; }

  /* ---------------- 설정과 출발지 ---------------- */

  function defaultPlaces() {
    return JSON.parse(JSON.stringify(DEFAULT_PLACES));
  }

  function settingsWith(settings) {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      var value = settings && settings[key];
      if (key === 'places') {
        out.places = Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : defaultPlaces();
      } else if (typeof DEFAULTS[key] === 'object') {
        out[key] = Object.assign({}, value && typeof value === 'object' ? value : {});
      } else {
        out[key] = value == null || value === '' ? DEFAULTS[key] : value;
      }
    });
    return out;
  }

  /** 추천에 쓰는 출발지, 우선순위 순 */
  function activePlaces(s) {
    return (s.places || []).filter(function (place) {
      return place.enabled !== false && place.stops && place.stops.some(function (e) { return STOPS[e.stop]; });
    });
  }

  function routeById(id) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i];
    return null;
  }

  function hasStop(route, stopId) {
    return Object.prototype.hasOwnProperty.call(route.stops, stopId);
  }

  function routesFor(stopId, airport) {
    return ROUTES.filter(function (route) { return route.airport === airport && hasStop(route, stopId); });
  }

  /** 그 정류장에 서는 모든 공항버스 */
  function routesAt(stopId) {
    return ROUTES.filter(function (route) { return hasStop(route, stopId); });
  }

  /** 좌표에서 가까운 정류장 순. km 는 직선거리 대략값 */
  function stopsNear(lat, lon) {
    return Object.keys(STOPS).map(function (id) {
      var stop = STOPS[id];
      return { id: id, km: distanceKm(lat, lon, stop.lat, stop.lon) };
    }).sort(function (a, b) { return a.km - b.km; });
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function departuresToAirport(route, stopId, s) {
    var own = s.customOut && s.customOut[route.id + '@' + stopId];
    if (own && parseTimes(own).length) return parseTimes(own);
    return (route.stops[stopId] || []).map(toMin);
  }

  /* ---------------- 걸리는 시간 ---------------- */

  var travelData = null;

  /** TMAP 예측표를 넣는다. src/family/travel-data.js 가 부른다. */
  function setTravelData(data) {
    travelData = data && data.routes && Object.keys(data.routes).length ? data : null;
  }

  /** 지금 쓰는 예측표 정보. 없으면 null. */
  function travelInfo() {
    if (!travelData) return null;
    return { source: travelData.source, generated: travelData.generated, pairs: Object.keys(travelData.routes) };
  }

  /**
   * 요일·시간대 보정. 경부·영동·수도권제1순환 출퇴근 흐름을 대략 따른 추정이다.
   * direction: 'out' 공항 가는 길, 'in' 집에 오는 길
   */
  function congestion(weekday, hour, direction) {
    if (hour < 6 || hour >= 22) return { factor: 0.9, why: '한산한 시간' };
    var weekend = weekday === 0 || weekday === 6;
    if (!weekend && (hour === 7 || hour === 8)) return { factor: 1.2, why: '출근 시간' };
    if (!weekend && (hour === 17 || hour === 18)) return { factor: 1.2, why: '퇴근 시간' };
    if (weekday === 5 && hour >= 15 && hour < 20) return { factor: 1.25, why: '금요일 오후' };
    if (weekday === 0 && direction === 'in' && hour >= 15 && hour < 21) return { factor: 1.2, why: '일요일 귀경길' };
    if (weekend && hour >= 10 && hour < 19) return { factor: 1.1, why: '주말 낮' };
    return { factor: 1, why: '' };
  }

  function travelKey(direction, stopId, airport) {
    return direction === 'out' ? stopId + '>' + airport : airport + '>' + stopId;
  }

  /**
   * 한 번 타는 데 걸리는 분과 그 근거.
   * index: 시간표 줄 번호 (공항 도착 시각이 적힌 노선에서 쓴다)
   */
  function travelMinutes(route, stopId, direction, iso, startMin, index, s) {
    var airport = route.airport;
    var key = travelKey(direction, stopId, airport);
    var weekday = weekdayOf(iso);
    var w = wrap(startMin);
    var hour = Math.floor(w.min / 60);
    var dayName = WEEKDAYS[weekday] + '요일 ' + hour + '시대';

    var own = (direction === 'out' ? s.busToAirport : s.busFromAirport)[key];
    if (own != null && own !== '') {
      return { minutes: +own, source: 'setting', basis: '설정에 직접 넣은 ' + own + '분' };
    }

    if (direction === 'out' && route.arrive && index != null && route.arrive[index]) {
      var stopTimes = route.stops[stopId] || [];
      var minutes = toMin(route.arrive[index]) - toMin(stopTimes[index]);
      if (minutes > 0) {
        return { minutes: minutes, source: 'timetable', basis: route.id + ' 시간표의 공항 도착 ' + route.arrive[index] + ' 기준' };
      }
    }

    var table = travelData && travelData.routes[key];
    var car = table && table.byWeekday && table.byWeekday[weekday] && table.byWeekday[weekday][hour];
    if (car) {
      var factor = travelData.busFactor || 1.2;
      var overhead = travelData.overhead || 10;
      return {
        minutes: round5(car * factor + overhead), source: 'tmap',
        basis: 'TMAP 예측 ' + dayName + ' 자동차 ' + car + '분 기준' + (travelData.generated ? ' (' + travelData.generated + ' 조회)' : '')
      };
    }

    var stop = STOPS[stopId];
    var base = stop && (direction === 'out' ? stop.toAirport : stop.fromAirport)[airport];
    if (!base) return { minutes: null, source: 'none', basis: '걸리는 시간을 알 수 없음' };
    var c = congestion(weekday, hour, direction);
    return {
      minutes: round5(base * c.factor), source: 'estimate',
      basis: dayName + ' 추정, 평소 ' + base + '분' + (c.why ? '에 ' + c.why + ' 반영' : '')
    };
  }

  /* ---------------- 고르기 ---------------- */

  function baseOption(route, place, rank, entry, travel) {
    var stop = STOPS[entry.stop];
    return {
      route: route.id, operator: route.operator, verified: route.verified,
      placeId: place.id, placeName: place.name, rank: rank,
      stop: entry.stop, stopName: stop.name, stopDetail: stop.detail,
      walk: entry.walk == null || entry.walk === '' ? 15 : +entry.walk,
      travel: travel.minutes, source: travel.source, basis: travel.basis
    };
  }

  /** 한 출발지에서 공항 가는 모든 차. 같은 차를 여러 정류장에서 타면 집에서 늦게 나서도 되는 쪽만 남긴다. */
  function placeOptionsOut(place, rank, airport, iso, target, s, missing) {
    var seen = {};
    place.stops.forEach(function (entry) {
      if (!STOPS[entry.stop]) return;
      routesFor(entry.stop, airport).forEach(function (route) {
        var times = departuresToAirport(route, entry.stop, s);
        if (!times.length) {
          missing.push({ route: route.id, stop: entry.stop, place: place.name });
          return;
        }
        var own = s.customOut && s.customOut[route.id + '@' + entry.stop];
        times.forEach(function (t, index) {
          var travel = travelMinutes(route, entry.stop, 'out', iso, t, own ? null : index, s);
          if (travel.minutes == null) return;
          var option = baseOption(route, place, rank, entry, travel);
          option.board = t;
          option.arrive = t + travel.minutes;
          option.spare = target - option.arrive;
          option.fit = option.spare >= 0;
          option.good = option.fit && option.spare <= +s.maxSpare;
          option.leaveHome = t - s.early - option.walk;
          option.wake = option.leaveHome - s.prep;
          option.booking = route.bookOut;
          var busKey = route.id + '#' + (own ? t : index);
          if (!seen[busKey] || seen[busKey].leaveHome < option.leaveHome) seen[busKey] = option;
        });
      });
    });
    return Object.keys(seen).map(function (key) { return seen[key]; });
  }

  function latestLeave(list) {
    return list.slice().sort(function (a, b) { return b.leaveHome - a.leaveHome; });
  }

  /**
   * 공항 가는 날.
   * 1. 위 순위 출발지부터, 목표에 맞고 너무 일찍 닿지 않는(여유 maxSpare 이하) 차 가운데 집에서 가장 늦게 나서는 차
   * 2. 그런 차가 어디에도 없으면, 목표에 맞는 차를 위 순위부터
   * 3. 그것도 없으면 가장 덜 늦는 차
   */
  function recommendOut(departMin, iso, airport, settings) {
    var s = settingsWith(settings);
    if (departMin == null) return { status: 'no-time', airport: airport };
    var target = departMin - (airport === 'GMP' ? +s.arriveBeforeGmp : +s.arriveBefore);
    var places = activePlaces(s);
    if (!places.length) return { status: 'no-places', airport: airport, target: target, depart: departMin };

    var missing = [];
    var byPlace = places.map(function (place, rank) {
      return placeOptionsOut(place, rank, airport, iso, target, s, missing);
    });
    var all = [].concat.apply([], byPlace);
    if (!all.length) return { status: 'no-timetable', airport: airport, target: target, depart: departMin, missing: missing };

    var pick = null, why = 'good';
    var i;
    for (i = 0; i < byPlace.length && !pick; i++) {
      pick = latestLeave(byPlace[i].filter(function (o) { return o.good; }))[0] || null;
    }
    if (!pick) {
      why = 'early';
      for (i = 0; i < byPlace.length && !pick; i++) {
        pick = latestLeave(byPlace[i].filter(function (o) { return o.fit; }))[0] || null;
      }
    }
    if (!pick) {
      why = 'late';
      pick = all.slice().sort(function (a, b) { return b.spare - a.spare || a.rank - b.rank; })[0];
    }

    // 후보: 추천, 같은 곳의 한 대 앞, 다른 출발지마다 가장 나은 차 하나, 같은 곳의 늦는 차 하나
    var choices = [pick];
    function add(option) { if (option && choices.indexOf(option) < 0) choices.push(option); }
    var samePlace = byPlace[pick.rank];
    add(latestLeave(samePlace.filter(function (o) { return o.fit && o.board < pick.board; }))[0]);
    byPlace.forEach(function (list, rank) {
      if (rank === pick.rank) return;
      add(latestLeave(list.filter(function (o) { return o.good; }))[0] ||
        latestLeave(list.filter(function (o) { return o.fit; }))[0]);
    });
    add(samePlace.filter(function (o) { return !o.fit; }).sort(function (a, b) { return b.spare - a.spare; })[0]);
    choices.forEach(function (o) { o.pick = o === pick; });
    choices.sort(function (a, b) { return a.rank - b.rank || a.board - b.board; });

    var fitCount = byPlace[pick.rank].filter(function (o) { return why === 'good' ? o.good : o.fit; }).length;
    return Object.assign({
      status: why === 'late' ? 'late' : 'ok',
      airport: airport, target: target, depart: departMin,
      choices: choices, missing: missing, places: places.map(function (p) { return p.name; }),
      reason: reasonOut(pick, target, why, fitCount, places, s)
    }, pick);
  }

  function reasonOut(pick, target, why, fitCount, places, s) {
    var trip = pick.stopName + ' ' + hhmm(pick.board) + ' 출발, ' + span(pick.travel) + ' 걸려 ' +
      clock(pick.arrive) + ' 도착 예상 (' + pick.basis + ')';
    if (why === 'late') {
      return '어느 출발지에서도 목표 ' + clock(target) + '에 맞는 차가 없습니다. 가장 덜 늦는 차는 ' +
        (pick.rank + 1) + '순위 ' + pick.placeName + '의 ' + trip + '로 ' + span(-pick.spare) + ' 늦습니다.';
    }
    var head = '';
    if (pick.rank > 0) {
      head = places.slice(0, pick.rank).map(function (p, k) { return (k + 1) + '순위 ' + p.name; }).join(', ') +
        '에는 ' + (why === 'good' ? '여유 ' + s.maxSpare + '분 안에 맞는 차가 없어 ' : '맞는 차가 없어 ') +
        (pick.rank + 1) + '순위 ' + pick.placeName + '에서 골랐습니다. ';
    } else {
      head = '1순위 ' + pick.placeName + '에서 ';
    }
    var body = '공항 도착 목표 ' + clock(target) + '에 맞는 ' + fitCount + '대 가운데 집에서 가장 늦게 나서도 되는 차입니다. ';
    var tail = why === 'early' ? ' 모든 차가 목표보다 ' + s.maxSpare + '분 넘게 일찍 닿습니다.' : '';
    return head + body + trip + ', 여유 ' + span(pick.spare) + '.' + tail;
  }

  /** 공항에 내리는 날: 착륙 후 나올 시간을 더해, 위 순위 출발지로 가장 빨리 가는 차. */
  function recommendIn(arriveMin, iso, airport, settings) {
    var s = settingsWith(settings);
    if (arriveMin == null) return { status: 'no-time', airport: airport };
    var places = activePlaces(s);
    var ready = arriveMin + +s.afterLanding;
    if (!places.length) return { status: 'no-places', airport: airport, arrive: arriveMin, ready: ready };
    var ranges = [];
    var hadTimes = false;
    var last = null;

    var byPlace = places.map(function (place, rank) {
      var seen = {};
      place.stops.forEach(function (entry) {
        if (!STOPS[entry.stop]) return;
        routesFor(entry.stop, airport).forEach(function (route) {
          var times = (route.fromAirport || []).map(toMin);
          if (!times.length) {
            var range = route.id + ' ' + route.fromAirportRange;
            if (route.fromAirportRange && ranges.indexOf(range) < 0) ranges.push(range);
            return;
          }
          hadTimes = true;
          last = Math.max(last == null ? -1 : last, times[times.length - 1]);
          times.forEach(function (t) {
            if (t < ready) return;
            var travel = travelMinutes(route, entry.stop, 'in', iso, t, null, s);
            if (travel.minutes == null) return;
            var option = baseOption(route, place, rank, entry, travel);
            option.board = t;
            option.wait = t - ready;
            option.reachStop = t + travel.minutes;
            option.home = option.reachStop + option.walk;
            option.arrive = arriveMin;
            option.booking = route.bookIn;
            var busKey = route.id + '#' + t;
            if (!seen[busKey] || seen[busKey].home > option.home) seen[busKey] = option;
          });
        });
      });
      return Object.keys(seen).map(function (key) { return seen[key]; })
        .sort(function (a, b) { return a.home - b.home || a.board - b.board; });
    });

    var pickRank = -1;
    for (var i = 0; i < byPlace.length; i++) {
      if (byPlace[i].length) { pickRank = i; break; }
    }
    if (pickRank < 0) {
      return { status: hadTimes ? 'missed' : 'no-timetable', airport: airport, arrive: arriveMin, ready: ready, last: last, ranges: ranges };
    }
    var pick = byPlace[pickRank][0];
    var choices = byPlace[pickRank].slice(0, 2);
    byPlace.forEach(function (list, rank) { if (rank !== pickRank && list[0]) choices.push(list[0]); });
    choices.forEach(function (o) { o.pick = o === pick; });

    var head = pickRank > 0
      ? places.slice(0, pickRank).map(function (p, k) { return (k + 1) + '순위 ' + p.name; }).join(', ') + '로 가는 차가 없어 ' + (pickRank + 1) + '순위 ' + pick.placeName + '(으)로 골랐습니다. '
      : '1순위 ' + pick.placeName + '(으)로 ';
    return Object.assign({
      status: 'ok', airport: airport, arrive: arriveMin, ready: ready,
      choices: choices, ranges: ranges,
      reason: head + '착륙 ' + clock(arriveMin) + '에 ' + span(+s.afterLanding) + '을 더해 ' + clock(ready) + '쯤 나온다고 보고, ' +
        '집에 가장 빨리 닿는 차입니다. ' + span(pick.travel) + ' 걸려 ' + pick.stopName + ' ' + clock(pick.reachStop) + ' 도착 예상 (' + pick.basis + ').'
    }, pick);
  }

  /* ---------------- 예매한 차 ---------------- */

  function placeEntryFor(s, placeId, stopId) {
    var places = s.places || [];
    var place = places.filter(function (p) { return p.id === placeId; })[0] ||
      places.filter(function (p) { return p.stops.some(function (e) { return e.stop === stopId; }); })[0] || null;
    var entry = place && place.stops.filter(function (e) { return e.stop === stopId; })[0];
    return {
      place: place || { id: placeId || '', name: '' },
      entry: entry || { stop: stopId, walk: 15 },
      rank: place ? places.indexOf(place) : 0
    };
  }

  /**
   * 예매해 둔 차로 공항 가는 날 일정을 다시 잰다. 비행 시각이 바뀌면 늦는지 알려준다.
   * booked: { route, stop, board, placeId }
   */
  function bookedOut(departMin, iso, airport, settings, booked) {
    var s = settingsWith(settings);
    var route = booked && routeById(booked.route);
    if (!route || !STOPS[booked.stop] || booked.board == null) return null;
    var own = s.customOut && s.customOut[route.id + '@' + booked.stop];
    var index = departuresToAirport(route, booked.stop, s).indexOf(+booked.board);
    var travel = travelMinutes(route, booked.stop, 'out', iso, +booked.board, own || index < 0 ? null : index, s);
    if (travel.minutes == null) return null;
    var pe = placeEntryFor(s, booked.placeId, booked.stop);
    var option = baseOption(route, pe.place, pe.rank, pe.entry, travel);
    var target = departMin == null ? null : departMin - (airport === 'GMP' ? +s.arriveBeforeGmp : +s.arriveBefore);
    option.board = +booked.board;
    option.arrive = option.board + travel.minutes;
    option.airport = airport;
    option.depart = departMin;
    option.target = target;
    option.spare = target == null ? null : target - option.arrive;
    option.fit = option.spare == null || option.spare >= 0;
    option.leaveHome = option.board - s.early - option.walk;
    option.wake = option.leaveHome - s.prep;
    option.booking = route.bookOut;
    option.booked = true;
    option.status = option.fit ? 'ok' : 'late';
    return option;
  }

  /** 예매해 둔 차로 집에 오는 날. 착륙이 늦어져 차를 놓치면 fit 이 false. */
  function bookedIn(arriveMin, iso, airport, settings, booked) {
    var s = settingsWith(settings);
    var route = booked && routeById(booked.route);
    if (!route || !STOPS[booked.stop] || booked.board == null) return null;
    var travel = travelMinutes(route, booked.stop, 'in', iso, +booked.board, null, s);
    if (travel.minutes == null) return null;
    var pe = placeEntryFor(s, booked.placeId, booked.stop);
    var option = baseOption(route, pe.place, pe.rank, pe.entry, travel);
    option.board = +booked.board;
    option.airport = airport;
    option.arrive = arriveMin;
    option.ready = arriveMin == null ? null : arriveMin + +s.afterLanding;
    option.wait = option.ready == null ? null : option.board - option.ready;
    option.fit = option.wait == null || option.wait >= 0;
    option.reachStop = option.board + travel.minutes;
    option.home = option.reachStop + option.walk;
    option.booking = route.bookIn;
    option.booked = true;
    option.status = option.fit ? 'ok' : 'missed';
    return option;
  }

  /* ---------------- 예매 알림 ---------------- */

  /** 비행일 며칠 전 날짜 */
  function bookingDay(iso, daysBefore) {
    var d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) - (+daysBefore || 0)));
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /* ---------------- 앱 연결 ---------------- */

  function platformOf(userAgent, touchPoints) {
    var ua = String(userAgent || '');
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    // iPadOS 사파리는 맥으로 자신을 소개한다
    if (/macintosh/i.test(ua) && touchPoints > 1) return 'ios';
    return 'web';
  }

  function booking(appId, platform) {
    var app = APPS[appId] || APPS.bustago;
    var href = app[platform] || app.web;
    return { label: app.label, href: href, external: !/^intent:/.test(href) };
  }

  /**
   * 버스타고 모바일 웹의 터미널 코드. 사이트 터미널 목록에서 확인한 것만 둔다.
   * 코드를 모르는 정류장은 예매 링크에 구간을 채우지 못하고 첫 화면을 연다.
   */
  var BUSTAGO_TERMINALS = {
    miguem: { code: '1214', name: '미금역' },
    ori: { code: '1215', name: '오리역' },
    seohyeon: { code: '1208', name: '서현역' },
    ICN: { code: '9337', name: '인천공항T2' }
  };

  /** 출발지, 도착지, 날짜가 채워진 버스타고 조회 화면 주소. 모르는 구간이면 null. */
  function bustagoSearch(stop, airport, direction, iso) {
    var place = BUSTAGO_TERMINALS[stop];
    var port = BUSTAGO_TERMINALS[airport];
    if (!place || !port || !/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    var from = direction === 'in' ? port : place;
    var to = direction === 'in' ? place : port;
    return 'https://m.bustago.or.kr:444/mobus/btmho/BTMHORN0001.do' +
      '?sterCode=' + from.code + '&eterCode=' + to.code +
      '&sterName=' + encodeURIComponent(from.name) + '&eterName=' + encodeURIComponent(to.name) +
      '&startDate=' + iso.replace(/-/g, '');
  }

  /** 안드로이드 시계 앱을 그 시각이 채워진 채로 연다. 날짜는 못 넘기므로 전날 밤에 누른다. */
  function androidAlarm(min, message) {
    var w = wrap(min);
    return 'intent:#Intent;action=android.intent.action.SET_ALARM;' +
      'i.android.intent.extra.alarm.HOUR=' + Math.floor(w.min / 60) + ';' +
      'i.android.intent.extra.alarm.MINUTES=' + (w.min % 60) + ';' +
      'S.android.intent.extra.alarm.MESSAGE=' + encodeURIComponent(message || '') + ';end';
  }

  return {
    WEEKDAYS: WEEKDAYS,
    AIRPORTS: AIRPORTS,
    STOPS: STOPS,
    ROUTES: ROUTES,
    DEFAULTS: DEFAULTS,
    APPS: APPS,
    BUSTAGO_TERMINALS: BUSTAGO_TERMINALS,
    bustagoSearch: bustagoSearch,
    toMin: toMin,
    parseTimes: parseTimes,
    clock: clock,
    hhmm: hhmm,
    span: span,
    wrap: wrap,
    weekdayOf: weekdayOf,
    settingsWith: settingsWith,
    defaultPlaces: defaultPlaces,
    activePlaces: activePlaces,
    routeById: routeById,
    routesFor: routesFor,
    routesAt: routesAt,
    stopsNear: stopsNear,
    distanceKm: distanceKm,
    departuresToAirport: departuresToAirport,
    setTravelData: setTravelData,
    travelInfo: travelInfo,
    congestion: congestion,
    travelKey: travelKey,
    travelMinutes: travelMinutes,
    recommendOut: recommendOut,
    recommendIn: recommendIn,
    bookedOut: bookedOut,
    bookedIn: bookedIn,
    bookingDay: bookingDay,
    platformOf: platformOf,
    booking: booking,
    androidAlarm: androidAlarm
  };
});
