import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserModal } from '../components/UserModal';
import { RoleModal } from '../components/RoleModal';
import {
  Users,
  Shield,
  Key,
  FileText,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  // State: Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // State: Roles & Permissions
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // State: Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [logFilterAction, setLogFilterAction] = useState('');
  const [totalLogs, setTotalLogs] = useState(0);

  // State: Zoho Health & Diagnostics
  const [zohoStatus, setZohoStatus] = useState(null);

  // Global loading and error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto clear alerts after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Load data according to active tab
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const loadRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setRoles(rolesRes.data.roles || []);
      setPermissions(permsRes.data.permissions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch roles & permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: { action: logFilterAction || undefined, limit: 100 }
      });
      setAuditLogs(res.data.logs || []);
      setTotalLogs(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadZohoStatus = async (showFeedback = false) => {
    setLoading(true);
    try {
      const res = await api.get('/zoho/status');
      setZohoStatus(res.data.status || null);
      if (showFeedback) {
        setSuccessMsg('Zoho integration status refreshed from backend.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to query Zoho status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    if (activeTab === 'users') {
      loadUsers();
      loadRolesAndPermissions();
    } else if (activeTab === 'roles' || activeTab === 'permissions') {
      loadRolesAndPermissions();
    } else if (activeTab === 'logs') {
      loadAuditLogs();
    } else if (activeTab === 'zoho') {
      loadZohoStatus();
    }
  }, [activeTab, logFilterAction]);

  // User Actions
  const handleSaveUser = async (formData) => {
    if (editingUser) {
      await api.put(`/admin/users/${editingUser.id}`, formData);
      setSuccessMsg(`User "${formData.name}" updated successfully.`);
    } else {
      await api.post('/admin/users', formData);
      setSuccessMsg(`User "${formData.name}" created successfully.`);
    }
    await loadUsers();
  };

  const handleToggleUserActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { isActive: !user.isActive });
      setSuccessMsg(`User account "${user.email}" ${!user.isActive ? 'activated' : 'deactivated'}.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.email}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${user.id}`);
      setSuccessMsg(`User "${user.email}" deleted successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Role Actions
  const handleSaveRole = async (formData) => {
    if (editingRole) {
      await api.put(`/admin/roles/${editingRole.id}`, formData);
      setSuccessMsg(`Role "${formData.name}" updated.`);
    } else {
      await api.post('/admin/roles', formData);
      setSuccessMsg(`Role "${formData.name}" created.`);
    }
    await loadRolesAndPermissions();
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/admin/roles/${role.id}`);
      setSuccessMsg(`Role "${role.name}" deleted.`);
      await loadRolesAndPermissions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete role');
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.roles.some((r) => r.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={26} style={{ color: 'var(--primary)' }} />
          Admin Governance & Security Console
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage enterprise users, configure RBAC role-permission mappings, inspect system audit logs, and monitor Zoho integration health.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Users ({users.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={16} />
          <span>Roles ({roles.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Key size={16} />
          <span>Permissions ({permissions.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} />
          <span>Audit Logs ({totalLogs})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'zoho' ? 'active' : ''}`}
          onClick={() => setActiveTab('zoho')}
        >
          <Server size={16} />
          <span>Zoho Integration Health</span>
        </button>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={() => setError('')} className="btn btn-secondary btn-sm">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: USERS MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Employee Accounts</h2>
              <p className="card-desc">Control authentication status and assign corporate roles.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', width: '260px' }}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              </div>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add Employee</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No employees match the current query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        {u.roles.map((r) => (
                          <span key={r.id} className="badge badge-info" style={{ marginRight: '0.35rem' }}>
                            {r.name}
                          </span>
                        ))}
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Deactivated</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className="btn btn-secondary btn-sm"
                            title={u.isActive ? 'Deactivate account' : 'Activate account'}
                          >
                            {u.isActive ? <UserX size={14} style={{ color: '#f87171' }} /> : <UserCheck size={14} style={{ color: '#34d399' }} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setUserModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Edit user details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger btn-sm"
                            title="Permanently delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ROLES MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'roles' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Roles & Access Scopes</h2>
              <p className="card-desc">Define corporate roles and bundle specific application permissions.</p>
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Role</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Assigned Users</th>
                  <th>Granted Permissions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.name}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>{r.description || '—'}</td>
                    <td>
                      <span className="badge badge-info">{r.userCount} user(s)</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '400px' }}>
                        {r.permissions.length === 0 ? (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>None</span>
                        ) : (
                          r.permissions.map((p) => (
                            <span key={p.id} className="permission-pill">
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => {
                            setEditingRole(r);
                            setRoleModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Edit role and permissions"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!['Admin', 'HR', 'Sales', 'Support', 'Finance'].includes(r.name) && (
                          <button
                            onClick={() => handleDeleteRole(r)}
                            className="btn btn-danger btn-sm"
                            title="Delete custom role"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: PERMISSIONS MATRIX */}
      {/* ==================================================== */}
      {activeTab === 'permissions' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">System Permissions Matrix</h2>
              <p className="card-desc">Granular authorization keys recognized by the backend RBAC middleware.</p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permission Key</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Roles with this Permission</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => {
                  const rolesWithPerm = roles.filter((r) =>
                    r.permissions.some((perm) => perm.id === p.id)
                  );

                  return (
                    <tr key={p.id}>
                      <td>
                        <code style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{p.name}</code>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.description}</td>
                      <td>
                        <span className="badge badge-info">
                          {p.name.startsWith('VIEW_ZOHO') ? 'Zoho App Access' : 'Administration'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {rolesWithPerm.map((r) => (
                            <span key={r.id} className="badge badge-success">
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ==================================================== */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Security & Activity Audit Logs</h2>
              <p className="card-desc">Immutable audit record of authentication, access attempts, and administrative actions.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: '220px' }}
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
                <option value="ZOHO_APP_ACCESSED">ZOHO_APP_ACCESSED</option>
                <option value="ZOHO_API_REQUEST">ZOHO_API_REQUEST</option>
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="USER_UPDATED">USER_UPDATED</option>
                <option value="USER_DELETED">USER_DELETED</option>
              </select>
              <button onClick={loadAuditLogs} className="btn btn-secondary btn-sm" title="Refresh logs">
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isFailure = log.action.includes('FAILED') || log.action.includes('UNAUTHORIZED');
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${isFailure ? 'badge-danger' : 'badge-success'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.resource}</td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {log.user ? `${log.user.name} (${log.user.email})` : 'System / Unauthenticated'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                          {log.ipAddress || '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', wordBreak: 'break-word' }}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: ZOHO INTEGRATION HEALTH & DIAGNOSTICS */}
      {/* ==================================================== */}
      {activeTab === 'zoho' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Zoho One OAuth Service Account Status</h2>
              <p className="card-desc">Diagnostic health of backend-to-Zoho API integration. Employees never enter Zoho credentials.</p>
            </div>
            <button
              onClick={() => loadZohoStatus(true)}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              title="Query backend health/status endpoint"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>

          {zohoStatus ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Integration Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {zohoStatus.configured ? (
                      <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.3rem 0.6rem' }}>
                        <CheckCircle2 size={15} /> Configured & Ready
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.3rem 0.6rem' }}>
                        <AlertTriangle size={15} /> Credentials Needed in .env
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>OAuth Accounts Base URL</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                    {zohoStatus.accountsUrl || 'Not configured'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Zoho API Base URL</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                    {zohoStatus.apiBaseUrl || 'Not configured'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>In-Memory Token Cache</div>
                  <div>
                    {zohoStatus.hasTokenCached ? (
                      <span className="badge badge-success">Active Cached Token</span>
                    ) : (
                      <span className="badge badge-info">No Active Cached Token</span>
                    )}
                  </div>
                </div>
              </div>

              {!zohoStatus.configured && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> Missing Environment Variables in backend/.env:
                  </h4>
                  <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {zohoStatus.missingCredentials.map((key) => (
                      <li key={key} style={{ marginBottom: '0.25rem' }}>
                        <code>{key}</code>
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {zohoStatus.documentationGuide}
                  </p>
                </div>
              )}

              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Architecture Verification: Zero-Credential Enterprise Access
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  1. Employees sign in to our custom portal using their enterprise credentials.<br />
                  2. The server-side <code>zohoService</code> handles token refreshing directly with Zoho Accounts OAuth endpoint.<br />
                  3. Access tokens and refresh tokens are <strong>never</strong> transmitted to client browsers.<br />
                  4. The portal frontend only triggers authorized API proxies (e.g. <code>/api/zoho/people</code>, <code>/api/zoho/crm</code>).
                </p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading Zoho integration diagnostics from backend gateway...
            </div>
          )}
        </div>
      )}

      {/* User Add/Edit Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        initialData={editingUser}
        availableRoles={roles}
      />

      {/* Role Add/Edit Modal */}
      <RoleModal
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        initialData={editingRole}
        allPermissions={permissions}
      />
    </div>
  );
};
