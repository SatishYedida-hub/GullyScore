import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAllTeams } from '../services/teamService';
import { createMatch } from '../services/matchService';
import { getErrorMessage } from '../services/api';

function CreateMatch() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState(20);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await getAllTeams();
        if (mounted) setTeams(data.data || []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoadingTeams(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!teamA || !teamB) {
      setError('Please select both teams');
      return;
    }
    if (teamA === teamB) {
      setError('Team A and Team B must be different');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await createMatch({
        teamA,
        teamB,
        overs: Number(overs),
      });
      navigate(`/matches/${data.data._id}/live`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTeams) {
    return (
      <section className="page create-match">
        <h1>Create Match</h1>
        <p>Loading teams…</p>
      </section>
    );
  }

  if (teams.length < 2) {
    return (
      <section className="page create-match">
        <h1>Create Match</h1>
        <p>
          You need at least two teams to schedule a match.{' '}
          <button className="btn link" onClick={() => navigate('/teams/new')}>
            Create a team
          </button>
        </p>
      </section>
    );
  }

  return (
    <section className="page create-match">
      <h1>Create Match</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Team A</span>
          <select value={teamA} onChange={(e) => setTeamA(e.target.value)} required>
            <option value="">Select team A</option>
            {teams.map((t) => (
              <option key={t._id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Team B</span>
          <select value={teamB} onChange={(e) => setTeamB(e.target.value)} required>
            <option value="">Select team B</option>
            {teams
              .filter((t) => t.name !== teamA)
              .map((t) => (
                <option key={t._id} value={t.name}>{t.name}</option>
              ))}
          </select>
        </label>

        <label className="form-field">
          <span>Overs</span>
          <input
            type="number"
            min="1"
            max="50"
            value={overs}
            onChange={(e) => setOvers(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Start Match'}
          </button>
        </div>

        {error && <p className="form-message error">{error}</p>}
      </form>
    </section>
  );
}

export default CreateMatch;
