const mongoose = require('mongoose');

const Team = require('../models/Team');
const Match = require('../models/Match');
const rosterService = require('./rosterService');

const createTeam = async ({ name, players = [] }) => {
  const cleaned = Array.from(
    new Set(
      (players || [])
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean)
    )
  );
  const team = new Team({ name, players: cleaned });
  const saved = await team.save();
  if (cleaned.length > 0) {
    // Keep the global roster in sync so free-form names typed during team
    // creation become reusable players everywhere.
    await rosterService.ensurePlayers(cleaned);
  }
  return saved;
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

/**
 * Add a player name to a team's current lineup. Creates a roster entry on
 * the fly so the player becomes reusable across teams.
 */
/**
 * Set (or clear, when given an empty string) a team's crest photo.
 */
const updateTeamPhoto = async (team, photo) => {
  team.photo = photo || '';
  return team.save();
};

const addPlayer = async (team, playerName) => {
  const trimmed = (playerName || '').trim();
  if (!trimmed) {
    const err = new Error('Player name is required');
    err.status = 400;
    throw err;
  }
  if ((team.players || []).includes(trimmed)) {
    const err = new Error(`${trimmed} is already in "${team.name}"`);
    err.status = 409;
    throw err;
  }
  team.players = [...(team.players || []), trimmed];
  const saved = await team.save();
  await rosterService.ensurePlayers([trimmed]);
  return saved;
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  deleteTeam,
  removePlayer,
  addPlayer,
  updateTeamPhoto,
  findActiveMatchForTeam,
};
