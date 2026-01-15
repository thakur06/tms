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
  IoPersonOutline, IoPerson
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: IoHomeOutline, activeIcon: IoHome },
    { path: '/projects', label: 'Projects', icon: IoBriefcaseOutline, activeIcon: IoBriefcase },
    { path: '/tasks', label: 'Tasks', icon: IoListOutline, activeIcon: IoList },
    { path: '/time-log', label: 'Time Log', icon: IoTimeOutline, activeIcon: IoTime },
    { path: '/reports', label: 'Reports', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
    { path: '/my-submissions', label: 'My Submissions', icon: IoCalendarOutline, activeIcon: IoCalendar },
    { path: '/approvals', label: 'Approvals', icon: IoCheckmarkCircleOutline, activeIcon: IoCheckmarkCircle, managerOnly: true },
    { path: '/users', label: 'Users', icon: IoPersonOutline, activeIcon: IoPerson, managerOnly: true },
  ];

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

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
        className={`fixed top-0 left-0 h-full w-64 bg-[#0b1221]/90 backdrop-blur-xl border-r border-white/5 z-50 transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
            <div className="relative flex items-center justify-center rounded-xl  ">
              <img src="/logo.png" alt="logo" className=" h-28 w-40 object-contain" />
            </div>
            {/* <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Biogas</h1>
              <p className="text-[10px] font-medium text-indigo-400 tracking-wider uppercase">Engineering</p>
            </div> */}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks
              .filter(link => !link.managerOnly || user?.is_manager)
              .map((link) => {
              const active = isActive(link.path);
              const Icon = active ? link.activeIcon : link.icon;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active 
                      ? 'text-white bg-indigo-500/10 border border-indigo-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
                  <span className="font-medium text-sm tracking-wide">{link.label}</span>
                </Link>
              );
            })}
          </nav>


        </div>
      </aside>
    </>
  );
}
