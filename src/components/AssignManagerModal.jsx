import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoPersonOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function AssignManagerModal({ isOpen, onClose, user, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [loading, setLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
      if (user) {
        setSelectedManager(user.reporting_manager_id || '');
        setIsManager(user.is_manager || false);
      }
    }
  }, [isOpen, user]);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/users/managers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
      toast.error('Failed to load managers');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Update manager status if changed
      if (isManager !== user.is_manager) {
        await axios.put(
          `http://localhost:4000/api/users/${user.id}/manager-status`,
          { isManager },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update reporting manager
      await axios.put(
        `http://localhost:4000/api/users/${user.id}/manager`,
        { managerId: selectedManager || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Manager assignment updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to assign manager:', error);
      toast.error(error.response?.data?.error || 'Failed to assign manager');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="ui-modal-overlay z-[9998] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
              <div className="ui-modal-header shrink-0">
                <h2 className="ui-modal-title flex items-center gap-2">
                  <IoPersonOutline className="w-5 h-5" />
                  Assign Manager
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              <div className="ui-modal-body flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {user && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-slate-400 mb-1">User</p>
                    <p className="text-white font-semibold">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                )}

                <div>
                  <label className="ui-label flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={isManager}
                      onChange={(e) => setIsManager(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span>Mark as Manager</span>
                  </label>
                  <p className="text-xs text-slate-500 ml-6">
                    Managers can approve timesheets for their team members
                  </p>
                </div>

                <div>
                  <label className="ui-label mb-2">Reporting Manager</label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="ui-input"
                  >
                    <option value="">No Manager</option>
                    {managers
                      .filter(m => m.id !== user?.id)
                      .map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} ({manager.dept})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    Select the manager who will approve this user's timesheets
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <IoCheckmarkCircle className="w-5 h-5" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
