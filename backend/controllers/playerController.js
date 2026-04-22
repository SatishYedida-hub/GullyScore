const playerService = require('../services/playerService');

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.getPlayers = async (req, res, next) => {
  try {
    const players = await playerService.aggregateAll();
    return res.status(200).json({
      count: players.length,
      data: players,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPlayerByName = async (req, res, next) => {
  try {
    const raw = req.params.name || '';
    const name = decodeURIComponent(raw).trim();
    if (!name) return next(httpError(400, 'Player name is required'));

    const player = await playerService.aggregateOne(name);

    const hasBatting = player.batting.innings > 0;
    const hasBowling = player.bowling.innings > 0;
    const onRoster = player.teams.length > 0;

    if (!hasBatting && !hasBowling && !onRoster) {
      return next(httpError(404, `Player "${name}" not found`));
    }

    return res.status(200).json({ data: player });
  } catch (error) {
    return next(error);
  }
};
