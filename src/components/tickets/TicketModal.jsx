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
        assignee_id: '',
        estimated_date: ''
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
                assignee_id: ticket.assignee_id || '',
                estimated_date: ticket.estimated_date ? new Date(ticket.estimated_date).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'Task',
                priority: 'Medium',
                status: 'Open',
                project_id: '',
                assignee_id: '',
                estimated_date: ''
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
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-(--app-bg) border border-(--glass-border) rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Compact */}
                        <div className="bg-(--glass-surface) border-(--glass-border) p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-(--primary-glow) border border-(--primary-glow) flex items-center justify-center text-(--primary) shadow-inner">
                                    <IoInformationCircleOutline size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-(--text-main) leading-tight">
                                        {ticket ? 'Edit Ticket' : 'New Ticket'}
                                    </h2>
                                    <p className="text-[9px] font-bold text-(--text-muted) uppercase tracking-widest leading-none">
                                        {ticket ? `#${ticket.id}` : 'Create a new issue'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--hover-bg) text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg) transition-all border border-(--glass-border)"
                            >
                                <IoCloseOutline size={18} />
                            </button>
                        </div>

                        {/* Body - Optimized Spacing */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-(--text-muted) uppercase tracking-widest px-0.5">Title</label>
                                <input
                                    type="text"
                                    className="ui-input py-2 text-xs bg-(--app-bg) border-(--glass-border) focus:border-(--primary)"
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
                                <label className="text-[9px] font-black text-(--text-muted) uppercase tracking-widest px-0.5">Est. Completion Date</label>
                                <input
                                    type="date"
                                    className="ui-input py-2 text-xs h-20 bg-(--input-bg) border-(--input-border) focus:border-(--primary)"
                                    value={formData.estimated_date}
                                    onChange={e => setFormData({ ...formData, estimated_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-(--text-muted) uppercase tracking-widest px-0.5">Description</label>
                                <textarea
                                    className="ui-input min-h-[80px] resize-y py-2 text-xs bg-(--input-bg) border border-(--input-border) focus:border-(--primary)"
                                    placeholder="Detailed description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-(--glass-border)">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-8 px-4 text-[9px] font-black uppercase tracking-wider text-(--text-muted) hover:text-(--text-main) bg-(--hover-bg) hover:bg-(--hover-bg) rounded-lg border border-(--glass-border) transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-8 px-4 text-[9px] font-black uppercase tracking-wider bg-(--primary) text-(--text-inverse) rounded-lg shadow-lg shadow-(--primary-glow) flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
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
