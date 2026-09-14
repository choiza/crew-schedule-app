/**
 * 오늘 민주는 — 켜고 끄는 설정.
 * 코드를 고치지 않고 이 파일의 값만 바꿔 기능을 켠다.
 */
(function (root) {
  'use strict';
  root.CrewCal = root.CrewCal || {};
  root.CrewCal.config = {
    /* 화면 맨 아래 광고.
     * enabled 를 true 로 바꾸고, 쓰는 광고사(provider)의 값을 채우면 바로 나온다.
     *   adsense: 구글 애드센스 게시자 ID(ca-pub-...)와 광고 단위 slot 번호
     *   adfit:   카카오 애드핏 광고 단위 ID(DAN-...)와 크기
     * 광고사 심사를 통과한 주소(도메인)에서만 실제 광고가 나온다.
     */
    ADS: {
      enabled: false,
      provider: 'adsense',
      adsense: { client: 'ca-pub-0000000000000000', slot: '0000000000' },
      adfit: { unit: 'DAN-xxxxxxxxxxxxxxxx', width: 320, height: 100 }
    },

    /* 버스 걸리는 시간.
     * TMAP 예측표(src/family/travel-data.js)가 채워져 있으면 요일·시간대 예측을 쓰고,
     * 비어 있으면 시간표와 추정표를 쓴다. 예측표는 scripts/tmap-travel-times.js 로 만든다.
     */
    TRAVEL: {
      useTmap: true
    },

    /* 비행 당일 실제 출발·도착 시각 (인천공항, 김포공항 공공데이터).
     * enabled 를 true 로 바꾸고 둘 중 하나를 채운다.
     *   proxyUrl:   scripts/flight-status-worker.js 를 올린 주소. 키가 숨겨져 공개 사이트에 알맞다.
     *   serviceKey: 공공데이터포털 "인코딩" 인증키. 페이지에 그대로 보이니 혼자 쓸 때만.
     * refreshMinutes 마다 오늘 비행만 다시 가져온다.
     */
    FLIGHT_STATUS: {
      enabled: false,
      proxyUrl: '',
      serviceKey: '',
      refreshMinutes: 30
    },

    /* 가족 공유 링크.
     * 스케줄은 폰에서 비밀번호로 잠가 링크의 # 뒤에 담기 때문에 이 주소의 서버로 가지 않는다.
     * 안드로이드 앱이나 사내 주소에서 만든 링크도 가족 폰에서 열리도록, 링크는 이 공개 주소를 쓴다.
     */
    SHARE: {
      baseUrl: 'https://choiza.github.io/crew-schedule-app/family.html'
    }
  };
})(typeof self !== 'undefined' ? self : this);
