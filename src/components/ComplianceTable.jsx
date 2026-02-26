import { motion } from 'framer-motion';
import {
    IoCheckmarkCircle, IoCloseCircle, IoTime,
    IoWarning, IoMail, IoBusiness
} from 'react-icons/io5';
import UserAvatar from './UserAvatar';

const getStatusColor = (status) => {
    switch (status) {
        case 'approved': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
        case 'rejected': return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
        case 'pending': return 'bg-(--primary-glow) text-(--primary) border-(--primary-glow)';
        default: return 'bg-(--hover-bg) text-(--text-muted) border-(--glass-border)';
    }
};

export default function ComplianceTable({
    data,
    weekDays,
    onAction, // (action, item) => {} action: 'approve' | 'reject' | 'view'
    userRole,
    enableActions = true
}) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-(--text-muted)">
                <IoTime size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-bold">No compliance data found for this period.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-(--glass-border) bg-(--glass-surface) custom-scrollbar">
            <table className="w-full border-collapse min-w-[700px] sm:min-w-[800px]">
                <thead>
                    <tr className="bg-(--hover-bg) border-b border-(--glass-border)">
                        <th className="p-4 text-left text-[10px] font-black uppercase text-(--text-muted) tracking-[0.2em] w-[250px] sticky left-0 bg-(--hover-bg) z-10 backdrop-blur-md">User</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-[0.2em] bg-(--hover-bg)">Status</th>
                        {weekDays.map(day => (
                            <th key={day.toISOString()} className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-[0.2em] min-w-[60px] bg-(--hover-bg)">
                                <span className={day.getDay() === 0 || day.getDay() === 6 ? 'text-(--rose)/60' : ''}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className="text-[9px] opacity-50">{day.getUTCDate()}</div>
                            </th>
                        ))}
                        <th className="p-4 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-[0.2em] w-[80px] bg-(--hover-bg)">Total</th>
                        {enableActions && (
                            <th className="p-4 text-right text-[10px] font-black uppercase text-(--text-muted) tracking-[0.2em] sticky right-0 bg-(--hover-bg) z-10">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-(--glass-border) text-xs font-medium text-(--text-main)">
                    {data.map((item, index) => {
                        const isPending = item.status === 'pending';

                        return (
                            <motion.tr
                                key={item.user.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                {/* User Info */}
                                <td className="p-4 sticky left-0 bg-(--app-bg) group-hover:bg-(--hover-bg) transition-colors border-r border-(--glass-border) z-10">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={item.user.name} email={item.user.email} size="sm" />
                                        <div className="min-w-0">
                                            <div className="text-(--text-main) font-black text-xs uppercase tracking-tight truncate">{item.user.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-(--text-muted)">
                                                <div className="flex items-center gap-1 font-bold">
                                                    <IoBusiness size={10} />
                                                    <span className="truncate max-w-[80px]">{item.user.dept}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="p-4 text-center bg-(--app-bg) group-hover:bg-(--hover-bg) transition-colors">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>

                                {/* Daily Hours */}
                                {weekDays.map(day => {
                                    // Fix: Use local date components matching the backend/page generation
                                    const year = day.getUTCFullYear();
                                    const month = String(day.getUTCMonth() + 1).padStart(2, '0');
                                    const d = String(day.getUTCDate()).padStart(2, '0');
                                    const dateStr = `${year}-${month}-${d}`;

                                    const hours = item.daily[dateStr] || 0;
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                    // Highlight logic: < 8h on weekday = red/amber
                                    // No highlighting on weekends
                                    const isLow = !isWeekend && hours < 8 && hours > 0;
                                    const isMissing = !isWeekend && hours === 0;

                                    return (
                                        <td key={dateStr} className={`p-2 text-center border-r border-(--glass-border) last:border-0 bg-(--app-bg) group-hover:bg-(--hover-bg) transition-colors`}>
                                            <div className={`
                                                mx-auto w-8 h-8 flex items-center justify-center rounded-lg font-mono font-bold
                                                ${hours > 0 ? (isLow ? 'text-(--amber) bg-(--amber)/10' : 'text-(--text-main) bg-(--hover-bg)') : 'text-(--text-muted) opacity-40'}
                                                ${isMissing && dateStr < new Date().toISOString().split('T')[0] ? 'bg-(--rose)/5 text-(--rose)/50' : ''}
                                            `}>
                                                {hours > 0 ? Number(hours).toFixed(1) + "h" : '-'}
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* Total */}
                                <td className="p-4 text-center font-mono font-black text-(--text-main) bg-(--app-bg) group-hover:bg-(--hover-bg) transition-colors border-l border-(--glass-border)">
                                    {Number(item.totalHours).toFixed(1) + "h"}
                                </td>

                                {/* Actions */}
                                {enableActions && (
                                    <td className="p-4 text-right sticky right-0 bg-(--app-bg) group-hover:bg-(--hover-bg) transition-colors border-l border-(--glass-border) z-10">
                                        <div className="flex items-center justify-end gap-2">
                                            {isPending && (
                                                <>
                                                    <button
                                                        onClick={() => onAction('approve', item)}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                        title="Quick Approve"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => onAction('reject', item)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                        title="Quick Reject"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onAction('view', item)}
                                                className="px-3 py-1.5 rounded-lg bg-(--hover-bg) hover:bg-(--glass-surface) text-[10px] font-black uppercase tracking-wider text-(--text-muted) hover:text-(--text-main) transition-all active:scale-95 border border-(--glass-border)"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
