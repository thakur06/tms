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
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-black">Week Range</p>
          <p className="font-mono text-gray-900 text-lg font-black">{weekRange}</p>
        </div>
 
        <div className={`rounded-xl p-5 border shadow-sm ${exceedsLimit ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center gap-3 mb-2">
            {exceedsLimit ? (
              <IoWarning className="w-6 h-6 text-red-500" />
            ) : (
              <IoCheckmarkCircle className="w-6 h-6 text-emerald-500" />
            )}
            <p className="font-black text-gray-900 text-xl tracking-tight">Total Hours: {totalHours}h {weeklyTotal % 60}m</p>
          </div>
          {exceedsLimit ? (
            <p className="text-sm text-red-600 font-bold">
              ⚠️ Warning: Your weekly hours exceed 40 hours. Please review your entries.
            </p>
          ) : (
            <p className="text-sm text-emerald-600 font-bold">✓ Your timesheet is within the 40-hour limit.</p>
          )}
        </div>
 
        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-white border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 py-3 px-6 font-black rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg ${
              exceedsLimit
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                : 'bg-[#161efd] hover:bg-blue-700 text-white shadow-blue-500/20 translate-y-0 active:translate-y-0.5'
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

