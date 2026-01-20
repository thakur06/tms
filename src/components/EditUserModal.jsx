import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoClose, IoPersonOutline, IoCheckmarkCircle, IoBusinessOutline,
  IoMailOutline, IoChevronDown, IoSearchOutline, IoSaveOutline,IoShieldCheckmarkOutline
} from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function EditUserModal({ isOpen, onClose, user, onSuccess }) {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [mounted, setMounted] = useState(false);
  const [managers, setManagers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: '',
    role: '',
    is_manager: false,
    reporting_manager_id: ''
  });
  const [loading, setLoading] = useState(false);

  // Dropdown states
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDepts();
      fetchManagers();
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          dept: user.dept || '',
          role: user.role || 'employee',
          is_manager: user.is_manager || false,
          reporting_manager_id: user.reporting_manager_id || ''
        });
      }
    }
  }, [isOpen, user]);

  const fetchDepts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/dept`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepts(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch users for selection - request a large limit to get 'all' potential managers
      const response = await axios.get(`${server}/api/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users for manager selection:', error);
    }
  };

  const filteredDepts = depts.filter(d => 
    d.dept_name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const filteredManagers = managers.filter(m => 
    m.name.toLowerCase().includes(managerSearch.toLowerCase()) || 
    m.email.toLowerCase().includes(managerSearch.toLowerCase())
  );

  const selectedManager = managers.find(m => m.id === parseInt(formData.reporting_manager_id));

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update basic details
      await axios.put(
        `${server}/api/users/${user.id}`,
        {
          name: formData.name,
          email: formData.email,
          dept: formData.dept,
          role: formData.role
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update manager status
      await axios.put(
        `${server}/api/users/${user.id}/manager-status`,
        { isManager: formData.is_manager },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update reporting manager
      await axios.put(
        `${server}/api/users/${user.id}/manager`,
        { managerId: formData.reporting_manager_id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('User updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
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
            <div className="ui-modal max-h-[90vh] flex flex-col shadow-2xl shadow-black/50">
              <div className="ui-modal-header shrink-0">
                <h2 className="ui-modal-title flex items-center gap-2">
                  <IoPersonOutline className="w-5 h-5" />
                  Edit User
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              <div className="ui-modal-body flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <div>
                  <label className="ui-label mb-1.5 flex items-center gap-2">
                    <IoPersonOutline className="text-indigo-400" size={14} /> 
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="ui-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="ui-label mb-1.5 flex items-center gap-2">
                    <IoMailOutline className="text-indigo-400" size={14} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="ui-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Searchable Dept */}
                  <div className="space-y-2">
                    <label className="ui-label flex items-center gap-2">
                      <IoBusinessOutline className="text-indigo-400" size={14} />
                      Dept
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsDeptOpen(!isDeptOpen); setIsManagerOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 border rounded-xl text-xs font-medium transition-all ${
                          isDeptOpen ? 'border-indigo-500 bg-white/10 text-white' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        <span className={formData.dept ? 'text-white' : 'text-slate-500'}>
                          {formData.dept || 'Select Dept...'}
                        </span>
                        <IoChevronDown className={`text-indigo-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} size={14} />
                      </button>

                      <AnimatePresence>
                        {isDeptOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden z-10"
                          >
                            <div className="p-2 border-b border-white/5">
                              <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                <input
                                  className="w-full pl-8 pr-3 py-1 bg-black/20 rounded-lg text-[10px] outline-none border border-transparent focus:border-indigo-500/50 text-white"
                                  placeholder="Search dept..."
                                  value={deptSearch}
                                  onChange={(e) => setDeptSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                              {filteredDepts.map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, dept: d.dept_name });
                                    setIsDeptOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[10px] text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-between"
                                >
                                  {d.dept_name}
                                  {formData.dept === d.dept_name && <IoCheckmarkCircle className="text-indigo-400" size={12} />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Searchable Manager */}
                  <div className="space-y-2">
                    <label className="ui-label flex items-center gap-2">
                      <IoPersonOutline className="text-indigo-400" size={14} />
                      Manager
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsManagerOpen(!isManagerOpen); setIsDeptOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 border rounded-xl text-xs font-medium transition-all ${
                          isManagerOpen ? 'border-indigo-500 bg-white/10 text-white' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        <span className={formData.reporting_manager_id ? 'text-white' : 'text-slate-500 truncate'}>
                          {selectedManager?.name || 'Select Manager...'}
                        </span>
                        <IoChevronDown className={`text-indigo-400 transition-transform ${isManagerOpen ? 'rotate-180' : ''}`} size={14} />
                      </button>

                      <AnimatePresence>
                        {isManagerOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden z-10"
                          >
                            <div className="p-2 border-b border-white/5">
                              <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                <input
                                  className="w-full pl-8 pr-3 py-1 bg-black/20 rounded-lg text-[10px] outline-none border border-transparent focus:border-indigo-500/50 text-white"
                                  placeholder="Search manager..."
                                  value={managerSearch}
                                  onChange={(e) => setManagerSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, reporting_manager_id: '' });
                                  setIsManagerOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[10px] text-slate-400 italic hover:bg-white/5 hover:text-white transition-all"
                              >
                                No Manager
                              </button>
                              {filteredManagers
                                .filter(m => m.id !== user?.id)
                                .map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, reporting_manager_id: m.id });
                                    setIsManagerOpen(false);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-white/5 transition-all outline-none"
                                >
                                  <div className="flex items-center justify-between px-0.5">
                                    <span className="text-[10px] text-white font-medium truncate">{m.name}</span>
                                    {parseInt(formData.reporting_manager_id) === m.id && <IoCheckmarkCircle className="text-indigo-400" size={12} />}
                                  </div>
                                  <p className="text-[8px] text-slate-500 truncate px-0.5">{m.dept} • {m.email}</p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="ui-label flex items-center gap-2">
                      <IoShieldCheckmarkOutline className="text-indigo-400" size={14} />
                      User Role
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsRoleOpen(!isRoleOpen); setIsDeptOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 border rounded-xl text-xs font-medium transition-all ${
                          isRoleOpen ? 'border-indigo-500 bg-white/10 text-white' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        <span className="text-white capitalize">
                          {formData.role}
                        </span>
                        <IoChevronDown className={`text-indigo-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} size={14} />
                      </button>

                      <AnimatePresence>
                        {isRoleOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative mt-2 bg-[#0b1221] border border-white/10 rounded-xl overflow-hidden z-[9999]"
                          >
                            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                              {['admin', 'employee'].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, role: r });
                                    setIsRoleOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[10px] text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-between capitalize"
                                >
                                  {r}
                                  {formData.role === r && <IoCheckmarkCircle className="text-indigo-400" size={12} />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="ui-label flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_manager}
                      onChange={(e) => setFormData({ ...formData, is_manager: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-white">Mark as Manager</span>
                  </label>
                  <p className="text-xs text-slate-500 ml-6">
                    Managers can approve timesheets for their team members
                  </p>
                </div>

                <div className="flex gap-3 pt-6">
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
                      <IoSaveOutline className="w-5 h-5" />
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
