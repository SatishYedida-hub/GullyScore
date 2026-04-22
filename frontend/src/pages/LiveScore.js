import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import TeamAvatar from '../components/TeamAvatar';
import {
  currentInningsOf,
  getMatchById,
  newBatsman as apiNewBatsman,
  newBowler as apiNewBowler,
  undoLastAction,
  updateScore,
} from '../services/matchService';
import { getErrorMessage } from '../services/api';

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];

const HOW_OUT_OPTIONS = [
  'Bowled',
  'Caught',
  'LBW',
  'Run Out',
  'Stumped',
  'Hit Wicket',
];

const formatOvers = (overs) => {
  if (typeof overs !== 'number') return '0.0';
  return overs.toFixed(1);
};

const formatBowlerOvers = (balls = 0) => {
  const completed = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${completed}.${rem}`;
};

const strikeRate = (runs = 0, balls = 0) => {
  if (!balls) return '0.00';
  return ((runs * 100) / balls).toFixed(2);
};

const economy = (runs = 0, balls = 0) => {
  if (!balls) return '0.00';
  return ((runs * 6) / balls).toFixed(2);
};

function LiveScore() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [canUndo, setCanUndo] = useState(false);

  const [wicketOpen, setWicketOpen] = useState(false);
  const [howOut, setHowOut] = useState(HOW_OUT_OPTIONS[0]);
  const [wicketRuns, setWicketRuns] = useState(0);

  const [newBatsmanSelection, setNewBatsmanSelection] = useState('');
  const [newBowlerSelection, setNewBowlerSelection] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getMatchById(id);
      setMatch(data.data);
      setCanUndo(!!data.canUndo);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const inn = useMemo(() => currentInningsOf(match), [match]);

  const battingTeamKey = inn ? inn.battingTeam : match?.battingTeam;
  const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';

  const battingPlayers = useMemo(() => {
    if (!match || !battingTeamKey) return [];
    return battingTeamKey === 'teamA' ? match.teamAPlayers : match.teamBPlayers;
  }, [match, battingTeamKey]);

  const bowlingPlayers = useMemo(() => {
    if (!match || !bowlingTeamKey) return [];
    return bowlingTeamKey === 'teamA' ? match.teamAPlayers : match.teamBPlayers;
  }, [match, bowlingTeamKey]);

  const availableBatsmen = useMemo(() => {
    if (!match || !inn) return [];
    const atCrease = new Set([inn.striker, inn.nonStriker].filter(Boolean));
    const outNames = new Set(
      (inn.batsmen || []).filter((b) => b.out).map((b) => b.name)
    );
    return battingPlayers.filter(
      (p) => !atCrease.has(p) && !outNames.has(p)
    );
  }, [match, inn, battingPlayers]);

  const availableBowlers = useMemo(() => {
    if (!match || !inn) return [];
    return bowlingPlayers.filter((p) => p !== inn.lastOverBowler);
  }, [match, inn, bowlingPlayers]);

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

  if (match.status === 'setup' || match.status === 'innings-break') {
    return <Navigate to={`/matches/${id}/setup`} replace />;
  }

  const isCompleted = match.status === 'completed';
  const needsBatsman = !isCompleted && inn && !inn.striker;
  const needsBowler = !isCompleted && inn && !inn.currentBowler;
  const scoringLocked = needsBatsman || needsBowler || isCompleted;

  const battingTeamName =
    battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeamName =
    bowlingTeamKey === 'teamA' ? match.teamA : match.teamB;

  const striker = inn ? (inn.batsmen || []).find((b) => b.name === inn.striker) : null;
  const nonStriker = inn ? (inn.batsmen || []).find((b) => b.name === inn.nonStriker) : null;
  const bowler = inn ? (inn.bowlers || []).find((b) => b.name === inn.currentBowler) : null;

  const isSecondInnings = inn && inn.number === 2;
  const runsNeeded = isSecondInnings && match.target
    ? Math.max(0, match.target - (inn.score?.runs ?? 0))
    : null;
  const ballsRemaining = isSecondInnings && match.overs
    ? Math.max(0, match.overs * 6 - (inn.score?.balls ?? 0))
    : null;

  const submit = async (payload) => {
    setError(null);
    try {
      setBusy(true);
      const { data } = await updateScore(id, payload);
      setMatch(data.data);
      setCanUndo(!!data.canUndo);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitUndo = async () => {
    setError(null);
    try {
      setBusy(true);
      const { data } = await undoLastAction(id);
      setMatch(data.data);
      setCanUndo(!!data.canUndo);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitWicket = async () => {
    setWicketOpen(false);
    await submit({
      runs: Number(wicketRuns) || 0,
      wicket: true,
      howOut,
    });
    setWicketRuns(0);
    setHowOut(HOW_OUT_OPTIONS[0]);
  };

  const submitNewBatsman = async () => {
    if (!newBatsmanSelection) {
      setError('Pick the next batsman.');
      return;
    }
    setError(null);
    try {
      setBusy(true);
      const { data } = await apiNewBatsman(id, { batsman: newBatsmanSelection });
      setMatch(data.data);
      setCanUndo(!!data.canUndo);
      setNewBatsmanSelection('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitNewBowler = async () => {
    if (!newBowlerSelection) {
      setError('Pick the next bowler.');
      return;
    }
    setError(null);
    try {
      setBusy(true);
      const { data } = await apiNewBowler(id, { bowler: newBowlerSelection });
      setMatch(data.data);
      setCanUndo(!!data.canUndo);
      setNewBowlerSelection('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page live-score">
      <header className="score-header score-header-pretty">
        <div className="score-header-left">
          <div className="teams-row">
            <span className="team-ident">
              <TeamAvatar name={match.teamA} size={40} />
              <strong>{match.teamA}</strong>
            </span>
            <span className="vs">vs</span>
            <span className="team-ident">
              <TeamAvatar name={match.teamB} size={40} />
              <strong>{match.teamB}</strong>
            </span>
          </div>
          <p className="match-meta">
            {match.overs} overs · Innings {inn?.number ?? '–'} ·{' '}
            <strong>{battingTeamName}</strong> batting
          </p>
        </div>
        <span className={`badge badge-${match.status}`}>{match.status}</span>
      </header>

      {isCompleted && (
        <div className="victory-banner">
          <img
            src="/images/cricket-victory.png"
            alt="Cricket trophy celebration"
            className="victory-image"
          />
          <div className="victory-text">
            <span className="victory-kicker">Full time</span>
            <h2>{match.result || 'Match completed'}</h2>
            <p className="muted">
              {match.teamA} {match.innings?.[0]?.score?.runs ?? 0}/
              {match.innings?.[0]?.score?.wickets ?? 0}
              {match.innings?.[1] && (
                <>
                  {' '}
                  · {match.teamB} {match.innings[1].score.runs}/
                  {match.innings[1].score.wickets}
                </>
              )}
            </p>
            <div className="victory-actions">
              <Link to={`/matches/${id}/scorecard`} className="btn primary">
                View Full Scorecard
              </Link>
              <Link to="/matches" className="btn">
                More Matches
              </Link>
            </div>
          </div>
        </div>
      )}

      {match.innings && match.innings.length === 2 && (
        <div className="innings-summary">
          <span className="muted small">1st innings</span>{' '}
          <strong>
            {match.innings[0].score.runs}/{match.innings[0].score.wickets}
          </strong>{' '}
          ({(match.innings[0].score.overs ?? 0).toFixed(1)})
        </div>
      )}

      <div className="scoreboard-card">
        <div className="score-main">
          <span className="score-runs">{inn?.score?.runs ?? 0}</span>
          <span className="score-slash">/</span>
          <span className="score-wickets">{inn?.score?.wickets ?? 0}</span>
        </div>
        <div className="score-overs">
          <span className="score-overs-value">
            {formatOvers(inn?.score?.overs)}
          </span>
          <span className="score-overs-label">of {match.overs} overs</span>
        </div>
      </div>

      {isSecondInnings && !isCompleted && (
        <div className="target-banner">
          <div>
            <span className="target-label">Target</span>
            <span className="target-value">{match.target}</span>
          </div>
          <div>
            <span className="target-label">Need</span>
            <span className="target-value">
              {runsNeeded} from {ballsRemaining} balls
            </span>
          </div>
        </div>
      )}

      <div className="panels">
        <div className="panel">
          <h3 className="panel-title">
            Batting — <span className="muted">{battingTeamName}</span>
          </h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Batter</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              <tr className={striker ? 'row-striker' : ''}>
                <td>
                  {striker ? striker.name : '—'}
                  {striker && <span className="strike-mark"> *</span>}
                </td>
                <td>{striker?.runs ?? 0}</td>
                <td>{striker?.balls ?? 0}</td>
                <td>{striker?.fours ?? 0}</td>
                <td>{striker?.sixes ?? 0}</td>
                <td>{strikeRate(striker?.runs, striker?.balls)}</td>
              </tr>
              <tr>
                <td>{nonStriker ? nonStriker.name : '—'}</td>
                <td>{nonStriker?.runs ?? 0}</td>
                <td>{nonStriker?.balls ?? 0}</td>
                <td>{nonStriker?.fours ?? 0}</td>
                <td>{nonStriker?.sixes ?? 0}</td>
                <td>{strikeRate(nonStriker?.runs, nonStriker?.balls)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3 className="panel-title">
            Bowling — <span className="muted">{bowlingTeamName}</span>
          </h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>O</th>
                <th>M</th>
                <th>R</th>
                <th>W</th>
                <th>Econ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{bowler ? bowler.name : '—'}</td>
                <td>{formatBowlerOvers(bowler?.balls)}</td>
                <td>{bowler?.maidens ?? 0}</td>
                <td>{bowler?.runs ?? 0}</td>
                <td>{bowler?.wickets ?? 0}</td>
                <td>{economy(bowler?.runs, bowler?.balls)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel this-over">
        <h3 className="panel-title">This Over</h3>
        <div className="over-balls">
          {(inn?.currentOverEvents || []).length === 0 ? (
            <span className="muted">No balls yet</span>
          ) : (
            inn.currentOverEvents.map((e, i) => (
              <span
                key={i}
                className={`ball-pill ${e.wicket ? 'ball-wicket' : ''} ${
                  e.extra ? 'ball-extra' : ''
                }`}
              >
                {e.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="undo-row">
        <button
          className="btn link undo-btn"
          disabled={busy || !canUndo}
          onClick={submitUndo}
          title={canUndo ? 'Undo the last action' : 'Nothing to undo'}
        >
          ↶ Undo last action
        </button>
      </div>

      {error && <p className="form-message error">{error}</p>}

      {needsBatsman && !isCompleted && (
        <div className="panel action-required">
          <h3 className="panel-title">New batsman required</h3>
          <div className="inline-row">
            <select
              value={newBatsmanSelection}
              onChange={(e) => setNewBatsmanSelection(e.target.value)}
            >
              <option value="">Select batsman</option>
              {availableBatsmen.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              className="btn primary"
              disabled={busy || !newBatsmanSelection}
              onClick={submitNewBatsman}
            >
              Send In
            </button>
          </div>
        </div>
      )}

      {needsBowler && !isCompleted && (
        <div className="panel action-required">
          <h3 className="panel-title">Select next bowler</h3>
          <p className="muted small">
            Cannot be {inn?.lastOverBowler || 'the previous bowler'}.
          </p>
          <div className="inline-row">
            <select
              value={newBowlerSelection}
              onChange={(e) => setNewBowlerSelection(e.target.value)}
            >
              <option value="">Select bowler</option>
              {availableBowlers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              className="btn primary"
              disabled={busy || !newBowlerSelection}
              onClick={submitNewBowler}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {!scoringLocked && (
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
                onClick={() => setWicketOpen(true)}
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
                  onClick={() =>
                    submit({ runs: 0, wicket: false, extra: 'no-ball' })
                  }
                >
                  No-ball
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-actions">
        <Link to={`/matches/${id}/scorecard`} className="btn">View Scorecard</Link>
        <Link to="/matches" className="btn link">Back to match history</Link>
      </div>

      {wicketOpen && (
        <div className="modal-backdrop" onClick={() => setWicketOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Wicket — {striker?.name}</h3>
            <p className="muted small">
              The striker is out. Pick how and any runs completed on the ball.
            </p>

            <label className="form-field">
              <span>How out</span>
              <select
                value={howOut}
                onChange={(e) => setHowOut(e.target.value)}
              >
                {HOW_OUT_OPTIONS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Runs on this ball</span>
              <input
                type="number"
                min="0"
                max="6"
                value={wicketRuns}
                onChange={(e) => setWicketRuns(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button className="btn" onClick={() => setWicketOpen(false)}>
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={busy}
                onClick={submitWicket}
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default LiveScore;
