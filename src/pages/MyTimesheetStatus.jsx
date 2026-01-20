import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoAlertCircle, IoRefresh, IoFilterOutline, IoChevronBack, IoChevronForward
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MyTimesheetStatus() {
  const server=import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetchMyTimesheets();
  }, []);

  const fetchMyTimesheets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/timesheets/my-status`, {
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

  const filteredTimesheets = useMemo(() => {
    if (activeFilter === 'all') return timesheets;
    return timesheets.filter(ts => ts.status === activeFilter);
  }, [timesheets, activeFilter]);

  const paginatedTimesheets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTimesheets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTimesheets, currentPage]);

  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);

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
            My Submissions
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Track the status of your submitted timesheets</p>
        </div>

        <button
          onClick={fetchMyTimesheets}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
        >
          <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
          {[
            { id: 'all', label: 'All', icon: IoFilterOutline },
            { id: 'pending', label: 'Pending', icon: IoTime },
            { id: 'approved', label: 'Approved', icon: IoCheckmarkCircle },
            { id: 'rejected', label: 'Rejected', icon: IoCloseCircle }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <filter.icon size={14} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timesheets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="ui-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading submissions...</p>
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="ui-card p-12 text-center border-dashed border-2">
            <IoCalendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No results found</p>
            <p className="text-slate-500 text-sm mt-2">Try changing your filters or submit a new timesheet</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeFilter + currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {paginatedTimesheets.map((timesheet, index) => (
                  <motion.div
                    key={timesheet.id}
                    layoutIdx={timesheet.id}
                    className="ui-card p-6 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all group border border-white/5 hover:border-indigo-500/30"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-indigo-500/30 transition-colors">
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
                              <IoCalendar size={14} className="text-indigo-400" />
                              {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <IoTime size={14} className="text-indigo-400" />
                              {timesheet.total_hours} hours
                            </span>
                            <span className="text-slate-500">
                              Submitted {formatDate(timesheet.submitted_at)}
                            </span>
                          </div>

                          {timesheet.status === 'approved' && timesheet.approved_at && (
                            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <p className="text-sm text-emerald-400">
                                ✓ Approved by {timesheet.approved_by_name} on {formatDate(timesheet.approved_at)}
                              </p>
                            </div>
                          )}

                          {timesheet.status === 'rejected' && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-sm text-red-400 font-bold mb-1 flex items-center gap-2">
                                <IoAlertCircle />
                                Rejection Details
                              </p>
                              <p className="text-sm text-slate-300">
                                {timesheet.rejection_reason || 'No reason provided'}
                              </p>
                              {timesheet.approved_at && (
                                <p className="text-[10px] text-slate-500 mt-2">
                                  Action taken on {formatDate(timesheet.approved_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {timesheet.status === 'pending' && (
                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-sm text-yellow-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                Awaiting manager review
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-sm text-slate-500 font-medium">
                  Showing <span className="text-white">{(currentPage-1)*itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage*itemsPerPage, filteredTimesheets.length)}</span> of <span className="text-white">{filteredTimesheets.length}</span> submissions
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IoChevronBack size={18} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IoChevronForward size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
