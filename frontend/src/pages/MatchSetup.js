import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getMatchById,
  setupMatch,
  setupInnings2,
} from '../services/matchService';
import { getErrorMessage } from '../services/api';

function MatchSetup() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const fetchMatch = useCallback(async () => {
    try {
      const { data } = await getMatchById(id);
      setMatch(data.data);
      if (data.data.status === 'live' || data.data.status === 'completed') {
        navigate(`/matches/${id}/live`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const isInnings2 = match?.status === 'innings-break';

  const battingTeamKey = useMemo(() => {
    if (!match) return 'teamA';
    if (isInnings2) {
      return match.battingTeam === 'teamA' ? 'teamB' : 'teamA';
    }
    return match.battingTeam;
  }, [match, isInnings2]);

  if (loading) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p>Loading…</p>
      </section>
    );
  }

  if (error && !match) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (!match) return null;

  const battingTeamName =
    battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeamName =
    battingTeamKey === 'teamA' ? match.teamB : match.teamA;
  const battingPlayers =
    battingTeamKey === 'teamA' ? match.teamAPlayers : match.teamBPlayers;
  const bowlingPlayers =
    battingTeamKey === 'teamA' ? match.teamBPlayers : match.teamAPlayers;

  if (!battingPlayers.length || !bowlingPlayers.length) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p className="form-message error">
          Both teams need players before the match can start. Add players on the
          teams and create a new match.
        </p>
      </section>
    );
  }

  const firstInnings = match.innings && match.innings[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!striker || !nonStriker || !bowler) {
      setError('Please pick striker, non-striker, and opening bowler.');
      return;
    }
    if (striker === nonStriker) {
      setError('Striker and non-striker must be different players.');
      return;
    }

    try {
      setSubmitting(true);
      const call = isInnings2 ? setupInnings2 : setupMatch;
      await call(id, { striker, nonStriker, bowler });
      navigate(`/matches/${id}/live`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page match-setup">
      <h1>{isInnings2 ? 'Second Innings Setup' : 'Match Setup'}</h1>
      <p className="muted">
        <strong>{match.teamA}</strong> vs <strong>{match.teamB}</strong> —{' '}
        {match.overs} overs. <strong>{battingTeamName}</strong> to bat
        {isInnings2 ? ' now.' : ' first.'}
      </p>

      {isInnings2 && firstInnings && (
        <div className="target-banner">
          <div>
            <span className="target-label">First innings</span>
            <span className="target-value">
              {firstInnings.score.runs}/{firstInnings.score.wickets}{' '}
              ({(firstInnings.score.overs ?? 0).toFixed(1)})
            </span>
          </div>
          <div>
            <span className="target-label">Target</span>
            <span className="target-value">
              {match.target} runs from {match.overs} overs
            </span>
          </div>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Striker ({battingTeamName})</span>
          <select
            value={striker}
            onChange={(e) => setStriker(e.target.value)}
            required
          >
            <option value="">Select striker</option>
            {battingPlayers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Non-striker ({battingTeamName})</span>
          <select
            value={nonStriker}
            onChange={(e) => setNonStriker(e.target.value)}
            required
          >
            <option value="">Select non-striker</option>
            {battingPlayers
              .filter((p) => p !== striker)
              .map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
          </select>
        </label>

        <label className="form-field">
          <span>Opening Bowler ({bowlingTeamName})</span>
          <select
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            required
          >
            <option value="">Select bowler</option>
            {bowlingPlayers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Starting…' : isInnings2 ? 'Start Chase' : 'Start Innings'}
          </button>
        </div>

        {error && <p className="form-message error">{error}</p>}
      </form>
    </section>
  );
}

export default MatchSetup;
