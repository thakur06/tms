import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoSearchOutline, IoFilterOutline, IoPersonAddOutline, 
  IoPencilOutline, IoShieldCheckmarkOutline,
  IoMailOutline, IoBusinessOutline, IoNotificationsOutline,
  IoChevronBackOutline, IoChevronForwardOutline, IoGitNetworkOutline
} from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import EditUserModal from '../components/EditUserModal';
import CreateUserModal from '../components/CreateUserModal';
import UserHierarchyModal from '../components/UserHierarchyModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [allDepts, setAllDepts] = useState(['All']);
  const [allUsersLite, setAllUsersLite] = useState([]);

  useEffect(() => {
    fetchUsers(1);
    fetchMetadata();
  }, [search, deptFilter]);

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/users?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = response.data.users || [];
      setAllUsersLite(users);
      const depts = ['All', ...new Set(users.map(u => u.dept))];
      setAllDepts(depts);
    } catch (err) {
      console.error('Metadata fetch failed', err);
    }
  };

  const handleSendAlerts = async () => {
    setIsSendingAlerts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:4000/api/notifications/check-weekly-hours', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Success! Alerts sent to ${response.data.lowHourUsersCount} users.`);
    } catch (error) {
      console.error('Failed to send alerts:', error);
      toast.error('Failed to send email alerts. Check SMTP settings.');
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          search,
          dept: deptFilter
        }
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchUsers(newPage);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <IoShieldCheckmarkOutline size={28} />
            </div>
            User Management
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Manage system users, roles, and reporting managers</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSendAlerts}
            disabled={isSendingAlerts}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
              isSendingAlerts 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
            }`}
          >
            {isSendingAlerts ? (
              <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            ) : (
              <IoNotificationsOutline size={20} />
            )}
            Send Alerts
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
          >
            <IoPersonAddOutline size={20} />
            Add User
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="ui-input pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <IoFilterOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <select
            className="ui-input pl-12 appearance-none"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {allDepts.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="ui-card overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4 font-medium italic">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Dept</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Manager</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode='popLayout'>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="hover:bg-white/2 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate max-w-[140px] sm:max-w-none">{user.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <IoMailOutline size={12} className="shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            {/* Mobile indicators */}
                            <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{user.role}</span>
                              {parseInt(user.reports_count) > 0 && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Manager</span>
                              )}
                            </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-slate-300">
                            <IoBusinessOutline className="text-slate-500 shrink-0" size={14} />
                            <span className="text-sm truncate max-w-[120px]">{user.dept}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                              user.role === 'admin' 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {user.role}
                            </span>
                            {parseInt(user.reports_count) > 0 && (
                              <span className="w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                Manager ({user.reports_count})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden lg:table-cell">
                          <span className="text-sm text-slate-400 truncate max-w-[150px] block">
                             {user.manager_name || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsHierarchyModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all active:scale-90"
                              title="View Hierarchy"
                            >
                              <IoGitNetworkOutline size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all active:scale-90"
                              title="Edit User"
                            >
                              <IoPencilOutline size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <div className="p-5 rounded-full bg-white/5 border border-white/10 ring-8 ring-white/[0.02]">
                            <IoSearchOutline size={40} />
                          </div>
                          <p className="text-lg font-medium">No results found</p>
                          <p className="max-w-xs mx-auto text-sm opacity-60">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-auto px-6 py-4 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500 order-2 sm:order-1">
                  Showing <span className="text-white font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white font-medium">{pagination.total}</span> users
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <IoChevronBackOutline size={20} />
                  </button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          pagination.page === i + 1
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.pages, pagination.page + 2))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <IoChevronForwardOutline size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSuccess={() => fetchUsers(pagination.page)}
      />

      <CreateUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchUsers(1)}
      />

      <UserHierarchyModal
        isOpen={isHierarchyModalOpen}
        onClose={() => setIsHierarchyModalOpen(false)}
        user={selectedUser}
        allUsers={allUsersLite}
      />
    </div>
  );
}
