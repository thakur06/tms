import { IoAddCircle } from 'react-icons/io5'

export default function TimeEntryForm({ dateStr, onOpenModal }) {
  return (
    <button
      className="w-full py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-600 text-sm font-semibold hover:bg-gray-100 hover:border-cyan-400 hover:text-cyan-600 transition-all mt-auto flex items-center justify-center gap-2"
      onClick={() => onOpenModal(dateStr)}
    >
      <IoAddCircle className="w-4 h-4" />
      Add Time
    </button>
  )
}

