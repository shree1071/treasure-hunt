import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { insforge, FINAL_CLUE, REUNION_MESSAGE } from '../insforge';
import PhotoProof from './PhotoProof';
import { LOCATION_CODES } from '../data';

async function saveTeamProgress(teamId, currentLoc, nextLoc) {
  try {
    const payload = {
      team_id: teamId,
      current_location: currentLoc,
      next_location: nextLoc || null,
      last_scanned_at: new Date().toISOString(),
    };
      const { data: existing } = await insforge.database.from('team_progress').select('team_id').eq('team_id', teamId).maybeSingle();
      if (existing) {
        await insforge.database.from('team_progress').update(payload).eq('team_id', teamId);
      } else {
        await insforge.database.from('team_progress').insert([{ team_id: teamId, ...payload }]);
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

      // Fetch team route
      const { data: teamData, error: teamErr } = await insforge.database
        .from('th_teams')
        .select('route')
        .eq('id', teamNumber)
        .maybeSingle();

      if (teamErr || !teamData) {
        setError('Could not load team data. Check your connection.');
        setLoading(false);
        return;
      }

      const route = teamData.route;

      // If start: show clue for route[0] (their first destination)
      if (isStart) {
        setProgress(0);
        const { data: locData, error: locErr } = await insforge.database
          .from('th_locations')
          .select('clue')
          .eq('id', route[0])
          .maybeSingle();

        if (locErr || !locData) {
          setError('Could not load first clue. Try again.');
          setLoading(false);
          return;
        }
        setClue(locData.clue);
        setType('normal');
        setLoading(false);
        saveTeamProgress(teamNumber, null, route[0]);
        return;
      }

      // Check current actual progress from database to prevent skipping
      const { data: prog } = await insforge.database
        .from('team_progress')
        .select('current_location, next_location')
        .eq('team_id', teamNumber)
        .maybeSingle();

      let curr = prog ? prog.current_location : null;
      let expectedNext = prog ? prog.next_location : route[0];

      if (prog) {
        // If they were at the reunion, the true 'next physical location' is stop #5 (index 4)
        if (expectedNext === 'reunion') {
          expectedNext = route[4];
        } 
        // If Admin reset the team, they have null location and null next_location
        else if (expectedNext === null && curr === null) {
          expectedNext = route[0];
        }
      }

      const isRefresh = (location === curr);
      const isAdvance = (location === expectedNext);

      // Validation 
      if (!isRefresh && !isAdvance) {
        let errorMsg = "";
        
        if (expectedNext === null && curr !== null) {
          errorMsg = "Your journey is already complete! You don't need to scan anymore codes.";
        } else if (route.indexOf(location) === -1) {
          errorMsg = "This location is not in your route! Check your clue and go to the right location.";
        } else {
          errorMsg = "LOCATION ERROR: You entered a PIN out of order! Please check your previous clue and retry the correct location.";
        }

        const actualIndex = curr ? route.indexOf(curr) : -1;
        const pct = actualIndex >= 0 ? Math.round(((actualIndex + 1) / route.length) * 100) : 0;
        
        if (curr === null) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        setProgress(pct);
        setType('wrong');
        
        // As requested: Always display the hint for their actual expected location!
        if (expectedNext) {
          if (expectedNext === 'reunion') {
             setClue(`${errorMsg}\n\n💡 YOUR HINT:\n${REUNION_MESSAGE}`);
          } else {
             const { data: hintData } = await insforge.database.from('th_locations').select('clue').eq('id', expectedNext).maybeSingle();
             setClue(`${errorMsg}\n\n💡 YOUR CURRENT OBJECTIVE:\n"${hintData?.clue || 'Clue missing.'}"`);
          }
        } else {
          setClue(errorMsg);
        }
        
        setLoading(false);
        return;
      }

      // If valid, figure out which stop they're at
      const currentIndex = route.indexOf(location);

      // Base progress on currentIndex
      const pct = Math.round(((currentIndex + 1) / route.length) * 100);
      setProgress(pct);

      // After 4th stop (index 3) → Reunion
      if (currentIndex === 3) {
        setClue(REUNION_MESSAGE);
        setType('reunion');
        setLoading(false);
        saveTeamProgress(teamNumber, location, 'reunion');
        return;
      }

      // Last stop → Final
      if (currentIndex === route.length - 1) {
        setClue(FINAL_CLUE);
        setType('final');
        await saveTeamProgress(teamNumber, location, null);

        // Fetch rank by seeing how many teams have next_location = null
        const { data: finished } = await insforge.database
          .from('team_progress')
          .select('team_id')
          .is('next_location', null)
          .order('last_scanned_at', { ascending: true });
        
        if (finished) {
          const r = finished.findIndex(t => t.team_id == teamNumber) + 1;
          setRank(r > 0 ? r : finished.length + 1);
        }

        setLoading(false);
        return;
      }

      // Normal: fetch next location's clue
      const nextLocation = route[currentIndex + 1];
      const { data: locData, error: locErr } = await insforge.database
        .from('th_locations')
        .select('clue')
        .eq('id', nextLocation)
        .maybeSingle();

      if (locErr || !locData) {
        setError('Could not load the next clue. Try again.');
        setLoading(false);
        return;
      }

      setClue(locData.clue);
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
    final: 'FINAL MISSION',
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
            {type === 'final' && rank && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'rgba(0, 230, 118, 0.05)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                <div style={{ fontSize: '1rem', color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  Congratulations on conquering <strong>{location.toUpperCase()}</strong>!
                </div>
                <div style={{ fontSize: '2rem', color: 'var(--success)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 15px rgba(0,230,118,0.5)' }}>
                  {getRankName(rank)}
                </div>
              </div>
            )}
            <div className="clue-body" style={{ whiteSpace: 'pre-wrap' }}>
              <span className="quote-mark">"</span>
              {clue}
            </div>
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
