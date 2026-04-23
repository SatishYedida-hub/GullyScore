const Match = require('../models/Match');
const Team = require('../models/Team');
const Player = require('../models/Player');
const { ballsToOvers, BALLS_PER_OVER } = require('../utils/cricket');

/**
 * Build empty career-stat blocks.
 */
const emptyBatting = () => ({
  matches: 0,
  innings: 0,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  notOuts: 0,
  highest: 0,
  highestNotOut: false,
});

const emptyBowling = () => ({
  matches: 0,
  innings: 0,
  balls: 0,
  runs: 0,
  wickets: 0,
  maidens: 0,
  bestWickets: 0,
  bestRuns: Infinity,
});

/**
 * Merge a single innings's batting line into the career batting totals.
 */
const addBattingInnings = (acc, b, matchId, matchSet) => {
  acc.innings += 1;
  if (!matchSet.has(matchId)) {
    matchSet.add(matchId);
    acc.matches += 1;
  }
  acc.runs += b.runs || 0;
  acc.balls += b.balls || 0;
  acc.fours += b.fours || 0;
  acc.sixes += b.sixes || 0;

  const notOut = !b.out;
  if (notOut && (b.balls || 0) > 0) acc.notOuts += 1;

  const r = b.runs || 0;
  if (
    r > acc.highest ||
    (r === acc.highest && notOut && !acc.highestNotOut)
  ) {
    acc.highest = r;
    acc.highestNotOut = notOut;
  }
};

/**
 * Merge a single innings's bowling line into the career bowling totals.
 */
const addBowlingInnings = (acc, bw, matchId, matchSet) => {
  // Skip bowlers that never bowled a ball (e.g. got swapped out before starting).
  if (!bw.balls && !bw.wickets && !bw.runs) return;

  acc.innings += 1;
  if (!matchSet.has(matchId)) {
    matchSet.add(matchId);
    acc.matches += 1;
  }
  acc.balls += bw.balls || 0;
  acc.runs += bw.runs || 0;
  acc.wickets += bw.wickets || 0;
  acc.maidens += bw.maidens || 0;

  const w = bw.wickets || 0;
  const r = bw.runs || 0;
  if (w > acc.bestWickets || (w === acc.bestWickets && r < acc.bestRuns)) {
    acc.bestWickets = w;
    acc.bestRuns = r;
  }
};

const num = (v, fallback = '—') => (Number.isFinite(v) ? v : fallback);

const finalizeBatting = (b) => {
  const inningsOut = b.innings - b.notOuts;
  const average = inningsOut > 0 ? b.runs / inningsOut : null;
  const strikeRate = b.balls > 0 ? (b.runs * 100) / b.balls : null;
  return {
    matches: b.matches,
    innings: b.innings,
    runs: b.runs,
    balls: b.balls,
    fours: b.fours,
    sixes: b.sixes,
    notOuts: b.notOuts,
    highest: b.highest,
    highestNotOut: b.highestNotOut,
    highestDisplay: b.highest
      ? `${b.highest}${b.highestNotOut ? '*' : ''}`
      : '0',
    average: average !== null ? Number(average.toFixed(2)) : null,
    strikeRate: strikeRate !== null ? Number(strikeRate.toFixed(2)) : null,
  };
};

const finalizeBowling = (bw) => {
  const average = bw.wickets > 0 ? bw.runs / bw.wickets : null;
  const economy = bw.balls > 0 ? (bw.runs * 6) / bw.balls : null;
  const strikeRate = bw.wickets > 0 ? bw.balls / bw.wickets : null;
  return {
    matches: bw.matches,
    innings: bw.innings,
    balls: bw.balls,
    overs: ballsToOvers(bw.balls),
    runs: bw.runs,
    wickets: bw.wickets,
    maidens: bw.maidens,
    best:
      bw.bestWickets > 0
        ? `${bw.bestWickets}/${num(bw.bestRuns, 0)}`
        : '—',
    average: average !== null ? Number(average.toFixed(2)) : null,
    economy: economy !== null ? Number(economy.toFixed(2)) : null,
    strikeRate: strikeRate !== null ? Number(strikeRate.toFixed(2)) : null,
  };
};

/**
 * Build a per-player registry: roster info (which teams they belong to) plus
 * the running career batting/bowling totals.
 */
const buildRegistry = async () => {
  const [teams, rosterPlayers] = await Promise.all([
    Team.find().select('name players'),
    Player.find().select('name photo'),
  ]);
  const registry = new Map();

  const ensure = (name) => {
    if (!registry.has(name)) {
      registry.set(name, {
        name,
        photo: '',
        teams: new Set(),
        batting: emptyBatting(),
        bowling: emptyBowling(),
        battingMatchSet: new Set(),
        bowlingMatchSet: new Set(),
      });
    }
    return registry.get(name);
  };

  // Seed from the standalone roster so pool-only players still appear,
  // and pull in profile photos where available.
  rosterPlayers.forEach((p) => {
    const entry = ensure(p.name);
    if (p.photo) entry.photo = p.photo;
  });

  teams.forEach((t) => {
    (t.players || []).forEach((p) => {
      ensure(p).teams.add(t.name);
    });
  });

  return { registry, ensure };
};

const aggregateAll = async () => {
  const { registry, ensure } = await buildRegistry();

  const matches = await Match.find({ 'innings.0': { $exists: true } }).lean();

  matches.forEach((m) => {
    const mid = String(m._id);
    (m.innings || []).forEach((inn) => {
      (inn.batsmen || []).forEach((b) => {
        if (!b || !b.name) return;
        const p = ensure(b.name);
        addBattingInnings(p.batting, b, mid, p.battingMatchSet);
      });
      (inn.bowlers || []).forEach((bw) => {
        if (!bw || !bw.name) return;
        const p = ensure(bw.name);
        addBowlingInnings(p.bowling, bw, mid, p.bowlingMatchSet);
      });
    });
  });

  return Array.from(registry.values()).map((p) => ({
    name: p.name,
    photo: p.photo || '',
    teams: Array.from(p.teams).sort(),
    batting: finalizeBatting(p.batting),
    bowling: finalizeBowling(p.bowling),
  }));
};

const aggregateOne = async (name) => {
  const { registry, ensure } = await buildRegistry();
  ensure(name);

  const matches = await Match.find({ 'innings.0': { $exists: true } })
    .sort({ createdAt: -1 })
    .lean();

  const matchHistory = [];

  matches.forEach((m) => {
    const mid = String(m._id);
    let appeared = false;
    let battingLine = null;
    let bowlingLine = null;

    (m.innings || []).forEach((inn) => {
      (inn.batsmen || []).forEach((b) => {
        if (!b || b.name !== name) return;
        appeared = true;
        if (!battingLine) battingLine = b;
        const p = ensure(b.name);
        addBattingInnings(p.batting, b, mid, p.battingMatchSet);
      });
      (inn.bowlers || []).forEach((bw) => {
        if (!bw || bw.name !== name) return;
        if (bw.balls || bw.wickets || bw.runs) appeared = true;
        if (!bowlingLine) bowlingLine = bw;
        const p = ensure(bw.name);
        addBowlingInnings(p.bowling, bw, mid, p.bowlingMatchSet);
      });
    });

    if (appeared) {
      matchHistory.push({
        matchId: mid,
        teamA: m.teamA,
        teamB: m.teamB,
        teamAPhoto: m.teamAPhoto || '',
        teamBPhoto: m.teamBPhoto || '',
        overs: m.overs,
        status: m.status,
        result: m.result,
        date: m.createdAt,
        batting: battingLine
          ? {
              runs: battingLine.runs || 0,
              balls: battingLine.balls || 0,
              fours: battingLine.fours || 0,
              sixes: battingLine.sixes || 0,
              out: !!battingLine.out,
              howOut: battingLine.howOut || '',
            }
          : null,
        bowling: bowlingLine
          ? {
              balls: bowlingLine.balls || 0,
              overs: ballsToOvers(bowlingLine.balls || 0),
              runs: bowlingLine.runs || 0,
              wickets: bowlingLine.wickets || 0,
              maidens: bowlingLine.maidens || 0,
            }
          : null,
      });
    }
  });

  const p = registry.get(name);
  return {
    name,
    photo: p.photo || '',
    teams: Array.from(p.teams).sort(),
    batting: finalizeBatting(p.batting),
    bowling: finalizeBowling(p.bowling),
    matchHistory,
  };
};

module.exports = {
  aggregateAll,
  aggregateOne,
  BALLS_PER_OVER,
};
