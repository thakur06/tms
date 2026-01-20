import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { GiBrain } from "react-icons/gi"
import { MdModelTraining } from "react-icons/md";
import { RiBeerFill } from "react-icons/ri";
import { IoEyeOutline, IoClose } from "react-icons/io5";
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
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoAnalyticsOutline,
  IoStatsChartOutline,
  IoBusinessOutline,
  IoFolderOutline,
  IoCheckmarkCircle,
  IoArrowUp,
  IoArrowDown,
  IoLocationOutline,
  IoPeopleOutline,
  IoConstructOutline,
  IoLayersOutline
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// --- DUMMY DATA ---
const DUMMY_PROJECTS = [
  { id: 1, name: "Apollo Redesign", code: "APO-22", location: "Remote", status: "Active", team: 5, progress: 75 },
  { id: 2, name: "Mobile App API", code: "MOB-09", location: "On-site", status: "Active", team: 3, progress: 90 },
  { id: 3, name: "Internal R&D", code: "IRD-01", location: "Hybrid", status: "Planning", team: 8, progress: 30 },
  { id: 4, name: "E-Commerce Launch", code: "ECOM-24", location: "Office", status: "Active", team: 12, progress: 60 },
];

const DUMMY_ENTRIES = [
  { id: 101, entry_date: new Date().toISOString(), project_name: "Apollo Redesign", project_code: "APO-22", task_id: "UI Design", client: "Stark Tech", hours: 4, minutes: 30, location: "Remote", user: "John Doe" },
  { id: 102, entry_date: new Date().toISOString(), project_name: "Mobile App API", project_code: "MOB-09", task_id: "Bug Fix", client: "Nova Corp", hours: 2, minutes: 15, location: "On-site", user: "Jane Smith" },
  { id: 103, entry_date: new Date(Date.now() - 86400000).toISOString(), project_name: "Internal R&D", project_code: "IRD-01", task_id: "Research", client: "Internal", hours: 6, minutes: 0, location: "Hybrid", user: "Alex Johnson" },
  { id: 104, entry_date: new Date(Date.now() - 172800000).toISOString(), project_name: "Apollo Redesign", project_code: "APO-22", task_id: "Coding", client: "Stark Tech", hours: 5, minutes: 30, location: "Remote", user: "John Doe" },
  { id: 105, entry_date: new Date(Date.now() - 259200000).toISOString(), project_name: "E-Commerce", project_code: "ECOM-24", task_id: "QA", client: "Retailify", hours: 3, minutes: 45, location: "Office", user: "Sarah Wilson" },
];

const DUMMY_TRAININGS = [
  { id: 1, name: "React Advanced", category: "Frontend", duration: "8h", status: "Completed", users: 15 },
  { id: 2, name: "Node.js Security", category: "Backend", duration: "6h", status: "In Progress", users: 8 },
  { id: 3, name: "UI/UX Principles", category: "Design", duration: "10h", status: "Pending", users: 12 },
];

const DUMMY_PTOS = [
  { id: 1, user: "John Doe", type: "Vacation", start_date: "2024-01-15", end_date: "2024-01-20", status: "Approved" },
  { id: 2, user: "Jane Smith", type: "Sick Leave", start_date: "2024-01-18", end_date: "2024-01-19", status: "Approved" },
  { id: 3, user: "Alex Johnson", type: "Personal", start_date: "2024-01-22", end_date: "2024-01-23", status: "Pending" },
];

const DUMMY_RESEARCH = [
  { id: 1, topic: "AI Integration", lead: "Dr. Chen", duration: "2 weeks", progress: 45 },
  { id: 2, topic: "Blockchain PoC", lead: "Mark Wilson", duration: "1 month", progress: 20 },
];

export const Analytics = () => {
     const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [ptos, setPtos] = useState([]);
  const [research, setResearch] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [modalContent, setModalContent] = useState({ title: "", data: [], type: "" });

  // Helper Functions
  const toDateKey = (d) => new Date(d).toISOString().slice(0, 10);
  const safeInt = (v) => Number.parseInt(v || 0, 10);
  const entryMinutes = (e) => safeInt(e?.hours) * 60 + safeInt(e?.minutes);
  const formatTime = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
         params: {
          limit: 1000,
        }
      });
      setUsers(response.data.users);
      console.log(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
    const loadData = async () => {
      setLoading(true);
      setTimeout(() => {
        setProjects(DUMMY_PROJECTS);
        setTimeEntries(DUMMY_ENTRIES);
        setTasks([{ id: 1 }, { id: 2 }, { id: 3 }]);
        setTrainings(DUMMY_TRAININGS);
        setPtos(DUMMY_PTOS);
        setResearch(DUMMY_RESEARCH);
        setLoading(false);
      }, 800);
    };
    loadData();
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d;
    });

    const dailyMinutesMap = new Map();
    const locationMap = new Map();
    let totalMins = 0;

    timeEntries.forEach(e => {
      const mins = entryMinutes(e);
      const key = toDateKey(e.entry_date);
      dailyMinutesMap.set(key, (dailyMinutesMap.get(key) || 0) + mins);
      
      const loc = e.location || "Unspecified";
      locationMap.set(loc, (locationMap.get(loc) || 0) + mins);
      totalMins += mins;
    });

    const dailySeries = days.map(d => ({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Number(((dailyMinutesMap.get(toDateKey(d)) || 0) / 60).toFixed(1))
    }));

    const locationSplit = [...locationMap.entries()].map(([name, mins]) => ({
      name,
      hours: Number((mins / 60).toFixed(1))
    }));

    return { dailySeries, locationSplit, totalMins, todayMins: dailyMinutesMap.get(todayKey) || 0 };
  }, [timeEntries]);

  // Card data configuration
  const cards = useMemo(() => [
    {
      label: "Active Projects",
      value: projects.length,
      icon: IoFolderOutline,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      type: "projects",
      data: projects,
      detail: `${projects.filter(p => p.status === "Active").length} Active • ${projects.filter(p => p.status === "Planning").length} Planning`
    },
    {
      label: "Tasks Catalog",
      value: tasks.length,
      icon: MdModelTraining,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      type: "tasks",
      data: tasks,
      detail: "Development & maintenance tasks"
    },
    {
      label: "Total Time",
      value: formatTime(analytics.todayMins),
      icon: IoTimeOutline,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      type: "todayTime",
      data: timeEntries.filter(entry => toDateKey(entry.entry_date) === toDateKey(new Date())),
      detail: `${timeEntries.filter(entry => toDateKey(entry.entry_date) === toDateKey(new Date())).length} entries today`
    },
    
    {
      label: "Utilization",
      value: `${(analytics.totalMins / 60).toFixed(1)}h`,
      icon: IoStatsChartOutline,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      type: "totalHours",
      data: timeEntries,
      detail: `${timeEntries.length} entries total`
    },

    {
      label: "PTO's",
      value: ptos.length,
      icon: RiBeerFill,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-gradient-to-br from-red-500/10 to-rose-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      type: "ptos",
      data: ptos,
      detail: `${ptos.filter(p => p.status === "Approved").length} Approved • ${ptos.filter(p => p.status === "Pending").length} Pending`
    },
    {
      label: "Trainings",
      value: trainings.length,
      icon: IoCheckmarkCircle,
      color: "from-green-500 to-lime-500",
      bgColor: "bg-gradient-to-br from-green-500/10 to-lime-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      type: "trainings",
      data: trainings,
      detail: `${trainings.filter(t => t.status === "Completed").length} Completed • ${trainings.filter(t => t.status === "In Progress").length} In Progress`
    },
    {
      label: "Research & Development",
      value: research.length,
      icon: GiBrain,
      color: "from-indigo-500 to-violet-500",
      bgColor: "bg-gradient-to-br from-indigo-500/10 to-violet-500/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      type: "research",
      data: research,
      detail: "Ongoing innovation projects"
    },
  ], [projects, analytics, tasks, trainings, ptos, research, timeEntries]);

  const handleCardClick = (card) => {
    setModalContent({
      title: card.label,
      data: card.data,
      type: card.type,
      detail: card.detail
    });
    setModalOpen(true);
  };

  const renderModalContent = () => {
    switch (modalContent.type) {
      case "projects":
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 mb-4">{modalContent.detail}</div>
            {modalContent.data.map((project) => (
              <div key={project.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{project.name}</h4>
                    <p className="text-sm text-slate-500">{project.code} • {project.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === "Active" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "todayTime":
      case "totalHours":
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 mb-4">{modalContent.detail}</div>
            {modalContent.data.map((entry) => (
              <div key={entry.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{entry.project_name}</h4>
                    <p className="text-sm text-slate-500">{entry.task_id} • {entry.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{entry.hours}h {entry.minutes}m</p>
                    <p className="text-xs text-slate-500">{new Date(entry.entry_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <IoLocationOutline size={14} />
                    {entry.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <IoPeopleOutline size={14} />
                    {entry.user}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case "trainings":
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 mb-4">{modalContent.detail}</div>
            {modalContent.data.map((training) => (
              <div key={training.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{training.name}</h4>
                    <p className="text-sm text-slate-500">{training.category} • {training.duration}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    training.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : training.status === "In Progress"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {training.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <IoPeopleOutline size={14} />
                    {training.users} participants
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case "ptos":
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 mb-4">{modalContent.detail}</div>
            {modalContent.data.map((pto) => (
              <div key={pto.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{pto.user}</h4>
                    <p className="text-sm text-slate-500">{pto.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    pto.status === "Approved"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {pto.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(pto.start_date).toLocaleDateString()} - {new Date(pto.end_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-slate-500">Detailed information will be available soon.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 min-h-screen transition-colors duration-300">
      <ToastContainer theme="colored" />
      
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm h-screen"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{modalContent.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{modalContent.detail}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <IoClose size={24} className="text-slate-500" />
                </button>
              </div>
              <div className="p-6">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            User Analytics
          </span>
          <span className="text-slate-600 dark:text-slate-400">/</span>
          <span>User Reports</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                User Analytics Dashboard
              </span>
            </h1>
            <p className="text-slate-400 mt-3 text-base max-w-2xl">
              Comprehensive overview of user activity, time tracking, and resource allocation across all projects.
            </p>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="p-6 bg-gradient-to-r from-white/5 to-white/10 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col gap-4 justify-evenly w-full">
            <div className="grid ">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  title="Start Date"
                />
                <input 
                  type="date" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  title="End Date"
                />
              </div>
            </div>
            
           

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Project</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option className="bg-slate-900">Select User</option>
                {users.map(user => (
                  <option key={user.id} className="bg-slate-900">{user.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-end">
            <button className="ui-btn ui-btn-primary w-full md:w-auto min-w-[200px]">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent dark:from-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${card.bgColor} backdrop-blur-sm`}>
                  <card.icon className={card.iconColor} size={24} />
                </div>
                <button
                  onClick={() => handleCardClick(card)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors group/eye"
                  title="View Details"
                >
                  <IoEyeOutline 
                    size={20} 
                    className="text-slate-400 group-hover/eye:text-indigo-400 transition-colors" 
                  />
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">
                  {card.label}
                </p>
                <h4 className="text-3xl font-black text-white">
                  {card.value}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {card.detail}
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Last 7 days</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <IoArrowUp size={14} />
                    +12%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
              <p className="text-sm text-slate-400">Hours tracked per day</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics.totalMins / 60 / 14}h</p>
              <p className="text-sm text-emerald-400 flex items-center gap-1">
                <IoArrowUp size={14} />
                Daily average
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="url(#colorUv)" 
                  strokeWidth={3}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="100%" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Work Location</h3>
              <p className="text-sm text-slate-400">Hours by location type</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics.locationSplit.length}</p>
              <p className="text-sm text-slate-400">Locations</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.locationSplit}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {analytics.locationSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#818cf8", "#34d399", "#fbbf24", "#f87171"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-sm">
        <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Hours: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">{payload[0].value}h</span>
        </p>
      </div>
    );
  }
  return null;
};