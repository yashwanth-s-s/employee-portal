import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Validating session security...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '600px', margin: '3rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--accent-rose)' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Your account ({user.email}) does not have administrative privileges required to access this resource.
          </p>
          <a href="/" className="btn btn-secondary">
            Return to Authorized Applications
          </a>
        </div>
      </div>
    );
  }

  // Permission validation
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '600px', margin: '3rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--accent-rose)' }}>Unauthorized Operation</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You do not possess the <code>{requiredPermission}</code> permission.
          </p>
          <a href="/" className="btn btn-secondary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
