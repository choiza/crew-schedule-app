import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { read, utils } from "xlsx";
import { useDropzone } from "react-dropzone";
import "./styles.css";

function App() {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState("");
  const [workOnly, setWorkOnly] = useState(false); // ✅ 출근일 필터 토글 상태

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = read(new Uint8Array(e.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws, { header: 1 });

      const header = jsonData[0];
      const rows = jsonData.slice(1).filter((r) => r.length);
      const parsed = rows.map((r) => {
        const obj = {};
        header.forEach((h, i) => (obj[h] = r[i]));
        return obj;
      });
      setData(parsed);

      // 자동으로 월 정보 추출
      if (parsed.length > 0 && parsed[0]["날짜"]) {
        const firstDate = new Date(parsed[0]["날짜"]);
        const ym = `${firstDate.getFullYear()}-${String(
          firstDate.getMonth() + 1
        ).padStart(2, "0")}`;
        setMonth(ym);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      ".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const renderCalendar = () => {
    if (!data || data.length === 0) return null;

    const grouped = {};
    data.forEach((row) => {
      const date = row["날짜"];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(row);
    });

    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return (
      <div className="calendar">
        {sortedDates.map((date) => {
          const dayList = grouped[date];

          // ✅ 출근일 모드에서는 '출근'이 포함된 행만 표시
          const filtered =
            workOnly === true
              ? dayList.filter((r) => String(r["비고"] || "").includes("출근"))
              : dayList;

          // ✅ 출근일 모드인데 해당 날짜에 출근이 없으면 스킵
          if (workOnly && filtered.length === 0) return null;

          return (
            <div key={date} className="day-cell">
              <div className="date-label">{date}</div>
              <ul>
                {filtered.map((row, idx) => (
                  <li key={idx}>
                    {row["이름"]} - {row["근무지"]} ({row["비고"]})
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>크루 스케줄</h1>
        <div className="actions">
          <button
            onClick={() => setWorkOnly((prev) => !prev)}
            className="btn"
          >
            {workOnly ? "전체보기" : "출근일"}
          </button>
          <button
            onClick={() => window.print()}
            className="btn secondary"
          >
            인쇄
          </button>
        </div>
      </header>

      <main>
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>파일을 여기에 놓으세요...</p>
          ) : (
            <p>스케줄 Excel 파일을 끌어다 놓거나 클릭하여 업로드하세요</p>
          )}
        </div>

        {month && <h2>{month} 스케줄</h2>}
        {renderCalendar()}
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
