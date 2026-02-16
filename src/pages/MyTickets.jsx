import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    IoTicketOutline, IoAddOutline,
    IoAlertCircleOutline, IoPersonOutline, IoChevronForwardOutline,
    IoSearchOutline, IoBriefcaseOutline, IoCalendarOutline, IoEllipsisVertical,
    IoChevronDown, IoCheckmarkCircleOutline
} from 'react-icons/io5';
import { getTickets, updateTicket } from '../api/tickets';
import { getAllProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import TicketModal from '../components/tickets/TicketModal';
import { toast } from 'react-toastify';

export default function MyTickets() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        project_id: '',
        assignee_id: user?.id || '',
        type: ''
    });
    const [sortBy, setSortBy] = useState('newest');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        setFilters(prev => ({ ...prev, assignee_id: user.id }));
        fetchData();
        loadMetadata();
    }, [user, filters.status, filters.project_id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getTickets({ ...filters, assignee_id: user.id });
            setTickets(data);
        } catch (error) {
            toast.error("Failed to load your tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            const ticket = tickets.find(t => t.id === ticketId);
            if (!ticket) return;
            await updateTicket(ticketId, { ...ticket, status: newStatus });
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
            toast.success(`Status updated to ${newStatus === 'Open' ? 'Created' : newStatus === 'Done' ? 'Closed' : newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const loadMetadata = async () => {
        try {
            const projectsData = await getAllProjects();
            setProjects(projectsData);
        } catch (error) {
            console.error(error);
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
            <div className="px-4 sm:px-6 py-4 bg-zinc-900/30 border-b border-white/5 backdrop-blur-xl shrink-0">
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                <IoPersonOutline size={18} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white tracking-tight">My Assignments</h1>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Track and manage your tasks</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 group text-xs uppercase tracking-wider"
                    >
                        <IoAddOutline size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        New Ticket
                    </button>
                </div>

                {/* Search and Filters Bar */}
                <div className="w-full mt-6 flex flex-col lg:flex-row items-center gap-3">
                    <div className="relative w-full lg:max-w-sm group">
                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search your tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-11 pr-4 bg-zinc-900/50 border border-white/5 rounded-xl text-[11px] font-bold text-white placeholder-gray-500 outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="w-full sm:w-40">
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
                            <div className="relative h-10">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full h-full px-4 bg-zinc-900/50 border border-white/5 rounded-xl text-[10px] font-black text-white hover:border-amber-500/30 transition-all outline-none appearance-none uppercase tracking-widest"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="priority">Sort by Priority</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={10} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <div className="w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : processedTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                <IoTicketOutline size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-lg font-black text-white">All Clear!</h3>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">No tickets currently assigned to you</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {processedTickets.map((ticket, index) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.01 }}
                                    className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl p-4 hover:border-amber-500/30 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/40 flex flex-col h-full"
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                                    <div className="flex items-start justify-between mb-2.5 relative">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(ticket.status)}`}>
                                                {displayStatus(ticket.status)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${getPriorityStyles(ticket.priority)}`}>
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <div className="text-[9px] font-mono font-black text-gray-700 group-hover:text-amber-500/30 transition-colors uppercase tracking-widest">#{ticket.id}</div>
                                    </div>

                                    <h3 className="text-xs font-black text-white leading-tight mb-4 line-clamp-2 group-hover:text-amber-500 transition-colors uppercase">
                                        {ticket.title}
                                    </h3>

                                    <div className="mt-auto pt-3 border-t border-white/5 relative flex flex-col gap-2">
                                        <div className="flex items-center gap-2 group/meta">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-500/70 shadow-inner shrink-0 transition-transform group-hover/meta:scale-110">
                                                <IoBriefcaseOutline size={10} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 truncate">{ticket.project_name || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mt-1">
                                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold shrink-0 Group-hover:text-gray-300 transition-colors">
                                                <IoCalendarOutline size={10} className="text-gray-600" />
                                                {new Date(ticket.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-amber-500/50 group-hover:text-amber-500 font-black uppercase tracking-widest transition-all">
                                                Details
                                                <IoChevronForwardOutline size={10} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">View Details</span>
                                            <IoEllipsisVertical size={10} className="text-amber-500" />
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
                users={[user]}
            />
        </div>
    );
}
