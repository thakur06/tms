import { useEffect, useState } from 'react'
import WeeklyTimeLog from '../components/WeeklyTimeLog'

export default function TimeLog() {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients,setClients]= useState([]);
  const [timeEntries, setTimeEntries] = useState(() => {
    const entries = {}
    const sampleDate = '2025-03-03'
    entries[sampleDate] = [
      {
        taskId: 't1',
        hours: 2,
        minutes: 30,
        project: 'Website relaunch',
        user: 'Sam',
        location: 'New York, USA',
        remarks: 'Initial wireframe review',
      },
      {
        taskId: 't2',
        hours: 1,
        minutes: 0,
        project: 'Mobile app revamp',
        user: 'Avery',
        location: 'San Francisco, USA',
        remarks: '',
      },
    ]
    return entries
  })

  // ✅ Fetch data from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    const fetchProjects = async () => {
      try {
        const res = await fetch(`${server}/api/projects`, { headers })
        const data = await res.json()
        if (Array.isArray(data)) {
            setProjects(data)
        }
      } catch (err) {
        console.error('Failed to fetch projects', err)
      }
    }
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${server}/api/tasks`, { headers })
        const data = await res.json()
        if (Array.isArray(data)) {
            setTasks(data)
        }
      } catch (err) {
        console.error('Failed to fetch tasks', err)
      }
    }

    const fetchClients = async () => {
      try {
        const res = await fetch(`${server}/api/client`, { headers })
        const data = await res.json()
        if (Array.isArray(data)) {
            setClients(data)
        }
      } catch (err) {
        console.error('Failed to fetch clients', err)
      }
    }

    fetchProjects()
    fetchTasks()
    fetchClients()
  }, [])

  return (
    <div className="w-full">
      <WeeklyTimeLog
        tasks={tasks}
        projects={projects}
        timeEntries={timeEntries}
        setTimeEntries={setTimeEntries}
        clients={clients}
      />
    </div>
  )
}
