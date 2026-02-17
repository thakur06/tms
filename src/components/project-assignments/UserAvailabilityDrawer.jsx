
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { IoCloseOutline, IoLayersOutline, IoAddOutline } from 'react-icons/io5';
import UserAvatar from '../UserAvatar';

const UserAvailabilityDrawer = ({
    selectedUser,
    onClose,
    // loading, 
    // forecast, 
    // threshold, 
    setIsAssignModalOpen,
    setFormData,
    selectedDate
}) => {
    return createPortal(
        <AnimatePresence>
            {selectedUser && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-10000 shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />

                        <div className="p-8 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className="p-1 rounded-2xl bg-linear-to-br from-amber-500/20 to-transparent border border-amber-500/20 shadow-xl">
                                    <UserAvatar name={selectedUser.user_name} email={selectedUser.user_email} size="md" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white tracking-tight leading-tight">{selectedUser.user_name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedUser.user_dept}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Capacity Usage</span>
                                    <span className={`text-sm font-black flex items-center gap-2 ${selectedUser.displayAllocation > 160 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {selectedUser.displayAllocation} <span className="text-[10px] text-gray-500">/ 160h</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (selectedUser.displayAllocation / 160) * 100)}%` }}
                                        className={`h-full shadow-[0_0_15px_-3px_currentColor] ${selectedUser.displayAllocation > 160 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    />
                                </div>
                            </div>

                            {/* Note: I'm commenting out the Availability Forecast section as it relied on external state (timelineLoading, availabilityForecast) logic 
                                inside the drawer previously. If needed, we can pass those as props. For now, simplifying to just project list.
                                If the user wants the forecast card back in the drawer, we can uncomment and pass props.
                            */}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Current Projects</h5>
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-gray-400 border border-white/5">{selectedUser.projects.length}</span>
                                </div>

                                {(() => {
                                    const drawerPto = selectedUser.projects.filter(p => p.project_category === 'PTO' || p.project_name === 'Leave');
                                    const drawerWork = selectedUser.projects.filter(p => p.project_category !== 'PTO' && p.project_name !== 'Leave');

                                    if (drawerPto.length === 0 && drawerWork.length === 0) {
                                        return (
                                            <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-zinc-900/20">
                                                <IoLayersOutline size={32} className="text-gray-800 mx-auto mb-3" />
                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No Active Assignments</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-6">
                                            {drawerWork.length > 0 && (
                                                <div className="space-y-3">
                                                    {drawerWork.map(proj => (
                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-linear-to-br from-amber-500/0 via-transparent to-amber-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                            <div className="flex items-start justify-between relative z-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-white/10 group-hover/item:bg-amber-500 group-hover/item:text-zinc-950 transition-colors duration-500">
                                                                        {proj.project_code}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-white leading-tight">{proj.project_name}</p>
                                                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">{proj.project_client}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-black text-amber-500 tracking-tight">{proj.allocation_hours}h</div>
                                                                    <div className="text-[9px] text-gray-500 font-bold uppercase">Work</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {drawerPto.length > 0 && (
                                                <div className="space-y-3">
                                                    <h6 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] px-1">Leave Assignments</h6>
                                                    {drawerPto.map(proj => (
                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
                                                            <div className="flex items-start justify-between relative z-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-[10px] font-black text-white border border-blue-400/20">
                                                                        PTO
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-blue-400 leading-tight">Leave/Holiday</p>
                                                                        <p className="text-[10px] text-blue-400/50 font-bold uppercase mt-1 tracking-wider">{proj.project_client || 'Personal'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-black text-blue-400 tracking-tight">{proj.allocation_hours}h</div>
                                                                    <div className="text-[9px] text-blue-400/50 font-bold uppercase">Leave</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-md relative z-20">
                            <button
                                onClick={() => {
                                    setFormData({
                                        user_id: selectedUser.user_id,
                                        project_id: '',
                                        allocation_hours: 40,
                                        start_date: selectedDate,
                                        end_date: '9999-12-31'
                                    });
                                    onClose();
                                    setIsAssignModalOpen(true);
                                }}
                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-[22px] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-[0_15px_30px_-10px_rgba(245,158,11,0.5)] active:scale-95 flex items-center justify-center gap-3"
                            >
                                <IoAddOutline size={18} className="stroke-3" />
                                Assign New Project
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default UserAvailabilityDrawer;
