const { useState } = React;

// 아이콘 컴포넌트들
const Calendar = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const Clock = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const Bus = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6v6M15 6v6M2 12h19.6"></path>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
        <circle cx="7" cy="18" r="2"></circle>
        <circle cx="16" cy="18" r="2"></circle>
    </svg>
);

const Plus = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const Trash2 = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const CrewScheduleApp = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));
    const [schedules, setSchedules] = useState({
        '2025-11-1': [{ type: 'flight', code: 'KE0625', departure: '20:05', arrival: '23:30', origin: 'ICN', dest: 'MNL' }],
        '2025-11-2': [{ type: 'lo', label: 'LO' }],
        '2025-11-3': [{ type: 'flight', code: 'KE0626', departure: '00:50', arrival: '06:10', origin: 'MNL', dest: 'ICN' }],
        '2025-11-4': [{ type: 'ado', label: 'ADO' }],
        '2025-11-5': [{ type: 'ado', label: 'ADO' }],
        '2025-11-6': [
            { type: 'flight', code: 'KE1043', departure: '19:50', arrival: '23:40', origin: 'ICN', dest: 'BKK' },
            { type: 'flight', code: 'KE1184', departure: '01:15', arrival: '03:25', origin: 'BKK', dest: 'SGN' }
        ],
        '2025-11-7': [
            { type: 'flight', code: 'KE1358', departure: '18:30', arrival: '01:35', origin: 'SGN', dest: 'ICN' },
            { type: 'lo', label: 'LO' }
        ],
        '2025-11-8': [{ type: 'lo', label: 'LO' }],
        '2025-11-9': [
            { type: 'flight', code: 'KE2001', departure: '09:30', arrival: '15:10', origin: 'ICN', dest: 'SIN' },
            { type: 'flight', code: 'KE2002', departure: '16:40', arrival: '21:50', origin: 'SIN', dest: 'ICN' }
        ],
        '2025-11-10': [{ type: 'atdo', label: 'ATDO' }],
        '2025-11-11': [{ type: 'yvc', label: 'YVC' }],
        '2025-11-12': [{ type: 'yvc', label: 'YVC' }],
        '2025-11-13': [{ type: 'yvc', label: 'YVC' }],
        '2025-11-14': [{ type: 'ado', label: 'ADO' }],
        '2025-11-15': [
            { type: 'flight', code: 'KE0081', departure: '18:00', arrival: '13:00', origin: 'ICN', dest: 'LAX' },
            { type: 'lo', label: 'LO' }
        ],
        '2025-11-16': [{ type: 'lo', label: 'LO' }],
        '2025-11-17': [{ type: 'flight', code: 'KE0086', departure: '16:30', arrival: '21:35', origin: 'LAX', dest: 'ICN' }],
        '2025-11-18': [{ type: 'flight', code: 'KE0086', departure: '23:30', arrival: '05:35', origin: 'ICN', dest: 'LAX' }],
        '2025-11-19': [{ type: 'atdo', label: 'ATDO' }],
        '2025-11-20': [{ type: 'atdo', label: 'ATDO' }],
        '2025-11-21': [
            { type: 'flight', code: 'KE2041', departure: '08:55', arrival: '12:15', origin: 'ICN', dest: 'HKG' },
            { type: 'flight', code: 'KE2042', departure: '13:55', arrival: '17:55', origin: 'HKG', dest: 'ICN' }
        ],
        '2025-11-22': [{ type: 'atdo', label: 'ATDO' }],
        '2025-11-23': [{ type: 'ado', label: 'ADO' }],
        '2025-11-24': [
            { type: 'flight', code: 'KE0859', departure: '19:30', arrival: '08:15', origin: 'ICN', dest: 'SYD' },
            { type: 'flight', code: 'KE2256', departure: '10:00', arrival: '11:30', origin: 'SYD', dest: 'MEL' }
        ],
        '2025-11-25': [
            { type: 'flight', code: 'KE1823', departure: '22:30', arrival: '07:10', origin: 'MEL', dest: 'ICN' },
            { type: 'lo', label: 'LO' }
        ],
        '2025-11-26': [
            { type: 'lo', label: 'LO' },
            { type: 'flight', code: 'KE2129', departure: '13:45', arrival: '15:35', origin: 'ICN', dest: 'TPE' },
            { type: 'flight', code: 'KE2130', departure: '16:55', arrival: '19:10', origin: 'TPE', dest: 'MNL' },
            { type: 'flight', code: 'KE1826', departure: '20:30', arrival: '01:00', origin: 'MNL', dest: 'ICN' }
        ],
        '2025-11-27': [
            { type: 'flight', code: 'KE2103', departure: '08:55', arrival: '12:40', origin: 'ICN', dest: 'BKK' },
            { type: 'flight', code: 'KE2104', departure: '14:00', arrival: '20:50', origin: 'BKK', dest: 'ICN' }
        ],
        '2025-11-28': [{ type: 'ado', label: 'ADO' }],
        '2025-11-29': [{ type: 'ado', label: 'ADO' }],
        '2025-11-30': [
            { type: 'flight', code: 'KE0651', departure: '09:00', arrival: '11:05', origin: 'ICN', dest: 'FUK' },
            { type: 'lo', label: 'LO' }
        ],
    });

    const [selectedDate, setSelectedDate] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        type: 'flight',
        code: '',
        departure: '',
        arrival: '',
        origin: 'ICN',
        dest: ''
    });

    const [showImageUpload, setShowImageUpload] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadYear, setUploadYear] = useState(2025);
    const [uploadMonth, setUploadMonth] = useState(11);
    const [isProcessing, setIsProcessing] = useState(false);
  // 헬퍼 함수들
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const getScheduleColor = (type) => {
        const colors = {
            flight: 'bg-blue-500 text-white',
            lo: 'bg-cyan-300 text-gray-800',
            ado: 'bg-lime-500 text-gray-800',
            atdo: 'bg-yellow-500 text-gray-800',
            yvc: 'bg-red-400 text-white'
        };
        return colors[type] || 'bg-gray-300';
    };

    const getLimousinLink = (schedule, selectedDate) => {
        const isFromICN = schedule.origin === 'ICN';
        const isToICN = schedule.dest === 'ICN';
        if (!isFromICN && !isToICN) return null;

        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        const time = isFromICN ? schedule.departure : schedule.arrival;
        const [hour, minute] = time.split(':');

        if (isFromICN) {
            const departureHour = parseInt(hour);
            const limousinHour = departureHour >= 2 ? departureHour - 2 : 22 + departureHour;
            const limousinTime = `${String(limousinHour).padStart(2, '0')}:${minute}`;
            return `https://www.bustago.or.kr/newweb/kr/reservation/reservation_02.do?dep=성남(미금)&arr=인천공항&date=${dateStr}&time=${limousinTime}`;
        } else {
            return `https://www.bustago.or.kr/newweb/kr/reservation/reservation_02.do?dep=인천공항&arr=성남(미금)&date=${dateStr}&time=${time}`;
        }
    };

    const addSchedule = () => {
        if (!selectedDate) return;
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${selectedDate}`;
        const existing = schedules[dateKey] || [];
        setSchedules({ ...schedules, [dateKey]: [...existing, { ...newSchedule }] });
        setShowAddForm(false);
        setNewSchedule({ type: 'flight', code: '', departure: '', arrival: '', origin: 'ICN', dest: '' });
    };

    const deleteSchedule = (date, index) => {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${date}`;
        const updated = [...(schedules[dateKey] || [])];
        updated.splice(index, 1);
        if (updated.length === 0) {
            const newSchedules = { ...schedules };
            delete newSchedules[dateKey];
            setSchedules(newSchedules);
        } else {
            setSchedules({ ...schedules, [dateKey]: updated });
        }
    };

    const exportToCalendar = () => {
        let calendarText = '승무원 스케줄\n\n';
        Object.keys(schedules).forEach(dateKey => {
            const daySchedules = schedules[dateKey];
            const hasWork = daySchedules.some(s => s.type === 'flight' || s.type === 'lo');
            if (hasWork) calendarText += `${dateKey}: 출근\n`;
        });
        alert(calendarText);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                setUploadedImage(e.target.result);
                setIsProcessing(true);
                
                try {
                    alert('이미지 분석을 시작합니다. 10-20초 정도 소요됩니다...');
                    
                    // OCR 실행
                    const ocrText = await window.performOCR(e.target.result);
                    console.log('OCR 결과:', ocrText);
                    
                    // 텍스트 파싱
                    const parsedSchedules = window.parseScheduleText(ocrText);
                    console.log('파싱 결과:', parsedSchedules);
                    
                    // 스케줄 업데이트
                    const updatedSchedules = { ...schedules };
                    
                    // 해당 월의 기존 데이터 삭제
                    Object.keys(updatedSchedules).forEach(key => {
                        const [y, m] = key.split('-').map(Number);
                        if (y === uploadYear && m === uploadMonth) {
                            delete updatedSchedules[key];
                        }
                    });
                    
                    // 새 데이터 추가
                    Object.keys(parsedSchedules).forEach(day => {
                        const dateKey = `${uploadYear}-${uploadMonth}-${day}`;
                        updatedSchedules[dateKey] = parsedSchedules[day];
                    });
                    
                    setSchedules(updatedSchedules);
                    setCurrentDate(new Date(uploadYear, uploadMonth - 1, 1));
                    
                    alert(`✅ ${Object.keys(parsedSchedules).length}일의 스케줄을 인식했습니다!\n\n비행편 상세 정보는 확인 후 수정해주세요.`);
                    
                } catch (error) {
                    console.error('OCR 처리 오류:', error);
                    alert('❌ 이미지 분석에 실패했습니다.\n수동으로 일정을 입력해주세요.');
                }
                
                setIsProcessing(false);
                setShowImageUpload(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderCalendar = () => {
        const days = [];
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
            const daySchedules = schedules[dateKey] || [];
            const hasWork = daySchedules.some(s => s.type === 'flight' || s.type === 'lo');

            days.push(
                <div key={day} className="border border-gray-200 p-1 min-h-[100px] cursor-pointer hover:bg-gray-50" onClick={() => setSelectedDate(day)}>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold">{day}</span>
                        {hasWork && <span className="text-xs bg-green-500 text-white px-1 rounded">출근</span>}
                    </div>
                    <div className="space-y-1">
                        {daySchedules.map((schedule, idx) => (
                            <div key={idx} className={`text-xs px-1 py-0.5 rounded ${getScheduleColor(schedule.type)}`}>
                                {schedule.type === 'flight' ? schedule.code : schedule.label}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-bold p-2 bg-gray-100">{day}</div>
                ))}
                {days}
            </div>
        );
    };
return (
        <div className="max-w-4xl mx-auto p-4 bg-white min-h-screen">
            <div className="bg-blue-900 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={24} />
                    <h1 className="text-xl font-bold">HANWAY Crewnet</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImageUpload(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                        <Plus size={16} />
                        이미지
                    </button>
                    <button onClick={exportToCalendar} className="bg-white text-blue-900 px-3 py-1 rounded text-sm">
                        출근일
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-between items-center">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="px-3 py-1 bg-white rounded shadow">←</button>
                <h2 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="px-3 py-1 bg-white rounded shadow">→</button>
            </div>

            <div className="mb-4">{renderCalendar()}</div>

            {showImageUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">스케줄 이미지 업로드</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            HANWAY Crewnet 스케줄 캡처 이미지를 업로드하세요.
                            <br/>
                            <strong className="text-blue-600">🤖 OCR 자동 분석:</strong> 무료 API로 텍스트 추출
                            <br/>
                            <span className="text-xs text-amber-600">💡 인식 후 비행편 정보를 확인해주세요</span>
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">업로드할 년도/월 선택</label>
                            <div className="flex gap-2">
                                <select value={uploadYear} onChange={(e) => setUploadYear(Number(e.target.value))} className="flex-1 p-2 border rounded">
                                    <option value={2024}>2024년</option>
                                    <option value={2025}>2025년</option>
                                    <option value={2026}>2026년</option>
                                </select>
                                <select value={uploadMonth} onChange={(e) => setUploadMonth(Number(e.target.value))} className="flex-1 p-2 border rounded">
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                        <option key={m} value={m}>{m}월</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                선택한 월의 기존 데이터는 모두 삭제되고 새로운 데이터로 대체됩니다.
                            </p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full p-2 border rounded mb-4" disabled={isProcessing} />
                        {isProcessing && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800">
                                    🔄 이미지를 분석하고 있습니다... 잠시만 기다려주세요.
                                </p>
                            </div>
                        )}
                        <button onClick={() => setShowImageUpload(false)} className="w-full bg-gray-500 text-white py-2 rounded" disabled={isProcessing}>닫기</button>
                    </div>
                </div>
            )}

            {uploadedImage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm">📸 최근 업로드된 스케줄 이미지</h4>
                        <button onClick={() => setUploadedImage(null)} className="text-red-500 text-sm hover:underline">삭제</button>
                    </div>
                    <img src={uploadedImage} alt="Schedule" className="w-full border rounded cursor-pointer hover:opacity-90" onClick={() => window.open(uploadedImage, '_blank')} />
                    <p className="text-xs text-gray-600 mt-2">💡 이미지를 클릭하면 새 창에서 크게 볼 수 있습니다</p>
                </div>
            )}

            {selectedDate && (
                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-lg mb-3">{currentDate.getMonth() + 1}월 {selectedDate}일 상세</h3>

                    {schedules[`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${selectedDate}`]?.map((schedule, idx) => (
                        <div key={idx} className="border-b pb-3 mb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className={`inline-block px-2 py-1 rounded mb-2 ${getScheduleColor(schedule.type)}`}>
                                        {schedule.type === 'flight' ? schedule.code : schedule.label}
                                    </div>
                                    {schedule.type === 'flight' && (
                                        <div className="text-sm space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} />
                                                <span>{schedule.departure} - {schedule.arrival}</span>
                                            </div>
                                            <div className="text-gray-600">{schedule.origin} → {schedule.dest}</div>
                                            {getLimousinLink(schedule, selectedDate) && (
                                                <a href={getLimousinLink(schedule, selectedDate)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline mt-2">
                                                    <Bus size={16} />
                                                    <span>{schedule.origin === 'ICN' ? '성남(미금) → 인천공항 T2' : '인천공항 T2 → 성남(미금)'} 리무진 예약</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => deleteSchedule(selectedDate, idx)} className="text-red-500 p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 w-full justify-center">
                        <Plus size={18} />
                        일정 추가
                    </button>

                    {showAddForm && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                            <div className="space-y-3">
                                <select value={newSchedule.type} onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value})} className="w-full p-2 border rounded">
                                    <option value="flight">비행</option>
                                    <option value="lo">LO</option>
                                    <option value="ado">ADO</option>
                                    <option value="atdo">ATDO</option>
                                    <option value="yvc">YVC</option>
                                </select>
                                {newSchedule.type === 'flight' ? (
                                    <>
                                        <input type="text" placeholder="비행편명 (예: KE0625)" value={newSchedule.code} onChange={(e) => setNewSchedule({...newSchedule, code: e.target.value})} className="w-full p-2 border rounded" />
                                        <input type="time" value={newSchedule.departure} onChange={(e) => setNewSchedule({...newSchedule, departure: e.target.value})} className="w-full p-2 border rounded" />
                                        <input type="time" value={newSchedule.arrival} onChange={(e) => setNewSchedule({...newSchedule, arrival: e.target.value})} className="w-full p-2 border rounded" />
                                        <select value={newSchedule.origin} onChange={(e) => setNewSchedule({...newSchedule, origin: e.target.value})} className="w-full p-2 border rounded">
                                            <option value="ICN">ICN (인천)</option>
                                            <option value="NRT">NRT (나리타)</option>
                                            <option value="BKK">BKK (방콕)</option>
                                            <option value="SGN">SGN (호치민)</option>
                                            <option value="SIN">SIN (싱가포르)</option>
                                            <option value="HKG">HKG (홍콩)</option>
                                            <option value="MNL">MNL (마닐라)</option>
                                            <option value="TPE">TPE (타이베이)</option>
                                            <option value="LAX">LAX (LA)</option>
                                            <option value="SYD">SYD (시드니)</option>
                                            <option value="MEL">MEL (멜버른)</option>
                                            <option value="FUK">FUK (후쿠오카)</option>
                                        </select>
                                        <select value={newSchedule.dest} onChange={(e) => setNewSchedule({...newSchedule, dest: e.target.value})} className="w-full p-2 border rounded">
                                            <option value="">도착지 선택</option>
                                            <option value="ICN">ICN (인천)</option>
                                            <option value="NRT">NRT (나리타)</option>
                                            <option value="BKK">BKK (방콕)</option>
                                            <option value="SGN">SGN (호치민)</option>
                                            <option value="SIN">SIN (싱가포르)</option>
                                            <option value="HKG">HKG (홍콩)</option>
                                            <option value="MNL">MNL (마닐라)</option>
                                            <option value="TPE">TPE (타이베이)</option>
                                            <option value="LAX">LAX (LA)</option>
                                            <option value="SYD">SYD (시드니)</option>
                                            <option value="MEL">MEL (멜버른)</option>
                                            <option value="FUK">FUK (후쿠오카)</option>
                                        </select>
                                    </>
                                ) : (
                                    <input type="text" placeholder="라벨" value={newSchedule.label || ''} onChange={(e) => setNewSchedule({...newSchedule, label: e.target.value})} className="w-full p-2 border rounded" />
                                )}
                                <button onClick={addSchedule} className="w-full bg-green-600 text-white py-2 rounded">저장</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
<div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                <h4 className="font-bold mb-2">범례</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>비행편</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-cyan-300 rounded"></div>
                        <span>LO</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-lime-500 rounded"></div>
                        <span>ADO</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span>ATDO</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-400 rounded"></div>
                        <span>YVC</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>출근일</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<CrewScheduleApp />, document.getElementById('root'));
