import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhHK from 'antd/locale/zh_HK';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leave from './pages/Leave';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Recruitment from './pages/Recruitment';
import Performance from './pages/Performance';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <ConfigProvider
      locale={zhHK}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leave" element={<Leave />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="performance" element={<Performance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}
