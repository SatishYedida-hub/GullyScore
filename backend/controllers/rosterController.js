const rosterService = require('../services/rosterService');

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.listPlayers = async (req, res, next) => {
  try {
    const players = await rosterService.listWithTeams();
    return res.status(200).json({
      count: players.length,
      data: players,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createPlayer = async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(httpError(400, 'Player name is required'));
    }
    const player = await rosterService.createPlayer(name);
    return res.status(201).json({
      message: `Player "${player.name}" added to the roster`,
      data: {
        _id: player._id,
        name: player.name,
        createdAt: player.createdAt,
        teams: [],
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      error.status = 409;
      error.message = 'Player with that name already exists';
    }
    return next(error);
  }
};

exports.updatePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photo } = req.body || {};
    const { validatePhoto } = require('../utils/photo');

    const err = validatePhoto(photo);
    if (err) return next(httpError(400, err));

    const player = await rosterService.getById(id);
    if (!player) return next(httpError(404, 'Player not found'));

    const updated = await rosterService.updatePlayerPhoto(player, photo || '');
    return res.status(200).json({
      message: photo
        ? `Photo updated for "${player.name}"`
        : `Photo removed for "${player.name}"`,
      data: {
        _id: updated._id,
        name: updated.name,
        photo: updated.photo || '',
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await rosterService.getById(id);
    if (!player) return next(httpError(404, 'Player not found'));

    // Heads-up if they're on a team's current roster — we still allow the
    // delete, but callers can show a friendlier message.
    const teams = await rosterService.findTeamsForPlayer(player.name);

    await rosterService.deletePlayer(player);
    return res.status(200).json({
      message: `Player "${player.name}" removed from the roster`,
      data: { _id: player._id, name: player.name },
      teams: teams.map((t) => ({ _id: t._id, name: t.name })),
    });
  } catch (error) {
    return next(error);
  }
};
