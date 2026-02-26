
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { IoCloseOutline, IoLayersOutline, IoAddOutline, IoStatsChartOutline } from 'react-icons/io5';
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-9999"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-(--app-bg) backdrop-blur-2xl border-l border-(--glass-border) z-10000 shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />

                        <div className="p-8 border-b border-(--glass-border) flex items-center justify-between relative z-10 bg-(--hover-bg)">
                            <div className="flex items-center gap-4">
                                <div className="p-1 rounded-2xl bg-(--primary-glow) border border-(--primary-glow) shadow-xl">
                                    <UserAvatar name={selectedUser.user_name} email={selectedUser.user_email} size="md" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-(--text-main) tracking-tight leading-tight">{selectedUser.user_name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-(--primary) shadow-(--primary-glow)" />
                                        <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">{selectedUser.user_dept}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg) rounded-xl transition-all border border-transparent hover:border-(--glass-border)"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] uppercase font-black text-(--text-muted) tracking-[0.2em]">Capacity Usage</span>
                                    <span className={`text-sm font-black flex items-center gap-2 ${selectedUser.displayAllocation > 160 ? 'text-(--rose)' : 'text-(--success)'}`}>
                                        {selectedUser.displayAllocation} <span className="text-[10px] text-(--text-muted)">/ 160h</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-(--hover-bg) rounded-full overflow-hidden border border-(--glass-border)">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (selectedUser.displayAllocation / 160) * 100)}%` }}
                                        className={`h-full shadow-(--primary-glow) ${selectedUser.displayAllocation > 160 ? 'bg-(--rose)' : 'bg-(--success)'}`}
                                    />
                                </div>
                            </div>

                            <div className="p-6 rounded-[32px] bg-(--primary-glow) border border-(--primary-glow) shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <IoStatsChartOutline size={40} className="text-(--primary)" />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-black text-(--primary) uppercase tracking-widest">Availability Forecast</span>
                                    <h5 className="text-2xl font-black text-(--text-main) mt-1">
                                        {selectedUser.nextFreeDate === 'Currently Free' ? (
                                            <span className="text-(--success)">Available Now</span>
                                        ) : selectedUser.nextFreeDate === 'No Free Date Found' ? (
                                            <span className="text-(--rose) italic">Fully Booked</span>
                                        ) : (
                                            <>
                                                Free on <span className="text-(--primary)">{new Date(selectedUser.nextFreeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </>
                                        )}
                                    </h5>
                                    <p className="text-[10px] text-(--text-muted) font-bold mt-2 uppercase tracking-tight">
                                        Based on {selectedUser.displayAllocation}h current load
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h5 className="text-[10px] font-black text-(--text-muted) uppercase tracking-[0.2em]">Current Projects</h5>
                                    <span className="px-2 py-0.5 rounded-full bg-(--hover-bg) text-[9px] font-black text-(--text-muted) border border-(--glass-border)">{selectedUser.projects.length}</span>
                                </div>

                                {(() => {
                                    const drawerPto = selectedUser.projects.filter(p => p.project_category === 'PTO' || p.project_name === 'Leave');
                                    const drawerWork = selectedUser.projects.filter(p => p.project_category !== 'PTO' && p.project_name !== 'Leave');

                                    if (drawerPto.length === 0 && drawerWork.length === 0) {
                                        return (
                                            <div className="p-10 text-center border-2 border-dashed border-(--glass-border) rounded-[32px] bg-(--hover-bg)">
                                                <IoLayersOutline size={32} className="text-(--text-muted) mx-auto mb-3" />
                                                <p className="text-(--text-muted) text-[10px] font-black uppercase tracking-widest">No Active Assignments</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-6">
                                            {drawerWork.length > 0 && (
                                                <div className="space-y-3">
                                                    {drawerWork.map(proj => (
                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-(--hover-bg) border border-(--glass-border) hover:border-(--primary-glow) transition-all duration-300 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-linear-to-br from-(--primary-glow) via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                            <div className="flex items-start justify-between relative z-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-(--app-bg) flex items-center justify-center text-[10px] font-black text-(--primary) border border-(--glass-border) group-hover/item:bg-(--primary) group-hover/item:text-(--text-inverse) transition-colors duration-500">
                                                                        {proj.project_code}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-(--text-main) leading-tight">{proj.project_name}</p>
                                                                        <p className="text-[10px] text-(--text-muted) font-bold uppercase mt-1 tracking-wider">{proj.project_client}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-black text-(--primary) tracking-tight">{proj.allocation_hours}h</div>
                                                                    <div className="text-[9px] text-(--text-muted) font-bold uppercase">Work</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {drawerPto.length > 0 && (
                                                <div className="space-y-3">
                                                    <h6 className="text-[9px] font-black text-(--secondary) uppercase tracking-[0.2em] px-1">Leave Assignments</h6>
                                                    {drawerPto.map(proj => (
                                                        <div key={proj.id} className="group/item p-5 rounded-3xl bg-(--secondary-glow) border border-(--secondary-glow) hover:border-(--secondary) transition-all duration-300 relative overflow-hidden">
                                                            <div className="flex items-start justify-between relative z-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-(--secondary) flex items-center justify-center text-[10px] font-black text-(--text-inverse) border border-(--secondary-glow)">
                                                                        PTO
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-(--secondary) leading-tight">Leave/Holiday</p>
                                                                        <p className="text-[10px] text-(--secondary) font-bold uppercase mt-1 tracking-wider opacity-50">{proj.project_client || 'Personal'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-black text-(--secondary) tracking-tight">{proj.allocation_hours}h</div>
                                                                    <div className="text-[9px] text-(--secondary) font-bold uppercase opacity-50">Leave</div>
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

                        <div className="p-6 bg-(--hover-bg) border-t border-(--glass-border) backdrop-blur-md relative z-20">
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
                                className="w-full py-4 bg-(--primary) hover:bg-(--primary-light) text-(--text-inverse) rounded-[22px] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-(--primary-glow) active:scale-95 flex items-center justify-center gap-3"
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
