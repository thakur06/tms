
import { motion } from 'framer-motion';
import PtoSpreadsheetView from '../PtoSpreadsheetView';

const PTOTab = ({ selectedDate, onDateChange, users, onSyncSuccess, server }) => {
    return (
        <div className="flex-1 min-h-0 h-[600px] flex flex-col gap-4">
            {/* Month Selector for PTO Plans */}
            <div className="flex bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl relative overflow-hidden w-fit">
                <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent pointer-events-none" />
                {[0, 1, 2, 3].map((m) => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() + m);
                    const label = d.toLocaleDateString('en-US', { month: 'short' });
                    const dateStr = d.toISOString().split('T')[0];
                    const isActive = selectedDate.startsWith(dateStr.substring(0, 7));

                    return (
                        <button
                            key={m}
                            onClick={() => onDateChange(dateStr)}
                            className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-w-[75px] z-10 ${isActive
                                ? 'text-zinc-950 scale-105 active:scale-95'
                                : 'text-gray-500 hover:text-white hover:bg-white/5 active:scale-95'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeMonthPtoIndicator"
                                    className="absolute inset-0 bg-amber-500 rounded-xl -z-1 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{m === 0 ? 'Now' : label}</span>
                        </button>
                    );
                })}
            </div>

            <PtoSpreadsheetView
                users={users}
                selectedDate={selectedDate}
                onSyncSuccess={onSyncSuccess}
                server={server}
            />
        </div>
    );
};

export default PTOTab;
