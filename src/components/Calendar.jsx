import { motion } from 'framer-motion'
import { IoCalendarOutline, IoSync, IoCheckmarkCircle } from 'react-icons/io5'

export default function Calendar({ calendarEvents }) {
  const daysInMonth = 31
  const startDate = new Date('2025-03-01')

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Calendar</p>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IoCalendarOutline className="w-5 h-5 text-indigo-500" />
            Week of Mar 3
          </h3>
        </div>
        <button className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
          <IoSync className="w-4 h-4" />
          Sync
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const date = new Date(startDate)
          date.setDate(idx + 1)
          const iso = date.toISOString().slice(0, 10)
          const event = calendarEvents.find((e) => e.date === iso)
          return (
            <motion.div
              key={iso}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              whileHover={{ scale: 1.05 }}
              className={`border rounded-xl p-2.5 min-h-[90px] cursor-pointer transition-all ${
                event ? 'border-cyan-300 bg-cyan-50 hover:bg-cyan-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{idx + 1}</p>
              {event && (
                <div className="flex items-start gap-1">
                  <IoCheckmarkCircle className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 font-medium">{event.title}</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

