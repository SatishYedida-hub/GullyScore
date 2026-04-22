import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { Stumps } from '../components/CricketIcons';
import { getPlayerByName } from '../services/playerService';
import { getErrorMessage } from '../services/api';

const fmtOvers = (o) => (typeof o === 'number' ? o.toFixed(1) : '0.0');
const fmt = (v) => (v === null || v === undefined ? '—' : v);

const Stat = ({ label, value, highlight }) => (
  <div className={`stat-cell ${highlight ? 'stat-highlight' : ''}`}>
    <div className="stat-cell-value">{value}</div>
    <div className="stat-cell-label">{label}</div>
  </div>
);

function PlayerDetail() {
  const { name: rawName } = useParams();
  const name = decodeURIComponent(rawName || '');

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getPlayerByName(name);
        if (mounted) setPlayer(data.data);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [name]);

  const banner = (
    <PageBanner
      image="/images/cricket-action.png"
      kicker={
        <>
          <Stumps size={16} /> Player profile
        </>
      }
      title={name}
      subtitle="Career record and match-by-match breakdown."
      tone="tone-orange"
      actions={
        <Link to="/players" className="btn">
          ← All players
        </Link>
      }
    />
  );

  if (loading) {
    return (
      <section className="page player-detail">
        {banner}
        <p>Loading player…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page player-detail">
        {banner}
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="page player-detail">
        {banner}
        <p className="muted">No data.</p>
      </section>
    );
  }

  const { batting, bowling, teams, matchHistory } = player;

  return (
    <section className="page player-detail">
      {banner}

      <div className="player-identity">
        <TeamAvatar name={player.name} size={72} />
        <div>
          <h2 className="player-name-big">{player.name}</h2>
          {teams.length > 0 && (
            <div className="muted">
              Plays for <strong>{teams.join(', ')}</strong>
            </div>
          )}
        </div>
      </div>

      {batting.innings > 0 && (
        <div className="stats-card">
          <h3 className="section-title">Batting — career</h3>
          <div className="stats-grid">
            <Stat label="Matches" value={batting.matches} />
            <Stat label="Innings" value={batting.innings} />
            <Stat label="Runs" value={batting.runs} highlight />
            <Stat label="Highest" value={batting.highestDisplay} />
            <Stat label="Average" value={fmt(batting.average)} />
            <Stat label="Strike Rate" value={fmt(batting.strikeRate)} />
            <Stat label="Balls" value={batting.balls} />
            <Stat label="4s" value={batting.fours} />
            <Stat label="6s" value={batting.sixes} />
            <Stat label="Not outs" value={batting.notOuts} />
          </div>
        </div>
      )}

      {bowling.innings > 0 && (
        <div className="stats-card">
          <h3 className="section-title">Bowling — career</h3>
          <div className="stats-grid">
            <Stat label="Matches" value={bowling.matches} />
            <Stat label="Innings" value={bowling.innings} />
            <Stat label="Overs" value={fmtOvers(bowling.overs)} />
            <Stat label="Runs" value={bowling.runs} />
            <Stat label="Wickets" value={bowling.wickets} highlight />
            <Stat label="Best" value={bowling.best} />
            <Stat label="Economy" value={fmt(bowling.economy)} />
            <Stat label="Average" value={fmt(bowling.average)} />
            <Stat label="SR (balls/wkt)" value={fmt(bowling.strikeRate)} />
            <Stat label="Maidens" value={bowling.maidens} />
          </div>
        </div>
      )}

      {batting.innings === 0 && bowling.innings === 0 && (
        <p className="muted">
          {player.name} hasn't played a match yet. Stats will show up once
          they're on the scorecard.
        </p>
      )}

      {matchHistory.length > 0 && (
        <div className="stats-card">
          <h3 className="section-title">Match-by-match</h3>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th className="num">Batting</th>
                  <th className="num">Bowling</th>
                  <th>Result</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((m) => {
                  const bat = m.batting;
                  const bwl = m.bowling;
                  const batCell = bat
                    ? `${bat.runs}${bat.out ? '' : '*'} (${bat.balls})`
                    : '—';
                  const bwlCell = bwl
                    ? `${bwl.wickets}/${bwl.runs} (${fmtOvers(bwl.overs)})`
                    : '—';
                  return (
                    <tr key={m.matchId}>
                      <td>
                        <div className="match-row-teams">
                          <TeamAvatar name={m.teamA} size={22} />
                          <strong className="small">{m.teamA}</strong>
                          <span className="muted small">vs</span>
                          <TeamAvatar name={m.teamB} size={22} />
                          <strong className="small">{m.teamB}</strong>
                        </div>
                        <div className="muted small">
                          {m.overs} overs · {m.status}
                        </div>
                      </td>
                      <td className="num">{batCell}</td>
                      <td className="num">{bwlCell}</td>
                      <td className="small">{m.result || '—'}</td>
                      <td>
                        <Link
                          to={`/matches/${m.matchId}/scorecard`}
                          className="btn link small-btn"
                        >
                          Scorecard
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default PlayerDetail;
