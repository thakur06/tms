import { useState, useEffect, useRef } from 'react'
import { IoClose, IoPeople, IoMailOutline, IoPersonOutline, IoBusinessOutline, IoChevronDown, IoCheckmarkCircle } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'

export default function CreateUserModal({ isOpen, onClose, onCreateUser, depts = [] }) {
  const [formData, setFormData] = useState({ name: '', email: '', dept: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeptOpen, setIsDeptOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDeptOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.dept) newErrors.dept = 'Select a department'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors)

    setIsSubmitting(true)
    try {
      await onCreateUser(formData)
      handleClose()
      
    } catch (error) {
      // toast.error('Failed to add user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', email: '', dept: '' })
    setErrors({})
    setIsDeptOpen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        layout // Important: This makes the modal expand smoothly
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <motion.div layout="position" className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <IoPeople size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Add Team Member</h2>
                <p className="text-sm text-slate-400 font-medium tracking-tight">Configure user access levels</p>
              </div>
            </motion.div>
            <button onClick={handleClose} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all">
              <IoClose size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Name Input */}
          <motion.div layout className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               <IoPersonOutline className="text-indigo-500" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold transition-all outline-none ${
                errors.name ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
              }`}
            />
          </motion.div>

          {/* Email Input */}
          <motion.div layout className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               <IoMailOutline className="text-indigo-500" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold transition-all outline-none ${
                errors.email ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
              }`}
            />
          </motion.div>

          {/* Department Select (Expanding) */}
          <motion.div layout className="space-y-1.5" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               <IoBusinessOutline className="text-indigo-500" /> Department
            </label>
            <div className="relative">
              <div 
                onClick={() => !isSubmitting && setIsDeptOpen(!isDeptOpen)}
                className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold cursor-pointer flex items-center justify-between transition-all ${
                  isDeptOpen ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10' : 'border-slate-200'
                }`}
              >
                <span className={formData.dept ? "text-slate-900" : "text-slate-300"}>
                  {formData.dept || "Choose Department..."}
                </span>
                <IoChevronDown className={`text-indigo-500 transition-transform duration-300 ${isDeptOpen ? 'rotate-180' : ''}`} />
              </div>
              
              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 bg-slate-50/50 border border-slate-200 rounded-2xl"
                  >
                    <div className="max-h-[160px] overflow-y-auto no-scrollbar py-1">
                      {depts.map(dept => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => { setFormData({...formData, dept}); setIsDeptOpen(false); }}
                          className="w-full px-5 py-3 text-left text-xs font-black text-slate-600 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-between"
                        >
                          {dept}
                          {formData.dept === dept && <IoCheckmarkCircle className="text-indigo-500" size={16} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div layout className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-4 py-4 text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Add Member'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}