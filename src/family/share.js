/**
 * 서버 없이 스케줄을 나누는 링크.
 * 스케줄을 암호화해서 주소의 # 뒤에 담는다. # 뒤는 브라우저가 서버로 보내지 않는다.
 * 푸는 열쇠(k)도 링크에 같이 넣어, 링크를 받은 사람은 비밀번호 없이 바로 본다.
 * 암호화: PBKDF2(SHA-256, 15만 번)로 비밀번호에서 키를 만들고 AES-GCM 256 으로 잠근다.
 * 링크 모양: <앱 주소>#s=<버전 1바이트, 압축 1바이트, 소금 16바이트, iv 12바이트, 암호문>을 base64url 로
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(globalThis);
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.share = factory(root);
  }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var VERSION = 1;
  var ITERATIONS = 150000;
  var SALT_BYTES = 16;
  var IV_BYTES = 12;

  function cryptoApi() {
    return (root && root.crypto) || (typeof crypto !== 'undefined' ? crypto : null);
  }

  /** https 주소, localhost, 안드로이드 앱에서만 된다. 사내 http 주소에서는 브라우저가 암호화를 막는다. */
  function available() {
    var c = cryptoApi();
    return !!(c && c.subtle && c.getRandomValues && typeof TextEncoder !== 'undefined');
  }

  function toBase64Url(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(value) {
    var base = String(value).replace(/-/g, '+').replace(/_/g, '/');
    while (base.length % 4) base += '=';
    var text = atob(base);
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return bytes;
  }

  function streamBytes(bytes, transform) {
    return new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer()
      .then(function (buffer) { return new Uint8Array(buffer); });
  }

  /** 줄일 수 있으면 deflate 로 줄인다. 오래된 브라우저는 그대로 둔다. */
  function compress(bytes) {
    if (typeof CompressionStream === 'undefined') return Promise.resolve({ zipped: 0, bytes: bytes });
    return streamBytes(bytes, new CompressionStream('deflate-raw')).then(function (out) {
      return { zipped: 1, bytes: out };
    });
  }

  function decompress(bytes, zipped) {
    if (!zipped) return Promise.resolve(bytes);
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('이 브라우저는 압축된 링크를 풀 수 없습니다. 최신 브라우저에서 열어 주세요.'));
    }
    return streamBytes(bytes, new DecompressionStream('deflate-raw'));
  }

  function deriveKey(pin, salt) {
    var subtle = cryptoApi().subtle;
    return subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      });
  }

  function validPin(pin) {
    return /^\d{4,8}$/.test(String(pin || ''));
  }

  /** 스케줄(아무 JSON)을 비밀번호로 잠가 링크에 넣을 글자로 만든다. */
  function pack(payload, pin) {
    if (!available()) return Promise.reject(new Error('이 주소에서는 암호화를 쓸 수 없습니다. https 주소나 안드로이드 앱에서 만들어 주세요.'));
    if (!validPin(pin)) return Promise.reject(new Error('비밀번호는 숫자 4~8자리로 정해 주세요.'));
    var c = cryptoApi();
    var salt = c.getRandomValues(new Uint8Array(SALT_BYTES));
    var iv = c.getRandomValues(new Uint8Array(IV_BYTES));
    var plain = new TextEncoder().encode(JSON.stringify(payload));
    return Promise.all([compress(plain), deriveKey(pin, salt)]).then(function (parts) {
      var packed = parts[0];
      return c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, parts[1], packed.bytes).then(function (cipher) {
        var body = new Uint8Array(cipher);
        var out = new Uint8Array(2 + SALT_BYTES + IV_BYTES + body.length);
        out[0] = VERSION;
        out[1] = packed.zipped;
        out.set(salt, 2);
        out.set(iv, 2 + SALT_BYTES);
        out.set(body, 2 + SALT_BYTES + IV_BYTES);
        return toBase64Url(out);
      });
    });
  }

  /** 링크 글자와 비밀번호로 스케줄을 다시 연다. 비밀번호가 틀리면 실패한다. */
  function unpack(token, pin) {
    if (!available()) return Promise.reject(new Error('이 주소에서는 암호를 풀 수 없습니다. https 주소나 안드로이드 앱에서 열어 주세요.'));
    var bytes;
    try {
      bytes = fromBase64Url(token);
    } catch (e) {
      return Promise.reject(new Error('링크가 잘렸거나 모양이 틀립니다.'));
    }
    if (bytes.length < 2 + SALT_BYTES + IV_BYTES + 16 || bytes[0] !== VERSION) {
      return Promise.reject(new Error('링크가 잘렸거나 이 앱이 모르는 모양입니다.'));
    }
    var zipped = bytes[1];
    var salt = bytes.slice(2, 2 + SALT_BYTES);
    var iv = bytes.slice(2 + SALT_BYTES, 2 + SALT_BYTES + IV_BYTES);
    var body = bytes.slice(2 + SALT_BYTES + IV_BYTES);
    return deriveKey(pin, salt)
      .then(function (key) { return cryptoApi().subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, body); })
      .catch(function () { throw new Error('비밀번호가 틀렸거나 링크가 잘렸습니다.'); })
      .then(function (plain) { return decompress(new Uint8Array(plain), zipped); })
      .then(function (plain) { return JSON.parse(new TextDecoder().decode(plain)); });
  }

  /** 링크 만들기. key 를 주면 링크 안에 열쇠를 넣어 비밀번호 없이 열린다. */
  function linkFor(baseUrl, token, key) {
    return String(baseUrl).split('#')[0] + '#s=' + token + (key ? '&k=' + key : '');
  }

  /** 링크 안의 열쇠. 없으면(비밀번호로 잠근 옛 링크) null. */
  function keyFrom(hash) {
    var match = /[#&]k=(\d{4,8})(?:&|$)/.exec(String(hash || ''));
    return match ? match[1] : null;
  }

  /** 주소의 # 부분에서 공유 글자를 꺼낸다. 없으면 null. */
  function tokenFrom(hash) {
    var match = /[#&]s=([A-Za-z0-9_-]+)/.exec(String(hash || ''));
    return match ? match[1] : null;
  }

  function randomPin() {
    var n = cryptoApi().getRandomValues(new Uint32Array(1))[0] % 1000000;
    return ('000000' + n).slice(-6);
  }

  /** 링크에 넣을 열쇠: 숫자 8자리 */
  function randomKey() {
    var n = cryptoApi().getRandomValues(new Uint32Array(1))[0] % 100000000;
    return ('00000000' + n).slice(-8);
  }

  return {
    VERSION: VERSION,
    available: available,
    validPin: validPin,
    pack: pack,
    unpack: unpack,
    linkFor: linkFor,
    tokenFrom: tokenFrom,
    keyFrom: keyFrom,
    randomPin: randomPin,
    randomKey: randomKey
  };
});
