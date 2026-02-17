
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSearchOutline, IoAddOutline, IoBusinessOutline,
    IoChevronDownOutline, IoCheckmarkCircle,
    IoArrowUpOutline, IoArrowDownOutline,
    IoGridOutline, IoStatsChartOutline, IoAnalyticsOutline, IoSyncOutline, IoAlertCircleOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';

import {
    IoPersonOutline, IoLayersOutline, IoPencilOutline
} from 'react-icons/io5';

import SearchableSelect from '../components/SearchableSelect';
import AnalyticsTab from '../components/project-assignments/AnalyticsTab';
import PTOTab from '../components/project-assignments/PTOTab';
import ProjectListTab from '../components/project-assignments/ProjectListTab';

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
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics' or 'ptos'

    // Moved Drawer Logic inside ProjectListTab, but we might need parent state if we want to control it from top level.
    // For now, let's keep selectedAnalyticsUser here to pass down, as per the ProjectListTab definition I made.
    const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState(null);

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
            // Filter projects active on the selected date for the Pie Chart
            activeProjects: data.projects.filter(p => {
                const s = p.start_date.split('T')[0];
                const e = p.end_date.split('T')[0];
                return selectedDate >= s && selectedDate <= e;
            }),
            // Recalculate allocation based on ACTIVE projects only
            displayAllocation: data.projects.filter(p => {
                const s = p.start_date.split('T')[0];
                const e = p.end_date.split('T')[0];
                return selectedDate >= s && selectedDate <= e;
            }).reduce((sum, p) => sum + p.allocation_hours, 0)
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
                    {/* Date Picker - Only show if NOT in PTOTab (PTOTab has its own month selector, but wait, data fetching relies on selectedDate) 
                        Actually, PTOTab uses month tabs. If we hide this date picker, user can't pick specific date?
                        In PTOTab, the month tabs SET the selectedDate.
                        In List view, this date picker sets selectedDate.
                        In Analytics view, selectedDate determines the start month.
                        Let's keep it generally available? 
                        The previous code hid nothing.
                    */}
                    {activeTab !== 'ptos' && (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-1 rounded-xl shadow-inner group transition-all focus-within:border-amber-500/50 w-full sm:w-auto">
                            <div className="p-2 text-gray-400 group-focus-within:text-amber-500">
                                <IoGridOutline size={18} /> {/* Using Grid icon as placeholder for calendar if IoCalendarOutline conflict */}
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
                    )}

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
                    {activeTab === 'list' && (
                        <ProjectListTab
                            users={filteredUsers}
                            selectedDate={selectedDate}
                            onUserSelect={setSelectedAnalyticsUser}
                            allProjects={allProjects}
                            setFormData={setFormData}
                            setIsAssignModalOpen={setIsAssignModalOpen}
                            setIsEditModalOpen={setIsEditModalOpen}
                            setSelectedAssignment={setSelectedAssignment}
                            handleDeleteClick={handleDeleteClick}
                            selectedAnalyticsUser={selectedAnalyticsUser}
                            setSelectedAnalyticsUser={setSelectedAnalyticsUser}
                        />
                    )}

                    {activeTab === 'ptos' && (
                        <PTOTab
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            users={filteredUsers}
                            onSyncSuccess={fetchData}
                            server={server}
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <AnalyticsTab
                            server={server}
                            selectedDate={selectedDate}
                            allUsers={filteredUsers}
                        />
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
        </div >
    );
}
