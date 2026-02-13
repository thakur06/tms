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
    const start = new Date(timesheet.week_start_date);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
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
        <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!timesheet) {
    return <div className="p-10 text-center text-gray-500 font-bold">Timesheet not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <IoArrowBack /> Back to Approvals
          </button>

          <div className="flex items-center gap-4">
            <UserAvatar name={timesheet.user_name} size="lg" className="border-2 border-amber-500/20" />
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                <span>Review Mode</span>
                <span className="opacity-30">/</span>
                <span className="text-amber-500">{timesheet.user_name}</span>
              </nav>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Review: {timesheet.user_name}
              </h1>
              <p className="text-gray-500 font-bold text-sm mt-1">
                Week of {new Date(timesheet.week_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Hours</span>
            <span className="text-2xl font-black text-white">{parseFloat(timesheet.total_hours).toFixed(1)}h</span>
          </div>
          <div className="w-px h-10 bg-white/5" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</span>
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mt-1 border ${timesheet.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                timesheet.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
              {timesheet.status}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
        <table className="w-full border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="border-b border-white/5 bg-zinc-900">
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[200px] text-left">Project</th>
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[200px] text-left border-r border-white/5">Task</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="px-2 py-4 text-center border-b border-white/5">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <div className="text-sm font-bold text-gray-300">
                      {day.getDate()}
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-4 text-xs font-black uppercase text-gray-500 w-[80px] text-center border-l border-white/5">Row Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {rows.map((row, rIdx) => {
              let rowTotal = 0;
              return (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest mb-0.5">{row.projectCode}</span>
                      <span className="text-white font-bold truncate">{row.project}</span>
                    </div>
                  </td>
                  <td className="p-4 border-r border-white/5">
                    <span className="text-gray-200 font-bold truncate text-wrap max-w-3">{row.task}</span>
                  </td>
                  {weekDays.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const cell = row.days[dateStr];
                    rowTotal += cell?.hours || 0;
                    return (
                      <td key={dateStr} className="p-2 text-center relative group/cell">
                        {cell?.hours > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-white font-mono font-bold">{cell.hours.toFixed(1) + "h"}</span>
                            {cell.remarks && (
                              <div className="absolute top-1 right-1">
                                <IoChatbubbleEllipsesOutline size={10} className="text-amber-500/50" />
                              </div>
                            )}
                            {/* Tooltip for remarks */}
                            {cell.remarks && (
                              <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/cell:block">
                                <div className="bg-zinc-800 border border-white/10 p-2 rounded-lg shadow-xl text-[10px] text-gray-300 min-w-[150px] whitespace-normal">
                                  {cell.remarks}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-800">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-black text-white border-l border-white/5">
                    {rowTotal.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900 border-t border-white/5 font-black">
              <td colSpan={2} className="p-4 text-right text-xs uppercase tracking-widest text-gray-500 border-r border-white/5">Daily Totals</td>
              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const dayTotal = rows.reduce((acc, r) => acc + (r.days[dateStr]?.hours || 0), 0);
                return (
                  <td key={dateStr} className="p-4 text-center text-white font-mono">
                    {dayTotal > 0 ? dayTotal.toFixed(1) + "h" : '-'}
                  </td>
                );
              })}
              <td className="p-4 text-center text-amber-500 bg-amber-500/5">
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
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <IoCloseCircle className="text-red-500" /> Rejection Notes
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection here... (Mandatory for rejection)"
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-red-500/50 outline-none resize-none h-32 transition-colors"
            />
            <button
              onClick={handleReject}
              disabled={reviewLoading || !rejectionReason.trim()}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30"
            >
              Confirm Rejection
            </button>
          </div>

          {/* Approval Summary */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <IoCheckmarkCircle className="text-emerald-500" /> Approval Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Recorded Hours</span>
                <span className="text-white font-black">{parseFloat(timesheet.total_hours).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Submission Date</span>
                <span className="text-white font-black">{new Date(timesheet.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="pt-4 border-t border-white/5">
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
        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Previous Rejection Reason</h4>
          <p className="text-gray-300 italic">"{timesheet.rejection_reason}"</p>
        </div>
      )}
    </div>
  );
}
