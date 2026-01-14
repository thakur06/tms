import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoSearchOutline, 
  IoTrashOutline, 
  IoAdd, 
  IoChevronBackOutline, 
  IoChevronForwardOutline,
  IoLocationOutline,
  IoEllipsisHorizontal
} from 'react-icons/io5'
import { useState, useEffect, useMemo } from 'react'

export default function ProjectsList({ projects, onDeleteProject, onAddProject }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 8 // Increased for full-screen layout

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  useEffect(() => setPage(1), [searchQuery])

  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const displayedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-h-screen bg-white">
      {/* --- SIMPLE HEADER --- */}
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-[2000px] mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Projects
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {filteredProjects.length} projects
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-80 group">
              <IoSearchOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Filter projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-500/30 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[2000px] mx-auto px-6 py-8">
        {/* --- REFINED GRID --- */}
        {filteredProjects.length === 0 ? (
          <EmptyState onReset={() => setSearchQuery('')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {displayedProjects.map((project) => (
                <ProjectCard 
                  key={project.id || project.code} 
                  project={project} 
                  onDelete={() => { setProjectToDelete(project); setShowDeleteModal(true); }} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* --- MOBILE-FIXED PAGINATION --- */}
        {totalPages > 1 && (
          <div className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-8 py-8 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-slate-200 hidden md:block" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Index {page} of {totalPages}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <IoChevronBackOutline size={18} />
              </button>

              {/* Responsive Page Numbers */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .reduce((acc, num) => {
                    // Show first, last, current, and adjacent pages
                    const showOnMobile = num === 1 || num === totalPages || Math.abs(num - page) <= 1;
                    const showOnDesktop = num === 1 || num === totalPages || Math.abs(num - page) <= 2;
                    
                    if ((typeof window !== 'undefined' && window.innerWidth < 640 && showOnMobile) || 
                        (typeof window !== 'undefined' && window.innerWidth >= 640 && showOnDesktop)) {
                      acc.push(num);
                    }
                    return acc;
                  }, [])
                  .map((num, idx, arr) => (
                    <div key={num} className="flex items-center gap-1.5">
                      {idx > 0 && arr[idx-1] !== num - 1 && <span className="text-slate-300 text-xs">...</span>}
                      <button
                        onClick={() => setPage(num)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-xs font-black transition-all ${
                          page === num ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    </div>
                  ))}
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <IoChevronForwardOutline size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- MINIMAL DELETE MODAL --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <IoTrashOutline size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Remove Module</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">Confirm deletion of {projectToDelete?.name}?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button onClick={() => { onDeleteProject(projectToDelete.id); setShowDeleteModal(false); }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectCard({ project, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-[28px] p-8 transition-all duration-300 flex flex-col justify-between h-52 shadow-sm hover:shadow-md overflow-hidden"
    >
      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black text-slate-700 px-3 py-1.5 bg-slate-100 rounded-xl uppercase tracking-wider border border-slate-200 transition-colors">
              {project.code || 'ENG-00'}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {project.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight transition-colors pr-8">
            {project.name}
          </h3>
        </div>
        
        {/* Enhanced Menu Button */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <IoEllipsisHorizontal size={20} />
          </button>
          
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 w-40 z-20"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <IoTrashOutline size={16} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Footer Section */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800 transition-colors">
          <div className="p-1.5 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors">
            <IoLocationOutline size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{project.location || 'Remote Site'}</span>
        </div>
        
        {/* Progress Indicator (if project has progress data) */}
        {project.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
              <span className="text-xs font-black text-slate-600">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-slate-900"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function EmptyState({ onReset }) {
  return (
    <div className="w-full py-24 text-center">
      <h2 className="text-2xl font-black text-slate-900 mb-2">No Results</h2>
      <p className="text-slate-500 text-sm font-medium mb-8">No projects match your current search.</p>
      <button onClick={onReset} className="text-xs font-black uppercase tracking-widest text-slate-600 underline">Reset Search</button>
    </div>
  )
}