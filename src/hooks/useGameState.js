import { useState, useEffect, useCallback } from 'react';
import { insforge } from '../insforge';

/**
 * useGameState — loads teams, locations, and progress from InsForge.
 * Replaces the previous game_settings approach with direct table queries.
 */
export function useGameState() {
  const [teams, setTeams] = useState([]);      // [{id, pin, route}, ...]
  const [locations, setLocations] = useState([]); // [{id, clue}, ...]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, locsRes] = await Promise.all([
        insforge.database.from('th_teams').select('id, pin, route').order('id'),
        insforge.database.from('th_locations').select('id, clue').order('id'),
      ]);
      if (teamsRes.error) throw teamsRes.error;
      if (locsRes.error) throw locsRes.error;
      setTeams(teamsRes.data || []);
      setLocations(locsRes.data || []);
    } catch (err) {
      console.error('useGameState fetch error:', err);
      setError('Could not load game data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  /** Update a team's PIN and/or route in th_teams */
  const updateTeam = async (teamId, { pin, route }) => {
    const payload = {};
    if (pin !== undefined) payload.pin = pin;
    if (route !== undefined) payload.route = route;
    const { error } = await insforge.database
      .from('th_teams')
      .update(payload)
      .eq('id', teamId);
    if (error) throw error;
    await fetchState();
  };

  /** Update a location's clue in th_locations */
  const updateClue = async (locationId, clue) => {
    const { error } = await insforge.database
      .from('th_locations')
      .update({ clue })
      .eq('id', locationId);
    if (error) throw error;
    await fetchState();
  };

  return {
    teams,
    locations,
    loading,
    error,
    updateTeam,
    updateClue,
    refreshState: fetchState,
  };
}
