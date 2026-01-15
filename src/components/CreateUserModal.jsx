import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoPersonAddOutline, IoBusinessOutline, IoMailOutline, IoSaveOutline, IoCloseCircle } from 'react-icons/io5';
import Modal from './Modal';
import { toast, Zoom } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const { user: currentUser } = useAuth(); // Potentially check if admin
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: 'Engineering'
  });
  const [loading, setLoading] = useState(false);

  // Department options - could be fetched from API
  const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'HR', 'Finance'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming generic bearer auth
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success(
        <div>
          <strong>User Created!</strong>
          <p className="text-xs mt-1">Credentials sent to {formData.email}</p>
          {data.emailSent === false && <p className="text-xs text-orange-400 mt-1">Warning: Email failed to send.</p>}
        </div>, 
        { transition: Zoom }
      );
      
      if (onUserCreated) onUserCreated(data);
      onClose();
      setFormData({ name: '', email: '', dept: 'Engineering' }); // Reset
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      shellClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="ui-label">Full Name</label>
          <div className="relative">
            <IoPersonAddOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="ui-input pl-10"
              placeholder="e.g. Alice Johnson"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="ui-label">Email Address</label>
          <div className="relative">
            <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="ui-input pl-10"
              placeholder="alice@company.com"
            />
          </div>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <label className="ui-label">Department</label>
          <div className="relative">
            <IoBusinessOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <select
              value={formData.dept}
              onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
              className="ui-input pl-10 appearance-none bg-no-repeat bg-right"
            >
              {departments.map(dept => (
                <option key={dept} value={dept} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn ui-btn-ghost hover:bg-slate-100 dark:hover:bg-white/5"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ui-btn ui-btn-primary"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <>
                <IoSaveOutline size={18} />
                Create User
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}