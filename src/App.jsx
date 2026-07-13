import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Companies from '@/pages/Companies';
import Workers from '@/pages/Workers';
import Projects from '@/pages/Projects';
import Tasks from '@/pages/Tasks';
import TasksCalendar from '@/pages/TasksCalendar';
import TasksKanban from '@/pages/TasksKanban';
import Reports from '@/pages/Reports';
import CashFlow from '@/pages/CashFlow';
import Invoices from '@/pages/Invoices';
import ClientPortal from '@/pages/ClientPortal';
import WorkerReport from '@/pages/WorkerReport';
import CompanyDetail from '@/pages/CompanyDetail';
import WorkerDashboard from '@/pages/WorkerDashboard';
import Meetings from '@/pages/Meetings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route element={<AdminRoute />}>
            <Route path="/companies" element={<Companies />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks-calendar" element={<TasksCalendar />} />
            <Route path="/tasks-kanban" element={<TasksKanban />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/invoices" element={<Invoices />} />
          </Route>
        </Route>
      </Route>
      <Route path="/client-portal" element={<ClientPortal />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/worker-report" element={<WorkerReport />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App