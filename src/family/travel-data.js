/**
 * TMAP 타임머신 예측표. scripts/tmap-travel-times.js 가 이 파일을 다시 쓴다. 손으로 고치지 말 것.
 * 비어 있으면 앱은 시간표와 추정표로 계산한다.
 *
 * routes['miguem>ICN'].byWeekday[요일 0~6][시 0~23] = 자동차로 걸리는 분
 * 버스 분 = 자동차 분 × busFactor + overhead (정류장 들르는 시간)
 */
(function (root) {
  'use strict';
  var data = {
    source: null,
    generated: null,
    busFactor: 1.2,
    overhead: 10,
    routes: {}
  };
  var C = root.CrewCal;
  var useTmap = !(C && C.config && C.config.TRAVEL && C.config.TRAVEL.useTmap === false);
  if (C && C.bus && useTmap) C.bus.setTravelData(data);
  if (typeof module === 'object' && module.exports) module.exports = data;
})(typeof self !== 'undefined' ? self : this);
