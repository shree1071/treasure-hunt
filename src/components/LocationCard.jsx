import { useState } from 'react';

function LocationCard({ location, onLogin }) {
  const [team, setTeam] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (team && pin) {
      onLogin(team, pin);
    }
  };

  const displayName = location ? location.toUpperCase() : 'UNKNOWN';

  return (
    <div className="card">
      <h1 className="title">SECURE ACCESS</h1>
      <p className="subtitle">LOCATION: {displayName}</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="team">Team Number</label>
          <input 
            type="number" 
            id="team" 
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g. 1"
            min="1"
            max="15"
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="pin">Access PIN</label>
          <input 
            type="password" 
            id="pin" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            maxLength="4"
            required 
          />
        </div>
        
        <button type="submit" className="auth-button">
          DECRYPT CLUE
        </button>
      </form>
    </div>
  );
}

export default LocationCard;
