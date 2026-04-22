import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import TeamAvatar from '../components/TeamAvatar';
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

const renderStatus = (b, inn) => {
  if (b.out) return b.howOut || 'out';
  if (b.name === inn.striker) return 'not out *';
  if (b.name === inn.nonStriker) return 'not out';
  // Batsmen only land in inn.batsmen once they come to the crease, so anyone
  // listed here who isn't out was still at the crease when the innings ended.
  return 'not out';
};

function InningsBlock({ inn, match }) {
  const battingTeamName =
    inn.battingTeam === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeamName =
    inn.battingTeam === 'teamA' ? match.teamB : match.teamA;

  const sortedBatsmen = [...(inn.batsmen || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const extras = inn.extras || { wides: 0, noBalls: 0 };
  const totalExtras = (extras.wides || 0) + (extras.noBalls || 0);

  return (
    <div className="innings-block">
      <header className="innings-header">
        <h2>
          Innings {inn.number} · {battingTeamName}
        </h2>
        <div className="innings-score">
          <strong>
            {inn.score.runs}/{inn.score.wickets}
          </strong>{' '}
          <span className="muted">
            ({(inn.score.overs ?? 0).toFixed(1)} / {match.overs} ov)
          </span>
        </div>
      </header>

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
                  <td className="muted small">{renderStatus(b, inn)}</td>
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
              {(inn.bowlers || []).length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">No bowling data yet</td>
                </tr>
              )}
              {(inn.bowlers || []).map((bw) => (
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
    </div>
  );
}

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

  const isCompleted = match.status === 'completed';

  return (
    <section className="page scorecard-page">
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
          <p className="match-meta">{match.overs} overs match</p>
        </div>
        <span className={`badge badge-${match.status}`}>{match.status}</span>
      </header>

      {isCompleted && match.result && (
        <div className="victory-banner">
          <img
            src="/images/cricket-victory.png"
            alt="Cricket trophy celebration"
            className="victory-image"
          />
          <div className="victory-text">
            <span className="victory-kicker">Match result</span>
            <h2>{match.result}</h2>
            <p className="muted">
              {match.overs} overs match · {match.innings?.length || 0} innings
            </p>
          </div>
        </div>
      )}

      {!isCompleted && match.target && (
        <p className="muted small">Target: {match.target}</p>
      )}

      {!isCompleted && match.result && (
        <p className="form-message success">{match.result}</p>
      )}

      {(!match.innings || match.innings.length === 0) && (
        <p className="muted">Match has not started yet.</p>
      )}

      {(match.innings || []).map((inn) => (
        <InningsBlock key={inn.number} inn={inn} match={match} />
      ))}

      <div className="page-actions">
        <Link to={`/matches/${id}/live`} className="btn">Live Score</Link>
        <Link to="/matches" className="btn link">Match History</Link>
      </div>
    </section>
  );
}

export default Scorecard;
