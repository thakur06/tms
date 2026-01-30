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
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 md:p-12 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-start justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-2xl"
          >
            <h2 className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-amber-500/50" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
              {getGreeting()}, <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-500 to-amber-600">{user?.name}</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium mb-10 leading-relaxed max-w-lg">
                Your workspace is active and ready. Here is a baseline look at your productivity and performance for the ongoing session.
            </p>

            <div className="flex flex-wrap gap-8 items-center border-t border-white/10 pt-10">
              <div className="group">
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-amber-500 transition-colors">Today's Focus</div>
                <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{Math.floor(stats.todayMinutes / 60)}h {stats.todayMinutes % 60}m</div>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="group">
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-amber-500 transition-colors">Rolling Week</div>
                <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{Math.floor(stats.weekMinutes / 60)}h {stats.weekMinutes % 60}m</div>
              </div>
              {stats.pendingApprovals > 0 && (
                <>
                  <div className="w-px h-12 bg-white/10 hidden sm:block" />
                  <Link to="/approvals" className="group">
                    <div className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-amber-400 transition-colors">Action Required</div>
                    <div className="text-3xl font-black text-white flex items-center gap-3 group-hover:translate-x-2 transition-transform">
                      {stats.pendingApprovals} PENDING
                      <IoArrowForward className="text-amber-500" size={24} />
                    </div>
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-12 flex gap-4">
               <Link to="/time-log" className="px-8 py-3 bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20">
                 Log Activities
               </Link>
               <Link to="/reports-analytics" className="px-8 py-3 bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-zinc-700 transition-all">
                 Deep Insights
               </Link>
            </div>
          </motion.div>

          {/* Chart Integration in Hero */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full xl:w-[450px] bg-black/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-inner"
          >
             <div className="flex justify-between items-center mb-10">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Weekly Momentum</div>
                <IoStatsChartOutline className="text-amber-500 opacity-50" size={18} />
             </div>
             
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="name" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                            itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>

             <div className="mt-8 flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-tighter">
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
                <h3 className="text-gray-300 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Live Activity Stream
                </h3>
                <Link to="/my-submissions" className="text-[10px] font-black text-amber-500 hover:text-white transition-colors uppercase tracking-widest">See history</Link>
            </div>
            
            <div className="space-y-3">
                {recentEntries.length > 0 ? (
                    recentEntries.map((entry, idx) => (
                        <motion.div
                            key={entry.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="group bg-zinc-900/50 border border-white/5 p-5 rounded-3xl flex items-center justify-between hover:bg-zinc-800/80 hover:border-amber-500/20 transition-all cursor-default"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-amber-500 border border-white/5 group-hover:scale-110 transition-transform">
                                    <IoTimeOutline size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">{entry.project}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{entry.task_id} • {new Date(entry.entry_date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-white">{entry.hours}h {entry.minutes}m</div>
                                <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Duration</div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-20 text-center bg-zinc-900/30 border border-dashed border-white/5 rounded shadow-inner">
                        <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No recent workspace activity recorded</p>
                    </div>
                )}
            </div>
        </div>

        {/* Global Notifications/Status */}
        <div className="space-y-6">
             <h4 className="text-gray-300 text-xs font-black uppercase tracking-[0.2em] px-2">Workspace Radar</h4>
             
             <div className="bg-linear-to-br from-amber-500 to-orange-600 p-6 rounded-[40px] text-zinc-950 relative overflow-hidden shadow-2xl shadow-orange-500/20 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <h5 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-black/10 pb-4">Submission Status</h5>
                <p className="text-2xl font-black tracking-tighter mb-8 italic">"Keep your momentum. Don't forget to submit your weekly timesheet by Friday 6 PM."</p>
                
                <Link to="/time-log" className="flex items-center justify-between w-full p-4 bg-black/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black/20 transition-all">
                    Prepare Submission
                    <IoChevronForward />
                </Link>
             </div>

             <div className="bg-zinc-900 border border-white/5 p-6 rounded-[40px] flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <IoCheckmarkCircleOutline size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-black text-white uppercase tracking-tighter">System Health</div>
                        <div className="text-[10px] font-bold text-gray-500 italic">Core services functional</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <IoCalendarOutline size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-black text-white uppercase tracking-tighter">Next Milestone</div>
                        <div className="text-[10px] font-bold text-gray-500 italic">Sprint Review in 2 Days</div>
                    </div>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}
