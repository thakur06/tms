import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import TimeLog from './pages/TimeLog';
import TimesheetApprovalsPage from './pages/TimesheetApprovalsPage';
import MyTimesheetStatus from './pages/MyTimesheetStatus';
import UserManagement from './pages/UserManagement';
import ComplianceReportPage from './pages/ComplianceReportPage';
import TeamCompliancePage from './pages/TeamCompliancePage';
import TimesheetReviewPage from './pages/TimesheetReviewPage';
import Header from './components/Header';
import Login from './pages/Login';
import ProjectAssignments from './pages/ProjectAssignments';
import Tickets from './pages/Tickets';
import MyTickets from './pages/MyTickets';
import TicketViewPage from './pages/TicketViewPage';
import NotFound from './pages/NotFound';
import ProtectedRoutes from "./security/ProtectedRoutes";
import PublicRoute from "./security/PublicRoute";
import AdminRoute from "./security/AdminRoute";
import AdminOrManagerRoute from "./security/AdminOrManagerRoute";
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { Analytics } from './pages/Analytics';

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
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/time-log" element={<TimeLog />} />
        <Route path="/tasks" element={
          <AdminRoute>
            <Tasks />
          </AdminRoute>
        } />
        <Route path="/projects" element={
          <AdminRoute>
            <Projects />
          </AdminRoute>
        } />
        <Route path="/project-assignments" element={
          <AdminOrManagerRoute>
            <ProjectAssignments />
          </AdminOrManagerRoute>
        } />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketViewPage />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        {/* <Route path="/reports" element={<TimeReports />} /> */}
        <Route path="/approvals" element={<TimesheetApprovalsPage />} />
        <Route path="/approvals/review/:timesheetId" element={<TimesheetReviewPage />} />
        <Route path="/compliance" element={<ComplianceReportPage />} />
        <Route path="/team-compliance" element={<TeamCompliancePage />} />
        <Route path="/my-submissions" element={<MyTimesheetStatus />} />
        <Route path="/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        <Route path="/reports-analytics" element={
          <AdminRoute>
            <Analytics />
          </AdminRoute>
        } />
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
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="dark"
          limit={1}
          closeButton={false}
          transition={Zoom}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;