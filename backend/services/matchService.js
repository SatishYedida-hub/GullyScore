const mongoose = require('mongoose');

const Match = require('../models/Match');
const Team = require('../models/Team');
const { ballsToOvers, isExtra, BALLS_PER_OVER } = require('../utils/cricket');

const MAX_WICKETS = 10;

const getBattingTeamPlayers = (match) =>
  match.battingTeam === 'teamA' ? match.teamAPlayers : match.teamBPlayers;

const getBowlingTeamPlayers = (match) =>
  match.battingTeam === 'teamA' ? match.teamBPlayers : match.teamAPlayers;

const findMissingTeams = async (names) => {
  const existing = await Team.find({ name: { $in: names } }).select('name');
  const existingNames = new Set(existing.map((t) => t.name));
  return names.filter((n) => !existingNames.has(n));
};

const createMatch = async ({ teamA, teamB, overs, battingTeam = 'teamA' }) => {
  const teams = await Team.find({ name: { $in: [teamA, teamB] } });
  const aDoc = teams.find((t) => t.name === teamA);
  const bDoc = teams.find((t) => t.name === teamB);

  const match = new Match({
    teamA,
    teamB,
    teamAPlayers: aDoc ? aDoc.players : [],
    teamBPlayers: bDoc ? bDoc.players : [],
    overs,
    battingTeam,
  });
  return match.save();
};

const getAllMatches = async () => {
  return Match.find().sort({ createdAt: -1 });
};

const getMatchById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Match.findById(id);
};

const setupMatch = async (match, { striker, nonStriker, bowler }) => {
  match.batsmen = [
    { name: striker, order: 1 },
    { name: nonStriker, order: 2 },
  ];
  match.bowlers = [{ name: bowler }];
  match.striker = striker;
  match.nonStriker = nonStriker;
  match.currentBowler = bowler;
  match.lastOverBowler = null;
  match.status = 'live';
  match.currentOverEvents = [];
  return match.save();
};

const findBatsmanEntry = (match, name) =>
  match.batsmen.find((b) => b.name === name);

const findBowlerEntry = (match, name) =>
  match.bowlers.find((b) => b.name === name);

const ensureBatsmanEntry = (match, name) => {
  let entry = findBatsmanEntry(match, name);
  if (!entry) {
    const maxOrder = match.batsmen.reduce(
      (m, b) => Math.max(m, b.order || 0),
      0
    );
    match.batsmen.push({ name, order: maxOrder + 1 });
    entry = match.batsmen[match.batsmen.length - 1];
  }
  return entry;
};

const ensureBowlerEntry = (match, name) => {
  let entry = findBowlerEntry(match, name);
  if (!entry) {
    match.bowlers.push({ name });
    entry = match.bowlers[match.bowlers.length - 1];
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

const applyScoreUpdate = async (match, { runs, wicket, extra, howOut }) => {
  const striker = findBatsmanEntry(match, match.striker);
  const bowler = findBowlerEntry(match, match.currentBowler);

  const isWide = extra === 'wide';
  const isNoBall = extra === 'no-ball';
  const isLegalBall = !isWide && !isNoBall;

  const extraPenalty = isWide || isNoBall ? 1 : 0;
  const runsForTeam = runs + extraPenalty;

  match.score.runs = (match.score.runs || 0) + runsForTeam;

  if (isWide) {
    match.extras.wides = (match.extras.wides || 0) + 1 + runs;
  }
  if (isNoBall) {
    match.extras.noBalls = (match.extras.noBalls || 0) + 1;
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
    match.score.wickets = (match.score.wickets || 0) + 1;
    bowler.wickets = (bowler.wickets || 0) + 1;
    match.striker = null;
  }

  match.currentOverEvents.push({
    label: buildLabel({ wicket, extra, runs }),
    runs,
    extra: extra || null,
    wicket: !!wicket,
  });

  if (!wicket && runs % 2 === 1) {
    const tmp = match.striker;
    match.striker = match.nonStriker;
    match.nonStriker = tmp;
  }

  if (isLegalBall) {
    match.score.balls = (match.score.balls || 0) + 1;
    match.score.overs = ballsToOvers(match.score.balls);

    if (bowler.balls % BALLS_PER_OVER === 0) {
      if (bowler.runsInCurrentOver === 0) {
        bowler.maidens = (bowler.maidens || 0) + 1;
      }
      bowler.runsInCurrentOver = 0;

      const tmpS = match.striker;
      match.striker = match.nonStriker;
      match.nonStriker = tmpS;

      match.lastOverBowler = match.currentBowler;
      match.currentBowler = null;
      match.currentOverEvents = [];
    }
  }

  const allOut = match.score.wickets >= MAX_WICKETS;
  const oversDone =
    typeof match.overs === 'number' &&
    match.score.balls >= match.overs * BALLS_PER_OVER;

  if (allOut || oversDone) {
    match.status = 'completed';
    match.result = allOut
      ? `${teamNameOf(match, match.battingTeam)} all out for ${match.score.runs}`
      : `${teamNameOf(match, match.battingTeam)} ${match.score.runs}/${match.score.wickets} in ${match.score.overs} overs`;
    match.striker = null;
    match.nonStriker = null;
    match.currentBowler = null;
  }

  return match.save();
};

const teamNameOf = (match, key) =>
  key === 'teamA' ? match.teamA : match.teamB;

const setNewBatsman = async (match, name) => {
  ensureBatsmanEntry(match, name);
  if (!match.striker) {
    match.striker = name;
  } else if (!match.nonStriker) {
    match.nonStriker = name;
  }
  return match.save();
};

const setNewBowler = async (match, name) => {
  ensureBowlerEntry(match, name);
  match.currentBowler = name;
  return match.save();
};

module.exports = {
  findMissingTeams,
  createMatch,
  getAllMatches,
  getMatchById,
  setupMatch,
  applyScoreUpdate,
  setNewBatsman,
  setNewBowler,
  getBattingTeamPlayers,
  getBowlingTeamPlayers,
  MAX_WICKETS,
};
