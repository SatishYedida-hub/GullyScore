import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAllMatches } from '../services/matchService';
import { getErrorMessage } from '../services/api';

const formatOvers = (overs) => {
  if (typeof overs !== 'number') return '0.0';
  return overs.toFixed(1);
};

function MatchHistory() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await getAllMatches();
        if (mounted) setMatches(data.data || []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="page match-history">
        <h1>Match History</h1>
        <p>Loading matches…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page match-history">
        <h1>Match History</h1>
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="page match-history">
        <h1>Match History</h1>
        <p>No matches yet. <Link to="/matches/new">Create one</Link>.</p>
      </section>
    );
  }

  return (
    <section className="page match-history">
      <h1>Match History</h1>
      <ul className="match-list">
        {matches.map((m) => {
          const battingTeamName =
            m.battingTeam === 'teamA' ? m.teamA : m.teamB;
          const liveTarget =
            m.status === 'setup'
              ? `/matches/${m._id}/setup`
              : `/matches/${m._id}/live`;
          return (
            <li key={m._id} className="match-list-item">
              <div className="match-list-header">
                <strong>{m.teamA}</strong> vs <strong>{m.teamB}</strong>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
              </div>
              <div className="match-list-meta">
                <span>
                  {battingTeamName}: {m.score?.runs ?? 0}/{m.score?.wickets ?? 0}{' '}
                  ({formatOvers(m.score?.overs)} / {m.overs ?? '?'} ov)
                </span>
                <div className="match-list-actions">
                  <Link to={liveTarget} className="btn link">
                    {m.status === 'setup' ? 'Set up' : 'View live'}
                  </Link>
                  {m.status !== 'setup' && (
                    <Link to={`/matches/${m._id}/scorecard`} className="btn link">
                      Scorecard
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default MatchHistory;
