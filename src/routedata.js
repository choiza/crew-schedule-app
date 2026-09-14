/**
 * 노선 시드와 공항 자료. data/ke-routes.json 과 data/airports.json 에서 옮겨 적은 것이다.
 * 손으로 고치지 말 것 — scripts/make-routes.js 가 다시 쓴다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.routedata = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SEED = {
    "meta": {
      "schema": 1,
      "carrier": "KE",
      "source": "나무위키 '대한항공/노선망' (2026-09 기준 노선망)",
      "generated": "2026-09-12",
      "numbering": "홀수=한국발(하행) / 짝수=한국행(상행). 1997 하계 이후 KE 편명 체계",
      "caution": "노선은 시즌마다 바뀝니다. 크루넷 원본에 공항 코드가 있으면 원본을 우선하세요.",
      "bands": {
        "8000": "대체편성·부정기편",
        "9000": "전세기",
        "0001-0999": "국제선 정기편 (000번대 미주, 100 중국, 400 대양주/동남아, 600 동남아, 700 일본, 800 중국, 900 유럽)",
        "1000-1999": "국내선",
        "2000-2999": "김포·부산·제주 착발 국제선 및 일부 인천 착발 (2100번대 일본)",
        "3000,5000-7000": "공동운항(코드셰어)"
      }
    },
    "airports": {
      "ICN": {
        "city": "인천",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "GMP": {
        "city": "김포",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "PUS": {
        "city": "부산",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "CJU": {
        "city": "제주",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "USN": {
        "city": "울산",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "TAE": {
        "city": "대구",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "KWJ": {
        "city": "광주",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "RSU": {
        "city": "여수",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "HIN": {
        "city": "사천",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "CJJ": {
        "city": "청주",
        "country": "KR",
        "flag": "🇰🇷",
        "tz": "Asia/Seoul"
      },
      "NRT": {
        "city": "도쿄(나리타)",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "HND": {
        "city": "도쿄(하네다)",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "KIX": {
        "city": "오사카",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "UKB": {
        "city": "고베",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "NGO": {
        "city": "나고야",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "CTS": {
        "city": "삿포로",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "FUK": {
        "city": "후쿠오카",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "OKA": {
        "city": "오키나와",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "KOJ": {
        "city": "가고시마",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "KMJ": {
        "city": "구마모토",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "NGS": {
        "city": "나가사키",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "KMQ": {
        "city": "코마츠",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "KIJ": {
        "city": "니가타",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "AOJ": {
        "city": "아오모리",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "OKJ": {
        "city": "오카야마",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "OIT": {
        "city": "오이타",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "HIJ": {
        "city": "히로시마",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "PEK": {
        "city": "베이징",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "PVG": {
        "city": "상하이(푸둥)",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "SHA": {
        "city": "상하이(훙차오)",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "CAN": {
        "city": "광저우",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "NKG": {
        "city": "난징",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "DLC": {
        "city": "다롄",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "XMN": {
        "city": "샤먼",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "SHE": {
        "city": "선양",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "SZX": {
        "city": "선전",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "XIY": {
        "city": "시안",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "YNJ": {
        "city": "옌지",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "WUH": {
        "city": "우한",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "DYG": {
        "city": "장자제",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "CGO": {
        "city": "정저우",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "CSX": {
        "city": "창사",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "TAO": {
        "city": "칭다오",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "KMG": {
        "city": "쿤밍",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "TSN": {
        "city": "톈진",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "FOC": {
        "city": "푸저우",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "HGH": {
        "city": "항저우",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "HFE": {
        "city": "허페이",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "HKG": {
        "city": "홍콩",
        "country": "HK",
        "flag": "🇭🇰",
        "tz": "Asia/Hong_Kong"
      },
      "MFM": {
        "city": "마카오",
        "country": "MO",
        "flag": "🇲🇴",
        "tz": "Asia/Macau"
      },
      "TPE": {
        "city": "타이베이",
        "country": "TW",
        "flag": "🇹🇼",
        "tz": "Asia/Taipei"
      },
      "BKK": {
        "city": "방콕",
        "country": "TH",
        "flag": "🇹🇭",
        "tz": "Asia/Bangkok"
      },
      "CNX": {
        "city": "치앙마이",
        "country": "TH",
        "flag": "🇹🇭",
        "tz": "Asia/Bangkok"
      },
      "HKT": {
        "city": "푸껫",
        "country": "TH",
        "flag": "🇹🇭",
        "tz": "Asia/Bangkok"
      },
      "MNL": {
        "city": "마닐라",
        "country": "PH",
        "flag": "🇵🇭",
        "tz": "Asia/Manila"
      },
      "CEB": {
        "city": "세부",
        "country": "PH",
        "flag": "🇵🇭",
        "tz": "Asia/Manila"
      },
      "SIN": {
        "city": "싱가포르",
        "country": "SG",
        "flag": "🇸🇬",
        "tz": "Asia/Singapore"
      },
      "KUL": {
        "city": "쿠알라룸푸르",
        "country": "MY",
        "flag": "🇲🇾",
        "tz": "Asia/Kuala_Lumpur"
      },
      "CGK": {
        "city": "자카르타",
        "country": "ID",
        "flag": "🇮🇩",
        "tz": "Asia/Jakarta"
      },
      "DPS": {
        "city": "발리",
        "country": "ID",
        "flag": "🇮🇩",
        "tz": "Asia/Makassar"
      },
      "HAN": {
        "city": "하노이",
        "country": "VN",
        "flag": "🇻🇳",
        "tz": "Asia/Ho_Chi_Minh"
      },
      "SGN": {
        "city": "호찌민",
        "country": "VN",
        "flag": "🇻🇳",
        "tz": "Asia/Ho_Chi_Minh"
      },
      "DAD": {
        "city": "다낭",
        "country": "VN",
        "flag": "🇻🇳",
        "tz": "Asia/Ho_Chi_Minh"
      },
      "CXR": {
        "city": "나트랑",
        "country": "VN",
        "flag": "🇻🇳",
        "tz": "Asia/Ho_Chi_Minh"
      },
      "PQC": {
        "city": "푸꾸옥",
        "country": "VN",
        "flag": "🇻🇳",
        "tz": "Asia/Ho_Chi_Minh"
      },
      "PNH": {
        "city": "프놈펜",
        "country": "KH",
        "flag": "🇰🇭",
        "tz": "Asia/Phnom_Penh"
      },
      "RGN": {
        "city": "양곤",
        "country": "MM",
        "flag": "🇲🇲",
        "tz": "Asia/Yangon"
      },
      "DEL": {
        "city": "델리",
        "country": "IN",
        "flag": "🇮🇳",
        "tz": "Asia/Kolkata"
      },
      "KTM": {
        "city": "카트만두",
        "country": "NP",
        "flag": "🇳🇵",
        "tz": "Asia/Kathmandu"
      },
      "JFK": {
        "city": "뉴욕",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/New_York"
      },
      "IAD": {
        "city": "워싱턴",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/New_York"
      },
      "BOS": {
        "city": "보스턴",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/New_York"
      },
      "ATL": {
        "city": "애틀랜타",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/New_York"
      },
      "ORD": {
        "city": "시카고",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Chicago"
      },
      "DFW": {
        "city": "댈러스",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Chicago"
      },
      "LAX": {
        "city": "로스앤젤레스",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Los_Angeles"
      },
      "SFO": {
        "city": "샌프란시스코",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Los_Angeles"
      },
      "SEA": {
        "city": "시애틀",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Los_Angeles"
      },
      "LAS": {
        "city": "라스베이거스",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Los_Angeles"
      },
      "HNL": {
        "city": "호놀룰루",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "Pacific/Honolulu"
      },
      "GUM": {
        "city": "괌",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "Pacific/Guam"
      },
      "YVR": {
        "city": "밴쿠버",
        "country": "CA",
        "flag": "🇨🇦",
        "tz": "America/Vancouver"
      },
      "YYZ": {
        "city": "토론토",
        "country": "CA",
        "flag": "🇨🇦",
        "tz": "America/Toronto"
      },
      "CDG": {
        "city": "파리",
        "country": "FR",
        "flag": "🇫🇷",
        "tz": "Europe/Paris"
      },
      "LHR": {
        "city": "런던",
        "country": "GB",
        "flag": "🇬🇧",
        "tz": "Europe/London"
      },
      "MAD": {
        "city": "마드리드",
        "country": "ES",
        "flag": "🇪🇸",
        "tz": "Europe/Madrid"
      },
      "LIS": {
        "city": "리스본",
        "country": "PT",
        "flag": "🇵🇹",
        "tz": "Europe/Lisbon"
      },
      "AMS": {
        "city": "암스테르담",
        "country": "NL",
        "flag": "🇳🇱",
        "tz": "Europe/Amsterdam"
      },
      "FRA": {
        "city": "프랑크푸르트",
        "country": "DE",
        "flag": "🇩🇪",
        "tz": "Europe/Berlin"
      },
      "VIE": {
        "city": "비엔나",
        "country": "AT",
        "flag": "🇦🇹",
        "tz": "Europe/Vienna"
      },
      "ZRH": {
        "city": "취리히",
        "country": "CH",
        "flag": "🇨🇭",
        "tz": "Europe/Zurich"
      },
      "PRG": {
        "city": "프라하",
        "country": "CZ",
        "flag": "🇨🇿",
        "tz": "Europe/Prague"
      },
      "BUD": {
        "city": "부다페스트",
        "country": "HU",
        "flag": "🇭🇺",
        "tz": "Europe/Budapest"
      },
      "MXP": {
        "city": "밀라노",
        "country": "IT",
        "flag": "🇮🇹",
        "tz": "Europe/Rome"
      },
      "FCO": {
        "city": "로마",
        "country": "IT",
        "flag": "🇮🇹",
        "tz": "Europe/Rome"
      },
      "IST": {
        "city": "이스탄불",
        "country": "TR",
        "flag": "🇹🇷",
        "tz": "Europe/Istanbul"
      },
      "UBN": {
        "city": "울란바타르",
        "country": "MN",
        "flag": "🇲🇳",
        "tz": "Asia/Ulaanbaatar"
      },
      "DXB": {
        "city": "두바이",
        "country": "AE",
        "flag": "🇦🇪",
        "tz": "Asia/Dubai"
      },
      "SYD": {
        "city": "시드니",
        "country": "AU",
        "flag": "🇦🇺",
        "tz": "Australia/Sydney"
      },
      "BNE": {
        "city": "브리즈번",
        "country": "AU",
        "flag": "🇦🇺",
        "tz": "Australia/Brisbane"
      },
      "MEL": {
        "city": "멜버른",
        "country": "AU",
        "flag": "🇦🇺",
        "tz": "Australia/Melbourne"
      },
      "AKL": {
        "city": "오클랜드",
        "country": "NZ",
        "flag": "🇳🇿",
        "tz": "Pacific/Auckland"
      },
      "KKJ": {
        "city": "기타큐슈",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "SHI": {
        "city": "미야코지마",
        "country": "JP",
        "flag": "🇯🇵",
        "tz": "Asia/Tokyo"
      },
      "YNT": {
        "city": "옌타이",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "WEH": {
        "city": "웨이하이",
        "country": "CN",
        "flag": "🇨🇳",
        "tz": "Asia/Shanghai"
      },
      "KHH": {
        "city": "가오슝",
        "country": "TW",
        "flag": "🇹🇼",
        "tz": "Asia/Taipei"
      },
      "CRK": {
        "city": "앙헬레스(클라크)",
        "country": "PH",
        "flag": "🇵🇭",
        "tz": "Asia/Manila"
      },
      "BKI": {
        "city": "코타키나발루",
        "country": "MY",
        "flag": "🇲🇾",
        "tz": "Asia/Kuala_Lumpur"
      },
      "CMB": {
        "city": "콜롬보",
        "country": "LK",
        "flag": "🇱🇰",
        "tz": "Asia/Colombo"
      },
      "DTW": {
        "city": "디트로이트",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Detroit"
      },
      "MSP": {
        "city": "미니애폴리스",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Chicago"
      },
      "SLC": {
        "city": "솔트레이크시티",
        "country": "US",
        "flag": "🇺🇸",
        "tz": "America/Denver"
      },
      "YYC": {
        "city": "캘거리",
        "country": "CA",
        "flag": "🇨🇦",
        "tz": "America/Edmonton"
      },
      "BCN": {
        "city": "바르셀로나",
        "country": "ES",
        "flag": "🇪🇸",
        "tz": "Europe/Madrid"
      },
      "TAS": {
        "city": "타슈켄트",
        "country": "UZ",
        "flag": "🇺🇿",
        "tz": "Asia/Tashkent"
      }
    },
    "operators": {
      "LJ": "진에어",
      "MU": "중국동방항공",
      "FM": "상하이항공",
      "MF": "샤먼항공",
      "CI": "중화항공",
      "JL": "일본항공",
      "MH": "말레이시아항공",
      "UL": "스리랑카항공",
      "GA": "가루다인도네시아",
      "VN": "베트남항공",
      "DL": "델타항공",
      "AA": "아메리칸항공",
      "WS": "웨스트젯",
      "VS": "버진애틀랜틱",
      "AF": "에어프랑스",
      "KL": "KLM",
      "OZ": "아시아나항공",
      "HY": "우즈베키스탄항공",
      "OM": "미아트몽골항공",
      "EK": "에미레이트항공"
    },
    "dutyCodes": {
      "LO": {
        "label": "체류",
        "type": "layover"
      },
      "DO": {
        "label": "휴무",
        "type": "off"
      },
      "ADO": {
        "label": "휴무",
        "type": "off"
      },
      "ATDO": {
        "label": "휴무",
        "type": "off"
      },
      "SA": {
        "label": "공항 대기",
        "type": "standby"
      },
      "RF": {
        "label": "자택 대기",
        "type": "standby"
      },
      "TVL": {
        "label": "탑승 근무",
        "type": "deadhead"
      },
      "TRN": {
        "label": "훈련",
        "type": "training"
      },
      "VAC": {
        "label": "휴가",
        "type": "vacation"
      }
    },
    "domesticRanges": [
      {
        "from": 1000,
        "to": 1399,
        "a": "GMP",
        "b": "CJU",
        "note": "김포-제주"
      },
      {
        "from": 1400,
        "to": 1419,
        "a": "ICN",
        "b": "PUS",
        "note": "인천-부산 (환승 내항편)"
      },
      {
        "from": 1430,
        "to": 1439,
        "a": "ICN",
        "b": "TAE",
        "note": "인천-대구 (환승 내항편)"
      },
      {
        "from": 1500,
        "to": 1559,
        "a": "CJU",
        "b": "PUS",
        "note": "제주-부산"
      },
      {
        "from": 1560,
        "to": 1579,
        "a": "CJU",
        "b": "TAE",
        "note": "제주-대구"
      },
      {
        "from": 1580,
        "to": 1589,
        "a": "CJU",
        "b": "HIN",
        "note": "제주-사천"
      },
      {
        "from": 1590,
        "to": 1599,
        "a": "CJU",
        "b": "USN",
        "note": "제주-울산"
      },
      {
        "from": 1600,
        "to": 1629,
        "a": "CJU",
        "b": "KWJ",
        "note": "제주-광주"
      },
      {
        "from": 1630,
        "to": 1639,
        "a": "CJU",
        "b": "RSU",
        "note": "제주-여수"
      },
      {
        "from": 1700,
        "to": 1729,
        "a": "CJU",
        "b": "CJJ",
        "note": "제주-청주"
      },
      {
        "from": 1800,
        "to": 1839,
        "a": "GMP",
        "b": "PUS",
        "note": "김포-부산"
      },
      {
        "from": 1840,
        "to": 1849,
        "a": "GMP",
        "b": "USN",
        "note": "김포-울산"
      }
    ],
    "routes": {
      "KE0703": {
        "from": "ICN",
        "to": "NRT"
      },
      "KE0704": {
        "from": "NRT",
        "to": "ICN"
      },
      "KE0711": {
        "from": "ICN",
        "to": "NRT"
      },
      "KE0712": {
        "from": "NRT",
        "to": "ICN"
      },
      "KE0707": {
        "from": "ICN",
        "to": "NRT"
      },
      "KE0708": {
        "from": "NRT",
        "to": "ICN"
      },
      "KE0713": {
        "from": "ICN",
        "to": "NRT"
      },
      "KE0714": {
        "from": "NRT",
        "to": "ICN"
      },
      "KE0705": {
        "from": "ICN",
        "to": "NRT"
      },
      "KE0706": {
        "from": "NRT",
        "to": "ICN"
      },
      "KE0751": {
        "from": "ICN",
        "to": "HND"
      },
      "KE0752": {
        "from": "HND",
        "to": "ICN"
      },
      "KE0723": {
        "from": "ICN",
        "to": "KIX"
      },
      "KE0724": {
        "from": "KIX",
        "to": "ICN"
      },
      "KE0725": {
        "from": "ICN",
        "to": "KIX"
      },
      "KE0726": {
        "from": "KIX",
        "to": "ICN"
      },
      "KE0721": {
        "from": "ICN",
        "to": "KIX"
      },
      "KE0722": {
        "from": "KIX",
        "to": "ICN"
      },
      "KE0737": {
        "from": "ICN",
        "to": "KIX"
      },
      "KE0738": {
        "from": "KIX",
        "to": "ICN"
      },
      "KE0727": {
        "from": "ICN",
        "to": "KIX",
        "note": "동계"
      },
      "KE0728": {
        "from": "KIX",
        "to": "ICN",
        "note": "동계"
      },
      "KE2171": {
        "from": "ICN",
        "to": "UKB",
        "note": "정기차터"
      },
      "KE2172": {
        "from": "UKB",
        "to": "ICN",
        "note": "정기차터"
      },
      "KE2173": {
        "from": "ICN",
        "to": "UKB",
        "note": "정기차터"
      },
      "KE2174": {
        "from": "UKB",
        "to": "ICN",
        "note": "정기차터"
      },
      "KE0741": {
        "from": "ICN",
        "to": "NGO"
      },
      "KE0742": {
        "from": "NGO",
        "to": "ICN"
      },
      "KE0743": {
        "from": "ICN",
        "to": "NGO"
      },
      "KE0744": {
        "from": "NGO",
        "to": "ICN"
      },
      "KE0765": {
        "from": "ICN",
        "to": "CTS"
      },
      "KE0766": {
        "from": "CTS",
        "to": "ICN"
      },
      "KE0769": {
        "from": "ICN",
        "to": "CTS"
      },
      "KE0770": {
        "from": "CTS",
        "to": "ICN"
      },
      "KE0787": {
        "from": "ICN",
        "to": "FUK"
      },
      "KE0788": {
        "from": "FUK",
        "to": "ICN"
      },
      "KE0791": {
        "from": "ICN",
        "to": "FUK"
      },
      "KE0792": {
        "from": "FUK",
        "to": "ICN"
      },
      "KE0781": {
        "from": "ICN",
        "to": "FUK"
      },
      "KE0782": {
        "from": "FUK",
        "to": "ICN"
      },
      "KE8795": {
        "from": "ICN",
        "to": "FUK"
      },
      "KE8796": {
        "from": "FUK",
        "to": "ICN"
      },
      "KE2147": {
        "from": "ICN",
        "to": "OKA"
      },
      "KE2148": {
        "from": "OKA",
        "to": "ICN"
      },
      "KE2179": {
        "from": "ICN",
        "to": "KOJ"
      },
      "KE2180": {
        "from": "KOJ",
        "to": "ICN"
      },
      "KE2155": {
        "from": "ICN",
        "to": "KMJ"
      },
      "KE2156": {
        "from": "KMJ",
        "to": "ICN"
      },
      "KE2191": {
        "from": "ICN",
        "to": "NGS"
      },
      "KE2192": {
        "from": "NGS",
        "to": "ICN"
      },
      "KE2189": {
        "from": "ICN",
        "to": "KMQ"
      },
      "KE2190": {
        "from": "KMQ",
        "to": "ICN"
      },
      "KE2197": {
        "from": "ICN",
        "to": "KIJ"
      },
      "KE2198": {
        "from": "KIJ",
        "to": "ICN"
      },
      "KE2193": {
        "from": "ICN",
        "to": "AOJ"
      },
      "KE2194": {
        "from": "AOJ",
        "to": "ICN"
      },
      "KE2185": {
        "from": "ICN",
        "to": "OKJ"
      },
      "KE2186": {
        "from": "OKJ",
        "to": "ICN"
      },
      "KE2177": {
        "from": "ICN",
        "to": "OIT",
        "note": "2026-10-25 복항"
      },
      "KE2178": {
        "from": "OIT",
        "to": "ICN",
        "note": "2026-10-25 복항"
      },
      "KE2183": {
        "from": "ICN",
        "to": "HIJ",
        "note": "2026-12-23 신규취항"
      },
      "KE2184": {
        "from": "HIJ",
        "to": "ICN",
        "note": "2026-12-23 신규취항"
      },
      "KE0851": {
        "from": "ICN",
        "to": "PEK"
      },
      "KE0852": {
        "from": "PEK",
        "to": "ICN"
      },
      "KE0855": {
        "from": "ICN",
        "to": "PEK"
      },
      "KE0856": {
        "from": "PEK",
        "to": "ICN"
      },
      "KE0863": {
        "from": "ICN",
        "to": "PEK"
      },
      "KE0864": {
        "from": "PEK",
        "to": "ICN"
      },
      "KE0881": {
        "from": "ICN",
        "to": "PVG"
      },
      "KE0882": {
        "from": "PVG",
        "to": "ICN"
      },
      "KE0887": {
        "from": "ICN",
        "to": "PVG"
      },
      "KE0888": {
        "from": "PVG",
        "to": "ICN"
      },
      "KE0891": {
        "from": "ICN",
        "to": "PVG"
      },
      "KE0892": {
        "from": "PVG",
        "to": "ICN"
      },
      "KE0867": {
        "from": "ICN",
        "to": "CAN"
      },
      "KE0868": {
        "from": "CAN",
        "to": "ICN"
      },
      "KE0101": {
        "from": "ICN",
        "to": "NKG"
      },
      "KE0102": {
        "from": "NKG",
        "to": "ICN"
      },
      "KE0873": {
        "from": "ICN",
        "to": "DLC"
      },
      "KE0874": {
        "from": "DLC",
        "to": "ICN"
      },
      "KE0875": {
        "from": "ICN",
        "to": "DLC",
        "note": "하계"
      },
      "KE0876": {
        "from": "DLC",
        "to": "ICN",
        "note": "하계"
      },
      "KE0125": {
        "from": "ICN",
        "to": "XMN"
      },
      "KE0126": {
        "from": "XMN",
        "to": "ICN"
      },
      "KE0831": {
        "from": "ICN",
        "to": "SHE"
      },
      "KE0832": {
        "from": "SHE",
        "to": "ICN"
      },
      "KE0833": {
        "from": "ICN",
        "to": "SHE"
      },
      "KE0834": {
        "from": "SHE",
        "to": "ICN"
      },
      "KE0835": {
        "from": "ICN",
        "to": "SZX"
      },
      "KE0836": {
        "from": "SZX",
        "to": "ICN"
      },
      "KE0141": {
        "from": "ICN",
        "to": "XIY"
      },
      "KE0142": {
        "from": "XIY",
        "to": "ICN"
      },
      "KE0115": {
        "from": "ICN",
        "to": "YNJ"
      },
      "KE0116": {
        "from": "YNJ",
        "to": "ICN"
      },
      "KE0165": {
        "from": "ICN",
        "to": "WUH"
      },
      "KE0166": {
        "from": "WUH",
        "to": "ICN"
      },
      "KE0163": {
        "from": "ICN",
        "to": "DYG"
      },
      "KE0164": {
        "from": "DYG",
        "to": "ICN"
      },
      "KE0133": {
        "from": "ICN",
        "to": "CGO"
      },
      "KE0134": {
        "from": "CGO",
        "to": "ICN"
      },
      "KE0145": {
        "from": "ICN",
        "to": "CSX"
      },
      "KE0146": {
        "from": "CSX",
        "to": "ICN"
      },
      "KE0841": {
        "from": "ICN",
        "to": "TAO"
      },
      "KE0842": {
        "from": "TAO",
        "to": "ICN"
      },
      "KE0843": {
        "from": "ICN",
        "to": "TAO"
      },
      "KE0844": {
        "from": "TAO",
        "to": "ICN"
      },
      "KE0161": {
        "from": "ICN",
        "to": "KMG"
      },
      "KE0162": {
        "from": "KMG",
        "to": "ICN"
      },
      "KE0805": {
        "from": "ICN",
        "to": "TSN"
      },
      "KE0806": {
        "from": "TSN",
        "to": "ICN"
      },
      "KE0803": {
        "from": "ICN",
        "to": "TSN",
        "note": "하계"
      },
      "KE0804": {
        "from": "TSN",
        "to": "ICN",
        "note": "하계"
      },
      "KE0127": {
        "from": "ICN",
        "to": "FOC"
      },
      "KE0128": {
        "from": "FOC",
        "to": "ICN"
      },
      "KE0107": {
        "from": "ICN",
        "to": "HGH"
      },
      "KE0108": {
        "from": "HGH",
        "to": "ICN"
      },
      "KE0155": {
        "from": "ICN",
        "to": "HFE"
      },
      "KE0156": {
        "from": "HFE",
        "to": "ICN"
      },
      "KE2001": {
        "from": "ICN",
        "to": "HKG"
      },
      "KE2002": {
        "from": "HKG",
        "to": "ICN"
      },
      "KE2005": {
        "from": "ICN",
        "to": "HKG"
      },
      "KE2006": {
        "from": "HKG",
        "to": "ICN"
      },
      "KE2011": {
        "from": "ICN",
        "to": "HKG"
      },
      "KE2012": {
        "from": "HKG",
        "to": "ICN"
      },
      "KE2015": {
        "from": "ICN",
        "to": "MFM"
      },
      "KE2016": {
        "from": "MFM",
        "to": "ICN"
      },
      "KE2021": {
        "from": "ICN",
        "to": "TPE"
      },
      "KE2022": {
        "from": "TPE",
        "to": "ICN"
      },
      "KE2027": {
        "from": "ICN",
        "to": "TPE"
      },
      "KE2028": {
        "from": "TPE",
        "to": "ICN"
      },
      "KE0657": {
        "from": "ICN",
        "to": "BKK"
      },
      "KE0658": {
        "from": "BKK",
        "to": "ICN"
      },
      "KE0651": {
        "from": "ICN",
        "to": "BKK"
      },
      "KE0652": {
        "from": "BKK",
        "to": "ICN"
      },
      "KE0659": {
        "from": "ICN",
        "to": "BKK"
      },
      "KE0660": {
        "from": "BKK",
        "to": "ICN"
      },
      "KE0655": {
        "from": "ICN",
        "to": "BKK"
      },
      "KE0656": {
        "from": "BKK",
        "to": "ICN"
      },
      "KE0653": {
        "from": "ICN",
        "to": "BKK",
        "note": "동계"
      },
      "KE0654": {
        "from": "BKK",
        "to": "ICN",
        "note": "동계"
      },
      "KE0683": {
        "from": "ICN",
        "to": "CNX",
        "note": "2026 하계 비운항"
      },
      "KE0684": {
        "from": "CNX",
        "to": "ICN",
        "note": "2026 하계 비운항"
      },
      "KE0677": {
        "from": "ICN",
        "to": "HKT"
      },
      "KE0678": {
        "from": "HKT",
        "to": "ICN"
      },
      "KE0601": {
        "from": "ICN",
        "to": "CEB"
      },
      "KE0602": {
        "from": "CEB",
        "to": "ICN"
      },
      "KE0621": {
        "from": "ICN",
        "to": "MNL"
      },
      "KE0622": {
        "from": "MNL",
        "to": "ICN"
      },
      "KE0623": {
        "from": "ICN",
        "to": "MNL"
      },
      "KE0624": {
        "from": "MNL",
        "to": "ICN"
      },
      "KE0625": {
        "from": "ICN",
        "to": "MNL"
      },
      "KE0626": {
        "from": "MNL",
        "to": "ICN"
      },
      "KE0619": {
        "from": "ICN",
        "to": "MNL"
      },
      "KE0620": {
        "from": "MNL",
        "to": "ICN"
      },
      "KE0643": {
        "from": "ICN",
        "to": "SIN"
      },
      "KE0644": {
        "from": "SIN",
        "to": "ICN"
      },
      "KE0645": {
        "from": "ICN",
        "to": "SIN"
      },
      "KE0646": {
        "from": "SIN",
        "to": "ICN"
      },
      "KE0647": {
        "from": "ICN",
        "to": "SIN"
      },
      "KE0648": {
        "from": "SIN",
        "to": "ICN"
      },
      "KE0427": {
        "from": "ICN",
        "to": "KUL"
      },
      "KE0428": {
        "from": "KUL",
        "to": "ICN"
      },
      "KE0437": {
        "from": "ICN",
        "to": "CGK"
      },
      "KE0438": {
        "from": "CGK",
        "to": "ICN"
      },
      "KE0431": {
        "from": "ICN",
        "to": "DPS"
      },
      "KE0432": {
        "from": "DPS",
        "to": "ICN"
      },
      "KE0433": {
        "from": "ICN",
        "to": "DPS"
      },
      "KE0434": {
        "from": "DPS",
        "to": "ICN"
      },
      "KE0441": {
        "from": "ICN",
        "to": "HAN"
      },
      "KE0442": {
        "from": "HAN",
        "to": "ICN"
      },
      "KE0447": {
        "from": "ICN",
        "to": "HAN"
      },
      "KE0448": {
        "from": "HAN",
        "to": "ICN"
      },
      "KE0471": {
        "from": "ICN",
        "to": "SGN"
      },
      "KE0472": {
        "from": "SGN",
        "to": "ICN"
      },
      "KE0475": {
        "from": "ICN",
        "to": "SGN"
      },
      "KE0476": {
        "from": "SGN",
        "to": "ICN"
      },
      "KE0479": {
        "from": "ICN",
        "to": "SGN"
      },
      "KE0480": {
        "from": "SGN",
        "to": "ICN"
      },
      "KE0457": {
        "from": "ICN",
        "to": "DAD"
      },
      "KE0458": {
        "from": "DAD",
        "to": "ICN"
      },
      "KE0459": {
        "from": "ICN",
        "to": "DAD"
      },
      "KE0460": {
        "from": "DAD",
        "to": "ICN"
      },
      "KE0467": {
        "from": "ICN",
        "to": "CXR"
      },
      "KE0468": {
        "from": "CXR",
        "to": "ICN"
      },
      "KE0485": {
        "from": "ICN",
        "to": "PQC"
      },
      "KE0486": {
        "from": "PQC",
        "to": "ICN"
      },
      "KE0483": {
        "from": "ICN",
        "to": "PQC",
        "note": "동계"
      },
      "KE0484": {
        "from": "PQC",
        "to": "ICN",
        "note": "동계"
      },
      "KE0689": {
        "from": "ICN",
        "to": "PNH"
      },
      "KE0690": {
        "from": "PNH",
        "to": "ICN"
      },
      "KE0489": {
        "from": "ICN",
        "to": "RGN"
      },
      "KE0490": {
        "from": "RGN",
        "to": "ICN"
      },
      "KE0497": {
        "from": "ICN",
        "to": "DEL"
      },
      "KE0498": {
        "from": "DEL",
        "to": "ICN"
      },
      "KE0695": {
        "from": "ICN",
        "to": "KTM"
      },
      "KE0696": {
        "from": "KTM",
        "to": "ICN"
      },
      "KE0081": {
        "from": "ICN",
        "to": "JFK"
      },
      "KE0082": {
        "from": "JFK",
        "to": "ICN"
      },
      "KE0085": {
        "from": "ICN",
        "to": "JFK"
      },
      "KE0086": {
        "from": "JFK",
        "to": "ICN"
      },
      "KE0093": {
        "from": "ICN",
        "to": "IAD"
      },
      "KE0094": {
        "from": "IAD",
        "to": "ICN"
      },
      "KE0091": {
        "from": "ICN",
        "to": "BOS"
      },
      "KE0092": {
        "from": "BOS",
        "to": "ICN"
      },
      "KE0033": {
        "from": "ICN",
        "to": "ATL"
      },
      "KE0034": {
        "from": "ATL",
        "to": "ICN"
      },
      "KE0035": {
        "from": "ICN",
        "to": "ATL"
      },
      "KE0036": {
        "from": "ATL",
        "to": "ICN"
      },
      "KE0037": {
        "from": "ICN",
        "to": "ORD"
      },
      "KE0038": {
        "from": "ORD",
        "to": "ICN"
      },
      "KE0031": {
        "from": "ICN",
        "to": "DFW"
      },
      "KE0032": {
        "from": "DFW",
        "to": "ICN"
      },
      "KE0017": {
        "from": "ICN",
        "to": "LAX"
      },
      "KE0018": {
        "from": "LAX",
        "to": "ICN"
      },
      "KE0011": {
        "from": "ICN",
        "to": "LAX"
      },
      "KE0012": {
        "from": "LAX",
        "to": "ICN"
      },
      "KE0023": {
        "from": "ICN",
        "to": "SFO"
      },
      "KE0024": {
        "from": "SFO",
        "to": "ICN"
      },
      "KE0041": {
        "from": "ICN",
        "to": "SEA"
      },
      "KE0042": {
        "from": "SEA",
        "to": "ICN"
      },
      "KE0005": {
        "from": "ICN",
        "to": "LAS"
      },
      "KE0006": {
        "from": "LAS",
        "to": "ICN"
      },
      "KE0053": {
        "from": "ICN",
        "to": "HNL"
      },
      "KE0054": {
        "from": "HNL",
        "to": "ICN"
      },
      "KE0071": {
        "from": "ICN",
        "to": "YVR"
      },
      "KE0072": {
        "from": "YVR",
        "to": "ICN"
      },
      "KE0075": {
        "from": "ICN",
        "to": "YVR"
      },
      "KE0076": {
        "from": "YVR",
        "to": "ICN"
      },
      "KE0077": {
        "from": "ICN",
        "to": "YYZ"
      },
      "KE0078": {
        "from": "YYZ",
        "to": "ICN"
      },
      "KE0901": {
        "from": "ICN",
        "to": "CDG"
      },
      "KE0902": {
        "from": "CDG",
        "to": "ICN"
      },
      "KE0907": {
        "from": "ICN",
        "to": "LHR"
      },
      "KE0908": {
        "from": "LHR",
        "to": "ICN"
      },
      "KE0913": {
        "from": "ICN",
        "to": "MAD"
      },
      "KE0914": {
        "from": "MAD",
        "to": "ICN"
      },
      "KE0921": {
        "from": "ICN",
        "to": "LIS"
      },
      "KE0922": {
        "from": "LIS",
        "to": "ICN"
      },
      "KE0925": {
        "from": "ICN",
        "to": "AMS"
      },
      "KE0926": {
        "from": "AMS",
        "to": "ICN"
      },
      "KE0945": {
        "from": "ICN",
        "to": "FRA"
      },
      "KE0946": {
        "from": "FRA",
        "to": "ICN"
      },
      "KE0937": {
        "from": "ICN",
        "to": "VIE"
      },
      "KE0938": {
        "from": "VIE",
        "to": "ICN"
      },
      "KE0917": {
        "from": "ICN",
        "to": "ZRH",
        "note": "하계"
      },
      "KE0918": {
        "from": "ZRH",
        "to": "ICN",
        "note": "하계"
      },
      "KE0969": {
        "from": "ICN",
        "to": "PRG"
      },
      "KE0970": {
        "from": "PRG",
        "to": "ICN"
      },
      "KE0963": {
        "from": "ICN",
        "to": "BUD"
      },
      "KE0964": {
        "from": "BUD",
        "to": "ICN"
      },
      "KE0927": {
        "from": "ICN",
        "to": "MXP"
      },
      "KE0928": {
        "from": "MXP",
        "to": "ICN"
      },
      "KE0931": {
        "from": "ICN",
        "to": "FCO"
      },
      "KE0932": {
        "from": "FCO",
        "to": "ICN"
      },
      "KE0955": {
        "from": "ICN",
        "to": "IST"
      },
      "KE0956": {
        "from": "IST",
        "to": "ICN"
      },
      "KE2041": {
        "from": "ICN",
        "to": "UBN"
      },
      "KE2042": {
        "from": "UBN",
        "to": "ICN"
      },
      "KE2045": {
        "from": "ICN",
        "to": "UBN",
        "note": "하계"
      },
      "KE2046": {
        "from": "UBN",
        "to": "ICN",
        "note": "하계"
      },
      "KE0951": {
        "from": "ICN",
        "to": "DXB",
        "note": "운휴"
      },
      "KE0952": {
        "from": "DXB",
        "to": "ICN",
        "note": "운휴"
      },
      "KE0401": {
        "from": "ICN",
        "to": "SYD"
      },
      "KE0402": {
        "from": "SYD",
        "to": "ICN"
      },
      "KE0407": {
        "from": "ICN",
        "to": "BNE"
      },
      "KE0408": {
        "from": "BNE",
        "to": "ICN"
      },
      "KE0409": {
        "from": "ICN",
        "to": "MEL",
        "note": "동계 / 2026-12-18 복항"
      },
      "KE0410": {
        "from": "MEL",
        "to": "ICN",
        "note": "동계 / 2026-12-18 복항"
      },
      "KE0411": {
        "from": "ICN",
        "to": "AKL"
      },
      "KE0412": {
        "from": "AKL",
        "to": "ICN"
      },
      "KE0415": {
        "from": "ICN",
        "to": "GUM"
      },
      "KE0416": {
        "from": "GUM",
        "to": "ICN"
      },
      "KE0417": {
        "from": "ICN",
        "to": "GUM"
      },
      "KE0418": {
        "from": "GUM",
        "to": "ICN"
      },
      "KE2101": {
        "from": "GMP",
        "to": "HND"
      },
      "KE2102": {
        "from": "HND",
        "to": "GMP"
      },
      "KE2103": {
        "from": "GMP",
        "to": "HND"
      },
      "KE2104": {
        "from": "HND",
        "to": "GMP"
      },
      "KE2105": {
        "from": "GMP",
        "to": "HND"
      },
      "KE2106": {
        "from": "HND",
        "to": "GMP"
      },
      "KE2117": {
        "from": "GMP",
        "to": "KIX"
      },
      "KE2118": {
        "from": "KIX",
        "to": "GMP"
      },
      "KE2119": {
        "from": "GMP",
        "to": "KIX"
      },
      "KE2120": {
        "from": "KIX",
        "to": "GMP"
      },
      "KE2051": {
        "from": "GMP",
        "to": "PEK"
      },
      "KE2052": {
        "from": "PEK",
        "to": "GMP"
      },
      "KE2057": {
        "from": "GMP",
        "to": "SHA"
      },
      "KE2058": {
        "from": "SHA",
        "to": "GMP"
      },
      "KE2133": {
        "from": "PUS",
        "to": "NGO"
      },
      "KE2134": {
        "from": "NGO",
        "to": "PUS"
      },
      "KE2129": {
        "from": "PUS",
        "to": "NRT"
      },
      "KE2130": {
        "from": "NRT",
        "to": "PUS"
      },
      "KE2131": {
        "from": "PUS",
        "to": "NRT"
      },
      "KE2132": {
        "from": "NRT",
        "to": "PUS"
      },
      "KE2061": {
        "from": "PUS",
        "to": "PEK"
      },
      "KE2062": {
        "from": "PEK",
        "to": "PUS"
      },
      "KE2071": {
        "from": "PUS",
        "to": "PVG"
      },
      "KE2072": {
        "from": "PVG",
        "to": "PUS"
      },
      "KE2073": {
        "from": "PUS",
        "to": "PVG",
        "note": "하계"
      },
      "KE2074": {
        "from": "PVG",
        "to": "PUS",
        "note": "하계"
      },
      "KE2081": {
        "from": "PUS",
        "to": "TAO"
      },
      "KE2082": {
        "from": "TAO",
        "to": "PUS"
      },
      "KE2085": {
        "from": "PUS",
        "to": "TPE"
      },
      "KE2086": {
        "from": "TPE",
        "to": "PUS"
      },
      "KE2093": {
        "from": "PUS",
        "to": "DAD"
      },
      "KE2094": {
        "from": "DAD",
        "to": "PUS"
      },
      "KE2125": {
        "from": "CJU",
        "to": "NRT"
      },
      "KE2126": {
        "from": "NRT",
        "to": "CJU"
      },
      "KE2065": {
        "from": "CJU",
        "to": "PEK"
      },
      "KE2066": {
        "from": "PEK",
        "to": "CJU"
      },
      "KE5749": {
        "from": "ICN",
        "to": "KKJ",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5750": {
        "from": "KKJ",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5079": {
        "from": "ICN",
        "to": "NGO",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5080": {
        "from": "NGO",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5081": {
        "from": "ICN",
        "to": "NGO",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5082": {
        "from": "NGO",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5741": {
        "from": "ICN",
        "to": "NRT",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5742": {
        "from": "NRT",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5093": {
        "from": "ICN",
        "to": "NRT",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5094": {
        "from": "NRT",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5097": {
        "from": "ICN",
        "to": "SHI",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5098": {
        "from": "SHI",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5061": {
        "from": "ICN",
        "to": "CTS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5062": {
        "from": "CTS",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5071": {
        "from": "ICN",
        "to": "KIX",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5072": {
        "from": "KIX",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5745": {
        "from": "ICN",
        "to": "OKA",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5746": {
        "from": "OKA",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5075": {
        "from": "ICN",
        "to": "FUK",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5076": {
        "from": "FUK",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5095": {
        "from": "ICN",
        "to": "FUK",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5096": {
        "from": "FUK",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5859": {
        "from": "ICN",
        "to": "NKG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5860": {
        "from": "NKG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5879": {
        "from": "ICN",
        "to": "PVG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5880": {
        "from": "PVG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5857": {
        "from": "ICN",
        "to": "PVG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5858": {
        "from": "PVG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5863": {
        "from": "ICN",
        "to": "PVG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5864": {
        "from": "PVG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5885": {
        "from": "ICN",
        "to": "PVG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5886": {
        "from": "PVG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5893": {
        "from": "ICN",
        "to": "PVG",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5894": {
        "from": "PVG",
        "to": "ICN",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5887": {
        "from": "ICN",
        "to": "XMN",
        "codeshare": true,
        "operator": "MF",
        "operatorName": "샤먼항공"
      },
      "KE5888": {
        "from": "XMN",
        "to": "ICN",
        "codeshare": true,
        "operator": "MF",
        "operatorName": "샤먼항공"
      },
      "KE5873": {
        "from": "ICN",
        "to": "YNJ",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5874": {
        "from": "YNJ",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5845": {
        "from": "ICN",
        "to": "YNT",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5846": {
        "from": "YNT",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5847": {
        "from": "ICN",
        "to": "YNT",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5848": {
        "from": "YNT",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5851": {
        "from": "ICN",
        "to": "YNT",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5852": {
        "from": "YNT",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5849": {
        "from": "ICN",
        "to": "WEH",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5850": {
        "from": "WEH",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5869": {
        "from": "ICN",
        "to": "TAO",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5870": {
        "from": "TAO",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5853": {
        "from": "ICN",
        "to": "TAO",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5854": {
        "from": "TAO",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5843": {
        "from": "ICN",
        "to": "TAO",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5844": {
        "from": "TAO",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5871": {
        "from": "ICN",
        "to": "TAO",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5872": {
        "from": "TAO",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5841": {
        "from": "ICN",
        "to": "TAO",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5842": {
        "from": "TAO",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5855": {
        "from": "ICN",
        "to": "KMG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5856": {
        "from": "KMG",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5897": {
        "from": "ICN",
        "to": "FOC",
        "codeshare": true,
        "operator": "MF",
        "operatorName": "샤먼항공"
      },
      "KE5898": {
        "from": "FOC",
        "to": "ICN",
        "codeshare": true,
        "operator": "MF",
        "operatorName": "샤먼항공"
      },
      "KE5877": {
        "from": "ICN",
        "to": "HGH",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5878": {
        "from": "HGH",
        "to": "ICN",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5759": {
        "from": "ICN",
        "to": "TPE",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5760": {
        "from": "TPE",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5691": {
        "from": "ICN",
        "to": "TPE",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5692": {
        "from": "TPE",
        "to": "ICN",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5693": {
        "from": "ICN",
        "to": "TPE",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5694": {
        "from": "TPE",
        "to": "ICN",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5699": {
        "from": "ICN",
        "to": "KHH",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5700": {
        "from": "KHH",
        "to": "ICN",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5707": {
        "from": "GMP",
        "to": "HND",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5708": {
        "from": "HND",
        "to": "GMP",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5709": {
        "from": "GMP",
        "to": "HND",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5710": {
        "from": "HND",
        "to": "GMP",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5711": {
        "from": "GMP",
        "to": "HND",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5712": {
        "from": "HND",
        "to": "GMP",
        "codeshare": true,
        "operator": "JL",
        "operatorName": "일본항공"
      },
      "KE5861": {
        "from": "GMP",
        "to": "SHA",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5862": {
        "from": "SHA",
        "to": "GMP",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5899": {
        "from": "GMP",
        "to": "SHA",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5900": {
        "from": "SHA",
        "to": "GMP",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5083": {
        "from": "PUS",
        "to": "NRT",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5084": {
        "from": "NRT",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5063": {
        "from": "PUS",
        "to": "CTS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5064": {
        "from": "CTS",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5085": {
        "from": "PUS",
        "to": "KIX",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5086": {
        "from": "KIX",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5087": {
        "from": "PUS",
        "to": "KIX",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5088": {
        "from": "KIX",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5747": {
        "from": "PUS",
        "to": "OKA",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5748": {
        "from": "OKA",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5875": {
        "from": "PUS",
        "to": "PVG",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5876": {
        "from": "PVG",
        "to": "PUS",
        "codeshare": true,
        "operator": "MU",
        "operatorName": "중국동방항공"
      },
      "KE5891": {
        "from": "PUS",
        "to": "PVG",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5892": {
        "from": "PVG",
        "to": "PUS",
        "codeshare": true,
        "operator": "FM",
        "operatorName": "상하이항공"
      },
      "KE5695": {
        "from": "PUS",
        "to": "TPE",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5696": {
        "from": "TPE",
        "to": "PUS",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5697": {
        "from": "PUS",
        "to": "TPE",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5698": {
        "from": "TPE",
        "to": "PUS",
        "codeshare": true,
        "operator": "CI",
        "operatorName": "중화항공"
      },
      "KE5057": {
        "from": "CJU",
        "to": "PVG",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5058": {
        "from": "PVG",
        "to": "CJU",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5065": {
        "from": "ICN",
        "to": "BKK",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5066": {
        "from": "BKK",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5089": {
        "from": "ICN",
        "to": "CNX",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5090": {
        "from": "CNX",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5781": {
        "from": "ICN",
        "to": "CEB",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5782": {
        "from": "CEB",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5763": {
        "from": "ICN",
        "to": "CRK",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5764": {
        "from": "CRK",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5761": {
        "from": "ICN",
        "to": "BKI",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5762": {
        "from": "BKI",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5671": {
        "from": "ICN",
        "to": "KUL",
        "codeshare": true,
        "operator": "MH",
        "operatorName": "말레이시아항공"
      },
      "KE5672": {
        "from": "KUL",
        "to": "ICN",
        "codeshare": true,
        "operator": "MH",
        "operatorName": "말레이시아항공"
      },
      "KE5471": {
        "from": "ICN",
        "to": "CMB",
        "codeshare": true,
        "operator": "UL",
        "operatorName": "스리랑카항공"
      },
      "KE5472": {
        "from": "CMB",
        "to": "ICN",
        "codeshare": true,
        "operator": "UL",
        "operatorName": "스리랑카항공"
      },
      "KE5643": {
        "from": "ICN",
        "to": "CGK",
        "codeshare": true,
        "operator": "GA",
        "operatorName": "가루다인도네시아"
      },
      "KE5644": {
        "from": "CGK",
        "to": "ICN",
        "codeshare": true,
        "operator": "GA",
        "operatorName": "가루다인도네시아"
      },
      "KE5679": {
        "from": "ICN",
        "to": "CXR",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공",
        "note": "출처상 다낭 VN430/431과 번호 중복 — 확인 필요"
      },
      "KE5680": {
        "from": "CXR",
        "to": "ICN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공",
        "note": "출처상 다낭 VN430/431과 번호 중복 — 확인 필요"
      },
      "KE5769": {
        "from": "ICN",
        "to": "DAD",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5770": {
        "from": "DAD",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5683": {
        "from": "ICN",
        "to": "HAN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5684": {
        "from": "HAN",
        "to": "ICN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5689": {
        "from": "ICN",
        "to": "HAN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5690": {
        "from": "HAN",
        "to": "ICN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5681": {
        "from": "ICN",
        "to": "SGN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5682": {
        "from": "SGN",
        "to": "ICN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5675": {
        "from": "ICN",
        "to": "SGN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5676": {
        "from": "SGN",
        "to": "ICN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5773": {
        "from": "PUS",
        "to": "CEB",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5774": {
        "from": "CEB",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5765": {
        "from": "PUS",
        "to": "CRK",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5766": {
        "from": "CRK",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5055": {
        "from": "PUS",
        "to": "CXR",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5056": {
        "from": "CXR",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5771": {
        "from": "PUS",
        "to": "DAD",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5772": {
        "from": "DAD",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5685": {
        "from": "PUS",
        "to": "HAN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5686": {
        "from": "HAN",
        "to": "PUS",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5687": {
        "from": "PUS",
        "to": "SGN",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE5688": {
        "from": "SGN",
        "to": "PUS",
        "codeshare": true,
        "operator": "VN",
        "operatorName": "베트남항공"
      },
      "KE7273": {
        "from": "ICN",
        "to": "DTW",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE7274": {
        "from": "DTW",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5033": {
        "from": "ICN",
        "to": "MSP",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5034": {
        "from": "MSP",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5023": {
        "from": "ICN",
        "to": "SLC",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5024": {
        "from": "SLC",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5019": {
        "from": "ICN",
        "to": "SEA",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5020": {
        "from": "SEA",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5039": {
        "from": "ICN",
        "to": "ATL",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5040": {
        "from": "ATL",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5035": {
        "from": "ICN",
        "to": "ATL",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5036": {
        "from": "ATL",
        "to": "ICN",
        "codeshare": true,
        "operator": "DL",
        "operatorName": "델타항공"
      },
      "KE5031": {
        "from": "ICN",
        "to": "DFW",
        "codeshare": true,
        "operator": "AA",
        "operatorName": "아메리칸항공"
      },
      "KE5032": {
        "from": "DFW",
        "to": "ICN",
        "codeshare": true,
        "operator": "AA",
        "operatorName": "아메리칸항공"
      },
      "KE5007": {
        "from": "ICN",
        "to": "YYC",
        "codeshare": true,
        "operator": "WS",
        "operatorName": "웨스트젯"
      },
      "KE5008": {
        "from": "YYC",
        "to": "ICN",
        "codeshare": true,
        "operator": "WS",
        "operatorName": "웨스트젯"
      },
      "KE5907": {
        "from": "ICN",
        "to": "LHR",
        "codeshare": true,
        "operator": "VS",
        "operatorName": "버진애틀랜틱"
      },
      "KE5908": {
        "from": "LHR",
        "to": "ICN",
        "codeshare": true,
        "operator": "VS",
        "operatorName": "버진애틀랜틱"
      },
      "KE5901": {
        "from": "ICN",
        "to": "CDG",
        "codeshare": true,
        "operator": "AF",
        "operatorName": "에어프랑스"
      },
      "KE5902": {
        "from": "CDG",
        "to": "ICN",
        "codeshare": true,
        "operator": "AF",
        "operatorName": "에어프랑스"
      },
      "KE5903": {
        "from": "ICN",
        "to": "CDG",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5904": {
        "from": "CDG",
        "to": "ICN",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5925": {
        "from": "ICN",
        "to": "AMS",
        "codeshare": true,
        "operator": "KL",
        "operatorName": "KLM"
      },
      "KE5926": {
        "from": "AMS",
        "to": "ICN",
        "codeshare": true,
        "operator": "KL",
        "operatorName": "KLM"
      },
      "KE5911": {
        "from": "ICN",
        "to": "BCN",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5912": {
        "from": "BCN",
        "to": "ICN",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5941": {
        "from": "ICN",
        "to": "TAS",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5942": {
        "from": "TAS",
        "to": "ICN",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5943": {
        "from": "ICN",
        "to": "TAS",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5944": {
        "from": "TAS",
        "to": "ICN",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5945": {
        "from": "ICN",
        "to": "TAS",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5946": {
        "from": "TAS",
        "to": "ICN",
        "codeshare": true,
        "operator": "HY",
        "operatorName": "우즈베키스탄항공"
      },
      "KE5949": {
        "from": "ICN",
        "to": "TAS",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5950": {
        "from": "TAS",
        "to": "ICN",
        "codeshare": true,
        "operator": "OZ",
        "operatorName": "아시아나항공"
      },
      "KE5649": {
        "from": "ICN",
        "to": "UBN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5650": {
        "from": "UBN",
        "to": "ICN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5839": {
        "from": "ICN",
        "to": "UBN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5840": {
        "from": "UBN",
        "to": "ICN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5867": {
        "from": "ICN",
        "to": "UBN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5868": {
        "from": "UBN",
        "to": "ICN",
        "codeshare": true,
        "operator": "OM",
        "operatorName": "미아트몽골항공"
      },
      "KE5951": {
        "from": "ICN",
        "to": "DXB",
        "codeshare": true,
        "operator": "EK",
        "operatorName": "에미레이트항공"
      },
      "KE5952": {
        "from": "DXB",
        "to": "ICN",
        "codeshare": true,
        "operator": "EK",
        "operatorName": "에미레이트항공"
      },
      "KE5779": {
        "from": "ICN",
        "to": "GUM",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5780": {
        "from": "GUM",
        "to": "ICN",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5777": {
        "from": "PUS",
        "to": "GUM",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      },
      "KE5778": {
        "from": "GUM",
        "to": "PUS",
        "codeshare": true,
        "operator": "LJ",
        "operatorName": "진에어"
      }
    }
  };

  var AIRPORTS = {
    "ABQ": {
      "city": "앨버커키",
      "country": "US",
      "flag": "🇺🇸"
    },
    "ABV": {
      "city": "아부자",
      "country": "NG",
      "flag": "🇳🇬"
    },
    "ADB": {
      "city": "이즈미르",
      "country": "TR",
      "flag": "🇹🇷"
    },
    "ADD": {
      "city": "아디스아바바",
      "country": "ET",
      "flag": "🇪🇹"
    },
    "ADL": {
      "city": "애들레이드",
      "country": "AU",
      "flag": "🇦🇺"
    },
    "AEP": {
      "city": "부에노스아이레스",
      "country": "AR",
      "flag": "🇦🇷"
    },
    "AGP": {
      "city": "말라가",
      "country": "ES",
      "flag": "🇪🇸"
    },
    "AKL": {
      "city": "오클랜드",
      "country": "NZ",
      "flag": "🇳🇿",
      "tz": "Pacific/Auckland"
    },
    "ALA": {
      "city": "알마티",
      "country": "KZ",
      "flag": "🇰🇿"
    },
    "AMD": {
      "city": "아마다바드",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "AMM": {
      "city": "암만",
      "country": "JO",
      "flag": "🇯🇴"
    },
    "AMS": {
      "city": "암스테르담",
      "country": "NL",
      "flag": "🇳🇱",
      "tz": "Europe/Amsterdam"
    },
    "ANC": {
      "city": "앵커리지",
      "country": "US",
      "flag": "🇺🇸"
    },
    "AOJ": {
      "city": "아오모리",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "APW": {
      "city": "아피아",
      "country": "WS",
      "flag": "🇼🇸"
    },
    "ARN": {
      "city": "스톡홀름",
      "country": "SE",
      "flag": "🇸🇪"
    },
    "ASJ": {
      "city": "아마미",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "ATH": {
      "city": "아테네",
      "country": "GR",
      "flag": "🇬🇷"
    },
    "ATL": {
      "city": "애틀랜타",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/New_York"
    },
    "AUH": {
      "city": "아부다비",
      "country": "AE",
      "flag": "🇦🇪"
    },
    "AUS": {
      "city": "오스틴",
      "country": "US",
      "flag": "🇺🇸"
    },
    "AXT": {
      "city": "아키타",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "AYT": {
      "city": "안탈리아",
      "country": "TR",
      "flag": "🇹🇷"
    },
    "BAH": {
      "city": "바레인",
      "country": "BH",
      "flag": "🇧🇭"
    },
    "BCN": {
      "city": "바르셀로나",
      "country": "ES",
      "flag": "🇪🇸",
      "tz": "Europe/Madrid"
    },
    "BEG": {
      "city": "베오그라드",
      "country": "RS",
      "flag": "🇷🇸"
    },
    "BER": {
      "city": "베를린",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "BGO": {
      "city": "베르겐",
      "country": "NO",
      "flag": "🇳🇴"
    },
    "BGW": {
      "city": "바그다드",
      "country": "IQ",
      "flag": "🇮🇶"
    },
    "BHX": {
      "city": "버밍엄",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "BKI": {
      "city": "코타키나발루",
      "country": "MY",
      "flag": "🇲🇾",
      "tz": "Asia/Kuala_Lumpur"
    },
    "BKK": {
      "city": "방콕",
      "country": "TH",
      "flag": "🇹🇭",
      "tz": "Asia/Bangkok"
    },
    "BLL": {
      "city": "빌룬",
      "country": "DK",
      "flag": "🇩🇰"
    },
    "BLQ": {
      "city": "볼로냐",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "BLR": {
      "city": "벵갈루루",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "BNA": {
      "city": "내슈빌",
      "country": "US",
      "flag": "🇺🇸"
    },
    "BNE": {
      "city": "브리즈번",
      "country": "AU",
      "flag": "🇦🇺",
      "tz": "Australia/Brisbane"
    },
    "BOD": {
      "city": "보르도",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "BOG": {
      "city": "보고타",
      "country": "CO",
      "flag": "🇨🇴"
    },
    "BOI": {
      "city": "보이시",
      "country": "US",
      "flag": "🇺🇸"
    },
    "BOM": {
      "city": "뭄바이",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "BOS": {
      "city": "보스턴",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/New_York"
    },
    "BRU": {
      "city": "브뤼셀",
      "country": "BE",
      "flag": "🇧🇪"
    },
    "BSB": {
      "city": "브라질리아",
      "country": "BR",
      "flag": "🇧🇷"
    },
    "BSL": {
      "city": "바젤",
      "country": "CH",
      "flag": "🇨🇭"
    },
    "BTH": {
      "city": "바탐",
      "country": "ID",
      "flag": "🇮🇩"
    },
    "BTS": {
      "city": "브라티슬라바",
      "country": "SK",
      "flag": "🇸🇰"
    },
    "BUD": {
      "city": "부다페스트",
      "country": "HU",
      "flag": "🇭🇺",
      "tz": "Europe/Budapest"
    },
    "BUR": {
      "city": "버뱅크",
      "country": "US",
      "flag": "🇺🇸"
    },
    "BWI": {
      "city": "볼티모어",
      "country": "US",
      "flag": "🇺🇸"
    },
    "BWN": {
      "city": "반다르스리브가완",
      "country": "BN",
      "flag": "🇧🇳"
    },
    "CAI": {
      "city": "카이로",
      "country": "EG",
      "flag": "🇪🇬"
    },
    "CAN": {
      "city": "광저우",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "CCU": {
      "city": "콜카타",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "CDG": {
      "city": "파리",
      "country": "FR",
      "flag": "🇫🇷",
      "tz": "Europe/Paris"
    },
    "CEB": {
      "city": "세부",
      "country": "PH",
      "flag": "🇵🇭",
      "tz": "Asia/Manila"
    },
    "CEI": {
      "city": "치앙라이",
      "country": "TH",
      "flag": "🇹🇭"
    },
    "CGK": {
      "city": "자카르타",
      "country": "ID",
      "flag": "🇮🇩",
      "tz": "Asia/Jakarta"
    },
    "CGN": {
      "city": "쾰른",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "CGO": {
      "city": "정저우",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "CGQ": {
      "city": "창춘",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "CHC": {
      "city": "크라이스트처치",
      "country": "NZ",
      "flag": "🇳🇿"
    },
    "CJJ": {
      "city": "청주",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "CJU": {
      "city": "제주",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "CKG": {
      "city": "충칭",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "CLE": {
      "city": "클리블랜드",
      "country": "US",
      "flag": "🇺🇸"
    },
    "CLJ": {
      "city": "클루지",
      "country": "RO",
      "flag": "🇷🇴"
    },
    "CLT": {
      "city": "샬럿",
      "country": "US",
      "flag": "🇺🇸"
    },
    "CMB": {
      "city": "콜롬보",
      "country": "LK",
      "flag": "🇱🇰",
      "tz": "Asia/Colombo"
    },
    "CMN": {
      "city": "카사블랑카",
      "country": "MA",
      "flag": "🇲🇦"
    },
    "CNF": {
      "city": "벨루오리존치",
      "country": "BR",
      "flag": "🇧🇷"
    },
    "CNS": {
      "city": "케언스",
      "country": "AU",
      "flag": "🇦🇺"
    },
    "CNX": {
      "city": "치앙마이",
      "country": "TH",
      "flag": "🇹🇭",
      "tz": "Asia/Bangkok"
    },
    "COK": {
      "city": "코치",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "CPH": {
      "city": "코펜하겐",
      "country": "DK",
      "flag": "🇩🇰"
    },
    "CPT": {
      "city": "케이프타운",
      "country": "ZA",
      "flag": "🇿🇦"
    },
    "CRK": {
      "city": "앙헬레스(클라크)",
      "country": "PH",
      "flag": "🇵🇭",
      "tz": "Asia/Manila"
    },
    "CRL": {
      "city": "브뤼셀",
      "country": "BE",
      "flag": "🇧🇪"
    },
    "CSX": {
      "city": "창사",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "CTA": {
      "city": "카타니아",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "CTG": {
      "city": "카르타헤나",
      "country": "CO",
      "flag": "🇨🇴"
    },
    "CTS": {
      "city": "삿포로",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "CTU": {
      "city": "청두",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "CUN": {
      "city": "칸쿤",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "CVG": {
      "city": "신시내티",
      "country": "US",
      "flag": "🇺🇸"
    },
    "CXR": {
      "city": "나트랑",
      "country": "VN",
      "flag": "🇻🇳",
      "tz": "Asia/Ho_Chi_Minh"
    },
    "DAC": {
      "city": "다카",
      "country": "BD",
      "flag": "🇧🇩"
    },
    "DAD": {
      "city": "다낭",
      "country": "VN",
      "flag": "🇻🇳",
      "tz": "Asia/Ho_Chi_Minh"
    },
    "DAR": {
      "city": "다르에스살람",
      "country": "TZ",
      "flag": "🇹🇿"
    },
    "DBV": {
      "city": "두브로브니크",
      "country": "HR",
      "flag": "🇭🇷"
    },
    "DCA": {
      "city": "워싱턴",
      "country": "US",
      "flag": "🇺🇸"
    },
    "DEL": {
      "city": "델리",
      "country": "IN",
      "flag": "🇮🇳",
      "tz": "Asia/Kolkata"
    },
    "DEN": {
      "city": "덴버",
      "country": "US",
      "flag": "🇺🇸"
    },
    "DFW": {
      "city": "댈러스",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Chicago"
    },
    "DIL": {
      "city": "딜리",
      "country": "TL",
      "flag": "🇹🇱"
    },
    "DLC": {
      "city": "다롄",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "DME": {
      "city": "모스크바",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "DMK": {
      "city": "방콕",
      "country": "TH",
      "flag": "🇹🇭"
    },
    "DMM": {
      "city": "담맘",
      "country": "SA",
      "flag": "🇸🇦"
    },
    "DOH": {
      "city": "도하",
      "country": "QA",
      "flag": "🇶🇦"
    },
    "DPS": {
      "city": "발리",
      "country": "ID",
      "flag": "🇮🇩",
      "tz": "Asia/Makassar"
    },
    "DRW": {
      "city": "다윈",
      "country": "AU",
      "flag": "🇦🇺"
    },
    "DTW": {
      "city": "디트로이트",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Detroit"
    },
    "DUB": {
      "city": "더블린",
      "country": "IE",
      "flag": "🇮🇪"
    },
    "DUR": {
      "city": "더반",
      "country": "ZA",
      "flag": "🇿🇦"
    },
    "DUS": {
      "city": "뒤셀도르프",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "DVO": {
      "city": "다바오",
      "country": "PH",
      "flag": "🇵🇭"
    },
    "DXB": {
      "city": "두바이",
      "country": "AE",
      "flag": "🇦🇪",
      "tz": "Asia/Dubai"
    },
    "DYG": {
      "city": "장자제",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "EBL": {
      "city": "에르빌",
      "country": "IQ",
      "flag": "🇮🇶"
    },
    "EDI": {
      "city": "에든버러",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "EIN": {
      "city": "에인트호번",
      "country": "NL",
      "flag": "🇳🇱"
    },
    "ESB": {
      "city": "앙카라",
      "country": "TR",
      "flag": "🇹🇷"
    },
    "EVN": {
      "city": "예레반",
      "country": "AM",
      "flag": "🇦🇲"
    },
    "EWR": {
      "city": "뉴욕",
      "country": "US",
      "flag": "🇺🇸"
    },
    "EZE": {
      "city": "부에노스아이레스",
      "country": "AR",
      "flag": "🇦🇷"
    },
    "FCO": {
      "city": "로마",
      "country": "IT",
      "flag": "🇮🇹",
      "tz": "Europe/Rome"
    },
    "FLL": {
      "city": "포트로더데일",
      "country": "US",
      "flag": "🇺🇸"
    },
    "FLR": {
      "city": "피렌체",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "FNC": {
      "city": "마데이라",
      "country": "PT",
      "flag": "🇵🇹"
    },
    "FOC": {
      "city": "푸저우",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "FRA": {
      "city": "프랑크푸르트",
      "country": "DE",
      "flag": "🇩🇪",
      "tz": "Europe/Berlin"
    },
    "FRU": {
      "city": "비슈케크",
      "country": "KG",
      "flag": "🇰🇬"
    },
    "FSZ": {
      "city": "시즈오카",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "FUK": {
      "city": "후쿠오카",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "GDL": {
      "city": "과달라하라",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "GDN": {
      "city": "그단스크",
      "country": "PL",
      "flag": "🇵🇱"
    },
    "GIG": {
      "city": "리우데자네이루",
      "country": "BR",
      "flag": "🇧🇷"
    },
    "GLA": {
      "city": "글래스고",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "GMP": {
      "city": "김포",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "GOT": {
      "city": "예테보리",
      "country": "SE",
      "flag": "🇸🇪"
    },
    "GRU": {
      "city": "상파울루",
      "country": "BR",
      "flag": "🇧🇷"
    },
    "GUM": {
      "city": "괌",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "Pacific/Guam"
    },
    "GVA": {
      "city": "제네바",
      "country": "CH",
      "flag": "🇨🇭"
    },
    "GYD": {
      "city": "바쿠",
      "country": "AZ",
      "flag": "🇦🇿"
    },
    "GYE": {
      "city": "과야킬",
      "country": "EC",
      "flag": "🇪🇨"
    },
    "HAJ": {
      "city": "하노버",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "HAK": {
      "city": "하이커우",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "HAM": {
      "city": "함부르크",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "HAN": {
      "city": "하노이",
      "country": "VN",
      "flag": "🇻🇳",
      "tz": "Asia/Ho_Chi_Minh"
    },
    "HAV": {
      "city": "아바나",
      "country": "CU",
      "flag": "🇨🇺"
    },
    "HEL": {
      "city": "헬싱키",
      "country": "FI",
      "flag": "🇫🇮"
    },
    "HER": {
      "city": "크레타",
      "country": "GR",
      "flag": "🇬🇷"
    },
    "HET": {
      "city": "후허하오터",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "HFE": {
      "city": "허페이",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "HGH": {
      "city": "항저우",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "HIJ": {
      "city": "히로시마",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "HIN": {
      "city": "사천",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "HKD": {
      "city": "하코다테",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "HKG": {
      "city": "홍콩",
      "country": "HK",
      "flag": "🇭🇰",
      "tz": "Asia/Hong_Kong"
    },
    "HKT": {
      "city": "푸껫",
      "country": "TH",
      "flag": "🇹🇭",
      "tz": "Asia/Bangkok"
    },
    "HND": {
      "city": "도쿄(하네다)",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "HNL": {
      "city": "호놀룰루",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "Pacific/Honolulu"
    },
    "HPH": {
      "city": "하이퐁",
      "country": "VN",
      "flag": "🇻🇳"
    },
    "HRB": {
      "city": "하얼빈",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "HRG": {
      "city": "후르가다",
      "country": "EG",
      "flag": "🇪🇬"
    },
    "HYD": {
      "city": "하이데라바드",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "IAD": {
      "city": "워싱턴",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/New_York"
    },
    "IAH": {
      "city": "휴스턴",
      "country": "US",
      "flag": "🇺🇸"
    },
    "ICN": {
      "city": "인천",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "IEV": {
      "city": "키이우",
      "country": "UA",
      "flag": "🇺🇦"
    },
    "IKA": {
      "city": "테헤란",
      "country": "IR",
      "flag": "🇮🇷"
    },
    "IKT": {
      "city": "이르쿠츠크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "INC": {
      "city": "인촨",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "IND": {
      "city": "인디애나폴리스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "ISB": {
      "city": "이슬라마바드",
      "country": "PK",
      "flag": "🇵🇰"
    },
    "ISG": {
      "city": "이시가키",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "IST": {
      "city": "이스탄불",
      "country": "TR",
      "flag": "🇹🇷",
      "tz": "Europe/Istanbul"
    },
    "ITM": {
      "city": "오사카",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "IZO": {
      "city": "이즈모",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "JAX": {
      "city": "잭슨빌",
      "country": "US",
      "flag": "🇺🇸"
    },
    "JED": {
      "city": "제다",
      "country": "SA",
      "flag": "🇸🇦"
    },
    "JFK": {
      "city": "뉴욕",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/New_York"
    },
    "JHB": {
      "city": "조호르바루",
      "country": "MY",
      "flag": "🇲🇾"
    },
    "JJN": {
      "city": "취안저우",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "JNB": {
      "city": "요하네스버그",
      "country": "ZA",
      "flag": "🇿🇦"
    },
    "JOG": {
      "city": "족자카르타",
      "country": "ID",
      "flag": "🇮🇩"
    },
    "JRO": {
      "city": "킬리만자로",
      "country": "TZ",
      "flag": "🇹🇿"
    },
    "JTR": {
      "city": "산토리니",
      "country": "GR",
      "flag": "🇬🇷"
    },
    "KBP": {
      "city": "키이우",
      "country": "UA",
      "flag": "🇺🇦"
    },
    "KBV": {
      "city": "끄라비",
      "country": "TH",
      "flag": "🇹🇭"
    },
    "KCH": {
      "city": "쿠칭",
      "country": "MY",
      "flag": "🇲🇾"
    },
    "KCZ": {
      "city": "고치",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "KEF": {
      "city": "레이캬비크",
      "country": "IS",
      "flag": "🇮🇸"
    },
    "KHH": {
      "city": "가오슝",
      "country": "TW",
      "flag": "🇹🇼",
      "tz": "Asia/Taipei"
    },
    "KHI": {
      "city": "카라치",
      "country": "PK",
      "flag": "🇵🇰"
    },
    "KHV": {
      "city": "하바롭스크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "KIJ": {
      "city": "니가타",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "KIX": {
      "city": "오사카",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "KLO": {
      "city": "칼리보",
      "country": "PH",
      "flag": "🇵🇭"
    },
    "KMG": {
      "city": "쿤밍",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "KMI": {
      "city": "미야자키",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "KMJ": {
      "city": "구마모토",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "KMQ": {
      "city": "코마츠",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "KOA": {
      "city": "코나",
      "country": "US",
      "flag": "🇺🇸"
    },
    "KOJ": {
      "city": "가고시마",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "KPO": {
      "city": "포항",
      "country": "KR",
      "flag": "🇰🇷"
    },
    "KRK": {
      "city": "크라쿠프",
      "country": "PL",
      "flag": "🇵🇱"
    },
    "KTM": {
      "city": "카트만두",
      "country": "NP",
      "flag": "🇳🇵",
      "tz": "Asia/Kathmandu"
    },
    "KUL": {
      "city": "쿠알라룸푸르",
      "country": "MY",
      "flag": "🇲🇾",
      "tz": "Asia/Kuala_Lumpur"
    },
    "KUV": {
      "city": "군산",
      "country": "KR",
      "flag": "🇰🇷"
    },
    "KWE": {
      "city": "구이양",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "KWI": {
      "city": "쿠웨이트",
      "country": "KW",
      "flag": "🇰🇼"
    },
    "KWJ": {
      "city": "광주",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "KWL": {
      "city": "구이린",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "KZN": {
      "city": "카잔",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "LAS": {
      "city": "라스베이거스",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Los_Angeles"
    },
    "LAX": {
      "city": "로스앤젤레스",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Los_Angeles"
    },
    "LCA": {
      "city": "라르나카",
      "country": "CY",
      "flag": "🇨🇾"
    },
    "LCY": {
      "city": "런던",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "LED": {
      "city": "상트페테르부르크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "LEJ": {
      "city": "라이프치히",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "LGA": {
      "city": "뉴욕",
      "country": "US",
      "flag": "🇺🇸"
    },
    "LGK": {
      "city": "랑카위",
      "country": "MY",
      "flag": "🇲🇾"
    },
    "LGW": {
      "city": "런던",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "LHE": {
      "city": "라호르",
      "country": "PK",
      "flag": "🇵🇰"
    },
    "LHR": {
      "city": "런던",
      "country": "GB",
      "flag": "🇬🇧",
      "tz": "Europe/London"
    },
    "LHW": {
      "city": "란저우",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "LIH": {
      "city": "카우아이",
      "country": "US",
      "flag": "🇺🇸"
    },
    "LIM": {
      "city": "리마",
      "country": "PE",
      "flag": "🇵🇪"
    },
    "LIN": {
      "city": "밀라노",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "LIS": {
      "city": "리스본",
      "country": "PT",
      "flag": "🇵🇹",
      "tz": "Europe/Lisbon"
    },
    "LJU": {
      "city": "류블랴나",
      "country": "SI",
      "flag": "🇸🇮"
    },
    "LOS": {
      "city": "라고스",
      "country": "NG",
      "flag": "🇳🇬"
    },
    "LPQ": {
      "city": "루앙프라방",
      "country": "LA",
      "flag": "🇱🇦"
    },
    "LUX": {
      "city": "룩셈부르크",
      "country": "LU",
      "flag": "🇱🇺"
    },
    "LYS": {
      "city": "리옹",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "MAA": {
      "city": "첸나이",
      "country": "IN",
      "flag": "🇮🇳"
    },
    "MAD": {
      "city": "마드리드",
      "country": "ES",
      "flag": "🇪🇸",
      "tz": "Europe/Madrid"
    },
    "MAN": {
      "city": "맨체스터",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "MBA": {
      "city": "몸바사",
      "country": "KE",
      "flag": "🇰🇪"
    },
    "MCI": {
      "city": "캔자스시티",
      "country": "US",
      "flag": "🇺🇸"
    },
    "MCO": {
      "city": "올랜도",
      "country": "US",
      "flag": "🇺🇸"
    },
    "MCT": {
      "city": "무스카트",
      "country": "OM",
      "flag": "🇴🇲"
    },
    "MDG": {
      "city": "무단장",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "MDL": {
      "city": "만달레이",
      "country": "MM",
      "flag": "🇲🇲"
    },
    "MEL": {
      "city": "멜버른",
      "country": "AU",
      "flag": "🇦🇺",
      "tz": "Australia/Melbourne"
    },
    "MEM": {
      "city": "멤피스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "MEX": {
      "city": "멕시코시티",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "MFM": {
      "city": "마카오",
      "country": "MO",
      "flag": "🇲🇴",
      "tz": "Asia/Macau"
    },
    "MIA": {
      "city": "마이애미",
      "country": "US",
      "flag": "🇺🇸"
    },
    "MLA": {
      "city": "몰타",
      "country": "MT",
      "flag": "🇲🇹"
    },
    "MLE": {
      "city": "몰디브",
      "country": "MV",
      "flag": "🇲🇻"
    },
    "MMY": {
      "city": "미야코",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "MNL": {
      "city": "마닐라",
      "country": "PH",
      "flag": "🇵🇭",
      "tz": "Asia/Manila"
    },
    "MRS": {
      "city": "마르세유",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "MRU": {
      "city": "모리셔스",
      "country": "MU",
      "flag": "🇲🇺"
    },
    "MSP": {
      "city": "미니애폴리스",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Chicago"
    },
    "MSQ": {
      "city": "민스크",
      "country": "BY",
      "flag": "🇧🇾"
    },
    "MSY": {
      "city": "뉴올리언스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "MTY": {
      "city": "몬테레이",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "MUC": {
      "city": "뮌헨",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "MWX": {
      "city": "무안",
      "country": "KR",
      "flag": "🇰🇷"
    },
    "MXP": {
      "city": "밀라노",
      "country": "IT",
      "flag": "🇮🇹",
      "tz": "Europe/Rome"
    },
    "MYJ": {
      "city": "마쓰야마",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "NAN": {
      "city": "나디",
      "country": "FJ",
      "flag": "🇫🇯"
    },
    "NAP": {
      "city": "나폴리",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "NBO": {
      "city": "나이로비",
      "country": "KE",
      "flag": "🇰🇪"
    },
    "NCE": {
      "city": "니스",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "NGB": {
      "city": "닝보",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "NGO": {
      "city": "나고야",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "NGS": {
      "city": "나가사키",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "NKG": {
      "city": "난징",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "NNG": {
      "city": "난닝",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "NOU": {
      "city": "누메아",
      "country": "NC",
      "flag": "🇳🇨"
    },
    "NQZ": {
      "city": "아스타나",
      "country": "KZ",
      "flag": "🇰🇿"
    },
    "NRT": {
      "city": "도쿄(나리타)",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "NUE": {
      "city": "뉘른베르크",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "OAK": {
      "city": "오클랜드",
      "country": "US",
      "flag": "🇺🇸"
    },
    "OGG": {
      "city": "마우이",
      "country": "US",
      "flag": "🇺🇸"
    },
    "OIT": {
      "city": "오이타",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "OKA": {
      "city": "오키나와",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "OKJ": {
      "city": "오카야마",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "OMA": {
      "city": "오마하",
      "country": "US",
      "flag": "🇺🇸"
    },
    "ONT": {
      "city": "온타리오",
      "country": "US",
      "flag": "🇺🇸"
    },
    "OOL": {
      "city": "골드코스트",
      "country": "AU",
      "flag": "🇦🇺"
    },
    "OPO": {
      "city": "포르투",
      "country": "PT",
      "flag": "🇵🇹"
    },
    "ORD": {
      "city": "시카고",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Chicago"
    },
    "ORY": {
      "city": "파리",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "OSL": {
      "city": "오슬로",
      "country": "NO",
      "flag": "🇳🇴"
    },
    "OTP": {
      "city": "부쿠레슈티",
      "country": "RO",
      "flag": "🇷🇴"
    },
    "OVB": {
      "city": "노보시비르스크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "PBH": {
      "city": "파로",
      "country": "BT",
      "flag": "🇧🇹"
    },
    "PDX": {
      "city": "포틀랜드",
      "country": "US",
      "flag": "🇺🇸"
    },
    "PEK": {
      "city": "베이징",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "PEN": {
      "city": "페낭",
      "country": "MY",
      "flag": "🇲🇾"
    },
    "PER": {
      "city": "퍼스",
      "country": "AU",
      "flag": "🇦🇺"
    },
    "PHL": {
      "city": "필라델피아",
      "country": "US",
      "flag": "🇺🇸"
    },
    "PHX": {
      "city": "피닉스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "PIT": {
      "city": "피츠버그",
      "country": "US",
      "flag": "🇺🇸"
    },
    "PKX": {
      "city": "베이징",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "PMI": {
      "city": "마요르카",
      "country": "ES",
      "flag": "🇪🇸"
    },
    "PNH": {
      "city": "프놈펜",
      "country": "KH",
      "flag": "🇰🇭",
      "tz": "Asia/Phnom_Penh"
    },
    "POM": {
      "city": "포트모르즈비",
      "country": "PG",
      "flag": "🇵🇬"
    },
    "PPS": {
      "city": "팔라완",
      "country": "PH",
      "flag": "🇵🇭"
    },
    "PPT": {
      "city": "타히티",
      "country": "PF",
      "flag": "🇵🇫"
    },
    "PQC": {
      "city": "푸꾸옥",
      "country": "VN",
      "flag": "🇻🇳",
      "tz": "Asia/Ho_Chi_Minh"
    },
    "PRG": {
      "city": "프라하",
      "country": "CZ",
      "flag": "🇨🇿",
      "tz": "Europe/Prague"
    },
    "PSA": {
      "city": "피사",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "PTY": {
      "city": "파나마시티",
      "country": "PA",
      "flag": "🇵🇦"
    },
    "PUJ": {
      "city": "푼타카나",
      "country": "DO",
      "flag": "🇩🇴"
    },
    "PUS": {
      "city": "부산",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "PVG": {
      "city": "상하이(푸둥)",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "PVR": {
      "city": "푸에르토바야르타",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "RAK": {
      "city": "마라케시",
      "country": "MA",
      "flag": "🇲🇦"
    },
    "RDU": {
      "city": "롤리",
      "country": "US",
      "flag": "🇺🇸"
    },
    "REP": {
      "city": "씨엠립",
      "country": "KH",
      "flag": "🇰🇭"
    },
    "RGN": {
      "city": "양곤",
      "country": "MM",
      "flag": "🇲🇲",
      "tz": "Asia/Yangon"
    },
    "RIX": {
      "city": "리가",
      "country": "LV",
      "flag": "🇱🇻"
    },
    "RMQ": {
      "city": "타이중",
      "country": "TW",
      "flag": "🇹🇼"
    },
    "ROR": {
      "city": "팔라우",
      "country": "PW",
      "flag": "🇵🇼"
    },
    "RSU": {
      "city": "여수",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "RSW": {
      "city": "포트마이어스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "RUH": {
      "city": "리야드",
      "country": "SA",
      "flag": "🇸🇦"
    },
    "RVN": {
      "city": "로바니에미",
      "country": "FI",
      "flag": "🇫🇮"
    },
    "SAN": {
      "city": "샌디에이고",
      "country": "US",
      "flag": "🇺🇸"
    },
    "SAW": {
      "city": "이스탄불",
      "country": "TR",
      "flag": "🇹🇷"
    },
    "SCL": {
      "city": "산티아고",
      "country": "CL",
      "flag": "🇨🇱"
    },
    "SDJ": {
      "city": "센다이",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "SDQ": {
      "city": "산토도밍고",
      "country": "DO",
      "flag": "🇩🇴"
    },
    "SEA": {
      "city": "시애틀",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Los_Angeles"
    },
    "SEZ": {
      "city": "세이셸",
      "country": "SC",
      "flag": "🇸🇨"
    },
    "SFO": {
      "city": "샌프란시스코",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Los_Angeles"
    },
    "SGN": {
      "city": "호찌민",
      "country": "VN",
      "flag": "🇻🇳",
      "tz": "Asia/Ho_Chi_Minh"
    },
    "SHA": {
      "city": "상하이(훙차오)",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "SHE": {
      "city": "선양",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "SHJ": {
      "city": "샤르자",
      "country": "AE",
      "flag": "🇦🇪"
    },
    "SIN": {
      "city": "싱가포르",
      "country": "SG",
      "flag": "🇸🇬",
      "tz": "Asia/Singapore"
    },
    "SJC": {
      "city": "새너제이",
      "country": "US",
      "flag": "🇺🇸"
    },
    "SJD": {
      "city": "로스카보스",
      "country": "MX",
      "flag": "🇲🇽"
    },
    "SJO": {
      "city": "산호세",
      "country": "CR",
      "flag": "🇨🇷"
    },
    "SJW": {
      "city": "스자좡",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "SKD": {
      "city": "사마르칸트",
      "country": "UZ",
      "flag": "🇺🇿"
    },
    "SKG": {
      "city": "테살로니키",
      "country": "GR",
      "flag": "🇬🇷"
    },
    "SLC": {
      "city": "솔트레이크시티",
      "country": "US",
      "flag": "🇺🇸",
      "tz": "America/Denver"
    },
    "SMF": {
      "city": "새크라멘토",
      "country": "US",
      "flag": "🇺🇸"
    },
    "SNA": {
      "city": "오렌지카운티",
      "country": "US",
      "flag": "🇺🇸"
    },
    "SOF": {
      "city": "소피아",
      "country": "BG",
      "flag": "🇧🇬"
    },
    "SPN": {
      "city": "사이판",
      "country": "MP",
      "flag": "🇲🇵"
    },
    "SPU": {
      "city": "스플리트",
      "country": "HR",
      "flag": "🇭🇷"
    },
    "SRG": {
      "city": "스마랑",
      "country": "ID",
      "flag": "🇮🇩"
    },
    "SSH": {
      "city": "샤름엘셰이크",
      "country": "EG",
      "flag": "🇪🇬"
    },
    "STL": {
      "city": "세인트루이스",
      "country": "US",
      "flag": "🇺🇸"
    },
    "STN": {
      "city": "런던",
      "country": "GB",
      "flag": "🇬🇧"
    },
    "STR": {
      "city": "슈투트가르트",
      "country": "DE",
      "flag": "🇩🇪"
    },
    "SUB": {
      "city": "수라바야",
      "country": "ID",
      "flag": "🇮🇩"
    },
    "SVO": {
      "city": "모스크바",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "SVQ": {
      "city": "세비야",
      "country": "ES",
      "flag": "🇪🇸"
    },
    "SWA": {
      "city": "산터우",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "SYD": {
      "city": "시드니",
      "country": "AU",
      "flag": "🇦🇺",
      "tz": "Australia/Sydney"
    },
    "SYX": {
      "city": "싼야",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "SZG": {
      "city": "잘츠부르크",
      "country": "AT",
      "flag": "🇦🇹"
    },
    "SZX": {
      "city": "선전",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "TAE": {
      "city": "대구",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "TAG": {
      "city": "보홀",
      "country": "PH",
      "flag": "🇵🇭"
    },
    "TAK": {
      "city": "다카마쓰",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "TAO": {
      "city": "칭다오",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "TAS": {
      "city": "타슈켄트",
      "country": "UZ",
      "flag": "🇺🇿",
      "tz": "Asia/Tashkent"
    },
    "TBS": {
      "city": "트빌리시",
      "country": "GE",
      "flag": "🇬🇪"
    },
    "TFU": {
      "city": "청두",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "TKS": {
      "city": "도쿠시마",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "TLL": {
      "city": "탈린",
      "country": "EE",
      "flag": "🇪🇪"
    },
    "TLS": {
      "city": "툴루즈",
      "country": "FR",
      "flag": "🇫🇷"
    },
    "TLV": {
      "city": "텔아비브",
      "country": "IL",
      "flag": "🇮🇱"
    },
    "TNA": {
      "city": "지난",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "TOY": {
      "city": "도야마",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "TPA": {
      "city": "탬파",
      "country": "US",
      "flag": "🇺🇸"
    },
    "TPE": {
      "city": "타이베이",
      "country": "TW",
      "flag": "🇹🇼",
      "tz": "Asia/Taipei"
    },
    "TRD": {
      "city": "트론헤임",
      "country": "NO",
      "flag": "🇳🇴"
    },
    "TSA": {
      "city": "타이베이",
      "country": "TW",
      "flag": "🇹🇼"
    },
    "TSE": {
      "city": "아스타나",
      "country": "KZ",
      "flag": "🇰🇿"
    },
    "TSN": {
      "city": "톈진",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "TUN": {
      "city": "튀니스",
      "country": "TN",
      "flag": "🇹🇳"
    },
    "TUS": {
      "city": "투손",
      "country": "US",
      "flag": "🇺🇸"
    },
    "TYN": {
      "city": "타이위안",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "UBN": {
      "city": "울란바타르",
      "country": "MN",
      "flag": "🇲🇳",
      "tz": "Asia/Ulaanbaatar"
    },
    "UIO": {
      "city": "키토",
      "country": "EC",
      "flag": "🇪🇨"
    },
    "UKB": {
      "city": "고베",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "ULN": {
      "city": "울란바토르",
      "country": "MN",
      "flag": "🇲🇳"
    },
    "UPG": {
      "city": "마카사르",
      "country": "ID",
      "flag": "🇮🇩"
    },
    "URC": {
      "city": "우루무치",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "USM": {
      "city": "사무이",
      "country": "TH",
      "flag": "🇹🇭"
    },
    "USN": {
      "city": "울산",
      "country": "KR",
      "flag": "🇰🇷",
      "tz": "Asia/Seoul"
    },
    "UUS": {
      "city": "유즈노사할린스크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "VAR": {
      "city": "바르나",
      "country": "BG",
      "flag": "🇧🇬"
    },
    "VCA": {
      "city": "껀터",
      "country": "VN",
      "flag": "🇻🇳"
    },
    "VCE": {
      "city": "베네치아",
      "country": "IT",
      "flag": "🇮🇹"
    },
    "VIE": {
      "city": "비엔나",
      "country": "AT",
      "flag": "🇦🇹",
      "tz": "Europe/Vienna"
    },
    "VKO": {
      "city": "모스크바",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "VLC": {
      "city": "발렌시아",
      "country": "ES",
      "flag": "🇪🇸"
    },
    "VNO": {
      "city": "빌뉴스",
      "country": "LT",
      "flag": "🇱🇹"
    },
    "VTE": {
      "city": "비엔티안",
      "country": "LA",
      "flag": "🇱🇦"
    },
    "VVO": {
      "city": "블라디보스토크",
      "country": "RU",
      "flag": "🇷🇺"
    },
    "WAW": {
      "city": "바르샤바",
      "country": "PL",
      "flag": "🇵🇱"
    },
    "WEH": {
      "city": "웨이하이",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "WJU": {
      "city": "원주",
      "country": "KR",
      "flag": "🇰🇷"
    },
    "WLG": {
      "city": "웰링턴",
      "country": "NZ",
      "flag": "🇳🇿"
    },
    "WNZ": {
      "city": "원저우",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "WUH": {
      "city": "우한",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "XIY": {
      "city": "시안",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "XMN": {
      "city": "샤먼",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "XNN": {
      "city": "시닝",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "YEG": {
      "city": "에드먼턴",
      "country": "CA",
      "flag": "🇨🇦"
    },
    "YGJ": {
      "city": "요나고",
      "country": "JP",
      "flag": "🇯🇵"
    },
    "YHZ": {
      "city": "핼리팩스",
      "country": "CA",
      "flag": "🇨🇦"
    },
    "YNJ": {
      "city": "옌지",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "YNT": {
      "city": "옌타이",
      "country": "CN",
      "flag": "🇨🇳",
      "tz": "Asia/Shanghai"
    },
    "YNY": {
      "city": "양양",
      "country": "KR",
      "flag": "🇰🇷"
    },
    "YOW": {
      "city": "오타와",
      "country": "CA",
      "flag": "🇨🇦"
    },
    "YUL": {
      "city": "몬트리올",
      "country": "CA",
      "flag": "🇨🇦"
    },
    "YVR": {
      "city": "밴쿠버",
      "country": "CA",
      "flag": "🇨🇦",
      "tz": "America/Vancouver"
    },
    "YWG": {
      "city": "위니펙",
      "country": "CA",
      "flag": "🇨🇦"
    },
    "YYC": {
      "city": "캘거리",
      "country": "CA",
      "flag": "🇨🇦",
      "tz": "America/Edmonton"
    },
    "YYZ": {
      "city": "토론토",
      "country": "CA",
      "flag": "🇨🇦",
      "tz": "America/Toronto"
    },
    "ZAG": {
      "city": "자그레브",
      "country": "HR",
      "flag": "🇭🇷"
    },
    "ZQN": {
      "city": "퀸스타운",
      "country": "NZ",
      "flag": "🇳🇿"
    },
    "ZRH": {
      "city": "취리히",
      "country": "CH",
      "flag": "🇨🇭",
      "tz": "Europe/Zurich"
    },
    "ZUH": {
      "city": "주하이",
      "country": "CN",
      "flag": "🇨🇳"
    },
    "KKJ": {
      "city": "기타큐슈",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    },
    "SHI": {
      "city": "미야코지마",
      "country": "JP",
      "flag": "🇯🇵",
      "tz": "Asia/Tokyo"
    }
  };

  var TIMES = {
    "note": "대한항공 편 한국 쪽 시각. 나가는 편은 한국 출발 시각, 들어오는 편은 한국 도착 시각.",
    "source": "인천·김포·김해·제주공항 시간표 (2026년 9월 기준)",
    "warning": "요일과 계절에 따라 바뀝니다. 실제 로스터가 언제나 우선합니다.",
    "times": {
      "KE0005": {
        "start": "21:00"
      },
      "KE0006": {
        "end": "04:40",
        "endOffset": 1
      },
      "KE0011": {
        "start": "19:40"
      },
      "KE0012": {
        "end": "04:40",
        "endOffset": 1
      },
      "KE0017": {
        "start": "14:30"
      },
      "KE0018": {
        "end": "17:50",
        "endOffset": 1
      },
      "KE0023": {
        "start": "16:00"
      },
      "KE0024": {
        "end": "17:20",
        "endOffset": 1
      },
      "KE0031": {
        "start": "09:30"
      },
      "KE0032": {
        "end": "16:40",
        "endOffset": 1
      },
      "KE0033": {
        "start": "08:45"
      },
      "KE0034": {
        "end": "15:55",
        "endOffset": 1
      },
      "KE0035": {
        "start": "10:35"
      },
      "KE0036": {
        "end": "17:50",
        "endOffset": 1
      },
      "KE0037": {
        "start": "10:40"
      },
      "KE0038": {
        "end": "16:50",
        "endOffset": 1
      },
      "KE0041": {
        "start": "16:40"
      },
      "KE0042": {
        "end": "16:40",
        "endOffset": 1
      },
      "KE0053": {
        "start": "21:05"
      },
      "KE0054": {
        "end": "17:40",
        "endOffset": 1
      },
      "KE0071": {
        "start": "18:45"
      },
      "KE0072": {
        "end": "17:50",
        "endOffset": 1
      },
      "KE0075": {
        "start": "22:40"
      },
      "KE0076": {
        "end": "04:25",
        "endOffset": 1
      },
      "KE0077": {
        "start": "10:00"
      },
      "KE0078": {
        "end": "16:30",
        "endOffset": 1
      },
      "KE0081": {
        "start": "10:00"
      },
      "KE0082": {
        "end": "17:50",
        "endOffset": 1
      },
      "KE0086": {
        "end": "05:10",
        "endOffset": 1
      },
      "KE0092": {
        "end": "17:25",
        "endOffset": 1
      },
      "KE0093": {
        "start": "10:25"
      },
      "KE0094": {
        "end": "17:40",
        "endOffset": 1
      },
      "KE0101": {
        "start": "10:25"
      },
      "KE0102": {
        "end": "16:15"
      },
      "KE0115": {
        "start": "09:25"
      },
      "KE0116": {
        "end": "15:25"
      },
      "KE0125": {
        "start": "10:20"
      },
      "KE0126": {
        "end": "18:05"
      },
      "KE0127": {
        "start": "08:10"
      },
      "KE0134": {
        "end": "14:20"
      },
      "KE0141": {
        "start": "09:10"
      },
      "KE0142": {
        "end": "16:40"
      },
      "KE0155": {
        "start": "13:25"
      },
      "KE0156": {
        "end": "19:45"
      },
      "KE0164": {
        "end": "04:05"
      },
      "KE0165": {
        "start": "08:40"
      },
      "KE0166": {
        "end": "16:00"
      },
      "KE0213": {
        "start": "02:20"
      },
      "KE0214": {
        "end": "08:25",
        "endOffset": 1
      },
      "KE0224": {
        "end": "22:15"
      },
      "KE0234": {
        "end": "09:45",
        "endOffset": 1
      },
      "KE0250": {
        "end": "16:35",
        "endOffset": 1
      },
      "KE0257": {
        "start": "22:05"
      },
      "KE0278": {
        "end": "18:50",
        "endOffset": 1
      },
      "KE0283": {
        "start": "04:00"
      },
      "KE0313": {
        "start": "22:25"
      },
      "KE0314": {
        "end": "07:40"
      },
      "KE0317": {
        "start": "01:45"
      },
      "KE0319": {
        "start": "00:05"
      },
      "KE0320": {
        "end": "09:20"
      },
      "KE0321": {
        "start": "00:35"
      },
      "KE0322": {
        "end": "09:55"
      },
      "KE0343": {
        "start": "22:40"
      },
      "KE0344": {
        "end": "16:35"
      },
      "KE0349": {
        "start": "22:20"
      },
      "KE0350": {
        "end": "18:15"
      },
      "KE0361": {
        "start": "23:30"
      },
      "KE0362": {
        "end": "10:20"
      },
      "KE0402": {
        "end": "17:35"
      },
      "KE0408": {
        "end": "17:35"
      },
      "KE0411": {
        "start": "18:00"
      },
      "KE0415": {
        "start": "10:05"
      },
      "KE0416": {
        "end": "21:00"
      },
      "KE0417": {
        "start": "18:25"
      },
      "KE0418": {
        "end": "05:40"
      },
      "KE0427": {
        "start": "16:20"
      },
      "KE0428": {
        "end": "07:00"
      },
      "KE0431": {
        "start": "16:10"
      },
      "KE0432": {
        "end": "07:55"
      },
      "KE0433": {
        "start": "18:00"
      },
      "KE0434": {
        "end": "09:25"
      },
      "KE0441": {
        "start": "08:00"
      },
      "KE0442": {
        "end": "18:35"
      },
      "KE0458": {
        "end": "22:30"
      },
      "KE0468": {
        "end": "07:25"
      },
      "KE0471": {
        "start": "09:05"
      },
      "KE0472": {
        "end": "21:25"
      },
      "KE0476": {
        "end": "07:00"
      },
      "KE0480": {
        "end": "14:55"
      },
      "KE0486": {
        "end": "07:50"
      },
      "KE0497": {
        "start": "12:50"
      },
      "KE0504": {
        "end": "20:55",
        "endOffset": 1
      },
      "KE0509": {
        "start": "11:05"
      },
      "KE0538": {
        "end": "15:15",
        "endOffset": 1
      },
      "KE0551": {
        "start": "13:35"
      },
      "KE0552": {
        "end": "21:20"
      },
      "KE0602": {
        "end": "06:30"
      },
      "KE0619": {
        "start": "22:35"
      },
      "KE0620": {
        "end": "08:20"
      },
      "KE0622": {
        "end": "17:25"
      },
      "KE0624": {
        "end": "04:35"
      },
      "KE0626": {
        "end": "06:15"
      },
      "KE0644": {
        "end": "05:35"
      },
      "KE0646": {
        "end": "08:50"
      },
      "KE0647": {
        "start": "23:35"
      },
      "KE0648": {
        "end": "15:00"
      },
      "KE0651": {
        "start": "18:05"
      },
      "KE0652": {
        "end": "06:55"
      },
      "KE0656": {
        "end": "10:15"
      },
      "KE0658": {
        "end": "05:05"
      },
      "KE0660": {
        "end": "17:20"
      },
      "KE0677": {
        "start": "17:50"
      },
      "KE0678": {
        "end": "07:35"
      },
      "KE0690": {
        "end": "07:00"
      },
      "KE0703": {
        "start": "10:10"
      },
      "KE0704": {
        "end": "16:30"
      },
      "KE0706": {
        "end": "11:45"
      },
      "KE0707": {
        "start": "14:45"
      },
      "KE0708": {
        "end": "21:30"
      },
      "KE0711": {
        "start": "13:00"
      },
      "KE0712": {
        "end": "20:00"
      },
      "KE0713": {
        "start": "17:15"
      },
      "KE0714": {
        "end": "23:25"
      },
      "KE0722": {
        "end": "10:55"
      },
      "KE0723": {
        "start": "09:35"
      },
      "KE0724": {
        "end": "14:25"
      },
      "KE0725": {
        "start": "15:05"
      },
      "KE0726": {
        "end": "20:05"
      },
      "KE0738": {
        "end": "04:05"
      },
      "KE0742": {
        "end": "15:40"
      },
      "KE0743": {
        "start": "18:50"
      },
      "KE0744": {
        "end": "11:20"
      },
      "KE0766": {
        "end": "17:55"
      },
      "KE0769": {
        "start": "12:35"
      },
      "KE0770": {
        "end": "19:30"
      },
      "KE0782": {
        "end": "22:35"
      },
      "KE0787": {
        "start": "08:00"
      },
      "KE0788": {
        "end": "12:00"
      },
      "KE0791": {
        "start": "11:05"
      },
      "KE0792": {
        "end": "16:30"
      },
      "KE0795": {
        "start": "16:25"
      },
      "KE0796": {
        "end": "21:35"
      },
      "KE0804": {
        "end": "17:35"
      },
      "KE0805": {
        "start": "09:10"
      },
      "KE0806": {
        "end": "14:20"
      },
      "KE0831": {
        "start": "08:05"
      },
      "KE0832": {
        "end": "13:15"
      },
      "KE0833": {
        "start": "14:35"
      },
      "KE0834": {
        "end": "19:50"
      },
      "KE0835": {
        "start": "08:40"
      },
      "KE0841": {
        "start": "07:50"
      },
      "KE0842": {
        "end": "12:25"
      },
      "KE0843": {
        "start": "13:05"
      },
      "KE0844": {
        "end": "17:30"
      },
      "KE0851": {
        "start": "08:15"
      },
      "KE0852": {
        "end": "21:40"
      },
      "KE0855": {
        "start": "10:40"
      },
      "KE0856": {
        "end": "16:30"
      },
      "KE0864": {
        "end": "04:40"
      },
      "KE0867": {
        "start": "08:50"
      },
      "KE0868": {
        "end": "17:15"
      },
      "KE0873": {
        "start": "13:00"
      },
      "KE0874": {
        "end": "16:55"
      },
      "KE0881": {
        "start": "08:25"
      },
      "KE0882": {
        "end": "14:20"
      },
      "KE0887": {
        "start": "11:10"
      },
      "KE0888": {
        "end": "16:45"
      },
      "KE0892": {
        "end": "11:55"
      },
      "KE0901": {
        "start": "12:05"
      },
      "KE0902": {
        "end": "15:50",
        "endOffset": 1
      },
      "KE0907": {
        "start": "10:55"
      },
      "KE0908": {
        "end": "16:15",
        "endOffset": 1
      },
      "KE0913": {
        "start": "10:13"
      },
      "KE0918": {
        "end": "14:10",
        "endOffset": 1
      },
      "KE0921": {
        "start": "12:45"
      },
      "KE0926": {
        "end": "16:40",
        "endOffset": 1
      },
      "KE0927": {
        "start": "15:25"
      },
      "KE0931": {
        "start": "14:05"
      },
      "KE0932": {
        "end": "15:55",
        "endOffset": 1
      },
      "KE0945": {
        "start": "10:50"
      },
      "KE0956": {
        "end": "13:25",
        "endOffset": 1
      },
      "KE0964": {
        "end": "13:40",
        "endOffset": 1
      },
      "KE0970": {
        "end": "13:20",
        "endOffset": 1
      },
      "KE1007": {
        "start": "06:35",
        "end": "07:50"
      },
      "KE1017": {
        "start": "07:05",
        "end": "08:20"
      },
      "KE1019": {
        "start": "07:10",
        "end": "08:25"
      },
      "KE1023": {
        "start": "07:20"
      },
      "KE1045": {
        "start": "08:20",
        "end": "09:35"
      },
      "KE1073": {
        "start": "10:10",
        "end": "11:25"
      },
      "KE1075": {
        "start": "10:40",
        "end": "11:55"
      },
      "KE1079": {
        "start": "10:35",
        "end": "11:50"
      },
      "KE1081": {
        "start": "11:10",
        "end": "12:25"
      },
      "KE1107": {
        "start": "12:45",
        "end": "14:00"
      },
      "KE1113": {
        "start": "13:15",
        "end": "14:30"
      },
      "KE1118": {
        "end": "08:15"
      },
      "KE1121": {
        "start": "13:25"
      },
      "KE1136": {
        "start": "08:35",
        "end": "09:50"
      },
      "KE1141": {
        "start": "14:00",
        "end": "15:15"
      },
      "KE1143": {
        "start": "14:55",
        "end": "16:10"
      },
      "KE1150": {
        "start": "09:00",
        "end": "10:15"
      },
      "KE1165": {
        "start": "16:35",
        "end": "17:50"
      },
      "KE1174": {
        "start": "10:25",
        "end": "11:40"
      },
      "KE1177": {
        "start": "17:30",
        "end": "18:45"
      },
      "KE1178": {
        "end": "12:05"
      },
      "KE1185": {
        "start": "17:45"
      },
      "KE1188": {
        "start": "11:20",
        "end": "12:35"
      },
      "KE1195": {
        "start": "18:15"
      },
      "KE1205": {
        "start": "18:45"
      },
      "KE1206": {
        "start": "12:05",
        "end": "13:20"
      },
      "KE1214": {
        "start": "13:05",
        "end": "14:20"
      },
      "KE1238": {
        "start": "14:40",
        "end": "15:55"
      },
      "KE1244": {
        "start": "15:20",
        "end": "16:35"
      },
      "KE1246": {
        "start": "15:35",
        "end": "16:50"
      },
      "KE1264": {
        "start": "16:05",
        "end": "17:20"
      },
      "KE1268": {
        "start": "16:50",
        "end": "18:05"
      },
      "KE1272": {
        "start": "17:00",
        "end": "18:15"
      },
      "KE1294": {
        "start": "18:15",
        "end": "19:30"
      },
      "KE1401": {
        "start": "06:35",
        "end": "07:45"
      },
      "KE1402": {
        "start": "07:00",
        "end": "08:10"
      },
      "KE1403": {
        "end": "09:30"
      },
      "KE1404": {
        "start": "08:00",
        "end": "09:10"
      },
      "KE1405": {
        "start": "17:10",
        "end": "18:20"
      },
      "KE1406": {
        "start": "08:45",
        "end": "09:55"
      },
      "KE1407": {
        "end": "19:35"
      },
      "KE1408": {
        "start": "10:40",
        "end": "11:50"
      },
      "KE1410": {
        "start": "16:30",
        "end": "17:40"
      },
      "KE1432": {
        "end": "09:00"
      },
      "KE1505": {
        "start": "07:00",
        "end": "08:00"
      },
      "KE1512": {
        "start": "08:45",
        "end": "09:45"
      },
      "KE1515": {
        "start": "09:55",
        "end": "10:55"
      },
      "KE1517": {
        "start": "10:25",
        "end": "11:25"
      },
      "KE1538": {
        "start": "15:00",
        "end": "15:55"
      },
      "KE1543": {
        "start": "16:40",
        "end": "17:40"
      },
      "KE1550": {
        "start": "18:20",
        "end": "19:20"
      },
      "KE1558": {
        "end": "21:30"
      },
      "KE1562": {
        "end": "22:05"
      },
      "KE1569": {
        "end": "12:10"
      },
      "KE1570": {
        "start": "09:15"
      },
      "KE1576": {
        "start": "16:35"
      },
      "KE1585": {
        "end": "16:25"
      },
      "KE1586": {
        "start": "13:20"
      },
      "KE1595": {
        "end": "16:10"
      },
      "KE1596": {
        "start": "13:10"
      },
      "KE1607": {
        "end": "11:35"
      },
      "KE1608": {
        "start": "09:10"
      },
      "KE1610": {
        "start": "11:35"
      },
      "KE1611": {
        "end": "14:05"
      },
      "KE1612": {
        "start": "13:05"
      },
      "KE1613": {
        "end": "15:30"
      },
      "KE1619": {
        "end": "18:30"
      },
      "KE1620": {
        "start": "16:05"
      },
      "KE1635": {
        "end": "14:10"
      },
      "KE1636": {
        "start": "11:40"
      },
      "KE1704": {
        "start": "07:20"
      },
      "KE1712": {
        "start": "12:15"
      },
      "KE1717": {
        "end": "15:15"
      },
      "KE1722": {
        "start": "14:50"
      },
      "KE1725": {
        "end": "18:30"
      },
      "KE1766": {
        "start": "18:25"
      },
      "KE1803": {
        "start": "07:00",
        "end": "08:05"
      },
      "KE1806": {
        "start": "08:45",
        "end": "09:50"
      },
      "KE1807": {
        "start": "08:05",
        "end": "09:10"
      },
      "KE1811": {
        "start": "10:30",
        "end": "11:35"
      },
      "KE1814": {
        "end": "13:20"
      },
      "KE1819": {
        "start": "14:00",
        "end": "15:05"
      },
      "KE1822": {
        "start": "15:50",
        "end": "16:55"
      },
      "KE1827": {
        "start": "17:35",
        "end": "18:40"
      },
      "KE1843": {
        "start": "07:20"
      },
      "KE1844": {
        "end": "10:00"
      },
      "KE1847": {
        "start": "18:55"
      },
      "KE2002": {
        "end": "17:05"
      },
      "KE2005": {
        "start": "13:25"
      },
      "KE2006": {
        "end": "22:45"
      },
      "KE2015": {
        "start": "10:10"
      },
      "KE2016": {
        "end": "19:00"
      },
      "KE2021": {
        "start": "10:30"
      },
      "KE2022": {
        "end": "16:50"
      },
      "KE2027": {
        "start": "16:10"
      },
      "KE2028": {
        "end": "22:35"
      },
      "KE2041": {
        "start": "08:35"
      },
      "KE2042": {
        "end": "17:10"
      },
      "KE2051": {
        "start": "09:05"
      },
      "KE2052": {
        "end": "15:00"
      },
      "KE2057": {
        "start": "16:00"
      },
      "KE2061": {
        "start": "22:20"
      },
      "KE2062": {
        "end": "06:30"
      },
      "KE2065": {
        "start": "15:35"
      },
      "KE2066": {
        "end": "14:25"
      },
      "KE2071": {
        "start": "08:35"
      },
      "KE2072": {
        "end": "14:00"
      },
      "KE2081": {
        "start": "11:00"
      },
      "KE2082": {
        "end": "16:10"
      },
      "KE2085": {
        "start": "09:00"
      },
      "KE2086": {
        "end": "15:30"
      },
      "KE2101": {
        "start": "09:00"
      },
      "KE2102": {
        "end": "14:55"
      },
      "KE2103": {
        "start": "16:20"
      },
      "KE2105": {
        "start": "18:40"
      },
      "KE2106": {
        "end": "11:45"
      },
      "KE2117": {
        "start": "09:15"
      },
      "KE2118": {
        "end": "14:20"
      },
      "KE2119": {
        "start": "16:30"
      },
      "KE2125": {
        "start": "12:55"
      },
      "KE2126": {
        "end": "19:05"
      },
      "KE2129": {
        "start": "09:20"
      },
      "KE2130": {
        "end": "14:55"
      },
      "KE2131": {
        "start": "16:00"
      },
      "KE2132": {
        "end": "21:35"
      },
      "KE2133": {
        "start": "17:30"
      },
      "KE2134": {
        "end": "21:30"
      },
      "KE2147": {
        "start": "09:20"
      },
      "KE2148": {
        "end": "15:10"
      },
      "KE2155": {
        "start": "17:05"
      },
      "KE2156": {
        "end": "21:20"
      },
      "KE2171": {
        "start": "09:05"
      },
      "KE2172": {
        "end": "13:40"
      },
      "KE2173": {
        "start": "15:50"
      },
      "KE2185": {
        "start": "10:30"
      },
      "KE2186": {
        "end": "14:55"
      },
      "KE2190": {
        "end": "12:10"
      },
      "KE2193": {
        "start": "09:05"
      },
      "KE2194": {
        "end": "15:30"
      },
      "KE2197": {
        "start": "17:10"
      },
      "KE8053": {
        "start": "22:35"
      },
      "KE8054": {
        "end": "19:10"
      },
      "KE8204": {
        "end": "00:45",
        "endOffset": 1
      },
      "KE8207": {
        "start": "16:10"
      },
      "KE8315": {
        "start": "01:40"
      },
      "KE8316": {
        "end": "08:10"
      }
    }
  };

  return { SEED: SEED, AIRPORTS: AIRPORTS, TIMES: TIMES };
});
