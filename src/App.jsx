import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import TimeLog from './pages/TimeLog';
import TimeReports from './pages/TimeReports';
import TimesheetApprovalsPage from './pages/TimesheetApprovalsPage';
import MyTimesheetStatus from './pages/MyTimesheetStatus';
import UserManagement from './pages/UserManagement';
import Header from './components/Header';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoutes from "./security/ProtectedRoutes";
import PublicRoute from "./security/PublicRoute";
import { AuthProvider, useAuth } from './context/AuthContext';

import { Outlet } from 'react-router-dom';
import Layout from './components/Layout';

function AppContent() {
  return (
    <Routes>
      {/* Public Route - redirects to dashboard if already authenticated */}
      <Route path="/auth" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Protected Routes with Layout */}
      <Route element={
        <ProtectedRoutes>
          <Layout>
            <Outlet />
          </Layout>
        </ProtectedRoutes>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/time-log" element={<TimeLog />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/reports" element={<TimeReports />} />
        <Route path="/approvals" element={<TimesheetApprovalsPage />} />
        <Route path="/my-submissions" element={<MyTimesheetStatus />} />
        <Route path="/users" element={<UserManagement />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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