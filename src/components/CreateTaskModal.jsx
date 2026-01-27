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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {/* 1. Added 'layout' to the container so it animates its size */}
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="ui-card w-full max-w-md p-0 overflow-hidden shadow-2xl border-gray-100"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-start justify-between">
            <motion.div layout="position">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                Initialize New Task
              </h2>
              <p className="text-[10px] text-gray-400 mt-1 font-black uppercase tracking-widest italic">Define new workspace objectives</p>
            </motion.div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Input: Task Name */}
          <motion.div layout className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 group-focus-within:text-[#161efd] transition-colors">
              <IoFlagOutline className="text-indigo-400" />
              Identification
            </label>
            <input
              type="text"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              className="ui-input w-full text-xs py-2.5"
              placeholder="e.g. System Architecture Audit"
              disabled={isLoading}
            />
          </motion.div>

          {/* Custom Select: Department */}
          <motion.div layout className="space-y-2">
            <label className="ui-label flex items-center gap-2">
              <IoLayersOutline className="text-indigo-400" />
              Ownership
            </label>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-sm font-black transition-all duration-300 ${
                  isDeptOpen 
                    ? 'border-[#161efd] shadow-[0_0_15px_rgba(22,30,253,0.1)] text-gray-900' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <span className={formData.task_dept ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.task_dept || 'Select department...'}
                </span>
                <IoChevronDown className={`text-[#161efd] transition-transform duration-500 ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl z-10 relative"
                  >
                    {/* Inline Search */}
                    <div className="p-3 border-b border-white/5">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          autoFocus
                          className="w-full pl-9 pr-4 py-2 bg-black/20 rounded-lg text-xs font-medium text-white outline-none border border-transparent focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
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
                          className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-between group"
                        >
                          {dept}
                          {formData.task_dept === dept && (
                            <IoCheckmarkCircle className="text-indigo-400" size={16} />
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
              className="ui-btn ui-btn-primary w-full h-11 justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest font-black"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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