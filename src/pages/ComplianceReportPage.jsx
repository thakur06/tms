import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { IoArrowBack, IoSearch, IoFilter, IoDownloadOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import ComplianceTable from '../components/ComplianceTable';
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
    d.setHours(0,0,0,0);
    return d;
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [allDepts, setAllDepts] = useState(["All"]);

  // Calculate week days
  const weekDays = useMemo(() => {
      const days = [];
      const start = new Date(currentWeekStart);
      for(let i=0; i<7; i++) {
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
    if(user?.role === 'admin') {
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
      return reportData.filter(item => {
          // Fix: Access nested user object
          const name = item.user?.name || ""; 
          const dept = item.user?.dept || "";
          
          const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesDept = selectedDept === "All" || dept === selectedDept;
          
          let matchesStatus = true;
          if (statusFilter !== 'All') {
              matchesStatus = item.status === statusFilter;
          }

          return matchesSearch && matchesDept && matchesStatus;
      });
  }, [reportData, searchTerm, selectedDept, statusFilter]);

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
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
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
        <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="relative flex-1">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
            </div>
            
            {user?.role === 'admin' && (
                <div className="relative w-full md:w-64">
                    <IoFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-white focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                    >
                        {allDepts.map(dept => (
                            <option key={dept} value={dept} className="bg-zinc-900">{dept}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Status Filter */}
            <div className="relative w-full md:w-48">
                <IoFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-white focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
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
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
            {loading ? (
                 <div className="flex items-center justify-center h-[400px]">
                     <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                 </div>
            ) : (
                <ComplianceTable 
                    data={filteredData} 
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
    </div>
  );
}
