import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoSearchOutline, 
  IoTrashOutline,
  IoChevronBackOutline, 
  IoChevronForwardOutline,
  IoLocationOutline,
  IoEllipsisHorizontal,
  IoBusinessOutline,
  IoTimeOutline,
  IoCheckmarkCircle
} from 'react-icons/io5'
import { useState, useEffect, useMemo } from 'react'

export default function ProjectsList({ projects, onDeleteProject, headerAction }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Smooth transition config
  const transition = {
    duration: 0.2,
    ease: "easeOut"
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  useEffect(() => setPage(1), [searchQuery])

  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const displayedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize)

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      archived: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      planning: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
    return colors[status?.toLowerCase()] || colors.inactive
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">All Projects</h2>
          <p className="text-sm text-slate-400 mt-1">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {headerAction}
          <div className="relative w-full sm:w-64">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-input pl-10 py-2 h-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="text-center py-16 ui-card"
        >
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <IoBusinessOutline className="text-slate-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No projects found</h3>
          <p className="text-slate-400 text-sm mb-6">Try adjusting your search criteria</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 underline"
          >
            Clear search
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedProjects.map((project, index) => (
            <ProjectCard 
              key={project.id || index} 
              project={project} 
              index={index}
              getStatusColor={getStatusColor}
              onDelete={() => { setProjectToDelete(project); setShowDeleteModal(true); }} 
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-white/[0.02] rounded-xl"
        >
          <div className="text-sm text-slate-500">
            Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IoChevronBackOutline size={16} />
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const pages = []
                const maxVisible = 5
                
                let start = Math.max(1, page - Math.floor(maxVisible / 2))
                let end = Math.min(totalPages, start + maxVisible - 1)
                
                if (end - start < maxVisible - 1) {
                  start = Math.max(1, end - maxVisible + 1)
                }
                
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <motion.button
                      key={i}
                      onClick={() => setPage(i)}
                      whileTap={{ scale: 0.95 }}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        page === i 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {i}
                    </motion.button>
                  )
                }
                
                return pages
              })()}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IoChevronForwardOutline size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={transition}
              className="relative w-full max-w-sm ui-card p-6 border border-white/10 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <IoTrashOutline size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Project</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">{projectToDelete?.name}</span>?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="flex-1 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { onDeleteProject(projectToDelete.id); setShowDeleteModal(false); }} 
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectCard({ project, index, getStatusColor, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative ui-card p-5 hover:bg-white/[0.04] transition-all cursor-default overflow-visible"
    >
      <div className="flex flex-col h-full">
        {/* Header with status and menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(project.status)}`}>
              {project.status || 'Active'}
            </span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <IoEllipsisHorizontal size={16} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-8 bg-[#1e293b] rounded-lg shadow-xl border border-white/10 py-1 z-20 w-40"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <IoTrashOutline size={14} />
                      Delete Project
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Project Info */}
        <div className="flex-grow">
          <h3 className="text-base font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
            {project.name}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <IoBusinessOutline className="text-blue-400" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Code</p>
                <p className="text-sm font-medium text-slate-300 truncate font-mono">{project.code || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <IoLocationOutline className="text-emerald-400" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-300 truncate">{project.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}