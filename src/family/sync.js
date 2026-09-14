/**
 * 가족 링크: 링크 하나로 늘 최신 스케줄을 본다.
 * 보내는 폰이 스케줄을 잠가(AES-GCM 256, 열쇠는 링크 안에만) 저장소(Supabase)에 올리고,
 * 링크를 받은 폰은 열 때마다 잠긴 글자를 받아 푼다. 저장소에는 잠긴 글자만 남는다.
 * 보기 링크: <앱 주소>#f=<저장 칸 번호>&fk=<푸는 열쇠>&fn=<이름>
 * 올리기 링크: 보기 링크 + &ft=<쓰기 열쇠>. 그 사람 본인에게만 준다.
 * 쓰기는 보내는 폰만 가진 쓰기 열쇠(token)로만 된다. 저장소에는 그 SHA-256 값만 둔다(scripts/supabase-share.sql).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(globalThis);
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.sync = factory(root);
  }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var VERSION = 1;
  var IV_BYTES = 12;

  function cryptoApi() {
    return (root && root.crypto) || (typeof crypto !== 'undefined' ? crypto : null);
  }

  function available() {
    var c = cryptoApi();
    return !!(c && c.subtle && c.getRandomValues && typeof TextEncoder !== 'undefined');
  }

  /** 저장소 주소와 공개 키가 채워져 있어야 켜진다. */
  function enabled(cfg) {
    return !!(cfg && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url || '') && cfg.anonKey);
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

  function randomText(bytes) {
    return toBase64Url(cryptoApi().getRandomValues(new Uint8Array(bytes)));
  }

  /** 새 가족 링크의 번호, 푸는 열쇠, 쓰기 열쇠 */
  function newLink() {
    return { id: randomText(18), key: randomText(32), token: randomText(32) };
  }

  function importKey(key) {
    var raw = fromBase64Url(key);
    if (raw.length !== 32) return Promise.reject(new Error('링크의 열쇠가 잘렸습니다.'));
    return cryptoApi().subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  function streamBytes(bytes, transform) {
    return new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer()
      .then(function (buffer) { return new Uint8Array(buffer); });
  }

  /** 스케줄을 잠가 저장소에 넣을 글자로 */
  function seal(payload, key) {
    var c = cryptoApi();
    var iv = c.getRandomValues(new Uint8Array(IV_BYTES));
    var plain = new TextEncoder().encode(JSON.stringify(payload));
    var zipping = typeof CompressionStream === 'undefined'
      ? Promise.resolve({ zipped: 0, bytes: plain })
      : streamBytes(plain, new CompressionStream('deflate-raw')).then(function (b) { return { zipped: 1, bytes: b }; });
    return Promise.all([zipping, importKey(key)]).then(function (parts) {
      return c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, parts[1], parts[0].bytes).then(function (cipher) {
        var body = new Uint8Array(cipher);
        var out = new Uint8Array(2 + IV_BYTES + body.length);
        out[0] = VERSION;
        out[1] = parts[0].zipped;
        out.set(iv, 2);
        out.set(body, 2 + IV_BYTES);
        return toBase64Url(out);
      });
    });
  }

  /** 저장소에서 받은 잠긴 글자를 링크의 열쇠로 푼다 */
  function open(cipher, key) {
    var bytes;
    try {
      bytes = fromBase64Url(cipher);
    } catch (e) {
      return Promise.reject(new Error('받은 스케줄 모양이 틀립니다.'));
    }
    if (bytes.length < 2 + IV_BYTES + 16 || bytes[0] !== VERSION) {
      return Promise.reject(new Error('이 앱이 모르는 스케줄 모양입니다. 앱을 새로 받아 주세요.'));
    }
    var zipped = bytes[1];
    var iv = bytes.slice(2, 2 + IV_BYTES);
    var body = bytes.slice(2 + IV_BYTES);
    return importKey(key)
      .then(function (k) { return cryptoApi().subtle.decrypt({ name: 'AES-GCM', iv: iv }, k, body); })
      .catch(function () { throw new Error('링크의 열쇠가 맞지 않습니다. 보낸 사람에게 가족 링크를 다시 받아 주세요.'); })
      .then(function (plain) {
        var data = new Uint8Array(plain);
        if (!zipped) return data;
        if (typeof DecompressionStream === 'undefined') throw new Error('이 브라우저는 스케줄을 풀 수 없습니다. 최신 브라우저에서 열어 주세요.');
        return streamBytes(data, new DecompressionStream('deflate-raw'));
      })
      .then(function (data) { return JSON.parse(new TextDecoder().decode(data)); });
  }

  /** 보기 링크. token 을 주면 올리기 링크가 된다. name 은 받는 폰에서 사람 이름으로 쓴다. */
  function linkFor(baseUrl, id, key, name, token) {
    return String(baseUrl).split('#')[0] + '#f=' + id + '&fk=' + key +
      (name ? '&fn=' + encodeURIComponent(name) : '') +
      (token ? '&ft=' + token : '');
  }

  /** 주소의 # 에서 가족 링크 번호, 푸는 열쇠, 이름, 쓰기 열쇠. 없으면 null. */
  function fromHash(hash) {
    var text = String(hash || '');
    var id = /[#&]f=([A-Za-z0-9_-]{20,64})(?:&|$)/.exec(text);
    var key = /[#&]fk=([A-Za-z0-9_-]{40,60})(?:&|$)/.exec(text);
    if (!id || !key) return null;
    var token = /[#&]ft=([A-Za-z0-9_-]{40,60})(?:&|$)/.exec(text);
    var name = /[#&]fn=([^&]{1,120})(?:&|$)/.exec(text);
    var decoded = null;
    if (name) {
      try { decoded = decodeURIComponent(name[1]).trim().slice(0, 20) || null; } catch (e) { decoded = null; }
    }
    return { id: id[1], key: key[1], token: token ? token[1] : null, name: decoded };
  }

  /** Supabase 함수 부르기. fetcher 는 테스트에서 바꿔 끼운다. */
  function client(cfg, fetcher) {
    var base = String(cfg.url || '').replace(/\/$/, '');
    var doFetch = fetcher || (root.fetch ? root.fetch.bind(root) : null);

    function rpc(name, body) {
      return doFetch(base + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: 'Bearer ' + cfg.anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
          if (!res.ok) {
            var message = data && (data.message || data.error || data.hint) || ('HTTP ' + res.status);
            if (/wrong token/.test(message)) message = '이 폰에는 이 가족 링크를 바꿀 권한이 없습니다.';
            throw new Error(message);
          }
          return data;
        });
      }, function () {
        throw new Error('인터넷에 연결되지 않아 스케줄을 주고받지 못했습니다.');
      });
    }

    return {
      put: function (id, cipher, token) {
        return rpc('put_family_share', { p_id: id, p_cipher: cipher, p_token: token });
      },
      get: function (id) {
        return rpc('get_family_share', { p_id: id }).then(function (rows) {
          var row = Array.isArray(rows) ? rows[0] : rows;
          return row && row.cipher ? { cipher: row.cipher, updatedAt: row.updated_at } : null;
        });
      },
      remove: function (id, token) {
        return rpc('delete_family_share', { p_id: id, p_token: token });
      }
    };
  }

  return {
    VERSION: VERSION,
    available: available,
    enabled: enabled,
    newLink: newLink,
    seal: seal,
    open: open,
    linkFor: linkFor,
    fromHash: fromHash,
    client: client
  };
});
