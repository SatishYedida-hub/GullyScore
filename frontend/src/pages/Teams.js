import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
      `Delete team "${team.name}"?\n\nThis only removes the team. Any completed matches that used this team stay intact.`
    );
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(team._id);
      await apiDeleteTeam(team._id);
      setTeams((prev) => prev.filter((t) => t._id !== team._id));
      setNotice(`Team "${team.name}" deleted.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemovePlayer = async (team, player) => {
    const ok = window.confirm(`Remove ${player} from ${team.name}?`);
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(`${team._id}:${player}`);
      const { data } = await apiRemovePlayer(team._id, player);
      setTeams((prev) =>
        prev.map((t) => (t._id === team._id ? data.data : t))
      );
      setNotice(`${player} removed from "${team.name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="page teams-page">
      <div className="page-header">
        <h1>Teams</h1>
        <Link to="/teams/new" className="btn primary">
          + New Team
        </Link>
      </div>

      {error && <p className="form-message error">{error}</p>}
      {notice && <p className="form-message success">{notice}</p>}

      {loading ? (
        <p>Loading teams…</p>
      ) : teams.length === 0 ? (
        <div className="empty-state">
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
                  <h3 className="team-name">{team.name}</h3>
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
