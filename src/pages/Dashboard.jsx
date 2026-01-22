import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatsCards from "../components/StatsCards";
import { useAuth } from "../context/AuthContext";
import { formatTime } from "../utils/formatters";
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoStatsChartOutline,
  IoFolderOutline,
  IoCheckmarkCircle,
  IoArrowUp,
  IoArrowDown,
  IoClose,
  IoBusinessOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoConstructOutline
} from "react-icons/io5";
import { RiBeerFill } from "react-icons/ri";
import { MdModelTraining } from "react-icons/md";
import { GiBrain, GiSuitcase } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Helper to format duration
const formatDuration = (hours, minutes) => {
  const h = hours + Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export default function Dashboard() {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", data: [], type: "", detail: "" });

  const getWeekStartMiddleEnd = () => {
     const now = new Date();
     const day = now.getDay();
     const diff = now.getDate() - day + (day === 0 ? -6 : 1);
     const monday = new Date(now.setDate(diff));
     monday.setHours(0,0,0,0);
     
     const sunday = new Date(monday);
     sunday.setDate(monday.getDate() + 6);
     sunday.setHours(23,59,59,999);
     
     return { monday, sunday };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { monday, sunday } = getWeekStartMiddleEnd();
        const startStr = monday.toISOString().split('T')[0];
        const endStr = sunday.toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        
        const [teRes, projectsRes] = await Promise.all([
          axios.get(`${server}/api/time-entries/user/me`, {
             params: { start: startStr, end: endStr },
             headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${server}/api/projects`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setTimeEntries(teRes.data || []);
        setProjectsList(projectsRes.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, server]);

  const analytics = useMemo(() => {
    // 1. Calculate Metrics for Time Entries (which are already filtered for current week)
    const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.hours * 60 + e.minutes), 0);
    const totalTimeStr = formatDuration(Math.floor(totalMinutes / 60), totalMinutes % 60);
    
    // Categories & Aggregations
    const entriesByCat = {
      project: [],
      pto: [],
      training: [],
      rd: [],
      bd:[]
    };
    
    const dailyMap = new Map();
    const locationMap = new Map();
    const projectMap = new Map(); // For top projects
    const clientMap = new Map();  // For top clients
    
    const projectCategoryMap = new Map();
    projectsList.forEach(p => {
       projectCategoryMap.set(p.name, p.category?.toLowerCase() || 'project');
       projectCategoryMap.set(p.code, p.category?.toLowerCase() || 'project');
    });

    timeEntries.forEach(e => {
       // Category Logic
       let cat = 'project';
       const pName = e.project_name || e.project; 
       if (projectCategoryMap.has(pName)) {
         cat = projectCategoryMap.get(pName);
       } else if (pName?.toLowerCase().includes('pto') || e.task_id?.toLowerCase().includes('pto')) {
         cat = 'pto';
       } else if (pName?.toLowerCase().includes('training')) {
          cat = 'training';
       } else if (pName?.toLowerCase().includes('r&d')) {
          cat = 'r&d';
       }
       
       if (cat === 'pto') entriesByCat.pto.push(e);
       else if (cat === 'training') entriesByCat.training.push(e);
       else if (cat === 'r&d' || cat === 'research') entriesByCat.rd.push(e);
       else if (cat === 'BD') entriesByCat.bd.push(e);
       else entriesByCat.project.push(e);

       // Duration
       const mins = e.hours * 60 + e.minutes;

       // Daily Chart Data
       const date = e.entry_date.split('T')[0];
       dailyMap.set(date, (dailyMap.get(date) || 0) + mins);

       // Location Data
       const loc = e.location || 'Unknown';
       locationMap.set(loc, (locationMap.get(loc) || 0) + mins);

       // Top Projects
       const pKey = pName || 'Unknown Project';
       const currentP = projectMap.get(pKey) || { name: pKey, minutes: 0, code: e.project_code || 'N/A' };
       currentP.minutes += mins;
       projectMap.set(pKey, currentP);

       // Top Clients
       const client = e.client || 'Internal';
       clientMap.set(client, (clientMap.get(client) || 0) + mins);
    });
    
    // Active Projects (Distinct count)
    const uniqueProjects = new Set(entriesByCat.project.map(e => e.project_name || e.project)).size;
    
    // Utilization (Week = 40h)
    const utilization = ((totalMinutes / 60) / 40) * 100;
    
    // Tasks
    const uniqueTasks = new Set(timeEntries.map(e => e.task_id)).size;

    // Charts Transformations
    const chartData = Array.from(dailyMap.entries()).map(([date, mins]) => ({
       date,
       hours: Number((mins / 60).toFixed(1))
    })).sort((a,b) => a.date.localeCompare(b.date));

    // Fill missing days for the week? Optional, but good for UI.
    // For now, let's just use what we have.

    const locationData = Array.from(locationMap.entries()).map(([name, mins]) => ({
       name,
       hours: Number((mins / 60).toFixed(1))
    }));

    const topProjects = Array.from(projectMap.values())
      .sort((a,b) => b.minutes - a.minutes)
      .slice(0, 5)
      .map(p => ({
         ...p,
         totalTime: formatDuration(Math.floor(p.minutes/60), p.minutes%60),
         progress: Math.min(100, (p.minutes / totalMinutes) * 100) // Share of total time
      }));

    const topClients = Array.from(clientMap.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mins]) => ({
         name,
         totalTime: formatDuration(Math.floor(mins/60), mins%60),
         percentage: Math.min(100, (mins / totalMinutes) * 100)
      }));
    
    return {
       totalTimeStr,
       totalMinutes,
       activeProjectsCount: uniqueProjects,
       utilization: utilization.toFixed(1),
       entriesByCat,
       tasksCount: uniqueTasks,
       chartData,
       locationData,
       topProjects,
       topClients,
       recentEntries: timeEntries.slice(0, 10) // First 10 recent
    };
  }, [timeEntries, projectsList]);

  const cards = [
    {
       label: "Active Projects",
       value: analytics.activeProjectsCount,
       icon: IoFolderOutline,
       color: "indigo",
       data: analytics.entriesByCat.project,
       type: "projects",
       detail: "Worked on this week"
    },
    {
       label: "Tasks Worked",
       value: analytics.tasksCount,
       icon: IoCheckmarkCircle,
       color: "cyan",
       data: timeEntries,
       type: "tasks",
       detail: "Tasks this week"
    },
    {
       label: "Total Time",
       value: analytics.totalTimeStr,
       icon: IoTimeOutline,
       color: "emerald",
       data: timeEntries,
       type: "time",
       detail: "Logged this week"
    },
    {
       label: "Utilization",
       value: `${analytics.utilization}%`,
       icon: IoStatsChartOutline,
       color: "amber",
       data: [],
       type: "utilization",
       detail: "Based on 40h week"
    },
    {
       label: "PTO",
       value: formatDuration(0, analytics.entriesByCat.pto.reduce((s,e)=>s + (e.hours*60+e.minutes), 0)),
       icon: RiBeerFill,
       color: "rose",
       data: analytics.entriesByCat.pto,
       type: "pto",
       detail: "Time off"
    },
    {
       label: "Training",
       value: formatDuration(0, analytics.entriesByCat.training.reduce((s,e)=>s + (e.hours*60+e.minutes), 0)),
       icon: MdModelTraining,
       color: "lime",
       data: analytics.entriesByCat.training,
       type: "training",
       detail: "Learning hours"
    },
    {
       label: "R&D",
       value: formatDuration(0, analytics.entriesByCat.rd.reduce((s,e)=>s + (e.hours*60+e.minutes), 0)),
       icon: GiBrain,
       color: "violet",
       data: analytics.entriesByCat.rd,
       type: "rd",
       detail: "Research time"
    },
    {
          label: "Buisness Development",
          value: formatDuration(0, analytics.entriesByCat.bd.reduce((s,e)=>s + e.hours*60+e.minutes, 0)),
          icon: GiSuitcase,
          color: "from-yellow-400 to-yellow-600",
          type: "BD",
          data: analytics.entriesByCat.bd,
          detail: "Buisness Development"
        }
  ];
  
  const handleCardClick = (card) => {
     if(card.data && card.data.length > 0) {
        
        // Prepare display data (grouping projects etc)
        let displayData = card.data;
        const aggregateData = (items, keyField) => {
             const map = new Map();
             items.forEach(e => {
                const key = keyField === 'task_id' ? (e.task_id || 'Unknown') : (e.project_name || e.project || e.task_id);
                if(!map.has(key)) {
                   map.set(key, {
                      name: key,
                      code: e.project_code,
                      hours: 0,
                      mins: 0,
                      count: 0
                   });
                }
                const p = map.get(key);
                p.hours += e.hours;
                p.mins += e.minutes;
                p.count += 1;
             });
             return Array.from(map.values()).map(p => ({
                ...p,
                totalDisplay: formatDuration(p.hours, p.mins)
             })).sort((a,b) => (b.hours*60+b.minutes) - (a.hours*60+a.minutes));
        };

        if (card.type === 'projects') {
            displayData = aggregateData(card.data, 'project_name');
        } else if (card.type === 'tasks' || ['pto', 'training', 'rd'].includes(card.type)) {
            displayData = aggregateData(card.data, 'task_id');
        }
        
        setModalContent({
           title: card.label,
           data: displayData,
           type: card.type,
           detail: card.detail
        });
        setModalOpen(true);
     } else {
        toast.info("No data available");
     }
  };

  const renderModalContent = () => {
    if (['projects', 'pto', 'training', 'rd', 'tasks'].includes(modalContent.type)) {
       return (
          <div className="space-y-3">
             {modalContent.data.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                   <div>
                      <div className="font-bold text-white">{item.name}</div>
                      {item.code && <div className="text-xs text-slate-500">{item.code}</div>}
                      {item.count && <div className="text-xs text-slate-500">{item.count} entries</div>}
                   </div>
                   <div className="text-indigo-400 font-mono font-bold">{item.totalDisplay}</div>
                </div>
             ))}
          </div>
       )
    }
    
    return (
       <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {modalContent.data.map((item, idx) => (
             <div key={idx} className="p-3 bg-slate-800 rounded-lg">
                <div className="flex justify-between">
                   <div className="font-semibold text-white">{item.project_name || item.project}</div>
                   <div className="text-sm text-slate-400">{new Date(item.entry_date).toLocaleDateString()}</div>
                </div>
                <div className="text-sm text-indigo-300">{item.task_id}</div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                   <div>{item.entry_date}</div>
                   <div className="font-mono text-white">{item.hours}h {item.minutes}m</div>
                </div>
             </div>
          ))}
       </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 border border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <IoBusinessOutline className="text-indigo-400" size={24} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                My Dashboard
              </h1>
            </div>
            <p className="text-slate-400 max-w-2xl text-lg">
               Overview for Current Week
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/time-log" className="ui-btn ui-btn-primary">
              <IoCalendarOutline size={18} />
              Time Log
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {cards.map((card, idx) => (
            <motion.div
               key={idx}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="ui-card p-6 cursor-pointer hover:border-indigo-500/50 transition-colors"
               onClick={() => handleCardClick(card)}
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-${card.color}-500/10 text-${card.color}-400`}>
                     <card.icon size={24} />
                  </div>
               </div>
               <div>
                  <div className="text-slate-400 text-sm font-medium">{card.label}</div>
                  <div className="text-2xl font-bold text-white mt-1">{card.value}</div>
                  <div className="text-xs text-slate-500 mt-2">{card.detail}</div>
               </div>
            </motion.div>
         ))}
      </div>

      {/* --- Charts Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <div className="ui-card p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <IoStatsChartOutline className="text-indigo-400" />
            Daily Activity
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={analytics.chartData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis 
                     dataKey="date" 
                     stroke="#94a3b8" 
                     fontSize={12}
                     tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {weekday:'short'})}
                   />
                   <YAxis stroke="#94a3b8" fontSize={12} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{ r: 6 }} />
                 </LineChart>
               </ResponsiveContainer>
            ) : (
               <div className="text-slate-500 flex flex-col items-center">
                  <IoStatsChartOutline size={48} className="mb-2 opacity-20" />
                  <p>No activity data available</p>
               </div>
            )}
          </div>
        </div>

        {/* Location Split Chart */}
        <div className="ui-card p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <IoLocationOutline className="text-emerald-400" />
            Work Location
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.locationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="hours"
                  >
                    {analytics.locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="text-slate-500">No location data available</div>
            )}
          </div>
        </div>
      </div>

      {/* --- Projects & Clients Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects List */}
        <div className="ui-card p-0 overflow-hidden bg-slate-900 border-slate-800">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IoFolderOutline className="text-amber-400" />
              Top Projects
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {analytics.topProjects.length > 0 ? (
               analytics.topProjects.map((project, i) => (
                  <div key={i} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white">{project.name}</div>
                        <div className="text-xs text-slate-500">{project.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-indigo-400 font-bold">{project.totalTime}</div>
                      <div className="text-xs text-slate-500">{project.progress.toFixed(0)}%</div>
                    </div>
                  </div>
               ))
            ) : (
               <div className="p-8 text-center text-slate-500">No project activity this week</div>
            )}
          </div>
        </div>

        {/* Top Clients List */}
        <div className="ui-card p-0 overflow-hidden bg-slate-900 border-slate-800">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IoPeopleOutline className="text-rose-400" />
              Top Clients
            </h3>
          </div>
          <div className="divide-y divide-white/5">
             {analytics.topClients.length > 0 ? (
                analytics.topClients.map((client, i) => (
                  <div key={i} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold text-xs">
                        {client.name.charAt(0)}
                      </div>
                      <div className="font-medium text-white">{client.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-indigo-400 font-bold">{client.totalTime}</div>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div 
                           className="h-full bg-rose-500 rounded-full" 
                           style={{ width: `${client.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
             ) : (
                <div className="p-8 text-center text-slate-500">No client details available</div>
             )}
          </div>
        </div>
      </div>

      {/* --- Recent Activity Table --- */}
      <div className="ui-card p-0 overflow-hidden bg-slate-900 border-slate-800">
         <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IoConstructOutline className="text-cyan-400" />
              Recent Activity
            </h3>
            <Link to="/time-log" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">View All</Link>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
               <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-300">
                  <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Project</th>
                     <th className="px-6 py-4">Task</th>
                     <th className="px-6 py-4 text-right">Duration</th>
                     <th className="px-6 py-4 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {analytics.recentEntries.length > 0 ? (
                     analytics.recentEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                           <td className="px-6 py-4 text-white font-medium">
                              {new Date(entry.entry_date).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-white">{entry.project_name || entry.project}</div>
                              <div className="text-xs opacity-50">{entry.client}</div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-white/10">
                                 {entry.task_id}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-indigo-400 font-bold">
                              {entry.hours}h {entry.minutes}m
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className="text-emerald-400 flex justify-end gap-1 items-center text-xs font-bold uppercase">
                                 <IoCheckmarkCircle /> Logged
                              </span>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">No recent activity</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Modal */}
      <AnimatePresence>
        {/* ... (Previous Modal Code) ... */}
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-white">{modalContent.title}</h3>
                    <p className="text-sm text-slate-400">{modalContent.detail}</p>
                 </div>
                 <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                    <IoClose size={24} />
                 </button>
              </div>
              <div className="p-6">
                 {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
