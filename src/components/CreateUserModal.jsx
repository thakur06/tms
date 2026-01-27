import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPersonAddOutline, IoBusinessOutline, IoMailOutline, IoSaveOutline, 
  IoClose, IoChevronDown, IoSearchOutline, IoCheckmarkCircle,
  IoPersonOutline,IoShieldCheckmarkOutline
} from 'react-icons/io5';
import Modal from './Modal';
import { toast, Zoom } from 'react-toastify';
import axios from 'axios';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: '',
    reporting_manager_id: '',
    role: 'employee'
  });
  
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState([]);
  const [managers, setManagers] = useState([]);
  
  // Dropdown states
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDepts();
      fetchManagers();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dept) return toast.error('Please select a department');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${server}/api/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(
        <div>
          <strong>User Created!</strong>
          <p className="text-xs mt-1">Credentials sent to {formData.email}</p>
          {response.data.emailSent === false && <p className="text-xs text-orange-400 mt-1">Warning: Email failed to send.</p>}
        </div>, 
        { transition: Zoom }
      );
      
      if (onSuccess) onSuccess(response.data);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', dept: '', reporting_manager_id: null });
    setDeptSearch('');
    setManagerSearch('');
    setIsDeptOpen(false);
    setIsManagerOpen(false);
    onClose();
  };

  const selectedManager = managers.find(m => m.id === formData.reporting_manager_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New User"
      shellClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="ui-label flex items-center gap-2">
            <IoPersonAddOutline className="text-[#161efd]" />
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="ui-input"
            placeholder="e.g. Alice Johnson"
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="ui-label flex items-center gap-2">
            <IoMailOutline className="text-[#161efd]" />
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="ui-input"
            placeholder="alice@company.com"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Searchable Dept */}
          <div className="space-y-2">
            <label className="ui-label flex items-center gap-2">
              <IoBusinessOutline className="text-[#161efd]" />
              Department
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsDeptOpen(!isDeptOpen); setIsManagerOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all ${
                  isDeptOpen ? 'border-[#161efd] bg-blue-50 text-[#161efd]' : 'border-gray-200 text-gray-500'
                }`}
              >
                <span className={formData.dept ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.dept || 'Select Dept...'}
                </span>
                <IoChevronDown className={`text-[#161efd] transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10"
                  >
                    <div className="p-2 border-b border-gray-50">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none border border-transparent focus:border-[#161efd]/50 text-gray-900"
                          placeholder="Search dept..."
                          value={deptSearch}
                          onChange={(e) => setDeptSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      {filteredDepts.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, dept: d.dept_name });
                            setIsDeptOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-[#161efd] transition-all flex items-center justify-between"
                        >
                          {d.dept_name}
                          {formData.dept === d.dept_name && <IoCheckmarkCircle className="text-[#161efd]" />}
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
              <IoPersonOutline className="text-[#161efd]" />
              Reporting Manager
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsManagerOpen(!isManagerOpen); setIsDeptOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all ${
                  isManagerOpen ? 'border-[#161efd] bg-blue-50 text-[#161efd]' : 'border-gray-200 text-gray-500'
                }`}
              >
                <span className={formData.reporting_manager_id ? 'text-gray-900' : 'text-gray-400 truncate'}>
                  {selectedManager?.name || 'Select Manager...'}
                </span>
                <IoChevronDown className={`text-[#161efd] transition-transform ${isManagerOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isManagerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10"
                  >
                    <div className="p-2 border-b border-gray-50">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none border border-transparent focus:border-[#161efd]/50 text-gray-900"
                          placeholder="Search manager..."
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, reporting_manager_id: null });
                          setIsManagerOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-gray-400 italic hover:bg-gray-50 hover:text-[#161efd] transition-all"
                      >
                        No Manager
                      </button>
                      {filteredManagers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, reporting_manager_id: m.id });
                            setIsManagerOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-all space-y-0.5"
                        >
                          <div className="flex items-center justify-between px-0.5">
                            <span className="text-xs text-gray-900 font-medium">{m.name}</span>
                            {formData.reporting_manager_id === m.id && <IoCheckmarkCircle className="text-[#161efd]" size={14} />}
                          </div>
                          <p className="text-[10px] text-gray-400 px-0.5 truncate">{m.dept} • {m.email}</p>
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
              <IoShieldCheckmarkOutline className="text-[#161efd]" />
              User Role
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsRoleOpen(!isRoleOpen); setIsDeptOpen(false); setIsManagerOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all ${
                  isRoleOpen ? 'border-[#161efd] bg-blue-50 text-[#161efd]' : 'border-gray-200 text-gray-500'
                }`}
              >
                <span className="text-gray-900 capitalize">
                  {formData.role}
                </span>
                <IoChevronDown className={`text-[#161efd] transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isRoleOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10"
                  >
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      {['admin', 'employee'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, role: r });
                            setIsRoleOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-[#161efd] transition-all flex items-center justify-between capitalize"
                        >
                          {r}
                          {formData.role === r && <IoCheckmarkCircle className="text-[#161efd]" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="relative px-8 py-2.5 bg-[#161efd] hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <IoSaveOutline size={18} />
                Create User
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
