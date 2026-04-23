import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import PhotoUploader from '../components/PhotoUploader';
import { CricketBat } from '../components/CricketIcons';
import {
  addRosterPlayer,
  deleteRosterPlayer,
  getRoster,
  updatePlayerPhoto as apiUpdatePlayerPhoto,
} from '../services/rosterService';
import { getErrorMessage } from '../services/api';

function Roster() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const [photoPlayer, setPhotoPlayer] = useState(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getRoster();
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
        (p.teams || []).some((t) => t.name.toLowerCase().includes(q))
    );
  }, [players, query]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Player name is required');
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await addRosterPlayer(trimmed);
      setPlayers((prev) =>
        [data.data, ...prev].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNotice(`Added "${data.data.name}" to your player pool.`);
      setName('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    const inUse = p.teams && p.teams.length > 0;
    const teamsNote = inUse
      ? `\n\n${p.name} is still listed in: ${p.teams
          .map((t) => t.name)
          .join(', ')}.\nTeams keep their own roster, so they won't be touched ` +
        `automatically — remove them from those teams too if needed.`
      : '';
    const ok = window.confirm(
      `Remove ${p.name} from the global player pool?${teamsNote}\n\nYou can't undo this.`
    );
    if (!ok) return;

    setError(null);
    setNotice(null);
    try {
      setBusyId(p._id);
      await deleteRosterPlayer(p._id);
      setPlayers((prev) => prev.filter((x) => x._id !== p._id));
      setNotice(`"${p.name}" removed from the pool.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const applyPhoto = async (dataUrl) => {
    if (!photoPlayer) return;
    setError(null);
    setNotice(null);
    try {
      setPhotoSaving(true);
      const { data } = await apiUpdatePlayerPhoto(photoPlayer._id, dataUrl);
      setPlayers((prev) =>
        prev.map((p) =>
          p._id === photoPlayer._id ? { ...p, photo: data.data.photo } : p
        )
      );
      setNotice(
        dataUrl
          ? `Photo updated for "${photoPlayer.name}".`
          : `Photo removed from "${photoPlayer.name}".`
      );
      setPhotoPlayer(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoSaving(false);
    }
  };

  const banner = (
    <PageBanner
      image="/images/cricket-team.png"
      kicker={
        <>
          <CricketBat size={16} /> Your player pool
        </>
      }
      title="Players"
      subtitle="One place for all your players. Add them once, then drop them into any team."
      tone="tone-green"
      memeKey="roster"
    />
  );

  return (
    <section className="page roster-page">
      {banner}

      <form className="form card-form roster-form" onSubmit={handleAdd}>
        <label className="form-field roster-form-field">
          <span>Add a player</span>
          <div className="roster-input-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Virat Kohli"
            />
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Adding…' : '+ Add'}
            </button>
          </div>
        </label>
      </form>

      {error && <p className="form-message error">{error}</p>}
      {notice && <p className="form-message success">{notice}</p>}

      {loading ? (
        <p>Loading players…</p>
      ) : players.length === 0 ? (
        <div className="empty-state">
          <img
            src="/images/cricket-empty.png"
            alt=""
            className="empty-art"
          />
          <h3>No players yet</h3>
          <p className="muted">
            Add your first player above, then you can drop them into any team.
          </p>
        </div>
      ) : (
        <>
          <div className="roster-toolbar">
            <span className="muted small">
              {players.length} player{players.length === 1 ? '' : 's'} in your
              pool
            </span>
            <input
              type="search"
              className="players-search"
              placeholder="Search players or teams…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <ul className="roster-list">
            {filtered.map((p) => {
              const rowBusy = busyId === p._id;
              return (
                <li key={p._id} className="roster-row">
                  <button
                    type="button"
                    className="avatar-btn roster-avatar-btn"
                    onClick={() => setPhotoPlayer(p)}
                    title="Change player photo"
                  >
                    <TeamAvatar name={p.name} photo={p.photo} size={40} />
                    <span className="avatar-edit-badge" aria-hidden>✎</span>
                  </button>
                  <Link
                    to={`/players/${encodeURIComponent(p.name)}`}
                    className="roster-row-main"
                  >
                    <div>
                      <strong className="roster-row-name">{p.name}</strong>
                      {p.teams.length === 0 ? (
                        <span className="muted small block">
                          Not on any team yet
                        </span>
                      ) : (
                        <span className="muted small block">
                          On {p.teams.length} team
                          {p.teams.length === 1 ? '' : 's'}:{' '}
                          {p.teams.map((t) => t.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="roster-row-actions">
                    <button
                      type="button"
                      className="btn small-btn"
                      onClick={() => setPhotoPlayer(p)}
                    >
                      {p.photo ? 'Change' : '+ Photo'}
                    </button>
                    <button
                      className="btn danger small-btn"
                      disabled={rowBusy}
                      onClick={() => handleDelete(p)}
                    >
                      {rowBusy ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <PhotoUploader
        open={!!photoPlayer}
        title={photoPlayer ? `Player photo — ${photoPlayer.name}` : 'Player photo'}
        currentPhoto={photoPlayer?.photo || ''}
        fallbackName={photoPlayer?.name || ''}
        onSave={applyPhoto}
        onRemove={photoPlayer?.photo ? () => applyPhoto('') : undefined}
        onClose={() => (photoSaving ? null : setPhotoPlayer(null))}
        saving={photoSaving}
      />
    </section>
  );
}

export default Roster;
