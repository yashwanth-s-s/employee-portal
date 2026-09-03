import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';

export const UserModal = ({ isOpen, onClose, onSave, initialData = null, availableRoles = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '', // Leave blank unless changing
        roleId: initialData.roles && initialData.roles.length > 0 ? initialData.roles[0].id : '',
        isActive: initialData.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        roleId: availableRoles.length > 0 ? availableRoles[0].id : '',
        isActive: true
      });
    }
    setError('');
  }, [initialData, availableRoles, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required fields.');
      return;
    }

    if (!isEdit && !formData.password) {
      setError('Password is required when creating a new employee.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        roleId: formData.roleId ? Number(formData.roleId) : null
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEdit ? <Save size={18} style={{ color: 'var(--accent-cyan)' }} /> : <UserPlus size={18} style={{ color: 'var(--accent-emerald)' }} />}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {isEdit ? `Edit Employee: ${initialData.name}` : 'Register New Employee'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Eleanor Vance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="eleanor.vance@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {isEdit ? 'New Password (leave blank to keep unchanged)' : 'Initial Password'}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={isEdit ? '••••••••' : 'Enter secure password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                {...(!isEdit ? { required: true } : {})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Role</label>
              <select
                className="form-select"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              >
                <option value="">-- Select a Role --</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.description ? `(${role.description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                Account is Active (Inactive accounts cannot authenticate)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
