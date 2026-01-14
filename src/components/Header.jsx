import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  IoMenu, IoClose,
  IoHomeOutline, IoHome,
  IoTimeOutline, IoTime,
  IoDocumentTextOutline, IoDocumentText,
  IoListOutline, IoList,
  IoBriefcaseOutline, IoBriefcase,
  IoLogOutOutline, IoChevronDown
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = (user?.name || 'User').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/auth')
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: IoHomeOutline, activeIcon: IoHome },
    { path: '/projects', label: 'Projects', icon: IoBriefcaseOutline, activeIcon: IoBriefcase },
    { path: '/tasks', label: 'Tasks', icon: IoListOutline, activeIcon: IoList },
    { path: '/time-log', label: 'Time Log', icon: IoTimeOutline, activeIcon: IoTime },
    { path: '/reports', label: 'Reports', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
  ]

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/')

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60' : 'bg-white border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative h-10 w-10  p-[2px] overflow-hidden">
                <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full w-full  bg-white grid place-items-center">
                  <img src="./fav.png" alt="logo" className="h-8 w-8 object-contain" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-900">Biogas</span>
                  <span className="text-sm font-semibold text-emerald-600">Engineering</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 tracking-wide uppercase">Time Tracking System</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.path)
                const Icon = active ? link.activeIcon : link.icon
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all `}
                  >
                    <Icon className={`w-4 h-4 ${
                      active 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-black hover:text-slate-900 hover:bg-slate-50'
                    }`} />
                    <span className={`${
                      active 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-black hover:text-slate-900 hover:bg-slate-50'
                    }`}>{link.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </p>
                  </div>
                  <IoChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden lg:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20"
                      >
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'user@biogas.com'}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                        >
                          <IoLogOutOutline className="w-4 h-4" />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              {mobileMenuOpen ? (
                <IoClose className="w-6 h-6 text-slate-700" />
              ) : (
                <IoMenu className="w-6 h-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full  bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 bg-transparent">
                  
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <IoClose className="w-6 h-6 text-slate-700" />
                  </button>
                </div>

                {/* User Info */}
                <div className="px-6 py-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white font-bold shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-black flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active now
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                  <div className="space-y-1">
                    {navLinks.map((link) => {
                      const active = isActive(link.path)
                      const Icon = active ? link.activeIcon : link.icon
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-black hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm text-black">{link.label}</span>
                          {active && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-600" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </nav>

                {/* Logout Button */}
                <div className="px-4 py-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:bg-red-200 transition-colors"
                  >
                    <IoLogOutOutline className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-18" />
    </>
  )
}