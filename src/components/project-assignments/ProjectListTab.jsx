
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoCalendarOutline, IoLayersOutline, IoPencilOutline,
    IoTrashOutline, IoStatsChartOutline
} from 'react-icons/io5';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import UserAvatar from '../UserAvatar';
import UserAvailabilityDrawer from './UserAvailabilityDrawer';

const COLORS = [
    '#F59E0B', // Yellow/Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#38BDF8', // Light Blue
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#EF4444', // Red
    '#10B981', // Green
];

const ProjectListTab = ({
    users,
    selectedDate,
    onUserSelect, // For opening the drawer (which is now internal? No, drawer needs to be rendered)
    // Wait, if I move Drawer into here, then I don't need onUserSelect from parent IF parent doesn't need to know.
    // But parent manages 'selectedAnalyticsUser'.
    allProjects, // Needed for "Log PTO" click
    setFormData,
    setIsAssignModalOpen,
    setIsEditModalOpen,
    setSelectedAssignment, // For editing
    handleDeleteClick, // For deleting

    // Props for Drawer (if passed through)
    selectedAnalyticsUser,
    setSelectedAnalyticsUser
}) => {

    // Internal handler for forecast click
    const handleForecastClick = (user) => {
        if (onUserSelect) {
            onUserSelect(user);
        } else {
            setSelectedAnalyticsUser(user);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
                {users.map((user, idx) => (
                    <motion.div
                        key={user.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={(e) => {
                            // Revert to assignment modal on card click
                            if (e.target.closest('button')) return;
                            const leaveProject = allProjects.find(p => p.category === 'PTO' || p.name === 'Leave');
                            setFormData({
                                user_id: user.user_id,
                                project_id: '', // Default to empty for general assignment
                                allocation_hours: 40,
                                start_date: selectedDate,
                                end_date: selectedDate
                            });
                            setIsAssignModalOpen(true);
                        }}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-amber-500/20 transition-all group overflow-hidden cursor-pointer"
                    >
                        <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-4">
                            {/* Left Column: Stats & Projects */}
                            <div className="flex-1 min-w-0 space-y-6">
                                <div className="flex items-center gap-3">
                                    <UserAvatar name={user.user_name} email={user.user_email} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-white truncate">{user.user_name}</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleForecastClick(user);
                                                }}
                                                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn"
                                                title="View Availability Forecast"
                                            >
                                                <IoCalendarOutline size={14} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold">{user.user_dept}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Work Hours</span>
                                        <span className={`text-xs font-black ${user.displayAllocation > 160 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {user.displayAllocation} / 160
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((user.displayAllocation / 160) * 100, 100)}%` }}
                                            className={`h-full rounded-full ${user.displayAllocation > 160 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 hide-y-scroll">
                                    {user.displayProjects.length > 0 ? (
                                        user.displayProjects.map(proj => (
                                            <div key={proj.id} className="group/item relative p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-white truncate">{proj.project_name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold truncate">{proj.project_client}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <span className="text-emerald-500 font-black text-xs md:text-sm">{proj.allocation_hours}h</span>
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedAssignment(proj);
                                                                    setFormData({
                                                                        user_id: user.user_id,
                                                                        project_id: proj.project_id,
                                                                        allocation_hours: proj.allocation_hours,
                                                                        start_date: proj.start_date.split('T')[0],
                                                                        end_date: proj.end_date.split('T')[0]
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                            >
                                                                <IoPencilOutline size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(proj);
                                                                }}
                                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <IoTrashOutline size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-1.5 rounded-lg w-full justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <IoCalendarOutline size={10} />
                                                        <span>{new Date(proj.start_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <span className="opacity-30">→</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{new Date(proj.end_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-dashed border-white/10 opacity-50 h-[58px]">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-600">
                                                <IoLayersOutline size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">No Projects Assigned</p>
                                                <p className="text-[9px] text-gray-600 font-bold italic">Click card to log hrs</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Pie Chart */}
                            <div className="w-full lg:w-44 h-44 shrink-0 relative group self-center lg:self-start">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={user.activeProjects.length > 0 ? user.activeProjects : [{ project_name: 'Free', allocation_hours: 160 }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={user.displayProjects.length > 0 ? 5 : 0}
                                            dataKey="allocation_hours"
                                            nameKey="project_name"
                                            stroke="none"
                                            onMouseEnter={(_, index) => {
                                                // Track which user's pie is hovered
                                                window._hoveredPieId = user.user_id + '_' + index;
                                                const el = document.getElementById(`load-info-${user.user_id}`);
                                                if (el) el.style.opacity = '0';
                                            }}
                                            onMouseLeave={() => {
                                                window._hoveredPieId = null;
                                                const el = document.getElementById(`load-info-${user.user_id}`);
                                                if (el) el.style.opacity = '1';
                                            }}
                                        >
                                            {user.activeProjects.length > 0 ? (
                                                user.activeProjects.map((entry, index) => {
                                                    const isLeave = entry.project_category === 'PTO' || entry.project_name === 'Leave';
                                                    return <Cell key={`cell-${index}`} fill={isLeave ? '#3B82F6' : COLORS[index % COLORS.length]} />;
                                                })
                                            ) : (
                                                <Cell fill="#3B3B3B" />
                                            )}
                                        </Pie>
                                        {user.activeProjects.length > 0 && (
                                            <Tooltip
                                                formatter={(value) => `${value} Hrs`}
                                                contentStyle={{
                                                    backgroundColor: '#D3D3D3',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    color: '#000000',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                                    zIndex: 1000
                                                }}
                                                itemStyle={{
                                                    color: '#000000',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}
                                            />
                                        )}
                                    </PieChart>
                                </ResponsiveContainer>
                                <div
                                    id={`load-info-${user.user_id}`}
                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 transition-opacity duration-300"
                                >
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Monthly</span>
                                    <span className={`text-lg font-black ${user.displayAllocation > 160 ? 'text-red-500' : 'text-white'}`}>
                                        {user.displayAllocation}h
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <UserAvailabilityDrawer
                selectedUser={selectedAnalyticsUser}
                onClose={() => setSelectedAnalyticsUser(null)}
                setIsAssignModalOpen={setIsAssignModalOpen}
                setFormData={setFormData}
                selectedDate={selectedDate}
            />
        </div>
    );
};

export default ProjectListTab;
