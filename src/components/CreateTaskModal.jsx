import { useState } from 'react'
import { IoAddCircle, IoClose, IoFlagOutline, IoPersonOutline, IoDocumentTextOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function CreateTaskModal({ isOpen, onClose, onCreateTask,depts }) {
  const [formData, setFormData] = useState({
    task_name: '',
    task_dept: '',
    priority: 'medium'
  })
  const [isLoading, setIsLoading] = useState(false)


  const priorities = [
    { value: 'low', label: 'Low', icon: '⬇️', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { value: 'medium', label: 'Medium', icon: '⏸️', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { value: 'high', label: 'High', icon: '⬆️', color: 'border-rose-200 bg-rose-50 text-rose-700' },
    { value: 'critical', label: 'Critical', icon: '🚨', color: 'border-red-200 bg-red-50 text-red-700' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.task_name.trim()) {
      toast.error('Please enter a task name')
      return
    }
    
    if (!formData.task_dept) {
      toast.error('Please select a department')
      return
    }

    setIsLoading(true)
    try {
      await onCreateTask(formData)
      setFormData({ task_name: '', task_dept: '', priority: 'medium' })
      onClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  const handleClose = () => {
    setFormData({ task_name: '', task_dept: '', priority: 'medium' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <IoAddCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">New Task</h2>
                <p className="text-sm text-slate-300">Add a task to your workflow</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <IoClose className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Task Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IoFlagOutline className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Task Name</label>
            </div>
            <input
              type="text"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-slate-50/50"
              placeholder="Enter task name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Department */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IoPersonOutline className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Department</label>
            </div>
            <div className="relative">
              <select
                value={formData.task_dept}
                onChange={(e) => setFormData({ ...formData, task_dept: e.target.value })}
                className={`max-w-fit w-full px-3 py-2 border rounded text-sm border-gray-300`}
                disabled={isLoading}
              >
                <option value="" className="text-slate-400">Select department</option>
                {depts.map((dept) => (
                  <option key={dept} value={dept} className="text-slate-700">
                    {dept}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* Priority */}
          {/* <div>
            <div className="flex items-center gap-2 mb-3">
              <IoDocumentTextOutline className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Priority Level</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  className={`px-3 py-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    formData.priority === priority.value
                      ? `${priority.color} border-current`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  disabled={isLoading}
                >
                  <span className="text-lg">{priority.icon}</span>
                  <span className="text-xs font-medium">{priority.label}</span>
                </button>
              ))}
            </div>
          </div> */}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading || !formData.task_name || !formData.task_dept}
              className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg font-medium hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Task...
                </>
              ) : (
                <>
                  <IoAddCircle className="w-5 h-5" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}