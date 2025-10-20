// app.js (no-bundler)
// 브라우저에서 바로 동작하도록 UMD 전역(React/ReactDOM/XLSX)을 사용합니다.
// '출근일' 버튼 클릭 시 '비고'에 '출근'이 포함된 날짜만 표시하고, 그 날짜에서도 '출근' 항목만 보여줍니다.
(function () {
  const { useState } = React;
  const { createRoot } = ReactDOM;

  function App() {
    const [data, setData] = useState([]);
    const [month, setMonth] = useState("");
    const [workOnly, setWorkOnly] = useState(false); // 출근일 필터

    function onFileChange(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const header = jsonData[0] || [];
        const rows = (jsonData.slice(1) || []).filter((r) => r && r.length);
        const parsed = rows.map((r) => {
          const obj = {};
          header.forEach((h, i) => (obj[h] = r[i]));
          return obj;
        });
        setData(parsed);

        if (parsed.length > 0 && parsed[0]["날짜"]) {
          const d = new Date(parsed[0]["날짜"]);
          if (!isNaN(d.getTime())) {
            const ym = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
            setMonth(ym);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function renderCalendar() {
      if (!data || data.length === 0) return null;

      // 날짜별 그룹핑
      const grouped = {};
      data.forEach((row) => {
        const date = row["날짜"];
        if (!date) return;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(row);
      });

      const sortedDates = Object.keys(grouped).sort(function (a, b) {
        return new Date(a) - new Date(b);
      });

      return React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4" },
        sortedDates.map(function (date) {
          const dayList = grouped[date] || [];

          // 출근일 모드: "비고"에 '출근' 포함된 행만 표시
          const filtered = workOnly
            ? dayList.filter(function (r) {
                return String(r["비고"] || "").indexOf("출근") !== -1;
              })
            : dayList;

          // 출근 항목이 없으면 해당 날짜를 표시하지 않음
          if (workOnly && filtered.length === 0) return null;

          // 출근일 모드에서는 출력 항목도 '출근'만 제한
          const itemsToShow = workOnly
            ? filtered.filter(function (r) { return String(r["비고"] || "").indexOf("출근") !== -1; })
            : filtered;

          return React.createElement(
            "div",
            { key: date, className: "rounded-xl border p-4 bg-white shadow-sm" },
            React.createElement("div", { className: "font-semibold mb-2" }, date),
            React.createElement(
              "ul",
              null,
              itemsToShow.map(function (row, idx) {
                return React.createElement(
                  "li",
                  { key: idx, className: "pl-2 list-disc" },
                  (row["이름"] || "") +
                    " - " +
                    (row["근무지"] || "") +
                    (row["비고"] ? " (" + row["비고"] + ")" : "")
                );
              })
            )
          );
        })
      );
    }

    return React.createElement(
      "div",
      { className: "max-w-5xl mx-auto p-4" },
      React.createElement(
        "header",
        { className: "flex items-center justify-between mb-4 no-print" },
        React.createElement("h1", { className: "text-2xl font-bold" }, "크루 스케줄"),
        React.createElement(
          "div",
          { className: "flex gap-2" },
          React.createElement(
            "button",
            {
              onClick: function () {
                setWorkOnly(function (prev) { return !prev; });
              },
              className: "bg-blue-600 text-white px-3 py-1 rounded"
            },
            workOnly ? "전체보기" : "출근일"
          ),
          React.createElement(
            "button",
            { onClick: function () { window.print(); }, className: "bg-gray-200 px-3 py-1 rounded" },
            "인쇄"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "mb-4 no-print" },
        React.createElement("input", { type: "file", accept: ".xlsx", onChange: onFileChange, className: "block" }),
        React.createElement("p", { className: "text-sm text-gray-600 mt-1" }, "엑셀(.xlsx) 파일을 선택하세요.")
      ),
      month ? React.createElement("h2", { className: "text-xl font-semibold mb-2" }, month + " 스케줄") : null,
      renderCalendar()
    );
  }

  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(App));
})();
