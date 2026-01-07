import { useEffect, useState } from 'react'
import WeeklyTimeLog from '../components/WeeklyTimeLog'

export default function TimeLog() {
  const [users, setUsers] = useState([]);
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

  // ✅ Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/users')
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error('Failed to fetch users', err)
      }
    }
    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/projects')
        const data = await res.json()
        setProjects(data)
      } catch (err) {
        console.error('Failed to fetch projects', err)
      }
    }
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/tasks')
        const data = await res.json()
        setTasks(data)
      } catch (err) {
        console.error('Failed to fetch tasks', err)
      }
    }

    const fetchClients = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/client')
        const data = await res.json()
        setClients(data)
      } catch (err) {
        console.error('Failed to fetch clients', err)
      }
    }

    fetchUsers()
    fetchProjects()
    fetchTasks()
    fetchClients()
  }, [])

  return (
    <div className="w-full">
      <WeeklyTimeLog
        tasks={tasks} // ✅ backend tasks
        projects={projects}
        users={users}              // ✅ backend users
        timeEntries={timeEntries}
        setTimeEntries={setTimeEntries}
        clients={clients}
      />
    </div>
  )
}
