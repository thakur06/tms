import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
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
import {
  IoAnalyticsOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { formatTime } from "../utils/formatters";
import {

  IoStatsChartOutline,
  IoFolderOutline,
  IoCheckmarkCircle,
  IoArrowUp,
  IoArrowDown,
  IoClose,
  IoBusinessOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoConstructOutline,
  IoPeopleCircle,
  IoPeopleSharp,
  IoGameController,
} from "react-icons/io5";
import { RiBeerFill } from "react-icons/ri";
import { MdBusiness, MdMeetingRoom, MdModelTraining } from "react-icons/md";
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
  const [modalContent, setModalContent] = useState({
    title: "",
    data: [],
    type: "",
    detail: "",
  });

  const getWeekStartMiddleEnd = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { monday, sunday } = getWeekStartMiddleEnd();
        const startStr = monday.toISOString().split("T")[0];
        const endStr = sunday.toISOString().split("T")[0];
        const token = localStorage.getItem("token");

        const [teRes, projectsRes] = await Promise.all([
          axios.get(`${server}/api/time-entries/user/me`, {
            params: { start: startStr, end: endStr },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${server}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
    const totalMinutes = timeEntries.reduce(
      (sum, e) => sum + (e.hours * 60 + e.minutes),
      0,
    );
    const totalTimeStr = formatDuration(
      Math.floor(totalMinutes / 60),
      totalMinutes % 60,
    );

    // Categories & Aggregations
    const entriesByCat = {
      project: [],
      pto: [],
      training: [],
      rd: [],
      bd: [],
      tb: [],
      meetings:[],
      holidays:[],


    };

    const dailyMap = new Map();
    const locationMap = new Map();
    const projectMap = new Map(); // For top projects
    const clientMap = new Map(); // For top clients

    const projectCategoryMap = new Map();
    projectsList.forEach((p) => {
      projectCategoryMap.set(p.name, p.category?.toLowerCase() || "project");
      projectCategoryMap.set(p.code, p.category?.toLowerCase() || "project");
    });

    timeEntries.forEach((e) => {
      // Category Logic
      let cat = "project";
      const pName = e.project_name || e.project;
      if (projectCategoryMap.has(pName)) {
        cat = projectCategoryMap.get(pName);
      } else if (
        pName?.toLowerCase().includes("pto") ||
        e.task_id?.toLowerCase().includes("pto")
      ) {
        cat = "pto";
      } else if (pName?.toLowerCase().includes("training")) {
        cat = "training";
      } else if (pName?.toLowerCase().includes("r&d")) {
        cat = "r&d";
      }
      else if (pName?.toLowerCase().includes("bd")) {
        cat = "bd";
      }
      else if (pName?.toLowerCase().includes("Meetings")) {
        cat = "meetings";
      }
      else if (pName?.toLowerCase().includes("Public Holiday")) {
        cat = "public holiday";
      }
      else if (pName?.toLowerCase().includes("Team Building")) {
        cat = "team building";
      }
      if (cat === "pto") entriesByCat.pto.push(e);
      else if (cat === "training") entriesByCat.training.push(e);
      else if (cat === "r&d" || cat === "research") entriesByCat.rd.push(e);
      else if (cat === "bd") entriesByCat.bd.push(e);
      else if (cat === "meetings") entriesByCat.meetings.push(e);
      else if (cat === "public holiday") entriesByCat.holidays.push(e);
      else if (cat === "team building") entriesByCat.tb.push(e);
      else entriesByCat.project.push(e);

      // Duration
      const mins = e.hours * 60 + e.minutes;

      // Daily Chart Data
      const date = e.entry_date.split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + mins);

      // Location Data
      const loc = e.location || "Unknown";
      locationMap.set(loc, (locationMap.get(loc) || 0) + mins);

      // Top Projects
      const pKey = pName || "Unknown Project";
      const currentP = projectMap.get(pKey) || {
        name: pKey,
        minutes: 0,
        code: e.project_code || "N/A",
      };
      currentP.minutes += mins;
      projectMap.set(pKey, currentP);

      // Top Clients
      const client = e.client || "Internal";
      clientMap.set(client, (clientMap.get(client) || 0) + mins);
    });

    // Active Projects (Distinct count)
    const uniqueProjects = new Set(
      entriesByCat.project.map((e) => e.project_name || e.project),
    ).size;

    // Utilization (Week = 40h)
    const utilization = (totalMinutes / 60 / 40) * 100;

    // Tasks
    const uniqueTasks = new Set(timeEntries.map((e) => e.task_id)).size;

    // Charts Transformations
    const chartData = Array.from(dailyMap.entries())
      .map(([date, mins]) => ({
        date,
        hours: Number((mins / 60).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill missing days for the week? Optional, but good for UI.
    // For now, let's just use what we have.

    const locationData = Array.from(locationMap.entries()).map(
      ([name, mins]) => ({
        name,
        hours: Number((mins / 60).toFixed(1)),
      }),
    );

    const topProjects = Array.from(projectMap.values())
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        totalTime: formatDuration(Math.floor(p.minutes / 60), p.minutes % 60),
        progress: Math.min(100, (p.minutes / totalMinutes) * 100), // Share of total time
      }));

    const topClients = Array.from(clientMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mins]) => ({
        name,
        totalTime: formatDuration(Math.floor(mins / 60), mins % 60),
        percentage: Math.min(100, (mins / totalMinutes) * 100),
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
      recentEntries: timeEntries.slice(0, 10), // First 10 recent
    };
  }, [timeEntries, projectsList]);

  const colorMap = {
    indigo: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
      accent: "from-amber-400 to-amber-600",
      light: "bg-amber-500/5",
      glow: "shadow-amber-500/10"
    },
    blue: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-500",
      border: "border-yellow-500/20",
      accent: "from-yellow-400 to-yellow-600",
      light: "bg-yellow-500/5",
      glow: "shadow-yellow-500/10"
    },
    emerald: {
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      border: "border-orange-500/20",
      accent: "from-orange-400 to-orange-600",
      light: "bg-orange-500/5",
      glow: "shadow-orange-500/10"
    },
    rose: {
      bg: "bg-red-500/10",
      text: "text-red-500",
      border: "border-red-500/20",
      accent: "from-red-400 to-red-600",
      light: "bg-red-500/5",
      glow: "shadow-red-500/10"
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
      accent: "from-amber-400 to-amber-600",
      light: "bg-amber-500/5",
      glow: "shadow-amber-500/10"
    },
    violet: {
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      border: "border-orange-500/20",
      accent: "from-orange-400 to-orange-600",
      light: "bg-orange-500/5",
      glow: "shadow-orange-500/10"
    }
  };

  const cards = [
    {
      label: "Active Projects",
      value: analytics.activeProjectsCount,
      icon: IoFolderOutline,
      color: "indigo",
      trend: "2.5%",
      trendType: "up",
      hint: "Across all departments",
      data: analytics.entriesByCat.project,
      type: "projects",
      detail: "Worked on this week",
    },
    {
      label: "Tasks Worked",
      value: analytics.tasksCount,
      icon: IoCheckmarkCircle,
      color: "blue",
      trend: "14%",
      trendType: "up",
      hint: "High productivity today",
      data: timeEntries,
      type: "tasks",
      detail: "Tasks this week",
    },
    {
      label: "Total Time",
      value: analytics.totalTimeStr,
      icon: IoTimeOutline,
      color: "emerald",
      trend: "5.2h",
      trendType: "up",
      unit: "Logged",
      hint: "Approaching weekly goal",
      data: timeEntries,
      type: "time",
      detail: "Logged this week",
    },
    {
      label: "Leave / PTO",
      value: formatDuration(
        0,
        analytics.entriesByCat.pto.reduce(
          (s, e) => s + (e.hours * 60 + e.minutes),
          0,
        ),
      ),
      icon: RiBeerFill,
      color: "rose",
      trend: "0.0h",
      trendType: "neutral",
      hint: "Planned time off",
      data: analytics.entriesByCat.pto,
      type: "pto",
      detail: "Time off",
    },
    {
      label: "Training",
      value: formatDuration(
        0,
        analytics.entriesByCat.training.reduce(
          (s, e) => s + (e.hours * 60 + e.minutes),
          0,
        ),
      ),
      icon: MdModelTraining,
      color: "amber",
      hint: "Upskilling activities",
      data: analytics.entriesByCat.training,
      type: "training",
      detail: "Learning hours",
    },
    {
      label: "R&D",
      value: formatDuration(
        0,
        analytics.entriesByCat.rd.reduce(
          (s, e) => s + (e.hours * 60 + e.minutes),
          0,
        ),
      ),
      icon: GiBrain,
      color: "blue",
      hint: "Innovation & Research",
      data: analytics.entriesByCat.rd,
      type: "rd",
      detail: "Research time",
    },
    {
      label: "Business Dev",
      value: formatDuration(
        0,
        analytics.entriesByCat.bd.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: MdBusiness,
      color: "indigo",
      hint: "Strategic growth",
      type: "bd",
      data: analytics.entriesByCat.bd,
      detail: "Business Development",
    },
    {
      label: "Meetings",
      value: formatDuration(
        0,
        analytics.entriesByCat.meetings.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: MdMeetingRoom,
      color: "violet",
      hint: "Internal syncs",
      type: "meetings",
      data: analytics.entriesByCat.meetings,
      detail: "Daily Meetings",
    },
    {
      label: "Public Holiday",
      value: formatDuration(
        0,
        analytics.entriesByCat.holidays.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: IoGameController,
      color: "amber",
      hint: "National & public breaks",
      type: "holidays",
      data: analytics.entriesByCat.holidays,
      detail: "Holidays",
    },
    {
      label: "Team Building",
      value: formatDuration(
        0,
        analytics.entriesByCat.tb.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: IoPeopleSharp,
      color: "violet",
      hint: "Strategic collaboration",
      type: "teambuilding",
      data: analytics.entriesByCat.tb,
      detail: "Team Building",
    },
  ];

  const handleCardClick = (card) => {
    if (card.data && card.data.length > 0) {
      // Prepare display data (grouping projects etc)
      let displayData = card.data;
      const aggregateData = (items, keyField) => {
        const map = new Map();
        items.forEach((e) => {
          const key =
            keyField === "task_id"
              ? e.task_id || "Unknown"
              : e.project_name || e.project || e.task_id;
          if (!map.has(key)) {
            map.set(key, {
              name: key,
              code: e.project_code,
              hours: 0,
              mins: 0,
              count: 0,
            });
          }
          const p = map.get(key);
          p.hours += e.hours;
          p.mins += e.minutes;
          p.count += 1;
        });
        return Array.from(map.values())
          .map((p) => ({
            ...p,
            totalDisplay: formatDuration(p.hours, p.mins),
          }))
          .sort(
            (a, b) => b.hours * 60 + b.minutes - (a.hours * 60 + a.minutes),
          );
      };

      if (card.type === "projects") {
        displayData = aggregateData(card.data, "project_name");
      } else if (
        card.type === "tasks" ||
        ["pto", "training", "rd"].includes(card.type)
      ) {
        displayData = aggregateData(card.data, "task_id");
      }

      setModalContent({
        title: card.label,
        data: displayData,
        type: card.type,
        detail: card.detail,
      });
      setModalOpen(true);
    } else {
      toast.info("No data available");
    }
  };

  const renderModalContent = () => {
    if (
      ["projects", "pto", "training", "rd", "tasks"].includes(modalContent.type)
    ) {
      return (
        <div className="space-y-3">
          {modalContent.data.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all"
            >
              <div>
                <div className="font-bold text-gray-900">{item.name}</div>
                {item.code && (
                  <div className="text-xs text-gray-400 font-medium">{item.code}</div>
                )}
                {item.count && (
                  <div className="text-xs text-gray-400 font-medium">
                    {item.count} entries
                  </div>
                )}
              </div>
              <div className="text-[#161efd] font-mono font-black text-lg">
                {item.totalDisplay}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {modalContent.data.map((item, idx) => (
          <div key={idx} className="p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
            <div className="flex justify-between">
              <div className="font-bold text-gray-200">
                {item.project_name || item.project}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {new Date(item.entry_date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-amber-500 font-semibold mt-1">{item.task_id}</div>
            <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
              <div>{item.entry_date}</div>
              <div className="font-mono text-white font-bold">
                {item.hours}h {item.minutes}m
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10 p-3">

      <div className="relative overflow-hidden rounded-3xl p-8 border border-white/5 bg-zinc-900 shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-transparent to-orange-500/10" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-1">
            <nav className="flex items-center gap-2 text-xs font-black text-amber-500/60 uppercase tracking-widest mb-2">
              <span>Overview</span>
              <span className="opacity-30">/</span>
              <span className="text-white">Dashboard</span>
            </nav>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-500 shadow-lg shadow-amber-500/10">
                <IoAnalyticsOutline size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                  Activity Hub
                </h1>
                <p className="text-gray-400 mt-1.5 text-xs font-bold italic">Real-time workspace insights and productivity metrics.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/time-log" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 text-xs uppercase tracking-widest">
              <IoCalendarOutline size={18} />
              Time Log
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black transition-all border border-white/5 active:scale-95 text-xs uppercase tracking-widest"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {cards.map((card, idx) => {
          const colors = colorMap[card.color] || colorMap.indigo;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -4 }}
              className="bg-zinc-900 rounded-3xl p-6 cursor-pointer border border-white/5 hover:border-amber-500/20 transition-all group relative"
              onClick={() => handleCardClick(card)}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`${colors.text} p-2 rounded-xl bg-zinc-800 transition-colors`}>
                    <card.icon size={22} />
                  </div>
                  <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    {card.label}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-3xl font-black text-white tracking-tighter">
                    {card.value}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold italic truncate">
                    {card.detail}
                  </p>
                </div>

                <div className={`absolute bottom-6 right-6 w-1 h-1 rounded-full ${colors.text.replace('text-', 'bg-')} opacity-40 shadow-[0_0_8px_currentColor]`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- Charts Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ui-card p-6 bg-zinc-900 border-white/5 hover:border-amber-500/20 transition-all shadow-sm"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <IoStatsChartOutline />
            </div>
            Daily Activity
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) =>
                      new Date(str).toLocaleDateString(undefined, {
                        weekday: "short",
                      })
                    }
                  />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      color: "#f4f4f5",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                      border: "1px solid #27272a"
                    }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#18181b" }}
                    activeDot={{ r: 7, fill: "#fbbf24", stroke: "#18181b", strokeWidth: 2 }}
                    fill="url(#colorHours)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <IoStatsChartOutline size={48} className="mb-2 opacity-20" />
                <p>No activity data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Location Split Chart */}
        <div className="ui-card p-6 bg-zinc-900 border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <IoLocationOutline className="text-amber-500" />
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
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][
                            index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      color: "#1e293b",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      border: "1px solid #e2e8f0"
                    }}
                    itemStyle={{ color: "#1e293b" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500">No location data available</div>
            )}
          </div>
        </div>
      </div>

      {/* --- Projects & Clients Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects List */}
        <div className="ui-card p-0 overflow-hidden bg-zinc-900 border-white/5">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IoFolderOutline className="text-amber-500" />
              Top Projects
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {analytics.topProjects.length > 0 ? (
              analytics.topProjects.map((project, i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs ring-1 ring-amber-500/20">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-200">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.code}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-amber-500 font-bold">
                      {project.totalTime}
                    </div>
                    <div className="text-xs text-gray-600">
                      {project.progress.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No project activity this week
              </div>
            )}
          </div>
        </div>

        {/* Top Clients List */}
        <div className="ui-card p-0 overflow-hidden bg-zinc-900 border-white/5">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IoPeopleOutline className="text-rose-500" />
              Top Clients
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {analytics.topClients.length > 0 ? (
              analytics.topClients.map((client, i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-xs ring-1 ring-rose-500/20">
                      {client.name.charAt(0)}
                    </div>
                    <div className="font-medium text-gray-200">{client.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-rose-500 font-bold">
                      {client.totalTime}
                    </div>
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${client.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No client details available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Recent Activity Table --- */}
      <div className="ui-card p-0 overflow-hidden bg-zinc-900 border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <IoConstructOutline className="text-cyan-500" />
            Recent Activity
          </h3>
          <Link
            to="/time-log"
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase font-bold text-gray-500">
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
                analytics.recentEntries.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/5 transition-all group"
                  >
                    <td className="px-6 py-4 text-gray-200 font-semibold">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-200 group-hover:text-amber-500 transition-colors font-medium">
                        {entry.project_name || entry.project}
                      </div>
                      <div className="text-xs text-gray-500">{entry.client}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-800 text-gray-400 text-xs border border-white/10 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all font-bold">
                        {entry.task_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-amber-500 font-black">
                      {entry.hours}h {entry.minutes}m
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-500 flex justify-end gap-1.5 items-center text-xs font-bold uppercase tracking-wider">
                        <IoCheckmarkCircle className="group-hover:scale-110 transition-transform" /> Logged
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No recent activity
                  </td>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {modalContent.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium">
                    {modalContent.detail}
                  </p>
                </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <IoClose size={24} />
                  </button>
              </div>
              <div className="p-6">{renderModalContent()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
