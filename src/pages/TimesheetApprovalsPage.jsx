import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoPerson, IoEllipsisVertical, IoEyeOutline, IoClose, IoLocationOutline, IoDocumentTextOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import UserAvatar from '../components/UserAvatar';
export default function TimesheetApprovalsPage() {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      
      const response = await axios.get(`${server}${endpoint}`, {
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

  const fetchTimesheetDetails = async (ts) => {
    setDetailsLoading(true);
    setSelectedTimesheet(ts);
    setShowDetailsModal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/timesheets/${ts.id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedDetails(response.data.entries);
    } catch (error) {
      console.error('Failed to fetch timesheet details:', error);
      toast.error('Failed to load timesheet details');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async (timesheetId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${server}/api/timesheets/${timesheetId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Timesheet approved successfully');
      fetchTimesheets();
      if (showDetailsModal) setShowDetailsModal(false);
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
        `${server}/api/timesheets/${selectedTimesheet.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Timesheet rejected');
      setShowRejectModal(false);
      setShowDetailsModal(false);
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
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
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
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            <span>Operations</span>
            <span className="opacity-30">/</span>
            <span className="text-amber-500">Approvals</span>
          </nav>
          <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <IoCheckmarkCircle size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                Timesheet Approvals
              </h1>
              <p className="text-gray-400 mt-1.5 text-xs font-bold italic">Review and approve team member timesheets</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 min-w-max">
            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 ${
                  filter === tab
                    ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20 scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Timesheets Table */}
      {/* Timesheets Table */}
      <div className="ui-card overflow-hidden bg-zinc-900 border-white/5">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading timesheets...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-12 text-center">
            <IoCalendar className="w-16 h-16 text-white/5 mx-auto mb-4" />
            <p className="text-gray-500">No timesheets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="hidden md:table-cell text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="hidden sm:table-cell text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
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
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={timesheet.user_name} size="md" className="border border-white/10" />
                        <div>
                          <p className="text-white font-black text-sm">{timesheet.user_name}</p>
                          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{timesheet.user_dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <IoCalendar className="text-gray-600" size={16} />
                        <span className="text-sm">
                          {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <IoTime className="text-amber-500" size={14} />
                        <span className="text-white font-black text-sm">{timesheet.total_hours}h</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell py-4 px-6">
                      {getStatusBadge(timesheet.status)}
                    </td>
                    <td className="hidden lg:table-cell py-4 px-6 text-gray-500 text-sm">
                      {formatDate(timesheet.submitted_at)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchTimesheetDetails(timesheet)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <IoEyeOutline size={20} />
                        </button>
                        {timesheet.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(timesheet.id)}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <IoCheckmarkCircle size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTimesheet(timesheet);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <IoCloseCircle size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timesheet Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDetailsModal(false)} />
          <div className="relative ui-modal w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-white/5 bg-zinc-900">
            <div className="ui-modal-header shrink-0 border-white/5">
              <div>
                <h3 className="ui-modal-title flex items-center gap-3 text-white">
                  <IoEyeOutline className="text-amber-500" />
                  Timesheet Details
                </h3>
                {selectedTimesheet && (
                  <p className="text-gray-400 text-sm mt-1 font-medium">
                    {selectedTimesheet.user_name} • {formatDate(selectedTimesheet.week_start_date)} - {formatDate(selectedTimesheet.week_end_date)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white duration-300"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {detailsLoading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 mt-4 font-medium">Fetching detailed entries...</p>
                </div>
              ) : selectedDetails?.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                  <IoTime className="w-16 h-16 text-white/5 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No time entries recorded for this week.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDetails?.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {entry.project_code}
                            </span>
                            <h4 className="text-gray-200 font-bold">{entry.project_name}</h4>
                          </div>
                           <p className="text-sm text-gray-400 flex items-center gap-2">
                             <strong className="text-gray-500 text-xs uppercase tracking-wider">Task:</strong> {entry.task_id}
                          </p>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <IoDocumentTextOutline className="text-gray-500" />
                            {entry.remarks}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Date</p>
                            <p className="text-sm text-gray-300 font-bold flex items-center gap-1.5 justify-end mt-0.5">
                              <IoCalendar size={14} className="text-amber-500" />
                              {formatDate(entry.entry_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Location</p>
                            <p className="text-sm text-gray-300 font-bold flex items-center gap-1.5 justify-end mt-0.5">
                              <IoLocationOutline size={14} className="text-amber-500" />
                              {entry.location}
                            </p>
                          </div>
                          <div className="min-w-[80px] text-right p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Duration</p>
                            <p className="text-lg text-white font-black leading-none mt-1">
                              {entry.hours}h {entry.minutes}m
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {selectedTimesheet?.status === 'pending' && (
              <div className="p-4 sm:p-6 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <IoCloseCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
                  Reject Timesheet
                </button>
                <button
                  onClick={() => handleApprove(selectedTimesheet.id)}
                  className="w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"
                >
                  <IoCheckmarkCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
                  Approve Timesheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative ui-modal p-8 w-full max-w-md shadow-2xl bg-zinc-900 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                <IoCloseCircle size={24} />
              </div>
              <h3 className="ui-modal-title text-white">Reject Timesheet</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed font-medium">
              Please provide a clear reason for rejecting <strong>{selectedTimesheet?.user_name}'s</strong> timesheet. This will be visible to the employee.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Incomplete hours for Wednesday, please verify entries..."
              className="ui-input resize-none h-40 mb-8 p-4 bg-black/20 border-white/10 text-white focus:border-red-500/50"
            />
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="w-full sm:flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-xl sm:rounded-2xl transition-colors border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="w-full sm:flex-1 py-3 sm:py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
