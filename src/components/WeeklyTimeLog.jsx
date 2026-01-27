import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoChevronBack,
  IoChevronForward,
  IoCalendar,
  IoTime,
  IoCheckmarkCircle,
  IoTrash,
  IoAdd,
  IoLocationOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { formatDate, formatTime } from "../utils/formatters";
import SubmitTimesheetModal from "./SubmitTimesheetModal";
import AddTimeModal from "./AddTimeModal";
import { toast, Zoom } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function WeeklyTimeLog({
  tasks,
  projects,
  timeEntries,
  setTimeEntries,
  clients,
}) {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const SubmitNotify = () =>
    toast.success("Timesheet submitted successfully!", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Zoom,
    });

  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    return monday;
  });

  // ... (keep helper functions same as original)
  const normalizeDateStr = (date) => {
    if (!date) return "";
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.split("T")[0];
    }
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  const weekDays = getWeekDays();

  const getTimeEntriesForDate = (dateStr) => {
    return timeEntries[dateStr] || [];
  };

  const getTotalTimeForDate = (dateStr) => {
    const entries = getTimeEntriesForDate(dateStr);
    return entries.reduce(
      (total, entry) => total + entry.hours * 60 + entry.minutes,
      0,
    );
  };

  const getWeeklyTotal = () => {
    return weekDays.reduce(
      (total, day) => total + getTotalTimeForDate(formatDate(day)),
      0,
    );
  };

  const weeklyTotalMinutes = getWeeklyTotal();
  const exceedsLimit = weeklyTotalMinutes > 2400; // 40 hours = 2400 minutes

  const handleOpenAddTimeModal = (dateStr) => {
    if (!user) {
      toast.error("Please login to add time entries.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        theme: "colored",
      });
      return;
    }
    setSelectedDateForModal(dateStr);
    setShowAddTimeModal(true);
  };

  const addTimeEntry = async (
    dateStr,
    taskName,
    hours,
    minutes,
    metadata = {},
  ) => {
    try {
      if (!user) {
        toast.error("Please login to add time entries.");
        return;
      }

      const token = localStorage.getItem("token");
      const normalizedDate = normalizeDateStr(dateStr);
      const payload = {
        taskId: taskName,
        project: metadata.project || "",
        project_code: metadata.project_code || "",
        client: metadata.client || "",
        country: metadata.country || "US",
        remarks: metadata.remarks || "",
        date: normalizedDate,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      };

      const response = await fetch(`${server}/api/time-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save time entry");
      const newEntry = await response.json();

      await fetchUserEntries();
      toast.success("Time entry added successfully!", { theme: "colored" });
      return newEntry;
    } catch (err) {
      toast.error("Failed to save entry. Check server connection.");
      throw err;
    }
  };

  const handleSubmitTimesheet = async () => {
    try {
      if (!user) {
        toast.error("Please login to submit timesheet.");
        return;
      }

      // Calculate week start and end dates
      const weekStart = new Date(currentWeek);
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      // Calculate total hours for the week
      const totalMinutes = weeklyTotalMinutes;
      const totalHours = (totalMinutes / 60).toFixed(2);

      // --- New Rule: 8 hours per day (Mon-Fri) ---
      const weekdays = weekDays.slice(0, 5); // Assuming Monday is index 0 or handling Mon-Fri specifically
      const workdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      
      for (let i = 0; i < 5; i++) {
        const day = weekDays[i]; 
        const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
        const dateStr = formatDate(day);
        const dayTotal = getTotalTimeForDate(dateStr); // returns minutes

        if (dayTotal < 480) { // 8 hours * 60 minutes
          toast.error(
            `${dayName} logging is ${formatTime(dayTotal)}. At least 8 hours are required for submission.`,
            { theme: "colored" }
          );
          return;
        }
      }

      if (totalMinutes < 2400) {
        toast.error(
          "Minimum 40 hours per week is required to submit timesheet.",
        );
        return;
      }
      const token = localStorage.getItem("token");
      const response = await fetch(`${server}/api/timesheets/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weekStartDate: weekStartStr,
          weekEndDate: weekEndStr,
          totalHours: parseFloat(totalHours),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit timesheet");
      }

      SubmitNotify();
      console.log("Timesheet submitted successfully");
    } catch (err) {
      console.error("Submit timesheet error:", err);
      toast.error(err.message || "Failed to submit timesheet");
    }
  };

  const deleteTimeEntry = async (dateStr, entryId, entryIndex) => {
    if (!entryId && entryIndex === undefined) {
      console.error("Cannot delete: No entryId or index provided");
      return;
    }

    try {
      if (entryId) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${server}/api/time-entries/${entryId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Delete failed");
      }

      setTimeEntries((prev) => {
        const updated = { ...prev };
        if (!updated[dateStr]) return updated;
        updated[dateStr] = updated[dateStr].filter((entry, index) => {
          if (entryId) return entry.id !== entryId;
          return index !== entryIndex;
        });
        if (updated[dateStr].length === 0) delete updated[dateStr];
        return updated;
      });

      toast.success("Entry deleted", { theme: "colored" });
      if (user) fetchUserEntries();
    } catch (err) {
      toast.error("Failed to delete from server");
      console.error(err);
    }
  };

  const navigateWeek = (direction) => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction * 7);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    setCurrentWeek(monday);
  };

  const updateTimeEntry = async (entryId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${server}/api/time-entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: updatedData.taskName,
          hours: updatedData.hours,
          minutes: updatedData.minutes,
          project: updatedData.project,
          project_code: updatedData.project_code,
          client: updatedData.client || "",
          country: updatedData.country || "US",
          remarks: updatedData.remarks,
          entry_date: updatedData.entry_date,
        }),
      });

      if (!response.ok) throw new Error("Update failed");
      await fetchUserEntries();
      toast.success("Entry updated!", { theme: "colored" });
    } catch (error) {
      toast.error("Update failed");
      throw error;
    }
  };

  const fetchUserEntries = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${server}/api/time-entries/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const entriesByDate = {};
      data.forEach((entry) => {
        const utcDate = new Date(entry.entry_date);
        const dateStr = normalizeDateStr(utcDate);
        if (!entriesByDate[dateStr]) entriesByDate[dateStr] = [];
        entriesByDate[dateStr].push({
          id: entry.id,
          taskName: entry.task_id,
          hours: entry.hours,
          minutes: entry.minutes,
          project: entry.project_name,
          project_code: entry.project_code,
          user: entry.user_name,
          location: entry.location,
          remarks: entry.remarks,
          client: entry.client || "",
          country: entry.country || "US",
        });
      });
      setTimeEntries(entriesByDate);
    } catch (err) {
      console.error("Failed to fetch time entries", err);
      toast.error("Failed to load time entries", { theme: "colored" });
    }
  };

  useEffect(() => {
    if (user) fetchUserEntries();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Logged-in User Info */}
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            <span>Workspace</span>
            <span className="opacity-30">/</span>
            <span className="text-amber-500/60">Timesheet</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <IoCalendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
                Weekly Timesheet
              </h1>
              <p className="text-gray-500 mt-1.5 text-xs font-bold italic">
                {user?.name ? `Tracking for ${user.name}` : "Not signed in"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2.5 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#161efd]"
            >
              <IoChevronBack size={18} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white hover:text-[#161efd] rounded-lg transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2.5 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#161efd]"
            >
              <IoChevronForward size={18} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div
              className={`flex items-center gap-3 px-5 py-2 rounded-xl border w-full sm:w-auto justify-between ${exceedsLimit ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}
            >
              <div className="flex flex-col">
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold ${exceedsLimit ? "text-red-500" : "text-amber-500"}`}
                >
                  Weekly Total
                </span>
                <span
                  className={`text-xl font-bold font-mono ${exceedsLimit ? "text-red-500" : "text-white"}`}
                >
                  {formatTime(weeklyTotalMinutes)}
                </span>
              </div>
              <IoTime
                size={24}
                className={exceedsLimit ? "text-red-500" : "text-amber-500"}
              />
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <IoCheckmarkCircle size={20} />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateStr = formatDate(day);
          const dayEntries = getTimeEntriesForDate(dateStr);
          const dayTotal = getTotalTimeForDate(dateStr);
          const isToday = formatDate(new Date()) === dateStr;
          const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
          const isWeekend =
            dayName.toUpperCase() === "SAT" || dayName.toUpperCase() === "SUN";

          const dayColors = [
            "from-amber-400 to-amber-600 text-amber-500 bg-zinc-900 border-white/5", // Mon
            "from-yellow-400 to-yellow-600 text-yellow-500 bg-zinc-900 border-white/5", // Tue
            "from-orange-400 to-orange-600 text-orange-500 bg-zinc-900 border-white/5", // Wed
            "from-amber-500 to-yellow-500 text-amber-500 bg-zinc-900 border-white/5", // Thu
            "from-orange-500 to-red-500 text-orange-500 bg-zinc-900 border-white/5", // Fri
            "from-yellow-500 to-amber-500 text-yellow-500 bg-zinc-900 border-white/5", // Sat
            "from-red-500 to-orange-500 text-red-500 bg-zinc-900 border-white/5" // Sun
          ];

          // Map 0-6 (Sun-Sat) to a Monday-start or rotating index. 
          // getDay() returns 0 for Sun, 1 for Mon...
          // We want Mon as index 0 for the Workday-first feel if needed, but simple wrap is fine.
          const colorClass = dayColors[day.getDay()];

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col ui-card overflow-hidden h-full min-h-[300px] ${
                isToday
                  ? "border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-500/30"
                  : ""
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-4 border-b border-white/5 relative overflow-hidden ${
                  isToday
                    ? "bg-zinc-800/80"
                    : "bg-zinc-900/50"
                }`}
              >
                {/* Visual Color Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${colorClass}`} />
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-linear-to-br -mr-12 -mt-12 opacity-30 ${colorClass}`} />
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      className={`text-2xl font-black leading-none mb-1 relative z-10 ${
                        isToday
                          ? "text-amber-500"
                          : colorClass.split(' ').find(c => c.startsWith('text-'))
                      }`}
                    >
                      {day.getDate()}
                    </h4>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${
                        isToday
                          ? "text-amber-400"
                          : colorClass.split(' ').find(c => c.startsWith('text-'))
                      }`}
                    >
                      {dayName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">
                      Total
                    </span>
                    <span
                      className={`font-mono font-bold block ${dayTotal > 0 ? "text-white" : "text-gray-500"}`}
                    >
                      {formatTime(dayTotal)}
                    </span>
                    {dayTotal > 0 && !isWeekend && (
                      <div
                        className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center justify-end gap-1 ${
                          dayTotal >= 480
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {dayTotal >= 480 ? (
                          <>
                            <IoCheckmarkCircle size={10} />
                            DONE
                          </>
                        ) : (
                          <>
                            <IoTime size={10} />
                            LOG 8H
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Entries Body */}
              <div className="p-3 flex-1 space-y-2 overflow-y-auto hide-y-scroll md:max-h-[290px] max-h-[265px]">
                {dayEntries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 opacity-30 text-sm font-medium text-gray-500">
                    <IoCalendar size={24} className="mb-2" />
                    <p>No entries</p>
                  </div>
                ) : (
                  dayEntries.map((entry, entryIndex) => (
                    <div
                      key={entry.id || entryIndex}
                      className="group relative p-3 bg-zinc-800/50 border border-white/5 rounded-xl hover:bg-zinc-800 hover:border-amber-500/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 truncate max-w-[80px]">
                          {entry.project_code || "N/A"}
                        </span>
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setSelectedDateForModal(dateStr);
                              setShowAddTimeModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-amber-500 rounded hover:bg-amber-500/10 transition-colors"
                          >
                            <IoLayersOutline size={12} />
                          </button>
                        </div>
                      </div>

                      <h5
                        className="text-xs font-bold text-gray-200 truncate mb-1"
                        title={entry.taskName}
                      >
                        {entry.taskName}
                      </h5>

                      <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500 mb-2">
                        <span className="flex items-center gap-1 text-amber-500">
                          <IoTime size={10} />
                          {entry.hours}h {entry.minutes}m
                        </span>
                        {entry.location && (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <IoLocationOutline size={10} />
                            {entry.location}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            deleteTimeEntry(dateStr, entry.id, entryIndex)
                          }
                          className="text-[10px] text-red-500 hover:text-red-400 font-semibold"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Button Area */}
              <div className="p-3 border-t border-white/5 bg-zinc-900/50">
                <button
                  onClick={() => handleOpenAddTimeModal(dateStr)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-amber-500 border border-dashed border-white/10 rounded-xl hover:border-amber-500 hover:bg-amber-500/10 transition-all"
                >
                  <IoAdd size={14} />
                  Add Entry
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <SubmitTimesheetModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        weeklyTotal={weeklyTotalMinutes}
        weekRange={`${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        onSubmit={handleSubmitTimesheet}
      />

      <div className="relative z-[9999]">
        <AddTimeModal
          isOpen={showAddTimeModal}
          onClose={() => {
            setShowAddTimeModal(false);
            setEditingEntry(null);
          }}
          dateStr={selectedDateForModal}
          tasks={tasks}
          projects={projects}
          entry={editingEntry}
          onAdd={addTimeEntry}
          onUpdate={updateTimeEntry}
          clients={clients}
        />
      </div>

    </div>
  );
}
