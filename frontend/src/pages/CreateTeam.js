import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createTeam } from '../services/teamService';
import { getErrorMessage } from '../services/api';

function CreateTeam() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [playersInput, setPlayersInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    const players = playersInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      setSubmitting(true);
      const { data } = await createTeam({ name: name.trim(), players });
      setSuccess(`Team "${data.data.name}" created successfully.`);
      setName('');
      setPlayersInput('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page create-team">
      <h1>Create Team</h1>

      <form className="form" onSubmit={handleSubmit}>
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

        <label className="form-field">
          <span>Players (comma separated)</span>
          <input
            type="text"
            value={playersInput}
            onChange={(e) => setPlayersInput(e.target.value)}
            placeholder="Rohit, Jasprit, Suryakumar"
          />
        </label>

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
