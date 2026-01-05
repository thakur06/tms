import { motion, AnimatePresence } from 'framer-motion'
import { 
  IoFolder, 
  IoLocation, 
  IoCode, 
  IoTrash, 
  IoClose,
  IoTime,
  IoPeople,
  IoStatsChart,
  IoAddCircle,
  IoChevronDown,
  IoChevronUp,
  IoEye
} from 'react-icons/io5'
import { useState } from 'react'

export default function ProjectsList({ projects, onDeleteProject, onAddProject }) {
  const getProjectColor = (projectName) => {
    const colors = [
      'bg-gradient-to-br from-blue-600 to-blue-800',
      'bg-gradient-to-br from-indigo-600 to-indigo-800',
      'bg-gradient-to-br from-emerald-600 to-emerald-800',
      'bg-gradient-to-br from-slate-700 to-slate-900',
      'bg-gradient-to-br from-cyan-600 to-cyan-800',
      'bg-gradient-to-br from-violet-600 to-violet-800',
      'bg-gradient-to-br from-rose-600 to-rose-800',
      'bg-gradient-to-br from-teal-600 to-teal-800'
    ]
    if (!projectName) return colors[0]
    const index = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const [projectToDelete, setProjectToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAllProjects, setShowAllProjects] = useState(false)
  
  const initialProjectsCount = 3
  const displayedProjects = showAllProjects ? projects : projects.slice(0, initialProjectsCount)

  const handleDeleteClick = (project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (projectToDelete && onDeleteProject) {
      onDeleteProject(projectToDelete.id || projectToDelete.project_id)
    }
    setShowDeleteModal(false)
    setProjectToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setProjectToDelete(null)
  }

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                <IoFolder className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Project Management</p>
                <h2 className="text-2xl font-bold text-slate-900">Active Projects</h2>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {projects.length} total
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {onAddProject && (
              <button 
                onClick={onAddProject}
                className="px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-700 hover:shadow-lg transition-all duration-300 flex items-center gap-2 group"
              >
                <IoAddCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mb-6">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
                <IoFolder className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No projects yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Start by creating your first project to organize tasks, track time, and manage resources.
              </p>
              {onAddProject && (
                <button 
                  onClick={onAddProject}
                  className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg font-medium hover:from-slate-800 hover:to-slate-700 hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <IoAddCircle className="w-5 h-5" />
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedProjects.map((project, index) => (
                <motion.div
                  key={project.code || project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.08)"
                  }}
                  className="group relative bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-900 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-xl ${getProjectColor(project.name)} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <IoFolder className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-900 truncate">
                              {project.name}
                            </h4>
                            {project.status && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                project.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
                              <IoCode className="w-3 h-3" />
                              {project.code}
                            </span>
                            {project.created_at && (
                              <span className="text-xs text-slate-500">
                                {formatDate(project.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteClick(project)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete Project"
                      >
                        <IoTrash className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {project.location && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <IoLocation className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-0.5">Location</p>
                            <p className="text-sm font-medium text-slate-900 truncate">{project.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {project.description && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{project.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {(project.tasks || project.members) && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-3">
                          {project.tasks !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-semibold text-slate-900">
                                {project.tasks}
                              </div>
                              <div className="text-xs text-slate-500">Tasks</div>
                            </div>
                          )}
                          {project.members !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-semibold text-slate-900">
                                {project.members}
                              </div>
                              <div className="text-xs text-slate-500">Members</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* View All Toggle */}
        {projects.length > initialProjectsCount && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => setShowAllProjects(!showAllProjects)}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-300 flex items-center gap-2 group"
            >
              {showAllProjects ? (
                <>
                  <IoChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Show Less
                </>
              ) : (
                <>
                  <IoEye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  View All Projects ({projects.length - initialProjectsCount} more)
                </>
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        {projects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <IoFolder className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Total Projects</p>
                    <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Active in portfolio</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <IoTime className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Recent</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {projects.filter(p => {
                        if (!p.created_at) return false
                        const createdDate = new Date(p.created_at)
                        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        return createdDate > thirtyDaysAgo
                      }).length}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Created last 30 days</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <IoPeople className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Locations</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {[...new Set(projects.map(p => p.location).filter(Boolean))].length}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Unique work sites</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <IoStatsChart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {projects.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Currently active</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <IoTrash className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Delete Project</h3>
                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={cancelDelete}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <IoClose className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-slate-700 mb-3">
                  You are about to permanently delete the project:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${getProjectColor(projectToDelete.name)} flex items-center justify-center`}>
                      <IoFolder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{projectToDelete.name}</p>
                      <p className="text-sm text-slate-600">{projectToDelete.code}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Important Notice</p>
                    <p className="text-sm text-red-700">
                      All associated tasks, time entries, and project data will be permanently deleted.
                      This action cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow flex items-center justify-center"
                >
                  <IoTrash className="w-4 h-4 mr-2" />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}