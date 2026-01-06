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

  // Export to Excel with enhanced formatting
  const exportToExcel = async () => {
    if (!reportData) return;
    
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Time Report");

      // Set column widths with increased sizes
      sheet.columns = [
        { width: 25 }, // User
        { width: 30 }, // User Email
        { width: 40 }, // User Dept
        { width: 15 }, // Date
        { width: 50 }, // Task ID
        { width: 50 }, // Project
        { width: 20 }, // Project Code
        { width: 25 }, // Hours
        { width: 15 }, // Minutes
        { width: 20 }, // Location
        { width: 40 }, // Remarks
        { width: 15 }  // Client
      ];

      // Main Title Row - Large font size and padding
      const titleRow = sheet.addRow(["TIME TRACKING REPORT"]);
      titleRow.font = { size: 22, bold: true, color: { argb: '1E40AF' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 45;
      sheet.mergeCells('A1:K1'); // Fixed: Merge all columns A-K

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
      sheet.mergeCells('A' + detailHeaderRow.number + ':K' + detailHeaderRow.number);

      // Detailed Table Headers with larger font
      sheet.addRow([]);
      const detailHeaders = sheet.addRow([
        "User", "Email", "Department", "Date", "Task ID", "Project", "Project Code", 
        "Hours", "Minutes", "Location", "Remarks","client"
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

      let currentRow = sheet.rowCount;
      
      // Detailed Data - Grouped by user with differentiators
      sortedUsersForExport.forEach((user, userIndex) => {
        // Add user separator/differentiator
        const userSeparatorRow = sheet.addRow([
          `USER: ${user.user_name.toUpperCase()}`, 
          user.user_email || "N/A",
          user.user_dept || "N/A",
          `Entries: ${user.entries.length}`, 
          `Total: ${user.total_hours}h ${user.total_minutes}m`,
          "", "", "", "", "", ""
        ]);
        
        // Style the user differentiator row
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

        // User's entries
        user.entries.forEach((entry, entryIndex) => {
          const row = sheet.addRow([
            user.user_name,
            user.user_email || "-",
            user.user_dept || "-",
            formatDateNoTime(entry.date),
            entry.task_id || "-",
            entry.project || "-",
            entry.project_code || "-",
            entry.hours,
            entry.minutes,
            entry.location || "-",
            entry.remarks || "-",
            entry.client || "-"
          ]);
          
          // Style each entry row
          row.eachCell((cell, colNumber) => {
            // Alternate row colors
            const rowColor = entryIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor }
            };
            
            // Add borders
            cell.border = {
              left: { style: 'thin', color: { argb: 'E2E8F0' } },
              right: { style: 'thin', color: { argb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
            };
            
            // Font styling
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            
            // Right align for numeric columns
            if (colNumber === 8 || colNumber === 9) { // Hours and Minutes columns
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
      sheet.mergeCells('A' + summaryHeaderRow.number + ':G' + summaryHeaderRow.number);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Time Tracking Reports</h1>
              <p className="text-gray-600 mt-2">Generate and export detailed time tracking reports</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <MdOutlineCheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {reportData ? `${reportData.users.length} users, ${reportData.users.reduce((acc, user) => acc + user.entries.length, 0)} entries` : 'No report loaded'}
              </span>
            </div>
          </div>

          {/* Date Selection Card - Improved Styling */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <MdOutlineDateRange className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Date Range</h2>
                <p className="text-gray-600">Choose start and end dates for your report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Start Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer hover:border-blue-300"
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Select start date"
                    maxDate={endDate || new Date()}
                    isClearable
                  />
                  <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  End Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer hover:border-blue-300"
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Select end date"
                    minDate={startDate}
                    maxDate={new Date()}
                    isClearable
                  />
                  <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Action Buttons - Improved Styling */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={fetchReport}
                disabled={loading || !startDate || !endDate}
                className={`flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-sm ${
                  loading || !startDate || !endDate
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FiFilter className="w-5 h-5" />
                    Generate Report
                  </>
                )}
              </button>

              <button
                onClick={exportToExcel}
                disabled={exporting || !reportData}
                className={`flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-sm ${
                  exporting || !reportData
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-5 h-5" />
                    Export to Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Display - Improved Styling */}
          {reportData && sortedUsers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Time Report</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <FiCalendar className="w-4 h-4" />
                        <span className="font-medium">{formatDateNoTime(reportData.startDate)}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <FiCalendar className="w-4 h-4" />
                        <span className="font-medium">{formatDateNoTime(reportData.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-2xl font-bold text-blue-700">{sortedUsers.length}</div>
                      <div className="text-xs text-gray-600">Users</div>
                    </div>
                    <div className="text-center bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-2xl font-bold text-emerald-700">
                        {reportData.users.reduce((sum, user) => sum + user.total_hours, 0)}h
                      </div>
                      <div className="text-xs text-gray-600">Total Hours</div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                      <MdOutlineSortByAlpha className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Sorted A-Z</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Summary Cards - Sorted Alphabetically */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">User Summary</h3>
                    <p className="text-sm text-gray-600 mt-1">Sorted alphabetically by name</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <FiHash className="w-4 h-4" />
                    <span>Total: <span className="font-bold text-blue-700">{sortedUsers.length}</span> users</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {sortedUsers.map((user, index) => (
                    <div 
                      key={user.user_name} 
                      className={`bg-white border-2 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1 ${
                        index % 3 === 0 ? 'border-blue-100' : 
                        index % 3 === 1 ? 'border-green-100' : 
                        'border-purple-100'
                      }`}
                      onClick={() => toggleUser(user.user_name)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                            index % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                            index % 3 === 1 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 
                            'bg-gradient-to-br from-purple-500 to-purple-600'
                          }`}>
                            <span className="text-white font-bold text-lg">
                              {user.user_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 truncate">{user.user_name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                index % 3 === 0 ? 'bg-blue-100 text-blue-800' : 
                                index % 3 === 1 ? 'bg-green-100 text-green-800' : 
                                'bg-purple-100 text-purple-800'
                              }`}>
                                #{index + 1}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              {user.user_email && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                                  <FiMail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{user.user_email}</span>
                                </div>
                              )}
                              {user.user_dept && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                                  <FiBriefcase className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{user.user_dept}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {expandedUsers[user.user_name] ? (
                            <FiChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <FiChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* User Stats Bar */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-lg font-bold text-gray-900">{user.entries.length}</div>
                            <div className="text-xs text-gray-600">Entries</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-lg font-bold text-emerald-600">
                              {user.total_hours}h
                            </div>
                            <div className="text-xs text-gray-600">Hours</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-lg font-bold text-blue-600">
                              {user.total_minutes}m
                            </div>
                            <div className="text-xs text-gray-600">Minutes</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Entries (Collapsible) */}
                      {expandedUsers[user.user_name] && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="mb-3 flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">Time Entries</h5>
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {user.entries.length} records
                            </span>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {user.entries.map((entry, entryIndex) => (
                              <div key={entryIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-white transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{entry.project || "No Project"}</div>
                                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                      <span>{entry.task_id}</span>
                                      {entry.project_code && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                          {entry.project_code}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                                    <span className="font-bold text-blue-700">
                                      {entry.hours}h {entry.minutes}m
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <FiCalendar className="w-3 h-3" />
                                    {formatDateNoTime(entry.date)}
                                  </div>
                                  {entry.location && (
                                    <div className="flex items-center gap-1">
                                      <FiMapPin className="w-3 h-3" />
                                      {entry.location}
                                    </div>
                                  )}
                                </div>
                                {entry.remarks && (
                                  <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                    <div className="flex items-start gap-2">
                                      <FiFileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <span className="italic">{entry.remarks}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}