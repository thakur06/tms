import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { IoArrowBack, IoSearch, IoFilter, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import ComplianceTable from '../components/ComplianceTable';
import MultiSelect from '../components/MultiSelect';
import { toast } from 'react-toastify';

export default function ComplianceReportPage() {
    const server = import.meta.env.VITE_SERVER_ADDRESS;
    const { user } = useAuth();
    const navigate = useNavigate();

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7; // Last Monday
        const d = new Date(today);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepts, setSelectedDepts] = useState([]);
    const [allDepts, setAllDepts] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Calculate week days
    const weekDays = useMemo(() => {
        const days = [];
        const start = new Date(currentWeekStart);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentWeekStart]);

    const normalizeDateStr = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        fetchComplianceReport();
        if (user?.role === 'admin') {
            fetchDepartments();
        }
    }, [currentWeekStart]);

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('token');
            // Correct endpoint is /api/dept usually, or verify specific endpoint
            const res = await axios.get(`${server}/api/dept`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Assuming /api/dept returns array of objects with name or just strings? 
            // depts likely returns { dept_id, dept_name }
            const depts = Array.isArray(res.data) ? res.data.map(d => d.dept_name || d.name || d) : [];
            setAllDepts(['All', ...depts]);
        } catch (e) { console.error("Failed to fetch depts", e); }
    };

    const fetchComplianceReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const startDate = normalizeDateStr(weekDays[0]);
            const endDate = normalizeDateStr(weekDays[6]);

            const response = await axios.get(`${server}/api/timesheets/compliance`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { startDate, endDate }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to fetch compliance report:', error);
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const [statusFilter, setStatusFilter] = useState("All");

    // Filter Data
    const filteredData = useMemo(() => {
        const filtered = reportData.filter(item => {
            const name = item.user?.name || "";
            const dept = item.user?.dept || "";

            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = selectedDepts.length === 0 || selectedDepts.includes(dept);

            let matchesStatus = true;
            if (statusFilter !== 'All') {
                matchesStatus = item.status === statusFilter;
            }

            return matchesSearch && matchesDept && matchesStatus;
        });
        // Reset to page 1 when filters change
        return filtered;
    }, [reportData, searchTerm, selectedDepts, statusFilter]);

    // Handle page reset
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDepts, statusFilter]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Navigate functions
    const handlePrevWeek = () => {
        setCurrentWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return d;
        });
    };

    const handleNextWeek = () => {
        setCurrentWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return d;
        });
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <IoArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-500">
                            Compliance Report
                        </h1>
                        <p className="text-gray-500 font-bold text-sm">
                            {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {' - '}
                            {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Week Nav */}
                    <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1">
                        <button onClick={handlePrevWeek} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-gray-400 font-bold transition-colors">Prev</button>
                        <button onClick={() => setCurrentWeekStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)))} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-amber-500 font-bold transition-colors">Current</button>
                        <button onClick={handleNextWeek} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-gray-400 font-bold transition-colors">Next</button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 group">
                    <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-11 pr-4 text-[13px] font-bold text-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all placeholder-gray-500 shadow-sm"
                    />
                </div>

                {user?.role === 'admin' && (
                    <MultiSelect
                        label="Dept"
                        options={allDepts}
                        selectedValues={selectedDepts}
                        onChange={setSelectedDepts}
                        icon={IoFilter}
                        className="md:w-64"
                        showLabel={false}
                    />
                )}

                {/* Status Filter */}
                <div className="relative w-full md:w-48">
                    <IoFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-[13px] font-bold text-white focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                    >
                        <option value="All" className="bg-zinc-900">All Status</option>
                        <option value="pending" className="bg-zinc-900">Pending Approval</option>
                        <option value="not_submitted" className="bg-zinc-900">Not Submitted</option>
                        <option value="approved" className="bg-zinc-900">Approved</option>
                        <option value="rejected" className="bg-zinc-900">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <ComplianceTable
                            data={paginatedData}
                            weekDays={weekDays}
                            onAction={(action, item) => {
                                if (action === 'view' && item.timesheetId) {
                                    navigate(`/approvals/review/${item.timesheetId}`);
                                } else if (action === 'view') {
                                    toast.info("No submitted timesheet for this period");
                                }
                            }}
                            enableActions={false}
                        />
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-bold">
                            Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-white">{filteredData.length}</span> members
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-all overflow-hidden"
                            >
                                <IoChevronBack size={16} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1
                                                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                                : "text-gray-500 hover:text-white hover:bg-white/5"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-all overflow-hidden"
                            >
                                <IoChevronForward size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
