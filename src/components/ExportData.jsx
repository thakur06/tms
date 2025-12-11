import { useState } from "react";
import DatePicker from "react-datepicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function TimeReport() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Fetch report from backend
  const fetchReport = async () => {
    if (!startDate || !endDate) return alert("Select both dates");

    const formattedStart = startDate.toISOString().split("T")[0];
    const formattedEnd = endDate.toISOString().split("T")[0];

    const res = await fetch(
      `http://localhost:4000/api/report?start=${formattedStart}&end=${formattedEnd}`
    );
    const data = await res.json();
    setReportData(data);
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!reportData) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Time Report");

    // Header
    sheet.addRow(["Start Date", reportData.startDate]);
    sheet.addRow(["End Date", reportData.endDate]);
    sheet.addRow([]);
    sheet.addRow(["User", "Total Hours", "Total Minutes"]);
    
    // Users summary
    reportData.users.forEach((u) => {
      sheet.addRow([u.user_name, u.total_hours, u.total_minutes]);
    });

    sheet.addRow([]);
    sheet.addRow(["Detailed Entries"]);
    sheet.addRow([
      "User",
      "Date",
      "Task ID",
      "Project",
      "Hours",
      "Minutes",
      "Location",
      "Remarks"
    ]);

    // Detailed entries under each user
    reportData.users.forEach((u) => {
      u.entries.forEach((e) => {
        sheet.addRow([
          u.user_name,
          e.date,
          e.task_id,
          e.project,
          e.hours,
          e.minutes,
          e.location,
          e.remarks
        ]);
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "Time_Report.xlsx");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">User Time Report</h2>

      {/* Date Pickers */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block mb-1 font-medium">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="border p-2 rounded"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="border p-2 rounded"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Fetch Report
        </button>

        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={!reportData}
        >
          Export Excel
        </button>
      </div>

      {/* Display Result */}
      {reportData && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Report Summary</h3>
          <p>
            <strong>Start:</strong> {reportData.startDate}
          </p>
          <p>
            <strong>End:</strong> {reportData.endDate}
          </p>

          {reportData.users.map((user) => (
            <div key={user.user_name} className="mt-4 border-t pt-4">
              <h4 className="font-bold">{user.user_name}</h4>
              <p>
                Total: {user.total_hours}h {user.total_minutes}m
              </p>

              <ul className="mt-2 ml-4 list-disc">
                {user.entries.map((e, i) => (
                  <li key={i}>
                    {e.date} — {e.project} ({e.hours}h {e.minutes}m)
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
