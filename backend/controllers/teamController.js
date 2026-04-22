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

exports.getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await teamService.getTeamById(id);
    if (!team) return next(sendError(404, 'Team not found'));
    return res.status(200).json({ data: team });
  } catch (error) {
    return next(error);
  }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const team = await teamService.getTeamById(id);
    if (!team) return next(sendError(404, 'Team not found'));

    const activeMatch = await teamService.findActiveMatchForTeam(team.name);
    if (activeMatch) {
      return next(
        sendError(
          409,
          `Cannot delete "${team.name}" — it is used in a match that is still ${activeMatch.status}. Finish or delete that match first.`
        )
      );
    }

    await teamService.deleteTeam(team);
    return res.status(200).json({
      message: `Team "${team.name}" deleted`,
      data: { _id: team._id, name: team.name },
    });
  } catch (error) {
    return next(error);
  }
};

exports.removePlayer = async (req, res, next) => {
  try {
    const { id, player } = req.params;
    const playerName = decodeURIComponent(player || '').trim();

    if (!playerName) {
      return next(sendError(400, 'Player name is required'));
    }

    const team = await teamService.getTeamById(id);
    if (!team) return next(sendError(404, 'Team not found'));

    if (!team.players.includes(playerName)) {
      return next(sendError(404, `${playerName} is not in team "${team.name}"`));
    }

    const activeMatch = await teamService.findActiveMatchForTeam(team.name);
    if (activeMatch) {
      return next(
        sendError(
          409,
          `Cannot remove players while "${team.name}" is in a ${activeMatch.status} match. Players already locked into matches are unaffected.`
        )
      );
    }

    const updated = await teamService.removePlayer(team, playerName);
    return res.status(200).json({
      message: `${playerName} removed from "${team.name}"`,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};
