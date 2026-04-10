import { useState } from 'react';
import LiveProgress from './LiveProgress';
import TeamManagement from './TeamManagement';
import GameSettings from './GameSettings';
import { useGameState } from '../../hooks/useGameState';

const ADMIN_PASSWORD = 'admin2026';

const NAV_TABS = [
  { id: 'live',     label: 'Live Progress',   icon: '📡' },
  { id: 'teams',    label: 'Team Management', icon: '👥' },
  { id: 'settings', label: 'Game Settings',   icon: '⚙️' },
];

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const gameState = useGameState();

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      setAuthError('Incorrect master key. Try again.');
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-auth-overlay">
        <div className="admin-auth-card">
          <div className="admin-auth-icon">🔐</div>
          <h1 className="admin-auth-title">T-HUNT CONTROL</h1>
          <p className="admin-auth-subtitle">Admin Access Required</p>
          <form onSubmit={handleLogin} className="admin-auth-form">
            <input
              type="password"
              className="admin-auth-input"
              placeholder="Enter Master Key"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(''); }}
              autoFocus
            />
            {authError && <p className="admin-auth-error">{authError}</p>}
            <button type="submit" className="admin-auth-btn">AUTHENTICATE</button>
          </form>
          <a href="/" className="admin-auth-back">← Back to Game</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">⚡</span>
          <div>
            <div className="admin-sidebar-title">T-HUNT</div>
            <div className="admin-sidebar-role">Control Center</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-status-dot"></div>
          <span>System Online</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1 className="admin-topbar-title">
              {NAV_TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="admin-topbar-subtitle">T-Hunt 2026 · Game Administration</p>
          </div>
          <button
            className="admin-refresh-btn"
            onClick={gameState.refreshState}
            disabled={gameState.loading}
          >
            {gameState.loading ? '⏳' : '🔄'} Refresh
          </button>
        </header>

        <div className="admin-content">
          {gameState.error && (
            <div className="admin-error-banner">⚠️ {gameState.error}</div>
          )}

          {activeTab === 'live'     && <LiveProgress gameState={gameState} />}
          {activeTab === 'teams'    && <TeamManagement gameState={gameState} />}
          {activeTab === 'settings' && <GameSettings gameState={gameState} />}
        </div>
      </main>
    </div>
  );
}
