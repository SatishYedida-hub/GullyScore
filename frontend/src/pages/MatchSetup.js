import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import PageBanner from '../components/PageBanner';
import TeamAvatar from '../components/TeamAvatar';
import { CricketBall } from '../components/CricketIcons';
import {
  getMatchById,
  setupMatch,
  setupInnings2,
} from '../services/matchService';
import { getErrorMessage } from '../services/api';
import { clearScorerToken, setScorerToken } from '../utils/scorerToken';

function MatchSetup() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isScorer, setIsScorer] = useState(false);

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  // For test at innings-break: scorer picks who bats next (follow-on support).
  // Initialized once the match loads.
  const [pickedBattingTeam, setPickedBattingTeam] = useState(null);

  const [takeoverInput, setTakeoverInput] = useState('');
  const [takeoverError, setTakeoverError] = useState(null);

  const fetchMatch = useCallback(async () => {
    try {
      const { data } = await getMatchById(id);
      setMatch(data.data);
      setIsScorer(!!data.isScorer);
      if (data.data.status === 'live' || data.data.status === 'completed') {
        navigate(`/matches/${id}/live`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const isInningsBreak = match?.status === 'innings-break';
  const isTestMatch = match?.format === 'test';
  const inningsCount = match?.innings?.length || 0;
  // For test, innings 2/3/4 all come through this same "innings break" flow.
  const nextInningsNumber = isInningsBreak ? inningsCount + 1 : 1;

  // Default: for limited, always flip. For test, suggest whichever team has
  // batted fewer times (follow-on neutral default).
  const defaultNextTeam = useMemo(() => {
    if (!match) return 'teamA';
    if (!isInningsBreak) return match.battingTeam;
    if (!isTestMatch) {
      return match.battingTeam === 'teamA' ? 'teamB' : 'teamA';
    }
    const timesBatted = (key) =>
      (match.innings || []).filter((i) => i.battingTeam === key).length;
    return timesBatted('teamA') <= timesBatted('teamB') ? 'teamA' : 'teamB';
  }, [match, isInningsBreak, isTestMatch]);

  // Seed the picked batting team once we know the default.
  useEffect(() => {
    if (pickedBattingTeam == null && match) {
      setPickedBattingTeam(defaultNextTeam);
    }
  }, [defaultNextTeam, match, pickedBattingTeam]);

  const battingTeamKey = isInningsBreak && isTestMatch && pickedBattingTeam
    ? pickedBattingTeam
    : defaultNextTeam;

  if (loading) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p>Loading…</p>
      </section>
    );
  }

  if (error && !match) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p className="form-message error">{error}</p>
      </section>
    );
  }

  if (!match) return null;

  const battingTeamName =
    battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeamName =
    battingTeamKey === 'teamA' ? match.teamB : match.teamA;
  const battingPlayers =
    battingTeamKey === 'teamA' ? match.teamAPlayers : match.teamBPlayers;
  const bowlingPlayers =
    battingTeamKey === 'teamA' ? match.teamBPlayers : match.teamAPlayers;

  if (!battingPlayers.length || !bowlingPlayers.length) {
    return (
      <section className="page">
        <h1>Match Setup</h1>
        <p className="form-message error">
          Both teams need players before the match can start. Add players on the
          teams and create a new match.
        </p>
      </section>
    );
  }

  const submitTakeover = async (e) => {
    e.preventDefault();
    setTakeoverError(null);
    const token = takeoverInput.trim();
    if (!token) {
      setTakeoverError('Paste the scorer key to take over.');
      return;
    }
    setScorerToken(id, token);
    try {
      const { data } = await getMatchById(id);
      if (!data.isScorer) {
        clearScorerToken(id);
        setTakeoverError("That key doesn't match this match.");
        return;
      }
      setMatch(data.data);
      setIsScorer(true);
      setTakeoverInput('');
    } catch (err) {
      clearScorerToken(id);
      setTakeoverError(getErrorMessage(err));
    }
  };

  if (!isScorer) {
    return (
      <section className="page match-setup">
        <PageBanner
          image="/images/cricket-hero.png"
          kicker={
            <>
              <CricketBall size={16} /> Waiting to start
            </>
          }
          title="Only the scorer can set up this match"
          subtitle={`${match.teamA} vs ${match.teamB} — ${
            isTestMatch ? 'Test match' : `${match.overs} overs`
          }`}
          tone="tone-blue"
        />
        <div className="card-form">
          <p className="muted">
            This match has a scorer key. Only the person who created the match
            (or whoever they transferred the key to) can pick the openers and
            bowler.
          </p>

          <form
            className="scorer-banner is-viewer"
            onSubmit={submitTakeover}
            style={{ marginTop: 12 }}
          >
            <div className="scorer-banner-text">
              <span className="scorer-dot viewer-dot" aria-hidden>●</span>
              <div>
                <strong>Got the scorer key?</strong>
                <span className="muted small">
                  Paste it here to take over scoring.
                </span>
              </div>
            </div>
            <div className="takeover-form">
              <input
                type="text"
                placeholder="Scorer key"
                value={takeoverInput}
                onChange={(e) => setTakeoverInput(e.target.value)}
              />
              <button type="submit" className="btn primary">
                Take over
              </button>
            </div>
          </form>
          {takeoverError && (
            <p className="form-message error">{takeoverError}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/matches')}
            >
              Back to match history
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handlePickBattingTeam = (key) => {
    if (key === battingTeamKey) return;
    setPickedBattingTeam(key);
    // Players from the old batting/bowling sides no longer apply.
    setStriker('');
    setNonStriker('');
    setBowler('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!striker || !nonStriker || !bowler) {
      setError('Please pick striker, non-striker, and opening bowler.');
      return;
    }
    if (striker === nonStriker) {
      setError('Striker and non-striker must be different players.');
      return;
    }

    try {
      setSubmitting(true);
      if (isInningsBreak) {
        // For test, pass the chosen batting team; for limited it's ignored.
        await setupInnings2(id, {
          striker,
          nonStriker,
          bowler,
          ...(isTestMatch ? { battingTeam: battingTeamKey } : {}),
        });
      } else {
        await setupMatch(id, { striker, nonStriker, bowler });
      }
      navigate(`/matches/${id}/live`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const bannerTitle = !isInningsBreak
    ? 'Match Setup'
    : isTestMatch
    ? `Innings ${nextInningsNumber} setup`
    : 'Second Innings Setup';
  const bannerKicker = !isInningsBreak
    ? 'Toss complete'
    : isTestMatch
    ? `End of innings ${inningsCount}`
    : 'Innings break';
  const bannerSubtitle = isTestMatch
    ? `Test match — ${battingTeamName} to bat${isInningsBreak ? ' next.' : ' first.'}`
    : `${match.overs} overs match — ${battingTeamName} to bat${
        isInningsBreak ? ' now.' : ' first.'
      }`;

  return (
    <section className="page match-setup">
      <PageBanner
        image={isInningsBreak ? '/images/cricket-action.png' : '/images/cricket-hero.png'}
        kicker={
          <>
            <CricketBall size={16} /> {bannerKicker}
          </>
        }
        title={bannerTitle}
        subtitle={bannerSubtitle}
        tone={isInningsBreak ? 'tone-orange' : 'tone-blue'}
      />

      <div className="versus-preview">
        <div className="versus-side">
          <TeamAvatar name={match.teamA} photo={match.teamAPhoto} size={56} />
          <div>
            <strong>{match.teamA}</strong>
            <span className="muted small">
              {match.teamAPlayers?.length || 0} players
            </span>
          </div>
        </div>
        <span className="versus-divider">VS</span>
        <div className="versus-side versus-right">
          <div className="ta-right">
            <strong>{match.teamB}</strong>
            <span className="muted small">
              {match.teamBPlayers?.length || 0} players
            </span>
          </div>
          <TeamAvatar name={match.teamB} photo={match.teamBPhoto} size={56} />
        </div>
      </div>

      {isInningsBreak && (match.innings || []).length > 0 && (
        <div className="innings-summary">
          {(match.innings || []).map((i) => {
            const tname = i.battingTeam === 'teamA' ? match.teamA : match.teamB;
            return (
              <span key={i.number} className="summary-pill">
                <span className="muted small">Inn {i.number}</span>{' '}
                <strong>{tname}</strong> {i.score.runs}/{i.score.wickets}
                {!isTestMatch && ` (${(i.score.overs ?? 0).toFixed(1)})`}
              </span>
            );
          })}
        </div>
      )}

      {isInningsBreak && !isTestMatch && match.target && (
        <div className="target-banner">
          <div>
            <span className="target-label">Target</span>
            <span className="target-value">
              {match.target} runs from {match.overs} overs
            </span>
          </div>
        </div>
      )}

      {isInningsBreak && isTestMatch && (
        <fieldset className="form-field follow-on-field">
          <span>Who bats next?</span>
          <div className="radio-row">
            {['teamA', 'teamB'].map((key) => {
              const tname = key === 'teamA' ? match.teamA : match.teamB;
              const timesBatted = (match.innings || []).filter(
                (i) => i.battingTeam === key
              ).length;
              return (
                <label key={key} className="radio-option">
                  <input
                    type="radio"
                    name="next-batting-team"
                    value={key}
                    checked={battingTeamKey === key}
                    onChange={() => handlePickBattingTeam(key)}
                  />
                  <span>
                    {tname}
                    <span className="muted small block">
                      {timesBatted === 0
                        ? 'Yet to bat'
                        : `Already batted ${timesBatted}x`}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {nextInningsNumber === 3 && (
            <p className="muted small">
              Tip: if you want to enforce the follow-on, pick the trailing team
              to bat again.
            </p>
          )}
          {nextInningsNumber === 4 && (
            <p className="muted small">
              Innings 4: the chosen team is batting to chase the remaining lead.
            </p>
          )}
        </fieldset>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Striker ({battingTeamName})</span>
          <select
            value={striker}
            onChange={(e) => setStriker(e.target.value)}
            required
          >
            <option value="">Select striker</option>
            {battingPlayers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Non-striker ({battingTeamName})</span>
          <select
            value={nonStriker}
            onChange={(e) => setNonStriker(e.target.value)}
            required
          >
            <option value="">Select non-striker</option>
            {battingPlayers
              .filter((p) => p !== striker)
              .map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
          </select>
        </label>

        <label className="form-field">
          <span>Opening Bowler ({bowlingTeamName})</span>
          <select
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            required
          >
            <option value="">Select bowler</option>
            {bowlingPlayers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting
              ? 'Starting…'
              : !isInningsBreak
              ? 'Start Innings'
              : isTestMatch
              ? `Start Innings ${nextInningsNumber}`
              : 'Start Chase'}
          </button>
        </div>

        {error && <p className="form-message error">{error}</p>}
      </form>
    </section>
  );
}

export default MatchSetup;
