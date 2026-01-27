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
        return <IoCloseCircle className="text-red-500" size={24} />;
      default:
        return <IoTime className="text-amber-500" size={24} />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20'
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
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            <span>Workspace</span>
            <span className="opacity-30">/</span>
            <span className="text-amber-500/60">Submissions</span>
          </nav>
          <div className="flex items-center gap-4">
           <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <IoCalendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                My Submissions
              </h1>
              <p className="text-gray-500 mt-1.5 text-xs font-bold italic">Track the status of your submitted timesheets</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchMyTimesheets}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all border border-gray-200"
        >
          <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200">
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
                  ? 'bg-amber-800/60 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
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
            <div className="w-8 h-8 border-2 border-blue-200 border-t-[#161efd] rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Loading submissions...</p>
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="ui-card p-12 text-center border-dashed border-2">
            <IoCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No results found</p>
            <p className="text-gray-500 text-sm mt-2">Try changing your filters or submit a new timesheet</p>
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
                    className="ui-card p-6 hover:shadow-lg transition-all group border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3  rounded-xl border border-gray-200 group-hover:border-blue-300 transition-colors">
                          {getStatusIcon(timesheet.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-light">
                              Week of {formatDate(timesheet.week_start_date)}
                            </h3>
                            {getStatusBadge(timesheet.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <IoCalendar size={14} className="text-amber-500/60" />
                              {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <IoTime size={14} className="text-amber-500/60" />
                              {timesheet.total_hours} hours
                            </span>
                            <span className="text-gray-500">
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
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                              <p className="text-sm text-red-600 font-bold mb-1 flex items-center gap-2">
                                <IoAlertCircle />
                                Rejection Details
                              </p>
                              <p className="text-sm text-gray-700 font-medium">
                                {timesheet.rejection_reason || 'No reason provided'}
                              </p>
                              {timesheet.approved_at && (
                                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                  Action taken on {formatDate(timesheet.approved_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {timesheet.status === 'pending' && (
                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <p className="text-sm text-amber-600 flex items-center gap-2 font-bold">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
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
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                  Showing <span className="text-gray-900">{(currentPage-1)*itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage*itemsPerPage, filteredTimesheets.length)}</span> of <span className="text-gray-900">{filteredTimesheets.length}</span> submissions
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IoChevronBack size={18} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all border ${
                        currentPage === i + 1
                          ? 'bg-amber-500 text-white border-amber-500/60 shadow-lg shadow-blue-500/25'
                          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
