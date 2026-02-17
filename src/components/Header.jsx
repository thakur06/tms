import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  IoMenu, IoSearchOutline, IoNotificationsOutline,
  IoChevronDown, IoLogOutOutline, IoSunnyOutline, IoMoonOutline, IoDesktopOutline,
  IoPersonAddOutline, IoWarningOutline, IoCheckmarkCircleOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CreateUserModal from './CreateUserModal';
import { toast } from 'react-toastify';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import UserAvatar from './UserAvatar';

export default function Header({ onMenuClick, isCollapsed, onCollapseToggle }) {
  const server = import.meta.env.VITE_SERVER_ADDRESS;
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  // Mapping paths to titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Home';
      case '/dashboard': return 'Dashboard';
      case '/projects': return 'Projects';
      case '/tasks': return 'Tasks';
      case '/time-log': return 'Time Log';
      case '/reports-analytics': return 'Reports & Analytics';
      case '/my-submissions': return 'My Submissions';
      case '/approvals': return 'Approvals';
      case '/users': return 'User Management';
      default: return 'Overview';
    }
  };

  const initials = (user?.name || 'User').charAt(0).toUpperCase();

  // Check Previous Week's Hours
  useEffect(() => {
    const checkPreviousWeekHours = async () => {
      try {
        // Calculate previous week range (Mon-Sun)
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
        const currentMonday = new Date(today);
        currentMonday.setDate(diffToMonday);

        const prevMonday = new Date(currentMonday);
        prevMonday.setDate(currentMonday.getDate() - 7);

        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);

        const startStr = prevMonday.toISOString().split('T')[0];
        const endStr = prevSunday.toISOString().split('T')[0];

        // Fetch entries for logged in user for that range
        const res = await fetch(`${server}/api/time-entries/user/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok) return;

        const data = await res.json();

        // Filter for prev week
        const start = new Date(startStr);
        const end = new Date(endStr);
        end.setHours(23, 59, 59, 999);

        const prevWeekEntries = data.filter(entry => {
          const d = new Date(entry.entry_date);
          return d >= start && d <= end;
        });

        const totalHours = prevWeekEntries.reduce((acc, curr) => acc + (curr.hours || 0) + ((curr.minutes || 0) / 60), 0);

        const alerts = [];
        if (totalHours < 40) {
          alerts.push({
            id: 'low-hrs-prev',
            type: 'warning',
            title: 'Low Hours Alert (Last Week)',
            message: `You logged ${totalHours.toFixed(1)}h last week (${startStr} to ${endStr}). Target: 40h.`,
            time: 'Just now'
          });
        }

        alerts.push({
          id: 'welcome',
          type: 'success',
          title: 'System Update',
          message: 'Welcome to the new Light/Dark theme UI.',
          time: '1d ago'
        });

        setNotifications(alerts);

      } catch (err) {
        console.error("Failed to check hours", err);
      }
    };

    if (user) {
      checkPreviousWeekHours();
    }
  }, [user]);

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <IoSunnyOutline className="w-5 h-5" />;
      case 'dark': return <IoMoonOutline className="w-5 h-5" />;
      default: return <IoDesktopOutline className="w-5 h-5" />;
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      toast.info(`Searching for: ${searchQuery}`);
      // Implement global search logic or redirection here
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b transition-all duration-300 border-white/5 backdrop-blur-xl bg-zinc-950/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg transition-colors 
              text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <IoMenu className="w-6 h-6" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onCollapseToggle}
            className="hidden lg:flex p-2 -ml-2 rounded-lg transition-colors 
              text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <IoMenu className="w-5 h-5" />
            </motion.div>
          </button>

          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
              <span>Overview</span>
              <span className="opacity-20">/</span>
              <span className="text-amber-500">{getPageTitle()}</span>
            </nav>
            <h2 className="text-xl font-black tracking-tight text-white transition-colors uppercase leading-none">{getPageTitle()}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - hidden on small mobile */}
          {/* <div className="hidden md:flex relative group">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors
              text-slate-400 group-focus-within:text-indigo-600
              dark:text-slate-500 dark:group-focus-within:text-indigo-400" />
            <input 
              type="text" 
              placeholder="Search tasks, projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="h-10 pl-10 pr-4 rounded-full text-sm transition-all w-64 outline-none border
                bg-slate-100 border-transparent text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                dark:bg-white/5 dark:border-white/5 dark:text-slate-200 dark:focus:bg-white/10 dark:focus:border-indigo-500/50 dark:focus:ring-0"
            />
          </div> */}

          {/* Theme Toggle */}
          {/* <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full transition-colors
              text-slate-500 hover:bg-slate-100 hover:text-indigo-600
              dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
          >
            {getThemeIcon()}
          </button> */}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2.5 rounded-xl transition-all duration-200 text-gray-500 hover:bg-amber-500/10 hover:text-amber-500 border border-transparent hover:border-amber-500/20">
              <IoNotificationsOutline className="w-5 h-5" />
              {notifications.some(n => n.type === 'warning') && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full box-content border-2 border-zinc-900" />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 sm:right-0 top-full mt-2 w-80 max-sm:fixed max-sm:inset-x-4 max-sm:mx-auto max-sm:top-20 max-sm:w-auto rounded-2xl shadow-xl z-20 border overflow-hidden
                      bg-zinc-900 border-white/10 shadow-black/50"
                  >
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <span className="font-semibold text-sm text-white">Notifications</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">{notifications.length} New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="flex gap-3">
                              <div className={`mt-0.5 shrink-0 ${n.type === 'warning' ? 'text-red-500' : 'text-emerald-500'}`}>
                                {n.type === 'warning' ? <IoWarningOutline size={18} /> : <IoCheckmarkCircleOutline size={18} />}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-200 line-clamp-1">{n.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                                <p className="text-[10px] text-gray-600 mt-2">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-xl transition-all duration-200 border border-white/5 hover:bg-white/5 hover:border-white/10 shadow-sm"
            >
              <UserAvatar
                name={user?.name}
                email={user?.email}
                size="sm"
                className="rounded-lg shadow-md border border-white/5"
              />
              <span className="hidden md:block text-sm font-bold text-gray-200">{user?.name}</span>
              <IoChevronDown className={`w-4 h-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''} text-gray-500`} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl shadow-xl z-20 border
                      bg-zinc-900 border-white/10 shadow-black/50"
                  >
                    <div className="px-3 py-2 border-b mb-1 border-white/5">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 text-truncate">{user?.email}</p>
                    </div>

                    {user?.is_manager && (
                      <button
                        onClick={() => { setUserMenuOpen(false); setShowCreateUserModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                          text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        <IoPersonAddOutline className="w-4 h-4" />
                        Add New User
                      </button>
                    )}

                    <button
                      onClick={() => { setUserMenuOpen(false); setShowLogoutConfirm(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                        text-red-500 hover:bg-red-500/10"
                    >
                      <IoLogOutOutline className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={(newUser) => {
          // You might trigger a global user refresh here if needed
          console.log("New user created:", newUser);
        }}
      />

      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </>
  );
}