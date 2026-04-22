import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getMatchById } from '../services/matchService';
import { getErrorMessage } from '../services/api';

const formatBowlerOvers = (balls = 0) => {
  const completed = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${completed}.${rem}`;
};

const strikeRate = (runs = 0, balls = 0) => {
  if (!balls) return '—';
  return ((runs * 100) / balls).toFixed(2);
};

const economy = (runs = 0, balls = 0) => {
  if (!balls) return '—';
  return ((runs * 6) / balls).toFixed(2);
};

const renderStatus = (b, match) => {
  if (b.out) return b.howOut || 'out';
  if (b.name === match.striker) return 'not out *';
  if (b.name === match.nonStriker) return 'not out';
  return 'did not bat';
};

function Scorecard() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <section className="page">
        <h1>Scorecard</h1>
        <p>Loading…</p>
      </section>
    );
  }

  if (!match) {
    return (
      <section className="page">
        <h1>Scorecard</h1>
        <p className="form-message error">{error || 'Match not found.'}</p>
      </section>
    );
  }

  const battingTeamName =
    match.battingTeam === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeamName =
    match.battingTeam === 'teamA' ? match.teamB : match.teamA;

  const sortedBatsmen = [...(match.batsmen || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const extras = match.extras || { wides: 0, noBalls: 0 };
  const totalExtras = (extras.wides || 0) + (extras.noBalls || 0);

  return (
    <section className="page scorecard-page">
      <header className="score-header">
        <div>
          <h1 className="teams-title">
            {match.teamA} <span className="vs">vs</span> {match.teamB}
          </h1>
          <p className="match-meta">
            {match.overs} overs · {battingTeamName} batting
          </p>
        </div>
        <span className={`badge badge-${match.status}`}>{match.status}</span>
      </header>

      <div className="scoreboard-card compact">
        <div className="score-main">
          <span className="score-runs">{match.score?.runs ?? 0}</span>
          <span className="score-slash">/</span>
          <span className="score-wickets">{match.score?.wickets ?? 0}</span>
        </div>
        <div className="score-overs">
          <span className="score-overs-value">
            {(match.score?.overs ?? 0).toFixed(1)}
          </span>
          <span className="score-overs-label">overs</span>
        </div>
      </div>

      {match.result && (
        <p className="form-message success">{match.result}</p>
      )}

      <div className="panel">
        <h3 className="panel-title">Batting — {battingTeamName}</h3>
        <div className="table-scroll">
          <table className="stats-table full">
            <thead>
              <tr>
                <th>Batter</th>
                <th>Status</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              {sortedBatsmen.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted">No batting data yet</td>
                </tr>
              )}
              {sortedBatsmen.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  <td className="muted small">{renderStatus(b, match)}</td>
                  <td>{b.runs}</td>
                  <td>{b.balls}</td>
                  <td>{b.fours}</td>
                  <td>{b.sixes}</td>
                  <td>{strikeRate(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Extras: {totalExtras} (wd {extras.wides || 0}, nb {extras.noBalls || 0})
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">Bowling — {bowlingTeamName}</h3>
        <div className="table-scroll">
          <table className="stats-table full">
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
              {(match.bowlers || []).length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">No bowling data yet</td>
                </tr>
              )}
              {(match.bowlers || []).map((bw) => (
                <tr key={bw.name}>
                  <td>{bw.name}</td>
                  <td>{formatBowlerOvers(bw.balls)}</td>
                  <td>{bw.maidens || 0}</td>
                  <td>{bw.runs || 0}</td>
                  <td>{bw.wickets || 0}</td>
                  <td>{economy(bw.runs, bw.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-actions">
        <Link to={`/matches/${id}/live`} className="btn">Live Score</Link>
        <Link to="/matches" className="btn link">Match History</Link>
      </div>
    </section>
  );
}

export default Scorecard;
