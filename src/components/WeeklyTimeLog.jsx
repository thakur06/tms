import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoChevronBack, IoChevronForward, IoCalendar, IoTime,
  IoCheckmarkCircle, IoDocumentText, IoPerson, IoTrash,
  IoAdd, IoLocationOutline, IoLayersOutline, IoSearchOutline
} from 'react-icons/io5'
import { formatDate, formatTime } from '../utils/formatters'
import TimeEntryForm from './TimeEntryForm'
import SubmitTimesheetModal from './SubmitTimesheetModal'
import AddTimeModal from './AddTimeModal'
import { ToastContainer, toast, Zoom } from 'react-toastify';

export default function WeeklyTimeLog({ tasks, projects, users, timeEntries, setTimeEntries, clients }) {

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showAddTimeModal, setShowAddTimeModal] = useState(false)
  const [selectedDateForModal, setSelectedDateForModal] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [userDetails, setUserDetails] = useState({ email: "", dept: "" });
  const [searchUser, setSearchUser] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null)
  const notify = () => toast.error('Please select your name first before adding time entries.', {
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
  const SubmitNotify = () => toast.success('Timesheet submitted successfully!', {
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
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today)
    monday.setDate(diff)
    return monday
  })

  const normalizeDateStr = (date) => {
    if (!date) return '';

    // If it's already a YYYY-MM-DD string, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.split('T')[0];
    }

    // If it's a Date object or needs conversion
    const d = date instanceof Date ? date : new Date(date);

    // Make sure we're using local date, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDays = () => {
    const days = []
    const start = new Date(currentWeek)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()

  const getTimeEntriesForDate = (dateStr) => {
    return timeEntries[dateStr] || []
  }

  const getTotalTimeForDate = (dateStr) => {
    const entries = getTimeEntriesForDate(dateStr)
    return entries.reduce((total, entry) => total + entry.hours * 60 + entry.minutes, 0)
  }

  const getWeeklyTotal = () => {
    return weekDays.reduce((total, day) => total + getTotalTimeForDate(formatDate(day)), 0)
  }

  const weeklyTotalMinutes = getWeeklyTotal()
  const weeklyTotalHours = Math.floor(weeklyTotalMinutes / 60)
  const exceedsLimit = weeklyTotalMinutes > 2400 // 40 hours = 2400 minutes

  const filteredUsers = useMemo(() => {
    if (!searchUser) return users || [];
    return users.filter(u =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser]);

  const handleOpenAddTimeModal = (dateStr) => {
    if (!selectedUser && users) {
      toast.error('Please select your name first before adding time entries.', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        theme: "colored",
      })
      setShowUserDropdown(true)
      return
    }
    setSelectedDateForModal(dateStr)
    setShowAddTimeModal(true)
  }

  const addTimeEntry = async (dateStr, taskName, hours, minutes, metadata = {}) => {
    try {
      const normalizedDate = normalizeDateStr(dateStr);
      const payload = {
        taskId: taskName,
        user: selectedUser || metadata.user || '',
        email: userDetails.email,
        dept: userDetails.dept,
        project: metadata.project || '',
        project_code: metadata.project_code || '',
        client: metadata.client || '',
        country: metadata.country || 'US',
        remarks: metadata.remarks || '',
        date: normalizedDate,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      }

      const response = await fetch('http://localhost:4000/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save time entry');
      const newEntry = await response.json();

      setTimeEntries((prev) => {
        const dateEntries = prev[normalizedDate] || []
        return {
          ...prev,
          [normalizedDate]: [...dateEntries, { ...payload, id: newEntry.id, taskName }],
        }
      });

      // TRIGGER TOAST HERE
      toast.success('Time entry added successfully!', { theme: "colored" });
      return newEntry;

    } catch (err) {
      toast.error('Failed to save entry. Check server connection.');
      throw err;
    }
  }

  const handleSubmitTimesheet = () => {
    // Here you would typically send the data to an API
    console.log('Timesheet submitted:', timeEntries)
    SubmitNotify();
  }

  const deleteTimeEntry = async (dateStr, entryId, entryIndex) => {
    // If we have an entryId (from database), use it
    // Otherwise use entryIndex for local entries
    if (!entryId && entryIndex === undefined) {
      console.error('Cannot delete: No entryId or index provided')
      return
    }

    // if (!window.confirm('Delete this time entry?')) return

    try {
      // If it's a database entry (has entryId), make API call
      if (entryId) {
        const res = await fetch(`http://localhost:4000/api/time-entries/${entryId}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('Delete failed')
      }

      // Optimistic update
      setTimeEntries(prev => {
        const updated = { ...prev }

        if (!updated[dateStr]) return updated

        // Filter out the entry
        updated[dateStr] = updated[dateStr].filter((entry, index) => {
          if (entryId) {
            // Match by database ID
            return entry.id !== entryId
          } else {
            // Match by index for local entries
            return index !== entryIndex
          }
        })

        // Clean up empty date
        if (updated[dateStr].length === 0) {
          delete updated[dateStr]
        }

        return updated
      })

      toast.success('Entry deleted', { theme: 'colored' })
    } catch (err) {
      toast.error('Failed to delete from server')
      console.error(err)
      // Optional: refetch entries to recover state
      if (selectedUser) {
        // Trigger a refetch
        const fetchUserEntries = async (userName) => {
          try {
            const res = await fetch(`http://localhost:4000/api/time-entries/user/${userName}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const entriesByDate = {};
            data.forEach((entry) => {
              const dateStr = entry.entry_date.split('T')[0];
              if (!entriesByDate[dateStr]) entriesByDate[dateStr] = [];

              entriesByDate[dateStr].push({
                id: entry.id, // Ensure ID is included

                taskName: entry.task_id,
                hours: entry.hours,
                minutes: entry.minutes,
                project: entry.project_name,
                project_code: entry.project_code,
                user: entry.user_name,
                location: entry.location,
                remarks: entry.remarks,
              });
            });

            setTimeEntries(entriesByDate);
          } catch (err) {
            console.error('Failed to fetch time entries', err);
            toast.error('Failed to refresh data', { theme: 'colored' });
          }
        };
        fetchUserEntries()
      }
    }
  }

  const navigateWeek = (direction) => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + direction * 7)
      return newDate
    })
  }

  const goToToday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today)
    monday.setDate(diff)
    setCurrentWeek(monday)
  }

  const updateTimeEntry = async (entryId, updatedData) => {
    try {
      const response = await fetch(`http://localhost:4000/api/time-entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedData.taskName,
          hours: updatedData.hours,
          minutes: updatedData.minutes,
          project: updatedData.project,
          project_code: updatedData.project_code,
          client: updatedData.client || '',
          country: updatedData.country || 'US',
          remarks: updatedData.remarks,
          entry_date: updatedData.entry_date,
        }),
      });

      if (!response.ok) throw new Error('Update failed');

      // (keep local state update logic same...)

      // TRIGGER TOAST HERE
      toast.success('Entry updated!', { theme: "colored" });

    } catch (error) {
      toast.error('Update failed');
      throw error;
    }
  };

  useEffect(() => {
    if (!selectedUser) return

    const fetchUserEntries = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/time-entries/user/${selectedUser}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        console.log('Fetched data:', data) // Check what data looks like

        const entriesByDate = {}
        data.forEach((entry) => {
          const utcDate = new Date(entry.entry_date)
          const dateStr = normalizeDateStr(utcDate)
          if (!entriesByDate[dateStr]) entriesByDate[dateStr] = []

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
          })
        })

        setTimeEntries(entriesByDate)
      } catch (err) {
        console.error('Failed to fetch time entries', err)
      }
    }

    fetchUserEntries()
  }, [selectedUser, setTimeEntries])

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* --- HEADER SECTION --- */}
      <header className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          {/* User Selection */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <IoPerson className="text-indigo-500" size={14} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Team Member</span>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IoSearchOutline className={`${selectedUser ? 'text-indigo-500' : 'text-slate-400'} transition-colors`} />
              </div>

              <input
                type="text"
                className="w-full pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                placeholder="Search name or email..."
                value={selectedUser || searchUser}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchUser(value);
                  if (selectedUser && value !== selectedUser) {
                    setSelectedUser('');
                    setTimeEntries({});
                    setUserDetails({ email: "", dept: "" });
                  }
                }}
                onFocus={() => setShowUserDropdown(true)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
              />

              {/* Refined Dropdown */}
              <AnimatePresence>
                {!selectedUser && showUserDropdown && filteredUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {/* HEIGHT LIMIT LOGIC:
              Each item is roughly 64px. 
              64 * 3 = 192px. 
              Setting max-h-48 (192px) or max-h-[200px] ensures exactly 3 items show, 
              then scrolling starts.
          */}
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user.name);
                            setUserDetails({ email: user.email, dept: user.dept });
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-all flex flex-col border-b border-slate-50 last:border-0 group"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            {user.email}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Subtle scroll indicator if more than 3 users */}
                    {filteredUsers.length > 3 && (
                      <div className="bg-slate-50 py-1.5 text-center border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          Scroll for more members
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clear/Delete selection button */}
              {selectedUser && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    onClick={() => { setSelectedUser(''); setTimeEntries({}); setSearchUser(''); }}
                    className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all active:scale-90"
                    title="Clear Selection"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><IoChevronBack /></button>
              <button onClick={goToToday} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Today</button>
              <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><IoChevronForward /></button>
            </div>

            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 ${exceedsLimit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Weekly Total</span>
                <span className="text-xl font-black">{formatTime(weeklyTotalMinutes)}</span>
              </div>
              <IoTime size={24} className="opacity-50" />
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="h-[52px] px-6 bg-green-600 hover:bg-green-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
            >
              <IoCheckmarkCircle size={20} />
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateStr = formatDate(day)
          const dayEntries = getTimeEntriesForDate(dateStr)
          const dayTotal = getTotalTimeForDate(dateStr)
          const isToday = formatDate(new Date()) === dateStr
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col rounded-3xl transition-all duration-300 ${isToday ? 'bg-white ring-2 ring-indigo-500 shadow-xl' : dayName.toUpperCase() == 'SAT' || dayName.toUpperCase() == 'SUN' ? 'bg-white ring-2 ring-red-100 shadow-xl' : 'bg-white ring-2 ring-green-100 shadow-xl'
                }`}
            >
              {/* Day Header */}
              <div className={`p-4 rounded-t-3xl flex justify-between items-center ${isToday ? 'bg-indigo-500 text-white' : dayName.toUpperCase() == 'SAT' || dayName.toUpperCase() == 'SUN' ? 'bg-red-200 text-red-600' : 'bg-green-300 text-slate-600'}`}>
                <div>
                  <h4 className={`text-lg leading-tight ${dayName.toUpperCase() == 'SAT' || dayName.toUpperCase() == 'SUN' ? 'text-red-500 text-[16px] italic' : 'font-black'}`}>{day.getDate()}</h4>
                  <p className={`text-[10px] uppercase font-bold opacity-80 ${dayName.toUpperCase() == 'SAT' || dayName.toUpperCase() == 'SUN' ? 'text-red-500 text-[16px] italic' : 'text-slate-600'}`}>{dayName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold opacity-60 block">Daily Total</span>
                  <span className="font-bold">{formatTime(dayTotal)}</span>
                </div>
              </div>

              {/* Entries Body */}
              <div className="p-3 flex-1 space-y-3 max-h-[300px] overflow-y-auto hide-y-scroll">
                {dayEntries.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center opacity-20 italic text-sm text-slate-500">
                    <IoCalendar size={32} className="mb-2" />
                    <p>No entries</p>
                  </div>
                ) : (
                  dayEntries.map((entry, entryIndex) => (
                    <div key={entry.id || entryIndex} className="group p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg truncate max-w-[100px]">
                          {entry.project_code || 'N/A'}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingEntry(entry); setSelectedDateForModal(dateStr); setShowAddTimeModal(true); }}
                            className="p-1 hover:text-indigo-600"
                          >
                            <IoLayersOutline size={14} />
                          </button>
                        </div>
                      </div>

                      <h5 className="text-sm font-semibold text-slate-800 truncate mb-1">{entry.taskName}</h5>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                        <span className="flex items-center gap-1"><IoTime className="text-indigo-400" /> {entry.hours}h {entry.minutes}m</span>
                        {entry.location && <span className="flex items-center gap-1"><IoLocationOutline className="text-emerald-400" /> {entry.location}</span>}
                      </div>

                      {entry.remarks && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 italic border-l-2 border-slate-100 pl-2">
                          "{entry.remarks}"
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between">
                        <button
                          onClick={() => { setEditingEntry(entry); setSelectedDateForModal(dateStr); setShowAddTimeModal(true); }}
                          className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter"
                        >
                          Edit Entry
                        </button>
                        <button
                          onClick={() => deleteTimeEntry(dateStr, entry.id, entryIndex)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <IoTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Button Area */}
              <div className="p-3 bg-slate-50/50 rounded-b-3xl">
                <button
                  onClick={() => handleOpenAddTimeModal(dateStr)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-white transition-all"
                >
                  <IoAdd size={16} />
                  Add Time
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
      <SubmitTimesheetModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        weeklyTotal={weeklyTotalMinutes}
        weekRange={`${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        onSubmit={handleSubmitTimesheet}
      />
      <div className="relative z-[999]">
      <AddTimeModal
        isOpen={showAddTimeModal}
        onClose={() => {
          setShowAddTimeModal(false)
          setEditingEntry(null)
        }}
        dateStr={selectedDateForModal}
        tasks={tasks}
        projects={projects}
        selectedUser={selectedUser}
        entry={editingEntry}
        onAdd={addTimeEntry}
        onUpdate={updateTimeEntry}
        clients={clients}
      />
      </div>
      <ToastContainer
        position="top-center"
        transition={Zoom}
        theme="colored"
        autoClose={2000}
        style={{ zIndex: 99999 }} // Force it above any modal
        hideProgressBar={true}
      />
    </div>
  )
}