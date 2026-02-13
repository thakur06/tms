import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBackOutline, IoPersonCircleOutline, IoCalendarOutline,
    IoTimeOutline, IoPencilOutline, IoSendOutline, IoAlertCircleOutline,
    IoCheckmarkCircleOutline, IoTicketOutline, IoChatbubbleOutline, IoLinkOutline,
    IoTrashOutline, IoBriefcaseOutline, IoShieldCheckmarkOutline, IoCheckmarkCircle
} from 'react-icons/io5';
import { getTicketById, updateTicket, addComment, deleteTicket } from '../api/tickets';
import { getAllUsers } from '../api/users';
import { getAllProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import TicketModal from '../components/tickets/TicketModal';
import DeleteConfirmationModal from '../components/tickets/DeleteConfirmationModal';
import { toast } from 'react-toastify';

export default function TicketViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);

    // Mention state
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionCursorPos, setMentionCursorPos] = useState(null);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ticketData, usersData, projectsData] = await Promise.all([
                getTicketById(id),
                getAllUsers(),
                getAllProjects()
            ]);
            setTicket(ticketData);
            setProjects(projectsData);
            setUsers(Array.isArray(usersData) ? usersData : (usersData?.users || []));
        } catch (error) {
            toast.error("Failed to load ticket details");
            navigate('/tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateTicket(id, { ...ticket, status: newStatus });
            setTicket(prev => ({ ...prev, status: newStatus }));
            toast.success(`Status updated to ${newStatus === 'Open' ? 'Created' : newStatus === 'Done' ? 'Closed' : newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleAssigneeUpdate = async (newAssigneeId) => {
        try {
            const assigneeName = users.find(u => u.id === parseInt(newAssigneeId))?.name || 'Unassigned';
            await updateTicket(id, { ...ticket, assignee_id: newAssigneeId });
            setTicket(prev => ({ ...prev, assignee_id: newAssigneeId, assignee_name: assigneeName }));
            toast.success(`Ticket assigned to ${assigneeName}`);
        } catch (error) {
            toast.error("Failed to update assignee");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            await addComment(id, { content: comment });
            setComment('');
            setShowMentionSuggestions(false);
            loadData();
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const handleCommentChange = (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setComment(value);

        // Detect mention
        const textBeforeCursor = value.slice(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionSearch(mentionMatch[1].toLowerCase());
            setMentionCursorPos(cursorPos);
            setShowMentionSuggestions(true);
            setSelectedMentionIndex(0);
        } else {
            setShowMentionSuggestions(false);
        }
    };

    const handleMentionSelect = (userName) => {
        const textBeforeMention = comment.slice(0, mentionCursorPos - mentionSearch.length - 1);
        const textAfterMention = comment.slice(mentionCursorPos);
        const newComment = `${textBeforeMention}@${userName} ${textAfterMention}`;

        setComment(newComment);
        setShowMentionSuggestions(false);

        // Focus back on textarea after state update (handled by focus logic in the future or just the fact that it's a controlled component)
    };

    const filteredMentionUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionSearch)
    ).slice(0, 5);

    const handleDeleteTicket = async () => {
        try {
            await deleteTicket(id);
            toast.success("Ticket deleted successfully");
            navigate('/tickets');
        } catch (error) {
            toast.error("Failed to delete ticket");
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const formatCommentContent = (content) => {
        if (!content) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const sortedUserNames = users
            .map(u => u.name)
            .filter(Boolean)
            .sort((a, b) => b.length - a.length)
            .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

        const mentionRegex = sortedUserNames.length > 0
            ? new RegExp(`@(${sortedUserNames.join('|')})`, 'g')
            : null;

        const parts = [];
        const urlMatches = [...content.matchAll(urlRegex)];
        let cursor = 0;

        urlMatches.forEach(match => {
            const [url] = match;
            const index = match.index;
            if (index > cursor) {
                const textPart = content.slice(cursor, index);
                parts.push(...processMentions(textPart, mentionRegex));
            }
            parts.push(
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 hover:underline break-all inline-flex items-center gap-1 font-bold"
                    onClick={(e) => e.stopPropagation()}
                >
                    <IoLinkOutline size={12} />
                    {url}
                </a>
            );
            cursor = index + url.length;
        });

        if (cursor < content.length) {
            const textPart = content.slice(cursor);
            parts.push(...processMentions(textPart, mentionRegex));
        }
        return parts;
    };

    const processMentions = (text, regex) => {
        if (!regex) return [text];
        const result = [];
        let cursor = 0;
        const matches = [...text.matchAll(regex)];
        matches.forEach(match => {
            const [fullMatch, name] = match;
            const index = match.index;
            if (index > cursor) {
                result.push(text.slice(cursor, index));
            }
            result.push(
                <span key={index} className="text-emerald-400 font-black bg-emerald-400/10 rounded-lg px-2 py-0.5 border border-emerald-400/20 mx-1 inline-block text-[11px] uppercase tracking-wider backdrop-blur-sm">
                    @{name}
                </span>
            );
            cursor = index + fullMatch.length;
        });
        if (cursor < text.length) {
            result.push(text.slice(cursor));
        }
        return result;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Intel...</span>
        </div>
    );

    if (!ticket) return null;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Open': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'In Progress': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'Under Review': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'Done': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const isOwner = currentUser && (currentUser.id === ticket.reporter_id);
    const isAdmin = currentUser && (currentUser.role === 'admin');
    const isAssignee = currentUser && (currentUser.id === ticket.assignee_id);
    const canEditOrDelete = isOwner || isAdmin;
    const canReassign = isOwner || isAssignee || isAdmin;

    return (
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
            {/* Premium Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-zinc-900/60 border-b border-white/5 backdrop-blur-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-20 shadow-2xl relative">
                <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />

                <div className="flex items-center gap-5 relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center shadow-lg group"
                    >
                        <IoArrowBackOutline size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </motion.button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-amber-500 tracking-[0.2em] uppercase bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">ISSUE REPORT</span>
                            <span className="text-[10px] font-mono text-gray-500 font-black">#{ticket.id}</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight max-w-xl truncate">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    <AnimatePresence>
                        {canEditOrDelete && (
                            <div className="flex items-center gap-2 mr-2 pr-4 border-r border-white/10">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="h-10 px-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <IoPencilOutline size={16} />
                                    <span className="hidden sm:inline">Modify</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="h-10 px-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <IoTrashOutline size={16} />
                                    <span className="hidden sm:inline">Purge</span>
                                </motion.button>
                            </div>
                        )}
                    </AnimatePresence>
                    {(canEditOrDelete || isAssignee) && (
                        <div className="min-w-[200px]">
                            <SearchableSelect
                                placeholder="Update Status"
                                options={[
                                    { label: 'Open', value: 'Open' },
                                    { label: 'In Progress', value: 'In Progress' },
                                    { label: 'Under Review', value: 'Under Review' },
                                    { label: 'Done', value: 'Done' },
                                    { label: 'Cancelled', value: 'Cancelled' }
                                ]}
                                value={ticket.status}
                                onChange={handleStatusUpdate}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 bg-zinc-950/20 relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/2 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/2 blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-10 order-1 relative">
                        {/* Description Section */}
                        <section className="bg-zinc-900/40 border border-white/5 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md group hover:border-white/10 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                        <IoTicketOutline size={16} />
                                    </div>
                                    TICKET DETAILS
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyles(ticket.status)}`}>
                                        {ticket.status === 'Open' ? 'Created' : ticket.status === 'Done' ? 'Closed' : ticket.status}
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority} Priority
                                    </div>
                                </div>
                            </div>
                            <div className="prose prose-invert prose-lg max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed font-light tracking-wide lg:text-lg">
                                {formatCommentContent(ticket.description || 'No detailed description specified for this report.')}
                            </div>
                        </section>

                        {/* Communication Hub */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <IoChatbubbleOutline size={16} />
                                    </div>
                                    COMMENTS ({ticket.comments?.length || 0})
                                </h3>
                            </div>

                            {/* Comment Write Field */}
                            <form onSubmit={handleCommentSubmit} className="relative group">
                                <div className="absolute -inset-0.5 bg-linear-to-br from-amber-500/20 via-transparent to-indigo-500/20 rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
                                <div className="relative bg-zinc-900 shadow-2xl border border-white/5 rounded-[2.5rem] overflow-hidden">
                                    <textarea
                                        className="w-full min-h-[140px] resize-none bg-transparent border-none p-8 text-base font-light text-white placeholder-gray-600 outline-none transition-all"
                                        placeholder="Add to the discussion... Type @username to mention"
                                        value={comment}
                                        onChange={handleCommentChange}
                                        onKeyDown={(e) => {
                                            if (showMentionSuggestions) {
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setSelectedMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setSelectedMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
                                                } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (filteredMentionUsers[selectedMentionIndex]) {
                                                        handleMentionSelect(filteredMentionUsers[selectedMentionIndex].name);
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    setShowMentionSuggestions(false);
                                                }
                                            }
                                        }}
                                    />

                                    {/* Mention Suggestions */}
                                    <AnimatePresence>
                                        {showMentionSuggestions && filteredMentionUsers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full left-8 mb-2 w-64 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-1000 backdrop-blur-xl"
                                            >
                                                <div className="p-3 border-b border-white/5 bg-zinc-900/50">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Operative</p>
                                                </div>
                                                <div className="p-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {filteredMentionUsers.map((u, idx) => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => handleMentionSelect(u.name)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${idx === selectedMentionIndex
                                                                ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${idx === selectedMentionIndex
                                                                ? 'bg-amber-500 text-zinc-950 scale-110'
                                                                : 'bg-zinc-900 border border-white/5'
                                                                }`}>
                                                                {u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-xs font-bold block truncate">{u.name}</span>
                                                                {idx === selectedMentionIndex && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Press Enter to select</span>
                                                                )}
                                                            </div>
                                                            {idx === selectedMentionIndex && (
                                                                <IoCheckmarkCircle className="shrink-0 animate-in fade-in zoom-in" size={14} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="absolute bottom-4 right-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={!comment.trim()}
                                            className="h-14 w-14 bg-amber-500 text-zinc-950 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl shadow-amber-500/20 disabled:opacity-30 disabled:scale-100"
                                        >
                                            <IoSendOutline size={20} />
                                        </motion.button>
                                    </div>
                                </div>
                            </form>

                            {/* Activity Stream */}
                            <div className="space-y-4 pt-4">
                                {ticket.comments?.length === 0 ? (
                                    <div className="py-12 sm:py-20 flex flex-col items-center justify-center bg-zinc-900/20 border border-dashed border-white/5 rounded-4xl sm:rounded-[3rem] opacity-40">
                                        <IoChatbubbleOutline size={48} className="text-gray-600 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Discussion stream empty</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {[...ticket.comments].reverse().map((c, i) => (
                                            <motion.div
                                                key={c.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-zinc-900/60 border border-white/5 rounded-3xl sm:rounded-[2.5rem] hover:border-white/10 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-amber-500 font-black shrink-0 shadow-2xl text-sm group-hover:scale-110 transition-transform">
                                                    {c.user_name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div className="flex-1 space-y-2 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-widest">{c.user_name}</span>
                                                        <span className="text-[10px] font-black text-gray-600 flex items-center gap-1.5 uppercase tracking-tighter">
                                                            <IoTimeOutline size={12} className="text-gray-700" />
                                                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="text-zinc-800 mx-1">•</span>
                                                            {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm leading-relaxed font-light wrap-break-word">
                                                        {formatCommentContent(c.content)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Meta/Sidebar */}
                    <aside className="lg:col-span-4 space-y-6 order-2">
                        {/* Ticket Owner (Reporter) - Non-editable */}
                        <section className="bg-zinc-900/40 border border-amber-500/20 rounded-3xl sm:rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <IoPersonCircleOutline size={14} />
                                Ticket Owner
                            </h4>
                            <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black text-sm">
                                    {ticket.reporter_name?.substring(0, 2).toUpperCase() || '??'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-white truncate">{ticket.reporter_name || 'Unknown'}</p>
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Report Creator</p>
                                </div>
                            </div>
                            <p className="mt-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                                Owner cannot be changed
                            </p>
                        </section>

                        {/* Assignment Control */}
                        {canReassign && (
                            <section className="bg-zinc-900/40 border border-indigo-500/20 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <IoShieldCheckmarkOutline size={14} />
                                    Assignee Control
                                </h4>
                                <SearchableSelect
                                    label="Update Assignee"
                                    placeholder="Select operative..."
                                    options={[
                                        { label: 'Unassigned', value: '' },
                                        ...users.map(u => ({ label: u.name, value: u.id }))
                                    ]}
                                    value={ticket.assignee_id || ''}
                                    onChange={handleAssigneeUpdate}
                                />
                                <p className="mt-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                                    Only owner, assignee, or admin can reassign
                                </p>
                            </section>
                        )}

                        {/* Property Matrix */}
                        <section className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl backdrop-blur-xl">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Issue Matrix</h4>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Project Origin</span>
                                    <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                                            <IoBriefcaseOutline size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate">{ticket.project_name || 'Generic'}</p>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">System ID: {ticket.project_id || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Current operative</span>
                                    <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                            <IoPersonCircleOutline size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate">{ticket.assignee_name || 'Awaiting Intel'}</p>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Assigned Agent</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 text-right">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-left">Timeline</span>
                                    <div className="bg-zinc-950/30 p-5 rounded-3xl border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-600 uppercase">Detection</span>
                                            <span className="text-xs font-bold text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-600 uppercase">Last Sync</span>
                                            <span className="text-xs font-bold text-gray-400">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            <TicketModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => { setIsEditModalOpen(false); loadData(); }}
                ticket={ticket}
                projects={projects}
                users={users}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTicket}
                title="TERMINATE REPORT"
                message="This will permanently purge this incident report and all associated intelligence from the system. This operation is irreversible."
            />
        </div>
    );
}
