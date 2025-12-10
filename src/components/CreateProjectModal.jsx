import { useState } from 'react'
import { IoAddCircle, IoPerson, IoCalendar } from 'react-icons/io5'
import Modal from './Modal'

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    due: '',
    automation: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && formData.owner) {
      onCreateProject({
        ...formData,
        automation: formData.automation.split(',').map((a) => a.trim()).filter(Boolean),
        progress: 0,
        health: 'on-track',
      })
      setFormData({ name: '', owner: '', due: '', automation: '' })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="Enter project name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <IoPerson className="w-4 h-4" />
              Owner
            </label>
            <input
              type="text"
              required
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <IoCalendar className="w-4 h-4" />
              Due Date
            </label>
            <input
              type="date"
              value={formData.due}
              onChange={(e) => setFormData({ ...formData, due: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Automation Rules (comma separated)</label>
          <input
            type="text"
            value={formData.automation}
            onChange={(e) => setFormData({ ...formData, automation: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="Daily digest, Overdue pings"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-cyan-400 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <IoAddCircle className="w-5 h-5" />
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  )
}

