import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { Stumps } from '../components/CricketIcons';
import { createTeam } from '../services/teamService';
import { getRoster } from '../services/rosterService';
import { getErrorMessage } from '../services/api';

function CreateTeam() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getRoster();
        if (mounted) setRoster(data.data || []);
      } catch (err) {
        // Non-fatal — users can still type names manually.
        if (mounted) setRoster([]);
      } finally {
        if (mounted) setRosterLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const togglePlayer = (playerName) => {
    setSelected((prev) =>
      prev.includes(playerName)
        ? prev.filter((p) => p !== playerName)
        : [...prev, playerName]
    );
  };

  const addTyped = (e) => {
    e.preventDefault();
    const val = newPlayer.trim();
    if (!val) return;
    if (!selected.includes(val)) {
      setSelected((prev) => [...prev, val]);
    }
    setNewPlayer('');
  };

  const removeSelected = (playerName) => {
    setSelected((prev) => prev.filter((p) => p !== playerName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await createTeam({
        name: name.trim(),
        players: selected,
      });
      setSuccess(`Team "${data.data.name}" created successfully.`);
      setName('');
      setSelected([]);
      setNewPlayer('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page create-team">
      <PageBanner
        image="/images/cricket-team.png"
        kicker={
          <>
            <Stumps size={16} /> Build your squad
          </>
        }
        title="Create a Team"
        subtitle="Give your squad a name and pick players from your pool — or add new ones on the fly."
        tone="tone-blue"
        memeKey="createTeam"
      />

      <form className="form card-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Team name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mumbai Mavericks"
            required
          />
        </label>

        <div className="form-field">
          <span>Players</span>

          {selected.length === 0 ? (
            <p className="muted small">
              No players selected yet. Pick from your pool below or add a new
              name.
            </p>
          ) : (
            <ul className="selected-chips">
              {selected.map((p) => (
                <li key={p} className="selected-chip">
                  <TeamAvatar name={p} size={22} />
                  <span>{p}</span>
                  <button
                    type="button"
                    className="chip-remove"
                    title={`Remove ${p}`}
                    onClick={() => removeSelected(p)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="roster-input-row add-inline">
            <input
              type="text"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              placeholder="Type a new player name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTyped(e);
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={addTyped}
              disabled={!newPlayer.trim()}
            >
              + Add
            </button>
          </div>
          <p className="hint muted small">
            Tip: new names are saved to your player pool automatically.
          </p>
        </div>

        <div className="roster-picker">
          <div className="roster-picker-head">
            <h4 className="section-title">From your pool</h4>
            <Link to="/roster" className="btn link small-btn">
              Manage pool →
            </Link>
          </div>
          {rosterLoading ? (
            <p className="muted small">Loading players…</p>
          ) : roster.length === 0 ? (
            <p className="muted small">
              Your pool is empty. Type names above, or{' '}
              <Link to="/roster">add players to your pool</Link>.
            </p>
          ) : (
            <ul className="pool-chips">
              {roster.map((p) => {
                const isOn = selectedSet.has(p.name);
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      className={`pool-chip ${isOn ? 'on' : ''}`}
                      onClick={() => togglePlayer(p.name)}
                      aria-pressed={isOn}
                    >
                      <TeamAvatar name={p.name} photo={p.photo} size={22} />
                      <span>{p.name}</span>
                      <span className="pool-chip-mark">{isOn ? '✓' : '+'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create Team'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/teams')}
          >
            View all teams
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/matches/new')}
          >
            Go to Create Match
          </button>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}
      </form>
    </section>
  );
}

export default CreateTeam;
