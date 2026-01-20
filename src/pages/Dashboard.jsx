import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
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
  IoAnalyticsOutline,
  IoStatsChartOutline,
  IoBusinessOutline,
  IoFolderOutline,
  IoCheckmarkCircle,
  IoArrowUp,
  IoArrowDown
} from "react-icons/io5";
import { motion } from "framer-motion";

export default function Dashboard() {
  const server=import.meta.env.VITE_SERVER_ADDRESS
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");


  const toDateKey = (d) => {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  };

  const getWeekStartMonday = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(diff);
    return monday;
  };

  const safeInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const entryMinutes = (e) => safeInt(e?.hours) * 60 + safeInt(e?.minutes);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadingError("");
      try {
        const [tasksRes, projectsRes, teRes] = await Promise.all([
          fetch(`${server}/api/tasks`),
          fetch(`${server}/api/projects`),
          fetch(`${server}/api/time-entries/user/me`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}` 
            },
          })
        ]);

        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
        if (!projectsRes.ok) throw new Error("Failed to fetch projects");

        setTasks(await tasksRes.json());
        setProjects(await projectsRes.json());

        if (teRes.ok) {
          setTimeEntries(await teRes.json());
        } else {
          console.warn("Failed to fetch time entries:", teRes.status);
          setTimeEntries([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoadingError("Failed to load dashboard analytics. Please check server connection.");
        toast.error("Failed to load data from server", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const analytics = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const monday = getWeekStartMonday(now);
    const mondayKey = toDateKey(monday);

    // Last 14 days trend
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const minutesByDay = new Map(days.map((d) => [toDateKey(d), 0]));
    const recentCutoff = new Date(now);
    recentCutoff.setDate(recentCutoff.getDate() - 29);
    recentCutoff.setHours(0, 0, 0, 0);

    let weekMinutes = 0;
    let todayMinutes = 0;
    let totalMinutesAll = 0;

    const projectAgg = new Map();
    const clientAgg = new Map();
    const locationAgg = new Map();

    for (const e of timeEntries) {
      const dateKey = toDateKey(e.entry_date);
      const mins = entryMinutes(e);
      totalMinutesAll += mins;

      if (dateKey === todayKey) todayMinutes += mins;
      if (dateKey >= mondayKey) weekMinutes += mins;

      if (minutesByDay.has(dateKey)) {
        minutesByDay.set(dateKey, minutesByDay.get(dateKey) + mins);
      }

      const eDate = new Date(dateKey);
      if (eDate >= recentCutoff) {
        const pKey = `${e.project_code || ""}::${e.project_name || ""}`;
        if (!projectAgg.has(pKey)) {
          projectAgg.set(pKey, {
            project: e.project_name || "Unassigned",
            project_code: e.project_code || "—",
            minutes: 0,
          });
        }
        projectAgg.get(pKey).minutes += mins;

        const client = e.client || "Unassigned";
        clientAgg.set(client, (clientAgg.get(client) || 0) + mins);

        const loc = e.location || "Unspecified";
        locationAgg.set(loc, (locationAgg.get(loc) || 0) + mins);
      }
    }

    const dailySeries = days.map((d) => {
      const key = toDateKey(d);
      const mins = minutesByDay.get(key) || 0;
      return {
        date: key.slice(5),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: mins,
        hours: Number((mins / 60).toFixed(2)),
      };
    });

    const avgDailyMinutes =
      dailySeries.reduce((s, x) => s + x.minutes, 0) / (dailySeries.length || 1);

    const utilizationPct = Math.round((weekMinutes / (40 * 60)) * 100) || 0;
    const activeProjects30d = [...projectAgg.values()].filter((p) => p.minutes > 0).length;

    const topProjects = [...projectAgg.values()]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8)
      .map((p) => ({
        name: p.project_code !== "—" ? p.project_code : p.project,
        minutes: p.minutes,
        hours: Number((p.minutes / 60).toFixed(2)),
      }));

    const topClients = [...clientAgg.entries()]
      .map(([name, minutes]) => ({ 
        name, 
        minutes, 
        hours: Number((minutes / 60).toFixed(2)) 
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);

    const locationSplit = [...locationAgg.entries()]
      .map(([name, minutes]) => ({ 
        name, 
        minutes, 
        hours: Number((minutes / 60).toFixed(2)) 
      }))
      .sort((a, b) => b.minutes - a.minutes);

    const recentEntries = [...timeEntries]
      .sort((a, b) => String(b.entry_date).localeCompare(String(a.entry_date)))
      .slice(0, 8);

    // Calculate trend (last week vs current week)
    const lastWeekStart = new Date(monday);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekKey = toDateKey(lastWeekStart);
    let lastWeekMinutes = 0;
    for (const e of timeEntries) {
      const dateKey = toDateKey(e.entry_date);
      const entryDate = new Date(dateKey);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      if (entryDate >= lastWeekStart && entryDate <= lastWeekEnd) {
        lastWeekMinutes += entryMinutes(e);
      }
    }

    const weekTrend = lastWeekMinutes > 0 
      ? Math.round(((weekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
      : 0;

    return {
      todayMinutes,
      weekMinutes,
      totalMinutesAll,
      avgDailyMinutes,
      utilizationPct,
      activeProjects30d,
      dailySeries,
      topProjects,
      topClients,
      locationSplit,
      recentEntries,
      weekTrend,
    };
  }, [timeEntries]);

  const cards = useMemo(() => {
    return [
      {
        icon: IoFolderOutline,
        label: "Active Projects",
        value: analytics.activeProjects30d,
        hint: `Total: ${projects.length}`,
        color: "indigo",
        trend: analytics.activeProjects30d > 0,
      },
      {
        icon: IoAnalyticsOutline,
        label: "Tasks Catalog",
        value: tasks.length,
        hint: "Available work items",
        color: "cyan",
      },
      {
        icon: IoTimeOutline,
        label: "This Week",
        value: formatTime(analytics.weekMinutes),
        hint: analytics.weekTrend !== 0 ? (
          <span className={`flex items-center gap-1 ${analytics.weekTrend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {analytics.weekTrend > 0 ? <IoArrowUp size={12} /> : <IoArrowDown size={12} />}
            {Math.abs(analytics.weekTrend)}% from last week
          </span>
        ) : "vs last week",
        color: "emerald",
        trend: analytics.weekMinutes > 0,
      },
      {
        icon: IoStatsChartOutline,
        label: "Utilization",
        value: `${analytics.utilizationPct}%`,
        hint: "vs 40h/week target",
        color: analytics.utilizationPct >= 85 ? "emerald" : analytics.utilizationPct >= 70 ? "amber" : "rose",
        trend: analytics.utilizationPct >= 85,
      },
    ];
  }, [analytics, projects.length, tasks.length]);

  const CHART_COLORS = {
    primary: "#818cf8", // Indigo-400
    secondary: "#c084fc", // Purple-400
    success: "#34d399", // Emerald-400
    warning: "#fbbf24", // Amber-400
    danger: "#f87171", // Rose-400
    info: "#22d3ee", // Cyan-400
    indigo: "#818cf8",
    purple: "#c084fc",
  };

  const PIE_COLORS = [
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] p-3 rounded-xl shadow-xl border border-white/10 backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-bold text-white">
              {entry.name}: <span style={{ color: entry.color || CHART_COLORS.primary }}>{entry.value}h</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-3xl w-full mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-3xl h-40"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 rounded-3xl h-80"></div>
          <div className="bg-white/5 rounded-3xl h-80"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 border border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <IoAnalyticsOutline className="text-indigo-400" size={24} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-slate-400 max-w-2xl text-lg">
              Real-time insights into your projects, time tracking, and productivity metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/time-log"
              className="ui-btn ui-btn-primary"
            >
              <IoCalendarOutline size={18} />
              Time Log
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="ui-btn ui-btn-secondary"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsCards cards={cards} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Hours Chart */}
        <div className="lg:col-span-2 ui-card">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title">Daily Logged Hours</h3>
              <p className="text-sm text-slate-400 mt-1">
                Last 14 days • Avg: <span className="text-white font-mono">{formatTime(Math.round(analytics.avgDailyMinutes))}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
              <span className="text-sm font-semibold text-indigo-300">Hours</span>
            </div>
          </div>
          <div className="ui-card-body h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f172a', stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Distribution */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title">Work by Location</h3>
              <p className="text-sm text-slate-400 mt-1">Last 30 days distribution</p>
            </div>
          </div>
          <div className="ui-card-body h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.locationSplit}
                  dataKey="hours"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  stroke="none"
                >
                  {analytics.locationSplit.map((_, idx) => (
                    <Cell 
                      key={idx} 
                      fill={PIE_COLORS[idx % PIE_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects & Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Projects */}
        <div className="lg:col-span-2 ui-card flex flex-col">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title">Top Projects</h3>
              <p className="text-sm text-slate-400 mt-1">By hours logged in last 30 days</p>
            </div>
            <div className="ui-chip neutral">
              {analytics.topProjects.length} projects
            </div>
          </div>
          <div className="ui-card-body flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {analytics.topProjects.length === 0 ? (
                <div className="col-span-2 text-center py-10">
                  <IoFolderOutline className="mx-auto text-slate-600 mb-3" size={48} />
                  <p className="text-slate-500">No recent project activity</p>
                </div>
              ) : (
                analytics.topProjects.map((project, index) => {
                  const maxMinutes = Math.max(...analytics.topProjects.map(p => p.minutes));
                  const relativePercentage = Math.round((project.minutes / maxMinutes) * 100);
                  const totalPercentage = Math.round((project.minutes / analytics.totalMinutesAll) * 100);
                  
                  return (
                    <div key={project.name} className="group flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-lg transition-all group-hover:scale-110 ${
                            index % 2 === 0 
                              ? 'bg-linear-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20' 
                              : 'bg-linear-to-br from-purple-500 to-purple-600 shadow-purple-500/20'
                          }`}>
                            {project.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {project.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                              {totalPercentage}% contribution
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{project.hours}h</div>
                          <div className="text-[10px] text-slate-500 font-mono">Logged</div>
                        </div>
                      </div>
                      
                      <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${relativePercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                          className={`absolute top-0 left-0 h-full rounded-full ${
                             index % 2 === 0 ? 'bg-indigo-500' : 'bg-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title">Top Clients</h3>
              <p className="text-sm text-slate-400 mt-1">Hours distribution by client</p>
            </div>
          </div>
          <div className="ui-card-body">
            <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {analytics.topClients.length === 0 ? (
                <div className="text-center py-10">
                  <IoBusinessOutline className="mx-auto text-slate-600" size={48} />
                  <p className="text-slate-500 mt-3">No client data available</p>
                </div>
              ) : (
                analytics.topClients.map((client, index) => {
                  const percentage = Math.round((client.minutes / analytics.totalMinutesAll) * 100);
                  return (
                    <div 
                      key={client.name} 
                      className="group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                              {client.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {percentage}% of total time
                          </p>
                        </div>
                        <span className="text-sm font-bold text-white bg-white/5 px-2 py-1 rounded-lg">
                          {client.hours}h
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <h3 className="ui-card-title">Recent Activity</h3>
            <p className="text-sm text-slate-400 mt-1">Latest time entries and updates</p>
          </div>
          <Link
            to="/time-log"
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View all
            <IoArrowUp className="rotate-90" size={14} />
          </Link>
        </div>

        {analytics.recentEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <IoTimeOutline className="text-slate-500" size={24} />
            </div>
            <h4 className="text-lg font-semibold text-slate-300 mb-2">
              No recent activity
            </h4>
            <Link
              to="/time-log"
              className="ui-btn ui-btn-primary mt-4"
            >
              Start Tracking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-widest pl-6">Date</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Project</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Task</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Client</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.recentEntries.map((entry, index) => (
                  <tr 
                    key={entry.id || index} 
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-300">
                        {toDateKey(entry.entry_date)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {entry.project_name || "—"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {entry.project_code}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-400">
                        {entry.task_id}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        entry.client 
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                          : 'bg-slate-700/20 text-slate-500 border-slate-700/30'
                      }`}>
                        {entry.client || "Unassigned"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="text-slate-600" size={16} />
                        <span className="font-bold text-white">
                          {formatTime(entryMinutes(entry))}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer/Summary */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-emerald-900/20 border border-emerald-500/20">
         <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-bold text-white mb-2">
              Ready to optimize your workflow?
            </h4>
            <p className="text-emerald-200/70">
              Track more time to unlock advanced analytics and insights
            </p>
          </div>
          <Link
            to="/time-log"
            className="ui-btn bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none"
          >
            <IoCheckmarkCircle size={18} />
            Start Tracking
          </Link>
        </div>
      </div>
    </div>
  );
}