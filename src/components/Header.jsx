import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IoMenu, IoClose, IoHome, IoTime, IoAdd, IoPersonAdd } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ onCreateTask, onCreateProject, onCreateUser }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-slate-500">Work management platform</p>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <IoClose className="w-6 h-6" /> : <IoMenu className="w-6 h-6" />}
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Work Management Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600 mb-4 max-w-3xl">
          Unified platform for managing tasks, projects, time tracking, and approvals in one interface.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Task Management
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Project Tracking
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Time Tracking
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Dashboards
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Approvals
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            Calendar
          </span>
        </div>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden sm:flex gap-2.5 flex-shrink-0">
        <Link
          to="/dashboard"
          className={`px-3.5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 border ${
            location.pathname === '/dashboard' || location.pathname === '/'
              ? 'bg-slate-500 text-white border-slate-900 hover:bg-slate-300'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <IoHome className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/time-log"
          className={`px-3.5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 border ${
            location.pathname === '/time-log'
              ? 'bg-slate-500 text-white border-slate-900 hover:bg-slate-300'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <IoTime className="w-4 h-4" />
          Time Log
        </Link>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-3.5 py-2.5 bg-white border-slate-200 rounded-lg font-medium hover:bg-slate-300 transition-all flex items-center gap-2 border "
          >
            <IoAdd className="w-4 h-4" />
            <span className="hidden lg:inline">Task</span>
          </button>
        )}
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="px-3.5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
          >
            <IoAdd className="w-4 h-4" />
            <span className="hidden lg:inline">Project</span>
          </button>
        )}
        {onCreateUser && (
          <button
            onClick={onCreateUser}
            className="px-3.5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
          >
            <IoPersonAdd className="w-4 h-4" />
            <span className="hidden lg:inline">User</span>
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
            <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-lg">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <IoHome className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                to="/time-log"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
                  location.pathname === '/time-log'
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
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
                  className="px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-900"
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
                  className="px-4 py-3 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                >
                  <IoAdd className="w-5 h-5" />
                  Create Project
                </button>
              )}
              {onCreateUser && (
                <button
                  onClick={() => {
                    onCreateUser()
                    setMobileMenuOpen(false)
                  }}
                  className="px-4 py-3 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                >
                  <IoPersonAdd className="w-5 h-5" />
                  Create User
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}