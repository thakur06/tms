import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import TimeLog from './pages/TimeLog';
import TimeReports from './pages/TimeReports';
import Header from './components/Header';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoutes from "./security/ProtectedRoutes";
import PublicRoute from "./security/PublicRoute";
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-r from-white via-indigo-300 to-indigo-400 flex flex-col">
      {/* Only show Header if authenticated */}
      {isAuthenticated && <Header />}
      
      <main className={`w-full ${isAuthenticated ? 'px-4 sm:px-6 lg:px-8 py-4' : ''}`}>
        <Routes>
          {/* Public Route - redirects to dashboard if already authenticated */}
          <Route path="/auth" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          } />
          <Route path="/time-log" element={
            <ProtectedRoutes>
              <TimeLog />
            </ProtectedRoutes>
          } />
          <Route path="/tasks" element={
            <ProtectedRoutes>
              <Tasks />
            </ProtectedRoutes>
          } />
          <Route path="/projects" element={
            <ProtectedRoutes>
              <Projects />
            </ProtectedRoutes>
          } />
          <Route path="/reports" element={
            <ProtectedRoutes>
              <TimeReports />
            </ProtectedRoutes>
          } />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;