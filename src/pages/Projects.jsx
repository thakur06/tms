import { useEffect, useState } from "react"
import { toast, Zoom } from "react-toastify"
import ProjectsList from "../components/ProjectsList"
import CreateProjectModal from "../components/CreateProjectModal"
import { motion } from "framer-motion"
import {
  IoAddOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoCodeSlashOutline
} from "react-icons/io5"

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byLocation: {},
    active: 0
  })

  const server=import.meta.env.VITE_SERVER_ADDRESS;
  const token = localStorage.getItem('token');
  
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
        const response = await fetch(`${server}/api/projects`)
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
      const response = await fetch(`${server}/api/projects/${projectId}`, {
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
      const response = await fetch(`${server}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
           Authorization: `Bearer ${token}`
         },
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

  const handleUpdateProject = async (id, projectData) => {
    try {
      const response = await fetch(`${server}/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json",
           Authorization: `Bearer ${token}`
         },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        notifyError(errorData.error || "Failed to update project")
        return
      }

      const updatedProject = await response.json()
      const transformedProject = transformProject(updatedProject)
      
      setProjects((prev) => prev.map(p => p.id === id ? transformedProject : p))
      
      // Recalculate stats as location might have changed
      const locationCounts = {}
      const updatedProjects = projects.map(p => p.id === id ? transformedProject : p)
      updatedProjects.forEach(project => {
        const location = project.location || 'Unknown'
        locationCounts[location] = (locationCounts[location] || 0) + 1
      })
      
      setStats({
         total: updatedProjects.length,
         byLocation: locationCounts,
         active: updatedProjects.length
      })

      notifySuccess("Project updated successfully!")
    } catch (error) {
       notifyError("Failed to update project")
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

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.03, y: -3 }}
          className="ui-card p-4 flex items-center gap-4 group relative overflow-hidden transition-all shadow-sm hover:shadow-xl bg-zinc-900 border-white/5"
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 shadow-sm group-hover:shadow-blue-500/20 transition-all">
            <IoBusinessOutline size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-500 transition-colors">Total Projects</p>
            <p className="text-xl font-black text-white transition-all">{stats.total}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.03, y: -3 }}
          className="ui-card p-4 flex items-center gap-4 group relative overflow-hidden transition-all shadow-sm hover:shadow-xl bg-zinc-900 border-white/5"
        >
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 shadow-sm group-hover:shadow-emerald-500/20 transition-all">
            <IoLocationOutline size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <div className="relative z-10 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-emerald-500 transition-colors">Top Location</p>
            <p className="text-lg font-black text-white truncate transition-all">{getTopLocation()}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03, y: -3 }}
          className="ui-card p-4 flex items-center gap-4 group relative overflow-hidden transition-all shadow-sm hover:shadow-xl bg-zinc-900 border-white/5"
        >
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-sm group-hover:shadow-amber-500/20 transition-all">
            <IoCodeSlashOutline size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-amber-500 transition-colors">Active Projects</p>
            <p className="text-xl font-black text-white transition-all">{stats.active}</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
            <div className="mb-8">
              <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                <span>Management</span>
                <span className="opacity-30">/</span>
                <span className="text-amber-500">Projects</span>
              </nav>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-sm">
                  <IoBusinessOutline size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                    Project Directory
                  </h1>
                  <p className="text-gray-400 mt-1.5 text-xs font-bold italic">Global workspace initiative tracking</p>
                </div>
              </div>
            </div>
            <ProjectsList 
              projects={projects} 
              onDeleteProject={handleDeleteProject}
              onEditProject={(project) => {
                 setEditingProject(project)
                 setShowProjectModal(true)
              }}
              headerAction={
                <button
                  onClick={() => {
                    setEditingProject(null)
                    setShowProjectModal(true)
                  }}
                  className="ui-btn ui-btn-primary w-full sm:w-auto text-xs uppercase font-black tracking-widest h-11 px-6 shadow-blue-500/20"
                >
                  <IoAddOutline size={18} />
                  New Project
                </button>
              }
            />

      {/* Create/Edit Project Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setEditingProject(null)
        }}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        projectToEdit={editingProject}
      />
    </div>
  )
}