import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ExternalLink, Terminal, Users, Target, Headphones, CreditCard, ShieldCheck } from 'lucide-react';

export const AppCard = ({ app }) => {
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);

  // Render relevant icon
  const renderIcon = () => {
    switch (app.id) {
      case 'PEOPLE': return <Users size={26} />;
      case 'CRM': return <Target size={26} />;
      case 'DESK': return <Headphones size={26} />;
      case 'BOOKS': return <CreditCard size={26} />;
      default: return <ShieldCheck size={26} />;
    }
  };

  // Launch Zoho application and record server-side audit log
  const handleLaunch = async () => {
    setLaunching(true);
    try {
      // Backend records ZOHO_APP_ACCESSED audit log
      await api.post(`/zoho/launch/${app.id}`);
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to log launch audit:', err);
      // Even if audit log fails, allow user to open the URL
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="app-card" style={{ '--app-accent': app.accentColor || 'var(--primary)' }}>
      <div>
        <div className="app-card-top">
          <div className="app-icon-wrap" style={{ color: app.accentColor }}>
            {renderIcon()}
          </div>
          <div className="app-meta">
            <div className="app-category">{app.category || 'Integrated Zoho App'}</div>
            <h3 className="app-name">{app.name}</h3>
          </div>
        </div>

        <p className="app-description">{app.description}</p>
      </div>

      <div>
        <div className="app-card-bottom">
          <span className="permission-pill" title="Required RBAC Permission">
            {app.permission}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate(`/zoho/${app.id.toLowerCase()}`)}
              className="btn btn-secondary btn-sm"
              title="Test backend API Proxy for this service"
            >
              <Terminal size={14} />
              <span>API Proxy</span>
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="btn btn-primary btn-sm"
              title={`Open ${app.name} in a new window`}
            >
              <ExternalLink size={14} />
              <span>{launching ? 'Opening...' : 'Open'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
