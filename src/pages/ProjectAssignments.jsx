import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSearchOutline, IoFilterOutline, IoAddOutline,
    IoPencilOutline, IoTrashOutline, IoBusinessOutline,
    IoChevronDownOutline, IoCheckmarkCircle, IoAlertCircleOutline,
    IoPersonOutline, IoPieChartOutline, IoLayersOutline,
    IoCalendarOutline, IoArrowUpOutline, IoArrowDownOutline
} from 'react-icons/io5';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import UserAvatar from '../components/UserAvatar';
import SearchableSelect from '../components/SearchableSelect';

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#06B6D4'];

export default function ProjectAssignments() {
    const server = import.meta.env.VITE_SERVER_ADDRESS;
    const [usersWithAssignments, setUsersWithAssignments] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('Process');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [isDeptOpen, setIsDeptOpen] = useState(false);
    const [allDepts, setAllDepts] = useState(['All']);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Modal states
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [formData, setFormData] = useState({
        user_id: '',
        project_id: '',
        allocation_percentage: 100,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [assignmentsRes, usersRes, projectsRes] = await Promise.all([
                axios.get(`${server}/api/user-projects`, {
                    headers,
                    params: { date: selectedDate }
                }),
                axios.get(`${server}/api/users?limit=1000`, { headers }),
                axios.get(`${server}/api/projects`, { headers })
            ]);

            setUsersWithAssignments(assignmentsRes.data.data);
            setAllUsers(usersRes.data.users || []);
            setAllProjects(projectsRes.data || []);

            const depts = ['All', ...new Set((usersRes.data.users || []).map(u => u.dept))];
            setAllDepts(depts);
        } catch (err) {
            console.error('Failed to fetch data', err);
            toast.error('Failed to load project assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (assignment) => {
        setAssignmentToDelete(assignment);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!assignmentToDelete) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${server}/api/user-projects/${assignmentToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Assignment removed successfully');
            fetchData();
            setIsDeleteModalOpen(false);
            setAssignmentToDelete(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove assignment');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${server}/api/user-projects`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Project assigned successfully');
            setIsAssignModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to assign project');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${server}/api/user-projects/${selectedAssignment.id}`, {
                allocation_percentage: formData.allocation_percentage,
                start_date: formData.start_date,
                end_date: formData.end_date
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Assignment updated successfully');
            setIsEditModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update assignment');
        }
    };

    const filteredUsers = allUsers.map(user => {
        const assignmentData = usersWithAssignments.find(u => u.user_id === user.id);
        return assignmentData || {
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            user_dept: user.dept,
            total_allocation: 0,
            projects: []
        };
    }).filter(u => {
        const matchesSearch = (u.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.user_email || '').toLowerCase().includes(search.toLowerCase());
        const matchesDept = deptFilter === 'All' || u.user_dept === deptFilter;
        return matchesSearch && matchesDept;
    }).sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc'
                ? a.user_name.localeCompare(b.user_name)
                : b.user_name.localeCompare(a.user_name);
        } else if (sortConfig.key === 'allocation') {
            return sortConfig.direction === 'asc'
                ? a.total_allocation - b.total_allocation
                : b.total_allocation - a.total_allocation;
        }
        return 0;
    });

    const toggleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        <span>Administration</span>
                        <span className="opacity-30">/</span>
                        <span className="text-amber-500">Project Assignments</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10">
                            <IoLayersOutline size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                                Project Assignments
                            </h1>
                            <p className="text-gray-500 mt-1.5 text-xs font-bold italic">Manage user project allocation and workload</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-1 rounded-xl shadow-inner group transition-all focus-within:border-amber-500/50">
                        <div className="p-2 text-gray-500 group-focus-within:text-amber-500">
                            <IoCalendarOutline size={18} />
                        </div>
                        <input
                            type="date"
                            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white outline-none cursor-pointer scheme-dark"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                user_id: '',
                                project_id: '',
                                allocation_percentage: 100,
                                start_date: selectedDate,
                                end_date: new Date().toISOString().split('T')[0]
                            });
                            setIsAssignModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 uppercase tracking-wider text-[11px]"
                    >
                        <IoAddOutline size={20} strokeWidth={2.5} />
                        Assign Project
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 group">
                    <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by user or email..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm text-white placeholder-gray-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="relative min-w-[200px] group">
                    <button
                        onClick={() => setIsDeptOpen(!isDeptOpen)}
                        className={`w-full flex items-center justify-between px-4 py-2 bg-zinc-900 border rounded-xl text-[11px] font-bold transition-all shadow-sm ${isDeptOpen || deptFilter !== 'All' ? 'border-amber-500 text-amber-500' : 'border-white/10 text-gray-400'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <IoBusinessOutline size={16} />
                            <span className="truncate">{deptFilter}</span>
                        </div>
                        <IoChevronDownOutline className={`transition-transform duration-300 ${isDeptOpen ? 'rotate-180' : ''}`} size={14} />
                    </button>

                    <AnimatePresence>
                        {isDeptOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            >
                                {allDepts.map(dept => (
                                    <button
                                        key={dept}
                                        onClick={() => { setDeptFilter(dept); setIsDeptOpen(false); }}
                                        className={`w-full px-4 py-3 text-left text-xs rounded-xl transition-all flex items-center justify-between group ${deptFilter === dept ? 'bg-amber-500/10 text-amber-500 font-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {dept}
                                        {deptFilter === dept && <IoCheckmarkCircle size={14} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => toggleSort('name')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${sortConfig.key === 'name' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-white/5 text-gray-500 hover:text-white'}`}
                    >
                        Name
                        {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <IoArrowUpOutline size={12} /> : <IoArrowDownOutline size={12} />
                        )}
                    </button>
                    <button
                        onClick={() => toggleSort('allocation')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${sortConfig.key === 'allocation' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-white/5 text-gray-500 hover:text-white'}`}
                    >
                        Load %
                        {sortConfig.key === 'allocation' && (
                            sortConfig.direction === 'asc' ? <IoArrowUpOutline size={12} /> : <IoArrowDownOutline size={12} />
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center">
                    <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 mt-4 font-medium italic">Loading assignments...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredUsers.map((user, idx) => (
                            <motion.div
                                key={user.user_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={(e) => {
                                    // Don't open if clicking buttons inside
                                    if (e.target.closest('button')) return;
                                    setFormData({
                                        user_id: user.user_id,
                                        project_id: '',
                                        allocation_percentage: 100,
                                        start_date: selectedDate,
                                        end_date: new Date().toISOString().split('T')[0]
                                    });
                                    setIsAssignModalOpen(true);
                                }}
                                className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 hover:border-amber-500/20 transition-all group overflow-hidden cursor-pointer"
                            >
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Left Column: Stats & Projects */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <UserAvatar name={user.user_name} email={user.user_email} size="lg" />
                                            <div>
                                                <h3 className="text-lg font-black text-white">{user.user_name}</h3>
                                                <p className="text-xs text-gray-500 font-bold">{user.user_dept}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Load</span>
                                                <span className={`text-xs font-black ${user.total_allocation > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {user.total_allocation}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(user.total_allocation, 100)}%` }}
                                                    className={`h-full rounded-full ${user.total_allocation > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                            {user.projects.length > 0 ? (
                                                user.projects.map(proj => (
                                                    <div key={proj.id} className="group/item flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5 hover:border-amber-500/30 transition-all">
                                                        <div className="flex items-center gap-3 h-8">
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-white/5">
                                                                {proj.project_code}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-200">{proj.project_name}</p>
                                                                <div className="flex flex-col">
                                                                    <p className="text-[10px] text-gray-300 font-bold">{proj.allocation_percentage}% allocation</p>
                                                                    <p className="text-[10px] text-gray-400 font-medium italic">
                                                                        {new Date(proj.start_date).toLocaleDateString()} - {proj.end_date.startsWith('9999') ? 'Ongoing' : new Date(proj.end_date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1  group-hover/item:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAssignment(proj);
                                                                    setFormData({
                                                                        ...formData,
                                                                        allocation_percentage: proj.allocation_percentage,
                                                                        start_date: proj.start_date.split('T')[0],
                                                                        end_date: proj.end_date.split('T')[0]
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                            >
                                                                <IoPencilOutline size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(proj)}
                                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <IoTrashOutline size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-dashed border-white/10 opacity-50 h-[58px]">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-600">
                                                        <IoLayersOutline size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">No Projects Assigned</p>
                                                        <p className="text-[9px] text-gray-600 font-bold italic">Click card to assign first project</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Pie Chart */}
                                    <div className="w-full sm:w-48 h-48 shrink-0 relative group">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={user.projects.length > 0 ? user.projects : [{ project_name: 'Free', allocation_percentage: 100 }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={user.projects.length > 0 ? 5 : 0}
                                                    dataKey="allocation_percentage"
                                                    nameKey="project_name"
                                                    stroke="none"
                                                >
                                                    {user.projects.length > 0 ? (
                                                        user.projects.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))
                                                    ) : (
                                                        <Cell fill="#10B981" /> /* Emerald-500 */
                                                    )}
                                                </Pie>
                                                {user.projects.length > 0 && (
                                                    <Tooltip
                                                        formatter={(value) => `${value}%`}
                                                        contentStyle={{
                                                            backgroundColor: '#D3D3D3',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            fontSize: '10px',
                                                            fontWeight: '900',
                                                            color: '#000000',
                                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                                            zIndex: 1000
                                                        }}
                                                        itemStyle={{
                                                            color: '#000000',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}
                                                    />
                                                )}
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 group-hover:opacity-0 transition-opacity duration-300">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">Load</span>
                                            <span className={`text-lg font-black ${user.total_allocation > 100 ? 'text-red-500' : 'text-white'}`}>
                                                {user.total_allocation}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {(isAssignModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsAssignModalOpen(false); setIsEditModalOpen(false); }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                        {isAssignModalOpen ? <IoAddOutline size={24} /> : <IoPencilOutline size={24} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">
                                            {isAssignModalOpen ? 'Assign Project' : 'Edit Allocation'}
                                        </h2>
                                        <p className="text-xs text-gray-500 font-bold">
                                            Set project percentage allocation for the user
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={isAssignModalOpen ? handleAssignSubmit : handleEditSubmit} className="space-y-4">
                                    {isAssignModalOpen && (
                                        <>
                                            <SearchableSelect
                                                label="Select User"
                                                placeholder="Choose a user..."
                                                options={allUsers.map(u => ({ label: `${u.name} (${u.dept})`, value: u.id, subLabel: u.email }))}
                                                value={formData.user_id}
                                                onChange={(val) => setFormData({ ...formData, user_id: val })}
                                                icon={IoPersonOutline}
                                            />
                                            <SearchableSelect
                                                label="Select Project"
                                                placeholder="Choose a project..."
                                                options={allProjects.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id, subLabel: p.client }))}
                                                value={formData.project_id}
                                                onChange={(val) => setFormData({ ...formData, project_id: val })}
                                                icon={IoLayersOutline}
                                            />
                                        </>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-500 transition-all scheme-dark"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-500 transition-all scheme-dark"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                            Allocation Percentage (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="100"
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-lg font-black text-white outline-none focus:border-amber-500 transition-all"
                                                value={formData.allocation_percentage || ''}
                                                onChange={(e) => setFormData({ ...formData, allocation_percentage: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAssignModalOpen(false); setIsEditModalOpen(false); }}
                                            className="flex-1 px-6 py-3 bg-zinc-900 text-gray-400 hover:text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
                                        >
                                            {isAssignModalOpen ? 'Assign' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10 p-6 space-y-6"
                        >
                            <div className="flex items-center gap-4 text-red-500">
                                <div className="p-3 rounded-2xl bg-red-500/10">
                                    <IoAlertCircleOutline size={24} />
                                </div>
                                <h3 className="text-xl font-black text-white">Delete Assignment?</h3>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to remove this project assignment? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-zinc-900 text-gray-400 hover:text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
