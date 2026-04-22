const matchService = require('../services/matchService');
const { isExtra } = require('../utils/cricket');

const MAX_RUNS_PER_BALL = 7;

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.createMatch = async (req, res, next) => {
  try {
    const { teamA, teamB, overs } = req.body || {};

    if (!teamA || typeof teamA !== 'string' || !teamA.trim()) {
      return next(httpError(400, 'teamA is required'));
    }
    if (!teamB || typeof teamB !== 'string' || !teamB.trim()) {
      return next(httpError(400, 'teamB is required'));
    }

    const nameA = teamA.trim();
    const nameB = teamB.trim();

    if (nameA === nameB) {
      return next(httpError(400, 'teamA and teamB must be different'));
    }

    if (overs !== undefined) {
      if (typeof overs !== 'number' || !Number.isFinite(overs) || overs <= 0) {
        return next(httpError(400, 'overs must be a positive number'));
      }
    }

    const missing = await matchService.findMissingTeams([nameA, nameB]);
    if (missing.length > 0) {
      return next(
        httpError(400, `Team(s) not found: ${missing.join(', ')}`)
      );
    }

    const match = await matchService.createMatch({
      teamA: nameA,
      teamB: nameB,
      overs,
    });

    return res.status(201).json({
      message: 'Match created successfully',
      data: match,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.status = 400;
    }
    return next(error);
  }
};

exports.getMatches = async (req, res, next) => {
  try {
    const matches = await matchService.getAllMatches();
    return res.status(200).json({
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await matchService.getMatchById(id);
    if (!match) {
      return next(httpError(404, 'Match not found'));
    }

    return res.status(200).json({ data: match });
  } catch (error) {
    return next(error);
  }
};

exports.updateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { runs, wicket, extra } = req.body || {};

    if (typeof runs !== 'number' || !Number.isInteger(runs) || runs < 0) {
      return next(httpError(400, 'runs must be a non-negative integer'));
    }
    if (runs > MAX_RUNS_PER_BALL) {
      return next(
        httpError(400, `runs cannot exceed ${MAX_RUNS_PER_BALL} on a single delivery`)
      );
    }

    if (typeof wicket !== 'boolean') {
      return next(httpError(400, 'wicket must be a boolean'));
    }

    if (extra !== undefined && extra !== null && !isExtra(extra)) {
      return next(httpError(400, "extra must be either 'wide' or 'no-ball'"));
    }

    const match = await matchService.getMatchById(id);
    if (!match) {
      return next(httpError(404, 'Match not found'));
    }

    if (match.status === 'completed') {
      return next(httpError(400, 'Match is already completed'));
    }

    if (wicket && match.score.wickets >= matchService.MAX_WICKETS) {
      return next(httpError(400, 'All wickets are already down'));
    }

    const updated = await matchService.applyScoreUpdate(match, {
      runs,
      wicket,
      extra,
    });

    return res.status(200).json({
      message: 'Score updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.status = 400;
    }
    return next(error);
  }
};
