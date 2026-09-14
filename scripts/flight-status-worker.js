/**
 * 오늘 민주는 — 운항 정보 중계 (Cloudflare Worker, 무료 요금제로 충분).
 * 공공데이터포털 인증키를 서버 쪽에 숨기고, 앱은 이 주소만 부른다.
 *
 * 올리는 법
 *   1. Cloudflare 가입 후 Workers & Pages → Create → Worker 를 만들고 이 파일 내용을 붙여 넣는다.
 *   2. Settings → Variables and Secrets 에서 비밀값 SERVICE_KEY 에 포털의 "인코딩" 인증키를 넣는다.
 *   3. 변수 ALLOW_ORIGIN 에 앱 주소(예: https://choiza.github.io)를 넣는다.
 *   4. 배포한 주소(https://....workers.dev)를 src/family/config.js 의 FLIGHT_STATUS.proxyUrl 에 넣는다.
 *
 * 앱이 부르는 모양: https://....workers.dev/?r=icn_dep&flight_id=KE643
 */
const ROUTES = {
  icn_dep: 'B551177/StatusOfPassengerFlightsOdp/getPassengerDeparturesOdp',
  icn_arr: 'B551177/StatusOfPassengerFlightsOdp/getPassengerArrivalsOdp',
  gmp_dep: 'B551178/flight-status/depart',
  gmp_arr: 'B551178/flight-status/arrival'
};

const PASS = ['flight_id', 'from_time', 'to_time', 'airport_code'];

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const path = ROUTES[url.searchParams.get('r')];
    if (!path) return new Response('unknown route', { status: 400, headers: cors });

    let query = 'serviceKey=' + env.SERVICE_KEY + '&type=json&numOfRows=20&pageNo=1';
    for (const name of PASS) {
      const value = url.searchParams.get(name);
      if (value) query += '&' + name + '=' + encodeURIComponent(value);
    }

    // 같은 편을 여러 가족이 동시에 봐도 5분 동안은 한 번만 공항 자료를 부른다
    const upstream = await fetch('https://apis.data.go.kr/' + path + '?' + query, { cf: { cacheTtl: 300, cacheEverything: true } });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
