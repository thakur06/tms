import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  IoArrowBack, IoCheckmarkCircle, IoCloseCircle,
  IoCalendar, IoTime, IoChatbubbleEllipsesOutline,
  IoPerson, IoBusiness
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import UserAvatar from '../components/UserAvatar';

export default function TimesheetReviewPage() {
  const { timesheetId } = useParams();
  const navigate = useNavigate();
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();

  const [timesheet, setTimesheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchReviewData();
  }, [timesheetId]);

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${server}/api/timesheets/${timesheetId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheet(res.data.timesheet);
      setEntries(res.data.entries);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  // Group entries by Project + Task into rows for the grid
  const rows = useMemo(() => {
    if (!entries.length) return [];

    const rowMap = new Map();
    entries.forEach(entry => {
      const key = `${entry.project_code || entry.project_name}-${entry.task_id}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          project: entry.project_name,
          projectCode: entry.project_code,
          task: entry.task_name || entry.task_id,
          taskId: entry.task_id,
          days: {}
        });
      }

      const row = rowMap.get(key);
      const dateStr = new Date(entry.entry_date).toISOString().split('T')[0];
      row.days[dateStr] = {
        hours: entry.hours + (entry.minutes / 60),
        remarks: entry.remarks
      };
    });

    return Array.from(rowMap.values());
  }, [entries]);

  // Generate 7 days of the week based on timesheet week_start_date
  const weekDays = useMemo(() => {
    if (!timesheet) return [];
    const days = [];
    const [y, m, d_] = timesheet.week_start_date.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d_));
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      days.push(d);
    }
    return days;
  }, [timesheet]);

  const handleApprove = async () => {
    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${server}/api/timesheets/${timesheetId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Timesheet approved');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${server}/api/timesheets/${timesheetId}/reject`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Timesheet rejected');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-2 border-(--primary) border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!timesheet) {
    return <div className="p-10 text-center text-gray-500 font-bold">Timesheet not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto bg-(--app-bg) text-(--text-main)">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-2 text-(--text-muted) hover:text-(--text-main) transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <IoArrowBack /> Back to Approvals
          </button>

          <div className="flex items-center gap-4">
            <UserAvatar name={timesheet.user_name} size="md" className="border-2 border-(--primary-glow)" />
            <div>
              <nav className="flex items-center gap-2 text-[9px] font-black text-(--text-muted) uppercase tracking-widest mb-0.5">
                <span>Review Mode</span>
                <span className="opacity-30">/</span>
                <span className="text-(--primary)">{timesheet.user_name}</span>
              </nav>
              <h1 className="text-2xl font-black text-(--text-main) tracking-tight uppercase leading-none">
                {timesheet.user_name}
              </h1>
              <p className="text-(--text-muted) font-bold text-xs mt-1">
                Week of {new Date(timesheet.week_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 bg-(--glass-surface) p-3 rounded-2xl border border-(--glass-border)">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-(--text-muted) font-black uppercase tracking-widest">Total Hours</span>
            <span className="text-xl font-black text-(--text-main)">{parseFloat(timesheet.total_hours).toFixed(1)}h</span>
          </div>
          <div className="w-px h-8 bg-(--glass-border)" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-(--text-muted) font-black uppercase tracking-widest">Status</span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border ${timesheet.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' :
              timesheet.status === 'rejected' ? 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20' :
                'bg-(--primary-glow) text-(--primary) border-(--primary-glow)'
              }`}>
              {timesheet.status}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-(--glass-border) bg-(--glass-surface) backdrop-blur-xl shadow-2xl">
        <table className="w-full border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="border-b border-(--glass-border) bg-(--hover-bg)">
              <th className="p-3 text-[10px] font-black uppercase text-(--text-muted) w-[180px] text-left">Project</th>
              <th className="p-3 text-[10px] font-black uppercase text-(--text-muted) w-[180px] text-left border-r border-(--glass-border)">Task</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="px-1 py-3 text-center border-b border-(--glass-border)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-(--text-muted)">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <div className="text-xs font-bold text-(--text-main) opacity-80">
                      {day.getUTCDate()}
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-3 text-[10px] font-black uppercase text-(--text-muted) w-[70px] text-center border-l border-(--glass-border)">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--glass-border) text-sm">
            {rows.map((row, rIdx) => {
              let rowTotal = 0;
              return (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-(--primary) uppercase tracking-widest mb-0.5">{row.projectCode}</span>
                      <span className="text-xs font-bold truncate text-(--text-main)">{row.project}</span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-(--glass-border)">
                    <span className="text-[11px] text-(--text-main) opacity-80 font-bold leading-tight line-clamp-2">{row.task}</span>
                  </td>
                  {weekDays.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const cell = row.days[dateStr];
                    rowTotal += cell?.hours || 0;
                    return (
                      <td key={dateStr} className="p-2 text-center relative group/cell">
                        {cell?.hours > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-(--text-main) font-mono font-bold">{cell.hours.toFixed(1) + "h"}</span>
                            {cell.remarks && (
                              <div className="absolute top-1 right-1">
                                <IoChatbubbleEllipsesOutline size={10} className="text-(--primary)" />
                              </div>
                            )}
                            {/* Tooltip for remarks */}
                            {cell.remarks && (
                              <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/cell:block">
                                <div className="bg-(--app-bg) border border-(--glass-border) p-2 rounded-lg shadow-xl text-[10px] text-(--text-muted) min-w-[150px] whitespace-normal">
                                  {cell.remarks}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-(--text-muted) opacity-20">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-black text-(--text-main) border-l border-(--glass-border)">
                    {rowTotal.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-(--hover-bg) border-t border-(--glass-border) font-black">
              <td colSpan={2} className="p-4 text-right text-xs uppercase tracking-widest text-(--text-muted) border-r border-(--glass-border)">Daily Totals</td>
              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const dayTotal = rows.reduce((acc, r) => acc + (r.days[dateStr]?.hours || 0), 0);
                return (
                  <td key={dateStr} className="p-4 text-center text-(--text-main) font-mono">
                    {dayTotal > 0 ? dayTotal.toFixed(1) + "h" : '-'}
                  </td>
                );
              })}
              <td className="p-4 text-center text-(--primary) bg-(--primary-glow)">
                {parseFloat(timesheet.total_hours).toFixed(1) + "h"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Area */}
      {timesheet.status === 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Rejection Feed */}
          <div className="bg-(--glass-surface) p-6 rounded-2xl border border-(--glass-border) space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-(--text-main) flex items-center gap-2">
              <IoCloseCircle className="text-red-500" /> Rejection Notes
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection here... (Mandatory for rejection)"
              className="w-full bg-(--input-bg) border border-(--input-border) rounded-xl p-4 text-sm text-(--text-main) focus:border-red-500/50 outline-none resize-none h-32 transition-colors"
            />
            <button
              onClick={handleReject}
              disabled={reviewLoading || !rejectionReason.trim()}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-500 hover:text-white border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30 shadow-lg"
            >
              Confirm Rejection
            </button>
          </div>

          {/* Approval Summary */}
          <div className="bg-(--glass-surface) p-6 rounded-2xl border border-(--glass-border) space-y-6 shadow-xl">
            <h3 className="text-lg font-black text-(--text-main) flex items-center gap-2">
              <IoCheckmarkCircle className="text-emerald-500" /> Approval Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-(--text-muted) font-bold uppercase tracking-widest text-[10px]">Total Recorded Hours</span>
                <span className="text-(--text-main) font-black">{parseFloat(timesheet.total_hours).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-(--text-muted) font-bold uppercase tracking-widest text-[10px]">Submission Date</span>
                <span className="text-(--text-main) font-black">{new Date(timesheet.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="pt-4 border-t border-(--glass-border)">
                <button
                  onClick={handleApprove}
                  disabled={reviewLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <IoCheckmarkCircle size={20} />
                  Approve Timesheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History of Rejection if exists */}
      {timesheet.status === 'rejected' && timesheet.rejection_reason && (
        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl shadow-sm">
          <h4 className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest mb-2">Previous Rejection Reason</h4>
          <p className="text-(--text-muted) italic">"{timesheet.rejection_reason}"</p>
        </div>
      )}
    </div>
  );
}
