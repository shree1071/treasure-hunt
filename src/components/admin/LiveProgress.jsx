import { useState, useEffect } from 'react';
import { insforge } from '../../insforge';

const LOCATION_LABELS = {
  room506: 'Room 506', amphitheatre: 'Amphitheatre', library: 'Library',
  foodcourt: 'Food Court', welding: 'Welding Lab', bigscreen: 'Big Screen',
  kuteera: 'Kuteera', bsn3rd: 'BSN 3rd Floor', datacentre: 'Data Centre',
};

function timeSince(dateStr) {
  if (!dateStr) return 'Not started';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveProgress({ gameState }) {
  const { teams, loading: teamsLoading } = gameState;
  const [progress, setProgress] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [overrideTeam, setOverrideTeam] = useState(null);
  const [overrideLocation, setOverrideLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProgress = async () => {
    setLoadingProgress(true);
    const { data, error } = await insforge.database
      .from('team_progress')
      .select('*')
      .order('last_scanned_at', { ascending: false });
    if (error) console.error("fetchProgress error:", error);
    setProgress(data || []);
    setLoadingProgress(false);
  };

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, []);

  // Build full status for all 15 teams
  const allTeams = (teams.length ? teams : Array.from({ length: 15 }, (_, i) => ({ id: i + 1, route: [] }))).map(team => {
    const prog = progress.find(p => String(p.team_id) === String(team.id));
    const route = team.route || [];
    const total = route.length || 9;

    // Only use current_location for indexOf if it's a real stop in their route.
    // Guard against stale "reunion" strings or nulls from old data.
    const currentLoc = prog?.current_location;
    const idx = (currentLoc && route.includes(currentLoc)) ? route.indexOf(currentLoc) : -1;

    // Next location shown to admin — filter out any legacy non-stop strings
    const nextLoc = prog?.next_location;
    const safeNextLoc = (nextLoc && route.includes(nextLoc)) ? nextLoc : null;

    return {
      id: team.id,
      currentLocation: currentLoc,
      nextLocation: safeNextLoc,
      lastScanned: prog?.last_scanned_at,
      stopIndex: idx,
      totalStops: total,
      // If they have a progress row but current_location is null → they've logged in but not scanned yet → 0%
      // If idx >= 0 → they've completed that stop → (idx+1)/total
      percentage: idx < 0 ? 0 : Math.round(((idx + 1) / total) * 100),
      hasStarted: !!prog,
    };
  });

  const handleOverrideSave = async () => {
    if (!overrideTeam || !overrideLocation) return;
    setSaving(true);
    const team = teams.find(t => String(t.id) === String(overrideTeam));
    const route = team?.route || [];
    const idx = route.indexOf(overrideLocation);
    const next = idx >= 0 && idx < route.length - 1 ? route[idx + 1] : null;

    const payload = {
      current_location: overrideLocation,
      next_location: next,
      last_scanned_at: new Date().toISOString(),
    };

    // 409 Conflict Fix: Use UPDATE instead of DELETE+INSERT if row exists
    const { data: existing } = await insforge.database.from('team_progress').select('team_id').eq('team_id', overrideTeam).maybeSingle();
    
    if (existing) {
       const { error } = await insforge.database.from('team_progress').update(payload).eq('team_id', overrideTeam);
       if (error) console.error("Override update error:", error);
    } else {
       const { error } = await insforge.database.from('team_progress').insert([{ team_id: overrideTeam, ...payload }]);
       if (error) console.error("Override insert error:", error);
    }
    
    await fetchProgress();
    setSuccessMsg(`Team ${overrideTeam} moved to ${LOCATION_LABELS[overrideLocation] ?? overrideLocation}`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setSaving(false);
    setOverrideTeam(null);
    setOverrideLocation('');
  };

  const handleResetTeam = async (teamId) => {
    if (!window.confirm(`Are you sure you want to completely RESET progress for Team ${teamId}?`)) return;
    setSaving(true);
    
    const payload = {
      current_location: null,
      next_location: null,
      last_scanned_at: new Date().toISOString()
    };

    // 409 Conflict Fix: Simply UPDATE the existing row, do not delete/insert
    const { error } = await insforge.database.from('team_progress').update(payload).eq('team_id', teamId);
    
    if (error) console.error("Reset team error:", error);
    
    await fetchProgress();
    setSuccessMsg(`Team ${teamId} progress has been reset.`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setSaving(false);
  };

  const finished = allTeams.filter(t => t.stopIndex === t.totalStops - 1).length;
  const inProgress = allTeams.filter(t => t.stopIndex >= 0 && t.stopIndex < t.totalStops - 1).length;
  const notStarted = allTeams.filter(t => t.stopIndex < 0).length;

  return (
    <div className="admin-section">
      {/* Stats Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card stat-blue">
          <div className="admin-stat-num">{allTeams.length}</div>
          <div className="admin-stat-label">Total Teams</div>
        </div>
        <div className="admin-stat-card stat-green">
          <div className="admin-stat-num">{inProgress}</div>
          <div className="admin-stat-label">In Progress</div>
        </div>
        <div className="admin-stat-card stat-yellow">
          <div className="admin-stat-num">{notStarted}</div>
          <div className="admin-stat-label">Not Started</div>
        </div>
        <div className="admin-stat-card stat-purple">
          <div className="admin-stat-num">{finished}</div>
          <div className="admin-stat-label">Finished</div>
        </div>
      </div>

      {successMsg && <div className="admin-success-banner">✅ {successMsg}</div>}

      {(loadingProgress || teamsLoading) ? (
        <div className="admin-loading">📡 Fetching live data...</div>
      ) : (
        <div className="admin-team-grid">
          {allTeams.map(team => (
            <div
              key={team.id}
              className={`admin-team-card ${team.stopIndex < 0 ? 'team-idle' : team.stopIndex === team.totalStops - 1 ? 'team-done' : 'team-active'}`}
            >
              <div className="admin-team-header">
                <span className="admin-team-badge">Team {team.id}</span>
                <span className="admin-team-time">{timeSince(team.lastScanned)}</span>
              </div>

              <div className="admin-team-location">
                {team.currentLocation
                  ? LOCATION_LABELS[team.currentLocation] ?? team.currentLocation
                  : 'No check-in yet'}
              </div>

              {team.nextLocation && (
                <div className="admin-team-next">
                  → {LOCATION_LABELS[team.nextLocation] ?? team.nextLocation}
                </div>
              )}

              <div className="admin-progress-bar-wrap">
                <div className="admin-progress-bar-fill" style={{ width: `${team.percentage}%` }} />
              </div>
              <div className="admin-team-stop-count">
                {team.stopIndex < 0 ? 0 : team.stopIndex + 1}/{team.totalStops} stops · {team.percentage}%
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className="admin-override-btn"
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => { setOverrideTeam(team.id); setOverrideLocation(team.currentLocation || ''); }}
                >
                  Override
                </button>
                <button
                  className="admin-override-btn"
                  style={{ flex: 1, margin: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                  onClick={() => handleResetTeam(team.id)}
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Override Modal */}
      {overrideTeam && (
        <div className="admin-modal-overlay" onClick={() => setOverrideTeam(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-title">Move Team {overrideTeam}</h2>
            <p className="admin-modal-sub">Set their current location manually</p>
            <select
              className="admin-select"
              value={overrideLocation}
              onChange={e => setOverrideLocation(e.target.value)}
            >
              <option value="">-- Select Location --</option>
              {Object.entries(LOCATION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setOverrideTeam(null)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleOverrideSave} disabled={saving || !overrideLocation}>
                {saving ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
