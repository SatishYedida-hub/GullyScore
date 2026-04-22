import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { CricketBat } from '../components/CricketIcons';
import { getAllTeams } from '../services/teamService';
import { createMatch } from '../services/matchService';
import { getErrorMessage } from '../services/api';

function CreateMatch() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [battingTeam, setBattingTeam] = useState('teamA');
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
        battingTeam,
      });
      navigate(`/matches/${data.data._id}/setup`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const banner = (
    <PageBanner
      image="/images/cricket-action.png"
      kicker={
        <>
          <CricketBat size={16} /> Match day
        </>
      }
      title="Start a Match"
      subtitle="Pick the two sides, who bats first, and how many overs — then we'll roll."
      tone="tone-orange"
    />
  );

  if (loadingTeams) {
    return (
      <section className="page create-match">
        {banner}
        <p>Loading teams…</p>
      </section>
    );
  }

  if (teams.length < 2) {
    return (
      <section className="page create-match">
        {banner}
        <div className="empty-state">
          <h3>You need at least two teams</h3>
          <p className="muted">Create a couple of squads before scheduling a match.</p>
          <button className="btn primary" onClick={() => navigate('/teams/new')}>
            Create a team
          </button>
        </div>
      </section>
    );
  }

  const teamAObj = teams.find((t) => t.name === teamA);
  const teamBObj = teams.find((t) => t.name === teamB);

  return (
    <section className="page create-match">
      {banner}

      {(teamA || teamB) && (
        <div className="versus-preview">
          <div className="versus-side">
            {teamAObj ? (
              <>
                <TeamAvatar name={teamAObj.name} size={56} />
                <div>
                  <strong>{teamAObj.name}</strong>
                  <span className="muted small">
                    {teamAObj.players?.length || 0} players
                  </span>
                </div>
              </>
            ) : (
              <span className="muted">Team A</span>
            )}
          </div>
          <span className="versus-divider">VS</span>
          <div className="versus-side versus-right">
            {teamBObj ? (
              <>
                <div className="ta-right">
                  <strong>{teamBObj.name}</strong>
                  <span className="muted small">
                    {teamBObj.players?.length || 0} players
                  </span>
                </div>
                <TeamAvatar name={teamBObj.name} size={56} />
              </>
            ) : (
              <span className="muted">Team B</span>
            )}
          </div>
        </div>
      )}

      <form className="form card-form" onSubmit={handleSubmit}>
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

        <fieldset className="form-field">
          <span>Who bats first?</span>
          <div className="radio-row">
            <label className="radio-option">
              <input
                type="radio"
                name="battingTeam"
                value="teamA"
                checked={battingTeam === 'teamA'}
                onChange={() => setBattingTeam('teamA')}
              />
              <span>{teamA || 'Team A'}</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="battingTeam"
                value="teamB"
                checked={battingTeam === 'teamB'}
                onChange={() => setBattingTeam('teamB')}
              />
              <span>{teamB || 'Team B'}</span>
            </label>
          </div>
        </fieldset>

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
