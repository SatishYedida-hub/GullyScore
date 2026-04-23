import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import PhotoUploader from '../components/PhotoUploader';
import { Stumps } from '../components/CricketIcons';
import {
  addPlayerToTeam as apiAddPlayer,
  deleteTeam as apiDeleteTeam,
  getAllTeams,
  removePlayer as apiRemovePlayer,
  updateTeamPhoto as apiUpdateTeamPhoto,
} from '../services/teamService';
import { getRoster } from '../services/rosterService';
import { getErrorMessage } from '../services/api';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [photoTeam, setPhotoTeam] = useState(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [teamsRes, rosterRes] = await Promise.all([
        getAllTeams(),
        getRoster().catch(() => ({ data: { data: [] } })),
      ]);
      setTeams(teamsRes.data.data || []);
      setRoster(rosterRes.data.data || []);
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

  const savePhoto = async (dataUrl) => {
    if (!photoTeam) return;
    setError(null);
    setNotice(null);
    try {
      setPhotoSaving(true);
      const { data } = await apiUpdateTeamPhoto(photoTeam._id, dataUrl);
      setTeams((prev) =>
        prev.map((t) => (t._id === photoTeam._id ? data.data : t))
      );
      setNotice(`Photo updated for "${photoTeam.name}".`);
      setPhotoTeam(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoSaving(false);
    }
  };

  const removePhoto = async () => {
    if (!photoTeam) return;
    setError(null);
    setNotice(null);
    try {
      setPhotoSaving(true);
      const { data } = await apiUpdateTeamPhoto(photoTeam._id, '');
      setTeams((prev) =>
        prev.map((t) => (t._id === photoTeam._id ? data.data : t))
      );
      setNotice(`Photo removed from "${photoTeam.name}".`);
      setPhotoTeam(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleAddPlayer = async (team, playerName) => {
    const val = (playerName || '').trim();
    if (!val) return;
    setError(null);
    setNotice(null);
    try {
      setBusyId(`${team._id}:add`);
      const { data } = await apiAddPlayer(team._id, val);
      setTeams((prev) =>
        prev.map((t) => (t._id === team._id ? data.data : t))
      );
      // Mirror into local roster cache if it's a brand-new name
      setRoster((prev) =>
        prev.find((p) => p.name === val)
          ? prev
          : [
              ...prev,
              { _id: `local-${val}`, name: val, teams: [{ name: team.name }] },
            ].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNotice(`${val} added to "${team.name}".`);
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
        subtitle="Manage your rosters — add players from your pool, clean up old squads, and get ready to play."
        tone="tone-green"
        memeKey="teamsList"
        actions={
          <div className="page-banner-btn-row">
            <Link to="/roster" className="btn">
              Manage player pool
            </Link>
            <Link to="/teams/new" className="btn primary">
              + New Team
            </Link>
          </div>
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
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              roster={roster}
              busyId={busyId}
              onDeleteTeam={handleDeleteTeam}
              onRemovePlayer={handleRemovePlayer}
              onAddPlayer={handleAddPlayer}
              onChangePhoto={() => setPhotoTeam(team)}
            />
          ))}
        </ul>
      )}

      <PhotoUploader
        open={!!photoTeam}
        title={photoTeam ? `Team photo — ${photoTeam.name}` : 'Team photo'}
        currentPhoto={photoTeam?.photo || ''}
        fallbackName={photoTeam?.name || ''}
        onSave={savePhoto}
        onRemove={photoTeam?.photo ? removePhoto : undefined}
        onClose={() => (photoSaving ? null : setPhotoTeam(null))}
        saving={photoSaving}
      />
    </section>
  );
}

function TeamCard({
  team,
  roster,
  busyId,
  onDeleteTeam,
  onRemovePlayer,
  onAddPlayer,
  onChangePhoto,
}) {
  const [picker, setPicker] = useState('');
  const [typed, setTyped] = useState('');

  const available = useMemo(
    () => roster.filter((p) => !team.players.includes(p.name)),
    [roster, team.players]
  );

  const teamBusy = busyId === team._id;
  const addBusy = busyId === `${team._id}:add`;

  const handlePick = (e) => {
    const val = e.target.value;
    setPicker('');
    if (val) onAddPlayer(team, val);
  };

  const handleAddTyped = (e) => {
    e.preventDefault();
    const val = typed.trim();
    if (!val) return;
    setTyped('');
    onAddPlayer(team, val);
  };

  return (
    <li className="team-card">
      <div className="team-card-head">
        <div className="team-card-ident">
          <button
            type="button"
            className="avatar-btn"
            onClick={() => onChangePhoto && onChangePhoto(team)}
            title="Change team photo"
          >
            <TeamAvatar name={team.name} photo={team.photo} size={48} />
            <span className="avatar-edit-badge" aria-hidden>✎</span>
          </button>
          <div>
            <h3 className="team-name">{team.name}</h3>
            <span className="muted small">
              {team.players.length} player
              {team.players.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="team-card-actions">
          <button
            type="button"
            className="btn small-btn"
            onClick={() => onChangePhoto && onChangePhoto(team)}
          >
            {team.photo ? 'Change photo' : '+ Add photo'}
          </button>
          <button
            className="btn danger small-btn"
            disabled={teamBusy}
            onClick={() => onDeleteTeam(team)}
          >
            {teamBusy ? 'Deleting…' : 'Delete team'}
          </button>
        </div>
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
                  onClick={() => onRemovePlayer(team, player)}
                >
                  {playerBusy ? '…' : '×'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="add-player-bar">
        {available.length > 0 && (
          <select
            className="add-player-select"
            value={picker}
            onChange={handlePick}
            disabled={addBusy}
          >
            <option value="">+ Add from pool…</option>
            {available.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <form className="add-player-inline" onSubmit={handleAddTyped}>
          <input
            type="text"
            className="add-player-input"
            placeholder="Or type a new name…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={addBusy}
          />
          <button
            type="submit"
            className="btn small-btn"
            disabled={addBusy || !typed.trim()}
          >
            {addBusy ? 'Adding…' : '+ Add'}
          </button>
        </form>
      </div>
    </li>
  );
}

export default Teams;
