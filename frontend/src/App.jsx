import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ZohoProxyView } from './pages/ZohoProxyView';

export const App = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {user && <Navbar />}

      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Employee Dashboard: Authorized Zoho Applications */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Zoho Live API Proxy & RBAC Inspector */}
        <Route
          path="/zoho/:appKey"
          element={
            <ProtectedRoute>
              <ZohoProxyView />
            </ProtectedRoute>
          }
        />

        {/* Administrative Console: Users, Roles, Audit Logs, Zoho Health */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
