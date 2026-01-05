import { useState } from 'react'
import { IoAddCircle, IoClose, IoLocationOutline, IoDocumentTextOutline, IoCodeSlash } from 'react-icons/io5'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    status: 'planning'
  })
  const [isLoading, setIsLoading] = useState(false)

  const statuses = [
    { value: 'planning', label: 'Planning', color: 'text-blue-600 bg-blue-50' },
    { value: 'active', label: 'Active', color: 'text-emerald-600 bg-emerald-50' },
    { value: 'on_hold', label: 'On Hold', color: 'text-amber-600 bg-amber-50' },
    { value: 'completed', label: 'Completed', color: 'text-slate-600 bg-slate-50' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }
    
    if (!formData.code.trim()) {
      toast.error('Project code is required')
      return
    }
    
    if (!formData.location.trim()) {
      toast.error('Location is required')
      return
    }

    setIsLoading(true)
    try {
      await onCreateProject(formData)
      setFormData({ name: '', code: '', location: '', status: 'planning' })
      onClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', code: '', location: '', status: 'planning' })
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
                <h2 className="text-xl font-semibold text-white">New Project</h2>
                <p className="text-sm text-slate-300">Add project to your portfolio</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {/* Project Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IoDocumentTextOutline className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Project Name</label>
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-slate-50/50"
              placeholder="Enter project name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Project Code */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IoCodeSlash className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Project Code</label>
            </div>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-slate-50/50 font-mono"
              placeholder="PRJ-001"
              disabled={isLoading}
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IoLocationOutline className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Location</label>
            </div>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-slate-50/50"
              placeholder="City, Country"
              disabled={isLoading}
            />
          </div>
          {/* Actions */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.code || !formData.location}
              className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg font-medium hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Project...
                </>
              ) : (
                <>
                  <IoAddCircle className="w-5 h-5" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}