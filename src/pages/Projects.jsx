import { useEffect, useState } from "react"
import { ToastContainer, toast, Zoom } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ProjectsList from "../components/ProjectsList"
import CreateProjectModal from "../components/CreateProjectModal"
import {
  IoAddOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoCodeSlashOutline
} from "react-icons/io5"

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byLocation: {},
    active: 0
  })

  const apiBase = "http://localhost:4000/api"

  const notifyError = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      theme: "colored",
      transition: Zoom,
    })

  const notifySuccess = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      theme: "colored",
      transition: Zoom,
    })

  const transformProject = (project) => ({
    ...project,
    id: project.id || project.project_id,
    name: project.name || project.project_name || "Unnamed Project",
    code: project.code || project.project_code || "N/A",
    location: project.location || project.project_location || "Not specified",
    client: project.client || "Not specified",
  })

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${apiBase}/projects`)
        if (response.ok) {
          const data = await response.json()
          const transformedData = data.map(transformProject)
          setProjects(transformedData)
          
          // Calculate stats
          const locationCounts = {}
          transformedData.forEach(project => {
            const location = project.location || 'Unknown'
            locationCounts[location] = (locationCounts[location] || 0) + 1
          })
          
          setStats({
            total: transformedData.length,
            byLocation: locationCounts,
            active: transformedData.length // Assuming all are active
          })
        } else {
          notifyError("Failed to fetch projects")
        }
      } catch (error) {
        notifyError("Failed to load projects")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setProjects((prev) => prev.filter((project) => project.id !== projectId))
        
        // Update stats
        const deletedProject = projects.find(p => p.id === projectId)
        if (deletedProject) {
          const location = deletedProject.location || 'Unknown'
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            byLocation: {
              ...prev.byLocation,
              [location]: (prev.byLocation[location] || 1) - 1
            }
          }))
        }
        
        notifySuccess("Project deleted successfully!")
      } else {
        const errorData = await response.json()
        notifyError(errorData.error || "Failed to delete project")
      }
    } catch (error) {
      notifyError("Failed to delete project")
    }
  }

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch(`${apiBase}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        notifyError(errorData.error || "Failed to create project")
        return
      }

      const newProject = await response.json()
      const transformedProject = transformProject(newProject[0] || newProject)
      setProjects((prev) => [...prev, transformedProject])
      
      // Update stats
      const location = projectData.location || 'Unknown'
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        byLocation: {
          ...prev.byLocation,
          [location]: (prev.byLocation[location] || 0) + 1
        }
      }))
      
      notifySuccess("Project created successfully!")
    } catch (error) {
      notifyError("Failed to create project")
    }
  }

  const getTopLocation = () => {
    const entries = Object.entries(stats.byLocation)
    if (entries.length === 0) return 'N/A'
    
    const sorted = entries.sort((a, b) => b[1] - a[1])
    return `${sorted[0][0]} (${sorted[0][1]})`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[2000px] mx-auto p-6">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-64"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="h-4 bg-slate-100 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            
            {/* Table skeleton */}
            <div className="space-y-3">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-slate-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        theme="light"
        transition={Zoom}
        style={{ zIndex: 9999 }}
      />

      <div className="max-w-[2000px] mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-600 mt-1">
                Manage and track all active projects
              </p>
            </div>

            <button
              onClick={() => setShowProjectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm shadow-blue-100"
            >
              <IoAddOutline size={18} />
              New Project
            </button>
          </div>

          {/* Stats Cards with Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <IoBusinessOutline size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Projects</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <IoLocationOutline size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Top Location</p>
                  <p className="text-lg font-medium text-slate-900 truncate">{getTopLocation()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-amber-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <IoCodeSlashOutline size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Projects</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <ProjectsList 
            projects={projects} 
            onDeleteProject={handleDeleteProject}
          />
        </div>

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoBusinessOutline className="text-blue-500" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Start by creating your first project to organize work and track progress
            </p>
            <button
              onClick={() => setShowProjectModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-100"
            >
              <IoAddOutline size={20} />
              Create Your First Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}