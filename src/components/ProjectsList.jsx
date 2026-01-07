import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoFolderOutline, 
  IoLocationOutline, 
  IoCodeOutline, 
  IoTrashOutline, 
  IoClose,
  IoTimeOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoAdd,
  IoChevronForwardOutline,
  IoChevronBackOutline,
  IoEllipsisVertical,
  IoArrowForward,
  IoGlobeOutline
} from 'react-icons/io5'
import { useState, useEffect, useRef } from 'react'

export default function ProjectsList({ projects, onDeleteProject, onAddProject }) {
  // Enhanced Logo Component with responsive sizing
  const Logo = () => (
    <div className="relative group cursor-pointer">
      {/* Animated Background Effect */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-emerald-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
      
      {/* Main Logo Container */}
      <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Logo Image */}
        <img 
          src='./fav.png' 
          alt='logo' 
          className='w-6 h-6 sm:w-8 sm:h-8 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3' 
        />
        
        {/* Interactive Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-blue-400/20 rounded-tl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/20 rounded-br-xl" />
      </div>
      
      {/* Floating Particles on Hover */}
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" />
      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping delay-150" />
    </div>
  )

  const [projectToDelete, setProjectToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const pageSize = 6
  const containerRef = useRef(null)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Project Color Logic
  const getProjectTheme = (projectName) => {
    const themes = [
      { 
        bg: 'bg-blue-50', 
        text: 'text-blue-600', 
        icon: 'bg-gradient-to-br from-blue-500 to-blue-600', 
        border: 'border-blue-100',
        progress: 'from-blue-400 to-blue-500'
      },
      { 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-600', 
        icon: 'bg-gradient-to-br from-indigo-500 to-purple-600', 
        border: 'border-indigo-100',
        progress: 'from-indigo-400 to-purple-500'
      },
      { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-600', 
        icon: 'bg-gradient-to-br from-emerald-500 to-teal-600', 
        border: 'border-emerald-100',
        progress: 'from-emerald-400 to-teal-500'
      },
      { 
        bg: 'bg-violet-50', 
        text: 'text-violet-600', 
        icon: 'bg-gradient-to-br from-violet-500 to-purple-600', 
        border: 'border-violet-100',
        progress: 'from-violet-400 to-purple-500'
      },
      { 
        bg: 'bg-rose-50', 
        text: 'text-rose-600', 
        icon: 'bg-gradient-to-br from-rose-500 to-pink-600', 
        border: 'border-rose-100',
        progress: 'from-rose-400 to-pink-500'
      },
    ]
    const index = projectName ? projectName.length % themes.length : 0
    return themes[index]
  }

  // Responsive page size
  const responsivePageSize = isMobile ? 4 : pageSize
  const displayedProjects = projects.slice((page - 1) * responsivePageSize, page * responsivePageSize)
  const totalPages = Math.ceil(projects.length / responsivePageSize)

  // Improved pagination logic for mobile
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    let start = Math.max(2, page - 1)
    let end = Math.min(totalPages - 1, page + 1)
    
    if (page <= 3) {
      start = 2
      end = 4
    } else if (page >= totalPages - 2) {
      start = totalPages - 3
      end = totalPages - 1
    }
    
    const pages = [1]
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-8 md:pb-12 px-3 md:px-6">
      
      {/* --- REFINED HEADER & STATS --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
        
            <div className="space-y-1">
              
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Active Projects <span className="text-slate-400 font-light">({projects.length})</span>
              </h1>
            </div>
          </div>
        </div>

      </div>

      {/* --- QUICK STATS GRID - Responsive --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { 
            label: 'In Progress', 
            val: projects.length, 
            icon: <IoStatsChartOutline />, 
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          },
          { 
            label: 'Total Sites', 
            val: new Set(projects.map(p => p.location)).size, 
            icon: <IoLocationOutline />, 
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          { 
            label: 'Teams', 
            val: projects.reduce((acc, p) => acc + (p.members || 0), 0), 
            icon: <IoPeopleOutline />, 
            color: 'text-violet-600',
            bg: 'bg-violet-50'
          },
          { 
            label: 'Uptime', 
            val: '98%', 
            icon: <IoTimeOutline />, 
            color: 'text-amber-600',
            bg: 'bg-amber-50'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
            <div className={`p-2 md:p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <div className="text-lg md:text-xl">{stat.icon}</div>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
              <p className="text-lg md:text-xl font-black text-slate-800 leading-none">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- PROJECTS GRID - Responsive --- */}
      {projects.length === 0 ? (
        <EmptyState onAdd={onAddProject} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6" ref={containerRef}>
          <AnimatePresence mode="popLayout">
            {displayedProjects.map((project) => {
              const theme = getProjectTheme(project.name)
              return (
                <motion.div
                  layout
                  key={project.id || project.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-5 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon and Actions */}
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${theme.icon} flex items-center justify-center text-white shadow-lg`}>
                        <IoFolderOutline size={isMobile ? 20 : 24} />
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setProjectToDelete(project); setShowDeleteModal(true); }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete project"
                        >
                          <IoTrashOutline size={isMobile ? 16 : 18} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 tracking-tighter uppercase">
                          {project.code}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-xs text-slate-500">{project.status}</span>
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed">
                        {project.description || "No project description provided for this engineering module."}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 mb-4 md:mb-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoLocationOutline className="text-slate-400 flex-shrink-0" size={isMobile ? 14 : 16} />
                        <span className="text-xs font-semibold truncate">{project.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoPeopleOutline className="text-slate-400 flex-shrink-0" size={isMobile ? 14 : 16} />
                        <span className="text-xs font-semibold">{project.members || 0} Members</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="pt-3 md:pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                      <span className="text-xs font-bold text-slate-900">74%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '74%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full bg-gradient-to-r ${theme.progress} rounded-full`}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- ENHANCED PAGINATION - Mobile Responsive --- */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 md:pt-8">
          {/* Page Info */}
          <div className="text-sm text-slate-600">
            Showing <span className="font-bold">{(page - 1) * responsivePageSize + 1}</span> -{' '}
            <span className="font-bold">{Math.min(page * responsivePageSize, projects.length)}</span> of{' '}
            <span className="font-bold">{projects.length}</span> projects
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 md:p-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-1"
              aria-label="Previous page"
            >
              <IoChevronBackOutline className="text-lg" />
              <span className="hidden sm:inline text-sm font-medium">Prev</span>
            </button>
            
            {/* Page Numbers - Responsive */}
            <div className="flex items-center gap-1">
              {visiblePages.map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum 
                        ? 'bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>
            
            {/* Next Button */}
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 md:p-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-1"
              aria-label="Next page"
            >
              <span className="hidden sm:inline text-sm font-medium">Next</span>
              <IoChevronForwardOutline className="text-lg" />
            </button>
          </div>
          
          {/* Mobile Page Jump (Optional) */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Go to:</span>
              <select 
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* --- ENHANCED DELETE MODAL - Responsive --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl mx-4"
            >
              <div className="space-y-4 md:space-y-6">
                {/* Warning Icon */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-50 to-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                    <IoTrashOutline size={isMobile ? 28 : 32} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 text-center">Delete Project?</h3>
                </div>
                
                {/* Warning Message */}
                <div className="text-center">
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                    <span className="font-bold text-slate-800">{projectToDelete?.name}</span> will be permanently deleted along with all associated data.
                  </p>
                  <p className="text-red-500 text-xs md:text-sm mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-700 rounded-xl md:rounded-2xl font-bold hover:bg-slate-200 transition-colors text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { 
                      onDeleteProject(projectToDelete.id)
                      setShowDeleteModal(false)
                    }}
                    className="flex-1 py-3 md:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl md:rounded-2xl font-bold hover:shadow-lg hover:shadow-red-200 transition-all text-sm md:text-base"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-12 md:py-20 bg-gradient-to-b from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-300/50">
      <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-slate-100 to-white rounded-2xl md:rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 md:mb-6 text-slate-400">
        <IoFolderOutline size={isMobile ? 32 : 48} />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 px-4">No Projects Found</h2>
      <p className="text-slate-500 max-w-xs mx-auto mb-6 md:mb-8 px-4">
        Ready to start a new engineering project? Kick things off in seconds.
      </p>
      <button 
        onClick={onAdd} 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white px-6 md:px-8 py-3 rounded-xl md:rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform"
      >
        <IoAdd className="text-lg" />
        Create First Project
      </button>
    </div>
  )
}