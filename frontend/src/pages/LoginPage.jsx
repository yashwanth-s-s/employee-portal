import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, sessionExpiredMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for interview test accounts
  const quickFill = (demoEmail, roleName) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
    clearSessionMessage();
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4)'
            }}
          >
            <Shield size={24} />
          </div>
          <h1 className="login-title">Employee Portal</h1>
          <p className="login-subtitle">Zoho One Centralized Single-Sign-On Gateway</p>
        </div>

        {sessionExpiredMessage && (
          <div className="alert alert-info">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{sessionExpiredMessage}</div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Corporate Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Test Accounts for Interview Evaluation */}
        <div className="demo-credentials-box">
          <div className="demo-title">
            <span>Interview Quick Demo Accounts</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Click to fill</span>
          </div>

          <div className="demo-pill-grid">
            <button
              type="button"
              className="demo-pill full-width"
              onClick={() => quickFill('admin@company.com', 'Admin')}
            >
              <span>👑 Admin (All Apps & Admin Panel)</span>
              <span className="user-role-badge role-admin">Admin</span>
            </button>

            <button
              type="button"
              className="demo-pill"
              onClick={() => quickFill('hr@company.com', 'HR')}
            >
              <span>👥 HR (People Only)</span>
              <span className="user-role-badge role-hr">HR</span>
            </button>

            <button
              type="button"
              className="demo-pill"
              onClick={() => quickFill('sales@company.com', 'Sales')}
            >
              <span>🎯 Sales (CRM Only)</span>
              <span className="user-role-badge role-sales">Sales</span>
            </button>

            <button
              type="button"
              className="demo-pill"
              onClick={() => quickFill('support@company.com', 'Support')}
            >
              <span>🎧 Support (Desk Only)</span>
              <span className="user-role-badge role-support">Support</span>
            </button>

            <button
              type="button"
              className="demo-pill"
              onClick={() => quickFill('finance@company.com', 'Finance')}
            >
              <span>💳 Finance (Books Only)</span>
              <span className="user-role-badge role-finance">Finance</span>
            </button>
          </div>
          <div style={{ marginTop: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Demo Password: <code style={{ color: 'var(--accent-cyan)' }}>Password123!</code>
          </div>
        </div>
      </div>
    </div>
  );
};
