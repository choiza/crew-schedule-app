/**
 * 스케줄 캡처에서 글자를 읽는다. 기기 안에서만.
 *
 * 서버도 API 키도 쓰지 않는다. 글자 인식기(Tesseract)를 앱 안에 담아 두고 브라우저에서
 * 돌리기 때문에, 사진이 밖으로 나가지 않고 비행기 안에서도 된다. 대신 무거워서
 * 처음 한 번 쓸 때만 내려받는다(6MB 남짓). 그 뒤로는 담아 둔 것을 쓴다.
 *
 * 인식 결과는 글자와 그 자리(네모)로 받아서 ocrlayout 이 달력 칸을 되짚고,
 * 그 글을 붙여넣기와 똑같은 미리보기로 넘긴다. 눈으로 확인하고 고친 뒤 반영한다.
 *
 * 그림 손질은 따로 떼어 놨다(enhance, scaleFor). 캔버스 없이도 검사할 수 있게.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ocrlayout.js'));
  } else {
    root.CrewCal = root.CrewCal || {};
    root.CrewCal.ocr = factory(root.CrewCal.ocrlayout);
  }
})(typeof self !== 'undefined' ? self : this, function (ocrlayout) {
  'use strict';

  var BASE = 'vendor/tesseract/';
  var SCRIPT = BASE + 'tesseract.min.js';
  var MIN_WIDTH = 2200;     // 폰 스케줄 화면의 작은 글씨는 이 정도로 키워야 읽힌다
  var MAX_SIDE = 4000;      // 아이폰 사파리가 감당하는 캔버스 한 변
  var MAX_PIXELS = 12e6;    // 그리고 넓이도 한계가 있다
  var MAX_SCALE = 3;

  var loading = null;
  var worker = null;

  /**
   * 얼마나 키우거나 줄여서 읽을지.
   *
   * 폰으로 찍은 스케줄 화면은 글씨가 20픽셀 남짓이라 그냥은 잘 안 읽힌다. 가로가
   * 2200픽셀쯤 되게 키우면 또렷해진다. 다만 캔버스가 감당하는 크기가 있어,
   * 한 변 4000픽셀과 전체 1200만 픽셀을 넘지 않는 선에서 키운다.
   */
  function scaleFor(width, height) {
    if (!width || !height) return 1;
    var wanted = width < MIN_WIDTH ? Math.min(MAX_SCALE, MIN_WIDTH / width) : 1;

    // 정수배로 키우면 글자가 덜 뭉갠다. 들어가면 정수배, 아니면 들어가는 만큼만.
    var whole = Math.max(1, Math.round(wanted));
    if (whole > 1 && fits(width, height, whole)) return whole;

    var scale = wanted;
    var longest = Math.max(width, height) * scale;
    if (longest > MAX_SIDE) scale *= MAX_SIDE / longest;
    var pixels = width * height * scale * scale;
    if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);
    return scale;
  }

  function fits(width, height, scale) {
    return Math.max(width, height) * scale <= MAX_SIDE &&
      width * height * scale * scale <= MAX_PIXELS;
  }

  /**
   * 흑백으로 바꾸고, 어두운 화면(흰 글씨)이면 뒤집고, 옅은 글자는 진하게 편다.
   * 픽셀 배열을 그 자리에서 고치고 무엇을 했는지 알려준다.
   */
  function enhance(data, options) {
    var opts = options || {};
    var i;
    var gray = new Uint8Array(data.length / 4);
    var sum = 0;
    for (i = 0; i < gray.length; i++) {
      var r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      var value = (r * 299 + g * 587 + b * 114) / 1000;
      gray[i] = value;
      sum += value;
    }
    var mean = sum / gray.length;

    var histogram = new Uint32Array(256);
    for (i = 0; i < gray.length; i++) histogram[gray[i]]++;

    // 어두운 화면인지는 가장 넓은 면(바탕)을 보고 가른다. 평균으로 재면 흰 글씨가
    // 많은 화면에서 밝은 쪽으로 끌려가, 뒤집어야 할 그림을 그냥 두게 된다.
    var background = 0;
    for (i = 1; i < 256; i++) if (histogram[i] > histogram[background]) background = i;
    var inverted = background < 128;

    // 아주 밝은 쪽과 아주 어두운 쪽을 잘라 낸 범위로 폅니다 (양 끝 2%)
    var cut = Math.floor(gray.length * 0.02);
    var low = 0, high = 255, acc = 0;
    for (i = 0; i < 256; i++) { acc += histogram[i]; if (acc > cut) { low = i; break; } }
    acc = 0;
    for (i = 255; i >= 0; i--) { acc += histogram[i]; if (acc > cut) { high = i; break; } }
    if (high - low < 32) { low = 0; high = 255; }              // 밋밋한 그림은 그대로 둔다
    // 색 판을 이미 흑백으로 눌러 둔 그림은 더 늘이지 않는다. 글자만 상한다.
    if (opts.stretch === false) { low = 0; high = 255; }

    var span = high - low;
    for (i = 0; i < gray.length; i++) {
      var v = Math.max(0, Math.min(255, Math.round(((gray[i] - low) / span) * 255)));
      if (inverted) v = 255 - v;
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    return {
      inverted: inverted,
      background: background,
      mean: Math.round(mean),
      low: low,
      high: high
    };
  }

  /**
   * 색칠한 판 위의 흰 글씨를 검은 글씨로 돌려놓는다.
   *
   * 크루넷은 근무를 색 판(파랑·연파랑·연두) 위에 흰 글씨로 적는다. 흑백으로만 바꾸면
   * 판은 중간 회색, 글씨는 흰색이 되는데, 인식기는 흰 바탕에 검은 글씨를 찾으므로
   * 이런 판은 통째로 못 읽는다. 실제로 크루넷 화면에서는 근무 코드가 하나도 안 읽혔다.
   *
   * 그래서 색이 진한 자리를 판으로 보고, 판마다 따로 밝기를 재어 글씨는 검게, 판은
   * 희게 바꾼다. 판마다 색이 다르므로 한꺼번에 재면 안 되고, 이어진 판끼리 따로 재야 한다.
   * 색 글씨(빨간 일요일 숫자 따위)는 속이 빈 가는 획이라 판으로 보지 않는다.
   */
  /**
   * 판 색을 근무의 갈래로 옮긴다. 크루넷은 비행·체류를 파랑, 휴무를 연두, 대기를 회색
   * 판에 적는다. 글자를 잘못 읽었을 때 무엇이었을지 가려내는 실마리가 된다.
   */
  function toneOf(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 30) return 'gray';
    if (b >= r && b >= g) return 'blue';
    if (g >= r && g >= b) return 'green';
    return 'other';
  }

  function unchip(data, width, height) {
    var n = width * height;
    var gray = new Uint8Array(n);
    var colored = new Uint8Array(n);
    var red = new Uint8Array(n);
    var green = new Uint8Array(n);
    var blue = new Uint8Array(n);
    var i;

    for (i = 0; i < n; i++) {
      var r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      red[i] = r; green[i] = g; blue[i] = b;
      gray[i] = (r * 299 + g * 587 + b * 114) / 1000;
      colored[i] = (Math.max(r, g, b) - Math.min(r, g, b)) > 40 ? 1 : 0;
    }

    // 판 안의 흰 글씨는 색이 없다. 가로로 좁은 틈은 메워 판 하나로 잇는다.
    //
    // 다만 옆 칸의 판까지 이어 붙이면 안 된다. 글자 사이의 틈은 위아래로 판 색이
    // 이어지지만, 판과 판 사이의 틈은 위아래가 흰 종이다. 그래서 위아래로도 색이
    // 가까이 있는 자리만 메운다.
    var gap = Math.max(8, Math.round(width * 0.022));
    var near = new Uint8Array(n);       // 위아래로 gap 안에 판 색이 있는 자리
    var reach = new Int32Array(n);
    var far = gap + 1;
    var x, y;
    for (x = 0; x < width; x++) {
      var seen = far;
      for (y = 0; y < height; y++) {
        i = y * width + x;
        seen = colored[i] ? 0 : Math.min(far, seen + 1);
        reach[i] = seen;
      }
      seen = far;
      for (y = height - 1; y >= 0; y--) {
        i = y * width + x;
        seen = colored[i] ? 0 : Math.min(far, seen + 1);
        near[i] = reach[i] <= gap && seen <= gap ? 1 : 0;
      }
    }

    var region = colored.slice();
    for (y = 0; y < height; y++) {
      var last = -1;
      for (x = 0; x < width; x++) {
        i = y * width + x;
        if (!colored[i]) continue;
        if (last >= 0 && x - last <= gap) {
          var fillable = true;
          for (var k = last + 1; k < x; k++) {
            if (!near[y * width + k]) { fillable = false; break; }
          }
          if (fillable) for (k = last + 1; k < x; k++) region[y * width + k] = 1;
        }
        last = x;
      }
    }

    var plates = 0;
    var rects = [];
    var top0 = height, bottom0 = -1, tall = 0;

    // 이어진 판 찾기. 한 줄씩 토막(run)으로 보고, 위아래 토막이 거의 같은 자리에 있을
    // 때만 하나로 잇는다. 그냥 이웃끼리 이으면 오늘 날짜에 쳐진 동그라미 같은 것이
    // 바로 아래 판에 달라붙어, 판이 아닌 모양으로 보여 통째로 버려진다.
    var runs = [];
    var rowStart = [];
    for (y = 0; y < height; y++) {
      rowStart.push(runs.length);
      var from = -1;
      for (x = 0; x <= width; x++) {
        var on = x < width && region[y * width + x];
        if (on && from < 0) from = x;
        if (!on && from >= 0) {
          runs.push({ y: y, x0: from, x1: x - 1, label: runs.length });
          from = -1;
        }
      }
    }
    rowStart.push(runs.length);

    function rootOf(index) {
      while (runs[index].label !== index) {
        runs[index].label = runs[runs[index].label].label;
        index = runs[index].label;
      }
      return index;
    }

    for (var row = 1; row < height; row++) {
      for (var a = rowStart[row]; a < rowStart[row + 1]; a++) {
        for (var b = rowStart[row - 1]; b < rowStart[row]; b++) {
          var overlap = Math.min(runs[a].x1, runs[b].x1) - Math.max(runs[a].x0, runs[b].x0) + 1;
          if (overlap <= 0) continue;
          var lenA = runs[a].x1 - runs[a].x0 + 1;
          var lenB = runs[b].x1 - runs[b].x0 + 1;
          if (overlap < lenA * 0.7 || overlap < lenB * 0.7) continue;   // 자리가 다르면 딴 것
          var ra = rootOf(a), rb = rootOf(b);
          if (ra !== rb) runs[ra].label = rb;
        }
      }
    }

    var groups = {};
    for (i = 0; i < runs.length; i++) {
      var key = rootOf(i);
      var group = groups[key] || (groups[key] = { runs: [], count: 0, x0: width, x1: -1, y0: height, y1: -1 });
      group.runs.push(runs[i]);
      group.count += runs[i].x1 - runs[i].x0 + 1;
      if (runs[i].x0 < group.x0) group.x0 = runs[i].x0;
      if (runs[i].x1 > group.x1) group.x1 = runs[i].x1;
      if (runs[i].y < group.y0) group.y0 = runs[i].y;
      if (runs[i].y > group.y1) group.y1 = runs[i].y;
    }

    Object.keys(groups).forEach(function (key) {
      var group = groups[key];
      var x0 = group.x0, x1 = group.x1, y0 = group.y0, y1 = group.y1;
      var w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (w < 40 || h < 16 || group.count < 800) return;          // 판이라기엔 작다
      if (group.count / (w * h) < 0.6) return;                    // 속이 빈 덩어리 (색 글씨 따위)

      var histogram = new Uint32Array(256);
      var pixels = [];
      group.runs.forEach(function (run) {
        for (var px = run.x0; px <= run.x1; px++) {
          var at = run.y * width + px;
          pixels.push(at);
          histogram[gray[at]]++;
        }
      });

      var plate = 0;
      var k;
      for (k = 1; k < 256; k++) if (histogram[k] > histogram[plate]) plate = k;

      var bright = 0, brightCount = 0, darkCount = 0;
      var sumR = 0, sumG = 0, sumB = 0, plateCount = 0;
      for (k = 0; k < pixels.length; k++) {
        var value = gray[pixels[k]];
        if (value > plate + 30) { bright += value; brightCount++; }
        else if (value < plate - 30) darkCount++;
        else {
          sumR += red[pixels[k]]; sumG += green[pixels[k]]; sumB += blue[pixels[k]];
          plateCount++;
        }
      }
      var ratio = brightCount / pixels.length;
      if (brightCount <= darkCount || ratio < 0.03 || ratio > 0.5) return;   // 흰 글씨 판이 아니다

      var cut = (plate + bright / brightCount) / 2;
      for (k = 0; k < pixels.length; k++) {
        gray[pixels[k]] = gray[pixels[k]] >= cut ? 0 : 255;       // 글씨는 검게, 판은 희게
      }
      plates++;
      rects.push({
        x0: x0, y0: y0, x1: x1, y1: y1,
        tone: plateCount ? toneOf(sumR / plateCount, sumG / plateCount, sumB / plateCount) : null
      });
      if (y0 < top0) top0 = y0;
      if (y1 > bottom0) bottom0 = y1;
      if (h > tall) tall = h;
    });

    if (plates) {
      for (i = 0; i < n; i++) {
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = gray[i];
      }
    }
    return {
      plates: plates,
      rects: rects,
      // 날짜 숫자와 요일 머리글이 판 위에 있으므로 넉넉히 남긴다. 바짝 자르면
      // 인식기가 글의 짜임을 읽지 못해 되레 덜 읽는다.
      top: plates ? Math.max(0, top0 - tall * 4) : 0,
      bottom: plates ? Math.min(height, bottom0 + tall * 2) : height
    };
  }

  /**
   * 이중선형으로 키운다. 캔버스에 맡기면 획이 뭉개지거나 너무 날카로워져서,
   * 같은 화면을 놓고 견줘 보면 이쪽이 더 잘 읽혔다.
   */
  function upscale(data, width, height, zoom) {
    var w = Math.round(width * zoom), h = Math.round(height * zoom);
    var out = new Uint8ClampedArray(w * h * 4);
    for (var y = 0; y < h; y++) {
      var sy = Math.min(height - 1, y / zoom);
      var y0 = Math.floor(sy), y1 = Math.min(height - 1, y0 + 1), fy = sy - y0;
      for (var x = 0; x < w; x++) {
        var sx = Math.min(width - 1, x / zoom);
        var x0 = Math.floor(sx), x1 = Math.min(width - 1, x0 + 1), fx = sx - x0;
        var tl = data[(y0 * width + x0) * 4], tr = data[(y0 * width + x1) * 4];
        var bl = data[(y1 * width + x0) * 4], br = data[(y1 * width + x1) * 4];
        var value = (tl * (1 - fx) + tr * fx) * (1 - fy) + (bl * (1 - fx) + br * fx) * fy;
        var at = (y * w + x) * 4;
        out[at] = out[at + 1] = out[at + 2] = value;
        out[at + 3] = 255;
      }
    }
    return { data: out, width: w, height: h };
  }

  /** 이 브라우저에서 기기 안 인식을 쓸 수 있는지. */
  function available() {
    return typeof document !== 'undefined' &&
      typeof WebAssembly === 'object' &&
      typeof Worker === 'function' &&
      !!document.createElement('canvas').getContext;
  }

  /** 인식기를 처음 쓸 때 한 번만 내려받는다. */
  function load() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (typeof window !== 'undefined' && window.Tesseract) return resolve(window.Tesseract);
      var script = document.createElement('script');
      script.src = SCRIPT;
      script.async = true;
      script.onload = function () {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error('글자 인식기를 불러오지 못했습니다.'));
      };
      script.onerror = function () {
        reject(new Error('글자 인식기를 내려받지 못했습니다. 연결을 확인해 주세요.'));
      };
      document.head.appendChild(script);
    });
    return loading;
  }

  function getWorker(onProgress) {
    if (worker) return Promise.resolve(worker);
    return load().then(function (Tesseract) {
      return Tesseract.createWorker('eng', 1, {
        workerPath: BASE + 'worker.min.js',
        corePath: BASE,
        langPath: BASE,
        gzip: true,
        logger: function (m) {
          if (!onProgress) return;
          if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
            onProgress({ phase: 'load', ratio: m.progress });
          } else if (m.status === 'recognizing text') {
            onProgress({ phase: 'read', ratio: m.progress });
          }
        }
      });
    }).then(function (created) {
      worker = created;
      // 11 = 드문드문 놓인 글자 찾기. 달력처럼 칸칸이 떨어져 적힌 화면에서
      // 줄 단위(6)보다 훨씬 잘 읽는다. 크루넷 화면으로 견줘 보고 골랐다.
      return worker.setParameters({ tessedit_pageseg_mode: '11' }).then(function () { return worker; });
    });
  }

  /** 그림 파일을 손질해 캔버스에 올린다. */
  function toCanvas(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        try {
          // 1) 원래 크기에서 색 판을 먼저 되돌린다 (키운 뒤에 하면 느리기만 하다)
          var first = document.createElement('canvas');
          first.width = image.width;
          first.height = image.height;
          var firstCtx = first.getContext('2d');
          firstCtx.drawImage(image, 0, 0);
          var pixels = firstCtx.getImageData(0, 0, first.width, first.height);
          var found = unchip(pixels.data, first.width, first.height);
          var how = enhance(pixels.data, { stretch: found.plates < 4 });
          how.plates = found.plates;

          // 2) 근무 판이 있는 자리만 남긴다. 상태 표시줄이나 메뉴를 읽을 일이 없고,
          //    그만큼 더 키워서 읽을 수 있다. 가로는 그대로 두어 요일 칸을 다 담는다.
          var cropTop = found.plates >= 4 ? found.top : 0;
          var cropHeight = (found.plates >= 4 ? found.bottom : image.height) - cropTop;
          how.cropped = cropHeight < image.height;

          var cut = pixels.data;
          if (how.cropped) {
            cut = new Uint8ClampedArray(image.width * cropHeight * 4);
            var rowBytes = image.width * 4;
            for (var row = 0; row < cropHeight; row++) {
              cut.set(pixels.data.subarray((cropTop + row) * rowBytes, (cropTop + row + 1) * rowBytes),
                row * rowBytes);
            }
          }

          // 3) 그런 다음 읽기 좋은 크기로 키운다
          var scale = scaleFor(image.width, cropHeight);
          var big = Math.abs(scale - 1) < 0.01
            ? { data: cut, width: image.width, height: cropHeight }
            : upscale(cut, image.width, cropHeight, scale);

          var canvas = document.createElement('canvas');
          canvas.width = big.width;
          canvas.height = big.height;
          canvas.getContext('2d').putImageData(new ImageData(big.data, big.width, big.height), 0, 0);
          URL.revokeObjectURL(url);
          resolve({
            canvas: canvas, scale: scale, how: how, chips: found.rects,
            crop: { top: cropTop, scale: scale },
            full: first                       // 자르기 전 그림. 머리말에서 연·월을 읽는다.
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('그림을 열지 못했습니다.'));
      };
      image.src = url;
    });
  }

  /** 인식 결과에서 글자와 자리만 뽑는다. */
  function wordsOf(data) {
    var out = [];
    (data.blocks || []).forEach(function (block) {
      (block.paragraphs || []).forEach(function (para) {
        (para.lines || []).forEach(function (line) {
          (line.words || []).forEach(function (word) {
            if (!word.text || !word.bbox) return;
            out.push({
              text: word.text,
              conf: Math.round(word.confidence),
              x0: word.bbox.x0, y0: word.bbox.y0, x1: word.bbox.x1, y1: word.bbox.y1
            });
          });
        });
      });
    });
    return out;
  }

  /**
   * read(file, { year, month, onProgress }) -> { text, shape, unsure, confidence }
   * 읽은 글은 붙여넣기 미리보기로 그대로 넘길 수 있는 형태다.
   */
  function read(file, options) {
    var opts = options || {};
    if (!available()) return Promise.reject(new Error('이 브라우저에서는 기기 안 글자 인식을 쓸 수 없습니다.'));

    return toCanvas(file).then(function (prepared) {
      var worker = null;
      return getWorker(opts.onProgress).then(function (w) {
        worker = w;
        return w.recognize(prepared.canvas, {}, { blocks: true, text: true });
      }).then(function (result) {
        var data = result.data || {};
        var words = wordsOf(data);
        return rescueChips(worker, prepared, words).then(function (rescued) {
          return readMonth(worker, prepared).then(function (month) {
            // 판을 다시 읽었으면 그 판에서 먼저 읽은 글자는 버린다
            var kept = words.filter(function (word) {
              var cx = (word.x0 + word.x1) / 2, cy = (word.y0 + word.y1) / 2;
              return !rescued.some(function (fresh) {
                return cx >= fresh.x0 && cx <= fresh.x1 && cy >= fresh.y0 && cy <= fresh.y1;
              });
            });
            return { data: data, words: kept.concat(rescued), month: month };
          });
        });
      }).then(function (result) {
        var data = result.data;
        var words = result.words;
        var missed = missedChips(prepared, words);
        // 화면에서 읽은 연·월이 있으면 그것을 쓴다. 없으면 보고 있던 달에 얹는다.
        var when = result.month || { year: opts.year, month: opts.month };
        var laid = ocrlayout.toText(attachChips(prepared, words), when);
        return {
          month: result.month,
          text: laid.text,
          shape: laid.shape,
          unsure: laid.unsure,
          dropped: laid.dropped,
          missingDays: laid.missingDays || [],
          strayDays: laid.strayDays || [],
          chips: prepared.chips.length,
          missed: missed,
          words: words.length,
          confidence: Math.round(data.confidence || 0),
          prepared: prepared.how
        };
      });
    });
  }

  /**
   * 글자가 어느 판(칸) 안에서 나왔는지 이어 준다.
   *
   * 자리를 판의 한가운데로 바꿔 놓으면 어느 날의 근무인지 헷갈리지 않는다. 글자만
   * 보고 자리를 잡으면, 글자가 판 한쪽에 치우쳐 읽힌 날 옆 칸으로 넘어가 버린다.
   * 판 색(파랑·연두·회색)도 같이 달아 둔다. 글자를 잘못 읽었을 때 실마리가 된다.
   */
  function attachChips(prepared, words) {
    var chips = prepared.chips || [];
    if (!chips.length) return words;
    var scale = prepared.crop.scale;
    var top = prepared.crop.top;

    var boxes = chips.map(function (chip) {
      return {
        x0: chip.x0 * scale, x1: chip.x1 * scale,
        y0: (chip.y0 - top) * scale, y1: (chip.y1 - top) * scale,
        tone: chip.tone
      };
    });

    // 인식기가 두 판을 한 낱말로 묶어 읽는 일이 있다(ATDO._-—«KE0843). 이상한 기호에서
    // 토막 내 두면 조각 수가 곧 판의 수이므로, 왼쪽부터 차례로 제 판에 넣어 줄 수 있다.
    var items = words.map(function (word, index) {
      var pieces = ocrlayout.splitJunk ? ocrlayout.splitJunk(word.text) : [word.text];
      return {
        index: index,
        word: word,
        pieces: pieces.length ? pieces : [word.text],
        area: Math.max(1, (word.x1 - word.x0) * (word.y1 - word.y0))
      };
    });

    // 작고 또렷하게 잡힌 글자부터 자기 판을 고르게 한다. 옆 칸까지 덮는 큰 네모는
    // 뒤로 미뤄 두면 남은 판, 곧 제 칸을 찾아간다.
    var order = items.slice().sort(function (a, b) { return a.area - b.area; });

    var taken = {};
    var out = [];

    function chipsUnder(word) {
      var hits = [];
      var area = Math.max(1, (word.x1 - word.x0) * (word.y1 - word.y0));
      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        var overlap = Math.max(0, Math.min(word.x1, box.x1) - Math.max(word.x0, box.x0)) *
          Math.max(0, Math.min(word.y1, box.y1) - Math.max(word.y0, box.y0));
        if (!overlap) continue;
        var share = overlap / Math.max(1, (box.x1 - box.x0) * (box.y1 - box.y0));
        // 판의 3할을 덮거나, 글자 자신이 반 넘게 그 판 안에 있으면 그 판의 글자로 본다.
        // 뒤엣것은 한 글자가 판 밖으로 길쭉하게 읽힌 경우를 건진다.
        if (share >= 0.3 || overlap / area >= 0.5) hits.push({ at: i, share: share });
      }
      return hits;
    }

    order.forEach(function (item) {
      var word = item.word;
      var hits = chipsUnder(word);

      // 조각이 여럿이고 그만큼의 판을 덮고 있으면, 읽는 차례대로 나눠 담는다
      if (item.pieces.length > 1 && hits.length >= item.pieces.length) {
        var sorted = hits.slice().sort(function (a, b) {
          var A = boxes[a.at], B = boxes[b.at];
          // 같은 줄에 있으면 왼쪽부터. 줄이 다를 때만 위에서 아래로.
          var tol = Math.min(A.y1 - A.y0, B.y1 - B.y0) * 0.5;
          if (Math.abs(A.y0 - B.y0) > tol) return A.y0 - B.y0;
          return A.x0 - B.x0;
        });
        item.pieces.forEach(function (piece, n) {
          var slot = sorted[n];
          if (!slot || taken[slot.at]) return;        // 임자 있는 판은 그 판이 읽은 것을 쓴다
          taken[slot.at] = true;
          var box = boxes[slot.at];
          out.push({
            text: piece, conf: word.conf, tone: box.tone,
            x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1
          });
        });
        return;
      }

      var best = -1, bestScore = 0;
      hits.forEach(function (hit) {
        var score = hit.share + (taken[hit.at] ? 0 : 1);   // 임자 없는 판을 먼저
        if (score > bestScore) { bestScore = score; best = hit.at; }
      });
      if (best < 0) { out.push(word); return; }
      taken[best] = true;
      var chosen = boxes[best];
      out.push({
        text: word.text, conf: word.conf, tone: chosen.tone, chip: best, at: word.x0,
        x0: chosen.x0, x1: chosen.x1, y0: chosen.y0, y1: chosen.y1
      });
    });

    return mergeWithinChip(out);
  }

  /**
   * 화면 맨 위에서 몇 년 몇 월 스케줄인지 읽는다.
   *
   * 이걸 읽지 않으면 앱이 보고 있던 달에 얹히는데, 4월 화면을 5월에 넣는 사고가 난다.
   * 크루넷은 달력 위에 "2026.04" 와 "2026-04-29" 를 적어 두므로 거기서 가져온다.
   */
  function readMonth(worker, prepared) {
    var full = prepared.full;
    // 달 표시는 달력 위 어딘가에 있다. 판이 시작되는 자리 위쪽을 넉넉히 훑는다.
    // 좁게 보다가 못 찾아 엉뚱한 달(그 달 대신 이번 달)로 넣는 일이 있었다.
    var height = Math.min(full.height, Math.max(prepared.crop.top + 160, full.height * 0.4));
    if (height < 60) return Promise.resolve(null);

    // 글자가 작으면 2배로는 안 읽힌다. 너무 크면 느리니 한 변 3000 안쪽으로.
    var zoom = Math.max(2, Math.min(4, Math.floor(3000 / Math.max(full.width, 1))));
    var canvas = document.createElement('canvas');
    canvas.width = full.width * zoom;
    canvas.height = height * zoom;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, full.width, height, 0, 0, canvas.width, canvas.height);

    return worker.setParameters({ tessedit_pageseg_mode: '6' })
      .then(function () { return worker.recognize(canvas, {}, { text: true }); })
      .then(function (result) {
        var text = String((result.data && result.data.text) || '');
        var found = /(20\d{2})\s*[.\-/년]\s*(0?[1-9]|1[0-2])(?![0-9])/.exec(text);
        if (!found) return null;
        return { year: +found[1], month: +found[2] };
      })
      .catch(function () { return null; })
      .then(function (month) {
        return worker.setParameters({ tessedit_pageseg_mode: '11' }).then(function () { return month; });
      });
  }

  /** 판의 자리를 인식에 쓴 그림의 자리로 옮긴다. */
  function chipBox(chip, prepared) {
    var scale = prepared.crop.scale;
    var top = prepared.crop.top;
    return {
      x0: chip.x0 * scale, x1: chip.x1 * scale,
      y0: (chip.y0 - top) * scale, y1: (chip.y1 - top) * scale,
      tone: chip.tone
    };
  }

  /**
   * 글자를 못 얻은 판만 따로 크게 잘라 다시 읽는다.
   *
   * 한 장을 통째로 읽을 때는 작은 판 하나가 통째로 묻히곤 한다. 그런 판은 몇 개 안
   * 되니, 네 배로 키워 낱말 하나만 찾으라고 일러 주면 대개 읽힌다. 그래도 안 읽히면
   * 그 날은 빈칸으로 남고, 몇 개를 못 읽었는지 알려 준다.
   */
  function rescueChips(worker, prepared, words) {
    var chips = (prepared.chips || []).map(function (chip) { return chipBox(chip, prepared); });

    /** 그 판에서 읽은 글자들의 가장 낮은 자신감. 글자가 없으면 0. */
    function confIn(box) {
      var list = words.filter(function (word) {
        var cx = (word.x0 + word.x1) / 2, cy = (word.y0 + word.y1) / 2;
        return cx >= box.x0 && cx <= box.x1 && cy >= box.y0 && cy <= box.y1;
      });
      if (!list.length) return 0;
      return list.reduce(function (low, w) { return Math.min(low, w.conf || 0); }, 100);
    }

    function textIn(box) {
      return words.filter(function (word) {
        var cx = (word.x0 + word.x1) / 2, cy = (word.y0 + word.y1) / 2;
        return cx >= box.x0 && cx <= box.x1 && cy >= box.y0 && cy <= box.y1;
      }).map(function (word) { return String(word.text).replace(/[^0-9A-Za-z]/g, ''); }).join('');
    }

    // 한 번 더 크게 읽어 볼 판을 고른다.
    //  급한 것: 아무것도 못 읽었거나 아는 코드도 편명도 아닌 판
    //           (KE0438 이 AL 로 읽히면 연차 휴가가 되어 버린다)
    //  다음:    편명 꼴이긴 한데 노선표에 없는 판. 숫자를 하나 잘못 읽었을 수 있다.
    //           (KE0891 을 KE0691 로 읽어도 편명 꼴이라 그냥 지나가던 것)
    // 비슷한 편명으로 갈아 끼우는 것이 아니다. 같은 자리를 더 크게 다시 읽을 뿐이다.
    var urgent = [];
    var suspect = [];
    chips.forEach(function (box) {
      var text = textIn(box);
      if (!text || !ocrlayout.isKnownCode(text)) { urgent.push(box); return; }
      if (!ocrlayout.isSettledCode(text)) { suspect.push(box); return; }
      // 자리는 잡혔지만 흐리게 읽힌 판도 한 번 더 본다
      if (confIn(box) < 80) suspect.push(box);
    });
    var missing = urgent.concat(suspect).slice(0, 18);           // 너무 많으면 오래 걸린다
    if (!missing.length) return Promise.resolve([]);
    var urgentCount = Math.min(urgent.length, missing.length);

    // 판이 유난히 높으면 글이 두 줄이다(KE0892 아래 TVL). 그런 판은 한 줄로 읽으라고
    // 하면 두 줄이 섞여 엉뚱한 편명이 나온다. 그래서 덩어리째 읽는 방식으로 바꾼다.
    var heights = chips.map(function (box) { return box.y1 - box.y0; })
      .sort(function (a, b) { return a - b; });
    var normalHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 0;

    var found = [];
    var zoom = 4;
    return missing.reduce(function (chain, box, at) {
      return chain.then(function () {
        var wasSettled = at >= urgentCount;                      // 편명 꼴은 읽혔던 판
        var w = Math.round((box.x1 - box.x0)), h = Math.round((box.y1 - box.y0));
        if (w < 8 || h < 8) return null;
        var canvas = document.createElement('canvas');
        canvas.width = w * zoom;
        canvas.height = h * zoom;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(prepared.canvas, box.x0, box.y0, w, h, 0, 0, canvas.width, canvas.height);
        // 한 줄로도 읽어 보고 낱말 하나로도 읽어 본다. 아는 코드가 나오는 쪽을 쓴다.
        var twoLines = normalHeight && h > normalHeight * 1.4;
        var modes = twoLines ? ['6', '4'] : (wasSettled ? ['7', '8'] : ['7', '8', '13']);
        var best = null;
        return modes.reduce(function (chain, mode) {
          return chain.then(function () {
            if (best && best.settled) return null;
            return worker.setParameters({ tessedit_pageseg_mode: mode })
              .then(function () { return worker.recognize(canvas, {}, { text: true }); })
              .then(function (result) {
                var text = String((result.data && result.data.text) || '').trim();
                if (!text) return null;
                var flat = text.replace(/\s+/g, '');
                var known = ocrlayout.isKnownCode(flat);
                var settled = ocrlayout.isSettledCode(flat);
                var conf = Math.round((result.data && result.data.confidence) || 0);
                // 아는 코드로 읽힌 것을 모르는 글자로 덮지 않는다
                var better = !best || (settled && !best.settled) || (known && !best.known) ||
                  (settled === best.settled && known === best.known && conf > best.conf);
                if (better) best = { text: text, conf: conf, known: known, settled: settled };
                return null;
              });
          });
        }, Promise.resolve()).then(function () {
          if (!best) return null;
          // 이미 편명 꼴로 읽혀 있던 판은, 다시 읽어 노선표에 있는 편이 나올 때만 바꾼다.
          // 더 흐린 결과로 멀쩡한 값을 덮지 않기 위해서다.
          if (wasSettled && !best.settled) return null;
          best.text.split(/\s+/).forEach(function (piece) {
            if (!piece) return;
            found.push({
              text: piece, conf: best.conf, tone: box.tone,
              x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1
            });
          });
          return null;
        });
      });
    }, Promise.resolve())
      .then(function () { return worker.setParameters({ tessedit_pageseg_mode: '11' }); })
      .then(function () { return found; });
  }

  /**
   * 한 판 안에서 두 조각으로 읽힌 글자를 도로 붙인다(KEO7 + 44 -> KE0744).
   * 붙여 봐서 아는 코드가 될 때만 붙인다. TVL 처럼 원래 두 줄인 판을 붙이면 안 된다.
   */
  function mergeWithinChip(words) {
    var byChip = {};
    words.forEach(function (word) {
      if (word.chip == null) return;
      (byChip[word.chip] = byChip[word.chip] || []).push(word);
    });

    var dropped = {};
    Object.keys(byChip).forEach(function (key) {
      var group = byChip[key];
      if (group.length < 2) return;
      var ordered = group.slice().sort(function (a, b) { return a.at - b.at; });
      var merged = ordered.map(function (word) { return word.text; }).join('');
      // 판 테두리를 괄호나 막대로 읽는 일이 잦다. 앞뒤에 붙은 것은 떼고 견줘 본다.
      var bare = merged.replace(/^[^A-Z0-9]+/, '').replace(/[^A-Z0-9]+$/, '');
      if (!ocrlayout.isKnownCode) return;
      if (ocrlayout.isKnownCode(merged)) ordered[0].text = merged;
      else if (bare && ocrlayout.isKnownCode(bare)) ordered[0].text = bare;
      else return;
      ordered.slice(1).forEach(function (word) { dropped[words.indexOf(word)] = true; });
    });

    return words.filter(function (word, index) { return !dropped[index]; });
  }

  /**
   * 글자를 하나도 못 얻은 근무 판이 몇 개인지 센다.
   *
   * 판은 찾았는데 글자가 안 나온 자리는 달력에서 그냥 빈 날이 된다. 빈 날은 근무가
   * 없는 날과 구별이 안 되니, 몇 개를 놓쳤는지 알려 주어야 확인할 수 있다.
   */
  function missedChips(prepared, words) {
    var chips = prepared.chips || [];
    if (!chips.length) return 0;
    var scale = prepared.crop.scale;
    var top = prepared.crop.top;
    var missed = 0;
    chips.forEach(function (chip) {
      var x0 = chip.x0 * scale, x1 = chip.x1 * scale;
      var y0 = (chip.y0 - top) * scale, y1 = (chip.y1 - top) * scale;
      var hit = words.some(function (word) {
        var cx = (word.x0 + word.x1) / 2, cy = (word.y0 + word.y1) / 2;
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
      });
      if (!hit) missed++;
    });
    return missed;
  }

  /** 다 쓴 인식기를 놓아준다. 메모리를 꽤 쓰기 때문이다. */
  function release() {
    if (!worker) return Promise.resolve();
    var done = worker.terminate();
    worker = null;
    return Promise.resolve(done);
  }

  return {
    available: available,
    read: read,
    release: release,
    scaleFor: scaleFor,
    enhance: enhance,
    unchip: unchip,
    toneOf: toneOf,
    upscale: upscale,
    BASE: BASE
  };
});
