import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoAddCircle, IoClose, IoLocationOutline, 
  IoDocumentTextOutline, IoCodeSlash, IoRocketOutline 
} from 'react-icons/io5'
import { toast } from 'react-toastify'

export default function CreateProjectModal({ isOpen, onClose, onCreateProject, projectToEdit, onUpdateProject }) {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    location: '',
    status: 'planning'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load data when modal opens or projectToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name || '',
          client: projectToEdit.client || '',
          location: projectToEdit.location || '',
          status: projectToEdit.status || 'planning'
        })
      } else {
        setFormData({ name: '', client: '', location: '', status: 'planning' })
      }
    }
  }, [isOpen, projectToEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validations
    if (!formData.name.trim() || !formData.location.trim() || !formData.client.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (projectToEdit) {
        await onUpdateProject(projectToEdit.id, formData)
      } else {
        await onCreateProject(formData)
      }
      handleClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', client: '', location: '', status: 'planning' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="ui-card w-full max-w-md p-0 overflow-hidden shadow-2xl border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                <IoRocketOutline className="w-6 h-6 text-[#161efd]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {projectToEdit ? 'Edit Project' : 'New Project'}
                </h2>
                <p className="text-sm font-bold text-gray-400">
                  {projectToEdit ? 'Update project details' : 'Expand your production portfolio'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Project Name */}
          <div className="space-y-2">
            <label className="ui-label flex items-center gap-2">
              <IoDocumentTextOutline size={14} className="text-indigo-400" />
              Project Title
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="ui-input w-full"
              placeholder="e.g. Global Expansion Phase I"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Client */}
            <div className="space-y-2">
              <label className="ui-label flex items-center gap-2">
                <IoDocumentTextOutline size={14} className="text-indigo-400" />
                Client
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="ui-input w-full"
                placeholder="Client Name"
                disabled={isLoading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="ui-label flex items-center gap-2">
                <IoLocationOutline size={14} className="text-indigo-400" />
                Region
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="ui-input w-full"
                placeholder="London, UK"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.client || !formData.location}
              className="ui-btn ui-btn-primary w-full h-14 justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <IoAddCircle size={22} className="text-indigo-200" />
                  <span>{projectToEdit ? 'Update Project' : 'Deploy Project'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}