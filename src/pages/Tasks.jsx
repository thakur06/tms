import { useEffect, useMemo, useState } from "react"
import { ToastContainer, toast, Zoom } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import TasksList from "../components/TasksList"
import CreateTaskModal from "../components/CreateTaskModal"

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [dept, setDept] = useState([])
  const [timers, setTimers] = useState(() => ({}))
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const token = localStorage.getItem('token');
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
    const fetchData = async () => {
      setIsLoading(true)
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      try {
        const [tasksRes, projectsRes, deptRes] = await Promise.all([
          fetch("http://localhost:4000/api/tasks", { headers }),
          fetch("http://localhost:4000/api/projects", { headers }),
          fetch("http://localhost:4000/api/dept", { headers }),
        ])

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData)
          const initialTimers = tasksData.reduce((acc, task) => {
            acc[task.task_id] = {
              running: false,
              elapsed: task.logged ? task.logged * 3600 : 0,
              startTime: null,
            }
            return acc
          }, {})
          setTimers(initialTimers)
        } else {
          notifyError("Failed to fetch tasks")
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.map(transformProject))
        } else {
          notifyError("Failed to fetch projects")
        }

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          const transformedDept = deptData.map(transformProject)
          setDept(transformedDept.map((item) => item.dept_name))
        } else {
          notifyError("Failed to fetch departments")
        }
      } catch (error) {
        notifyError("Failed to load tasks")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const hasRunning = Object.values(timers).some((t) => t.running)
    if (!hasRunning) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [timers])

  const getElapsed = (taskId) => {
    const timer = timers[taskId]
    if (!timer) return 0
    if (!timer.running || !timer.startTime) return timer.elapsed
    return timer.elapsed + Math.floor((Date.now() - timer.startTime) / 1000)
  }

  const toggleTimer = (taskId) => {
    setTimers((prev) => {
      const next = { ...prev }
      const t = next[taskId]
      if (t.running) {
        const updatedElapsed = t.elapsed + Math.floor((Date.now() - t.startTime) / 1000)
        next[taskId] = {
          running: false,
          elapsed: updatedElapsed,
          startTime: null,
        }
        updateTaskLoggedTime(taskId, updatedElapsed / 3600)
      } else {
        next[taskId] = { ...t, running: true, startTime: Date.now() }
      }
      return next
    })
  }

  const updateTaskLoggedTime = async (taskId, loggedHours) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logged: loggedHours }),
      })
      if (!response.ok) throw new Error()
    } catch {
      notifyError("Failed to update task time")
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tasks/${taskId}`, {
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        method: "DELETE",
      })

      if (response.ok) {
        setTasks((prev) => prev.filter((task) => task.task_id !== taskId))
        setTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[taskId]
          return newTimers
        })
        notifySuccess("Task deleted successfully!")
      } else {
        const errorData = await response.json()
        notifyError(errorData.error || "Failed to delete task")
      }
    } catch (error) {
      notifyError("Failed to delete task")
    }
  }

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch("http://localhost:4000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        notifyError(errorData.error || "Failed to create task")
        return
      }

      const newTask = await response.json()
      setTasks((prev) => [...prev, newTask])
      setTimers((prev) => ({
        ...prev,
        [newTask.task_id]: {
          running: false,
          elapsed: 0,
          startTime: null,
        },
      }))
      notifySuccess("Task created successfully!")
    } catch (error) {
      notifyError("Failed to create task")
    }
  }

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "Done").length
    const totalLoggedSeconds = tasks.reduce((sum, task) => sum + getElapsed(task.task_id), 0)
    const utilization = Math.round((totalLoggedSeconds / (tasks.length * 8 * 3600)) * 100) || 0

    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }

    return {
      open,
      utilization: Number.isFinite(utilization) ? utilization : 0,
      logged: formatTime(totalLoggedSeconds),
    }
  }, [tick, timers, tasks])

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <TasksList 
            tasks={tasks} 
            onDeleteTask={handleDeleteTask}
            headerAction={
              <button 
                onClick={() => setShowTaskModal(true)}
                className="ui-btn ui-btn-primary w-full sm:w-auto"
              >
                + New Task
              </button>
            }
          />
        </>
      )}

      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projects={projects}
        depts={dept}
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}
