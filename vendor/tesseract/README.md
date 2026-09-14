# 글자 인식기 (Tesseract)

스케줄 캡처를 기기 안에서 읽는 데 쓰는 파일들이다. 서버도 API 키도 쓰지 않으려고
앱 안에 담아 두었다. 손으로 고치는 파일이 아니라 받아 온 그대로다.

| 파일 | 무엇 | 출처 |
| --- | --- | --- |
| `tesseract.min.js` | 인식기 호출부 | tesseract.js 5.1.1 (Apache-2.0) |
| `worker.min.js` | 웹 워커 | tesseract.js 5.1.1 (Apache-2.0) |
| `tesseract-core-simd-lstm.wasm.js` | 인식 엔진 (LSTM, SIMD) | tesseract.js-core 5.x (Apache-2.0) |
| `eng.traineddata.gz` | 영문 학습 자료 | tessdata_fast (Apache-2.0) |

`gzip -9` 로 눌러 담은 학습 자료는 tesseract.js 가 알아서 푼다.

## 다시 받으려면

```bash
npm pack tesseract.js@5.1.1 tesseract.js-core@5.1.1
curl -L -o eng.traineddata \
  https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast@main/eng.traineddata
gzip -9 eng.traineddata
```

영문 자료만 담았다. 크루넷 스케줄에서 읽어야 하는 건 편명·공항·시각처럼 영문과
숫자뿐이고, 한글까지 담으면 2MB 가 더 붙는 데다 영문 인식이 되레 흔들리기 때문이다.
한글 낱말은 인식하지 못해 미리보기에서 알 수 없는 코드로 뜨는데, 거기서 지우면 된다.
