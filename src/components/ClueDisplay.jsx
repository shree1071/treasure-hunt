import { useEffect, useState } from 'react';
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
          placeholder="e.g. 3303"
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

      // Otherwise, figure out which stop they've arrived at
      const currentIndex = route.indexOf(location);

      if (currentIndex === -1) {
        setProgress(0);
        setClue("This isn't your next stop! Check your clue and go to the right location.");
        setType('wrong');
        setLoading(false);
        return;
      }

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
        setLoading(false);
        saveTeamProgress(teamNumber, location, null);
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
          <div className="clue-body">
            <span className="quote-mark">"</span>
            {clue}
          </div>
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
                <span className="meta-val">{location.toUpperCase()}</span>
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
