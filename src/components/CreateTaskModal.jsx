import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion' // Added LayoutGroup
import { 
  IoAddCircle, IoClose, IoFlagOutline, 
  IoLayersOutline, IoChevronDown, IoSearchOutline,
  IoCheckmarkCircle
} from 'react-icons/io5'
import { toast } from 'react-toastify'

export default function CreateTaskModal({ isOpen, onClose, onCreateTask, depts = [] }) {
  const [formData, setFormData] = useState({
    task_name: '',
    task_dept: '',
    priority: 'medium'
  })
  const [isDeptOpen, setIsDeptOpen] = useState(false)
  const [deptSearch, setDeptSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const filteredDepts = depts.filter(d => 
    d.toLowerCase().includes(deptSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.task_name.trim()) return toast.error('Task name is required')
    if (!formData.task_dept) return toast.error('Select a department')

    setIsLoading(true)
    try {
      await onCreateTask(formData)
      handleClose()
    } catch (error) {
      // toast.error('Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ task_name: '', task_dept: '', priority: 'medium' })
    setDeptSearch('')
    setIsDeptOpen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* 1. Added 'layout' to the container so it animates its size */}
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="ui-card w-full max-w-md p-0 overflow-hidden shadow-2xl border-white/10 bg-zinc-900"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-white/5 bg-white/5">
          <div className="flex items-start justify-between">
            <motion.div layout="position">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">
                Initialize New Task
              </h2>
              <p className="text-[10px] text-gray-400 mt-1 font-black uppercase tracking-widest italic">Define new workspace objectives</p>
            </motion.div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Input: Task Name */}
          <motion.div layout className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 group-focus-within:text-amber-500 transition-colors flex items-center gap-2">
              <IoFlagOutline className="text-amber-500" />
              Identification
            </label>
            <input
              type="text"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              className="ui-input w-full text-xs py-2.5 bg-zinc-950 border-white/10 text-white focus:border-amber-500 focus:ring-amber-500/20"
              placeholder="e.g. System Architecture Audit"
              disabled={isLoading}
            />
          </motion.div>

          {/* Custom Select: Department */}
          <motion.div layout className="space-y-2">
            <label className="ui-label flex items-center gap-2 text-gray-400">
              <IoLayersOutline className="text-amber-500" />
              Ownership
            </label>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-zinc-950 border rounded-xl text-sm font-black transition-all duration-300 ${
                  isDeptOpen 
                    ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)] text-white' 
                    : 'border-white/10 text-white'
                }`}
              >
                <span className={formData.task_dept ? 'text-white' : 'text-gray-500'}>
                  {formData.task_dept || 'Select department...'}
                </span>
                <IoChevronDown className={`text-amber-500 transition-transform duration-500 ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-10 relative"
                  >
                    {/* Inline Search */}
                    <div className="p-3 border-b border-white/5">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                          autoFocus
                          className="w-full pl-9 pr-4 py-2 bg-black/20 rounded-lg text-xs font-medium text-white outline-none border border-transparent focus:border-amber-500/50 transition-all placeholder:text-gray-600"
                          placeholder="Search..."
                          value={deptSearch}
                          onChange={(e) => setDeptSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Scrollable Area */}
                    <div className="max-h-[160px] overflow-y-auto custom-scrollbar py-1">
                      {filteredDepts.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, task_dept: dept})
                            setIsDeptOpen(false)
                            setDeptSearch('')
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-all flex items-center justify-between group"
                        >
                          {dept}
                          {formData.task_dept === dept && (
                            <IoCheckmarkCircle className="text-amber-500" size={16} />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div layout className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !formData.task_name || !formData.task_dept}
              className="ui-btn w-full h-11 justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <>
                  <IoAddCircle size={18} />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}