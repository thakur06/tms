import {
  IoCheckmarkCircle, IoCloseCircle, IoTime, IoCalendar,
  IoPerson, IoEllipsisVertical, IoEyeOutline, IoClose, IoLocationOutline, IoDocumentTextOutline, IoDocumentText
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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/team-compliance')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold border border-white/5 transition-all active:scale-95 shadow-lg group"
          >
            <IoDocumentTextOutline size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm">Team Weekly Status</span>
          </button>
          <div className="w-px h-8 bg-white/5 mx-2 hidden lg:block" />

          {/* Filter Tabs - Scrollable on mobile */}
          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 min-w-max">
              {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 ${filter === tab
                      ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20 scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
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
                              onClick={() => handleReject(timesheet)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Reject (Go to Review)"
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

      {/* Timesheet Details Modal removed - replaced by full page review */}
    </div>
  );
}
