import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { insforge, FINAL_CLUE, REUNION_MESSAGE } from '../insforge';
import PhotoProof from './PhotoProof';
import { LOCATION_CODES, ROUTES, CLUES } from '../data';

async function saveTeamProgress(teamId, currentLoc, nextLoc) {
  try {
    const now = new Date().toISOString();
    const { data: existing } = await insforge.database
      .from('team_progress')
      .select('team_id, started_at')
      .eq('team_id', teamId)
      .maybeSingle();

    const payload = {
      team_id: teamId,
      current_location: currentLoc,
      next_location: nextLoc || null,
      last_scanned_at: now,
      finished_at: nextLoc === null ? now : null,
    };

    if (existing) {
      // Preserve original started_at
      await insforge.database.from('team_progress').update(payload).eq('team_id', teamId);
    } else {
      // First scan — record start time
      await insforge.database.from('team_progress').insert([{
        ...payload,
        started_at: now,
      }]);
    }
  } catch (err) {
    console.error('Progress save error:', err);
  }
}

function AnimatedProgress({ percent }) {
  return (
    <div className="team-progress-container">
      <div className="team-progress-header">
        <span>Mission Progress</span>
        <span style={{ color: 'var(--accent)' }}>{percent}%</span>
      </div>
      <div className="team-progress-wrap">
        <div className="team-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LocationEntryInline({ onLocationSubmit }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const entered = code.trim();
    if (LOCATION_CODES[entered]) {
      setErr('');
      setCode('');
      onLocationSubmit(LOCATION_CODES[entered]);
    } else {
      setErr(`"${code}" is not a valid location PIN.`);
    }
  };

  return (
    <div className="card" style={{ marginTop: '1rem', borderTop: '2px solid var(--accent)' }}>
      <div className="clue-label" style={{ marginBottom: '0.8rem' }}>// ENTER NODE PIN BELOW</div>
      {err && <div className="alert error">{err}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <input
          type="number"
          placeholder="e.g. 1234"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          autoComplete="off"
          style={{ width: '100%', padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.4)', color: 'var(--text-bright)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}
        />
        <button type="submit" className="btn-primary" style={{ marginTop: 0 }}>VERIFY NODE ›</button>
      </form>
    </div>
  );
}

/**
 * ClueDisplay
 * Shows the next clue (fetched live from InsForge) for the team at their current location.
 * Also includes a PhotoProof panel for submitting group selfies.
 *
 * @param {object} props
 * @param {number} props.teamNumber
 * @param {string} props.location - the location they just scanned (or null if this is the start)
 * @param {boolean} props.isStart - true when showing the first clue right after login
 * @param {function} props.onLocationSubmit - handler when node is verified
 */
function ClueDisplay({ teamNumber, location, isStart, onLocationSubmit }) {
  const [clue, setClue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('normal'); // 'normal' | 'reunion' | 'final' | 'wrong'
  const [proofDone, setProofDone] = useState(isStart); // no proof needed at start
  const [progress, setProgress] = useState(0);
  const [rank, setRank] = useState(null);

  const getRankName = (r) => {
    if (r === 1) return '1ST PLACE 🥇';
    if (r === 2) return '2ND PLACE 🥈';
    if (r === 3) return '3RD PLACE 🥉';
    return `${r}TH PLACE`;
  };

  useEffect(() => {
    if (type === 'final') {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  }, [type]);

  useEffect(() => {
    async function fetchClue() {
      setLoading(true);
      setError('');

      // Use local routes — no DB needed, always correct
      const route = ROUTES[teamNumber];

      if (!route) {
        setError('Invalid team number. Please log in again.');
        setLoading(false);
        return;
      }

      // If start: show clue for route[0] (their first destination)
      // Save progress so admin sees them as "In Progress" immediately.
      if (isStart) {
        const firstStop = route[0];
        // Progress shows 0 stops done, heading to stop 1
        setProgress(0);
        setClue(CLUES[firstStop] || 'Clue not found.');
        setType('normal');
        setLoading(false);
        // current_location = null means "not at a stop yet"; next = their first real stop.
        saveTeamProgress(teamNumber, null, firstStop);
        return;
      }

      // Check if this location is even in the team's route
      const currentIndex = route.indexOf(location);

      if (currentIndex === -1) {
        // Not in this team's route at all — wrong place
        setProgress(0);
        setClue('This location is not part of your route! Re-read your clue and go to the right place.');
        setType('wrong');
        setLoading(false);
        // Don't overwrite DB progress on a wrong scan
        return;
      }

      // ── Valid location — compute stable progress ──────────────────
      // (currentIndex + 1) out of route.length stops completed.
      // We do NOT use reunion/final as location IDs in the DB — only real stop IDs.
      const stopsCompleted = currentIndex + 1;
      const pct = Math.round((stopsCompleted / route.length) * 100);
      setProgress(pct);

      // After 4th stop (index 3) → Reunion twist
      // IMPORTANT: next_location must be a real stop ID (route[4] = datacentre),
      // NOT the string "reunion" — that would break indexOf() on the admin side.
      if (currentIndex === 3) {
        const fifthStop = route[4]; // always 'datacentre'
        setClue(REUNION_MESSAGE);
        setType('reunion');
        setLoading(false);
        saveTeamProgress(teamNumber, location, fifthStop);
        return;
      }

      // Last stop → Final
      if (currentIndex === route.length - 1) {
        setType('final');
        await saveTeamProgress(teamNumber, location, null);
        setLoading(false);
        return;
      }

      // Normal stop: show clue for NEXT location
      const nextLocation = route[currentIndex + 1];
      setClue(CLUES[nextLocation] || 'Clue not found.');
      setType('normal');
      setLoading(false);
      saveTeamProgress(teamNumber, location, nextLocation);
    }

    fetchClue();
  }, [teamNumber, location, isStart]);

  // ── Rendering ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        DECRYPTING...
      </div>
    );
  }

  const headings = {
    normal: isStart ? 'FIRST OBJECTIVE' : 'NEXT OBJECTIVE',
    reunion: 'TEAM REUNION',
    final: '🎉 HUNT COMPLETE!',
    wrong: 'WRONG LOCATION',
  };

  const headingExtra = {
    reunion: 'reunion',
    final: 'final',
  };

  return (
    <div>
      {/* Animated Live Progress */}
      {type !== 'wrong' && <AnimatedProgress percent={progress} />}

      {/* Clue card */}
      <div className="card">
        <div className="clue-label">// {isStart ? 'Mission Start' : 'Clue Decrypted'}</div>
        <div className={`clue-heading ${headingExtra[type] || ''}`}>
          {headings[type]}
        </div>

        {error ? (
          <div className="alert error">{error}</div>
        ) : (
          <>
            {type === 'final' ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--success)', fontFamily: 'var(--font-pixel)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  YOU COMPLETED THE HUNT!
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.7, padding: '1rem', background: 'rgba(0,230,118,0.05)', borderRadius: '6px', border: '1px solid rgba(0,230,118,0.15)' }}>
                  🏁 Head back to the <strong style={{ color: 'var(--text-bright)' }}>room where your journey started</strong> and fill in the <strong style={{ color: 'var(--accent)' }}>Google Form</strong> to officially register your finish!
                </div>
              </div>
            ) : (
              <div className="clue-body" style={{ whiteSpace: 'pre-wrap' }}>
                <span className="quote-mark">"</span>
                {clue}
              </div>
            )}
          </>
        )}

        {!error && (
          <div className="clue-meta">
            <div className="meta-item">
              <span className="meta-key">Team</span>
              <span className="meta-val">{teamNumber}</span>
            </div>
            {!isStart && location && (
              <div className="meta-item">
                <span className="meta-key">Node</span>
                <span className="meta-val" style={type === 'wrong' ? { color: 'var(--accent)' } : {}}>
                  {type === 'wrong' ? 'ACCESS DENIED' : location.toUpperCase()}
                </span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-key">Status</span>
              <span className="meta-val" style={type === 'final' ? { color: 'var(--success)' } : {}}>
                {type === 'final' ? 'COMPLETE' : 'ACTIVE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Photo proof section — shown after every location scan (not at start) */}
      {!isStart && type !== 'wrong' && (
        <PhotoProof
          teamNumber={teamNumber}
          location={location}
          onDone={() => setProofDone(true)}
        />
      )}

      {/* Inline Location Entry Form */}
      {type !== 'final' && onLocationSubmit && (
        <LocationEntryInline onLocationSubmit={onLocationSubmit} />
      )}
    </div>
  );
}

export default ClueDisplay;
