import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  IoMenu, IoClose, IoHomeOutline, IoHome,
  IoTimeOutline, IoTime, IoDocumentTextOutline, IoDocumentText
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add shadow on scroll for that "lifted" feel
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: IoHomeOutline, activeIcon: IoHome },
    { path: '/time-log', label: 'Time Log', icon: IoTimeOutline, activeIcon: IoTime },
    { path: '/reports', label: 'Reports', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
  ]

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/')

  return (
    <header className={`sticky top-0 z-[100] transition-all duration-300 ${
      scrolled ? 'py-2' : 'py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`
          relative flex justify-between items-center h-16 px-6 
          transition-all duration-300 rounded-[24px]
          ${scrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/40' 
            : 'bg-white border border-slate-100 shadow-sm'}
        `}>
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center group transition-transform active:scale-95">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src='./fav.png' alt='logo' className='relative w-9 h-9 object-contain' />
            </div>
            <div className="ml-3 leading-tight">
              <h1 className="text-lg font-black text-slate-900 tracking-tight italic">
                BIOGAS<span className="text-blue-600">.</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
                Engineering
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 overflow-hidden ${
                    active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-white shadow-sm border border-slate-100 z-0"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">
                    {active ? <link.activeIcon className="w-4 h-4" /> : <link.icon className="w-4 h-4" />}
                  </span>
                  <span className="relative z-10">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side Action (Profile/Status) */}
          <div className="hidden md:flex items-center gap-4">
             <div className="h-8 w-[1px] bg-slate-200 mx-2" />
             <div className="flex items-center gap-3 pl-2">
                <div className="text-right">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">System Status</p>
                    <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Online
                    </p>
                </div>
             </div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-100 active:scale-90 transition-all"
            >
              {mobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full inset-x-0 mt-4 px-4 md:hidden pointer-events-none"
          >
            <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-4 pointer-events-auto overflow-hidden relative">
              <div className="grid grid-cols-1 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive(link.path) 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <link.activeIcon size={22} />
                    <span className="font-bold text-lg">{link.label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Biogas Engineering v2.0</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}