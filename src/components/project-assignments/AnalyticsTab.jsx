
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Label, Tooltip, ResponsiveContainer
} from 'recharts';
import { IoStatsChartOutline } from 'react-icons/io5';

const AnalyticsTab = ({ server, selectedDate, allUsers }) => {
    const [forecastData, setForecastData] = useState([]);
    const [loading, setLoading] = useState(true);

    const getMonthName = (offset) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + offset);
        return d.toLocaleDateString('en-US', { month: 'short' });
    };

    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const months = [0, 1, 2];
                const rawData = [];

                // 1. Fetch data for next 3 months
                for (const m of months) {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() + m);
                    const month = d.getMonth() + 1;
                    const year = d.getFullYear();
                    const monthName = d.toLocaleDateString('en-US', { month: 'short' });

                    const res = await axios.get(`${server}/api/user-projects`, {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { month, year }
                    });

                    rawData.push({ monthName, data: res.data.data });
                }

                // 2. Process per user (Flattened for Recharts)
                const processed = allUsers.map(user => {
                    const userMonths = rawData.map(monthRecord => {
                        // Use user.user_id since filteredUsers structure uses snake_case keys
                        const userRecord = monthRecord.data.find(u => u.user_id === user.user_id);
                        return {
                            name: monthRecord.monthName,
                            hours: userRecord ? userRecord.total_allocation : 0,
                            pct: userRecord ? Math.min(100, (userRecord.total_allocation / 160) * 100) : 0
                        };
                    });

                    // Flatten structure: { name: 'User', m0: 160, m1: 150, m2: 100, ... }
                    const flattened = {
                        name: user.user_name || 'Unknown User', // Use user_name
                        dept: user.user_dept, // Use user_dept
                        email: user.user_email, // Use user_email
                        id: user.user_id, // Preserve id for keys
                        totalFutureHours: userMonths.reduce((sum, m) => sum + m.hours, 0),
                    };

                    userMonths.forEach((m, idx) => {
                        flattened[`m${idx}`] = m.hours;
                        flattened[`m${idx}_name`] = m.name;
                    });

                    return flattened;
                }).sort((a, b) => b.totalFutureHours - a.totalFutureHours);

                setForecastData(processed);
            } catch (err) {
                console.error("Forecast fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        if (allUsers.length > 0) {
            fetchForecast();
        } else {
            setForecastData([]);
            setLoading(false);
        }
    }, [selectedDate, server, allUsers]);

    if (loading) return (
        <div className="flex items-center justify-center h-[500px]">
            <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
    );

    // Dynamic height based on user count (approx 68px per user for better spacing)
    const chartHeight = Math.max(600, forecastData.length * 68);

    const CustomYAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <foreignObject x={-150} y={-16} width={140} height={32}>
                    <div className="flex items-center justify-end gap-2.5 w-full h-full pr-2">
                        <span className="text-[11px] font-bold text-gray-400 truncate max-w-[100px] tracking-wide" title={payload.value}>{payload.value}</span>
                        <div className="w-6 h-6 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-lg group-hover/analytics:border-amber-500/30 transition-colors">
                            {payload.value.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </foreignObject>
            </g>
        );
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const totalLoad = payload.reduce((sum, e) => sum + e.value, 0);
            return (
                <div className="bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] space-y-3 min-w-[220px]">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-xs font-black text-white border border-white/10 shadow-inner">
                            {label.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white font-black text-sm tracking-tight">{label}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Forecast Details</p>
                        </div>
                    </div>
                    <div className="space-y-2.5 py-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center text-xs group/line">
                                <span className="text-gray-400 font-bold flex items-center gap-2 group-hover/line:text-gray-300 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: entry.color }} />
                                    {entry.name}
                                </span>
                                <div className="text-right">
                                    <span className="text-white font-mono font-black block">
                                        {entry.value}h
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center bg-white/2 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Load</span>
                            <span className="text-[9px] text-gray-600 font-mono">{(totalLoad / 160 * 100).toFixed(0)}% Capacity</span>
                        </div>
                        <span className={`text-base font-black ${totalLoad > 160 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {totalLoad}h
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[40px] p-6 sm:p-8 h-[650px] flex flex-col relative overflow-hidden shadow-2xl group/analytics">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none group-hover/analytics:bg-amber-500/10 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/5">
                        <IoStatsChartOutline />
                    </div>
                    3-Month Resource Forecast
                </h3>
                <div className="hidden sm:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div> {getMonthName(0)}</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> {getMonthName(1)}</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div> {getMonthName(2)}</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                <div style={{ height: chartHeight, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={forecastData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            barCategoryGap={32}
                            barGap={6}
                        >
                            <defs>
                                <linearGradient id="colorCurrent" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="colorNext" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="colorFuture" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#A855F7" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#9333EA" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff" strokeOpacity={0.05} />
                            <XAxis
                                type="number"
                                stroke="#52525B"
                                fontSize={10}
                                fontWeight={700}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 'auto']}
                                tickFormatter={(val) => `${val}h`}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#9ca3af"
                                fontSize={11}
                                fontWeight={600}
                                width={150}
                                axisLine={false}
                                tickLine={false}
                                tick={<CustomYAxisTick />}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05', radius: 8 }} />
                            <ReferenceLine x={160} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5}>
                                <Label value="Monthly Cap (160h)" position="insideTopRight" fill="#10B981" fontSize={10} fontWeight={900} offset={10} />
                            </ReferenceLine>
                            <Bar dataKey="m0" name={getMonthName(0)} fill="url(#colorCurrent)" radius={[0, 4, 4, 0]} barSize={10} animationDuration={1200} />
                            <Bar dataKey="m1" name={getMonthName(1)} fill="url(#colorNext)" radius={[0, 4, 4, 0]} barSize={10} animationDuration={1200} animationBegin={150} />
                            <Bar dataKey="m2" name={getMonthName(2)} fill="url(#colorFuture)" radius={[0, 4, 4, 0]} barSize={10} animationDuration={1200} animationBegin={300} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {forecastData.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 absolute inset-0">
                        <IoStatsChartOutline size={48} className="mb-4" />
                        <p className="font-bold text-sm">No forecast data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsTab;
