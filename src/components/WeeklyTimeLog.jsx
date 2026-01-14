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

      // Refetch entries to ensure consistency
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
    // If we have an entryId (from database), use it
    // Otherwise use entryIndex for local entries
    if (!entryId && entryIndex === undefined) {
      console.error('Cannot delete: No entryId or index provided')
      return
    }

    // if (!window.confirm('Delete this time entry?')) return

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

      // Optimistic update
      setTimeEntries(prev => {
        const updated = { ...prev }

        if (!updated[dateStr]) return updated

        updated[dateStr] = updated[dateStr].filter((entry, index) => {
          if (entryId) {
            return entry.id !== entryId
          } else {
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
      
      if (user) {
        fetchUserEntries();
      }
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
        })
      })

      setTimeEntries(entriesByDate)
    } catch (err) {
      console.error('Failed to fetch time entries', err)
      toast.error('Failed to load time entries', { theme: 'colored' })
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserEntries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* --- HEADER SECTION --- */}
      <header className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">

          {/* Logged-in User Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <IoCalendar className="text-indigo-500 hidden sm:block" size={20} />
            <div className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex-1 sm:flex-none">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Not signed in'}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email || ''}</p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button 
                onClick={() => navigateWeek(-1)} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 flex-1 sm:flex-none"
              >
                <IoChevronBack size={18} />
              </button>
              <button 
                onClick={goToToday} 
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none"
              >
                Today
              </button>
              <button 
                onClick={() => navigateWeek(1)} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 flex-1 sm:flex-none"
              >
                <IoChevronForward size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-xl border-2 transition-all flex-1 sm:flex-none ${exceedsLimit ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-wide font-semibold whitespace-nowrap ${exceedsLimit ? 'text-red-600' : 'text-indigo-600'}`}>
                    Weekly Total
                  </span>
                  <span className={`text-xl font-bold ${exceedsLimit ? 'text-red-700' : 'text-indigo-700'}`}>
                    {formatTime(weeklyTotalMinutes)}
                  </span>
                </div>
                <IoTime size={24} className={exceedsLimit ? 'text-red-400' : 'text-indigo-400'} />
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 sm:px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap flex-shrink-0"
              >
                <IoCheckmarkCircle size={20} />
                <span className="hidden sm:inline">Submit</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
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
      <div className="relative z-999">
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
        theme="colored"
        autoClose={2000}
        style={{ zIndex: 99999 }} // Force it above any modal
        hideProgressBar={true}
      />
    </div>
  )
}