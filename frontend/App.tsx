
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ExplorePage from './pages/ExplorePage';
import CreatePage from './pages/CreatePage';
import ProfilePage from './pages/ProfilePage';
import PlayPage from './pages/PlayPage';
import UserLayout from './components/UserLayout';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import AdminLayout from './admin/components/Layout';
import AdminLoginPage from './admin/pages/AdminLoginPage';
import AdminDashboardPage from './admin/pages/Dashboard';
import AdminUserManagement from './admin/pages/UserManagement';
import AdminBlacklist from './admin/pages/Blacklist';
import AdminContentManagement from './admin/pages/ContentManagement';
import AdminReportModeration from './admin/pages/ReportModeration';

// Component bảo vệ Route (user đã đăng nhập)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/play/:pin" element={<ProtectedRoute><PlayPage /></ProtectedRoute>} />
      {/* Admin routes */}
      <Route
        path="/admin/login"
        element={
          <AdminAuthProvider>
            <AdminLoginPage />
          </AdminAuthProvider>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <AdminProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="" element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUserManagement />} />
                  <Route path="blacklist" element={<AdminBlacklist />} />
                  <Route path="content" element={<AdminContentManagement />} />
                  <Route path="reports" element={<AdminReportModeration />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            </AdminProtectedRoute>
          </AdminAuthProvider>
        }
      />
      <Route path="*" element={<div className="p-10 text-center">404 - Không tìm thấy trang</div>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
