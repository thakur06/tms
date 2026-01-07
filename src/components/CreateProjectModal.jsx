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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <IoRocketOutline className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Project</h2>
                <p className="text-sm font-medium text-slate-400">Expand your production portfolio</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90"
            >
              <IoClose size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          
          {/* Project Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              <IoDocumentTextOutline size={14} className="text-indigo-500" />
              Project Title
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. Global Expansion Phase I"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Project Code */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                <IoCodeSlash size={14} className="text-indigo-500" />
                Identifier
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-mono tracking-widest text-indigo-600"
                placeholder="PRJ-01"
                disabled={isLoading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                <IoLocationOutline size={14} className="text-indigo-500" />
                Region
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                placeholder="London, UK"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.code || !formData.location}
              className="group relative w-full h-[60px] bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <IoAddCircle size={22} className="text-indigo-400 group-hover:text-white transition-colors" />
                    <span>Deploy Project</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}