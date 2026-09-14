/**
 * 공항(IATA) -> 나라. 편명 옆에 출발하는 나라 국기를 붙이는 데 쓴다.
 * 국기는 나라 코드 두 글자를 리저널 인디케이터로 바꿔 만든다(이미지 파일 없음).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./routedata.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.airports = factory(root.CrewCal.routedata);
  }
})(typeof self !== 'undefined' ? self : this, function (routedata) {
  'use strict';

  // 나라별 공항 목록. 대한항공·아시아나 취항지와 자주 쓰는 공항 위주.
  var BY_COUNTRY = {
    KR: 'ICN GMP PUS CJU TAE KWJ RSU USN YNY MWX HIN KUV WJU KPO CJJ',
    JP: 'NRT HND KIX ITM UKB NGO CTS FUK OKA KOJ KMJ HIJ TAK KMI OIT AXT SDJ AOJ KMQ TOY FSZ MYJ NGS HKD ISG MMY TKS KCZ IZO YGJ ASJ OKJ KIJ',
    CN: 'PEK PKX PVG SHA CAN SZX CTU TFU CKG XIY HGH NKG WUH CSX CGO TNA TAO YNT WEH DLC SHE HRB CGQ TSN KMG NNG HAK SYX XMN FOC JJN NGB HFE WNZ TYN SJW HET INC LHW XNN URC KWE KWL SWA ZUH YNJ MDG DYG',
    HK: 'HKG', MO: 'MFM', TW: 'TPE TSA KHH RMQ', MN: 'ULN UBN',
    TH: 'BKK DMK HKT CNX USM KBV CEI', VN: 'SGN HAN DAD CXR PQC HPH VCA',
    PH: 'MNL CEB CRK KLO PPS TAG DVO', SG: 'SIN', MY: 'KUL PEN BKI LGK JHB KCH',
    ID: 'CGK DPS SUB JOG UPG BTH SRG', MM: 'RGN MDL', KH: 'PNH REP', LA: 'VTE LPQ',
    BN: 'BWN', TL: 'DIL',
    IN: 'DEL BOM MAA BLR HYD CCU COK AMD', LK: 'CMB', NP: 'KTM', BD: 'DAC',
    MV: 'MLE', PK: 'ISB LHE KHI', BT: 'PBH',
    AE: 'DXB AUH SHJ', QA: 'DOH', SA: 'RUH JED DMM', KW: 'KWI', BH: 'BAH',
    OM: 'MCT', IL: 'TLV', JO: 'AMM', IQ: 'BGW EBL', IR: 'IKA',
    TR: 'IST SAW ESB AYT ADB', CY: 'LCA', GE: 'TBS', AM: 'EVN', AZ: 'GYD',
    UZ: 'TAS SKD', KZ: 'ALA NQZ TSE', KG: 'FRU',
    RU: 'SVO DME VKO LED VVO KHV UUS IKT OVB KZN',
    GB: 'LHR LGW LCY STN MAN EDI GLA BHX', IE: 'DUB',
    FR: 'CDG ORY NCE LYS MRS TLS BOD', DE: 'FRA MUC BER DUS HAM CGN STR HAJ NUE LEJ',
    NL: 'AMS EIN', BE: 'BRU CRL', LU: 'LUX', CH: 'ZRH GVA BSL', AT: 'VIE SZG',
    IT: 'FCO MXP LIN VCE NAP BLQ FLR PSA CTA', ES: 'MAD BCN AGP PMI VLC SVQ',
    PT: 'LIS OPO FNC', GR: 'ATH SKG JTR HER', MT: 'MLA',
    CZ: 'PRG', HU: 'BUD', PL: 'WAW KRK GDN', SK: 'BTS', SI: 'LJU',
    HR: 'ZAG DBV SPU', RS: 'BEG', RO: 'OTP CLJ', BG: 'SOF VAR',
    SE: 'ARN GOT', DK: 'CPH BLL', NO: 'OSL BGO TRD', FI: 'HEL RVN', IS: 'KEF',
    EE: 'TLL', LV: 'RIX', LT: 'VNO', UA: 'KBP IEV', BY: 'MSQ',
    US: 'JFK EWR LGA BOS IAD DCA BWI PHL PIT CLT ATL MCO MIA FLL TPA MSY IAH DFW AUS DEN SLC PHX LAS LAX SFO SJC SAN SMF SEA PDX ORD DTW MSP STL MCI CLE CVG IND BNA RDU MEM OAK ANC HNL OGG KOA LIH SNA ONT BUR RSW JAX ABQ OMA BOI TUS',
    CA: 'YYZ YVR YUL YYC YEG YOW YHZ YWG', MX: 'MEX CUN GDL MTY SJD PVR',
    GU: 'GUM', MP: 'SPN', PW: 'ROR',
    BR: 'GRU GIG BSB CNF', AR: 'EZE AEP', CL: 'SCL', PE: 'LIM', CO: 'BOG CTG',
    EC: 'UIO GYE', PA: 'PTY', CR: 'SJO', DO: 'PUJ SDQ', CU: 'HAV',
    AU: 'SYD MEL BNE PER ADL OOL CNS DRW', NZ: 'AKL CHC ZQN WLG',
    FJ: 'NAN', PF: 'PPT', NC: 'NOU', WS: 'APW', PG: 'POM',
    EG: 'CAI HRG SSH', MA: 'CMN RAK', TN: 'TUN', ZA: 'JNB CPT DUR',
    KE: 'NBO MBA', ET: 'ADD', NG: 'LOS ABV', TZ: 'JRO DAR', MU: 'MRU', SC: 'SEZ'
  };

  /**
   * 나라별 기준 시간대(IANA). 브라우저가 이 이름으로 서머타임까지 알아서 맞춘다.
   * 한 나라 안에서 시간대가 갈리는 곳은 아래 TZ_BY_AIRPORT 로 덮어쓴다.
   */
  var TZ_BY_COUNTRY = {
    KR: 'Asia/Seoul', JP: 'Asia/Tokyo', CN: 'Asia/Shanghai', HK: 'Asia/Hong_Kong',
    MO: 'Asia/Macau', TW: 'Asia/Taipei', MN: 'Asia/Ulaanbaatar', TH: 'Asia/Bangkok',
    VN: 'Asia/Ho_Chi_Minh', PH: 'Asia/Manila', SG: 'Asia/Singapore', MY: 'Asia/Kuala_Lumpur',
    ID: 'Asia/Jakarta', MM: 'Asia/Yangon', KH: 'Asia/Phnom_Penh', LA: 'Asia/Vientiane',
    BN: 'Asia/Brunei', TL: 'Asia/Dili', IN: 'Asia/Kolkata', LK: 'Asia/Colombo',
    NP: 'Asia/Kathmandu', BD: 'Asia/Dhaka', MV: 'Indian/Maldives', PK: 'Asia/Karachi',
    BT: 'Asia/Thimphu', AE: 'Asia/Dubai', QA: 'Asia/Qatar', SA: 'Asia/Riyadh',
    KW: 'Asia/Kuwait', BH: 'Asia/Bahrain', OM: 'Asia/Muscat', IL: 'Asia/Jerusalem',
    JO: 'Asia/Amman', IQ: 'Asia/Baghdad', IR: 'Asia/Tehran', TR: 'Europe/Istanbul',
    CY: 'Asia/Nicosia', GE: 'Asia/Tbilisi', AM: 'Asia/Yerevan', AZ: 'Asia/Baku',
    UZ: 'Asia/Tashkent', KZ: 'Asia/Almaty', KG: 'Asia/Bishkek', RU: 'Europe/Moscow',
    GB: 'Europe/London', IE: 'Europe/Dublin', FR: 'Europe/Paris', DE: 'Europe/Berlin',
    NL: 'Europe/Amsterdam', BE: 'Europe/Brussels', LU: 'Europe/Luxembourg',
    CH: 'Europe/Zurich', AT: 'Europe/Vienna', IT: 'Europe/Rome', ES: 'Europe/Madrid',
    PT: 'Europe/Lisbon', GR: 'Europe/Athens', MT: 'Europe/Malta', CZ: 'Europe/Prague',
    HU: 'Europe/Budapest', PL: 'Europe/Warsaw', SK: 'Europe/Bratislava',
    SI: 'Europe/Ljubljana', HR: 'Europe/Zagreb', RS: 'Europe/Belgrade',
    RO: 'Europe/Bucharest', BG: 'Europe/Sofia', SE: 'Europe/Stockholm',
    DK: 'Europe/Copenhagen', NO: 'Europe/Oslo', FI: 'Europe/Helsinki',
    IS: 'Atlantic/Reykjavik', EE: 'Europe/Tallinn', LV: 'Europe/Riga',
    LT: 'Europe/Vilnius', UA: 'Europe/Kyiv', BY: 'Europe/Minsk',
    US: 'America/New_York', CA: 'America/Toronto', MX: 'America/Mexico_City',
    GU: 'Pacific/Guam', MP: 'Pacific/Saipan', PW: 'Pacific/Palau',
    BR: 'America/Sao_Paulo', AR: 'America/Argentina/Buenos_Aires', CL: 'America/Santiago',
    PE: 'America/Lima', CO: 'America/Bogota', EC: 'America/Guayaquil',
    PA: 'America/Panama', CR: 'America/Costa_Rica', DO: 'America/Santo_Domingo',
    CU: 'America/Havana', AU: 'Australia/Sydney', NZ: 'Pacific/Auckland',
    FJ: 'Pacific/Fiji', PF: 'Pacific/Tahiti', NC: 'Pacific/Noumea', WS: 'Pacific/Apia',
    PG: 'Pacific/Port_Moresby', EG: 'Africa/Cairo', MA: 'Africa/Casablanca',
    TN: 'Africa/Tunis', ZA: 'Africa/Johannesburg', KE: 'Africa/Nairobi',
    ET: 'Africa/Addis_Ababa', NG: 'Africa/Lagos', TZ: 'Africa/Dar_es_Salaam',
    MU: 'Indian/Mauritius', SC: 'Indian/Mahe'
  };

  // 한 나라 안에서 시간대가 갈리는 공항들. 미국·캐나다·러시아처럼 넓은 나라가 대부분이다.
  var TZ_BY_AIRPORT = {
    ORD: 'America/Chicago', DFW: 'America/Chicago', IAH: 'America/Chicago',
    AUS: 'America/Chicago', MSY: 'America/Chicago', MSP: 'America/Chicago',
    STL: 'America/Chicago', MCI: 'America/Chicago', BNA: 'America/Chicago',
    MEM: 'America/Chicago', OMA: 'America/Chicago',
    DEN: 'America/Denver', SLC: 'America/Denver', ABQ: 'America/Denver',
    BOI: 'America/Boise', PHX: 'America/Phoenix', TUS: 'America/Phoenix',
    LAX: 'America/Los_Angeles', SFO: 'America/Los_Angeles', SJC: 'America/Los_Angeles',
    SAN: 'America/Los_Angeles', SMF: 'America/Los_Angeles', SEA: 'America/Los_Angeles',
    PDX: 'America/Los_Angeles', LAS: 'America/Los_Angeles', OAK: 'America/Los_Angeles',
    SNA: 'America/Los_Angeles', ONT: 'America/Los_Angeles', BUR: 'America/Los_Angeles',
    ANC: 'America/Anchorage',
    HNL: 'Pacific/Honolulu', OGG: 'Pacific/Honolulu', KOA: 'Pacific/Honolulu',
    LIH: 'Pacific/Honolulu',
    YVR: 'America/Vancouver', YYC: 'America/Edmonton', YEG: 'America/Edmonton',
    YWG: 'America/Winnipeg', YHZ: 'America/Halifax',
    LED: 'Europe/Moscow', KZN: 'Europe/Moscow', OVB: 'Asia/Novosibirsk',
    IKT: 'Asia/Irkutsk', VVO: 'Asia/Vladivostok', KHV: 'Asia/Vladivostok',
    UUS: 'Asia/Sakhalin',
    DPS: 'Asia/Makassar', UPG: 'Asia/Makassar',
    PER: 'Australia/Perth', DRW: 'Australia/Darwin', ADL: 'Australia/Adelaide',
    BNE: 'Australia/Brisbane', CNS: 'Australia/Brisbane', OOL: 'Australia/Brisbane',
    CUN: 'America/Cancun', SJD: 'America/Mazatlan', PVR: 'America/Mazatlan',
    MTY: 'America/Monterrey', GDL: 'America/Mexico_City',
    FNC: 'Atlantic/Madeira', NQZ: 'Asia/Almaty', TSE: 'Asia/Almaty'
  };

  var COUNTRY_NAMES = {
    KR: '대한민국', JP: '일본', CN: '중국', HK: '홍콩', MO: '마카오', TW: '대만', MN: '몽골',
    TH: '태국', VN: '베트남', PH: '필리핀', SG: '싱가포르', MY: '말레이시아', ID: '인도네시아',
    MM: '미얀마', KH: '캄보디아', LA: '라오스', BN: '브루나이', TL: '동티모르',
    IN: '인도', LK: '스리랑카', NP: '네팔', BD: '방글라데시', MV: '몰디브', PK: '파키스탄', BT: '부탄',
    AE: '아랍에미리트', QA: '카타르', SA: '사우디아라비아', KW: '쿠웨이트', BH: '바레인',
    OM: '오만', IL: '이스라엘', JO: '요르단', IQ: '이라크', IR: '이란',
    TR: '튀르키예', CY: '키프로스', GE: '조지아', AM: '아르메니아', AZ: '아제르바이잔',
    UZ: '우즈베키스탄', KZ: '카자흐스탄', KG: '키르기스스탄', RU: '러시아',
    GB: '영국', IE: '아일랜드', FR: '프랑스', DE: '독일', NL: '네덜란드', BE: '벨기에',
    LU: '룩셈부르크', CH: '스위스', AT: '오스트리아', IT: '이탈리아', ES: '스페인',
    PT: '포르투갈', GR: '그리스', MT: '몰타', CZ: '체코', HU: '헝가리', PL: '폴란드',
    SK: '슬로바키아', SI: '슬로베니아', HR: '크로아티아', RS: '세르비아', RO: '루마니아',
    BG: '불가리아', SE: '스웨덴', DK: '덴마크', NO: '노르웨이', FI: '핀란드', IS: '아이슬란드',
    EE: '에스토니아', LV: '라트비아', LT: '리투아니아', UA: '우크라이나', BY: '벨라루스',
    US: '미국', CA: '캐나다', MX: '멕시코', GU: '괌', MP: '북마리아나제도', PW: '팔라우',
    BR: '브라질', AR: '아르헨티나', CL: '칠레', PE: '페루', CO: '콜롬비아', EC: '에콰도르',
    PA: '파나마', CR: '코스타리카', DO: '도미니카공화국', CU: '쿠바',
    AU: '호주', NZ: '뉴질랜드', FJ: '피지', PF: '프랑스령 폴리네시아', NC: '뉴칼레도니아',
    WS: '사모아', PG: '파푸아뉴기니',
    EG: '이집트', MA: '모로코', TN: '튀니지', ZA: '남아프리카공화국', KE: '케냐',
    ET: '에티오피아', NG: '나이지리아', TZ: '탄자니아', MU: '모리셔스', SC: '세이셸'
  };


  // 공항 -> 도시 이름. 없는 공항은 공항 코드를 그대로 쓴다.
  var CITY_NAMES = {
    ICN: '인천', GMP: '김포', PUS: '부산', CJU: '제주', TAE: '대구', KWJ: '광주',
    RSU: '여수', USN: '울산', YNY: '양양', MWX: '무안', HIN: '사천', KUV: '군산',
    WJU: '원주', KPO: '포항', CJJ: '청주',

    NRT: '도쿄', HND: '도쿄', KIX: '오사카', ITM: '오사카', UKB: '고베', NGO: '나고야',
    CTS: '삿포로', FUK: '후쿠오카', OKA: '오키나와', KOJ: '가고시마', KMJ: '구마모토',
    HIJ: '히로시마', TAK: '다카마쓰', KMI: '미야자키', OIT: '오이타', AXT: '아키타',
    SDJ: '센다이', AOJ: '아오모리', KMQ: '고마쓰', TOY: '도야마', FSZ: '시즈오카',
    MYJ: '마쓰야마', NGS: '나가사키', HKD: '하코다테', ISG: '이시가키', MMY: '미야코',
    TKS: '도쿠시마', KCZ: '고치', IZO: '이즈모', YGJ: '요나고', ASJ: '아마미', OKJ: '오카야마',
    KIJ: '니가타',

    PEK: '베이징', PKX: '베이징', PVG: '상하이', SHA: '상하이', CAN: '광저우',
    SZX: '선전', CTU: '청두', TFU: '청두', CKG: '충칭', XIY: '시안', HGH: '항저우',
    NKG: '난징', WUH: '우한', CSX: '창사', CGO: '정저우', TNA: '지난', TAO: '칭다오',
    YNT: '옌타이', WEH: '웨이하이', DLC: '다롄', SHE: '선양', HRB: '하얼빈',
    CGQ: '창춘', TSN: '톈진', KMG: '쿤밍', NNG: '난닝', HAK: '하이커우', SYX: '싼야',
    XMN: '샤먼', FOC: '푸저우', JJN: '취안저우', NGB: '닝보', HFE: '허페이',
    DYG: '장자제', WNZ: '원저우', TYN: '타이위안', SJW: '스자좡', HET: '후허하오터', INC: '인촨',
    LHW: '란저우', XNN: '시닝', URC: '우루무치', KWE: '구이양', KWL: '구이린',
    SWA: '산터우', ZUH: '주하이', YNJ: '옌지', MDG: '무단장',

    HKG: '홍콩', MFM: '마카오', TPE: '타이베이', TSA: '타이베이', KHH: '가오슝',
    RMQ: '타이중', ULN: '울란바토르', UBN: '울란바토르',

    BKK: '방콕', DMK: '방콕', HKT: '푸껫', CNX: '치앙마이', USM: '사무이',
    KBV: '끄라비', CEI: '치앙라이',
    SGN: '호치민', HAN: '하노이', DAD: '다낭', CXR: '나트랑', PQC: '푸꾸옥',
    HPH: '하이퐁', VCA: '껀터',
    MNL: '마닐라', CEB: '세부', CRK: '클락', KLO: '칼리보', PPS: '팔라완',
    TAG: '보홀', DVO: '다바오',
    SIN: '싱가포르', KUL: '쿠알라룸푸르', PEN: '페낭', BKI: '코타키나발루',
    LGK: '랑카위', JHB: '조호르바루', KCH: '쿠칭',
    CGK: '자카르타', DPS: '발리', SUB: '수라바야', JOG: '족자카르타',
    UPG: '마카사르', BTH: '바탐', SRG: '스마랑',
    RGN: '양곤', MDL: '만달레이', PNH: '프놈펜', REP: '씨엠립',
    VTE: '비엔티안', LPQ: '루앙프라방', BWN: '반다르스리브가완', DIL: '딜리',

    DEL: '델리', BOM: '뭄바이', MAA: '첸나이', BLR: '벵갈루루', HYD: '하이데라바드',
    CCU: '콜카타', COK: '코치', AMD: '아마다바드',
    CMB: '콜롬보', KTM: '카트만두', DAC: '다카', MLE: '몰디브',
    ISB: '이슬라마바드', LHE: '라호르', KHI: '카라치', PBH: '파로',

    DXB: '두바이', AUH: '아부다비', SHJ: '샤르자', DOH: '도하', RUH: '리야드',
    JED: '제다', DMM: '담맘', KWI: '쿠웨이트', BAH: '바레인', MCT: '무스카트',
    TLV: '텔아비브', AMM: '암만', BGW: '바그다드', EBL: '에르빌', IKA: '테헤란',

    IST: '이스탄불', SAW: '이스탄불', ESB: '앙카라', AYT: '안탈리아', ADB: '이즈미르',
    LCA: '라르나카', TBS: '트빌리시', EVN: '예레반', GYD: '바쿠',
    TAS: '타슈켄트', SKD: '사마르칸트', ALA: '알마티', NQZ: '아스타나',
    TSE: '아스타나', FRU: '비슈케크',
    SVO: '모스크바', DME: '모스크바', VKO: '모스크바', LED: '상트페테르부르크',
    VVO: '블라디보스토크', KHV: '하바롭스크', UUS: '유즈노사할린스크',
    IKT: '이르쿠츠크', OVB: '노보시비르스크', KZN: '카잔',

    LHR: '런던', LGW: '런던', LCY: '런던', STN: '런던', MAN: '맨체스터',
    EDI: '에든버러', GLA: '글래스고', BHX: '버밍엄', DUB: '더블린',
    CDG: '파리', ORY: '파리', NCE: '니스', LYS: '리옹', MRS: '마르세유',
    TLS: '툴루즈', BOD: '보르도',
    FRA: '프랑크푸르트', MUC: '뮌헨', BER: '베를린', DUS: '뒤셀도르프',
    HAM: '함부르크', CGN: '쾰른', STR: '슈투트가르트', HAJ: '하노버',
    NUE: '뉘른베르크', LEJ: '라이프치히',
    AMS: '암스테르담', EIN: '에인트호번', BRU: '브뤼셀', CRL: '브뤼셀',
    LUX: '룩셈부르크', ZRH: '취리히', GVA: '제네바', BSL: '바젤',
    VIE: '빈', SZG: '잘츠부르크',
    FCO: '로마', MXP: '밀라노', LIN: '밀라노', VCE: '베네치아', NAP: '나폴리',
    BLQ: '볼로냐', FLR: '피렌체', PSA: '피사', CTA: '카타니아',
    MAD: '마드리드', BCN: '바르셀로나', AGP: '말라가', PMI: '마요르카',
    VLC: '발렌시아', SVQ: '세비야',
    LIS: '리스본', OPO: '포르투', FNC: '마데이라',
    ATH: '아테네', SKG: '테살로니키', JTR: '산토리니', HER: '크레타', MLA: '몰타',
    PRG: '프라하', BUD: '부다페스트', WAW: '바르샤바', KRK: '크라쿠프',
    GDN: '그단스크', BTS: '브라티슬라바', LJU: '류블랴나',
    ZAG: '자그레브', DBV: '두브로브니크', SPU: '스플리트', BEG: '베오그라드',
    OTP: '부쿠레슈티', CLJ: '클루지', SOF: '소피아', VAR: '바르나',
    ARN: '스톡홀름', GOT: '예테보리', CPH: '코펜하겐', BLL: '빌룬',
    OSL: '오슬로', BGO: '베르겐', TRD: '트론헤임',
    HEL: '헬싱키', RVN: '로바니에미', KEF: '레이캬비크',
    TLL: '탈린', RIX: '리가', VNO: '빌뉴스', KBP: '키이우', IEV: '키이우', MSQ: '민스크',

    JFK: '뉴욕', EWR: '뉴욕', LGA: '뉴욕', BOS: '보스턴', IAD: '워싱턴',
    DCA: '워싱턴', BWI: '볼티모어', PHL: '필라델피아', PIT: '피츠버그',
    CLT: '샬럿', ATL: '애틀랜타', MCO: '올랜도', MIA: '마이애미',
    FLL: '포트로더데일', TPA: '탬파', MSY: '뉴올리언스', IAH: '휴스턴',
    DFW: '댈러스', AUS: '오스틴', DEN: '덴버', SLC: '솔트레이크시티',
    PHX: '피닉스', LAS: '라스베이거스', LAX: '로스앤젤레스', SFO: '샌프란시스코',
    SJC: '새너제이', SAN: '샌디에이고', SMF: '새크라멘토', SEA: '시애틀',
    PDX: '포틀랜드', ORD: '시카고', DTW: '디트로이트', MSP: '미니애폴리스',
    STL: '세인트루이스', MCI: '캔자스시티', CLE: '클리블랜드', CVG: '신시내티',
    IND: '인디애나폴리스', BNA: '내슈빌', RDU: '롤리', MEM: '멤피스',
    OAK: '오클랜드', ANC: '앵커리지', HNL: '호놀룰루', OGG: '마우이',
    KOA: '코나', LIH: '카우아이', SNA: '오렌지카운티', ONT: '온타리오',
    BUR: '버뱅크', RSW: '포트마이어스', JAX: '잭슨빌', ABQ: '앨버커키',
    OMA: '오마하', BOI: '보이시', TUS: '투손',
    YYZ: '토론토', YVR: '밴쿠버', YUL: '몬트리올', YYC: '캘거리',
    YEG: '에드먼턴', YOW: '오타와', YHZ: '핼리팩스', YWG: '위니펙',
    MEX: '멕시코시티', CUN: '칸쿤', GDL: '과달라하라', MTY: '몬테레이',
    SJD: '로스카보스', PVR: '푸에르토바야르타',
    GUM: '괌', SPN: '사이판', ROR: '팔라우',

    GRU: '상파울루', GIG: '리우데자네이루', BSB: '브라질리아', CNF: '벨루오리존치',
    EZE: '부에노스아이레스', AEP: '부에노스아이레스', SCL: '산티아고',
    LIM: '리마', BOG: '보고타', CTG: '카르타헤나', UIO: '키토', GYE: '과야킬',
    PTY: '파나마시티', SJO: '산호세', PUJ: '푼타카나', SDQ: '산토도밍고', HAV: '아바나',

    SYD: '시드니', MEL: '멜버른', BNE: '브리즈번', PER: '퍼스', ADL: '애들레이드',
    OOL: '골드코스트', CNS: '케언스', DRW: '다윈',
    AKL: '오클랜드', CHC: '크라이스트처치', ZQN: '퀸스타운', WLG: '웰링턴',
    NAN: '나디', PPT: '타히티', NOU: '누메아', APW: '아피아', POM: '포트모르즈비',

    CAI: '카이로', HRG: '후르가다', SSH: '샤름엘셰이크', CMN: '카사블랑카',
    RAK: '마라케시', TUN: '튀니스', JNB: '요하네스버그', CPT: '케이프타운',
    DUR: '더반', NBO: '나이로비', MBA: '몸바사', ADD: '아디스아바바',
    LOS: '라고스', ABV: '아부자', JRO: '킬리만자로', DAR: '다르에스살람',
    MRU: '모리셔스', SEZ: '세이셸'
  };

  var AIRPORT_COUNTRY = {};
  Object.keys(BY_COUNTRY).forEach(function (country) {
    BY_COUNTRY[country].split(/\s+/).forEach(function (iata) {
      if (iata) AIRPORT_COUNTRY[iata] = country;
    });
  });

  /*
   * data/airports.json 에 적힌 공항은 그것을 따른다. 공항을 더하거나 도시 이름을
   * 고칠 때는 그 파일만 손보면 된다(node scripts/make-routes.js 가 옮겨 적는다).
   */
  var DATA = (routedata && routedata.AIRPORTS) || {};
  Object.keys(DATA).forEach(function (iata) {
    var row = DATA[iata];
    if (!row) return;
    if (row.country) AIRPORT_COUNTRY[iata] = row.country;
    if (row.city) CITY_NAMES[iata] = row.city;
    // 시드가 적어 준 시간대가 가장 정확하다. 나라·대륙으로 미루어 짚은 것보다 앞선다.
    if (row.tz) TZ_BY_AIRPORT[iata] = row.tz;
  });

  /** 나라 코드 -> 국기 이모지. 'KR' -> 🇰🇷 */
  function flagOfCountry(country) {
    if (!country || !/^[A-Za-z]{2}$/.test(country)) return '';
    var upper = country.toUpperCase();
    return String.fromCodePoint(
      0x1F1E6 + upper.charCodeAt(0) - 65,
      0x1F1E6 + upper.charCodeAt(1) - 65
    );
  }

  function countryOf(iata) {
    if (!iata) return null;
    return AIRPORT_COUNTRY[String(iata).toUpperCase()] || null;
  }

  function countryName(country) {
    return COUNTRY_NAMES[country] || country || '';
  }

  /** 공항 코드 -> 도시 이름. 모르면 공항 코드를 그대로 돌려준다. */
  function cityOf(iata) {
    if (!iata) return '';
    var key = String(iata).toUpperCase();
    return CITY_NAMES[key] || key;
  }

  /**
   * 도시 이름이나 공항 코드로 공항을 찾는다. '가고시마' 도 'KOJ' 도 'koj' 도 KOJ 로.
   * 같은 이름을 쓰는 공항이 여럿이면(도쿄 등) 목록에서 먼저 나온 것을 준다.
   */
  var CODE_BY_CITY = null;

  function findCode(text) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return null;
    var upper = raw.toUpperCase();
    if (AIRPORT_COUNTRY[upper]) return upper;
    if (!CODE_BY_CITY) {
      CODE_BY_CITY = {};
      Object.keys(CITY_NAMES).forEach(function (iata) {
        var name = CITY_NAMES[iata];
        if (name && !CODE_BY_CITY[name]) CODE_BY_CITY[name] = iata;
      });
    }
    return CODE_BY_CITY[raw] || CODE_BY_CITY[raw.replace(/\s+/g, '')] || null;
  }

  /** 공항 하나를 사람이 읽게: { iata, city, country, countryName, flag } */
  function describeAirport(iata) {
    var code = findCode(iata);
    if (!code) return null;
    var country = countryOf(code);
    return {
      iata: code,
      city: cityOf(code),
      country: country,
      countryName: countryName(country),
      flag: flagOf(code)
    };
  }

  /** 공항 코드 -> 국기. 모르는 공항이면 빈 문자열. */
  function flagOf(iata) {
    return flagOfCountry(countryOf(iata));
  }

  /** 'ICN/JFK' 또는 'ICN-JFK' 에서 출발 공항과 도착 공항을 뽑는다. */
  function splitRoute(route) {
    if (!route) return { from: null, to: null };
    var parts = String(route).toUpperCase().split(/[/\-–>]+/).filter(Boolean);
    return {
      from: parts[0] || null,
      to: parts.length > 1 ? parts[parts.length - 1] : null
    };
  }

  /** 일정 하나의 출발 국기. 구간을 모르면 빈 문자열. */
  function departureFlag(entry) {
    if (!entry || !entry.route) return '';
    return flagOf(splitRoute(entry.route).from);
  }

  /**
   * 그 비행이 '어디 가는 편'인지 나타내는 바깥쪽 공항.
   * 한국에서 나가면 도착지, 한국으로 들어오면 출발지. 국내선이면 도착지.
   */
  // 승무원이 드나드는 집. '간 곳' 목록에서 이곳은 빼고 센다.
  var BASES = { ICN: true, GMP: true };

  /**
   * 그 편이 '어디 가는 편' 인지. 한국이 아닌 쪽을 고른다.
   *   한국 출발 -> 도착지    한국 도착 -> 출발지
   *   둘 다 한국(국내선) -> 도착지    둘 다 해외 -> 도착지
   * 한국인지는 공항표의 country 로만 본다. 공항 코드를 손으로 박아 넣지 않는다.
   */
  function outstation(route) {
    var parts = splitRoute(route);
    if (!parts.from) return null;
    if (!parts.to) return parts.from;
    var fromKR = countryOf(parts.from) === 'KR';
    var toKR = countryOf(parts.to) === 'KR';
    if (fromKR && !toKR) return parts.to;
    if (toKR && !fromKR) return parts.from;
    return parts.to;
  }

  /** 일정 하나의 목적지 표기: { flag, city, iata } */
  function tripPlace(entry) {
    if (!entry || !entry.route) return null;
    var iata = outstation(entry.route);
    if (!iata) return null;
    return { iata: iata, city: cityOf(iata), flag: flagOf(iata) };
  }

  /** 툴팁에 쓸 설명. 'ICN 대한민국 → JFK 미국' */
  function describeRoute(route) {
    var parts = splitRoute(route);
    if (!parts.from) return '';
    var out = parts.from;
    var fromCountry = countryOf(parts.from);
    if (fromCountry) out += ' ' + countryName(fromCountry);
    if (parts.to) {
      out += ' → ' + parts.to;
      var toCountry = countryOf(parts.to);
      if (toCountry) out += ' ' + countryName(toCountry);
    }
    return out;
  }

  /**
   * 그 공항이 쓰는 시간대 이름. 브라우저에 넘기면 서머타임까지 알아서 맞춰 준다.
   * 모르는 공항은 null 을 준다. 이때는 화면에 현지 시각을 아예 안 쓴다.
   */
  function zoneOf(iata) {
    if (!iata) return null;
    var code = String(iata).toUpperCase();
    if (TZ_BY_AIRPORT[code]) return TZ_BY_AIRPORT[code];
    var country = countryOf(code);
    return (country && TZ_BY_COUNTRY[country]) || null;
  }

  var KST = 'Asia/Seoul';

  /**
   * 어떤 시간대에서 그 순간의 시계가 UTC 와 몇 밀리초 떨어져 있는지.
   * Intl 이 서머타임까지 알고 있으니 표를 따로 들고 있지 않아도 된다.
   */
  var offsetCache = {};

  function zoneOffset(zone, instant) {
    if (!zone) return null;
    // 같은 시간대·같은 날이면 값이 같다. 한 달치를 그리면 같은 계산이 수백 번 나온다.
    var key = zone + '|' + Math.floor(instant / 3600000);
    if (offsetCache[key] !== undefined) return offsetCache[key];
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(new Date(instant));
    } catch (err) {
      offsetCache[key] = null;
      return null;
    }
    var got = {};
    parts.forEach(function (p) { got[p.type] = p.value; });
    var asUtc = Date.UTC(+got.year, +got.month - 1, +got.day,
      (+got.hour) % 24, +got.minute, +got.second);
    var offset = asUtc - instant;
    offsetCache[key] = offset;
    return offset;
  }

  /** 그 시간대의 벽시계 시각(YYYY-MM-DD HH:MM)이 실제로 언제인지. */
  function instantOf(zone, date, hhmm) {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
    var tm = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!dm || !tm) return null;
    var wall = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]);
    var off = zoneOffset(zone, wall);
    if (off === null) return null;
    var guess = wall - off;
    // 서머타임이 바뀌는 날은 한 번 더 맞춰 봐야 어긋나지 않는다.
    var off2 = zoneOffset(zone, guess);
    if (off2 !== null && off2 !== off) guess = wall - off2;
    return guess;
  }

  function partsIn(zone, instant) {
    var got = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date(instant)).forEach(function (p) { got[p.type] = p.value; });
    return got;
  }

  function dayNumber(date) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
    if (!m) return null;
    return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
  }

  /**
   * 어느 공항의 현지 시각을 한국 시각으로 옮긴다.
   *   toKst('2026-01-09', '21:03', 'LAS') -> { time: '14:03', date: '2026-01-10', shift: 1 }
   * 시간대를 모르는 공항이면 null 을 준다. 모르면 지어내지 않고 원래 값을 그냥 쓴다.
   */
  function toKst(date, hhmm, iata) {
    var zone = zoneOf(iata);
    if (!zone) return null;
    if (zone === KST) {
      var keep = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
      if (!keep) return null;
      return { time: (keep[1].length < 2 ? '0' : '') + keep[1] + ':' + keep[2], date: date, shift: 0 };
    }
    var instant = instantOf(zone, date, hhmm);
    if (instant === null) return null;
    var got = partsIn(KST, instant);
    var kstDate = got.year + '-' + got.month + '-' + got.day;
    var a = dayNumber(date), b = dayNumber(kstDate);
    return {
      time: ((+got.hour) % 24 < 10 ? '0' : '') + ((+got.hour) % 24) + ':' + got.minute,
      date: kstDate,
      shift: (a === null || b === null) ? 0 : b - a
    };
  }

  return {
    KST: KST,
    zoneOffset: zoneOffset,
    instantOf: instantOf,
    toKst: toKst,
    AIRPORT_COUNTRY: AIRPORT_COUNTRY,
    TZ_BY_COUNTRY: TZ_BY_COUNTRY,
    TZ_BY_AIRPORT: TZ_BY_AIRPORT,
    zoneOf: zoneOf,
    COUNTRY_NAMES: COUNTRY_NAMES,
    CITY_NAMES: CITY_NAMES,
    cityOf: cityOf,
    findCode: findCode,
    describeAirport: describeAirport,
    BASES: BASES,
    outstation: outstation,
    tripPlace: tripPlace,
    countryOf: countryOf,
    countryName: countryName,
    flagOf: flagOf,
    flagOfCountry: flagOfCountry,
    splitRoute: splitRoute,
    departureFlag: departureFlag,
    describeRoute: describeRoute
  };
});
