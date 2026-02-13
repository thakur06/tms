import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    IoCloseOutline, IoSendOutline, IoPersonCircleOutline,
    IoTimeOutline, IoCalendarOutline, IoPencilOutline
} from 'react-icons/io5';
import { addComment } from '../../api/tickets';
import { getAllUsers } from '../../api/users';
import { toast } from 'react-toastify';

export default function TicketDetail({ ticket, onClose, onUpdate, onEdit }) {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState(ticket.comments || []);
    const [users, setUsers] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(-1);
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
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const newComment = await addComment(ticket.id, { content: comment });
            setComments([...comments, newComment]);
            setComment('');
            toast.success("Comment added");
            // Optionally notify parent to refresh if needed, but managing local state is faster
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    // Filter users for mentions
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-900 border-l border-white/10 shadow-2xl z-100 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <h2 className="text-xl font-black text-white truncate pr-4">
                    #{ticket.id} - {ticket.title}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(ticket)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-amber-500 transition-colors"
                        title="Edit Ticket"
                    >
                        <IoPencilOutline size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Status</div>
                        <div className="text-sm font-bold text-white">{ticket.status}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Priority</div>
                        <div className="text-sm font-bold text-white">{ticket.priority}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Assignee</div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <IoPersonCircleOutline size={16} />
                            {ticket.assignee_name || 'Unassigned'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Project</div>
                        <div className="text-sm font-bold text-white truncate" title={ticket.project_name}>
                            {ticket.project_name || 'None'}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                        {ticket.description || 'No description provided.'}
                    </div>
                </div>

                {/* Comments Section */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        Comments <span className="bg-white/10 text-white px-1.5 rounded textxs">{comments.length}</span>
                    </h3>

                    <div className="space-y-4 mb-6">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/30">
                                        {c.user_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{c.user_name || 'Unknown'}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(c.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 bg-white/5 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-white/5">
                                            {/* Highlight mentions */}
                                            {c.content.split(' ').map((word, i) =>
                                                word.startsWith('@') ? (
                                                    <span key={i} className="text-amber-500 font-bold">{word} </span>
                                                ) : word + ' '
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
                        className="ui-input"
                        placeholder="Type a comment... (use @ to mention)"
                        value={comment}
                        onChange={handleCommentChange}
                    />
                    <button
                        type="submit"
                        className="p-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                        disabled={!comment.trim()}
                    >
                        <IoSendOutline size={20} />
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
