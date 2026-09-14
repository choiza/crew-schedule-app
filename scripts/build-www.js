#!/usr/bin/env node
'use strict';
// 앱(안드로이드)에 넣을 웹 파일을 www/ 로 모은다. 앱은 www/index.html 로 시작한다.
//   node scripts/build-www.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www');

const FILES = ['family.html', 'family.css', 'family.webmanifest'];
const DIRS = ['src', 'icons', 'vendor'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

FILES.forEach((name) => fs.copyFileSync(path.join(ROOT, name), path.join(OUT, name)));
DIRS.forEach((dir) => fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true }));

// 시작 화면. 주소가 바뀌지 않도록 family.html 을 그대로 index.html 로도 둔다.
fs.copyFileSync(path.join(ROOT, 'family.html'), path.join(OUT, 'index.html'));

console.log('www 준비:', FILES.length + 1, '개 파일,', DIRS.join(', '));
