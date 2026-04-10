import { useState } from 'react';

const CLUE_KEYS = [
  { key: 'room506', label: 'Room 506' }, { key: 'amphitheatre', label: 'Amphitheatre' },
  { key: 'library', label: 'Library' }, { key: 'foodcourt', label: 'Food Court' },
  { key: 'welding', label: 'Welding Lab' }, { key: 'bigscreen', label: 'Big Screen' },
  { key: 'kuteera', label: 'Kuteera' }, { key: 'bsn3rd', label: 'BSN 3rd Floor' },
  { key: 'datacentre', label: 'Data Centre' },
];

export default function GameSettings({ gameState }) {
  const { locations, loading, updateClue } = gameState;
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) return <div className="admin-loading">Loading game settings...</div>;

  // Build a map from the locations array
  const clueMap = Object.fromEntries(locations.map(l => [l.id, l.clue]));

  const openEdit = (key) => {
    setEditingKey(key);
    setEditValue(clueMap[key] || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSave = async () => {
    if (!editValue.trim()) { setErrorMsg('Clue cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateClue(editingKey, editValue.trim());
      setSuccessMsg('Clue updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingKey(null);
    } catch {
      setErrorMsg('Save failed. Try again.');
    }
    setSaving(false);
  };

  return (
    <div className="admin-section">
      {successMsg && <div className="admin-success-banner">✅ {successMsg}</div>}

      <div className="admin-settings-section-title">📍 Location Clues</div>
      <div className="admin-settings-grid">
        {CLUE_KEYS.map(({ key, label }) => (
          <div key={key} className="admin-setting-card">
            <div className="admin-setting-header">
              <span className="admin-setting-label">{label}</span>
              <button className="admin-btn-primary btn-sm" onClick={() => openEdit(key)}>Edit</button>
            </div>
            <p className="admin-setting-value">{clueMap[key] || <em style={{color:'var(--text-dim)'}}>No clue set</em>}</p>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingKey && (
        <div className="admin-modal-overlay" onClick={() => setEditingKey(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-title">
              Edit: {CLUE_KEYS.find(c => c.key === editingKey)?.label ?? editingKey}
            </h2>
            <textarea
              className="admin-textarea"
              rows={6}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
            />
            {errorMsg && <p className="admin-form-error">{errorMsg}</p>}
            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setEditingKey(null)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
