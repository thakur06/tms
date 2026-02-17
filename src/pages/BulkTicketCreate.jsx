import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoAdd, IoTrash, IoSave, IoTicketOutline, IoWarning, IoCheckmarkCircle, IoInformationCircle
} from 'react-icons/io5';
import { getAllProjects } from '../api/projects';
import { getAllUsers } from '../api/users'; // Assuming this exists or using a similar one
import { createBulkTickets } from '../api/tickets';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';

const PRIORITY_OPTIONS = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
];
const STATUS_OPTIONS = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Closed', value: 'Closed' }
];

export default function BulkTicketCreate() {
    console.log("BulkTicketCreate Mounted");
    const navigate = useNavigate();
    const [rows, setRows] = useState([
        { id: Date.now(), project_id: '', title: '', priority: 'Medium', status: 'Open', estimated_hours: '', assignee_id: '', description: '' }
    ]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, usersData] = await Promise.all([
                    getAllProjects(),
                    getAllUsers()
                ]);

                const projectOpts = projectsData
                    .filter(p => p.status !== 'Inactive')
                    .map(p => ({ label: p.name, value: p.id, subLabel: p.code }));

                const userList = Array.isArray(usersData) ? usersData : usersData.users || [];
                const userOpts = userList.map(u => ({ label: u.name, value: u.id, subLabel: u.email }));

                setProjects(projectOpts);
                setUsers(userOpts);
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load projects/users");
            }
        };
        fetchData();
    }, []);

    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { id: Date.now() + Math.random(), project_id: '', title: '', priority: 'Medium', status: 'Open', estimated_hours: '', assignee_id: '', description: '' }
        ]);
    };

    const handleDeleteRow = (id) => {
        if (rows.length === 1) {
            toast.warn("At least one row works best!");
            return;
        }
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleChange = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        // Validation
        const validRows = rows.filter(r => r.title.trim() && r.project_id);
        if (validRows.length === 0) {
            toast.warn("Please enter at least a Project and Task Name for one row.");
            return;
        }

        if (validRows.length !== rows.filter(r => r.title.trim() || r.project_id).length) {
            toast.warn("Some rows have incomplete data (missing Project or Title). They will be skipped.");
        }

        setLoading(true);
        try {
            // Transform data for API
            const ticketsToCreate = validRows.map(r => ({
                title: r.title,
                description: r.description, // Remarks mapped to description
                priority: r.priority,
                status: r.status,
                project_id: r.project_id,
                assignee_id: r.assignee_id || null,
                estimated_hours: parseFloat(r.estimated_hours) || 0
            }));

            await createBulkTickets(ticketsToCreate);
            toast.success(`Successfully created ${ticketsToCreate.length} tickets!`);
            navigate('/tickets');
        } catch (error) {
            toast.error("Failed to create tickets. Please check your data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                        <span>Workspace</span>
                        <span className="opacity-30">/</span>
                        <span className="text-amber-500">Tickets</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                            <IoTicketOutline size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                                Bulk Ticket Entry
                            </h1>
                            <p className="text-gray-500 font-bold text-xs md:text-sm mt-1">
                                Quickly add multiple tasks to your projects using the grid below.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-amber-500 hover:bg-amber-500/5 transition-all group font-black uppercase tracking-widest text-xs"
                    >
                        <IoAdd className="group-hover:scale-110 transition-transform" />
                        <span>Add Row</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${loading
                            ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20 active:scale-95'}`}
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <IoSave size={16} />
                                <span>Save All Tickets</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid Container */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-white/5">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12 text-center">#</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[200px]">Project <span className="text-red-500">*</span></th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[220px]">Task Name <span className="text-red-500">*</span></th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-36">Priority</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-36">Status</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-24">Est. Hrs</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[180px]">Reviewer</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[200px]">Remarks (Desc)</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence initial={false}>
                                {rows.map((row, index) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="group bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="p-3 text-center text-xs font-mono text-gray-600">
                                            {index + 1}
                                        </td>
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={projects}
                                                value={row.project_id}
                                                onChange={(val) => handleChange(row.id, 'project_id', val)}
                                                placeholder="Select Project"
                                                showLabel={false}
                                                className="min-w-0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.title}
                                                onChange={(e) => handleChange(row.id, 'title', e.target.value)}
                                                placeholder="Enter task name..."
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-gray-700 font-medium transition-all"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={PRIORITY_OPTIONS}
                                                value={row.priority}
                                                onChange={(val) => handleChange(row.id, 'priority', val)}
                                                showLabel={false}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={STATUS_OPTIONS}
                                                value={row.status}
                                                onChange={(val) => handleChange(row.id, 'status', val)}
                                                showLabel={false}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={row.estimated_hours}
                                                onChange={(e) => handleChange(row.id, 'estimated_hours', e.target.value)}
                                                placeholder="0.0"
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-2 py-2.5 text-xs font-mono text-center text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={users}
                                                value={row.assignee_id}
                                                onChange={(val) => handleChange(row.id, 'assignee_id', val)}
                                                placeholder="Select Reviewer"
                                                showLabel={false}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.description}
                                                onChange={(e) => handleChange(row.id, 'description', e.target.value)}
                                                placeholder="Add remarks..."
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-400 focus:text-white focus:outline-none transition-all placeholder:italic"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => handleDeleteRow(row.id)}
                                                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Row"
                                            >
                                                <IoTrash size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs leading-relaxed max-w-3xl mx-auto">
                <IoInformationCircle size={20} className="shrink-0 mt-0.5" />
                <p>
                    <strong>Tip:</strong> You can add multiple tasks quickly here.
                    Set "Reviewer" to assign the task to someone immediately.
                    "Estimated Hours" helps in tracking progress against plans.
                    Status defaults to "Open".
                </p>
            </div>
        </div>
    );
}
