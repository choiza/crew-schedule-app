/**
 * 비행 당일 실제 출발·도착 시각 가져오기.
 * 브라우저에서는 window.CrewCal.flightstatus, Node 에서는 require('./flightstatus.js') 로 사용한다.
 *
 * 출처 (공공데이터포털, 2026년 9월 확인)
 *   인천: 인천국제공항공사 여객편 운항현황(다국어), 당일만
 *         B551177/StatusOfPassengerFlightsOdp/getPassengerDeparturesOdp, ...ArrivalsOdp
 *   김포: 한국공항공사 실시간 항공기 운항정보 조회
 *         B551178/flight-status/depart, .../arrival
 * 대한항공은 공개 운항 API 가 없다. 한국 공항 쪽 시각만 가져온다.
 *
 * 부르는 방법은 두 가지다. config.js 의 FLIGHT_STATUS 에서 고른다.
 *   proxyUrl   키를 숨긴 중계 주소 (scripts/flight-status-worker.js). 공개 사이트는 이쪽을 권한다.
 *   serviceKey 공공데이터포털 인증키를 페이지에 바로 넣는다. 키가 누구에게나 보인다.
 *
 * 응답 필드 이름은 문서 기준이며, 공항마다 달라 여러 이름을 차례로 본다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.flightstatus = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BASE = 'https://apis.data.go.kr/';
  var PATHS = {
    ICN: { out: 'B551177/StatusOfPassengerFlightsOdp/getPassengerDeparturesOdp', in: 'B551177/StatusOfPassengerFlightsOdp/getPassengerArrivalsOdp' },
    GMP: { out: 'B551178/flight-status/depart', in: 'B551178/flight-status/arrival' }
  };
  var PROXY_ROUTE = {
    ICN: { out: 'icn_dep', in: 'icn_arr' },
    GMP: { out: 'gmp_dep', in: 'gmp_arr' }
  };

  function enabled(cfg) {
    return !!(cfg && cfg.enabled && (cfg.proxyUrl || cfg.serviceKey));
  }

  /** KE0901 → ['KE901', 'KE0901']. 공항 자료는 앞의 0 을 떼고 적는 경우가 많다. */
  function flightIds(code) {
    var text = String(code || '').toUpperCase().replace(/\s+/g, '');
    var m = /^([A-Z0-9]{2})0*(\d+[A-Z]?)$/.exec(text);
    if (!m) return [text];
    var short = m[1] + m[2];
    return short === text ? [text] : [short, text];
  }

  /** '202610051205', '1205', '12:05' → '12:05' */
  function clockOf(value) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    if (digits.length >= 12) digits = digits.slice(8, 12);
    if (digits.length !== 4) return null;
    var h = +digits.slice(0, 2), m = +digits.slice(2);
    if (h > 23 || m > 59) return null;
    return digits.slice(0, 2) + ':' + digits.slice(2);
  }

  function itemsOf(json) {
    var body = json && ((json.response && json.response.body) || json.body);
    var items = body && body.items;
    if (items && items.item) items = items.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  function first(item, names) {
    for (var i = 0; i < names.length; i++) {
      var value = item[names[i]];
      if (value != null && value !== '') return value;
    }
    return null;
  }

  function parseItem(item) {
    var scheduled = clockOf(first(item, ['scheduleDateTime', 'std', 'STD', 'sta', 'STA', 'scheduledTime']));
    var estimated = clockOf(first(item, ['estimatedDateTime', 'etd', 'ETD', 'eta', 'ETA', 'changedTime']));
    return {
      scheduled: scheduled,
      estimated: estimated,
      time: estimated || scheduled,
      gate: first(item, ['gatenumber', 'gate', 'GATE']),
      remark: first(item, ['remark', 'rmkKor', 'RMK_KOR', 'rmk']),
      terminal: first(item, ['terminalId', 'terminal'])
    };
  }

  function buildUrl(cfg, airport, direction, flightId) {
    if (cfg.proxyUrl) {
      var url = new URL(cfg.proxyUrl);
      url.searchParams.set('r', PROXY_ROUTE[airport][direction]);
      url.searchParams.set('flight_id', flightId);
      if (airport === 'GMP') url.searchParams.set('airport_code', 'GMP');
      return url.toString();
    }
    // 포털의 "인코딩" 키를 그대로 붙인다. 한 번 더 인코딩하면 키 오류가 난다.
    return BASE + PATHS[airport][direction] + '?serviceKey=' + cfg.serviceKey +
      '&type=json&numOfRows=20&pageNo=1&flight_id=' + encodeURIComponent(flightId) +
      (airport === 'GMP' ? '&airport_code=GMP' : '');
  }

  /**
   * 한 편의 오늘 상태. 못 찾으면 null.
   * airport: 'ICN' | 'GMP', direction: 'out' 한국 출발 | 'in' 한국 도착
   */
  function fetchStatus(cfg, code, airport, direction, fetcher) {
    if (!PATHS[airport]) return Promise.resolve(null);
    var get = fetcher || (typeof fetch === 'function' ? fetch : null);
    if (!get) return Promise.reject(new Error('fetch 를 쓸 수 없습니다.'));
    var ids = flightIds(code);
    function tryAt(i) {
      if (i >= ids.length) return Promise.resolve(null);
      return get(buildUrl(cfg, airport, direction, ids[i])).then(function (res) {
        if (!res.ok) throw new Error('운항 정보 요청 실패 (HTTP ' + res.status + ')');
        return res.json();
      }).then(function (json) {
        var items = itemsOf(json);
        if (!items.length) return tryAt(i + 1);
        var parsed = parseItem(items[0]);
        return parsed.time ? parsed : tryAt(i + 1);
      });
    }
    return tryAt(0);
  }

  return {
    PATHS: PATHS,
    enabled: enabled,
    flightIds: flightIds,
    clockOf: clockOf,
    itemsOf: itemsOf,
    parseItem: parseItem,
    buildUrl: buildUrl,
    fetchStatus: fetchStatus
  };
});
