import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoSearchOutline, IoFilterOutline, IoPersonAddOutline,
  IoPencilOutline, IoShieldCheckmarkOutline,
  IoMailOutline, IoBusinessOutline, IoNotificationsOutline,
  IoChevronBackOutline, IoChevronForwardOutline, IoGitNetworkOutline,
  IoTrashOutline, IoChevronDownOutline, IoCheckmarkCircle
} from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import EditUserModal from '../components/EditUserModal';
import CreateUserModal from '../components/CreateUserModal';
import UserHierarchyModal from '../components/UserHierarchyModal';
import UserAvatar from '../components/UserAvatar';
import DeleteUserConfirmationModal from '../components/DeleteUserConfirmationModal';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [allDepts, setAllDepts] = useState(['All']);
  const [allUsersLite, setAllUsersLite] = useState([]);

  // Filter Dropdown States
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    fetchUsers(1);
    fetchMetadata();
  }, [search, deptFilter]);

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/users?limit=10000`, {
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
      const response = await axios.post(`${server}/api/notifications/check-weekly-hours`, {}, {
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${server}/api/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers(pagination.page);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/users`, {
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
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-[10px] font-black text-(--text-muted) uppercase tracking-widest mb-2">
            <span>Administration</span>
            <span className="opacity-30">/</span>
            <span className="text-(--primary)">Users</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-(--primary-glow) border border-(--primary-glow) text-(--primary) shadow-lg shadow-(--primary-glow)">
              <IoShieldCheckmarkOutline size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-(--text-main) tracking-tight leading-none">
                User Management
              </h1>
              <p className="text-(--text-muted) mt-1.5 text-xs font-bold italic">Manage system users, roles, and reporting managers</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleSendAlerts}
            disabled={isSendingAlerts}
            className={`w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black transition-all active:scale-95 border uppercase tracking-wider text-[10px] ${isSendingAlerts
              ? 'bg-white/5 text-(--text-muted) border-white/5 cursor-not-allowed'
              : 'bg-(--input-bg) hover:bg-white/5 text-(--text-muted) border-(--glass-border) shadow-sm hover:text-(--text-main)'
              }`}
          >
            {isSendingAlerts ? (
              <div className="w-5 h-5 border-2 border-(--rose-glow) border-t-(--rose) rounded-full animate-spin" />
            ) : (
              <IoNotificationsOutline size={20} className="text-(--rose)" />
            )}
            Send Alerts
          </button>

          <button
            onClick={() => navigate('/compliance')}
            className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold border border-white/10 transition-all active:scale-95 uppercase tracking-wider text-[10px]"
          >
            <IoCheckmarkCircle size={18} className="text-emerald-500" />
            Check Status
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-(--gradient-primary) text-(--text-inverse) rounded-xl font-black shadow-lg shadow-(--primary-glow) transition-all active:scale-95 uppercase tracking-wider text-[10px]"
          >
            <IoPersonAddOutline size={18} />
            Add User
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 group">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-(--primary) transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full bg-(--input-bg) border border-(--glass-border) rounded-xl pl-11 pr-4 py-2 text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-(--primary-glow) focus:border-(--primary) transition-all shadow-sm text-(--text-main) placeholder-(--text-muted)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Premium Dept Selector */}
        <div className="relative min-w-[200px] group">
          <button
            onClick={() => setIsDeptOpen(!isDeptOpen)}
            className={`w-full flex items-center justify-between px-4 py-2 bg-(--input-bg) border rounded-xl text-[11px] font-bold transition-all shadow-sm ${isDeptOpen || deptFilter !== 'All' ? 'border-(--primary) text-(--primary)' : 'border-(--glass-border) text-(--text-muted)'
              }`}
          >
            <div className="flex items-center gap-2">
              <IoBusinessOutline size={16} />
              <span className="truncate">{deptFilter === 'All' ? 'All Depts' : deptFilter}</span>
            </div>
            <IoChevronDownOutline className={`transition-transform duration-300 ${isDeptOpen ? 'rotate-180' : ''}`} size={14} />
          </button>

          <AnimatePresence>
            {isDeptOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 bg-(--app-bg) border border-(--glass-border) rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-2 border-b border-white/5">
                  <div className="relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-black/20 rounded-lg text-xs outline-none focus:bg-black/40 focus:ring-2 focus:ring-(--primary-glow) transition-all font-medium text-white placeholder-gray-500"
                      placeholder="Search depts..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {allDepts.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                    <button
                      key={dept}
                      onClick={() => { setDeptFilter(dept); setIsDeptOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs rounded-xl transition-all flex items-center justify-between group ${deptFilter === dept ? 'bg-(--primary-glow) text-(--primary) font-black' : 'text-(--text-muted) hover:bg-white/5 hover:text-(--text-main)'
                        }`}
                    >
                      {dept}
                      {deptFilter === dept && <IoCheckmarkCircle size={14} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Users Table */}
      <div className="ui-card overflow-hidden flex flex-col bg-(--hover-bg) border-(--glass-border)">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-3 border-(--primary-glow) border-t-(--primary) rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4 font-medium italic">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-(--glass-border) bg-(--hover-bg)">
                    <th className="text-left py-4 px-4 sm:px-6 text-xs font-black text-(--text-muted) uppercase tracking-widest">User</th>
                    <th className="text-left py-4 px-6 text-xs font-black text-(--text-muted) uppercase tracking-widest hidden sm:table-cell">Dept</th>
                    <th className="text-left py-4 px-6 text-xs font-black text-(--text-muted) uppercase tracking-widest hidden md:table-cell">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-black text-(--text-muted) uppercase tracking-widest hidden lg:table-cell">Manager</th>
                    <th className="text-right py-4 px-6 text-xs font-black text-(--text-muted) uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--glass-border)">
                  <AnimatePresence mode='popLayout'>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="hover:bg-(--hover-bg) transition-colors group"
                      >
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} email={user.email} size="md" className="border border-white/10" />
                            <div className="min-w-0">
                              <p className="text-sm font-black truncate max-w-[140px] sm:max-w-none text-(--text-main)">{user.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                <IoMailOutline size={12} className="shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              {/* Mobile indicators */}
                              <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                                <span className="text-[10px] text-(--secondary) bg-(--secondary-glow) px-1.5 py-0.5 rounded border border-(--secondary-glow)">{user.role}</span>
                                {parseInt(user.reports_count) > 0 && (
                                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Manager</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-(--text-muted)">
                            <IoBusinessOutline className="text-(--text-muted) shrink-0" size={14} />
                            <span className="text-sm truncate max-w-[120px]">{user.dept}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${user.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                              : 'bg-white/5 text-gray-400 border-white/10'
                              }`}>
                              {user.role}
                            </span>
                            {parseInt(user.reports_count) > 0 && (
                              <span className="w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                                Manager ({user.reports_count})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden lg:table-cell">
                          <span className="text-sm text-(--text-muted) truncate max-w-[150px] block">
                            {user.manager_name || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsHierarchyModalOpen(true);
                              }}
                              className="p-2.5 text-(--text-muted) hover:text-(--primary) hover:bg-white/10 rounded-xl transition-all active:scale-90"
                              title="View Hierarchy"
                            >
                              <div className="relative">
                                <IoGitNetworkOutline size={18} />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-(--primary) rounded-full scale-0 group-hover:scale-100 transition-transform" />
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2.5 text-(--text-muted) hover:text-(--text-main) hover:bg-white/10 rounded-xl transition-all active:scale-90"
                              title="Edit User"
                            >
                              <IoPencilOutline size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2.5 text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                              title="Delete User"
                            >
                              <IoTrashOutline size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <div className="p-5 rounded-full bg-white/5 border border-white/10 ring-8 ring-white/5">
                            <IoSearchOutline size={40} />
                          </div>
                          <p className="text-lg font-bold text-gray-200">No results found</p>
                          <p className="max-w-xs mx-auto text-sm text-gray-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-auto px-6 py-4 border-t border-(--glass-border) bg-(--hover-bg) flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-(--text-muted) order-2 sm:order-1 font-medium">
                  Showing <span className="text-(--text-main) font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-(--text-main) font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-(--text-main) font-bold">{pagination.total}</span> users
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg bg-(--input-bg) border border-(--glass-border) text-(--text-muted) hover:text-(--text-main) hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <IoChevronBackOutline size={20} />
                  </button>

                  <div className="flex items-center gap-1 mx-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.page === i + 1
                          ? 'bg-(--gradient-primary) text-(--text-inverse) shadow-lg shadow-(--primary-glow)'
                          : 'text-(--text-muted) hover:text-(--text-main) hover:bg-white/5'
                          }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.pages, pagination.page + 2))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg bg-(--input-bg) border border-(--glass-border) text-(--text-muted) hover:text-(--text-main) hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
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

      <DeleteUserConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        userName={userToDelete?.name}
      />
    </div>
  );
}
