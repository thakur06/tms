import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoPerson, IoEllipsisVertical, IoEyeOutline, IoClose, IoLocationOutline, IoDocumentTextOutline, IoDocumentText, IoFilter, IoChevronDown
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import UserAvatar from '../components/UserAvatar';
export default function TimesheetApprovalsPage() {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
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

  const fetchTimesheetDetails = (ts) => {
    navigate(`/approvals/review/${ts.id}`);
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
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      toast.error(error.response?.data?.error || 'Failed to approve timesheet');
    }
  };

  const handleReject = (ts) => {
    navigate(`/approvals/review/${ts.id}`);
  };

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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 bg-(--app-bg) text-(--text-main) min-h-screen">
      {/* Header */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-(--text-muted) uppercase tracking-[0.2em] mb-2">
            <span>Operations</span>
            <span className="opacity-30">/</span>
            <span className="text-(--secondary)">Approvals</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-(--secondary-glow) rounded-lg border border-(--secondary-glow) text-(--secondary)">
              <IoCheckmarkCircle size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-(--text-main) tracking-tight leading-none">
                Timesheet Approvals
              </h1>
              <p className="text-(--text-muted) mt-1.5 text-[10px] font-black uppercase tracking-[0.2em]">Review & approve team member timesheets</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/team-compliance')}
            className="flex items-center gap-2 px-4 py-2 bg-(--hover-bg) hover:bg-(--glass-surface) text-(--text-main) rounded-xl font-bold border border-(--glass-border) transition-all active:scale-95 shadow-lg group"
          >
            <IoDocumentTextOutline size={18} className="text-(--primary) group-hover:scale-110 transition-transform" />
            <span className="text-sm md:block hidden font-black tracking-tighter">WEEKLY STATUS</span>
          </button>
          <div className="w-px h-8 bg-(--glass-border) mx-2 hidden lg:block" />

          <div className="relative w-full lg:w-48">
            <IoFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none bg-(--input-bg) border border-(--input-border) rounded-xl py-2 pl-10 pr-10 text-[13px] font-bold text-(--text-main) focus:outline-none focus:border-(--secondary) transition-colors cursor-pointer shadow-sm"
            >
              <option value="pending" className="bg-(--app-bg)">Pending Approvals</option>
              <option value="approved" className="bg-(--app-bg)">Approved History</option>
              <option value="rejected" className="bg-(--app-bg)">Rejected History</option>
              <option value="all" className="bg-(--app-bg)">All Records</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-(--secondary)">
              <IoChevronDown size={14} />
            </div>
          </div>
        </div>
      </header>

      {/* Timesheets Table */}
      <div className="ui-card overflow-hidden bg-(--glass-surface) border border-(--glass-border) rounded-2xl shadow-2xl">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-(--primary-glow) border-t-(--primary) rounded-full animate-spin mx-auto" />
            <p className="text-(--text-muted) mt-4 font-bold">Loading timesheets...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-12 text-center">
            <IoCalendar className="w-16 h-16 text-(--primary-glow) mx-auto mb-4" />
            <p className="text-(--text-muted) font-bold">No timesheets found in this queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--glass-border) bg-(--hover-bg)">
                  <th className="text-left py-3 px-6 text-xs font-black uppercase text-(--text-muted) tracking-widest">
                    Employee
                  </th>
                  <th className="hidden md:table-cell text-left py-3 px-6 text-xs font-black uppercase text-(--text-muted) tracking-widest">
                    Week
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-black uppercase text-(--text-muted) tracking-widest">
                    Hours
                  </th>
                  <th className="hidden sm:table-cell text-left py-3 px-6 text-xs font-black uppercase text-(--text-muted) tracking-widest">
                    Status
                  </th>
                  <th className="hidden lg:table-cell text-left py-3 px-6 text-xs font-black uppercase text-(--text-muted) tracking-widest">
                    Submitted
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-extrabold text-(--secondary) uppercase tracking-wider">
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
                    className="border-b border-(--glass-border) hover:bg-(--hover-bg) transition-colors group"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={timesheet.user_name} size="sm" className="border border-(--glass-border)" />
                        <div>
                          <p className="text-(--text-main) font-black text-xs leading-tight">{timesheet.user_name}</p>
                          <p className="text-[8px] text-(--text-muted) font-black uppercase tracking-widest leading-tight">{timesheet.user_dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-6">
                      <div className="flex items-center gap-2 text-(--text-muted)">
                        <IoCalendar size={14} />
                        <span className="text-xs font-bold whitespace-nowrap">
                          {formatDate(timesheet.week_start_date)} - {formatDate(timesheet.week_end_date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <IoTime className="text-(--accent)" size={13} />
                        <span className="text-(--text-main) font-black text-xs">{timesheet.total_hours}h</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-6">
                      {getStatusBadge(timesheet.status)}
                    </td>
                    <td className="hidden lg:table-cell py-3 px-6 text-(--text-muted) text-[10px] font-bold italic">
                      {formatDate(timesheet.submitted_at)}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => fetchTimesheetDetails(timesheet)}
                          className="p-1.5 text-(--text-muted) hover:text-(--text-main) hover:bg-(--glass-surface) rounded-lg transition-colors border border-transparent hover:border-(--glass-border)"
                          title="View Details"
                        >
                          <IoEyeOutline size={18} />
                        </button>
                        {timesheet.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(timesheet.id)}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <IoCheckmarkCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(timesheet)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Reject (Go to Review)"
                            >
                              <IoCloseCircle size={18} />
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

      {/* Timesheet Details Modal removed - replaced by full page review */}
    </div>
  );
}
