import { motion } from 'framer-motion'
import { IoBarChart, IoDownload, IoPerson } from 'react-icons/io5'
import { getRangePercent } from '../utils/formatters'

export default function Timeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <IoBarChart className="w-5 h-5 text-indigo-500" />
              Gantt snapshot
            </h3>
          </div>
        </div>
        <div className="text-sm text-gray-500 font-medium bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
          No timeline items yet.
        </div>
      </div>
    )
  }

  const minDate = Math.min(...timeline.map((t) => new Date(t.start).getTime()))
  const maxDate = Math.max(...timeline.map((t) => new Date(t.end).getTime()))

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IoBarChart className="w-5 h-5 text-indigo-500" />
            Gantt snapshot
          </h3>
        </div>
        <button className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
          <IoDownload className="w-4 h-4" />
          Export
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {timeline.map((item, index) => {
          const start = new Date(item.start).getTime()
          const end = new Date(item.end).getTime()
          const { left, width } = getRangePercent(start, end, minDate, maxDate)
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="flex flex-col sm:flex-row justify-between gap-3 items-start p-3 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-all"
            >
              <div className="min-w-[120px]">
                <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <IoPerson className="w-4 h-4" />
                  {item.owner}
                </p>
              </div>
              <div className="flex-1 w-full sm:w-auto h-3 relative bg-gray-200 rounded-xl overflow-hidden">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%`, left: `${left}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="absolute top-0 h-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400"
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

