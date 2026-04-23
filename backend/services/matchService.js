const mongoose = require('mongoose');
const crypto = require('crypto');

const Match = require('../models/Match');
const Team = require('../models/Team');
const { ballsToOvers, BALLS_PER_OVER } = require('../utils/cricket');

// 6 random bytes → ~8 base64url characters. Easy for humans to copy, hard
// enough to guess for gully-cricket purposes.
const generateScorerToken = () =>
  crypto.randomBytes(6).toString('base64url');

const MAX_WICKETS = 10;

const teamNameOf = (match, key) =>
  key === 'teamA' ? match.teamA : match.teamB;

const currentInnings = (match) => {
  if (!match.innings || match.innings.length === 0) return null;
  return match.innings[match.innings.length - 1];
};

const getBattingTeamPlayers = (match) => {
  const inn = currentInnings(match);
  const team = inn ? inn.battingTeam : match.battingTeam;
  return team === 'teamA' ? match.teamAPlayers : match.teamBPlayers;
};

const getBowlingTeamPlayers = (match) => {
  const inn = currentInnings(match);
  const team = inn ? inn.battingTeam : match.battingTeam;
  return team === 'teamA' ? match.teamBPlayers : match.teamAPlayers;
};

const findMissingTeams = async (names) => {
  const existing = await Team.find({ name: { $in: names } }).select('name');
  const existingNames = new Set(existing.map((t) => t.name));
  return names.filter((n) => !existingNames.has(n));
};

const createMatch = async ({ teamA, teamB, overs, battingTeam = 'teamA' }) => {
  const teams = await Team.find({ name: { $in: [teamA, teamB] } });
  const aDoc = teams.find((t) => t.name === teamA);
  const bDoc = teams.find((t) => t.name === teamB);

  const scorerToken = generateScorerToken();

  const match = new Match({
    teamA,
    teamB,
    teamAPlayers: aDoc ? aDoc.players : [],
    teamBPlayers: bDoc ? bDoc.players : [],
    // Snapshot the current crests so scorecards survive later team edits.
    teamAPhoto: aDoc ? aDoc.photo || '' : '',
    teamBPhoto: bDoc ? bDoc.photo || '' : '',
    overs,
    battingTeam,
    scorerToken,
  });
  const saved = await match.save();
  // Return the token alongside the match so the creator can save/share it.
  // The token is NOT part of the saved match projection (select:false).
  return { match: saved, scorerToken };
};

const getAllMatches = async () => Match.find().sort({ createdAt: -1 });

const getMatchById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Match.findById(id);
};

const loadForWrite = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Match.findById(id).select('+history +scorerToken');
};

/**
 * True if the provided token matches the match's scorer lock, OR if the
 * match has no scorer lock yet (legacy / upgrade-in-place matches).
 */
const isScorerToken = (match, providedToken) => {
  if (!match.scorerToken) return true;
  if (!providedToken) return false;
  return providedToken === match.scorerToken;
};

/**
 * Rotate the scorer token and return the new one. Callers must have already
 * verified the current holder.
 */
const rotateScorerToken = async (match) => {
  const newToken = generateScorerToken();
  match.scorerToken = newToken;
  await match.save();
  return newToken;
};

const HISTORY_LIMIT = 30;

const snapshotMatch = (match) => ({
  innings: match.toObject().innings,
  status: match.status,
  target: match.target,
  result: match.result,
});

const pushHistory = (match, kind) => {
  if (!match.history) match.history = [];
  match.history.push({ kind, snapshot: snapshotMatch(match), at: new Date() });
  if (match.history.length > HISTORY_LIMIT) {
    match.history.splice(0, match.history.length - HISTORY_LIMIT);
  }
};

const undoLastAction = async (match) => {
  if (!match.history || match.history.length === 0) {
    const err = new Error('Nothing to undo');
    err.status = 400;
    throw err;
  }
  const entry = match.history.pop();
  const { snapshot } = entry;
  match.innings = snapshot.innings;
  match.status = snapshot.status;
  match.target = snapshot.target !== undefined ? snapshot.target : null;
  match.result = snapshot.result || '';
  return match.save();
};

const buildInningsPayload = (number, battingTeam, striker, nonStriker, bowler) => ({
  number,
  battingTeam,
  batsmen: [
    { name: striker, order: 1 },
    { name: nonStriker, order: 2 },
  ],
  bowlers: [{ name: bowler }],
  striker,
  nonStriker,
  currentBowler: bowler,
  lastOverBowler: null,
  currentOverEvents: [],
  completed: false,
});

const setupMatch = async (match, { striker, nonStriker, bowler }) => {
  match.innings = [];
  match.innings.push(
    buildInningsPayload(1, match.battingTeam, striker, nonStriker, bowler)
  );
  match.status = 'live';
  return match.save();
};

const setupInnings2 = async (match, { striker, nonStriker, bowler }) => {
  const secondBattingTeam =
    match.battingTeam === 'teamA' ? 'teamB' : 'teamA';
  match.innings.push(
    buildInningsPayload(2, secondBattingTeam, striker, nonStriker, bowler)
  );
  match.status = 'live';
  return match.save();
};

const findBatsmanEntry = (inn, name) => inn.batsmen.find((b) => b.name === name);
const findBowlerEntry = (inn, name) => inn.bowlers.find((b) => b.name === name);

const ensureBatsmanEntry = (inn, name) => {
  let entry = findBatsmanEntry(inn, name);
  if (!entry) {
    const maxOrder = inn.batsmen.reduce(
      (m, b) => Math.max(m, b.order || 0),
      0
    );
    inn.batsmen.push({ name, order: maxOrder + 1 });
    entry = inn.batsmen[inn.batsmen.length - 1];
  }
  return entry;
};

const ensureBowlerEntry = (inn, name) => {
  let entry = findBowlerEntry(inn, name);
  if (!entry) {
    inn.bowlers.push({ name });
    entry = inn.bowlers[inn.bowlers.length - 1];
  }
  return entry;
};

const buildLabel = ({ wicket, extra, runs }) => {
  if (wicket) return runs ? `${runs}W` : 'W';
  if (extra === 'wide') return runs ? `wd+${runs}` : 'wd';
  if (extra === 'no-ball') return runs ? `nb+${runs}` : 'nb';
  if (runs === 0) return '•';
  return String(runs);
};

const computeResult = (match, inn) => {
  const firstInn = match.innings[0];
  if (inn.number === 1) return '';

  const target = match.target;
  const wicketsRemaining = MAX_WICKETS - inn.score.wickets;
  const battingName = teamNameOf(match, inn.battingTeam);
  const otherName = teamNameOf(match, firstInn.battingTeam);

  if (target && inn.score.runs >= target) {
    return `${battingName} won by ${wicketsRemaining} wicket${
      wicketsRemaining === 1 ? '' : 's'
    }`;
  }

  const diff = firstInn.score.runs - inn.score.runs;
  if (diff === 0) return 'Match tied';
  return `${otherName} won by ${diff} run${diff === 1 ? '' : 's'}`;
};

const applyScoreUpdate = async (match, { runs, wicket, extra, howOut }) => {
  pushHistory(match, 'score');
  const inn = currentInnings(match);
  const striker = findBatsmanEntry(inn, inn.striker);
  const bowler = findBowlerEntry(inn, inn.currentBowler);

  const isWide = extra === 'wide';
  const isNoBall = extra === 'no-ball';
  const isLegalBall = !isWide && !isNoBall;

  const extraPenalty = isWide || isNoBall ? 1 : 0;
  const runsForTeam = runs + extraPenalty;

  inn.score.runs = (inn.score.runs || 0) + runsForTeam;

  if (isWide) {
    inn.extras.wides = (inn.extras.wides || 0) + 1 + runs;
  }
  if (isNoBall) {
    inn.extras.noBalls = (inn.extras.noBalls || 0) + 1;
  }

  bowler.runs = (bowler.runs || 0) + runsForTeam;
  bowler.runsInCurrentOver = (bowler.runsInCurrentOver || 0) + runsForTeam;
  if (isLegalBall) {
    bowler.balls = (bowler.balls || 0) + 1;
  }

  if (isLegalBall) {
    striker.balls = (striker.balls || 0) + 1;
    striker.runs = (striker.runs || 0) + runs;
    if (runs === 4) striker.fours = (striker.fours || 0) + 1;
    if (runs === 6) striker.sixes = (striker.sixes || 0) + 1;
  } else if (isNoBall) {
    striker.runs = (striker.runs || 0) + runs;
    if (runs === 4) striker.fours = (striker.fours || 0) + 1;
    if (runs === 6) striker.sixes = (striker.sixes || 0) + 1;
  }

  if (wicket) {
    striker.out = true;
    striker.howOut = howOut || 'out';
    inn.score.wickets = (inn.score.wickets || 0) + 1;
    bowler.wickets = (bowler.wickets || 0) + 1;
    inn.striker = null;
  }

  inn.currentOverEvents.push({
    label: buildLabel({ wicket, extra, runs }),
    runs,
    extra: extra || null,
    wicket: !!wicket,
  });

  if (!wicket && runs % 2 === 1) {
    const tmp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = tmp;
  }

  if (isLegalBall) {
    inn.score.balls = (inn.score.balls || 0) + 1;
    inn.score.overs = ballsToOvers(inn.score.balls);

    if (bowler.balls % BALLS_PER_OVER === 0) {
      if (bowler.runsInCurrentOver === 0) {
        bowler.maidens = (bowler.maidens || 0) + 1;
      }
      bowler.runsInCurrentOver = 0;

      const tmpS = inn.striker;
      inn.striker = inn.nonStriker;
      inn.nonStriker = tmpS;

      inn.lastOverBowler = inn.currentBowler;
      inn.currentBowler = null;
      inn.currentOverEvents = [];
    }
  }

  const allOut = inn.score.wickets >= MAX_WICKETS;
  const oversDone =
    typeof match.overs === 'number' &&
    inn.score.balls >= match.overs * BALLS_PER_OVER;
  const targetReached =
    inn.number === 2 && match.target && inn.score.runs >= match.target;

  if (inn.number === 1 && (allOut || oversDone)) {
    inn.completed = true;
    inn.striker = null;
    inn.nonStriker = null;
    inn.currentBowler = null;
    match.target = inn.score.runs + 1;
    match.status = 'innings-break';
  } else if (inn.number === 2 && (targetReached || allOut || oversDone)) {
    inn.completed = true;
    inn.striker = null;
    inn.nonStriker = null;
    inn.currentBowler = null;
    match.status = 'completed';
    match.result = computeResult(match, inn);
  }

  return match.save();
};

const setNewBatsman = async (match, name) => {
  pushHistory(match, 'new-batsman');
  const inn = currentInnings(match);
  ensureBatsmanEntry(inn, name);
  if (!inn.striker) {
    inn.striker = name;
  } else if (!inn.nonStriker) {
    inn.nonStriker = name;
  }
  return match.save();
};

const setNewBowler = async (match, name) => {
  pushHistory(match, 'new-bowler');
  const inn = currentInnings(match);
  ensureBowlerEntry(inn, name);
  inn.currentBowler = name;
  return match.save();
};

const deleteMatch = async (match) => {
  await Match.deleteOne({ _id: match._id });
  return match;
};

module.exports = {
  findMissingTeams,
  createMatch,
  getAllMatches,
  getMatchById,
  loadForWrite,
  setupMatch,
  setupInnings2,
  applyScoreUpdate,
  setNewBatsman,
  setNewBowler,
  undoLastAction,
  deleteMatch,
  getBattingTeamPlayers,
  getBowlingTeamPlayers,
  currentInnings,
  isScorerToken,
  rotateScorerToken,
  MAX_WICKETS,
};
