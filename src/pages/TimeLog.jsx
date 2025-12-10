import { useEffect, useState } from 'react'
import { tasks } from '../data/mockData'
import Header from '../components/Header'
import WeeklyTimeLog from '../components/WeeklyTimeLog'

export default function TimeLog() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
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
    fetchUsers()
    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <Header />
        <WeeklyTimeLog
          tasks={tasks}
          projects={projects}
          users={users}              // ✅ backend users
          timeEntries={timeEntries}
          setTimeEntries={setTimeEntries}
        />
      </div>
    </div>
  )
}
