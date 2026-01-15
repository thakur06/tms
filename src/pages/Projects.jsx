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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/50"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        theme="dark"
        transition={Zoom}
        style={{ zIndex: 9999 }}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ui-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <IoBusinessOutline size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Projects</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
        </div>

        <div className="ui-card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <IoLocationOutline size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Top Location</p>
            <p className="text-xl font-bold text-white truncate">{getTopLocation()}</p>
          </div>
        </div>

        <div className="ui-card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <IoCodeSlashOutline size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Active Projects</p>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="overflow-hidden">
        <ProjectsList 
          projects={projects} 
          onDeleteProject={handleDeleteProject}
          headerAction={
            <button
              onClick={() => setShowProjectModal(true)}
              className="ui-btn ui-btn-primary w-full sm:w-auto"
            >
              <IoAddOutline size={18} />
              New Project
            </button>
          }
        />
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