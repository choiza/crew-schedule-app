/**
 * 크루 스케줄에서 쓰이는 근무 코드 사전.
 * 브라우저에서는 window.CrewCal.codes, Node 에서는 require('./codes.js') 로 사용한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.codes = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // category: flight | layover | standby | off | vacation | training | other
  var CATEGORY_LABELS = {
    flight: '비행',
    layover: '체류',
    standby: '대기',
    off: '휴무',
    vacation: '휴가',
    training: '훈련',
    other: '기타',
    unknown: '미확인'
  };

  var DUTY_CODES = {
    // 휴무 계열
    DO: { label: '휴무', category: 'off' },
    OFF: { label: '휴무', category: 'off' },
    X: { label: '휴무', category: 'off' },
    ATDO: { label: '휴무', category: 'off' },
    ADO: { label: '휴무', category: 'off' },
    GDO: { label: '보장 휴무', category: 'off' },
    CDO: { label: '보상 휴무', category: 'off' },
    VAC: { label: '휴가', category: 'vacation' },
    YVS: { label: '휴가', category: 'vacation' },
    PDO: { label: '휴무', category: 'off' },
    ANL: { label: '연차 휴가', category: 'vacation' },
    AL: { label: '연차 휴가', category: 'vacation' },
    PL: { label: '개인 휴가', category: 'vacation' },
    FVC: { label: '휴가', category: 'vacation' },
    PVC: { label: '휴가', category: 'vacation' },
    UL: { label: '무급 휴가', category: 'vacation' },

    // 대기 계열
    STBY: { label: '대기', category: 'standby' },
    SBY: { label: '대기', category: 'standby' },
    STB: { label: '대기', category: 'standby' },
    HSBY: { label: '자택 대기', category: 'standby' },
    RF: { label: '자택 대기', category: 'standby' },
    SA: { label: '김포공항 대기', category: 'standby' },
    SB: { label: '김포공항 대기', category: 'standby' },
    SC: { label: '김포공항 대기', category: 'standby' },
    IA: { label: '인천공항 대기', category: 'standby' },
    IB: { label: '인천공항 대기', category: 'standby' },
    IC: { label: '인천공항 대기', category: 'standby' },
    ASBY: { label: '공항 대기', category: 'standby' },
    RES: { label: '예비', category: 'standby' },
    RSV: { label: '예비', category: 'standby' },

    // 탑승 근무(데드헤드). 실제 승무가 아니라 손님으로 타고 이동하는 것이라
    // 비행 편수에는 넣지 않는다. 근무 코드이므로 type 은 duty 로 잡힌다.
    TVL: { label: '탑승 근무', category: 'flight', deadhead: true },

    // 체류 / 비행 부속
    LO: { label: '체류', category: 'layover' },
    LAYOVER: { label: '체류', category: 'layover' },
    LOFF: { label: '체류 휴식', category: 'layover' },
    DH: { label: '탑승 이동', category: 'flight', deadhead: true },
    DHD: { label: '탑승 이동', category: 'flight', deadhead: true },
    BRF: { label: '브리핑', category: 'flight' },
    BLK: { label: '블럭', category: 'other' },

    // 훈련 / 교육
    TRN: { label: '훈련', category: 'training' },
    GT: { label: '지상 훈련', category: 'training' },
    SIM: { label: '시뮬레이터', category: 'training' },
    EDU: { label: '교육', category: 'training' },
    CBT: { label: '온라인 교육', category: 'training' },
    OJT: { label: '현장 훈련', category: 'training' },
    RT: { label: '정기 훈련', category: 'training' },
    TFRS: { label: '교육', category: 'training' },

    // 기타
    SICK: { label: '병가', category: 'other' },
    SK: { label: '병가', category: 'other' },
    ML: { label: '병가/모성 휴가', category: 'other' },
    MED: { label: '신체검사', category: 'other' },
    OFC: { label: '사무 근무', category: 'other' },
    MTG: { label: '회의', category: 'other' }
  };

  /* ---------------- 편명으로 인정할 항공사 ----------------
   * 'AS0016' 처럼 잘못 읽힌 글자가 편명 꼴이라는 이유만으로 비행이 되어
   * 달력에 뜨는 일이 있었다. 그래서 항공사 코드를 흰 목록으로 받는다.
   * 기본은 대한항공만. 다른 항공사 스케줄을 쓰는 사람은 설정에서 늘린다.
   */
  var DEFAULT_AIRLINES = ['KE'];
  var airlines = DEFAULT_AIRLINES.slice();

  // 편명 꼴: 항공사 두 글자(적어도 하나는 영문) + 숫자 1~4 + 꼬리 글자
  var FLIGHT_SHAPE = /^([A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])-?(\d{1,4})([A-Z]?)$/;

  function setAirlines(list) {
    var out = [];
    (list == null ? [] : [].concat(list)).forEach(function (raw) {
      var code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (/^([A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])$/.test(code) && out.indexOf(code) === -1) out.push(code);
    });
    airlines = out.length ? out : DEFAULT_AIRLINES.slice();
    return airlines.slice();
  }

  function airlineList() { return airlines.slice(); }

  function isAirline(code) {
    return !!code && airlines.indexOf(String(code).toUpperCase()) !== -1;
  }

  /** 'KE0035' -> { airline: 'KE', number: '0035', suffix: '' }. 편명 꼴이 아니면 null. */
  function splitFlight(token) {
    var m = String(token == null ? '' : token).toUpperCase().replace(/\s+/g, '').match(FLIGHT_SHAPE);
    if (!m) return null;
    return { airline: m[1], number: m[2], suffix: m[3] || '' };
  }

  /** 편명 꼴이면서 아는 항공사인가. 모르는 항공사는 편명으로 받지 않는다. */
  function isFlightCode(token) {
    var parts = splitFlight(token);
    return !!parts && isAirline(parts.airline);
  }

  // 코드로 오인하기 쉬운 단어들 (요일/헤더/시간 관련)
  var IGNORED_TOKENS = {};
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'SEPT', 'OCT', 'NOV', 'DEC',
    'AM', 'PM', 'UTC', 'KST', 'LT', 'STD', 'STA', 'ETD', 'ETA', 'ATD', 'ATA',
    'TO', 'FROM', 'VIA', 'DATE', 'CODE', 'DUTY', 'FLT', 'FLIGHT', 'DEP', 'ARR',
    'NO', 'AC', 'REG', 'PIC', 'CA', 'FA', 'TOTAL', 'REMARK', 'REMARKS'
  ].forEach(function (t) { IGNORED_TOKENS[t] = true; });

  // 시각 앞에 붙는 라벨. 파서가 출발/도착 시각을 구분하는 데 쓴다.
  var TIME_LABELS = {
    STD: 'start', ETD: 'start', ATD: 'start', DEP: 'start', DEPT: 'start',
    DEPARTURE: 'start', OUT: 'start', OFFBLK: 'start',
    '출발': 'start', '출발시각': 'start', '출발시간': 'start', '출': 'start',
    STA: 'end', ETA: 'end', ATA: 'end', ARR: 'end', ARRV: 'end',
    ARRIVAL: 'end', IN: 'end', ONBLK: 'end',
    '도착': 'end', '도착시각': 'end', '도착시간': 'end', '도': 'end'
  };

  var MONTHS = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12
  };

  function timeLabel(token) {
    if (!token) return null;
    var key = String(token).toUpperCase().replace(/[.:\-_]+$/, '');
    return TIME_LABELS[key] || null;
  }

  function lookup(code) {
    if (!code) return null;
    var key = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return DUTY_CODES[key] || null;
  }

  function describe(code) {
    var hit = lookup(code);
    if (hit) return hit;
    return { label: '미확인 코드', category: 'unknown' };
  }

  /** 손님으로 타고 이동하는 근무인지. 비행 편수에서 뺀다. */
  function isDeadhead(code) {
    var hit = lookup(code);
    return !!(hit && hit.deadhead);
  }

  function knownCodeList() {
    return Object.keys(DUTY_CODES).sort();
  }

  return {
    DUTY_CODES: DUTY_CODES,
    CATEGORY_LABELS: CATEGORY_LABELS,
    IGNORED_TOKENS: IGNORED_TOKENS,
    TIME_LABELS: TIME_LABELS,
    MONTHS: MONTHS,
    timeLabel: timeLabel,
    lookup: lookup,
    describe: describe,
    knownCodeList: knownCodeList,
    isDeadhead: isDeadhead,
    DEFAULT_AIRLINES: DEFAULT_AIRLINES,
    FLIGHT_SHAPE: FLIGHT_SHAPE,
    setAirlines: setAirlines,
    airlineList: airlineList,
    isAirline: isAirline,
    splitFlight: splitFlight,
    isFlightCode: isFlightCode
  };
});
