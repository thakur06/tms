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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [sortedUsers, setSortedUsers] = useState([]);
  const [today] = useState(new Date()); // Store today's date

  // Sort users by name in ascending order
  useEffect(() => {
    if (reportData && reportData.users) {
      const sorted = [...reportData.users].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      );
      setSortedUsers(sorted);

      // Initialize expanded state for all sorted users
      const initialExpanded = {};
      sorted.forEach(user => {
        initialExpanded[user.user_name] = false;
      });
      setExpandedUsers(initialExpanded);
    }
  }, [reportData]);

  // Toggle user expansion
  const toggleUser = (userName) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userName]: !prev[userName]
    }));
  };

  // Fetch report from backend
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    // Additional validation: end date shouldn't be before start date
    if (endDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    setLoading(true);

    const formattedStart = formatDateLocal(startDate);
    const formattedEnd = formatDateLocal(endDate);

    try {
      console.log("Fetching report with dates:", formattedStart, formattedEnd);

      const res = await fetch(
        `http://localhost:4000/api/reports/time-entries?startDate=${formattedStart}&endDate=${formattedEnd}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Report data received:", data);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      alert(`Failed to fetch report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date without timestamp (just date)
  const formatDateNoTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle start date change - also adjust end date if needed
  const handleStartDateChange = (date) => {
    setStartDate(date);
    // If end date is earlier than new start date, reset end date
    if (endDate && date > endDate) {
      setEndDate(date);
    }
  };

  // Custom input component for DatePicker to fix styling issues
  const CustomInput = ({ value, onClick, placeholder }) => (
    <button
      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl transition-all outline-none font-semibold text-slate-900 hover:bg-slate-50 text-left focus:ring-2 focus:ring-slate-500/30"
      onClick={onClick}
      type="button"
    >
      {value || placeholder}
    </button>
  );

  // Export to Excel with enhanced formatting (project code removed)
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Time Report");

      // Set column widths with increased sizes (PROJECT CODE COLUMN REMOVED)
      // Now we have 11 columns: A (1) through K (11)
      sheet.columns = [
        { width: 25 }, // A: User
        { width: 30 }, // B: User Email
        { width: 40 }, // C: User Dept
        { width: 15 }, // D: Date
        { width: 50 }, // E: Task ID
        { width: 50 }, // F: Project
        // Project Code column removed
        { width: 20 }, // G: Hours (was H)
        { width: 15 }, // H: Minutes (was I)
        { width: 20 }, // I: Location (was J)
        { width: 40 }, // J: Remarks (was K)
        { width: 30 }  // K: Client (was L)
      ];

      // Main Title Row - Large font size and padding
      const titleRow = sheet.addRow(["TIME TRACKING REPORT"]);
      titleRow.font = { size: 22, bold: true, color: { argb: '1E40AF' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 45;
      sheet.mergeCells('A1:K1'); // 11 columns: A through K

      // Date Range with larger font
      sheet.addRow([]);
      const dateRangeRow = sheet.addRow(["Date Range:", `${reportData.startDate} to ${reportData.endDate}`]);
      dateRangeRow.font = { bold: true, size: 12 };
      dateRangeRow.height = 30;

      sheet.addRow([]);
      sheet.addRow([]);

      // Sort users alphabetically for Excel export
      const sortedUsersForExport = [...reportData.users].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      );

      // Detailed Entries Header with larger font
      const detailHeaderRow = sheet.addRow(["DETAILED TIME ENTRIES BY USER"]);
      detailHeaderRow.font = { bold: true, size: 16, color: { argb: '7C3AED' } };
      detailHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F3E8FF' }
      };
      detailHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      detailHeaderRow.height = 38;
      sheet.mergeCells('A' + detailHeaderRow.number + ':K' + detailHeaderRow.number); // 11 columns

      // Detailed Table Headers with larger font (PROJECT CODE REMOVED)
      sheet.addRow([]);
      const detailHeaders = sheet.addRow([
        "User", "Email", "Department", "Date", "Task ID", "Project",
        "Hours", "Minutes", "Location", "Remarks", "Client" // 11 headers
      ]);
      detailHeaders.eachCell(cell => {
        cell.font = { bold: true, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'EFF6FF' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '94A3B8' } },
          left: { style: 'thin', color: { argb: '94A3B8' } },
          bottom: { style: 'thin', color: { argb: '94A3B8' } },
          right: { style: 'thin', color: { argb: '94A3B8' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      detailHeaders.height = 32;

      // Detailed Data - Grouped by user with differentiators
      sortedUsersForExport.forEach((user, userIndex) => {
        // Add user separator/differentiator (11 values)
        const userSeparatorRow = sheet.addRow([
          `USER: ${user.user_name.toUpperCase()}`,
          user.user_email || "N/A",
          user.user_dept || "N/A",
          `Entries: ${user.entries.length}`,
          `Total: ${user.total_hours}h ${user.total_minutes}m`,
          "", "", "", "", "", "" // 6 empty strings for columns F-K
        ]);

        // Style the user differentiator row (INCLUDES COLUMN K)
        userSeparatorRow.eachCell((cell, colNumber) => {
          cell.font = { bold: true, size: 12, color: { argb: '1E40AF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: userIndex % 2 === 0 ? { argb: 'E0F2FE' } : { argb: 'DBEAFE' }
          };
          cell.border = {
            top: { style: 'medium', color: { argb: '3B82F6' } },
            bottom: { style: 'medium', color: { argb: '3B82F6' } },
            left: { style: 'thin', color: { argb: '94A3B8' } },
            right: { style: 'thin', color: { argb: '94A3B8' } }
          };
          cell.alignment = { vertical: 'middle' };
        });
        userSeparatorRow.height = 36;

        // Merge cells for user name
        sheet.mergeCells(`A${userSeparatorRow.number}:C${userSeparatorRow.number}`);
        // Merge cells for summary info
        sheet.mergeCells(`D${userSeparatorRow.number}:E${userSeparatorRow.number}`);

        // User's entries (PROJECT CODE REMOVED)
        user.entries.forEach((entry, entryIndex) => {
          const row = sheet.addRow([
            user.user_name,
            user.user_email || "-",
            user.user_dept || "-",
            formatDateNoTime(entry.date),
            entry.task_id || "-",
            entry.project || "-",
            // Project Code column removed
            entry.hours,
            entry.minutes,
            entry.location || "-",
            entry.remarks || "-",
            entry.client || "-" // Column K
          ]);

          // Style each entry row (INCLUDES COLUMN K)
          row.eachCell((cell, colNumber) => {
            // Alternate row colors
            const rowColor = entryIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor }
            };

            // Add borders (ALL CELLS INCLUDING COLUMN K)
            cell.border = {
              left: { style: 'thin', color: { argb: 'E2E8F0' } },
              right: { style: 'thin', color: { argb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
            };

            // Font styling
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };

            // Right align for numeric columns (adjusted indices)
            if (colNumber === 7 || colNumber === 8) { // Hours and Minutes columns (now G=7, H=8)
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
          });
          row.height = 24;
        });

        // Add a blank row between users
        const blankRow = sheet.addRow([]);
        blankRow.height = 12;
      });

      // Remove last blank row if exists
      if (sheet.rowCount > 0 && !sheet.getRow(sheet.rowCount).values.length) {
        sheet.spliceRows(sheet.rowCount, 1);
      }

      sheet.addRow([]);
      sheet.addRow([]);

      // Summary Section with larger font
      const summaryHeaderRow = sheet.addRow(["USER SUMMARY"]);
      summaryHeaderRow.font = { bold: true, size: 16, color: { argb: '059669' } };
      summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' }
      };
      summaryHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeaderRow.height = 38;
      sheet.mergeCells('A' + summaryHeaderRow.number + ':I' + summaryHeaderRow.number);

      // Summary Table Headers
      sheet.addRow([]);
      const summaryHeaders = sheet.addRow([
        "Sr. No.", "User", "Email", "Department", "Total Entries", "Total Hours", "Total Minutes", "Total Time", "Avg. Hours/Day"
      ]);
      summaryHeaders.eachCell(cell => {
        cell.font = { bold: true, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'EFF6FF' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '94A3B8' } },
          left: { style: 'thin', color: { argb: '94A3B8' } },
          bottom: { style: 'thin', color: { argb: '94A3B8' } },
          right: { style: 'thin', color: { argb: '94A3B8' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      summaryHeaders.height = 32;

      // Calculate days in range
      const daysInRange = Math.ceil((new Date(reportData.endDate) - new Date(reportData.startDate)) / (1000 * 60 * 60 * 24)) + 1;

      // Summary Data
      sortedUsersForExport.forEach((user, index) => {
        const totalTime = `${user.total_hours}h ${user.total_minutes}m`;
        const avgHoursPerDay = (user.total_hours + (user.total_minutes / 60)) / daysInRange;

        const row = sheet.addRow([
          index + 1,
          user.user_name,
          user.user_email || "-",
          user.user_dept || "-",
          user.entries.length,
          user.total_hours,
          user.total_minutes,
          totalTime,
          avgHoursPerDay.toFixed(2)
        ]);

        // Style summary rows
        row.eachCell(cell => {
          cell.border = {
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
          };
          cell.font = { size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };

          // Right align for numeric columns
          if ([1, 6, 7, 9].includes(cell.col)) { // Sr.No, Hours, Minutes, Avg Hours
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }

          // Alternate row colors
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F9FAFB' }
            };
          }
        });
        row.height = 26;
      });

      // Add totals row with larger font
      const totalHours = reportData.users.reduce((sum, user) => sum + user.total_hours, 0);
      const totalMinutes = reportData.users.reduce((sum, user) => sum + user.total_minutes, 0);
      const totalEntries = reportData.users.reduce((sum, user) => sum + user.entries.length, 0);

      sheet.addRow([]);
      const totalRow = sheet.addRow([
        "TOTAL",
        `${sortedUsersForExport.length} Users`,
        "",
        "",
        totalEntries,
        totalHours,
        totalMinutes,
        `${totalHours}h ${totalMinutes}m`,
        ""
      ]);

      totalRow.eachCell(cell => {
        cell.font = { bold: true, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DBEAFE' }
        };
        cell.border = {
          top: { style: 'double', color: { argb: '3B82F6' } },
          left: { style: 'thin', color: { argb: '94A3B8' } },
          bottom: { style: 'double', color: { argb: '3B82F6' } },
          right: { style: 'thin', color: { argb: '94A3B8' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      totalRow.height = 34;

      // Add generated timestamp
      sheet.addRow([]);
      sheet.addRow([]);
      const timestampRow = sheet.addRow([`Report generated: ${new Date().toLocaleString()}`]);
      timestampRow.font = { italic: true, size: 9, color: { argb: '6B7280' } };
      timestampRow.height = 22;

      // Generate Excel file
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
    <div className="h-fit bg-white p-4 md:p-8 font-sans text-slate-900 relative">
      {/* Global styles for react-datepicker */}
      <style jsx global>{`
      
        /* Base styles for datepicker */
        .react-datepicker {
          font-family: inherit !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
          z-index: 9999 !important;
          background: white !important;
          overflow: hidden !important;
          animation: slideIn 0.2s ease-out !important;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .react-datepicker__triangle {
          display: none !important;
        }
        
        .react-datepicker__header {
          background: white !important;
          border-bottom: 1px solid #f3f4f6 !important;
          border-radius: 1rem 1rem 0 0 !important;
          padding: 1rem 0.5rem 0.5rem 0.5rem !important;
          text-align: center !important;
        }
        
        .react-datepicker__current-month {
          font-weight: 600 !important;
          color: #111827 !important;
          font-size: 0.95rem !important;
          margin-bottom: 0.75rem !important;
        }
        
        .react-datepicker__day--selected {
          background: #111827 !important;
          border-radius: 0.5rem !important;
          color: white !important;
          font-weight: 500 !important;
        }
        
        .react-datepicker__day:hover {
          background: #f9fafb !important;
          border-radius: 0.5rem !important;
          color: #111827 !important;
        }
        
        .react-datepicker__day {
          margin: 0.15rem !important;
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          font-size: 0.875rem !important;
          color: #374151 !important;
        }
        
        .react-datepicker__month {
          margin: 0.75rem !important;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: #f9fafb !important;
          color: #111827 !important;
        }
        
        .react-datepicker__day--today {
          font-weight: 600 !important;
          color: #111827 !important;
          position: relative !important;
        }
        
        .react-datepicker__day--today::after {
          content: '' !important;
          position: absolute !important;
          bottom: 4px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 4px !important;
          height: 4px !important;
          background: #9ca3af !important;
          border-radius: 50% !important;
        }
        
        .react-datepicker__day--selected::after {
          background: white !important;
        }
        
        .react-datepicker__navigation {
          top: 1rem !important;
          width: 2rem !important;
          height: 2rem !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s !important;
        }
        
        .react-datepicker__navigation:hover {
          background: #f9fafb !important;
        }
        
        .react-datepicker__navigation--previous {
          left: 0.75rem !important;
        }
        
        .react-datepicker__navigation--next {
          right: 0.75rem !important;
        }
        
        .react-datepicker__navigation-icon::before {
          border-width: 2px 2px 0 0 !important;
          width: 7px !important;
          height: 7px !important;
          border-color: #6b7280 !important;
          top: 12px !important;
        }
        
        .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 500 !important;
          font-size: 0.75rem !important;
          width: 2.25rem !important;
          margin: 0.15rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
        }
        
        /* CENTER POSITIONING - FIXED FOR ALL SCREENS */
        .react-datepicker-popper {
          z-index: 9999 !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          padding: 0 !important;
          margin: 0 !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Remove any default popper positioning */
        .react-datepicker-popper[data-placement^="bottom"],
        .react-datepicker-popper[data-placement^="top"],
        .react-datepicker-popper[data-placement^="left"],
        .react-datepicker-popper[data-placement^="right"] {
          transform: translate(-50%, -50%) !important;
          top: 50% !important;
          left: 50% !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        
        /* Ensure the datepicker is visible on mobile */
        @media (max-width: 768px) {
          .react-datepicker {
            width: 90vw !important;
            max-width: 340px !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
          }
          
          .react-datepicker__month-container {
            width: 100% !important;
          }
          
          .react-datepicker__day {
            width: 2.75rem !important;
            line-height: 2.75rem !important;
            margin: 0.1rem !important;
          }
          
          .react-datepicker__day-name {
            width: 2.75rem !important;
            margin: 0.1rem !important;
          }
        }
        
        /* Desktop sizing */
        @media (min-width: 768px) {
          .react-datepicker {
            min-width: 320px !important;
          }
        }
        
        /* Add a backdrop for better focus */
        .react-datepicker-popper::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.2) !important;
          backdrop-filter: blur(2px) !important;
          z-index: -1 !important;
          pointer-events: none !important;
          display: none !important; /* We'll handle backdrop separately */
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- Header Section --- */}
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
              <span className="px-2 py-1 rounded bg-slate-100">Analytics</span>
              <span className="text-slate-300">/</span>
              <span>Reports</span>
            </nav>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Time Tracking Reports
            </h1>
            <p className="text-slate-600 mt-2 text-sm">Detailed workspace activity and productivity metrics</p>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200">
            <div className="relative">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-medium text-slate-700">
              {reportData ? `${reportData.users.length} Active Users` : 'System Ready'}
            </span>
          </div>
        </header>

        {/* --- Configuration Card --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-slate-100 rounded-lg">
                <MdOutlineDateRange className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Date Range</h2>
                <p className="text-sm text-slate-500">Select start and end dates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <div className="relative">
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
                    popperModifiers={[
                      {
                        name: 'preventOverflow',
                        options: {
                          boundary: 'viewport',
                          padding: 8,
                        },
                      },
                      {
                        name: 'flip',
                        options: {
                          allowedAutoPlacements: ['bottom', 'top'],
                          fallbackPlacements: ['bottom', 'top'],
                        },
                      },
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 8],
                        },
                      },
                    ]}
                  />
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">End Date</label>
                <div className="relative">
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
                    popperModifiers={[
                      {
                        name: 'preventOverflow',
                        options: {
                          boundary: 'viewport',
                          padding: 8,
                        },
                      },
                      {
                        name: 'flip',
                        options: {
                          allowedAutoPlacements: ['bottom', 'top'],
                          fallbackPlacements: ['bottom', 'top'],
                        },
                      },
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 8],
                        },
                      },
                    ]}
                  />
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={fetchReport}
                disabled={loading || !startDate || !endDate}
                className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
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

          {/* Quick Action Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Export Data</h3>
              <p className="text-slate-600 text-sm">
                Download report in .xlsx format for external use.
              </p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={!reportData || exporting}
              className="w-full py-3 bg-white text-slate-900 border border-slate-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Report Results</h3>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  Total: {reportData.users.reduce((sum, user) => sum + user.total_hours, 0)} Hours
                </div>
                <div className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  {formatDateNoTime(reportData.startDate)} - {formatDateNoTime(reportData.endDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedUsers.map((user, index) => (
                <div
                  key={user.user_name}
                  onClick={() => toggleUser(user.user_name)}
                  className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Profile Section */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-base font-medium text-slate-700">
                      {user.user_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{user.user_name}</h4>
                      <p className="text-xs text-slate-500 truncate">{user.user_dept || 'General Dept'}</p>
                    </div>
                    <div className="p-1.5 rounded-lg text-slate-400">
                      {expandedUsers[user.user_name] ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Stat Pills */}
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                      <div className="text-xs text-slate-500">Hours</div>
                      <div className="text-base font-medium text-slate-900">{user.total_hours}h</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                      <div className="text-xs text-slate-500">Entries</div>
                      <div className="text-base font-medium text-slate-900">{user.entries.length}</div>
                    </div>
                  </div>

                  {/* Expandable Entries Area */}
                  {expandedUsers[user.user_name] && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-slate-200 animate-in zoom-in-95 duration-200">
                      {user.entries.map((entry, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-slate-600">{entry.project_code || 'PRJ'}</span>
                            <span className="text-xs font-medium text-slate-900">{entry.hours}h {entry.minutes}m</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 mb-1">{entry.project}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <FiCalendar className="w-3 h-3" />
                            <span>{formatDateNoTime(entry.date)}</span>
                          </div>
                          {entry.remarks && (
                            <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">"{entry.remarks}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}