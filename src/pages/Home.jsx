import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IoTimeOutline, IoCheckmarkCircleOutline, IoStatsChartOutline,
  IoCalendarOutline, IoPeopleOutline, IoSettingsOutline,
  IoChevronForward, IoArrowForward
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { formatTime } from '../utils/formatters';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid
} from 'recharts';

export default function Home() {
  const { user } = useAuth();
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const [chartData, setChartData] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayMinutes: 0,
    weekMinutes: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const token = localStorage.getItem('token');
        const today = new Date();
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - 6); // Last 7 days

        const [timeRes, approvalsRes] = await Promise.all([
          axios.get(`${server}/api/time-entries/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          user?.role === 'admin' || user?.reportsCount > 0
            ? axios.get(`${server}/api/timesheets/pending`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve({ data: [] })
        ]);

        const entries = timeRes.data || [];
        setRecentEntries(entries.slice(0, 5));

        const todayDateStr = today.toISOString().split('T')[0];
        const todayEntries = entries.filter(e => e.entry_date.split('T')[0] === todayDateStr);

        const todayMins = todayEntries.reduce((acc, e) => acc + (e.hours * 60 + e.minutes), 0);

        // Calculate weekly total (last 7 sliding days)
        const weekMins = entries.reduce((acc, e) => {
          const entryDate = new Date(e.entry_date);
          return entryDate >= startOfWeek ? acc + (e.hours * 60 + e.minutes) : acc;
        }, 0);

        // Prepare Chart Data
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayMins = entries
            .filter(e => e.entry_date.split('T')[0] === dateStr)
            .reduce((acc, e) => acc + (e.hours * 60 + e.minutes), 0);

          last7Days.push({
            name: d.toLocaleDateString('en-US', { weekday: 'short' }),
            hours: Number((dayMins / 60).toFixed(1))
          });
        }
        setChartData(last7Days);

        setStats({
          todayMinutes: todayMins,
          weekMinutes: weekMins,
          pendingApprovals: Array.isArray(approvalsRes.data) ? approvalsRes.data.length : 0
        });
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user, server]);

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen pb-12 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-(--app-bg) border border-(--glass-border) p-8 md:p-12 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[110px]" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-start justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-2xl"
          >
            <h2 className="text-(--primary) font-black uppercase tracking-[0.3em] text-[10px] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-(--primary-glow)" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <h1 className="text-5xl md:text-7xl font-black text-(--text-main) tracking-tighter mb-6 leading-[0.9]">
              {getGreeting()}, <br />
              <span className="text-gradient animate-gradient-x">{user?.name || 'User'}</span>
            </h1>
            <p className="text-(--text-muted) text-sm md:text-base font-medium mb-10 leading-relaxed max-w-lg">
              Your workspace is active and ready. Here is a baseline look at your productivity and performance for the ongoing session.
            </p>

            <div className="flex flex-wrap gap-8 items-center border-t border-(--glass-border) pt-10">
              <div className="group">
                <div className="text-(--text-muted) text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-(--rose) transition-colors">Today's Focus</div>
                <div className="text-3xl font-black text-(--text-main) group-hover:scale-105 transition-transform origin-left">{Math.floor(stats.todayMinutes / 60)}h {stats.todayMinutes % 60}m</div>
              </div>
              <div className="w-px h-12 bg-(--glass-border) hidden sm:block" />
              <div className="group">
                <div className="text-(--text-muted) text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-(--secondary) transition-colors">Rolling Week</div>
                <div className="text-3xl font-black text-(--text-main) group-hover:scale-105 transition-transform origin-left">{Math.floor(stats.weekMinutes / 60)}h {stats.weekMinutes % 60}m</div>
              </div>
              {stats.pendingApprovals > 0 && (
                <>
                  <div className="w-px h-12 bg-(--glass-border) hidden sm:block" />
                  <Link to="/approvals" className="group">
                    <div className="text-(--accent) text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-(--primary) transition-colors">Action Required</div>
                    <div className="text-3xl font-black text-(--text-main) flex items-center gap-3 group-hover:translate-x-2 transition-transform">
                      {stats.pendingApprovals} PENDING
                      <IoArrowForward className="text-(--secondary)" size={24} />
                    </div>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 flex gap-4">
              <Link to="/time-log" className="px-8 py-3 bg-(--gradient-primary) text-(--text-inverse) font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-(--primary-glow)">
                Log Activities
              </Link>
              <Link to="/reports-analytics" className="px-8 py-3 bg-(--hover-bg) text-(--text-main) font-black text-xs uppercase tracking-widest rounded-2xl border border-(--glass-border) hover:bg-(--app-bg) transition-all">
                Deep Insights
              </Link>
            </div>
          </motion.div>

          {/* Chart Integration in Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full xl:w-[450px] bg-(--hover-bg) backdrop-blur-xl border border-(--glass-border) rounded-[40px] p-8 shadow-inner"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="text-[10px] font-black text-(--text-muted) uppercase tracking-widest italic">Weekly Momentum</div>
              <IoStatsChartOutline className="text-(--accent) opacity-50" size={18} />
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-(--glass-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: '16px', color: 'var(--text-main)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex justify-between items-center text-xs text-(--text-muted) font-bold uppercase tracking-tighter">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Primary Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-(--text-muted) text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-(--rose) animate-pulse shadow-[0_0_10px_var(--rose-glow)]" />
              Live Activity Stream
            </h3>
            <Link to="/my-submissions" className="text-[10px] font-black text-(--primary) hover:text-(--secondary) transition-colors uppercase tracking-widest">See history</Link>
          </div>

          <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry, idx) => (
                <motion.div
                  key={entry.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="group bg-(--hover-bg) border border-(--glass-border) p-5 rounded-3xl flex items-center justify-between hover:bg-(--app-bg) hover:border-(--primary-glow) transition-all cursor-default"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-(--primary) border border-white/5 group-hover:scale-110 transition-transform">
                      <IoTimeOutline size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-(--text-main) group-hover:text-(--primary) transition-colors">{entry.project}</div>
                      <div className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest mt-0.5">{entry.task_id} • {new Date(entry.entry_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-(--text-main)">{entry.hours}h {entry.minutes}m</div>
                    <div className="text-[9px] text-(--text-muted) font-black uppercase tracking-widest">Duration</div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center bg-(--hover-bg) border border-dashed border-(--glass-border) rounded shadow-inner">
                <p className="text-(--text-muted) text-[10px] font-black uppercase tracking-widest">No recent workspace activity recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Notifications/Status */}
        <div className="space-y-6">
          <h4 className="text-(--text-muted) text-xs font-black uppercase tracking-[0.2em] px-2">Workspace Radar</h4>

          <div className="bg-(--gradient-rose) p-6 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-rose-500/20 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h5 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-black/10 pb-4">Submission Status</h5>
            <p className="text-2xl font-black tracking-tighter mb-8 italic">"Keep your momentum. Don't forget to submit your weekly timesheet by Friday 6 PM."</p>

            <Link to="/time-log" className="flex items-center justify-between w-full p-4 bg-black/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black/20 transition-all">
              Prepare Submission
              <IoChevronForward />
            </Link>
          </div>

          <div className="bg-(--app-bg) border border-(--glass-border) p-6 rounded-[40px] flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <IoCheckmarkCircleOutline size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-(--text-main) uppercase tracking-tighter">System Health</div>
                <div className="text-[10px] font-bold text-(--text-muted) italic">Core services functional</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <IoCalendarOutline size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-(--text-main) uppercase tracking-tighter">Next Milestone</div>
                <div className="text-[10px] font-bold text-(--text-muted) italic">Sprint Review in 2 Days</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
