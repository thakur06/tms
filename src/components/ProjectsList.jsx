import { motion, AnimatePresence } from 'framer-motion'
import {
  IoSearchOutline,
  IoTrashOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoLocationOutline,
  IoEllipsisHorizontal,
  IoBusinessOutline,
  IoPencilOutline,

} from 'react-icons/io5'
import { useState, useEffect, useMemo } from 'react'

export default function ProjectsList({ projects, onDeleteProject, onEditProject, headerAction }) {
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
      String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.client || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  useEffect(() => setPage(1), [searchQuery])

  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const displayedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize)

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      inactive: 'bg-white/5 text-gray-500 border-white/5',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      archived: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      planning: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }
    return colors[status?.toLowerCase()] || colors.inactive
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">All Projects</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {headerAction}
          <div className="relative w-full sm:w-64">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-input pl-10 py-2 h-10 w-full bg-zinc-900 border-white/10 text-white placeholder-gray-500 focus:border-amber-500"
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
          className="text-center py-16 ui-card bg-zinc-900 border-white/5"
        >
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
            <IoBusinessOutline className="text-gray-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No projects found</h3>
          <p className="text-gray-500 text-sm mb-6">Try adjusting your search criteria</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm font-semibold text-amber-500 hover:text-amber-400 underline"
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
              onEdit={() => onEditProject && onEditProject(project)}
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
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-white/5 rounded-xl"
        >
          <div className="text-sm text-gray-500 font-medium">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      className={`w-8 h-8 text-sm font-bold rounded-lg transition-all ${page === i
                          ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20'
                          : 'text-gray-500 hover:bg-white/10 hover:text-white'
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
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              className="relative w-full max-w-sm ui-modal p-6 shadow-2xl bg-zinc-900 border-white/5"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <IoTrashOutline size={24} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Delete Project</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed font-medium">
                  Are you sure you want to delete <span className="text-white font-black">{projectToDelete?.name}</span>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 text-sm font-black text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onDeleteProject(projectToDelete.id); setShowDeleteModal(false); }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all uppercase tracking-wider"
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

function ProjectCard({ project, index, getStatusColor, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative ui-card p-5 transition-all cursor-default overflow-visible shadow-sm hover:shadow-xl bg-zinc-900 border-white/5 hover:border-amber-500/20"
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
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
                    className="absolute right-0 top-8 bg-zinc-900 rounded-lg shadow-xl border border-white/10 py-1 z-20 w-40"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <IoPencilOutline size={14} />
                      Edit Project
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-white/5 transition-colors flex items-center gap-2"
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
          <h3 className="text-base font-black text-white mb-3 line-clamp-2 leading-tight group-hover:text-amber-500 transition-colors">
            {project.name}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <IoBusinessOutline className="text-blue-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">Code</p>
                <p className="text-sm font-bold text-gray-300 truncate font-mono">{project.code || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <IoLocationOutline className="text-emerald-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">Location</p>
                <p className="text-sm font-bold text-gray-300 truncate">{project.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}