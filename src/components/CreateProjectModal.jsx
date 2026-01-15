import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoAddCircle, IoClose, IoLocationOutline, 
  IoDocumentTextOutline, IoCodeSlash, IoRocketOutline 
} from 'react-icons/io5'
import { toast } from 'react-toastify'

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    status: 'planning'
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim() || !formData.location.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await onCreateProject(formData)
      // toast.success('Project initialized successfully')
      handleClose()
    } catch (error) {
      console.error('Error:', error)
      // toast.error('Failed to create project')
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="ui-card w-full max-w-md p-0 overflow-hidden shadow-2xl shadow-indigo-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <IoRocketOutline className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">New Project</h2>
                <p className="text-sm font-medium text-slate-400">Expand your production portfolio</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
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
            {/* Project Code */}
            <div className="space-y-2">
              <label className="ui-label flex items-center gap-2">
                <IoCodeSlash size={14} className="text-indigo-400" />
                Identifier
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="ui-input w-full font-mono tracking-widest text-indigo-300"
                placeholder="PRJ-01"
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
              disabled={isLoading || !formData.name || !formData.code || !formData.location}
              className="ui-btn ui-btn-primary w-full h-14 justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <IoAddCircle size={22} className="text-indigo-200" />
                  <span>Deploy Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}