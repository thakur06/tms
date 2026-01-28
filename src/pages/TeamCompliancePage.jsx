import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { IoArrowBack, IoSearch, IoFilter, IoDownloadOutline, IoTime, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import ComplianceTable from '../components/ComplianceTable';
import { toast } from 'react-toastify';

export default function TeamCompliancePage() {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date State: Default to Previous Week's Monday
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
  const [statusFilter, setStatusFilter] = useState("All");

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
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchTeamCompliance();
  }, [currentWeekStart]);

  const fetchTeamCompliance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const startDate = normalizeDateStr(weekDays[0]);
      const endDate = normalizeDateStr(weekDays[6]);
      
      const response = await axios.get(`${server}/api/timesheets/compliance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate, scope: 'team' }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch team compliance:', error);
      toast.error('Failed to load team report');
    } finally {
      setLoading(false);
    }
  };

  // Filter Data
  const filteredData = useMemo(() => {
      return reportData.filter(item => {
          const name = item.user?.name || "";
          
          const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
          
          let matchesStatus = true;
          if (statusFilter === 'submitted') matchesStatus = item.status === 'pending';
          else if (statusFilter === 'draft') matchesStatus = item.status === 'draft';
          else if (statusFilter === 'not_submitted') matchesStatus = item.status === 'not_submitted';
          else if (statusFilter !== 'All') matchesStatus = item.status === statusFilter;

          return matchesSearch && matchesStatus;
      });
  }, [reportData, searchTerm, statusFilter]);

  const navigateWeek = (dir) => {
      setCurrentWeekStart(prev => {
          const d = new Date(prev);
          d.setDate(prev.getDate() + (dir * 7));
          return d;
      });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => navigate('/approvals')}
                    className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                 >
                    <IoArrowBack size={20} />
                 </button>
                 <div>
                     <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        <span>Approvals</span>
                        <span className="opacity-30">/</span>
                        <span className="text-amber-500">Team Compliance</span>
                     </nav>
                     <h1 className="text-3xl font-black tracking-tight text-white">
                        My Team's Hours
                     </h1>
                     <p className="text-gray-500 font-bold text-sm">
                        Tracking submissions for your direct reports
                     </p>
                 </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                 <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1 shadow-inner">
                     <button onClick={() => navigateWeek(-1)} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-gray-400 hover:text-white font-bold transition-colors">Prev</button>
                     <button onClick={() => setCurrentWeekStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1 - 7)))} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-amber-500 font-bold transition-colors whitespace-nowrap">
                        {weekDays[0].toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {weekDays[6].toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                     </button>
                     <button onClick={() => navigateWeek(1)} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-sm text-gray-400 hover:text-white font-bold transition-colors">Next</button>
                 </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="relative flex-1">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search team members..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
            </div>
            
            <div className="relative w-full md:w-56">
                <IoFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer font-bold"
                >
                    <option value="All" className="bg-zinc-900">All Submissions</option>
                    <option value="submitted" className="bg-zinc-900">Pending Approval</option>
                    <option value="draft" className="bg-zinc-900">Draft / In Progress</option>
                    <option value="not_submitted" className="bg-zinc-900">Not Submitted (0 hrs)</option>
                    <option value="approved" className="bg-zinc-900">Approved</option>
                    <option value="rejected" className="bg-zinc-900">Rejected</option>
                </select>
            </div>
            
            <button
                onClick={fetchTeamCompliance}
                className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                title="Refresh"
            >
                <IoTime size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        {/* Tables */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
            {loading ? (
                 <div className="flex items-center justify-center h-[400px]">
                     <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                 </div>
            ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 space-y-2">
                    <p className="font-bold">No records found for this period.</p>
                    <p className="text-xs italic">Try adjusting your filters or navigating to a different week.</p>
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
