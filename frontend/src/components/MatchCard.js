import React from 'react';

function MatchCard({ match }) {
  return (
    <div className="match-card">
      <h3>{match?.teamA || 'Team A'} vs {match?.teamB || 'Team B'}</h3>
      <p>Venue: {match?.venue || 'TBD'}</p>
      <p>Status: {match?.status || 'scheduled'}</p>
    </div>
  );
}

export default MatchCard;
