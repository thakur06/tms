import { useEffect, useMemo, useState } from 'react'
import { projects, tasks, timeline, calendarEvents } from '../data/mockData'
import { formatter } from '../utils/formatters'
import Header from '../components/Header'
import StatsCards from '../components/StatsCards'
import ProjectsList from '../components/ProjectsList'
import Timeline from '../components/Timeline'
import TasksList from '../components/TasksList'
import Calendar from '../components/Calendar'
import CreateTaskModal from '../components/CreateTaskModal'
import CreateProjectModal from '../components/CreateProjectModal'
import TimeReport from '../components/TimeReport'

export default function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [currentProjects, setCurrentProjects] = useState(projects)
  const [currentTasks, setCurrentTasks] = useState(tasks)
  
  const [tick, setTick] = useState(0)
  const [timers, setTimers] = useState(() =>
    currentTasks.reduce((acc, task) => {
      acc[task.id] = {
        running: false,
        elapsed: task.logged * 3600,
        startTime: null,
      }
      return acc
    }, {}),
  )

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
        next[taskId] = { running: false, elapsed: updatedElapsed, startTime: null }
      } else {
        next[taskId] = { ...t, running: true, startTime: Date.now() }
      }
      return next
    })
  }

  const stats = useMemo(() => {
    const open = currentTasks.filter((t) => t.status !== 'Done').length
    const approvals = currentTasks.filter((t) => t.approvals.length).length
    const today = calendarEvents.length
    const totalLoggedSeconds = currentTasks.reduce((sum, task) => sum + getElapsed(task.id), 0)
    const utilization = Math.round((totalLoggedSeconds / (currentTasks.length * 8 * 3600)) * 100)
    return {
      open,
      approvals,
      today,
      utilization: Number.isFinite(utilization) ? utilization : 0,
      logged: formatter(totalLoggedSeconds),
    }
  }, [tick, timers, currentTasks])

  const handleCreateTask = (taskData) => {
    const newTask = {
      id: `t${Date.now()}`,
      ...taskData,
      logged: 0,
      approvals: [],
    }
    setCurrentTasks([...currentTasks, newTask])
    setTimers((prev) => ({
      ...prev,
      [newTask.id]: {
        running: false,
        elapsed: 0,
        startTime: null,
      },
    }))
  }

  const handleCreateProject = (projectData) => {
    const newProject = {
      id: `p${Date.now()}`,
      ...projectData,
    }
    setCurrentProjects([...currentProjects, newProject])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <Header onCreateTask={() => setShowTaskModal(true)} onCreateProject={() => setShowProjectModal(true)} />
        <StatsCards stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ProjectsList projects={currentProjects} />
          <Timeline timeline={timeline} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TasksList tasks={currentTasks} timers={timers} getElapsed={getElapsed} toggleTimer={toggleTimer} />
          <Calendar calendarEvents={calendarEvents} />
        </div>
        <TimeReport/>
      </div>
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projects={currentProjects}
        onCreateTask={handleCreateTask}
      />
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}

