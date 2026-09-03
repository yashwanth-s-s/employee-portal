import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ExternalLink, LogOut, User, RefreshCw } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'Employee';
  const isAdmin = user.roles?.includes('Admin');

  const getRoleClass = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'role-admin';
      case 'hr': return 'role-hr';
      case 'sales': return 'role-sales';
      case 'support': return 'role-support';
      case 'finance': return 'role-finance';
      default: return 'role-hr';
    }
  };

  // Demo user quick switcher for interview demonstrations
  const handleQuickSwitch = async (e) => {
    const roleChoice = e.target.value;
    if (!roleChoice) return;

    const credentialsMap = {
      Admin: { email: 'admin@company.com', pass: 'Password123!' },
      HR: { email: 'hr@company.com', pass: 'Password123!' },
      Sales: { email: 'sales@company.com', pass: 'Password123!' },
      Support: { email: 'support@company.com', pass: 'Password123!' },
      Finance: { email: 'finance@company.com', pass: 'Password123!' }
    };

    const targetCred = credentialsMap[roleChoice];
    if (targetCred) {
      try {
        await login(targetCred.email, targetCred.pass);
        navigate('/');
      } catch (err) {
        console.error('Quick switch failed:', err);
      }
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <div className="brand-badge">PORTAL</div>
          <span>Zoho One Gateway</span>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            My Applications
          </Link>
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Shield size={15} />
              Admin Console
            </Link>
          )}
        </nav>

        <div className="nav-user">
          {/* Quick Demo Switcher for interviewers */}
          <div className="quick-switcher" title="Instantly switch roles to test RBAC during interview">
            <RefreshCw size={13} style={{ color: 'var(--accent-cyan)' }} />
            <select
              className="switcher-select"
              value={primaryRole}
              onChange={handleQuickSwitch}
            >
              <option value="Admin">Demo: Admin</option>
              <option value="HR">Demo: HR</option>
              <option value="Sales">Demo: Sales</option>
              <option value="Support">Demo: Support</option>
              <option value="Finance">Demo: Finance</option>
            </select>
          </div>

          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`user-role-badge ${getRoleClass(primaryRole)}`}>
              {primaryRole}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="btn btn-secondary btn-sm"
            title="Logout from portal"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
