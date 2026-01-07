import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TimeLog from './pages/TimeLog'
import TimeReports from './pages/TimeReports'
import Header from './components/Header'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
     
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-4 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/time-log" element={<TimeLog />} />
            <Route path="/reports" element={<TimeReports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
