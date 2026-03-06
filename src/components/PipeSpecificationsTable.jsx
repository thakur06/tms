import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoLayersOutline, IoSearchOutline, IoRefreshOutline, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function PipeSpecificationsTable() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const server = import.meta.env.VITE_SERVER_ADDRESS;
    const token = localStorage.getItem('token');

    const fetchSpecs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${server}/api/pipe-specifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                toast.error("Failed to fetch pipe specifications");
            }
        } catch (error) {
            console.error("Error fetching pipe specs:", error);
            toast.error("Error loading pipe specifications");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecs();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredData = data.filter(item =>
        item.size_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.class_label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-(--primary) border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-(--glass-surface) p-4 rounded-2xl border border-(--glass-border)">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-(--primary-glow) rounded-xl border border-(--primary-glow) text-(--primary)">
                        <IoLayersOutline size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-(--text-main) leading-none">Pipe Specifications</h2>
                        <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mt-1">Standard Reference Data</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                        <input
                            type="text"
                            placeholder="Search specs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-(--input-bg) border border-(--glass-border) rounded-xl text-xs font-bold text-(--text-main) focus:border-(--primary) outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={fetchSpecs}
                        className="p-2 bg-(--hover-bg) text-(--text-muted) hover:text-(--text-main) rounded-xl border border-(--glass-border) transition-all active:scale-95"
                        title="Refresh Data"
                    >
                        <IoRefreshOutline size={20} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-(--glass-border) bg-(--glass-surface) shadow-sm custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-(--hover-bg) border-b border-(--glass-border)">
                            <th className="p-4 text-left text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Items</th>
                            <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Size</th>
                            <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Size in Decimal</th>
                            <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Pipe / Flange OD</th>
                            <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Class</th>
                            <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest border-r-0">Value / Length</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--glass-border) text-[11px] font-bold text-(--text-main)">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-(--text-muted) italic">No specifications found.</td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <motion.tr 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index % pageSize) * 0.01 }}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4 text-left font-black uppercase text-(--primary) tracking-tight">{item.items}</td>
                                    <td className="p-4 text-center font-mono">{item.size_label}</td>
                                    <td className="p-4 text-center font-mono text-(--text-muted)">{Number(item.size_decimal).toFixed(3)}</td>
                                    <td className="p-4 text-center font-mono text-emerald-500">{Number(item.pipe_flange_od).toFixed(3)}</td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black border border-white/5 uppercase">
                                            {item.class_label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono text-(--amber)">{Number(item.value_length).toFixed(3)}</td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-(--glass-border) bg-(--glass-surface)">
                    <div className="text-[10px] font-black uppercase tracking-widest text-(--text-muted)">
                        Showing <span className="text-(--text-main)">{startIndex + 1}</span> to <span className="text-(--text-main)">{Math.min(startIndex + pageSize, filteredData.length)}</span> of <span className="text-(--text-main)">{filteredData.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-xl border border-(--glass-border) bg-(--hover-bg) text-(--text-muted) hover:text-(--text-main) disabled:opacity-30 transition-all active:scale-95"
                        >
                            <IoChevronBackOutline size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                            currentPage === pageNum 
                                                ? 'bg-(--primary) text-white shadow-lg shadow-(--primary-glow)' 
                                                : 'bg-(--hover-bg) text-(--text-muted) hover:text-(--text-main) border border-(--glass-border)'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-xl border border-(--glass-border) bg-(--hover-bg) text-(--text-muted) hover:text-(--text-main) disabled:opacity-30 transition-all active:scale-95"
                        >
                            <IoChevronForwardOutline size={16} />
                        </button>
                    </div>
                </div>
            )}
            
            <p className="text-[10px] text-(--text-muted) font-medium italic text-right px-2">
                * All dimensions in inches unless specified.
            </p>
        </div>
    );
}
