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
      <div className="space-y-4">
        <div className="bg-zinc-800 rounded-xl p-5 border border-white/5 shadow-sm">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Week Range</p>
          <p className="font-mono text-white text-lg font-black">{weekRange}</p>
        </div>
 
        <div className={`rounded-xl p-5 border shadow-sm ${exceedsLimit ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <div className="flex items-center gap-3 mb-2">
            {exceedsLimit ? (
              <IoWarning className="w-6 h-6 text-red-500" />
            ) : (
              <IoCheckmarkCircle className="w-6 h-6 text-emerald-500" />
            )}
            <p className="font-black text-white text-xl tracking-tight">Total Hours: {totalHours}h {weeklyTotal % 60}m</p>
          </div>
          {exceedsLimit ? (
            <p className="text-sm text-red-500 font-bold">
              ⚠️ Warning: Your weekly hours exceed 40 hours. Please review your entries.
            </p>
          ) : (
            <p className="text-sm text-emerald-500 font-bold">✓ Your timesheet is within the 40-hour limit.</p>
          )}
        </div>
 
        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-white/5 border border-white/10 text-gray-400 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 py-3 px-6 font-black rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg ${
              exceedsLimit
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 translate-y-0 active:translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <IoCheckmarkCircle className="w-5 h-5" />
              {exceedsLimit ? 'Submit Anyway' : 'Submit Now'}
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}

