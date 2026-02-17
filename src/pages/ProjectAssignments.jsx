import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSearchOutline, IoFilterOutline, IoAddOutline,
    IoPencilOutline, IoTrashOutline, IoBusinessOutline,
    IoChevronDownOutline, IoCheckmarkCircle, IoAlertCircleOutline,
    IoPersonOutline, IoPieChartOutline, IoLayersOutline,
    IoCalendarOutline, IoArrowUpOutline, IoArrowDownOutline,
    IoAnalyticsOutline, IoSyncOutline
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
import { IoCloseOutline, IoStatsChartOutline, IoGridOutline, IoCalendarOutline as IoCalendarSubTab } from 'react-icons/io5';
import PtoSpreadsheetView from '../components/PtoSpreadsheetView';

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
    const [allocationThreshold, setAllocationThreshold] = useState('160');
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
        allocation_hours: 40,
        start_date: selectedDate,
        end_date: selectedDate
    });

    // Analytics State
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
    const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState(null);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [availabilityForecast, setAvailabilityForecast] = useState(null);

    const calculateAvailability = (assignments, threshold) => {
        const thresh = parseFloat(threshold) || 100;
        const dateCheckpoints = new Set();
        dateCheckpoints.add(selectedDate);

        assignments.forEach(as => {
            const start = as.start_date.split('T')[0];
            const end = new Date(as.end_date);
            end.setDate(end.getDate() + 1);
            const nextDay = end.toISOString().split('T')[0];
            if (start >= selectedDate) dateCheckpoints.add(start);
            if (nextDay >= selectedDate) dateCheckpoints.add(nextDay);
        });

        const sortedDates = Array.from(dateCheckpoints).sort();

        for (const dateStr of sortedDates) {
            const d = new Date(dateStr);
            const load = assignments.reduce((sum, as) => {
                const start = new Date(as.start_date);
                const end = new Date(as.end_date);
                if (d >= start && d <= end) return sum + as.allocation_hours;
                return sum;
            }, 0);

            if (load < thresh) {
                return { date: dateStr, load };
            }
        }
        return null;
    };

    const handleUserSelect = async (user) => {
        setSelectedAnalyticsUser(user);
        if (!user) {
            setAvailabilityForecast(null);
            return;
        }

        setTimelineLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${server}/api/user-projects/user/${user.user_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const forecast = calculateAvailability(res.data.assignments, allocationThreshold || '160');
            setAvailabilityForecast(forecast);
        } catch (err) {
            console.error("Failed to fetch timeline", err);
        } finally {
            setTimelineLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const dateObj = new Date(selectedDate);
            const [assignmentsRes, usersRes, projectsRes] = await Promise.all([
                axios.get(`${server}/api/user-projects`, {
                    headers,
                    params: {
                        date: selectedDate,
                        month: dateObj.getMonth() + 1,
                        year: dateObj.getFullYear()
                    }
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
        if (new Date(formData.start_date) > new Date(formData.end_date)) {
            toast.error('Start date must be before or equal to end date');
            return;
        }
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
        if (new Date(formData.start_date) > new Date(formData.end_date)) {
            toast.error('Start date must be before or equal to end date');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${server}/api/user-projects/${selectedAssignment.id}`, {
                allocation_hours: formData.allocation_hours,
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
        const data = assignmentData || {
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            user_dept: user.dept,
            total_allocation: 0,
            projects: []
        };

        // Filter projects based on active tab for the card view
        // But keep the 'original' projects for total capacity calculations if needed
        const ptoProjects = data.projects.filter(p => p.project_category === 'PTO' || p.project_name === 'Leave');
        const workProjects = data.projects.filter(p => p.project_category !== 'PTO' && p.project_name !== 'Leave');

        return {
            ...data,
            pto_hours: ptoProjects.reduce((sum, p) => sum + p.allocation_hours, 0),
            work_hours: workProjects.reduce((sum, p) => sum + p.allocation_hours, 0),
            displayProjects: activeTab === 'ptos' ? ptoProjects : workProjects,
            displayAllocation: data.projects.reduce((sum, p) => sum + p.allocation_hours, 0)
        };
    }).filter(u => {
        const matchesSearch = (u.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.user_email || '').toLowerCase().includes(search.toLowerCase());
        const matchesDept = deptFilter === 'All' || u.user_dept === deptFilter;

        // If in PTO tab and not searching, maybe only show those with PTO? 
        // No, user said "add pto hrs for particular emp", so searching everyone is good.
        return matchesSearch && matchesDept;
    }).sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc'
                ? a.user_name.localeCompare(b.user_name)
                : b.user_name.localeCompare(a.user_name);
        } else if (sortConfig.key === 'allocation') {
            return sortConfig.direction === 'asc'
                ? a.displayAllocation - b.displayAllocation
                : b.displayAllocation - a.displayAllocation;
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

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-1 rounded-xl shadow-inner group transition-all focus-within:border-amber-500/50 w-full sm:w-auto">
                        <div className="p-2 text-gray-400 group-focus-within:text-amber-500">
                            <IoCalendarOutline size={18} />
                        </div>
                        <input
                            type="date"
                            className="w-full bg-zinc-900 border-none px-2 py-2 text-[11px] font-black uppercase tracking-wider text-white outline-none cursor-pointer scheme-dark"
                            value={selectedDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setSelectedDate(newDate);
                                setFormData(prev => ({ ...prev, start_date: newDate, end_date: newDate }));
                            }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            const leaveProject = allProjects.find(p => p.category === 'PTO' || p.name === 'Leave');
                            setFormData({
                                user_id: '',
                                project_id: activeTab === 'ptos' && leaveProject ? leaveProject.id : '',
                                allocation_hours: activeTab === 'ptos' ? 8 : 40,
                                start_date: selectedDate,
                                end_date: selectedDate
                            });
                            setIsAssignModalOpen(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 uppercase tracking-wider text-[11px] whitespace-nowrap"
                    >
                        <IoAddOutline size={20} strokeWidth={2.5} />
                        {activeTab === 'ptos' ? 'Log PTO' : 'Assign Project'}
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex flex-col gap-2 shrink-0">
                    {/* <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-1">Forecast Period</span> */}
                    <div className="flex bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent pointer-events-none" />
                        {[0, 1, 2, 3].map((m) => {
                            const d = new Date();
                            d.setDate(1);
                            d.setMonth(d.getMonth() + m);
                            const label = d.toLocaleDateString('en-US', { month: 'short' });
                            const dateStr = d.toISOString().split('T')[0];
                            const isActive = selectedDate.startsWith(dateStr.substring(0, 7));

                            return (
                                <button
                                    key={m}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-w-[75px] z-10 ${isActive
                                        ? 'text-zinc-950 scale-105 active:scale-95'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5 active:scale-95'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeMonth"
                                            className="absolute inset-0 bg-amber-500 rounded-xl -z-1 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{m === 0 ? 'Now' : label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

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

                <div className="relative min-w-[140px] group">
                    <IoStatsChartOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors w-4 h-4" />
                    <input
                        type="number"
                        placeholder="Forecast Threshold Hrs"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm text-white placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={allocationThreshold}
                        title="Threshold for calculating availability forecast"
                        onChange={(e) => setAllocationThreshold(e.target.value)}
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
                        Load Hrs
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
                <button
                    onClick={() => setActiveTab('ptos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'ptos'
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <IoAnalyticsOutline size={16} />
                    PTO Plans
                </button>

                <div className="w-px h-6 bg-white/5 mx-1" />

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                    title="Refresh Data"
                >
                    <IoSyncOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {filteredUsers.map((user, idx) => (
                                    <motion.div
                                        key={user.user_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={(e) => {
                                            // Revert to assignment modal on card click
                                            if (e.target.closest('button')) return;
                                            const leaveProject = allProjects.find(p => p.category === 'PTO' || p.name === 'Leave');
                                            setFormData({
                                                user_id: user.user_id,
                                                project_id: activeTab === 'ptos' && leaveProject ? leaveProject.id : '',
                                                allocation_hours: activeTab === 'ptos' ? 8 : 40,
                                                start_date: selectedDate,
                                                end_date: selectedDate
                                            });
                                            setIsAssignModalOpen(true);
                                        }}
                                        className="bg-zinc-900/50 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-amber-500/20 transition-all group overflow-hidden cursor-pointer"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-4">
                                            {/* Left Column: Stats & Projects */}
                                            <div className="flex-1 min-w-0 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={user.user_name} email={user.user_email} size="md" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-lg font-black text-white truncate">{user.user_name}</h3>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUserSelect(user);
                                                                }}
                                                                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn"
                                                                title="View Availability Forecast"
                                                            >
                                                                <IoCalendarOutline size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                                {/* <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Forecast</span> */}
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-bold">{user.user_dept}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{activeTab === 'ptos' ? 'PTO Hours' : 'Total Work Hours'}</span>
                                                        <span className={`text-xs font-black ${user.displayAllocation > 160 ? 'text-red-500' : (activeTab === 'ptos' ? 'text-blue-500' : 'text-emerald-500')}`}>
                                                            {user.displayAllocation} / 160
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min((user.displayAllocation / 160) * 100, 100)}%` }}
                                                            className={`h-full rounded-full ${user.displayAllocation > 160 ? 'bg-red-500' : (activeTab === 'ptos' ? 'bg-blue-500' : 'bg-emerald-500')}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 hide-y-scroll">
                                                    {user.displayProjects.length > 0 ? (
                                                        user.displayProjects.map(proj => (
                                                            <div key={proj.id} className="group/item relative p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all space-y-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-black text-white truncate">{proj.project_name}</p>
                                                                            <p className="text-[10px] text-gray-400 font-bold truncate">{proj.project_client}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                                        <span className={`${activeTab === 'ptos' ? 'text-blue-500' : 'text-emerald-500'} font-black text-xs md:text-sm`}>{proj.allocation_hours}h</span>
                                                                        <div className="flex items-center gap-1.5 pt-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedAssignment(proj);
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        user_id: user.user_id,
                                                                                        project_id: proj.project_id,
                                                                                        allocation_hours: proj.allocation_hours,
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
                                                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-1.5 rounded-lg w-full justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <IoCalendarOutline size={10} />
                                                                        <span>{new Date(proj.start_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <span className="opacity-30">→</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span>{new Date(proj.end_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-dashed border-white/10 opacity-50 h-[58px]">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-600">
                                                                <IoLayersOutline size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{activeTab === 'ptos' ? 'No PTO Hours' : 'No Projects Assigned'}</p>
                                                                <p className="text-[9px] text-gray-600 font-bold italic">Click card to log hrs</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Pie Chart */}
                                            <div className="w-full lg:w-44 h-44 shrink-0 relative group self-center lg:self-start">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={user.projects.length > 0 ? user.projects : [{ project_name: 'Free', allocation_hours: 160 }]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={45}
                                                            outerRadius={65}
                                                            paddingAngle={user.displayProjects.length > 0 ? 5 : 0}
                                                            dataKey="allocation_hours"
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
                                                                user.projects.map((entry, index) => {
                                                                    const isLeave = entry.project_category === 'PTO' || entry.project_name === 'Leave';
                                                                    return <Cell key={`cell-${index}`} fill={isLeave ? '#3B82F6' : COLORS[index % COLORS.length]} />;
                                                                })
                                                            ) : (
                                                                <Cell fill="#3B3B3B" /> /* Emerald-500 */
                                                            )}
                                                        </Pie>
                                                        {user.projects.length > 0 && (
                                                            <Tooltip
                                                                formatter={(value) => `${value} Hrs`}
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
                                                    <span className="text-[10px] font-black text-gray-500 uppercase">{activeTab === 'ptos' ? 'PTO Load' : 'Monthly'}</span>
                                                    <span className={`text-lg font-black ${user.displayAllocation > 160 ? 'text-red-500' : (activeTab === 'ptos' ? 'text-blue-500' : 'text-white')}`}>
                                                        {user.displayAllocation}h
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : activeTab === 'ptos' ? (
                        <div className="flex-1 min-h-0 h-[600px]">
                            <PtoSpreadsheetView
                                users={filteredUsers}
                                selectedDate={selectedDate}
                                onSyncSuccess={fetchData}
                                server={server}
                            />
                        </div>
                    ) : activeTab === 'analytics' ? (
                        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 sm:p-10 h-[500px] sm:h-[600px] flex flex-col relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] group/analytics">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none group-hover/analytics:bg-amber-500/10 transition-colors duration-700" />

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-xl shadow-amber-500/5">
                                            <IoStatsChartOutline />
                                        </div>
                                        Workload Distribution
                                    </h3>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Monthly capacity analytics & user forecasting</p>
                                </div>
                                <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Optimal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">At Cap</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Over</span>
                                    </div>
                                </div>
                            </div>

                            {filteredUsers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <IoStatsChartOutline size={48} className="mb-4" />
                                    <p className="font-bold text-sm">No user data to display</p>
                                </div>
                            ) : (
                                <div className="flex-1 w-full min-h-[400px] max-h-[600px] overflow-x-hidden overflow-y-auto custom-scrollbar focus:outline-none outline-none">
                                    <ResponsiveContainer width="100%" height={Math.max(400, filteredUsers.length * 45)}>
                                        <BarChart
                                            layout="vertical"
                                            data={filteredUsers}
                                            margin={{ top: 10, right: 60, left: 20, bottom: 5 }}
                                            className="focus:outline-none outline-none"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                domain={[0, 160]}
                                                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                                axisLine={{ stroke: '#ffffff10' }}
                                                tickLine={{ stroke: '#ffffff10' }}
                                            />
                                            <YAxis
                                                dataKey="user_name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                width={90}
                                                tick={({ x, y, payload }) => {
                                                    const user = filteredUsers[payload.index];
                                                    let fill = '#9CA3AF'; // Default Gray
                                                    if (user && user.displayAllocation > 160) fill = '#EF4444'; // Red
                                                    else if (user && user.displayAllocation >= 140) fill = '#F59E0B'; // Amber
                                                    return (
                                                        <g transform={`translate(${x},${y})`}>
                                                            <text
                                                                x={-10}
                                                                y={0}
                                                                dy={4}
                                                                textAnchor="end"
                                                                fill={fill}
                                                                fontSize={10}
                                                                fontWeight={900}
                                                                className="uppercase tracking-tighter"
                                                            >
                                                                {payload.value.split(' ')[0]}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: [0, 8, 8, 0] }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(9, 9, 11, 0.95)',
                                                    backdropFilter: 'blur(20px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '20px',
                                                    padding: '16px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                                    color: '#fff'
                                                }}
                                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                                                labelStyle={{ color: '#F59E0B', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}
                                                formatter={(val) => [`${val}h`, 'Total Planned']}
                                            />
                                            <Bar
                                                dataKey="displayAllocation"
                                                name="Total Hours/Month"
                                                radius={[0, 8, 8, 0]}
                                                cursor="pointer"
                                                barSize={24}
                                                onClick={(data) => handleUserSelect(data)}
                                                className="transition-all duration-300"
                                            >
                                                {filteredUsers.map((entry, index) => {
                                                    let fill = 'url(#blueGradient)';
                                                    if (entry.displayAllocation > 160) fill = 'url(#redGradient)';
                                                    else if (entry.displayAllocation >= 140) fill = 'url(#amberGradient)';
                                                    else if (entry.displayAllocation > 0) fill = 'url(#emeraldGradient)';
                                                    return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.9} />;
                                                })}
                                                <LabelList
                                                    dataKey="displayAllocation"
                                                    position="right"
                                                    fill="#9CA3AF"
                                                    fontSize={11}
                                                    fontWeight={900}
                                                    formatter={(val) => `${val}h`}
                                                    offset={15}
                                                />
                                            </Bar>
                                            <defs>
                                                <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
                                                </linearGradient>
                                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                                                </linearGradient>
                                                <linearGradient id="amberGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.9} />
                                                </linearGradient>
                                                <linearGradient id="redGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.9} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <p className="text-center text-xs text-gray-500 font-bold mt-4">
                                Click on any bar to view details
                            </p>
                        </div>
                    ) : null}

                    {createPortal(
                        <AnimatePresence>
                            {selectedAnalyticsUser && (
                                <>
                                    {/* Backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setSelectedAnalyticsUser(null)}
                                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
                                    />

                                    {/* Drawer */}
                                    <motion.div
                                        initial={{ x: '100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-10000 shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />

                                        <div className="p-8 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/20">
                                            <div className="flex items-center gap-4">
                                                <div className="p-1 rounded-2xl bg-linear-to-br from-amber-500/20 to-transparent border border-amber-500/20 shadow-xl">
                                                    <UserAvatar name={selectedAnalyticsUser.user_name} email={selectedAnalyticsUser.user_email} size="md" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-white tracking-tight leading-tight">{selectedAnalyticsUser.user_name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedAnalyticsUser.user_dept}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedAnalyticsUser(null)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                                            >
                                                <IoCloseOutline size={24} />
                                            </button>
                                        </div>

                                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Capacity Usage</span>
                                                    <span className={`text-sm font-black flex items-center gap-2 ${selectedAnalyticsUser.displayAllocation > 160 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {selectedAnalyticsUser.displayAllocation} <span className="text-[10px] text-gray-500">/ 160h</span>
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (selectedAnalyticsUser.displayAllocation / 160) * 100)}%` }}
                                                        className={`h-full shadow-[0_0_15px_-3px_currentColor] ${selectedAnalyticsUser.displayAllocation > 160 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                            </div>

                                            {allocationThreshold && (
                                                <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/10 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <IoCalendarOutline size={50} />
                                                    </div>
                                                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <IoAnalyticsOutline size={14} />
                                                        Availability Forecast
                                                    </h5>

                                                    {timelineLoading ? (
                                                        <div className="flex items-center gap-3 py-2">
                                                            <div className="w-5 h-5 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Processing Data...</span>
                                                        </div>
                                                    ) : availabilityForecast ? (
                                                        <div className="space-y-5">
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Target Date (≤{allocationThreshold}h)</p>
                                                                <p className="text-xl font-black text-white tracking-tight">
                                                                    {availabilityForecast.date === selectedDate ? 'Available Now' : new Date(availabilityForecast.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                                                                    <IoAlertCircleOutline size={18} />
                                                                </div>
                                                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                                                                    Projected workload will stabilize at <span className="text-amber-500 font-black">{availabilityForecast.load}h/month</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 bg-red-500/5 px-4 py-3 rounded-2xl border border-red-500/10">
                                                            <IoAlertCircleOutline className="text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" size={18} />
                                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Capacity Overloaded</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Current Projects</h5>
                                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-gray-400 border border-white/5">{selectedAnalyticsUser.projects.length}</span>
                                                </div>

                                                {(() => {
                                                    const drawerPto = selectedAnalyticsUser.projects.filter(p => p.project_category === 'PTO' || p.project_name === 'Leave');
                                                    const drawerWork = selectedAnalyticsUser.projects.filter(p => p.project_category !== 'PTO' && p.project_name !== 'Leave');

                                                    if (drawerPto.length === 0 && drawerWork.length === 0) {
                                                        return (
                                                            <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-zinc-900/20">
                                                                <IoLayersOutline size={32} className="text-gray-800 mx-auto mb-3" />
                                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No Active Assignments</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-6">
                                                            {drawerWork.length > 0 && (
                                                                <div className="space-y-3">
                                                                    {drawerWork.map(proj => (
                                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden">
                                                                            <div className="absolute inset-0 bg-linear-to-br from-amber-500/0 via-transparent to-amber-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                                            <div className="flex items-start justify-between relative z-10">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-white/10 group-hover/item:bg-amber-500 group-hover/item:text-zinc-950 transition-colors duration-500">
                                                                                        {proj.project_code}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-black text-white leading-tight">{proj.project_name}</p>
                                                                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">{proj.project_client}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="text-lg font-black text-amber-500 tracking-tight">{proj.allocation_hours}h</div>
                                                                                    <div className="text-[9px] text-gray-500 font-bold uppercase">Work</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {drawerPto.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h6 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] px-1">Leave Assignments</h6>
                                                                    {drawerPto.map(proj => (
                                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
                                                                            <div className="flex items-start justify-between relative z-10">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-[10px] font-black text-white border border-blue-400/20">
                                                                                        PTO
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-black text-blue-400 leading-tight">Leave/Holiday</p>
                                                                                        <p className="text-[10px] text-blue-400/50 font-bold uppercase mt-1 tracking-wider">{proj.project_client || 'Personal'}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="text-lg font-black text-blue-400 tracking-tight">{proj.allocation_hours}h</div>
                                                                                    <div className="text-[9px] text-blue-400/50 font-bold uppercase">Leave</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-md relative z-20">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        user_id: selectedAnalyticsUser.user_id,
                                                        project_id: '',
                                                        allocation_hours: 40,
                                                        start_date: selectedDate,
                                                        end_date: '9999-12-31'
                                                    });
                                                    setSelectedAnalyticsUser(null);
                                                    setIsAssignModalOpen(true);
                                                }}
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-[22px] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-[0_15px_30px_-10px_rgba(245,158,11,0.5)] active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <IoAddOutline size={18} className="stroke-3" />
                                                Assign New Project
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>,
                        document.body
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
                                            Set monthly hours allocation for the user
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
                                            {activeTab !== 'ptos' && (
                                                <SearchableSelect
                                                    label="Select Project"
                                                    placeholder="Choose a project..."
                                                    options={allProjects.filter(p => p.category !== 'PTO').map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id, subLabel: p.client }))}
                                                    value={formData.project_id}
                                                    onChange={(val) => setFormData({ ...formData, project_id: val })}
                                                    icon={IoLayersOutline}
                                                />
                                            )}
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
                                            Monthly Allocation (Hours)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="160"
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-lg font-black text-white outline-none focus:border-amber-500 transition-all"
                                                value={formData.allocation_hours || ''}
                                                onChange={(e) => setFormData({ ...formData, allocation_hours: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Hrs</span>
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
                    <div className="fixed inset-0 z-100 h-screen flex items-center justify-center p-4 ">
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
