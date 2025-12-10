import { motion } from 'framer-motion'
import { formatter } from '../utils/formatters'
import { IoPlay, IoStop, IoFilter, IoTimeOutline, IoPerson, IoCalendarOutline } from 'react-icons/io5'

export default function TasksList({ tasks, timers, getElapsed, toggleTimer }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Tasks</p>
          <h3 className="text-lg font-semibold text-gray-900">Work + per-task timers</h3>
        </div>
        <button className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
          <IoFilter className="w-4 h-4" />
          Filters
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task, index) => {
          const elapsed = getElapsed(task.id)
          const remaining = Math.max(task.estimate * 3600 - elapsed, 0)
          const remainingHours = formatter(remaining)
          const statusClass =
            task.status === 'In Progress'
              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
              : task.status === 'Blocked'
              ? 'bg-red-100 text-red-700 border-red-200'
              : task.status === 'Review'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          const isRunning = timers[task.id]?.running
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="flex flex-col sm:flex-row justify-between gap-3 items-start p-3 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <p className="font-semibold text-gray-900">{task.title}</p>
                  <span className={`px-2 py-1 rounded-lg text-xs border ${statusClass}`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <IoPerson className="w-4 h-4" />
                    {task.assignee}
                  </span>
                  <span className="flex items-center gap-1">
                    <IoCalendarOutline className="w-4 h-4" />
                    Due {task.due}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{task.project}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {task.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                  {task.approvals.length > 0 && (
                    <span className="bg-amber-100 border border-amber-300 text-amber-700 px-2 py-1 rounded-full text-xs">
                      Approvals: {task.approvals.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto sm:min-w-[160px]">
                <div className="text-center sm:text-right">
                  <div className="flex items-center gap-2 sm:block">
                    <IoTimeOutline className="w-5 h-5 sm:hidden text-indigo-500" />
                    <div>
                      <p className="text-xl font-bold text-gray-900">{formatter(elapsed)}</p>
                      <p className="text-xs text-gray-500">Remaining {remainingHours}</p>
                    </div>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    isRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-cyan-400 hover:shadow-lg text-white'
                  }`}
                  onClick={() => toggleTimer(task.id)}
                >
                  {isRunning ? <IoStop className="w-4 h-4" /> : <IoPlay className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isRunning ? 'Stop' : 'Start'}</span>
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

