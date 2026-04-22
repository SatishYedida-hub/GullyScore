const mongoose = require('mongoose');

const Team = require('../models/Team');
const Match = require('../models/Match');

const createTeam = async ({ name, players = [] }) => {
  const team = new Team({ name, players });
  return team.save();
};

const getAllTeams = async () => {
  return Team.find().sort({ createdAt: -1 });
};

const getTeamById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Team.findById(id);
};

const findActiveMatchForTeam = async (teamName) => {
  return Match.findOne({
    $and: [
      { $or: [{ teamA: teamName }, { teamB: teamName }] },
      { status: { $ne: 'completed' } },
    ],
  }).select('_id teamA teamB status');
};

const deleteTeam = async (team) => {
  await Team.deleteOne({ _id: team._id });
  return team;
};

const removePlayer = async (team, playerName) => {
  team.players = (team.players || []).filter((p) => p !== playerName);
  return team.save();
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  deleteTeam,
  removePlayer,
  findActiveMatchForTeam,
};
