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
    const { teamA, teamB, overs, battingTeam } = req.body || {};

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

    if (
      battingTeam !== undefined &&
      battingTeam !== 'teamA' &&
      battingTeam !== 'teamB'
    ) {
      return next(
        httpError(400, "battingTeam must be either 'teamA' or 'teamB'")
      );
    }

    const missing = await matchService.findMissingTeams([nameA, nameB]);
    if (missing.length > 0) {
      return next(httpError(400, `Team(s) not found: ${missing.join(', ')}`));
    }

    const match = await matchService.createMatch({
      teamA: nameA,
      teamB: nameB,
      overs,
      battingTeam: battingTeam || 'teamA',
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

exports.setupMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { striker, nonStriker, bowler } = req.body || {};

    if (!striker || typeof striker !== 'string' || !striker.trim()) {
      return next(httpError(400, 'striker is required'));
    }
    if (!nonStriker || typeof nonStriker !== 'string' || !nonStriker.trim()) {
      return next(httpError(400, 'nonStriker is required'));
    }
    if (!bowler || typeof bowler !== 'string' || !bowler.trim()) {
      return next(httpError(400, 'bowler is required'));
    }
    if (striker.trim() === nonStriker.trim()) {
      return next(httpError(400, 'striker and nonStriker must be different'));
    }

    const match = await matchService.getMatchById(id);
    if (!match) {
      return next(httpError(404, 'Match not found'));
    }
    if (match.status !== 'setup') {
      return next(httpError(400, 'Match has already been set up'));
    }

    const batPlayers = matchService.getBattingTeamPlayers(match);
    const bowlPlayers = matchService.getBowlingTeamPlayers(match);

    if (!batPlayers.includes(striker)) {
      return next(
        httpError(400, `${striker} is not in the batting team`)
      );
    }
    if (!batPlayers.includes(nonStriker)) {
      return next(
        httpError(400, `${nonStriker} is not in the batting team`)
      );
    }
    if (!bowlPlayers.includes(bowler)) {
      return next(
        httpError(400, `${bowler} is not in the bowling team`)
      );
    }

    const updated = await matchService.setupMatch(match, {
      striker,
      nonStriker,
      bowler,
    });

    return res.status(200).json({
      message: 'Match set up successfully',
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.status = 400;
    }
    return next(error);
  }
};

exports.updateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { runs, wicket, extra, howOut } = req.body || {};

    if (typeof runs !== 'number' || !Number.isInteger(runs) || runs < 0) {
      return next(httpError(400, 'runs must be a non-negative integer'));
    }
    if (runs > MAX_RUNS_PER_BALL) {
      return next(
        httpError(
          400,
          `runs cannot exceed ${MAX_RUNS_PER_BALL} on a single delivery`
        )
      );
    }

    if (typeof wicket !== 'boolean') {
      return next(httpError(400, 'wicket must be a boolean'));
    }

    if (extra !== undefined && extra !== null && !isExtra(extra)) {
      return next(
        httpError(400, "extra must be either 'wide' or 'no-ball'")
      );
    }

    const match = await matchService.getMatchById(id);
    if (!match) {
      return next(httpError(404, 'Match not found'));
    }

    if (match.status === 'completed') {
      return next(httpError(400, 'Match is already completed'));
    }
    if (match.status === 'setup') {
      return next(
        httpError(400, 'Match is not set up. Pick openers and bowler first.')
      );
    }
    if (!match.striker || !match.nonStriker) {
      return next(
        httpError(400, 'A batsman is missing. Add the new batsman first.')
      );
    }
    if (!match.currentBowler) {
      return next(
        httpError(400, 'No bowler is set. Pick the next bowler first.')
      );
    }

    if (wicket && match.score.wickets >= matchService.MAX_WICKETS) {
      return next(httpError(400, 'All wickets are already down'));
    }

    const updated = await matchService.applyScoreUpdate(match, {
      runs,
      wicket,
      extra,
      howOut,
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

exports.newBatsman = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { batsman } = req.body || {};

    if (!batsman || typeof batsman !== 'string' || !batsman.trim()) {
      return next(httpError(400, 'batsman is required'));
    }

    const match = await matchService.getMatchById(id);
    if (!match) return next(httpError(404, 'Match not found'));
    if (match.status !== 'live') {
      return next(httpError(400, 'Match is not live'));
    }
    if (match.striker && match.nonStriker) {
      return next(httpError(400, 'Both batsmen are already at the crease'));
    }

    const batPlayers = matchService.getBattingTeamPlayers(match);
    if (!batPlayers.includes(batsman)) {
      return next(
        httpError(400, `${batsman} is not in the batting team`)
      );
    }
    if (batsman === match.striker || batsman === match.nonStriker) {
      return next(httpError(400, `${batsman} is already batting`));
    }

    const existing = match.batsmen.find((b) => b.name === batsman);
    if (existing && existing.out) {
      return next(httpError(400, `${batsman} is already out`));
    }

    const updated = await matchService.setNewBatsman(match, batsman);
    return res.status(200).json({
      message: 'New batsman added',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

exports.newBowler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bowler } = req.body || {};

    if (!bowler || typeof bowler !== 'string' || !bowler.trim()) {
      return next(httpError(400, 'bowler is required'));
    }

    const match = await matchService.getMatchById(id);
    if (!match) return next(httpError(404, 'Match not found'));
    if (match.status !== 'live') {
      return next(httpError(400, 'Match is not live'));
    }
    if (match.currentBowler) {
      return next(
        httpError(400, 'A bowler is already set for the current over')
      );
    }

    const bowlPlayers = matchService.getBowlingTeamPlayers(match);
    if (!bowlPlayers.includes(bowler)) {
      return next(
        httpError(400, `${bowler} is not in the bowling team`)
      );
    }
    if (bowler === match.lastOverBowler) {
      return next(
        httpError(400, 'Same bowler cannot bowl two consecutive overs')
      );
    }

    const updated = await matchService.setNewBowler(match, bowler);
    return res.status(200).json({
      message: 'Bowler set',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};
