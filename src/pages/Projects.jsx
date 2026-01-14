import { useEffect, useState } from "react"
import { ToastContainer, toast, Zoom } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ProjectsList from "../components/ProjectsList"
import CreateProjectModal from "../components/CreateProjectModal"

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const notifyError = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Zoom,
    })

  const notifySuccess = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Zoom,
    })

  const transformProject = (project) => ({
    ...project,
    name: project.name || project.project_name || "Unnamed Project",
    code: project.code || project.project_code || "N/A",
    location: project.location || project.project_location || "Not specified",
  })

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("http://localhost:4000/api/projects")
        if (response.ok) {
          const data = await response.json()
          setProjects(data.map(transformProject))
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
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setProjects((prev) =>
          prev.filter((project) => (project.id || project.project_id) !== projectId)
        )
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
      const response = await fetch("http://localhost:4000/api/projects", {
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
      notifySuccess("Project created successfully!")
    } catch (error) {
      notifyError("Failed to create project")
    }
  }

  return (
    <div className="w-full relative">
      <ToastContainer position="top-center" autoClose={2000} limit={1} hideProgressBar theme="light" transition={Zoom} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Work</p>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-600">Browse, add, and manage all projects.</p>
        </div>
        <button onClick={() => setShowProjectModal(true)} className="ui-btn-primary px-4 py-2.5 text-sm">
          + Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <ProjectsList projects={projects} onDeleteProject={handleDeleteProject} />
      )}

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
