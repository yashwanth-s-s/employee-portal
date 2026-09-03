import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import api from '../services/api';
import { ShieldCheck, Lock, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApps = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/zoho/apps');
      if (response.data.success) {
        setApps(response.data.apps || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to retrieve authorized applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [user]);

  const primaryRole = user?.roles?.[0] || 'Employee';

  return (
    <div className="main-content">
      {/* Hero Welcome Banner */}
      <section className="hero-banner">
        <div>
          <h1 className="hero-title">
            Welcome back, {user?.name || 'Employee'}
          </h1>
          <p className="hero-subtitle">
            This dashboard grants direct, single-sign-on access to your authorized Zoho One enterprise applications based on your active role (<strong>{primaryRole}</strong>).
          </p>
          <div className="security-notice">
            <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span>
              <strong>Zero-Credential Access:</strong> You never need individual Zoho usernames or passwords. All access permissions are securely negotiated and enforced by our backend RBAC service.
            </span>
          </div>
        </div>
      </section>

      {/* Authorized Applications Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: 'var(--primary)' }} />
            Authorized Applications ({apps.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Only applications authorized for your role are served by the backend.
          </p>
        </div>
        <button onClick={fetchApps} className="btn btn-secondary btn-sm" title="Refresh application catalog">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={fetchApps} className="btn btn-secondary btn-sm">Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading your authorized Zoho applications from secure gateway...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={36} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Authorized Applications</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto' }}>
            Your account is active, but your current role does not have any assigned Zoho application permissions. Please contact your portal administrator.
          </p>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
};
