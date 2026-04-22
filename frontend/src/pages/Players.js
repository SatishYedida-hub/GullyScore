import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { CricketBat, CricketBall, Stumps } from '../components/CricketIcons';
import { getAllPlayers } from '../services/playerService';
import { getErrorMessage } from '../services/api';

const fmtOvers = (o) => (typeof o === 'number' ? o.toFixed(1) : '0.0');
const fmt = (v) => (v === null || v === undefined ? '—' : v);

const TABS = [
  { id: 'batting', label: 'Batting', Icon: CricketBat },
  { id: 'bowling', label: 'Bowling', Icon: CricketBall },
];

function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('batting');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getAllPlayers();
        if (mounted) setPlayers(data.data || []);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.teams || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [players, query]);

  const battingSorted = useMemo(
    () =>
      [...filtered]
        .filter((p) => p.batting.innings > 0)
        .sort((a, b) => b.batting.runs - a.batting.runs),
    [filtered]
  );

  const bowlingSorted = useMemo(
    () =>
      [...filtered]
        .filter((p) => p.bowling.innings > 0)
        .sort((a, b) => {
          if (b.bowling.wickets !== a.bowling.wickets) {
            return b.bowling.wickets - a.bowling.wickets;
          }
          const ea = a.bowling.economy ?? Infinity;
          const eb = b.bowling.economy ?? Infinity;
          return ea - eb;
        }),
    [filtered]
  );

  const rosterOnly = useMemo(
    () =>
      filtered.filter(
        (p) => p.batting.innings === 0 && p.bowling.innings === 0
      ),
    [filtered]
  );

  const banner = (
    <PageBanner
      image="/images/cricket-action.png"
      kicker={
        <>
          <Stumps size={16} /> Career records
        </>
      }
      title="Player Records"
      subtitle="Career batting and bowling stats aggregated across every match played."
      tone="tone-orange"
    />
  );

  if (loading) {
    return (
      <section className="page players-page">
        {banner}
        <p>Loading player records…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page players-page">
        {banner}
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (players.length === 0) {
    return (
      <section className="page players-page">
        {banner}
        <div className="empty-state">
          <img
            src="/images/cricket-empty.png"
            alt="Empty scoreboard"
            className="empty-art"
          />
          <h3>No player data yet</h3>
          <p className="muted">
            Create teams and start scoring matches — stats will appear here
            automatically.
          </p>
          <Link to="/teams/new" className="btn primary">
            Create a team
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page players-page">
      {banner}

      <div className="players-toolbar">
        <div className="players-tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={`tab-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
              type="button"
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="input players-search"
          placeholder="Search player or team…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === 'batting' && (
        <BattingTable rows={battingSorted} />
      )}
      {tab === 'bowling' && (
        <BowlingTable rows={bowlingSorted} />
      )}

      {rosterOnly.length > 0 && (
        <div className="players-roster">
          <h3 className="section-title">
            On roster ·{' '}
            <span className="muted small">haven't played a match yet</span>
          </h3>
          <ul className="roster-chips">
            {rosterOnly.map((p) => (
              <li key={p.name}>
                <Link
                  to={`/players/${encodeURIComponent(p.name)}`}
                  className="roster-chip"
                >
                  <TeamAvatar name={p.name} size={28} />
                  <span>{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BattingTable({ rows }) {
  if (rows.length === 0) {
    return <p className="muted">No batting records yet.</p>;
  }
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th className="num">M</th>
            <th className="num">I</th>
            <th className="num">Runs</th>
            <th className="num">HS</th>
            <th className="num">Avg</th>
            <th className="num">SR</th>
            <th className="num">4s</th>
            <th className="num">6s</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.name}>
              <td className="num muted">{i + 1}</td>
              <td>
                <Link
                  to={`/players/${encodeURIComponent(p.name)}`}
                  className="player-cell"
                >
                  <TeamAvatar name={p.name} size={28} />
                  <span>
                    <strong>{p.name}</strong>
                    {p.teams.length > 0 && (
                      <span className="muted small block">
                        {p.teams.join(', ')}
                      </span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="num">{p.batting.matches}</td>
              <td className="num">{p.batting.innings}</td>
              <td className="num strong">{p.batting.runs}</td>
              <td className="num">{p.batting.highestDisplay}</td>
              <td className="num">{fmt(p.batting.average)}</td>
              <td className="num">{fmt(p.batting.strikeRate)}</td>
              <td className="num">{p.batting.fours}</td>
              <td className="num">{p.batting.sixes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BowlingTable({ rows }) {
  if (rows.length === 0) {
    return <p className="muted">No bowling records yet.</p>;
  }
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th className="num">M</th>
            <th className="num">I</th>
            <th className="num">Overs</th>
            <th className="num">Runs</th>
            <th className="num">Wkts</th>
            <th className="num">Best</th>
            <th className="num">Econ</th>
            <th className="num">Avg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.name}>
              <td className="num muted">{i + 1}</td>
              <td>
                <Link
                  to={`/players/${encodeURIComponent(p.name)}`}
                  className="player-cell"
                >
                  <TeamAvatar name={p.name} size={28} />
                  <span>
                    <strong>{p.name}</strong>
                    {p.teams.length > 0 && (
                      <span className="muted small block">
                        {p.teams.join(', ')}
                      </span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="num">{p.bowling.matches}</td>
              <td className="num">{p.bowling.innings}</td>
              <td className="num">{fmtOvers(p.bowling.overs)}</td>
              <td className="num">{p.bowling.runs}</td>
              <td className="num strong">{p.bowling.wickets}</td>
              <td className="num">{p.bowling.best}</td>
              <td className="num">{fmt(p.bowling.economy)}</td>
              <td className="num">{fmt(p.bowling.average)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Players;
