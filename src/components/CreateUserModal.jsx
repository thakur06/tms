import { useState, useEffect, useRef } from 'react'
import { IoAddCircle, IoClose, IoPeople } from 'react-icons/io5'
export default function CreateUserModal({ isOpen, onClose, onCreateUser ,depts}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.dept) newErrors.dept = 'Department is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setIsSubmitting(true)
    try {
      await onCreateUser(formData)
      handleClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', email: '', dept: '' })
    setErrors({})
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
      >
        {/* Header */}
  
        <div className="bg-linear-to-r from-slate-900 to-slate-800 px-6 py-5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <IoPeople className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">New User</h2>
                <p className="text-sm text-slate-300">Add a new User</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded text-sm ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Full name"
              disabled={isSubmitting}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Department</label>
            <select
              name="dept"
              value={formData.dept}
              onChange={handleChange}
              className={`max-w-fit w-full px-3 py-2 border rounded text-sm ${errors.dept ? 'border-red-300' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">Select department</option>
              {depts.map(dept => (
                <option  key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.dept && <p className="mt-1 text-xs text-red-600">{errors.dept}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}