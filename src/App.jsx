import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Employees from './pages/Employees';
import Dashboard from './pages/Dashboard';
import AdminManage from './pages/AdminManage';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-profile" element={<Navigate to="/register?finish=1" replace />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/browse" element={<Navigate to="/jobs" replace />} />
          <Route path="/find-employees" element={<Navigate to="/employees" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/reports" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/admin/manage"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['employees', 'company', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
