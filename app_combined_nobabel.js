
// app_combined_nobabel.js
// No JSX, no Babel. Works with UMD React/ReactDOM/XLSX and ocr.js (performOCR/parseScheduleText).

(function () {
  var useState = React.useState;
  var useMemo = React.useMemo;
  var createElement = React.createElement;
  var createRoot = ReactDOM.createRoot;

  function App() {
    var _useState = useState({}), schedules = _useState[0], setSchedules = _useState[1];
    var _useState2 = useState(new Date()), currentDate = _useState2[0], setCurrentDate = _useState2[1];
    var _useState3 = useState(null), selectedDate = _useState3[0], setSelectedDate = _useState3[1];
    var _useState4 = useState(false), showImageUpload = _useState4[0], setShowImageUpload = _useState4[1];
    var _useState5 = useState(new Date().getFullYear()), uploadYear = _useState5[0], setUploadYear = _useState5[1];
    var _useState6 = useState(new Date().getMonth() + 1), uploadMonth = _useState6[0], setUploadMonth = _useState6[1];
    var _useState7 = useState(null), uploadedImage = _useState7[0], setUploadedImage = _useState7[1];
    var _useState8 = useState(false), isProcessing = _useState8[0], setIsProcessing = _useState8[1];
    var _useState9 = useState(false), workOnly = _useState9[0], setWorkOnly = _useState9[1];

    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startingDayOfWeek = new Date(year, month, 1).getDay();
    var weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    function getDateKey(y, m, d) { return y + "-" + m + "-" + d; }
    function isWorkSchedule(item) {
      if (!item) return false;
      var t = (item.type || '').toLowerCase();
      return t === 'flight' || t === 'lo' ||
             String(item.label || '').indexOf('출근') !== -1 ||
             String(item.remarks || '').indexOf('출근') !== -1;
    }
    function getScheduleColor(type) {
      var t = (type || '').toLowerCase();
      if (t === 'flight') return 'bg-blue-100 text-blue-800';
      if (t === 'lo') return 'bg-green-100 text-green-800';
      if (t === 'ado' || t === 'atdo') return 'bg-yellow-100 text-yellow-800';
      if (t === 'yvc') return 'bg-purple-100 text-purple-800';
      return 'bg-gray-100 text-gray-800';
    }

    function handleImageUpload(ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file || !file.type || file.type.indexOf('image/') !== 0) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        setUploadedImage(dataUrl);
        setIsProcessing(true);
        Promise.resolve()
          .then(function(){ return window.performOCR(dataUrl); })
          .then(function(ocrText){ return window.parseScheduleText(ocrText); })
          .then(function(parsed){
            setSchedules(function(prev){
              var next = Object.assign({}, prev);
              Object.keys(next).forEach(function(k){
                var parts = k.split('-');
                var y = Number(parts[0]), m = Number(parts[1]);
                if (y === uploadYear && m === uploadMonth) delete next[k];
              });
              Object.keys(parsed || {}).forEach(function(dayStr){
                var dNum = Number(dayStr);
                if (!isNaN(dNum) && dNum >= 1 && dNum <= 31) {
                  var key = getDateKey(uploadYear, uploadMonth, dNum);
                  next[key] = parsed[dayStr];
                }
              });
              return next;
            });
            setCurrentDate(new Date(uploadYear, uploadMonth - 1, 1));
            alert('✅ 이미지에서 ' + Object.keys(parsed || {}).length + '일의 스케줄을 인식했습니다.');
          })
          .catch(function(err){
            console.error('OCR 처리 오류:', err);
            alert('❌ 이미지 분석에 실패했습니다. 다시 시도하거나 수동 입력을 사용하세요.');
          })
          .finally(function(){
            setIsProcessing(false);
            setShowImageUpload(false);
          });
      };
      reader.readAsDataURL(file);
    }

    var hasXLSX = typeof window !== 'undefined' && !!window.XLSX;
    function handleExcelUpload(ev) {
      if (!hasXLSX) { alert('XLSX 라이브러리가 로드되지 않았습니다.'); return; }
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        var header = json[0] || [];
        var rows = (json.slice(1) || []).filter(function(r){ return r && r.length; });

        var temp = {};
        rows.forEach(function(r){
          var o = {};
          header.forEach(function(h, i){ o[h] = r[i]; });
          var d = o['날짜'];
          if (!d) return;
          var asDate = new Date(d), dayNum;
          if (!isNaN(asDate.getTime())) dayNum = asDate.getDate(); else dayNum = Number(d);
          if (!dayNum || dayNum < 1 || dayNum > 31) return;
          if (!temp[dayNum]) temp[dayNum] = [];

          temp[dayNum].push({
            type: o.type || (String(o['비고'] || '').indexOf('출근') !== -1 ? 'lo' : 'other'),
            code: o.code || o['코드'] || '',
            label: o.label || o['라벨'] || o['비고'] || '',
            name: o['이름'] || '',
            place: o['근무지'] || '',
            remarks: o['비고'] || ''
          });
        });

        setSchedules(function(prev){
          var next = Object.assign({}, prev);
          Object.keys(next).forEach(function(k){
            var parts = k.split('-');
            var y = Number(parts[0]), m = Number(parts[1]);
            if (y === uploadYear && m === uploadMonth) delete next[k];
          });
          Object.keys(temp).forEach(function(dayStr){
            var dNum = Number(dayStr);
            var key = getDateKey(uploadYear, uploadMonth, dNum);
            next[key] = temp[dayStr];
          });
          return next;
        });

        setCurrentDate(new Date(uploadYear, uploadMonth - 1, 1));
        alert('✅ Excel에서 ' + Object.keys(temp).length + '일의 스케줄을 불러왔습니다.');
      };
      reader.readAsArrayBuffer(file);
    }

    var renderedCalendar = useMemo(function(){
      var cells = [];
      for (var i=0; i<startingDayOfWeek; i++) {
        cells.push(createElement('div', { key: 'empty-' + i, className: 'p-2' }));
      }
      for (var day=1; day<=daysInMonth; day++) {
        var dateKey = getDateKey(year, month+1, day);
        var daySchedules = schedules[dateKey] || [];
        var hasWork = daySchedules.some(isWorkSchedule);
        if (workOnly && !hasWork) continue;
        var items = workOnly ? daySchedules.filter(isWorkSchedule) : daySchedules;

        cells.push(createElement('div', {
          key: day,
          className: 'border border-gray-200 p-1 min-h-[110px] cursor-pointer hover:bg-gray-50',
          onClick: function(d){ return function(){ setSelectedDate(d); }; }(day)
        },
          createElement('div', { className: 'flex justify-between items-start mb-1' },
            createElement('span', { className: 'text-sm font-semibold' }, String(day)),
            hasWork ? createElement('span', { className: 'text-xs bg-green-600 text-white px-1 rounded' }, '출근') : null
          ),
          createElement('div', { className: 'space-y-1' },
            items.map(function(s, idx){
              return createElement('div', { key: idx, className: 'text-xs px-1 py-0.5 rounded ' + getScheduleColor(s.type) },
                s.type === 'flight' ? (s.code || 'FLIGHT') : (s.label || s.type || 'ITEM')
              );
            })
          )
        ));
      }
      return createElement('div', { className: 'grid grid-cols-7 gap-1' },
        weekDays.map(function(d){
          return createElement('div', { key: d, className: 'text-center font-bold p-2 bg-gray-100' }, d);
        })
      , cells);
    }, [startingDayOfWeek, daysInMonth, year, month, schedules, workOnly]);

    return createElement('div', { className: 'max-w-4xl mx-auto p-4 bg-white min-h-screen' },
      createElement('div', { className: 'bg-blue-900 text-white p-4 rounded-t-lg flex items-center justify-between' },
        createElement('div', { className: 'flex items-center gap-2' },
          createElement('span', { className: 'text-xl font-bold' }, '승무원 스케줄')
        ),
        createElement('div', { className: 'flex items-center gap-2' },
          createElement('button', {
            onClick: function(){ setWorkOnly(function(v){ return !v; }); },
            className: 'bg-white text-blue-900 px-3 py-1 rounded text-sm'
          }, workOnly ? '전체보기' : '출근일'),
          createElement('button', {
            onClick: function(){ setShowImageUpload(true); },
            className: 'bg-white text-blue-900 px-3 py-1 rounded text-sm'
          }, '이미지 업로드'),
          createElement('label', { className: 'bg-white text-blue-900 px-3 py-1 rounded text-sm cursor-pointer' },
            'Excel 업로드',
            createElement('input', { type: 'file', accept: '.xlsx', onChange: handleExcelUpload, className: 'hidden' })
          ),
          createElement('button', {
            onClick: function(){ window.print(); },
            className: 'bg-white text-blue-900 px-3 py-1 rounded text-sm'
          }, '인쇄')
        )
      ),
      !hasXLSX ? createElement('div', { className: 'mt-2 p-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded' },
        '⚠️ Excel 업로드를 사용하려면 index.html에 XLSX CDN을 추가하세요: ',
        createElement('code', { className: 'ml-1' }, 'https://unpkg.com/xlsx/dist/xlsx.full.min.js')
      ) : null,
      createElement('div', { className: 'bg-gray-50 p-4 flex justify-between items-center' },
        createElement('button', {
          onClick: function(){ setCurrentDate(new Date(year, month - 1, 1)); },
          className: 'px-3 py-1 bg-white rounded shadow'
        }, '←'),
        createElement('h2', { className: 'text-lg font-semibold' }, year + '년 ' + (month + 1) + '월'),
        createElement('button', {
          onClick: function(){ setCurrentDate(new Date(year, month + 1, 1)); },
          className: 'px-3 py-1 bg-white rounded shadow'
        }, '→')
      ),
      createElement('div', { className: 'mb-4' }, renderedCalendar),
      showImageUpload ? createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' },
        createElement('div', { className: 'bg-white rounded-lg p-6 max-w-md w-full' },
          createElement('h3', { className: 'text-lg font-bold mb-4' }, '스케줄 이미지 업로드'),
          createElement('p', { className: 'text-sm text-gray-600 mb-4' },
            'HANWAY Crewnet 스케줄 캡처 이미지를 업로드하세요.', createElement('br'),
            createElement('strong', { className: 'text-blue-600' }, '🤖 OCR 자동 분석:'), ' 이미지에서 텍스트를 추출해 자동 등록'
          ),
          createElement('div', { className: 'mb-4' },
            createElement('label', { className: 'block text-sm font-semibold mb-2' }, '업로드할 년도/월 선택'),
            createElement('div', { className: 'flex gap-2' },
              createElement('select', {
                value: uploadYear,
                onChange: function(e){ setUploadYear(Number(e.target.value)); },
                className: 'flex-1 p-2 border rounded'
              }, [2024,2025,2026,2027].map(function(y){
                return createElement('option', { key: y, value: y }, y + '년');
              })),
              createElement('select', {
                value: uploadMonth,
                onChange: function(e){ setUploadMonth(Number(e.target.value)); },
                className: 'flex-1 p-2 border rounded'
              }, [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){
                return createElement('option', { key: m, value: m }, m + '월');
              }))
            ),
            createElement('p', { className: 'text-xs text-gray-500 mt-1' }, '선택한 월의 기존 데이터는 삭제되고 인식된 데이터로 대체됩니다.')
          ),
          createElement('input', {
            type: 'file', accept: 'image/*', onChange: handleImageUpload,
            className: 'w-full p-2 border rounded mb-4', disabled: isProcessing
          }),
          isProcessing ? createElement('div', { className: 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded' },
            createElement('p', { className: 'text-sm text-blue-800' }, '🔄 이미지를 분석하고 있습니다...')
          ) : null,
          createElement('button', {
            onClick: function(){ setShowImageUpload(false); },
            className: 'w-full bg-gray-500 text-white py-2 rounded', disabled: isProcessing
          }, '닫기')
        )
      ) : null,
      uploadedImage ? createElement('div', { className: 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded' },
        createElement('div', { className: 'flex justify-between items-center mb-2' },
          createElement('h4', { className: 'font-semibold text-sm' }, '📸 최근 업로드된 스케줄 이미지'),
          createElement('button', { onClick: function(){ setUploadedImage(null); }, className: 'text-red-500 text-sm hover:underline' }, '삭제')
        ),
        createElement('img', {
          src: uploadedImage, alt: 'Schedule',
          className: 'w-full border rounded cursor-pointer hover:opacity-90',
          onClick: function(){ window.open(uploadedImage, '_blank'); }
        }),
        createElement('p', { className: 'text-xs text-gray-600 mt-2' }, '이미지를 클릭하면 새 창에서 크게 볼 수 있습니다')
      ) : null,
      selectedDate ? createElement('div', { className: 'bg-white border border-gray-300 rounded-lg p-4 mb-4' },
        createElement('h3', { className: 'font-bold text-lg mb-3' }, (month+1) + '월 ' + selectedDate + '일 상세'),
        (schedules[getDateKey(year, month+1, selectedDate)] || []).map(function(s, idx){
          return createElement('div', { key: idx, className: 'border-b pb-3 mb-3' },
            createElement('div', { className: 'flex justify-between items-start' },
              createElement('div', { className: 'flex-1' },
                createElement('div', { className: 'inline-block px-2 py-1 rounded mb-2 ' + getScheduleColor(s.type) },
                  s.type === 'flight' ? (s.code || 'FLIGHT') : (s.label || s.type)
                ),
                s.type === 'flight'
                  ? createElement('div', { className: 'text-sm space-y-1' },
                      createElement('div', { className: 'text-gray-700' },
                        (s.departure || '') + (s.arrival ? (' - ' + s.arrival) : '')
                      ),
                      (s.origin || s.dest)
                        ? createElement('div', { className: 'text-gray-600' },
                            String(s.origin || '').toUpperCase() + ' → ' + String(s.dest || '').toUpperCase()
                          )
                        : null
                    )
                  : null
              )
            )
          );
        }),
        createElement('button', {
          onClick: function(){ setSelectedDate(null); },
          className: 'w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded'
        }, '닫기')
      ) : null
    );
  }

  var root = createRoot(document.getElementById('root'));
  root.render(createElement(App));
})();
