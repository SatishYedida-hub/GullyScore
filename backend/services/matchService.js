const mongoose = require('mongoose');

const Match = require('../models/Match');
const Team = require('../models/Team');
const { advanceOver, isExtra } = require('../utils/cricket');

const MAX_WICKETS = 10;

const findMissingTeams = async (names) => {
  const existing = await Team.find({ name: { $in: names } }).select('name');
  const existingNames = new Set(existing.map((t) => t.name));
  return names.filter((n) => !existingNames.has(n));
};

const createMatch = async ({ teamA, teamB, overs }) => {
  const match = new Match({
    teamA,
    teamB,
    overs,
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

const applyScoreUpdate = async (match, { runs, wicket, extra }) => {
  const extraBall = isExtra(extra);
  const extraPenalty = extraBall ? 1 : 0;

  match.score.runs = (match.score.runs || 0) + runs + extraPenalty;

  if (wicket) {
    match.score.wickets = (match.score.wickets || 0) + 1;
  }

  if (!extraBall) {
    match.score.overs = advanceOver(match.score.overs || 0);
  }

  const allOut = match.score.wickets >= MAX_WICKETS;
  const oversDone =
    typeof match.overs === 'number' && match.score.overs >= match.overs;

  if (allOut || oversDone) {
    match.status = 'completed';
  }

  return match.save();
};

module.exports = {
  findMissingTeams,
  createMatch,
  getAllMatches,
  getMatchById,
  applyScoreUpdate,
  MAX_WICKETS,
};
