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

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const apiBase = "http://localhost:4000/api";

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
          fetch(`${apiBase}/tasks`),
          fetch(`${apiBase}/projects`),
          fetch(`${apiBase}/time-entries/user/me`, {
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
    primary: "#6366f1",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    indigo: "#4f46e5",
    purple: "#7c3aed",
  };

  const PIE_COLORS = [
    // CHART_COLORS.primary,
    // CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-bold text-slate-800">
              {entry.name}: <span className="text-indigo-600">{entry.value}h</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="h-8 bg-slate-200 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <IoAnalyticsOutline className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    Analytics Dashboard
                  </h1>
                </div>
              </div>
              <p className="text-slate-600 max-w-2xl">
                Real-time insights into your projects, time tracking, and productivity metrics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/time-log"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:shadow-xl active:scale-[0.98]"
              >
                <IoCalendarOutline size={18} />
                Time Log
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 active:scale-[0.98]"
              disabled>
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
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Daily Logged Hours
                </h3>
                <p className="text-sm text-slate-500">
                  Last 14 days • Avg: {formatTime(Math.round(analytics.avgDailyMinutes))}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-semibold text-indigo-700">Hours</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: CHART_COLORS.primary }}
                    activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Location Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Work by Location
              </h3>
              <p className="text-sm text-slate-500">
                Last 30 days distribution
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.locationSplit}
                    dataKey="hours"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {analytics.locationSplit.map((_, idx) => (
                      <Cell 
                        key={idx} 
                        fill={PIE_COLORS[idx % PIE_COLORS.length]} 
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}h`, "Hours"]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Projects & Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Projects */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Top Projects
                </h3>
                <p className="text-sm text-slate-500">
                  By hours logged in last 30 days
                </p>
              </div>
              <div className="text-sm text-slate-500 font-semibold">
                {analytics.topProjects.length} projects
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProjects}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}h`, "Hours"]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill={CHART_COLORS.success}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Top Clients
              </h3>
              <p className="text-sm text-slate-500">
                Hours distribution by client
              </p>
            </div>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              {analytics.topClients.length === 0 ? (
                <div className="text-center py-8">
                  <IoBusinessOutline className="mx-auto text-slate-300" size={48} />
                  <p className="text-slate-500 mt-3">No client data available</p>
                </div>
              ) : (
                analytics.topClients.map((client, index) => {
                  const percentage = Math.round((client.minutes / analytics.totalMinutesAll) * 100);
                  return (
                    <div 
                      key={client.name} 
                      className="group p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              index === 0 ? 'bg-amber-500' :
                              index === 1 ? 'bg-slate-400' :
                              index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                            }`}></div>
                            <h4 className="font-bold text-slate-800 line-clamp-1">
                              {client.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {percentage}% of total time
                          </p>
                        </div>
                        <span className="text-lg font-black text-slate-900">
                          {client.hours}h
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
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

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Recent Activity
                </h3>
                <p className="text-sm text-slate-500">
                  Latest time entries and updates
                </p>
              </div>
              <Link
                to="/time-log"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <IoArrowUp className="rotate-90" size={14} />
              </Link>
            </div>
          </div>

          {analytics.recentEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTimeOutline className="text-slate-400" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-slate-700 mb-2">
                No recent activity
              </h4>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Start tracking your time to see analytics and insights
              </p>
              <Link
                to="/time-log"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <IoCalendarOutline size={16} />
                Go to Time Log
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.recentEntries.map((entry, index) => (
                    <tr 
                      key={entry.id || index} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {toDateKey(entry.entry_date)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {entry.project_name || "—"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {entry.project_code || "No code"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">
                          {entry.task_id}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.client ? 
                          'bg-indigo-50 text-indigo-700' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.client || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <IoTimeOutline className="text-slate-400" size={16} />
                          <span className="font-black text-slate-900">
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
        <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold mb-2">
                Ready to optimize your workflow?
              </h4>
              <p className="text-green-100 opacity-90">
                Track more time to unlock advanced analytics and insights
              </p>
            </div>
            <Link
              to="/time-log"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-black font-bold rounded-xl  transition-all shadow-lg active:scale-[0.98] whitespace-nowrap"
            >
              <IoCheckmarkCircle size={18} />
              Start Tracking Your Time
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}