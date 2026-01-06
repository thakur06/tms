import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IoChevronBack, IoChevronForward, IoCalendar, IoTime, IoCheckmarkCircle, IoDocumentText, IoPerson, IoTrash } from 'react-icons/io5'
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

  const filteredUsers = users
    ? searchUser
      ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
          user.email.toLowerCase().includes(searchUser.toLowerCase())
      )
      : users
    : []

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
    console.log(taskName + " " + JSON.stringify(metadata))
    try {
      const normalizedDate = normalizeDateStr(dateStr);
  
      // Send task name directly - no need to find task
      const payload = {
        taskId: taskName, // Send task name directly
        user: selectedUser || metadata.user || '',
        email: userDetails.email,
        dept: userDetails.dept,
        project: metadata.project || '',
        project_code: metadata.project_code || '',
        client: metadata.client || '', // Added client field
        country: metadata.country || 'US', // Added country field with default
        location: metadata.location || '',
        remarks: metadata.remarks || '',
        date: normalizedDate,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      }
  console.log(payload);
      // Send to API
      const response = await fetch('http://localhost:4000/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error('Failed to save time entry');
  
      const newEntry = await response.json();
  
      // Update UI with the new entry (including ID from database)
      setTimeEntries((prev) => {
        const dateEntries = prev[normalizedDate] || []
        return {
          ...prev,
          [normalizedDate]: [
            ...dateEntries,
            {
              id: newEntry.id,
              taskName: taskName, // Use taskName directly
              hours: parseInt(hours) || 0,
              minutes: parseInt(minutes) || 0,
              project: metadata.project || '',
              project_code: metadata.project_code || '',
              client: metadata.client || '', // Added client field
              country: metadata.country || 'US', // Added country field
              user: selectedUser || metadata.user || '',
              location: metadata.location || '',
              remarks: metadata.remarks || '',
            },
          ],
        }
      });
  
      return newEntry;
  
    } catch (err) {
      console.error('Failed to save time entry', err);
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
      // Send task name directly - no need to find task
      // Send update to API
      const response = await fetch(`http://localhost:4000/api/time-entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedData.taskName, // Send taskName directly
          hours: updatedData.hours,
          minutes: updatedData.minutes,
          project: updatedData.project,
          project_code: updatedData.project_code,
          client: updatedData.client || '', // Added client field
          country: updatedData.country || 'US', // Added country field with default
          location: updatedData.location,
          remarks: updatedData.remarks,
          entry_date: updatedData.entry_date,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }
  
      const updatedEntry = await response.json();
  
      // Update the local state with the updated entry
      setTimeEntries(prev => {
        const updated = { ...prev };
  
        // Find and update the entry in state
        Object.keys(updated).forEach(dateKey => {
          if (updated[dateKey]) {
            updated[dateKey] = updated[dateKey].map(entry => {
              if (entry.id === entryId) {
                return {
                  ...entry,
                  taskName: updatedData.taskName, // Update taskName
                  hours: updatedData.hours,
                  minutes: updatedData.minutes,
                  project: updatedData.project || '',
                  project_code: updatedData.project_code || '',
                  client: updatedData.client || '', // Added client field
                  country: updatedData.country || 'US', // Added country field
                  location: updatedData.location || '',
                  remarks: updatedData.remarks || '',
                };
              }
              return entry;
            });
          }
        });
  
        return updated;
      });
  
      return updatedEntry;
  
    } catch (error) {
      console.error('Error updating time entry:', error);
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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mt-4">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={1}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Zoom}
      />
      {/* User Selection at Top */}
      {users && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <IoPerson className="w-5 h-5 text-indigo-500" />
            Select Your Name
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Search by name or email..."
              value={selectedUser ? selectedUser : searchUser}
              onChange={(e) => {
                const value = e.target.value
                setSearchUser(value)
                if (selectedUser && value !== selectedUser) {
                  setSelectedUser('')
                  setUserDetails({ email: "", dept: "" });
                }
              }}
              onFocus={() => setShowUserDropdown(true)}
              onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
            />
            {!selectedUser && showUserDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-20 w-full max-w-md mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user.name)
                      setUserDetails({ email: user.email, dept: user.dept });
                      setSearchUser('')
                      setShowUserDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                  >
                    {user.name} ({user.email})
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="mt-2 px-3 py-2 mx-3 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
                <span>Logged as: {selectedUser}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser('')
                    setUserDetails({ email: "", dept: "" });
                    setSearchUser('')
                    setTimeEntries({})
                  }}
                  className="text-indigo-500 hover:text-indigo-700 ml-2"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Time Logging</p>
          <h3 className="text-lg font-semibold text-gray-900">
            Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex gap-2">
            <button
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1"
              onClick={() => navigateWeek(-1)}
            >
              <IoChevronBack className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1"
              onClick={goToToday}
            >
              <IoCalendar className="w-4 h-4" />
              <span className="hidden sm:inline">Today</span>
            </button>
            <button
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1"
              onClick={() => navigateWeek(1)}
            >
              <span className="hidden sm:inline">Next</span>
              <IoChevronForward className="w-4 h-4" />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${exceedsLimit
              ? 'bg-red-50 border-red-300'
              : 'bg-indigo-50 border-indigo-200'
              }`}
          >
            <IoTime className={`w-4 h-4 ${exceedsLimit ? 'text-red-600' : 'text-indigo-600'}`} />
            <span className="text-xs text-gray-500">Week Total:</span>
            <span
              className={`text-lg font-bold ${exceedsLimit ? 'text-red-700' : 'text-indigo-700'}`}
            >
              {formatTime(weeklyTotalMinutes)}
            </span>
            {exceedsLimit && (
              <span className="text-xs text-red-600 font-semibold">(Exceeds 40h)</span>
            )}
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-cyan-400 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <IoCheckmarkCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 overflow-x-auto pb-2">
        {weekDays.map((day, index) => {
          const dateStr = formatDate(day)
          const dayEntries = getTimeEntriesForDate(dateStr)
          const dayTotal = getTotalTimeForDate(dateStr)
          const isToday = formatDate(new Date()) === dateStr
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
          const dayNumber = day.getDate()

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gray-50 border rounded-xl p-3 min-h-[400px] max-h-[600px] flex flex-col ${isToday ? 'border-cyan-400 shadow-md bg-cyan-50' : 'border-gray-200'
                }`}
            >
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200 flex-shrink-0">
                <div>
                  <p
                    className={`text-xs uppercase tracking-wide ${dayName.toLowerCase() === "sat" || dayName.toLocaleLowerCase() === "sun"
                        ? "text-red-500"
                        : "text-gray-500"
                      }`}
                  >
                    {dayName}
                  </p>
                  <p className={`text-2xl font-bold text-gray-900 mt-1 ${dayName.toLowerCase() === "sat" || dayName.toLowerCase() === "sun"
                        ? "text-red-500"
                        : "text-gray-500"
                      }`}>{dayNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total:</span>
                  <p
                    className={`text-sm font-semibold ${dayTotal > 480 ? 'text-red-700' : 'text-indigo-700'
                      }`}
                  >
                    {formatTime(dayTotal)}
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2 mb-3 min-h-0 overflow-y-auto pr-1 time-entries-container">
                {dayEntries.map((entry, entryIndex) => {
                  return (
                    <div key={entry.id || entryIndex} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{entry.taskName || 'Task'}</p>
                          <p className="text-xs text-gray-600">{entry.hours}h {entry.minutes}m</p>
                          {entry.project && <p className="text-xs text-gray-500">Project: {entry.project}</p>}
                          {entry.location && <p className="text-xs text-gray-500">Location: {entry.location}</p>}
                          {entry.remarks && (
                            <p className="text-xs text-gray-600 italic mt-1 flex items-start gap-1">
                              <IoDocumentText className="w-3 h-3 mt-0.5" />
                              {entry.remarks}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons at the end */}
                      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingEntry(entry)
                            setSelectedDateForModal(dateStr)
                            setShowAddTimeModal(true)
                          }}
                          className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded text-xs font-medium  transition-colors"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteTimeEntry(dateStr, entry.id, entryIndex)}
                          className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-medium   transition-colors flex items-center gap-1"
                        >
                          <IoTrash className="w-3.5 h-3.5" />

                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex-shrink-0 mt-auto">
                <TimeEntryForm dateStr={dateStr} onOpenModal={handleOpenAddTimeModal} />
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
  )
}