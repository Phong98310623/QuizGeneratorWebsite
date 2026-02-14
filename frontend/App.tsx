
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import UserPreviewPage from './admin/pages/preview/UserPreviewPage';
import QuestionPreviewPage from './admin/pages/preview/QuestionPreviewPage';
import SetPreviewPage from './admin/pages/preview/SetPreviewPage';

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
                  <Route path="preview/user/:id" element={<UserPreviewPage />} />
                  <Route path="preview/question/:id" element={<QuestionPreviewPage />} />
                  <Route path="preview/set/:id" element={<SetPreviewPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            </AdminProtectedRoute>
          </AdminAuthProvider>
        }
      />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy trang</h1>
              <p className="text-slate-500 mb-6">Trang bạn truy cập không tồn tại hoặc đã bị di chuyển.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                  Về trang chủ
                </Link>
                <Link to="/explore" className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                  Khám phá
                </Link>
                <Link to="/create" className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium">
                  Tạo câu hỏi
                </Link>
              </div>
            </div>
          </div>
        }
      />
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
