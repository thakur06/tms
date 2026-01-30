import { motion } from 'framer-motion';
import { 
  IoCheckmarkCircle, IoCloseCircle, IoTime, 
  IoWarning, IoMail, IoBusiness
} from 'react-icons/io5';
import UserAvatar from './UserAvatar';

const getStatusColor = (status) => {
    switch(status) {
        case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        default: return 'bg-white/5 text-gray-500 border-white/10';
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <IoTime size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-bold">No compliance data found for this period.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/50">
            <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-black/20 border-b border-white/5">
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-widest w-[250px] sticky left-0 bg-zinc-900 z-10">User</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest bg-zinc-900">Status</th>
                        {weekDays.map(day => (
                            <th key={day.toISOString()} className="p-4 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest min-w-[60px] bg-zinc-900">
                                <span className={day.getDay() === 0 || day.getDay() === 6 ? 'text-red-500/50' : ''}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className="text-[9px] opacity-50">{day.getDate()}</div>
                            </th>
                        ))}
                        <th className="p-4 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest w-[80px] bg-zinc-900">Total</th>
                        {enableActions && (
                            <th className="p-4 text-right text-[10px] font-black uppercase text-gray-500 tracking-widest sticky right-0 bg-zinc-900 z-10">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-medium">
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
                                <td className="p-4 sticky left-0 bg-zinc-900 group-hover:bg-zinc-800 transition-colors border-r border-white/5 z-10">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={item.user.name} email={item.user.email} size="sm" />
                                        <div className="min-w-0">
                                            <div className="text-white font-bold truncate">{item.user.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <IoBusiness size={10} />
                                                    <span className="truncate max-w-[80px]">{item.user.dept}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="p-4 text-center bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>

                                {/* Daily Hours */}
                                {weekDays.map(day => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const hours = item.daily[dateStr] || 0;
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    
                                    // Highlight logic: < 8h on weekday = red/amber
                                    // No highlighting on weekends
                                    const isLow = !isWeekend && hours < 8 && hours > 0;
                                    const isMissing = !isWeekend && hours === 0;
                                    
                                    return (
                                        <td key={dateStr} className={`p-2 text-center border-r border-white/5 last:border-0 bg-zinc-900 group-hover:bg-zinc-800 transition-colors`}>
                                            <div className={`
                                                mx-auto w-8 h-8 flex items-center justify-center rounded-lg font-mono font-bold
                                                ${hours > 0 ? (isLow ? 'text-amber-500 bg-amber-500/10' : 'text-white bg-white/5') : 'text-gray-700'}
                                                ${isMissing && dateStr < new Date().toISOString().split('T')[0] ? 'bg-red-500/5 text-red-500/50' : ''}
                                            `}>
                                                {hours > 0 ? Number(hours).toFixed(1)+"h" : '-'}
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* Total */}
                                <td className="p-4 text-center font-mono font-black text-white bg-zinc-900 group-hover:bg-zinc-800 transition-colors border-l border-white/5">
                                    {Number(item.totalHours).toFixed(1)+"h"}
                                </td>

                                {/* Actions */}
                                {enableActions && (
                                    <td className="p-4 text-right sticky right-0 bg-zinc-900 group-hover:bg-zinc-800 transition-colors border-l border-white/5 z-10">
                                        <div className="flex items-center justify-end gap-2">
                                            {isPending && (
                                                <>
                                                    <button 
                                                        onClick={() => onAction('approve', item)}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                        title="Quick Approve"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => onAction('reject', item)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                        title="Quick Reject"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => onAction('view', item)}
                                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 transition-all active:scale-95 border border-white/5"
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
