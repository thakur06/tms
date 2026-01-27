import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiDownload, FiFilter, FiUser, FiClock, FiFolder, FiFileText, FiMapPin, FiChevronDown, FiChevronUp, FiHash, FiList, FiMail, FiBriefcase } from "react-icons/fi";
import { MdOutlineDateRange, MdOutlineCheckCircle, MdOutlineSortByAlpha } from "react-icons/md";

const CustomInput = ({ value, onClick, placeholder, icon: Icon }) => (
  <button
    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-left text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 flex items-center gap-3 transition-all shadow-sm hover:bg-white/5"
    onClick={onClick}
    type="button"
  >
    {Icon && <Icon className="text-amber-500" size={18} />}
    <span className={value ? "text-white font-bold" : "text-gray-500"}>
      {value || placeholder}
    </span>
  </button>
);

export default function TimeReport() {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [sortedUsers, setSortedUsers] = useState([]);
  const [today] = useState(new Date()); 

  useEffect(() => {
    if (reportData && reportData.users) {
      const sorted = [...reportData.users].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      );
      setSortedUsers(sorted);

      const initialExpanded = {};
      sorted.forEach(user => {
        initialExpanded[user.user_name] = false;
      });
      setExpandedUsers(initialExpanded);
    }
  }, [reportData]);

  const toggleUser = (userName) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userName]: !prev[userName]
    }));
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (endDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    setLoading(true);

    const formattedStart = formatDateLocal(startDate);
    const formattedEnd = formatDateLocal(endDate);

    try {
       const token = localStorage.getItem('token');
      const res = await fetch(
        `${server}/api/reports/time-entries?startDate=${formattedStart}&endDate=${formattedEnd}`,{
           headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      alert(`Failed to fetch report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateNoTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(date);
    }
  };


  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Time Report");

      sheet.columns = [
        { width: 25 }, { width: 30 }, { width: 40 }, { width: 15 },
        { width: 50 }, { width: 50 }, { width: 20 }, { width: 15 },
        { width: 20 }, { width: 40 }, { width: 30 }
      ];

      const titleRow = sheet.addRow(["TIME TRACKING REPORT"]);
      titleRow.font = { size: 22, bold: true, color: { argb: '1E40AF' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 45;
      sheet.mergeCells('A1:K1');

      sheet.addRow([]);
      const dateRangeRow = sheet.addRow(["Date Range:", `${reportData.startDate} to ${reportData.endDate}`]);
      dateRangeRow.font = { bold: true, size: 12 };
      dateRangeRow.height = 30;

      sheet.addRow([]);

      const sortedUsersForExport = [...reportData.users].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      );

      // --- USER SUMMARY SECTION ---
      const summaryTitleRow = sheet.addRow(["USER SUMMARY"]);
      summaryTitleRow.font = { bold: true, size: 16, color: { argb: '065F46' } };
      summaryTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
      summaryTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryTitleRow.height = 38;
      sheet.mergeCells('A' + summaryTitleRow.number + ':I' + summaryTitleRow.number);

      sheet.addRow([]);
      const summaryHeaders = sheet.addRow([
        "Sr. No.", "User", "Email", "Department", "Total Entries", "Total Hours", "Total Minutes", "Total Time", "Avg. Hours/Day"
      ]);
      summaryHeaders.eachCell(cell => {
        cell.font = { bold: true, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      summaryHeaders.height = 32;

      let grandTotalEntries = 0;
      let grandTotalHours = 0;
      let grandTotalMinutes = 0;

      const reportStartDate = new Date(reportData.startDate);
      const reportEndDate = new Date(reportData.endDate);
      const daysDiff = Math.ceil((reportEndDate - reportStartDate) / (1000 * 60 * 60 * 24)) + 1;

      sortedUsersForExport.forEach((user, index) => {
        const totalMinutesSpent = user.total_hours * 60 + user.total_minutes;
        const avgHoursPerDay = ((totalMinutesSpent / 60) / daysDiff).toFixed(2);
        
        const row = sheet.addRow([
          index + 1,
          user.user_name,
          user.user_email || "N/A",
          user.user_dept || "N/A",
          user.entries.length,
          user.total_hours,
          user.total_minutes,
          `${user.total_hours}h ${user.total_minutes}m`,
          avgHoursPerDay
        ]);

        row.eachCell(cell => {
          cell.border = { top: { style: 'thin', color: { argb: 'E2E8F0' } }, left: { style: 'thin', color: { argb: 'E2E8F0' } }, bottom: { style: 'thin', color: { argb: 'E2E8F0' } }, right: { style: 'thin', color: { argb: 'E2E8F0' } } };
          cell.alignment = { vertical: 'middle' };
        });

        grandTotalEntries += user.entries.length;
        grandTotalHours += user.total_hours;
        grandTotalMinutes += user.total_minutes;
      });

      // Normalize grand total minutes
      const finalGrandHours = grandTotalHours + Math.floor(grandTotalMinutes / 60);
      const finalGrandMinutes = grandTotalMinutes % 60;

      const totalRow = sheet.addRow([
        "TOTAL",
        `${sortedUsersForExport.length} Users`,
        "", "",
        grandTotalEntries,
        finalGrandHours,
        finalGrandMinutes,
        `${finalGrandHours}h ${finalGrandMinutes}m`,
        ""
      ]);

      totalRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      sheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

      sheet.addRow([]);
      sheet.addRow([]);

      const detailHeaderRow = sheet.addRow(["DETAILED TIME ENTRIES BY USER"]);
      detailHeaderRow.font = { bold: true, size: 16, color: { argb: '7C3AED' } };
      detailHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } };
      detailHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      detailHeaderRow.height = 38;
      sheet.mergeCells('A' + detailHeaderRow.number + ':K' + detailHeaderRow.number);

      sheet.addRow([]);
      const detailHeaders = sheet.addRow([
        "User", "Email", "Department", "Date", "Task ID", "Project",
        "Hours", "Minutes", "Location", "Remarks", "Client"
      ]);
      detailHeaders.eachCell(cell => {
        cell.font = { bold: true, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      detailHeaders.height = 32;

      sortedUsersForExport.forEach((user, userIndex) => {
        const userSeparatorRow = sheet.addRow([
          `USER: ${user.user_name.toUpperCase()}`,
          user.user_email || "N/A",
          user.user_dept || "N/A",
          `Entries: ${user.entries.length}`,
          `Total: ${user.total_hours}h ${user.total_minutes}m`,
          "", "", "", "", "", ""
        ]);

        userSeparatorRow.eachCell((cell) => {
          cell.font = { bold: true, size: 12, color: { argb: '1E40AF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: userIndex % 2 === 0 ? { argb: 'E0F2FE' } : { argb: 'DBEAFE' } };
          cell.alignment = { vertical: 'middle' };
        });
        userSeparatorRow.height = 36;
        sheet.mergeCells(`A${userSeparatorRow.number}:C${userSeparatorRow.number}`);
        sheet.mergeCells(`D${userSeparatorRow.number}:E${userSeparatorRow.number}`);

        user.entries.forEach((entry, entryIndex) => {
          const row = sheet.addRow([
            user.user_name, user.user_email || "-", user.user_dept || "-",
            formatDateNoTime(entry.date), entry.task_id || "-", entry.project || "-",
            entry.hours, entry.minutes, entry.location || "-", entry.remarks || "-", entry.client || "-"
          ]);
          row.eachCell((cell, colNumber) => {
            const rowColor = entryIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
            cell.border = { left: { style: 'thin', color: { argb: 'E2E8F0' } }, right: { style: 'thin', color: { argb: 'E2E8F0' } }, bottom: { style: 'thin', color: { argb: 'E2E8F0' } } };
            if (colNumber === 7 || colNumber === 8) cell.alignment = { vertical: 'middle', horizontal: 'right' };
          });
        });
        sheet.addRow([]);
      });

      const buf = await workbook.xlsx.writeBuffer();
      const filename = `Time_Report_${reportData.startDate}_to_${reportData.endDate}.xlsx`;
      saveAs(new Blob([buf]), filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
<div className="space-y-8 pb-20 p-3 min-h-screen transition-colors duration-300">
      <style>{`
        .react-datepicker {
          font-family: inherit !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
          background: #18181b !important;
          overflow: hidden !important;
          color: #f4f4f5 !important;
        }
        .react-datepicker__header {
          background: #27272a !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 1rem 1rem 0 0 !important;
        }
        .react-datepicker__current-month {
          color: #f4f4f5 !important;
        }
        .react-datepicker__day--selected {
          background: #f59e0b !important;
          color: #18181b !important;
          font-weight: bold !important;
        }
        .react-datepicker__day:hover {
          background: rgba(245,158,11,0.2) !important;
          color: #f59e0b !important;
        }
        .react-datepicker__day {
          color: #a1a1aa !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: rgba(245,158,11,0.2) !important;
          color: #f59e0b !important;
        }
        .react-datepicker__day--today {
          color: #f59e0b !important;
          font-weight: bold !important;
        }
        .react-datepicker__day-name {
          color: #71717a !important;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
      `}</style>

      <div className="space-y-8">
        {/* --- Header Section --- */}
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              <span className="text-amber-500">Analytics</span>
              <span className="opacity-30">/</span>
              <span>Reports</span>
            </nav>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10">
                <FiFileText size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
                  Time Reports
                </h1>
                <p className="text-gray-500 mt-1.5 text-xs font-bold italic">Detailed workspace activity and productivity metrics</p>
              </div>
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-900 rounded-xl border border-white/10 shadow-sm">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
              {reportData ? `${reportData.users.length} Active Users` : 'System Ready'}
            </span>
          </div>
        </header>

        {/* --- Filters Section --- */}
        <section className="relative z-10 p-6 bg-zinc-900 border border-white/5 shadow-xl shadow-black/50 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-center border-b border-white/5 pb-6">
                <div className="w-full md:w-auto">
                    <label className="text-sm font-bold text-gray-400 block mb-2 uppercase tracking-tight">
                    Date Range
                    </label>
                    <div className="flex gap-4">
                    <div className="w-40 relative z-30">
                        <DatePicker
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={today}
                        customInput={<CustomInput placeholder="Start Date" icon={FiCalendar} />}
                        />
                    </div>
                    <div className="w-40 relative z-20">
                        <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        maxDate={today}
                        customInput={<CustomInput placeholder="End Date" icon={FiCalendar} />}
                        />
                    </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-end justify-between gap-4 h-full pt-7">
                    <button
                        onClick={fetchReport}
                        disabled={loading || !startDate || !endDate}
                        className="ui-btn ui-btn-primary min-w-[200px]"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FiFilter className="w-4 h-4" />
                        )}
                        Generate Report
                    </button>

                    <button
                        onClick={exportToExcel}
                        disabled={!reportData || exporting}
                        className="ui-btn bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10 px-8"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                            <FiDownload className="w-4 h-4" />
                            Export to Excel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>

        {/* --- Data Display Section --- */}
        {reportData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                Report Results
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-mono font-bold">
                  Total: {reportData.users.reduce((sum, user) => sum + user.total_hours, 0)} Hours
                </div>
                <div className="px-3 py-1.5 bg-zinc-800 text-gray-400 border border-white/10 rounded-lg text-xs font-mono">
                  {formatDateNoTime(reportData.startDate)} - {formatDateNoTime(reportData.endDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedUsers.map((user, index) => (
                <div
                  key={user.user_name}
                  className="group ui-card hover:border-amber-500/30 hover:translate-y-[-2px] transition-all duration-300 border-white/5 bg-zinc-900/50"
                >
                  <div className="p-5">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-lg font-bold text-amber-500 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/30 transition-shadow border border-amber-500/20">
                        {user.user_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white truncate text-base">{user.user_name}</h4>
                        <p className="text-[9px] text-amber-500 truncate font-black tracking-widest uppercase bg-amber-500/10 inline-block px-2 py-0.5 rounded border border-amber-500/20 mt-0.5">
                          {user.user_dept || 'General Dept'}
                        </p>
                      </div>
                    </div>

                    {/* Stat Pills */}
                    <div className="flex gap-3 mb-5">
                      <div className="flex-1 bg-zinc-800/50 rounded-xl p-2.5 text-center border border-white/5">
                        <div className="text-[8px] uppercase text-gray-500 font-black tracking-widest mb-0.5">Hours</div>
                        <div className="text-lg font-black text-white">{user.total_hours}h</div>
                      </div>
                      <div className="flex-1 bg-zinc-800/50 rounded-xl p-2.5 text-center border border-white/5">
                        <div className="text-[8px] uppercase text-gray-500 font-black tracking-widest mb-0.5">Entries</div>
                        <div className="text-lg font-black text-white">{user.entries.length}</div>
                      </div>
                    </div>

                    {/* Summary Info */}
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-sm text-gray-400">
                        {user.entries.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-zinc-800/30 p-2 rounded-lg border border-white/5">
                              <span className="text-xs font-semibold">Projects Active</span>
                              <span className="font-mono font-bold text-amber-500">{[...new Set(user.entries.map(e => e.project))].length}</span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-800/30 p-2 rounded-lg border border-white/5">
                              <span className="text-xs font-semibold">Avg Hours / Day</span>
                              <span className="font-mono font-bold text-emerald-500">{(user.total_hours / user.entries.length).toFixed(1)}h</span>
                            </div>
                          </div>
                        ) : (
                          <p className="italic text-center py-2 opacity-30">No time entries recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}