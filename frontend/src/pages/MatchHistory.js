import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAllMatches } from '../services/matchService';
import { getErrorMessage } from '../services/api';

const formatOvers = (overs) => {
  if (typeof overs !== 'number') return '0.0';
  return overs.toFixed(1);
};

const inningsSummary = (inn, match) => {
  const teamName = inn.battingTeam === 'teamA' ? match.teamA : match.teamB;
  return `${teamName}: ${inn.score.runs}/${inn.score.wickets} (${formatOvers(
    inn.score.overs
  )})`;
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
          const liveTarget =
            m.status === 'setup' || m.status === 'innings-break'
              ? `/matches/${m._id}/setup`
              : `/matches/${m._id}/live`;
          const innings = m.innings || [];
          return (
            <li key={m._id} className="match-list-item">
              <div className="match-list-header">
                <strong>{m.teamA}</strong> vs <strong>{m.teamB}</strong>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
              </div>

              <div className="match-list-innings">
                {innings.length === 0 ? (
                  <span className="muted small">
                    {m.overs} overs · not started
                  </span>
                ) : (
                  innings.map((inn) => (
                    <div key={inn.number} className="small">
                      {inningsSummary(inn, m)}
                    </div>
                  ))
                )}
                {m.target && m.status !== 'completed' && (
                  <div className="small muted">Target: {m.target}</div>
                )}
                {m.result && (
                  <div className="small result-line">{m.result}</div>
                )}
              </div>

              <div className="match-list-meta">
                <span className="muted small">{m.overs} overs match</span>
                <div className="match-list-actions">
                  <Link to={liveTarget} className="btn link">
                    {m.status === 'setup'
                      ? 'Set up'
                      : m.status === 'innings-break'
                      ? 'Start chase'
                      : 'View live'}
                  </Link>
                  {innings.length > 0 && (
                    <Link
                      to={`/matches/${m._id}/scorecard`}
                      className="btn link"
                    >
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
