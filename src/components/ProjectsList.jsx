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

export default function ProjectsList({ projects, onDeleteProject }) {
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
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-slate-100 text-slate-700',
      completed: 'bg-blue-100 text-blue-700',
      archived: 'bg-amber-100 text-amber-700',
      planning: 'bg-purple-100 text-purple-700'
    }
    return colors[status?.toLowerCase()] || colors.inactive
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Simple Header */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-8">
          <div className="relative">
            <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-xl pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoBusinessOutline className="text-blue-500" size={28} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-500 text-sm mb-6">Try adjusting your search criteria</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
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

        {/* Clean Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-slate-200"
          >
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                        className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                          page === i 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-700 hover:bg-slate-100'
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
                className="p-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IoChevronForwardOutline size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Clean Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={transition}
              className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-xl border border-slate-200"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IoTrashOutline size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Project</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Are you sure you want to delete <span className="font-medium">{projectToDelete?.name}</span>?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="flex-1 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { onDeleteProject(projectToDelete.id); setShowDeleteModal(false); }} 
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
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
  const statusColor = getStatusColor(project.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex flex-col h-full">
        {/* Header with status and menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
           
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                    className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-40"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <IoTrashOutline size={14} />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Project Info */}
        <div className="flex-grow">
          <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
            {project.name}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <IoBusinessOutline className="text-blue-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Code</p>
                <p className="text-sm font-medium text-slate-900 truncate">{project.code || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <IoLocationOutline className="text-emerald-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-900 truncate">{project.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Client info */}
       
      </div>
    </motion.div>
  )
}