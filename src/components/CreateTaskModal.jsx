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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      {/* 1. Added 'layout' to the container so it animates its size */}
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <div className="flex items-start justify-between">
            <motion.div layout="position">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Task</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Define new workspace objectives</p>
            </motion.div>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all duration-300"
            >
              <IoClose size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Input: Task Name */}
          <motion.div layout className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
              <IoFlagOutline size={14} className="text-indigo-600" />
              Identification
            </label>
            <input
              type="text"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. System Architecture Audit"
              disabled={isLoading}
            />
          </motion.div>

          {/* Custom Select: Department */}
          <motion.div layout className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
              <IoLayersOutline size={14} className="text-indigo-600" />
              Ownership
            </label>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isDeptOpen 
                    ? 'ring-4 ring-indigo-500/10 border-indigo-500 bg-white' 
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <span className={formData.task_dept ? 'text-slate-900' : 'text-slate-300'}>
                  {formData.task_dept || 'Select department...'}
                </span>
                <IoChevronDown className={`text-indigo-500 transition-transform duration-500 ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 bg-slate-50/50 border border-slate-200 rounded-2xl"
                  >
                    {/* Inline Search */}
                    <div className="p-3 border-b border-slate-200">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          autoFocus
                          className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-xs font-bold outline-none border border-slate-200 focus:border-indigo-400 transition-all"
                          placeholder="Search..."
                          value={deptSearch}
                          onChange={(e) => setDeptSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Scrollable Area */}
                    <div className="max-h-[160px] overflow-y-auto no-scrollbar hide-y-scroll py-1">
                      {filteredDepts.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, task_dept: dept})
                            setIsDeptOpen(false)
                            setDeptSearch('')
                          }}
                          className="w-full px-5 py-3 text-left text-xs font-black text-slate-600 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-between group"
                        >
                          {dept}
                          {formData.task_dept === dept && (
                            <IoCheckmarkCircle className="text-indigo-500" size={16} />
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
              className="group relative w-full h-[64px] bg-slate-900 hover:bg-indigo-600 text-white rounded-[22px] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-100 transition-all duration-500 active:scale-[0.97] disabled:opacity-30 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <IoAddCircle size={22} className="group-hover:rotate-180 transition-transform duration-700 text-indigo-400 group-hover:text-white" />
                    <span>Initialize Task</span>
                  </>
                )}
              </div>
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}