import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoAlertCircle, IoRefresh
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MyTimesheetStatus() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTimesheets();
  }, []);

  const fetchMyTimesheets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/timesheets/my-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch timesheet status:', error);
      toast.error('Failed to load timesheet status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <IoCheckmarkCircle className="text-emerald-400" size={24} />;
      case 'rejected':
        return <IoCloseCircle className="text-red-400" size={24} />;
      default:
        return <IoTime className="text-yellow-400" size={24} />;
    }
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
              <IoCalendar size={28} />
            </div>
            My Timesheet Submissions
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Track the status of your submitted timesheets</p>
        </div>

        <button
          onClick={fetchMyTimesheets}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
        >
          <IoRefresh size={18} />
          Refresh
        </button>
      </header>

      {/* Timesheets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="ui-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading submissions...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="ui-card p-12 text-center">
            <IoCalendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No timesheet submissions yet</p>
            <p className="text-slate-500 text-sm mt-2">Submit your weekly timesheet to see it here</p>
          </div>
        ) : (
          timesheets.map((timesheet, index) => (
            <motion.div
              key={timesheet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="ui-card p-6 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    {getStatusIcon(timesheet.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        Week of {formatDate(timesheet.week_start_date)}
                      </h3>
                      {getStatusBadge(timesheet.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <IoCalendar size={14} />
                        {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <IoTime size={14} />
                        {timesheet.total_hours} hours
                      </span>
                      <span>
                        Submitted: {formatDate(timesheet.submitted_at)}
                      </span>
                    </div>

                    {timesheet.status === 'approved' && timesheet.approved_at && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-sm text-emerald-400">
                          ✓ Approved by {timesheet.approved_by_name} on {formatDate(timesheet.approved_at)}
                        </p>
                      </div>
                    )}

                    {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-400 font-semibold mb-1">
                          <IoAlertCircle className="inline mr-1" />
                          Rejected
                        </p>
                        <p className="text-sm text-slate-300">
                          Reason: {timesheet.rejection_reason}
                        </p>
                        {timesheet.approved_at && (
                          <p className="text-xs text-slate-500 mt-1">
                            Rejected on {formatDate(timesheet.approved_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {timesheet.status === 'pending' && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-400">
                          ⏳ Awaiting manager approval
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
