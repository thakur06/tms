import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSaveOutline, IoCloseOutline, IoChevronBackOutline, IoChevronForwardOutline, IoGridOutline } from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserAvatar from './UserAvatar';

export default function PtoSpreadsheetView({ users, selectedDate, onSyncSuccess, server }) {
    const [gridData, setGridData] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Initialize/Sync gridData from users prop
    useEffect(() => {
        const newGrid = {};
        users.forEach(user => {
            user.projects.forEach(proj => {
                if (proj.project_category === 'PTO' || proj.project_name === 'Leave') {
                    // Fix: Parse YYYY-MM-DD directly to avoid timezone shift
                    const [sYear, sMonth, sDay] = proj.start_date.toString().substring(0, 10).split('-').map(Number);
                    const [eYear, eMonth, eDay] = proj.end_date.toString().substring(0, 10).split('-').map(Number);

                    const start = new Date(sYear, sMonth - 1, sDay);
                    const end = new Date(eYear, eMonth - 1, eDay);

                    // Simple day-by-day mapping for the selected month
                    for (let d = 1; d <= daysInMonth; d++) {
                        const currentDay = new Date(year, month - 1, d);
                        if (currentDay >= start && currentDay <= end) {
                            newGrid[`${user.user_id}_${d}`] = proj.allocation_hours;
                        }
                    }
                }
            });
        });
        setGridData(newGrid);
        setIsDirty(false);
    }, [users, selectedDate, daysInMonth, year, month]);

    const handleCellClick = (userId, day) => {
        const dayDate = new Date(year, month - 1, day);
        const isWeekend = [0, 6].includes(dayDate.getDay());

        if (isWeekend) {
            toast.warn("PTO cannot be marked on weekends");
            return;
        }

        const key = `${userId}_${day}`;
        const currentHours = gridData[key] || 0;
        const newHours = currentHours === 8 ? 0 : 8; // Simple toggle for now

        setGridData(prev => ({
            ...prev,
            [key]: newHours
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const assignments = [];
            Object.entries(gridData).forEach(([key, hours]) => {
                if (hours > 0) {
                    const [userId, day] = key.split('_');
                    assignments.push({
                        user_id: parseInt(userId),
                        day: parseInt(day),
                        hours: hours
                    });
                }
            });

            const token = localStorage.getItem('token');
            const response = await axios.post(`${server}/api/user-projects/bulk-pto`, {
                assignments,
                month,
                year
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success("PTO assignments and timesheets synced!");
                setIsDirty(false);
                if (onSyncSuccess) onSyncSuccess();
            }
        } catch (err) {
            console.error("Save failed:", err);
            toast.error(err.response?.data?.error || "Failed to sync PTO");
        } finally {
            setIsSaving(false);
        }
    };

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 rounded-3xl border border-white/5 overflow-hidden">
            {/* Header / Controls */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight">PTO Spreadsheet</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        High-density leave management for {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {isDirty && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <IoSaveOutline size={16} />
                                )}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scrollable Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-zinc-900 shadow-xl">
                        <tr>
                            <th className="sticky left-0 z-30 bg-zinc-900 p-4 text-left border-b border-r border-white/5 min-w-[200px]">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Employee</span>
                            </th>
                            {days.map(d => {
                                const dayDate = new Date(year, month - 1, d);
                                const dName = dayDate.toLocaleDateString('en-US', { weekday: 'narrow' });
                                const isWeekend = [0, 6].includes(dayDate.getDay());
                                const isToday = new Date().toDateString() === dayDate.toDateString();

                                return (
                                    <th key={d} className={`p-2 border-b border-white/5 min-w-[40px] text-center transition-colors ${isToday ? 'bg-blue-500/10' : isWeekend ? 'bg-red-500/5' : ''}`}>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[10px] font-black ${isToday ? 'text-blue-400' : isWeekend ? 'text-red-500/40' : 'text-gray-400'}`}>{dName}</span>
                                            <span className={`text-xs font-black ${isToday ? 'text-blue-400' : isWeekend ? 'text-red-500/60' : 'text-white'}`}>{d}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.user_id} className="group hover:bg-white/2 transition-colors">
                                <td className="sticky left-0 z-10 bg-zinc-900 border-r border-white/5 p-4 group-hover:bg-zinc-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={user.user_name} size="xs" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate">{user.user_name}</p>
                                            <p className="text-[9px] text-gray-500 font-bold truncate uppercase">{user.user_dept}</p>
                                        </div>
                                    </div>
                                </td>
                                {days.map(d => {
                                    const hours = gridData[`${user.user_id}_${d}`] || 0;
                                    const dayDate = new Date(year, month - 1, d);
                                    const isWeekend = [0, 6].includes(dayDate.getDay());
                                    const isToday = new Date().toDateString() === dayDate.toDateString();

                                    return (
                                        <td
                                            key={d}
                                            onClick={() => handleCellClick(user.user_id, d)}
                                            className={`p-1 border-r border-white/5 text-center transition-all ${isWeekend ? 'cursor-not-allowed bg-red-500/5' : 'cursor-pointer hover:bg-blue-500/10'} ${isToday ? 'bg-blue-500/5' : ''}`}
                                        >
                                            <div className={`w-full h-8 rounded-lg flex items-center justify-center transition-all ${hours > 0
                                                ? 'bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/20 scale-95'
                                                : isWeekend ? 'text-red-500/20' : 'text-gray-700 hover:text-blue-400'
                                                }`}>
                                                {hours > 0 ? `${hours}h` : (<div className={`w-1 h-1 rounded-full ${isWeekend ? 'bg-red-500/10' : 'bg-white/5'} group-hover:bg-white/10`} />)}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {users.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-4">
                        <IoGridOutline size={32} />
                    </div>
                    <h4 className="text-white font-black tracking-tight">No staff found</h4>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters to see more results.</p>
                </div>
            )}
        </div>
    );
}
