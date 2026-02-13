import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoSaveOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { createTicket, updateTicket } from '../../api/tickets';
import SearchableSelect from '../SearchableSelect';
import { toast } from 'react-toastify';

export default function TicketModal({ isOpen, onClose, onSuccess, projects, users, ticket }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Task',
        priority: 'Medium',
        status: 'Open',
        project_id: '',
        assignee_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (ticket) {
            setFormData({
                title: ticket.title,
                description: ticket.description || '',
                type: ticket.type,
                priority: ticket.priority,
                status: ticket.status,
                project_id: ticket.project_id || '',
                assignee_id: ticket.assignee_id || ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'Task',
                priority: 'Medium',
                status: 'Open',
                project_id: '',
                assignee_id: ''
            });
        }
        return () => setMounted(false);
    }, [ticket, isOpen]);

    if (!mounted) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (ticket) {
                await updateTicket(ticket.id, formData);
                toast.success("Ticket updated");
            } else {
                await createTicket(formData);
                toast.success("Ticket created");
            }
            onSuccess();
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Compact */}
                        <div className="bg-linear-to-r from-zinc-900 via-amber-900/5 to-zinc-900 border-b border-white/5 p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                    <IoInformationCircleOutline size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white leading-tight">
                                        {ticket ? 'Edit Ticket' : 'New Ticket'}
                                    </h2>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                                        {ticket ? `#${ticket.id}` : 'Create a new issue'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                <IoCloseOutline size={18} />
                            </button>
                        </div>

                        {/* Body - Optimized Spacing */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Title</label>
                                <input
                                    type="text"
                                    className="ui-input py-2 text-xs bg-zinc-900/50 border-white/5 focus:border-amber-500/50"
                                    placeholder="Brief summary..."
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SearchableSelect
                                    label="Project"
                                    placeholder="Select Project"
                                    options={projects.map(p => ({ label: p.name, value: p.id }))}
                                    value={formData.project_id}
                                    onChange={(value) => setFormData({ ...formData, project_id: value })}
                                    required
                                />
                                <SearchableSelect
                                    label="Type"
                                    options={[
                                        { label: 'Task', value: 'Task' },
                                        { label: 'Bug', value: 'Bug' },
                                        { label: 'Feature', value: 'Feature' },
                                        { label: 'Support', value: 'Support' }
                                    ]}
                                    value={formData.type}
                                    onChange={(value) => setFormData({ ...formData, type: value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SearchableSelect
                                    label="Priority"
                                    options={[
                                        { label: 'Low', value: 'Low' },
                                        { label: 'Medium', value: 'Medium' },
                                        { label: 'High', value: 'High' },
                                        { label: 'Critical', value: 'Critical' }
                                    ]}
                                    value={formData.priority}
                                    onChange={(value) => setFormData({ ...formData, priority: value })}
                                />
                                <SearchableSelect
                                    label="Status"
                                    options={[
                                        { label: 'Created', value: 'Open' },
                                        { label: 'In Progress', value: 'In Progress' },
                                        { label: 'Under Review', value: 'Under Review' },
                                        { label: 'Closed', value: 'Done' }
                                    ]}
                                    value={formData.status}
                                    onChange={(value) => setFormData({ ...formData, status: value })}
                                />
                            </div>

                            <SearchableSelect
                                label="Assignee"
                                placeholder="Unassigned"
                                options={[
                                    { label: 'Unassigned', value: '' },
                                    ...users.map(u => ({ label: u.name, value: u.id }))
                                ]}
                                value={formData.assignee_id}
                                onChange={(value) => setFormData({ ...formData, assignee_id: value })}
                            />

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Description</label>
                                <textarea
                                    className="ui-input min-h-[80px] resize-y py-2 text-xs bg-zinc-900/50 border-white/5 focus:border-amber-500/50"
                                    placeholder="Detailed description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-8 px-4 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-8 px-4 text-[9px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
