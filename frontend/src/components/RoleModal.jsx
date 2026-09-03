import React, { useState, useEffect } from 'react';
import { X, Shield, Key } from 'lucide-react';

export const RoleModal = ({ isOpen, onClose, onSave, initialData = null, allPermissions = [] }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedPermissions(
        initialData.permissions ? initialData.permissions.map((p) => p.id) : []
      );
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        permissionIds: selectedPermissions
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {isEdit ? `Edit Role: ${initialData.name}` : 'Create Custom Role'}
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
              <label className="form-label">Role Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of department responsibilities"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <Key size={14} /> Assigned Permissions ({selectedPermissions.length} selected)
              </label>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem'
                }}
              >
                {allPermissions.map((perm) => {
                  const checked = selectedPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: checked ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.id)}
                        style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: checked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {perm.name}
                        </div>
                        {perm.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            {perm.description}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
