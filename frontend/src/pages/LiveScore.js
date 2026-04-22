import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { getMatchById, updateScore } from '../services/matchService';
import { getErrorMessage } from '../services/api';

const RUN_BUTTONS = [0, 1, 2, 4, 6];

const formatOvers = (overs) => {
  if (typeof overs !== 'number') return '0.0';
  return overs.toFixed(1);
};

function LiveScore() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getMatchById(id);
      setMatch(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (payload) => {
    setError(null);
    try {
      setBusy(true);
      const { data } = await updateScore(id, payload);
      setMatch(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="page live-score">
        <h1>Live Score</h1>
        <p>Loading…</p>
      </section>
    );
  }

  if (!match) {
    return (
      <section className="page live-score">
        <h1>Live Score</h1>
        <p className="form-message error">{error || 'Match not found.'}</p>
        <Link to="/matches" className="btn link">Back to match history</Link>
      </section>
    );
  }

  const isCompleted = match.status === 'completed';

  return (
    <section className="page live-score">
      <header className="score-header">
        <div>
          <h1 className="teams-title">{match.teamA} <span className="vs">vs</span> {match.teamB}</h1>
          <p className="match-meta">{match.overs} overs match</p>
        </div>
        <span className={`badge badge-${match.status}`}>{match.status}</span>
      </header>

      <div className="scoreboard-card">
        <div className="score-main">
          <span className="score-runs">{match.score?.runs ?? 0}</span>
          <span className="score-slash">/</span>
          <span className="score-wickets">{match.score?.wickets ?? 0}</span>
        </div>
        <div className="score-overs">
          <span className="score-overs-value">{formatOvers(match.score?.overs)}</span>
          <span className="score-overs-label">of {match.overs} overs</span>
        </div>
      </div>

      {error && <p className="form-message error">{error}</p>}

      {isCompleted ? (
        <p className="form-message success">Match completed. No further updates allowed.</p>
      ) : (
        <div className="score-controls">
          <div className="control-group">
            <h3>Runs</h3>
            <div className="run-grid">
              {RUN_BUTTONS.map((r) => (
                <button
                  key={r}
                  className={`btn run-btn run-${r}`}
                  disabled={busy}
                  onClick={() => submit({ runs: r, wicket: false })}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <h3>Wicket</h3>
              <button
                className="btn danger wicket-btn"
                disabled={busy}
                onClick={() => submit({ runs: 0, wicket: true })}
              >
                OUT
              </button>
            </div>

            <div className="control-group">
              <h3>Extras</h3>
              <div className="button-row">
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => submit({ runs: 0, wicket: false, extra: 'wide' })}
                >
                  Wide
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => submit({ runs: 0, wicket: false, extra: 'no-ball' })}
                >
                  No-ball
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-actions">
        <Link to="/matches" className="btn link">Back to match history</Link>
      </div>
    </section>
  );
}

export default LiveScore;
