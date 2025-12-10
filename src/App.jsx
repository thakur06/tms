import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TimeLog from './pages/TimeLog'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/time-log" element={<TimeLog />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
