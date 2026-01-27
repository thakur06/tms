import { Link, useLocation } from 'react-router-dom';
import {
  IoHomeOutline, IoHome,
  IoTimeOutline, IoTime,
  IoDocumentTextOutline, IoDocumentText,
  IoListOutline, IoList,
  IoBriefcaseOutline, IoBriefcase,
  IoLogOutOutline,
  IoCheckmarkCircleOutline, IoCheckmarkCircle,
  IoCalendarOutline, IoCalendar,
  IoPersonOutline, IoPerson,IoAnalyticsOutline,IoAnalytics
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: IoHomeOutline, activeIcon: IoHome },
    { path: '/projects', label: 'Projects', icon: IoBriefcaseOutline, activeIcon: IoBriefcase, adminOnly: true },
    { path: '/tasks', label: 'Tasks', icon: IoListOutline, activeIcon: IoList, adminOnly: true },
    { path: '/time-log', label: 'Time Log', icon: IoTimeOutline, activeIcon: IoTime },
    { path: '/reports', label: 'Reports', icon: IoDocumentTextOutline, activeIcon: IoDocumentText, adminOnly: true },
    { path: '/my-submissions', label: 'My Submissions', icon: IoCalendarOutline, activeIcon: IoCalendar },
    { path: '/approvals', label: 'Approvals', icon: IoCheckmarkCircleOutline, activeIcon: IoCheckmarkCircle, hideIfNoReports: true },
    { path: '/users', label: 'Users', icon: IoPersonOutline, activeIcon: IoPerson, adminOnly: true },
    { path: '/analytics', label: 'Analytics', icon: IoAnalyticsOutline, activeIcon: IoAnalytics, adminOnly: true },
  ];

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  // Filter links based on role and reportsCount
  const visibleLinks = navLinks.filter(link => {
    // Admin sees everything
    if (user?.role === 'admin') return true;
    
    // Check if link is admin-only and user is not admin
    if (link.adminOnly && user?.role !== 'admin') return false;
    
    // Check if link requires reports and user has none
    if (link.hideIfNoReports && (parseInt(user?.reportsCount) || 0) <= 0) return false;
    
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-white/5 z-50 transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-24 flex items-center justify-center border-b border-white/5 bg-black/20">
            <img src="/logo.png" alt="logo" className="h-16 object-contain brightness-0 invert" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {visibleLinks
              .map((link, index) => {
              const active = isActive(link.path);
              const Icon = active ? link.activeIcon : link.icon;
              
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      active 
                        ? 'text-zinc-950 bg-amber-500 shadow-xl shadow-amber-500/20 font-black' 
                        : 'text-zinc-400 hover:text-amber-500 hover:bg-white/5 font-bold'
                    }`}
                  >
                    {active && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 transition-all duration-300 ${active ? 'text-white scale-110 drop-shadow-md' : 'group-hover:text-amber-500 group-hover:scale-110'}`} />
                    <span className="text-sm font-bold tracking-tight">{link.label}</span>
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>


        </div>
      </aside>
    </>
  );
}
