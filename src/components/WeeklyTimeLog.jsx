import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  IoChevronBack, IoChevronForward, IoCalendar, IoTime,
  IoCheckmarkCircle, IoTrash,
  IoAdd, IoLocationOutline, IoLayersOutline
} from 'react-icons/io5'
import { formatDate, formatTime } from '../utils/formatters'
import SubmitTimesheetModal from './SubmitTimesheetModal'
import AddTimeModal from './AddTimeModal'
import { ToastContainer, toast, Zoom } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function WeeklyTimeLog({ tasks, projects, timeEntries, setTimeEntries, clients }) {
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showAddTimeModal, setShowAddTimeModal] = useState(false)
  const [selectedDateForModal, setSelectedDateForModal] = useState('')
  const [editingEntry, setEditingEntry] = useState(null)
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

  // ... (keep helper functions same as original)
  const normalizeDateStr = (date) => {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.split('T')[0];
    }
    const d = date instanceof Date ? date : new Date(date);
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
  const exceedsLimit = weeklyTotalMinutes > 2400 // 40 hours = 2400 minutes

  const handleOpenAddTimeModal = (dateStr) => {
    if (!user) {
      toast.error('Please login to add time entries.', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        theme: "colored",
      })
      return
    }
    setSelectedDateForModal(dateStr)
    setShowAddTimeModal(true)
  }

  const addTimeEntry = async (dateStr, taskName, hours, minutes, metadata = {}) => {
    try {
      if (!user) {
        toast.error('Please login to add time entries.');
        return;
      }

      const token = localStorage.getItem('token');
      const normalizedDate = normalizeDateStr(dateStr);
      const payload = {
        taskId: taskName,
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save time entry');
      const newEntry = await response.json();

      await fetchUserEntries();
      toast.success('Time entry added successfully!', { theme: "colored" });
      return newEntry;

    } catch (err) {
      toast.error('Failed to save entry. Check server connection.');
      throw err;
    }
  }

  const handleSubmitTimesheet = () => {
    console.log('Timesheet submitted:', timeEntries)
    SubmitNotify();
  }

  const deleteTimeEntry = async (dateStr, entryId, entryIndex) => {
    if (!entryId && entryIndex === undefined) {
      console.error('Cannot delete: No entryId or index provided')
      return
    }

    try {
      if (entryId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/time-entries/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!res.ok) throw new Error('Delete failed')
      }

      setTimeEntries(prev => {
        const updated = { ...prev }
        if (!updated[dateStr]) return updated
        updated[dateStr] = updated[dateStr].filter((entry, index) => {
          if (entryId) return entry.id !== entryId
          return index !== entryIndex
        })
        if (updated[dateStr].length === 0) delete updated[dateStr]
        return updated
      })

      toast.success('Entry deleted', { theme: 'colored' })
      if (user) fetchUserEntries();
    } catch (err) {
      toast.error('Failed to delete from server')
      console.error(err)
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/time-entries/${entryId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      await fetchUserEntries();
      toast.success('Entry updated!', { theme: "colored" });

    } catch (error) {
      toast.error('Update failed');
      throw error;
    }
  };

  const fetchUserEntries = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/time-entries/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

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
          client: entry.client || '',
          country: entry.country || 'US',
        })
      })
      setTimeEntries(entriesByDate)
    } catch (err) {
      console.error('Failed to fetch time entries', err)
      toast.error('Failed to load time entries', { theme: 'colored' })
    }
  }

  useEffect(() => {
    if (user) fetchUserEntries()
  }, [user])

  return (
    <div className="w-full space-y-6">
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Logged-in User Info */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <IoCalendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Weekly Timesheet</h2>
            <p className="text-slate-400 text-sm">
              {user?.name ? `Tracking for ${user.name}` : 'Not signed in'}
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button 
              onClick={() => navigateWeek(-1)} 
              className="p-2.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <IoChevronBack size={18} />
            </button>
            <button 
              onClick={goToToday} 
              className="px-4 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button 
              onClick={() => navigateWeek(1)} 
              className="p-2.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <IoChevronForward size={18} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
             <div className={`flex items-center gap-3 px-5 py-2 rounded-xl border w-full sm:w-auto justify-between ${exceedsLimit ? 'bg-red-500/10 border-red-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${exceedsLimit ? 'text-red-400' : 'text-indigo-400'}`}>
                  Weekly Total
                </span>
                <span className={`text-xl font-bold font-mono ${exceedsLimit ? 'text-red-300' : 'text-indigo-300'}`}>
                  {formatTime(weeklyTotalMinutes)}
                </span>
              </div>
              <IoTime size={24} className={exceedsLimit ? 'text-red-400' : 'text-indigo-400'} />
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
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
          const dateStr = formatDate(day)
          const dayEntries = getTimeEntriesForDate(dateStr)
          const dayTotal = getTotalTimeForDate(dateStr)
          const isToday = formatDate(new Date()) === dateStr
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
          const isWeekend = dayName.toUpperCase() === 'SAT' || dayName.toUpperCase() === 'SUN'

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col ui-card overflow-hidden h-full min-h-[300px] ${
                isToday 
                  ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' 
                  : ''
              }`}
            >
              {/* Day Header */}
              <div className={`p-4 border-b border-white/5 ${
                isToday 
                  ? 'bg-indigo-500/20' 
                  : isWeekend 
                    ? 'bg-rose-500/10' 
                    : 'bg-white/[0.02]'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`text-2xl font-black leading-none mb-1 ${
                      isToday ? 'text-white' : isWeekend ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {day.getDate()}
                    </h4>
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      isToday ? 'text-indigo-300' : isWeekend ? 'text-rose-400/70' : 'text-slate-500'
                    }`}>
                      {dayName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total</span>
                    <span className={`font-mono font-bold ${dayTotal > 0 ? 'text-white' : 'text-slate-600'}`}>
                      {formatTime(dayTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Entries Body */}
              <div className="p-3 flex-1 space-y-2 overflow-y-auto hide-y-scroll md:max-h-[290px] max-h-[265px]">
                {dayEntries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 opacity-20 text-sm font-medium text-slate-400">
                    <IoCalendar size={24} className="mb-2" />
                    <p>No entries</p>
                  </div>
                ) : (
                  dayEntries.map((entry, entryIndex) => (
                    <div 
                      key={entry.id || entryIndex} 
                      className="group relative p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/10 text-slate-300 rounded border border-white/5 truncate max-w-[80px]">
                          {entry.project_code || 'N/A'}
                        </span>
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingEntry(entry); setSelectedDateForModal(dateStr); setShowAddTimeModal(true); }}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-indigo-500/10 transition-colors"
                          >
                            <IoLayersOutline size={12} />
                          </button>
                        </div>
                      </div>

                      <h5 className="text-xs font-bold text-slate-200 truncate mb-1" title={entry.taskName}>
                        {entry.taskName}
                      </h5>

                      <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 mb-2">
                        <span className="flex items-center gap-1 text-indigo-300/80">
                          <IoTime size={10} /> 
                          {entry.hours}h {entry.minutes}m
                        </span>
                        {entry.location && (
                          <span className="flex items-center gap-1 text-emerald-300/80">
                            <IoLocationOutline size={10} /> 
                            {entry.location}
                          </span>
                        )}
                      </div>

                      {/* {entry.remarks && (
                        <p className="text-[10px] text-slate-400 italic border-l-2 border-white/10 pl-2 mb-2 line-clamp-1">
                          "{entry.remarks}"
                        </p>
                      )} */}
                      
                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => deleteTimeEntry(dateStr, entry.id, entryIndex)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Button Area */}
              <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                <button
                  onClick={() => handleOpenAddTimeModal(dateStr)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700/50 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                >
                  <IoAdd size={14} />
                  Add Entry
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

      <div className="relative z-[9999]">
        <AddTimeModal
          isOpen={showAddTimeModal}
          onClose={() => {
            setShowAddTimeModal(false)
            setEditingEntry(null)
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
      
      <ToastContainer
        position="top-center"
        transition={Zoom}
        theme="dark"
        autoClose={2000}
        style={{ zIndex: 99999 }}
        hideProgressBar={true}
      />
    </div>
  )
}