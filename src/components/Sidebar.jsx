import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IoHomeOutline, IoHome,
  IoTimeOutline, IoTime,
  IoDocumentTextOutline, IoDocumentText,
  IoListOutline, IoList,
  IoBriefcaseOutline, IoBriefcase,
  IoStatsChartOutline, IoStatsChart,
  IoCheckmarkCircleOutline, IoCheckmarkCircle,
  IoCalendarOutline, IoCalendar,
  IoPersonOutline, IoPerson,
  IoPeopleOutline, IoPeople,
  IoAnalyticsOutline, IoAnalytics,
  IoChevronDown, IoChevronForward,
  IoFolderOutline, IoFolderOpen,
  IoShieldCheckmarkOutline, IoShieldCheckmark,
  IoKeyOutline, IoKey,
  IoLayersOutline, IoLayers
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [openFolders, setOpenFolders] = useState(['Workspace', 'Performance', 'Leadership', 'Governance', 'Insights']);

  const toggleFolder = (folder) => {
    setOpenFolders(prev => 
      prev.includes(folder) 
        ? prev.filter(f => f !== folder) 
        : [...prev, folder]
    );
  };

  const menuGroups = [
    {
      name: 'Workspace',
      icon: IoLayersOutline,
      links: [
        { path: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
        { path: '/dashboard', label: 'Dashboard', icon: IoAnalyticsOutline, activeIcon: IoAnalytics },
        { path: '/time-log', label: 'Time Log', icon: IoTimeOutline, activeIcon: IoTime },
      ]
    },
    {
      name: 'Performance',
      icon: IoShieldCheckmarkOutline,
      links: [
        { path: '/my-submissions', label: 'My Submissions', icon: IoCalendarOutline, activeIcon: IoCalendar },
      ]
    },
    {
      name: 'Leadership',
      icon: IoPeopleOutline, // Need to make sure this is imported or use IoPersonOutline
      adminOrManager: true,
      links: [
        { path: '/approvals', label: 'Approvals', icon: IoCheckmarkCircleOutline, activeIcon: IoCheckmarkCircle, hideIfNoReports: true },
        { path: '/team-compliance', label: 'Team Compliance', icon: IoCalendarOutline, activeIcon: IoCalendar },
        { path: '/compliance', label: 'Compliance Report', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
      ]
    },
    {
      name: 'Governance',
      icon: IoKeyOutline,
      adminOnly: true,
      links: [
        { path: '/projects', label: 'Projects', icon: IoBriefcaseOutline, activeIcon: IoBriefcase },
        { path: '/tasks', label: 'Tasks', icon: IoListOutline, activeIcon: IoList },
        { path: '/users', label: 'User Management', icon: IoPersonOutline, activeIcon: IoPerson },
      ]
    },
    {
        name: 'Insights',
        icon: IoStatsChartOutline,
        adminOnly: true,
        links: [
            { path: '/reports-analytics', label: 'Reports & Analytics', icon: IoStatsChartOutline, activeIcon: IoStatsChart },
        ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  // Check if a group should be visible
  const isGroupVisible = (group) => {
    if (user?.role === 'admin') return true;
    if (group.adminOnly && user?.role !== 'admin') return false;
    if (group.adminOrManager && user?.role !== 'admin' && (parseInt(user?.reportsCount) || 0) <= 0) return false;
    return true;
  };

  // Filter links within a group
  const getVisibleLinks = (links) => {
    return links.filter(link => {
        if (user?.role === 'admin') return true;
        if (link.adminOnly && user?.role !== 'admin') return false;
        if (link.hideIfNoReports && (parseInt(user?.reportsCount) || 0) <= 0) return false;
        return true;
    });
  };

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
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto custom-scrollbar">
            {menuGroups
              .filter(group => isGroupVisible(group))
              .map((group, groupIdx) => {
                const visibleGroupLinks = getVisibleLinks(group.links);
                if (visibleGroupLinks.length === 0) return null;
                
                const isOpen = openFolders.includes(group.name);
                const GroupIcon = group.icon;

                return (
                  <div key={group.name} className="space-y-1">
                    {/* Folder Header */}
                    <button
                      onClick={() => toggleFolder(group.name)}
                      className="w-full flex items-center justify-between px-4 py-2 text-gray-500 hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <GroupIcon className={`w-4 h-4 transition-colors ${isOpen ? 'text-amber-500' : 'text-gray-600'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOpen ? 'text-gray-300' : 'text-gray-500'}`}>
                          {group.name}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="text-gray-600 group-hover:text-amber-500"
                      >
                        <IoChevronDown size={12} />
                      </motion.div>
                    </button>

                    {/* Links in Folder */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1 ml-2 border-l border-white/5 pl-2"
                        >
                          {visibleGroupLinks.map((link, linkIdx) => {
                            const active = isActive(link.path);
                            const Icon = active ? link.activeIcon : link.icon;

                            return (
                              <motion.div
                                key={link.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: linkIdx * 0.05 }}
                              >
                                <Link
                                  to={link.path}
                                  onClick={() => window.innerWidth < 1024 && onClose()}
                                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                                    active 
                                      ? 'text-zinc-950 bg-amber-500 shadow-lg shadow-amber-500/20 font-black' 
                                      : 'text-gray-400 hover:text-white hover:bg-white/5 font-bold'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? 'text-white scale-110' : 'text-gray-500 group-hover:text-amber-500 group-hover:scale-110'}`} />
                                  <span className="text-[11px] font-bold tracking-tight">{link.label}</span>
                                  {active && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="ml-auto w-1 h-1 rounded-full bg-white shadow-sm"
                                    />
                                  )}
                                </Link>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
            })}
          </nav>


        </div>
      </aside>
    </>
  );
}
