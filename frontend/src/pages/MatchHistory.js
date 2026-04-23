import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { Trophy } from '../components/CricketIcons';
import {
  deleteMatch as apiDeleteMatch,
  getAllMatches,
} from '../services/matchService';
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
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

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

  const handleDelete = async (m) => {
    const label = `${m.teamA} vs ${m.teamB}`;
    const extraWarning =
      m.status === 'live' || m.status === 'setup' || m.status === 'innings-break'
        ? `\n\n"${label}" is currently ${m.status}. Deleting will discard this match entirely.`
        : '';
    const ok = window.confirm(
      `Delete match "${label}"?${extraWarning}\n\nThis removes the scorecard and every ball scored. You can't undo this.`
    );
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(m._id);
      await apiDeleteMatch(m._id);
      setMatches((prev) => prev.filter((x) => x._id !== m._id));
      setNotice(`Match "${label}" deleted.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const banner = (
    <PageBanner
      image="/images/cricket-victory.png"
      kicker={
        <>
          <Trophy size={16} /> Hall of fame
        </>
      }
      title="Match History"
      subtitle="Live scores, finished matches and full ball-by-ball scorecards."
      tone="tone-purple"
      actions={
        <Link to="/matches/new" className="btn primary">
          + New Match
        </Link>
      }
    />
  );

  if (loading) {
    return (
      <section className="page match-history">
        {banner}
        <p>Loading matches…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page match-history">
        {banner}
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="page match-history">
        {banner}
        <div className="empty-state">
          <img
            src="/images/cricket-empty.png"
            alt="Empty cricket scoreboard on a sunny field"
            className="empty-art"
          />
          <h3>No matches yet</h3>
          <p className="muted">
            Kick things off by creating your first match.
          </p>
          <Link to="/matches/new" className="btn primary">
            Create a match
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page match-history">
      {banner}

      {error && <p className="form-message error">{error}</p>}
      {notice && <p className="form-message success">{notice}</p>}

      <ul className="match-list">
        {matches.map((m) => {
          const liveTarget =
            m.status === 'setup' || m.status === 'innings-break'
              ? `/matches/${m._id}/setup`
              : `/matches/${m._id}/live`;
          const innings = m.innings || [];
          const rowBusy = busyId === m._id;
          return (
            <li key={m._id} className="match-list-item">
              <div className="match-list-header">
                <div className="match-teams-line">
                  <span className="mini-team">
                    <TeamAvatar name={m.teamA} photo={m.teamAPhoto} size={32} />
                    <strong>{m.teamA}</strong>
                  </span>
                  <span className="vs-mini">vs</span>
                  <span className="mini-team">
                    <TeamAvatar name={m.teamB} photo={m.teamBPhoto} size={32} />
                    <strong>{m.teamB}</strong>
                  </span>
                </div>
                <span className="badge-row">
                  <span
                    className={`badge badge-format badge-format-${
                      m.format || 'limited'
                    }`}
                  >
                    {m.format === 'test' ? 'TEST' : 'LTD'}
                  </span>
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                </span>
              </div>

              <div className="match-list-innings">
                {innings.length === 0 ? (
                  <span className="muted small">
                    {m.format === 'test'
                      ? 'Test · not started'
                      : `${m.overs} overs · not started`}
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
                <span className="muted small">
                  {m.format === 'test'
                    ? 'Test match'
                    : `${m.overs} overs match`}
                </span>
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
                  <button
                    type="button"
                    className="btn danger small-btn"
                    disabled={rowBusy}
                    onClick={() => handleDelete(m)}
                  >
                    {rowBusy ? 'Deleting…' : 'Delete'}
                  </button>
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
