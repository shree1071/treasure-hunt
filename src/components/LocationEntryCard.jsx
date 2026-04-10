import { useState, useEffect, useRef } from 'react';
import ErrorAlert from './ErrorAlert';

const VALID_LOCATIONS = [
  'room506','amphitheatre','library','foodcourt',
  'welding','bigscreen','kuteera','bsn4th','datacentre'
];

/* ── Animated Hub ─────────────────────────────── */
function HubDiagram({ onScanQR, onEnterPIN, onGetClue, onHunt, onReunite, onWin }) {
  const [activeNode, setActiveNode] = useState(null);
  const [tick, setTick] = useState(0);

  // cycle through nodes to light them up automatically
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const leftNodes  = ['Scan QR', 'Enter PIN', 'Get Clue'];
  const rightNodes = ['Hunt', 'Reunite', 'Win'];
  const highlight  = tick % 6;        // 0-2 = left, 3-5 = right

  const leftActions  = [onScanQR, onEnterPIN, onGetClue];
  const rightActions = [onHunt, onReunite, onWin];

  return (
    <div className="hub-root">
      {/* Star-field particles */}
      <Particles />

      <div className="hub-title-block">
        <div className="hub-title-badge">T-HUNT // 2026</div>
        <h1 className="hub-main-title">SYSTEM</h1>
        <div className="hub-sub-title">LOCKED.</div>
      </div>

      {/* ── Node Diagram ────────────────── */}
      <div className="hub-diagram">

        {/* Left column */}
        <div className="hub-col hub-col-left">
          {leftNodes.map((label, i) => (
            <HubPill
              key={label}
              label={label}
              active={highlight === i || activeNode === label}
              special={label === 'Enter PIN'}
              side="left"
              onClick={() => {
                setActiveNode(label);
                leftActions[i] && leftActions[i]();
              }}
            />
          ))}
        </div>

        {/* Center orb with connectors */}
        <div className="hub-center-wrap">
          {/* Left line */}
          <div className="hub-line hub-line-left">
            <div className="hub-line-dot hub-line-dot-left" />
          </div>

          {/* The orb */}
          <div className="hub-orb">
            <div className="hub-orb-ring hub-orb-ring-1" />
            <div className="hub-orb-ring hub-orb-ring-2" />
            <div className="hub-orb-core">
              <span className="hub-star-glyph">✳</span>
            </div>
          </div>

          {/* Right line */}
          <div className="hub-line hub-line-right">
            <div className="hub-line-dot hub-line-dot-right" />
          </div>
        </div>

        {/* Right column */}
        <div className="hub-col hub-col-right">
          {rightNodes.map((label, i) => (
            <HubPill
              key={label}
              label={label}
              active={highlight === i + 3 || activeNode === label}
              special={label === 'Reunite'}
              side="right"
              onClick={() => {
                setActiveNode(label);
                rightActions[i] && rightActions[i]();
              }}
            />
          ))}
        </div>
      </div>

      {/* Tagline */}
      <p className="hub-tagline">Scan a QR node — or enter a location code below</p>
    </div>
  );
}

function HubPill({ label, active, special, side, onClick }) {
  return (
    <button
      className={`hub-pill ${active ? 'hub-pill-active' : ''} ${special ? 'hub-pill-special' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {label}
    </button>
  );
}

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

/* ── Main Card ─────────────────────────────────── */
function LocationEntryCard({ onLocationSubmit }) {
  const [view, setView]   = useState('hub');   // 'hub' | 'pin'
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (view === 'pin' && inputRef.current) inputRef.current.focus();
  }, [view]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const norm = code.trim().toLowerCase();
    if (VALID_LOCATIONS.includes(norm)) {
      onLocationSubmit(norm);
    } else {
      setError(`"${code}" is not a valid location code.`);
    }
  };

  if (view === 'pin') {
    return (
      <div className="loc-pin-view">
        <button className="hub-back-btn" onClick={() => { setView('hub'); setError(''); }}>
          ← Back
        </button>
        <div className="hub-pin-title">ENTER LOCATION CODE</div>
        <p className="hub-pin-sub">Type the code printed on the location sticker, or scan a QR code.</p>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="hub-pin-form">
          <input
            ref={inputRef}
            id="locCode"
            type="text"
            className="hub-pin-input"
            placeholder="e.g. library"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            autoComplete="off"
            autoCapitalize="none"
          />
          <button className="btn-primary" type="submit">VERIFY NODE ›</button>
        </form>
      </div>
    );
  }

  return (
    <HubDiagram
      onEnterPIN={() => setView('pin')}
      onScanQR={null}
      onGetClue={null}
      onHunt={null}
      onReunite={null}
      onWin={null}
    />
  );
}

export default LocationEntryCard;
