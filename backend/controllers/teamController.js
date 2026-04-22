const teamService = require('../services/teamService');

const sendError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.createTeam = async (req, res, next) => {
  try {
    const { name, players } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(sendError(400, 'Team name is required'));
    }

    if (players !== undefined) {
      if (!Array.isArray(players)) {
        return next(sendError(400, 'players must be an array of strings'));
      }
      if (!players.every((p) => typeof p === 'string')) {
        return next(sendError(400, 'Every player must be a string'));
      }
    }

    const team = await teamService.createTeam({
      name: name.trim(),
      players: players || [],
    });

    return res.status(201).json({
      message: 'Team created successfully',
      data: team,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.status = 400;
    }
    return next(error);
  }
};

exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await teamService.getAllTeams();
    return res.status(200).json({
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    return next(error);
  }
};
