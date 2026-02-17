import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBackOutline, IoPersonCircleOutline, IoCalendarOutline,
    IoTimeOutline, IoPencilOutline, IoSendOutline, IoAlertCircleOutline,
    IoCheckmarkCircleOutline, IoTicketOutline, IoChatbubbleOutline, IoLinkOutline,
    IoTrashOutline, IoBriefcaseOutline, IoShieldCheckmarkOutline, IoCheckmarkCircle
} from 'react-icons/io5';
import { getTicketById, updateTicket, addComment, deleteTicket, updateComment, deleteComment } from '../api/tickets';
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

    // Comment Editing State
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

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

    const handleMentionSelect = (user) => {
        const textBeforeMention = comment.slice(0, mentionCursorPos - mentionSearch.length - 1);
        const textAfterMention = comment.slice(mentionCursorPos);

        // Check for duplicate names
        const hasDuplicateName = users.filter(u => u.name.trim().toLowerCase() === user.name.trim().toLowerCase()).length > 1;
        const mentionText = hasDuplicateName ? `${user.name} (${user.email})` : user.name;

        const newComment = `${textBeforeMention}@${mentionText} ${textAfterMention}`;

        setComment(newComment);
        setShowMentionSuggestions(false);
    };

    const filteredMentionUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionSearch)
    ).slice(0, 5);

    const isNearDeadline = (ticket) => {
        if (!ticket || !ticket.estimated_date || ticket.status === 'Done' || ticket.status === 'Cancelled') return false;

        // Parse "YYYY-MM-DD" directly to avoid timezone shifts
        const dateStr = new Date(ticket.estimated_date).toISOString().split('T')[0];
        const deadline = new Date(dateStr + "T23:59:59"); // End of that day
        const now = new Date();

        const diffTime = deadline.getTime() - now.getTime();
        return diffTime < (48 * 60 * 60 * 1000) && diffTime > 0; // Within 48 hours but not past
    };

    const formatEstimatedDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    };



    const handleEditClick = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleSaveEdit = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            await updateComment(id, commentId, { content: editContent });

            // Optimistic update or reload
            setTicket(prev => ({
                ...prev,
                comments: prev.comments.map(c =>
                    c.id === commentId ? { ...c, content: editContent, updated_at: new Date().toISOString() } : c
                )
            }));

            setEditingCommentId(null);
            setEditContent('');
            toast.success("Comment updated");
        } catch (error) {
            toast.error("Failed to update comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(id, commentId);
            setTicket((prev) => ({
                ...prev,
                comments: prev.comments.filter((c) => c.id !== commentId)
            }));
            toast.success("Comment deleted");
        } catch (err) {
            toast.error("Failed to delete comment");
        }
    };

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
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 font-normal overflow-hidden">
            {/* Minimal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-zinc-950 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <IoArrowBackOutline size={20} />
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div>
                        <div className="flex items-center gap-3 text-sm text-zinc-400 mb-1">
                            <span className="font-mono">#{ticket.id}</span>
                            <span>•</span>
                            <span className="uppercase tracking-wider font-bold text-xs">{ticket.project_name || 'No Project'}</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {canEditOrDelete && (
                            <div className="flex items-center gap-1 mr-2 pr-4 border-r border-white/10">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                    title="Edit Ticket"
                                >
                                    <IoPencilOutline size={16} />
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete Ticket"
                                >
                                    <IoTrashOutline size={16} />
                                </button>
                            </div>
                        )}
                    </AnimatePresence>

                    {(canEditOrDelete || isAssignee) && (
                        <div className="min-w-[140px]">
                            <SearchableSelect
                                placeholder="Status"
                                options={[
                                    { label: 'Open', value: 'Open' },
                                    { label: 'In Progress', value: 'In Progress' },
                                    { label: 'Under Review', value: 'Under Review' },
                                    { label: 'Done', value: 'Done' },
                                    { label: 'Cancelled', value: 'Cancelled' }
                                ]}
                                value={ticket.status}
                                onChange={handleStatusUpdate}
                                variant="minimal" // Assuming SearchableSelect can handle or we adapt styling here
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Content */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Description */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-2">Description</h3>
                            <div className="prose prose-invert prose-base max-w-none text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {formatCommentContent(ticket.description || 'No description provided.')}
                            </div>
                        </section>

                        {/* Comments */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Activity ({ticket.comments?.length || 0})</h3>
                            </div>

                            {/* Comment Input */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-white/5 shrink-0">
                                    {currentUser?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 relative group">
                                    {/* Mention Suggestions */}
                                    <AnimatePresence>
                                        {showMentionSuggestions && filteredMentionUsers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                                            >
                                                {filteredMentionUsers.map((u, idx) => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => handleMentionSelect(u)}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${idx === selectedMentionIndex ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-400 hover:bg-white/5'}`}
                                                    >
                                                        <span className="font-bold">@{u.name}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleCommentSubmit}>
                                        <textarea
                                            value={comment}
                                            onChange={handleCommentChange}
                                            onKeyDown={(e) => {
                                                if (showMentionSuggestions) {
                                                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedMentionIndex(prev => (prev + 1) % filteredMentionUsers.length); }
                                                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length); }
                                                    else if (e.key === 'Enter') { e.preventDefault(); if (filteredMentionUsers[selectedMentionIndex]) handleMentionSelect(filteredMentionUsers[selectedMentionIndex]); }
                                                    else if (e.key === 'Escape') { setShowMentionSuggestions(false); }
                                                }
                                            }}
                                            placeholder="Leave a comment..."
                                            className="w-full bg-transparent border-0 border-b border-white/10 py-2 px-0 text-sm focus:ring-0 focus:border-amber-500/50 transition-colors resize-none min-h-[40px] leading-relaxed placeholder-zinc-700"
                                            rows={1}
                                            style={{ minHeight: '40px' }}
                                            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                        />
                                        <div className="flex justify-end mt-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            <button
                                                type="submit"
                                                disabled={!comment.trim()}
                                                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                                            >
                                                Comment
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Comment List */}
                            <div className="space-y-8 pl-4 border-l border-white/5 ml-4">
                                {[...ticket.comments].reverse().map((c) => (
                                    <div key={c.id} className="group relative pl-8 pb-2">
                                        <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-950 border border-white/10 group-hover:border-amber-500/50 transition-colors" />

                                        <div className="flex items-baseline justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-zinc-200">{c.user_name}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
                                                    {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {c.user_id === currentUser?.id && !editingCommentId && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(c)}
                                                        className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <IoPencilOutline size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <IoTrashOutline size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editingCommentId === c.id ? (
                                            <div className="mt-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all min-h-[100px]"
                                                />
                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(c.id)}
                                                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-lg transition-colors border border-amber-500/20"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-900/40 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-sm">
                                                {formatCommentContent(c.content)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {ticket.comments?.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-zinc-600 text-sm italic">No comments yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Metadata */}
                    <aside className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Properties</h3>

                            <dl className="space-y-4 text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-zinc-600 font-medium">Status</dt>
                                    <dd className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider ${getStatusStyles(ticket.status).split(' ')[0]}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {ticket.status}
                                        </span>
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-zinc-600 font-medium">Priority</dt>
                                    <dd className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority).split(' ')[0]}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {ticket.priority}
                                        </span>
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-zinc-600 font-medium">Reporter</dt>
                                    <dd className="col-span-2 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                                            {ticket.reporter_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-zinc-300">{ticket.reporter_name}</span>
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-zinc-600 font-medium">Assignee</dt>
                                    <dd className="col-span-2">
                                        {canReassign ? (
                                            <SearchableSelect
                                                placeholder="Assignee"
                                                options={[{ label: 'Unassigned', value: '' }, ...users.map(u => ({ label: u.name, value: u.id }))]}
                                                value={ticket.assignee_id || ''}
                                                onChange={handleAssigneeUpdate}
                                            />
                                        ) : (
                                            <span className="text-zinc-300">{ticket.assignee_name || 'Unassigned'}</span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Timeline</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-zinc-600">Created</dt>
                                    <dd className="text-zinc-400 font-mono text-xs">{new Date(ticket.created_at).toLocaleDateString()}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-zinc-600">Updated</dt>
                                    <dd className="text-zinc-400 font-mono text-xs">{new Date(ticket.updated_at).toLocaleDateString()}</dd>
                                </div>
                                {ticket.estimated_date && (
                                    <div className="flex justify-between">
                                        <dt className={`${isNearDeadline(ticket) ? 'text-red-500 font-bold' : 'text-zinc-600'}`}>Due Date</dt>
                                        <dd className={`text-xs font-mono font-bold ${isNearDeadline(ticket) ? 'text-red-500 animate-blink' : 'text-amber-500'}`}>
                                            {formatEstimatedDate(ticket.estimated_date)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
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
                title="Delete Ticket?"
                message="This action cannot be undone."
            />
        </div>
    );
}
