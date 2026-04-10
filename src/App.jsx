import { useState, useEffect } from 'react';
import { insforge } from './insforge';
import './App.css';

import GlobalLogin from './components/GlobalLogin';
import ClueDisplay from './components/ClueDisplay';
import AdminDashboard from './components/admin/AdminDashboard';
import { LOCATION_CODES } from './data';

const VALID_LOCATIONS = Object.values(LOCATION_CODES);

// ── Simple path-based routing (no router needed) ──────────────────
const isAdminRoute = window.location.pathname === '/admin';

function App() {
  // Admin dashboard
  if (isAdminRoute) {
    return <AdminDashboard />;
  }

  return <GameApp />;
}

function GameApp() {
  // ── Auth: persisted in sessionStorage ────────────────────────────
  const [teamNumber, setTeamNumber] = useState(() => {
    const saved = sessionStorage.getItem('th_team');
    return saved ? parseInt(saved, 10) : null;
  });

  // ── Location from QR URL param or manual entry ───────────────────
  const [location, setLocation] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('location');
    if (!loc) return null;
    
    // If it's a numeric code, map to string ID
    if (LOCATION_CODES[loc]) {
      return LOCATION_CODES[loc];
    }
    
    // Fallback if they scanned an old QR with string ID directly
    if (VALID_LOCATIONS.includes(loc.toLowerCase())) {
      return loc.toLowerCase();
    }
    
    return null;
  });

  const [scanKey, setScanKey] = useState(0);

  const [restoring, setRestoring] = useState(() => {
    const saved = sessionStorage.getItem('th_team');
    const params = new URLSearchParams(window.location.search);
    return !!saved && !params.get('location');
  });

  useEffect(() => {
    if (restoring && teamNumber) {
      insforge.database
        .from('team_progress')
        .select('current_location')
        .eq('team_id', teamNumber)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.current_location) {
            setLocation(data.current_location);
          }
          setRestoring(false);
        })
        .catch((err) => {
          console.error("Restore error", err);
          setRestoring(false);
        });
    }
  }, [restoring, teamNumber]);

  const handleAuth = (team) => {
    sessionStorage.setItem('th_team', team);
    setTeamNumber(team);
    const params = new URLSearchParams(window.location.search);
    if (!params.get('location')) {
      setRestoring(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setTeamNumber(null);
    setLocation(null);
    // remove ?location= from URL on logout
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleLocationSubmit = (locCode) => {
    // update URL to simulate scan
    const url = new URL(window.location);
    url.searchParams.set('location', locCode);
    window.history.pushState({}, '', url);
    setLocation(locCode);
    setScanKey(k => k + 1); // force ClueDisplay to remount even if location unchanged
  };

  // ── Render flow ───────────────────────────────────────────────────
  const renderContent = () => {
    // 1. Not logged in
    if (!teamNumber) {
      return <GlobalLogin onAuth={handleAuth} />;
    }

    if (restoring) {
      return (
        <div className="loading" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div><div className="spinner" style={{margin: '0 auto 1rem'}}></div>RESTORING PROGRESS...</div>
        </div>
      );
    }

    // 2. Logged in → show current Clue (start clue if location is null, otherwise next based on location)
    // The Location form is inside ClueDisplay!
    return (
      <ClueDisplay 
        key={scanKey}
        teamNumber={teamNumber} 
        location={location} 
        isStart={!location} 
        onLocationSubmit={handleLocationSubmit}
      />
    );
  };

  return (
    <div className="app-wrap">
      <header className="app-header">
        <div className="brand">T-HUNT // 2026</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {teamNumber && <div className="badge">TEAM {teamNumber}</div>}
          {teamNumber && (
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-dim)', borderRadius: '3px',
                padding: '3px 8px', fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                letterSpacing: '0.08em'
              }}
            >
              LOGOUT
            </button>
          )}
        </div>
      </header>
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
