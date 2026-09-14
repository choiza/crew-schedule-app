/**
 * 처음 열었을 때 보여 주는 예시 달. 실제 사람의 스케줄이 아니라 앱을 보여 주려고 지어낸 근무표다.
 * 편명과 노선은 대한항공 노선망에 있는 것을 쓰고, 시각(TIMES)도 예시용으로 정한 값이다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.sample = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TEXT = [
    '2026-09-01\tADO',
    '2026-09-02\tGRD',
    '2026-09-03\tKE0017',
    '2026-09-03\tLO',
    '2026-09-04\tLO',
    '2026-09-05\tKE0018',
    '2026-09-06\tKE0018',
    '2026-09-07\tATDO',
    '2026-09-08\tATDO',
    '2026-09-09\tSTBY',
    '2026-09-10\tKE0723',
    '2026-09-10\tKE0724',
    '2026-09-11\tPDO',
    '2026-09-12\tDO',
    '2026-09-13\tKE0651',
    '2026-09-13\tLO',
    '2026-09-14\tLO',
    '2026-09-15\tKE0652',
    '2026-09-16\tKE0652',
    '2026-09-17\tADO',
    '2026-09-18\tTFRS',
    '2026-09-19\tTFRS',
    '2026-09-20\tDO',
    '2026-09-21\tKE0901',
    '2026-09-21\tLO',
    '2026-09-22\tLO',
    '2026-09-23\tLO',
    '2026-09-24\tKE0902',
    '2026-09-25\tKE0902',
    '2026-09-26\tATDO',
    '2026-09-27\tATDO',
    '2026-09-28\tSTBY',
    '2026-09-29\tGRD',
    '2026-09-30\tDO'
  ].join('\n');

  // 예시에서만 쓰는 한국 시각. 출발편은 start, 한국 도착편은 end.
  var TIMES = {
    KE0017: { start: '10:30' },
    KE0018: { end: '17:20' },
    KE0723: { start: '08:30' },
    KE0724: { end: '13:40' },
    KE0651: { start: '18:10' },
    KE0652: { end: '06:50' },
    KE0901: { start: '13:05' },
    KE0902: { end: '16:25' }
  };

  return { TEXT: TEXT, TIMES: TIMES, YEAR: 2026, MONTH: 9 };
});
