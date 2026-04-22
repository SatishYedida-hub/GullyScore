const Team = require('../models/Team');

const createTeam = async ({ name, players = [] }) => {
  const team = new Team({ name, players });
  return team.save();
};

const getAllTeams = async () => {
  return Team.find().sort({ createdAt: -1 });
};

module.exports = {
  createTeam,
  getAllTeams,
};
