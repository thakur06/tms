import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoPerson, IoEllipsisVertical
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function TimesheetApprovalsPage() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchTimesheets();
  }, [filter]);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = filter === 'all' 
        ? `/api/timesheets/team`
        : `/api/timesheets/team?status=${filter}`;
      
      const response = await axios.get(`http://localhost:4000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
      toast.error('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheetId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:4000/api/timesheets/${timesheetId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Timesheet approved successfully');
      fetchTimesheets();
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      toast.error(error.response?.data?.error || 'Failed to approve timesheet');
    }
  };

  const handleReject = async () => {
    if (!selectedTimesheet || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:4000/api/timesheets/${selectedTimesheet.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Timesheet rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedTimesheet(null);
      fetchTimesheets();
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
      toast.error(error.response?.data?.error || 'Failed to reject timesheet');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <IoCheckmarkCircle size={28} />
            </div>
            Timesheet Approvals
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Review and approve team member timesheets</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Timesheets Table */}
      <div className="ui-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading timesheets...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-12 text-center">
            <IoCalendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No timesheets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((timesheet, index) => (
                  <motion.tr
                    key={timesheet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {timesheet.user_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{timesheet.user_name}</p>
                          <p className="text-xs text-slate-500">{timesheet.user_dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-300">
                        <IoCalendar className="text-slate-500" size={16} />
                        <span className="text-sm">
                          {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <IoTime className="text-indigo-400" size={16} />
                        <span className="text-white font-semibold">{timesheet.total_hours}h</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(timesheet.status)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      {formatDate(timesheet.submitted_at)}
                    </td>
                    <td className="py-4 px-6">
                      {timesheet.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApprove(timesheet.id)}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <IoCheckmarkCircle size={20} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTimesheet(timesheet);
                              setShowRejectModal(true);
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <IoCloseCircle size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative ui-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Reject Timesheet</h3>
            <p className="text-slate-400 text-sm mb-4">
              Please provide a reason for rejecting this timesheet
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="ui-input resize-none h-32 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedTimesheet(null);
                }}
                className="flex-1 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all"
              >
                Reject Timesheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
