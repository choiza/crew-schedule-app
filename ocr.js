// OCR.space API를 사용한 무료 OCR 기능
// API Key: 무료 키 (월 25,000회 제한)

const OCR_API_KEY = 'K87899142388957'; // 무료 테스트 키

async function performOCR(imageDataUrl) {
    try {
        // Base64 이미지를 Blob으로 변환
        const base64Data = imageDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        
        const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });
        
        // FormData 생성
        const formData = new FormData();
        formData.append('file', blob, 'schedule.png');
        formData.append('apikey', OCR_API_KEY);
        formData.append('language', 'kor');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');
        
        // OCR API 호출
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.IsErroredOnProcessing) {
            throw new Error(result.ErrorMessage || 'OCR 처리 실패');
        }
        
        return result.ParsedResults[0].ParsedText;
        
    } catch (error) {
        console.error('OCR 오류:', error);
        throw error;
    }
}

function parseScheduleText(ocrText) {
    const schedules = {};
    const lines = ocrText.split('\n').filter(line => line.trim());
    
    // 비행편명 패턴: KE + 4자리 숫자
    const flightPattern = /KE\s*(\d{4})/gi;
    // 시간 패턴: HH:MM
    const timePattern = /(\d{1,2}):(\d{2})/g;
    // 공항 코드 패턴: 3자리 대문자
    const airportPattern = /\b([A-Z]{3})\b/g;
    // 날짜 패턴
    const datePattern = /^(\d{1,2})$/;
    // 스케줄 타입
    const scheduleTypePattern = /\b(LO|ADO|ATDO|YVC)\b/gi;
    
    let currentDate = null;
    let detectedSchedules = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 날짜 감지
        const dateMatch = line.match(datePattern);
        if (dateMatch && parseInt(dateMatch[1]) <= 31) {
            const day = parseInt(dateMatch[1]);
            
            if (currentDate && detectedSchedules.length > 0) {
                schedules[currentDate] = [...detectedSchedules];
            }
            
            currentDate = day;
            detectedSchedules = [];
            continue;
        }
        
        // 비행편 감지
        const flightMatches = [...line.matchAll(flightPattern)];
        if (flightMatches.length > 0) {
            flightMatches.forEach(match => {
                const flightCode = `KE${match[1]}`;
                const timeMatches = [...line.matchAll(timePattern)];
                const airportMatches = [...line.matchAll(airportPattern)];
                
                const schedule = {
                    type: 'flight',
                    code: flightCode,
                    departure: timeMatches[0] ? `${timeMatches[0][1].padStart(2, '0')}:${timeMatches[0][2]}` : '09:00',
                    arrival: timeMatches[1] ? `${timeMatches[1][1].padStart(2, '0')}:${timeMatches[1][2]}` : '13:00',
                    origin: airportMatches[0] ? airportMatches[0][1] : 'ICN',
                    dest: airportMatches[1] ? airportMatches[1][1] : 'NRT'
                };
                
                detectedSchedules.push(schedule);
            });
        }
        
        // 스케줄 타입 감지
        const typeMatches = [...line.matchAll(scheduleTypePattern)];
        if (typeMatches.length > 0) {
            typeMatches.forEach(match => {
                const scheduleType = match[1].toLowerCase();
                detectedSchedules.push({
                    type: scheduleType,
                    label: match[1].toUpperCase()
                });
            });
        }
    }
    
    // 마지막 날짜 저장
    if (currentDate && detectedSchedules.length > 0) {
        schedules[currentDate] = [...detectedSchedules];
    }
    
    return schedules;
}

// 전역으로 노출
window.performOCR = performOCR;
window.parseScheduleText = parseScheduleText;
