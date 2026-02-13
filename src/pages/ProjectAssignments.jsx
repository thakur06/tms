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
// Add custom styles for recharts
const rechartsStyles = `
    .recharts-wrapper {
        outline: none !important;
    }
    .recharts-surface {
        outline: none !important;
    }
    .recharts-layer path {
        outline: none !important;
    }
`;

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, LabelList
} from 'recharts';
import { toast } from 'react-toastify';
import UserAvatar from '../components/UserAvatar';
import SearchableSelect from '../components/SearchableSelect';
import { IoCloseOutline, IoStatsChartOutline, IoGridOutline } from 'react-icons/io5';

const COLORS = [
    '#F59E0B', // Yellow/Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#38BDF8', // Light Blue
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#EF4444', // Red
    '#10B981', // Green
];

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
        end_date: new Date().toISOString().split('T')[0]
    });

    // Analytics State
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
    const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState(null);

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
            <style>{rechartsStyles}</style>
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

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl w-fit border border-white/5 mb-6">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'list'
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <IoGridOutline size={16} />
                    List View
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'analytics'
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <IoStatsChartOutline size={16} />
                    Analytics
                </button>
            </div>

            {loading ? (
                <div className="p-20 text-center">
                    <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 mt-4 font-medium italic">Loading assignments...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'list' ? (
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

                                                <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                    {user.projects.length > 0 ? (
                                                        user.projects.map(proj => (
                                                            <div key={proj.id} className="group/item relative p-2 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all space-y-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex items-center gap-2">

                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-black text-white truncate">{proj.project_name}</p>
                                                                            <p className="text-[10px] text-gray-400 font-bold truncate">{proj.project_client}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                                        <span className="text-blue-500 font-black text-sm">{proj.allocation_percentage}%</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedAssignment(proj);
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        allocation_percentage: proj.allocation_percentage,
                                                                                        start_date: proj.start_date.split('T')[0],
                                                                                        end_date: proj.end_date.split('T')[0]
                                                                                    });
                                                                                    setIsEditModalOpen(true);
                                                                                }}
                                                                                className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                                            >
                                                                                <IoPencilOutline size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteClick(proj);
                                                                                }}
                                                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                                            >
                                                                                <IoTrashOutline size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg w-fit">
                                                                    <IoCalendarOutline size={10} />
                                                                    <span>{new Date(proj.start_date).toLocaleDateString()}</span>
                                                                    <span className="opacity-30">→</span>
                                                                    <span>{proj.end_date.startsWith('9999') ? 'Ongoing' : new Date(proj.end_date).toLocaleDateString()}</span>
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
                                                            onMouseEnter={(_, index) => {
                                                                // Track which user's pie is hovered
                                                                window._hoveredPieId = user.user_id + '_' + index;
                                                                const el = document.getElementById(`load-info-${user.user_id}`);
                                                                if (el) el.style.opacity = '0';
                                                            }}
                                                            onMouseLeave={() => {
                                                                window._hoveredPieId = null;
                                                                const el = document.getElementById(`load-info-${user.user_id}`);
                                                                if (el) el.style.opacity = '1';
                                                            }}
                                                        >
                                                            {user.projects.length > 0 ? (
                                                                user.projects.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))
                                                            ) : (
                                                                <Cell fill="#3B3B3B" /> /* Emerald-500 */
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
                                                <div
                                                    id={`load-info-${user.user_id}`}
                                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 transition-opacity duration-300"
                                                >
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
                    ) : (
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 h-[500px] flex flex-col relative overflow-hidden">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <IoStatsChartOutline className="text-amber-500" />
                                Workload Analytics
                            </h3>

                            {filteredUsers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <IoStatsChartOutline size={48} className="mb-4" />
                                    <p className="font-bold text-sm">No user data to display</p>
                                </div>
                            ) : (
                                <div className="flex-1 w-full min-h-0 focus:outline-none outline-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={filteredUsers}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            className="focus:outline-none outline-none"
                                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                            className="focus:outline-none outline-none"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis
                                                dataKey="user_name"
                                                tick={({ x, y, payload }) => {
                                                    const user = filteredUsers[payload.index];
                                                    let fill = '#3B82F6'; // Default Blue
                                                    if (user && user.total_allocation >= 100) fill = '#EF4444'; // Red
                                                    if (user && user.total_allocation === 0) fill = '#10B981'; // Green
                                                    return (
                                                        <g transform={`translate(${x},${y})`}>
                                                            <text
                                                                x={0}
                                                                y={0}
                                                                dy={16}
                                                                textAnchor="end"
                                                                fill={fill}
                                                                transform="rotate(-45)"
                                                                fontSize={10}
                                                                fontWeight={700}
                                                            >
                                                                {payload.value}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                axisLine={{ stroke: '#ffffff10' }}
                                                tickLine={{ stroke: '#ffffff10' }}
                                                interval={0}
                                                height={60}
                                            />
                                            <YAxis
                                                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                                axisLine={{ stroke: '#ffffff10' }}
                                                tickLine={{ stroke: '#ffffff10' }}
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#ffffff05' }}
                                                contentStyle={{
                                                    backgroundColor: '#09090b',
                                                    border: '1px solid #ffffff10',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar
                                                dataKey="total_allocation"
                                                name="Total Load %"
                                                radius={[4, 4, 0, 0]}
                                                cursor="pointer"
                                                activeBar={false}
                                                onClick={(data) => {
                                                    if (data) {
                                                        setSelectedAnalyticsUser(data);
                                                    }
                                                }}
                                            >
                                                {filteredUsers.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        fillOpacity={0.9}
                                                        stroke="none"
                                                    />
                                                ))}
                                                <LabelList
                                                    dataKey="total_allocation"
                                                    position="top"
                                                    fill="#9CA3AF"
                                                    fontSize={10}
                                                    fontWeight={700}
                                                    formatter={(val) => `${val}%`}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <p className="text-center text-xs text-gray-500 font-bold mt-4">
                                Click on any bar to view details
                            </p>

                            {/* Slide-over Side Panel */}
                            <AnimatePresence>
                                {selectedAnalyticsUser && (
                                    <>
                                        {/* Backdrop */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setSelectedAnalyticsUser(null)}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                                        />

                                        {/* Drawer */}
                                        <motion.div
                                            initial={{ x: '100%' }}
                                            animate={{ x: 0 }}
                                            exit={{ x: '100%' }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                            className="absolute top-0 right-0 h-full w-full max-w-sm bg-black border-l border-white/10 z-50 shadow-2xl overflow-hidden flex flex-col"
                                        >
                                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={selectedAnalyticsUser.user_name} email={selectedAnalyticsUser.user_email} size="md" />
                                                    <div>
                                                        <h4 className="text-lg font-black text-white">{selectedAnalyticsUser.user_name}</h4>
                                                        <p className="text-xs text-gray-400 font-bold">{selectedAnalyticsUser.user_dept}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedAnalyticsUser(null)}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                                >
                                                    <IoCloseOutline size={20} />
                                                </button>
                                            </div>

                                            <div className="p-6 flex-1 overflow-y-auto">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Utilized Capacity</span>
                                                    <span className={`text-xl font-black ${selectedAnalyticsUser.total_allocation > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {selectedAnalyticsUser.total_allocation}%
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Assigned Projects</h5>
                                                    {selectedAnalyticsUser.projects.length > 0 ? (
                                                        selectedAnalyticsUser.projects.map(proj => (
                                                            <div key={proj.id} className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-3">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-white/5">
                                                                            {proj.project_code}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-black text-white">{proj.project_name}</p>
                                                                            <p className="text-[10px] text-gray-400">{proj.project_client}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-blue-500 font-black text-lg">{proj.allocation_percentage}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-black/40 p-2 rounded-lg">
                                                                    <IoCalendarOutline />
                                                                    {new Date(proj.start_date).toLocaleDateString()}
                                                                    <span>→</span>
                                                                    {proj.end_date.startsWith('9999') ? 'Ongoing' : new Date(proj.end_date).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                                            <p className="text-gray-500 text-sm font-bold">No projects assigned</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-white/10 bg-zinc-900/30">
                                                <button
                                                    onClick={() => {
                                                        setFormData({
                                                            user_id: selectedAnalyticsUser.user_id,
                                                            project_id: '',
                                                            allocation_percentage: 100,
                                                            start_date: selectedDate,
                                                            end_date: new Date().toISOString().split('T')[0]
                                                        });
                                                        setSelectedAnalyticsUser(null);
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-amber-500/10"
                                                >
                                                    Assign New Project
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </>
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
