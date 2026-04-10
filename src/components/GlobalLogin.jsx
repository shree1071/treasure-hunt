import { useState, useEffect } from 'react';
import { insforge } from '../insforge';
import ErrorAlert from './ErrorAlert';

const RULES = [
  "Each team of 4 splits — 3 runners hunt locations, 1 stays at BSN to solve the puzzle.",
  "Scan the QR at each location, then enter your Team Number and PIN to unlock your next clue.",
  "Do not share your PIN or clues with other teams.",
  "You must visit locations in the order revealed — no skipping ahead.",
  "After your 4th stop, return to BSN Auditorium for your teammate's answer before continuing.",
  "First team to complete all 9 stops and return wins. Stay fair, stay fast.",
];

/* Simple CSS-animated particle layer */
function Particles() {
  const pts = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + Math.round((i * 37 + 11) % 92)}%`,
    top:  `${5 + Math.round((i * 53 + 7)  % 85)}%`,
    delay: `${(i * 0.4).toFixed(1)}s`,
    dur:   `${3 + (i % 4)}s`,
    size:  i % 3 === 0 ? 2 : 1,
  }));
  return (
    <div className="hub-particles" aria-hidden="true">
      {pts.map((p, i) => (
        <span
          key={i}
          className="hub-particle"
          style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}

function HubPill({ label, active, special }) {
  return (
    <div className={`hub-pill ${active ? 'hub-pill-active' : ''} ${special ? 'hub-pill-special' : ''}`}>
      {label}
    </div>
  );
}

function HubDiagram() {
  const [tick, setTick] = useState(0);

  // cycle through nodes to light them up automatically
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const leftNodes  = ['Scan QR', 'Enter PIN', 'Get Clue'];
  const rightNodes = ['Hunt', 'Reunite', 'Win'];
  const highlight  = tick % 6;        // 0-2 = left, 3-5 = right

  return (
    <div className="hub-root" style={{ minHeight: 'auto', padding: '1rem 0 2rem 0' }}>
      <Particles />

      <div className="hub-diagram" style={{ marginTop: '1rem' }}>
        <div className="hub-col hub-col-left">
          {leftNodes.map((label, i) => (
            <HubPill key={label} label={label} active={highlight === i} special={label === 'Enter PIN'} />
          ))}
        </div>

        <div className="hub-center-wrap">
          <div className="hub-line hub-line-left">
            <div className="hub-line-dot hub-line-dot-left" />
          </div>

          <div className="hub-orb">
            <div className="hub-orb-ring hub-orb-ring-1" />
            <div className="hub-orb-ring hub-orb-ring-2" />
            <div className="hub-orb-core">
              <span className="hub-star-glyph">✳</span>
            </div>
          </div>

          <div className="hub-line hub-line-right">
            <div className="hub-line-dot hub-line-dot-right" />
          </div>
        </div>

        <div className="hub-col hub-col-right">
          {rightNodes.map((label, i) => (
            <HubPill key={label} label={label} active={highlight === i + 3} special={label === 'Reunite'} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GlobalLogin({ onAuth }) {
  const [team, setTeam] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const teamNum = parseInt(team, 10);
    if (!teamNum || teamNum < 1 || teamNum > 15) {
      setError('Enter a valid team number (1–15).');
      return;
    }
    if (!pin || pin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    const { data, error: dbErr } = await insforge.database
      .from('th_teams')
      .select('id, pin')
      .eq('id', teamNum)
      .maybeSingle();

    setLoading(false);
    if (dbErr || !data) {
      setError('Team not found. Check your Team Number.');
      return;
    }
    if (data.pin !== pin) {
      setError('Incorrect PIN. Try again.');
      return;
    }

    onAuth(teamNum);
  };

  return (
    <div>
      {/* Hero title */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div className="hero-title">LOCATE.</div>
        <div className="hero-title">DECODE.</div>
        <div className="hero-sub">CONQUER.</div>
      </div>

      {/* Animated Hub Diagram */}
      <HubDiagram />

      {/* Login card */}
      <div className="card">
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamNum">Team Number</label>
            <input
              id="teamNum"
              type="number"
              min="1"
              max="15"
              placeholder="1 – 15"
              value={team}
              onChange={e => setTeam(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="teamPin">Access PIN</label>
            <input
              id="teamPin"
              type="password"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'VERIFYING...' : 'AUTHENTICATE'}
          </button>
        </form>
      </div>

      {/* Rules */}
      <div className="rules-card">
        <div className="rules-title">// Mission Rules</div>
        <ul className="rules-list">
          {RULES.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>

      {/* Support Info */}
      <div style={{
        marginTop: '2rem',
        padding: '1.2rem',
        border: '1px solid rgba(255, 102, 0, 0.3)',
        borderRadius: '6px',
        backgroundColor: 'rgba(255, 102, 0, 0.05)',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          // EMERGENCY OVERRIDE CONTACT
        </div>
        <div style={{ color: 'var(--text-bright)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
          <strong>Shreeharsha</strong>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
          Technical Lead, Gen AI
        </div>
        <a 
          href="tel:9901366449" 
          style={{ 
            display: 'inline-block',
            marginTop: '0.2rem',
            padding: '0.4rem 1rem',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em'
          }}
        >
          📞 9901 366 449
        </a>
      </div>
    </div>
  );
}

export default GlobalLogin;
