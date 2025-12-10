import { useState, useEffect } from 'react'
import { IoClose, IoTime, IoFolder, IoLocation, IoDocumentText, IoTrash } from 'react-icons/io5'
import Modal from './Modal'

export default function AddTimeModal({
  isOpen,
  onClose,
  dateStr,
  tasks,
  projects,
  selectedUser,
  onAdd,
  onDelete,        // New: callback to delete entry
  onUpdate,        // New: callback to update existing entry (optional, if separate from onAdd)
  entry = null,    // Existing time entry (for edit/delete mode)
}) {
  const isEditMode = !!entry

  const [selectedTask, setSelectedTask] = useState(entry?.taskId || '')
  const [selectedProject, setSelectedProject] = useState(entry?.project || '')
  const [location, setLocation] = useState(entry?.location || '')
  const [remarks, setRemarks] = useState(entry?.remarks || '')
  const [hours, setHours] = useState(entry ? Math.floor(entry.minutes / 60) : '')
  const [minutes, setMinutes] = useState(entry ? entry.minutes % 60 : '')
  const [searchProject, setSearchProject] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)

  // Reset form when entry changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTask(entry?.taskId || '')
      setSelectedProject(entry?.project || '')
      setLocation(entry?.location || '')
      setRemarks(entry?.remarks || '')
      setHours(entry ? Math.floor(entry.minutes / 60) : '')
      setMinutes(entry ? entry.minutes % 60 : '')
      setSearchProject('')
    }
  }, [isOpen, entry])

  const filteredProjects = projects
    ? searchProject
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchProject.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchProject.toLowerCase())
        )
      : projects
    : []

  const handleSubmit = (e) => {
    e.preventDefault()
    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0)

    if (selectedTask && totalMinutes > 0) {
      const payload = {
        taskId: selectedTask,
        minutes: totalMinutes,
        project: selectedProject,
        location,
        remarks,
        user: selectedUser,
        date: dateStr,
      }

      if (isEditMode) {
        onUpdate?.({ ...payload, id: entry.id }) // or use onAdd with id for upsert
      } else {
        onAdd(dateStr, selectedTask, hours, minutes, payload)
      }

      handleClose()
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      onDelete(entry.id)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedTask('')
    setSelectedProject('')
    setLocation('')
    setRemarks('')
    setHours('')
    setMinutes('')
    setSearchProject('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isEditMode
          ? `Edit Time - ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
          : `Add Time - ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logged by */}
        {selectedUser && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600 mb-1">Logged by:</p>
            <p className="font-semibold text-indigo-700">{selectedUser}</p>
          </div>
        )}

        {/* Project Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <IoFolder className="w-4 h-4" />
            Project Name {isEditMode && <span className="text-xs text-gray-500">(optional edit)</span>}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={selectedProject ? selectedProject : "Search project..."}
            value={selectedProject ? selectedProject : searchProject}
            onChange={(e) => {
              const value = e.target.value
              setSearchProject(value)
              if (selectedProject && value !== selectedProject) {
                setSelectedProject('')
                setLocation('')
              }
            }}
            onFocus={() => setShowProjectDropdown(true)}
            onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
          />
          {!selectedProject && showProjectDropdown && filteredProjects.length > 0 && (
            <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onMouseDown={() => { // use onMouseDown to prevent blur
                    setSelectedProject(project.name)
                    setLocation(project.location || '')
                    setSearchProject('')
                    setShowProjectDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                >
                  {project.name} {project.location && `– ${project.location}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        {selectedProject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <IoLocation className="w-4 h-4" />
              Project Location
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        {/* Task */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            required
          >
            <option value="">Select task...</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.project})
              </option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <IoTime className="w-4 h-4" />
            Time Spent
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="24"
              placeholder="Hours"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <span className="text-gray-500 text-xl">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Mins"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <IoDocumentText className="w-4 h-4" />
            Remarks (optional)
          </label>
          <textarea
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
            rows="3"
            placeholder="Any additional notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <IoTrash className="w-5 h-5" />
              Delete
            </button>
          )}

          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-xl transition"
          >
            {isEditMode ? 'Update Time' : 'Add Time'}
          </button>
        </div>
      </form>
    </Modal>
  )
}