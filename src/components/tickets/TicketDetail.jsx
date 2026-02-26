import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    IoCloseOutline, IoSendOutline, IoPersonCircleOutline,
    IoTimeOutline, IoCalendarOutline, IoPencilOutline, IoTrashOutline,
    IoCheckmarkOutline
} from 'react-icons/io5';
import { addComment, deleteTicket, updateComment, deleteComment } from '../../api/tickets';
import { getAllUsers } from '../../api/users';
import { toast } from 'react-toastify';
import ConfirmModal from '../ConfirmModal';

export default function TicketDetail({ ticket, onClose, onUpdate, onEdit }) {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState(ticket.comments || []);
    const [users, setUsers] = useState([]);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => { }, title: '', message: '' });
    const inputRef = useRef(null);

    useEffect(() => {
        loadUsers();
        // Update local comments if ticket prop changes (e.g. re-fetch)
        if (ticket.comments) setComments(ticket.comments);
    }, [ticket]);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.users || data);
        } catch (err) {
            console.error("Failed to load users for mentions");
        }
    };

    const handleDelete = async () => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Ticket",
            message: "Are you sure you want to delete this ticket? This action is permanent.",
            onConfirm: async () => {
                try {
                    await deleteTicket(ticket.id);
                    toast.success("Ticket deleted");
                    onClose();
                    onUpdate();
                } catch (error) {
                    toast.error("Failed to delete ticket");
                }
            }
        });
    };

    const handleCommentChange = (e) => {
        const val = e.target.value;
        setComment(val);

        // Simple mention detection: check if last word starts with @
        const lastWord = val.split(' ').pop();
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            setMentionQuery(lastWord.slice(1));
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (userName) => {
        const words = comment.split(' ');
        words.pop(); // Remove the partial mention
        const newComment = words.join(' ') + ` @${userName} `;
        setComment(newComment);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const submitComment = async (e) => {
        if (e) e.preventDefault();
        if (!comment.trim()) return;

        try {
            const newComment = await addComment(ticket.id, { content: comment });
            setComments([...comments, newComment]);
            setComment('');
            toast.success("Comment added");
            // Scroll to bottom
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const handleEditComment = async (commentId) => {
        if (!editValue.trim()) return;
        try {
            const updated = await updateComment(ticket.id, commentId, { content: editValue });
            setComments(comments.map(c => c.id === commentId ? updated : c));
            setEditingCommentId(null);
            setEditValue('');
            toast.success("Comment updated");
        } catch (error) {
            toast.error("Failed to update comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Comment",
            message: "Are you sure you want to delete this comment?",
            onConfirm: async () => {
                try {
                    await deleteComment(ticket.id, commentId);
                    setComments(comments.filter(c => c.id !== commentId));
                    toast.success("Comment deleted");
                } catch (error) {
                    toast.error("Failed to delete comment");
                }
            }
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (showMentions) return; // Let mention selection handle enter
            e.preventDefault();
            submitComment();
        }
    };

    // Filter users for mentions
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);

    const renderContent = (content) => {
        if (!content) return null;

        // Regex for URLs
        const urlPattern = /(https?:\/\/[^\s]+)/g;

        // Regex for Mentions - dynamically built from users list
        // Sort users by name length descending to match longest possible names first
        const sortedUsers = [...users].sort((a, b) => b.name.length - a.name.length);
        const userNames = sortedUsers.map(u => u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

        let parts = [content];

        // Split by URLs first
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return part;
            const matches = [...part.matchAll(urlPattern)];
            if (matches.length === 0) return part;

            let result = [];
            let lastIndex = 0;
            matches.forEach(match => {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index));
                }
                result.push(<a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer" className="text-(--primary) hover:underline">{match[0]}</a>);
                lastIndex = match.index + match[0].length;
            });
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex));
            }
            return result;
        });

        // Then split by mentions for each string part
        if (userNames) {
            const mentionPattern = new RegExp(`(@(?:${userNames}))`, 'g');
            parts = parts.flatMap(part => {
                if (typeof part !== 'string') return part;

                const matches = [...part.matchAll(mentionPattern)];
                if (matches.length === 0) return part;

                let result = [];
                let lastIndex = 0;
                matches.forEach(match => {
                    if (match.index > lastIndex) {
                        result.push(part.substring(lastIndex, match.index));
                    }
                    result.push(<span key={match.index} className="text-(--primary) font-bold">{match[0]}</span>);
                    lastIndex = match.index + match[0].length;
                });
                if (lastIndex < part.length) {
                    result.push(part.substring(lastIndex));
                }
                return result;
            });
        }

        return parts;
    };

    return (
        <>
            {/* Backdrop with Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-all"
            />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 sm:top-0 right-0 bottom-0 w-full md:w-[600px] bg-(--app-bg) border-l border-(--glass-border) shadow-2xl z-50 flex flex-col pt-16 sm:pt-20"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-(--glass-border) bg-(--glass-surface) backdrop-blur-md">
                    <h2 className="text-xl font-black text-(--text-main) truncate pr-4">
                        #{ticket.id} - {ticket.title}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-500/10 rounded-full text-(--text-muted) hover:text-red-500 transition-colors"
                            title="Delete Ticket"
                        >
                            <IoTrashOutline size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-(--hover-bg) rounded-full text-(--text-muted) hover:text-(--text-main) transition-colors"
                        >
                            <IoCloseOutline size={22} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 space-y-8">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-(--glass-surface) p-4 rounded-xl border border-(--glass-border)">
                        <div>
                            <div className="text-[10px] uppercase font-black text-(--text-muted) mb-1">Status</div>
                            <div className="text-sm font-bold text-(--text-main)">{ticket.status}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black text-(--text-muted) mb-1">Priority</div>
                            <div className="text-sm font-bold text-(--text-main)">{ticket.priority}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black text-(--text-muted) mb-1">Assignee</div>
                            <div className="flex items-center gap-2 text-sm text-(--text-main)">
                                <IoPersonCircleOutline size={16} />
                                {ticket.assignee_name || 'Unassigned'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black text-(--text-muted) mb-1">Project</div>
                            <div className="text-sm font-bold text-(--text-main) truncate" title={ticket.project_name}>
                                {ticket.project_name || 'None'}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-black text-(--text-muted) uppercase tracking-wider mb-2">Description</h3>
                        <div className="prose prose-sm max-w-none text-(--text-main) whitespace-pre-wrap">
                            {ticket.description || 'No description provided.'}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h3 className="text-sm font-black text-(--text-muted) uppercase tracking-wider mb-4 flex items-center gap-2">
                            Comments <span className="bg-(--hover-bg) text-(--text-main) px-1.5 rounded textxs">{comments.length}</span>
                        </h3>

                        <div className="space-y-4 mb-6">
                            {comments.length === 0 ? (
                                <p className="text-(--text-muted) text-sm italic">No comments yet. Be the first!</p>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-(--primary-glow) text-(--primary) flex items-center justify-center font-bold text-xs shrink-0 border border-(--primary-glow)">
                                            {c.user_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-(--text-main)">{c.user_name || 'Unknown'}</span>
                                                <span className="text-[10px] text-(--text-muted)">
                                                    {new Date(c.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-(--text-main) bg-(--hover-bg) p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-(--glass-border) group-comment relative group">
                                                {editingCommentId === c.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <textarea
                                                            autoFocus
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-(--primary)"
                                                            rows={2}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setEditingCommentId(null)}
                                                                className="text-[10px] font-black uppercase text-gray-500 hover:text-white"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditComment(c.id)}
                                                                className="text-[10px] font-black uppercase text-(--primary) hover:opacity-80"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="pr-12">
                                                            {renderContent(c.content)}
                                                        </div>
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingCommentId(c.id); setEditValue(c.content); }}
                                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-(--primary) transition-colors"
                                                                title="Edit"
                                                            >
                                                                <IoPencilOutline size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <IoTrashOutline size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Comment Input */}
                <div className="p-4 bg-zinc-900 border-t border-white/10 relative">
                    {showMentions && filteredUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-4 mb-2 w-64 bg-zinc-800 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-20"
                        >
                            {filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => insertMention(u.name)}
                                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm flex items-center gap-2"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                                        {u.name.charAt(0)}
                                    </div>
                                    {u.name}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    <form onSubmit={submitComment} className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            className="ui-input flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-(--primary) transition-all"
                            placeholder="Type a comment... (use @ to mention)"
                            value={comment}
                            onChange={handleCommentChange}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            type="submit"
                            className="p-3 bg-(--primary) text-(--text-inverse) rounded-xl transition-colors shadow-lg shadow-(--primary-glow)"
                            disabled={!comment.trim()}
                        >
                            <IoSendOutline size={20} />
                        </button>
                    </form>
                </div>
                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                    onConfirm={confirmConfig.onConfirm}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                />
            </motion.div>
        </>
    );
}
