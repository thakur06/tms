import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiCalendar,
  FiDownload,
  FiFilter,
  FiUser,
  FiClock,
  FiFolder,
  FiFileText,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiHash,
  FiList,
  FiMail,
  FiBriefcase
} from "react-icons/fi";
import { MdOutlineDateRange, MdOutlineCheckCircle, MdOutlineSortByAlpha } from "react-icons/md";

export default function TimeReport() {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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

  const CustomInput = ({ value, onClick, placeholder }) => (
    <button
      className="ui-input w-full pl-12 font-semibold text-left flex items-center h-[50px] relative z-0"
      onClick={onClick}
      type="button"
    >
      {value || <span className="text-slate-500">{placeholder}</span>}
      <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
    </button>
  );

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
      sheet.addRow([]);

      const sortedUsersForExport = [...reportData.users].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      );

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
<div className="min-h-screen font-sans text-slate-200 relative pb-20">
      <style>{`
        .react-datepicker {
          font-family: inherit !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
          background: #1e293b !important;
          overflow: hidden !important;
          color: white !important;
        }
        .react-datepicker__header {
          background: #0f172a !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 1rem 1rem 0 0 !important;
        }
        .react-datepicker__current-month {
          color: white !important;
        }
        .react-datepicker__day--selected {
          background: #6366f1 !important;
          color: white !important;
        }
        .react-datepicker__day:hover {
          background: rgba(99,102,241,0.2) !important;
          color: white !important;
        }
        .react-datepicker__day {
          color: #94a3b8 !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: rgba(99,102,241,0.2) !important;
          color: white !important;
        }
        .react-datepicker__day--today {
          color: #6366f1 !important;
          font-weight: bold !important;
        }
        .react-datepicker__day-name {
          color: #64748b !important;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* --- Header Section --- */}
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
              <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Analytics</span>
              <span className="text-slate-600">/</span>
              <span>Reports</span>
            </nav>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Time Reports
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Detailed workspace activity and productivity metrics</p>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="relative">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-sm font-medium text-emerald-400">
              {reportData ? `${reportData.users.length} Active Users` : 'System Ready'}
            </span>
          </div>
        </header>

        {/* --- Configuration Card --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 ui-card p-0 !overflow-visible">
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <MdOutlineDateRange className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Date Range</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Select period for report</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="ui-label">Start Date</label>
                  <div className="relative z-30">
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={today}
                      placeholderText="Select start date"
                      dateFormat="MMM d, yyyy"
                      customInput={<CustomInput placeholder="Select start date" />}
                      popperPlacement="bottom-start"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="ui-label">End Date</label>
                  <div className="relative z-20">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      maxDate={today}
                      placeholderText="Select end date"
                      dateFormat="MMM d, yyyy"
                      customInput={<CustomInput placeholder="Select end date" />}
                      popperPlacement="bottom-start"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={fetchReport}
                  disabled={loading || !startDate || !endDate}
                  className="ui-btn ui-btn-primary w-full md:w-auto min-w-[200px]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiFilter className="w-4 h-4" />
                  )}
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Card */}
          <div className="ui-card p-6 flex flex-col justify-between h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/5 z-20">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <FiDownload className="text-emerald-400" /> Export Data
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Download comprehensive report in .xlsx format for external analysis and record keeping.
              </p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={!reportData || exporting}
              className="ui-btn w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:border-emerald-500/50"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  Export to Excel
                </>
              )}
            </button>
          </div>
        </section>

        {/* --- Data Display Section --- */}
        {reportData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                Report Results
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-mono font-bold">
                  Total: {reportData.users.reduce((sum, user) => sum + user.total_hours, 0)} Hours
                </div>
                <div className="px-3 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-xs font-mono">
                  {formatDateNoTime(reportData.startDate)} - {formatDateNoTime(reportData.endDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedUsers.map((user, index) => (
                <div
                  key={user.user_name}
                  className="group ui-card hover:border-indigo-500/30 hover:translate-y-[-2px] transition-all duration-300"
                >
                  <div className="p-5">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                        {user.user_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate text-lg">{user.user_name}</h4>
                        <p className="text-xs text-indigo-300 truncate font-medium bg-indigo-500/10 inline-block px-2 py-0.5 rounded border border-indigo-500/20 mt-1">
                          {user.user_dept || 'General Dept'}
                        </p>
                      </div>
                    </div>

                    {/* Stat Pills */}
                    <div className="flex gap-3 mb-5">
                      <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Hours</div>
                        <div className="text-xl font-black text-white">{user.total_hours}h</div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Entries</div>
                        <div className="text-xl font-black text-white">{user.entries.length}</div>
                      </div>
                    </div>

                    {/* Summary Info */}
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-sm text-slate-400">
                        {user.entries.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg">
                              <span className="text-xs font-semibold">Projects Active</span>
                              <span className="font-mono font-bold text-indigo-400">{[...new Set(user.entries.map(e => e.project))].length}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg">
                              <span className="text-xs font-semibold">Avg Hours / Day</span>
                              <span className="font-mono font-bold text-emerald-400">{(user.total_hours / user.entries.length).toFixed(1)}h</span>
                            </div>
                          </div>
                        ) : (
                          <p className="italic text-center py-2 opacity-50">No time entries recorded</p>
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