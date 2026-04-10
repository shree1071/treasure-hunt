import { useState } from 'react';

const LOCATIONS = [
  'room506','amphitheatre','library','foodcourt',
  'welding','bigscreen','kuteera','bsn3rd','datacentre'
];
const LOCATION_LABELS = {
  room506:'Room 506', amphitheatre:'Amphitheatre', library:'Library',
  foodcourt:'Food Court', welding:'Welding Lab', bigscreen:'Big Screen',
  kuteera:'Kuteera', bsn3rd:'BSN 3rd Floor', datacentre:'Data Centre',
};

export default function TeamManagement({ gameState }) {
  const { teams, loading, updateTeam } = gameState;
  const [editingTeam, setEditingTeam] = useState(null);
  const [editPin, setEditPin] = useState('');
  const [editRoute, setEditRoute] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) return <div className="admin-loading">Loading team data...</div>;

  const openEdit = (team) => {
    setEditingTeam(team);
    setEditPin(team.pin || '');
    setEditRoute([...(team.route || [])]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRouteStop = (index, value) => {
    const r = [...editRoute];
    r[index] = value;
    setEditRoute(r);
  };

  const handleSave = async () => {
    if (editPin.length < 4) { setErrorMsg('PIN must be at least 4 digits.'); return; }
    const filled = editRoute.filter(Boolean);
    if (new Set(filled).size !== filled.length) {
      setErrorMsg('Route cannot have duplicate locations.'); return;
    }
    setSaving(true);
    try {
      await updateTeam(editingTeam.id, { pin: editPin, route: editRoute });
      setSuccessMsg(`Team ${editingTeam.id} updated!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingTeam(null);
    } catch {
      setErrorMsg('Save failed. Try again.');
    }
    setSaving(false);
  };

  return (
    <div className="admin-section">
      {successMsg && <div className="admin-success-banner">✅ {successMsg}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>PIN</th>
              <th>Route (9 Stops)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id}>
                <td><span className="admin-team-badge-sm">Team {team.id}</span></td>
                <td><span className="admin-pin-display">{'•'.repeat(team.pin?.length ?? 4)}</span></td>
                <td>
                  <div className="admin-route-preview">
                    {(team.route || []).map((loc, i) => (
                      <span key={i} className="admin-route-chip">{LOCATION_LABELS[loc] ?? loc}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <button className="admin-btn-primary btn-sm" onClick={() => openEdit(team)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingTeam && (
        <div className="admin-modal-overlay" onClick={() => setEditingTeam(null)}>
          <div className="admin-modal admin-modal-large" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-title">Edit Team {editingTeam.id}</h2>

            <div className="admin-form-group">
              <label className="admin-form-label">PIN Code</label>
              <input
                className="admin-input"
                type="text"
                maxLength={6}
                value={editPin}
                onChange={e => setEditPin(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Route Order (9 stops)</label>
              <div className="admin-route-editor">
                {editRoute.map((stop, i) => (
                  <div key={i} className="admin-route-editor-row">
                    <span className="admin-route-num">{i + 1}</span>
                    <select
                      className="admin-select"
                      value={stop || ''}
                      onChange={e => handleRouteStop(i, e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{LOCATION_LABELS[loc]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && <p className="admin-form-error">{errorMsg}</p>}

            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setEditingTeam(null)}>Cancel</button>
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
