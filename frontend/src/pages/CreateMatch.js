import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { CricketBat } from '../components/CricketIcons';
import { getAllTeams } from '../services/teamService';
import { createMatch } from '../services/matchService';
import { getErrorMessage } from '../services/api';
import { setScorerToken } from '../utils/scorerToken';

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
  // When a match is created the backend returns a one-time scorer key. We
  // show it in a confirmation modal so the creator can copy/share it before
  // heading into setup.
  const [newMatch, setNewMatch] = useState(null);
  const [copied, setCopied] = useState(false);

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
      // Persist the scorer key for this device immediately so later requests
      // (setup, score, etc.) are authorized without any extra user action.
      if (data.scorerToken) {
        setScorerToken(data.data._id, data.scorerToken);
      }
      setNewMatch({ id: data.data._id, token: data.scorerToken || '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToken = async () => {
    if (!newMatch?.token) return;
    try {
      await navigator.clipboard.writeText(newMatch.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setCopied(false);
    }
  };

  const continueToSetup = () => {
    if (!newMatch) return;
    navigate(`/matches/${newMatch.id}/setup`);
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

      {newMatch && (
        <div className="modal-backdrop" onClick={continueToSetup}>
          <div
            className="modal scorer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Your scorer key</h3>
            <p className="muted small">
              Only the person who has this key can update the score. Save it
              somewhere safe — you can later transfer it to another scorer from
              the live score page.
            </p>

            {newMatch.token ? (
              <>
                <div className="scorer-token-box">
                  <code className="scorer-token">{newMatch.token}</code>
                  <button
                    type="button"
                    className="btn"
                    onClick={copyToken}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="muted small">
                  We've already saved it on this device. If you close this
                  browser without copying, you can still score from here — but
                  keep a copy in case.
                </p>
              </>
            ) : (
              <p className="form-message error">
                Unable to generate a scorer key. Anyone will be able to score
                this match.
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                onClick={continueToSetup}
              >
                Continue to setup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CreateMatch;
