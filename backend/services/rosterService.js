const mongoose = require('mongoose');

const Player = require('../models/Player');
const Team = require('../models/Team');

/**
 * Create a single roster player. Trims the name and rejects duplicates.
 */
const createPlayer = async (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    const err = new Error('Player name is required');
    err.status = 400;
    throw err;
  }
  const existing = await Player.findOne({ name: trimmed });
  if (existing) {
    const err = new Error(`Player "${trimmed}" already exists`);
    err.status = 409;
    throw err;
  }
  const player = new Player({ name: trimmed });
  return player.save();
};

/**
 * Upsert a list of player names into the roster, ignoring duplicates /
 * empty entries. Safe to call from team-create flows so the catalog stays
 * in sync when users type names free-form.
 */
const ensurePlayers = async (names = []) => {
  const uniq = Array.from(
    new Set(
      (names || [])
        .map((n) => (typeof n === 'string' ? n.trim() : ''))
        .filter(Boolean)
    )
  );
  if (uniq.length === 0) return [];
  const ops = uniq.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name } },
      upsert: true,
    },
  }));
  await Player.bulkWrite(ops, { ordered: false });
  return uniq;
};

/**
 * List every roster player along with the teams that currently have them.
 */
const listWithTeams = async () => {
  const [players, teams] = await Promise.all([
    Player.find().sort({ name: 1 }).lean(),
    Team.find().select('name players').lean(),
  ]);

  const membership = new Map();
  teams.forEach((t) => {
    (t.players || []).forEach((p) => {
      if (!membership.has(p)) membership.set(p, []);
      membership.get(p).push({ _id: t._id, name: t.name });
    });
  });

  return players.map((p) => ({
    _id: p._id,
    name: p.name,
    createdAt: p.createdAt,
    teams: membership.get(p.name) || [],
  }));
};

const getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Player.findById(id);
};

const deletePlayer = async (player) => {
  await Player.deleteOne({ _id: player._id });
  return player;
};

const findTeamsForPlayer = async (name) => {
  return Team.find({ players: name }).select('_id name');
};

module.exports = {
  createPlayer,
  ensurePlayers,
  listWithTeams,
  getById,
  deletePlayer,
  findTeamsForPlayer,
};
