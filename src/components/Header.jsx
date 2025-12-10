import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IoMenu, IoClose, IoHome, IoTime, IoAdd } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ onCreateTask, onCreateProject }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-7">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">Wrike-style time management</p>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <IoClose className="w-6 h-6" /> : <IoMenu className="w-6 h-6" />}
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Work OS – tasks, projects, time & approvals</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-3">
          Projects, tasks, timers, calendar, and approvals in one compact view.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Tasks
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Projects
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Time tracking
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Dashboards
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Gantt
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Automation
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Approvals
          </span>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full text-xs">
            Calendar
          </span>
        </div>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden sm:flex gap-2.5 flex-shrink-0">
        <Link
          to="/dashboard"
          className={`px-3.5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            location.pathname === '/dashboard' || location.pathname === '/'
              ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <IoHome className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/time-log"
          className={`px-3.5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            location.pathname === '/time-log'
              ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <IoTime className="w-4 h-4" />
          Time Log
        </Link>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-3.5 py-2.5 bg-gradient-to-br from-indigo-500 to-cyan-400 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <IoAdd className="w-4 h-4" />
            <span className="hidden lg:inline">Task</span>
          </button>
        )}
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="px-3.5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <IoAdd className="w-4 h-4" />
            <span className="hidden lg:inline">Project</span>
          </button>
        )}
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden w-full overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IoHome className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                to="/time-log"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  location.pathname === '/time-log'
                    ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IoTime className="w-5 h-5" />
                Time Log
              </Link>
              {onCreateTask && (
                <button
                  onClick={() => {
                    onCreateTask()
                    setMobileMenuOpen(false)
                  }}
                  className="px-4 py-3 bg-gradient-to-br from-indigo-500 to-cyan-400 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <IoAdd className="w-5 h-5" />
                  Create Task
                </button>
              )}
              {onCreateProject && (
                <button
                  onClick={() => {
                    onCreateProject()
                    setMobileMenuOpen(false)
                  }}
                  className="px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <IoAdd className="w-5 h-5" />
                  Create Project
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
