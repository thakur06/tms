import { motion } from 'framer-motion'
import { IoCheckmarkCircle, IoClose, IoWarning } from 'react-icons/io5'
import Modal from './Modal'
import { formatTime } from '../utils/formatters'

export default function SubmitTimesheetModal({ isOpen, onClose, weeklyTotal, weekRange, onSubmit }) {
  const totalHours = Math.floor(weeklyTotal / 60)
  const exceedsLimit = weeklyTotal > 2400 // 40 hours = 2400 minutes

  const handleSubmit = () => {
    onSubmit()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Timesheet">
      <div className="space-y-4 text-slate-300">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Week Range</p>
          <p className="font-mono text-white text-lg">{weekRange}</p>
        </div>

        <div className={`rounded-xl p-4 border ${exceedsLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className="flex items-center gap-3 mb-2">
            {exceedsLimit ? (
              <IoWarning className="w-6 h-6 text-red-400" />
            ) : (
              <IoCheckmarkCircle className="w-6 h-6 text-emerald-400" />
            )}
            <p className="font-bold text-white text-lg">Total Hours: {totalHours}h {weeklyTotal % 60}m</p>
          </div>
          {exceedsLimit ? (
            <p className="text-sm text-red-300">
              ⚠️ Warning: Your weekly hours exceed 40 hours. Please review your entries.
            </p>
          ) : (
            <p className="text-sm text-emerald-300">✓ Your timesheet is within the 40-hour limit.</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 ui-btn ui-btn-ghost border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 ui-btn font-bold ${
              exceedsLimit
                ? 'ui-btn-danger'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 box-shadow'
            }`}
          >
            <IoCheckmarkCircle className="w-5 h-5" />
            {exceedsLimit ? 'Submit Anyway' : 'Submit Timesheet'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

