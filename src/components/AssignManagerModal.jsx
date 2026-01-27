import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoPersonOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function AssignManagerModal({ isOpen, onClose, user, onSuccess }) {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
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
      const response = await axios.get('${server}/api/users/managers', {
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
          `${server}/api/users/${user.id}/manager-status`,
          { isManager },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update reporting manager
      await axios.put(
        `${server}/api/users/${user.id}/manager`,
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
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900 hover:rotate-90 duration-300"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              <div className="ui-modal-body flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {user && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-black">User</p>
                    <p className="text-gray-900 font-black text-lg">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span>{user.email}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-3 mb-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isManager}
                      onChange={(e) => setIsManager(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 bg-white text-[#161efd] focus:ring-[#161efd] transition-all"
                    />
                    <span className="text-sm font-black text-gray-900 uppercase tracking-wider">Mark as Manager</span>
                  </label>
                  <p className="text-xs text-gray-400 ml-8 font-medium">
                    Managers can approve timesheets for their team members
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Reporting Manager</label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="ui-input font-bold"
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
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    Select the manager who will approve this user's timesheets
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-black text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#161efd] hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
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
