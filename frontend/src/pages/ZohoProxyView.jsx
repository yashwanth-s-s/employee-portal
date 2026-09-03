import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Terminal, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle, Server, Code } from 'lucide-react';

export const ZohoProxyView = () => {
  const { appKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [responseStatus, setResponseStatus] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const appConfigs = {
    people: {
      name: 'Zoho People',
      endpoint: '/zoho/people',
      permission: 'VIEW_ZOHO_PEOPLE',
      description: 'Fetches employee directory and forms via server-side OAuth service account.'
    },
    crm: {
      name: 'Zoho CRM',
      endpoint: '/zoho/crm',
      permission: 'VIEW_ZOHO_CRM',
      description: 'Fetches leads, accounts, and contacts via server-side OAuth service account.'
    },
    desk: {
      name: 'Zoho Desk',
      endpoint: '/zoho/desk',
      permission: 'VIEW_ZOHO_DESK',
      description: 'Fetches support tickets and helpdesk queues via server-side OAuth service account.'
    },
    books: {
      name: 'Zoho Books',
      endpoint: '/zoho/books',
      permission: 'VIEW_ZOHO_BOOKS',
      description: 'Fetches financial ledgers and invoices via server-side OAuth service account.'
    }
  };

  const currentApp = appConfigs[appKey?.toLowerCase()] || {
    name: `Zoho ${appKey?.toUpperCase()}`,
    endpoint: `/zoho/${appKey?.toLowerCase()}`,
    permission: `VIEW_ZOHO_${appKey?.toUpperCase()}`,
    description: 'Custom Zoho API endpoint'
  };

  const handleTestProxy = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    setError(null);

    try {
      const res = await api.get(currentApp.endpoint);
      setResponseStatus(res.status);
      setResponseData(res.data);
    } catch (err) {
      setResponseStatus(err.response?.status || 500);
      setResponseData(err.response?.data || { error: err.message });
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleTestProxy();
  }, [appKey]);

  return (
    <div className="main-content">
      <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              Backend API Proxy Validation
            </div>
            <h1 className="card-title" style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>
              {currentApp.name} Gateway Proxy
            </h1>
            <p className="card-desc">{currentApp.description}</p>
          </div>

          <button onClick={handleTestProxy} disabled={loading} className="btn btn-primary">
            <Terminal size={15} />
            <span>{loading ? 'Calling Backend...' : 'Re-Execute Proxy Call'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Target API Route</div>
            <code style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{currentApp.endpoint}</code>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Required RBAC Permission</div>
            <code style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{currentApp.permission}</code>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Current User Role</div>
            <span className="user-role-badge role-admin">
              {user?.roles?.[0] || 'User'}
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Backend HTTP Status</div>
            <span
              className={`badge ${
                responseStatus === 200
                  ? 'badge-success'
                  : responseStatus === 403
                  ? 'badge-danger'
                  : responseStatus === 503
                  ? 'badge-warning'
                  : 'badge-info'
              }`}
            >
              {responseStatus ? `HTTP ${responseStatus}` : 'Pending...'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend JSON Response Display */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Server Response</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Rendered from Express Backend Controller
          </span>
        </div>

        {responseStatus === 403 && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <div>
              <strong>RBAC Authorization Blocked (HTTP 403):</strong> The backend verified that your user account does not possess the <code>{currentApp.permission}</code> permission required for this endpoint.
            </div>
          </div>
        )}

        {responseStatus === 503 && (
          <div className="alert alert-warning" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fde68a' }}>
            <AlertCircle size={18} />
            <div>
              <strong>Graceful Configuration Handling (HTTP 503):</strong> The backend prevented unauthorized or fake API calls because Zoho OAuth credentials (<code>ZOHO_CLIENT_ID</code>, <code>ZOHO_CLIENT_SECRET</code>, <code>ZOHO_REFRESH_TOKEN</code>) are not yet entered in <code>backend/.env</code>.
            </div>
          </div>
        )}

        <pre
          style={{
            background: '#070a13',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: '#e2e8f0'
          }}
        >
          {loading ? '// Contacting backend proxy...' : JSON.stringify(responseData, null, 2)}
        </pre>
      </div>
    </div>
  );
};
