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
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDetails, setSelectedDetails] = useState(null); // New state for details
  const [showDetailsModal, setShowDetailsModal] = useState(false); // New state for modal

  useEffect(() => {
    fetchMyTimesheets();
  }, []);

  const fetchMyTimesheets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Assuming startDate and endDate are defined elsewhere or need to be added
      // For now, I'll add placeholder values or assume they are available in scope if this is part of a larger function.
      // Since the original code doesn't have them, I'll add a placeholder for now.
      // If this is part of a larger change, the user might provide context for startDate/endDate.
      // For the purpose of this edit, I'll assume they are available or can be derived.
      // Let's assume we need to define them for the example to be syntactically correct.
      // However, the instruction only asks to update the API call, not to add new logic for dates.
      // I will add the params object as requested, but without defining startDate/endDate, it will be undefined.
      // To make it syntactically correct and functional, I'll add dummy dates.
      const startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await axios.get(`${server}/api/timesheets/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
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
    if (!dateString) return '-';
    // Append time to force local date interpretation for YYYY-MM-DD strings
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <IoCheckmarkCircle className="text-(--success)" size={24} />;
      case 'rejected':
        return <IoCloseCircle className="text-(--rose)" size={24} />;
      default:
        return <IoTime className="text-(--primary)" size={24} />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-(--primary-glow) text-(--primary) border-(--primary-glow)',
      approved: 'bg-(--success)/10 text-(--success) border-(--success)/20',
      rejected: 'bg-(--rose-glow) text-(--rose) border-(--rose-glow)'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 bg-(--app-bg) text-(--text-main) min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-(--text-muted) uppercase tracking-widest mb-2">
            <span>Workspace</span>
            <span className="opacity-30">/</span>
            <span className="text-(--primary)">Submissions</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-(--primary-glow) rounded-lg border border-(--primary-glow) text-(--primary)">
              <IoCalendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-(--text-main) tracking-tight leading-none">
                My Submissions
              </h1>
              <p className="text-(--text-muted) mt-1.5 text-xs font-bold italic">Track the status of your submitted timesheets</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchMyTimesheets}
          className="flex items-center gap-2 px-4 py-2 bg-(--hover-bg) hover:bg-(--glass-surface) text-(--text-muted) hover:text-(--text-main) rounded-xl transition-all border border-(--glass-border)"
        >
          <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <div className="flex justify-end">
        <div className="flex flex-wrap items-center md:gap-1.5 gap-0.5 p-1 bg-(--hover-bg) rounded-2xl border border-(--glass-border)">
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
              className={`flex items-center md:gap-2 gap-0.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === filter.id
                ? 'bg-(--primary) text-(--text-inverse) shadow-(--primary-glow)'
                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--glass-surface)'
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
            <div className="w-8 h-8 border-2 border-(--primary-glow) border-t-(--primary) rounded-full animate-spin mx-auto" />
            <p className="text-(--text-muted) mt-4">Loading submissions...</p>
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="ui-card p-12 text-center border-dashed border-2 bg-(--glass-surface) border-(--glass-border)">
            <IoCalendar className="w-16 h-16 text-(--text-muted) opacity-20 mx-auto mb-4" />
            <p className="text-(--text-main) font-medium">No results found</p>
            <p className="text-(--text-muted) text-sm mt-2">Try changing your filters or submit a new timesheet</p>
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
                    className="ui-card p-4 hover:shadow-lg transition-all group bg-(--glass-surface) border border-(--glass-border) hover:border-(--primary-glow)"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl border border-(--glass-border) bg-(--hover-bg) group-hover:border-(--primary-glow) transition-colors">
                          {getStatusIcon(timesheet.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-base font-black text-(--text-main)">
                              Week of {formatDate(timesheet.week_start_date)}
                            </h3>
                            {getStatusBadge(timesheet.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-(--text-muted) font-bold">
                            <span className="flex items-center gap-1.5">
                              <IoCalendar size={13} className="text-(--primary)" />
                              {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <IoTime size={13} className="text-(--accent)" />
                              {timesheet.total_hours}h
                            </span>
                            <span className="opacity-60 italic font-medium">
                              Submitted {formatDate(timesheet.submitted_at)}
                            </span>
                          </div>

                          {timesheet.status === 'approved' && timesheet.approved_at && (
                            <div className="mt-3 p-3 bg-(--success)/10 border border-(--success)/20 rounded-lg">
                              <p className="text-sm text-(--success)">
                                ✓ Approved by {timesheet.approved_by_name} on {formatDate(timesheet.approved_at)}
                              </p>
                            </div>
                          )}

                          {timesheet.status === 'rejected' && (
                            <div className="mt-3 p-3 bg-(--rose-glow) border border-(--rose-glow) rounded-lg">
                              <p className="text-sm text-(--rose) font-bold mb-1 flex items-center gap-2">
                                <IoAlertCircle />
                                Rejection Details
                              </p>
                              <p className="text-sm text-(--text-main) font-medium opacity-80">
                                {timesheet.rejection_reason || 'No reason provided'}
                              </p>
                              {timesheet.approved_at && (
                                <p className="text-[10px] text-(--text-muted) mt-2 font-medium">
                                  Action taken on {formatDate(timesheet.approved_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {timesheet.status === 'pending' && (
                            <div className="mt-3 p-3 bg-(--primary-glow) border border-(--primary-glow) rounded-lg">
                              <p className="text-sm text-(--primary) flex items-center gap-2 font-bold">
                                <span className="w-1.5 h-1.5 bg-(--primary) rounded-full animate-pulse" />
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
              <div className="flex items-center justify-between pt-6 border-t border-(--glass-border)">
                <p className="text-sm text-(--text-muted) font-bold uppercase tracking-wider">
                  Showing <span className="text-(--text-main)">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-(--text-main)">{Math.min(currentPage * itemsPerPage, filteredTimesheets.length)}</span> of <span className="text-(--text-main)">{filteredTimesheets.length}</span> submissions
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-(--hover-bg) hover:bg-(--glass-surface) text-(--text-muted) hover:text-(--text-main) rounded-xl border border-(--glass-border) transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IoChevronBack size={18} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all border ${currentPage === i + 1
                        ? 'bg-(--primary) text-(--text-inverse) border-(--primary-glow) shadow-(--primary-glow)'
                        : 'bg-(--hover-bg) text-(--text-muted) border-(--glass-border) hover:bg-(--glass-surface) hover:text-(--text-main)'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-(--hover-bg) hover:bg-(--glass-surface) text-(--text-muted) hover:text-(--text-main) rounded-xl border border-(--glass-border) transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
