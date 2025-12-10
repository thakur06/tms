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
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Week Range:</p>
          <p className="font-semibold text-gray-900">{weekRange}</p>
        </div>

        <div className={`rounded-lg p-4 border-2 ${exceedsLimit ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-center gap-2 mb-2">
            {exceedsLimit ? (
              <IoWarning className="w-5 h-5 text-red-600" />
            ) : (
              <IoCheckmarkCircle className="w-5 h-5 text-green-600" />
            )}
            <p className="font-semibold text-gray-900">Total Hours: {totalHours}h {weeklyTotal % 60}m</p>
          </div>
          {exceedsLimit ? (
            <p className="text-sm text-red-700">
              ⚠️ Warning: Your weekly hours exceed 40 hours. Please review your entries.
            </p>
          ) : (
            <p className="text-sm text-green-700">✓ Your timesheet is within the 40-hour limit.</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              exceedsLimit
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-br from-indigo-500 to-cyan-400 hover:shadow-lg text-white'
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

