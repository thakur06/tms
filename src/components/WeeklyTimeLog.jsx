import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoChevronBack,
  IoChevronForward,
  IoCalendar,
  IoSave,
  IoTrash,
  IoAdd,
  IoCheckmarkCircle,
  IoChatbubbleEllipsesOutline,
  IoSearch,
  IoClose,
} from "react-icons/io5";
import { formatDate, formatTime } from "../utils/formatters";
import { toast, Zoom } from "react-toastify";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import SubmitTimesheetModal from "./SubmitTimesheetModal";
import confetti from 'canvas-confetti';

// --- Internal Searchable Select Component ---
function SearchableSelect({ options, value, onChange, placeholder, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) =>
    (o.label || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className="w-full flex items-center justify-between p-2 pl-3 bg-zinc-900 border border-transparent rounded hover:bg-white/5 cursor-pointer text-sm text-gray-200"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch("");
        }}
      >
        <span className="truncate select-none">
          {selectedOption ? selectedOption.label : (value || <span className="text-gray-500">{placeholder}</span>)}
        </span>
        <IoSearch className="text-gray-600 ml-2 shrink-0" size={14} />
      </div>

      {isOpen && (
        <div className="absolute z-9999 top-full left-0 w-[240px] mt-2 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-[250px] overflow-hidden flex flex-col hide-y-scroll ring-1 ring-white/5">
          <div className="p-3 border-b border-white/5 sticky top-0 bg-zinc-900/50">
            <input
              autoFocus
              type="text"
              className="w-full bg-black/20 text-xs text-white p-2 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent closing
            />
          </div>
          <div className="overflow-y-auto max-h-[55px] p-1 hide-y-scroll">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 text-center">No results</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`p-2 text-xs rounded cursor-pointer transition-colors ${value === opt.value ? "bg-amber-500/20 text-amber-500" : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label || <i>(No Label)</i>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Internal Remarks Modal ---
function RemarksModal({ isOpen, onClose, initialValue, onSave, title }) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => setVal(initialValue), [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title || "Add Remarks"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><IoClose size={20} /></button>
        </div>
        <div className="p-4">
          <textarea
            className="w-full bg-black/20 text-sm text-gray-200 p-3 rounded-xl border border-white/10 focus:border-amber-500/50 focus:outline-none min-h-[100px] resize-none"
            placeholder="Enter details about this activity..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
          />
        </div>
        <div className="p-4 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={() => { onSave(val); onClose(); }}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg text-xs font-black uppercase tracking-wider transition-colors"
          >
            Save Note
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Time Parsing Helper ---
const parseTimeInput = (input) => {
  if (!input) return { hours: 0, valid: true };

  const str = input.toString().trim().toLowerCase();
  if (str === "") return { hours: 0, valid: true };

  // Case 1: "8h 30m", "8h", "30m"
  if (str.includes("h") || str.includes("m")) {
    let hours = 0;
    let minutes = 0;

    const hMatch = str.match(/(\d+(\.\d+)?)h/);
    if (hMatch) hours = parseFloat(hMatch[1]);

    const mMatch = str.match(/(\d+(\.\d+)?)m/);
    if (mMatch) minutes = parseFloat(mMatch[1]);

    return { hours: hours + (minutes / 60), valid: true };
  }

  // Case 2: "1:30"
  if (str.includes(":")) {
    const parts = str.split(":");
    if (parts.length === 2) {
      const h = parseFloat(parts[0]);
      const m = parseFloat(parts[1]);
      if (!isNaN(h) && !isNaN(m)) {
        return { hours: h + (m / 60), valid: true };
      }
    }
  }

  // Case 3: Raw decimal "1.5" or integer "2"
  const val = parseFloat(str);
  if (!isNaN(val)) {
    return { hours: val, valid: true };
  }

  return { hours: 0, valid: false };
};

// --- Format Helper for Display (Optional: format on blur?) --
// keeping it simple: input shows what user types, but we could standardise.
const formatDisplay = (h) => {
  if (!h) return "";
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (mins === 0) return `${hours}`; // "8" instead of "8h" is cleaner? Or "8h"?
  // User asked for "8h 30m" format support.
  // Let's standardise to "8h 30m" if minutes exist, or just "8h"
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};


export default function WeeklyTimeLog({
  tasks,
  projects,
  clients,
}) {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();

  // -- State --
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Rows structure: { id, ..., days: { '2023-01-01': { id: 123, hours: 1.5, inputValue: "1h 30m", ... } } }
  const [rows, setRows] = useState([]);
  const [deletedEntryIds, setDeletedEntryIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Remarks Modal State
  const [remarksModalState, setRemarksModalState] = useState({ open: false, rowId: null, dateStr: null, content: "" });

  // -- Helpers --
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeek);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };
  const weekDays = useMemo(() => getWeekDays(), [currentWeek]);

  const normalizeDateStr = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // -- Data Fetching --
  const fetchUserEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${server}/api/time-entries/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const weekStartStr = normalizeDateStr(weekDays[0]);
      const weekEndStr = normalizeDateStr(weekDays[6]);

      const newRowsMap = new Map();

      data.forEach(entry => {
        const dateStr = normalizeDateStr(entry.entry_date);
        if (dateStr < weekStartStr || dateStr > weekEndStr) return;

        const key = `${entry.project_code || entry.project_name}-${entry.task_id}`;

        if (!newRowsMap.has(key)) {
          newRowsMap.set(key, {
            id: `row-${key}`,
            projectId: entry.project_name,
            projectCode: entry.project_code,
            taskId: entry.task_id,
            client: entry.client,
            days: {}
          });
        }

        const row = newRowsMap.get(key);
        // Storing as decimal hours for UI
        const decimalHours = entry.hours + (entry.minutes / 60);

        row.days[dateStr] = {
          id: entry.id,
          hours: decimalHours,
          inputValue: decimalHours > 0 ? formatDisplay(decimalHours) : "", // Init formatted
          remarks: entry.remarks
        };
      });

      // If no rows, maybe add one empty row?
      const loadedRows = Array.from(newRowsMap.values());
      const finalRows = loadedRows.length > 0 ? loadedRows : [{ id: `new-${Date.now()}`, projectId: "", taskId: "", days: {} }];

      setRows(finalRows);
      setDeletedEntryIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const [timesheetStatus, setTimesheetStatus] = useState(null);

  useEffect(() => {
    fetchUserEntries();
    fetchTimesheetStatus();
  }, [user, currentWeek]);

  const fetchTimesheetStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      // Re-using the my-status endpoint which returns list. 
      // We need to filter for current week. 
      // Ideally backend has a "get status for date range" but "my-status" is all history.
      // Let's filter client side for now or modify backend. 
      // Actually, "my-status" returns all submissions. 
      const startDate = normalizeDateStr(weekDays[0]);
      const endDate = normalizeDateStr(weekDays[6]);

      const response = await axios.get(`${server}/api/timesheets/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      const submissions = response.data;

      const weekStartStr = normalizeDateStr(weekDays[0]);
      const currentSubmission = submissions.find(s => s.week_start_date.startsWith(weekStartStr));

      setTimesheetStatus(currentSubmission ? currentSubmission.status : null);
    } catch (e) { console.error("Status fetch fail", e); }
  };

  const isLocked = timesheetStatus === 'pending' || timesheetStatus === 'approved';

  // -- Handlers --
  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        projectId: "",
        taskId: "",
        days: {}
      }
    ]);
  };

  const handleRowChange = (rowId, field, value, metadata = {}) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const updated = { ...row, [field]: value };
      if (field === 'projectId') {
        updated.projectCode = metadata.code || "";
        updated.client = metadata.client || "";
      }
      return updated;
    }));
  };

  const handleDayChange = (rowId, dateStr, value) => {
    // 1. Update inputValue immediately for typing
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;

      const newDays = { ...row.days };
      // Just update the inputValue temporarily to allow typing
      // We will parse properly on Blur or we can parse dynamically but that might jumpiness if user types "1.5"
      // Better to parse immediately for totals calculation, but keep inputValue as is.

      const parsed = parseTimeInput(value);

      const currentCell = newDays[dateStr] || {};

      if (value === "") {
        if (currentCell.id) {
          newDays[dateStr] = { ...currentCell, hours: 0, inputValue: "" };
        } else {
          delete newDays[dateStr];
        }
      } else {
        newDays[dateStr] = {
          ...currentCell,
          hours: parsed.valid ? parsed.hours : 0,
          inputValue: value
        };
      }
      return { ...row, days: newDays };
    }));
  };

  const handleDayBlur = (rowId, dateStr) => {
    // On blur, reformat the input value to standard "Xh Ym" for consistency
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const cell = row.days[dateStr];
      if (!cell) return row;

      if (cell.hours > 0) {
        const formatted = formatDisplay(cell.hours);
        return {
          ...row,
          days: {
            ...row.days,
            [dateStr]: { ...cell, inputValue: formatted }
          }
        };
      }
      return row;
    }));
  };

  const handleRemarksSave = (val) => {
    const { rowId, dateStr } = remarksModalState;
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const newDays = { ...row.days };
      newDays[dateStr] = { ...(newDays[dateStr] || {}), remarks: val };
      // If hours didn't exist, maybe init? But usually remarks attached to hours.
      // We'll allow remarks even if hours empty, though backend might reject if hours=0 create. 
      // Logic usually implies time entry exists.
      return { ...row, days: newDays };
    }));
  };

  const handleDeleteRow = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (row) {
      const idsToDelete = Object.values(row.days)
        .filter(d => d.id)
        .map(d => d.id);
      setDeletedEntryIds(prev => [...prev, ...idsToDelete]);
    }
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    for (const row of rows) {
      if (Object.keys(row.days).some(d => row.days[d].hours > 0) && (!row.projectId || !row.taskId)) {
        toast.error("Please select Project and Task for all rows with time entries.");
        return;
      }
    }

    const operations = [];

    // 1. Process deletions
    deletedEntryIds.forEach(id => {
      operations.push({ type: 'delete', data: { id } });
    });

    // 2. Process Rows
    rows.forEach(row => {
      Object.entries(row.days).forEach(([dateStr, cell]) => {
        // FIX: Robust calculation to ensure minutes are captured
        // e.g. 1.5 -> 1h 30m. 0.0833 -> 5m.
        const totalMins = Math.round((cell.hours || 0) * 60);
        const hours = Math.floor(totalMins / 60);
        const minutes = totalMins % 60;

        if (cell.id) {
          // Existing
          if (totalMins > 0) {
            operations.push({
              type: 'update',
              data: {
                id: cell.id,
                taskId: row.taskId,
                project: row.projectId,
                project_code: row.projectCode,
                client: row.client,
                date: dateStr,
                hours,
                minutes,
                remarks: cell.remarks || row.remarks || ""
              }
            });
          } else {
            operations.push({ type: 'delete', data: { id: cell.id } });
          }
        } else {
          // New
          if (totalMins > 0) {
            operations.push({
              type: 'create',
              data: {
                taskId: row.taskId,
                project: row.projectId,
                project_code: row.projectCode,
                client: row.client,
                date: dateStr,
                hours,
                minutes,
                remarks: cell.remarks || row.remarks || ""
              }
            });
          }
        }
      });
    });

    if (operations.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${server}/api/time-entries/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ operations })
      });

      if (!res.ok) throw new Error("Bulk save failed");

      toast.success("Timesheet saved successfully!", { theme: 'colored' });
      fetchUserEntries();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save timesheet");
    }
  };

  const getDayTotal = (dateStr) => {
    return rows.reduce((acc, row) => {
      const cell = row.days[dateStr];
      return acc + (cell?.hours || 0);
    }, 0);
  };

  const weeklyTotalHours = weekDays.reduce((acc, day) => acc + getDayTotal(normalizeDateStr(day)), 0);

  const navigateWeek = (dir) => {
    setCurrentWeek(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + (dir * 7));
      return d;
    });
  };

  // Safe mapping with filter
  const projectOptions = Array.isArray(projects)
    ? projects
      .filter(p => p && p.name && p.status !== 'Inactive')
      .map(p => ({ label: p.name, value: p.name, code: p.code, client: p.client }))
    : [];

  const taskOptions = Array.isArray(tasks)
    ? tasks
      .filter(t => t && t.task_name)
      .map(t => ({ label: t.task_name, value: t.task_id }))
    : [];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            <span>Workspace</span>
            <span className="opacity-30">/</span>
            <span className="text-amber-500">Weekly Log</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <IoCalendar size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                Weekly Timesheet
              </h1>
              <p className="text-gray-500 font-bold text-sm mt-1">
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* Week Nav */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-white/5 shadow-inner">
            <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              <IoChevronBack size={18} />
            </button>
            <button onClick={() => {
              const today = new Date();
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(today);
              monday.setDate(diff);
              monday.setHours(0, 0, 0, 0);
              setCurrentWeek(monday);
            }} className="px-4 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-colors tracking-widest">
              Current
            </button>
            <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              <IoChevronForward size={18} />
            </button>
          </div>

          {/* Total Badge & Progress */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className={`flex items-center justify-between px-5 py-2 rounded-xl border transition-all duration-500 bg-zinc-900/50 backdrop-blur-md shadow-inner ${weeklyTotalHours >= 40 ? 'border-emerald-500/30 text-emerald-500' : 'border-amber-500/30 text-amber-500'}`}>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Weekly Progress</span>
                <span className="text-xl font-mono font-black leading-none">{weeklyTotalHours.toFixed(1)}<span className="text-xs opacity-40 ml-1">/ 40h</span></span>
              </div>
              <div className={`p-2 rounded-lg ${weeklyTotalHours >= 40 ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                <IoCheckmarkCircle size={20} />
              </div>
            </div>
            {/* Mini Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((weeklyTotalHours / 40) * 100, 100)}%` }}
                className={`h-full transition-all duration-1000 ${weeklyTotalHours >= 40
                  ? 'bg-linear-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-linear-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  }`}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isLocked}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 border shadow-2xl relative overflow-hidden group ${isLocked
              ? 'bg-zinc-800/10 border-white/5 text-gray-700 cursor-not-allowed shadow-none'
              : 'bg-white text-zinc-950 border-white hover:bg-zinc-200 hover:shadow-white/20'
              }`}
          >
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <IoSave size={16} />
            <span>Save Changes</span>
          </button>


          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isLocked}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 border shadow-2xl relative overflow-hidden group ${isLocked
              ? 'bg-zinc-800/10 border-white/5 text-gray-700 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 hover:shadow-emerald-500/30'
              }`}
          >
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <IoCheckmarkCircle size={16} />
            <span>{timesheetStatus === 'pending' ? 'Pending Approval' : timesheetStatus === 'approved' ? 'Approved' : 'Finalize & Submit'}</span>
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
          <IoCheckmarkCircle size={20} />
          <span>This timesheet has been submitted ({timesheetStatus}). You cannot make changes unless it is rejected.</span>
        </div>
      )}

      {/* GRID CONTAINER */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-xl scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-white/10 hover:scrollbar-thumb-amber-500/20">
        <table className="w-full border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="border-b border-white/5 bg-zinc-900">
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[150px]">Project</th>
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[150px] border-r border-white/5">Task</th>
              {weekDays.map(day => {
                const isToday = normalizeDateStr(day) === normalizeDateStr(new Date());
                const dateObj = new Date(day);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // 0=Sun, 6=Sat

                return (
                  <th key={day.toISOString()} className="px-2 py-4 text-center border-b border-white/5 min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-amber-500' :
                        isWeekend ? 'text-red-500' : 'text-gray-500'
                        }`}>
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full border ${isToday
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30'
                        : isWeekend
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-transparent text-gray-300 border-transparent'
                        }`}>
                        <span className="text-sm font-bold leading-none">
                          {day.getDate()}
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[50px] text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="p-2 align-top">
                    <div className={isLocked ? "pointer-events-none opacity-50" : ""}>
                      <SearchableSelect
                        options={projectOptions}
                        value={row.projectId}
                        placeholder="Select Project"
                        onChange={(val) => {
                          const proj = projects.find(p => p.name === val);
                          handleRowChange(row.id, 'projectId', val, { code: proj?.code, client: proj?.client });
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-2 border-r border-white/5 align-top">
                    <div className={isLocked ? "pointer-events-none opacity-50" : ""}>
                      <SearchableSelect
                        options={taskOptions}
                        value={row.taskId}
                        placeholder="Select Task"
                        onChange={(val) => handleRowChange(row.id, 'taskId', val)}
                      />
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const dateStr = normalizeDateStr(day);
                    const cell = row.days[dateStr];
                    const hasRemarks = cell?.remarks && cell.remarks.trim().length > 0;
                    return (
                      <td key={dateStr} className="p-2 align-top">
                        <div className={`relative group/cell flex items-center justify-center gap-1 ${isLocked ? 'pointer-events-none opacity-50' : ''}`}>
                          {/* Hours Input */}
                          <input
                            type="number"
                            min="0"
                            disabled={isLocked}
                            placeholder="H"
                            className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-[35px] text-center bg-transparent font-mono text-sm focus:outline-none p-1 rounded border border-white/10 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-white/5 transition-all ${Math.floor(cell?.hours || 0) > 0 ? 'text-white font-bold' : 'text-gray-600'
                              }`}
                            value={Math.floor(cell?.hours || 0) || ""}
                            onChange={(e) => {
                              const h = parseInt(e.target.value) || 0;
                              const m = Math.round(((cell?.hours || 0) % 1) * 60);
                              const newTotal = h + (m / 60);
                              handleDayChange(row.id, dateStr, newTotal.toString());
                            }}
                          />
                          <span className="text-gray-600 text-[10px] border-b border-white/10">:</span>
                          {/* Minutes Input */}
                          <input
                            type="number"
                            min="0"
                            max="59"
                            disabled={isLocked}
                            placeholder="M"
                            className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-[35px] text-center bg-transparent font-mono text-sm focus:outline-none p-1 rounded border border-white/10 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 hover:bg-white/5 transition-all ${Math.round(((cell?.hours || 0) % 1) * 60) > 0 ? 'text-white font-bold' : 'text-gray-600'
                              }`}
                            value={Math.round(((cell?.hours || 0) % 1) * 60) || ""}
                            onChange={(e) => {
                              const h = Math.floor(cell?.hours || 0);
                              let m = parseInt(e.target.value) || 0;
                              if (m > 59) m = 59;
                              if (m < 0) m = 0;
                              const newTotal = h + (m / 60);
                              handleDayChange(row.id, dateStr, newTotal.toString());
                            }}
                          />

                          {/* Remarks Trigger */}
                          {(cell?.hours > 0 || hasRemarks) && (
                            <button
                              tabIndex={-1}
                              disabled={isLocked}
                              onClick={() => setRemarksModalState({ open: true, rowId: row.id, dateStr, content: cell?.remarks || "" })}
                              className={`absolute -top-2 -right-1 p-0.5 rounded-full bg-zinc-900 border border-white/10 hover:bg-white/10 transition-colors z-10 ${hasRemarks ? 'text-amber-500 opacity-100' : 'text-gray-600 opacity-0 group-hover/cell:opacity-100'}`}
                              title={cell?.remarks || "Add Remarks"}
                            >
                              <IoChatbubbleEllipsesOutline size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 text-center align-top">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={isLocked}
                      className={`p-2 transition-all opacity-0 group-hover:opacity-100 rounded-lg ${isLocked ? 'text-gray-800 cursor-not-allowed' : 'text-gray-600 hover:text-red-500 hover:bg-red-500/10'
                        }`}
                      title="Delete Row"
                    >
                      <IoTrash size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {/* ADD ROW BTN */}
            <tr>
              <td colSpan={2 + 7 + 1} className="p-2">
                <button
                  onClick={handleAddRow}
                  disabled={isLocked}
                  className={`w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest border border-dashed rounded-lg transition-all ${isLocked
                    ? 'bg-zinc-800/10 border-white/5 text-gray-700 cursor-not-allowed opacity-50'
                    : 'text-gray-500 hover:text-amber-500 hover:bg-amber-500/5 border-white/10 hover:border-amber-500/50'
                    }`}
                >
                  <IoAdd size={16} />
                  Add Project Line
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-zinc-900 border-t border-white/5">
            <tr>
              <td className="p-4 text-xs font-black uppercase text-gray-500 text-right" colSpan={2}>Daily Total</td>
              {weekDays.map(day => {
                const total = getDayTotal(normalizeDateStr(day));
                let colorClass = 'text-gray-600';
                if (total > 0) {
                  if (total < 8) colorClass = 'text-red-500';
                  else if (total === 8) colorClass = 'text-emerald-500';
                  else colorClass = 'text-orange-500';
                }
                return (
                  <td key={day} className="p-4 text-center">
                    <span className={`font-mono font-bold ${colorClass}`}>
                      {total > 0 ? total.toFixed(1) + "h" : '-'}
                    </span>
                  </td>
                );
              })}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <SubmitTimesheetModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        weeklyTotal={weeklyTotalHours * 60}
        weekRange={`${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        onSubmit={async () => {
          // --- VALIDATION BEFORE SUBMISSION ---

          // 1. Validate Project/Task Selection
          for (const row of rows) {
            const hasHours = Object.keys(row.days).some(d => row.days[d].hours > 0);
            if (hasHours && (!row.projectId || !row.taskId)) {
              toast.error("Please select Project and Task for all rows with time entries before submitting.");
              return;
            }
          }

          // 2. Validate Weekly Total >= 40 hours
          if (weeklyTotalHours < 40) {
            toast.error(`Weekly total is ${weeklyTotalHours.toFixed(1)}h. Minimum 40 hours required to submit.`);
            return;
          }

          // 3. Validate Monday-Friday >= 8 hours each
          const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          const insufficientDays = [];

          for (let i = 0; i < 5; i++) { // Monday to Friday (indices 0-4)
            const dateStr = normalizeDateStr(weekDays[i]);
            const dayTotal = getDayTotal(dateStr);
            if (dayTotal < 8) {
              insufficientDays.push(`${weekdayNames[i]} (${dayTotal.toFixed(1)}h)`);
            }
          }

          if (insufficientDays.length > 0) {
            toast.error(`Each weekday requires minimum 8 hours. Insufficient: ${insufficientDays.join(', ')}`);
            return;
          }

          // --- ALL VALIDATIONS PASSED - PROCEED WITH SAVE & SUBMIT ---
          await handleSave();
          try {
            const token = localStorage.getItem("token");
            const weekStartStr = normalizeDateStr(weekDays[0]);
            const weekEndStr = normalizeDateStr(weekDays[6]);

            const res = await fetch(`${server}/api/timesheets/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                weekStartDate: weekStartStr,
                weekEndDate: weekEndStr,
                totalHours: weeklyTotalHours,
              }),
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Submit failed");
            }

            toast.success("Submitted successfully!", { theme: 'colored' });
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#10b981', '#ffffff']
            });
            fetchTimesheetStatus(); // Refresh status to lock UI
          } catch (e) {
            toast.error(e.message);
          }
        }}
      />

      <AnimatePresence>
        {remarksModalState.open && (
          <RemarksModal
            isOpen={remarksModalState.open}
            onClose={() => setRemarksModalState({ ...remarksModalState, open: false })}
            initialValue={remarksModalState.content}
            onSave={handleRemarksSave}
            title="Time Entry Details"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
