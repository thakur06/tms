import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoAddOutline, IoSearchOutline, IoTicketOutline,
    IoAlertCircleOutline, IoPersonOutline, IoBriefcaseOutline,
    IoEllipsisVertical, IoCalendarOutline, IoChevronDown
} from 'react-icons/io5';
import { getTickets } from '../api/tickets';
import { getAllProjects } from '../api/projects';
import { getAllUsers } from '../api/users';
import TicketModal from '../components/tickets/TicketModal';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        project_id: '',
        assignee_id: '',
        type: ''
    });
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'priority'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsData, projectsData, usersData] = await Promise.all([
                getTickets(filters),
                getAllProjects(),
                getAllUsers()
            ]);
            setTickets(ticketsData);
            setProjects(projectsData);
            const safeUsers = Array.isArray(usersData) ? usersData : (usersData?.users || []);
            setUsers(safeUsers);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'In Progress': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'Under Review': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'Done': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'Critical': return 'text-red-500 bg-red-500/10';
            case 'High': return 'text-orange-500 bg-orange-500/10';
            case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
            case 'Low': return 'text-green-500 bg-green-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const displayStatus = (status) => {
        if (status === 'Open') return 'Created';
        if (status === 'Done') return 'Closed';
        return status;
    };

    const processedTickets = useMemo(() => {
        let filtered = tickets.filter(t =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toString().includes(searchTerm) ||
            (t.project_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortBy === 'priority') {
            const priorityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return filtered.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));
        } else if (sortBy === 'newest') {
            return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'oldest') {
            return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        return filtered;
    }, [tickets, searchTerm, sortBy]);

    return (
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
            {/* Header Section */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 bg-zinc-900/30 border-b border-white/5 backdrop-blur-xl shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                <IoTicketOutline size={22} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Ticket Center</h1>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Manage & track project issues</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-11 px-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 group"
                        >
                            <IoAddOutline size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            New Ticket
                        </button>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full lg:max-w-sm group">
                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-12 pr-4 bg-zinc-900/50 border border-white/5 rounded-xl text-sm font-medium text-white placeholder-gray-500 outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="w-full sm:w-44">
                            <SearchableSelect
                                placeholder="Project"
                                showLabel={false}
                                options={[{ label: 'All Projects', value: '' }, ...projects.map(p => ({ label: p.name, value: p.id }))]}
                                value={filters.project_id}
                                onChange={(val) => setFilters({ ...filters, project_id: val })}
                            />
                        </div>
                        <div className="w-full sm:w-36">
                            <SearchableSelect
                                placeholder="Status"
                                showLabel={false}
                                options={[
                                    { label: 'All Status', value: '' },
                                    { label: 'Created', value: 'Open' },
                                    { label: 'In Progress', value: 'In Progress' },
                                    { label: 'Under Review', value: 'Under Review' },
                                    { label: 'Closed', value: 'Done' }
                                ]}
                                value={filters.status}
                                onChange={(val) => setFilters({ ...filters, status: val })}
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <div className="relative h-11">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full h-full px-4 bg-zinc-900/50 border border-white/5 rounded-xl text-xs font-black text-white hover:border-amber-500/30 transition-all outline-none appearance-none uppercase tracking-widest"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="priority">Sort by Priority</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <div className="w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-44 bg-zinc-900/50 border border-white/5 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : processedTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                <IoTicketOutline size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-lg font-black text-white">No Tickets Found</h3>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Adjust filters or search criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {processedTickets.map((ticket, index) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02, duration: 0.4 }}
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    className="group relative bg-zinc-900/40 border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-5 hover:border-amber-500/40 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/60 flex flex-col h-full"
                                >
                                    {/* Hover Highlight Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-[2.5rem] pointer-events-none" />

                                    <div className="flex items-start justify-between mb-3 relative">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-colors shadow-sm ${getStatusColor(ticket.status)}`}>
                                                {displayStatus(ticket.status)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm ${getPriorityStyles(ticket.priority)}`}>
                                                <div className={`w-1 h-1 rounded-full bg-current`} />
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono font-black text-gray-700 group-hover:text-amber-500/30 transition-colors uppercase tracking-widest">#{ticket.id}</div>
                                    </div>

                                    <h3 className="text-sm font-black text-white leading-tight mb-4 line-clamp-2 group-hover:text-amber-500 transition-colors">
                                        {ticket.title}
                                    </h3>

                                    <div className="mt-auto pt-4 border-t border-white/5 relative flex flex-col gap-3">
                                        {/* Project Info */}
                                        <div className="flex items-center gap-2 group/meta">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-500/70 shadow-inner group-hover/meta:scale-105 transition-transform shrink-0">
                                                <IoBriefcaseOutline size={12} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-300 truncate">{ticket.project_name || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        {/* Assignee Info - ON NEXT LINE */}
                                        <div className="flex items-center gap-2 group/meta">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500/70 shadow-inner group-hover/meta:scale-105 transition-transform shrink-0">
                                                <IoPersonOutline size={12} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-300 truncate">{ticket.assignee_name || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold mt-1 group-hover:text-gray-400 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <IoCalendarOutline size={12} className="text-gray-700" />
                                                {new Date(ticket.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                            <motion.div
                                                whileHover={{ x: 5 }}
                                                className="flex items-center gap-1 text-amber-500/50 group-hover:text-amber-500 font-black uppercase tracking-widest"
                                            >
                                                Details
                                                <IoEllipsisVertical size={12} />
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <TicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { fetchData(); setIsModalOpen(false); }}
                projects={projects}
                users={users}
            />
        </div>
    );
}
