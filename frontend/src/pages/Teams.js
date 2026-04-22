import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { Stumps } from '../components/CricketIcons';
import {
  deleteTeam as apiDeleteTeam,
  getAllTeams,
  removePlayer as apiRemovePlayer,
} from '../services/teamService';
import { getErrorMessage } from '../services/api';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getAllTeams();
      setTeams(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteTeam = async (team) => {
    const ok = window.confirm(
      `Delete team "${team.name}"?\n\n` +
        `Any live or completed matches keep their own copy of the team and ` +
        `players, so those scorecards will stay intact. You can't undo this.`
    );
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(team._id);
      const { data } = await apiDeleteTeam(team._id);
      setTeams((prev) => prev.filter((t) => t._id !== team._id));
      setNotice(
        data?.hadActiveMatch
          ? `Team "${team.name}" deleted. The existing match keeps its own scorecard.`
          : `Team "${team.name}" deleted.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemovePlayer = async (team, player) => {
    const ok = window.confirm(
      `Remove ${player} from ${team.name}?\n\n` +
        `Any match already in progress keeps ${player} in its lineup; only ` +
        `future matches will see the updated squad.`
    );
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(`${team._id}:${player}`);
      const { data } = await apiRemovePlayer(team._id, player);
      setTeams((prev) =>
        prev.map((t) => (t._id === team._id ? data.data : t))
      );
      setNotice(
        data?.hadActiveMatch
          ? `${player} removed from "${team.name}". In-progress match is unchanged.`
          : `${player} removed from "${team.name}".`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="page teams-page">
      <PageBanner
        image="/images/cricket-team.png"
        kicker={
          <>
            <Stumps size={16} /> Your squads
          </>
        }
        title="Teams"
        subtitle="Manage your rosters — add players, clean up old squads, and get ready to play."
        tone="tone-green"
        actions={
          <Link to="/teams/new" className="btn primary">
            + New Team
          </Link>
        }
      />

      {error && <p className="form-message error">{error}</p>}
      {notice && <p className="form-message success">{notice}</p>}

      {loading ? (
        <p>Loading teams…</p>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <img
            src="/images/cricket-empty.png"
            alt=""
            className="empty-art"
          />
          <h3>No teams yet</h3>
          <p className="muted">Create your first team to start playing.</p>
          <Link to="/teams/new" className="btn primary">
            Create a team
          </Link>
        </div>
      ) : (
        <ul className="team-list">
          {teams.map((team) => {
            const teamBusy = busyId === team._id;
            return (
              <li key={team._id} className="team-card">
                <div className="team-card-head">
                  <div className="team-card-ident">
                    <TeamAvatar name={team.name} size={48} />
                    <div>
                      <h3 className="team-name">{team.name}</h3>
                      <span className="muted small">
                        {team.players.length} player
                        {team.players.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn danger small-btn"
                    disabled={teamBusy}
                    onClick={() => handleDeleteTeam(team)}
                  >
                    {teamBusy ? 'Deleting…' : 'Delete team'}
                  </button>
                </div>

                {team.players.length === 0 ? (
                  <p className="muted small">No players added.</p>
                ) : (
                  <ul className="player-chips">
                    {team.players.map((player) => {
                      const playerKey = `${team._id}:${player}`;
                      const playerBusy = busyId === playerKey;
                      return (
                        <li key={player} className="player-chip">
                          <span>{player}</span>
                          <button
                            className="chip-remove"
                            title={`Remove ${player}`}
                            disabled={playerBusy}
                            onClick={() => handleRemovePlayer(team, player)}
                          >
                            {playerBusy ? '…' : '×'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default Teams;
