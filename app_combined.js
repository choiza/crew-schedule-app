// app.js (combined: OCR + Excel, no bundler, works with in-browser Babel)
// Requirements in index.html:
//  - React/ReactDOM UMD
//  - Babel standalone (type="text/babel" to enable JSX here)
//  - (Optional) XLSX UMD for Excel: <script src="https://unpkg.com/xlsx/dist/xlsx.full.min.js"></script>
//  - ocr.js must define window.performOCR(imageDataUrl) and window.parseScheduleText(ocrText)

const { useState, useMemo } = React;

function App() {
  // ---- State ----
  const [schedules, setSchedules] = useState({}); // { "YYYY-M-D": [ {type, ...}, ... ] }
  const [currentDate, setCurrentDate] = useState(new Date()); // month cursor
  const [selectedDate, setSelectedDate] = useState(null);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploadMonth, setUploadMonth] = useState(new Date().getMonth() + 1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [workOnly, setWorkOnly] = useState(false);

  // ---- Calendar helpers ----
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  function getDateKey(y, m, d) {
    return `${y}-${m}-${d}`; // no leading zeros for simplicity
  }

  function isWorkSchedule(item) {
    // Consider 'flight' and 'lo' as work (출근). Adjust if your data differs.
    return item && (item.type === 'flight' || item.type === 'lo' || String(item.label || '').includes('출근') || String(item.remarks || '').includes('출근'));
  }

  function getScheduleColor(type) {
    switch ((type || '').toLowerCase()) {
      case 'flight': return 'bg-blue-100 text-blue-800';
      case 'lo': return 'bg-green-100 text-green-800';
      case 'ado':
      case 'atdo': return 'bg-yellow-100 text-yellow-800';
      case 'yvc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // ---- OCR Image Upload ----
  const handleImageUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setUploadedImage(dataUrl);
      setIsProcessing(true);

      try {
        // 1) OCR
        const ocrText = await window.performOCR(dataUrl);
        // 2) Parse text -> { dayNumber: [schedules] }
        const parsed = await window.parseScheduleText(ocrText);

        // 3) Merge into schedules state (remove same year-month first)
        setSchedules(prev => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            const [y, m] = k.split('-').map(Number);
            if (y === uploadYear && m === uploadMonth) delete next[k];
          });
          Object.keys(parsed || {}).forEach((dayStr) => {
            const dNum = Number(dayStr);
            if (!isNaN(dNum) && dNum > 0 && dNum <= 31) {
              const key = getDateKey(uploadYear, uploadMonth, dNum);
              next[key] = parsed[dayStr];
            }
          });
          return next;
        });

        setCurrentDate(new Date(uploadYear, uploadMonth - 1, 1));
        alert(`✅ 이미지에서 ${Object.keys(parsed || {}).length}일의 스케줄을 인식했습니다.`);
      } catch (err) {
        console.error('OCR 처리 오류:', err);
        alert('❌ 이미지 분석에 실패했습니다. 스케줄을 수동으로 입력하거나 다시 시도해 주세요.');
      } finally {
        setIsProcessing(false);
        setShowImageUpload(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ---- Excel Upload (optional if XLSX present) ----
  const hasXLSX = typeof window !== 'undefined' && !!window.XLSX;
  const handleExcelUpload = (ev) => {
    if (!hasXLSX) {
      alert('XLSX 라이브러리가 로드되지 않았습니다.\nindex.html에 XLSX 스크립트를 추가하세요.');
      return;
    }
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const header = json[0] || [];
      const rows = (json.slice(1) || []).filter(r => r && r.length);

      const parsed = rows.map((r) => {
        const o = {};
        header.forEach((h, i) => o[h] = r[i]);
        return o;
      });

      // Expect columns like: 날짜, 이름, 근무지, 비고, type/code... (flexible)
      // Group by day from "날짜" column
      const temp = {}; // { day: [ items ] }
      parsed.forEach((row) => {
        const d = row['날짜'];
        if (!d) return;
        // Normalize: if 날짜 is like "2025-10-02", try to extract day; else assume day number
        let dayNum;
        const asDate = new Date(d);
        if (!isNaN(asDate.getTime())) {
          dayNum = asDate.getDate();
        } else {
          dayNum = Number(d);
        }
        if (!dayNum || dayNum < 1 || dayNum > 31) return;

        if (!temp[dayNum]) temp[dayNum] = [];
        // Coerce to schedule shape
        temp[dayNum].push({
          type: row.type || (String(row['비고'] || '').includes('출근') ? 'lo' : 'other'),
          code: row.code || row['코드'] || '',
          label: row.label || row['라벨'] || row['비고'] || '',
          name: row['이름'] || '',
          place: row['근무지'] || '',
          remarks: row['비고'] || ''
        });
      });

      setSchedules(prev => {
        const next = { ...prev };
        // Clear same year-month
        Object.keys(next).forEach((k) => {
          const [y, m] = k.split('-').map(Number);
          if (y === uploadYear && m === uploadMonth) delete next[k];
        });
        // Insert
        Object.keys(temp).forEach((dayStr) => {
          const dNum = Number(dayStr);
          const key = getDateKey(uploadYear, uploadMonth, dNum);
          next[key] = temp[dayStr];
        });
        return next;
      });

      setCurrentDate(new Date(uploadYear, uploadMonth - 1, 1));
      alert(`✅ Excel에서 ${Object.keys(temp).length}일의 스케줄을 불러왔습니다.`);
    };
    reader.readAsArrayBuffer(file);
  };

  // ---- Calendar Render ----
  const renderedCalendar = useMemo(() => {
    const cells = [];

    // leading blanks
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(year, month + 1, day);
      const daySchedules = schedules[dateKey] || [];

      const hasWork = daySchedules.some(isWorkSchedule);
      if (workOnly && !hasWork) {
        // skip rendering non-work days
        continue;
      }

      // items shown
      const items = workOnly ? daySchedules.filter(isWorkSchedule) : daySchedules;

      cells.push(
        <div
          key={day}
          className="border border-gray-200 p-1 min-h-[110px] cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedDate(day)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-sm font-semibold">{day}</span>
            {hasWork && (
              <span className="text-xs bg-green-600 text-white px-1 rounded">출근</span>
            )}
          </div>
          <div className="space-y-1">
            {items.map((s, idx) => (
              <div key={idx} className={`text-xs px-1 py-0.5 rounded ${getScheduleColor(s.type)}`}>
                {s.type === 'flight' ? (s.code || 'FLIGHT') : (s.label || s.type || 'ITEM')}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center font-bold p-2 bg-gray-100">{d}</div>
        ))}
        {cells}
      </div>
    );
  }, [startingDayOfWeek, daysInMonth, year, month, schedules, workOnly]);

  // ---- UI ----
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white min-h-screen">
      <div className="bg-blue-900 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">승무원 스케줄</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWorkOnly((v) => !v)} className="bg-white text-blue-900 px-3 py-1 rounded text-sm">
            {workOnly ? '전체보기' : '출근일'}
          </button>
          <button onClick={() => setShowImageUpload(true)} className="bg-white text-blue-900 px-3 py-1 rounded text-sm">
            이미지 업로드
          </button>
          <label className="bg-white text-blue-900 px-3 py-1 rounded text-sm cursor-pointer">
            Excel 업로드
            <input type="file" accept=".xlsx" onChange={handleExcelUpload} className="hidden" />
          </label>
          <button onClick={() => window.print()} className="bg-white text-blue-900 px-3 py-1 rounded text-sm">
            인쇄
          </button>
        </div>
      </div>

      {!hasXLSX && (
        <div className="mt-2 p-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded">
          ⚠️ Excel 업로드를 사용하려면 index.html에 XLSX CDN을 추가하세요:
          <code className="ml-1">https://unpkg.com/xlsx/dist/xlsx.full.min.js</code>
        </div>
      )}

      <div className="bg-gray-50 p-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="px-3 py-1 bg-white rounded shadow"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="px-3 py-1 bg-white rounded shadow"
        >
          →
        </button>
      </div>

      <div className="mb-4">{renderedCalendar}</div>

      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">스케줄 이미지 업로드</h3>
            <p className="text-sm text-gray-600 mb-4">
              HANWAY Crewnet 스케줄 캡처 이미지를 업로드하세요.
              <br />
              <strong className="text-blue-600">🤖 OCR 자동 분석:</strong> 이미지에서 텍스트를 추출해 자동 등록
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">업로드할 년도/월 선택</label>
              <div className="flex gap-2">
                <select
                  value={uploadYear}
                  onChange={(e) => setUploadYear(Number(e.target.value))}
                  className="flex-1 p-2 border rounded"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={uploadMonth}
                  onChange={(e) => setUploadMonth(Number(e.target.value))}
                  className="flex-1 p-2 border rounded"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                선택한 월의 기존 데이터는 삭제되고 인식된 데이터로 대체됩니다.
              </p>
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full p-2 border rounded mb-4" disabled={isProcessing} />
            {isProcessing && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">🔄 이미지를 분석하고 있습니다...</p>
              </div>
            )}
            <button onClick={() => setShowImageUpload(false)} className="w-full bg-gray-500 text-white py-2 rounded" disabled={isProcessing}>
              닫기
            </button>
          </div>
        </div>
      )}

      {uploadedImage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">📸 최근 업로드된 스케줄 이미지</h4>
            <button onClick={() => setUploadedImage(null)} className="text-red-500 text-sm hover:underline">삭제</button>
          </div>
          <img
            src={uploadedImage}
            alt="Schedule"
            className="w-full border rounded cursor-pointer hover:opacity-90"
            onClick={() => window.open(uploadedImage, '_blank')}
          />
          <p className="text-xs text-gray-600 mt-2">이미지를 클릭하면 새 창에서 크게 볼 수 있습니다</p>
        </div>
      )}

      {selectedDate && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-lg mb-3">{month + 1}월 {selectedDate}일 상세</h3>
          {(schedules[getDateKey(year, month + 1, selectedDate)] || []).map((schedule, idx) => (
            <div key={idx} className="border-b pb-3 mb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className={`inline-block px-2 py-1 rounded mb-2 ${getScheduleColor(schedule.type)}`}>
                    {schedule.type === 'flight' ? (schedule.code || 'FLIGHT') : (schedule.label || schedule.type)}
                  </div>
                  {schedule.type === 'flight' && (
                    <div className="text-sm space-y-1">
                      <div className="text-gray-700">
                        {schedule.departure || ''}{schedule.arrival ? ` - ${schedule.arrival}` : ''}
                      </div>
                      {(schedule.origin || schedule.dest) && (
                        <div className="text-gray-600">
                          {(schedule.origin || '').toUpperCase()} → {(schedule.dest || '').toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSelectedDate(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
